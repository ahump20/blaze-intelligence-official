#!/bin/bash

# Disable Cloudflare Access and Configure Custom Domain
# This script removes Cloudflare Access restrictions and configures the custom domain

echo "🚀 DISABLING CLOUDFLARE ACCESS & CONFIGURING CUSTOM DOMAIN"
echo "========================================================="

DOMAIN="blaze-intelligence.com"
PAGES_PROJECT="blaze-intelligence"

echo "📋 Current Status Check:"
echo "- Domain: $DOMAIN"
echo "- Pages Project: $PAGES_PROJECT"
echo "- Current Pages URL: https://cfc81e7d.blaze-intelligence.pages.dev/"

echo ""
echo "⚠️  MANUAL STEPS REQUIRED - Please complete in Cloudflare Dashboard:"
echo ""

echo "1. 🔐 DISABLE CLOUDFLARE ACCESS:"
echo "   → Go to https://dash.cloudflare.com/profile/api-tokens"
echo "   → Navigate to: Security > Access > Applications"
echo "   → Find application for 'blaze-intelligence.com'"
echo "   → Click Delete or Disable"

echo ""
echo "2. 📝 ADD CUSTOM DOMAIN TO PAGES:"
echo "   → Go to: https://dash.cloudflare.com"
echo "   → Navigate to: Workers & Pages > Overview"
echo "   → Click on 'blaze-intelligence' project"
echo "   → Go to 'Custom Domains' tab"
echo "   → Click 'Set up a custom domain'"
echo "   → Enter: $DOMAIN"
echo "   → Click 'Continue'"
echo "   → Follow DNS verification steps"

echo ""
echo "3. ✅ VERIFICATION COMMANDS:"
echo "   Run these after completing manual steps:"
echo "   curl -I https://$DOMAIN/"
echo "   dig $DOMAIN"

echo ""
echo "🎯 EXPECTED RESULT:"
echo "- https://blaze-intelligence.com should return HTTP 200"
echo "- All site functionality should work on custom domain"
echo "- No Cloudflare Access challenges"

echo ""
echo "🔧 If DNS issues, add these CNAME records:"
echo "   Name: @ (or blaze-intelligence)"
echo "   Target: cfc81e7d.blaze-intelligence.pages.dev"
echo "   Proxied: Yes (Orange cloud)"

echo ""
echo "📞 Contact Support if needed:"
echo "   - Cloudflare Support for Access issues"
echo "   - Domain registrar for DNS issues"

echo ""
echo "✅ COMPLETION CHECKLIST:"
echo "□ Cloudflare Access disabled for $DOMAIN"
echo "□ Custom domain added to Pages project"
echo "□ DNS configured correctly"
echo "□ Site accessible at https://$DOMAIN"
echo "□ All pages loading correctly"
echo "□ APIs working on custom domain"