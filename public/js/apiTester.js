// API Testing Suite for Blaze Intelligence
class APITester {
    constructor() {
        this.tests = [];
        this.results = {};
        this.testCategories = {
            'Data Sources': [
                { name: 'MLB Stats API', endpoint: '/api/mlb/teams', expected: 'teams' },
                { name: 'ESPN API', endpoint: '/proxy/nfl/scores', expected: 'events' },
                { name: 'SportsRadar API', endpoint: '/api/sportsradar/mlb/teams', expected: 'leagues' },
                { name: 'Live Scoreboard API', endpoint: '/api/live-sports/all', expected: 'sports' }
            ],
            'AI Services': [
                { name: 'OpenAI Health', endpoint: '/api/ai/openai/health', expected: 'status' },
                { name: 'Anthropic Health', endpoint: '/api/ai/anthropic/health', expected: 'status' },
                { name: 'Gemini Health', endpoint: '/api/ai/gemini/health', expected: 'status' }
            ],
            'Infrastructure': [
                { name: 'Cloudflare Gateway', endpoint: '/api/gateway/health', expected: 'status' },
                { name: 'API Status', endpoint: '/api/status', expected: 'apis' }
            ],
            'Frontend Components': [
                { name: 'Sports Data Hub', test: () => !!window.sportsDataHub },
                { name: 'Team Intelligence Cards', test: () => !!document.querySelector('.team-card') },
                { name: 'Live Scoreboard', test: () => !!document.querySelector('.live-scoreboard') },
                { name: 'API Configuration', test: () => !!window.championshipDashboard }
            ],
            'Data Retrieval': [
                { name: 'MLB Teams', test: () => this.testDataFunction('sportsDataHub', 'getMLBTeams') },
                { name: 'NFL Teams', test: () => this.testDataFunction('sportsDataHub', 'getNFLTeams') },
                { name: 'NCAA Teams', test: () => this.testDataFunction('sportsDataHub', 'getNCAATeams') }
            ],
            'Performance': [
                { name: 'Response time', test: () => this.testResponseTime() }
            ]
        };
        this.init();
    }

    init() {
        console.log('🚀 Test suite initialized. Click "Run All Tests" to begin.');
        this.logWithTimestamp('✅ Test suite loaded and ready');
        this.logWithTimestamp(`📋 ${this.getTotalTestCount()} tests available across ${Object.keys(this.testCategories).length} categories`);
    }

    getTotalTestCount() {
        return Object.values(this.testCategories).reduce((total, tests) => total + tests.length, 0);
    }

