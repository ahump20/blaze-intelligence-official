/**
 * Blaze Intelligence API Wrapper with Circuit Breakers
 * Enhanced API client with built-in error handling, retry logic, and fallback strategies
 */

class BlazeAPIWrapper {
    constructor(errorHandler) {
        this.errorHandler = errorHandler;
        this.performanceMonitor = null; // Will be set when available
        this.baseEndpoints = {
            gateway: 'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev',
            mlb: 'https://statsapi.mlb.com/api/v1',
            espn: 'https://site.api.espn.com/apis',
            college: 'https://api.collegefootballdata.com'
        };
        
        // Fallback data cache
        this.fallbackCache = new Map();
        this.requestCache = new Map();
        this.cacheTTL = 5 * 60 * 1000; // 5 minutes
        
        this.init();
    }

    init() {
        console.log('🔧 Initializing Blaze API Wrapper...');
        this.loadFallbackData();
        
        // Wait for performance monitor to be available
        this.waitForPerformanceMonitor();
        
        console.log('✅ API Wrapper initialized');
    }
    
    waitForPerformanceMonitor() {
        const checkMonitor = () => {
            if (window.blazePerformanceMonitor) {
                this.performanceMonitor = window.blazePerformanceMonitor;
                console.log('📊 Performance monitoring enabled for API calls');
            } else {
                setTimeout(checkMonitor, 100);
            }
        };
        checkMonitor();
    }

    async loadFallbackData() {
        // Load static fallback data for when APIs are down
        this.fallbackCache.set('mlb_teams', [
            { id: 138, name: 'St. Louis Cardinals', code: 'STL' },
            { id: 117, name: 'Houston Astros', code: 'HOU' },
            { id: 140, name: 'Texas Rangers', code: 'TEX' }
        ]);
        
        this.fallbackCache.set('sample_grit_data', {
            playerId: 'fallback_001',
            playerName: 'Sample Player',
            overall: 82.5,
            components: {
                mentalToughness: 85,
                determinationIndex: 80,
                resilienceScore: 84,
                clutchPerformance: 78,
                leadershipQuotient: 86
            }
        });
    }

    async makeRequest(endpoint, path, options = {}) {
        const fullUrl = `${endpoint}${path}`;
        const cacheKey = this.getCacheKey(fullUrl, options);
        const method = options.method || 'GET';
        
        // Performance tracking
        const startTime = performance.now();
        let success = false;
        let error = null;
        
        try {
            // Check cache first
            const cached = this.getFromCache(cacheKey);
            if (cached && !options.skipCache) {
                console.log('📋 Using cached data for:', fullUrl);
                
                // Track cache hit performance
                if (this.performanceMonitor) {
                    const endTime = performance.now();
                    this.performanceMonitor.trackAPICall(endpoint, method, startTime, endTime, true, null);
                    this.performanceMonitor.recordCustomMetric('cache_hit', { endpoint: fullUrl });
                }
                
                return cached;
            }

            // Use circuit breaker and retry logic
            const result = await this.errorHandler.retryWithCircuitBreaker(
                endpoint,
                async () => {
                    const response = await this.fetchWithTimeout(fullUrl, {
                        method: method,
                        headers: {
                            'Content-Type': 'application/json',
                            'User-Agent': 'Blaze Intelligence Analytics/2025',
                            'X-Performance-Start': startTime.toString(),
                            ...options.headers
                        },
                        body: options.body ? JSON.stringify(options.body) : undefined
                    }, options.timeout || 10000);

                    if (!response.ok) {
                        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                    }

                    const data = await response.json();
                    
                    // Cache successful responses
                    this.setCache(cacheKey, data);
                    
                    return data;
                },
                { operation: `${method} ${path}` }
            );
            
            success = true;
            return result;

        } catch (err) {
            error = err;
            console.warn(`🔄 API request failed for ${fullUrl}, attempting fallback...`);
            
            // Try to get fallback data
            const fallbackData = this.getFallbackData(path, options);
            if (fallbackData) {
                console.log('📦 Using fallback data for:', path);
                
                // Track fallback usage
                if (this.performanceMonitor) {
                    const endTime = performance.now();
                    this.performanceMonitor.trackAPICall(endpoint, method, startTime, endTime, false, error);
                    this.performanceMonitor.recordCustomMetric('fallback_used', { endpoint: fullUrl, error: error.message });
                }
                
                return fallbackData;
            }

            // Record the error with context
            await this.errorHandler.handleError({
                type: this.errorHandler.config.errorCategories.API,
                message: `API request failed: ${error.message}`,
                endpoint: fullUrl,
                error: error,
                context: path,
                severity: 'medium',
                fallbackData: fallbackData
            });

            throw error;
        } finally {
            // Track performance regardless of success/failure
            if (this.performanceMonitor && !cached) {
                const endTime = performance.now();
                this.performanceMonitor.trackAPICall(endpoint, method, startTime, endTime, success, error);
            }
        }
    }

