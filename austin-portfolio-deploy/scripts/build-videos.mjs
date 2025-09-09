#!/usr/bin/env node

/**
 * Blaze Intelligence Video Page Generator
 * Generates all video pages from data/videos.json
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

// Format duration from ISO 8601 to human readable
function formatDuration(duration) {
  // Handle PT44M16S format
  const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return duration;
  
  const hours = match[1] ? parseInt(match[1]) : 0;
  const minutes = match[2] ? parseInt(match[2]) : 0;
  const seconds = match[3] ? parseInt(match[3]) : 0;
  
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0 && seconds > 0) {
    return `${minutes}m ${seconds}s`;
  } else if (minutes > 0) {
    return `${minutes} min`;
  } else {
    return `${seconds}s`;
  }
}

// Load video data
async function loadVideoData() {
  const dataPath = path.join(ROOT, 'data', 'videos.json');
  const data = await fs.readFile(dataPath, 'utf-8');
  return JSON.parse(data);
}

// Generate JSON-LD for a video
function generateJSONLD(video) {
  return {
    "@context": "https://schema.org",
    "@type": "VideoObject",
    "name": video.title,
    "description": video.description,
    "thumbnailUrl": video.thumbnail,
    "uploadDate": video.uploadDate,
    "duration": video.duration,
    "embedUrl": `https://blaze-intelligence.com/videos/${video.slug}/`,
    "contentUrl": video.hlsUrl,
    "publisher": {
      "@type": "Organization",
      "name": "Blaze Intelligence",
      "logo": {
        "@type": "ImageObject",
        "url": "https://blaze-intelligence.com/assets/images/logo.png"
      }
    }
  };
}

// Generate chapters HTML
function generateChaptersHTML(chapters, videoSlug) {
  return chapters.map(chapter => `
    <div class="chapter-item group" data-chapter-ts="${chapter.seconds}" data-video-slug="${videoSlug}">
      <div class="text-sm text-cyan-400">${chapter.label}</div>
      <div class="text-white">${chapter.title}</div>
    </div>
  `).join('');
}

// Generate key takeaways HTML
function generateTakeawaysHTML(takeaways) {
  return takeaways.map(takeaway => `
    <li class="flex items-start gap-3">
      <span class="text-green-400 mt-1">✓</span>
      <span>${takeaway}</span>
    </li>
  `).join('');
}

// Generate CTAs HTML
function generateCTAsHTML(video) {
  return `
    <div class="flex flex-col sm:flex-row gap-4 justify-center">
      <a href="https://calendly.com/ahump20/15min?utm_source=video&utm_medium=cta&video=${video.slug}"
         class="inline-flex items-center gap-3 px-8 py-4 bg-orange-500 text-white font-bold rounded-lg hover:bg-orange-600 transition-colors"
         data-cta="calendar" data-video-slug="${video.slug}">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
        </svg>
        Book 15-min Consultation
      </a>
      <a href="mailto:ahump20@outlook.com?subject=Sample%20Report%20Request%20(${encodeURIComponent(video.shortTitle)})&body=I%20watched%20your%20${encodeURIComponent(video.shortTitle)}%20video%20and%20would%20like%20to%20request%20a%20sample%20report."
         class="inline-flex items-center gap-3 px-8 py-4 bg-slate-700 text-white font-bold rounded-lg hover:bg-slate-600 transition-colors"
         data-cta="email" data-video-slug="${video.slug}">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
        </svg>
        Request Sample Report
      </a>
    </div>
  `;
}

// Generate video detail page
function generateVideoDetailPage(video, allVideos) {
  const otherVideos = allVideos.filter(v => v.slug !== video.slug);
  const jsonld = JSON.stringify(generateJSONLD(video));
  
  // Determine colors based on category
  const colors = {
    coaching: { primary: 'orange', accent: 'orange-400' },
    executive: { primary: 'blue', accent: 'blue-400' },
    partnership: { primary: 'orange', accent: 'orange-600' }
  };
  const color = colors[video.category] || colors.coaching;

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${video.title} | Blaze Intelligence</title>
    <meta name="description" content="${video.description}">
    <link rel="canonical" href="https://blaze-intelligence.com/videos/${video.slug}/">
    <meta name="robots" content="index, follow">
    <meta name="author" content="Austin Humphrey">
    
    <!-- Open Graph -->
    <meta property="og:title" content="${video.title}">
    <meta property="og:description" content="${video.description}">
    <meta property="og:type" content="video.other">
    <meta property="og:url" content="https://blaze-intelligence.com/videos/${video.slug}/">
    <meta property="og:image" content="${video.thumbnail}">
    <meta property="og:video:duration" content="${video.duration}">
    <meta property="og:site_name" content="Blaze Intelligence">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="player">
    <meta name="twitter:site" content="@BISportsIntel">
    <meta name="twitter:title" content="${video.title}">
    <meta name="twitter:description" content="${video.description}">
    <meta name="twitter:image" content="${video.thumbnail}">
    <meta name="twitter:player" content="https://iframe.videodelivery.net/${video.videoId}">
    <meta name="twitter:player:width" content="1280">
    <meta name="twitter:player:height" content="720">
    
    <!-- Performance Optimizations -->
    <link rel="preconnect" href="https://cdn.tailwindcss.com">
    <link rel="preconnect" href="https://unpkg.com">
    <link rel="preconnect" href="https://iframe.videodelivery.net">
    <link rel="preconnect" href="https://videodelivery.net">
    <link rel="dns-prefetch" href="https://customer-mpdvoybjqct2pzls.cloudflarestream.com">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'neon': {
                            'blue': '#00FFFF',
                            'green': '#00FF00', 
                            'orange': '#FF8C00'
                        }
                    }
                }
            }
        }
    </script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e2e8f0;
        }

        .glass-card {
            background: rgba(30, 41, 59, 0.9);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border-radius: 1rem;
        }

        .neon-text {
            color: #00FFFF;
            text-shadow: 0 0 4px currentColor;
        }

        .text-gradient {
            background: linear-gradient(135deg, #FF8C00 0%, #D2691E 50%, #A0522D 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .video-embed {
            aspect-ratio: 16/9;
            background: #000;
            border-radius: 0.5rem;
            overflow: hidden;
        }

        .chapter-item {
            padding: 0.75rem 1rem;
            border-left: 2px solid transparent;
            transition: all 0.2s ease;
            cursor: pointer;
        }

        .chapter-item:hover {
            background: rgba(255, 140, 0, 0.1);
            border-left-color: #FF8C00;
        }
    </style>
    
    <script>
        window.VIDEO_HLS_URL = '${video.hlsUrl}';
    </script>
</head>
<body class="bg-gray-900">
    <nav class="bg-black/95 backdrop-blur-xl border-b border-gray-800 px-4 py-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" class="text-2xl font-bold neon-text">BLAZE INTELLIGENCE</a>
            <div class="flex gap-6">
                <a href="/" class="text-slate-300 hover:text-white transition-colors">Home</a>
                <a href="/videos/" class="text-white font-semibold">Videos</a>
                <a href="/roi-calculator.html" class="text-slate-300 hover:text-white transition-colors">ROI Calculator</a>
                <a href="/methods.html" class="text-slate-300 hover:text-white transition-colors">Methods</a>
                <a href="/contact.html" class="text-slate-300 hover:text-white transition-colors">Contact</a>
            </div>
        </div>
    </nav>

    <main class="max-w-6xl mx-auto px-4 py-12">
        <!-- Breadcrumb -->
        <div class="flex items-center gap-2 text-sm text-slate-400 mb-8">
            <a href="/" class="hover:text-white transition-colors">Home</a>
            <span>/</span>
            <a href="/videos/" class="hover:text-white transition-colors">Videos</a>
            <span>/</span>
            <span class="text-white">${video.shortTitle}</span>
        </div>

        <div class="grid lg:grid-cols-3 gap-12">
            <!-- Main Content -->
            <div class="lg:col-span-2">
                <h1 class="text-4xl md:text-5xl font-bold mb-4">
                    <span class="text-gradient">${video.shortTitle}</span>
                </h1>
                <h2 class="text-2xl text-${color.accent} mb-8">${video.title.split(' - ')[1] || video.register}</h2>

                <!-- Video Embed -->
                <div id="playerWrap" class="video-embed mb-8" data-hls-url="${video.hlsUrl}">
                    <iframe
                        src="https://iframe.videodelivery.net/${video.videoId}?poster=${encodeURIComponent(video.thumbnail)}"
                        loading="lazy" 
                        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture;"
                        allowfullscreen 
                        style="width:100%; height:100%; border:0;"
                        title="${video.title} Video Player"
                        data-video-id="${video.videoId}">
                    </iframe>
                </div>

                <!-- Abstract -->
                <div class="glass-card p-6 mb-8">
                    <h3 class="text-xl font-bold mb-4 text-cyan-400 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                        </svg>
                        Overview
                    </h3>
                    <p class="text-slate-300 leading-relaxed">
                        ${video.description}
                    </p>
                </div>

                <!-- Key Takeaways -->
                <div class="glass-card p-6 mb-8">
                    <h3 class="text-xl font-bold mb-4 text-${color.accent} flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"></path>
                        </svg>
                        Key Takeaways
                    </h3>
                    <ul class="space-y-3 text-slate-300">
                        ${generateTakeawaysHTML(video.keyTakeaways)}
                    </ul>
                </div>

                <!-- CTAs -->
                <section class="text-center bg-gradient-to-r from-${color.primary}-500/10 to-blue-500/10 rounded-2xl p-12 border border-${color.primary}-500/30">
                    <h2 class="text-3xl font-bold mb-4 text-white">Ready to Apply These Insights?</h2>
                    <p class="text-xl text-slate-300 mb-8 max-w-2xl mx-auto">
                        See how Blaze Intelligence can transform your ${video.category === 'coaching' ? 'player development' : video.category === 'executive' ? 'decision-making' : 'partnerships'}.
                    </p>
                    ${generateCTAsHTML(video)}
                </section>
            </div>

            <!-- Sidebar -->
            <div class="lg:col-span-1">
                <!-- Chapters -->
                <div class="glass-card p-6 mb-8">
                    <h3 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
                        </svg>
                        Chapters
                    </h3>
                    <div class="space-y-1">
                        ${generateChaptersHTML(video.chapters, video.slug)}
                    </div>
                </div>

                <!-- Communication Style -->
                <div class="glass-card p-6 mb-8">
                    <h3 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                        </svg>
                        Communication Register
                    </h3>
                    <div class="space-y-4">
                        <div>
                            <div class="text-sm text-${color.accent} font-semibold mb-1">Register</div>
                            <div class="text-slate-300">${video.register}</div>
                        </div>
                        <div>
                            <div class="text-sm text-${color.accent} font-semibold mb-1">Duration</div>
                            <div class="text-slate-300">${formatDuration(video.duration)}</div>
                        </div>
                        <div>
                            <div class="text-sm text-${color.accent} font-semibold mb-1">Category</div>
                            <div class="text-slate-300 capitalize">${video.category}</div>
                        </div>
                    </div>
                </div>

                <!-- Transcript Link -->
                <div class="glass-card p-6 mb-8">
                    <h3 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                        </svg>
                        Transcript Available
                    </h3>
                    <p class="text-slate-300 mb-4">Full searchable transcript available for accessibility and reference.</p>
                    <a href="/transcripts/${video.slug}.html" class="inline-flex items-center gap-2 px-4 py-2 bg-${color.primary}-500/20 text-${color.accent} font-semibold rounded-lg hover:bg-${color.primary}-500/30 transition-colors">
                        <span>View Transcript</span>
                        <span>→</span>
                    </a>
                </div>

                <!-- Related Videos -->
                <div class="glass-card p-6">
                    <h3 class="text-xl font-bold mb-4 text-white flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"></path>
                        </svg>
                        More Videos
                    </h3>
                    <div class="space-y-4">
                        ${otherVideos.map(v => `
                        <a href="/videos/${v.slug}/" class="block hover:bg-slate-800/50 p-3 -m-3 rounded-lg transition-colors">
                            <div class="text-white font-semibold mb-1">${v.shortTitle}</div>
                            <div class="text-sm text-slate-400">${v.register}</div>
                        </a>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>
    </main>

    <footer class="py-12 bg-black/50 border-t border-slate-800 mt-16">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <div class="text-2xl font-bold neon-text mb-2">BLAZE INTELLIGENCE</div>
            <div class="text-slate-400">Where cognitive performance meets quarterly performance.</div>
        </div>
    </footer>

    <!-- JSON-LD Schema -->
    <script type="application/ld+json">${jsonld}</script>

    <!-- Analytics & Features -->
    <script src="/assets/js/analytics.js"></script>
    <script src="/assets/js/chapters.js"></script>
    <script src="/assets/js/video-player-advanced.js"></script>
    <script src="/assets/js/video-recommendations.js"></script>
    <script src="/assets/js/ab-testing.js"></script>
    <script src="/assets/js/experiment-analyzer.js"></script>
    <script src="/assets/js/video-search.js"></script>
    <script src="/assets/js/funnel-optimizer.js"></script>
    <script src="/assets/js/report-generator.js"></script>
    
    <script>
        // Initialize icons and debug mode
        document.addEventListener('DOMContentLoaded', function() {
            if (window.lucide) lucide.createIcons();
            
            // Enable debug mode if requested
            if (window.location.search.includes('debug=true')) {
                window.BLAZE_DEBUG = true;
                console.log('🏆 Blaze Intelligence Debug Mode Enabled');
            }
        });
    </script>
</body>
</html>`;
}

// Generate video hub page
function generateVideoHubPage(videos) {
  const videoCards = videos.map(video => `
    <a href="/videos/${video.slug}/" class="glass-card overflow-hidden group video-card" data-section="video-hub">
        <div class="aspect-video bg-gradient-to-br from-orange-500/20 to-blue-500/20 relative overflow-hidden">
            <img src="${video.thumbnail}" alt="${video.title}" class="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" loading="lazy">
            <div class="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div class="absolute bottom-2 right-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                ${formatDuration(video.duration)}
            </div>
        </div>
        <div class="p-6">
            <h3 class="text-2xl font-bold mb-2 text-white group-hover:text-cyan-400 transition-colors">
                ${video.shortTitle}
            </h3>
            <div class="text-sm text-orange-400 font-semibold mb-3">
                ${video.register}
            </div>
            <p class="text-slate-300 mb-4 line-clamp-3">
                ${video.description}
            </p>
            <div class="flex items-center gap-2 text-cyan-400">
                <span class="text-sm font-semibold">Watch Now</span>
                <span>→</span>
            </div>
        </div>
    </a>
  `).join('');

  return `<!DOCTYPE html>
<html lang="en" class="scroll-smooth">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Videos | Blaze Intelligence</title>
    <meta name="description" content="Watch how Blaze Intelligence communicates complex sports analytics through different registers - coach/player, executive, and sponsorship.">
    <link rel="canonical" href="https://blaze-intelligence.com/videos/">
    <meta name="robots" content="index, follow">
    <meta name="author" content="Austin Humphrey">
    
    <!-- Open Graph -->
    <meta property="og:title" content="Videos | Blaze Intelligence">
    <meta property="og:description" content="Professional sports analytics communication demonstrations">
    <meta property="og:type" content="website">
    <meta property="og:url" content="https://blaze-intelligence.com/videos/">
    <meta property="og:site_name" content="Blaze Intelligence">
    
    <!-- Twitter Card -->
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:site" content="@BISportsIntel">
    <meta name="twitter:title" content="Videos | Blaze Intelligence">
    <meta name="twitter:description" content="Professional sports analytics communication demonstrations">
    
    <!-- Performance Optimizations -->
    <link rel="preconnect" href="https://cdn.tailwindcss.com">
    <link rel="preconnect" href="https://unpkg.com">
    <link rel="preconnect" href="https://videodelivery.net">
    <link rel="dns-prefetch" href="https://iframe.videodelivery.net">
    
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        tailwind.config = {
            theme: {
                extend: {
                    colors: {
                        'neon': {
                            'blue': '#00FFFF',
                            'green': '#00FF00', 
                            'orange': '#FF8C00'
                        }
                    }
                }
            }
        }
    </script>
    
    <!-- Lucide Icons -->
    <script src="https://unpkg.com/lucide@latest/dist/umd/lucide.js"></script>

    <style>
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: #0a0a0a;
            color: #e2e8f0;
        }

        .glass-card {
            background: rgba(30, 41, 59, 0.9);
            backdrop-filter: blur(15px);
            border: 1px solid rgba(255, 255, 255, 0.1);
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            border-radius: 1rem;
            transition: all 0.3s ease;
        }

        .glass-card:hover {
            transform: translateY(-4px);
            box-shadow: 0 12px 48px rgba(0, 0, 0, 0.4);
            border-color: rgba(255, 140, 0, 0.3);
        }

        .neon-text {
            color: #00FFFF;
            text-shadow: 0 0 4px currentColor;
        }

        .text-gradient {
            background: linear-gradient(135deg, #FF8C00 0%, #D2691E 50%, #A0522D 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }

        .line-clamp-3 {
            overflow: hidden;
            display: -webkit-box;
            -webkit-line-clamp: 3;
            -webkit-box-orient: vertical;
        }
    </style>
</head>
<body class="bg-gray-900">
    <nav class="bg-black/95 backdrop-blur-xl border-b border-gray-800 px-4 py-4">
        <div class="max-w-7xl mx-auto flex items-center justify-between">
            <a href="/" class="text-2xl font-bold neon-text">BLAZE INTELLIGENCE</a>
            <div class="flex gap-6">
                <a href="/" class="text-slate-300 hover:text-white transition-colors">Home</a>
                <a href="/videos/" class="text-white font-semibold">Videos</a>
                <a href="/roi-calculator.html" class="text-slate-300 hover:text-white transition-colors">ROI Calculator</a>
                <a href="/methods.html" class="text-slate-300 hover:text-white transition-colors">Methods</a>
                <a href="/contact.html" class="text-slate-300 hover:text-white transition-colors">Contact</a>
            </div>
        </div>
    </nav>

    <main class="max-w-7xl mx-auto px-4 py-12">
        <div class="text-center mb-16">
            <h1 class="text-5xl md:text-6xl font-bold text-gradient mb-6">VIDEO LIBRARY</h1>
            <p class="text-xl text-slate-400 max-w-3xl mx-auto">
                See how we communicate complex sports analytics through different registers - 
                from coach/player dialogues to executive briefings and sponsorship proposals.
            </p>
        </div>

        <div class="grid lg:grid-cols-3 gap-8 mb-16">
            ${videoCards}
        </div>

        <!-- Key Insights Section -->
        <section class="bg-gradient-to-r from-slate-800/50 to-slate-900/50 rounded-2xl p-8 border border-slate-700">
            <h2 class="text-3xl font-bold mb-6 text-center neon-text">What You'll Learn</h2>
            <div class="grid md:grid-cols-3 gap-8">
                <div class="text-center">
                    <div class="w-16 h-16 mx-auto mb-4 bg-orange-500/20 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold mb-2 text-white">Multiple Registers</h3>
                    <p class="text-slate-400">
                        Adapt communication style from technical analytics to player coaching to executive briefings
                    </p>
                </div>
                <div class="text-center">
                    <div class="w-16 h-16 mx-auto mb-4 bg-blue-500/20 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold mb-2 text-white">Precision Framing</h3>
                    <p class="text-slate-400">
                        Structure complex data into actionable insights without oversimplification or hype
                    </p>
                </div>
                <div class="text-center">
                    <div class="w-16 h-16 mx-auto mb-4 bg-green-500/20 rounded-full flex items-center justify-center">
                        <svg class="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"></path>
                        </svg>
                    </div>
                    <h3 class="text-xl font-bold mb-2 text-white">ROI Logic</h3>
                    <p class="text-slate-400">
                        Quantify impact responsibly with clear thresholds, kill-criteria, and measurement plans
                    </p>
                </div>
            </div>
        </section>
    </main>

    <footer class="py-12 bg-black/50 border-t border-slate-800 mt-16">
        <div class="max-w-7xl mx-auto px-4 text-center">
            <div class="text-2xl font-bold neon-text mb-2">BLAZE INTELLIGENCE</div>
            <div class="text-slate-400">Where cognitive performance meets quarterly performance.</div>
        </div>
    </footer>

    <!-- Analytics -->
    <script src="/assets/js/analytics.js"></script>
    
    <script>
        // Initialize icons
        document.addEventListener('DOMContentLoaded', function() {
            if (window.lucide) lucide.createIcons();
        });
    </script>
</body>
</html>`;
}

// Main build function
async function buildVideos() {
  try {
    console.log('🎬 Building video pages from data/videos.json...');
    
    // Load data
    const { videos } = await loadVideoData();
    
    // Validate required fields
    for (const video of videos) {
      const required = ['slug', 'videoId', 'hlsUrl', 'title', 'description', 'thumbnail', 'chapters'];
      for (const field of required) {
        if (!video[field]) {
          throw new Error(`Missing required field "${field}" for video: ${video.slug || 'unknown'}`);
        }
      }
    }
    
    // Create directories
    await fs.mkdir(path.join(ROOT, 'videos'), { recursive: true });
    
    // Generate individual video pages
    for (const video of videos) {
      const videoDir = path.join(ROOT, 'videos', video.slug);
      await fs.mkdir(videoDir, { recursive: true });
      
      const html = generateVideoDetailPage(video, videos);
      await fs.writeFile(path.join(videoDir, 'index.html'), html);
      console.log(`  ✅ Generated: /videos/${video.slug}/`);
    }
    
    // Generate hub page
    const hubHtml = generateVideoHubPage(videos);
    await fs.writeFile(path.join(ROOT, 'videos', 'index.html'), hubHtml);
    console.log('  ✅ Generated: /videos/index.html');
    
    console.log(`\n✨ Successfully generated ${videos.length + 1} video pages!`);
    
  } catch (error) {
    console.error('❌ Build failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildVideos();
}