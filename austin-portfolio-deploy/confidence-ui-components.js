/**
 * Confidence UI Components
 * User-friendly display of confidence scores and rationale explanations
 * 
 * Integrates with confidence-scoring-system.js to show confidence bands,
 * rationale explanations, and interactive confidence details.
 */

class ConfidenceUI {
    constructor() {
        this.confidenceSystem = null;
        this.initializeSystem();
        this.injectCSS();
    }

    async initializeSystem() {
        // Initialize confidence scoring system
        if (typeof ConfidenceScoring !== 'undefined') {
            this.confidenceSystem = new ConfidenceScoring();
            console.log('[ConfidenceUI] Confidence scoring system initialized');
        } else {
            console.warn('[ConfidenceUI] ConfidenceScoring not available');
        }
    }

    /**
     * Create confidence indicator badge
     */
    createConfidenceBadge(confidenceData) {
        const { score, band, rationale } = confidenceData;
        
        const badge = document.createElement('div');
        badge.className = `confidence-badge confidence-${band.toLowerCase()}`;
        badge.setAttribute('data-confidence', score);
        badge.setAttribute('data-rationale', rationale);
        
        // Badge content
        const scoreDisplay = Math.round(score * 100);
        badge.innerHTML = `
            <div class="confidence-score">
                <span class="confidence-percentage">${scoreDisplay}%</span>
                <span class="confidence-label">${this.getBandLabel(band)}</span>
            </div>
            <div class="confidence-indicator">
                <div class="confidence-bar">
                    <div class="confidence-fill" style="width: ${scoreDisplay}%"></div>
                </div>
            </div>
        `;

        // Add click handler for detailed explanation
        badge.addEventListener('click', () => this.showConfidenceDetails(confidenceData));

        return badge;
    }

    /**
     * Create inline confidence indicator (smaller version)
     */
    createInlineConfidence(confidenceData) {
        const { score, band } = confidenceData;
        
        const indicator = document.createElement('span');
        indicator.className = `confidence-inline confidence-${band.toLowerCase()}`;
        
        const scoreDisplay = Math.round(score * 100);
        indicator.innerHTML = `
            <span class="confidence-dot"></span>
            <span class="confidence-text">${scoreDisplay}%</span>
        `;

        return indicator;
    }

    /**
     * Create detailed confidence explanation panel
     */
    createConfidencePanel(confidenceData) {
        const { score, band, rationale, components, timestamp } = confidenceData;
        
        const panel = document.createElement('div');
        panel.className = 'confidence-panel';
        
        panel.innerHTML = `
            <div class="confidence-panel-header">
                <h4>Confidence Assessment</h4>
                <div class="confidence-main-score confidence-${band.toLowerCase()}">
                    ${Math.round(score * 100)}% ${this.getBandLabel(band)}
                </div>
            </div>
            
            <div class="confidence-rationale">
                <h5>Why this confidence level?</h5>
                <p>${rationale}</p>
            </div>
            
            <div class="confidence-breakdown">
                <h5>Confidence Components</h5>
                <div class="confidence-components">
                    ${this.createComponentBars(components)}
                </div>
            </div>
            
            <div class="confidence-metadata">
                <div class="confidence-timestamp">
                    <small>Assessed: ${new Date(timestamp).toLocaleString()}</small>
                </div>
                <div class="confidence-processing-time">
                    <small>Processing: ${confidenceData.processing_time_ms}ms</small>
                </div>
            </div>
        `;

        return panel;
    }

    /**
     * Create component breakdown bars
     */
    createComponentBars(components) {
        if (!components) return '<p>Component data unavailable</p>';
        
        const componentNames = {
            consensus: 'AI Model Agreement',
            source_reliability: 'Data Source Quality', 
            historical_accuracy: 'Historical Performance',
            data_freshness: 'Data Recency'
        };

        return Object.entries(components)
            .filter(([key]) => key !== 'error')
            .map(([key, value]) => {
                const percentage = Math.round(value * 100);
                const label = componentNames[key] || key;
                
                return `
                    <div class="confidence-component">
                        <div class="component-label">${label}</div>
                        <div class="component-bar">
                            <div class="component-fill" style="width: ${percentage}%"></div>
                            <span class="component-value">${percentage}%</span>
                        </div>
                    </div>
                `;
            }).join('');
    }

