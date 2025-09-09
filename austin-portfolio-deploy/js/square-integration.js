/**
 * Blaze Intelligence Square Payment Integration
 * Alternative payment processing for international clients and ACH transfers
 */

class BlazeSquareIntegration {
  constructor(config) {
    this.applicationId = config.applicationId;
    this.locationId = config.locationId;
    this.environment = config.environment || 'production';
    this.payments = null;
    
    // Initialize Square Web Payments SDK
    this.initializeSquare();
  }

  async initializeSquare() {
    try {
      // Load Square Web Payments SDK
      if (!window.Square) {
        await this.loadSquareSDK();
      }

      this.payments = window.Square.payments(this.applicationId, this.locationId);
      console.log('Square Web Payments SDK initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Square:', error);
    }
  }

  async loadSquareSDK() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = this.environment === 'production' 
        ? 'https://web.squarecdn.com/v1/square.js'
        : 'https://sandbox.web.squarecdn.com/v1/square.js';
      
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  /**
   * Initialize card payment form
   */
  async initializeCardForm(containerId, options = {}) {
    try {
      const card = await this.payments.card({
        style: {
          '.input-container': {
            'border-color': '#E5E7EB',
            'border-radius': '8px'
          },
          '.input-container.is-focus': {
            'border-color': '#3B82F6'
          },
          '.input-container.is-error': {
            'border-color': '#EF4444'
          },
          '.message-text': {
            'color': '#6B7280'
          },
          '.message-text.is-error': {
            'color': '#EF4444'
          }
        }
      });

      await card.attach(`#${containerId}`);
      
      return {
        card,
        tokenize: async () => {
          const result = await card.tokenize();
          if (result.status === 'OK') {
            return {
              success: true,
              token: result.token,
              details: result.details
            };
          } else {
            return {
              success: false,
              errors: result.errors
            };
          }
        }
      };
    } catch (error) {
      console.error('Failed to initialize card form:', error);
      throw error;
    }
  }

  /**
   * Initialize ACH payment form
   */
  async initializeACHForm(containerId) {
    try {
      const ach = await this.payments.ach({
        // ACH configuration
        redirectURI: `${window.location.origin}/success.html`,
        transactionId: `blaze-${Date.now()}`
      });

      await ach.attach(`#${containerId}`);
      
      return {
        ach,
        tokenize: async (accountHolderName) => {
          const result = await ach.tokenize({
            accountHolderName: accountHolderName
          });
          
          if (result.status === 'OK') {
            return {
              success: true,
              token: result.token,
              details: result.details
            };
          } else {
            return {
              success: false,
              errors: result.errors
            };
          }
        }
      };
    } catch (error) {
      console.error('Failed to initialize ACH form:', error);
      throw error;
    }
  }

