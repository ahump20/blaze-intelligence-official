/**
 * Blaze Intelligence AI-Driven Prospect Scoring System
 * Championship-level prospect qualification and prioritization
 */

class BlazeAIScoring {
    constructor() {
        this.scoringModel = this.initializeScoringModel();
        this.behaviorWeights = this.defineBehaviorWeights();
        this.conversionPredictors = this.defineConversionPredictors();
        this.init();
    }

    initializeScoringModel() {
        return {
            // Base scoring ranges (0-100 scale)
            engagement: { min: 0, max: 35, weight: 0.25 },
            intent: { min: 0, max: 30, weight: 0.30 },
            fit: { min: 0, max: 20, weight: 0.20 },
            timing: { min: 0, max: 15, weight: 0.25 },
            
            // Threshold classifications
            thresholds: {
                hot: 85,      // Immediate follow-up required
                warm: 65,     // High priority prospect
                qualified: 45, // Standard follow-up
                nurture: 25    // Long-term nurturing
            }
        };
    }

    defineBehaviorWeights() {
        return {
            // Page engagement behaviors
            performance_demo_completed: 15,
            calculator_used: 20,
            mlb_showcase_viewed: 18,
            sources_researched: 12,
            
            // Interaction depth
            multiple_tests_run: 10,
            time_over_5_minutes: 8,
            scroll_depth_over_75: 6,
            repeat_visits: 12,
            
            // High-intent signals
            demo_request_clicked: 25,
            email_contact_initiated: 30,
            pricing_inquired: 22,
            feature_comparison_studied: 15,
            
            // Technical engagement
            api_documentation_viewed: 18,
            integration_info_accessed: 20,
            performance_metrics_analyzed: 16,
            
            // Exit behaviors (negative scoring)
            exit_intent_dismissed: -5,
            quick_bounce: -10,
            no_interaction: -8
        };
    }

    defineConversionPredictors() {
        return {
            // Demographic indicators
            organizationType: {
                'enterprise': 20,
                'college': 15,
                'high_school': 12,
                'youth_org': 10,
                'individual': 5
            },
            
            // Behavioral patterns
            sessionPatterns: {
                'deep_explorer': 25,      // Multiple pages, long sessions
                'calculator_focused': 20, // Went straight to pricing
                'technical_validator': 22, // Performance + sources
                'comparison_shopper': 18, // Multiple competitive checks
                'quick_browser': 5        // Minimal engagement
            },
            
            // Timing indicators
            visitTiming: {
                'business_hours': 8,
                'evaluation_period': 12, // Multiple visits over days
                'urgent_timeline': 15     // Quick progression through funnel
            }
        };
    }

    init() {
        this.startScoring();
        this.setupRealTimeScoring();
        this.setupScoreNotifications();
    }

    async startScoring() {
        // Get current session data
        const sessionData = this.getSessionData();
        const analyticsData = this.getAnalyticsData();
        
        if (sessionData && analyticsData) {
            const score = await this.calculateProspectScore(sessionData, analyticsData);
            this.updateProspectScore(score);
            this.triggerScoreBasedActions(score);
        }
    }

    getSessionData() {
        try {
            const blazeSession = localStorage.getItem('blaze-session');
            return blazeSession ? JSON.parse(blazeSession) : null;
        } catch (error) {
            console.log('Session data unavailable');
            return null;
        }
    }

    getAnalyticsData() {
        try {
            const analyticsData = localStorage.getItem('blaze-analytics');
            return analyticsData ? JSON.parse(analyticsData) : [];
        } catch (error) {
            console.log('Analytics data unavailable');
            return [];
        }
    }

