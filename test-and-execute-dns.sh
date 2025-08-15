#!/bin/bash

# Test and Execute DNS Configuration
# This script tests credentials and executes DNS setup if possible

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

echo -e "${BLUE}🔧 Testing API Credentials and Executing DNS Setup${NC}"

# Load environment
source /Users/AustinHumphrey/.mcp_env

# Test different Cloudflare API token formats
test_cloudflare_access() {
    echo -e "${YELLOW}Testing Cloudflare API access...${NC}"
    
    # Try the token as-is
    response=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        "https://api.cloudflare.com/client/v4/user/tokens/verify")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Cloudflare API access confirmed${NC}"
        return 0
    fi
    
    # Try different authentication method
    response=$(curl -s -H "X-Auth-Key: $CLOUDFLARE_API_TOKEN" \
        -H "X-Auth-Email: ahump20@outlook.com" \
        "https://api.cloudflare.com/client/v4/user")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ Cloudflare API access confirmed (legacy auth)${NC}"
        export CF_AUTH_METHOD="legacy"
        return 0
    fi
    
    echo -e "${RED}❌ Cloudflare API access failed${NC}"
    echo "Response: $response"
    return 1
}

# Get zone ID with proper auth method
get_zone_id() {
    echo -e "${YELLOW}Getting zone ID for blaze-intelligence.com...${NC}"
    
    if [ "$CF_AUTH_METHOD" = "legacy" ]; then
        response=$(curl -s -H "X-Auth-Key: $CLOUDFLARE_API_TOKEN" \
            -H "X-Auth-Email: ahump20@outlook.com" \
            "https://api.cloudflare.com/client/v4/zones?name=blaze-intelligence.com")
    else
        response=$(curl -s -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            "https://api.cloudflare.com/client/v4/zones?name=blaze-intelligence.com")
    fi
    
    if echo "$response" | grep -q '"success":true'; then
        zone_id=$(echo "$response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$zone_id" ]; then
            echo -e "${GREEN}✅ Zone ID: $zone_id${NC}"
            echo "$zone_id"
            return 0
        fi
    fi
    
    echo -e "${RED}❌ Could not get zone ID${NC}"
    echo "Response: $response"
    return 1
}

# Create the TXT record
create_dns_record() {
    local zone_id="$1"
    echo -e "${YELLOW}Creating TXT record...${NC}"
    
    local record_data='{
        "type": "TXT",
        "name": "_github-pages-challenge-ahump20",
        "content": "6e8710d0a2b450e076e43b0f743949",
        "ttl": 300
    }'
    
    if [ "$CF_AUTH_METHOD" = "legacy" ]; then
        response=$(curl -s -X POST \
            -H "X-Auth-Key: $CLOUDFLARE_API_TOKEN" \
            -H "X-Auth-Email: ahump20@outlook.com" \
            -H "Content-Type: application/json" \
            -d "$record_data" \
            "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records")
    else
        response=$(curl -s -X POST \
            -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
            -H "Content-Type: application/json" \
            -d "$record_data" \
            "https://api.cloudflare.com/client/v4/zones/$zone_id/dns_records")
    fi
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ TXT record created successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to create TXT record${NC}"
        echo "Response: $response"
        return 1
    fi
}

# Main execution
main() {
    echo -e "${BLUE}Starting DNS configuration process...${NC}"
    
    # Test Cloudflare access
    if ! test_cloudflare_access; then
        echo -e "${RED}❌ Cannot access Cloudflare API${NC}"
        echo -e "${YELLOW}💡 Manual setup required - check manual-dns-commands.sh${NC}"
        exit 1
    fi
    
    # Get zone ID
    if ! zone_id=$(get_zone_id); then
        echo -e "${RED}❌ Cannot get zone ID${NC}"
        exit 1
    fi
    
    # Create DNS record
    if ! create_dns_record "$zone_id"; then
        echo -e "${RED}❌ DNS record creation failed${NC}"
        exit 1
    fi
    
    echo -e "${GREEN}🎉 DNS record created successfully!${NC}"
    echo -e "${YELLOW}⏳ Waiting for DNS propagation...${NC}"
    
    # Wait and test DNS propagation
    sleep 30
    dns_result=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short 2>/dev/null | tr -d '"')
    
    if [ "$dns_result" = "6e8710d0a2b450e076e43b0f743949" ]; then
        echo -e "${GREEN}✅ DNS propagation confirmed!${NC}"
        echo -e "${GREEN}✅ GitHub Pages verification should now work${NC}"
    else
        echo -e "${YELLOW}⏳ DNS still propagating (this can take up to 24 hours)${NC}"
        echo -e "${BLUE}Current result: $dns_result${NC}"
    fi
    
    echo -e "\n${GREEN}Next steps:${NC}"
    echo -e "${BLUE}1. Go to https://github.com/ahump20/blaze-intelligence-official/settings/pages${NC}"
    echo -e "${BLUE}2. Set custom domain to: blaze-intelligence.com${NC}"
    echo -e "${BLUE}3. GitHub will verify the TXT record automatically${NC}"
}

# Execute
main "$@"