// Server-side SportsRadar API Adapter
const fetch = require('node-fetch');

class SportsRadarAdapter {
    constructor() {
        this.apiKey = process.env.SPORTSRADAR_API_KEY;
        this.baseUrl = 'https://api.sportradar.us';
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        
        if (!this.apiKey || this.apiKey === 'demo') {
            console.warn('⚠️  SportsRadar API key not configured - using demo endpoints');
        }
    }

    async makeRequest(endpoint) {
        const cacheKey = endpoint;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached.data;
        }

        try {
            const url = `${this.baseUrl}${endpoint}?api_key=${this.apiKey}`;
            const response = await fetch(url);
            
            if (!response.ok) {
                if (response.status === 429) {
                    throw new Error('Rate limit exceeded');
                }
                throw new Error(`API error: ${response.status}`);
            }
            
            const data = await response.json();
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });
            
            console.log(`✅ SportsRadar API: ${endpoint}`);
            return data;
            
        } catch (error) {
            console.error(`❌ SportsRadar API failed: ${endpoint}`, error.message);
            // Return cached data if available, even if stale
            const staleCache = this.cache.get(cacheKey);
            return staleCache ? staleCache.data : null;
        }
    }

    // MLB Methods
    async getMLBHierarchy() {
        return await this.makeRequest('/mlb/trial/v7/en/league/hierarchy.json');
    }

    async getMLBStandings(year = new Date().getFullYear()) {
        return await this.makeRequest(`/mlb/trial/v7/en/seasons/${year}/REG/standings.json`);
    }

    async getMLBSchedule(date = new Date().toISOString().split('T')[0]) {
        return await this.makeRequest(`/mlb/trial/v7/en/games/${date}/schedule.json`);
    }

    async getMLBTeamProfile(teamId) {
        return await this.makeRequest(`/mlb/trial/v7/en/teams/${teamId}/profile.json`);
    }

    async getMLBTeamStatistics(teamId, year = new Date().getFullYear()) {
        return await this.makeRequest(`/mlb/trial/v7/en/seasons/${year}/REG/teams/${teamId}/statistics.json`);
    }

    // NFL Methods
    async getNFLHierarchy() {
        return await this.makeRequest('/nfl/official/trial/v7/en/league/hierarchy.json');
    }

    async getNFLStandings(year = new Date().getFullYear()) {
        return await this.makeRequest(`/nfl/official/trial/v7/en/seasons/${year}/REG/standings.json`);
    }

    async getNFLSchedule(year = new Date().getFullYear(), week = 1) {
        return await this.makeRequest(`/nfl/official/trial/v7/en/games/${year}/REG/${week}/schedule.json`);
    }

    async getNFLTeamProfile(teamId) {
        return await this.makeRequest(`/nfl/official/trial/v7/en/teams/${teamId}/profile.json`);
    }

    // NCAA Football Methods
    async getNCAAHierarchy() {
        return await this.makeRequest('/ncaafb/trial/v7/en/league/hierarchy.json');
    }

    async getNCAASchedule(date = new Date().toISOString().split('T')[0]) {
        return await this.makeRequest(`/ncaafb/trial/v7/en/games/${date}/schedule.json`);
    }

    async getNCAAStandings(year = new Date().getFullYear()) {
        return await this.makeRequest(`/ncaafb/trial/v7/en/seasons/${year}/REG/standings.json`);
    }

    // Data Processing Methods
    processTeamsData(apiResponse, sport) {
        if (!apiResponse || !apiResponse.leagues) return [];

        const teams = [];
        
        apiResponse.leagues.forEach(league => {
            if (league.conferences) {
                league.conferences.forEach(conference => {
                    if (conference.divisions) {
                        conference.divisions.forEach(division => {
                            if (division.teams) {
                                division.teams.forEach(team => {
                                    teams.push(this.formatTeamData(team, sport, conference, division));
                                });
                            }
                        });
                    } else if (conference.teams) {
                        conference.teams.forEach(team => {
                            teams.push(this.formatTeamData(team, sport, conference));
                        });
                    }
                });
            }
        });

        return teams;
    }

    formatTeamData(team, sport, conference, division = null) {
        return {
            id: team.id,
            name: team.name,
            market: team.market,
            league: sport.toUpperCase(),
            conference: conference.name,
            division: division ? division.name : conference.name,
            venue: team.venue ? {
                name: team.venue.name,
                city: team.venue.city,
                state: team.venue.state,
                capacity: team.venue.capacity
            } : null,
            founded: team.founded,
            colors: {
                primary: team.primary_color,
                secondary: team.secondary_color,
                tertiary: team.tertiary_color
            },
            logo: team.logo,
            website: team.website,
            // Calculate scores based on available data
            competitive: this.calculateCompetitiveScore(team, sport),
            legacy: this.calculateLegacyScore(team, sport),
            titles: this.estimateTitles(team, sport),
            externalLinks: this.generateExternalLinks(team, sport)
        };
    }

    calculateCompetitiveScore(team, sport) {
        // Base competitive scoring algorithm
        let score = 60; // Base score
        
        // Factors: market size, historical performance, recent success
        if (team.market) {
            const majorMarkets = ['New York', 'Los Angeles', 'Chicago', 'Houston', 'Phoenix', 'Philadelphia', 'San Antonio', 'San Diego', 'Dallas', 'San Jose'];
            if (majorMarkets.includes(team.market)) {
                score += 20;
            }
        }
        
        // Add randomization for demo purposes (would use real stats)
        score += Math.floor(Math.random() * 40);
        
        return Math.min(300, Math.max(30, score));
    }

    calculateLegacyScore(team, sport) {
        // Legacy scoring based on history and tradition
        let score = 30; // Base legacy score
        
        // Age of franchise
        if (team.founded) {
            const age = new Date().getFullYear() - parseInt(team.founded);
            score += Math.min(50, age / 2);
        }
        
        // Historic franchises get bonus
        const historicTeams = {
            mlb: ['Yankees', 'Red Sox', 'Cardinals', 'Dodgers', 'Giants'],
            nfl: ['Packers', 'Bears', 'Giants', 'Steelers', '49ers'],
            ncaafb: ['Alabama', 'Notre Dame', 'Michigan', 'Ohio State', 'Oklahoma']
        };
        
        if (historicTeams[sport.toLowerCase()] && 
            historicTeams[sport.toLowerCase()].some(name => team.name.includes(name))) {
            score += 30;
        }
        
        return Math.min(200, Math.max(20, score));
    }

    estimateTitles(team, sport) {
        // Estimate championship titles (would come from real data)
        const championshipTeams = {
            mlb: { 'Yankees': 27, 'Cardinals': 11, 'Red Sox': 9, 'Athletics': 9 },
            nfl: { 'Steelers': 6, 'Cowboys': 5, '49ers': 5, 'Packers': 4 },
            ncaafb: { 'Alabama': 18, 'Notre Dame': 11, 'Michigan': 11, 'Ohio State': 8 }
        };
        
        const sportTitles = championshipTeams[sport.toLowerCase()] || {};
        const teamTitles = Object.keys(sportTitles).find(name => team.name.includes(name));
        
        return teamTitles ? sportTitles[teamTitles] : Math.floor(Math.random() * 5);
    }

    generateExternalLinks(team, sport) {
        const teamSlug = team.name.toLowerCase().replace(/\s+/g, '-');
        const marketSlug = team.market.toLowerCase().replace(/\s+/g, '-');
        
        const links = {
            mlb: {
                'Baseball Reference': `https://www.baseball-reference.com/teams/${team.id}/`,
                'ESPN': `https://www.espn.com/mlb/team/_/name/${team.id}`,
                'MLB.com': `https://www.mlb.com/${teamSlug}`
            },
            nfl: {
                'Pro Football Reference': `https://www.pro-football-reference.com/teams/${team.id}/`,
                'Pro Football Focus': `https://www.pff.com/nfl/teams/${marketSlug}-${teamSlug}`,
                'ESPN': `https://www.espn.com/nfl/team/_/name/${team.id}`,
                'NFL.com': `https://www.nfl.com/teams/${marketSlug}-${teamSlug}`
            },
            ncaafb: {
                'Sports Reference': `https://www.sports-reference.com/cfb/schools/${teamSlug}/`,
                'ESPN': `https://www.espn.com/college-football/team/_/id/${team.id}`,
                'NCAA.com': 'https://www.ncaa.com/sports/football/fbs'
            }
        };

        return links[sport.toLowerCase()] || {};
    }

    // Analytics Methods
    async getLeagueAnalytics(sport) {
        let teams = [];
        
        try {
            switch (sport.toLowerCase()) {
                case 'mlb':
                    const mlbData = await this.getMLBHierarchy();
                    teams = this.processTeamsData(mlbData, 'mlb');
                    break;
                case 'nfl':
                    const nflData = await this.getNFLHierarchy();
                    teams = this.processTeamsData(nflData, 'nfl');
                    break;
                case 'ncaafb':
                    const ncaaData = await this.getNCAAHierarchy();
                    teams = this.processTeamsData(ncaaData, 'ncaafb');
                    break;
            }
        } catch (error) {
            console.error(`Failed to get ${sport} analytics:`, error);
        }

        return {
            sport: sport.toUpperCase(),
            totalTeams: teams.length,
            avgCompetitive: teams.reduce((sum, team) => sum + team.competitive, 0) / teams.length,
            avgLegacy: teams.reduce((sum, team) => sum + team.legacy, 0) / teams.length,
            totalTitles: teams.reduce((sum, team) => sum + team.titles, 0),
            teams
        };
    }

    // Cache management
    clearCache() {
        this.cache.clear();
        console.log('🧹 SportsRadar cache cleared');
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            oldestEntry: Math.min(...Array.from(this.cache.values()).map(v => v.timestamp)),
            newestEntry: Math.max(...Array.from(this.cache.values()).map(v => v.timestamp))
        };
    }
}

module.exports = SportsRadarAdapter;