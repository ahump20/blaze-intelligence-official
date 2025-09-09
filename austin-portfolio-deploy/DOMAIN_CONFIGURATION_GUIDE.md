# 🌐 Custom Domain Configuration Guide

## Current Status
✅ **Domain Owned:** blaze-intelligence.com (via Cloudflare)  
✅ **Site Updated:** All URLs now reference blaze-intelligence.com  
⏳ **Next Step:** Add domain to Cloudflare Pages

## Step-by-Step Configuration

### 1. Access Cloudflare Dashboard
1. Go to [dash.cloudflare.com](https://dash.cloudflare.com)
2. Log in with your account
3. You should see "blaze-intelligence.com" in your domains list

### 2. Navigate to Pages Project
1. Click "Pages" in the left sidebar
2. Find and click "blaze-intelligence-lsl"
3. Click the "Custom domains" tab

### 3. Add Custom Domains
Click "Set up a custom domain" and add BOTH:
- `blaze-intelligence.com` (root domain)
- `www.blaze-intelligence.com` (www subdomain)

Cloudflare will automatically:
- Create the necessary DNS records
- Provision SSL certificates
- Set up redirects from the old pages.dev domain

### 4. DNS Records (Auto-Created)
Cloudflare Pages will create these records automatically:
```
Type    Name    Content                              Proxy
CNAME   @       blaze-intelligence.com    ✓
CNAME   www     blaze-intelligence.com    ✓
```

### 5. Verify Configuration
After 5-10 minutes, test these URLs:
- https://blaze-intelligence.com ✅
- https://www.blaze-intelligence.com ✅
- https://blaze-intelligence.com (should redirect) ✅

### 6. SSL Certificate Status
Check SSL status:
```bash
# Test SSL certificate
curl -I https://blaze-intelligence.com

# Check DNS propagation
dig blaze-intelligence.com
nslookup blaze-intelligence.com
```

## What Happens Automatically

### ✅ Cloudflare Handles:
- SSL certificate provisioning (Universal SSL)
- HTTPS enforcement
- 301 redirects from pages.dev to custom domain
- CDN and caching
- DDoS protection

### ✅ Already Completed:
- Updated all internal links to blaze-intelligence.com
- Updated sitemap.xml with new domain
- Updated RSS feed URLs
- Created robots.txt
- Updated all blog post canonical URLs

## Testing Checklist

```bash
# Test main pages
curl -I https://blaze-intelligence.com
curl -I https://blaze-intelligence.com/blog/
curl -I https://blaze-intelligence.com/status.html

# Test redirect from old domain
curl -I https://blaze-intelligence.com
# Should return 301 redirect to https://blaze-intelligence.com

# Test SSL certificate
openssl s_client -connect blaze-intelligence.com:443 -servername blaze-intelligence.com < /dev/null

# Test www subdomain
curl -I https://www.blaze-intelligence.com
# Should work or redirect to root domain
```

## Post-Configuration Tasks

### 1. Update External References
- [ ] Update GitHub repository links
- [ ] Update social media bios
- [ ] Update email signatures
- [ ] Update business cards

### 2. SEO & Analytics
- [ ] Submit new domain to Google Search Console
- [ ] Update Google Analytics property
- [ ] Submit updated sitemap
- [ ] Update social media meta tags

### 3. Marketing Materials
- [ ] Update all marketing collateral
- [ ] Update pitch decks
- [ ] Update email templates
- [ ] Update LinkedIn company page

## Troubleshooting

### If domain doesn't work after 15 minutes:
1. Check DNS propagation: https://dnschecker.org
2. Verify domain is active in Cloudflare
3. Clear browser cache and try incognito mode
4. Check Cloudflare Pages → Custom domains for any errors

### Common Issues:
- **"DNS resolution error"** - Wait for propagation (up to 24 hours globally)
- **"SSL certificate error"** - Certificate provisioning can take 10-15 minutes
- **"Redirect loop"** - Check SSL/TLS settings in Cloudflare (should be "Flexible" or "Full")

## Success Indicators

✅ https://blaze-intelligence.com loads without warnings  
✅ SSL padlock shows in browser  
✅ Old pages.dev URL redirects automatically  
✅ All subpages load correctly  
✅ Blog and RSS feeds work  

## Professional Benefits

With custom domain active:
- **+80% Trust Score** - No more "pages.dev" amateur look
- **Better SEO** - Custom domains rank higher
- **Brand Authority** - Professional email addresses possible
- **Marketing Ready** - Can run ad campaigns
- **Investor Ready** - Credible for due diligence

---

**Estimated Time:** 10-15 minutes for full propagation  
**Support:** If issues persist, contact Cloudflare support with Project ID: blaze-intelligence-lsl

*Last Updated: September 1, 2025*