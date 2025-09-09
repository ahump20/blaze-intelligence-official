#!/bin/bash

# Blaze Intelligence Security Scanner & Secret Rotation Tool
# Comprehensive security audit and secret management

set -e

echo "🔐 BLAZE INTELLIGENCE - Security Scanner"
echo "========================================"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
SCAN_RESULTS="security-scan-$(date +%Y%m%d-%H%M%S).log"
SECRETS_FOUND=0
VULNERABILITIES=0

# Function to print colored output
print_status() {
    echo -e "${BLUE}[SCAN]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
    echo "[WARNING] $1" >> $SCAN_RESULTS
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
    echo "[ERROR] $1" >> $SCAN_RESULTS
    ((VULNERABILITIES++))
}

# Initialize scan log
echo "Security Scan Report - $(date)" > $SCAN_RESULTS
echo "================================" >> $SCAN_RESULTS
echo "" >> $SCAN_RESULTS

# Step 1: Check for exposed secrets
print_status "Scanning for exposed secrets..."

# Common secret patterns
SECRET_PATTERNS=(
    "sk-[A-Za-z0-9_\-]{20,}"           # OpenAI
    "ghp_[A-Za-z0-9]{20,}"              # GitHub Personal Access Token
    "github_pat_[A-Za-z0-9_]{20,}"      # GitHub PAT (new format)
    "ghs_[A-Za-z0-9]{20,}"              # GitHub Secret
    "pk_test_[A-Za-z0-9]{20,}"          # Stripe Test Key
    "pk_live_[A-Za-z0-9]{20,}"          # Stripe Live Key
    "sk_test_[A-Za-z0-9]{20,}"          # Stripe Secret Test Key
    "sk_live_[A-Za-z0-9]{20,}"          # Stripe Secret Live Key
    "whsec_[A-Za-z0-9\+\/=]{12,}"       # Webhook Secret
    "AIzaSy[A-Za-z0-9\-_]{20,}"         # Google API Key
    "ntn_[A-Za-z0-9]{20,}"              # Notion API Key
    "xai-[A-Za-z0-9]{20,}"              # X.AI API Key
    "patd[A-Za-z0-9]{20,}"              # Airtable API Key
    "dd21La[A-Za-z0-9]{20,}"            # DataDog API Key
    "AKIA[A-Z0-9]{16}"                  # AWS Access Key
    "[A-Za-z0-9_\-]{32,}\.[A-Za-z0-9_\-]{10,}\.[A-Za-z0-9_\-]{10,}" # JWT Token
)

for pattern in "${SECRET_PATTERNS[@]}"; do
    print_status "  Checking for pattern: ${pattern:0:20}..."
    
    # Search in all text files, excluding node_modules and .git
    if grep -r -E "$pattern" . \
        --include="*.js" \
        --include="*.ts" \
        --include="*.jsx" \
        --include="*.tsx" \
        --include="*.html" \
        --include="*.css" \
        --include="*.json" \
        --include="*.md" \
        --include="*.yml" \
        --include="*.yaml" \
        --include="*.toml" \
        --include="*.sh" \
        --exclude-dir=node_modules \
        --exclude-dir=.git \
        --exclude-dir=dist \
        --exclude-dir=build \
        --exclude="*.log" \
        --exclude="security-scan.sh" \
        2>/dev/null; then
        
        print_error "Found exposed secret matching pattern: ${pattern:0:20}..."
        ((SECRETS_FOUND++))
    fi
done

if [ $SECRETS_FOUND -eq 0 ]; then
    print_success "No exposed secrets found"
else
    print_error "Found $SECRETS_FOUND exposed secrets!"
fi

# Step 2: Check .env file security
print_status "Checking .env file security..."

