#!/usr/bin/env node

/**
 * Blaze Intelligence PWA Asset Generator
 * Creates all required icons and splash screens
 */

import fs from 'fs';
import path from 'path';

// Icon sizes required for PWA
const ICON_SIZES = [
    48, 72, 96, 128, 144, 152, 192, 256, 384, 512, 1024
];

// Splash screen sizes for iOS
const SPLASH_SIZES = [
    { width: 640, height: 1136, name: 'splash-640x1136.png' },    // iPhone 5
    { width: 750, height: 1334, name: 'splash-750x1334.png' },    // iPhone 6/7/8
    { width: 828, height: 1792, name: 'splash-828x1792.png' },    // iPhone 11/XR
    { width: 1125, height: 2436, name: 'splash-1125x2436.png' },  // iPhone X/XS
    { width: 1242, height: 2688, name: 'splash-1242x2688.png' },  // iPhone XS Max
    { width: 1536, height: 2048, name: 'splash-1536x2048.png' },  // iPad
    { width: 1668, height: 2388, name: 'splash-1668x2388.png' },  // iPad Pro 11"
    { width: 2048, height: 2732, name: 'splash-2048x2732.png' }   // iPad Pro 12.9"
];

/**
 * Generate SVG icon
 */
function generateSVGIcon() {
    const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="512" height="512" viewBox="0 0 512 512" xmlns="http://www.w3.org/2000/svg">
    <!-- Background -->
    <rect width="512" height="512" fill="#0d0d0d"/>
    
    <!-- Gradient Definition -->
    <defs>
        <linearGradient id="blazeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#BF5700;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#FF8C00;stop-opacity:1" />
        </linearGradient>
        
        <filter id="glow">
            <feGaussianBlur stdDeviation="4" result="coloredBlur"/>
            <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
            </feMerge>
        </filter>
    </defs>
    
    <!-- Flame Icon -->
    <g transform="translate(256, 256)">
        <!-- Outer Flame -->
        <path d="M 0,-140 C -40,-120 -60,-80 -60,-40 C -60,20 -30,60 0,80 C 30,60 60,20 60,-40 C 60,-80 40,-120 0,-140 Z" 
              fill="url(#blazeGradient)" 
              opacity="0.8"
              filter="url(#glow)"/>
        
        <!-- Inner Flame -->
        <path d="M 0,-100 C -25,-85 -40,-55 -40,-25 C -40,10 -20,35 0,50 C 20,35 40,10 40,-25 C 40,-55 25,-85 0,-100 Z" 
              fill="#FF8C00" 
              opacity="0.9"/>
        
        <!-- Core -->
        <circle cx="0" cy="-10" r="25" fill="#FFEB3B" opacity="0.9"/>
    </g>
    
    <!-- Text -->
    <text x="256" y="420" font-family="Arial, sans-serif" font-size="48" font-weight="bold" 
          text-anchor="middle" fill="url(#blazeGradient)">BLAZE</text>
    
    <!-- Subtext -->
    <text x="256" y="460" font-family="Arial, sans-serif" font-size="24" 
          text-anchor="middle" fill="#999">INTELLIGENCE</text>
</svg>`;
    
    return svg;
}

/**
 * Generate HTML for icon creation
 */
function generateIconHTML(size) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 0;
            width: ${size}px;
            height: ${size}px;
            background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .icon {
            width: ${size * 0.6}px;
            height: ${size * 0.6}px;
            position: relative;
        }
        .flame {
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, #BF5700, #FF8C00);
            clip-path: polygon(50% 0%, 20% 40%, 30% 80%, 50% 100%, 70% 80%, 80% 40%);
            filter: drop-shadow(0 0 ${size * 0.02}px rgba(255, 140, 0, 0.5));
        }
        .text {
            position: absolute;
            bottom: -${size * 0.15}px;
            left: 50%;
            transform: translateX(-50%);
            color: #BF5700;
            font-size: ${size * 0.12}px;
            font-weight: bold;
            letter-spacing: ${size * 0.01}px;
        }
    </style>
</head>
<body>
    <div class="icon">
        <div class="flame"></div>
        ${size >= 128 ? '<div class="text">BLAZE</div>' : ''}
    </div>
</body>
</html>`;
}

/**
 * Generate splash screen HTML
 */
