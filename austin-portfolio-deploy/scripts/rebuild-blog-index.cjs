#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const blogDir = path.join(__dirname, '..', 'blog');
const dataDir = path.join(__dirname, '..', 'data');

// Ensure data directory exists
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}

// Parse front-matter from HTML files
function extractMetaFromHTML(filePath) {
    const content = fs.readFileSync(filePath, 'utf-8');
    
    // Extract title
    const titleMatch = content.match(/<title>(.*?)(?:•.*)?<\/title>/);
    const title = titleMatch ? titleMatch[1].trim() : 'Untitled';
    
    // Extract date from filename or content
    const filename = path.basename(filePath);
    const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
    const date = dateMatch ? dateMatch[1] : '2025-09-01';
    
    // Extract sport from path
    const sport = path.dirname(filePath).split(path.sep).pop();
    
    // Extract description
    const descMatch = content.match(/<meta name="description" content="(.*?)"/);
    const summary = descMatch ? descMatch[1] : title;
    
    // Extract tags from content
    const tagsMatch = content.match(/<span class="px-3 py-1 bg-slate-800[^>]*>(#\w+)<\/span>/g);
    const tags = tagsMatch ? tagsMatch.map(t => t.match(/>(#\w+)</)[1].replace('#', '')) : [];
    
    return {
        title,
        date,
        sport,
        summary,
        tags,
        slug: filename.replace('.html', ''),
        path: `/blog/${sport}/${filename}`
    };
}

// Scan blog directories
const posts = [];
const sports = ['cfb', 'mlb', 'nfl'];

sports.forEach(sport => {
    const sportDir = path.join(blogDir, sport);
    if (fs.existsSync(sportDir)) {
        const files = fs.readdirSync(sportDir)
            .filter(f => f.endsWith('.html') && !f.includes('index'));
        
        files.forEach(file => {
            const filePath = path.join(sportDir, file);
            const meta = extractMetaFromHTML(filePath);
            posts.push(meta);
        });
    }
});

// Sort by date (newest first)
posts.sort((a, b) => new Date(b.date) - new Date(a.date));

// Write blog index
const blogIndex = {
    posts,
    generated: new Date().toISOString(),
    total: posts.length
};

fs.writeFileSync(
    path.join(dataDir, 'blog-index.json'),
    JSON.stringify(blogIndex, null, 2)
);

console.log(`✅ Blog index rebuilt with ${posts.length} posts`);
console.log(`   - CFB: ${posts.filter(p => p.sport === 'cfb').length} posts`);
console.log(`   - MLB: ${posts.filter(p => p.sport === 'mlb').length} posts`);
console.log(`   - NFL: ${posts.filter(p => p.sport === 'nfl').length} posts`);