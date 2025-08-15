#!/bin/bash

echo "🎯 GITHUB PAGES DNS FIX - Based on Official Troubleshooting Guide"
echo "================================================================="
echo ""
echo "DIAGNOSIS: Your domain is pointing to Cloudflare (104.21.83.209) instead of GitHub Pages"
echo "SOLUTION: Update DNS records to point to GitHub Pages servers"
echo ""

# Open Cloudflare dashboard
echo "🌐 Opening Cloudflare DNS Management..."
open "https://dash.cloudflare.com/$(curl -s -H "Authorization: Bearer invalid" "https://api.cloudflare.com/client/v4/zones" | grep -o 'zone_id[^"]*' 2>/dev/null || echo '')/dns"

echo ""
echo "📋 EXACT DNS RECORDS TO CREATE/UPDATE IN CLOUDFLARE:"
echo "===================================================="
echo ""

echo "🔸 STEP 1: DELETE existing A records for blaze-intelligence.com"
echo "   (Currently pointing to: 104.21.83.209, 172.67.181.242)"
echo ""

echo "🔸 STEP 2: CREATE these 4 A records:"
echo ""
echo "   Record 1:"
echo "   ├─ Type: A"
echo "   ├─ Name: blaze-intelligence.com (or @)"  
echo "   ├─ Content: 185.199.108.153"
echo "   ├─ TTL: Auto"
echo "   └─ Proxy Status: DNS only (GRAY cloud - VERY IMPORTANT!)"
echo ""
echo "   Record 2:"
echo "   ├─ Type: A"
echo "   ├─ Name: blaze-intelligence.com (or @)"
echo "   ├─ Content: 185.199.109.153" 
echo "   ├─ TTL: Auto"
echo "   └─ Proxy Status: DNS only (GRAY cloud - VERY IMPORTANT!)"
echo ""
echo "   Record 3:"
echo "   ├─ Type: A"
echo "   ├─ Name: blaze-intelligence.com (or @)"
echo "   ├─ Content: 185.199.110.153"
echo "   ├─ TTL: Auto" 
echo "   └─ Proxy Status: DNS only (GRAY cloud - VERY IMPORTANT!)"
echo ""
echo "   Record 4:"
echo "   ├─ Type: A"
echo "   ├─ Name: blaze-intelligence.com (or @)"
echo "   ├─ Content: 185.199.111.153"
echo "   ├─ TTL: Auto"
echo "   └─ Proxy Status: DNS only (GRAY cloud - VERY IMPORTANT!)"
echo ""

echo "🔸 STEP 3: ADD GitHub Pages verification TXT record:"
echo ""
echo "   ├─ Type: TXT"
echo "   ├─ Name: _github-pages-challenge-ahump20"
echo "   ├─ Content: 6e8710d0a2b450e076e43b0f743949"
echo "   ├─ TTL: Auto"
echo "   └─ Proxy Status: DNS only (GRAY cloud)"
echo ""

echo "⚠️  CRITICAL: Proxy Status MUST be 'DNS only' (gray cloud)"
echo "   If it's 'Proxied' (orange cloud), GitHub Pages won't work!"
echo ""

echo "🔸 STEP 4: ADD www CNAME record (recommended):"
echo ""
echo "   ├─ Type: CNAME"
echo "   ├─ Name: www"
echo "   ├─ Content: ahump20.github.io"
echo "   ├─ TTL: Auto"
echo "   └─ Proxy Status: DNS only (GRAY cloud)"
echo ""

echo "Press ENTER after you've made ALL the DNS changes above..."
read

echo ""
echo "🔍 VERIFICATION - Testing DNS Changes..."
echo "======================================="

# Wait for DNS propagation
echo "⏳ Waiting 30 seconds for initial DNS propagation..."
sleep 30

# Test A records
echo ""
echo "1. Testing A records..."
new_a_records=$(dig A blaze-intelligence.com +short | sort)
echo "   Current A records: $new_a_records"

github_found=false
for ip in 185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153; do
    if echo "$new_a_records" | grep -q "$ip"; then
        github_found=true
        break
    fi
done

if [ "$github_found" = true ]; then
    echo "   ✅ SUCCESS: Domain now points to GitHub Pages!"
else
    echo "   ⏳ PENDING: DNS still propagating (this can take 5-60 minutes)"
fi

# Test TXT record
echo ""
echo "2. Testing TXT verification record..."
txt_record=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short | tr -d '"')
if [ "$txt_record" = "6e8710d0a2b450e076e43b0f743949" ]; then
    echo "   ✅ SUCCESS: GitHub verification record found!"
else
    echo "   ⏳ PENDING: Verification record still propagating"
    echo "   Current: '$txt_record'"
fi

# Test HTTPS
echo ""
echo "3. Testing HTTPS accessibility..."
if curl -s -I "https://blaze-intelligence.com" | grep -q "200\|301\|302"; then
    echo "   ✅ SUCCESS: Site accessible via HTTPS!"
else
    echo "   ⏳ PENDING: HTTPS not yet available (can take up to 1 hour)"
fi

echo ""
echo "🎯 GITHUB PAGES FINAL CHECK"
echo "==========================="
echo ""
echo "Go to: https://github.com/ahump20/blaze-intelligence-official/settings/pages"
echo ""
echo "You should see:"
echo "✅ 'Your site is published at https://blaze-intelligence.com'"
echo "✅ Green checkmark next to custom domain"
echo "✅ 'Enforce HTTPS' checkbox available"
echo ""

# Open GitHub Pages settings
open "https://github.com/ahump20/blaze-intelligence-official/settings/pages"

echo "⏰ TIMELINE:"
echo "  • DNS propagation: 5-30 minutes"
echo "  • HTTPS certificate: Up to 1 hour" 
echo "  • Full functionality: Within 1 hour"
echo ""
echo "🔄 Run this script again to re-check: ./github-pages-dns-fix.sh"
echo ""
echo "🎉 Your site will be live at: https://blaze-intelligence.com"