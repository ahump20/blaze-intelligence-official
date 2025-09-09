import express from 'express';
import Stripe from 'stripe';
import { body, validationResult } from 'express-validator';
import pool from '../db.js';
import { authenticateToken } from '../auth/authMiddleware.js';

const router = express.Router();

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
}) : null;

// Pricing configuration
const PRICING = {
  free: {
    id: 'free',
    name: 'Free',
    price: 0,
    interval: null,
    features: [
      '3 team analytics per month',
      'Basic dashboard access',
      'Community support'
    ]
  },
  pro: {
    id: process.env.STRIPE_PRO_PRICE_ID || 'price_pro_monthly',
    name: 'Pro',
    price: 99,
    interval: 'month',
    features: [
      'Unlimited team analytics',
      'Advanced player metrics',
      'Digital Combine™ access',
      'NIL Valuation Engine™',
      'Priority support',
      'API access (1000 calls/month)'
    ]
  },
  enterprise: {
    id: process.env.STRIPE_ENTERPRISE_PRICE_ID || 'price_enterprise_monthly',
    name: 'Enterprise',
    price: 299,
    interval: 'month',
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated account manager',
      'White-label options',
      'Unlimited API access',
      'SLA guarantee'
    ]
  }
};

// Get pricing information
router.get('/prices', (req, res) => {
  res.json({
    plans: PRICING,
    currency: 'usd'
  });
});

// Create or update customer
async function createOrUpdateCustomer(user) {
  if (!stripe) {
    throw new Error('Stripe not configured');
  }

  try {
    // Check if customer exists
    const result = await pool.query(
      'SELECT stripe_customer_id FROM subscriptions WHERE user_id = $1',
      [user.id]
    );

    let customerId = result.rows[0]?.stripe_customer_id;

    if (!customerId) {
      // Create new Stripe customer
      const customer = await stripe.customers.create({
        email: user.email,
        name: user.full_name,
        metadata: {
          userId: user.id
        }
      });

      customerId = customer.id;

      // Update database
      await pool.query(
        'UPDATE subscriptions SET stripe_customer_id = $1 WHERE user_id = $2',
        [customerId, user.id]
      );
    }

    return customerId;
  } catch (error) {
    console.error('Error creating/updating customer:', error);
    throw error;
  }
}

// Create checkout session
router.post('/create-checkout-session',
  authenticateToken,
  [
    body('priceId').notEmpty(),
    body('successUrl').optional().isURL(),
    body('cancelUrl').optional().isURL()
  ],
  async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: 'Payment processing not configured' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { priceId, successUrl, cancelUrl } = req.body;
      
      // Get or create Stripe customer
      const customerId = await createOrUpdateCustomer(req.user);

      // Create checkout session
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{
          price: priceId,
          quantity: 1
        }],
        mode: 'subscription',
        success_url: successUrl || `${process.env.APP_URL || 'http://localhost:5000'}/subscription-success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${process.env.APP_URL || 'http://localhost:5000'}/pricing`,
        metadata: {
          userId: req.user.id
        },
        subscription_data: {
          trial_period_days: 14,
          metadata: {
            userId: req.user.id
          }
        }
      });

      res.json({
        sessionId: session.id,
        url: session.url
      });

    } catch (error) {
      console.error('Checkout session error:', error);
      res.status(500).json({ error: 'Failed to create checkout session' });
    }
  }
);

// Create subscription (for direct API usage)
router.post('/create-subscription',
  authenticateToken,
  [
    body('priceId').notEmpty(),
    body('paymentMethodId').notEmpty()
  ],
  async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: 'Payment processing not configured' });
      }

      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { priceId, paymentMethodId } = req.body;
      
      // Get or create Stripe customer
      const customerId = await createOrUpdateCustomer(req.user);

      // Attach payment method to customer
      await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      // Set as default payment method
      await stripe.customers.update(customerId, {
        invoice_settings: {
          default_payment_method: paymentMethodId
        }
      });

      // Create subscription
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        expand: ['latest_invoice.payment_intent'],
        trial_period_days: 14,
        metadata: {
          userId: req.user.id
        }
      });

      // Update database
      const planType = subscription.items.data[0].price.id === PRICING.pro.id ? 'pro' : 'enterprise';
      
      await pool.query(
        `UPDATE subscriptions 
         SET stripe_subscription_id = $1, 
             plan_type = $2, 
             status = $3,
             trial_ends_at = $4,
             current_period_start = $5,
             current_period_end = $6
         WHERE user_id = $7`,
        [
          subscription.id,
          planType,
          subscription.status,
          new Date(subscription.trial_end * 1000),
          new Date(subscription.current_period_start * 1000),
          new Date(subscription.current_period_end * 1000),
          req.user.id
        ]
      );

      res.json({
        subscriptionId: subscription.id,
        status: subscription.status,
        clientSecret: subscription.latest_invoice.payment_intent.client_secret
      });

    } catch (error) {
      console.error('Subscription creation error:', error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  }
);

