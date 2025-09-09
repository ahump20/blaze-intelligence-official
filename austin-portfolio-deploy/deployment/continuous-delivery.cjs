// Blaze Intelligence Continuous Delivery Pipeline

const fs = require('fs').promises;
const { execSync } = require('child_process');
const path = require('path');

class ContinuousDelivery {
    constructor() {
        this.config = {
            branch: 'main',
            preDeployChecks: ['test', 'lint', 'security'],
            rollbackThreshold: 3, // Auto-rollback after 3 failed health checks
            deploymentCooldown: 300000, // 5 minutes between deployments
            healthCheckUrl: 'https://blaze-intelligence.pages.dev/api/health'
        };
        this.lockFile = '/tmp/blaze-deployment.lock';
        this.deploymentLog = '/Users/AustinHumphrey/logs/deployment.log';
    }

    async deployWithLock() {
        // Check if deployment is already in progress
        if (await this.isDeploymentLocked()) {
            throw new Error('Deployment already in progress');
        }

        await this.createDeploymentLock();
        
        try {
            const result = await this.executeDeployment();
            await this.releaseDeploymentLock();
            return result;
        } catch (error) {
            await this.releaseDeploymentLock();
            throw error;
        }
    }

    async executeDeployment() {
        const deploymentId = `deploy-${Date.now()}`;
        const startTime = new Date().toISOString();

        this.log(`[${deploymentId}] Starting continuous delivery pipeline`, startTime);

        try {
            // Pre-deployment validation
            await this.runPreDeploymentChecks();
            this.log(`[${deploymentId}] Pre-deployment checks passed`);

            // Git validation
            const gitStatus = await this.validateGitStatus();
            this.log(`[${deploymentId}] Git validation: ${gitStatus.clean ? 'clean' : 'dirty'}`);

            // Deploy to Cloudflare Pages
            const deployment = await this.deployToCloudflare();
            this.log(`[${deploymentId}] Deployed to: ${deployment.url}`);

            // Post-deployment health checks
            await this.runHealthChecks(deployment.url);
            this.log(`[${deploymentId}] Health checks passed`);

            // Update production config
            await this.updateProductionConfig(deployment);

            const endTime = new Date().toISOString();
            const deploymentSummary = {
                id: deploymentId,
                startTime,
                endTime,
                duration: Date.parse(endTime) - Date.parse(startTime),
                status: 'success',
                url: deployment.url,
                build: deployment.build
            };

            this.log(`[${deploymentId}] Deployment successful in ${deploymentSummary.duration}ms`);
            
            return deploymentSummary;

        } catch (error) {
            this.log(`[${deploymentId}] Deployment failed: ${error.message}`, 'ERROR');
            throw error;
        }
    }

    async runPreDeploymentChecks() {
        const checks = [];

        // Security scan
        try {
            execSync('git secrets --scan', { cwd: process.cwd(), stdio: 'pipe' });
            checks.push({ name: 'security', status: 'passed' });
        } catch (error) {
            checks.push({ name: 'security', status: 'failed', error: error.message });
        }

        // File structure validation
        const requiredFiles = ['package.json', 'index.html', 'api/live-connections.js'];
        for (const file of requiredFiles) {
            try {
                await fs.access(file);
                checks.push({ name: `file-${file}`, status: 'passed' });
            } catch (error) {
                checks.push({ name: `file-${file}`, status: 'failed' });
            }
        }

        const failures = checks.filter(c => c.status === 'failed');
        if (failures.length > 0) {
            throw new Error(`Pre-deployment checks failed: ${failures.map(f => f.name).join(', ')}`);
        }

        return checks;
    }

    async validateGitStatus() {
        try {
            const status = execSync('git status --porcelain', { encoding: 'utf8' });
            const branch = execSync('git branch --show-current', { encoding: 'utf8' }).trim();
            
            return {
                clean: status.trim().length === 0,
                branch,
                uncommittedChanges: status.split('\n').filter(l => l.trim()).length
            };
        } catch (error) {
            throw new Error(`Git validation failed: ${error.message}`);
        }
    }

