/**
 * Blaze Intelligence Sports Data Hub
 * Unified interface for multiple sports data sources and APIs
 * Integrates SportsRadar, Baseball Reference, Pro Football Focus, and more
 */

class SportsDataHub {
    constructor() {
        this.dataSources = {
            sportsRadar: {
                name: 'SportsRadar',
                baseUrls: {
                    mlb: 'https://api.sportradar.us/mlb/trial/v7/en',
                    nfl: 'https://api.sportradar.us/nfl/official/trial/v7/en',
                    ncaaf: 'https://api.sportradar.us/ncaafb/trial/v1/en',
                    nba: 'https://api.sportradar.us/nba/trial/v8/en'
                },
                apiKey: null // Will be set from environment
            },
            references: {
                baseballReference: {
                    name: 'Baseball Reference',
                    baseUrl: 'https://www.baseball-reference.com',
                    endpoints: {
                        teams: '/teams/',
                        players: '/players/',
                        stats: '/leagues/MLB/{year}-standard-batting.shtml'
                    }
                },
                proFootballFocus: {
                    name: 'Pro Football Focus',
                    baseUrl: 'https://www.pff.com',
                    endpoints: {
                        grades: '/grades',
                        stats: '/stats',
                        rankings: '/rankings'
                    }
                },
                espn: {
                    name: 'ESPN',
                    baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
                    endpoints: {
                        mlb: '/baseball/mlb',
                        nfl: '/football/nfl',
                        nba: '/basketball/nba',
                        ncaaf: '/football/college-football'
                    }
                },
                statsApi: {
                    name: 'MLB Stats API',
                    baseUrl: 'https://statsapi.mlb.com/api/v1',
                    endpoints: {
                        teams: '/teams',
                        roster: '/teams/{teamId}/roster',
                        schedule: '/schedule',
                        standings: '/standings'
                    }
                }
            }
        };

        this.cache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        
        this.texasTeams = {
            mlb: [
                { id: 117, name: 'Houston Astros', code: 'HOU' },
                { id: 140, name: 'Texas Rangers', code: 'TEX' }
            ],
            nfl: [
                { id: 'HOU', name: 'Houston Texans' },
                { id: 'DAL', name: 'Dallas Cowboys' }
            ],
            nba: [
                { id: 'HOU', name: 'Houston Rockets' },
                { id: 'DAL', name: 'Dallas Mavericks' },
                { id: 'SAS', name: 'San Antonio Spurs' }
            ],
            ncaaf: [
                { id: 'TEX', name: 'Texas Longhorns' },
                { id: 'TAMU', name: 'Texas A&M Aggies' },
                { id: 'TCU', name: 'TCU Horned Frogs' },
                { id: 'BAY', name: 'Baylor Bears' },
                { id: 'TTU', name: 'Texas Tech Red Raiders' }
            ]
        };

        this.init();
    }

    async init() {
        console.log('🏟️ Initializing Sports Data Hub...');
        await this.loadApiKeys();
        this.setupEventListeners();
        console.log('✅ Sports Data Hub initialized');
    }

    async loadApiKeys() {
        try {
            // Try to load from environment or localStorage
            this.dataSources.sportsRadar.apiKey = 
                localStorage.getItem('SPORTRADAR_API_KEY') || 
                process.env?.SPORTRADAR_API_KEY || 
                'demo_key'; // Fallback for demo
        } catch (error) {
            console.warn('API keys not configured, using demo mode');
        }
    }

