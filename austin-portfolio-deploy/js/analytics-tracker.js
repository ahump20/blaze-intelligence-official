/**
 * Blaze Intelligence Analytics Tracker
 * Comprehensive analytics and monitoring system
 * Tracks user behavior, performance metrics, and business KPIs
 */

class BlazeAnalytics {
    constructor() {
        this.config = {
            trackingId: 'BLAZE-001',
            apiEndpoint: 'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/analytics',
            sessionTimeout: 30 * 60 * 1000, // 30 minutes
            batchSize: 20,
            flushInterval: 10000, // 10 seconds
            enabledTrackers: {
                pageViews: true,
                events: true,
                performance: true,
                errors: true,
                custom: true,
                heatmap: true,
                userFlow: true
            }
        };

        this.session = {
            id: this.generateSessionId(),
            startTime: Date.now(),
            pageViews: 0,
            events: [],
            userId: this.getUserId()
        };

        this.queue = [];
        this.metrics = {
            pageViews: 0,
            uniqueVisitors: new Set(),
            totalEvents: 0,
            errorCount: 0,
            avgSessionDuration: 0,
            bounceRate: 0,
            conversionRate: 0
        };

        this.heatmapData = [];
        this.userFlow = [];
        
        this.init();
    }

    init() {
        console.log('📊 Initializing Blaze Analytics...');
        
        // Set up tracking
        this.setupPageTracking();
        this.setupEventTracking();
        this.setupPerformanceTracking();
        this.setupErrorTracking();
        this.setupHeatmapTracking();
        this.setupUserFlowTracking();
        
        // Start batch processing
        this.startBatchProcessor();
        
        // Handle page unload
        this.setupUnloadHandler();
        
        // Load saved metrics
        this.loadSavedMetrics();
        
        console.log('✅ Analytics tracking initialized');
        
        // Track initial page view
        this.trackPageView();
    }

    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    getUserId() {
        let userId = localStorage.getItem('blaze_user_id');
        if (!userId) {
            userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            localStorage.setItem('blaze_user_id', userId);
        }
        return userId;
    }

    // Page tracking
    setupPageTracking() {
        // Track navigation
        const originalPushState = history.pushState;
        const originalReplaceState = history.replaceState;
        
        history.pushState = (...args) => {
            originalPushState.apply(history, args);
            this.trackPageView();
        };
        
        history.replaceState = (...args) => {
            originalReplaceState.apply(history, args);
            this.trackPageView();
        };
        
        window.addEventListener('popstate', () => {
            this.trackPageView();
        });
        
        // Track time on page
        this.pageStartTime = Date.now();
        window.addEventListener('beforeunload', () => {
            const timeOnPage = Date.now() - this.pageStartTime;
            this.track('page_exit', {
                url: window.location.href,
                timeOnPage,
                scrollDepth: this.getScrollDepth()
            });
        });
    }

    trackPageView(customData = {}) {
        if (!this.config.enabledTrackers.pageViews) return;
        
        const pageData = {
            type: 'pageview',
            url: window.location.href,
            path: window.location.pathname,
            title: document.title,
            referrer: document.referrer,
            timestamp: Date.now(),
            sessionId: this.session.id,
            userId: this.session.userId,
            ...customData
        };
        
        this.session.pageViews++;
        this.metrics.pageViews++;
        this.metrics.uniqueVisitors.add(this.session.userId);
        
        this.addToQueue(pageData);
        
        // Update user flow
        this.updateUserFlow(window.location.pathname);
        
        console.log('📄 Page view tracked:', pageData.path);
    }

