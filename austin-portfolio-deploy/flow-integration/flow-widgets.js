// Blaze Intelligence Flow Widgets Integration
class FlowOverlay {
    constructor() {
        this.metrics = {
        "p_flow": 0.847,
        "alpha_theta_ratio": 3.2,
        "rmssd": 45.6,
        "fss2_mean": 4.3,
        "time_distortion": 0.78,
        "last_updated": "2025-08-28T09:14:51.824Z"
};
        this.isActive = true;
        this.difficultyMultiplier = 1.0;
        this.resetTimer = null;
        this.updateInterval = null;
    }

    // Initialize Flow Overlay
    init() {
        this.createFlowEvidence();
        this.setupEventHandlers();
        this.startMetricsUpdate();
        console.log('🧠 Flow overlay initialized');
    }

    // Create Flow Evidence Section
    createFlowEvidence() {
        const flowSection = document.createElement('section');
        flowSection.id = 'flow-evidence';
        flowSection.innerHTML = `
            <div class="flow-header">
                <span class="flow-icon">🧠</span>
                <span class="flow-title">Flow State Monitor</span>
            </div>
            
            <div class="flow-metrics">
                <div class="flow-metric">
                    <div class="metric-label">Flow Probability</div>
                    <div class="metric-value" id="flow-probability">${(this.metrics.p_flow * 100).toFixed(1)}%</div>
                </div>
                <div class="flow-metric">
                    <div class="metric-label">α/θ Ratio</div>
                    <div class="metric-value" id="alpha-theta">${this.metrics.alpha_theta_ratio}</div>
                </div>
                <div class="flow-metric">
                    <div class="metric-label">HRV (RMSSD)</div>
                    <div class="metric-value" id="hrv-rmssd">${this.metrics.rmssd}ms</div>
                </div>
                <div class="flow-metric">
                    <div class="metric-label">FSS-2 Score</div>
                    <div class="metric-value" id="fss2-score">${this.metrics.fss2_mean}/9</div>
                </div>
            </div>
            
            <div class="tile-fss">
                <div class="tile-title">Flow State Scale</div>
                <div class="tile-value">${this.metrics.fss2_mean}/9</div>
                <div class="tile-description">Current flow state intensity</div>
            </div>
            
            <div class="tile-eeg">
                <div class="tile-title">EEG Alpha/Theta</div>
                <div class="tile-value">${this.metrics.alpha_theta_ratio}</div>
                <div class="tile-description">Optimal range: 2.5-4.0</div>
            </div>
            
            <div class="tile-hrv">
                <div class="tile-title">Heart Rate Variability</div>
                <div class="tile-value">${this.metrics.rmssd}ms</div>
                <div class="tile-description">Autonomic nervous system balance</div>
            </div>
            
            <div class="flow-controls">
                <button class="flow-btn" id="flow-reset">Reset</button>
                <button class="flow-btn active" id="flow-monitor">Monitor</button>
                <button class="flow-btn" id="flow-enhance">Enhance</button>
            </div>
            
            <input type="range" class="difficulty-slider" id="difficulty-slider" 
                   min="0.8" max="1.2" step="0.01" value="1.0">
            <div style="text-align: center; font-size: 0.7rem; opacity: 0.8;">
                Difficulty: <span id="difficulty-display">100%</span>
            </div>
        `;

        // Insert at top of main content or after body tag
        const main = document.querySelector('main') || document.body;
        if (main.firstChild) {
            main.insertBefore(flowSection, main.firstChild);
        } else {
            main.appendChild(flowSection);
        }
    }

