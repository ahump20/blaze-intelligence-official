#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Parse front-matter from HTML/MD files
function parseFrontMatter(content) {
    const match = content.match(/^---\n([\s\S]*?)\n---/);
    if (!match) return null;
    
    const frontMatter = {};
    const lines = match[1].split('\n');
    
    lines.forEach(line => {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
            const key = line.substring(0, colonIndex).trim();
            let value = line.substring(colonIndex + 1).trim();
            
            // Remove quotes if present
            if ((value.startsWith('"') && value.endsWith('"')) || 
                (value.startsWith("'") && value.endsWith("'"))) {
                value = value.slice(1, -1);
            }
            
            // Parse arrays
            if (value.startsWith('[') && value.endsWith(']')) {
                value = value.slice(1, -1).split(',').map(item => 
                    item.trim().replace(/["']/g, '')
                );
            }
            
            // Parse numbers
            if (key === 'week' && !isNaN(value)) {
                value = parseInt(value);
            }
            
            frontMatter[key] = value;
        }
    });
    
    return frontMatter;
}

// Extract excerpt from content
function extractExcerpt(content, maxLength = 200) {
    // Remove front-matter
    const contentWithoutFrontMatter = content.replace(/^---\n[\s\S]*?\n---\n/, '');
    
    // Extract first paragraph
    const paragraphMatch = contentWithoutFrontMatter.match(/<p>(.*?)<\/p>/);
    if (paragraphMatch) {
        const text = paragraphMatch[1].replace(/<[^>]*>/g, ''); // Strip HTML tags
        return text.length > maxLength ? 
            text.substring(0, maxLength) + '...' : 
            text;
    }
    
    return '';
}

// Recursively scan blog directory
function scanBlogDirectory(dir, baseDir) {
    const posts = [];
    const files = fs.readdirSync(dir);
    
    files.forEach(file => {
        const filePath = path.join(dir, file);
        const stat = fs.statSync(filePath);
        
        if (stat.isDirectory()) {
            posts.push(...scanBlogDirectory(filePath, baseDir));
        } else if (file.endsWith('.html') || file.endsWith('.md')) {
            const content = fs.readFileSync(filePath, 'utf8');
            const frontMatter = parseFrontMatter(content);
            
            if (frontMatter) {
                const relativePath = path.relative(baseDir, filePath);
                const urlPath = '/blog/' + relativePath.replace(/\\/g, '/').replace(/\.(html|md)$/, '.html');
                
                // Extract slug from filename (YYYY-MM-DD__slug.ext)
                const filename = path.basename(file, path.extname(file));
                const slugMatch = filename.match(/^\d{4}-\d{2}-\d{2}__(.+)$/);
                const slug = slugMatch ? slugMatch[1] : filename;
                
                posts.push({
                    slug: slug,
                    path: urlPath,
                    title: frontMatter.title || 'Untitled',
                    date: frontMatter.date || new Date().toISOString().split('T')[0],
                    sport: frontMatter.sport || 'general',
                    week: frontMatter.week || null,
                    tags: frontMatter.tags || [],
                    summary: frontMatter.summary || extractExcerpt(content),
                    heroImage: frontMatter.heroImage || '',
                    sources: frontMatter.sources || []
                });
            }
        }
    });
    
    return posts;
}

// Main execution
function buildBlogIndex() {
    const contentDir = path.join(__dirname, '..', 'content', 'blog');
    const outputFile = path.join(__dirname, '..', 'data', 'blog-index.json');
    
    // Ensure directories exist
    if (!fs.existsSync(contentDir)) {
        console.log('Creating content/blog directory...');
        fs.mkdirSync(contentDir, { recursive: true });
    }
    
    const dataDir = path.join(__dirname, '..', 'data');
    if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
    }
    
    // Scan for posts
    console.log('Scanning for blog posts...');
    const posts = scanBlogDirectory(contentDir, contentDir);
    
    // Sort by date (newest first)
    posts.sort((a, b) => new Date(b.date) - new Date(a.date));
    
    // Add metadata
    const index = {
        generated: new Date().toISOString(),
        count: posts.length,
        sports: {
            cfb: posts.filter(p => p.sport === 'cfb').length,
            mlb: posts.filter(p => p.sport === 'mlb').length,
            nfl: posts.filter(p => p.sport === 'nfl').length
        },
        posts: posts
    };
    
    // Write index file
    fs.writeFileSync(outputFile, JSON.stringify(index, null, 2));
    console.log(`✅ Generated blog index with ${posts.length} posts`);
    console.log(`   - CFB: ${index.sports.cfb} posts`);
    console.log(`   - MLB: ${index.sports.mlb} posts`);
    console.log(`   - NFL: ${index.sports.nfl} posts`);
    console.log(`   Output: ${outputFile}`);
    
    return index;
}

// Run if called directly
if (require.main === module) {
    buildBlogIndex();
}

module.exports = { buildBlogIndex, parseFrontMatter, extractExcerpt };