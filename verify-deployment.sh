#!/bin/bash

# Blaze Intelligence Deployment Verification Script
# Run this after deployment to verify all systems are working

echo "🔥 Blaze Intelligence - Deployment Verification"
echo "=============================================="
echo ""

# Function to check URL response
check_url() {
    local url=$1
    local description=$2
    
    echo -n "Checking $description... "
    
    if curl -s --head "$url" | grep -q "200 OK"; then
        echo "✅ OK"
        return 0
    else
        echo "❌ FAILED"
        return 1
    fi
}

# Function to check if string exists in page
check_content() {
    local url=$1
    local search_string=$2
    local description=$3
    
    echo -n "Checking $description... "
    
    if curl -s "$url" | grep -q "$search_string"; then
        echo "✅ OK"
        return 0
    else
        echo "❌ NOT FOUND"
        return 1
    fi
}

# Get deployment URL from user
echo "Enter your deployment URL (e.g., https://your-site.vercel.app):"
read -r DEPLOYMENT_URL

if [ -z "$DEPLOYMENT_URL" ]; then
    echo "❌ No URL provided. Exiting..."
    exit 1
fi

echo ""
echo "🔍 Testing deployment at: $DEPLOYMENT_URL"
echo ""

# Basic connectivity tests
echo "📡 BASIC CONNECTIVITY TESTS"
echo "----------------------------"
check_url "$DEPLOYMENT_URL" "Homepage accessibility"
check_url "$DEPLOYMENT_URL/dashboard" "Dashboard route"
check_url "$DEPLOYMENT_URL/analytics" "Analytics route"
echo ""

# Content verification tests
echo "📋 CONTENT VERIFICATION TESTS"
echo "------------------------------"
check_content "$DEPLOYMENT_URL" "Blaze Intelligence" "Site title"
check_content "$DEPLOYMENT_URL" "AI-powered" "AI features mentioned"
check_content "$DEPLOYMENT_URL" "sports analytics" "Sports analytics content"
check_content "$DEPLOYMENT_URL" "subscription" "Subscription features"
echo ""

# JavaScript bundle tests
echo "📦 BUNDLE & ASSET TESTS"
echo "------------------------"
check_url "$DEPLOYMENT_URL/static/js/main" "Main JavaScript bundle"
check_url "$DEPLOYMENT_URL/static/css/main" "Main CSS bundle"
check_url "$DEPLOYMENT_URL/manifest.json" "PWA manifest"
check_url "$DEPLOYMENT_URL/robots.txt" "SEO robots.txt"
echo ""

# Performance test
echo "⚡ PERFORMANCE TEST"
echo "-------------------"
echo -n "Measuring load time... "
load_time=$(curl -o /dev/null -s -w '%{time_total}' "$DEPLOYMENT_URL")
echo "⏱️  ${load_time}s"

if (( $(echo "$load_time < 3.0" | bc -l) )); then
    echo "✅ Load time under 3 seconds"
else
    echo "⚠️  Load time over 3 seconds - consider optimization"
fi
echo ""

# Security headers test
echo "🛡️  SECURITY HEADERS TEST"
echo "-------------------------"
echo -n "Checking HTTPS... "
if [[ $DEPLOYMENT_URL == https* ]]; then
    echo "✅ HTTPS enabled"
else
    echo "⚠️  HTTP detected - HTTPS recommended"
fi

echo -n "Checking security headers... "
headers=$(curl -s -I "$DEPLOYMENT_URL")
if echo "$headers" | grep -q "X-Frame-Options\|Content-Security-Policy\|X-Content-Type-Options"; then
    echo "✅ Security headers present"
else
    echo "⚠️  Security headers missing"
fi
echo ""

# Mobile responsiveness check
echo "📱 MOBILE RESPONSIVENESS TEST"
echo "-----------------------------"
echo -n "Checking viewport meta tag... "
if curl -s "$DEPLOYMENT_URL" | grep -q 'viewport.*width=device-width'; then
    echo "✅ Mobile viewport configured"
else
    echo "❌ Mobile viewport missing"
fi
echo ""

# Final summary
echo "📊 DEPLOYMENT SUMMARY"
echo "====================="
echo "🌐 URL: $DEPLOYMENT_URL"
echo "⏱️  Load Time: ${load_time}s"
echo ""

# Check if critical features are working
echo "🔧 CRITICAL FEATURES CHECKLIST"
echo "-------------------------------"
echo "Please manually verify these features work:"
echo "[ ] User registration/login"
echo "[ ] AI chat assistant responds"
echo "[ ] Live sports data displays"
echo "[ ] Payment flow functions"
echo "[ ] Social sharing works"
echo "[ ] Mobile experience good"
echo "[ ] Analytics tracking active"
echo ""

echo "🎉 Deployment verification complete!"
echo ""
echo "📋 Next Steps:"
echo "1. Test all features manually"
echo "2. Configure production API keys if not done"
echo "3. Set up custom domain (optional)"
echo "4. Monitor analytics for user behavior"
echo "5. Launch marketing campaigns"
echo ""
echo "🚀 Your Blaze Intelligence platform is ready for users!"