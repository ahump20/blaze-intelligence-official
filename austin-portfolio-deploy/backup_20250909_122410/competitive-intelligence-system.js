/**
 * Blaze Intelligence Competitive Intelligence System
 * Real-time competitive monitoring and strategic analysis
 */

class BlazeCompetitiveIntelligence {
    constructor(config = {}) {
        this.config = {
            apiEndpoint: 'https://api.blaze-intelligence.com/competitive',
            updateInterval: 300000, // 5 minutes
            alertThresholds: {
                pricing: 0.1, // 10% price change
                features: 0.2, // 20% feature change
                marketShare: 0.05 // 5% market share change
            },
            debugMode: config.debugMode || false,
            autoTracking: true,
            ...config
        };
        
        // Competitor database
        this.competitors = {
            'hudl': {
                name: 'Hudl',
                website: 'https://www.hudl.com',
                category: 'Video Analysis Platform',
                marketShare: 0.45,
                threat_level: 'high',
                last_updated: null,
                strengths: ['Market dominance', 'Brand recognition', 'Video platform'],
                weaknesses: ['Limited AI', 'No predictive analytics', 'Reactive insights'],
                pricing: {
                    entry: 25000,
                    professional: 85000,
                    enterprise: 200000
                },
                features: {
                    'video_analysis': 95,
                    'ai_ml': 35,
                    'real_time': 60,
                    'predictive': 25,
                    'multi_sport': 70,
                    'injury_prevention': 15,
                    'cost_effective': 40
                },
                recent_news: [],
                monitoring_keywords: ['hudl', 'video analysis', 'sports video', 'hudl announcement']
            },
            'second_spectrum': {
                name: 'Second Spectrum',
                website: 'https://www.secondspectrum.com',
                category: 'NBA/Soccer Analytics',
                marketShare: 0.15,
                threat_level: 'medium',
                last_updated: null,
                strengths: ['Advanced tracking', 'Real-time data', 'NBA partnership'],
                weaknesses: ['Single-sport focus', 'Limited AI', 'No injury prevention'],
                pricing: {
                    entry: 35000,
                    professional: 120000,
                    enterprise: 300000
                },
                features: {
                    'video_analysis': 80,
                    'ai_ml': 65,
                    'real_time': 90,
                    'predictive': 55,
                    'multi_sport': 30,
                    'injury_prevention': 35,
                    'cost_effective': 25
                },
                recent_news: [],
                monitoring_keywords: ['second spectrum', 'NBA analytics', 'player tracking', 'optical tracking']
            },
            'stats_llc': {
                name: 'Stats LLC',
                website: 'https://www.stats.com',
                category: 'Data Provider',
                marketShare: 0.25,
                threat_level: 'low',
                last_updated: null,
                strengths: ['Comprehensive data', 'Established relationships', 'Reliability'],
                weaknesses: ['Raw data only', 'No analytics', 'No AI capabilities'],
                pricing: {
                    entry: 15000,
                    professional: 60000,
                    enterprise: 150000
                },
                features: {
                    'video_analysis': 20,
                    'ai_ml': 15,
                    'real_time': 70,
                    'predictive': 10,
                    'multi_sport': 85,
                    'injury_prevention': 5,
                    'cost_effective': 60
                },
                recent_news: [],
                monitoring_keywords: ['stats llc', 'sports data', 'statistical analysis', 'data provider']
            },
            'sportscode': {
                name: 'SportsCode',
                website: 'https://www.sportscode.com',
                category: 'Video Coding Platform',
                marketShare: 0.08,
                threat_level: 'low',
                last_updated: null,
                strengths: ['Video coding', 'Analysis tools', 'User base'],
                weaknesses: ['Manual process', 'No AI', 'Limited automation'],
                pricing: {
                    entry: 2000,
                    professional: 8000,
                    enterprise: 20000
                },
                features: {
                    'video_analysis': 75,
                    'ai_ml': 10,
                    'real_time': 30,
                    'predictive': 5,
                    'multi_sport': 80,
                    'injury_prevention': 0,
                    'cost_effective': 85
                },
                recent_news: [],
                monitoring_keywords: ['sportscode', 'video coding', 'video tagging', 'sports analysis']
            }
        };
        
        // Market intelligence data
        this.marketData = {
            total_market_size: 5.2e9, // $5.2B
            growth_rate: 0.187, // 18.7% CAGR
            segments: {
                'video_analysis': 0.35,
                'performance_analytics': 0.25,
                'fan_engagement': 0.20,
                'injury_prevention': 0.12,
                'betting_analytics': 0.08
            },
            trends: [
                'AI/ML adoption increasing rapidly',
                'Real-time analytics demand growing',
                'Injury prevention becoming priority',
                'Multi-sport platforms preferred',
                'Cost optimization critical for smaller teams'
            ]
        };
        
        // Alert system
        this.alerts = JSON.parse(localStorage.getItem('blaze_competitive_alerts') || '[]');
        
        // Historical data
        this.historicalData = JSON.parse(localStorage.getItem('blaze_competitive_history') || '{}');
        
        this.init();
    }
    
