/**
 * Blaze Intelligence Production Optimizer
 * Advanced optimization techniques for production deployment
 */

class BlazeProductionOptimizer {
    constructor() {
        this.config = {
            enableServiceWorker: true,
            enableResourcePrefetch: true,
            enableLazyLoading: true,
            enableCriticalCSS: true,
            enableImageOptimization: true,
            enableFontOptimization: true,
            enableCodeSplitting: true
        };
        
        this.optimizations = {};
        this.performanceMonitor = null;
        
        this.init();
    }

    async init() {
        console.log('🚀 Initializing Production Optimizer...');
        
        // Wait for performance monitor
        await this.waitForPerformanceMonitor();
        
        // Apply optimizations in order of impact
        await this.applyOptimizations();
        
        console.log('✅ Production optimizations applied');
    }

    async waitForPerformanceMonitor() {
        return new Promise((resolve) => {
            const checkMonitor = () => {
                if (window.blazePerformanceMonitor) {
                    this.performanceMonitor = window.blazePerformanceMonitor;
                    resolve();
                } else {
                    setTimeout(checkMonitor, 100);
                }
            };
            checkMonitor();
        });
    }

    async applyOptimizations() {
        const optimizationTasks = [
            this.optimizeFontLoading.bind(this),
            this.implementLazyLoading.bind(this),
            this.prefetchCriticalResources.bind(this),
            this.optimizeImages.bind(this),
            this.implementServiceWorker.bind(this),
            this.enableGZipCompression.bind(this),
            this.optimizeCriticalCSS.bind(this),
            this.setupResourceHints.bind(this),
            this.optimizeJavaScriptExecution.bind(this),
            this.implementCaching.bind(this)
        ];

        for (const task of optimizationTasks) {
            try {
                await task();
            } catch (error) {
                console.warn('⚠️ Optimization task failed:', error.message);
            }
        }
    }

    async optimizeFontLoading() {
        if (!this.config.enableFontOptimization) return;
        
        console.log('🔤 Optimizing font loading...');
        
        // Add font-display: swap to existing font links
        const fontLinks = document.querySelectorAll('link[rel="stylesheet"][href*="fonts.googleapis.com"]');
        fontLinks.forEach(link => {
            if (!link.href.includes('display=swap')) {
                link.href = link.href + (link.href.includes('?') ? '&' : '?') + 'display=swap';
            }
        });
        
        // Preload critical fonts
        const criticalFonts = [
            'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
            'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600&display=swap'
        ];
        
        criticalFonts.forEach(fontUrl => {
            const preloadLink = document.createElement('link');
            preloadLink.rel = 'preload';
            preloadLink.as = 'style';
            preloadLink.href = fontUrl;
            preloadLink.onload = function() { this.rel = 'stylesheet'; };
            document.head.appendChild(preloadLink);
        });
        
        this.optimizations.fontLoading = 'optimized';
        this.performanceMonitor?.recordCustomMetric('optimization_applied', 'font_loading');
    }

