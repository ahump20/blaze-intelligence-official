// Blaze Intelligence Data Integration Module
// Real-time sports analytics and visualization

class BlazeDataIntegration {
    constructor() {
        this.dataUpdateInterval = 5000; // Update every 5 seconds
        this.charts = {};
        this.activePlayerProfile = null;
        this.liveDataFeed = [];
        this.init();
    }

    async init() {
        console.log('🔥 Initializing Blaze Intelligence Data Integration');
        await this.fetchInitialData();
        this.setupRealtimeUpdates();
        this.initializeCharts();
        this.setupEventListeners();
    }

    async fetchInitialData() {
        try {
            // Fetch NBA players data
            const playersResponse = await fetch('/api/sports/nba/players');
            if (playersResponse.ok) {
                this.players = await playersResponse.json();
                this.renderPlayerCards();
            }

            // Fetch live games
            const gamesResponse = await fetch('/api/sports/live');
            if (gamesResponse.ok) {
                this.liveGames = await gamesResponse.json();
                this.updateLiveGames();
            }

            // Fetch team standings
            const standingsResponse = await fetch('/api/sports/nba/standings');
            if (standingsResponse.ok) {
                this.standings = await standingsResponse.json();
                this.updateStandings();
            }
        } catch (error) {
            console.error('Error fetching initial data:', error);
            // Use fallback data if API fails
            this.loadFallbackData();
        }
    }

    loadFallbackData() {
        // Comprehensive fallback data for demo purposes
        this.players = [
            {
                id: 1,
                name: 'LeBron James',
                team: 'LAL',
                position: 'SF',
                stats: { ppg: 25.3, rpg: 7.3, apg: 8.0, per: 23.2 },
                trending: 'up',
                injuryRisk: 15
            },
            {
                id: 2,
                name: 'Giannis Antetokounmpo',
                team: 'MIL',
                position: 'PF',
                stats: { ppg: 30.4, rpg: 11.5, apg: 6.5, per: 31.8 },
                trending: 'up',
                injuryRisk: 8
            },
            {
                id: 3,
                name: 'Nikola Jokić',
                team: 'DEN',
                position: 'C',
                stats: { ppg: 26.4, rpg: 12.4, apg: 9.0, per: 31.5 },
                trending: 'stable',
                injuryRisk: 5
            },
            {
                id: 4,
                name: 'Jayson Tatum',
                team: 'BOS',
                position: 'SF',
                stats: { ppg: 27.0, rpg: 8.1, apg: 4.9, per: 23.9 },
                trending: 'up',
                injuryRisk: 6
            }
        ];

        this.renderPlayerCards();
        this.initializeCharts();
    }

    renderPlayerCards() {
        const container = document.getElementById('playerStatsGrid');
        if (!container || !this.players) return;

        container.innerHTML = '';
        
        this.players.slice(0, 8).forEach((player, index) => {
            const card = document.createElement('div');
            card.className = 'player-stat-card';
            card.setAttribute('data-aos', 'fade-up');
            card.setAttribute('data-aos-delay', (index * 100).toString());
            
            const trendIcon = player.trending === 'up' ? '📈' : player.trending === 'down' ? '📉' : '➡️';
            const riskColor = player.injuryRisk < 10 ? '#00DC82' : player.injuryRisk < 20 ? '#FFB800' : '#FF3838';
            
            card.innerHTML = `
                <div class="player-stat-header">
                    <span class="player-name">${player.name}</span>
                    <span class="player-position">${player.position}</span>
                </div>
                <div class="player-team">${player.team}</div>
                <div class="player-metrics">
                    <div class="metric">
                        <div class="metric-value">${player.stats.ppg.toFixed(1)}</div>
                        <div class="metric-label">PPG</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${player.stats.rpg.toFixed(1)}</div>
                        <div class="metric-label">RPG</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${player.stats.apg.toFixed(1)}</div>
                        <div class="metric-label">APG</div>
                    </div>
                    <div class="metric">
                        <div class="metric-value">${player.stats.per.toFixed(1)}</div>
                        <div class="metric-label">PER</div>
                    </div>
                </div>
                <div class="player-footer" style="display: flex; justify-content: space-between; align-items: center; margin-top: 15px; padding-top: 15px; border-top: 1px solid rgba(191, 87, 0, 0.1);">
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <span style="font-size: 20px;">${trendIcon}</span>
                        <span style="font-size: 12px; color: #999;">Trend</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 5px;">
                        <div style="width: 8px; height: 8px; border-radius: 50%; background: ${riskColor};"></div>
                        <span style="font-size: 12px; color: #999;">Risk: ${player.injuryRisk}%</span>
                    </div>
                </div>
            `;
            
            card.addEventListener('click', () => this.showPlayerDetails(player));
            container.appendChild(card);
        });
    }

