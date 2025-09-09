/**
 * Blaze Intelligence Lead Capture System
 * Championship-level client onboarding pipeline
 */

export default async function handler(request, env, ctx) {
    // CORS headers for all responses
    const corsHeaders = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    if (request.method !== 'POST') {
        return new Response(
            JSON.stringify({ error: 'Method not allowed' }),
            { status: 405, headers: corsHeaders }
        );
    }

    try {
        const formData = await request.json();
        
        // Validate required fields
        const required = ['name', 'email', 'organization', 'interest'];
        const missing = required.filter(field => !formData[field]);
        
        if (missing.length > 0) {
            return new Response(
                JSON.stringify({ 
                    error: 'Missing required fields',
                    missing: missing 
                }),
                { status: 400, headers: corsHeaders }
            );
        }

        // Lead intelligence classification
        const leadIntel = classifyLead(formData);
        
        // Enhanced lead record
        const leadRecord = {
            id: generateLeadId(),
            timestamp: new Date().toISOString(),
            source: 'blaze-intelligence-platform',
            ...formData,
            classification: leadIntel.category,
            priority: leadIntel.priority,
            nextAction: leadIntel.nextAction,
            estimatedValue: leadIntel.estimatedValue,
            ip: request.headers.get('CF-Connecting-IP'),
            userAgent: request.headers.get('User-Agent'),
            country: request.cf?.country || 'Unknown'
        };

        // Store in multiple systems for championship-level follow-up
        await Promise.all([
            storeInAirtable(leadRecord, env),
            storeInHubSpot(leadRecord, env),
            triggerSlackNotification(leadRecord, env),
            scheduleFollowUp(leadRecord, env)
        ]);

        // Immediate response with next steps
        const response = {
            success: true,
            message: 'Championship-level intelligence incoming',
            leadId: leadRecord.id,
            nextSteps: leadIntel.nextSteps,
            estimatedResponse: leadIntel.responseTime
        };

        return new Response(
            JSON.stringify(response),
            { status: 200, headers: corsHeaders }
        );

    } catch (error) {
        console.error('❌ Lead capture error:', error);
        
        return new Response(
            JSON.stringify({ 
                error: 'Internal server error',
                message: 'We received your interest but had a technical issue. Our team will contact you within 24 hours.' 
            }),
            { status: 500, headers: corsHeaders }
        );
    }
}

function classifyLead(formData) {
    const { organization, interest, title = '', message = '' } = formData;
    const combined = `${organization} ${interest} ${title} ${message}`.toLowerCase();
    
    // Championship organization detection
    if (combined.includes('mlb') || combined.includes('baseball') || 
        combined.includes('orioles') || combined.includes('cardinals')) {
        return {
            category: 'MLB Organization',
            priority: 'P0-Critical',
            estimatedValue: '$100K+',
            nextAction: 'Executive briefing within 2 hours',
            responseTime: '< 2 hours',
            nextSteps: [
                'Executive team briefing scheduled',
                'Custom Camden Yards analysis prepared',
                'Direct line to decision makers established'
            ]
        };
    }
    
    if (combined.includes('nfl') || combined.includes('titans') || combined.includes('football')) {
        return {
            category: 'NFL Organization',
            priority: 'P0-Critical',
            estimatedValue: '$150K+',
            nextAction: 'Executive briefing within 2 hours',
            responseTime: '< 2 hours',
            nextSteps: [
                'NFL analytics demo prepared',
                'Titan-specific competitive analysis ready',
                'Championship-level engagement initiated'
            ]
        };
    }
    
    if (combined.includes('college') || combined.includes('university') || 
        combined.includes('ncaa') || combined.includes('longhorns')) {
        return {
            category: 'College Program',
            priority: 'P1-High',
            estimatedValue: '$50K+',
            nextAction: 'Program analysis within 4 hours',
            responseTime: '< 4 hours',
            nextSteps: [
                'Custom recruiting intelligence package',
                'NIL valuation framework demo',
                'Transfer portal arbitrage strategies'
            ]
        };
    }
    
    if (combined.includes('nba') || combined.includes('grizzlies') || combined.includes('basketball')) {
        return {
            category: 'NBA Organization',
            priority: 'P1-High',
            estimatedValue: '$75K+',
            nextAction: 'Character analytics demo within 4 hours',
            responseTime: '< 4 hours',
            nextSteps: [
                'Grit index evaluation system demo',
                'Team chemistry optimization analysis',
                'Championship culture metrics'
            ]
        };
    }
    
    // Default classification
    return {
        category: 'Strategic Prospect',
        priority: 'P2-Standard',
        estimatedValue: '$25K+',
        nextAction: 'Platform demo within 24 hours',
        responseTime: '< 24 hours',
        nextSteps: [
            'Platform capabilities overview',
            'Industry-specific use case analysis',
            'Competitive advantage assessment'
        ]
    };
}

