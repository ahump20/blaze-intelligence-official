/**
 * Blaze Intelligence Health Monitoring System
 * Automated health checks with alerting and reporting
 */

import { EMAIL_TEMPLATES, EmailService } from './setup-email-infrastructure.js';

class HealthMonitor {
    constructor(config = {}) {
        this.config = {
            checkInterval: config.checkInterval || 5 * 60 * 1000, // 5 minutes
            alertThreshold: config.alertThreshold || 2, // Alert after 2 consecutive failures
            endpoints: config.endpoints || {
                main: 'https://blaze-intelligence.pages.dev/',
                contact: 'https://blaze-contact-api.humphrey-austin20.workers.dev/',
                auth: 'https://blaze-auth-api.humphrey-austin20.workers.dev/',
                stripe: 'https://blaze-stripe-api.humphrey-austin20.workers.dev/',
                dashboard: 'https://blaze-intelligence.pages.dev/user-dashboard.html'
            },
            notifications: config.notifications || {
                email: 'ahump20@outlook.com',
                webhook: config.webhookUrl || null
            }
        };
        
        this.healthData = {
            checks: [],
            failures: {},
            lastCheck: null,
            status: 'unknown'
        };
        
        this.isRunning = false;
    }

    /**
     * Start automated health monitoring
     */
    async start() {
        if (this.isRunning) {
            console.log('⚠️  Health monitor is already running');
            return;
        }

        console.log('🚀 Starting Blaze Intelligence Health Monitor');
        console.log(`📊 Check interval: ${this.config.checkInterval / 1000} seconds`);
        console.log(`🚨 Alert threshold: ${this.config.alertThreshold} consecutive failures`);
        
        this.isRunning = true;
        
        // Run initial check
        await this.runHealthCheck();
        
        // Schedule recurring checks
        this.intervalId = setInterval(async () => {
            await this.runHealthCheck();
        }, this.config.checkInterval);
    }

