/**
 * Blaze Intelligence Payment Processing System
 * Comprehensive payment handling with Stripe integration
 */

class BlazePaymentProcessor {
    constructor() {
        this.config = {
            stripe: {
                publishableKey: this.getPublishableKey(),
                apiVersion: '2023-10-16',
                locale: 'en-US'
            },
            products: {
                starter: {
                    name: 'Starter',
                    price: 99,
                    interval: 'month',
                    trialDays: 14,
                    features: [
                        '1 Team',
                        'Real-time scores',
                        'Basic analytics',
                        'Email support',
                        '10GB storage'
                    ],
                    stripeProductId: null,
                    stripePriceId: null
                },
                professional: {
                    name: 'Professional',
                    price: 499,
                    interval: 'month',
                    trialDays: 14,
                    features: [
                        '5 Teams',
                        'Advanced analytics',
                        'API access',
                        'Priority support',
                        '100GB storage',
                        'Custom reports',
                        'Video analysis'
                    ],
                    stripeProductId: null,
                    stripePriceId: null
                },
                enterprise: {
                    name: 'Enterprise',
                    price: 1499,
                    interval: 'month',
                    trialDays: 30,
                    features: [
                        'Unlimited teams',
                        'White labeling',
                        'Dedicated support',
                        'Custom integrations',
                        'Unlimited storage',
                        'SLA guarantee',
                        'Training included'
                    ],
                    stripeProductId: null,
                    stripePriceId: null
                }
            },
            webhooks: {
                signingSecret: null,
                handlers: new Map()
            },
            analytics: {
                trackingEnabled: true,
                events: []
            }
        };

        this.stripe = null;
        this.elements = null;
        this.currentSession = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        
        this.init();
    }

    /**
     * Initialize Stripe and payment system
     */
    async init() {
        try {
            // Load Stripe.js
            if (typeof Stripe === 'undefined') {
                await this.loadStripeJS();
            }

            // Initialize Stripe
            if (this.config.stripe.publishableKey) {
                this.stripe = Stripe(this.config.stripe.publishableKey, {
                    apiVersion: this.config.stripe.apiVersion,
                    locale: this.config.stripe.locale
                });
                console.log('✅ Stripe initialized successfully');
            } else {
                console.warn('⚠️ Stripe publishable key not configured');
            }

            // Set up webhook handlers
            this.setupWebhookHandlers();

            // Load saved payment methods
            await this.loadSavedPaymentMethods();

            // Initialize analytics
            this.initAnalytics();

        } catch (error) {
            console.error('❌ Payment processor initialization failed:', error);
            this.handleInitError(error);
        }
    }

    /**
     * Load Stripe.js dynamically
     */
    loadStripeJS() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://js.stripe.com/v3/';
            script.async = true;
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    /**
     * Get Stripe publishable key
     */
    getPublishableKey() {
        // Check multiple sources for the key
        return localStorage.getItem('stripe_publishable_key') ||
               sessionStorage.getItem('stripe_publishable_key') ||
               window.STRIPE_PUBLISHABLE_KEY ||
               null;
    }

