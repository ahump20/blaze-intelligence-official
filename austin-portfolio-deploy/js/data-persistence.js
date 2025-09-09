/**
 * Blaze Intelligence Data Persistence Layer
 * Handles local storage, IndexedDB, and cloud sync for data persistence
 */

class DataPersistence {
    constructor() {
        this.config = {
            dbName: 'BlazeIntelligenceDB',
            dbVersion: 1,
            stores: {
                teams: { keyPath: 'id', indexes: ['sport', 'league', 'name'] },
                players: { keyPath: 'id', indexes: ['teamId', 'position', 'name'] },
                games: { keyPath: 'id', indexes: ['date', 'homeTeam', 'awayTeam'] },
                analytics: { keyPath: 'id', indexes: ['type', 'timestamp', 'userId'] },
                cache: { keyPath: 'key', indexes: ['expires', 'type'] },
                userPreferences: { keyPath: 'key' },
                apiKeys: { keyPath: 'service' }
            },
            syncInterval: 5 * 60 * 1000, // 5 minutes
            maxStorageSize: 100 * 1024 * 1024, // 100MB
            compressionEnabled: true
        };

        this.db = null;
        this.syncQueue = [];
        this.localStorage = this.createLocalStorageWrapper();
        this.sessionStorage = this.createSessionStorageWrapper();
        
        this.init();
    }

    async init() {
        console.log('💾 Initializing Data Persistence Layer...');
        
        try {
            // Initialize IndexedDB
            await this.initIndexedDB();
            
            // Setup sync mechanism
            this.setupSync();
            
            // Monitor storage quota
            await this.checkStorageQuota();
            
            // Clean old data
            await this.cleanOldData();
            
            console.log('✅ Data persistence initialized');
        } catch (error) {
            console.error('Failed to initialize data persistence:', error);
            // Fall back to localStorage only
            this.useFallbackStorage();
        }
    }

