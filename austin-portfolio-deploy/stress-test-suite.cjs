#!/usr/bin/env node

/**
 * Blaze Intelligence - Comprehensive Stress Test Suite
 * Tests all endpoints under concurrent load with detailed performance analysis
 */

const https = require('https');
const { performance } = require('perf_hooks');

const BASE_URL = 'https://fdd9e34f.blaze-intelligence-production.pages.dev';
const CONCURRENT_USERS = 50;
const TEST_DURATION_MS = 30000; // 30 seconds
const REQUEST_INTERVAL_MS = 100; // 10 requests per second per user

const ENDPOINTS = [
  { path: '/api/health', critical: true, name: 'System Health' },
  { path: '/api/monitoring/health', critical: true, name: 'Enterprise Monitoring' },
  { path: '/api/catalog', critical: true, name: 'Data Catalog' },
  { path: '/api/search?q=cardinals', critical: false, name: 'Search Cardinals' },
  { path: '/api/teams/cardinals', critical: true, name: 'Cardinals Analytics' },
  { path: '/api/data/health', critical: true, name: 'Data Pipeline Health' },
  { path: '/api/data/versions', critical: false, name: 'Dataset Versions' },
  { path: '/api/data/datasets/cardinals', critical: true, name: 'Cardinals Dataset' },
  { path: '/api/data/datasets/grizzlies', critical: true, name: 'Grizzlies Dataset' },
  { path: '/api/data/live/cardinals-readiness', critical: true, name: 'Live Readiness' },
  { path: '/api/data/live/sports-metrics', critical: false, name: 'Live Metrics' },
  { path: '/client-demonstration-dashboard', critical: true, name: 'Client Dashboard' }
];

class StressTestSuite {
  constructor() {
    this.results = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      responseTimes: [],
      errorCodes: {},
      endpointStats: {},
      startTime: null,
      endTime: null,
      peakConcurrency: 0,
      averageResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      successRate: 0,
      requestsPerSecond: 0
    };
    
