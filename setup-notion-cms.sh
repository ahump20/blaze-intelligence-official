#!/bin/bash

# Blaze Intelligence - Notion CMS Setup Script
# Sets up Notion integration for content management

echo "🔥 BLAZE INTELLIGENCE - Notion CMS Setup"
echo "========================================"
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Must run from blaze-intelligence-website directory"
    exit 1
fi

# Function to prompt for input with default value
prompt_with_default() {
    local prompt="$1"
    local default="$2"
    local var_name="$3"
    
    read -p "$prompt [$default]: " value
    if [ -z "$value" ]; then
        value="$default"
    fi
    eval "$var_name='$value'"
}

echo "📋 Setting up Notion CMS Integration"
echo ""
echo "You'll need:"
echo "1. A Notion API key (from https://www.notion.so/my-integrations)"
echo "2. A database ID for your content"
echo "3. (Optional) A page ID for creating new databases"
echo ""

# Prompt for Notion credentials
read -p "Enter your Notion API key (starts with 'ntn_'): " NOTION_TOKEN
if [ -z "$NOTION_TOKEN" ]; then
    echo "❌ Notion API key is required"
    exit 1
fi

read -p "Enter your Notion Database ID (optional, press Enter to create new): " NOTION_DATABASE_ID

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cat > .env << EOF
# Notion CMS Configuration
NOTION_TOKEN=$NOTION_TOKEN
NOTION_DATABASE_ID=$NOTION_DATABASE_ID

# Cloudflare Configuration (will be added later)
CLOUDFLARE_ACCOUNT_ID=
CLOUDFLARE_API_TOKEN=
CLOUDFLARE_PAGES_PROJECT=blaze-intelligence

# HubSpot Configuration (will be added later)
HUBSPOT_PORTAL_ID=
HUBSPOT_ACCESS_TOKEN=

# Analytics Configuration
GOOGLE_ANALYTICS_ID=
MIXPANEL_TOKEN=
EOF
    echo "✅ .env file created"
else
    echo "📝 Updating existing .env file..."
    # Update existing .env with Notion credentials
    if grep -q "NOTION_TOKEN=" .env; then
        sed -i.bak "s/NOTION_TOKEN=.*/NOTION_TOKEN=$NOTION_TOKEN/" .env
    else
        echo "NOTION_TOKEN=$NOTION_TOKEN" >> .env
    fi
    
    if grep -q "NOTION_DATABASE_ID=" .env; then
        sed -i.bak "s/NOTION_DATABASE_ID=.*/NOTION_DATABASE_ID=$NOTION_DATABASE_ID/" .env
    else
        echo "NOTION_DATABASE_ID=$NOTION_DATABASE_ID" >> .env
    fi
    echo "✅ .env file updated"
fi

# Install Notion SDK if not already installed
echo ""
echo "📦 Installing Notion SDK..."
npm install @notionhq/client --save

# Create Notion sync script
echo ""
echo "📝 Creating Notion sync script..."
cat > sync-notion-content.js << 'EOF'
#!/usr/bin/env node

// Notion CMS Sync Script for Blaze Intelligence
const { Client } = require('@notionhq/client');
const fs = require('fs').promises;
const path = require('path');

// Load environment variables
require('dotenv').config();

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function syncContent() {
    console.log('🔄 Syncing content from Notion...');
    
    try {
        if (!process.env.NOTION_DATABASE_ID) {
            console.log('⚠️ No database ID provided. Please set NOTION_DATABASE_ID in .env');
            return;
        }
        
        // Query the database
        const response = await notion.databases.query({
            database_id: process.env.NOTION_DATABASE_ID,
            sorts: [
                {
                    property: 'Created',
                    direction: 'descending'
                }
            ]
        });
        
        console.log(`📚 Found ${response.results.length} content items`);
        
        // Process each page
        const content = await Promise.all(response.results.map(async (page) => {
            const properties = page.properties;
            
            // Extract common properties
            const title = properties.Title?.title[0]?.text?.content || 'Untitled';
            const slug = properties.Slug?.rich_text[0]?.text?.content || 
                         title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
            const type = properties.Type?.select?.name || 'article';
            const status = properties.Status?.select?.name || 'draft';
            const author = properties.Author?.rich_text[0]?.text?.content || 'Blaze Intelligence';
            const excerpt = properties.Excerpt?.rich_text[0]?.text?.content || '';
            
            // Get page content
            const blocks = await notion.blocks.children.list({
                block_id: page.id,
                page_size: 100
            });
            
            // Convert blocks to markdown
            const content = blocksToMarkdown(blocks.results);
            
            return {
                id: page.id,
                title,
                slug,
                type,
                status,
                author,
                excerpt,
                content,
                created: page.created_time,
                updated: page.last_edited_time
            };
        }));
        
        // Save content to JSON
        const outputPath = path.join(__dirname, 'src', 'data', 'cms-content.json');
        await fs.mkdir(path.dirname(outputPath), { recursive: true });
        await fs.writeFile(outputPath, JSON.stringify(content, null, 2));
        
        console.log(`✅ Synced ${content.length} items to ${outputPath}`);
        
        // Generate static pages for published content
        const publishedContent = content.filter(item => item.status === 'published');
        for (const item of publishedContent) {
            await generateStaticPage(item);
        }
        
        console.log(`📄 Generated ${publishedContent.length} static pages`);
        
    } catch (error) {
        console.error('❌ Sync failed:', error);
        process.exit(1);
    }
}

