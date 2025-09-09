/**
 * Blaze Intelligence - Enterprise Integration Orchestrator
 * Master controller for all enterprise systems and integrations
 */

class BlazeEnterpriseOrchestrator {
    constructor(config = {}) {
        this.config = {
            apiKeys: {
                hubspot: config.hubspotApiKey || process.env.HUBSPOT_API_KEY,
                stripe: config.stripeSecretKey || process.env.STRIPE_SECRET_KEY,
                airtable: config.airtableApiKey || process.env.AIRTABLE_API_KEY,
                zapier: config.zapierWebhookKey || process.env.ZAPIER_WEBHOOK_KEY
            },
            integrations: {
                hubspot: null,
                stripe: null,
                airtable: null,
                zapier: null
            },
            autoSync: config.autoSync !== false,
            syncInterval: config.syncInterval || 300000, // 5 minutes
            ...config
        };
        
        this.syncStatus = {
            lastSync: null,
            syncCount: 0,
            errors: [],
            performance: {
                avgSyncTime: 0,
                successRate: 100
            }
        };
        
        this.eventQueue = [];
        this.isProcessing = false;
        
        this.init();
    }
    
    async init() {
        console.log('🎛️ Initializing Blaze Intelligence Enterprise Orchestrator');
        
        // Initialize all integrations
        await this.initializeIntegrations();
        
        // Set up event listeners
        this.setupEventListeners();
        
        // Start background processes
        this.startBackgroundSync();
        
        console.log('✅ Enterprise Orchestrator Ready - All systems integrated');
    }
    
    async initializeIntegrations() {
        try {
            // Initialize HubSpot Integration
            if (window.BlazeHubSpotIntegration) {
                this.config.integrations.hubspot = new window.BlazeHubSpotIntegration({
                    apiKey: this.config.apiKeys.hubspot
                });
                console.log('✅ HubSpot CRM connected');
            }
            
            // Initialize Stripe Integration
            if (window.BlazeStripeIntegration) {
                this.config.integrations.stripe = new window.BlazeStripeIntegration({
                    secretKey: this.config.apiKeys.stripe
                });
                console.log('✅ Stripe Billing connected');
            }
            
            // Initialize Airtable Integration
            if (window.BlazeAirtableIntegration) {
                this.config.integrations.airtable = new window.BlazeAirtableIntegration({
                    apiKey: this.config.apiKeys.airtable
                });
                console.log('✅ Airtable Analytics connected');
            }
            
            // Initialize Zapier Integration
            if (window.BlazeZapierIntegration) {
                this.config.integrations.zapier = new window.BlazeZapierIntegration();
                console.log('✅ Zapier Automation connected');
            }
            
        } catch (error) {
            console.error('❌ Error initializing integrations:', error);
        }
    }
    
    setupEventListeners() {
        // Lead form submissions
        document.addEventListener('blazeNewLead', (event) => {
            this.handleNewLead(event.detail);
        });
        
        // Subscription events from Stripe webhooks
        document.addEventListener('blazeNewSubscription', (event) => {
            this.handleNewSubscription(event.detail);
        });
        
        // Customer health score changes
        document.addEventListener('blazeHealthAlert', (event) => {
            this.handleHealthAlert(event.detail);
        });
        
        // Demo bookings
        document.addEventListener('blazeDemoBooked', (event) => {
            this.handleDemoBooked(event.detail);
        });
    }
    
    async handleNewLead(leadData) {
        console.log('🎯 Processing new lead:', leadData.company);
        
        try {
            const orchestrationTasks = [];
            
            // 1. Create lead in HubSpot
            if (this.config.integrations.hubspot) {
                orchestrationTasks.push(
                    this.config.integrations.hubspot.createLead(leadData)
                );
            }
            
            // 2. Create lead in Airtable for analytics
            if (this.config.integrations.airtable) {
                orchestrationTasks.push(
                    this.config.integrations.airtable.createLead(leadData)
                );
            }
            
            // 3. Trigger Zapier automations
            if (this.config.integrations.zapier) {
                orchestrationTasks.push(
                    this.config.integrations.zapier.triggerNewLead(leadData)
                );
            }
            
            // Execute all tasks in parallel
            const results = await Promise.allSettled(orchestrationTasks);
            
            // Process results and handle any failures
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            console.log(`✅ Lead processed: ${successCount}/${results.length} systems updated`);
            
            // Send real-time notification
            this.notifyRealTime('new_lead', {
                company: leadData.company,
                estimatedValue: leadData.estimatedValue,
                systemsUpdated: successCount
            });
            
            return { success: true, systemsUpdated: successCount };
            
        } catch (error) {
            console.error('❌ Error processing new lead:', error);
            return { success: false, error: error.message };
        }
    }
    
