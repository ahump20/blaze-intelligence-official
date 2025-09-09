/**
 * Blaze Intelligence Performance Monitor & Telemetry System
 * Advanced performance tracking, metrics collection, and real-time monitoring
 */

class BlazePerformanceMonitor {
    constructor(options = {}) {
        this.config = {
            telemetryEndpoint: options.telemetryEndpoint || 'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/telemetry/performance',
            enableTelemetry: options.enableTelemetry !== false,
            enableConsoleLogging: options.enableConsoleLogging !== false,
            sampleRate: options.sampleRate || 0.1, // 10% sampling
            metricsInterval: options.metricsInterval || 30000, // 30 seconds
            thresholds: {
                cls: 0.1, // Cumulative Layout Shift
                fid: 100, // First Input Delay (ms)
                lcp: 2500, // Largest Contentful Paint (ms)
                fcp: 1800, // First Contentful Paint (ms)
                ttfb: 800, // Time to First Byte (ms)
                apiResponseTime: 5000, // API response threshold (ms)
                memoryUsage: 0.8 // 80% of heap limit
            }
        };
        
        this.metrics = {
            webVitals: {},
            customMetrics: {},
            apiPerformance: {},
            resourceTiming: {},
            navigationTiming: {},
            memoryUsage: {}
        };
        
        this.observers = {};
        this.telemetryQueue = [];
        this.sessionId = this.generateSessionId();
        this.startTime = performance.now();
        
        this.init();
    }

    init() {
        console.log('📊 Initializing Performance Monitor...');
        
        // Initialize performance observers
        this.initializeWebVitalsObservers();
        this.initializeResourceObserver();
        this.initializeNavigationObserver();
        this.initializeLongTaskObserver();
        
        // Start monitoring
        this.startPeriodicCollection();
        this.setupEventListeners();
        
        // Initial metrics collection
        this.collectInitialMetrics();
        
        console.log('✅ Performance Monitor initialized');
    }