if [ -f ".env" ]; then
    # Check if .env is in .gitignore
    if [ -f ".gitignore" ] && grep -q "^\.env$" .gitignore; then
        print_success ".env is properly gitignored"
    else
        print_error ".env is NOT in .gitignore!"
    fi
    
    # Check if .env is tracked in git
    if git ls-files | grep -q "^\.env$"; then
        print_error ".env is tracked in git! Remove it immediately!"
    else
        print_success ".env is not tracked in git"
    fi
    
    # Check .env permissions
    ENV_PERMS=$(stat -f "%A" .env 2>/dev/null || stat -c "%a" .env 2>/dev/null)
    if [ "$ENV_PERMS" != "600" ]; then
        print_warning ".env permissions are $ENV_PERMS (should be 600)"
        chmod 600 .env
        print_success "Fixed .env permissions to 600"
    fi
else
    print_warning "No .env file found"
fi

# Step 3: Check for hardcoded URLs and endpoints
print_status "Checking for hardcoded production URLs..."

PROD_PATTERNS=(
    "https://api\..*\.com"
    "https://.*\.workers\.dev"
    "mongodb\+srv://"
    "postgres://"
    "mysql://"
    "redis://"
)

for pattern in "${PROD_PATTERNS[@]}"; do
    if grep -r "$pattern" . \
        --include="*.js" \
        --include="*.ts" \
        --exclude-dir=node_modules \
        --exclude-dir=.git \
        2>/dev/null | grep -v "localhost" | grep -v "127.0.0.1"; then
        print_warning "Found hardcoded URL pattern: $pattern"
    fi
done

# Step 4: Check npm dependencies for vulnerabilities
print_status "Checking npm dependencies for vulnerabilities..."

if [ -f "package.json" ]; then
    npm audit --audit-level=moderate 2>&1 | tee -a $SCAN_RESULTS || true
    
    # Check for critical vulnerabilities
    if npm audit --audit-level=critical 2>&1 | grep -q "found 0 vulnerabilities"; then
        print_success "No critical npm vulnerabilities found"
    else
        print_error "Critical npm vulnerabilities detected!"
    fi
fi

# Step 5: Check file permissions
print_status "Checking file permissions..."

# Find world-writable files
WORLD_WRITABLE=$(find . -type f -perm -002 -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null)
if [ -n "$WORLD_WRITABLE" ]; then
    print_warning "Found world-writable files:"
    echo "$WORLD_WRITABLE"
fi

# Find executable JavaScript files
EXEC_JS=$(find . -type f -name "*.js" -perm +111 -not -path "./node_modules/*" 2>/dev/null)
if [ -n "$EXEC_JS" ]; then
    print_status "Found executable JS files (this is OK if intentional):"
    echo "$EXEC_JS"
fi

# Step 6: Check for sensitive file patterns
print_status "Checking for sensitive files..."

SENSITIVE_FILES=(
    "*.pem"
    "*.key"
    "*.p12"
    "*.pfx"
    "id_rsa*"
    "*.cer"
    "*.crt"
    ".DS_Store"
    "Thumbs.db"
)

for pattern in "${SENSITIVE_FILES[@]}"; do
    FILES=$(find . -name "$pattern" -not -path "./node_modules/*" -not -path "./.git/*" 2>/dev/null)
    if [ -n "$FILES" ]; then
        print_warning "Found sensitive file pattern $pattern:"
        echo "$FILES"
    fi
done

# Step 7: Check CORS configuration
print_status "Checking CORS configuration..."

if grep -r "Access-Control-Allow-Origin.*\*" . \
    --include="*.js" \
    --include="*.ts" \
    --exclude-dir=node_modules \
    2>/dev/null; then
    print_warning "Found wildcard CORS configuration (Access-Control-Allow-Origin: *)"
fi

# Step 8: Generate .env.example if needed
print_status "Checking for .env.example..."

if [ -f ".env" ] && [ ! -f ".env.example" ]; then
    print_status "Generating .env.example..."
    
    # Create .env.example with redacted values
    sed 's/=.*/=your_value_here/' .env > .env.example
    
    print_success "Created .env.example"
fi

