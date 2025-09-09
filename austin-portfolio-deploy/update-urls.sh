#!/bin/bash

# Update all HTML files to use free Cloudflare Pages URL
echo "Updating all HTML files to use free URL..."

# Find all HTML files and replace domain references
find /Users/AustinHumphrey/austin-portfolio-deploy -name "*.html" -type f | while read file; do
    # Skip node_modules and other build directories
    if [[ "$file" == *"node_modules"* ]] || [[ "$file" == *".git"* ]]; then
        continue
    fi
    
    # Replace custom domain with free URL
    sed -i '' 's|https://blaze-intelligence\.com|https://blaze-intelligence.pages.dev|g' "$file"
    sed -i '' 's|http://blaze-intelligence\.com|https://blaze-intelligence.pages.dev|g' "$file"
    sed -i '' 's|blaze-intelligence\.com|blaze-intelligence.pages.dev|g' "$file"
    
    echo "Updated: $(basename $file)"
done

echo "✅ All HTML files updated to use free URL"