    showPlayerDetails(player) {
        // Create modal or detailed view for player
        console.log('Showing details for:', player.name);
        
        // Update projection charts with this player's data
        if (this.charts.probabilityChart) {
            this.updatePlayerProjectionChart(player);
        }
    }

    updatePlayerProjectionChart(player) {
        const winProbability = 75 + (player.stats.per - 20) * 2;
        const riskFactor = player.injuryRisk;
        
        this.charts.probabilityChart.data.datasets[0].data = [
            Math.min(95, Math.max(50, winProbability)),
            riskFactor
        ];
        this.charts.probabilityChart.update();
    }

    initializeCharts() {
        const chartColors = {
            primary: '#BF5700',
            secondary: '#FF6B35',
            success: '#00DC82',
            warning: '#FFB800',
            danger: '#FF3838',
            white: '#FFFFFF',
            gray: '#666666'
        };

        // Performance Trend Chart
        const performanceCtx = document.getElementById('performanceChart');
        if (performanceCtx && !this.charts.performanceChart) {
            this.charts.performanceChart = new Chart(performanceCtx, {
                type: 'line',
                data: {
                    labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5', 'Game 6', 'Today'],
                    datasets: [{
                        label: 'Team Performance Index',
                        data: [88, 92, 85, 94, 91, 96, 98],
                        borderColor: chartColors.primary,
                        backgroundColor: 'rgba(191, 87, 0, 0.1)',
                        tension: 0.4,
                        fill: true
                    }, {
                        label: 'League Average',
                        data: [85, 85, 86, 85, 86, 85, 85],
                        borderColor: chartColors.gray,
                        borderDash: [5, 5],
                        backgroundColor: 'transparent',
                        tension: 0.4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            labels: { color: chartColors.white }
                        },
                        tooltip: {
                            callbacks: {
                                afterLabel: function(context) {
                                    return context.datasetIndex === 0 ? 
                                        `Trend: ${context.parsed.y > 90 ? '🔥 Hot Streak' : 'Building Momentum'}` : '';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: false,
                            min: 80,
                            max: 100,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: chartColors.gray }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: chartColors.gray }
                        }
                    }
                }
            });
        }

        // Advanced Efficiency Metrics
        const efficiencyCtx = document.getElementById('efficiencyChart');
        if (efficiencyCtx && !this.charts.efficiencyChart) {
            this.charts.efficiencyChart = new Chart(efficiencyCtx, {
                type: 'radar',
                data: {
                    labels: ['Offense', 'Defense', 'Rebounding', 'Ball Movement', 'Shooting', 'Clutch'],
                    datasets: [{
                        label: 'Current Performance',
                        data: [92, 88, 85, 90, 94, 87],
                        borderColor: chartColors.primary,
                        backgroundColor: 'rgba(191, 87, 0, 0.2)',
                        pointBackgroundColor: chartColors.primary,
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: chartColors.primary
                    }, {
                        label: 'Season Average',
                        data: [88, 85, 82, 86, 89, 85],
                        borderColor: chartColors.secondary,
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        pointBackgroundColor: chartColors.secondary,
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: chartColors.secondary
                    }, {
                        label: 'Championship Target',
                        data: [95, 92, 90, 93, 92, 90],
                        borderColor: chartColors.success,
                        backgroundColor: 'rgba(0, 220, 130, 0.1)',
                        borderDash: [5, 5],
                        pointBackgroundColor: chartColors.success,
                        pointBorderColor: '#fff'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            labels: { color: chartColors.white }
                        }
                    },
                    scales: {
                        r: {
                            beginAtZero: false,
                            min: 75,
                            max: 100,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            pointLabels: { color: chartColors.gray },
                            ticks: { 
                                color: chartColors.gray,
                                backdropColor: 'transparent',
                                stepSize: 5
                            }
                        }
                    }
                }
            });
        }

        // Win Probability & Analytics
        const probabilityCtx = document.getElementById('probabilityChart');
        if (probabilityCtx && !this.charts.probabilityChart) {
            this.charts.probabilityChart = new Chart(probabilityCtx, {
                type: 'doughnut',
                data: {
                    labels: ['Win Probability', 'Risk Factor'],
                    datasets: [{
                        data: [78, 22],
                        backgroundColor: [chartColors.success, chartColors.gray],
                        borderWidth: 0,
                        hoverOffset: 4
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: {
                            position: 'bottom',
                            labels: {
                                color: chartColors.white,
                                padding: 20,
                                font: { size: 12 }
                            }
                        },
                        tooltip: {
                            callbacks: {
                                label: function(context) {
                                    return context.label + ': ' + context.parsed + '%';
                                }
                            }
                        }
                    }
                }
            });
        }

        // Injury Risk Assessment
        const injuryCtx = document.getElementById('injuryChart');
        if (injuryCtx && !this.charts.injuryChart) {
            this.charts.injuryChart = new Chart(injuryCtx, {
                type: 'bar',
                data: {
                    labels: ['LeBron', 'Giannis', 'Jokić', 'Tatum', 'Curry'],
                    datasets: [{
                        label: 'Injury Risk %',
                        data: [15, 8, 5, 6, 18],
                        backgroundColor: (context) => {
                            const value = context.parsed.y;
                            if (value < 10) return chartColors.success;
                            if (value < 20) return chartColors.warning;
                            return chartColors.danger;
                        },
                        borderRadius: 8
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: {
                        legend: { display: false },
                        tooltip: {
                            callbacks: {
                                afterLabel: function(context) {
                                    const risk = context.parsed.y;
                                    if (risk < 10) return '✅ Low Risk';
                                    if (risk < 20) return '⚠️ Moderate Risk';
                                    return '🚨 High Risk';
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 30,
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { 
                                color: chartColors.gray,
                                callback: function(value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: chartColors.gray }
                        }
                    }
                }
            });
        }

        // Team Performance Over Time
        const teamPerformanceCtx = document.getElementById('teamPerformanceChart');
        if (teamPerformanceCtx && !this.charts.teamPerformanceChart) {
            this.charts.teamPerformanceChart = new Chart(teamPerformanceCtx, {
                type: 'line',
                data: {
                    labels: ['Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr'],
                    datasets: [{
                        label: 'Offensive Rating',
                        data: [110, 112, 115, 118, 116, 122, 124],
                        borderColor: chartColors.primary,
                        backgroundColor: 'rgba(191, 87, 0, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    }, {
                        label: 'Defensive Rating',
                        data: [105, 103, 102, 98, 99, 95, 93],
                        borderColor: chartColors.secondary,
                        backgroundColor: 'rgba(255, 107, 53, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y'
                    }, {
                        label: 'Net Rating',
                        data: [5, 9, 13, 20, 17, 27, 31],
                        borderColor: chartColors.success,
                        backgroundColor: 'rgba(0, 220, 130, 0.1)',
                        tension: 0.4,
                        yAxisID: 'y1'
                    }]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    interaction: {
                        mode: 'index',
                        intersect: false
                    },
                    plugins: {
                        legend: {
                            labels: { color: chartColors.white }
                        }
                    },
                    scales: {
                        y: {
                            type: 'linear',
                            display: true,
                            position: 'left',
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: chartColors.gray },
                            title: {
                                display: true,
                                text: 'Off/Def Rating',
                                color: chartColors.gray
                            }
                        },
                        y1: {
                            type: 'linear',
                            display: true,
                            position: 'right',
                            grid: { drawOnChartArea: false },
                            ticks: { color: chartColors.gray },
                            title: {
                                display: true,
                                text: 'Net Rating',
                                color: chartColors.gray
                            }
                        },
                        x: {
                            grid: { color: 'rgba(255, 255, 255, 0.1)' },
                            ticks: { color: chartColors.gray }
                        }
                    }
                }
            });
        }
    }

    setupRealtimeUpdates() {
        // Update data every 5 seconds
        setInterval(() => {
            this.simulateDataUpdate();
            this.updateCharts();
            this.updateLiveStats();
        }, this.dataUpdateInterval);

        // Faster updates for live games (every 2 seconds)
        setInterval(() => {
            this.updateLiveGames();
        }, 2000);
    }

    simulateDataUpdate() {
        // Simulate real-time data changes
        if (this.players) {
            this.players.forEach(player => {
                // Small random fluctuations in stats
                if (Math.random() > 0.7) {
                    player.stats.ppg += (Math.random() - 0.5) * 0.2;
                    player.stats.rpg += (Math.random() - 0.5) * 0.1;
                    player.stats.apg += (Math.random() - 0.5) * 0.1;
                    
                    // Update trending
                    const rand = Math.random();
                    if (rand > 0.8) player.trending = 'up';
                    else if (rand < 0.2) player.trending = 'down';
                    else player.trending = 'stable';
                }
            });
        }
    }

    updateCharts() {
        // Update performance chart with new data point
        if (this.charts.performanceChart) {
            const currentData = this.charts.performanceChart.data.datasets[0].data;
            const newValue = currentData[currentData.length - 1] + (Math.random() - 0.5) * 3;
            
            // Shift data and add new point
            currentData.shift();
            currentData.push(Math.min(100, Math.max(80, newValue)));
            
            this.charts.performanceChart.update('none'); // No animation for smooth updates
        }

        // Update efficiency radar
        if (this.charts.efficiencyChart) {
            this.charts.efficiencyChart.data.datasets[0].data = 
                this.charts.efficiencyChart.data.datasets[0].data.map(val => 
                    Math.min(100, Math.max(75, val + (Math.random() - 0.5) * 2))
                );
            this.charts.efficiencyChart.update('none');
        }
    }

    updateLiveStats() {
        // Update the stat counter values
        const statValues = document.querySelectorAll('.stat-value');
        statValues.forEach(stat => {
            if (Math.random() > 0.8) {
                const current = parseFloat(stat.textContent.replace(',', ''));
                const variance = current * 0.01;
                const newValue = current + (Math.random() - 0.5) * variance;
                const decimals = stat.getAttribute('data-count').includes('.') ? 1 : 0;
                
                stat.textContent = decimals > 0 ? 
                    newValue.toFixed(decimals) : 
                    Math.floor(newValue).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
            }
        });
    }

    updateLiveGames() {
        // This would fetch live game data in production
        // For demo, we'll simulate score changes
        if (this.liveGames && this.liveGames.length > 0) {
            this.liveGames.forEach(game => {
                if (Math.random() > 0.7) {
                    const scoringTeam = Math.random() > 0.5 ? 'home' : 'away';
                    const points = Math.random() > 0.8 ? 3 : 2;
                    
                    if (scoringTeam === 'home') {
                        game.homeScore += points;
                    } else {
                        game.awayScore += points;
                    }
                }
            });
            
            // Update UI with new scores
            this.renderLiveGames();
        }
    }

    renderLiveGames() {
        // This would update the live games section
        const liveGamesContainer = document.querySelector('.live-games-container');
        if (liveGamesContainer && this.liveGames) {
            // Update live game scores in UI
            console.log('Live games updated:', this.liveGames);
        }
    }

    updateStandings() {
        // Update team standings display
        if (this.standings) {
            console.log('Standings updated:', this.standings);
        }
    }

    setupEventListeners() {
        // Add click handlers for interactive elements
        document.querySelectorAll('.feature-card').forEach(card => {
            card.addEventListener('click', () => {
                card.style.transform = 'scale(1.02)';
                setTimeout(() => {
                    card.style.transform = '';
                }, 200);
            });
        });
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.blazeData = new BlazeDataIntegration();
});