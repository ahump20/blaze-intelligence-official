/**
 * Blaze Intelligence Client Success Monitoring & Retention System
 * Automated tracking of client health, engagement, and proactive retention
 */

export async function onRequestGet(context) {
    const { request, env } = context;
    const url = new URL(request.url);
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
    
    try {
        const clientId = url.searchParams.get('client_id');
        const metricType = url.searchParams.get('type') || 'overview';
        
        let responseData;
        
        switch (metricType) {
            case 'health-score':
                responseData = await calculateClientHealthScore(clientId, env);
                break;
            case 'engagement':
                responseData = await getEngagementMetrics(clientId, env);
                break;
            case 'retention-risk':
                responseData = await assessRetentionRisk(clientId, env);
                break;
            case 'success-metrics':
                responseData = await getSuccessMetrics(clientId, env);
                break;
            case 'intervention':
                responseData = await getInterventionRecommendations(clientId, env);
                break;
            case 'overview':
            default:
                responseData = await getClientSuccessOverview(clientId, env);
                break;
        }
        
        return new Response(JSON.stringify({
            success: true,
            clientId,
            metricType,
            timestamp: new Date().toISOString(),
            data: responseData
        }), {
            status: 200,
            headers: corsHeaders
        });
        
    } catch (error) {
        console.error('Client success monitoring error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: 'Client success data unavailable',
            message: 'Unable to retrieve client success metrics at this time.'
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function onRequestPost(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
    
    try {
        const interventionRequest = await request.json();
        const { clientId, interventionType, priority, details } = interventionRequest;
        
        // Execute retention intervention
        const interventionResult = await executeRetentionIntervention(
            clientId, 
            interventionType, 
            priority, 
            details, 
            env
        );
        
        // Track intervention in client history
        await trackInterventionHistory(clientId, interventionResult, env);
        
        // Schedule follow-up monitoring
        await scheduleFollowUpMonitoring(clientId, interventionType, env);
        
        return new Response(JSON.stringify({
            success: true,
            clientId,
            interventionId: interventionResult.id,
            status: interventionResult.status,
            scheduledFollowUp: interventionResult.followUp,
            message: 'Retention intervention executed successfully'
        }), {
            status: 200,
            headers: corsHeaders
        });
        
    } catch (error) {
        console.error('Retention intervention error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: 'Intervention execution failed',
            message: 'Unable to execute retention intervention at this time.'
        }), {
            status: 500,
            headers: corsHeaders
        });
    }
}

export async function onRequestOptions(context) {
    return new Response(null, {
        status: 200,
        headers: {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

async function getClientSuccessOverview(clientId, env) {
    // Comprehensive client success overview
    const healthScore = await calculateClientHealthScore(clientId, env);
    const engagement = await getEngagementMetrics(clientId, env);
    const retentionRisk = await assessRetentionRisk(clientId, env);
    const successMetrics = await getSuccessMetrics(clientId, env);
    
    return {
        healthScore: healthScore.score,
        healthTrend: healthScore.trend,
        riskLevel: retentionRisk.level,
        engagementScore: engagement.overallScore,
        successMetricsMet: successMetrics.percentageAchieved,
        lastActivity: engagement.lastActivity,
        recommendedActions: await getInterventionRecommendations(clientId, env),
        nextReview: calculateNextReviewDate(retentionRisk.level)
    };
}

async function calculateClientHealthScore(clientId, env) {
    const factors = {
        usage: await getUsageScore(clientId, env),
        engagement: await getEngagementScore(clientId, env),
        satisfaction: await getSatisfactionScore(clientId, env),
        valueRealization: await getValueRealizationScore(clientId, env),
        support: await getSupportScore(clientId, env)
    };
    
    // Weighted health score calculation
    const weights = {
        usage: 0.25,        // Platform utilization
        engagement: 0.20,   // User engagement
        satisfaction: 0.20, // Client satisfaction
        valueRealization: 0.25, // ROI achievement
        support: 0.10       // Support interaction quality
    };
    
    const weightedScore = Object.entries(factors).reduce((total, [key, score]) => {
        return total + (score * weights[key]);
    }, 0);
    
    const healthScore = Math.round(weightedScore);
    const trend = calculateScoreTrend(clientId, healthScore, env);
    
    return {
        score: healthScore,
        trend: trend, // 'improving', 'stable', 'declining'
        factors,
        breakdown: {
            excellent: healthScore >= 90,
            good: healthScore >= 75 && healthScore < 90,
            fair: healthScore >= 60 && healthScore < 75,
            poor: healthScore < 60
        },
        lastCalculated: new Date().toISOString()
    };
}

async function getEngagementMetrics(clientId, env) {
    // Comprehensive engagement tracking
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    
    const metrics = {
        loginFrequency: await getLoginFrequency(clientId, thirtyDaysAgo, env),
        featureUsage: await getFeatureUsage(clientId, thirtyDaysAgo, env),
        sessionDuration: await getAverageSessionDuration(clientId, thirtyDaysAgo, env),
        reportViews: await getReportViews(clientId, thirtyDaysAgo, env),
        apiCalls: await getApiCallVolume(clientId, thirtyDaysAgo, env),
        supportInteractions: await getSupportInteractions(clientId, thirtyDaysAgo, env)
    };
    
    // Calculate overall engagement score
    const engagementFactors = [
        Math.min(metrics.loginFrequency * 10, 100), // Scale login frequency
        Math.min(metrics.featureUsage.uniqueFeatures * 5, 100), // Feature diversity
        Math.min(metrics.sessionDuration / 10, 100), // Session quality
        Math.min(metrics.reportViews * 3, 100), // Report engagement
        Math.min(metrics.apiCalls / 1000 * 100, 100) // API adoption
    ];
    
    const overallScore = Math.round(
        engagementFactors.reduce((sum, score) => sum + score, 0) / engagementFactors.length
    );
    
    return {
        overallScore,
        metrics,
        lastActivity: await getLastActivity(clientId, env),
        engagementTrend: await calculateEngagementTrend(clientId, env),
        benchmarkComparison: await compareToTierBenchmark(clientId, overallScore, env)
    };
}

async function assessRetentionRisk(clientId, env) {
    const riskFactors = {
        healthScore: await calculateClientHealthScore(clientId, env),
        engagement: await getEngagementMetrics(clientId, env),
        contractStatus: await getContractStatus(clientId, env),
        supportTickets: await getRecentSupportTickets(clientId, env),
        paymentHistory: await getPaymentHistory(clientId, env),
        competitorActivity: await detectCompetitorActivity(clientId, env),
        stakeholderChanges: await detectStakeholderChanges(clientId, env)
    };
    
    // Risk scoring algorithm
    let riskScore = 0;
    
    // Health score impact
    if (riskFactors.healthScore.score < 60) riskScore += 30;
    else if (riskFactors.healthScore.score < 75) riskScore += 15;
    
    // Engagement impact
    if (riskFactors.engagement.overallScore < 50) riskScore += 25;
    else if (riskFactors.engagement.overallScore < 70) riskScore += 10;
    
    // Contract status impact
    if (riskFactors.contractStatus.daysToRenewal < 90) riskScore += 10;
    if (riskFactors.contractStatus.autoRenewal === false) riskScore += 15;
    
    // Support ticket impact
    if (riskFactors.supportTickets.escalatedTickets > 0) riskScore += 20;
    if (riskFactors.supportTickets.unresolved > 2) riskScore += 10;
    
    // Payment history impact
    if (riskFactors.paymentHistory.latePayments > 1) riskScore += 15;
    if (riskFactors.paymentHistory.overdueAmount > 0) riskScore += 20;
    
    // Competitor activity impact
    if (riskFactors.competitorActivity.detected) riskScore += 25;
    
    // Stakeholder changes impact
    if (riskFactors.stakeholderChanges.keyContactLeft) riskScore += 20;
    
    // Determine risk level
    let riskLevel = 'low';
    if (riskScore >= 70) riskLevel = 'critical';
    else if (riskScore >= 45) riskLevel = 'high';
    else if (riskScore >= 25) riskLevel = 'medium';
    
    return {
        level: riskLevel,
        score: riskScore,
        factors: riskFactors,
        recommendations: await generateRiskMitigationRecommendations(riskLevel, riskFactors, env),
        nextAssessment: calculateNextAssessmentDate(riskLevel),
        interventionRequired: riskScore >= 45,
        urgency: riskScore >= 70 ? 'immediate' : riskScore >= 45 ? 'high' : 'normal'
    };
}

async function getSuccessMetrics(clientId, env) {
    const clientData = await getClientData(clientId, env);
    const tier = clientData?.tier || 'Demo';
    
    // Get tier-specific success metrics
    const expectedMetrics = getTierSuccessMetrics(tier);
    const actualMetrics = await measureActualPerformance(clientId, env);
    
    const metricsComparison = expectedMetrics.map(metric => {
        const actual = actualMetrics[metric.key] || 0;
        const target = metric.target;
        const achieved = calculateAchievement(actual, target, metric.type);
        
        return {
            name: metric.name,
            key: metric.key,
            target: target,
            actual: actual,
            achieved: achieved,
            status: achieved >= 100 ? 'met' : achieved >= 75 ? 'on-track' : 'at-risk'
        };
    });
    
    const percentageAchieved = Math.round(
        metricsComparison.reduce((sum, metric) => sum + Math.min(metric.achieved, 100), 0) 
        / metricsComparison.length
    );
    
    return {
        percentageAchieved,
        metricsComparison,
        overallStatus: percentageAchieved >= 90 ? 'excellent' : 
                      percentageAchieved >= 75 ? 'good' : 
                      percentageAchieved >= 60 ? 'fair' : 'poor',
        improvementAreas: metricsComparison
            .filter(m => m.status === 'at-risk')
            .map(m => m.name),
        nextReview: calculateNextMetricsReview(percentageAchieved)
    };
}

async function getInterventionRecommendations(clientId, env) {
    const healthScore = await calculateClientHealthScore(clientId, env);
    const retentionRisk = await assessRetentionRisk(clientId, env);
    const engagement = await getEngagementMetrics(clientId, env);
    
    const recommendations = [];
    
    // Health-based recommendations
    if (healthScore.score < 75) {
        recommendations.push({
            type: 'health_improvement',
            priority: 'high',
            action: 'Schedule success review call',
            description: 'Comprehensive review of platform utilization and success metrics',
            timeline: '48 hours',
            owner: 'success@blaze-intelligence.com'
        });
    }
    
    // Engagement-based recommendations
    if (engagement.overallScore < 60) {
        recommendations.push({
            type: 'engagement_boost',
            priority: 'high',
            action: 'Provide additional training',
            description: 'Targeted training on underutilized features',
            timeline: '1 week',
            owner: 'success@blaze-intelligence.com'
        });
    }
    
    // Risk-based recommendations
    if (retentionRisk.level === 'critical') {
        recommendations.push({
            type: 'retention_critical',
            priority: 'critical',
            action: 'Executive intervention required',
            description: 'Immediate executive outreach and recovery plan',
            timeline: '24 hours',
            owner: 'austin@blaze-intelligence.com'
        });
    } else if (retentionRisk.level === 'high') {
        recommendations.push({
            type: 'retention_high',
            priority: 'high',
            action: 'Proactive outreach',
            description: 'Success manager outreach with value demonstration',
            timeline: '72 hours',
            owner: 'success@blaze-intelligence.com'
        });
    }
    
    // Feature adoption recommendations
    const underutilizedFeatures = engagement.metrics.featureUsage.unused || [];
    if (underutilizedFeatures.length > 0) {
        recommendations.push({
            type: 'feature_adoption',
            priority: 'medium',
            action: 'Feature adoption campaign',
            description: `Promote adoption of: ${underutilizedFeatures.slice(0, 3).join(', ')}`,
            timeline: '2 weeks',
            owner: 'success@blaze-intelligence.com'
        });
    }
    
    return recommendations.sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
}

async function executeRetentionIntervention(clientId, interventionType, priority, details, env) {
    const interventionId = generateInterventionId();
    
    const intervention = {
        id: interventionId,
        clientId,
        type: interventionType,
        priority,
        details,
        status: 'initiated',
        createdAt: new Date().toISOString(),
        owner: assignInterventionOwner(priority),
        actions: []
    };
    
    // Execute intervention based on type
    switch (interventionType) {
        case 'retention_critical':
            intervention.actions = await executeCriticalRetentionPlan(clientId, details, env);
            break;
        case 'retention_high':
            intervention.actions = await executeHighRiskOutreach(clientId, details, env);
            break;
        case 'health_improvement':
            intervention.actions = await executeHealthImprovementPlan(clientId, details, env);
            break;
        case 'engagement_boost':
            intervention.actions = await executeEngagementPlan(clientId, details, env);
            break;
        case 'feature_adoption':
            intervention.actions = await executeFeatureAdoptionPlan(clientId, details, env);
            break;
        default:
            intervention.actions = await executeGenericInterventionPlan(clientId, details, env);
    }
    
    // Schedule follow-up
    intervention.followUp = scheduleInterventionFollowUp(interventionType, priority);
    intervention.status = 'executing';
    
    // Store intervention record
    await storeInterventionRecord(intervention, env);
    
    return intervention;
}

// Helper functions for specific intervention types
async function executeCriticalRetentionPlan(clientId, details, env) {
    return [
        {
            action: 'executive_call_scheduled',
            description: 'Urgent executive call scheduled within 24 hours',
            status: 'pending',
            dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        },
        {
            action: 'account_analysis',
            description: 'Comprehensive account health analysis prepared',
            status: 'in-progress',
            dueDate: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString()
        },
        {
            action: 'recovery_proposal',
            description: 'Custom recovery and value demonstration proposal',
            status: 'pending',
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        }
    ];
}

async function executeHighRiskOutreach(clientId, details, env) {
    return [
        {
            action: 'success_manager_call',
            description: 'Success manager outreach call scheduled',
            status: 'pending',
            dueDate: new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString()
        },
        {
            action: 'value_demonstration',
            description: 'Custom value demonstration prepared',
            status: 'in-progress',
            dueDate: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
        }
    ];
}

// Utility functions
function getTierSuccessMetrics(tier) {
    const metrics = {
        'Enterprise': [
            { name: 'Time to First Insight', key: 'time_to_insight', target: 48, type: 'hours' },
            { name: 'User Adoption Rate', key: 'user_adoption', target: 90, type: 'percentage' },
            { name: 'API Integration Success', key: 'api_integration', target: 100, type: 'percentage' },
            { name: 'ROI Achievement', key: 'roi_achievement', target: 300, type: 'percentage' }
        ],
        'Professional': [
            { name: 'Platform Engagement', key: 'platform_engagement', target: 3, type: 'sessions_per_week' },
            { name: 'Feature Utilization', key: 'feature_utilization', target: 70, type: 'percentage' },
            { name: 'Performance Improvement', key: 'performance_improvement', target: 15, type: 'percentage' }
        ],
        'Demo': [
            { name: 'Demo Completion', key: 'demo_completion', target: 100, type: 'percentage' },
            { name: 'Feature Exploration', key: 'feature_exploration', target: 5, type: 'count' },
            { name: 'Upgrade Consideration', key: 'upgrade_consideration', target: 1, type: 'boolean' }
        ]
    };
    
    return metrics[tier] || metrics['Demo'];
}

function generateInterventionId() {
    return `INT_${Date.now()}_${Math.random().toString(36).substr(2, 8)}`;
}

function assignInterventionOwner(priority) {
    return priority === 'critical' ? 'austin@blaze-intelligence.com' : 'success@blaze-intelligence.com';
}

// Mock data functions (in production, these would query actual databases)
async function getUsageScore(clientId, env) { return Math.floor(Math.random() * 40) + 60; }
async function getEngagementScore(clientId, env) { return Math.floor(Math.random() * 30) + 70; }
async function getSatisfactionScore(clientId, env) { return Math.floor(Math.random() * 20) + 80; }
async function getValueRealizationScore(clientId, env) { return Math.floor(Math.random() * 35) + 65; }
async function getSupportScore(clientId, env) { return Math.floor(Math.random() * 15) + 85; }

async function storeInterventionRecord(intervention, env) {
    try {
        await env.INTERVENTIONS_DB?.put(`intervention_${intervention.id}`, JSON.stringify(intervention));
        console.log(`Intervention ${intervention.id} stored successfully`);
    } catch (error) {
        console.error('Failed to store intervention record:', error);
    }
}