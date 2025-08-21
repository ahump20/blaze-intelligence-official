#!/bin/bash
# Blaze Intelligence - Production Auto-Refresh System

echo "🔥 Starting Blaze Intelligence Production Systems..."

# Start Cardinals data refresh (every 10 minutes)
echo "📊 Starting Cardinals data refresh (10-minute intervals)..."
node scripts/simulate-live-data.js start 600 &
DATA_PID=$!

# Start performance monitoring (every 5 minutes)
echo "🔍 Starting performance monitoring (5-minute intervals)..."
node monitoring/performance-alerts.js watch 5 &
MONITOR_PID=$!

echo "✅ Production systems started"
echo "   Data Refresh PID: $DATA_PID"
echo "   Monitoring PID: $MONITOR_PID"
echo ""
echo "To stop: kill $DATA_PID $MONITOR_PID"

# Keep script running
wait