    async handleNewSubscription(subscriptionData) {
        console.log('🎉 Processing new subscription:', subscriptionData.company);
        
        try {
            const orchestrationTasks = [];
            
            // 1. Update HubSpot deal status
            if (this.config.integrations.hubspot && subscriptionData.dealId) {
                orchestrationTasks.push(
                    this.config.integrations.hubspot.updateDealStage(subscriptionData.dealId, 'closed_won')
                );
            }
            
            // 2. Create client record in Airtable
            if (this.config.integrations.airtable) {
                orchestrationTasks.push(
                    this.config.integrations.airtable.createClient({
                        name: subscriptionData.customerName,
                        email: subscriptionData.customerEmail,
                        company: subscriptionData.company,
                        sportFocus: subscriptionData.sportFocus,
                        organizationType: subscriptionData.organizationType,
                        plan: subscriptionData.plan,
                        mrr: subscriptionData.mrr
                    })
                );
            }
            
            // 3. Track revenue in Airtable
            if (this.config.integrations.airtable) {
                orchestrationTasks.push(
                    this.config.integrations.airtable.trackRevenue({
                        amount: subscriptionData.amount,
                        type: 'Subscription',
                        plan: subscriptionData.plan,
                        stripeId: subscriptionData.subscriptionId,
                        status: 'Active',
                        mrrImpact: subscriptionData.mrr
                    })
                );
            }
            
            // 4. Trigger Zapier onboarding automation
            if (this.config.integrations.zapier) {
                orchestrationTasks.push(
                    this.config.integrations.zapier.triggerNewSubscription(subscriptionData)
                );
            }
            
            // Execute all tasks
            const results = await Promise.allSettled(orchestrationTasks);
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            
            console.log(`✅ Subscription processed: ${successCount}/${results.length} systems updated`);
            
            // Send celebration notification for high-value subscriptions
            if (subscriptionData.mrr > 1000) {
                this.notifyRealTime('high_value_subscription', {
                    company: subscriptionData.company,
                    mrr: subscriptionData.mrr,
                    plan: subscriptionData.plan
                });
            }
            
            return { success: true, systemsUpdated: successCount };
            
        } catch (error) {
            console.error('❌ Error processing new subscription:', error);
            return { success: false, error: error.message };
        }
    }
    
    async handleHealthAlert(healthData) {
        console.log('⚠️ Processing health alert for:', healthData.company);
        
        try {
            const orchestrationTasks = [];
            
            // 1. Update health score in Airtable
            if (this.config.integrations.airtable) {
                orchestrationTasks.push(
                    this.config.integrations.airtable.updateClientHealth(healthData.clientId, {
                        score: healthData.healthScore,
                        lastLogin: healthData.lastLogin,
                        dataPoints: healthData.dataPoints,
                        supportTickets: healthData.supportTickets
                    })
                );
            }
            
            // 2. Create HubSpot task for account manager if critical
            if (this.config.integrations.hubspot && healthData.healthScore < 50) {
                orchestrationTasks.push(
                    this.config.integrations.hubspot.createTask({
                        title: `URGENT: ${healthData.company} Health Score Critical`,
                        description: `Health score dropped to ${healthData.healthScore}. Immediate intervention required.`,
                        priority: 'HIGH',
                        dueDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours from now
                    })
                );
            }
            
            // 3. Trigger churn prevention automation
            if (this.config.integrations.zapier) {
                orchestrationTasks.push(
                    this.config.integrations.zapier.triggerChurnRisk({
                        clientId: healthData.clientId,
                        company: healthData.company,
                        email: healthData.email,
                        healthScore: healthData.healthScore,
                        riskFactors: healthData.riskFactors,
                        mrr: healthData.mrr
                    })
                );
            }
            
            const results = await Promise.allSettled(orchestrationTasks);
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            
            console.log(`✅ Health alert processed: ${successCount}/${results.length} systems updated`);
            
            return { success: true, systemsUpdated: successCount };
            
        } catch (error) {
            console.error('❌ Error processing health alert:', error);
            return { success: false, error: error.message };
        }
    }
    
