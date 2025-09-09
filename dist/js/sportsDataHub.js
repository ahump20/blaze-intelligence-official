// Sports Data Hub - Central data management for all sports APIs
class SportsDataHub {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes
        this.apiEndpoints = {
            mlb: '/api/mlb/teams',
            nfl: '/proxy/nfl/teams', 
            ncaa: '/api/cfb/teams',
            sportsRadar: {
                mlb: '/api/sportsradar/mlb/teams',
                nfl: '/api/sportsradar/nfl/teams', 
                ncaa: '/api/sportsradar/ncaafb/teams'
            },
            live: {
                mlb: '/api/live-sports/mlb/scoreboard',
                nfl: '/api/live-sports/nfl/scoreboard',
                all: '/api/live-sports/all'
            }
        };
        this.isInitialized = false;
        this.init();
    }

    async init() {
        try {
            console.log('🏆 Sports Data Hub initializing...');
            await this.validateEndpoints();
            this.isInitialized = true;
            console.log('✅ Sports Data Hub loaded');
        } catch (error) {
            console.warn('⚠️ Sports Data Hub init error:', error.message);
            this.isInitialized = false;
        }
    }

    async validateEndpoints() {
        const testEndpoints = [
            this.apiEndpoints.mlb,
            this.apiEndpoints.nfl,
            this.apiEndpoints.sportsRadar.mlb
        ];

        const results = await Promise.allSettled(
            testEndpoints.map(endpoint => 
                fetch(endpoint).then(r => ({ endpoint, status: r.status, ok: r.ok }))
            )
        );

        results.forEach(result => {
            if (result.status === 'fulfilled') {
                const { endpoint, ok, status } = result.value;
                console.log(`${ok ? '✅' : '⚠️'} ${endpoint}: ${status}`);
            }
        });
    }

    // MLB Data Methods
    async getMLBTeams() {
        try {
            const cacheKey = 'mlb_teams';
            const cached = this.cache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                return cached.data;
            }

            // Try SportsRadar first, fallback to MLB Stats API
            let data = await this.tryMultipleEndpoints([
                this.apiEndpoints.sportsRadar.mlb,
                this.apiEndpoints.mlb
            ]);

            if (!data) {
                data = this.getFallbackMLBData();
            }

            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            console.warn('MLB teams fetch error:', error.message);
            return this.getFallbackMLBData();
        }
    }

    async getMLBLiveGames() {
        try {
            const response = await fetch(this.apiEndpoints.live.mlb);
            if (response.ok) {
                return await response.json();
            }
            return { games: [], error: 'Live games unavailable' };
        } catch (error) {
            return { games: [], error: error.message };
        }
    }

    // NFL Data Methods  
    async getNFLTeams() {
        try {
            const cacheKey = 'nfl_teams';
            const cached = this.cache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                return cached.data;
            }

            let data = await this.tryMultipleEndpoints([
                this.apiEndpoints.sportsRadar.nfl,
                this.apiEndpoints.nfl
            ]);

            if (!data) {
                data = this.getFallbackNFLData();
            }

            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            console.warn('NFL teams fetch error:', error.message);
            return this.getFallbackNFLData();
        }
    }

    async getNFLLiveGames() {
        try {
            const response = await fetch(this.apiEndpoints.live.nfl);
            if (response.ok) {
                return await response.json();
            }
            return { games: [], error: 'Live games unavailable' };
        } catch (error) {
            return { games: [], error: error.message };
        }
    }

    // NCAA Football Data Methods
    async getNCAATeams() {
        try {
            const cacheKey = 'ncaa_teams';
            const cached = this.cache.get(cacheKey);
            
            if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
                return cached.data;
            }

            let data = await this.tryMultipleEndpoints([
                this.apiEndpoints.sportsRadar.ncaa,
                this.apiEndpoints.ncaa
            ]);

            if (!data) {
                data = this.getFallbackNCAAData();
            }

            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;

        } catch (error) {
            console.warn('NCAA teams fetch error:', error.message);
            return this.getFallbackNCAAData();
        }
    }

    // Live Sports Data
    async getAllLiveSports() {
        try {
            const response = await fetch(this.apiEndpoints.live.all);
            if (response.ok) {
                return await response.json();
            }
            return { sports: {}, error: 'Live sports unavailable' };
        } catch (error) {
            return { sports: {}, error: error.message };
        }
    }

    // Utility Methods
    async tryMultipleEndpoints(endpoints) {
        for (const endpoint of endpoints) {
            try {
                const response = await fetch(endpoint);
                if (response.ok) {
                    return await response.json();
                }
            } catch (error) {
                console.warn(`Endpoint ${endpoint} failed:`, error.message);
                continue;
            }
        }
        return null;
    }

    // Fallback Data
    getFallbackMLBData() {
        return {
            teams: [
                { id: 'nyy', name: 'New York Yankees', league: 'American League', division: 'East' },
                { id: 'bos', name: 'Boston Red Sox', league: 'American League', division: 'East' },
                { id: 'tor', name: 'Toronto Blue Jays', league: 'American League', division: 'East' },
                { id: 'tb', name: 'Tampa Bay Rays', league: 'American League', division: 'East' },
                { id: 'bal', name: 'Baltimore Orioles', league: 'American League', division: 'East' }
            ],
            totalTeams: 30,
            source: 'fallback',
            lastUpdated: new Date().toISOString()
        };
    }

    getFallbackNFLData() {
        return {
            teams: [
                { id: 'buf', name: 'Buffalo Bills', conference: 'AFC', division: 'East' },
                { id: 'mia', name: 'Miami Dolphins', conference: 'AFC', division: 'East' },
                { id: 'ne', name: 'New England Patriots', conference: 'AFC', division: 'East' },
                { id: 'nyj', name: 'New York Jets', conference: 'AFC', division: 'East' },
                { id: 'pit', name: 'Pittsburgh Steelers', conference: 'AFC', division: 'North' }
            ],
            totalTeams: 32,
            source: 'fallback',
            lastUpdated: new Date().toISOString()
        };
    }

    getFallbackNCAAData() {
        return {
            teams: [
                { id: 'bama', name: 'Alabama Crimson Tide', conference: 'SEC', division: 'West' },
                { id: 'ga', name: 'Georgia Bulldogs', conference: 'SEC', division: 'East' },
                { id: 'osu', name: 'Ohio State Buckeyes', conference: 'Big Ten', division: 'East' },
                { id: 'mich', name: 'Michigan Wolverines', conference: 'Big Ten', division: 'East' },
                { id: 'nd', name: 'Notre Dame Fighting Irish', conference: 'Independent', division: null }
            ],
            totalTeams: 130,
            source: 'fallback',
            lastUpdated: new Date().toISOString()
        };
    }

    // API Health Check
    async checkAPIHealth() {
        const healthChecks = {
            sportsradar: await this.testEndpoint(this.apiEndpoints.sportsRadar.mlb),
            mlb: await this.testEndpoint(this.apiEndpoints.mlb),
            nfl: await this.testEndpoint(this.apiEndpoints.nfl),
            liveSports: await this.testEndpoint(this.apiEndpoints.live.all)
        };

        return {
            status: Object.values(healthChecks).some(h => h) ? 'healthy' : 'degraded',
            apis: healthChecks,
            timestamp: new Date().toISOString()
        };
    }

    async testEndpoint(endpoint) {
        try {
            const response = await fetch(endpoint, { method: 'HEAD' });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Cache Management
    clearCache() {
        this.cache.clear();
        console.log('🧹 Sports Data Hub cache cleared');
    }

    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            lastUpdated: new Date().toISOString()
        };
    }
}

// Initialize and expose globally
window.sportsDataHub = new SportsDataHub();

// Also initialize for legacy compatibility
document.addEventListener('DOMContentLoaded', () => {
    if (!window.sportsDataHub.isInitialized) {
        window.sportsDataHub.init();
    }
});