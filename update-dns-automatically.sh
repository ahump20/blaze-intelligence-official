#!/bin/bash

echo "🔧 AUTOMATIC DNS UPDATE FOR BLAZE-INTELLIGENCE.COM"
echo "=================================================="
echo ""
echo "This script will help you get a new Cloudflare API token and automatically update your DNS records."
echo ""

# Function to get new API token
get_api_token() {
    echo "🔑 STEP 1: GET NEW CLOUDFLARE API TOKEN"
    echo "======================================"
    echo ""
    echo "1. Opening Cloudflare API tokens page..."
    open "https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    echo "2. Follow these steps in Cloudflare:"
    echo "   • Click 'Create Token'"
    echo "   • Use 'Zone:Edit' template"
    echo "   • Zone Resources: Include 'blaze-intelligence.com'"
    echo "   • Click 'Continue to summary'"
    echo "   • Click 'Create Token'"
    echo "   • Copy the token (starts with 'Bearer ')"
    echo ""
    echo "3. Paste your new API token here:"
    read -r NEW_TOKEN
    
    if [[ -n "$NEW_TOKEN" ]]; then
        # Test the new token
        echo "🔍 Testing new API token..."
        test_result=$(curl -s -H "Authorization: Bearer $NEW_TOKEN" "https://api.cloudflare.com/client/v4/user/tokens/verify")
        
        if echo "$test_result" | grep -q '"success":true'; then
            echo "✅ New API token works!"
            
            # Update the environment file
            sed -i.backup "s/export CLOUDFLARE_API_TOKEN=.*/export CLOUDFLARE_API_TOKEN=\"$NEW_TOKEN\"/" /Users/AustinHumphrey/.mcp_env
            source /Users/AustinHumphrey/.mcp_env
            
            echo "✅ API token saved and loaded"
            return 0
        else
            echo "❌ New API token doesn't work. Please try again."
            echo "Response: $test_result"
            return 1
        fi
    else
        echo "❌ No token provided"
        return 1
    fi
}

