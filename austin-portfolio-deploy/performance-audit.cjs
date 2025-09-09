#!/usr/bin/env node

/**
 * Blaze Intelligence Performance Audit
 * Checks Core Web Vitals and performance metrics
 */

const https = require('https');
const { performance } = require('perf_hooks');

const PAGES_TO_AUDIT = [
    '/',
    '/demo.html',
    '/contact.html',
    '/blog-grizzlies-analytics-2025.html',
    '/perfect-game-analytics.html',
    '/titans-analytics.html'
];

const BASE_URL = 'https://blaze-intelligence-lsl.pages.dev';

// Performance budgets (from performance-budget.json)
const BUDGETS = {
    FCP: 1800,  // First Contentful Paint
    LCP: 2500,  // Largest Contentful Paint
    TTI: 3800,  // Time to Interactive
    TBT: 200,   // Total Blocking Time
    CLS: 0.1,   // Cumulative Layout Shift
    SI: 3400    // Speed Index
};

async function measurePageLoad(url) {
    return new Promise((resolve) => {
        const startTime = performance.now();
        let firstByte = 0;
        
        https.get(url, (res) => {
            firstByte = performance.now() - startTime;
            let data = '';
            
            res.on('data', (chunk) => {
                data += chunk;
            });
            
            res.on('end', () => {
                const endTime = performance.now();
                resolve({
                    url: url,
                    ttfb: Math.round(firstByte),
                    totalTime: Math.round(endTime - startTime),
                    size: (data.length / 1024).toFixed(2),
                    status: res.statusCode
                });
            });
        }).on('error', (err) => {
            resolve({
                url: url,
                error: err.message
            });
        });
    });
}

async function runAudit() {
    console.log('🚀 Blaze Intelligence Performance Audit');
    console.log('=====================================\n');
    
    const results = [];
    
    for (const page of PAGES_TO_AUDIT) {
        const url = BASE_URL + page;
        console.log(`Auditing: ${page}`);
        
        const metrics = await measurePageLoad(url);
        results.push(metrics);
        
        // Display results
        if (metrics.error) {
            console.log(`  ❌ Error: ${metrics.error}`);
        } else {
            const ttfbStatus = metrics.ttfb < 600 ? '✅' : '⚠️';
            const sizeStatus = parseFloat(metrics.size) < 100 ? '✅' : '⚠️';
            
            console.log(`  ${ttfbStatus} TTFB: ${metrics.ttfb}ms`);
            console.log(`  ⏱️  Total: ${metrics.totalTime}ms`);
            console.log(`  ${sizeStatus} Size: ${metrics.size}KB`);
            console.log(`  📊 Status: ${metrics.status}\n`);
        }
        
        // Small delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    // Summary
    console.log('\n📊 Performance Summary');
    console.log('======================');
    
    const validResults = results.filter(r => !r.error);
    if (validResults.length > 0) {
        const avgTTFB = Math.round(validResults.reduce((sum, r) => sum + r.ttfb, 0) / validResults.length);
        const avgTotal = Math.round(validResults.reduce((sum, r) => sum + r.totalTime, 0) / validResults.length);
        const avgSize = (validResults.reduce((sum, r) => sum + parseFloat(r.size), 0) / validResults.length).toFixed(2);
        
        console.log(`Average TTFB: ${avgTTFB}ms (Budget: ${BUDGETS.FCP}ms)`);
        console.log(`Average Load Time: ${avgTotal}ms`);
        console.log(`Average Page Size: ${avgSize}KB`);
        
        // Performance score
        let score = 100;
        if (avgTTFB > 600) score -= 20;
        if (avgTotal > 3000) score -= 20;
        if (parseFloat(avgSize) > 150) score -= 10;
        
        console.log(`\nPerformance Score: ${score}/100`);
        
        if (score >= 90) {
            console.log('✅ Excellent performance!');
        } else if (score >= 70) {
            console.log('⚠️  Good performance, but room for improvement');
        } else {
            console.log('❌ Performance needs optimization');
        }
    }
    
    console.log('\n🎯 Recommendations:');
    console.log('• Enable Cloudflare caching for static assets');
    console.log('• Implement lazy loading for images');
    console.log('• Use code splitting for JavaScript bundles');
    console.log('• Optimize font loading with font-display: swap');
    console.log('• Consider using a CDN for third-party scripts');
}

// Run the audit
runAudit().catch(console.error);