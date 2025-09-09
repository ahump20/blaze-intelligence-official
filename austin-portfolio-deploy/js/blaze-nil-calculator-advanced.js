/**
 * Blaze Intelligence Advanced NIL Calculator
 * Comprehensive Name, Image, Likeness valuation system
 */

class BlazeNILCalculator {
    constructor() {
        this.baseValues = {
            football: { multiplier: 2.5, base: 5000 },
            basketball: { multiplier: 2.0, base: 4000 },
            baseball: { multiplier: 1.5, base: 3000 },
            other: { multiplier: 1.0, base: 2000 }
        };
        
        this.marketSizes = {
            'tier1': { multiplier: 2.0, label: 'Tier 1 (Top 25 Markets)' },
            'tier2': { multiplier: 1.5, label: 'Tier 2 (Major Markets)' },
            'tier3': { multiplier: 1.2, label: 'Tier 3 (Regional Markets)' },
            'tier4': { multiplier: 1.0, label: 'Tier 4 (Local Markets)' }
        };
        
        this.performanceMetrics = {
            stats: 0.3,
            wins: 0.2,
            awards: 0.25,
            consistency: 0.15,
            clutch: 0.1
        };
        
        this.init();
    }
    
    init() {
        this.createCalculatorInterface();
        this.bindEventHandlers();
        this.loadSampleData();
    }
    
