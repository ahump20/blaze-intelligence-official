/**
 * Blaze Intelligence Automated Lead Qualification System
 * Intelligent lead scoring, routing, and automated follow-up
 */

class BlazeLeadQualificationSystem {
    constructor(config = {}) {
        this.config = {
            apiEndpoint: 'https://api.blaze-intelligence.com/leads',
            hubspotApiKey: config.hubspotApiKey || null,
            slackWebhookUrl: config.slackWebhookUrl || null,
            emailApiKey: config.emailApiKey || null,
            debugMode: config.debugMode || false,
            autoScoring: true,
            autoRouting: true,
            autoFollowup: true,
            ...config
        };
        
        this.scoreWeights = {
            // Company/Organization factors
            organizationType: {
                'Professional Sports Team': 100,
                'NCAA Division I': 85,
                'Sports Technology Company': 80,
                'Sports Analytics Firm': 90,
                'NCAA Division II/III': 70,
                'High School': 45,
                'Youth Organization': 35,
                'Individual Coach': 25,
                'Other': 10
            },
            
            // Role/Title factors
            jobTitle: {
                'General Manager': 100,
                'VP of Analytics': 95,
                'Director of Analytics': 90,
                'Head Coach': 85,
                'Assistant Coach': 70,
                'Sports Scientist': 80,
                'Performance Director': 85,
                'Technology Director': 75,
                'Data Analyst': 60,
                'Consultant': 55,
                'Student': 20,
                'Other': 30
            },
            
            // Budget indicators
            budgetRange: {
                '$500K+': 100,
                '$250K - $500K': 90,
                '$100K - $250K': 80,
                '$50K - $100K': 65,
                '$25K - $50K': 45,
                '$10K - $25K': 30,
                'Under $10K': 15,
                'Not specified': 40
            },
            
            // Timeline urgency
            implementationTimeline: {
                'Immediate (0-30 days)': 100,
                'This Quarter (1-3 months)': 85,
                'Next Quarter (3-6 months)': 70,
                'Next Year (6-12 months)': 50,
                'Future Planning (12+ months)': 25,
                'Not specified': 40
            },
            
            // Engagement level
            engagementScore: {
                'Requested Demo': 40,
                'Downloaded Materials': 25,
                'Visited Multiple Pages': 20,
                'Spent 5+ Minutes': 15,
                'Shared Contact Info': 35,
                'Asked Specific Questions': 30,
                'Mentioned Specific Use Case': 25,
                'Provided Company Details': 20
            },
            
            // Pain point severity
            currentChallenges: {
                'High injury rates': 30,
                'Poor draft performance': 25,
                'Outdated analytics': 20,
                'Lack of predictive insights': 25,
                'Budget constraints from injuries': 35,
                'Competitive disadvantage': 20,
                'Manual processes': 15,
                'Data integration issues': 20
            }
        };
        
        this.leadCategories = {
            'HOT': { min: 350, priority: 1, responseTime: '15 minutes' },
            'WARM': { min: 250, priority: 2, responseTime: '2 hours' },
            'COLD': { min: 150, priority: 3, responseTime: '24 hours' },
            'NURTURE': { min: 0, priority: 4, responseTime: '72 hours' }
        };
        
        this.init();
    }
    
    init() {
        this.setupFormHandlers();
        this.setupChatIntegration();
        this.initializeStorage();
        
        if (this.config.debugMode) {
            console.log('Blaze Lead Qualification System initialized');
        }
    }
    
    setupFormHandlers() {
        // Monitor all forms for lead capture
        document.addEventListener('submit', (e) => {
            const form = e.target;
            if (form.matches('.contact-form, .demo-request-form, .trial-form')) {
                this.captureFormLead(form, e);
            }
        });
        
        // Monitor demo button clicks
        document.addEventListener('click', (e) => {
            if (e.target.matches('.demo-btn, .request-demo, [data-demo]')) {
                this.trackDemoInterest(e.target);
            }
        });
        
        // Monitor calculator usage
        document.addEventListener('change', (e) => {
            if (e.target.closest('.roi-calculator')) {
                this.trackCalculatorEngagement();
            }
        });
    }
    
    setupChatIntegration() {
        // Integration point for live chat systems
        window.BlazeChat = window.BlazeChat || {};
        window.BlazeChat.onMessage = (message, userInfo) => {
            this.processChatLead(message, userInfo);
        };
    }
    
