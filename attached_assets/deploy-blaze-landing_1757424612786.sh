#!/bin/bash

# Blaze Intelligence Landing Page Deployment Script
# Production deployment for enhanced landing page

set -e

echo "🔥 Blaze Intelligence Landing Page Deployment"
echo "============================================="
echo ""

# Configuration
DEPLOY_DIR="blaze-intelligence-production"
FILES_TO_DEPLOY=(
    "blaze-intelligence-landing.html"
    "blaze-data-integration.js"
    "blaze-live-scoreboard.js"
)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Create deployment directory
print_status "Creating deployment directory..."
mkdir -p $DEPLOY_DIR

# Copy files
print_status "Copying production files..."
for file in "${FILES_TO_DEPLOY[@]}"; do
    if [ -f "$file" ]; then
        cp "$file" "$DEPLOY_DIR/"
        print_success "Copied $file"
    else
        print_error "File not found: $file"
        exit 1
    fi
done

# Copy additional pages and assets
print_status "Copying additional files..."
if [ -f "pricing-methods.html" ]; then
    cp "pricing-methods.html" "$DEPLOY_DIR/"
    print_success "Copied pricing-methods.html"
fi

# Copy API directory
if [ -d "api" ]; then
    cp -r "api" "$DEPLOY_DIR/"
    print_success "Copied API directory"
fi

# Copy scripts directory
if [ -d "scripts" ]; then
    cp -r "scripts" "$DEPLOY_DIR/"
    print_success "Copied scripts directory"
fi

# Rename main HTML file to index.html for deployment
cd $DEPLOY_DIR
mv blaze-intelligence-landing.html index.html
print_success "Renamed landing page to index.html"

# Create deployment configuration files

# Create _headers file for Cloudflare Pages
cat > _headers <<EOF
/*
  X-Frame-Options: DENY
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  Permissions-Policy: geolocation=(), microphone=(), camera=()
  Content-Security-Policy: default-src 'self' https:; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https:; connect-src 'self' wss://blaze-intelligence.com https://api.blaze-intelligence.com

/*.js
  Cache-Control: public, max-age=31536000, immutable

/*.css
  Cache-Control: public, max-age=31536000, immutable

/index.html
  Cache-Control: public, max-age=0, must-revalidate
EOF

print_success "Created security headers configuration"

# Create _redirects file
cat > _redirects <<EOF
# Redirects for Blaze Intelligence
/api/* https://api.blaze-intelligence.com/:splat 200
/ws wss://blaze-intelligence.com/live 200
EOF

print_success "Created redirects configuration"

# Create deployment metadata
cat > deployment-info.json <<EOF
{
  "project": "Blaze Intelligence Landing Page",
  "version": "2.0.0",
  "deployed": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "features": [
    "Three.js 3D visualizations",
    "Real-time sports data integration",
    "Live WebSocket connections",
    "Advanced Chart.js analytics",
    "GSAP animations",
    "Responsive design",
    "Cardinals Analytics integration",
    "Perfect Game youth coverage"
  ],
  "performance": {
    "lighthouse_target": 95,
    "first_contentful_paint": "<1.5s",
    "time_to_interactive": "<3s"
  }
}
EOF

print_success "Created deployment metadata"

# Optional: Deploy to Cloudflare Pages
if command -v wrangler &> /dev/null; then
    print_status "Wrangler CLI detected. Deploying to Cloudflare Pages..."
    
    # Create wrangler.toml if it doesn't exist
    if [ ! -f "wrangler.toml" ]; then
        cat > wrangler.toml <<EOF
name = "blaze-intelligence-landing"
compatibility_date = "2025-01-09"

[site]
bucket = "./"

[env.production]
name = "blaze-intelligence-production"
route = "blaze-intelligence.com/*"
EOF
        print_success "Created wrangler.toml configuration"
    fi
    
    # Deploy to Cloudflare Pages
    print_status "Deploying to Cloudflare Pages..."
    # Uncomment the following line to actually deploy
    # wrangler pages deploy . --project-name="blaze-intelligence" --branch=main
    print_warning "Run 'wrangler pages deploy . --project-name=\"blaze-intelligence\"' to deploy"
else
    print_warning "Wrangler CLI not found. Manual deployment required."
fi

# Create local preview server script
cat > preview.sh <<'EOF'
#!/bin/bash
echo "🚀 Starting Blaze Intelligence preview server..."
echo "Access at: http://localhost:3000"
python3 -m http.server 3000
EOF
chmod +x preview.sh

print_success "Created preview server script"

# Summary
echo ""
echo "=========================================="
echo -e "${GREEN}✅ Deployment preparation complete!${NC}"
echo "=========================================="
echo ""
echo "Files ready for deployment in: $DEPLOY_DIR/"
echo ""
echo "Next steps:"
echo "1. Preview locally: cd $DEPLOY_DIR && ./preview.sh"
echo "2. Deploy to Cloudflare Pages:"
echo "   cd $DEPLOY_DIR && wrangler pages deploy . --project-name=\"blaze-intelligence\""
echo "3. Or deploy to your preferred hosting platform"
echo ""
echo "Production URLs:"
echo "- Primary: https://blaze-intelligence.com"
echo "- Cloudflare Pages: https://blaze-intelligence.pages.dev"
echo ""
print_success "🔥 Blaze Intelligence is ready for launch!"

cd ..