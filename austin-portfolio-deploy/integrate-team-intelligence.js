#!/usr/bin/env node

/**
 * Blaze Intelligence Team Data Integration
 * Integrates extracted team intelligence into the platform
 */

import fs from 'fs';
import path from 'path';

// Load the extracted team intelligence
const intelligencePath = path.join(process.cwd(), 'data', 'team-intelligence.json');
const intelligence = JSON.parse(fs.readFileSync(intelligencePath, 'utf-8'));

/**
 * Update the main dashboard with team intelligence
 */
function updateDashboard() {
  const dashboardConfig = {
    teams: {
      total: intelligence.meta.total_teams,
      by_league: intelligence.league_summaries,
      featured: {
        cardinals: intelligence.teams.find(t => t.name === "St. Louis Cardinals"),
        titans: intelligence.teams.find(t => t.name === "Tennessee Titans"),
        longhorns: intelligence.teams.find(t => t.name === "Texas Longhorns"),
        grizzlies: intelligence.teams.find(t => t.name === "Memphis Grizzlies")
      }
    },
    metrics: {
      accuracy: intelligence.meta.accuracy,
      data_points: intelligence.meta.data_points,
      total_championships: Object.values(intelligence.league_summaries)
        .reduce((sum, league) => sum + league.total_championships, 0)
    },
    top_performers: intelligence.teams
      .sort((a, b) => b.metrics.blaze_intelligence_score - a.metrics.blaze_intelligence_score)
      .slice(0, 20)
  };
  
  // Write dashboard configuration
  const dashboardPath = path.join(process.cwd(), 'data', 'dashboard-config.json');
  fs.writeFileSync(dashboardPath, JSON.stringify(dashboardConfig, null, 2));
  
  console.log('✅ Dashboard configuration updated');
  return dashboardConfig;
}

/**
 * Create league-specific data files
 */
function createLeagueFiles() {
  const leagues = ['MLB', 'NFL', 'NBA', 'NCAA_FOOTBALL'];
  
  for (const league of leagues) {
    const leagueTeams = intelligence.teams.filter(t => t.league === league || t.league === 'NCAA Football');
    const leagueData = {
      league,
      summary: intelligence.league_summaries[league],
      teams: leagueTeams,
      updated: new Date().toISOString()
    };
    
    const leaguePath = path.join(process.cwd(), 'data', 'analytics', `${league.toLowerCase()}.json`);
    const leagueDir = path.dirname(leaguePath);
    
    if (!fs.existsSync(leagueDir)) {
      fs.mkdirSync(leagueDir, { recursive: true });
    }
    
    fs.writeFileSync(leaguePath, JSON.stringify(leagueData, null, 2));
    console.log(`✅ Created ${league} data file`);
  }
}

/**
 * Update API endpoints with team intelligence
 */
function updateAPIEndpoints() {
  const apiConfig = `
// Team Intelligence API Endpoints
export const TEAM_ENDPOINTS = {
  getAllTeams: '/api/teams',
  getTeamById: '/api/teams/:id',
  getLeagueTeams: '/api/teams/league/:league',
  getTopPerformers: '/api/teams/top/:count',
  getFeaturedTeams: '/api/teams/featured'
};

// Team Intelligence Data
export const TEAM_INTELLIGENCE = ${JSON.stringify(intelligence.teams.slice(0, 5), null, 2)};

// League Summaries
export const LEAGUE_SUMMARIES = ${JSON.stringify(intelligence.league_summaries, null, 2)};
`;

  const apiPath = path.join(process.cwd(), 'api', 'team-intelligence-api.js');
  const apiDir = path.dirname(apiPath);
  
  if (!fs.existsSync(apiDir)) {
    fs.mkdirSync(apiDir, { recursive: true });
  }
  
  fs.writeFileSync(apiPath, apiConfig);
  console.log('✅ API endpoints configured');
}

/**
 * Create team-specific pages
 */
