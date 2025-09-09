#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Blog post template generator
function createBlogPost(sport, title, summary, content) {
    const date = new Date().toISOString().split('T')[0];
    const week = getWeekNumber(sport);
    const slug = title.toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-|-$/g, '')
        .substring(0, 50);
    
    const filename = `${date}__${slug}.html`;
    const tags = generateTags(sport, title, content);
    
    const frontMatter = `---
title: "${title}"
date: "${date}"
sport: "${sport}"
week: ${week}
tags: ${JSON.stringify(tags)}
summary: "${summary}"
heroImage: ""
sources: ["ESPN", "Sports Reference", "Blaze Intelligence Analytics"]
---`;
    
    return {
        filename,
        content: `${frontMatter}\n\n${content}`
    };
}

// Get current week number for sport
function getWeekNumber(sport) {
    const now = new Date();
    const month = now.getMonth();
    
    if (sport === 'nfl') {
        // NFL season starts in September
        if (month < 8) return 0; // Offseason
        if (month === 8) return Math.ceil(now.getDate() / 7);
        if (month === 9) return 4 + Math.ceil(now.getDate() / 7);
        return Math.min(18, 8 + Math.ceil(now.getDate() / 7));
    } else if (sport === 'cfb') {
        // CFB season August-December
        if (month < 7) return 0;
        if (month === 7) return Math.ceil((now.getDate() - 20) / 7);
        if (month === 8) return 2 + Math.ceil(now.getDate() / 7);
        return Math.min(15, 6 + Math.ceil(now.getDate() / 7));
    } else if (sport === 'mlb') {
        // MLB is different - use month instead
        return month + 1;
    }
    
    return 1;
}

// Generate relevant tags
function generateTags(sport, title, content) {
    const tags = [sport, '2025'];
    const weekNum = getWeekNumber(sport);
    
    if (weekNum > 0) {
        tags.push(`week-${weekNum}`);
    }
    
    // Extract team names from title/content
    const teams = {
        nfl: ['titans', 'bears', 'cowboys', 'eagles', 'chiefs', 'bills'],
        mlb: ['cardinals', 'cubs', 'yankees', 'dodgers', 'astros', 'braves'],
        cfb: ['texas', 'ohio-state', 'georgia', 'alabama', 'michigan', 'oregon']
    };
    
    teams[sport].forEach(team => {
        if (title.toLowerCase().includes(team) || content.toLowerCase().includes(team)) {
            tags.push(team);
        }
    });
    
    // Add topic tags
    if (title.toLowerCase().includes('preview')) tags.push('preview');
    if (title.toLowerCase().includes('recap')) tags.push('recap');
    if (title.toLowerCase().includes('analysis')) tags.push('analytics');
    if (title.toLowerCase().includes('playoff')) tags.push('playoffs');
    
    return tags.slice(0, 8); // Limit to 8 tags
}

// Publish blog post
function publishPost(sport, title, summary, content) {
    const post = createBlogPost(sport, title, summary, content);
    const outputPath = path.join(__dirname, '..', 'content', 'blog', sport, post.filename);
    
    // Ensure directory exists
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    
    // Write post
    fs.writeFileSync(outputPath, post.content);
    console.log(`✅ Published: ${outputPath}`);
    
    // Rebuild index and HTML
    try {
        execSync('node scripts/build-blog-index.cjs', { cwd: path.join(__dirname, '..') });
        execSync('node scripts/build-posts.cjs', { cwd: path.join(__dirname, '..') });
        execSync('node scripts/build-rss.cjs', { cwd: path.join(__dirname, '..') });
        console.log('✅ Rebuilt blog index, posts, and RSS feed');
        
        // Deploy
        if (process.env.AUTO_DEPLOY === 'true') {
            console.log('🚀 Deploying to production...');
            execSync('wrangler pages deploy . --project-name=blaze-intelligence-lsl --commit-dirty=true', 
                { cwd: path.join(__dirname, '..'), stdio: 'inherit' });
            console.log('✅ Deployed successfully!');
        }
    } catch (error) {
        console.error('❌ Build/deploy error:', error.message);
    }
    
    return outputPath;
}