    async calculateProspectScore(sessionData, analyticsEvents) {
        let totalScore = 0;
        const scoreBreakdown = {
            engagement: 0,
            intent: 0,
            fit: 0,
            timing: 0,
            details: {}
        };

        // 1. ENGAGEMENT SCORING (0-35 points)
        const engagementScore = this.calculateEngagementScore(sessionData, analyticsEvents);
        scoreBreakdown.engagement = Math.min(engagementScore, 35);
        totalScore += scoreBreakdown.engagement;

        // 2. INTENT SCORING (0-30 points)
        const intentScore = this.calculateIntentScore(sessionData, analyticsEvents);
        scoreBreakdown.intent = Math.min(intentScore, 30);
        totalScore += scoreBreakdown.intent;

        // 3. FIT SCORING (0-20 points)
        const fitScore = this.calculateFitScore(sessionData, analyticsEvents);
        scoreBreakdown.fit = Math.min(fitScore, 20);
        totalScore += scoreBreakdown.fit;

        // 4. TIMING SCORING (0-15 points)
        const timingScore = this.calculateTimingScore(sessionData, analyticsEvents);
        scoreBreakdown.timing = Math.min(timingScore, 15);
        totalScore += scoreBreakdown.timing;

        // Apply AI model adjustments
        const adjustedScore = this.applyAIAdjustments(totalScore, scoreBreakdown, sessionData);
        
        return {
            totalScore: Math.min(Math.max(adjustedScore, 0), 100),
            breakdown: scoreBreakdown,
            classification: this.classifyProspect(adjustedScore),
            confidence: this.calculateConfidence(sessionData, analyticsEvents),
            recommendation: this.generateRecommendation(adjustedScore, scoreBreakdown),
            timestamp: Date.now()
        };
    }

    calculateEngagementScore(sessionData, events) {
        let score = 0;

        // Pages visited (depth of exploration)
        const uniquePages = sessionData.pagesVisited?.length || 0;
        score += Math.min(uniquePages * 6, 24); // Up to 24 points for 4+ pages

        // Time-based engagement
        const totalTime = events.reduce((sum, event) => {
            return sum + (event.data?.timeSpent || 0);
        }, 0);
        
        if (totalTime > 300000) score += 10; // 5+ minutes
        else if (totalTime > 120000) score += 6; // 2+ minutes
        else if (totalTime > 60000) score += 3; // 1+ minute

        // Interaction frequency
        const interactions = events.filter(e => 
            e.event.includes('click') || e.event.includes('interaction')
        ).length;
        score += Math.min(interactions * 0.5, 8);

        // Scroll engagement
        const scrollEvents = events.filter(e => e.event === 'scroll_milestone');
        score += Math.min(scrollEvents.length * 1.5, 6);

        return Math.min(score, 35);
    }

    calculateIntentScore(sessionData, events) {
        let score = 0;

        // High-intent behaviors
        const highIntentEvents = events.filter(e => 
            e.event === 'calculator_usage' ||
            e.event === 'demo_interaction' ||
            e.event === 'high_value_click' ||
            e.conversionSignal
        );
        score += Math.min(highIntentEvents.length * 8, 24);

        // Email/contact interactions
        const contactEvents = events.filter(e => 
            e.data?.href?.includes('mailto') ||
            e.event === 'demo_requested'
        );
        score += Math.min(contactEvents.length * 10, 20);

        // Form completion
        const formEvents = events.filter(e => e.event === 'form_interaction');
        score += Math.min(formEvents.length * 2, 8);

        // Repeat engagement patterns
        if (sessionData.visitCount > 1) score += 5;
        if (sessionData.visitCount > 3) score += 3;

        return Math.min(score, 30);
    }

    calculateFitScore(sessionData, events) {
        let score = 10; // Base fit score

        // Organization type inference from behavior
        const calculatorUsage = events.filter(e => e.event === 'calculator_usage');
        if (calculatorUsage.length > 0) {
            const lastCalcEvent = calculatorUsage[calculatorUsage.length - 1];
            if (lastCalcEvent.data?.field === 'orgType') {
                const orgType = lastCalcEvent.data.value;
                score += this.conversionPredictors.organizationType[orgType] || 5;
            }
        }

        // Technical sophistication indicators
        const technicalEvents = events.filter(e => 
            e.event === 'performance_analysis' ||
            e.data?.element?.includes('metrics') ||
            e.event === 'sources_researched'
        );
        score += Math.min(technicalEvents.length * 2, 8);

        return Math.min(score, 20);
    }

