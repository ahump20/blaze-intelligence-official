#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const OLD_DOMAIN = 'blaze-intelligence-lsl.pages.dev';
const NEW_DOMAIN = 'blaze-intelligence.com';

// Files to update
const filesToUpdate = [
    'sitemap.xml',
    'blog/rss.xml',
    'blog/index.html',
    'blog/cfb/index.html',
    'blog/mlb/index.html',
    'blog/nfl/index.html',
    'robots.txt',
    'DEPLOYMENT_SUCCESS.md',
    'CLAIMS_VALIDATION_REPORT_2025.md'
];

// Directories to scan for HTML files
const directoriesToScan = [
    'blog/cfb',
    'blog/mlb',
    'blog/nfl'
];

function updateFile(filePath) {
    const fullPath = path.join(__dirname, '..', filePath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  File not found: ${filePath}`);
        return false;
    }
    
    let content = fs.readFileSync(fullPath, 'utf8');
    const originalContent = content;
    
    // Replace domain
    content = content.replace(new RegExp(OLD_DOMAIN, 'g'), NEW_DOMAIN);
    
    // Also update protocol if needed
    content = content.replace(/http:\/\/blaze-intelligence\.com/g, 'https://blaze-intelligence.com');
    
    if (content !== originalContent) {
        fs.writeFileSync(fullPath, content);
        console.log(`✅ Updated: ${filePath}`);
        return true;
    } else {
        console.log(`ℹ️  No changes needed: ${filePath}`);
        return false;
    }
}

function scanAndUpdateDirectory(dirPath) {
    const fullPath = path.join(__dirname, '..', dirPath);
    
    if (!fs.existsSync(fullPath)) {
        console.log(`⚠️  Directory not found: ${dirPath}`);
        return;
    }
    
    const files = fs.readdirSync(fullPath);
    files.forEach(file => {
        if (file.endsWith('.html')) {
            updateFile(path.join(dirPath, file));
        }
    });
}

function createRobotsTxt() {
    const robotsContent = `# Blaze Intelligence Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /.git/

Sitemap: https://${NEW_DOMAIN}/sitemap.xml

# Crawl-delay for respectful crawling
User-agent: *
Crawl-delay: 1`;
    
    const robotsPath = path.join(__dirname, '..', 'robots.txt');
    fs.writeFileSync(robotsPath, robotsContent);
    console.log('✅ Created robots.txt');
}

function updatePackageJson() {
    const packagePath = path.join(__dirname, '..', 'package.json');
    
    if (fs.existsSync(packagePath)) {
        const package = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
        
        if (!package.homepage || package.homepage.includes(OLD_DOMAIN)) {
            package.homepage = `https://${NEW_DOMAIN}`;
            fs.writeFileSync(packagePath, JSON.stringify(package, null, 2));
            console.log('✅ Updated package.json homepage');
        }
    }
}

function main() {
    console.log(`🔄 Updating domain from ${OLD_DOMAIN} to ${NEW_DOMAIN}...`);
    console.log('');
    
    let updatedCount = 0;
    
    // Update specific files
    filesToUpdate.forEach(file => {
        if (updateFile(file)) updatedCount++;
    });
    
    // Scan and update directories
    directoriesToScan.forEach(dir => {
        scanAndUpdateDirectory(dir);
    });
    
    // Create/update robots.txt
    createRobotsTxt();
    
    // Update package.json
    updatePackageJson();
    
    console.log('');
    console.log(`✅ Domain update complete! Updated ${updatedCount} files.`);
    console.log('');
    console.log('📋 Next steps:');
    console.log('1. Go to Cloudflare Dashboard → Pages → blaze-intelligence-lsl');
    console.log('2. Click "Custom domains" tab');
    console.log('3. Add "blaze-intelligence.com" and "www.blaze-intelligence.com"');
    console.log('4. Wait for DNS propagation (5-10 minutes)');
    console.log('5. Deploy the updated files: wrangler pages deploy .');
}

// Run the script
main();