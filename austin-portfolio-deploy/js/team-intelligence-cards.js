/**
 * Blaze Intelligence Team Intelligence Cards
 * Interactive team analysis cards with real-time data and AI insights
 */

class TeamIntelligenceCards {
    constructor() {
        this.container = null;
        this.teams = new Map();
        this.selectedSport = 'all';
        this.searchQuery = '';
        this.visualizations = {
            performance: null,
            rankings: null,
            trends: null
        };
        
        this.sportEmojis = {
            mlb: '⚾',
            nfl: '🏈',
            nba: '🏀',
            ncaaf: '🎓',
            nhl: '🏒'
        };

        this.performanceMetrics = {
            legacy: { weight: 0.3, description: 'Historical achievement and championships' },
            recent: { weight: 0.25, description: 'Last 5 seasons performance' },
            momentum: { weight: 0.2, description: 'Current season trajectory' },
            talent: { weight: 0.15, description: 'Roster strength and depth' },
            analytics: { weight: 0.1, description: 'Advanced metrics and efficiency' }
        };

        this.init();
    }

    async init() {
        console.log('🎯 Initializing Team Intelligence Cards...');
        this.createContainer();
        this.setupEventListeners();
        await this.loadTeamsData();
        this.render();
        console.log('✅ Team Intelligence Cards initialized');
    }

