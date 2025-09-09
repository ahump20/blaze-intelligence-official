#!/bin/bash

# Blaze Intelligence - Domain Configuration Helper
# Sets up custom domain with Cloudflare Pages

set -e

echo "🌐 BLAZE INTELLIGENCE - Domain Configuration"
echo "============================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[DOMAIN]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Configuration
DOMAIN="blaze-intelligence.com"
WWW_DOMAIN="www.blaze-intelligence.com"
PROJECT_NAME="blaze-intelligence"

# Load environment
if [ -f ".env" ]; then
    source .env
fi

echo "This script will help you configure your custom domain with Cloudflare Pages."
echo ""

# Step 1: Check if logged into Wrangler
print_status "Checking Cloudflare authentication..."
if wrangler whoami 2>/dev/null; then
    print_success "Authenticated with Cloudflare"
else
    print_warning "Not authenticated. Running wrangler login..."
    wrangler login
fi

# Step 2: Check if Pages project exists
print_status "Checking Pages project..."
if wrangler pages project list | grep -q "$PROJECT_NAME"; then
    print_success "Pages project '$PROJECT_NAME' exists"
else
    print_warning "Pages project not found. Creating..."
    wrangler pages project create "$PROJECT_NAME" --production-branch main
fi

# Step 3: Add custom domains
print_status "Adding custom domains to Pages project..."

echo "Adding $DOMAIN..."
wrangler pages domains add "$DOMAIN" --project "$PROJECT_NAME" || print_warning "Domain may already be added"

echo "Adding $WWW_DOMAIN..."
wrangler pages domains add "$WWW_DOMAIN" --project "$PROJECT_NAME" || print_warning "Domain may already be added"

# Step 4: Get DNS records to add
print_status "Fetching required DNS records..."

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 DNS CONFIGURATION REQUIRED"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Add these DNS records to your domain:"
echo ""
echo "1. CNAME Record (for www):"
echo "   Name: www"
echo "   Target: ${PROJECT_NAME}.pages.dev"
echo "   Proxy: Yes (Orange cloud ON)"
echo ""
echo "2. CNAME Record (for root domain):"
echo "   Name: @ (or ${DOMAIN})"
echo "   Target: ${PROJECT_NAME}.pages.dev"
echo "   Proxy: Yes (Orange cloud ON)"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Step 5: Auto-configure if domain is on Cloudflare
if [ -n "$CLOUDFLARE_API_TOKEN" ] && [ -n "$CLOUDFLARE_ZONE_ID" ]; then
    print_status "Found Cloudflare credentials. Attempting automatic DNS configuration..."
    
    # Add CNAME for root domain
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{
            "type": "CNAME",
            "name": "@",
            "content": "'$PROJECT_NAME'.pages.dev",
            "proxied": true
        }' 2>/dev/null | grep -q '"success":true' && print_success "Root domain CNAME added" || print_warning "Root domain CNAME may already exist"
    
    # Add CNAME for www
    curl -X POST "https://api.cloudflare.com/client/v4/zones/$CLOUDFLARE_ZONE_ID/dns_records" \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        --data '{
            "type": "CNAME",
            "name": "www",
            "content": "'$PROJECT_NAME'.pages.dev",
            "proxied": true
        }' 2>/dev/null | grep -q '"success":true' && print_success "WWW CNAME added" || print_warning "WWW CNAME may already exist"
    
    print_success "DNS records configured automatically"
else
    print_warning "Manual DNS configuration required (see instructions above)"
fi

# Step 6: SSL Configuration
print_status "SSL/TLS Configuration..."
echo ""
echo "Cloudflare automatically provisions SSL certificates for custom domains."
echo "This process takes 5-10 minutes after DNS propagation."
echo ""

# Step 7: Verify domain configuration
print_status "Verification steps..."
echo ""
echo "1. Wait 5-10 minutes for DNS propagation"
echo "2. Test your domains:"
echo "   • https://${DOMAIN}"
echo "   • https://${WWW_DOMAIN}"
echo ""

# Step 8: Create verification script
cat > verify-domain.sh << 'EOF'
#!/bin/bash

# Domain verification script
DOMAIN="blaze-intelligence.com"
WWW_DOMAIN="www.blaze-intelligence.com"

echo "🔍 Verifying domain configuration..."
echo ""

# Check DNS
echo "DNS Records:"
dig +short CNAME $DOMAIN
dig +short CNAME $WWW_DOMAIN
echo ""

# Check HTTP response
echo "HTTP Response:"
curl -I https://$DOMAIN 2>/dev/null | head -1
curl -I https://$WWW_DOMAIN 2>/dev/null | head -1
echo ""

# Check SSL
echo "SSL Certificate:"
echo | openssl s_client -servername $DOMAIN -connect $DOMAIN:443 2>/dev/null | openssl x509 -noout -dates
echo ""

echo "✅ Verification complete"
EOF

chmod +x verify-domain.sh
print_success "Created verify-domain.sh script"

# Step 9: Update _redirects file
print_status "Creating redirects configuration..."
cat > public/_redirects << EOF
# Redirect www to non-www
https://www.blaze-intelligence.com/* https://blaze-intelligence.com/:splat 301!

# API proxy (optional)
/api/* https://blaze-sports-data.humphrey-austin20.workers.dev/api/:splat 200

# Single Page App support
/* /index.html 200
EOF

print_success "Created _redirects file"

# Step 10: Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 CONFIGURATION COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Custom domains added to Pages project"
echo "✅ DNS configuration provided"
echo "✅ Verification script created"
echo "✅ Redirects configured"
echo ""
echo "Next Steps:"
echo "1. Add DNS records (if not auto-configured)"
echo "2. Wait 5-10 minutes for propagation"
echo "3. Run: ./verify-domain.sh"
echo "4. Deploy site: ./deploy-production.sh"
echo ""
echo "Your site will be available at:"
echo "  • https://${DOMAIN}"
echo "  • https://${WWW_DOMAIN}"
echo "  • https://${PROJECT_NAME}.pages.dev (backup)"
echo ""

print_success "Domain configuration complete!"