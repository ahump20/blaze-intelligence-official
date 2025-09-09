#!/usr/bin/env node

/**
 * Blaze Intelligence Comprehensive Stress Test Suite
 * Tests all systems, endpoints, and functionality
 */

const https = require('https');
const http = require('http');
const { performance } = require('perf_hooks');

const BASE_URL = 'https://blaze-intelligence-lsl.pages.dev';
const PAGES = [
    '/',
    '/demo.html',
    '/contact.html',
    '/savings-calculator.html',
    '/api-docs.html',
    '/blog-cardinals-analytics-2025.html',
    '/blog-titans-analytics-2025.html',
    '/blog-longhorns-recruiting-2025.html',
    '/titans-analytics.html',
    '/mlb-intelligence-showcase.html',
    '/performance-demo.html',
    '/dashboard.html',
    '/reporting-dashboard.html',
    '/sources-methods.html',
    '/sitemap.xml',
    '/robots.txt',
    '/performance-budget.json'
];

const API_ENDPOINTS = [
    '/api/health',
    '/api/status',
    '/api/metrics',
    '/api/uptime'
];

const STATIC_RESOURCES = [
    '/js/analytics-config.js',
    '/js/ab-testing.js',
    '/js/sentry-config.js',
    '/js/enhanced-charts.js',
    '/js/blaze-three-visuals.js'
];

// Performance thresholds (ms)
const THRESHOLDS = {
    page_load: 3000,
    api_response: 500,
    static_resource: 1000,
    ttfb: 600
};

// Test results storage
const results = {
    pages: {},
    apis: {},
    resources: {},
    errors: [],
    performance: {
        min: Infinity,
        max: 0,
        avg: 0,
        total: 0,
        count: 0
    }
};

// Color codes for terminal output
const colors = {
    reset: '\x1b[0m',
    bright: '\x1b[1m',
    red: '\x1b[31m',
    green: '\x1b[32m',
    yellow: '\x1b[33m',
    blue: '\x1b[34m',
    cyan: '\x1b[36m'
};

// Helper function to make HTTP requests
function makeRequest(url) {
    return new Promise((resolve, reject) => {
        const startTime = performance.now();
        
        https.get(url, (res) => {
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const endTime = performance.now();
                const duration = Math.round(endTime - startTime);
                
                resolve({
                    url: url,
                    status: res.statusCode,
                    duration: duration,
                    size: data.length,
                    headers: res.headers
                });
            });
        }).on('error', (err) => {
            reject({
                url: url,
                error: err.message
            });
        });
    });
}

