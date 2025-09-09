# Video Upload Guide for Blaze Intelligence

## Your Video: Professor Discussion on Sports Management

**File**: VIDEO OF ME AND PROF TALKING SPORTS.MP4
**Size**: 492MB
**Location**: /Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/Austin Humphrey/

## Recommended Hosting Solutions

### Option 1: Cloudflare Stream (Recommended)
Best for professional video hosting with adaptive streaming.

1. **Upload to Cloudflare Stream**:
   ```bash
   # Install Stream CLI
   npm install -g @cloudflare/stream-cli
   
   # Upload video
   stream upload "/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/Austin Humphrey/VIDEO OF ME AND PROF TALKING SPORTS.MP4" \
     --name "Blaze Intelligence - Sports Management Discussion"
   ```

2. **Get embed code** from Cloudflare dashboard
3. **Add to homepage** in the video section

### Option 2: YouTube (Free & Easy)
1. Upload to YouTube (can be unlisted)
2. Get embed code
3. Replace video placeholder in index.html

### Option 3: Vimeo (Professional)
1. Upload to Vimeo
2. Customize player with burnt orange theme
3. Get responsive embed code

## Implementation in index.html

Once you have the video hosted, update the video section:

```html
<!-- Replace the current video placeholder with this -->
<div class="video-wrapper">
  <!-- For Cloudflare Stream -->
  <stream src="YOUR_VIDEO_ID" controls preload muted></stream>
  <script data-cfasync="false" defer type="text/javascript" 
    src="https://embed.cloudflarestream.com/embed/r4xu.fla9.latest.js?video=YOUR_VIDEO_ID">
  </script>
  
  <!-- OR for YouTube -->
  <iframe 
    width="100%" 
    height="100%" 
    src="https://www.youtube.com/embed/YOUR_VIDEO_ID?rel=0&showinfo=0" 
    frameborder="0" 
    allowfullscreen>
  </iframe>
  
  <!-- OR for Vimeo -->
  <iframe 
    src="https://player.vimeo.com/video/YOUR_VIDEO_ID?color=BF5700&title=0&byline=0&portrait=0" 
    width="100%" 
    height="100%" 
    frameborder="0" 
    allowfullscreen>
  </iframe>
</div>
```

## Quick Compress Option (If needed)

If you want to compress the video first:

```bash
# Using ffmpeg (install with: brew install ffmpeg)
ffmpeg -i "/Users/AustinHumphrey/Library/Mobile Documents/com~apple~CloudDocs/Austin Humphrey/VIDEO OF ME AND PROF TALKING SPORTS.MP4" \
  -c:v libx264 -preset slow -crf 22 \
  -c:a aac -b:a 128k \
  -movflags +faststart \
  "blaze-sports-discussion.mp4"
```

This will reduce file size while maintaining quality.

## Add to Site Now (Temporary Solution)

For immediate display, I'll add a video section that's ready for your embed code: