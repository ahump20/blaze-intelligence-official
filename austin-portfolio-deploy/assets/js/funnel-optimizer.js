/**
 * Blaze Intelligence Funnel Optimizer
 * Identifies and fixes conversion bottlenecks in real-time
 */

class FunnelOptimizer {
    constructor() {
        this.funnelStages = [
            { id: 'page_view', name: 'Page View', target: 1.0 },
            { id: 'video_impression', name: 'Video Seen', target: 0.9 },
            { id: 'video_play', name: 'Video Started', target: 0.7 },
            { id: 'video_25', name: '25% Watched', target: 0.5 },
            { id: 'video_50', name: '50% Watched', target: 0.4 },
            { id: 'video_75', name: '75% Watched', target: 0.3 },
            { id: 'video_complete', name: 'Video Completed', target: 0.25 },
            { id: 'recommendation_view', name: 'Recommendations Viewed', target: 0.2 },
            { id: 'recommendation_click', name: 'Recommendation Clicked', target: 0.05 },
            { id: 'cta_view', name: 'CTA Viewed', target: 0.15 },
            { id: 'cta_click', name: 'CTA Clicked', target: 0.04 }
        ];
        
        this.bottlenecks = [];
        this.optimizations = [];
        this.userJourneys = new Map();
        this.dropOffPoints = {};
    }

    init() {
        this.trackUserJourneys();
        this.identifyBottlenecks();
        this.generateOptimizations();
        this.implementAutoFixes();
        this.setupRealTimeMonitoring();
    }

    // Track user journeys through the funnel
    trackUserJourneys() {
        // Listen for all events
        const originalPush = window.dataLayer.push;
        window.dataLayer.push = (...args) => {
            args.forEach(event => {
                if (event.event) {
                    this.processEvent(event);
                }
            });
            return originalPush.apply(window.dataLayer, args);
        };

        // Process historical events
        const events = JSON.parse(localStorage.getItem('blazeExperimentEvents') || '[]');
        events.forEach(event => this.processEvent(event));
    }

    // Process individual events
    processEvent(event) {
        const userId = event.userId || this.getUserId();
        
        if (!this.userJourneys.has(userId)) {
            this.userJourneys.set(userId, {
                id: userId,
                events: [],
                currentStage: 'page_view',
                dropOffPoint: null,
                sessionDuration: 0,
                deviceType: event.deviceType || this.getDeviceType()
            });
        }

        const journey = this.userJourneys.get(userId);
        journey.events.push({
            type: event.event,
            timestamp: event.timestamp || Date.now(),
            properties: event.properties || {}
        });

        // Update current stage
        this.updateJourneyStage(journey, event.event);
        
        // Check for drop-offs
        this.checkDropOff(journey);
    }

    // Update journey stage based on event
    updateJourneyStage(journey, eventType) {
        const stageMap = {
            'page_view': 'page_view',
            'video_impression': 'video_impression',
            'video_play': 'video_play',
            'video_progress': (props) => {
                if (props.milestone >= 75) return 'video_75';
                if (props.milestone >= 50) return 'video_50';
                if (props.milestone >= 25) return 'video_25';
                return null;
            },
            'video_complete': 'video_complete',
            'recommendation_impression': 'recommendation_view',
            'recommendation_click': 'recommendation_click',
            'cta_impression': 'cta_view',
            'cta_click': 'cta_click'
        };

        let newStage = stageMap[eventType];
        if (typeof newStage === 'function') {
            const lastEvent = journey.events[journey.events.length - 1];
            newStage = newStage(lastEvent.properties);
        }

        if (newStage) {
            const currentIndex = this.funnelStages.findIndex(s => s.id === journey.currentStage);
            const newIndex = this.funnelStages.findIndex(s => s.id === newStage);
            
            if (newIndex > currentIndex) {
                journey.currentStage = newStage;
            }
        }
    }

