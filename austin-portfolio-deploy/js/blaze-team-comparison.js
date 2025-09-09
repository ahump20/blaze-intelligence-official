/**
 * Blaze Intelligence Team Comparison Tool
 * Advanced analytics for comparing team performance
 */

class BlazeTeamComparison {
    constructor() {
        this.teams = {
            mlb: {
                cardinals: { name: 'St. Louis Cardinals', color: '#C41E3A', city: 'St. Louis' },
                cubs: { name: 'Chicago Cubs', color: '#0E3386', city: 'Chicago' },
                brewers: { name: 'Milwaukee Brewers', color: '#12284B', city: 'Milwaukee' },
                reds: { name: 'Cincinnati Reds', color: '#C6011F', city: 'Cincinnati' },
                pirates: { name: 'Pittsburgh Pirates', color: '#27251F', city: 'Pittsburgh' }
            },
            nfl: {
                titans: { name: 'Tennessee Titans', color: '#0C2340', city: 'Nashville' },
                chiefs: { name: 'Kansas City Chiefs', color: '#E31837', city: 'Kansas City' },
                bills: { name: 'Buffalo Bills', color: '#00338D', city: 'Buffalo' },
                ravens: { name: 'Baltimore Ravens', color: '#241773', city: 'Baltimore' },
                bengals: { name: 'Cincinnati Bengals', color: '#FB4F14', city: 'Cincinnati' }
            },
            nba: {
                grizzlies: { name: 'Memphis Grizzlies', color: '#5D76A9', city: 'Memphis' },
                lakers: { name: 'Los Angeles Lakers', color: '#552583', city: 'Los Angeles' },
                warriors: { name: 'Golden State Warriors', color: '#1D428A', city: 'San Francisco' },
                mavs: { name: 'Dallas Mavericks', color: '#00538C', city: 'Dallas' },
                spurs: { name: 'San Antonio Spurs', color: '#C4CED4', city: 'San Antonio' }
            },
            ncaa: {
                longhorns: { name: 'Texas Longhorns', color: '#BF5700', city: 'Austin' },
                aggies: { name: 'Texas A&M Aggies', color: '#500000', city: 'College Station' },
                alabama: { name: 'Alabama Crimson Tide', color: '#9E1B32', city: 'Tuscaloosa' },
                georgia: { name: 'Georgia Bulldogs', color: '#BA0C2F', city: 'Athens' },
                oklahoma: { name: 'Oklahoma Sooners', color: '#841617', city: 'Norman' }
            }
        };
        
        this.currentLeague = 'mlb';
        this.selectedTeams = [];
        this.comparisonChart = null;
        
        this.init();
    }
    
    init() {
        this.createComparisonInterface();
        this.bindEventHandlers();
        this.generateSampleData();
    }
    
    createComparisonInterface() {
        const comparisonHTML = `
            <div id="team-comparison-modal" class="comparison-modal">
                <div class="comparison-modal-content">
                    <div class="comparison-header">
                        <h2>📊 Team Performance Comparison</h2>
                        <button id="comparison-close" class="comparison-close">×</button>
                    </div>
                    
                    <div class="comparison-controls">
                        <div class="league-selector">
                            <label>Select League:</label>
                            <div class="league-buttons">
                                <button class="league-btn active" data-league="mlb">MLB</button>
                                <button class="league-btn" data-league="nfl">NFL</button>
                                <button class="league-btn" data-league="nba">NBA</button>
                                <button class="league-btn" data-league="ncaa">NCAA</button>
                            </div>
                        </div>
                        
                        <div class="team-selector">
                            <label>Select Teams to Compare (up to 4):</label>
                            <div id="team-grid" class="team-grid">
                                <!-- Team selection will be populated here -->
                            </div>
                        </div>
                    </div>
                    
                    <div id="comparison-results" class="comparison-results" style="display: none;">
                        <div class="results-header">
                            <h3>Comparison Results</h3>
                            <div class="metric-selector">
                                <select id="metric-select">
                                    <option value="overall">Overall Performance</option>
                                    <option value="offense">Offensive Metrics</option>
                                    <option value="defense">Defensive Metrics</option>
                                    <option value="clutch">Clutch Performance</option>
                                    <option value="consistency">Consistency</option>
                                </select>
                            </div>
                        </div>
                        
                        <div class="comparison-chart-container">
                            <canvas id="comparison-chart"></canvas>
                        </div>
                        
                        <div class="team-stats-grid" id="team-stats">
                            <!-- Team statistics will be populated here -->
                        </div>
                        
                        <div class="insights-section">
                            <h4>🔍 Key Insights</h4>
                            <ul id="comparison-insights"></ul>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', comparisonHTML);
        this.addComparisonStyles();
    }
    
    addComparisonStyles() {
        const styles = `
            .comparison-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(10px);
                z-index: 10002;
                display: none;
                padding: 2rem;
                overflow-y: auto;
            }
            
