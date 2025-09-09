#!/bin/bash

# Blaze Intelligence Ultimate Platform Launcher
# Deploys and launches the complete championship analytics platform

echo "🔥 BLAZE INTELLIGENCE ULTIMATE PLATFORM LAUNCHER"
echo "=================================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
ORANGE='\033[0;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Function to print status
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${ORANGE}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check if we're in the right directory
if [[ ! -f "blaze-intelligence-ultimate-championship.html" ]]; then
    print_error "Ultimate platform file not found. Please run from austin-portfolio-deploy directory."
    exit 1
fi

print_status "Initializing Blaze Intelligence Ultimate Platform..."

# Validate all required files exist
print_status "Validating platform components..."

required_files=(
    "blaze-intelligence-ultimate-championship.html"
    "dist/js/blaze-advanced-analytics.js"
    "dist/js/blaze-unified-data.js"
    "dist/js/blaze-ai-scoring.js" 
    "dist/js/blaze-three-visuals.js"
)

missing_files=0
for file in "${required_files[@]}"; do
    if [[ -f "$file" ]]; then
        print_success "$file found"
    else
        print_error "$file missing"
        missing_files=$((missing_files + 1))
    fi
done

if [[ $missing_files -gt 0 ]]; then
    print_error "Missing $missing_files critical files. Platform cannot launch."
    exit 1
fi

# Launch validation
print_status "Running platform validation..."
if [[ -f "validate-ultimate-platform.html" ]]; then
    print_success "Validation suite available"
    echo ""
    echo "🧪 To run validation tests, open: validate-ultimate-platform.html"
else
    print_warning "Validation suite not found"
fi

# Check for local server options
print_status "Checking server options..."

if command -v python3 &> /dev/null; then
    print_success "Python3 available for local server"
    PYTHON_CMD="python3"
elif command -v python &> /dev/null; then
    print_success "Python available for local server"
    PYTHON_CMD="python"
else
    print_warning "Python not found - manual file opening required"
    PYTHON_CMD=""
fi

if command -v node &> /dev/null; then
    print_success "Node.js available"
    NODE_AVAILABLE=true
else
    print_warning "Node.js not found"
    NODE_AVAILABLE=false
fi

# Platform launch options
echo ""
echo "🚀 PLATFORM LAUNCH OPTIONS:"
echo "================================"
echo ""

if [[ -n "$PYTHON_CMD" ]]; then
    echo "1. 🔥 CHAMPIONSHIP MODE (Recommended)"
    echo "   Launch ultimate platform with local server"
    echo "   Command: $PYTHON_CMD -m http.server 8080"
    echo "   URL: http://localhost:8080/blaze-intelligence-ultimate-championship.html"
    echo ""
fi

echo "2. 📁 DIRECT ACCESS"
echo "   Open platform file directly in browser"
echo "   File: $(pwd)/blaze-intelligence-ultimate-championship.html"
echo ""

echo "3. 🧪 VALIDATION MODE"
echo "   Run platform tests and diagnostics"
echo "   File: $(pwd)/validate-ultimate-platform.html"
echo ""

# Auto-launch option
read -p "🔥 Launch Championship Mode automatically? (y/n): " -n 1 -r
echo ""

if [[ $REPLY =~ ^[Yy]$ ]] && [[ -n "$PYTHON_CMD" ]]; then
    print_status "Starting Championship Mode..."
    
    # Kill any existing server on port 8080
    lsof -ti:8080 | xargs kill -9 2>/dev/null || true
    
    print_success "Server starting on port 8080..."
    print_success "Platform URL: http://localhost:8080/blaze-intelligence-ultimate-championship.html"
    print_success "Validation URL: http://localhost:8080/validate-ultimate-platform.html"
    
    echo ""
    echo "🏆 BLAZE INTELLIGENCE ULTIMATE PLATFORM IS NOW LIVE!"
    echo "=================================================="
    echo ""
    echo "🎯 Features Available:"
    echo "   • Championship Analytics Dashboard"
    echo "   • Real-time Sports Data Processing"
    echo "   • Vision AI Character Assessment" 
    echo "   • Advanced ELO & Kalman Filtering"
    echo "   • Three.js 3D Visualizations"
    echo "   • Multi-lab Intelligence System"
    echo ""
    echo "⚡ Performance Targets:"
    echo "   • <100ms Latency"
    echo "   • 94.6% Accuracy"
    echo "   • 2.8M+ Data Points"
    echo ""
    echo "Press Ctrl+C to stop the server"
    echo ""
    
    # Check if browser opening is available
    if command -v open &> /dev/null; then
        print_status "Opening platform in browser..."
        sleep 2
        open "http://localhost:8080/blaze-intelligence-ultimate-championship.html"
    elif command -v xdg-open &> /dev/null; then
        print_status "Opening platform in browser..."
        sleep 2
        xdg-open "http://localhost:8080/blaze-intelligence-ultimate-championship.html"
    fi
    
    # Start server
    $PYTHON_CMD -m http.server 8080
    
else
    echo ""
    print_status "Manual launch selected. Platform files ready."
    echo ""
    echo "🔥 To launch manually:"
    if [[ -n "$PYTHON_CMD" ]]; then
        echo "   $PYTHON_CMD -m http.server 8080"
    fi
    echo "   Then open: http://localhost:8080/blaze-intelligence-ultimate-championship.html"
    echo ""
fi

print_success "Blaze Intelligence Ultimate Platform deployment complete!"