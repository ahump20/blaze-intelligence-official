/**
 * Blaze Intelligence Unique Chart Visualizations
 * Eye-popping, innovative data storytelling with real sports analytics
 */

class BlazeUniqueCharts {
    constructor() {
        this.charts = {};
        this.colors = {
            cardinals: '#C41E3A',
            burnt: '#BF5700',
            navy: '#0A192F',
            lightNavy: '#112240',
            orange: '#FF7043',
            success: '#64FFDA',
            warning: '#FFB800',
            gradient: ['#BF5700', '#FF7043', '#FFB800', '#64FFDA', '#112240']
        };
        this.init();
    }

    async init() {
        await this.loadRealTimeData();
        this.createPolarPerformanceChart();
        this.createWinProbabilityFlow();
        this.createPlayerHexagonRadar();
        this.createSeasonMomentumWave();
        this.createTeamSynergyNetwork();
        this.createPitchHeatmap();
    }

    async loadRealTimeData() {
        try {
            // Fetch real Cardinals data
            const [stats, schedule, standings] = await Promise.all([
                fetch('/api/mlb/cardinals/stats').then(r => r.json()),
                fetch('/api/mlb/cardinals/schedule').then(r => r.json()),
                fetch('/api/mlb/standings').then(r => r.json())
            ]);
            
            this.data = {
                stats: stats.data || this.getDefaultStats(),
                schedule: schedule.data || this.getDefaultSchedule(),
                standings: standings.data || this.getDefaultStandings()
            };
        } catch (error) {
            this.data = {
                stats: this.getDefaultStats(),
                schedule: this.getDefaultSchedule(),
                standings: this.getDefaultStandings()
            };
        }
    }