    calculateTimingScore(sessionData, events) {
        let score = 0;
        const now = Date.now();

        // Visit recency (fresher is better)
        if (sessionData.lastVisit) {
            const hoursSinceLastVisit = (now - new Date(sessionData.lastVisit).getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastVisit < 1) score += 8;
            else if (hoursSinceLastVisit < 24) score += 5;
            else if (hoursSinceLastVisit < 72) score += 3;
        }

        // Visit frequency pattern
        if (sessionData.visitCount > 1) {
            score += 4; // Return visitor
            if (sessionData.visitCount > 3) score += 2; // Highly engaged
        }

        // Current session length
        const currentSession = events.filter(e => 
            e.timestamp > (now - 3600000) // Last hour
        );
        if (currentSession.length > 5) score += 3;

        return Math.min(score, 15);
    }

    applyAIAdjustments(baseScore, breakdown, sessionData) {
        let adjustedScore = baseScore;

        // Behavioral pattern recognition
        if (breakdown.engagement > 25 && breakdown.intent > 20) {
            adjustedScore += 5; // High engagement + high intent bonus
        }

        if (breakdown.timing > 10 && breakdown.intent > 15) {
            adjustedScore += 3; // Urgent + interested bonus
        }

        // Negative adjustments for inconsistent patterns
        if (breakdown.engagement > 20 && breakdown.intent < 10) {
            adjustedScore -= 3; // High engagement but low intent (possible red flag)
        }

        // Championship stage bonus
        if (sessionData.conversionStage === 'decision') {
            adjustedScore += 8;
        } else if (sessionData.conversionStage === 'consideration') {
            adjustedScore += 4;
        }

        return adjustedScore;
    }

    classifyProspect(score) {
        const thresholds = this.scoringModel.thresholds;
        
        if (score >= thresholds.hot) return 'HOT';
        if (score >= thresholds.warm) return 'WARM';
        if (score >= thresholds.qualified) return 'QUALIFIED';
        if (score >= thresholds.nurture) return 'NURTURE';
        return 'COLD';
    }

    calculateConfidence(sessionData, events) {
        let confidence = 0.5; // Base 50% confidence

        // More data = higher confidence
        const dataPoints = (sessionData.pagesVisited?.length || 0) + events.length;
        confidence += Math.min(dataPoints * 0.02, 0.3);

        // Recent data = higher confidence
        const recentEvents = events.filter(e => 
            e.timestamp > (Date.now() - 3600000) // Last hour
        );
        if (recentEvents.length > 0) confidence += 0.1;

        // Multiple visits = higher confidence
        if ((sessionData.visitCount || 0) > 1) confidence += 0.1;

        return Math.min(confidence, 0.95);
    }

    generateRecommendation(score, breakdown) {
        const classification = this.classifyProspect(score);
        
        const recommendations = {
            'HOT': {
                action: 'IMMEDIATE_CONTACT',
                priority: 'P0 - Within 15 minutes',
                message: 'High-intent prospect with strong engagement. Contact immediately.',
                tactics: ['Personal phone call', 'Custom demo proposal', 'Executive introduction']
            },
            'WARM': {
                action: 'PRIORITY_FOLLOW_UP',
                priority: 'P1 - Within 2 hours',
                message: 'Qualified prospect showing genuine interest. Priority follow-up required.',
                tactics: ['Personalized email', 'Targeted case study', 'Technical deep-dive offer']
            },
            'QUALIFIED': {
                action: 'STANDARD_FOLLOW_UP',
                priority: 'P2 - Within 24 hours',
                message: 'Legitimate prospect in evaluation mode. Standard follow-up protocol.',
                tactics: ['Value proposition email', 'Resource sharing', 'Nurture sequence']
            },
            'NURTURE': {
                action: 'NURTURE_CAMPAIGN',
                priority: 'P3 - 48-72 hours',
                message: 'Early-stage prospect requiring education and nurturing.',
                tactics: ['Educational content', 'Industry insights', 'Performance benchmarks']
            },
            'COLD': {
                action: 'MONITOR',
                priority: 'P4 - Monitor for changes',
                message: 'Low engagement prospect. Monitor for behavior changes.',
                tactics: ['Automated monitoring', 'Re-engagement campaigns', 'Value education']
            }
        };

        return recommendations[classification] || recommendations['COLD'];
    }

