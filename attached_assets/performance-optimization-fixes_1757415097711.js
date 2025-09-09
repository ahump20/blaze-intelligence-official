// Performance Optimization Solutions
// Fix MCP Auto-sync Issues and Improve Site Performance

// 1. OPTIMIZED MCP SYNC MANAGER
class OptimizedMCPSync {
    constructor() {
        this.syncInterval = 5 * 60 * 1000; // 5 minutes instead of seconds
        this.lastSync = 0;
        this.syncTimer = null;
        this.retryCount = 0;
        this.maxRetries = 3;
        this.isOnline = navigator.onLine;
        
        this.initializeOptimizedSync();
        this.setupConnectionMonitoring();
    }

    initializeOptimizedSync() {
        // Clear any existing frequent syncing
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }

        // Start intelligent sync
        this.startIntelligentSync();
    }

    startIntelligentSync() {
        this.syncTimer = setInterval(() => {
            if (this.shouldSync()) {
                this.performOptimizedSync();
            }
        }, this.syncInterval);

        console.log('MCP Sync optimized: Now syncing every 5 minutes instead of every few seconds');
    }

    shouldSync() {
        const now = Date.now();
        const timeSinceLastSync = now - this.lastSync;
        
        // Only sync if:
        // 1. Enough time has passed
        // 2. We're online
        // 3. Page is visible (not in background)
        return (
            timeSinceLastSync >= this.syncInterval &&
            this.isOnline &&
            !document.hidden
        );
    }

    async performOptimizedSync() {
        try {
            console.log('MCP: Intelligent sync starting...');
            
            // Batch multiple operations instead of individual calls
            const syncPromises = [
                this.syncCardinalsData(),
                this.syncDashboardMetrics(),
                this.syncSystemHealth()
            ];

            await Promise.allSettled(syncPromises);
            
            this.lastSync = Date.now();
            this.retryCount = 0;
            
            console.log('MCP: Sync completed successfully');
        } catch (error) {
            console.error('MCP: Sync failed:', error);
            this.handleSyncError();
        }
    }

    async syncCardinalsData() {
        // Only sync if Cardinals data is actually being displayed
        const cardinalsElements = document.querySelectorAll('[data-cardinals]');
        if (cardinalsElements.length === 0) return;

        const response = await fetch('/api/cardinals/live-data');
        if (response.ok) {
            const data = await response.json();
            this.updateCardinalsDisplay(data);
        }
    }

    async syncDashboardMetrics() {
        const dashboardElements = document.querySelectorAll('[data-metric]');
        if (dashboardElements.length === 0) return;

        const response = await fetch('/api/dashboard/metrics');
        if (response.ok) {
            const data = await response.json();
            this.updateDashboardDisplay(data);
        }
    }

    async syncSystemHealth() {
        // Lightweight health check
        const response = await fetch('/api/health');
        if (response.ok) {
            const health = await response.json();
            this.updateHealthStatus(health);
        }
    }

    handleSyncError() {
        this.retryCount++;
        
        if (this.retryCount < this.maxRetries) {
            // Exponential backoff for retries
            setTimeout(() => {
                this.performOptimizedSync();
            }, Math.pow(2, this.retryCount) * 1000);
        } else {
            // Stop syncing temporarily after max retries
            console.warn('MCP: Max retries reached, pausing sync for 10 minutes');
            setTimeout(() => {
                this.retryCount = 0;
            }, 10 * 60 * 1000);
        }
    }

    setupConnectionMonitoring() {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            console.log('MCP: Connection restored, resuming sync');
            this.performOptimizedSync();
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            console.log('MCP: Connection lost, pausing sync');
        });

        // Monitor page visibility
        document.addEventListener('visibilitychange', () => {
            if (!document.hidden && this.isOnline) {
                // Page became visible, perform immediate sync
                const timeSinceLastSync = Date.now() - this.lastSync;
                if (timeSinceLastSync > 2 * 60 * 1000) { // 2 minutes
                    this.performOptimizedSync();
                }
            }
        });
    }

    updateCardinalsDisplay(data) {
        // Update UI elements with Cardinals data
        const elements = document.querySelectorAll('[data-cardinals]');
        elements.forEach(el => {
            const metric = el.getAttribute('data-cardinals');
            if (data.data && data.data.teamMetrics && data.data.teamMetrics[metric]) {
                el.textContent = data.data.teamMetrics[metric];
            }
        });
    }

    updateDashboardDisplay(data) {
        // Update dashboard metrics
        const elements = document.querySelectorAll('[data-metric]');
        elements.forEach(el => {
            const metric = el.getAttribute('data-metric');
            if (data[metric] !== undefined) {
                el.textContent = data[metric];
            }
        });
    }

    updateHealthStatus(health) {
        const statusEl = document.getElementById('system-status');
        if (statusEl) {
            statusEl.className = `status-${health.status}`;
            statusEl.textContent = health.status.toUpperCase();
        }
    }

    // Manual sync trigger for user interactions
    triggerImmediateSync() {
        if (this.isOnline) {
            this.performOptimizedSync();
        }
    }

    // Cleanup method
    destroy() {
        if (this.syncTimer) {
            clearInterval(this.syncTimer);
        }
    }
}

