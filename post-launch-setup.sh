#!/bin/bash

echo "🎯 POST-LAUNCH SETUP FOR BLAZE-INTELLIGENCE.COM"
echo "=============================================="
echo "These steps will be executed once your site is live"
echo ""

# Function to setup Google Analytics (if desired)
setup_analytics() {
    echo "📊 ANALYTICS SETUP OPTIONS:"
    echo "=========================="
    echo ""
    echo "Your site is ready for analytics integration:"
    echo "• Google Analytics 4"
    echo "• Google Search Console" 
    echo "• Hotjar (user behavior)"
    echo "• Mixpanel (event tracking)"
    echo ""
    echo "Would you like to add Google Analytics? (y/n)"
    read -r add_analytics
    
    if [[ $add_analytics == "y" || $add_analytics == "Y" ]]; then
        echo "📝 To add Google Analytics:"
        echo "1. Go to https://analytics.google.com"
        echo "2. Create account for blaze-intelligence.com"
        echo "3. Get tracking ID (G-XXXXXXXXXX)"
        echo "4. Add to src/index.html <head> section"
        echo ""
        echo "Template code:"
        echo "<!-- Google tag (gtag.js) -->"
        echo "<script async src=\"https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXXXX\"></script>"
        echo "<script>"
        echo "  window.dataLayer = window.dataLayer || [];"
        echo "  function gtag(){dataLayer.push(arguments);}"
        echo "  gtag('js', new Date());"
        echo "  gtag('config', 'G-XXXXXXXXXX');"
        echo "</script>"
    fi
}

# Function to setup SEO
setup_seo() {
    echo ""
    echo "🔍 SEO OPTIMIZATION CHECKLIST:"
    echo "============================="
    echo ""
    echo "✅ Meta tags (already configured)"
    echo "✅ Structured data (JSON-LD in place)"
    echo "✅ Mobile responsive (verified)"
    echo "✅ Page speed optimization (completed)"
    echo ""
    echo "📋 NEXT SEO STEPS:"
    echo "1. Submit sitemap to Google Search Console"
    echo "2. Verify domain ownership"  
    echo "3. Monitor search performance"
    echo "4. Set up Google My Business (if applicable)"
    echo ""
}

# Function to setup security headers
setup_security() {
    echo "🛡️ SECURITY HEADERS RECOMMENDATION:"
    echo "=================================="
    echo ""
    echo "For enhanced security, consider adding these headers:"
    echo "• Content Security Policy (CSP)"
    echo "• X-Frame-Options: DENY"
    echo "• X-Content-Type-Options: nosniff"
    echo "• Referrer-Policy: strict-origin-when-cross-origin"
    echo ""
    echo "These can be configured in:"
    echo "• GitHub Pages (via _headers file)"
    echo "• Cloudflare Page Rules"
    echo "• Meta tags in index.html"
}

# Function to setup monitoring
setup_monitoring() {
    echo ""
    echo "📈 PERFORMANCE MONITORING:"
    echo "========================="
    echo ""
    echo "Recommended monitoring tools:"
    echo "• Google PageSpeed Insights"
    echo "• GTmetrix for performance"
    echo "• Uptime monitoring (UptimeRobot)"
    echo "• Core Web Vitals monitoring"
    echo ""
    echo "🔗 Quick checks:"
    echo "• PageSpeed: https://pagespeed.web.dev/analysis/https-blaze-intelligence-com"
    echo "• SSL Test: https://www.ssllabs.com/ssltest/analyze.html?d=blaze-intelligence.com"
}

# Function to create sitemap
create_sitemap() {
    echo ""
    echo "🗺️ CREATING SITEMAP:"
    echo "==================="
    
    cat > public/sitemap.xml << 'EOF'
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://blaze-intelligence.com/</loc>
    <lastmod>2025-08-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>1.0</priority>
  </url>
  <url>
    <loc>https://blaze-intelligence.com/#about</loc>
    <lastmod>2025-08-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://blaze-intelligence.com/#services</loc>
    <lastmod>2025-08-15</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>https://blaze-intelligence.com/#projects</loc>
    <lastmod>2025-08-15</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.9</priority>
  </url>
</urlset>
EOF
    
    echo "✅ Sitemap created at public/sitemap.xml"
    echo "   Submit to Google Search Console after site is live"
}

# Function to setup robots.txt
create_robots() {
    echo ""
    echo "🤖 CREATING ROBOTS.TXT:"
    echo "======================"
    
    cat > public/robots.txt << 'EOF'
User-agent: *
Allow: /

Sitemap: https://blaze-intelligence.com/sitemap.xml

# Block common spam/scraper paths
Disallow: /cgi-bin/
Disallow: /tmp/
Disallow: /admin/
EOF
    
    echo "✅ Robots.txt created at public/robots.txt"
}

# Main execution
echo "🔄 PREPARING POST-LAUNCH OPTIMIZATIONS..."
echo ""

# Create SEO files
create_sitemap
create_robots

# Display optimization options
setup_seo
setup_analytics
setup_security
setup_monitoring

echo ""
echo "📋 MANUAL TASKS AFTER SITE IS LIVE:"
echo "==================================="
echo ""
echo "1. 🔍 Google Search Console:"
echo "   • Add property: blaze-intelligence.com"
echo "   • Verify ownership via DNS TXT record"
echo "   • Submit sitemap.xml"
echo ""
echo "2. 📊 Performance Testing:"
echo "   • Run PageSpeed Insights"
echo "   • Test mobile responsiveness"
echo "   • Verify all links work"
echo ""
echo "3. 🔒 Security Check:"
echo "   • SSL certificate verification"
echo "   • Security headers test"
echo "   • HTTPS redirect verification"
echo ""
echo "4. 📈 Analytics Setup:"
echo "   • Google Analytics 4"
echo "   • Google Tag Manager (optional)"
echo "   • Conversion tracking"
echo ""
echo "🎉 Your Blaze Intelligence platform will be production-ready!"
echo ""
echo "📞 SUPPORT CONTACTS:"
echo "   • GitHub Issues: https://github.com/ahump20/blaze-intelligence-official/issues"
echo "   • Email: austin@blazeintelligence.com"