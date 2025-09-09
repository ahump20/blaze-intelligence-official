/**
 * Blaze Intelligence Client Onboarding Automation System
 * Automated workflow for seamless client integration and success
 */

class BlazeClientOnboardingSystem {
    constructor(config = {}) {
        this.config = {
            apiEndpoint: 'https://api.blaze-intelligence.com',
            hubspotApiKey: config.hubspotApiKey || null,
            slackWebhookUrl: config.slackWebhookUrl || null,
            emailApiKey: config.emailApiKey || null,
            calendarApiKey: config.calendarApiKey || null,
            stripeApiKey: config.stripeApiKey || null,
            debugMode: config.debugMode || false,
            autoProgressTracking: true,
            autoTaskCreation: true,
            autoNotifications: true,
            ...config
        };
        
        // Onboarding workflow stages
        this.onboardingStages = {
            'LEAD_QUALIFICATION': {
                order: 1,
                name: 'Lead Qualification',
                duration: '1-3 days',
                tasks: ['initial_contact', 'needs_assessment', 'demo_scheduling'],
                automations: ['welcome_email', 'demo_calendar_invite', 'preparation_materials']
            },
            'DEMO_PRESENTATION': {
                order: 2,
                name: 'Demo & Presentation',
                duration: '1-2 weeks',
                tasks: ['demo_delivery', 'technical_deep_dive', 'proposal_creation'],
                automations: ['demo_follow_up', 'proposal_generation', 'stakeholder_introduction']
            },
            'NEGOTIATION_CONTRACT': {
                order: 3,
                name: 'Contract Negotiation',
                duration: '1-4 weeks',
                tasks: ['contract_review', 'legal_approval', 'pricing_finalization'],
                automations: ['contract_templates', 'legal_notifications', 'approval_tracking']
            },
            'TECHNICAL_SETUP': {
                order: 4,
                name: 'Technical Implementation',
                duration: '2-6 weeks',
                tasks: ['system_provisioning', 'data_integration', 'custom_configuration'],
                automations: ['environment_creation', 'api_key_generation', 'integration_testing']
            },
            'USER_TRAINING': {
                order: 5,
                name: 'Training & Education',
                duration: '1-2 weeks',
                tasks: ['admin_training', 'user_workshops', 'documentation_delivery'],
                automations: ['training_scheduling', 'material_preparation', 'completion_tracking']
            },
            'GO_LIVE': {
                order: 6,
                name: 'Production Launch',
                duration: '1 week',
                tasks: ['final_testing', 'production_cutover', 'launch_support'],
                automations: ['health_monitoring', 'success_metrics', 'launch_celebration']
            },
            'SUCCESS_OPTIMIZATION': {
                order: 7,
                name: 'Success & Growth',
                duration: 'Ongoing',
                tasks: ['performance_monitoring', 'optimization_recommendations', 'expansion_planning'],
                automations: ['usage_analytics', 'success_reporting', 'upsell_identification']
            }
        };
        
        // Task templates for each stage
        this.taskTemplates = {
            // Lead Qualification Tasks
            'initial_contact': {
                title: 'Send Welcome & Next Steps Email',
                description: 'Personalized welcome email with timeline and next steps',
                assignee: 'sales_team',
                priority: 'high',
                dueHours: 2
            },
            'needs_assessment': {
                title: 'Conduct Needs Assessment Call',
                description: 'Deep dive into requirements, challenges, and success criteria',
                assignee: 'sales_team',
                priority: 'high',
                dueHours: 48
            },
            'demo_scheduling': {
                title: 'Schedule Customized Demo',
                description: 'Book demo session with key stakeholders',
                assignee: 'sales_team',
                priority: 'medium',
                dueHours: 72
            },
            
            // Demo Presentation Tasks
            'demo_delivery': {
                title: 'Deliver Customized Demo',
                description: 'Present platform capabilities tailored to client needs',
                assignee: 'sales_team',
                priority: 'high',
                dueHours: 0 // On scheduled time
            },
            'technical_deep_dive': {
                title: 'Technical Architecture Discussion',
                description: 'Detailed technical session with IT/Analytics teams',
                assignee: 'technical_team',
                priority: 'medium',
                dueHours: 168 // 1 week
            },
            'proposal_creation': {
                title: 'Generate Formal Proposal',
                description: 'Create detailed proposal with pricing and implementation plan',
                assignee: 'sales_team',
                priority: 'high',
                dueHours: 72
            },
            
            // Contract Tasks
            'contract_review': {
                title: 'Contract Terms Review',
                description: 'Review and negotiate contract terms with client legal',
                assignee: 'legal_team',
                priority: 'high',
                dueHours: 168
            },
            'legal_approval': {
                title: 'Internal Legal Approval',
                description: 'Get internal legal team approval for contract terms',
                assignee: 'legal_team',
                priority: 'medium',
                dueHours: 120
            },
            'pricing_finalization': {
                title: 'Finalize Pricing Structure',
                description: 'Confirm final pricing and payment terms',
                assignee: 'sales_team',
                priority: 'high',
                dueHours: 48
            },
            
            // Technical Setup Tasks
            'system_provisioning': {
                title: 'Provision Client Environment',
                description: 'Set up dedicated client instance with initial configuration',
                assignee: 'technical_team',
                priority: 'high',
                dueHours: 48
            },
            'data_integration': {
                title: 'Configure Data Integrations',
                description: 'Set up data feeds and API connections',
                assignee: 'technical_team',
                priority: 'high',
                dueHours: 168
            },
            'custom_configuration': {
                title: 'Apply Custom Configurations',
                description: 'Implement client-specific settings and branding',
                assignee: 'technical_team',
                priority: 'medium',
                dueHours: 72
            },
            
            // Training Tasks
            'admin_training': {
                title: 'Administrator Training Session',
                description: 'Train client administrators on platform management',
                assignee: 'success_team',
                priority: 'high',
                dueHours: 168
            },
            'user_workshops': {
                title: 'End User Training Workshops',
                description: 'Conduct user training sessions for key features',
                assignee: 'success_team',
                priority: 'high',
                dueHours: 72
            },
            'documentation_delivery': {
                title: 'Deliver Training Materials',
                description: 'Provide comprehensive documentation and resources',
                assignee: 'success_team',
                priority: 'medium',
                dueHours: 24
            },
            
            // Go-Live Tasks
            'final_testing': {
                title: 'Final End-to-End Testing',
                description: 'Comprehensive testing of all integrations and features',
                assignee: 'technical_team',
                priority: 'high',
                dueHours: 48
            },
            'production_cutover': {
                title: 'Production Environment Cutover',
                description: 'Switch to production environment and go live',
                assignee: 'technical_team',
                priority: 'critical',
                dueHours: 24
            },
            'launch_support': {
                title: 'Launch Week Support Coverage',
                description: 'Dedicated support coverage during first week',
                assignee: 'success_team',
                priority: 'high',
                dueHours: 0
            }
        };
        
        // Email templates for automation
        this.emailTemplates = {
            'welcome_qualified_lead': {
                subject: '🔥 Welcome to Blaze Intelligence - Next Steps Inside',
                template: `
                Hi {{firstName}},

                Thank you for your interest in Blaze Intelligence! Based on your submission, I can see that {{organizationType}} organizations like {{company}} are exactly who we built our platform for.

                **Your Next Steps:**
                1. **Demo Scheduling** - I'll send you a calendar link within the next 2 hours
                2. **Preparation Materials** - You'll receive customized demo materials for {{sport}} analytics
                3. **Technical Deep Dive** - We can arrange a technical session with your IT team if needed

                **What Makes Us Different:**
                • 94.6% predictive accuracy with real-time processing
                • {{sport}} specific analytics with injury prevention (89% accuracy)
                • Complete platform - not just another dashboard

                Based on your timeline of {{implementationTimeline}}, we can have you live and operational quickly.

                I'll be your dedicated contact throughout this process. Feel free to reply with any questions.

                Best regards,
                Austin Humphrey
                Founder & CEO, Blaze Intelligence
                📧 ahump20@outlook.com | 📱 (210) 273-5538
                `
            },
            'demo_confirmation': {
                subject: '📊 Your Blaze Intelligence Demo is Confirmed - {{demoDate}}',
                template: `
                Hi {{firstName}},

                Your Blaze Intelligence demo is confirmed for:
                **{{demoDate}} at {{demoTime}}**

                **What We'll Cover:**
                • Live platform demonstration with {{sport}} data
                • Injury prevention capabilities (89% accuracy)
                • ROI calculator based on your {{budgetRange}} budget
                • Custom integration options for {{organizationType}} organizations

                **To Prepare:**
                1. Review the attached pre-demo materials
                2. Invite key stakeholders (recommend: {{recommendedAttendees}})
                3. Prepare 2-3 specific use cases you'd like to see

                **Meeting Details:**
                📅 {{demoDate}} at {{demoTime}}
                💻 Zoom Link: {{zoomLink}}
                📞 Dial-in: {{dialIn}}

                Looking forward to showing you how we can transform {{company}}'s analytics capabilities!

                Austin Humphrey
                Founder & CEO, Blaze Intelligence
                `
            },
            'post_demo_follow_up': {
                subject: '🚀 Next Steps After Your Blaze Intelligence Demo',
                template: `
                Hi {{firstName}},

                Thank you for the excellent demo session today! It was great discussing how Blaze Intelligence can help {{company}} achieve {{specificGoals}}.

                **What's Next:**
                1. **Proposal Generation** - I'm preparing a detailed proposal based on our discussion (arriving within 48 hours)
                2. **Technical Deep Dive** - {{technicalContact}} can schedule a technical session with our architects
                3. **Reference Calls** - I can arrange calls with similar {{organizationType}} clients

                **Key Points from Our Discussion:**
                • Potential ROI: {{estimatedROI}} annually through injury prevention
                • Implementation timeline: {{agreedTimeline}}
                • Integration requirements: {{integrationNeeds}}

                **Immediate Next Step:**
                Reply to this email with your preferred timeline for receiving the proposal and any additional requirements we discussed.

                Best regards,
                Austin Humphrey
                `
            },
            'contract_signed_welcome': {
                subject: '🎉 Welcome to Blaze Intelligence - Implementation Begins!',
                template: `
                Hi {{firstName}},

                Welcome to the Blaze Intelligence family! We're thrilled to partner with {{company}} on this championship-level analytics transformation.

                **Your Implementation Team:**
                • **Project Manager:** {{projectManager}} - Your single point of contact
                • **Technical Lead:** {{technicalLead}} - System setup and integrations
                • **Success Manager:** {{successManager}} - Training and optimization

                **Implementation Timeline:**
                • **Week 1-2:** System provisioning and data integration setup
                • **Week 3-4:** Custom configuration and testing
                • **Week 5:** User training and documentation
                • **Week 6:** Production launch and go-live support

                **Next Steps:**
                1. {{projectManager}} will contact you within 24 hours to schedule the kickoff call
                2. You'll receive access to our client portal for project tracking
                3. Technical requirements gathering will begin this week

                We're committed to your success and will be with you every step of the way.

                Welcome aboard!
                Austin Humphrey & The Blaze Intelligence Team
                `
            }
        };
        
        this.clients = JSON.parse(localStorage.getItem('blaze_clients') || '[]');
        this.workflows = JSON.parse(localStorage.getItem('blaze_workflows') || '{}');
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.initializeStorage();
        
        if (this.config.debugMode) {
            console.log('Blaze Client Onboarding System initialized');
        }
    }
    
