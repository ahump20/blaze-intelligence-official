#!/usr/bin/env node

// Blaze Intelligence - Health Monitoring System
// Monitors all services and sends alerts

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class HealthMonitor {
    constructor() {
        this.endpoints = [
            {
                name: 'Main Website',
                url: 'https://blaze-intelligence.pages.dev',
                timeout: 10000,
                critical: true
            },
            {
                name: 'Worker API',
                url: 'https://blaze-sports-data.humphrey-austin20.workers.dev/health',
                timeout: 5000,
                critical: true
            },
            {
                name: 'Custom Domain',
                url: 'https://blaze-intelligence.com',
                timeout: 10000,
                critical: false
            }
        ];
        
        this.dataFiles = [
            {
                name: 'Cardinals Readiness',
                path: './src/data/readiness.json',
                maxAge: 15 * 60 * 1000, // 15 minutes
                critical: true
            },
            {
                name: 'Team Analytics',
                path: './src/data/analytics/',
                maxAge: 30 * 60 * 1000, // 30 minutes
                critical: false
            }
        ];
        
        this.alertChannels = {
            email: process.env.SENDGRID_API_KEY,
            sms: process.env.TWILIO_AUTH_TOKEN,
            slack: process.env.SLACK_WEBHOOK_URL
        };
        
        this.healthHistory = [];
    }

    async runHealthCheck() {
        console.log('🔍 Running Blaze Intelligence health check...');
        
        const results = {
            timestamp: new Date().toISOString(),
            overall: 'healthy',
            endpoints: [],
            dataFiles: [],
            agents: [],
            performance: {}
        };
        
        // Check endpoints
        for (const endpoint of this.endpoints) {
            const result = await this.checkEndpoint(endpoint);
            results.endpoints.push(result);
            
            if (result.status === 'down' && endpoint.critical) {
                results.overall = 'critical';
            } else if (result.status === 'degraded' && results.overall === 'healthy') {
                results.overall = 'degraded';
            }
        }
        
        // Check data freshness
        for (const dataFile of this.dataFiles) {
            const result = await this.checkDataFile(dataFile);
            results.dataFiles.push(result);
            
            if (result.status === 'stale' && dataFile.critical) {
                results.overall = 'degraded';
            }
        }
        
        // Check agents
        results.agents = await this.checkAgents();
        
        // Performance metrics
        results.performance = await this.getPerformanceMetrics();
        
        // Store results
        await this.storeResults(results);
        
        // Send alerts if needed
        if (results.overall !== 'healthy') {
            await this.sendAlerts(results);
        }
        
        return results;
    }

    async checkEndpoint(endpoint) {
        const start = Date.now();
        
        try {
            const response = await axios.get(endpoint.url, {
                timeout: endpoint.timeout,
                validateStatus: (status) => status < 500
            });
            
            const responseTime = Date.now() - start;
            
            return {
                name: endpoint.name,
                url: endpoint.url,
                status: response.status === 200 ? 'up' : 'degraded',
                responseTime: responseTime,
                httpStatus: response.status,
                timestamp: new Date().toISOString()
            };
            
        } catch (error) {
            return {
                name: endpoint.name,
                url: endpoint.url,
                status: 'down',
                responseTime: Date.now() - start,
                error: error.message,
                timestamp: new Date().toISOString()
            };
        }
    }

    async checkDataFile(dataFile) {
        try {
            if (dataFile.path.endsWith('/')) {
                // Check directory for recent files
                const files = await fs.readdir(dataFile.path);
                const recentFiles = [];
                
                for (const file of files) {
                    if (file.endsWith('.json')) {
                        const filePath = path.join(dataFile.path, file);
                        const stats = await fs.stat(filePath);
                        const age = Date.now() - stats.mtime.getTime();
                        
                        if (age < dataFile.maxAge) {
                            recentFiles.push({ file, age });
                        }
                    }
                }
                
                return {
                    name: dataFile.name,
                    path: dataFile.path,
                    status: recentFiles.length > 0 ? 'fresh' : 'stale',
                    recentFiles: recentFiles.length,
                    lastUpdate: recentFiles.length > 0 ? 
                        Math.min(...recentFiles.map(f => f.age)) : null
                };
                
            } else {
                // Check single file
                const stats = await fs.stat(dataFile.path);
                const age = Date.now() - stats.mtime.getTime();
                
                return {
                    name: dataFile.name,
                    path: dataFile.path,
                    status: age < dataFile.maxAge ? 'fresh' : 'stale',
                    age: age,
                    lastUpdate: stats.mtime.toISOString()
                };
            }
            
        } catch (error) {
            return {
                name: dataFile.name,
                path: dataFile.path,
                status: 'missing',
                error: error.message
            };
        }
    }

    async checkAgents() {
        const agentChecks = [];
        
        // Check if Cardinals agent is running
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            const { stdout } = await execAsync('ps aux | grep cardinals-readiness-board.js | grep -v grep');
            
            agentChecks.push({
                name: 'Cardinals Readiness Board',
                status: stdout.trim() ? 'running' : 'stopped',
                pid: stdout.trim() ? stdout.split(/\s+/)[1] : null
            });
            
        } catch (error) {
            agentChecks.push({
                name: 'Cardinals Readiness Board',
                status: 'stopped',
                error: 'Process not found'
            });
        }
        
        // Check real-time pipeline
        try {
            const { exec } = require('child_process');
            const { promisify } = require('util');
            const execAsync = promisify(exec);
            
            const { stdout } = await execAsync('ps aux | grep blaze-realtime-pipeline.js | grep -v grep');
            
            agentChecks.push({
                name: 'Real-time Data Pipeline',
                status: stdout.trim() ? 'running' : 'stopped',
                pid: stdout.trim() ? stdout.split(/\s+/)[1] : null
            });
            
        } catch (error) {
            agentChecks.push({
                name: 'Real-time Data Pipeline',
                status: 'stopped',
                error: 'Process not found'
            });
        }
        
        return agentChecks;
    }

    async getPerformanceMetrics() {
        const metrics = {
            timestamp: new Date().toISOString()
        };
        
        // Get system metrics if available
        try {
            const os = require('os');
            metrics.system = {
                loadAverage: os.loadavg(),
                freeMemory: os.freemem(),
                totalMemory: os.totalmem(),
                uptime: os.uptime()
            };
        } catch (error) {
            // System metrics not available
        }
        
        // Get Cardinals data metrics
        try {
            const readinessPath = './src/data/readiness.json';
            const data = JSON.parse(await fs.readFile(readinessPath, 'utf8'));
            
            metrics.cardinals = {
                overallReadiness: data.readiness?.overall || 0,
                winProbability: data.predictions?.winProbability || 0,
                championshipOdds: data.blazeIntelligence?.championshipOdds || 0,
                lastUpdate: data.timestamp
            };
        } catch (error) {
            metrics.cardinals = { error: 'Data unavailable' };
        }
        
        return metrics;
    }

    async storeResults(results) {
        // Store in memory
        this.healthHistory.unshift(results);
        
        // Keep only last 100 checks
        if (this.healthHistory.length > 100) {
            this.healthHistory = this.healthHistory.slice(0, 100);
        }
        
        // Store to file
        try {
            await fs.mkdir('monitoring/logs', { recursive: true });
            const filename = `health-${new Date().toISOString().split('T')[0]}.json`;
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
            console.error('Failed to store health results:', error.message);
        }
    }

    async sendAlerts(results) {
        const alertMessage = this.formatAlert(results);
        
        console.log('🚨 HEALTH ALERT:', results.overall.toUpperCase());
        console.log(alertMessage);
        
        // Send email alert
        if (this.alertChannels.email) {
            await this.sendEmailAlert(alertMessage, results);
        }
        
        // Send SMS alert for critical issues
        if (this.alertChannels.sms && results.overall === 'critical') {
            await this.sendSMSAlert(alertMessage, results);
        }
        
        // Send Slack notification
        if (this.alertChannels.slack) {
            await this.sendSlackAlert(alertMessage, results);
        }
    }

    formatAlert(results) {
        let message = `🔥 BLAZE INTELLIGENCE HEALTH ALERT\n\n`;
        message += `Status: ${results.overall.toUpperCase()}\n`;
        message += `Time: ${results.timestamp}\n\n`;
        
        // Failed endpoints
        const failedEndpoints = results.endpoints.filter(e => e.status !== 'up');
        if (failedEndpoints.length > 0) {
            message += `🚨 Failed Endpoints:\n`;
            failedEndpoints.forEach(e => {
                message += `  • ${e.name}: ${e.status} (${e.error || e.httpStatus})\n`;
            });
            message += `\n`;
        }
        
        // Stale data
        const staleData = results.dataFiles.filter(d => d.status === 'stale' || d.status === 'missing');
        if (staleData.length > 0) {
            message += `📊 Data Issues:\n`;
            staleData.forEach(d => {
                message += `  • ${d.name}: ${d.status}\n`;
            });
            message += `\n`;
        }
        
        // Stopped agents
        const stoppedAgents = results.agents.filter(a => a.status !== 'running');
        if (stoppedAgents.length > 0) {
            message += `🤖 Agent Issues:\n`;
            stoppedAgents.forEach(a => {
                message += `  • ${a.name}: ${a.status}\n`;
            });
        }
        
        return message;
    }

    async sendEmailAlert(message, results) {
        // Implement SendGrid email sending
        console.log('📧 Email alert would be sent');
    }

    async sendSMSAlert(message, results) {
        // Implement Twilio SMS sending
        console.log('📱 SMS alert would be sent');
    }

    async sendSlackAlert(message, results) {
        // Implement Slack webhook
        console.log('💬 Slack alert would be sent');
    }

    // Generate health dashboard
    async generateDashboard() {
        const dashboard = `<!DOCTYPE html>
<html>
<head>
    <title>Blaze Intelligence - Health Dashboard</title>
    <meta http-equiv="refresh" content="60">
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, sans-serif; margin: 40px; background: #0a0a0a; color: white; }
        .status { padding: 20px; margin: 20px 0; border-radius: 8px; }
        .healthy { background: #1d4b39; border-left: 4px solid #22c55e; }
        .degraded { background: #4b3d1d; border-left: 4px solid #f59e0b; }
        .critical { background: #4b1d1d; border-left: 4px solid #ef4444; }
        .metric { display: inline-block; margin: 10px 20px 10px 0; }
        .timestamp { color: #999; font-size: 14px; }
    </style>
</head>
<body>
    <h1>🔥 Blaze Intelligence Health Dashboard</h1>
    
    ${this.healthHistory.length > 0 ? this.renderHealthStatus(this.healthHistory[0]) : '<p>No health data available</p>'}
    
    <h2>Recent History</h2>
    ${this.healthHistory.slice(0, 10).map(h => `
        <div class="status ${h.overall}">
            <strong>${h.overall.toUpperCase()}</strong> - ${h.timestamp}
        </div>
    `).join('')}
    
</body>
</html>`;
        
        await fs.mkdir('monitoring', { recursive: true });
        await fs.writeFile('monitoring/dashboard.html', dashboard);
        
        return dashboard;
    }

    renderHealthStatus(results) {
        return `
    <div class="status ${results.overall}">
        <h2>Current Status: ${results.overall.toUpperCase()}</h2>
        <div class="timestamp">Last check: ${results.timestamp}</div>
        
        <h3>Endpoints</h3>
        ${results.endpoints.map(e => `
            <div class="metric">
                <strong>${e.name}:</strong> ${e.status} 
                ${e.responseTime ? `(${e.responseTime}ms)` : ''}
            </div>
        `).join('')}
        
        <h3>Data Freshness</h3>
        ${results.dataFiles.map(d => `
            <div class="metric">
                <strong>${d.name}:</strong> ${d.status}
                ${d.age ? `(${Math.round(d.age / 60000)}min ago)` : ''}
            </div>
        `).join('')}
        
        <h3>Agents</h3>
        ${results.agents.map(a => `
            <div class="metric">
                <strong>${a.name}:</strong> ${a.status}
                ${a.pid ? `(PID: ${a.pid})` : ''}
            </div>
        `).join('')}
    </div>`;
    }
}

// Command line interface
if (require.main === module) {
    const monitor = new HealthMonitor();
    
    const command = process.argv[2];
    
    switch (command) {
        case 'check':
            monitor.runHealthCheck().then(results => {
                console.log('Health check complete:', results.overall);
                process.exit(results.overall === 'critical' ? 1 : 0);
            });
            break;
            
        case 'dashboard':
            monitor.generateDashboard().then(() => {
                console.log('Dashboard generated at monitoring/dashboard.html');
            });
            break;
            
        case 'watch':
            console.log('🔍 Starting continuous health monitoring...');
            setInterval(async () => {
                await monitor.runHealthCheck();
                await monitor.generateDashboard();
            }, 60000); // Every minute
            break;
            
        default:
            console.log('Usage: node health-monitor.js [check|dashboard|watch]');
            break;
    }
}

module.exports = HealthMonitor;