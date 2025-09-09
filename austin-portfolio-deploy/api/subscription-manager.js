/**
 * Blaze Intelligence Subscription Management System
 * Handles recurring billing, upgrades, cancellations, and subscription lifecycle
 */

class BlazeSubscriptionManager {
  constructor(env) {
    this.env = env;
    this.stripe = null;
    
    if (env.STRIPE_SECRET_KEY) {
      this.stripe = require('stripe')(env.STRIPE_SECRET_KEY);
    }
  }

  /**
   * Create subscription with trial period
   */
  async createSubscription(subscriptionData) {
    try {
      const {
        customerEmail,
        priceId,
        trialDays = 14,
        organization,
        tier,
        sport,
        contactPerson,
        phone
      } = subscriptionData;

      // Create or retrieve customer
      let customer = await this.findOrCreateCustomer({
        email: customerEmail,
        name: contactPerson,
        metadata: {
          organization,
          tier,
          sport,
          phone
        }
      });

      // Create subscription with trial
      const subscription = await this.stripe.subscriptions.create({
        customer: customer.id,
        items: [{ price: priceId }],
        trial_period_days: trialDays,
        metadata: {
          organization,
          tier,
          sport,
          contact_person: contactPerson,
          phone,
          created_via: 'blaze_platform'
        },
        payment_behavior: 'default_incomplete',
        payment_settings: {
          save_default_payment_method: 'on_subscription'
        },
        expand: ['latest_invoice.payment_intent']
      });

      // Store subscription in Airtable
      await this.storeSubscriptionRecord({
        subscriptionId: subscription.id,
        customerId: customer.id,
        customerEmail,
        organization,
        tier,
        sport,
        contactPerson,
        phone,
        priceId,
        status: subscription.status,
        trialEnd: subscription.trial_end,
        currentPeriodEnd: subscription.current_period_end,
        amount: subscription.items.data[0].price.unit_amount / 100,
        interval: subscription.items.data[0].price.recurring.interval
      });

      return {
        success: true,
        subscription: subscription,
        customer: customer,
        clientSecret: subscription.latest_invoice.payment_intent?.client_secret
      };
    } catch (error) {
      console.error('Subscription creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Find or create Stripe customer
   */
  async findOrCreateCustomer(customerData) {
    try {
      // First, try to find existing customer by email
      const existingCustomers = await this.stripe.customers.list({
        email: customerData.email,
        limit: 1
      });

      if (existingCustomers.data.length > 0) {
        return existingCustomers.data[0];
      }

      // Create new customer
      const customer = await this.stripe.customers.create({
        email: customerData.email,
        name: customerData.name,
        metadata: customerData.metadata || {},
        preferred_locales: ['en']
      });

      return customer;
    } catch (error) {
      console.error('Customer creation/retrieval failed:', error);
      throw error;
    }
  }

  /**
   * Store subscription record in Airtable
   */
  async storeSubscriptionRecord(subscriptionData) {
    try {
      const airtableUrl = `https://api.airtable.com/v0/${this.env.AIRTABLE_BASE_ID}/Subscriptions`;
      
      const response = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          fields: {
            'Subscription ID': subscriptionData.subscriptionId,
            'Customer ID': subscriptionData.customerId,
            'Organization': subscriptionData.organization,
            'Email': subscriptionData.customerEmail,
            'Contact Person': subscriptionData.contactPerson,
            'Phone': subscriptionData.phone,
            'Tier': subscriptionData.tier,
            'Sport': subscriptionData.sport,
            'Status': subscriptionData.status,
            'Monthly Amount': subscriptionData.amount,
            'Interval': subscriptionData.interval,
            'Trial End': subscriptionData.trialEnd ? new Date(subscriptionData.trialEnd * 1000).toISOString() : null,
            'Current Period End': new Date(subscriptionData.currentPeriodEnd * 1000).toISOString(),
            'Created Date': new Date().toISOString(),
            'MRR': subscriptionData.interval === 'year' ? subscriptionData.amount / 12 : subscriptionData.amount,
            'ARR': subscriptionData.interval === 'year' ? subscriptionData.amount : subscriptionData.amount * 12
          }
        })
      });

      if (!response.ok) {
        throw new Error(`Airtable API error: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to store subscription record:', error);
      throw error;
    }
  }

  /**
   * Handle subscription upgrades/downgrades
   */
  async modifySubscription(subscriptionId, newPriceId, prorationBehavior = 'create_prorations') {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      
      const updatedSubscription = await this.stripe.subscriptions.update(subscriptionId, {
        items: [{
          id: subscription.items.data[0].id,
          price: newPriceId
        }],
        proration_behavior: prorationBehavior,
        metadata: {
          ...subscription.metadata,
          last_modified: new Date().toISOString(),
          modification_type: 'tier_change'
        }
      });

      // Update Airtable record
      await this.updateSubscriptionRecord(subscriptionId, {
        status: updatedSubscription.status,
        amount: updatedSubscription.items.data[0].price.unit_amount / 100,
        interval: updatedSubscription.items.data[0].price.recurring.interval,
        lastModified: new Date().toISOString()
      });

      // Send notification email
      await this.sendSubscriptionChangeNotification(subscription.customer, 'upgrade', {
        oldAmount: subscription.items.data[0].price.unit_amount / 100,
        newAmount: updatedSubscription.items.data[0].price.unit_amount / 100
      });

      return {
        success: true,
        subscription: updatedSubscription
      };
    } catch (error) {
      console.error('Subscription modification failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Cancel subscription
   */
  async cancelSubscription(subscriptionId, immediately = false) {
    try {
      let canceledSubscription;
      
      if (immediately) {
        // Cancel immediately
        canceledSubscription = await this.stripe.subscriptions.cancel(subscriptionId);
      } else {
        // Cancel at period end
        canceledSubscription = await this.stripe.subscriptions.update(subscriptionId, {
          cancel_at_period_end: true,
          metadata: {
            cancellation_requested: new Date().toISOString(),
            cancellation_type: 'at_period_end'
          }
        });
      }

      // Update Airtable record
      await this.updateSubscriptionRecord(subscriptionId, {
        status: canceledSubscription.status,
        cancelAtPeriodEnd: canceledSubscription.cancel_at_period_end,
        canceledAt: canceledSubscription.canceled_at ? new Date(canceledSubscription.canceled_at * 1000).toISOString() : null
      });

      // Send cancellation confirmation
      const customer = await this.stripe.customers.retrieve(canceledSubscription.customer);
      await this.sendCancellationConfirmation(customer, immediately);

      // Trigger retention workflow
      if (!immediately) {
        await this.triggerRetentionWorkflow(canceledSubscription);
      }

      return {
        success: true,
        subscription: canceledSubscription,
        cancellationType: immediately ? 'immediate' : 'at_period_end'
      };
    } catch (error) {
      console.error('Subscription cancellation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Reactivate canceled subscription
   */
  async reactivateSubscription(subscriptionId) {
    try {
      const subscription = await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
        metadata: {
          reactivated: new Date().toISOString(),
          reactivation_source: 'customer_request'
        }
      });

      // Update Airtable record
      await this.updateSubscriptionRecord(subscriptionId, {
        status: subscription.status,
        cancelAtPeriodEnd: false,
        reactivatedAt: new Date().toISOString()
      });

      // Send reactivation confirmation
      const customer = await this.stripe.customers.retrieve(subscription.customer);
      await this.sendReactivationConfirmation(customer);

      return {
        success: true,
        subscription: subscription
      };
    } catch (error) {
      console.error('Subscription reactivation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Handle failed payments
   */
  async handleFailedPayment(subscriptionId, invoiceId) {
    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const invoice = await this.stripe.invoices.retrieve(invoiceId);
      const customer = await this.stripe.customers.retrieve(subscription.customer);

      // Update subscription status in Airtable
      await this.updateSubscriptionRecord(subscriptionId, {
        status: 'past_due',
        paymentFailed: true,
        lastFailedPayment: new Date().toISOString()
      });

      // Send payment failure notification
      await this.sendPaymentFailureNotification(customer, invoice);

      // Trigger dunning process
      await this.triggerDunningProcess(subscription, invoice);

      return {
        success: true,
        action: 'dunning_initiated'
      };
    } catch (error) {
      console.error('Failed payment handling failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Update subscription record in Airtable
   */
  async updateSubscriptionRecord(subscriptionId, updates) {
    try {
      // First, find the record
      const searchUrl = `https://api.airtable.com/v0/${this.env.AIRTABLE_BASE_ID}/Subscriptions?filterByFormula={Subscription ID}="${subscriptionId}"`;
      
      const searchResponse = await fetch(searchUrl, {
        headers: {
          'Authorization': `Bearer ${this.env.AIRTABLE_API_KEY}`
        }
      });

      const searchData = await searchResponse.json();
      
      if (searchData.records.length === 0) {
        throw new Error(`Subscription record not found: ${subscriptionId}`);
      }

      const recordId = searchData.records[0].id;
      
      // Update the record
      const updateUrl = `https://api.airtable.com/v0/${this.env.AIRTABLE_BASE_ID}/Subscriptions/${recordId}`;
      
      const fields = {};
      if (updates.status) fields['Status'] = updates.status;
      if (updates.amount) fields['Monthly Amount'] = updates.amount;
      if (updates.interval) fields['Interval'] = updates.interval;
      if (updates.cancelAtPeriodEnd !== undefined) fields['Cancel at Period End'] = updates.cancelAtPeriodEnd;
      if (updates.canceledAt) fields['Canceled At'] = updates.canceledAt;
      if (updates.reactivatedAt) fields['Reactivated At'] = updates.reactivatedAt;
      if (updates.paymentFailed !== undefined) fields['Payment Failed'] = updates.paymentFailed;
      if (updates.lastFailedPayment) fields['Last Failed Payment'] = updates.lastFailedPayment;
      if (updates.lastModified) fields['Last Modified'] = updates.lastModified;

      const response = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${this.env.AIRTABLE_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fields })
      });