    /**
     * Stop health monitoring
     */
    stop() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
        this.isRunning = false;
        console.log('🛑 Health monitor stopped');
    }

    /**
     * Run comprehensive health check
     */
    async runHealthCheck() {
        const startTime = Date.now();
        const checkResults = {
            timestamp: new Date().toISOString(),
            endpoints: {},
            overall: {
                healthy: 0,
                unhealthy: 0,
                degraded: 0
            },
            responseTime: 0,
            status: 'healthy'
        };

        console.log(`\n🔍 Running health check at ${checkResults.timestamp}`);

        // Check each endpoint
        for (const [name, url] of Object.entries(this.config.endpoints)) {
            const result = await this.checkEndpoint(name, url);
            checkResults.endpoints[name] = result;
            
            // Update overall stats
            if (result.status === 'healthy') {
                checkResults.overall.healthy++;
            } else if (result.status === 'degraded') {
                checkResults.overall.degraded++;
            } else {
                checkResults.overall.unhealthy++;
            }
            
            // Track failures for alerting
            if (result.status !== 'healthy') {
                this.failures[name] = (this.failures[name] || 0) + 1;
                
                // Check if alert threshold reached
                if (this.failures[name] === this.config.alertThreshold) {
                    await this.sendAlert(name, result);
                }
            } else {
                // Reset failure count on success
                this.failures[name] = 0;
            }
        }

        // Calculate overall system status
        const totalEndpoints = Object.keys(this.config.endpoints).length;
        const healthPercentage = (checkResults.overall.healthy / totalEndpoints) * 100;
        
        if (healthPercentage === 100) {
            checkResults.status = 'healthy';
        } else if (healthPercentage >= 80) {
            checkResults.status = 'degraded';
        } else if (healthPercentage >= 50) {
            checkResults.status = 'partial';
        } else {
            checkResults.status = 'critical';
        }

        checkResults.responseTime = Date.now() - startTime;
        
        // Store check results
        this.healthData.checks.push(checkResults);
        this.healthData.lastCheck = checkResults.timestamp;
        this.healthData.status = checkResults.status;
        
        // Keep only last 100 checks
        if (this.healthData.checks.length > 100) {
            this.healthData.checks = this.healthData.checks.slice(-100);
        }

        // Log summary
        this.logHealthSummary(checkResults);
        
        // Send periodic report
        if (this.shouldSendReport()) {
            await this.sendHealthReport();
        }

        return checkResults;
    }

    /**
     * Check individual endpoint health
     */
    async checkEndpoint(name, url) {
        const startTime = Date.now();
        const result = {
            name,
            url,
            status: 'unknown',
            statusCode: null,
            responseTime: null,
            error: null,
            timestamp: new Date().toISOString()
        };

        try {
            const controller = new AbortController();
            const timeout = setTimeout(() => controller.abort(), 10000); // 10 second timeout
            
            const response = await fetch(url, {
                method: 'GET',
                signal: controller.signal,
                headers: {
                    'User-Agent': 'Blaze-Health-Monitor/1.0'
                }
            });
            
            clearTimeout(timeout);
            
            result.statusCode = response.status;
            result.responseTime = Date.now() - startTime;
            
            // Determine health status
            if (response.status >= 200 && response.status < 300) {
                result.status = 'healthy';
            } else if (response.status >= 300 && response.status < 400) {
                result.status = 'healthy'; // Redirects are ok
            } else if (response.status === 503) {
                result.status = 'degraded'; // Service temporarily unavailable
            } else if (response.status >= 400 && response.status < 500) {
                result.status = 'degraded'; // Client errors
            } else {
                result.status = 'unhealthy'; // Server errors
            }
            
            // Check response time performance
            if (result.responseTime > 5000) {
                result.status = 'degraded';
                result.error = 'Slow response time';
            }
            
        } catch (error) {
            result.status = 'unhealthy';
            result.error = error.message;
            result.responseTime = Date.now() - startTime;
            
            if (error.name === 'AbortError') {
                result.error = 'Request timeout';
            }
        }

        return result;
    }

    /**
     * Send alert for endpoint failure
     */
    async sendAlert(endpointName, result) {
        const alert = {
            severity: 'high',
            endpoint: endpointName,
            url: result.url,
            status: result.status,
            error: result.error,
            failureCount: this.failures[endpointName],
            timestamp: result.timestamp
        };

        console.log('🚨 ALERT:', JSON.stringify(alert, null, 2));
        
        // Send email alert
        if (this.config.notifications.email) {
            await this.sendEmailAlert(alert);
        }
        
        // Send webhook alert
        if (this.config.notifications.webhook) {
            await this.sendWebhookAlert(alert);
        }
    }

    /**
     * Send email alert
     */
    async sendEmailAlert(alert) {
        const emailContent = `
            <html>
            <body style="font-family: Arial, sans-serif;">
                <div style="background: #dc3545; color: white; padding: 20px;">
                    <h2>⚠️ Blaze Intelligence Health Alert</h2>
                </div>
                <div style="padding: 20px; background: #f8f9fa;">
                    <h3>Endpoint Failure Detected</h3>
                    <p><strong>Endpoint:</strong> ${alert.endpoint}</p>
                    <p><strong>URL:</strong> ${alert.url}</p>
                    <p><strong>Status:</strong> ${alert.status}</p>
                    <p><strong>Error:</strong> ${alert.error || 'None'}</p>
                    <p><strong>Consecutive Failures:</strong> ${alert.failureCount}</p>
                    <p><strong>Time:</strong> ${new Date(alert.timestamp).toLocaleString()}</p>
                    
                    <div style="margin-top: 20px; padding: 15px; background: #fff3cd; border: 1px solid #ffc107;">
                        <strong>Action Required:</strong> Please investigate this issue immediately.
                    </div>
                </div>
            </body>
            </html>
        `;

        // In production, this would send via EmailService
        console.log('📧 Email alert would be sent to:', this.config.notifications.email);
    }

    /**
     * Send webhook alert
     */
    async sendWebhookAlert(alert) {
        try {
            await fetch(this.config.notifications.webhook, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    service: 'Blaze Intelligence',
                    type: 'health_alert',
                    alert
                })
            });
        } catch (error) {
            console.error('Failed to send webhook alert:', error);
        }
    }

    /**
     * Log health check summary
     */
    logHealthSummary(results) {
        const statusEmoji = {
            healthy: '✅',
            degraded: '⚠️',
            partial: '🔶',
            critical: '❌',
            unknown: '❓'
        };

        console.log('\n📊 Health Check Summary');
        console.log('=' .repeat(50));
        console.log(`Status: ${statusEmoji[results.status]} ${results.status.toUpperCase()}`);
        console.log(`Healthy: ${results.overall.healthy} | Degraded: ${results.overall.degraded} | Unhealthy: ${results.overall.unhealthy}`);
        console.log(`Response Time: ${results.responseTime}ms`);
        
        // Log individual endpoint status
        for (const [name, endpoint] of Object.entries(results.endpoints)) {
            const emoji = statusEmoji[endpoint.status];
            const time = endpoint.responseTime ? `${endpoint.responseTime}ms` : 'N/A';
            console.log(`  ${emoji} ${name}: ${endpoint.statusCode || 'ERROR'} (${time})`);
        }
    }

    /**
     * Determine if periodic report should be sent
     */
    shouldSendReport() {
        const now = new Date();
        const hour = now.getHours();
        const minute = now.getMinutes();
        
        // Send report at 9 AM and 5 PM
        return (hour === 9 || hour === 17) && minute < 5;
    }

    /**
     * Send comprehensive health report
     */
    async sendHealthReport() {
        const report = this.generateHealthReport();
        console.log('\n📧 Sending health report...');
        
        // In production, send via email
        console.log(report);
    }

    /**
     * Generate health report
     */
    generateHealthReport() {
        const last24Hours = this.healthData.checks.filter(check => {
            const checkTime = new Date(check.timestamp).getTime();
            const dayAgo = Date.now() - (24 * 60 * 60 * 1000);
            return checkTime > dayAgo;
        });

        const stats = {
            totalChecks: last24Hours.length,
            healthyChecks: 0,
            degradedChecks: 0,
            criticalChecks: 0,
            avgResponseTime: 0,
            uptime: {},
            incidents: []
        };

        // Calculate statistics
        let totalResponseTime = 0;
        last24Hours.forEach(check => {
            if (check.status === 'healthy') stats.healthyChecks++;
            else if (check.status === 'degraded') stats.degradedChecks++;
            else if (check.status === 'critical') stats.criticalChecks++;
            
            totalResponseTime += check.responseTime;
        });

        stats.avgResponseTime = Math.round(totalResponseTime / last24Hours.length);
        
        // Calculate uptime per endpoint
        for (const endpoint of Object.keys(this.config.endpoints)) {
            const endpointChecks = last24Hours.filter(c => c.endpoints[endpoint]);
            const healthyChecks = endpointChecks.filter(c => c.endpoints[endpoint].status === 'healthy');
            stats.uptime[endpoint] = ((healthyChecks.length / endpointChecks.length) * 100).toFixed(2) + '%';
        }

        return {
            title: 'Blaze Intelligence Health Report',
            period: '24 Hours',
            generated: new Date().toISOString(),
            currentStatus: this.healthData.status,
            statistics: stats,
            recommendations: this.generateRecommendations(stats)
        };
    }

    /**
     * Generate recommendations based on health data
     */
    generateRecommendations(stats) {
        const recommendations = [];
        
        if (stats.criticalChecks > stats.totalChecks * 0.1) {
            recommendations.push('⚠️ High number of critical incidents. Immediate investigation required.');
        }
        
        if (stats.avgResponseTime > 3000) {
            recommendations.push('🐌 Average response time is high. Consider performance optimization.');
        }
        
        Object.entries(stats.uptime).forEach(([endpoint, uptime]) => {
            const uptimeValue = parseFloat(uptime);
            if (uptimeValue < 95) {
                recommendations.push(`📉 ${endpoint} uptime is below 95%. Review infrastructure stability.`);
            }
        });
        
        if (recommendations.length === 0) {
            recommendations.push('✅ System is performing well. No immediate actions required.');
        }
        
        return recommendations;
    }

    /**
     * Get current health status
     */
    getStatus() {
        return {
            status: this.healthData.status,
            lastCheck: this.healthData.lastCheck,
            endpoints: this.config.endpoints,
            uptime: this.calculateUptime()
        };
    }

    /**
     * Calculate overall uptime
     */
    calculateUptime() {
        if (this.healthData.checks.length === 0) return 'N/A';
        
        const healthyChecks = this.healthData.checks.filter(c => c.status === 'healthy');
        const uptime = (healthyChecks.length / this.healthData.checks.length) * 100;
        return uptime.toFixed(2) + '%';
    }
}

// Export for use in other modules
export default HealthMonitor;

// CLI execution
if (typeof process !== 'undefined' && process.argv) {
    const monitor = new HealthMonitor();
    
    // Handle process signals
    process.on('SIGINT', () => {
        console.log('\n🛑 Stopping health monitor...');
        monitor.stop();
        process.exit(0);
    });
    
    // Start monitoring
    monitor.start().catch(error => {
        console.error('❌ Health monitor failed:', error);
        process.exit(1);
    });
}