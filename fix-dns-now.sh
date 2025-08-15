#!/bin/bash

echo "🎯 FIXING DNS FOR BLAZE-INTELLIGENCE.COM"
echo "========================================"
echo ""
echo "The domain currently points to Cloudflare instead of GitHub Pages."
echo "We need to fix 2 things:"
echo ""
echo "1. ✅ ADD GitHub Pages verification TXT record"
echo "2. 🔧 CHANGE A records to point to GitHub Pages"
echo ""

# Open Cloudflare dashboard
echo "🌐 Opening Cloudflare dashboard..."
open "https://dash.cloudflare.com"

echo ""
echo "📝 STEP 1: ADD TXT RECORD FOR GITHUB VERIFICATION"
echo "================================================"
echo ""
echo "In Cloudflare DNS settings, ADD this record:"
echo ""
echo "   Type: TXT"
echo "   Name: _github-pages-challenge-ahump20"
echo "   Content: 6e8710d0a2b450e076e43b0f743949"
echo "   TTL: Auto"
echo "   Proxy status: DNS only (gray cloud)"
echo ""

echo "📝 STEP 2: UPDATE A RECORDS TO POINT TO GITHUB"
echo "============================================="
echo ""
echo "REPLACE the existing A records with these 4 GitHub Pages IPs:"
echo ""
echo "   Type: A"
echo "   Name: blaze-intelligence.com (or @)"
echo "   Content: 185.199.108.153"
echo "   TTL: Auto"
echo "   Proxy status: DNS only (gray cloud)"
echo ""
echo "   Type: A" 
echo "   Name: blaze-intelligence.com (or @)"
echo "   Content: 185.199.109.153"
echo "   TTL: Auto"
echo "   Proxy status: DNS only (gray cloud)"
echo ""
echo "   Type: A"
echo "   Name: blaze-intelligence.com (or @)" 
echo "   Content: 185.199.110.153"
echo "   TTL: Auto"
echo "   Proxy status: DNS only (gray cloud)"
echo ""
echo "   Type: A"
echo "   Name: blaze-intelligence.com (or @)"
echo "   Content: 185.199.111.153" 
echo "   TTL: Auto"
echo "   Proxy status: DNS only (gray cloud)"
echo ""

echo "⚠️  IMPORTANT: Make sure Proxy Status is 'DNS only' (gray cloud)"
echo "   NOT 'Proxied' (orange cloud) for GitHub Pages to work!"
echo ""

echo "Press ENTER after you've made these DNS changes..."
read

echo ""
echo "🔍 Checking DNS changes..."
sleep 10

# Check TXT record
echo "1. Checking TXT record..."
txt_result=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short 2>/dev/null | tr -d '"')
if [ "$txt_result" = "6e8710d0a2b450e076e43b0f743949" ]; then
    echo "✅ TXT record: CORRECT"
else
    echo "⏳ TXT record: Still propagating"
    echo "   Current: '$txt_result'"
fi

# Check A records
echo ""
echo "2. Checking A records..."
a_records=$(dig A blaze-intelligence.com +short 2>/dev/null)
echo "Current A records:"
echo "$a_records"

github_ips="185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153"
if echo "$a_records" | grep -q "185.199.108.153"; then
    echo "✅ A records: Point to GitHub Pages"
else
    echo "⏳ A records: Still propagating or need updating"
fi

echo ""
echo "🚀 FINAL STEP: VERIFY GITHUB PAGES"
echo "================================="
echo ""
echo "Go to: https://github.com/ahump20/blaze-intelligence-official/settings/pages"
echo ""
echo "You should see:"
echo "✅ 'Your site is published at https://blaze-intelligence.com'"
echo "✅ Green checkmark next to 'blaze-intelligence.com'"
echo ""

# Try to open GitHub Pages settings
echo "🌐 Opening GitHub Pages settings..."
open "https://github.com/ahump20/blaze-intelligence-official/settings/pages"

echo ""
echo "⏰ DNS propagation can take 5-30 minutes"
echo "📊 Run './verify-setup.sh' to check status anytime"
echo ""
echo "🎉 Once DNS propagates, your site will be live at:"
echo "   https://blaze-intelligence.com"