    async implementLazyLoading() {
        if (!this.config.enableLazyLoading) return;
        
        console.log('🖼️ Implementing lazy loading...');
        
        // Lazy load images
        const images = document.querySelectorAll('img[data-src], img[src]');
        
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries, observer) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                        }
                        
                        img.classList.remove('lazy');
                        observer.unobserve(img);
                        
                        this.performanceMonitor?.recordCustomMetric('lazy_load_image', img.src);
                    }
                });
            }, {
                rootMargin: '50px 0px'
            });
            
            images.forEach(img => {
                img.classList.add('lazy');
                imageObserver.observe(img);
            });
        } else {
            // Fallback for browsers without IntersectionObserver
            images.forEach(img => {
                if (img.dataset.src) {
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                }
            });
        }
        
        // Lazy load non-critical scripts
        this.lazyLoadScripts();
        
        this.optimizations.lazyLoading = 'implemented';
        this.performanceMonitor?.recordCustomMetric('optimization_applied', 'lazy_loading');
    }

    async prefetchCriticalResources() {
        if (!this.config.enableResourcePrefetch) return;
        
        console.log('⚡ Prefetching critical resources...');
        
        const criticalResources = [
            'https://statsapi.mlb.com/api/v1/teams/138',
            'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/healthz'
        ];
        
        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'prefetch';
            link.href = resource;
            document.head.appendChild(link);
        });
        
        // DNS prefetch for external domains
        const dnsPrefetchDomains = [
            'statsapi.mlb.com',
            'site.api.espn.com',
            'api.collegefootballdata.com',
            'cdnjs.cloudflare.com'
        ];
        
        dnsPrefetchDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'dns-prefetch';
            link.href = `https://${domain}`;
            document.head.appendChild(link);
        });
        
        this.optimizations.resourcePrefetch = 'implemented';
        this.performanceMonitor?.recordCustomMetric('optimization_applied', 'resource_prefetch');
    }

    async optimizeImages() {
        if (!this.config.enableImageOptimization) return;
        
        console.log('📸 Optimizing images...');
        
        const images = document.querySelectorAll('img');
        
        images.forEach(img => {
            // Add loading="lazy" for native lazy loading
            if (!img.hasAttribute('loading')) {
                img.loading = 'lazy';
            }
            
            // Add decoding="async" for better performance
            if (!img.hasAttribute('decoding')) {
                img.decoding = 'async';
            }
            
            // Responsive images with srcset if not present
            if (!img.srcset && img.src) {
                const src = img.src;
                if (src.includes('.jpg') || src.includes('.jpeg') || src.includes('.png')) {
                    // Generate responsive variants (this would typically be done server-side)
                    const baseSrc = src.replace(/\.(jpg|jpeg|png)$/i, '');
                    const ext = src.match(/\.(jpg|jpeg|png)$/i)?.[1] || 'jpg';
                    
                    // Example srcset (in production, these would be actual optimized images)
                    img.srcset = `
                        ${baseSrc}-400w.${ext} 400w,
                        ${baseSrc}-800w.${ext} 800w,
                        ${baseSrc}-1200w.${ext} 1200w
                    `.trim().replace(/\s+/g, ' ');
                    
                    img.sizes = '(max-width: 480px) 400px, (max-width: 768px) 800px, 1200px';
                }
            }
        });
        
        this.optimizations.imageOptimization = 'applied';
        this.performanceMonitor?.recordCustomMetric('optimization_applied', 'image_optimization');
    }

    async implementServiceWorker() {
        if (!this.config.enableServiceWorker || !('serviceWorker' in navigator)) return;
        
        console.log('⚙️ Implementing Service Worker...');
        
        try {
            const registration = await navigator.serviceWorker.register('/sw.js', {
                scope: '/'
            });
            
            console.log('✅ Service Worker registered:', registration.scope);
            
            // Listen for updates
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                newWorker?.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        console.log('🔄 New Service Worker available');
                        this.performanceMonitor?.recordCustomMetric('service_worker_update', Date.now());
                    }
                });
            });
            
            this.optimizations.serviceWorker = 'registered';
            this.performanceMonitor?.recordCustomMetric('optimization_applied', 'service_worker');
            
        } catch (error) {
            console.warn('⚠️ Service Worker registration failed:', error);
        }
    }

    async enableGZipCompression() {
        console.log('🗜️ Checking compression support...');
        
        // Check if the server supports compression
        try {
            const response = await fetch(window.location.href, { method: 'HEAD' });
            const contentEncoding = response.headers.get('content-encoding');
            
            if (contentEncoding && (contentEncoding.includes('gzip') || contentEncoding.includes('br'))) {
                console.log('✅ Server compression enabled:', contentEncoding);
                this.optimizations.compression = contentEncoding;
            } else {
                console.log('⚠️ Server compression not detected');
                this.optimizations.compression = 'not_detected';
            }
            
            this.performanceMonitor?.recordCustomMetric('compression_check', contentEncoding || 'none');
            
        } catch (error) {
            console.warn('❌ Failed to check compression:', error);
        }
    }

    async optimizeCriticalCSS() {
        if (!this.config.enableCriticalCSS) return;
        
        console.log('🎨 Optimizing critical CSS...');
        
        // Move critical styles inline for better performance
        const criticalStyles = `
            /* Critical above-the-fold styles */
            :root { --burnt-orange: #BF5700; --dark-bg: #000000; }
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: 'Inter', sans-serif; background: var(--dark-bg); color: #ffffff; }
            .header { position: fixed; top: 0; left: 0; right: 0; z-index: 1000; background: rgba(0,0,0,0.95); }
            .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        `;
        
        // Create inline style tag for critical CSS
        const criticalStyleTag = document.createElement('style');
        criticalStyleTag.textContent = criticalStyles;
        document.head.insertBefore(criticalStyleTag, document.head.firstChild);
        
        this.optimizations.criticalCSS = 'inlined';
        this.performanceMonitor?.recordCustomMetric('optimization_applied', 'critical_css');
    }

    async setupResourceHints() {
        console.log('💡 Setting up resource hints...');
        
        // Preconnect to external domains
        const preconnectDomains = [
            'https://fonts.googleapis.com',
            'https://fonts.gstatic.com',
            'https://cdnjs.cloudflare.com'
        ];
        
        preconnectDomains.forEach(domain => {
            const link = document.createElement('link');
            link.rel = 'preconnect';
            link.href = domain;
            link.crossOrigin = 'anonymous';
            document.head.appendChild(link);
        });
        
        this.optimizations.resourceHints = 'implemented';
        this.performanceMonitor?.recordCustomMetric('optimization_applied', 'resource_hints');
    }

    async optimizeJavaScriptExecution() {
        console.log('⚡ Optimizing JavaScript execution...');
        
        // Defer non-critical scripts
        const nonCriticalScripts = document.querySelectorAll('script[src]:not([async]):not([defer])');
        
        nonCriticalScripts.forEach(script => {
            if (!script.src.includes('critical') && !script.src.includes('inline')) {
                script.defer = true;
            }
        });
        
        // Implement requestIdleCallback for non-urgent tasks
        if ('requestIdleCallback' in window) {
            this.scheduleNonUrgentTasks();
        }
        
        this.optimizations.jsOptimization = 'applied';
        this.performanceMonitor?.recordCustomMetric('optimization_applied', 'js_optimization');
    }

    async implementCaching() {
        console.log('🗄️ Implementing caching strategies...');
        
        // Set up intelligent caching for API responses
        if ('caches' in window) {
            try {
                const cache = await caches.open('blaze-intelligence-v1');
                
                // Pre-cache critical resources
                const criticalResources = [
                    '/',
                    '/js/error-handler.js',
                    '/js/performance-monitor.js',
                    '/js/api-wrapper.js'
                ];
                
                await cache.addAll(criticalResources);
                console.log('✅ Critical resources cached');
                
                this.optimizations.caching = 'implemented';
                this.performanceMonitor?.recordCustomMetric('optimization_applied', 'caching');
                
            } catch (error) {
                console.warn('⚠️ Cache implementation failed:', error);
            }
        }
    }

    lazyLoadScripts() {
        const nonCriticalScripts = [
            'https://cdnjs.cloudflare.com/ajax/libs/three.js/r158/three.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.2/ScrollTrigger.min.js'
        ];
        
        const loadScript = (src) => {
            return new Promise((resolve, reject) => {
                const script = document.createElement('script');
                script.src = src;
                script.async = true;
                script.onload = resolve;
                script.onerror = reject;
                document.head.appendChild(script);
            });
        };
        
        // Load scripts when user interacts or after initial load
        const loadNonCriticalScripts = () => {
            nonCriticalScripts.forEach(src => {
                loadScript(src).then(() => {
                    console.log('✅ Lazy loaded:', src);
                    this.performanceMonitor?.recordCustomMetric('script_lazy_loaded', src);
                }).catch(error => {
                    console.warn('❌ Failed to lazy load:', src, error);
                });
            });
        };
        
        // Trigger on first user interaction
        const interactionEvents = ['click', 'scroll', 'keydown', 'touchstart'];
        const triggerOnInteraction = () => {
            loadNonCriticalScripts();
            interactionEvents.forEach(event => {
                document.removeEventListener(event, triggerOnInteraction);
            });
        };
        
        interactionEvents.forEach(event => {
            document.addEventListener(event, triggerOnInteraction, { once: true, passive: true });
        });
        
        // Fallback: load after 3 seconds
        setTimeout(loadNonCriticalScripts, 3000);
    }

    scheduleNonUrgentTasks() {
        const nonUrgentTasks = [
            () => this.performanceMonitor?.recordCustomMetric('viewport_size', `${window.innerWidth}x${window.innerHeight}`),
            () => this.performanceMonitor?.recordCustomMetric('scroll_position', window.scrollY),
            () => this.cleanupUnusedResources()
        ];
        
        nonUrgentTasks.forEach(task => {
            requestIdleCallback(() => {
                try {
                    task();
                } catch (error) {
                    console.warn('Non-urgent task failed:', error);
                }
            }, { timeout: 5000 });
        });
    }

    cleanupUnusedResources() {
        // Remove unused stylesheets
        const stylesheets = document.querySelectorAll('link[rel="stylesheet"]');
        stylesheets.forEach(sheet => {
            if (sheet.sheet && sheet.sheet.cssRules.length === 0) {
                console.log('🧹 Removing unused stylesheet:', sheet.href);
                sheet.remove();
            }
        });
        
        // Clean up old performance entries
        if (performance.getEntriesByType) {
            const entries = performance.getEntriesByType('resource');
            if (entries.length > 500) {
                performance.clearResourceTimings();
                console.log('🧹 Cleared old performance entries');
            }
        }
    }

    // Public API
    getOptimizationStatus() {
        return {
            ...this.optimizations,
            timestamp: Date.now()
        };
    }

    async measurePerformanceImpact() {
        if (!this.performanceMonitor) return null;
        
        const metrics = this.performanceMonitor.getMetrics();
        const score = this.performanceMonitor.getPerformanceScore();
        
        return {
            performanceScore: score,
            webVitals: metrics.webVitals,
            optimizationsApplied: Object.keys(this.optimizations).length,
            optimizations: this.optimizations,
            timestamp: Date.now()
        };
    }
}

// Global instance
let blazeProductionOptimizer;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            blazeProductionOptimizer = new BlazeProductionOptimizer();
            window.blazeProductionOptimizer = blazeProductionOptimizer;
            
            console.log('✅ Blaze Production Optimizer loaded successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Production Optimizer:', error);
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeProductionOptimizer;
}