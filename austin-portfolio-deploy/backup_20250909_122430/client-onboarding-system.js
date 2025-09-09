class ClientOnboardingSystem {
    constructor() {
        this.onboardingStages = [
            'lead_qualification',
            'demo_personalization', 
            'account_setup',
            'training_activation',
            'success_optimization'
        ];
        
        this.qualificationCriteria = {
            organizationSize: {
                'enterprise': { weight: 1.0, priority: 'high' },
                'mid-market': { weight: 0.8, priority: 'medium' },
                'small-team': { weight: 0.6, priority: 'standard' },
                'individual': { weight: 0.4, priority: 'self-serve' }
            },
            sport: {
                'mlb': { weight: 0.9, complexity: 'high' },
                'nfl': { weight: 0.85, complexity: 'high' },
                'nba': { weight: 0.8, complexity: 'medium' },
                'ncaa': { weight: 0.75, complexity: 'medium' },
                'high-school': { weight: 0.6, complexity: 'low' },
                'youth': { weight: 0.5, complexity: 'low' }
            },
            role: {
                'head-coach': { weight: 1.0, urgency: 'high' },
                'assistant-coach': { weight: 0.9, urgency: 'medium' },
                'scout': { weight: 0.85, urgency: 'medium' },
                'gm': { weight: 0.95, urgency: 'high' },
                'analyst': { weight: 0.7, urgency: 'medium' },
                'athlete': { weight: 0.6, urgency: 'low' },
                'media': { weight: 0.5, urgency: 'low' }
            }
        };
        
        this.integrationAPIs = {
            hubspot: { enabled: true, endpoint: '/api/integrations/hubspot' },
            salesforce: { enabled: true, endpoint: '/api/integrations/salesforce' },
            calendly: { enabled: true, endpoint: '/api/integrations/calendly' },
            slack: { enabled: true, endpoint: '/api/integrations/slack' },
            intercom: { enabled: true, endpoint: '/api/integrations/intercom' }
        };
        
        this.templates = {
            email: this.initializeEmailTemplates(),
            demo: this.initializeDemoTemplates(),
            training: this.initializeTrainingTemplates()
        };
    }

    // Lead Qualification System
    async qualifyLead(leadData) {
        const score = this.calculateLeadScore(leadData);
        const priority = this.determinePriority(score, leadData);
        const route = this.determineOnboardingRoute(priority, leadData);
        
        const qualification = {
            leadId: leadData.id || this.generateLeadId(),
            score: Math.round(score * 100),
            priority: priority,
            route: route,
            timestamp: new Date().toISOString(),
            nextActions: this.generateNextActions(priority, leadData),
            assignedTo: this.assignSuccessManager(priority, leadData)
        };
        
        // Log qualification for tracking
        this.logOnboardingEvent(qualification.leadId, 'lead_qualified', qualification);
        
        // Trigger automated actions
        await this.triggerQualificationActions(qualification, leadData);
        
        return qualification;
    }
    
    calculateLeadScore(leadData) {
        let score = 0.5; // Base score
        
        // Organization size scoring
        if (leadData.organizationSize && this.qualificationCriteria.organizationSize[leadData.organizationSize]) {
            score += this.qualificationCriteria.organizationSize[leadData.organizationSize].weight * 0.3;
        }
        
        // Sport complexity scoring
        if (leadData.primarySport && this.qualificationCriteria.sport[leadData.primarySport]) {
            score += this.qualificationCriteria.sport[leadData.primarySport].weight * 0.25;
        }
        
        // Role importance scoring
        if (leadData.role && this.qualificationCriteria.role[leadData.role]) {
            score += this.qualificationCriteria.role[leadData.role].weight * 0.25;
        }
        
        // Budget indicators
        if (leadData.budgetRange) {
            const budgetMultipliers = {
                'enterprise': 0.2,
                'mid-market': 0.15,
                'small': 0.1,
                'startup': 0.05
            };
            score += budgetMultipliers[leadData.budgetRange] || 0;
        }
        
        // Urgency indicators
        if (leadData.timeframe) {
            const urgencyMultipliers = {
                'immediate': 0.15,
                'this-month': 0.12,
                'this-quarter': 0.08,
                'this-year': 0.05
            };
            score += urgencyMultipliers[leadData.timeframe] || 0;
        }
        
        return Math.min(1.0, Math.max(0.1, score));
    }
    
    determinePriority(score, leadData) {
        if (score >= 0.8) return 'enterprise';
        if (score >= 0.65) return 'high';
        if (score >= 0.45) return 'medium';
        return 'standard';
    }
    
    determineOnboardingRoute(priority, leadData) {
        const routes = {
            'enterprise': 'white-glove',
            'high': 'premium-guided',
            'medium': 'standard-guided',
            'standard': 'self-service-plus'
        };
        return routes[priority] || 'self-service';
    }
    
    generateNextActions(priority, leadData) {
        const actionTemplates = {
            'enterprise': [
                'Schedule executive demo within 24 hours',
                'Prepare custom use case analysis',
                'Assign dedicated success manager',
                'Create personalized ROI projection'
            ],
            'high': [
                'Schedule demo within 48 hours',
                'Prepare sport-specific demo environment',
                'Send relevant case studies',
                'Set up trial account with sample data'
            ],
            'medium': [
                'Send personalized demo link',
                'Provide role-specific feature overview',
                'Schedule group demo if applicable',
                'Share getting started resources'
            ],
            'standard': [
                'Send automated demo sequence',
                'Provide self-service trial access',
                'Share video tutorials',
                'Schedule optional check-in call'
            ]
        };
        
        return actionTemplates[priority] || actionTemplates['standard'];
    }
    
    assignSuccessManager(priority, leadData) {
        // In production, this would query available managers
        const managerAssignments = {
            'enterprise': 'senior-csm-team',
            'high': 'mid-level-csm',
            'medium': 'junior-csm',
            'standard': 'automated-nurture'
        };
        
        return {
            type: managerAssignments[priority],
            assignedAt: new Date().toISOString(),
            expectedResponse: this.getResponseSLA(priority)
        };
    }
    
    getResponseSLA(priority) {
        const slaHours = {
            'enterprise': 4,
            'high': 24,
            'medium': 48,
            'standard': 72
        };
        
        const now = new Date();
        now.setHours(now.getHours() + slaHours[priority]);
        return now.toISOString();
    }

    // Demo Personalization System
    async personalizeDemoEnvironment(qualification, leadData) {
        const demoConfig = {
            leadId: qualification.leadId,
            sport: leadData.primarySport || 'mlb',
            role: leadData.role || 'coach',
            organizationType: leadData.organizationSize || 'mid-market',
            customizations: await this.generateDemoCustomizations(leadData),
            dataPresets: this.selectDataPresets(leadData),
            features: this.selectRelevantFeatures(leadData),
            timeline: this.createDemoTimeline(qualification.priority)
        };
        
        // Create demo environment
        const demoUrl = await this.createDemoEnvironment(demoConfig);
        
        // Schedule demo if needed
        if (qualification.priority !== 'standard') {
            const schedulingInfo = await this.scheduleDemo(qualification, leadData);
            demoConfig.schedulingInfo = schedulingInfo;
        }
        
        // Log demo preparation
        this.logOnboardingEvent(qualification.leadId, 'demo_personalized', demoConfig);
        
        return {
            demoUrl: demoUrl,
            configuration: demoConfig,
            expiresAt: this.calculateDemoExpiration(qualification.priority)
        };
    }
    
    async generateDemoCustomizations(leadData) {
        const customizations = {
            teamData: [],
            competitors: [],
            useCases: [],
            dashboards: []
        };
        
        // Add relevant team data
        if (leadData.teamName || leadData.primarySport) {
            customizations.teamData = await this.getRelevantTeamData(leadData);
        }
        
        // Add competitive analysis data
        if (leadData.competitors) {
            customizations.competitors = await this.getCompetitorData(leadData.competitors);
        }
        
        // Generate use cases based on role and sport
        customizations.useCases = this.generateRoleSpecificUseCases(leadData);
        
        // Configure dashboard layouts
        customizations.dashboards = this.configureDashboards(leadData);
        
        return customizations;
    }
    
    generateRoleSpecificUseCases(leadData) {
        const useCaseLibrary = {
            'head-coach': [
                'Game planning with opponent analysis',
                'Player performance optimization',
                'Injury prevention analytics',
                'Championship momentum tracking'
            ],
            'scout': [
                'Talent identification and ranking',
                'Player comparison analytics',
                'Draft preparation insights',
                'Recruitment pipeline management'
            ],
            'gm': [
                'Roster optimization strategies',
                'Trade value analysis',
                'Budget allocation insights',
                'Long-term team building'
            ],
            'analyst': [
                'Advanced statistical modeling',
                'Performance prediction algorithms',
                'Custom report generation',
                'Data visualization tools'
            ]
        };
        
        return useCaseLibrary[leadData.role] || useCaseLibrary['head-coach'];
    }

    // Account Setup Automation
    async setupClientAccount(qualification, demoFeedback) {
        const accountConfig = {
            leadId: qualification.leadId,
            accountType: this.determineAccountType(qualification, demoFeedback),
            features: this.selectAccountFeatures(qualification, demoFeedback),
            integrations: this.selectIntegrations(demoFeedback),
            userHierarchy: this.createUserHierarchy(demoFeedback),
            dataFeeds: this.configureDataFeeds(demoFeedback),
            customizations: this.applyAccountCustomizations(demoFeedback)
        };
        
        // Create account infrastructure
        const account = await this.createAccount(accountConfig);
        
        // Set up data connections
        await this.establishDataConnections(account, accountConfig.dataFeeds);
        
        // Configure user access
        await this.setupUserAccess(account, accountConfig.userHierarchy);
        
        // Apply customizations
        await this.applyCustomizations(account, accountConfig.customizations);
        
        // Log account setup
        this.logOnboardingEvent(qualification.leadId, 'account_created', {
            accountId: account.id,
            configuration: accountConfig
        });
        
        return account;
    }
    
    determineAccountType(qualification, feedback) {
        const typeMapping = {
            'enterprise': 'enterprise-unlimited',
            'high': 'professional-plus',
            'medium': 'professional',
            'standard': 'starter'
        };
        
        let baseType = typeMapping[qualification.priority] || 'starter';
        
        // Upgrade based on demo feedback
        if (feedback && feedback.requestedFeatures) {
            const premiumFeatures = ['neural-pathways', 'momentum-wave', 'championship-dna'];
            const requestedPremium = feedback.requestedFeatures.filter(f => 
                premiumFeatures.includes(f)
            ).length;
            
            if (requestedPremium >= 2 && baseType === 'starter') {
                baseType = 'professional';
            }
        }
        
        return baseType;
    }

    // Training and Activation System
    async initiateTrainingProgram(account, userProfile) {
        const trainingPlan = {
            accountId: account.id,
            userId: userProfile.id,
            role: userProfile.role,
            sport: userProfile.primarySport,
            learningPath: this.createLearningPath(userProfile),
            milestones: this.defineLearningMilestones(userProfile),
            adaptiveSettings: this.configureAdaptiveLearning(userProfile),
            schedule: this.createTrainingSchedule(userProfile)
        };
        
        // Initialize training tracking
        const trainingSession = await this.createTrainingSession(trainingPlan);
        
        // Send welcome materials
        await this.sendWelcomeSequence(account, userProfile, trainingPlan);
        
        // Schedule check-ins
        await this.scheduleTrainingCheckIns(trainingSession);
        
        // Log training initiation
        this.logOnboardingEvent(account.leadId, 'training_initiated', trainingPlan);
        
        return trainingSession;
    }
    
    createLearningPath(userProfile) {
        const basePaths = {
            'head-coach': [
                'platform-overview',
                'team-dashboard-setup',
                'game-planning-tools',
                'player-analytics',
                'championship-insights',
                'advanced-features'
            ],
            'scout': [
                'platform-overview',
                'scouting-dashboard',
                'player-evaluation-tools',
                'comparison-analytics',
                'report-generation',
                'recruitment-pipeline'
            ],
            'analyst': [
                'platform-overview',
                'data-connections',
                'analysis-tools',
                'custom-reports',
                'api-access',
                'advanced-analytics'
            ]
        };
        
        let path = basePaths[userProfile.role] || basePaths['head-coach'];
        
        // Add sport-specific modules
        if (userProfile.primarySport) {
            path.splice(2, 0, `${userProfile.primarySport}-specific-features`);
        }
        
        return path.map((module, index) => ({
            module: module,
            order: index + 1,
            estimated_duration: this.getModuleDuration(module),
            prerequisites: index > 0 ? [path[index - 1]] : [],
            status: index === 0 ? 'active' : 'locked'
        }));
    }

    // Success Monitoring and Optimization
    async monitorClientSuccess(account) {
        const healthMetrics = await this.calculateHealthScore(account);
        const riskFactors = await this.identifyRiskFactors(account);
        const opportunities = await this.identifyGrowthOpportunities(account);
        
        const successAssessment = {
            accountId: account.id,
            healthScore: healthMetrics.overall,
            riskLevel: this.categorizeRisk(riskFactors),
            opportunities: opportunities,
            recommendations: this.generateRecommendations(healthMetrics, riskFactors, opportunities),
            nextActions: this.determineNextActions(healthMetrics, riskFactors),
            timestamp: new Date().toISOString()
        };
        
        // Trigger automated interventions if needed
        if (successAssessment.riskLevel === 'high') {
            await this.triggerRiskIntervention(account, successAssessment);
        }
        
        // Identify expansion opportunities
        if (opportunities.length > 0) {
            await this.triggerExpansionOutreach(account, opportunities);
        }
        
        // Log success assessment
        this.logOnboardingEvent(account.leadId, 'success_monitored', successAssessment);
        
        return successAssessment;
    }
    
    async calculateHealthScore(account) {
        const metrics = {
            usage: await this.getUsageMetrics(account),
            adoption: await this.getFeatureAdoption(account),
            engagement: await this.getEngagementMetrics(account),
            satisfaction: await this.getSatisfactionScore(account),
            value_realization: await this.getValueRealizationScore(account)
        };
        
        // Weight the metrics
        const weights = {
            usage: 0.25,
            adoption: 0.25,
            engagement: 0.2,
            satisfaction: 0.15,
            value_realization: 0.15
        };
        
        const overall = Object.keys(metrics).reduce((sum, key) => {
            return sum + (metrics[key] * weights[key]);
        }, 0);
        
        return {
            overall: Math.round(overall),
            breakdown: metrics,
            trend: await this.calculateHealthTrend(account)
        };
    }

    // Integration Management
    async triggerQualificationActions(qualification, leadData) {
        const actions = [];
        
        // HubSpot integration
        if (this.integrationAPIs.hubspot.enabled) {
            actions.push(this.syncToHubSpot(qualification, leadData));
        }
        
        // Slack notification for high-priority leads
        if (qualification.priority === 'enterprise' && this.integrationAPIs.slack.enabled) {
            actions.push(this.sendSlackNotification(qualification, leadData));
        }
        
        // Calendly scheduling for qualified leads
        if (qualification.priority !== 'standard' && this.integrationAPIs.calendly.enabled) {
            actions.push(this.scheduleCalendlyMeeting(qualification, leadData));
        }
        
        // Execute all actions in parallel
        await Promise.allSettled(actions);
    }
    
    async syncToHubSpot(qualification, leadData) {
        // Simulate HubSpot API call
        return fetch(this.integrationAPIs.hubspot.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contact: leadData,
                qualification: qualification,
                timestamp: new Date().toISOString()
            })
        });
    }
    
    async sendSlackNotification(qualification, leadData) {
        const message = {
            text: `🔥 High-Priority Lead Alert`,
            attachments: [{
                color: '#BF5700',
                fields: [
                    { title: 'Organization', value: leadData.organization || 'N/A', short: true },
                    { title: 'Role', value: leadData.role || 'N/A', short: true },
                    { title: 'Score', value: `${qualification.score}/100`, short: true },
                    { title: 'Priority', value: qualification.priority.toUpperCase(), short: true }
                ],
                actions: [{
                    type: 'button',
                    text: 'View Lead Details',
                    url: `${window.location.origin}/admin/leads/${qualification.leadId}`
                }]
            }]
        };
        
        return fetch(this.integrationAPIs.slack.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(message)
        });
    }

    // Utility Methods
    generateLeadId() {
        return 'lead_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    logOnboardingEvent(leadId, eventType, data) {
        const event = {
            leadId: leadId,
            eventType: eventType,
            data: data,
            timestamp: new Date().toISOString(),
            source: 'onboarding_automation'
        };
        
        // In production, this would write to a proper logging system
        console.log('Onboarding Event:', event);
        
        // Store in localStorage for demo purposes
        const events = JSON.parse(localStorage.getItem('onboarding_events') || '[]');
        events.push(event);
        localStorage.setItem('onboarding_events', JSON.stringify(events.slice(-100))); // Keep last 100 events
    }
    
    initializeEmailTemplates() {
        return {
            qualification_welcome: {
                subject: 'Welcome to Blaze Intelligence - Your Championship Journey Begins',
                template: 'qualification_welcome_template'
            },
            demo_invitation: {
                subject: 'Your Personalized Blaze Intelligence Demo is Ready',
                template: 'demo_invitation_template'
            },
            account_created: {
                subject: 'Your Blaze Intelligence Account is Live - Let\'s Get Started',
                template: 'account_created_template'
            },
            training_welcome: {
                subject: 'Master Blaze Intelligence: Your Training Program Begins',
                template: 'training_welcome_template'
            }
        };
    }
    
    initializeDemoTemplates() {
        return {
            coach: 'demo_config_coach',
            scout: 'demo_config_scout',
            analyst: 'demo_config_analyst',
            gm: 'demo_config_gm'
        };
    }
    
    initializeTrainingTemplates() {
        return {
            welcome_sequence: 'training_welcome_sequence',
            role_specific: {
                coach: 'training_coach_path',
                scout: 'training_scout_path',
                analyst: 'training_analyst_path'
            }
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ClientOnboardingSystem;
} else {
    window.ClientOnboardingSystem = ClientOnboardingSystem;
}