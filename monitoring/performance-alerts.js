#!/usr/bin/env node

/**
 * Blaze Intelligence - Performance Monitoring & Alerts
 * Monitors site performance, uptime, and data freshness
 * Sends alerts when thresholds are exceeded
 */

const fs = require('fs').promises;
const path = require('path');

class PerformanceMonitor {
    constructor() {
        this.config = {
            // Performance thresholds
            maxTTFB: 1000,           // 1 second TTFB
            maxPageLoad: 3000,       // 3 second page load
            minUptime: 0.99,         // 99% uptime
            maxDataAge: 15 * 60000,  // 15 minutes max data age
            
            // Alert configuration
            alertCooldown: 5 * 60000, // 5 minutes between same alerts
            criticalOnly: false,      // Send all alerts or only critical
            
            // Monitoring URLs
            urls: [
                'https://blaze-intelligence.pages.dev',
                'https://blaze-intelligence.com',
                'https://blaze-sports-data.humphrey-austin20.workers.dev/health'
            ],
            
            // Data files to monitor
            dataFiles: [
                {
                    path: './dist/src/data/enhanced-readiness.json',
                    name: 'Cardinals Readiness',
                    maxAge: 15 * 60000,
                    critical: true
                },
                {
                    path: './dist/src/data/readiness.json', 
                    name: 'Base Readiness',
                    maxAge: 30 * 60000,
                    critical: false
                }
            ]
        };
        
        this.alertHistory = new Map();
        this.metrics = {
            checks: 0,
            alerts: 0,
            lastRun: null,
            status: 'unknown'
        };
    }

    async checkWebsitePerformance(url) {
        const start = Date.now();
        
        try {
            // Use curl to get detailed timing information
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            const curlCommand = `curl -w "@-" -o /dev/null -s "${url}" <<'EOF'
{
  "time_namelookup": %{time_namelookup},
  "time_connect": %{time_connect},
  "time_appconnect": %{time_appconnect},
  "time_pretransfer": %{time_pretransfer},
  "time_redirect": %{time_redirect},
  "time_starttransfer": %{time_starttransfer},
  "time_total": %{time_total},
  "http_code": %{http_code},
  "size_download": %{size_download},
  "speed_download": %{speed_download}
}
EOF`;
            
            const { stdout } = await execAsync(curlCommand);
            const timing = JSON.parse(stdout);
            
            const ttfb = Math.round(timing.time_starttransfer * 1000);
            const totalTime = Math.round(timing.time_total * 1000);
            
            return {
                url: url,
                status: timing.http_code === 200 ? 'up' : 'degraded',
                ttfb: ttfb,
                totalTime: totalTime,
                httpCode: timing.http_code,
                downloadSize: timing.size_download,
                timestamp: new Date().toISOString(),
                alerts: this.checkPerformanceThresholds(ttfb, totalTime, timing.http_code)
            };
            
        } catch (error) {
            return {
                url: url,
                status: 'down',
                error: error.message,
                timestamp: new Date().toISOString(),
                alerts: ['Site is completely down']
            };
        }
    }

    checkPerformanceThresholds(ttfb, totalTime, httpCode) {
        const alerts = [];
        
        if (httpCode !== 200) {
            alerts.push(`HTTP ${httpCode} error`);
        }
        
        if (ttfb > this.config.maxTTFB) {
            alerts.push(`Slow TTFB: ${ttfb}ms (threshold: ${this.config.maxTTFB}ms)`);
        }
        
        if (totalTime > this.config.maxPageLoad) {
            alerts.push(`Slow page load: ${totalTime}ms (threshold: ${this.config.maxPageLoad}ms)`);
        }
        
        return alerts;
    }

