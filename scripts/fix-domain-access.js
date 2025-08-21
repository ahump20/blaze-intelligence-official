#!/usr/bin/env node

/**
 * Blaze Intelligence - Domain Access Fix
 * Removes Cloudflare Access restrictions and ensures proper routing
 */

const { exec } = require('child_process');
const { promisify } = require('util');
const execAsync = promisify(exec);

class DomainAccessFixer {
    constructor() {
        this.domain = 'blaze-intelligence.com';
        this.projectName = 'blaze-intelligence';
    }

    async checkCurrentDomainStatus() {
        try {
            console.log('🔍 Checking current domain status...');
            
            // Check domain DNS
            const { stdout: dnsResult } = await execAsync(`dig +short ${this.domain}`);
            console.log(`DNS Resolution: ${dnsResult.trim()}`);
            
            // Check HTTP response
            const curlCommand = `curl -I https://${this.domain}/ 2>/dev/null | head -n 3`;
            const { stdout: httpResult } = await execAsync(curlCommand);
            console.log('HTTP Response Headers:');
            console.log(httpResult);
            
            return {
                dns: dnsResult.trim(),
                http: httpResult
            };
            
        } catch (error) {
            console.error('❌ Domain check failed:', error.message);
            return null;
        }
    }

    async checkPagesDeployment() {
        try {
            console.log('📄 Checking Pages deployment...');
            
            const { stdout } = await execAsync(`npx wrangler pages deployment list --project-name ${this.projectName}`);
            
            // Find the latest production deployment
            const lines = stdout.split('\n');
            const prodDeployments = lines.filter(line => line.includes('Production'));
            
            if (prodDeployments.length > 0) {
                console.log('Latest Production Deployments:');
                prodDeployments.slice(0, 3).forEach(deployment => {
                    const match = deployment.match(/https:\/\/([a-f0-9]+)\.blaze-intelligence\.pages\.dev/);
                    if (match) {
                        console.log(`  • ${match[0]}`);
                    }
                });
            }
            
            return true;
            
        } catch (error) {
            console.error('❌ Pages check failed:', error.message);
            return false;
        }
    }

    async fixDomainSettings() {
        console.log('🔧 Attempting to fix domain settings...');
        
        try {
            // Try to remove any access policies (this might require manual dashboard access)
            console.log('⚠️  Manual steps may be required:');
            console.log('1. Go to Cloudflare Dashboard → Zero Trust → Access');
            console.log('2. Remove any policies blocking blaze-intelligence.com');
            console.log('3. Go to Pages → blaze-intelligence → Custom domains');
            console.log('4. Verify domain is properly configured');
            
            // Alternative: Try deploying without access restrictions
            console.log('\n🚀 Deploying fresh version to ensure no access blocks...');
            
            const deployCommand = `npx wrangler pages deploy ./dist --project-name ${this.projectName} --branch main --commit-dirty=true`;
            const { stdout: deployResult } = await execAsync(deployCommand);
            
            console.log('✅ Fresh deployment completed');
            
            // Extract deployment URL
            const urlMatch = deployResult.match(/https:\/\/[a-f0-9]+\.blaze-intelligence\.pages\.dev/);
            if (urlMatch) {
                console.log(`📍 New deployment URL: ${urlMatch[0]}`);
                return urlMatch[0];
            }
            
        } catch (error) {
            console.error('❌ Fix attempt failed:', error.message);
            return null;
        }
    }

    async testDomainAfterFix() {
        console.log('🧪 Testing domain after fixes...');
        
        // Wait a moment for propagation
        await new Promise(resolve => setTimeout(resolve, 5000));
        
        try {
            // Test custom domain
            const customDomainTest = `curl -w "HTTP Code: %{http_code}, TTFB: %{time_starttransfer}s" -o /dev/null -s https://${this.domain}/`;
            const { stdout: customResult } = await execAsync(customDomainTest);
            console.log(`Custom Domain (${this.domain}): ${customResult}`);
            
            // Test Pages domain
            const pagesDomainTest = `curl -w "HTTP Code: %{http_code}, TTFB: %{time_starttransfer}s" -o /dev/null -s https://blaze-intelligence.pages.dev/`;
            const { stdout: pagesResult } = await execAsync(pagesDomainTest);
            console.log(`Pages Domain: ${pagesResult}`);
            
            return {
                customDomain: customResult,
                pagesDomain: pagesResult
            };
            
        } catch (error) {
            console.error('❌ Domain test failed:', error.message);
            return null;
        }
    }

    async generateDomainReport() {
        console.log('\n📊 DOMAIN STATUS REPORT');
        console.log('='.repeat(50));
        
        const status = await this.checkCurrentDomainStatus();
        await this.checkPagesDeployment();
        
        const testResults = await this.testDomainAfterFix();
        
        console.log('\n🎯 RECOMMENDATIONS:');
        
        if (status && status.http.includes('403')) {
            console.log('❌ Domain blocked by Cloudflare Access');
            console.log('   → Remove Access policies in Cloudflare Dashboard');
            console.log('   → Go to Zero Trust → Access → Remove domain policies');
        }
        
        if (status && status.http.includes('302')) {
            console.log('⚠️  Domain redirecting (possible Access login)');
            console.log('   → Check redirect destination');
            console.log('   → Verify no authentication required');
        }
        
        console.log('\n📋 Manual Steps Required:');
        console.log('1. Cloudflare Dashboard → Zero Trust → Access');
        console.log('2. Look for policies affecting blaze-intelligence.com');
        console.log('3. Delete or modify restrictive policies');
        console.log('4. Test domain access after changes');
        
        console.log('\n🔗 Quick Test URLs:');
        console.log(`   • Custom Domain: https://${this.domain}/`);
        console.log('   • Pages Domain: https://blaze-intelligence.pages.dev/');
        console.log('   • Latest Deploy: https://5c2ee19b.blaze-intelligence.pages.dev/');
    }

    async runFullDomainFix() {
        console.log('🔥 Blaze Intelligence Domain Access Fix');
        console.log('=' .repeat(50));
        
        try {
            await this.checkCurrentDomainStatus();
            await this.checkPagesDeployment();
            
            const newDeploymentUrl = await this.fixDomainSettings();
            
            if (newDeploymentUrl) {
                console.log(`✅ New deployment available: ${newDeploymentUrl}`);
            }
            
            await this.generateDomainReport();
            
            return true;
            
        } catch (error) {
            console.error('❌ Domain fix failed:', error.message);
            return false;
        }
    }
}

// CLI interface
if (require.main === module) {
    const fixer = new DomainAccessFixer();
    const command = process.argv[2];
    
    switch (command) {
        case 'check':
            fixer.checkCurrentDomainStatus()
                .then(() => fixer.checkPagesDeployment())
                .then(() => process.exit(0))
                .catch(error => {
                    console.error('Check failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'fix':
            fixer.runFullDomainFix()
                .then(success => process.exit(success ? 0 : 1))
                .catch(error => {
                    console.error('Fix failed:', error.message);
                    process.exit(1);
                });
            break;
            
        case 'test':
            fixer.testDomainAfterFix()
                .then(() => process.exit(0))
                .catch(error => {
                    console.error('Test failed:', error.message);
                    process.exit(1);
                });
            break;
            
        default:
            console.log(`
🔥 Blaze Intelligence Domain Access Fix

Usage: node fix-domain-access.js [command]

Commands:
  check    - Check current domain status
  fix      - Run full domain fix process
  test     - Test domain access

Examples:
  node fix-domain-access.js check
  node fix-domain-access.js fix
            `);
            break;
    }
}

module.exports = DomainAccessFixer;