/**
 * Blaze Intelligence R2 Storage Integration
 * Handles data fetching from R2 storage backend
 */

class BlazeR2Storage {
    constructor() {
        this.baseUrl = 'https://blaze-storage.humphrey-austin20.workers.dev/api';
        this.cache = new Map();
        this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
    }

    // Fetch data from R2 storage
    async fetchData(sport, dataset) {
        const cacheKey = `${sport}/${dataset}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(`${this.baseUrl}/data/${sport}/${dataset}`);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Cache successful results
            if (result.data) {
                this.cache.set(cacheKey, {
                    data: result,
                    timestamp: Date.now()
                });
            }

            return result;
        } catch (error) {
            console.warn(`R2 Storage Error for ${sport}/${dataset}:`, error);
            
            // Return fallback data structure
            return {
                error: error.message,
                fallback: true,
                data: this.getFallbackData(sport, dataset)
            };
        }
    }

    // Store data to R2
    async storeData(sport, dataset, data) {
        try {
            const response = await fetch(`${this.baseUrl}/data/${sport}/${dataset}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const result = await response.json();
            
            // Clear cache for this dataset
            const cacheKey = `${sport}/${dataset}`;
            this.cache.delete(cacheKey);

            return result;
        } catch (error) {
            console.error(`R2 Storage Store Error for ${sport}/${dataset}:`, error);
            throw error;
        }
    }

    // Get fallback data when R2 is unavailable
    getFallbackData(sport, dataset) {
        const fallbacks = {
            'mlb/cardinals': {
                roster: [
                    { name: 'Paul Goldschmidt', position: '1B', avg: '.317', ops: '.891' },
                    { name: 'Nolan Arenado', position: '3B', avg: '.293', ops: '.824' }
                ],
                status: 'Development - Sample Data',
                lastUpdated: new Date().toISOString()
            },
            'nfl/titans': {
                roster: [
                    { name: 'Will Levis', position: 'QB', completionPct: 62.1 },
                    { name: 'Derrick Henry', position: 'RB', rushingYards: 1234 }
                ],
                status: 'Development - Sample Data',
                lastUpdated: new Date().toISOString()
            },
            'cfb/longhorns': {
                stats: {
                    wins: 8,
                    losses: 2,
                    rank: 15,
                    status: 'Development - Sample Data'
                },
                lastUpdated: new Date().toISOString()
            },
            'general/blaze-metrics': {
                systemStatus: 'Development',
                dataPoints: 'Growing',
                accuracy: 'Beta Phase',
                uptime: '99.9%',
                lastUpdated: new Date().toISOString()
            }
        };

        return fallbacks[`${sport}/${dataset}`] || {
            message: 'No fallback data available',
            sport,
            dataset,
            status: 'Development Phase'
        };
    }

    // Health check
    async healthCheck() {
        try {
            const response = await fetch(`${this.baseUrl}/health`);
            return await response.json();
        } catch (error) {
            return {
                status: 'error',
                message: error.message,
                service: 'blaze-intelligence-storage'
            };
        }
    }

    // Clear all cached data
    clearCache() {
        this.cache.clear();
        console.log('R2 Storage cache cleared');
    }

    // Get cache statistics
    getCacheStats() {
        return {
            size: this.cache.size,
            keys: Array.from(this.cache.keys()),
            timeout: this.cacheTimeout
        };
    }
}

// Global instance
const BlazeStorage = new BlazeR2Storage();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeR2Storage;
}

// Make available globally
window.BlazeStorage = BlazeStorage;