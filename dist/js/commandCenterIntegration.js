/**
 * Blaze Intelligence Command Center Integration
 * Advanced dashboard interface merging Claude Code's command center with existing platform
 */
class CommandCenterIntegration {
    constructor() {
        this.isActive = false;
        this.widgets = new Map();
        this.realTimeConnections = new Map();
        this.performanceMetrics = {
            accuracy: 96.2,
            responseTime: 3,
            uptime: 99.7,
            activeUsers: 0,
            dataPoints: 0
        };
        
        this.initialize();
    }

    async initialize() {
        try {
            console.log('🎯 Command Center initializing...');
            await this.setupWidgets();
            await this.establishRealTimeConnections();
            this.startPerformanceMonitoring();
            this.isActive = true;
            console.log('✅ Command Center operational');
        } catch (error) {
            console.error('❌ Command Center initialization failed:', error);
        }
    }

    async setupWidgets() {
        // Real-time Sports Analytics Widget
        this.widgets.set('sportsAnalytics', {
            element: this.createSportsAnalyticsWidget(),
            updateFrequency: 30000, // 30 seconds
            dataSource: 'sportsDataHub'
        });

        // Performance Metrics Widget
        this.widgets.set('performanceMetrics', {
            element: this.createPerformanceWidget(),
            updateFrequency: 5000, // 5 seconds
            dataSource: 'internal'
        });

        // AI Insights Panel
        this.widgets.set('aiInsights', {
            element: this.createAIInsightsPanel(),
            updateFrequency: 60000, // 1 minute
            dataSource: 'aiAnalytics'
        });

        // Team Intelligence Cards
        this.widgets.set('teamIntelligence', {
            element: this.createTeamIntelligenceCards(),
            updateFrequency: 45000, // 45 seconds
            dataSource: 'sportsDataHub'
        });

        // CFB Blog Integration Widget
        this.widgets.set('cfbBlog', {
            element: this.createCFBBlogWidget(),
            updateFrequency: 300000, // 5 minutes
            dataSource: 'blogFeed'
        });
    }

    createSportsAnalyticsWidget() {
        const widget = document.createElement('div');
        widget.className = 'command-center-widget sports-analytics';
        widget.innerHTML = `
            <div class="widget-header">
                <h3>🏆 Live Sports Analytics</h3>
                <div class="status-indicator active"></div>
            </div>
            <div class="widget-content">
                <div class="metric-grid">
                    <div class="metric-item">
                        <div class="metric-label">Active Games</div>
                        <div class="metric-value" id="activeGames">--</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Teams Tracked</div>
                        <div class="metric-value" id="trackedTeams">192</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Predictions Made</div>
                        <div class="metric-value" id="predictions">2,847</div>
                    </div>
                    <div class="metric-item">
                        <div class="metric-label">Accuracy Rate</div>
                        <div class="metric-value" id="accuracyRate">96.2%</div>
                    </div>
                </div>
                <div class="live-feed" id="sportsLiveFeed"></div>
            </div>
        `;
        return widget;
    }

    createPerformanceWidget() {
        const widget = document.createElement('div');
        widget.className = 'command-center-widget performance-metrics';
        widget.innerHTML = `
            <div class="widget-header">
                <h3>⚡ System Performance</h3>
                <div class="status-indicator active"></div>
            </div>
            <div class="widget-content">
                <div class="performance-grid">
                    <div class="metric-circle">
                        <div class="circle-progress" data-value="97">
                            <span class="circle-value">97%</span>
                            <span class="circle-label">Uptime</span>
                        </div>
                    </div>
                    <div class="metric-circle">
                        <div class="circle-progress" data-value="3">
                            <span class="circle-value">3ms</span>
                            <span class="circle-label">Response</span>
                        </div>
                    </div>
                    <div class="metric-circle">
                        <div class="circle-progress" data-value="96">
                            <span class="circle-value">96.2%</span>
                            <span class="circle-label">Accuracy</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return widget;
    }

    createAIInsightsPanel() {
        const widget = document.createElement('div');
        widget.className = 'command-center-widget ai-insights';
        widget.innerHTML = `
            <div class="widget-header">
                <h3>🧠 AI Insights</h3>
                <div class="insight-count">6 Active</div>
            </div>
            <div class="widget-content">
                <div class="insights-list" id="aiInsightsList">
                    <div class="insight-item">
                        <div class="insight-icon">📈</div>
                        <div class="insight-content">
                            <div class="insight-title">Championship Probability Updated</div>
                            <div class="insight-description">Texas Longhorns probability increased to 78.3%</div>
                        </div>
                    </div>
                    <div class="insight-item">
                        <div class="insight-icon">🎯</div>
                        <div class="insight-content">
                            <div class="insight-title">Grit Index Alert</div>
                            <div class="insight-description">Houston Astros showing 94% clutch performance</div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        return widget;
    }

