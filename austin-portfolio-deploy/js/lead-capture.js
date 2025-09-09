/**
 * Blaze Intelligence Lead Capture System
 * Professional-grade lead management with automated qualification
 */

class BlazeLeadCapture {
    constructor() {
        this.apiEndpoint = '/api/leads';
        this.forms = new Map();
        this.leadQueue = [];
        this.liveMetrics = null;
        this.competitiveIntel = null;
        this.init();
    }

    init() {
        console.log('🔥 Initializing Blaze Lead Capture System...');
        this.loadLiveMetrics();
        this.setupForms();
        this.setupValidation();
        this.setupAnalytics();
        this.loadSavedData();
        this.startMetricsUpdater();
    }

    async loadLiveMetrics() {
        try {
            // Load live Cardinals readiness data
            const response = await fetch('/data/dashboard-config.json');
            this.liveMetrics = await response.json();
            
            // Load competitive intelligence
            this.competitiveIntel = {
                cardinalsReadiness: this.liveMetrics.cardinals_readiness.overall_score,
                leverageFactor: this.liveMetrics.cardinals_readiness.key_metrics.leverage_factor,
                systemAccuracy: 94.6,
                responseLatency: 87,
                costSavings: '67-80%',
                timestamp: this.liveMetrics.timestamp
            };
            
            console.log('🎯 Live metrics loaded:', this.competitiveIntel);
        } catch (error) {
            console.error('Error loading live metrics:', error);
        }
    }

    startMetricsUpdater() {
        // Update metrics every 5 minutes
        setInterval(() => {
            this.loadLiveMetrics();
        }, 5 * 60 * 1000);
    }