    async runAllTests() {
        this.logWithTimestamp('🚀 Starting comprehensive test suite...');
        this.results = {};

        for (const [category, tests] of Object.entries(this.testCategories)) {
            for (const test of tests) {
                await this.runSingleTest(category, test);
                // Small delay to avoid overwhelming the server
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }

        this.displaySummary();
    }

    async runSingleTest(category, test) {
        try {
            if (test.endpoint) {
                await this.testEndpoint(test.name, test.endpoint, test.expected);
            } else if (test.test) {
                await this.testFunction(test.name, test.test);
            }
        } catch (error) {
            this.logResult(test.name, false, error.message);
        }
    }

    async testEndpoint(name, endpoint, expectedField) {
        try {
            this.logWithTimestamp(`Testing ${name}...`);
            const startTime = Date.now();
            
            const response = await fetch(endpoint);
            const responseTime = Date.now() - startTime;
            
            if (response.ok) {
                const data = await response.json();
                const hasExpectedField = expectedField ? !!data[expectedField] : true;
                
                if (hasExpectedField) {
                    if (expectedField === 'teams' && data.teams) {
                        this.logResult(name, true, `Retrieved ${data.teams.length} teams`);
                    } else if (expectedField === 'events' && data.events) {
                        this.logResult(name, true, `Retrieved ${data.events.length} events`);
                    } else if (expectedField === 'leagues' && data.leagues) {
                        this.logResult(name, true, `Retrieved ${data.leagues.length} leagues`);
                    } else if (expectedField === 'sports' && data.sports) {
                        this.logResult(name, true, `Retrieved sports data`);
                    } else if (expectedField === 'status' && data.status) {
                        this.logResult(name, true, `Status: ${data.status}`);
                    } else if (expectedField === 'apis' && data.apis) {
                        this.logResult(name, true, `API configurations loaded`);
                    } else {
                        this.logResult(name, true, `Connected successfully`);
                    }
                } else {
                    this.logResult(name, false, `Missing expected field: ${expectedField}`);
                }
            } else if (response.status === 503) {
                this.logResult(name, false, `No API key configured`);
            } else {
                this.logResult(name, false, `HTTP ${response.status}`);
            }
        } catch (error) {
            if (error.message.includes('fetch')) {
                this.logResult(name, false, `Not available (expected if not running locally)`);
            } else {
                this.logResult(name, false, error.message);
            }
        }
    }

    async testFunction(name, testFn) {
        try {
            const result = await testFn();
            if (result === true) {
                this.logResult(name, true, 'loaded');
            } else if (typeof result === 'object' && result.teams) {
                this.logResult(name, true, `data retrieved`);
            } else if (result) {
                this.logResult(name, true, `available`);
            } else {
                this.logResult(name, false, `not loaded`);
            }
        } catch (error) {
            this.logResult(name, false, error.message);
        }
    }

    async testDataFunction(objectName, functionName) {
        try {
            const obj = window[objectName];
            if (obj && typeof obj[functionName] === 'function') {
                const result = await obj[functionName]();
                return result && (result.teams || result.data || result);
            }
            throw new Error(`${objectName}.${functionName} is not a function`);
        } catch (error) {
            throw error;
        }
    }

    async testResponseTime() {
        const startTime = Date.now();
        try {
            await fetch('/api/status');
            const responseTime = Date.now() - startTime;
            return responseTime < 100; // Pass if under 100ms
        } catch (error) {
            return false;
        }
    }

    logResult(testName, success, details) {
        const icon = success ? '✅' : '❌';
        const message = details ? `${testName}: ${details}` : testName;
        
        if (!this.results[testName]) {
            this.results[testName] = { success, details, timestamp: new Date() };
        }
        
        this.logWithTimestamp(`${icon} ${message}`);
    }

    logWithTimestamp(message) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`[${timestamp}] ${message}`);
    }

    displaySummary() {
        const totalTests = Object.keys(this.results).length;
        const passedTests = Object.values(this.results).filter(r => r.success).length;
        const failedTests = totalTests - passedTests;
        
        this.logWithTimestamp('📊 Test Suite Summary:');
        this.logWithTimestamp(`✅ Passed: ${passedTests}`);
        this.logWithTimestamp(`❌ Failed: ${failedTests}`);
        this.logWithTimestamp(`📈 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
        
        if (failedTests > 0) {
            this.logWithTimestamp('🔧 Failed Tests:');
            Object.entries(this.results).forEach(([name, result]) => {
                if (!result.success) {
                    this.logWithTimestamp(`  • ${name}: ${result.details}`);
                }
            });
        }
    }

    // Quick test specific APIs
    async testSportsRadar() {
        await this.testEndpoint('SportsRadar MLB', '/api/sportsradar/mlb/teams', 'leagues');
        await this.testEndpoint('SportsRadar NFL', '/api/sportsradar/nfl/teams', 'leagues');
        await this.testEndpoint('SportsRadar NCAA', '/api/sportsradar/ncaafb/teams', 'conferences');
    }

    async testAIServices() {
        await this.testEndpoint('OpenAI', '/api/ai/openai/health', 'status');
        await this.testEndpoint('Anthropic', '/api/ai/anthropic/health', 'status');
        await this.testEndpoint('Gemini', '/api/ai/gemini/health', 'status');
    }

    async testDataHub() {
        await this.testFunction('Sports Data Hub', () => !!window.sportsDataHub);
        await this.testFunction('MLB Data', () => this.testDataFunction('sportsDataHub', 'getMLBTeams'));
        await this.testFunction('NFL Data', () => this.testDataFunction('sportsDataHub', 'getNFLTeams'));
        await this.testFunction('NCAA Data', () => this.testDataFunction('sportsDataHub', 'getNCAATeams'));
    }
}

// Initialize tester when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.apiTester = new APITester();
    
    // Auto-run tests if requested
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('autotest') === 'true') {
        setTimeout(() => {
            window.apiTester.runAllTests();
        }, 2000);
    }
});