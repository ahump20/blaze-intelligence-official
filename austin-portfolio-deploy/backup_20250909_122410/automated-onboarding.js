/**
 * Blaze Intelligence Client Onboarding Automation
 * Handles automated client onboarding and service activation workflows
 */

class BlazeClientOnboarding {
  constructor(env) {
    this.env = env;
    this.baseUrl = env.BLAZE_BASE_URL || 'https://blaze-intelligence.pages.dev';
  }

  /**
   * Trigger complete onboarding workflow
   */
  async triggerOnboarding(customerData) {
    try {
      const onboardingId = `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      console.log(`Starting onboarding workflow for ${customerData.organization} (${onboardingId})`);

      // Execute onboarding steps in sequence
      const results = {
        onboardingId,
        customer: customerData.organization,
        tier: customerData.tier,
        startedAt: new Date().toISOString(),
        steps: {}
      };

      // Step 1: Send welcome email and schedule introduction call
      results.steps.welcomeEmail = await this.sendWelcomeEmail(customerData);
      results.steps.introCall = await this.scheduleIntroductionCall(customerData);

      // Step 2: Provision platform access
      results.steps.platformAccess = await this.provisionPlatformAccess(customerData);

      // Step 3: Set up data integrations
      results.steps.dataIntegration = await this.setupDataIntegrations(customerData);

      // Step 4: Create custom dashboard
      results.steps.customDashboard = await this.createCustomDashboard(customerData);

      // Step 5: Schedule training sessions
      results.steps.trainingScheduled = await this.scheduleTrainingSessions(customerData);

      // Step 6: Set up monitoring and alerts
      results.steps.monitoring = await this.setupMonitoring(customerData);

      // Step 7: Create success metrics and KPIs
      results.steps.successMetrics = await this.defineSuccessMetrics(customerData);

      // Step 8: Enterprise-specific setup (if applicable)
      if (customerData.tier === 'championship' || customerData.tier === 'enterprise') {
        results.steps.enterpriseSetup = await this.performEnterpriseSetup(customerData);
      }

      // Final: Log completion and schedule follow-up
      results.completedAt = new Date().toISOString();
      results.status = 'completed';
      results.nextSteps = await this.scheduleFollowUp(customerData);

      // Store onboarding record
      await this.storeOnboardingRecord(results);

      // Send completion notification
      await this.sendOnboardingCompletionNotification(customerData, results);

      return {
        success: true,
        onboardingId,
        results
      };

    } catch (error) {
      console.error('Onboarding workflow failed:', error);
      return {
        success: false,
        error: error.message,
        onboardingId: onboardingId || null
      };
    }
  }

  /**
   * Send welcome email with onboarding timeline
   */
  async sendWelcomeEmail(customerData) {
    try {
      const emailContent = this.generateWelcomeEmail(customerData);
      
      const mailgunUrl = `https://api.mailgun.net/v3/${this.env.MAILGUN_DOMAIN}/messages`;
      
      const response = await fetch(mailgunUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.env.MAILGUN_API_KEY}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          from: 'Austin Humphrey <austin@blaze-intelligence.com>',
          to: customerData.email,
          cc: 'ahump20@outlook.com',
          subject: `Welcome to Blaze Intelligence - Your ${customerData.tier} Journey Begins`,
          html: emailContent.html,
          text: emailContent.text,
          'o:tag': ['onboarding', 'welcome', customerData.tier]
        })
      });

      return {
        success: response.ok,
        emailSent: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Welcome email failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Schedule introduction call via calendar integration
   */
  async scheduleIntroductionCall(customerData) {
    try {
      // Create calendar event data
      const eventData = {
        summary: `Blaze Intelligence Onboarding - ${customerData.organization}`,
        description: `Introduction and onboarding call for ${customerData.organization} (${customerData.tier} tier)`,
        start: {
          dateTime: this.getNextBusinessDay(),
          timeZone: 'America/Chicago'
        },
        end: {
          dateTime: this.addHours(this.getNextBusinessDay(), 1),
          timeZone: 'America/Chicago'
        },
        attendees: [
          {
            email: customerData.email,
            displayName: customerData.contactPerson
          },
          {
            email: 'ahump20@outlook.com',
            displayName: 'Austin Humphrey'
          }
        ],
        location: 'Video Conference (link to be provided)',
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'email', minutes: 24 * 60 }, // 24 hours
            { method: 'email', minutes: 60 }      // 1 hour
          ]
        }
      };

      // Send calendar invitation email
      const invitationEmail = this.generateCalendarInvitation(customerData, eventData);
      
      const mailgunResponse = await fetch(`https://api.mailgun.net/v3/${this.env.MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.env.MAILGUN_API_KEY}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          from: 'Austin Humphrey <austin@blaze-intelligence.com>',
          to: customerData.email,
          subject: `Let's Schedule Your Blaze Intelligence Onboarding Call`,
          html: invitationEmail.html,
          text: invitationEmail.text,
          'o:tag': ['onboarding', 'scheduling', customerData.tier]
        })
      });

      return {
        success: mailgunResponse.ok,
        callScheduled: true,
        proposedTime: eventData.start.dateTime,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Call scheduling failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Provision platform access and user accounts
   */
  async provisionPlatformAccess(customerData) {
    try {
      // Generate secure credentials
      const credentials = {
        organizationId: this.generateOrganizationId(customerData.organization),
        apiKey: this.generateApiKey(),
        dashboardUrl: `${this.baseUrl}/dashboard/${this.generateOrganizationId(customerData.organization)}`,
        tempPassword: this.generateTempPassword()
      };

      // Store credentials securely
      await this.storeCredentials(customerData, credentials);

      // Send access information
      const accessEmail = this.generateAccessEmail(customerData, credentials);
      
      await fetch(`https://api.mailgun.net/v3/${this.env.MAILGUN_DOMAIN}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${btoa(`api:${this.env.MAILGUN_API_KEY}`)}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams({
          from: 'Austin Humphrey <austin@blaze-intelligence.com>',
          to: customerData.email,
          subject: `Your Blaze Intelligence Platform Access is Ready`,
          html: accessEmail.html,
          text: accessEmail.text,
          'o:tag': ['onboarding', 'access', customerData.tier]
        })
      });

      return {
        success: true,
        accessProvisioned: true,
        organizationId: credentials.organizationId,
        dashboardUrl: credentials.dashboardUrl,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Platform access provisioning failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Set up data integrations based on tier and sport
   */
  async setupDataIntegrations(customerData) {
    try {
      const integrations = this.getIntegrationsForTier(customerData.tier, customerData.sport);
      const setupResults = [];

      for (const integration of integrations) {
        try {
          const result = await this.configureIntegration(integration, customerData);
          setupResults.push({
            integration: integration.name,
            success: result.success,
            endpoint: result.endpoint,
            status: result.status
          });
        } catch (error) {
          setupResults.push({
            integration: integration.name,
            success: false,
            error: error.message
          });
        }
      }

      return {
        success: setupResults.some(r => r.success),
        integrations: setupResults,
        totalSetup: setupResults.length,
        successfulSetup: setupResults.filter(r => r.success).length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Data integration setup failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create custom dashboard for the client
   */
  async createCustomDashboard(customerData) {
    try {
      const dashboardConfig = {
        organizationId: this.generateOrganizationId(customerData.organization),
        tier: customerData.tier,
        sport: customerData.sport,
        customizations: this.getDashboardCustomizations(customerData),
        widgets: this.getWidgetsForTier(customerData.tier),
        branding: {
          logo: customerData.logo || null,
          primaryColor: customerData.brandColor || '#3b82f6',
          organizationName: customerData.organization
        },
        permissions: this.getPermissionsForTier(customerData.tier)
      };

      // Store dashboard configuration
      await this.env.BLAZE_STORAGE.put(
        `dashboards/${dashboardConfig.organizationId}/config.json`,
        JSON.stringify(dashboardConfig)
      );

      // Generate initial dashboard data
      const initialData = await this.generateInitialDashboardData(customerData);
      
      await this.env.BLAZE_STORAGE.put(
        `dashboards/${dashboardConfig.organizationId}/data.json`,
        JSON.stringify(initialData)
      );

      return {
        success: true,
        dashboardCreated: true,
        organizationId: dashboardConfig.organizationId,
        dashboardUrl: `${this.baseUrl}/dashboard/${dashboardConfig.organizationId}`,
        widgets: dashboardConfig.widgets.length,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Dashboard creation failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Helper functions for generating IDs and configurations
   */
  generateOrganizationId(organizationName) {
    return organizationName.toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '') + '-' + Date.now().toString(36);
  }

  generateApiKey() {
    return 'blaze_' + Array.from(crypto.getRandomValues(new Uint8Array(32)))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  generateTempPassword() {
    const chars = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789';
    return Array.from(crypto.getRandomValues(new Uint8Array(12)))
      .map(b => chars[b % chars.length])
      .join('');
  }

  getNextBusinessDay() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // If it's weekend, move to Monday
    if (tomorrow.getDay() === 0) tomorrow.setDate(tomorrow.getDate() + 1); // Sunday -> Monday
    if (tomorrow.getDay() === 6) tomorrow.setDate(tomorrow.getDate() + 2); // Saturday -> Monday
    
    tomorrow.setHours(10, 0, 0, 0); // 10 AM
    return tomorrow.toISOString();
  }

  addHours(dateString, hours) {
    const date = new Date(dateString);
    date.setHours(date.getHours() + hours);
    return date.toISOString();
  }

  addDays(date, days) {
    const result = new Date(date);
    result.setDate(result.getDate() + days);
    return result;
  }

  // Email generation methods
  generateWelcomeEmail(customerData) {
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #0a0a0a; padding: 20px; text-align: center;">
          <h1 style="color: #00bcd4; margin: 0;">BLAZE INTELLIGENCE</h1>
        </div>
        
        <div style="padding: 30px; background: #f8f9fa;">
          <h2 style="color: #333;">Welcome to Championship-Level Analytics, ${customerData.contactPerson}!</h2>
          
          <p>Thank you for choosing Blaze Intelligence ${customerData.tier} package for ${customerData.organization}. We're excited to help you dominate through data-driven insights.</p>
          
          <div style="background: #e3f2fd; padding: 20px; border-left: 4px solid #2196f3; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1976d2;">Your Onboarding Journey (Next 14 Days)</h3>
            <ul style="margin: 0; padding-left: 20px;">
              <li><strong>Day 1-2:</strong> Platform access provisioning & welcome call</li>
              <li><strong>Day 3-5:</strong> Data integration setup</li>
              <li><strong>Day 6-8:</strong> Custom dashboard creation</li>
              <li><strong>Day 9-12:</strong> Training sessions & best practices</li>
              <li><strong>Day 13-14:</strong> Go-live preparation & success metrics setup</li>
            </ul>
          </div>
          
          <p><strong>What to Expect:</strong></p>
          <ul>
            <li>Personal onboarding call within 24 hours</li>
            <li>Platform access credentials within 48 hours</li>
            <li>Custom dashboard tailored to ${customerData.sport}</li>
            <li>Training sessions specific to your ${customerData.tier} tier</li>
            <li>Direct access to Austin Humphrey for questions</li>
          </ul>
          
          <p><strong>Direct Contact:</strong><br>
             Austin Humphrey - Founder & CEO<br>
             📧 ahump20@outlook.com<br>
             📱 (210) 273-5538</p>
          
          <p>Welcome to the future of sports intelligence!</p>
        </div>
        
        <div style="background: #333; color: white; padding: 20px; text-align: center;">
          <p style="margin: 0;">© 2025 Blaze Intelligence. All rights reserved.</p>
        </div>
      </div>
    `;

    const text = `
Welcome to Blaze Intelligence!

Hi ${customerData.contactPerson},

Thank you for choosing Blaze Intelligence ${customerData.tier} package for ${customerData.organization}. We're excited to help you dominate through data-driven insights.

Your Onboarding Journey (Next 14 Days):
- Day 1-2: Platform access provisioning & welcome call
- Day 3-5: Data integration setup
- Day 6-8: Custom dashboard creation
- Day 9-12: Training sessions & best practices
- Day 13-14: Go-live preparation & success metrics setup

What to Expect:
- Personal onboarding call within 24 hours
- Platform access credentials within 48 hours
- Custom dashboard tailored to ${customerData.sport}
- Training sessions specific to your ${customerData.tier} tier
- Direct access to Austin Humphrey for questions

Direct Contact:
Austin Humphrey - Founder & CEO
ahump20@outlook.com
(210) 273-5538

Welcome to the future of sports intelligence!
    `;

    return { html, text };
  }

  /**
   * Store onboarding record
   */
  async storeOnboardingRecord(onboardingData) {
    try {
      await this.env.BLAZE_STORAGE.put(
        `onboarding/${onboardingData.onboardingId}.json`,
        JSON.stringify(onboardingData)
      );
      
      return true;
    } catch (error) {
      console.error('Failed to store onboarding record:', error);
      return false;
    }
  }

  /**
   * Additional helper methods would go here...
   */
  getIntegrationsForTier(tier, sport) {
    const baseIntegrations = [
      { name: 'Blaze Core Analytics', endpoint: '/api/blaze/core' }
    ];

    if (sport === 'baseball') {
      baseIntegrations.push(
        { name: 'MLB Stats API', endpoint: '/api/mlb/stats' },
        { name: 'Perfect Game Data', endpoint: '/api/perfectgame' }
      );
    }

    if (sport === 'football') {
      baseIntegrations.push(
        { name: 'NFL API', endpoint: '/api/nfl/stats' },
        { name: 'College Football Data', endpoint: '/api/cfb/stats' }
      );
    }

    if (sport === 'basketball') {
      baseIntegrations.push(
        { name: 'NBA Stats API', endpoint: '/api/nba/stats' },
        { name: 'NCAA Basketball Data', endpoint: '/api/ncaa/basketball' }
      );
    }

    if (tier === 'championship' || tier === 'enterprise') {
      baseIntegrations.push({ name: 'Custom API Gateway', endpoint: '/api/custom' });
    }

    return baseIntegrations;
  }

  async configureIntegration(integration, customerData) {
    // Mock integration configuration
    return {
      success: true,
      endpoint: integration.endpoint,
      status: 'active',
      configuredAt: new Date().toISOString()
    };
  }

  getDashboardCustomizations(customerData) {
    return {
      theme: 'dark',
      primarySport: customerData.sport,
      organizationBranding: true,
      customWidgets: this.getWidgetsForTier(customerData.tier)
    };
  }

  getWidgetsForTier(tier) {
    const baseWidgets = ['team-performance', 'player-stats', 'game-analysis'];
    
    if (tier === 'professional' || tier === 'enterprise' || tier === 'championship') {
      baseWidgets.push('predictive-analytics', 'advanced-metrics');
    }

    if (tier === 'championship' || tier === 'enterprise') {
      baseWidgets.push('custom-reports', 'real-time-data');
    }

    return baseWidgets;
  }

  getPermissionsForTier(tier) {
    const permissions = {
      starter: ['read'],
      professional: ['read', 'export'],
      enterprise: ['read', 'write', 'export', 'api'],
      championship: ['read', 'write', 'export', 'api', 'admin']
    };

    return permissions[tier] || permissions.professional;
  }

  async generateInitialDashboardData(customerData) {
    return {
      organization: customerData.organization,
      sport: customerData.sport,
      tier: customerData.tier,
      sampleData: true,
      lastUpdated: new Date().toISOString(),
      widgets: this.getWidgetsForTier(customerData.tier).map(widget => ({
        id: widget,
        enabled: true,
        position: { x: 0, y: 0 },
        size: { width: 4, height: 3 }
      }))
    };
  }

  async scheduleTrainingSessions(customerData) {
    // Mock training session scheduling
    return {
      success: true,
      sessionsScheduled: 3,
      timestamp: new Date().toISOString()
    };
  }

  async setupMonitoring(customerData) {
    // Mock monitoring setup
    return {
      success: true,
      monitoringEnabled: true,
      timestamp: new Date().toISOString()
    };
  }

  async defineSuccessMetrics(customerData) {
    // Mock success metrics definition
    return {
      success: true,
      metricsCount: 5,
      timestamp: new Date().toISOString()
    };
  }

  async performEnterpriseSetup(customerData) {
    // Mock enterprise setup
    return {
      success: true,
      enterpriseFeatures: ['dedicated-support', 'custom-integrations'],
      timestamp: new Date().toISOString()
    };
  }

  async scheduleFollowUp(customerData) {
    // Mock follow-up scheduling
    return {
      success: true,
      followUpScheduled: true,
      timestamp: new Date().toISOString()
    };
  }

  async sendOnboardingCompletionNotification(customerData, results) {
    // Mock completion notification
    return {
      success: true,
      notificationSent: true,
      timestamp: new Date().toISOString()
    };
  }

  generateCalendarInvitation(customerData, eventData) {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Blaze Intelligence Onboarding Call</h2>
        <p>Hi ${customerData.contactPerson},</p>
        <p>Let's schedule your onboarding call for ${customerData.organization}.</p>
        <p><strong>Proposed Time:</strong> ${new Date(eventData.start.dateTime).toLocaleString()}</p>
        <p>Please reply to confirm or suggest an alternative time.</p>
        <p>Best regards,<br>Austin Humphrey</p>
      </div>
    `;

    const text = `
Blaze Intelligence Onboarding Call

Hi ${customerData.contactPerson},

Let's schedule your onboarding call for ${customerData.organization}.

Proposed Time: ${new Date(eventData.start.dateTime).toLocaleString()}

Please reply to confirm or suggest an alternative time.

Best regards,
Austin Humphrey
    `;

    return { html, text };
  }

  generateAccessEmail(customerData, credentials) {
    const html = `
      <div style="font-family: Arial, sans-serif;">
        <h2>Your Blaze Intelligence Access is Ready</h2>
        <p>Hi ${customerData.contactPerson},</p>
        <p>Your platform access has been provisioned:</p>
        <ul>
          <li><strong>Dashboard URL:</strong> ${credentials.dashboardUrl}</li>
          <li><strong>Organization ID:</strong> ${credentials.organizationId}</li>
          <li><strong>Temporary Password:</strong> ${credentials.tempPassword}</li>
        </ul>
        <p>Please change your password on first login.</p>
        <p>Best regards,<br>Austin Humphrey</p>
      </div>
    `;

    const text = `
Your Blaze Intelligence Access is Ready

Hi ${customerData.contactPerson},

Your platform access has been provisioned:
- Dashboard URL: ${credentials.dashboardUrl}
- Organization ID: ${credentials.organizationId}
- Temporary Password: ${credentials.tempPassword}

Please change your password on first login.

Best regards,
Austin Humphrey
    `;

    return { html, text };
  }

  async storeCredentials(customerData, credentials) {
    // Store credentials securely in R2
    await this.env.BLAZE_STORAGE.put(
      `credentials/${credentials.organizationId}/access.json`,
      JSON.stringify({
        organizationId: credentials.organizationId,
        apiKey: credentials.apiKey,
        createdAt: new Date().toISOString(),
        customerEmail: customerData.email,
        organization: customerData.organization
      })
    );
  }
}

/**
 * Cloudflare Pages Functions handler
 */
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    const onboarding = new BlazeClientOnboarding(env);

    if (pathname.endsWith('/trigger-onboarding')) {
      return await handleTriggerOnboarding(request, onboarding);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('Onboarding automation error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleTriggerOnboarding(request, onboarding) {
  try {
    const customerData = await request.json();
    const result = await onboarding.triggerOnboarding(customerData);
    
    return new Response(JSON.stringify(result), {
      status: result.success ? 200 : 400,
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return new Response(JSON.stringify({ success: false, error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}