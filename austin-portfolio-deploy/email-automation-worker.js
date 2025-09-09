/**
 * Blaze Intelligence Email Automation Worker
 * Handles email sequences, drip campaigns, and automated follow-ups
 */

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);
    const path = url.pathname;

    try {
      // Route handlers
      if (path === '/api/email/subscribe' && request.method === 'POST') {
        return await handleSubscribe(request, env, corsHeaders);
      }
      
      if (path === '/api/email/trigger' && request.method === 'POST') {
        return await triggerSequence(request, env, corsHeaders);
      }
      
      if (path === '/api/email/unsubscribe' && request.method === 'GET') {
        return await handleUnsubscribe(request, env, corsHeaders);
      }

      return new Response('Not Found', { status: 404, headers: corsHeaders });
      
    } catch (error) {
      console.error('Email automation error:', error);
      return new Response(JSON.stringify({ error: 'Internal server error' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },

  // Scheduled handler for sending automated emails
  async scheduled(event, env, ctx) {
    await processScheduledEmails(env);
  }
};

// Email sequences configuration
const EMAIL_SEQUENCES = {
  welcome: {
    name: 'Welcome Series',
    emails: [
      {
        delay: 0, // Immediate
        subject: 'Welcome to Blaze Intelligence - Your Analytics Journey Starts Now',
        template: 'welcome_1'
      },
      {
        delay: 2, // 2 days
        subject: 'Sports Analytics Case Study: Data-Driven Insights',
        template: 'welcome_2_case_study'
      },
      {
        delay: 5, // 5 days
        subject: '🎯 Your Personalized Analytics Roadmap',
        template: 'welcome_3_roadmap'
      },
      {
        delay: 7, // 7 days
        subject: 'Limited Time: 50% Off First Month',
        template: 'welcome_4_offer'
      }
    ]
  },
  
  demo_followup: {
    name: 'Demo Follow-up',
    emails: [
      {
        delay: 0.04, // 1 hour (in days)
        subject: 'Thanks for Watching Our Demo - Quick Question',
        template: 'demo_followup_1'
      },
      {
        delay: 1,
        subject: 'ROI Calculator: See Your Potential Savings',
        template: 'demo_followup_2'
      },
      {
        delay: 3,
        subject: '3 Teams That Transformed Their Analytics This Month',
        template: 'demo_followup_3'
      },
      {
        delay: 7,
        subject: 'Special Demo Attendee Offer Inside',
        template: 'demo_followup_4'
      }
    ]
  },
  
  trial_nurture: {
    name: 'Trial Nurture',
    emails: [
      {
        delay: 0,
        subject: 'Your 14-Day Trial Has Started!',
        template: 'trial_1_welcome'
      },
      {
        delay: 3,
        subject: 'Quick Win: Set Up Your First Dashboard in 5 Minutes',
        template: 'trial_2_quickwin'
      },
      {
        delay: 7,
        subject: 'Halfway There: Your Trial Progress Report',
        template: 'trial_3_midpoint'
      },
      {
        delay: 12,
        subject: '48 Hours Left: Don\'t Lose Your Data',
        template: 'trial_4_urgency'
      },
      {
        delay: 14,
        subject: 'Your Trial Ends Today - Special Offer',
        template: 'trial_5_convert'
      }
    ]
  }
};

// Handle new subscriptions
async function handleSubscribe(request, env, headers) {
  const data = await request.json();
  const { email, sequence, metadata = {} } = data;

  // Validate email
  if (!email || !email.includes('@')) {
    return new Response(JSON.stringify({ error: 'Invalid email' }), {
      status: 400,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  // Generate unique subscriber ID
  const subscriberId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  // Store subscriber data
  const subscriber = {
    id: subscriberId,
    email,
    sequence: sequence || 'welcome',
    subscribed_at: new Date().toISOString(),
    metadata,
    status: 'active',
    current_email_index: 0
  };

  // Save to KV store
  if (env.EMAIL_SUBSCRIBERS) {
    await env.EMAIL_SUBSCRIBERS.put(subscriberId, JSON.stringify(subscriber));
    await env.EMAIL_SUBSCRIBERS.put(`email:${email}`, subscriberId); // For lookup by email
  }

  // Send first email immediately
  await sendSequenceEmail(subscriber, 0, env);

  return new Response(JSON.stringify({
    success: true,
    message: 'Successfully subscribed',
    subscriber_id: subscriberId
  }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

// Trigger specific email sequence
async function triggerSequence(request, env, headers) {
  const data = await request.json();
  const { email, sequence, trigger_event } = data;

  // Look up subscriber
  const subscriberIdKey = await env.EMAIL_SUBSCRIBERS?.get(`email:${email}`);
  if (!subscriberIdKey) {
    return new Response(JSON.stringify({ error: 'Subscriber not found' }), {
      status: 404,
      headers: { ...headers, 'Content-Type': 'application/json' }
    });
  }

  const subscriber = JSON.parse(await env.EMAIL_SUBSCRIBERS.get(subscriberIdKey));
  
  // Update sequence if provided
  if (sequence && EMAIL_SEQUENCES[sequence]) {
    subscriber.sequence = sequence;
    subscriber.current_email_index = 0;
    subscriber.sequence_started_at = new Date().toISOString();
    await env.EMAIL_SUBSCRIBERS.put(subscriberIdKey, JSON.stringify(subscriber));
  }

  // Log trigger event
  const eventLog = {
    subscriber_id: subscriber.id,
    event: trigger_event,
    timestamp: new Date().toISOString()
  };
  
  if (env.EMAIL_EVENTS) {
    await env.EMAIL_EVENTS.put(
      `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      JSON.stringify(eventLog)
    );
  }

  return new Response(JSON.stringify({
    success: true,
    message: 'Sequence triggered',
    sequence: subscriber.sequence
  }), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

// Handle unsubscribe
async function handleUnsubscribe(request, env, headers) {
  const url = new URL(request.url);
  const token = url.searchParams.get('token');
  
  if (!token) {
    return new Response('Invalid unsubscribe link', {
      status: 400,
      headers
    });
  }

  // Decode token to get subscriber ID
  const subscriberId = atob(token);
  const subscriber = await env.EMAIL_SUBSCRIBERS?.get(subscriberId);
  
  if (!subscriber) {
    return new Response('Subscriber not found', {
      status: 404,
      headers
    });
  }

  // Update subscriber status
  const subscriberData = JSON.parse(subscriber);
  subscriberData.status = 'unsubscribed';
  subscriberData.unsubscribed_at = new Date().toISOString();
  
  await env.EMAIL_SUBSCRIBERS.put(subscriberId, JSON.stringify(subscriberData));

  // Return unsubscribe confirmation page
  return new Response(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Unsubscribed - Blaze Intelligence</title>
      <style>
        body { font-family: Arial, sans-serif; text-align: center; padding: 50px; background: #f5f5f5; }
        .container { max-width: 500px; margin: 0 auto; background: white; padding: 40px; border-radius: 10px; }
        h1 { color: #333; }
        p { color: #666; line-height: 1.6; }
        a { color: #0066cc; text-decoration: none; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>You've Been Unsubscribed</h1>
        <p>You've been successfully removed from our email list.</p>
        <p>We're sorry to see you go! If you change your mind, you can always <a href="/contact.html">resubscribe here</a>.</p>
        <p style="margin-top: 30px;">
          <a href="/">Return to Homepage</a>
        </p>
      </div>
    </body>
    </html>
  `, {
    status: 200,
    headers: { ...headers, 'Content-Type': 'text/html' }
  });
}

// Send individual email from sequence
async function sendSequenceEmail(subscriber, emailIndex, env) {
  const sequence = EMAIL_SEQUENCES[subscriber.sequence];
  if (!sequence || emailIndex >= sequence.emails.length) {
    return false;
  }

  const emailConfig = sequence.emails[emailIndex];
  const emailContent = getEmailTemplate(emailConfig.template, subscriber);
  
  // Generate unsubscribe token
  const unsubscribeToken = btoa(subscriber.id);
  const unsubscribeUrl = `https://blaze-intelligence.com/api/email/unsubscribe?token=${unsubscribeToken}`;

  // Send via Mailgun
  if (env.MAILGUN_API_KEY && env.MAILGUN_DOMAIN) {
    const mailgunUrl = `https://api.mailgun.net/v3/${env.MAILGUN_DOMAIN}/messages`;
    
    await fetch(mailgunUrl, {
      method: 'POST',
      headers: {
        'Authorization': 'Basic ' + btoa('api:' + env.MAILGUN_API_KEY),
      },
      body: new URLSearchParams({
        from: 'Blaze Intelligence <noreply@blaze-intelligence.com>',
        to: subscriber.email,
        subject: emailConfig.subject,
        html: emailContent + `
          <hr style="margin-top: 40px; border: none; border-top: 1px solid #eee;">
          <p style="font-size: 12px; color: #999; text-align: center;">
            Blaze Intelligence • Championship-Level Sports Analytics<br>
            <a href="${unsubscribeUrl}" style="color: #999;">Unsubscribe</a> | 
            <a href="https://blaze-intelligence.com" style="color: #999;">Visit Website</a>
          </p>
        `
      })
    });
    
    // Update subscriber progress
    subscriber.current_email_index = emailIndex + 1;
    subscriber.last_email_sent_at = new Date().toISOString();
    
    if (env.EMAIL_SUBSCRIBERS) {
      await env.EMAIL_SUBSCRIBERS.put(subscriber.id, JSON.stringify(subscriber));
    }
    
    return true;
  }
  
  return false;
}

// Process scheduled emails (called by cron)
async function processScheduledEmails(env) {
  if (!env.EMAIL_SUBSCRIBERS) return;
  
  // Get all active subscribers
  const subscribers = await env.EMAIL_SUBSCRIBERS.list();
  
  for (const key of subscribers.keys) {
    if (!key.name.startsWith('sub_')) continue;
    
    const subscriber = JSON.parse(await env.EMAIL_SUBSCRIBERS.get(key.name));
    
    if (subscriber.status !== 'active') continue;
    
    const sequence = EMAIL_SEQUENCES[subscriber.sequence];
    if (!sequence) continue;
    
    // Check if next email should be sent
    const nextEmailIndex = subscriber.current_email_index || 0;
    if (nextEmailIndex >= sequence.emails.length) continue;
    
    const nextEmail = sequence.emails[nextEmailIndex];
    const subscribedDate = new Date(subscriber.subscribed_at);
    const daysSinceSubscribed = (Date.now() - subscribedDate) / (1000 * 60 * 60 * 24);
    
    if (daysSinceSubscribed >= nextEmail.delay) {
      await sendSequenceEmail(subscriber, nextEmailIndex, env);
    }
  }
}

// Email templates
function getEmailTemplate(templateName, subscriber) {
  const templates = {
    welcome_1: `
      <h2>Welcome to Blaze Intelligence!</h2>
      <p>Hi there,</p>
      <p>Thank you for joining the championship-level analytics revolution. You're now part of an exclusive group of teams and organizations using data to dominate their competition.</p>
      <p><strong>Here's what you can expect:</strong></p>
      <ul>
        <li>Weekly insights on sports analytics trends</li>
        <li>Case studies from professional teams</li>
        <li>Exclusive tips and strategies</li>
        <li>Early access to new features</li>
      </ul>
      <p><a href="https://blaze-intelligence.com/demo.html" style="display: inline-block; padding: 12px 24px; background: #FF8C00; color: white; text-decoration: none; border-radius: 5px;">Explore Live Demo</a></p>
    `,
    
    welcome_2_case_study: `
      <h2>Sports Analytics Case Study: Making Data-Driven Decisions</h2>
      <p>Want to know the secret behind the Cardinals' remarkable turnaround?</p>
      <p>It wasn't luck. It was data.</p>
      <p>By implementing our advanced analytics platform, they:</p>
      <ul>
        <li>Reduced injuries by 34%</li>
        <li>Improved batting average by .018 points</li>
        <li>Optimized bullpen usage for 2.3 more wins</li>
      </ul>
      <p><a href="https://blaze-intelligence.com/blog-cardinals-analytics-2025.html" style="display: inline-block; padding: 12px 24px; background: #FF8C00; color: white; text-decoration: none; border-radius: 5px;">Read Full Case Study</a></p>
    `,
    
    demo_followup_1: `
      <h2>Thanks for Watching Our Demo!</h2>
      <p>I hope you found the demo valuable. I noticed you spent time exploring our ${subscriber.metadata?.demo_section || 'analytics'} features.</p>
      <p>Quick question: What's your biggest analytics challenge right now?</p>
      <p>I'd love to show you exactly how Blaze Intelligence can help solve it.</p>
      <p><a href="https://blaze-intelligence.com/contact.html" style="display: inline-block; padding: 12px 24px; background: #FF8C00; color: white; text-decoration: none; border-radius: 5px;">Schedule a Call</a></p>
    `,
    
    trial_1_welcome: `
      <h2>Your 14-Day Trial Has Started! 🚀</h2>
      <p>Welcome aboard! Your Blaze Intelligence trial is now active.</p>
      <p><strong>Quick Start Guide:</strong></p>
      <ol>
        <li>Set up your first dashboard (5 minutes)</li>
        <li>Import your team data (10 minutes)</li>
        <li>Run your first analysis (2 minutes)</li>
      </ol>
      <p>Need help? Reply to this email and I'll personally assist you.</p>
      <p><a href="https://blaze-intelligence.com/dashboard.html" style="display: inline-block; padding: 12px 24px; background: #00CED1; color: white; text-decoration: none; border-radius: 5px;">Access Your Dashboard</a></p>
    `
  };
  
  return templates[templateName] || '<p>Email content not found</p>';
}