    init() {
        this.setupMonitoring();
        this.initializeStorage();
        
        if (this.config.autoTracking) {
            this.startContinuousMonitoring();
        }
        
        if (this.config.debugMode) {
            console.log('Blaze Competitive Intelligence System initialized');
        }
    }
    
    setupMonitoring() {
        // Set up event listeners for competitive intelligence
        document.addEventListener('competitive_update_triggered', (e) => {
            this.updateCompetitorData(e.detail.competitor);
        });
        
        document.addEventListener('pricing_change_detected', (e) => {
            this.processPricingChange(e.detail);
        });
        
        document.addEventListener('feature_update_detected', (e) => {
            this.processFeatureUpdate(e.detail);
        });
    }
    
    initializeStorage() {
        this.storage = {
            alerts: JSON.parse(localStorage.getItem('blaze_competitive_alerts') || '[]'),
            history: JSON.parse(localStorage.getItem('blaze_competitive_history') || '{}'),
            reports: JSON.parse(localStorage.getItem('blaze_competitive_reports') || '[]'),
            insights: JSON.parse(localStorage.getItem('blaze_competitive_insights') || '{}')
        };
    }
    
    startContinuousMonitoring() {
        // Monitor competitors at regular intervals
        setInterval(() => {
            this.performCompetitiveAnalysis();
        }, this.config.updateInterval);
        
        // Initial analysis
        setTimeout(() => {
            this.performCompetitiveAnalysis();
        }, 5000);
        
        if (this.config.debugMode) {
            console.log('Continuous monitoring started');
        }
    }
    
    async performCompetitiveAnalysis() {
        const analysisResults = {
            timestamp: new Date().toISOString(),
            competitors_analyzed: Object.keys(this.competitors).length,
            alerts_generated: 0,
            insights_discovered: 0,
            market_changes: []
        };
        
        try {
            // Analyze each competitor
            for (const [key, competitor] of Object.entries(this.competitors)) {
                const analysis = await this.analyzeCompetitor(key, competitor);
                
                if (analysis.alerts.length > 0) {
                    analysisResults.alerts_generated += analysis.alerts.length;
                    this.processAlerts(analysis.alerts);
                }
                
                if (analysis.insights.length > 0) {
                    analysisResults.insights_discovered += analysis.insights.length;
                    this.storeInsights(key, analysis.insights);
                }
                
                // Update competitor data
                this.updateCompetitorMetrics(key, analysis.metrics);
            }
            
            // Analyze market trends
            const marketAnalysis = this.analyzeMarketTrends();
            analysisResults.market_changes = marketAnalysis.changes;
            
            // Generate strategic recommendations
            const recommendations = this.generateStrategicRecommendations();
            
            // Store analysis results
            this.storeAnalysisResults(analysisResults);
            
            // Update dashboard if visible
            this.updateDashboardData();
            
            if (this.config.debugMode) {
                console.log('Competitive analysis completed:', analysisResults);
            }
            
        } catch (error) {
            console.error('Competitive analysis failed:', error);
            this.recordError('analysis_failed', error.message);
        }
    }
    
