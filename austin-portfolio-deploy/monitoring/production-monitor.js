#!/usr/bin/env node

/**
 * Blaze Intelligence Production Monitor
 * Real-time monitoring of all platform systems
 */

const https = require('https');
const fs = require('fs').promises;
const path = require('path');

// Configuration
const CONFIG = {
  mainDomain: 'https://blaze-intelligence.pages.dev',
  deployments: {
    platform: 'https://9fb73261.blaze-intelligence.pages.dev',
    os: 'https://a4dc795e.blaze-intelligence.pages.dev',
    lsl: 'https://blaze-intelligence-lsl.pages.dev'
  },
  criticalPages: [
    '/',
    '/platform.html',
    '/sites.html',
    '/dashboard.html',
    '/demo.html',
    '/roi-calculator.html',
    '/contact.html',
    '/blog.html'
  ],
  dataEndpoints: [
    '/data/blaze-metrics.json',
    '/data/dashboard-config.json',
    '/assets/tokens.css'
  ],
  checkInterval: 60000, // 1 minute
  alertThreshold: {
    responseTime: 1000, // ms
    errorRate: 0.05, // 5%
    uptime: 0.999 // 99.9%
  }
};

// Metrics storage
const metrics = {
  checks: 0,
  errors: 0,
  totalResponseTime: 0,
  pageStatus: {},
  lastCheck: null,
  alerts: []
};

/**
 * Check URL status and response time
 */
async function checkUrl(url) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      const responseTime = Date.now() - startTime;
      
      resolve({
        url,
        status: res.statusCode,
        responseTime,
        success: res.statusCode >= 200 && res.statusCode < 400,
        timestamp: new Date().toISOString()
      });
    }).on('error', (err) => {
      resolve({
        url,
        status: 0,
        responseTime: 0,
        success: false,
        error: err.message,
        timestamp: new Date().toISOString()
      });
    });
  });
}

/**
 * Check all critical pages
 */