function generateSplashHTML(width, height) {
    return `<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {
            margin: 0;
            padding: 0;
            width: ${width}px;
            height: ${height}px;
            background: linear-gradient(135deg, #0d0d0d 0%, #1a1a1a 100%);
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
        }
        .logo {
            width: ${Math.min(width, height) * 0.3}px;
            height: ${Math.min(width, height) * 0.3}px;
            background: linear-gradient(135deg, #BF5700, #FF8C00);
            clip-path: polygon(50% 0%, 20% 40%, 30% 80%, 50% 100%, 70% 80%, 80% 40%);
            filter: drop-shadow(0 0 20px rgba(255, 140, 0, 0.5));
            margin-bottom: 40px;
        }
        .title {
            font-size: ${Math.min(width, height) * 0.08}px;
            font-weight: bold;
            background: linear-gradient(135deg, #BF5700, #FF8C00);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            margin-bottom: 10px;
        }
        .subtitle {
            font-size: ${Math.min(width, height) * 0.04}px;
            color: #999;
            margin-bottom: 40px;
        }
        .loading {
            width: ${Math.min(width, height) * 0.2}px;
            height: 4px;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 2px;
            overflow: hidden;
        }
        .loading-bar {
            height: 100%;
            background: linear-gradient(90deg, #BF5700, #FF8C00);
            animation: loading 2s ease-in-out infinite;
        }
        @keyframes loading {
            0% { width: 0; }
            50% { width: 100%; }
            100% { width: 0; }
        }
    </style>
</head>
<body>
    <div class="logo"></div>
    <div class="title">BLAZE INTELLIGENCE</div>
    <div class="subtitle">Championship Sports Analytics</div>
    <div class="loading">
        <div class="loading-bar"></div>
    </div>
</body>
</html>`;
}

/**
 * Create directories
 */
function createDirectories() {
    const dirs = ['icons', 'icons/shortcuts', 'screenshots'];
    
    dirs.forEach(dir => {
        const fullPath = path.join(process.cwd(), dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
            console.log(`📁 Created directory: ${dir}`);
        }
    });
}

/**
 * Generate all assets
 */
async function generateAssets() {
    console.log('🔥 Blaze Intelligence PWA Asset Generator');
    console.log('=========================================\n');
    
    // Create directories
    createDirectories();
    
    // Generate main SVG icon
    const svgIcon = generateSVGIcon();
    fs.writeFileSync(path.join(process.cwd(), 'icons', 'icon.svg'), svgIcon);
    console.log('✅ Generated SVG icon');
    
    // Generate PNG icons
    console.log('\n📱 Generating PNG icons...');
    ICON_SIZES.forEach(size => {
        const html = generateIconHTML(size);
        const filename = `icon-${size}x${size}.html`;
        fs.writeFileSync(path.join(process.cwd(), 'icons', filename), html);
        console.log(`  ✅ Created ${size}x${size} icon template`);
    });
    
    // Generate splash screens
    console.log('\n🖼️ Generating splash screens...');
    SPLASH_SIZES.forEach(({ width, height, name }) => {
        const html = generateSplashHTML(width, height);
        const filename = name.replace('.png', '.html');
        fs.writeFileSync(path.join(process.cwd(), 'screenshots', filename), html);
        console.log(`  ✅ Created ${width}x${height} splash template`);
    });
    
    // Generate shortcut icons
    console.log('\n⚡ Generating shortcut icons...');
    const shortcuts = ['dashboard', 'coach', 'cardinals', 'command'];
    shortcuts.forEach(shortcut => {
        const html = generateIconHTML(96);
        const filename = `${shortcut}-96x96.html`;
        fs.writeFileSync(path.join(process.cwd(), 'icons', 'shortcuts', filename), html);
        console.log(`  ✅ Created ${shortcut} shortcut icon`);
    });
    
    // Instructions for conversion
    console.log('\n📝 Conversion Instructions:');
    console.log('===========================');
    console.log('1. Open each HTML file in a browser');
    console.log('2. Take a screenshot of the exact dimensions');
    console.log('3. Save as PNG with the same name');
    console.log('4. Or use a headless browser tool like Puppeteer');
    console.log('\nAlternatively, use this command with Puppeteer:');
    console.log('npx capture-website-cli icons/*.html --output=icons --type=png');
    
    console.log('\n✨ Asset generation complete!');
}

// Execute
generateAssets().catch(console.error);