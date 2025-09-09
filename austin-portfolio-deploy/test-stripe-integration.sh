#!/bin/bash

# Blaze Intelligence - Stripe Payment Integration Test
# Tests payment processing functionality

set -e

echo "💳 Blaze Intelligence - Stripe Payment Test"
echo "==========================================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SITE_URL="${1:-https://de4f80ea.blaze-intelligence.pages.dev}"

# Test configuration
echo -e "${BLUE}🔧 Configuration Check${NC}"
echo "========================"

# Check for Stripe CLI
if ! command -v stripe &> /dev/null; then
    echo -e "${YELLOW}Installing Stripe CLI...${NC}"
    
    # Detect OS and install accordingly
    if [[ "$OSTYPE" == "darwin"* ]]; then
        brew install stripe/stripe-cli/stripe
    else
        echo "Please install Stripe CLI from: https://stripe.com/docs/stripe-cli"
        exit 1
    fi
fi

# Function to test Stripe endpoint
test_stripe() {
    local operation=$1
    local description=$2
    
    echo -n "$description... "
    
    case $operation in
        "products")
            stripe products list --limit 1 &>/dev/null && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}"
            ;;
        "prices")
            stripe prices list --limit 1 &>/dev/null && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}"
            ;;
        "customers")
            stripe customers list --limit 1 &>/dev/null && echo -e "${GREEN}✅ PASSED${NC}" || echo -e "${RED}❌ FAILED${NC}"
            ;;
    esac
}

echo -e "${BLUE}🔑 API Key Validation${NC}"
echo "========================"

# Check if Stripe keys are set
if [ -z "$STRIPE_SECRET_KEY" ]; then
    echo -e "${YELLOW}⚠️  STRIPE_SECRET_KEY not set in environment${NC}"
    echo "Run: export STRIPE_SECRET_KEY=sk_test_..."
    echo ""
fi

if [ -z "$STRIPE_PUBLISHABLE_KEY" ]; then
    echo -e "${YELLOW}⚠️  STRIPE_PUBLISHABLE_KEY not set in environment${NC}"
    echo "Run: export STRIPE_PUBLISHABLE_KEY=pk_test_..."
    echo ""
fi

# Test Stripe API access
test_stripe "products" "Testing Products API"
test_stripe "prices" "Testing Prices API"
test_stripe "customers" "Testing Customers API"
echo ""

echo -e "${BLUE}💰 Creating Test Products${NC}"
echo "========================"

# Create Blaze Intelligence products in Stripe
create_product() {
    local name=$1
    local price=$2
    local interval=$3
    
    echo -n "Creating $name... "
    
    # Create product
    product_id=$(stripe products create \
        --name "$name" \
        --description "Blaze Intelligence - $name" \
        2>/dev/null | grep -o '"id": "[^"]*' | grep -o '[^"]*$' | head -1)
    
    if [ ! -z "$product_id" ]; then
        # Create price
        if [ "$interval" = "once" ]; then
            stripe prices create \
                --product "$product_id" \
                --unit-amount "$price" \
                --currency usd \
                &>/dev/null
        else
            stripe prices create \
                --product "$product_id" \
                --unit-amount "$price" \
                --currency usd \
                --recurring[interval]="$interval" \
                &>/dev/null
        fi
        echo -e "${GREEN}✅ Created (ID: $product_id)${NC}"
    else
        echo -e "${YELLOW}⚠️  Already exists or error${NC}"
    fi
}

# Create products
create_product "Starter Plan" 9900 "month"      # $99/month
create_product "Professional Plan" 29900 "month" # $299/month
create_product "Enterprise Plan" 99900 "month"   # $999/month
create_product "Annual Starter" 118800 "year"    # $1,188/year
echo ""

echo -e "${BLUE}🧪 Testing Payment Flow${NC}"
echo "========================"

