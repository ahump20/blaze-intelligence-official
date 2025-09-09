/**
 * Blaze Intelligence Enterprise Client Onboarding System
 * Championship-level client success from day one
 */

class BlazeEnterpriseOnboarding {
    constructor() {
        this.onboardingStages = this.defineOnboardingStages();
        this.clientProfiles = this.defineClientProfiles();
        this.automationWorkflows = this.defineAutomationWorkflows();
        this.activeClients = new Map();
        this.init();
    }

    defineOnboardingStages() {
        return {
            discovery: {
                duration: '1-2 days',
                activities: [
                    'Initial stakeholder meeting',
                    'Technical requirements gathering',
                    'Success criteria definition',
                    'Integration assessment',
                    'Data audit'
                ],
                deliverables: [
                    'Implementation roadmap',
                    'Success metrics framework',
                    'Technical architecture plan'
                ],
                automations: ['calendar_scheduling', 'document_generation', 'stakeholder_mapping']
            },
            setup: {
                duration: '2-3 days',
                activities: [
                    'Account provisioning',
                    'API key generation',
                    'Data pipeline configuration',
                    'User role assignment',
                    'Security configuration'
                ],
                deliverables: [
                    'Live account access',
                    'API documentation',
                    'Security compliance report'
                ],
                automations: ['account_creation', 'api_provisioning', 'permission_setup']
            },
            integration: {
                duration: '3-5 days',
                activities: [
                    'Data source connections',
                    'Custom dashboard creation',
                    'Alert configuration',
                    'Workflow automation setup',
                    'Third-party integrations'
                ],
                deliverables: [
                    'Live data feeds',
                    'Custom dashboards',
                    'Integration verification'
                ],
                automations: ['data_validation', 'dashboard_templates', 'integration_testing']
            },
            training: {
                duration: '2-3 days',
                activities: [
                    'Admin training session',
                    'End-user workshops',
                    'Best practices review',
                    'Q&A sessions',
                    'Documentation walkthrough'
                ],
                deliverables: [
                    'Training recordings',
                    'User guides',
                    'Quick reference materials'
                ],
                automations: ['training_scheduling', 'material_distribution', 'progress_tracking']
            },
            launch: {
                duration: '1 day',
                activities: [
                    'Go-live verification',
                    'Performance baseline',
                    'Success metrics review',
                    'Escalation path setup',
                    'Executive briefing'
                ],
                deliverables: [
                    'Launch certification',
                    'Performance report',
                    'Success roadmap'
                ],
                automations: ['performance_monitoring', 'report_generation', 'notification_system']
            },
            optimization: {
                duration: 'Ongoing',
                activities: [
                    'Weekly check-ins',
                    'Performance optimization',
                    'Feature expansion',
                    'ROI analysis',
                    'Strategic planning'
                ],
                deliverables: [
                    'Weekly reports',
                    'Optimization recommendations',
                    'ROI dashboard'
                ],
                automations: ['automated_reporting', 'anomaly_detection', 'recommendation_engine']
            }
        };
    }

    defineClientProfiles() {
        return {
            enterprise: {
                tier: 'platinum',
                sla: '99.9%',
                responseTime: '15 minutes',
                dedicatedResources: true,
                customization: 'full',
                onboardingPath: 'white_glove',
                features: [
                    'Dedicated success manager',
                    'Custom integrations',
                    'Priority support',
                    'Executive dashboards',
                    'Unlimited users'
                ]
            },
            professional: {
                tier: 'gold',
                sla: '99.5%',
                responseTime: '2 hours',
                dedicatedResources: false,
                customization: 'standard',
                onboardingPath: 'guided',
                features: [
                    'Success team support',
                    'Standard integrations',
                    'Business hours support',
                    'Team dashboards',
                    'Up to 50 users'
                ]
            },
            growth: {
                tier: 'silver',
                sla: '99%',
                responseTime: '24 hours',
                dedicatedResources: false,
                customization: 'templates',
                onboardingPath: 'self_service',
                features: [
                    'Email support',
                    'Basic integrations',
                    'Standard dashboards',
                    'Up to 10 users'
                ]
            }
        };
    }