    initializeStorage() {
        this.storage = {
            leads: JSON.parse(localStorage.getItem('blaze_leads') || '[]'),
            interactions: JSON.parse(localStorage.getItem('blaze_interactions') || '[]'),
            scores: JSON.parse(localStorage.getItem('blaze_scores') || '{}')
        };
    }
    
    captureFormLead(form, event) {
        const formData = new FormData(form);
        const leadData = {
            id: this.generateLeadId(),
            timestamp: new Date().toISOString(),
            source: 'website_form',
            formType: form.className,
            
            // Contact Information
            name: formData.get('name') || formData.get('fullName') || '',
            email: formData.get('email') || '',
            phone: formData.get('phone') || '',
            company: formData.get('company') || formData.get('organization') || '',
            
            // Qualification Data
            jobTitle: formData.get('jobTitle') || formData.get('role') || '',
            organizationType: formData.get('organizationType') || formData.get('orgType') || '',
            teamSize: formData.get('teamSize') || '',
            budgetRange: formData.get('budget') || formData.get('budgetRange') || '',
            implementationTimeline: formData.get('timeline') || formData.get('timeframe') || '',
            currentChallenges: this.extractChallenges(formData),
            specificNeeds: formData.get('needs') || formData.get('requirements') || '',
            sport: formData.get('sport') || formData.get('primarySport') || '',
            
            // Engagement Data
            pageUrl: window.location.href,
            referrer: document.referrer,
            sessionData: this.getSessionData(),
            
            // Message/Comments
            message: formData.get('message') || formData.get('comments') || formData.get('description') || ''
        };
        
        // Score the lead
        leadData.score = this.scoreLead(leadData);
        leadData.category = this.categorizeLead(leadData.score);
        
        // Process the lead
        this.processLead(leadData);
        
        // Track analytics
        this.trackLeadCapture(leadData);
        
        if (this.config.debugMode) {
            console.log('Lead captured:', leadData);
        }
    }
    
    extractChallenges(formData) {
        const challenges = [];
        
        // Check for challenge checkboxes or multi-select
        for (let [key, value] of formData.entries()) {
            if (key.includes('challenge') && value) {
                challenges.push(value);
            }
        }
        
        // Check for pain points in text fields
        const painPointKeywords = [
            'injury', 'injuries', 'hurt', 'injured',
            'draft', 'recruiting', 'talent', 'scouting',
            'analytics', 'data', 'insights', 'reporting',
            'predictive', 'prediction', 'forecast',
            'budget', 'cost', 'expensive', 'roi',
            'competition', 'competitive', 'advantage',
            'manual', 'outdated', 'legacy', 'integration'
        ];
        
        const message = (formData.get('message') || '').toLowerCase();
        painPointKeywords.forEach(keyword => {
            if (message.includes(keyword)) {
                challenges.push(keyword);
            }
        });
        
        return challenges;
    }
    
    scoreLead(leadData) {
        let score = 0;
        
        // Organization type scoring
        score += this.scoreWeights.organizationType[leadData.organizationType] || 0;
        
        // Job title scoring
        score += this.scoreWeights.jobTitle[leadData.jobTitle] || 0;
        
        // Budget scoring
        score += this.scoreWeights.budgetRange[leadData.budgetRange] || 0;
        
        // Timeline scoring
        score += this.scoreWeights.implementationTimeline[leadData.implementationTimeline] || 0;
        
        // Engagement scoring
        const engagementPoints = this.calculateEngagementScore(leadData);
        score += engagementPoints;
        
        // Challenge/pain point scoring
        const challengePoints = this.calculateChallengeScore(leadData.currentChallenges);
        score += challengePoints;
        
        // Bonus points for complete information
        if (leadData.name && leadData.email && leadData.company && leadData.jobTitle) {
            score += 50; // Completeness bonus
        }
        
        // Bonus for specific sports focus
        if (['baseball', 'football', 'basketball'].includes(leadData.sport.toLowerCase())) {
            score += 25;
        }
        
        return Math.round(score);
    }
    
    calculateEngagementScore(leadData) {
        let score = 0;
        
        // Session engagement
        if (leadData.sessionData.timeOnSite > 300) score += 20; // 5+ minutes
        if (leadData.sessionData.pagesViewed > 3) score += 15;
        if (leadData.sessionData.demoClicked) score += 30;
        if (leadData.sessionData.calculatorUsed) score += 25;
        if (leadData.sessionData.videoWatched) score += 20;
        
        // Form completeness
        if (leadData.phone) score += 15;
        if (leadData.specificNeeds) score += 20;
        if (leadData.message && leadData.message.length > 50) score += 25;
        
        return score;
    }
    
