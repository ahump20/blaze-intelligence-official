/**
 * Blaze Intelligence Analytics Pipeline
 * Tracks user behavior and interaction patterns
 */

class BlazeAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.events = [];
        this.startTime = Date.now();
        this.isEnabled = true;
        
        // Initialize tracking
        this.init();
    }

    generateSessionId() {
        return 'blaze_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        // Track page load
        this.track('page_load', {
            url: window.location.href,
            referrer: document.referrer,
            userAgent: navigator.userAgent,
            timestamp: new Date().toISOString()
        });

        // Track user interactions
        this.setupEventListeners();
        
        // Track session duration
        this.trackSessionDuration();
        
        // Send data periodically
        this.startPeriodicSync();
    }

    setupEventListeners() {
        // Click tracking
        document.addEventListener('click', (e) => {
            this.track('click', {
                element: e.target.tagName,
                className: e.target.className,
                id: e.target.id,
                text: e.target.textContent?.substring(0, 100),
                x: e.clientX,
                y: e.clientY
            });
        });

        // Page visibility
        document.addEventListener('visibilitychange', () => {
            this.track('visibility_change', {
                hidden: document.hidden
            });
        });

        // Scroll tracking
        let lastScrollTime = 0;
        window.addEventListener('scroll', () => {
            const now = Date.now();
            if (now - lastScrollTime > 1000) { // Throttle to once per second
                lastScrollTime = now;
                this.track('scroll', {
                    scrollY: window.scrollY,
                    scrollPercentage: Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100)
                });
            }
        });

        // Form interactions
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                this.track('form_interaction', {
                    fieldType: e.target.type,
                    fieldName: e.target.name,
                    fieldId: e.target.id
                });
            }
        });

        // Navigation tracking
        window.addEventListener('beforeunload', () => {
            this.track('page_unload', {
                timeOnPage: Date.now() - this.startTime
            });
            this.syncData(true); // Force immediate sync
        });
    }

    track(eventName, data = {}) {
        if (!this.isEnabled) return;

        const event = {
            id: Date.now() + '_' + Math.random().toString(36).substr(2, 9),
            sessionId: this.sessionId,
            eventName,
            timestamp: new Date().toISOString(),
            url: window.location.href,
            data: {
                ...data,
                viewport: {
                    width: window.innerWidth,
                    height: window.innerHeight
                }
            }
        };

        this.events.push(event);

        // Keep only last 100 events in memory
        if (this.events.length > 100) {
            this.events = this.events.slice(-100);
        }

        // Log to console in development
        if (process.env.NODE_ENV === 'development') {
            console.log('Analytics Event:', eventName, data);
        }
    }

    trackSessionDuration() {
        setInterval(() => {
            this.track('session_ping', {
                duration: Date.now() - this.startTime,
                eventsCount: this.events.length
            });
        }, 30000); // Every 30 seconds
    }

    startPeriodicSync() {
        // Send data every 2 minutes
        setInterval(() => {
            this.syncData();
        }, 120000);
    }

    async syncData(force = false) {
        if (!this.isEnabled || (!force && this.events.length === 0)) return;

        const payload = {
            sessionId: this.sessionId,
            events: [...this.events],
            metadata: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform,
                cookieEnabled: navigator.cookieEnabled,
                screen: {
                    width: screen.width,
                    height: screen.height,
                    colorDepth: screen.colorDepth
                }
            }
        };

        try {
            const response = await fetch('/analytics/metrics', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                // Clear events after successful sync
                this.events = [];
                console.log('Analytics data synced successfully');
            }
        } catch (error) {
            console.error('Failed to sync analytics data:', error);
        }
    }

    // Custom event tracking methods
    trackVideoPlay(videoId, duration) {
        this.track('video_play', { videoId, duration });
    }

    trackSearchQuery(query, resultsCount) {
        this.track('search', { query: query.substring(0, 100), resultsCount });
    }

    trackFileUpload(fileType, fileSize) {
        this.track('file_upload', { fileType, fileSize });
    }

    trackApiCall(endpoint, duration, success) {
        this.track('api_call', { endpoint, duration, success });
    }

    trackError(error, context) {
        this.track('error', {
            message: error.message,
            stack: error.stack?.substring(0, 500),
            context
        });
    }

    trackPerformance(metricName, value, unit = 'ms') {
        this.track('performance', { metricName, value, unit });
    }

    // User identification
    identify(userId, traits = {}) {
        this.track('identify', {
            userId,
            traits: {
                ...traits,
                identifiedAt: new Date().toISOString()
            }
        });
    }

    // Privacy controls
    disable() {
        this.isEnabled = false;
        console.log('Blaze Analytics disabled');
    }

    enable() {
        this.isEnabled = true;
        console.log('Blaze Analytics enabled');
    }

    // GDPR compliance
    clearData() {
        this.events = [];
        localStorage.removeItem('blaze_analytics_session');
        console.log('Analytics data cleared');
    }
}

// Initialize analytics
const analytics = new BlazeAnalytics();

// Global error tracking
window.addEventListener('error', (e) => {
    analytics.trackError(e.error, 'window_error');
});

window.addEventListener('unhandledrejection', (e) => {
    analytics.trackError(new Error(e.reason), 'unhandled_promise_rejection');
});

// Performance tracking
window.addEventListener('load', () => {
    // Track page load performance
    const navigation = performance.getEntriesByType('navigation')[0];
    if (navigation) {
        analytics.trackPerformance('page_load_time', navigation.loadEventEnd - navigation.fetchStart);
        analytics.trackPerformance('dom_content_loaded', navigation.domContentLoadedEventEnd - navigation.fetchStart);
        analytics.trackPerformance('first_byte', navigation.responseStart - navigation.fetchStart);
    }

    // Track largest contentful paint
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            analytics.trackPerformance('largest_contentful_paint', entry.startTime);
        }
    }).observe({ entryTypes: ['largest-contentful-paint'] });

    // Track first input delay
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            analytics.trackPerformance('first_input_delay', entry.processingStart - entry.startTime);
        }
    }).observe({ entryTypes: ['first-input'] });
});

// Export for global use
window.BlazeAnalytics = analytics;

// Expose tracking methods globally
window.trackEvent = (name, data) => analytics.track(name, data);
window.trackError = (error, context) => analytics.trackError(error, context);
window.trackPerformance = (name, value, unit) => analytics.trackPerformance(name, value, unit);