/**
 * Live Sports Scoreboard API Integration
 * Integrates nishs9/live-sports-scoreboard-api for real-time MLB and NFL scores
 * Enhanced with SportsRadar data when available
 */

class LiveScoreboardIntegration {
    constructor() {
        // Live Scoreboard API endpoints
        this.scoreboardAPI = {
            base: process.env?.SCOREBOARD_API_URL || 'http://localhost:3000',
            endpoints: {
                nfl: {
                    gameCount: '/nfl/get-game-count',
                    liveScore: '/nfl/get-live-score/'
                },
                mlb: {
                    gameCount: '/mlb/get-game-count',
                    liveScore: '/mlb/get-live-score/'
                }
            }
        };

        // SportsRadar configuration (from vault/environment)
        this.sportsRadarConfig = {
            keys: {
                mlb: process.env?.SPORTRADAR_MLB_KEY || this.getVaultKey('sportradar_mlb'),
                nfl: process.env?.SPORTRADAR_NFL_KEY || this.getVaultKey('sportradar_nfl'),
                nba: process.env?.SPORTRADAR_NBA_KEY || this.getVaultKey('sportradar_nba'),
                ncaaf: process.env?.SPORTRADAR_NCAAF_KEY || this.getVaultKey('sportradar_ncaaf')
            },
            endpoints: {
                mlb: 'https://api.sportradar.us/mlb/trial/v7/en',
                nfl: 'https://api.sportradar.us/nfl/official/trial/v7/en',
                nba: 'https://api.sportradar.us/nba/trial/v8/en',
                ncaaf: 'https://api.sportradar.us/ncaafb/trial/v1/en'
            }
        };

        this.cache = new Map();
        this.cacheTTL = 30000; // 30 seconds for live data
        this.activeStreams = new Map();
        this.updateInterval = 10000; // Update every 10 seconds
        
        this.init();
    }

    async init() {
        console.log('🏀 Initializing Live Scoreboard Integration...');
        
        // Check for API availability
        await this.checkAPIHealth();
        
        // Setup periodic updates
        this.startAutoUpdate();
        
        // Listen for data requests
        this.setupEventListeners();
        
        console.log('✅ Live Scoreboard Integration ready');
    }

    // Vault integration for secure key storage
    getVaultKey(keyName) {
        // Check localStorage first (for development)
        if (typeof localStorage !== 'undefined') {
            const vaultKey = localStorage.getItem(`vault_${keyName}`);
            if (vaultKey) return vaultKey;
        }
        
        // Check for Cloudflare KV or other vault service
        // This would integrate with your actual vault service
        return null;
    }

    // Save key to vault
    async saveToVault(keyName, keyValue) {
        if (typeof localStorage !== 'undefined') {
            localStorage.setItem(`vault_${keyName}`, keyValue);
            console.log(`🔐 Key saved to vault: ${keyName}`);
            return true;
        }
        return false;
    }

    // Check API health
    async checkAPIHealth() {
        try {
            // Check Live Scoreboard API
            const scoreboardHealth = await this.testScoreboardAPI();
            console.log(`📊 Scoreboard API: ${scoreboardHealth ? '✅ Healthy' : '❌ Unavailable'}`);
            
            // Check SportsRadar availability
            const sportsRadarHealth = await this.testSportsRadarAPI();
            console.log(`🎯 SportsRadar API: ${sportsRadarHealth ? '✅ Connected' : '⚠️ No valid keys'}`);
            
            return { scoreboardHealth, sportsRadarHealth };
        } catch (error) {
            console.error('Health check failed:', error);
            return { scoreboardHealth: false, sportsRadarHealth: false };
        }
    }

