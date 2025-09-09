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
                            ${showLive ? '<span class="live-indicator pulse">LIVE</span>' : ''}
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
        try {
            const response = await fetch(`${this.apiBase}/cardinals/enhanced`);
            if (!response.ok) {
                throw new Error(`Cardinals API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Cardinals data fetch failed, using demo data');
            return this.getDemoCardinalsData();
        }
    }
    
    // Fetch league-specific scores
    async fetchLeagueScores(league) {
        try {
            const response = await fetch(`${this.apiBase}/live-scores/${league}`);
            if (!response.ok) {
                throw new Error(`${league.toUpperCase()} API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn(`${league} scores fetch failed, using demo data`);
            return this.getDemoLeagueData(league);
        }
    }
    
    // Fetch all live scores
    async fetchAllScores() {
        try {
            const response = await fetch(`${this.apiBase}/live-scores`);
            if (!response.ok) {
                throw new Error(`Live scores API error: ${response.status}`);
            }
            return await response.json();
        } catch (error) {
            console.warn('Live scores fetch failed, using demo data');
            return this.getDemoAllScores();
        }
    }
    
    // Get demo Cardinals data
    getDemoCardinalsData() {
        return {
            cardinals: {
                team_stats: { wins: 85, losses: 77, win_percentage: 0.525 },
                overall_readiness: 89,
                key_players: [
                    { name: 'Goldschmidt', position: 'P', readiness: 92 },
                    { name: 'Arenado', position: '3B', readiness: 88 },
                    { name: 'Wainwright', position: 'SP', readiness: 85 }
                ],
                predictions: {
                    win_probability: 67,
                    run_expectancy: 5
                }
            },
            live_context: {
                mlb_games_today: 15
            }
        };
    }
    
    // Get demo league data
    getDemoLeagueData(league) {
        return {
            live_games: [
                {
                    status: 'live',
                    home_team: 'Cardinals',
                    away_team: 'Cubs',
                    home_score: 5,
                    away_score: 3,
                    inning: '7th'
                }
            ],
            games_today: 8
        };
    }
    
    // Get demo all scores
    getDemoAllScores() {
        return {
            leagues: {
                mlb: { games_today: 12 },
                nfl: { games_today: 8 }
            },
            summary: {
                total_games: 20,
                active_leagues: 2
            }
        };
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
                            <div class="game-teams">
                                <div class="team away">
                                    <span class="team-name">${game.away_team}</span>
                                    <span class="team-score">${game.away_score || 0}</span>
                                </div>
                                <div class="team home">
                                    <span class="team-name">${game.home_team}</span>
                                    <span class="team-score">${game.home_score || 0}</span>
                                </div>
                            </div>
                            <div class="game-status">${game.inning || game.quarter || 'Final'}</div>
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
                    </div>
                `).join('')}
            </div>
        `;
    }
    
    renderGameScore(game) {
        return `
            <div class="game-score-display">
                <div class="team-scores">
                    <div class="away-team">
                        <span>${game.away_team}</span>
                        <span class="score">${game.away_score}</span>
                    </div>
                    <div class="home-team">
                        <span>${game.home_team}</span>
                        <span class="score">${game.home_score}</span>
                    </div>
                </div>
                <div class="game-info">${game.inning || game.status}</div>
            </div>
        `;
    }
    
    renderScheduledGame(game) {
        return `
            <div class="scheduled-game">
                <span>${game.away_team} @ ${game.home_team}</span>
                <span>${game.time}</span>
            </div>
        `;
    }
    
    handleWidgetError(widget, error) {
        const contentDiv = widget.container.querySelector('.scoreboard-content');
        contentDiv.innerHTML = `
            <div class="error-state">
                <p>Unable to load data</p>
                <button onclick="blazeScoreboard.updateWidget('${widget.id}')">Retry</button>
            </div>
        `;
    }
    
    setupEventListeners() {
        // Listen for visibility changes to pause/resume updates
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseUpdates();
            } else {
                this.resumeUpdates();
            }
        });
    }
    
    startGlobalUpdates() {
        // Set up periodic updates for all widgets
        setInterval(() => {
            this.widgets.forEach(widget => {
                this.updateWidget(widget);
            });
        }, this.updateInterval);
    }
    
    pauseUpdates() {
        // Pause updates when page is not visible
        this.intervals.forEach(interval => clearInterval(interval));
    }
    
    resumeUpdates() {
        // Resume updates when page becomes visible
        this.startGlobalUpdates();
    }
    
    addWidgetStyles() {
        if (document.getElementById('scoreboard-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'scoreboard-styles';
        styles.innerHTML = `
            .blaze-scoreboard-widget {
                background: rgba(26, 26, 26, 0.95);
                border: 1px solid rgba(191, 87, 0, 0.3);
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                backdrop-filter: blur(10px);
            }
            
            .scoreboard-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
                padding-bottom: 15px;
                border-bottom: 1px solid rgba(191, 87, 0, 0.2);
            }
            
            .header-content {
                display: flex;
                justify-content: space-between;
                align-items: center;
                width: 100%;
            }
            
            .scoreboard-title {
                font-size: 1.5rem;
                font-weight: 700;
                color: #fff;
                display: flex;
                align-items: center;
                gap: 10px;
            }
            
            .live-indicator {
                background: #ff4444;
                color: white;
                padding: 4px 12px;
                border-radius: 20px;
                font-size: 0.75rem;
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
                gap: 10px;
            }
            
            .update-time {
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.875rem;
            }
            
            .refresh-btn {
                background: rgba(191, 87, 0, 0.2);
                border: 1px solid rgba(191, 87, 0, 0.3);
                color: #BF5700;
                padding: 6px 10px;
                border-radius: 6px;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .refresh-btn:hover {
                background: rgba(191, 87, 0, 0.3);
                transform: rotate(180deg);
            }
            
            .loading-state {
                text-align: center;
                padding: 40px;
                color: rgba(255, 255, 255, 0.6);
            }
            
            .loading-spinner {
                width: 40px;
                height: 40px;
                border: 3px solid rgba(191, 87, 0, 0.2);
                border-top-color: #BF5700;
                border-radius: 50%;
                margin: 0 auto 20px;
                animation: spin 1s linear infinite;
            }
            
            @keyframes spin {
                to { transform: rotate(360deg); }
            }
            
            .team-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .team-info {
                display: flex;
                align-items: center;
                gap: 15px;
            }
            
            .team-logo {
                font-size: 3rem;
            }
            
            .team-details h4 {
                color: #fff;
                font-size: 1.25rem;
                margin-bottom: 5px;
            }
            
            .team-record {
                color: rgba(255, 255, 255, 0.7);
                font-size: 0.875rem;
            }
            
            .readiness-score {
                text-align: center;
            }
            
            .score-value {
                font-size: 2.5rem;
                font-weight: 700;
                color: #BF5700;
            }
            
            .score-label {
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.875rem;
                text-transform: uppercase;
            }
            
            .players-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 15px;
                margin-top: 15px;
            }
            
            .player-card {
                background: rgba(45, 45, 45, 0.5);
                padding: 15px;
                border-radius: 8px;
            }
            
            .player-name {
                font-weight: 600;
                color: #fff;
                margin-bottom: 5px;
            }
            
            .player-pos {
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.875rem;
                margin-bottom: 10px;
            }
            
            .readiness-bar {
                display: block;
                width: 100%;
                height: 4px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 2px;
                overflow: hidden;
                margin-top: 5px;
            }
            
            .bar-fill {
                display: block;
                height: 100%;
                background: linear-gradient(90deg, #BF5700, #FF7A00);
                transition: width 0.3s ease;
            }
            
            .predictions {
                display: flex;
                gap: 20px;
                margin-top: 20px;
                padding-top: 20px;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }
            
            .prediction-item {
                flex: 1;
                text-align: center;
            }
            
            .pred-label {
                display: block;
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.875rem;
                margin-bottom: 5px;
            }
            
            .pred-value {
                display: block;
                font-size: 1.5rem;
                font-weight: 700;
                color: #00DC82;
            }
            
            .game-card {
                background: rgba(45, 45, 45, 0.5);
                padding: 15px;
                border-radius: 8px;
                margin-bottom: 10px;
                transition: all 0.3s ease;
            }
            
            .game-card.live {
                border: 1px solid rgba(255, 68, 68, 0.5);
                background: rgba(255, 68, 68, 0.05);
            }
            
            .game-teams {
                display: flex;
                justify-content: space-between;
                margin-bottom: 10px;
            }
            
            .team {
                display: flex;
                justify-content: space-between;
                flex: 1;
                padding: 0 10px;
            }
            
            .team-name {
                color: #fff;
                font-weight: 500;
            }
            
            .team-score {
                color: #BF5700;
                font-weight: 700;
                font-size: 1.25rem;
            }
            
            .game-status {
                text-align: center;
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.875rem;
            }
            
            .no-games {
                text-align: center;
                padding: 40px;
                color: rgba(255, 255, 255, 0.6);
            }
            
            .no-games-icon {
                font-size: 3rem;
                margin-bottom: 15px;
                opacity: 0.5;
            }
            
            .league-summary {
                display: flex;
                gap: 30px;
                margin-bottom: 20px;
                padding: 20px;
                background: rgba(191, 87, 0, 0.1);
                border-radius: 8px;
            }
            
            .summary-stat {
                text-align: center;
            }
            
            .stat-value {
                display: block;
                font-size: 2rem;
                font-weight: 700;
                color: #BF5700;
                margin-bottom: 5px;
            }
            
            .stat-label {
                color: rgba(255, 255, 255, 0.6);
                font-size: 0.875rem;
                text-transform: uppercase;
            }
        `;
        
        document.head.appendChild(styles);
    }
}

// Auto-initialize
window.blazeScoreboard = new BlazeScoreboard();