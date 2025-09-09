/**
 * Blaze Intelligence - Stripe Payment Processing & Subscription Billing
 * Enterprise-grade revenue management system
 */

class BlazeStripeIntegration {
    constructor(config = {}) {
        this.config = {
            publishableKey: config.publishableKey || process.env.STRIPE_PUBLISHABLE_KEY,
            secretKey: config.secretKey || process.env.STRIPE_SECRET_KEY,
            webhookSecret: config.webhookSecret || process.env.STRIPE_WEBHOOK_SECRET,
            baseUrl: 'https://api.stripe.com/v1',
            ...config
        };
        
        this.pricingPlans = {
            starter: {
                name: 'Blaze Starter',
                price: 4900, // $49/month
                interval: 'month',
                features: [
                    'Up to 5 teams tracked',
                    'Basic analytics dashboard',
                    'Email support',
                    '1GB data storage'
                ]
            },
            professional: {
                name: 'Blaze Professional', 
                price: 19900, // $199/month
                interval: 'month',
                features: [
                    'Up to 25 teams tracked',
                    'Advanced analytics & AI insights',
                    'Priority support',
                    '10GB data storage',
                    'Custom reporting',
                    'API access'
                ]
            },
            enterprise: {
                name: 'Blaze Enterprise',
                price: 99900, // $999/month
                interval: 'month',
                features: [
                    'Unlimited teams',
                    'Full platform access',
                    'Dedicated support manager',
                    'Unlimited data storage',
                    'White-label options',
                    'Custom integrations',
                    'SLA guarantees'
                ]
            },
            custom: {
                name: 'Blaze Custom',
                price: null, // Custom pricing
                interval: 'month',
                features: [
                    'Everything in Enterprise',
                    'Custom development',
                    'On-premise deployment',
                    'Advanced security features',
                    '24/7 phone support'
                ]
            }
        };
        
        this.init();
    }
    
    async init() {
        console.log('💳 Initializing Stripe Payment Processing for Blaze Intelligence');
        await this.setupProducts();
        await this.setupWebhooks();
        console.log('✅ Stripe Integration Ready');
    }
    
    async setupProducts() {
        try {
            for (const [planKey, plan] of Object.entries(this.pricingPlans)) {
                if (plan.price) {
                    await this.createProductAndPrice(planKey, plan);
                }
            }
            console.log('✅ Stripe products and prices configured');
        } catch (error) {
            console.error('❌ Error setting up Stripe products:', error);
        }
    }
    
    async createProductAndPrice(planKey, plan) {
        try {
            // Create product
            const product = await this.makeRequest('POST', '/products', {
                id: `blaze_${planKey}`,
                name: plan.name,
                description: `Blaze Intelligence ${plan.name} - ${plan.features.join(', ')}`,
                metadata: {
                    plan: planKey,
                    features: JSON.stringify(plan.features)
                }
            });
            
            // Create price
            const price = await this.makeRequest('POST', '/prices', {
                product: product.id,
                unit_amount: plan.price,
                currency: 'usd',
                recurring: {
                    interval: plan.interval
                },
                metadata: {
                    plan: planKey
                }
            });
            
            console.log(`✅ Created ${plan.name} product and price`);
            return { product, price };
        } catch (error) {
            console.error(`❌ Error creating ${plan.name}:`, error);
        }
    }
    
    async createCustomer(customerData) {
        const customer = {
            name: customerData.name,
            email: customerData.email,
            phone: customerData.phone,
            metadata: {
                company: customerData.company,
                sport_focus: customerData.sportFocus,
                organization_type: customerData.organizationType,
                source: 'blaze_intelligence_platform',
                created_at: new Date().toISOString()
            }
        };
        
        if (customerData.address) {
            customer.address = customerData.address;
        }
        
        try {
            const response = await this.makeRequest('POST', '/customers', customer);
            console.log('✅ Customer created in Stripe:', response.id);
            return response;
        } catch (error) {
            console.error('❌ Error creating customer:', error);
            throw error;
        }
    }
    
    async createSubscription(customerId, priceId, trialDays = 14) {
        const subscription = {
            customer: customerId,
            items: [{
                price: priceId
            }],
            trial_period_days: trialDays,
            payment_behavior: 'default_incomplete',
            payment_settings: {
                save_default_payment_method: 'on_subscription'
            },
            expand: ['latest_invoice.payment_intent'],
            metadata: {
                source: 'blaze_intelligence_platform',
                created_at: new Date().toISOString()
            }
        };
        
        try {
            const response = await this.makeRequest('POST', '/subscriptions', subscription);
            console.log('✅ Subscription created:', response.id);
            return response;
        } catch (error) {
            console.error('❌ Error creating subscription:', error);
            throw error;
        }
    }
    
