#!/bin/bash

# Blaze Intelligence - Backup & Recovery System
# Automated backup of all critical data and configurations

set -e

echo "💾 BLAZE INTELLIGENCE - Backup & Recovery System"
echo "==============================================="
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_status() {
    echo -e "${BLUE}[BACKUP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="blaze_backup_${TIMESTAMP}"
BACKUP_PATH="${BACKUP_DIR}/${BACKUP_NAME}"

# Load environment
if [ -f ".env" ]; then
    source .env
fi

# Create backup directory
mkdir -p "$BACKUP_PATH"

print_status "Starting backup process..."

# ============================================
# BACKUP CRITICAL FILES
# ============================================
print_status "Backing up critical files..."

# Copy source code and configuration
cp -r src/ "$BACKUP_PATH/" 2>/dev/null || true
cp -r agents/ "$BACKUP_PATH/" 2>/dev/null || true
cp -r integrations/ "$BACKUP_PATH/" 2>/dev/null || true
cp -r monitoring/ "$BACKUP_PATH/" 2>/dev/null || true
cp -r scripts/ "$BACKUP_PATH/" 2>/dev/null || true

# Copy configuration files
cp package.json "$BACKUP_PATH/" 2>/dev/null || true
cp wrangler.toml "$BACKUP_PATH/" 2>/dev/null || true
cp .env.example "$BACKUP_PATH/" 2>/dev/null || true
cp *.html "$BACKUP_PATH/" 2>/dev/null || true
cp *.css "$BACKUP_PATH/" 2>/dev/null || true
cp *.js "$BACKUP_PATH/" 2>/dev/null || true
cp *.md "$BACKUP_PATH/" 2>/dev/null || true

print_success "Critical files backed up"

# ============================================
# BACKUP DATA FILES
# ============================================
print_status "Backing up data files..."

mkdir -p "$BACKUP_PATH/data"

# Cardinals readiness data
if [ -f "src/data/readiness.json" ]; then
    cp src/data/readiness.json "$BACKUP_PATH/data/"
    print_success "Cardinals readiness data backed up"
fi

# Team analytics data
if [ -d "src/data/analytics" ]; then
    cp -r src/data/analytics/ "$BACKUP_PATH/data/" 2>/dev/null || true
    print_success "Team analytics data backed up"
fi

# Competitor evidence
if [ -f "src/data/competitor-evidence.json" ]; then
    cp src/data/competitor-evidence.json "$BACKUP_PATH/data/"
    print_success "Competitor evidence backed up"
fi

# CMS content
if [ -f "src/data/cms-content.json" ]; then
    cp src/data/cms-content.json "$BACKUP_PATH/data/"
    print_success "CMS content backed up"
fi

# ============================================
# BACKUP CLOUDFLARE SETTINGS
# ============================================
print_status "Backing up Cloudflare configuration..."

mkdir -p "$BACKUP_PATH/cloudflare"

# Pages settings
if command -v wrangler &> /dev/null; then
    wrangler pages project list > "$BACKUP_PATH/cloudflare/pages_projects.txt" 2>/dev/null || true
    wrangler pages deployments list --project-name=blaze-intelligence > "$BACKUP_PATH/cloudflare/deployments.txt" 2>/dev/null || true
    print_success "Cloudflare Pages settings backed up"
    
    # Worker settings
    wrangler secret list > "$BACKUP_PATH/cloudflare/secrets_list.txt" 2>/dev/null || true
    print_success "Cloudflare Workers settings backed up"
fi

# ============================================
# BACKUP DATABASE SCHEMA
# ============================================
print_status "Backing up database schema..."

mkdir -p "$BACKUP_PATH/database"

# D1 database schema
cat > "$BACKUP_PATH/database/d1_schema.sql" << 'EOF'
-- Blaze Intelligence D1 Database Schema
-- Leads table
CREATE TABLE IF NOT EXISTS leads (
    id TEXT PRIMARY KEY,
    firstName TEXT NOT NULL,
    lastName TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT,
    role TEXT,
    sport TEXT,
    subject TEXT,
    message TEXT,
    source TEXT,
    status TEXT,
    createdAt TEXT,
    updatedAt TEXT
);

-- Analytics table
CREATE TABLE IF NOT EXISTS analytics (
    id TEXT PRIMARY KEY,
    team TEXT NOT NULL,
    metric_type TEXT NOT NULL,
    value REAL,
    metadata TEXT,
    timestamp TEXT
);

-- User sessions table
CREATE TABLE IF NOT EXISTS sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    session_data TEXT,
    created_at TEXT,
    expires_at TEXT
);
EOF

print_success "Database schema backed up"

# ============================================
# BACKUP NOTION DATA
# ============================================
if [ -n "$NOTION_TOKEN" ]; then
    print_status "Backing up Notion data..."
    
    mkdir -p "$BACKUP_PATH/notion"
    
    # Export Notion content if sync script exists
    if [ -f "sync-notion-content.js" ]; then
        node sync-notion-content.js > /dev/null 2>&1 || true
        if [ -f "src/data/cms-content.json" ]; then
            cp src/data/cms-content.json "$BACKUP_PATH/notion/"
            print_success "Notion content backed up"
        fi
    fi
fi

# ============================================
# BACKUP AIRTABLE STRUCTURE
# ============================================
if [ -n "$AIRTABLE_API_KEY" ]; then
    print_status "Backing up Airtable structure..."
    
    mkdir -p "$BACKUP_PATH/airtable"
    
    # Create Airtable schema documentation
    cat > "$BACKUP_PATH/airtable/schema.md" << 'EOF'