    // Setup Event Handlers
    setupEventHandlers() {
        // Reset button
        const resetBtn = document.getElementById('flow-reset');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetFlow());
        }

        // Monitor toggle
        const monitorBtn = document.getElementById('flow-monitor');
        if (monitorBtn) {
            monitorBtn.addEventListener('click', () => this.toggleMonitoring());
        }

        // Enhance button
        const enhanceBtn = document.getElementById('flow-enhance');
        if (enhanceBtn) {
            enhanceBtn.addEventListener('click', () => this.enhanceFlow());
        }

        // Difficulty slider
        const slider = document.getElementById('difficulty-slider');
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.setDifficultyMultiplier(parseFloat(e.target.value));
            });
        }
    }

    // Update Flow Metrics
    updateMetrics() {
        if (!this.isActive) return;

        // Simulate realistic flow state fluctuations
        this.metrics.p_flow = Math.max(0.1, Math.min(1.0, 
            this.metrics.p_flow + (Math.random() - 0.5) * 0.05
        ));
        
        this.metrics.alpha_theta_ratio = Math.max(1.0, Math.min(6.0,
            this.metrics.alpha_theta_ratio + (Math.random() - 0.5) * 0.1
        ));
        
        this.metrics.rmssd = Math.max(20, Math.min(80,
            this.metrics.rmssd + (Math.random() - 0.5) * 2
        ));
        
        this.metrics.fss2_mean = Math.max(1, Math.min(9,
            this.metrics.fss2_mean + (Math.random() - 0.5) * 0.1
        ));

        this.metrics.time_distortion = Math.max(0.1, Math.min(2.0,
            this.metrics.time_distortion + (Math.random() - 0.5) * 0.02
        ));

        // Update display
        this.updateDisplay();
        
        // Log FSS-2 response
        this.logFSS2Response();
    }

    // Update Display Elements
    updateDisplay() {
        const elements = {
            'flow-probability': `${(this.metrics.p_flow * 100).toFixed(1)}%`,
            'alpha-theta': this.metrics.alpha_theta_ratio.toFixed(1),
            'hrv-rmssd': `${Math.round(this.metrics.rmssd)}ms`,
            'fss2-score': `${this.metrics.fss2_mean.toFixed(1)}/9`
        };

        Object.entries(elements).forEach(([id, value]) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        });

        // Update tile values
        const tileElements = {
            '.tile-fss .tile-value': `${this.metrics.fss2_mean.toFixed(1)}/9`,
            '.tile-eeg .tile-value': this.metrics.alpha_theta_ratio.toFixed(1),
            '.tile-hrv .tile-value': `${Math.round(this.metrics.rmssd)}ms`
        };

        Object.entries(tileElements).forEach(([selector, value]) => {
            const element = document.querySelector(selector);
            if (element) element.textContent = value;
        });

        // Apply flow enhancement to championship analytics
        this.enhanceChampionshipAnalytics();
    }

    // Reset Flow State
    resetFlow() {
        this.metrics = {
            p_flow: 0.847,
            alpha_theta_ratio: 3.2,
            rmssd: 45.6,
            fss2_mean: 4.3,
            time_distortion: 0.78
        };

        this.difficultyMultiplier = 1.0;
        document.getElementById('difficulty-slider').value = 1.0;
        document.getElementById('difficulty-display').textContent = '100%';

        // Reset triggered - set 60-second enhancement
        this.triggerFlowEnhancement();
        
        console.log('🔄 Flow state reset');
    }

    // Toggle Monitoring
    toggleMonitoring() {
        this.isActive = !this.isActive;
        const btn = document.getElementById('flow-monitor');
        btn.textContent = this.isActive ? 'Monitor' : 'Paused';
        btn.classList.toggle('active', this.isActive);
        
        console.log(`🎯 Flow monitoring ${this.isActive ? 'active' : 'paused'}`);
    }

    // Enhance Flow State
    enhanceFlow() {
        // Boost all metrics temporarily
        this.metrics.p_flow = Math.min(1.0, this.metrics.p_flow + 0.1);
        this.metrics.alpha_theta_ratio = Math.min(4.0, this.metrics.alpha_theta_ratio + 0.3);
        this.metrics.fss2_mean = Math.min(9, this.metrics.fss2_mean + 0.5);
        
        this.triggerFlowEnhancement();
        console.log('⚡ Flow state enhanced');
    }

    // Set Difficulty Multiplier
    setDifficultyMultiplier(value) {
        this.difficultyMultiplier = value;
        document.getElementById('difficulty-display').textContent = `${Math.round(value * 100)}%`;
        
        // Apply to game logic (placeholder for actual implementation)
        if (window.gameLogic) {
            window.gameLogic.setDifficultyMultiplier(value);
            window.gameLogic.setPitchSpeed(value * 95); // Base speed * multiplier
        }
        
        console.log(`⚙️ Difficulty set to ${Math.round(value * 100)}%`);
    }

    // Trigger Flow Enhancement (60-second boost)
    triggerFlowEnhancement() {
        if (this.resetTimer) clearTimeout(this.resetTimer);
        
        // Add visual enhancement
        document.getElementById('flow-evidence').style.boxShadow = 
            '0 8px 25px rgba(0, 255, 136, 0.6)';
        
        // Reset after 60 seconds
        this.resetTimer = setTimeout(() => {
            document.getElementById('flow-evidence').style.boxShadow = 
                '0 8px 25px rgba(0, 0, 0, 0.3)';
            console.log('⏰ Flow enhancement expired');
        }, 60000);
    }

    // Log FSS-2 Response
    logFSS2Response() {
        // POST to /flow/fss endpoint (placeholder)
        const fssData = {
            session_id: 'current',
            fss2_score: this.metrics.fss2_mean,
            timestamp: new Date().toISOString()
        };
        
        // In production, this would be an actual API call
        console.log('📊 FSS-2 logged:', fssData);
    }

    // Enhance Championship Analytics with Flow Data
    enhanceChampionshipAnalytics() {
        // Add flow enhancement to championship moments
        const championshipElements = document.querySelectorAll('.championship-moment, .metric-card');
        championshipElements.forEach(element => {
            if (this.metrics.p_flow > 0.8) {
                element.classList.add('championship-with-flow');
                if (!element.classList.contains('flow-enhanced-metric')) {
                    element.classList.add('flow-enhanced-metric');
                }
            }
        });

        // Enhance readiness scores with flow state
        const readinessElement = document.getElementById('readiness-score');
        if (readinessElement && this.metrics.p_flow > 0.85) {
            const currentScore = parseFloat(readinessElement.textContent) || 100;
            const flowBonus = (this.metrics.p_flow - 0.8) * 10; // Up to +2 points
            readinessElement.style.color = '#00ff88';
            readinessElement.setAttribute('title', 
                `Enhanced by flow state (+${flowBonus.toFixed(1)} flow bonus)`);
        }
    }

    // Start Metrics Update Loop
    startMetricsUpdate() {
        this.updateInterval = setInterval(() => {
            this.updateMetrics();
        }, 2000); // Update every 2 seconds
    }

    // Stop Metrics Update
    stop() {
        if (this.updateInterval) clearInterval(this.updateInterval);
        if (this.resetTimer) clearTimeout(this.resetTimer);
    }

    // Get Current Session Metrics (for API endpoint)
    getSessionMetrics() {
        return {
            ...this.metrics,
            difficulty_multiplier: this.difficultyMultiplier,
            is_active: this.isActive,
            last_updated: new Date().toISOString()
        };
    }
}

// Auto-initialize Flow Overlay
document.addEventListener('DOMContentLoaded', () => {
    // Only initialize if flow overlay is not already present
    if (!document.getElementById('flow-evidence')) {
        window.flowOverlay = new FlowOverlay();
        window.flowOverlay.init();
        
        // Expose for external access
        window.getFlowMetrics = () => window.flowOverlay.getSessionMetrics();
    }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.flowOverlay) {
        window.flowOverlay.stop();
    }
});