/**
 * Blaze Intelligence Grit Index UI Components
 * Real-time visual display for Grit Index and character metrics
 * Enhanced with micro-expression indicators and character visualization
 */

class GritIndexUI {
    constructor(container = 'body') {
        this.container = document.querySelector(container);
        this.components = {};
        this.animationFrameId = null;
        
        // Color schemes for different grit levels
        this.gritColors = {
            champion: '#00ff88',     // 90-100
            elite: '#00d4ff',       // 80-89
            solid: '#ffd700',       // 70-79
            developing: '#ff8c00',   // 60-69
            concerning: '#ff4757'    // Below 60
        };
        
        this.init();
    }

    init() {
        console.log('🎨 Initializing Grit Index UI...');
        this.createMainDisplay();
        this.createCharacterProfile();
        this.createMicroExpressionIndicator();
        this.setupEventListeners();
        this.startAnimationLoop();
        console.log('✅ Grit Index UI initialized');
    }

    createMainDisplay() {
        // Create main grit index display
        const gritDisplay = document.createElement('div');
        gritDisplay.className = 'grit-index-main-display';
        gritDisplay.innerHTML = `
            <div class="grit-header">
                <h3>🎯 Grit Index</h3>
                <span class="live-indicator">
                    <div class="pulse-dot"></div>
                    LIVE
                </span>
            </div>
            <div class="grit-score-container">
                <div class="grit-score" id="main-grit-score">--</div>
                <div class="grit-trend" id="grit-trend">--</div>
            </div>
            <div class="grit-components">
                <div class="component" data-component="mentalToughness">
                    <label>Mental Toughness</label>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="component-value">0</span>
                </div>
                <div class="component" data-component="determinationIndex">
                    <label>Determination</label>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="component-value">0</span>
                </div>
                <div class="component" data-component="resilienceScore">
                    <label>Resilience</label>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="component-value">0</span>
                </div>
                <div class="component" data-component="clutchPerformance">
                    <label>Clutch Performance</label>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="component-value">0</span>
                </div>
                <div class="component" data-component="leadershipQuotient">
                    <label>Leadership</label>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: 0%"></div>
                    </div>
                    <span class="component-value">0</span>
                </div>
            </div>
        `;
        
        this.addStyles(gritDisplay, this.getMainDisplayStyles());
        this.container.appendChild(gritDisplay);
        this.components.mainDisplay = gritDisplay;
    }

    createCharacterProfile() {
        const characterProfile = document.createElement('div');
        characterProfile.className = 'character-profile-display';
        characterProfile.innerHTML = `
            <div class="character-header">
                <h4>👤 Character Analysis</h4>
                <div class="character-confidence" id="character-confidence">--</div>
            </div>
            <div class="character-traits">
                <div class="trait-circle" data-trait="leadership">
                    <div class="trait-fill"></div>
                    <div class="trait-label">Leadership</div>
                    <div class="trait-value">0</div>
                </div>
                <div class="trait-circle" data-trait="resilience">
                    <div class="trait-fill"></div>
                    <div class="trait-label">Resilience</div>
                    <div class="trait-value">0</div>
                </div>
                <div class="trait-circle" data-trait="determination">
                    <div class="trait-fill"></div>
                    <div class="trait-label">Determination</div>
                    <div class="trait-value">0</div>
                </div>
                <div class="trait-circle" data-trait="teamwork">
                    <div class="trait-fill"></div>
                    <div class="trait-label">Teamwork</div>
                    <div class="trait-value">0</div>
                </div>
            </div>
            <div class="body-language-indicator">
                <label>Body Language Score</label>
                <div class="body-language-bar">
                    <div class="body-language-fill"></div>
                </div>
                <span class="body-language-value">0%</span>
            </div>
        `;
        
        this.addStyles(characterProfile, this.getCharacterProfileStyles());
        this.container.appendChild(characterProfile);
        this.components.characterProfile = characterProfile;
    }