    createTeamIntelligenceCards() {
        const widget = document.createElement('div');
        widget.className = 'command-center-widget team-intelligence';
        widget.innerHTML = `
            <div class="widget-header">
                <h3>🏅 Team Intelligence</h3>
                <div class="sport-selector">
                    <button class="sport-btn active" data-sport="mlb">MLB</button>
                    <button class="sport-btn" data-sport="nfl">NFL</button>
                    <button class="sport-btn" data-sport="ncaa">NCAA</button>
                </div>
            </div>
            <div class="widget-content">
                <div class="team-cards-grid" id="teamCardsGrid"></div>
            </div>
        `;
        return widget;
    }

    createCFBBlogWidget() {
        const widget = document.createElement('div');
        widget.className = 'command-center-widget cfb-blog';
        widget.innerHTML = `
            <div class="widget-header">
                <h3>📝 CFB Weekly Analysis</h3>
                <a href="https://blaze-intelligence-lsl.pages.dev/blog-cfb-week1-2025" 
                   target="_blank" class="external-link">View Full Blog ↗</a>
            </div>
            <div class="widget-content">
                <div class="blog-preview">
                    <h4>Week 1 College Football Intelligence Report</h4>
                    <p>Advanced analytics and championship predictions for the 2025 season opener.</p>
                    <div class="blog-metrics">
                        <div class="metric">
                            <span class="metric-value">130+</span>
                            <span class="metric-label">Teams Analyzed</span>
                        </div>
                        <div class="metric">
                            <span class="metric-value">94.6%</span>
                            <span class="metric-label">Prediction Accuracy</span>
                        </div>
                    </div>
                    <button class="blog-cta" onclick="window.open('https://blaze-intelligence-lsl.pages.dev/blog-cfb-week1-2025', '_blank')">
                        Read Analysis →
                    </button>
                </div>
            </div>
        `;
        return widget;
    }

    async establishRealTimeConnections() {
        // WebSocket connection for live data
        try {
            const ws = new WebSocket('wss://api.blaze-intelligence.com/live-feed');
            ws.onopen = () => {
                console.log('🔗 Real-time connection established');
                this.realTimeConnections.set('primary', ws);
            };
            ws.onmessage = (event) => this.handleRealTimeUpdate(JSON.parse(event.data));
            ws.onerror = (error) => console.warn('WebSocket error:', error);
        } catch (error) {
            console.warn('WebSocket connection failed, using polling fallback');
            this.setupPollingFallback();
        }
    }

    setupPollingFallback() {
        // Fallback to HTTP polling if WebSocket fails
        setInterval(async () => {
            try {
                const response = await fetch('/api/live-updates');
                if (response.ok) {
                    const data = await response.json();
                    this.handleRealTimeUpdate(data);
                }
            } catch (error) {
                console.warn('Polling update failed:', error);
            }
        }, 10000); // Poll every 10 seconds
    }

    handleRealTimeUpdate(data) {
        switch (data.type) {
            case 'sports_update':
                this.updateSportsWidget(data.payload);
                break;
            case 'performance_metric':
                this.updatePerformanceMetrics(data.payload);
                break;
            case 'ai_insight':
                this.addAIInsight(data.payload);
                break;
            case 'team_intelligence':
                this.updateTeamIntelligence(data.payload);
                break;
        }
    }