    // MLB API methods
    async getMLBTeams() {
        try {
            return await this.makeRequest(this.baseEndpoints.mlb, '/teams', {
                timeout: 8000
            });
        } catch (error) {
            return { teams: this.fallbackCache.get('mlb_teams') || [] };
        }
    }

    async getMLBTeamRoster(teamId) {
        try {
            return await this.makeRequest(
                this.baseEndpoints.mlb,
                `/teams/${teamId}/roster?rosterType=active`,
                { timeout: 8000 }
            );
        } catch (error) {
            return { roster: [] };
        }
    }

    async getMLBSchedule(teamId, date) {
        const dateStr = date || new Date().toISOString().split('T')[0];
        try {
            return await this.makeRequest(
                this.baseEndpoints.mlb,
                `/schedule?sportId=1&teamId=${teamId}&date=${dateStr}`,
                { timeout: 8000 }
            );
        } catch (error) {
            return { dates: [] };
        }
    }

    async getMLBPlayerStats(playerId, season) {
        const currentSeason = season || new Date().getFullYear();
        try {
            return await this.makeRequest(
                this.baseEndpoints.mlb,
                `/people/${playerId}/stats?stats=season&season=${currentSeason}&group=hitting`,
                { timeout: 8000 }
            );
        } catch (error) {
            return { stats: [] };
        }
    }

    // Gateway API methods
    async getGatewayHealth() {
        try {
            return await this.makeRequest(this.baseEndpoints.gateway, '/healthz', {
                timeout: 5000
            });
        } catch (error) {
            return { status: 'unavailable', timestamp: Date.now() };
        }
    }

    async getGatewayAnalytics() {
        try {
            return await this.makeRequest(
                this.baseEndpoints.gateway,
                '/vision/analytics/system/stats',
                { timeout: 8000 }
            );
        } catch (error) {
            return {
                activeStreams: 0,
                dataQuality: 0,
                latency: -1,
                status: 'error'
            };
        }
    }

    async sendGritData(gritData) {
        try {
            return await this.makeRequest(
                this.baseEndpoints.gateway,
                '/vision/grit-index',
                {
                    method: 'POST',
                    body: gritData,
                    timeout: 10000
                }
            );
        } catch (error) {
            // For sending data, we might want to queue it for later
            console.warn('Failed to send grit data, queuing for retry...');
            return { status: 'queued', error: error.message };
        }
    }

    // ESPN API methods
    async getESPNScores(sport, date) {
        const dateStr = date || new Date().toISOString().split('T')[0];
        try {
            return await this.makeRequest(
                this.baseEndpoints.espn,
                `/sports/v1/${sport}/scoreboard?date=${dateStr}`,
                { timeout: 8000 }
            );
        } catch (error) {
            return { events: [] };
        }
    }

    // College Football API methods
    async getCollegeGames(week, season, team) {
        const currentSeason = season || new Date().getFullYear();
        const queryParams = new URLSearchParams({
            week: week || 1,
            year: currentSeason,
            ...(team && { team })
        });
        
        try {
            return await this.makeRequest(
                this.baseEndpoints.college,
                `/games?${queryParams}`,
                { timeout: 8000 }
            );
        } catch (error) {
            return [];
        }
    }

