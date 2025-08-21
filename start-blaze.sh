#!/bin/bash

# Blaze Intelligence - Master Startup Script
# Starts all services and agents for local development

echo "🔥 BLAZE INTELLIGENCE - System Startup"
echo "======================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${BLUE}[START]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    print_warning "Not in blaze-intelligence-website directory, attempting to navigate..."
    cd blaze-intelligence-website 2>/dev/null || {
        echo "❌ Cannot find blaze-intelligence-website directory"
        exit 1
    }
fi

# Step 1: Install dependencies if needed
if [ ! -d "node_modules" ]; then
    print_status "Installing dependencies..."
    npm install
fi

# Step 2: Start Cardinals Readiness Board Agent
print_status "Starting Cardinals Readiness Board Agent..."
node agents/cardinals-readiness-board.js &
CARDINALS_PID=$!
print_success "Cardinals agent started (PID: $CARDINALS_PID)"

# Step 3: Start Real-time Data Pipeline
print_status "Starting Real-time Data Pipeline..."
node src/data-pipeline/blaze-realtime-pipeline.js &
PIPELINE_PID=$!
print_success "Data pipeline started (PID: $PIPELINE_PID)"

# Step 4: Start local development server
print_status "Starting local development server..."
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000 &
    SERVER_PID=$!
    print_success "Development server started on http://localhost:8000 (PID: $SERVER_PID)"
elif command -v python &> /dev/null; then
    python -m SimpleHTTPServer 8000 &
    SERVER_PID=$!
    print_success "Development server started on http://localhost:8000 (PID: $SERVER_PID)"
else
    print_warning "Python not found, skipping local server"
    SERVER_PID=""
fi

# Step 5: Create PID file for easy shutdown
echo "CARDINALS_PID=$CARDINALS_PID" > .blaze-pids
echo "PIPELINE_PID=$PIPELINE_PID" >> .blaze-pids
echo "SERVER_PID=$SERVER_PID" >> .blaze-pids

# Step 6: Display status
echo ""
echo "======================================"
echo -e "${GREEN}🚀 BLAZE INTELLIGENCE IS RUNNING${NC}"
echo "======================================"
echo ""
echo "Services:"
echo "  • Cardinals Readiness Agent: Running (updates every 10 min)"
echo "  • Real-time Data Pipeline: Running (Cardinals/Titans/Longhorns/Grizzlies)"
if [ -n "$SERVER_PID" ]; then
    echo "  • Development Server: http://localhost:8000"
fi
echo ""
echo "Data Outputs:"
echo "  • Readiness Data: src/data/readiness.json"
echo "  • Team Analytics: src/data/analytics/*.json"
echo ""
echo "Management:"
echo "  • View logs: tail -f *.log"
echo "  • Stop all: ./stop-blaze.sh"
echo "  • Deploy: ./deploy-production.sh"
echo "  • Security scan: ./security-scan.sh"
echo ""
echo "Press Ctrl+C to stop all services"
echo ""

# Trap SIGINT to cleanup
cleanup() {
    echo ""
    echo "Shutting down Blaze Intelligence services..."
    
    [ -n "$CARDINALS_PID" ] && kill $CARDINALS_PID 2>/dev/null
    [ -n "$PIPELINE_PID" ] && kill $PIPELINE_PID 2>/dev/null
    [ -n "$SERVER_PID" ] && kill $SERVER_PID 2>/dev/null
    
    rm -f .blaze-pids
    
    echo "✅ All services stopped"
    exit 0
}

trap cleanup SIGINT SIGTERM

# Keep script running
while true; do
    sleep 60
    
    # Health check
    if ! kill -0 $CARDINALS_PID 2>/dev/null; then
        print_warning "Cardinals agent stopped, restarting..."
        node agents/cardinals-readiness-board.js &
        CARDINALS_PID=$!
    fi
    
    if ! kill -0 $PIPELINE_PID 2>/dev/null; then
        print_warning "Data pipeline stopped, restarting..."
        node src/data-pipeline/blaze-realtime-pipeline.js &
        PIPELINE_PID=$!
    fi
done