    updateProspectScore(scoreData) {
        // Store the score for persistence
        localStorage.setItem('blaze-prospect-score', JSON.stringify(scoreData));
        
        // Update UI if scoring panel exists
        this.updateScoringDisplay(scoreData);
        
        // Log the scoring for analytics
        console.log('🎯 Blaze AI Scoring:', scoreData);
    }

    updateScoringDisplay(scoreData) {
        // Create or update scoring display panel
        let panel = document.getElementById('blaze-ai-score-panel');
        
        if (!panel) {
            panel = document.createElement('div');
            panel.id = 'blaze-ai-score-panel';
            panel.style.cssText = `
                position: fixed; top: 100px; right: 20px; z-index: 9999;
                background: linear-gradient(135deg, rgba(0,0,0,0.9), rgba(26,26,46,0.9));
                color: white; padding: 1.5rem; border-radius: 12px; width: 280px;
                border: 2px solid ${this.getClassificationColor(scoreData.classification)};
                box-shadow: 0 8px 25px rgba(0,0,0,0.3); backdrop-filter: blur(10px);
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            `;
            document.body.appendChild(panel);
        }

        panel.innerHTML = `
            <div style="text-align: center; margin-bottom: 1rem;">
                <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem;">AI PROSPECT SCORE</div>
                <div style="font-size: 2.5rem; font-weight: 900; color: ${this.getClassificationColor(scoreData.classification)};">
                    ${scoreData.totalScore}
                </div>
                <div style="font-size: 0.9rem; font-weight: bold; color: ${this.getClassificationColor(scoreData.classification)};">
                    ${scoreData.classification}
                </div>
                <div style="font-size: 0.7rem; color: #94a3b8;">
                    ${Math.round(scoreData.confidence * 100)}% Confidence
                </div>
            </div>
            
            <div style="margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="font-size: 0.7rem;">Engagement</span>
                    <span style="font-size: 0.7rem;">${scoreData.breakdown.engagement}/35</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; overflow: hidden;">
                    <div style="width: ${(scoreData.breakdown.engagement/35)*100}%; height: 100%; background: #00ffff;"></div>
                </div>
            </div>
            
            <div style="margin: 1rem 0;">
                <div style="display: flex; justify-content: space-between; margin-bottom: 0.25rem;">
                    <span style="font-size: 0.7rem;">Intent</span>
                    <span style="font-size: 0.7rem;">${scoreData.breakdown.intent}/30</span>
                </div>
                <div style="background: rgba(255,255,255,0.1); height: 4px; border-radius: 2px; overflow: hidden;">
                    <div style="width: ${(scoreData.breakdown.intent/30)*100}%; height: 100%; background: #10b981;"></div>
                </div>
            </div>
            
            <div style="margin: 1rem 0 1.5rem 0;">
                <div style="font-size: 0.7rem; color: #94a3b8; margin-bottom: 0.5rem;">RECOMMENDATION</div>
                <div style="font-size: 0.8rem; font-weight: bold; color: #fbbf24;">${scoreData.recommendation.action}</div>
                <div style="font-size: 0.7rem; color: #94a3b8;">${scoreData.recommendation.priority}</div>
            </div>
            
            <button onclick="blazeAIScoring.exportScore()" style="
                width: 100%; background: linear-gradient(45deg, #667eea, #764ba2);
                color: white; border: none; padding: 0.75rem; border-radius: 6px;
                font-size: 0.8rem; font-weight: bold; cursor: pointer;
            ">Export Score Data</button>
        `;
    }

