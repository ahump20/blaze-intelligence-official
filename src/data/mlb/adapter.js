// MLB Data Adapter - MLB Stats API (public)
import axios from 'axios';
import cache from '../cache.js';

const MLB_API_BASE = 'https://statsapi.mlb.com/api/v1';

class MLBAdapter {
    constructor() {
        this.source = 'MLB Stats API';
        this.apiKey = process.env.MLB_STATS_API_KEY;
    }

    async getTeamSummary(teamId) {
        const cacheKey = `mlb_team_${teamId}`;
        
        return cache.getOrFetch(cacheKey, async () => {
            try {
                // Get team info
                const teamResponse = await axios.get(`${MLB_API_BASE}/teams/${teamId}`);
                const team = teamResponse.data.teams[0];

                // Get current season standings
                const currentYear = new Date().getFullYear();
                const standingsResponse = await axios.get(
                    `${MLB_API_BASE}/standings?leagueId=103,104&season=${currentYear}&standingTypes=regularSeason`
                );

                // Find team in standings
                let teamStanding = null;
                for (const record of standingsResponse.data.records) {
                    const found = record.teamRecords.find(t => t.team.id === teamId);
                    if (found) {
                        teamStanding = found;
                        break;
                    }
                }

                return {
                    id: team.id,
                    name: team.name,
                    abbreviation: team.abbreviation,
                    division: team.division?.name,
                    league: team.league?.name,
                    wins: teamStanding?.wins || 0,
                    losses: teamStanding?.losses || 0,
                    winPct: teamStanding?.winningPercentage || '.000',
                    gamesBack: teamStanding?.gamesBack || '-',
                    streak: teamStanding?.streak?.streakCode || '-',
                    lastUpdated: new Date().toISOString(),
                    source: this.source,
                    season: currentYear
                };
            } catch (error) {
                console.error('MLB API Error:', error);
                throw new Error('Failed to fetch MLB team data');
            }
        });
    }

    async getPlayerSummary(playerId) {
        const cacheKey = `mlb_player_${playerId}`;
        
        return cache.getOrFetch(cacheKey, async () => {
            try {
                // Get player info
                const playerResponse = await axios.get(`${MLB_API_BASE}/people/${playerId}`);
                const player = playerResponse.data.people[0];

                // Get current season stats
                const currentYear = new Date().getFullYear();
                const statsResponse = await axios.get(
                    `${MLB_API_BASE}/people/${playerId}/stats?stats=season&season=${currentYear}&group=hitting,pitching`
                );

                let stats = {};
                if (statsResponse.data.stats && statsResponse.data.stats[0]) {
                    const seasonStats = statsResponse.data.stats[0].splits[0]?.stat || {};
                    
                    // Hitting stats
                    if (seasonStats.avg !== undefined) {
                        stats = {
                            avg: seasonStats.avg || '.000',
                            hr: seasonStats.homeRuns || 0,
                            rbi: seasonStats.rbi || 0,
                            sb: seasonStats.stolenBases || 0,
                            ops: seasonStats.ops || '.000',
                            hits: seasonStats.hits || 0,
                            runs: seasonStats.runs || 0
                        };
                    }
                    // Pitching stats
                    else if (seasonStats.era !== undefined) {
                        stats = {
                            era: seasonStats.era || '0.00',
                            wins: seasonStats.wins || 0,
                            losses: seasonStats.losses || 0,
                            so: seasonStats.strikeOuts || 0,
                            whip: seasonStats.whip || '0.00',
                            saves: seasonStats.saves || 0
                        };
                    }
                }

                return {
                    id: player.id,
                    name: player.fullName,
                    team: player.currentTeam?.name,
                    position: player.primaryPosition?.abbreviation,
                    number: player.primaryNumber,
                    stats: stats,
                    lastUpdated: new Date().toISOString(),
                    source: this.source,
                    season: currentYear
                };
            } catch (error) {
                console.error('MLB API Error:', error);
                throw new Error('Failed to fetch MLB player data');
            }
        });
    }

    async getLiveGames() {
        const cacheKey = 'mlb_live_games';
        
        return cache.getOrFetch(cacheKey, async () => {
            try {
                const today = new Date().toISOString().split('T')[0];
                const scheduleResponse = await axios.get(
                    `${MLB_API_BASE}/schedule?sportId=1&date=${today}`
                );

                const games = scheduleResponse.data.dates[0]?.games || [];
                
                return games.map(game => ({
                    id: game.gamePk,
                    homeTeam: game.teams.home.team.name,
                    awayTeam: game.teams.away.team.name,
                    homeScore: game.teams.home.score || 0,
                    awayScore: game.teams.away.score || 0,
                    status: game.status.detailedState,
                    inning: game.linescore?.currentInning || 0,
                    inningState: game.linescore?.inningState || '',
                    lastUpdated: new Date().toISOString(),
                    source: this.source
                }));
            } catch (error) {
                console.error('MLB API Error:', error);
                return [];
            }
        }, { ttl: 60 }); // 1 minute cache for live games
    }

    async getStandings(league = 'AL') {
        const cacheKey = `mlb_standings_${league}`;
        
        return cache.getOrFetch(cacheKey, async () => {
            try {
                const currentYear = new Date().getFullYear();
                const leagueId = league === 'AL' ? 103 : 104;
                
                const response = await axios.get(
                    `${MLB_API_BASE}/standings?leagueId=${leagueId}&season=${currentYear}`
                );

                const standings = [];
                for (const record of response.data.records) {
                    for (const team of record.teamRecords) {
                        standings.push({
                            team: team.team.name,
                            wins: team.wins,
                            losses: team.losses,
                            pct: team.winningPercentage,
                            gamesBack: team.gamesBack,
                            division: record.division.name
                        });
                    }
                }

                return {
                    league,
                    standings: standings.sort((a, b) => parseFloat(b.pct) - parseFloat(a.pct)),
                    lastUpdated: new Date().toISOString(),
                    source: this.source,
                    season: currentYear
                };
            } catch (error) {
                console.error('MLB API Error:', error);
                throw new Error('Failed to fetch MLB standings');
            }
        });
    }
}

export default new MLBAdapter();