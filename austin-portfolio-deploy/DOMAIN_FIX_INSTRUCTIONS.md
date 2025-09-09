# Custom Domain Setup for Blaze Intelligence

## Step 1: Purchase Domain
1. Go to [Cloudflare Registrar](https://dash.cloudflare.com/registrar) or your preferred registrar
2. Purchase `blaze-intelligence.com` (or your preferred domain)
3. If using external registrar, point nameservers to Cloudflare

## Step 2: Add Custom Domain to Cloudflare Pages
1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to Pages → blaze-intelligence-lsl
3. Click "Custom domains" tab
4. Click "Set up a custom domain"
5. Enter your domain: `blaze-intelligence.com`
6. Cloudflare will automatically configure DNS records

## Step 3: Configure DNS Records (if manual)
```
Type    Name    Content                         Proxy   TTL
CNAME   @       blaze-intelligence.com   ✓      Auto
CNAME   www     blaze-intelligence.com   ✓      Auto
```

## Step 4: Update wrangler.toml
```toml
[env.production]
routes = [
  { pattern = "blaze-intelligence.com", custom_domain = true },
  { pattern = "www.blaze-intelligence.com", custom_domain = true }
]
```

## Step 5: Update Site References
1. Update all absolute URLs in HTML files from `blaze-intelligence.com` to `blaze-intelligence.com`
2. Update sitemap.xml domain
3. Update RSS feed URLs
4. Update canonical tags

## Step 6: Verify Setup
```bash
# Check DNS propagation
dig blaze-intelligence.com
nslookup blaze-intelligence.com

# Test redirects
curl -I https://blaze-intelligence.com
# Should return 301 redirect to https://blaze-intelligence.com
```

## Step 7: SSL Certificate
- Cloudflare automatically provisions SSL certificates
- Wait 10-15 minutes for certificate activation
- Verify at: https://blaze-intelligence.com

## Benefits
✅ Professional appearance (no .pages.dev subdomain)
✅ Better SEO and brand recognition
✅ Automatic SSL/HTTPS
✅ 301 redirects from old domain
✅ No downtime during transition

## Estimated Time: 30 minutes
- Domain purchase: 5 minutes
- DNS configuration: 10 minutes
- Propagation: 5-15 minutes
- Verification: 5 minutes