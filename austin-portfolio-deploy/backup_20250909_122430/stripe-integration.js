/**
 * Blaze Intelligence Stripe Payment Integration
 * Handles subscriptions, billing, and championship-level pricing
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
      if (url.pathname === '/api/stripe/create-checkout' && request.method === 'POST') {
        return await createCheckoutSession(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/stripe/webhook' && request.method === 'POST') {
        return await handleWebhook(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/stripe/subscription-status' && request.method === 'GET') {
        return await getSubscriptionStatus(request, env, corsHeaders);
      }
      
      if (url.pathname === '/api/stripe/pricing' && request.method === 'GET') {
        return await getPricingPlans(env, corsHeaders);
      }
      
      return new Response('Not Found', { status: 404, headers: corsHeaders });
      
    } catch (error) {
      console.error('Stripe API Error:', error);
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
 * Create Stripe Checkout Session
 */
async function createCheckoutSession(request, env, corsHeaders) {
  const { plan, customerEmail, customerId } = await request.json();
  
  // Blaze Intelligence Championship Pricing Plans
  const pricingPlans = {
    'starter': {
      price_id: env.STRIPE_STARTER_PRICE_ID || 'price_1234starter',
      name: 'Starter Intelligence',
      amount: 99900, // $999/year
      description: 'Perfect for emerging programs ready to compete at the next level'
    },
    'professional': {
      price_id: env.STRIPE_PROFESSIONAL_PRICE_ID || 'price_1234pro',
      name: 'Professional Intelligence', 
      amount: 299900, // $2,999/year
      description: 'Championship-level analytics for serious contenders'
    },
    'enterprise': {
      price_id: env.STRIPE_ENTERPRISE_PRICE_ID || 'price_1234enterprise',
      name: 'Enterprise Intelligence',
      amount: 999900, // $9,999/year
      description: 'Ultimate competitive advantage for elite organizations'
    }
  };
  
  const selectedPlan = pricingPlans[plan];
  if (!selectedPlan) {
    return new Response(
      JSON.stringify({ error: 'Invalid pricing plan' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  // Create checkout session
  const checkoutData = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: [{
      price: selectedPlan.price_id,
      quantity: 1,
    }],
    success_url: `${request.headers.get('origin')}/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${request.headers.get('origin')}/pricing`,
    
    // Customer data
    ...(customerEmail && { customer_email: customerEmail }),
    ...(customerId && { customer: customerId }),
    
    // Metadata for tracking
    metadata: {
      plan: plan,
      platform: 'Blaze Intelligence',
      source: 'championship_platform'
    },
    
    // Subscription metadata
    subscription_data: {
      metadata: {
        plan_name: selectedPlan.name,
        blaze_features: JSON.stringify([
          'Live Sports Analytics',
          'Championship Intelligence',
          'Real-time Data Pipeline',
          'Advanced Pattern Recognition',
          '24/7 Performance Monitoring'
        ])
      }
    },
    
    // Allow promotion codes
    allow_promotion_codes: true,
    
    // Tax calculation
    automatic_tax: {
      enabled: true,
    }
  };
  
  const stripeResponse = await fetch('https://api.stripe.com/v1/checkout/sessions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams(checkoutData).toString(),
  });
  
  const session = await stripeResponse.json();
  
  if (!stripeResponse.ok) {
    throw new Error(`Stripe error: ${session.error?.message || 'Unknown error'}`);
  }
  
  return new Response(
    JSON.stringify({ 
      sessionId: session.id,
      url: session.url,
      plan: selectedPlan.name,
      amount: selectedPlan.amount / 100 // Convert to dollars
    }),
    { 
      status: 201, 
      headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
    }
  );
}

/**
 * Handle Stripe Webhooks
 */
async function handleWebhook(request, env, corsHeaders) {
  const payload = await request.text();
  const signature = request.headers.get('stripe-signature');
  
  // Verify webhook signature
  const webhookSecret = env.STRIPE_WEBHOOK_SECRET;
  
  try {
    // In production, use Stripe's webhook signature verification
    // For now, we'll process the event directly
    const event = JSON.parse(payload);
    
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object, env);
        break;
        
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object, env);
        break;
        
      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object, env);
        break;
        
      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object, env);
        break;
        
      case 'invoice.payment_succeeded':
        await handlePaymentSucceeded(event.data.object, env);
        break;
        
      case 'invoice.payment_failed':
        await handlePaymentFailed(event.data.object, env);
        break;
        
      default:
        console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Webhook processing failed' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
}

/**
 * Get subscription status for a customer
 */
