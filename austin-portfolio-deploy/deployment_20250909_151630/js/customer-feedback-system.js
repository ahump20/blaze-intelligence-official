/**
 * Blaze Intelligence Customer Feedback System
 * Comprehensive feedback collection, analysis, and response system
 */

class CustomerFeedbackSystem {
    constructor() {
        this.config = {
            widgets: {
                microSurvey: {
                    enabled: true,
                    position: 'bottom-right',
                    delay: 30000, // 30 seconds after page load
                    frequency: 'once_per_session'
                },
                nps: {
                    enabled: true,
                    schedule: 'quarterly',
                    lastShown: null
                },
                exitIntent: {
                    enabled: true,
                    sensitivity: 20, // pixels from top
                    cooldown: 86400000 // 24 hours
                }
            },
            channels: {
                inApp: true,
                email: true,
                slack: false,
                webhook: null
            },
            storage: {
                local: 'feedback_data',
                session: 'feedback_session',
                api: '/api/feedback'
            },
            analytics: {
                sentiment: true,
                categorization: true,
                priority: true
            }
        };

        this.feedbackQueue = [];
        this.sessionData = {
            startTime: Date.now(),
            pageViews: 0,
            interactions: 0,
            feedbackGiven: false
        };
        
        this.init();
    }

    /**
     * Initialize feedback system
     */
    async init() {
        try {
            // Load saved configuration
            this.loadConfiguration();

            // Set up feedback widgets
            this.setupMicroSurvey();
            this.setupNPSSurvey();
            this.setupExitIntent();
            this.setupInAppFeedback();

            // Initialize event listeners
            this.initializeEventListeners();

            // Load pending feedback
            await this.loadPendingFeedback();

            // Start session tracking
            this.startSessionTracking();

            console.log('✅ Customer feedback system initialized');

        } catch (error) {
            console.error('❌ Feedback system initialization failed:', error);
        }
    }

