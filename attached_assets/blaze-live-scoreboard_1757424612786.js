/**
 * Blaze Intelligence Live Scoreboard Widgets
 * Real-time sports scores integration with enhanced data sources
 */

class BlazeScoreboard {
    constructor(options = {}) {
        this.apiBase = options.apiBase || '/api';
        this.updateInterval = options.updateInterval || 30000; // 30 seconds
        this.retryDelay = options.retryDelay || 5000; // 5 seconds
        this.maxRetries = options.maxRetries || 3;
        
        this.widgets = new Map();
        this.intervals = new Map();
        this.retryCount = 0;
        
        this.init();
    }
    
    init() {
        console.log('🏆 Blaze Intelligence Live Scoreboard initialized');
        this.setupEventListeners();
        this.startGlobalUpdates();
    }
    
    // Create a live scoreboard widget
    createWidget(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) {
            console.error(`Container ${containerId} not found`);
            return null;
        }
        
        const widget = {
            id: containerId,
            container,
            type: options.type || 'multi-league',
            league: options.league || null,
            team: options.team || null,
            showDetails: options.showDetails !== false,
            showLive: options.showLive !== false,
            maxGames: options.maxGames || 5,
            lastUpdate: null,
            data: null
        };
        
        this.widgets.set(containerId, widget);
        this.renderWidget(widget);
        this.updateWidget(widget);
        