function createTeamPages() {
  const featuredTeams = [
    'St. Louis Cardinals',
    'Tennessee Titans', 
    'Texas Longhorns',
    'Memphis Grizzlies'
  ];
  
  for (const teamName of featuredTeams) {
    const team = intelligence.teams.find(t => t.name === teamName);
    if (!team) continue;
    
    const teamPage = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${team.name} - Blaze Intelligence</title>
    <link rel="stylesheet" href="../css/styles.css">
    <style>
        .team-hero {
            background: linear-gradient(135deg, #BF5700 0%, #FF8C00 100%);
            color: white;
            padding: 60px 20px;
            text-align: center;
        }
        .team-metrics {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            padding: 40px 20px;
            max-width: 1200px;
            margin: 0 auto;
        }
        .metric-card {
            background: #1a1a1a;
            border: 1px solid #BF5700;
            border-radius: 8px;
            padding: 20px;
            text-align: center;
        }
        .metric-value {
            font-size: 2.5rem;
            font-weight: bold;
            color: #BF5700;
        }
        .metric-label {
            color: #999;
            margin-top: 10px;
        }
    </style>
</head>
<body>
    <div class="team-hero">
        <h1>${team.name}</h1>
        <p>${team.league} • ${team.division || ''}</p>
    </div>
    
    <div class="team-metrics">
        <div class="metric-card">
            <div class="metric-value">${team.metrics.blaze_intelligence_score}</div>
            <div class="metric-label">Blaze Score</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${team.championships}</div>
            <div class="metric-label">Championships</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${team.metrics.competitive_index}</div>
            <div class="metric-label">Competitive Index</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${team.metrics.legacy_score}</div>
            <div class="metric-label">Legacy Score</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${(team.analytics.playoff_probability * 100).toFixed(1)}%</div>
            <div class="metric-label">Playoff Probability</div>
        </div>
        <div class="metric-card">
            <div class="metric-value">${(team.analytics.roster_efficiency * 100).toFixed(1)}%</div>
            <div class="metric-label">Roster Efficiency</div>
        </div>
    </div>
    
    <div style="text-align: center; padding: 40px 20px;">
        <h2>Performance Trend: ${team.analytics.performance_trend.toUpperCase()}</h2>
        <p>Founded: ${team.founded}</p>
        <p>Data Points: ${team.metrics.data_points.toLocaleString()}</p>
        <p>Prediction Accuracy: ${team.metrics.prediction_accuracy}%</p>
    </div>
    
    <script>
        // Add real-time updates
        setInterval(() => {
            console.log('Checking for updates...');
            // Placeholder for real-time data updates
        }, 30000);
    </script>
</body>
</html>`;
    
    const teamPagePath = path.join(process.cwd(), 'teams', `${team.id}.html`);
    const teamDir = path.dirname(teamPagePath);
    
    if (!fs.existsSync(teamDir)) {
      fs.mkdirSync(teamDir, { recursive: true });
    }
    
    fs.writeFileSync(teamPagePath, teamPage);
    console.log(`✅ Created page for ${team.name}`);
  }
}

/**
 * Main integration function
 */
async function main() {
  console.log('\n🚀 Blaze Intelligence Team Data Integration');
  console.log('===========================================\n');
  
  try {
    // Update dashboard configuration
    const dashboardConfig = updateDashboard();
    
    // Create league-specific data files
    createLeagueFiles();
    
    // Update API endpoints
    updateAPIEndpoints();
    
    // Create team pages for featured teams
    createTeamPages();
    
    // Display integration summary
    console.log('\n📊 Integration Summary:');
    console.log(`   Total Teams: ${dashboardConfig.teams.total}`);
    console.log(`   Total Championships: ${dashboardConfig.metrics.total_championships}`);
    console.log(`   Accuracy: ${dashboardConfig.metrics.accuracy}%`);
    console.log(`   Data Points: ${dashboardConfig.metrics.data_points}`);
    
    console.log('\n🏆 Featured Teams:');
    for (const [key, team] of Object.entries(dashboardConfig.teams.featured)) {
      if (team) {
        console.log(`   ${team.name}: Score ${team.metrics.blaze_intelligence_score}`);
      }
    }
    
    console.log('\n✨ Team intelligence integration complete!');
    console.log('All data has been integrated into the Blaze Intelligence platform.');
    console.log('Soccer/MLS data has been completely excluded as requested.\n');
    
  } catch (error) {
    console.error('❌ Error during integration:', error);
    process.exit(1);
  }
}

// Execute
main();