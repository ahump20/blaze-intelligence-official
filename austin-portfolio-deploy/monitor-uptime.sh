#!/bin/bash

# Blaze Intelligence Uptime Monitor
URLS=(
    "https://blaze-intelligence.pages.dev"
    "https://blaze-intelligence.pages.dev/dashboard"
    "https://blaze-intelligence.pages.dev/api/health"
)

for URL in "${URLS[@]}"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" "$URL")
    RESPONSE_TIME=$(curl -s -o /dev/null -w "%{time_total}" "$URL")
    
    if [ "$STATUS" == "200" ]; then
        echo "✅ $URL - Status: $STATUS - Response: ${RESPONSE_TIME}s"
    else
        echo "❌ $URL - Status: $STATUS - ALERT!"
        # Send alert (implement your notification method here)
    fi
done