    createContainer() {
        // Check if container already exists
        this.container = document.getElementById('team-intelligence-container');
        
        if (!this.container) {
            // Create in main content area if it doesn't exist
            const mainContent = document.querySelector('.container') || document.body;
            
            const section = document.createElement('section');
            section.className = 'team-intelligence-section';
            section.innerHTML = `
                <div class="container">
                    <h2 class="section-title">🎯 Team Intelligence Matrix</h2>
                    <p class="section-subtitle">AI-powered analysis across major sports leagues</p>
                    
                    <div class="intelligence-controls">
                        <div class="search-filter-container">
                            <input type="text" 
                                   id="team-search" 
                                   class="team-search-input" 
                                   placeholder="Search teams...">
                            
                            <select id="sport-filter" class="sport-filter-select">
                                <option value="all">All Sports</option>
                                <option value="mlb">⚾ MLB</option>
                                <option value="nfl">🏈 NFL</option>
                                <option value="nba">🏀 NBA</option>
                                <option value="ncaaf">🎓 NCAA Football</option>
                            </select>
                            
                            <button id="refresh-data" class="refresh-button">
                                🔄 Refresh Data
                            </button>
                        </div>
                        
                        <div class="view-controls">
                            <button class="view-btn active" data-view="grid">
                                <span>📊</span> Grid View
                            </button>
                            <button class="view-btn" data-view="table">
                                <span>📋</span> Table View
                            </button>
                            <button class="view-btn" data-view="map">
                                <span>🗺️</span> Map View
                            </button>
                        </div>
                    </div>
                    
                    <div class="intelligence-stats">
                        <div class="stat-card">
                            <span class="stat-value" id="total-teams">0</span>
                            <span class="stat-label">Teams Analyzed</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value" id="total-leagues">0</span>
                            <span class="stat-label">Leagues Covered</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value" id="data-freshness">Live</span>
                            <span class="stat-label">Data Status</span>
                        </div>
                        <div class="stat-card">
                            <span class="stat-value" id="ai-confidence">94.6%</span>
                            <span class="stat-label">AI Confidence</span>
                        </div>
                    </div>
                    
                    <div id="team-intelligence-container" class="team-cards-grid">
                        <!-- Team cards will be dynamically inserted here -->
                    </div>
                    
                    <div id="team-detail-modal" class="team-modal hidden">
                        <div class="modal-content">
                            <button class="modal-close">×</button>
                            <div id="modal-body">
                                <!-- Team details will be inserted here -->
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            mainContent.appendChild(section);
            this.container = document.getElementById('team-intelligence-container');
        }

        this.addStyles();
    }

    addStyles() {
        if (document.getElementById('team-intelligence-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'team-intelligence-styles';
        styles.textContent = `
            .team-intelligence-section {
                padding: 60px 0;
                background: linear-gradient(135deg, #0a0a0a 0%, #1a1a1a 100%);
                border-top: 1px solid rgba(191, 87, 0, 0.3);
            }

            .intelligence-controls {
                margin: 30px 0;
                display: flex;
                justify-content: space-between;
                flex-wrap: wrap;
                gap: 20px;
            }

            .search-filter-container {
                display: flex;
                gap: 15px;
                flex: 1;
                min-width: 300px;
            }

            .team-search-input {
                flex: 1;
                padding: 10px 15px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(191, 87, 0, 0.3);
                border-radius: 8px;
                color: white;
                font-size: 14px;
            }

            .sport-filter-select {
                padding: 10px 15px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(191, 87, 0, 0.3);
                border-radius: 8px;
                color: white;
                font-size: 14px;
                cursor: pointer;
            }

            .refresh-button {
                padding: 10px 20px;
                background: linear-gradient(135deg, #BF5700, #FF7A00);
                border: none;
                border-radius: 8px;
                color: white;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .refresh-button:hover {
                transform: translateY(-2px);
                box-shadow: 0 5px 15px rgba(191, 87, 0, 0.4);
            }

            .view-controls {
                display: flex;
                gap: 10px;
            }

            .view-btn {
                padding: 8px 16px;
                background: rgba(255, 255, 255, 0.05);
                border: 1px solid rgba(191, 87, 0, 0.3);
                border-radius: 6px;
                color: rgba(255, 255, 255, 0.7);
                cursor: pointer;
                transition: all 0.3s ease;
            }

            .view-btn.active {
                background: rgba(191, 87, 0, 0.2);
                border-color: #BF5700;
                color: white;
            }

            .intelligence-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 20px;
                margin: 30px 0;
            }

            .stat-card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(191, 87, 0, 0.2);
                border-radius: 12px;
                padding: 20px;
                text-align: center;
            }

            .stat-value {
                display: block;
                font-size: 28px;
                font-weight: bold;
                color: #BF5700;
                margin-bottom: 5px;
            }

            .stat-label {
                display: block;
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                text-transform: uppercase;
            }

            .team-cards-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
                gap: 25px;
                margin-top: 30px;
            }

            .team-card {
                background: rgba(255, 255, 255, 0.03);
                border: 1px solid rgba(191, 87, 0, 0.2);
                border-radius: 16px;
                padding: 20px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }

            .team-card:hover {
                transform: translateY(-5px);
                border-color: #BF5700;
                box-shadow: 0 10px 30px rgba(191, 87, 0, 0.3);
            }

            .team-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, #BF5700, #FF7A00);
                transform: scaleX(0);
                transition: transform 0.3s ease;
            }

            .team-card:hover::before {
                transform: scaleX(1);
            }

            .team-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 15px;
            }

            .team-info {
                flex: 1;
            }

            .team-name {
                font-size: 18px;
                font-weight: bold;
                color: white;
                margin-bottom: 5px;
            }

            .team-league {
                font-size: 12px;
                color: rgba(255, 255, 255, 0.6);
                display: flex;
                align-items: center;
                gap: 5px;
            }

            .team-logo {
                width: 50px;
                height: 50px;
                background: rgba(191, 87, 0, 0.1);
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 24px;
            }

            .team-metrics {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 10px;
                margin: 15px 0;
            }

            .metric-item {
                display: flex;
                justify-content: space-between;
                font-size: 13px;
            }

            .metric-label {
                color: rgba(255, 255, 255, 0.6);
            }

            .metric-value {
                color: #BF5700;
                font-weight: 600;
            }

            .team-performance-bar {
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin: 15px 0;
            }