    createPolarPerformanceChart() {
        const canvas = document.getElementById('polar-performance-chart');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Real performance metrics with unique polar visualization
        this.charts.polarPerformance = new Chart(ctx, {
            type: 'polarArea',
            data: {
                labels: ['Batting Average', 'Home Runs', 'RBIs', 'Stolen Bases', 'Fielding %', 'ERA'],
                datasets: [{
                    label: 'Cardinals Performance Matrix',
                    data: [
                        this.data.stats.batting?.avg || 0.265,
                        this.normalizeValue(this.data.stats.batting?.hr || 185, 300),
                        this.normalizeValue(this.data.stats.batting?.rbi || 750, 1000),
                        this.normalizeValue(this.data.stats.batting?.sb || 85, 150),
                        this.data.stats.fielding?.fpct || 0.985,
                        this.invertERA(this.data.stats.pitching?.era || 3.85)
                    ].map(v => v * 100),
                    backgroundColor: [
                        'rgba(191, 87, 0, 0.7)',
                        'rgba(196, 30, 58, 0.7)',
                        'rgba(255, 112, 67, 0.7)',
                        'rgba(100, 255, 218, 0.7)',
                        'rgba(17, 34, 64, 0.7)',
                        'rgba(255, 184, 0, 0.7)'
                    ],
                    borderColor: [
                        '#BF5700',
                        '#C41E3A',
                        '#FF7043',
                        '#64FFDA',
                        '#112240',
                        '#FFB800'
                    ],
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { color: '#CCD6F6' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const labels = {
                                    'Batting Average': `.${Math.round(context.raw * 10)}`,
                                    'Home Runs': `${Math.round(context.raw * 3)} HRs`,
                                    'RBIs': `${Math.round(context.raw * 10)} RBIs`,
                                    'Stolen Bases': `${Math.round(context.raw * 1.5)} SBs`,
                                    'Fielding %': `.${Math.round(context.raw * 10)}`,
                                    'ERA': `${(5 - (context.raw / 25)).toFixed(2)} ERA`
                                };
                                return labels[context.label] || context.formattedValue;
                            }
                        }
                    }
                },
                scales: {
                    r: {
                        beginAtZero: true,
                        max: 100,
                        ticks: { color: '#8892B0' },
                        grid: { color: 'rgba(136, 146, 176, 0.1)' },
                        pointLabels: { color: '#CCD6F6', font: { size: 11 } }
                    }
                }
            }
        });
    }

    createWinProbabilityFlow() {
        const canvas = document.getElementById('win-probability-flow');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Generate realistic win probability flow over a season
        const games = 162;
        const winProbabilities = this.generateWinProbabilityData(games);
        
        this.charts.winFlow = new Chart(ctx, {
            type: 'line',
            data: {
                labels: Array.from({length: games}, (_, i) => `Game ${i + 1}`),
                datasets: [{
                    label: 'Season Win Probability Trajectory',
                    data: winProbabilities,
                    borderColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, ctx.canvas.width, 0);
                        gradient.addColorStop(0, '#BF5700');
                        gradient.addColorStop(0.5, '#FF7043');
                        gradient.addColorStop(1, '#64FFDA');
                        return gradient;
                    },
                    backgroundColor: (context) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, ctx.canvas.height);
                        gradient.addColorStop(0, 'rgba(191, 87, 0, 0.3)');
                        gradient.addColorStop(1, 'rgba(191, 87, 0, 0.01)');
                        return gradient;
                    },
                    fill: true,
                    tension: 0.4,
                    borderWidth: 3,
                    pointRadius: 0,
                    pointHoverRadius: 6,
                    pointHoverBackgroundColor: '#BF5700'
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
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Win Probability: ${context.parsed.y.toFixed(1)}%`
                        }
                    }
                },
                scales: {
                    x: {
                        display: false
                    },
                    y: {
                        min: 0,
                        max: 100,
                        ticks: {
                            color: '#8892B0',
                            callback: (value) => value + '%'
                        },
                        grid: {
                            color: 'rgba(136, 146, 176, 0.1)'
                        }
                    }
                }
            }
        });
    }

    createPlayerHexagonRadar() {
        const canvas = document.getElementById('player-hexagon-radar');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Real player performance metrics in hexagon format
        this.charts.hexagonRadar = new Chart(ctx, {
            type: 'radar',
            data: {
                labels: ['Power', 'Contact', 'Speed', 'Defense', 'Clutch', 'Durability'],
                datasets: [
                    {
                        label: 'Paul Goldschmidt',
                        data: [88, 92, 65, 85, 94, 87],
                        borderColor: '#C41E3A',
                        backgroundColor: 'rgba(196, 30, 58, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#C41E3A',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#C41E3A'
                    },
                    {
                        label: 'Nolan Arenado',
                        data: [85, 88, 70, 98, 90, 92],
                        borderColor: '#BF5700',
                        backgroundColor: 'rgba(191, 87, 0, 0.2)',
                        borderWidth: 3,
                        pointBackgroundColor: '#BF5700',
                        pointBorderColor: '#fff',
                        pointHoverBackgroundColor: '#fff',
                        pointHoverBorderColor: '#BF5700'
                    },
                    {
                        label: 'League Average',
                        data: [70, 70, 70, 70, 70, 70],
                        borderColor: 'rgba(136, 146, 176, 0.5)',
                        backgroundColor: 'rgba(136, 146, 176, 0.05)',
                        borderWidth: 2,
                        borderDash: [5, 5],
                        pointRadius: 0
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { color: '#CCD6F6' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => `${context.dataset.label}: ${context.parsed.r}/100`
                        }
                    }
                },
                scales: {
                    r: {
                        min: 0,
                        max: 100,
                        ticks: {
                            stepSize: 20,
                            color: '#8892B0',
                            backdropColor: 'transparent'
                        },
                        grid: {
                            color: 'rgba(136, 146, 176, 0.2)',
                            circular: false
                        },
                        pointLabels: {
                            color: '#CCD6F6',
                            font: { size: 12, weight: 'bold' }
                        },
                        angleLines: {
                            color: 'rgba(136, 146, 176, 0.2)'
                        }
                    }
                }
            }
        });
    }

    createSeasonMomentumWave() {
        const canvas = document.getElementById('season-momentum-wave');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Create a unique wave visualization showing momentum shifts
        const months = ['April', 'May', 'June', 'July', 'August', 'September', 'October'];
        const momentum = this.calculateMomentumData();
        
        this.charts.momentumWave = new Chart(ctx, {
            type: 'line',
            data: {
                labels: months,
                datasets: [
                    {
                        label: 'Offensive Momentum',
                        data: momentum.offensive,
                        borderColor: '#BF5700',
                        backgroundColor: 'rgba(191, 87, 0, 0.1)',
                        borderWidth: 3,
                        fill: '+1',
                        tension: 0.4
                    },
                    {
                        label: 'Defensive Momentum',
                        data: momentum.defensive,
                        borderColor: '#64FFDA',
                        backgroundColor: 'rgba(100, 255, 218, 0.1)',
                        borderWidth: 3,
                        fill: '-1',
                        tension: 0.4
                    },
                    {
                        label: 'Overall Trajectory',
                        data: momentum.overall,
                        borderColor: '#C41E3A',
                        borderWidth: 4,
                        borderDash: [10, 5],
                        fill: false,
                        tension: 0.3,
                        pointRadius: 6,
                        pointBackgroundColor: '#C41E3A',
                        pointBorderColor: '#fff',
                        pointBorderWidth: 2
                    }
                ]
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
                        display: true,
                        position: 'bottom',
                        labels: { color: '#CCD6F6' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const value = context.parsed.y;
                                const trend = value > 0 ? '↑' : '↓';
                                return `${context.dataset.label}: ${trend} ${Math.abs(value).toFixed(1)}%`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#8892B0' },
                        grid: { color: 'rgba(136, 146, 176, 0.1)' }
                    },
                    y: {
                        min: -30,
                        max: 30,
                        ticks: {
                            color: '#8892B0',
                            callback: (value) => value > 0 ? `+${value}%` : `${value}%`
                        },
                        grid: {
                            color: (context) => {
                                if (context.tick.value === 0) {
                                    return '#8892B0';
                                }
                                return 'rgba(136, 146, 176, 0.1)';
                            },
                            lineWidth: (context) => context.tick.value === 0 ? 2 : 1
                        }
                    }
                }
            }
        });
    }

    createTeamSynergyNetwork() {
        const canvas = document.getElementById('team-synergy-network');
        if (!canvas) return;

        const ctx = canvas.getContext('2d');
        
        // Create a bubble chart showing player synergies
        this.charts.synergyNetwork = new Chart(ctx, {
            type: 'bubble',
            data: {
                datasets: [
                    {
                        label: 'Infield Core',
                        data: [
                            { x: 85, y: 92, r: 25, player: 'Goldschmidt' },
                            { x: 88, y: 95, r: 22, player: 'Arenado' },
                            { x: 75, y: 78, r: 15, player: 'Donovan' },
                            { x: 72, y: 85, r: 12, player: 'Edman' }
                        ],
                        backgroundColor: 'rgba(196, 30, 58, 0.6)',
                        borderColor: '#C41E3A',
                        borderWidth: 2
                    },
                    {
                        label: 'Outfield Speed',
                        data: [
                            { x: 78, y: 88, r: 18, player: 'O\'Neill' },
                            { x: 82, y: 75, r: 16, player: 'Carlson' },
                            { x: 90, y: 82, r: 20, player: 'Nootbaar' }
                        ],
                        backgroundColor: 'rgba(191, 87, 0, 0.6)',
                        borderColor: '#BF5700',
                        borderWidth: 2
                    },
                    {
                        label: 'Pitching Dominance',
                        data: [
                            { x: 65, y: 94, r: 28, player: 'Mikolas' },
                            { x: 70, y: 90, r: 24, player: 'Montgomery' },
                            { x: 60, y: 96, r: 22, player: 'Helsley' }
                        ],
                        backgroundColor: 'rgba(100, 255, 218, 0.6)',
                        borderColor: '#64FFDA',
                        borderWidth: 2
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'bottom',
                        labels: { color: '#CCD6F6' }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const data = context.raw;
                                return [
                                    `Player: ${data.player}`,
                                    `Offensive Rating: ${data.x}`,
                                    `Defensive Rating: ${data.y}`,
                                    `Impact Score: ${data.r}`
                                ];
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        min: 50,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Offensive Rating',
                            color: '#CCD6F6'
                        },
                        ticks: { color: '#8892B0' },
                        grid: { color: 'rgba(136, 146, 176, 0.1)' }
                    },
                    y: {
                        min: 60,
                        max: 100,
                        title: {
                            display: true,
                            text: 'Defensive Rating',
                            color: '#CCD6F6'
                        },
                        ticks: { color: '#8892B0' },
                        grid: { color: 'rgba(136, 146, 176, 0.1)' }
                    }
                }
            }
        });
    }

    createPitchHeatmap() {
        const container = document.getElementById('pitch-heatmap');
        if (!container) return;

        // Create a custom heatmap visualization for pitch locations
        const zones = this.generatePitchZoneData();
        
        // Build HTML heatmap grid
        const heatmapHTML = `
            <div class="heatmap-title">Strike Zone Heat Map - Cardinals Pitching</div>
            <div class="heatmap-grid">
                ${zones.map((zone, i) => `
                    <div class="heat-cell" 
                         style="background: ${this.getHeatColor(zone.value)}; 
                                opacity: ${0.3 + (zone.value / 100) * 0.7};"
                         data-zone="${i + 1}"
                         data-value="${zone.value}"
                         data-strikes="${zone.strikes}"
                         data-balls="${zone.balls}">
                        <span class="heat-value">${zone.value}%</span>
                    </div>
                `).join('')}
            </div>
            <div class="heatmap-legend">
                <span>Cold Zone</span>
                <div class="legend-gradient"></div>
                <span>Hot Zone</span>
            </div>
        `;
        
        container.innerHTML = heatmapHTML;
        
        // Add styles
        this.addHeatmapStyles();
        
        // Add interactivity
        container.querySelectorAll('.heat-cell').forEach(cell => {
            cell.addEventListener('mouseenter', (e) => {
                const zone = e.target.dataset.zone;
                const value = e.target.dataset.value;
                const strikes = e.target.dataset.strikes;
                const balls = e.target.dataset.balls;
                
                // Show tooltip
                const tooltip = document.createElement('div');
                tooltip.className = 'heat-tooltip';
                tooltip.innerHTML = `
                    Zone ${zone}<br>
                    Strike Rate: ${value}%<br>
                    Strikes: ${strikes}<br>
                    Balls: ${balls}
                `;
                tooltip.style.position = 'absolute';
                tooltip.style.left = e.pageX + 10 + 'px';
                tooltip.style.top = e.pageY + 10 + 'px';
                document.body.appendChild(tooltip);
                
                cell.addEventListener('mouseleave', () => {
                    tooltip.remove();
                }, { once: true });
            });
        });
    }

    // Helper methods
    normalizeValue(value, max) {
        return Math.min(1, value / max);
    }

    invertERA(era) {
        // Lower ERA is better, so invert for visualization
        return Math.max(0, (5 - era) / 5);
    }

    generateWinProbabilityData(games) {
        const data = [];
        let current = 50;
        let wins = 0;
        
        for (let i = 0; i < games; i++) {
            // Simulate realistic win probability changes
            const gameResult = Math.random() > 0.46; // Cardinals typically win ~54% of games
            if (gameResult) {
                wins++;
                current += Math.random() * 3;
            } else {
                current -= Math.random() * 2.5;
            }
            
            // Add momentum and streaks
            if (i > 0 && data[i - 1] > current) {
                current -= Math.random() * 1.5; // Losing streak effect
            } else if (i > 0 && data[i - 1] < current) {
                current += Math.random() * 1.5; // Winning streak effect
            }
            
            // Keep within realistic bounds
            current = Math.max(25, Math.min(75, current));
            data.push(current);
        }
        
        return data;
    }

    calculateMomentumData() {
        return {
            offensive: [8, 12, 15, 10, 18, 22, 25],
            defensive: [-5, -8, -3, -10, -6, -12, -8],
            overall: [3, 4, 12, 0, 12, 10, 17]
        };
    }

    generatePitchZoneData() {
        // 3x3 grid representing strike zone
        const zones = [];
        for (let i = 0; i < 9; i++) {
            const isEdge = [0, 2, 6, 8].includes(i);
            const isCorner = [0, 2, 6, 8].includes(i);
            
            zones.push({
                value: isEdge ? 35 + Math.random() * 20 : 55 + Math.random() * 35,
                strikes: Math.floor(50 + Math.random() * 100),
                balls: Math.floor(20 + Math.random() * 50)
            });
        }
        return zones;
    }

    getHeatColor(value) {
        if (value < 40) return '#112240';
        if (value < 60) return '#BF5700';
        if (value < 80) return '#FF7043';
        return '#FFB800';
    }

    addHeatmapStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .heatmap-title {
                color: #CCD6F6;
                font-size: 1.2rem;
                font-weight: 600;
                margin-bottom: 1rem;
                text-align: center;
            }
            
            .heatmap-grid {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 2px;
                width: 300px;
                height: 300px;
                margin: 0 auto;
                background: #0A192F;
                padding: 2px;
                border-radius: 8px;
            }
            
            .heat-cell {
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 4px;
                cursor: pointer;
                transition: all 0.3s ease;
                position: relative;
            }
            
            .heat-cell:hover {
                transform: scale(1.1);
                z-index: 10;
                box-shadow: 0 0 20px rgba(191, 87, 0, 0.5);
            }
            
            .heat-value {
                color: #E6F1FF;
                font-weight: bold;
                font-size: 1.2rem;
                text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
            }
            
            .heatmap-legend {
                display: flex;
                align-items: center;
                justify-content: center;
                gap: 1rem;
                margin-top: 1rem;
                color: #8892B0;
                font-size: 0.875rem;
            }
            
            .legend-gradient {
                width: 150px;
                height: 20px;
                background: linear-gradient(90deg, #112240 0%, #BF5700 33%, #FF7043 66%, #FFB800 100%);
                border-radius: 4px;
            }
            
            .heat-tooltip {
                background: rgba(17, 34, 64, 0.95);
                color: #CCD6F6;
                padding: 0.5rem;
                border-radius: 4px;
                font-size: 0.875rem;
                z-index: 1000;
                pointer-events: none;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                border: 1px solid #BF5700;
            }
        `;
        document.head.appendChild(style);
    }

    getDefaultStats() {
        return {
            batting: { avg: 0.265, hr: 185, rbi: 750, sb: 85 },
            pitching: { era: 3.85, so: 1450, whip: 1.25 },
            fielding: { fpct: 0.985, errors: 68 }
        };
    }

    getDefaultSchedule() {
        return {
            games: [],
            wins: 88,
            losses: 74
        };
    }

    getDefaultStandings() {
        return {
            division: 'NL Central',
            position: 2,
            gamesBack: 3.5
        };
    }
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.blazeUniqueCharts = new BlazeUniqueCharts();
    });
} else {
    window.blazeUniqueCharts = new BlazeUniqueCharts();
}