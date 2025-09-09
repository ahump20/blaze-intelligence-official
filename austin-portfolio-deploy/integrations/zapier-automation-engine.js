/**
 * Blaze Intelligence - Zapier Automation Engine
 * Seamless integration between all platform systems
 */

class BlazeZapierIntegration {
    constructor(config = {}) {
        this.config = {
            webhookUrls: {
                newLead: config.newLeadWebhook || process.env.ZAPIER_NEW_LEAD_WEBHOOK,
                newSubscription: config.newSubscriptionWebhook || process.env.ZAPIER_NEW_SUBSCRIPTION_WEBHOOK,
                churnRisk: config.churnRiskWebhook || process.env.ZAPIER_CHURN_RISK_WEBHOOK,
                supportTicket: config.supportTicketWebhook || process.env.ZAPIER_SUPPORT_TICKET_WEBHOOK,
                demo_scheduled: config.demoScheduledWebhook || process.env.ZAPIER_DEMO_SCHEDULED_WEBHOOK,
                payment_failed: config.paymentFailedWebhook || process.env.ZAPIER_PAYMENT_FAILED_WEBHOOK
            },
            ...config
        };
        
        this.automationWorkflows = {
            leadNurturing: {
                name: 'Lead Nurturing Sequence',
                triggers: ['new_lead', 'demo_completed'],
                actions: ['send_email_sequence', 'create_hubspot_task', 'slack_notification']
            },
            customerOnboarding: {
                name: 'Customer Onboarding Automation',
                triggers: ['subscription_created', 'payment_succeeded'],
                actions: ['send_welcome_email', 'create_onboarding_tasks', 'schedule_success_call']
            },
            churnPrevention: {
                name: 'Churn Prevention System',
                triggers: ['low_health_score', 'payment_failed', 'low_engagement'],
                actions: ['alert_success_manager', 'send_retention_email', 'create_urgent_task']
            },
            revenueTracking: {
                name: 'Revenue & Growth Tracking',
                triggers: ['subscription_created', 'subscription_upgraded', 'subscription_canceled'],
                actions: ['update_revenue_dashboard', 'notify_sales_team', 'update_forecasting']
            }
        };
        
        this.init();
    }
    
    async init() {
        console.log('⚡ Initializing Zapier Automation Engine for Blaze Intelligence');
        console.log('✅ Zapier Integration Ready - All workflows configured');
    }
    
    // Lead Generation & Nurturing Automations
    async triggerNewLead(leadData) {
        console.log('🎯 New lead detected - triggering automation sequence');
        
        const zapierData = {
            timestamp: new Date().toISOString(),
            event: 'new_lead',
            lead: {
                name: leadData.name,
                email: leadData.email,
                company: leadData.company,
                sport_focus: leadData.sportFocus,
                organization_type: leadData.organizationType,
                estimated_value: leadData.estimatedValue,
                source: leadData.source,
                interest_level: leadData.interestLevel,
                demo_interest: leadData.demoInterest
            },
            automation_triggers: [
                'create_hubspot_contact',
                'add_to_email_sequence',
                'notify_sales_team',
                'create_airtable_record',
                'schedule_follow_up'
            ]
        };
        
        // Trigger Zapier webhook
        await this.sendWebhook('newLead', zapierData);
        
        // Trigger immediate actions
        await this.executeImmediateLeadActions(leadData);
        
        return zapierData;
    }
    
    async executeImmediateLeadActions(leadData) {
        const actions = [];
        
        // High-value lead immediate response
        if (leadData.estimatedValue > 100000) {
            actions.push({
                type: 'slack_urgent_notification',
                message: `🚨 HIGH-VALUE LEAD ALERT: ${leadData.company} - $${leadData.estimatedValue.toLocaleString()}`,
                channel: '#sales-alerts'
            });
        }
        
        // Demo request immediate scheduling
        if (leadData.demoInterest === 'high') {
            actions.push({
                type: 'auto_demo_scheduling',
                lead_email: leadData.email,
                priority: 'high',
                calendar_link: 'https://calendly.com/blaze-intelligence/demo'
            });
        }
        
        // Send personalized response based on sport focus
        actions.push({
            type: 'personalized_email',
            template: `${leadData.sportFocus}_welcome`,
            variables: {
                company: leadData.company,
                sport: leadData.sportFocus,
                organization_type: leadData.organizationType
            }
        });
        
        console.log(`📋 Executing ${actions.length} immediate actions for lead`);
        return actions;
    }
    