    async testScoreboardAPI() {
        try {
            const response = await fetch(`${this.scoreboardAPI.base}/mlb/get-game-count`, {
                method: 'GET',
                headers: { 'Content-Type': 'application/json' }
            });
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    async testSportsRadarAPI() {
        // Test with MLB endpoint (least restrictive)
        const apiKey = this.sportsRadarConfig.keys.mlb;
        if (!apiKey || apiKey === 'demo_key') return false;
        
        try {
            const response = await fetch(
                `${this.sportsRadarConfig.endpoints.mlb}/games/${new Date().toISOString().split('T')[0]}/schedule.json?api_key=${apiKey}`,
                { method: 'GET' }
            );
            return response.ok;
        } catch (error) {
            return false;
        }
    }

    // Fetch live scores from scoreboard API
    async getGameCount(sport) {
        const endpoint = this.scoreboardAPI.endpoints[sport]?.gameCount;
        if (!endpoint) throw new Error(`Unsupported sport: ${sport}`);
        
        const cacheKey = `gameCount_${sport}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetch(`${this.scoreboardAPI.base}${endpoint}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.setCache(cacheKey, data);
            return data;
        } catch (error) {
            console.error(`Failed to fetch game count for ${sport}:`, error);
            return { count: 0, error: error.message };
        }
    }

    async getLiveScore(sport, gameId) {
        const endpoint = this.scoreboardAPI.endpoints[sport]?.liveScore;
        if (!endpoint) throw new Error(`Unsupported sport: ${sport}`);
        
        const cacheKey = `liveScore_${sport}_${gameId}`;
        const cached = this.getFromCache(cacheKey);
        if (cached) return cached;
        
        try {
            const response = await fetch(`${this.scoreboardAPI.base}${endpoint}${gameId}`);
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            
            // Enhance with SportsRadar data if available
            const enhanced = await this.enhanceWithSportsRadar(sport, data);
            
            this.setCache(cacheKey, enhanced);
            return enhanced;
        } catch (error) {
            console.error(`Failed to fetch live score:`, error);
            return { gameId, error: error.message };
        }
    }

    // Enhance scoreboard data with SportsRadar details
    async enhanceWithSportsRadar(sport, scoreData) {
        const apiKey = this.sportsRadarConfig.keys[sport];
        if (!apiKey || apiKey === 'demo_key') return scoreData;
        
        try {
            // Build SportsRadar request based on sport
            let endpoint = '';
            switch(sport) {
                case 'mlb':
                    endpoint = `/games/${scoreData.gameId}/boxscore.json`;
                    break;
                case 'nfl':
                    endpoint = `/games/${scoreData.gameId}/statistics.json`;
                    break;
                default:
                    return scoreData;
            }
            
            const url = `${this.sportsRadarConfig.endpoints[sport]}${endpoint}?api_key=${apiKey}`;
            const response = await fetch(url);
            
            if (response.ok) {
                const sportsRadarData = await response.json();
                
                // Merge data
                return {
                    ...scoreData,
                    enhanced: true,
                    sportsRadarData: {
                        boxscore: sportsRadarData.boxscore || null,
                        statistics: sportsRadarData.statistics || null,
                        leaders: sportsRadarData.leaders || null,
                        lastPlay: sportsRadarData.last_play || null
                    }
                };
            }
        } catch (error) {
            console.warn('SportsRadar enhancement failed:', error);
        }
        
        return scoreData;
    }

    // Get all live games for a sport
    async getAllLiveGames(sport) {
        try {
            // Get game count first
            const countData = await this.getGameCount(sport);
            const gameCount = countData.count || 0;
            
            if (gameCount === 0) {
                return { sport, games: [], message: 'No live games' };
            }
            
            // Fetch all game scores in parallel
            const gamePromises = [];
            for (let i = 0; i < gameCount; i++) {
                gamePromises.push(this.getLiveScore(sport, i));
            }
            
            const games = await Promise.all(gamePromises);
            
            return {
                sport,
                games: games.filter(g => !g.error),
                timestamp: new Date().toISOString(),
                enhanced: games.some(g => g.enhanced)
            };
        } catch (error) {
            console.error(`Failed to fetch all live games for ${sport}:`, error);
            return { sport, games: [], error: error.message };
        }
    }

    // Stream live updates
    streamLiveUpdates(sport, callback) {
        const streamId = `stream_${sport}_${Date.now()}`;
        
        // Create update function
        const updateFunction = async () => {
            const data = await this.getAllLiveGames(sport);
            callback(data);
        };
        
        // Initial update
        updateFunction();
        
        // Set interval for updates
        const intervalId = setInterval(updateFunction, this.updateInterval);
        
        // Store stream reference
        this.activeStreams.set(streamId, {
            sport,
            intervalId,
            startTime: Date.now()
        });
        
        console.log(`📡 Started live stream for ${sport} (ID: ${streamId})`);
        
        // Return stop function
        return () => this.stopStream(streamId);
    }

    stopStream(streamId) {
        const stream = this.activeStreams.get(streamId);
        if (stream) {
            clearInterval(stream.intervalId);
            this.activeStreams.delete(streamId);
            console.log(`🛑 Stopped stream ${streamId}`);
        }
    }

    // Auto-update functionality
    startAutoUpdate() {
        // Update MLB and NFL scores periodically
        setInterval(async () => {
            if (this.activeStreams.size > 0) {
                // Only update if there are active streams
                console.log(`🔄 Auto-updating ${this.activeStreams.size} active streams`);
            }
        }, this.updateInterval);
    }

    // Create scoreboard widget
    createScoreboardWidget(containerId, sport) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return;
        }
        
