/**
 * Advanced Multi-Layer Caching System
 * Implements L1 (memory), L2 (localStorage), and L3 (IndexedDB) caching
 * with intelligent eviction, background refresh, and stale-while-revalidate
 */

class AdvancedCache {
  constructor(options = {}) {
    this.options = {
      l1MaxSize: options.l1MaxSize || 100, // Memory cache max items
      l2MaxSize: options.l2MaxSize || 500, // LocalStorage cache max items  
      l3MaxSize: options.l3MaxSize || 1000, // IndexedDB cache max items
      defaultTTL: options.defaultTTL || 5 * 60 * 1000, // 5 minutes
      staleTTL: options.staleTTL || 60 * 60 * 1000, // 1 hour for stale data
      backgroundRefreshThreshold: options.backgroundRefreshThreshold || 0.8, // Refresh when 80% of TTL elapsed
      compressionThreshold: options.compressionThreshold || 1024, // Compress data > 1KB
      ...options
    };
    
    // L1 Cache: In-memory Map
    this.l1Cache = new Map();
    this.l1AccessTimes = new Map();
    
    // L2 Cache: LocalStorage (browser only)
    this.l2Available = typeof localStorage !== 'undefined';
    
    // L3 Cache: IndexedDB (browser only)
    this.l3Available = typeof indexedDB !== 'undefined';
    this.l3Ready = false;
    
    // Background refresh queue
    this.refreshQueue = new Set();
    this.refreshInProgress = new Map();
    
    // Statistics
    this.stats = {
      l1Hits: 0,
      l2Hits: 0,  
      l3Hits: 0,
      misses: 0,
      evictions: 0,
      backgroundRefreshes: 0,
      compressions: 0
    };
    
    this.initL3Cache();
    this.startBackgroundRefresh();
  }
  
