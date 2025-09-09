/**
 * Enhanced Live Data Client for Blaze Intelligence
 * Advanced multi-layer caching, circuit breakers, request deduplication, and intelligent fallbacks
 */

// Dynamic import for advanced cache (browser only)
let AdvancedCache = null;
if (typeof window !== 'undefined') {
  import('../utils/advanced-cache.js').then(module => {
    AdvancedCache = module.default;
  }).catch(() => {
    console.warn('Advanced cache not available, using simple cache');
  });
}

class CircuitBreaker {
  constructor(threshold = 5, timeout = 60000) {
    this.failureThreshold = threshold;
    this.resetTimeout = timeout;
    this.state = 'CLOSED'; // CLOSED, OPEN, HALF_OPEN
    this.failureCount = 0;
    this.lastFailureTime = null;
    this.successCount = 0;
  }
  
  async execute(fn) {
    if (this.state === 'OPEN') {
      if (Date.now() - this.lastFailureTime > this.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.successCount = 0;
      } else {
        throw new Error('Circuit breaker is OPEN');
      }
    }
    
    try {
      const result = await fn();
      this.onSuccess();
      return result;
    } catch (error) {
      this.onFailure();
      throw error;
    }
  }
  
  onSuccess() {
    this.failureCount = 0;
    if (this.state === 'HALF_OPEN') {
      this.successCount++;
      if (this.successCount >= 3) {
        this.state = 'CLOSED';
      }
    }
  }
  
  onFailure() {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    if (this.failureCount >= this.failureThreshold) {
      this.state = 'OPEN';
    }
  }
}

class LiveDataClient {
  constructor() {
    this.baseUrl = this.getApiBaseUrl();
    
    // Initialize cache system
    this.initCache();
    
    // Request management
    this.retryAttempts = 3;
    this.retryDelay = 1000;
    this.pendingRequests = new Map();
    
    // Circuit breakers for different endpoints
    this.circuitBreakers = new Map();
    
    // Performance monitoring
    this.requestStats = {
      total: 0,
      successful: 0,
      failed: 0,
      cached: 0,
      circuitBreakerTrips: 0
    };
    
    // Background tasks
    this.startBackgroundTasks();
  }
  
  async initCache() {
    // Try to use advanced cache if available, fallback to simple cache
    if (typeof window !== 'undefined' && AdvancedCache) {
      this.cache = new AdvancedCache({
        l1MaxSize: 50,
        l2MaxSize: 200,
        l3MaxSize: 500,
        defaultTTL: 5 * 60 * 1000, // 5 minutes
        staleTTL: 30 * 60 * 1000, // 30 minutes for stale data
        backgroundRefreshThreshold: 0.7
      });
      this.useAdvancedCache = true;
    } else {
      // Fallback to simple Map-based cache
      this.cache = new Map();
      this.cacheTTL = 5 * 60 * 1000;
      this.useAdvancedCache = false;
    }
  }
  
  getCircuitBreaker(endpoint) {
    if (!this.circuitBreakers.has(endpoint)) {
      this.circuitBreakers.set(endpoint, new CircuitBreaker());
    }
    return this.circuitBreakers.get(endpoint);
  }
  
  startBackgroundTasks() {
    // Periodically clean up pending requests
    setInterval(() => {
      const now = Date.now();
      for (const [key, request] of this.pendingRequests) {
        if (now - request.timestamp > 30000) { // 30 seconds timeout
          this.pendingRequests.delete(key);
        }
      }
    }, 10000);
    
    // Log performance stats periodically
    setInterval(() => {
      if (this.requestStats.total > 0) {
        console.log('LiveDataClient Stats:', this.getPerformanceStats());
      }
    }, 60000);
  }

  getApiBaseUrl() {
    // Determine API base URL based on environment
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:3000';
    }
    
    // Production API endpoints
    if (window.location.hostname.includes('pages.dev')) {
      return 'https://blaze-intelligence-api.workers.dev';
    }
    