        // Create widget HTML
        container.innerHTML = `
            <div class="scoreboard-widget" data-sport="${sport}">
                <div class="scoreboard-header">
                    <h3>${sport.toUpperCase()} Live Scores</h3>
                    <span class="scoreboard-status">🔄 Loading...</span>
                </div>
                <div class="scoreboard-games" id="${containerId}-games">
                    <!-- Games will be inserted here -->
                </div>
                <div class="scoreboard-footer">
                    <small>Updates every ${this.updateInterval / 1000}s</small>
                    <button onclick="liveScoreboard.refreshScores('${sport}', '${containerId}')">
                        🔄 Refresh Now
                    </button>
                </div>
            </div>
        `;
        
        // Add styles if not already present
        this.addScoreboardStyles();
        
        // Start streaming updates
        const stopStream = this.streamLiveUpdates(sport, (data) => {
            this.updateScoreboardWidget(containerId, data);
        });
        
        // Store stop function for cleanup
        container.dataset.stopStream = stopStream;
    }

    updateScoreboardWidget(containerId, data) {
        const gamesContainer = document.getElementById(`${containerId}-games`);
        const statusElement = document.querySelector(`#${containerId} .scoreboard-status`);
        
        if (!gamesContainer) return;
        
        // Update status
        statusElement.textContent = data.games.length > 0 ? 
            `📺 ${data.games.length} Live Games` : 
            '📴 No Live Games';
        
        // Clear and populate games
        gamesContainer.innerHTML = data.games.map(game => `
            <div class="game-card ${game.enhanced ? 'enhanced' : ''}">
                <div class="teams">
                    <div class="team home">
                        <span class="team-name">${game.homeTeam || 'Home'}</span>
                        <span class="team-score">${game.homeScore || 0}</span>
                    </div>
                    <div class="team away">
                        <span class="team-name">${game.awayTeam || 'Away'}</span>
                        <span class="team-score">${game.awayScore || 0}</span>
                    </div>
                </div>
                <div class="game-info">
                    <span class="period">${game.period || game.inning || 'Live'}</span>
                    ${game.timeRemaining ? `<span class="time">${game.timeRemaining}</span>` : ''}
                </div>
                ${game.enhanced ? '<span class="enhanced-badge">📊 Enhanced</span>' : ''}
            </div>
        `).join('') || '<p>No games currently live</p>';
    }

    refreshScores(sport, containerId) {
        this.getAllLiveGames(sport).then(data => {
            this.updateScoreboardWidget(containerId, data);
        });
    }

    addScoreboardStyles() {
        if (document.getElementById('scoreboard-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'scoreboard-styles';
        styles.textContent = `
            .scoreboard-widget {
                background: rgba(0, 0, 0, 0.9);
                border: 1px solid #BF5700;
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
            }
            
            .scoreboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 10px;
                border-bottom: 1px solid rgba(191, 87, 0, 0.3);
            }
            
            .scoreboard-header h3 {
                color: #BF5700;
                margin: 0;
            }
            
            .scoreboard-status {
                color: rgba(255, 255, 255, 0.8);
                font-size: 14px;
            }
            
            .scoreboard-games {
                display: grid;
                gap: 15px;
                max-height: 400px;
                overflow-y: auto;
            }
            
            .game-card {
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(191, 87, 0, 0.2);
                border-radius: 8px;
                padding: 15px;
                position: relative;
                transition: all 0.3s ease;
            }
            
            .game-card:hover {
                background: rgba(255, 255, 255, 0.08);
                border-color: #BF5700;
            }
            
            .game-card.enhanced {
                border-color: #00B2A9;
            }
            
            .teams {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            
            .team {
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .team-name {
                color: white;
                font-weight: 500;
            }
            
            .team-score {
                color: #BF5700;
                font-size: 24px;
                font-weight: bold;
            }
            
            .game-info {
                display: flex;
                justify-content: center;
                gap: 15px;
                color: rgba(255, 255, 255, 0.6);
                font-size: 12px;
            }
            
            .enhanced-badge {
                position: absolute;
                top: 5px;
                right: 5px;
                font-size: 10px;
                color: #00B2A9;
            }
            
            .scoreboard-footer {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-top: 15px;
                padding-top: 10px;
                border-top: 1px solid rgba(191, 87, 0, 0.3);
            }
            
            .scoreboard-footer small {
                color: rgba(255, 255, 255, 0.5);
            }
            
            .scoreboard-footer button {
                background: rgba(191, 87, 0, 0.2);
                border: 1px solid #BF5700;
                color: white;
                padding: 5px 10px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .scoreboard-footer button:hover {
                background: rgba(191, 87, 0, 0.4);
            }
        `;
        
        document.head.appendChild(styles);
    }

    // Cache management
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

    // Event listeners
    setupEventListeners() {
        document.addEventListener('requestLiveScores', async (event) => {
            const { sport, gameId } = event.detail;
            
            try {
                let data;
                if (gameId !== undefined) {
                    data = await this.getLiveScore(sport, gameId);
                } else {
                    data = await this.getAllLiveGames(sport);
                }
                
                document.dispatchEvent(new CustomEvent('liveScoresReceived', {
                    detail: { sport, gameId, data }
                }));
            } catch (error) {
                document.dispatchEvent(new CustomEvent('liveScoresError', {
                    detail: { sport, gameId, error: error.message }
                }));
            }
        });
    }

    // Cleanup
    destroy() {
        // Stop all active streams
        this.activeStreams.forEach((stream, streamId) => {
            this.stopStream(streamId);
        });
        
        // Clear cache
        this.cache.clear();
        
        console.log('🧹 Live Scoreboard Integration cleaned up');
    }
}

// Global instance
let liveScoreboard;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        liveScoreboard = new LiveScoreboardIntegration();
        window.liveScoreboard = liveScoreboard;
        
        // Auto-create widgets if containers exist
        if (document.getElementById('mlb-scoreboard')) {
            liveScoreboard.createScoreboardWidget('mlb-scoreboard', 'mlb');
        }
        if (document.getElementById('nfl-scoreboard')) {
            liveScoreboard.createScoreboardWidget('nfl-scoreboard', 'nfl');
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LiveScoreboardIntegration;
}