    // Check for drop-offs
    checkDropOff(journey) {
        const lastEvent = journey.events[journey.events.length - 1];
        const timeSinceLastEvent = Date.now() - lastEvent.timestamp;
        
        // Consider dropped off after 5 minutes of inactivity
        if (timeSinceLastEvent > 5 * 60 * 1000) {
            journey.dropOffPoint = journey.currentStage;
            
            // Record drop-off
            if (!this.dropOffPoints[journey.currentStage]) {
                this.dropOffPoints[journey.currentStage] = 0;
            }
            this.dropOffPoints[journey.currentStage]++;
        }
    }

    // Identify bottlenecks in the funnel
    identifyBottlenecks() {
        const funnelMetrics = this.calculateFunnelMetrics();
        
        this.bottlenecks = [];
        
        for (let i = 1; i < funnelMetrics.length; i++) {
            const prevStage = funnelMetrics[i - 1];
            const currentStage = funnelMetrics[i];
            
            const dropOffRate = 1 - (currentStage.count / prevStage.count);
            const expectedDropOff = 1 - (currentStage.target / prevStage.target);
            
            // Bottleneck if actual drop-off is 20% worse than expected
            if (dropOffRate > expectedDropOff * 1.2) {
                this.bottlenecks.push({
                    stage: currentStage.name,
                    stageId: currentStage.id,
                    actualConversion: currentStage.count / prevStage.count,
                    expectedConversion: currentStage.target / prevStage.target,
                    severity: this.calculateSeverity(dropOffRate, expectedDropOff),
                    impact: prevStage.count - currentStage.count,
                    recommendations: this.generateStageRecommendations(currentStage.id)
                });
            }
        }

        // Sort by impact
        this.bottlenecks.sort((a, b) => b.impact - a.impact);
    }

    // Calculate funnel metrics
    calculateFunnelMetrics() {
        const metrics = this.funnelStages.map(stage => ({
            ...stage,
            count: 0,
            conversion: 0
        }));

        // Count users at each stage
        this.userJourneys.forEach(journey => {
            const stageIndex = this.funnelStages.findIndex(s => s.id === journey.currentStage);
            for (let i = 0; i <= stageIndex; i++) {
                metrics[i].count++;
            }
        });

        // Calculate conversion rates
        const totalUsers = this.userJourneys.size || 1;
        metrics.forEach(metric => {
            metric.conversion = metric.count / totalUsers;
        });

        return metrics;
    }

    // Calculate bottleneck severity
    calculateSeverity(actual, expected) {
        const difference = actual - expected;
        if (difference > 0.5) return 'critical';
        if (difference > 0.3) return 'high';
        if (difference > 0.15) return 'medium';
        return 'low';
    }

    // Generate recommendations for specific stage
    generateStageRecommendations(stageId) {
        const recommendations = {
            'video_impression': [
                'Move video player above the fold',
                'Add auto-play preview on hover',
                'Increase thumbnail size',
                'Add animated play button overlay'
            ],
            'video_play': [
                'Simplify play button design',
                'Add "Click to play" text overlay',
                'Pre-load video for instant start',
                'Show video duration prominently'
            ],
            'video_25': [
                'Improve video intro hook',
                'Add chapter markers for navigation',
                'Show progress bar always',
                'Reduce initial buffer time'
            ],
            'video_50': [
                'Add mid-video engagement prompt',
                'Show "halfway there" indicator',
                'Implement adaptive quality',
                'Add picture-in-picture option'
            ],
            'video_complete': [
                'Show time remaining',
                'Add end screen with next video',
                'Implement completion reward',
                'Optimize video length'
            ],
            'recommendation_view': [
                'Auto-scroll to recommendations',
                'Increase recommendation visibility',
                'Add "You might also like" heading',
                'Show match percentage'
            ],
            'recommendation_click': [
                'Improve thumbnail quality',
                'Add hover previews',
                'Show view counts',
                'Personalize recommendations better'
            ],
            'cta_view': [
                'Make CTAs more prominent',
                'Add exit-intent popup',
                'Place CTAs after key moments',
                'Use contrasting colors'
            ],
            'cta_click': [
                'Test different CTA text',
                'Add urgency/scarcity',
                'Reduce friction in form',
                'Offer immediate value'
            ]
        };

        return recommendations[stageId] || ['Analyze user behavior', 'A/B test variations'];
    }