# Function to get zone ID
get_zone_id() {
    echo ""
    echo "🌐 STEP 2: FINDING CLOUDFLARE ZONE ID"
    echo "===================================="
    
    zone_response=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/zones?name=blaze-intelligence.com")
    
    if echo "$zone_response" | grep -q '"success":true'; then
        zone_id=$(echo "$zone_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        
        if [[ -n "$zone_id" ]]; then
            echo "✅ Zone ID found: $zone_id"
            echo "$zone_id"
            return 0
        else
            echo "❌ Zone ID not found in response"
            echo "Response: $zone_response"
            return 1
        fi
    else
        echo "❌ Failed to get zone information"
        echo "Response: $zone_response"
        return 1
    fi
}

# Function to delete old A records
delete_old_records() {
    local zone_id="$1"
    
    echo ""
    echo "🗑️ STEP 3: DELETING OLD A RECORDS"
    echo "================================="
    
    # Get all A records for the domain
    records_response=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records?type=A&name=blaze-intelligence.com")
    
    if echo "$records_response" | grep -q '"success":true'; then
        # Extract record IDs
        record_ids=$(echo "$records_response" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
        
        if [[ -n "$record_ids" ]]; then
            echo "Found existing A records to delete:"
            while IFS= read -r record_id; do
                echo "   Deleting record ID: $record_id"
                delete_response=$(curl -s -X DELETE -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records/$record_id")
                
                if echo "$delete_response" | grep -q '"success":true'; then
                    echo "   ✅ Deleted"
                else
                    echo "   ❌ Failed to delete: $(echo "$delete_response" | jq -r '.errors[0].message // "Unknown error"' 2>/dev/null)"
                fi
            done <<< "$record_ids"
        else
            echo "   ℹ️ No existing A records found"
        fi
    else
        echo "❌ Failed to get existing records"
        echo "Response: $records_response"
    fi
}

# Function to add GitHub Pages A records
add_github_records() {
    local zone_id="$1"
    
    echo ""
    echo "➕ STEP 4: ADDING GITHUB PAGES A RECORDS"
    echo "========================================"
    
    github_ips=("185.199.108.153" "185.199.109.153" "185.199.110.153" "185.199.111.153")
    
    for ip in "${github_ips[@]}"; do
        echo "   Adding A record: blaze-intelligence.com → $ip"
        
        record_data="{\"type\":\"A\",\"name\":\"blaze-intelligence.com\",\"content\":\"$ip\",\"ttl\":300,\"proxied\":false}"
        
        create_response=$(curl -s -X POST \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$record_data" \
            "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records")
        
        if echo "$create_response" | grep -q '"success":true'; then
            echo "   ✅ Added $ip"
        else
            echo "   ❌ Failed to add $ip: $(echo "$create_response" | jq -r '.errors[0].message // "Unknown error"' 2>/dev/null)"
        fi
    done
}

# Function to add TXT verification record
add_txt_record() {
    local zone_id="$1"
    
    echo ""
    echo "📝 STEP 5: ADDING GITHUB PAGES TXT VERIFICATION"
    echo "=============================================="
    
    txt_data="{\"type\":\"TXT\",\"name\":\"_github-pages-challenge-ahump20\",\"content\":\"6e8710d0a2b450e076e43b0f743949\",\"ttl\":300,\"proxied\":false}"
    
    txt_response=$(curl -s -X POST \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$txt_data" \
        "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records")
    
    if echo "$txt_response" | grep -q '"success":true'; then
        echo "✅ TXT verification record added"
    else
        echo "❌ Failed to add TXT record: $(echo "$txt_response" | jq -r '.errors[0].message // "Unknown error"' 2>/dev/null)"
    fi
}

# Function to verify changes
verify_changes() {
    echo ""
    echo "🔍 STEP 6: VERIFYING DNS CHANGES"
    echo "==============================="
    
    echo "⏳ Waiting 30 seconds for DNS propagation..."
    sleep 30
    
    echo ""
    echo "Testing new A records:"
    new_a_records=$(dig A blaze-intelligence.com +short | sort)
    
    if [[ -n "$new_a_records" ]]; then
        while IFS= read -r ip; do
            if [[ "$ip" =~ ^185\.199\.(108|109|110|111)\.153$ ]]; then
                echo "   ✅ $ip (GitHub Pages)"
            else
                echo "   ⚠️ $ip (Unexpected)"
            fi
        done <<< "$new_a_records"
    else
        echo "   ⏳ No A records visible yet (still propagating)"
    fi
    
    echo ""
    echo "Testing TXT verification record:"
    txt_result=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short | tr -d '"')
    
    if [[ "$txt_result" == "6e8710d0a2b450e076e43b0f743949" ]]; then
        echo "   ✅ TXT record verified"
    else
        echo "   ⏳ TXT record still propagating"
    fi
    
    echo ""
    echo "Testing website accessibility:"
    if curl -s -I "https://blaze-intelligence.com" 2>/dev/null | head -1 | grep -q "200"; then
        echo "   🎉 HTTPS is working!"
        echo "   🌐 Opening your live site..."
        open "https://blaze-intelligence.com"
    elif curl -s -I "http://blaze-intelligence.com" 2>/dev/null | head -1 | grep -q "200\|301\|302"; then
        echo "   ⏳ HTTP working, HTTPS setting up"
    else
        echo "   ⏳ Site not accessible yet (normal during propagation)"
    fi
}

# Main execution
main() {
    echo "🚀 Starting automatic DNS update process..."
    echo ""
    
    # Step 1: Get valid API token
    if ! get_api_token; then
        echo "❌ Cannot proceed without valid API token"
        exit 1
    fi
    
    # Step 2: Get zone ID
    if ! zone_id=$(get_zone_id); then
        echo "❌ Cannot proceed without zone ID"
        exit 1
    fi
    
    # Step 3: Delete old records
    delete_old_records "$zone_id"
    
    # Step 4: Add GitHub Pages A records
    add_github_records "$zone_id"
    
    # Step 5: Add TXT verification
    add_txt_record "$zone_id"
    
    # Step 6: Verify changes
    verify_changes
    
    echo ""
    echo "🎉 DNS UPDATE PROCESS COMPLETED!"
    echo "==============================="
    echo ""
    echo "Your Blaze Intelligence site should be live within 5-30 minutes at:"
    echo "🌐 https://blaze-intelligence.com"
    echo ""
    echo "📊 Monitor progress with: ./launch-status-dashboard.sh"
    echo "🔄 Continuous monitoring: ./monitor-dns-changes.sh"
}

# Run main function
main "$@"