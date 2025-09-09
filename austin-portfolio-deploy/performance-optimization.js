#!/usr/bin/env node

/**
 * Blaze Intelligence Performance Optimization Suite
 * Professional production-level optimizations
 */

import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { minify } from 'terser';
import CleanCSS from 'clean-css';
import imagemin from 'imagemin';
import imageminPngquant from 'imagemin-pngquant';
import imageminMozjpeg from 'imagemin-mozjpeg';
import sharp from 'sharp';

// Configuration
const CONFIG = {
    paths: {
        src: process.cwd(),
        dist: path.join(process.cwd(), 'dist'),
        cache: path.join(process.cwd(), '.cache')
    },
    performance: {
        targetLCP: 2500,    // 2.5s
        targetFID: 100,     // 100ms
        targetCLS: 0.1,     // 0.1
        targetTTFB: 200,    // 200ms
        bundleSizeLimit: 200000  // 200KB per bundle
    },
    optimization: {
        minifyJS: true,
        minifyCSS: true,
        optimizeImages: true,
        generateWebP: true,
        lazyLoading: true,
        criticalCSS: true,
        preconnect: true,
        resourceHints: true
    }
};

/**
 * Generate asset manifest with hashes
 */
function generateAssetManifest() {
    const manifest = {
        version: '2.0.0',
        timestamp: new Date().toISOString(),
        assets: {}
    };
    
    const files = [
        'js/team-intelligence-dashboard.js',
        'js/competitive-intelligence-system.js',
        'js/client-onboarding-automation.js',
        'css/team-intelligence.css',
        'css/styles.css'
    ];
    
    files.forEach(file => {
        const filePath = path.join(CONFIG.paths.src, file);
        if (fs.existsSync(filePath)) {
            const content = fs.readFileSync(filePath);
            const hash = crypto.createHash('md5').update(content).digest('hex').substring(0, 8);
            manifest.assets[file] = {
                hash,
                size: content.length,
                url: `/${file}?v=${hash}`
            };
        }
    });
    
    fs.writeFileSync(
        path.join(CONFIG.paths.src, 'asset-manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    
    console.log('✅ Asset manifest generated');
    return manifest;
}

/**
 * Minify JavaScript files
 */
async function minifyJavaScript() {
    const jsDir = path.join(CONFIG.paths.src, 'js');
    if (!fs.existsSync(jsDir)) return;
    
    const files = fs.readdirSync(jsDir).filter(f => f.endsWith('.js'));
    let totalSaved = 0;
    
    for (const file of files) {
        const filePath = path.join(jsDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        
        try {
            const result = await minify(content, {
                compress: {
                    dead_code: true,
                    drop_console: false, // Keep console for debugging
                    drop_debugger: true,
                    passes: 2
                },
                mangle: {
                    toplevel: true,
                    reserved: ['BlazeIntelligence', 'CONFIG']
                },
                format: {
                    comments: false
                }
            });
            
            if (result.code) {
                const originalSize = content.length;
                const minifiedSize = result.code.length;
                const saved = originalSize - minifiedSize;
                totalSaved += saved;
                
                // Save minified version
                const minPath = path.join(jsDir, file.replace('.js', '.min.js'));
                fs.writeFileSync(minPath, result.code);
                
                console.log(`  📦 ${file}: ${(saved / 1024).toFixed(2)}KB saved`);
            }
        } catch (error) {
            console.error(`  ❌ Error minifying ${file}:`, error.message);
        }
    }
    
    console.log(`✅ JavaScript minification complete: ${(totalSaved / 1024).toFixed(2)}KB saved`);
}

/**
 * Minify CSS files
 */
function minifyCSS() {
    const cssDir = path.join(CONFIG.paths.src, 'css');
    if (!fs.existsSync(cssDir)) {
        fs.mkdirSync(cssDir, { recursive: true });
    }
    
    const files = fs.readdirSync(cssDir).filter(f => f.endsWith('.css'));
    const cleanCSS = new CleanCSS({ level: 2 });
    let totalSaved = 0;
    
    files.forEach(file => {
        const filePath = path.join(cssDir, file);
        const content = fs.readFileSync(filePath, 'utf-8');
        const result = cleanCSS.minify(content);
        
        if (result.styles) {
            const originalSize = content.length;
            const minifiedSize = result.styles.length;
            const saved = originalSize - minifiedSize;
            totalSaved += saved;
            
            // Save minified version
            const minPath = path.join(cssDir, file.replace('.css', '.min.css'));
            fs.writeFileSync(minPath, result.styles);
            
            console.log(`  📦 ${file}: ${(saved / 1024).toFixed(2)}KB saved`);
        }
    });
    
    console.log(`✅ CSS minification complete: ${(totalSaved / 1024).toFixed(2)}KB saved`);
}

/**
 * Generate critical CSS for above-the-fold content
 */
function generateCriticalCSS() {
    const criticalCSS = `
/* Critical CSS for Blaze Intelligence */
:root {
    --primary: #BF5700;
    --secondary: #FF8C00;
    --dark: #0d0d0d;
    --light: #ffffff;
    --gray: #999;
}

* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
    background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
    color: #fff;
    line-height: 1.6;
}

.header {
    background: rgba(13, 13, 13, 0.95);
    backdrop-filter: blur(10px);
    padding: 20px;
    border-bottom: 2px solid #BF5700;
    position: sticky;
    top: 0;
    z-index: 1000;
}

.hero {
    min-height: 60vh;
    display: flex;
    align-items: center;
    justify-content: center;
    text-align: center;
    padding: 40px 20px;
}

.loading {
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 60px;
    height: 60px;
    border: 3px solid #333;
    border-top-color: #BF5700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}

/* Performance optimizations */
img {
    content-visibility: auto;
    contain-intrinsic-size: 512px;
}

.lazy {
    opacity: 0;
    transition: opacity 0.3s;
}

.lazy.loaded {
    opacity: 1;
}`;

    // Save critical CSS
    fs.writeFileSync(
        path.join(CONFIG.paths.src, 'critical.css'),
        criticalCSS.trim()
    );
    
    console.log('✅ Critical CSS generated');
}

/**
 * Optimize images
 */
async function optimizeImages() {
    const imgDir = path.join(CONFIG.paths.src, 'images');
    if (!fs.existsSync(imgDir)) {
        fs.mkdirSync(imgDir, { recursive: true });
        console.log('📁 Created images directory');
        return;
    }
    
    try {
        // Optimize existing images
        const files = await imagemin([`${imgDir}/*.{jpg,png}`], {
            destination: path.join(imgDir, 'optimized'),
            plugins: [
                imageminMozjpeg({ quality: 85 }),
                imageminPngquant({ quality: [0.6, 0.8] })
            ]
        });
        
        console.log(`✅ Optimized ${files.length} images`);
        
        // Generate WebP versions
        const imageFiles = fs.readdirSync(imgDir).filter(f => 
            f.endsWith('.jpg') || f.endsWith('.png')
        );
        
        for (const file of imageFiles) {
            const inputPath = path.join(imgDir, file);
            const outputPath = path.join(imgDir, file.replace(/\.(jpg|png)$/, '.webp'));
            
            await sharp(inputPath)
                .webp({ quality: 85 })
                .toFile(outputPath);
            
            console.log(`  🖼️ Generated WebP: ${file}`);
        }
        
    } catch (error) {
        console.log('ℹ️ Image optimization skipped (no images found or dependencies missing)');
    }
}

/**
 * Generate service worker for PWA
 */
function generateServiceWorker() {
    const swContent = `
// Blaze Intelligence Service Worker v2.0.0
const CACHE_NAME = 'blaze-intelligence-v2';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/styles.css',
    '/css/team-intelligence.css',
    '/js/team-intelligence-dashboard.js',
    '/data/team-intelligence.json',
    '/data/dashboard-config.json'
];

// Install event
self.addEventListener('install', event => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// Fetch event
self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
            .then(response => {
                // Cache hit - return response
                if (response) {
                    return response;
                }
                
                // Clone the request
                const fetchRequest = event.request.clone();
                
                return fetch(fetchRequest).then(response => {
                    // Check if valid response
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // Clone the response
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then(cache => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
    );
});

// Activate event
self.addEventListener('activate', event => {
    const cacheWhitelist = [CACHE_NAME];
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => {
                    if (cacheWhitelist.indexOf(cacheName) === -1) {
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// Background sync for offline submissions
self.addEventListener('sync', event => {
    if (event.tag === 'sync-analytics') {
        event.waitUntil(syncAnalytics());
    }
});

async function syncAnalytics() {
    try {
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ timestamp: Date.now() })
        });
        return response;
    } catch (error) {
        console.error('Sync failed:', error);
    }
}`;

    fs.writeFileSync(
        path.join(CONFIG.paths.src, 'sw.js'),
        swContent.trim()
    );
    
    console.log('✅ Service Worker generated');
}

/**
 * Generate PWA manifest
 */
function generatePWAManifest() {
    const manifest = {
        name: 'Blaze Intelligence - Championship Sports Analytics',
        short_name: 'Blaze Intel',
        description: 'AI-powered sports intelligence platform with 94.6% accuracy',
        start_url: '/',
        display: 'standalone',
        background_color: '#0d0d0d',
        theme_color: '#BF5700',
        orientation: 'portrait-primary',
        icons: [
            {
                src: '/icons/icon-72x72.png',
                sizes: '72x72',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: '/icons/icon-96x96.png',
                sizes: '96x96',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: '/icons/icon-128x128.png',
                sizes: '128x128',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: '/icons/icon-144x144.png',
                sizes: '144x144',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: '/icons/icon-152x152.png',
                sizes: '152x152',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: '/icons/icon-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: '/icons/icon-384x384.png',
                sizes: '384x384',
                type: 'image/png',
                purpose: 'any maskable'
            },
            {
                src: '/icons/icon-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
            }
        ],
        categories: ['sports', 'productivity', 'business'],
        screenshots: [
            {
                src: '/screenshots/dashboard.png',
                sizes: '1280x720',
                type: 'image/png',
                label: 'Dashboard'
            },
            {
                src: '/screenshots/coach.png',
                sizes: '1280x720',
                type: 'image/png',
                label: 'Neural Coach'
            }
        ],
        shortcuts: [
            {
                name: 'Dashboard',
                url: '/',
                icons: [{ src: '/icons/dashboard.png', sizes: '96x96' }]
            },
            {
                name: 'Neural Coach',
                url: '/coach-enhanced.html',
                icons: [{ src: '/icons/coach.png', sizes: '96x96' }]
            },
            {
                name: 'Teams',
                url: '/teams',
                icons: [{ src: '/icons/teams.png', sizes: '96x96' }]
            }
        ],
        prefer_related_applications: false,
        related_applications: []
    };
    
    fs.writeFileSync(
        path.join(CONFIG.paths.src, 'manifest.json'),
        JSON.stringify(manifest, null, 2)
    );
    
    console.log('✅ PWA manifest generated');
}

/**
 * Generate security headers
 */
function generateSecurityHeaders() {
    const headers = `
# Security Headers for Blaze Intelligence
# Add these to your server configuration or Cloudflare Workers

Content-Security-Policy: default-src 'self'; script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net https://api.openai.com https://api.anthropic.com https://generativelanguage.googleapis.com; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://statsapi.mlb.com https://site.api.espn.com https://stats.nba.com wss://blaze-intelligence.com; frame-ancestors 'none'; base-uri 'self'; form-action 'self'

X-Frame-Options: DENY
X-Content-Type-Options: nosniff
X-XSS-Protection: 1; mode=block
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(self), microphone=(self), geolocation=(), payment=()
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload

# Cache Control Headers
Cache-Control: public, max-age=31536000, immutable # For static assets
Cache-Control: no-cache, no-store, must-revalidate # For dynamic content
`;

    fs.writeFileSync(
        path.join(CONFIG.paths.src, 'security-headers.txt'),
        headers.trim()
    );
    
    console.log('✅ Security headers generated');
}

/**
 * Generate performance monitoring script
 */
function generatePerformanceMonitoring() {
    const monitoringScript = `
// Blaze Intelligence Performance Monitoring
(function() {
    'use strict';
    
    // Configuration
    const CONFIG = {
        sampleRate: 1.0, // 100% sampling
        endpoint: '/api/metrics',
        bufferSize: 10,
        flushInterval: 5000
    };
    
    // Metrics buffer
    const metricsBuffer = [];
    
    // Core Web Vitals
    function measureWebVitals() {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            recordMetric('LCP', lastEntry.renderTime || lastEntry.loadTime);
        }).observe({ type: 'largest-contentful-paint', buffered: true });
        
        // First Input Delay (FID)
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                recordMetric('FID', entry.processingStart - entry.startTime);
            });
        }).observe({ type: 'first-input', buffered: true });
        
        // Cumulative Layout Shift (CLS)
        let clsValue = 0;
        let clsEntries = [];
        const sessionValue = 0;
        const sessionEntries = [];
        
        new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (!entry.hadRecentInput) {
                    const firstSessionEntry = sessionEntries[0];
                    const lastSessionEntry = sessionEntries[sessionEntries.length - 1];
                    
                    if (sessionValue && 
                        entry.startTime - lastSessionEntry.startTime < 1000 &&
                        entry.startTime - firstSessionEntry.startTime < 5000) {
                        sessionValue += entry.value;
                        sessionEntries.push(entry);
                    } else {
                        sessionValue = entry.value;
                        sessionEntries = [entry];
                    }
                    
                    if (sessionValue > clsValue) {
                        clsValue = sessionValue;
                        clsEntries = sessionEntries;
                        recordMetric('CLS', clsValue);
                    }
                }
            }
        }).observe({ type: 'layout-shift', buffered: true });
        
        // Time to First Byte (TTFB)
        const navigationEntry = performance.getEntriesByType('navigation')[0];
        if (navigationEntry) {
            recordMetric('TTFB', navigationEntry.responseStart - navigationEntry.fetchStart);
        }
    }
    
    // Record metric
    function recordMetric(name, value) {
        const metric = {
            name,
            value: Math.round(value),
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            connection: navigator.connection ? {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt
            } : null
        };
        
        metricsBuffer.push(metric);
        
        // Check thresholds
        checkThresholds(name, value);
        
        // Flush if buffer is full
        if (metricsBuffer.length >= CONFIG.bufferSize) {
            flushMetrics();
        }
    }
    
    // Check performance thresholds
    function checkThresholds(name, value) {
        const thresholds = {
            LCP: { good: 2500, needs_improvement: 4000 },
            FID: { good: 100, needs_improvement: 300 },
            CLS: { good: 0.1, needs_improvement: 0.25 },
            TTFB: { good: 200, needs_improvement: 500 }
        };
        
        const threshold = thresholds[name];
        if (threshold) {
            let rating = 'good';
            if (value > threshold.needs_improvement) {
                rating = 'poor';
            } else if (value > threshold.good) {
                rating = 'needs-improvement';
            }
            
            console.log(\`📊 \${name}: \${value}ms [\${rating}]\`);
            
            // Trigger alert for poor performance
            if (rating === 'poor') {
                console.warn(\`⚠️ Poor \${name} performance detected: \${value}ms\`);
            }
        }
    }
    
    // Send metrics to server
    function flushMetrics() {
        if (metricsBuffer.length === 0) return;
        
        const metrics = [...metricsBuffer];
        metricsBuffer.length = 0;
        
        // Use sendBeacon for reliability
        if (navigator.sendBeacon) {
            const data = JSON.stringify({
                metrics,
                session: {
                    id: getSessionId(),
                    timestamp: Date.now()
                }
            });
            
            navigator.sendBeacon(CONFIG.endpoint, data);
        } else {
            // Fallback to fetch
            fetch(CONFIG.endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ metrics }),
                keepalive: true
            }).catch(console.error);
        }
    }
    
    // Get or create session ID
    function getSessionId() {
        let sessionId = sessionStorage.getItem('blaze_session_id');
        if (!sessionId) {
            sessionId = Math.random().toString(36).substring(2, 15);
            sessionStorage.setItem('blaze_session_id', sessionId);
        }
        return sessionId;
    }
    
    // Resource timing
    function measureResources() {
        const resources = performance.getEntriesByType('resource');
        const summary = {
            total: resources.length,
            totalSize: 0,
            totalDuration: 0,
            byType: {}
        };
        
        resources.forEach(resource => {
            const type = resource.initiatorType;
            if (!summary.byType[type]) {
                summary.byType[type] = { count: 0, duration: 0 };
            }
            summary.byType[type].count++;
            summary.byType[type].duration += resource.duration;
            summary.totalDuration += resource.duration;
        });
        
        recordMetric('resources', summary);
    }
    
    // Initialize monitoring
    function init() {
        // Only run if sample rate allows
        if (Math.random() > CONFIG.sampleRate) return;
        
        // Start measuring
        measureWebVitals();
        
        // Measure resources after load
        if (document.readyState === 'complete') {
            measureResources();
        } else {
            window.addEventListener('load', measureResources);
        }
        
        // Set up periodic flush
        setInterval(flushMetrics, CONFIG.flushInterval);
        
        // Flush on page unload
        window.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'hidden') {
                flushMetrics();
            }
        });
        
        console.log('🔥 Blaze Intelligence Performance Monitoring Active');
    }
    
    // Start monitoring
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();`;

    fs.writeFileSync(
        path.join(CONFIG.paths.src, 'performance-monitoring.js'),
        monitoringScript.trim()
    );
    
    console.log('✅ Performance monitoring script generated');
}

/**
 * Generate robots.txt and sitemap
 */
function generateSEOFiles() {
    // Robots.txt
    const robotsTxt = `# Blaze Intelligence Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /.cache/
Disallow: /private/

# Sitemaps
Sitemap: https://blaze-intelligence.com/sitemap.xml
Sitemap: https://blaze-intelligence.com/sitemap-teams.xml

# Crawl-delay
Crawl-delay: 1

# AI Crawlers
User-agent: GPTBot
Allow: /

User-agent: ChatGPT-User
Allow: /

User-agent: Claude-Web
Allow: /`;

    fs.writeFileSync(
        path.join(CONFIG.paths.src, 'robots.txt'),
        robotsTxt.trim()
    );
    
    // Sitemap
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
    <url>
        <loc>https://blaze-intelligence.com/</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>1.0</priority>
    </url>
    <url>
        <loc>https://blaze-intelligence.com/coach-enhanced.html</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>weekly</changefreq>
        <priority>0.9</priority>
    </url>
    <url>
        <loc>https://blaze-intelligence.com/teams/st.-louis-cardinals.html</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://blaze-intelligence.com/teams/tennessee-titans.html</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://blaze-intelligence.com/teams/texas-longhorns.html</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://blaze-intelligence.com/teams/memphis-grizzlies.html</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>daily</changefreq>
        <priority>0.8</priority>
    </url>
    <url>
        <loc>https://blaze-intelligence.com/pricing.html</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.7</priority>
    </url>
    <url>
        <loc>https://blaze-intelligence.com/contact.html</loc>
        <lastmod>${new Date().toISOString()}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>0.6</priority>
    </url>
</urlset>`;

    fs.writeFileSync(
        path.join(CONFIG.paths.src, 'sitemap.xml'),
        sitemap.trim()
    );
    
    console.log('✅ SEO files generated');
}

/**
 * Main optimization function
 */
async function main() {
    console.log('🚀 Blaze Intelligence Performance Optimization Suite');
    console.log('===================================================\n');
    
    try {
        // Generate manifests and configs
        console.log('📋 Generating manifests...');
        generateAssetManifest();
        generatePWAManifest();
        
        // Minification
        console.log('\n📦 Minifying assets...');
        await minifyJavaScript();
        minifyCSS();
        
        // Critical CSS
        console.log('\n🎨 Generating critical CSS...');
        generateCriticalCSS();
        
        // Images
        console.log('\n🖼️ Optimizing images...');
        await optimizeImages();
        
        // PWA
        console.log('\n📱 Setting up PWA...');
        generateServiceWorker();
        
        // Security
        console.log('\n🔒 Configuring security...');
        generateSecurityHeaders();
        
        // Monitoring
        console.log('\n📊 Setting up monitoring...');
        generatePerformanceMonitoring();
        
        // SEO
        console.log('\n🔍 Generating SEO files...');
        generateSEOFiles();
        
        // Summary
        console.log('\n✨ Optimization Complete!');
        console.log('========================');
        console.log('✅ Assets minified and optimized');
        console.log('✅ PWA capabilities added');
        console.log('✅ Security headers configured');
        console.log('✅ Performance monitoring active');
        console.log('✅ SEO files generated');
        console.log('\n🎯 Target Performance Metrics:');
        console.log(`   LCP: <${CONFIG.performance.targetLCP}ms`);
        console.log(`   FID: <${CONFIG.performance.targetFID}ms`);
        console.log(`   CLS: <${CONFIG.performance.targetCLS}`);
        console.log(`   TTFB: <${CONFIG.performance.targetTTFB}ms`);
        
    } catch (error) {
        console.error('❌ Optimization error:', error);
        process.exit(1);
    }
}

// Execute if run directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    main();
}

export { generateAssetManifest, minifyJavaScript, minifyCSS, generateCriticalCSS };