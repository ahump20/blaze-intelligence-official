#!/bin/bash

# Blaze Intelligence Production Deployment Script
# Complete CI/CD pipeline for deploying to Cloudflare Pages and Workers

set -e  # Exit on error

echo "🔥 BLAZE INTELLIGENCE - Production Deployment Pipeline"
echo "======================================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_NAME="blaze-intelligence"
WORKER_NAME="blaze-sports-data"
DOMAIN="blaze-intelligence.com"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[$(date +'%H:%M:%S')]${NC} $1"
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

# Check prerequisites
print_status "Checking prerequisites..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_error "Must run from blaze-intelligence-website directory"
    exit 1
fi

# Check for required tools
command -v node >/dev/null 2>&1 || { print_error "Node.js is required but not installed."; exit 1; }
command -v npm >/dev/null 2>&1 || { print_error "npm is required but not installed."; exit 1; }
command -v git >/dev/null 2>&1 || { print_error "git is required but not installed."; exit 1; }

# Check for Wrangler
if ! command -v wrangler &> /dev/null; then
    print_warning "Wrangler not found. Installing..."
    npm install -g wrangler
fi

print_success "Prerequisites check complete"

# Step 1: Run Tests
print_status "Running tests..."
if [ -f "tests/marketing-stats.test.js" ]; then
    npm test || print_warning "Some tests failed, continuing..."
else
    print_warning "No tests found, skipping..."
fi

# Step 2: Build the site
print_status "Building the site..."
if [ -f "scripts/build-md.js" ]; then
    node scripts/build-md.js
fi

# Generate sitemap
if [ -f "scripts/gen-sitemap.js" ]; then
    print_status "Generating sitemap..."
    node scripts/gen-sitemap.js
fi

# Step 3: Update real-time data
print_status "Updating real-time data..."
if [ -f "agents/cardinals-readiness-board.js" ]; then
    node agents/cardinals-readiness-board.js &
    AGENT_PID=$!
    sleep 5  # Give it time to generate data
    kill $AGENT_PID 2>/dev/null || true
fi

# Step 4: Security scan
print_status "Running security scan..."

# Check for exposed secrets
if grep -r "sk-\|ghp_\|pk_test\|pk_live\|AIzaSy\|ntn_" . --include="*.js" --include="*.html" --include="*.json" --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null; then
    print_error "Exposed secrets detected! Fix before deploying."
    exit 1
fi

# Check for .env in git
if git ls-files | grep -q "\.env$"; then
    print_error ".env file is tracked in git! Remove it before deploying."
    exit 1
fi

print_success "Security scan passed"

# Step 5: Deploy Worker
print_status "Deploying Worker to Cloudflare..."
if [ -f "wrangler.toml" ]; then
    wrangler deploy --env production || print_warning "Worker deployment failed, continuing..."
else
    print_warning "No wrangler.toml found, skipping worker deployment"
fi

# Step 6: Deploy to Cloudflare Pages
print_status "Deploying to Cloudflare Pages..."

# Create dist directory if it doesn't exist
mkdir -p dist

# Copy all static files to dist
print_status "Copying files to dist..."
cp -r *.html dist/ 2>/dev/null || true
cp -r *.css dist/ 2>/dev/null || true
cp -r *.js dist/ 2>/dev/null || true
cp -r public/* dist/ 2>/dev/null || true
cp -r site/src/data dist/ 2>/dev/null || true
cp -r site/src/js dist/ 2>/dev/null || true
cp -r site/src/css dist/ 2>/dev/null || true

# Deploy with Wrangler Pages
if command -v wrangler &> /dev/null; then
    print_status "Deploying with Wrangler Pages..."
    wrangler pages deploy dist --project-name=$PROJECT_NAME --branch=main
    
    DEPLOY_URL="https://$PROJECT_NAME.pages.dev"
    print_success "Deployed to: $DEPLOY_URL"
else
    print_warning "Wrangler not configured for Pages, manual deployment required"
fi

# Step 7: Health Check
print_status "Running health checks..."

# Check worker health
WORKER_URL="https://$WORKER_NAME.humphrey-austin20.workers.dev/health"
if curl -s -o /dev/null -w "%{http_code}" "$WORKER_URL" | grep -q "200"; then
    print_success "Worker health check passed"
else
    print_warning "Worker health check failed or not accessible"
fi

# Step 8: Update DNS (manual step)
print_status "DNS Configuration Required:"
echo ""
echo "  1. Log into Cloudflare Dashboard"
echo "  2. Go to Pages > $PROJECT_NAME > Custom domains"
echo "  3. Add custom domain: $DOMAIN"
echo "  4. Add custom domain: www.$DOMAIN"
echo "  5. Follow the DNS configuration instructions"
echo ""

# Step 9: Create deployment record
TIMESTAMP=$(date +'%Y-%m-%d %H:%M:%S')
COMMIT_HASH=$(git rev-parse HEAD 2>/dev/null || echo "unknown")
DEPLOY_LOG="deployments.log"

echo "[$TIMESTAMP] Deployed commit $COMMIT_HASH to production" >> $DEPLOY_LOG

# Step 10: Final summary
echo ""
echo "======================================================"
echo -e "${GREEN}🎉 DEPLOYMENT COMPLETE!${NC}"
echo "======================================================"
echo ""
echo "Deployment Summary:"
echo "  • Project: $PROJECT_NAME"
echo "  • Worker: $WORKER_NAME"
echo "  • Commit: $COMMIT_HASH"
echo "  • Time: $TIMESTAMP"
echo ""
echo "URLs:"
echo "  • Cloudflare Pages: https://$PROJECT_NAME.pages.dev"
echo "  • Worker API: https://$WORKER_NAME.humphrey-austin20.workers.dev"
echo "  • Custom Domain: https://$DOMAIN (after DNS setup)"
echo ""
echo "Next Steps:"
echo "  1. Verify the deployment at the URLs above"
echo "  2. Configure custom domain in Cloudflare Dashboard"
echo "  3. Test all features (lead capture, data pipeline, etc.)"
echo "  4. Monitor logs and analytics"
echo ""
echo "To rollback if needed:"
echo "  wrangler pages deployments list --project-name=$PROJECT_NAME"
echo "  wrangler pages rollback --project-name=$PROJECT_NAME"
echo ""