    async checkDataFreshness() {
        const results = [];
        
        for (const dataFile of this.config.dataFiles) {
            try {
                const filePath = path.resolve(dataFile.path);
                const stats = await fs.stat(filePath);
                const age = Date.now() - stats.mtime.getTime();
                
                const result = {
                    name: dataFile.name,
                    path: dataFile.path,
                    age: age,
                    ageMinutes: Math.round(age / 60000),
                    status: age < dataFile.maxAge ? 'fresh' : 'stale',
                    critical: dataFile.critical,
                    lastModified: stats.mtime.toISOString(),
                    alerts: []
                };
                
                if (age > dataFile.maxAge) {
                    const severity = dataFile.critical ? 'CRITICAL' : 'WARNING';
                    result.alerts.push(`${severity}: Data is ${result.ageMinutes} minutes old`);
                }
                
                results.push(result);
                
            } catch (error) {
                results.push({
                    name: dataFile.name,
                    path: dataFile.path,
                    status: 'missing',
                    error: error.message,
                    alerts: [`CRITICAL: ${dataFile.name} file not found`]
                });
            }
        }
        
        return results;
    }

    async runFullMonitoringCheck() {
        console.log('🔍 Running performance monitoring check...');
        
        const results = {
            timestamp: new Date().toISOString(),
            overall: 'healthy',
            websites: [],
            dataFiles: [],
            alerts: [],
            metrics: this.metrics
        };
        
        try {
            // Check website performance
            for (const url of this.config.urls) {
                const websiteResult = await this.checkWebsitePerformance(url);
                results.websites.push(websiteResult);
                
                if (websiteResult.alerts && websiteResult.alerts.length > 0) {
                    results.alerts.push(...websiteResult.alerts.map(alert => ({
                        type: 'performance',
                        source: url,
                        message: alert,
                        severity: websiteResult.status === 'down' ? 'critical' : 'warning',
                        timestamp: websiteResult.timestamp
                    })));
                }
            }
            
            // Check data freshness
            const dataResults = await this.checkDataFreshness();
            results.dataFiles = dataResults;
            
            dataResults.forEach(data => {
                if (data.alerts && data.alerts.length > 0) {
                    results.alerts.push(...data.alerts.map(alert => ({
                        type: 'data',
                        source: data.name,
                        message: alert,
                        severity: data.critical ? 'critical' : 'warning',
                        timestamp: results.timestamp
                    })));
                }
            });
            
            // Determine overall status
            const criticalAlerts = results.alerts.filter(a => a.severity === 'critical');
            const warningAlerts = results.alerts.filter(a => a.severity === 'warning');
            
            if (criticalAlerts.length > 0) {
                results.overall = 'critical';
            } else if (warningAlerts.length > 0) {
                results.overall = 'degraded';
            }
            
            // Update metrics
            this.metrics.checks++;
            this.metrics.alerts += results.alerts.length;
            this.metrics.lastRun = results.timestamp;
            this.metrics.status = results.overall;
            
            // Send alerts if needed
            if (results.alerts.length > 0) {
                await this.processAlerts(results.alerts);
            }
            
            // Save results
            await this.saveResults(results);
            
            console.log(`✅ Monitoring check complete: ${results.overall.toUpperCase()}`);
            console.log(`📊 Found ${results.alerts.length} alerts`);
            
            return results;
            
        } catch (error) {
            console.error('❌ Monitoring check failed:', error.message);
            throw error;
        }
    }

    async processAlerts(alerts) {
        const newAlerts = [];
        
        for (const alert of alerts) {
            const alertKey = `${alert.type}:${alert.source}:${alert.message}`;
            const lastSent = this.alertHistory.get(alertKey);
            
            // Check cooldown period
            if (!lastSent || (Date.now() - lastSent) > this.config.alertCooldown) {
                newAlerts.push(alert);
                this.alertHistory.set(alertKey, Date.now());
            }
        }
        
        if (newAlerts.length > 0) {
            console.log(`🚨 Sending ${newAlerts.length} new alerts`);
            
            // Console alerts (always)
            this.sendConsoleAlerts(newAlerts);
            
            // Additional alert channels would go here
            // await this.sendEmailAlerts(newAlerts);
            // await this.sendSlackAlerts(newAlerts);
            // await this.sendSMSAlerts(newAlerts);
        }
    }

