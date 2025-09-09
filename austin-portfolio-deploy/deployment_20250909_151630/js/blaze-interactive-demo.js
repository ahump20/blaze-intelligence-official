/**
 * Blaze Intelligence Interactive Demo System
 * Provides live demo capabilities with simulated real-time data
 */

class BlazeInteractiveDemo {
    constructor() {
        this.demoData = new Map();
        this.isPlaying = false;
        this.currentScenario = 'cardinals_clutch';
        this.scenarios = this.initializeScenarios();
        this.init();
    }

    init() {
        this.setupDemoInterface();
        this.loadDemoScenarios();
        this.bindEventHandlers();
    }

    initializeScenarios() {
        return {
            cardinals_clutch: {
                title: "Cardinals Clutch Moment",
                description: "Bottom 9th, bases loaded, 2 outs - Goldschmidt at the plate",
                duration: 30000, // 30 seconds
                sport: "MLB",
                team: "Cardinals",
                player: "Paul Goldschmidt",
                situation: "High Leverage",
                keyframes: [
                    { time: 0, leverageIndex: 3.2, winProbability: 45.2, clutchFactor: 1.8, heartRate: 85 },
                    { time: 5000, leverageIndex: 3.5, winProbability: 42.1, clutchFactor: 1.9, heartRate: 92 },
                    { time: 10000, leverageIndex: 3.8, winProbability: 38.7, clutchFactor: 2.1, heartRate: 98 },
                    { time: 15000, leverageIndex: 4.1, winProbability: 35.3, clutchFactor: 2.4, heartRate: 105 },
                    { time: 20000, leverageIndex: 4.5, winProbability: 31.8, clutchFactor: 2.7, heartRate: 112 },
                    { time: 25000, leverageIndex: 4.8, winProbability: 28.4, clutchFactor: 3.1, heartRate: 118 },
                    { time: 30000, leverageIndex: 5.2, winProbability: 85.7, clutchFactor: 3.8, heartRate: 125 }
                ]
            },
            titans_fourth_quarter: {
                title: "Titans 4th Quarter Drive",
                description: "4th and 1, Titans down by 3, Henry gets the ball",
                duration: 45000,
                sport: "NFL",
                team: "Titans",
                player: "Derrick Henry",
                situation: "Goal Line",
                keyframes: [
                    { time: 0, pressureIndex: 2.1, winProbability: 35.4, momentumFactor: 1.2, heartRate: 78 },
                    { time: 10000, pressureIndex: 2.4, winProbability: 38.1, momentumFactor: 1.4, heartRate: 85 },
                    { time: 20000, pressureIndex: 2.8, winProbability: 42.6, momentumFactor: 1.7, heartRate: 92 },
                    { time: 30000, pressureIndex: 3.2, winProbability: 47.3, momentumFactor: 2.1, heartRate: 98 },
                    { time: 40000, pressureIndex: 3.6, winProbability: 52.8, momentumFactor: 2.5, heartRate: 104 },
                    { time: 45000, pressureIndex: 4.1, winProbability: 78.4, momentumFactor: 3.2, heartRate: 110 }
                ]
            },
            grizzlies_overtime: {
                title: "Grizzlies Overtime Thriller",
                description: "OT, tied game, Ja Morant brings it up court",
                duration: 35000,
                sport: "NBA",
                team: "Grizzlies",
                player: "Ja Morant",
                situation: "Overtime",
                keyframes: [
                    { time: 0, clutchRating: 2.3, winProbability: 50.0, energyLevel: 1.8, heartRate: 88 },
                    { time: 8000, clutchRating: 2.6, winProbability: 53.2, energyLevel: 2.1, heartRate: 95 },
                    { time: 16000, clutchRating: 2.9, winProbability: 56.8, energyLevel: 2.4, heartRate: 102 },
                    { time: 24000, clutchRating: 3.3, winProbability: 61.4, energyLevel: 2.8, heartRate: 108 },
                    { time: 32000, clutchRating: 3.7, winProbability: 66.7, energyLevel: 3.2, heartRate: 115 },
                    { time: 35000, clutchRating: 4.2, winProbability: 89.3, energyLevel: 3.8, heartRate: 122 }
                ]
            },
            longhorns_championship: {
                title: "Longhorns Championship Drive",
                description: "4th quarter, College Football Playoff, Ewers leads the drive",
                duration: 40000,
                sport: "NCAA",
                team: "Longhorns",
                player: "Quinn Ewers",
                situation: "Championship",
                keyframes: [
                    { time: 0, pressureRating: 1.9, winProbability: 41.3, composure: 2.1, heartRate: 82 },
                    { time: 10000, pressureRating: 2.2, winProbability: 44.8, composure: 2.3, heartRate: 89 },
                    { time: 20000, pressureRating: 2.6, winProbability: 49.2, composure: 2.6, heartRate: 96 },
                    { time: 30000, pressureRating: 3.0, winProbability: 54.7, composure: 3.0, heartRate: 103 },
                    { time: 35000, pressureRating: 3.4, winProbability: 60.1, composure: 3.4, heartRate: 109 },
                    { time: 40000, pressureRating: 3.8, winProbability: 82.6, composure: 3.9, heartRate: 116 }
                ]
            }
        };
    }

