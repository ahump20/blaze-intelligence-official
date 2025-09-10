/**
 * Blaze Intelligence Monitoring & Analytics Configuration
 * Real-time performance tracking and alerting
 */

import winston from 'winston';
import WinstonDailyRotateFile from 'winston-daily-rotate-file';

// Performance metrics collection
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            pageLoads: 0,
            analysisRequests: 0,
            wsConnections: 0,
            apiCalls: 0,
            errors: 0,
            responseTime: []
        };
        
        this.thresholds = {
            responseTime: 1000, // 1 second
            errorRate: 0.05, // 5%
            wsConnections: 1000,
            memoryUsage: 0.90 // 90%
        };
        
        this.alerts = [];
        this.startTime = Date.now();
    }
    
    // Track page load
    trackPageLoad(page, loadTime) {
        this.metrics.pageLoads++;
        this.logEvent('page_load', {
            page,
            loadTime,
            timestamp: Date.now()
        });
        
        if (loadTime > this.thresholds.responseTime) {
            this.createAlert('slow_page_load', {
                page,
                loadTime,
                threshold: this.thresholds.responseTime
            });
        }
    }
    
    // Track analysis request
    trackAnalysis(type, duration, success) {
        this.metrics.analysisRequests++;
        
        this.logEvent('analysis', {
            type,
            duration,
            success,
            timestamp: Date.now()
        });
        
        if (!success) {
            this.metrics.errors++;
            this.checkErrorRate();
        }
    }
    
    // Track WebSocket connection
    trackWebSocket(event, sport) {
        if (event === 'connect') {
            this.metrics.wsConnections++;
        } else if (event === 'disconnect') {
            this.metrics.wsConnections--;
        }
        
        this.logEvent('websocket', {
            event,
            sport,
            activeConnections: this.metrics.wsConnections,
            timestamp: Date.now()
        });
        
        if (this.metrics.wsConnections > this.thresholds.wsConnections) {
            this.createAlert('high_ws_connections', {
                connections: this.metrics.wsConnections,
                threshold: this.thresholds.wsConnections
            });
        }
    }
    
    // Track API call
    trackAPI(endpoint, method, statusCode, responseTime) {
        this.metrics.apiCalls++;
        this.metrics.responseTime.push(responseTime);
        
        this.logEvent('api_call', {
            endpoint,
            method,
            statusCode,
            responseTime,
            timestamp: Date.now()
        });
        
        if (statusCode >= 500) {
            this.metrics.errors++;
            this.checkErrorRate();
        }
        
        if (responseTime > this.thresholds.responseTime) {
            this.createAlert('slow_api', {
                endpoint,
                responseTime,
                threshold: this.thresholds.responseTime
            });
        }
    }
    
    // Check error rate
    checkErrorRate() {
        const totalRequests = this.metrics.apiCalls + this.metrics.analysisRequests;
        const errorRate = this.metrics.errors / totalRequests;
        
        if (errorRate > this.thresholds.errorRate) {
            this.createAlert('high_error_rate', {
                errorRate: (errorRate * 100).toFixed(2) + '%',
                threshold: (this.thresholds.errorRate * 100) + '%',
                errors: this.metrics.errors,
                total: totalRequests
            });
        }
    }
    
    // Track memory usage
    trackMemoryUsage() {
        if (typeof process !== 'undefined' && process.memoryUsage) {
            const usage = process.memoryUsage();
            const heapUsed = usage.heapUsed / usage.heapTotal;
            
            this.logEvent('memory', {
                heapUsed: usage.heapUsed,
                heapTotal: usage.heapTotal,
                rss: usage.rss,
                external: usage.external,
                percentage: (heapUsed * 100).toFixed(2) + '%',
                timestamp: Date.now()
            });
            
            if (heapUsed > this.thresholds.memoryUsage) {
                this.createAlert('high_memory', {
                    usage: (heapUsed * 100).toFixed(2) + '%',
                    threshold: (this.thresholds.memoryUsage * 100) + '%'
                });
            }
        }
    }
    
    // Create alert
    createAlert(type, data) {
        const alert = {
            id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type,
            severity: this.getAlertSeverity(type),
            data,
            timestamp: Date.now(),
            resolved: false
        };
        
        this.alerts.push(alert);
        this.sendAlert(alert);
        
        return alert;
    }
    
    // Get alert severity
    getAlertSeverity(type) {
        const severities = {
            high_error_rate: 'critical',
            high_memory: 'critical',
            high_ws_connections: 'warning',
            slow_api: 'warning',
            slow_page_load: 'info'
        };
        
        return severities[type] || 'info';
    }
    
    // Send alert (webhook, email, etc.)
    async sendAlert(alert) {
        console.error(`🚨 ALERT [${alert.severity.toUpperCase()}]: ${alert.type}`, alert.data);
        
        // Send to monitoring service
        if (process.env.MONITORING_WEBHOOK) {
            try {
                await fetch(process.env.MONITORING_WEBHOOK, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(alert)
                });
            } catch (error) {
                console.error('Failed to send alert:', error);
            }
        }
    }
    
    // Log event
    logEvent(type, data) {
        const event = {
            type,
            data,
            timestamp: Date.now()
        };
        
        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log(`📊 [${type}]`, data);
        }
        
        // Send to analytics service
        this.sendToAnalytics(event);
    }
    
    // Send to analytics service
    async sendToAnalytics(event) {
        // Cloudflare Analytics Engine
        if (typeof PERFORMANCE_METRICS !== 'undefined') {
            PERFORMANCE_METRICS.writeDataPoint({
                blobs: [event.type],
                doubles: Object.values(event.data).filter(v => typeof v === 'number'),
                indexes: [event.type]
            });
        }
        
        // Custom analytics endpoint
        if (process.env.ANALYTICS_ENDPOINT) {
            try {
                await fetch(process.env.ANALYTICS_ENDPOINT, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(event)
                });
            } catch (error) {
                // Silent fail for analytics
            }
        }
    }
    
    // Get current metrics
    getMetrics() {
        const uptime = Date.now() - this.startTime;
        const avgResponseTime = this.metrics.responseTime.length > 0
            ? this.metrics.responseTime.reduce((a, b) => a + b, 0) / this.metrics.responseTime.length
            : 0;
        
        return {
            uptime: Math.floor(uptime / 1000), // seconds
            pageLoads: this.metrics.pageLoads,
            analysisRequests: this.metrics.analysisRequests,
            wsConnections: this.metrics.wsConnections,
            apiCalls: this.metrics.apiCalls,
            errors: this.metrics.errors,
            errorRate: ((this.metrics.errors / (this.metrics.apiCalls + this.metrics.analysisRequests)) * 100).toFixed(2) + '%',
            avgResponseTime: avgResponseTime.toFixed(0) + 'ms',
            activeAlerts: this.alerts.filter(a => !a.resolved).length
        };
    }
    
    // Get health status
    getHealthStatus() {
        const metrics = this.getMetrics();
        const activeAlerts = this.alerts.filter(a => !a.resolved);
        const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
        
        let status = 'healthy';
        if (criticalAlerts.length > 0) {
            status = 'critical';
        } else if (activeAlerts.length > 0) {
            status = 'warning';
        }
        
        return {
            status,
            metrics,
            alerts: activeAlerts,
            timestamp: Date.now()
        };
    }
    
    // Start monitoring
    start() {
        // Check memory every minute
        setInterval(() => this.trackMemoryUsage(), 60000);
        
        // Clean old response times every 5 minutes
        setInterval(() => {
            if (this.metrics.responseTime.length > 1000) {
                this.metrics.responseTime = this.metrics.responseTime.slice(-1000);
            }
        }, 300000);
        
        console.log('🔍 Performance monitoring started');
    }
}