    // IndexedDB initialization
    async initIndexedDB() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.config.dbName, this.config.dbVersion);
            
            request.onerror = () => {
                console.error('IndexedDB error:', request.error);
                reject(request.error);
            };
            
            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB connected');
                resolve();
            };
            
            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                
                // Create object stores
                Object.entries(this.config.stores).forEach(([storeName, config]) => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        const store = db.createObjectStore(storeName, { 
                            keyPath: config.keyPath,
                            autoIncrement: !config.keyPath
                        });
                        
                        // Create indexes
                        if (config.indexes) {
                            config.indexes.forEach(index => {
                                store.createIndex(index, index, { unique: false });
                            });
                        }
                        
                        console.log(`Created object store: ${storeName}`);
                    }
                });
            };
        });
    }

    // CRUD Operations
    async save(storeName, data) {
        if (!this.db) {
            return this.saveFallback(storeName, data);
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            
            // Add timestamp if not present
            if (!data.timestamp) {
                data.timestamp = Date.now();
            }
            
            // Compress data if enabled
            if (this.config.compressionEnabled) {
                data = this.compressData(data);
            }
            
            const request = store.put(data);
            
            request.onsuccess = () => {
                console.log(`✅ Saved to ${storeName}:`, data.id || data.key);
                
                // Add to sync queue
                this.addToSyncQueue('save', storeName, data);
                
                resolve(request.result);
            };
            
            request.onerror = () => {
                console.error(`Failed to save to ${storeName}:`, request.error);
                reject(request.error);
            };
        });
    }

    async get(storeName, key) {
        if (!this.db) {
            return this.getFallback(storeName, key);
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.get(key);
            
            request.onsuccess = () => {
                let data = request.result;
                
                // Decompress if needed
                if (data && this.config.compressionEnabled) {
                    data = this.decompressData(data);
                }
                
                resolve(data);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async getAll(storeName, indexName = null, query = null) {
        if (!this.db) {
            return this.getAllFallback(storeName);
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            
            let source = store;
            if (indexName) {
                source = store.index(indexName);
            }
            
            const request = query ? source.getAll(query) : source.getAll();
            
            request.onsuccess = () => {
                let results = request.result;
                
                // Decompress all results
                if (this.config.compressionEnabled) {
                    results = results.map(data => this.decompressData(data));
                }
                
                resolve(results);
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async delete(storeName, key) {
        if (!this.db) {
            return this.deleteFallback(storeName, key);
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.delete(key);
            
            request.onsuccess = () => {
                console.log(`🗑️ Deleted from ${storeName}:`, key);
                
                // Add to sync queue
                this.addToSyncQueue('delete', storeName, { key });
                
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    async clear(storeName) {
        if (!this.db) {
            return this.clearFallback(storeName);
        }
        
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.clear();
            
            request.onsuccess = () => {
                console.log(`🧹 Cleared store: ${storeName}`);
                resolve();
            };
            
            request.onerror = () => {
                reject(request.error);
            };
        });
    }

    // Cache management
    async saveToCache(key, data, ttl = 3600000) {
        const cacheEntry = {
            key,
            data,
            expires: Date.now() + ttl,
            type: typeof data,
            size: JSON.stringify(data).length
        };
        
        await this.save('cache', cacheEntry);
    }

    async getFromCache(key) {
        const entry = await this.get('cache', key);
        
        if (!entry) return null;
        
        // Check if expired
        if (entry.expires < Date.now()) {
            await this.delete('cache', key);
            return null;
        }
        
        return entry.data;
    }

    async cleanCache() {
        const allCache = await this.getAll('cache');
        const now = Date.now();
        let cleaned = 0;
        
        for (const entry of allCache) {
            if (entry.expires < now) {
                await this.delete('cache', entry.key);
                cleaned++;
            }
        }
        
        console.log(`🧹 Cleaned ${cleaned} expired cache entries`);
    }

    // User preferences
    async savePreference(key, value) {
        await this.save('userPreferences', { key, value, updated: Date.now() });
    }

    async getPreference(key, defaultValue = null) {
        const pref = await this.get('userPreferences', key);
        return pref ? pref.value : defaultValue;
    }

    async getAllPreferences() {
        const prefs = await this.getAll('userPreferences');
        const prefMap = {};
        
        prefs.forEach(pref => {
            prefMap[pref.key] = pref.value;
        });
        
        return prefMap;
    }

    // API key management (encrypted)
    async saveAPIKey(service, key) {
        const encrypted = this.encrypt(key);
        await this.save('apiKeys', { service, key: encrypted, added: Date.now() });
    }

    async getAPIKey(service) {
        const entry = await this.get('apiKeys', service);
        if (!entry) return null;
        
        return this.decrypt(entry.key);
    }

    async getAllAPIKeys() {
        const keys = await this.getAll('apiKeys');
        const keyMap = {};
        
        keys.forEach(entry => {
            keyMap[entry.service] = this.decrypt(entry.key);
        });
        
        return keyMap;
    }

    // Sync mechanism
    setupSync() {
        // Periodic sync
        setInterval(() => {
            this.syncToCloud();
        }, this.config.syncInterval);
        
        // Sync on visibility change
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden) {
                this.syncToCloud();
            }
        });
        
        // Sync on online
        window.addEventListener('online', () => {
            this.syncToCloud();
        });
    }

    addToSyncQueue(operation, storeName, data) {
        this.syncQueue.push({
            operation,
            storeName,
            data,
            timestamp: Date.now()
        });
        
        // Limit queue size
        if (this.syncQueue.length > 1000) {
            this.syncQueue = this.syncQueue.slice(-500);
        }
    }

    async syncToCloud() {
        if (this.syncQueue.length === 0) return;
        
        console.log(`☁️ Syncing ${this.syncQueue.length} operations to cloud...`);
        
        try {
            // In production, send to cloud endpoint
            const response = await fetch('https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-User-Id': this.getUserId()
                },
                body: JSON.stringify({
                    operations: this.syncQueue,
                    timestamp: Date.now()
                })
            });
            
            if (response.ok) {
                console.log('✅ Sync successful');
                this.syncQueue = [];
            }
        } catch (error) {
            console.warn('Sync failed, will retry:', error);
        }
    }

    // Storage management
    async checkStorageQuota() {
        if ('storage' in navigator && 'estimate' in navigator.storage) {
            const estimate = await navigator.storage.estimate();
            const percentUsed = (estimate.usage / estimate.quota) * 100;
            
            console.log(`💾 Storage: ${this.formatBytes(estimate.usage)} / ${this.formatBytes(estimate.quota)} (${percentUsed.toFixed(2)}%)`);
            
            if (percentUsed > 90) {
                console.warn('⚠️ Storage usage above 90%, cleaning old data...');
                await this.cleanOldData();
            }
            
            return estimate;
        }
    }

    async cleanOldData() {
        const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
        
        // Clean old analytics
        const analytics = await this.getAll('analytics');
        for (const entry of analytics) {
            if (entry.timestamp < thirtyDaysAgo) {
                await this.delete('analytics', entry.id);
            }
        }
        
        // Clean old games
        const games = await this.getAll('games');
        for (const game of games) {
            if (game.timestamp < thirtyDaysAgo) {
                await this.delete('games', game.id);
            }
        }
        
        // Clean cache
        await this.cleanCache();
        
        console.log('✅ Old data cleaned');
    }

    // Compression
    compressData(data) {
        if (typeof data !== 'object') return data;
        
        const jsonString = JSON.stringify(data);
        
        // Simple compression using LZ-string if available
        if (typeof LZString !== 'undefined') {
            return {
                compressed: true,
                data: LZString.compress(jsonString)
            };
        }
        
        return data;
    }

    decompressData(data) {
        if (!data || !data.compressed) return data;
        
        if (typeof LZString !== 'undefined') {
            const jsonString = LZString.decompress(data.data);
            return JSON.parse(jsonString);
        }
        
        return data;
    }

    // Encryption (simple XOR for demo - use proper encryption in production)
    encrypt(text) {
        const key = 'BlazeIntelligence2025';
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        
        return btoa(result); // Base64 encode
    }

    decrypt(encrypted) {
        const key = 'BlazeIntelligence2025';
        const text = atob(encrypted); // Base64 decode
        let result = '';
        
        for (let i = 0; i < text.length; i++) {
            result += String.fromCharCode(text.charCodeAt(i) ^ key.charCodeAt(i % key.length));
        }
        
        return result;
    }

    // Fallback storage (localStorage)
    useFallbackStorage() {
        console.log('⚠️ Using localStorage fallback');
        this.db = null;
    }

    saveFallback(storeName, data) {
        const key = `blaze_${storeName}_${data.id || data.key || Date.now()}`;
        localStorage.setItem(key, JSON.stringify(data));
        return Promise.resolve(key);
    }

    getFallback(storeName, key) {
        const fullKey = `blaze_${storeName}_${key}`;
        const data = localStorage.getItem(fullKey);
        return Promise.resolve(data ? JSON.parse(data) : null);
    }

    getAllFallback(storeName) {
        const results = [];
        const prefix = `blaze_${storeName}_`;
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                const data = localStorage.getItem(key);
                if (data) {
                    results.push(JSON.parse(data));
                }
            }
        }
        
        return Promise.resolve(results);
    }

    deleteFallback(storeName, key) {
        const fullKey = `blaze_${storeName}_${key}`;
        localStorage.removeItem(fullKey);
        return Promise.resolve();
    }

    clearFallback(storeName) {
        const prefix = `blaze_${storeName}_`;
        const keysToRemove = [];
        
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key.startsWith(prefix)) {
                keysToRemove.push(key);
            }
        }
        
        keysToRemove.forEach(key => localStorage.removeItem(key));
        return Promise.resolve();
    }

    // Storage wrappers
    createLocalStorageWrapper() {
        return {
            setItem: (key, value) => {
                try {
                    localStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e) {
                    console.error('localStorage error:', e);
                    return false;
                }
            },
            getItem: (key) => {
                try {
                    const item = localStorage.getItem(key);
                    return item ? JSON.parse(item) : null;
                } catch (e) {
                    return localStorage.getItem(key);
                }
            },
            removeItem: (key) => localStorage.removeItem(key),
            clear: () => localStorage.clear(),
            length: () => localStorage.length
        };
    }

    createSessionStorageWrapper() {
        return {
            setItem: (key, value) => {
                try {
                    sessionStorage.setItem(key, JSON.stringify(value));
                    return true;
                } catch (e) {
                    console.error('sessionStorage error:', e);
                    return false;
                }
            },
            getItem: (key) => {
                try {
                    const item = sessionStorage.getItem(key);
                    return item ? JSON.parse(item) : null;
                } catch (e) {
                    return sessionStorage.getItem(key);
                }
            },
            removeItem: (key) => sessionStorage.removeItem(key),
            clear: () => sessionStorage.clear(),
            length: () => sessionStorage.length
        };
    }

    // Utility methods
    getUserId() {
        let userId = this.localStorage.getItem('blaze_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            this.localStorage.setItem('blaze_user_id', userId);
        }
        return userId;
    }

    formatBytes(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // Export/Import functionality
    async exportData() {
        const data = {
            teams: await this.getAll('teams'),
            players: await this.getAll('players'),
            games: await this.getAll('games'),
            preferences: await this.getAllPreferences(),
            timestamp: Date.now(),
            version: this.config.dbVersion
        };
        
        const blob = new Blob([JSON.stringify(data, null, 2)], { 
            type: 'application/json' 
        });
        
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `blaze_intelligence_backup_${Date.now()}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
        
        console.log('📦 Data exported successfully');
    }

    async importData(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    // Import teams
                    if (data.teams) {
                        for (const team of data.teams) {
                            await this.save('teams', team);
                        }
                    }
                    
                    // Import players
                    if (data.players) {
                        for (const player of data.players) {
                            await this.save('players', player);
                        }
                    }
                    
                    // Import games
                    if (data.games) {
                        for (const game of data.games) {
                            await this.save('games', game);
                        }
                    }
                    
                    // Import preferences
                    if (data.preferences) {
                        for (const [key, value] of Object.entries(data.preferences)) {
                            await this.savePreference(key, value);
                        }
                    }
                    
                    console.log('📥 Data imported successfully');
                    resolve();
                } catch (error) {
                    console.error('Import failed:', error);
                    reject(error);
                }
            };
            
            reader.readAsText(file);
        });
    }
}

// Global instance
let dataPersistence;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    // Initialize immediately
    dataPersistence = new DataPersistence();
    window.dataPersistence = dataPersistence;
    
    // Additional setup after DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('💾 Data Persistence ready');
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = DataPersistence;
}