    // SportsRadar API Integration
    async fetchSportsRadarData(sport, endpoint, params = {}) {
        const baseUrl = this.dataSources.sportsRadar.baseUrls[sport];
        const apiKey = this.dataSources.sportsRadar.apiKey;
        
        if (!baseUrl || !apiKey) {
            console.warn(`SportsRadar ${sport} not configured`);
            return this.getFallbackData(sport, endpoint);
        }

        const url = `${baseUrl}${endpoint}?api_key=${apiKey}`;
        const cacheKey = this.getCacheKey('sportradar', sport, endpoint, params);
        
        // Check cache
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`SportsRadar API error:`, error);
            return this.getFallbackData(sport, endpoint);
        }
    }

    // MLB Stats API (free, no key required)
    async fetchMLBData(endpoint, params = {}) {
        const baseUrl = this.dataSources.references.statsApi.baseUrl;
        const queryString = new URLSearchParams(params).toString();
        const url = `${baseUrl}${endpoint}${queryString ? '?' + queryString : ''}`;
        
        const cacheKey = this.getCacheKey('mlb', 'stats', endpoint, params);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`MLB Stats API error:`, error);
            return this.getFallbackData('mlb', endpoint);
        }
    }

    // ESPN API (free, no key required)
    async fetchESPNData(sport, endpoint = '', params = {}) {
        const baseUrl = `${this.dataSources.references.espn.baseUrl}${this.dataSources.references.espn.endpoints[sport]}`;
        const url = `${baseUrl}${endpoint}`;
        
        const cacheKey = this.getCacheKey('espn', sport, endpoint, params);
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`ESPN API error:`, error);
            return this.getFallbackData(sport, endpoint);
        }
    }

    // Unified data fetching method
    async getTeamData(sport, teamId) {
        const data = {
            basic: null,
            roster: null,
            schedule: null,
            stats: null,
            news: null
        };

        switch(sport) {
            case 'mlb':
                // Fetch from multiple sources
                data.basic = await this.fetchMLBData(`/teams/${teamId}`);
                data.roster = await this.fetchMLBData(`/teams/${teamId}/roster`, { rosterType: 'active' });
                data.schedule = await this.fetchMLBData('/schedule', { 
                    teamId, 
                    startDate: new Date().toISOString().split('T')[0],
                    endDate: new Date(Date.now() + 30*24*60*60*1000).toISOString().split('T')[0]
                });
                data.news = await this.fetchESPNData('mlb', `/teams/${teamId}/news`);
                break;
                
            case 'nfl':
                data.basic = await this.fetchESPNData('nfl', `/teams/${teamId}`);
                data.roster = await this.fetchESPNData('nfl', `/teams/${teamId}/roster`);
                data.schedule = await this.fetchESPNData('nfl', `/teams/${teamId}/schedule`);
                break;
                
            case 'ncaaf':
                data.basic = await this.fetchESPNData('ncaaf', `/teams/${teamId}`);
                data.roster = await this.fetchESPNData('ncaaf', `/teams/${teamId}/roster`);
                data.schedule = await this.fetchESPNData('ncaaf', `/teams/${teamId}/schedule`);
                break;
        }

        return data;
    }

    // Get aggregated league standings
    async getLeagueStandings(sport) {
        switch(sport) {
            case 'mlb':
                return await this.fetchMLBData('/standings', { leagueId: '103,104' });
            case 'nfl':
                return await this.fetchESPNData('nfl', '/standings');
            case 'ncaaf':
                return await this.fetchESPNData('ncaaf', '/rankings');
            case 'nba':
                return await this.fetchESPNData('nba', '/standings');
            default:
                return null;
        }
    }

    // Generate resource links for a team/player
    generateResourceLinks(type, sport, identifier) {
        const links = [];
        
        if (type === 'team') {
            switch(sport) {
                case 'mlb':
                    links.push({
                        source: 'Baseball Reference',
                        url: `https://www.baseball-reference.com/teams/${identifier}/2025.shtml`,
                        icon: '📊'
                    });
                    links.push({
                        source: 'MLB.com',
                        url: `https://www.mlb.com/${identifier}`,
                        icon: '⚾'
                    });
                    links.push({
                        source: 'FanGraphs',
                        url: `https://www.fangraphs.com/teams/${identifier}`,
                        icon: '📈'
                    });
                    break;
                    
                case 'nfl':
                    links.push({
                        source: 'Pro Football Reference',
                        url: `https://www.pro-football-reference.com/teams/${identifier}/2025.htm`,
                        icon: '🏈'
                    });
                    links.push({
                        source: 'Pro Football Focus',
                        url: `https://www.pff.com/nfl/teams/${identifier}`,
                        icon: '📊'
                    });
                    links.push({
                        source: 'ESPN',
                        url: `https://www.espn.com/nfl/team/_/name/${identifier}`,
                        icon: '📺'
                    });
                    break;
                    
                case 'ncaaf':
                    links.push({
                        source: 'ESPN',
                        url: `https://www.espn.com/college-football/team/_/id/${identifier}`,
                        icon: '🎓'
                    });
                    links.push({
                        source: '247Sports',
                        url: `https://247sports.com/${identifier}`,
                        icon: '🏈'
                    });
                    break;
            }
        }
        
        return links;
    }

    // Cache management
    getCacheKey(source, sport, endpoint, params) {
        return `${source}_${sport}_${endpoint}_${JSON.stringify(params)}`;
    }

    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    // Fallback data for demo/error scenarios
    getFallbackData(sport, endpoint) {
        const fallbacks = {
            mlb: {
                teams: this.texasTeams.mlb,
                standings: { message: 'Live standings unavailable' }
            },
            nfl: {
                teams: this.texasTeams.nfl,
                standings: { message: 'Live standings unavailable' }
            },
            ncaaf: {
                teams: this.texasTeams.ncaaf,
                rankings: { message: 'Live rankings unavailable' }
            }
        };
        
        return fallbacks[sport]?.[endpoint] || { error: 'No data available' };
    }

    // Event listeners for UI integration
    setupEventListeners() {
        document.addEventListener('blazeDataRequest', async (event) => {
            const { sport, type, identifier } = event.detail;
            
            try {
                let data;
                switch(type) {
                    case 'team':
                        data = await this.getTeamData(sport, identifier);
                        break;
                    case 'standings':
                        data = await this.getLeagueStandings(sport);
                        break;
                    case 'links':
                        data = this.generateResourceLinks('team', sport, identifier);
                        break;
                }
                
                document.dispatchEvent(new CustomEvent('blazeDataResponse', {
                    detail: { sport, type, identifier, data }
                }));
            } catch (error) {
                console.error('Data fetch error:', error);
                document.dispatchEvent(new CustomEvent('blazeDataError', {
                    detail: { sport, type, identifier, error: error.message }
                }));
            }
        });
    }

    // Batch fetch for dashboard initialization
    async initializeDashboard() {
        console.log('📊 Fetching dashboard data...');
        
        const dashboardData = {
            mlb: {
                texasTeams: [],
                standings: null
            },
            nfl: {
                texasTeams: [],
                standings: null
            },
            ncaaf: {
                texasTeams: [],
                rankings: null
            }
        };

        // Fetch Texas teams data in parallel
        const mlbPromises = this.texasTeams.mlb.map(team => 
            this.getTeamData('mlb', team.id)
        );
        const nflPromises = this.texasTeams.nfl.map(team => 
            this.getTeamData('nfl', team.id)
        );
        const ncaafPromises = this.texasTeams.ncaaf.map(team => 
            this.getTeamData('ncaaf', team.id)
        );

        // Wait for all data
        [
            dashboardData.mlb.texasTeams,
            dashboardData.nfl.texasTeams,
            dashboardData.ncaaf.texasTeams
        ] = await Promise.all([
            Promise.all(mlbPromises),
            Promise.all(nflPromises),
            Promise.all(ncaafPromises)
        ]);

        // Fetch standings
        [
            dashboardData.mlb.standings,
            dashboardData.nfl.standings,
            dashboardData.ncaaf.rankings
        ] = await Promise.all([
            this.getLeagueStandings('mlb'),
            this.getLeagueStandings('nfl'),
            this.getLeagueStandings('ncaaf')
        ]);

        console.log('✅ Dashboard data loaded');
        return dashboardData;
    }
}

// Global instance
let sportsDataHub;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        sportsDataHub = new SportsDataHub();
        window.sportsDataHub = sportsDataHub;
        
        // Auto-initialize dashboard if element exists
        if (document.getElementById('sports-data-dashboard')) {
            sportsDataHub.initializeDashboard().then(data => {
                document.dispatchEvent(new CustomEvent('dashboardDataReady', { detail: data }));
            });
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SportsDataHub;
}