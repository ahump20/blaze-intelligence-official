/**
 * Load Testing and Performance Optimization
 * Realistic traffic simulation and performance monitoring
 */

import http from 'http';
import https from 'https';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import os from 'os';
import { performance } from 'perf_hooks';

class LoadTester {
  constructor(logger = null) {
    this.logger = logger;
    this.baseUrl = `http://localhost:${process.env.PORT || 5000}`;
    this.results = [];
    this.isRunning = false;
    this.workers = [];
    
    // Test scenarios that mirror real user behavior
    this.scenarios = {
      // Basic website visitor flow
      visitor: [
        { path: '/', weight: 30 },
        { path: '/live-demo', weight: 20 },
        { path: '/pricing', weight: 15 },
        { path: '/methods', weight: 10 },
        { path: '/manifesto', weight: 5 }
      ],
      
      // API consumer testing critical endpoints
      api: [
        { path: '/api/mlb/cardinals/summary', weight: 25 },
        { path: '/healthz', weight: 20 },
        { path: '/api/monitoring/health', weight: 15 },
        { path: '/api/cache/stats', weight: 10 },
        { path: '/metrics', weight: 10 }
      ],
      
      // Heavy dashboard user
      dashboard: [
        { path: '/live-demo', weight: 40 },
        { path: '/api/sports/mlb/teams', weight: 20 },
        { path: '/api/sports/mlb/players', weight: 15 },
        { path: '/api/sports/mlb/standings', weight: 15 },
        { path: '/api/sports/live', weight: 10 }
      ]
    };
  }

  /**
   * Run comprehensive load test
   */
  async runLoadTest(options = {}) {
    const config = {
      duration: 60, // seconds
      concurrency: 10, // concurrent users
      scenario: 'mixed', // visitor, api, dashboard, mixed
      rampUpTime: 10, // seconds to reach full concurrency
      ...options
    };

    console.log(`🚀 Starting load test: ${config.concurrency} users for ${config.duration}s`);
    
    if (this.logger) {
      this.logger.logPerformance('load_test_started', 1, config);
    }

    this.isRunning = true;
    this.results = [];
    
    try {
      // Create worker pool for parallel requests
      const numWorkers = Math.min(config.concurrency, os.cpus().length);
      const usersPerWorker = Math.ceil(config.concurrency / numWorkers);
      
      const workerPromises = [];
      
      for (let i = 0; i < numWorkers; i++) {
        const workerConfig = {
          ...config,
          concurrency: Math.min(usersPerWorker, config.concurrency - (i * usersPerWorker)),
          baseUrl: this.baseUrl,
          scenarios: this.scenarios,
          workerId: i
        };
        
        const workerPromise = this.createWorker(workerConfig);
        workerPromises.push(workerPromise);
      }
      
      // Wait for all workers to complete
      const workerResults = await Promise.all(workerPromises);
      
      // Aggregate results
      this.aggregateResults(workerResults);
      
      // Generate performance report
      const report = this.generateReport(config);
      
      console.log('✅ Load test completed');
      console.log(this.formatReport(report));
      
      if (this.logger) {
        this.logger.logPerformance('load_test_completed', 1, { report });
      }
      
      return report;
      
    } catch (error) {
      console.error('❌ Load test failed:', error);
      if (this.logger) {
        this.logger.logError(error, { component: 'load-test' });
      }
      throw error;
    } finally {
      this.isRunning = false;
    }
  }

