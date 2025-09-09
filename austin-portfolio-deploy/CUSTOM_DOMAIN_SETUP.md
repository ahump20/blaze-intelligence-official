# 🌐 BLAZE INTELLIGENCE CUSTOM DOMAIN CONFIGURATION GUIDE

## Current Situation
- **Domain**: blaze-intelligence.com
- **Current Status**: Not showing content (blank or "Hello World!")
- **Goal**: Make it display the full Blaze Intelligence platform

## ✅ Working Deployments with Full Platform
These URLs have the complete, championship-level Blaze Intelligence site:
- https://128f6192.blaze-intelligence.pages.dev (blaze-intelligence project)
- https://93343bcf.blaze-intelligence-production.pages.dev (blaze-intelligence-production project)
- https://a7d36daa.blaze-intelligence.pages.dev (earlier deployment)

## 📋 Step-by-Step Configuration Process

### Step 1: Access Cloudflare Dashboard
1. Go to: https://dash.cloudflare.com
2. Navigate to Pages section
3. Account ID: a12cb329d84130460eed99b816e4d0d3

### Step 2: Remove Domain from Wrong Project (if needed)
1. Check these projects for the domain:
   - blaze-intelligence-domain
   - blaze-intelligence-official
   - blaze-intelligence-public
   - Any other old projects
2. If found, click "Custom domains" tab
3. Click "Remove" next to blaze-intelligence.com

### Step 3: Add Domain to Correct Project
1. Go to: https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/view/blaze-intelligence/custom-domains
   OR
   https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages/view/blaze-intelligence-production/custom-domains

2. Click "Set up a custom domain"
3. Enter: `blaze-intelligence.com`
4. Click "Continue"

### Step 4: DNS Configuration
Two options will appear:

#### Option A: If domain is already on Cloudflare
- It should auto-configure
- Click "Activate domain"

#### Option B: If external DNS needed
- Add CNAME record:
  - Name: `@` or `blaze-intelligence.com`
  - Target: `blaze-intelligence.pages.dev` or `blaze-intelligence-production.pages.dev`
  - Proxy: Yes (orange cloud ON)

### Step 5: Add WWW Subdomain
1. Click "Set up a custom domain" again
2. Enter: `www.blaze-intelligence.com`
3. Follow same DNS steps

## 🔍 Verification Commands

```bash
# Check if domain is working
curl -I https://blaze-intelligence.com

# Check content
curl https://blaze-intelligence.com | grep "Blaze Intelligence"

# Check DNS
dig blaze-intelligence.com

# Check www subdomain
curl -I https://www.blaze-intelligence.com
```

## ⚡ Quick Fix If Still Shows "Hello World!"

1. **Force new deployment**:
```bash
cd /Users/AustinHumphrey/austin-portfolio-deploy
wrangler pages deploy . --project-name=blaze-intelligence --commit-dirty=true
```

2. **Wait 5-10 minutes** for DNS propagation

3. **Clear browser cache** and test in incognito mode

## 🎯 Expected Result
When properly configured, visiting https://blaze-intelligence.com should show:
- "Blaze Intelligence" header
- "Where Cognitive Performance Meets Quarterly Performance" tagline
- Live Cardinals analytics dashboard
- Full navigation menu
- All integrated LSL features

## 🚨 Troubleshooting

### Domain shows nothing/blank
- Domain is in transition
- Wait 5-10 minutes
- Check DNS propagation

### Domain shows 403 error
- Cloudflare Access might be enabled
- Check Access policies in dashboard
- Temporarily disable if needed

### Domain shows old content
- Clear Cloudflare cache
- Purge cache in dashboard
- Force new deployment

## 📞 Support Resources
- Cloudflare Pages Docs: https://developers.cloudflare.com/pages/
- DNS Checker: https://dnschecker.org/
- Project Dashboard: https://dash.cloudflare.com/a12cb329d84130460eed99b816e4d0d3/pages

## ✅ Success Criteria
The domain configuration is successful when:
1. https://blaze-intelligence.com shows full platform
2. https://www.blaze-intelligence.com redirects properly
3. SSL certificate is active (padlock in browser)
4. Content includes all Blaze Intelligence features
5. Performance metrics show <500ms load time

---

**Last Updated**: January 9, 2025
**Platform Status**: Championship Level Ready
**Deployment URLs**: All verified and functional