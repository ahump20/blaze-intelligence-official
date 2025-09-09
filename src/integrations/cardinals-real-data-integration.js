// Cardinals Real Data Integration - Server-side MLB data fetching
// Located: src/integrations/cardinals-real-data-integration.js
// Implements GET /api/mlb/cardinals/summary with 300s caching

class CardinalsDataIntegration {
    constructor() {
        this.STATSAPI_BASE = 'https://statsapi.mlb.com/api/v1';
        this.CARDINALS_ID = 138; // St. Louis Cardinals team ID
        this.cache = new Map();
        this.cacheTimeout = 300000; // 300 seconds = 5 minutes
    }

    // Main summary endpoint implementation
    async getCardinalsSummary() {
        const cacheKey = 'cardinals_summary';
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return {
                    success: true,
                    data: cached.data,
                    fromCache: true,
                    timestamp: cached.timestamp
                };
            }
        }

        try {
            // Fetch multiple data sources concurrently
            const [teamInfo, roster, schedule, standings, stats] = await Promise.allSettled([
                this.fetchTeamInfo(),
                this.fetchRoster(),
                this.fetchRecentSchedule(),
                this.fetchStandings(),
                this.fetchTeamStats()
            ]);

            // Compile successful data
            const summary = {
                team: teamInfo.status === 'fulfilled' ? teamInfo.value : null,
                roster: roster.status === 'fulfilled' ? roster.value : null,
                recentGames: schedule.status === 'fulfilled' ? schedule.value : null,
                standings: standings.status === 'fulfilled' ? standings.value : null,
                statistics: stats.status === 'fulfilled' ? stats.value : null,
                lastUpdated: new Date().toISOString(),
                dataQuality: {
                    teamInfo: teamInfo.status === 'fulfilled',
                    roster: roster.status === 'fulfilled',
                    schedule: schedule.status === 'fulfilled',
                    standings: standings.status === 'fulfilled',
                    stats: stats.status === 'fulfilled'
                }
            };

            // Cache successful response
            this.cache.set(cacheKey, {
                data: summary,
                timestamp: Date.now()
            });

            return {
                success: true,
                data: summary,
                fromCache: false,
                timestamp: Date.now()
            };

        } catch (error) {
            console.error('Cardinals data integration error:', error);
            
            // Return cached data if available, even if stale
            if (this.cache.has(cacheKey)) {
                const cached = this.cache.get(cacheKey);
                return {
                    success: false,
                    data: cached.data,
                    error: error.message,
                    fromCache: true,
                    stale: true,
                    timestamp: cached.timestamp
                };
            }

            return {
                success: false,
                error: error.message,
                data: null
            };
        }
    }

    // Fetch basic team information
    async fetchTeamInfo() {
        const url = `${this.STATSAPI_BASE}/teams/${this.CARDINALS_ID}`;
        const response = await this.makeRequest(url);
        
        if (response.teams && response.teams[0]) {
            const team = response.teams[0];
            return {
                id: team.id,
                name: team.name,
                displayName: team.displayName,
                abbreviation: team.abbreviation,
                division: team.division?.name,
                league: team.league?.name,
                venue: team.venue?.name,
                city: team.locationName,
                founded: team.firstYearOfPlay
            };
        }
        return null;
    }

    // Fetch current roster with key players
    async fetchRoster() {
        const url = `${this.STATSAPI_BASE}/teams/${this.CARDINALS_ID}/roster`;
        const response = await this.makeRequest(url);
        
        if (response.roster) {
            const keyPlayers = response.roster
                .filter(player => ['Pitcher', 'Catcher', 'First Baseman', 'Shortstop'].includes(player.position?.name))
                .slice(0, 10)
                .map(player => ({
                    id: player.person?.id,
                    fullName: player.person?.fullName,
                    position: player.position?.name,
                    jerseyNumber: player.jerseyNumber,
                    status: player.status?.description
                }));
            
            return {
                totalPlayers: response.roster.length,
                keyPlayers
            };
        }
        return null;
    }

    // Fetch recent games (last 10)
    async fetchRecentSchedule() {
        const endDate = new Date().toISOString().split('T')[0];
        const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]; // 30 days ago
        
        const url = `${this.STATSAPI_BASE}/schedule?teamId=${this.CARDINALS_ID}&startDate=${startDate}&endDate=${endDate}&limit=10`;
        const response = await this.makeRequest(url);
        
        if (response.dates) {
            const recentGames = [];
            
            response.dates.forEach(date => {
                date.games.forEach(game => {
                    const isHome = game.teams.home.team.id === this.CARDINALS_ID;
                    const opponent = isHome ? game.teams.away.team : game.teams.home.team;
                    
                    recentGames.push({
                        gameId: game.gamePk,
                        date: game.gameDate,
                        opponent: opponent.name,
                        opponentAbbrev: opponent.abbreviation,
                        isHome: isHome,
                        status: game.status?.abstractGameState,
                        score: game.teams ? {
                            cardinals: isHome ? game.teams.home.score : game.teams.away.score,
                            opponent: isHome ? game.teams.away.score : game.teams.home.score
                        } : null
                    });
                });
            });
            
            return recentGames.slice(0, 10);
        }
        return [];
    }

    // Fetch current standings
    async fetchStandings() {
        const year = new Date().getFullYear();
        const url = `${this.STATSAPI_BASE}/standings?leagueId=104&season=${year}&standingsTypes=regularSeason`;
        const response = await this.makeRequest(url);
        
        if (response.records) {
            for (const division of response.records) {
                const cardinals = division.teamRecords?.find(team => team.team.id === this.CARDINALS_ID);
                if (cardinals) {
                    return {
                        wins: cardinals.wins,
                        losses: cardinals.losses,
                        winningPercentage: cardinals.winningPercentage,
                        divisionRank: cardinals.divisionRank,
                        gamesBack: cardinals.gamesBack,
                        divisionName: division.division?.name
                    };
                }
            }
        }
        return null;
    }

    // Fetch team statistics
    async fetchTeamStats() {
        const year = new Date().getFullYear();
        const url = `${this.STATSAPI_BASE}/teams/${this.CARDINALS_ID}/stats?season=${year}&group=hitting,pitching`;
        const response = await this.makeRequest(url);
        
        const stats = {
            hitting: {},
            pitching: {}
        };
        
        if (response.stats) {
            response.stats.forEach(statGroup => {
                if (statGroup.group?.displayName === 'hitting' && statGroup.splits?.[0]) {
                    const hitting = statGroup.splits[0].stat;
                    stats.hitting = {
                        avg: hitting.avg,
                        homeRuns: hitting.homeRuns,
                        rbi: hitting.rbi,
                        runs: hitting.runs,
                        hits: hitting.hits
                    };
                }
                
                if (statGroup.group?.displayName === 'pitching' && statGroup.splits?.[0]) {
                    const pitching = statGroup.splits[0].stat;
                    stats.pitching = {
                        era: pitching.era,
                        whip: pitching.whip,
                        strikeOuts: pitching.strikeOuts,
                        wins: pitching.wins,
                        saves: pitching.saves
                    };
                }
            });
        }
        
        return stats;
    }

    // Generic request method with error handling
    async makeRequest(url, options = {}) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal,
                headers: {
                    'Accept': 'application/json',
                    'User-Agent': 'BlazeIntelligence/1.0',
                    ...options.headers
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limited by MLB Stats API');
                }
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error('Request timeout');
            }
            throw error;
        }
    }

    // Health check method
    async healthCheck() {
        try {
            const url = `${this.STATSAPI_BASE}/teams/${this.CARDINALS_ID}`;
            const response = await this.makeRequest(url);
            return {
                status: 'healthy',
                responseTime: Date.now(),
                dataAvailable: !!response.teams?.[0]
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message,
                responseTime: Date.now()
            };
        }
    }

    // Express route handler
    createExpressRoute() {
        return async (req, res) => {
            try {
                const result = await this.getCardinalsSummary();
                
                // Set cache headers
                if (result.fromCache) {
                    res.set('X-Cache', 'HIT');
                } else {
                    res.set('X-Cache', 'MISS');
                }
                
                res.set('Cache-Control', 'public, max-age=300'); // 5 minutes client cache
                
                if (result.success) {
                    res.json(result);
                } else {
                    // Return 503 if no data available at all
                    if (!result.data) {
                        res.status(503).json({
                            error: 'Service temporarily unavailable',
                            message: result.error,
                            demoMode: true
                        });
                    } else {
                        // Return stale data with warning
                        res.status(206).json({
                            ...result,
                            warning: 'Using cached data due to API issues'
                        });
                    }
                }
            } catch (error) {
                console.error('Cardinals API route error:', error);
                res.status(500).json({
                    error: 'Internal server error',
                    demoMode: true
                });
            }
        };
    }
}

// Export for ES6 modules
export default CardinalsDataIntegration;

// Browser environment
if (typeof window !== 'undefined') {
    window.CardinalsDataIntegration = CardinalsDataIntegration;
}