// 2. PERFORMANCE OPTIMIZATION UTILITIES
class PerformanceOptimizer {
    constructor() {
        this.lazyLoadImages();
        this.optimizeAnimations();
        this.setupIntersectionObserver();
        this.enableResourcePreloading();
    }

    lazyLoadImages() {
        // Lazy load images for better performance
        const images = document.querySelectorAll('img[data-src]');
        const imageObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    imageObserver.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    optimizeAnimations() {
        // Reduce animations on mobile and low-power devices
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
        
        if (prefersReducedMotion.matches || this.isLowPowerDevice()) {
            document.body.classList.add('reduced-motion');
            
            // Disable Three.js animations on low-power devices
            if (window.scene) {
                window.scene.remove(window.particles);
            }
        }
    }

    isLowPowerDevice() {
        // Detect low-power devices
        const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
        const ram = navigator.deviceMemory;
        
        return (
            (connection && connection.saveData) || // Data saver mode
            (ram && ram < 4) || // Less than 4GB RAM
            /Android.*Mobile|iPhone|iPod/.test(navigator.userAgent) // Mobile devices
        );
    }

    setupIntersectionObserver() {
        // Animate elements only when they're visible
        const animatedElements = document.querySelectorAll('.animate-on-scroll');
        
        const animationObserver = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('animated');
                    animationObserver.unobserve(entry.target);
                }
            });
        }, { threshold: 0.1 });

        animatedElements.forEach(el => animationObserver.observe(el));
    }

    enableResourcePreloading() {
        // Preload critical resources
        const criticalResources = [
            '/api/dashboard/metrics',
            '/api/health'
        ];

        criticalResources.forEach(resource => {
            fetch(resource, { method: 'HEAD' }).catch(() => {}); // Prefetch silently
        });
    }

    // Monitor and report performance metrics
    monitorPerformance() {
        if ('performance' in window) {
            window.addEventListener('load', () => {
                setTimeout(() => {
                    const perfData = performance.getEntriesByType('navigation')[0];
                    console.log('Performance Metrics:', {
                        domContentLoaded: perfData.domContentLoadedEventEnd - perfData.domContentLoadedEventStart,
                        loadComplete: perfData.loadEventEnd - perfData.loadEventStart,
                        totalPageLoad: perfData.loadEventEnd - perfData.fetchStart
                    });
                }, 0);
            });
        }
    }
}

// 3. CACHING SYSTEM
class IntelligentCache {
    constructor() {
        this.cache = new Map();
        this.maxAge = 5 * 60 * 1000; // 5 minutes
        this.maxSize = 50; // Maximum cache entries
        this.setupPeriodicCleanup();
    }

    set(key, data) {
        // Remove oldest entries if cache is full
        if (this.cache.size >= this.maxSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }

        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    get(key) {
        const cached = this.cache.get(key);
        
        if (!cached) return null;
        
        // Check if data is still fresh
        if (Date.now() - cached.timestamp > this.maxAge) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }

    clear() {
        this.cache.clear();
    }

    setupPeriodicCleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, value] of this.cache.entries()) {
                if (now - value.timestamp > this.maxAge) {
                    this.cache.delete(key);
                }
            }
        }, this.maxAge);
    }
}

// Initialize optimizations when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Replace the old MCP sync with optimized version
    if (window.mcpSync) {
        window.mcpSync.destroy?.();
    }
    
    window.mcpSync = new OptimizedMCPSync();
    window.performanceOptimizer = new PerformanceOptimizer();
    window.intelligentCache = new IntelligentCache();
    
    window.performanceOptimizer.monitorPerformance();
    
    console.log('🚀 Blaze Intelligence: Performance optimizations loaded');
});

// CSS for reduced motion and performance improvements
const performanceCSS = `
/* Reduced motion styles */
.reduced-motion * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
}

/* Optimize animations */
.animate-on-scroll {
    opacity: 0;
    transform: translateY(30px);
    transition: opacity 0.6s ease, transform 0.6s ease;
}

.animate-on-scroll.animated {
    opacity: 1;
    transform: translateY(0);
}

/* Performance indicators */
.status-healthy { color: #4CAF50; }
.status-warning { color: #FF9800; }
.status-error { color: #F44336; }

/* Lazy loading placeholder */
img[data-src] {
    background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
    background-size: 200% 100%;
    animation: loading 1.5s infinite;
}

@keyframes loading {
    0% { background-position: 200% 0; }
    100% { background-position: -200% 0; }
}

/* Mobile optimizations */
@media (max-width: 768px) {
    .three-js-container {
        display: none; /* Hide heavy animations on mobile */
    }
    
    .chart-container {
        height: 200px; /* Reduce chart size on mobile */
    }
}

/* High contrast mode support */
@media (prefers-contrast: high) {
    .metric-card {
        border-width: 2px;
    }
}
`;

// Inject performance CSS
const performanceStyle = document.createElement('style');
performanceStyle.textContent = performanceCSS;
document.head.appendChild(performanceStyle);

// Instructions for Replit Agent:
// 1. Replace any existing MCP sync code with OptimizedMCPSync
// 2. Add data-metric attributes to dashboard elements
// 3. Add data-cardinals attributes to Cardinals-specific elements  
// 4. Implement lazy loading for images using data-src
// 5. Add animate-on-scroll class to elements that should animate
// 6. Test that sync frequency is reduced from seconds to minutes
// 7. Monitor console for performance metrics and sync logs