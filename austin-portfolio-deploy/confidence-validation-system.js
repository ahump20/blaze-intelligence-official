/**
 * Blaze Intelligence Confidence Indicators & AI Validation Harness
 * Real-time confidence scoring with rationale snippets and validation
 */

class ConfidenceValidationSystem {
    constructor() {
        this.models = {
            chatgpt5: {
                name: 'ChatGPT 5',
                reliability: 0.94,
                strengths: ['reasoning', 'analysis', 'predictions'],
                weaknesses: ['real-time data', 'video processing'],
                confidence_baseline: 0.85
            },
            claude41: {
                name: 'Claude Opus 4.1',
                reliability: 0.96,
                strengths: ['data analysis', 'technical accuracy', 'nuanced insights'],
                weaknesses: ['real-time processing', 'visual analysis'],
                confidence_baseline: 0.88
            },
            gemini25: {
                name: 'Gemini 2.5 Pro',
                reliability: 0.92,
                strengths: ['multimodal', 'real-time', 'visual processing'],
                weaknesses: ['consistency', 'specialized sports knowledge'],
                confidence_baseline: 0.82
            }
        };
        
        this.confidenceThresholds = {
            critical: 0.95,  // Show with high confidence
            high: 0.85,      // Show with caution
            medium: 0.70,    // Show with disclaimer
            low: 0.50        // Hide or flag as experimental
        };
        
        this.validationRules = {
            consensus: {
                min_models: 2,
                agreement_threshold: 0.80,
                weight: 0.4
            },
            data_quality: {
                freshness_weight: 0.3,
                source_reliability_weight: 0.4,
                completeness_weight: 0.3,
                weight: 0.3
            },
            historical_accuracy: {
                lookback_days: 30,
                success_rate_weight: 0.6,
                error_rate_weight: 0.4,
                weight: 0.3
            }
        };
        
        this.insights = new Map();
        this.validationHistory = [];
        this.confidenceStore = new Map();
        
        this.init();
    }
    
    init() {
        this.loadValidationHistory();
        this.scheduleValidation();
        this.setupConfidenceUI();
        
        console.log('🎯 Confidence validation system initialized');
    }
    
    loadValidationHistory() {
        try {
            const stored = localStorage.getItem('blaze_validation_history');
            if (stored) {
                this.validationHistory = JSON.parse(stored);
            }
        } catch (error) {
            console.warn('Failed to load validation history:', error);
        }
    }
    
    scheduleValidation() {
        // Validate all insights every 5 minutes
        setInterval(() => {
            this.validateAllInsights();
        }, 5 * 60 * 1000);
        
        // Save validation history every minute
        setInterval(() => {
            this.saveValidationHistory();
        }, 60 * 1000);
    }
    
