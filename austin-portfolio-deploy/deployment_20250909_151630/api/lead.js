// Lead Capture API - Integrates with HubSpot/Notion pipeline

export default async function handler(request, env, ctx) {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ error: 'Method not allowed' }), {
      status: 405,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }

  try {
    const leadData = await request.json();
    
    // Validate required fields
    if (!leadData.name || !leadData.email || !leadData.message) {
      return new Response(JSON.stringify({ 
        error: 'Missing required fields',
        required: ['name', 'email', 'message']
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // Sanitize and structure lead data
    const cleanLead = {
      name: String(leadData.name).trim(),
      email: String(leadData.email).trim().toLowerCase(),
      organization: leadData.organization ? String(leadData.organization).trim() : null,
      message: String(leadData.message).trim(),
      source: 'blaze-intelligence.com',
      timestamp: new Date().toISOString(),
      ip: request.headers.get('CF-Connecting-IP') || 'unknown',
      user_agent: request.headers.get('User-Agent') || 'unknown'
    };

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(cleanLead.email)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid email format' 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json', ...corsHeaders }
      });
    }

    // In production, this would integrate with:
    // 1. HubSpot CRM API
    // 2. Notion database
    // 3. Email notifications
    // 4. Calendar booking system (Calendly/Cal.com)

    // For now, simulate successful processing
    const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // TODO: Integrate with actual CRM/notification systems
    // await sendToHubSpot(cleanLead);
    // await saveToNotion(cleanLead);
    // await sendEmailNotification(cleanLead);

    console.log('New lead received:', {
      id: leadId,
      name: cleanLead.name,
      email: cleanLead.email,
      organization: cleanLead.organization,
      timestamp: cleanLead.timestamp
    });

    return new Response(JSON.stringify({
      success: true,
      message: 'Lead captured successfully',
      lead_id: leadId,
      next_steps: 'Our team will respond within 24 hours'
    }), {
      headers: { 
        'Content-Type': 'application/json',
        ...corsHeaders 
      }
    });

  } catch (error) {
    console.error('Lead capture error:', error);
    
    return new Response(JSON.stringify({
      error: 'Internal server error',
      message: 'Failed to process lead submission'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json', ...corsHeaders }
    });
  }
}

// Future integrations to implement:

async function sendToHubSpot(leadData) {
  // HubSpot CRM integration
  // POST to HubSpot Contacts API
  // Include lead scoring based on organization size and message content
}

async function saveToNotion(leadData) {
  // Notion database integration for lead tracking
  // Create new page in leads database with structured properties
}

async function sendEmailNotification(leadData) {
  // Send immediate notification to sales team
  // Include lead details and recommended follow-up actions
}

async function scheduleFollowUp(leadData) {
  // Integrate with calendar system for automatic follow-up scheduling
  // Create calendar holds based on lead priority
}