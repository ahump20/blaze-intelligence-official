#!/bin/bash

# Blaze Intelligence Cloudflare Deployment Script
# Deploys to Cloudflare Pages with proper configuration

set -e

echo "🚀 Deploying Blaze Intelligence to Cloudflare Pages..."

# Variables
PROJECT_NAME="blaze-intelligence"
BRANCH="main"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}📦 Preparing deployment...${NC}"

# Check if we're in the right directory
if [ ! -f "index.html" ]; then
    echo "Error: index.html not found. Please run from the austin-portfolio-deploy directory."
    exit 1
fi

# Create a temporary wrangler.toml for Pages deployment
cat > wrangler-pages.toml << 'EOF'
name = "blaze-intelligence"
compatibility_date = "2024-09-01"
pages_build_output_dir = "."

[env.production]
name = "blaze-intelligence-production"

[[env.production.r2_buckets]]
binding = "BLAZE_STORAGE"
bucket_name = "blaze-intelligence-data"

[[r2_buckets]]
binding = "BLAZE_STORAGE"
bucket_name = "blaze-intelligence-data"

[env.production.vars]
API_VERSION = "1.0.0"
CACHE_TTL = "300"
ENVIRONMENT = "production"
EOF

echo -e "${BLUE}🔄 Deploying to Cloudflare Pages...${NC}"

# Deploy using the Pages-specific config
npx wrangler pages deploy . \
    --project-name="$PROJECT_NAME" \
    --branch="$BRANCH" \
    --commit-message="Deploy: $TIMESTAMP" \
    --commit-hash="$(git rev-parse HEAD 2>/dev/null || echo 'local')"

# Clean up temporary config
rm -f wrangler-pages.toml

echo -e "${GREEN}✅ Deployment complete!${NC}"
echo ""
echo "🌐 Your site should be available at:"
echo "   https://blaze-intelligence.pages.dev"
echo "   https://$BRANCH.blaze-intelligence.pages.dev"
echo ""
echo "📊 View deployment status at:"
echo "   https://dash.cloudflare.com/?to=/:account/pages/view/$PROJECT_NAME"
echo ""
echo -e "${YELLOW}⚠️  Note: First deployment may take a few minutes to propagate${NC}"

# Optional: Set up custom domain if not already configured
echo ""
echo "To set up custom domain (blaze-intelligence.com):"
echo "1. Go to Cloudflare Pages dashboard"
echo "2. Select your project"
echo "3. Go to 'Custom domains' tab"
echo "4. Add your domain"
echo ""
echo "Happy launching! 🎉"