    // Event tracking
    setupEventTracking() {
        // Click tracking
        document.addEventListener('click', (e) => {
            const target = e.target.closest('a, button, [data-track]');
            if (target) {
                const trackData = {
                    element: target.tagName,
                    text: target.textContent?.substring(0, 50),
                    href: target.href,
                    classes: target.className,
                    dataTrack: target.dataset.track
                };
                
                this.track('click', trackData);
                
                // Track heatmap data
                this.trackHeatmapClick(e.clientX, e.clientY);
            }
        });
        
        // Form tracking
        document.addEventListener('submit', (e) => {
            const form = e.target;
            this.track('form_submit', {
                formId: form.id,
                formName: form.name,
                formAction: form.action,
                fields: Array.from(form.elements).map(el => el.name).filter(Boolean)
            });
        });
        
        // Scroll tracking
        let scrollTimeout;
        let maxScroll = 0;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            const scrollPercent = this.getScrollDepth();
            maxScroll = Math.max(maxScroll, scrollPercent);
            
            scrollTimeout = setTimeout(() => {
                this.track('scroll', {
                    depth: maxScroll,
                    url: window.location.href
                });
            }, 1000);
        });
    }

    track(eventName, eventData = {}) {
        if (!this.config.enabledTrackers.events) return;
        
        const event = {
            type: 'event',
            name: eventName,
            data: eventData,
            timestamp: Date.now(),
            sessionId: this.session.id,
            userId: this.session.userId,
            url: window.location.href
        };
        
        this.session.events.push(event);
        this.metrics.totalEvents++;
        
        this.addToQueue(event);
        
        console.log('🎯 Event tracked:', eventName);
    }

    // Performance tracking
    setupPerformanceTracking() {
        if (!this.config.enabledTrackers.performance) return;
        
        // Wait for page load
        window.addEventListener('load', () => {
            setTimeout(() => {
                const perfData = this.collectPerformanceMetrics();
                this.track('performance', perfData);
            }, 0);
        });
        
        // Track Web Vitals
        if ('PerformanceObserver' in window) {
            // Largest Contentful Paint
            try {
                const lcpObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    const lastEntry = entries[entries.length - 1];
                    this.track('web_vital_lcp', {
                        value: lastEntry.renderTime || lastEntry.loadTime,
                        element: lastEntry.element?.tagName
                    });
                });
                lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
            } catch (e) {}
            
            // First Input Delay
            try {
                const fidObserver = new PerformanceObserver((list) => {
                    const entries = list.getEntries();
                    entries.forEach(entry => {
                        this.track('web_vital_fid', {
                            value: entry.processingStart - entry.startTime,
                            eventType: entry.name
                        });
                    });
                });
                fidObserver.observe({ entryTypes: ['first-input'] });
            } catch (e) {}
            
            // Cumulative Layout Shift
            let clsValue = 0;
            try {
                const clsObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (!entry.hadRecentInput) {
                            clsValue += entry.value;
                        }
                    }
                });
                clsObserver.observe({ entryTypes: ['layout-shift'] });
                
                // Report CLS when page is hidden
                document.addEventListener('visibilitychange', () => {
                    if (document.hidden) {
                        this.track('web_vital_cls', { value: clsValue });
                    }
                });
            } catch (e) {}
        }
    }

    collectPerformanceMetrics() {
        const metrics = {};
        
        if (window.performance && window.performance.timing) {
            const timing = window.performance.timing;
            
            metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
            metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
            metrics.firstByte = timing.responseStart - timing.navigationStart;
            metrics.dnsLookup = timing.domainLookupEnd - timing.domainLookupStart;
            metrics.tcpConnect = timing.connectEnd - timing.connectStart;
            metrics.request = timing.responseStart - timing.requestStart;
            metrics.response = timing.responseEnd - timing.responseStart;
            metrics.domProcessing = timing.domComplete - timing.domLoading;
        }
        
        // Memory usage
        if (performance.memory) {
            metrics.memory = {
                used: performance.memory.usedJSHeapSize,
                total: performance.memory.totalJSHeapSize,
                limit: performance.memory.jsHeapSizeLimit
            };
        }
        
        // Resource timing
        const resources = performance.getEntriesByType('resource');
        metrics.resources = {
            count: resources.length,
            totalSize: resources.reduce((sum, r) => sum + (r.transferSize || 0), 0),
            totalDuration: resources.reduce((sum, r) => sum + r.duration, 0)
        };
        
        return metrics;
    }

    // Error tracking
    setupErrorTracking() {
        if (!this.config.enabledTrackers.errors) return;
        
        // JavaScript errors
        window.addEventListener('error', (event) => {
            this.trackError({
                message: event.message,
                filename: event.filename,
                line: event.lineno,
                column: event.colno,
                stack: event.error?.stack
            });
        });
        
        // Promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.trackError({
                message: 'Unhandled promise rejection',
                reason: event.reason,
                promise: event.promise
            });
        });
        
        // Resource load errors
        window.addEventListener('error', (event) => {
            if (event.target !== window) {
                this.trackError({
                    message: 'Resource load error',
                    resource: event.target.src || event.target.href,
                    type: event.target.tagName
                });
            }
        }, true);
    }

    trackError(errorData) {
        const error = {
            type: 'error',
            ...errorData,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: this.session.id,
            userId: this.session.userId
        };
        
        this.metrics.errorCount++;
        this.addToQueue(error);
        
        console.error('❌ Error tracked:', errorData.message);
    }

    // Heatmap tracking
    setupHeatmapTracking() {
        if (!this.config.enabledTrackers.heatmap) return;
        
        // Throttle tracking to avoid too many events
        let heatmapTimeout;
        document.addEventListener('mousemove', (e) => {
            clearTimeout(heatmapTimeout);
            heatmapTimeout = setTimeout(() => {
                this.heatmapData.push({
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: Date.now(),
                    url: window.location.href
                });
                
                // Limit heatmap data size
                if (this.heatmapData.length > 1000) {
                    this.flushHeatmapData();
                }
            }, 100);
        });
    }

    trackHeatmapClick(x, y) {
        this.track('heatmap_click', {
            x,
            y,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        });
    }

    flushHeatmapData() {
        if (this.heatmapData.length === 0) return;
        
        this.track('heatmap_data', {
            points: this.heatmapData,
            viewportWidth: window.innerWidth,
            viewportHeight: window.innerHeight
        });
        
        this.heatmapData = [];
    }

    // User flow tracking
    setupUserFlowTracking() {
        if (!this.config.enabledTrackers.userFlow) return;
        
        // Track user journey through the site
        this.userFlow = JSON.parse(sessionStorage.getItem('blaze_user_flow') || '[]');
    }

    updateUserFlow(path) {
        this.userFlow.push({
            path,
            timestamp: Date.now(),
            title: document.title
        });
        
        // Keep last 50 pages
        if (this.userFlow.length > 50) {
            this.userFlow.shift();
        }
        
        sessionStorage.setItem('blaze_user_flow', JSON.stringify(this.userFlow));
    }

    // Custom tracking
    trackCustom(metricName, value, metadata = {}) {
        if (!this.config.enabledTrackers.custom) return;
        
        const customEvent = {
            type: 'custom',
            metric: metricName,
            value,
            metadata,
            timestamp: Date.now(),
            sessionId: this.session.id,
            userId: this.session.userId
        };
        
        this.addToQueue(customEvent);
        
        console.log('📈 Custom metric tracked:', metricName, value);
    }

    // Goal tracking
    trackGoal(goalName, goalValue = 1, metadata = {}) {
        this.track('goal_completion', {
            goal: goalName,
            value: goalValue,
            ...metadata
        });
        
        // Update conversion rate
        this.updateConversionRate(goalName);
    }

    updateConversionRate(goalName) {
        const conversions = JSON.parse(localStorage.getItem('blaze_conversions') || '{}');
        conversions[goalName] = (conversions[goalName] || 0) + 1;
        localStorage.setItem('blaze_conversions', JSON.stringify(conversions));
        
        // Calculate conversion rate
        const totalSessions = parseInt(localStorage.getItem('blaze_total_sessions') || '0');
        if (totalSessions > 0) {
            const totalConversions = Object.values(conversions).reduce((sum, count) => sum + count, 0);
            this.metrics.conversionRate = (totalConversions / totalSessions) * 100;
        }
    }

    // Queue management
    addToQueue(data) {
        this.queue.push(data);
        
        // Flush if batch size reached
        if (this.queue.length >= this.config.batchSize) {
            this.flush();
        }
    }

    startBatchProcessor() {
        setInterval(() => {
            if (this.queue.length > 0) {
                this.flush();
            }
        }, this.config.flushInterval);
    }

    async flush() {
        if (this.queue.length === 0) return;
        
        const batch = [...this.queue];
        this.queue = [];
        
        try {
            // Send to analytics endpoint
            await this.sendAnalytics(batch);
            
            // Update local metrics
            this.updateLocalMetrics(batch);
            
            console.log(`📤 Sent ${batch.length} analytics events`);
        } catch (error) {
            // Re-add to queue on failure
            this.queue.unshift(...batch);
            console.error('Failed to send analytics:', error);
        }
    }

    async sendAnalytics(data) {
        // In production, send to real endpoint
        if (this.config.apiEndpoint) {
            const response = await fetch(this.config.apiEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Tracking-Id': this.config.trackingId
                },
                body: JSON.stringify({
                    events: data,
                    session: this.session,
                    timestamp: Date.now()
                })
            });
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}`);
            }
        }
        
        // For development, just log
        console.log('Analytics batch:', data);
    }

    updateLocalMetrics(batch) {
        // Save to localStorage for persistence
        const storedMetrics = JSON.parse(localStorage.getItem('blaze_analytics_metrics') || '{}');
        
        batch.forEach(event => {
            const date = new Date(event.timestamp).toISOString().split('T')[0];
            
            if (!storedMetrics[date]) {
                storedMetrics[date] = {
                    pageViews: 0,
                    events: 0,
                    errors: 0,
                    users: new Set()
                };
            }
            
            if (event.type === 'pageview') {
                storedMetrics[date].pageViews++;
            } else if (event.type === 'event') {
                storedMetrics[date].events++;
            } else if (event.type === 'error') {
                storedMetrics[date].errors++;
            }
            
            storedMetrics[date].users.add(event.userId);
        });
        
        // Convert Sets to Arrays for storage
        Object.keys(storedMetrics).forEach(date => {
            if (storedMetrics[date].users instanceof Set) {
                storedMetrics[date].users = Array.from(storedMetrics[date].users);
            }
        });
        
        localStorage.setItem('blaze_analytics_metrics', JSON.stringify(storedMetrics));
    }

    loadSavedMetrics() {
        const storedMetrics = JSON.parse(localStorage.getItem('blaze_analytics_metrics') || '{}');
        
        // Calculate aggregate metrics
        let totalPageViews = 0;
        let totalEvents = 0;
        let totalErrors = 0;
        const uniqueUsers = new Set();
        
        Object.values(storedMetrics).forEach(dayMetrics => {
            totalPageViews += dayMetrics.pageViews || 0;
            totalEvents += dayMetrics.events || 0;
            totalErrors += dayMetrics.errors || 0;
            
            if (Array.isArray(dayMetrics.users)) {
                dayMetrics.users.forEach(user => uniqueUsers.add(user));
            }
        });
        
        this.metrics.pageViews = totalPageViews;
        this.metrics.totalEvents = totalEvents;
        this.metrics.errorCount = totalErrors;
        this.metrics.uniqueVisitors = uniqueUsers;
        
        // Update session count
        const totalSessions = parseInt(localStorage.getItem('blaze_total_sessions') || '0') + 1;
        localStorage.setItem('blaze_total_sessions', totalSessions.toString());
    }

    // Utility methods
    getScrollDepth() {
        const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        return Math.round((scrollTop / scrollHeight) * 100);
    }

    setupUnloadHandler() {
        window.addEventListener('beforeunload', () => {
            // Flush remaining events
            this.flush();
            
            // Save session data
            const sessionDuration = Date.now() - this.session.startTime;
            this.track('session_end', {
                duration: sessionDuration,
                pageViews: this.session.pageViews,
                eventCount: this.session.events.length
            });
            
            // Update bounce rate
            if (this.session.pageViews === 1) {
                const bounces = parseInt(localStorage.getItem('blaze_bounces') || '0') + 1;
                localStorage.setItem('blaze_bounces', bounces.toString());
            }
            
            // Flush heatmap data
            this.flushHeatmapData();
        });
    }

    // Public API
    getMetrics() {
        return {
            ...this.metrics,
            uniqueVisitors: this.metrics.uniqueVisitors.size,
            currentSession: {
                id: this.session.id,
                duration: Date.now() - this.session.startTime,
                pageViews: this.session.pageViews,
                events: this.session.events.length
            }
        };
    }

    getReport() {
        const metrics = this.getMetrics();
        const storedMetrics = JSON.parse(localStorage.getItem('blaze_analytics_metrics') || '{}');
        
        return {
            summary: metrics,
            dailyMetrics: storedMetrics,
            userFlow: this.userFlow,
            topEvents: this.getTopEvents(),
            recommendations: this.getRecommendations()
        };
    }

    getTopEvents() {
        const eventCounts = {};
        
        this.session.events.forEach(event => {
            if (event.name) {
                eventCounts[event.name] = (eventCounts[event.name] || 0) + 1;
            }
        });
        
        return Object.entries(eventCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([name, count]) => ({ name, count }));
    }

    getRecommendations() {
        const recommendations = [];
        const metrics = this.getMetrics();
        
        if (metrics.bounceRate > 50) {
            recommendations.push('High bounce rate detected. Consider improving page load time and content relevance.');
        }
        
        if (metrics.errorCount > 10) {
            recommendations.push('Multiple errors detected. Review error logs and fix critical issues.');
        }
        
        if (metrics.conversionRate < 2) {
            recommendations.push('Low conversion rate. Optimize CTAs and user flow.');
        }
        
        if (this.userFlow.length < 3) {
            recommendations.push('Short user sessions. Improve content engagement and navigation.');
        }
        
        return recommendations;
    }
}

// Global instance
let blazeAnalytics;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    // Initialize immediately to catch early events
    blazeAnalytics = new BlazeAnalytics();
    window.blazeAnalytics = blazeAnalytics;
    
    // Additional setup after DOM ready
    document.addEventListener('DOMContentLoaded', () => {
        console.log('📊 Analytics Report:', blazeAnalytics.getReport());
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeAnalytics;
}