    calculateChallengeScore(challenges) {
        let score = 0;
        
        challenges.forEach(challenge => {
            Object.keys(this.scoreWeights.currentChallenges).forEach(pain => {
                if (challenge.toLowerCase().includes(pain.toLowerCase().split(' ')[0])) {
                    score += this.scoreWeights.currentChallenges[pain];
                }
            });
        });
        
        return Math.min(score, 100); // Cap challenge scoring
    }
    
    categorizeLead(score) {
        for (const [category, config] of Object.entries(this.leadCategories)) {
            if (score >= config.min) {
                return category;
            }
        }
        return 'NURTURE';
    }
    
    processLead(leadData) {
        // Store lead
        this.storage.leads.push(leadData);
        this.saveToStorage();
        
        // Route lead based on category
        this.routeLead(leadData);
        
        // Trigger automated follow-up
        if (this.config.autoFollowup) {
            this.scheduleFollowUp(leadData);
        }
        
        // Send notifications
        this.sendNotifications(leadData);
    }
    
    routeLead(leadData) {
        const category = leadData.category;
        const config = this.leadCategories[category];
        
        // Immediate routing for hot leads
        if (category === 'HOT') {
            this.createUrgentAlert(leadData);
            this.scheduleImmediateResponse(leadData);
        }
        
        // Create CRM entry
        if (this.config.hubspotApiKey) {
            this.createHubSpotContact(leadData);
        }
        
        // Update internal tracking
        this.updateLeadTracking(leadData, category, config);
    }
    
    scheduleFollowUp(leadData) {
        const category = leadData.category;
        const responseTime = this.leadCategories[category].responseTime;
        
        // Calculate follow-up timing
        const followUpTimes = this.calculateFollowUpSchedule(responseTime);
        
        // Create follow-up sequence
        const sequence = this.createFollowUpSequence(leadData, category);
        
        // Schedule emails/tasks
        sequence.forEach((followUp, index) => {
            setTimeout(() => {
                this.executeFollowUp(followUp, leadData);
            }, followUpTimes[index]);
        });
    }
    
    createFollowUpSequence(leadData, category) {
        const sequences = {
            'HOT': [
                {
                    type: 'immediate_response',
                    template: 'hot_lead_immediate',
                    delay: 0
                },
                {
                    type: 'calendar_invite',
                    template: 'demo_scheduling',
                    delay: 15 * 60 * 1000 // 15 minutes
                },
                {
                    type: 'follow_up_call',
                    template: 'hot_lead_call',
                    delay: 60 * 60 * 1000 // 1 hour
                }
            ],
            'WARM': [
                {
                    type: 'welcome_email',
                    template: 'warm_lead_welcome',
                    delay: 0
                },
                {
                    type: 'demo_invite',
                    template: 'demo_invitation',
                    delay: 2 * 60 * 60 * 1000 // 2 hours
                },
                {
                    type: 'follow_up',
                    template: 'warm_lead_follow_up',
                    delay: 24 * 60 * 60 * 1000 // 24 hours
                }
            ],
            'COLD': [
                {
                    type: 'nurture_email',
                    template: 'cold_lead_nurture',
                    delay: 0
                },
                {
                    type: 'educational_content',
                    template: 'educational_series',
                    delay: 3 * 24 * 60 * 60 * 1000 // 3 days
                }
            ],
            'NURTURE': [
                {
                    type: 'newsletter_signup',
                    template: 'nurture_newsletter',
                    delay: 0
                },
                {
                    type: 'monthly_update',
                    template: 'monthly_insights',
                    delay: 30 * 24 * 60 * 60 * 1000 // 30 days
                }
            ]
        };
        
        return sequences[category] || sequences['NURTURE'];
    }
    
    sendNotifications(leadData) {
        const category = leadData.category;
        
        // Slack notification for high-value leads
        if (category === 'HOT' || category === 'WARM') {
            this.sendSlackNotification(leadData);
        }
        
        // Email notification to sales team
        if (category === 'HOT') {
            this.sendSalesAlert(leadData);
        }
        
        // Dashboard update
        this.updateDashboard(leadData);
    }
    