    async analyzeCompetitor(competitorKey, competitor) {
        const analysis = {
            competitor: competitorKey,
            timestamp: new Date().toISOString(),
            alerts: [],
            insights: [],
            metrics: {},
            changes_detected: []
        };
        
        try {
            // Simulate competitive intelligence gathering
            // In production, this would integrate with:
            // - Web scraping services
            // - News monitoring APIs
            // - Pricing intelligence services
            // - Social media monitoring
            // - Patent databases
            // - Job posting analysis
            
            // Check for pricing changes
            const pricingAnalysis = this.analyzePricing(competitor);
            if (pricingAnalysis.changes.length > 0) {
                analysis.alerts.push(...pricingAnalysis.alerts);
                analysis.changes_detected.push(...pricingAnalysis.changes);
            }
            
            // Check for feature updates
            const featureAnalysis = this.analyzeFeatures(competitor);
            if (featureAnalysis.changes.length > 0) {
                analysis.insights.push(...featureAnalysis.insights);
                analysis.changes_detected.push(...featureAnalysis.changes);
            }
            
            // Check for market share changes
            const marketAnalysis = this.analyzeMarketPosition(competitor);
            analysis.metrics = marketAnalysis.metrics;
            
            // Monitor news and announcements
            const newsAnalysis = await this.monitorCompetitorNews(competitor);
            if (newsAnalysis.significant_news.length > 0) {
                analysis.alerts.push(...newsAnalysis.alerts);
                analysis.insights.push(...newsAnalysis.insights);
            }
            
            // Update last analysis time
            competitor.last_updated = new Date().toISOString();
            
        } catch (error) {
            console.error(`Analysis failed for ${competitorKey}:`, error);
            analysis.alerts.push({
                type: 'error',
                priority: 'low',
                message: `Failed to analyze ${competitor.name}: ${error.message}`,
                timestamp: new Date().toISOString()
            });
        }
        
        return analysis;
    }
    
    analyzePricing(competitor) {
        const analysis = {
            changes: [],
            alerts: []
        };
        
        // Get historical pricing data
        const historicalPricing = this.getHistoricalData(competitor.name, 'pricing');
        
        // Simulate pricing change detection (replace with real monitoring)
        const currentPricing = competitor.pricing;
        
        if (historicalPricing && historicalPricing.length > 0) {
            const lastPricing = historicalPricing[historicalPricing.length - 1];
            
            Object.entries(currentPricing).forEach(([tier, price]) => {
                const lastPrice = lastPricing[tier];
                if (lastPrice && Math.abs(price - lastPrice) / lastPrice > this.config.alertThresholds.pricing) {
                    const change = {
                        type: 'pricing_change',
                        tier: tier,
                        old_price: lastPrice,
                        new_price: price,
                        change_percent: ((price - lastPrice) / lastPrice) * 100,
                        detected_at: new Date().toISOString()
                    };
                    
                    analysis.changes.push(change);
                    
                    // Generate alert
                    analysis.alerts.push({
                        type: 'pricing_change',
                        priority: Math.abs(change.change_percent) > 20 ? 'high' : 'medium',
                        message: `${competitor.name} ${tier} pricing changed ${change.change_percent > 0 ? 'increased' : 'decreased'} by ${Math.abs(change.change_percent).toFixed(1)}%`,
                        timestamp: new Date().toISOString(),
                        competitor: competitor.name,
                        details: change
                    });
                }
            });
        }
        
        return analysis;
    }
    
    analyzeFeatures(competitor) {
        const analysis = {
            changes: [],
            insights: []
        };
        
        // Get historical feature data
        const historicalFeatures = this.getHistoricalData(competitor.name, 'features');
        
        if (historicalFeatures && historicalFeatures.length > 0) {
            const lastFeatures = historicalFeatures[historicalFeatures.length - 1];
            
            Object.entries(competitor.features).forEach(([feature, score]) => {
                const lastScore = lastFeatures[feature];
                if (lastScore && Math.abs(score - lastScore) / lastScore > this.config.alertThresholds.features) {
                    const change = {
                        type: 'feature_change',
                        feature: feature,
                        old_score: lastScore,
                        new_score: score,
                        improvement: score > lastScore,
                        detected_at: new Date().toISOString()
                    };
                    
                    analysis.changes.push(change);
                    
                    // Generate insight
                    analysis.insights.push({
                        type: 'feature_update',
                        message: `${competitor.name} ${change.improvement ? 'improved' : 'reduced'} ${feature} capabilities`,
                        impact: this.assessFeatureImpact(feature, change),
                        timestamp: new Date().toISOString(),
                        competitor: competitor.name,
                        details: change
                    });
                }
            });
        }
        
        return analysis;
    }
    
    analyzeMarketPosition(competitor) {
        const analysis = {
            metrics: {
                market_share: competitor.marketShare,
                threat_level: competitor.threat_level,
                feature_completeness: this.calculateFeatureCompleteness(competitor),
                innovation_rate: this.calculateInnovationRate(competitor),
                competitive_strength: this.calculateCompetitiveStrength(competitor)
            }
        };
        
        return analysis;
    }
    
