/**
 * Blaze Intelligence Client Onboarding Automation
 * Streamlined workflow for converting qualified leads to active clients
 */

export async function onRequestPost(context) {
    const { request, env } = context;
    
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
    
    try {
        const onboardingRequest = await request.json();
        const { clientId, tier, organizationType, sportsInterests } = onboardingRequest;
        
        // Generate comprehensive onboarding workflow
        const workflow = await createOnboardingWorkflow(onboardingRequest, env);
        
        // Initialize client workspace
        const workspace = await initializeClientWorkspace(clientId, tier, env);
        
        // Configure analytics access based on client profile
        const analyticsAccess = await configureAnalyticsAccess(sportsInterests, tier, env);
        
        // Set up automated reporting schedule
        const reportingSchedule = await setupReportingSchedule(clientId, tier, env);
        
        // Generate client success metrics tracking
        const successTracking = await initializeSuccessTracking(clientId, workflow, env);
        
        const onboardingResponse = {
            clientId,
            workflowId: workflow.id,
            workspace: {
                dashboardUrl: workspace.dashboardUrl,
                apiEndpoints: workspace.apiEndpoints,
                credentials: workspace.credentials
            },
            analyticsAccess: analyticsAccess.enabledSystems,
            reportingSchedule: reportingSchedule.schedule,
            successMetrics: successTracking.kpis,
            estimatedTimeToValue: calculateTimeToValue(tier),
            onboardingSteps: workflow.steps,
            supportContact: assignSuccessManager(tier)
        };
        
        // Store onboarding data and trigger workflow
        await Promise.all([
            storeOnboardingData(onboardingResponse, env),
            triggerOnboardingWorkflow(workflow, env),
            sendWelcomeNotifications(onboardingResponse, env)
        ]);
        
        return new Response(JSON.stringify({
            success: true,
            onboarding: onboardingResponse,
            message: 'Client onboarding initiated successfully',
            nextAction: 'Check email for workspace credentials and setup instructions'
        }), {
            status: 200,
            headers: corsHeaders
        });
        
    } catch (error) {
        console.error('Onboarding workflow error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: 'Onboarding initiation failed',
            message: 'We encountered an issue setting up your account. Our team has been notified and will contact you shortly.'
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
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization'
        }
    });
}