    return window.location.origin;
  }

  async fetchWithRetry(url, options = {}, attempt = 1) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
          ...options.headers
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      if (attempt < this.retryAttempts) {
        console.warn(`API request failed (attempt ${attempt}), retrying...`, error.message);
        await this.delay(this.retryDelay * attempt);
        return this.fetchWithRetry(url, options, attempt + 1);
      }
      throw error;
    }
  }

  async fetchWithCache(key, fetcher, priority = 'normal') {
    this.requestStats.total++;
    
    // Check for duplicate requests  
    if (this.pendingRequests.has(key)) {
      console.log(`Deduplicating request for ${key}`);
      return this.pendingRequests.get(key).promise;
    }
    
    // Try cache first
    if (this.useAdvancedCache) {
      const cached = await this.cache.get(key);
      if (cached) {
        this.requestStats.cached++;
        return { 
          ...cached.data, 
          fromCache: true, 
          fresh: cached.fresh,
          cacheSource: cached.source 
        };
      }
    } else {
      const cached = this.cache.get(key);
      const now = Date.now();
      if (cached && (now - cached.timestamp) < this.cacheTTL) {
        this.requestStats.cached++;
        return { ...cached.data, fromCache: true };
      }
    }
    
    // Create promise for request deduplication
    const requestPromise = this.executeRequest(key, fetcher, priority);
    this.pendingRequests.set(key, { 
      promise: requestPromise, 
      timestamp: Date.now() 
    });
    
    try {
      const result = await requestPromise;
      this.pendingRequests.delete(key);
      return result;
    } catch (error) {
      this.pendingRequests.delete(key);
      throw error;
    }
  }
  
  async executeRequest(key, fetcher, priority) {
    const endpoint = key.split('-')[0]; // Extract endpoint for circuit breaker
    const circuitBreaker = this.getCircuitBreaker(endpoint);
    
    try {
      const data = await circuitBreaker.execute(fetcher);
      
      // Cache the successful result
      if (this.useAdvancedCache) {
        await this.cache.set(key, data, undefined, { priority });
      } else {
        this.cache.set(key, { data, timestamp: Date.now() });
      }
      
      this.requestStats.successful++;
      return { ...data, fromCache: false };
      
    } catch (error) {
      this.requestStats.failed++;
      
      if (error.message.includes('Circuit breaker is OPEN')) {
        this.requestStats.circuitBreakerTrips++;
      }
      
      // Try to return stale data
      const staleData = await this.getStaleData(key);
      if (staleData) {
        console.warn(`API error, returning stale data for ${key}:`, error.message);
        return { ...staleData, fromCache: true, stale: true, error: error.message };
      }
      
      throw error;
    }
  }
  
  async getStaleData(key) {
    if (this.useAdvancedCache) {
      // Advanced cache handles stale data automatically
      return null;
    } else {
      // Simple cache fallback
      const cached = this.cache.get(key);
      return cached ? cached.data : null;
    }
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // === MLB DATA METHODS ===
  async getMLBTeam(teamId) {
    return this.fetchWithCache(`mlb-team-${teamId}`, async () => {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/mlb/team/${teamId}`);
      return response;
    });
  }

  async getMLBPlayer(playerId) {
    return this.fetchWithCache(`mlb-player-${playerId}`, async () => {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/mlb/player/${playerId}`);
      return response;
    });
  }

  async getMLBGames() {
    return this.fetchWithCache('mlb-games', async () => {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/mlb/games`);
      return response;
    });
  }

  // === NFL DATA METHODS ===
  async getNFLTeam(teamAbbr) {
    return this.fetchWithCache(`nfl-team-${teamAbbr}`, async () => {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/nfl/team/${teamAbbr}`);
      return response;
    });
  }

  async getNFLPlayer(playerId) {
    return this.fetchWithCache(`nfl-player-${playerId}`, async () => {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/nfl/player/${playerId}`);
      return response;
    });
  }

  async getNFLGames() {
    return this.fetchWithCache('nfl-games', async () => {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/nfl/games`);
      return response;
    });
  }

  // === COLLEGE FOOTBALL DATA METHODS ===
  async getCFBTeam(teamName) {
    return this.fetchWithCache(`cfb-team-${teamName}`, async () => {
      const encodedName = encodeURIComponent(teamName);
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/cfb/team/${encodedName}`);
      return response;
    });
  }

  async getCFBPlayer(playerId) {
    return this.fetchWithCache(`cfb-player-${playerId}`, async () => {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/cfb/player/${playerId}`);
      return response;
    });
  }

  async getCFBGames() {
    return this.fetchWithCache('cfb-games', async () => {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/cfb/games`);
      return response;
    });
  }

  // === DASHBOARD SUMMARY ===
  async getDashboardSummary() {
    return this.fetchWithCache('dashboard-summary', async () => {
      const response = await this.fetchWithRetry(`${this.baseUrl}/api/dashboard/summary`);
      return response;
    });
  }

  // === HEALTH CHECK ===
  async getHealthStatus() {
    try {
      const response = await this.fetchWithRetry(`${this.baseUrl}/healthz`);
      return { healthy: true, ...response };
    } catch (error) {
      return { healthy: false, error: error.message };
    }
  }

  // === UTILITY METHODS ===
  formatTimestamp(timestamp) {
    return new Date(timestamp).toLocaleString();
  }

  getDataFreshness(timestamp) {
    const now = Date.now();
    const diff = now - new Date(timestamp).getTime();
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
    return `${Math.floor(diff / 86400000)} days ago`;
  }

  createDataBadge(source, confidence, timestamp) {
    const freshness = this.getDataFreshness(timestamp);
    const isDemo = source.includes('Demo');
    
    return {
      text: isDemo ? 'DEMO DATA' : source,
      class: isDemo ? 'demo-badge' : confidence === 'high' ? 'live-badge' : 'cached-badge',
      title: `Source: ${source} | Confidence: ${confidence} | Updated: ${freshness}`,
      confidence,
      source,
      freshness,
      isDemo
    };
  }

  // === ERROR HANDLING ===
  createFallbackData(type, message = 'Data temporarily unavailable') {
    const timestamp = new Date().toISOString();
    
    const fallbackData = {
      mlb: {
        id: 'fallback',
        name: 'Data Unavailable',
        wins: 0,
        losses: 0,
        winPercentage: 0,
        lastUpdated: timestamp,
        source: 'Fallback',
        confidence: 'low'
      },
      nfl: {
        id: 'fallback',
        name: 'Data Unavailable',
        wins: 0,
        losses: 0,
        ties: 0,
        winPercentage: 0,
        lastUpdated: timestamp,
        source: 'Fallback',
        confidence: 'low'
      },
      cfb: {
        id: 'fallback',
        name: 'Data Unavailable',
        school: 'Data Unavailable',
        wins: 0,
        losses: 0,
        winPercentage: 0,
        lastUpdated: timestamp,
        source: 'Fallback',
        confidence: 'low'
      }
    };

    return {
      success: false,
      data: fallbackData[type] || fallbackData.mlb,
      meta: {
        error: message,
        timestamp,
        fallback: true
      }
    };
  }

  // === CACHE MANAGEMENT ===
  async clearCache() {
    if (this.useAdvancedCache) {
      await this.cache.clear();
    } else {
      this.cache.clear();
    }
    console.log('Data cache cleared');
  }

  async getCacheStats() {
    if (this.useAdvancedCache) {
      return await this.cache.getDetailedStats();
    } else {
      return {
        size: this.cache.size,
        keys: Array.from(this.cache.keys()),
        totalSize: JSON.stringify(Array.from(this.cache.values())).length,
        hitRate: 'N/A (simple cache)'
      };
    }
  }
  
  getPerformanceStats() {
    const successRate = this.requestStats.total > 0 
      ? ((this.requestStats.successful / this.requestStats.total) * 100).toFixed(1)
      : '0.0';
      
    const cacheHitRate = this.requestStats.total > 0
      ? ((this.requestStats.cached / this.requestStats.total) * 100).toFixed(1) 
      : '0.0';
    
    return {
      ...this.requestStats,
      successRate: `${successRate}%`,
      cacheHitRate: `${cacheHitRate}%`,
      pendingRequests: this.pendingRequests.size,
      circuitBreakers: Object.fromEntries(
        Array.from(this.circuitBreakers.entries()).map(([key, cb]) => [
          key, 
          { state: cb.state, failures: cb.failureCount }
        ])
      )
    };
  }
  
  // === HEALTH AND DIAGNOSTICS ===
  async runHealthCheck() {
    const results = {
      timestamp: new Date().toISOString(),
      caching: { status: 'unknown' },
      api: { status: 'unknown' },
      circuitBreakers: {},
      overall: 'unknown'
    };
    
    // Test caching system
    try {
      const testKey = 'health-check-cache-test';
      const testData = { test: true, timestamp: Date.now() };
      
      if (this.useAdvancedCache) {
        await this.cache.set(testKey, testData, 10000); // 10 second TTL
        const retrieved = await this.cache.get(testKey);
        results.caching.status = retrieved ? 'healthy' : 'degraded';
        await this.cache.delete(testKey);
      } else {
        this.cache.set(testKey, { data: testData, timestamp: Date.now() });
        const retrieved = this.cache.get(testKey);
        results.caching.status = retrieved ? 'healthy' : 'degraded';
        this.cache.delete(testKey);
      }
    } catch (error) {
      results.caching.status = 'unhealthy';
      results.caching.error = error.message;
    }
    
    // Test API connectivity
    try {
      const healthResponse = await this.getHealthStatus();
      results.api.status = healthResponse.healthy ? 'healthy' : 'degraded';
      results.api.response = healthResponse;
    } catch (error) {
      results.api.status = 'unhealthy';
      results.api.error = error.message;
    }
    
    // Check circuit breaker states
    for (const [endpoint, breaker] of this.circuitBreakers) {
      results.circuitBreakers[endpoint] = {
        state: breaker.state,
        failureCount: breaker.failureCount,
        healthy: breaker.state === 'CLOSED'
      };
    }
    
    // Overall health assessment
    const healthyComponents = [
      results.caching.status === 'healthy',
      results.api.status === 'healthy',
      Object.values(results.circuitBreakers).every(cb => cb.healthy)
    ].filter(Boolean).length;
    
    if (healthyComponents === 3) {
      results.overall = 'healthy';
    } else if (healthyComponents >= 2) {
      results.overall = 'degraded';
    } else {
      results.overall = 'unhealthy';
    }
    
    return results;
  }
  
  // === CIRCUIT BREAKER MANAGEMENT ===
  resetCircuitBreaker(endpoint) {
    const breaker = this.circuitBreakers.get(endpoint);
    if (breaker) {
      breaker.state = 'CLOSED';
      breaker.failureCount = 0;
      breaker.lastFailureTime = null;
      console.log(`Circuit breaker for ${endpoint} has been reset`);
    }
  }
  
  resetAllCircuitBreakers() {
    for (const [endpoint, breaker] of this.circuitBreakers) {
      this.resetCircuitBreaker(endpoint);
    }
    console.log('All circuit breakers have been reset');
  }
}

// Initialize global data client
window.liveDataClient = new LiveDataClient();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LiveDataClient;
}