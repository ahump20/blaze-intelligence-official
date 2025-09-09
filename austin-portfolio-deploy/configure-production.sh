#!/bin/bash

# ============================================
# Blaze Intelligence Production Configuration
# Complete setup for live production system
# ============================================

set -e

echo "🚀 Blaze Intelligence Production Configuration"
echo "=============================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to prompt for secret
prompt_secret() {
    local var_name=$1
    local description=$2
    echo -n "Enter $description: "
    read -s value
    echo ""
    export $var_name="$value"
}

# ======================
# 1. VERIFY PREREQUISITES
# ======================

echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command_exists node; then
    echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm not found. Please install npm${NC}"
    exit 1
fi

if ! command_exists wrangler; then
    echo -e "${YELLOW}⚠️  Wrangler not found. Installing...${NC}"
    npm install -g wrangler
fi

echo -e "${GREEN}✅ Prerequisites verified${NC}\n"

# ======================
# 2. CONFIGURE API KEYS
# ======================

echo -e "${YELLOW}Configuring API Keys...${NC}"
echo "You'll need API keys from:"
echo "  • OpenAI (ChatGPT 5)"
echo "  • Anthropic (Claude 4.1)"
echo "  • Google AI (Gemini 2.5)"
echo "  • SendGrid (Email)"
echo "  • Stripe (Payments)"
echo ""

# Prompt for API keys
prompt_secret "OPENAI_API_KEY" "OpenAI API Key (sk-...)"
prompt_secret "ANTHROPIC_API_KEY" "Anthropic API Key"
prompt_secret "GOOGLE_AI_KEY" "Google AI API Key"
prompt_secret "SENDGRID_API_KEY" "SendGrid API Key"
prompt_secret "STRIPE_SECRET_KEY" "Stripe Secret Key (sk_...)"
prompt_secret "STRIPE_WEBHOOK_SECRET" "Stripe Webhook Secret (whsec_...)"

# Generate JWT secret
export JWT_SECRET=$(openssl rand -base64 32)
echo -e "${GREEN}✅ Generated JWT Secret${NC}"

# Save to Cloudflare Workers secrets
echo -e "\n${YELLOW}Saving secrets to Cloudflare Workers...${NC}"

# Save each secret
echo "$OPENAI_API_KEY" | npx wrangler secret put OPENAI_API_KEY
echo "$ANTHROPIC_API_KEY" | npx wrangler secret put ANTHROPIC_API_KEY
echo "$GOOGLE_AI_KEY" | npx wrangler secret put GOOGLE_AI_KEY
echo "$SENDGRID_API_KEY" | npx wrangler secret put SENDGRID_API_KEY
echo "$STRIPE_SECRET_KEY" | npx wrangler secret put STRIPE_SECRET_KEY
echo "$STRIPE_WEBHOOK_SECRET" | npx wrangler secret put STRIPE_WEBHOOK_SECRET
echo "$JWT_SECRET" | npx wrangler secret put JWT_SECRET

echo -e "${GREEN}✅ API keys configured${NC}\n"

# ======================
# 3. DATABASE SETUP
# ======================

echo -e "${YELLOW}Setting up Cloudflare D1 Database...${NC}"

# Create database if not exists
npx wrangler d1 create blaze-production 2>/dev/null || echo "Database already exists"

# Get database ID
DB_ID=$(npx wrangler d1 list | grep blaze-production | awk '{print $2}')
echo "Database ID: $DB_ID"

# Create tables
cat > database-schema.sql << 'EOF'
-- Users table
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    organization TEXT,
    role TEXT DEFAULT 'user',
    subscription_tier TEXT DEFAULT 'free',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sport TEXT NOT NULL,
    league TEXT,
    user_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    stripe_subscription_id TEXT,
    plan TEXT NOT NULL,
    status TEXT DEFAULT 'active',
    current_period_start DATETIME,
    current_period_end DATETIME,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    team_id TEXT,
    prediction REAL,
    accuracy REAL,
    ai_model TEXT,
    data JSON,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (team_id) REFERENCES teams(id)
);