    /**
     * Set up micro survey widget
     */
    setupMicroSurvey() {
        if (!this.config.widgets.microSurvey.enabled) return;

        // Create micro survey HTML
        const surveyHTML = `
            <div id="micro-survey" class="feedback-widget micro-survey" style="display: none;">
                <div class="survey-header">
                    <span class="survey-title">Quick Feedback</span>
                    <button class="survey-close" onclick="feedbackSystem.closeMicroSurvey()">×</button>
                </div>
                <div class="survey-body">
                    <p class="survey-question">How's your experience so far?</p>
                    <div class="survey-ratings">
                        <button class="rating-btn" data-rating="1">😞</button>
                        <button class="rating-btn" data-rating="2">😕</button>
                        <button class="rating-btn" data-rating="3">😐</button>
                        <button class="rating-btn" data-rating="4">🙂</button>
                        <button class="rating-btn" data-rating="5">😄</button>
                    </div>
                    <textarea class="survey-comment" placeholder="Tell us more (optional)..." style="display: none;"></textarea>
                    <button class="survey-submit" style="display: none;" onclick="feedbackSystem.submitMicroSurvey()">Submit</button>
                </div>
            </div>
        `;

        // Add to page
        document.body.insertAdjacentHTML('beforeend', surveyHTML);

        // Set up rating buttons
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const rating = parseInt(e.target.dataset.rating);
                this.handleRatingClick(rating);
            });
        });

        // Schedule display
        setTimeout(() => {
            this.showMicroSurvey();
        }, this.config.widgets.microSurvey.delay);
    }

    /**
     * Set up NPS survey
     */
    setupNPSSurvey() {
        if (!this.config.widgets.nps.enabled) return;

        // Create NPS survey HTML
        const npsHTML = `
            <div id="nps-survey" class="feedback-widget nps-survey" style="display: none;">
                <div class="nps-container">
                    <button class="nps-close" onclick="feedbackSystem.closeNPS()">×</button>
                    <h3 class="nps-title">How likely are you to recommend Blaze Intelligence?</h3>
                    <div class="nps-scale">
                        ${[...Array(11)].map((_, i) => `
                            <button class="nps-score" data-score="${i}">${i}</button>
                        `).join('')}
                    </div>
                    <div class="nps-labels">
                        <span>Not likely</span>
                        <span>Neutral</span>
                        <span>Very likely</span>
                    </div>
                    <div class="nps-followup" style="display: none;">
                        <textarea class="nps-comment" placeholder="What's the main reason for your score?"></textarea>
                        <button class="nps-submit" onclick="feedbackSystem.submitNPS()">Submit</button>
                    </div>
                </div>
            </div>
        `;

        // Add to page
        document.body.insertAdjacentHTML('beforeend', npsHTML);

        // Set up score buttons
        document.querySelectorAll('.nps-score').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const score = parseInt(e.target.dataset.score);
                this.handleNPSScore(score);
            });
        });

        // Check if should show
        this.checkNPSSchedule();
    }

    /**
     * Set up exit intent detection
     */
    setupExitIntent() {
        if (!this.config.widgets.exitIntent.enabled) return;

        let exitIntentShown = false;

        document.addEventListener('mouseleave', (e) => {
            if (e.clientY <= this.config.widgets.exitIntent.sensitivity && !exitIntentShown) {
                const lastShown = localStorage.getItem('exit_intent_last_shown');
                const now = Date.now();

                if (!lastShown || now - parseInt(lastShown) > this.config.widgets.exitIntent.cooldown) {
                    this.showExitSurvey();
                    exitIntentShown = true;
                    localStorage.setItem('exit_intent_last_shown', now.toString());
                }
            }
        });
    }

    /**
     * Set up in-app feedback button
     */
    setupInAppFeedback() {
        if (!this.config.channels.inApp) return;

        // Create feedback button
        const buttonHTML = `
            <button id="feedback-button" class="feedback-trigger" onclick="feedbackSystem.openFeedbackModal()">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm1 11h-2v-2h2v2zm0-4h-2V5h2v4z"/>
                </svg>
                <span>Feedback</span>
            </button>
        `;

        document.body.insertAdjacentHTML('beforeend', buttonHTML);

        // Create feedback modal
        const modalHTML = `
            <div id="feedback-modal" class="feedback-modal" style="display: none;">
                <div class="modal-content">
                    <div class="modal-header">
                        <h3>Send Us Feedback</h3>
                        <button class="modal-close" onclick="feedbackSystem.closeFeedbackModal()">×</button>
                    </div>
                    <div class="modal-body">
                        <div class="feedback-type">
                            <label>Type:</label>
                            <select id="feedback-type">
                                <option value="bug">Bug Report</option>
                                <option value="feature">Feature Request</option>
                                <option value="improvement">Improvement</option>
                                <option value="praise">Praise</option>
                                <option value="other">Other</option>
                            </select>
                        </div>
                        <div class="feedback-priority">
                            <label>Priority:</label>
                            <select id="feedback-priority">
                                <option value="low">Low</option>
                                <option value="medium">Medium</option>
                                <option value="high">High</option>
                                <option value="critical">Critical</option>
                            </select>
                        </div>
                        <div class="feedback-message">
                            <label>Message:</label>
                            <textarea id="feedback-message" rows="5" placeholder="Describe your feedback..."></textarea>
                        </div>
                        <div class="feedback-contact">
                            <label>
                                <input type="checkbox" id="feedback-followup">
                                I'd like a follow-up response
                            </label>
                            <input type="email" id="feedback-email" placeholder="Your email" style="display: none;">
                        </div>
                        <div class="feedback-attachments">
                            <button onclick="feedbackSystem.captureScreenshot()">📸 Add Screenshot</button>
                            <div id="screenshot-preview"></div>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button class="btn-cancel" onclick="feedbackSystem.closeFeedbackModal()">Cancel</button>
                        <button class="btn-submit" onclick="feedbackSystem.submitFeedback()">Send Feedback</button>
                    </div>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', modalHTML);

        // Handle follow-up checkbox
        document.getElementById('feedback-followup').addEventListener('change', (e) => {
            document.getElementById('feedback-email').style.display = 
                e.target.checked ? 'block' : 'none';
        });
    }

    /**
     * Initialize event listeners
     */
    initializeEventListeners() {
        // Track page views
        let lastUrl = location.href;
        new MutationObserver(() => {
            const url = location.href;
            if (url !== lastUrl) {
                lastUrl = url;
                this.sessionData.pageViews++;
                this.trackPageView();
            }
        }).observe(document, { subtree: true, childList: true });

        // Track interactions
        document.addEventListener('click', () => {
            this.sessionData.interactions++;
        });

        // Listen for errors
        window.addEventListener('error', (event) => {
            this.captureError(event);
        });

        // Listen for unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.captureError(event);
        });
    }

    /**
     * Show micro survey
     */
    showMicroSurvey() {
        if (this.sessionData.feedbackGiven) return;
        
        const survey = document.getElementById('micro-survey');
        if (survey) {
            survey.style.display = 'block';
            this.trackEvent('micro_survey_shown');
        }
    }

    /**
     * Handle rating click
     */
    handleRatingClick(rating) {
        // Store rating
        this.currentRating = rating;

        // Highlight selected rating
        document.querySelectorAll('.rating-btn').forEach(btn => {
            btn.classList.toggle('selected', parseInt(btn.dataset.rating) === rating);
        });

        // Show comment field for low ratings
        const commentField = document.querySelector('.survey-comment');
        const submitBtn = document.querySelector('.survey-submit');
        
        if (rating <= 3) {
            commentField.style.display = 'block';
            submitBtn.style.display = 'block';
            commentField.focus();
        } else {
            // Auto-submit for high ratings
            this.submitMicroSurvey();
        }
    }

    /**
     * Submit micro survey
     */
    async submitMicroSurvey() {
        const comment = document.querySelector('.survey-comment')?.value || '';
        
        const feedback = {
            type: 'micro_survey',
            rating: this.currentRating,
            comment: comment,
            timestamp: Date.now(),
            session: this.sessionData,
            page: window.location.href
        };

        await this.sendFeedback(feedback);
        this.closeMicroSurvey();
        this.showThankYou();
    }

    /**
     * Close micro survey
     */
    closeMicroSurvey() {
        const survey = document.getElementById('micro-survey');
        if (survey) {
            survey.style.display = 'none';
        }
    }

    /**
     * Check NPS schedule
     */
    checkNPSSchedule() {
        const lastShown = localStorage.getItem('nps_last_shown');
        const now = Date.now();
        const quarterlyMs = 90 * 24 * 60 * 60 * 1000; // 90 days

        if (!lastShown || now - parseInt(lastShown) > quarterlyMs) {
            // Schedule NPS for this session
            setTimeout(() => {
                this.showNPSSurvey();
            }, 60000); // Show after 1 minute
        }
    }

    /**
     * Show NPS survey
     */
    showNPSSurvey() {
        const survey = document.getElementById('nps-survey');
        if (survey) {
            survey.style.display = 'flex';
            this.trackEvent('nps_survey_shown');
        }
    }

    /**
     * Handle NPS score selection
     */
    handleNPSScore(score) {
        this.npsScore = score;

        // Highlight selected score
        document.querySelectorAll('.nps-score').forEach(btn => {
            btn.classList.toggle('selected', parseInt(btn.dataset.score) === score);
        });

        // Show follow-up
        document.querySelector('.nps-followup').style.display = 'block';
        document.querySelector('.nps-comment').focus();
    }

    /**
     * Submit NPS survey
     */
    async submitNPS() {
        const comment = document.querySelector('.nps-comment')?.value || '';
        
        const feedback = {
            type: 'nps',
            score: this.npsScore,
            comment: comment,
            category: this.categorizeNPS(this.npsScore),
            timestamp: Date.now(),
            session: this.sessionData
        };

        await this.sendFeedback(feedback);
        this.closeNPS();
        localStorage.setItem('nps_last_shown', Date.now().toString());
        this.showThankYou();
    }

    /**
     * Categorize NPS score
     */
    categorizeNPS(score) {
        if (score >= 9) return 'promoter';
        if (score >= 7) return 'passive';
        return 'detractor';
    }

    /**
     * Close NPS survey
     */
    closeNPS() {
        const survey = document.getElementById('nps-survey');
        if (survey) {
            survey.style.display = 'none';
        }
    }

    /**
     * Show exit survey
     */
    showExitSurvey() {
        const surveyHTML = `
            <div id="exit-survey" class="feedback-widget exit-survey">
                <div class="exit-header">
                    <h3>Before you go...</h3>
                    <button onclick="feedbackSystem.closeExitSurvey()">×</button>
                </div>
                <div class="exit-body">
                    <p>What made you want to leave?</p>
                    <div class="exit-reasons">
                        <label><input type="radio" name="exit-reason" value="not-what-expected"> Not what I expected</label>
                        <label><input type="radio" name="exit-reason" value="too-expensive"> Too expensive</label>
                        <label><input type="radio" name="exit-reason" value="found-alternative"> Found an alternative</label>
                        <label><input type="radio" name="exit-reason" value="just-browsing"> Just browsing</label>
                        <label><input type="radio" name="exit-reason" value="technical-issues"> Technical issues</label>
                        <label><input type="radio" name="exit-reason" value="other"> Other</label>
                    </div>
                    <textarea class="exit-comment" placeholder="Any additional feedback?" style="display: none;"></textarea>
                    <button class="exit-submit" onclick="feedbackSystem.submitExitSurvey()">Submit</button>
                </div>
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', surveyHTML);

        // Handle reason selection
        document.querySelectorAll('input[name="exit-reason"]').forEach(input => {
            input.addEventListener('change', (e) => {
                const comment = document.querySelector('.exit-comment');
                comment.style.display = e.target.value === 'other' ? 'block' : 'none';
            });
        });

        this.trackEvent('exit_survey_shown');
    }

    /**
     * Submit exit survey
     */
    async submitExitSurvey() {
        const reason = document.querySelector('input[name="exit-reason"]:checked')?.value;
        const comment = document.querySelector('.exit-comment')?.value || '';

        if (!reason) return;

        const feedback = {
            type: 'exit_intent',
            reason: reason,
            comment: comment,
            timestamp: Date.now(),
            session: this.sessionData,
            page: window.location.href
        };

        await this.sendFeedback(feedback);
        this.closeExitSurvey();
    }

    /**
     * Close exit survey
     */
    closeExitSurvey() {
        const survey = document.getElementById('exit-survey');
        if (survey) {
            survey.remove();
        }
    }

    /**
     * Open feedback modal
     */
    openFeedbackModal() {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.style.display = 'flex';
            this.trackEvent('feedback_modal_opened');
        }
    }

    /**
     * Close feedback modal
     */
    closeFeedbackModal() {
        const modal = document.getElementById('feedback-modal');
        if (modal) {
            modal.style.display = 'none';
        }
    }

    /**
     * Submit detailed feedback
     */
    async submitFeedback() {
        const type = document.getElementById('feedback-type').value;
        const priority = document.getElementById('feedback-priority').value;
        const message = document.getElementById('feedback-message').value;
        const followup = document.getElementById('feedback-followup').checked;
        const email = document.getElementById('feedback-email').value;

        if (!message) {
            alert('Please enter a message');
            return;
        }

        const feedback = {
            type: 'detailed',
            category: type,
            priority: priority,
            message: message,
            followup: followup,
            email: email,
            screenshot: this.currentScreenshot || null,
            timestamp: Date.now(),
            session: this.sessionData,
            page: window.location.href,
            userAgent: navigator.userAgent
        };

        await this.sendFeedback(feedback);
        this.closeFeedbackModal();
        this.showThankYou();
    }

    /**
     * Capture screenshot
     */
    async captureScreenshot() {
        try {
            // Use html2canvas if available
            if (typeof html2canvas !== 'undefined') {
                const canvas = await html2canvas(document.body);
                this.currentScreenshot = canvas.toDataURL();
                
                // Show preview
                const preview = document.getElementById('screenshot-preview');
                if (preview) {
                    preview.innerHTML = `<img src="${this.currentScreenshot}" alt="Screenshot" style="max-width: 200px;">`;
                }
            } else {
                console.warn('Screenshot library not loaded');
            }
        } catch (error) {
            console.error('Screenshot capture failed:', error);
        }
    }

    /**
     * Capture error
     */
    captureError(event) {
        const feedback = {
            type: 'error',
            category: 'automatic',
            priority: 'high',
            message: event.message || event.reason || 'Unknown error',
            error: {
                message: event.message,
                stack: event.error?.stack,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno
            },
            timestamp: Date.now(),
            session: this.sessionData,
            page: window.location.href,
            userAgent: navigator.userAgent
        };

        this.queueFeedback(feedback);
    }

    /**
     * Send feedback to server
     */
    async sendFeedback(feedback) {
        try {
            // Add sentiment analysis if enabled
            if (this.config.analytics.sentiment && feedback.message) {
                feedback.sentiment = this.analyzeSentiment(feedback.message);
            }

            // Add categorization if enabled
            if (this.config.analytics.categorization) {
                feedback.autoCategory = this.categorizeFeedback(feedback);
            }

            // Add priority scoring if enabled
            if (this.config.analytics.priority) {
                feedback.priorityScore = this.calculatePriority(feedback);
            }

            // Send to API
            const response = await fetch(this.config.storage.api, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(feedback)
            });

            if (!response.ok) {
                throw new Error('Failed to send feedback');
            }

            // Mark feedback as given
            this.sessionData.feedbackGiven = true;

            // Track event
            this.trackEvent('feedback_submitted', {
                type: feedback.type,
                category: feedback.category
            });

            // Store locally as backup
            this.storeFeedbackLocally(feedback);

            return true;

        } catch (error) {
            console.error('Failed to send feedback:', error);
            
            // Queue for retry
            this.queueFeedback(feedback);
            
            return false;
        }
    }

    /**
     * Queue feedback for retry
     */
    queueFeedback(feedback) {
        this.feedbackQueue.push(feedback);
        
        // Store in localStorage
        localStorage.setItem('feedback_queue', JSON.stringify(this.feedbackQueue));
        
        // Schedule retry
        setTimeout(() => this.retryQueuedFeedback(), 30000);
    }

    /**
     * Retry queued feedback
     */
    async retryQueuedFeedback() {
        if (this.feedbackQueue.length === 0) return;

        const queue = [...this.feedbackQueue];
        this.feedbackQueue = [];

        for (const feedback of queue) {
            const success = await this.sendFeedback(feedback);
            if (!success) {
                break; // Stop retrying if still failing
            }
        }
    }

    /**
     * Analyze sentiment
     */
    analyzeSentiment(text) {
        // Simple sentiment analysis
        const positive = ['great', 'awesome', 'excellent', 'love', 'perfect', 'amazing'];
        const negative = ['bad', 'terrible', 'hate', 'awful', 'horrible', 'worst'];
        
        const lowerText = text.toLowerCase();
        let score = 0;

        positive.forEach(word => {
            if (lowerText.includes(word)) score++;
        });

        negative.forEach(word => {
            if (lowerText.includes(word)) score--;
        });

        if (score > 0) return 'positive';
        if (score < 0) return 'negative';
        return 'neutral';
    }

    /**
     * Categorize feedback automatically
     */
    categorizeFeedback(feedback) {
        const keywords = {
            bug: ['error', 'broken', 'not working', 'crash', 'fail'],
            feature: ['add', 'need', 'want', 'would be nice', 'request'],
            performance: ['slow', 'fast', 'speed', 'loading', 'lag'],
            ui: ['design', 'layout', 'color', 'font', 'button'],
            pricing: ['price', 'cost', 'expensive', 'cheap', 'value']
        };

        const text = (feedback.message || '').toLowerCase();
        
        for (const [category, words] of Object.entries(keywords)) {
            if (words.some(word => text.includes(word))) {
                return category;
            }
        }

        return 'general';
    }

    /**
     * Calculate priority score
     */
    calculatePriority(feedback) {
        let score = 0;

        // Type weight
        const typeWeights = {
            error: 10,
            bug: 8,
            critical: 10,
            high: 7,
            medium: 5,
            low: 3
        };

        score += typeWeights[feedback.type] || 5;
        score += typeWeights[feedback.priority] || 5;

        // Sentiment weight
        if (feedback.sentiment === 'negative') score += 3;

        // User session weight
        if (this.sessionData.interactions > 10) score += 2;
        if (this.sessionData.pageViews > 5) score += 1;

        return Math.min(score, 20); // Cap at 20
    }

    /**
     * Show thank you message
     */
    showThankYou() {
        const thankYouHTML = `
            <div id="thank-you" class="feedback-thank-you">
                ✅ Thank you for your feedback!
            </div>
        `;

        document.body.insertAdjacentHTML('beforeend', thankYouHTML);

        setTimeout(() => {
            const element = document.getElementById('thank-you');
            if (element) element.remove();
        }, 3000);
    }

    /**
     * Track event
     */
    trackEvent(eventName, data = {}) {
        if (window.blazeAnalytics) {
            window.blazeAnalytics.track(eventName, {
                ...data,
                timestamp: Date.now(),
                session: this.sessionData
            });
        }
    }

    /**
     * Track page view
     */
    trackPageView() {
        this.trackEvent('page_view', {
            url: window.location.href,
            referrer: document.referrer
        });
    }

    /**
     * Load configuration
     */
    loadConfiguration() {
        const saved = localStorage.getItem('feedback_config');
        if (saved) {
            try {
                const config = JSON.parse(saved);
                this.config = { ...this.config, ...config };
            } catch (error) {
                console.error('Failed to load feedback config:', error);
            }
        }
    }

    /**
     * Store feedback locally
     */
    storeFeedbackLocally(feedback) {
        try {
            const stored = localStorage.getItem(this.config.storage.local) || '[]';
            const feedbackArray = JSON.parse(stored);
            feedbackArray.push(feedback);
            
            // Keep only last 50 items
            if (feedbackArray.length > 50) {
                feedbackArray.shift();
            }
            
            localStorage.setItem(this.config.storage.local, JSON.stringify(feedbackArray));
        } catch (error) {
            console.error('Failed to store feedback locally:', error);
        }
    }

    /**
     * Load pending feedback
     */
    async loadPendingFeedback() {
        const queue = localStorage.getItem('feedback_queue');
        if (queue) {
            try {
                this.feedbackQueue = JSON.parse(queue);
                if (this.feedbackQueue.length > 0) {
                    await this.retryQueuedFeedback();
                }
            } catch (error) {
                console.error('Failed to load feedback queue:', error);
            }
        }
    }

    /**
     * Start session tracking
     */
    startSessionTracking() {
        // Track session duration
        setInterval(() => {
            this.sessionData.duration = Date.now() - this.sessionData.startTime;
        }, 10000);

        // Save session data
        sessionStorage.setItem(this.config.storage.session, JSON.stringify(this.sessionData));
    }
}

