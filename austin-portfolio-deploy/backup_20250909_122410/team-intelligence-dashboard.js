/**
 * Blaze Intelligence Team Dashboard Component
 * Real-time team intelligence display
 */

class TeamIntelligenceDashboard {
    constructor() {
        this.teams = [];
        this.selectedLeague = 'all';
        this.featuredTeams = ['St. Louis Cardinals', 'Tennessee Titans', 'Texas Longhorns', 'Memphis Grizzlies'];
        this.init();
    }

    async init() {
        await this.loadTeamData();
        this.render();
        this.attachEventListeners();
        this.startRealTimeUpdates();
    }

    async loadTeamData() {
        try {
            const response = await fetch('/data/team-intelligence.json');
            const data = await response.json();
            this.teams = data.teams;
            this.meta = data.meta;
            this.leagueSummaries = data.league_summaries;
            console.log(`✅ Loaded ${this.teams.length} teams`);
        } catch (error) {
            console.error('Error loading team data:', error);
        }
    }

    render() {
        const container = document.getElementById('team-intelligence-container');
        if (!container) return;

        const featuredHTML = this.renderFeaturedTeams();
        const leagueHTML = this.renderLeagueStats();
        const topPerformersHTML = this.renderTopPerformers();

        container.innerHTML = `
            <div class="team-intelligence-dashboard">
                <div class="dashboard-header">
                    <h2>🔥 Team Intelligence Command Center</h2>
                    <div class="stats-summary">
                        <span class="stat-item">
                            <strong>${this.teams.length}</strong> Teams
                        </span>
                        <span class="stat-item">
                            <strong>${this.meta.accuracy}%</strong> Accuracy
                        </span>
                        <span class="stat-item">
                            <strong>${this.meta.data_points}</strong> Data Points
                        </span>
                    </div>
                </div>

                <div class="featured-teams-section">
                    <h3>Featured Teams</h3>
                    <div class="featured-teams-grid">
                        ${featuredHTML}
                    </div>
                </div>

                <div class="league-stats-section">
                    <h3>League Analysis</h3>
                    <div class="league-stats-grid">
                        ${leagueHTML}
                    </div>
                </div>

                <div class="top-performers-section">
                    <h3>Top Performers by Blaze Score</h3>
                    <div class="top-performers-list">
                        ${topPerformersHTML}
                    </div>
                </div>
            </div>
        `;
    }

    renderFeaturedTeams() {
        const featured = this.teams.filter(t => this.featuredTeams.includes(t.name));
        return featured.map(team => `
            <div class="featured-team-card" data-team-id="${team.id}">
                <h4>${team.name}</h4>
                <div class="team-league">${team.league} • ${team.division}</div>
                <div class="team-metrics">
                    <div class="metric">
                        <span class="value">${team.metrics.blaze_intelligence_score}</span>
                        <span class="label">Blaze Score</span>
                    </div>
                    <div class="metric">
                        <span class="value">${team.championships}</span>
                        <span class="label">Titles</span>
                    </div>
                    <div class="metric ${team.analytics.performance_trend}">
                        <span class="value">${team.analytics.performance_trend}</span>
                        <span class="label">Trend</span>
                    </div>
                </div>
                <a href="/teams/${team.id}.html" class="view-details">View Details →</a>
            </div>
        `).join('');
    }

    renderLeagueStats() {
        return Object.entries(this.leagueSummaries).map(([league, summary]) => `
            <div class="league-stat-card">
                <h4>${league}</h4>
                <div class="league-metrics">
                    <div>${summary.total_teams} Teams</div>
                    <div>${summary.total_championships} Championships</div>
                    <div>Avg Score: ${summary.avg_competitive_index}</div>
                </div>
            </div>
        `).join('');
    }

    renderTopPerformers() {
        const topTeams = [...this.teams]
            .sort((a, b) => b.metrics.blaze_intelligence_score - a.metrics.blaze_intelligence_score)
            .slice(0, 10);

        return topTeams.map((team, index) => `
            <div class="top-performer-item">
                <span class="rank">#${index + 1}</span>
                <span class="team-name">${team.name}</span>
                <span class="team-league">${team.league}</span>
                <span class="blaze-score">${team.metrics.blaze_intelligence_score}</span>
            </div>
        `).join('');
    }

    attachEventListeners() {
        // Add click handlers for team cards
        document.querySelectorAll('.featured-team-card').forEach(card => {
            card.addEventListener('click', (e) => {
                if (!e.target.classList.contains('view-details')) {
                    const teamId = card.dataset.teamId;
                    this.showTeamDetails(teamId);
                }
            });
        });
    }

    showTeamDetails(teamId) {
        const team = this.teams.find(t => t.id === teamId);
        if (!team) return;

        // Display team modal or navigate to team page
        console.log('Showing details for:', team.name);
    }

    startRealTimeUpdates() {
        // Simulate real-time updates every 30 seconds
        setInterval(() => {
            this.updateMetrics();
        }, 30000);
    }

    updateMetrics() {
        // Simulate metric updates
        this.teams.forEach(team => {
            // Small random fluctuations
            const change = (Math.random() - 0.5) * 0.02;
            team.analytics.playoff_probability = Math.max(0, Math.min(1, 
                team.analytics.playoff_probability + change));
        });
        
        console.log('📊 Metrics updated');
    }
}

// Initialize dashboard when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.teamDashboard = new TeamIntelligenceDashboard();
    });
} else {
    window.teamDashboard = new TeamIntelligenceDashboard();
}
