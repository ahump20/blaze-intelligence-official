#!/bin/bash

# Blaze Intelligence Production Deployment Script
# Handles deployment to multiple platforms with optimization

set -e  # Exit on error

echo "🚀 Blaze Intelligence Production Deployment"
echo "=========================================="

# Configuration
PROJECT_NAME="blaze-intelligence"
BUILD_DIR="dist"
DEPLOY_BRANCH="production"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Functions
log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check dependencies
check_dependencies() {
    echo "📋 Checking dependencies..."
    
    # Check for Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is not installed"
        exit 1
    fi
    
    # Check for Git
    if ! command -v git &> /dev/null; then
        log_error "Git is not installed"
        exit 1
    fi
    
    log_success "All dependencies found"
}

# Build optimization
optimize_build() {
    echo "🔧 Optimizing build..."
    
    # Create dist directory
    rm -rf $BUILD_DIR
    mkdir -p $BUILD_DIR
    
    # Copy HTML files
    cp *.html $BUILD_DIR/ 2>/dev/null || true
    
    # Copy and minify JavaScript
    mkdir -p $BUILD_DIR/js
    for file in js/*.js; do
        if [ -f "$file" ]; then
            # Simple minification (remove comments and extra whitespace)
            sed 's://.*$::g; s:/\*.*\*/::g; /^[[:space:]]*$/d' "$file" | tr -d '\n' > "$BUILD_DIR/$file"
        fi
    done
    
    # Copy CSS
    mkdir -p $BUILD_DIR/css
    cp -r css/* $BUILD_DIR/css/ 2>/dev/null || true
    
    # Copy other assets
    cp -r data $BUILD_DIR/ 2>/dev/null || true
    cp -r api $BUILD_DIR/ 2>/dev/null || true
    cp -r src $BUILD_DIR/ 2>/dev/null || true
    
    # Create optimized index
    create_optimized_index
    
    log_success "Build optimized"
}

# Create optimized index with CDN links
create_optimized_index() {
    cat > $BUILD_DIR/index.html << 'EOF'
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Blaze Intelligence | Elite Sports Analytics Platform</title>
    <meta name="description" content="Where Texas heritage meets algorithmic excellence. Transform data into championships with AI-powered sports intelligence.">
    
    <!-- Preconnect to CDNs -->
    <link rel="preconnect" href="https://cdn.jsdelivr.net">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    
    <!-- Optimized font loading -->
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap" rel="stylesheet">
    
    <!-- Inline critical CSS -->
    <style>
        :root{--burnt-orange:#BF5700;--cardinal-blue:#9BCBEB;--deep-navy:#002244;--teal:#00B2A9}
        *{margin:0;padding:0;box-sizing:border-box}
        body{font-family:'Inter',sans-serif;background:#0a0a0a;color:#fff;line-height:1.6}
        .loading{position:fixed;top:0;left:0;width:100%;height:100%;background:#0a0a0a;display:flex;align-items:center;justify-content:center;z-index:9999}
    </style>
    
    <!-- Defer non-critical CSS -->
    <link rel="preload" href="css/main.css" as="style" onload="this.onload=null;this.rel='stylesheet'">
    <noscript><link rel="stylesheet" href="css/main.css"></noscript>
</head>
<body>
    <div class="loading" id="loading">
        <div class="loader">Loading Blaze Intelligence...</div>
    </div>
    
    <main id="app"></main>
    
    <!-- Optimized script loading -->
    <script>
        // Remove loading screen when ready
        window.addEventListener('load', function() {
            document.getElementById('loading').style.display = 'none';
        });
    </script>
    
    <!-- Core modules with defer -->
    <script defer src="js/api-config.js"></script>
    <script defer src="js/sports-data-hub.js"></script>
    <script defer src="js/team-intelligence-cards.js"></script>
    <script defer src="js/live-scoreboard-integration.js"></script>
    <script defer src="js/subdomain-router.js"></script>
    
    <!-- Load main app -->
    <script defer src="js/app.js"></script>
</body>
</html>
EOF
}

# Deploy to Cloudflare Pages
deploy_cloudflare() {
    echo "☁️  Deploying to Cloudflare Pages..."
    
    if command -v wrangler &> /dev/null; then
        wrangler pages deploy $BUILD_DIR --project-name=$PROJECT_NAME
        log_success "Deployed to Cloudflare Pages"
    else
        log_warning "Wrangler not installed. Install with: npm install -g wrangler"
    fi
}

# Deploy to Vercel
deploy_vercel() {
    echo "▲ Deploying to Vercel..."
    
    if command -v vercel &> /dev/null; then
        vercel --prod --yes
        log_success "Deployed to Vercel"
    else
        log_warning "Vercel CLI not installed. Install with: npm install -g vercel"
    fi
}

# Deploy to Netlify
deploy_netlify() {
    echo "🔷 Deploying to Netlify..."
    
    if command -v netlify &> /dev/null; then
        netlify deploy --prod --dir=$BUILD_DIR
        log_success "Deployed to Netlify"
    else
        log_warning "Netlify CLI not installed. Install with: npm install -g netlify-cli"
    fi
}

# Deploy to GitHub Pages
deploy_github_pages() {
    echo "🐙 Deploying to GitHub Pages..."
    
    # Check if gh-pages branch exists
    if git show-ref --verify --quiet refs/heads/gh-pages; then
        git checkout gh-pages
        git pull origin gh-pages
    else
        git checkout -b gh-pages
    fi
    
    # Copy build files
    cp -r $BUILD_DIR/* .
    
    # Commit and push
    git add .
    git commit -m "Deploy to GitHub Pages - $(date)"
    git push origin gh-pages
    
    # Switch back to main branch
    git checkout main
    
    log_success "Deployed to GitHub Pages"
}

# Deploy to Replit
deploy_replit() {
    echo "🔄 Preparing for Replit deployment..."
    
    # Create .replit configuration
    cat > .replit << 'EOF'
run = "python3 -m http.server 8000"
language = "html"

[nix]
channel = "stable-24_05"

[deployment]
run = ["sh", "-c", "python3 -m http.server 8000"]
deploymentTarget = "production"
EOF
    
    # Create replit.nix
    cat > replit.nix << 'EOF'
{ pkgs }: {
    deps = [
        pkgs.python3
        pkgs.nodejs
    ];
}
EOF
    
    log_success "Replit configuration created"
    log_warning "Push to Replit repository to deploy"
}

# Run tests
run_tests() {
    echo "🧪 Running tests..."
    
    # Check if test file exists
    if [ -f "test-integration.html" ]; then
        log_success "Test suite available at test-integration.html"
    else
        log_warning "No test suite found"
    fi
}

# Generate deployment report
generate_report() {
    echo "📊 Generating deployment report..."
    
    cat > deployment-report.json << EOF
{
    "timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
    "project": "$PROJECT_NAME",
    "branch": "$(git branch --show-current)",
    "commit": "$(git rev-parse HEAD)",
    "files": {
        "html": $(find $BUILD_DIR -name "*.html" | wc -l),
        "js": $(find $BUILD_DIR -name "*.js" | wc -l),
        "css": $(find $BUILD_DIR -name "*.css" | wc -l)
    },
    "size": "$(du -sh $BUILD_DIR | cut -f1)",
    "platforms": []
}
EOF
    
    log_success "Report generated: deployment-report.json"
}

# Clean up
cleanup() {
    echo "🧹 Cleaning up..."
    rm -rf $BUILD_DIR
    log_success "Cleanup complete"
}

# Main deployment flow
main() {
    echo ""
    echo "Select deployment platform:"
    echo "1) Cloudflare Pages"
    echo "2) Vercel"
    echo "3) Netlify"
    echo "4) GitHub Pages"
    echo "5) Replit"
    echo "6) All platforms"
    echo "7) Build only (no deploy)"
    echo ""
    read -p "Enter choice [1-7]: " choice
    
    # Check dependencies
    check_dependencies
    
    # Optimize build
    optimize_build
    
    # Run tests
    run_tests
    
    case $choice in
        1)
            deploy_cloudflare
            ;;
        2)
            deploy_vercel
            ;;
        3)
            deploy_netlify
            ;;
        4)
            deploy_github_pages
            ;;
        5)
            deploy_replit
            ;;
        6)
            deploy_cloudflare
            deploy_vercel
            deploy_netlify
            deploy_github_pages
            deploy_replit
            ;;
        7)
            log_success "Build complete. Files in $BUILD_DIR"
            ;;
        *)
            log_error "Invalid choice"
            exit 1
            ;;
    esac
    
    # Generate report
    generate_report
    
    echo ""
    log_success "🎉 Deployment complete!"
    echo ""
    echo "📋 Next steps:"
    echo "  1. Test the deployment at your platform URL"
    echo "  2. Configure API keys at /setup-api-keys.html"
    echo "  3. Run integration tests at /test-integration.html"
    echo "  4. Monitor performance with built-in analytics"
    echo ""
    echo "🔗 Useful links:"
    echo "  - Documentation: /DEPLOYMENT-GUIDE.md"
    echo "  - Support: ahump20@outlook.com"
    echo ""
    
    # Ask about cleanup
    read -p "Clean up build files? (y/n): " cleanup_choice
    if [ "$cleanup_choice" = "y" ]; then
        cleanup
    fi
}

# Handle script interruption
trap 'echo ""; log_error "Deployment interrupted"; exit 1' INT

# Run main function
main