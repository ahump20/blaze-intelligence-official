/**
 * Blaze Intelligence Production Monitoring System
 * Comprehensive monitoring, alerting, and observability
 */

class ProductionMonitoring {
    constructor() {
        this.config = {
            monitoring: {
                interval: 60000, // 1 minute
                metricsRetention: 7 * 24 * 60 * 60 * 1000, // 7 days
                alertThresholds: {
                    errorRate: 0.01, // 1%
                    responseTime: 1000, // 1 second
                    uptime: 0.999, // 99.9%
                    memoryUsage: 0.85, // 85%
                    cpuUsage: 0.80 // 80%
                }
            },
            alerts: {
                channels: ['email', 'slack', 'pagerduty'],
                escalation: {
                    levels: [
                        { severity: 'low', notify: ['email'], delay: 0 },
                        { severity: 'medium', notify: ['email', 'slack'], delay: 300000 },
                        { severity: 'high', notify: ['email', 'slack', 'pagerduty'], delay: 60000 },
                        { severity: 'critical', notify: ['all'], delay: 0 }
                    ]
                }
            },
            services: {
                api: 'https://api.blaze-intelligence.com',
                app: 'https://app.blaze-intelligence.com',
                website: 'https://blaze-intelligence.com',
                database: 'mongodb://db.blaze-intelligence.com',
                cache: 'redis://cache.blaze-intelligence.com'
            },
            logging: {
                level: 'info',
                destination: 'cloudwatch',
                structured: true
            }
        };

        this.metrics = {
            system: {},
            application: {},
            business: {},
            alerts: []
        };

        this.healthChecks = new Map();
        this.incidents = [];
        this.isMonitoring = false;
        
        this.init();
    }

    /**
     * Initialize monitoring system
     */
    async init() {
        try {
            console.log('🔍 Initializing production monitoring...');
            
            // Set up health checks
            this.setupHealthChecks();
            
            // Initialize metrics collection
            this.initializeMetrics();
            
            // Set up alert channels
            this.setupAlertChannels();
            
            // Start monitoring
            this.startMonitoring();
            
            // Set up dashboard
            this.setupDashboard();
            
            console.log('✅ Production monitoring initialized');
            
        } catch (error) {
            console.error('❌ Monitoring initialization failed:', error);
            this.handleCriticalError(error);
        }
    }

    /**
     * Set up health checks for all services
     */
    setupHealthChecks() {
        // API Health Check
        this.healthChecks.set('api', {
            name: 'API Service',
            url: `${this.config.services.api}/health`,
            interval: 30000,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            consecutiveFailures: 0
        });

        // Application Health Check
        this.healthChecks.set('app', {
            name: 'Application',
            url: `${this.config.services.app}/health`,
            interval: 30000,
            timeout: 5000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            consecutiveFailures: 0
        });

        // Website Health Check
        this.healthChecks.set('website', {
            name: 'Marketing Website',
            url: this.config.services.website,
            interval: 60000,
            timeout: 10000,
            retries: 2,
            status: 'unknown',
            lastCheck: null,
            consecutiveFailures: 0
        });

        // Database Health Check
        this.healthChecks.set('database', {
            name: 'Database',
            url: this.config.services.database,
            interval: 30000,
            timeout: 3000,
            retries: 3,
            status: 'unknown',
            lastCheck: null,
            consecutiveFailures: 0
        });

        // Cache Health Check
        this.healthChecks.set('cache', {
            name: 'Redis Cache',
            url: this.config.services.cache,
            interval: 30000,
            timeout: 2000,
            retries: 2,
            status: 'unknown',
            lastCheck: null,
            consecutiveFailures: 0
        });
    }