    /**
     * Show confidence details modal
     */
    showConfidenceDetails(confidenceData) {
        // Remove any existing modal
        const existingModal = document.querySelector('.confidence-modal');
        if (existingModal) existingModal.remove();

        // Create modal
        const modal = document.createElement('div');
        modal.className = 'confidence-modal';
        modal.innerHTML = `
            <div class="confidence-modal-backdrop"></div>
            <div class="confidence-modal-content">
                <button class="confidence-modal-close">&times;</button>
                <div class="confidence-modal-body">
                    ${this.createConfidencePanel(confidenceData).outerHTML}
                </div>
            </div>
        `;

        // Add event listeners
        modal.querySelector('.confidence-modal-close').addEventListener('click', () => modal.remove());
        modal.querySelector('.confidence-modal-backdrop').addEventListener('click', () => modal.remove());

        // Add to page
        document.body.appendChild(modal);

        // Prevent body scroll
        document.body.style.overflow = 'hidden';

        // Remove modal on escape key
        const handleEscape = (e) => {
            if (e.key === 'Escape') {
                modal.remove();
                document.body.style.overflow = '';
                document.removeEventListener('keydown', handleEscape);
            }
        };
        document.addEventListener('keydown', handleEscape);
    }

    /**
     * Get human-readable label for confidence band
     */
    getBandLabel(band) {
        const labels = {
            'HIGH': 'High Confidence',
            'MEDIUM': 'Medium Confidence',
            'LOW': 'Low Confidence',
            'REJECT': 'Insufficient Data'
        };
        return labels[band] || band;
    }

    /**
     * Auto-enhance all insights on page with confidence indicators
     */
    enhanceInsightsWithConfidence() {
        console.log('[ConfidenceUI] Enhancing insights with confidence indicators');
        
        // Find all insight containers
        const insights = document.querySelectorAll('[data-insight]');
        
        insights.forEach(async (insightElement) => {
            try {
                // Extract insight data
                const insightData = JSON.parse(insightElement.getAttribute('data-insight'));
                const sources = JSON.parse(insightElement.getAttribute('data-sources') || '[]');
                
                if (this.confidenceSystem) {
                    // Score the insight
                    const scoredInsight = await this.confidenceSystem.scoreInsight(insightData, sources);
                    
                    // Only show insights above rejection threshold
                    if (scoredInsight.confidence.band !== 'REJECT') {
                        // Add confidence badge
                        const badge = this.createConfidenceBadge(scoredInsight.confidence);
                        insightElement.appendChild(badge);
                        
                        // Add confidence class to insight container
                        insightElement.classList.add(`insight-confidence-${scoredInsight.confidence.band.toLowerCase()}`);
                    } else {
                        // Hide rejected insights
                        insightElement.style.display = 'none';
                        console.warn('[ConfidenceUI] Hiding low-confidence insight:', insightData.id);
                    }
                }
                
            } catch (error) {
                console.error('[ConfidenceUI] Error enhancing insight:', error);
            }
        });
    }

    /**
     * Create confidence summary for a set of insights
     */
    createConfidenceSummary(scoredInsights) {
        const stats = {
            total: scoredInsights.length,
            high: scoredInsights.filter(i => i.confidence.band === 'HIGH').length,
            medium: scoredInsights.filter(i => i.confidence.band === 'MEDIUM').length,
            low: scoredInsights.filter(i => i.confidence.band === 'LOW').length,
            rejected: scoredInsights.filter(i => i.confidence.band === 'REJECT').length
        };

        const avgConfidence = scoredInsights.reduce((sum, i) => sum + i.confidence.score, 0) / scoredInsights.length;

        const summary = document.createElement('div');
        summary.className = 'confidence-summary';
        summary.innerHTML = `
            <h4>Confidence Summary</h4>
            <div class="summary-stats">
                <div class="summary-average">
                    Average Confidence: <strong>${Math.round(avgConfidence * 100)}%</strong>
                </div>
                <div class="summary-breakdown">
                    <span class="stat stat-high">${stats.high} High</span>
                    <span class="stat stat-medium">${stats.medium} Medium</span>
                    <span class="stat stat-low">${stats.low} Low</span>
                    ${stats.rejected > 0 ? `<span class="stat stat-rejected">${stats.rejected} Hidden</span>` : ''}
                </div>
            </div>
        `;

        return summary;
    }