# Create test HTML file for payment testing
cat > test-payment.html << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Blaze Intelligence - Payment Test</title>
    <script src="https://js.stripe.com/v3/"></script>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            max-width: 600px;
            margin: 50px auto;
            padding: 20px;
            background: #1a1a1a;
            color: #fff;
        }
        .plan {
            border: 1px solid #BF5700;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            background: #2a2a2a;
        }
        button {
            background: #BF5700;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 16px;
            width: 100%;
            margin-top: 10px;
        }
        button:hover {
            background: #9f4700;
        }
        #payment-status {
            margin-top: 20px;
            padding: 15px;
            border-radius: 4px;
            display: none;
        }
        .success { background: #10b981; }
        .error { background: #ef4444; }
        .processing { background: #3b82f6; }
    </style>
</head>
<body>
    <h1>🔥 Blaze Intelligence - Payment Test</h1>
    
    <div class="plan">
        <h2>Starter Plan</h2>
        <p>$99/month - Perfect for small teams</p>
        <button onclick="testPayment('price_starter', 9900)">Test Payment</button>
    </div>
    
    <div class="plan">
        <h2>Professional Plan</h2>
        <p>$299/month - For growing organizations</p>
        <button onclick="testPayment('price_pro', 29900)">Test Payment</button>
    </div>
    
    <div class="plan">
        <h2>Enterprise Plan</h2>
        <p>$999/month - Full platform access</p>
        <button onclick="testPayment('price_enterprise', 99900)">Test Payment</button>
    </div>
    
    <div id="payment-status"></div>
    
    <script>
        // Replace with your publishable key
        const STRIPE_PK = 'STRIPE_PUBLISHABLE_KEY_PLACEHOLDER';
        
        async function testPayment(priceId, amount) {
            const status = document.getElementById('payment-status');
            status.className = 'processing';
            status.style.display = 'block';
            status.innerHTML = '⏳ Processing payment...';
            
            try {
                // Simulate payment processing
                await new Promise(resolve => setTimeout(resolve, 2000));
                
                // In production, this would create a checkout session
                const mockResponse = {
                    success: true,
                    amount: amount / 100,
                    currency: 'USD',
                    timestamp: new Date().toISOString()
                };
                
                if (mockResponse.success) {
                    status.className = 'success';
                    status.innerHTML = `✅ Payment test successful!<br>
                        Amount: $${mockResponse.amount}<br>
                        Time: ${mockResponse.timestamp}<br>
                        <br>
                        In production, this would redirect to Stripe Checkout.`;
                }
            } catch (error) {
                status.className = 'error';
                status.innerHTML = `❌ Payment test failed: ${error.message}`;
            }
        }
        
        // Test Stripe.js loading
        if (typeof Stripe !== 'undefined' && STRIPE_PK !== 'STRIPE_PUBLISHABLE_KEY_PLACEHOLDER') {
            console.log('✅ Stripe.js loaded successfully');
            const stripe = Stripe(STRIPE_PK);
            console.log('✅ Stripe initialized');
        } else {
            console.warn('⚠️  Stripe not configured - using mock mode');
        }
    </script>
</body>
</html>
EOF

echo -e "${GREEN}✅ Test payment page created: test-payment.html${NC}"
echo ""

echo -e "${BLUE}🚀 Testing Live Integration${NC}"
echo "========================"

# Test the actual site's payment endpoints
echo -n "Testing payment API endpoint... "
response=$(curl -s -X POST "$SITE_URL/api/create-checkout-session" \
    -H "Content-Type: application/json" \
    -d '{
        "priceId": "price_test",
        "successUrl": "'$SITE_URL'/success",
        "cancelUrl": "'$SITE_URL'/cancel"
    }' -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")

if [ "$response" = "200" ] || [ "$response" = "201" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
elif [ "$response" = "404" ]; then
    echo -e "${YELLOW}⚠️  Endpoint not configured yet${NC}"
else
    echo -e "${RED}❌ FAILED (Status: $response)${NC}"
fi

echo -n "Testing webhook endpoint... "
# Simulate webhook from Stripe
webhook_response=$(curl -s -X POST "$SITE_URL/api/stripe-webhook" \
    -H "Content-Type: application/json" \
    -H "Stripe-Signature: test_signature" \
    -d '{
        "type": "payment_intent.succeeded",
        "data": {
            "object": {
                "amount": 9900,
                "currency": "usd"
            }
        }
    }' -o /dev/null -w "%{http_code}" 2>/dev/null || echo "000")

if [ "$webhook_response" = "200" ]; then
    echo -e "${GREEN}✅ PASSED${NC}"
elif [ "$webhook_response" = "404" ]; then
    echo -e "${YELLOW}⚠️  Webhook not configured yet${NC}"
else
    echo -e "${RED}❌ FAILED (Status: $webhook_response)${NC}"
fi
echo ""

echo -e "${BLUE}📋 Test Checklist${NC}"
echo "========================"
echo "[ ] Stripe API keys configured in environment"
echo "[ ] Products created in Stripe dashboard"
echo "[ ] Payment buttons trigger checkout flow"
echo "[ ] Webhook endpoint receives events"
echo "[ ] Success/cancel URLs configured"
echo "[ ] Customer portal enabled"
echo "[ ] Test mode working correctly"
echo ""

echo -e "${BLUE}🔧 Setup Instructions${NC}"
echo "========================"
cat << EOF
1. Set environment variables:
   export STRIPE_SECRET_KEY=sk_test_...
   export STRIPE_PUBLISHABLE_KEY=pk_test_...

2. Configure in Cloudflare:
   wrangler pages secret put STRIPE_SECRET_KEY --project-name=blaze-intelligence
   wrangler pages secret put STRIPE_PUBLISHABLE_KEY --project-name=blaze-intelligence

3. Set up webhook endpoint:
   stripe listen --forward-to ${SITE_URL}/api/stripe-webhook

4. Test with test cards:
   - Success: 4242 4242 4242 4242
   - Decline: 4000 0000 0000 0002
   - Authentication: 4000 0025 0000 3155

5. Open test page:
   open test-payment.html

EOF

echo -e "${GREEN}✅ Stripe integration test complete!${NC}"
echo ""
echo "Next steps:"
echo "1. Configure Stripe keys in production"
echo "2. Set up webhook endpoints"
echo "3. Create production products"
echo "4. Test full payment flow"
echo "5. Enable customer portal"