    setupEventListeners() {
        // Listen for lead qualification events
        document.addEventListener('lead_qualified', (e) => {
            this.initiateOnboarding(e.detail);
        });
        
        // Listen for demo completed events
        document.addEventListener('demo_completed', (e) => {
            this.progressWorkflow(e.detail.clientId, 'DEMO_PRESENTATION');
        });
        
        // Listen for contract signed events
        document.addEventListener('contract_signed', (e) => {
            this.progressWorkflow(e.detail.clientId, 'TECHNICAL_SETUP');
        });
    }
    
    initializeStorage() {
        this.storage = {
            clients: JSON.parse(localStorage.getItem('blaze_clients') || '[]'),
            workflows: JSON.parse(localStorage.getItem('blaze_workflows') || '{}'),
            tasks: JSON.parse(localStorage.getItem('blaze_tasks') || '[]'),
            communications: JSON.parse(localStorage.getItem('blaze_communications') || '[]')
        };
    }
    
    // Main method to initiate onboarding for a qualified lead
    initiateOnboarding(leadData) {
        const clientId = this.generateClientId();
        
        const client = {
            id: clientId,
            ...leadData,
            onboardingStartDate: new Date().toISOString(),
            currentStage: 'LEAD_QUALIFICATION',
            stageHistory: [{
                stage: 'LEAD_QUALIFICATION',
                enteredAt: new Date().toISOString(),
                status: 'active'
            }],
            assignedTeam: this.assignTeamMembers(leadData),
            customizations: this.identifyCustomizations(leadData),
            successCriteria: this.defineSuccessCriteria(leadData)
        };
        
        // Store client
        this.storage.clients.push(client);
        
        // Create workflow
        const workflow = this.createWorkflow(client);
        this.storage.workflows[clientId] = workflow;
        
        // Generate initial tasks
        this.generateStageTasks(clientId, 'LEAD_QUALIFICATION');
        
        // Trigger initial automations
        this.executeStageAutomations(clientId, 'LEAD_QUALIFICATION');
        
        // Save to storage
        this.saveToStorage();
        
        // Send notifications
        this.notifyTeam(client, 'onboarding_initiated');
        
        if (this.config.debugMode) {
            console.log('Onboarding initiated for client:', client);
        }
        
        return clientId;
    }
    
