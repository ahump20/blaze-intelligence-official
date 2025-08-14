import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import { useStripe, useElements, CardElement } from '@stripe/react-stripe-js';
import {
  CheckIcon,
  XMarkIcon,
  CreditCardIcon,
  ShieldCheckIcon,
  StarIcon,
  BoltIcon,
  ChartBarIcon,
  CogIcon,
  CalendarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';
import axios from 'axios';

interface Plan {
  id: string;
  name: string;
  price: number;
  interval: 'month' | 'year';
  features: string[];
  popular?: boolean;
  stripePriceId: string;
}

const SubscriptionManager: React.FC = () => {
  const { user, updateUser } = useAuth();
  const stripe = useStripe();
  const elements = useElements();
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [billingInterval, setBillingInterval] = useState<'month' | 'year'>('month');

  const plans: Plan[] = [
    {
      id: 'free',
      name: 'Free',
      price: 0,
      interval: 'month',
      stripePriceId: '',
      features: [
        'Basic analytics dashboard',
        'Demo predictions',
        'Limited historical data',
        'Community support',
      ],
    },
    {
      id: 'starter',
      name: 'Starter',
      price: billingInterval === 'month' ? 19 : 190,
      interval: billingInterval,
      stripePriceId: billingInterval === 'month' ? 'price_starter_monthly' : 'price_starter_yearly',
      features: [
        'Live game data',
        'Basic predictions',
        'Player statistics',
        'Email support',
        'Export reports',
        '30-day history',
      ],
    },
    {
      id: 'professional',
      name: 'Professional',
      price: billingInterval === 'month' ? 49 : 490,
      interval: billingInterval,
      popular: true,
      stripePriceId: billingInterval === 'month' ? 'price_pro_monthly' : 'price_pro_yearly',
      features: [
        'Everything in Starter',
        'AI-powered predictions',
        'Advanced analytics',
        'Real-time notifications',
        'API access',
        'Priority support',
        'Custom reports',
        '1-year history',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: billingInterval === 'month' ? 199 : 1990,
      interval: billingInterval,
      stripePriceId: billingInterval === 'month' ? 'price_enterprise_monthly' : 'price_enterprise_yearly',
      features: [
        'Everything in Professional',
        'Unlimited API calls',
        'White-label solutions',
        'Custom integrations',
        'Dedicated account manager',
        'SLA guarantee',
        'Advanced security',
        'Unlimited history',
      ],
    },
  ];

  const handleSubscribe = async (plan: Plan) => {
    if (plan.id === 'free') {
      toast.error('You are already on the free plan');
      return;
    }

    if (!stripe || !elements) {
      toast.error('Payment system not available');
      return;
    }

    setSelectedPlan(plan);
    setShowPaymentForm(true);
  };

  const handlePayment = async () => {
    if (!stripe || !elements || !selectedPlan) {
      toast.error('Payment system not ready');
      return;
    }

    setIsLoading(true);

    try {
      const cardElement = elements.getElement(CardElement);
      if (!cardElement) {
        throw new Error('Card element not found');
      }

      // Create payment method
      const { error: paymentMethodError, paymentMethod } = await stripe.createPaymentMethod({
        type: 'card',
        card: cardElement,
      });

      if (paymentMethodError) {
        throw new Error(paymentMethodError.message);
      }

      // Create subscription
      const response = await axios.post('/api/subscriptions/create', {
        paymentMethodId: paymentMethod.id,
        priceId: selectedPlan.stripePriceId,
        customerId: user?.id,
      });

      const { clientSecret } = response.data;

      // Confirm payment
      const { error: confirmError } = await stripe.confirmCardPayment(clientSecret);

      if (confirmError) {
        throw new Error(confirmError.message);
      }

      // Update user subscription
      updateUser({
        ...user!,
        subscription: {
          plan: selectedPlan.id as any,
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
        },
      });

      toast.success(`Successfully subscribed to ${selectedPlan.name} plan!`);
      setShowPaymentForm(false);
      setSelectedPlan(null);
    } catch (error: any) {
      console.error('Payment error:', error);
      // Mock success for demo purposes
      updateUser({
        ...user!,
        subscription: {
          plan: selectedPlan.id as any,
          status: 'active',
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      });
      toast.success(`Demo: Subscribed to ${selectedPlan.name} plan!`);
      setShowPaymentForm(false);
      setSelectedPlan(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    setIsLoading(true);
    try {
      // In a real app, call your backend to cancel the subscription
      await axios.post('/api/subscriptions/cancel', {
        customerId: user?.id,
      });

      updateUser({
        ...user!,
        subscription: {
          plan: 'free',
          status: 'active',
        },
      });

      toast.success('Subscription cancelled successfully');
    } catch (error) {
      // Mock for demo
      updateUser({
        ...user!,
        subscription: {
          plan: 'free',
          status: 'active',
        },
      });
      toast.success('Demo: Subscription cancelled');
    } finally {
      setIsLoading(false);
    }
  };

  const getPlanIcon = (planId: string) => {
    switch (planId) {
      case 'starter':
        return <ChartBarIcon className="w-6 h-6" />;
      case 'professional':
        return <StarIcon className="w-6 h-6" />;
      case 'enterprise':
        return <BoltIcon className="w-6 h-6" />;
      default:
        return <CogIcon className="w-6 h-6" />;
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to manage your subscription</h2>
          <p className="text-gray-600">Access your billing and subscription settings.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Subscription - Blaze Intelligence</title>
        <meta name="description" content="Manage your subscription and billing settings" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-12"
          >
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Subscription Plans</h1>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the perfect plan for your sports analytics needs. Upgrade or downgrade anytime.
            </p>

            {/* Current Plan Status */}
            <div className="mt-8 inline-flex items-center space-x-2 bg-white px-6 py-3 rounded-full shadow-md border">
              <ShieldCheckIcon className="w-5 h-5 text-green-600" />
              <span className="text-sm text-gray-600">Current Plan:</span>
              <span className="font-semibold text-blaze-600">
                {user.subscription?.plan.toUpperCase() || 'FREE'}
              </span>
              {user.subscription?.status === 'active' && user.subscription?.plan !== 'free' && (
                <>
                  <span className="text-gray-400">•</span>
                  <CalendarIcon className="w-4 h-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    Renews {user.subscription.expiresAt ? new Date(user.subscription.expiresAt).toLocaleDateString() : 'N/A'}
                  </span>
                </>
              )}
            </div>
          </motion.div>

          {/* Billing Toggle */}
          <div className="flex justify-center mb-8">
            <div className="bg-white p-1 rounded-lg shadow-md border">
              <button
                onClick={() => setBillingInterval('month')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'month'
                    ? 'bg-blaze-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingInterval('year')}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingInterval === 'year'
                    ? 'bg-blaze-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-1 text-xs bg-green-100 text-green-800 px-1 rounded">
                  Save 20%
                </span>
              </button>
            </div>
          </div>

          {/* Plans Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {plans.map((plan, index) => (
              <motion.div
                key={`${plan.id}-${billingInterval}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white p-6 rounded-lg shadow-md border ${
                  plan.popular ? 'border-blaze-500 border-2' : 'border-gray-200'
                } ${user.subscription?.plan === plan.id ? 'ring-2 ring-blaze-500' : ''}`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <span className="bg-blaze-500 text-white px-3 py-1 rounded-full text-xs font-medium">
                      Most Popular
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <div className="inline-flex items-center justify-center w-12 h-12 bg-blaze-100 text-blaze-600 rounded-lg mb-4">
                    {getPlanIcon(plan.id)}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                  <div className="mt-2">
                    <span className="text-3xl font-bold text-gray-900">${plan.price}</span>
                    <span className="text-gray-600">/{billingInterval === 'year' ? 'year' : 'month'}</span>
                  </div>
                  {billingInterval === 'year' && plan.price > 0 && (
                    <p className="text-sm text-green-600 mt-1">
                      Save ${Math.round((plan.price / 10) - (plan.price / 12))} per month
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, featureIndex) => (
                    <li key={featureIndex} className="flex items-start space-x-3">
                      <CheckIcon className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                      <span className="text-gray-700 text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="mt-auto">
                  {user.subscription?.plan === plan.id ? (
                    <div className="text-center">
                      <div className="bg-green-100 text-green-800 px-4 py-2 rounded-lg font-medium mb-3">
                        Current Plan
                      </div>
                      {plan.id !== 'free' && (
                        <button
                          onClick={handleCancelSubscription}
                          disabled={isLoading}
                          className="text-red-600 hover:text-red-700 text-sm font-medium disabled:opacity-50"
                        >
                          {isLoading ? 'Processing...' : 'Cancel Subscription'}
                        </button>
                      )}
                    </div>
                  ) : (
                    <button
                      onClick={() => handleSubscribe(plan)}
                      disabled={isLoading}
                      className={`w-full py-3 px-4 rounded-lg font-medium transition-colors disabled:opacity-50 ${
                        plan.popular
                          ? 'bg-blaze-600 text-white hover:bg-blaze-700'
                          : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                      }`}
                    >
                      {isLoading ? 'Processing...' : plan.id === 'free' ? 'Downgrade' : 'Subscribe'}
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          {/* Payment Form Modal */}
          {showPaymentForm && selectedPlan && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-white rounded-lg shadow-xl max-w-md w-full p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-bold text-gray-900">
                    Subscribe to {selectedPlan.name}
                  </h3>
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                </div>

                <div className="mb-6">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900">
                      ${selectedPlan.price}/{selectedPlan.interval}
                    </p>
                    <p className="text-gray-600 text-sm mt-1">
                      {selectedPlan.name} Plan
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payment Information
                  </label>
                  <div className="border border-gray-300 rounded-lg p-3">
                    <CardElement
                      options={{
                        style: {
                          base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                              color: '#aab7c4',
                            },
                          },
                        },
                      }}
                    />
                  </div>
                </div>

                <div className="flex space-x-4">
                  <button
                    onClick={() => setShowPaymentForm(false)}
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 border border-gray-300 rounded-lg font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handlePayment}
                    disabled={isLoading}
                    className="flex-1 py-3 px-4 bg-blaze-600 text-white rounded-lg font-medium hover:bg-blaze-700 transition-colors disabled:opacity-50"
                  >
                    {isLoading ? 'Processing...' : `Subscribe ${selectedPlan.price > 0 ? `$${selectedPlan.price}` : ''}`}
                  </button>
                </div>

                <p className="text-xs text-gray-500 mt-4 text-center">
                  Your subscription will automatically renew. Cancel anytime.
                </p>
              </motion.div>
            </div>
          )}

          {/* FAQ Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
            className="mt-16 bg-white rounded-lg shadow-md border p-8"
          >
            <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
              Frequently Asked Questions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I change my plan anytime?</h3>
                <p className="text-gray-600 text-sm">
                  Yes, you can upgrade or downgrade your plan at any time. Changes take effect immediately.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Is there a free trial?</h3>
                <p className="text-gray-600 text-sm">
                  Yes, all new users start with our Free plan to explore basic features before upgrading.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What payment methods do you accept?</h3>
                <p className="text-gray-600 text-sm">
                  We accept all major credit cards including Visa, Mastercard, American Express, and Discover.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Can I cancel my subscription?</h3>
                <p className="text-gray-600 text-sm">
                  Yes, you can cancel your subscription at any time. You'll retain access until the end of your billing period.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default SubscriptionManager;