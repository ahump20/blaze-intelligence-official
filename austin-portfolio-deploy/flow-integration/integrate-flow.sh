#!/bin/bash

# Flow Integration Script for austin-portfolio-deploy
echo "🧠 Integrating Flow Overlay into austin-portfolio-deploy"

# Find HTML files to integrate
HTML_FILES=($(find . -name "*.html" -not -path "./node_modules/*" -not -path "./flow-integration/*"))

if [ ${#HTML_FILES[@]} -eq 0 ]; then
    echo "❌ No HTML files found for integration"
    exit 1
fi

echo "📄 Found ${#HTML_FILES[@]} HTML files for integration"

# Backup existing files
echo "📁 Creating backups..."
for file in "${HTML_FILES[@]}"; do
    cp "$file" "$file.backup.flow.$(date +%Y%m%d_%H%M%S)"
done

# Integrate CSS
echo "🎨 Integrating Flow CSS..."
for file in "${HTML_FILES[@]}"; do
    # Add CSS link before closing head tag
    if grep -q "</head>" "$file"; then
        sed -i '' '/<\/head>/i\
        <link rel="stylesheet" href="flow-integration/flow-styles.css">' "$file"
        echo "   ✅ CSS integrated: $file"
    fi
done

# Integrate JavaScript
echo "⚡ Integrating Flow JavaScript..."
for file in "${HTML_FILES[@]}"; do
    # Add JS before closing body tag
    if grep -q "</body>" "$file"; then
        sed -i '' '/<\/body>/i\
        <script src="flow-integration/flow-widgets.js"></script>' "$file"
        echo "   ✅ JS integrated: $file"
    fi
done

echo "✅ Flow integration complete!"
echo "🧠 Flow overlay will appear automatically on page load"
echo "📊 EEG/HRV/FSS-2 monitoring is now active"
echo ""
echo "🎯 Features enabled:"
echo "   ├─ Real-time flow probability monitoring"
echo "   ├─ EEG alpha/theta ratio tracking" 
echo "   ├─ Heart rate variability (HRV) display"
echo "   ├─ Flow State Scale-2 (FSS-2) scoring"
echo "   ├─ Difficulty adjustment controls"
echo "   └─ Championship analytics enhancement"
echo ""
echo "🔧 Next steps:"
echo "   1. Test flow overlay functionality"
echo "   2. Verify metrics update in real-time"  
echo "   3. Test difficulty slider integration"
echo "   4. Configure flow API endpoints"

# Optional: Start local server for testing
read -p "🚀 Start local server to test flow integration? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    if command -v python3 &> /dev/null; then
        echo "🌐 Starting server at http://localhost:8000"
        echo "🧠 Flow overlay should appear in top-left corner"
        python3 -m http.server 8000
    elif command -v python &> /dev/null; then
        echo "🌐 Starting server at http://localhost:8000"  
        echo "🧠 Flow overlay should appear in top-left corner"
        python -m SimpleHTTPServer 8000
    else
        echo "ℹ️  No Python found. Please start your preferred local server."
    fi
fi