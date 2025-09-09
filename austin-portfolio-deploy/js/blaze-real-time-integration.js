/**
 * Blaze Intelligence Real-Time Data Integration
 * Connects live sports data feeds to the dashboard
 */

class BlazeRealTimeData {
    constructor() {
        this.wsConnection = null;
        this.apiBaseUrl = '/api';
        this.updateInterval = 5000; // 5 seconds
        this.dataCache = new Map();
        this.subscribers = new Map();
        
        this.init();
    }
    
    async init() {
        await this.loadInitialData();
        this.startRealTimeUpdates();
        this.setupWebSocket();
        this.bindEventHandlers();
    }
    
    // Load initial data from JSON files
    async loadInitialData() {
        try {
            const [
                teamIntelligence,
                liveIntelligence,
                dashboardConfig,
                mlbAnalytics,
                nflAnalytics,
                nbaAnalytics
            ] = await Promise.all([
                fetch('/data/team-intelligence.json').then(r => r.json()),
                fetch('/data/live-intelligence.json').then(r => r.json()),
                fetch('/data/dashboard-config.json').then(r => r.json()),
                fetch('/data/analytics/mlb.json').then(r => r.json().catch(() => ({}))),
                fetch('/data/analytics/nfl.json').then(r => r.json().catch(() => ({}))),
                fetch('/data/analytics/nba.json').then(r => r.json().catch(() => ({})))
            ]);
            
            this.dataCache.set('teamIntelligence', teamIntelligence);
            this.dataCache.set('liveIntelligence', liveIntelligence);
            this.dataCache.set('dashboardConfig', dashboardConfig);
            this.dataCache.set('mlbAnalytics', mlbAnalytics);
            this.dataCache.set('nflAnalytics', nflAnalytics);
            this.dataCache.set('nbaAnalytics', nbaAnalytics);
            
            this.updateDashboard();
            
        } catch (error) {
            console.warn('Error loading initial data:', error);
            this.loadMockData();
        }
    }
    
    // Load mock data for demonstration
    loadMockData() {
        const mockData = {
            teamIntelligence: {
                cardinals: {
                    leverageIndex: 2.84,
                    winProbability: 68.3,
                    clutchFactor: 1.42,
                    teamReadiness: 94.2,
                    lastUpdated: new Date().toISOString()
                },
                titans: {
                    leverageIndex: 3.12,
                    winProbability: 71.5,
                    clutchFactor: 1.68,
                    teamReadiness: 91.8,
                    lastUpdated: new Date().toISOString()
                },
                longhorns: {
                    leverageIndex: 2.91,
                    winProbability: 69.7,
                    clutchFactor: 1.51,
                    teamReadiness: 92.5,
                    lastUpdated: new Date().toISOString()
                },
                grizzlies: {
                    leverageIndex: 2.45,
                    winProbability: 65.2,
                    clutchFactor: 1.35,
                    teamReadiness: 93.1,
                    lastUpdated: new Date().toISOString()
                }
            },
            liveStats: {
                liveGames: 24,
                dataProcessed: 15420,
                activeUsers: 1847,
                predictions: 3296
            }
        };
        
        this.dataCache.set('teamIntelligence', mockData.teamIntelligence);
        this.dataCache.set('liveStats', mockData.liveStats);
        this.updateDashboard();
    }
    
