#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

function generateRSS() {
    const indexPath = path.join(__dirname, '..', 'data', 'blog-index.json');
    const outputPath = path.join(__dirname, '..', 'blog', 'rss.xml');
    
    // Read blog index
    const indexData = JSON.parse(fs.readFileSync(indexPath, 'utf8'));
    const posts = indexData.posts.slice(0, 30); // Latest 30 posts
    
    const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">
    <channel>
        <title>Blaze Intelligence Blog</title>
        <link>https://blaze-intelligence.com/blog/</link>
        <description>Weekly sports analytics insights covering NFL, MLB, College Football, and more. Data-driven analysis powered by 2.8M+ data points.</description>
        <language>en-us</language>
        <copyright>© 2025 Blaze Intelligence</copyright>
        <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
        <atom:link href="https://blaze-intelligence.com/blog/rss.xml" rel="self" type="application/rss+xml"/>
        
        ${posts.map(post => `<item>
            <title><![CDATA[${post.title}]]></title>
            <link>https://blaze-intelligence.com${post.path}</link>
            <guid isPermaLink="true">https://blaze-intelligence.com${post.path}</guid>
            <description><![CDATA[${post.summary}]]></description>
            <pubDate>${new Date(post.date).toUTCString()}</pubDate>
            <category>${post.sport.toUpperCase()}</category>
            ${post.tags.map(tag => `<category>${tag}</category>`).join('\n            ')}
        </item>`).join('\n        ')}
    </channel>
</rss>`;
    
    // Ensure blog directory exists
    const blogDir = path.dirname(outputPath);
    if (!fs.existsSync(blogDir)) {
        fs.mkdirSync(blogDir, { recursive: true });
    }
    
    fs.writeFileSync(outputPath, rss);
    console.log(`✅ Generated RSS feed with ${posts.length} posts: ${outputPath}`);
    
    return posts.length;
}

// Run if called directly
if (require.main === module) {
    generateRSS();
}

module.exports = { generateRSS };