  /**
   * Process payment with Square
   */
  async processPayment(paymentData) {
    try {
      const response = await fetch('/api/payment-processor/square-payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sourceId: paymentData.token,
          amount: paymentData.amount,
          currency: paymentData.currency || 'USD',
          referenceId: paymentData.referenceId,
          customerEmail: paymentData.customerEmail,
          tier: paymentData.tier,
          organization: paymentData.organization,
          contactPerson: paymentData.contactPerson,
          phone: paymentData.phone,
          billingAddress: paymentData.billingAddress
        })
      });

      const result = await response.json();
      
      if (result.success) {
        // Payment successful - redirect to success page
        window.location.href = `/success.html?payment_id=${result.paymentId}&processor=square`;
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }

      return result;
    } catch (error) {
      console.error('Square payment processing failed:', error);
      throw error;
    }
  }

  /**
   * Create payment form with multiple options
   */
  createPaymentForm(containerId, productConfig) {
    const container = document.getElementById(containerId);
    
    container.innerHTML = `
      <div class="square-payment-form">
        <div class="payment-options mb-6">
          <div class="flex space-x-4 mb-4">
            <button type="button" 
                    class="payment-option-btn active" 
                    data-method="card"
                    onclick="switchPaymentMethod('card')">
              Credit Card
            </button>
            <button type="button" 
                    class="payment-option-btn" 
                    data-method="ach"
                    onclick="switchPaymentMethod('ach')">
              Bank Transfer (ACH)
            </button>
          </div>
        </div>

        <!-- Customer Information -->
        <div class="customer-info mb-6">
          <div class="grid grid-cols-2 gap-4">
            <input type="text" 
                   id="contact-person" 
                   placeholder="Contact Person"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <input type="email" 
                   id="customer-email" 
                   placeholder="Email Address"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="grid grid-cols-2 gap-4 mt-4">
            <input type="text" 
                   id="organization" 
                   placeholder="Organization"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <input type="tel" 
                   id="phone" 
                   placeholder="Phone Number"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
        </div>

        <!-- Payment Method Container -->
        <div class="payment-method-container mb-6">
          <div id="card-container" class="payment-method active">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Card Information
            </label>
            <div id="card-element" class="border border-gray-300 rounded-lg p-4"></div>
          </div>
          
          <div id="ach-container" class="payment-method hidden">
            <label class="block text-sm font-medium text-gray-700 mb-2">
              Bank Account Information
            </label>
            <input type="text" 
                   id="account-holder-name" 
                   placeholder="Account Holder Name"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4">
            <div id="ach-element" class="border border-gray-300 rounded-lg p-4"></div>
          </div>
        </div>

        <!-- Billing Address -->
        <div class="billing-address mb-6">
          <h3 class="text-lg font-medium mb-4">Billing Address</h3>
          <div class="grid grid-cols-2 gap-4">
            <input type="text" 
                   id="billing-address-line1" 
                   placeholder="Address Line 1"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <input type="text" 
                   id="billing-address-line2" 
                   placeholder="Address Line 2 (Optional)"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <div class="grid grid-cols-3 gap-4 mt-4">
            <input type="text" 
                   id="billing-city" 
                   placeholder="City"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <input type="text" 
                   id="billing-state" 
                   placeholder="State"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
            <input type="text" 
                   id="billing-zip" 
                   placeholder="ZIP Code"
                   class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
          </div>
          <select id="billing-country" 
                  class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mt-4">
            <option value="US">United States</option>
            <option value="CA">Canada</option>
            <option value="MX">Mexico</option>
            <option value="GB">United Kingdom</option>
            <option value="JP">Japan</option>
            <option value="KR">South Korea</option>
          </select>
        </div>

        <!-- Order Summary -->
        <div class="order-summary mb-6 p-4 bg-gray-50 rounded-lg">
          <h3 class="text-lg font-medium mb-2">Order Summary</h3>
          <div class="flex justify-between items-center">
            <span>${productConfig.name}</span>
            <span class="font-bold">$${(productConfig.amount / 100).toLocaleString()}</span>
          </div>
          <div class="text-sm text-gray-600 mt-1">
            ${productConfig.description}
          </div>
        </div>

        <!-- Payment Button -->
        <button type="button" 
                id="square-pay-button" 
                class="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                onclick="processSquarePayment()">
          Complete Payment - $${(productConfig.amount / 100).toLocaleString()}
        </button>

        <!-- Error Display -->
        <div id="payment-errors" class="mt-4 text-red-600 hidden"></div>
      </div>
    `;

    // Initialize payment methods
    this.initializePaymentMethods();
  }

  async initializePaymentMethods() {
    try {
      // Initialize card form
      this.cardForm = await this.initializeCardForm('card-element');
      
      // Initialize ACH form
      this.achForm = await this.initializeACHForm('ach-element');
      
      console.log('Payment methods initialized successfully');
    } catch (error) {
      console.error('Failed to initialize payment methods:', error);
    }
  }

  /**
   * Switch between payment methods
   */
  switchPaymentMethod(method) {
    // Update active button
    document.querySelectorAll('.payment-option-btn').forEach(btn => {
      btn.classList.remove('active');
    });
    document.querySelector(`[data-method="${method}"]`).classList.add('active');

    // Show/hide payment method containers
    document.querySelectorAll('.payment-method').forEach(container => {
      container.classList.add('hidden');
      container.classList.remove('active');
    });
    
    const activeContainer = document.getElementById(`${method}-container`);
    activeContainer.classList.remove('hidden');
    activeContainer.classList.add('active');
    
    this.currentPaymentMethod = method;
  }

  /**
   * Process Square payment
   */
  async processSquarePayment() {
    try {
      const payButton = document.getElementById('square-pay-button');
      const errorDiv = document.getElementById('payment-errors');
      
      payButton.disabled = true;
      payButton.textContent = 'Processing...';
      errorDiv.classList.add('hidden');

      // Get customer information
      const customerData = {
        contactPerson: document.getElementById('contact-person').value,
        customerEmail: document.getElementById('customer-email').value,
        organization: document.getElementById('organization').value,
        phone: document.getElementById('phone').value
      };

      // Validate required fields
      if (!customerData.contactPerson || !customerData.customerEmail || !customerData.organization) {
        throw new Error('Please fill in all required customer information fields');
      }

      // Get billing address
      const billingAddress = {
        addressLine1: document.getElementById('billing-address-line1').value,
        addressLine2: document.getElementById('billing-address-line2').value,
        locality: document.getElementById('billing-city').value,
        administrativeDistrictLevel1: document.getElementById('billing-state').value,
        postalCode: document.getElementById('billing-zip').value,
        country: document.getElementById('billing-country').value
      };

      // Tokenize payment method
      let tokenResult;
      if (this.currentPaymentMethod === 'ach') {
        const accountHolderName = document.getElementById('account-holder-name').value;
        if (!accountHolderName) {
          throw new Error('Please enter the account holder name for ACH payments');
        }
        tokenResult = await this.achForm.tokenize(accountHolderName);
      } else {
        tokenResult = await this.cardForm.tokenize();
      }

      if (!tokenResult.success) {
        throw new Error(tokenResult.errors?.[0]?.detail || 'Payment tokenization failed');
      }

      // Process payment
      const paymentData = {
        token: tokenResult.token,
        amount: this.productConfig.amount,
        currency: 'USD',
        referenceId: `blaze-${Date.now()}`,
        ...customerData,
        billingAddress,
        tier: this.productConfig.tier,
        paymentMethod: this.currentPaymentMethod
      };

      const result = await this.processPayment(paymentData);
      
      if (result.success) {
        // Redirect to success page
        window.location.href = `/success.html?payment_id=${result.paymentId}&processor=square`;
      } else {
        throw new Error(result.error || 'Payment processing failed');
      }

    } catch (error) {
      console.error('Payment processing error:', error);
      
      const errorDiv = document.getElementById('payment-errors');
      errorDiv.textContent = error.message;
      errorDiv.classList.remove('hidden');
      
      const payButton = document.getElementById('square-pay-button');
      payButton.disabled = false;
      payButton.textContent = `Complete Payment - $${(this.productConfig.amount / 100).toLocaleString()}`;
    }
  }
}

