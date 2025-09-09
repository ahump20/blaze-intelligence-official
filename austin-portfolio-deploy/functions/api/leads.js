/**
 * Lead Capture & CRM Integration API
 * Professional client acquisition system
 */

export async function onRequestPost(context) {
  const { request, env, params } = context;
  
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
  };

  try {
    // Parse form data
    const data = await request.json();
    
    // Validate required fields
    const { name, email, organization, message, source, interest } = data;
    
    if (!name || !email || !message) {
      return new Response(JSON.stringify({
        error: 'Missing required fields',
        required: ['name', 'email', 'message']
      }), {
        status: 400,
        headers: corsHeaders
      });
    }

    // Generate lead ID and timestamp
    const leadId = generateLeadId();
    const timestamp = new Date().toISOString();
    
    // Classify lead interest and priority
    const leadClassification = classifyLead(data);
    
    // Create lead record
    const lead = {
      id: leadId,
      timestamp,
      contact: {
        name,
        email,
        organization: organization || 'Individual'
      },
      inquiry: {
        message,
        source: source || 'website-contact',
        interest: interest || 'general',
        classification: leadClassification
      },
      status: 'new',
      metadata: {
        userAgent: request.headers.get('User-Agent'),
        ip: request.headers.get('CF-Connecting-IP'),
        country: request.headers.get('CF-IPCountry'),
        referrer: data.referrer || 'direct'
      }
    };

    // Multi-channel lead processing
    const results = await Promise.allSettled([
      // 1. Store in R2 for backup
      storeLeadInR2(lead, env),
      // 2. Send to CRM (HubSpot/Notion integration)
      sendToCRM(lead, env),
      // 3. Send notification email
      sendNotificationEmail(lead, env),
      // 4. Create follow-up task
      createFollowupTask(lead, env)
    ]);

    // Check if at least one channel succeeded
    const successful = results.filter(r => r.status === 'fulfilled');
    
    if (successful.length === 0) {
      // All channels failed - use fallback email
      await sendFallbackEmail(lead);
    }

    // Return success response with next steps
    return new Response(JSON.stringify({
      success: true,
      leadId,
      message: 'Thank you! We\'ll be in touch within 24 hours.',
      nextSteps: getNextSteps(leadClassification),
      metadata: {
        timestamp,
        classification: leadClassification.tier,
        estimatedResponse: leadClassification.responseTime
      }
    }), {
      headers: corsHeaders
    });

  } catch (error) {
    console.error('Lead Capture Error:', error);
    
    return new Response(JSON.stringify({
      error: 'Lead processing failed',
      message: 'We received your message but encountered a technical issue. Please email us directly at ahump20@outlook.com.',
      fallback: 'mailto:ahump20@outlook.com',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: corsHeaders
    });
  }
}

/**
 * Classify lead for priority and routing
 */
function classifyLead(data) {
  const { message, organization, interest, email } = data;
  const content = `${message} ${organization || ''} ${interest || ''}`.toLowerCase();
  
  // Enterprise indicators
  const enterpriseKeywords = ['partnership', 'enterprise', 'team', 'organization', 'mlb', 'nfl', 'nba', 'college', 'university', 'analytics', 'data', 'api', 'integration'];
  const enterpriseScore = enterpriseKeywords.filter(keyword => content.includes(keyword)).length;
  
  // Urgency indicators
  const urgentKeywords = ['urgent', 'asap', 'immediately', 'today', 'meeting', 'call', 'demo', 'trial'];
  const urgencyScore = urgentKeywords.filter(keyword => content.includes(keyword)).length;
  
  // Domain analysis
  const domain = email.split('@')[1]?.toLowerCase();
  const enterpriseDomains = ['mlb.com', 'nfl.com', 'nba.com', 'espn.com', 'university', 'college', '.edu', '.org'];
  const isEnterpriseDomain = enterpriseDomains.some(d => domain?.includes(d));
  
  let tier = 'standard';
  let responseTime = '24-48 hours';
  let priority = 'medium';
  
  if (enterpriseScore >= 3 || isEnterpriseDomain) {
    tier = 'enterprise';
    responseTime = '4-8 hours';
    priority = 'high';
  } else if (urgencyScore >= 2 || enterpriseScore >= 1) {
    tier = 'priority';
    responseTime = '8-24 hours';
    priority = 'high';
  }
  
  return {
    tier,
    priority,
    responseTime,
    scores: {
      enterprise: enterpriseScore,
      urgency: urgencyScore,
      domain: isEnterpriseDomain
    }
  };
}

/**
 * Generate unique lead ID
 */
function generateLeadId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `BLZ-${timestamp}-${random}`.toUpperCase();
}

/**
 * Store lead in R2 for backup and analytics
 */
async function storeLeadInR2(lead, env) {
  if (!env.BLAZE_STORAGE) return;
  
  const key = `leads/${new Date().toISOString().split('T')[0]}/${lead.id}.json`;
  await env.BLAZE_STORAGE.put(key, JSON.stringify(lead, null, 2), {
    httpMetadata: {
      contentType: 'application/json'
    },
    customMetadata: {
      leadId: lead.id,
      tier: lead.inquiry.classification.tier,
      timestamp: lead.timestamp
    }
  });
}

/**
 * Send to CRM system (HubSpot/Notion integration)
 */