    // Setup WebSocket for real-time updates
    setupWebSocket() {
        try {
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/ws`;
            
            this.wsConnection = new WebSocket(wsUrl);
            
            this.wsConnection.onopen = () => {
                console.log('WebSocket connected to Blaze Intelligence');
                this.subscribe(['analytics', 'live-stats', 'team-updates']);
            };
            
            this.wsConnection.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.handleRealTimeUpdate(data);
            };
            
            this.wsConnection.onerror = () => {
                console.warn('WebSocket connection failed, using polling fallback');
                this.fallbackToPolling();
            };
            
            this.wsConnection.onclose = () => {
                console.log('WebSocket disconnected, attempting reconnect...');
                setTimeout(() => this.setupWebSocket(), 5000);
            };
            
        } catch (error) {
            console.warn('WebSocket not available, using polling');
            this.fallbackToPolling();
        }
    }
    
    // Fallback to polling for updates
    fallbackToPolling() {
        setInterval(() => {
            this.fetchLatestData();
        }, this.updateInterval);
    }
    
    // Fetch latest data from API endpoints
    async fetchLatestData() {
        try {
            const endpoints = [
                '/api/analytics/cardinals/current',
                '/api/analytics/live-stats',
                '/api/health'
            ];
            
            const responses = await Promise.allSettled(
                endpoints.map(url => fetch(url).then(r => r.json()))
            );
            
            responses.forEach((result, index) => {
                if (result.status === 'fulfilled') {
                    const endpoint = endpoints[index];
                    if (endpoint.includes('cardinals')) {
                        this.updateTeamData('cardinals', result.value);
                    } else if (endpoint.includes('live-stats')) {
                        this.updateLiveStats(result.value);
                    } else if (endpoint.includes('health')) {
                        this.updateSystemHealth(result.value);
                    }
                }
            });
            
        } catch (error) {
            console.warn('Polling update failed:', error);
            this.simulateDataUpdates();
        }
    }
    
    // Simulate data updates for demo purposes
    simulateDataUpdates() {
        const teams = ['cardinals', 'titans', 'longhorns', 'grizzlies'];
        const currentTeam = teams[Math.floor(Date.now() / 10000) % teams.length];
        
        const teamData = this.dataCache.get('teamIntelligence') || {};
        if (teamData[currentTeam]) {
            // Simulate small variations
            teamData[currentTeam].leverageIndex += (Math.random() - 0.5) * 0.1;
            teamData[currentTeam].winProbability += (Math.random() - 0.5) * 2;
            teamData[currentTeam].clutchFactor += (Math.random() - 0.5) * 0.05;
            teamData[currentTeam].teamReadiness += (Math.random() - 0.5) * 1;
            teamData[currentTeam].lastUpdated = new Date().toISOString();
            
            this.dataCache.set('teamIntelligence', teamData);
        }
        
        // Update live stats
        const liveStats = this.dataCache.get('liveStats') || {};
        liveStats.dataProcessed += Math.floor(Math.random() * 100);
        liveStats.activeUsers += Math.floor(Math.random() * 10) - 5;
        liveStats.predictions += Math.floor(Math.random() * 5);
        
        this.dataCache.set('liveStats', liveStats);
        this.updateDashboard();
    }
    
    // Handle real-time WebSocket updates
    handleRealTimeUpdate(data) {
        switch (data.type) {
            case 'team_update':
                this.updateTeamData(data.team, data.metrics);
                break;
            case 'live_stats':
                this.updateLiveStats(data.stats);
                break;
            case 'system_health':
                this.updateSystemHealth(data.health);
                break;
            case 'game_event':
                this.handleGameEvent(data.event);
                break;
        }
    }
    
    // Update team-specific data
    updateTeamData(team, metrics) {
        const teamData = this.dataCache.get('teamIntelligence') || {};
        teamData[team] = { ...teamData[team], ...metrics, lastUpdated: new Date().toISOString() };
        this.dataCache.set('teamIntelligence', teamData);
        
        this.notifySubscribers('team_update', { team, metrics });
        this.updateDashboard();
    }
    
    // Update live statistics
    updateLiveStats(stats) {
        this.dataCache.set('liveStats', stats);
        this.notifySubscribers('live_stats', stats);
        this.updateLiveTicker(stats);
    }
    
    // Update system health indicators
    updateSystemHealth(health) {
        this.dataCache.set('systemHealth', health);
        this.notifySubscribers('system_health', health);
        this.updateHealthIndicators(health);
    }
    
    // Handle game events
    handleGameEvent(event) {
        this.notifySubscribers('game_event', event);
        this.showGameEventNotification(event);
    }
    
    // Update the main dashboard display
    updateDashboard() {
        const currentLeague = document.querySelector('.control-btn.active')?.dataset.league || 'mlb';
        const teamMap = {
            mlb: 'cardinals',
            nfl: 'titans', 
            ncaa: 'longhorns',
            nba: 'grizzlies'
        };
        
        const team = teamMap[currentLeague];
        const teamData = this.dataCache.get('teamIntelligence')?.[team];
        
        if (teamData) {
            this.updateMetricCards(teamData);
            this.updatePerformanceChart(teamData);
        }
        
        const liveStats = this.dataCache.get('liveStats');
        if (liveStats) {
            this.updateLiveTicker(liveStats);
        }
    }
    
    // Update metric cards with animation
    updateMetricCards(data) {
        const cards = [
            { selector: '.metric-card:nth-child(1) .metric-value', value: data.leverageIndex?.toFixed(2) || '2.84' },
            { selector: '.metric-card:nth-child(2) .metric-value', value: `${data.winProbability?.toFixed(1) || '68.3'}%` },
            { selector: '.metric-card:nth-child(3) .metric-value', value: data.clutchFactor?.toFixed(2) || '1.42' },
            { selector: '.metric-card:nth-child(4) .metric-value', value: `${data.teamReadiness?.toFixed(1) || '94.2'}%` }
        ];
        
        cards.forEach(card => {
            const element = document.querySelector(card.selector);
            if (element && element.textContent !== card.value) {
                this.animateValueChange(element, card.value);
            }
        });
    }
    
    // Update live ticker with animation
    updateLiveTicker(stats) {
        const tickers = [
            { id: 'live-games', value: stats.liveGames || 24 },
            { id: 'data-processed', value: stats.dataProcessed || 15420 },
            { id: 'active-users', value: stats.activeUsers || 1847 },
            { id: 'predictions', value: stats.predictions || 3296 }
        ];
        
        tickers.forEach(ticker => {
            const element = document.getElementById(ticker.id);
            if (element) {
                this.animateValueChange(element, ticker.value.toLocaleString());
            }
        });
    }
    
    // Animate value changes
    animateValueChange(element, newValue) {
        element.style.transform = 'scale(1.1)';
        element.style.color = '#BF5700';
        
        setTimeout(() => {
            element.textContent = newValue;
            element.style.transform = 'scale(1)';
            element.style.color = '';
        }, 150);
    }
    
    // Update performance chart
    updatePerformanceChart(data) {
        if (window.performanceChart && data) {
            const chart = window.performanceChart;
            
            // Add new data point
            chart.data.labels.push(new Date().toLocaleTimeString());
            chart.data.datasets[0].data.push(data.leverageIndex);
            chart.data.datasets[1].data.push(data.winProbability);
            
            // Keep only last 10 points
            if (chart.data.labels.length > 10) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
                chart.data.datasets[1].data.shift();
            }
            
            chart.update('none');
        }
    }
    
    // Show game event notifications
    showGameEventNotification(event) {
        const notification = document.createElement('div');
        notification.className = 'game-event-notification';
        notification.innerHTML = `
            <div class="notification-content">
                <strong>${event.team}</strong>
                <span>${event.description}</span>
                <div class="notification-time">${new Date().toLocaleTimeString()}</div>
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => notification.classList.add('show'), 100);
        
        // Remove after 5 seconds
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 5000);
    }
    
    // Subscribe to real-time updates
    subscribe(channels) {
        if (this.wsConnection && this.wsConnection.readyState === WebSocket.OPEN) {
            this.wsConnection.send(JSON.stringify({
                type: 'subscribe',
                channels: channels
            }));
        }
    }
    
    // Notify subscribers of updates
    notifySubscribers(eventType, data) {
        const subscribers = this.subscribers.get(eventType) || [];
        subscribers.forEach(callback => callback(data));
    }
    
    // Add event listener for updates
    addEventListener(eventType, callback) {
        const subscribers = this.subscribers.get(eventType) || [];
        subscribers.push(callback);
        this.subscribers.set(eventType, subscribers);
    }
    
    // Remove event listener
    removeEventListener(eventType, callback) {
        const subscribers = this.subscribers.get(eventType) || [];
        const index = subscribers.indexOf(callback);
        if (index > -1) {
            subscribers.splice(index, 1);
            this.subscribers.set(eventType, subscribers);
        }
    }
    
    // Bind dashboard control handlers
    bindEventHandlers() {
        // League switcher
        document.querySelectorAll('.control-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.control-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.updateDashboard();
            });
        });
        
        // Auto-refresh toggle
        const refreshToggle = document.getElementById('auto-refresh');
        if (refreshToggle) {
            refreshToggle.addEventListener('change', (e) => {
                if (e.target.checked) {
                    this.startRealTimeUpdates();
                } else {
                    this.stopRealTimeUpdates();
                }
            });
        }
    }
    
    // Start real-time updates
    startRealTimeUpdates() {
        this.updateTimer = setInterval(() => {
            this.fetchLatestData();
            this.simulateDataUpdates();
        }, this.updateInterval);
    }
    
    // Stop real-time updates
    stopRealTimeUpdates() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }
    
    // Get current data for external access
    getCurrentData(key) {
        return this.dataCache.get(key);
    }
    
    // Get team data by league
    getTeamDataByLeague(league) {
        const teamMap = {
            mlb: 'cardinals',
            nfl: 'titans',
            ncaa: 'longhorns', 
            nba: 'grizzlies'
        };
        
        const team = teamMap[league];
        const teamData = this.dataCache.get('teamIntelligence');
        return teamData?.[team];
    }
    
    // Export data for analytics
    exportData() {
        const data = {};
        this.dataCache.forEach((value, key) => {
            data[key] = value;
        });
        return data;
    }
}