    this.activeRequests = 0;
    this.testRunning = false;
  }

  async makeRequest(endpoint) {
    const startTime = performance.now();
    this.activeRequests++;
    
    if (this.activeRequests > this.results.peakConcurrency) {
      this.results.peakConcurrency = this.activeRequests;
    }

    return new Promise((resolve) => {
      const options = {
        headers: {
          'User-Agent': 'Blaze-Intelligence-StressTest/1.0 (load testing suite)',
          'Accept': 'application/json,text/html,*/*'
        }
      };

      const req = https.get(BASE_URL + endpoint.path, options, (res) => {
        let data = '';
        
        res.on('data', (chunk) => {
          data += chunk;
        });
        
        res.on('end', () => {
          const endTime = performance.now();
          const responseTime = endTime - startTime;
          
          this.activeRequests--;
          this.results.totalRequests++;
          this.results.responseTimes.push(responseTime);
          
          if (res.statusCode >= 200 && res.statusCode < 400) {
            this.results.successfulRequests++;
          } else {
            this.results.failedRequests++;
            this.results.errorCodes[res.statusCode] = (this.results.errorCodes[res.statusCode] || 0) + 1;
          }
          
          // Track per-endpoint statistics
          if (!this.results.endpointStats[endpoint.name]) {
            this.results.endpointStats[endpoint.name] = {
              requests: 0,
              successes: 0,
              failures: 0,
              avgResponseTime: 0,
              responseTimes: []
            };
          }
          
          const stats = this.results.endpointStats[endpoint.name];
          stats.requests++;
          stats.responseTimes.push(responseTime);
          
          if (res.statusCode >= 200 && res.statusCode < 400) {
            stats.successes++;
          } else {
            stats.failures++;
          }
          
          resolve({
            endpoint: endpoint.name,
            path: endpoint.path,
            statusCode: res.statusCode,
            responseTime: responseTime,
            success: res.statusCode >= 200 && res.statusCode < 400
          });
        });
      });
      
      req.on('error', (err) => {
        const endTime = performance.now();
        const responseTime = endTime - startTime;
        
        this.activeRequests--;
        this.results.totalRequests++;
        this.results.failedRequests++;
        this.results.responseTimes.push(responseTime);
        
        resolve({
          endpoint: endpoint.name,
          path: endpoint.path,
          statusCode: 0,
          responseTime: responseTime,
          success: false,
          error: err.message
        });
      });
      
      req.setTimeout(10000, () => {
        req.destroy();
      });
    });
  }

  async simulateUser(userId) {
    console.log(`🔥 User ${userId} starting stress test...`);
    
    while (this.testRunning) {
      // Each user hits random endpoints
      const endpoint = ENDPOINTS[Math.floor(Math.random() * ENDPOINTS.length)];
      
      try {
        const result = await this.makeRequest(endpoint);
        
        if (!result.success) {
          console.log(`❌ User ${userId}: ${endpoint.name} failed (${result.statusCode})`);
        }
      } catch (error) {
        console.log(`💥 User ${userId}: Request error - ${error.message}`);
      }
      
      // Wait before next request
      await new Promise(resolve => setTimeout(resolve, REQUEST_INTERVAL_MS + Math.random() * 50));
    }
    
    console.log(`✅ User ${userId} completed stress test`);
  }

  calculateStatistics() {
    if (this.results.responseTimes.length === 0) return;
    
    // Sort response times for percentile calculations
    const sortedTimes = this.results.responseTimes.sort((a, b) => a - b);
    
    // Calculate statistics
    this.results.averageResponseTime = sortedTimes.reduce((a, b) => a + b, 0) / sortedTimes.length;
    this.results.p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)];
    this.results.p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)];
    this.results.successRate = (this.results.successfulRequests / this.results.totalRequests) * 100;
    
    const testDurationSeconds = (this.results.endTime - this.results.startTime) / 1000;
    this.results.requestsPerSecond = this.results.totalRequests / testDurationSeconds;
    
    // Calculate per-endpoint statistics
    Object.keys(this.results.endpointStats).forEach(endpoint => {
      const stats = this.results.endpointStats[endpoint];
      if (stats.responseTimes.length > 0) {
        stats.avgResponseTime = stats.responseTimes.reduce((a, b) => a + b, 0) / stats.responseTimes.length;
      }
    });
  }

  generateReport() {
    console.log('\n🏆 BLAZE INTELLIGENCE - STRESS TEST RESULTS');
    console.log('='.repeat(70));
    console.log(`Test Duration: ${((this.results.endTime - this.results.startTime) / 1000).toFixed(1)}s`);
    console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
    console.log(`Peak Concurrency: ${this.results.peakConcurrency} simultaneous requests`);
    console.log('');
    
    console.log('📊 OVERALL PERFORMANCE METRICS');
    console.log('-'.repeat(50));
    console.log(`Total Requests: ${this.results.totalRequests}`);
    console.log(`Successful Requests: ${this.results.successfulRequests}`);
    console.log(`Failed Requests: ${this.results.failedRequests}`);
    console.log(`Success Rate: ${this.results.successRate.toFixed(2)}%`);
    console.log(`Requests Per Second: ${this.results.requestsPerSecond.toFixed(1)}`);
    console.log('');
    
    console.log('⚡ RESPONSE TIME ANALYSIS');
    console.log('-'.repeat(50));
    console.log(`Average Response Time: ${this.results.averageResponseTime.toFixed(1)}ms`);
    console.log(`95th Percentile: ${this.results.p95ResponseTime.toFixed(1)}ms`);
    console.log(`99th Percentile: ${this.results.p99ResponseTime.toFixed(1)}ms`);
    console.log('');
    
    if (Object.keys(this.results.errorCodes).length > 0) {
      console.log('❌ ERROR ANALYSIS');
      console.log('-'.repeat(50));
      Object.entries(this.results.errorCodes).forEach(([code, count]) => {
        console.log(`HTTP ${code}: ${count} occurrences`);
      });
      console.log('');
    }
    
    console.log('🎯 ENDPOINT PERFORMANCE BREAKDOWN');
    console.log('-'.repeat(50));
    Object.entries(this.results.endpointStats).forEach(([endpoint, stats]) => {
      const successRate = (stats.successes / stats.requests) * 100;
      const status = successRate >= 95 ? '✅' : successRate >= 90 ? '⚠️' : '❌';
      console.log(`${status} ${endpoint}`);
      console.log(`   Requests: ${stats.requests}, Success Rate: ${successRate.toFixed(1)}%, Avg Response: ${stats.avgResponseTime.toFixed(1)}ms`);
    });
    console.log('');
    
    // Overall grade
    let grade = 'F';
    let status = '❌ FAILED';
    
    if (this.results.successRate >= 99 && this.results.averageResponseTime < 100) {
      grade = 'A+';
      status = '🏆 EXCELLENT';
    } else if (this.results.successRate >= 95 && this.results.averageResponseTime < 150) {
      grade = 'A';
      status = '✅ VERY GOOD';
    } else if (this.results.successRate >= 90 && this.results.averageResponseTime < 200) {
      grade = 'B';
      status = '⚠️ GOOD';
    } else if (this.results.successRate >= 80) {
      grade = 'C';
      status = '⚠️ ACCEPTABLE';
    }
    
    console.log('🎖️ STRESS TEST GRADE');
    console.log('-'.repeat(50));
    console.log(`Overall Grade: ${grade}`);
    console.log(`System Status: ${status}`);
    console.log('');
    
    // Recommendations
    console.log('💡 RECOMMENDATIONS');
    console.log('-'.repeat(50));
    
    if (this.results.successRate < 95) {
      console.log('• Investigate failed requests and improve error handling');
    }
    
    if (this.results.averageResponseTime > 100) {
      console.log('• Consider response time optimization');
    }
    
    if (this.results.peakConcurrency < CONCURRENT_USERS * 0.8) {
      console.log('• Review concurrency handling and connection pooling');
    }
    
    if (grade === 'A+' || grade === 'A') {
      console.log('• System performing excellently under stress');
      console.log('• Ready for enterprise production workloads');
    }
    
    console.log('');
    console.log(`📄 Test completed at: ${new Date().toISOString()}`);
    
    return {
      grade,
      successRate: this.results.successRate,
      averageResponseTime: this.results.averageResponseTime,
      requestsPerSecond: this.results.requestsPerSecond,
      peakConcurrency: this.results.peakConcurrency
    };
  }

  async runStressTest() {
    console.log('🚀 STARTING COMPREHENSIVE STRESS TEST');
    console.log('='.repeat(70));
    console.log(`Target: ${BASE_URL}`);
    console.log(`Concurrent Users: ${CONCURRENT_USERS}`);
    console.log(`Test Duration: ${TEST_DURATION_MS / 1000}s`);
    console.log(`Request Frequency: ${1000 / REQUEST_INTERVAL_MS} req/s per user`);
    console.log(`Total Expected Requests: ~${Math.floor((TEST_DURATION_MS / REQUEST_INTERVAL_MS) * CONCURRENT_USERS)}`);
    console.log('');
    
    this.testRunning = true;
    this.results.startTime = performance.now();
    
    // Start all virtual users
    const userPromises = [];
    for (let i = 1; i <= CONCURRENT_USERS; i++) {
      userPromises.push(this.simulateUser(i));
    }
    
    // Run test for specified duration
    setTimeout(() => {
      this.testRunning = false;
    }, TEST_DURATION_MS);
    
    // Wait for all users to complete
    await Promise.all(userPromises);
    
    this.results.endTime = performance.now();
    
    // Calculate final statistics and generate report
    this.calculateStatistics();
    return this.generateReport();
  }
}

// Run the stress test
async function main() {
  const stressTest = new StressTestSuite();
  
  try {
    const results = await stressTest.runStressTest();
    
    // Exit with appropriate code
    if (results.successRate >= 95 && results.averageResponseTime < 150) {
      process.exit(0); // Success
    } else {
      process.exit(1); // Failure
    }
  } catch (error) {
    console.error('💥 STRESS TEST FAILED:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = StressTestSuite;