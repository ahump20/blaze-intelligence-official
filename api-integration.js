// API Integration Scripts for Blaze Intelligence Dashboard

// Configuration
const API_CONFIG = {
    sportsRadar: {
        baseUrl: 'https://api.sportradar.us',
        apiKey: 'usrUqychOBmYeQogGbZ5DG6eKv1hLyVrfCMp6dnH',
        endpoints: {
            nbaSchedule: '/nba/trial/v8/en/games/2024/schedule.json',
            nbaStandings: '/nba/trial/v8/en/seasons/2024/standings.json',
            nbaTeamProfile: '/nba/trial/v8/en/teams/{team_id}/profile.json',
            nbaPlayerProfile: '/nba/trial/v8/en/players/{player_id}/profile.json',
            nbaGameSummary: '/nba/trial/v8/en/games/{game_id}/summary.json'
        }
    },
    blazeWorker: {
        baseUrl: 'https://blaze-worker.humphrey-austin20.workers.dev',
        endpoints: {
            teams: '/api/teams',
            players: '/api/players',
            games: '/api/games',
            predictions: '/api/predictions',
            injuries: '/api/injuries',
            analytics: '/api/analytics'
        }
    }
};

// API Client Class
class BlazeAPI {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Generic API request method
    async request(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(url, {
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            // Cache the result
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // SportsRadar API methods
    async getSportsRadarData(endpoint, params = {}) {
        const url = new URL(API_CONFIG.sportsRadar.baseUrl + endpoint);
        url.searchParams.append('api_key', API_CONFIG.sportsRadar.apiKey);
        
        Object.entries(params).forEach(([key, value]) => {
            url.searchParams.append(key, value);
        });

        return this.request(url.toString());
    }

    // Blaze Worker API methods
    async getBlazeData(endpoint, options = {}) {
        const url = API_CONFIG.blazeWorker.baseUrl + endpoint;
        return this.request(url, options);
    }

    // Team data
    async getTeams() {
        try {
            return await this.getBlazeData(API_CONFIG.blazeWorker.endpoints.teams);
        } catch (error) {
            console.warn('Failed to fetch from worker, using mock data');
            return this.getMockTeams();
        }
    }

    async getTeamProfile(teamId) {
        try {
            return await this.getBlazeData(`${API_CONFIG.blazeWorker.endpoints.teams}/${teamId}`);
        } catch (error) {
            return this.getMockTeamProfile(teamId);
        }
    }

    // Player data
    async getPlayers(teamId) {
        try {
            return await this.getBlazeData(`${API_CONFIG.blazeWorker.endpoints.players}?team=${teamId}`);
        } catch (error) {
            return this.getMockPlayers(teamId);
        }
    }

    async getPlayerProfile(playerId) {
        try {
            return await this.getBlazeData(`${API_CONFIG.blazeWorker.endpoints.players}/${playerId}`);
        } catch (error) {
            return this.getMockPlayerProfile(playerId);
        }
    }

    // Game data
    async getGames(teamId, limit = 10) {
        try {
            return await this.getBlazeData(`${API_CONFIG.blazeWorker.endpoints.games}?team=${teamId}&limit=${limit}`);
        } catch (error) {
            return this.getMockGames(teamId);
        }
    }

    async getGameDetails(gameId) {
        try {
            return await this.getBlazeData(`${API_CONFIG.blazeWorker.endpoints.games}/${gameId}`);
        } catch (error) {
            return this.getMockGameDetails(gameId);
        }
    }

    // Analytics and predictions
    async getTeamAnalytics(teamId) {
        try {
            return await this.getBlazeData(`${API_CONFIG.blazeWorker.endpoints.analytics}/team/${teamId}`);
        } catch (error) {
            return this.getMockTeamAnalytics(teamId);
        }
    }

    async getPredictions(gameId) {
        try {
            return await this.getBlazeData(`${API_CONFIG.blazeWorker.endpoints.predictions}/${gameId}`);
        } catch (error) {
            return this.getMockPredictions(gameId);
        }
    }

    async getInjuryReports(teamId) {
        try {
            return await this.getBlazeData(`${API_CONFIG.blazeWorker.endpoints.injuries}?team=${teamId}`);
        } catch (error) {
            return this.getMockInjuryReports(teamId);
        }
    }

    // Mock data methods (fallbacks)
    getMockTeams() {
        return [
            { id: 'mem', name: 'Memphis Grizzlies', abbreviation: 'MEM', conference: 'Western' },
            { id: 'tex', name: 'Texas Longhorns', abbreviation: 'TEX', conference: 'Western' },
            { id: 'stl', name: 'St. Louis Cardinals', abbreviation: 'STL', conference: 'Eastern' }
        ];
    }

    getMockPlayers(teamId) {
        const players = {
            lal: [
                { id: 'lebron', name: 'LeBron James', position: 'Forward', number: 23, stats: { ppg: 28.2, rpg: 7.8, apg: 8.4 } },
                { id: 'ad', name: 'Anthony Davis', position: 'Center', number: 3, stats: { ppg: 24.8, rpg: 12.3, apg: 2.8 } },
                { id: 'russell', name: "D'Angelo Russell", position: 'Guard', number: 1, stats: { ppg: 18.4, rpg: 3.2, apg: 6.8 } },
                { id: 'reaves', name: 'Austin Reaves', position: 'Guard', number: 15, stats: { ppg: 15.2, rpg: 4.8, apg: 5.2 } }
            ]
        };
        return players[teamId] || [];
    }

    getMockGames(teamId) {
        return [
            {
                id: 'game1',
                homeTeam: 'LAL',
                awayTeam: 'GSW',
                date: new Date(Date.now() + 86400000).toISOString(),
                status: 'scheduled',
                venue: 'Crypto.com Arena'
            },
            {
                id: 'game2',
                homeTeam: 'PHX',
                awayTeam: 'LAL',
                date: new Date(Date.now() + 3 * 86400000).toISOString(),
                status: 'scheduled',
                venue: 'Footprint Center'
            }
        ];
    }

    getMockTeamAnalytics(teamId) {
        return {
            winRate: 73.2,
            pointsPerGame: 112.8,
            efficiency: 118.4,
            injuryRisk: 'Low',
            ranking: 3,
            conference: 'Western',
            trends: {
                winRate: '+12%',
                pointsPerGame: '+5.3',
                efficiency: '+8.1',
                injuryRisk: '-2%'
            }
        };
    }

    getMockPredictions(gameId) {
        return {
            gameId,
            winProbability: 67.8,
            predictedScore: {
                home: 115,
                away: 108
            },
            confidence: 'High',
            keyFactors: [
                'Home court advantage',
                'Recent form',
                'Head-to-head record'
            ]
        };
    }

    getMockInjuryReports(teamId) {
        return [
            {
                playerId: 'ad',
                playerName: 'Anthony Davis',
                status: 'Day-to-Day',
                injury: 'Knee soreness',
                riskLevel: 'Medium',
                expectedReturn: '2-3 days'
            }
        ];
    }
}

// Dashboard Data Manager
class DashboardManager {
    constructor() {
        this.api = new BlazeAPI();
        this.currentTeam = 'lal';
        this.refreshInterval = null;
    }

    async initialize() {
        await this.loadDashboardData();
        this.startAutoRefresh();
    }

    async loadDashboardData() {
        try {
            this.showLoading();
            
            // Load all dashboard data in parallel
            const [teams, players, games, analytics, injuries] = await Promise.all([
                this.api.getTeams(),
                this.api.getPlayers(this.currentTeam),
                this.api.getGames(this.currentTeam),
                this.api.getTeamAnalytics(this.currentTeam),
                this.api.getInjuryReports(this.currentTeam)
            ]);

            // Update UI with loaded data
            this.updateStatsCards(analytics);
            this.updateUpcomingGames(games);
            this.updatePlayerCards(players);
            
            this.hideLoading();
        } catch (error) {
            console.error('Failed to load dashboard data:', error);
            this.showError('Failed to load dashboard data');
        }
    }

    updateStatsCards(analytics) {
        const statsCards = document.querySelectorAll('.stat-card');
        
        if (statsCards.length >= 4) {
            // Win Rate
            this.updateStatCard(statsCards[0], {
                value: `${analytics.winRate}%`,
                trend: analytics.trends.winRate,
                comparison: 'vs 61.2% last season'
            });

            // Points Per Game
            this.updateStatCard(statsCards[1], {
                value: analytics.pointsPerGame,
                trend: analytics.trends.pointsPerGame,
                comparison: `${analytics.ranking}rd in conference`
            });

            // Injury Risk
            this.updateStatCard(statsCards[2], {
                value: analytics.injuryRisk,
                trend: analytics.trends.injuryRisk,
                comparison: '2 players monitoring'
            });

            // Team Efficiency
            this.updateStatCard(statsCards[3], {
                value: analytics.efficiency,
                trend: analytics.trends.efficiency,
                comparison: 'Above league average'
            });
        }
    }

    updateStatCard(card, data) {
        const valueEl = card.querySelector('.stat-value');
        const trendEl = card.querySelector('.stat-trend');
        const comparisonEl = card.querySelector('.stat-comparison');

        if (valueEl) valueEl.textContent = data.value;
        if (trendEl) trendEl.textContent = data.trend;
        if (comparisonEl) comparisonEl.textContent = data.comparison;

        // Add animation
        card.classList.add('fade-in');
    }

    updateUpcomingGames(games) {
        const gamesContainer = document.querySelector('.games-grid');
        if (!gamesContainer) return;

        gamesContainer.innerHTML = '';
        
        games.slice(0, 3).forEach(game => {
            const gameCard = this.createGameCard(game);
            gamesContainer.appendChild(gameCard);
        });

        gamesContainer.classList.add('stagger-animation');
    }

    createGameCard(game) {
        const card = document.createElement('div');
        card.className = 'game-card';
        card.innerHTML = `
            <div class="game-teams">
                <div class="team">
                    <div class="team-logo">${game.homeTeam}</div>
                    <div class="team-name">${game.homeTeam}</div>
                </div>
                <span class="vs">vs</span>
                <div class="team">
                    <div class="team-logo">${game.awayTeam}</div>
                    <div class="team-name">${game.awayTeam}</div>
                </div>
            </div>
            <div class="game-info">
                <div class="game-date">${this.formatGameDate(game.date)}</div>
                <div class="game-status">${this.formatGameStatus(game.status)}</div>
            </div>
        `;
        return card;
    }

    updatePlayerCards(players) {
        const playersContainer = document.querySelector('.players-grid');
        if (!playersContainer) return;

        playersContainer.innerHTML = '';
        
        players.slice(0, 4).forEach(player => {
            const playerCard = this.createPlayerCard(player);
            playersContainer.appendChild(playerCard);
        });

        playersContainer.classList.add('stagger-animation');
    }

    createPlayerCard(player) {
        const card = document.createElement('div');
        card.className = 'player-card';
        card.innerHTML = `
            <div class="player-avatar">${player.number}</div>
            <div class="player-name">${player.name}</div>
            <div class="player-position">${player.position}</div>
            <div class="player-stats">
                <div class="player-stat">
                    <div class="player-stat-value">${player.stats.ppg}</div>
                    <div class="player-stat-label">PPG</div>
                </div>
                <div class="player-stat">
                    <div class="player-stat-value">${player.stats.rpg}</div>
                    <div class="player-stat-label">RPG</div>
                </div>
                <div class="player-stat">
                    <div class="player-stat-value">${player.stats.apg}</div>
                    <div class="player-stat-label">APG</div>
                </div>
            </div>
        `;
        return card;
    }

    formatGameDate(dateString) {
        const date = new Date(dateString);
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        if (date.toDateString() === today.toDateString()) {
            return `Today, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else if (date.toDateString() === tomorrow.toDateString()) {
            return `Tomorrow, ${date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}`;
        } else {
            return date.toLocaleDateString('en-US', { 
                weekday: 'short', 
                month: 'short', 
                day: 'numeric',
                hour: 'numeric',
                minute: '2-digit'
            });
        }
    }

    formatGameStatus(status) {
        const statusMap = {
            scheduled: 'Upcoming',
            live: 'Live',
            final: 'Final',
            postponed: 'Postponed'
        };
        return statusMap[status] || status;
    }

    showLoading() {
        // Show skeleton screens
        document.querySelectorAll('.stat-card, .game-card, .player-card').forEach(card => {
            card.classList.add('skeleton');
        });
    }

    hideLoading() {
        // Hide skeleton screens
        document.querySelectorAll('.skeleton').forEach(el => {
            el.classList.remove('skeleton');
        });
    }

    showError(message) {
        console.error(message);
        // Could show a toast notification here
    }

    startAutoRefresh() {
        // Refresh data every 30 seconds
        this.refreshInterval = setInterval(() => {
            this.loadDashboardData();
        }, 30000);
    }

    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
        }
    }

    switchTeam(teamId) {
        this.currentTeam = teamId;
        this.loadDashboardData();
    }
}

// Initialize dashboard when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const dashboard = new DashboardManager();
    dashboard.initialize();

    // Make dashboard available globally
    window.blazeDashboard = dashboard;
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BlazeAPI, DashboardManager };
}