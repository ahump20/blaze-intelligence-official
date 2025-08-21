# 🔥 BLAZE INTELLIGENCE - Operations Manual

## Quick Start

```bash
# Start all services
./start-blaze.sh

# Visit local site
open http://localhost:8000

# Deploy to production
./deploy-production.sh

# Run security scan
./security-scan.sh
```

## System Architecture

### Core Components

1. **Website** - Static site deployed to Cloudflare Pages
2. **Worker API** - Serverless functions on Cloudflare Workers  
3. **Data Pipeline** - Real-time sports data ingestion
4. **Analytics Agents** - Automated data processing
5. **CMS Integration** - Notion-powered content management

### Focus Teams
- **MLB**: St. Louis Cardinals
- **NFL**: Tennessee Titans  
- **NCAA**: Texas Longhorns
- **NBA**: Memphis Grizzlies

## Development Workflow

### 1. Local Development
```bash
# Start all services
./start-blaze.sh

# This starts:
# - Cardinals Readiness Board (updates every 10 min)
# - Real-time Data Pipeline (all 4 teams)
# - Local development server (port 8000)
```

### 2. Data Management

#### Cardinals Readiness Board
- **Output**: `src/data/readiness.json`
- **Updates**: Every 10 minutes
- **Metrics**: Readiness scores, leverage, predictions

#### Real-time Pipeline
- **Output**: `src/data/analytics/*.json`
- **Teams**: Cardinals, Titans, Longhorns, Grizzlies
- **Updates**: 5-15 minute intervals

### 3. Content Management

#### Notion CMS Setup
```bash
# Configure Notion integration
./setup-notion-cms.sh

# Sync content from Notion
./sync-notion-content.js

# Content outputs to:
# - src/data/cms-content.json
# - content/*.html
```

### 4. Lead Capture

The lead capture system is fully integrated:
- **Frontend**: Contact form at `/contact.html`
- **Backend**: Worker endpoint at `/api/lead`
- **Storage**: Cloudflare D1 database
- **CRM**: HubSpot integration (when configured)

## Deployment

### Production Deployment
```bash
# Full deployment pipeline
./deploy-production.sh

# This will:
# 1. Run tests
# 2. Build site
# 3. Security scan
# 4. Deploy Worker
# 5. Deploy to Cloudflare Pages
# 6. Health checks
```

### Deployment URLs
- **Cloudflare Pages**: https://blaze-intelligence.pages.dev
- **Worker API**: https://blaze-sports-data.humphrey-austin20.workers.dev
- **Custom Domain**: https://blaze-intelligence.com (after DNS setup)

## Security

### Security Scanning
```bash
# Run comprehensive security scan
./security-scan.sh

# This checks for:
# - Exposed secrets
# - npm vulnerabilities
# - File permissions
# - CORS configuration
```

### Secret Management

#### Local Secrets (.env)
```env
# Notion CMS
NOTION_TOKEN=ntn_xxxxx
NOTION_DATABASE_ID=xxxxx

# Cloudflare
CLOUDFLARE_ACCOUNT_ID=xxxxx
CLOUDFLARE_API_TOKEN=xxxxx

# HubSpot CRM
HUBSPOT_PORTAL_ID=xxxxx
HUBSPOT_ACCESS_TOKEN=xxxxx
```

#### Cloudflare Secrets
```bash
# List secrets
wrangler secret list

# Add/update secret
echo "SECRET_VALUE" | wrangler secret put SECRET_NAME
```

### Secret Rotation Schedule
- **Critical**: Every 30 days
- **API Keys**: Every 90 days
- **Webhooks**: Every 180 days

## Competitive Positioning

### Verified Claims (per Blaze Canon)
- **Savings**: 67-80% vs Hudl tiers
- **Accuracy**: 87% championship prediction (with methods link)
- **Latency**: <100ms response time
- **Data Points**: 2.8M+ processed

### Pricing Structure
- **Starter**: $99/mo ($1,188/yr)
- **Growth**: $299/mo ($3,588/yr)
- **Enterprise**: Custom (starting $10k)

## Monitoring & Analytics

### Health Checks
```bash
# Worker health
curl https://blaze-sports-data.humphrey-austin20.workers.dev/health

# Site status
curl https://blaze-intelligence.pages.dev/api/health
```

### Key Metrics
- Page load: <1.2s (Lighthouse 95+)
- API latency: <100ms p50
- Worker CPU: <10ms average
- Database queries: <5ms p95

## Troubleshooting

### Common Issues

#### Agents Not Running
```bash
# Check if running
ps aux | grep node

# Restart all services
./stop-blaze.sh
./start-blaze.sh
```

#### Deployment Failures
```bash
# Check Cloudflare status
wrangler whoami

# View deployment logs
wrangler pages deployments list --project-name=blaze-intelligence

# Rollback if needed
wrangler pages rollback --project-name=blaze-intelligence
```

#### Secret Issues
```bash
# Verify .env exists and has correct permissions
ls -la .env  # Should be 600

# Check if secrets are exposed
./security-scan.sh
```

## Maintenance Schedule

### Daily
- [ ] Check health endpoints
- [ ] Monitor error logs
- [ ] Review lead submissions

### Weekly
- [ ] Run security scan
- [ ] Update team data
- [ ] Sync Notion content
- [ ] Review analytics

### Monthly
- [ ] Rotate critical secrets
- [ ] Update dependencies
- [ ] Performance audit
- [ ] Backup data

## Emergency Procedures

### Site Down
1. Check Cloudflare status page
2. Review Worker logs: `wrangler tail`
3. Rollback if recent deployment: `wrangler pages rollback`
4. Contact Cloudflare support if persistent

### Data Pipeline Failure
1. Check agent logs
2. Restart agents: `./stop-blaze.sh && ./start-blaze.sh`
3. Verify API endpoints are accessible
4. Check rate limits on external APIs

### Security Breach
1. Run security scan immediately
2. Rotate ALL secrets
3. Review access logs
4. Update security headers
5. Notify stakeholders

## Support & Resources

### Documentation
- **Cloudflare Pages**: https://developers.cloudflare.com/pages
- **Workers**: https://developers.cloudflare.com/workers
- **Wrangler CLI**: https://developers.cloudflare.com/workers/cli-wrangler

### Internal Docs
- `DEPLOYMENT_COMPLETE.md` - Deployment checklist
- `SECURITY_ROTATION.md` - Secret rotation guide
- `BLAZE_V2_RUNBOOK.md` - System runbook
- `secret-rotation-guide.md` - Detailed rotation procedures

## Contact

**Austin Humphrey**
- Email: ahump20@outlook.com
- Phone: (210) 273-5538
- LinkedIn: john-humphrey-2033

---

*"Turning data into dominance"* - Blaze Intelligence

Built with conviction. Deployed with confidence.