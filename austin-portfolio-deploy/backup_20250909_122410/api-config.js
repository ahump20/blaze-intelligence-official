/**
 * Blaze Intelligence API Configuration
 * Central configuration for all sports data APIs and services
 */

window.BlazeAPIConfig = {
    // SportsRadar API Configuration
    sportsRadar: {
        // Replace with your actual API keys
        keys: {
            mlb: process.env?.SPORTRADAR_MLB_KEY || 'YOUR_MLB_API_KEY',
            nfl: process.env?.SPORTRADAR_NFL_KEY || 'YOUR_NFL_API_KEY',
            nba: process.env?.SPORTRADAR_NBA_KEY || 'YOUR_NBA_API_KEY',
            ncaaf: process.env?.SPORTRADAR_NCAAF_KEY || 'YOUR_NCAAF_API_KEY'
        },
        endpoints: {
            mlb: {
                base: 'https://api.sportradar.us/mlb/trial/v7/en',
                games: '/games/{date}/schedule.json',
                team: '/teams/{team_id}/profile.json',
                player: '/players/{player_id}/profile.json',
                standings: '/seasons/{year}/REG/standings.json'
            },
            nfl: {
                base: 'https://api.sportradar.us/nfl/official/trial/v7/en',
                games: '/games/{year}/{week}/schedule.json',
                team: '/teams/{team_id}/profile.json',
                player: '/players/{player_id}/profile.json',
                standings: '/seasons/{year}/standings.json'
            },
            ncaaf: {
                base: 'https://api.sportradar.us/ncaafb/trial/v1/en',
                games: '/games/{year}/{month}/{day}/schedule.json',
                team: '/teams/{team_id}/profile.json',
                rankings: '/polls/{poll_name}/{year}/{week}/rankings.json'
            }
        }
    },

    // Free/Public APIs (no key required)
    publicAPIs: {
        mlbStatsAPI: {
            base: 'https://statsapi.mlb.com/api/v1',
            teams: '/teams',
            roster: '/teams/{teamId}/roster',
            schedule: '/schedule',
            standings: '/standings',
            player: '/people/{playerId}',
            stats: '/teams/{teamId}/stats'
        },
        espn: {
            base: 'https://site.api.espn.com/apis/site/v2/sports',
            mlb: '/baseball/mlb',
            nfl: '/football/nfl',
            nba: '/basketball/nba',
            ncaaf: '/football/college-football',
            scoreboard: '/scoreboard',
            teams: '/teams',
            news: '/news'
        },
        collegeFootballData: {
            base: 'https://api.collegefootballdata.com',
            games: '/games',
            teams: '/teams',
            stats: '/stats/season',
            rankings: '/rankings',
            recruiting: '/recruiting/players'
        }
    },

    // External Resource Links
    externalResources: {
        baseballReference: {
            base: 'https://www.baseball-reference.com',
            team: '/teams/{code}/{year}.shtml',
            player: '/players/{letter}/{playerCode}.shtml',
            stats: '/leagues/MLB/{year}-standard-batting.shtml'
        },
        proFootballFocus: {
            base: 'https://www.pff.com',
            nfl: '/nfl',
            college: '/college',
            grades: '/grades',
            stats: '/stats',
            premium: '/premium-stats'
        },
        fangraphs: {
            base: 'https://www.fangraphs.com',
            teams: '/teams/{team}',
            players: '/players/{playerId}',
            standings: '/standings',
            projections: '/projections'
        },
        savantBaseball: {
            base: 'https://baseballsavant.mlb.com',
            statcast: '/statcast_search',
            leaderboard: '/leaderboard',
            player: '/savant-player/{playerId}'
        },
        perfectGame: {
            base: 'https://www.perfectgame.org',
            rankings: '/rankings/players/{grad_year}/default.aspx',
            events: '/Schedule/Default.aspx',
            player: '/Players/Playerprofile.aspx?id={playerId}'
        }
    },

    // Cloudflare Workers Endpoints
    cloudflare: {
        gateway: 'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev',
        api: 'https://blaze-sports-api.humphrey-austin20.workers.dev',
        analytics: 'https://blaze-analytics.humphrey-austin20.workers.dev'
    },

    // Rate Limiting Configuration
    rateLimits: {
        sportsRadar: {
            requestsPerSecond: 1,
            requestsPerMonth: 1000
        },
        espn: {
            requestsPerSecond: 10,
            requestsPerDay: 10000
        },
        mlbStatsAPI: {
            requestsPerSecond: 10,
            requestsPerDay: 50000
        }
    },

    // Cache Configuration
    cache: {
        enabled: true,
        ttl: {
            live: 30 * 1000,        // 30 seconds for live data
            roster: 24 * 60 * 60 * 1000, // 24 hours for rosters
            standings: 60 * 60 * 1000,    // 1 hour for standings
            stats: 6 * 60 * 60 * 1000,    // 6 hours for stats
            news: 15 * 60 * 1000          // 15 minutes for news
        }
    },

    // Texas Teams Focus
    texasTeams: {
        mlb: [
            { id: 117, code: 'HOU', name: 'Houston Astros', league: 'AL West' },
            { id: 140, code: 'TEX', name: 'Texas Rangers', league: 'AL West' }
        ],
        nfl: [
            { id: 'HOU', name: 'Houston Texans', division: 'AFC South' },
            { id: 'DAL', name: 'Dallas Cowboys', division: 'NFC East' }
        ],
        nba: [
            { id: 'HOU', name: 'Houston Rockets', division: 'Southwest' },
            { id: 'DAL', name: 'Dallas Mavericks', division: 'Southwest' },
            { id: 'SAS', name: 'San Antonio Spurs', division: 'Southwest' }
        ],
        ncaaf: [
            { id: 'texas', name: 'Texas Longhorns', conference: 'SEC' },
            { id: 'texas-a-m', name: 'Texas A&M Aggies', conference: 'SEC' },
            { id: 'tcu', name: 'TCU Horned Frogs', conference: 'Big 12' },
            { id: 'baylor', name: 'Baylor Bears', conference: 'Big 12' },
            { id: 'texas-tech', name: 'Texas Tech Red Raiders', conference: 'Big 12' },
            { id: 'houston', name: 'Houston Cougars', conference: 'Big 12' },
            { id: 'smu', name: 'SMU Mustangs', conference: 'ACC' },
            { id: 'rice', name: 'Rice Owls', conference: 'AAC' },
            { id: 'north-texas', name: 'North Texas Mean Green', conference: 'AAC' },
            { id: 'utsa', name: 'UTSA Roadrunners', conference: 'AAC' },
            { id: 'texas-state', name: 'Texas State Bobcats', conference: 'Sun Belt' },
            { id: 'utep', name: 'UTEP Miners', conference: 'Conference USA' }
        ]
    },

    // Feature Flags
    features: {
        enableSportsRadar: false, // Set to true when API keys are configured
        enableRealTimeStreaming: true,
        enableAdvancedAnalytics: true,
        enablePerfectGameIntegration: true,
        enableNILValuation: true,
        enableGritIndex: true,
        enableBiomechanicalAnalysis: true,
        enableMicroExpressionDetection: true
    },

    // Analytics Configuration
    analytics: {
        ewmaAlpha: 0.35, // Exponentially Weighted Moving Average smoothing factor
        confidenceThreshold: 0.946, // 94.6% confidence threshold
        performanceWeights: {
            legacy: 0.3,
            recent: 0.25,
            momentum: 0.2,
            talent: 0.15,
            analytics: 0.1
        }
    },

    // Initialize Configuration
    init: function() {
        // Check for environment variables or localStorage overrides
        if (typeof localStorage !== 'undefined') {
            // Check for stored API keys
            const storedKeys = {
                mlb: localStorage.getItem('SPORTRADAR_MLB_KEY'),
                nfl: localStorage.getItem('SPORTRADAR_NFL_KEY'),
                nba: localStorage.getItem('SPORTRADAR_NBA_KEY'),
                ncaaf: localStorage.getItem('SPORTRADAR_NCAAF_KEY')
            };

            // Update keys if found
            Object.keys(storedKeys).forEach(sport => {
                if (storedKeys[sport]) {
                    this.sportsRadar.keys[sport] = storedKeys[sport];
                    this.features.enableSportsRadar = true;
                }
            });
        }

        console.log('🔧 Blaze API Configuration initialized');
        console.log(`📊 SportsRadar: ${this.features.enableSportsRadar ? 'Enabled' : 'Disabled (No API keys)'}`);
        console.log(`🎯 Features enabled:`, Object.entries(this.features)
            .filter(([_, enabled]) => enabled)
            .map(([feature]) => feature.replace('enable', ''))
            .join(', '));
    },

    // Helper method to save API keys
    saveAPIKey: function(sport, key) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`SPORTRADAR_${sport.toUpperCase()}_KEY`, key);
            this.sportsRadar.keys[sport] = key;
            this.features.enableSportsRadar = true;
            console.log(`✅ ${sport.toUpperCase()} API key saved`);
        }
    },

    // Helper method to construct URLs
    buildURL: function(api, endpoint, params = {}) {
        let url = '';
        
        if (api === 'sportsRadar') {
            const sport = params.sport;
            url = this.sportsRadar.endpoints[sport].base + 
                  this.sportsRadar.endpoints[sport][endpoint];
        } else if (this.publicAPIs[api]) {
            url = this.publicAPIs[api].base + 
                  (this.publicAPIs[api][endpoint] || '');
        } else if (this.externalResources[api]) {
            url = this.externalResources[api].base + 
                  (this.externalResources[api][endpoint] || '');
        }

        // Replace URL parameters
        Object.keys(params).forEach(key => {
            url = url.replace(`{${key}}`, params[key]);
        });

        return url;
    }
};

// Auto-initialize on load
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.BlazeAPIConfig.init();
    });
}