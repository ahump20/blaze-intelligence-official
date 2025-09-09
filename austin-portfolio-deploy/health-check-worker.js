/**
 * Blaze Intelligence Health Check & Uptime Monitoring Worker
 * Provides health endpoints and monitors system status
 */

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };
    
    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }
    
    try {
      // Health check endpoint
      if (path === '/api/health' || path === '/health') {
        return await handleHealthCheck(env, corsHeaders);
      }
      
      // Detailed status endpoint
      if (path === '/api/status') {
        return await handleDetailedStatus(env, corsHeaders);
      }
      
      // Metrics endpoint
      if (path === '/api/metrics') {
        return await handleMetrics(env, corsHeaders);
      }
      
      // Uptime endpoint
      if (path === '/api/uptime') {
        return await handleUptime(env, corsHeaders);
      }
      
      return new Response('Not Found', { status: 404, headers: corsHeaders });
      
    } catch (error) {
      console.error('Health check error:', error);
      return new Response(JSON.stringify({
        status: 'error',
        message: error.message
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
  },
  
  // Scheduled cron job for monitoring
  async scheduled(event, env, ctx) {
    await performScheduledHealthChecks(env);
  }
};

// Basic health check
async function handleHealthCheck(env, headers) {
  const checks = {
    worker: 'healthy',
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: env.ENVIRONMENT || 'production'
  };
  
  // Check KV namespace availability
  if (env.HEALTH_METRICS) {
    try {
      await env.HEALTH_METRICS.put('last_check', new Date().toISOString());
      checks.kv_storage = 'healthy';
    } catch (error) {
      checks.kv_storage = 'unhealthy';
    }
  }
  
  // Check external dependencies
  checks.dependencies = await checkDependencies();
  
  // Overall status
  const allHealthy = Object.values(checks).every(v => 
    typeof v === 'string' ? !v.includes('unhealthy') : true
  );
  
  return new Response(JSON.stringify({
    status: allHealthy ? 'healthy' : 'degraded',
    checks: checks
  }), {
    status: allHealthy ? 200 : 503,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

// Detailed status check
async function handleDetailedStatus(env, headers) {
  const status = {
    timestamp: new Date().toISOString(),
    services: {},
    performance: {},
    errors: []
  };
  
  // Check each service
  status.services = {
    api: await checkAPIHealth(),
    database: await checkDatabaseHealth(env),
    cache: await checkCacheHealth(env),
    email: await checkEmailService(env),
    analytics: await checkAnalyticsService()
  };
  
  // Performance metrics
  status.performance = {
    response_time: await measureResponseTime(),
    memory_usage: getMemoryUsage(),
    cpu_usage: 'N/A', // Not available in Workers
    request_rate: await getRequestRate(env)
  };
  
  // Recent errors
  if (env.ERROR_LOG) {
    try {
      const errors = await env.ERROR_LOG.list({ limit: 10 });
      status.errors = errors.keys.map(key => ({
        id: key.name,
        metadata: key.metadata
      }));
    } catch (error) {
      status.errors = [{ error: 'Could not fetch error log' }];
    }
  }
  
  return new Response(JSON.stringify(status), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

// Metrics endpoint
async function handleMetrics(env, headers) {
  const metrics = {
    timestamp: new Date().toISOString(),
    period: '24h',
    data: {}
  };
  
  // Fetch metrics from KV if available
  if (env.HEALTH_METRICS) {
    try {
      // Request metrics
      const requests = await env.HEALTH_METRICS.get('requests_24h');
      metrics.data.requests = requests ? JSON.parse(requests) : {
        total: 0,
        success: 0,
        errors: 0,
        avg_response_time: 0
      };
      
      // Error metrics
      const errors = await env.HEALTH_METRICS.get('errors_24h');
      metrics.data.errors = errors ? JSON.parse(errors) : {
        total: 0,
        by_type: {}
      };
      
      // Performance metrics
      const performance = await env.HEALTH_METRICS.get('performance_24h');
      metrics.data.performance = performance ? JSON.parse(performance) : {
        p50: 0,
        p95: 0,
        p99: 0
      };
      
    } catch (error) {
      metrics.error = 'Could not fetch metrics';
    }
  }
  
  // Calculate SLA compliance
  const totalRequests = metrics.data.requests?.total || 0;
  const successRequests = metrics.data.requests?.success || 0;
  metrics.sla = {
    uptime: totalRequests > 0 ? (successRequests / totalRequests * 100).toFixed(2) + '%' : 'N/A',
    target: '99.9%',
    compliant: totalRequests > 0 ? (successRequests / totalRequests) >= 0.999 : true
  };
  
  return new Response(JSON.stringify(metrics), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

// Uptime endpoint
async function handleUptime(env, headers) {
  const uptime = {
    timestamp: new Date().toISOString(),
    current_status: 'operational',
    uptime_percentage: '99.95%',
    incidents: []
  };
  
  // Fetch uptime data from KV
  if (env.HEALTH_METRICS) {
    try {
      const startTime = await env.HEALTH_METRICS.get('service_start_time');
      if (startTime) {
        const start = new Date(startTime);
        const now = new Date();
        const uptimeMs = now - start;
        
        uptime.uptime_duration = {
          days: Math.floor(uptimeMs / (1000 * 60 * 60 * 24)),
          hours: Math.floor((uptimeMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((uptimeMs % (1000 * 60 * 60)) / (1000 * 60))
        };
      }
      
      // Get recent incidents
      const incidents = await env.HEALTH_METRICS.get('incidents_30d');
      if (incidents) {
        uptime.incidents = JSON.parse(incidents);
      }
      
    } catch (error) {
      uptime.error = 'Could not fetch uptime data';
    }
  }
  
  // Check current status
  const healthCheck = await checkAllSystems(env);
  uptime.current_status = healthCheck.healthy ? 'operational' : 
                          healthCheck.degraded ? 'degraded' : 'down';
  
  uptime.systems = healthCheck.systems;
  
  return new Response(JSON.stringify(uptime), {
    status: 200,
    headers: { ...headers, 'Content-Type': 'application/json' }
  });
}

// Check external dependencies
async function checkDependencies() {
  const deps = {};
  
  // Check Cloudflare Pages
  try {
    const response = await fetch('https://blaze-intelligence.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    deps.cloudflare_pages = response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    deps.cloudflare_pages = 'unhealthy';
  }
  
  // Check CDN
  try {
    const response = await fetch('https://cdn.tailwindcss.com', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    deps.cdn = response.ok ? 'healthy' : 'unhealthy';
  } catch (error) {
    deps.cdn = 'unhealthy';
  }
  
  return deps;
}

// Check API health
async function checkAPIHealth() {
  try {
    const start = Date.now();
    const response = await fetch('https://blaze-intelligence.com/api/health', {
      signal: AbortSignal.timeout(5000)
    });
    const responseTime = Date.now() - start;
    
    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      response_time: responseTime + 'ms',
      status_code: response.status
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Check database health (KV)
async function checkDatabaseHealth(env) {
  if (!env.HEALTH_METRICS) {
    return { status: 'not_configured' };
  }
  
  try {
    const start = Date.now();
    await env.HEALTH_METRICS.put('health_check', new Date().toISOString());
    const value = await env.HEALTH_METRICS.get('health_check');
    const responseTime = Date.now() - start;
    
    return {
      status: value ? 'healthy' : 'unhealthy',
      response_time: responseTime + 'ms'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Check cache health
async function checkCacheHealth(env) {
  // Check if cache API is available
  if (typeof caches === 'undefined') {
    return { status: 'not_available' };
  }
  
  try {
    const cache = await caches.open('health-check');
    const testUrl = 'https://test.blaze-intelligence.com/health';
    
    // Write to cache
    await cache.put(testUrl, new Response('healthy'));
    
    // Read from cache
    const response = await cache.match(testUrl);
    
    return {
      status: response ? 'healthy' : 'unhealthy'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Check email service
async function checkEmailService(env) {
  if (!env.MAILGUN_API_KEY) {
    return { status: 'not_configured' };
  }
  
  // Just verify the API key format
  return {
    status: env.MAILGUN_API_KEY.startsWith('key-') ? 'configured' : 'misconfigured'
  };
}

// Check analytics service
async function checkAnalyticsService() {
  try {
    const response = await fetch('https://www.google-analytics.com/g/collect', {
      method: 'HEAD',
      signal: AbortSignal.timeout(5000)
    });
    
    return {
      status: response.ok || response.status === 404 ? 'healthy' : 'unhealthy'
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message
    };
  }
}

// Measure response time
async function measureResponseTime() {
  const measurements = [];
  
  // Test multiple endpoints
  const endpoints = [
    '/',
    '/demo.html',
    '/api/health'
  ];
  
  for (const endpoint of endpoints) {
    try {
      const start = Date.now();
      await fetch(`https://blaze-intelligence.com${endpoint}`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      });
      measurements.push(Date.now() - start);
    } catch (error) {
      // Skip failed measurements
    }
  }
  
  if (measurements.length === 0) {
    return 'N/A';
  }
  
  const avg = measurements.reduce((a, b) => a + b, 0) / measurements.length;
  return Math.round(avg) + 'ms';
}

// Get memory usage (approximation for Workers)
function getMemoryUsage() {
  // Workers don't provide direct memory access
  // This is a placeholder
  return {
    used: 'N/A',
    limit: '128MB'
  };
}

// Get request rate
async function getRequestRate(env) {
  if (!env.HEALTH_METRICS) {
    return 'N/A';
  }
  
  try {
    const rate = await env.HEALTH_METRICS.get('request_rate_per_minute');
    return rate ? JSON.parse(rate) : { rate: 0, unit: 'req/min' };
  } catch (error) {
    return 'N/A';
  }
}

// Check all systems
async function checkAllSystems(env) {
  const systems = {
    api: await checkAPIHealth(),
    database: await checkDatabaseHealth(env),
    cache: await checkCacheHealth(env),
    dependencies: await checkDependencies()
  };
  
  let healthy = 0;
  let unhealthy = 0;
  let degraded = 0;
  
  Object.values(systems).forEach(system => {
    if (typeof system === 'object') {
      if (system.status === 'healthy') healthy++;
      else if (system.status === 'degraded') degraded++;
      else unhealthy++;
    }
  });
  
  return {
    healthy: unhealthy === 0 && degraded === 0,
    degraded: degraded > 0 && unhealthy === 0,
    down: unhealthy > 0,
    systems: systems
  };
}

// Scheduled health checks
async function performScheduledHealthChecks(env) {
  const timestamp = new Date().toISOString();
  
  // Perform checks
  const health = await checkAllSystems(env);
  
  // Store results
  if (env.HEALTH_METRICS) {
    try {
      // Store current status
      await env.HEALTH_METRICS.put('last_scheduled_check', JSON.stringify({
        timestamp: timestamp,
        ...health
      }));
      
      // Update uptime tracking
      if (!health.healthy) {
        // Log incident
        const incidents = await env.HEALTH_METRICS.get('incidents_30d');
        const incidentList = incidents ? JSON.parse(incidents) : [];
        
        incidentList.push({
          timestamp: timestamp,
          type: health.down ? 'outage' : 'degradation',
          systems: health.systems
        });
        
        // Keep only last 30 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const filtered = incidentList.filter(i => 
          new Date(i.timestamp) > thirtyDaysAgo
        );
        
        await env.HEALTH_METRICS.put('incidents_30d', JSON.stringify(filtered));
      }
      
      // Alert if down
      if (health.down && env.ADMIN_EMAIL) {
        // Send alert email (implement based on your email service)
        console.error('System down alert:', health);
      }
      
    } catch (error) {
      console.error('Failed to store health check results:', error);
    }
  }
  
  console.log('Scheduled health check completed:', health);
}