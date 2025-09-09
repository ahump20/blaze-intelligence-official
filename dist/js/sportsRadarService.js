// SportsRadar API Integration Service
class SportsRadarService {
    constructor() {
        this.baseUrl = 'https://api.sportradar.us';
        this.apiKey = process.env.SPORTSRADAR_API_KEY || 'demo'; // Will be set server-side
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
    }

    // Helper method to make API calls with caching
    async apiCall(endpoint) {
        const cacheKey = endpoint;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        try {
            // This will be proxied through our server for security
            const response = await fetch(`/api/sportsradar${endpoint}`);
            if (!response.ok) {
                throw new Error(`SportsRadar API error: ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            return data;
        } catch (error) {
            console.warn('SportsRadar API call failed:', error);
            return null;
        }
    }

    // MLB Methods
    async getMLBTeams() {
        return await this.apiCall('/mlb/trial/v7/en/league/hierarchy.json');
    }

    async getMLBStandings() {
        const year = new Date().getFullYear();
        return await this.apiCall(`/mlb/trial/v7/en/seasons/${year}/REG/standings.json`);
    }

    async getMLBGames(date = null) {
        const gameDate = date || new Date().toISOString().split('T')[0];
        return await this.apiCall(`/mlb/trial/v7/en/games/${gameDate}/schedule.json`);
    }

    async getMLBTeamProfile(teamId) {
        return await this.apiCall(`/mlb/trial/v7/en/teams/${teamId}/profile.json`);
    }

    async getMLBPlayerProfile(playerId) {
        return await this.apiCall(`/mlb/trial/v7/en/players/${playerId}/profile.json`);
    }

    // NFL Methods
    async getNFLTeams() {
        return await this.apiCall('/nfl/official/trial/v7/en/league/hierarchy.json');
    }

    async getNFLStandings() {
        const year = new Date().getFullYear();
        return await this.apiCall(`/nfl/official/trial/v7/en/seasons/${year}/REG/standings.json`);
    }

    async getNFLGames(week = null) {
        const year = new Date().getFullYear();
        const currentWeek = week || 1;
        return await this.apiCall(`/nfl/official/trial/v7/en/games/${year}/REG/${currentWeek}/schedule.json`);
    }

    async getNFLTeamProfile(teamId) {
        return await this.apiCall(`/nfl/official/trial/v7/en/teams/${teamId}/profile.json`);
    }

    // NCAA Football Methods
    async getNCAATeams() {
        return await this.apiCall('/ncaafb/trial/v7/en/league/hierarchy.json');
    }

    async getNCAAGames(date = null) {
        const gameDate = date || new Date().toISOString().split('T')[0];
        return await this.apiCall(`/ncaafb/trial/v7/en/games/${gameDate}/schedule.json`);
    }

    async getNCAAStandings() {
        const year = new Date().getFullYear();
        return await this.apiCall(`/ncaafb/trial/v7/en/seasons/${year}/REG/standings.json`);
    }

    // Enhanced Analytics Methods
    async getTeamAnalytics(sport, teamId) {
        const endpoints = {
            mlb: `/mlb/trial/v7/en/teams/${teamId}/statistics.json`,
            nfl: `/nfl/official/trial/v7/en/teams/${teamId}/statistics.json`,
            ncaafb: `/ncaafb/trial/v7/en/teams/${teamId}/statistics.json`
        };

        return await this.apiCall(endpoints[sport]);
    }

    async getPlayerAnalytics(sport, playerId) {
        const endpoints = {
            mlb: `/mlb/trial/v7/en/players/${playerId}/statistics.json`,
            nfl: `/nfl/official/trial/v7/en/players/${playerId}/statistics.json`,
            ncaafb: `/ncaafb/trial/v7/en/players/${playerId}/statistics.json`
        };

        return await this.apiCall(endpoints[sport]);
    }

    // Data Processing Methods
    processTeamData(teams, sport) {
        if (!teams) return [];

        return teams.map(team => ({
            id: team.id,
            name: team.name,
            market: team.market,
            league: sport.toUpperCase(),
            founded: team.founded || 'Unknown',
            division: team.division?.name || 'Unknown',
            conference: team.conference?.name || '',
            venue: team.venue?.name || '',
            titles: team.championships || 0,
            competitive: this.calculateCompetitiveScore(team),
            legacy: this.calculateLegacyScore(team),
            primaryColor: team.primary_color || '#000000',
            secondaryColor: team.secondary_color || '#FFFFFF',
            logo: team.logo || '',
            website: team.website || '',
            externalLinks: this.generateExternalLinks(team.name, sport)
        }));
    }

    calculateCompetitiveScore(team) {
        // Algorithm to calculate competitive score based on recent performance
        const baseScore = 50;
        const titleMultiplier = (team.championships || 0) * 10;
        const recentPerformance = Math.random() * 50; // Would use actual stats
        
        return Math.min(300, Math.round(baseScore + titleMultiplier + recentPerformance));
    }

    calculateLegacyScore(team) {
        // Algorithm to calculate legacy score based on historical success
        const foundedYear = parseInt(team.founded) || new Date().getFullYear();
        const ageBonus = Math.max(0, (new Date().getFullYear() - foundedYear) / 2);
        const titleBonus = (team.championships || 0) * 15;
        
        return Math.min(200, Math.round(ageBonus + titleBonus));
    }

    generateExternalLinks(teamName, sport) {
        const baseUrls = {
            mlb: {
                'Baseball Reference': 'https://www.baseball-reference.com/teams/',
                'ESPN': 'https://www.espn.com/mlb/team/_/name/',
                'MLB.com': 'https://www.mlb.com/'
            },
            nfl: {
                'Pro Football Reference': 'https://www.pro-football-reference.com/teams/',
                'Pro Football Focus': 'https://www.pff.com/nfl/teams/',
                'ESPN': 'https://www.espn.com/nfl/team/_/name/',
                'NFL.com': 'https://www.nfl.com/'
            },
            ncaafb: {
                'Sports Reference': 'https://www.sports-reference.com/cfb/schools/',
                'ESPN': 'https://www.espn.com/college-football/team/_/id/',
                'NCAA.com': 'https://www.ncaa.com/'
            }
        };

        return baseUrls[sport] || {};
    }

    // Real-time data streaming
    async startLiveDataStream(callback) {
        const updateInterval = setInterval(async () => {
            try {
                const liveGames = await Promise.all([
                    this.getMLBGames(),
                    this.getNFLGames(),
                    this.getNCAAGames()
                ]);

                callback({
                    timestamp: Date.now(),
                    mlb: liveGames[0],
                    nfl: liveGames[1],
                    ncaafb: liveGames[2]
                });
            } catch (error) {
                console.warn('Live data stream error:', error);
            }
        }, 30000); // Update every 30 seconds

        return updateInterval;
    }

    // Performance metrics
    getServiceMetrics() {
        return {
            cacheSize: this.cache.size,
            apiCalls: this.apiCallCount || 0,
            lastUpdate: this.lastUpdate || null,
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportsRadarService;
} else {
    window.SportsRadarService = SportsRadarService;
}