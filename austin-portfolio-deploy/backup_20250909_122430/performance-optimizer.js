/**
 * Blaze Intelligence Performance Optimizer
 * Optimizes bundle size, lazy loading, and runtime performance
 */

class PerformanceOptimizer {
    constructor() {
        this.config = {
            lazyLoadThreshold: 0.1, // Intersection observer threshold
            cacheVersion: 'v1.0.0',
            maxCacheSize: 50 * 1024 * 1024, // 50MB
            compressionEnabled: true,
            bundleSplitting: true,
            criticalCSS: true
        };

        this.modules = new Map();
        this.loadedModules = new Set();
        this.performanceMetrics = {
            pageLoadTime: 0,
            firstContentfulPaint: 0,
            timeToInteractive: 0,
            bundleSize: 0,
            cacheHitRate: 0
        };

        this.init();
    }

    async init() {
        console.log('⚡ Initializing Performance Optimizer...');
        
        // Measure initial metrics
        this.measureInitialMetrics();
        
        // Set up lazy loading
        this.setupLazyLoading();
        
        // Initialize service worker for caching
        await this.initServiceWorker();
        
        // Optimize images
        this.optimizeImages();
        
        // Set up resource hints
        this.setupResourceHints();
        
        // Monitor performance
        this.startPerformanceMonitoring();
        
        console.log('✅ Performance Optimizer initialized');
    }