    setupConfidenceUI() {
        // Add CSS for confidence indicators
        const style = document.createElement('style');
        style.textContent = `
            .confidence-indicator {
                display: inline-flex;
                align-items: center;
                gap: 8px;
                padding: 4px 8px;
                border-radius: 12px;
                font-size: 0.8rem;
                font-weight: 600;
                white-space: nowrap;
            }
            
            .confidence-critical {
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
                border: 1px solid #4CAF50;
            }
            
            .confidence-high {
                background: rgba(255, 193, 7, 0.2);
                color: #FFC107;
                border: 1px solid #FFC107;
            }
            
            .confidence-medium {
                background: rgba(255, 152, 0, 0.2);
                color: #FF9800;
                border: 1px solid #FF9800;
            }
            
            .confidence-low {
                background: rgba(244, 67, 54, 0.2);
                color: #F44336;
                border: 1px solid #F44336;
            }
            
            .confidence-bar {
                width: 60px;
                height: 4px;
                background: rgba(255, 255, 255, 0.2);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .confidence-fill {
                height: 100%;
                background: linear-gradient(90deg, #F44336 0%, #FF9800 50%, #FFC107 75%, #4CAF50 100%);
                border-radius: 2px;
                transition: width 0.3s ease;
            }
            
            .rationale-snippet {
                background: rgba(26, 26, 26, 0.95);
                border: 1px solid #333;
                border-radius: 8px;
                padding: 12px;
                margin: 8px 0;
                font-size: 0.9rem;
                color: #999;
                position: relative;
            }
            
            .rationale-header {
                display: flex;
                align-items: center;
                gap: 8px;
                margin-bottom: 8px;
            }
            
            .rationale-model {
                color: #BF5700;
                font-weight: 600;
                font-size: 0.8rem;
            }
            
            .rationale-content {
                color: #ccc;
                line-height: 1.4;
            }
            
            .consensus-indicator {
                display: inline-flex;
                align-items: center;
                gap: 4px;
                padding: 2px 6px;
                border-radius: 10px;
                font-size: 0.7rem;
                margin-left: 8px;
            }
            
            .consensus-strong {
                background: rgba(76, 175, 80, 0.2);
                color: #4CAF50;
            }
            
            .consensus-moderate {
                background: rgba(255, 193, 7, 0.2);
                color: #FFC107;
            }
            
            .consensus-weak {
                background: rgba(244, 67, 54, 0.2);
                color: #F44336;
            }
            
            .validation-details {
                margin-top: 8px;
                padding: 8px 12px;
                background: rgba(13, 13, 13, 0.8);
                border-radius: 6px;
                font-size: 0.8rem;
            }
            
            .validation-metric {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 4px 0;
            }
            
            .validation-value {
                color: #BF5700;
                font-weight: 600;
            }
            
            .insight-container {
                position: relative;
                border: 1px solid #333;
                border-radius: 8px;
                padding: 16px;
                margin: 12px 0;
                background: rgba(26, 26, 26, 0.8);
            }
            
            .insight-header {
                display: flex;
                align-items: center;
                justify-content: space-between;
                margin-bottom: 12px;
            }
            
            .insight-title {
                color: #fff;
                font-weight: 600;
            }
            
            .insight-meta {
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 0.85rem;
                color: #666;
            }
            
            .data-quality-indicator {
                display: inline-flex;
                align-items: center;
                gap: 4px;
            }
            
            .quality-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }
            
            .quality-excellent { background: #4CAF50; }
            .quality-good { background: #8BC34A; }
            .quality-fair { background: #FFC107; }
            .quality-poor { background: #FF5722; }
        `;
        
        document.head.appendChild(style);
    }
    
    async validateInsight(insightId, data, sources) {
        const insight = {
            id: insightId,
            data,
            sources: sources || [],
            timestamp: Date.now(),
            models_used: [],
            confidence_scores: {},
            rationale: {},
            validation_metrics: {}
        };
        
        // Collect responses from multiple models
        const modelResults = await this.collectModelResponses(data);
        insight.models_used = Object.keys(modelResults);
        
        // Calculate individual model confidences
        for (const [model, result] of Object.entries(modelResults)) {
            const baseConfidence = this.models[model].confidence_baseline;
            const adjustedConfidence = this.adjustConfidenceForModel(baseConfidence, result, model);
            
            insight.confidence_scores[model] = adjustedConfidence;
            insight.rationale[model] = result.rationale || 'No rationale provided';
        }
        
        // Calculate consensus confidence
        insight.consensus = this.calculateConsensus(modelResults);
        
        // Validate data quality
        insight.data_quality = this.assessDataQuality(sources);
        
        // Check historical accuracy
        insight.historical_accuracy = this.assessHistoricalAccuracy(insightId);
        
        // Calculate final confidence score
        insight.final_confidence = this.calculateFinalConfidence(insight);
        
        // Store insight
        this.insights.set(insightId, insight);
        this.confidenceStore.set(insightId, insight.final_confidence);
        
        // Add to validation history
        this.validationHistory.unshift({
            id: insightId,
            timestamp: insight.timestamp,
            confidence: insight.final_confidence,
            models: insight.models_used,
            consensus: insight.consensus.score
        });
        
        // Keep only last 1000 validations
        if (this.validationHistory.length > 1000) {
            this.validationHistory = this.validationHistory.slice(0, 1000);
        }
        
        console.log(`🎯 Insight validated: ${insightId} (confidence: ${(insight.final_confidence * 100).toFixed(1)}%)`);
        
        return insight;
    }
    
