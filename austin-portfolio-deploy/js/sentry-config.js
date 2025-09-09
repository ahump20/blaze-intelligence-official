/**
 * Blaze Intelligence Sentry Error Tracking & Performance Monitoring
 * Captures errors, performance metrics, and user sessions
 */

// Sentry Configuration
window.BLAZE_SENTRY = {
    // Sentry DSN (Data Source Name)
    // Get this from your Sentry project settings
    DSN: 'https://YOUR_SENTRY_DSN@sentry.io/YOUR_PROJECT_ID', // TODO: Replace with actual DSN
    
    // Environment configuration
    ENVIRONMENT: window.location.hostname.includes('localhost') ? 'development' : 'production',
    
    // Release version
    RELEASE: 'blaze-intelligence@2.0.0',
    
    // Sample rates
    TRACES_SAMPLE_RATE: 0.1, // 10% of transactions
    REPLAYS_SESSION_SAMPLE_RATE: 0.1, // 10% of sessions
    REPLAYS_ON_ERROR_SAMPLE_RATE: 1.0, // 100% of sessions with errors
    
    // Performance thresholds (in milliseconds)
    PERFORMANCE_BUDGETS: {
        FCP: 1800, // First Contentful Paint
        LCP: 2500, // Largest Contentful Paint
        FID: 100,  // First Input Delay
        CLS: 0.1,  // Cumulative Layout Shift
        TTFB: 600  // Time to First Byte
    }
};

// Initialize Sentry
function initializeSentry() {
    // Check if Sentry SDK is loaded
    if (typeof Sentry === 'undefined') {
        // Load Sentry SDK
        const script = document.createElement('script');
        script.src = 'https://browser.sentry-cdn.com/7.0.0/bundle.tracing.replay.min.js';
        script.crossOrigin = 'anonymous';
        script.onload = () => configureSentry();
        document.head.appendChild(script);
    } else {
        configureSentry();
    }
}

// Configure Sentry with all integrations
function configureSentry() {
    if (typeof Sentry === 'undefined') return;
    
    Sentry.init({
        dsn: window.BLAZE_SENTRY.DSN,
        environment: window.BLAZE_SENTRY.ENVIRONMENT,
        release: window.BLAZE_SENTRY.RELEASE,
        
        // Performance Monitoring
        integrations: [
            new Sentry.BrowserTracing({
                // Navigation transactions
                routingInstrumentation: Sentry.reactRouterV6Instrumentation(
                    window.history,
                    ['/', '/demo', '/contact', '/api-docs']
                ),
                
                // Automatic instrumentation
                tracingOrigins: [
                    'localhost',
                    'blaze-intelligence.com',
                    /^\//
                ],
                
                // Track long tasks
                _experiments: {
                    enableLongTask: true,
                    enableInteractions: true
                }
            }),
            
            // Session Replay
            new Sentry.Replay({
                // Mask sensitive content
                maskAllText: false,
                blockAllMedia: false,
                
                // Privacy settings
                maskTextContent: false,
                maskInputOptions: {
                    password: true,
                    email: true
                },
                
                // Network recording
                networkDetailAllowUrls: [
                    window.location.origin
                ],
                networkCaptureBodies: true,
                networkRequestHeaders: ['X-API-Key'],
                networkResponseHeaders: ['Content-Type']
            })
        ],
        
        // Sample rates
        tracesSampleRate: window.BLAZE_SENTRY.TRACES_SAMPLE_RATE,
        replaysSessionSampleRate: window.BLAZE_SENTRY.REPLAYS_SESSION_SAMPLE_RATE,
        replaysOnErrorSampleRate: window.BLAZE_SENTRY.REPLAYS_ON_ERROR_SAMPLE_RATE,
        
        // Release health
        autoSessionTracking: true,
        
        // Filtering
        ignoreErrors: [
            // Browser extensions
            'top.GLOBALS',
            // Facebook errors
            'fb_xd_fragment',
            // Chrome extensions
            /extensions\//i,
            /^chrome:\/\//i,
            // Other noise
            'Non-Error promise rejection captured',
            'ResizeObserver loop limit exceeded'
        ],
        
        denyUrls: [
            // Facebook
            /graph\.facebook\.com/i,
            // Chrome extensions
            /extensions\//i,
            /^chrome:\/\//i
        ],
        
        // Breadcrumbs
        beforeBreadcrumb(breadcrumb, hint) {
            // Filter out noisy breadcrumbs
            if (breadcrumb.category === 'console' && breadcrumb.level === 'debug') {
                return null;
            }
            return breadcrumb;
        },
        
        // Process errors before sending
        beforeSend(event, hint) {
            // Add user context
            if (window.BLAZE_USER) {
                event.user = {
                    id: window.BLAZE_USER.id,
                    email: window.BLAZE_USER.email,
                    username: window.BLAZE_USER.username
                };
            }
            
            // Add custom context
            event.contexts = {
                ...event.contexts,
                blaze: {
                    version: window.BLAZE_SENTRY.RELEASE,
                    feature_flags: window.BLAZE_FEATURES || {},
                    ab_tests: window.BlazeAB ? window.BlazeAB.getUserTests() : {}
                }
            };
            
            // Don't send events in development unless explicitly enabled
            if (window.BLAZE_SENTRY.ENVIRONMENT === 'development' && !window.SENTRY_DEBUG) {
                console.log('Sentry Event (dev):', event);
                return null;
            }
            
            return event;
        }
    });
    
    // Set initial user context
    Sentry.setContext('blaze_intelligence', {
        platform: 'web',
        product: 'sports_analytics',
        api_version: 'v2'
    });
    
    // Add custom tags
    Sentry.setTags({
        page: window.location.pathname,
        browser: getBrowserInfo(),
        viewport: `${window.innerWidth}x${window.innerHeight}`
    });
    
    console.log('Sentry error tracking initialized');
}

