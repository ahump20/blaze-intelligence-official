#!/bin/bash

# Verification Script - Check DNS and GitHub Pages Setup

echo "🔍 GitHub Pages DNS Setup Verification"
echo "======================================"

# Check DNS record
echo ""
echo "1. 🌐 Checking DNS TXT record..."
dns_result=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short 2>/dev/null | tr -d '"')

if [ "$dns_result" = "6e8710d0a2b450e076e43b0f743949" ]; then
    echo "✅ DNS TXT record: FOUND and CORRECT"
    echo "   Value: $dns_result"
else
    echo "⏳ DNS TXT record: NOT YET VISIBLE"
    echo "   Current: '$dns_result'"
    echo "   Expected: '6e8710d0a2b450e076e43b0f743949'"
    echo "   💡 This is normal - DNS can take time to propagate"
fi

# Check CNAME file
echo ""
echo "2. 📁 Checking CNAME file..."
if [ -f "CNAME" ]; then
    cname_content=$(cat CNAME)
    echo "✅ CNAME file: EXISTS"
    echo "   Content: $cname_content"
else
    echo "❌ CNAME file: MISSING"
    echo "   Creating now..."
    echo "blaze-intelligence.com" > CNAME
    echo "✅ CNAME file: CREATED"
fi

# Check git status
echo ""
echo "3. 📊 Checking git repository status..."
if git status >/dev/null 2>&1; then
    echo "✅ Git repository: ACTIVE"
    echo "   Remote: $(git remote get-url origin 2>/dev/null || echo 'Not configured')"
    
    if git diff --quiet CNAME 2>/dev/null; then
        echo "✅ CNAME: COMMITTED"
    else
        echo "⏳ CNAME: UNCOMMITTED - committing now..."
        git add CNAME
        git commit -m "Update CNAME for blaze-intelligence.com"
        echo "✅ CNAME: NOW COMMITTED"
    fi
else
    echo "❌ Git repository: ERROR"
fi

# Test domain resolution
echo ""
echo "4. 🌍 Testing domain resolution..."
domain_ip=$(dig A blaze-intelligence.com +short 2>/dev/null | head -1)
if [ -n "$domain_ip" ]; then
    echo "✅ Domain resolution: WORKING"
    echo "   IP: $domain_ip"
else
    echo "⏳ Domain resolution: PENDING"
fi

# Final status
echo ""
echo "📊 SETUP STATUS SUMMARY"
echo "======================"

if [ "$dns_result" = "6e8710d0a2b450e076e43b0f743949" ]; then
    echo "✅ DNS Verification: COMPLETE"
    echo "✅ GitHub will automatically verify your domain"
    echo "✅ You can now set up GitHub Pages with custom domain"
    echo ""
    echo "🎯 Next Steps:"
    echo "   1. Go to: https://github.com/ahump20/blaze-intelligence-official/settings/pages"
    echo "   2. Set custom domain: blaze-intelligence.com"
    echo "   3. GitHub will show a green checkmark when verified"
    echo ""
    echo "🚀 Your site will be live at: https://blaze-intelligence.com"
else
    echo "⏳ DNS Verification: IN PROGRESS"
    echo "💡 The TXT record may still be propagating"
    echo "💡 GitHub will automatically detect it once propagation completes"
    echo ""
    echo "⏰ Check again in 10-15 minutes with:"
    echo "   ./verify-setup.sh"
fi

echo ""
echo "🔄 Re-run this script anytime to check status: ./verify-setup.sh"