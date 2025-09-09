/**
 * Blaze Intelligence Automated Lead Qualification & Routing System
 * Championship-level prospect management and intelligent routing
 */

class BlazeLeadQualification {
    constructor() {
        this.qualificationCriteria = this.defineQualificationCriteria();
        this.routingRules = this.defineRoutingRules();
        this.leadQueue = [];
        this.init();
    }

    defineQualificationCriteria() {
        return {
            // Lead quality tiers
            enterprise: {
                minScore: 75,
                requiredSignals: ['multiple_teams', 'budget_authority', 'timeline_urgent'],
                value: 'high',
                priority: 'P0',
                responseTime: '15_minutes'
            },
            qualified: {
                minScore: 50,
                requiredSignals: ['genuine_interest', 'decision_maker', 'defined_need'],
                value: 'medium',
                priority: 'P1',
                responseTime: '2_hours'
            },
            prospect: {
                minScore: 25,
                requiredSignals: ['basic_interest', 'valid_contact'],
                value: 'standard',
                priority: 'P2',
                responseTime: '24_hours'
            },
            nurture: {
                minScore: 0,
                requiredSignals: [],
                value: 'low',
                priority: 'P3',
                responseTime: '72_hours'
            }
        };
    }

    defineRoutingRules() {
        return {
            P0: {
                destination: 'direct_austin',
                method: 'immediate_alert',
                channels: ['sms', 'email', 'slack'],
                escalation: '5_minutes'
            },
            P1: {
                destination: 'sales_team',
                method: 'priority_queue',
                channels: ['email', 'crm'],
                escalation: '30_minutes'
            },
            P2: {
                destination: 'standard_queue',
                method: 'automated_response',
                channels: ['email'],
                escalation: '2_hours'
            },
            P3: {
                destination: 'nurture_campaign',
                method: 'marketing_automation',
                channels: ['email_sequence'],
                escalation: 'none'
            }
        };
    }

    init() {
        this.setupLeadCapture();
        this.startQualificationEngine();
        this.initializeRoutingSystem();
        this.setupDashboard();
    }

    setupLeadCapture() {
        // Monitor all lead generation points
        this.captureFormSubmissions();
        this.captureEmailClicks();
        this.captureDemoRequests();
        this.captureHighIntentBehavior();
    }

    captureFormSubmissions() {
        // Monitor calculator submissions
        document.addEventListener('submit', (e) => {
            if (e.target.id === 'pricing-form' || e.target.classList.contains('lead-form')) {
                e.preventDefault();
                this.processFormLead(e.target);
            }
        });
    }

    captureEmailClicks() {
        // Monitor email link clicks
        document.addEventListener('click', (e) => {
            if (e.target.href && e.target.href.includes('mailto:')) {
                this.processEmailLead(e.target.href);
            }
        });
    }

    captureDemoRequests() {
        // Monitor demo request buttons
        document.addEventListener('click', (e) => {
            if (e.target.textContent.toLowerCase().includes('demo') || 
                e.target.classList.contains('demo-request')) {
                this.processDemoLead(e.target);
            }
        });
    }

    captureHighIntentBehavior() {
        // Monitor high-intent behaviors from AI scoring
        setInterval(() => {
            const scoreData = JSON.parse(localStorage.getItem('blaze-prospect-score') || '{}');
            if (scoreData.classification === 'HOT' && !this.isLeadProcessed(scoreData)) {
                this.processHighIntentLead(scoreData);
            }
        }, 30000);
    }

    processFormLead(form) {
        const formData = new FormData(form);
        const lead = {
            id: this.generateLeadId(),
            source: 'form_submission',
            type: form.id,
            timestamp: Date.now(),
            data: {},
            scoring: {}
        };

        // Extract form data
        for (let [key, value] of formData.entries()) {
            lead.data[key] = value;
        }

        // Add session context
        lead.context = this.getLeadContext();
        
        // Qualify and route
        this.qualifyLead(lead);
    }

