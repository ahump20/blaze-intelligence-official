#!/bin/bash

echo "🔄 MONITORING DNS CHANGES FOR BLAZE-INTELLIGENCE.COM"
echo "===================================================="
echo "This script will check DNS every 2 minutes until GitHub Pages is working"
echo ""

# Function to check DNS status
check_dns() {
    local attempt=$1
    echo "🕒 Check #$attempt - $(date)"
    echo "--------------------------------"
    
    # Check A records
    a_records=$(dig A blaze-intelligence.com +short | sort)
    echo "A Records: $a_records"
    
    # Check if GitHub Pages IPs are present
    github_found=false
    for ip in 185.199.108.153 185.199.109.153 185.199.110.153 185.199.111.153; do
        if echo "$a_records" | grep -q "$ip"; then
            github_found=true
            break
        fi
    done
    
    # Check TXT record
    txt_record=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short | tr -d '"')
    
    # Check HTTPS
    https_status="❌"
    if curl -s -I "https://blaze-intelligence.com" 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
        https_status="✅"
    fi
    
    # Display status
    echo "DNS to GitHub Pages: $([ "$github_found" = true ] && echo "✅ YES" || echo "❌ NO")"
    echo "TXT Verification: $([ "$txt_record" = "6e8710d0a2b450e076e43b0f743949" ] && echo "✅ YES" || echo "❌ NO")"
    echo "HTTPS Working: $https_status"
    
    # Check if everything is working
    if [ "$github_found" = true ] && [ "$txt_record" = "6e8710d0a2b450e076e43b0f743949" ] && [ "$https_status" = "✅" ]; then
        echo ""
        echo "🎉🎉🎉 SUCCESS! 🎉🎉🎉"
        echo "========================"
        echo "✅ DNS points to GitHub Pages"
        echo "✅ Domain verification complete"
        echo "✅ HTTPS is working"
        echo ""
        echo "Your site is now live at: https://blaze-intelligence.com"
        echo ""
        
        # Open the live site
        echo "🌐 Opening your live site..."
        open "https://blaze-intelligence.com"
        
        # Also open GitHub Pages settings to show success
        echo "📊 Opening GitHub Pages settings to show verification..."
        sleep 2
        open "https://github.com/ahump20/blaze-intelligence-official/settings/pages"
        
        return 0
    else
        echo "⏳ Still waiting for changes to propagate..."
        echo ""
        return 1
    fi
}

# Main monitoring loop
attempt=1
max_attempts=30  # 1 hour of checking (2 minutes * 30)

while [ $attempt -le $max_attempts ]; do
    if check_dns $attempt; then
        exit 0  # Success!
    fi
    
    if [ $attempt -lt $max_attempts ]; then
        echo "💤 Waiting 2 minutes before next check..."
        echo ""
        sleep 120
    fi
    
    ((attempt++))
done

echo "⏰ Monitoring timeout reached (1 hour)"
echo "DNS changes may take longer than expected."
echo "You can run this script again later: ./monitor-dns-changes.sh"
echo ""
echo "Or check manually:"
echo "• DNS: dig A blaze-intelligence.com"
echo "• Site: https://blaze-intelligence.com"
echo "• GitHub: https://github.com/ahump20/blaze-intelligence-official/settings/pages"