            .comparison-modal-content {
                max-width: 1200px;
                margin: 0 auto;
                background: linear-gradient(135deg, rgba(10, 10, 10, 0.98), rgba(20, 20, 20, 0.98));
                border: 1px solid #9BCBEB;
                border-radius: 20px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                font-family: 'Inter', sans-serif;
            }
            
            .comparison-header {
                padding: 2rem 2rem 1rem;
                border-bottom: 1px solid rgba(155, 203, 235, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .comparison-header h2 {
                color: #9BCBEB;
                font-size: 1.75rem;
                font-weight: 700;
                margin: 0;
            }
            
            .comparison-close {
                background: none;
                border: none;
                color: #E5E4E2;
                font-size: 2rem;
                cursor: pointer;
                padding: 0;
                width: 40px;
                height: 40px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s ease;
            }
            
            .comparison-close:hover {
                background: rgba(155, 203, 235, 0.2);
                transform: rotate(90deg);
            }
            
            .comparison-controls {
                padding: 2rem;
            }
            
            .league-selector,
            .team-selector {
                margin-bottom: 2rem;
            }
            
            .league-selector label,
            .team-selector label {
                display: block;
                color: #E5E4E2;
                font-size: 1rem;
                font-weight: 600;
                margin-bottom: 1rem;
            }
            
            .league-buttons {
                display: flex;
                gap: 0.5rem;
                flex-wrap: wrap;
            }
            
            .league-btn {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(155, 203, 235, 0.3);
                color: #E5E4E2;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .league-btn:hover {
                border-color: #9BCBEB;
                background: rgba(155, 203, 235, 0.1);
            }
            
            .league-btn.active {
                background: linear-gradient(135deg, #9BCBEB, #00B2A9);
                color: white;
                border-color: #9BCBEB;
            }
            
            .team-grid {
                display: grid;
                grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
                gap: 1rem;
            }
            
            .team-card {
                background: rgba(0, 0, 0, 0.3);
                border: 2px solid transparent;
                border-radius: 12px;
                padding: 1rem;
                cursor: pointer;
                transition: all 0.3s ease;
                text-align: center;
                position: relative;
            }
            
            .team-card:hover {
                transform: translateY(-3px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            }
            
            .team-card.selected {
                border-color: #BF5700;
                background: rgba(191, 87, 0, 0.1);
            }
            
            .team-card.disabled {
                opacity: 0.5;
                cursor: not-allowed;
                pointer-events: none;
            }
            
            .team-logo {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                margin: 0 auto 0.75rem;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1.5rem;
                font-weight: 900;
                color: white;
                text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
            }
            
            .team-name {
                color: #E5E4E2;
                font-weight: 600;
                margin-bottom: 0.25rem;
            }
            
            .team-city {
                color: #9BCBEB;
                font-size: 0.875rem;
                opacity: 0.8;
            }
            
            .comparison-results {
                padding: 2rem;
                border-top: 1px solid rgba(155, 203, 235, 0.2);
            }
            
            .results-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 2rem;
                flex-wrap: wrap;
                gap: 1rem;
            }
            
            .results-header h3 {
                color: #9BCBEB;
                font-size: 1.5rem;
                font-weight: 700;
                margin: 0;
            }
            
            .metric-selector select {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(155, 203, 235, 0.3);
                color: #E5E4E2;
                padding: 0.75rem;
                border-radius: 8px;
                font-size: 1rem;
            }
            
            .comparison-chart-container {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(155, 203, 235, 0.2);
                border-radius: 16px;
                padding: 2rem;
                margin-bottom: 2rem;
                height: 400px;
                position: relative;
            }
            
            .team-stats-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
                margin-bottom: 2rem;
            }
            
            .team-stat-card {
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(155, 203, 235, 0.2);
                border-radius: 12px;
                padding: 1.5rem;
                text-align: center;
            }
            
            .stat-card-header {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 0.75rem;
                margin-bottom: 1rem;
            }
            
            .stat-team-logo {
                width: 40px;
                height: 40px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-size: 1rem;
                font-weight: 900;
                color: white;
            }
            
            .stat-team-name {
                color: #E5E4E2;
                font-weight: 600;
                font-size: 1.125rem;
            }
            
            .stat-metrics {
                display: grid;
                grid-template-columns: repeat(2, 1fr);
                gap: 1rem;
            }
            
            .stat-metric {
                text-align: center;
            }
            
            .stat-value {
                color: #BF5700;
                font-family: 'JetBrains Mono', monospace;
                font-size: 1.25rem;
                font-weight: 700;
                display: block;
                margin-bottom: 0.25rem;
            }
            
            .stat-label {
                color: #E5E4E2;
                opacity: 0.7;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 1px;
            }
            
            .insights-section {
                background: rgba(191, 87, 0, 0.1);
                border: 1px solid rgba(191, 87, 0, 0.3);
                border-radius: 12px;
                padding: 1.5rem;
            }
            
            .insights-section h4 {
                color: #BF5700;
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
            }
            
            .insights-section ul {
                list-style: none;
                padding: 0;
                margin: 0;
            }
            
            .insights-section li {
                color: #E5E4E2;
                padding: 0.5rem 0;
                border-bottom: 1px solid rgba(191, 87, 0, 0.1);
                position: relative;
                padding-left: 1.5rem;
            }
            
            .insights-section li:last-child {
                border-bottom: none;
            }
            
            .insights-section li::before {
                content: '•';
                color: #BF5700;
                position: absolute;
                left: 0;
                font-weight: bold;
            }
            
            @media (max-width: 768px) {
                .comparison-modal {
                    padding: 1rem;
                }
                
                .team-grid {
                    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                }
                
                .results-header {
                    flex-direction: column;
                    align-items: stretch;
                }
                
                .team-stats-grid {
                    grid-template-columns: 1fr;
                }
                
                .stat-metrics {
                    grid-template-columns: 1fr;
                }
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }
    
    bindEventHandlers() {
        // Modal controls
        document.getElementById('comparison-close').addEventListener('click', () => this.closeComparison());
        
        // League selection
        document.querySelectorAll('.league-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.league-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentLeague = e.target.dataset.league;
                this.selectedTeams = [];
                this.populateTeamGrid();
            });
        });
        
