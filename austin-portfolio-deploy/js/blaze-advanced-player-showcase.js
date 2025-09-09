/**
 * Blaze Intelligence Advanced Player Showcase
 * Enhanced player analytics with real-time comparisons and detailed metrics
 */

class BlazePlayerShowcase {
    constructor() {
        this.players = {
            'winn': {
                name: 'Masyn Winn',
                position: 'SS',
                team: 'Cardinals',
                league: 'MLB',
                age: 22,
                stats: {
                    havf: 93.5,
                    pressure: 8.9,
                    clutch: 9.2,
                    leadership: 8.8,
                    consistency: 91.2,
                    potential: 95.1
                },
                trending: 'up',
                color: '#BF5700'
            },
            'ward': {
                name: 'Cam Ward',
                position: 'QB',
                team: 'Titans',
                league: 'NFL',
                age: 22,
                stats: {
                    havf: 86.0,
                    pressure: 7.6,
                    clutch: 8.1,
                    leadership: 8.9,
                    consistency: 84.3,
                    potential: 89.7
                },
                trending: 'up',
                color: '#002244'
            },
            'morant': {
                name: 'Ja Morant',
                position: 'PG',
                team: 'Grizzlies',
                league: 'NBA',
                age: 25,
                stats: {
                    havf: 90.5,
                    pressure: 8.7,
                    clutch: 9.4,
                    leadership: 9.1,
                    consistency: 87.8,
                    potential: 93.3
                },
                trending: 'stable',
                color: '#00B2A9'
            },
            'manning': {
                name: 'Arch Manning',
                position: 'QB',
                team: 'Longhorns',
                league: 'NCAA',
                age: 19,
                stats: {
                    havf: 91.0,
                    pressure: 8.7,
                    clutch: 8.9,
                    leadership: 9.3,
                    consistency: 89.1,
                    potential: 96.8
                },
                trending: 'up',
                color: '#9BCBEB'
            }
        };
        
        this.currentComparison = [];
        this.initialize();
    }
    
    initialize() {
        this.createPlayerShowcaseSection();
        this.createComparisonInterface();
        this.startRealTimeUpdates();
        this.bindEvents();
    }
    
    createPlayerShowcaseSection() {
        // Check if showcase already exists
        if (document.getElementById('player-showcase')) return;
        
        const showcaseSection = document.createElement('section');
        showcaseSection.id = 'player-showcase';
        showcaseSection.className = 'section';
        showcaseSection.innerHTML = `
            <div class="section-header">
                <div class="section-badge">Elite Athletes</div>
                <h2 class="section-title">Featured Player Analytics</h2>
                <p class="section-subtitle">
                    Real-time performance tracking of championship-caliber athletes across all major sports
                </p>
            </div>
            
            <div class="player-showcase-grid">
                ${Object.keys(this.players).map(playerId => this.createPlayerCard(playerId)).join('')}
            </div>
            
            <div class="comparison-interface" id="player-comparison">
                <div class="comparison-header">
                    <h3 style="color: var(--burnt-orange); font-size: 1.5rem; margin-bottom: 1rem;">Player Comparison Tool</h3>
                    <p style="color: var(--platinum); opacity: 0.8; margin-bottom: 2rem;">Select up to 3 players to compare their performance metrics</p>
                </div>
                <div class="comparison-results" id="comparison-results"></div>
            </div>
        `;
        
        // Insert after analytics section
        const analyticsSection = document.getElementById('analytics');
        analyticsSection.parentNode.insertBefore(showcaseSection, analyticsSection.nextSibling);
        
        this.addShowcaseStyles();
    }
    