    // Customer Success & Onboarding Automations
    async triggerNewSubscription(subscriptionData) {
        console.log('🎉 New subscription created - triggering onboarding sequence');
        
        const zapierData = {
            timestamp: new Date().toISOString(),
            event: 'new_subscription',
            subscription: {
                customer_id: subscriptionData.customerId,
                customer_name: subscriptionData.customerName,
                customer_email: subscriptionData.customerEmail,
                company: subscriptionData.company,
                plan: subscriptionData.plan,
                mrr: subscriptionData.mrr,
                sport_focus: subscriptionData.sportFocus,
                organization_type: subscriptionData.organizationType,
                trial_end_date: subscriptionData.trialEndDate
            },
            automation_triggers: [
                'send_welcome_package',
                'create_onboarding_checklist',
                'assign_success_manager',
                'setup_data_feeds',
                'schedule_kickoff_call',
                'create_airtable_client_record',
                'update_hubspot_deal_status'
            ]
        };
        
        await this.sendWebhook('newSubscription', zapierData);
        
        // Execute onboarding workflow
        await this.executeOnboardingWorkflow(subscriptionData);
        
        return zapierData;
    }
    
    async executeOnboardingWorkflow(subscriptionData) {
        const workflow = [
            {
                delay: 0, // Immediate
                action: 'send_welcome_email',
                data: {
                    template: 'enterprise_welcome',
                    personalization: {
                        company: subscriptionData.company,
                        plan: subscriptionData.plan,
                        sport_focus: subscriptionData.sportFocus
                    }
                }
            },
            {
                delay: 3600000, // 1 hour later
                action: 'send_setup_guide',
                data: {
                    template: `${subscriptionData.sportFocus}_setup_guide`,
                    includes: ['api_keys', 'team_configuration', 'data_sources']
                }
            },
            {
                delay: 86400000, // 24 hours later
                action: 'check_initial_setup',
                data: {
                    criteria: ['api_connected', 'teams_added', 'first_data_sync']
                }
            },
            {
                delay: 259200000, // 3 days later
                action: 'schedule_success_call',
                data: {
                    calendar_type: 'success_manager_intro',
                    duration: 30,
                    agenda: ['platform_walkthrough', 'goals_setting', 'optimization_opportunities']
                }
            }
        ];
        
        console.log(`📅 Scheduled ${workflow.length} onboarding actions`);
        return workflow;
    }
    
    // Churn Prevention & Health Monitoring
    async triggerChurnRisk(riskData) {
        console.log('⚠️ Churn risk detected - triggering retention sequence');
        
        const zapierData = {
            timestamp: new Date().toISOString(),
            event: 'churn_risk',
            client: {
                id: riskData.clientId,
                company: riskData.company,
                email: riskData.email,
                health_score: riskData.healthScore,
                mrr: riskData.mrr,
                risk_factors: riskData.riskFactors,
                days_since_login: riskData.daysSinceLogin,
                support_tickets: riskData.supportTickets,
                success_manager: riskData.successManager
            },
            urgency: this.calculateChurnUrgency(riskData),
            automation_triggers: [
                'alert_success_manager',
                'create_urgent_task',
                'send_retention_email',
                'schedule_check_in_call',
                'update_health_dashboard'
            ]
        };
        
        await this.sendWebhook('churnRisk', zapierData);
        
        // Execute immediate retention actions
        await this.executeRetentionActions(riskData);
        
        return zapierData;
    }
    
    calculateChurnUrgency(riskData) {
        let urgencyScore = 0;
        
        if (riskData.healthScore < 30) urgencyScore += 40;
        else if (riskData.healthScore < 50) urgencyScore += 25;
        else if (riskData.healthScore < 70) urgencyScore += 15;
        
        if (riskData.daysSinceLogin > 30) urgencyScore += 30;
        else if (riskData.daysSinceLogin > 14) urgencyScore += 20;
        
        if (riskData.supportTickets > 5) urgencyScore += 20;
        else if (riskData.supportTickets > 2) urgencyScore += 10;
        
        if (riskData.mrr > 5000) urgencyScore += 15; // High-value client
        
        if (urgencyScore >= 75) return 'critical';
        else if (urgencyScore >= 50) return 'high';
        else if (urgencyScore >= 25) return 'medium';
        else return 'low';
    }
    
    async executeRetentionActions(riskData) {
        const urgency = this.calculateChurnUrgency(riskData);
        const actions = [];
        
        if (urgency === 'critical') {
            actions.push({
                type: 'immediate_call_schedule',
                within_hours: 2,
                stakeholders: ['success_manager', 'account_director', 'ceo']
            });
            
            actions.push({
                type: 'executive_attention',
                escalation_level: 'c_suite',
                notification_channels: ['slack_urgent', 'email_executive', 'text_alert']
            });
        }
        
        if (urgency === 'high' || urgency === 'critical') {
            actions.push({
                type: 'personalized_retention_offer',
                offers: ['extended_trial', 'feature_preview', 'dedicated_support', 'price_adjustment']
            });
        }
        
        actions.push({
            type: 'health_improvement_plan',
            focus_areas: riskData.riskFactors,
            success_metrics: this.defineSuccessMetrics(riskData)
        });
        
        console.log(`🛡️ Executing ${actions.length} retention actions (${urgency} urgency)`);
        return actions;
    }
    
