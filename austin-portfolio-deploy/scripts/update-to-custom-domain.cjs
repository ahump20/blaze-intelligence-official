#!/usr/bin/env node

/**
 * Update all references from pages.dev to custom domain blaze-intelligence.com
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const OLD_DOMAINS = [
    'blaze-intelligence-lsl.pages.dev',
    'https://blaze-intelligence-lsl.pages.dev',
    'blaze-intelligence.pages.dev',
    'https://blaze-intelligence.pages.dev'
];

const NEW_DOMAIN = 'blaze-intelligence.com';
const NEW_URL = 'https://blaze-intelligence.com';

class DomainUpdater {
    constructor() {
        this.filesUpdated = 0;
        this.replacements = 0;
    }

    updateFile(filePath) {
        let content = fs.readFileSync(filePath, 'utf-8');
        let originalContent = content;
        let fileReplacements = 0;

        // Replace all old domain references
        OLD_DOMAINS.forEach(oldDomain => {
            const regex = new RegExp(oldDomain.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
            const matches = content.match(regex);
            if (matches) {
                if (oldDomain.startsWith('https://')) {
                    content = content.replace(regex, NEW_URL);
                } else {
                    content = content.replace(regex, NEW_DOMAIN);
                }
                fileReplacements += matches.length;
            }
        });

        if (content !== originalContent) {
            fs.writeFileSync(filePath, content);
            this.filesUpdated++;
            this.replacements += fileReplacements;
            console.log(`✅ Updated ${filePath} (${fileReplacements} replacements)`);
        }
    }

    updateAllFiles() {
        console.log('🔄 Updating all files to use custom domain blaze-intelligence.com...');
        console.log('=' .repeat(60));

        // Update HTML files
        const htmlFiles = execSync('find . -name "*.html" -type f', { encoding: 'utf-8' })
            .split('\n')
            .filter(f => f.trim() && !f.includes('node_modules') && !f.includes('.git'));

        htmlFiles.forEach(file => this.updateFile(file.trim()));

        // Update JavaScript files
        const jsFiles = execSync('find . -name "*.js" -type f', { encoding: 'utf-8' })
            .split('\n')
            .filter(f => f.trim() && !f.includes('node_modules') && !f.includes('.git'));

        jsFiles.forEach(file => this.updateFile(file.trim()));

        // Update JSON files
        const jsonFiles = execSync('find . -name "*.json" -type f', { encoding: 'utf-8' })
            .split('\n')
            .filter(f => f.trim() && !f.includes('node_modules') && !f.includes('.git') && !f.includes('package'));

        jsonFiles.forEach(file => this.updateFile(file.trim()));

        // Update Markdown files
        const mdFiles = execSync('find . -name "*.md" -type f', { encoding: 'utf-8' })
            .split('\n')
            .filter(f => f.trim() && !f.includes('node_modules') && !f.includes('.git'));

        mdFiles.forEach(file => this.updateFile(file.trim()));

        console.log('=' .repeat(60));
        console.log(`🎉 Domain update complete!`);
        console.log(`   Files updated: ${this.filesUpdated}`);
        console.log(`   Total replacements: ${this.replacements}`);
        console.log(`   New domain: ${NEW_URL}`);
    }
}

// Run the updater
const updater = new DomainUpdater();
updater.updateAllFiles();