#!/bin/bash

echo "🔥 Blaze Intelligence Video Upload to Cloudflare Stream"
echo "======================================================="
echo ""
echo "Video: Professor Discussion on Sports Management"
echo "File: VIDEO OF ME AND PROF TALKING SPORTS.MP4"
echo ""

# Video path with spaces properly quoted
VIDEO_PATH="/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/Austin Humphrey/VIDEO OF ME AND PROF TALKING SPORTS.MP4"

# Check if file exists
if [ ! -f "$VIDEO_PATH" ]; then
    echo "❌ Video file not found at path"
    exit 1
fi

echo "✅ Video file found (492MB)"
echo ""

# Install Stream CLI if needed
echo "Checking for Stream CLI..."
if ! command -v stream &> /dev/null; then
    echo "Installing Cloudflare Stream CLI..."
    npm i -g @cloudflare/stream-cli
fi

echo ""
echo "MANUAL STEPS REQUIRED:"
echo "======================"
echo ""
echo "1. Run this command to authenticate (will open browser):"
echo "   stream login"
echo ""
echo "2. Upload the video with this command:"
echo '   stream upload "'"$VIDEO_PATH"'"'
echo ""
echo "3. Copy the returned VIDEO UID (e.g., abcd1234efgh5678)"
echo ""
echo "4. Update index.html with the Stream embed code:"
echo ""
echo "Replace the video placeholder in index.html with:"
echo ""
cat << 'EOF'
<!-- Cloudflare Stream Embed - Professor Interview -->
<div class="video-wrapper" id="video-embed">
  <iframe
    src="https://iframe.videodelivery.net/YOUR_VIDEO_UID?autoplay=false&muted=false&controls=true&preload=metadata"
    style="border:0; width:100%; aspect-ratio:16/9; border-radius: 8px;"
    allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
    allowfullscreen
    title="Sports Management Discussion with Professor">
  </iframe>
</div>
EOF
echo ""
echo "5. Deploy the updated site:"
echo "   cd /Users/AustinHumphrey/blaze-intelligence-website"
echo "   npm run build"
echo "   npx wrangler pages deploy ./dist --project-name blaze-intelligence --commit-dirty=true"
echo ""
echo "6. Verify on all URLs:"
echo "   - https://blaze-intelligence.com/"
echo "   - https://d5014d29.blaze-intelligence.pages.dev/"
echo ""
echo "======================================================="