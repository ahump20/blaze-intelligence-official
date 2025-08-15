#!/bin/bash

# Automated DNS Setup Script for GitHub Pages
# Configures DNS verification for blaze-intelligence.com

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
DOMAIN="blaze-intelligence.com"
GITHUB_REPO="ahump20/blaze-intelligence-official"
TXT_RECORD_NAME="_github-pages-challenge-ahump20"
TXT_RECORD_VALUE="6e8710d0a2b450e076e43b0f743949"

echo -e "${BLUE}🚀 Starting Automated DNS Setup for GitHub Pages${NC}"
echo -e "${BLUE}Domain: ${DOMAIN}${NC}"
echo -e "${BLUE}Repository: ${GITHUB_REPO}${NC}"

# Load environment variables
if [ -f "/Users/AustinHumphrey/.mcp_env" ]; then
    source /Users/AustinHumphrey/.mcp_env
    echo -e "${GREEN}✅ Environment variables loaded${NC}"
else
    echo -e "${RED}❌ Environment file not found${NC}"
    exit 1
fi

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get Cloudflare Zone ID
get_zone_id() {
    echo -e "${YELLOW}🔍 Finding Cloudflare Zone ID for ${DOMAIN}...${NC}"
    
    if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
        echo -e "${RED}❌ CLOUDFLARE_API_TOKEN not set${NC}"
        return 1
    fi
    
    local zone_response=$(curl -s \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}")
    
    if echo "$zone_response" | grep -q '"success":true'; then
        local zone_id=$(echo "$zone_response" | grep -o '"id":"[^"]*"' | head -1 | cut -d'"' -f4)
        if [ -n "$zone_id" ]; then
            echo -e "${GREEN}✅ Zone ID found: ${zone_id}${NC}"
            echo "$zone_id"
            return 0
        fi
    fi
    
    echo -e "${RED}❌ Failed to get Zone ID. Response:${NC}"
    echo "$zone_response"
    return 1
}

# Function to create DNS TXT record
create_txt_record() {
    local zone_id="$1"
    
    echo -e "${YELLOW}📝 Creating TXT record: ${TXT_RECORD_NAME}${NC}"
    
    local record_data=$(cat <<EOF
{
    "type": "TXT",
    "name": "${TXT_RECORD_NAME}",
    "content": "${TXT_RECORD_VALUE}",
    "ttl": 300
}
EOF
)
    
    local create_response=$(curl -s \
        -X POST \
        -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
        -H "Content-Type: application/json" \
        -d "$record_data" \
        "https://api.cloudflare.com/client/v4/zones/${zone_id}/dns_records")
    
    if echo "$create_response" | grep -q '"success":true'; then
        echo -e "${GREEN}✅ TXT record created successfully${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to create TXT record. Response:${NC}"
        echo "$create_response"
        return 1
    fi
}

# Function to verify DNS propagation
verify_dns_propagation() {
    echo -e "${YELLOW}🔄 Verifying DNS propagation...${NC}"
    
    local max_attempts=12
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -e "${BLUE}Attempt ${attempt}/${max_attempts}...${NC}"
        
        local dns_result=$(dig TXT "${TXT_RECORD_NAME}.${DOMAIN}" +short 2>/dev/null | tr -d '"')
        
        if [ "$dns_result" = "$TXT_RECORD_VALUE" ]; then
            echo -e "${GREEN}✅ DNS record verified! Propagation complete.${NC}"
            return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            echo -e "${YELLOW}⏳ Record not yet propagated. Waiting 30 seconds...${NC}"
            sleep 30
        fi
        
        ((attempt++))
    done
    
    echo -e "${YELLOW}⚠️ DNS propagation taking longer than expected${NC}"
    echo -e "${YELLOW}This is normal and can take up to 24 hours${NC}"
    return 1
}

# Function to configure GitHub Pages
configure_github_pages() {
    echo -e "${YELLOW}⚙️ Configuring GitHub Pages...${NC}"
    
    if [ -z "$GITHUB_TOKEN" ]; then
        echo -e "${RED}❌ GITHUB_TOKEN not set${NC}"
        return 1
    fi
    
    # Create CNAME file
    echo -e "${BLUE}Creating CNAME file...${NC}"
    echo "$DOMAIN" > CNAME
    git add CNAME
    git commit -m "Add CNAME for custom domain: $DOMAIN" || echo "CNAME already exists"
    git push origin main || echo "Push may have failed - continuing..."
    
    # Configure Pages via API
    local pages_config=$(cat <<EOF
{
    "source": {
        "branch": "main",
        "path": "/"
    },
    "cname": "${DOMAIN}"
}
EOF
)
    
    local pages_response=$(curl -s \
        -X POST \
        -H "Authorization: token $GITHUB_TOKEN" \
        -H "Accept: application/vnd.github.v3+json" \
        -d "$pages_config" \
        "https://api.github.com/repos/${GITHUB_REPO}/pages")
    
    echo -e "${GREEN}✅ GitHub Pages configuration attempted${NC}"
    return 0
}

# Function to monitor GitHub verification
monitor_github_verification() {
    echo -e "${YELLOW}👀 Monitoring GitHub Pages verification...${NC}"
    
    local max_attempts=20
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        echo -e "${BLUE}Checking verification status (${attempt}/${max_attempts})...${NC}"
        
        local pages_response=$(curl -s \
            -H "Authorization: token $GITHUB_TOKEN" \
            -H "Accept: application/vnd.github.v3+json" \
            "https://api.github.com/repos/${GITHUB_REPO}/pages")
        
        if echo "$pages_response" | grep -q '"status":"built"'; then
            echo -e "${GREEN}✅ GitHub Pages verification complete!${NC}"
            return 0
        fi
        
        if [ $attempt -lt $max_attempts ]; then
            echo -e "${YELLOW}⏳ Verification in progress. Waiting 60 seconds...${NC}"
            sleep 60
        fi
        
        ((attempt++))
    done
    
    echo -e "${YELLOW}⚠️ Verification taking longer than expected${NC}"
    echo -e "${YELLOW}Check GitHub repository settings manually${NC}"
    return 1
}

# Main execution
main() {
    echo -e "${BLUE}Starting automated setup process...${NC}\n"
    
    # Step 1: Get Cloudflare Zone ID
    if ! zone_id=$(get_zone_id); then
        echo -e "${RED}❌ Cannot proceed without Cloudflare access${NC}"
        echo -e "${YELLOW}💡 Manual DNS setup required:${NC}"
        echo -e "${YELLOW}   1. Go to Cloudflare dashboard${NC}"
        echo -e "${YELLOW}   2. Add TXT record: ${TXT_RECORD_NAME}${NC}"
        echo -e "${YELLOW}   3. Value: ${TXT_RECORD_VALUE}${NC}"
        exit 1
    fi
    
    # Step 2: Create TXT record
    if ! create_txt_record "$zone_id"; then
        echo -e "${RED}❌ Failed to create DNS record${NC}"
        exit 1
    fi
    
    # Step 3: Verify DNS propagation
    verify_dns_propagation
    
    # Step 4: Configure GitHub Pages
    configure_github_pages
    
    # Step 5: Monitor verification
    monitor_github_verification
    
    echo -e "\n${GREEN}🎉 DNS setup process completed!${NC}"
    echo -e "${GREEN}Your domain ${DOMAIN} should now be configured for GitHub Pages${NC}"
    echo -e "${BLUE}You can verify at: https://github.com/${GITHUB_REPO}/settings/pages${NC}"
}

# Run main function
main "$@"