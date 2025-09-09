#!/bin/bash

# Script to remove spam-like popup scripts from all HTML files
# This ensures a professional, trustworthy user experience

echo "🧹 Removing spam-like popup scripts from all HTML files..."

# List of problematic scripts to remove
POPUP_SCRIPTS=(
    "blaze-navigation.js"
    "blaze-analytics.js"
    "blaze-ai-scoring.js"
    "blaze-competitive-intelligence.js"
    "blaze-personalized-demo.js"
    "blaze-lead-qualification.js"
    "blaze-enterprise-onboarding.js"
    "blaze-automated-reporting.js"
    "blaze-performance-monitoring.js"
)

# Counter for files modified
modified_count=0

# Process all HTML files
for html_file in *.html; do
    if [ -f "$html_file" ]; then
        echo "Checking: $html_file"
        file_modified=false
        
        # Check if file contains any popup scripts
        for script in "${POPUP_SCRIPTS[@]}"; do
            if grep -q "$script" "$html_file"; then
                echo "  Found $script - removing..."
                file_modified=true
            fi
        done
        
        if [ "$file_modified" = true ]; then
            # Create backup
            cp "$html_file" "${html_file}.backup.$(date +%Y%m%d_%H%M%S)"
            
            # Remove script tags and their comments
            for script in "${POPUP_SCRIPTS[@]}"; do
                # Remove the script tag
                sed -i '' "/<script src=\"\/js\/$script\"><\/script>/d" "$html_file"
                # Remove associated comment lines
                sed -i '' "/<!-- Blaze.*-->/d" "$html_file"
            done
            
            # Clean up multiple empty lines
            sed -i '' '/^[[:space:]]*$/N;/\n[[:space:]]*$/d' "$html_file"
            
            ((modified_count++))
            echo "  ✅ Cleaned $html_file"
        fi
    fi
done

echo ""
echo "📊 Summary:"
echo "- Files cleaned: $modified_count"
echo "- Backups created with .backup.* extension"
echo ""
echo "✨ Cleanup complete! Your site is now free of spam-like popups."
echo ""
echo "Next steps:"
echo "1. Review the changes"
echo "2. Test the affected pages"
echo "3. Deploy with: wrangler pages deploy ."