-- API usage table
CREATE TABLE IF NOT EXISTS api_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    endpoint TEXT,
    method TEXT,
    status_code INTEGER,
    latency_ms INTEGER,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Create indexes
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_teams_user ON teams(user_id);
CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_analytics_user ON analytics(user_id);
CREATE INDEX idx_api_usage_user ON api_usage(user_id);
CREATE INDEX idx_api_usage_timestamp ON api_usage(timestamp);
EOF

# Execute schema
npx wrangler d1 execute blaze-production --file=database-schema.sql

echo -e "${GREEN}✅ Database configured${NC}\n"

# ======================
# 4. KV STORAGE SETUP
# ======================

echo -e "${YELLOW}Setting up KV Storage...${NC}"

# Create KV namespaces
npx wrangler kv:namespace create "sessions" 2>/dev/null || echo "Sessions namespace exists"
npx wrangler kv:namespace create "cache" 2>/dev/null || echo "Cache namespace exists"
npx wrangler kv:namespace create "rate_limits" 2>/dev/null || echo "Rate limits namespace exists"

echo -e "${GREEN}✅ KV Storage configured${NC}\n"

# ======================
# 5. R2 STORAGE SETUP
# ======================

echo -e "${YELLOW}Setting up R2 Storage...${NC}"

# Create R2 buckets
npx wrangler r2 bucket create blaze-assets 2>/dev/null || echo "Assets bucket exists"
npx wrangler r2 bucket create blaze-data 2>/dev/null || echo "Data bucket exists"
npx wrangler r2 bucket create blaze-backups 2>/dev/null || echo "Backups bucket exists"

echo -e "${GREEN}✅ R2 Storage configured${NC}\n"

# ======================
# 6. DEPLOY WORKERS
# ======================

echo -e "${YELLOW}Deploying Cloudflare Workers...${NC}"

# Create worker configurations
cat > wrangler-production.toml << EOF
name = "blaze-api"
main = "api/index.js"
compatibility_date = "2024-01-01"
node_compat = true

[env.production]
vars = { ENVIRONMENT = "production" }

[[env.production.d1_databases]]
binding = "DB"
database_name = "blaze-production"
database_id = "$DB_ID"

[[env.production.kv_namespaces]]
binding = "SESSIONS"
id = "sessions_namespace_id"

[[env.production.kv_namespaces]]
binding = "CACHE"
id = "cache_namespace_id"

[[env.production.r2_buckets]]
binding = "ASSETS"
bucket_name = "blaze-assets"

[env.production.routes]
pattern = "api.blaze-intelligence.com/*"
zone_name = "blaze-intelligence.com"
EOF

# Deploy main API worker
npx wrangler deploy --config wrangler-production.toml --env production

echo -e "${GREEN}✅ Workers deployed${NC}\n"

# ======================
# 7. MONITORING SETUP
# ======================

echo -e "${YELLOW}Setting up monitoring...${NC}"

# Create monitoring configuration
cat > monitoring-config.js << 'EOF'
// Google Analytics 4 Configuration
export const GA4_CONFIG = {
    measurementId: 'G-XXXXXXXXXX', // Replace with your GA4 ID
    config: {
        page_title: 'Blaze Intelligence',
        page_location: window.location.href,
        page_path: window.location.pathname,
        send_page_view: true
    }
};

// Sentry Configuration
export const SENTRY_CONFIG = {
    dsn: 'YOUR_SENTRY_DSN', // Replace with your Sentry DSN
    integrations: [
        new Sentry.BrowserTracing(),
        new Sentry.Replay()
    ],
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    environment: 'production'
};

// Initialize monitoring
export function initializeMonitoring() {
    // Google Analytics
    if (typeof gtag !== 'undefined') {
        gtag('config', GA4_CONFIG.measurementId, GA4_CONFIG.config);
        
        // Track custom events
        window.trackEvent = (eventName, parameters) => {
            gtag('event', eventName, parameters);
        };
    }
    
    // Sentry
    if (typeof Sentry !== 'undefined') {
        Sentry.init(SENTRY_CONFIG);
        
        // Set user context
        if (window.BlazeAuth?.user) {
            Sentry.setUser({
                id: window.BlazeAuth.user.id,
                email: window.BlazeAuth.user.email
            });
        }
    }
    
    // Custom performance monitoring
    if ('PerformanceObserver' in window) {
        // Monitor long tasks
        const observer = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.duration > 50) {
                    console.warn('Long task detected:', entry);
                    window.trackEvent?.('long_task', {
                        duration: entry.duration,
                        name: entry.name
                    });
                }
            }
        });
        
        observer.observe({ entryTypes: ['longtask'] });
    }
    
    console.log('Monitoring initialized');
}
EOF

