#!/usr/bin/env node
// Blaze Intelligence Agent Monitoring Dashboard
// Monitors automation agent performance and generates health reports

import fs from 'fs/promises';
import path from 'path';

const LOGS_DIR = path.join(process.cwd(), 'logs');
const MONITORING_REPORT = path.join(process.cwd(), 'data', 'monitoring-report.json');

/**
 * Main monitoring function
 */
async function runMonitoring() {
  try {
    console.log(`[${new Date().toISOString()}] Starting agent monitoring...`);
    
    // Check agent health
    const agentHealth = await checkAgentHealth();
    
    // Analyze performance metrics
    const performanceMetrics = await analyzePerformanceMetrics();
    
    // Check system resources
    const systemHealth = await checkSystemHealth();
    
    // Generate monitoring report
    const report = await generateMonitoringReport(agentHealth, performanceMetrics, systemHealth);
    
    // Save report
    await saveMonitoringReport(report);
    
    // Display summary
    displayMonitoringSummary(report);
    
    console.log(`[${new Date().toISOString()}] Monitoring complete`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Monitoring error:`, error.message);
  }
}

/**
 * Check health of automation agents
 */
async function checkAgentHealth() {
  const agents = {
    'cardinals-update': {
      name: 'Cardinals Data Update',
      log_file: 'cardinals.log',
      expected_frequency: 10, // minutes
      status: 'unknown'
    },
    'readiness-board': {
      name: 'Cardinals Readiness Board',
      log_file: 'readiness-board.log',
      expected_frequency: 10, // minutes  
      status: 'unknown'
    },
    'digital-autopilot': {
      name: 'Digital-Combine Autopilot',
      log_file: 'autopilot.log',
      expected_frequency: 30, // minutes
      status: 'unknown'
    }
  };
  
  for (const [key, agent] of Object.entries(agents)) {
    try {
      const logPath = path.join(LOGS_DIR, agent.log_file);
      
      // Check if log file exists
      try {
        const stats = await fs.stat(logPath);
        const ageMinutes = (Date.now() - stats.mtime.getTime()) / (1000 * 60);
        
        if (ageMinutes <= agent.expected_frequency * 2) {
          agent.status = 'healthy';
          agent.last_run_minutes_ago = Math.round(ageMinutes);
        } else {
          agent.status = 'stale';
          agent.last_run_minutes_ago = Math.round(ageMinutes);
        }
        
      } catch (fileError) {
        agent.status = 'no_logs';
        agent.error = 'Log file not found';
      }
      
    } catch (error) {
      agent.status = 'error';
      agent.error = error.message;
    }
  }
  
  return agents;
}

/**
 * Analyze performance metrics from logs
 */
async function analyzePerformanceMetrics() {
  const metrics = {
    total_executions: 0,
    successful_executions: 0,
    failed_executions: 0,
    average_execution_time: 0,
    recent_performance: [],
    error_patterns: {}
  };
  
  try {
    // Analyze research log
    const researchLogPath = path.join(LOGS_DIR, 'research.log');
    try {
      const researchLog = await fs.readFile(researchLogPath, 'utf8');
      const researchEntries = researchLog.trim().split('\n').filter(line => line.trim());
      
      researchEntries.forEach(line => {
        try {
          const entry = JSON.parse(line);
          if (entry.type === 'autopilot_cycle') {
            metrics.total_executions++;
            if (entry.health_status === 'healthy') {
              metrics.successful_executions++;
            } else {
              metrics.failed_executions++;
            }
            
            metrics.recent_performance.push({
              timestamp: entry.timestamp,
              type: 'autopilot',
              status: entry.health_status,
              confidence: entry.confidence
            });
          }
        } catch (parseError) {
          // Skip invalid JSON lines
        }
      });
      
    } catch (fileError) {
      // Research log doesn't exist yet
    }
    
    // Calculate success rate
    metrics.success_rate = metrics.total_executions > 0 ? 
      (metrics.successful_executions / metrics.total_executions) * 100 : 0;
    
    // Sort recent performance by timestamp
    metrics.recent_performance.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    metrics.recent_performance = metrics.recent_performance.slice(0, 10); // Keep last 10
    
  } catch (error) {
    console.error('Error analyzing performance metrics:', error.message);
  }
  
  return metrics;
}

/**
 * Check system health
 */
async function checkSystemHealth() {
  const health = {
    disk_space: 'unknown',
    memory_usage: 'unknown',
    data_files: 'unknown',
    api_endpoints: 'unknown',
    git_status: 'unknown'
  };
  
  try {
    // Check data files
    const requiredFiles = [
      'data/analytics/cardinals.json',
      'data/blaze-metrics.json',
      'metrics-config.js',
      'nil-calculator.js'
    ];
    
    let filesHealthy = 0;
    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(process.cwd(), file));
        filesHealthy++;
      } catch (error) {
        // File doesn't exist
      }
    }
    
    health.data_files = filesHealthy === requiredFiles.length ? 'healthy' : 'partial';
    health.data_files_count = `${filesHealthy}/${requiredFiles.length}`;
    
    // Check git status (simplified)
    try {
      await fs.access(path.join(process.cwd(), '.git'));
      health.git_status = 'healthy';
    } catch (error) {
      health.git_status = 'not_git_repo';
    }
    
  } catch (error) {
    console.error('Error checking system health:', error.message);
  }
  
  return health;
}

/**
 * Generate comprehensive monitoring report
 */
async function generateMonitoringReport(agentHealth, performanceMetrics, systemHealth) {
  const report = {
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    summary: {
      overall_status: 'unknown',
      healthy_agents: 0,
      total_agents: Object.keys(agentHealth).length,
      system_health_score: 0
    },
    agent_health: agentHealth,
    performance_metrics: performanceMetrics,
    system_health: systemHealth,
    recommendations: [],
    alerts: []
  };
  
  // Calculate overall status
  let healthyAgents = 0;
  for (const agent of Object.values(agentHealth)) {
    if (agent.status === 'healthy') healthyAgents++;
  }
  
  report.summary.healthy_agents = healthyAgents;
  
  if (healthyAgents === report.summary.total_agents) {
    report.summary.overall_status = 'healthy';
  } else if (healthyAgents > 0) {
    report.summary.overall_status = 'partial';
  } else {
    report.summary.overall_status = 'unhealthy';
  }
  
  // Generate system health score
  let systemScore = 0;
  if (systemHealth.data_files === 'healthy') systemScore += 40;
  if (systemHealth.data_files === 'partial') systemScore += 20;
  if (systemHealth.git_status === 'healthy') systemScore += 20;
  if (performanceMetrics.success_rate > 80) systemScore += 40;
  
  report.summary.system_health_score = systemScore;
  
  // Generate recommendations
  if (report.summary.overall_status !== 'healthy') {
    report.recommendations.push({
      type: 'agent_health',
      priority: 'high',
      message: 'Some automation agents are not running properly',
      action: 'Check cron configuration and agent logs'
    });
  }
  
  if (performanceMetrics.success_rate < 90 && performanceMetrics.total_executions > 0) {
    report.recommendations.push({
      type: 'performance',
      priority: 'medium',
      message: `Success rate is ${performanceMetrics.success_rate.toFixed(1)}%`,
      action: 'Review error logs and optimize agent performance'
    });
  }
  
  // Generate alerts
  for (const [key, agent] of Object.entries(agentHealth)) {
    if (agent.status === 'stale') {
      report.alerts.push({
        type: 'warning',
        agent: key,
        message: `${agent.name} hasn't run in ${agent.last_run_minutes_ago} minutes`,
        expected: `Should run every ${agent.expected_frequency} minutes`
      });
    }
    
    if (agent.status === 'error' || agent.status === 'no_logs') {
      report.alerts.push({
        type: 'error',
        agent: key,
        message: `${agent.name} is not functioning properly`,
        details: agent.error || 'No logs found'
      });
    }
  }
  
  return report;
}

