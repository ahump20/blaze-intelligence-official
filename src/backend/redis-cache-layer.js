/**
 * Redis Cache Layer for Production Performance
 * Provides enterprise-grade caching for Blaze Intelligence
 */

import Redis from 'ioredis';
import { createHash } from 'crypto';

class RedisCacheLayer {
  constructor() {
    this.redis = null;
    this.isConnected = false;
    this.fallbackCache = new Map(); // In-memory fallback
    this.stats = {
      hits: 0,
      misses: 0,
      errors: 0
    };
  }

  async initialize() {
    try {
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: process.env.REDIS_PORT || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: process.env.REDIS_DB || 0,
        retryDelayOnFailover: 100,
        maxRetriesPerRequest: 3,
        lazyConnect: true,
        connectTimeout: 10000,
        commandTimeout: 5000
      };

      // Use Redis URL if provided
      if (process.env.REDIS_URL) {
        this.redis = new Redis(process.env.REDIS_URL, {
          maxRetriesPerRequest: 3,
          lazyConnect: true
        });
      } else {
        this.redis = new Redis(redisConfig);
      }

      // Event handlers
      this.redis.on('connect', () => {
        console.log('✅ Redis connected successfully');
        this.isConnected = true;
      });

      this.redis.on('error', (error) => {
        console.warn('⚠️  Redis connection error:', error.message);
        this.isConnected = false;
        this.stats.errors++;
      });

      this.redis.on('close', () => {
        console.log('🔌 Redis connection closed');
        this.isConnected = false;
      });

      // Test connection
      await this.redis.ping();
      console.log('🚀 Redis cache layer initialized');
      
    } catch (error) {
      console.warn('⚠️  Redis unavailable, using in-memory fallback:', error.message);
      this.isConnected = false;
    }
  }

  /**
   * Generate cache key with namespace
   */
  generateKey(namespace, key) {
    const keyString = typeof key === 'object' ? JSON.stringify(key) : String(key);
    const hash = createHash('md5').update(keyString).digest('hex').substr(0, 8);
    return `blaze:${namespace}:${hash}`;
  }

  /**
   * Get cached value
   */
  async get(namespace, key) {
    const cacheKey = this.generateKey(namespace, key);
    
    try {
      if (this.isConnected && this.redis) {
        const value = await this.redis.get(cacheKey);
        if (value !== null) {
          this.stats.hits++;
          return JSON.parse(value);
        }
      } else {
        // Fallback to in-memory cache
        const value = this.fallbackCache.get(cacheKey);
        if (value && value.expires > Date.now()) {
          this.stats.hits++;
          return value.data;
        }
      }
      
      this.stats.misses++;
      return null;
      
    } catch (error) {
      console.warn('Redis get error:', error.message);
      this.stats.errors++;
      return null;
    }
  }

  /**
   * Set cached value with TTL
   */
  async set(namespace, key, value, ttlSeconds = 300) {
    const cacheKey = this.generateKey(namespace, key);
    const serialized = JSON.stringify(value);
    
    try {
      if (this.isConnected && this.redis) {
        await this.redis.setex(cacheKey, ttlSeconds, serialized);
      } else {
        // Fallback to in-memory cache with expiration
        this.fallbackCache.set(cacheKey, {
          data: value,
          expires: Date.now() + (ttlSeconds * 1000)
        });
        
        // Clean up expired entries (simple cleanup)
        if (this.fallbackCache.size > 100) {
          this.cleanupFallbackCache();
        }
      }
      
    } catch (error) {
      console.warn('Redis set error:', error.message);
      this.stats.errors++;
    }
  }

  /**
   * Delete cached value
   */
  async delete(namespace, key) {
    const cacheKey = this.generateKey(namespace, key);
    
    try {
      if (this.isConnected && this.redis) {
        await this.redis.del(cacheKey);
      } else {
        this.fallbackCache.delete(cacheKey);
      }
    } catch (error) {
      console.warn('Redis delete error:', error.message);
      this.stats.errors++;
    }
  }

  /**
   * Clear all cache entries for a namespace
   */
  async clearNamespace(namespace) {
    try {
      if (this.isConnected && this.redis) {
        const pattern = `blaze:${namespace}:*`;
        const keys = await this.redis.keys(pattern);
        if (keys.length > 0) {
          await this.redis.del(...keys);
        }
      } else {
        // Clear fallback cache for namespace
        const keysToDelete = [];
        for (const key of this.fallbackCache.keys()) {
          if (key.startsWith(`blaze:${namespace}:`)) {
            keysToDelete.push(key);
          }
        }
        keysToDelete.forEach(key => this.fallbackCache.delete(key));
      }
    } catch (error) {
      console.warn('Redis clear namespace error:', error.message);
      this.stats.errors++;
    }
  }

  /**
   * Cache with automatic refresh (stale-while-revalidate pattern)
   */
  async getOrSet(namespace, key, fetcher, ttlSeconds = 300, staleSeconds = 60) {
    const cached = await this.get(namespace, key);
    
    if (cached && cached.timestamp) {
      const age = (Date.now() - cached.timestamp) / 1000;
      
      // Return fresh data immediately
      if (age < ttlSeconds - staleSeconds) {
        return cached.data;
      }
      
      // Data is stale but not expired - return stale data and refresh in background
      if (age < ttlSeconds) {
        this.refreshInBackground(namespace, key, fetcher, ttlSeconds);
        return cached.data;
      }
    }
    
    // Data is expired or doesn't exist - fetch fresh data
    try {
      const freshData = await fetcher();
      const cacheValue = {
        data: freshData,
        timestamp: Date.now()
      };
      
      await this.set(namespace, key, cacheValue, ttlSeconds);
      return freshData;
      
    } catch (error) {
      // If fetch fails, return stale data if available
      if (cached && cached.data) {
        console.warn('Fetcher failed, returning stale data:', error.message);
        return cached.data;
      }
      throw error;
    }
  }

  /**
   * Refresh data in background
   */
  async refreshInBackground(namespace, key, fetcher, ttlSeconds) {
    try {
      const freshData = await fetcher();
      const cacheValue = {
        data: freshData,
        timestamp: Date.now()
      };
      
      await this.set(namespace, key, cacheValue, ttlSeconds);
    } catch (error) {
      console.warn('Background refresh failed:', error.message);
    }
  }

  /**
   * Clean up expired fallback cache entries
   */
  cleanupFallbackCache() {
    const now = Date.now();
    for (const [key, value] of this.fallbackCache.entries()) {
      if (value.expires < now) {
        this.fallbackCache.delete(key);
      }
    }
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const total = this.stats.hits + this.stats.misses;
    const hitRate = total > 0 ? (this.stats.hits / total * 100).toFixed(2) : 0;
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      isConnected: this.isConnected,
      fallbackSize: this.fallbackCache.size
    };
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      if (this.isConnected && this.redis) {
        const result = await this.redis.ping();
        return {
          status: 'healthy',
          connected: true,
          response: result,
          stats: this.getStats()
        };
      } else {
        return {
          status: 'degraded',
          connected: false,
          fallback: true,
          stats: this.getStats()
        };
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        connected: false,
        error: error.message,
        stats: this.getStats()
      };
    }
  }

  /**
   * Close Redis connection
   */
  async close() {
    if (this.redis) {
      await this.redis.quit();
    }
  }
}

export default RedisCacheLayer;