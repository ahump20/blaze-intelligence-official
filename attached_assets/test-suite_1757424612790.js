#!/usr/bin/env node

/**
 * Blaze Vision AI - Automated Testing Suite
 * Comprehensive tests for production validation
 */

const GATEWAY_URL = 'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev';
const COACH_UI_URL = 'https://blaze-coach-ui.pages.dev';

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

// Test results tracking
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const testResults = [];

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function generateUUID() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

async function runTest(name, testFn) {
  totalTests++;
  process.stdout.write(`Testing ${name}... `);
  
  try {
    const startTime = Date.now();
    await testFn();
    const duration = Date.now() - startTime;
    
    passedTests++;
    log(`✅ PASSED (${duration}ms)`, 'green');
    testResults.push({ name, status: 'passed', duration });
  } catch (error) {
    failedTests++;
    log(`❌ FAILED: ${error.message}`, 'red');
    testResults.push({ name, status: 'failed', error: error.message });
  }
}

// Test implementations
async function testHealthCheck() {
  const response = await fetch(`${GATEWAY_URL}/healthz`);
  const data = await response.json();
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (data.status !== 'healthy' && data.status !== 'degraded') {
    throw new Error(`Unexpected status: ${data.status}`);
  }
  if (!data.timestamp || !data.service || !data.version) {
    throw new Error('Missing required fields');
  }
}

async function testMetrics() {
  const response = await fetch(`${GATEWAY_URL}/metrics`);
  const data = await response.json();
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (typeof data.requests_total !== 'number') {
    throw new Error('Invalid metrics format');
  }
  if (!data.timestamp) {
    throw new Error('Missing timestamp');
  }
}

async function testSessionCreation() {
  const sessionId = generateUUID();
  const response = await fetch(`${GATEWAY_URL}/vision/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-Mode': 'true'
    },
    body: JSON.stringify({
      session_id: sessionId,
      player_id: 'TEST_Player_001',
      sport: 'baseball',
      target_fps: 60,
      enable_face: true,
      enable_pose: true
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${JSON.stringify(data)}`);
  if (!data.success) throw new Error('Session creation failed');
  if (data.session_id !== sessionId) throw new Error('Session ID mismatch');
  
  // Clean up - delete session
  await fetch(`${GATEWAY_URL}/vision/session/${sessionId}`, {
    method: 'DELETE',
    headers: { 'X-Dev-Mode': 'true' }
  });
}

async function testTelemetryProcessing() {
  // Create session first
  const sessionId = generateUUID();
  await fetch(`${GATEWAY_URL}/vision/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-Mode': 'true'
    },
    body: JSON.stringify({
      session_id: sessionId,
      player_id: 'TEST_Player_002',
      sport: 'baseball'
    })
  });
  
  // Send telemetry
  const response = await fetch(`${GATEWAY_URL}/vision/telemetry`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-Mode': 'true'
    },
    body: JSON.stringify([{
      session_id: sessionId,
      t: Date.now(),
      face: {
        blink: 0,
        eye_ar: 0.28,
        gaze: [0.1, -0.05, 0.95],
        head_euler: [2.1, -1.4, 0.3],
        au_intensities: {
          au4: 0.15,
          au5_7: 0.08,
          au9_10: 0.12,
          au14: 0.05,
          au17_23_24: 0.22
        },
        qc: {
          detection_confidence: 0.94,
          tracking_stability: 0.88,
          motion_blur: 0.15,
          illumination: 0.75,
          occlusion_ratio: 0.02
        }
      },
      pose: {
        kp: [[100, 200, 0.9, 0.85]],
        angles: {
          arm_slot: 85.2,
          shoulder_separation: 42.1,
          stride_length: 0.68,
          release_height: 6.2,
          balance_score: 0.82,
          consistency_score: 0.76
        },
        qc: {
          detection_confidence: 0.92,
          tracking_stability: 0.85,
          motion_blur: 0.12,
          illumination: 0.78,
          occlusion_ratio: 0.03
        }
      },
      device: {
        fps: 60,
        resolution: [1920, 1080],
        has_webgpu: true,
        has_webgl: true,
        camera_count: 2
      }
    }])
  });
  
  const data = await response.json();
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!data.success) throw new Error('Telemetry processing failed');
  if (!data.scores || data.scores.length === 0) throw new Error('No scores returned');
  
  const score = data.scores[0];
  if (typeof score.grit !== 'number' || score.grit < 0 || score.grit > 100) {
    throw new Error(`Invalid Grit Index: ${score.grit}`);
  }
  if (typeof score.risk !== 'number' || score.risk < 0 || score.risk > 1) {
    throw new Error(`Invalid risk score: ${score.risk}`);
  }
  if (data.gateway_latency_ms > 150) {
    throw new Error(`Latency too high: ${data.gateway_latency_ms}ms (target: <150ms)`);
  }
  
  // Clean up
  await fetch(`${GATEWAY_URL}/vision/session/${sessionId}`, {
    method: 'DELETE',
    headers: { 'X-Dev-Mode': 'true' }
  });
}

async function testScoreRetrieval() {
  const sessionId = generateUUID();
  
  // Create session and send telemetry
  await fetch(`${GATEWAY_URL}/vision/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-Mode': 'true'
    },
    body: JSON.stringify({
      session_id: sessionId,
      player_id: 'TEST_Player_003',
      sport: 'baseball'
    })
  });
  
  // Get scores
  const response = await fetch(`${GATEWAY_URL}/vision/session/${sessionId}/scores`, {
    headers: { 'X-Dev-Mode': 'true' }
  });
  
  const data = await response.json();
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!data.success) throw new Error('Score retrieval failed');
  
  // Clean up
  await fetch(`${GATEWAY_URL}/vision/session/${sessionId}`, {
    method: 'DELETE',
    headers: { 'X-Dev-Mode': 'true' }
  });
}

