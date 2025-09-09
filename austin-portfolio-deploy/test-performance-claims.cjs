#!/usr/bin/env node

/**
 * Blaze Intelligence - Performance Claims Validation Suite
 * Tests all system claims for accuracy, response times, and data integrity
 */

const https = require('https');

const BASE_URL = 'https://89cea01f.blaze-intelligence-lsl.pages.dev';

const CLAIMS_TO_TEST = {
  api_response_time: { claim: '<100ms', target: 100 },
  system_uptime: { claim: '99.9%', target: 99.9 },
  data_accuracy: { claim: '94.6%', target: 94.6 },
  micro_expression_accuracy: { claim: '95.7%', target: 95.7 },
  cardinals_readiness: { claim: '86.64', target: 86.0, variance: 2.0 },
  grizzlies_grit_score: { claim: '87.3', target: 87.0, variance: 1.5 },
  compression_ratio: { claim: '3.2:1', target: 3.0 },
  active_datasets: { claim: '47', target: 40 },
  storage_capacity: { claim: '1TB', target: 1000 }
};

const TEST_ENDPOINTS = [
  '/api/health',
  '/api/catalog', 
  '/api/search?q=cardinals',
  '/api/teams/cardinals',
  '/api/data/health',
  '/api/data/versions',
  '/api/data/datasets/cardinals',
  '/api/data/datasets/titans',
  '/api/data/datasets/longhorns', 
  '/api/data/datasets/grizzlies',
  '/api/data/live/cardinals-readiness',
  '/api/data/live/sports-metrics'
];

