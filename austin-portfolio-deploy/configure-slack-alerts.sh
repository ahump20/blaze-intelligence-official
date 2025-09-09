#!/bin/bash

# Blaze Intelligence - Slack Alert Configuration
# Sets up monitoring and alert notifications via Slack

set -e

echo "🔔 Blaze Intelligence - Slack Alert Configuration"
echo "================================================"
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to create Slack webhook
setup_slack() {
    echo -e "${BLUE}📢 Setting Up Slack Integration${NC}"
    echo "================================"
    echo ""
    echo "To create a Slack webhook:"
    echo "1. Go to: https://api.slack.com/apps"
    echo "2. Click 'Create New App' > 'From scratch'"
    echo "3. Name it 'Blaze Intelligence Alerts'"
    echo "4. Select your workspace"
    echo "5. Go to 'Incoming Webhooks' > Toggle ON"
    echo "6. Click 'Add New Webhook to Workspace'"
    echo "7. Select a channel (e.g., #blaze-alerts)"
    echo "8. Copy the webhook URL"
    echo ""
    
    read -p "Enter your Slack Webhook URL: " SLACK_WEBHOOK_URL
    
    if [ -z "$SLACK_WEBHOOK_URL" ]; then
        echo -e "${RED}❌ No webhook URL provided${NC}"
        exit 1
    fi
    
    # Test the webhook
    echo -n "Testing Slack webhook... "
    response=$(curl -s -X POST "$SLACK_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d '{
            "text": "🚀 Blaze Intelligence alerts configured successfully!",
            "attachments": [{
                "color": "#BF5700",
                "title": "System Connected",
                "text": "Your monitoring alerts are now active.",
                "footer": "Blaze Intelligence",
                "footer_icon": "https://blazeintelligence.com/favicon.ico",
                "ts": '$(date +%s)'
            }]
        }' -o /dev/null -w "%{http_code}" 2>/dev/null)
    
    if [ "$response" = "200" ]; then
        echo -e "${GREEN}✅ PASSED${NC}"
        echo "$SLACK_WEBHOOK_URL" > .slack-webhook-url
        echo -e "${GREEN}✅ Webhook URL saved to .slack-webhook-url${NC}"
    else
        echo -e "${RED}❌ FAILED (Status: $response)${NC}"
        exit 1
    fi
}

# Create alert configuration
create_alert_config() {
    echo ""
    echo -e "${BLUE}⚙️  Creating Alert Configuration${NC}"
    echo "================================"
    
    cat > slack-alerts-config.json << EOF
{
  "alerts": {
    "system": {
      "enabled": true,
      "channel": "#blaze-system",
      "conditions": {
        "deployment": true,
        "errors": true,
        "performance": true,
        "security": true
      }
    },
    "business": {
      "enabled": true,
      "channel": "#blaze-business",
      "conditions": {
        "new_leads": true,
        "payments": true,
        "signups": true,
        "feedback": true
      }
    },
    "sports": {
      "enabled": true,
      "channel": "#blaze-sports",
      "conditions": {
        "data_updates": true,
        "api_issues": true,
        "processing_complete": true
      }
    }
  },
  "thresholds": {
    "error_rate": 0.01,
    "response_time_ms": 1000,
    "uptime_percent": 99.9,
    "cpu_percent": 80,
    "memory_percent": 85
  },
  "schedule": {
    "health_check": "*/5 * * * *",
    "performance_report": "0 */6 * * *",
    "daily_summary": "0 9 * * *",
    "weekly_report": "0 9 * * 1"
  },
  "webhookUrl": "$SLACK_WEBHOOK_URL"
}
EOF
    
    echo -e "${GREEN}✅ Configuration created: slack-alerts-config.json${NC}"
}

