#!/usr/bin/env node

/**
 * Blaze Intelligence Asana Workspace Setup Script
 * Comprehensive workspace creation for championship-level business strategy
 * 
 * Features:
 * - Creates structured projects for Q4 2025 ($325K) and 2026 ($1.875M) revenue targets
 * - Sets up multi-platform AI coordination workflows
 * - Establishes integration points for HubSpot, Notion, Stripe
 * - Configures prospect outreach templates for all target segments
 */

const axios = require('axios');
const fs = require('fs');

class BlazeAsanaSetup {
    constructor(personalAccessToken) {
        this.token = personalAccessToken;
        this.baseURL = 'https://app.asana.com/api/1.0';
        this.headers = {
            'Authorization': `Bearer ${this.token}`,
            'Content-Type': 'application/json'
        };
        this.workspaceConfig = null;
        this.createdResources = {
            team: null,
            projects: [],
            goals: [],
            templates: []
        };
    }

    async loadConfiguration() {
        try {
            const configData = fs.readFileSync('./blaze-asana-workspace-config.json', 'utf8');
            this.workspaceConfig = JSON.parse(configData);
            console.log('✅ Configuration loaded successfully');
            return true;
        } catch (error) {
            console.error('❌ Failed to load configuration:', error.message);
            return false;
        }
    }

    async createTeam() {
        try {
            const response = await axios.post(`${this.baseURL}/teams`, {
                data: {
                    name: this.workspaceConfig.workspace_name,
                    description: this.workspaceConfig.description,
                    organization: await this.getDefaultWorkspace()
                }
            }, { headers: this.headers });

            this.createdResources.team = response.data.data;
            console.log(`✅ Created team: ${response.data.data.name}`);
            return response.data.data;
        } catch (error) {
            console.error('❌ Failed to create team:', error.response?.data || error.message);
            throw error;
        }
    }

    async getDefaultWorkspace() {
        try {
            const response = await axios.get(`${this.baseURL}/workspaces`, { headers: this.headers });
            return response.data.data[0].gid; // Use first available workspace
        } catch (error) {
            console.error('❌ Failed to get workspace:', error.message);
            throw error;
        }
    }

    async createProjects() {
        const team = this.createdResources.team;
        if (!team) throw new Error('Team must be created first');

        for (const projectConfig of this.workspaceConfig.projects) {
            try {
                const response = await axios.post(`${this.baseURL}/projects`, {
                    data: {
                        name: projectConfig.name,
                        notes: projectConfig.description,
                        color: projectConfig.color,
                        team: team.gid,
                        layout: 'board',
                        public: false
                    }
                }, { headers: this.headers });

                const project = response.data.data;
                this.createdResources.projects.push(project);
                console.log(`✅ Created project: ${project.name}`);

                // Create sections and tasks
                await this.createSectionsAndTasks(project, projectConfig.sections);

            } catch (error) {
                console.error(`❌ Failed to create project ${projectConfig.name}:`, error.response?.data || error.message);
            }
        }
    }

