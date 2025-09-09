/**
 * Blaze Intelligence CRM Integration Hub
 * Synchronizes payment data with HubSpot CRM and Airtable operations
 */

class BlazeCRMIntegration {
  constructor(env) {
    this.env = env;
    this.hubspotApiKey = env.HUBSPOT_API_KEY;
    this.airtableApiKey = env.AIRTABLE_API_KEY;
    this.airtableBaseId = env.AIRTABLE_BASE_ID;
    this.notionApiKey = env.NOTION_API_KEY;
  }

  /**
   * Sync customer data across all platforms
   */
  async syncCustomerData(customerData) {
    try {
      const results = await Promise.allSettled([
        this.createHubSpotContact(customerData),
        this.createAirtableRecord(customerData),
        this.createNotionPage(customerData)
      ]);

      const success = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        success: success > 0,
        synced: success,
        failed: failed,
        hubspot: results[0].status === 'fulfilled' ? results[0].value : null,
        airtable: results[1].status === 'fulfilled' ? results[1].value : null,
        notion: results[2].status === 'fulfilled' ? results[2].value : null,
        errors: results.filter(r => r.status === 'rejected').map(r => r.reason.message)
      };
    } catch (error) {
      console.error('CRM sync failed:', error);
      return {
        success: false,
        error: error.message
      };
    }
  }

  /**
   * Create HubSpot contact and deal
   */
  async createHubSpotContact(customerData) {
    try {
      // Create contact
      const contactUrl = 'https://api.hubapi.com/crm/v3/objects/contacts';
      
      const contactData = {
        properties: {
          email: customerData.email,
          firstname: customerData.contactPerson?.split(' ')[0] || '',
          lastname: customerData.contactPerson?.split(' ').slice(1).join(' ') || '',
          company: customerData.organization,
          phone: customerData.phone || '',
          website: customerData.website || '',
          hs_lead_status: 'CUSTOMER',
          lifecyclestage: 'customer',
          
          // Custom Blaze Intelligence properties
          blaze_tier: customerData.tier,
          blaze_sport: customerData.sport,
          blaze_subscription_id: customerData.subscriptionId,
          blaze_customer_id: customerData.stripeCustomerId,
          blaze_mrr: customerData.monthlyValue,
          blaze_arr: customerData.annualValue,
          blaze_signup_date: new Date().toISOString(),
          blaze_payment_method: customerData.paymentMethod || 'stripe',
          blaze_trial_end: customerData.trialEnd || null
        }
      };

      const contactResponse = await fetch(contactUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hubspotApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(contactData)
      });

      if (!contactResponse.ok) {
        const errorData = await contactResponse.text();
        throw new Error(`HubSpot contact creation failed: ${errorData}`);
      }

      const contact = await contactResponse.json();

      // Create deal for the subscription
      const deal = await this.createHubSpotDeal(contact.id, customerData);

      // Create company if it doesn't exist
      const company = await this.createHubSpotCompany(customerData);

      // Associate contact with company
      if (company) {
        await this.associateContactWithCompany(contact.id, company.id);
      }

      return {
        contact,
        deal,
        company
      };
    } catch (error) {
      console.error('HubSpot contact creation failed:', error);
      throw error;
    }
  }

  /**
   * Create HubSpot deal
   */
  async createHubSpotDeal(contactId, customerData) {
    try {
      const dealUrl = 'https://api.hubapi.com/crm/v3/objects/deals';
      
      const dealData = {
        properties: {
          dealname: `${customerData.organization} - ${customerData.tier} Package`,
          dealstage: customerData.trialEnd ? 'closedwon' : 'contractsent',
          pipeline: 'default',
          amount: customerData.annualValue,
          dealtype: 'newbusiness',
          closedate: new Date().toISOString(),
          
          // Custom properties
          blaze_tier: customerData.tier,
          blaze_sport: customerData.sport,
          blaze_subscription_id: customerData.subscriptionId,
          blaze_payment_frequency: customerData.paymentFrequency || 'annual',
          blaze_contract_length: '12 months'
        },
        associations: [
          {
            to: { id: contactId },
            types: [{ associationCategory: 'HUBSPOT_DEFINED', associationTypeId: 3 }] // Deal to Contact
          }
        ]
      };

      const dealResponse = await fetch(dealUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hubspotApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(dealData)
      });

      if (!dealResponse.ok) {
        throw new Error(`HubSpot deal creation failed: ${dealResponse.statusText}`);
      }

      return await dealResponse.json();
    } catch (error) {
      console.error('HubSpot deal creation failed:', error);
      throw error;
    }
  }

  /**
   * Create HubSpot company
   */
  async createHubSpotCompany(customerData) {
    try {
      // First check if company exists
      const searchUrl = `https://api.hubapi.com/crm/v3/objects/companies/search`;
      
      const searchData = {
        filterGroups: [
          {
            filters: [
              {
                propertyName: 'name',
                operator: 'EQ',
                value: customerData.organization
              }
            ]
          }
        ],
        limit: 1
      };

      const searchResponse = await fetch(searchUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hubspotApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(searchData)
      });

      const searchResult = await searchResponse.json();
      
      if (searchResult.results && searchResult.results.length > 0) {
        return searchResult.results[0]; // Company already exists
      }

      // Create new company
      const companyUrl = 'https://api.hubapi.com/crm/v3/objects/companies';
      
      const companyData = {
        properties: {
          name: customerData.organization,
          domain: customerData.website || '',
          industry: 'Sports Technology',
          type: this.determineCompanyType(customerData.tier),
          phone: customerData.phone || '',
          
          // Custom properties
          blaze_tier: customerData.tier,
          blaze_sport: customerData.sport,
          blaze_customer_since: new Date().toISOString(),
          blaze_total_value: customerData.annualValue
        }
      };

      const companyResponse = await fetch(companyUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.hubspotApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(companyData)
      });

      if (!companyResponse.ok) {
        throw new Error(`HubSpot company creation failed: ${companyResponse.statusText}`);
      }

      return await companyResponse.json();
    } catch (error) {
      console.error('HubSpot company creation failed:', error);
      return null; // Don't fail the whole sync for company issues
    }
  }

  /**
   * Associate contact with company in HubSpot
   */
  async associateContactWithCompany(contactId, companyId) {
    try {
      const associationUrl = `https://api.hubapi.com/crm/v3/objects/contacts/${contactId}/associations/companies/${companyId}/1`;
      
      const response = await fetch(associationUrl, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${this.hubspotApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      return response.ok;
    } catch (error) {
      console.error('HubSpot association failed:', error);
      return false;
    }
  }

  /**
   * Create Airtable record
   */
  async createAirtableRecord(customerData) {
    try {
      const airtableUrl = `https://api.airtable.com/v0/${this.airtableBaseId}/Customers`;
      
      const recordData = {
        fields: {
          'Organization': customerData.organization,
          'Email': customerData.email,
          'Contact Person': customerData.contactPerson,
          'Phone': customerData.phone || '',
          'Tier': customerData.tier,
          'Sport': customerData.sport,
          'Status': customerData.trialEnd ? 'Trial' : 'Active',
          'Stripe Customer ID': customerData.stripeCustomerId,
          'Subscription ID': customerData.subscriptionId,
          'Monthly Value': customerData.monthlyValue,
          'Annual Value': customerData.annualValue,
          'Trial End Date': customerData.trialEnd ? new Date(customerData.trialEnd * 1000).toISOString() : null,
          'Created Date': new Date().toISOString(),
          'Payment Method': customerData.paymentMethod || 'stripe',
          'Billing Country': customerData.country || 'US',
          
          // Calculated fields
          'MRR': customerData.monthlyValue,
          'ARR': customerData.annualValue,
          'Customer Segment': this.determineCustomerSegment(customerData.tier),
          'Onboarding Status': 'Pending',
          'Health Score': 100, // Start with perfect health
          
          // Contact information
          'Website': customerData.website || '',
          'Address': customerData.address || '',
          'City': customerData.city || '',
          'State': customerData.state || '',
          'ZIP': customerData.zip || '',
          
          // Sports-specific data
          'League/Conference': customerData.league || '',
          'Team Size': customerData.teamSize || 0,
          'Season Start': customerData.seasonStart || '',
          'Primary Use Case': customerData.useCase || 'Analytics'
        }
      };

      const response = await fetch(airtableUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(recordData)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`Airtable record creation failed: ${errorData}`);
      }

      const airtableRecord = await response.json();

      // Create related records
      await Promise.all([
        this.createAirtableSubscriptionRecord(airtableRecord.id, customerData),
        this.createAirtableOnboardingTasks(airtableRecord.id, customerData)
      ]);

      return airtableRecord;
    } catch (error) {
      console.error('Airtable record creation failed:', error);
      throw error;
    }
  }

  /**
   * Create Airtable subscription record
   */
  async createAirtableSubscriptionRecord(customerId, customerData) {
    try {
      const subscriptionUrl = `https://api.airtable.com/v0/${this.airtableBaseId}/Subscriptions`;
      
      const subscriptionData = {
        fields: {
          'Customer': [customerId],
          'Subscription ID': customerData.subscriptionId,
          'Tier': customerData.tier,
          'Status': customerData.trialEnd ? 'Trial' : 'Active',
          'Monthly Amount': customerData.monthlyValue,
          'Annual Amount': customerData.annualValue,
          'Start Date': new Date().toISOString(),
          'Trial End Date': customerData.trialEnd ? new Date(customerData.trialEnd * 1000).toISOString() : null,
          'Next Billing Date': this.calculateNextBillingDate(customerData),
          'Payment Method': customerData.paymentMethod || 'stripe',
          'Billing Frequency': customerData.paymentFrequency || 'annual'
        }
      };

      const response = await fetch(subscriptionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.airtableApiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(subscriptionData)
      });

      return response.ok;
    } catch (error) {
      console.error('Airtable subscription record creation failed:', error);
      return false;
    }
  }

  /**
   * Create Airtable onboarding tasks
   */
  async createAirtableOnboardingTasks(customerId, customerData) {
    try {
      const tasksUrl = `https://api.airtable.com/v0/${this.airtableBaseId}/Onboarding Tasks`;
      
      const tasks = this.getOnboardingTasks(customerData.tier);
      
      const taskPromises = tasks.map((task, index) => {
        const taskData = {
          fields: {
            'Customer': [customerId],
            'Task Name': task.name,
            'Description': task.description,
            'Status': 'Pending',
            'Priority': task.priority,
            'Due Date': this.calculateTaskDueDate(index + 1),
            'Owner': 'Austin Humphrey',
            'Category': task.category,
            'Estimated Hours': task.estimatedHours
          }
        };

        return fetch(tasksUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${this.airtableApiKey}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(taskData)
        });
      });

      await Promise.all(taskPromises);
      return true;
    } catch (error) {
      console.error('Airtable onboarding tasks creation failed:', error);
      return false;
    }
  }

  /**
   * Create Notion page for customer documentation
   */
  async createNotionPage(customerData) {
    try {
      if (!this.notionApiKey) {
        console.log('Notion API key not available, skipping Notion sync');
        return null;
      }

      const notionUrl = 'https://api.notion.com/v1/pages';
      
      const pageData = {
        parent: {
          database_id: this.env.NOTION_DATABASE_ID
        },
        properties: {
          'Organization': {
            title: [
              {
                text: {
                  content: customerData.organization
                }
              }
            ]
          },
          'Tier': {
            select: {
              name: customerData.tier
            }
          },
          'Sport': {
            multi_select: [
              {
                name: customerData.sport
              }
            ]
          },
          'Status': {
            select: {
              name: customerData.trialEnd ? 'Trial' : 'Active'
            }
          },
          'Contact': {
            email: customerData.email
          },
          'Value': {
            number: customerData.annualValue
          },
          'Created': {
            date: {
              start: new Date().toISOString()
            }
          }
        },
        children: [
          {
            object: 'block',
            type: 'heading_1',
            heading_1: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `${customerData.organization} - Customer Profile`
                  }
                }
              ]
            }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `Contact: ${customerData.contactPerson} (${customerData.email})`
                  }
                }
              ]
            }
          },
          {
            object: 'block',
            type: 'paragraph',
            paragraph: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: `Tier: ${customerData.tier} | Sport: ${customerData.sport} | Value: $${customerData.annualValue}`
                  }
                }
              ]
            }
          },
          {
            object: 'block',
            type: 'heading_2',
            heading_2: {
              rich_text: [
                {
                  type: 'text',
                  text: {
                    content: 'Onboarding Checklist'
                  }
                }
              ]
            }
          }
        ].concat(this.getOnboardingTasks(customerData.tier).map(task => ({
          object: 'block',
          type: 'to_do',
          to_do: {
            rich_text: [
              {
                type: 'text',
                text: {
                  content: task.name
                }
              }
            ],
            checked: false
          }
        })))
      };

      const response = await fetch(notionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.notionApiKey}`,
          'Content-Type': 'application/json',
          'Notion-Version': '2022-06-28'
        },
        body: JSON.stringify(pageData)
      });

      if (!response.ok) {
        throw new Error(`Notion page creation failed: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Notion page creation failed:', error);
      throw error;
    }
  }

  /**
   * Update customer data across platforms when subscription changes
   */
  async updateCustomerData(subscriptionId, updates) {
    try {
      const results = await Promise.allSettled([
        this.updateHubSpotRecord(subscriptionId, updates),
        this.updateAirtableRecord(subscriptionId, updates),
        this.updateNotionPage(subscriptionId, updates)
      ]);

      return {
        success: results.some(r => r.status === 'fulfilled'),
        results: results.map((r, index) => ({
          platform: ['HubSpot', 'Airtable', 'Notion'][index],
          status: r.status,
          result: r.status === 'fulfilled' ? r.value : r.reason.message
        }))
      };
    } catch (error) {
      console.error('Customer update failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Helper functions
   */
  determineCompanyType(tier) {
    switch (tier) {
      case 'championship':
        return 'Professional Team';
      case 'enterprise':
        return 'Professional Organization';
      case 'professional':
        return 'College/University';
      case 'starter':
        return 'High School/Youth';
      default:
        return 'Sports Organization';
    }
  }

  determineCustomerSegment(tier) {
    switch (tier) {
      case 'championship':
        return 'Enterprise Plus';
      case 'enterprise':
        return 'Enterprise';
      case 'professional':
        return 'Mid-Market';
      case 'starter':
        return 'SMB';
      default:
        return 'Unknown';
    }
  }

  getOnboardingTasks(tier) {
    const baseTasks = [
      {
        name: 'Welcome call scheduled',
        description: 'Schedule initial onboarding call with customer',
        priority: 'High',
        category: 'Communication',
        estimatedHours: 1
      },
      {
        name: 'Platform access provisioned',
        description: 'Set up customer account and initial access',
        priority: 'High',
        category: 'Technical',
        estimatedHours: 2
      },
      {
        name: 'Data integration setup',
        description: 'Configure data feeds and initial integrations',
        priority: 'Medium',
        category: 'Technical',
        estimatedHours: 4
      },
      {
        name: 'Training session completed',
        description: 'Conduct platform training for key users',
        priority: 'Medium',
        category: 'Training',
        estimatedHours: 2
      },
      {
        name: 'Success criteria defined',
        description: 'Establish KPIs and success metrics',
        priority: 'Medium',
        category: 'Strategy',
        estimatedHours: 1
      }
    ];

    if (tier === 'championship' || tier === 'enterprise') {
      baseTasks.push(
        {
          name: 'Custom integration planning',
          description: 'Plan custom integrations and API setup',
          priority: 'Medium',
          category: 'Technical',
          estimatedHours: 8
        },
        {
          name: 'Dedicated success manager assigned',
          description: 'Assign dedicated customer success manager',
          priority: 'High',
          category: 'Account Management',
          estimatedHours: 1
        }
      );
    }

    return baseTasks;
  }

  calculateNextBillingDate(customerData) {
    const now = new Date();
    if (customerData.trialEnd) {
      return new Date(customerData.trialEnd * 1000).toISOString();
    }
    
    // Default to monthly billing
    now.setMonth(now.getMonth() + 1);
    return now.toISOString();
  }

  calculateTaskDueDate(dayOffset) {
    const now = new Date();
    now.setDate(now.getDate() + dayOffset);
    return now.toISOString();
  }
}

/**
 * Cloudflare Pages Functions handler for CRM integration
 */
export async function onRequestPost(context) {
  try {
    const { request, env } = context;
    const url = new URL(request.url);
    const pathname = url.pathname;

    const crmIntegration = new BlazeCRMIntegration(env);

    if (pathname.endsWith('/sync-customer')) {
      return await handleSyncCustomer(request, crmIntegration);
    } else if (pathname.endsWith('/update-customer')) {
      return await handleUpdateCustomer(request, crmIntegration);
    }

    return new Response('Not Found', { status: 404 });
  } catch (error) {
    console.error('CRM integration error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

async function handleSyncCustomer(request, crmIntegration) {
  try {
    const customerData = await request.json();
    const result = await crmIntegration.syncCustomerData(customerData);
    
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

async function handleUpdateCustomer(request, crmIntegration) {
  try {
    const { subscriptionId, updates } = await request.json();
    const result = await crmIntegration.updateCustomerData(subscriptionId, updates);
    
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