    /**
     * Create checkout session
     */
    async createCheckoutSession(productKey, options = {}) {
        try {
            const product = this.config.products[productKey];
            if (!product) {
                throw new Error(`Invalid product: ${productKey}`);
            }

            // Track checkout initiation
            this.trackEvent('checkout_initiated', {
                product: productKey,
                price: product.price,
                interval: product.interval
            });

            // Prepare session data
            const sessionData = {
                mode: 'subscription',
                payment_method_types: ['card'],
                line_items: [{
                    price: product.stripePriceId || await this.createPrice(productKey),
                    quantity: 1
                }],
                success_url: `${window.location.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
                cancel_url: `${window.location.origin}/pricing`,
                customer_email: options.email || null,
                client_reference_id: options.referenceId || null,
                metadata: {
                    product: productKey,
                    source: options.source || 'website',
                    campaign: options.campaign || null
                },
                subscription_data: {
                    trial_period_days: product.trialDays,
                    metadata: {
                        product: productKey
                    }
                },
                allow_promotion_codes: true,
                billing_address_collection: 'required'
            };

            // Add custom fields if provided
            if (options.customFields) {
                sessionData.custom_fields = options.customFields;
            }

            // Create session via API
            const response = await this.callAPI('/api/create-checkout-session', {
                method: 'POST',
                body: JSON.stringify(sessionData)
            });

            if (response.sessionId) {
                this.currentSession = response.sessionId;
                
                // Redirect to Stripe Checkout
                const result = await this.stripe.redirectToCheckout({
                    sessionId: response.sessionId
                });

                if (result.error) {
                    throw result.error;
                }
            } else {
                throw new Error('Failed to create checkout session');
            }

        } catch (error) {
            console.error('Checkout session error:', error);
            this.trackEvent('checkout_error', {
                product: productKey,
                error: error.message
            });
            this.showError(error.message);
            throw error;
        }
    }

    /**
     * Create Stripe price dynamically
     */
    async createPrice(productKey) {
        const product = this.config.products[productKey];
        
        try {
            const response = await this.callAPI('/api/create-price', {
                method: 'POST',
                body: JSON.stringify({
                    product: productKey,
                    amount: product.price * 100, // Convert to cents
                    currency: 'usd',
                    interval: product.interval,
                    nickname: product.name
                })
            });

            if (response.priceId) {
                // Cache the price ID
                product.stripePriceId = response.priceId;
                this.saveConfig();
                return response.priceId;
            }

            throw new Error('Failed to create price');

        } catch (error) {
            console.error('Price creation error:', error);
            throw error;
        }
    }

    /**
     * Set up embedded payment form
     */
    async setupPaymentForm(containerSelector, productKey) {
        try {
            if (!this.stripe) {
                throw new Error('Stripe not initialized');
            }

            const product = this.config.products[productKey];
            if (!product) {
                throw new Error(`Invalid product: ${productKey}`);
            }

            // Create payment intent
            const response = await this.callAPI('/api/create-payment-intent', {
                method: 'POST',
                body: JSON.stringify({
                    amount: product.price * 100,
                    currency: 'usd',
                    metadata: {
                        product: productKey
                    }
                })
            });

            const clientSecret = response.clientSecret;

            // Set up Elements
            const appearance = {
                theme: 'stripe',
                variables: {
                    colorPrimary: '#BF5700',
                    colorBackground: '#ffffff',
                    colorSurface: '#ffffff',
                    colorText: '#30313d',
                    colorDanger: '#df1b41',
                    fontFamily: 'Inter, system-ui, sans-serif',
                    spacingUnit: '4px',
                    borderRadius: '8px'
                }
            };

            this.elements = this.stripe.elements({
                appearance,
                clientSecret
            });

            // Create and mount payment element
            const paymentElement = this.elements.create('payment', {
                layout: 'tabs',
                fields: {
                    billingDetails: {
                        name: 'auto',
                        email: 'auto'
                    }
                }
            });

            const container = document.querySelector(containerSelector);
            if (container) {
                paymentElement.mount(container);
                
                // Add submit button if not exists
                if (!container.querySelector('.payment-submit')) {
                    const submitBtn = document.createElement('button');
                    submitBtn.className = 'payment-submit btn btn-primary';
                    submitBtn.textContent = `Subscribe - $${product.price}/month`;
                    submitBtn.onclick = () => this.submitPayment(productKey);
                    container.appendChild(submitBtn);
                }
            }

            return paymentElement;

        } catch (error) {
            console.error('Payment form setup error:', error);
            this.showError(error.message);
            throw error;
        }
    }

    /**
     * Submit payment
     */
    async submitPayment(productKey) {
        try {
            if (!this.stripe || !this.elements) {
                throw new Error('Payment form not initialized');
            }

            // Show loading state
            this.showLoading(true);

            // Submit payment
            const { error } = await this.stripe.confirmPayment({
                elements: this.elements,
                confirmParams: {
                    return_url: `${window.location.origin}/success`,
                    receipt_email: document.querySelector('#email')?.value
                }
            });

            if (error) {
                throw error;
            }

            // Track successful payment
            this.trackEvent('payment_submitted', {
                product: productKey
            });

        } catch (error) {
            console.error('Payment submission error:', error);
            this.trackEvent('payment_error', {
                product: productKey,
                error: error.message
            });
            this.showError(error.message);
        } finally {
            this.showLoading(false);
        }
    }

    /**
     * Manage customer portal
     */
    async openCustomerPortal() {
        try {
            // Get or create portal session
            const response = await this.callAPI('/api/create-portal-session', {
                method: 'POST',
                body: JSON.stringify({
                    returnUrl: window.location.href
                })
            });

            if (response.url) {
                window.location.href = response.url;
            } else {
                throw new Error('Failed to create portal session');
            }

        } catch (error) {
            console.error('Customer portal error:', error);
            this.showError(error.message);
        }
    }

    /**
     * Handle webhook events
     */
    setupWebhookHandlers() {
        // Payment successful
        this.webhooks.handlers.set('payment_intent.succeeded', async (event) => {
            const paymentIntent = event.data.object;
            console.log('💰 Payment successful:', paymentIntent.id);
            
            // Update user status
            await this.updateUserSubscription(paymentIntent);
            
            // Send confirmation email
            await this.sendPaymentConfirmation(paymentIntent);
            
            // Track conversion
            this.trackEvent('payment_completed', {
                amount: paymentIntent.amount / 100,
                currency: paymentIntent.currency
            });
        });

        // Subscription created
        this.webhooks.handlers.set('customer.subscription.created', async (event) => {
            const subscription = event.data.object;
            console.log('📋 Subscription created:', subscription.id);
            
            // Activate user account
            await this.activateSubscription(subscription);
            
            // Start onboarding flow
            await this.startOnboarding(subscription);
        });

        // Subscription updated
        this.webhooks.handlers.set('customer.subscription.updated', async (event) => {
            const subscription = event.data.object;
            console.log('📝 Subscription updated:', subscription.id);
            
            // Update user plan
            await this.updateUserPlan(subscription);
        });

        // Subscription cancelled
        this.webhooks.handlers.set('customer.subscription.deleted', async (event) => {
            const subscription = event.data.object;
            console.log('❌ Subscription cancelled:', subscription.id);
            
            // Deactivate user account
            await this.deactivateSubscription(subscription);
            
            // Send retention email
            await this.sendRetentionEmail(subscription);
        });

        // Payment failed
        this.webhooks.handlers.set('payment_intent.payment_failed', async (event) => {
            const paymentIntent = event.data.object;
            console.log('⚠️ Payment failed:', paymentIntent.id);
            
            // Notify user
            await this.notifyPaymentFailure(paymentIntent);
            
            // Track failure
            this.trackEvent('payment_failed', {
                reason: paymentIntent.last_payment_error?.message
            });
        });
    }

    /**
     * Process webhook event
     */
    async processWebhook(request) {
        try {
            // Verify webhook signature
            const signature = request.headers['stripe-signature'];
            const event = this.stripe.webhooks.constructEvent(
                request.body,
                signature,
                this.config.webhooks.signingSecret
            );

            // Handle event
            const handler = this.webhooks.handlers.get(event.type);
            if (handler) {
                await handler(event);
                return { received: true };
            } else {
                console.log(`Unhandled webhook event: ${event.type}`);
                return { received: true, unhandled: true };
            }

        } catch (error) {
            console.error('Webhook processing error:', error);
            throw error;
        }
    }

    /**
     * Load saved payment methods
     */
    async loadSavedPaymentMethods() {
        try {
            const response = await this.callAPI('/api/payment-methods');
            
            if (response.paymentMethods) {
                this.savedPaymentMethods = response.paymentMethods;
                this.displaySavedPaymentMethods();
            }

        } catch (error) {
            console.error('Error loading payment methods:', error);
        }
    }

    /**
     * Display saved payment methods
     */
    displaySavedPaymentMethods() {
        const container = document.querySelector('.saved-payment-methods');
        if (!container || !this.savedPaymentMethods?.length) return;

        container.innerHTML = this.savedPaymentMethods.map(pm => `
            <div class="payment-method-card">
                <div class="card-brand">${pm.card.brand.toUpperCase()}</div>
                <div class="card-last4">•••• ${pm.card.last4}</div>
                <div class="card-exp">${pm.card.exp_month}/${pm.card.exp_year}</div>
                <button onclick="blazePayment.selectPaymentMethod('${pm.id}')">
                    Use This Card
                </button>
            </div>
        `).join('');
    }

    /**
     * Analytics tracking
     */
    initAnalytics() {
        // Track page views
        this.trackEvent('payment_page_view', {
            page: window.location.pathname,
            referrer: document.referrer
        });

        // Track pricing interactions
        document.querySelectorAll('.pricing-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const product = e.currentTarget.dataset.product;
                this.trackEvent('pricing_card_clicked', { product });
            });
        });
    }

    /**
     * Track analytics event
     */
    trackEvent(eventName, data = {}) {
        if (!this.config.analytics.trackingEnabled) return;

        const event = {
            name: eventName,
            data: {
                ...data,
                timestamp: Date.now(),
                sessionId: this.currentSession,
                userId: this.getUserId()
            }
        };

        this.config.analytics.events.push(event);

        // Send to analytics service
        if (window.blazeAnalytics) {
            window.blazeAnalytics.track(eventName, event.data);
        }

        // Log in development
        if (window.location.hostname === 'localhost') {
            console.log('📊 Payment Event:', eventName, event.data);
        }
    }

    /**
     * API call helper
     */
    async callAPI(endpoint, options = {}) {
        const defaultOptions = {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'X-Stripe-Version': this.config.stripe.apiVersion
            }
        };

        const response = await fetch(endpoint, { ...defaultOptions, ...options });
        
        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'API request failed');
        }

        return response.json();
    }

    /**
     * UI helpers
     */
    showError(message) {
        const errorElement = document.querySelector('.payment-error');
        if (errorElement) {
            errorElement.textContent = message;
            errorElement.style.display = 'block';
            setTimeout(() => {
                errorElement.style.display = 'none';
            }, 5000);
        } else {
            alert(`Payment Error: ${message}`);
        }
    }

    showLoading(show) {
        const button = document.querySelector('.payment-submit');
        if (button) {
            button.disabled = show;
            button.textContent = show ? 'Processing...' : button.dataset.originalText;
            if (!button.dataset.originalText && !show) {
                button.dataset.originalText = button.textContent;
            }
        }
    }

    /**
     * User helpers
     */
    getUserId() {
        return localStorage.getItem('userId') || 
               sessionStorage.getItem('userId') || 
               'anonymous';
    }

    /**
     * Save configuration
     */
    saveConfig() {
        localStorage.setItem('payment_config', JSON.stringify(this.config));
    }

    /**
     * Error recovery
     */
    async handleInitError(error) {
        this.retryCount++;
        
        if (this.retryCount <= this.maxRetries) {
            console.log(`Retrying initialization (${this.retryCount}/${this.maxRetries})...`);
            setTimeout(() => this.init(), 2000 * this.retryCount);
        } else {
            console.error('Maximum retries reached. Payment system unavailable.');
            this.showError('Payment system is temporarily unavailable. Please try again later.');
        }
    }

    /**
     * Subscription management helpers
     */
    async updateUserSubscription(paymentIntent) {
        // Implementation would update user database
        console.log('Updating user subscription:', paymentIntent);
    }

    async sendPaymentConfirmation(paymentIntent) {
        // Implementation would send email
        console.log('Sending payment confirmation:', paymentIntent);
    }

    async activateSubscription(subscription) {
        // Implementation would activate features
        console.log('Activating subscription:', subscription);
    }

    async startOnboarding(subscription) {
        // Implementation would trigger onboarding
        console.log('Starting onboarding:', subscription);
    }

    async updateUserPlan(subscription) {
        // Implementation would update plan
        console.log('Updating user plan:', subscription);
    }

    async deactivateSubscription(subscription) {
        // Implementation would deactivate features
        console.log('Deactivating subscription:', subscription);
    }

    async sendRetentionEmail(subscription) {
        // Implementation would send retention email
        console.log('Sending retention email:', subscription);
    }

    async notifyPaymentFailure(paymentIntent) {
        // Implementation would notify user
        console.log('Notifying payment failure:', paymentIntent);
    }
}

// Initialize payment processor when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.blazePayment = new BlazePaymentProcessor();
    });
} else {
    window.blazePayment = new BlazePaymentProcessor();
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazePaymentProcessor;
}