    createMicroExpressionIndicator() {
        const microExpressions = document.createElement('div');
        microExpressions.className = 'micro-expressions-display';
        microExpressions.innerHTML = `
            <div class="micro-header">
                <h4>🎭 Micro-Expressions</h4>
                <div class="expression-status">
                    <div class="status-dot"></div>
                    <span id="expression-status-text">Analyzing...</span>
                </div>
            </div>
            <div class="expression-grid">
                <div class="expression-item" data-expression="determination">
                    <div class="expression-icon">💪</div>
                    <div class="expression-name">Determination</div>
                    <div class="expression-meter">
                        <div class="expression-fill"></div>
                    </div>
                    <div class="expression-value">0%</div>
                </div>
                <div class="expression-item" data-expression="confidence">
                    <div class="expression-icon">😤</div>
                    <div class="expression-name">Confidence</div>
                    <div class="expression-meter">
                        <div class="expression-fill"></div>
                    </div>
                    <div class="expression-value">0%</div>
                </div>
                <div class="expression-item" data-expression="focus">
                    <div class="expression-icon">👁️</div>
                    <div class="expression-name">Focus</div>
                    <div class="expression-meter">
                        <div class="expression-fill"></div>
                    </div>
                    <div class="expression-value">0%</div>
                </div>
                <div class="expression-item" data-expression="resilience">
                    <div class="expression-icon">🛡️</div>
                    <div class="expression-name">Resilience</div>
                    <div class="expression-meter">
                        <div class="expression-fill"></div>
                    </div>
                    <div class="expression-value">0%</div>
                </div>
            </div>
            <div class="overall-character-score">
                <label>Overall Character Score</label>
                <div class="character-score-display" id="overall-character-score">--</div>
            </div>
        `;
        
        this.addStyles(microExpressions, this.getMicroExpressionStyles());
        this.container.appendChild(microExpressions);
        this.components.microExpressions = microExpressions;
    }

    setupEventListeners() {
        // Listen for grit index updates
        document.addEventListener('gritIndexUpdate', (event) => {
            this.updateGritDisplay(event.detail);
        });

        // Listen for character profile updates
        document.addEventListener('characterProfileUpdate', (event) => {
            this.updateCharacterProfile(event.detail);
        });

        // Listen for micro-expression updates
        document.addEventListener('microExpressionUpdate', (event) => {
            this.updateMicroExpressions(event.detail);
        });

        // Listen for system status updates
        document.addEventListener('gritSystemStatus', (event) => {
            this.updateSystemStatus(event.detail);
        });
    }

    updateGritDisplay(data) {
        const { overall, components, trend, confidence } = data;
        
        // Update main score
        const scoreElement = document.getElementById('main-grit-score');
        if (scoreElement) {
            this.animateValue(scoreElement, parseFloat(scoreElement.textContent) || 0, overall, 1000);
            scoreElement.className = `grit-score ${this.getGritLevel(overall)}`;
        }
        
        // Update trend
        const trendElement = document.getElementById('grit-trend');
        if (trendElement) {
            trendElement.textContent = trend.toUpperCase();
            trendElement.className = `grit-trend trend-${trend}`;
        }
        
        // Update components
        Object.entries(components).forEach(([component, value]) => {
            const componentElement = this.components.mainDisplay?.querySelector(`[data-component="${component}"]`);
            if (componentElement) {
                const progressFill = componentElement.querySelector('.progress-fill');
                const valueElement = componentElement.querySelector('.component-value');
                
                if (progressFill) {
                    progressFill.style.width = `${value}%`;
                    progressFill.style.backgroundColor = this.getGritColor(value);
                }
                
                if (valueElement) {
                    this.animateValue(valueElement, parseFloat(valueElement.textContent) || 0, value, 800);
                }
            }
        });
    }

    updateCharacterProfile(data) {
        const { traits, bodyLanguageScore, vocalToneAnalysis, consistencyIndex } = data;
        
        // Update trait circles
        Object.entries(traits).forEach(([trait, value]) => {
            const traitElement = this.components.characterProfile?.querySelector(`[data-trait="${trait}"]`);
            if (traitElement) {
                const fillElement = traitElement.querySelector('.trait-fill');
                const valueElement = traitElement.querySelector('.trait-value');
                
                if (fillElement) {
                    const percentage = (value / 100) * 360;
                    fillElement.style.background = `conic-gradient(
                        ${this.getGritColor(value)} ${percentage}deg,
                        rgba(255,255,255,0.1) ${percentage}deg
                    )`;
                }
                
                if (valueElement) {
                    this.animateValue(valueElement, parseFloat(valueElement.textContent) || 0, value, 600);
                }
            }
        });
        
        // Update body language score
        const bodyLanguageBar = this.components.characterProfile?.querySelector('.body-language-fill');
        const bodyLanguageValue = this.components.characterProfile?.querySelector('.body-language-value');
        
        if (bodyLanguageBar) {
            bodyLanguageBar.style.width = `${bodyLanguageScore}%`;
            bodyLanguageBar.style.backgroundColor = this.getGritColor(bodyLanguageScore);
        }
        
        if (bodyLanguageValue) {
            this.animateValue(bodyLanguageValue, parseFloat(bodyLanguageValue.textContent) || 0, bodyLanguageScore, 500);
            bodyLanguageValue.textContent = `${bodyLanguageScore.toFixed(1)}%`;
        }
    }

