#!/bin/bash
# Blaze Intelligence - Automated Backup System

BACKUP_DIR="backups/$(date +%Y-%m-%d_%H-%M-%S)"
REMOTE_BACKUP="s3://blaze-intelligence-backups" # Configure if needed

echo "🔥 Blaze Intelligence Backup System"
echo "=================================="

# Create backup directory
mkdir -p "$BACKUP_DIR"

echo "📁 Creating backup: $BACKUP_DIR"

# Backup core files
echo "💾 Backing up core files..."
cp -r dist/ "$BACKUP_DIR/dist/"
cp -r src/ "$BACKUP_DIR/src/"
cp -r workers/ "$BACKUP_DIR/workers/"
cp -r scripts/ "$BACKUP_DIR/scripts/"
cp -r monitoring/ "$BACKUP_DIR/monitoring/"

# Backup configuration
echo "⚙️ Backing up configuration..."
cp package.json "$BACKUP_DIR/"
cp wrangler.toml "$BACKUP_DIR/"
cp *.md "$BACKUP_DIR/"

# Backup current deployment info
echo "🚀 Capturing deployment status..."
npx wrangler pages deployment list --project-name blaze-intelligence > "$BACKUP_DIR/deployment-status.txt" 2>/dev/null || echo "Could not get deployment status"

# Create backup manifest
cat > "$BACKUP_DIR/BACKUP_MANIFEST.md" << EOF
# Blaze Intelligence Backup

**Created**: $(date)
**Version**: Apple-Style Production
**Commit**: $(git rev-parse HEAD 2>/dev/null || echo "Not a git repo")

## Contents
- \`dist/\` - Production build files
- \`src/\` - Source code and data
- \`workers/\` - Cloudflare Workers
- \`scripts/\` - Automation scripts
- \`monitoring/\` - Performance monitoring
- Configuration files (package.json, wrangler.toml, *.md)

## Restore Instructions
1. Extract backup to project directory
2. Run: \`npm install\`
3. Deploy: \`npx wrangler pages deploy ./dist --project-name blaze-intelligence\`
4. Deploy workers: \`npx wrangler deploy workers/lead-capture.js\`

## Live URLs at Backup Time
- Primary: https://blaze-intelligence.pages.dev/
- Workers: https://blaze-lead-capture.humphrey-austin20.workers.dev
- Status: Production Ready

## Data Status
- Cardinals Readiness: $(cat dist/src/data/enhanced-readiness.json 2>/dev/null | jq -r '.overall // "Unknown"')%
- Last Update: $(cat dist/src/data/enhanced-readiness.json 2>/dev/null | jq -r '.timestamp // "Unknown"')

EOF

# Compress backup
echo "🗜️ Compressing backup..."
tar -czf "$BACKUP_DIR.tar.gz" "$BACKUP_DIR/"

# Calculate size
BACKUP_SIZE=$(du -sh "$BACKUP_DIR.tar.gz" | cut -f1)

echo "✅ Backup complete!"
echo "   Location: $BACKUP_DIR.tar.gz"
echo "   Size: $BACKUP_SIZE"

# Optional: Upload to remote storage
if [ -n "$REMOTE_BACKUP" ] && command -v aws &> /dev/null; then
    echo "☁️ Uploading to remote storage..."
    aws s3 cp "$BACKUP_DIR.tar.gz" "$REMOTE_BACKUP/" && echo "✅ Remote backup complete"
fi

# Cleanup old backups (keep last 10)
echo "🧹 Cleaning up old backups..."
ls -t backups/*.tar.gz 2>/dev/null | tail -n +11 | xargs rm -f

echo "🔥 Backup system complete!"