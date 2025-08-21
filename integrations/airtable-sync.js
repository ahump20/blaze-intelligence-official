#!/usr/bin/env node

// Blaze Intelligence - Airtable Integration
// Syncs sports analytics data with Airtable base

const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

class AirtableSync {
    constructor() {
        this.apiKey = process.env.AIRTABLE_API_KEY;
        this.baseId = process.env.AIRTABLE_BASE_ID || 'app4zaMcAmxXyRRVf';
        this.baseUrl = `https://api.airtable.com/v0/${this.baseId}`;
        
        if (!this.apiKey) {
            console.error('❌ AIRTABLE_API_KEY not found in .env');
            process.exit(1);
        }
        
        this.headers = {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json'
        };
    }

    async initialize() {
        console.log('🔄 Initializing Airtable sync...');
        
        // Create tables if they don't exist
        await this.ensureTables();
        
        // Start syncing
        await this.syncAllData();
        
        console.log('✅ Airtable sync complete');
    }

    async ensureTables() {
        const tables = [
            'Cardinals_Analytics',
            'Titans_Analytics',
            'Longhorns_Analytics',
            'Grizzlies_Analytics',
            'Player_Rankings',
            'Game_Predictions',
            'Leads'
        ];
        
        for (const table of tables) {
            try {
                // Check if table exists by trying to list records
                await axios.get(`${this.baseUrl}/${table}`, {
                    headers: this.headers,
                    params: { maxRecords: 1 }
                });
                console.log(`✅ Table exists: ${table}`);
            } catch (error) {
                if (error.response?.status === 404) {
                    console.log(`📝 Table not found: ${table} (create manually in Airtable)`);
                }
            }
        }
    }

    async syncAllData() {
        // Sync Cardinals readiness data
        await this.syncCardinalsData();
        
        // Sync real-time team data
        await this.syncTeamAnalytics();
        
        // Sync player rankings
        await this.syncPlayerRankings();
        
        // Sync leads if any
        await this.syncLeads();
    }

    async syncCardinalsData() {
        try {
            console.log('📊 Syncing Cardinals readiness data...');
            
            // Read latest readiness data
            const readinessPath = path.join(__dirname, '..', 'src', 'data', 'readiness.json');
            const data = JSON.parse(await fs.readFile(readinessPath, 'utf8'));
            
            // Transform for Airtable
            const record = {
                fields: {
                    'Team': 'St. Louis Cardinals',
                    'Timestamp': data.timestamp,
                    'Overall_Readiness': data.readiness.overall,
                    'Offensive_Score': data.readiness.offense.batting,
                    'Defensive_Score': data.readiness.defense.fielding,
                    'Pitching_Score': data.readiness.pitching.rotation,
                    'Win_Probability': data.predictions.winProbability,
                    'Championship_Odds': data.blazeIntelligence.championshipOdds,
                    'Playoff_Probability': data.blazeIntelligence.playoffProbability,
                    'Key_Factors': data.predictions.keyFactors.join('; '),
                    'Recommendations': data.predictions.recommendations.join('; '),
                    'Data_Quality': data.metadata.dataQuality,
                    'Next_Update': data.metadata.nextUpdate
                }
            };
            
            // Create or update record
            const response = await axios.post(
                `${this.baseUrl}/Cardinals_Analytics`,
                { records: [record] },
                { headers: this.headers }
            );
            
            console.log(`✅ Cardinals data synced: ${response.data.records[0].id}`);
            
        } catch (error) {
            console.error('❌ Failed to sync Cardinals data:', error.message);
        }
    }

    async syncTeamAnalytics() {
        const teams = [
            { file: 'mlb_realtime.json', table: 'Cardinals_Analytics' },
            { file: 'nfl_realtime.json', table: 'Titans_Analytics' },
            { file: 'ncaa_realtime.json', table: 'Longhorns_Analytics' },
            { file: 'nba_realtime.json', table: 'Grizzlies_Analytics' }
        ];
        
        for (const team of teams) {
            try {
                const filePath = path.join(__dirname, '..', 'src', 'data', 'analytics', team.file);
                
                // Check if file exists
                try {
                    await fs.access(filePath);
                } catch {
                    console.log(`⏭️  Skipping ${team.file} (not found)`);
                    continue;
                }
                
                const data = JSON.parse(await fs.readFile(filePath, 'utf8'));
                
                // Transform based on sport
                const record = this.transformTeamData(data, team.table);
                
                // Sync to Airtable
                await axios.post(
                    `${this.baseUrl}/${team.table}`,
                    { records: [record] },
                    { headers: this.headers }
                );
                
                console.log(`✅ Synced ${team.table}`);
                
            } catch (error) {
                console.error(`❌ Failed to sync ${team.table}:`, error.message);
            }
        }
    }

