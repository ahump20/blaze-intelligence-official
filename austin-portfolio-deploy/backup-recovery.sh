#!/bin/bash

# Blaze Intelligence Backup & Recovery System
# Automated backup and disaster recovery for production data

set -e

# Configuration
BACKUP_DIR="backups"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="blaze_backup_${TIMESTAMP}"
MAX_BACKUPS=30
S3_BUCKET="blaze-intelligence-backups"
ENCRYPTION_KEY="${BACKUP_ENCRYPTION_KEY:-BlazeIntelligence2025}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        mkdir -p "$BACKUP_DIR"
        log_info "Created backup directory: $BACKUP_DIR"
    fi
}

# Backup files
backup_files() {
    log_info "Starting file backup..."
    
    # Create temporary backup directory
    TEMP_DIR="${BACKUP_DIR}/${BACKUP_NAME}"
    mkdir -p "$TEMP_DIR"
    
    # Files and directories to backup
    BACKUP_ITEMS=(
        "*.html"
        "js"
        "css"
        "data"
        "api"
        "src"
        "images"
        ".env*"
        "package.json"
        "package-lock.json"
        "*.md"
        "*.sh"
        ".github"
    )
    
    # Copy files
    for item in "${BACKUP_ITEMS[@]}"; do
        if [ -e "$item" ]; then
            cp -r "$item" "$TEMP_DIR/" 2>/dev/null || true
            log_info "Backed up: $item"
        fi
    done
    
    log_success "File backup complete"
}