    measureInitialMetrics() {
        // Use Performance API
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            this.performanceMetrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
            
            // Get Web Vitals
            if (window.PerformanceObserver) {
                // First Contentful Paint
                const paintObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.name === 'first-contentful-paint') {
                            this.performanceMetrics.firstContentfulPaint = entry.startTime;
                        }
                    }
                });
                paintObserver.observe({ entryTypes: ['paint'] });
                
                // Largest Contentful Paint
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.performanceMetrics.largestContentfulPaint = lastEntry.renderTime || lastEntry.loadTime;
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            }
        }
    }

    setupLazyLoading() {
        // Create Intersection Observer for lazy loading
        this.lazyLoadObserver = new IntersectionObserver(
            (entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadResource(entry.target);
                    }
                });
            },
            {
                rootMargin: '50px',
                threshold: this.config.lazyLoadThreshold
            }
        );

        // Observe images
        document.querySelectorAll('img[data-src]').forEach(img => {
            this.lazyLoadObserver.observe(img);
        });

        // Observe iframes
        document.querySelectorAll('iframe[data-src]').forEach(iframe => {
            this.lazyLoadObserver.observe(iframe);
        });

        // Observe sections for module loading
        document.querySelectorAll('[data-module]').forEach(section => {
            this.lazyLoadObserver.observe(section);
        });
    }

    loadResource(element) {
        if (element.tagName === 'IMG') {
            // Load image
            const src = element.dataset.src;
            if (src) {
                element.src = src;
                element.removeAttribute('data-src');
                this.lazyLoadObserver.unobserve(element);
            }
        } else if (element.tagName === 'IFRAME') {
            // Load iframe
            const src = element.dataset.src;
            if (src) {
                element.src = src;
                element.removeAttribute('data-src');
                this.lazyLoadObserver.unobserve(element);
            }
        } else if (element.dataset.module) {
            // Load JavaScript module
            this.loadModule(element.dataset.module);
            this.lazyLoadObserver.unobserve(element);
        }
    }

    async loadModule(moduleName) {
        if (this.loadedModules.has(moduleName)) {
            return this.modules.get(moduleName);
        }

        console.log(`📦 Lazy loading module: ${moduleName}`);
        
        try {
            let module;
            switch(moduleName) {
                case 'sports-data-hub':
                    module = await import('./sports-data-hub.js');
                    break;
                case 'team-intelligence':
                    module = await import('./team-intelligence-cards.js');
                    break;
                case 'live-scoreboard':
                    module = await import('./live-scoreboard-integration.js');
                    break;
                case 'grit-index':
                    module = await import('./grit-index-ui.js');
                    break;
                default:
                    console.warn(`Unknown module: ${moduleName}`);
                    return null;
            }
            
            this.modules.set(moduleName, module);
            this.loadedModules.add(moduleName);
            
            // Dispatch event for module loaded
            document.dispatchEvent(new CustomEvent('moduleLoaded', {
                detail: { moduleName, module }
            }));
            
            return module;
        } catch (error) {
            console.error(`Failed to load module ${moduleName}:`, error);
            return null;
        }
    }

    async initServiceWorker() {
        if ('serviceWorker' in navigator) {
            try {
                // Create service worker content
                const swContent = this.generateServiceWorker();
                
                // Create blob URL for service worker
                const blob = new Blob([swContent], { type: 'application/javascript' });
                const swUrl = URL.createObjectURL(blob);
                
                // Register service worker
                const registration = await navigator.serviceWorker.register(swUrl, {
                    scope: '/'
                });
                
                console.log('✅ Service Worker registered for caching');
                
                // Clean up blob URL
                URL.revokeObjectURL(swUrl);
                
                return registration;
            } catch (error) {
                console.warn('Service Worker registration failed:', error);
            }
        }
    }

    generateServiceWorker() {
        return `
            const CACHE_NAME = 'blaze-intelligence-${this.config.cacheVersion}';
            const MAX_CACHE_SIZE = ${this.config.maxCacheSize};
            
            const urlsToCache = [
                '/',
                '/css/main.css',
                '/js/api-config.js',
                '/data/dashboard-config.json'
            ];
            
            // Install event
            self.addEventListener('install', event => {
                event.waitUntil(
                    caches.open(CACHE_NAME)
                        .then(cache => cache.addAll(urlsToCache))
                );
            });
            
            // Fetch event with cache-first strategy
            self.addEventListener('fetch', event => {
                event.respondWith(
                    caches.match(event.request)
                        .then(response => {
                            if (response) {
                                return response;
                            }
                            
                            return fetch(event.request).then(response => {
                                // Don't cache non-successful responses
                                if (!response || response.status !== 200 || response.type !== 'basic') {
                                    return response;
                                }
                                
                                // Clone the response
                                const responseToCache = response.clone();
                                
                                caches.open(CACHE_NAME).then(cache => {
                                    cache.put(event.request, responseToCache);
                                });
                                
                                return response;
                            });
                        })
                );
            });
            
            // Activate event - clean old caches
            self.addEventListener('activate', event => {
                event.waitUntil(
                    caches.keys().then(cacheNames => {
                        return Promise.all(
                            cacheNames.map(cacheName => {
                                if (cacheName !== CACHE_NAME) {
                                    return caches.delete(cacheName);
                                }
                            })
                        );
                    })
                );
            });
        `;
    }

    optimizeImages() {
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" attribute
            if (!img.loading) {
                img.loading = 'lazy';
            }
            
            // Add decoding="async" for better performance
            if (!img.decoding) {
                img.decoding = 'async';
            }
            
            // Convert to WebP if supported
            if (this.supportsWebP() && img.src && !img.src.includes('.webp')) {
                const webpSrc = img.src.replace(/\.(jpg|jpeg|png)$/i, '.webp');
                
                // Create picture element for format fallback
                const picture = document.createElement('picture');
                const sourceWebP = document.createElement('source');
                sourceWebP.srcset = webpSrc;
                sourceWebP.type = 'image/webp';
                
                img.parentNode.insertBefore(picture, img);
                picture.appendChild(sourceWebP);
                picture.appendChild(img);
            }
        });
    }

    supportsWebP() {
        const canvas = document.createElement('canvas');
        canvas.width = 1;
        canvas.height = 1;
        return canvas.toDataURL('image/webp').indexOf('image/webp') === 0;
    }

    setupResourceHints() {
        const head = document.head;
        
        // Preconnect to external domains
        const preconnectDomains = [
            'https://statsapi.mlb.com',
            'https://site.api.espn.com',
            'https://api.sportradar.us',
            'https://cdn.jsdelivr.net',
            'https://fonts.googleapis.com'
        ];
        
        preconnectDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            head.appendChild(link);
        });
        
        // DNS prefetch for additional domains
        const dnsPrefetchDomains = [
            'https://www.baseball-reference.com',
            'https://www.pro-football-reference.com',
            'https://www.fangraphs.com'
        ];
        
        dnsPrefetchDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = domain;
            head.appendChild(link);
        });
        
        // Prefetch critical resources
        const prefetchResources = [
            '/js/sports-data-hub.js',
            '/data/dashboard-config.json'
        ];
        
        prefetchResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resource;
            head.appendChild(link);
        });
    }

    startPerformanceMonitoring() {
        // Monitor long tasks
        if (window.PerformanceObserver) {
            const longTaskObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    console.warn(`⚠️ Long task detected: ${entry.duration}ms`);
                    
                    // Report to analytics
                    this.reportMetric('long_task', {
                        duration: entry.duration,
                        startTime: entry.startTime
                    });
                }
            });
            
            try {
                longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (e) {
                // Long task observer not supported
            }
        }
        
        // Monitor memory usage
        if (performance.memory) {
            setInterval(() => {
                const memoryUsage = {
                    usedJSHeapSize: performance.memory.usedJSHeapSize,
                    totalJSHeapSize: performance.memory.totalJSHeapSize,
                    jsHeapSizeLimit: performance.memory.jsHeapSizeLimit
                };
                
                // Warn if memory usage is high
                const usagePercent = (memoryUsage.usedJSHeapSize / memoryUsage.jsHeapSizeLimit) * 100;
                if (usagePercent > 90) {
                    console.warn(`⚠️ High memory usage: ${usagePercent.toFixed(2)}%`);
                    this.performMemoryCleanup();
                }
            }, 30000); // Check every 30 seconds
        }
    }

    performMemoryCleanup() {
        // Clear old cache entries
        if (window.sportsDataHub) {
            window.sportsDataHub.cache.clear();
        }
        
        // Clear old DOM nodes
        const oldNodes = document.querySelectorAll('[data-expired="true"]');
        oldNodes.forEach(node => node.remove());
        
        // Trigger garbage collection if available
        if (window.gc) {
            window.gc();
        }
        
        console.log('🧹 Memory cleanup performed');
    }

    // Bundle optimization methods
    async optimizeBundle() {
        const optimizations = {
            minified: false,
            treeshaken: false,
            codesplit: false,
            compressed: false
        };
        
        // Check if code is minified
        const scripts = document.querySelectorAll('script[src]');
        for (const script of scripts) {
            if (script.src.includes('.min.js')) {
                optimizations.minified = true;
                break;
            }
        }
        
        // Check for code splitting
        if (this.config.bundleSplitting) {
            optimizations.codesplit = true;
        }
        
        // Check for compression
        if ('CompressionStream' in window) {
            optimizations.compressed = true;
        }
        
        return optimizations;
    }

    // Critical CSS extraction
    extractCriticalCSS() {
        const critical = [];
        const stylesheets = document.styleSheets;
        
        for (const stylesheet of stylesheets) {
            try {
                const rules = stylesheet.cssRules || stylesheet.rules;
                for (const rule of rules) {
                    // Check if rule applies to above-the-fold content
                    if (this.isAboveTheFold(rule)) {
                        critical.push(rule.cssText);
                    }
                }
            } catch (e) {
                // Cross-origin stylesheet
            }
        }
        
        return critical.join('');
    }

    isAboveTheFold(rule) {
        // Simple check - in production, use more sophisticated logic
        const viewportHeight = window.innerHeight;
        
        if (rule.selectorText) {
            const elements = document.querySelectorAll(rule.selectorText);
            for (const element of elements) {
                const rect = element.getBoundingClientRect();
                if (rect.top < viewportHeight) {
                    return true;
                }
            }
        }
        
        return false;
    }

    // Performance reporting
    reportMetric(metricName, data) {
        // Send to analytics endpoint
        if (window.blazeAnalytics) {
            window.blazeAnalytics.track('performance_metric', {
                metric: metricName,
                ...data,
                timestamp: Date.now()
            });
        }
        
        // Store locally for debugging
        const metrics = JSON.parse(localStorage.getItem('performance_metrics') || '[]');
        metrics.push({
            metric: metricName,
            data,
            timestamp: Date.now()
        });
        
        // Keep only last 100 metrics
        if (metrics.length > 100) {
            metrics.shift();
        }
        
        localStorage.setItem('performance_metrics', JSON.stringify(metrics));
    }

    // Get performance report
    getPerformanceReport() {
        const report = {
            metrics: this.performanceMetrics,
            optimization: {
                lazyLoadedModules: Array.from(this.loadedModules),
                cacheSize: this.getCacheSize(),
                ...this.optimizeBundle()
            },
            recommendations: this.getRecommendations()
        };
        
        return report;
    }

    getCacheSize() {
        if ('estimate' in navigator.storage) {
            return navigator.storage.estimate().then(estimate => {
                return {
                    usage: estimate.usage,
                    quota: estimate.quota,
                    percent: (estimate.usage / estimate.quota) * 100
                };
            });
        }
        return { usage: 0, quota: 0, percent: 0 };
    }

    getRecommendations() {
        const recommendations = [];
        
        // Check page load time
        if (this.performanceMetrics.pageLoadTime > 3000) {
            recommendations.push('Page load time exceeds 3 seconds. Consider optimizing assets.');
        }
        
        // Check FCP
        if (this.performanceMetrics.firstContentfulPaint > 1800) {
            recommendations.push('First Contentful Paint is slow. Optimize critical rendering path.');
        }
        
        // Check bundle size
        const totalSize = Array.from(document.querySelectorAll('script')).reduce((size, script) => {
            return size + (script.src ? 100000 : script.innerHTML.length); // Estimate external scripts at 100KB
        }, 0);
        
        if (totalSize > 500000) {
            recommendations.push('Bundle size is large. Consider code splitting and tree shaking.');
        }
        
        return recommendations;
    }
}

// Global instance
let performanceOptimizer;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    // Initialize immediately for critical optimizations
    performanceOptimizer = new PerformanceOptimizer();
    window.performanceOptimizer = performanceOptimizer;
    
    // Additional setup after DOM is ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📊 Performance Report:', performanceOptimizer.getPerformanceReport());
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PerformanceOptimizer;
}