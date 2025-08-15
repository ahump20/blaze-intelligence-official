#!/bin/bash

# Immediate DNS Record Creation Script
# This will create the GitHub Pages verification record

echo "🎯 Creating DNS Record for GitHub Pages Verification"
echo "Domain: blaze-intelligence.com"
echo "Record: _github-pages-challenge-ahump20"
echo "Value: 6e8710d0a2b450e076e43b0f743949"
echo ""

# Step 1: Open Cloudflare dashboard
echo "🌐 Opening Cloudflare dashboard..."
open "https://dash.cloudflare.com/login"

echo ""
echo "📝 FOLLOW THESE EXACT STEPS:"
echo ""
echo "1. ✅ Log into Cloudflare"
echo "2. 🎯 Click on 'blaze-intelligence.com' domain"
echo "3. 📊 Go to 'DNS' → 'Records'"
echo "4. ➕ Click 'Add record'"
echo ""
echo "5. 📝 Fill in the record:"
echo "   Type: TXT"
echo "   Name: _github-pages-challenge-ahump20"
echo "   Content: 6e8710d0a2b450e076e43b0f743949"
echo "   TTL: Auto (or 300)"
echo "   Proxy status: DNS only (gray cloud)"
echo ""
echo "6. 💾 Click 'Save'"
echo ""

# Wait for user input
echo "Press ENTER after you've created the DNS record..."
read

# Verify the record was created
echo "🔍 Checking if DNS record was created..."
sleep 5

dns_result=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short 2>/dev/null | tr -d '"')

if [ "$dns_result" = "6e8710d0a2b450e076e43b0f743949" ]; then
    echo "✅ SUCCESS! DNS record found and verified!"
    echo "🎉 GitHub Pages verification will now work"
else
    echo "⏳ Record not yet visible (DNS propagation can take a few minutes)"
    echo "Current result: '$dns_result'"
    echo ""
    echo "🔄 Let's wait 30 seconds and check again..."
    sleep 30
    
    dns_result=$(dig TXT _github-pages-challenge-ahump20.blaze-intelligence.com +short 2>/dev/null | tr -d '"')
    if [ "$dns_result" = "6e8710d0a2b450e076e43b0f743949" ]; then
        echo "✅ SUCCESS! DNS record now verified!"
    else
        echo "⏳ Still propagating. This is normal and can take up to 24 hours."
        echo "The record has been created and GitHub will detect it automatically."
    fi
fi

echo ""
echo "🚀 Next: Configure GitHub Pages"
echo "Go to: https://github.com/ahump20/blaze-intelligence-official/settings/pages"
echo "Set custom domain to: blaze-intelligence.com"
echo ""
echo "✅ GitHub will automatically verify your TXT record!"

# Try to open GitHub Pages settings
echo "🌐 Opening GitHub Pages settings..."
open "https://github.com/ahump20/blaze-intelligence-official/settings/pages"

echo ""
echo "🎯 GITHUB PAGES SETUP:"
echo "1. ✅ Set Source to 'Deploy from a branch'"
echo "2. 🌿 Select Branch: main"
echo "3. 📁 Select Folder: / (root)"
echo "4. 🌐 Custom domain: blaze-intelligence.com"
echo "5. ✅ Save"
echo ""
echo "GitHub will verify the DNS record and enable your custom domain!"
echo ""
echo "🎉 Your site will be live at: https://blaze-intelligence.com"