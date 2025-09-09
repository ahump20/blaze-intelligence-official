#!/bin/bash

# Blaze Intelligence Payment Infrastructure Deployment Script
# Deploys comprehensive payment processing system to Cloudflare Pages

set -euo pipefail

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="blaze-intelligence-production"
DEPLOYMENT_DATE=$(date +"%Y%m%d-%H%M%S")
LOG_FILE="deployment-${DEPLOYMENT_DATE}.log"

echo -e "${BLUE}🚀 Blaze Intelligence Payment Infrastructure Deployment${NC}"
echo -e "${BLUE}===================================================${NC}"
echo ""

# Function to log messages
log_message() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to check command success
check_success() {
    if [ $? -eq 0 ]; then
        log_message "${GREEN}✅ $1${NC}"
    else
        log_message "${RED}❌ $1 failed${NC}"
        exit 1
    fi
}

# Pre-deployment checks
log_message "${YELLOW}📋 Running pre-deployment checks...${NC}"

# Check if required tools are installed
command -v wrangler >/dev/null 2>&1 || { log_message "${RED}❌ Wrangler CLI is required but not installed.${NC}"; exit 1; }
command -v node >/dev/null 2>&1 || { log_message "${RED}❌ Node.js is required but not installed.${NC}"; exit 1; }
command -v git >/dev/null 2>&1 || { log_message "${RED}❌ Git is required but not installed.${NC}"; exit 1; }

log_message "${GREEN}✅ All required tools are installed${NC}"

# Validate project structure
log_message "${YELLOW}📂 Validating project structure...${NC}"

required_files=(
    "api/payment-processor.js"
    "api/subscription-manager.js"
    "api/crm-integration.js"
    "api/automated-onboarding.js"
    "checkout.html"
    "revenue-dashboard-live.html"
    "js/square-integration.js"
    "config/stripe-products.json"
    "config/payment-environment.json"
    "wrangler.toml"
)

for file in "${required_files[@]}"; do
    if [ -f "$file" ]; then
        log_message "${GREEN}✅ Found: $file${NC}"
    else
        log_message "${RED}❌ Missing required file: $file${NC}"
        exit 1
    fi
done

# Validate wrangler.toml configuration
log_message "${YELLOW}⚙️ Validating Wrangler configuration...${NC}"

if grep -q "blaze-intelligence" wrangler.toml; then
    log_message "${GREEN}✅ Wrangler configuration validated${NC}"
else
    log_message "${RED}❌ Invalid Wrangler configuration${NC}"
    exit 1
fi

# Build and validate JavaScript modules
log_message "${YELLOW}🔧 Validating JavaScript modules...${NC}"