// Test page loading
async function testPages() {
    console.log(`\n${colors.cyan}Testing Pages...${colors.reset}`);
    
    for (const page of PAGES) {
        try {
            const result = await makeRequest(BASE_URL + page);
            const status = result.status === 200 ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
            const timeColor = result.duration > THRESHOLDS.page_load ? colors.red : colors.green;
            
            console.log(`${status} ${page.padEnd(40)} ${timeColor}${result.duration}ms${colors.reset} (${(result.size/1024).toFixed(1)}KB)`);
            
            results.pages[page] = result;
            updatePerformanceStats(result.duration);
            
            // Check for specific issues
            if (result.status !== 200) {
                results.errors.push(`Page ${page} returned status ${result.status}`);
            }
            if (result.duration > THRESHOLDS.page_load) {
                results.errors.push(`Page ${page} exceeded load time threshold (${result.duration}ms > ${THRESHOLDS.page_load}ms)`);
            }
            
        } catch (error) {
            console.log(`${colors.red}✗ ${page.padEnd(40)} ERROR: ${error.error}${colors.reset}`);
            results.errors.push(`Page ${page} failed: ${error.error}`);
        }
        
        // Small delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Test API endpoints
async function testAPIs() {
    console.log(`\n${colors.cyan}Testing API Endpoints...${colors.reset}`);
    
    for (const endpoint of API_ENDPOINTS) {
        try {
            const result = await makeRequest(BASE_URL + endpoint);
            const status = result.status === 200 ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
            const timeColor = result.duration > THRESHOLDS.api_response ? colors.red : colors.green;
            
            console.log(`${status} ${endpoint.padEnd(40)} ${timeColor}${result.duration}ms${colors.reset}`);
            
            results.apis[endpoint] = result;
            
            if (result.duration > THRESHOLDS.api_response) {
                results.errors.push(`API ${endpoint} exceeded response time threshold`);
            }
            
        } catch (error) {
            console.log(`${colors.red}✗ ${endpoint.padEnd(40)} ERROR: ${error.error}${colors.reset}`);
            results.errors.push(`API ${endpoint} failed: ${error.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Test static resources
async function testStaticResources() {
    console.log(`\n${colors.cyan}Testing Static Resources...${colors.reset}`);
    
    for (const resource of STATIC_RESOURCES) {
        try {
            const result = await makeRequest(BASE_URL + resource);
            const status = result.status === 200 ? `${colors.green}✓${colors.reset}` : `${colors.red}✗${colors.reset}`;
            const timeColor = result.duration > THRESHOLDS.static_resource ? colors.red : colors.green;
            
            console.log(`${status} ${resource.padEnd(40)} ${timeColor}${result.duration}ms${colors.reset} (${(result.size/1024).toFixed(1)}KB)`);
            
            results.resources[resource] = result;
            
        } catch (error) {
            console.log(`${colors.red}✗ ${resource.padEnd(40)} ERROR: ${error.error}${colors.reset}`);
            results.errors.push(`Resource ${resource} failed: ${error.error}`);
        }
        
        await new Promise(resolve => setTimeout(resolve, 100));
    }
}

// Load test (concurrent requests)
async function loadTest() {
    console.log(`\n${colors.cyan}Running Load Test (10 concurrent requests)...${colors.reset}`);
    
    const promises = [];
    const testUrl = BASE_URL + '/';
    
    for (let i = 0; i < 10; i++) {
        promises.push(makeRequest(testUrl));
    }
    
    try {
        const startTime = performance.now();
        const results = await Promise.all(promises);
        const endTime = performance.now();
        const totalTime = Math.round(endTime - startTime);
        
        const avgResponseTime = Math.round(results.reduce((sum, r) => sum + r.duration, 0) / results.length);
        
        console.log(`${colors.green}✓${colors.reset} Completed 10 concurrent requests in ${totalTime}ms`);
        console.log(`  Average response time: ${avgResponseTime}ms`);
        console.log(`  Min: ${Math.min(...results.map(r => r.duration))}ms`);
        console.log(`  Max: ${Math.max(...results.map(r => r.duration))}ms`);
        
    } catch (error) {
        console.log(`${colors.red}✗ Load test failed: ${error}${colors.reset}`);
        results.errors.push(`Load test failed: ${error}`);
    }
}

// Test A/B testing functionality
async function testABTesting() {
    console.log(`\n${colors.cyan}Testing A/B Testing Variations...${colors.reset}`);
    
    // Make multiple requests to check for cookie handling
    const testResults = [];
    
    for (let i = 0; i < 3; i++) {
        try {
            const result = await makeRequest(BASE_URL + '/demo.html');
            testResults.push(result);
            console.log(`${colors.green}✓${colors.reset} A/B test request ${i+1} completed (${result.duration}ms)`);
        } catch (error) {
            console.log(`${colors.red}✗ A/B test request ${i+1} failed${colors.reset}`);
        }
    }
    
    // Check if cookies are being set
    const hasCookies = testResults.some(r => r.headers['set-cookie']);
    if (hasCookies) {
        console.log(`${colors.green}✓${colors.reset} A/B testing cookies detected`);
    } else {
        console.log(`${colors.yellow}⚠${colors.reset} No A/B testing cookies detected (may be client-side only)`);
    }
}

// Test form submissions (mock)
async function testFormSubmission() {
    console.log(`\n${colors.cyan}Testing Form Submission Endpoints...${colors.reset}`);
    
    // Note: This is a mock test since we can't actually submit forms without proper credentials
    const formEndpoints = [
        '/api/contact',
        '/api/email/subscribe',
        '/api/lead'
    ];
    
    for (const endpoint of formEndpoints) {
        try {
            const result = await makeRequest(BASE_URL + endpoint);
            // We expect these to fail without POST data, but we're checking if they exist
            if (result.status === 404) {
                console.log(`${colors.yellow}⚠${colors.reset} ${endpoint.padEnd(40)} Not configured yet`);
            } else if (result.status === 405) {
                console.log(`${colors.green}✓${colors.reset} ${endpoint.padEnd(40)} Endpoint exists (requires POST)`);
            } else {
                console.log(`${colors.blue}ℹ${colors.reset} ${endpoint.padEnd(40)} Status: ${result.status}`);
            }
        } catch (error) {
            console.log(`${colors.yellow}⚠${colors.reset} ${endpoint.padEnd(40)} Not accessible`);
        }
    }
}

// Update performance statistics
function updatePerformanceStats(duration) {
    results.performance.total += duration;
    results.performance.count++;
    results.performance.avg = Math.round(results.performance.total / results.performance.count);
    results.performance.min = Math.min(results.performance.min, duration);
    results.performance.max = Math.max(results.performance.max, duration);
}

// Generate summary report
function generateReport() {
    console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}         BLAZE INTELLIGENCE STRESS TEST REPORT         ${colors.reset}`);
    console.log(`${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);
    
    // Overall statistics
    console.log(`${colors.bright}Overall Performance:${colors.reset}`);
    console.log(`  Pages tested: ${PAGES.length}`);
    console.log(`  APIs tested: ${API_ENDPOINTS.length}`);
    console.log(`  Resources tested: ${STATIC_RESOURCES.length}`);
    console.log(`  Total requests: ${results.performance.count}`);
    console.log(`  Average response time: ${results.performance.avg}ms`);
    console.log(`  Min response time: ${results.performance.min}ms`);
    console.log(`  Max response time: ${results.performance.max}ms`);
    
    // Success rate
    const totalTests = PAGES.length + API_ENDPOINTS.length + STATIC_RESOURCES.length;
    const successfulTests = totalTests - results.errors.length;
    const successRate = ((successfulTests / totalTests) * 100).toFixed(1);
    
    console.log(`\n${colors.bright}Success Rate:${colors.reset}`);
    const rateColor = successRate >= 95 ? colors.green : successRate >= 80 ? colors.yellow : colors.red;
    console.log(`  ${rateColor}${successRate}%${colors.reset} (${successfulTests}/${totalTests} tests passed)`);
    
    // Errors
    if (results.errors.length > 0) {
        console.log(`\n${colors.bright}${colors.red}Errors Found (${results.errors.length}):${colors.reset}`);
        results.errors.forEach((error, i) => {
            console.log(`  ${i+1}. ${error}`);
        });
    } else {
        console.log(`\n${colors.bright}${colors.green}No Errors Found!${colors.reset}`);
    }
    
    // Performance issues
    const slowPages = Object.entries(results.pages).filter(([_, data]) => data.duration > THRESHOLDS.page_load);
    if (slowPages.length > 0) {
        console.log(`\n${colors.bright}${colors.yellow}Slow Pages (>${THRESHOLDS.page_load}ms):${colors.reset}`);
        slowPages.forEach(([page, data]) => {
            console.log(`  ${page}: ${data.duration}ms`);
        });
    }
    
    // Recommendations
    console.log(`\n${colors.bright}Recommendations:${colors.reset}`);
    if (results.performance.avg > 1000) {
        console.log(`  ${colors.yellow}•${colors.reset} Consider implementing caching to improve average response time`);
    }
    if (slowPages.length > 0) {
        console.log(`  ${colors.yellow}•${colors.reset} Optimize slow-loading pages with lazy loading and code splitting`);
    }
    if (results.errors.length > 0) {
        console.log(`  ${colors.red}•${colors.reset} Fix errors before deploying to production`);
    }
    if (successRate === '100.0') {
        console.log(`  ${colors.green}•${colors.reset} All systems operational - ready for production!`);
    }
    
    console.log(`\n${colors.bright}${colors.cyan}═══════════════════════════════════════════════════════${colors.reset}\n`);
}

// Main execution
async function runStressTest() {
    console.log(`${colors.bright}${colors.cyan}Starting Blaze Intelligence Comprehensive Stress Test${colors.reset}`);
    console.log(`Target: ${BASE_URL}`);
    console.log(`Time: ${new Date().toISOString()}\n`);
    
    try {
        await testPages();
        await testAPIs();
        await testStaticResources();
        await loadTest();
        await testABTesting();
        await testFormSubmission();
        
        generateReport();
        
        // Exit with appropriate code
        process.exit(results.errors.length > 0 ? 1 : 0);
        
    } catch (error) {
        console.error(`${colors.red}Fatal error during stress test: ${error}${colors.reset}`);
        process.exit(1);
    }
}

// Run the stress test
runStressTest();