    async createCheckoutSession(customerId, priceId, successUrl, cancelUrl) {
        const session = {
            customer: customerId,
            payment_method_types: ['card'],
            line_items: [{
                price: priceId,
                quantity: 1
            }],
            mode: 'subscription',
            success_url: successUrl,
            cancel_url: cancelUrl,
            allow_promotion_codes: true,
            billing_address_collection: 'required',
            subscription_data: {
                trial_period_days: 14,
                metadata: {
                    source: 'blaze_intelligence_platform'
                }
            },
            metadata: {
                customer_id: customerId,
                plan: this.getPlanFromPriceId(priceId)
            }
        };
        
        try {
            const response = await this.makeRequest('POST', '/checkout/sessions', session);
            console.log('✅ Checkout session created:', response.id);
            return response;
        } catch (error) {
            console.error('❌ Error creating checkout session:', error);
            throw error;
        }
    }
    
    async handleWebhook(body, signature) {
        try {
            // In a real implementation, you'd verify the webhook signature here
            const event = JSON.parse(body);
            
            console.log('📨 Received webhook:', event.type);
            
            switch (event.type) {
                case 'customer.subscription.created':
                    await this.handleSubscriptionCreated(event.data.object);
                    break;
                    
                case 'customer.subscription.updated':
                    await this.handleSubscriptionUpdated(event.data.object);
                    break;
                    
                case 'customer.subscription.deleted':
                    await this.handleSubscriptionCanceled(event.data.object);
                    break;
                    
                case 'invoice.payment_succeeded':
                    await this.handlePaymentSucceeded(event.data.object);
                    break;
                    
                case 'invoice.payment_failed':
                    await this.handlePaymentFailed(event.data.object);
                    break;
                    
                case 'checkout.session.completed':
                    await this.handleCheckoutCompleted(event.data.object);
                    break;
                    
                default:
                    console.log(`Unhandled webhook type: ${event.type}`);
            }
            
            return { received: true };
        } catch (error) {
            console.error('❌ Error handling webhook:', error);
            throw error;
        }
    }
    
    async handleSubscriptionCreated(subscription) {
        console.log('🎉 New subscription created:', subscription.id);
        
        // Update customer data
        await this.updateCustomerSubscriptionStatus(subscription.customer, 'active');
        
        // Send welcome email (integrate with your email system)
        await this.sendWelcomeEmail(subscription.customer, subscription);
        
        // Create HubSpot deal update (if HubSpot integration is available)
        if (window.blazeHubSpot) {
            await window.blazeHubSpot.updateDealStage(
                subscription.metadata.deal_id, 
                'closed_won'
            );
        }
    }
    
    async handlePaymentSucceeded(invoice) {
        console.log('💰 Payment succeeded for invoice:', invoice.id);
        
        // Update usage metrics
        await this.updateUsageMetrics(invoice.customer, invoice.amount_paid);
        
        // Send receipt email
        await this.sendReceiptEmail(invoice.customer, invoice);
    }
    
    async handlePaymentFailed(invoice) {
        console.log('⚠️ Payment failed for invoice:', invoice.id);
        
        // Send payment failure notification
        await this.sendPaymentFailureNotification(invoice.customer, invoice);
        
        // Update customer status
        await this.updateCustomerSubscriptionStatus(invoice.customer, 'past_due');
    }
    
    async generateRevenueDashboard() {
        try {
            // Get subscription data
            const subscriptions = await this.makeRequest('GET', '/subscriptions?limit=100');
            
            // Get recent payments
            const payments = await this.makeRequest('GET', '/payment_intents?limit=100');
            
            // Calculate metrics
            const now = new Date();
            const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            
            const dashboard = {
                timestamp: now.toISOString(),
                subscriptions: {
                    total: subscriptions.data.length,
                    active: subscriptions.data.filter(s => s.status === 'active').length,
                    trialing: subscriptions.data.filter(s => s.status === 'trialing').length,
                    canceled: subscriptions.data.filter(s => s.status === 'canceled').length,
                    past_due: subscriptions.data.filter(s => s.status === 'past_due').length
                },
                revenue: {
                    mrr: this.calculateMRR(subscriptions.data),
                    thisMonth: this.calculateMonthlyRevenue(payments.data, thisMonth),
                    lastMonth: this.calculateMonthlyRevenue(payments.data, lastMonth),
                    totalLifetime: payments.data
                        .filter(p => p.status === 'succeeded')
                        .reduce((sum, p) => sum + p.amount, 0) / 100
                },
                plans: this.getSubscriptionsByPlan(subscriptions.data),
                churn: this.calculateChurnRate(subscriptions.data),
                averageRevenuePerUser: this.calculateARPU(subscriptions.data)
            };
            
            dashboard.revenue.growthRate = dashboard.revenue.lastMonth > 0 ? 
                ((dashboard.revenue.thisMonth - dashboard.revenue.lastMonth) / dashboard.revenue.lastMonth) * 100 : 0;
            
            console.log('📊 Revenue dashboard generated:', dashboard);
            return dashboard;
        } catch (error) {
            console.error('❌ Error generating revenue dashboard:', error);
            return null;
        }
    }
    
