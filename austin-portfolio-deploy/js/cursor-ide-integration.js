/**
 * Cursor IDE Integration for Blaze Intelligence Platform
 * Connects development environment with production systems
 */

class CursorIDEIntegration {
    constructor() {
        this.config = {
            endpoints: {
                cardinalsAnalytics: '/api/cardinals-readiness',
                visionAI: '/api/vision-analysis',
                teamIntelligence: '/api/team-intelligence',
                nilCalculator: '/api/nil-calculator'
            },
            dataSources: {
                mlb: 'https://statsapi.mlb.com/api/v1',
                nfl: 'https://site.api.espn.com/apis/site/v2/sports/football/nfl',
                nba: 'https://stats.nba.com/stats',
                ncaa: 'https://api.collegefootballdata.com',
                perfectGame: 'https://www.perfectgame.org/api'
            },
            updateInterval: 10000, // 10 seconds
            cacheExpiry: 300000 // 5 minutes
        };
        
        this.cache = new Map();
        this.activeConnections = new Set();
    }

    /**
     * Initialize all integrations
     */
    async initialize() {
        console.log('🚀 Initializing Cursor IDE Integration...');
        
        // Setup real-time data connections
        await this.setupDataConnections();
        
        // Initialize vision AI if available
        if (window.blazeVisionAI) {
            await window.blazeVisionAI.initialize();
        }
        
        // Setup Cardinals Analytics
        await this.initializeCardinalsAnalytics();
        
        // Start periodic updates
        this.startPeriodicUpdates();
        
        console.log('✅ Cursor IDE Integration ready');
    }

    /**
     * Setup WebSocket connections for real-time data
     */
    async setupDataConnections() {
        // MLB Real-time connection
        this.connectToDataSource('mlb', 'wss://blaze-intelligence.com/ws/mlb');
        
        // NFL Real-time connection
        this.connectToDataSource('nfl', 'wss://blaze-intelligence.com/ws/nfl');
        
        // NBA Real-time connection
        this.connectToDataSource('nba', 'wss://blaze-intelligence.com/ws/nba');
    }