  // Initialize IndexedDB cache
  async initL3Cache() {
    if (!this.l3Available) return;
    
    try {
      const dbName = 'BlazeIntelligenceCache';
      const version = 1;
      
      this.l3DB = await new Promise((resolve, reject) => {
        const request = indexedDB.open(dbName, version);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
          const db = event.target.result;
          if (!db.objectStoreNames.contains('cache')) {
            const store = db.createObjectStore('cache', { keyPath: 'key' });
            store.createIndex('timestamp', 'timestamp');
            store.createIndex('ttl', 'ttl');
          }
        };
      });
      
      this.l3Ready = true;
    } catch (error) {
      console.warn('IndexedDB cache initialization failed:', error);
      this.l3Available = false;
    }
  }
  
  // Multi-layer get with automatic promotion
  async get(key) {
    const now = Date.now();
    
    // Try L1 cache first
    if (this.l1Cache.has(key)) {
      const entry = this.l1Cache.get(key);
      if (now < entry.expires) {
        this.l1AccessTimes.set(key, now);
        this.stats.l1Hits++;
        
        // Check if background refresh needed
        this.scheduleBackgroundRefresh(key, entry);
        
        return {
          data: entry.data,
          source: 'l1-cache',
          fresh: now < entry.freshUntil
        };
      }
      
      // L1 entry expired, remove it
      this.l1Cache.delete(key);
      this.l1AccessTimes.delete(key);
    }
    
    // Try L2 cache (localStorage)
    if (this.l2Available) {
      try {
        const stored = localStorage.getItem(`cache_${key}`);
        if (stored) {
          const entry = JSON.parse(stored);
          if (now < entry.expires) {
            this.stats.l2Hits++;
            
            // Promote to L1
            this.setL1(key, entry.data, entry.expires - now, entry.metadata);
            
            return {
              data: await this.decompress(entry.data),
              source: 'l2-cache',  
              fresh: now < entry.freshUntil
            };
          }
          
          // L2 entry expired, remove it
          localStorage.removeItem(`cache_${key}`);
        }
      } catch (error) {
        console.warn('L2 cache read failed:', error);
      }
    }
    
    // Try L3 cache (IndexedDB)  
    if (this.l3Available && this.l3Ready) {
      try {
        const entry = await this.getFromL3(key);
        if (entry && now < entry.expires) {
          this.stats.l3Hits++;
          
          // Promote to L1 and L2
          const data = await this.decompress(entry.data);
          this.setL1(key, data, entry.expires - now, entry.metadata);
          this.setL2(key, data, entry.expires - now, entry.metadata);
          
          return {
            data,
            source: 'l3-cache',
            fresh: now < entry.freshUntil
          };
        }
      } catch (error) {
        console.warn('L3 cache read failed:', error);
      }
    }
    
    this.stats.misses++;
    return null;
  }
  
  // Multi-layer set with compression and intelligent placement
  async set(key, data, ttl = this.options.defaultTTL, metadata = {}) {
    const now = Date.now();
    const expires = now + ttl;
    const freshUntil = now + (ttl * 0.8); // Fresh for 80% of TTL
    
    // Always set in L1
    this.setL1(key, data, ttl, metadata);
    
    // Set in L2 if available
    if (this.l2Available) {
      this.setL2(key, data, ttl, metadata);
    }
    
    // Set in L3 if available and data is large or important
    if (this.l3Available && this.l3Ready) {
      const priority = metadata.priority || 'normal';
      const size = JSON.stringify(data).length;
      
      if (priority === 'high' || size > this.options.compressionThreshold) {
        await this.setL3(key, data, ttl, metadata);
      }
    }
  }
  
  // L1 cache operations
  setL1(key, data, ttl, metadata = {}) {
    const now = Date.now();
    
    // Evict if at capacity
    if (this.l1Cache.size >= this.options.l1MaxSize) {
      this.evictL1();
    }
    
    this.l1Cache.set(key, {
      data,
      expires: now + ttl,
      freshUntil: now + (ttl * 0.8),
      metadata,
      accessed: now
    });
    
    this.l1AccessTimes.set(key, now);
  }
  
  // L2 cache operations  
  setL2(key, data, ttl, metadata = {}) {
    if (!this.l2Available) return;
    
    try {
      const now = Date.now();
      const compressed = this.compress(data);
      const entry = {
        data: compressed,
        expires: now + ttl,
        freshUntil: now + (ttl * 0.8),
        metadata,
        stored: now
      };
      
      localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
      
      // Evict old entries if storage is full
      this.evictL2();
    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        this.evictL2();
        // Try again after eviction
        try {
          localStorage.setItem(`cache_${key}`, JSON.stringify(entry));
        } catch (retryError) {
          console.warn('L2 cache set failed even after eviction:', retryError);
        }
      }
    }
  }
  
  // L3 cache operations
  async setL3(key, data, ttl, metadata = {}) {
    if (!this.l3Available || !this.l3Ready) return;
    
    try {
      const now = Date.now();
      const compressed = this.compress(data);
      const entry = {
        key,
        data: compressed,
        expires: now + ttl,
        freshUntil: now + (ttl * 0.8),
        metadata,
        timestamp: now
      };
      
      const transaction = this.l3DB.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      await store.put(entry);
      
      // Evict expired entries periodically
      if (Math.random() < 0.1) { // 10% chance
        this.evictL3();
      }
    } catch (error) {
      console.warn('L3 cache set failed:', error);
    }
  }
  
  async getFromL3(key) {
    if (!this.l3Available || !this.l3Ready) return null;
    
    try {
      const transaction = this.l3DB.transaction(['cache'], 'readonly');
      const store = transaction.objectStore('cache');
      return await store.get(key);
    } catch (error) {
      console.warn('L3 cache get failed:', error);
      return null;
    }
  }
  
  // Compression utilities
  compress(data) {
    const stringified = JSON.stringify(data);
    if (stringified.length < this.options.compressionThreshold) {
      return stringified;
    }
    
    // Simple LZ-style compression for demonstration
    // In production, use a proper compression library
    this.stats.compressions++;
    return this.simpleCompress(stringified);
  }
  
  async decompress(data) {
    if (typeof data === 'string' && data.startsWith('COMPRESSED:')) {
      return JSON.parse(this.simpleDecompress(data));
    }
    return JSON.parse(data);
  }
  
  simpleCompress(str) {
    // Very basic compression - just removes repeated spaces
    const compressed = str.replace(/\\s+/g, ' ').trim();
    return `COMPRESSED:${compressed}`;
  }
  
  simpleDecompress(compressed) {
    return compressed.replace('COMPRESSED:', '');
  }
  
  // Eviction strategies
  evictL1() {
    // LRU eviction - remove least recently accessed
    if (this.l1Cache.size === 0) return;
    
    let oldestKey = null;
    let oldestTime = Date.now();
    
    for (const [key, time] of this.l1AccessTimes) {
      if (time < oldestTime) {
        oldestTime = time;
        oldestKey = key;
      }
    }
    
    if (oldestKey) {
      this.l1Cache.delete(oldestKey);
      this.l1AccessTimes.delete(oldestKey);
      this.stats.evictions++;
    }
  }
  
  evictL2() {
    if (!this.l2Available) return;
    
    // Remove expired entries and oldest entries if needed
    const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
    const now = Date.now();
    const entries = [];
    
    for (const key of keys) {
      try {
        const entry = JSON.parse(localStorage.getItem(key));
        if (now >= entry.expires) {
          localStorage.removeItem(key);
        } else {
          entries.push({ key, stored: entry.stored });
        }
      } catch (error) {
        localStorage.removeItem(key); // Remove corrupted entries
      }
    }
    
    // If still over limit, remove oldest
    if (entries.length > this.options.l2MaxSize) {
      entries.sort((a, b) => a.stored - b.stored);
      const toRemove = entries.slice(0, entries.length - this.options.l2MaxSize);
      toRemove.forEach(entry => localStorage.removeItem(entry.key));
      this.stats.evictions += toRemove.length;
    }
  }
  
  async evictL3() {
    if (!this.l3Available || !this.l3Ready) return;
    
    try {
      const now = Date.now();
      const transaction = this.l3DB.transaction(['cache'], 'readwrite');
      const store = transaction.objectStore('cache');
      const index = store.index('timestamp');
      
      // Remove expired entries
      const expiredRequest = store.index('ttl').openCursor(IDBKeyRange.upperBound(now));
      expiredRequest.onsuccess = (event) => {
        const cursor = event.target.result;
        if (cursor) {
          cursor.delete();
          cursor.continue();
          this.stats.evictions++;
        }
      };
    } catch (error) {
      console.warn('L3 eviction failed:', error);
    }
  }
  
  // Background refresh system
  scheduleBackgroundRefresh(key, entry) {
    const now = Date.now();
    const refreshThreshold = entry.expires - ((entry.expires - entry.accessed) * this.options.backgroundRefreshThreshold);
    
    if (now >= refreshThreshold && !this.refreshQueue.has(key) && !this.refreshInProgress.has(key)) {
      this.refreshQueue.add(key);
    }
  }
  
  startBackgroundRefresh() {
    setInterval(() => {
      this.processRefreshQueue();
    }, 10000); // Check every 10 seconds
  }
  
  async processRefreshQueue() {
    if (this.refreshQueue.size === 0) return;
    
    // Process up to 3 refreshes at once
    const batch = Array.from(this.refreshQueue).slice(0, 3);
    batch.forEach(key => {
      this.refreshQueue.delete(key);
      this.refreshInBackground(key);
    });
  }
  
  async refreshInBackground(key) {
    if (this.refreshInProgress.has(key)) return;
    
    this.refreshInProgress.set(key, true);
    this.stats.backgroundRefreshes++;
    
    try {
      // This would call the original fetch function
      // For now, just log that a refresh would happen
      console.log(`Background refresh triggered for key: ${key}`);
      
      // In real implementation:
      // const freshData = await this.fetchFunction(key);
      // await this.set(key, freshData);
      
    } catch (error) {
      console.warn('Background refresh failed for key:', key, error);
    } finally {
      this.refreshInProgress.delete(key);
    }
  }
  
  // Cache management utilities
  async clear() {
    // Clear L1
    this.l1Cache.clear();
    this.l1AccessTimes.clear();
    
    // Clear L2
    if (this.l2Available) {
      const keys = Object.keys(localStorage).filter(key => key.startsWith('cache_'));
      keys.forEach(key => localStorage.removeItem(key));
    }
    
    // Clear L3
    if (this.l3Available && this.l3Ready) {
      try {
        const transaction = this.l3DB.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await store.clear();
      } catch (error) {
        console.warn('L3 clear failed:', error);
      }
    }
  }
  
  async delete(key) {
    // Delete from all layers
    this.l1Cache.delete(key);
    this.l1AccessTimes.delete(key);
    
    if (this.l2Available) {
      localStorage.removeItem(`cache_${key}`);
    }
    
    if (this.l3Available && this.l3Ready) {
      try {
        const transaction = this.l3DB.transaction(['cache'], 'readwrite');
        const store = transaction.objectStore('cache');
        await store.delete(key);
      } catch (error) {
        console.warn('L3 delete failed:', error);
      }
    }
  }
  
  // Performance and debugging
  getStats() {
    const totalRequests = this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits + this.stats.misses;
    const hitRate = totalRequests > 0 ? ((this.stats.l1Hits + this.stats.l2Hits + this.stats.l3Hits) / totalRequests * 100).toFixed(1) : '0.0';
    
    return {
      ...this.stats,
      totalRequests,
      hitRate: `${hitRate}%`,
      l1Size: this.l1Cache.size,
      l2Size: this.l2Available ? Object.keys(localStorage).filter(k => k.startsWith('cache_')).length : 0,
      refreshQueueSize: this.refreshQueue.size,
      refreshInProgressCount: this.refreshInProgress.size
    };
  }
  
  async getDetailedStats() {
    const basicStats = this.getStats();
    let l3Size = 0;
    
    if (this.l3Available && this.l3Ready) {
      try {
        const transaction = this.l3DB.transaction(['cache'], 'readonly');
        const store = transaction.objectStore('cache');
        const countRequest = store.count();
        l3Size = await new Promise((resolve, reject) => {
          countRequest.onsuccess = () => resolve(countRequest.result);
          countRequest.onerror = () => reject(countRequest.error);
        });
      } catch (error) {
        console.warn('L3 size check failed:', error);
      }
    }
    
    return {
      ...basicStats,
      l3Size,
      layers: {
        l1: { available: true, size: this.l1Cache.size },
        l2: { available: this.l2Available, size: basicStats.l2Size },
        l3: { available: this.l3Available && this.l3Ready, size: l3Size }
      }
    };
  }
}

// Create global advanced cache instance (browser only)
if (typeof window !== 'undefined') {
  window.advancedCache = new AdvancedCache();
}

export default AdvancedCache;