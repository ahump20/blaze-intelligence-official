#!/usr/bin/env node

// Force domain activation using Cloudflare APIs and wrangler commands

const { execSync } = require('child_process');

async function forceDomainActivation() {
    console.log('🚀 FORCE DOMAIN ACTIVATION - Blaze Intelligence');
    console.log('===============================================');
    
    const DOMAIN = 'blaze-intelligence.com';
    const ACCOUNT_ID = 'a12cb329d84130460eed99b816e4d0d3';
    const PROJECT_NAME = 'blaze-intelligence';
    
    try {
        // Method 1: Try to list and remove Access applications via wrangler
        console.log('\n1️⃣ Checking for Access applications...');
        try {
            const accessApps = execSync('wrangler access list 2>/dev/null', { encoding: 'utf8' });
            if (accessApps.includes(DOMAIN)) {
                console.log(`   Found Access app for ${DOMAIN}`);
                // Try to remove it (if command exists)
                try {
                    execSync(`wrangler access delete ${DOMAIN} --force`, { stdio: 'inherit' });
                    console.log('   ✅ Access app removed');
                } catch (e) {
                    console.log('   ⚠️  Could not remove Access app automatically');
                }
            } else {
                console.log('   ℹ️  No Access apps found');
            }
        } catch (e) {
            console.log('   ℹ️  Access commands not available in this wrangler version');
        }
        
        // Method 2: Try Pages domain commands
        console.log('\n2️⃣ Adding custom domain to Pages project...');
        try {
            execSync(`wrangler pages project domain add ${DOMAIN} --project-name=${PROJECT_NAME}`, { stdio: 'inherit' });
            console.log('   ✅ Domain added to Pages project');
        } catch (e) {
            console.log('   ⚠️  Pages domain command failed - trying alternative method');
            
            // Alternative: Try to set up DNS records manually
            console.log('   🔧 Setting up DNS manually...');
            try {
                execSync(`wrangler dns record create ${DOMAIN} CNAME @ ${PROJECT_NAME}.pages.dev --proxied`, { stdio: 'inherit' });
                console.log('   ✅ DNS record created');
            } catch (e2) {
                console.log('   ⚠️  DNS record creation failed');
            }
        }
        
        // Method 3: Wait and test domain
        console.log('\n3️⃣ Testing domain activation...');
        console.log('   Waiting 30 seconds for propagation...');
        
        await new Promise(resolve => setTimeout(resolve, 30000));
        
        console.log('   Testing domain accessibility...');
        try {
            const response = await fetch(`https://${DOMAIN}/`);
            console.log(`   Response: HTTP ${response.status}`);
            
            if (response.status === 200) {
                console.log('   🎉 SUCCESS! Domain is now accessible!');
                return true;
            } else if (response.status === 403) {
                console.log('   ⚠️  Still blocked by Access');
                return false;
            } else {
                console.log(`   📊 Status: ${response.status}`);
                return false;
            }
        } catch (error) {
            console.log('   ❌ Domain test failed:', error.message);
            return false;
        }
        
    } catch (error) {
        console.error('❌ Force activation failed:', error);
        return false;
    }
}

// Install fetch if needed
if (typeof fetch === 'undefined') {
    console.log('Installing node-fetch...');
    execSync('npm install node-fetch@2', { stdio: 'inherit' });
    global.fetch = require('node-fetch');
}

forceDomainActivation().then(success => {
    if (success) {
        console.log('\n🎉 DOMAIN ACTIVATION COMPLETE!');
        console.log(`✅ ${process.env.DOMAIN || 'blaze-intelligence.com'} is now LIVE!`);
    } else {
        console.log('\n⚠️  Domain activation requires manual intervention');
        console.log('🔧 Please complete manual steps in Cloudflare Dashboard');
    }
});