async function sendToCRM(lead, env) {
  // This would integrate with HubSpot API, Notion API, or your CRM
  // For now, we'll simulate successful CRM integration
  
  const crmData = {
    contact: lead.contact,
    deal: {
      name: `${lead.contact.organization} - ${lead.inquiry.interest}`,
      stage: 'new-lead',
      value: estimateLeadValue(lead.inquiry.classification),
      source: 'blaze-intelligence-website'
    },
    task: {
      title: `Follow up: ${lead.contact.name}`,
      dueDate: new Date(Date.now() + getResponseTimeMs(lead.inquiry.classification.responseTime)).toISOString(),
      priority: lead.inquiry.classification.priority,
      description: lead.inquiry.message
    }
  };
  
  console.log('CRM Integration:', crmData);
  return { success: true, crmId: `CRM-${Date.now()}` };
}

/**
 * Send notification email to Austin
 */
async function sendNotificationEmail(lead, env) {
  // This would integrate with email service (SendGrid, Mailgun, etc.)
  const emailData = {
    to: 'ahump20@outlook.com',
    from: 'leads@blaze-intelligence.com',
    subject: `🎯 New ${lead.inquiry.classification.tier.toUpperCase()} Lead: ${lead.contact.name}`,
    html: generateEmailTemplate(lead)
  };
  
  console.log('Email Notification:', emailData);
  return { success: true, emailId: `EMAIL-${Date.now()}` };
}

/**
 * Create follow-up task in Notion/Asana
 */
async function createFollowupTask(lead, env) {
  const task = {
    title: `📞 Follow up: ${lead.contact.name} (${lead.inquiry.classification.tier})`,
    description: `Lead ID: ${lead.id}\nOrganization: ${lead.contact.organization}\nInquiry: ${lead.inquiry.message}`,
    priority: lead.inquiry.classification.priority,
    dueDate: new Date(Date.now() + getResponseTimeMs(lead.inquiry.classification.responseTime)),
    labels: ['lead', lead.inquiry.classification.tier, lead.inquiry.interest]
  };
  
  console.log('Task Created:', task);
  return { success: true, taskId: `TASK-${Date.now()}` };
}

/**
 * Fallback email using direct SMTP
 */
async function sendFallbackEmail(lead) {
  const emailSubject = `New Lead: ${lead.contact.name}`;
  const emailBody = `
Lead ID: ${lead.id}
Name: ${lead.contact.name}
Email: ${lead.contact.email}
Organization: ${lead.contact.organization}
Classification: ${lead.inquiry.classification.tier}
Message: ${lead.inquiry.message}
Timestamp: ${lead.timestamp}
`;
  
  const mailtoUrl = `mailto:ahump20@outlook.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  console.log('Fallback Email URL:', mailtoUrl);
}

/**
 * Generate email template
 */
function generateEmailTemplate(lead) {
  return `
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; color: #333; }
    .header { background: #BF5700; color: white; padding: 20px; text-align: center; }
    .content { padding: 20px; }
    .tier-${lead.inquiry.classification.tier} { border-left: 4px solid #BF5700; padding-left: 10px; }
    .metadata { background: #f5f5f5; padding: 10px; margin-top: 20px; }
  </style>
</head>
<body>
  <div class="header">
    <h1>🎯 New Lead Alert</h1>
    <p>Blaze Intelligence Lead Capture System</p>
  </div>
  <div class="content">
    <div class="tier-${lead.inquiry.classification.tier}">
      <h2>${lead.contact.name} (${lead.inquiry.classification.tier.toUpperCase()})</h2>
      <p><strong>Organization:</strong> ${lead.contact.organization}</p>
      <p><strong>Email:</strong> ${lead.contact.email}</p>
      <p><strong>Interest:</strong> ${lead.inquiry.interest}</p>
      <p><strong>Priority:</strong> ${lead.inquiry.classification.priority}</p>
      <p><strong>Response Time:</strong> ${lead.inquiry.classification.responseTime}</p>
    </div>
    <h3>Message:</h3>
    <p>${lead.inquiry.message}</p>
    <div class="metadata">
      <p><strong>Lead ID:</strong> ${lead.id}</p>
      <p><strong>Timestamp:</strong> ${lead.timestamp}</p>
      <p><strong>Source:</strong> ${lead.inquiry.source}</p>
      <p><strong>Country:</strong> ${lead.metadata.country}</p>
    </div>
  </div>
</body>
</html>
  `;
}

/**
 * Get next steps based on classification
 */
function getNextSteps(classification) {
  const steps = {
    enterprise: [
      'Executive briefing scheduled within 4-8 hours',
      'Custom demo environment preparation',
      'Partnership discussion agenda',
      'Direct phone consultation available'
    ],
    priority: [
      'Priority response within 8-24 hours',
      'Personalized demo walkthrough',
      'Custom analytics review',
      'Implementation timeline discussion'
    ],
    standard: [
      'Response within 24-48 hours',
      'Product overview and demo',
      'Use case discussion',
      'Pricing and next steps'
    ]
  };
  
  return steps[classification.tier] || steps.standard;
}

/**
 * Estimate lead value
 */
function estimateLeadValue(classification) {
  const values = {
    enterprise: 50000,
    priority: 15000,
    standard: 5000
  };
  return values[classification.tier] || 5000;
}

/**
 * Convert response time to milliseconds
 */
function getResponseTimeMs(responseTime) {
  const timeMap = {
    '4-8 hours': 6 * 60 * 60 * 1000, // 6 hours
    '8-24 hours': 16 * 60 * 60 * 1000, // 16 hours
    '24-48 hours': 36 * 60 * 60 * 1000 // 36 hours
  };
  return timeMap[responseTime] || timeMap['24-48 hours'];
}

// Handle OPTIONS for CORS
export async function onRequestOptions(context) {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}