    createWorkflow(client) {
        const workflow = {
            clientId: client.id,
            createdAt: new Date().toISOString(),
            estimatedCompletionDate: this.calculateEstimatedCompletion(client),
            stages: {},
            overallProgress: 0,
            currentStage: 'LEAD_QUALIFICATION',
            customizations: client.customizations,
            risks: [],
            successMetrics: client.successCriteria
        };
        
        // Initialize all stages
        Object.entries(this.onboardingStages).forEach(([stageKey, stageConfig]) => {
            workflow.stages[stageKey] = {
                ...stageConfig,
                status: stageKey === 'LEAD_QUALIFICATION' ? 'active' : 'pending',
                startDate: stageKey === 'LEAD_QUALIFICATION' ? new Date().toISOString() : null,
                completedDate: null,
                tasksGenerated: stageKey === 'LEAD_QUALIFICATION',
                automationsExecuted: stageKey === 'LEAD_QUALIFICATION',
                progress: 0
            };
        });
        
        return workflow;
    }
    
    generateStageTasks(clientId, stageKey) {
        const client = this.getClient(clientId);
        const stageConfig = this.onboardingStages[stageKey];
        
        stageConfig.tasks.forEach(taskKey => {
            const taskTemplate = this.taskTemplates[taskKey];
            if (!taskTemplate) return;
            
            const task = {
                id: this.generateTaskId(),
                clientId: clientId,
                stage: stageKey,
                taskKey: taskKey,
                title: this.personalizeTemplate(taskTemplate.title, client),
                description: this.personalizeTemplate(taskTemplate.description, client),
                assignee: taskTemplate.assignee,
                priority: taskTemplate.priority,
                status: 'pending',
                createdAt: new Date().toISOString(),
                dueDate: this.calculateDueDate(taskTemplate.dueHours),
                dependencies: taskTemplate.dependencies || [],
                automationTriggers: taskTemplate.automationTriggers || []
            };
            
            this.storage.tasks.push(task);
        });
        
        if (this.config.debugMode) {
            console.log(`Generated ${stageConfig.tasks.length} tasks for stage ${stageKey}`);
        }
    }
    