    // Generate overall optimizations
    generateOptimizations() {
        this.optimizations = [];

        // For each bottleneck, create optimization plan
        this.bottlenecks.forEach(bottleneck => {
            const optimization = {
                id: `opt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                bottleneck: bottleneck,
                priority: this.calculatePriority(bottleneck),
                estimatedImpact: this.estimateImpact(bottleneck),
                implementation: this.createImplementationPlan(bottleneck),
                autoFixAvailable: this.canAutoFix(bottleneck.stageId),
                status: 'pending'
            };

            this.optimizations.push(optimization);
        });

        // Sort by priority
        this.optimizations.sort((a, b) => b.priority - a.priority);
    }

    // Calculate optimization priority
    calculatePriority(bottleneck) {
        const severityScore = {
            'critical': 4,
            'high': 3,
            'medium': 2,
            'low': 1
        }[bottleneck.severity];

        const impactScore = Math.min(bottleneck.impact / 100, 4);
        
        return severityScore * 0.6 + impactScore * 0.4;
    }

    // Estimate impact of fixing bottleneck
    estimateImpact(bottleneck) {
        const conversionLift = bottleneck.expectedConversion - bottleneck.actualConversion;
        const affectedUsers = bottleneck.impact;
        
        return {
            additionalConversions: Math.round(affectedUsers * conversionLift),
            revenueImpact: Math.round(affectedUsers * conversionLift * 1000), // Assuming $1000 LTV
            percentImprovement: (conversionLift * 100).toFixed(1)
        };
    }

    // Create implementation plan
    createImplementationPlan(bottleneck) {
        return {
            immediate: bottleneck.recommendations.slice(0, 2),
            shortTerm: bottleneck.recommendations.slice(2, 4),
            testing: `Run A/B test on ${bottleneck.stage} improvements`,
            timeline: this.estimateTimeline(bottleneck.severity)
        };
    }

    // Estimate implementation timeline
    estimateTimeline(severity) {
        const timelines = {
            'critical': '1-2 days',
            'high': '3-5 days',
            'medium': '1 week',
            'low': '2 weeks'
        };
        return timelines[severity];
    }

    // Check if bottleneck can be auto-fixed
    canAutoFix(stageId) {
        const autoFixable = [
            'video_impression',
            'recommendation_view',
            'cta_view'
        ];
        return autoFixable.includes(stageId);
    }

    // Implement automatic fixes
    implementAutoFixes() {
        this.optimizations.forEach(optimization => {
            if (optimization.autoFixAvailable && optimization.priority > 3) {
                this.applyAutoFix(optimization);
            }
        });
    }

    // Apply automatic fix
    applyAutoFix(optimization) {
        const stageId = optimization.bottleneck.stageId;

        switch (stageId) {
            case 'video_impression':
                this.improveVideoVisibility();
                break;
            case 'recommendation_view':
                this.enhanceRecommendations();
                break;
            case 'cta_view':
                this.optimizeCTAs();
                break;
        }

        optimization.status = 'auto-applied';
        this.trackOptimization(optimization);
    }

    // Improve video visibility
    improveVideoVisibility() {
        // Add scroll indicator
        const videos = document.querySelectorAll('.video-embed, #playerWrap');
        videos.forEach(video => {
            if (!video.dataset.enhanced) {
                // Add pulsing play button
                const playIndicator = document.createElement('div');
                playIndicator.className = 'absolute inset-0 flex items-center justify-center pointer-events-none';
                playIndicator.innerHTML = `
                    <div class="w-20 h-20 bg-orange-500/80 rounded-full flex items-center justify-center animate-pulse">
                        <svg class="w-10 h-10 text-white ml-1" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8 5v14l11-7z"/>
                        </svg>
                    </div>
                `;
                video.style.position = 'relative';
                video.appendChild(playIndicator);
                video.dataset.enhanced = 'true';
            }
        });
    }

    // Enhance recommendation visibility
    enhanceRecommendations() {
        const recSection = document.getElementById('ai-recommendations');
        if (recSection && !recSection.dataset.enhanced) {
            // Add attention-grabbing header
            const header = recSection.querySelector('h2');
            if (header) {
                header.classList.add('animate-pulse');
                header.innerHTML = `
                    <span class="text-orange-400">🔥</span> ${header.textContent} 
                    <span class="text-sm text-cyan-400">(Personalized for you)</span>
                `;
            }

            // Auto-scroll to recommendations after video ends
            document.addEventListener('video_complete', () => {
                setTimeout(() => {
                    recSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 1000);
            });

            recSection.dataset.enhanced = 'true';
        }
    }

    // Optimize CTAs
    optimizeCTAs() {
        const ctas = document.querySelectorAll('[data-cta]');
        ctas.forEach(cta => {
            if (!cta.dataset.optimized) {
                // Add hover animation
                cta.classList.add('transform', 'transition-all', 'hover:scale-105');
                
                // Add urgency text
                if (cta.dataset.cta === 'calendar') {
                    const text = cta.querySelector('span:last-child');
                    if (text && !text.textContent.includes('Limited')) {
                        text.textContent = '🔥 Limited Slots - ' + text.textContent;
                    }
                }

                cta.dataset.optimized = 'true';
            }
        });
    }

    // Setup real-time monitoring
    setupRealTimeMonitoring() {
        // Check for bottlenecks every 5 minutes
        setInterval(() => {
            this.identifyBottlenecks();
            this.generateOptimizations();
            this.reportBottlenecks();
        }, 5 * 60 * 1000);

        // Monitor page performance
        this.monitorPagePerformance();
    }

    // Monitor page performance metrics
    monitorPagePerformance() {
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            const metrics = {
                pageLoadTime: timing.loadEventEnd - timing.navigationStart,
                domReadyTime: timing.domContentLoadedEventEnd - timing.navigationStart,
                firstPaint: timing.responseEnd - timing.navigationStart
            };

            // Alert if performance degrades
            if (metrics.pageLoadTime > 3000) {
                this.addOptimization({
                    type: 'performance',
                    issue: 'Slow page load',
                    recommendation: 'Optimize assets and enable caching',
                    metrics: metrics
                });
            }
        }
    }

    // Add new optimization
    addOptimization(optimization) {
        this.optimizations.push({
            id: `opt_${Date.now()}`,
            ...optimization,
            priority: 4,
            status: 'new'
        });
    }

    // Track optimization implementation
    trackOptimization(optimization) {
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'funnel_optimization_applied',
                optimization_id: optimization.id,
                bottleneck_stage: optimization.bottleneck.stageId,
                auto_applied: optimization.autoFixAvailable,
                estimated_impact: optimization.estimatedImpact
            });
        }
    }

    // Report bottlenecks to dashboard
    reportBottlenecks() {
        const report = {
            timestamp: Date.now(),
            bottlenecks: this.bottlenecks,
            optimizations: this.optimizations,
            funnelMetrics: this.calculateFunnelMetrics(),
            dropOffPoints: this.dropOffPoints
        };

        // Store report
        const reports = JSON.parse(localStorage.getItem('blazeFunnelReports') || '[]');
        reports.push(report);
        
        // Keep last 10 reports
        if (reports.length > 10) {
            reports.shift();
        }
        
        localStorage.setItem('blazeFunnelReports', JSON.stringify(reports));

        return report;
    }

    // Get user ID
    getUserId() {
        let userId = localStorage.getItem('blazeUserId');
        if (!userId) {
            userId = 'user_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36);
            localStorage.setItem('blazeUserId', userId);
        }
        return userId;
    }

    // Get device type
    getDeviceType() {
        const width = window.innerWidth;
        if (width < 768) return 'mobile';
        if (width < 1024) return 'tablet';
        return 'desktop';
    }

    // Export optimization report
    exportReport() {
        return {
            bottlenecks: this.bottlenecks,
            optimizations: this.optimizations,
            funnelMetrics: this.calculateFunnelMetrics(),
            dropOffPoints: this.dropOffPoints,
            userJourneys: Array.from(this.userJourneys.values())
        };
    }
}

// Initialize
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.FunnelOptimizer = new FunnelOptimizer();
        window.FunnelOptimizer.init();
    });
} else {
    window.FunnelOptimizer = new FunnelOptimizer();
    window.FunnelOptimizer.init();
}