#!/bin/bash

# Blaze Intelligence - Integration Setup Wizard
# Interactive setup for all third-party integrations

set -e

echo "🔥 BLAZE INTELLIGENCE - Integration Setup Wizard"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m'

# Helper functions
print_status() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if .env exists, create from example if not
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        cp .env.example .env
        print_success "Created .env from .env.example"
    else
        print_error "No .env.example found!"
        exit 1
    fi
fi

# Load existing .env
set -a
source .env
set +a

echo "This wizard will help you configure all integrations for Blaze Intelligence."
echo "Press Enter to skip any integration you want to configure later."
echo ""

# ============================================
# NOTION CMS SETUP
# ============================================
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📝 NOTION CMS INTEGRATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://www.notion.so/my-integrations"
echo "2. Click 'New integration'"
echo "3. Name it 'Blaze Intelligence CMS'"
echo "4. Select your workspace"
echo "5. Copy the Internal Integration Token"
echo ""

read -p "Enter Notion API Token (starts with 'ntn_'): " NEW_NOTION_TOKEN
if [ -n "$NEW_NOTION_TOKEN" ]; then
    sed -i.bak "s/NOTION_TOKEN=.*/NOTION_TOKEN=$NEW_NOTION_TOKEN/" .env
    print_success "Notion token configured"
    
    # Test connection
    echo "Testing Notion connection..."
    node -e "
    const { Client } = require('@notionhq/client');
    const notion = new Client({ auth: '$NEW_NOTION_TOKEN' });
    notion.users.me().then(user => {
        console.log('✅ Connected to Notion as:', user.name || 'Integration');
    }).catch(err => {
        console.error('❌ Notion connection failed:', err.message);
    });
    " 2>/dev/null || print_warning "Install @notionhq/client to test connection"
fi

read -p "Enter Notion Database ID for content (optional): " NEW_NOTION_DB
if [ -n "$NEW_NOTION_DB" ]; then
    sed -i.bak "s/NOTION_DB_ID_WEBSITE_CONTENT=.*/NOTION_DB_ID_WEBSITE_CONTENT=$NEW_NOTION_DB/" .env
    print_success "Notion database configured"
fi

# ============================================
# HUBSPOT CRM SETUP
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 HUBSPOT CRM INTEGRATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: HubSpot Settings > Integrations > Private Apps"
echo "2. Click 'Create a private app'"
echo "3. Name it 'Blaze Intelligence'"
echo "4. Set scopes: crm.objects.contacts.write, crm.objects.contacts.read"
echo "5. Copy the Access Token"
echo ""

read -p "Enter HubSpot Portal ID: " NEW_PORTAL_ID
if [ -n "$NEW_PORTAL_ID" ]; then
    sed -i.bak "s/HUBSPOT_PORTAL_ID=.*/HUBSPOT_PORTAL_ID=$NEW_PORTAL_ID/" .env
    print_success "HubSpot Portal ID configured"
fi

read -p "Enter HubSpot Access Token: " NEW_HUBSPOT_TOKEN
if [ -n "$NEW_HUBSPOT_TOKEN" ]; then
    sed -i.bak "s/HUBSPOT_ACCESS_TOKEN=.*/HUBSPOT_ACCESS_TOKEN=$NEW_HUBSPOT_TOKEN/" .env
    print_success "HubSpot token configured"
    
    # Add to Cloudflare Workers secrets
    echo ""
    read -p "Deploy HubSpot token to Cloudflare Workers? (y/n): " DEPLOY_HUBSPOT
    if [ "$DEPLOY_HUBSPOT" = "y" ]; then
        echo "$NEW_HUBSPOT_TOKEN" | wrangler secret put HUBSPOT_API_KEY
        print_success "HubSpot token deployed to Workers"
    fi
fi

# ============================================
# AIRTABLE SETUP
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📊 AIRTABLE INTEGRATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://airtable.com/create/tokens"
echo "2. Click 'Create new token'"
echo "3. Name it 'Blaze Intelligence'"
echo "4. Add scopes: data.records:read, data.records:write"
echo "5. Add your base to access list"
echo "6. Copy the token (starts with 'patd')"
echo ""

read -p "Enter Airtable Personal Access Token: " NEW_AIRTABLE_TOKEN
if [ -n "$NEW_AIRTABLE_TOKEN" ]; then
    sed -i.bak "s/AIRTABLE_API_KEY=.*/AIRTABLE_API_KEY=$NEW_AIRTABLE_TOKEN/" .env
    print_success "Airtable token configured"
fi

