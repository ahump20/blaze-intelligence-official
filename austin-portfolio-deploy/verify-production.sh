#!/bin/bash
echo "🔍 Verifying production domain..."
while true; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://blaze-intelligence.com)
    if [ "$STATUS" = "200" ]; then
        if curl -s https://blaze-intelligence.com | grep -q "Blaze Intelligence.*Cognitive Performance"; then
            echo "✅ SUCCESS! Domain is live with full platform!"
            open https://blaze-intelligence.com
            break
        fi
    else
        echo "Status: $STATUS - waiting..."
    fi
    sleep 10
done