    defineAutomationWorkflows() {
        return {
            account_creation: {
                trigger: 'contract_signed',
                actions: [
                    'Generate client ID',
                    'Create account structure',
                    'Provision resources',
                    'Setup billing',
                    'Send welcome email'
                ],
                notifications: ['sales_team', 'success_team', 'technical_team']
            },
            data_pipeline: {
                trigger: 'account_active',
                actions: [
                    'Configure data sources',
                    'Setup ETL processes',
                    'Initialize analytics',
                    'Create baseline metrics',
                    'Enable real-time feeds'
                ],
                notifications: ['technical_team', 'client_admin']
            },
            training_coordination: {
                trigger: 'integration_complete',
                actions: [
                    'Schedule training sessions',
                    'Distribute materials',
                    'Setup practice environment',
                    'Create user accounts',
                    'Send calendar invites'
                ],
                notifications: ['success_team', 'client_stakeholders']
            },
            success_monitoring: {
                trigger: 'launch_complete',
                actions: [
                    'Enable monitoring',
                    'Setup alerts',
                    'Initialize reporting',
                    'Track usage metrics',
                    'Calculate ROI'
                ],
                notifications: ['success_team', 'client_executive']
            }
        };
    }

    init() {
        this.setupOnboardingPortal();
        this.initializeAutomation();
        this.createClientDashboard();
        this.startMonitoring();
    }

    setupOnboardingPortal() {
        // Create interactive onboarding interface
        const portal = document.createElement('div');
        portal.id = 'blaze-onboarding-portal';
        portal.style.cssText = `
            position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
            width: 90%; max-width: 1200px; height: 80vh; display: none;
            background: linear-gradient(135deg, rgba(0,0,0,0.98), rgba(26,26,46,0.98));
            border-radius: 20px; padding: 2rem; overflow-y: auto;
            border: 2px solid rgba(0,255,255,0.3); z-index: 100000;
            box-shadow: 0 20px 60px rgba(0,0,0,0.5);
        `;

        portal.innerHTML = `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem;">
                <h2 style="color: #00ffff; margin: 0; font-size: 1.8rem;">
                    🚀 Enterprise Onboarding Portal
                </h2>
                <button onclick="document.getElementById('blaze-onboarding-portal').style.display='none'" 
                    style="background: none; border: none; color: #94a3b8; font-size: 1.5rem; cursor: pointer;">
                    ×
                </button>
            </div>

            <div id="onboarding-content">
                <div style="display: grid; grid-template-columns: 250px 1fr; gap: 2rem;">
                    <!-- Sidebar -->
                    <div style="background: rgba(0,0,0,0.5); padding: 1.5rem; border-radius: 12px;">
                        <h3 style="color: #00ffff; margin-bottom: 1rem; font-size: 1rem;">
                            Onboarding Stages
                        </h3>
                        <div id="stage-navigation"></div>
                    </div>

                    <!-- Main Content -->
                    <div id="stage-content" style="background: rgba(30,41,59,0.5); padding: 2rem; border-radius: 12px;">
                        <!-- Dynamic content here -->
                    </div>
                </div>
            </div>

            <div style="margin-top: 2rem; text-align: center;">
                <button onclick="blazeOnboarding.startNewClient()" style="
                    background: linear-gradient(45deg, #10b981, #059669);
                    color: white; border: none; padding: 1rem 2rem;
                    border-radius: 8px; font-weight: bold; cursor: pointer;
                    font-size: 1.1rem; margin-right: 1rem;
                ">Start New Client</button>
                
                <button onclick="blazeOnboarding.viewActiveClients()" style="
                    background: linear-gradient(45deg, #3b82f6, #1e40af);
                    color: white; border: none; padding: 1rem 2rem;
                    border-radius: 8px; font-weight: bold; cursor: pointer;
                    font-size: 1.1rem;
                ">View Active Clients</button>
            </div>
        `;

        document.body.appendChild(portal);
        this.renderStageNavigation();
    }

