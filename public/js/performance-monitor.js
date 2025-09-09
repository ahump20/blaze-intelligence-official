// Performance Monitoring and SLO Tracking
// Tracks Core Web Vitals, API latency, and error budgets

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            FCP: 0,  // First Contentful Paint
            LCP: 0,  // Largest Contentful Paint
            FID: 0,  // First Input Delay
            CLS: 0,  // Cumulative Layout Shift
            TTFB: 0, // Time to First Byte
            INP: 0   // Interaction to Next Paint
        };
        
        // SLO targets (in milliseconds)
        this.sloTargets = {
            FCP: 1800,   // 1.8s
            LCP: 2500,   // 2.5s
            FID: 100,    // 100ms
            CLS: 0.1,    // 0.1 score
            TTFB: 800,   // 800ms
            INP: 200,    // 200ms
            apiLatency: 100,  // 100ms for API calls
            availability: 0.999 // 99.9% uptime
        };
        
        // Error budget tracking
        this.errorBudget = {
            total: 43.2,  // Minutes per month (99.9% = 43.2 minutes)
            consumed: 0,
            remaining: 43.2,
            incidents: []
        };
        
        // Real User Monitoring (RUM) data
        this.rumData = {
            sessions: 0,
            errors: 0,
            slowRequests: 0,
            deviceTypes: {},
            browsers: {}
        };
        
        this.init();
    }
    
    init() {
        this.observeWebVitals();
        this.trackAPIPerformance();
        this.monitorErrors();
        this.setupRUM();
        this.initializeReporting();
    }
    
    observeWebVitals() {
        // Observe FCP (First Contentful Paint)
        if ('PerformanceObserver' in window) {
            try {
                const fcpObserver = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (entry.name === 'first-contentful-paint') {
                            this.metrics.FCP = entry.startTime;
                            this.checkSLO('FCP', entry.startTime);
                        }
                    }
                });
                fcpObserver.observe({ entryTypes: ['paint'] });
            } catch (e) {
                console.warn('FCP observer failed:', e);
            }
            
            // Observe LCP (Largest Contentful Paint)
            try {
                const lcpObserver = new PerformanceObserver((entryList) => {
                    const entries = entryList.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.metrics.LCP = lastEntry.renderTime || lastEntry.loadTime;
                    this.checkSLO('LCP', this.metrics.LCP);
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {
                console.warn('LCP observer failed:', e);
            }
            
            // Observe FID (First Input Delay)
            try {
                const fidObserver = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (entry.entryType === 'first-input') {
                            this.metrics.FID = entry.processingStart - entry.startTime;
                            this.checkSLO('FID', this.metrics.FID);
                        }
                    }
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {
                console.warn('FID observer failed:', e);
            }
            
            // Observe CLS (Cumulative Layout Shift)
            let clsValue = 0;
            let clsEntries = [];
            
            try {
                const clsObserver = new PerformanceObserver((entryList) => {
                    for (const entry of entryList.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                            clsEntries.push(entry);
                        }
                    }
                    this.metrics.CLS = clsValue;
                    this.checkSLO('CLS', clsValue);
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (e) {
                console.warn('CLS observer failed:', e);
            }
        }
        
        // Observe TTFB
        if (performance.timing) {
            this.metrics.TTFB = performance.timing.responseStart - performance.timing.navigationStart;
            this.checkSLO('TTFB', this.metrics.TTFB);
        }
    }
    
    trackAPIPerformance() {
        // Intercept fetch to track API performance
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            const requestId = this.generateRequestId();
            
            try {
                const response = await originalFetch(...args);
                const duration = performance.now() - startTime;
                
                this.logAPICall({
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    status: response.status,
                    duration: duration,
                    requestId: requestId
                });
                
                // Check SLO
                if (duration > this.sloTargets.apiLatency) {
                    this.recordSLOViolation('apiLatency', duration);
                    this.rumData.slowRequests++;
                }
                
                return response;
            } catch (error) {
                const duration = performance.now() - startTime;
                
                this.logAPICall({
                    url: args[0],
                    method: args[1]?.method || 'GET',
                    status: 0,
                    duration: duration,
                    error: error.message,
                    requestId: requestId
                });
                
                this.recordIncident('API Error', error.message);
                throw error;
            }
        };
        
        // Track XHR requests as well
        this.trackXHRRequests();
    }
    
    trackXHRRequests() {
        const originalOpen = XMLHttpRequest.prototype.open;
        const originalSend = XMLHttpRequest.prototype.send;
        
        XMLHttpRequest.prototype.open = function(method, url, ...rest) {
            this._startTime = performance.now();
            this._method = method;
            this._url = url;
            return originalOpen.apply(this, [method, url, ...rest]);
        };
        
        XMLHttpRequest.prototype.send = function(...args) {
            this.addEventListener('loadend', () => {
                const duration = performance.now() - this._startTime;
                
                window.performanceMonitor?.logAPICall({
                    url: this._url,
                    method: this._method,
                    status: this.status,
                    duration: duration
                });
            });
            
            return originalSend.apply(this, args);
        };
    }
    
    monitorErrors() {
        // Global error handler
        window.addEventListener('error', (event) => {
            this.recordError({
                type: 'javascript',
                message: event.message,
                source: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.recordError({
                type: 'unhandled_promise',
                message: event.reason?.message || event.reason,
                stack: event.reason?.stack
            });
        });
    }
    
    setupRUM() {
        // Track session
        this.rumData.sessions++;
        
        // Track device type
        const isMobile = /Mobile|Android|iPhone/i.test(navigator.userAgent);
        const deviceType = isMobile ? 'mobile' : 'desktop';
        this.rumData.deviceTypes[deviceType] = (this.rumData.deviceTypes[deviceType] || 0) + 1;
        
        // Track browser
        const browser = this.detectBrowser();
        this.rumData.browsers[browser] = (this.rumData.browsers[browser] || 0) + 1;
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.logEvent('page_hidden', { duration: performance.now() });
            } else {
                this.logEvent('page_visible', {});
            }
        });
        
        // Track rage clicks
        this.trackRageClicks();
    }
    
    trackRageClicks() {
        let clickCount = 0;
        let lastClickTime = 0;
        let lastTarget = null;
        
        document.addEventListener('click', (event) => {
            const now = Date.now();
            const target = event.target;
            
            if (target === lastTarget && now - lastClickTime < 500) {
                clickCount++;
                
                if (clickCount >= 3) {
                    this.logEvent('rage_click', {
                        element: target.tagName,
                        id: target.id,
                        class: target.className,
                        count: clickCount
                    });
                    clickCount = 0;
                }
            } else {
                clickCount = 1;
                lastTarget = target;
            }
            
            lastClickTime = now;
        });
    }
    
    checkSLO(metric, value) {
        const target = this.sloTargets[metric];
        
        if (value > target) {
            console.warn(`⚠️ SLO violation: ${metric} = ${value}ms (target: ${target}ms)`);
            this.recordSLOViolation(metric, value);
        } else {
            console.log(`✅ SLO met: ${metric} = ${value}ms (target: ${target}ms)`);
        }
    }
    
    recordSLOViolation(metric, value) {
        const violation = {
            metric: metric,
            value: value,
            target: this.sloTargets[metric],
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        // Send to analytics
        this.sendToAnalytics('slo_violation', violation);
        
        // Update error budget
        this.consumeErrorBudget(1); // 1 minute per violation
    }
    
    recordIncident(type, details) {
        const incident = {
            type: type,
            details: details,
            timestamp: Date.now(),
            resolved: false
        };
        
        this.errorBudget.incidents.push(incident);
        this.consumeErrorBudget(5); // 5 minutes per incident
        
        // Alert if error budget is low
        if (this.errorBudget.remaining < 10) {
            console.error('🚨 Error budget critically low:', this.errorBudget.remaining, 'minutes remaining');
            this.sendAlert('error_budget_critical', this.errorBudget);
        }
    }
    
    consumeErrorBudget(minutes) {
        this.errorBudget.consumed += minutes;
        this.errorBudget.remaining = Math.max(0, this.errorBudget.total - this.errorBudget.consumed);
    }
    
    recordError(error) {
        this.rumData.errors++;
        
        const errorData = {
            ...error,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId()
        };
        
        console.error('🔥 Error recorded:', errorData);
        this.sendToAnalytics('error', errorData);
    }
    
    logAPICall(data) {
        const apiLog = {
            ...data,
            timestamp: Date.now(),
            sessionId: this.getSessionId()
        };
        
        // Store in local buffer for batching
        this.bufferAPILog(apiLog);
        
        // Log slow requests
        if (data.duration > this.sloTargets.apiLatency) {
            console.warn(`🐌 Slow API call: ${data.url} took ${data.duration}ms`);
        }
    }
    
    bufferAPILog(log) {
        const buffer = JSON.parse(localStorage.getItem('api_logs') || '[]');
        buffer.push(log);
        
        // Keep only last 100 logs
        if (buffer.length > 100) {
            buffer.shift();
        }
        
        localStorage.setItem('api_logs', JSON.stringify(buffer));
        
        // Send batch every 10 logs
        if (buffer.length % 10 === 0) {
            this.flushAPILogs();
        }
    }
    
    flushAPILogs() {
        const buffer = JSON.parse(localStorage.getItem('api_logs') || '[]');
        
        if (buffer.length > 0) {
            this.sendToAnalytics('api_logs', buffer);
            localStorage.setItem('api_logs', '[]');
        }
    }
    
    logEvent(eventName, data) {
        const event = {
            name: eventName,
            data: data,
            timestamp: Date.now(),
            sessionId: this.getSessionId()
        };
        
        console.log(`📊 Event: ${eventName}`, data);
        this.sendToAnalytics('event', event);
    }
    
    sendToAnalytics(type, data) {
        // Send to analytics endpoint
        if (navigator.sendBeacon) {
            const payload = JSON.stringify({
                type: type,
                data: data,
                timestamp: Date.now()
            });
            
            navigator.sendBeacon('/api/analytics', payload);
        } else {
            // Fallback to fetch
            fetch('/api/analytics', {
                method: 'POST',
                body: JSON.stringify({ type, data }),
                headers: { 'Content-Type': 'application/json' },
                keepalive: true
            }).catch(err => {
                console.error('Analytics send failed:', err);
            });
        }
    }
    
    sendAlert(type, data) {
        // Send critical alerts
        console.error(`🚨 ALERT: ${type}`, data);
        
        // Could integrate with PagerDuty, Slack, etc.
        this.sendToAnalytics('alert', { type, data });
    }
    
    detectBrowser() {
        const ua = navigator.userAgent;
        
        if (ua.includes('Chrome')) return 'Chrome';
        if (ua.includes('Safari')) return 'Safari';
        if (ua.includes('Firefox')) return 'Firefox';
        if (ua.includes('Edge')) return 'Edge';
        
        return 'Other';
    }
    
    generateRequestId() {
        return 'req_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    getSessionId() {
        let sessionId = sessionStorage.getItem('session_id');
        
        if (!sessionId) {
            sessionId = 'sess_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            sessionStorage.setItem('session_id', sessionId);
        }
        
        return sessionId;
    }
    
    initializeReporting() {
        // Send metrics every 30 seconds
        setInterval(() => {
            this.reportMetrics();
        }, 30000);
        
        // Send final metrics on page unload
        window.addEventListener('beforeunload', () => {
            this.reportMetrics(true);
            this.flushAPILogs();
        });
    }
    
    reportMetrics(immediate = false) {
        const report = {
            metrics: this.metrics,
            rum: this.rumData,
            errorBudget: this.errorBudget,
            timestamp: Date.now(),
            url: window.location.href,
            sessionId: this.getSessionId()
        };
        
        console.log('📈 Performance Report:', report);
        
        if (immediate) {
            // Use sendBeacon for immediate send on unload
            if (navigator.sendBeacon) {
                navigator.sendBeacon('/api/performance', JSON.stringify(report));
            }
        } else {
            this.sendToAnalytics('performance', report);
        }
    }
    
    // Public API
    getMetrics() {
        return this.metrics;
    }
    
    getSLOStatus() {
        const status = {};
        
        Object.keys(this.sloTargets).forEach(metric => {
            if (this.metrics[metric] !== undefined) {
                status[metric] = {
                    value: this.metrics[metric],
                    target: this.sloTargets[metric],
                    passing: this.metrics[metric] <= this.sloTargets[metric]
                };
            }
        });
        
        return status;
    }
    
    getErrorBudget() {
        return this.errorBudget;
    }
    
    getRUMData() {
        return this.rumData;
    }
}

// Auto-initialize
document.addEventListener('DOMContentLoaded', () => {
    window.performanceMonitor = new PerformanceMonitor();
    console.log('📊 Performance Monitor initialized');
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceMonitor;
}