# Create alert templates
create_alert_templates() {
    echo ""
    echo -e "${BLUE}📝 Creating Alert Templates${NC}"
    echo "================================"
    
    cat > slack-alert-templates.js << 'EOF'
// Blaze Intelligence - Slack Alert Templates

const alertTemplates = {
  // System Alerts
  deployment: (data) => ({
    text: `🚀 New deployment to ${data.environment}`,
    attachments: [{
      color: '#10b981',
      title: 'Deployment Successful',
      fields: [
        { title: 'Version', value: data.version, short: true },
        { title: 'Commit', value: data.commit, short: true },
        { title: 'Files', value: data.fileCount, short: true },
        { title: 'Time', value: data.deployTime, short: true }
      ],
      footer: 'Blaze Intelligence',
      ts: Date.now() / 1000
    }]
  }),

  error: (data) => ({
    text: `❌ Error detected in ${data.service}`,
    attachments: [{
      color: '#ef4444',
      title: 'Error Alert',
      fields: [
        { title: 'Service', value: data.service, short: true },
        { title: 'Error Type', value: data.type, short: true },
        { title: 'Message', value: data.message, short: false },
        { title: 'Stack Trace', value: `\`\`\`${data.stack}\`\`\``, short: false }
      ],
      footer: 'Blaze Intelligence',
      ts: Date.now() / 1000
    }]
  }),

  performance: (data) => ({
    text: `⚡ Performance Alert: ${data.metric}`,
    attachments: [{
      color: data.severity === 'critical' ? '#ef4444' : '#f59e0b',
      title: 'Performance Issue Detected',
      fields: [
        { title: 'Metric', value: data.metric, short: true },
        { title: 'Current', value: data.current, short: true },
        { title: 'Threshold', value: data.threshold, short: true },
        { title: 'Duration', value: data.duration, short: true }
      ],
      footer: 'Blaze Intelligence',
      ts: Date.now() / 1000
    }]
  }),

  // Business Alerts
  newLead: (data) => ({
    text: `💼 New lead received!`,
    attachments: [{
      color: '#BF5700',
      title: 'Lead Information',
      fields: [
        { title: 'Name', value: data.name, short: true },
        { title: 'Company', value: data.company, short: true },
        { title: 'Email', value: data.email, short: true },
        { title: 'Interest', value: data.interest, short: true },
        { title: 'Message', value: data.message, short: false }
      ],
      footer: 'Blaze Intelligence',
      ts: Date.now() / 1000
    }]
  }),

  payment: (data) => ({
    text: `💰 Payment received: $${data.amount}`,
    attachments: [{
      color: '#10b981',
      title: 'Payment Successful',
      fields: [
        { title: 'Customer', value: data.customer, short: true },
        { title: 'Amount', value: `$${data.amount}`, short: true },
        { title: 'Plan', value: data.plan, short: true },
        { title: 'Period', value: data.period, short: true }
      ],
      footer: 'Blaze Intelligence',
      ts: Date.now() / 1000
    }]
  }),

  // Sports Data Alerts
  dataUpdate: (data) => ({
    text: `📊 Sports data updated: ${data.league}`,
    attachments: [{
      color: '#3b82f6',
      title: 'Data Processing Complete',
      fields: [
        { title: 'League', value: data.league, short: true },
        { title: 'Teams', value: data.teamCount, short: true },
        { title: 'Games', value: data.gameCount, short: true },
        { title: 'Players', value: data.playerCount, short: true },
        { title: 'Processing Time', value: `${data.processingTime}ms`, short: true },
        { title: 'Next Update', value: data.nextUpdate, short: true }
      ],
      footer: 'Blaze Intelligence',
      ts: Date.now() / 1000
    }]
  }),

  // Summary Reports
  dailySummary: (data) => ({
    text: `📈 Daily Summary - ${new Date().toLocaleDateString()}`,
    attachments: [{
      color: '#BF5700',
      title: 'Platform Statistics',
      fields: [
        { title: 'Uptime', value: `${data.uptime}%`, short: true },
        { title: 'Requests', value: data.requests, short: true },
        { title: 'New Users', value: data.newUsers, short: true },
        { title: 'Revenue', value: `$${data.revenue}`, short: true },
        { title: 'Avg Response', value: `${data.avgResponse}ms`, short: true },
        { title: 'Error Rate', value: `${data.errorRate}%`, short: true }
      ],
      footer: 'Blaze Intelligence',
      ts: Date.now() / 1000
    }]
  })
};

module.exports = { alertTemplates };
EOF
    
    echo -e "${GREEN}✅ Templates created: slack-alert-templates.js${NC}"
}

# Create monitoring integration
create_monitoring_integration() {
    echo ""
    echo -e "${BLUE}🔗 Creating Monitoring Integration${NC}"
    echo "================================"
    
    cat > slack-monitoring-integration.js << 'EOF'
// Blaze Intelligence - Slack Monitoring Integration

const https = require('https');
const { alertTemplates } = require('./slack-alert-templates');

class SlackMonitoring {
  constructor(webhookUrl) {
    this.webhookUrl = webhookUrl;
    this.queue = [];
    this.rateLimitDelay = 1000; // 1 second between messages
  }

  // Send alert to Slack
  async sendAlert(type, data) {
    const template = alertTemplates[type];
    if (!template) {
      console.error(`Unknown alert type: ${type}`);
      return;
    }

    const message = template(data);
    this.queue.push(message);
    this.processQueue();
  }

  // Process message queue with rate limiting
  async processQueue() {
    if (this.processing || this.queue.length === 0) return;
    
    this.processing = true;
    const message = this.queue.shift();
    
    try {
      await this.sendToSlack(message);
      setTimeout(() => {
        this.processing = false;
        this.processQueue();
      }, this.rateLimitDelay);
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
      this.processing = false;
    }
  }

  // Send message to Slack webhook
  sendToSlack(message) {
    return new Promise((resolve, reject) => {
      const data = JSON.stringify(message);
      const url = new URL(this.webhookUrl);
      
      const options = {
        hostname: url.hostname,
        path: url.pathname,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': data.length
        }
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 200) {
          resolve();
        } else {
          reject(new Error(`Slack API returned ${res.statusCode}`));
        }
      });

      req.on('error', reject);
      req.write(data);
      req.end();
    });
  }

  // Monitor system health
  async monitorHealth(healthData) {
    if (healthData.status !== 'healthy') {
      await this.sendAlert('error', {
        service: 'System Health',
        type: 'Health Check Failed',
        message: healthData.message,
        stack: JSON.stringify(healthData.failures, null, 2)
      });
    }
  }

  // Monitor performance metrics
  async monitorPerformance(metrics) {
    const config = require('./slack-alerts-config.json');
    const thresholds = config.thresholds;

    if (metrics.responseTime > thresholds.response_time_ms) {
      await this.sendAlert('performance', {
        metric: 'Response Time',
        current: `${metrics.responseTime}ms`,
        threshold: `${thresholds.response_time_ms}ms`,
        severity: metrics.responseTime > thresholds.response_time_ms * 2 ? 'critical' : 'warning',
        duration: metrics.duration
      });
    }

    if (metrics.errorRate > thresholds.error_rate) {
      await this.sendAlert('performance', {
        metric: 'Error Rate',
        current: `${(metrics.errorRate * 100).toFixed(2)}%`,
        threshold: `${(thresholds.error_rate * 100).toFixed(2)}%`,
        severity: 'critical',
        duration: metrics.duration
      });
    }
  }

  // Send daily summary
  async sendDailySummary(stats) {
    await this.sendAlert('dailySummary', stats);
  }
}