    /**
     * Connect to a specific data source via WebSocket
     */
    connectToDataSource(source, wsUrl) {
        try {
            const ws = new WebSocket(wsUrl);
            
            ws.onopen = () => {
                console.log(`✅ Connected to ${source.toUpperCase()} data stream`);
                this.activeConnections.add(source);
            };
            
            ws.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.processRealTimeData(source, data);
            };
            
            ws.onerror = (error) => {
                console.error(`❌ ${source.toUpperCase()} connection error:`, error);
            };
            
            ws.onclose = () => {
                console.log(`🔌 ${source.toUpperCase()} connection closed`);
                this.activeConnections.delete(source);
                // Attempt reconnection after 5 seconds
                setTimeout(() => this.connectToDataSource(source, wsUrl), 5000);
            };
            
        } catch (error) {
            console.error(`Failed to connect to ${source}:`, error);
        }
    }

    /**
     * Process incoming real-time data
     */
    processRealTimeData(source, data) {
        // Update cache
        this.cache.set(`${source}_latest`, {
            data: data,
            timestamp: Date.now()
        });
        
        // Trigger UI updates
        this.updateDashboard(source, data);
        
        // Run analytics if Cardinals data
        if (source === 'mlb' && data.team === 'Cardinals') {
            this.runCardinalsAnalytics(data);
        }
    }

    /**
     * Initialize Cardinals-specific analytics
     */
    async initializeCardinalsAnalytics() {
        try {
            const response = await fetch('/api/cardinals-readiness');
            const data = await response.json();
            
            this.cache.set('cardinals_readiness', {
                data: data,
                timestamp: Date.now()
            });
            
            console.log('📊 Cardinals Analytics initialized:', data);
        } catch (error) {
            console.error('Failed to initialize Cardinals Analytics:', error);
        }
    }

    /**
     * Run Cardinals-specific analytics
     */
    async runCardinalsAnalytics(gameData) {
        const analytics = {
            blazeScore: this.calculateBlazeScore(gameData),
            readinessIndex: this.calculateReadinessIndex(gameData),
            leveragePoints: this.identifyLeveragePoints(gameData),
            recommendations: this.generateRecommendations(gameData)
        };
        
        // Send to backend
        await this.sendAnalytics('cardinals', analytics);
        
        // Update UI
        this.updateCardinalsDisplay(analytics);
    }

    /**
     * Calculate Blaze Score for a team/player
     */
    calculateBlazeScore(data) {
        let score = 100; // Base score
        
        // Performance metrics
        if (data.battingAverage) score += (data.battingAverage - 0.250) * 100;
        if (data.era) score += (3.50 - data.era) * 10;
        if (data.winPercentage) score += data.winPercentage * 50;
        
        // Momentum indicators
        if (data.lastFiveGames) {
            const wins = data.lastFiveGames.filter(g => g.result === 'W').length;
            score += wins * 10;
        }
        
        // Injury adjustments
        if (data.injuredPlayers) score -= data.injuredPlayers.length * 5;
        
        return Math.max(0, Math.min(200, Math.round(score)));
    }

    /**
     * Calculate Readiness Index
     */
    calculateReadinessIndex(data) {
        const factors = {
            restDays: data.daysSinceLastGame || 1,
            homeField: data.isHome ? 1.1 : 0.9,
            opponent: this.getOpponentStrength(data.opponent),
            weather: this.getWeatherFactor(data.weather),
            momentum: this.getMomentumFactor(data)
        };
        
        let index = 50; // Base readiness
        
        index *= factors.homeField;
        index *= factors.opponent;
        index *= factors.weather;
        index *= factors.momentum;
        
        // Rest factor
        if (factors.restDays === 1) index *= 1.0;
        else if (factors.restDays === 2) index *= 1.1;
        else if (factors.restDays >= 3) index *= 0.95; // Too much rest
        
        return Math.round(index);
    }

    /**
     * Identify leverage points in the game
     */
    identifyLeveragePoints(data) {
        const points = [];
        
        // Pitching matchups
        if (data.startingPitcher && data.opponentBatters) {
            data.opponentBatters.forEach(batter => {
                const history = this.getPitcherBatterHistory(data.startingPitcher, batter);
                if (history.average < 0.200) {
                    points.push({
                        type: 'favorable_matchup',
                        description: `${data.startingPitcher} vs ${batter}: .${history.average * 1000}`,
                        impact: 'high'
                    });
                }
            });
        }
        
        // Bullpen advantages
        if (data.bullpenERA < 3.00) {
            points.push({
                type: 'bullpen_strength',
                description: 'Elite bullpen performance',
                impact: 'medium'
            });
        }
        
        return points;
    }

    /**
     * Generate strategic recommendations
     */
    generateRecommendations(data) {
        const recommendations = [];
        
        // Lineup recommendations
        if (data.lineup) {
            const optimized = this.optimizeLineup(data.lineup, data.opponentPitcher);
            recommendations.push({
                type: 'lineup',
                suggestion: optimized,
                confidence: 0.85
            });
        }
        
        // Pitching strategy
        if (data.startingPitcher) {
            const strategy = this.generatePitchingStrategy(data);
            recommendations.push({
                type: 'pitching',
                suggestion: strategy,
                confidence: 0.78
            });
        }
        
        return recommendations;
    }

    /**
     * Helper functions
     */
    getOpponentStrength(opponent) {
        // Mock implementation - would pull from database
        const strengths = {
            'Dodgers': 0.85,
            'Yankees': 0.88,
            'Astros': 0.82,
            'Brewers': 1.05,
            'Pirates': 1.15
        };
        return strengths[opponent] || 1.0;
    }

    getWeatherFactor(weather) {
        if (!weather) return 1.0;
        if (weather.wind > 15) return 0.9;
        if (weather.temperature < 50) return 0.95;
        if (weather.temperature > 90) return 0.93;
        return 1.0;
    }

    getMomentumFactor(data) {
        if (!data.lastFiveGames) return 1.0;
        const wins = data.lastFiveGames.filter(g => g.result === 'W').length;
        return 0.9 + (wins * 0.04); // 0.9 to 1.1 based on recent performance
    }

    getPitcherBatterHistory(pitcher, batter) {
        // Mock implementation
        return {
            average: Math.random() * 0.400,
            atBats: Math.floor(Math.random() * 30)
        };
    }

    optimizeLineup(lineup, opponentPitcher) {
        // Simplified lineup optimization
        return lineup.sort((a, b) => {
            // Sort by OPS against pitcher handedness
            const aOPS = opponentPitcher.throws === 'L' ? a.opsVsLeft : a.opsVsRight;
            const bOPS = opponentPitcher.throws === 'L' ? b.opsVsLeft : b.opsVsRight;
            return bOPS - aOPS;
        });
    }

    generatePitchingStrategy(data) {
        return {
            primaryPitch: 'Fastball (45%)',
            secondaryPitch: 'Slider (30%)',
            setupPitch: 'Changeup (25%)',
            notes: 'Attack zone early, expand with two strikes'
        };
    }

    /**
     * Send analytics to backend
     */
    async sendAnalytics(team, analytics) {
        try {
            const response = await fetch('/api/analytics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    team: team,
                    timestamp: new Date().toISOString(),
                    analytics: analytics
                })
            });
            
            if (response.ok) {
                console.log('✅ Analytics sent successfully');
            }
        } catch (error) {
            console.error('Failed to send analytics:', error);
        }
    }

    /**
     * Update dashboard displays
     */
    updateDashboard(source, data) {
        const dashboardElement = document.getElementById(`${source}-dashboard`);
        if (dashboardElement) {
            // Update with real-time data
            dashboardElement.querySelector('.latest-update').textContent = new Date().toLocaleTimeString();
            dashboardElement.querySelector('.data-content').innerHTML = this.formatDataForDisplay(data);
        }
    }

    updateCardinalsDisplay(analytics) {
        const displayElement = document.getElementById('cardinals-analytics');
        if (displayElement) {
            displayElement.innerHTML = `
                <div class="analytics-card">
                    <h2>Cardinals Intelligence</h2>
                    <div class="blaze-score">
                        <span class="label">Blaze Score:</span>
                        <span class="value">${analytics.blazeScore}</span>
                    </div>
                    <div class="readiness">
                        <span class="label">Readiness:</span>
                        <span class="value">${analytics.readinessIndex}%</span>
                    </div>
                    <div class="leverage-points">
                        <h3>Leverage Points:</h3>
                        ${analytics.leveragePoints.map(p => `
                            <div class="point ${p.impact}">
                                ${p.description}
                            </div>
                        `).join('')}
                    </div>
                    <div class="recommendations">
                        <h3>Strategic Recommendations:</h3>
                        ${analytics.recommendations.map(r => `
                            <div class="recommendation">
                                <strong>${r.type}:</strong> ${JSON.stringify(r.suggestion)}
                                <span class="confidence">Confidence: ${(r.confidence * 100).toFixed(0)}%</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            `;
        }
    }

    formatDataForDisplay(data) {
        return `<pre>${JSON.stringify(data, null, 2)}</pre>`;
    }

    /**
     * Start periodic updates
     */
    startPeriodicUpdates() {
        setInterval(() => {
            // Clean expired cache entries
            this.cleanCache();
            
            // Check connection health
            this.checkConnections();
            
            // Update metrics
            this.updateMetrics();
            
        }, this.config.updateInterval);
    }

    cleanCache() {
        const now = Date.now();
        for (const [key, value] of this.cache.entries()) {
            if (now - value.timestamp > this.config.cacheExpiry) {
                this.cache.delete(key);
            }
        }
    }

    checkConnections() {
        const sources = ['mlb', 'nfl', 'nba'];
        sources.forEach(source => {
            if (!this.activeConnections.has(source)) {
                console.log(`🔄 Attempting to reconnect to ${source}...`);
                this.connectToDataSource(source, `wss://blaze-intelligence.com/ws/${source}`);
            }
        });
    }

    updateMetrics() {
        const metrics = {
            activeConnections: this.activeConnections.size,
            cacheSize: this.cache.size,
            lastUpdate: new Date().toISOString()
        };
        
        const metricsElement = document.getElementById('system-metrics');
        if (metricsElement) {
            metricsElement.innerHTML = `
                <span>Connections: ${metrics.activeConnections}/3</span>
                <span>Cache: ${metrics.cacheSize} items</span>
                <span>Updated: ${new Date().toLocaleTimeString()}</span>
            `;
        }
    }

    /**
     * Export current state for debugging
     */
    exportState() {
        return {
            config: this.config,
            activeConnections: Array.from(this.activeConnections),
            cacheSize: this.cache.size,
            cacheItems: Array.from(this.cache.keys())
        };
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.cursorIntegration = new CursorIDEIntegration();
    
    // Auto-initialize if on a dashboard page
    if (document.querySelector('#dashboard-container')) {
        window.cursorIntegration.initialize();
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CursorIDEIntegration;
}