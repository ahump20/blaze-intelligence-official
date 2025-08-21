#!/bin/bash

# Blaze Intelligence - Shutdown Script
# Stops all running services and agents

echo "🛑 Stopping Blaze Intelligence services..."

if [ -f ".blaze-pids" ]; then
    source .blaze-pids
    
    [ -n "$CARDINALS_PID" ] && kill $CARDINALS_PID 2>/dev/null && echo "✅ Stopped Cardinals agent"
    [ -n "$PIPELINE_PID" ] && kill $PIPELINE_PID 2>/dev/null && echo "✅ Stopped data pipeline"
    [ -n "$SERVER_PID" ] && kill $SERVER_PID 2>/dev/null && echo "✅ Stopped development server"
    
    rm -f .blaze-pids
    echo "✅ All services stopped"
else
    echo "No running services found (.blaze-pids not found)"
    
    # Try to find and kill processes by name
    pkill -f "cardinals-readiness-board.js" 2>/dev/null
    pkill -f "blaze-realtime-pipeline.js" 2>/dev/null
    pkill -f "http.server 8000" 2>/dev/null
fi

echo "Done."