    sendConsoleAlerts(alerts) {
        console.log('\n🔥 BLAZE INTELLIGENCE PERFORMANCE ALERTS');
        console.log('='.repeat(50));
        
        const critical = alerts.filter(a => a.severity === 'critical');
        const warnings = alerts.filter(a => a.severity === 'warning');
        
        if (critical.length > 0) {
            console.log('\n🚨 CRITICAL ALERTS:');
            critical.forEach(alert => {
                console.log(`  • ${alert.source}: ${alert.message}`);
            });
        }
        
        if (warnings.length > 0) {
            console.log('\n⚠️  WARNING ALERTS:');
            warnings.forEach(alert => {
                console.log(`  • ${alert.source}: ${alert.message}`);
            });
        }
        
        console.log('\n' + '='.repeat(50));
    }

    async saveResults(results) {
        try {
            // Ensure monitoring directory exists
            await fs.mkdir('monitoring/logs', { recursive: true });
            
            // Save latest results
            await fs.writeFile(
                'monitoring/latest-check.json',
                JSON.stringify(results, null, 2)
            );
            
            // Save timestamped log
            const filename = `monitoring-${new Date().toISOString().split('T')[0]}.json`;
            const logPath = path.join('monitoring', 'logs', filename);
            
            let dailyLogs = [];
            try {
                dailyLogs = JSON.parse(await fs.readFile(logPath, 'utf8'));
            } catch (error) {
                // File doesn't exist, start new
            }
            
            dailyLogs.push(results);
            await fs.writeFile(logPath, JSON.stringify(dailyLogs, null, 2));
            
        } catch (error) {
            console.error('Failed to save monitoring results:', error.message);
        }
    }

