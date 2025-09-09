// Cache layer for sports data
import NodeCache from 'node-cache';

class DataCache {
    constructor(ttlSeconds = 300) { // 5 minutes default
        this.cache = new NodeCache({ 
            stdTTL: ttlSeconds, 
            checkperiod: ttlSeconds * 0.2,
            useClones: false 
        });
        this.hits = 0;
        this.misses = 0;
    }

    get(key) {
        const value = this.cache.get(key);
        if (value) {
            this.hits++;
            console.log(`Cache hit for ${key} (hit rate: ${this.getHitRate()}%)`);
            return value;
        }
        this.misses++;
        console.log(`Cache miss for ${key} (hit rate: ${this.getHitRate()}%)`);
        return undefined;
    }

    set(key, value, ttl) {
        return this.cache.set(key, value, ttl);
    }

    del(keys) {
        return this.cache.del(keys);
    }

    flush() {
        return this.cache.flushAll();
    }

    getStats() {
        return {
            keys: this.cache.keys(),
            hits: this.hits,
            misses: this.misses,
            hitRate: this.getHitRate(),
            ...this.cache.getStats()
        };
    }

    getHitRate() {
        const total = this.hits + this.misses;
        return total === 0 ? 0 : Math.round((this.hits / total) * 100);
    }

    // Stale-while-revalidate pattern
    async getOrFetch(key, fetchFn, options = {}) {
        const { ttl = 300, staleTime = 60 } = options;
        
        // Try to get from cache
        const cached = this.get(key);
        if (cached) {
            // Check if data is still fresh
            if (cached.timestamp && Date.now() - cached.timestamp < ttl * 1000) {
                return cached.data;
            }
            
            // Data is stale but still returnable
            if (cached.timestamp && Date.now() - cached.timestamp < (ttl + staleTime) * 1000) {
                // Return stale data and refresh in background
                this.refreshInBackground(key, fetchFn, ttl);
                return { ...cached.data, stale: true };
            }
        }

        // No cache or too old, fetch fresh data
        try {
            const freshData = await fetchFn();
            this.set(key, {
                data: freshData,
                timestamp: Date.now()
            }, ttl);
            return freshData;
        } catch (error) {
            // If fetch fails and we have stale data, return it
            if (cached) {
                console.warn(`Failed to fetch fresh data for ${key}, returning stale data`);
                return { ...cached.data, stale: true, error: true };
            }
            throw error;
        }
    }

    async refreshInBackground(key, fetchFn, ttl) {
        try {
            const freshData = await fetchFn();
            this.set(key, {
                data: freshData,
                timestamp: Date.now()
            }, ttl);
            console.log(`Background refresh successful for ${key}`);
        } catch (error) {
            console.error(`Background refresh failed for ${key}:`, error);
        }
    }
}

// Export singleton instance
export default new DataCache(process.env.CACHE_TTL || 300);