// Initialize feedback system when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.feedbackSystem = new CustomerFeedbackSystem();
    });
} else {
    window.feedbackSystem = new CustomerFeedbackSystem();
}

// Add styles
const styles = `
<style>
.feedback-widget {
    position: fixed;
    z-index: 10000;
    font-family: 'Inter', system-ui, sans-serif;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    border-radius: 12px;
    background: white;
    animation: slideIn 0.3s ease;
}

.micro-survey {
    bottom: 20px;
    right: 20px;
    width: 320px;
    padding: 16px;
}

.survey-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
}

.survey-close {
    background: none;
    border: none;
    font-size: 24px;
    cursor: pointer;
    color: #666;
}

.survey-ratings {
    display: flex;
    justify-content: space-between;
    margin: 16px 0;
}

.rating-btn {
    background: none;
    border: 2px solid #e0e0e0;
    border-radius: 8px;
    padding: 8px;
    font-size: 24px;
    cursor: pointer;
    transition: all 0.2s;
}

.rating-btn:hover {
    border-color: #BF5700;
    transform: scale(1.1);
}

.rating-btn.selected {
    border-color: #BF5700;
    background: #FFF4E6;
}

.nps-survey {
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    width: 500px;
    padding: 24px;
}

.nps-scale {
    display: flex;
    justify-content: space-between;
    margin: 20px 0;
}

.nps-score {
    width: 40px;
    height: 40px;
    border: 2px solid #e0e0e0;
    background: white;
    border-radius: 4px;
    cursor: pointer;
    transition: all 0.2s;
}

.nps-score:hover {
    border-color: #BF5700;
    transform: scale(1.1);
}

.nps-score.selected {
    background: #BF5700;
    color: white;
    border-color: #BF5700;
}

.feedback-trigger {
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: #BF5700;
    color: white;
    border: none;
    border-radius: 24px;
    padding: 12px 20px;
    display: flex;
    align-items: center;
    gap: 8px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(191, 87, 0, 0.3);
    transition: transform 0.2s;
}

.feedback-trigger:hover {
    transform: scale(1.05);
}

.feedback-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10001;
}

.modal-content {
    background: white;
    border-radius: 12px;
    width: 500px;
    max-width: 90%;
    max-height: 80vh;
    overflow-y: auto;
}

.modal-header {
    padding: 20px;
    border-bottom: 1px solid #e0e0e0;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.modal-body {
    padding: 20px;
}

.modal-body > div {
    margin-bottom: 16px;
}

.modal-body label {
    display: block;
    margin-bottom: 4px;
    font-weight: 500;
}

.modal-body select,
.modal-body textarea,
.modal-body input[type="email"] {
    width: 100%;
    padding: 8px 12px;
    border: 1px solid #e0e0e0;
    border-radius: 6px;
    font-size: 14px;
}

.modal-footer {
    padding: 16px 20px;
    border-top: 1px solid #e0e0e0;
    display: flex;
    justify-content: flex-end;
    gap: 12px;
}

.btn-cancel {
    padding: 8px 16px;
    border: 1px solid #e0e0e0;
    background: white;
    border-radius: 6px;
    cursor: pointer;
}

.btn-submit {
    padding: 8px 16px;
    background: #BF5700;
    color: white;
    border: none;
    border-radius: 6px;
    cursor: pointer;
}

.feedback-thank-you {
    position: fixed;
    top: 20px;
    right: 20px;
    background: #4CAF50;
    color: white;
    padding: 12px 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(76, 175, 80, 0.3);
    animation: slideIn 0.3s ease;
    z-index: 10002;
}

@keyframes slideIn {
    from {
        opacity: 0;
        transform: translateY(20px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', styles);

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CustomerFeedbackSystem;
}