    getClassificationColor(classification) {
        const colors = {
            'HOT': '#ef4444',
            'WARM': '#f59e0b',
            'QUALIFIED': '#10b981',
            'NURTURE': '#3b82f6',
            'COLD': '#6b7280'
        };
        return colors[classification] || '#6b7280';
    }

    setupRealTimeScoring() {
        // Update score every 30 seconds based on new activity
        setInterval(() => {
            this.startScoring();
        }, 30000);

        // Monitor for high-value events and update immediately
        document.addEventListener('click', (e) => {
            if (e.target.matches('a[href*="mailto"], .action-btn, button[onclick*="demo"]')) {
                setTimeout(() => this.startScoring(), 1000); // Slight delay for event logging
            }
        });
    }

    setupScoreNotifications() {
        // Monitor for score threshold changes
        let lastScore = 0;
        
        setInterval(() => {
            const scoreData = JSON.parse(localStorage.getItem('blaze-prospect-score') || '{}');
            if (scoreData.totalScore && scoreData.totalScore !== lastScore) {
                
                // Check if crossed into HOT territory
                if (lastScore < 85 && scoreData.totalScore >= 85) {
                    this.triggerHotProspectAlert(scoreData);
                }
                
                // Check if crossed into WARM territory
                if (lastScore < 65 && scoreData.totalScore >= 65) {
                    this.triggerWarmProspectAlert(scoreData);
                }
                
                lastScore = scoreData.totalScore;
            }
        }, 10000);
    }

    triggerScoreBasedActions(scoreData) {
        if (scoreData.classification === 'HOT') {
            this.triggerHotProspectWorkflow(scoreData);
        } else if (scoreData.classification === 'WARM') {
            this.triggerWarmProspectWorkflow(scoreData);
        }
    }

    triggerHotProspectAlert(scoreData) {
        console.log('🚨 HOT PROSPECT ALERT:', scoreData);
        
        // Could integrate with Slack, email alerts, etc.
        this.sendAlert({
            type: 'hot_prospect',
            score: scoreData.totalScore,
            confidence: scoreData.confidence,
            recommendation: scoreData.recommendation,
            timestamp: Date.now()
        });
    }

    triggerWarmProspectAlert(scoreData) {
        console.log('🔥 WARM PROSPECT ALERT:', scoreData);
        
        this.sendAlert({
            type: 'warm_prospect',
            score: scoreData.totalScore,
            confidence: scoreData.confidence,
            recommendation: scoreData.recommendation,
            timestamp: Date.now()
        });
    }

    triggerHotProspectWorkflow(scoreData) {
        // Immediate high-priority actions for hot prospects
        setTimeout(() => {
            if (scoreData.totalScore >= 90) {
                this.showUrgentConversionModal(scoreData);
            }
        }, 5000);
    }

    triggerWarmProspectWorkflow(scoreData) {
        // Priority actions for warm prospects
        setTimeout(() => {
            this.showPersonalizedOffer(scoreData);
        }, 15000);
    }

