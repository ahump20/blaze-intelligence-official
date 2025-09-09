/**
 * Blaze Intelligence Enhanced Data Visualizations
 * Advanced charts and interactive data displays for sports analytics
 */

class BlazeEnhancedVisualizations {
    constructor() {
        this.chartInstances = {};
        this.animationQueue = [];
        this.isAnimating = false;
        
        this.initialize();
    }
    
    initialize() {
        this.createVisualizationSections();
        this.setupAdvancedCharts();
        this.startRealTimeUpdates();
        this.bindInteractionEvents();
    }
    
    createVisualizationSections() {
        // Add enhanced visualizations after features section
        const featuresSection = document.getElementById('features');
        if (!featuresSection) return;
        
        const visualSection = document.createElement('section');
        visualSection.id = 'enhanced-visuals';
        visualSection.className = 'section';
        visualSection.innerHTML = `
            <div class="section-header">
                <div class="section-badge">Data Intelligence</div>
                <h2 class="section-title">Championship-Level Analytics</h2>
                <p class="section-subtitle">
                    Real-time performance insights powered by advanced AI algorithms and predictive modeling
                </p>
            </div>
            
            <div class="visualization-dashboard">
                <div class="chart-grid">
                    <div class="chart-panel large">
                        <div class="chart-header">
                            <h3>Performance Trajectory Analysis</h3>
                            <div class="chart-controls">
                                <select id="trajectory-timeframe">
                                    <option value="7d">Last 7 Days</option>
                                    <option value="30d" selected>Last 30 Days</option>
                                    <option value="season">Season</option>
                                </select>
                                <button id="trajectory-refresh" class="refresh-btn">⟳</button>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="trajectory-chart" width="800" height="400"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-panel">
                        <div class="chart-header">
                            <h3>Pressure Analytics</h3>
                            <div class="status-indicator live"></div>
                        </div>
                        <div class="chart-container">
                            <canvas id="pressure-heatmap" width="400" height="300"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-panel">
                        <div class="chart-header">
                            <h3>Team Chemistry Index</h3>
                            <div class="metric-badge">94.2%</div>
                        </div>
                        <div class="chemistry-visualization">
                            <div class="chemistry-nodes" id="chemistry-nodes"></div>
                        </div>
                    </div>
                    
                    <div class="chart-panel large">
                        <div class="chart-header">
                            <h3>Predictive Win Probability</h3>
                            <div class="confidence-meter">
                                <span>Confidence: </span>
                                <span id="prediction-confidence">96.8%</span>
                            </div>
                        </div>
                        <div class="chart-container">
                            <canvas id="prediction-chart" width="600" height="300"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-panel">
                        <div class="chart-header">
                            <h3>Momentum Tracker</h3>
                            <div class="momentum-arrow" id="momentum-arrow">↗</div>
                        </div>
                        <div class="momentum-gauge">
                            <canvas id="momentum-gauge" width="300" height="300"></canvas>
                        </div>
                    </div>
                    
                    <div class="chart-panel">
                        <div class="chart-header">
                            <h3>Injury Risk Assessment</h3>
                            <div class="risk-level low">Low Risk</div>
                        </div>
                        <div class="risk-matrix">
                            <canvas id="risk-matrix" width="300" height="200"></canvas>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        featuresSection.parentNode.insertBefore(visualSection, featuresSection.nextSibling);
        this.addVisualizationStyles();
    }
    
    addVisualizationStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .visualization-dashboard {
                background: rgba(10, 10, 10, 0.8);
                border-radius: 20px;
                padding: 2rem;
                margin: 2rem 0;
                border: 1px solid rgba(191, 87, 0, 0.2);
                backdrop-filter: blur(15px);
            }
            
            .chart-grid {
                display: grid;
                grid-template-columns: repeat(12, 1fr);
                gap: 1.5rem;
                grid-auto-rows: 350px;
            }
            
            .chart-panel {
                background: rgba(20, 20, 20, 0.8);
                border: 1px solid rgba(155, 203, 235, 0.2);
                border-radius: 16px;
                padding: 1.5rem;
                grid-column: span 6;
                transition: all 0.3s ease;
                position: relative;
                overflow: hidden;
            }
            
            .chart-panel.large {
                grid-column: span 12;
            }
            
            .chart-panel:hover {
                transform: translateY(-5px);
                border-color: var(--burnt-orange);
                box-shadow: 0 15px 35px rgba(191, 87, 0, 0.2);
            }
            
            .chart-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(229, 228, 226, 0.1);
            }
            
            .chart-header h3 {
                color: var(--platinum);
                font-size: 1.125rem;
                font-weight: 700;
                margin: 0;
            }
            
            .chart-controls {
                display: flex;
                align-items: center;
                gap: 0.75rem;
            }
            
            .chart-controls select {
                background: rgba(0, 0, 0, 0.5);
                color: var(--platinum);
                border: 1px solid rgba(191, 87, 0, 0.3);
                border-radius: 6px;
                padding: 0.5rem;
                font-size: 0.875rem;
            }
            
            .refresh-btn {
                background: linear-gradient(135deg, var(--burnt-orange), #D76800);
                color: white;
                border: none;
                border-radius: 6px;
                padding: 0.5rem;
                cursor: pointer;
                transition: transform 0.2s ease;
            }
            
            .refresh-btn:hover {
                transform: rotate(180deg);
            }
            
            .status-indicator {
                width: 12px;
                height: 12px;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            .status-indicator.live {
                background: #10b981;
                box-shadow: 0 0 10px rgba(16, 185, 129, 0.5);
            }
            
            .metric-badge {
                background: linear-gradient(135deg, var(--vancouver-teal), #059669);
                color: white;
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 700;
                font-family: 'JetBrains Mono', monospace;
            }
            
            .confidence-meter {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                color: var(--cardinal-blue);
                font-weight: 600;
            }
            
            .momentum-arrow {
                font-size: 1.5rem;
                color: #10b981;
                animation: bounce 1.5s ease-in-out infinite;
            }
            
            .risk-level {
                padding: 0.25rem 0.75rem;
                border-radius: 20px;
                font-size: 0.875rem;
                font-weight: 700;
                text-transform: uppercase;
            }
            
            .risk-level.low {
                background: rgba(16, 185, 129, 0.2);
                color: #10b981;
            }
            
            .risk-level.medium {
                background: rgba(245, 158, 11, 0.2);
                color: #f59e0b;
            }
            
            .risk-level.high {
                background: rgba(239, 68, 68, 0.2);
                color: #ef4444;
            }
            
            .chart-container {
                height: calc(100% - 80px);
                display: flex;
                align-items: center;
                justify-content: center;
                position: relative;
            }
            
            .chemistry-visualization,
            .momentum-gauge,
            .risk-matrix {
                height: calc(100% - 80px);
                position: relative;
            }
            
            .chemistry-nodes {
                position: relative;
                width: 100%;
                height: 100%;
                overflow: hidden;
            }
            
            .chemistry-node {
                position: absolute;
                width: 40px;
                height: 40px;
                border-radius: 50%;
                background: linear-gradient(135deg, var(--burnt-orange), var(--vancouver-teal));
                display: flex;
                align-items: center;
                justify-content: center;
                color: white;
                font-weight: 700;
                font-size: 0.875rem;
                animation: float 3s ease-in-out infinite;
                cursor: pointer;
                transition: transform 0.3s ease;
            }
            
            .chemistry-node:hover {
                transform: scale(1.2);
            }
            
            .chemistry-connection {
                position: absolute;
                height: 2px;
                background: linear-gradient(90deg, var(--cardinal-blue), var(--vancouver-teal));
                opacity: 0.6;
                animation: pulse 2s infinite;
            }
            
            @keyframes bounce {
                0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
                40% { transform: translateY(-10px); }
                60% { transform: translateY(-5px); }
            }
            
            @keyframes float {
                0%, 100% { transform: translateY(0px); }
                50% { transform: translateY(-10px); }
            }
            
            @media (max-width: 1024px) {
                .chart-grid {
                    grid-template-columns: repeat(6, 1fr);
                }
                
                .chart-panel {
                    grid-column: span 6;
                }
                
                .chart-panel.large {
                    grid-column: span 6;
                }
            }
            
            @media (max-width: 768px) {
                .chart-grid {
                    grid-template-columns: 1fr;
                    grid-auto-rows: 300px;
                }
                
                .chart-panel,
                .chart-panel.large {
                    grid-column: span 1;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    setupAdvancedCharts() {
        this.createTrajectoryChart();
        this.createPressureHeatmap();
        this.createChemistryVisualization();
        this.createPredictionChart();
        this.createMomentumGauge();
        this.createRiskMatrix();
    }
    
    createTrajectoryChart() {
        const canvas = document.getElementById('trajectory-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        // Generate sample trajectory data
        const days = Array.from({length: 30}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (29 - i));
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const performanceData = this.generatePerformanceTrajectory(30);
        const predictionData = this.generatePredictionTrajectory(30);
        
        this.chartInstances.trajectory = new Chart(ctx, {
            type: 'line',
            data: {
                labels: days,
                datasets: [
                    {
                        label: 'Actual Performance',
                        data: performanceData,
                        borderColor: '#BF5700',
                        backgroundColor: 'rgba(191, 87, 0, 0.1)',
                        tension: 0.4,
                        fill: true,
                        pointBackgroundColor: '#BF5700',
                        pointBorderWidth: 2,
                        pointRadius: 4
                    },
                    {
                        label: 'AI Prediction',
                        data: predictionData,
                        borderColor: '#9BCBEB',
                        backgroundColor: 'rgba(155, 203, 235, 0.05)',
                        tension: 0.4,
                        fill: false,
                        borderDash: [5, 5],
                        pointBackgroundColor: '#9BCBEB',
                        pointBorderWidth: 2,
                        pointRadius: 3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        labels: {
                            color: '#E5E4E2',
                            font: { family: 'Inter', weight: '600' }
                        }
                    },
                    tooltip: {
                        backgroundColor: 'rgba(20, 20, 20, 0.95)',
                        titleColor: '#BF5700',
                        bodyColor: '#E5E4E2',
                        borderColor: '#BF5700',
                        borderWidth: 1
                    }
                },
                scales: {
                    x: {
                        grid: { color: 'rgba(229, 228, 226, 0.1)' },
                        ticks: { color: '#E5E4E2', font: { size: 11 } }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        grid: { color: 'rgba(229, 228, 226, 0.1)' },
                        ticks: { 
                            color: '#E5E4E2',
                            font: { size: 11 },
                            callback: (value) => value + '%'
                        }
                    }
                },
                animation: {
                    duration: 2000,
                    easing: 'easeInOutCubic'
                }
            }
        });
    }
    
    createPressureHeatmap() {
        const canvas = document.getElementById('pressure-heatmap');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        const width = 400;
        const height = 300;
        
        // Create pressure heatmap visualization
        this.drawHeatmap(ctx, width, height);
        
        // Animate heatmap updates
        setInterval(() => this.updateHeatmap(ctx, width, height), 3000);
    }
    
    drawHeatmap(ctx, width, height) {
        const gridSize = 20;
        const rows = Math.floor(height / gridSize);
        const cols = Math.floor(width / gridSize);
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const intensity = Math.random();
                const hue = 220 - (intensity * 60); // Blue to red
                const saturation = 70 + (intensity * 30);
                const lightness = 30 + (intensity * 40);
                
                ctx.fillStyle = `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                ctx.fillRect(col * gridSize, row * gridSize, gridSize - 1, gridSize - 1);
            }
        }
        
        // Add overlay text
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, height - 40, width, 40);
        
        ctx.fillStyle = '#E5E4E2';
        ctx.font = 'bold 14px Inter';
        ctx.textAlign = 'center';
        ctx.fillText('High Pressure Situations', width / 2, height - 20);
    }
    
    updateHeatmap(ctx, width, height) {
        this.drawHeatmap(ctx, width, height);
    }
    
    createChemistryVisualization() {
        const container = document.getElementById('chemistry-nodes');
        if (!container) return;
        
        const players = [
            { name: 'MW', pos: 'SS', x: 50, y: 50 },
            { name: 'CW', pos: 'QB', x: 150, y: 80 },
            { name: 'JM', pos: 'PG', x: 100, y: 130 },
            { name: 'AM', pos: 'QB', x: 200, y: 100 }
        ];
        
        // Create player nodes
        players.forEach((player, index) => {
            const node = document.createElement('div');
            node.className = 'chemistry-node';
            node.style.left = `${player.x}px`;
            node.style.top = `${player.y}px`;
            node.style.animationDelay = `${index * 0.5}s`;
            node.textContent = player.name;
            node.title = `${player.name} - ${player.pos}`;
            container.appendChild(node);
        });
        
        // Create connections
        this.createChemistryConnections(container, players);
        
        // Update chemistry periodically
        setInterval(() => this.updateChemistry(container), 5000);
    }
    
    createChemistryConnections(container, players) {
        const connections = [
            [0, 1], [1, 2], [2, 3], [0, 2], [1, 3]
        ];
        
        connections.forEach(([from, to]) => {
            const connection = document.createElement('div');
            connection.className = 'chemistry-connection';
            
            const fromPlayer = players[from];
            const toPlayer = players[to];
            
            const dx = toPlayer.x - fromPlayer.x;
            const dy = toPlayer.y - fromPlayer.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const angle = Math.atan2(dy, dx) * 180 / Math.PI;
            
            connection.style.width = `${distance}px`;
            connection.style.left = `${fromPlayer.x + 20}px`;
            connection.style.top = `${fromPlayer.y + 20}px`;
            connection.style.transform = `rotate(${angle}deg)`;
            connection.style.transformOrigin = '0 50%';
            
            container.appendChild(connection);
        });
    }
    
    updateChemistry(container) {
        const badge = container.closest('.chart-panel').querySelector('.metric-badge');
        if (badge) {
            const newValue = 90 + Math.random() * 8;
            badge.textContent = `${newValue.toFixed(1)}%`;
        }
    }
    
    createPredictionChart() {
        const canvas = document.getElementById('prediction-chart');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        const gameMinutes = Array.from({length: 90}, (_, i) => i + 1);
        const winProbability = this.generateWinProbability(90);
        
        this.chartInstances.prediction = new Chart(ctx, {
            type: 'line',
            data: {
                labels: gameMinutes.filter((_, i) => i % 10 === 0),
                datasets: [{
                    label: 'Win Probability',
                    data: winProbability.filter((_, i) => i % 10 === 0),
                    borderColor: '#00B2A9',
                    backgroundColor: 'rgba(0, 178, 169, 0.2)',
                    tension: 0.3,
                    fill: true,
                    pointBackgroundColor: '#00B2A9',
                    pointBorderColor: '#ffffff',
                    pointBorderWidth: 2,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        backgroundColor: 'rgba(20, 20, 20, 0.95)',
                        titleColor: '#00B2A9',
                        bodyColor: '#E5E4E2'
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Game Time (minutes)', color: '#E5E4E2' },
                        grid: { color: 'rgba(229, 228, 226, 0.1)' },
                        ticks: { color: '#E5E4E2' }
                    },
                    y: {
                        min: 0,
                        max: 100,
                        title: { display: true, text: 'Win Probability (%)', color: '#E5E4E2' },
                        grid: { color: 'rgba(229, 228, 226, 0.1)' },
                        ticks: { 
                            color: '#E5E4E2',
                            callback: (value) => value + '%'
                        }
                    }
                }
            }
        });
    }
    
    createMomentumGauge() {
        const canvas = document.getElementById('momentum-gauge');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        this.drawMomentumGauge(ctx, 75); // 75% momentum
        
        // Update gauge periodically
        setInterval(() => {
            const momentum = 50 + Math.random() * 40;
            this.drawMomentumGauge(ctx, momentum);
            this.updateMomentumArrow(momentum);
        }, 4000);
    }
    
    drawMomentumGauge(ctx, momentum) {
        const centerX = 150;
        const centerY = 150;
        const radius = 100;
        
        // Clear canvas
        ctx.clearRect(0, 0, 300, 300);
        
        // Draw gauge background
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, 2 * Math.PI);
        ctx.strokeStyle = 'rgba(229, 228, 226, 0.2)';
        ctx.lineWidth = 20;
        ctx.stroke();
        
        // Draw momentum arc
        const momentumAngle = Math.PI + (momentum / 100) * Math.PI;
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, Math.PI, momentumAngle);
        
        const gradient = ctx.createLinearGradient(50, 150, 250, 150);
        gradient.addColorStop(0, '#ef4444');
        gradient.addColorStop(0.5, '#f59e0b');
        gradient.addColorStop(1, '#10b981');
        
        ctx.strokeStyle = gradient;
        ctx.lineWidth = 20;
        ctx.lineCap = 'round';
        ctx.stroke();
        
        // Draw center text
        ctx.fillStyle = '#E5E4E2';
        ctx.font = 'bold 24px Inter';
        ctx.textAlign = 'center';
        ctx.fillText(momentum.toFixed(1) + '%', centerX, centerY + 10);
        
        ctx.font = '12px Inter';
        ctx.fillText('Momentum', centerX, centerY + 30);
    }
    
    updateMomentumArrow(momentum) {
        const arrow = document.getElementById('momentum-arrow');
        if (!arrow) return;
        
        if (momentum > 60) {
            arrow.textContent = '↗';
            arrow.style.color = '#10b981';
        } else if (momentum < 40) {
            arrow.textContent = '↘';
            arrow.style.color = '#ef4444';
        } else {
            arrow.textContent = '→';
            arrow.style.color = '#f59e0b';
        }
    }
    
    createRiskMatrix() {
        const canvas = document.getElementById('risk-matrix');
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        this.drawRiskMatrix(ctx);
        
        // Update risk assessment
        setInterval(() => this.updateRiskAssessment(), 6000);
    }
    
    drawRiskMatrix(ctx) {
        const width = 300;
        const height = 200;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw matrix grid
        const cols = 5;
        const rows = 4;
        const cellWidth = width / cols;
        const cellHeight = height / rows;
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const riskLevel = (row + col) / (rows + cols - 2);
                const hue = 120 - (riskLevel * 120); // Green to red
                
                ctx.fillStyle = `hsla(${hue}, 70%, 50%, 0.3)`;
                ctx.fillRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
                
                ctx.strokeStyle = 'rgba(229, 228, 226, 0.3)';
                ctx.strokeRect(col * cellWidth, row * cellHeight, cellWidth, cellHeight);
            }
        }
        
        // Add risk points for different players
        const riskPoints = [
            { x: 1, y: 1, player: 'MW' },
            { x: 2, y: 0, player: 'CW' },
            { x: 1, y: 1, player: 'JM' },
            { x: 0, y: 0, player: 'AM' }
        ];
        
        riskPoints.forEach(point => {
            const x = (point.x + 0.5) * cellWidth;
            const y = (point.y + 0.5) * cellHeight;
            
            ctx.fillStyle = '#BF5700';
            ctx.beginPath();
            ctx.arc(x, y, 8, 0, 2 * Math.PI);
            ctx.fill();
            
            ctx.fillStyle = 'white';
            ctx.font = 'bold 10px Inter';
            ctx.textAlign = 'center';
            ctx.fillText(point.player, x, y + 3);
        });
        
        // Add labels
        ctx.fillStyle = '#E5E4E2';
        ctx.font = '10px Inter';
        ctx.textAlign = 'left';
        ctx.fillText('Low Risk', 5, height - 5);
        ctx.textAlign = 'right';
        ctx.fillText('High Risk', width - 5, height - 5);
    }
    
    updateRiskAssessment() {
        const riskLevel = document.querySelector('.risk-level');
        if (!riskLevel) return;
        
        const risks = ['Low Risk', 'Medium Risk', 'High Risk'];
        const classes = ['low', 'medium', 'high'];
        const randomRisk = Math.floor(Math.random() * 3);
        
        riskLevel.textContent = risks[randomRisk];
        riskLevel.className = `risk-level ${classes[randomRisk]}`;
    }
    
    generatePerformanceTrajectory(days) {
        const data = [];
        let current = 75;
        
        for (let i = 0; i < days; i++) {
            current += (Math.random() - 0.5) * 5;
            current = Math.max(50, Math.min(95, current));
            data.push(current);
        }
        
        return data;
    }
    
    generatePredictionTrajectory(days) {
        const data = [];
        let current = 78;
        
        for (let i = 0; i < days; i++) {
            current += (Math.random() - 0.4) * 3;
            current = Math.max(60, Math.min(90, current));
            data.push(current);
        }
        
        return data;
    }
    
    generateWinProbability(minutes) {
        const data = [];
        let probability = 50;
        
        for (let i = 0; i < minutes; i++) {
            // Simulate game dynamics
            const gamePhase = i / minutes;
            const variance = gamePhase < 0.8 ? 3 : 8; // More variance in final minutes
            
            probability += (Math.random() - 0.5) * variance;
            probability = Math.max(10, Math.min(90, probability));
            data.push(probability);
        }
        
        return data;
    }
    
    startRealTimeUpdates() {
        // Update prediction confidence
        setInterval(() => {
            const confidence = document.getElementById('prediction-confidence');
            if (confidence) {
                const newConfidence = 94 + Math.random() * 4;
                confidence.textContent = `${newConfidence.toFixed(1)}%`;
            }
        }, 7000);
        
        // Update trajectory chart data
        setInterval(() => {
            if (this.chartInstances.trajectory) {
                const newData = this.generatePerformanceTrajectory(30);
                this.chartInstances.trajectory.data.datasets[0].data = newData;
                this.chartInstances.trajectory.update('none');
            }
        }, 15000);
    }
    
    bindInteractionEvents() {
        // Refresh button functionality
        document.addEventListener('click', (e) => {
            if (e.target.id === 'trajectory-refresh') {
                this.refreshTrajectoryChart();
            }
        });
        
        // Timeframe selector
        document.addEventListener('change', (e) => {
            if (e.target.id === 'trajectory-timeframe') {
                this.updateTrajectoryTimeframe(e.target.value);
            }
        });
    }
    
    refreshTrajectoryChart() {
        if (this.chartInstances.trajectory) {
            const newPerformanceData = this.generatePerformanceTrajectory(30);
            const newPredictionData = this.generatePredictionTrajectory(30);
            
            this.chartInstances.trajectory.data.datasets[0].data = newPerformanceData;
            this.chartInstances.trajectory.data.datasets[1].data = newPredictionData;
            this.chartInstances.trajectory.update('active');
        }
    }
    
    updateTrajectoryTimeframe(timeframe) {
        if (!this.chartInstances.trajectory) return;
        
        let days;
        switch (timeframe) {
            case '7d': days = 7; break;
            case '30d': days = 30; break;
            case 'season': days = 180; break;
            default: days = 30;
        }
        
        const newLabels = Array.from({length: days}, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (days - 1 - i));
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        });
        
        const newPerformanceData = this.generatePerformanceTrajectory(days);
        const newPredictionData = this.generatePredictionTrajectory(days);
        
        this.chartInstances.trajectory.data.labels = newLabels;
        this.chartInstances.trajectory.data.datasets[0].data = newPerformanceData;
        this.chartInstances.trajectory.data.datasets[1].data = newPredictionData;
        this.chartInstances.trajectory.update('active');
    }
}

// Initialize enhanced visualizations
document.addEventListener('DOMContentLoaded', () => {
    window.blazeEnhancedVisualizations = new BlazeEnhancedVisualizations();
    console.log('📊 Blaze Enhanced Visualizations initialized');
});