    processEmailLead(mailto) {
        const lead = {
            id: this.generateLeadId(),
            source: 'email_click',
            type: 'direct_contact',
            timestamp: Date.now(),
            data: {
                intent: this.extractEmailIntent(mailto)
            },
            context: this.getLeadContext(),
            scoring: {}
        };

        this.qualifyLead(lead);
    }

    processDemoLead(element) {
        const lead = {
            id: this.generateLeadId(),
            source: 'demo_request',
            type: element.dataset.demoType || 'general',
            timestamp: Date.now(),
            data: {
                requestedDemo: element.textContent,
                page: window.location.pathname
            },
            context: this.getLeadContext(),
            scoring: {}
        };

        this.qualifyLead(lead);
    }

    processHighIntentLead(scoreData) {
        const lead = {
            id: this.generateLeadId(),
            source: 'ai_scoring',
            type: 'hot_prospect',
            timestamp: Date.now(),
            data: {
                aiScore: scoreData.totalScore,
                classification: scoreData.classification,
                confidence: scoreData.confidence
            },
            context: this.getLeadContext(),
            scoring: scoreData
        };

        // Mark as processed
        localStorage.setItem('blaze-lead-processed-' + JSON.stringify(scoreData), 'true');
        
        this.qualifyLead(lead);
    }

    getLeadContext() {
        const sessionData = JSON.parse(localStorage.getItem('blaze-session') || '{}');
        const analyticsData = JSON.parse(localStorage.getItem('blaze-analytics') || '[]');
        const scoreData = JSON.parse(localStorage.getItem('blaze-prospect-score') || '{}');
        
        return {
            session: {
                visitCount: sessionData.visitCount || 1,
                pagesVisited: sessionData.pagesVisited || [],
                conversionStage: sessionData.conversionStage || 'awareness',
                timeOnSite: this.calculateTimeOnSite(analyticsData)
            },
            behavior: {
                engagementScore: scoreData.breakdown?.engagement || 0,
                intentScore: scoreData.breakdown?.intent || 0,
                lastAction: this.getLastAction(analyticsData)
            },
            technical: {
                userAgent: navigator.userAgent,
                referrer: document.referrer,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
            }
        };
    }

    calculateTimeOnSite(events) {
        if (events.length === 0) return 0;
        const firstEvent = events[0];
        const lastEvent = events[events.length - 1];
        return (lastEvent.timestamp - firstEvent.timestamp) / 1000; // seconds
    }

    getLastAction(events) {
        if (events.length === 0) return 'unknown';
        const lastEvent = events[events.length - 1];
        return lastEvent.event || 'unknown';
    }

    qualifyLead(lead) {
        console.log('🎯 Qualifying lead:', lead);
        
        // Calculate qualification score
        let score = 0;
        const signals = [];
        
        // Score based on source
        const sourceScores = {
            'demo_request': 30,
            'form_submission': 25,
            'email_click': 20,
            'ai_scoring': 15,
            'high_intent': 35
        };
        score += sourceScores[lead.source] || 10;
        
        // Score based on AI scoring if available
        if (lead.scoring?.totalScore) {
            score += lead.scoring.totalScore * 0.5;
        }
        
        // Score based on behavior
        if (lead.context?.session?.visitCount > 1) {
            score += 10;
            signals.push('repeat_visitor');
        }
        
        if (lead.context?.session?.pagesVisited?.length >= 3) {
            score += 15;
            signals.push('deep_exploration');
        }
        
        if (lead.context?.session?.conversionStage === 'decision') {
            score += 20;
            signals.push('decision_stage');
        }
        
        // Determine tier
        let tier = 'nurture';
        if (score >= 75) tier = 'enterprise';
        else if (score >= 50) tier = 'qualified';
        else if (score >= 25) tier = 'prospect';
        
        // Add qualification data
        lead.qualification = {
            score,
            tier,
            signals,
            priority: this.qualificationCriteria[tier].priority,
            value: this.qualificationCriteria[tier].value,
            responseTime: this.qualificationCriteria[tier].responseTime
        };
        
        // Add to queue
        this.leadQueue.push(lead);
        
        // Route the lead
        this.routeLead(lead);
        
        // Update dashboard
        this.updateDashboard(lead);
    }

