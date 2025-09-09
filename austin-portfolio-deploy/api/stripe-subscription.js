/**
 * Blaze Intelligence Stripe Subscription API
 * Complete subscription lifecycle management
 * 
 * Endpoints:
 * POST /create-checkout-session - Create Stripe checkout
 * POST /create-portal-session - Customer portal
 * POST /webhook - Stripe webhook handler
 * GET /plans - Get available subscription plans
 * GET /subscription - Get user's subscription status
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        const path = url.pathname;
        
        // CORS headers
        const corsHeaders = {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, Stripe-Signature',
        };

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: corsHeaders });
        }

        try {
            let response;
            
            switch (path) {
                case '/create-checkout-session':
                    response = await createCheckoutSession(request, env);
                    break;
                case '/create-portal-session':
                    response = await createPortalSession(request, env);
                    break;
                case '/webhook':
                    response = await handleWebhook(request, env);
                    break;
                case '/plans':
                    response = await getPlans(request, env);
                    break;
                case '/subscription':
                    response = await getSubscription(request, env);
                    break;
                default:
                    response = new Response('Not found', { status: 404 });
            }
            
            // Add CORS headers to response
            Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
            });
            
            return response;
            
        } catch (error) {
            console.error('Stripe API error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: 'Internal server error'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }
};

/**
 * Create Stripe checkout session
 */
async function createCheckoutSession(request, env) {
    const data = await request.json();
    
    // Authenticate user
    const user = await authenticateRequest(request, env);
    if (!user) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    // Validate plan
    const plan = await getPlanById(env, data.planId);
    if (!plan) {
        return jsonResponse({ success: false, error: 'Invalid plan' }, 400);
    }
    
    // Get or create Stripe customer
    let customerId = await getStripeCustomerId(env, user.id);
    if (!customerId) {
        customerId = await createStripeCustomer(env, user);
    }
    
    // Determine pricing
    const isYearly = data.billing === 'yearly';
    const priceId = isYearly ? plan.stripe_price_id_yearly : plan.stripe_price_id_monthly;
    
    if (!priceId) {
        return jsonResponse({ success: false, error: 'Pricing not available for this plan' }, 400);
    }
    
    // Create checkout session
    const session = await createStripeCheckoutSession(env, {
        customer: customerId,
        priceId: priceId,
        planId: plan.id,
        userId: user.id,
        successUrl: data.successUrl || 'https://blaze-intelligence.pages.dev/success',
        cancelUrl: data.cancelUrl || 'https://blaze-intelligence.pages.dev/pricing'
    });
    
    return jsonResponse({
        success: true,
        checkoutUrl: session.url,
        sessionId: session.id
    });
}

/**
 * Create customer portal session
 */
async function createPortalSession(request, env) {
    const user = await authenticateRequest(request, env);
    if (!user) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const customerId = await getStripeCustomerId(env, user.id);
    if (!customerId) {
        return jsonResponse({ success: false, error: 'No subscription found' }, 400);
    }
    
    const session = await createStripePortalSession(env, customerId);
    
    return jsonResponse({
        success: true,
        portalUrl: session.url
    });
}

/**
 * Handle Stripe webhooks
 */
async function handleWebhook(request, env) {
    const signature = request.headers.get('stripe-signature');
    const body = await request.text();
    
    // Verify webhook signature
    const event = await verifyStripeWebhook(env, body, signature);
    if (!event) {
        return new Response('Webhook signature verification failed', { status: 400 });
    }
    
    // Handle different event types
    switch (event.type) {
        case 'checkout.session.completed':
            await handleCheckoutCompleted(env, event.data.object);
            break;
        case 'invoice.payment_succeeded':
            await handlePaymentSucceeded(env, event.data.object);
            break;
        case 'invoice.payment_failed':
            await handlePaymentFailed(env, event.data.object);
            break;
        case 'customer.subscription.updated':
            await handleSubscriptionUpdated(env, event.data.object);
            break;
        case 'customer.subscription.deleted':
            await handleSubscriptionCanceled(env, event.data.object);
            break;
        default:
            console.log(`Unhandled event type: ${event.type}`);
    }
    
    return new Response('Webhook received', { status: 200 });
}

