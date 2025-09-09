#!/bin/bash

echo "🔥 Starting Blaze Intelligence BDN Platform..."
echo "================================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if node is installed
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js 18+ first.${NC}"
    exit 1
fi

# Check node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt "18" ]; then
    echo -e "${YELLOW}Warning: Node.js 18+ is recommended. Current version: $(node -v)${NC}"
fi

# Function to check if port is in use
check_port() {
    if lsof -Pi :$1 -sTCP:LISTEN -t >/dev/null ; then
        echo -e "${YELLOW}Port $1 is already in use${NC}"
        return 1
    fi
    return 0
}

# Check required ports
echo "Checking ports..."
check_port 3000 || { echo -e "${RED}Port 3000 (BDN Platform) is in use${NC}"; }
check_port 4000 || { echo -e "${RED}Port 4000 (MCP Server) is in use${NC}"; }

# Install dependencies if needed
echo -e "\n${GREEN}Installing dependencies...${NC}"

# Cardinals MCP Server
if [ ! -d "services/cardinals-mcp/node_modules" ]; then
    echo "Installing Cardinals MCP dependencies..."
    cd services/cardinals-mcp
    npm install
    cd ../..
fi

# BDN Platform
if [ ! -d "apps/bdn-platform/node_modules" ]; then
    echo "Installing BDN Platform dependencies..."
    cd apps/bdn-platform
    npm install
    cd ../..
fi

# Create logs directory
mkdir -p logs

# Start services
echo -e "\n${GREEN}Starting services...${NC}"

# Start Cardinals MCP Server
echo "Starting Cardinals Analytics MCP Server on port 4000..."
cd services/cardinals-mcp
node server.js > ../../logs/mcp-server.log 2>&1 &
MCP_PID=$!
cd ../..

# Wait for MCP server to start
sleep 2

# Check if MCP server started
if ps -p $MCP_PID > /dev/null; then
    echo -e "${GREEN}✓ Cardinals MCP Server started (PID: $MCP_PID)${NC}"
else
    echo -e "${RED}✗ Cardinals MCP Server failed to start${NC}"
    exit 1
fi

# Start BDN Platform
echo "Starting BDN Platform on port 3000..."
cd apps/bdn-platform

# Check if Python 3 is available for simple HTTP server
if command -v python3 &> /dev/null; then
    echo "Using Python HTTP server..."
    python3 -m http.server 3000 > ../../logs/bdn-platform.log 2>&1 &
    BDN_PID=$!
else
    echo "Python 3 not found. Using Node.js serve..."
    npx serve -s . -p 3000 > ../../logs/bdn-platform.log 2>&1 &
    BDN_PID=$!
fi

cd ../..

# Wait for platform to start
sleep 2

# Check if platform started
if ps -p $BDN_PID > /dev/null; then
    echo -e "${GREEN}✓ BDN Platform started (PID: $BDN_PID)${NC}"
else
    echo -e "${RED}✗ BDN Platform failed to start${NC}"
    kill $MCP_PID 2>/dev/null
    exit 1
fi

# Save PIDs for shutdown
echo $MCP_PID > logs/mcp.pid
echo $BDN_PID > logs/bdn.pid

# Success message
echo ""
echo "================================================"
echo -e "${GREEN}🔥 Blaze Intelligence BDN Platform is running!${NC}"
echo "================================================"
echo ""
echo "Access points:"
echo "  • BDN Platform:    http://localhost:3000"
echo "  • MCP Server API:  http://localhost:4000/api/cardinals/readiness"
echo "  • WebSocket:       ws://localhost:4000"
echo "  • SSE Stream:      http://localhost:4000/api/events/stream"
echo ""
echo "Logs:"
echo "  • MCP Server: logs/mcp-server.log"
echo "  • BDN Platform: logs/bdn-platform.log"
echo ""
echo "To stop all services, run: ./stop-bdn.sh"
echo ""

# Open browser
if command -v open &> /dev/null; then
    echo "Opening BDN Platform in browser..."
    sleep 2
    open http://localhost:3000
elif command -v xdg-open &> /dev/null; then
    echo "Opening BDN Platform in browser..."
    sleep 2
    xdg-open http://localhost:3000
fi

# Keep script running and show logs
echo -e "\n${YELLOW}Press Ctrl+C to stop all services${NC}\n"

# Trap Ctrl+C to clean shutdown
trap 'echo -e "\n${YELLOW}Shutting down services...${NC}"; kill $MCP_PID $BDN_PID 2>/dev/null; exit' INT

# Tail logs
tail -f logs/mcp-server.log logs/bdn-platform.log