    async collectModelResponses(data) {
        const results = {};
        
        // Parallel requests to all models
        const promises = Object.keys(this.models).map(async (modelId) => {
            try {
                const result = await this.queryModel(modelId, data);
                results[modelId] = {
                    response: result.response,
                    confidence: result.confidence || this.models[modelId].confidence_baseline,
                    rationale: result.rationale,
                    processing_time: result.processing_time,
                    error: null
                };
            } catch (error) {
                results[modelId] = {
                    response: null,
                    confidence: 0,
                    rationale: `Model error: ${error.message}`,
                    processing_time: null,
                    error: error.message
                };
            }
        });
        
        await Promise.allSettled(promises);
        return results;
    }
    
    async queryModel(modelId, data) {
        const startTime = performance.now();
        const model = this.models[modelId];
        
        // This would integrate with your actual model APIs
        // For now, simulating the response
        await new Promise(resolve => setTimeout(resolve, Math.random() * 1000 + 500));
        
        const processingTime = performance.now() - startTime;
        const baseConfidence = model.confidence_baseline;
        
        // Simulate model-specific adjustments
        let confidence = baseConfidence;
        if (data.type === 'video_analysis' && model.strengths.includes('visual processing')) {
            confidence += 0.05;
        }
        if (data.requires_realtime && model.weaknesses.includes('real-time processing')) {
            confidence -= 0.08;
        }
        
        // Add some randomness to simulate real conditions
        confidence += (Math.random() - 0.5) * 0.1;
        confidence = Math.max(0, Math.min(1, confidence));
        
        return {
            response: `Analysis from ${model.name}`,
            confidence,
            rationale: `${model.name} analyzed the data using ${model.strengths.join(', ')} capabilities`,
            processing_time: processingTime
        };
    }
    
    adjustConfidenceForModel(baseConfidence, result, modelId) {
        let adjusted = result.confidence || baseConfidence;
        
        // Adjust based on processing time
        if (result.processing_time) {
            if (result.processing_time > 2000) { // Slow response
                adjusted -= 0.05;
            } else if (result.processing_time < 500) { // Very fast, might be cached
                adjusted += 0.02;
            }
        }
        
        // Adjust based on error rate
        if (result.error) {
            adjusted = 0;
        }
        
        return Math.max(0, Math.min(1, adjusted));
    }
    
    calculateConsensus(modelResults) {
        const validResults = Object.values(modelResults).filter(r => r.response && !r.error);
        
        if (validResults.length < 2) {
            return {
                score: 0.5,
                level: 'insufficient',
                participating_models: validResults.length
            };
        }
        
        // For simplicity, using confidence similarity as consensus proxy
        const confidences = validResults.map(r => r.confidence);
        const avgConfidence = confidences.reduce((sum, c) => sum + c, 0) / confidences.length;
        const variance = confidences.reduce((sum, c) => sum + Math.pow(c - avgConfidence, 2), 0) / confidences.length;
        const stdDev = Math.sqrt(variance);
        
        // Low standard deviation = high consensus
        const consensusScore = Math.max(0, 1 - (stdDev * 2));
        
        let level = 'weak';
        if (consensusScore > 0.8) level = 'strong';
        else if (consensusScore > 0.6) level = 'moderate';
        
        return {
            score: consensusScore,
            level,
            participating_models: validResults.length,
            confidence_range: [Math.min(...confidences), Math.max(...confidences)],
            avg_confidence: avgConfidence
        };
    }
    
    assessDataQuality(sources) {
        if (!sources || sources.length === 0) {
            return { score: 0.3, level: 'poor', issues: ['No data sources provided'] };
        }
        
        let qualityScore = 0.8; // Start optimistic
        const issues = [];
        
        // Check data freshness
        const now = Date.now();
        const freshnessPenalties = sources.map(source => {
            if (!source.timestamp) return 0.2; // Unknown age
            const age = now - source.timestamp;
            if (age > 86400000) return 0.1; // > 1 day
            if (age > 3600000) return 0.05;  // > 1 hour
            return 0;
        });
        
        const avgFreshnessPenalty = freshnessPenalties.reduce((sum, p) => sum + p, 0) / sources.length;
        qualityScore -= avgFreshnessPenalty;
        
        if (avgFreshnessPenalty > 0.1) {
            issues.push('Data may be stale');
        }
        
        // Check source reliability
        const reliabilityScore = sources.reduce((sum, source) => {
            const reliability = source.reliability || 0.7;
            return sum + reliability;
        }, 0) / sources.length;
        
        qualityScore *= reliabilityScore;
        
        if (reliabilityScore < 0.8) {
            issues.push('Source reliability concerns');
        }
        
        // Determine quality level
        let level = 'poor';
        if (qualityScore > 0.85) level = 'excellent';
        else if (qualityScore > 0.7) level = 'good';
        else if (qualityScore > 0.5) level = 'fair';
        
        return {
            score: Math.max(0, Math.min(1, qualityScore)),
            level,
            issues,
            source_count: sources.length,
            avg_reliability: reliabilityScore,
            freshness_score: 1 - avgFreshnessPenalty
        };
    }
    