// Initialize real-time data system
const blazeRealTime = new BlazeRealTimeData();

// Export for global access
window.blazeRealTime = blazeRealTime;

// CSS for notifications
const notificationStyles = `
.game-event-notification {
    position: fixed;
    top: 100px;
    right: 20px;
    background: rgba(20, 20, 20, 0.95);
    border: 1px solid #BF5700;
    border-radius: 8px;
    padding: 1rem;
    color: #E5E4E2;
    transform: translateX(100%);
    transition: transform 0.3s ease;
    z-index: 10000;
    min-width: 300px;
    backdrop-filter: blur(10px);
}

.game-event-notification.show {
    transform: translateX(0);
}

.notification-content strong {
    color: #BF5700;
    display: block;
    margin-bottom: 0.25rem;
}

.notification-time {
    font-size: 0.75rem;
    opacity: 0.7;
    margin-top: 0.25rem;
}

/* Loading states */
.metric-card.loading {
    opacity: 0.6;
    pointer-events: none;
}

.metric-card.loading::after {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 20px;
    height: 20px;
    margin: -10px 0 0 -10px;
    border: 2px solid rgba(191, 87, 0, 0.2);
    border-top-color: #BF5700;
    border-radius: 50%;
    animation: spin 1s linear infinite;
}

@keyframes spin {
    to { transform: rotate(360deg); }
}
`;

// Inject notification styles
const styleSheet = document.createElement('style');
styleSheet.textContent = notificationStyles;
document.head.appendChild(styleSheet);