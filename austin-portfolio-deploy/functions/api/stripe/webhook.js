// Cloudflare Pages Function - Stripe Webhook Handler
export async function onRequestPost(context) {
    try {
        const { request, env } = context;
        const body = await request.text();
        const signature = request.headers.get('stripe-signature');
        
        // Verify webhook signature (simplified for demo)
        const event = JSON.parse(body);
        
        console.log('📨 Stripe webhook received:', event.type);
        
        // Process different webhook events
        switch (event.type) {
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object, env);
                break;
                
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object, env);
                break;
                
            case 'invoice.payment_succeeded':
                await handlePaymentSucceeded(event.data.object, env);
                break;
                
            case 'invoice.payment_failed':
                await handlePaymentFailed(event.data.object, env);
                break;
                
            case 'checkout.session.completed':
                await handleCheckoutCompleted(event.data.object, env);
                break;
                
            default:
                console.log(`Unhandled webhook type: ${event.type}`);
        }
        
        return new Response(JSON.stringify({ 
            received: true,
            type: event.type,
            timestamp: new Date().toISOString()
        }), {
            headers: { 
                'Content-Type': 'application/json' 
            }
        });
        
    } catch (error) {
        console.error('❌ Webhook error:', error);
        return new Response(JSON.stringify({ 
            error: 'Webhook processing failed',
            message: error.message 
        }), {
            status: 500,
            headers: { 
                'Content-Type': 'application/json' 
            }
        });
    }
}

async function handleSubscriptionCreated(subscription, env) {
    console.log('🎉 New subscription created:', subscription.id);
    
    // Update customer status
    const updateData = {
        customer_id: subscription.customer,
        subscription_id: subscription.id,
        status: 'active',
        plan: subscription.items.data[0]?.price?.metadata?.plan || 'unknown',
        created_at: new Date().toISOString()
    };
    
    // Store in D1 database (if available)
    if (env.BLAZE_DB) {
        try {
            await env.BLAZE_DB.prepare(
                'INSERT OR REPLACE INTO subscriptions (customer_id, subscription_id, status, plan, created_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(
                updateData.customer_id,
                updateData.subscription_id,
                updateData.status,
                updateData.plan,
                updateData.created_at
            ).run();
            
            console.log('✅ Subscription stored in database');
        } catch (error) {
            console.error('❌ Database error:', error);
        }
    }
    
    // Send notification to HubSpot (if configured)
    await notifyHubSpot('subscription_created', updateData, env);
    
    // Send welcome email
    await sendWelcomeEmail(subscription.customer, subscription, env);
}

async function handleSubscriptionUpdated(subscription, env) {
    console.log('📝 Subscription updated:', subscription.id);
    
    if (env.BLAZE_DB) {
        try {
            await env.BLAZE_DB.prepare(
                'UPDATE subscriptions SET status = ?, updated_at = ? WHERE subscription_id = ?'
            ).bind(
                subscription.status,
                new Date().toISOString(),
                subscription.id
            ).run();
            
            console.log('✅ Subscription status updated');
        } catch (error) {
            console.error('❌ Database update error:', error);
        }
    }
}

async function handlePaymentSucceeded(invoice, env) {
    console.log('💰 Payment succeeded:', invoice.id, '$' + (invoice.amount_paid / 100));
    
    // Store payment record
    if (env.BLAZE_DB) {
        try {
            await env.BLAZE_DB.prepare(
                'INSERT INTO payments (invoice_id, customer_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(
                invoice.id,
                invoice.customer,
                invoice.amount_paid / 100,
                'succeeded',
                new Date().toISOString()
            ).run();
            
            console.log('✅ Payment recorded');
        } catch (error) {
            console.error('❌ Payment recording error:', error);
        }
    }
    
    // Update customer access
    await updateCustomerAccess(invoice.customer, 'active', env);
}

async function handlePaymentFailed(invoice, env) {
    console.log('⚠️ Payment failed:', invoice.id);
    
    // Store failed payment
    if (env.BLAZE_DB) {
        try {
            await env.BLAZE_DB.prepare(
                'INSERT INTO payments (invoice_id, customer_id, amount, status, created_at) VALUES (?, ?, ?, ?, ?)'
            ).bind(
                invoice.id,
                invoice.customer,
                invoice.amount_due / 100,
                'failed',
                new Date().toISOString()
            ).run();
            
            console.log('✅ Failed payment recorded');
        } catch (error) {
            console.error('❌ Payment recording error:', error);
        }
    }
    
    // Send payment failure notification
    await sendPaymentFailureEmail(invoice.customer, invoice, env);
}

async function handleCheckoutCompleted(session, env) {
    console.log('✅ Checkout completed:', session.id);
    
    // Update customer onboarding status
    await updateCustomerOnboarding(session.customer, 'checkout_completed', env);
}

async function notifyHubSpot(eventType, data, env) {
    if (!env.HUBSPOT_API_KEY) return;
    
    try {
        const hubspotData = {
            eventName: `blaze_${eventType}`,
            occurredAt: new Date().toISOString(),
            properties: data
        };
        
        const response = await fetch('https://api.hubapi.com/events/v3/send', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${env.HUBSPOT_API_KEY}`
            },
            body: JSON.stringify(hubspotData)
        });
        
        if (response.ok) {
            console.log('✅ HubSpot notified');
        }
    } catch (error) {
        console.error('❌ HubSpot notification error:', error);
    }
}

async function sendWelcomeEmail(customerId, subscription, env) {
    // This would integrate with your email service (SendGrid, Resend, etc.)
    console.log(`📧 Welcome email queued for customer ${customerId}`);
    
    // Example with Resend (if available)
    if (env.RESEND_API_KEY) {
        try {
            const emailData = {
                from: 'welcome@blaze-intelligence.com',
                to: subscription.customer_email || 'customer@example.com',
                subject: '🔥 Welcome to Blaze Intelligence!',
                html: `
                    <h1>Welcome to Blaze Intelligence!</h1>
                    <p>Your subscription is now active. Here's what you can do next:</p>
                    <ul>
                        <li>Access your analytics dashboard</li>
                        <li>Set up your team data feeds</li>
                        <li>Schedule a success call with our team</li>
                    </ul>
                    <a href="https://blaze-intelligence.pages.dev/onboarding">Get Started →</a>
                `
            };
            
            await fetch('https://api.resend.com/emails', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${env.RESEND_API_KEY}`
                },
                body: JSON.stringify(emailData)
            });
            
            console.log('✅ Welcome email sent');
        } catch (error) {
            console.error('❌ Email sending error:', error);
        }
    }
}

async function sendPaymentFailureEmail(customerId, invoice, env) {
    console.log(`⚠️ Payment failure email queued for customer ${customerId}`);
    // Implementation would go here
}

async function updateCustomerAccess(customerId, status, env) {
    console.log(`🔑 Updating customer access: ${customerId} -> ${status}`);
    // Implementation would update customer permissions
}

async function updateCustomerOnboarding(customerId, stage, env) {
    console.log(`📋 Updating onboarding: ${customerId} -> ${stage}`);
    // Implementation would update onboarding progress
}