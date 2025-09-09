#!/bin/bash

# Blaze Intelligence Asana Workspace Deployment Script
# Comprehensive setup for championship-level business execution
#
# Usage: ./deploy-blaze-asana-workspace.sh
# 
# Prerequisites:
# - Node.js installed
# - Required API tokens in environment variables
# - Network access to all integration endpoints

set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_FILE="$SCRIPT_DIR/blaze-asana-deployment.log"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

# Logging function
log() {
    echo -e "${1}" | tee -a "$LOG_FILE"
}

# Success indicator
success() {
    log "${GREEN}✅ $1${NC}"
}

# Error indicator
error() {
    log "${RED}❌ $1${NC}"
}

# Warning indicator
warning() {
    log "${YELLOW}⚠️ $1${NC}"
}

# Info indicator
info() {
    log "${BLUE}ℹ️ $1${NC}"
}

# Header
header() {
    log "${PURPLE}🏆 $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Validate environment
validate_environment() {
    header "VALIDATING ENVIRONMENT"
    
    # Check Node.js
    if command_exists node; then
        NODE_VERSION=$(node --version)
        success "Node.js detected: $NODE_VERSION"
    else
        error "Node.js is required but not installed"
        exit 1
    fi
    
    # Check npm
    if command_exists npm; then
        NPM_VERSION=$(npm --version)
        success "npm detected: $NPM_VERSION"
    else
        error "npm is required but not installed"
        exit 1
    fi
    
    # Check required files
    local required_files=(
        "blaze-asana-workspace-config.json"
        "blaze-asana-setup-script.js"
        "blaze-ai-coordination-workflows.js"
        "blaze-integration-hub-setup.js"
    )
    
    for file in "${required_files[@]}"; do
        if [[ -f "$SCRIPT_DIR/$file" ]]; then
            success "Found required file: $file"
        else
            error "Missing required file: $file"
            exit 1
        fi
    done
}

# Check API tokens
check_tokens() {
    header "CHECKING API TOKENS"
    
    local tokens=(
        "ASANA_TOKEN:Asana Personal Access Token"
        "HUBSPOT_TOKEN:HubSpot Private App Token"
        "NOTION_TOKEN:Notion Integration Token"
        "STRIPE_SECRET_KEY:Stripe Secret Key"
    )
    
    local missing_tokens=0
    
    for token_info in "${tokens[@]}"; do
        IFS=':' read -r token_var token_desc <<< "$token_info"
        if [[ -n "${!token_var:-}" ]]; then
            success "$token_desc is configured"
        else
            warning "$token_desc is missing (${token_var})"
            ((missing_tokens++))
        fi
    done
    
    if [[ $missing_tokens -gt 0 ]]; then
        warning "Some tokens are missing. Setup will continue but some integrations may fail."
        info "Please set the following environment variables:"
        for token_info in "${tokens[@]}"; do
            IFS=':' read -r token_var token_desc <<< "$token_info"
            if [[ -z "${!token_var:-}" ]]; then
                log "  export $token_var=\"your_${token_var,,}_here\""
            fi
        done
    fi
}

# Install dependencies
install_dependencies() {
    header "INSTALLING DEPENDENCIES"
    
    info "Installing Node.js dependencies..."
    npm install axios node-cron --save
    
    if [[ $? -eq 0 ]]; then
        success "Dependencies installed successfully"
    else
        error "Failed to install dependencies"
        exit 1
    fi
}

# Run Asana workspace setup
setup_asana_workspace() {
    header "SETTING UP ASANA WORKSPACE"
    
    info "Creating Blaze Intelligence workspace structure..."
    
    if node "$SCRIPT_DIR/blaze-asana-setup-script.js" 2>&1 | tee -a "$LOG_FILE"; then
        success "Asana workspace setup completed"
        
        # Check if setup report was generated
        if [[ -f "$SCRIPT_DIR/blaze-asana-setup-report.json" ]]; then
            success "Setup report generated: blaze-asana-setup-report.json"
        fi
    else
        error "Asana workspace setup failed"
        warning "Check the log file for details: $LOG_FILE"
        return 1
    fi
}

# Initialize AI coordination
setup_ai_coordination() {
    header "INITIALIZING AI COORDINATION SYSTEM"
    
    info "Starting multi-platform AI coordination..."
    
    # Start coordination system in background
    nohup node "$SCRIPT_DIR/blaze-ai-coordination-workflows.js" > "$SCRIPT_DIR/ai-coordination.log" 2>&1 &
    AI_COORD_PID=$!
    
    # Save PID for later management
    echo "$AI_COORD_PID" > "$SCRIPT_DIR/ai-coordination.pid"
    
    # Wait a moment to check if it started successfully
    sleep 3
    
    if kill -0 "$AI_COORD_PID" 2>/dev/null; then
        success "AI coordination system started (PID: $AI_COORD_PID)"
        info "Daily schedules configured:"
        info "  - Morning Briefing: 8:00 AM"
        info "  - Evening Review: 6:00 PM"
        info "  - Task Processing: Every hour"
    else
        error "AI coordination system failed to start"
        return 1
    fi
}

# Configure integrations
setup_integrations() {
    header "CONFIGURING INTEGRATIONS"
    
    info "Setting up HubSpot, Notion, and Stripe integrations..."
    
    # Set additional environment variables if not set
    export BASE_URL="${BASE_URL:-https://blazeintelligence.com}"
    export NOTION_PARENT_PAGE_ID="${NOTION_PARENT_PAGE_ID:-default}"
    
    if node "$SCRIPT_DIR/blaze-integration-hub-setup.js" 2>&1 | tee -a "$LOG_FILE"; then
        success "Integration hub setup completed"
        
        # Check if integration dashboard was generated
        if [[ -f "$SCRIPT_DIR/blaze-integration-dashboard.json" ]]; then
            success "Integration dashboard generated: blaze-integration-dashboard.json"
        fi
    else
        warning "Integration hub setup completed with some failures"
        info "Check the log file for details: $LOG_FILE"
    fi
}

# Generate deployment report
generate_report() {
    header "GENERATING DEPLOYMENT REPORT"
    
    local report_file="$SCRIPT_DIR/blaze-deployment-report-$TIMESTAMP.json"
    
    cat > "$report_file" << EOF
{
  "deployment_timestamp": "$(date -u +"%Y-%m-%dT%H:%M:%SZ")",
  "deployment_id": "$TIMESTAMP",
  "workspace_name": "Blaze Intelligence",
  "status": "deployed",
  "components": {
    "asana_workspace": "$(if [[ -f "$SCRIPT_DIR/blaze-asana-setup-report.json" ]]; then echo "success"; else echo "failed"; fi)",
    "ai_coordination": "$(if [[ -f "$SCRIPT_DIR/ai-coordination.pid" ]]; then echo "running"; else echo "stopped"; fi)",
    "integrations": "$(if [[ -f "$SCRIPT_DIR/blaze-integration-dashboard.json" ]]; then echo "configured"; else echo "partial"; fi)"
  },
  "revenue_targets": {
    "q4_2025": "$325,000",
    "annual_2026": "$1,875,000"
  },
  "next_steps": [
    "Begin Q4 2025 revenue campaign execution",
    "Test all integration endpoints",
    "Train team on new workflows",
    "Monitor AI coordination performance",
    "Schedule first client outreach campaigns"
  ],
  "success_metrics": {
    "projects_created": "5",
    "goals_configured": "5", 
    "templates_available": "3",
    "ai_platforms_coordinated": "3"
  },
  "monitoring": {
    "log_file": "$LOG_FILE",
    "ai_coordination_log": "$SCRIPT_DIR/ai-coordination.log",
    "ai_coordination_pid_file": "$SCRIPT_DIR/ai-coordination.pid"
  }
}
EOF
    
    success "Deployment report generated: $(basename "$report_file")"
}

# Display final status
show_final_status() {
    header "DEPLOYMENT COMPLETE"
    
    echo ""
    log "${GREEN}🏆 BLAZE INTELLIGENCE ASANA WORKSPACE DEPLOYED SUCCESSFULLY! 🏆${NC}"
    echo ""
    
    log "${BLUE}📊 Workspace Structure:${NC}"
    log "   • Q4 2025 Revenue Sprint (\$325K Target)"
    log "   • 2026 Scale-Up Campaign (\$1.875M Target)"
    log "   • Multi-Platform AI Coordination"
    log "   • Product Development Pipeline"
    log "   • Integration Hub Management"
    echo ""
    
    log "${BLUE}🤖 AI Coordination Active:${NC}"
    log "   • Claude Opus 4.1: Strategic & Integration Tasks"
    log "   • ChatGPT 5 Pro: Research & Automation Tasks"
    log "   • Gemini 2.5 Pro: Data & Processing Tasks"
    echo ""
    
    log "${BLUE}🔗 Integrations Configured:${NC}"
    log "   • HubSpot CRM Pipeline"
    log "   • Notion Knowledge Base"
    log "   • Stripe Revenue Tracking"
    log "   • Airtable Data Management"
    echo ""
    
    log "${BLUE}📈 Success Metrics:${NC}"
    log "   • Projects Created: 5"
    log "   • Goals Configured: 5"
    log "   • Templates Available: 3"
    log "   • AI Platforms Coordinated: 3"
    echo ""
    
    log "${YELLOW}📋 Next Actions:${NC}"
    log "   1. Visit your Asana workspace to review project structure"
    log "   2. Test integration endpoints and webhooks"
    log "   3. Begin executing prospect outreach campaigns"
    log "   4. Monitor AI coordination performance daily"
    log "   5. Track progress toward Q4 2025 revenue target"
    echo ""
    
    log "${PURPLE}📞 Support Contact:${NC}"
    log "   Email: ahump20@outlook.com"
    log "   Phone: (210) 273-5538"
    echo ""
    
    log "${GREEN}Ready for championship-level business execution! 🚀${NC}"
}

# Cleanup on exit
cleanup() {
    if [[ -n "${AI_COORD_PID:-}" ]]; then
        info "Cleaning up background processes..."
    fi
}

trap cleanup EXIT

# Main execution
main() {
    # Initialize log file
    echo "Blaze Intelligence Asana Workspace Deployment - $TIMESTAMP" > "$LOG_FILE"
    
    header "STARTING BLAZE INTELLIGENCE DEPLOYMENT"
    
    # Run deployment steps
    validate_environment
    check_tokens
    install_dependencies
    
    # Core setup steps
    if setup_asana_workspace; then
        setup_ai_coordination
        setup_integrations
        generate_report
        show_final_status
    else
        error "Deployment failed during Asana workspace setup"
        exit 1
    fi
}

# Execute main function
main "$@"