    createCalculatorInterface() {
        const calculatorHTML = `
            <div id="nil-calculator-modal" class="nil-modal">
                <div class="nil-modal-content">
                    <div class="nil-header">
                        <h2>🏆 Advanced NIL Calculator</h2>
                        <button id="nil-close" class="nil-close">×</button>
                    </div>
                    
                    <div class="nil-form-container">
                        <form id="nil-calculator-form">
                            <!-- Basic Information -->
                            <div class="nil-section">
                                <h3>Player Information</h3>
                                <div class="nil-form-grid">
                                    <div class="nil-form-group">
                                        <label for="player-name">Player Name</label>
                                        <input type="text" id="player-name" placeholder="e.g., Quinn Ewers" required>
                                    </div>
                                    <div class="nil-form-group">
                                        <label for="player-position">Position</label>
                                        <input type="text" id="player-position" placeholder="e.g., QB" required>
                                    </div>
                                    <div class="nil-form-group">
                                        <label for="player-sport">Sport</label>
                                        <select id="player-sport" required>
                                            <option value="">Select Sport</option>
                                            <option value="football">Football</option>
                                            <option value="basketball">Basketball</option>
                                            <option value="baseball">Baseball</option>
                                            <option value="other">Other</option>
                                        </select>
                                    </div>
                                    <div class="nil-form-group">
                                        <label for="player-year">Class Year</label>
                                        <select id="player-year">
                                            <option value="freshman">Freshman</option>
                                            <option value="sophomore">Sophomore</option>
                                            <option value="junior">Junior</option>
                                            <option value="senior">Senior</option>
                                        </select>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Performance Metrics -->
                            <div class="nil-section">
                                <h3>Performance Metrics</h3>
                                <div class="nil-form-grid">
                                    <div class="nil-form-group">
                                        <label for="stats-rating">Statistical Performance (1-100)</label>
                                        <input type="range" id="stats-rating" min="1" max="100" value="75" class="nil-slider">
                                        <span class="nil-slider-value" id="stats-value">75</span>
                                    </div>
                                    <div class="nil-form-group">
                                        <label for="wins-rating">Team Success (1-100)</label>
                                        <input type="range" id="wins-rating" min="1" max="100" value="70" class="nil-slider">
                                        <span class="nil-slider-value" id="wins-value">70</span>
                                    </div>
                                    <div class="nil-form-group">
                                        <label for="awards-rating">Awards & Recognition (1-100)</label>
                                        <input type="range" id="awards-rating" min="1" max="100" value="60" class="nil-slider">
                                        <span class="nil-slider-value" id="awards-value">60</span>
                                    </div>
                                    <div class="nil-form-group">
                                        <label for="consistency-rating">Consistency (1-100)</label>
                                        <input type="range" id="consistency-rating" min="1" max="100" value="80" class="nil-slider">
                                        <span class="nil-slider-value" id="consistency-value">80</span>
                                    </div>
                                    <div class="nil-form-group">
                                        <label for="clutch-rating">Clutch Performance (1-100)</label>
                                        <input type="range" id="clutch-rating" min="1" max="100" value="85" class="nil-slider">
                                        <span class="nil-slider-value" id="clutch-value">85</span>
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Market & Social -->
                            <div class="nil-section">
                                <h3>Market Factors</h3>
                                <div class="nil-form-grid">
                                    <div class="nil-form-group">
                                        <label for="market-size">Market Size</label>
                                        <select id="market-size" required>
                                            <option value="">Select Market</option>
                                            <option value="tier1">Tier 1 (Top 25 Markets)</option>
                                            <option value="tier2">Tier 2 (Major Markets)</option>
                                            <option value="tier3">Tier 3 (Regional Markets)</option>
                                            <option value="tier4">Tier 4 (Local Markets)</option>
                                        </select>
                                    </div>
                                    <div class="nil-form-group">
                                        <label for="social-followers">Social Media Followers</label>
                                        <input type="number" id="social-followers" placeholder="e.g., 50000" min="0">
                                    </div>
                                    <div class="nil-form-group">
                                        <label for="engagement-rate">Engagement Rate (%)</label>
                                        <input type="range" id="engagement-rate" min="0.1" max="15" value="3.5" step="0.1" class="nil-slider">
                                        <span class="nil-slider-value" id="engagement-value">3.5%</span>
                                    </div>
                                    <div class="nil-form-group">
                                        <label for="media-appearances">Media Appearances (per month)</label>
                                        <input type="number" id="media-appearances" placeholder="e.g., 5" min="0" max="50">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Additional Factors -->
                            <div class="nil-section">
                                <h3>Additional Factors</h3>
                                <div class="nil-form-grid">
                                    <div class="nil-form-group nil-checkbox-group">
                                        <label class="nil-checkbox-label">
                                            <input type="checkbox" id="star-player" class="nil-checkbox">
                                            <span class="nil-checkmark"></span>
                                            Star Player (Team Leader)
                                        </label>
                                    </div>
                                    <div class="nil-form-group nil-checkbox-group">
                                        <label class="nil-checkbox-label">
                                            <input type="checkbox" id="playoff-bound" class="nil-checkbox">
                                            <span class="nil-checkmark"></span>
                                            Playoff/Championship Contender
                                        </label>
                                    </div>
                                    <div class="nil-form-group nil-checkbox-group">
                                        <label class="nil-checkbox-label">
                                            <input type="checkbox" id="draft-prospect" class="nil-checkbox">
                                            <span class="nil-checkmark"></span>
                                            Professional Draft Prospect
                                        </label>
                                    </div>
                                    <div class="nil-form-group nil-checkbox-group">
                                        <label class="nil-checkbox-label">
                                            <input type="checkbox" id="local-hero" class="nil-checkbox">
                                            <span class="nil-checkmark"></span>
                                            Local/Regional Hero Status
                                        </label>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="nil-actions">
                                <button type="submit" class="nil-calculate-btn">Calculate NIL Value</button>
                                <button type="button" id="nil-reset" class="nil-reset-btn">Reset Form</button>
                            </div>
                        </form>
                        
                        <!-- Results Section -->
                        <div id="nil-results" class="nil-results" style="display: none;">
                            <div class="nil-results-header">
                                <h3>NIL Valuation Results</h3>
                            </div>
                            
                            <div class="nil-value-display">
                                <div class="nil-primary-value">
                                    <span class="nil-value-label">Estimated Annual NIL Value</span>
                                    <span class="nil-value-amount" id="nil-total-value">$0</span>
                                </div>
                                
                                <div class="nil-confidence-meter">
                                    <div class="nil-confidence-label">Confidence Level</div>
                                    <div class="nil-confidence-bar">
                                        <div class="nil-confidence-fill" id="nil-confidence"></div>
                                    </div>
                                    <span class="nil-confidence-text" id="nil-confidence-text">85%</span>
                                </div>
                            </div>
                            
                            <div class="nil-breakdown">
                                <h4>Value Breakdown</h4>
                                <div class="nil-breakdown-grid">
                                    <div class="nil-breakdown-item">
                                        <span class="nil-breakdown-label">Base Value</span>
                                        <span class="nil-breakdown-value" id="base-value">$0</span>
                                    </div>
                                    <div class="nil-breakdown-item">
                                        <span class="nil-breakdown-label">Performance Bonus</span>
                                        <span class="nil-breakdown-value" id="performance-bonus">$0</span>
                                    </div>
                                    <div class="nil-breakdown-item">
                                        <span class="nil-breakdown-label">Market Premium</span>
                                        <span class="nil-breakdown-value" id="market-premium">$0</span>
                                    </div>
                                    <div class="nil-breakdown-item">
                                        <span class="nil-breakdown-label">Social Media Value</span>
                                        <span class="nil-breakdown-value" id="social-value">$0</span>
                                    </div>
                                    <div class="nil-breakdown-item">
                                        <span class="nil-breakdown-label">Special Factors</span>
                                        <span class="nil-breakdown-value" id="special-factors">$0</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div class="nil-recommendations">
                                <h4>Recommendations</h4>
                                <ul id="nil-recommendations-list"></ul>
                            </div>
                            
                            <div class="nil-disclaimer">
                                <p><strong>Disclaimer:</strong> This calculation is an estimate based on current market data, performance metrics, and social media analytics. Actual NIL values may vary based on specific deals, market conditions, and individual negotiations. Blaze Intelligence provides this tool for informational purposes only.</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', calculatorHTML);
        this.addNILStyles();
    }
    
    addNILStyles() {
        const styles = `
            .nil-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.9);
                backdrop-filter: blur(10px);
                z-index: 10001;
                display: none;
                padding: 2rem;
                overflow-y: auto;
            }
            
            .nil-modal-content {
                max-width: 900px;
                margin: 0 auto;
                background: linear-gradient(135deg, rgba(10, 10, 10, 0.98), rgba(20, 20, 20, 0.98));
                border: 1px solid #BF5700;
                border-radius: 20px;
                box-shadow: 0 25px 50px rgba(0, 0, 0, 0.5);
                font-family: 'Inter', sans-serif;
            }
            
            .nil-header {
                padding: 2rem 2rem 1rem;
                border-bottom: 1px solid rgba(191, 87, 0, 0.3);
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .nil-header h2 {
                color: #BF5700;
                font-size: 1.75rem;
                font-weight: 700;
                margin: 0;
            }
            
            .nil-close {
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
            
            .nil-close:hover {
                background: rgba(191, 87, 0, 0.2);
                transform: rotate(90deg);
            }
            
            .nil-form-container {
                padding: 2rem;
            }
            
            .nil-section {
                margin-bottom: 2rem;
            }
            
            .nil-section h3 {
                color: #9BCBEB;
                font-size: 1.25rem;
                font-weight: 600;
                margin-bottom: 1.5rem;
                padding-bottom: 0.5rem;
                border-bottom: 2px solid rgba(155, 203, 235, 0.2);
            }
            
            .nil-form-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
                gap: 1.5rem;
            }
            
            .nil-form-group {
                display: flex;
                flex-direction: column;
            }
            
            .nil-form-group label {
                color: #E5E4E2;
                font-size: 0.875rem;
                font-weight: 600;
                margin-bottom: 0.5rem;
                opacity: 0.9;
            }
            
            .nil-form-group input,
            .nil-form-group select {
                background: rgba(0, 0, 0, 0.5);
                border: 1px solid rgba(155, 203, 235, 0.3);
                color: #E5E4E2;
                padding: 0.75rem;
                border-radius: 8px;
                font-size: 1rem;
                transition: all 0.3s ease;
            }
            
            .nil-form-group input:focus,
            .nil-form-group select:focus {
                outline: none;
                border-color: #BF5700;
                box-shadow: 0 0 0 2px rgba(191, 87, 0, 0.2);
            }
            
            .nil-slider {
                -webkit-appearance: none;
                appearance: none;
                height: 6px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 3px;
                outline: none;
            }
            
            .nil-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 20px;
                height: 20px;
                background: linear-gradient(135deg, #BF5700, #D76800);
                cursor: pointer;
                border-radius: 50%;
                box-shadow: 0 2px 10px rgba(191, 87, 0, 0.3);
            }
            
            .nil-slider::-moz-range-thumb {
                width: 20px;
                height: 20px;
                background: linear-gradient(135deg, #BF5700, #D76800);
                cursor: pointer;
                border-radius: 50%;
                border: none;
                box-shadow: 0 2px 10px rgba(191, 87, 0, 0.3);
            }
            
            .nil-slider-value {
                color: #BF5700;
                font-weight: 600;
                font-family: 'JetBrains Mono', monospace;
                margin-top: 0.5rem;
                text-align: center;
            }
            
            .nil-checkbox-group {
                flex-direction: row;
                align-items: center;
            }
            
            .nil-checkbox-label {
                display: flex;
                align-items: center;
                cursor: pointer;
                color: #E5E4E2;
                font-size: 0.875rem;
            }
            
            .nil-checkbox {
                display: none;
            }
            
            .nil-checkmark {
                width: 20px;
                height: 20px;
                background: rgba(0, 0, 0, 0.5);
                border: 2px solid rgba(155, 203, 235, 0.3);
                border-radius: 4px;
                margin-right: 0.75rem;
                position: relative;
                transition: all 0.3s ease;
            }
            
            .nil-checkbox:checked + .nil-checkmark {
                background: linear-gradient(135deg, #BF5700, #D76800);
                border-color: #BF5700;
            }
            
            .nil-checkbox:checked + .nil-checkmark::after {
                content: '✓';
                position: absolute;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                color: white;
                font-size: 12px;
                font-weight: bold;
            }
            
            .nil-actions {
                display: flex;
                gap: 1rem;
                margin-top: 2rem;
                justify-content: center;
            }
            
            .nil-calculate-btn {
                background: linear-gradient(135deg, #BF5700, #D76800);
                color: white;
                border: none;
                padding: 1rem 2rem;
                border-radius: 10px;
                font-size: 1.125rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: 0 10px 30px rgba(191, 87, 0, 0.3);
            }
            
            .nil-calculate-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 15px 40px rgba(191, 87, 0, 0.4);
            }
            
            .nil-reset-btn {
                background: transparent;
                color: #E5E4E2;
                border: 2px solid rgba(229, 228, 226, 0.3);
                padding: 1rem 2rem;
                border-radius: 10px;
                font-size: 1.125rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
            }
            
            .nil-reset-btn:hover {
                background: rgba(229, 228, 226, 0.1);
                border-color: #BF5700;
                color: #BF5700;
            }
            
            .nil-results {
                margin-top: 2rem;
                padding-top: 2rem;
                border-top: 1px solid rgba(155, 203, 235, 0.2);
            }
            
            .nil-results-header h3 {
                color: #00B2A9;
                font-size: 1.5rem;
                font-weight: 700;
                margin-bottom: 2rem;
                text-align: center;
            }
            
            .nil-value-display {
                text-align: center;
                margin-bottom: 2rem;
                padding: 2rem;
                background: rgba(0, 178, 169, 0.1);
                border: 1px solid rgba(0, 178, 169, 0.3);
                border-radius: 16px;
            }
            
            .nil-value-label {
                display: block;
                color: #E5E4E2;
                opacity: 0.8;
                font-size: 1rem;
                margin-bottom: 0.5rem;
            }
            
            .nil-value-amount {
                display: block;
                color: #00B2A9;
                font-size: 3rem;
                font-weight: 900;
                font-family: 'JetBrains Mono', monospace;
                text-shadow: 0 0 20px rgba(0, 178, 169, 0.3);
            }
            
            .nil-confidence-meter {
                margin-top: 1.5rem;
            }
            
            .nil-confidence-label {
                color: #E5E4E2;
                font-size: 0.875rem;
                margin-bottom: 0.5rem;
            }
            
            .nil-confidence-bar {
                width: 100%;
                height: 8px;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 4px;
                overflow: hidden;
                margin-bottom: 0.5rem;
            }
            
            .nil-confidence-fill {
                height: 100%;
                background: linear-gradient(90deg, #BF5700, #00B2A9);
                border-radius: 4px;
                transition: width 0.5s ease;
            }
            
            .nil-confidence-text {
                color: #00B2A9;
                font-weight: 600;
                font-family: 'JetBrains Mono', monospace;
            }
            
            .nil-breakdown {
                margin-bottom: 2rem;
            }
            
            .nil-breakdown h4 {
                color: #9BCBEB;
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
            }
            
            .nil-breakdown-grid {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
                gap: 1rem;
            }
            
            .nil-breakdown-item {
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 0.75rem;
                background: rgba(0, 0, 0, 0.3);
                border: 1px solid rgba(155, 203, 235, 0.2);
                border-radius: 8px;
            }
            
            .nil-breakdown-label {
                color: #E5E4E2;
                opacity: 0.8;
                font-size: 0.875rem;
            }
            
            .nil-breakdown-value {
                color: #BF5700;
                font-weight: 600;
                font-family: 'JetBrains Mono', monospace;
            }
            
            .nil-recommendations {
                margin-bottom: 2rem;
            }
            
            .nil-recommendations h4 {
                color: #9BCBEB;
                font-size: 1.125rem;
                font-weight: 600;
                margin-bottom: 1rem;
            }
            
            .nil-recommendations ul {
                list-style: none;
                padding: 0;
            }
            
            .nil-recommendations li {
                padding: 0.75rem;
                margin-bottom: 0.5rem;
                background: rgba(191, 87, 0, 0.1);
                border: 1px solid rgba(191, 87, 0, 0.3);
                border-radius: 8px;
                color: #E5E4E2;
                position: relative;
                padding-left: 2.5rem;
            }
            
            .nil-recommendations li::before {
                content: '💡';
                position: absolute;
                left: 0.75rem;
                top: 0.75rem;
            }
            
            .nil-disclaimer {
                padding: 1.5rem;
                background: rgba(229, 228, 226, 0.05);
                border: 1px solid rgba(229, 228, 226, 0.1);
                border-radius: 8px;
                color: #E5E4E2;
                opacity: 0.8;
                font-size: 0.875rem;
                line-height: 1.6;
            }
            
            @media (max-width: 768px) {
                .nil-modal {
                    padding: 1rem;
                }
                
                .nil-form-grid {
                    grid-template-columns: 1fr;
                }
                
                .nil-actions {
                    flex-direction: column;
                }
                
                .nil-value-amount {
                    font-size: 2rem;
                }
                
                .nil-breakdown-grid {
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
        document.getElementById('nil-close').addEventListener('click', () => this.closeCalculator());
        
        // Form submission
        document.getElementById('nil-calculator-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.calculateNILValue();
        });
        
        // Reset form
        document.getElementById('nil-reset').addEventListener('click', () => this.resetForm());
        
        // Slider updates
        this.setupSliderUpdates();
        
        // Add calculator trigger buttons
        this.addCalculatorTriggers();
    }
    
    setupSliderUpdates() {
        const sliders = [
            { id: 'stats-rating', display: 'stats-value' },
            { id: 'wins-rating', display: 'wins-value' },
            { id: 'awards-rating', display: 'awards-value' },
            { id: 'consistency-rating', display: 'consistency-value' },
            { id: 'clutch-rating', display: 'clutch-value' },
            { id: 'engagement-rate', display: 'engagement-value', suffix: '%' }
        ];
        
        sliders.forEach(slider => {
            const element = document.getElementById(slider.id);
            const display = document.getElementById(slider.display);
            
            if (element && display) {
                element.addEventListener('input', (e) => {
                    const value = parseFloat(e.target.value);
                    display.textContent = value.toFixed(1) + (slider.suffix || '');
                });
            }
        });
    }
    
    addCalculatorTriggers() {
        // Add NIL Calculator button to pricing section
        const pricingSection = document.querySelector('#pricing');
        if (pricingSection) {
            const nilButton = document.createElement('div');
            nilButton.innerHTML = `
                <div style="text-align: center; margin: 3rem 0;">
                    <button id="nil-calculator-trigger" style="
                        background: linear-gradient(135deg, #00B2A9, #00A294);
                        color: white;
                        border: none;
                        padding: 1rem 2rem;
                        border-radius: 10px;
                        font-size: 1.125rem;
                        font-weight: 600;
                        cursor: pointer;
                        transition: all 0.3s ease;
                        box-shadow: 0 10px 30px rgba(0, 178, 169, 0.3);
                    ">
                        🏆 Calculate NIL Value
                    </button>
                </div>
            `;
            
            pricingSection.appendChild(nilButton);
            
            document.getElementById('nil-calculator-trigger').addEventListener('click', () => {
                this.showCalculator();
            });
            
            // Add hover effect
            const btn = document.getElementById('nil-calculator-trigger');
            btn.addEventListener('mouseover', () => {
                btn.style.transform = 'translateY(-3px)';
                btn.style.boxShadow = '0 15px 40px rgba(0, 178, 169, 0.4)';
            });
            btn.addEventListener('mouseout', () => {
                btn.style.transform = 'translateY(0)';
                btn.style.boxShadow = '0 10px 30px rgba(0, 178, 169, 0.3)';
            });
        }
    }
    
    showCalculator() {
        document.getElementById('nil-calculator-modal').style.display = 'block';
    }
    
    closeCalculator() {
        document.getElementById('nil-calculator-modal').style.display = 'none';
    }
    
    loadSampleData() {
        // Load Quinn Ewers as sample data
        document.getElementById('player-name').value = 'Quinn Ewers';
        document.getElementById('player-position').value = 'QB';
        document.getElementById('player-sport').value = 'football';
        document.getElementById('player-year').value = 'junior';
        document.getElementById('market-size').value = 'tier1';
        document.getElementById('social-followers').value = '125000';
        document.getElementById('media-appearances').value = '8';
        
        // Set performance sliders
        document.getElementById('stats-rating').value = '88';
        document.getElementById('wins-rating').value = '85';
        document.getElementById('awards-rating').value = '75';
        document.getElementById('consistency-rating').value = '90';
        document.getElementById('clutch-rating').value = '92';
        document.getElementById('engagement-rate').value = '4.2';
        
        // Check boxes
        document.getElementById('star-player').checked = true;
        document.getElementById('playoff-bound').checked = true;
        document.getElementById('draft-prospect').checked = true;
        
        // Update slider displays
        document.getElementById('stats-value').textContent = '88';
        document.getElementById('wins-value').textContent = '85';
        document.getElementById('awards-value').textContent = '75';
        document.getElementById('consistency-value').textContent = '90';
        document.getElementById('clutch-value').textContent = '92';
        document.getElementById('engagement-value').textContent = '4.2%';
    }
    
    calculateNILValue() {
        const formData = this.getFormData();
        const calculation = this.performCalculation(formData);
        this.displayResults(calculation, formData);
    }
    
    getFormData() {
        return {
            name: document.getElementById('player-name').value,
            position: document.getElementById('player-position').value,
            sport: document.getElementById('player-sport').value,
            year: document.getElementById('player-year').value,
            marketSize: document.getElementById('market-size').value,
            socialFollowers: parseInt(document.getElementById('social-followers').value) || 0,
            mediaAppearances: parseInt(document.getElementById('media-appearances').value) || 0,
            stats: parseFloat(document.getElementById('stats-rating').value),
            wins: parseFloat(document.getElementById('wins-rating').value),
            awards: parseFloat(document.getElementById('awards-rating').value),
            consistency: parseFloat(document.getElementById('consistency-rating').value),
            clutch: parseFloat(document.getElementById('clutch-rating').value),
            engagementRate: parseFloat(document.getElementById('engagement-rate').value),
            starPlayer: document.getElementById('star-player').checked,
            playoffBound: document.getElementById('playoff-bound').checked,
            draftProspect: document.getElementById('draft-prospect').checked,
            localHero: document.getElementById('local-hero').checked
        };
    }
    
    performCalculation(data) {
        const sportData = this.baseValues[data.sport] || this.baseValues.other;
        const marketData = this.marketSizes[data.marketSize] || this.marketSizes.tier4;
        
        // Base calculation
        let baseValue = sportData.base * sportData.multiplier;
        
        // Performance calculation (weighted average)
        const performanceScore = (
            data.stats * this.performanceMetrics.stats +
            data.wins * this.performanceMetrics.wins +
            data.awards * this.performanceMetrics.awards +
            data.consistency * this.performanceMetrics.consistency +
            data.clutch * this.performanceMetrics.clutch
        );
        
        const performanceMultiplier = 1 + (performanceScore - 50) / 100;
        const performanceBonus = baseValue * (performanceMultiplier - 1);
        
        // Market premium
        const marketPremium = baseValue * (marketData.multiplier - 1);
        
        // Social media value
        const socialValue = Math.min(
            data.socialFollowers * (data.engagementRate / 100) * 0.5,
            baseValue * 0.5
        );
        
        // Special factors
        let specialFactors = 0;
        if (data.starPlayer) specialFactors += baseValue * 0.15;
        if (data.playoffBound) specialFactors += baseValue * 0.1;
        if (data.draftProspect) specialFactors += baseValue * 0.2;
        if (data.localHero) specialFactors += baseValue * 0.05;
        
        // Media appearances bonus
        const mediaBonus = data.mediaAppearances * 500;
        specialFactors += mediaBonus;
        
        // Year multiplier
        const yearMultipliers = {
            freshman: 0.8,
            sophomore: 0.9,
            junior: 1.0,
            senior: 1.1
        };
        const yearMultiplier = yearMultipliers[data.year] || 1.0;
        
        // Final calculation
        const totalValue = (
            baseValue + 
            performanceBonus + 
            marketPremium + 
            socialValue + 
            specialFactors
        ) * yearMultiplier;
        
        // Confidence calculation
        const confidence = Math.min(95, 
            60 + 
            (data.socialFollowers > 10000 ? 10 : 0) +
            (performanceScore > 70 ? 10 : 0) +
            (data.mediaAppearances > 3 ? 5 : 0) +
            (data.starPlayer ? 10 : 0)
        );
        
        return {
            total: Math.round(totalValue),
            baseValue: Math.round(baseValue),
            performanceBonus: Math.round(performanceBonus),
            marketPremium: Math.round(marketPremium),
            socialValue: Math.round(socialValue),
            specialFactors: Math.round(specialFactors),
            confidence: confidence,
            performanceScore: performanceScore
        };
    }
    
    displayResults(calculation, formData) {
        // Show results section
        document.getElementById('nil-results').style.display = 'block';
        
        // Display main value
        document.getElementById('nil-total-value').textContent = 
            '$' + calculation.total.toLocaleString();
        
        // Display confidence
        document.getElementById('nil-confidence').style.width = calculation.confidence + '%';
        document.getElementById('nil-confidence-text').textContent = calculation.confidence + '%';
        
        // Display breakdown
        document.getElementById('base-value').textContent = 
            '$' + calculation.baseValue.toLocaleString();
        document.getElementById('performance-bonus').textContent = 
            '$' + calculation.performanceBonus.toLocaleString();
        document.getElementById('market-premium').textContent = 
            '$' + calculation.marketPremium.toLocaleString();
        document.getElementById('social-value').textContent = 
            '$' + calculation.socialValue.toLocaleString();
        document.getElementById('special-factors').textContent = 
            '$' + calculation.specialFactors.toLocaleString();
        
        // Generate recommendations
        this.generateRecommendations(calculation, formData);
        
        // Scroll to results
        document.getElementById('nil-results').scrollIntoView({ 
            behavior: 'smooth',
            block: 'start'
        });
    }
    
    generateRecommendations(calculation, formData) {
        const recommendations = [];
        
        if (formData.socialFollowers < 50000) {
            recommendations.push('Focus on growing social media presence to increase marketability');
        }
        
        if (formData.engagementRate < 3) {
            recommendations.push('Improve social media engagement through authentic content and fan interaction');
        }
        
        if (calculation.performanceScore < 75) {
            recommendations.push('Enhance on-field performance to maximize NIL opportunities');
        }
        
        if (formData.mediaAppearances < 5) {
            recommendations.push('Seek more media opportunities and interviews to build brand recognition');
        }
        
        if (!formData.starPlayer) {
            recommendations.push('Establish leadership role within team to increase star power');
        }
        
        if (calculation.total > 100000) {
            recommendations.push('Consider hiring a professional agent to maximize deal negotiations');
        }
        
        recommendations.push('Focus on local and regional brand partnerships that align with your values');
        recommendations.push('Maintain academic and athletic excellence to sustain long-term value');
        
        const listEl = document.getElementById('nil-recommendations-list');
        listEl.innerHTML = '';
        
        recommendations.forEach(rec => {
            const li = document.createElement('li');
            li.textContent = rec;
            listEl.appendChild(li);
        });
    }
    
    resetForm() {
        document.getElementById('nil-calculator-form').reset();
        document.getElementById('nil-results').style.display = 'none';
        
        // Reset slider displays to default values
        document.getElementById('stats-value').textContent = '75';
        document.getElementById('wins-value').textContent = '70';
        document.getElementById('awards-value').textContent = '60';
        document.getElementById('consistency-value').textContent = '80';
        document.getElementById('clutch-value').textContent = '85';
        document.getElementById('engagement-value').textContent = '3.5%';
    }
}

// Initialize NIL Calculator when page loads
document.addEventListener('DOMContentLoaded', () => {
    window.blazeNIL = new BlazeNILCalculator();
    console.log('🏆 Blaze NIL Calculator Loaded');
});