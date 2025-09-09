// Performance Optimization Fixes for Blaze Intelligence
// Addresses polling intervals, caching, lazy loading, and error handling

class PerformanceOptimizer {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 300000; // 300s = 5 minutes as specified
        this.minPollingInterval = 300000; // 5 minutes minimum
        this.debounceTimers = new Map();
        this.activeIntervals = new Set();
    }

    // Fix all setInterval calls to use proper error handling and longer intervals
    optimizePollingIntervals() {
        // Override setInterval globally to enforce minimum intervals and error handling
        const originalSetInterval = window.setInterval;
        
        window.setInterval = (callback, interval, ...args) => {
            // Enforce minimum 5-minute intervals for auto-sync operations
            const adjustedInterval = Math.max(interval, this.minPollingInterval);
            
            // Wrap callback with error handling
            const wrappedCallback = async () => {
                try {
                    await callback.apply(this, args);
                } catch (error) {
                    console.warn('Polling interval error caught and suppressed:', error);
                }
            };
            
            const intervalId = originalSetInterval(wrappedCallback, adjustedInterval);
            this.activeIntervals.add(intervalId);
            return intervalId;
        };

        // Override clearInterval to track cleanup
        const originalClearInterval = window.clearInterval;
        window.clearInterval = (intervalId) => {
            this.activeIntervals.delete(intervalId);
            return originalClearInterval(intervalId);
        };
    }

    // Implement debounced UI refresh
    debounceUIRefresh(key, callback, delay = 1000) {
        if (this.debounceTimers.has(key)) {
            clearTimeout(this.debounceTimers.get(key));
        }
        
        const timer = setTimeout(async () => {
            try {
                await callback();
            } catch (error) {
                console.warn('Debounced UI refresh error:', error);
            }
            this.debounceTimers.delete(key);
        }, delay);
        
        this.debounceTimers.set(key, timer);
    }

    // Enhanced API response caching with 300s TTL
    async cachedFetch(url, options = {}) {
        const cacheKey = `${url}_${JSON.stringify(options)}`;
        
        // Check cache first
        if (this.cache.has(cacheKey)) {
            const cached = this.cache.get(cacheKey);
            if (Date.now() - cached.timestamp < this.cacheTimeout) {
                return cached.data;
            }
        }

        try {
            const response = await fetch(url, {
                signal: AbortSignal.timeout(10000), // 10s timeout
                ...options
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            
            // Cache successful responses
            this.cache.set(cacheKey, {
                data,
                timestamp: Date.now()
            });

            return data;
        } catch (error) {
            // Return cached data if available, even if stale
            if (this.cache.has(cacheKey)) {
                console.warn('Using stale cached data due to fetch error:', error);
                return this.cache.get(cacheKey).data;
            }
            throw error;
        }
    }

    // Lazy load Three.js sections below the fold
    setupLazyLoading() {
        const observerOptions = {
            rootMargin: '50px 0px',
            threshold: 0.1
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const element = entry.target;
                    
                    // Lazy load Three.js visualizations
                    if (element.classList.contains('three-viz-container') && !element.dataset.loaded) {
                        this.loadThreeJsVisualization(element);
                        element.dataset.loaded = 'true';
                    }
                    
                    // Lazy load heavy charts
                    if (element.classList.contains('chart-container') && !element.dataset.loaded) {
                        this.loadChartVisualization(element);
                        element.dataset.loaded = 'true';
                    }
                }
            });
        }, observerOptions);

        // Observe all heavy elements below the fold
        document.querySelectorAll('.three-viz-container, .chart-container').forEach(el => {
            observer.observe(el);
        });
    }

    // Skeleton loader implementation
    showSkeletonLoader(container, type = 'default') {
        const skeletonHTML = this.getSkeletonTemplate(type);
        container.innerHTML = skeletonHTML;
        container.classList.add('skeleton-loading');
    }

    hideSkeletonLoader(container) {
        container.classList.remove('skeleton-loading');
    }

    getSkeletonTemplate(type) {
        switch (type) {
            case 'chart':
                return `
                    <div class="skeleton-chart">
                        <div class="skeleton-bar" style="height: 60%;"></div>
                        <div class="skeleton-bar" style="height: 80%;"></div>
                        <div class="skeleton-bar" style="height: 45%;"></div>
                        <div class="skeleton-bar" style="height: 90%;"></div>
                    </div>
                `;
            case 'dashboard':
                return `
                    <div class="skeleton-dashboard">
                        <div class="skeleton-card">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-metric"></div>
                        </div>
                        <div class="skeleton-card">
                            <div class="skeleton-title"></div>
                            <div class="skeleton-metric"></div>
                        </div>
                    </div>
                `;
            default:
                return `
                    <div class="skeleton-default">
                        <div class="skeleton-line long"></div>
                        <div class="skeleton-line medium"></div>
                        <div class="skeleton-line short"></div>
                    </div>
                `;
        }
    }

    // Friendly error toasts for async panels
    showErrorToast(message, duration = 5000) {
        const toast = document.createElement('div');
        toast.className = 'error-toast';
        toast.innerHTML = `
            <div class="toast-content">
                <span class="toast-icon">⚠️</span>
                <span class="toast-message">${message}</span>
                <button class="toast-close">&times;</button>
            </div>
        `;

        document.body.appendChild(toast);

        // Auto-remove after duration
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, duration);

        // Manual close
        toast.querySelector('.toast-close').addEventListener('click', () => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        });
    }

    // Code splitting for vendor libraries
    async loadVendorLib(libName) {
        const libUrls = {
            'three': 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js',
            'chart': 'https://cdn.jsdelivr.net/npm/chart.js',
            'particles': 'https://cdn.jsdelivr.net/npm/particles.js'
        };

        if (!libUrls[libName]) {
            throw new Error(`Unknown library: ${libName}`);
        }

        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = libUrls[libName];
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    // Specific Three.js lazy loading
    async loadThreeJsVisualization(container) {
        try {
            this.showSkeletonLoader(container, 'chart');
            
            if (typeof THREE === 'undefined') {
                await this.loadVendorLib('three');
            }
            
            // Initialize Three.js visualization
            const vizModule = await import('/public/js/three-dashboard-viz.js');
            const viz = new vizModule.DashboardVisualization(container.id);
            
            this.hideSkeletonLoader(container);
        } catch (error) {
            this.hideSkeletonLoader(container);
            this.showErrorToast('Failed to load 3D visualization');
            console.warn('Three.js lazy loading failed:', error);
        }
    }

    // Chart lazy loading
    async loadChartVisualization(container) {
        try {
            this.showSkeletonLoader(container, 'chart');
            
            if (typeof Chart === 'undefined') {
                await this.loadVendorLib('chart');
            }
            
            // Initialize chart
            const chartModule = await import('/public/js/enhanced-charts.js');
            
            this.hideSkeletonLoader(container);
        } catch (error) {
            this.hideSkeletonLoader(container);
            this.showErrorToast('Failed to load chart');
            console.warn('Chart lazy loading failed:', error);
        }
    }

    // Fix specific problematic intervals
    fixExistingIntervals() {
        // Fix liveDashboard polling
        if (window.liveDashboard && window.liveDashboard.refreshInterval) {
            clearInterval(window.liveDashboard.refreshInterval);
            window.liveDashboard.refreshInterval = setInterval(async () => {
                try {
                    await Promise.allSettled([
                        window.liveDashboard.loadLiveGames(),
                        window.liveDashboard.updateSystemStatus()
                    ]);
                } catch (error) {
                    console.warn('Live dashboard refresh error:', error);
                }
            }, this.minPollingInterval);
        }

        // Fix AI integrations polling
        if (window.aiIntegrations && window.aiIntegrations.statusCheckInterval) {
            clearInterval(window.aiIntegrations.statusCheckInterval);
            window.aiIntegrations.statusCheckInterval = setInterval(async () => {
                try {
                    await window.aiIntegrations.checkServicesStatus();
                } catch (error) {
                    console.warn('AI services status check error:', error);
                }
            }, this.minPollingInterval);
        }
    }

    // Cleanup method
    cleanup() {
        // Clear all active intervals
        this.activeIntervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.activeIntervals.clear();

        // Clear all debounce timers
        this.debounceTimers.forEach(timer => {
            clearTimeout(timer);
        });
        this.debounceTimers.clear();

        // Clear cache
        this.cache.clear();
    }

    // Initialize all optimizations
    init() {
        this.optimizePollingIntervals();
        this.setupLazyLoading();
        this.addSkeletonStyles();
        
        // Fix existing problematic intervals after a short delay
        setTimeout(() => {
            this.fixExistingIntervals();
        }, 1000);
    }

    // Add skeleton loader CSS
    addSkeletonStyles() {
        if (document.getElementById('skeleton-styles')) return;
        
        const styles = document.createElement('style');
        styles.id = 'skeleton-styles';
        styles.textContent = `
            .skeleton-loading {
                animation: skeleton-pulse 1.5s ease-in-out infinite alternate;
            }
            
            @keyframes skeleton-pulse {
                0% { opacity: 1; }
                100% { opacity: 0.4; }
            }
            
            .skeleton-line, .skeleton-bar, .skeleton-card, .skeleton-title, .skeleton-metric {
                background: linear-gradient(90deg, rgba(255,255,255,0.1) 25%, rgba(255,255,255,0.2) 50%, rgba(255,255,255,0.1) 75%);
                border-radius: 4px;
                margin: 8px 0;
            }
            
            .skeleton-line.long { height: 16px; width: 80%; }
            .skeleton-line.medium { height: 16px; width: 60%; }
            .skeleton-line.short { height: 16px; width: 40%; }
            
            .skeleton-bar {
                width: 60px;
                margin: 4px;
                display: inline-block;
                border-radius: 4px 4px 0 0;
            }
            
            .skeleton-chart {
                display: flex;
                align-items: end;
                justify-content: space-around;
                height: 200px;
                padding: 20px;
            }
            
            .skeleton-card {
                background: rgba(255,255,255,0.05);
                padding: 16px;
                border-radius: 8px;
                margin: 8px;
            }
            
            .skeleton-title { height: 20px; width: 70%; margin-bottom: 12px; }
            .skeleton-metric { height: 32px; width: 50%; }
            
            .error-toast {
                position: fixed;
                bottom: 20px;
                right: 20px;
                background: rgba(255, 56, 56, 0.95);
                color: white;
                padding: 16px;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.3);
                z-index: 10000;
                max-width: 400px;
                animation: slideInUp 0.3s ease;
            }
            
            @keyframes slideInUp {
                from { transform: translateY(100%); opacity: 0; }
                to { transform: translateY(0); opacity: 1; }
            }
            
            .toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
            }
            
            .toast-close {
                background: none;
                border: none;
                color: white;
                font-size: 18px;
                cursor: pointer;
                margin-left: auto;
            }
        `;
        document.head.appendChild(styles);
    }
}

// Initialize performance optimizer
const performanceOptimizer = new PerformanceOptimizer();

// Export for global use
window.PerformanceOptimizer = performanceOptimizer;

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => performanceOptimizer.init());
} else {
    performanceOptimizer.init();
}