    async monitorCompetitorNews(competitor) {
        const analysis = {
            significant_news: [],
            alerts: [],
            insights: []
        };
        
        try {
            // Simulate news monitoring (replace with real news API)
            const mockNews = this.generateMockNews(competitor);
            
            mockNews.forEach(newsItem => {
                if (newsItem.significance > 0.7) {
                    analysis.significant_news.push(newsItem);
                    
                    // Generate alert for high-impact news
                    analysis.alerts.push({
                        type: 'news_alert',
                        priority: newsItem.significance > 0.9 ? 'high' : 'medium',
                        message: `${competitor.name} news: ${newsItem.headline}`,
                        timestamp: new Date().toISOString(),
                        competitor: competitor.name,
                        details: newsItem
                    });
                    
                    // Generate insight
                    analysis.insights.push({
                        type: 'market_intelligence',
                        message: newsItem.analysis,
                        impact: newsItem.impact,
                        timestamp: new Date().toISOString(),
                        source: newsItem.source
                    });
                }
            });
            
        } catch (error) {
            console.error(`News monitoring failed for ${competitor.name}:`, error);
        }
        
        return analysis;
    }
    
    generateMockNews(competitor) {
        // This would be replaced with real news monitoring in production
        const mockNewsItems = [
            {
                headline: `${competitor.name} announces new AI features`,
                significance: 0.8,
                impact: 'medium',
                source: 'TechCrunch',
                analysis: `${competitor.name} is investing in AI capabilities to compete with more advanced platforms`,
                published_at: new Date(Date.now() - Math.random() * 86400000).toISOString()
            },
            {
                headline: `${competitor.name} raises $50M Series B funding`,
                significance: 0.9,
                impact: 'high',
                source: 'SportsTechWeekly',
                analysis: `Significant funding will accelerate ${competitor.name} development and market expansion`,
                published_at: new Date(Date.now() - Math.random() * 172800000).toISOString()
            }
        ];
        
        // Return random subset
        return Math.random() > 0.7 ? mockNewsItems.slice(0, 1) : [];
    }
    
    analyzeMarketTrends() {
        const analysis = {
            changes: [],
            opportunities: [],
            threats: []
        };
        
        // Analyze market segments
        Object.entries(this.marketData.segments).forEach(([segment, share]) => {
            // Simulate trend analysis
            if (segment === 'injury_prevention') {
                analysis.opportunities.push({
                    type: 'market_growth',
                    segment: segment,
                    message: 'Injury prevention market growing 25% YoY - strong positioning opportunity',
                    impact: 'high'
                });
            }
            
            if (segment === 'video_analysis' && share > 0.3) {
                analysis.threats.push({
                    type: 'market_saturation',
                    segment: segment,
                    message: 'Video analysis market increasingly saturated - differentiation critical',
                    impact: 'medium'
                });
            }
        });
        
        return analysis;
    }
    
    generateStrategicRecommendations() {
        const recommendations = {
            maintain: [],
            address: [],
            opportunities: []
        };
        
        // Analyze our competitive position
        const ourStrengths = this.getOurCompetitiveStrengths();
        const marketGaps = this.identifyMarketGaps();
        const competitorWeaknesses = this.identifyCompetitorWeaknesses();
        
        // Generate recommendations
        ourStrengths.forEach(strength => {
            recommendations.maintain.push({
                type: 'maintain_advantage',
                area: strength.area,
                message: strength.recommendation,
                priority: 'high'
            });
        });
        
        marketGaps.forEach(gap => {
            recommendations.opportunities.push({
                type: 'market_opportunity',
                area: gap.area,
                message: gap.recommendation,
                priority: gap.priority
            });
        });
        
        return recommendations;
    }
    
    // Utility methods
    calculateFeatureCompleteness(competitor) {
        const scores = Object.values(competitor.features);
        return scores.reduce((sum, score) => sum + score, 0) / scores.length;
    }
    
    calculateInnovationRate(competitor) {
        // Simulate innovation rate calculation based on feature improvements
        const baseRate = competitor.features.ai_ml * 0.4 + competitor.features.predictive * 0.3 + competitor.features.real_time * 0.3;
        return Math.min(100, baseRate);
    }
    
    calculateCompetitiveStrength(competitor) {
        const marketWeight = competitor.marketShare * 40;
        const featureWeight = this.calculateFeatureCompleteness(competitor) * 0.4;
        const innovationWeight = this.calculateInnovationRate(competitor) * 0.2;
        
        return marketWeight + featureWeight + innovationWeight;
    }
    