    calculateMRR(subscriptions) {
        return subscriptions
            .filter(s => s.status === 'active')
            .reduce((sum, s) => {
                const price = s.items.data[0]?.price;
                if (price && price.recurring.interval === 'month') {
                    return sum + (price.unit_amount / 100);
                } else if (price && price.recurring.interval === 'year') {
                    return sum + (price.unit_amount / 100 / 12);
                }
                return sum;
            }, 0);
    }
    
    calculateMonthlyRevenue(payments, month) {
        const monthEnd = new Date(month.getFullYear(), month.getMonth() + 1, 0);
        return payments
            .filter(p => {
                const paymentDate = new Date(p.created * 1000);
                return paymentDate >= month && paymentDate <= monthEnd && p.status === 'succeeded';
            })
            .reduce((sum, p) => sum + p.amount, 0) / 100;
    }
    
    getSubscriptionsByPlan(subscriptions) {
        const planCounts = {};
        subscriptions.forEach(sub => {
            const priceId = sub.items.data[0]?.price?.id;
            const plan = this.getPlanFromPriceId(priceId);
            planCounts[plan] = (planCounts[plan] || 0) + 1;
        });
        return planCounts;
    }
    
    calculateChurnRate(subscriptions) {
        const totalSubs = subscriptions.length;
        const canceledSubs = subscriptions.filter(s => s.status === 'canceled').length;
        return totalSubs > 0 ? (canceledSubs / totalSubs) * 100 : 0;
    }
    
    calculateARPU(subscriptions) {
        const activeSubs = subscriptions.filter(s => s.status === 'active');
        if (activeSubs.length === 0) return 0;
        
        const totalRevenue = activeSubs.reduce((sum, s) => {
            const price = s.items.data[0]?.price;
            return sum + (price ? price.unit_amount / 100 : 0);
        }, 0);
        
        return totalRevenue / activeSubs.length;
    }
    
    getPlanFromPriceId(priceId) {
        // This would map price IDs to plan names
        if (priceId?.includes('starter')) return 'starter';
        if (priceId?.includes('professional')) return 'professional';
        if (priceId?.includes('enterprise')) return 'enterprise';
        return 'unknown';
    }
    
    async makeRequest(method, endpoint, data = null) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Authorization': `Bearer ${this.config.secretKey}`,
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        };
        
        if (data && (method === 'POST' || method === 'PATCH')) {
            options.body = new URLSearchParams(data).toString();
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`Stripe API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    // Helper methods for integrations
    async updateCustomerSubscriptionStatus(customerId, status) {
        // This would update your internal database
        console.log(`📊 Customer ${customerId} subscription status: ${status}`);
    }
    
    async sendWelcomeEmail(customerId, subscription) {
        // This would integrate with your email system
        console.log(`📧 Sending welcome email to customer ${customerId}`);
    }
    
    async sendReceiptEmail(customerId, invoice) {
        console.log(`🧾 Sending receipt email to customer ${customerId} for ${invoice.amount_paid / 100}`);
    }
    
    async sendPaymentFailureNotification(customerId, invoice) {
        console.log(`⚠️ Sending payment failure notification to customer ${customerId}`);
    }
    
    async updateUsageMetrics(customerId, amount) {
        console.log(`📈 Updating usage metrics for customer ${customerId}, amount: ${amount / 100}`);
    }
    
    async setupWebhooks() {
        // Webhook endpoints would be configured in Stripe dashboard
        console.log('🔗 Webhook endpoints should be configured in Stripe dashboard');
        console.log('📍 Webhook URL: https://your-domain.com/api/stripe/webhook');
    }
}

// Auto-initialize for browser
if (typeof window !== 'undefined') {
    window.blazeStripe = new BlazeStripeIntegration();
}

// Export for modules  
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeStripeIntegration;
}