    setupDemoInterface() {
        // Create demo control panel
        const demoPanel = document.createElement('div');
        demoPanel.id = 'blaze-demo-panel';
        demoPanel.innerHTML = `
            <div class="demo-panel-content">
                <div class="demo-header">
                    <h3>🔥 Live Demo - Blaze Intelligence</h3>
                    <button id="demo-close" class="demo-close">×</button>
                </div>
                <div class="demo-controls">
                    <select id="scenario-select" class="demo-select">
                        <option value="cardinals_clutch">Cardinals Clutch Moment</option>
                        <option value="titans_fourth_quarter">Titans 4th Quarter</option>
                        <option value="grizzlies_overtime">Grizzlies Overtime</option>
                        <option value="longhorns_championship">Longhorns Championship</option>
                    </select>
                    <button id="demo-play" class="demo-btn demo-play">▶ Play Demo</button>
                    <button id="demo-pause" class="demo-btn demo-pause" style="display: none;">⏸ Pause</button>
                    <button id="demo-reset" class="demo-btn demo-reset">↻ Reset</button>
                </div>
                <div class="demo-info">
                    <div class="demo-scenario">
                        <h4 id="scenario-title">Select a scenario to begin</h4>
                        <p id="scenario-description">Choose from our live game simulations</p>
                    </div>
                    <div class="demo-metrics">
                        <div class="metric-item">
                            <span class="metric-label">Progress</span>
                            <div class="progress-bar">
                                <div id="demo-progress" class="progress-fill"></div>
                            </div>
                        </div>
                    </div>
                </div>
                <div class="demo-live-data">
                    <div class="live-metric">
                        <span class="live-label">Primary Metric</span>
                        <span id="live-primary" class="live-value">--</span>
                    </div>
                    <div class="live-metric">
                        <span class="live-label">Win Probability</span>
                        <span id="live-winprob" class="live-value">--</span>
                    </div>
                    <div class="live-metric">
                        <span class="live-label">Heart Rate</span>
                        <span id="live-heartrate" class="live-value">--</span>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(demoPanel);
        this.addDemoStyles();
    }

    addDemoStyles() {
        const styles = `
            #blaze-demo-panel {
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                width: 480px;
                max-width: 90vw;
                background: rgba(10, 10, 10, 0.98);
                border: 1px solid #BF5700;
                border-radius: 16px;
                backdrop-filter: blur(20px);
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                z-index: 10000;
                display: none;
                font-family: 'Inter', sans-serif;
            }
            
            .demo-panel-content {
                padding: 1.5rem;
            }
            