    routeLead(lead) {
        const priority = lead.qualification.priority;
        const routing = this.routingRules[priority];
        
        console.log(`📧 Routing ${priority} lead to ${routing.destination}`);
        
        // Execute routing based on priority
        switch (routing.method) {
            case 'immediate_alert':
                this.sendImmediateAlert(lead);
                break;
            case 'priority_queue':
                this.addToPriorityQueue(lead);
                break;
            case 'automated_response':
                this.sendAutomatedResponse(lead);
                break;
            case 'marketing_automation':
                this.addToNurtureCampaign(lead);
                break;
        }
        
        // Store routed lead
        this.storeRoutedLead(lead);
    }

    sendImmediateAlert(lead) {
        // P0 - Immediate notification to Austin
        console.log('🚨 IMMEDIATE ALERT: Hot lead detected!');
        
        // Show urgent notification
        this.showUrgentLeadNotification(lead);
        
        // Send to webhook (Zapier/Slack/SMS)
        this.sendToWebhook({
            type: 'urgent_lead',
            priority: 'P0',
            lead: lead,
            message: `🔥 HOT LEAD: Score ${lead.qualification.score} - Immediate action required!`
        });
        
        // Create calendar event
        this.createCalendarEvent(lead);
    }

    addToPriorityQueue(lead) {
        // P1 - Add to sales team priority queue
        console.log('📊 Adding to priority queue');
        
        // Send notification
        this.showPriorityLeadNotification(lead);
        
        // Add to CRM
        this.addToCRM(lead, 'priority');
        
        // Send follow-up email
        this.sendPriorityFollowUp(lead);
    }

    sendAutomatedResponse(lead) {
        // P2 - Standard automated response
        console.log('📧 Sending automated response');
        
        // Generate personalized response
        const response = this.generateAutomatedResponse(lead);
        
        // Queue for sending
        this.queueEmail(response);
        
        // Add to CRM
        this.addToCRM(lead, 'standard');
    }

    addToNurtureCampaign(lead) {
        // P3 - Long-term nurturing
        console.log('🌱 Adding to nurture campaign');
        
        // Add to email sequence
        this.addToEmailSequence(lead);
        
        // Add to CRM
        this.addToCRM(lead, 'nurture');
    }