    assessHistoricalAccuracy(insightId) {
        // Look for similar past insights
        const cutoffTime = Date.now() - (30 * 24 * 60 * 60 * 1000); // 30 days
        const recentHistory = this.validationHistory.filter(h => 
            h.timestamp > cutoffTime && 
            h.id.includes(insightId.split('_')[0]) // Similar insight type
        );
        
        if (recentHistory.length === 0) {
            return {
                score: 0.7, // Neutral for new insights
                level: 'unknown',
                sample_size: 0
            };
        }
        
        const avgHistoricalConfidence = recentHistory.reduce((sum, h) => sum + h.confidence, 0) / recentHistory.length;
        
        let level = 'poor';
        if (avgHistoricalConfidence > 0.85) level = 'excellent';
        else if (avgHistoricalConfidence > 0.7) level = 'good';
        else if (avgHistoricalConfidence > 0.55) level = 'fair';
        
        return {
            score: avgHistoricalConfidence,
            level,
            sample_size: recentHistory.length,
            trend: this.calculateTrend(recentHistory)
        };
    }
    
    calculateTrend(history) {
        if (history.length < 3) return 'stable';
        
        const recent = history.slice(0, Math.floor(history.length / 2));
        const older = history.slice(Math.floor(history.length / 2));
        
        const recentAvg = recent.reduce((sum, h) => sum + h.confidence, 0) / recent.length;
        const olderAvg = older.reduce((sum, h) => sum + h.confidence, 0) / older.length;
        
        const diff = recentAvg - olderAvg;
        
        if (diff > 0.05) return 'improving';
        if (diff < -0.05) return 'declining';
        return 'stable';
    }
    
    calculateFinalConfidence(insight) {
        const rules = this.validationRules;
        let finalScore = 0;
        
        // Consensus weight
        finalScore += insight.consensus.score * rules.consensus.weight;
        
        // Data quality weight
        finalScore += insight.data_quality.score * rules.data_quality.weight;
        
        // Historical accuracy weight
        finalScore += insight.historical_accuracy.score * rules.historical_accuracy.weight;
        
        // Ensure we have minimum model participation
        if (insight.models_used.length < rules.consensus.min_models) {
            finalScore *= 0.7; // Penalty for insufficient model participation
        }
        
        return Math.max(0, Math.min(1, finalScore));
    }
    
    renderConfidenceIndicator(insightId, targetElement) {
        const insight = this.insights.get(insightId);
        if (!insight) return;
        
        const confidence = insight.final_confidence;
        const level = this.getConfidenceLevel(confidence);
        
        const indicator = document.createElement('div');
        indicator.className = `confidence-indicator confidence-${level}`;
        
        indicator.innerHTML = `
            <span class="confidence-icon">${this.getConfidenceIcon(level)}</span>
            <span class="confidence-text">${(confidence * 100).toFixed(0)}%</span>
            <div class="confidence-bar">
                <div class="confidence-fill" style="width: ${confidence * 100}%"></div>
            </div>
            ${insight.consensus.level !== 'insufficient' ? 
                `<span class="consensus-indicator consensus-${insight.consensus.level}">
                    ${insight.consensus.participating_models} models
                </span>` : ''
            }
        `;
        
        targetElement.appendChild(indicator);
        
        // Add tooltip with details
        this.addConfidenceTooltip(indicator, insight);
    }
    
