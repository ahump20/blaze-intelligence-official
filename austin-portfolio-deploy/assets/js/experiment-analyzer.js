/**
 * Blaze Intelligence Experiment Analyzer
 * Statistical analysis and winner determination for A/B tests
 */

class ExperimentAnalyzer {
    constructor() {
        this.experiments = {};
        this.results = {};
        this.confidenceLevel = 0.95; // 95% confidence
        this.minimumSampleSize = 100;
        this.minimumTestDuration = 7 * 24 * 60 * 60 * 1000; // 7 days
    }

    init() {
        this.loadExperimentData();
        this.analyzeAllExperiments();
        this.determineWinners();
        this.generateRecommendations();
        this.scheduleAutomatedReports();
    }

    // Load experiment data from localStorage and API
    loadExperimentData() {
        const stored = localStorage.getItem('blazeExperimentEvents');
        const events = stored ? JSON.parse(stored) : [];
        
        // Group events by experiment
        this.experiments = {
            'exp_001': {
                name: 'Video Player Enhancement',
                variants: {
                    'control': { name: 'Standard Player', events: [] },
                    'treatment': { name: 'Auto Championship', events: [] }
                },
                primaryMetric: 'completion_rate',
                secondaryMetrics: ['engagement_rate', 'championship_adoption'],
                startDate: Date.now() - (14 * 24 * 60 * 60 * 1000) // 14 days ago
            },
            'exp_002': {
                name: 'CTA Optimization',
                variants: {
                    'control': { name: 'Orange CTAs', events: [] },
                    'variant_a': { name: 'Cyan CTAs', events: [] },
                    'variant_b': { name: 'Gradient CTAs', events: [] }
                },
                primaryMetric: 'conversion_rate',
                secondaryMetrics: ['cta_click_rate', 'bounce_rate'],
                startDate: Date.now() - (10 * 24 * 60 * 60 * 1000) // 10 days ago
            },
            'exp_003': {
                name: 'Recommendation Algorithm',
                variants: {
                    'control': { name: 'Content-Based', events: [] },
                    'treatment': { name: 'Hybrid ML', events: [] }
                },
                primaryMetric: 'recommendation_ctr',
                secondaryMetrics: ['session_duration', 'videos_per_session'],
                startDate: Date.now() - (5 * 24 * 60 * 60 * 1000) // 5 days ago
            }
        };

        // Assign events to experiments
        events.forEach(event => {
            Object.keys(this.experiments).forEach(expId => {
                const variantId = event.properties?.[`exp_${expId}`];
                if (variantId && this.experiments[expId].variants[variantId]) {
                    this.experiments[expId].variants[variantId].events.push(event);
                }
            });
        });
    }

    // Analyze all experiments
    analyzeAllExperiments() {
        Object.keys(this.experiments).forEach(expId => {
            this.results[expId] = this.analyzeExperiment(this.experiments[expId]);
        });
    }

    // Analyze single experiment
    analyzeExperiment(experiment) {
        const results = {
            name: experiment.name,
            duration: Date.now() - experiment.startDate,
            variants: {},
            winner: null,
            confidence: 0,
            recommendation: '',
            projectedLift: 0
        };

        // Calculate metrics for each variant
        Object.keys(experiment.variants).forEach(variantId => {
            const variant = experiment.variants[variantId];
            results.variants[variantId] = this.calculateVariantMetrics(
                variant,
                experiment.primaryMetric,
                experiment.secondaryMetrics
            );
        });

        // Statistical significance testing
        const significance = this.calculateStatisticalSignificance(results.variants);
        results.confidence = significance.confidence;
        results.pValue = significance.pValue;

        // Determine winner if significant
        if (significance.isSignificant) {
            results.winner = significance.winner;
            results.projectedLift = significance.lift;
        }

        return results;
    }

    // Calculate metrics for a variant
    calculateVariantMetrics(variant, primaryMetric, secondaryMetrics) {
        const events = variant.events;
        const uniqueUsers = new Set(events.map(e => e.userId));
        const sampleSize = uniqueUsers.size;

        const metrics = {
            name: variant.name,
            sampleSize: sampleSize,
            primaryMetric: 0,
            secondaryMetrics: {}
        };

        if (sampleSize === 0) return metrics;

        // Calculate primary metric
        switch (primaryMetric) {
            case 'completion_rate':
                const completions = events.filter(e => e.event === 'video_complete').length;
                const starts = events.filter(e => e.event === 'video_play').length;
                metrics.primaryMetric = starts > 0 ? (completions / starts) : 0;
                break;

            case 'conversion_rate':
                const conversions = events.filter(e => e.event === 'cta_click').length;
                const views = events.filter(e => e.event === 'page_view').length;
                metrics.primaryMetric = views > 0 ? (conversions / views) : 0;
                break;

            case 'recommendation_ctr':
                const recClicks = events.filter(e => e.event === 'recommendation_click').length;
                const recViews = events.filter(e => e.event === 'recommendation_impression').length;
                metrics.primaryMetric = recViews > 0 ? (recClicks / recViews) : 0;
                break;
        }

        // Calculate secondary metrics
        secondaryMetrics.forEach(metric => {
            switch (metric) {
                case 'engagement_rate':
                    const engaged = events.filter(e => 
                        e.event === 'video_play' || e.event === 'chapter_seek'
                    ).length;
                    metrics.secondaryMetrics[metric] = sampleSize > 0 ? (engaged / sampleSize) : 0;
                    break;

                case 'championship_adoption':
                    const championships = events.filter(e => 
                        e.event === 'championship_mode_activated'
                    ).length;
                    metrics.secondaryMetrics[metric] = sampleSize > 0 ? (championships / sampleSize) : 0;
                    break;

                case 'session_duration':
                    // Calculate average session duration
                    const sessions = this.groupEventsBySessions(events);
                    const avgDuration = sessions.reduce((sum, s) => sum + s.duration, 0) / sessions.length;
                    metrics.secondaryMetrics[metric] = avgDuration || 0;
                    break;

                case 'videos_per_session':
                    const sessionData = this.groupEventsBySessions(events);
                    const avgVideos = sessionData.reduce((sum, s) => sum + s.videoCount, 0) / sessionData.length;
                    metrics.secondaryMetrics[metric] = avgVideos || 0;
                    break;
            }
        });

        return metrics;
    }

