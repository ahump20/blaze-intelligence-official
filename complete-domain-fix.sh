#!/bin/bash

echo "🎯 COMPLETE DOMAIN FIX FOR BLAZE-INTELLIGENCE.COM"
echo "================================================"
echo ""
echo "PROBLEM DIAGNOSED:"
echo "1. ❌ DNS still points to Cloudflare (104.21.83.209) instead of GitHub Pages"
echo "2. ❌ TXT verification record missing"
echo "3. ✅ Homepage URL fixed in package.json"
echo "4. ✅ GitHub Pages built and ready"
echo ""

# Open both Cloudflare and GitHub Pages
echo "🌐 Opening DNS management and GitHub Pages settings..."
open "https://dash.cloudflare.com"
sleep 2
open "https://github.com/ahump20/blaze-intelligence-official/settings/pages"

echo ""
echo "📋 REQUIRED DNS CHANGES IN CLOUDFLARE:"
echo "======================================"
echo ""
echo "🔸 DELETE these current A records:"
echo "   ❌ 104.21.83.209"
echo "   ❌ 172.67.181.242"
echo ""
echo "🔸 ADD these 4 GitHub Pages A records:"
echo "   ✅ Type: A, Name: @, Content: 185.199.108.153, Proxy: DNS only"
echo "   ✅ Type: A, Name: @, Content: 185.199.109.153, Proxy: DNS only"
echo "   ✅ Type: A, Name: @, Content: 185.199.110.153, Proxy: DNS only"
echo "   ✅ Type: A, Name: @, Content: 185.199.111.153, Proxy: DNS only"
echo ""
echo "🔸 ADD GitHub Pages verification TXT record:"
echo "   ✅ Type: TXT, Name: _github-pages-challenge-ahump20"
echo "   ✅ Content: 6e8710d0a2b450e076e43b0f743949, Proxy: DNS only"
echo ""

echo "⚠️  CRITICAL REQUIREMENTS:"
echo "   • Set ALL records to 'DNS only' (GRAY cloud)"
echo "   • Do NOT use 'Proxied' (orange cloud)"
echo "   • Delete old A records completely"
echo ""

echo "📋 VERIFY GITHUB PAGES SETTINGS:"
echo "================================"
echo ""
echo "In GitHub Pages settings, ensure:"
echo "✅ Source: Deploy from a branch → main → / (root)"
echo "✅ Custom domain: blaze-intelligence.com"
echo "✅ Enforce HTTPS: Enabled (after DNS propagates)"
echo ""

echo "Press ENTER after making the DNS changes..."
read

echo ""
echo "🔍 TESTING CHANGES..."
echo "==================="

# Wait for propagation
echo "⏳ Waiting 30 seconds for DNS propagation..."
sleep 30

# Test A records
echo ""
echo "1. Testing A records..."
a_records=$(dig A blaze-intelligence.com +short | sort)
echo "   Current: $a_records"

# Check for GitHub IPs
github_found=false
for ip in 185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153; do
    if echo "$a_records" | grep -q "$ip"; then
        github_found=true
        echo "   ✅ Found GitHub Pages IP: $ip"
        break
    fi
done

if [ "$github_found" = false ]; then
    echo "   ⏳ GitHub Pages IPs not found yet - DNS still propagating"
fi

# Test TXT record
echo ""
echo "2. Testing TXT verification..."
txt_record=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short | tr -d '"')
if [ "$txt_record" = "6e8710d0a2b450e076e43b0f743949" ]; then
    echo "   ✅ TXT record verified!"
else
    echo "   ⏳ TXT record still propagating"
fi

# Test HTTP/HTTPS
echo ""
echo "3. Testing website access..."
if curl -s -I "https://blaze-intelligence.com" | head -1 | grep -q "200"; then
    echo "   ✅ HTTPS working!"
elif curl -s -I "http://blaze-intelligence.com" | head -1 | grep -q "200\|301"; then
    echo "   ⏳ HTTP working, HTTPS still setting up"
else
    echo "   ⏳ Site not accessible yet - waiting for DNS"
fi

echo ""
echo "📊 FINAL STATUS CHECK:"
echo "====================="

# Check GitHub Pages API
source /Users/AustinHumphrey/.mcp_env 2>/dev/null || echo "Environment not loaded"

if [ -n "$GITHUB_TOKEN" ]; then
    pages_info=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/ahump20/blaze-intelligence-official/pages")
    domain_state=$(echo "$pages_info" | jq -r '.protected_domain_state // "unknown"' 2>/dev/null)
    
    echo "GitHub Pages Domain State: $domain_state"
    
    if [ "$domain_state" = "verified" ]; then
        echo "🎉 SUCCESS! Domain is verified and working!"
        
        # Open the live site
        echo "🌐 Opening your live site..."
        open "https://blaze-intelligence.com"
    else
        echo "⏳ Domain verification in progress..."
    fi
else
    echo "ℹ️  Manual check: Go to GitHub Pages settings to see verification status"
fi

echo ""
echo "⏰ TIMELINE EXPECTATIONS:"
echo "  • DNS propagation: 5-30 minutes"
echo "  • GitHub verification: Automatic after DNS"
echo "  • HTTPS certificate: Up to 1 hour"
echo "  • Full site live: Within 1 hour"
echo ""
echo "🔄 Run this script again: ./complete-domain-fix.sh"
echo "📊 Or monitor continuously: ./monitor-dns-changes.sh"
echo ""
echo "🎯 Once working, your site will be live at:"
echo "   https://blaze-intelligence.com"