    initializeWebVitalsObservers() {
        // Cumulative Layout Shift (CLS)
        if ('LayoutShift' in window) {
            this.observers.cls = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (!entry.hadRecentInput) {
                        this.metrics.webVitals.cls = (this.metrics.webVitals.cls || 0) + entry.value;
                        
                        if (this.metrics.webVitals.cls > this.config.thresholds.cls) {
                            this.recordPerformanceIssue('CLS', this.metrics.webVitals.cls, 'high');
                        }
                    }
                }
            });
            this.observers.cls.observe({ entryTypes: ['layout-shift'] });
        }

        // First Input Delay (FID)
        if ('PerformanceEventTiming' in window) {
            this.observers.fid = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.processingStart - entry.startTime > this.config.thresholds.fid) {
                        this.recordPerformanceIssue('FID', entry.processingStart - entry.startTime, 'medium');
                    }
                    this.metrics.webVitals.fid = entry.processingStart - entry.startTime;
                }
            });
            this.observers.fid.observe({ entryTypes: ['first-input'] });
        }

        // Largest Contentful Paint (LCP)
        this.observers.lcp = new PerformanceObserver((list) => {
            const entries = list.getEntries();
            const lastEntry = entries[entries.length - 1];
            
            this.metrics.webVitals.lcp = lastEntry.startTime;
            
            if (lastEntry.startTime > this.config.thresholds.lcp) {
                this.recordPerformanceIssue('LCP', lastEntry.startTime, 'medium');
            }
        });
        this.observers.lcp.observe({ entryTypes: ['largest-contentful-paint'] });

        // First Contentful Paint (FCP)
        this.observers.paint = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                if (entry.name === 'first-contentful-paint') {
                    this.metrics.webVitals.fcp = entry.startTime;
                    
                    if (entry.startTime > this.config.thresholds.fcp) {
                        this.recordPerformanceIssue('FCP', entry.startTime, 'low');
                    }
                }
            }
        });
        this.observers.paint.observe({ entryTypes: ['paint'] });
    }

    initializeResourceObserver() {
        this.observers.resource = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                const resourceType = entry.initiatorType;
                const duration = entry.responseEnd - entry.startTime;
                
                if (!this.metrics.resourceTiming[resourceType]) {
                    this.metrics.resourceTiming[resourceType] = {
                        count: 0,
                        totalDuration: 0,
                        maxDuration: 0,
                        avgDuration: 0
                    };
                }
                
                const resourceMetrics = this.metrics.resourceTiming[resourceType];
                resourceMetrics.count++;
                resourceMetrics.totalDuration += duration;
                resourceMetrics.maxDuration = Math.max(resourceMetrics.maxDuration, duration);
                resourceMetrics.avgDuration = resourceMetrics.totalDuration / resourceMetrics.count;
                
                // Check for slow resources
                if (duration > 5000) { // 5 seconds
                    this.recordPerformanceIssue('SLOW_RESOURCE', {
                        type: resourceType,
                        name: entry.name,
                        duration: duration
                    }, 'medium');
                }
            }
        });
        this.observers.resource.observe({ entryTypes: ['resource'] });
    }

    initializeNavigationObserver() {
        this.observers.navigation = new PerformanceObserver((list) => {
            for (const entry of list.getEntries()) {
                this.metrics.navigationTiming = {
                    domContentLoaded: entry.domContentLoadedEventEnd - entry.domContentLoadedEventStart,
                    loadComplete: entry.loadEventEnd - entry.loadEventStart,
                    domInteractive: entry.domInteractive - entry.startTime,
                    ttfb: entry.responseStart - entry.startTime,
                    transferSize: entry.transferSize,
                    encodedBodySize: entry.encodedBodySize
                };
                
                // Check TTFB threshold
                if (this.metrics.navigationTiming.ttfb > this.config.thresholds.ttfb) {
                    this.recordPerformanceIssue('TTFB', this.metrics.navigationTiming.ttfb, 'medium');
                }
            }
        });
        this.observers.navigation.observe({ entryTypes: ['navigation'] });
    }

    initializeLongTaskObserver() {
        if ('PerformanceLongTaskTiming' in window) {
            this.observers.longTask = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordPerformanceIssue('LONG_TASK', {
                        duration: entry.duration,
                        startTime: entry.startTime,
                        name: entry.name
                    }, 'high');
                }
            });
            this.observers.longTask.observe({ entryTypes: ['longtask'] });
        }
    }

    startPeriodicCollection() {
        setInterval(() => {
            this.collectMemoryMetrics();
            this.collectCustomMetrics();
            this.flushTelemetry();
        }, this.config.metricsInterval);
    }

    setupEventListeners() {
        // Track user interactions
        document.addEventListener('click', this.trackUserInteraction.bind(this));
        document.addEventListener('scroll', this.throttle(this.trackScroll.bind(this), 1000));
        
        // Track page visibility changes
        document.addEventListener('visibilitychange', () => {
            const isHidden = document.hidden;
            this.recordCustomMetric('page_visibility_change', {
                hidden: isHidden,
                timestamp: Date.now()
            });
        });

        // Track online/offline status
        window.addEventListener('online', () => {
            this.recordCustomMetric('network_status', { online: true, timestamp: Date.now() });
        });
        
        window.addEventListener('offline', () => {
            this.recordCustomMetric('network_status', { online: false, timestamp: Date.now() });
        });
    }

    collectInitialMetrics() {
        // Collect connection information
        if (navigator.connection) {
            this.recordCustomMetric('connection_info', {
                effectiveType: navigator.connection.effectiveType,
                downlink: navigator.connection.downlink,
                rtt: navigator.connection.rtt,
                saveData: navigator.connection.saveData
            });
        }

        // Collect device information
        this.recordCustomMetric('device_info', {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookieEnabled: navigator.cookieEnabled,
            onlineStatus: navigator.onLine,
            screenResolution: `${screen.width}x${screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`
        });
    }

    collectMemoryMetrics() {
        if (performance.memory) {
            const memoryInfo = {
                usedJSHeapSize: performance.memory.usedJSHeapSize,
                totalJSHeapSize: performance.memory.totalJSHeapSize,
                jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
                usageRatio: performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit
            };
            
            this.metrics.memoryUsage = memoryInfo;
            
            // Check memory usage threshold
            if (memoryInfo.usageRatio > this.config.thresholds.memoryUsage) {
                this.recordPerformanceIssue('HIGH_MEMORY_USAGE', memoryInfo, 'high');
            }
        }
    }

    collectCustomMetrics() {
        // Collect runtime metrics
        const now = performance.now();
        this.recordCustomMetric('session_duration', now - this.startTime);
        
        // Collect DOM metrics
        this.recordCustomMetric('dom_stats', {
            nodeCount: document.getElementsByTagName('*').length,
            scriptCount: document.scripts.length,
            linkCount: document.links.length,
            imageCount: document.images.length
        });
        
        // Collect error handler stats if available
        if (window.blazeErrorHandler) {
            const errorStats = window.blazeErrorHandler.getErrorStats();
            this.recordCustomMetric('error_stats', errorStats);
        }
        
        // Collect API wrapper stats if available
        if (window.blazeAPIWrapper) {
            const cacheStats = window.blazeAPIWrapper.getCacheStats();
            this.recordCustomMetric('api_cache_stats', cacheStats);
        }
    }

    // API Performance Tracking
    trackAPICall(endpoint, method, startTime, endTime, success, error) {
        const duration = endTime - startTime;
        const key = `${method} ${endpoint}`;
        
        if (!this.metrics.apiPerformance[key]) {
            this.metrics.apiPerformance[key] = {
                calls: 0,
                totalDuration: 0,
                avgDuration: 0,
                maxDuration: 0,
                minDuration: Infinity,
                successCount: 0,
                errorCount: 0,
                errors: []
            };
        }
        
        const apiMetrics = this.metrics.apiPerformance[key];
        apiMetrics.calls++;
        apiMetrics.totalDuration += duration;
        apiMetrics.avgDuration = apiMetrics.totalDuration / apiMetrics.calls;
        apiMetrics.maxDuration = Math.max(apiMetrics.maxDuration, duration);
        apiMetrics.minDuration = Math.min(apiMetrics.minDuration, duration);
        
        if (success) {
            apiMetrics.successCount++;
        } else {
            apiMetrics.errorCount++;
            apiMetrics.errors.push({
                error: error?.message || 'Unknown error',
                timestamp: Date.now(),
                duration: duration
            });
        }
        
        // Check API response time threshold
        if (duration > this.config.thresholds.apiResponseTime) {
            this.recordPerformanceIssue('SLOW_API', {
                endpoint: key,
                duration: duration,
                success: success
            }, 'medium');
        }
        
        this.log(`📊 API Call: ${key} - ${duration.toFixed(2)}ms - ${success ? 'SUCCESS' : 'ERROR'}`, 'info');
    }

    // Custom metric recording
    recordCustomMetric(name, value) {
        if (!this.metrics.customMetrics[name]) {
            this.metrics.customMetrics[name] = [];
        }
        
        this.metrics.customMetrics[name].push({
            value: value,
            timestamp: Date.now()
        });
        
        // Keep only last 100 entries per metric
        if (this.metrics.customMetrics[name].length > 100) {
            this.metrics.customMetrics[name].shift();
        }
    }

    recordPerformanceIssue(type, data, severity) {
        const issue = {
            type: type,
            data: data,
            severity: severity,
            timestamp: Date.now(),
            sessionId: this.sessionId,
            url: window.location.href
        };
        
        this.telemetryQueue.push({
            category: 'performance_issue',
            ...issue
        });
        
        this.log(`⚠️ Performance Issue: ${type} - ${JSON.stringify(data)}`, 'warn');
        
        // Dispatch custom event for real-time monitoring
        document.dispatchEvent(new CustomEvent('performanceIssue', { detail: issue }));
    }

    trackUserInteraction(event) {
        this.recordCustomMetric('user_interaction', {
            type: 'click',
            target: event.target.tagName,
            className: event.target.className,
            timestamp: Date.now()
        });
    }

    trackScroll() {
        this.recordCustomMetric('scroll_depth', {
            scrollY: window.scrollY,
            maxScroll: document.body.scrollHeight - window.innerHeight,
            percentage: (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
        });
    }

    // Telemetry
    async flushTelemetry() {
        if (!this.config.enableTelemetry || this.telemetryQueue.length === 0) return;
        
        // Sample telemetry data
        if (Math.random() > this.config.sampleRate && this.telemetryQueue.every(item => item.category !== 'performance_issue')) {
            this.telemetryQueue.length = 0; // Clear queue without sending
            return;
        }
        
        const batch = [...this.telemetryQueue];
        this.telemetryQueue.length = 0;
        
        const telemetryData = {
            sessionId: this.sessionId,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            metrics: {
                webVitals: this.metrics.webVitals,
                navigationTiming: this.metrics.navigationTiming,
                memoryUsage: this.metrics.memoryUsage,
                resourceTiming: this.summarizeResourceTiming(),
                apiPerformance: this.summarizeAPIPerformance()
            },
            events: batch,
            customMetrics: this.summarizeCustomMetrics()
        };
        
        try {
            await fetch(this.config.telemetryEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId
                },
                body: JSON.stringify(telemetryData)
            });
            
            this.log(`📊 Flushed ${batch.length} telemetry events`, 'info');
        } catch (error) {
            // Failed to send telemetry - put events back in queue
            this.telemetryQueue.unshift(...batch);
            this.log('❌ Failed to flush telemetry, events requeued', 'warn');
        }
    }

    summarizeResourceTiming() {
        const summary = {};
        for (const [type, metrics] of Object.entries(this.metrics.resourceTiming)) {
            summary[type] = {
                count: metrics.count,
                avgDuration: metrics.avgDuration,
                maxDuration: metrics.maxDuration
            };
        }
        return summary;
    }

    summarizeAPIPerformance() {
        const summary = {};
        for (const [endpoint, metrics] of Object.entries(this.metrics.apiPerformance)) {
            summary[endpoint] = {
                calls: metrics.calls,
                avgDuration: metrics.avgDuration,
                successRate: metrics.successCount / metrics.calls,
                errorCount: metrics.errorCount
            };
        }
        return summary;
    }

    summarizeCustomMetrics() {
        const summary = {};
        for (const [name, values] of Object.entries(this.metrics.customMetrics)) {
            if (values.length > 0) {
                const recentValues = values.slice(-10); // Last 10 values
                summary[name] = {
                    count: values.length,
                    recent: recentValues.map(v => v.value),
                    latest: values[values.length - 1].value
                };
            }
        }
        return summary;
    }

    // Utility functions
    throttle(func, limit) {
        let inThrottle;
        return function() {
            const args = arguments;
            const context = this;
            if (!inThrottle) {
                func.apply(context, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    generateSessionId() {
        return 'perf_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    log(message, level = 'info') {
        if (this.config.enableConsoleLogging) {
            console[level](`📊 [Blaze Performance] ${message}`);
        }
    }

    // Public API
    getMetrics() {
        return {
            ...this.metrics,
            sessionDuration: performance.now() - this.startTime,
            timestamp: Date.now()
        };
    }

    getPerformanceScore() {
        const vitals = this.metrics.webVitals;
        let score = 100;
        
        // Deduct points for poor web vitals
        if (vitals.cls > this.config.thresholds.cls) score -= 20;
        if (vitals.fid > this.config.thresholds.fid) score -= 15;
        if (vitals.lcp > this.config.thresholds.lcp) score -= 25;
        if (vitals.fcp > this.config.thresholds.fcp) score -= 10;
        
        // Deduct points for memory usage
        if (this.metrics.memoryUsage.usageRatio > this.config.thresholds.memoryUsage) {
            score -= 15;
        }
        
        return Math.max(0, score);
    }

    clearMetrics() {
        this.metrics = {
            webVitals: {},
            customMetrics: {},
            apiPerformance: {},
            resourceTiming: {},
            navigationTiming: {},
            memoryUsage: {}
        };
        this.startTime = performance.now();
        this.log('🧹 Performance metrics cleared', 'info');
    }
}

// Global instance
let blazePerformanceMonitor;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            blazePerformanceMonitor = new BlazePerformanceMonitor({
                enableTelemetry: true,
                enableConsoleLogging: true,
                sampleRate: 0.1
            });

            window.blazePerformanceMonitor = blazePerformanceMonitor;
            
            console.log('✅ Blaze Performance Monitor loaded successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Blaze Performance Monitor:', error);
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazePerformanceMonitor;
}