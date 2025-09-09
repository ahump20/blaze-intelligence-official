# Custom Domain Setup for blaze-intelligence.com

## Step 1: Add Custom Domain in Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Navigate to **Pages** → **blaze-intelligence** project
3. Click on **Custom domains** tab
4. Click **Set up a custom domain**
5. Enter: `blaze-intelligence.com`
6. Click **Continue**

## Step 2: DNS Configuration

Cloudflare will automatically add the required DNS records if the domain is in your Cloudflare account. If not, add these records manually:

### Required DNS Records:

```
Type: CNAME
Name: @  (or blaze-intelligence.com)
Target: blaze-intelligence.pages.dev
Proxy: ✅ (Orange cloud ON)
TTL: Auto
```

```
Type: CNAME  
Name: www
Target: blaze-intelligence.pages.dev
Proxy: ✅ (Orange cloud ON)
TTL: Auto
```

## Step 3: Add Redirect Rules (Optional but Recommended)

To ensure www redirects to non-www (or vice versa), add a Page Rule:

1. Go to **Rules** → **Page Rules** in Cloudflare
2. Create rule:
   - URL: `www.blaze-intelligence.com/*`
   - Setting: **Forwarding URL** (301 Permanent)
   - Destination: `https://blaze-intelligence.com/$1`

## Step 4: SSL/TLS Configuration

1. Go to **SSL/TLS** → **Overview**
2. Set encryption mode to **Full (strict)**
3. Enable **Always Use HTTPS** in SSL/TLS → Edge Certificates

## Step 5: Update Project Settings

In your Cloudflare Pages project:
1. Set **Production branch** to `main` (or your default branch)
2. The latest deployment will automatically become the production deployment
3. All feature branches will continue to get preview URLs

## Step 6: Verify Domain Setup

After DNS propagation (usually instant with Cloudflare):
- ✅ https://blaze-intelligence.com should load
- ✅ https://www.blaze-intelligence.com should redirect to non-www
- ✅ SSL certificate should be active (green padlock)

## Current Deployments to Merge:

- **Production URL**: https://3c06c61c.blaze-intelligence.pages.dev
- **Feature Branch**: https://feat-site-finish-brand-data.blaze-intelligence.pages.dev
- **Latest Deployment**: https://e0634bf7.blaze-intelligence.pages.dev

Once the custom domain is added, the latest deployment will automatically be served at blaze-intelligence.com

## Verification Commands:

```bash
# Check DNS propagation
dig blaze-intelligence.com

# Check SSL certificate
curl -I https://blaze-intelligence.com

# Verify redirect
curl -I https://www.blaze-intelligence.com
```

## Troubleshooting:

If domain doesn't work immediately:
1. Check DNS propagation: https://dnschecker.org
2. Clear browser cache
3. Wait 5-10 minutes for Cloudflare to issue SSL certificate
4. Ensure domain is active in Cloudflare (not pending)

## Environment Variables Update:

Update any environment variables or configuration:
- Change all references from `*.pages.dev` to `blaze-intelligence.com`
- Update CORS settings if applicable
- Update API endpoints in Workers

---

**Note**: The custom domain will automatically point to your latest production deployment. Feature branch previews will continue to be available at their `*.pages.dev` URLs.