/**
 * Get available plans
 */
async function getPlans(request, env) {
    const plans = await getAllPlans(env);
    return jsonResponse({
        success: true,
        plans: plans
    });
}

/**
 * Get user's subscription
 */
async function getSubscription(request, env) {
    const user = await authenticateRequest(request, env);
    if (!user) {
        return jsonResponse({ success: false, error: 'Unauthorized' }, 401);
    }
    
    const subscription = await getUserSubscription(env, user.id);
    
    return jsonResponse({
        success: true,
        subscription: subscription
    });
}

/**
 * Stripe API functions
 */
async function createStripeCheckoutSession(env, params) {
    const response = await fetch('https://api.stripe.com/v1/checkout/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'customer': params.customer,
            'success_url': params.successUrl,
            'cancel_url': params.cancelUrl,
            'payment_method_types[0]': 'card',
            'mode': 'subscription',
            'line_items[0][price]': params.priceId,
            'line_items[0][quantity]': '1',
            'metadata[plan_id]': params.planId,
            'metadata[user_id]': params.userId,
            'subscription_data[trial_period_days]': '14'
        })
    });
    
    return await response.json();
}

async function createStripeCustomer(env, user) {
    const response = await fetch('https://api.stripe.com/v1/customers', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'email': user.email,
            'name': user.name,
            'metadata[user_id]': user.id
        })
    });
    
    const customer = await response.json();
    
    // Store customer ID
    await storeStripeCustomerId(env, user.id, customer.id);
    
    return customer.id;
}

async function createStripePortalSession(env, customerId) {
    const response = await fetch('https://api.stripe.com/v1/billing_portal/sessions', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.STRIPE_SECRET_KEY}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            'customer': customerId,
            'return_url': 'https://blaze-intelligence.pages.dev/dashboard'
        })
    });
    
    return await response.json();
}

/**
 * Database functions
 */
async function getPlanById(env, planId) {
    const query = `SELECT * FROM subscription_plans WHERE id = ? AND active = 1`;
    return await env.BLAZE_DB.prepare(query).bind(planId).first();
}

async function getAllPlans(env) {
    const query = `SELECT * FROM subscription_plans WHERE active = 1 ORDER BY price_monthly ASC`;
    const result = await env.BLAZE_DB.prepare(query).all();
    return result.results.map(plan => ({
        ...plan,
        features: JSON.parse(plan.features || '[]')
    }));
}

async function getStripeCustomerId(env, userId) {
    const query = `SELECT stripe_customer_id FROM user_subscriptions WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`;
    const result = await env.BLAZE_DB.prepare(query).bind(userId).first();
    return result ? result.stripe_customer_id : null;
}

async function storeStripeCustomerId(env, userId, customerId) {
    // This will be updated when subscription is created
    // For now, just store it in KV as a fallback
    await env.BLAZE_KV.put(`stripe_customer:${userId}`, customerId);
}

async function getUserSubscription(env, userId) {
    const query = `
        SELECT us.*, sp.name as plan_name, sp.features, sp.api_calls_limit, sp.teams_limit
        FROM user_subscriptions us
        JOIN subscription_plans sp ON us.plan_id = sp.id
        WHERE us.user_id = ? AND us.status IN ('active', 'trialing')
        ORDER BY us.created_at DESC LIMIT 1
    `;
    
    const result = await env.BLAZE_DB.prepare(query).bind(userId).first();
    if (result) {
        result.features = JSON.parse(result.features || '[]');
    }
    return result;
}

/**
 * Webhook handlers
 */