    updateMicroExpressions(data) {
        const { expressions, overallCharacterScore, analysisConfidence, situation } = data;
        
        // Update individual expressions
        Object.entries(expressions).forEach(([expression, value]) => {
            const expressionElement = this.components.microExpressions?.querySelector(`[data-expression="${expression}"]`);
            if (expressionElement) {
                const fillElement = expressionElement.querySelector('.expression-fill');
                const valueElement = expressionElement.querySelector('.expression-value');
                
                if (fillElement) {
                    fillElement.style.width = `${value}%`;
                    fillElement.style.backgroundColor = this.getExpressionColor(expression, value);
                }
                
                if (valueElement) {
                    valueElement.textContent = `${value.toFixed(1)}%`;
                }
            }
        });
        
        // Update overall character score
        const overallElement = document.getElementById('overall-character-score');
        if (overallElement) {
            this.animateValue(overallElement, parseFloat(overallElement.textContent) || 0, overallCharacterScore, 1000);
            overallElement.className = `character-score-display ${this.getGritLevel(overallCharacterScore)}`;
        }
        
        // Update status
        const statusElement = document.getElementById('expression-status-text');
        if (statusElement) {
            statusElement.textContent = `${situation} (${(analysisConfidence * 100).toFixed(0)}% confidence)`;
        }
    }

    updateSystemStatus(data) {
        const { activeStreams, dataQuality, latency } = data;
        
        // Update live indicators
        const liveIndicator = this.components.mainDisplay?.querySelector('.live-indicator');
        if (liveIndicator) {
            liveIndicator.className = `live-indicator ${dataQuality > 0.8 ? 'high-quality' : 'medium-quality'}`;
        }
    }

    getGritLevel(score) {
        if (score >= 90) return 'champion';
        if (score >= 80) return 'elite';
        if (score >= 70) return 'solid';
        if (score >= 60) return 'developing';
        return 'concerning';
    }

    getGritColor(score) {
        return this.gritColors[this.getGritLevel(score)];
    }

    getExpressionColor(expression, value) {
        if (expression === 'stress') {
            // Inverted for stress (lower is better)
            return value < 30 ? this.gritColors.champion : 
                   value < 50 ? this.gritColors.elite :
                   value < 70 ? this.gritColors.solid : this.gritColors.concerning;
        }
        return this.getGritColor(value);
    }

    animateValue(element, start, end, duration) {
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const current = start + (end - start) * this.easeOutCubic(progress);
            element.textContent = Math.round(current);
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        
        requestAnimationFrame(animate);
    }

    easeOutCubic(t) {
        return 1 - Math.pow(1 - t, 3);
    }

    startAnimationLoop() {
        const animate = () => {
            // Add subtle animations to keep UI alive
            const pulseElements = document.querySelectorAll('.pulse-dot');
            pulseElements.forEach(dot => {
                dot.style.opacity = 0.3 + 0.7 * Math.abs(Math.sin(Date.now() * 0.003));
            });
            
            this.animationFrameId = requestAnimationFrame(animate);
        };
        
        animate();
    }

    addStyles(element, styles) {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = styles;
        document.head.appendChild(styleSheet);
    }