/**
 * Save monitoring report
 */
async function saveMonitoringReport(report) {
  try {
    await fs.mkdir(path.dirname(MONITORING_REPORT), { recursive: true });
    await fs.writeFile(MONITORING_REPORT, JSON.stringify(report, null, 2));
    console.log('Monitoring report saved');
  } catch (error) {
    console.error('Error saving monitoring report:', error.message);
  }
}

/**
 * Display monitoring summary
 */
function displayMonitoringSummary(report) {
  console.log('\n🔍 BLAZE INTELLIGENCE AGENT MONITORING SUMMARY');
  console.log('================================================');
  
  // Overall status
  const statusEmoji = report.summary.overall_status === 'healthy' ? '✅' : 
                     report.summary.overall_status === 'partial' ? '⚠️' : '❌';
  console.log(`${statusEmoji} Overall Status: ${report.summary.overall_status.toUpperCase()}`);
  console.log(`📊 System Health Score: ${report.summary.system_health_score}/100`);
  console.log(`🤖 Healthy Agents: ${report.summary.healthy_agents}/${report.summary.total_agents}`);
  
  // Agent status
  console.log('\n🤖 AGENT STATUS:');
  for (const [key, agent] of Object.entries(report.agent_health)) {
    const agentEmoji = agent.status === 'healthy' ? '✅' : 
                      agent.status === 'stale' ? '⚠️' : '❌';
    console.log(`${agentEmoji} ${agent.name}: ${agent.status}`);
    if (agent.last_run_minutes_ago !== undefined) {
      console.log(`   Last run: ${agent.last_run_minutes_ago} minutes ago`);
    }
  }
  
  // Performance metrics
  console.log('\n📈 PERFORMANCE METRICS:');
  console.log(`Total Executions: ${report.performance_metrics.total_executions}`);
  console.log(`Success Rate: ${report.performance_metrics.success_rate.toFixed(1)}%`);
  
  // Alerts
  if (report.alerts.length > 0) {
    console.log('\n🚨 ALERTS:');
    report.alerts.forEach(alert => {
      const alertEmoji = alert.type === 'error' ? '❌' : '⚠️';
      console.log(`${alertEmoji} ${alert.message}`);
      if (alert.details) console.log(`   Details: ${alert.details}`);
      if (alert.expected) console.log(`   Expected: ${alert.expected}`);
    });
  }
  
  // Recommendations
  if (report.recommendations.length > 0) {
    console.log('\n💡 RECOMMENDATIONS:');
    report.recommendations.forEach(rec => {
      const recEmoji = rec.priority === 'high' ? '🔴' : '🟡';
      console.log(`${recEmoji} ${rec.message}`);
      console.log(`   Action: ${rec.action}`);
    });
  }
  
  console.log('\n================================================');
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  runMonitoring()
    .then(() => {
      console.log('Monitoring complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Monitoring failed:', error);
      process.exit(1);
    });
}

export default runMonitoring;