            .demo-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1.5rem;
                padding-bottom: 1rem;
                border-bottom: 1px solid rgba(191, 87, 0, 0.3);
            }
            
            .demo-header h3 {
                color: #BF5700;
                font-size: 1.25rem;
                font-weight: 700;
                margin: 0;
            }
            
            .demo-close {
                background: none;
                border: none;
                color: #E5E4E2;
                font-size: 1.5rem;
                cursor: pointer;
                padding: 0;
                width: 30px;
                height: 30px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: background 0.2s ease;
            }
            
            .demo-close:hover {
                background: rgba(191, 87, 0, 0.2);
            }
            
            .demo-controls {
                display: flex;
                gap: 0.75rem;
                margin-bottom: 1.5rem;
                flex-wrap: wrap;
            }
            
            .demo-select {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(155, 203, 235, 0.3);
                color: #E5E4E2;
                padding: 0.5rem;
                border-radius: 8px;
                font-size: 0.875rem;
                flex: 1;
                min-width: 200px;
            }
            
            .demo-btn {
                background: linear-gradient(135deg, #BF5700, #D76800);
                color: white;
                border: none;
                padding: 0.5rem 1rem;
                border-radius: 8px;
                font-size: 0.875rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                white-space: nowrap;
            }
            
            .demo-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 8px 20px rgba(191, 87, 0, 0.4);
            }
            
            .demo-btn.demo-pause {
                background: linear-gradient(135deg, #00B2A9, #00A294);
            }
            
            .demo-btn.demo-reset {
                background: linear-gradient(135deg, #36454F, #4A5A6F);
            }
            
            .demo-info {
                margin-bottom: 1.5rem;
            }
            
            .demo-scenario h4 {
                color: #9BCBEB;
                font-size: 1rem;
                font-weight: 600;
                margin: 0 0 0.5rem 0;
            }
            
            .demo-scenario p {
                color: #E5E4E2;
                opacity: 0.8;
                font-size: 0.875rem;
                margin: 0 0 1rem 0;
            }
            
            .progress-bar {
                width: 100%;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                background: linear-gradient(90deg, #BF5700, #00B2A9);
                width: 0%;
                transition: width 0.3s ease;
                border-radius: 3px;
            }
            
            .metric-item {
                margin-bottom: 1rem;
            }
            
            .metric-label {
                display: block;
                color: #E5E4E2;
                opacity: 0.7;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 0.5rem;
            }
            
            .demo-live-data {
                display: grid;
                grid-template-columns: repeat(3, 1fr);
                gap: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(229, 228, 226, 0.1);
            }
            
            .live-metric {
                text-align: center;
            }
            
            .live-label {
                display: block;
                color: #E5E4E2;
                opacity: 0.6;
                font-size: 0.75rem;
                text-transform: uppercase;
                letter-spacing: 1px;
                margin-bottom: 0.5rem;
            }
            
            .live-value {
                display: block;
                color: #BF5700;
                font-family: 'JetBrains Mono', monospace;
                font-size: 1.125rem;
                font-weight: 700;
            }
            
            @media (max-width: 540px) {
                #blaze-demo-panel {
                    width: 95vw;
                    top: 20px;
                    transform: translateX(-50%);
                    left: 50%;
                }
                
                .demo-controls {
                    flex-direction: column;
                }
                
                .demo-select {
                    min-width: auto;
                }
                
                .demo-live-data {
                    grid-template-columns: 1fr;
                }
            }
            
            /* Animation for demo panel */
            @keyframes demoFadeIn {
                from {
                    opacity: 0;
                    transform: translate(-50%, -50%) scale(0.9);
                }
                to {
                    opacity: 1;
                    transform: translate(-50%, -50%) scale(1);
                }
            }
            
            #blaze-demo-panel.show {
                display: block;
                animation: demoFadeIn 0.3s ease-out;
            }
        `;
        
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    bindEventHandlers() {
        // Demo panel controls
        document.getElementById('demo-close').addEventListener('click', () => this.closeDemo());
        document.getElementById('demo-play').addEventListener('click', () => this.playDemo());
        document.getElementById('demo-pause').addEventListener('click', () => this.pauseDemo());
        document.getElementById('demo-reset').addEventListener('click', () => this.resetDemo());
        
        document.getElementById('scenario-select').addEventListener('change', (e) => {
            this.currentScenario = e.target.value;
            this.loadScenario();
        });

        // Add demo trigger buttons to main site
        this.addDemoTriggers();
    }

    addDemoTriggers() {
        // Add "Live Demo" buttons to hero section
        const heroActions = document.querySelector('.hero-actions');
        if (heroActions) {
            const demoBtn = document.createElement('a');
            demoBtn.href = '#';
            demoBtn.className = 'btn-secondary demo-trigger';
            demoBtn.innerHTML = '🎮 Interactive Demo';
            demoBtn.addEventListener('click', (e) => {
                e.preventDefault();
                this.showDemo();
            });
            heroActions.appendChild(demoBtn);
        }

        // Add demo buttons to feature cards
        document.querySelectorAll('.feature-card').forEach((card, index) => {
            const demoBtn = document.createElement('button');
            demoBtn.className = 'demo-mini-btn';
            demoBtn.innerHTML = '▶ Demo';
            demoBtn.style.cssText = `
                background: rgba(191, 87, 0, 0.2);
                border: 1px solid rgba(191, 87, 0, 0.4);
                color: #BF5700;
                padding: 0.25rem 0.75rem;
                border-radius: 6px;
                font-size: 0.75rem;
                font-weight: 600;
                cursor: pointer;
                margin-top: 1rem;
                transition: all 0.2s ease;
            `;
            
            demoBtn.addEventListener('mouseover', () => {
                demoBtn.style.background = 'rgba(191, 87, 0, 0.3)';
                demoBtn.style.transform = 'translateY(-1px)';
            });
            
            demoBtn.addEventListener('mouseout', () => {
                demoBtn.style.background = 'rgba(191, 87, 0, 0.2)';
                demoBtn.style.transform = 'translateY(0)';
            });

            demoBtn.addEventListener('click', () => {
                const scenarios = Object.keys(this.scenarios);
                this.currentScenario = scenarios[index % scenarios.length];
                this.showDemo();
            });
            
            card.appendChild(demoBtn);
        });
    }

    showDemo() {
        const panel = document.getElementById('blaze-demo-panel');
        panel.classList.add('show');
        panel.style.display = 'block';
        this.loadScenario();
    }

    closeDemo() {
        const panel = document.getElementById('blaze-demo-panel');
        panel.classList.remove('show');
        panel.style.display = 'none';
        this.pauseDemo();
    }

    loadScenario() {
        const scenario = this.scenarios[this.currentScenario];
        if (!scenario) return;

        document.getElementById('scenario-title').textContent = scenario.title;
        document.getElementById('scenario-description').textContent = scenario.description;
        
        // Update scenario select
        document.getElementById('scenario-select').value = this.currentScenario;
        
        this.resetDemo();
    }

    playDemo() {
        if (this.isPlaying) return;
        
        this.isPlaying = true;
        document.getElementById('demo-play').style.display = 'none';
        document.getElementById('demo-pause').style.display = 'inline-block';
        
        const scenario = this.scenarios[this.currentScenario];
        if (!scenario) return;
        
        this.startTime = Date.now();
        this.demoInterval = setInterval(() => this.updateDemo(), 100);
        
        // Auto-pause when demo completes
        setTimeout(() => {
            if (this.isPlaying) {
                this.pauseDemo();
                this.showDemoComplete();
            }
        }, scenario.duration);
    }

    pauseDemo() {
        this.isPlaying = false;
        document.getElementById('demo-play').style.display = 'inline-block';
        document.getElementById('demo-pause').style.display = 'none';
        
        if (this.demoInterval) {
            clearInterval(this.demoInterval);
        }
    }

    resetDemo() {
        this.pauseDemo();
        document.getElementById('demo-progress').style.width = '0%';
        document.getElementById('live-primary').textContent = '--';
        document.getElementById('live-winprob').textContent = '--';
        document.getElementById('live-heartrate').textContent = '--';
    }

    updateDemo() {
        const scenario = this.scenarios[this.currentScenario];
        if (!scenario || !this.isPlaying) return;
        
        const elapsed = Date.now() - this.startTime;
        const progress = Math.min(elapsed / scenario.duration, 1);
        
        // Update progress bar
        document.getElementById('demo-progress').style.width = `${progress * 100}%`;
        
        // Interpolate metrics between keyframes
        const currentData = this.interpolateMetrics(scenario, elapsed);
        
        // Update live data display
        this.updateLiveMetrics(currentData, scenario.sport);
        
        // Update main dashboard if visible
        this.updateMainDashboard(currentData, scenario);
    }

    interpolateMetrics(scenario, elapsed) {
        const keyframes = scenario.keyframes;
        
        // Find the two keyframes to interpolate between
        let prevFrame = keyframes[0];
        let nextFrame = keyframes[keyframes.length - 1];
        
        for (let i = 0; i < keyframes.length - 1; i++) {
            if (elapsed >= keyframes[i].time && elapsed <= keyframes[i + 1].time) {
                prevFrame = keyframes[i];
                nextFrame = keyframes[i + 1];
                break;
            }
        }
        
        // Linear interpolation
        const frameDuration = nextFrame.time - prevFrame.time;
        const frameProgress = frameDuration > 0 ? (elapsed - prevFrame.time) / frameDuration : 0;
        
        const interpolated = {};
        Object.keys(prevFrame).forEach(key => {
            if (key !== 'time' && typeof prevFrame[key] === 'number') {
                interpolated[key] = prevFrame[key] + (nextFrame[key] - prevFrame[key]) * frameProgress;
            }
        });
        
        return interpolated;
    }

    updateLiveMetrics(data, sport) {
        const primaryMetricMap = {
            'MLB': { key: 'leverageIndex', label: 'Leverage', format: (val) => val.toFixed(1) },
            'NFL': { key: 'pressureIndex', label: 'Pressure', format: (val) => val.toFixed(1) },
            'NBA': { key: 'clutchRating', label: 'Clutch', format: (val) => val.toFixed(1) },
            'NCAA': { key: 'pressureRating', label: 'Pressure', format: (val) => val.toFixed(1) }
        };
        
        const primaryMetric = primaryMetricMap[sport];
        if (primaryMetric && data[primaryMetric.key]) {
            document.getElementById('live-primary').textContent = primaryMetric.format(data[primaryMetric.key]);
        }
        
        if (data.winProbability) {
            document.getElementById('live-winprob').textContent = data.winProbability.toFixed(1) + '%';
        }
        
        if (data.heartRate) {
            document.getElementById('live-heartrate').textContent = Math.round(data.heartRate) + ' BPM';
        }
    }

    updateMainDashboard(data, scenario) {
        // Update the main dashboard metrics if they're visible
        const metricCards = document.querySelectorAll('.metric-card .metric-value');
        
        if (metricCards.length >= 4) {
            // Update leverage/pressure index
            const primaryKey = scenario.sport === 'MLB' ? 'leverageIndex' : 
                              scenario.sport === 'NBA' ? 'clutchRating' : 'pressureIndex';
            if (data[primaryKey]) {
                metricCards[0].textContent = data[primaryKey].toFixed(2);
            }
            
            // Update win probability
            if (data.winProbability) {
                metricCards[1].textContent = data.winProbability.toFixed(1) + '%';
            }
            
            // Update secondary metric
            const secondaryKey = scenario.sport === 'MLB' ? 'clutchFactor' : 
                                scenario.sport === 'NBA' ? 'energyLevel' : 'momentumFactor';
            if (data[secondaryKey]) {
                metricCards[2].textContent = data[secondaryKey].toFixed(2);
            }
            
            // Team readiness (derived from multiple factors)
            const readiness = this.calculateReadiness(data, scenario.sport);
            metricCards[3].textContent = readiness.toFixed(1) + '%';
        }
    }

    calculateReadiness(data, sport) {
        // Simplified readiness calculation
        let base = 85;
        
        if (sport === 'MLB' && data.leverageIndex) {
            base += (data.leverageIndex - 2.5) * 2;
        } else if (sport === 'NBA' && data.clutchRating) {
            base += (data.clutchRating - 2.5) * 2;
        } else if (data.pressureIndex || data.pressureRating) {
            const pressure = data.pressureIndex || data.pressureRating;
            base += (pressure - 2.5) * 2;
        }
        
        if (data.winProbability) {
            base += (data.winProbability - 50) * 0.2;
        }
        
        return Math.max(75, Math.min(98, base));
    }

    showDemoComplete() {
        // Show completion message
        const completeMsg = document.createElement('div');
        completeMsg.className = 'demo-complete';
        completeMsg.innerHTML = `
            <div style="text-align: center; padding: 1rem; background: rgba(16, 185, 129, 0.1); border: 1px solid #10b981; border-radius: 8px; margin-top: 1rem;">
                <span style="color: #10b981; font-weight: 600;">✓ Demo Complete!</span>
                <p style="color: #E5E4E2; margin: 0.5rem 0 0 0; font-size: 0.875rem;">
                    Experience the full platform with live data feeds
                </p>
            </div>
        `;
        
        const demoInfo = document.querySelector('.demo-info');
        const existing = demoInfo.querySelector('.demo-complete');
        if (existing) existing.remove();
        
        demoInfo.appendChild(completeMsg);
        
        setTimeout(() => completeMsg.remove(), 5000);
    }

    loadDemoScenarios() {
        // Pre-load scenario data
        this.currentScenario = 'cardinals_clutch';
        this.loadScenario();
    }
}

// Initialize demo system when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.blazeDemo = new BlazeInteractiveDemo();
    console.log('🎮 Blaze Interactive Demo System Loaded');
});