        // Metric selection
        document.getElementById('metric-select').addEventListener('change', () => {
            if (this.selectedTeams.length >= 2) {
                this.updateComparison();
            }
        });
        
        // Add comparison trigger buttons
        this.addComparisonTriggers();
    }
    
    addComparisonTriggers() {
        // Add Team Comparison button to analytics section
        const analyticsSection = document.querySelector('#analytics');
        if (analyticsSection) {
            const comparisonButton = document.createElement('div');
            comparisonButton.innerHTML = `
                <div style="text-align: center; margin: 2rem 0;">
                    <button id="team-comparison-trigger" style="
                        background: linear-gradient(135deg, #9BCBEB, #00B2A9);
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 10px;
                        font-size: 1.125rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 10px 30px rgba(155, 203, 235, 0.3);
                    ">
                        📊 Compare Teams
                    </button>
                </div>
            `;
            
            analyticsSection.appendChild(comparisonButton);
            
            document.getElementById('team-comparison-trigger').addEventListener('click', () => {
                this.showComparison();
            });
            
            // Add hover effect
            const btn = document.getElementById('team-comparison-trigger');
            btn.addEventListener('mouseover', () => {
                btn.style.transform = 'translateY(-3px)';
                btn.style.boxShadow = '0 15px 40px rgba(155, 203, 235, 0.4)';
            });
            btn.addEventListener('mouseout', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 10px 30px rgba(155, 203, 235, 0.3)';
            });
        }
    }
    
    showComparison() {
        document.getElementById('team-comparison-modal').style.display = 'block';
        this.populateTeamGrid();
    }
    
    closeComparison() {
        document.getElementById('team-comparison-modal').style.display = 'none';
    }
    
    populateTeamGrid() {
        const teamGrid = document.getElementById('team-grid');
        const leagueTeams = this.teams[this.currentLeague];
        
        teamGrid.innerHTML = '';
        
        Object.entries(leagueTeams).forEach(([key, team]) => {
            const teamCard = document.createElement('div');
            teamCard.className = 'team-card';
            teamCard.dataset.teamKey = key;
            
            const isSelected = this.selectedTeams.includes(key);
            const isDisabled = this.selectedTeams.length >= 4 && !isSelected;
            
            if (isSelected) teamCard.classList.add('selected');
            if (isDisabled) teamCard.classList.add('disabled');
            
            teamCard.innerHTML = `
                <div class="team-logo" style="background-color: ${team.color}">
                    ${team.name.split(' ').map(word => word[0]).join('')}
                </div>
                <div class="team-name">${team.name}</div>
                <div class="team-city">${team.city}</div>
            `;
            
            if (!isDisabled) {
                teamCard.addEventListener('click', () => this.toggleTeamSelection(key));
            }
            
            teamGrid.appendChild(teamCard);
        });
    }
    
    toggleTeamSelection(teamKey) {
        const index = this.selectedTeams.indexOf(teamKey);
        
        if (index > -1) {
            // Remove team
            this.selectedTeams.splice(index, 1);
        } else if (this.selectedTeams.length < 4) {
            // Add team
            this.selectedTeams.push(teamKey);
        }
        
        this.populateTeamGrid();
        
        if (this.selectedTeams.length >= 2) {
            this.performComparison();
        } else {
            document.getElementById('comparison-results').style.display = 'none';
        }
    }
    
    performComparison() {
        document.getElementById('comparison-results').style.display = 'block';
        this.updateComparison();
        
        // Scroll to results
        document.getElementById('comparison-results').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
    
    updateComparison() {
        const selectedMetric = document.getElementById('metric-select').value;
        this.updateChart(selectedMetric);
        this.updateStats(selectedMetric);
        this.generateInsights(selectedMetric);
    }
    
    updateChart(metric) {
        const ctx = document.getElementById('comparison-chart').getContext('2d');
        
        if (this.comparisonChart) {
            this.comparisonChart.destroy();
        }
        
        const datasets = this.selectedTeams.map(teamKey => {
            const team = this.teams[this.currentLeague][teamKey];
            const data = this.generateTeamData(teamKey, metric);
            
            return {
                label: team.name,
                data: data.values,
                backgroundColor: team.color + '20',
                borderColor: team.color,
                borderWidth: 3,
                pointBackgroundColor: team.color,
                pointBorderColor: '#fff',
                pointBorderWidth: 2,
                pointRadius: 6,
                tension: 0.4,
                fill: true
            };
        });
        
        this.comparisonChart = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: this.getMetricLabels(metric),
                datasets: datasets
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#E5E4E2',
                            font: { family: 'Inter', size: 12 }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        grid: { color: 'rgba(229, 228, 226, 0.1)' },
                        angleLines: { color: 'rgba(229, 228, 226, 0.1)' },
                        pointLabels: {
                            color: '#E5E4E2',
                            font: { family: 'Inter', size: 11 }
                        },
                        ticks: {
                            color: '#E5E4E2',
                            font: { family: 'Inter', size: 10 },
                            stepSize: 20
                        }
                    }
                }
            }
        });
    }
    
    updateStats(metric) {
        const statsGrid = document.getElementById('team-stats');
        statsGrid.innerHTML = '';
        
        this.selectedTeams.forEach(teamKey => {
            const team = this.teams[this.currentLeague][teamKey];
            const data = this.generateTeamData(teamKey, metric);
            
            const statCard = document.createElement('div');
            statCard.className = 'team-stat-card';
            statCard.innerHTML = `
                <div class="stat-card-header">
                    <div class="stat-team-logo" style="background-color: ${team.color}">
                        ${team.name.split(' ').map(word => word[0]).join('')}
                    </div>
                    <div class="stat-team-name">${team.name}</div>
                </div>
                <div class="stat-metrics">
                    ${this.generateStatMetrics(data, metric)}
                </div>
            `;
            
            statsGrid.appendChild(statCard);
        });
    }
    
    generateStatMetrics(data, metric) {
        const metricSets = {
            overall: [
                { label: 'Overall Score', value: data.overall + '/100' },
                { label: 'Win Rate', value: (data.winRate * 100).toFixed(1) + '%' },
                { label: 'Strength', value: data.strength + '/100' },
                { label: 'Consistency', value: data.consistency + '/100' }
            ],
            offense: [
                { label: 'Scoring', value: data.offense.toFixed(1) },
                { label: 'Efficiency', value: data.offensiveEfficiency + '%' },
                { label: 'Big Plays', value: data.bigPlays + '/100' },
                { label: 'Red Zone', value: data.redZone + '%' }
            ],
            defense: [
                { label: 'Defense', value: data.defense.toFixed(1) },
                { label: 'Stops', value: data.defensiveStops + '%' },
                { label: 'Turnovers', value: data.turnovers + '/100' },
                { label: 'Pressure', value: data.defensivePressure + '/100' }
            ],
            clutch: [
                { label: 'Clutch', value: data.clutch + '/100' },
                { label: 'Late Game', value: data.lateGame + '%' },
                { label: 'Pressure', value: data.pressurePerf + '/100' },
                { label: 'Comebacks', value: data.comebacks }
            ],
            consistency: [
                { label: 'Consistency', value: data.consistency + '/100' },
                { label: 'Variance', value: data.variance.toFixed(2) },
                { label: 'Home/Away', value: data.homeAway + '/100' },
                { label: 'Monthly', value: data.monthlyVar + '/100' }
            ]
        };
        
        return metricSets[metric].map(stat => `
            <div class="stat-metric">
                <span class="stat-value">${stat.value}</span>
                <span class="stat-label">${stat.label}</span>
            </div>
        `).join('');
    }
    
    generateInsights(metric) {
        const insights = [];
        const teamData = this.selectedTeams.map(key => ({
            key,
            name: this.teams[this.currentLeague][key].name,
            data: this.generateTeamData(key, metric)
        }));
        
        // Find top performer in selected metric
        let topTeam = teamData[0];
        let topValue = this.getMetricValue(topTeam.data, metric);
        
        teamData.forEach(team => {
            const value = this.getMetricValue(team.data, metric);
            if (value > topValue) {
                topTeam = team;
                topValue = value;
            }
        });
        
        insights.push(`${topTeam.name} leads in ${metric} metrics with a score of ${topValue.toFixed(1)}`);
        
        // Compare consistency
        const consistencyScores = teamData.map(t => t.data.consistency);
        const mostConsistent = teamData[consistencyScores.indexOf(Math.max(...consistencyScores))];
        insights.push(`${mostConsistent.name} shows the highest consistency at ${mostConsistent.data.consistency}/100`);
        
        // Clutch performance insight
        if (metric === 'clutch') {
            const clutchLeader = teamData.reduce((prev, curr) => 
                curr.data.clutch > prev.data.clutch ? curr : prev
            );
            insights.push(`${clutchLeader.name} excels in high-pressure situations with ${clutchLeader.data.clutch}/100 clutch rating`);
        }
        
        // Performance gap
        const values = teamData.map(t => this.getMetricValue(t.data, metric));
        const gap = Math.max(...values) - Math.min(...values);
        if (gap > 20) {
            insights.push(`Significant performance gap of ${gap.toFixed(1)} points between top and bottom teams`);
        } else {
            insights.push(`Teams are closely matched with only ${gap.toFixed(1)} points separating leaders`);
        }
        
        // Sport-specific insights
        if (this.currentLeague === 'mlb') {
            insights.push('Consider ballpark factors and recent pitcher rotations when analyzing these metrics');
        } else if (this.currentLeague === 'nfl') {
            insights.push('Weather conditions and home field advantage play significant roles in these comparisons');
        } else if (this.currentLeague === 'nba') {
            insights.push('Player injury status and recent trades may impact these performance metrics');
        } else if (this.currentLeague === 'ncaa') {
            insights.push('Consider recruiting classes and coaching changes when evaluating long-term trends');
        }
        
        const insightsList = document.getElementById('comparison-insights');
        insightsList.innerHTML = '';
        
        insights.forEach(insight => {
            const li = document.createElement('li');
            li.textContent = insight;
            insightsList.appendChild(li);
        });
    }
    
    generateTeamData(teamKey, metric) {
        // Generate realistic team data with some variance
        const baseStats = this.teamStats[teamKey] || this.generateBaseStats();
        
        // Add some randomness for demonstration
        const variance = () => 0.9 + Math.random() * 0.2;
        
        return {
            overall: Math.round(baseStats.overall * variance()),
            winRate: Math.min(0.95, Math.max(0.3, baseStats.winRate * variance())),
            strength: Math.round(baseStats.strength * variance()),
            consistency: Math.round(baseStats.consistency * variance()),
            offense: baseStats.offense * variance(),
            defense: baseStats.defense * variance(),
            clutch: Math.round(baseStats.clutch * variance()),
            offensiveEfficiency: Math.round(baseStats.offensiveEfficiency * variance()),
            defensiveStops: Math.round(baseStats.defensiveStops * variance()),
            bigPlays: Math.round(baseStats.bigPlays * variance()),
            turnovers: Math.round(baseStats.turnovers * variance()),
            redZone: Math.round(baseStats.redZone * variance()),
            defensivePressure: Math.round(baseStats.defensivePressure * variance()),
            lateGame: Math.round(baseStats.lateGame * variance()),
            pressurePerf: Math.round(baseStats.pressurePerf * variance()),
            comebacks: Math.round(baseStats.comebacks * variance()),
            variance: baseStats.variance * variance(),
            homeAway: Math.round(baseStats.homeAway * variance()),
            monthlyVar: Math.round(baseStats.monthlyVar * variance()),
            values: [
                Math.round(baseStats.overall * variance()),
                Math.round(baseStats.offense * variance()),
                Math.round(baseStats.defense * variance()),
                Math.round(baseStats.clutch * variance()),
                Math.round(baseStats.consistency * variance()),
                Math.round(baseStats.strength * variance())
            ]
        };
    }
    
    generateBaseStats() {
        return {
            overall: 70 + Math.random() * 25,
            winRate: 0.4 + Math.random() * 0.4,
            strength: 65 + Math.random() * 30,
            consistency: 60 + Math.random() * 35,
            offense: 65 + Math.random() * 30,
            defense: 65 + Math.random() * 30,
            clutch: 60 + Math.random() * 35,
            offensiveEfficiency: 70 + Math.random() * 25,
            defensiveStops: 65 + Math.random() * 30,
            bigPlays: 60 + Math.random() * 35,
            turnovers: 65 + Math.random() * 30,
            redZone: 70 + Math.random() * 25,
            defensivePressure: 65 + Math.random() * 30,
            lateGame: 68 + Math.random() * 27,
            pressurePerf: 62 + Math.random() * 33,
            comebacks: 3 + Math.random() * 7,
            variance: 0.1 + Math.random() * 0.3,
            homeAway: 75 + Math.random() * 20,
            monthlyVar: 80 + Math.random() * 15
        };
    }
    
    getMetricLabels(metric) {
        const labelSets = {
            overall: ['Overall', 'Offense', 'Defense', 'Clutch', 'Consistency', 'Strength'],
            offense: ['Scoring', 'Efficiency', 'Big Plays', 'Red Zone', 'Tempo', 'Creativity'],
            defense: ['Stops', 'Turnovers', 'Pressure', 'Coverage', 'Run Defense', 'Pass Rush'],
            clutch: ['Late Game', 'Pressure', 'Comebacks', 'Big Moments', 'Mental Tough', 'Execution'],
            consistency: ['Game-to-Game', 'Home/Away', 'Monthly', 'Variance', 'Reliability', 'Stability']
        };
        
        return labelSets[metric] || labelSets.overall;
    }
    
    getMetricValue(data, metric) {
        const valueMap = {
            overall: data.overall,
            offense: data.offense,
            defense: data.defense,
            clutch: data.clutch,
            consistency: data.consistency
        };
        
        return valueMap[metric] || data.overall;
    }
    
    generateSampleData() {
        // Pre-generate some team stats for consistency
        this.teamStats = {
            cardinals: { overall: 85, winRate: 0.62, strength: 82, consistency: 88, offense: 79, defense: 83, clutch: 90, offensiveEfficiency: 78, defensiveStops: 81, bigPlays: 85, turnovers: 74, redZone: 88, defensivePressure: 79, lateGame: 92, pressurePerf: 89, comebacks: 8, variance: 0.15, homeAway: 86, monthlyVar: 84 },
            titans: { overall: 82, winRate: 0.58, strength: 88, consistency: 79, offense: 85, defense: 77, clutch: 86, offensiveEfficiency: 83, defensiveStops: 75, bigPlays: 89, turnovers: 71, redZone: 82, defensivePressure: 73, lateGame: 85, pressurePerf: 87, comebacks: 6, variance: 0.22, homeAway: 81, monthlyVar: 77 },
            grizzlies: { overall: 87, winRate: 0.65, strength: 84, consistency: 82, offense: 88, defense: 80, clutch: 91, offensiveEfficiency: 86, defensiveStops: 78, bigPlays: 92, turnovers: 76, redZone: 85, defensivePressure: 82, lateGame: 93, pressurePerf: 90, comebacks: 9, variance: 0.18, homeAway: 89, monthlyVar: 85 },
            longhorns: { overall: 89, winRate: 0.71, strength: 86, consistency: 85, offense: 91, defense: 82, clutch: 88, offensiveEfficiency: 89, defensiveStops: 80, bigPlays: 94, turnovers: 78, redZone: 91, defensivePressure: 84, lateGame: 87, pressurePerf: 89, comebacks: 7, variance: 0.16, homeAway: 92, monthlyVar: 88 }
        };
    }
}

// Initialize Team Comparison when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.blazeComparison = new BlazeTeamComparison();
    console.log('📊 Blaze Team Comparison Tool Loaded');
});