/**
 * Blaze Intelligence Lead Capture & Qualification System
 * Automated pipeline for converting prospects into qualified leads
 */

export async function onRequestPost(context) {
    const { request, env } = context;
    
    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Content-Type': 'application/json'
    };
    
    try {
        const leadData = await request.json();
        
        // Lead qualification scoring
        const qualificationScore = calculateLeadScore(leadData);
        
        // Enhanced lead data with qualification metrics
        const enrichedLead = {
            ...leadData,
            captureTimestamp: new Date().toISOString(),
            qualification: {
                score: qualificationScore.total,
                tier: qualificationScore.tier,
                priority: qualificationScore.priority,
                estimatedRevenue: qualificationScore.estimatedRevenue
            },
            source: leadData.source || 'website',
            status: 'new',
            assignedTo: assignLeadToSpecialist(qualificationScore),
            nextAction: generateNextAction(qualificationScore)
        };
        
        // Store in multiple systems for redundancy
        await Promise.all([
            storeLead(enrichedLead, env),
            sendToIntegrations(enrichedLead, env),
            triggerAutomatedFollowUp(enrichedLead, env)
        ]);
        
        // Generate immediate response based on qualification
        const responseData = generateLeadResponse(enrichedLead);
        
        return new Response(JSON.stringify({
            success: true,
            leadId: enrichedLead.id || generateLeadId(),
            qualification: enrichedLead.qualification,
            nextSteps: responseData.nextSteps,
            estimatedValue: responseData.estimatedValue,
            contactTimeline: responseData.contactTimeline
        }), {
            status: 200,
            headers: corsHeaders
        });
        
    } catch (error) {
        console.error('Lead capture error:', error);
        
        return new Response(JSON.stringify({
            success: false,
            error: 'Lead capture failed',
            message: 'We encountered an issue processing your request. Our team has been notified.'
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

function calculateLeadScore(leadData) {
    let score = 0;
    let tier = 'Demo';
    let priority = 'Medium';
    let estimatedRevenue = 1188; // Base annual value
    
    // Organization size scoring
    if (leadData.organizationType) {
        switch (leadData.organizationType.toLowerCase()) {
            case 'mlb':
            case 'nfl':
            case 'nba':
                score += 100;
                tier = 'Enterprise';
                priority = 'Critical';
                estimatedRevenue = 250000;
                break;
            case 'college':
            case 'university':
                score += 75;
                tier = 'Professional';
                priority = 'High';
                estimatedRevenue = 50000;
                break;
            case 'high school':
            case 'youth':
                score += 50;
                tier = 'Professional';
                priority = 'High';
                estimatedRevenue = 15000;
                break;
            case 'individual':
            case 'athlete':
                score += 25;
                tier = 'Demo';
                priority = 'Medium';
                estimatedRevenue = 1188;
                break;
            default:
                score += 30;
                break;
        }
    }
    
    // Role/Title scoring
    if (leadData.title) {
        const title = leadData.title.toLowerCase();
        if (title.includes('gm') || title.includes('general manager') || title.includes('president')) {
            score += 50;
            priority = 'Critical';
        } else if (title.includes('coach') || title.includes('director')) {
            score += 40;
            priority = 'High';
        } else if (title.includes('analyst') || title.includes('coordinator')) {
            score += 30;
            priority = 'High';
        }
    }
    
    // Budget/Timeline scoring
    if (leadData.budget) {
        if (leadData.budget === 'enterprise' || leadData.budget === '>100k') {
            score += 40;
            tier = 'Enterprise';
            priority = 'Critical';
        } else if (leadData.budget === 'professional' || leadData.budget === '10k-100k') {
            score += 30;
            tier = 'Professional';
            priority = 'High';
        }
    }
    
    // Timeline urgency
    if (leadData.timeline) {
        if (leadData.timeline === 'immediate' || leadData.timeline === 'this month') {
            score += 30;
            priority = 'Critical';
        } else if (leadData.timeline === 'this quarter') {
            score += 20;
            priority = 'High';
        }
    }
    
    // Sport-specific interest scoring
    if (leadData.sportsInterest) {
        const interests = Array.isArray(leadData.sportsInterest) 
            ? leadData.sportsInterest 
            : [leadData.sportsInterest];
        
        interests.forEach(sport => {
            if (['mlb', 'nfl', 'nba', 'ncaa'].includes(sport.toLowerCase())) {
                score += 10;
            }
        });
    }
    
    // Determine final tier based on total score
    if (score >= 150) {
        tier = 'Enterprise';
        priority = 'Critical';
    } else if (score >= 75) {
        tier = 'Professional';
        priority = 'High';
    } else {
        tier = 'Demo';
        priority = 'Medium';
    }
    
    return {
        total: score,
        tier,
        priority,
        estimatedRevenue
    };
}

function assignLeadToSpecialist(qualification) {
    // Route leads to appropriate specialists based on qualification
    switch (qualification.tier) {
        case 'Enterprise':
            return 'austin@blaze-intelligence.com'; // Direct to founder for enterprise deals
        case 'Professional':
            return 'sales@blaze-intelligence.com'; // Professional sales team
        default:
            return 'support@blaze-intelligence.com'; // General support for demos
    }
}

function generateNextAction(qualification) {
    const actions = {
        'Enterprise': {
            action: 'executive_demo',
            timeline: '24 hours',
            description: 'Schedule executive demonstration with technical team'
        },
        'Professional': {
            action: 'technical_demo',
            timeline: '48 hours',
            description: 'Conduct technical demonstration and needs assessment'
        },
        'Demo': {
            action: 'self_service_demo',
            timeline: 'immediate',
            description: 'Provide access to interactive demo environment'
        }
    };
    
    return actions[qualification.tier] || actions['Demo'];
}

async function storeLead(leadData, env) {
    // Store in multiple systems for reliability
    try {
        // Primary storage (could be D1, R2, or external CRM)
        await env.LEADS_DB?.put(`lead_${leadData.captureTimestamp}`, JSON.stringify(leadData));
        
        // Backup to R2 for long-term storage
        await env.BLAZE_STORAGE?.put(`leads/${Date.now()}_${leadData.email || 'anonymous'}.json`, 
                                      JSON.stringify(leadData, null, 2));
        
        console.log('Lead stored successfully:', leadData.qualification.tier);
    } catch (error) {
        console.error('Storage error:', error);
        // Continue execution even if storage fails
    }
}

async function sendToIntegrations(leadData, env) {
    // Send to CRM integrations (HubSpot, Salesforce, etc.)
    const integrationPromises = [];
    
    // HubSpot integration
    if (env.HUBSPOT_API_KEY) {
        integrationPromises.push(sendToHubSpot(leadData, env.HUBSPOT_API_KEY));
    }
    
    // Notion integration for project tracking
    if (env.NOTION_API_KEY) {
        integrationPromises.push(sendToNotion(leadData, env.NOTION_API_KEY));
    }
    
    // Slack notification for immediate team awareness
    if (env.SLACK_WEBHOOK_URL) {
        integrationPromises.push(sendSlackNotification(leadData, env.SLACK_WEBHOOK_URL));
    }
    
    // Execute all integrations in parallel
    await Promise.allSettled(integrationPromises);
}

async function sendToHubSpot(leadData, apiKey) {
    try {
        const hubspotData = {
            properties: {
                email: leadData.email,
                firstname: leadData.firstName || '',
                lastname: leadData.lastName || '',
                company: leadData.organization || '',
                jobtitle: leadData.title || '',
                phone: leadData.phone || '',
                lead_source: leadData.source || 'website',
                lead_score: leadData.qualification.score,
                lead_tier: leadData.qualification.tier,
                estimated_revenue: leadData.qualification.estimatedRevenue,
                sports_interest: leadData.sportsInterest?.join(', ') || ''
            }
        };
        
        await fetch('https://api.hubapi.com/contacts/v1/contact', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(hubspotData)
        });
    } catch (error) {
        console.error('HubSpot integration error:', error);
    }
}

async function sendToNotion(leadData, apiKey) {
    try {
        const notionData = {
            parent: { database_id: process.env.NOTION_LEADS_DB || 'default' },
            properties: {
                'Name': {
                    title: [{
                        text: {
                            content: `${leadData.firstName || ''} ${leadData.lastName || ''}`.trim()
                        }
                    }]
                },
                'Email': {
                    email: leadData.email
                },
                'Organization': {
                    rich_text: [{
                        text: {
                            content: leadData.organization || ''
                        }
                    }]
                },
                'Tier': {
                    select: {
                        name: leadData.qualification.tier
                    }
                },
                'Score': {
                    number: leadData.qualification.score
                },
                'Estimated Revenue': {
                    number: leadData.qualification.estimatedRevenue
                }
            }
        };
        
        await fetch('https://api.notion.com/v1/pages', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${apiKey}`,
                'Content-Type': 'application/json',
                'Notion-Version': '2022-06-28'
            },
            body: JSON.stringify(notionData)
        });
    } catch (error) {
        console.error('Notion integration error:', error);
    }
}

async function sendSlackNotification(leadData, webhookUrl) {
    try {
        const slackMessage = {
            text: `🚀 New ${leadData.qualification.tier} Lead Captured!`,
            attachments: [{
                color: leadData.qualification.tier === 'Enterprise' ? '#FF0000' : 
                       leadData.qualification.tier === 'Professional' ? '#FFA500' : '#00FF00',
                fields: [
                    {
                        title: 'Contact',
                        value: `${leadData.firstName || ''} ${leadData.lastName || ''}\n${leadData.email}`,
                        short: true
                    },
                    {
                        title: 'Organization',
                        value: `${leadData.organization || 'Individual'}\n${leadData.title || ''}`,
                        short: true
                    },
                    {
                        title: 'Qualification',
                        value: `Score: ${leadData.qualification.score}\nTier: ${leadData.qualification.tier}\nEstimated Revenue: $${leadData.qualification.estimatedRevenue.toLocaleString()}`,
                        short: false
                    }
                ]
            }]
        };
        
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(slackMessage)
        });
    } catch (error) {
        console.error('Slack notification error:', error);
    }
}

async function triggerAutomatedFollowUp(leadData, env) {
    // Schedule automated follow-up based on qualification tier
    const followUpDelay = {
        'Enterprise': 1800000, // 30 minutes
        'Professional': 3600000, // 1 hour
        'Demo': 86400000 // 24 hours
    };
    
    const delay = followUpDelay[leadData.qualification.tier] || followUpDelay['Demo'];
    
    // In production, this would integrate with a job queue or cron system
    // For now, we'll log the intended follow-up schedule
    console.log(`Follow-up scheduled for ${leadData.qualification.tier} lead in ${delay/60000} minutes`);
}

function generateLeadResponse(leadData) {
    const tier = leadData.qualification.tier;
    
    const responses = {
        'Enterprise': {
            nextSteps: [
                'Executive team review within 24 hours',
                'Custom technical demonstration scheduled',
                'Dedicated implementation specialist assigned',
                'Enterprise pricing and contract discussion'
            ],
            estimatedValue: `$${leadData.qualification.estimatedRevenue.toLocaleString()} annually`,
            contactTimeline: 'Within 24 hours via phone and email'
        },
        'Professional': {
            nextSteps: [
                'Technical demonstration within 48 hours',
                'Needs assessment and custom proposal',
                'Trial access to professional features',
                'Implementation planning session'
            ],
            estimatedValue: `$${leadData.qualification.estimatedRevenue.toLocaleString()} annually`,
            contactTimeline: 'Within 48 hours via email'
        },
        'Demo': {
            nextSteps: [
                'Immediate access to interactive demo',
                'Self-guided feature exploration',
                'Optional consultation within 1 week',
                'Upgrade path to professional tier'
            ],
            estimatedValue: `$${leadData.qualification.estimatedRevenue.toLocaleString()} annually`,
            contactTimeline: 'Demo access immediate, consultation within 1 week'
        }
    };
    
    return responses[tier] || responses['Demo'];
}

function generateLeadId() {
    return `BL_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}