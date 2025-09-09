#!/bin/bash

# Austin Portfolio Blaze Intelligence Integration Script
echo "👤 Deploying Austin Portfolio Blaze Intelligence Integration"

# Check for common portfolio files
if [ ! -f "index.html" ] && [ ! -f "portfolio.html" ] && [ ! -f "resume.html" ]; then
    echo "❌ Error: No portfolio HTML files found."
    echo "ℹ️  Please run this from your portfolio directory."
    exit 1
fi

# Find the main portfolio file
PORTFOLIO_FILE=""
for file in index.html portfolio.html resume.html; do
    if [ -f "$file" ]; then
        PORTFOLIO_FILE="$file"
        break
    fi
done

echo "📁 Working with: $PORTFOLIO_FILE"

# Backup existing file
echo "📁 Creating backup..."
cp "$PORTFOLIO_FILE" "$PORTFOLIO_FILE.backup.$(date +%Y%m%d_%H%M%S)"

# Add Blaze Intelligence section
echo "🚀 Adding Blaze Intelligence showcase..."

# Look for projects section or create one
if grep -q -i "projects\|portfolio\|work" "$PORTFOLIO_FILE"; then
    # Insert after projects heading
    sed -i '' '/[Pp]rojects\|[Pp]ortfolio\|[Ww]ork/r blaze-integration/austin-portfolio-section.html' "$PORTFOLIO_FILE"
else
    # Insert before closing body tag
    sed -i '' '/<\/body>/i\
    <section id="projects">\
        <h2>Featured Projects</h2>\
    </section>' "$PORTFOLIO_FILE"
    sed -i '' '/<section id="projects">/r blaze-integration/austin-portfolio-section.html' "$PORTFOLIO_FILE"
fi

# Add achievement data
echo "📊 Integrating achievement data..."
cat >> "$PORTFOLIO_FILE" << 'EOF'

<script>
// Austin Portfolio - Blaze Intelligence Data Integration
document.addEventListener('DOMContentLoaded', function() {
    // Load live achievement data
    fetch('blaze-integration/data/austin-portfolio-deployment.json')
        .then(response => response.json())
        .then(data => {
            // Update professional stats if elements exist
            updateAchievementStats(data.professional_achievements);
        })
        .catch(error => console.log('Blaze data loading in offline mode'));
    
    function updateAchievementStats(stats) {
        // Update DOM elements with live stats
        const elements = {
            'system-validation': stats.system_validation,
            'teams-deployed': stats.teams_deployed,
            'championship-status': stats.championship_readiness
        };
        
        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });
    }
});
</script>
EOF

echo "✅ Portfolio integration complete!"
echo "👤 Your portfolio now showcases Blaze Intelligence achievements"
echo "📊 Live metrics integration active"
echo "🏆 Championship-level project demonstration ready"