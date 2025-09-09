// Performance Monitoring and Optimization
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            renderTime: 0,
            apiLatency: {},
            errors: [],
            userInteractions: 0
        };
        this.startTime = performance.now();
        this.init();
    }

    init() {
        this.measurePageLoad();
        this.setupErrorTracking();
        this.setupPerformanceObserver();
        this.trackUserInteractions();
    }

    measurePageLoad() {
        window.addEventListener('load', () => {
            this.metrics.loadTime = performance.now() - this.startTime;
            this.reportMetric('page_load', this.metrics.loadTime);
        });

        // Measure Core Web Vitals
        this.measureLCP();
        this.measureCLS();
        this.measureINP();
    }

    measureLCP() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.reportMetric('lcp', entry.startTime);
                }
            });
            observer.observe({ type: 'largest-contentful-paint', buffered: true });
        }
    }

    measureCLS() {
        if ('PerformanceObserver' in window) {
            let clsValue = 0;
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                this.reportMetric('cls', clsValue);
            });
            observer.observe({ type: 'layout-shift', buffered: true });
        }
    }

    measureINP() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.reportMetric('inp', entry.processingStart - entry.startTime);
                }
            });
            observer.observe({ type: 'event', buffered: true });
        }
    }

    setupErrorTracking() {
        window.addEventListener('error', (event) => {
            this.metrics.errors.push({
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                timestamp: Date.now()
            });
            this.reportError('javascript_error', event.message);
        });

        window.addEventListener('unhandledrejection', (event) => {
            this.metrics.errors.push({
                message: event.reason?.toString() || 'Promise rejection',
                timestamp: Date.now()
            });
            this.reportError('unhandled_promise_rejection', event.reason);
        });
    }

    setupPerformanceObserver() {
        if ('PerformanceObserver' in window) {
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'navigation') {
                        this.metrics.renderTime = entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart;
                    }
                }
            });
            observer.observe({ type: 'navigation', buffered: true });
        }
    }

    trackUserInteractions() {
        ['click', 'scroll', 'keydown'].forEach(eventType => {
            document.addEventListener(eventType, () => {
                this.metrics.userInteractions++;
            }, { passive: true });
        });
    }

    // Track API latency
    async measureAPICall(url, fetchPromise) {
        const startTime = performance.now();
        try {
            const response = await fetchPromise;
            const endTime = performance.now();
            const latency = endTime - startTime;
            
            this.metrics.apiLatency[url] = {
                latency,
                status: response.status,
                timestamp: Date.now()
            };
            
            this.reportMetric('api_latency', latency, { url, status: response.status });
            return response;
        } catch (error) {
            const endTime = performance.now();
            const latency = endTime - startTime;
            
            this.metrics.apiLatency[url] = {
                latency,
                status: 'error',
                timestamp: Date.now(),
                error: error.message
            };
            
            this.reportError('api_error', error.message, { url });
            throw error;
        }
    }

    reportMetric(name, value, context = {}) {
        // Send to analytics endpoint
        if (this.shouldSample()) {
            fetch('/analytics/metrics', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    metric: name,
                    value,
                    context,
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                })
            }).catch(() => {}); // Silently fail
        }
    }

    reportError(type, message, context = {}) {
        fetch('/analytics/errors', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                type,
                message,
                context,
                timestamp: Date.now(),
                userAgent: navigator.userAgent,
                url: window.location.href
            })
        }).catch(() => {}); // Silently fail
    }

    shouldSample() {
        // Sample 10% of traffic to reduce load
        return Math.random() < 0.1;
    }

    // Get current performance summary
    getMetrics() {
        return {
            ...this.metrics,
            timestamp: Date.now(),
            url: window.location.href
        };
    }

    // Optimize resources
    preloadCriticalResources() {
        const criticalResources = [
            '/css/gateway.css',
            '/js/gatewayIntegration.js',
            '/js/mlbIntegration.js'
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource;
            link.as = resource.endsWith('.css') ? 'style' : 'script';
            document.head.appendChild(link);
        });
    }

    // Lazy load non-critical components
    setupLazyLoading() {
        if ('IntersectionObserver' in window) {
            const lazyElements = document.querySelectorAll('[data-lazy]');
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        this.loadLazyComponent(entry.target);
                        observer.unobserve(entry.target);
                    }
                });
            });

            lazyElements.forEach(el => observer.observe(el));
        }
    }

    loadLazyComponent(element) {
        const component = element.dataset.lazy;
        switch (component) {
            case 'nil-engine':
                import('/js/nilValuationEngine.js');
                break;
            case 'digital-combine':
                import('/js/digitalCombineDisplay.js');
                break;
        }
    }
}

// Initialize performance monitoring
document.addEventListener('DOMContentLoaded', () => {
    window.performanceMonitor = new PerformanceMonitor();
    window.performanceMonitor.preloadCriticalResources();
    window.performanceMonitor.setupLazyLoading();
});