    async deployToCloudflare() {
        try {
            const output = execSync('wrangler pages deploy --project-name blaze-intelligence', {
                encoding: 'utf8',
                cwd: process.cwd(),
                timeout: 300000 // 5 minute timeout
            });

            // Parse deployment URL from wrangler output
            const urlMatch = output.match(/https:\/\/([a-f0-9]{8})\.blaze-intelligence\.pages\.dev/);
            const buildMatch = output.match(/Deployment complete! Take a peek over at (https:\/\/[^\s]+)/);
            
            if (!urlMatch) {
                throw new Error('Could not parse deployment URL from wrangler output');
            }

            return {
                url: urlMatch[0],
                build: urlMatch[1],
                output
            };
        } catch (error) {
            throw new Error(`Cloudflare deployment failed: ${error.message}`);
        }
    }

    async runHealthChecks(url) {
        const healthChecks = [
            { name: 'basic-connectivity', url: url },
            { name: 'api-health', url: `${url}/api/health` },
            { name: 'data-freshness', url: `${url}/data/live/mlb-cardinals-live.json` }
        ];

        for (const check of healthChecks) {
            try {
                const response = await fetch(check.url, { 
                    timeout: 10000,
                    headers: { 'User-Agent': 'Blaze-CD-Pipeline/1.0' }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }

                this.log(`Health check ${check.name}: PASSED`);
            } catch (error) {
                throw new Error(`Health check ${check.name} failed: ${error.message}`);
            }
        }
    }

    async updateProductionConfig(deployment) {
        const config = {
            environment: 'production',
            version: '2.1.0',
            build: deployment.build,
            url: deployment.url,
            deployedAt: new Date().toISOString(),
            pipeline: {
                checks: ['security', 'structure', 'health'],
                status: 'active'
            }
        };

        await fs.writeFile(
            '/Users/AustinHumphrey/austin-portfolio-deploy/config/production.json',
            JSON.stringify(config, null, 2)
        );
    }

    async isDeploymentLocked() {
        try {
            await fs.access(this.lockFile);
            return true;
        } catch {
            return false;
        }
    }

    async createDeploymentLock() {
        await fs.writeFile(this.lockFile, JSON.stringify({
            pid: process.pid,
            timestamp: new Date().toISOString()
        }));
    }

    async releaseDeploymentLock() {
        try {
            await fs.unlink(this.lockFile);
        } catch (error) {
            // Lock file might not exist
        }
    }

    async log(message, level = 'INFO') {
        const timestamp = new Date().toISOString();
        const logEntry = `[${timestamp}] [${level}] ${message}\n`;
        
        console.log(logEntry.trim());
        
        try {
            await fs.appendFile(this.deploymentLog, logEntry);
        } catch (error) {
            console.error('Failed to write to deployment log:', error.message);
        }
    }

    async createSnapshot() {
        const snapshot = {
            timestamp: new Date().toISOString(),
            git: {
                commit: execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(),
                branch: execSync('git branch --show-current', { encoding: 'utf8' }).trim()
            },
            config: JSON.parse(await fs.readFile('./config/production.json', 'utf8')),
            agents: {
                status: 'captured',
                crontab: execSync('crontab -l', { encoding: 'utf8' })
            }
        };

        const snapshotPath = `./deployment/snapshots/snapshot-${Date.now()}.json`;
        await fs.mkdir('./deployment/snapshots', { recursive: true });
        await fs.writeFile(snapshotPath, JSON.stringify(snapshot, null, 2));
        
        return { path: snapshotPath, snapshot };
    }
}

// CLI interface
if (require.main === module) {
    const cd = new ContinuousDelivery();
    const action = process.argv[2];

    if (action === 'deploy') {
        cd.deployWithLock()
            .then(result => {
                console.log('✅ Deployment successful:', result);
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Deployment failed:', error.message);
                process.exit(1);
            });
    } else if (action === 'snapshot') {
        cd.createSnapshot()
            .then(result => {
                console.log('✅ Snapshot created:', result.path);
                process.exit(0);
            })
            .catch(error => {
                console.error('❌ Snapshot failed:', error.message);
                process.exit(1);
            });
    } else {
        console.log('Usage: node continuous-delivery.js [deploy|snapshot]');
        process.exit(1);
    }
}

module.exports = ContinuousDelivery;