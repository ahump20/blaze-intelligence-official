/**
 * Blaze Intelligence HubSpot CRM Integration
 * Manages leads, contacts, and client pipeline
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    
    // CORS headers for all responses
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    };
    
    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      if (url.pathname === '/api/hubspot/lead' && request.method === 'POST') {
        return await createLead(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/hubspot/contacts' && request.method === 'GET') {
        return await getContacts(env, corsHeaders);
      }
      
      return new Response('Not Found', { status: 404, headers: corsHeaders });
      
    } catch (error) {
      console.error('HubSpot API Error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal Server Error', message: error.message }),
        { 
          status: 500, 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }
  }
};

/**
 * Create a new lead in HubSpot
 */
async function createLead(request, env, corsHeaders) {
  const leadData = await request.json();
  
  // Validate required fields
  const { email, firstName, lastName, company, phone, interest } = leadData;
  
  if (!email) {
    return new Response(
      JSON.stringify({ error: 'Email is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Prepare HubSpot contact data
  const hubspotData = {
    properties: {
      email: email,
      firstname: firstName || '',
      lastname: lastName || '',
      company: company || '',
      phone: phone || '',
      lifecyclestage: 'lead',
      lead_source: 'Blaze Intelligence Website',
      hs_lead_status: 'NEW',
      
      // Custom Blaze Intelligence fields
      blaze_interest_area: interest || 'General Inquiry',
      blaze_platform: 'Championship Intelligence',
      blaze_signup_date: new Date().toISOString(),
      blaze_lead_score: calculateLeadScore(leadData),
      
      // Additional context
      website: 'blaze-intelligence.pages.dev',
      original_source: 'Direct Traffic',
      original_source_drill_down_1: 'blaze-intelligence.pages.dev'
    }
  };
  
  // Add optional fields if provided
  if (leadData.message) {
    hubspotData.properties.hs_content_membership_notes = leadData.message;
  }
  
  if (leadData.requestedDemo) {
    hubspotData.properties.demo_requested = 'true';
    hubspotData.properties.demo_request_date = new Date().toISOString();
  }
  
  if (leadData.teamSize) {
    hubspotData.properties.team_size = leadData.teamSize;
  }
  
  if (leadData.sport) {
    hubspotData.properties.primary_sport = leadData.sport;
  }
  
  // Create contact in HubSpot
  const hubspotResponse = await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(hubspotData),
  });
  
  const responseData = await hubspotResponse.json();
  
  if (!hubspotResponse.ok) {
    // Handle duplicate email case
    if (responseData.category === 'CONFLICT') {
      return new Response(
        JSON.stringify({ 
          message: 'Contact already exists. We\'ll update your information.', 
          status: 'updated' 
        }),
        { 
          status: 200, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }
    
    throw new Error(`HubSpot API error: ${responseData.message}`);
  }
  
  // Create a follow-up task for the sales team
  if (leadData.requestedDemo) {
    await createFollowUpTask(responseData.id, env);
  }
  
  return new Response(
    JSON.stringify({ 
      message: 'Lead created successfully', 
      contactId: responseData.id,
      status: 'created' 
    }),
    { 
      status: 201, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Get contacts from HubSpot (for dashboard)
 */
async function getContacts(env, corsHeaders) {
  const hubspotResponse = await fetch(
    'https://api.hubapi.com/crm/v3/objects/contacts?properties=email,firstname,lastname,company,blaze_interest_area,createdate&limit=50',
    {
      headers: {
        'Authorization': `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
    }
  );
  
  const data = await hubspotResponse.json();
  
  if (!hubspotResponse.ok) {
    throw new Error(`HubSpot API error: ${data.message}`);
  }
  
  // Transform data for frontend
  const contacts = data.results.map(contact => ({
    id: contact.id,
    email: contact.properties.email,
    name: `${contact.properties.firstname || ''} ${contact.properties.lastname || ''}`.trim(),
    company: contact.properties.company || '',
    interest: contact.properties.blaze_interest_area || '',
    createdDate: contact.properties.createdate,
  }));
  
  return new Response(
    JSON.stringify({ contacts, total: data.total }),
    { 
      status: 200, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Calculate lead score based on provided data
 */
function calculateLeadScore(leadData) {
  let score = 50; // Base score
  
  // Company provided
  if (leadData.company) score += 20;
  
  // Phone provided
  if (leadData.phone) score += 15;
  
  // Demo requested
  if (leadData.requestedDemo) score += 30;
  
  // Message length indicates engagement
  if (leadData.message && leadData.message.length > 50) score += 10;
  
  // Team size indicates serious interest
  if (leadData.teamSize && parseInt(leadData.teamSize) > 5) score += 15;
  
  // Professional sports indicates high value
  if (leadData.sport && ['MLB', 'NFL', 'NBA', 'NCAA'].includes(leadData.sport)) {
    score += 25;
  }
  
  return Math.min(100, score);
}

/**
 * Create follow-up task for demo requests
 */
async function createFollowUpTask(contactId, env) {
  const taskData = {
    properties: {
      hs_task_subject: 'Follow up on Blaze Intelligence Demo Request',
      hs_task_body: 'Contact requested a demo of the Blaze Intelligence platform. Schedule within 24 hours.',
      hs_task_status: 'NOT_STARTED',
      hs_task_priority: 'HIGH',
      hs_task_type: 'CALL',
      hs_timestamp: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(), // 24 hours from now
    },
    associations: {
      contacts: [contactId]
    }
  };
  
  try {
    await fetch('https://api.hubapi.com/crm/v3/objects/tasks', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(taskData),
    });
  } catch (error) {
    console.warn('Failed to create follow-up task:', error);
    // Don't fail the main request if task creation fails
  }
}