read -p "Enter Airtable Base ID (default: app4zaMcAmxXyRRVf): " NEW_BASE_ID
if [ -n "$NEW_BASE_ID" ]; then
    sed -i.bak "s/AIRTABLE_BASE_ID=.*/AIRTABLE_BASE_ID=$NEW_BASE_ID/" .env
    print_success "Airtable base configured"
fi

# ============================================
# CLOUDFLARE SETUP
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "☁️  CLOUDFLARE CONFIGURATION"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: Cloudflare Dashboard > My Profile > API Tokens"
echo "2. Click 'Create Token'"
echo "3. Use template: 'Edit Cloudflare Workers'"
echo "4. Add permissions: Account:Cloudflare Pages:Edit"
echo "5. Copy the token"
echo ""

read -p "Enter Cloudflare API Token: " NEW_CF_TOKEN
if [ -n "$NEW_CF_TOKEN" ]; then
    sed -i.bak "s/CLOUDFLARE_API_TOKEN=.*/CLOUDFLARE_API_TOKEN=$NEW_CF_TOKEN/" .env
    print_success "Cloudflare token configured"
    
    # Test and get account ID
    echo "Fetching Cloudflare account info..."
    CF_ACCOUNT=$(curl -s -X GET "https://api.cloudflare.com/client/v4/accounts" \
        -H "Authorization: Bearer $NEW_CF_TOKEN" \
        -H "Content-Type: application/json" | \
        grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
    
    if [ -n "$CF_ACCOUNT" ]; then
        sed -i.bak "s/CLOUDFLARE_ACCOUNT_ID=.*/CLOUDFLARE_ACCOUNT_ID=$CF_ACCOUNT/" .env
        print_success "Cloudflare Account ID: $CF_ACCOUNT"
    fi
fi

# ============================================
# GOOGLE ANALYTICS SETUP
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📈 GOOGLE ANALYTICS SETUP"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "1. Go to: https://analytics.google.com"
echo "2. Admin > Create Property > 'Blaze Intelligence'"
echo "3. Get your Measurement ID (G-XXXXXXXXXX)"
echo ""

read -p "Enter Google Analytics ID (G-XXXXXXXXXX): " NEW_GA_ID
if [ -n "$NEW_GA_ID" ]; then
    sed -i.bak "s/GOOGLE_ANALYTICS_ID=.*/GOOGLE_ANALYTICS_ID=$NEW_GA_ID/" .env
    print_success "Google Analytics configured"
    
    # Add to site
    echo "Adding Google Analytics to site..."
    GA_SCRIPT="<!-- Google Analytics -->
<script async src=\"https://www.googletagmanager.com/gtag/js?id=$NEW_GA_ID\"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', '$NEW_GA_ID');
</script>"
    
    # Create analytics include file
    echo "$GA_SCRIPT" > includes/analytics.html
    print_success "Analytics script created in includes/analytics.html"
fi

# ============================================
# MONITORING SETUP
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🔍 MONITORING & ERROR TRACKING"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Optional: Set up Sentry for error tracking"
echo "1. Go to: https://sentry.io"
echo "2. Create project > JavaScript"
echo "3. Copy the DSN"
echo ""

read -p "Enter Sentry DSN (optional): " NEW_SENTRY_DSN
if [ -n "$NEW_SENTRY_DSN" ]; then
    sed -i.bak "s|SENTRY_DSN=.*|SENTRY_DSN=$NEW_SENTRY_DSN|" .env
    print_success "Sentry configured"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 CONFIGURATION SUMMARY"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Check what's configured
echo "Configured Integrations:"
[ -n "$NEW_NOTION_TOKEN" ] && echo "  ✅ Notion CMS"
[ -n "$NEW_HUBSPOT_TOKEN" ] && echo "  ✅ HubSpot CRM"
[ -n "$NEW_AIRTABLE_TOKEN" ] && echo "  ✅ Airtable"
[ -n "$NEW_CF_TOKEN" ] && echo "  ✅ Cloudflare"
[ -n "$NEW_GA_ID" ] && echo "  ✅ Google Analytics"
[ -n "$NEW_SENTRY_DSN" ] && echo "  ✅ Sentry Monitoring"

echo ""
echo "Next Steps:"
echo "1. Test integrations: npm run test:integrations"
echo "2. Sync Notion content: ./sync-notion-content.js"
echo "3. Deploy to Cloudflare: ./deploy-production.sh"
echo "4. Configure custom domain in Cloudflare Dashboard"
echo ""

# Clean up backup files
rm -f .env.bak

print_success "Integration setup complete!"
echo ""
echo "Your configuration is saved in .env"
echo "Remember to never commit .env to git!"