// Cancel subscription
router.post('/cancel-subscription',
  authenticateToken,
  async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: 'Payment processing not configured' });
      }

      // Get subscription ID from database
      const result = await pool.query(
        'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1',
        [req.user.id]
      );

      if (!result.rows[0]?.stripe_subscription_id) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      const subscriptionId = result.rows[0].stripe_subscription_id;

      // Cancel at period end
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true
      });

      // Update database
      await pool.query(
        'UPDATE subscriptions SET cancel_at_period_end = true WHERE user_id = $1',
        [req.user.id]
      );

      res.json({
        message: 'Subscription will be cancelled at the end of the billing period',
        cancelAt: new Date(subscription.cancel_at * 1000)
      });

    } catch (error) {
      console.error('Subscription cancellation error:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  }
);

// Resume subscription (undo cancellation)
router.post('/resume-subscription',
  authenticateToken,
  async (req, res) => {
    try {
      if (!stripe) {
        return res.status(500).json({ error: 'Payment processing not configured' });
      }

      // Get subscription ID from database
      const result = await pool.query(
        'SELECT stripe_subscription_id FROM subscriptions WHERE user_id = $1',
        [req.user.id]
      );

      if (!result.rows[0]?.stripe_subscription_id) {
        return res.status(404).json({ error: 'No subscription found' });
      }

      const subscriptionId = result.rows[0].stripe_subscription_id;

      // Resume subscription
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false
      });

      // Update database
      await pool.query(
        'UPDATE subscriptions SET cancel_at_period_end = false WHERE user_id = $1',
        [req.user.id]
      );

      res.json({
        message: 'Subscription resumed successfully',
        status: subscription.status
      });

    } catch (error) {
      console.error('Subscription resume error:', error);
      res.status(500).json({ error: 'Failed to resume subscription' });
    }
  }
);

// Get subscription status
router.get('/subscription-status',
  authenticateToken,
  async (req, res) => {
    try {
      const result = await pool.query(
        `SELECT * FROM subscriptions WHERE user_id = $1`,
        [req.user.id]
      );

      if (result.rows.length === 0) {
        return res.json({
          hasSubscription: false,
          plan: 'free',
          features: PRICING.free.features
        });
      }

      const subscription = result.rows[0];
      const plan = PRICING[subscription.plan_type] || PRICING.free;

      res.json({
        hasSubscription: true,
        plan: subscription.plan_type,
        status: subscription.status,
        features: plan.features,
        trialEndsAt: subscription.trial_ends_at,
        currentPeriodEnd: subscription.current_period_end,
        cancelAtPeriodEnd: subscription.cancel_at_period_end
      });

    } catch (error) {
      console.error('Get subscription status error:', error);
      res.status(500).json({ error: 'Failed to get subscription status' });
    }
  }
);

// Stripe webhook handler
router.post('/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    if (!stripe) {
      return res.status(500).json({ error: 'Payment processing not configured' });
    }

    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('Stripe webhook secret not configured');
      return res.status(500).json({ error: 'Webhook not configured' });
    }

    let event;

    try {
      event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    try {
      switch (event.type) {
        case 'checkout.session.completed': {
          const session = event.data.object;
          const userId = session.metadata.userId;
          
          if (userId && session.subscription) {
            // Get subscription details
            const subscription = await stripe.subscriptions.retrieve(session.subscription);
            const planType = subscription.items.data[0].price.id === PRICING.pro.id ? 'pro' : 'enterprise';
            
            // Update database
            await pool.query(
              `UPDATE subscriptions 
               SET stripe_subscription_id = $1, 
                   plan_type = $2, 
                   status = $3,
                   trial_ends_at = $4,
                   current_period_start = $5,
                   current_period_end = $6
               WHERE user_id = $7`,
              [
                subscription.id,
                planType,
                subscription.status,
                subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
                new Date(subscription.current_period_start * 1000),
                new Date(subscription.current_period_end * 1000),
                userId
              ]
            );
          }
          break;
        }

        case 'customer.subscription.updated':
        case 'customer.subscription.deleted': {
          const subscription = event.data.object;
          const customerId = subscription.customer;
          
          // Get user ID from customer
          const customerResult = await pool.query(
            'SELECT user_id FROM subscriptions WHERE stripe_customer_id = $1',
            [customerId]
          );
          
          if (customerResult.rows.length > 0) {
            const userId = customerResult.rows[0].user_id;
            const status = event.type === 'customer.subscription.deleted' ? 'cancelled' : subscription.status;
            const planType = subscription.items.data[0].price.id === PRICING.pro.id ? 'pro' : 
                           subscription.items.data[0].price.id === PRICING.enterprise.id ? 'enterprise' : 'free';
            
            await pool.query(
              `UPDATE subscriptions 
               SET status = $1,
                   plan_type = $2,
                   current_period_end = $3,
                   cancel_at_period_end = $4
               WHERE user_id = $5`,
              [
                status,
                planType,
                new Date(subscription.current_period_end * 1000),
                subscription.cancel_at_period_end,
                userId
              ]
            );
          }
          break;
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object;
          console.log('Payment succeeded for invoice:', invoice.id);
          break;
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object;
          console.error('Payment failed for invoice:', invoice.id);
          
          // You might want to send an email to the customer here
          break;
        }

        default:
          console.log(`Unhandled event type ${event.type}`);
      }

      res.json({ received: true });
    } catch (error) {
      console.error('Webhook processing error:', error);
      res.status(500).json({ error: 'Webhook processing failed' });
    }
  }
);

export default router;