// Track custom errors
function trackError(error, context = {}) {
    if (typeof Sentry !== 'undefined') {
        Sentry.captureException(error, {
            contexts: {
                blaze_error: context
            }
        });
    } else {
        console.error('Blaze Error:', error, context);
    }
}

// Track performance metrics
function trackPerformance(transaction, data = {}) {
    if (typeof Sentry !== 'undefined') {
        const txn = Sentry.startTransaction({
            name: transaction,
            data: data
        });
        
        Sentry.getCurrentHub().configureScope(scope => scope.setSpan(txn));
        
        return txn;
    }
    return null;
}

// Monitor Core Web Vitals
function monitorWebVitals() {
    // First Contentful Paint (FCP)
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (entry.name === 'first-contentful-paint') {
                const fcp = Math.round(entry.startTime);
                trackMetric('FCP', fcp);
                checkPerformanceBudget('FCP', fcp);
            }
        }
    }).observe({ entryTypes: ['paint'] });
    
    // Largest Contentful Paint (LCP)
    new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        const lcp = Math.round(lastEntry.renderTime || lastEntry.loadTime);
        trackMetric('LCP', lcp);
        checkPerformanceBudget('LCP', lcp);
    }).observe({ entryTypes: ['largest-contentful-paint'] });
    
    // First Input Delay (FID)
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            const fid = Math.round(entry.processingStart - entry.startTime);
            trackMetric('FID', fid);
            checkPerformanceBudget('FID', fid);
        }
    }).observe({ entryTypes: ['first-input'] });
    
    // Cumulative Layout Shift (CLS)
    let clsValue = 0;
    new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
            if (!entry.hadRecentInput) {
                clsValue += entry.value;
                trackMetric('CLS', clsValue);
                checkPerformanceBudget('CLS', clsValue);
            }
        }
    }).observe({ entryTypes: ['layout-shift'] });
    
    // Time to First Byte (TTFB)
    window.addEventListener('load', () => {
        const navTiming = performance.getEntriesByType('navigation')[0];
        if (navTiming) {
            const ttfb = Math.round(navTiming.responseStart - navTiming.requestStart);
            trackMetric('TTFB', ttfb);
            checkPerformanceBudget('TTFB', ttfb);
        }
    });
}

// Track custom metrics
function trackMetric(name, value, unit = 'ms') {
    if (typeof Sentry !== 'undefined') {
        Sentry.captureMessage(`Performance: ${name}`, {
            level: 'info',
            extra: {
                metric: name,
                value: value,
                unit: unit
            }
        });
    }
    
    // Also send to Analytics if available
    if (window.BlazeAnalytics) {
        window.BlazeAnalytics.track('performance_metric', {
            metric_name: name,
            metric_value: value,
            metric_unit: unit
        });
    }
    
    console.log(`Performance Metric - ${name}: ${value}${unit}`);
}

// Check performance budget
function checkPerformanceBudget(metric, value) {
    const budget = window.BLAZE_SENTRY.PERFORMANCE_BUDGETS[metric];
    if (budget && value > budget) {
        const exceeded = ((value - budget) / budget * 100).toFixed(1);
        
        trackError(new Error(`Performance budget exceeded: ${metric}`), {
            metric: metric,
            value: value,
            budget: budget,
            exceeded_by: `${exceeded}%`
        });
        
        console.warn(`⚠️ Performance Budget Exceeded - ${metric}: ${value} (budget: ${budget}, +${exceeded}%)`);
    }
}

// Monitor JavaScript errors
window.addEventListener('error', (event) => {
    trackError(event.error || new Error(event.message), {
        source: event.filename,
        line: event.lineno,
        column: event.colno
    });
});

// Monitor promise rejections
window.addEventListener('unhandledrejection', (event) => {
    trackError(new Error(event.reason), {
        type: 'unhandled_promise_rejection',
        promise: event.promise
    });
});

// Monitor resource loading errors
window.addEventListener('error', (event) => {
    if (event.target !== window) {
        trackError(new Error('Resource loading error'), {
            resource: event.target.src || event.target.href,
            type: event.target.tagName
        });
    }
}, true);

// Get browser information
function getBrowserInfo() {
    const ua = navigator.userAgent;
    if (ua.includes('Chrome')) return 'Chrome';
    if (ua.includes('Firefox')) return 'Firefox';
    if (ua.includes('Safari')) return 'Safari';
    if (ua.includes('Edge')) return 'Edge';
    return 'Unknown';
}

// Initialize uptime monitoring
function initUptimeMonitoring() {
    // Heartbeat check every 30 seconds
    setInterval(() => {
        fetch('/api/health')
            .then(response => {
                if (!response.ok) {
                    trackError(new Error('Health check failed'), {
                        status: response.status,
                        statusText: response.statusText
                    });
                }
            })
            .catch(error => {
                trackError(error, {
                    type: 'health_check_error'
                });
            });
    }, 30000);
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize Sentry
    initializeSentry();
    
    // Start monitoring after a short delay
    setTimeout(() => {
        monitorWebVitals();
        initUptimeMonitoring();
        
        console.log('Performance monitoring initialized');
    }, 1000);
});

// Export for use in other scripts
window.BlazeSentry = {
    trackError: trackError,
    trackPerformance: trackPerformance,
    trackMetric: trackMetric,
    initialize: initializeSentry
};