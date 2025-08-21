#!/bin/bash

# Blaze Intelligence Domain Verification Script
echo "🔥 Blaze Intelligence Domain Verification"
echo "========================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DOMAIN="blaze-intelligence.com"

# Check DNS resolution
echo "1. Checking DNS Resolution..."
if host $DOMAIN > /dev/null 2>&1; then
    echo -e "${GREEN}✅ DNS resolves successfully${NC}"
    host $DOMAIN | head -n 1
else
    echo -e "${RED}❌ DNS not resolving yet${NC}"
fi
echo ""

# Check HTTPS connection
echo "2. Checking HTTPS Connection..."
if curl -Is https://$DOMAIN | head -n 1 | grep "200\|301\|302" > /dev/null; then
    echo -e "${GREEN}✅ HTTPS connection successful${NC}"
    curl -Is https://$DOMAIN | head -n 1
else
    echo -e "${YELLOW}⚠️  HTTPS not responding with expected status${NC}"
    curl -Is https://$DOMAIN | head -n 1
fi
echo ""

# Check www redirect
echo "3. Checking www Redirect..."
REDIRECT=$(curl -Is https://www.$DOMAIN | grep -i "location:" | head -n 1)
if [ ! -z "$REDIRECT" ]; then
    echo -e "${GREEN}✅ www redirect configured${NC}"
    echo "   Redirects to: $REDIRECT"
else
    echo -e "${YELLOW}⚠️  No www redirect detected${NC}"
fi
echo ""

# Check SSL Certificate
echo "4. Checking SSL Certificate..."
CERT_INFO=$(echo | openssl s_client -connect $DOMAIN:443 -servername $DOMAIN 2>/dev/null | openssl x509 -noout -dates 2>/dev/null)
if [ ! -z "$CERT_INFO" ]; then
    echo -e "${GREEN}✅ SSL Certificate active${NC}"
    echo "$CERT_INFO"
else
    echo -e "${RED}❌ Could not verify SSL certificate${NC}"
fi
echo ""

# Check Cloudflare Headers
echo "5. Checking Cloudflare Integration..."
CF_RAY=$(curl -sI https://$DOMAIN | grep -i "cf-ray:" | head -n 1)
if [ ! -z "$CF_RAY" ]; then
    echo -e "${GREEN}✅ Cloudflare proxy active${NC}"
    echo "   $CF_RAY"
else
    echo -e "${YELLOW}⚠️  Cloudflare proxy not detected${NC}"
fi
echo ""

# Summary
echo "========================================="
echo "🔥 Domain Setup Summary:"
echo ""
echo "Production URL: https://$DOMAIN"
echo "Preview URLs will remain at *.pages.dev"
echo ""
echo "If any checks failed:"
echo "1. Wait 5-10 minutes for DNS propagation"
echo "2. Ensure domain is added in Cloudflare Pages"
echo "3. Check DNS records in Cloudflare Dashboard"
echo "4. Clear browser cache and try again"
echo ""
echo "For manual setup instructions, see DOMAIN_SETUP.md"