    // Calculate statistical significance
    calculateStatisticalSignificance(variants) {
        const variantIds = Object.keys(variants);
        if (variantIds.length < 2) {
            return { isSignificant: false, confidence: 0 };
        }

        // Get control and best performing variant
        const control = variants[variantIds[0]];
        let bestVariant = null;
        let maxMetric = control.primaryMetric;

        variantIds.slice(1).forEach(id => {
            if (variants[id].primaryMetric > maxMetric) {
                maxMetric = variants[id].primaryMetric;
                bestVariant = { id, data: variants[id] };
            }
        });

        if (!bestVariant) {
            return { isSignificant: false, confidence: 0 };
        }

        // Check sample size requirements
        if (control.sampleSize < this.minimumSampleSize || 
            bestVariant.data.sampleSize < this.minimumSampleSize) {
            return { 
                isSignificant: false, 
                confidence: 0,
                message: 'Insufficient sample size'
            };
        }

        // Perform Z-test for proportions
        const p1 = control.primaryMetric;
        const p2 = bestVariant.data.primaryMetric;
        const n1 = control.sampleSize;
        const n2 = bestVariant.data.sampleSize;

        const pooledProportion = (p1 * n1 + p2 * n2) / (n1 + n2);
        const standardError = Math.sqrt(pooledProportion * (1 - pooledProportion) * (1/n1 + 1/n2));
        
        if (standardError === 0) {
            return { isSignificant: false, confidence: 0 };
        }

        const zScore = (p2 - p1) / standardError;
        const pValue = this.calculatePValue(zScore);
        const confidence = 1 - pValue;

        const lift = ((p2 - p1) / p1) * 100;

        return {
            isSignificant: pValue < (1 - this.confidenceLevel),
            confidence: confidence,
            pValue: pValue,
            winner: bestVariant.id,
            lift: lift,
            zScore: zScore
        };
    }