    getMainDisplayStyles() {
        return `
            .grit-index-main-display {
                background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(191,87,0,0.1));
                border: 1px solid var(--burnt-orange);
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                color: white;
                font-family: 'Inter', sans-serif;
            }
            
            .grit-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .live-indicator {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.8em;
                color: #00ff88;
            }
            
            .pulse-dot {
                width: 8px;
                height: 8px;
                background: #00ff88;
                border-radius: 50%;
                animation: pulse 2s infinite;
            }
            
            .grit-score-container {
                text-align: center;
                margin-bottom: 30px;
            }
            
            .grit-score {
                font-size: 3rem;
                font-weight: 900;
                font-family: 'JetBrains Mono', monospace;
            }
            
            .grit-score.champion { color: #00ff88; }
            .grit-score.elite { color: #00d4ff; }
            .grit-score.solid { color: #ffd700; }
            .grit-score.developing { color: #ff8c00; }
            .grit-score.concerning { color: #ff4757; }
            
            .grit-trend {
                font-size: 0.9rem;
                margin-top: 5px;
                font-weight: 600;
            }
            
            .grit-trend.trend-rising { color: #00ff88; }
            .grit-trend.trend-stable { color: #ffd700; }
            .grit-trend.trend-declining { color: #ff4757; }
            
            .grit-components {
                display: grid;
                gap: 15px;
            }
            
            .component {
                display: grid;
                grid-template-columns: 1fr 2fr auto;
                align-items: center;
                gap: 10px;
            }
            
            .progress-bar {
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                overflow: hidden;
            }
            
            .progress-fill {
                height: 100%;
                transition: width 0.8s ease;
                border-radius: 3px;
            }
            
            .component-value {
                font-family: 'JetBrains Mono', monospace;
                font-weight: 600;
                min-width: 30px;
            }
        `;
    }

    getCharacterProfileStyles() {
        return `
            .character-profile-display {
                background: linear-gradient(135deg, rgba(0,34,68,0.9), rgba(0,178,169,0.1));
                border: 1px solid var(--vancouver-teal);
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                color: white;
            }
            
            .character-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .character-traits {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(100px, 1fr));
                gap: 20px;
                margin-bottom: 20px;
            }
            
            .trait-circle {
                display: flex;
                flex-direction: column;
                align-items: center;
                text-align: center;
            }
            
            .trait-fill {
                width: 60px;
                height: 60px;
                border-radius: 50%;
                margin-bottom: 8px;
                border: 2px solid rgba(255,255,255,0.2);
            }
            
            .trait-label {
                font-size: 0.8rem;
                margin-bottom: 4px;
            }
            
            .trait-value {
                font-weight: 600;
                font-family: 'JetBrains Mono', monospace;
            }
            
            .body-language-indicator {
                display: grid;
                grid-template-columns: 1fr 2fr auto;
                align-items: center;
                gap: 10px;
            }
            
            .body-language-bar {
                height: 8px;
                background: rgba(255,255,255,0.1);
                border-radius: 4px;
                overflow: hidden;
            }
            
            .body-language-fill {
                height: 100%;
                transition: width 0.5s ease;
                border-radius: 4px;
            }
        `;
    }

    getMicroExpressionStyles() {
        return `
            .micro-expressions-display {
                background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(156,203,235,0.1));
                border: 1px solid var(--cardinal-blue);
                border-radius: 12px;
                padding: 20px;
                margin: 20px 0;
                color: white;
            }
            
            .micro-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 20px;
            }
            
            .expression-status {
                display: flex;
                align-items: center;
                gap: 8px;
                font-size: 0.8rem;
            }
            
            .status-dot {
                width: 8px;
                height: 8px;
                background: var(--cardinal-blue);
                border-radius: 50%;
            }
            
            .expression-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .expression-item {
                display: grid;
                grid-template-columns: auto 1fr auto;
                align-items: center;
                gap: 10px;
                padding: 10px;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
            }
            
            .expression-icon {
                font-size: 1.5rem;
            }
            
            .expression-meter {
                height: 6px;
                background: rgba(255,255,255,0.1);
                border-radius: 3px;
                overflow: hidden;
                min-width: 60px;
            }
            
            .expression-fill {
                height: 100%;
                transition: width 0.6s ease;
                border-radius: 3px;
            }
            
            .overall-character-score {
                text-align: center;
                padding: 15px;
                background: rgba(255,255,255,0.05);
                border-radius: 8px;
            }
            
            .character-score-display {
                font-size: 2rem;
                font-weight: 900;
                font-family: 'JetBrains Mono', monospace;
                margin-top: 10px;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 0.3; }
                50% { opacity: 1; }
            }
        `;
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            // Initialize with a specific container if available, otherwise use body
            const container = document.querySelector('.grit-displays-container') || 'body';
            window.gritIndexUI = new GritIndexUI(container);
            
            console.log('✅ Grit Index UI components loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Grit Index UI:', error);
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GritIndexUI;
}