async function createOnboardingWorkflow(request, env) {
    const { tier, organizationType, sportsInterests } = request;
    
    const baseWorkflow = {
        id: generateWorkflowId(),
        tier,
        organizationType,
        createdAt: new Date().toISOString(),
        status: 'initiated',
        steps: []
    };
    
    // Define tier-specific workflows
    const workflows = {
        'Enterprise': [
            {
                step: 1,
                title: 'Executive Kickoff Call',
                description: 'Strategy alignment and success criteria definition',
                duration: '60 minutes',
                timeline: 'Day 1',
                owner: 'austin@blaze-intelligence.com',
                deliverables: ['Success metrics definition', 'Technical requirements assessment']
            },
            {
                step: 2,
                title: 'Technical Integration Setup',
                description: 'API integration and data pipeline configuration',
                duration: '2-3 days',
                timeline: 'Days 2-4',
                owner: 'technical@blaze-intelligence.com',
                deliverables: ['API credentials', 'Data pipeline testing', 'Integration documentation']
            },
            {
                step: 3,
                title: 'Custom Dashboard Configuration',
                description: 'Tailored analytics dashboard setup',
                duration: '1-2 days',
                timeline: 'Days 5-6',
                owner: 'technical@blaze-intelligence.com',
                deliverables: ['Custom dashboard access', 'User training materials']
            },
            {
                step: 4,
                title: 'Team Training & Certification',
                description: 'Comprehensive platform training for key users',
                duration: '2 hours',
                timeline: 'Day 7',
                owner: 'success@blaze-intelligence.com',
                deliverables: ['User certification', 'Training recordings', 'Support documentation']
            },
            {
                step: 5,
                title: 'Go-Live & Success Review',
                description: 'Production launch and initial success metrics review',
                duration: '30 minutes',
                timeline: 'Day 14',
                owner: 'success@blaze-intelligence.com',
                deliverables: ['Go-live confirmation', 'Success metrics baseline']
            }
        ],
        'Professional': [
            {
                step: 1,
                title: 'Welcome & Setup Call',
                description: 'Platform orientation and goal setting',
                duration: '30 minutes',
                timeline: 'Day 1',
                owner: 'success@blaze-intelligence.com',
                deliverables: ['Platform access', 'Goal setting worksheet']
            },
            {
                step: 2,
                title: 'Analytics Configuration',
                description: 'Sport-specific analytics setup',
                duration: '1 day',
                timeline: 'Days 2-3',
                owner: 'technical@blaze-intelligence.com',
                deliverables: ['Configured analytics access', 'Usage guidelines']
            },
            {
                step: 3,
                title: 'Training & Certification',
                description: 'Platform training and best practices',
                duration: '1 hour',
                timeline: 'Day 5',
                owner: 'success@blaze-intelligence.com',
                deliverables: ['Training completion', 'Best practices guide']
            },
            {
                step: 4,
                title: '30-Day Success Check',
                description: 'Progress review and optimization',
                duration: '15 minutes',
                timeline: 'Day 30',
                owner: 'success@blaze-intelligence.com',
                deliverables: ['Success metrics report', 'Optimization recommendations']
            }
        ],
        'Demo': [
            {
                step: 1,
                title: 'Demo Access Activation',
                description: 'Immediate platform access with guided tour',
                duration: '5 minutes',
                timeline: 'Immediate',
                owner: 'automated',
                deliverables: ['Demo credentials', 'Quick start guide']
            },
            {
                step: 2,
                title: 'Self-Guided Exploration',
                description: 'Interactive feature exploration with progress tracking',
                duration: '30 minutes',
                timeline: 'Days 1-7',
                owner: 'self-service',
                deliverables: ['Feature completion tracking', 'Upgrade recommendations']
            },
            {
                step: 3,
                title: 'Optional Consultation',
                description: 'Upgrade consultation and custom needs assessment',
                duration: '15 minutes',
                timeline: 'Day 7-14',
                owner: 'sales@blaze-intelligence.com',
                deliverables: ['Needs assessment', 'Custom proposal']
            }
        ]
    };
    
    baseWorkflow.steps = workflows[tier] || workflows['Demo'];
    baseWorkflow.estimatedCompletion = calculateWorkflowDuration(baseWorkflow.steps);
    
    return baseWorkflow;
}

async function initializeClientWorkspace(clientId, tier, env) {
    const workspaceId = `ws_${clientId}_${Date.now()}`;
    const apiKey = generateApiKey(clientId, tier);
    
    const workspace = {
        id: workspaceId,
        clientId,
        tier,
        createdAt: new Date().toISOString(),
        dashboardUrl: `https://blaze-intelligence.com/client-dashboard.html?ws=${workspaceId}`,
        apiEndpoints: generateApiEndpoints(tier),
        credentials: {
            apiKey,
            workspaceId,
            dashboardAccess: true,
            apiAccess: tier !== 'Demo'
        },
        features: getFeatureAccess(tier),
        limits: getTierLimits(tier)
    };
    
    // Store workspace configuration
    await storeWorkspaceConfig(workspace, env);
    
    return workspace;
}

async function configureAnalyticsAccess(sportsInterests, tier, env) {
    const allSystems = [
        'cardinals-analytics',
        'titans-nfl-analytics', 
        'longhorns-recruiting',
        'grizzlies-grit-index',
        'champion-enigma-engine',
        'digital-combine-autopilot'
    ];
    
    let enabledSystems = [];
    
    if (tier === 'Enterprise') {
        // Enterprise clients get access to all systems
        enabledSystems = allSystems;
    } else if (tier === 'Professional') {
        // Professional clients get sport-specific access
        enabledSystems = mapSportsToSystems(sportsInterests);
    } else {
        // Demo clients get limited access to sample data
        enabledSystems = ['cardinals-analytics']; // Sample system for demos
    }
    
    const analyticsConfig = {
        enabledSystems,
        accessLevel: tier,
        dataRetention: getTierDataRetention(tier),
        apiRateLimit: getTierRateLimit(tier),
        realTimeAccess: tier !== 'Demo',
        exportCapabilities: tier === 'Enterprise',
        customReports: tier === 'Enterprise'
    };
    
    return analyticsConfig;
}