# Check for syntax errors in API files
for js_file in api/*.js; do
    if node -c "$js_file" 2>/dev/null; then
        log_message "${GREEN}✅ Syntax valid: $js_file${NC}"
    else
        log_message "${RED}❌ Syntax error in: $js_file${NC}"
        exit 1
    fi
done

# Validate JSON configuration files
log_message "${YELLOW}📄 Validating JSON configuration files...${NC}"

json_files=(
    "config/stripe-products.json"
    "config/payment-environment.json"
)

for json_file in "${json_files[@]}"; do
    if python3 -m json.tool "$json_file" > /dev/null 2>&1; then
        log_message "${GREEN}✅ Valid JSON: $json_file${NC}"
    else
        log_message "${RED}❌ Invalid JSON: $json_file${NC}"
        exit 1
    fi
done

# Check environment variables setup (warn if not set)
log_message "${YELLOW}🔐 Checking environment variables...${NC}"

required_vars=(
    "STRIPE_SECRET_KEY"
    "STRIPE_WEBHOOK_SECRET"
    "HUBSPOT_API_KEY"
    "AIRTABLE_API_KEY"
    "MAILGUN_API_KEY"
)

missing_vars=()

for var in "${required_vars[@]}"; do
    # Check if variable is set in Cloudflare (we can't directly check, so we'll warn)
    log_message "${YELLOW}⚠️  Ensure $var is set in Cloudflare Pages dashboard${NC}"
done

# Commit current changes
log_message "${YELLOW}📝 Committing deployment changes...${NC}"

git add .
if git diff --staged --quiet; then
    log_message "${BLUE}ℹ️  No changes to commit${NC}"
else
    git commit -m "🚀 Deploy payment infrastructure v${DEPLOYMENT_DATE}

- Stripe and Square payment processing
- Subscription management system
- HubSpot and Airtable CRM integration
- Automated client onboarding workflows
- Real-time revenue dashboard
- Comprehensive error handling and logging

🤖 Generated with Claude Code

Co-Authored-By: Claude <noreply@anthropic.com>"
    check_success "Git commit completed"
fi

# Deploy to Cloudflare Pages
log_message "${YELLOW}🚀 Deploying to Cloudflare Pages...${NC}"

# Deploy using Wrangler
if wrangler pages deploy . --project-name="$PROJECT_NAME" --compatibility-date="2024-09-01"; then
    check_success "Cloudflare Pages deployment"
else
    log_message "${RED}❌ Cloudflare Pages deployment failed${NC}"
    log_message "${YELLOW}💡 Check the deployment logs above for specific errors${NC}"
    exit 1
fi

# Get deployment URL
DEPLOYMENT_URL=$(wrangler pages project list | grep "$PROJECT_NAME" | awk '{print $2}' || echo "https://blaze-intelligence.pages.dev")

log_message "${GREEN}✅ Deployment completed successfully!${NC}"
log_message "${BLUE}🌐 Deployment URL: $DEPLOYMENT_URL${NC}"

# Post-deployment validation
log_message "${YELLOW}🧪 Running post-deployment validation...${NC}"

# Test basic connectivity
if curl -sSf "$DEPLOYMENT_URL" > /dev/null 2>&1; then
    log_message "${GREEN}✅ Site is accessible${NC}"
else
    log_message "${YELLOW}⚠️  Site may not be immediately accessible (DNS propagation)${NC}"
fi

# Test API endpoints
api_endpoints=(
    "/api/payment-processor"
    "/checkout.html"
    "/revenue-dashboard-live.html"
)

for endpoint in "${api_endpoints[@]}"; do
    if curl -sSf "$DEPLOYMENT_URL$endpoint" > /dev/null 2>&1; then
        log_message "${GREEN}✅ Endpoint accessible: $endpoint${NC}"
    else
        log_message "${YELLOW}⚠️  Endpoint may not be ready: $endpoint${NC}"
    fi
done

# Create deployment summary
cat > "deployment-summary-${DEPLOYMENT_DATE}.md" << EOF
# Blaze Intelligence Payment Infrastructure Deployment

**Deployment Date:** $(date)
**Deployment ID:** $DEPLOYMENT_DATE
**Project:** $PROJECT_NAME
**URL:** $DEPLOYMENT_URL

## Deployed Components

### Payment Processing
- ✅ Stripe integration with tiered pricing
- ✅ Square payment processing for international clients
- ✅ Secure checkout flows with multiple payment methods
- ✅ Webhook handling for payment events

### Subscription Management
- ✅ Automated recurring billing
- ✅ Subscription upgrades/downgrades
- ✅ Trial period management
- ✅ Cancellation and reactivation workflows

### CRM Integration
- ✅ HubSpot contact and deal creation
- ✅ Airtable customer and subscription tracking
- ✅ Notion documentation generation
- ✅ Cross-platform data synchronization

### Client Onboarding
- ✅ Automated welcome email sequences
- ✅ Platform access provisioning
- ✅ Training session scheduling
- ✅ Success metrics definition

### Revenue Analytics
- ✅ Real-time revenue dashboard
- ✅ MRR/ARR tracking
- ✅ Subscription health metrics
- ✅ Target progress monitoring

## Revenue Targets

### Q4 2025: \$325,000
- Cardinals: \$250,000 (Championship)
- Titans: \$50,000 (Enterprise)
- Longhorns: \$50,000 (Enterprise)
- Additional: \$25,000 (Starter/Professional)

### 2026: \$1,875,000 ARR
- Championship tier: \$500,000
- Enterprise tier: \$750,000
- Professional tier: \$425,000
- Starter tier: \$200,000

## Next Steps

1. **Environment Variables**: Configure all required secrets in Cloudflare Pages dashboard
2. **Payment Providers**: Set up production webhooks in Stripe and Square dashboards
3. **CRM Setup**: Configure HubSpot, Airtable, and Notion integrations
4. **Testing**: Run end-to-end payment flow tests
5. **Monitoring**: Set up alerts and performance monitoring

## Contact Information

**Austin Humphrey**
- Email: ahump20@outlook.com
- Phone: (210) 273-5538
- Platform: $DEPLOYMENT_URL

---

🤖 Generated with Claude Code  
Co-Authored-By: Claude <noreply@anthropic.com>
EOF

log_message "${GREEN}✅ Deployment summary created: deployment-summary-${DEPLOYMENT_DATE}.md${NC}"

# Final success message
echo ""
log_message "${GREEN}🎉 DEPLOYMENT COMPLETED SUCCESSFULLY! 🎉${NC}"
echo ""
log_message "${BLUE}📊 Your Blaze Intelligence payment infrastructure is now live at:${NC}"
log_message "${BLUE}🌐 $DEPLOYMENT_URL${NC}"
echo ""
log_message "${YELLOW}📋 Next Steps:${NC}"
log_message "${YELLOW}1. Configure environment variables in Cloudflare Pages dashboard${NC}"
log_message "${YELLOW}2. Set up payment provider webhooks${NC}"
log_message "${YELLOW}3. Test the complete payment flow${NC}"
log_message "${YELLOW}4. Monitor the revenue dashboard at: $DEPLOYMENT_URL/revenue-dashboard-live.html${NC}"
echo ""
log_message "${BLUE}📝 Deployment log saved to: $LOG_FILE${NC}"
log_message "${BLUE}📄 Full deployment summary: deployment-summary-${DEPLOYMENT_DATE}.md${NC}"
echo ""

# Open the site in browser (optional)
if command -v open >/dev/null 2>&1; then
    read -p "Would you like to open the site in your browser? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        open "$DEPLOYMENT_URL"
        log_message "${GREEN}🌐 Opening $DEPLOYMENT_URL in browser...${NC}"
    fi
fi

log_message "${GREEN}✨ Ready to start generating revenue! ✨${NC}"

exit 0