    createPlayerCard(playerId) {
        const player = this.players[playerId];
        return `
            <div class="player-showcase-card" data-player-id="${playerId}">
                <div class="player-header">
                    <div class="player-avatar">
                        <div class="player-initials" style="background: ${player.color};">
                            ${player.name.split(' ').map(n => n[0]).join('')}
                        </div>
                    </div>
                    <div class="player-info">
                        <h3 class="player-name">${player.name}</h3>
                        <div class="player-details">
                            <span class="player-position">${player.position}</span>
                            <span class="player-team">${player.team}</span>
                            <span class="player-league">${player.league}</span>
                        </div>
                    </div>
                    <div class="player-trending">
                        <span class="trending-indicator ${player.trending}">
                            ${player.trending === 'up' ? '↗' : player.trending === 'down' ? '↘' : '→'}
                        </span>
                    </div>
                </div>
                
                <div class="player-metrics">
                    <div class="metric-row">
                        <span class="metric-label">HAVF Score</span>
                        <span class="metric-value" id="${playerId}-havf-display">${player.stats.havf}</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Pressure Index</span>
                        <span class="metric-value" id="${playerId}-pressure-display">${player.stats.pressure}/10</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Clutch Factor</span>
                        <span class="metric-value" id="${playerId}-clutch-display">${player.stats.clutch}/10</span>
                    </div>
                    <div class="metric-row">
                        <span class="metric-label">Leadership</span>
                        <span class="metric-value" id="${playerId}-leadership-display">${player.stats.leadership}/10</span>
                    </div>
                </div>
                
                <div class="player-radar-mini">
                    <canvas id="${playerId}-radar" width="200" height="200"></canvas>
                </div>
                
                <div class="player-actions">
                    <button class="compare-btn" data-player-id="${playerId}">
                        <span class="compare-text">Compare</span>
                        <span class="compare-check" style="display: none;">✓ Selected</span>
                    </button>
                    <button class="details-btn" data-player-id="${playerId}">View Details</button>
                </div>
            </div>
        `;
    }
    
    createComparisonInterface() {
        // Comparison interface is already created in createPlayerShowcaseSection
        this.updateComparisonDisplay();
    }
    
    addShowcaseStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .player-showcase-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
                gap: 2rem;
                margin: 3rem 0;
            }
            
            .player-showcase-card {
                background: rgba(20, 20, 20, 0.8);
                border: 2px solid rgba(191, 87, 0, 0.2);
                border-radius: 20px;
                padding: 2rem;
                transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
                position: relative;
                overflow: hidden;
                backdrop-filter: blur(10px);
            }
            
            .player-showcase-card::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 4px;
                background: linear-gradient(90deg, var(--burnt-orange), var(--vancouver-teal));
                transform: scaleX(0);
                transition: transform 0.3s ease;
            }
            
            .player-showcase-card:hover::before {
                transform: scaleX(1);
            }
            
            .player-showcase-card:hover {
                transform: translateY(-10px);
                border-color: var(--burnt-orange);
                box-shadow: 0 20px 40px rgba(191, 87, 0, 0.3);
            }
            
            .player-header {
                display: flex;
                align-items: flex-start;
                margin-bottom: 2rem;
                gap: 1rem;
            }
            
            .player-avatar {
                flex-shrink: 0;
            }
            
            .player-initials {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 900;
                font-size: 1.5rem;
                box-shadow: 0 4px 15px rgba(0, 0, 0, 0.3);
            }
            
            .player-info {
                flex: 1;
            }
            
            .player-name {
                color: var(--platinum);
                font-size: 1.25rem;
                font-weight: 700;
                margin-bottom: 0.5rem;
            }
            
            .player-details {
                display: flex;
                gap: 0.75rem;
                flex-wrap: wrap;
            }
            
            .player-position,
            .player-team,
            .player-league {
                background: rgba(191, 87, 0, 0.1);
                color: var(--burnt-orange);
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                text-transform: uppercase;
            }
            
            .player-trending {
                flex-shrink: 0;
            }
            
            .trending-indicator {
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 32px;
                height: 32px;
                border-radius: 50%;
                font-size: 1.25rem;
                font-weight: 900;
            }
            
            .trending-indicator.up {
                background: rgba(16, 185, 129, 0.2);
                color: #10b981;
            }
            
            .trending-indicator.down {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
            }
            
            .trending-indicator.stable {
                background: rgba(155, 203, 235, 0.2);
                color: var(--cardinal-blue);
            }
            
            .player-metrics {
                margin-bottom: 2rem;
            }
            
            .metric-row {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem 0;
                border-bottom: 1px solid rgba(229, 228, 226, 0.1);
            }
            
            .metric-label {
                color: var(--platinum);
                opacity: 0.8;
                font-weight: 500;
            }
            
            .metric-value {
                color: var(--cardinal-blue);
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
            }
            
            .player-radar-mini {
                height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                margin-bottom: 2rem;
            }
            
            .player-actions {
                display: flex;
                gap: 1rem;
            }
            
            .compare-btn,
            .details-btn {
                flex: 1;
                padding: 0.75rem 1.5rem;
                border-radius: 8px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                border: none;
            }
            
            .compare-btn {
                background: linear-gradient(135deg, var(--burnt-orange), #D76800);
                color: white;
            }
            
            .compare-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 6px 20px rgba(191, 87, 0, 0.4);
            }
            
            .compare-btn.selected {
                background: linear-gradient(135deg, #10b981, #059669);
            }
            
            .details-btn {
                background: transparent;
                color: var(--platinum);
                border: 2px solid rgba(229, 228, 226, 0.3);
            }
            
            .details-btn:hover {
                background: rgba(229, 228, 226, 0.1);
                border-color: var(--burnt-orange);
                color: var(--burnt-orange);
            }
            
            .comparison-interface {
                background: rgba(20, 20, 20, 0.8);
                border: 2px solid rgba(155, 203, 235, 0.3);
                border-radius: 20px;
                padding: 2rem;
                margin-top: 3rem;
                backdrop-filter: blur(10px);
            }
            
            .comparison-results {
                min-height: 200px;
                display: flex;
                align-items: center;
                justify-content: center;
                color: var(--platinum);
                opacity: 0.6;
            }
            
            .comparison-chart {
                width: 100%;
                height: 400px;
                position: relative;
            }
            
            @media (max-width: 768px) {
                .player-showcase-grid {
                    grid-template-columns: 1fr;
                }
                
                .player-actions {
                    flex-direction: column;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    drawRadarChart(playerId) {
        const canvas = document.getElementById(`${playerId}-radar`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const player = this.players[playerId];
        const center = { x: 100, y: 100 };
        const radius = 80;
        
        // Clear canvas
        ctx.clearRect(0, 0, 200, 200);
        
        // Draw background circles
        ctx.strokeStyle = 'rgba(229, 228, 226, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(center.x, center.y, (radius * i) / 5, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        // Draw axes
        const metrics = ['havf', 'pressure', 'clutch', 'leadership', 'consistency', 'potential'];
        const angles = metrics.map((_, i) => (i * 2 * Math.PI) / metrics.length - Math.PI / 2);
        
        ctx.strokeStyle = 'rgba(229, 228, 226, 0.2)';
        angles.forEach(angle => {
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(
                center.x + Math.cos(angle) * radius,
                center.y + Math.sin(angle) * radius
            );
            ctx.stroke();
        });
        
        // Draw data polygon
        ctx.fillStyle = player.color + '20';
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 2;
        
        ctx.beginPath();
        angles.forEach((angle, i) => {
            const metric = metrics[i];
            const value = player.stats[metric] / 10; // Normalize to 0-1
            const x = center.x + Math.cos(angle) * radius * value;
            const y = center.y + Math.sin(angle) * radius * value;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    bindEvents() {
        // Compare button events
        document.addEventListener('click', (e) => {
            if (e.target.closest('.compare-btn')) {
                const btn = e.target.closest('.compare-btn');
                const playerId = btn.dataset.playerId;
                this.togglePlayerComparison(playerId);
            }
            
            if (e.target.closest('.details-btn')) {
                const btn = e.target.closest('.details-btn');
                const playerId = btn.dataset.playerId;
                this.showPlayerDetails(playerId);
            }
        });
    }
    
    togglePlayerComparison(playerId) {
        const btn = document.querySelector(`[data-player-id="${playerId}"].compare-btn`);
        
        if (this.currentComparison.includes(playerId)) {
            // Remove from comparison
            this.currentComparison = this.currentComparison.filter(id => id !== playerId);
            btn.classList.remove('selected');
            btn.querySelector('.compare-text').style.display = 'inline';
            btn.querySelector('.compare-check').style.display = 'none';
        } else if (this.currentComparison.length < 3) {
            // Add to comparison
            this.currentComparison.push(playerId);
            btn.classList.add('selected');
            btn.querySelector('.compare-text').style.display = 'none';
            btn.querySelector('.compare-check').style.display = 'inline';
        }
        
        this.updateComparisonDisplay();
    }
    
    updateComparisonDisplay() {
        const resultsContainer = document.getElementById('comparison-results');
        
        if (this.currentComparison.length === 0) {
            resultsContainer.innerHTML = '<p>Select players above to begin comparison analysis</p>';
            return;
        }
        
        if (this.currentComparison.length === 1) {
            resultsContainer.innerHTML = '<p>Select at least one more player to compare</p>';
            return;
        }
        
        // Create comparison chart
        resultsContainer.innerHTML = `
            <div class="comparison-chart">
                <canvas id="comparison-radar-chart" width="600" height="400"></canvas>
            </div>
            <div class="comparison-stats">
                ${this.generateComparisonStats()}
            </div>
        `;
        
        this.drawComparisonChart();
    }
    
    generateComparisonStats() {
        const metrics = ['havf', 'pressure', 'clutch', 'leadership', 'consistency', 'potential'];
        let statsHtml = '<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 1rem; margin-top: 2rem;">';
        
        metrics.forEach(metric => {
            const metricData = this.currentComparison.map(playerId => ({
                player: this.players[playerId].name,
                value: this.players[playerId].stats[metric],
                color: this.players[playerId].color
            }));
            
            metricData.sort((a, b) => b.value - a.value);
            
            statsHtml += `
                <div style="background: rgba(0, 0, 0, 0.3); padding: 1rem; border-radius: 8px;">
                    <h4 style="color: var(--burnt-orange); margin-bottom: 1rem; text-transform: uppercase;">${metric.replace('_', ' ')}</h4>
                    ${metricData.map((item, index) => `
                        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                            <span style="color: ${item.color};">${index + 1}. ${item.player}</span>
                            <span style="color: var(--cardinal-blue); font-weight: 700;">${item.value.toFixed(1)}</span>
                        </div>
                    `).join('')}
                </div>
            `;
        });
        
        statsHtml += '</div>';
        return statsHtml;
    }
    
    drawComparisonChart() {
        const canvas = document.getElementById('comparison-radar-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const center = { x: 300, y: 200 };
        const radius = 150;
        
        // Clear canvas
        ctx.clearRect(0, 0, 600, 400);
        
        // Draw background
        ctx.strokeStyle = 'rgba(229, 228, 226, 0.1)';
        ctx.lineWidth = 1;
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(center.x, center.y, (radius * i) / 5, 0, 2 * Math.PI);
            ctx.stroke();
        }
        
        // Draw axes and labels
        const metrics = ['HAVF', 'Pressure', 'Clutch', 'Leadership', 'Consistency', 'Potential'];
        const angles = metrics.map((_, i) => (i * 2 * Math.PI) / metrics.length - Math.PI / 2);
        
        ctx.strokeStyle = 'rgba(229, 228, 226, 0.2)';
        ctx.fillStyle = 'rgba(229, 228, 226, 0.8)';
        ctx.font = '12px Inter';
        ctx.textAlign = 'center';
        
        angles.forEach((angle, i) => {
            // Draw axis line
            ctx.strokeStyle = 'rgba(229, 228, 226, 0.2)';
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(
                center.x + Math.cos(angle) * radius,
                center.y + Math.sin(angle) * radius
            );
            ctx.stroke();
            
            // Draw label
            ctx.fillStyle = 'rgba(229, 228, 226, 0.8)';
            const labelX = center.x + Math.cos(angle) * (radius + 20);
            const labelY = center.y + Math.sin(angle) * (radius + 20);
            ctx.fillText(metrics[i], labelX, labelY);
        });
        
        // Draw player data
        this.currentComparison.forEach((playerId, playerIndex) => {
            const player = this.players[playerId];
            const metricsValues = ['havf', 'pressure', 'clutch', 'leadership', 'consistency', 'potential'];
            
            ctx.strokeStyle = player.color;
            ctx.fillStyle = player.color + '20';
            ctx.lineWidth = 3;
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            
            ctx.beginPath();
            angles.forEach((angle, i) => {
                const metric = metricsValues[i];
                const value = player.stats[metric] / 10; // Normalize to 0-1
                const x = center.x + Math.cos(angle) * radius * value;
                const y = center.y + Math.sin(angle) * radius * value;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            });
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
        });
        
        // Draw legend
        this.currentComparison.forEach((playerId, index) => {
            const player = this.players[playerId];
            const legendY = 350 + (index * 20);
            
            ctx.fillStyle = player.color;
            ctx.fillRect(20, legendY, 15, 15);
            
            ctx.fillStyle = 'rgba(229, 228, 226, 0.9)';
            ctx.font = '14px Inter';
            ctx.textAlign = 'left';
            ctx.fillText(player.name, 45, legendY + 12);
        });
    }
    
    showPlayerDetails(playerId) {
        const player = this.players[playerId];
        
        // Create modal overlay
        const modal = document.createElement('div');
        modal.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0, 0, 0, 0.9); z-index: 2000; display: flex; align-items: center; justify-content: center; padding: 2rem;">
                <div style="background: rgba(20, 20, 20, 0.95); border: 2px solid ${player.color}; border-radius: 20px; padding: 2rem; max-width: 600px; width: 100%; max-height: 80vh; overflow-y: auto;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                        <h2 style="color: ${player.color}; font-size: 2rem; font-weight: 900;">${player.name}</h2>
                        <button onclick="this.closest('div').parentElement.remove()" style="background: none; border: none; color: var(--platinum); font-size: 2rem; cursor: pointer;">×</button>
                    </div>
                    
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                        <div>
                            <h3 style="color: var(--burnt-orange); margin-bottom: 1rem;">Player Info</h3>
                            <div style="color: var(--platinum);">
                                <p><strong>Position:</strong> ${player.position}</p>
                                <p><strong>Team:</strong> ${player.team}</p>
                                <p><strong>League:</strong> ${player.league}</p>
                                <p><strong>Age:</strong> ${player.age}</p>
                                <p><strong>Trending:</strong> ${player.trending}</p>
                            </div>
                        </div>
                        <div>
                            <h3 style="color: var(--burnt-orange); margin-bottom: 1rem;">Performance Metrics</h3>
                            <div style="color: var(--platinum);">
                                <p><strong>HAVF Score:</strong> ${player.stats.havf}</p>
                                <p><strong>Pressure Index:</strong> ${player.stats.pressure}/10</p>
                                <p><strong>Clutch Factor:</strong> ${player.stats.clutch}/10</p>
                                <p><strong>Leadership:</strong> ${player.stats.leadership}/10</p>
                                <p><strong>Consistency:</strong> ${player.stats.consistency}%</p>
                                <p><strong>Potential:</strong> ${player.stats.potential}%</p>
                            </div>
                        </div>
                    </div>
                    
                    <div style="height: 300px; display: flex; align-items: center; justify-content: center;">
                        <canvas id="detail-radar-${playerId}" width="400" height="300"></canvas>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Draw detailed radar chart
        setTimeout(() => this.drawDetailedRadar(playerId), 100);
    }
    
    drawDetailedRadar(playerId) {
        const canvas = document.getElementById(`detail-radar-${playerId}`);
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const player = this.players[playerId];
        const center = { x: 200, y: 150 };
        const radius = 100;
        
        // Similar to radar chart but larger and more detailed
        this.drawRadarChartDetailed(ctx, player, center, radius);
    }
    
    drawRadarChartDetailed(ctx, player, center, radius) {
        // Clear canvas
        ctx.clearRect(0, 0, 400, 300);
        
        // Draw background circles with labels
        ctx.strokeStyle = 'rgba(229, 228, 226, 0.2)';
        ctx.fillStyle = 'rgba(229, 228, 226, 0.5)';
        ctx.font = '10px Inter';
        ctx.textAlign = 'center';
        ctx.lineWidth = 1;
        
        for (let i = 1; i <= 5; i++) {
            ctx.beginPath();
            ctx.arc(center.x, center.y, (radius * i) / 5, 0, 2 * Math.PI);
            ctx.stroke();
            
            // Label at top
            ctx.fillText((i * 2).toString(), center.x, center.y - (radius * i) / 5 - 5);
        }
        
        // Draw axes and labels
        const metrics = ['HAVF', 'Pressure', 'Clutch', 'Leadership', 'Consistency', 'Potential'];
        const metricsValues = ['havf', 'pressure', 'clutch', 'leadership', 'consistency', 'potential'];
        const angles = metrics.map((_, i) => (i * 2 * Math.PI) / metrics.length - Math.PI / 2);
        
        ctx.strokeStyle = 'rgba(229, 228, 226, 0.3)';
        ctx.fillStyle = 'rgba(229, 228, 226, 0.9)';
        ctx.font = 'bold 12px Inter';
        
        angles.forEach((angle, i) => {
            // Draw axis line
            ctx.beginPath();
            ctx.moveTo(center.x, center.y);
            ctx.lineTo(
                center.x + Math.cos(angle) * radius,
                center.y + Math.sin(angle) * radius
            );
            ctx.stroke();
            
            // Draw label
            const labelX = center.x + Math.cos(angle) * (radius + 30);
            const labelY = center.y + Math.sin(angle) * (radius + 30);
            ctx.fillText(metrics[i], labelX, labelY);
            
            // Draw value
            const value = player.stats[metricsValues[i]];
            const valueX = center.x + Math.cos(angle) * (radius + 50);
            const valueY = center.y + Math.sin(angle) * (radius + 50);
            ctx.fillStyle = player.color;
            ctx.fillText(value.toFixed(1), valueX, valueY);
            ctx.fillStyle = 'rgba(229, 228, 226, 0.9)';
        });
        
        // Draw data polygon
        ctx.fillStyle = player.color + '30';
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 3;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        
        ctx.beginPath();
        angles.forEach((angle, i) => {
            const metric = metricsValues[i];
            const value = player.stats[metric] / 10; // Normalize to 0-1
            const x = center.x + Math.cos(angle) * radius * value;
            const y = center.y + Math.sin(angle) * radius * value;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
            
            // Draw point
            ctx.save();
            ctx.fillStyle = player.color;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fill();
            ctx.restore();
        });
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
    }
    
    startRealTimeUpdates() {
        // Draw all radar charts initially
        setTimeout(() => {
            Object.keys(this.players).forEach(playerId => {
                this.drawRadarChart(playerId);
            });
        }, 500);
        
        // Update player stats periodically
        setInterval(() => {
            this.updatePlayerStats();
        }, 8000);
    }
    
    updatePlayerStats() {
        Object.keys(this.players).forEach(playerId => {
            const player = this.players[playerId];
            
            // Slight random variations to simulate real-time updates
            Object.keys(player.stats).forEach(stat => {
                const variance = 0.3;
                const change = (Math.random() - 0.5) * variance;
                player.stats[stat] = Math.max(0, Math.min(10, player.stats[stat] + change));
            });
            
            // Update display elements
            const havfEl = document.getElementById(`${playerId}-havf-display`);
            if (havfEl) havfEl.textContent = player.stats.havf.toFixed(1);
            
            const pressureEl = document.getElementById(`${playerId}-pressure-display`);
            if (pressureEl) pressureEl.textContent = `${player.stats.pressure.toFixed(1)}/10`;
            
            const clutchEl = document.getElementById(`${playerId}-clutch-display`);
            if (clutchEl) clutchEl.textContent = `${player.stats.clutch.toFixed(1)}/10`;
            
            const leadershipEl = document.getElementById(`${playerId}-leadership-display`);
            if (leadershipEl) leadershipEl.textContent = `${player.stats.leadership.toFixed(1)}/10`;
            
            // Redraw radar chart
            this.drawRadarChart(playerId);
        });
        
        // Update comparison if active
        if (this.currentComparison.length > 1) {
            this.drawComparisonChart();
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.blazePlayerShowcase = new BlazePlayerShowcase();
    console.log('🏆 Blaze Player Showcase initialized');
});