#!/bin/bash

echo "🎯 MANUAL DNS UPDATE - QUICK 2-MINUTE PROCESS"
echo "============================================="
echo ""
echo "Since API tokens need refreshing, here's the fastest manual process:"
echo ""

# Open Cloudflare
echo "🌐 Opening Cloudflare DNS management..."
open "https://dash.cloudflare.com"

echo ""
echo "📋 EXACT STEPS TO FOLLOW IN CLOUDFLARE:"
echo "======================================="
echo ""
echo "1. 🔍 Find and click on 'blaze-intelligence.com' domain"
echo ""
echo "2. 📊 Click 'DNS' → 'Records' in the left sidebar"
echo ""
echo "3. 🗑️ DELETE these 2 existing A records:"
echo "   ❌ Delete: @ → 104.21.83.209"
echo "   ❌ Delete: @ → 172.67.181.242"
echo "   (Click the 'Edit' button, then 'Delete')"
echo ""
echo "4. ➕ ADD these 4 new A records:"
echo "   ✅ Type: A, Name: @, Content: 185.199.108.153, Proxy: DNS only (gray)"
echo "   ✅ Type: A, Name: @, Content: 185.199.109.153, Proxy: DNS only (gray)"
echo "   ✅ Type: A, Name: @, Content: 185.199.110.153, Proxy: DNS only (gray)"
echo "   ✅ Type: A, Name: @, Content: 185.199.111.153, Proxy: DNS only (gray)"
echo ""
echo "5. 📝 ADD GitHub verification TXT record:"
echo "   ✅ Type: TXT"
echo "   ✅ Name: _github-pages-challenge-ahump20"
echo "   ✅ Content: 6e8710d0a2b450e076e43b0f743949"
echo "   ✅ Proxy: DNS only (gray)"
echo ""
echo "⚠️  CRITICAL: Make sure ALL records have Proxy Status = 'DNS only' (gray cloud)"
echo "   NOT 'Proxied' (orange cloud)"
echo ""

echo "Press ENTER when you've completed all the DNS changes..."
read

echo ""
echo "🔍 TESTING YOUR CHANGES..."
echo "========================="

# Test the changes
echo "⏳ Waiting 30 seconds for DNS propagation..."
sleep 30

echo ""
echo "1. Checking A records..."
new_records=$(dig A blaze-intelligence.com +short | sort)
echo "Current A records:"
echo "$new_records" | while read -r ip; do
    if [[ "$ip" =~ ^185\.199\.(108|109|110|111)\.153$ ]]; then
        echo "   ✅ $ip (GitHub Pages - GOOD!)"
    elif [[ "$ip" =~ ^104\.21\.|^172\.67\. ]]; then
        echo "   ⏳ $ip (Cloudflare - still propagating)"
    else
        echo "   ❓ $ip (Unknown)"
    fi
done

echo ""
echo "2. Checking TXT verification record..."
txt_check=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short | tr -d '"')
if [[ "$txt_check" == "6e8710d0a2b450e076e43b0f743949" ]]; then
    echo "   ✅ TXT record verified!"
else
    echo "   ⏳ TXT record still propagating (current: '$txt_check')"
fi

echo ""
echo "3. Testing website access..."
if curl -s -I "https://blaze-intelligence.com" 2>/dev/null | head -1 | grep -q "200"; then
    echo "   🎉 HTTPS WORKING! Your site is LIVE!"
    echo "   🌐 Opening your live site now..."
    open "https://blaze-intelligence.com"
    echo ""
    echo "   🎯 SUCCESS! Your Blaze Intelligence platform is live at:"
    echo "   https://blaze-intelligence.com"
elif curl -s -I "http://blaze-intelligence.com" 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
    echo "   ⏳ HTTP working, HTTPS setting up (this can take up to 1 hour)"
    echo "   Your site will be fully live soon!"
else
    echo "   ⏳ Site not accessible yet - DNS still propagating"
    echo "   This is normal and can take 5-30 minutes"
fi

echo ""
echo "📊 FINAL STATUS:"
echo "==============="
if echo "$new_records" | grep -q "185.199"; then
    echo "✅ DNS Update: SUCCESS - Points to GitHub Pages"
    echo "✅ Your site will be live within 5-30 minutes"
    echo ""
    echo "🔄 Continue monitoring with:"
    echo "   ./launch-status-dashboard.sh"
    echo "   ./monitor-dns-changes.sh"
else
    echo "⏳ DNS Update: IN PROGRESS"
    echo "💡 If changes don't appear within 10 minutes:"
    echo "   • Double-check you saved all records in Cloudflare"
    echo "   • Ensure Proxy Status is 'DNS only' (gray cloud)"
    echo "   • Try running this script again"
fi

echo ""
echo "🎉 CONGRATULATIONS!"
echo "Your Blaze Intelligence platform is ready for the world!"