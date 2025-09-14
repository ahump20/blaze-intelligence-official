#!/bin/bash

# Blaze Intelligence Production Deployment Script
echo "🚀 Deploying Blaze Intelligence to Production..."

# Set environment
export NODE_ENV=production
export LOG_LEVEL=info

# Update system packages if needed
echo "📦 Installing/updating dependencies..."
npm ci --only=production

# Run security audit
echo "🔒 Running security audit..."
npm audit --audit-level moderate

# Run tests before deployment
echo "🧪 Running test suite..."
npm test

# Check if PM2 is available
if command -v pm2 &> /dev/null; then
    echo "🔄 Deploying with PM2..."
    pm2 stop blaze-intelligence 2>/dev/null || true
    pm2 delete blaze-intelligence 2>/dev/null || true
    pm2 start ecosystem.config.cjs --env production
    pm2 save
    echo "✅ PM2 deployment complete"
else
    echo "🔄 Starting with Node.js directly..."
    nohup node server.js > logs/production.log 2>&1 &
    echo $! > .pid
    echo "✅ Server started in background"
fi

echo "🎉 Blaze Intelligence deployment complete!"
echo "📊 Check logs: tail -f logs/combined.log"
echo "🌐 Application running on port 5000"