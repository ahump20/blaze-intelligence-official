/**
 * Blaze Intelligence - HubSpot CRM Integration
 * Enterprise-grade lead management and sales pipeline
 */

class BlazeHubSpotIntegration {
    constructor(config = {}) {
        this.config = {
            apiKey: config.apiKey || process.env.HUBSPOT_API_KEY,
            portalId: config.portalId || process.env.HUBSPOT_PORTAL_ID,
            baseUrl: 'https://api.hubapi.com',
            ...config
        };
        
        this.endpoints = {
            contacts: '/crm/v3/objects/contacts',
            companies: '/crm/v3/objects/companies',
            deals: '/crm/v3/objects/deals',
            properties: '/crm/v3/properties',
            pipelines: '/crm/v3/pipelines/deals'
        };
        
        this.init();
    }
    
    async init() {
        console.log('🏢 Initializing HubSpot CRM Integration for Blaze Intelligence');
        await this.setupCustomProperties();
        await this.setupSalesPipeline();
        console.log('✅ HubSpot CRM Integration Ready');
    }
    
    async setupCustomProperties() {
        const customProperties = [
            {
                name: 'blaze_sport_focus',
                label: 'Primary Sport Focus',
                type: 'enumeration',
                fieldType: 'select',
                options: [
                    { label: 'MLB', value: 'mlb' },
                    { label: 'NFL', value: 'nfl' },
                    { label: 'NBA', value: 'nba' },
                    { label: 'NCAA Football', value: 'ncaa_football' },
                    { label: 'NCAA Basketball', value: 'ncaa_basketball' },
                    { label: 'High School Sports', value: 'high_school' },
                    { label: 'Youth Baseball', value: 'youth_baseball' },
                    { label: 'Multi-Sport', value: 'multi_sport' }
                ]
            },
            {
                name: 'blaze_organization_type',
                label: 'Organization Type',
                type: 'enumeration',
                fieldType: 'select',
                options: [
                    { label: 'Professional Team', value: 'pro_team' },
                    { label: 'College Program', value: 'college' },
                    { label: 'High School', value: 'high_school' },
                    { label: 'Youth Organization', value: 'youth_org' },
                    { label: 'Sports Media', value: 'media' },
                    { label: 'Analytics Company', value: 'analytics' },
                    { label: 'Individual Coach', value: 'coach' }
                ]
            },
            {
                name: 'blaze_annual_revenue',
                label: 'Estimated Annual Revenue',
                type: 'enumeration',
                fieldType: 'select',
                options: [
                    { label: 'Under $1M', value: 'under_1m' },
                    { label: '$1M - $10M', value: '1m_10m' },
                    { label: '$10M - $100M', value: '10m_100m' },
                    { label: '$100M+', value: '100m_plus' }
                ]
            },
            {
                name: 'blaze_demo_interest',
                label: 'Demo Interest Level',
                type: 'enumeration',
                fieldType: 'select',
                options: [
                    { label: 'High - Ready to Schedule', value: 'high' },
                    { label: 'Medium - Needs Nurturing', value: 'medium' },
                    { label: 'Low - Research Phase', value: 'low' }
                ]
            },
            {
                name: 'blaze_data_volume',
                label: 'Expected Data Volume',
                type: 'enumeration',
                fieldType: 'select',
                options: [
                    { label: 'Small (1-10 teams)', value: 'small' },
                    { label: 'Medium (10-50 teams)', value: 'medium' },
                    { label: 'Large (50-200 teams)', value: 'large' },
                    { label: 'Enterprise (200+ teams)', value: 'enterprise' }
                ]
            }
        ];
        
        try {
            for (const property of customProperties) {
                await this.createProperty('contacts', property);
            }
            console.log('✅ Custom properties created successfully');
        } catch (error) {
            console.error('❌ Error creating custom properties:', error);
        }
    }
    
