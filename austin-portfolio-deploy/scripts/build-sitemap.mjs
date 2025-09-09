#!/usr/bin/env node

/**
 * Blaze Intelligence Sitemap Generator
 * Generates sitemap.xml including all video pages
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT = path.resolve(__dirname, '..');

const DOMAIN = 'https://blaze-intelligence.com';

// Priority mapping
const PRIORITY_MAP = {
  '/': 1.0,
  '/videos/': 0.9,
  '/roi-calculator.html': 0.9,
  '/contact.html': 0.8,
  '/methods.html': 0.7,
  '/about.html': 0.7,
  '/dashboard.html': 0.8,
  '/pricing.html': 0.8,
  '/blog/': 0.7
};

// Load video data
async function loadVideoData() {
  try {
    const dataPath = path.join(ROOT, 'data', 'videos.json');
    const data = await fs.readFile(dataPath, 'utf-8');
    return JSON.parse(data);
  } catch (err) {
    console.warn('Warning: Could not load videos.json:', err.message);
    return { videos: [] };
  }
}

// Get all HTML files
async function getHtmlFiles(dir, baseDir = dir) {
  const files = [];
  const items = await fs.readdir(dir, { withFileTypes: true });
  
  for (const item of items) {
    const fullPath = path.join(dir, item.name);
    
    if (item.isDirectory()) {
      // Skip certain directories
      if (['node_modules', '.git', 'scripts', 'functions', 'worker-src'].includes(item.name)) {
        continue;
      }
      files.push(...await getHtmlFiles(fullPath, baseDir));
    } else if (item.name.endsWith('.html')) {
      const relativePath = path.relative(baseDir, fullPath);
      files.push(relativePath);
    }
  }
  
  return files;
}

// Convert file path to URL
function fileToUrl(file) {
  // Remove .html extension for clean URLs
  let url = file.replace(/\\/g, '/');
  
  if (url === 'index.html') {
    return '/';
  }
  
  if (url.endsWith('/index.html')) {
    return '/' + url.replace('/index.html', '/');
  }
  
  return '/' + url;
}

// Get priority for a URL
function getPriority(url) {
  // Check exact match
  if (PRIORITY_MAP[url]) {
    return PRIORITY_MAP[url];
  }
  
  // Video pages
  if (url.startsWith('/videos/') && url !== '/videos/') {
    return 0.8;
  }
  
  // Transcript pages
  if (url.startsWith('/transcripts/')) {
    return 0.6;
  }
  
  // Blog posts
  if (url.startsWith('/blog/') && url !== '/blog/') {
    return 0.6;
  }
  
  // Default
  return 0.5;
}

// Generate sitemap XML
function generateSitemap(urls) {
  const today = new Date().toISOString().split('T')[0];
  
  const urlEntries = urls.map(url => {
    const priority = getPriority(url);
    const changefreq = priority >= 0.8 ? 'weekly' : priority >= 0.6 ? 'monthly' : 'yearly';
    
    return `  <url>
    <loc>${DOMAIN}${url}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${changefreq}</changefreq>
    <priority>${priority.toFixed(1)}</priority>
  </url>`;
  }).join('\n');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1">
${urlEntries}
</urlset>`;
}

// Main build function
async function buildSitemap() {
  try {
    console.log('🗺️  Building sitemap...');
    
    // Get all HTML files
    const htmlFiles = await getHtmlFiles(ROOT);
    const urls = htmlFiles.map(fileToUrl);
    
    // Add video pages from videos.json
    const { videos } = await loadVideoData();
    for (const video of videos) {
      urls.push(`/videos/${video.slug}/`);
      urls.push(`/transcripts/${video.slug}.html`);
    }
    
    // Remove duplicates and sort
    const uniqueUrls = [...new Set(urls)].sort();
    
    // Generate sitemap
    const sitemap = generateSitemap(uniqueUrls);
    
    // Write sitemap
    await fs.writeFile(path.join(ROOT, 'sitemap.xml'), sitemap);
    
    console.log(`  ✅ Generated sitemap.xml with ${uniqueUrls.length} URLs`);
    console.log('\n📍 Top priority pages:');
    uniqueUrls
      .filter(url => getPriority(url) >= 0.8)
      .forEach(url => console.log(`    ${url} (${getPriority(url).toFixed(1)})`));
    
  } catch (error) {
    console.error('❌ Sitemap generation failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (process.argv[1] === fileURLToPath(import.meta.url)) {
  buildSitemap();
}