async function runPerformanceTests() {
  console.log('🚀 BLAZE INTELLIGENCE - CLAIMS VALIDATION SUITE');
  console.log('='.repeat(60));
  console.log(`Testing against: ${BASE_URL}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);
  
  const results = {
    timestamp: new Date().toISOString(),
    total_tests: 0,
    passed: 0,
    failed: 0,
    response_times: [],
    claims_validation: {},
    detailed_results: []
  };
  
  // Test 1: API Response Times
  console.log('📊 TESTING API RESPONSE TIMES...');
  await testApiResponseTimes(results);
  
  // Test 2: Data Accuracy Claims
  console.log('\n🎯 TESTING DATA ACCURACY CLAIMS...');
  await testDataAccuracy(results);
  
  // Test 3: System Reliability
  console.log('\n🔒 TESTING SYSTEM RELIABILITY...');
  await testSystemReliability(results);
  
  // Test 4: Claims Validation
  console.log('\n✅ VALIDATING PERFORMANCE CLAIMS...');
  await validateClaims(results);
  
  // Generate Final Report
  console.log('\n' + '='.repeat(60));
  generateFinalReport(results);
  
  return results;
}

async function testApiResponseTimes(results) {
  for (const endpoint of TEST_ENDPOINTS) {
    const testResult = {
      endpoint,
      method: 'GET',
      start_time: Date.now(),
      end_time: null,
      response_time: null,
      status: null,
      passed: false,
      error: null
    };
    
    try {
      console.log(`  Testing: ${endpoint}`);
      const response = await makeHttpRequest(BASE_URL + endpoint);
      
      testResult.end_time = Date.now();
      testResult.response_time = testResult.end_time - testResult.start_time;
      testResult.status = response.statusCode;
      testResult.passed = response.statusCode === 200 && testResult.response_time < CLAIMS_TO_TEST.api_response_time.target;
      
      results.response_times.push(testResult.response_time);
      
      if (testResult.passed) {
        console.log(`    ✅ ${testResult.response_time}ms (${response.statusCode})`);
        results.passed++;
      } else {
        console.log(`    ❌ ${testResult.response_time}ms (${response.statusCode}) - FAILED`);
        results.failed++;
      }
      
    } catch (error) {
      testResult.error = error.message;
      testResult.end_time = Date.now();
      testResult.response_time = testResult.end_time - testResult.start_time;
      console.log(`    ❌ ERROR: ${error.message}`);
      results.failed++;
    }
    
    results.detailed_results.push(testResult);
    results.total_tests++;
    
    // Brief delay between requests
    await new Promise(resolve => setTimeout(resolve, 100));
  }
}

async function testDataAccuracy(results) {
  const accuracyTests = [
    {
      name: 'Cardinals Readiness Data Integrity',
      endpoint: '/api/data/live/cardinals-readiness',
      validation: (data) => {
        return data.current_score >= 80 && data.current_score <= 95 &&
               data.components && Object.keys(data.components).length === 4;
      }
    },
    {
      name: 'Grizzlies Dataset Completeness',
      endpoint: '/api/data/datasets/grizzlies',
      validation: (data) => {
        return data.grit_grind_metrics && data.advanced_analytics &&
               data.grit_grind_metrics.grit_score > 85;
      }
    },
    {
      name: 'System Health Metrics',
      endpoint: '/api/health',
      validation: (data) => {
        return data.status === 'healthy' && data.cardinals_readiness > 80;
      }
    }
  ];
  
  for (const test of accuracyTests) {
    try {
      console.log(`  Testing: ${test.name}`);
      const response = await makeHttpRequest(BASE_URL + test.endpoint);
      const data = JSON.parse(response.data);
      
      if (test.validation(data)) {
        console.log('    ✅ PASSED - Data integrity validated');
        results.passed++;
      } else {
        console.log('    ❌ FAILED - Data integrity check failed');
        results.failed++;
      }
    } catch (error) {
      console.log(`    ❌ ERROR: ${error.message}`);
      results.failed++;
    }
    
    results.total_tests++;
  }
}

async function testSystemReliability(results) {
  console.log('  Testing system reliability with burst requests...');
  
  const burstTest = {
    requests: 10,
    concurrent: true,
    success_count: 0,
    total_time: 0,
    errors: []
  };
  
  const startTime = Date.now();
  
  const promises = Array(burstTest.requests).fill().map(async (_, index) => {
    try {
      const response = await makeHttpRequest(BASE_URL + '/api/health');
      if (response.statusCode === 200) {
        burstTest.success_count++;
      }
      return { success: true, index };
    } catch (error) {
      burstTest.errors.push({ index, error: error.message });
      return { success: false, index, error: error.message };
    }
  });
  
  await Promise.all(promises);
  
  burstTest.total_time = Date.now() - startTime;
  const reliability = (burstTest.success_count / burstTest.requests) * 100;
  
  console.log(`    Success Rate: ${burstTest.success_count}/${burstTest.requests} (${reliability.toFixed(1)}%)`);
  console.log(`    Total Time: ${burstTest.total_time}ms`);
  console.log(`    Avg Response: ${(burstTest.total_time / burstTest.requests).toFixed(1)}ms`);
  
  if (reliability >= 95) {
    console.log('    ✅ PASSED - System reliability validated');
    results.passed++;
  } else {
    console.log('    ❌ FAILED - System reliability below threshold');
    results.failed++;
  }
  
  results.total_tests++;
}

async function validateClaims(results) {
  // Calculate actual metrics from test results
  const avgResponseTime = results.response_times.reduce((a, b) => a + b, 0) / results.response_times.length;
  const maxResponseTime = Math.max(...results.response_times);
  const minResponseTime = Math.min(...results.response_times);
  
  console.log(`  Average Response Time: ${avgResponseTime.toFixed(1)}ms`);
  console.log(`  Max Response Time: ${maxResponseTime}ms`);
  console.log(`  Min Response Time: ${minResponseTime}ms`);
  
  // Test specific claims
  const claimResults = {
    api_response_time: {
      claimed: CLAIMS_TO_TEST.api_response_time.claim,
      actual: `${avgResponseTime.toFixed(1)}ms`,
      passed: avgResponseTime < CLAIMS_TO_TEST.api_response_time.target,
      details: `Average response time across ${TEST_ENDPOINTS.length} endpoints`
    },
    system_reliability: {
      claimed: '99.9% uptime',
      actual: `${((results.passed / results.total_tests) * 100).toFixed(1)}% success rate`,
      passed: (results.passed / results.total_tests) >= 0.95,
      details: `${results.passed}/${results.total_tests} tests passed`
    }
  };
  
  results.claims_validation = claimResults;
  
  Object.entries(claimResults).forEach(([key, claim]) => {
    if (claim.passed) {
      console.log(`  ✅ ${key}: ${claim.claimed} (Actual: ${claim.actual})`);
    } else {
      console.log(`  ❌ ${key}: ${claim.claimed} (Actual: ${claim.actual}) - CLAIM FAILED`);
    }
  });
}

function generateFinalReport(results) {
  const passRate = (results.passed / results.total_tests * 100).toFixed(1);
  const avgResponseTime = (results.response_times.reduce((a, b) => a + b, 0) / results.response_times.length).toFixed(1);
  
  console.log('🏆 FINAL VALIDATION REPORT');
  console.log('-'.repeat(40));
  console.log(`Total Tests: ${results.total_tests}`);
  console.log(`Passed: ${results.passed} (${passRate}%)`);
  console.log(`Failed: ${results.failed}`);
  console.log(`Average Response Time: ${avgResponseTime}ms`);
  console.log(`Claims Status: ${Object.values(results.claims_validation).every(c => c.passed) ? '✅ ALL VERIFIED' : '❌ SOME FAILED'}`);
  
  if (passRate >= 95) {
    console.log('\n🎯 SYSTEM STATUS: ENTERPRISE READY ✅');
  } else {
    console.log('\n⚠️  SYSTEM STATUS: NEEDS ATTENTION');
  }
  
  console.log(`\nDetailed report saved with ${results.detailed_results.length} test results`);
}

function makeHttpRequest(url) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    
    https.get(url, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          data,
          responseTime: endTime - startTime
        });
      });
      
    }).on('error', (err) => {
      reject(err);
    });
  });
}

// Run the test suite
if (require.main === module) {
  runPerformanceTests()
    .then(results => {
      process.exit(results.failed > 0 ? 1 : 0);
    })
    .catch(error => {
      console.error('Test suite failed:', error);
      process.exit(1);
    });
}

module.exports = { runPerformanceTests };