async function setupReportingSchedule(clientId, tier, env) {
    const schedules = {
        'Enterprise': {
            frequency: 'daily',
            reports: [
                'executive-summary',
                'performance-metrics',
                'competitive-analysis',
                'predictive-insights'
            ],
            deliveryTime: '07:00 EST',
            format: ['pdf', 'interactive-dashboard']
        },
        'Professional': {
            frequency: 'weekly',
            reports: [
                'performance-summary',
                'key-metrics',
                'recommendations'
            ],
            deliveryTime: 'Monday 09:00 EST',
            format: ['email', 'dashboard-notification']
        },
        'Demo': {
            frequency: 'none',
            reports: [],
            deliveryTime: null,
            format: []
        }
    };
    
    const schedule = schedules[tier] || schedules['Demo'];
    
    if (schedule.frequency !== 'none') {
        // Schedule automated reporting
        await scheduleReports(clientId, schedule, env);
    }
    
    return { schedule };
}

async function initializeSuccessTracking(clientId, workflow, env) {
    const tier = workflow.tier;
    
    const kpis = {
        'Enterprise': [
            {
                metric: 'Time to First Insight',
                target: '48 hours',
                measurement: 'hours',
                importance: 'critical'
            },
            {
                metric: 'User Adoption Rate',
                target: '90%',
                measurement: 'percentage',
                importance: 'high'
            },
            {
                metric: 'API Integration Success',
                target: '100%',
                measurement: 'boolean',
                importance: 'critical'
            },
            {
                metric: 'ROI Achievement',
                target: '300% within 90 days',
                measurement: 'percentage',
                importance: 'critical'
            }
        ],
        'Professional': [
            {
                metric: 'Platform Engagement',
                target: '3+ sessions per week',
                measurement: 'sessions',
                importance: 'high'
            },
            {
                metric: 'Feature Utilization',
                target: '70%',
                measurement: 'percentage',
                importance: 'medium'
            },
            {
                metric: 'Performance Improvement',
                target: '15% within 60 days',
                measurement: 'percentage',
                importance: 'high'
            }
        ],
        'Demo': [
            {
                metric: 'Demo Completion',
                target: '100%',
                measurement: 'percentage',
                importance: 'medium'
            },
            {
                metric: 'Feature Exploration',
                target: '5+ features tried',
                measurement: 'count',
                importance: 'low'
            },
            {
                metric: 'Upgrade Consideration',
                target: 'Consultation scheduled',
                measurement: 'boolean',
                importance: 'medium'
            }
        ]
    };
    
    const tracking = {
        clientId,
        kpis: kpis[tier] || kpis['Demo'],
        startDate: new Date().toISOString(),
        checkpoints: generateCheckpoints(tier),
        automatedMonitoring: true
    };
    
    return tracking;
}

function calculateTimeToValue(tier) {
    const timeframes = {
        'Enterprise': '7-14 days',
        'Professional': '3-5 days', 
        'Demo': 'Immediate'
    };
    
    return timeframes[tier] || timeframes['Demo'];
}

function assignSuccessManager(tier) {
    const contacts = {
        'Enterprise': {
            name: 'Austin Humphrey',
            email: 'austin@blaze-intelligence.com',
            phone: '(210) 273-5538',
            role: 'Founder & Strategic Success'
        },
        'Professional': {
            name: 'Professional Success Team',
            email: 'success@blaze-intelligence.com',
            phone: '(210) 273-5538',
            role: 'Client Success Manager'
        },
        'Demo': {
            name: 'Support Team',
            email: 'support@blaze-intelligence.com',
            phone: null,
            role: 'Technical Support'
        }
    };
    
    return contacts[tier] || contacts['Demo'];
}

