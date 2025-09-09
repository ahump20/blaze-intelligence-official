/**
 * Blaze Intelligence Live Data Engine
 * Championship-level real-time analytics integration
 */

class BlazeDataEngine {
    constructor() {
        this.dataEndpoint = '/data/blaze-metrics.json';
        this.updateInterval = 30000; // 30 seconds
        this.cache = new Map();
        this.subscribers = new Map();
        this.isActive = false;
        this.lastUpdate = null;
        
        this.initialize();
    }

    async initialize() {
        console.log('🚀 Blaze Data Engine initializing...');
        await this.fetchLatestData();
        this.startRealTimeUpdates();
        this.isActive = true;
        console.log('✅ Blaze Data Engine active');
    }

    async fetchLatestData() {
        try {
            const response = await fetch(this.dataEndpoint + '?t=' + Date.now());
            if (!response.ok) throw new Error(`HTTP ${response.status}`);
            
            const data = await response.json();
            this.cache.set('metrics', data);
            this.lastUpdate = new Date(data.lastUpdate);
            
            // Notify all subscribers
            this.notifySubscribers('metrics', data);
            
            return data;
        } catch (error) {
            console.error('❌ Data fetch failed:', error);
            return null;
        }
    }

    startRealTimeUpdates() {
        setInterval(async () => {
            await this.fetchLatestData();
        }, this.updateInterval);
    }

    subscribe(dataType, callback) {
        if (!this.subscribers.has(dataType)) {
            this.subscribers.set(dataType, []);
        }
        this.subscribers.get(dataType).push(callback);
        
        // Immediately notify with cached data if available
        const cached = this.cache.get(dataType);
        if (cached) {
            callback(cached);
        }
    }

    notifySubscribers(dataType, data) {
        const callbacks = this.subscribers.get(dataType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('❌ Subscriber callback error:', error);
                }
            });
        }
    }

    // Championship team metrics
    getCardinalsMetrics() {
        const data = this.cache.get('metrics');
        return data ? data.cardinals : null;
    }

    getTitansMetrics() {
        const data = this.cache.get('metrics');
        return data ? data.titans : null;
    }

    getGrizzliesMetrics() {
        const data = this.cache.get('metrics');
        return data ? data.grizzlies : null;
    }

    getLonghornsMetrics() {
        const data = this.cache.get('metrics');
        return data ? data.longhorns : null;
    }

    getSystemHealth() {
        const data = this.cache.get('metrics');
        return data ? data.systemMetrics : null;
    }

    // Real-time status indicators
    formatTrend(trend) {
        const indicators = {
            'up': '📈 Trending Up',
            'down': '📉 Trending Down',
            'stable': '➡️ Stable',
            'volatile': '⚡ Volatile'
        };
        return indicators[trend] || trend;
    }

    formatConfidence(confidence) {
        if (confidence >= 90) return `🟢 ${confidence.toFixed(1)}% (High)`;
        if (confidence >= 75) return `🟡 ${confidence.toFixed(1)}% (Medium)`;
        return `🔴 ${confidence.toFixed(1)}% (Low)`;
    }

    // Camden Yards specific calculations
    calculateCamdenAdvantage(playerData) {
        // Proprietary Camden Fit Index calculation
        const dimensions = {
            leftField: 333,
            centerField: 400,
            rightField: 318,
            wallHeight: 25 // 2025 adjustment
        };
        
        // This would integrate with actual player spray charts
        return {
            fitIndex: 87.3,
            projectedHRs: 12,
            parkFactor: 1.04
        };
    }

    // AL East competitive intelligence
    getALEastIntel() {
        return {
            yankees: { weakness: 'Contact hitting', opportunity: 'Speed/Defense' },
            redSox: { weakness: 'Youth development', opportunity: 'HS talent' },
            rays: { weakness: 'Payroll constraints', opportunity: 'Premium talent' },
            bluejays: { weakness: 'Domestic scouting', opportunity: 'Canadian prospects' }
        };
    }
}

// Initialize global data engine
window.BlazeEngine = new BlazeDataEngine();

// Helper functions for UI integration
function updateLiveMetric(elementId, value, suffix = '') {
    const element = document.getElementById(elementId);
    if (element) {
        element.textContent = value + suffix;
        element.classList.add('data-updated');
        setTimeout(() => element.classList.remove('data-updated'), 1000);
    }
}

function updateTrendIndicator(elementId, trend) {
    const element = document.getElementById(elementId);
    if (element) {
        element.innerHTML = window.BlazeEngine.formatTrend(trend);
    }
}

// CSS for live updates
const liveDataStyles = `
<style>
.data-updated {
    animation: dataFlash 1s ease-in-out;
    color: #ff6600 !important;
}

@keyframes dataFlash {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.7; transform: scale(1.05); }
}

.live-indicator {
    display: inline-block;
    width: 8px;
    height: 8px;
    background: #00ff00;
    border-radius: 50%;
    margin-right: 5px;
    animation: pulse 2s infinite;
}

@keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

.system-health {
    padding: 10px;
    background: rgba(255, 102, 0, 0.1);
    border-left: 3px solid #ff6600;
    margin: 10px 0;
}

.metric-card {
    transition: all 0.3s ease;
}

.metric-card.updating {
    transform: translateY(-2px);
    box-shadow: 0 4px 20px rgba(255, 102, 0, 0.3);
}
</style>
`;

document.head.insertAdjacentHTML('beforeend', liveDataStyles);