    transformTeamData(data, tableName) {
        // Base fields common to all teams
        const baseFields = {
            'Team': data.team,
            'League': data.league,
            'Timestamp': data.timestamp,
            'Data_Source': 'Blaze Intelligence Pipeline'
        };
        
        // Add sport-specific fields
        if (data.record) {
            baseFields['Wins'] = data.record.wins;
            baseFields['Losses'] = data.record.losses;
        }
        
        if (data.nextGame) {
            baseFields['Next_Game_Date'] = data.nextGame.date;
            baseFields['Next_Opponent'] = data.nextGame.opponent;
            baseFields['Home_Away'] = data.nextGame.home ? 'Home' : 'Away';
        }
        
        if (data.blazeIntelligence) {
            baseFields['Championship_Probability'] = data.blazeIntelligence.championshipProbability;
            baseFields['Performance_Index'] = data.blazeIntelligence.performanceIndex;
            baseFields['Momentum_Score'] = data.blazeIntelligence.momentumScore;
            baseFields['Market_Value'] = data.blazeIntelligence.marketValue;
        }
        
        // Add key players as text field
        if (data.keyPlayers && data.keyPlayers.length > 0) {
            baseFields['Key_Players'] = data.keyPlayers
                .map(p => `${p.name} (${p.position})`)
                .join(', ');
        }
        
        return { fields: baseFields };
    }

    async syncPlayerRankings() {
        try {
            console.log('🏆 Syncing player rankings...');
            
            // Read player data if exists
            const playerPath = path.join(__dirname, '..', 'site', 'src', 'data', 'player_data_2025.json');
            
            try {
                const players = JSON.parse(await fs.readFile(playerPath, 'utf8'));
                
                // Take top 10 players
                const topPlayers = players.slice(0, 10);
                
                const records = topPlayers.map(player => ({
                    fields: {
                        'Name': player.name,
                        'Sport': player.sport,
                        'Position': player.position,
                        'Team': player.team,
                        'Score': player.cee || player.score || 0,
                        'Rank': player.rank || 0,
                        'Updated': new Date().toISOString()
                    }
                }));
                
                // Batch create records
                for (const record of records) {
                    await axios.post(
                        `${this.baseUrl}/Player_Rankings`,
                        { records: [record] },
                        { headers: this.headers }
                    );
                }
                
                console.log(`✅ Synced ${records.length} player rankings`);
                
            } catch (error) {
                console.log('⏭️  No player rankings to sync');
            }
            
        } catch (error) {
            console.error('❌ Failed to sync player rankings:', error.message);
        }
    }

    async syncLeads() {
        console.log('📧 Checking for leads to sync...');
        
        // This would connect to D1 database in production
        // For now, we'll skip if no local lead data
        console.log('⏭️  Lead sync requires Cloudflare D1 connection');
    }

    async createView(tableName, viewName, formula) {
        // Airtable views must be created in the UI
        console.log(`ℹ️  Create view '${viewName}' in table '${tableName}' with formula: ${formula}`);
    }

    async setupAutomations() {
        console.log('🤖 Suggested Airtable Automations:');
        console.log('  1. When Cardinals readiness > 90, send Slack notification');
        console.log('  2. When new lead created, trigger Zapier webhook');
        console.log('  3. Daily digest of team performance metrics');
        console.log('  4. Alert when championship odds increase by 10%+');
    }
}

// Run if executed directly
if (require.main === module) {
    const sync = new AirtableSync();
    
    sync.initialize().catch(error => {
        console.error('Fatal error:', error);
        process.exit(1);
    });
    
    // Set up periodic sync
    if (process.argv.includes('--watch')) {
        console.log('📡 Running in watch mode (syncing every 30 minutes)...');
        setInterval(() => {
            sync.syncAllData().catch(console.error);
        }, 30 * 60 * 1000);
    }
}

module.exports = AirtableSync;