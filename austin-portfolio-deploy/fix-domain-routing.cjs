#!/usr/bin/env node

// Script to fix domain routing issue - force proper connection

const { execSync } = require('child_process');

async function fixDomainRouting() {
    console.log('🔧 FIXING BLAZE INTELLIGENCE DOMAIN ROUTING');
    console.log('==========================================');
    
    const DOMAIN = 'blaze-intelligence.com';
    const PROJECT = 'blaze-intelligence';
    
    try {
        // Step 1: Check current projects
        console.log('\n1️⃣ Checking Pages projects...');
        const projectsList = execSync('wrangler pages project list', { encoding: 'utf8' });
        console.log(projectsList);
        
        // Step 2: Check current deployment
        console.log('\n2️⃣ Checking latest deployment...');
        const deployments = execSync(`wrangler pages deployment list --project-name=${PROJECT}`, { encoding: 'utf8' });
        console.log(deployments);
        
        // Step 3: Try to get project info
        console.log('\n3️⃣ Getting project details...');
        try {
            const projectInfo = execSync(`wrangler pages project info ${PROJECT}`, { encoding: 'utf8' });
            console.log(projectInfo);
        } catch (e) {
            console.log('   Project info command not available in this wrangler version');
        }
        
        // Step 4: Force a new deployment to ensure latest is active
        console.log('\n4️⃣ Force deploying to ensure latest version is active...');
        const deployResult = execSync(`wrangler pages deploy . --project-name=${PROJECT} --commit-dirty=true`, { encoding: 'utf8' });
        console.log(deployResult);
        
        // Extract the new deployment URL
        const urlMatch = deployResult.match(/https:\/\/([a-f0-9]+)\.blaze-intelligence\.pages\.dev/);
        if (urlMatch) {
            const newUrl = urlMatch[0];
            console.log(`\n✅ New deployment URL: ${newUrl}`);
            
            // Test the new deployment
            console.log('\n5️⃣ Testing new deployment...');
            const testResponse = await fetch(newUrl);
            if (testResponse.ok) {
                const content = await testResponse.text();
                if (content.includes('Blaze Intelligence')) {
                    console.log('   ✅ New deployment contains full site');
                } else {
                    console.log('   ⚠️  New deployment may have issues');
                }
            }
        }
        
        console.log('\n6️⃣ Domain should update within 5-15 minutes');
        console.log('   The custom domain routing is handled by Cloudflare automatically');
        console.log('   Latest deployment will be served once DNS propagates');
        
    } catch (error) {
        console.error('❌ Error:', error.message);
    }
}

// Install fetch if needed
if (typeof fetch === 'undefined') {
    console.log('Installing node-fetch...');
    execSync('npm install node-fetch@2', { stdio: 'inherit' });
    global.fetch = require('node-fetch');
}

fixDomainRouting();