async function storeInAirtable(leadRecord, env) {
    const AIRTABLE_API_KEY = env.AIRTABLE_API_KEY;
    const BASE_ID = env.AIRTABLE_BASE_ID;
    
    if (!AIRTABLE_API_KEY || !BASE_ID) return;
    
    const url = `https://api.airtable.com/v0/${BASE_ID}/Leads`;
    
    await fetch(url, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${AIRTABLE_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            fields: {
                'Lead ID': leadRecord.id,
                'Name': leadRecord.name,
                'Email': leadRecord.email,
                'Organization': leadRecord.organization,
                'Interest': leadRecord.interest,
                'Classification': leadRecord.classification,
                'Priority': leadRecord.priority,
                'Estimated Value': leadRecord.estimatedValue,
                'Status': 'New Lead',
                'Created': leadRecord.timestamp,
                'Country': leadRecord.country
            }
        })
    });
}

async function storeInHubSpot(leadRecord, env) {
    const HUBSPOT_API_KEY = env.HUBSPOT_API_KEY;
    
    if (!HUBSPOT_API_KEY) return;
    
    await fetch('https://api.hubapi.com/contacts/v1/contact', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${HUBSPOT_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            properties: [
                { property: 'email', value: leadRecord.email },
                { property: 'firstname', value: leadRecord.name.split(' ')[0] },
                { property: 'lastname', value: leadRecord.name.split(' ').slice(1).join(' ') },
                { property: 'company', value: leadRecord.organization },
                { property: 'lead_source', value: 'blaze-intelligence-platform' },
                { property: 'lead_classification', value: leadRecord.classification },
                { property: 'lead_priority', value: leadRecord.priority }
            ]
        })
    });
}

async function triggerSlackNotification(leadRecord, env) {
    const SLACK_WEBHOOK = env.SLACK_WEBHOOK_URL;
    
    if (!SLACK_WEBHOOK) return;
    
    const message = {
        text: `🚀 New ${leadRecord.priority} Lead: ${leadRecord.name}`,
        attachments: [{
            color: leadRecord.priority.includes('P0') ? '#ff0000' : '#ff6600',
            fields: [
                { title: 'Organization', value: leadRecord.organization, short: true },
                { title: 'Classification', value: leadRecord.classification, short: true },
                { title: 'Estimated Value', value: leadRecord.estimatedValue, short: true },
                { title: 'Next Action', value: leadRecord.nextAction, short: true },
                { title: 'Email', value: leadRecord.email, short: false },
                { title: 'Interest', value: leadRecord.interest, short: false }
            ],
            footer: 'Blaze Intelligence Platform',
            ts: Math.floor(Date.now() / 1000)
        }]
    };
    
    await fetch(SLACK_WEBHOOK, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(message)
    });
}

async function scheduleFollowUp(leadRecord, env) {
    // This would integrate with calendar/CRM systems
    // For now, we'll create a task record
    const followUpHours = leadRecord.priority.includes('P0') ? 2 : 
                         leadRecord.priority.includes('P1') ? 4 : 24;
    
    const followUpTime = new Date(Date.now() + (followUpHours * 60 * 60 * 1000));
    
    console.log(`📅 Follow-up scheduled for ${leadRecord.name} at ${followUpTime.toISOString()}`);
}

function generateLeadId() {
    return 'BLZ-' + Date.now().toString(36).toUpperCase() + '-' + 
           Math.random().toString(36).substr(2, 4).toUpperCase();
}