    getOurCompetitiveStrengths() {
        return [
            {
                area: 'AI/ML Innovation',
                recommendation: 'Continue leading in AI innovation - maintain 95% capability score'
            },
            {
                area: 'Cost Effectiveness',
                recommendation: 'Maintain 67-80% cost advantage vs competitors'
            },
            {
                area: 'Multi-sport Coverage',
                recommendation: 'Expand multi-sport capabilities to strengthen differentiation'
            },
            {
                area: 'Injury Prevention',
                recommendation: 'Enhance 89% accuracy to 95%+ to solidify market leadership'
            }
        ];
    }
    
    identifyMarketGaps() {
        return [
            {
                area: 'Mobile Applications',
                recommendation: 'Develop mobile app to address gap in competitor offerings',
                priority: 'high'
            },
            {
                area: 'International Markets',
                recommendation: 'Expand to European and Asian markets where competitors are weak',
                priority: 'medium'
            },
            {
                area: 'Partner Ecosystem',
                recommendation: 'Build integration partnerships to expand platform reach',
                priority: 'medium'
            }
        ];
    }
    
    identifyCompetitorWeaknesses() {
        const weaknesses = [];
        
        Object.values(this.competitors).forEach(competitor => {
            competitor.weaknesses.forEach(weakness => {
                if (!weaknesses.some(w => w.weakness === weakness)) {
                    weaknesses.push({
                        weakness: weakness,
                        competitors: [competitor.name],
                        opportunity: this.weaknessToOpportunity(weakness)
                    });
                } else {
                    const existing = weaknesses.find(w => w.weakness === weakness);
                    existing.competitors.push(competitor.name);
                }
            });
        });
        
        return weaknesses;
    }
    
    weaknessToOpportunity(weakness) {
        const opportunityMap = {
            'Limited AI': 'Emphasize our advanced AI capabilities in marketing',
            'No predictive analytics': 'Highlight our 94.6% predictive accuracy',
            'Reactive insights': 'Position our real-time, proactive intelligence',
            'Single-sport focus': 'Market our multi-sport platform advantages',
            'Raw data only': 'Emphasize our complete analytics and insights platform'
        };
        
        return opportunityMap[weakness] || 'Leverage this weakness in competitive positioning';
    }
    
    processAlerts(alerts) {
        alerts.forEach(alert => {
            // Add to alert queue
            this.storage.alerts.unshift({
                ...alert,
                id: this.generateAlertId(),
                read: false,
                archived: false
            });
        });
        
        // Keep only latest 100 alerts
        this.storage.alerts = this.storage.alerts.slice(0, 100);
        
        // Send high-priority alerts immediately
        const highPriorityAlerts = alerts.filter(alert => alert.priority === 'high');
        if (highPriorityAlerts.length > 0) {
            this.sendImmediateNotifications(highPriorityAlerts);
        }
        
        this.saveToStorage();
    }
    
    storeInsights(competitorKey, insights) {
        if (!this.storage.insights[competitorKey]) {
            this.storage.insights[competitorKey] = [];
        }
        
        insights.forEach(insight => {
            this.storage.insights[competitorKey].unshift({
                ...insight,
                id: this.generateInsightId()
            });
        });
        
        // Keep only latest 50 insights per competitor
        this.storage.insights[competitorKey] = this.storage.insights[competitorKey].slice(0, 50);
        
        this.saveToStorage();
    }
    
    updateCompetitorMetrics(competitorKey, metrics) {
        if (this.competitors[competitorKey]) {
            // Store historical data
            this.storeHistoricalData(this.competitors[competitorKey].name, 'metrics', metrics);
            
            // Update current metrics
            Object.assign(this.competitors[competitorKey], metrics);
        }
    }
    
    storeHistoricalData(competitorName, dataType, data) {
        if (!this.storage.history[competitorName]) {
            this.storage.history[competitorName] = {};
        }
        
        if (!this.storage.history[competitorName][dataType]) {
            this.storage.history[competitorName][dataType] = [];
        }
        
        this.storage.history[competitorName][dataType].push({
            timestamp: new Date().toISOString(),
            data: data
        });
        
        // Keep only last 30 days of historical data
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        this.storage.history[competitorName][dataType] = this.storage.history[competitorName][dataType]
            .filter(entry => new Date(entry.timestamp) > thirtyDaysAgo);
    }
    
    getHistoricalData(competitorName, dataType) {
        return this.storage.history[competitorName]?.[dataType]?.map(entry => entry.data) || [];
    }
    