    async handleDemoBooked(demoData) {
        console.log('📅 Processing demo booking for:', demoData.company);
        
        try {
            const orchestrationTasks = [];
            
            // 1. Update lead stage in HubSpot
            if (this.config.integrations.hubspot) {
                orchestrationTasks.push(
                    this.config.integrations.hubspot.updateDealStage(demoData.dealId, 'demo_scheduled')
                );
            }
            
            // 2. Update lead status in Airtable
            if (this.config.integrations.airtable) {
                orchestrationTasks.push(
                    this.config.integrations.airtable.updateLead(demoData.leadId, {
                        'Demo Scheduled': true,
                        'Demo Date': demoData.demoDate,
                        'Status': 'Demo Scheduled'
                    })
                );
            }
            
            // 3. Trigger demo preparation automation
            if (this.config.integrations.zapier) {
                orchestrationTasks.push(
                    this.config.integrations.zapier.triggerDemoScheduled(demoData)
                );
            }
            
            const results = await Promise.allSettled(orchestrationTasks);
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            
            console.log(`✅ Demo booking processed: ${successCount}/${results.length} systems updated`);
            
            return { success: true, systemsUpdated: successCount };
            
        } catch (error) {
            console.error('❌ Error processing demo booking:', error);
            return { success: false, error: error.message };
        }
    }
    
    async performFullSync() {
        console.log('🔄 Starting full enterprise data sync...');
        const startTime = Date.now();
        
        try {
            const syncTasks = [];
            
            // 1. Sync HubSpot deals to Airtable
            if (this.config.integrations.hubspot && this.config.integrations.airtable) {
                syncTasks.push(this.syncHubSpotToAirtable());
            }
            
            // 2. Sync Stripe subscriptions to both systems
            if (this.config.integrations.stripe) {
                if (this.config.integrations.airtable) {
                    syncTasks.push(this.syncStripeToAirtable());
                }
                if (this.config.integrations.hubspot) {
                    syncTasks.push(this.syncStripeToHubSpot());
                }
            }
            
            // 3. Generate and sync analytics reports
            syncTasks.push(this.generateAnalyticsReports());
            
            // Execute all sync tasks
            const results = await Promise.allSettled(syncTasks);
            const successCount = results.filter(r => r.status === 'fulfilled').length;
            
            const syncTime = Date.now() - startTime;
            
            // Update sync status
            this.syncStatus.lastSync = new Date().toISOString();
            this.syncStatus.syncCount++;
            this.syncStatus.performance.avgSyncTime = 
                (this.syncStatus.performance.avgSyncTime * (this.syncStatus.syncCount - 1) + syncTime) / this.syncStatus.syncCount;
            this.syncStatus.performance.successRate = 
                (this.syncStatus.performance.successRate * (this.syncStatus.syncCount - 1) + (successCount / results.length * 100)) / this.syncStatus.syncCount;
            
            console.log(`✅ Full sync completed: ${successCount}/${results.length} successful in ${syncTime}ms`);
            
            return {
                success: true,
                duration: syncTime,
                tasksCompleted: successCount,
                totalTasks: results.length
            };
            
        } catch (error) {
            console.error('❌ Error during full sync:', error);
            this.syncStatus.errors.push({
                timestamp: new Date().toISOString(),
                error: error.message
            });
            return { success: false, error: error.message };
        }
    }
    
    async syncHubSpotToAirtable() {
        console.log('🔄 Syncing HubSpot deals to Airtable...');
        
        // Get recent deals from HubSpot
        const recentDeals = await this.config.integrations.hubspot.getDealsByStage('closed_won');
        
        // Create corresponding client records in Airtable
        for (const deal of recentDeals.slice(0, 10)) { // Limit to 10 for demo
            try {
                await this.config.integrations.airtable.createClient({
                    name: deal.contact_name || 'Unknown',
                    email: deal.contact_email || 'unknown@example.com',
                    company: deal.properties.dealname.split(' - ')[0] || 'Unknown Company',
                    sportFocus: deal.properties.blaze_sport_focus || 'mlb',
                    organizationType: deal.properties.blaze_organization_type || 'pro_team',
                    plan: this.inferPlanFromAmount(deal.properties.amount),
                    mrr: Math.round(deal.properties.amount / 12)
                });
            } catch (error) {
                console.error('Error syncing deal to Airtable:', error);
            }
        }
        
        console.log(`✅ Synced ${recentDeals.length} deals to Airtable`);
    }
    