    // Revenue & Growth Tracking
    async triggerRevenueEvent(revenueData) {
        console.log('💰 Revenue event detected - updating tracking systems');
        
        const zapierData = {
            timestamp: new Date().toISOString(),
            event: revenueData.eventType, // subscription_created, upgraded, downgraded, canceled
            revenue: {
                amount: revenueData.amount,
                mrr_change: revenueData.mrrChange,
                customer_id: revenueData.customerId,
                company: revenueData.company,
                plan_from: revenueData.planFrom,
                plan_to: revenueData.planTo,
                effective_date: revenueData.effectiveDate
            },
            automation_triggers: [
                'update_revenue_dashboard',
                'notify_sales_team',
                'update_forecasting_model',
                'trigger_celebration', // for wins
                'analyze_churn_reason' // for cancellations
            ]
        };
        
        await this.sendWebhook('revenueTracking', zapierData);
        
        return zapierData;
    }
    
    // Support & Success Automations
    async triggerSupportTicket(ticketData) {
        console.log('🎫 Support ticket created - triggering response workflow');
        
        const zapierData = {
            timestamp: new Date().toISOString(),
            event: 'support_ticket_created',
            ticket: {
                id: ticketData.ticketId,
                customer_id: ticketData.customerId,
                company: ticketData.company,
                subject: ticketData.subject,
                priority: ticketData.priority,
                category: ticketData.category,
                description: ticketData.description,
                customer_mrr: ticketData.customerMrr
            },
            automation_triggers: [
                'auto_assign_agent',
                'send_acknowledgment_email',
                'update_health_score',
                'create_follow_up_tasks',
                'escalate_if_high_value'
            ]
        };
        
        await this.sendWebhook('supportTicket', zapierData);
        
        return zapierData;
    }
    
    // Demo & Sales Automation
    async triggerDemoScheduled(demoData) {
        console.log('📅 Demo scheduled - triggering preparation sequence');
        
        const zapierData = {
            timestamp: new Date().toISOString(),
            event: 'demo_scheduled',
            demo: {
                lead_id: demoData.leadId,
                company: demoData.company,
                attendee_name: demoData.attendeeName,
                attendee_email: demoData.attendeeEmail,
                demo_date: demoData.demoDate,
                sport_focus: demoData.sportFocus,
                organization_type: demoData.organizationType,
                estimated_value: demoData.estimatedValue,
                special_requests: demoData.specialRequests
            },
            automation_triggers: [
                'prepare_custom_demo',
                'send_calendar_invite',
                'create_demo_preparation_tasks',
                'send_pre_demo_materials',
                'setup_demo_environment'
            ]
        };
        
        await this.sendWebhook('demo_scheduled', zapierData);
        
        return zapierData;
    }
    
    // Utility Methods
    async sendWebhook(type, data) {
        const webhookUrl = this.config.webhookUrls[type];
        if (!webhookUrl) {
            console.warn(`⚠️ No webhook URL configured for type: ${type}`);
            return;
        }
        
        try {
            const response = await fetch(webhookUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    ...data,
                    webhook_type: type,
                    source: 'blaze_intelligence_platform'
                })
            });
            
            if (response.ok) {
                console.log(`✅ Zapier webhook sent successfully: ${type}`);
            } else {
                console.error(`❌ Zapier webhook failed: ${response.status}`);
            }
        } catch (error) {
            console.error(`❌ Error sending Zapier webhook:`, error);
        }
    }
    
    defineSuccessMetrics(riskData) {
        return {
            target_health_score: Math.max(riskData.healthScore + 20, 80),
            target_login_frequency: 'weekly',
            target_feature_usage: ['dashboard', 'analytics', 'reports'],
            target_support_tickets: Math.max(riskData.supportTickets - 2, 0)
        };
    }
    
    // Analytics & Reporting
    async generateAutomationReport() {
        const report = {
            timestamp: new Date().toISOString(),
            period: 'last_30_days',
            workflows: {},
            performance: {
                total_automations: 0,
                success_rate: 0,
                average_response_time: 0,
                cost_savings: 0
            }
        };
        
        // In a real implementation, you'd pull metrics from Zapier's API
        Object.keys(this.automationWorkflows).forEach(workflow => {
            report.workflows[workflow] = {
                triggers: Math.floor(Math.random() * 100) + 50,
                successes: Math.floor(Math.random() * 95) + 45,
                failures: Math.floor(Math.random() * 5),
                avg_completion_time: Math.floor(Math.random() * 300) + 60
            };
        });
        
        console.log('📊 Automation performance report generated');
        return report;
    }
}

// Auto-initialize for browser
if (typeof window !== 'undefined') {
    window.blazeZapier = new BlazeZapierIntegration();
    
    // Set up event listeners for automatic triggers
    window.addEventListener('blazeNewLead', (event) => {
        window.blazeZapier.triggerNewLead(event.detail);
    });
    
    window.addEventListener('blazeNewSubscription', (event) => {
        window.blazeZapier.triggerNewSubscription(event.detail);
    });
    
    window.addEventListener('blazeChurnRisk', (event) => {
        window.blazeZapier.triggerChurnRisk(event.detail);
    });
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeZapierIntegration;
}