#!/bin/bash

# Blaze Intelligence Mailgun Setup Script
# This script configures Mailgun API credentials for email automation

echo "============================================"
echo "Blaze Intelligence Email Service Setup"
echo "============================================"
echo ""

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo "❌ Wrangler CLI not found. Installing..."
    npm install -g wrangler
fi

echo "📧 Setting up Mailgun configuration..."
echo ""
echo "You'll need the following from your Mailgun account:"
echo "1. API Key (starts with 'key-')"
echo "2. Domain (e.g., mg.blaze-intelligence.com)"
echo "3. From email (e.g., noreply@blaze-intelligence.com)"
echo ""

# Create environment variables file for local testing
cat > .env.email << 'EOF'
# Mailgun Configuration
# Replace these with your actual Mailgun credentials
MAILGUN_API_KEY=key-YOUR_ACTUAL_KEY_HERE
MAILGUN_DOMAIN=mg.blaze-intelligence.com
MAILGUN_FROM_EMAIL=noreply@blaze-intelligence.com
MAILGUN_REGION=US  # or EU

# Email Settings
EMAIL_REPLY_TO=ahump20@outlook.com
EMAIL_ADMIN_NOTIFY=ahump20@outlook.com

# Test Mode (set to false in production)
EMAIL_TEST_MODE=true
EOF

echo "✅ Created .env.email file for local configuration"
echo ""

# Create KV namespaces for email data
echo "📦 Creating KV namespaces for email storage..."

# Create namespaces
wrangler kv:namespace create "EMAIL_SUBSCRIBERS" 2>/dev/null || echo "EMAIL_SUBSCRIBERS namespace already exists"
wrangler kv:namespace create "EMAIL_EVENTS" 2>/dev/null || echo "EMAIL_EVENTS namespace already exists"
wrangler kv:namespace create "LEADS" 2>/dev/null || echo "LEADS namespace already exists"

echo ""
echo "🔐 Setting up Cloudflare Worker secrets..."
echo "Run these commands with your actual values:"
echo ""
echo "# Set Mailgun API Key"
echo "wrangler secret put MAILGUN_API_KEY"
echo ""
echo "# Set Mailgun Domain"
echo "wrangler secret put MAILGUN_DOMAIN"
echo ""
echo "# Set Admin Email"
echo "wrangler secret put ADMIN_EMAIL"
echo ""

# Create test email script
cat > test-email.js << 'EOF'
/**
 * Test Email Sending Script
 * Run this to verify Mailgun configuration
 */

const fetch = require('node-fetch');
require('dotenv').config({ path: '.env.email' });

async function testEmailSend() {
    const mailgunUrl = `https://api.mailgun.net/v3/${process.env.MAILGUN_DOMAIN}/messages`;
    
    const testEmail = {
        from: process.env.MAILGUN_FROM_EMAIL || 'test@blaze-intelligence.com',
        to: process.env.EMAIL_ADMIN_NOTIFY || 'ahump20@outlook.com',
        subject: 'Blaze Intelligence Email Test',
        html: `
            <h2>Email Configuration Test Successful!</h2>
            <p>This is a test email from your Blaze Intelligence email system.</p>
            <p>If you're seeing this, your Mailgun configuration is working correctly.</p>
            <hr>
            <p><small>Sent at: ${new Date().toISOString()}</small></p>
        `
    };
    
    try {
        const response = await fetch(mailgunUrl, {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + Buffer.from('api:' + process.env.MAILGUN_API_KEY).toString('base64')
            },
            body: new URLSearchParams(testEmail)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            console.log('✅ Test email sent successfully!');
            console.log('Message ID:', result.id);
        } else {
            console.error('❌ Failed to send test email:', result.message);
        }
    } catch (error) {
        console.error('❌ Error sending test email:', error.message);
    }
}

// Run test
console.log('📧 Sending test email...');
testEmailSend();
EOF

echo "✅ Created test-email.js script"
echo ""

# Create email templates directory
mkdir -p email-templates

# Create welcome email template
cat > email-templates/welcome.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <style>
        body { font-family: 'Inter', Arial, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #BF5700, #FF8C00); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; padding: 12px 30px; background: #FF8C00; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .metrics { display: flex; justify-content: space-around; margin: 20px 0; }
        .metric { text-align: center; }
        .metric-value { font-size: 24px; font-weight: bold; color: #BF5700; }
        .metric-label { font-size: 12px; color: #666; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Welcome to Blaze Intelligence!</h1>
            <p>Championship-Level Sports Analytics</p>
        </div>
        
        <div class="content">
            <h2>Hi {{firstName}},</h2>
            
            <p>Welcome to the future of sports analytics! You're now part of an exclusive group of teams and organizations using data to dominate their competition.</p>
            
            <div class="metrics">
                <div class="metric">
                    <div class="metric-value">74.6%</div>
                    <div class="metric-label">Prediction Accuracy</div>
                </div>
                <div class="metric">
                    <div class="metric-value">2.8M+</div>
                    <div class="metric-label">Data Points</div>
                </div>
                <div class="metric">
                    <div class="metric-value">73%</div>
                    <div class="metric-label">Cost Savings</div>
                </div>
            </div>
            
            <p><strong>What's Next?</strong></p>
            <ul>
                <li>Explore our live demo with real team data</li>
                <li>Calculate your potential ROI</li>
                <li>Schedule a personalized consultation</li>
            </ul>
            
            <center>
                <a href="https://blaze-intelligence-lsl.pages.dev/demo.html" class="button">Explore Live Demo</a>
            </center>
            
            <p>Have questions? Simply reply to this email and I'll personally help you get started.</p>
            
            <p>Best regards,<br>
            Austin Humphrey<br>
            Founder & Chief Analytics Officer</p>
        </div>
        
        <div class="footer">
            <p>Blaze Intelligence | Where Cognitive Performance Meets Quarterly Performance</p>
            <p><a href="{{unsubscribeUrl}}">Unsubscribe</a> | <a href="https://blaze-intelligence-lsl.pages.dev">Visit Website</a></p>
        </div>
    </div>
</body>
</html>
EOF

echo "✅ Created email templates"
echo ""

# Create monitoring script
cat > monitor-emails.js << 'EOF'
/**
 * Email Monitoring Dashboard
 * Shows email sending statistics and queue status
 */

async function getEmailStats() {
    // This would connect to your KV store to get stats
    console.log('📊 Email Statistics Dashboard');
    console.log('================================');
    console.log('Total Subscribers: N/A (configure KV first)');
    console.log('Emails Sent Today: N/A');
    console.log('Open Rate: N/A');
    console.log('Click Rate: N/A');
    console.log('');
    console.log('Recent Events:');
    console.log('- Configure KV namespace to see events');
}

getEmailStats();
EOF

echo "✅ Created monitoring script"
echo ""
echo "============================================"
echo "✅ Email Service Setup Complete!"
echo "============================================"
echo ""
echo "Next steps:"
echo "1. Edit .env.email with your actual Mailgun credentials"
echo "2. Run: npm install node-fetch dotenv"
echo "3. Test configuration: node test-email.js"
echo "4. Set Worker secrets using the commands above"
echo "5. Deploy workers: wrangler publish"
echo ""
echo "📚 Documentation: https://blaze-intelligence-lsl.pages.dev/api-docs.html"