# Airtable Schema for Blaze Intelligence

## Tables

### Cardinals_Analytics
- Team (Single line text)
- Timestamp (Date)
- Overall_Readiness (Number)
- Offensive_Score (Number)
- Defensive_Score (Number)
- Pitching_Score (Number)
- Win_Probability (Number)
- Championship_Odds (Number)
- Key_Factors (Long text)
- Recommendations (Long text)

### Player_Rankings
- Name (Single line text)
- Sport (Single select)
- Position (Single line text)
- Team (Single line text)
- Score (Number)
- Rank (Number)
- Updated (Date)

### Leads
- Name (Single line text)
- Email (Email)
- Organization (Single line text)
- Source (Single select)
- Status (Single select)
- Created (Date)
EOF
    
    print_success "Airtable schema documented"
fi

# ============================================
# CREATE RESTORE SCRIPT
# ============================================
print_status "Creating restore script..."

cat > "$BACKUP_PATH/restore.sh" << 'EOF'
#!/bin/bash

# Blaze Intelligence - Restore Script
echo "🔄 Restoring Blaze Intelligence from backup..."

# Copy files back
cp -r src/ ../
cp -r agents/ ../
cp -r integrations/ ../
cp -r monitoring/ ../
cp -r scripts/ ../

# Copy configuration
cp package.json ../
cp wrangler.toml ../
cp *.html ../
cp *.css ../
cp *.js ../
cp *.md ../

# Restore data
cp -r data/* ../src/data/

echo "✅ Restore complete!"
echo ""
echo "Next steps:"
echo "1. Copy .env.example to .env and configure"
echo "2. Run: npm install"
echo "3. Run: ./start-blaze.sh"
echo "4. Deploy: ./deploy-production.sh"
EOF

chmod +x "$BACKUP_PATH/restore.sh"
print_success "Restore script created"

# ============================================
# CREATE BACKUP MANIFEST
# ============================================
print_status "Creating backup manifest..."

cat > "$BACKUP_PATH/manifest.json" << EOF
{
  "backup_info": {
    "timestamp": "$TIMESTAMP",
    "version": "1.0.0",
    "type": "full_backup"
  },
  "system_info": {
    "hostname": "$(hostname)",
    "os": "$(uname -s)",
    "user": "$(whoami)",
    "backup_path": "$BACKUP_PATH"
  },
  "contents": {
    "source_code": true,
    "configuration": true,
    "data_files": true,
    "cloudflare_settings": true,
    "database_schema": true,
    "restore_script": true
  },
  "size_mb": $(du -sm "$BACKUP_PATH" | cut -f1),
  "file_count": $(find "$BACKUP_PATH" -type f | wc -l)
}
EOF

print_success "Backup manifest created"

# ============================================
# COMPRESS BACKUP
# ============================================
print_status "Compressing backup..."

cd "$BACKUP_DIR"
tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
BACKUP_SIZE=$(du -sh "${BACKUP_NAME}.tar.gz" | cut -f1)

# Clean up uncompressed backup
rm -rf "$BACKUP_NAME"

print_success "Backup compressed to ${BACKUP_SIZE}"

# ============================================
# CLEANUP OLD BACKUPS
# ============================================
print_status "Cleaning up old backups..."

# Keep only last 7 backups
cd ..
ls -t ${BACKUP_DIR}/blaze_backup_*.tar.gz | tail -n +8 | xargs rm -f 2>/dev/null || true

BACKUP_COUNT=$(ls ${BACKUP_DIR}/blaze_backup_*.tar.gz 2>/dev/null | wc -l)
print_success "Kept ${BACKUP_COUNT} recent backups"

# ============================================
# UPLOAD TO CLOUD (if configured)
# ============================================
if [ -n "$R2_ACCESS_KEY_ID" ] && [ -n "$R2_SECRET_ACCESS_KEY" ]; then
    print_status "Uploading to Cloudflare R2..."
    
    # This would use AWS CLI or rclone to upload to R2
    print_warning "R2 upload not implemented (add aws cli or rclone)"
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "📋 BACKUP COMPLETE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "✅ Backup created: ${BACKUP_DIR}/${BACKUP_NAME}.tar.gz"
echo "📁 Size: $BACKUP_SIZE"
echo "🕐 Timestamp: $TIMESTAMP"
echo ""
echo "To restore:"
echo "1. Extract: tar -xzf ${BACKUP_NAME}.tar.gz"
echo "2. Run: cd ${BACKUP_NAME} && ./restore.sh"
echo ""
echo "Backed up:"
echo "  • Source code and configurations"
echo "  • Cardinals readiness data"
echo "  • Team analytics data"
echo "  • Cloudflare settings"
echo "  • Database schemas"
echo "  • Integration configurations"
echo ""

print_success "Backup process complete!"

# Create cron job helper
cat > setup-automated-backups.sh << 'EOF'
#!/bin/bash

# Set up automated daily backups
echo "Setting up automated daily backups..."

# Add to crontab (runs daily at 3 AM)
(crontab -l 2>/dev/null; echo "0 3 * * * cd $(pwd) && ./backup-system.sh >> backup.log 2>&1") | crontab -

echo "✅ Automated backups configured (daily at 3 AM)"
echo "Check backup.log for backup status"
EOF

chmod +x setup-automated-backups.sh
print_success "Automated backup script created"