/**
 * Blaze Intelligence Subdomain Router
 * Handles routing for different platform extensions
 * 
 * Subdomain Structure:
 * - api.blaze-intelligence.com → API Gateway
 * - data.blaze-intelligence.com → Sports Data Hub
 * - live.blaze-intelligence.com → Live Scoreboards
 * - analytics.blaze-intelligence.com → Team Intelligence
 * - config.blaze-intelligence.com → Configuration Portal
 * - docs.blaze-intelligence.com → Documentation
 */

class SubdomainRouter {
    constructor() {
        this.routes = {
            'api': {
                name: 'API Gateway',
                description: 'Central API endpoint for all services',
                endpoints: [
                    '/sports/mlb/*',
                    '/sports/nfl/*',
                    '/sports/nba/*',
                    '/sports/ncaaf/*',
                    '/analytics/*',
                    '/intelligence/*'
                ],
                handler: this.handleAPIRoute.bind(this)
            },
            'data': {
                name: 'Sports Data Hub',
                description: 'Unified sports data aggregation',
                endpoints: [
                    '/teams/*',
                    '/players/*',
                    '/games/*',
                    '/standings/*',
                    '/stats/*'
                ],
                handler: this.handleDataRoute.bind(this)
            },
            'live': {
                name: 'Live Scoreboards',
                description: 'Real-time game scores and updates',
                endpoints: [
                    '/mlb/*',
                    '/nfl/*',
                    '/nba/*',
                    '/ncaaf/*',
                    '/stream/*'
                ],
                handler: this.handleLiveRoute.bind(this)
            },
            'analytics': {
                name: 'Team Intelligence Analytics',
                description: 'Advanced team and player analytics',
                endpoints: [
                    '/teams/*',
                    '/compare/*',
                    '/predictions/*',
                    '/trends/*',
                    '/export/*'
                ],
                handler: this.handleAnalyticsRoute.bind(this)
            },
            'config': {
                name: 'Configuration Portal',
                description: 'API key and system configuration',
                endpoints: [
                    '/keys/*',
                    '/settings/*',
                    '/webhooks/*',
                    '/integrations/*'
                ],
                handler: this.handleConfigRoute.bind(this)
            },
            'docs': {
                name: 'Documentation',
                description: 'API documentation and guides',
                endpoints: [
                    '/api/*',
                    '/guides/*',
                    '/examples/*',
                    '/swagger/*'
                ],
                handler: this.handleDocsRoute.bind(this)
            }
        };

        this.currentSubdomain = null;
        this.baseDomain = 'blaze-intelligence.com';
        
        this.init();
    }

    init() {
        // Detect current subdomain
        this.detectSubdomain();
        
        // Set up routing
        this.setupRouting();
        
        // Initialize service based on subdomain
        this.initializeService();
        
        console.log(`🚀 Subdomain Router initialized for: ${this.currentSubdomain || 'main'}`);
    }

    detectSubdomain() {
        const hostname = window.location.hostname;
        
        // Handle localhost development
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            // Check for subdomain simulation via URL parameter
            const urlParams = new URLSearchParams(window.location.search);
            this.currentSubdomain = urlParams.get('subdomain') || null;
            return;
        }
        
        // Handle Replit deployments
        if (hostname.includes('.repl.co') || hostname.includes('.replit.dev')) {
            // Use path-based routing for Replit
            const path = window.location.pathname;
            if (path.startsWith('/api/')) this.currentSubdomain = 'api';
            else if (path.startsWith('/data/')) this.currentSubdomain = 'data';
            else if (path.startsWith('/live/')) this.currentSubdomain = 'live';
            else if (path.startsWith('/analytics/')) this.currentSubdomain = 'analytics';
            else if (path.startsWith('/config/')) this.currentSubdomain = 'config';
            else if (path.startsWith('/docs/')) this.currentSubdomain = 'docs';
            return;
        }
        
        // Handle Cloudflare Pages
        if (hostname.includes('.pages.dev')) {
            const parts = hostname.split('.');
            if (parts.length > 2) {
                // Extract subdomain from Cloudflare Pages URL
                const projectName = parts[0];
                if (projectName.includes('-')) {
                    const subdomainPart = projectName.split('-').pop();
                    this.currentSubdomain = this.routes[subdomainPart] ? subdomainPart : null;
                }
            }
            return;
        }
        