    /**
     * Inject CSS styles for confidence indicators
     */
    injectCSS() {
        const css = `
            /* Confidence Badge Styles */
            .confidence-badge {
                display: inline-flex;
                flex-direction: column;
                align-items: center;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                padding: 8px 12px;
                margin: 8px 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
                cursor: pointer;
                transition: all 0.2s ease;
                min-width: 100px;
                border: 2px solid transparent;
            }

            .confidence-badge:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            }

            .confidence-badge.confidence-high {
                border-color: #28a745;
            }

            .confidence-badge.confidence-medium {
                border-color: #ffc107;
            }

            .confidence-badge.confidence-low {
                border-color: #fd7e14;
            }

            .confidence-badge.confidence-reject {
                border-color: #dc3545;
                opacity: 0.7;
            }

            .confidence-score {
                text-align: center;
                margin-bottom: 6px;
            }

            .confidence-percentage {
                display: block;
                font-size: 1.2em;
                font-weight: bold;
                color: #333;
            }

            .confidence-label {
                font-size: 0.8em;
                color: #666;
                text-transform: uppercase;
                letter-spacing: 0.5px;
            }

            .confidence-bar {
                width: 80px;
                height: 4px;
                background: rgba(0, 0, 0, 0.1);
                border-radius: 2px;
                overflow: hidden;
            }

            .confidence-fill {
                height: 100%;
                transition: width 0.3s ease;
                border-radius: 2px;
            }

            .confidence-high .confidence-fill {
                background: linear-gradient(90deg, #28a745, #20c997);
            }

            .confidence-medium .confidence-fill {
                background: linear-gradient(90deg, #ffc107, #ffca2c);
            }

            .confidence-low .confidence-fill {
                background: linear-gradient(90deg, #fd7e14, #ff8c42);
            }

            .confidence-reject .confidence-fill {
                background: linear-gradient(90deg, #dc3545, #e55a6b);
            }

            /* Inline Confidence Styles */
            .confidence-inline {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 0.85em;
                font-weight: 500;
            }

            .confidence-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }

            .confidence-inline.confidence-high {
                background: rgba(40, 167, 69, 0.1);
                color: #155724;
            }

            .confidence-inline.confidence-high .confidence-dot {
                background: #28a745;
            }

            .confidence-inline.confidence-medium {
                background: rgba(255, 193, 7, 0.1);
                color: #856404;
            }

            .confidence-inline.confidence-medium .confidence-dot {
                background: #ffc107;
            }

            .confidence-inline.confidence-low {
                background: rgba(253, 126, 20, 0.1);
                color: #8a4214;
            }

            .confidence-inline.confidence-low .confidence-dot {
                background: #fd7e14;
            }

            /* Confidence Panel Styles */
            .confidence-panel {
                background: white;
                border-radius: 12px;
                padding: 20px;
                box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
                max-width: 500px;
            }

            .confidence-panel-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 16px;
                padding-bottom: 12px;
                border-bottom: 1px solid #eee;
            }

            .confidence-main-score {
                font-size: 1.1em;
                font-weight: bold;
                padding: 6px 12px;
                border-radius: 6px;
            }

            .confidence-main-score.confidence-high {
                background: rgba(40, 167, 69, 0.1);
                color: #155724;
            }

            .confidence-rationale {
                margin-bottom: 20px;
            }

            .confidence-rationale h5 {
                margin-bottom: 8px;
                color: #333;
            }

            .confidence-rationale p {
                color: #666;
                line-height: 1.4;
                margin: 0;
            }

            .confidence-breakdown {
                margin-bottom: 16px;
            }

            .confidence-breakdown h5 {
                margin-bottom: 12px;
                color: #333;
            }

            .confidence-component {
                margin-bottom: 10px;
            }

            .component-label {
                font-size: 0.9em;
                color: #666;
                margin-bottom: 4px;
            }

            .component-bar {
                position: relative;
                background: rgba(0, 0, 0, 0.1);
                height: 20px;
                border-radius: 10px;
                overflow: hidden;
            }

            .component-fill {
                height: 100%;
                background: linear-gradient(90deg, #BF5700, #ff7517);
                transition: width 0.3s ease;
                border-radius: 10px;
            }

            .component-value {
                position: absolute;
                right: 8px;
                top: 50%;
                transform: translateY(-50%);
                font-size: 0.8em;
                font-weight: 500;
                color: #333;
            }

            /* Modal Styles */
            .confidence-modal {
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                z-index: 1000;
                display: flex;
                align-items: center;
                justify-content: center;
            }

            .confidence-modal-backdrop {
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                cursor: pointer;
            }

            .confidence-modal-content {
                position: relative;
                background: white;
                border-radius: 12px;
                max-width: 90vw;
                max-height: 90vh;
                overflow-y: auto;
                z-index: 1001;
            }

            .confidence-modal-close {
                position: absolute;
                top: 15px;
                right: 20px;
                background: none;
                border: none;
                font-size: 1.5em;
                cursor: pointer;
                color: #666;
                z-index: 1002;
            }

            .confidence-modal-close:hover {
                color: #333;
            }

            /* Summary Styles */
            .confidence-summary {
                background: rgba(255, 255, 255, 0.95);
                border-radius: 8px;
                padding: 16px;
                margin: 16px 0;
                box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
            }

            .confidence-summary h4 {
                margin-bottom: 12px;
                color: #333;
            }

            .summary-average {
                font-size: 1.1em;
                margin-bottom: 12px;
                color: #333;
            }

            .summary-breakdown {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
            }

            .stat {
                padding: 4px 8px;
                border-radius: 4px;
                font-size: 0.9em;
                font-weight: 500;
            }

            .stat-high {
                background: rgba(40, 167, 69, 0.1);
                color: #155724;
            }

            .stat-medium {
                background: rgba(255, 193, 7, 0.1);
                color: #856404;
            }

            .stat-low {
                background: rgba(253, 126, 20, 0.1);
                color: #8a4214;
            }

            .stat-rejected {
                background: rgba(220, 53, 69, 0.1);
                color: #721c24;
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                .confidence-panel {
                    padding: 16px;
                    margin: 8px;
                }

                .confidence-panel-header {
                    flex-direction: column;
                    gap: 12px;
                    align-items: flex-start;
                }

                .component-bar {
                    height: 16px;
                }

                .component-value {
                    font-size: 0.75em;
                }
            }
        `;

        const styleSheet = document.createElement('style');
        styleSheet.textContent = css;
        document.head.appendChild(styleSheet);
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.confidenceUI = new ConfidenceUI();
    
    // Auto-enhance insights after a short delay
    setTimeout(() => {
        window.confidenceUI.enhanceInsightsWithConfidence();
    }, 1000);
});

// Export for manual usage
if (typeof window !== 'undefined') {
    window.ConfidenceUI = ConfidenceUI;
}

/**
 * Usage Examples:
 * 
 * // Create a confidence badge for an insight
 * const confidenceData = {
 *     score: 0.87,
 *     band: 'HIGH',
 *     rationale: 'High confidence recommendation...',
 *     components: { ... },
 *     timestamp: '2025-09-09T...'
 * };
 * 
 * const badge = confidenceUI.createConfidenceBadge(confidenceData);
 * document.querySelector('.insight-container').appendChild(badge);
 * 
 * // Auto-enhance HTML insights
 * <div data-insight='{"id":"demo_001","type":"biomechanics","content":"..."}' 
 *      data-sources='[{"type":"live_video_feed","timestamp":1694234567890}]'>
 *     <p>Your insight content here...</p>
 * </div>
 * 
 * // Manual enhancement
 * confidenceUI.enhanceInsightsWithConfidence();
 */