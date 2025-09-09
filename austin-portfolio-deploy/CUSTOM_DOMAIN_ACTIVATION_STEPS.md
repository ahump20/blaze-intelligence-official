# Custom Domain Activation: blaze-intelligence.com

## Manual Steps Required in Cloudflare Dashboard

Since Wrangler CLI doesn't support direct domain addition, please complete these steps:

### 1. Add Custom Domain to Pages Project
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com) 
2. Navigate to **Workers & Pages**
3. Select **Pages** tab
4. Click on **`blaze-intelligence-lsl`** project
5. Go to **Custom domains** tab
6. Click **Set up a custom domain**
7. Enter: `blaze-intelligence.com`
8. Click **Continue**
9. Repeat for: `www.blaze-intelligence.com`

### 2. DNS Configuration
Since you already own the domain through Cloudflare, the DNS should auto-configure:

- `blaze-intelligence.com` → CNAME to `blaze-intelligence.com`
- `www.blaze-intelligence.com` → CNAME to `blaze-intelligence.com`

### 3. SSL Certificate
Cloudflare will automatically provision SSL certificates for both domains (usually takes 10-15 minutes).

### 4. Verification Commands
After setup, test with:
```bash
# Check DNS resolution
dig blaze-intelligence.com
dig www.blaze-intelligence.com

# Test HTTPS access
curl -I https://blaze-intelligence.com
curl -I https://www.blaze-intelligence.com
```

## Current Status
- ✅ Domain owned through Cloudflare
- ✅ Pages project ready (`blaze-intelligence-lsl`)
- ⏳ Custom domain addition (manual step required)
- ⏳ SSL certificate provisioning (automatic after domain added)

## Next Steps After Domain Activation
1. Update all internal links to use custom domain
2. Test all functionality on custom domain
3. Update documentation with correct URLs
4. Set up redirects from .pages.dev to custom domain