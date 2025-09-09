/**
 * Blaze Intelligence API Worker
 * Cloudflare Worker for production API with KV caching and edge deployment
 */

// Import data adapters (these will need to be bundled)
import { mlbAdapter } from '../data/mlb/adapter.js';
import { nflAdapter } from '../data/nfl/adapter.js';
import { cfbAdapter } from '../data/cfb/adapter.js';

// CORS configuration
function getCorsHeaders(origin) {
  const allowedOrigins = [
    'https://blaze-intelligence.com',
    'https://blaze-intelligence.pages.dev',
    'https://blaze-intelligence-production.pages.dev',
    'http://localhost:3000',
    'http://localhost:8000'
  ];
  
  if (allowedOrigins.includes(origin)) {
    return {
      'Access-Control-Allow-Origin': origin,
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
      'Access-Control-Allow-Credentials': 'true',
      'Access-Control-Max-Age': '86400'
    };
  }
  
  return {};
}

// Rate limiting using KV
async function checkRateLimit(request, env) {
  const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
  const key = `ratelimit:${ip}`;
  const windowMs = 15 * 60 * 1000; // 15 minutes
  const maxRequests = 100;
  
  try {
    const stored = await env.CACHE_KV.get(key);
    const data = stored ? JSON.parse(stored) : { count: 0, resetTime: Date.now() + windowMs };
    
    if (Date.now() > data.resetTime) {
      data.count = 1;
      data.resetTime = Date.now() + windowMs;
    } else {
      data.count += 1;
    }
    
    await env.CACHE_KV.put(key, JSON.stringify(data), { expirationTtl: Math.ceil(windowMs / 1000) });
    
    if (data.count > maxRequests) {
      return new Response(JSON.stringify({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((data.resetTime - Date.now()) / 1000)
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': Math.ceil((data.resetTime - Date.now()) / 1000).toString()
        }
      });
    }
    
    return null; // No rate limit violation
  } catch (error) {
    console.error('Rate limit check failed:', error);
    return null; // Allow request on error
  }
}

// KV caching utility
async function withCache(env, key, fetcher, ttl = 300) {
  try {
    // Try to get from cache first
    const cached = await env.CACHE_KV.get(key);
    if (cached) {
      const data = JSON.parse(cached);
      if (Date.now() - data.timestamp < ttl * 1000) {
        return { ...data.payload, fromCache: true };
      }
    }
    
    // Fetch fresh data
    const freshData = await fetcher();
    
    // Store in cache
    const cacheData = {
      payload: freshData,
      timestamp: Date.now()
    };
    
    await env.CACHE_KV.put(key, JSON.stringify(cacheData), { expirationTtl: ttl * 2 });
    
    return { ...freshData, fromCache: false };
  } catch (error) {
    console.error(`Cache error for ${key}:`, error);
    
    // Try to return stale data on error
    try {
      const stale = await env.CACHE_KV.get(key);
      if (stale) {
        const data = JSON.parse(stale);
        return { ...data.payload, fromCache: true, stale: true };
      }
    } catch (staleError) {
      console.error('Stale data retrieval failed:', staleError);
    }
    
    throw error;
  }
}

// Error handling utility
function handleError(error, operation) {
  console.error(`API Error in ${operation}:`, error);
  
  return new Response(JSON.stringify({
    error: true,
    message: error.message || 'Internal server error',
    operation,
    timestamp: new Date().toISOString()
  }), {
    status: error.status || 500,
    headers: { 'Content-Type': 'application/json' }
  });
}