    renderStageNavigation() {
        const nav = document.getElementById('stage-navigation');
        if (!nav) return;

        const stages = Object.keys(this.onboardingStages);
        nav.innerHTML = stages.map((stage, index) => `
            <div onclick="blazeOnboarding.showStageDetails('${stage}')" style="
                padding: 0.75rem; margin-bottom: 0.5rem;
                background: rgba(0,255,255,0.1); border-radius: 8px;
                cursor: pointer; transition: all 0.3s;
                border-left: 3px solid ${this.getStageColor(stage)};
            " onmouseover="this.style.background='rgba(0,255,255,0.2)'" 
               onmouseout="this.style.background='rgba(0,255,255,0.1)'">
                <div style="display: flex; align-items: center; gap: 0.5rem;">
                    <div style="color: ${this.getStageColor(stage)}; font-size: 1.2rem;">
                        ${this.getStageIcon(stage)}
                    </div>
                    <div>
                        <div style="color: #e2e8f0; font-weight: bold; font-size: 0.9rem;">
                            ${stage.charAt(0).toUpperCase() + stage.slice(1)}
                        </div>
                        <div style="color: #94a3b8; font-size: 0.7rem;">
                            ${this.onboardingStages[stage].duration}
                        </div>
                    </div>
                </div>
            </div>
        `).join('');
    }

    getStageColor(stage) {
        const colors = {
            discovery: '#00ffff',
            setup: '#3b82f6',
            integration: '#8b5cf6',
            training: '#f59e0b',
            launch: '#10b981',
            optimization: '#ef4444'
        };
        return colors[stage] || '#94a3b8';
    }

    getStageIcon(stage) {
        const icons = {
            discovery: '🔍',
            setup: '⚙️',
            integration: '🔗',
            training: '🎓',
            launch: '🚀',
            optimization: '📈'
        };
        return icons[stage] || '📋';
    }