function blocksToMarkdown(blocks) {
    return blocks.map(block => {
        switch (block.type) {
            case 'paragraph':
                return block.paragraph.rich_text.map(t => t.plain_text).join('');
            case 'heading_1':
                return `# ${block.heading_1.rich_text.map(t => t.plain_text).join('')}`;
            case 'heading_2':
                return `## ${block.heading_2.rich_text.map(t => t.plain_text).join('')}`;
            case 'heading_3':
                return `### ${block.heading_3.rich_text.map(t => t.plain_text).join('')}`;
            case 'bulleted_list_item':
                return `- ${block.bulleted_list_item.rich_text.map(t => t.plain_text).join('')}`;
            case 'numbered_list_item':
                return `1. ${block.numbered_list_item.rich_text.map(t => t.plain_text).join('')}`;
            case 'code':
                const lang = block.code.language || '';
                const code = block.code.rich_text.map(t => t.plain_text).join('');
                return `\`\`\`${lang}\n${code}\n\`\`\``;
            case 'quote':
                return `> ${block.quote.rich_text.map(t => t.plain_text).join('')}`;
            default:
                return '';
        }
    }).filter(Boolean).join('\n\n');
}

async function generateStaticPage(item) {
    const template = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${item.title} - Blaze Intelligence</title>
    <meta name="description" content="${item.excerpt}">
    <link rel="stylesheet" href="/css/style.css">
</head>
<body>
    <nav class="navbar">
        <a href="/" class="logo">Blaze Intelligence</a>
    </nav>
    
    <main class="content-page">
        <article>
            <header>
                <h1>${item.title}</h1>
                <div class="meta">
                    <span class="author">By ${item.author}</span>
                    <span class="date">${new Date(item.created).toLocaleDateString()}</span>
                </div>
            </header>
            
            <div class="content">
                ${markdownToHTML(item.content)}
            </div>
        </article>
    </main>
    
    <footer>
        <p>&copy; 2025 Blaze Intelligence. All rights reserved.</p>
    </footer>
</body>
</html>`;
    
    const outputPath = path.join(__dirname, 'content', `${item.slug}.html`);
    await fs.mkdir(path.dirname(outputPath), { recursive: true });
    await fs.writeFile(outputPath, template);
}

function markdownToHTML(markdown) {
    // Simple markdown to HTML conversion
    return markdown
        .replace(/^### (.*$)/gim, '<h3>$1</h3>')
        .replace(/^## (.*$)/gim, '<h2>$1</h2>')
        .replace(/^# (.*$)/gim, '<h1>$1</h1>')
        .replace(/^\- (.*$)/gim, '<li>$1</li>')
        .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
        .replace(/\*(.+?)\*/g, '<em>$1</em>')
        .replace(/\`(.+?)\`/g, '<code>$1</code>')
        .replace(/\n\n/g, '</p><p>')
        .replace(/^/, '<p>')
        .replace(/$/, '</p>');
}

// Run sync
syncContent().catch(console.error);
EOF

chmod +x sync-notion-content.js

echo "✅ Notion sync script created"

# Create a cron job script
echo ""
echo "📝 Creating automated sync script..."
cat > run-notion-sync.sh << 'EOF'
#!/bin/bash
# Automated Notion content sync
cd "$(dirname "$0")"
node sync-notion-content.js
EOF

chmod +x run-notion-sync.sh

echo "✅ Automated sync script created"

# Test the connection
echo ""
echo "🧪 Testing Notion connection..."
node -e "
const { Client } = require('@notionhq/client');
require('dotenv').config();
const notion = new Client({ auth: process.env.NOTION_TOKEN });

(async () => {
    try {
        const user = await notion.users.me();
        console.log('✅ Successfully connected to Notion as:', user.name || user.object);
        
        if (process.env.NOTION_DATABASE_ID) {
            const db = await notion.databases.retrieve({ 
                database_id: process.env.NOTION_DATABASE_ID 
            });
            console.log('✅ Found database:', Object.values(db.title[0])[0].content);
        }
    } catch (error) {
        console.error('❌ Connection failed:', error.message);
        process.exit(1);
    }
})();
"

echo ""
echo "🎉 Notion CMS setup complete!"
echo ""
echo "Next steps:"
echo "1. Run './sync-notion-content.js' to sync content"
echo "2. Add to cron for automatic updates: "
echo "   */30 * * * * cd $(pwd) && ./run-notion-sync.sh"
echo "3. Create content in your Notion database"
echo ""
echo "Your content will be:"
echo "- Synced to: src/data/cms-content.json"
echo "- Generated as static pages in: content/"
echo ""