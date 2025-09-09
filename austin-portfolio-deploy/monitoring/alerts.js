// Blaze Intelligence Monitoring & Alerts System

const fs = require('fs').promises;
const path = require('path');

class BlazeMonitoring {
    constructor() {
        this.alertThresholds = {
            uptime: 99.0,          // Alert if uptime < 99%
            responseTime: 2000,    // Alert if response > 2s
            errorRate: 0.05,       // Alert if error rate > 5%
            agentFailures: 3       // Alert if agent fails 3 times
        };
        this.logPath = '/Users/AustinHumphrey/logs';
        this.alertHistory = [];
    }

    async checkSystemHealth() {
        const health = {
            timestamp: new Date().toISOString(),
            uptime: await this.checkUptime(),
            agents: await this.checkAgents(),
            apis: await this.checkAPIs(),
            errors: await this.checkErrors()
        };

        const alerts = await this.generateAlerts(health);
        
        if (alerts.length > 0) {
            await this.sendAlerts(alerts);
        }

        await this.logHealthStatus(health);
        return health;
    }

    async checkUptime() {
        try {
            const deployments = await this.getRecentDeployments();
            const uptime = deployments.length > 0 ? 99.9 : 95.0;
            return {
                status: uptime >= this.alertThresholds.uptime ? 'healthy' : 'warning',
                value: uptime,
                deployments: deployments.length
            };
        } catch (error) {
            return { status: 'error', value: 0, error: error.message };
        }
    }

    async checkAgents() {
        const agents = {
            cardinals: await this.checkAgentHealth('readiness-board.log'),
            autopilot: await this.checkAgentHealth('autopilot.log')
        };

        return agents;
    }

    async checkAgentHealth(logFile) {
        try {
            const logPath = path.join(this.logPath, logFile);
            const logs = await fs.readFile(logPath, 'utf8');
            const lines = logs.split('\\n').filter(l => l.trim());
            const recentLines = lines.slice(-10);
            
            const hasErrors = recentLines.some(line => 
                line.includes('error') || line.includes('Error') || line.includes('failed')
            );
            
            const lastUpdate = this.extractLastTimestamp(recentLines);
            const minutesSinceUpdate = lastUpdate ? 
                (Date.now() - new Date(lastUpdate).getTime()) / (1000 * 60) : 999;

            return {
                status: hasErrors ? 'error' : minutesSinceUpdate > 60 ? 'stale' : 'healthy',
                lastUpdate,
                minutesSinceUpdate: Math.round(minutesSinceUpdate),
                errors: hasErrors
            };
        } catch (error) {
            return { status: 'error', error: error.message };
        }
    }

    async checkAPIs() {
        // Simulate API health checks
        const apis = {
            mlb: { status: 'healthy', responseTime: 150 },
            espn: { status: 'healthy', responseTime: 200 },
            nil: { status: 'healthy', responseTime: 50 },
            perfectGame: { status: 'healthy', responseTime: 100 }
        };
        
        return apis;
    }

    async checkErrors() {
        try {
            const errorLog = path.join(this.logPath, 'daily.log');
            const logs = await fs.readFile(errorLog, 'utf8');
            const lines = logs.split('\\n');
            const recentErrors = lines.filter(line => 
                line.includes('[ERROR]') || line.includes('ERROR:')
            ).slice(-5);

            return {
                status: recentErrors.length > this.alertThresholds.agentFailures ? 'warning' : 'healthy',
                count: recentErrors.length,
                recentErrors
            };
        } catch (error) {
            return { status: 'unknown', error: error.message };
        }
    }

    async generateAlerts(health) {
        const alerts = [];

        // Uptime alerts
        if (health.uptime.status === 'warning') {
            alerts.push({
                type: 'uptime',
                severity: 'warning',
                message: `System uptime below threshold: ${health.uptime.value}%`
            });
        }

        // Agent alerts  
        Object.entries(health.agents).forEach(([name, agent]) => {
            if (agent.status === 'error') {
                alerts.push({
                    type: 'agent',
                    severity: 'critical',
                    message: `${name} agent failed: ${agent.error}`
                });
            } else if (agent.status === 'stale') {
                alerts.push({
                    type: 'agent',
                    severity: 'warning', 
                    message: `${name} agent stale: ${agent.minutesSinceUpdate} min since update`
                });
            }
        });

        return alerts;
    }

    async sendAlerts(alerts) {
        const alertData = {
            timestamp: new Date().toISOString(),
            alerts,
            system: 'blaze-intelligence'
        };

        // Log alerts
        console.log('🚨 BLAZE INTELLIGENCE ALERTS:');
        alerts.forEach(alert => {
            console.log(`  ${alert.severity.toUpperCase()}: ${alert.message}`);
        });

        // Save alert history
        const alertFile = path.join(this.logPath, 'alerts.json');
        this.alertHistory.push(alertData);
        await fs.writeFile(alertFile, JSON.stringify(this.alertHistory.slice(-50), null, 2));
        
        // In production: send to Slack, email, etc.
        return alertData;
    }

    async logHealthStatus(health) {
        const statusFile = path.join(this.logPath, 'health-status.json');
        await fs.writeFile(statusFile, JSON.stringify(health, null, 2));
    }

    extractLastTimestamp(lines) {
        for (let i = lines.length - 1; i >= 0; i--) {
            const match = lines[i].match(/\\[(\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\\.\\d{3}Z)\\]/);
            if (match) return match[1];
        }
        return null;
    }

    async getRecentDeployments() {
        // Simulate deployment check
        return Array.from({length: 5}, (_, i) => ({
            id: `deployment-${i}`,
            timestamp: new Date(Date.now() - i * 3600000).toISOString()
        }));
    }
}

// CLI interface
if (require.main === module) {
    const monitor = new BlazeMonitoring();
    monitor.checkSystemHealth()
        .then(health => {
            console.log('✅ System health check complete');
            console.log(JSON.stringify(health, null, 2));
        })
        .catch(error => {
            console.error('❌ Health check failed:', error);
            process.exit(1);
        });
}

module.exports = BlazeMonitoring;