      if (!response.ok) {
        throw new Error(`Airtable update failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Failed to update subscription record:', error);
      throw error;
    }
  }

  /**
   * Get subscription analytics
   */
  async getSubscriptionAnalytics() {
    try {
      // Get Stripe subscription data
      const subscriptions = await this.stripe.subscriptions.list({
        limit: 100,
        status: 'active'
      });

      // Calculate metrics
      const analytics = {
        totalSubscriptions: subscriptions.data.length,
        mrr: 0,
        arr: 0,
        churnRate: 0,
        avgRevenuePerUser: 0,
        tierBreakdown: {
          starter: { count: 0, revenue: 0 },
          professional: { count: 0, revenue: 0 },
          enterprise: { count: 0, revenue: 0 },
          championship: { count: 0, revenue: 0 }
        },
        trialConversionRate: 0,
        customerLifetimeValue: 0
      };

      subscriptions.data.forEach(sub => {
        const amount = sub.items.data[0].price.unit_amount / 100;
        const interval = sub.items.data[0].price.recurring.interval;
        const tier = sub.metadata.tier || 'unknown';
        
        const monthlyAmount = interval === 'year' ? amount / 12 : amount;
        analytics.mrr += monthlyAmount;
        
        if (analytics.tierBreakdown[tier]) {
          analytics.tierBreakdown[tier].count++;
          analytics.tierBreakdown[tier].revenue += monthlyAmount;
        }
      });

      analytics.arr = analytics.mrr * 12;
      analytics.avgRevenuePerUser = analytics.totalSubscriptions > 0 
        ? analytics.mrr / analytics.totalSubscriptions 
        : 0;

      // Store analytics in R2
      await this.env.BLAZE_STORAGE.put(
        `analytics/subscriptions/${new Date().toISOString().split('T')[0]}.json`,
        JSON.stringify(analytics)
      );

      return analytics;
    } catch (error) {
      console.error('Failed to generate subscription analytics:', error);
      throw error;
    }
  }

  /**
   * Send subscription change notification
   */
  async sendSubscriptionChangeNotification(customerId, changeType, details) {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      
      const emailContent = this.generateSubscriptionChangeEmail(changeType, details);
      
      const mailgunUrl = `https://api.mailgun.net/v3/${this.env.MAILGUN_DOMAIN}/messages`;
      
      const response = await fetch(mailgunUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.env.MAILGUN_API_KEY}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          from: 'Austin Humphrey <austin@blaze-intelligence.com>',
          to: customer.email,
          cc: 'ahump20@outlook.com',
          subject: `Blaze Intelligence - Subscription ${changeType.charAt(0).toUpperCase() + changeType.slice(1)} Confirmed`,
          html: emailContent.html,
          text: emailContent.text
        })
      });

      return { success: response.ok };
    } catch (error) {
      console.error('Failed to send subscription change notification:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Generate subscription change email content
   */
  generateSubscriptionChangeEmail(changeType, details) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0a0a0a; padding: 20px; text-align: center;">
          <h1 style="color: #00bcd4; margin: 0;">BLAZE INTELLIGENCE</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Subscription ${changeType.charAt(0).toUpperCase() + changeType.slice(1)} Confirmed</h2>
          
          <p>Your Blaze Intelligence subscription has been successfully ${changeType}d.</p>
          
          ${changeType === 'upgrade' ? `
            <div style="background: #e8f5e8; padding: 20px; border-left: 4px solid #4caf50; margin: 20px 0;">
              <h3 style="margin-top: 0; color: #2e7d32;">Upgrade Details</h3>
              <p><strong>Previous Amount:</strong> $${details.oldAmount}/month</p>
              <p><strong>New Amount:</strong> $${details.newAmount}/month</p>
              <p><strong>Additional Features:</strong> You now have access to enhanced analytics and priority support!</p>
            </div>
          ` : ''}
          
          <p>Your updated subscription will be reflected in your next billing cycle.</p>
          
          <p>If you have any questions, please don't hesitate to reach out:</p>
          
          <p><strong>Direct Contact:</strong><br>
             Austin Humphrey<br>
             📧 ahump20@outlook.com<br>
             📱 (210) 273-5538</p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">© 2025 Blaze Intelligence. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `
Blaze Intelligence - Subscription ${changeType.charAt(0).toUpperCase() + changeType.slice(1)} Confirmed

Your Blaze Intelligence subscription has been successfully ${changeType}d.

${changeType === 'upgrade' ? `
Previous Amount: $${details.oldAmount}/month
New Amount: $${details.newAmount}/month
Additional Features: You now have access to enhanced analytics and priority support!
` : ''}

Your updated subscription will be reflected in your next billing cycle.

If you have any questions, please contact:
Austin Humphrey
ahump20@outlook.com
(210) 273-5538
    `;

    return { html, text };
  }

  /**
   * Trigger retention workflow for canceling customers
   */
  async triggerRetentionWorkflow(subscription) {
    try {
      // Create retention campaign in HubSpot
      const hubspotUrl = 'https://api.hubapi.com/crm/v3/objects/deals';
      
      const dealData = {
        properties: {
          dealname: `Retention - ${subscription.metadata.organization}`,
          dealstage: 'retention_outreach',
          amount: subscription.items.data[0].price.unit_amount / 100,
          hubspot_owner_id: this.env.HUBSPOT_OWNER_ID,
          dealtype: 'retention',
          blaze_subscription_id: subscription.id,
          blaze_cancellation_date: new Date().toISOString()
        }
      };

      const response = await fetch(hubspotUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.env.HUBSPOT_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dealData)
      });

      return { success: response.ok };
    } catch (error) {
      console.error('Failed to trigger retention workflow:', error);
      return { success: false, error: error.message };
    }
  }
}

/**
 * Cloudflare Pages Functions handler for subscription management
 */
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    const subscriptionManager = new BlazeSubscriptionManager(env);

    if (pathname.endsWith('/create-subscription')) {
      return await handleCreateSubscription(request, subscriptionManager);
    } else if (pathname.endsWith('/modify-subscription')) {
      return await handleModifySubscription(request, subscriptionManager);
    } else if (pathname.endsWith('/cancel-subscription')) {
      return await handleCancelSubscription(request, subscriptionManager);
    } else if (pathname.endsWith('/reactivate-subscription')) {
      return await handleReactivateSubscription(request, subscriptionManager);
    } else if (pathname.endsWith('/subscription-analytics')) {
      return await handleSubscriptionAnalytics(request, subscriptionManager);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('Subscription management error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleCreateSubscription(request, manager) {
  try {
    const data = await request.json();
    const result = await manager.createSubscription(data);
    
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

async function handleModifySubscription(request, manager) {
  try {
    const { subscriptionId, newPriceId, prorationBehavior } = await request.json();
    const result = await manager.modifySubscription(subscriptionId, newPriceId, prorationBehavior);
    
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

async function handleCancelSubscription(request, manager) {
  try {
    const { subscriptionId, immediately } = await request.json();
    const result = await manager.cancelSubscription(subscriptionId, immediately);
    
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

async function handleReactivateSubscription(request, manager) {
  try {
    const { subscriptionId } = await request.json();
    const result = await manager.reactivateSubscription(subscriptionId);
    
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

async function handleSubscriptionAnalytics(request, manager) {
  try {
    const analytics = await manager.getSubscriptionAnalytics();
    
    return new Response(JSON.stringify(analytics), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}