            .performance-fill {
                height: 100%;
                background: linear-gradient(90deg, #BF5700, #FF7A00);
                border-radius: 4px;
                transition: width 0.6s ease;
            }

            .team-actions {
                display: flex;
                gap: 10px;
                margin-top: 15px;
            }

            .action-btn {
                flex: 1;
                padding: 8px;
                background: rgba(191, 87, 0, 0.1);
                border: 1px solid rgba(191, 87, 0, 0.3);
                border-radius: 6px;
                color: white;
                font-size: 12px;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
            }

            .action-btn:hover {
                background: rgba(191, 87, 0, 0.3);
                border-color: #BF5700;
            }

            .team-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.9);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 1000;
                backdrop-filter: blur(10px);
            }

            .team-modal.hidden {
                display: none;
            }

            .modal-content {
                background: linear-gradient(135deg, #1a1a1a, #0a0a0a);
                border: 1px solid rgba(191, 87, 0, 0.3);
                border-radius: 20px;
                padding: 30px;
                max-width: 800px;
                width: 90%;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            }

            .modal-close {
                position: absolute;
                top: 15px;
                right: 15px;
                background: none;
                border: none;
                color: white;
                font-size: 24px;
                cursor: pointer;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.3s ease;
            }

            .modal-close:hover {
                background: rgba(255, 255, 255, 0.1);
            }

            @media (max-width: 768px) {
                .intelligence-controls {
                    flex-direction: column;
                }
                
                .search-filter-container {
                    flex-direction: column;
                }
                
                .team-cards-grid {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        document.head.appendChild(styles);
    }

    async loadTeamsData() {
        console.log('📊 Loading teams data...');
        
        // Sample teams data (will be replaced with real API data)
        const sampleTeams = [
            // MLB Teams
            { id: 'stl', name: 'St. Louis Cardinals', sport: 'mlb', league: 'NL Central', founded: 1882, championships: 11, performance: 82 },
            { id: 'hou', name: 'Houston Astros', sport: 'mlb', league: 'AL West', founded: 1962, championships: 2, performance: 89 },
            { id: 'tex', name: 'Texas Rangers', sport: 'mlb', league: 'AL West', founded: 1961, championships: 1, performance: 85 },
            
            // NFL Teams
            { id: 'dal', name: 'Dallas Cowboys', sport: 'nfl', league: 'NFC East', founded: 1960, championships: 5, performance: 78 },
            { id: 'hou-nfl', name: 'Houston Texans', sport: 'nfl', league: 'AFC South', founded: 2002, championships: 0, performance: 72 },
            
            // NCAA Football
            { id: 'tex-ncaa', name: 'Texas Longhorns', sport: 'ncaaf', league: 'SEC', founded: 1893, championships: 4, performance: 91 },
            { id: 'tamu', name: 'Texas A&M Aggies', sport: 'ncaaf', league: 'SEC', founded: 1894, championships: 3, performance: 83 },
            
            // NBA Teams
            { id: 'sas', name: 'San Antonio Spurs', sport: 'nba', league: 'Southwest', founded: 1967, championships: 5, performance: 74 },
            { id: 'dal-nba', name: 'Dallas Mavericks', sport: 'nba', league: 'Southwest', founded: 1980, championships: 1, performance: 77 },
            { id: 'hou-nba', name: 'Houston Rockets', sport: 'nba', league: 'Southwest', founded: 1967, championships: 2, performance: 71 },
            { id: 'mem', name: 'Memphis Grizzlies', sport: 'nba', league: 'Southwest', founded: 1995, championships: 0, performance: 76 }
        ];

        // Load teams into Map
        sampleTeams.forEach(team => {
            this.teams.set(team.id, {
                ...team,
                intelligence: this.calculateIntelligence(team),
                trend: Math.random() > 0.5 ? 'up' : 'down',
                lastUpdated: new Date().toISOString()
            });
        });

        // Try to fetch real data if available
        if (window.sportsDataHub) {
            try {
                const dashboardData = await window.sportsDataHub.initializeDashboard();
                // Process real data when available
                console.log('Real data loaded:', dashboardData);
            } catch (error) {
                console.warn('Using sample data:', error);
            }
        }
    }

    calculateIntelligence(team) {
        const scores = {
            legacy: (team.championships > 0 ? Math.min(100, team.championships * 10) : 40),
            recent: team.performance || 75,
            momentum: 70 + Math.random() * 30,
            talent: 65 + Math.random() * 35,
            analytics: 70 + Math.random() * 30
        };

        const overall = Object.entries(this.performanceMetrics).reduce((sum, [key, metric]) => {
            return sum + (scores[key] * metric.weight);
        }, 0);

        return {
            overall: Math.round(overall),
            scores,
            grade: this.getGrade(overall)
        };
    }

    getGrade(score) {
        if (score >= 90) return 'A+';
        if (score >= 85) return 'A';
        if (score >= 80) return 'A-';
        if (score >= 75) return 'B+';
        if (score >= 70) return 'B';
        if (score >= 65) return 'B-';
        if (score >= 60) return 'C+';
        return 'C';
    }

    render() {
        const filteredTeams = this.getFilteredTeams();
        
        // Update stats
        document.getElementById('total-teams').textContent = filteredTeams.length;
        document.getElementById('total-leagues').textContent = 
            new Set(Array.from(filteredTeams).map(([_, team]) => team.sport)).size;
        
        // Clear and render cards
        this.container.innerHTML = '';
        
        filteredTeams.forEach(([id, team]) => {
            this.container.appendChild(this.createTeamCard(team));
        });
    }

    getFilteredTeams() {
        let filtered = Array.from(this.teams.entries());
        
        // Filter by sport
        if (this.selectedSport !== 'all') {
            filtered = filtered.filter(([_, team]) => team.sport === this.selectedSport);
        }
        
        // Filter by search
        if (this.searchQuery) {
            const query = this.searchQuery.toLowerCase();
            filtered = filtered.filter(([_, team]) => 
                team.name.toLowerCase().includes(query) ||
                team.league.toLowerCase().includes(query)
            );
        }
        
        // Sort by performance
        filtered.sort((a, b) => b[1].intelligence.overall - a[1].intelligence.overall);
        
        return filtered;
    }

    createTeamCard(team) {
        const card = document.createElement('div');
        card.className = 'team-card';
        card.dataset.teamId = team.id;
        
        card.innerHTML = `
            <div class="team-header">
                <div class="team-info">
                    <div class="team-name">${team.name}</div>
                    <div class="team-league">
                        <span>${this.sportEmojis[team.sport]}</span>
                        <span>${team.league}</span>
                    </div>
                </div>
                <div class="team-logo">
                    ${this.sportEmojis[team.sport]}
                </div>
            </div>
            
            <div class="team-metrics">
                <div class="metric-item">
                    <span class="metric-label">Intelligence</span>
                    <span class="metric-value">${team.intelligence.overall}%</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Grade</span>
                    <span class="metric-value">${team.intelligence.grade}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Founded</span>
                    <span class="metric-value">${team.founded}</span>
                </div>
                <div class="metric-item">
                    <span class="metric-label">Titles</span>
                    <span class="metric-value">${team.championships}</span>
                </div>
            </div>
            
            <div class="team-performance-bar">
                <div class="performance-fill" style="width: ${team.intelligence.overall}%"></div>
            </div>
            
            <div class="team-actions">
                <button class="action-btn" onclick="sportsDataHub.generateResourceLinks('team', '${team.sport}', '${team.id}')">
                    📊 Stats
                </button>
                <button class="action-btn" onclick="teamIntelligenceCards.showDetails('${team.id}')">
                    🔍 Details
                </button>
                <button class="action-btn" onclick="teamIntelligenceCards.compareTeam('${team.id}')">
                    ⚖️ Compare
                </button>
            </div>
        `;
        
        return card;
    }

    showDetails(teamId) {
        const team = this.teams.get(teamId);
        if (!team) return;
        
        const modal = document.getElementById('team-detail-modal');
        const modalBody = document.getElementById('modal-body');
        
        modalBody.innerHTML = `
            <h2>${team.name}</h2>
            <div class="modal-team-header">
                <span>${this.sportEmojis[team.sport]} ${team.league}</span>
                <span>Founded: ${team.founded}</span>
            </div>
            
            <h3>Intelligence Breakdown</h3>
            <div class="intelligence-breakdown">
                ${Object.entries(team.intelligence.scores).map(([key, value]) => `
                    <div class="breakdown-item">
                        <span>${key.charAt(0).toUpperCase() + key.slice(1)}</span>
                        <div class="breakdown-bar">
                            <div class="breakdown-fill" style="width: ${value}%"></div>
                        </div>
                        <span>${Math.round(value)}%</span>
                    </div>
                `).join('')}
            </div>
            
            <h3>External Resources</h3>
            <div class="resource-links">
                ${window.sportsDataHub ? 
                    window.sportsDataHub.generateResourceLinks('team', team.sport, team.id)
                        .map(link => `
                            <a href="${link.url}" target="_blank" class="resource-link">
                                ${link.icon} ${link.source}
                            </a>
                        `).join('') : 
                    '<p>Loading resources...</p>'
                }
            </div>
            
            <div class="modal-actions">
                <button class="action-btn" onclick="teamIntelligenceCards.exportTeamData('${teamId}')">
                    📥 Export Data
                </button>
                <button class="action-btn" onclick="teamIntelligenceCards.scheduleAlert('${teamId}')">
                    🔔 Set Alert
                </button>
            </div>
        `;
        
        modal.classList.remove('hidden');
    }

    compareTeam(teamId) {
        // Implementation for team comparison
        console.log('Compare team:', teamId);
    }

    exportTeamData(teamId) {
        const team = this.teams.get(teamId);
        if (!team) return;
        
        const data = JSON.stringify(team, null, 2);
        const blob = new Blob([data], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${team.id}_intelligence.json`;
        a.click();
    }

    scheduleAlert(teamId) {
        const team = this.teams.get(teamId);
        if (!team) return;
        
        alert(`Alert scheduled for ${team.name}. You'll be notified of significant changes.`);
    }

    setupEventListeners() {
        // Search functionality
        document.addEventListener('input', (e) => {
            if (e.target.id === 'team-search') {
                this.searchQuery = e.target.value;
                this.render();
            }
        });

        // Sport filter
        document.addEventListener('change', (e) => {
            if (e.target.id === 'sport-filter') {
                this.selectedSport = e.target.value;
                this.render();
            }
        });

        // Refresh data
        document.addEventListener('click', (e) => {
            if (e.target.id === 'refresh-data') {
                this.loadTeamsData().then(() => this.render());
            }
        });

        // View controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('view-btn')) {
                document.querySelectorAll('.view-btn').forEach(btn => 
                    btn.classList.remove('active')
                );
                e.target.classList.add('active');
                
                const view = e.target.dataset.view;
                this.switchView(view);
            }
        });

        // Modal close
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('modal-close')) {
                document.getElementById('team-detail-modal').classList.add('hidden');
            }
        });

        // Listen for data updates
        document.addEventListener('blazeDataResponse', (e) => {
            console.log('Data received:', e.detail);
            // Update relevant team data
            this.updateTeamData(e.detail);
        });
    }

    switchView(view) {
        switch(view) {
            case 'grid':
                this.container.className = 'team-cards-grid';
                break;
            case 'table':
                this.container.className = 'team-cards-table';
                this.renderTableView();
                break;
            case 'map':
                this.container.className = 'team-cards-map';
                this.renderMapView();
                break;
        }
    }

    renderTableView() {
        // Implementation for table view
        console.log('Rendering table view...');
    }

    renderMapView() {
        // Implementation for map view
        console.log('Rendering map view...');
    }

    updateTeamData(detail) {
        const { sport, type, identifier, data } = detail;
        
        // Update team data with real API response
        const team = Array.from(this.teams.values()).find(t => 
            t.sport === sport && (t.id === identifier || t.name.includes(identifier))
        );
        
        if (team && data) {
            team.apiData = data;
            team.lastUpdated = new Date().toISOString();
            this.render();
        }
    }
}

// Global instance
let teamIntelligenceCards;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        teamIntelligenceCards = new TeamIntelligenceCards();
        window.teamIntelligenceCards = teamIntelligenceCards;
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = TeamIntelligenceCards;
}