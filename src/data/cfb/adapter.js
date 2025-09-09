// College Football Data Adapter
import axios from 'axios';
import cache from '../cache.js';

class CFBAdapter {
    constructor() {
        this.source = 'CollegeFootballData API';
        this.apiKey = process.env.CFB_API_KEY;
        this.baseUrl = 'https://api.collegefootballdata.com';
    }

    async getTeamSummary(team) {
        const cacheKey = `cfb_team_${team}`;
        
        return cache.getOrFetch(cacheKey, async () => {
            // Demo data for Texas teams
            const demoTeams = {
                'Texas': {
                    school: 'University of Texas',
                    mascot: 'Longhorns',
                    conference: 'SEC',
                    wins: 8,
                    losses: 1,
                    ranking: 1,
                    pointsFor: 342,
                    pointsAgainst: 189
                },
                'Texas A&M': {
                    school: 'Texas A&M University',
                    mascot: 'Aggies',
                    conference: 'SEC',
                    wins: 7,
                    losses: 2,
                    ranking: 8,
                    pointsFor: 298,
                    pointsAgainst: 201
                },
                'Baylor': {
                    school: 'Baylor University',
                    mascot: 'Bears',
                    conference: 'Big 12',
                    wins: 6,
                    losses: 3,
                    ranking: 18,
                    pointsFor: 276,
                    pointsAgainst: 234
                }
            };

            const teamData = demoTeams[team] || {};
            
            return {
                school: teamData.school,
                mascot: teamData.mascot,
                conference: teamData.conference,
                wins: teamData.wins,
                losses: teamData.losses,
                winPct: (teamData.wins / (teamData.wins + teamData.losses)).toFixed(3),
                ranking: teamData.ranking,
                pointsFor: teamData.pointsFor,
                pointsAgainst: teamData.pointsAgainst,
                lastUpdated: new Date().toISOString(),
                source: this.source,
                season: 2025,
                dataType: 'demo'
            };

            /* Real API implementation:
            try {
                const headers = { 
                    'Authorization': `Bearer ${this.apiKey}`,
                    'Accept': 'application/json'
                };
                
                const year = new Date().getFullYear();
                const [teamInfo, record] = await Promise.all([
                    axios.get(`${this.baseUrl}/teams`, { 
                        headers, 
                        params: { school: team }
                    }),
                    axios.get(`${this.baseUrl}/records`, { 
                        headers, 
                        params: { year, team }
                    })
                ]);

                return this.formatTeamData(teamInfo.data[0], record.data[0]);
            } catch (error) {
                console.error('CFB API Error:', error);
                throw error;
            }
            */
        });
    }

    async getPlayerSummary(playerName) {
        const cacheKey = `cfb_player_${playerName.replace(/\s/g, '_')}`;
        
        return cache.getOrFetch(cacheKey, async () => {
            // Demo player data
            const demoPlayers = {
                'Quinn_Ewers': {
                    name: 'Quinn Ewers',
                    team: 'Texas',
                    position: 'QB',
                    year: 'Senior',
                    stats: {
                        passingYards: 2847,
                        passingTDs: 28,
                        interceptions: 3,
                        qbr: 92.8,
                        completionPct: 71.4
                    }
                },
                'Carson_Beck': {
                    name: 'Carson Beck',
                    team: 'Georgia',
                    position: 'QB',
                    year: 'Senior',
                    stats: {
                        passingYards: 2654,
                        passingTDs: 24,
                        interceptions: 7,
                        qbr: 88.3,
                        completionPct: 67.8
                    }
                }
            };

            const player = demoPlayers[playerName.replace(/\s/g, '_')] || {};
            
            return {
                name: player.name,
                team: player.team,
                position: player.position,
                year: player.year,
                stats: player.stats,
                lastUpdated: new Date().toISOString(),
                source: this.source,
                season: 2025,
                dataType: 'demo'
            };
        });
    }

    async getLiveGames() {
        const cacheKey = 'cfb_live_games';
        
        return cache.getOrFetch(cacheKey, async () => {
            // Demo live games
            return [
                {
                    id: 'cfb_001',
                    homeTeam: 'Texas',
                    awayTeam: 'Texas A&M',
                    homeScore: 28,
                    awayScore: 14,
                    quarter: 2,
                    timeRemaining: '3:42',
                    possession: 'TEX',
                    status: 'InProgress',
                    lastUpdated: new Date().toISOString(),
                    source: this.source,
                    dataType: 'demo'
                }
            ];
        }, { ttl: 60 });
    }

    async getRankings(limit = 25) {
        const cacheKey = `cfb_rankings_${limit}`;
        
        return cache.getOrFetch(cacheKey, async () => {
            // Demo rankings
            const rankings = [
                { rank: 1, school: 'Texas', record: '8-1', points: 1550 },
                { rank: 2, school: 'Georgia', record: '8-1', points: 1492 },
                { rank: 3, school: 'Oregon', record: '8-1', points: 1431 },
                { rank: 4, school: 'Penn State', record: '7-2', points: 1368 },
                { rank: 5, school: 'Notre Dame', record: '8-1', points: 1289 },
                { rank: 8, school: 'Texas A&M', record: '7-2', points: 1087 },
                { rank: 18, school: 'Baylor', record: '6-3', points: 542 },
                { rank: 25, school: 'Texas Tech', record: '5-4', points: 218 }
            ];

            return {
                poll: 'AP Top 25',
                week: Math.floor((Date.now() - new Date('2025-08-31').getTime()) / (7 * 24 * 60 * 60 * 1000)),
                rankings: rankings.slice(0, limit),
                lastUpdated: new Date().toISOString(),
                source: this.source,
                season: 2025,
                dataType: 'demo'
            };
        });
    }
}

export default new CFBAdapter();