# Backup browser data (IndexedDB, localStorage)
backup_browser_data() {
    log_info "Creating browser data export script..."
    
    cat > "${TEMP_DIR}/export_browser_data.html" << 'EOF'
<!DOCTYPE html>
<html>
<head>
    <title>Blaze Intelligence Data Export</title>
</head>
<body>
    <h1>Data Export Tool</h1>
    <button onclick="exportAll()">Export All Data</button>
    <div id="status"></div>
    
    <script>
    async function exportAll() {
        const status = document.getElementById('status');
        status.innerHTML = 'Exporting...';
        
        const exportData = {
            timestamp: new Date().toISOString(),
            localStorage: {},
            sessionStorage: {},
            indexedDB: {},
            cookies: document.cookie
        };
        
        // Export localStorage
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            exportData.localStorage[key] = localStorage.getItem(key);
        }
        
        // Export sessionStorage
        for (let i = 0; i < sessionStorage.length; i++) {
            const key = sessionStorage.key(i);
            exportData.sessionStorage[key] = sessionStorage.getItem(key);
        }
        
        // Export IndexedDB (if available)
        if ('indexedDB' in window) {
            const dbs = await indexedDB.databases();
            for (const db of dbs) {
                exportData.indexedDB[db.name] = await exportIndexedDB(db.name);
            }
        }
        
        // Download as JSON
        const blob = new Blob([JSON.stringify(exportData, null, 2)], {
            type: 'application/json'
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `browser_data_${Date.now()}.json`;
        a.click();
        
        status.innerHTML = '✅ Export complete!';
    }
    
    async function exportIndexedDB(dbName) {
        return new Promise((resolve) => {
            const request = indexedDB.open(dbName);
            request.onsuccess = async (event) => {
                const db = event.target.result;
                const data = {};
                
                for (const storeName of db.objectStoreNames) {
                    const transaction = db.transaction([storeName], 'readonly');
                    const store = transaction.objectStore(storeName);
                    const getAllRequest = store.getAll();
                    
                    getAllRequest.onsuccess = () => {
                        data[storeName] = getAllRequest.result;
                    };
                }
                
                setTimeout(() => resolve(data), 1000);
            };
            
            request.onerror = () => resolve({});
        });
    }
    </script>
</body>
</html>
EOF
    
    log_success "Browser data export script created"
}

# Create database dump
backup_database() {
    log_info "Creating database backup..."
    
    # Check for database connections
    if [ -f ".env" ]; then
        source .env
        
        # MongoDB backup
        if [ ! -z "$MONGODB_URI" ]; then
            mongodump --uri="$MONGODB_URI" --out="${TEMP_DIR}/mongodb_dump" 2>/dev/null || log_warning "MongoDB backup skipped"
        fi
        
        # PostgreSQL backup
        if [ ! -z "$POSTGRES_URL" ]; then
            pg_dump "$POSTGRES_URL" > "${TEMP_DIR}/postgres_dump.sql" 2>/dev/null || log_warning "PostgreSQL backup skipped"
        fi
        
        # Redis backup
        if [ ! -z "$REDIS_URL" ]; then
            redis-cli --rdb "${TEMP_DIR}/redis_dump.rdb" 2>/dev/null || log_warning "Redis backup skipped"
        fi
    fi
    
    log_success "Database backup complete"
}

# Compress backup
compress_backup() {
    log_info "Compressing backup..."
    
    cd "$BACKUP_DIR"
    
    # Create tar.gz archive
    tar -czf "${BACKUP_NAME}.tar.gz" "$BACKUP_NAME"
    
    # Encrypt if encryption key is set
    if [ ! -z "$ENCRYPTION_KEY" ]; then
        log_info "Encrypting backup..."
        openssl enc -aes-256-cbc -salt -in "${BACKUP_NAME}.tar.gz" -out "${BACKUP_NAME}.tar.gz.enc" -k "$ENCRYPTION_KEY"
        rm "${BACKUP_NAME}.tar.gz"
        BACKUP_FILE="${BACKUP_NAME}.tar.gz.enc"
    else
        BACKUP_FILE="${BACKUP_NAME}.tar.gz"
    fi
    
    # Remove temporary directory
    rm -rf "$BACKUP_NAME"
    
    # Calculate backup size
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    log_success "Backup compressed: $BACKUP_FILE ($BACKUP_SIZE)"
    
    cd - > /dev/null
}

# Upload to cloud storage
upload_to_cloud() {
    log_info "Uploading to cloud storage..."
    
    BACKUP_FILE_PATH="${BACKUP_DIR}/${BACKUP_FILE}"
    
    # AWS S3
    if command -v aws &> /dev/null; then
        aws s3 cp "$BACKUP_FILE_PATH" "s3://${S3_BUCKET}/${BACKUP_FILE}" \
            --storage-class GLACIER_IR \
            --metadata "timestamp=${TIMESTAMP}" || log_warning "S3 upload failed"
        log_success "Uploaded to AWS S3"
    fi
    
    # Google Cloud Storage
    if command -v gsutil &> /dev/null; then
        gsutil cp "$BACKUP_FILE_PATH" "gs://${S3_BUCKET}/${BACKUP_FILE}" || log_warning "GCS upload failed"
        log_success "Uploaded to Google Cloud Storage"
    fi
    
    # Azure Blob Storage
    if command -v az &> /dev/null; then
        az storage blob upload \
            --container-name backups \
            --file "$BACKUP_FILE_PATH" \
            --name "$BACKUP_FILE" || log_warning "Azure upload failed"
        log_success "Uploaded to Azure Blob Storage"
    fi
    
    # Cloudflare R2
    if command -v wrangler &> /dev/null && [ ! -z "$CLOUDFLARE_ACCOUNT_ID" ]; then
        wrangler r2 object put "blaze-backups/${BACKUP_FILE}" \
            --file="$BACKUP_FILE_PATH" || log_warning "R2 upload failed"
        log_success "Uploaded to Cloudflare R2"
    fi
}

# Clean old backups
cleanup_old_backups() {
    log_info "Cleaning old backups..."
    
    cd "$BACKUP_DIR"
    
    # Count existing backups
    BACKUP_COUNT=$(ls -1 blaze_backup_*.tar.gz* 2>/dev/null | wc -l)
    
    if [ "$BACKUP_COUNT" -gt "$MAX_BACKUPS" ]; then
        # Calculate how many to delete
        DELETE_COUNT=$((BACKUP_COUNT - MAX_BACKUPS))
        
        # Delete oldest backups
        ls -1t blaze_backup_*.tar.gz* | tail -n "$DELETE_COUNT" | while read file; do
            rm "$file"
            log_info "Deleted old backup: $file"
        done
    fi
    
    cd - > /dev/null
    
    log_success "Cleanup complete"
}

# Restore from backup
restore_backup() {
    log_info "Starting restore process..."
    
    # List available backups
    echo "Available backups:"
    ls -1t "${BACKUP_DIR}"/blaze_backup_*.tar.gz* 2>/dev/null | head -10 | nl
    
    read -p "Enter backup number to restore (or path to backup file): " BACKUP_CHOICE
    
    if [[ "$BACKUP_CHOICE" =~ ^[0-9]+$ ]]; then
        # User selected a number
        RESTORE_FILE=$(ls -1t "${BACKUP_DIR}"/blaze_backup_*.tar.gz* | sed -n "${BACKUP_CHOICE}p")
    else
        # User provided a path
        RESTORE_FILE="$BACKUP_CHOICE"
    fi
    
    if [ ! -f "$RESTORE_FILE" ]; then
        log_error "Backup file not found: $RESTORE_FILE"
        exit 1
    fi
    
    log_info "Restoring from: $RESTORE_FILE"
    
    # Create restore directory
    RESTORE_DIR="restore_${TIMESTAMP}"
    mkdir -p "$RESTORE_DIR"
    
    # Copy backup file
    cp "$RESTORE_FILE" "$RESTORE_DIR/"
    cd "$RESTORE_DIR"
    
    # Decrypt if needed
    if [[ "$RESTORE_FILE" == *.enc ]]; then
        log_info "Decrypting backup..."
        ENCRYPTED_FILE=$(basename "$RESTORE_FILE")
        DECRYPTED_FILE="${ENCRYPTED_FILE%.enc}"
        
        read -s -p "Enter encryption key: " DECRYPT_KEY
        echo
        
        openssl enc -aes-256-cbc -d -in "$ENCRYPTED_FILE" -out "$DECRYPTED_FILE" -k "$DECRYPT_KEY"
        rm "$ENCRYPTED_FILE"
        RESTORE_FILE="$DECRYPTED_FILE"
    else
        RESTORE_FILE=$(basename "$RESTORE_FILE")
    fi
    
    # Extract backup
    log_info "Extracting backup..."
    tar -xzf "$RESTORE_FILE"
    
    # Find extracted directory
    EXTRACTED_DIR=$(find . -maxdepth 1 -type d -name "blaze_backup_*" | head -1)
    
    if [ -z "$EXTRACTED_DIR" ]; then
        log_error "Failed to find extracted backup directory"
        exit 1
    fi
    
    cd "$EXTRACTED_DIR"
    
    # Restore files
    log_info "Restoring files..."
    
    read -p "This will overwrite existing files. Continue? (y/n): " CONFIRM
    if [ "$CONFIRM" != "y" ]; then
        log_warning "Restore cancelled"
        exit 0
    fi
    
    # Copy files back
    cp -r * ../../ 2>/dev/null || true
    
    cd ../..
    
    # Clean up
    rm -rf "$RESTORE_DIR"
    
    log_success "Restore complete!"
    log_info "Please reload the application and check all functionality"
}

# Verify backup integrity
verify_backup() {
    log_info "Verifying backup integrity..."
    
    if [ -z "$1" ]; then
        # Get latest backup
        VERIFY_FILE=$(ls -1t "${BACKUP_DIR}"/blaze_backup_*.tar.gz* 2>/dev/null | head -1)
    else
        VERIFY_FILE="$1"
    fi
    
    if [ ! -f "$VERIFY_FILE" ]; then
        log_error "No backup file found to verify"
        exit 1
    fi
    
    log_info "Verifying: $VERIFY_FILE"
    
    # Test archive integrity
    if [[ "$VERIFY_FILE" == *.enc ]]; then
        log_info "Encrypted backup - skipping content verification"
        log_success "File exists and is readable"
    else
        tar -tzf "$VERIFY_FILE" > /dev/null 2>&1
        if [ $? -eq 0 ]; then
            log_success "Backup integrity verified"
            
            # Show backup contents summary
            log_info "Backup contents:"
            tar -tzf "$VERIFY_FILE" | head -20
            echo "..."
            TOTAL_FILES=$(tar -tzf "$VERIFY_FILE" | wc -l)
            log_info "Total files: $TOTAL_FILES"
        else
            log_error "Backup is corrupted!"
            exit 1
        fi
    fi
}

# Create backup report
generate_report() {
    log_info "Generating backup report..."
    
    REPORT_FILE="${BACKUP_DIR}/backup_report_${TIMESTAMP}.md"
    
    cat > "$REPORT_FILE" << EOF
# Blaze Intelligence Backup Report
Generated: $(date)

## System Information
- Hostname: $(hostname)
- User: $(whoami)
- Directory: $(pwd)

## Backup Summary
- Backup Name: ${BACKUP_NAME}
- Backup File: ${BACKUP_FILE}
- Backup Size: ${BACKUP_SIZE:-N/A}
- Encryption: ${ENCRYPTION_KEY:+Enabled}${ENCRYPTION_KEY:-Disabled}

## Backed Up Items
EOF
    
    # List backed up items
    if [ -f "${BACKUP_DIR}/${BACKUP_FILE}" ]; then
        echo "### Files and Directories" >> "$REPORT_FILE"
        tar -tzf "${BACKUP_DIR}/${BACKUP_FILE}" 2>/dev/null | head -50 >> "$REPORT_FILE" || echo "Unable to list contents (encrypted)" >> "$REPORT_FILE"
    fi
    
    # Add backup history
    echo -e "\n## Backup History" >> "$REPORT_FILE"
    ls -lht "${BACKUP_DIR}"/blaze_backup_*.tar.gz* 2>/dev/null | head -10 >> "$REPORT_FILE"
    
    # Add storage usage
    echo -e "\n## Storage Usage" >> "$REPORT_FILE"
    df -h . >> "$REPORT_FILE"
    
    log_success "Report generated: $REPORT_FILE"
}

# Schedule automated backups
schedule_backups() {
    log_info "Setting up automated backups..."
    
    # Create cron job
    CRON_JOB="0 2 * * * $(pwd)/backup-recovery.sh backup > /dev/null 2>&1"
    
    # Check if cron job already exists
    crontab -l 2>/dev/null | grep -q "backup-recovery.sh" && {
        log_warning "Backup job already scheduled"
        return
    }
    
    # Add cron job
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    
    log_success "Automated backup scheduled for 2 AM daily"
    log_info "View scheduled jobs with: crontab -l"
}

# Main menu
show_menu() {
    echo
    echo "🔥 Blaze Intelligence Backup & Recovery System"
    echo "=============================================="
    echo "1) Create Backup"
    echo "2) Restore from Backup"
    echo "3) Verify Backup"
    echo "4) Upload to Cloud"
    echo "5) Schedule Automated Backups"
    echo "6) Generate Report"
    echo "7) Clean Old Backups"
    echo "8) Exit"
    echo
    read -p "Select option [1-8]: " choice
    
    case $choice in
        1)
            create_backup_dir
            backup_files
            backup_browser_data
            backup_database
            compress_backup
            upload_to_cloud
            cleanup_old_backups
            generate_report
            log_success "🎉 Backup complete!"
            ;;
        2)
            restore_backup
            ;;
        3)
            verify_backup
            ;;
        4)
            read -p "Enter backup file name: " BACKUP_FILE
            upload_to_cloud
            ;;
        5)
            schedule_backups
            ;;
        6)
            generate_report
            ;;
        7)
            cleanup_old_backups
            ;;
        8)
            log_info "Goodbye!"
            exit 0
            ;;
        *)
            log_error "Invalid option"
            show_menu
            ;;
    esac
}

# Handle command line arguments
if [ "$1" = "backup" ]; then
    create_backup_dir
    backup_files
    backup_browser_data
    backup_database
    compress_backup
    upload_to_cloud
    cleanup_old_backups
    log_success "🎉 Automated backup complete!"
elif [ "$1" = "restore" ]; then
    restore_backup
elif [ "$1" = "verify" ]; then
    verify_backup "$2"
else
    show_menu
fi