    renderRationaleSnippet(insightId, targetElement) {
        const insight = this.insights.get(insightId);
        if (!insight) return;
        
        // Show rationale from highest confidence model
        const bestModel = Object.entries(insight.confidence_scores)
            .sort(([,a], [,b]) => b - a)[0];
        
        if (!bestModel) return;
        
        const [modelId, confidence] = bestModel;
        const rationale = insight.rationale[modelId];
        
        const snippet = document.createElement('div');
        snippet.className = 'rationale-snippet';
        
        snippet.innerHTML = `
            <div class="rationale-header">
                <span class="rationale-model">${this.models[modelId].name}</span>
                <span class="confidence-indicator confidence-${this.getConfidenceLevel(confidence)}">
                    ${(confidence * 100).toFixed(0)}%
                </span>
            </div>
            <div class="rationale-content">${rationale}</div>
        `;
        
        targetElement.appendChild(snippet);
        
        // Add validation details on click
        snippet.addEventListener('click', () => {
            this.toggleValidationDetails(snippet, insight);
        });
    }
    
    toggleValidationDetails(element, insight) {
        let details = element.querySelector('.validation-details');
        
        if (details) {
            details.remove();
            return;
        }
        
        details = document.createElement('div');
        details.className = 'validation-details';
        
        details.innerHTML = `
            <div class="validation-metric">
                <span>Model Consensus:</span>
                <span class="validation-value">${insight.consensus.level} (${(insight.consensus.score * 100).toFixed(0)}%)</span>
            </div>
            <div class="validation-metric">
                <span>Data Quality:</span>
                <span class="validation-value">${insight.data_quality.level}</span>
            </div>
            <div class="validation-metric">
                <span>Historical Accuracy:</span>
                <span class="validation-value">${insight.historical_accuracy.level}</span>
            </div>
            <div class="validation-metric">
                <span>Models Used:</span>
                <span class="validation-value">${insight.models_used.length}/${Object.keys(this.models).length}</span>
            </div>
        `;
        
        element.appendChild(details);
    }
    
    addConfidenceTooltip(element, insight) {
        element.title = [
            `Final Confidence: ${(insight.final_confidence * 100).toFixed(1)}%`,
            `Consensus: ${insight.consensus.level} (${insight.consensus.participating_models} models)`,
            `Data Quality: ${insight.data_quality.level}`,
            `Historical: ${insight.historical_accuracy.level}`
        ].join('\n');
    }
    
    getConfidenceLevel(confidence) {
        if (confidence >= this.confidenceThresholds.critical) return 'critical';
        if (confidence >= this.confidenceThresholds.high) return 'high';
        if (confidence >= this.confidenceThresholds.medium) return 'medium';
        return 'low';
    }
    
    getConfidenceIcon(level) {
        const icons = {
            critical: '✅',
            high: '⚡',
            medium: '⚠️',
            low: '❓'
        };
        return icons[level] || '❓';
    }
    
    validateAllInsights() {
        // Re-validate all active insights
        this.insights.forEach(async (insight, insightId) => {
            // Only re-validate insights less than 1 hour old
            const age = Date.now() - insight.timestamp;
            if (age < 3600000) {
                await this.validateInsight(insightId, insight.data, insight.sources);
            }
        });
    }
    
    saveValidationHistory() {
        try {
            localStorage.setItem('blaze_validation_history', JSON.stringify(this.validationHistory));
        } catch (error) {
            console.warn('Failed to save validation history:', error);
        }
    }
    
    // Public API
    async createInsight(data, sources) {
        const insightId = `insight_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        return await this.validateInsight(insightId, data, sources);
    }
    
    getInsightConfidence(insightId) {
        return this.confidenceStore.get(insightId) || 0;
    }
    
    shouldShowInsight(insightId) {
        const confidence = this.getInsightConfidence(insightId);
        return confidence >= this.confidenceThresholds.medium;
    }
    
    getValidationSummary() {
        const recentValidations = this.validationHistory.slice(0, 100);
        
        if (recentValidations.length === 0) {
            return { avgConfidence: 0, totalValidations: 0, trend: 'unknown' };
        }
        
        const avgConfidence = recentValidations.reduce((sum, v) => sum + v.confidence, 0) / recentValidations.length;
        const trend = this.calculateTrend(recentValidations);
        
        return {
            avgConfidence,
            totalValidations: this.validationHistory.length,
            trend,
            recentValidations: recentValidations.length
        };
    }
}

// Initialize global confidence system
window.blazeConfidence = new ConfidenceValidationSystem();

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfidenceValidationSystem;
}

console.log('🎯 Confidence validation system active - AI insights validated');