async function testGameSituationUpdate() {
  const sessionId = generateUUID();
  
  // Create session
  await fetch(`${GATEWAY_URL}/vision/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-Mode': 'true'
    },
    body: JSON.stringify({
      session_id: sessionId,
      player_id: 'TEST_Player_004',
      sport: 'baseball'
    })
  });
  
  // Update game situation
  const response = await fetch(`${GATEWAY_URL}/vision/session/${sessionId}/situation`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-Mode': 'true'
    },
    body: JSON.stringify({
      inning: 9,
      outs: 2,
      bases: '111',
      score_diff: -1
    })
  });
  
  const data = await response.json();
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!data.success) throw new Error('Game situation update failed');
  
  // Clean up
  await fetch(`${GATEWAY_URL}/vision/session/${sessionId}`, {
    method: 'DELETE',
    headers: { 'X-Dev-Mode': 'true' }
  });
}

async function testAnalyticsEndpoints() {
  // Test system stats
  const response = await fetch(`${GATEWAY_URL}/vision/analytics/system/stats`, {
    headers: { 'X-Dev-Mode': 'true' }
  });
  
  const data = await response.json();
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  if (!data.success) throw new Error('Analytics query failed');
  if (!data.stats) throw new Error('Missing stats data');
}

async function testCoachUIAvailability() {
  const response = await fetch(COACH_UI_URL);
  
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  
  const html = await response.text();
  if (!html.includes('Blaze')) {
    throw new Error('Coach UI content not found');
  }
}

async function testErrorHandling() {
  // Test invalid UUID
  const response1 = await fetch(`${GATEWAY_URL}/vision/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-Mode': 'true'
    },
    body: JSON.stringify({
      session_id: 'invalid-uuid',
      player_id: 'TEST_Player',
      sport: 'baseball'
    })
  });
  
  if (response1.ok) throw new Error('Should have rejected invalid UUID');
  
  // Test missing session
  const response2 = await fetch(`${GATEWAY_URL}/vision/session/nonexistent/scores`, {
    headers: { 'X-Dev-Mode': 'true' }
  });
  
  const data2 = await response2.json();
  if (!data2.scores || data2.scores.length > 0) {
    throw new Error('Should return empty scores for nonexistent session');
  }
}

async function testPerformanceBenchmarks() {
  const iterations = 10;
  const latencies = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    const response = await fetch(`${GATEWAY_URL}/healthz`);
    await response.json();
    const latency = Date.now() - startTime;
    latencies.push(latency);
  }
  
  const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
  const maxLatency = Math.max(...latencies);
  
  if (avgLatency > 200) {
    throw new Error(`Average latency too high: ${avgLatency.toFixed(2)}ms (target: <200ms)`);
  }
  if (maxLatency > 500) {
    throw new Error(`Max latency too high: ${maxLatency}ms (target: <500ms)`);
  }
  
  log(`  Average latency: ${avgLatency.toFixed(2)}ms`, 'blue');
  log(`  Max latency: ${maxLatency}ms`, 'blue');
}

// Main test runner
async function runAllTests() {
  log('\n🔥 Blaze Vision AI - Automated Test Suite', 'yellow');
  log('=========================================\n', 'yellow');
  
  // Infrastructure tests
  log('📡 Infrastructure Tests:', 'blue');
  await runTest('Health Check', testHealthCheck);
  await runTest('Metrics Endpoint', testMetrics);
  await runTest('Coach UI Availability', testCoachUIAvailability);
  
  // Core functionality tests
  log('\n🧠 Core Functionality Tests:', 'blue');
  await runTest('Session Creation', testSessionCreation);
  await runTest('Telemetry Processing', testTelemetryProcessing);
  await runTest('Score Retrieval', testScoreRetrieval);
  await runTest('Game Situation Update', testGameSituationUpdate);
  
  // Analytics tests
  log('\n📊 Analytics Tests:', 'blue');
  await runTest('Analytics Endpoints', testAnalyticsEndpoints);
  
  // Error handling tests
  log('\n🛡️ Error Handling Tests:', 'blue');
  await runTest('Error Responses', testErrorHandling);
  
  // Performance tests
  log('\n⚡ Performance Tests:', 'blue');
  await runTest('Performance Benchmarks', testPerformanceBenchmarks);
  
  // Summary
  log('\n=========================================', 'yellow');
  log('📈 Test Results Summary:', 'yellow');
  log(`  Total Tests: ${totalTests}`, 'blue');
  log(`  ✅ Passed: ${passedTests}`, 'green');
  log(`  ❌ Failed: ${failedTests}`, failedTests > 0 ? 'red' : 'green');
  log(`  Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`, 'blue');
  
  // Detailed failures
  if (failedTests > 0) {
    log('\n❌ Failed Tests:', 'red');
    testResults
      .filter(r => r.status === 'failed')
      .forEach(r => {
        log(`  - ${r.name}: ${r.error}`, 'red');
      });
  }
  
  // Performance summary
  const avgDuration = testResults
    .filter(r => r.status === 'passed' && r.duration)
    .reduce((sum, r) => sum + r.duration, 0) / passedTests;
  
  log(`\n⏱️ Average Test Duration: ${avgDuration.toFixed(2)}ms`, 'blue');
  
  // Exit code
  const exitCode = failedTests > 0 ? 1 : 0;
  log(`\n${exitCode === 0 ? '✅ All tests passed!' : '❌ Some tests failed'}`, exitCode === 0 ? 'green' : 'red');
  process.exit(exitCode);
}

// Run tests
runAllTests().catch(error => {
  log(`\n💥 Test suite crashed: ${error.message}`, 'red');
  console.error(error);
  process.exit(1);
});