  /**
   * Create worker thread for parallel load testing
   */
  async createWorker(config) {
    return new Promise((resolve, reject) => {
      const worker = new Worker(__filename, { workerData: config });
      
      worker.on('message', (result) => {
        resolve(result);
      });
      
      worker.on('error', reject);
      
      worker.on('exit', (code) => {
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  /**
   * Aggregate results from all workers
   */
  aggregateResults(workerResults) {
    this.results = [];
    
    for (const workerResult of workerResults) {
      this.results.push(...workerResult.results);
    }
  }

  /**
   * Generate performance report
   */
  generateReport(config) {
    if (this.results.length === 0) {
      return { error: 'No results to analyze' };
    }

    // Calculate response time statistics
    const responseTimes = this.results.map(r => r.responseTime);
    const sortedTimes = responseTimes.sort((a, b) => a - b);
    
    const totalRequests = this.results.length;
    const successfulRequests = this.results.filter(r => r.statusCode >= 200 && r.statusCode < 400).length;
    const errorRequests = totalRequests - successfulRequests;
    
    const report = {
      config,
      summary: {
        totalRequests,
        successfulRequests,
        errorRequests,
        successRate: ((successfulRequests / totalRequests) * 100).toFixed(2) + '%',
        errorRate: ((errorRequests / totalRequests) * 100).toFixed(2) + '%',
        duration: config.duration,
        requestsPerSecond: (totalRequests / config.duration).toFixed(2)
      },
      responseTime: {
        min: Math.min(...responseTimes),
        max: Math.max(...responseTimes),
        mean: (responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length).toFixed(2),
        median: sortedTimes[Math.floor(sortedTimes.length / 2)].toFixed(2),
        p95: sortedTimes[Math.floor(sortedTimes.length * 0.95)].toFixed(2),
        p99: sortedTimes[Math.floor(sortedTimes.length * 0.99)].toFixed(2)
      },
      errors: this.analyzeErrors(),
      slowestEndpoints: this.findSlowestEndpoints(),
      recommendations: this.generateRecommendations()
    };

    return report;
  }

  /**
   * Analyze error patterns
   */
  analyzeErrors() {
    const errors = this.results.filter(r => r.statusCode >= 400);
    const errorGroups = {};
    
    errors.forEach(error => {
      const key = `${error.statusCode}_${error.path}`;
      if (!errorGroups[key]) {
        errorGroups[key] = { count: 0, statusCode: error.statusCode, path: error.path };
      }
      errorGroups[key].count++;
    });
    
    return Object.values(errorGroups).sort((a, b) => b.count - a.count);
  }

  /**
   * Find slowest endpoints
   */
  findSlowestEndpoints() {
    const endpointTimes = {};
    
    this.results.forEach(result => {
      if (!endpointTimes[result.path]) {
        endpointTimes[result.path] = [];
      }
      endpointTimes[result.path].push(result.responseTime);
    });
    
    const endpointStats = Object.entries(endpointTimes).map(([path, times]) => {
      const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
      return {
        path,
        avgResponseTime: avgTime.toFixed(2),
        requestCount: times.length,
        maxTime: Math.max(...times)
      };
    });
    
    return endpointStats.sort((a, b) => b.avgResponseTime - a.avgResponseTime).slice(0, 10);
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations() {
    const recommendations = [];
    const responseTimes = this.results.map(r => r.responseTime);
    const avgResponseTime = responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length;
    const errorRate = this.results.filter(r => r.statusCode >= 400).length / this.results.length;

    if (avgResponseTime > 1000) {
      recommendations.push({
        priority: 'high',
        category: 'performance',
        issue: 'High average response time',
        suggestion: 'Enable Redis caching, optimize database queries, consider CDN for static assets'
      });
    }

    if (errorRate > 0.05) { // >5% error rate
      recommendations.push({
        priority: 'critical',
        category: 'reliability',
        issue: 'High error rate',
        suggestion: 'Investigate error patterns, add better error handling, increase server capacity'
      });
    }

    const slowEndpoints = this.findSlowestEndpoints();
    if (slowEndpoints[0] && slowEndpoints[0].avgResponseTime > 2000) {
      recommendations.push({
        priority: 'medium',
        category: 'optimization',
        issue: `Slow endpoint: ${slowEndpoints[0].path}`,
        suggestion: 'Add caching, optimize data processing, consider endpoint-specific improvements'
      });
    }

    return recommendations;
  }

  /**
   * Format report for console output
   */
  formatReport(report) {
    return `
📊 LOAD TEST RESULTS
${'='.repeat(50)}
📈 Summary:
   Total Requests: ${report.summary.totalRequests}
   Success Rate: ${report.summary.successRate}
   Requests/sec: ${report.summary.requestsPerSecond}
   
⏱️  Response Times (ms):
   Average: ${report.responseTime.mean}ms
   Median: ${report.responseTime.median}ms
   95th percentile: ${report.responseTime.p95}ms
   99th percentile: ${report.responseTime.p99}ms
   
🐌 Slowest Endpoints:
${report.slowestEndpoints.slice(0, 3).map(ep => 
  `   ${ep.path}: ${ep.avgResponseTime}ms (${ep.requestCount} requests)`
).join('\n')}

${report.errors.length > 0 ? `❌ Top Errors:
${report.errors.slice(0, 3).map(err => 
  `   ${err.statusCode} on ${err.path}: ${err.count} occurrences`
).join('\n')}` : '✅ No errors detected'}

${report.recommendations.length > 0 ? `💡 Recommendations:
${report.recommendations.map(rec => 
  `   [${rec.priority.toUpperCase()}] ${rec.issue}
     → ${rec.suggestion}`
).join('\n\n')}` : '✅ Performance looks good!'}
`;
  }

  /**
   * Run quick performance benchmark
   */
  async quickBenchmark() {
    console.log('🏃‍♂️ Running quick performance benchmark...');
    
    const results = await this.runLoadTest({
      duration: 30,
      concurrency: 5,
      scenario: 'visitor'
    });
    
    return results;
  }

  /**
   * Run stress test to find breaking point
   */
  async stressTest() {
    console.log('💪 Running stress test...');
    
    const concurrencyLevels = [1, 5, 10, 20, 50];
    const stressResults = [];
    
    for (const concurrency of concurrencyLevels) {
      console.log(`Testing with ${concurrency} concurrent users...`);
      
      try {
        const result = await this.runLoadTest({
          duration: 20,
          concurrency,
          scenario: 'mixed'
        });
        
        stressResults.push({
          concurrency,
          ...result.summary,
          avgResponseTime: result.responseTime.mean
        });
        
        // Stop if error rate gets too high
        if (parseFloat(result.summary.errorRate) > 10) {
          console.log('⚠️  High error rate detected, stopping stress test');
          break;
        }
        
      } catch (error) {
        console.error(`Failed at ${concurrency} concurrent users:`, error.message);
        break;
      }
    }
    
    return stressResults;
  }

  /**
   * Get current system performance baseline
   */
  async getPerformanceBaseline() {
    const endpoints = [
      '/',
      '/api/mlb/cardinals/summary',
      '/healthz',
      '/api/monitoring/health'
    ];
    
    const baseline = {};
    
    for (const endpoint of endpoints) {
      const times = [];
      
      // Make 10 requests to each endpoint
      for (let i = 0; i < 10; i++) {
        try {
          const start = performance.now();
          await this.makeRequest(endpoint);
          const responseTime = performance.now() - start;
          times.push(responseTime);
        } catch (error) {
          // Skip failed requests
        }
      }
      
      if (times.length > 0) {
        baseline[endpoint] = {
          avg: (times.reduce((a, b) => a + b, 0) / times.length).toFixed(2),
          min: Math.min(...times).toFixed(2),
          max: Math.max(...times).toFixed(2)
        };
      }
    }
    
    return baseline;
  }

  /**
   * Make HTTP request
   */
  async makeRequest(path, method = 'GET') {
    return new Promise((resolve, reject) => {
      const url = new URL(path, this.baseUrl);
      const options = {
        method,
        timeout: 10000
      };
      
      const request = http.request(url, options, (response) => {
        let data = '';
        
        response.on('data', chunk => {
          data += chunk;
        });
        
        response.on('end', () => {
          resolve({
            statusCode: response.statusCode,
            headers: response.headers,
            data
          });
        });
      });
      
      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
      
      request.end();
    });
  }
}

// Worker thread implementation for parallel load testing
if (!isMainThread) {
  const config = workerData;
  
  async function runWorker() {
    const results = [];
    const startTime = Date.now();
    const endTime = startTime + (config.duration * 1000);
    
    // Select scenario
    const scenario = config.scenario === 'mixed' 
      ? Object.values(config.scenarios).flat()
      : config.scenarios[config.scenario] || config.scenarios.visitor;
    
    // Ramp up gradually
    const rampUpDelay = (config.rampUpTime * 1000) / config.concurrency;
    
    // Create concurrent user sessions
    const userPromises = [];
    
    for (let userId = 0; userId < config.concurrency; userId++) {
      const userPromise = new Promise(async (resolve) => {
        // Stagger user start times for realistic ramp-up
        await new Promise(r => setTimeout(r, userId * rampUpDelay));
        
        const userResults = [];
        
        while (Date.now() < endTime) {
          // Select random endpoint based on weights
          const totalWeight = scenario.reduce((sum, item) => sum + item.weight, 0);
          const random = Math.random() * totalWeight;
          let currentWeight = 0;
          let selectedPath = scenario[0].path;
          
          for (const item of scenario) {
            currentWeight += item.weight;
            if (random <= currentWeight) {
              selectedPath = item.path;
              break;
            }
          }
          
          // Make request
          try {
            const start = performance.now();
            const response = await makeRequestInWorker(config.baseUrl + selectedPath);
            const responseTime = performance.now() - start;
            
            userResults.push({
              path: selectedPath,
              statusCode: response.statusCode,
              responseTime,
              timestamp: Date.now(),
              userId,
              workerId: config.workerId
            });
            
          } catch (error) {
            userResults.push({
              path: selectedPath,
              statusCode: 0,
              responseTime: 0,
              timestamp: Date.now(),
              userId,
              workerId: config.workerId,
              error: error.message
            });
          }
          
          // Random delay between requests (0.5-2 seconds)
          const delay = 500 + Math.random() * 1500;
          await new Promise(r => setTimeout(r, delay));
        }
        
        resolve(userResults);
      });
      
      userPromises.push(userPromise);
    }
    
    // Wait for all users to complete
    const userResults = await Promise.all(userPromises);
    
    // Flatten results
    for (const userResult of userResults) {
      results.push(...userResult);
    }
    
    parentPort.postMessage({ results, workerId: config.workerId });
  }
  
  async function makeRequestInWorker(url) {
    return new Promise((resolve, reject) => {
      const request = http.get(url, { timeout: 10000 }, (response) => {
        // Consume response data to free up memory
        response.on('data', () => {});
        response.on('end', () => {
          resolve({ statusCode: response.statusCode });
        });
      });
      
      request.on('error', reject);
      request.on('timeout', () => {
        request.destroy();
        reject(new Error('Request timeout'));
      });
    });
  }
  
  runWorker().catch(error => {
    parentPort.postMessage({ error: error.message, workerId: config.workerId });
  });
}

export default LoadTester;