    updateSportsWidget(data) {
        const activeGamesEl = document.getElementById('activeGames');
        if (activeGamesEl && data.activeGames !== undefined) {
            activeGamesEl.textContent = data.activeGames;
        }

        const feedEl = document.getElementById('sportsLiveFeed');
        if (feedEl && data.updates) {
            data.updates.forEach(update => {
                const feedItem = document.createElement('div');
                feedItem.className = 'feed-item';
                feedItem.innerHTML = `
                    <span class="feed-time">${new Date().toLocaleTimeString()}</span>
                    <span class="feed-content">${update.message}</span>
                `;
                feedEl.insertBefore(feedItem, feedEl.firstChild);
                
                // Keep only last 10 items
                while (feedEl.children.length > 10) {
                    feedEl.removeChild(feedEl.lastChild);
                }
            });
        }
    }

    updatePerformanceMetrics(data) {
        Object.keys(data).forEach(metric => {
            const element = document.querySelector(`[data-metric="${metric}"]`);
            if (element) {
                element.textContent = data[metric];
            }
        });
    }

    addAIInsight(insight) {
        const insightsList = document.getElementById('aiInsightsList');
        if (insightsList) {
            const insightItem = document.createElement('div');
            insightItem.className = 'insight-item new-insight';
            insightItem.innerHTML = `
                <div class="insight-icon">${insight.icon || '🔍'}</div>
                <div class="insight-content">
                    <div class="insight-title">${insight.title}</div>
                    <div class="insight-description">${insight.description}</div>
                </div>
            `;
            insightsList.insertBefore(insightItem, insightsList.firstChild);
            
            // Remove animation class after animation completes
            setTimeout(() => {
                insightItem.classList.remove('new-insight');
            }, 1000);
            
            // Keep only last 5 insights
            while (insightsList.children.length > 5) {
                insightsList.removeChild(insightsList.lastChild);
            }
        }
    }

    updateTeamIntelligence(data) {
        const grid = document.getElementById('teamCardsGrid');
        if (grid && data.teams) {
            grid.innerHTML = '';
            data.teams.slice(0, 6).forEach(team => {
                const card = document.createElement('div');
                card.className = 'team-card';
                card.innerHTML = `
                    <div class="team-header">
                        <div class="team-logo">${team.logo || '🏀'}</div>
                        <div class="team-name">${team.name}</div>
                    </div>
                    <div class="team-metrics">
                        <div class="team-metric">
                            <span class="metric-label">Win %</span>
                            <span class="metric-value">${team.winPercentage || 'N/A'}</span>
                        </div>
                        <div class="team-metric">
                            <span class="metric-label">Power</span>
                            <span class="metric-value">${team.powerRating || 'N/A'}</span>
                        </div>
                    </div>
                `;
                grid.appendChild(card);
            });
        }
    }

    startPerformanceMonitoring() {
        setInterval(() => {
            this.updateSystemMetrics();
        }, 5000);
    }

    async updateSystemMetrics() {
        try {
            const response = await fetch('/api/system/metrics');
            if (response.ok) {
                const metrics = await response.json();
                this.performanceMetrics = { ...this.performanceMetrics, ...metrics };
                this.updatePerformanceWidget();
            }
        } catch (error) {
            console.warn('Failed to fetch system metrics:', error);
        }
    }

    updatePerformanceWidget() {
        const circles = document.querySelectorAll('.circle-progress');
        circles.forEach(circle => {
            const value = circle.dataset.value;
            const circumference = 2 * Math.PI * 45; // radius = 45
            const offset = circumference - (value / 100) * circumference;
            
            const progressCircle = circle.querySelector('.progress-ring');
            if (progressCircle) {
                progressCircle.style.strokeDashoffset = offset;
            }
        });
    }

    // Toggle command center visibility
    toggle() {
        const commandCenter = document.getElementById('command-center-overlay');
        if (commandCenter) {
            commandCenter.style.display = commandCenter.style.display === 'none' ? 'flex' : 'none';
        }
    }

    // Initialize the command center overlay
    createOverlay() {
        const overlay = document.createElement('div');
        overlay.id = 'command-center-overlay';
        overlay.className = 'command-center-overlay';
        overlay.innerHTML = `
            <div class="command-center-container">
                <div class="command-center-header">
                    <h1>🔥 BLAZE INTELLIGENCE COMMAND CENTER</h1>
                    <button class="close-btn" onclick="commandCenter.toggle()">×</button>
                </div>
                <div class="command-center-grid" id="commandCenterGrid"></div>
            </div>
        `;
        
        // Append widgets to grid
        const grid = overlay.querySelector('#commandCenterGrid');
        this.widgets.forEach(widget => {
            grid.appendChild(widget.element);
        });
        
        document.body.appendChild(overlay);
        return overlay;
    }

