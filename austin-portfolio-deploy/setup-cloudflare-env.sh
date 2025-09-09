#!/bin/bash

# Blaze Intelligence - Cloudflare Environment Configuration Script
# This script helps configure environment variables for your Cloudflare deployment

set -e

echo "🔧 Blaze Intelligence - Cloudflare Environment Setup"
echo "===================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if wrangler is installed
if ! command -v wrangler &> /dev/null; then
    echo -e "${YELLOW}⚠️  Wrangler CLI not found. Installing...${NC}"
    npm install -g wrangler
fi

# Configuration variables
PROJECT_NAME="blaze-intelligence"

echo -e "${BLUE}📝 Setting up environment variables for Cloudflare Pages...${NC}"
echo ""

# Function to set secret
set_secret() {
    local key=$1
    local prompt=$2
    local example=$3
    
    echo -e "${YELLOW}$prompt${NC}"
    echo -e "Example: ${example}"
    read -p "Enter value (or press Enter to skip): " value
    
    if [ ! -z "$value" ]; then
        echo "$value" | wrangler pages secret put "$key" --project-name="$PROJECT_NAME"
        echo -e "${GREEN}✅ $key configured${NC}"
    else
        echo -e "${YELLOW}⏭️  Skipped $key${NC}"
    fi
    echo ""
}

# API Keys Configuration
echo -e "${BLUE}🔑 API Keys Configuration${NC}"
echo "================================"
echo ""

set_secret "STRIPE_PUBLISHABLE_KEY" \
    "Enter your Stripe Publishable Key:" \
    "pk_test_51ABcDeFgHiJkLmNoPqRsTuVwXyZ"

set_secret "STRIPE_SECRET_KEY" \
    "Enter your Stripe Secret Key:" \
    "sk_test_51ABcDeFgHiJkLmNoPqRsTuVwXyZ"

set_secret "SPORTSRADAR_API_KEY" \
    "Enter your SportsRadar API Key:" \
    "abc123def456ghi789"

set_secret "ESPN_API_KEY" \
    "Enter your ESPN API Key (if available):" \
    "xyz789abc456def123"

# Monitoring Configuration
echo -e "${BLUE}📊 Monitoring Configuration${NC}"
echo "================================"
echo ""

set_secret "SLACK_WEBHOOK_URL" \
    "Enter your Slack Webhook URL:" \
    "https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX"

set_secret "SENTRY_DSN" \
    "Enter your Sentry DSN (for error tracking):" \
    "https://abc123@o123456.ingest.sentry.io/1234567"

# Email Configuration
echo -e "${BLUE}📧 Email Configuration${NC}"
echo "================================"
echo ""

set_secret "SENDGRID_API_KEY" \
    "Enter your SendGrid API Key:" \
    "SG.xxxxxxxxxxxxxxxxxxxxxx"

# Analytics Configuration
echo -e "${BLUE}📈 Analytics Configuration${NC}"
echo "================================"
echo ""

set_secret "GOOGLE_ANALYTICS_ID" \
    "Enter your Google Analytics ID:" \
    "G-XXXXXXXXXX"

set_secret "MIXPANEL_TOKEN" \
    "Enter your Mixpanel Token (optional):" \
    "abc123def456"

# Set non-secret environment variables
echo -e "${BLUE}⚙️  Setting environment variables...${NC}"

wrangler pages deployment create-environment --project-name="$PROJECT_NAME" \
    --environment-name="production" \
    --compatibility-date="2024-01-01" || true

# Create env vars via dashboard command
cat << EOF

${GREEN}✅ Secret configuration complete!${NC}

${BLUE}📋 Next Steps:${NC}
1. Visit your Cloudflare dashboard:
   https://dash.cloudflare.com/?to=/:account/pages/view/${PROJECT_NAME}/settings/environment-variables

2. Add these additional environment variables:
   - NODE_ENV = production
   - API_VERSION = 1.0.0
   - CACHE_TTL = 300
   - ENVIRONMENT = production

3. Trigger a new deployment to apply changes:
   ${YELLOW}npm run deploy${NC}

4. Test your configuration:
   ${YELLOW}./test-configuration.sh${NC}

${BLUE}📚 Documentation:${NC}
- API Setup Guide: /api-documentation.html
- Monitoring Guide: /monitoring-setup.md
- Payment Testing: /test-stripe-integration.sh

${GREEN}Ready to activate all features! 🚀${NC}
EOF