    executeStageAutomations(clientId, stageKey) {
        const client = this.getClient(clientId);
        const stageConfig = this.onboardingStages[stageKey];
        
        stageConfig.automations.forEach(automationKey => {
            this.executeAutomation(automationKey, client);
        });
        
        // Mark automations as executed
        this.storage.workflows[clientId].stages[stageKey].automationsExecuted = true;
        this.saveToStorage();
    }
    
    executeAutomation(automationKey, client) {
        switch (automationKey) {
            case 'welcome_email':
                this.sendAutomatedEmail('welcome_qualified_lead', client);
                break;
                
            case 'demo_calendar_invite':
                this.scheduleDemo(client);
                break;
                
            case 'preparation_materials':
                this.sendPreparationMaterials(client);
                break;
                
            case 'demo_follow_up':
                // Schedule follow-up email for after demo
                setTimeout(() => {
                    this.sendAutomatedEmail('post_demo_follow_up', client);
                }, 2 * 60 * 60 * 1000); // 2 hours after demo
                break;
                
            case 'proposal_generation':
                this.generateProposal(client);
                break;
                
            case 'contract_templates':
                this.generateContractTemplates(client);
                break;
                
            case 'environment_creation':
                this.provisionClientEnvironment(client);
                break;
                
            case 'training_scheduling':
                this.scheduleTraining(client);
                break;
                
            case 'health_monitoring':
                this.setupHealthMonitoring(client);
                break;
                
            case 'success_reporting':
                this.setupSuccessReporting(client);
                break;
                
            default:
                if (this.config.debugMode) {
                    console.log(`Unknown automation: ${automationKey}`);
                }
        }
    }
    