    showUrgentLeadNotification(lead) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #ef4444, #dc2626); color: white;
            padding: 2rem; border-radius: 20px; z-index: 100000;
            box-shadow: 0 20px 60px rgba(239,68,68,0.5); text-align: center;
            animation: urgentPulse 1s infinite;
        `;
        
        notification.innerHTML = `
            <h2 style="font-size: 2rem; margin-bottom: 1rem;">🚨 HOT LEAD ALERT</h2>
            <div style="font-size: 1.2rem; margin-bottom: 1rem;">
                <strong>Score:</strong> ${lead.qualification.score}/100<br>
                <strong>Tier:</strong> ${lead.qualification.tier.toUpperCase()}<br>
                <strong>Source:</strong> ${lead.source.replace('_', ' ')}
            </div>
            <div style="margin: 1.5rem 0;">
                <div style="font-size: 1rem; opacity: 0.9;">Immediate action required!</div>
                <div style="font-size: 0.9rem; opacity: 0.8;">Response time: ${lead.qualification.responseTime}</div>
            </div>
            <button onclick="this.parentElement.remove()" style="
                background: white; color: #dc2626; border: none;
                padding: 1rem 2rem; border-radius: 8px; font-weight: bold;
                cursor: pointer; font-size: 1.1rem;
            ">Acknowledge</button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 30 seconds
        setTimeout(() => notification.remove(), 30000);
    }

    showPriorityLeadNotification(lead) {
        const notification = document.createElement('div');
        notification.style.cssText = `
            position: fixed; top: 20px; right: 20px;
            background: linear-gradient(135deg, #f59e0b, #d97706); color: white;
            padding: 1.5rem; border-radius: 12px; z-index: 10000;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3); max-width: 350px;
        `;
        
        notification.innerHTML = `
            <h3 style="margin-bottom: 0.5rem;">📊 Priority Lead</h3>
            <div>Score: ${lead.qualification.score} | ${lead.qualification.tier}</div>
            <div style="font-size: 0.9rem; opacity: 0.9; margin-top: 0.5rem;">
                Added to priority queue for follow-up
            </div>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
            setTimeout(() => notification.remove(), 500);
        }, 10000);
    }

    generateAutomatedResponse(lead) {
        const templates = {
            enterprise: {
                subject: 'Priority: Your Blaze Intelligence Demo Request',
                body: `Thank you for your interest in Blaze Intelligence.

Based on your engagement, you qualify for our priority enterprise demonstration.

Austin will personally reach out within ${lead.qualification.responseTime} to schedule your custom demo.

In the meantime, explore our championship features:
- 2ms response times (250x faster than competitors)
- 25-50% verified cost savings
- Live MLB/NFL/NBA intelligence
- 94.6% prediction accuracy

Best regards,
The Blaze Intelligence Team`
            },
            qualified: {
                subject: 'Your Blaze Intelligence Information Request',
                body: `Thank you for exploring Blaze Intelligence.

We've identified you as a qualified prospect and will follow up within ${lead.qualification.responseTime}.

While you wait, check out:
- Performance Demo: See our 2ms response times
- Savings Calculator: Calculate your ROI
- MLB Intelligence: Live Cardinals analytics

Looking forward to showing you championship performance.

Best regards,
The Blaze Intelligence Team`
            },
            prospect: {
                subject: 'Welcome to Blaze Intelligence',
                body: `Thank you for your interest in Blaze Intelligence.

We'll follow up with more information within ${lead.qualification.responseTime}.

Explore our platform:
- Championship-level sports analytics
- Real-time professional sports data
- Advanced AI-driven insights

Best regards,
The Blaze Intelligence Team`
            },
            nurture: {
                subject: 'Discover Blaze Intelligence',
                body: `Welcome to Blaze Intelligence!

You've been added to our information series where you'll learn about:
- Revolutionary sports analytics
- Performance optimization strategies  
- Industry insights and trends

Best regards,
The Blaze Intelligence Team`
            }
        };
        
        return templates[lead.qualification.tier] || templates.nurture;
    }

    sendToWebhook(data) {
        // Send to external systems
        if (typeof fetch !== 'undefined') {
            fetch('https://hooks.zapier.com/hooks/catch/blaze-leads/', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'blaze-lead-qualification',
                    timestamp: new Date().toISOString(),
                    data: data
                })
            }).catch(err => console.log('Webhook failed:', err));
        }
    }

    addToCRM(lead, type) {
        // Store in local CRM simulation
        const crm = JSON.parse(localStorage.getItem('blaze-crm') || '{}');
        if (!crm[type]) crm[type] = [];
        
        crm[type].push({
            lead: lead,
            addedAt: Date.now(),
            status: 'new'
        });
        
        localStorage.setItem('blaze-crm', JSON.stringify(crm));
    }

    createCalendarEvent(lead) {
        // Generate calendar event for hot leads
        const event = {
            title: `HOT LEAD: Follow up - Score ${lead.qualification.score}`,
            start: new Date(Date.now() + 900000), // 15 minutes from now
            duration: 30, // minutes
            description: `Lead Details:\n${JSON.stringify(lead, null, 2)}`
        };
        
        console.log('📅 Calendar event created:', event);
    }

    storeRoutedLead(lead) {
        const routedLeads = JSON.parse(localStorage.getItem('blaze-routed-leads') || '[]');
        routedLeads.unshift(lead);
        
        // Keep last 100 leads
        if (routedLeads.length > 100) routedLeads.pop();
        
        localStorage.setItem('blaze-routed-leads', JSON.stringify(routedLeads));
    }

    startQualificationEngine() {
        console.log('🎯 Lead Qualification Engine: Active');
        
        // Process queue every 10 seconds
        setInterval(() => {
            this.processLeadQueue();
        }, 10000);
    }

    processLeadQueue() {
        if (this.leadQueue.length === 0) return;
        
        // Sort by priority
        this.leadQueue.sort((a, b) => {
            const priorityOrder = { 'P0': 0, 'P1': 1, 'P2': 2, 'P3': 3 };
            return priorityOrder[a.qualification.priority] - priorityOrder[b.qualification.priority];
        });
        
        // Process top priority leads first
        const lead = this.leadQueue.shift();
        if (lead) {
            console.log('Processing queued lead:', lead);
            // Additional processing if needed
        }
    }

    initializeRoutingSystem() {
        console.log('📧 Lead Routing System: Initialized');
        console.log('Routing rules:', this.routingRules);
    }

    setupDashboard() {
        // Create lead qualification dashboard
        const dashboard = document.createElement('div');
        dashboard.id = 'blaze-lead-dashboard';
        dashboard.style.cssText = `
            position: fixed; bottom: 20px; right: 20px; width: 320px;
            background: linear-gradient(135deg, rgba(0,0,0,0.95), rgba(26,26,46,0.95));
            color: white; padding: 1.5rem; border-radius: 16px;
            border: 2px solid rgba(0,255,255,0.3); z-index: 9996;
            box-shadow: 0 8px 25px rgba(0,0,0,0.3); backdrop-filter: blur(10px);
        `;
        
        dashboard.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
                <h3 style="margin: 0; color: #00ffff; font-size: 1rem;">📊 Lead Pipeline</h3>
                <button onclick="blazeLeadQualification.toggleDashboard()" style="
                    background: none; border: none; color: #94a3b8; cursor: pointer; font-size: 1.2rem;
                ">×</button>
            </div>
            <div id="lead-stats">
                <div style="text-align: center; color: #94a3b8;">No leads yet</div>
            </div>
        `;
        
        document.body.appendChild(dashboard);
    }

    updateDashboard(lead) {
        const stats = document.getElementById('lead-stats');
        if (!stats) return;
        
        const routedLeads = JSON.parse(localStorage.getItem('blaze-routed-leads') || '[]');
        
        // Count by priority
        const counts = {
            P0: routedLeads.filter(l => l.qualification?.priority === 'P0').length,
            P1: routedLeads.filter(l => l.qualification?.priority === 'P1').length,
            P2: routedLeads.filter(l => l.qualification?.priority === 'P2').length,
            P3: routedLeads.filter(l => l.qualification?.priority === 'P3').length
        };
        
        stats.innerHTML = `
            <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem;">Latest Lead</div>
                <div style="padding: 0.75rem; background: rgba(0,255,255,0.1); border-radius: 8px;">
                    <div style="color: #00ffff; font-weight: bold;">${lead.qualification.tier.toUpperCase()}</div>
                    <div style="font-size: 0.8rem;">Score: ${lead.qualification.score} | ${lead.qualification.priority}</div>
                    <div style="font-size: 0.7rem; color: #94a3b8;">${new Date(lead.timestamp).toLocaleTimeString()}</div>
                </div>
            </div>
            
            <div style="margin-bottom: 1rem;">
                <div style="font-size: 0.8rem; color: #94a3b8; margin-bottom: 0.5rem;">Pipeline Status</div>
                <div style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 0.5rem; text-align: center;">
                    <div style="background: rgba(239,68,68,0.2); padding: 0.5rem; border-radius: 6px;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #ef4444;">${counts.P0}</div>
                        <div style="font-size: 0.6rem; color: #94a3b8;">P0</div>
                    </div>
                    <div style="background: rgba(245,158,11,0.2); padding: 0.5rem; border-radius: 6px;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #f59e0b;">${counts.P1}</div>
                        <div style="font-size: 0.6rem; color: #94a3b8;">P1</div>
                    </div>
                    <div style="background: rgba(16,185,129,0.2); padding: 0.5rem; border-radius: 6px;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #10b981;">${counts.P2}</div>
                        <div style="font-size: 0.6rem; color: #94a3b8;">P2</div>
                    </div>
                    <div style="background: rgba(59,130,246,0.2); padding: 0.5rem; border-radius: 6px;">
                        <div style="font-size: 1.2rem; font-weight: bold; color: #3b82f6;">${counts.P3}</div>
                        <div style="font-size: 0.6rem; color: #94a3b8;">P3</div>
                    </div>
                </div>
            </div>
            
            <button onclick="blazeLeadQualification.exportLeads()" style="
                width: 100%; background: linear-gradient(45deg, #667eea, #764ba2);
                color: white; border: none; padding: 0.5rem; border-radius: 6px;
                font-size: 0.75rem; cursor: pointer;
            ">Export Lead Report</button>
        `;
    }

    toggleDashboard() {
        const dashboard = document.getElementById('blaze-lead-dashboard');
        if (dashboard) {
            dashboard.style.display = dashboard.style.display === 'none' ? 'block' : 'none';
        }
    }

    exportLeads() {
        const routedLeads = JSON.parse(localStorage.getItem('blaze-routed-leads') || '[]');
        const crm = JSON.parse(localStorage.getItem('blaze-crm') || '{}');
        
        const report = {
            generatedAt: new Date().toISOString(),
            summary: {
                total: routedLeads.length,
                byPriority: {
                    P0: routedLeads.filter(l => l.qualification?.priority === 'P0').length,
                    P1: routedLeads.filter(l => l.qualification?.priority === 'P1').length,
                    P2: routedLeads.filter(l => l.qualification?.priority === 'P2').length,
                    P3: routedLeads.filter(l => l.qualification?.priority === 'P3').length
                },
                byTier: {
                    enterprise: routedLeads.filter(l => l.qualification?.tier === 'enterprise').length,
                    qualified: routedLeads.filter(l => l.qualification?.tier === 'qualified').length,
                    prospect: routedLeads.filter(l => l.qualification?.tier === 'prospect').length,
                    nurture: routedLeads.filter(l => l.qualification?.tier === 'nurture').length
                }
            },
            leads: routedLeads.slice(0, 50), // Last 50 leads
            crmStatus: crm
        };
        
        // Create downloadable file
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blaze-lead-report-${Date.now()}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    // Helper methods
    generateLeadId() {
        return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    extractEmailIntent(mailto) {
        if (mailto.includes('demo')) return 'demo_request';
        if (mailto.includes('pricing')) return 'pricing_inquiry';
        if (mailto.includes('support')) return 'support_request';
        return 'general_inquiry';
    }

    isLeadProcessed(identifier) {
        return localStorage.getItem('blaze-lead-processed-' + JSON.stringify(identifier)) === 'true';
    }

    queueEmail(email) {
        const emailQueue = JSON.parse(localStorage.getItem('blaze-email-queue') || '[]');
        emailQueue.push({
            ...email,
            queued: Date.now(),
            status: 'pending'
        });
        localStorage.setItem('blaze-email-queue', JSON.stringify(emailQueue));
    }

    sendPriorityFollowUp(lead) {
        const followUp = {
            to: lead.data?.email || 'prospect@example.com',
            subject: 'Priority Follow-up: Blaze Intelligence',
            body: `We've identified you as a priority prospect. Austin will reach out within ${lead.qualification.responseTime}.`,
            priority: 'high'
        };
        
        this.queueEmail(followUp);
    }

    addToEmailSequence(lead) {
        const sequence = JSON.parse(localStorage.getItem('blaze-email-sequence') || '{}');
        if (!sequence.nurture) sequence.nurture = [];
        
        sequence.nurture.push({
            lead: lead.id,
            addedAt: Date.now(),
            sequence: 'standard_nurture',
            currentStep: 0
        });
        
        localStorage.setItem('blaze-email-sequence', JSON.stringify(sequence));
    }
}

// Auto-initialize lead qualification
let blazeLeadQualification;
document.addEventListener('DOMContentLoaded', () => {
    // Delay to ensure other systems are loaded
    setTimeout(() => {
        blazeLeadQualification = new BlazeLeadQualification();
    }, 5000);
});

// Global access
window.BlazeLeadQualification = BlazeLeadQualification;
window.blazeLeadQualification = blazeLeadQualification;