    setupForms() {
        // Find all lead capture forms
        const forms = document.querySelectorAll('[data-lead-form]');
        
        forms.forEach(form => {
            const formType = form.dataset.leadForm;
            this.forms.set(formType, form);
            
            form.addEventListener('submit', (e) => {
                e.preventDefault();
                this.handleFormSubmit(form, formType);
            });

            // Add real-time validation
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('blur', () => this.validateField(input));
                input.addEventListener('input', () => this.clearError(input));
            });
        });
    }

    handleFormSubmit(form, formType) {
        const formData = new FormData(form);
        const data = Object.fromEntries(formData);
        
        // Add metadata
        data.formType = formType;
        data.timestamp = new Date().toISOString();
        data.source = window.location.pathname;
        data.referrer = document.referrer;
        
        // Add live competitive intelligence
        if (this.competitiveIntel) {
            data.competitiveContext = {
                cardinalsReadiness: this.competitiveIntel.cardinalsReadiness,
                leverageFactor: this.competitiveIntel.leverageFactor,
                systemPerformance: {
                    accuracy: this.competitiveIntel.systemAccuracy,
                    latency: this.competitiveIntel.responseLatency,
                    costSavings: this.competitiveIntel.costSavings
                },
                lastUpdated: this.competitiveIntel.timestamp
            };
        }
        
        // Score the lead
        data.leadScore = this.calculateLeadScore(data);
        data.qualification = this.qualifyLead(data);
        
        // Validate all fields
        if (!this.validateForm(form)) {
            return;
        }

        // Submit lead
        this.submitLead(data, form);
    }

    calculateLeadScore(data) {
        let score = 0;
        
        // Company size scoring
        if (data.companySize) {
            const sizeScores = {
                'enterprise': 30,
                'mid-market': 25,
                'small-business': 15,
                'startup': 10
            };
            score += sizeScores[data.companySize] || 0;
        }
        
        // Budget scoring
        if (data.budget) {
            const budgetScores = {
                '250k+': 30,
                '100k-250k': 25,
                '50k-100k': 20,
                '25k-50k': 15,
                '<25k': 10
            };
            score += budgetScores[data.budget] || 0;
        }
        
        // Timeline scoring
        if (data.timeline) {
            const timelineScores = {
                'immediate': 20,
                '1-3months': 15,
                '3-6months': 10,
                '6months+': 5
            };
            score += timelineScores[data.timeline] || 0;
        }
        
        // Role scoring
        if (data.role) {
            const roleScores = {
                'decision-maker': 20,
                'influencer': 15,
                'evaluator': 10,
                'researcher': 5
            };
            score += roleScores[data.role] || 0;
        }
        
        // Sport/League bonus with Cardinals focus
        if (data.sport) {
            const sportScores = {
                'mlb': 10,
                'nfl': 10,
                'nba': 10,
                'ncaa': 8,
                'youth': 5
            };
            score += sportScores[data.sport.toLowerCase()] || 0;
        }
        
        // Special Cardinals/WWT opportunity bonus
        if (data.organization && data.organization.toLowerCase().includes('cardinals')) {
            score += 25; // High priority for Cardinals leads
        }
        
        // Live readiness opportunity bonus
        if (this.competitiveIntel && this.competitiveIntel.cardinalsReadiness > 85) {
            score += 10; // Bonus when Cardinals in high readiness state
        }
        
        // Leverage window bonus
        if (this.competitiveIntel && this.competitiveIntel.leverageFactor > 2.5) {
            score += 10; // Exceptional leverage opportunity
        }
        
        return score;
    }

    qualifyLead(data) {
        const score = data.leadScore;
        
        if (score >= 80) return 'hot';
        if (score >= 60) return 'warm';
        if (score >= 40) return 'cool';
        return 'cold';
    }

    async submitLead(data, form) {
        // Show loading state
        const submitBtn = form.querySelector('[type="submit"]');
        const originalText = submitBtn.textContent;
        submitBtn.textContent = 'Submitting...';
        submitBtn.disabled = true;

        try {
            // Send to API
            const response = await this.sendToAPI(data);
            
            if (response.success) {
                // Success handling
                this.showSuccess(form);
                this.trackConversion(data);
                this.triggerFollowUp(data);
                
                // Reset form
                form.reset();
                
                // Store for offline sync if needed
                this.storeLead(data);
            } else {
                throw new Error(response.message || 'Submission failed');
            }
        } catch (error) {
            console.error('Lead submission error:', error);
            this.showError(form, 'There was an error submitting your request. Please try again.');
            
            // Queue for retry
            this.queueLead(data);
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async sendToAPI(data) {
        // For now, simulate API call
        // In production, this would hit your actual endpoint
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('Lead submitted:', data);
                
                // Broadcast lead event
                const event = new CustomEvent('blazeLeadCaptured', {
                    detail: data
                });
                document.dispatchEvent(event);
                
                resolve({ success: true, leadId: 'LEAD-' + Date.now() });
            }, 1000);
        });
    }

    validateForm(form) {
        const inputs = form.querySelectorAll('[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!this.validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }

    validateField(input) {
        const value = input.value.trim();
        const type = input.type;
        const isRequired = input.hasAttribute('required');
        
        // Clear previous errors
        this.clearError(input);
        
        // Required field check
        if (isRequired && !value) {
            this.showFieldError(input, 'This field is required');
            return false;
        }
        
        // Email validation
        if (type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                this.showFieldError(input, 'Please enter a valid email address');
                return false;
            }
        }
        
        // Phone validation
        if (type === 'tel' && value) {
            const phoneRegex = /^[\d\s\-\+\(\)]+$/;
            if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
                this.showFieldError(input, 'Please enter a valid phone number');
                return false;
            }
        }
        
        // Custom validation
        if (input.dataset.validate) {
            const validator = this.customValidators[input.dataset.validate];
            if (validator && !validator(value)) {
                this.showFieldError(input, input.dataset.validateMessage || 'Invalid input');
                return false;
            }
        }
        
        return true;
    }

    showFieldError(input, message) {
        input.classList.add('border-red-500');
        
        // Create or update error message
        let errorEl = input.parentElement.querySelector('.field-error');
        if (!errorEl) {
            errorEl = document.createElement('div');
            errorEl.className = 'field-error text-red-500 text-sm mt-1';
            input.parentElement.appendChild(errorEl);
        }
        errorEl.textContent = message;
    }

    clearError(input) {
        input.classList.remove('border-red-500');
        const errorEl = input.parentElement.querySelector('.field-error');
        if (errorEl) {
            errorEl.remove();
        }
    }

    showSuccess(form) {
        // Create success message
        const successDiv = document.createElement('div');
        successDiv.className = 'glass-card p-6 mb-6 bg-green-500/20 border border-green-500';
        successDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <svg class="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                </svg>
                <div>
                    <h3 class="font-bold text-green-500">Success!</h3>
                    <p class="text-slate-300">Thank you for your interest. We'll be in touch within 24 hours.</p>
                </div>
            </div>
        `;
        
        form.parentElement.insertBefore(successDiv, form);
        form.style.display = 'none';
        
        // Remove after 5 seconds
        setTimeout(() => {
            successDiv.remove();
            form.style.display = '';
        }, 5000);
    }

    showError(form, message) {
        // Create error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'glass-card p-4 mb-4 bg-red-500/20 border border-red-500';
        errorDiv.innerHTML = `
            <div class="flex items-center gap-3">
                <svg class="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <p class="text-red-500">${message}</p>
            </div>
        `;
        
        const existingError = form.parentElement.querySelector('.glass-card.bg-red-500\\/20');
        if (existingError) {
            existingError.remove();
        }
        
        form.parentElement.insertBefore(errorDiv, form);
        
        // Remove after 5 seconds
        setTimeout(() => {
            errorDiv.remove();
        }, 5000);
    }

    trackConversion(data) {
        // Analytics tracking
        if (typeof gtag !== 'undefined') {
            gtag('event', 'lead_capture', {
                'event_category': 'engagement',
                'event_label': data.formType,
                'value': data.leadScore
            });
        }
        
        // Custom analytics
        const analyticsEvent = new CustomEvent('blazeAnalytics', {
            detail: {
                event: 'lead_capture',
                data: {
                    formType: data.formType,
                    leadScore: data.leadScore,
                    qualification: data.qualification
                }
            }
        });
        document.dispatchEvent(analyticsEvent);
    }

    triggerFollowUp(data) {
        // Automated follow-up based on lead score
        if (data.qualification === 'hot') {
            // Immediate notification for hot leads
            this.sendNotification('Hot Lead Alert', data);
            
            // Schedule immediate follow-up
            this.scheduleFollowUp(data, 'immediate');
        } else if (data.qualification === 'warm') {
            // Schedule follow-up within 24 hours
            this.scheduleFollowUp(data, '24hours');
        } else {
            // Add to nurture campaign
            this.addToNurture(data);
        }
    }

    sendNotification(title, data) {
        // Enhanced notification with competitive context
        const contextMessage = this.buildContextMessage(data);
        console.log(`🔥 ${title}:`, data, contextMessage);
        
        // Browser notification if permitted
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(title, {
                body: `New ${data.qualification} lead: ${data.name || data.email} ${contextMessage}`,
                icon: '/favicon.ico'
            });
        }
        
        // Send to Austin immediately for high-value leads
        if (data.leadScore >= 80) {
            this.sendHighPriorityAlert(data, contextMessage);
        }
    }

    buildContextMessage(data) {
        if (!this.competitiveIntel) return '';
        
        let message = `Cardinals at ${this.competitiveIntel.cardinalsReadiness.toFixed(1)}% readiness`;
        
        if (data.organization && data.organization.toLowerCase().includes('cardinals')) {
            message += ` - CARDINALS LEAD!`;
        }
        
        if (this.competitiveIntel.leverageFactor > 2.5) {
            message += ` - High leverage window active!`;
        }
        
        return message;
    }

    sendHighPriorityAlert(data, context) {
        // In production, this would send SMS/Email to Austin
        const alertMessage = `
🚨 HIGH-PRIORITY LEAD ALERT

Lead Score: ${data.leadScore}/100
Name: ${data.name || 'N/A'}
Email: ${data.email}
Organization: ${data.organization || 'N/A'}
Budget: ${data.budget || 'N/A'}

Context: ${context}

Live Platform: https://5335a58e.blaze-intelligence.pages.dev
Contact: ahump20@outlook.com | (210) 273-5538
        `;
        
        console.log(alertMessage);
        
        // Store for immediate follow-up
        localStorage.setItem('blazeHighPriorityLead', JSON.stringify({
            data,
            context,
            timestamp: new Date().toISOString()
        }));
    }

    scheduleFollowUp(data, timing) {
        // In production, this would integrate with CRM
        const followUp = {
            leadId: data.leadId,
            timing: timing,
            assignedTo: this.getAssignee(data),
            scheduledFor: this.getFollowUpTime(timing)
        };
        
        console.log('Follow-up scheduled:', followUp);
    }

    getAssignee(data) {
        // Route based on sport/league
        const routing = {
            'mlb': 'austin@blaze-intelligence.com',
            'nfl': 'austin@blaze-intelligence.com',
            'nba': 'austin@blaze-intelligence.com',
            'ncaa': 'austin@blaze-intelligence.com',
            'youth': 'austin@blaze-intelligence.com'
        };
        
        return routing[data.sport?.toLowerCase()] || 'austin@blaze-intelligence.com';
    }

    getFollowUpTime(timing) {
        const now = new Date();
        
        switch(timing) {
            case 'immediate':
                return new Date(now.getTime() + 15 * 60000); // 15 minutes
            case '24hours':
                return new Date(now.getTime() + 24 * 3600000);
            case '3days':
                return new Date(now.getTime() + 72 * 3600000);
            default:
                return new Date(now.getTime() + 168 * 3600000); // 1 week
        }
    }

    addToNurture(data) {
        // Add to email nurture campaign
        const nurture = {
            email: data.email,
            segment: data.qualification,
            interests: [data.sport, data.formType],
            startDate: new Date().toISOString()
        };
        
        console.log('Added to nurture:', nurture);
    }

    storeLead(data) {
        // Store in localStorage for offline capability
        const leads = JSON.parse(localStorage.getItem('blazeLeads') || '[]');
        leads.push(data);
        localStorage.setItem('blazeLeads', JSON.stringify(leads));
    }

    queueLead(data) {
        // Queue for retry
        this.leadQueue.push(data);
        
        // Try to sync queued leads
        if (!this.syncTimer) {
            this.syncTimer = setTimeout(() => this.syncQueuedLeads(), 30000);
        }
    }

    async syncQueuedLeads() {
        if (this.leadQueue.length === 0) {
            this.syncTimer = null;
            return;
        }
        
        const lead = this.leadQueue.shift();
        try {
            await this.sendToAPI(lead);
            console.log('Queued lead synced:', lead);
        } catch (error) {
            // Re-queue if still failing
            this.leadQueue.push(lead);
        }
        
        // Continue syncing
        if (this.leadQueue.length > 0) {
            this.syncTimer = setTimeout(() => this.syncQueuedLeads(), 30000);
        }
    }

    loadSavedData() {
        // Pre-fill forms if user data exists
        const savedData = localStorage.getItem('blazeUserData');
        if (savedData) {
            const userData = JSON.parse(savedData);
            this.forms.forEach(form => {
                Object.keys(userData).forEach(key => {
                    const input = form.querySelector(`[name="${key}"]`);
                    if (input) {
                        input.value = userData[key];
                    }
                });
            });
        }
    }

    setupValidation() {
        // Custom validators
        this.customValidators = {
            companyName: (value) => value.length >= 2,
            budget: (value) => !isNaN(value.replace(/[,$]/g, '')),
            teamSize: (value) => !isNaN(value) && value > 0
        };
    }

    setupAnalytics() {
        // Track form interactions
        this.forms.forEach((form, type) => {
            // Track form views
            if (this.isInViewport(form)) {
                this.trackEvent('form_view', type);
            }
            
            // Track form starts
            form.addEventListener('focusin', () => {
                if (!form.dataset.started) {
                    form.dataset.started = 'true';
                    this.trackEvent('form_start', type);
                }
            }, { once: true });
            
            // Track field completion
            const inputs = form.querySelectorAll('input, select, textarea');
            inputs.forEach(input => {
                input.addEventListener('change', () => {
                    const completion = this.calculateFormCompletion(form);
                    this.trackEvent('form_progress', type, completion);
                });
            });
        });
    }

    isInViewport(element) {
        const rect = element.getBoundingClientRect();
        return (
            rect.top >= 0 &&
            rect.left >= 0 &&
            rect.bottom <= window.innerHeight &&
            rect.right <= window.innerWidth
        );
    }

    calculateFormCompletion(form) {
        const inputs = form.querySelectorAll('input, select, textarea');
        const filled = Array.from(inputs).filter(input => input.value.trim()).length;
        return Math.round((filled / inputs.length) * 100);
    }

    trackEvent(event, type, value = null) {
        const eventData = {
            event: event,
            formType: type,
            timestamp: new Date().toISOString()
        };
        
        if (value !== null) {
            eventData.value = value;
        }
        
        console.log('Analytics event:', eventData);
    }
}

// Initialize lead capture system
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        window.blazeLeadCapture = new BlazeLeadCapture();
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeLeadCapture;
}