    async setupSalesPipeline() {
        const blazePipeline = {
            label: 'Blaze Intelligence Sales Pipeline',
            displayOrder: 1,
            stages: [
                {
                    label: 'Lead Generated',
                    displayOrder: 0,
                    metadata: {
                        probability: 0.05,
                        closedWon: false
                    }
                },
                {
                    label: 'Demo Scheduled',
                    displayOrder: 1,
                    metadata: {
                        probability: 0.20,
                        closedWon: false
                    }
                },
                {
                    label: 'Demo Completed',
                    displayOrder: 2,
                    metadata: {
                        probability: 0.40,
                        closedWon: false
                    }
                },
                {
                    label: 'Proposal Sent',
                    displayOrder: 3,
                    metadata: {
                        probability: 0.60,
                        closedWon: false
                    }
                },
                {
                    label: 'Negotiation',
                    displayOrder: 4,
                    metadata: {
                        probability: 0.80,
                        closedWon: false
                    }
                },
                {
                    label: 'Closed Won',
                    displayOrder: 5,
                    metadata: {
                        probability: 1.0,
                        closedWon: true
                    }
                },
                {
                    label: 'Closed Lost',
                    displayOrder: 6,
                    metadata: {
                        probability: 0.0,
                        closedWon: false
                    }
                }
            ]
        };
        
        try {
            await this.createPipeline(blazePipeline);
            console.log('✅ Blaze Intelligence sales pipeline created');
        } catch (error) {
            console.error('❌ Error creating sales pipeline:', error);
        }
    }
    
    async createLead(leadData) {
        const contact = {
            properties: {
                email: leadData.email,
                firstname: leadData.firstName,
                lastname: leadData.lastName,
                company: leadData.company,
                phone: leadData.phone,
                website: leadData.website,
                jobtitle: leadData.jobTitle,
                blaze_sport_focus: leadData.sportFocus,
                blaze_organization_type: leadData.organizationType,
                blaze_annual_revenue: leadData.annualRevenue,
                blaze_demo_interest: leadData.demoInterest,
                blaze_data_volume: leadData.dataVolume,
                hs_lead_status: 'NEW',
                lifecyclestage: 'lead'
            }
        };
        
        try {
            const response = await this.makeRequest('POST', this.endpoints.contacts, contact);
            console.log('✅ Lead created in HubSpot:', response.id);
            
            // Create associated deal
            await this.createDeal({
                contactId: response.id,
                dealName: `${leadData.company} - Blaze Intelligence`,
                amount: this.calculateEstimatedValue(leadData),
                sportFocus: leadData.sportFocus
            });
            
            return response;
        } catch (error) {
            console.error('❌ Error creating lead:', error);
            throw error;
        }
    }
    
    async createDeal(dealData) {
        const deal = {
            properties: {
                dealname: dealData.dealName,
                amount: dealData.amount,
                dealstage: 'lead_generated',
                pipeline: 'blaze_intelligence_pipeline',
                closedate: this.getEstimatedCloseDate(),
                blaze_sport_focus: dealData.sportFocus
            },
            associations: [
                {
                    to: {
                        id: dealData.contactId
                    },
                    types: [
                        {
                            associationCategory: 'HUBSPOT_DEFINED',
                            associationTypeId: 3
                        }
                    ]
                }
            ]
        };
        
        try {
            const response = await this.makeRequest('POST', this.endpoints.deals, deal);
            console.log('✅ Deal created in HubSpot:', response.id);
            return response;
        } catch (error) {
            console.error('❌ Error creating deal:', error);
            throw error;
        }
    }
    
    calculateEstimatedValue(leadData) {
        const baseValues = {
            'pro_team': 250000,
            'college': 50000,
            'high_school': 15000,
            'youth_org': 8000,
            'media': 75000,
            'analytics': 100000,
            'coach': 5000
        };
        
        const volumeMultipliers = {
            'small': 1.0,
            'medium': 2.5,
            'large': 5.0,
            'enterprise': 10.0
        };
        
        const baseValue = baseValues[leadData.organizationType] || 25000;
        const multiplier = volumeMultipliers[leadData.dataVolume] || 1.0;
        
        return Math.round(baseValue * multiplier);
    }
    