async function getSubscriptionStatus(request, env, corsHeaders) {
  const url = new URL(request.url);
  const customerId = url.searchParams.get('customer_id');
  
  if (!customerId) {
    return new Response(
      JSON.stringify({ error: 'Customer ID required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
  
  const stripeResponse = await fetch(`https://api.stripe.com/v1/subscriptions?customer=${customerId}&status=active`, {
    headers: {
      'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
    },
  });
  
  const subscriptions = await stripeResponse.json();
  
  if (!stripeResponse.ok) {
    throw new Error(`Stripe error: ${subscriptions.error?.message || 'Unknown error'}`);
  }
  
  const activeSubscriptions = subscriptions.data.map(sub => ({
    id: sub.id,
    status: sub.status,
    current_period_end: sub.current_period_end,
    plan: sub.metadata?.plan_name || 'Unknown Plan',
    amount: sub.items.data[0]?.price?.unit_amount || 0
  }));
  
  return new Response(
    JSON.stringify({ subscriptions: activeSubscriptions }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Get available pricing plans
 */
async function getPricingPlans(env, corsHeaders) {
  const plans = [
    {
      id: 'starter',
      name: 'Starter Intelligence',
      price: 999,
      interval: 'year',
      description: 'Perfect for emerging programs ready to compete at the next level',
      features: [
        'Live Cardinals, Titans, Longhorns, Grizzlies Analytics',
        'Real-time Performance Metrics',
        'Championship Readiness Scoring',
        'Basic Pattern Recognition',
        'Email Support'
      ],
      savings: '67% vs Hudl Assist',
      popular: false
    },
    {
      id: 'professional', 
      name: 'Professional Intelligence',
      price: 2999,
      interval: 'year',
      description: 'Championship-level analytics for serious contenders',
      features: [
        'Full League-Wide Coverage',
        'Advanced AI Pattern Recognition',
        '24/7 Performance Monitoring',
        'Predictive Analytics Engine',
        'Custom Team Dashboards',
        'Priority Support',
        'API Access'
      ],
      savings: '74% vs Hudl Pro',
      popular: true
    },
    {
      id: 'enterprise',
      name: 'Enterprise Intelligence', 
      price: 9999,
      interval: 'year',
      description: 'Ultimate competitive advantage for elite organizations',
      features: [
        'Everything in Professional',
        'White-label Solutions',
        'Custom AI Model Training',
        'Dedicated Success Manager',
        'Advanced Integrations',
        'Real-time Data Feeds',
        'Championship Consulting',
        'Unlimited Users'
      ],
      savings: '80% vs Enterprise Solutions',
      popular: false
    }
  ];
  
  return new Response(
    JSON.stringify({ plans }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

/**
 * Webhook Handler Functions
 */
async function handleCheckoutCompleted(session, env) {
  console.log('Checkout completed:', session.id);
  
  // Create HubSpot contact for new customer
  if (session.customer_details?.email) {
    await createHubSpotContact(session, env);
  }
  
  // Send welcome email
  await sendWelcomeEmail(session, env);
}

async function handleSubscriptionCreated(subscription, env) {
  console.log('Subscription created:', subscription.id);
  
  // Update customer record with subscription details
  const planName = subscription.metadata?.plan_name || 'Unknown Plan';
  
  // Log subscription metrics
  await logSubscriptionMetrics(subscription, 'created', env);
}

async function handlePaymentSucceeded(invoice, env) {
  console.log('Payment succeeded:', invoice.id);
  
  // Update billing status
  // Send receipt
  // Log revenue metrics
}

async function createHubSpotContact(session, env) {
  const contactData = {
    properties: {
      email: session.customer_details.email,
      firstname: session.customer_details.name?.split(' ')[0] || '',
      lastname: session.customer_details.name?.split(' ').slice(1).join(' ') || '',
      lifecyclestage: 'customer',
      lead_source: 'Stripe Checkout',
      blaze_subscription_status: 'active',
      blaze_plan: session.metadata?.plan || 'unknown',
      blaze_customer_id: session.customer
    }
  };
  
  try {
    await fetch('https://api.hubapi.com/crm/v3/objects/contacts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.HUBSPOT_ACCESS_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(contactData),
    });
  } catch (error) {
    console.warn('Failed to create HubSpot contact:', error);
  }
}

async function sendWelcomeEmail(session, env) {
  // Integration point for email service (Mailgun, SendGrid, etc.)
  console.log(`Welcome email triggered for ${session.customer_details?.email}`);
}

async function logSubscriptionMetrics(subscription, event, env) {
  const metrics = {
    event: event,
    subscription_id: subscription.id,
    customer_id: subscription.customer,
    plan: subscription.metadata?.plan_name,
    amount: subscription.items?.data[0]?.price?.unit_amount,
    timestamp: new Date().toISOString()
  };
  
  // Log to analytics service
  console.log('Subscription metrics:', metrics);
}

async function handleSubscriptionUpdated(subscription, env) {
  console.log('Subscription updated:', subscription.id);
  await logSubscriptionMetrics(subscription, 'updated', env);
}

async function handleSubscriptionDeleted(subscription, env) {
  console.log('Subscription cancelled:', subscription.id);
  await logSubscriptionMetrics(subscription, 'cancelled', env);
}

async function handlePaymentFailed(invoice, env) {
  console.log('Payment failed:', invoice.id);
  
  // Send payment failure notification
  // Update subscription status
  // Potentially pause service access
}