// NIL Valuation Engine™ Component
class NILValuationEngine {
    constructor() {
        this.currentValuation = null;
        this.init();
    }

    init() {
        this.createNILSection();
        this.bindEventListeners();
    }

    createNILSection() {
        const section = document.createElement('section');
        section.id = 'nil-valuation';
        section.className = 'nil-valuation-section';
        section.innerHTML = `
            <div class="nil-container">
                <div class="section-header" data-aos="fade-up">
                    <span class="section-badge">NIL CALCULATOR</span>
                    <h2 class="section-title">NIL Valuation Engine™</h2>
                    <p class="section-subtitle">Calculate your Name, Image, and Likeness valuation with confidence intervals</p>
                </div>

                <div class="nil-interface" data-aos="fade-up" data-aos-delay="100">
                    <div class="nil-form">
                        <h3>Athlete Information</h3>
                        
                        <div class="form-grid">
                            <!-- Sport Selection -->
                            <div class="form-group">
                                <label for="nil-sport">Sport</label>
                                <select id="nil-sport" class="form-control">
                                    <option value="">Select sport...</option>
                                    <option value="football">Football</option>
                                    <option value="basketball">Basketball</option>
                                    <option value="baseball">Baseball</option>
                                    <option value="soccer">Soccer</option>
                                    <option value="track">Track & Field</option>
                                    <option value="tennis">Tennis</option>
                                    <option value="golf">Golf</option>
                                    <option value="other">Other</option>
                                </select>
                            </div>

                            <!-- Level -->
                            <div class="form-group">
                                <label for="nil-level">Competition Level</label>
                                <select id="nil-level" class="form-control">
                                    <option value="">Select level...</option>
                                    <option value="high-school">High School</option>
                                    <option value="d3">NCAA Division III</option>
                                    <option value="d2">NCAA Division II</option>
                                    <option value="d1">NCAA Division I</option>
                                    <option value="pro">Professional</option>
                                </select>
                            </div>

                            <!-- Social Reach -->
                            <div class="form-group">
                                <label for="nil-followers">Social Media Followers</label>
                                <input type="number" id="nil-followers" class="form-control" placeholder="Total followers across platforms">
                            </div>

                            <!-- Engagement Rate -->
                            <div class="form-group">
                                <label for="nil-engagement">Engagement Rate (%)</label>
                                <input type="number" id="nil-engagement" class="form-control" placeholder="Average engagement rate" step="0.1" min="0" max="100">
                            </div>

                            <!-- Recent Performance -->
                            <div class="form-group">
                                <label for="nil-performance">Performance Ranking</label>
                                <select id="nil-performance" class="form-control">
                                    <option value="">Select ranking...</option>
                                    <option value="elite">Elite (Top 5%)</option>
                                    <option value="excellent">Excellent (Top 10%)</option>
                                    <option value="above-average">Above Average (Top 25%)</option>
                                    <option value="average">Average (Top 50%)</option>
                                    <option value="developing">Developing</option>
                                </select>
                            </div>

                            <!-- Championships/Awards -->
                            <div class="form-group">
                                <label for="nil-awards">Championships/Awards</label>
                                <input type="number" id="nil-awards" class="form-control" placeholder="Number of major awards" min="0">
                            </div>
                        </div>

                        <button id="calculate-nil" class="calculate-btn">Calculate NIL Valuation</button>
                    </div>

                    <!-- Valuation Results -->
                    <div id="nil-results" class="nil-results" style="display: none;">
                        <h3>Valuation Results</h3>
                        
                        <!-- Valuation Range -->
                        <div class="valuation-card">
                            <div class="valuation-range">
                                <span class="range-label">Estimated Annual NIL Value</span>
                                <div class="range-values">
                                    <span class="range-min" id="range-min">$--</span>
                                    <span class="range-separator">to</span>
                                    <span class="range-max" id="range-max">$--</span>
                                </div>
                                <div class="confidence-indicator">
                                    <span>Confidence: </span>
                                    <span id="confidence-value">--</span>
                                </div>
                            </div>
                        </div>

                        <!-- Value Drivers -->
                        <div class="value-drivers">
                            <h4>Value Drivers</h4>
                            <div class="drivers-chart">
                                <div class="driver-item">
                                    <span class="driver-label">Performance</span>
                                    <div class="driver-bar">
                                        <div class="driver-fill" id="performance-fill" data-weight="40"></div>
                                    </div>
                                    <span class="driver-percent">40%</span>
                                </div>
                                <div class="driver-item">
                                    <span class="driver-label">Social Reach</span>
                                    <div class="driver-bar">
                                        <div class="driver-fill" id="reach-fill" data-weight="30"></div>
                                    </div>
                                    <span class="driver-percent">30%</span>
                                </div>
                                <div class="driver-item">
                                    <span class="driver-label">Engagement</span>
                                    <div class="driver-bar">
                                        <div class="driver-fill" id="engagement-fill" data-weight="20"></div>
                                    </div>
                                    <span class="driver-percent">20%</span>
                                </div>
                                <div class="driver-item">
                                    <span class="driver-label">Trajectory</span>
                                    <div class="driver-bar">
                                        <div class="driver-fill" id="trajectory-fill" data-weight="10"></div>
                                    </div>
                                    <span class="driver-percent">10%</span>
                                </div>
                            </div>
                        </div>

                        <!-- Export Options -->
                        <div class="export-options">
                            <button class="export-btn" onclick="window.nilEngine.exportPDF()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                    <polyline points="7 10 12 15 17 10"/>
                                    <line x1="12" y1="15" x2="12" y2="3"/>
                                </svg>
                                Export PDF
                            </button>
                            <button class="share-btn" onclick="window.nilEngine.shareLink()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <circle cx="18" cy="5" r="3"/>
                                    <circle cx="6" cy="12" r="3"/>
                                    <circle cx="18" cy="19" r="3"/>
                                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                                </svg>
                                Share Link
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert after dashboard section
        const dashboardSection = document.getElementById('dashboard');
        if (dashboardSection) {
            dashboardSection.parentNode.insertBefore(section, dashboardSection.nextSibling);
        }
    }

    bindEventListeners() {
        const calculateBtn = document.getElementById('calculate-nil');
        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => this.calculateValuation());
        }

        // Add input validation
        document.querySelectorAll('.form-control').forEach(input => {
            input.addEventListener('change', () => this.validateForm());
        });
    }

    validateForm() {
        const sport = document.getElementById('nil-sport').value;
        const level = document.getElementById('nil-level').value;
        const followers = document.getElementById('nil-followers').value;
        const calculateBtn = document.getElementById('calculate-nil');

        if (sport && level && followers) {
            calculateBtn.disabled = false;
            calculateBtn.style.opacity = '1';
        } else {
            calculateBtn.disabled = true;
            calculateBtn.style.opacity = '0.5';
        }
    }

    calculateValuation() {
        // Get form values
        const sport = document.getElementById('nil-sport').value;
        const level = document.getElementById('nil-level').value;
        const followers = parseInt(document.getElementById('nil-followers').value) || 0;
        const engagement = parseFloat(document.getElementById('nil-engagement').value) || 2.5;
        const performance = document.getElementById('nil-performance').value || 'average';
        const awards = parseInt(document.getElementById('nil-awards').value) || 0;

        // Base valuation by level
        const baseLevels = {
            'high-school': 1000,
            'd3': 5000,
            'd2': 10000,
            'd1': 25000,
            'pro': 100000
        };

        // Sport multipliers
        const sportMultipliers = {
            'football': 1.5,
            'basketball': 1.3,
            'baseball': 1.0,
            'soccer': 0.9,
            'track': 0.7,
            'tennis': 0.8,
            'golf': 0.9,
            'other': 0.6
        };

        // Performance multipliers
        const performanceMultipliers = {
            'elite': 2.5,
            'excellent': 2.0,
            'above-average': 1.5,
            'average': 1.0,
            'developing': 0.7
        };

        // Calculate base value
        let baseValue = baseLevels[level] || 5000;
        baseValue *= sportMultipliers[sport] || 1;
        baseValue *= performanceMultipliers[performance] || 1;

        // Social media component
        const socialValue = Math.min(followers * 0.5 * (engagement / 100), 50000);
        
        // Awards bonus
        const awardsBonus = awards * 2000;

        // Calculate total
        const totalValue = baseValue + socialValue + awardsBonus;
        
        // Calculate range with confidence
        const confidence = this.calculateConfidence(followers, engagement, awards);
        const variance = (100 - confidence) / 100;
        const minValue = totalValue * (1 - variance * 0.3);
        const maxValue = totalValue * (1 + variance * 0.3);

        // Display results
        this.displayResults(minValue, maxValue, confidence, {
            performance: (baseValue / totalValue) * 100,
            reach: (socialValue / totalValue) * 100,
            engagement: (engagement / 10) * 100,
            trajectory: (awardsBonus / totalValue) * 100
        });

        // Store current valuation
        this.currentValuation = {
            min: minValue,
            max: maxValue,
            confidence,
            sport,
            level,
            followers,
            engagement,
            performance,
            awards
        };
    }

    calculateConfidence(followers, engagement, awards) {
        let confidence = 70; // Base confidence

        // More followers = higher confidence
        if (followers > 100000) confidence += 10;
        else if (followers > 10000) confidence += 5;

        // Higher engagement = higher confidence
        if (engagement > 5) confidence += 10;
        else if (engagement > 3) confidence += 5;

        // Awards increase confidence
        confidence += Math.min(awards * 2, 10);

        return Math.min(confidence, 95);
    }

    displayResults(minValue, maxValue, confidence, drivers) {
        const results = document.getElementById('nil-results');
        if (results) {
            results.style.display = 'block';
            
            // Update values
            document.getElementById('range-min').textContent = `$${this.formatNumber(Math.round(minValue))}`;
            document.getElementById('range-max').textContent = `$${this.formatNumber(Math.round(maxValue))}`;
            document.getElementById('confidence-value').textContent = `${confidence}%`;

            // Update driver bars
            document.getElementById('performance-fill').style.width = `${drivers.performance}%`;
            document.getElementById('reach-fill').style.width = `${drivers.reach}%`;
            document.getElementById('engagement-fill').style.width = `${drivers.engagement}%`;
            document.getElementById('trajectory-fill').style.width = `${drivers.trajectory}%`;

            // Scroll to results
            results.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
    }

    formatNumber(num) {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }

    exportPDF() {
        if (!this.currentValuation) return;

        // In a real implementation, this would generate a PDF
        console.log('Exporting PDF with valuation:', this.currentValuation);
        alert('PDF export functionality would be implemented here. Valuation: $' + 
              this.formatNumber(Math.round(this.currentValuation.min)) + ' - $' + 
              this.formatNumber(Math.round(this.currentValuation.max)));
    }

    shareLink() {
        if (!this.currentValuation) return;

        // Generate shareable link
        const shareData = btoa(JSON.stringify(this.currentValuation));
        const shareUrl = `${window.location.origin}/nil-valuation?data=${shareData}`;
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            const shareBtn = document.querySelector('.share-btn');
            if (shareBtn) {
                const originalText = shareBtn.innerHTML;
                shareBtn.innerHTML = '✓ Link Copied!';
                setTimeout(() => {
                    shareBtn.innerHTML = originalText;
                }, 2000);
            }
        });
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.nilEngine = new NILValuationEngine();
});