/**
 * Blaze Intelligence Payment Processing Infrastructure
 * Handles Stripe and Square payment processing with revenue tracking
 */

// Stripe Configuration
const STRIPE_CONFIG = {
  publishableKey: 'STRIPE_PUBLISHABLE_KEY', // Set via environment
  secretKey: 'STRIPE_SECRET_KEY', // Set via environment
  webhookSecret: 'STRIPE_WEBHOOK_SECRET',
  apiVersion: '2023-10-16'
};

// Square Configuration
const SQUARE_CONFIG = {
  applicationId: 'SQUARE_APPLICATION_ID', // Set via environment
  accessToken: 'SQUARE_ACCESS_TOKEN', // Set via environment
  locationId: 'SQUARE_LOCATION_ID',
  environment: 'production' // or 'sandbox'
};

class BlazePaymentProcessor {
  constructor(env) {
    this.env = env;
    this.stripe = null;
    this.square = null;
    
    // Initialize Stripe
    if (env.STRIPE_SECRET_KEY) {
      this.stripe = require('stripe')(env.STRIPE_SECRET_KEY);
    }
    
    // Initialize Square (would need Square SDK)
    if (env.SQUARE_ACCESS_TOKEN) {
      // Square SDK initialization would go here
      this.square = {
        accessToken: env.SQUARE_ACCESS_TOKEN,
        locationId: env.SQUARE_LOCATION_ID
      };
    }
  }

