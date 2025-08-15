#!/bin/bash

echo "🚀 FINAL LAUNCH MONITOR - BLAZE INTELLIGENCE"
echo "============================================"
echo ""
echo "🔄 Monitoring DNS changes every 30 seconds until your site is live..."
echo "   Press Ctrl+C to stop monitoring"
echo ""

attempt=1
start_time=$(date +%s)

while true; do
    current_time=$(date +%s)
    elapsed=$((current_time - start_time))
    
    echo "🕒 Check #$attempt - $(date) (${elapsed}s elapsed)"
    echo "─────────────────────────────────────────────────"
    
    # Check A records
    a_records=$(dig A blaze-intelligence.com +short | sort)
    github_found=false
    
    echo "DNS A Records:"
    if [[ -n "$a_records" ]]; then
        while IFS= read -r ip; do
            if [[ "$ip" =~ ^185\.199\.(108|109|110|111)\.153$ ]]; then
                echo "   ✅ $ip (GitHub Pages)"
                github_found=true
            elif [[ "$ip" =~ ^104\.21\.|^172\.67\. ]]; then
                echo "   ⏳ $ip (Cloudflare - updating)"
            else
                echo "   ❓ $ip (Unknown)"
            fi
        done <<< "$a_records"
    else
        echo "   ❌ No A records found"
    fi
    
    # Check TXT record
    txt_record=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short | tr -d '"')
    echo ""
    echo "GitHub Verification:"
    if [[ "$txt_record" == "6e8710d0a2b450e076e43b0f743949" ]]; then
        echo "   ✅ TXT record verified"
        txt_verified=true
    else
        echo "   ⏳ TXT record pending"
        txt_verified=false
    fi
    
    # Test website access
    echo ""
    echo "Website Access:"
    https_working=false
    http_working=false
    
    if curl -s -I "https://blaze-intelligence.com" 2>/dev/null | head -1 | grep -q "200"; then
        echo "   🎉 HTTPS: WORKING!"
        https_working=true
    elif curl -s -I "https://blaze-intelligence.com" 2>/dev/null | head -1 | grep -q "30[12]"; then
        echo "   ⏳ HTTPS: Redirecting (setting up)"
    else
        echo "   ❌ HTTPS: Not ready"
    fi
    
    if curl -s -I "http://blaze-intelligence.com" 2>/dev/null | head -1 | grep -q "200\|30[12]"; then
        echo "   ✅ HTTP: Working"
        http_working=true
    else
        echo "   ❌ HTTP: Not ready"
    fi
    
    # Check if everything is working
    if [[ "$github_found" == true && "$txt_verified" == true && "$https_working" == true ]]; then
        echo ""
        echo "🎉🎉🎉 SUCCESS! YOUR SITE IS LIVE! 🎉🎉🎉"
        echo "════════════════════════════════════════"
        echo ""
        echo "✅ DNS points to GitHub Pages"
        echo "✅ Domain verification complete"
        echo "✅ HTTPS certificate active"
        echo "✅ Site fully operational"
        echo ""
        echo "🌐 Your Blaze Intelligence platform is now live at:"
        echo "   https://blaze-intelligence.com"
        echo ""
        echo "📊 Final launch statistics:"
        echo "   • Total monitoring time: ${elapsed} seconds"
        echo "   • DNS propagation completed in check #$attempt"
        echo "   • Launch completed at: $(date)"
        echo ""
        
        # Open the live site
        echo "🎯 Opening your live site now..."
        open "https://blaze-intelligence.com"
        
        # Also open GitHub Pages to show success
        sleep 2
        echo "📈 Opening GitHub Pages settings to show verification..."
        open "https://github.com/ahump20/blaze-intelligence-official/settings/pages"
        
        echo ""
        echo "🎊 CONGRATULATIONS! LAUNCH SUCCESSFUL! 🎊"
        
        # Final status dashboard
        echo ""
        echo "📋 Running final status check..."
        sleep 2
        ./launch-status-dashboard.sh
        
        break
        
    elif [[ "$github_found" == true && "$http_working" == true ]]; then
        echo ""
        echo "🔄 PROGRESS: DNS Updated, HTTPS Setting Up"
        echo "   Your site should be fully live within the next few minutes"
        
    elif [[ "$github_found" == true ]]; then
        echo ""
        echo "🔄 PROGRESS: DNS Updated to GitHub Pages"
        echo "   Waiting for site to become accessible..."
        
    else
        echo ""
        echo "⏳ WAITING: DNS still propagating..."
        echo "   This is normal and can take 5-30 minutes"
    fi
    
    # Show next check timing
    if [[ $elapsed -lt 1800 ]]; then  # Less than 30 minutes
        echo ""
        echo "💤 Next check in 30 seconds..."
        sleep 30
    else
        echo ""
        echo "⏰ Monitoring for 30+ minutes. DNS changes can occasionally take longer."
        echo "💡 You can stop monitoring and check manually later with:"
        echo "   ./launch-status-dashboard.sh"
        echo ""
        echo "💤 Next check in 60 seconds..."
        sleep 60
    fi
    
    ((attempt++))
    echo ""
done