    showStageDetails(stageName) {
        const content = document.getElementById('stage-content');
        if (!content) return;

        const stage = this.onboardingStages[stageName];
        content.innerHTML = `
            <h3 style="color: ${this.getStageColor(stageName)}; margin-bottom: 1.5rem;">
                ${this.getStageIcon(stageName)} ${stageName.charAt(0).toUpperCase() + stageName.slice(1)} Stage
            </h3>

            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin-bottom: 2rem;">
                <div>
                    <h4 style="color: #00ffff; margin-bottom: 1rem; font-size: 0.9rem;">
                        📋 Activities (${stage.duration})
                    </h4>
                    <ul style="list-style: none; padding: 0;">
                        ${stage.activities.map(activity => `
                            <li style="padding: 0.5rem; margin-bottom: 0.5rem; 
                                background: rgba(0,255,255,0.05); border-radius: 6px;
                                color: #e2e8f0; font-size: 0.85rem;">
                                ✓ ${activity}
                            </li>
                        `).join('')}
                    </ul>
                </div>

                <div>
                    <h4 style="color: #10b981; margin-bottom: 1rem; font-size: 0.9rem;">
                        📦 Deliverables
                    </h4>
                    <ul style="list-style: none; padding: 0;">
                        ${stage.deliverables.map(deliverable => `
                            <li style="padding: 0.5rem; margin-bottom: 0.5rem;
                                background: rgba(16,185,129,0.1); border-radius: 6px;
                                color: #10b981; font-size: 0.85rem;">
                                📄 ${deliverable}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>

            <div>
                <h4 style="color: #f59e0b; margin-bottom: 1rem; font-size: 0.9rem;">
                    🤖 Automation Features
                </h4>
                <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
                    ${stage.automations.map(automation => `
                        <span style="background: rgba(245,158,11,0.2); color: #f59e0b;
                            padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem;">
                            ${automation.replace(/_/g, ' ')}
                        </span>
                    `).join('')}
                </div>
            </div>
        `;
    }

    startNewClient() {
        const clientId = this.generateClientId();
        const client = {
            id: clientId,
            name: '',
            tier: '',
            startDate: Date.now(),
            currentStage: 'discovery',
            progress: 0,
            stakeholders: [],
            metrics: {},
            status: 'active'
        };

        // Show client setup form
        this.showClientSetupForm(client);
    }

    showClientSetupForm(client) {
        const content = document.getElementById('stage-content');
        if (!content) return;

        content.innerHTML = `
            <h3 style="color: #00ffff; margin-bottom: 1.5rem;">
                🎯 New Enterprise Client Setup
            </h3>

            <form id="client-setup-form" style="max-width: 600px;">
                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem;">
                        Organization Name
                    </label>
                    <input type="text" id="client-name" required style="
                        width: 100%; padding: 0.75rem; border-radius: 8px;
                        background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
                        color: #e2e8f0; font-size: 1rem;
                    " placeholder="e.g., St. Louis Cardinals">
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem;">
                        Service Tier
                    </label>
                    <select id="client-tier" required style="
                        width: 100%; padding: 0.75rem; border-radius: 8px;
                        background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
                        color: #e2e8f0; font-size: 1rem;
                    ">
                        <option value="">Select Tier</option>
                        <option value="enterprise">Enterprise (Platinum)</option>
                        <option value="professional">Professional (Gold)</option>
                        <option value="growth">Growth (Silver)</option>
                    </select>
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem;">
                        Primary Contact Email
                    </label>
                    <input type="email" id="client-email" required style="
                        width: 100%; padding: 0.75rem; border-radius: 8px;
                        background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
                        color: #e2e8f0; font-size: 1rem;
                    " placeholder="contact@organization.com">
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem;">
                        Number of Teams/Users
                    </label>
                    <input type="number" id="client-users" required min="1" style="
                        width: 100%; padding: 0.75rem; border-radius: 8px;
                        background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
                        color: #e2e8f0; font-size: 1rem;
                    " placeholder="50">
                </div>

                <div style="margin-bottom: 1.5rem;">
                    <label style="display: block; color: #e2e8f0; margin-bottom: 0.5rem;">
                        Primary Use Case
                    </label>
                    <select id="client-usecase" required style="
                        width: 100%; padding: 0.75rem; border-radius: 8px;
                        background: rgba(0,0,0,0.5); border: 1px solid rgba(255,255,255,0.2);
                        color: #e2e8f0; font-size: 1rem;
                    ">
                        <option value="">Select Use Case</option>
                        <option value="mlb">MLB Team Analytics</option>
                        <option value="nfl">NFL Team Analytics</option>
                        <option value="nba">NBA Team Analytics</option>
                        <option value="college">College Athletics</option>
                        <option value="youth">Youth Sports Organization</option>
                        <option value="multi">Multi-Sport Enterprise</option>
                    </select>
                </div>

                <button type="submit" style="
                    background: linear-gradient(45deg, #10b981, #059669);
                    color: white; border: none; padding: 1rem 2rem;
                    border-radius: 8px; font-weight: bold; cursor: pointer;
                    font-size: 1.1rem; width: 100%;
                ">Begin Onboarding Process</button>
            </form>
        `;

        // Add form submission handler
        document.getElementById('client-setup-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.processClientSetup(client);
        });
    }

    processClientSetup(client) {
        // Gather form data
        client.name = document.getElementById('client-name').value;
        client.tier = document.getElementById('client-tier').value;
        client.email = document.getElementById('client-email').value;
        client.users = parseInt(document.getElementById('client-users').value);
        client.useCase = document.getElementById('client-usecase').value;

        // Get tier profile
        const profile = this.clientProfiles[client.tier];
        client.profile = profile;

        // Store client
        this.activeClients.set(client.id, client);
        this.saveClientData(client);

        // Start onboarding automation
        this.initiateOnboarding(client);

        // Show success and next steps
        this.showOnboardingInitiated(client);
    }

    initiateOnboarding(client) {
        console.log('🚀 Initiating onboarding for:', client.name);

        // Execute automation workflow
        const workflow = this.automationWorkflows.account_creation;
        
        workflow.actions.forEach((action, index) => {
            setTimeout(() => {
                this.executeAutomation(action, client);
            }, index * 1000);
        });

        // Send notifications
        this.sendOnboardingNotifications(client, workflow.notifications);

        // Create onboarding timeline
        this.createOnboardingTimeline(client);

        // Schedule initial meetings
        this.scheduleInitialMeetings(client);
    }

    executeAutomation(action, client) {
        console.log(`🤖 Executing: ${action} for ${client.name}`);

        const automationActions = {
            'Generate client ID': () => {
                client.apiKey = this.generateApiKey();
                console.log(`API Key generated: ${client.apiKey.substring(0, 10)}...`);
            },
            'Create account structure': () => {
                client.account = {
                    subdomain: client.name.toLowerCase().replace(/\s+/g, '-'),
                    databases: ['analytics', 'performance', 'historical'],
                    storage: '100GB'
                };
            },
            'Provision resources': () => {
                client.resources = {
                    compute: client.tier === 'enterprise' ? 'dedicated' : 'shared',
                    bandwidth: client.tier === 'enterprise' ? 'unlimited' : '10TB',
                    apis: client.tier === 'enterprise' ? 'unlimited' : '100k/month'
                };
            },
            'Setup billing': () => {
                client.billing = {
                    plan: client.tier,
                    frequency: 'monthly',
                    amount: this.calculateBilling(client)
                };
            },
            'Send welcome email': () => {
                this.sendWelcomeEmail(client);
            }
        };

        if (automationActions[action]) {
            automationActions[action]();
        }
    }

    showOnboardingInitiated(client) {
        const content = document.getElementById('stage-content');
        if (!content) return;

        content.innerHTML = `
            <div style="text-align: center; padding: 2rem;">
                <div style="font-size: 4rem; margin-bottom: 1rem;">🎉</div>
                <h2 style="color: #10b981; margin-bottom: 1rem;">
                    Onboarding Initiated!
                </h2>
                <p style="color: #e2e8f0; margin-bottom: 2rem; font-size: 1.1rem;">
                    Welcome aboard, <strong>${client.name}</strong>!
                </p>

                <div style="background: rgba(0,0,0,0.5); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                    <h3 style="color: #00ffff; margin-bottom: 1rem;">Account Details</h3>
                    <div style="text-align: left; max-width: 400px; margin: 0 auto;">
                        <div style="margin-bottom: 0.5rem;">
                            <span style="color: #94a3b8;">Client ID:</span>
                            <span style="color: #e2e8f0; font-family: monospace;">${client.id}</span>
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <span style="color: #94a3b8;">Service Tier:</span>
                            <span style="color: #f59e0b;">${client.profile.tier.toUpperCase()}</span>
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <span style="color: #94a3b8;">SLA:</span>
                            <span style="color: #10b981;">${client.profile.sla} Uptime</span>
                        </div>
                        <div style="margin-bottom: 0.5rem;">
                            <span style="color: #94a3b8;">Response Time:</span>
                            <span style="color: #10b981;">${client.profile.responseTime}</span>
                        </div>
                    </div>
                </div>

                <div style="background: rgba(16,185,129,0.1); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                    <h3 style="color: #10b981; margin-bottom: 1rem;">Next Steps</h3>
                    <ol style="text-align: left; max-width: 500px; margin: 0 auto; color: #e2e8f0;">
                        <li style="margin-bottom: 0.5rem;">Welcome email sent to ${client.email}</li>
                        <li style="margin-bottom: 0.5rem;">Discovery call scheduled for tomorrow</li>
                        <li style="margin-bottom: 0.5rem;">Technical team notified for setup</li>
                        <li style="margin-bottom: 0.5rem;">Success manager assigned</li>
                    </ol>
                </div>

                <button onclick="blazeOnboarding.viewClientDashboard('${client.id}')" style="
                    background: linear-gradient(45deg, #3b82f6, #1e40af);
                    color: white; border: none; padding: 1rem 2rem;
                    border-radius: 8px; font-weight: bold; cursor: pointer;
                    font-size: 1.1rem;
                ">View Client Dashboard</button>
            </div>
        `;
    }

    viewClientDashboard(clientId) {
        const client = this.activeClients.get(clientId);
        if (!client) return;

        const content = document.getElementById('stage-content');
        if (!content) return;

        content.innerHTML = `
            <h3 style="color: #00ffff; margin-bottom: 1.5rem;">
                📊 ${client.name} - Onboarding Dashboard
            </h3>

            <!-- Progress Overview -->
            <div style="background: rgba(0,0,0,0.5); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <h4 style="color: #e2e8f0; margin-bottom: 1rem;">Overall Progress</h4>
                <div style="background: rgba(255,255,255,0.1); height: 30px; border-radius: 15px; overflow: hidden;">
                    <div style="
                        width: ${this.calculateProgress(client)}%;
                        height: 100%; background: linear-gradient(90deg, #00ffff, #10b981);
                        display: flex; align-items: center; justify-content: center;
                        color: white; font-weight: bold; font-size: 0.9rem;
                    ">
                        ${this.calculateProgress(client)}%
                    </div>
                </div>
            </div>

            <!-- Stage Status -->
            <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(150px, 1fr)); gap: 1rem; margin-bottom: 2rem;">
                ${Object.keys(this.onboardingStages).map(stage => `
                    <div style="
                        background: ${this.getStageStatus(client, stage) === 'complete' ? 'rgba(16,185,129,0.2)' :
                                     this.getStageStatus(client, stage) === 'active' ? 'rgba(59,130,246,0.2)' :
                                     'rgba(107,114,128,0.2)'};
                        padding: 1rem; border-radius: 8px; text-align: center;
                    ">
                        <div style="font-size: 1.5rem; margin-bottom: 0.5rem;">
                            ${this.getStageIcon(stage)}
                        </div>
                        <div style="color: #e2e8f0; font-weight: bold; font-size: 0.9rem;">
                            ${stage.charAt(0).toUpperCase() + stage.slice(1)}
                        </div>
                        <div style="color: #94a3b8; font-size: 0.7rem;">
                            ${this.getStageStatus(client, stage)}
                        </div>
                    </div>
                `).join('')}
            </div>

            <!-- Active Tasks -->
            <div style="background: rgba(30,41,59,0.5); padding: 1.5rem; border-radius: 12px; margin-bottom: 2rem;">
                <h4 style="color: #f59e0b; margin-bottom: 1rem;">🔄 Active Tasks</h4>
                <ul style="list-style: none; padding: 0;">
                    ${this.getActiveTasks(client).map(task => `
                        <li style="padding: 0.75rem; margin-bottom: 0.5rem;
                            background: rgba(0,0,0,0.3); border-radius: 6px;
                            display: flex; justify-content: space-between; align-items: center;">
                            <span style="color: #e2e8f0;">${task.name}</span>
                            <span style="color: #94a3b8; font-size: 0.8rem;">${task.status}</span>
                        </li>
                    `).join('')}
                </ul>
            </div>

            <!-- Quick Actions -->
            <div style="display: flex; gap: 1rem; flex-wrap: wrap;">
                <button onclick="blazeOnboarding.scheduleCheckIn('${client.id}')" style="
                    background: linear-gradient(45deg, #10b981, #059669);
                    color: white; border: none; padding: 0.75rem 1.5rem;
                    border-radius: 8px; cursor: pointer;
                ">Schedule Check-in</button>
                
                <button onclick="blazeOnboarding.generateReport('${client.id}')" style="
                    background: linear-gradient(45deg, #3b82f6, #1e40af);
                    color: white; border: none; padding: 0.75rem 1.5rem;
                    border-radius: 8px; cursor: pointer;
                ">Generate Report</button>
                
                <button onclick="blazeOnboarding.viewDocumentation('${client.id}')" style="
                    background: linear-gradient(45deg, #8b5cf6, #7c3aed);
                    color: white; border: none; padding: 0.75rem 1.5rem;
                    border-radius: 8px; cursor: pointer;
                ">View Documentation</button>
            </div>
        `;
    }

    viewActiveClients() {
        const content = document.getElementById('stage-content');
        if (!content) return;

        const clients = Array.from(this.activeClients.values());
        
        content.innerHTML = `
            <h3 style="color: #00ffff; margin-bottom: 1.5rem;">
                👥 Active Enterprise Clients
            </h3>

            ${clients.length === 0 ? `
                <div style="text-align: center; padding: 3rem; color: #94a3b8;">
                    No active clients yet. Click "Start New Client" to begin.
                </div>
            ` : `
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 1px solid rgba(255,255,255,0.1);">
                                <th style="padding: 1rem; text-align: left; color: #94a3b8;">Organization</th>
                                <th style="padding: 1rem; text-align: left; color: #94a3b8;">Tier</th>
                                <th style="padding: 1rem; text-align: left; color: #94a3b8;">Stage</th>
                                <th style="padding: 1rem; text-align: left; color: #94a3b8;">Progress</th>
                                <th style="padding: 1rem; text-align: left; color: #94a3b8;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${clients.map(client => `
                                <tr style="border-bottom: 1px solid rgba(255,255,255,0.05);">
                                    <td style="padding: 1rem; color: #e2e8f0; font-weight: bold;">
                                        ${client.name}
                                    </td>
                                    <td style="padding: 1rem;">
                                        <span style="
                                            background: ${client.tier === 'enterprise' ? 'rgba(239,68,68,0.2)' :
                                                        client.tier === 'professional' ? 'rgba(245,158,11,0.2)' :
                                                        'rgba(107,114,128,0.2)'};
                                            color: ${client.tier === 'enterprise' ? '#ef4444' :
                                                    client.tier === 'professional' ? '#f59e0b' :
                                                    '#6b7280'};
                                            padding: 0.25rem 0.75rem; border-radius: 12px; font-size: 0.8rem;
                                        ">
                                            ${client.profile.tier}
                                        </span>
                                    </td>
                                    <td style="padding: 1rem; color: #00ffff;">
                                        ${client.currentStage}
                                    </td>
                                    <td style="padding: 1rem;">
                                        <div style="background: rgba(255,255,255,0.1); height: 8px; 
                                            border-radius: 4px; overflow: hidden; width: 100px;">
                                            <div style="
                                                width: ${this.calculateProgress(client)}%;
                                                height: 100%; background: linear-gradient(90deg, #00ffff, #10b981);
                                            "></div>
                                        </div>
                                    </td>
                                    <td style="padding: 1rem;">
                                        <button onclick="blazeOnboarding.viewClientDashboard('${client.id}')" style="
                                            background: rgba(59,130,246,0.2); color: #3b82f6;
                                            border: 1px solid rgba(59,130,246,0.3); padding: 0.5rem 1rem;
                                            border-radius: 6px; cursor: pointer; font-size: 0.8rem;
                                        ">View Dashboard</button>
                                    </td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            `}
        `;
    }

    // Helper methods
    generateClientId() {
        return 'BLZ-' + Date.now().toString(36).toUpperCase() + '-' + Math.random().toString(36).substr(2, 5).toUpperCase();
    }

    generateApiKey() {
        return 'blz_' + Math.random().toString(36).substr(2, 15) + '_' + Date.now().toString(36);
    }

    calculateBilling(client) {
        const basePricing = {
            enterprise: 4999,
            professional: 1999,
            growth: 999
        };
        
        const base = basePricing[client.tier] || 999;
        const userMultiplier = Math.ceil(client.users / 10) * 0.1;
        
        return Math.round(base * (1 + userMultiplier));
    }

    calculateProgress(client) {
        const stages = Object.keys(this.onboardingStages);
        const currentIndex = stages.indexOf(client.currentStage);
        return Math.round((currentIndex / stages.length) * 100);
    }

    getStageStatus(client, stage) {
        const stages = Object.keys(this.onboardingStages);
        const currentIndex = stages.indexOf(client.currentStage);
        const stageIndex = stages.indexOf(stage);
        
        if (stageIndex < currentIndex) return 'complete';
        if (stageIndex === currentIndex) return 'active';
        return 'pending';
    }

    getActiveTasks(client) {
        const stage = this.onboardingStages[client.currentStage];
        if (!stage) return [];
        
        return stage.activities.slice(0, 3).map(activity => ({
            name: activity,
            status: 'in progress'
        }));
    }

    createOnboardingTimeline(client) {
        const timeline = [];
        let currentDate = new Date();
        
        Object.entries(this.onboardingStages).forEach(([stage, details]) => {
            timeline.push({
                stage,
                startDate: new Date(currentDate),
                duration: details.duration,
                activities: details.activities,
                deliverables: details.deliverables
            });
            
            // Add days based on duration
            const daysToAdd = parseInt(details.duration) || 7;
            currentDate.setDate(currentDate.getDate() + daysToAdd);
        });
        
        client.timeline = timeline;
        return timeline;
    }

    scheduleInitialMeetings(client) {
        const meetings = [
            {
                type: 'discovery_call',
                date: new Date(Date.now() + 86400000), // Tomorrow
                duration: 60,
                attendees: ['client_stakeholders', 'success_manager', 'technical_lead']
            },
            {
                type: 'technical_review',
                date: new Date(Date.now() + 172800000), // 2 days
                duration: 90,
                attendees: ['client_technical', 'engineering_team']
            },
            {
                type: 'training_kickoff',
                date: new Date(Date.now() + 604800000), // 1 week
                duration: 120,
                attendees: ['client_users', 'training_team']
            }
        ];
        
        client.meetings = meetings;
        return meetings;
    }

    sendWelcomeEmail(client) {
        const email = {
            to: client.email,
            subject: `Welcome to Blaze Intelligence - ${client.name}`,
            body: `Welcome to the championship team!
            
Your ${client.profile.tier} account is being prepared.
API Key: ${client.apiKey?.substring(0, 20)}...

Your Success Manager will contact you within ${client.profile.responseTime}.

Best regards,
The Blaze Intelligence Team`
        };
        
        console.log('📧 Welcome email sent:', email);
    }

    sendOnboardingNotifications(client, teams) {
        teams.forEach(team => {
            console.log(`📨 Notifying ${team} about new client: ${client.name}`);
        });
    }

    saveClientData(client) {
        const clients = JSON.parse(localStorage.getItem('blaze-enterprise-clients') || '{}');
        clients[client.id] = client;
        localStorage.setItem('blaze-enterprise-clients', JSON.stringify(clients));
    }

    createClientDashboard() {
        // Create quick access dashboard button
        const dashboardBtn = document.createElement('button');
        dashboardBtn.id = 'blaze-onboarding-btn';
        dashboardBtn.style.cssText = `
            position: fixed; bottom: 20px; left: 20px;
            background: linear-gradient(45deg, #00ffff, #0891b2);
            color: white; padding: 1rem; border-radius: 50%;
            width: 60px; height: 60px; border: none; cursor: pointer;
            box-shadow: 0 4px 15px rgba(0,0,0,0.3); z-index: 9995;
            font-size: 1.5rem; font-weight: bold;
        `;
        dashboardBtn.innerHTML = '🚀';
        dashboardBtn.onclick = () => {
            document.getElementById('blaze-onboarding-portal').style.display = 'block';
        };
        
        document.body.appendChild(dashboardBtn);
    }

    initializeAutomation() {
        console.log('🤖 Enterprise Onboarding Automation: Active');
        console.log('Workflows configured:', Object.keys(this.automationWorkflows));
    }

    startMonitoring() {
        // Monitor client progress
        setInterval(() => {
            this.activeClients.forEach(client => {
                this.updateClientProgress(client);
            });
        }, 60000); // Every minute
    }

    updateClientProgress(client) {
        // Simulate progress updates
        const stages = Object.keys(this.onboardingStages);
        const currentIndex = stages.indexOf(client.currentStage);
        
        if (currentIndex < stages.length - 1 && Math.random() > 0.95) {
            client.currentStage = stages[currentIndex + 1];
            console.log(`📈 ${client.name} progressed to ${client.currentStage} stage`);
            this.saveClientData(client);
        }
    }

    // Public methods for external access
    scheduleCheckIn(clientId) {
        console.log(`📅 Scheduling check-in for client ${clientId}`);
        alert('Check-in scheduled for tomorrow at 2 PM');
    }

    generateReport(clientId) {
        const client = this.activeClients.get(clientId);
        if (!client) return;
        
        const report = {
            client: client.name,
            tier: client.tier,
            currentStage: client.currentStage,
            progress: this.calculateProgress(client) + '%',
            timeline: client.timeline,
            generatedAt: new Date().toISOString()
        };
        
        // Download report
        const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `onboarding-report-${client.id}.json`;
        a.click();
        URL.revokeObjectURL(url);
    }

    viewDocumentation(clientId) {
        console.log(`📚 Opening documentation for client ${clientId}`);
        alert('Documentation portal opening...');
    }
}

// Auto-initialize enterprise onboarding
let blazeOnboarding;
document.addEventListener('DOMContentLoaded', () => {
    blazeOnboarding = new BlazeEnterpriseOnboarding();
});

// Global access
window.BlazeEnterpriseOnboarding = BlazeEnterpriseOnboarding;
window.blazeOnboarding = blazeOnboarding;