  /**
   * Create Stripe checkout session
   */
  async createStripeCheckout(productConfig) {
    try {
      const session = await this.stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price: productConfig.priceId,
          quantity: 1,
        }],
        mode: productConfig.mode || 'subscription',
        success_url: `${productConfig.baseUrl}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${productConfig.baseUrl}/pricing.html?canceled=true`,
        customer_email: productConfig.customerEmail,
        client_reference_id: productConfig.clientReferenceId,
        metadata: {
          tier: productConfig.tier,
          organization: productConfig.organization,
          sport: productConfig.sport,
          contact_person: productConfig.contactPerson,
          phone: productConfig.phone
        },
        subscription_data: productConfig.mode === 'subscription' ? {
          metadata: {
            tier: productConfig.tier,
            organization: productConfig.organization
          }
        } : undefined,
        allow_promotion_codes: true,
        billing_address_collection: 'required',
        tax_id_collection: {
          enabled: true
        }
      });

      return {
        success: true,
        sessionId: session.id,
        url: session.url
      };
    } catch (error) {
      console.error('Stripe checkout creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create Square payment
   */
  async createSquarePayment(paymentConfig) {
    try {
      // Square Web Payments SDK integration
      const payment = {
        amount: {
          amount: paymentConfig.amount,
          currency: 'USD'
        },
        source_id: paymentConfig.sourceId, // From Square Web Payments SDK
        reference_id: paymentConfig.referenceId,
        note: `Blaze Intelligence - ${paymentConfig.tier} Package`,
        buyer_email_address: paymentConfig.customerEmail
      };

      // This would integrate with Square's API
      return {
        success: true,
        paymentId: 'square_payment_id',
        receipt_url: 'square_receipt_url'
      };
    } catch (error) {
      console.error('Square payment creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(event, signature, webhookSecret) {
    try {
      let stripeEvent;
      
      if (this.stripe) {
        stripeEvent = this.stripe.webhooks.constructEvent(
          event, 
          signature, 
          webhookSecret
        );
      }

      switch (stripeEvent.type) {
        case 'checkout.session.completed':
          await this.handleCheckoutCompleted(stripeEvent.data.object);
          break;
        
        case 'customer.subscription.created':
          await this.handleSubscriptionCreated(stripeEvent.data.object);
          break;
        
        case 'customer.subscription.updated':
          await this.handleSubscriptionUpdated(stripeEvent.data.object);
          break;
        
        case 'customer.subscription.deleted':
          await this.handleSubscriptionCancelled(stripeEvent.data.object);
          break;
        
        case 'invoice.payment_succeeded':
          await this.handlePaymentSucceeded(stripeEvent.data.object);
          break;
        
        case 'invoice.payment_failed':
          await this.handlePaymentFailed(stripeEvent.data.object);
          break;
        
        default:
          console.log(`Unhandled event type: ${stripeEvent.type}`);
      }

      return { success: true };
    } catch (error) {
      console.error('Webhook processing failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Process successful checkout
   */
  async handleCheckoutCompleted(session) {
    try {
      // Extract customer and subscription details
      const customerData = {
        stripeCustomerId: session.customer,
        email: session.customer_details?.email,
        organization: session.metadata?.organization,
        tier: session.metadata?.tier,
        sport: session.metadata?.sport,
        contactPerson: session.metadata?.contact_person,
        phone: session.metadata?.phone,
        subscriptionId: session.subscription,
        amount: session.amount_total,
        currency: session.currency,
        paymentStatus: session.payment_status,
        created: new Date().toISOString()
      };

      // Store in Airtable CRM
      await this.storeCustomerData(customerData);
      
      // Trigger onboarding automation
      await this.triggerOnboarding(customerData);
      
      // Update revenue tracking
      await this.updateRevenue(customerData);
      
      // Send welcome email
      await this.sendWelcomeEmail(customerData);

      return { success: true };
    } catch (error) {
      console.error('Checkout completion handling failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Store customer data in Airtable CRM
   */
  async storeCustomerData(customerData) {
    try {
      const airtableUrl = `https://api.airtable.com/v0/${this.env.AIRTABLE_BASE_ID}/Customers`;
      
      const response = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            'Organization': customerData.organization,
            'Email': customerData.email,
            'Contact Person': customerData.contactPerson,
            'Phone': customerData.phone,
            'Tier': customerData.tier,
            'Sport': customerData.sport,
            'Stripe Customer ID': customerData.stripeCustomerId,
            'Subscription ID': customerData.subscriptionId,
            'Monthly Value': customerData.amount / 100, // Convert from cents
            'Status': 'Active',
            'Created Date': customerData.created
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to store customer data:', error);
      throw error;
    }
  }

  /**
   * Trigger automated onboarding sequence
   */
  async triggerOnboarding(customerData) {
    try {
      // Create HubSpot contact
      const hubspotUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
      
      const hubspotResponse = await fetch(hubspotUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          properties: {
            email: customerData.email,
            firstname: customerData.contactPerson?.split(' ')[0],
            lastname: customerData.contactPerson?.split(' ').slice(1).join(' '),
            company: customerData.organization,
            phone: customerData.phone,
            hs_lead_status: 'CUSTOMER',
            blaze_tier: customerData.tier,
            blaze_sport: customerData.sport
          }
        })
      });

      // Schedule onboarding call
      await this.scheduleOnboardingCall(customerData);
      
      // Provision platform access
      await this.provisionAccess(customerData);

      return { success: true };
    } catch (error) {
      console.error('Onboarding trigger failed:', error);
      throw error;
    }
  }

  /**
   * Update revenue tracking
   */
  async updateRevenue(customerData) {
    try {
      const revenueData = {
        date: new Date().toISOString().split('T')[0],
        amount: customerData.amount / 100, // Convert from cents
        tier: customerData.tier,
        organization: customerData.organization,
        sport: customerData.sport,
        type: 'subscription_start',
        mrr: this.calculateMRR(customerData),
        arr: this.calculateARR(customerData)
      };

      // Store in R2 for analytics
      await this.env.BLAZE_STORAGE.put(
        `revenue/${revenueData.date}/${customerData.stripeCustomerId}.json`,
        JSON.stringify(revenueData)
      );

      // Update real-time dashboard
      await this.updateRevenueDashboard(revenueData);

      return { success: true };
    } catch (error) {
      console.error('Revenue tracking update failed:', error);
      throw error;
    }
  }

  /**
   * Calculate Monthly Recurring Revenue
   */
  calculateMRR(customerData) {
    const amount = customerData.amount / 100;
    
    // Determine billing frequency from metadata or subscription
    const isAnnual = customerData.tier?.includes('annual') || amount > 1000;
    
    return isAnnual ? amount / 12 : amount;
  }

  /**
   * Calculate Annual Recurring Revenue
   */
  calculateARR(customerData) {
    const mrr = this.calculateMRR(customerData);
    return mrr * 12;
  }

  /**
   * Send welcome email via Mailgun
   */
  async sendWelcomeEmail(customerData) {
    try {
      const emailContent = this.generateWelcomeEmail(customerData);
      
      const mailgunUrl = `https://api.mailgun.net/v3/${this.env.MAILGUN_DOMAIN}/messages`;
      
      const response = await fetch(mailgunUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.env.MAILGUN_API_KEY}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          from: 'Austin Humphrey <austin@blaze-intelligence.com>',
          to: customerData.email,
          cc: 'ahump20@outlook.com',
          subject: `Welcome to Blaze Intelligence - ${customerData.tier} Package Activated`,
          html: emailContent.html,
          text: emailContent.text
        })
      });

      return { success: response.ok };
    } catch (error) {
      console.error('Welcome email sending failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate welcome email content
   */
  generateWelcomeEmail(customerData) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0a0a0a; padding: 20px; text-align: center;">
          <h1 style="color: #00bcd4; margin: 0;">BLAZE INTELLIGENCE</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Welcome to the Championship Level, ${customerData.contactPerson}!</h2>
          
          <p>Congratulations on joining Blaze Intelligence with our <strong>${customerData.tier}</strong> package. Your organization, <strong>${customerData.organization}</strong>, now has access to championship-level sports analytics.</p>
          
          <div style="background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1976d2;">What's Next?</h3>
            <ul>
              <li>Your account is being provisioned (24-48 hours)</li>
              <li>You'll receive login credentials via email</li>
              <li>Our team will contact you to schedule onboarding</li>
              <li>Access to platform documentation and training materials</li>
            </ul>
          </div>
          
          <p><strong>Direct Contact:</strong></p>
          <p>Austin Humphrey<br>
             Founder & CEO<br>
             📧 ahump20@outlook.com<br>
             📱 (210) 273-5538</p>
          
          <p>Welcome to the future of sports intelligence!</p>
          
          <p>Best regards,<br>
             The Blaze Intelligence Team</p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">© 2025 Blaze Intelligence. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `
Welcome to Blaze Intelligence!

Hi ${customerData.contactPerson},

Congratulations on joining Blaze Intelligence with our ${customerData.tier} package. Your organization, ${customerData.organization}, now has access to championship-level sports analytics.

What's Next:
- Your account is being provisioned (24-48 hours)
- You'll receive login credentials via email
- Our team will contact you to schedule onboarding
- Access to platform documentation and training materials

Direct Contact:
Austin Humphrey
Founder & CEO
ahump20@outlook.com
(210) 273-5538

Welcome to the future of sports intelligence!

Best regards,
The Blaze Intelligence Team
    `;

    return { html, text };
  }
}

/**
 * Cloudflare Pages Functions handler
 */
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    const processor = new BlazePaymentProcessor(env);

    // Route based on endpoint
    if (pathname.endsWith('/create-checkout')) {
      return await handleCreateCheckout(request, processor);
    } else if (pathname.endsWith('/webhook')) {
      return await handleWebhook(request, processor);
    } else if (pathname.endsWith('/square-payment')) {
      return await handleSquarePayment(request, processor);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('Payment processing error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleCreateCheckout(request, processor) {
  try {
    const data = await request.json();
    
    const productConfig = {
      priceId: data.priceId,
      mode: data.mode || 'subscription',
      baseUrl: new URL(request.url).origin,
      customerEmail: data.customerEmail,
      clientReferenceId: data.clientReferenceId,
      tier: data.tier,
      organization: data.organization,
      sport: data.sport,
      contactPerson: data.contactPerson,
      phone: data.phone
    };

    const result = await processor.createStripeCheckout(productConfig);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleWebhook(request, processor) {
  try {
    const body = await request.text();
    const signature = request.headers.get('stripe-signature');
    
    const result = await processor.handleWebhook(body, signature, processor.env.STRIPE_WEBHOOK_SECRET);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleSquarePayment(request, processor) {
  try {
    const data = await request.json();
    
    const result = await processor.createSquarePayment(data);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}