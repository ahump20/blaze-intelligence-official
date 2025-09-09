#!/usr/bin/env node

/**
 * Blaze Intelligence Health Monitor
 * Championship-level system monitoring for production deployment
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const CONFIG = {
    DEPLOYMENT_URL: 'https://blaze-intelligence.pages.dev',
    CHECK_INTERVAL: 300000, // 5 minutes
    TIMEOUT: 10000, // 10 seconds
    ALERT_THRESHOLD: {
        RESPONSE_TIME: 500, // ms
        ERROR_RATE: 5, // %
        DOWNTIME: 60000 // 1 minute
    },
    LOG_PATH: '/Users/AustinHumphrey/austin-portfolio-deploy/monitoring/health.log'
};

class HealthMonitor {
    constructor() {
        this.metrics = {
            uptime: 0,
            totalChecks: 0,
            successfulChecks: 0,
            averageResponseTime: 0,
            lastCheck: null,
            alerts: []
        };
    }

    async checkHealth() {
        const startTime = Date.now();
        
        try {
            const result = await this.makeRequest(CONFIG.DEPLOYMENT_URL);
            const responseTime = Date.now() - startTime;
            
            this.metrics.totalChecks++;
            this.metrics.successfulChecks++;
            this.metrics.lastCheck = new Date().toISOString();
            
            // Calculate average response time
            this.metrics.averageResponseTime = Math.round(
                (this.metrics.averageResponseTime * (this.metrics.totalChecks - 1) + responseTime) / this.metrics.totalChecks
            );
            
            const healthStatus = {
                timestamp: new Date().toISOString(),
                status: 'HEALTHY',
                responseTime: responseTime,
                statusCode: result.statusCode,
                uptime: `${Math.round(this.metrics.successfulChecks / this.metrics.totalChecks * 100)}%`,
                averageResponseTime: this.metrics.averageResponseTime,
                contentCheck: result.content.includes('Blaze Intelligence') && result.content.includes('Cognitive Performance')
            };
            
            // Check for performance alerts
            if (responseTime > CONFIG.ALERT_THRESHOLD.RESPONSE_TIME) {
                this.createAlert('HIGH_RESPONSE_TIME', `Response time ${responseTime}ms exceeds threshold`);
            }
            
            this.logHealth(healthStatus);
            console.log(`✅ Health Check: ${healthStatus.status} | ${responseTime}ms | ${healthStatus.uptime} uptime`);
            
            return healthStatus;
            
        } catch (error) {
            this.metrics.totalChecks++;
            const errorStatus = {
                timestamp: new Date().toISOString(),
                status: 'ERROR',
                error: error.message,
                uptime: `${Math.round(this.metrics.successfulChecks / this.metrics.totalChecks * 100)}%`
            };
            
            this.createAlert('SERVICE_DOWN', `Service unavailable: ${error.message}`);
            this.logHealth(errorStatus);
            console.error(`❌ Health Check FAILED: ${error.message}`);
            
            return errorStatus;
        }
    }
    
    makeRequest(url) {
        return new Promise((resolve, reject) => {
            const request = https.get(url, { timeout: CONFIG.TIMEOUT }, (response) => {
                let data = '';
                
                response.on('data', (chunk) => {
                    data += chunk;
                });
                
                response.on('end', () => {
                    resolve({
                        statusCode: response.statusCode,
                        content: data
                    });
                });
            });
            
            request.on('error', reject);
            request.on('timeout', () => {
                request.destroy();
                reject(new Error(`Request timeout after ${CONFIG.TIMEOUT}ms`));
            });
        });
    }
    
    createAlert(type, message) {
        const alert = {
            timestamp: new Date().toISOString(),
            type: type,
            message: message,
            acknowledged: false
        };
        
        this.metrics.alerts.push(alert);
        
        // Keep only last 50 alerts
        if (this.metrics.alerts.length > 50) {
            this.metrics.alerts = this.metrics.alerts.slice(-50);
        }
        
        console.warn(`🚨 ALERT [${type}]: ${message}`);
    }
    
    logHealth(status) {
        const logEntry = JSON.stringify(status) + '\\n';
        
        try {
            // Ensure monitoring directory exists
            const monitoringDir = path.dirname(CONFIG.LOG_PATH);
            if (!fs.existsSync(monitoringDir)) {
                fs.mkdirSync(monitoringDir, { recursive: true });
            }
            
            fs.appendFileSync(CONFIG.LOG_PATH, logEntry);
        } catch (error) {
            console.error('Failed to write health log:', error.message);
        }
    }
    
    async generateReport() {
        const uptime = this.metrics.totalChecks > 0 ? 
            (this.metrics.successfulChecks / this.metrics.totalChecks * 100).toFixed(2) : 0;
            
        const report = {
            generated: new Date().toISOString(),
            deployment_url: CONFIG.DEPLOYMENT_URL,
            metrics: {
                uptime_percentage: uptime,
                total_checks: this.metrics.totalChecks,
                successful_checks: this.metrics.successfulChecks,
                average_response_time: this.metrics.averageResponseTime,
                last_check: this.metrics.lastCheck
            },
            recent_alerts: this.metrics.alerts.slice(-10),
            status: uptime > 99 ? 'CHAMPIONSHIP' : uptime > 95 ? 'EXCELLENT' : 'NEEDS_ATTENTION'
        };
        
        console.log('\\n🏆 BLAZE INTELLIGENCE HEALTH REPORT');
        console.log('====================================');
        console.log(`Status: ${report.status}`);
        console.log(`Uptime: ${uptime}%`);
        console.log(`Avg Response: ${this.metrics.averageResponseTime}ms`);
        console.log(`Total Checks: ${this.metrics.totalChecks}`);
        console.log(`Recent Alerts: ${this.metrics.alerts.length}`);
        
        return report;
    }
    
    start() {
        console.log('🚀 Starting Blaze Intelligence Health Monitor');
        console.log(`Monitoring: ${CONFIG.DEPLOYMENT_URL}`);
        console.log(`Check Interval: ${CONFIG.CHECK_INTERVAL / 1000}s\\n`);
        
        // Initial check
        this.checkHealth();
        
        // Schedule recurring checks
        setInterval(() => {
            this.checkHealth();
        }, CONFIG.CHECK_INTERVAL);
        
        // Generate report every hour
        setInterval(() => {
            this.generateReport();
        }, 3600000);
    }
}

// Start monitoring if run directly
if (require.main === module) {
    const monitor = new HealthMonitor();
    monitor.start();
    
    // Graceful shutdown
    process.on('SIGINT', () => {
        console.log('\\n🛑 Shutting down health monitor...');
        monitor.generateReport().then(() => {
            process.exit(0);
        });
    });
}

module.exports = HealthMonitor;