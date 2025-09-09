// Frontend Real Data Integration for Blaze Intelligence
// Connects dashboard tiles and charts to real Cardinals API data

class FrontendRealDataIntegration {
    constructor() {
        this.apiBase = window.location.origin;
        this.cardinalsData = null;
        this.demoMode = false;
        this.lastUpdate = null;
        this.updateInterval = null;
        this.retryCount = 0;
        this.maxRetries = 3;
    }

    // Initialize the integration
    async init() {
        try {
            await this.fetchCardinalsData();
            this.updateDashboardTiles();
            this.updateCharts();
            this.startPeriodicUpdates();
            this.setupErrorHandling();
        } catch (error) {
            console.warn('Failed to initialize real data integration:', error);
            this.enableDemoMode();
        }
    }

    // Fetch Cardinals data from our API
    async fetchCardinalsData() {
        try {
            const response = await fetch(`${this.apiBase}/api/mlb/cardinals/summary`, {
                headers: {
                    'Accept': 'application/json'
                }
            });

            if (response.status === 503) {
                // API is down, enable demo mode
                this.enableDemoMode();
                return null;
            }

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }

            const result = await response.json();
            
            if (result.success && result.data) {
                this.cardinalsData = result.data;
                this.demoMode = false;
                this.lastUpdate = new Date(result.timestamp);
                this.retryCount = 0;
                this.hideDemoModeBadges();
                return result.data;
            } else {
                throw new Error(result.error || 'No data available');
            }
        } catch (error) {
            this.retryCount++;
            
            // If we've exceeded retries or have no cached data, enable demo mode
            if (this.retryCount >= this.maxRetries || !this.cardinalsData) {
                this.enableDemoMode();
            }
            
            throw error;
        }
    }

    // Update dashboard tiles with real data
    updateDashboardTiles() {
        if (this.demoMode || !this.cardinalsData) {
            this.showDemoModeTiles();
            return;
        }

        const data = this.cardinalsData;

        // Update team record tile
        this.updateTile('team-record', {
            title: `${data.team?.name || 'Cardinals'} Record`,
            value: data.standings ? `${data.standings.wins}-${data.standings.losses}` : 'N/A',
            subtitle: data.standings ? `${data.standings.winningPercentage} Win %` : '',
            trend: data.standings?.gamesBack ? `${data.standings.gamesBack} GB` : ''
        });

        // Update recent performance tile
        if (data.recentGames && data.recentGames.length > 0) {
            const recentResults = data.recentGames.slice(0, 5);
            const wins = recentResults.filter(game => {
                if (!game.score) return false;
                return game.score.cardinals > game.score.opponent;
            }).length;
            
            this.updateTile('recent-performance', {
                title: 'Last 5 Games',
                value: `${wins}-${recentResults.length - wins}`,
                subtitle: 'Win-Loss Record',
                games: recentResults.map(game => ({
                    opponent: game.opponentAbbrev,
                    result: game.score ? (game.score.cardinals > game.score.opponent ? 'W' : 'L') : 'TBD',
                    score: game.score ? `${game.score.cardinals}-${game.score.opponent}` : ''
                }))
            });
        }

        // Update team stats tile
        if (data.statistics) {
            this.updateTile('team-stats', {
                title: 'Team Statistics',
                hitting: {
                    avg: data.statistics.hitting.avg || 'N/A',
                    hrs: data.statistics.hitting.homeRuns || 0,
                    rbi: data.statistics.hitting.rbi || 0
                },
                pitching: {
                    era: data.statistics.pitching.era || 'N/A',
                    whip: data.statistics.pitching.whip || 'N/A',
                    so: data.statistics.pitching.strikeOuts || 0
                }
            });
        }

        // Update roster info tile
        if (data.roster) {
            this.updateTile('roster-info', {
                title: 'Active Roster',
                value: data.roster.totalPlayers || 'N/A',
                subtitle: 'Total Players',
                keyPlayers: data.roster.keyPlayers?.slice(0, 3).map(p => p.fullName) || []
            });
        }
    }

    // Update charts with real data
    updateCharts() {
        if (this.demoMode || !this.cardinalsData) {
            this.showDemoModeCharts();
            return;
        }

        // Update performance trend chart
        if (this.cardinalsData.recentGames) {
            this.updatePerformanceChart();
        }

        // Update statistics radar chart
        if (this.cardinalsData.statistics) {
            this.updateStatsRadarChart();
        }
    }

    // Update specific dashboard tile
    updateTile(tileId, data) {
        const tile = document.getElementById(tileId) || document.querySelector(`[data-tile="${tileId}"]`);
        if (!tile) return;

        // Update tile content based on data
        const titleEl = tile.querySelector('.tile-title, .card-title');
        if (titleEl && data.title) {
            titleEl.textContent = data.title;
        }

        const valueEl = tile.querySelector('.tile-value, .metric-value');
        if (valueEl && data.value) {
            valueEl.textContent = data.value;
        }

        const subtitleEl = tile.querySelector('.tile-subtitle, .metric-label');
        if (subtitleEl && data.subtitle) {
            subtitleEl.textContent = data.subtitle;
        }

        // Add real-data indicator
        tile.classList.add('real-data');
        tile.classList.remove('demo-mode');
    }

    // Update performance trend chart
    updatePerformanceChart() {
        const games = this.cardinalsData.recentGames.slice(-10).reverse(); // Last 10 games, chronological
        const chartData = {
            labels: games.map(game => {
                const date = new Date(game.date);
                return `${date.getMonth() + 1}/${date.getDate()}`;
            }),
            datasets: [{
                label: 'Game Results',
                data: games.map(game => {
                    if (!game.score) return null;
                    const runDiff = game.score.cardinals - game.score.opponent;
                    return runDiff > 0 ? 1 : 0; // 1 for win, 0 for loss
                }),
                borderColor: '#BF5700',
                backgroundColor: 'rgba(191, 87, 0, 0.1)',
                tension: 0.4
            }]
        };

        // Update chart if exists
        if (window.enhancedCharts) {
            window.enhancedCharts.createLiveLineChart('performance-trend-chart', chartData);
        }
    }

    // Update statistics radar chart
    updateStatsRadarChart() {
        const stats = this.cardinalsData.statistics;
        
        // Normalize stats to 0-100 scale for radar chart
        const chartData = {
            labels: ['Batting Avg', 'Home Runs', 'ERA', 'WHIP', 'Strikeouts', 'Wins'],
            datasets: [{
                label: 'Cardinals Stats',
                data: [
                    parseFloat(stats.hitting.avg || 0) * 400, // Scale batting average
                    Math.min((stats.hitting.homeRuns || 0) / 2, 100), // Scale home runs
                    Math.max(100 - (parseFloat(stats.pitching.era || 5) * 20), 0), // Inverse ERA (lower is better)
                    Math.max(100 - (parseFloat(stats.pitching.whip || 1.5) * 67), 0), // Inverse WHIP
                    Math.min((stats.pitching.strikeOuts || 0) / 15, 100), // Scale strikeouts
                    Math.min((stats.pitching.wins || 0) * 3, 100) // Scale wins
                ]
            }]
        };

        if (window.enhancedCharts) {
            window.enhancedCharts.createPerformanceRadar('stats-radar-chart', chartData);
        }
    }

    // Enable demo mode with clear indicators
    enableDemoMode() {
        this.demoMode = true;
        this.showDemoModeBadges();
        this.showDemoModeTiles();
        this.showDemoModeCharts();
    }

    // Show demo mode badges
    showDemoModeBadges() {
        // Add demo mode badge to dashboard sections
        const dashboardSections = document.querySelectorAll('.dashboard-section, .live-stats-card');
        
        dashboardSections.forEach(section => {
            if (!section.querySelector('.demo-mode-badge')) {
                const badge = document.createElement('div');
                badge.className = 'demo-mode-badge';
                badge.innerHTML = `
                    <span class="badge-icon">⚠️</span>
                    <span class="badge-text">Demo Mode</span>
                    <span class="badge-subtitle">Live data temporarily unavailable</span>
                `;
                section.prepend(badge);
            }
        });
    }

    // Hide demo mode badges
    hideDemoModeBadges() {
        document.querySelectorAll('.demo-mode-badge').forEach(badge => {
            badge.remove();
        });
    }

    // Show demo mode tiles with placeholder data
    showDemoModeTiles() {
        this.updateTile('team-record', {
            title: 'Cardinals Record',
            value: '82-70',
            subtitle: '0.539 Win %',
            trend: 'Demo Data'
        });

        this.updateTile('recent-performance', {
            title: 'Last 5 Games',
            value: '3-2',
            subtitle: 'Demo Results'
        });
    }

    // Show demo mode charts
    showDemoModeCharts() {
        // Keep existing demo chart functionality but add demo indicators
        const charts = document.querySelectorAll('.chart-container');
        charts.forEach(chart => {
            chart.classList.add('demo-mode');
            
            if (!chart.querySelector('.demo-indicator')) {
                const indicator = document.createElement('div');
                indicator.className = 'demo-indicator';
                indicator.textContent = 'Demo Data';
                chart.appendChild(indicator);
            }
        });
    }

    // Start periodic updates (every 5 minutes)
    startPeriodicUpdates() {
        // Clear any existing interval
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }

        // Update every 5 minutes
        this.updateInterval = setInterval(async () => {
            try {
                await this.fetchCardinalsData();
                this.updateDashboardTiles();
                this.updateCharts();
            } catch (error) {
                console.warn('Periodic update failed:', error);
            }
        }, 5 * 60 * 1000); // 5 minutes
    }

    // Setup error handling
    setupErrorHandling() {
        // Handle network errors gracefully
        window.addEventListener('offline', () => {
            this.enableDemoMode();
        });

        window.addEventListener('online', async () => {
            try {
                await this.fetchCardinalsData();
                this.updateDashboardTiles();
                this.updateCharts();
            } catch (error) {
                console.warn('Failed to restore real data on reconnection:', error);
            }
        });
    }

    // Manual refresh method
    async refresh() {
        try {
            await this.fetchCardinalsData();
            this.updateDashboardTiles();
            this.updateCharts();
            
            // Show success indicator
            this.showUpdateIndicator('Data refreshed successfully', 'success');
        } catch (error) {
            this.showUpdateIndicator('Failed to refresh data', 'error');
            throw error;
        }
    }

    // Show update indicator
    showUpdateIndicator(message, type = 'info') {
        const indicator = document.createElement('div');
        indicator.className = `update-indicator ${type}`;
        indicator.textContent = message;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            if (indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
        }, 3000);
    }

    // Get data freshness info
    getDataInfo() {
        return {
            demoMode: this.demoMode,
            lastUpdate: this.lastUpdate,
            dataAge: this.lastUpdate ? Date.now() - this.lastUpdate.getTime() : null,
            retryCount: this.retryCount
        };
    }

    // Cleanup method
    destroy() {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
        }
        this.hideDemoModeBadges();
    }
}

