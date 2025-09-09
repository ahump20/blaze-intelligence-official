#!/bin/bash

# Blaze Intelligence - Configuration Test Script
# Tests all configured services and APIs

set -e

echo "🧪 Blaze Intelligence - Configuration Test Suite"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SITE_URL="${1:-https://de4f80ea.blaze-intelligence.pages.dev}"
REPLIT_URL="https://cd1a64ed-e3df-45a6-8410-e0bb8c2e0e1e.spock.prod.repl.run"
PASSED=0
FAILED=0

echo -e "${BLUE}Testing site: $SITE_URL${NC}"
echo ""

# Function to test endpoint
test_endpoint() {
    local name=$1
    local url=$2
    local expected_status=${3:-200}
    
    echo -n "Testing $name... "
    
    response=$(curl -s -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
    
    if [ "$response" = "$expected_status" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (Status: $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (Expected: $expected_status, Got: $response)"
        ((FAILED++))
        return 1
    fi
}

# Function to test API with data
test_api() {
    local name=$1
    local url=$2
    local data=$3
    
    echo -n "Testing API: $name... "
    
    response=$(curl -s -X POST "$url" \
        -H "Content-Type: application/json" \
        -d "$data" \
        -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ] || [ "$response" = "201" ]; then
        echo -e "${GREEN}✅ PASSED${NC} (Status: $response)"
        ((PASSED++))
        return 0
    else
        echo -e "${RED}❌ FAILED${NC} (Status: $response)"
        ((FAILED++))
        return 1
    fi
}

# Test basic connectivity
echo -e "${BLUE}🌐 Basic Connectivity Tests${NC}"
echo "================================"
test_endpoint "Homepage" "$SITE_URL" "200"
test_endpoint "API Documentation" "$SITE_URL/api-documentation.html" "200"
test_endpoint "User Guide" "$SITE_URL/USER_GUIDE.md" "200"
test_endpoint "Replit Site" "$REPLIT_URL" "200"
echo ""

# Test API endpoints
echo -e "${BLUE}🔌 API Endpoint Tests${NC}"
echo "================================"
test_endpoint "Health Check" "$SITE_URL/api/health" "200"
test_endpoint "Cardinals Readiness" "$SITE_URL/api/cardinals-readiness" "200"
test_endpoint "NIL Calculator" "$SITE_URL/api/nil-calculator" "200"
echo ""

# Test data endpoints
echo -e "${BLUE}📊 Data Endpoint Tests${NC}"
echo "================================"
test_endpoint "MLB Data" "$SITE_URL/data/analytics/mlb/cardinals_analytics.json" "200"
test_endpoint "NFL Data" "$SITE_URL/data/analytics/nfl/titans_analytics.json" "200"
test_endpoint "Dashboard Config" "$SITE_URL/data/dashboard-config.json" "200"
echo ""

# Test JavaScript loading
echo -e "${BLUE}📦 JavaScript Module Tests${NC}"
echo "================================"
test_endpoint "Sports Data Hub" "$SITE_URL/js/sports-data-hub.js" "200"
test_endpoint "Team Intelligence" "$SITE_URL/js/team-intelligence-cards.js" "200"
test_endpoint "Live Scoreboard" "$SITE_URL/js/live-scoreboard.js" "200"
test_endpoint "Payment System" "$SITE_URL/js/payment-system.js" "200"
echo ""

# Test form submissions (if configured)
echo -e "${BLUE}📝 Form Submission Tests${NC}"
echo "================================"
test_api "Lead Capture" "$SITE_URL/api/lead" '{
    "name": "Test User",
    "email": "test@example.com",
    "company": "Test Company",
    "message": "Configuration test"
}'

test_api "Feedback System" "$SITE_URL/api/feedback" '{
    "rating": 5,
    "feedback": "Testing configuration",
    "email": "test@example.com"
}'
echo ""

# Test external integrations
echo -e "${BLUE}🔗 External Integration Tests${NC}"
echo "================================"

# Test Stripe (if key is configured)
echo -n "Testing Stripe Integration... "
if curl -s -H "Authorization: Bearer $STRIPE_PUBLISHABLE_KEY" \
    https://api.stripe.com/v1/products -o /dev/null 2>/dev/null; then
    echo -e "${GREEN}✅ PASSED${NC}"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  NOT CONFIGURED${NC}"
fi

# Test Slack webhook (if configured)
echo -n "Testing Slack Webhook... "
if [ ! -z "$SLACK_WEBHOOK_URL" ]; then
    response=$(curl -s -X POST "$SLACK_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d '{"text":"Blaze Intelligence: Configuration test successful! 🚀"}' \
        -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        ((PASSED++))
    else
        echo -e "${RED}❌ FAILED${NC}"
        ((FAILED++))
    fi
else
    echo -e "${YELLOW}⚠️  NOT CONFIGURED${NC}"
fi
echo ""

# Performance tests
echo -e "${BLUE}⚡ Performance Tests${NC}"
echo "================================"

echo -n "Testing page load time... "
load_time=$(curl -s -o /dev/null -w "%{time_total}" "$SITE_URL")
load_ms=$(echo "$load_time * 1000" | bc 2>/dev/null || echo "N/A")

if (( $(echo "$load_time < 3" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${GREEN}✅ PASSED${NC} (${load_ms}ms)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  SLOW${NC} (${load_ms}ms)"
fi

echo -n "Testing API response time... "
api_time=$(curl -s -o /dev/null -w "%{time_total}" "$SITE_URL/api/health")
api_ms=$(echo "$api_time * 1000" | bc 2>/dev/null || echo "N/A")

if (( $(echo "$api_time < 1" | bc -l 2>/dev/null || echo 0) )); then
    echo -e "${GREEN}✅ PASSED${NC} (${api_ms}ms)"
    ((PASSED++))
else
    echo -e "${YELLOW}⚠️  SLOW${NC} (${api_ms}ms)"
fi
echo ""

# Summary
echo "================================================"
echo -e "${BLUE}📊 Test Summary${NC}"
echo "================================================"
echo -e "Tests Passed: ${GREEN}$PASSED${NC}"
echo -e "Tests Failed: ${RED}$FAILED${NC}"

if [ $FAILED -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 All tests passed! Your configuration is working correctly.${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure any missing API keys using ./setup-cloudflare-env.sh"
    echo "2. Test payment flow with ./test-stripe-integration.sh"
    echo "3. Set up custom domain following CUSTOM_DOMAIN_SETUP.md"
else
    echo ""
    echo -e "${YELLOW}⚠️  Some tests failed. Please check your configuration.${NC}"
    echo ""
    echo "Troubleshooting:"
    echo "1. Ensure all API keys are configured in Cloudflare dashboard"
    echo "2. Check that deployment is complete and propagated"
    echo "3. Verify environment variables are set correctly"
    echo "4. Review logs at: https://dash.cloudflare.com/?to=/:account/pages/view/blaze-intelligence"
fi

echo ""
echo "For detailed logs, run: wrangler pages deployment tail --project-name=blaze-intelligence"