    sendAutomatedEmail(templateKey, client) {
        const template = this.emailTemplates[templateKey];
        if (!template) {
            console.error(`Email template not found: ${templateKey}`);
            return;
        }
        
        const email = {
            to: client.email,
            subject: this.personalizeTemplate(template.subject, client),
            body: this.personalizeTemplate(template.template, client),
            templateKey: templateKey,
            clientId: client.id,
            sentAt: new Date().toISOString()
        };
        
        // Store communication record
        this.storage.communications.push(email);
        
        // Send via email service (implement with actual service)
        this.sendEmail(email);
        
        if (this.config.debugMode) {
            console.log(`Automated email sent: ${templateKey} to ${client.email}`);
        }
    }
    
    personalizeTemplate(template, client) {
        let personalized = template;
        
        // Replace client-specific variables
        const replacements = {
            '{{firstName}}': client.firstName || client.name?.split(' ')[0] || 'there',
            '{{lastName}}': client.lastName || client.name?.split(' ').slice(1).join(' ') || '',
            '{{company}}': client.company || 'your organization',
            '{{organizationType}}': client.organizationType || 'sports organization',
            '{{sport}}': client.sport || 'multi-sport',
            '{{jobTitle}}': client.jobTitle || 'your role',
            '{{budgetRange}}': client.budgetRange || 'budget range',
            '{{implementationTimeline}}': client.implementationTimeline || 'timeline',
            '{{currentChallenges}}': Array.isArray(client.currentChallenges) 
                ? client.currentChallenges.join(', ') 
                : client.currentChallenges || 'operational challenges',
            '{{specificNeeds}}': client.specificNeeds || 'your requirements'
        };
        
        Object.entries(replacements).forEach(([placeholder, value]) => {
            personalized = personalized.replace(new RegExp(placeholder.replace(/[{}]/g, '\\$&'), 'g'), value);
        });
        
        return personalized;
    }
    