    sendSlackNotification(leadData) {
        if (!this.config.slackWebhookUrl) return;
        
        const color = leadData.category === 'HOT' ? 'danger' : 'warning';
        const emoji = leadData.category === 'HOT' ? '🔥' : '⚡';
        
        const payload = {
            text: `${emoji} New ${leadData.category} Lead: ${leadData.name}`,
            attachments: [{
                color: color,
                fields: [
                    {
                        title: 'Contact',
                        value: `${leadData.name}\n${leadData.email}\n${leadData.company}`,
                        short: true
                    },
                    {
                        title: 'Details',
                        value: `Score: ${leadData.score}\nRole: ${leadData.jobTitle}\nTimeline: ${leadData.implementationTimeline}`,
                        short: true
                    },
                    {
                        title: 'Message',
                        value: leadData.message || 'No message provided',
                        short: false
                    }
                ],
                actions: [{
                    type: 'button',
                    text: 'View Lead',
                    url: `${this.config.crmUrl}/leads/${leadData.id}`
                }]
            }]
        };
        
        fetch(this.config.slackWebhookUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        }).catch(error => {
            console.error('Failed to send Slack notification:', error);
        });
    }
    
    createHubSpotContact(leadData) {
        if (!this.config.hubspotApiKey) return;
        
        const hubspotData = {
            properties: {
                firstname: leadData.name.split(' ')[0],
                lastname: leadData.name.split(' ').slice(1).join(' '),
                email: leadData.email,
                phone: leadData.phone,
                company: leadData.company,
                jobtitle: leadData.jobTitle,
                lead_score: leadData.score,
                lead_category: leadData.category,
                lead_source: leadData.source,
                organization_type: leadData.organizationType,
                budget_range: leadData.budgetRange,
                implementation_timeline: leadData.implementationTimeline,
                primary_sport: leadData.sport,
                specific_needs: leadData.specificNeeds,
                current_challenges: leadData.currentChallenges.join(', '),
                initial_message: leadData.message
            }
        };
        
        fetch(`https://api.hubapi.com/crm/v3/objects/contacts?hapikey=${this.config.hubspotApiKey}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(hubspotData)
        }).then(response => response.json())
        .then(data => {
            if (this.config.debugMode) {
                console.log('HubSpot contact created:', data);
            }
        }).catch(error => {
            console.error('Failed to create HubSpot contact:', error);
        });
    }
    
    getSessionData() {
        // Collect session data for lead scoring
        return {
            timeOnSite: this.calculateTimeOnSite(),
            pagesViewed: this.getPagesViewed(),
            demoClicked: localStorage.getItem('blaze_demo_clicked') === 'true',
            calculatorUsed: localStorage.getItem('blaze_calculator_used') === 'true',
            videoWatched: localStorage.getItem('blaze_video_watched') === 'true',
            utmSource: this.getUrlParameter('utm_source'),
            utmMedium: this.getUrlParameter('utm_medium'),
            utmCampaign: this.getUrlParameter('utm_campaign')
        };
    }
    
    calculateTimeOnSite() {
        const sessionStart = localStorage.getItem('blaze_session_start');
        if (sessionStart) {
            return Date.now() - parseInt(sessionStart);
        }
        return 0;
    }
    
    getPagesViewed() {
        const pagesViewed = JSON.parse(localStorage.getItem('blaze_pages_viewed') || '[]');
        return pagesViewed.length;
    }
    
    getUrlParameter(param) {
        const urlParams = new URLSearchParams(window.location.search);
        return urlParams.get(param) || '';
    }
    
    generateLeadId() {
        return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    saveToStorage() {
        localStorage.setItem('blaze_leads', JSON.stringify(this.storage.leads));
        localStorage.setItem('blaze_interactions', JSON.stringify(this.storage.interactions));
        localStorage.setItem('blaze_scores', JSON.stringify(this.storage.scores));
    }
    
    trackLeadCapture(leadData) {
        // Track in analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'lead_capture', {
                'event_category': 'leads',
                'event_label': leadData.category,
                'value': leadData.score,
                'custom_map': {
                    'lead_score': leadData.score,
                    'lead_category': leadData.category,
                    'organization_type': leadData.organizationType,
                    'job_title': leadData.jobTitle
                }
            });
        }
        
        // Track in Blaze analytics
        if (window.BlazeAnalytics) {
            window.BlazeAnalytics.track('lead_qualified', {
                'lead_id': leadData.id,
                'lead_score': leadData.score,
                'lead_category': leadData.category,
                'source': leadData.source,
                'organization_type': leadData.organizationType
            });
        }
    }
    
    trackDemoInterest(element) {
        localStorage.setItem('blaze_demo_clicked', 'true');
        
        // Track high-intent engagement
        if (window.BlazeAnalytics) {
            window.BlazeAnalytics.track('demo_interest', {
                'button_text': element.textContent.trim(),
                'page_url': window.location.pathname,
                'timestamp': new Date().toISOString()
            });
        }
    }
    
    trackCalculatorEngagement() {
        localStorage.setItem('blaze_calculator_used', 'true');
        
        if (window.BlazeAnalytics) {
            window.BlazeAnalytics.track('calculator_engagement', {
                'page_url': window.location.pathname,
                'timestamp': new Date().toISOString()
            });
        }
    }
    
    processChatLead(message, userInfo) {
        // Process leads from chat interactions
        const leadData = {
            id: this.generateLeadId(),
            timestamp: new Date().toISOString(),
            source: 'live_chat',
            name: userInfo.name || 'Chat User',
            email: userInfo.email || '',
            message: message,
            sessionData: this.getSessionData()
        };
        
        // Basic scoring for chat leads
        leadData.score = this.scoreChatLead(message, userInfo);
        leadData.category = this.categorizeLead(leadData.score);
        
        this.processLead(leadData);
    }
    
    scoreChatLead(message, userInfo) {
        let score = 50; // Base chat score
        
        // High-intent keywords
        const highIntentKeywords = ['demo', 'price', 'cost', 'buy', 'purchase', 'trial', 'meeting', 'call'];
        const mediumIntentKeywords = ['features', 'how', 'when', 'what', 'why', 'help'];
        
        const lowerMessage = message.toLowerCase();
        
        highIntentKeywords.forEach(keyword => {
            if (lowerMessage.includes(keyword)) score += 30;
        });
        
        mediumIntentKeywords.forEach(keyword => {
            if (lowerMessage.includes(keyword)) score += 15;
        });
        
        // User info bonus
        if (userInfo.email) score += 40;
        if (userInfo.company) score += 30;
        if (userInfo.phone) score += 20;
        
        return score;
    }
    
    // Public API methods
    getLeadById(leadId) {
        return this.storage.leads.find(lead => lead.id === leadId);
    }
    
    getLeadsByCategory(category) {
        return this.storage.leads.filter(lead => lead.category === category);
    }
    
    getLeadStats() {
        const stats = {
            total: this.storage.leads.length,
            hot: 0,
            warm: 0,
            cold: 0,
            nurture: 0,
            averageScore: 0
        };
        
        let totalScore = 0;
        
        this.storage.leads.forEach(lead => {
            stats[lead.category.toLowerCase()]++;
            totalScore += lead.score;
        });
        
        stats.averageScore = stats.total > 0 ? Math.round(totalScore / stats.total) : 0;
        
        return stats;
    }
    
    exportLeads() {
        return {
            leads: this.storage.leads,
            stats: this.getLeadStats(),
            exportDate: new Date().toISOString()
        };
    }
}

// Initialize the system when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize with configuration
    window.BlazeLeadSystem = new BlazeLeadQualificationSystem({
        debugMode: false, // Set to true for development
        autoScoring: true,
        autoRouting: true,
        autoFollowup: true
        // Add API keys in production:
        // hubspotApiKey: 'your_hubspot_key',
        // slackWebhookUrl: 'your_slack_webhook',
        // emailApiKey: 'your_email_service_key'
    });
    
    // Initialize session tracking
    if (!localStorage.getItem('blaze_session_start')) {
        localStorage.setItem('blaze_session_start', Date.now().toString());
        localStorage.setItem('blaze_pages_viewed', JSON.stringify([window.location.pathname]));
    } else {
        const pagesViewed = JSON.parse(localStorage.getItem('blaze_pages_viewed') || '[]');
        if (!pagesViewed.includes(window.location.pathname)) {
            pagesViewed.push(window.location.pathname);
            localStorage.setItem('blaze_pages_viewed', JSON.stringify(pagesViewed));
        }
    }
    
    console.log('Blaze Lead Qualification System initialized');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeLeadQualificationSystem;
}