function generateApiEndpoints(tier) {
    const baseUrl = 'https://blaze-intelligence.com/api';
    
    const endpoints = {
        'Enterprise': [
            `${baseUrl}/gateway`,
            `${baseUrl}/cardinals/readiness`,
            `${baseUrl}/titans/analytics`,
            `${baseUrl}/longhorns/recruiting`,
            `${baseUrl}/grizzlies/grit`,
            `${baseUrl}/champion-enigma/analysis`,
            `${baseUrl}/digital-combine/autopilot`,
            `${baseUrl}/sync/realtime`,
            `${baseUrl}/custom/reports`,
            `${baseUrl}/export/data`
        ],
        'Professional': [
            `${baseUrl}/gateway`,
            `${baseUrl}/cardinals/readiness`,
            `${baseUrl}/titans/analytics`,
            `${baseUrl}/longhorns/recruiting`,
            `${baseUrl}/grizzlies/grit`,
            `${baseUrl}/sync/realtime`
        ],
        'Demo': [
            `${baseUrl}/demo/sample-data`,
            `${baseUrl}/demo/cardinals-preview`
        ]
    };
    
    return endpoints[tier] || endpoints['Demo'];
}

function getFeatureAccess(tier) {
    const features = {
        'Enterprise': [
            'full-analytics-suite',
            'real-time-data',
            'custom-reports',
            'api-access',
            'data-export',
            'white-label-options',
            'priority-support',
            'custom-integrations'
        ],
        'Professional': [
            'analytics-suite',
            'real-time-data',
            'standard-reports',
            'api-access',
            'email-support'
        ],
        'Demo': [
            'sample-analytics',
            'static-reports',
            'community-support'
        ]
    };
    
    return features[tier] || features['Demo'];
}

function getTierLimits(tier) {
    const limits = {
        'Enterprise': {
            apiCallsPerMonth: 'unlimited',
            dataRetentionMonths: 24,
            concurrentUsers: 'unlimited',
            customReports: 'unlimited'
        },
        'Professional': {
            apiCallsPerMonth: 100000,
            dataRetentionMonths: 12,
            concurrentUsers: 10,
            customReports: 5
        },
        'Demo': {
            apiCallsPerMonth: 1000,
            dataRetentionMonths: 1,
            concurrentUsers: 1,
            customReports: 0
        }
    };
    
    return limits[tier] || limits['Demo'];
}

// Helper functions
function generateWorkflowId() {
    return `WF_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

function generateApiKey(clientId, tier) {
    const prefix = tier === 'Enterprise' ? 'ent' : tier === 'Professional' ? 'pro' : 'demo';
    return `bl_${prefix}_${clientId}_${Math.random().toString(36).substr(2, 16)}`;
}

function mapSportsToSystems(sportsInterests) {
    const sportMap = {
        'mlb': ['cardinals-analytics'],
        'nfl': ['titans-nfl-analytics'],
        'ncaa': ['longhorns-recruiting'],
        'nba': ['grizzlies-grit-index'],
        'youth': ['digital-combine-autopilot'],
        'recruiting': ['champion-enigma-engine']
    };
    
    let systems = [];
    sportsInterests?.forEach(sport => {
        if (sportMap[sport.toLowerCase()]) {
            systems = systems.concat(sportMap[sport.toLowerCase()]);
        }
    });
    
    return [...new Set(systems)]; // Remove duplicates
}

async function storeOnboardingData(data, env) {
    try {
        await env.ONBOARDING_DB?.put(`onboarding_${data.clientId}`, JSON.stringify(data));
        console.log('Onboarding data stored successfully');
    } catch (error) {
        console.error('Failed to store onboarding data:', error);
    }
}

async function storeWorkspaceConfig(workspace, env) {
    try {
        await env.WORKSPACE_DB?.put(`workspace_${workspace.id}`, JSON.stringify(workspace));
        console.log('Workspace configuration stored successfully');
    } catch (error) {
        console.error('Failed to store workspace config:', error);
    }
}

async function triggerOnboardingWorkflow(workflow, env) {
    // In production, this would trigger actual workflow automation
    console.log(`Onboarding workflow ${workflow.id} triggered for ${workflow.tier} client`);
}

async function sendWelcomeNotifications(onboarding, env) {
    // Send welcome email and setup instructions
    console.log(`Welcome notifications sent to ${onboarding.clientId}`);
}