    updateDashboardData() {
        // Trigger dashboard update event
        document.dispatchEvent(new CustomEvent('competitive_data_updated', {
            detail: {
                competitors: this.competitors,
                alerts: this.storage.alerts.slice(0, 10),
                marketData: this.marketData,
                timestamp: new Date().toISOString()
            }
        }));
    }
    
    sendImmediateNotifications(alerts) {
        // Send to configured notification channels
        alerts.forEach(alert => {
            if (this.config.slackWebhookUrl) {
                this.sendSlackAlert(alert);
            }
            
            // Could also send to email, mobile push, etc.
        });
    }
    
    sendSlackAlert(alert) {
        const payload = {
            text: `🚨 Competitive Alert: ${alert.message}`,
            channel: '#competitive-intelligence',
            username: 'Blaze CI Bot',
            attachments: [{
                color: alert.priority === 'high' ? 'danger' : 'warning',
                fields: [{
                    title: 'Priority',
                    value: alert.priority.toUpperCase(),
                    short: true
                }, {
                    title: 'Competitor',
                    value: alert.competitor || 'Multiple',
                    short: true
                }]
            }]
        };
        
        fetch(this.config.slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(error => {
            console.error('Failed to send Slack alert:', error);
        });
    }
    
    // Helper methods
    generateAlertId() {
        return 'alert_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    
    generateInsightId() {
        return 'insight_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    
    saveToStorage() {
        localStorage.setItem('blaze_competitive_alerts', JSON.stringify(this.storage.alerts));
        localStorage.setItem('blaze_competitive_history', JSON.stringify(this.storage.history));
        localStorage.setItem('blaze_competitive_reports', JSON.stringify(this.storage.reports));
        localStorage.setItem('blaze_competitive_insights', JSON.stringify(this.storage.insights));
    }
    
    recordError(errorType, errorMessage) {
        const error = {
            type: errorType,
            message: errorMessage,
            timestamp: new Date().toISOString(),
            stack: new Error().stack
        };
        
        const errors = JSON.parse(localStorage.getItem('blaze_ci_errors') || '[]');
        errors.unshift(error);
        localStorage.setItem('blaze_ci_errors', JSON.stringify(errors.slice(0, 100)));
    }
    
    // Public API methods
    getCompetitors() {
        return this.competitors;
    }
    
    getAlerts(unreadOnly = false) {
        return unreadOnly ? this.storage.alerts.filter(alert => !alert.read) : this.storage.alerts;
    }
    
    markAlertAsRead(alertId) {
        const alert = this.storage.alerts.find(a => a.id === alertId);
        if (alert) {
            alert.read = true;
            this.saveToStorage();
        }
    }
    
    getCompetitorInsights(competitorKey) {
        return this.storage.insights[competitorKey] || [];
    }
    
    getMarketData() {
        return this.marketData;
    }
    
    generateCompetitiveReport() {
        const report = {
            id: 'report_' + Date.now(),
            generated_at: new Date().toISOString(),
            market_overview: this.marketData,
            competitor_analysis: {},
            strategic_recommendations: this.generateStrategicRecommendations(),
            key_insights: [],
            alerts_summary: {
                total: this.storage.alerts.length,
                high_priority: this.storage.alerts.filter(a => a.priority === 'high').length,
                unread: this.storage.alerts.filter(a => !a.read).length
            }
        };
        
        // Add competitor analysis
        Object.entries(this.competitors).forEach(([key, competitor]) => {
            report.competitor_analysis[key] = {
                name: competitor.name,
                threat_level: competitor.threat_level,
                market_share: competitor.marketShare,
                strengths: competitor.strengths,
                weaknesses: competitor.weaknesses,
                feature_scores: competitor.features,
                recent_insights: this.getCompetitorInsights(key).slice(0, 5)
            };
        });
        
        // Store report
        this.storage.reports.unshift(report);
        this.storage.reports = this.storage.reports.slice(0, 20); // Keep last 20 reports
        this.saveToStorage();
        
        return report;
    }
}

// Initialize the competitive intelligence system
document.addEventListener('DOMContentLoaded', function() {
    window.BlazeCompetitiveIntelligence = new BlazeCompetitiveIntelligence({
        debugMode: false, // Set to true for development
        autoTracking: true,
        updateInterval: 300000 // 5 minutes
        // Add notification URLs in production:
        // slackWebhookUrl: 'your_slack_webhook'
    });
    
    console.log('Blaze Competitive Intelligence System initialized');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeCompetitiveIntelligence;
}