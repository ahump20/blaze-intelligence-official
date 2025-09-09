#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const dataDir = path.join(__dirname, '..', 'data');
const blogDir = path.join(__dirname, '..', 'blog');

// Read blog index
const blogIndex = JSON.parse(fs.readFileSync(path.join(dataDir, 'blog-index.json'), 'utf-8'));

// Generate RSS feed
const rssItems = blogIndex.posts.slice(0, 20).map(post => {
    const pubDate = new Date(post.date).toUTCString();
    return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>https://blaze-intelligence.com${post.path}</link>
      <guid isPermaLink="true">https://blaze-intelligence.com${post.path}</guid>
      <description><![CDATA[${post.summary}]]></description>
      <pubDate>${pubDate}</pubDate>
      <category>${post.sport.toUpperCase()}</category>
      ${post.tags.map(tag => `<category>${tag}</category>`).join('\n      ')}
    </item>`;
}).join('');

const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Blaze Intelligence Blog</title>
    <link>https://blaze-intelligence.com/blog/</link>
    <description>Data-driven sports analytics and insights from Blaze Intelligence</description>
    <language>en-us</language>
    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
    <atom:link href="https://blaze-intelligence.com/blog/rss.xml" rel="self" type="application/rss+xml"/>
    ${rssItems}
  </channel>
</rss>`;

fs.writeFileSync(path.join(blogDir, 'rss.xml'), rss);
console.log('✅ RSS feed updated with', blogIndex.posts.length, 'posts');