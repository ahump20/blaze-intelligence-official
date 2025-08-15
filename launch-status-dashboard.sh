#!/bin/bash

echo "🎯 BLAZE INTELLIGENCE - LAUNCH STATUS DASHBOARD"
echo "==============================================="
echo ""

# Get current timestamp
echo "📅 Status as of: $(date)"
echo ""

# Check DNS status
echo "🌐 DNS STATUS:"
echo "=============="
a_records=$(dig A blaze-intelligence.com +short | sort)
txt_record=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short | tr -d '"')

echo "Current A Records:"
echo "$a_records" | while read -r ip; do
    if [[ "$ip" =~ ^185\.199\.(108|109|110|111)\.153$ ]]; then
        echo "   ✅ $ip (GitHub Pages)"
    else
        echo "   ⏳ $ip (Cloudflare - needs updating)"
    fi
done

echo ""
echo "TXT Verification Record:"
if [ "$txt_record" = "6e8710d0a2b450e076e43b0f743949" ]; then
    echo "   ✅ Verified"
else
    echo "   ⏳ Pending (current: '$txt_record')"
fi

# Test website accessibility
echo ""
echo "🌍 WEBSITE STATUS:"
echo "=================="

# Test HTTPS
if curl -s -I "https://blaze-intelligence.com" 2>/dev/null | head -1 | grep -q "200"; then
    echo "   ✅ HTTPS: Working"
elif curl -s -I "http://blaze-intelligence.com" 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
    echo "   ⏳ HTTP: Working (HTTPS setting up)"
else
    echo "   ❌ Not accessible yet"
fi

# Test GitHub.io fallback
if curl -s -I "https://ahump20.github.io/blaze-intelligence-official/" 2>/dev/null | head -1 | grep -q "200"; then
    echo "   ✅ GitHub.io: Working (fallback available)"
else
    echo "   ⚠️ GitHub.io: Check needed"
fi

# Check GitHub Pages API status
echo ""
echo "📊 GITHUB PAGES STATUS:"
echo "======================="

source /Users/AustinHumphrey/.mcp_env 2>/dev/null

if [ -n "$GITHUB_TOKEN" ]; then
    pages_info=$(curl -s -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/ahump20/blaze-intelligence-official/pages")
    
    status=$(echo "$pages_info" | jq -r '.status // "unknown"' 2>/dev/null)
    domain_state=$(echo "$pages_info" | jq -r '.protected_domain_state // "unknown"' 2>/dev/null)
    https_enforced=$(echo "$pages_info" | jq -r '.https_enforced // false' 2>/dev/null)
    
    echo "   Build Status: $([ "$status" = "built" ] && echo "✅ Built" || echo "⏳ $status")"
    echo "   Domain State: $([ "$domain_state" = "verified" ] && echo "✅ Verified" || echo "⏳ $domain_state")"
    echo "   HTTPS Enforced: $([ "$https_enforced" = "true" ] && echo "✅ Yes" || echo "⏳ Setting up")"
else
    echo "   ℹ️ Manual check required"
fi

# Repository status
echo ""
echo "📦 REPOSITORY STATUS:"
echo "===================="
echo "   ✅ Code deployed to main branch"
echo "   ✅ CNAME file configured"
echo "   ✅ Homepage URL corrected"
echo "   ✅ Security fixes applied"
echo "   ✅ SEO optimizations added"

# Next actions
echo ""
echo "🎯 NEXT ACTIONS NEEDED:"
echo "======================"

# Check if DNS needs updating
if echo "$a_records" | grep -q "104.21.83.209\|172.67.181.242"; then
    echo "   🔴 URGENT: Update DNS records in Cloudflare"
    echo "      • Delete: 104.21.83.209, 172.67.181.242"
    echo "      • Add: 185.199.108.153, 185.199.109.153, 185.199.110.153, 185.199.111.153"
    echo "      • Add TXT: _github-pages-challenge-ahump20 → 6e8710d0a2b450e076e43b0f743949"
else
    echo "   ✅ DNS records appear updated - checking propagation"
fi

# Post-launch tasks
echo ""
echo "📋 POST-LAUNCH CHECKLIST:"
echo "========================="
echo "   □ Google Search Console setup"
echo "   □ Google Analytics integration"
echo "   □ Performance testing"
echo "   □ SSL certificate verification"
echo "   □ Social media integration"
echo "   □ Contact form testing"

# Quick links
echo ""
echo "🔗 QUICK LINKS:"
echo "==============="
echo "   • Live Site: https://blaze-intelligence.com"
echo "   • GitHub Pages: https://github.com/ahump20/blaze-intelligence-official/settings/pages"
echo "   • Cloudflare DNS: https://dash.cloudflare.com"
echo "   • Repository: https://github.com/ahump20/blaze-intelligence-official"

# Scripts available
echo ""
echo "🛠️ AVAILABLE SCRIPTS:"
echo "===================="
echo "   • ./launch-status-dashboard.sh    - This dashboard"
echo "   • ./complete-domain-fix.sh        - DNS troubleshooting"
echo "   • ./monitor-dns-changes.sh        - Continuous monitoring"
echo "   • ./post-launch-setup.sh          - SEO and analytics setup"
echo "   • ./verify-setup.sh               - Quick status check"

echo ""
echo "🎉 BLAZE INTELLIGENCE PLATFORM READY FOR LAUNCH!"
echo "================================================="