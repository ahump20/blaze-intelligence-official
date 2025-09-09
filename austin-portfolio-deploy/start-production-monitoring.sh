#!/bin/bash

# Blaze Intelligence Production Monitoring Startup Script
# Championship-level system monitoring

echo "🏆 BLAZE INTELLIGENCE PRODUCTION MONITORING"
echo "==========================================="
echo "Deployment: https://blaze-intelligence.pages.dev"
echo "Starting championship-level monitoring..."
echo ""

# Create monitoring directory if it doesn't exist
mkdir -p /Users/AustinHumphrey/austin-portfolio-deploy/monitoring/logs

# Start health monitoring
echo "📊 Starting health monitor..."
nohup node /Users/AustinHumphrey/austin-portfolio-deploy/monitoring/health-monitor.cjs > /Users/AustinHumphrey/austin-portfolio-deploy/monitoring/logs/monitor.log 2>&1 &
HEALTH_PID=$!

# Save process ID for later management
echo $HEALTH_PID > /Users/AustinHumphrey/austin-portfolio-deploy/monitoring/health-monitor.pid

echo "✅ Health monitor started (PID: $HEALTH_PID)"
echo "📋 Monitoring metrics:"
echo "   • Response time tracking"  
echo "   • Uptime monitoring"
echo "   • Performance alerts"
echo "   • Content verification"
echo ""

# Quick system verification
echo "🔍 Quick system verification..."
RESPONSE_TIME=$(curl -w "%{time_total}" -s -o /dev/null https://a7d36daa.blaze-intelligence.pages.dev)
if [ $? -eq 0 ]; then
    echo "✅ System responsive (${RESPONSE_TIME}s)"
else
    echo "❌ System check failed"
fi

# Check if Cardinals data is fresh
if [ -f "/Users/AustinHumphrey/austin-portfolio-deploy/data/analytics/cardinals.json" ]; then
    LAST_UPDATE=$(stat -f "%m" /Users/AustinHumphrey/austin-portfolio-deploy/data/analytics/cardinals.json)
    CURRENT_TIME=$(date +%s)
    TIME_DIFF=$((CURRENT_TIME - LAST_UPDATE))
    
    if [ $TIME_DIFF -lt 1800 ]; then  # 30 minutes
        echo "✅ Cardinals analytics fresh (updated ${TIME_DIFF}s ago)"
    else
        echo "⚠️  Cardinals analytics may need refresh (${TIME_DIFF}s ago)"
    fi
fi

echo ""
echo "🚀 PRODUCTION MONITORING ACTIVE"
echo "================================"
echo "Status: CHAMPIONSHIP LEVEL"
echo "URL: https://blaze-intelligence.pages.dev"
echo "Monitor PID: $HEALTH_PID"
echo "Logs: /Users/AustinHumphrey/austin-portfolio-deploy/monitoring/logs/"
echo ""
echo "To stop monitoring: kill $HEALTH_PID"
echo "To view real-time logs: tail -f /Users/AustinHumphrey/austin-portfolio-deploy/monitoring/logs/monitor.log"