    showUrgentConversionModal(scoreData) {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999;
            background: rgba(0,0,0,0.95); display: flex; align-items: center; justify-content: center;
            animation: urgentPulse 1s infinite alternate;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #ef4444, #dc2626);
                padding: 3rem; border-radius: 20px; text-align: center; max-width: 600px;
                border: 3px solid #fff; box-shadow: 0 20px 60px rgba(239, 68, 68, 0.5);
                animation: urgentGlow 2s infinite alternate;
            ">
                <h2 style="color: white; margin-bottom: 1rem; font-size: 2.2rem;">
                    🚨 VIP PROSPECT DETECTED
                </h2>
                <p style="color: white; margin-bottom: 2rem; font-size: 1.3rem; line-height: 1.6;">
                    <strong>Score: ${scoreData.totalScore}/100</strong><br>
                    You've shown exceptional engagement with our championship platform.<br>
                    Austin wants to personally demonstrate our live MLB intelligence.
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center; flex-wrap: wrap;">
                    <a href="mailto:ahump20@outlook.com?subject=VIP Demo Request - Score ${scoreData.totalScore}" onclick="blazeAIScoring.trackConversion('vip_conversion')" style="
                        background: linear-gradient(45deg, #fbbf24, #f59e0b);
                        color: white; padding: 1.5rem 2.5rem; border-radius: 12px;
                        text-decoration: none; font-weight: bold; font-size: 1.2rem;
                        box-shadow: 0 4px 15px rgba(0,0,0,0.3);
                    ">📞 Schedule Personal Demo</a>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: rgba(255,255,255,0.2); color: white;
                        border: 2px solid rgba(255,255,255,0.5); padding: 1.5rem 2rem;
                        border-radius: 12px; cursor: pointer; font-size: 1.1rem;
                    ">Continue Exploring</button>
                </div>
            </div>
        `;

        // Add urgent animations
        if (!document.querySelector('#urgentAnimations')) {
            const style = document.createElement('style');
            style.id = 'urgentAnimations';
            style.textContent = `
                @keyframes urgentPulse {
                    from { background: rgba(0,0,0,0.95); }
                    to { background: rgba(239,68,68,0.1); }
                }
                @keyframes urgentGlow {
                    from { box-shadow: 0 20px 60px rgba(239, 68, 68, 0.5); }
                    to { box-shadow: 0 20px 60px rgba(239, 68, 68, 0.8), 0 0 100px rgba(239, 68, 68, 0.3); }
                }
            `;
            document.head.appendChild(style);
        }

        document.body.appendChild(modal);
    }

    showPersonalizedOffer(scoreData) {
        // Less urgent but still priority offer for warm prospects
        console.log('Showing personalized offer for warm prospect:', scoreData);
        // Implementation would show targeted content based on behavior
    }

    sendAlert(alertData) {
        // Send alerts to external systems (Slack, email, CRM)
        if (typeof fetch !== 'undefined') {
            fetch('https://hooks.zapier.com/hooks/catch/blaze-ai-scoring/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'blaze-ai-scoring',
                    timestamp: new Date().toISOString(),
                    alert: alertData
                })
            }).catch(err => console.log('Alert webhook failed:', err));
        }
    }

    trackConversion(type) {
        const scoreData = JSON.parse(localStorage.getItem('blaze-prospect-score') || '{}');
        
        // Log the conversion with scoring context
        console.log(`🎯 CONVERSION: ${type}`, {
            score: scoreData.totalScore,
            classification: scoreData.classification,
            confidence: scoreData.confidence
        });

        // Send to analytics
        if (window.blazeAnalytics) {
            blazeAnalytics.trackConversion(`ai_scored_${type}`);
        }
    }

    exportScore() {
        const scoreData = JSON.parse(localStorage.getItem('blaze-prospect-score') || '{}');
        const sessionData = JSON.parse(localStorage.getItem('blaze-session') || '{}');
        
        const exportData = {
            aiScore: scoreData,
            session: sessionData,
            exportTimestamp: new Date().toISOString(),
            platform: 'blaze-intelligence'
        };

        // Create downloadable file
        const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blaze-prospect-score-${scoreData.totalScore}-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }
}

// Auto-initialize AI scoring
let blazeAIScoring;
document.addEventListener('DOMContentLoaded', () => {
    // Delay initialization to ensure other systems are loaded
    setTimeout(() => {
        blazeAIScoring = new BlazeAIScoring();
    }, 3000);
});

// Global access
window.BlazeAIScoring = BlazeAIScoring;
window.blazeAIScoring = blazeAIScoring;