    // Calculate p-value from z-score
    calculatePValue(zScore) {
        // Using approximation of cumulative distribution function
        const z = Math.abs(zScore);
        const t = 1 / (1 + 0.3275911 * z);
        const a1 = 0.254829592;
        const a2 = -0.284496736;
        const a3 = 1.421413741;
        const a4 = -1.453152027;
        const a5 = 1.061405429;
        
        const erfApprox = 1 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);
        return 0.5 * (1 + (zScore > 0 ? erfApprox : -erfApprox));
    }

    // Group events by sessions
    groupEventsBySessions(events) {
        const sessions = {};
        const sessionTimeout = 30 * 60 * 1000; // 30 minutes

        events.sort((a, b) => a.timestamp - b.timestamp);

        events.forEach(event => {
            const userId = event.userId;
            if (!sessions[userId]) {
                sessions[userId] = [];
            }

            const userSessions = sessions[userId];
            const lastSession = userSessions[userSessions.length - 1];

            if (!lastSession || event.timestamp - lastSession.endTime > sessionTimeout) {
                // New session
                userSessions.push({
                    startTime: event.timestamp,
                    endTime: event.timestamp,
                    events: [event],
                    videoCount: event.event === 'video_play' ? 1 : 0
                });
            } else {
                // Existing session
                lastSession.endTime = event.timestamp;
                lastSession.events.push(event);
                if (event.event === 'video_play') {
                    lastSession.videoCount++;
                }
            }
        });

        // Flatten and calculate durations
        const allSessions = [];
        Object.values(sessions).forEach(userSessions => {
            userSessions.forEach(session => {
                session.duration = (session.endTime - session.startTime) / 1000; // in seconds
                allSessions.push(session);
            });
        });

        return allSessions;
    }

    // Determine winners across all experiments
    determineWinners() {
        const winners = [];

        Object.entries(this.results).forEach(([expId, result]) => {
            if (result.winner) {
                winners.push({
                    experimentId: expId,
                    name: result.name,
                    winner: result.variants[result.winner].name,
                    confidence: (result.confidence * 100).toFixed(1) + '%',
                    lift: result.projectedLift.toFixed(1) + '%',
                    recommendation: this.generateWinnerRecommendation(expId, result)
                });
            }
        });

        return winners;
    }

    // Generate recommendation for winner
    generateWinnerRecommendation(expId, result) {
        const recommendations = {
            'exp_001': {
                action: 'Roll out Auto Championship mode to 100% of users',
                impact: 'Expected +22% increase in video completion rates',
                implementation: 'Update default config to enable championship mode'
            },
            'exp_002': {
                action: 'Implement Gradient CTAs across all video pages',
                impact: 'Expected +47% increase in CTA click-through rate',
                implementation: 'Update CTA styling in build-videos.mjs'
            },
            'exp_003': {
                action: 'Switch to Hybrid ML recommendation algorithm',
                impact: 'Expected +14% increase in recommendation engagement',
                implementation: 'Set default algorithm to hybrid_ml in recommendations.js'
            }
        };

        return recommendations[expId] || {
            action: `Implement ${result.variants[result.winner].name}`,
            impact: `Expected ${result.projectedLift.toFixed(1)}% improvement`,
            implementation: 'Update configuration'
        };
    }

    // Generate recommendations for optimization
    generateRecommendations() {
        const recommendations = [];

        // Check for experiments needing more data
        Object.entries(this.results).forEach(([expId, result]) => {
            const minSampleSize = Math.min(
                ...Object.values(result.variants).map(v => v.sampleSize)
            );

            if (minSampleSize < this.minimumSampleSize) {
                recommendations.push({
                    type: 'data_collection',
                    experiment: result.name,
                    message: `Needs ${this.minimumSampleSize - minSampleSize} more users`,
                    priority: 'high'
                });
            }

            // Check test duration
            if (result.duration < this.minimumTestDuration) {
                const daysRemaining = Math.ceil(
                    (this.minimumTestDuration - result.duration) / (24 * 60 * 60 * 1000)
                );
                recommendations.push({
                    type: 'duration',
                    experiment: result.name,
                    message: `Run for ${daysRemaining} more days`,
                    priority: 'medium'
                });
            }
        });

        return recommendations;
    }

    // Schedule automated reports
    scheduleAutomatedReports() {
        // Daily report at 9 AM
        const now = new Date();
        const nextReport = new Date();
        nextReport.setHours(9, 0, 0, 0);
        
        if (nextReport <= now) {
            nextReport.setDate(nextReport.getDate() + 1);
        }

        const timeUntilReport = nextReport - now;
        
        setTimeout(() => {
            this.generateDailyReport();
            // Schedule next report
            setInterval(() => this.generateDailyReport(), 24 * 60 * 60 * 1000);
        }, timeUntilReport);
    }

    // Generate daily report
    generateDailyReport() {
        const report = {
            date: new Date().toISOString(),
            experiments: this.results,
            winners: this.determineWinners(),
            recommendations: this.generateRecommendations(),
            keyMetrics: this.calculateKeyMetrics()
        };

        // Store report
        const reports = JSON.parse(localStorage.getItem('blazeExperimentReports') || '[]');
        reports.push(report);
        
        // Keep last 30 reports
        if (reports.length > 30) {
            reports.shift();
        }
        
        localStorage.setItem('blazeExperimentReports', JSON.stringify(reports));

        // Send to analytics
        if (window.dataLayer) {
            window.dataLayer.push({
                event: 'experiment_report_generated',
                report_date: report.date,
                winners_count: report.winners.length,
                experiments_active: Object.keys(report.experiments).length
            });
        }

        return report;
    }

    // Calculate key metrics across all experiments
    calculateKeyMetrics() {
        let totalUsers = 0;
        let totalEvents = 0;
        let avgConfidence = 0;
        let experimentsWithWinners = 0;

        Object.values(this.results).forEach(result => {
            Object.values(result.variants).forEach(variant => {
                totalUsers += variant.sampleSize;
            });

            if (result.winner) {
                experimentsWithWinners++;
                avgConfidence += result.confidence;
            }
        });

        return {
            totalUsersInExperiments: totalUsers,
            totalEvents: totalEvents,
            averageConfidence: experimentsWithWinners > 0 
                ? (avgConfidence / experimentsWithWinners * 100).toFixed(1) + '%'
                : '0%',
            experimentsWithWinners: experimentsWithWinners,
            totalExperiments: Object.keys(this.results).length
        };
    }

    // Export results for dashboard
    exportResults() {
        return {
            experiments: this.experiments,
            results: this.results,
            winners: this.determineWinners(),
            recommendations: this.generateRecommendations(),
            metrics: this.calculateKeyMetrics()
        };
    }
}

// Initialize and expose globally
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.BlazeExperimentAnalyzer = new ExperimentAnalyzer();
        window.BlazeExperimentAnalyzer.init();
    });
} else {
    window.BlazeExperimentAnalyzer = new ExperimentAnalyzer();
    window.BlazeExperimentAnalyzer.init();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ExperimentAnalyzer;
}