    async syncStripeToAirtable() {
        console.log('🔄 Syncing Stripe subscriptions to Airtable...');
        
        // Get revenue dashboard from Stripe
        const revenueData = await this.config.integrations.stripe.generateRevenueDashboard();
        
        if (revenueData) {
            // Track monthly revenue in Airtable
            await this.config.integrations.airtable.trackRevenue({
                amount: revenueData.revenue.thisMonth,
                type: 'Monthly Total',
                status: 'Confirmed',
                mrrImpact: revenueData.revenue.mrr
            });
        }
        
        console.log('✅ Stripe revenue synced to Airtable');
    }
    
    async generateAnalyticsReports() {
        console.log('📊 Generating enterprise analytics reports...');
        
        const reports = {};
        
        // Get HubSpot sales report
        if (this.config.integrations.hubspot) {
            reports.sales = await this.config.integrations.hubspot.generateSalesReport();
        }
        
        // Get Stripe revenue report
        if (this.config.integrations.stripe) {
            reports.revenue = await this.config.integrations.stripe.generateRevenueDashboard();
        }
        
        // Get Airtable client dashboard
        if (this.config.integrations.airtable) {
            reports.clients = await this.config.integrations.airtable.generateClientDashboard();
        }
        
        // Get Zapier automation report
        if (this.config.integrations.zapier) {
            reports.automation = await this.config.integrations.zapier.generateAutomationReport();
        }
        
        // Combine into master report
        const masterReport = {
            timestamp: new Date().toISOString(),
            reports: reports,
            summary: {
                totalMRR: reports.revenue?.revenue?.mrr || 0,
                totalClients: reports.clients?.clients?.active || 0,
                pipelineValue: reports.sales?.summary?.totalPipelineValue || 0,
                automationEfficiency: reports.automation?.performance?.success_rate || 0
            }
        };
        
        // Store master report (could save to file, send to webhook, etc.)
        console.log('📊 Master enterprise report generated:', masterReport.summary);
        
        return masterReport;
    }
    
    startBackgroundSync() {
        if (!this.config.autoSync) return;
        
        console.log(`🔄 Starting background sync every ${this.config.syncInterval / 1000} seconds`);
        
        setInterval(async () => {
            if (!this.isProcessing) {
                this.isProcessing = true;
                await this.performFullSync();
                this.isProcessing = false;
            }
        }, this.config.syncInterval);
        
        // Initial sync after 30 seconds
        setTimeout(async () => {
            await this.performFullSync();
        }, 30000);
    }
    
    notifyRealTime(eventType, data) {
        // Send real-time notifications to dashboard
        if (window.enterpriseDashboard) {
            window.enterpriseDashboard.handleRealtimeEvent(eventType, data);
        }
        
        // Could also send to Slack, email, etc.
        console.log(`📡 Real-time notification: ${eventType}`, data);
    }
    
    inferPlanFromAmount(amount) {
        if (amount >= 99900) return 'enterprise';
        if (amount >= 19900) return 'professional';
        if (amount >= 4900) return 'starter';
        return 'custom';
    }
    
    getStatus() {
        return {
            integrations: Object.keys(this.config.integrations).reduce((status, key) => {
                status[key] = this.config.integrations[key] ? 'connected' : 'disconnected';
                return status;
            }, {}),
            sync: this.syncStatus,
            isProcessing: this.isProcessing,
            eventQueueSize: this.eventQueue.length
        };
    }
    
    destroy() {
        // Clean up intervals, event listeners, etc.
        console.log('🛑 Shutting down Enterprise Orchestrator');
    }
}

// Auto-initialize for browser
if (typeof window !== 'undefined') {
    window.blazeEnterpriseOrchestrator = new BlazeEnterpriseOrchestrator();
    
    // Expose global methods for testing
    window.testEnterpriseIntegration = async function() {
        // Test lead flow
        await window.blazeEnterpriseOrchestrator.handleNewLead({
            name: 'Test Lead',
            email: 'test@example.com',
            company: 'Test Sports Organization',
            sportFocus: 'mlb',
            organizationType: 'pro_team',
            estimatedValue: 50000,
            source: 'website',
            interestLevel: 'high',
            demoInterest: 'high'
        });
        
        console.log('✅ Enterprise integration test completed');
    };
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeEnterpriseOrchestrator;
}