    progressWorkflow(clientId, completedStage) {
        const workflow = this.storage.workflows[clientId];
        if (!workflow) return;
        
        // Mark current stage as completed
        workflow.stages[completedStage].status = 'completed';
        workflow.stages[completedStage].completedDate = new Date().toISOString();
        workflow.stages[completedStage].progress = 100;
        
        // Find next stage
        const stageOrder = Object.entries(this.onboardingStages)
            .sort((a, b) => a[1].order - b[1].order);
        
        const currentIndex = stageOrder.findIndex(([key]) => key === completedStage);
        const nextStage = currentIndex < stageOrder.length - 1 ? stageOrder[currentIndex + 1][0] : null;
        
        if (nextStage) {
            // Activate next stage
            workflow.stages[nextStage].status = 'active';
            workflow.stages[nextStage].startDate = new Date().toISOString();
            workflow.currentStage = nextStage;
            
            // Generate tasks for next stage
            this.generateStageTasks(clientId, nextStage);
            
            // Execute automations for next stage
            this.executeStageAutomations(clientId, nextStage);
            
            // Update client record
            const client = this.getClient(clientId);
            if (client) {
                client.currentStage = nextStage;
                client.stageHistory.push({
                    stage: nextStage,
                    enteredAt: new Date().toISOString(),
                    status: 'active'
                });
            }
            
            // Notify team
            this.notifyTeam(client, 'stage_progressed', { from: completedStage, to: nextStage });
            
            if (this.config.debugMode) {
                console.log(`Workflow progressed: ${completedStage} → ${nextStage}`);
            }
        } else {
            // Onboarding completed
            workflow.status = 'completed';
            workflow.completedDate = new Date().toISOString();
            
            const client = this.getClient(clientId);
            if (client) {
                client.onboardingStatus = 'completed';
                client.onboardingCompletedDate = new Date().toISOString();
            }
            
            this.notifyTeam(client, 'onboarding_completed');
            this.triggerSuccessTracking(clientId);
        }
        
        // Update overall progress
        this.updateOverallProgress(clientId);
        this.saveToStorage();
    }
    
    updateOverallProgress(clientId) {
        const workflow = this.storage.workflows[clientId];
        if (!workflow) return;
        
        const totalStages = Object.keys(this.onboardingStages).length;
        const completedStages = Object.values(workflow.stages).filter(stage => stage.status === 'completed').length;
        const currentStageProgress = workflow.stages[workflow.currentStage]?.progress || 0;
        
        workflow.overallProgress = Math.round(
            ((completedStages + (currentStageProgress / 100)) / totalStages) * 100
        );
    }
    
    // Utility methods for specific automations
    scheduleDemo(client) {
        // Integration with calendar systems
        const demoSlots = this.findAvailableSlots(client.implementationTimeline);
        
        // Create calendar invite (implement with calendar API)
        const demoEvent = {
            clientId: client.id,
            type: 'demo',
            title: `Blaze Intelligence Demo - ${client.company}`,
            description: `Customized demo for ${client.organizationType} focusing on ${client.sport} analytics`,
            duration: 60, // minutes
            attendees: [client.email],
            suggestedSlots: demoSlots
        };
        
        // Store and send calendar invite
        this.createCalendarEvent(demoEvent);
        
        if (this.config.debugMode) {
            console.log('Demo scheduled for client:', client.id);
        }
    }
    
    generateProposal(client) {
        const proposal = {
            clientId: client.id,
            generatedAt: new Date().toISOString(),
            pricing: this.calculatePricing(client),
            implementation: this.createImplementationPlan(client),
            timeline: this.createProjectTimeline(client),
            roi: this.calculateROI(client),
            terms: this.generateTerms(client)
        };
        
        // Store proposal
        this.storage.proposals = this.storage.proposals || [];
        this.storage.proposals.push(proposal);
        
        // Generate PDF and send
        this.generateProposalPDF(proposal);
        
        if (this.config.debugMode) {
            console.log('Proposal generated for client:', client.id);
        }
    }
    
    provisionClientEnvironment(client) {
        const environment = {
            clientId: client.id,
            subdomain: this.generateSubdomain(client.company),
            apiKeys: this.generateAPIKeys(),
            databases: this.setupDatabases(client),
            integrations: this.configureIntegrations(client),
            customizations: this.applyCustomizations(client),
            provisioned: new Date().toISOString()
        };
        
        // Store environment config
        this.storage.environments = this.storage.environments || {};
        this.storage.environments[client.id] = environment;
        
        if (this.config.debugMode) {
            console.log('Environment provisioned for client:', client.id);
        }
        
        return environment;
    }
    
    // Team assignment based on client characteristics
    assignTeamMembers(leadData) {
        const team = {
            projectManager: 'Austin Humphrey', // Default PM
            technicalLead: this.assignTechnicalLead(leadData),
            successManager: this.assignSuccessManager(leadData),
            supportEngineer: this.assignSupportEngineer(leadData)
        };
        
        // Assign based on organization size/complexity
        if (leadData.organizationType === 'Professional Sports Team') {
            team.dedicatedSupport = true;
            team.executiveSponsor = 'Austin Humphrey';
        }
        
        return team;
    }
    