    async createSectionsAndTasks(project, sections) {
        for (const sectionConfig of sections) {
            try {
                // Create section
                const sectionResponse = await axios.post(`${this.baseURL}/sections`, {
                    data: {
                        name: sectionConfig.name,
                        project: project.gid
                    }
                }, { headers: this.headers });

                const section = sectionResponse.data.data;
                console.log(`  ✅ Created section: ${section.name}`);

                // Create tasks in section
                for (const taskConfig of sectionConfig.tasks) {
                    await this.createTask(project, section, taskConfig);
                    // Add delay to respect API rate limits
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

            } catch (error) {
                console.error(`❌ Failed to create section ${sectionConfig.name}:`, error.message);
            }
        }
    }

    async createTask(project, section, taskConfig) {
        try {
            const taskData = {
                name: taskConfig.name,
                notes: taskConfig.notes || '',
                projects: [project.gid],
                memberships: [{
                    project: project.gid,
                    section: section.gid
                }]
            };

            if (taskConfig.due_date) {
                taskData.due_on = taskConfig.due_date;
            }

            const response = await axios.post(`${this.baseURL}/tasks`, {
                data: taskData
            }, { headers: this.headers });

            const task = response.data.data;

            // Add tags if specified
            if (taskConfig.tags) {
                await this.addTagsToTask(task.gid, taskConfig.tags);
            }

            console.log(`    ✅ Created task: ${task.name}`);
            return task;

        } catch (error) {
            console.error(`❌ Failed to create task ${taskConfig.name}:`, error.message);
        }
    }

    async addTagsToTask(taskGid, tags) {
        for (const tagName of tags) {
            try {
                // Create or get tag
                const tag = await this.createOrGetTag(tagName);
                
                // Add tag to task
                await axios.post(`${this.baseURL}/tasks/${taskGid}/addTag`, {
                    data: { tag: tag.gid }
                }, { headers: this.headers });

            } catch (error) {
                console.error(`❌ Failed to add tag ${tagName}:`, error.message);
            }
        }
    }

    async createOrGetTag(tagName) {
        try {
            const workspace = await this.getDefaultWorkspace();
            
            // Try to find existing tag
            const response = await axios.get(`${this.baseURL}/tags`, {
                headers: this.headers,
                params: { workspace: workspace }
            });

            const existingTag = response.data.data.find(tag => tag.name === tagName);
            if (existingTag) {
                return existingTag;
            }

            // Create new tag
            const createResponse = await axios.post(`${this.baseURL}/tags`, {
                data: {
                    name: tagName,
                    workspace: workspace,
                    color: this.getTagColor(tagName)
                }
            }, { headers: this.headers });

            return createResponse.data.data;

        } catch (error) {
            console.error(`❌ Failed to create/get tag ${tagName}:`, error.message);
            return null;
        }
    }

    getTagColor(tagName) {
        const colorMap = {
            'MLB': 'blue',
            'NFL': 'green',
            'NBA': 'orange',
            'NCAA': 'purple',
            'Youth': 'yellow',
            'Professional': 'red',
            'High-Priority': 'red',
            'Enterprise': 'dark-blue',
            'International': 'teal',
            'Vision-AI': 'pink',
            'Research': 'light-blue',
            'Demo': 'green',
            'Integration': 'dark-green'
        };
        return colorMap[tagName] || 'light-gray';
    }

    async createGoals() {
        const team = this.createdResources.team;
        if (!team) throw new Error('Team must be created first');

        for (const goalConfig of this.workspaceConfig.goals) {
            try {
                const response = await axios.post(`${this.baseURL}/goals`, {
                    data: {
                        name: goalConfig.name,
                        notes: goalConfig.description,
                        due_on: goalConfig.due_date,
                        team: team.gid,
                        metric: {
                            unit: goalConfig.unit,
                            target_value: goalConfig.target,
                            initial_value: 0,
                            precision: 0
                        }
                    }
                }, { headers: this.headers });

                this.createdResources.goals.push(response.data.data);
                console.log(`✅ Created goal: ${response.data.data.name}`);

            } catch (error) {
                console.error(`❌ Failed to create goal ${goalConfig.name}:`, error.response?.data || error.message);
            }
        }
    }

    async createProjectTemplates() {
        const team = this.createdResources.team;
        if (!team) throw new Error('Team must be created first');

        for (const templateConfig of this.workspaceConfig.templates) {
            try {
                const response = await axios.post(`${this.baseURL}/projects`, {
                    data: {
                        name: `TEMPLATE: ${templateConfig.name}`,
                        notes: `Template for ${templateConfig.description}`,
                        team: team.gid,
                        layout: 'list',
                        public: false,
                        color: 'light-gray'
                    }
                }, { headers: this.headers });

                const template = response.data.data;
                this.createdResources.templates.push(template);

                // Create template tasks
                for (const taskConfig of templateConfig.tasks) {
                    await this.createTemplateTask(template, taskConfig);
                    await new Promise(resolve => setTimeout(resolve, 100));
                }

                console.log(`✅ Created template: ${template.name}`);

            } catch (error) {
                console.error(`❌ Failed to create template ${templateConfig.name}:`, error.message);
            }
        }
    }

    async createTemplateTask(template, taskConfig) {
        try {
            const response = await axios.post(`${this.baseURL}/tasks`, {
                data: {
                    name: taskConfig.name,
                    notes: `${taskConfig.notes}\n\nEstimated Duration: ${taskConfig.duration} days`,
                    projects: [template.gid]
                }
            }, { headers: this.headers });

            if (taskConfig.tags) {
                await this.addTagsToTask(response.data.data.gid, taskConfig.tags);
            }

            return response.data.data;

        } catch (error) {
            console.error(`❌ Failed to create template task ${taskConfig.name}:`, error.message);
        }
    }

    async createCustomFields() {
        const team = this.createdResources.team;
        if (!team) throw new Error('Team must be created first');

        for (const fieldConfig of this.workspaceConfig.custom_fields) {
            try {
                const response = await axios.post(`${this.baseURL}/custom_fields`, {
                    data: {
                        name: fieldConfig.name,
                        type: fieldConfig.type,
                        workspace: await this.getDefaultWorkspace(),
                        enum_options: fieldConfig.options?.map(option => ({ name: option }))
                    }
                }, { headers: this.headers });

                console.log(`✅ Created custom field: ${response.data.data.name}`);

            } catch (error) {
                console.error(`❌ Failed to create custom field ${fieldConfig.name}:`, error.message);
            }
        }
    }

    async generateSetupReport() {
        const report = {
            timestamp: new Date().toISOString(),
            workspace_name: this.workspaceConfig.workspace_name,
            created_resources: {
                team: this.createdResources.team?.name || null,
                projects: this.createdResources.projects.map(p => p.name),
                goals: this.createdResources.goals.map(g => g.name),
                templates: this.createdResources.templates.map(t => t.name)
            },
            next_steps: [
                "Set up Asana API token in environment variables",
                "Configure HubSpot integration for CRM sync",
                "Connect Stripe for revenue tracking",
                "Set up Notion bidirectional sync",
                "Train team members on multi-platform AI coordination",
                "Begin Q4 2025 campaign execution"
            ],
            success_metrics: {
                q4_2025_revenue_target: "$325,000",
                annual_2026_revenue_target: "$1,875,000",
                professional_team_partnerships: "5 teams",
                college_program_clients: "10 programs"
            }
        };

        fs.writeFileSync('./blaze-asana-setup-report.json', JSON.stringify(report, null, 2));
        console.log('📊 Setup report generated: blaze-asana-setup-report.json');
        return report;
    }

    async run() {
        console.log('🚀 Starting Blaze Intelligence Asana Workspace Setup...\n');

        try {
            // Load configuration
            if (!(await this.loadConfiguration())) {
                throw new Error('Failed to load configuration');
            }

            // Create team workspace
            await this.createTeam();

            // Create projects with sections and tasks
            console.log('\n📁 Creating projects...');
            await this.createProjects();

            // Create goals
            console.log('\n🎯 Creating goals...');
            await this.createGoals();

            // Create templates
            console.log('\n📋 Creating templates...');
            await this.createProjectTemplates();

            // Create custom fields
            console.log('\n🏷️ Creating custom fields...');
            await this.createCustomFields();

            // Generate report
            console.log('\n📊 Generating setup report...');
            const report = await this.generateSetupReport();

            console.log('\n✅ Blaze Intelligence Asana workspace setup complete!');
            console.log(`\nWorkspace: ${report.workspace_name}`);
            console.log(`Projects: ${report.created_resources.projects.length}`);
            console.log(`Goals: ${report.created_resources.goals.length}`);
            console.log(`Templates: ${report.created_resources.templates.length}`);
            
            console.log('\n🏆 Ready for championship-level business execution!');

        } catch (error) {
            console.error('\n❌ Setup failed:', error.message);
            throw error;
        }
    }
}

// Usage example
if (require.main === module) {
    const token = process.env.ASANA_TOKEN;
    if (!token) {
        console.error('❌ Please set ASANA_TOKEN environment variable');
        process.exit(1);
    }

    const setup = new BlazeAsanaSetup(token);
    setup.run().catch(error => {
        console.error('Setup failed:', error);
        process.exit(1);
    });
}

module.exports = BlazeAsanaSetup;