echo -e "${GREEN}✅ Monitoring configured${NC}\n"

# ======================
# 8. DOMAIN SETUP
# ======================

echo -e "${YELLOW}Configuring custom domain...${NC}"

# Add custom domain to Pages
npx wrangler pages project create blaze-intelligence --production-branch main 2>/dev/null || echo "Project exists"
npx wrangler pages deployment create --project-name=blaze-intelligence

# Instructions for manual steps
cat > domain-setup-instructions.md << 'EOF'
# Domain Configuration Instructions

## Cloudflare DNS Settings

1. Log in to Cloudflare Dashboard
2. Select your domain (blaze-intelligence.com)
3. Go to DNS settings
4. Add these records:

```
Type: CNAME
Name: @
Content: blaze-intelligence.pages.dev
Proxy: ON (Orange cloud)

Type: CNAME
Name: www
Content: blaze-intelligence.pages.dev
Proxy: ON (Orange cloud)

Type: CNAME
Name: api
Content: blaze-api.workers.dev
Proxy: ON (Orange cloud)
```

## SSL Configuration

1. Go to SSL/TLS settings
2. Set encryption mode to "Full (strict)"
3. Enable "Always Use HTTPS"
4. Enable "Automatic HTTPS Rewrites"

## Page Rules

1. Create page rule: `*blaze-intelligence.com/*`
   - Cache Level: Standard
   - Edge Cache TTL: 1 hour
   - Browser Cache TTL: 4 hours

## Email Routing

1. Go to Email Routing
2. Add destination address: ahump20@outlook.com
3. Create catch-all rule
EOF

echo -e "${GREEN}✅ Domain configuration instructions created${NC}\n"

# ======================
# 9. CRON JOBS SETUP
# ======================

echo -e "${YELLOW}Setting up scheduled tasks...${NC}"

cat > cron-jobs.toml << 'EOF'
# Cloudflare Workers Cron Triggers

[triggers]
crons = [
    # Data sync every 5 minutes
    "*/5 * * * *",
    
    # Analytics processing every hour
    "0 * * * *",
    
    # Daily backup at 3 AM
    "0 3 * * *",
    
    # Weekly report on Mondays at 9 AM
    "0 9 * * 1"
]
EOF

echo -e "${GREEN}✅ Cron jobs configured${NC}\n"

# ======================
# 10. FINAL VERIFICATION
# ======================

echo -e "${YELLOW}Running final verification...${NC}"

# Test API endpoint
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://api.blaze-intelligence.com/health)
if [ "$API_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ API is responding${NC}"
else
    echo -e "${YELLOW}⚠️  API not yet responding (may need DNS propagation)${NC}"
fi

# Test main site
SITE_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" https://blaze-intelligence.pages.dev)
if [ "$SITE_RESPONSE" = "200" ]; then
    echo -e "${GREEN}✅ Site is live${NC}"
else
    echo -e "${YELLOW}⚠️  Site not responding${NC}"
fi

# ======================
# SUMMARY
# ======================

echo ""
echo "======================================"
echo -e "${GREEN}🎉 Production Configuration Complete!${NC}"
echo "======================================"
echo ""
echo "✅ API Keys configured and stored"
echo "✅ Database created with schema"
echo "✅ KV and R2 storage configured"
echo "✅ Workers deployed"
echo "✅ Monitoring setup complete"
echo "✅ Domain configuration ready"
echo ""
echo "📋 Next Steps:"
echo "1. Configure DNS records as per domain-setup-instructions.md"
echo "2. Add Google Analytics measurement ID"
echo "3. Configure Sentry DSN"
echo "4. Test all API endpoints"
echo "5. Monitor performance metrics"
echo ""
echo "🔗 URLs:"
echo "Production: https://blaze-intelligence.com (after DNS)"
echo "Staging: https://blaze-intelligence.pages.dev"
echo "API: https://api.blaze-intelligence.com"
echo "Dashboard: https://dash.cloudflare.com"
echo ""
echo "📧 Support: ahump20@outlook.com"
echo "📱 Phone: (210) 273-5538"