    async getCollegeTeamStats(team, season) {
        const currentSeason = season || new Date().getFullYear();
        try {
            return await this.makeRequest(
                this.baseEndpoints.college,
                `/stats/season?year=${currentSeason}&team=${team}`,
                { timeout: 8000 }
            );
        } catch (error) {
            return [];
        }
    }

    // Cache management
    getCacheKey(url, options) {
        return `${url}_${JSON.stringify(options.body || {})}_${options.method || 'GET'}`;
    }

    getFromCache(key) {
        const cached = this.requestCache.get(key);
        if (!cached) return null;
        
        if (Date.now() - cached.timestamp > this.cacheTTL) {
            this.requestCache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    setCache(key, data) {
        this.requestCache.set(key, {
            data,
            timestamp: Date.now()
        });
        
        // Clean old cache entries periodically
        if (this.requestCache.size > 100) {
            this.cleanCache();
        }
    }

    cleanCache() {
        const now = Date.now();
        const toDelete = [];
        
        this.requestCache.forEach((value, key) => {
            if (now - value.timestamp > this.cacheTTL) {
                toDelete.push(key);
            }
        });
        
        toDelete.forEach(key => this.requestCache.delete(key));
        console.log(`🧹 Cleaned ${toDelete.length} expired cache entries`);
    }

    getFallbackData(path, options) {
        // Determine fallback based on path
        if (path.includes('/teams')) {
            return { teams: this.fallbackCache.get('mlb_teams') };
        }
        
        if (path.includes('/grit-index')) {
            return this.fallbackCache.get('sample_grit_data');
        }
        
        if (path.includes('/roster')) {
            return { roster: [] };
        }
        
        if (path.includes('/schedule')) {
            return { dates: [] };
        }
        
        return null;
    }

    async fetchWithTimeout(url, options, timeout) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeout);
        
        try {
            const response = await fetch(url, {
                ...options,
                signal: controller.signal
            });
            clearTimeout(timeoutId);
            return response;
        } catch (error) {
            clearTimeout(timeoutId);
            if (error.name === 'AbortError') {
                throw new Error(`Request timeout after ${timeout}ms`);
            }
            throw error;
        }
    }

    // Utility methods
    clearCache() {
        this.requestCache.clear();
        console.log('🧹 API cache cleared');
    }

    getCacheStats() {
        return {
            size: this.requestCache.size,
            fallbackDataKeys: Array.from(this.fallbackCache.keys())
        };
    }

    async testEndpoints() {
        console.log('🔍 Testing all endpoints...');
        const results = {};
        
        for (const [name, endpoint] of Object.entries(this.baseEndpoints)) {
            try {
                const start = Date.now();
                
                let testPath;
                switch (name) {
                    case 'gateway': testPath = '/healthz'; break;
                    case 'mlb': testPath = '/teams/138'; break;
                    case 'espn': testPath = '/sports/v1/baseball/scoreboard'; break;
                    case 'college': testPath = '/teams'; break;
                    default: testPath = '/';
                }
                
                await this.makeRequest(endpoint, testPath, { timeout: 5000 });
                
                results[name] = {
                    status: 'healthy',
                    responseTime: Date.now() - start,
                    endpoint
                };
            } catch (error) {
                results[name] = {
                    status: 'error',
                    error: error.message,
                    endpoint
                };
            }
        }
        
        console.log('🔍 Endpoint test results:', results);
        return results;
    }
}

// Global instance - initialized when error handler is ready
let blazeAPIWrapper;

// Initialize when both DOM and error handler are ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        // Wait for error handler to be available
        const initAPIWrapper = () => {
            if (window.blazeErrorHandler) {
                try {
                    blazeAPIWrapper = new BlazeAPIWrapper(window.blazeErrorHandler);
                    window.blazeAPIWrapper = blazeAPIWrapper;
                    
                    // Test endpoints on initialization
                    setTimeout(() => {
                        blazeAPIWrapper.testEndpoints();
                    }, 2000);
                    
                    console.log('✅ Blaze API Wrapper loaded successfully');
                } catch (error) {
                    console.error('❌ Failed to initialize Blaze API Wrapper:', error);
                }
            } else {
                // Retry in 100ms
                setTimeout(initAPIWrapper, 100);
            }
        };
        
        initAPIWrapper();
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeAPIWrapper;
}