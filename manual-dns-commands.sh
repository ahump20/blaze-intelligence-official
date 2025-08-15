#!/bin/bash

# Manual DNS Configuration Commands
# Run these commands step by step after updating your API credentials

echo "=== Manual DNS Setup Commands for GitHub Pages ==="
echo "Domain: blaze-intelligence.com"
echo "TXT Record: _github-pages-challenge-ahump20"
echo "Value: 6e8710d0a2b450e076e43b0f743949"
echo ""

echo "1. FIRST: Update your Cloudflare API Token with proper permissions"
echo "   - Go to https://dash.cloudflare.com/profile/api-tokens"
echo "   - Create token with 'Zone:Edit' permission for blaze-intelligence.com"
echo "   - Update CLOUDFLARE_API_TOKEN in ~/.mcp_env"
echo ""

echo "2. Test Cloudflare API access:"
echo 'curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/user/tokens/verify"'
echo ""

echo "3. Get Zone ID for blaze-intelligence.com:"
echo 'curl -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/zones?name=blaze-intelligence.com"'
echo ""

echo "4. Create TXT record (replace ZONE_ID with actual ID from step 3):"
cat << 'EOF'
curl -X POST \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "TXT",
    "name": "_github-pages-challenge-ahump20",
    "content": "6e8710d0a2b450e076e43b0f743949",
    "ttl": 300
  }' \
  "https://api.cloudflare.com/client/v4/zones/ZONE_ID/dns_records"
EOF
echo ""

echo "5. Verify DNS propagation:"
echo 'dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short'
echo ""

echo "6. Configure GitHub Pages (after DNS is working):"
echo "   - Go to https://github.com/ahump20/blaze-intelligence-official/settings/pages"
echo "   - Set custom domain to: blaze-intelligence.com"
echo "   - GitHub will automatically verify the TXT record"
echo ""

echo "7. Monitor verification status via API:"
echo 'curl -H "Authorization: token $GITHUB_TOKEN" "https://api.github.com/repos/ahump20/blaze-intelligence-official/pages"'
echo ""

echo "=== Alternative: Run the automated script after fixing credentials ==="
echo "./automate-dns-setup.sh"