// Logger configuration
const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.errors({ stack: true }),
        winston.format.json()
    ),
    defaultMeta: { 
        service: 'blaze-neural-coach',
        environment: process.env.NODE_ENV || 'development'
    },
    transports: [
        // Error logs
        new WinstonDailyRotateFile({
            filename: 'logs/error-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'error',
            maxSize: '20m',
            maxFiles: '14d'
        }),
        
        // Combined logs
        new WinstonDailyRotateFile({
            filename: 'logs/combined-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            maxSize: '20m',
            maxFiles: '14d'
        }),
        
        // Performance logs
        new WinstonDailyRotateFile({
            filename: 'logs/performance-%DATE%.log',
            datePattern: 'YYYY-MM-DD',
            level: 'info',
            maxSize: '20m',
            maxFiles: '7d',
            format: winston.format.combine(
                winston.format.timestamp(),
                winston.format.json()
            )
        })
    ]
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
        format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple()
        )
    }));
}

// Analytics tracker for browser
class BrowserAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.events = [];
        this.startTime = Date.now();
    }
    
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    // Track page view
    trackPageView(page) {
        this.track('page_view', {
            page,
            referrer: document.referrer,
            userAgent: navigator.userAgent
        });
    }
    
    // Track user action
    trackAction(action, category, label, value) {
        this.track('user_action', {
            action,
            category,
            label,
            value
        });
    }
    
    // Track video analysis
    trackVideoAnalysis(sport, duration) {
        this.track('video_analysis', {
            sport,
            duration,
            sessionDuration: Date.now() - this.startTime
        });
    }
    
    // Track error
    trackError(error, context) {
        this.track('error', {
            message: error.message,
            stack: error.stack,
            context
        });
    }
    
    // Track performance
    trackPerformance() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            const domReady = timing.domContentLoadedEventEnd - timing.navigationStart;
            const firstPaint = performance.getEntriesByType('paint')[0]?.startTime || 0;
            
            this.track('performance', {
                loadTime,
                domReady,
                firstPaint,
                connectionType: navigator.connection?.effectiveType
            });
        }
    }
    
    // Core tracking function
    track(eventType, data) {
        const event = {
            sessionId: this.sessionId,
            eventType,
            data,
            timestamp: Date.now(),
            url: window.location.href
        };
        
        this.events.push(event);
        
        // Send to server
        this.sendToServer(event);
    }
    
    // Send event to server
    async sendToServer(event) {
        try {
            await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(event)
            });
        } catch (error) {
            console.error('Failed to send analytics:', error);
        }
    }
    
    // Get session stats
    getSessionStats() {
        return {
            sessionId: this.sessionId,
            duration: Date.now() - this.startTime,
            eventCount: this.events.length,
            events: this.events
        };
    }
}

// Export for use in Node.js and browser
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        PerformanceMonitor,
        logger,
        BrowserAnalytics
    };
} else if (typeof window !== 'undefined') {
    window.BlazeAnalytics = BrowserAnalytics;
    
    // Auto-initialize browser analytics
    window.blazeAnalytics = new BrowserAnalytics();
    
    // Track page load
    window.addEventListener('load', () => {
        window.blazeAnalytics.trackPerformance();
        window.blazeAnalytics.trackPageView(window.location.pathname);
    });
    
    // Track errors
    window.addEventListener('error', (event) => {
        window.blazeAnalytics.trackError(event.error, 'window_error');
    });
    
    // Track unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        window.blazeAnalytics.trackError(
            new Error(event.reason),
            'unhandled_rejection'
        );
    });
}