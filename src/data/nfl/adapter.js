// NFL Data Adapter - Using demo data with structure for real API
import axios from 'axios';
import cache from '../cache.js';

class NFLAdapter {
    constructor() {
        this.source = 'NFL Data Provider';
        this.apiKey = process.env.NFL_API_KEY;
        this.baseUrl = 'https://api.sportsdata.io/v3/nfl'; // Example provider
    }

    async getTeamSummary(teamAbbr) {
        const cacheKey = `nfl_team_${teamAbbr}`;
        
        return cache.getOrFetch(cacheKey, async () => {
            // Demo data structure matching real API response
            // Replace with actual API call when credentials are available
            const demoTeams = {
                'DAL': { 
                    name: 'Dallas Cowboys', 
                    wins: 7, losses: 2, 
                    division: 'NFC East',
                    pointsFor: 245, 
                    pointsAgainst: 168 
                },
                'HOU': { 
                    name: 'Houston Texans', 
                    wins: 6, losses: 3, 
                    division: 'AFC South',
                    pointsFor: 212, 
                    pointsAgainst: 189 
                },
                'KC': { 
                    name: 'Kansas City Chiefs', 
                    wins: 8, losses: 1, 
                    division: 'AFC West',
                    pointsFor: 268, 
                    pointsAgainst: 172 
                }
            };

            const team = demoTeams[teamAbbr] || {};
            
            return {
                abbreviation: teamAbbr,
                name: team.name,
                wins: team.wins,
                losses: team.losses,
                winPct: (team.wins / (team.wins + team.losses)).toFixed(3),
                division: team.division,
                pointsFor: team.pointsFor,
                pointsAgainst: team.pointsAgainst,
                differential: team.pointsFor - team.pointsAgainst,
                lastUpdated: new Date().toISOString(),
                source: this.source,
                season: '2025-2026',
                dataType: 'demo' // Remove when using real API
            };

            /* Real API implementation:
            try {
                const headers = { 'Ocp-Apim-Subscription-Key': this.apiKey };
                const response = await axios.get(
                    `${this.baseUrl}/scores/json/Teams/${teamAbbr}`,
                    { headers }
                );
                return this.formatTeamData(response.data);
            } catch (error) {
                console.error('NFL API Error:', error);
                throw error;
            }
            */
        });
    }

    async getPlayerSummary(playerName) {
        const cacheKey = `nfl_player_${playerName.replace(/\s/g, '_')}`;
        
        return cache.getOrFetch(cacheKey, async () => {
            // Demo data structure
            const demoPlayers = {
                'Dak_Prescott': {
                    name: 'Dak Prescott',
                    team: 'DAL',
                    position: 'QB',
                    stats: {
                        passingYards: 2184,
                        passingTDs: 18,
                        interceptions: 4,
                        qbr: 112.3
                    }
                },
                'CeeDee_Lamb': {
                    name: 'CeeDee Lamb',
                    team: 'DAL',
                    position: 'WR',
                    stats: {
                        receptions: 58,
                        receivingYards: 842,
                        receivingTDs: 7,
                        yardsPerReception: 14.5
                    }
                }
            };

            const player = demoPlayers[playerName.replace(/\s/g, '_')] || {};
            
            return {
                name: player.name,
                team: player.team,
                position: player.position,
                stats: player.stats,
                lastUpdated: new Date().toISOString(),
                source: this.source,
                season: '2025-2026',
                dataType: 'demo'
            };
        });
    }

    async getLiveGames() {
        const cacheKey = 'nfl_live_games';
        
        return cache.getOrFetch(cacheKey, async () => {
            // Demo live games data
            return [
                {
                    id: 'nfl_001',
                    homeTeam: 'Dallas Cowboys',
                    awayTeam: 'Philadelphia Eagles',
                    homeScore: 21,
                    awayScore: 17,
                    quarter: 3,
                    timeRemaining: '8:24',
                    possession: 'DAL',
                    status: 'InProgress',
                    lastUpdated: new Date().toISOString(),
                    source: this.source,
                    dataType: 'demo'
                }
            ];
        }, { ttl: 60 }); // 1 minute cache for live games
    }

    async getStandings(conference = 'AFC') {
        const cacheKey = `nfl_standings_${conference}`;
        
        return cache.getOrFetch(cacheKey, async () => {
            // Demo standings
            const standings = conference === 'AFC' ? [
                { team: 'Kansas City Chiefs', wins: 8, losses: 1, division: 'West' },
                { team: 'Buffalo Bills', wins: 7, losses: 2, division: 'East' },
                { team: 'Baltimore Ravens', wins: 7, losses: 2, division: 'North' },
                { team: 'Houston Texans', wins: 6, losses: 3, division: 'South' }
            ] : [
                { team: 'Dallas Cowboys', wins: 7, losses: 2, division: 'East' },
                { team: 'Philadelphia Eagles', wins: 6, losses: 3, division: 'East' },
                { team: 'San Francisco 49ers', wins: 5, losses: 4, division: 'West' }
            ];

            return {
                conference,
                standings: standings.map(team => ({
                    ...team,
                    pct: (team.wins / (team.wins + team.losses)).toFixed(3)
                })),
                lastUpdated: new Date().toISOString(),
                source: this.source,
                season: '2025-2026',
                dataType: 'demo'
            };
        });
    }
}

export default new NFLAdapter();