        return widget;
    }
    
    // Render widget HTML structure
    renderWidget(widget) {
        const { container, type, showLive } = widget;
        
        container.innerHTML = `
            <div class="blaze-scoreboard-widget" data-type="${type}">
                <div class="scoreboard-header">
                    <div class="header-content">
                        <h3 class="scoreboard-title">
                            ${this.getWidgetTitle(widget)}
                            ${showLive ? '<span class="live-indicator">LIVE</span>' : ''}
                        </h3>
                        <div class="last-updated" data-timestamp="">
                            <span class="update-time">Loading...</span>
                            <button class="refresh-btn" onclick="blazeScoreboard.updateWidget('${widget.id}')">
                                <span class="refresh-icon">↻</span>
                            </button>
                        </div>
                    </div>
                </div>
                <div class="scoreboard-content">
                    <div class="loading-state">
                        <div class="loading-spinner"></div>
                        <p>Loading live scores...</p>
                    </div>
                </div>
            </div>
        `;
        
        this.addWidgetStyles();
    }
    
    // Get appropriate title for widget
    getWidgetTitle(widget) {
        switch (widget.type) {
            case 'cardinals':
                return '🔴 Cardinals Live';
            case 'mlb':
                return '⚾ MLB Scores';
            case 'nfl':
                return '🏈 NFL Scores';
            case 'multi-league':
                return '🏆 Live Sports';
            default:
                return '📊 Sports Dashboard';
        }
    }
    
    // Update specific widget
    async updateWidget(widgetId) {
        const widget = typeof widgetId === 'string' ? this.widgets.get(widgetId) : widgetId;
        if (!widget) return;
        
        try {
            let data;
            
            switch (widget.type) {
                case 'cardinals':
                    data = await this.fetchCardinalsData();
                    break;
                case 'mlb':
                case 'nfl':
                    data = await this.fetchLeagueScores(widget.league || widget.type);
                    break;
                case 'multi-league':
                default:
                    data = await this.fetchAllScores();
                    break;
            }
            
            widget.data = data;
            widget.lastUpdate = new Date().toISOString();
            this.renderWidgetContent(widget);
            this.retryCount = 0; // Reset retry count on success
            
        } catch (error) {
            console.error(`Widget ${widget.id} update failed:`, error);
            this.handleWidgetError(widget, error);
        }
    }
    
    // Fetch Cardinals specific data
    async fetchCardinalsData() {
        const response = await fetch(`${this.apiBase}/cardinals/enhanced`);
        if (!response.ok) {
            throw new Error(`Cardinals API error: ${response.status}`);
        }
        return await response.json();
    }
    
    // Fetch league-specific scores
    async fetchLeagueScores(league) {
        const response = await fetch(`${this.apiBase}/live-scores/${league}`);
        if (!response.ok) {
            throw new Error(`${league.toUpperCase()} API error: ${response.status}`);
        }
        return await response.json();
    }
    
    // Fetch all live scores
    async fetchAllScores() {
        const response = await fetch(`${this.apiBase}/live-scores`);
        if (!response.ok) {
            throw new Error(`Live scores API error: ${response.status}`);
        }
        return await response.json();
    }
    
    // Render widget content based on data
    renderWidgetContent(widget) {
        const contentDiv = widget.container.querySelector('.scoreboard-content');
        const updateTimeSpan = widget.container.querySelector('.update-time');
        const timestampDiv = widget.container.querySelector('.last-updated');
        
        // Update timestamp
        const updateTime = new Date(widget.lastUpdate).toLocaleTimeString();
        updateTimeSpan.textContent = `Updated: ${updateTime}`;
        timestampDiv.setAttribute('data-timestamp', widget.lastUpdate);
        
        // Render content based on widget type
        switch (widget.type) {
            case 'cardinals':
                contentDiv.innerHTML = this.renderCardinalsContent(widget.data);
                break;
            case 'mlb':
            case 'nfl':
                contentDiv.innerHTML = this.renderLeagueContent(widget.data, widget.type);
                break;
            case 'multi-league':
            default:
                contentDiv.innerHTML = this.renderMultiLeagueContent(widget.data);
                break;
        }
    }
    
    // Render Cardinals-specific content
    renderCardinalsContent(data) {
        const cardinals = data.cardinals;
        const liveContext = data.live_context;
        
        return `
            <div class="cardinals-widget">
                <div class="team-header">
                    <div class="team-info">
                        <div class="team-logo">🔴</div>
                        <div class="team-details">
                            <h4>St. Louis Cardinals</h4>
                            <p class="team-record">${cardinals.team_stats?.wins || 85}-${cardinals.team_stats?.losses || 77} 
                               (.${Math.round((cardinals.team_stats?.win_percentage || 0.525) * 1000)})</p>
                        </div>
                    </div>
                    <div class="readiness-score">
                        <div class="score-value">${cardinals.overall_readiness || 89}</div>
                        <div class="score-label">Readiness</div>
                    </div>
                </div>
                
                ${cardinals.live_score ? `
                    <div class="live-game">
                        <div class="game-status">LIVE</div>
                        <div class="score-display">
                            ${this.renderGameScore(cardinals.live_score)}
                        </div>
                    </div>
                ` : cardinals.schedule_data ? `
                    <div class="next-game">
                        <div class="game-label">Today's Game</div>
                        <div class="game-info">
                            ${this.renderScheduledGame(cardinals.schedule_data)}
                        </div>
                    </div>
                ` : `
                    <div class="no-game">
                        <p>No game scheduled today</p>
                        <p class="context">MLB Games Today: ${liveContext?.mlb_games_today || 0}</p>
                    </div>
                `}
                
                <div class="key-players">
                    <h5>Key Players</h5>
                    <div class="players-grid">
                        ${cardinals.key_players?.slice(0, 3).map(player => `
                            <div class="player-card">
                                <div class="player-name">${player.name}</div>
                                <div class="player-pos">${player.position}</div>
                                <div class="player-readiness">
                                    <span class="readiness-value">${player.readiness}</span>
                                    <span class="readiness-bar">
                                        <span class="bar-fill" style="width: ${player.readiness}%"></span>
                                    </span>
                                </div>
                            </div>
                        `).join('') || '<p>Player data unavailable</p>'}
                    </div>
                </div>
                
                <div class="predictions">
                    <div class="prediction-item">
                        <span class="pred-label">Win Probability</span>
                        <span class="pred-value">${Math.round(cardinals.predictions?.win_probability || 67)}%</span>
                    </div>
                    <div class="prediction-item">
                        <span class="pred-label">Run Expectancy</span>
                        <span class="pred-value">${cardinals.predictions?.run_expectancy || 5}</span>
                    </div>
                </div>
            </div>
        `;
    }
    
    // Render league-specific content
    renderLeagueContent(data, league) {
        const games = data.live_games || [];
        const leagueName = league.toUpperCase();
        
        if (games.length === 0) {
            return `
                <div class="no-games">
                    <div class="no-games-icon">${league === 'mlb' ? '⚾' : '🏈'}</div>
                    <h4>No ${leagueName} Games</h4>
                    <p>${data.error || 'No games scheduled or in progress'}</p>
                    <div class="games-count">Games Today: ${data.games_today || 0}</div>
                </div>
            `;
        }
        
        return `
            <div class="league-scores">
                <div class="league-header">
                    <h4>${leagueName} Live Scores</h4>
                    <span class="games-count">${data.games_today || games.length} games today</span>
                </div>
                <div class="games-list">
                    ${games.slice(0, 5).map(game => `
                        <div class="game-card ${game.status === 'live' ? 'live' : ''}">
                            ${this.renderGameScore(game)}
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Render multi-league content
    renderMultiLeagueContent(data) {
        const leagues = data.leagues || {};
        const summary = data.summary || {};
        
        return `
            <div class="multi-league-widget">
                <div class="league-summary">
                    <div class="summary-stat">
                        <span class="stat-value">${summary.total_games || 0}</span>
                        <span class="stat-label">Games Today</span>
                    </div>
                    <div class="summary-stat">
                        <span class="stat-value">${summary.active_leagues || 0}</span>
                        <span class="stat-label">Active Leagues</span>
                    </div>
                </div>
                
                ${Object.entries(leagues).map(([leagueName, leagueData]) => `
                    <div class="league-section">
                        <div class="league-title">
                            <span class="league-icon">${leagueName === 'mlb' ? '⚾' : '🏈'}</span>
                            <span class="league-name">${leagueName.toUpperCase()}</span>
                            <span class="league-count">${leagueData.games_today || 0} games</span>
                        </div>
                        
                        ${leagueData.live_games && leagueData.live_games.length > 0 ? `
                            <div class="mini-games-list">
                                ${leagueData.live_games.slice(0, 2).map(game => `
                                    <div class="mini-game-card">
                                        ${this.renderMiniGameScore(game)}
                                    </div>
                                `).join('')}
                            </div>
                        ` : `
                            <div class="no-live-games">
                                <span class="status-text">${leagueData.error || 'No live games'}</span>
                            </div>
                        `}
                    </div>
                `).join('')}
                
                <div class="data-freshness">
                    <span class="freshness-indicator ${summary.data_freshness === 'live' ? 'live' : 'stale'}">
                        ${summary.data_freshness === 'live' ? '🔴 LIVE' : '⚪ CACHED'}
                    </span>
                </div>
            </div>
        `;
    }
    
    // Render individual game score
    renderGameScore(game) {
        if (!game) return '<p>Game data unavailable</p>';
        
        return `
            <div class="game-score">
                <div class="team away-team">
                    <span class="team-name">${game.away_team || 'Away'}</span>
                    <span class="team-score">${game.away_score || 0}</span>
                </div>
                <div class="game-details">
                    <div class="game-status">${game.status || 'Scheduled'}</div>
                    <div class="game-time">${this.formatGameTime(game)}</div>
                </div>
                <div class="team home-team">
                    <span class="team-name">${game.home_team || 'Home'}</span>
                    <span class="team-score">${game.home_score || 0}</span>
                </div>
            </div>
        `;
    }
    
    // Render mini game score for multi-league view
    renderMiniGameScore(game) {
        return `
            <div class="mini-score">
                <span class="mini-teams">${game.away_team || 'Away'} vs ${game.home_team || 'Home'}</span>
                <span class="mini-scores">${game.away_score || 0}-${game.home_score || 0}</span>
                <span class="mini-status">${game.status || 'Scheduled'}</span>
            </div>
        `;
    }
    
    // Render scheduled game
    renderScheduledGame(game) {
        return `
            <div class="scheduled-game">
                <div class="matchup">${game.away?.alias || 'Away'} @ ${game.home?.alias || 'Home'}</div>
                <div class="game-time">${this.formatGameTime(game)}</div>
            </div>
        `;
    }
    
    // Format game time display
    formatGameTime(game) {
        if (game.status === 'live' || game.status === 'in_progress') {
            return game.inning ? `${game.inning} inning` : 'Live';
        }
        if (game.scheduled) {
            const gameTime = new Date(game.scheduled);
            return gameTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        }
        return game.time || '';
    }
    
    // Handle widget errors
    handleWidgetError(widget, error) {
        const contentDiv = widget.container.querySelector('.scoreboard-content');
        
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            contentDiv.innerHTML = `
                <div class="error-state retry">
                    <div class="error-icon">⚠️</div>
                    <h4>Connection Issue</h4>
                    <p>Retrying... (${this.retryCount}/${this.maxRetries})</p>
                    <div class="retry-spinner"></div>
                </div>
            `;
            
            // Retry after delay
            setTimeout(() => this.updateWidget(widget), this.retryDelay);
        } else {
            contentDiv.innerHTML = `
                <div class="error-state failed">
                    <div class="error-icon">❌</div>
                    <h4>Data Unavailable</h4>
                    <p>Unable to load live scores</p>
                    <p class="error-details">${error.message}</p>
                    <button class="retry-btn" onclick="blazeScoreboard.retryWidget('${widget.id}')">
                        Try Again
                    </button>
                </div>
            `;
        }
    }
    
    // Retry widget after failure
    retryWidget(widgetId) {
        this.retryCount = 0;
        this.updateWidget(widgetId);
    }
    
    // Start global updates for all widgets
    startGlobalUpdates() {
        const updateInterval = setInterval(() => {
            this.widgets.forEach(widget => {
                this.updateWidget(widget);
            });
        }, this.updateInterval);
        
        this.intervals.set('global', updateInterval);
    }
    
    // Setup event listeners
    setupEventListeners() {
        // Page visibility change - pause/resume updates
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });
        
        // Network status changes
        window.addEventListener('online', () => {
            console.log('Network back online - resuming updates');
            this.resumeUpdates();
        });
        
        window.addEventListener('offline', () => {
            console.log('Network offline - pausing updates');
            this.pauseUpdates();
        });
    }
    
    // Pause all updates
    pauseUpdates() {
        this.intervals.forEach(interval => clearInterval(interval));
        this.intervals.clear();
    }
    
    // Resume all updates
    resumeUpdates() {
        this.startGlobalUpdates();
        // Force immediate update
        this.widgets.forEach(widget => this.updateWidget(widget));
    }
    
    // Add widget styles
    addWidgetStyles() {
        if (document.getElementById('blaze-scoreboard-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'blaze-scoreboard-styles';
        styles.textContent = `
            .blaze-scoreboard-widget {
                background: rgba(54, 69, 79, 0.1);
                border: 1px solid rgba(191, 87, 0, 0.3);
                border-radius: 12px;
                padding: 1.5rem;
                font-family: 'Inter', sans-serif;
                color: #E5E4E2;
                min-height: 200px;
                position: relative;
            }
            
            .scoreboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid rgba(191, 87, 0, 0.2);
            }
            
            .scoreboard-title {
                font-size: 1.125rem;
                font-weight: 700;
                margin: 0;
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .live-indicator {
                background: #ff4444;
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.625rem;
                font-weight: 600;
                animation: pulse 2s infinite;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.7; }
            }
            
            .last-updated {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                font-size: 0.75rem;
                opacity: 0.7;
            }
            
            .refresh-btn {
                background: none;
                border: 1px solid rgba(191, 87, 0, 0.3);
                color: #BF5700;
                padding: 4px 6px;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.2s ease;
            }
            
            .refresh-btn:hover {
                background: rgba(191, 87, 0, 0.1);
                transform: rotate(180deg);
            }
            
            .loading-state, .error-state {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 2rem;
                text-align: center;
                min-height: 150px;
            }
            
            .loading-spinner, .retry-spinner {
                width: 24px;
                height: 24px;
                border: 2px solid rgba(191, 87, 0, 0.3);
                border-top-color: #BF5700;
                border-radius: 50%;
                animation: spin 1s linear infinite;
                margin-bottom: 1rem;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .cardinals-widget .team-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }
            
            .team-info {
                display: flex;
                align-items: center;
                gap: 1rem;
            }
            
            .team-logo {
                font-size: 2rem;
            }
            
            .team-details h4 {
                margin: 0;
                font-size: 1.25rem;
                font-weight: 700;
            }
            
            .team-record {
                margin: 0;
                opacity: 0.8;
                font-size: 0.875rem;
            }
            
            .readiness-score {
                text-align: center;
                background: rgba(191, 87, 0, 0.1);
                padding: 0.75rem;
                border-radius: 8px;
                border: 1px solid rgba(191, 87, 0, 0.3);
            }
            
            .score-value {
                display: block;
                font-size: 2rem;
                font-weight: 900;
                color: #BF5700;
                line-height: 1;
            }
            
            .score-label {
                font-size: 0.75rem;
                opacity: 0.8;
                text-transform: uppercase;
            }
            
            .live-game, .next-game, .no-game {
                background: rgba(0, 178, 169, 0.1);
                border: 1px solid rgba(0, 178, 169, 0.3);
                border-radius: 8px;
                padding: 1rem;
                margin: 1rem 0;
            }
            
            .game-score {
                display: grid;
                grid-template-columns: 1fr auto 1fr;
                align-items: center;
                gap: 1rem;
            }
            
            .team {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .away-team {
                justify-content: flex-end;
            }
            
            .home-team {
                justify-content: flex-start;
            }
            
            .team-score {
                font-size: 1.5rem;
                font-weight: 700;
                color: #00B2A9;
            }
            
            .game-details {
                text-align: center;
                padding: 0 1rem;
            }
            
            .game-status {
                font-weight: 600;
                color: #BF5700;
            }
            
            .players-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 0.75rem;
                margin-top: 0.75rem;
            }
            
            .player-card {
                background: rgba(155, 203, 235, 0.1);
                border: 1px solid rgba(155, 203, 235, 0.3);
                border-radius: 6px;
                padding: 0.75rem;
            }
            
            .player-name {
                font-weight: 600;
                font-size: 0.875rem;
                margin-bottom: 0.25rem;
            }
            
            .player-pos {
                font-size: 0.75rem;
                opacity: 0.7;
                margin-bottom: 0.5rem;
            }
            
            .player-readiness {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .readiness-value {
                font-size: 0.875rem;
                font-weight: 700;
                color: #9BCBEB;
            }
            
            .readiness-bar {
                flex: 1;
                height: 4px;
                background: rgba(155, 203, 235, 0.2);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .bar-fill {
                height: 100%;
                background: #9BCBEB;
                transition: width 0.3s ease;
            }
            
            .predictions {
                display: flex;
                gap: 1rem;
                margin-top: 1rem;
            }
            
            .prediction-item {
                flex: 1;
                display: flex;
                justify-content: space-between;
                padding: 0.5rem;
                background: rgba(0, 34, 68, 0.1);
                border-radius: 6px;
                font-size: 0.875rem;
            }
            
            .pred-value {
                font-weight: 700;
                color: #00B2A9;
            }
            
            .retry-btn {
                background: rgba(191, 87, 0, 0.1);
                border: 1px solid rgba(191, 87, 0, 0.3);
                color: #BF5700;
                padding: 0.5rem 1rem;
                border-radius: 4px;
                cursor: pointer;
                margin-top: 1rem;
            }
            
            .retry-btn:hover {
                background: rgba(191, 87, 0, 0.2);
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .blaze-scoreboard-widget {
                    padding: 1rem;
                }
                
                .players-grid {
                    grid-template-columns: 1fr;
                }
                
                .predictions {
                    flex-direction: column;
                    gap: 0.5rem;
                }
                
                .team-header {
                    flex-direction: column;
                    gap: 1rem;
                    text-align: center;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }
    
    // Destroy widget and cleanup
    destroyWidget(widgetId) {
        const widget = this.widgets.get(widgetId);
        if (widget) {
            widget.container.innerHTML = '';
            this.widgets.delete(widgetId);
        }
    }
    
    // Cleanup all widgets and intervals
    destroy() {
        this.pauseUpdates();
        this.widgets.clear();
        
        const styles = document.getElementById('blaze-scoreboard-styles');
        if (styles) styles.remove();
    }
}

// Global instance
window.blazeScoreboard = new BlazeScoreboard();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeScoreboard;
}

console.log('🏆 Blaze Intelligence Live Scoreboard ready!');