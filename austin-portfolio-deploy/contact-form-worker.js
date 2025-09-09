/**
 * Blaze Intelligence Contact Form Handler
 * Cloudflare Worker for processing form submissions
 * Sends emails and stores leads
 */

export default {
  async fetch(request, env) {
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // Only accept POST requests
    if (request.method !== 'POST') {
      return new Response('Method not allowed', { 
        status: 405,
        headers: corsHeaders 
      });
    }

    try {
      const formData = await request.json();
      
      // Validate required fields
      const requiredFields = ['firstName', 'lastName', 'email', 'message'];
      for (const field of requiredFields) {
        if (!formData[field]) {
          return new Response(JSON.stringify({ 
            error: `Missing required field: ${field}` 
          }), {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          });
        }
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        return new Response(JSON.stringify({ 
          error: 'Invalid email format' 
        }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }

      // Store lead data with timestamp
      const leadData = {
        ...formData,
        timestamp: new Date().toISOString(),
        source: request.headers.get('Referer') || 'direct',
        ip: request.headers.get('CF-Connecting-IP') || 'unknown'
      };

      // Store in KV storage if available
      if (env.LEADS) {
        const leadId = `lead_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await env.LEADS.put(leadId, JSON.stringify(leadData));
      }

      // Send email notification (using Mailgun or SendGrid)
      const emailResponse = await sendEmailNotification(leadData, env);

      // Send auto-response to user
      const autoResponse = await sendAutoResponse(leadData, env);

      // Return success response
      return new Response(JSON.stringify({
        success: true,
        message: 'Thank you for contacting Blaze Intelligence! We\'ll be in touch within 24 hours.',
        leadId: leadData.timestamp
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });

    } catch (error) {
      console.error('Contact form error:', error);
      return new Response(JSON.stringify({ 
        error: 'Failed to process submission. Please try again.' 
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  }
};

async function sendEmailNotification(leadData, env) {
  // Email to Austin
  const emailContent = `
    <h2>New Lead from Blaze Intelligence</h2>
    <p><strong>Name:</strong> ${leadData.firstName} ${leadData.lastName}</p>
    <p><strong>Email:</strong> ${leadData.email}</p>
    <p><strong>Organization:</strong> ${leadData.organization || 'Not provided'}</p>
    <p><strong>Team/Sport:</strong> ${leadData.sport || 'Not specified'}</p>
    <p><strong>Message:</strong></p>
    <p>${leadData.message}</p>
    <hr>
    <p><small>Submitted: ${leadData.timestamp}</small></p>
    <p><small>Source: ${leadData.source}</small></p>
  `;

  // Using fetch to send email via HTTP API (Mailgun example)
  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    const mailgunUrl = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
    const response = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('api:' + env.MAILGUN_API_KEY),
      },
      body: new URLSearchParams({
        from: 'Blaze Intelligence <noreply@blaze-intelligence.com>',
        to: 'ahump20@outlook.com',
        subject: `New Lead: ${leadData.firstName} ${leadData.lastName}`,
        html: emailContent
      })
    });
    return response;
  }

  // Fallback: Log to console if no email service configured
  console.log('Email notification:', emailContent);
  return { ok: true };
}

async function sendAutoResponse(leadData, env) {
  const autoResponseContent = `
    <h2>Thank you for contacting Blaze Intelligence!</h2>
    <p>Hi ${leadData.firstName},</p>
    <p>We've received your message and appreciate your interest in Blaze Intelligence's championship-level sports analytics platform.</p>
    <p><strong>What happens next:</strong></p>
    <ul>
      <li>Our team will review your inquiry within 24 hours</li>
      <li>We'll prepare relevant materials based on your needs</li>
      <li>You'll receive a personalized response with next steps</li>
    </ul>
    <p><strong>In the meantime:</strong></p>
    <ul>
      <li>📊 <a href="https://blaze-intelligence.com/dashboard.html">Explore our live dashboard</a></li>
      <li>💰 <a href="https://blaze-intelligence.com/savings-calculator.html">Calculate your potential savings</a></li>
      <li>📈 <a href="https://blaze-intelligence.com/methods-definitions.html">Review our methodology</a></li>
    </ul>
    <p>Best regards,<br>
    The Blaze Intelligence Team</p>
    <hr>
    <p><small>This is an automated response. Please do not reply to this email.</small></p>
  `;

  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    const mailgunUrl = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
    const response = await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('api:' + env.MAILGUN_API_KEY),
      },
      body: new URLSearchParams({
        from: 'Blaze Intelligence <noreply@blaze-intelligence.com>',
        to: leadData.email,
        subject: 'Thank you for contacting Blaze Intelligence',
        html: autoResponseContent
      })
    });
    return response;
  }

  return { ok: true };
}