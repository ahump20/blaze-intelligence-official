#!/bin/bash

echo "🛑 Stopping Blaze Intelligence BDN Platform..."

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

# Read PIDs from files
if [ -f "logs/mcp.pid" ]; then
    MCP_PID=$(cat logs/mcp.pid)
    if ps -p $MCP_PID > /dev/null 2>&1; then
        kill $MCP_PID
        echo -e "${GREEN}✓ Cardinals MCP Server stopped${NC}"
    else
        echo -e "${YELLOW}Cardinals MCP Server not running${NC}"
    fi
    rm logs/mcp.pid
else
    echo -e "${YELLOW}No MCP Server PID file found${NC}"
fi

if [ -f "logs/bdn.pid" ]; then
    BDN_PID=$(cat logs/bdn.pid)
    if ps -p $BDN_PID > /dev/null 2>&1; then
        kill $BDN_PID
        echo -e "${GREEN}✓ BDN Platform stopped${NC}"
    else
        echo -e "${YELLOW}BDN Platform not running${NC}"
    fi
    rm logs/bdn.pid
else
    echo -e "${YELLOW}No BDN Platform PID file found${NC}"
fi

# Also kill any orphaned processes on the ports
echo "Checking for orphaned processes..."
lsof -ti:3000 | xargs kill 2>/dev/null && echo -e "${GREEN}✓ Cleared port 3000${NC}"
lsof -ti:4000 | xargs kill 2>/dev/null && echo -e "${GREEN}✓ Cleared port 4000${NC}"

echo -e "\n${GREEN}All services stopped${NC}"