// Sample content templates
const templates = {
    nfl: {
        preview: (team1, team2) => `
<h2>Matchup Overview</h2>
<p>This week's ${team1} vs ${team2} matchup presents intriguing strategic questions as both teams look to establish their identity.</p>

<h3>Key Matchups</h3>
<ul>
    <li>${team1} pass rush vs ${team2} offensive line</li>
    <li>${team2} running game vs ${team1} front seven</li>
    <li>Third down efficiency battle</li>
</ul>

<h3>Statistical Analysis</h3>
<p>Our models show the following key factors will determine the outcome:</p>
<table>
    <tr><th>Metric</th><th>${team1}</th><th>${team2}</th></tr>
    <tr><td>Pass Block Win Rate</td><td>62%</td><td>58%</td></tr>
    <tr><td>Defensive DVOA</td><td>-8.2%</td><td>-5.1%</td></tr>
    <tr><td>Red Zone Efficiency</td><td>67%</td><td>71%</td></tr>
</table>

<h3>Prediction</h3>
<p>Our proprietary models give ${team1} a slight edge with a 52% win probability.</p>`,
        
        recap: (winner, loser, score) => `
<h2>Game Summary</h2>
<p>${winner} defeated ${loser} ${score} in a game that lived up to expectations.</p>

<h3>Key Performances</h3>
<ul>
    <li>Game MVP performance with crucial plays in the fourth quarter</li>
    <li>Defensive dominance in the red zone</li>
    <li>Special teams impact on field position</li>
</ul>

<h3>Turning Points</h3>
<p>The game shifted in the third quarter when...</p>

<h3>Looking Ahead</h3>
<p>This result has significant implications for both teams' playoff positioning.</p>`
    },
    
    cfb: {
        rankings: () => `
<h2>Top 25 Movement</h2>
<p>This week's action caused significant shifts in the rankings landscape.</p>

<h3>Biggest Movers</h3>
<ul>
    <li>Rising: Teams making statement wins</li>
    <li>Falling: Upset victims and underwhelming performances</li>
    <li>Watch List: Teams on the bubble</li>
</ul>

<h3>Playoff Implications</h3>
<p>The current playoff picture shows...</p>

<h3>Week Ahead</h3>
<p>Key matchups that will shape next week's rankings.</p>`
    },
    
    mlb: {
        update: (team) => `
<h2>${team} Season Update</h2>
<p>As we enter the final stretch, the ${team} find themselves in position for a playoff push.</p>

<h3>Statistical Trends</h3>
<ul>
    <li>Team OPS over last 30 days</li>
    <li>Bullpen ERA in high-leverage situations</li>
    <li>Run differential analysis</li>
</ul>

<h3>Key Players</h3>
<p>Performance metrics for impact players...</p>

<h3>Remaining Schedule</h3>
<p>Path to the playoffs analysis...</p>`
    }
};

// Command line interface
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.length < 4) {
        console.log('Usage: node publish-blog.cjs <sport> <type> <title> <summary>');
        console.log('Sports: nfl, cfb, mlb');
        console.log('Types: preview, recap, rankings, update');
        console.log('\nExample:');
        console.log('node publish-blog.cjs nfl preview "Titans vs Colts Week 2 Preview" "Division rivalry renewed"');
        process.exit(1);
    }
    
    const [sport, type, title, summary] = args;
    
    // Generate content based on template
    let content = '<p>Content generation in progress...</p>';
    
    if (sport === 'nfl' && type === 'preview') {
        content = templates.nfl.preview('Titans', 'Opponent');
    } else if (sport === 'nfl' && type === 'recap') {
        content = templates.nfl.recap('Winner', 'Loser', '24-21');
    } else if (sport === 'cfb' && type === 'rankings') {
        content = templates.cfb.rankings();
    } else if (sport === 'mlb' && type === 'update') {
        content = templates.mlb.update('Cardinals');
    }
    
    publishPost(sport, title, summary, content);
}

module.exports = { publishPost, createBlogPost, generateTags };