// Export for use in other modules
module.exports = { SlackMonitoring };

// Example usage
if (require.main === module) {
  const fs = require('fs');
  const webhookUrl = fs.readFileSync('.slack-webhook-url', 'utf8').trim();
  const monitor = new SlackMonitoring(webhookUrl);

  // Test alerts
  monitor.sendAlert('deployment', {
    environment: 'production',
    version: '2.5.0',
    commit: 'abc123',
    fileCount: 784,
    deployTime: '2.3s'
  });

  monitor.sendAlert('newLead', {
    name: 'John Smith',
    company: 'Cardinals Organization',
    email: 'john@cardinals.com',
    interest: 'Enterprise Plan',
    message: 'Interested in player analytics platform'
  });
}
EOF
    
    echo -e "${GREEN}✅ Integration created: slack-monitoring-integration.js${NC}"
}

# Create cron job setup
create_cron_setup() {
    echo ""
    echo -e "${BLUE}⏰ Creating Cron Job Setup${NC}"
    echo "================================"
    
    cat > setup-slack-cron.sh << 'EOF'
#!/bin/bash

# Add cron jobs for Slack monitoring
echo "Setting up automated Slack alerts..."

# Create cron script
cat > /tmp/blaze-slack-cron << 'CRON'
# Blaze Intelligence - Slack Alert Schedule

# Health check every 5 minutes
*/5 * * * * cd /Users/AustinHumphrey/austin-portfolio-deploy && node check-health.js 2>&1

# Performance report every 6 hours
0 */6 * * * cd /Users/AustinHumphrey/austin-portfolio-deploy && node generate-performance-report.js 2>&1

# Daily summary at 9 AM
0 9 * * * cd /Users/AustinHumphrey/austin-portfolio-deploy && node daily-summary.js 2>&1

# Weekly report on Mondays at 9 AM
0 9 * * 1 cd /Users/AustinHumphrey/austin-portfolio-deploy && node weekly-report.js 2>&1

# Sports data update alerts
*/30 * * * * cd /Users/AustinHumphrey/austin-portfolio-deploy && node check-data-updates.js 2>&1
CRON

# Install cron jobs
crontab -l > /tmp/current-cron 2>/dev/null || true
cat /tmp/blaze-slack-cron >> /tmp/current-cron
crontab /tmp/current-cron

echo "✅ Cron jobs installed successfully!"
echo ""
echo "Current cron schedule:"
crontab -l | grep -A5 "Blaze Intelligence"
EOF
    
    chmod +x setup-slack-cron.sh
    echo -e "${GREEN}✅ Cron setup created: setup-slack-cron.sh${NC}"
}

# Main setup flow
echo -e "${BLUE}🚀 Starting Slack Alert Configuration${NC}"
echo ""

# Setup Slack webhook
setup_slack

# Create configurations
create_alert_config
create_alert_templates
create_monitoring_integration
create_cron_setup

echo ""
echo -e "${GREEN}✅ Slack Alert Configuration Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "1. Configure webhook in Cloudflare:"
echo "   wrangler pages secret put SLACK_WEBHOOK_URL --project-name=blaze-intelligence"
echo ""
echo "2. Test alerts:"
echo "   node slack-monitoring-integration.js"
echo ""
echo "3. Set up cron jobs:"
echo "   ./setup-slack-cron.sh"
echo ""
echo "4. Create custom channels in Slack:"
echo "   - #blaze-system (system alerts)"
echo "   - #blaze-business (business metrics)"
echo "   - #blaze-sports (sports data updates)"
echo ""
echo "5. Customize alert thresholds in slack-alerts-config.json"
echo ""
echo -e "${GREEN}Your Slack monitoring is ready! 🎉${NC}"