// Add CSS for demo mode indicators
const demoModeStyles = `
    <style>
        .demo-mode-badge {
            background: rgba(255, 152, 0, 0.9);
            color: white;
            padding: 8px 16px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 600;
            margin-bottom: 16px;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .badge-subtitle {
            font-size: 10px;
            opacity: 0.8;
            margin-left: auto;
        }
        
        .demo-indicator {
            position: absolute;
            top: 8px;
            right: 8px;
            background: rgba(255, 152, 0, 0.9);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 10px;
            font-weight: 600;
        }
        
        .update-indicator {
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            color: white;
            font-weight: 600;
            z-index: 10000;
            animation: slideInRight 0.3s ease;
        }
        
        .update-indicator.success { background: rgba(76, 175, 80, 0.9); }
        .update-indicator.error { background: rgba(244, 67, 54, 0.9); }
        .update-indicator.info { background: rgba(33, 150, 243, 0.9); }
        
        @keyframes slideInRight {
            from { transform: translateX(100%); }
            to { transform: translateX(0); }
        }
        
        .real-data::after {
            content: '●';
            color: #4CAF50;
            position: absolute;
            top: 8px;
            right: 8px;
            font-size: 12px;
        }
    </style>
`;

document.head.insertAdjacentHTML('beforeend', demoModeStyles);

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.frontendRealData = new FrontendRealDataIntegration();
    window.frontendRealData.init();
});

// Export for use in other scripts
window.FrontendRealDataIntegration = FrontendRealDataIntegration;