# Step 9: Secret Rotation Helper
echo ""
echo "======================================"
echo "🔄 SECRET ROTATION GUIDE"
echo "======================================"
echo ""

cat << EOF > secret-rotation-guide.md
# Secret Rotation Guide for Blaze Intelligence

## Cloudflare Secrets
\`\`\`bash
# List current secrets
wrangler secret list

# Update a secret
echo "NEW_SECRET_VALUE" | wrangler secret put SECRET_NAME

# Rotate API keys
wrangler secret put NOTION_TOKEN
wrangler secret put HUBSPOT_API_KEY
wrangler secret put GITHUB_TOKEN
\`\`\`

## Local .env Rotation
1. Generate new API keys from respective services
2. Update .env file
3. Update .env.example with placeholder values
4. Deploy new secrets to Cloudflare Workers

## Service-Specific Rotation

### Notion API
1. Go to https://www.notion.so/my-integrations
2. Select your integration
3. Regenerate token
4. Update NOTION_TOKEN

### HubSpot API
1. Go to HubSpot Settings > Integrations > API Key
2. Generate new key
3. Update HUBSPOT_API_KEY

### GitHub Token
1. Go to GitHub Settings > Developer settings > Personal access tokens
2. Generate new token
3. Update GITHUB_TOKEN

## Rotation Schedule
- **Critical Secrets**: Every 30 days
- **API Keys**: Every 90 days
- **Webhook Secrets**: Every 180 days

## After Rotation
1. Test all integrations
2. Update documentation
3. Notify team members
4. Archive old secrets securely
EOF

print_success "Created secret-rotation-guide.md"

# Step 10: Generate Security Report
echo ""
echo "======================================"
echo "📊 SECURITY SCAN SUMMARY"
echo "======================================"
echo ""

if [ $SECRETS_FOUND -eq 0 ] && [ $VULNERABILITIES -eq 0 ]; then
    print_success "Security scan passed! No critical issues found."
    echo "Status: PASSED" >> $SCAN_RESULTS
else
    print_error "Security scan found issues:"
    echo "  • Exposed Secrets: $SECRETS_FOUND"
    echo "  • Vulnerabilities: $VULNERABILITIES"
    echo "Status: FAILED" >> $SCAN_RESULTS
    echo "" >> $SCAN_RESULTS
    echo "Action Required:" >> $SCAN_RESULTS
    echo "1. Remove all exposed secrets immediately" >> $SCAN_RESULTS
    echo "2. Rotate compromised credentials" >> $SCAN_RESULTS
    echo "3. Run 'npm audit fix' to patch vulnerabilities" >> $SCAN_RESULTS
fi

echo ""
echo "Full report saved to: $SCAN_RESULTS"
echo ""

# Step 11: Git hooks setup
print_status "Setting up git pre-commit hook..."

mkdir -p .git/hooks
cat << 'EOF' > .git/hooks/pre-commit
#!/bin/bash
# Blaze Intelligence Pre-commit Security Hook

echo "Running pre-commit security scan..."

# Check for secrets
if grep -r -E "(sk-|ghp_|pk_test|pk_live|AIzaSy|ntn_|xai-)" . \
    --include="*.js" \
    --include="*.html" \
    --include="*.json" \
    --exclude-dir=node_modules \
    --exclude-dir=.git \
    2>/dev/null; then
    echo "❌ Commit blocked: Exposed secrets detected!"
    echo "Remove sensitive data before committing."
    exit 1
fi

echo "✅ Pre-commit security check passed"
EOF

chmod +x .git/hooks/pre-commit
print_success "Git pre-commit hook installed"

echo ""
echo "======================================"
echo "✅ Security scan complete!"
echo "======================================"
echo ""
echo "Recommendations:"
echo "1. Run this scan before every deployment"
echo "2. Rotate secrets regularly (see secret-rotation-guide.md)"
echo "3. Enable 2FA on all service accounts"
echo "4. Use environment variables for all secrets"
echo "5. Never commit .env files"
echo ""

exit $VULNERABILITIES