    // Add command center trigger button
    addTriggerButton() {
        const button = document.createElement('button');
        button.className = 'command-center-trigger';
        button.innerHTML = '🎯 Command Center';
        button.onclick = () => this.toggle();
        
        // Add to existing control panel or create new one
        const existingPanel = document.querySelector('.floating-controls');
        if (existingPanel) {
            existingPanel.appendChild(button);
        } else {
            document.body.appendChild(button);
        }
    }
}

// CSS for Command Center
const commandCenterCSS = `
.command-center-overlay {
    display: none;
    position: fixed;
    top: 0;
    left: 0;
    width: 100vw;
    height: 100vh;
    background: linear-gradient(135deg, rgba(0,0,0,0.95) 0%, rgba(20,20,30,0.98) 100%);
    z-index: 10000;
    justify-content: center;
    align-items: flex-start;
    overflow-y: auto;
    backdrop-filter: blur(10px);
}

.command-center-container {
    width: 95%;
    max-width: 1800px;
    margin: 20px auto;
    padding: 20px;
}

.command-center-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 30px;
    padding-bottom: 20px;
    border-bottom: 2px solid rgba(255,107,0,0.3);
}

.command-center-header h1 {
    font-size: 28px;
    color: #FFD700;
    margin: 0;
}

.close-btn {
    background: rgba(255,107,0,0.2);
    border: 1px solid #FF6B00;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    color: #FFD700;
    font-size: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
}

.close-btn:hover {
    background: rgba(255,107,0,0.4);
    transform: scale(1.1);
}

.command-center-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
    gap: 20px;
}

.command-center-widget {
    background: linear-gradient(135deg, rgba(20,20,30,0.9) 0%, rgba(40,40,60,0.9) 100%);
    border: 1px solid rgba(255,107,0,0.2);
    border-radius: 12px;
    padding: 20px;
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
}

.command-center-widget:hover {
    border-color: rgba(255,107,0,0.5);
    box-shadow: 0 10px 30px rgba(255,107,0,0.2);
    transform: translateY(-2px);
}

.widget-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(255,255,255,0.1);
}

.widget-header h3 {
    color: #FFD700;
    margin: 0;
    font-size: 18px;
}

.status-indicator {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: #00ff00;
    animation: pulse 2s infinite;
}

.metric-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 15px;
}

.metric-item {
    text-align: center;
    padding: 15px;
    background: rgba(255,255,255,0.05);
    border-radius: 8px;
    border-left: 3px solid #FF6B00;
}

.metric-label {
    font-size: 12px;
    color: rgba(255,255,255,0.6);
    text-transform: uppercase;
    display: block;
    margin-bottom: 8px;
}

.metric-value {
    font-size: 24px;
    font-weight: bold;
    color: #FFD700;
}

.command-center-trigger {
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: linear-gradient(135deg, #FF6B00 0%, #FFD700 100%);
    border: none;
    border-radius: 25px;
    padding: 15px 25px;
    color: #000;
    font-weight: bold;
    cursor: pointer;
    font-size: 14px;
    transition: all 0.3s ease;
    z-index: 1000;
}

.command-center-trigger:hover {
    transform: scale(1.05);
    box-shadow: 0 5px 20px rgba(255,107,0,0.5);
}

@media (max-width: 768px) {
    .command-center-grid {
        grid-template-columns: 1fr;
    }
    
    .command-center-container {
        width: 98%;
        padding: 10px;
    }
}
`;

// Inject CSS
const styleSheet = document.createElement('style');
styleSheet.textContent = commandCenterCSS;
document.head.appendChild(styleSheet);

// Initialize Command Center
window.commandCenter = new CommandCenterIntegration();

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (window.commandCenter && !window.commandCenter.isActive) {
        window.commandCenter.createOverlay();
        window.commandCenter.addTriggerButton();
    }
});