    /**
     * Initialize metrics collection
     */
    initializeMetrics() {
        // System Metrics
        this.metrics.system = {
            cpu: {
                usage: [],
                loadAverage: []
            },
            memory: {
                used: [],
                free: [],
                percentage: []
            },
            disk: {
                used: [],
                free: [],
                percentage: []
            },
            network: {
                bytesIn: [],
                bytesOut: [],
                errors: []
            }
        };

        // Application Metrics
        this.metrics.application = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                latency: []
            },
            errors: {
                total: 0,
                byType: {},
                rate: 0
            },
            performance: {
                responseTime: [],
                throughput: [],
                concurrency: []
            },
            uptime: {
                current: 0,
                total: 0,
                percentage: 100
            }
        };

        // Business Metrics
        this.metrics.business = {
            users: {
                active: 0,
                new: 0,
                churn: 0
            },
            revenue: {
                mrr: 0,
                arr: 0,
                transactions: []
            },
            engagement: {
                sessions: 0,
                pageViews: 0,
                apiCalls: 0
            }
        };
    }

    /**
     * Start monitoring all services
     */
    startMonitoring() {
        if (this.isMonitoring) return;
        
        this.isMonitoring = true;
        console.log('🚀 Starting production monitoring...');
        
        // Start health checks
        this.healthChecks.forEach((check, service) => {
            this.scheduleHealthCheck(service, check);
        });
        
        // Start metrics collection
        this.metricsInterval = setInterval(() => {
            this.collectMetrics();
        }, this.config.monitoring.interval);
        
        // Start anomaly detection
        this.anomalyInterval = setInterval(() => {
            this.detectAnomalies();
        }, 5 * 60 * 1000); // Every 5 minutes
        
        // Start cleanup old metrics
        this.cleanupInterval = setInterval(() => {
            this.cleanupOldMetrics();
        }, 60 * 60 * 1000); // Every hour
    }

    /**
     * Schedule health check for a service
     */
    scheduleHealthCheck(service, check) {
        const runCheck = async () => {
            try {
                const startTime = Date.now();
                const response = await this.performHealthCheck(check.url, check.timeout);
                const responseTime = Date.now() - startTime;
                
                // Update check status
                check.status = 'healthy';
                check.lastCheck = Date.now();
                check.responseTime = responseTime;
                check.consecutiveFailures = 0;
                
                // Log success
                this.log('info', `Health check passed: ${check.name}`, {
                    service,
                    responseTime,
                    status: response.status
                });
                
            } catch (error) {
                check.consecutiveFailures++;
                
                if (check.consecutiveFailures >= check.retries) {
                    check.status = 'unhealthy';
                    
                    // Create incident
                    this.createIncident({
                        service,
                        type: 'health_check_failure',
                        severity: this.calculateSeverity(service),
                        message: `${check.name} is down`,
                        error: error.message,
                        consecutiveFailures: check.consecutiveFailures
                    });
                }
                
                // Log failure
                this.log('error', `Health check failed: ${check.name}`, {
                    service,
                    error: error.message,
                    consecutiveFailures: check.consecutiveFailures
                });
            }
            
            // Schedule next check
            setTimeout(() => runCheck(), check.interval);
        };
        
        // Start first check
        runCheck();
    }

    /**
     * Perform health check
     */
    async performHealthCheck(url, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Blaze-Monitor/1.0'
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
            
            return response;
            
        } catch (error) {
            clearTimeout(timeoutId);
            throw error;
        }
    }

    /**
     * Collect system and application metrics
     */
    async collectMetrics() {
        try {
            // Collect system metrics
            await this.collectSystemMetrics();
            
            // Collect application metrics
            await this.collectApplicationMetrics();
            
            // Collect business metrics
            await this.collectBusinessMetrics();
            
            // Calculate derived metrics
            this.calculateDerivedMetrics();
            
            // Check thresholds
            this.checkThresholds();
            
        } catch (error) {
            this.log('error', 'Metrics collection failed', { error: error.message });
        }
    }

    /**
     * Collect system metrics
     */
    async collectSystemMetrics() {
        // Simulate system metrics (in production, use actual system APIs)
        const cpu = Math.random() * 100;
        const memory = Math.random() * 100;
        const disk = Math.random() * 100;
        
        // Store metrics with timestamp
        const timestamp = Date.now();
        
        this.metrics.system.cpu.usage.push({ value: cpu, timestamp });
        this.metrics.system.memory.percentage.push({ value: memory, timestamp });
        this.metrics.system.disk.percentage.push({ value: disk, timestamp });
        
        // Trim old data
        const maxDataPoints = 1440; // 24 hours of minute data
        ['cpu.usage', 'memory.percentage', 'disk.percentage'].forEach(metric => {
            const parts = metric.split('.');
            const data = this.metrics.system[parts[0]][parts[1]];
            if (data.length > maxDataPoints) {
                data.splice(0, data.length - maxDataPoints);
            }
        });
    }

    /**
     * Collect application metrics
     */
    async collectApplicationMetrics() {
        // Get performance metrics
        if (typeof window !== 'undefined' && window.performance) {
            const navigation = performance.getEntriesByType('navigation')[0];
            if (navigation) {
                this.metrics.application.performance.responseTime.push({
                    value: navigation.loadEventEnd - navigation.fetchStart,
                    timestamp: Date.now()
                });
            }
        }
        
        // Calculate error rate
        const totalRequests = this.metrics.application.requests.total;
        const errors = this.metrics.application.requests.errors;
        this.metrics.application.errors.rate = totalRequests > 0 ? errors / totalRequests : 0;
        
        // Update uptime
        const now = Date.now();
        const uptimeStart = this.uptimeStart || now;
        this.metrics.application.uptime.current = now - uptimeStart;
        this.metrics.application.uptime.percentage = this.calculateUptimePercentage();
    }

    /**
     * Collect business metrics
     */
    async collectBusinessMetrics() {
        // These would typically come from your database or analytics service
        // Simulating for demonstration
        this.metrics.business.users.active = Math.floor(Math.random() * 1000);
        this.metrics.business.engagement.apiCalls = Math.floor(Math.random() * 10000);
    }

    /**
     * Calculate derived metrics
     */
    calculateDerivedMetrics() {
        // Calculate averages
        const avgResponseTime = this.calculateAverage(
            this.metrics.application.performance.responseTime.slice(-60)
        );
        
        const avgCPU = this.calculateAverage(
            this.metrics.system.cpu.usage.slice(-60)
        );
        
        const avgMemory = this.calculateAverage(
            this.metrics.system.memory.percentage.slice(-60)
        );
        
        // Store calculated metrics
        this.metrics.calculated = {
            avgResponseTime,
            avgCPU,
            avgMemory,
            errorRate: this.metrics.application.errors.rate,
            uptime: this.metrics.application.uptime.percentage
        };
    }

    /**
     * Check thresholds and create alerts
     */
    checkThresholds() {
        const thresholds = this.config.monitoring.alertThresholds;
        const metrics = this.metrics.calculated;
        
        // Check error rate
        if (metrics.errorRate > thresholds.errorRate) {
            this.createAlert({
                type: 'error_rate',
                severity: 'high',
                message: `Error rate exceeded threshold: ${(metrics.errorRate * 100).toFixed(2)}%`,
                threshold: thresholds.errorRate,
                value: metrics.errorRate
            });
        }
        
        // Check response time
        if (metrics.avgResponseTime > thresholds.responseTime) {
            this.createAlert({
                type: 'response_time',
                severity: 'medium',
                message: `Response time exceeded threshold: ${metrics.avgResponseTime}ms`,
                threshold: thresholds.responseTime,
                value: metrics.avgResponseTime
            });
        }
        
        // Check CPU usage
        if (metrics.avgCPU > thresholds.cpuUsage * 100) {
            this.createAlert({
                type: 'cpu_usage',
                severity: 'medium',
                message: `CPU usage exceeded threshold: ${metrics.avgCPU.toFixed(1)}%`,
                threshold: thresholds.cpuUsage * 100,
                value: metrics.avgCPU
            });
        }
        
        // Check memory usage
        if (metrics.avgMemory > thresholds.memoryUsage * 100) {
            this.createAlert({
                type: 'memory_usage',
                severity: 'medium',
                message: `Memory usage exceeded threshold: ${metrics.avgMemory.toFixed(1)}%`,
                threshold: thresholds.memoryUsage * 100,
                value: metrics.avgMemory
            });
        }
    }

    /**
     * Detect anomalies using statistical methods
     */
    detectAnomalies() {
        // Simple anomaly detection using standard deviation
        const checkAnomaly = (data, name) => {
            if (data.length < 10) return;
            
            const values = data.map(d => d.value);
            const mean = values.reduce((a, b) => a + b, 0) / values.length;
            const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
            const stdDev = Math.sqrt(variance);
            
            const latestValue = values[values.length - 1];
            const zScore = Math.abs((latestValue - mean) / stdDev);
            
            if (zScore > 3) {
                this.createAlert({
                    type: 'anomaly',
                    severity: 'low',
                    message: `Anomaly detected in ${name}`,
                    details: {
                        value: latestValue,
                        mean,
                        stdDev,
                        zScore
                    }
                });
            }
        };
        
        // Check for anomalies in key metrics
        checkAnomaly(this.metrics.application.performance.responseTime, 'response time');
        checkAnomaly(this.metrics.system.cpu.usage, 'CPU usage');
        checkAnomaly(this.metrics.system.memory.percentage, 'memory usage');
    }

    /**
     * Create incident
     */
    createIncident(incident) {
        const incidentData = {
            id: `INC-${Date.now()}`,
            timestamp: Date.now(),
            status: 'open',
            ...incident
        };
        
        this.incidents.push(incidentData);
        
        // Send alerts based on severity
        this.sendAlert(incidentData);
        
        // Log incident
        this.log('error', 'Incident created', incidentData);
        
        // Store incident for tracking
        this.storeIncident(incidentData);
    }

    /**
     * Create alert
     */
    createAlert(alert) {
        const alertData = {
            id: `ALERT-${Date.now()}`,
            timestamp: Date.now(),
            ...alert
        };
        
        this.metrics.alerts.push(alertData);
        
        // Check if we should send this alert (deduplication)
        if (this.shouldSendAlert(alertData)) {
            this.sendAlert(alertData);
        }
    }

    /**
     * Send alert through configured channels
     */
    async sendAlert(alert) {
        const escalation = this.config.alerts.escalation.find(
            level => level.severity === alert.severity
        );
        
        if (!escalation) return;
        
        // Delay if configured
        if (escalation.delay > 0) {
            setTimeout(() => this.sendAlertToChannels(alert, escalation.notify), escalation.delay);
        } else {
            this.sendAlertToChannels(alert, escalation.notify);
        }
    }

    /**
     * Send alert to specific channels
     */
    async sendAlertToChannels(alert, channels) {
        for (const channel of channels) {
            try {
                switch (channel) {
                    case 'email':
                        await this.sendEmailAlert(alert);
                        break;
                    case 'slack':
                        await this.sendSlackAlert(alert);
                        break;
                    case 'pagerduty':
                        await this.sendPagerDutyAlert(alert);
                        break;
                }
            } catch (error) {
                this.log('error', `Failed to send alert to ${channel}`, { error: error.message });
            }
        }
    }

    /**
     * Send email alert
     */
    async sendEmailAlert(alert) {
        const emailData = {
            to: 'alerts@blaze-intelligence.com',
            subject: `[${alert.severity.toUpperCase()}] ${alert.message}`,
            body: this.formatAlertEmail(alert)
        };
        
        // In production, use actual email service
        console.log('📧 Email alert:', emailData);
    }

    /**
     * Send Slack alert
     */
    async sendSlackAlert(alert) {
        const slackData = {
            channel: '#alerts',
            username: 'Blaze Monitor',
            icon_emoji: this.getAlertEmoji(alert.severity),
            text: alert.message,
            attachments: [{
                color: this.getAlertColor(alert.severity),
                fields: [
                    { title: 'Severity', value: alert.severity, short: true },
                    { title: 'Type', value: alert.type, short: true },
                    { title: 'Time', value: new Date(alert.timestamp).toISOString(), short: false }
                ]
            }]
        };
        
        // In production, send to actual Slack webhook
        console.log('💬 Slack alert:', slackData);
    }

    /**
     * Send PagerDuty alert
     */
    async sendPagerDutyAlert(alert) {
        const pagerDutyData = {
            routing_key: 'YOUR_PAGERDUTY_KEY',
            event_action: 'trigger',
            payload: {
                summary: alert.message,
                severity: alert.severity,
                source: 'Blaze Intelligence Monitor',
                timestamp: new Date(alert.timestamp).toISOString(),
                custom_details: alert
            }
        };
        
        // In production, send to actual PagerDuty API
        console.log('📟 PagerDuty alert:', pagerDutyData);
    }

    /**
     * Setup monitoring dashboard
     */
    setupDashboard() {
        // This would typically create a real-time dashboard
        // For now, we'll log a summary periodically
        setInterval(() => {
            this.printDashboard();
        }, 60000); // Every minute
    }

    /**
     * Print dashboard summary
     */
    printDashboard() {
        console.log('\n📊 === BLAZE INTELLIGENCE MONITORING DASHBOARD ===');
        console.log(`⏰ Time: ${new Date().toISOString()}`);
        
        // Health Status
        console.log('\n🏥 Service Health:');
        this.healthChecks.forEach((check, service) => {
            const statusEmoji = check.status === 'healthy' ? '✅' : '❌';
            console.log(`  ${statusEmoji} ${check.name}: ${check.status}`);
        });
        
        // Metrics Summary
        console.log('\n📈 Metrics:');
        if (this.metrics.calculated) {
            console.log(`  Response Time: ${this.metrics.calculated.avgResponseTime?.toFixed(0) || 'N/A'}ms`);
            console.log(`  Error Rate: ${(this.metrics.calculated.errorRate * 100).toFixed(2)}%`);
            console.log(`  CPU Usage: ${this.metrics.calculated.avgCPU?.toFixed(1) || 'N/A'}%`);
            console.log(`  Memory Usage: ${this.metrics.calculated.avgMemory?.toFixed(1) || 'N/A'}%`);
            console.log(`  Uptime: ${this.metrics.calculated.uptime?.toFixed(2) || 'N/A'}%`);
        }
        
        // Active Incidents
        const activeIncidents = this.incidents.filter(i => i.status === 'open');
        console.log(`\n🚨 Active Incidents: ${activeIncidents.length}`);
        activeIncidents.forEach(incident => {
            console.log(`  - [${incident.severity}] ${incident.message}`);
        });
        
        // Recent Alerts
        const recentAlerts = this.metrics.alerts.slice(-5);
        console.log(`\n⚠️  Recent Alerts: ${recentAlerts.length}`);
        recentAlerts.forEach(alert => {
            console.log(`  - [${alert.severity}] ${alert.message}`);
        });
        
        console.log('\n' + '='.repeat(50));
    }

    /**
     * Utility Functions
     */
    
    calculateAverage(data) {
        if (!data || data.length === 0) return 0;
        const sum = data.reduce((acc, item) => acc + (item.value || 0), 0);
        return sum / data.length;
    }
    
    calculateUptimePercentage() {
        const totalChecks = this.healthChecks.get('api')?.consecutiveFailures || 0;
        const successfulChecks = Math.max(100 - totalChecks, 0);
        return (successfulChecks / 100) * 100;
    }
    
    calculateSeverity(service) {
        const criticalServices = ['api', 'database'];
        const highServices = ['app', 'cache'];
        
        if (criticalServices.includes(service)) return 'critical';
        if (highServices.includes(service)) return 'high';
        return 'medium';
    }
    
    shouldSendAlert(alert) {
        // Deduplication logic
        const recentAlerts = this.metrics.alerts.slice(-10);
        const duplicates = recentAlerts.filter(a => 
            a.type === alert.type && 
            a.severity === alert.severity &&
            Date.now() - a.timestamp < 300000 // 5 minutes
        );
        return duplicates.length <= 1;
    }
    
    formatAlertEmail(alert) {
        return `
Alert Details:
--------------
Severity: ${alert.severity}
Type: ${alert.type}
Message: ${alert.message}
Time: ${new Date(alert.timestamp).toISOString()}

Additional Details:
${JSON.stringify(alert, null, 2)}

--
Blaze Intelligence Monitoring System
        `;
    }
    
    getAlertEmoji(severity) {
        const emojis = {
            low: ':information_source:',
            medium: ':warning:',
            high: ':rotating_light:',
            critical: ':fire:'
        };
        return emojis[severity] || ':bell:';
    }
    
    getAlertColor(severity) {
        const colors = {
            low: '#36a64f',
            medium: '#ff9900',
            high: '#ff6600',
            critical: '#ff0000'
        };
        return colors[severity] || '#808080';
    }
    
    storeIncident(incident) {
        // Store in database or file
        if (typeof localStorage !== 'undefined') {
            const incidents = JSON.parse(localStorage.getItem('blaze_incidents') || '[]');
            incidents.push(incident);
            localStorage.setItem('blaze_incidents', JSON.stringify(incidents));
        }
    }
    
    cleanupOldMetrics() {
        const cutoff = Date.now() - this.config.monitoring.metricsRetention;
        
        // Clean up old metrics data
        Object.values(this.metrics.system).forEach(category => {
            Object.values(category).forEach(metric => {
                if (Array.isArray(metric)) {
                    const index = metric.findIndex(m => m.timestamp > cutoff);
                    if (index > 0) {
                        metric.splice(0, index);
                    }
                }
            });
        });
        
        // Clean up old alerts
        this.metrics.alerts = this.metrics.alerts.filter(a => a.timestamp > cutoff);
        
        // Clean up resolved incidents
        this.incidents = this.incidents.filter(i => 
            i.status === 'open' || i.timestamp > cutoff
        );
    }
    
    log(level, message, data = {}) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            level,
            message,
            data
        };
        
        // Console logging
        const logMethod = level === 'error' ? 'error' : level === 'warn' ? 'warn' : 'log';
        console[logMethod](`[${logEntry.timestamp}] [${level.toUpperCase()}] ${message}`, data);
        
        // In production, send to centralized logging service
        if (this.config.logging.destination === 'cloudwatch') {
            // Send to CloudWatch
        }
    }
    
    handleCriticalError(error) {
        // Emergency alert for critical failures
        this.createIncident({
            service: 'monitoring',
            type: 'critical_failure',
            severity: 'critical',
            message: 'Monitoring system failure',
            error: error.message,
            stack: error.stack
        });
    }
    
    /**
     * Stop monitoring
     */
    stopMonitoring() {
        this.isMonitoring = false;
        
        // Clear intervals
        clearInterval(this.metricsInterval);
        clearInterval(this.anomalyInterval);
        clearInterval(this.cleanupInterval);
        
        console.log('🛑 Monitoring stopped');
    }
}

// Initialize monitoring when DOM is ready
if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.blazeMonitoring = new ProductionMonitoring();
        });
    } else {
        window.blazeMonitoring = new ProductionMonitoring();
    }
} else {
    // Node.js environment
    module.exports = ProductionMonitoring;
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ProductionMonitoring;
}