    getEstimatedCloseDate() {
        const date = new Date();
        date.setDate(date.getDate() + 45); // 45 days from now
        return date.toISOString().split('T')[0];
    }
    
    async updateDealStage(dealId, newStage) {
        const update = {
            properties: {
                dealstage: newStage,
                hs_lastmodifieddate: new Date().toISOString()
            }
        };
        
        try {
            const response = await this.makeRequest('PATCH', `${this.endpoints.deals}/${dealId}`, update);
            console.log(`✅ Deal ${dealId} moved to stage: ${newStage}`);
            return response;
        } catch (error) {
            console.error('❌ Error updating deal stage:', error);
            throw error;
        }
    }
    
    async getDealsByStage(stage) {
        try {
            const response = await this.makeRequest('GET', 
                `${this.endpoints.deals}/search`, 
                {
                    filterGroups: [{
                        filters: [{
                            propertyName: 'dealstage',
                            operator: 'EQ',
                            value: stage
                        }]
                    }]
                }
            );
            
            return response.results;
        } catch (error) {
            console.error('❌ Error fetching deals:', error);
            return [];
        }
    }
    
    async generateSalesReport() {
        try {
            const stages = [
                'lead_generated',
                'demo_scheduled', 
                'demo_completed',
                'proposal_sent',
                'negotiation',
                'closed_won',
                'closed_lost'
            ];
            
            const report = {
                timestamp: new Date().toISOString(),
                pipeline: 'Blaze Intelligence Sales Pipeline',
                stages: {}
            };
            
            for (const stage of stages) {
                const deals = await this.getDealsByStage(stage);
                const totalValue = deals.reduce((sum, deal) => 
                    sum + (parseFloat(deal.properties.amount) || 0), 0
                );
                
                report.stages[stage] = {
                    count: deals.length,
                    totalValue: totalValue,
                    averageValue: deals.length > 0 ? totalValue / deals.length : 0,
                    deals: deals.map(deal => ({
                        id: deal.id,
                        name: deal.properties.dealname,
                        amount: deal.properties.amount,
                        closeDate: deal.properties.closedate
                    }))
                };
            }
            
            report.summary = {
                totalDeals: Object.values(report.stages).reduce((sum, stage) => sum + stage.count, 0),
                totalPipelineValue: Object.values(report.stages).reduce((sum, stage) => sum + stage.totalValue, 0),
                conversionRate: report.stages.closed_won ? 
                    (report.stages.closed_won.count / (report.stages.closed_won.count + report.stages.closed_lost.count)) * 100 : 0
            };
            
            console.log('📊 Sales report generated:', report);
            return report;
        } catch (error) {
            console.error('❌ Error generating sales report:', error);
            return null;
        }
    }
    
    async makeRequest(method, endpoint, data = null) {
        const url = `${this.config.baseUrl}${endpoint}`;
        const options = {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.config.apiKey}`
            }
        };
        
        if (data && (method === 'POST' || method === 'PATCH')) {
            options.body = JSON.stringify(data);
        }
        
        const response = await fetch(url, options);
        
        if (!response.ok) {
            throw new Error(`HubSpot API error: ${response.status} ${response.statusText}`);
        }
        
        return await response.json();
    }
    
    async createProperty(objectType, property) {
        try {
            await this.makeRequest('POST', `${this.endpoints.properties}/${objectType}`, property);
        } catch (error) {
            // Property might already exist, that's ok
            if (!error.message.includes('PROPERTY_ALREADY_EXISTS')) {
                throw error;
            }
        }
    }
    
    async createPipeline(pipeline) {
        try {
            await this.makeRequest('POST', this.endpoints.pipelines, pipeline);
        } catch (error) {
            // Pipeline might already exist, that's ok
            if (!error.message.includes('PIPELINE_ALREADY_EXISTS')) {
                throw error;
            }
        }
    }
}

// Auto-initialize for browser
if (typeof window !== 'undefined') {
    window.blazeHubSpot = new BlazeHubSpotIntegration();
}

// Export for modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeHubSpotIntegration;
}