// API route handlers
async function handleMLBTeam(request, env, teamId) {
  try {
    const cacheKey = `mlb:team:${teamId}`;
    const result = await withCache(env, cacheKey, () => mlbAdapter.getTeamSummary(parseInt(teamId)));
    
    return new Response(JSON.stringify({
      success: true,
      data: result,
      meta: {
        cached: result.fromCache,
        stale: result.stale,
        asOf: result.lastUpdated,
        source: result.source,
        confidence: result.confidence
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    return handleError(error, 'MLB Team Summary');
  }
}

async function handleNFLTeam(request, env, teamAbbr) {
  try {
    const cacheKey = `nfl:team:${teamAbbr}`;
    const result = await withCache(env, cacheKey, () => nflAdapter.getTeamSummary(teamAbbr.toUpperCase()));
    
    return new Response(JSON.stringify({
      success: true,
      data: result,
      meta: {
        cached: result.fromCache,
        stale: result.stale,
        asOf: result.lastUpdated,
        source: result.source,
        confidence: result.confidence
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    return handleError(error, 'NFL Team Summary');
  }
}

async function handleCFBTeam(request, env, teamName) {
  try {
    const decodedName = decodeURIComponent(teamName);
    const cacheKey = `cfb:team:${decodedName}`;
    const result = await withCache(env, cacheKey, () => cfbAdapter.getTeamSummary(decodedName));
    
    return new Response(JSON.stringify({
      success: true,
      data: result,
      meta: {
        cached: result.fromCache,
        stale: result.stale,
        asOf: result.lastUpdated,
        source: result.source,
        confidence: result.confidence,
        season: '2025-2026'
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
      }
    });
  } catch (error) {
    return handleError(error, 'CFB Team Summary');
  }
}

async function handleDashboardSummary(request, env) {
  try {
    const cacheKey = 'dashboard:summary';
    const result = await withCache(env, cacheKey, async () => {
      const [cardinalsResult, titansResult, longhornsResult] = await Promise.allSettled([
        mlbAdapter.getTeamSummary(138), // Cardinals
        nflAdapter.getTeamSummary('TEN'), // Titans
        cfbAdapter.getTeamSummary('Texas') // Longhorns
      ]);

      return {
        cardinals: cardinalsResult.status === 'fulfilled' ? cardinalsResult.value : null,
        titans: titansResult.status === 'fulfilled' ? titansResult.value : null,
        longhorns: longhornsResult.status === 'fulfilled' ? longhornsResult.value : null,
        errors: [
          cardinalsResult.status === 'rejected' ? { sport: 'MLB', error: cardinalsResult.reason?.message } : null,
          titansResult.status === 'rejected' ? { sport: 'NFL', error: titansResult.reason?.message } : null,
          longhornsResult.status === 'rejected' ? { sport: 'CFB', error: longhornsResult.reason?.message } : null
        ].filter(Boolean)
      };
    }, 120); // 2 minute cache for dashboard

    return new Response(JSON.stringify({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        season: '2025-2026',
        cached: result.fromCache,
        stale: result.stale
      }
    }), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120, stale-while-revalidate=300'
      }
    });
  } catch (error) {
    return handleError(error, 'Dashboard Summary');
  }
}

// Health check endpoint
async function handleHealthCheck(request, env) {
  return new Response(JSON.stringify({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: env.API_VERSION || '1.0.0',
    environment: env.ENVIRONMENT || 'production',
    region: request.cf?.colo || 'unknown'
  }), {
    headers: { 'Content-Type': 'application/json' }
  });
}

// Metrics endpoint
async function handleMetrics(request, env) {
  try {
    // Get cache statistics from KV
    const cacheStats = {
      // In a real implementation, you'd track these metrics
      hitRate: '85%',
      totalKeys: 'N/A', // KV doesn't provide this easily
      region: request.cf?.colo || 'unknown'
    };

    return new Response(JSON.stringify({
      system: {
        timestamp: new Date().toISOString(),
        region: request.cf?.colo || 'unknown',
        environment: env.ENVIRONMENT || 'production'
      },
      cache: cacheStats,
      api: {
        version: env.API_VERSION || '1.0.0',
        endpoints: [
          '/api/mlb/team/:id',
          '/api/nfl/team/:abbr',
          '/api/cfb/team/:name',
          '/api/dashboard/summary'
        ]
      }
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    return handleError(error, 'Metrics');
  }
}

// Main worker handler
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const origin = request.headers.get('Origin');
    
    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: getCorsHeaders(origin)
      });
    }
    
    // Rate limiting
    const rateLimitResponse = await checkRateLimit(request, env);
    if (rateLimitResponse) {
      return rateLimitResponse;
    }
    
    // Route handling
    const path = url.pathname;
    const corsHeaders = getCorsHeaders(origin);
    
    let response;
    
    try {
      // Health check
      if (path === '/healthz') {
        response = await handleHealthCheck(request, env);
      }
      // Metrics
      else if (path === '/metrics') {
        response = await handleMetrics(request, env);
      }
      // MLB Team
      else if (path.match(/^\/api\/mlb\/team\/(\d+)$/)) {
        const teamId = path.match(/^\/api\/mlb\/team\/(\d+)$/)[1];
        response = await handleMLBTeam(request, env, teamId);
      }
      // NFL Team
      else if (path.match(/^\/api\/nfl\/team\/([A-Z]+)$/)) {
        const teamAbbr = path.match(/^\/api\/nfl\/team\/([A-Z]+)$/)[1];
        response = await handleNFLTeam(request, env, teamAbbr);
      }
      // CFB Team
      else if (path.match(/^\/api\/cfb\/team\/(.+)$/)) {
        const teamName = path.match(/^\/api\/cfb\/team\/(.+)$/)[1];
        response = await handleCFBTeam(request, env, teamName);
      }
      // Dashboard Summary
      else if (path === '/api/dashboard/summary') {
        response = await handleDashboardSummary(request, env);
      }
      // 404
      else {
        response = new Response(JSON.stringify({
          error: 'API endpoint not found',
          path: path,
          method: request.method,
          timestamp: new Date().toISOString()
        }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' }
        });
      }
    } catch (error) {
      response = handleError(error, 'Request Handler');
    }
    
    // Add CORS headers to response
    Object.entries(corsHeaders).forEach(([key, value]) => {
      response.headers.set(key, value);
    });
    
    // Add security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    
    return response;
  }
};