        // Handle production domain
        if (hostname.includes(this.baseDomain)) {
            const parts = hostname.split('.');
            if (parts.length > 2) {
                this.currentSubdomain = parts[0];
            }
        }
    }

    setupRouting() {
        // Listen for navigation events
        window.addEventListener('popstate', (event) => {
            this.handleRoute(window.location.pathname);
        });

        // Intercept link clicks for SPA routing
        document.addEventListener('click', (event) => {
            const link = event.target.closest('a');
            if (link && link.href && link.href.startsWith(window.location.origin)) {
                event.preventDefault();
                const path = new URL(link.href).pathname;
                this.navigate(path);
            }
        });
    }

    navigate(path) {
        window.history.pushState({}, '', path);
        this.handleRoute(path);
    }

    handleRoute(path) {
        if (!this.currentSubdomain || !this.routes[this.currentSubdomain]) {
            // Main domain routing
            this.handleMainRoute(path);
            return;
        }

        const route = this.routes[this.currentSubdomain];
        route.handler(path);
    }

    initializeService() {
        if (!this.currentSubdomain) {
            console.log('📍 Main domain - Loading full platform');
            this.loadMainPlatform();
            return;
        }

        const route = this.routes[this.currentSubdomain];
        if (route) {
            console.log(`📍 ${route.name} subdomain detected`);
            this.loadSubdomainService();
        }
    }

    loadMainPlatform() {
        // Main platform is already loaded via index.html
        // Add any additional initialization here
        document.dispatchEvent(new CustomEvent('blazePlatformReady', {
            detail: { subdomain: null, service: 'main' }
        }));
    }

    loadSubdomainService() {
        // Create subdomain-specific UI
        const container = document.getElementById('subdomain-content') || this.createSubdomainContainer();
        
        switch(this.currentSubdomain) {
            case 'api':
                this.loadAPIGateway(container);
                break;
            case 'data':
                this.loadDataHub(container);
                break;
            case 'live':
                this.loadLiveScoreboards(container);
                break;
            case 'analytics':
                this.loadAnalytics(container);
                break;
            case 'config':
                this.loadConfiguration(container);
                break;
            case 'docs':
                this.loadDocumentation(container);
                break;
        }

        document.dispatchEvent(new CustomEvent('blazePlatformReady', {
            detail: { 
                subdomain: this.currentSubdomain, 
                service: this.routes[this.currentSubdomain].name 
            }
        }));
    }

    createSubdomainContainer() {
        const container = document.createElement('div');
        container.id = 'subdomain-content';
        container.className = 'subdomain-container';
        
        // Add to body or replace main content
        const mainContent = document.querySelector('main') || document.body;
        mainContent.innerHTML = '';
        mainContent.appendChild(container);
        
        return container;
    }

    // Route Handlers
    handleMainRoute(path) {
        console.log(`📍 Main route: ${path}`);
        // Main domain routing logic
    }

    handleAPIRoute(path) {
        console.log(`🔌 API route: ${path}`);
        // API gateway routing
    }

    handleDataRoute(path) {
        console.log(`📊 Data route: ${path}`);
        // Sports data hub routing
    }

    handleLiveRoute(path) {
        console.log(`📺 Live route: ${path}`);
        // Live scoreboard routing
    }

    handleAnalyticsRoute(path) {
        console.log(`📈 Analytics route: ${path}`);
        // Analytics routing
    }

    handleConfigRoute(path) {
        console.log(`⚙️ Config route: ${path}`);
        // Configuration routing
    }

    handleDocsRoute(path) {
        console.log(`📚 Docs route: ${path}`);
        // Documentation routing
    }

    // Service Loaders
    loadAPIGateway(container) {
        container.innerHTML = `
            <div class="api-gateway">
                <h1>🔌 Blaze Intelligence API Gateway</h1>
                <div class="api-status">
                    <h2>Service Status</h2>
                    <div id="api-health-checks"></div>
                </div>
                <div class="api-endpoints">
                    <h2>Available Endpoints</h2>
                    <ul>
                        ${this.routes.api.endpoints.map(ep => `<li><code>${ep}</code></li>`).join('')}
                    </ul>
                </div>
                <div class="api-tester">
                    <h2>API Tester</h2>
                    <input type="text" id="api-endpoint" placeholder="/sports/mlb/teams">
                    <button onclick="subdomainRouter.testAPI()">Test Endpoint</button>
                    <pre id="api-response"></pre>
                </div>
            </div>
        `;
        this.initAPIGateway();
    }

    loadDataHub(container) {
        container.innerHTML = `
            <div class="data-hub">
                <h1>📊 Sports Data Hub</h1>
                <div id="data-hub-controls"></div>
                <div id="data-hub-content"></div>
            </div>
        `;
        
        // Load sports data hub if available
        if (window.sportsDataHub) {
            window.sportsDataHub.initializeDashboard();
        }
    }

    loadLiveScoreboards(container) {
        container.innerHTML = `
            <div class="live-scoreboards">
                <h1>📺 Live Sports Scoreboards</h1>
                <div class="scoreboard-grid">
                    <div id="mlb-live-scoreboard"></div>
                    <div id="nfl-live-scoreboard"></div>
                    <div id="nba-live-scoreboard"></div>
                    <div id="ncaaf-live-scoreboard"></div>
                </div>
            </div>
        `;
        
        // Initialize live scoreboards
        if (window.liveScoreboard) {
            window.liveScoreboard.createScoreboardWidget('mlb-live-scoreboard', 'mlb');
            window.liveScoreboard.createScoreboardWidget('nfl-live-scoreboard', 'nfl');
        }
    }

    loadAnalytics(container) {
        container.innerHTML = `
            <div class="analytics-platform">
                <h1>📈 Team Intelligence Analytics</h1>
                <div id="analytics-dashboard"></div>
            </div>
        `;
        
        // Initialize team intelligence cards
        if (window.teamIntelligenceCards) {
            const analyticsDiv = document.getElementById('analytics-dashboard');
            window.teamIntelligenceCards.container = analyticsDiv;
            window.teamIntelligenceCards.render();
        }
    }

    loadConfiguration(container) {
        // Load configuration UI (could iframe setup-api-keys.html)
        container.innerHTML = `
            <iframe src="/setup-api-keys.html" 
                    style="width: 100%; height: 100vh; border: none;">
            </iframe>
        `;
    }

    loadDocumentation(container) {
        container.innerHTML = `
            <div class="documentation">
                <h1>📚 Blaze Intelligence Documentation</h1>
                <nav class="docs-nav">
                    <ul>
                        <li><a href="/docs/api">API Reference</a></li>
                        <li><a href="/docs/guides">Integration Guides</a></li>
                        <li><a href="/docs/examples">Code Examples</a></li>
                        <li><a href="/docs/swagger">Interactive API</a></li>
                    </ul>
                </nav>
                <div id="docs-content">
                    <h2>Getting Started</h2>
                    <p>Welcome to the Blaze Intelligence documentation.</p>
                </div>
            </div>
        `;
    }

    // API Gateway Methods
    initAPIGateway() {
        // Check health of all services
        this.checkServicesHealth();
    }

    async checkServicesHealth() {
        const healthChecks = [
            { name: 'MLB Stats API', url: 'https://statsapi.mlb.com/api/v1/teams' },
            { name: 'ESPN API', url: 'https://site.api.espn.com/apis/site/v2/sports/baseball/mlb/scoreboard' },
            { name: 'Gateway', url: 'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/healthz' }
        ];

        const container = document.getElementById('api-health-checks');
        if (!container) return;

        for (const check of healthChecks) {
            const status = document.createElement('div');
            status.className = 'health-check';
            
            try {
                const response = await fetch(check.url);
                status.innerHTML = `✅ ${check.name}: ${response.ok ? 'Healthy' : 'Error ' + response.status}`;
            } catch (error) {
                status.innerHTML = `❌ ${check.name}: Offline`;
            }
            
            container.appendChild(status);
        }
    }

    async testAPI() {
        const endpoint = document.getElementById('api-endpoint').value;
        const responseDiv = document.getElementById('api-response');
        
        if (!endpoint) {
            responseDiv.textContent = 'Please enter an endpoint';
            return;
        }

        responseDiv.textContent = 'Loading...';
        
        try {
            // This would call your actual API
            const response = await fetch(`https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev${endpoint}`);
            const data = await response.json();
            responseDiv.textContent = JSON.stringify(data, null, 2);
        } catch (error) {
            responseDiv.textContent = `Error: ${error.message}`;
        }
    }

    // Utility Methods
    getSubdomainURL(subdomain, path = '/') {
        if (window.location.hostname === 'localhost') {
            return `http://localhost:8000${path}?subdomain=${subdomain}`;
        }
        
        if (window.location.hostname.includes('.repl')) {
            return `${window.location.origin}/${subdomain}${path}`;
        }
        
        if (window.location.hostname.includes('.pages.dev')) {
            return `${window.location.origin}/${subdomain}${path}`;
        }
        
        return `https://${subdomain}.${this.baseDomain}${path}`;
    }

    generateNavigation() {
        const nav = document.createElement('nav');
        nav.className = 'subdomain-nav';
        nav.innerHTML = `
            <div class="nav-container">
                <a href="${this.getSubdomainURL('', '/')}" class="nav-logo">
                    🔥 Blaze Intelligence
                </a>
                <div class="nav-links">
                    ${Object.entries(this.routes).map(([key, route]) => `
                        <a href="${this.getSubdomainURL(key, '/')}" 
                           class="${this.currentSubdomain === key ? 'active' : ''}">
                            ${route.name}
                        </a>
                    `).join('')}
                </div>
            </div>
        `;
        
        return nav;
    }
}

// Global instance
let subdomainRouter;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        subdomainRouter = new SubdomainRouter();
        window.subdomainRouter = subdomainRouter;
        
        // Add navigation if not on main domain
        if (subdomainRouter.currentSubdomain) {
            const nav = subdomainRouter.generateNavigation();
            document.body.insertBefore(nav, document.body.firstChild);
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SubdomainRouter;
}