    async generateAlertsDashboard() {
        try {
            const latestCheck = JSON.parse(
                await fs.readFile('monitoring/latest-check.json', 'utf8')
            );
            
            const dashboard = `<!DOCTYPE html>
<html>
<head>
    <title>Blaze Intelligence - Performance Alerts</title>
    <meta http-equiv="refresh" content="60">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; background: #0a0a0a; color: white; }
        .status { padding: 20px; margin: 20px 0; border-radius: 8px; }
        .healthy { background: #1d4b39; border-left: 4px solid #22c55e; }
        .degraded { background: #4b3d1d; border-left: 4px solid #f59e0b; }
        .critical { background: #4b1d1d; border-left: 4px solid #ef4444; }
        .alert { margin: 10px 0; padding: 10px; background: #2a2a2a; border-radius: 4px; }
        .alert.critical { border-left: 3px solid #ef4444; }
        .alert.warning { border-left: 3px solid #f59e0b; }
        .metrics { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
        .metric { background: #1a1a1a; padding: 15px; border-radius: 8px; text-align: center; }
        .metric .value { font-size: 24px; font-weight: bold; color: #BF5700; }
        .timestamp { color: #999; font-size: 14px; }
    </style>
</head>
<body>
    <h1>🔥 Blaze Intelligence Performance Alerts</h1>
    
    <div class="status ${latestCheck.overall}">
        <h2>Overall Status: ${latestCheck.overall.toUpperCase()}</h2>
        <div class="timestamp">Last check: ${latestCheck.timestamp}</div>
    </div>
    
    <div class="metrics">
        <div class="metric">
            <div class="value">${latestCheck.metrics.checks}</div>
            <div>Total Checks</div>
        </div>
        <div class="metric">
            <div class="value">${latestCheck.alerts.length}</div>
            <div>Active Alerts</div>
        </div>
        <div class="metric">
            <div class="value">${latestCheck.websites.filter(w => w.status === 'up').length}/${latestCheck.websites.length}</div>
            <div>Sites Up</div>
        </div>
        <div class="metric">
            <div class="value">${latestCheck.dataFiles.filter(d => d.status === 'fresh').length}/${latestCheck.dataFiles.length}</div>
            <div>Data Fresh</div>
        </div>
    </div>
    
    ${latestCheck.alerts.length > 0 ? `
    <h2>Active Alerts</h2>
    ${latestCheck.alerts.map(alert => `
        <div class="alert ${alert.severity}">
            <strong>${alert.source}:</strong> ${alert.message}
            <div class="timestamp">${alert.timestamp}</div>
        </div>
    `).join('')}
    ` : '<p>✅ No active alerts</p>'}
    
    <h2>Website Performance</h2>
    ${latestCheck.websites.map(site => `
        <div class="alert ${site.status === 'up' ? '' : 'critical'}">
            <strong>${site.url}:</strong> ${site.status.toUpperCase()}
            ${site.ttfb ? `<br>TTFB: ${site.ttfb}ms, Total: ${site.totalTime}ms` : ''}
            ${site.error ? `<br>Error: ${site.error}` : ''}
        </div>
    `).join('')}
    
    <h2>Data Freshness</h2>
    ${latestCheck.dataFiles.map(data => `
        <div class="alert ${data.status === 'fresh' ? '' : 'warning'}">
            <strong>${data.name}:</strong> ${data.status.toUpperCase()}
            ${data.ageMinutes !== undefined ? `<br>Age: ${data.ageMinutes} minutes` : ''}
            ${data.error ? `<br>Error: ${data.error}` : ''}
        </div>
    `).join('')}
    
</body>
</html>`;
            
            await fs.writeFile('monitoring/alerts-dashboard.html', dashboard);
            console.log('📊 Alerts dashboard generated');
            
        } catch (error) {
            console.error('Failed to generate alerts dashboard:', error.message);
        }
    }

    async startContinuousMonitoring(intervalMinutes = 5) {
        console.log(`🔄 Starting continuous performance monitoring (every ${intervalMinutes} minutes)`);
        
        // Initial check
        await this.runFullMonitoringCheck();
        await this.generateAlertsDashboard();
        
        // Set up interval
        setInterval(async () => {
            try {
                await this.runFullMonitoringCheck();
                await this.generateAlertsDashboard();
            } catch (error) {
                console.error('Monitoring cycle failed:', error.message);
            }
        }, intervalMinutes * 60000);
        
        console.log('🎯 Performance monitoring is running. Press Ctrl+C to stop.');
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new PerformanceMonitor();
    const command = process.argv[2];
    const interval = parseInt(process.argv[3]) || 5;
    
    switch (command) {
        case 'check':
            monitor.runFullMonitoringCheck()
                .then(results => {
                    console.log('Check complete:', results.overall);
                    process.exit(results.overall === 'critical' ? 1 : 0);
                })
                .catch(error => {
                    console.error('Check failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'dashboard':
            monitor.generateAlertsDashboard()
                .then(() => {
                    console.log('Dashboard generated at monitoring/alerts-dashboard.html');
                    process.exit(0);
                })
                .catch(error => {
                    console.error('Dashboard generation failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'watch':
        case 'start':
            monitor.startContinuousMonitoring(interval);
            break;
            
        default:
            console.log(`
🔥 Blaze Intelligence Performance Monitor

Usage: node performance-alerts.js [command] [interval]

Commands:
  check       - Run single monitoring check
  dashboard   - Generate alerts dashboard
  watch       - Start continuous monitoring
  start       - Alias for watch

Options:
  interval    - Check interval in minutes (default: 5)

Examples:
  node performance-alerts.js check
  node performance-alerts.js watch 10
  node performance-alerts.js dashboard
            `);
            break;
    }
}

module.exports = PerformanceMonitor;