// Global functions for HTML onclick handlers
window.switchPaymentMethod = function(method) {
  if (window.blazeSquare) {
    window.blazeSquare.switchPaymentMethod(method);
  }
};

window.processSquarePayment = function() {
  if (window.blazeSquare) {
    window.blazeSquare.processSquarePayment();
  }
};

// CSS styles for Square integration
const squareStyles = `
<style>
.square-payment-form {
  max-width: 600px;
  margin: 0 auto;
}

.payment-option-btn {
  padding: 8px 16px;
  border: 1px solid #d1d5db;
  background: white;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.payment-option-btn.active {
  background: #3b82f6;
  color: white;
  border-color: #3b82f6;
}

.payment-option-btn:hover:not(.active) {
  background: #f3f4f6;
}

.payment-method {
  transition: all 0.3s ease;
}

.payment-method.hidden {
  display: none;
}

#card-element, #ach-element {
  min-height: 50px;
}

.order-summary {
  border: 1px solid #e5e7eb;
}

#square-pay-button:disabled {
  cursor: not-allowed;
}

.error-message {
  background: #fee2e2;
  color: #dc2626;
  padding: 12px;
  border-radius: 6px;
  border: 1px solid #fecaca;
}
</style>
`;

// Inject styles
if (typeof document !== 'undefined') {
  document.head.insertAdjacentHTML('beforeend', squareStyles);
}

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BlazeSquareIntegration;
}