    // Identify required customizations
    identifyCustomizations(leadData) {
        const customizations = [];
        
        // Sport-specific customizations
        if (leadData.sport === 'baseball') {
            customizations.push('mlb_integration', 'statcast_data', 'pitch_tracking');
        } else if (leadData.sport === 'football') {
            customizations.push('nfl_integration', 'next_gen_stats', 'injury_tracking');
        } else if (leadData.sport === 'basketball') {
            customizations.push('nba_integration', 'sportvu_data', 'shot_tracking');
        }
        
        // Organization-specific customizations
        if (leadData.organizationType === 'Professional Sports Team') {
            customizations.push('enterprise_sso', 'custom_branding', 'dedicated_support');
        } else if (leadData.organizationType.includes('NCAA')) {
            customizations.push('academic_reporting', 'compliance_tools', 'recruiting_analytics');
        }
        
        // Challenge-specific customizations
        if (leadData.currentChallenges?.includes('injury')) {
            customizations.push('advanced_injury_prediction', 'recovery_tracking');
        }
        
        return customizations;
    }
    
    // Helper methods
    generateClientId() {
        return 'client_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    generateTaskId() {
        return 'task_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }
    
    calculateDueDate(hours) {
        return new Date(Date.now() + (hours * 60 * 60 * 1000)).toISOString();
    }
    
    calculateEstimatedCompletion(client) {
        // Base timeline: 8-12 weeks depending on complexity
        let weeks = 8;
        
        // Adjust based on organization type
        if (client.organizationType === 'Professional Sports Team') {
            weeks += 4; // More complex requirements
        } else if (client.organizationType?.includes('High School')) {
            weeks -= 2; // Simpler setup
        }
        
        // Adjust based on customizations
        weeks += Math.floor(client.customizations.length / 3);
        
        return new Date(Date.now() + (weeks * 7 * 24 * 60 * 60 * 1000)).toISOString();
    }
    
    getClient(clientId) {
        return this.storage.clients.find(client => client.id === clientId);
    }
    
    saveToStorage() {
        localStorage.setItem('blaze_clients', JSON.stringify(this.storage.clients));
        localStorage.setItem('blaze_workflows', JSON.stringify(this.storage.workflows));
        localStorage.setItem('blaze_tasks', JSON.stringify(this.storage.tasks));
        localStorage.setItem('blaze_communications', JSON.stringify(this.storage.communications));
        
        if (this.storage.proposals) {
            localStorage.setItem('blaze_proposals', JSON.stringify(this.storage.proposals));
        }
        if (this.storage.environments) {
            localStorage.setItem('blaze_environments', JSON.stringify(this.storage.environments));
        }
    }
    
    // Notification methods
    notifyTeam(client, eventType, metadata = {}) {
        const notification = {
            clientId: client.id,
            eventType: eventType,
            client: {
                name: client.name,
                company: client.company,
                organizationType: client.organizationType
            },
            metadata: metadata,
            timestamp: new Date().toISOString()
        };
        
        // Send to Slack if configured
        if (this.config.slackWebhookUrl) {
            this.sendSlackNotification(notification);
        }
        
        // Create internal notification
        this.createInternalNotification(notification);
    }
    
    sendSlackNotification(notification) {
        const messages = {
            'onboarding_initiated': `🚀 New client onboarding started: **${notification.client.company}** (${notification.client.organizationType})`,
            'stage_progressed': `📈 ${notification.client.company} progressed: ${notification.metadata.from} → ${notification.metadata.to}`,
            'onboarding_completed': `🎉 ${notification.client.company} onboarding completed! Client is now live.`,
            'task_overdue': `⚠️ Overdue task for ${notification.client.company}: ${notification.metadata.taskTitle}`,
            'risk_identified': `🚨 Risk identified for ${notification.client.company}: ${notification.metadata.riskDescription}`
        };
        
        const message = messages[notification.eventType] || `📋 Update for ${notification.client.company}`;
        
        const payload = {
            text: message,
            channel: '#client-onboarding',
            username: 'Blaze Onboarding Bot'
        };
        
        fetch(this.config.slackWebhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(error => {
            console.error('Failed to send Slack notification:', error);
        });
    }
    
    // Public API methods
    getClientWorkflow(clientId) {
        return this.storage.workflows[clientId];
    }
    
    getClientTasks(clientId, stage = null) {
        let tasks = this.storage.tasks.filter(task => task.clientId === clientId);
        if (stage) {
            tasks = tasks.filter(task => task.stage === stage);
        }
        return tasks;
    }
    
    completeTask(taskId) {
        const task = this.storage.tasks.find(t => t.id === taskId);
        if (task) {
            task.status = 'completed';
            task.completedAt = new Date().toISOString();
            
            // Check if stage is complete
            this.checkStageCompletion(task.clientId, task.stage);
            
            this.saveToStorage();
        }
    }
    
    checkStageCompletion(clientId, stage) {
        const stageTasks = this.getClientTasks(clientId, stage);
        const completedTasks = stageTasks.filter(task => task.status === 'completed');
        
        if (completedTasks.length === stageTasks.length && stageTasks.length > 0) {
            this.progressWorkflow(clientId, stage);
        }
    }
    
    getOnboardingStats() {
        const stats = {
            totalClients: this.storage.clients.length,
            activeOnboardings: 0,
            completedOnboardings: 0,
            averageTimeToComplete: 0,
            stageDistribution: {},
            taskStats: {
                total: this.storage.tasks.length,
                pending: 0,
                inProgress: 0,
                completed: 0,
                overdue: 0
            }
        };
        
        // Calculate client stats
        this.storage.clients.forEach(client => {
            if (client.onboardingStatus === 'completed') {
                stats.completedOnboardings++;
            } else {
                stats.activeOnboardings++;
            }
            
            // Stage distribution
            const stage = client.currentStage;
            stats.stageDistribution[stage] = (stats.stageDistribution[stage] || 0) + 1;
        });
        
        // Calculate task stats
        this.storage.tasks.forEach(task => {
            stats.taskStats[task.status]++;
            
            if (task.status === 'pending' && new Date(task.dueDate) < new Date()) {
                stats.taskStats.overdue++;
            }
        });
        
        return stats;
    }
    
    // Stub methods for external integrations (implement with actual services)
    sendEmail(email) {
        // Implement with email service (SendGrid, Mailgun, etc.)
        if (this.config.debugMode) {
            console.log('Email sent:', email);
        }
    }
    
    createCalendarEvent(event) {
        // Implement with calendar service (Google Calendar, Outlook, etc.)
        if (this.config.debugMode) {
            console.log('Calendar event created:', event);
        }
    }
    
    generateProposalPDF(proposal) {
        // Implement with PDF generation service
        if (this.config.debugMode) {
            console.log('Proposal PDF generated:', proposal.clientId);
        }
    }
    
    // Additional stub methods for team assignment
    assignTechnicalLead(leadData) {
        // Logic to assign technical lead based on requirements
        return 'Technical Team Lead';
    }
    
    assignSuccessManager(leadData) {
        // Logic to assign success manager
        return 'Customer Success Manager';
    }
    
    assignSupportEngineer(leadData) {
        // Logic to assign support engineer
        return 'Support Engineer';
    }
}

// Initialize the onboarding system
document.addEventListener('DOMContentLoaded', function() {
    window.BlazeOnboardingSystem = new BlazeClientOnboardingSystem({
        debugMode: false, // Set to true for development
        autoProgressTracking: true,
        autoTaskCreation: true,
        autoNotifications: true
        // Add API keys in production:
        // hubspotApiKey: 'your_hubspot_key',
        // slackWebhookUrl: 'your_slack_webhook',
        // emailApiKey: 'your_email_service_key',
        // calendarApiKey: 'your_calendar_api_key'
    });
    
    console.log('Blaze Client Onboarding System initialized');
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeClientOnboardingSystem;
}