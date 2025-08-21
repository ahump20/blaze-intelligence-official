// Notion Database Setup Helper
// Creates a recruiting leaderboard database with all required properties

import { Client } from '@notionhq/client';

const notion = new Client({ auth: process.env.NOTION_TOKEN });

async function createRecruitingDatabase() {
    console.log('🎯 Creating Blaze Intelligence Recruiting Leaderboard...\n');
    
    try {
        // Create the database
        const database = await notion.databases.create({
            parent: {
                type: 'page_id',
                page_id: process.env.NOTION_PAGE_ID || '1755662321-recruiting-leaderboard' // You'll need to provide this
            },
            title: [
                {
                    type: 'text',
                    text: {
                        content: 'Blaze Intelligence Recruiting Leaderboard'
                    }
                }
            ],
            properties: {
                'Name': {
                    title: {}
                },
                'Sport': {
                    select: {
                        options: [
                            { name: 'Football', color: 'orange' },
                            { name: 'Baseball', color: 'green' },
                            { name: 'Basketball', color: 'purple' },
                            { name: 'Hockey', color: 'blue' }
                        ]
                    }
                },
                'Level': {
                    select: {
                        options: [
                            { name: 'HS', color: 'yellow' },
                            { name: 'College', color: 'blue' },
                            { name: 'INTL', color: 'red' },
                            { name: 'Pro', color: 'default' }
                        ]
                    }
                },
                'Country': {
                    select: {
                        options: [
                            { name: 'USA', color: 'blue' },
                            { name: 'DOM', color: 'green' },
                            { name: 'NIC', color: 'orange' },
                            { name: 'CAN', color: 'red' }
                        ]
                    }
                },
                'Region': {
                    rich_text: {}
                },
                'Position': {
                    rich_text: {}
                },
                'Birth Date': {
                    date: {}
                },
                'Team/Academy': {
                    rich_text: {}
                },
                'B/T': {
                    rich_text: {}
                },
                'Height (cm)': {
                    number: {
                        format: 'number'
                    }
                },
                'Weight (kg)': {
                    number: {
                        format: 'number'
                    }
                },
                'FB (mph)': {
                    number: {
                        format: 'number'
                    }
                },
                'EV (mph)': {
                    number: {
                        format: 'number'
                    }
                },
                '60 yd (s)': {
                    number: {
                        format: 'number_with_commas'
                    }
                },
                'Pop Time (s)': {
                    number: {
                        format: 'number_with_commas'
                    }
                },
                'NIL ($)': {
                    number: {
                        format: 'dollar'
                    }
                },
                'Buzz (0-100)': {
                    number: {
                        format: 'percent'
                    }
                },
                'Blaze Score (0-100)': {
                    number: {
                        format: 'percent'
                    }
                },
                'Last Verified': {
                    date: {}
                },
                'Source': {
                    url: {}
                }
            }
        });
        
        console.log('✅ Database created successfully!');
        console.log(`📊 Database ID: ${database.id}`);
        console.log(`🔗 Database URL: ${database.url}`);
        console.log('\n📋 Next steps:');
        console.log('1. Copy the Database ID above');
        console.log('2. Use it in your import: NOTION_DATABASE_ID=<database-id>');
        console.log('3. Run the import: node notion_import.js seed_expanded.jsonl');
        
        return database;
        
    } catch (error) {
        console.error('❌ Database creation failed:', error.message);
        console.log('\n💡 Quick fixes:');
        console.log('1. Make sure your integration has "Insert content" permissions');
        console.log('2. Share a parent page with your integration first');
        console.log('3. Get the parent page ID from the URL: notion.so/workspace/PAGE_ID');
        console.log('4. Run: NOTION_TOKEN=<token> NOTION_PAGE_ID=<page-id> node setup-notion-database.js');
        throw error;
    }
}

// Manual database setup instructions
console.log('🏆 BLAZE INTELLIGENCE RECRUITING LEADERBOARD SETUP\n');
console.log('If automatic creation fails, follow these manual steps:\n');
console.log('1. 📄 Create a new page in Notion');
console.log('2. 🗂️ Add a database to the page');
console.log('3. 📊 Add these columns:');
console.log('   • Name (Title)');
console.log('   • Sport (Select: Football, Baseball, Basketball, Hockey)');
console.log('   • Level (Select: HS, College, INTL, Pro)');
console.log('   • Country (Select: USA, DOM, NIC, CAN)');
console.log('   • Region (Text)');
console.log('   • Position (Text)');
console.log('   • Birth Date (Date)');
console.log('   • Team/Academy (Text)');
console.log('   • B/T (Text)');
console.log('   • Height (cm) (Number)');
console.log('   • Weight (kg) (Number)');
console.log('   • FB (mph) (Number)');
console.log('   • EV (mph) (Number)');
console.log('   • 60 yd (s) (Number)');
console.log('   • Pop Time (s) (Number)');
console.log('   • NIL ($) (Number - Dollar format)');
console.log('   • Buzz (0-100) (Number - Percent format)');
console.log('   • Blaze Score (0-100) (Number - Percent format)');
console.log('   • Last Verified (Date)');
console.log('   • Source (URL)');
console.log('4. 🔗 Share database with integration');
console.log('5. 📋 Copy database ID from URL\n');

if (process.env.NOTION_TOKEN) {
    createRecruitingDatabase()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
} else {
    console.log('⚠️ Set NOTION_TOKEN to create database automatically');
}