async function checkAllPages() {
  console.log('\n🔍 Checking critical pages...');
  const results = [];
  
  // Check main domain pages
  for (const page of CONFIG.criticalPages) {
    const url = CONFIG.mainDomain + page;
    const result = await checkUrl(url);
    results.push(result);
    
    // Update metrics
    metrics.checks++;
    metrics.totalResponseTime += result.responseTime;
    if (!result.success) metrics.errors++;
    
    // Log result
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${page.padEnd(25)} - Status: ${result.status} | Time: ${result.responseTime}ms`);
    
    // Check for alerts
    if (result.responseTime > CONFIG.alertThreshold.responseTime) {
      const alert = `⚠️ SLOW RESPONSE: ${page} took ${result.responseTime}ms`;
      console.log(alert);
      metrics.alerts.push(alert);
    }
  }
  
  // Check data endpoints
  console.log('\n📊 Checking data endpoints...');
  for (const endpoint of CONFIG.dataEndpoints) {
    const url = CONFIG.mainDomain + endpoint;
    const result = await checkUrl(url);
    results.push(result);
    
    const icon = result.success ? '✅' : '❌';
    console.log(`${icon} ${endpoint.padEnd(35)} - Status: ${result.status}`);
  }
  
  return results;
}

/**
 * Calculate and display metrics
 */
function displayMetrics() {
  const avgResponseTime = Math.round(metrics.totalResponseTime / metrics.checks);
  const errorRate = (metrics.errors / metrics.checks * 100).toFixed(2);
  const uptime = ((1 - metrics.errors / metrics.checks) * 100).toFixed(2);
  
  console.log('\n📈 Performance Metrics:');
  console.log('━'.repeat(50));
  console.log(`  Total Checks: ${metrics.checks}`);
  console.log(`  Avg Response Time: ${avgResponseTime}ms`);
  console.log(`  Error Rate: ${errorRate}%`);
  console.log(`  Uptime: ${uptime}%`);
  console.log(`  Alerts: ${metrics.alerts.length}`);
  
  // Check thresholds
  if (avgResponseTime > CONFIG.alertThreshold.responseTime) {
    console.log(`\n⚠️ WARNING: Average response time (${avgResponseTime}ms) exceeds threshold (${CONFIG.alertThreshold.responseTime}ms)`);
  }
  
  if (parseFloat(errorRate) > CONFIG.alertThreshold.errorRate * 100) {
    console.log(`\n⚠️ WARNING: Error rate (${errorRate}%) exceeds threshold (${CONFIG.alertThreshold.errorRate * 100}%)`);
  }
  
  return {
    avgResponseTime,
    errorRate,
    uptime,
    totalChecks: metrics.checks,
    alerts: metrics.alerts
  };
}

/**
 * Test live data updates
 */
async function testLiveData() {
  console.log('\n🔄 Testing live data updates...');
  
  const metricsUrl = CONFIG.mainDomain + '/data/blaze-metrics.json';
  
  try {
    const response = await new Promise((resolve, reject) => {
      https.get(metricsUrl, (res) => {
        let data = '';
        res.on('data', chunk => data += chunk);
        res.on('end', () => {
          try {
            resolve(JSON.parse(data));
          } catch (e) {
            reject(e);
          }
        });
      }).on('error', reject);
    });
    
    console.log('✅ Live data accessible');
    console.log(`  • Cardinals Readiness: ${response.cardinals.readiness}%`);
    console.log(`  • Titans Performance: ${response.titans.performance}%`);
    console.log(`  • Grizzlies Grit Index: ${response.grizzlies.gritIndex}%`);
    console.log(`  • System Accuracy: ${response.systemMetrics.accuracy}%`);
    console.log(`  • Last Updated: ${response.ts}`);
    
    return response;
  } catch (error) {
    console.log('❌ Failed to fetch live data:', error.message);
    return null;
  }
}

/**
 * Check deployment redirects
 */
async function checkRedirects() {
  console.log('\n🔀 Checking redirects...');
  
  const redirects = [
    { path: '/platform', expected: CONFIG.deployments.platform },
    { path: '/os', expected: CONFIG.deployments.os }
  ];
  
  for (const redirect of redirects) {
    const url = CONFIG.mainDomain + redirect.path;
    const result = await checkUrl(url);
    
    if (result.status === 302 || result.status === 301) {
      console.log(`✅ ${redirect.path} → Redirecting (${result.status})`);
    } else {
      console.log(`❌ ${redirect.path} → Not redirecting (${result.status})`);
    }
  }
}

/**
 * Generate monitoring report
 */
async function generateReport(results) {
  const report = {
    timestamp: new Date().toISOString(),
    domain: CONFIG.mainDomain,
    metrics: displayMetrics(),
    pageResults: results,
    alerts: metrics.alerts,
    recommendations: []
  };
  
  // Add recommendations
  if (report.metrics.avgResponseTime > 500) {
    report.recommendations.push('Consider CDN optimization for static assets');
  }
  
  if (parseFloat(report.metrics.errorRate) > 1) {
    report.recommendations.push('Investigate error sources and implement fixes');
  }
  
  if (metrics.alerts.length > 5) {
    report.recommendations.push('Multiple performance issues detected - review infrastructure');
  }
  
  // Save report
  const reportPath = path.join(__dirname, `monitor-report-${Date.now()}.json`);
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2));
  console.log(`\n📄 Report saved: ${reportPath}`);
  
  return report;
}

/**
 * Main monitoring loop
 */
async function startMonitoring() {
  console.log('🚀 Blaze Intelligence Production Monitor');
  console.log('=' .repeat(50));
  console.log(`Domain: ${CONFIG.mainDomain}`);
  console.log(`Check Interval: ${CONFIG.checkInterval / 1000}s`);
  console.log(`Started: ${new Date().toISOString()}`);
  
  // Initial check
  const results = await checkAllPages();
  await testLiveData();
  await checkRedirects();
  const report = await generateReport(results);
  
  // Display summary
  console.log('\n✨ Monitoring Summary:');
  console.log('━'.repeat(50));
  
  if (parseFloat(report.metrics.uptime) >= 99.9) {
    console.log('🏆 Platform Status: EXCELLENT');
  } else if (parseFloat(report.metrics.uptime) >= 99) {
    console.log('✅ Platform Status: GOOD');
  } else {
    console.log('⚠️ Platform Status: NEEDS ATTENTION');
  }
  
  if (report.recommendations.length > 0) {
    console.log('\n💡 Recommendations:');
    report.recommendations.forEach(rec => {
      console.log(`  • ${rec}`);
    });
  }
  
  // Set up continuous monitoring
  console.log(`\n⏰ Next check in ${CONFIG.checkInterval / 1000} seconds...`);
  
  setInterval(async () => {
    console.log('\n' + '─'.repeat(50));
    console.log(`🔄 Running check #${metrics.checks + 1} at ${new Date().toLocaleTimeString()}`);
    
    const results = await checkAllPages();
    await testLiveData();
    
    // Generate report every 10 checks
    if (metrics.checks % 10 === 0) {
      await generateReport(results);
    }
  }, CONFIG.checkInterval);
}

// Error handling
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\n👋 Shutting down monitor...');
  displayMetrics();
  console.log('Monitor stopped at:', new Date().toISOString());
  process.exit(0);
});

// Start monitoring
startMonitoring().catch(console.error);