async function handleCheckoutCompleted(env, session) {
    const userId = session.metadata.user_id;
    const planId = session.metadata.plan_id;
    const customerId = session.customer;
    const subscriptionId = session.subscription;
    
    // Create subscription record
    const subscriptionRecord = {
        id: crypto.randomUUID(),
        user_id: userId,
        plan_id: planId,
        stripe_subscription_id: subscriptionId,
        stripe_customer_id: customerId,
        status: 'trialing'
    };
    
    const query = `
        INSERT INTO user_subscriptions (
            id, user_id, plan_id, stripe_subscription_id, stripe_customer_id, status
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await env.BLAZE_DB.prepare(query).bind(
        subscriptionRecord.id,
        subscriptionRecord.user_id,
        subscriptionRecord.plan_id,
        subscriptionRecord.stripe_subscription_id,
        subscriptionRecord.stripe_customer_id,
        subscriptionRecord.status
    ).run();
    
    // Update user's subscription tier
    await updateUserSubscriptionTier(env, userId, planId);
}

async function handlePaymentSucceeded(env, invoice) {
    const customerId = invoice.customer;
    const subscriptionId = invoice.subscription;
    
    // Update subscription status to active
    const query = `UPDATE user_subscriptions SET status = 'active' WHERE stripe_subscription_id = ?`;
    await env.BLAZE_DB.prepare(query).bind(subscriptionId).run();
}

async function handlePaymentFailed(env, invoice) {
    const subscriptionId = invoice.subscription;
    
    // Mark subscription as past_due
    const query = `UPDATE user_subscriptions SET status = 'past_due' WHERE stripe_subscription_id = ?`;
    await env.BLAZE_DB.prepare(query).bind(subscriptionId).run();
}

async function handleSubscriptionUpdated(env, subscription) {
    // Update subscription details
    const query = `
        UPDATE user_subscriptions SET 
            status = ?, 
            current_period_start = ?, 
            current_period_end = ?
        WHERE stripe_subscription_id = ?
    `;
    
    await env.BLAZE_DB.prepare(query).bind(
        subscription.status,
        new Date(subscription.current_period_start * 1000).toISOString(),
        new Date(subscription.current_period_end * 1000).toISOString(),
        subscription.id
    ).run();
}

async function handleSubscriptionCanceled(env, subscription) {
    const query = `UPDATE user_subscriptions SET status = 'canceled' WHERE stripe_subscription_id = ?`;
    await env.BLAZE_DB.prepare(query).bind(subscription.id).run();
    
    // Revert user to free tier
    const userQuery = `UPDATE users SET subscription_tier = 'free' WHERE id IN (
        SELECT user_id FROM user_subscriptions WHERE stripe_subscription_id = ?
    )`;
    await env.BLAZE_DB.prepare(userQuery).bind(subscription.id).run();
}

async function updateUserSubscriptionTier(env, userId, planId) {
    const query = `UPDATE users SET subscription_tier = ? WHERE id = ?`;
    await env.BLAZE_DB.prepare(query).bind(planId, userId).run();
}

/**
 * Utility functions
 */
async function authenticateRequest(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.substring(7);
    
    try {
        // This would verify the JWT token and get user
        // For now, returning a mock user
        const payload = await verifyJWT(env, token);
        const user = await getUserById(env, payload.userId);
        return user;
    } catch (error) {
        return null;
    }
}

async function verifyStripeWebhook(env, body, signature) {
    // Verify webhook signature using Stripe's algorithm
    // This is a simplified version - in production, use proper signature verification
    return JSON.parse(body);
}

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Additional utility functions would be imported from auth.js
async function verifyJWT(env, token) {
    // JWT verification logic (shared with auth.js)
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid token format');
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const expectedSignature = await signHMAC(env, `${encodedHeader}.${encodedPayload}`);
    if (signature !== expectedSignature) {
        throw new Error('Invalid token signature');
    }
    
    const payload = JSON.parse(atob(encodedPayload));
    if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
    }
    
    return payload;
}

async function signHMAC(env, data) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(env.JWT_SECRET);
    const messageData = encoder.encode(data);
    
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
}

async function getUserById(env, id) {
    const query = `SELECT * FROM users WHERE id = ?`;
    return await env.BLAZE_DB.prepare(query).bind(id).first();
}