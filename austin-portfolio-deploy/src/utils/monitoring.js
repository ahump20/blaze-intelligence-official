/**
 * Monitoring and Error Tracking Utilities
 * Provides error tracking, performance monitoring, and analytics
 */

class MonitoringService {
  constructor() {
    this.sentryInitialized = false;
    this.performanceMarks = new Map();
    this.errorQueue = [];
    this.isOnline = navigator.onLine;
    
    // Listen for online/offline events
    window.addEventListener('online', () => { this.isOnline = true; this.flushErrorQueue(); });
    window.addEventListener('offline', () => { this.isOnline = false; });
    
    // Initialize monitoring
    this.init();
  }

  async init() {
    try {
      // Initialize Sentry if DSN is available
      if (window.SENTRY_DSN || this.getSentryDsn()) {
        await this.initSentry();
      }
      
      // Set up performance monitoring
      this.initPerformanceMonitoring();
      
      // Set up error handlers
      this.initErrorHandlers();
      
      console.log('Monitoring service initialized');
    } catch (error) {
      console.error('Failed to initialize monitoring:', error);
    }
  }

  getSentryDsn() {
    // Check for Sentry DSN in environment
    return process?.env?.SENTRY_DSN || window.SENTRY_DSN;
  }

  async initSentry() {
    try {
      // Dynamically import Sentry only when needed
      const Sentry = await import('https://browser.sentry-cdn.com/7.81.1/bundle.tracing.min.js');
      
      Sentry.init({
        dsn: this.getSentryDsn(),
        environment: window.location.hostname.includes('localhost') ? 'development' : 'production',
        tracesSampleRate: 0.1, // 10% of transactions
        replaysSessionSampleRate: 0.1, // 10% of sessions
        replaysOnErrorSampleRate: 1.0, // 100% of sessions with errors
        integrations: [
          new Sentry.BrowserTracing({
            tracingOrigins: [
              'localhost',
              /^https:\/\/.*\.blaze-intelligence\.com/,
              /^https:\/\/.*\.pages\.dev/
            ]
          }),
          new Sentry.Replay()
        ],
        beforeSend(event) {
          // Filter out common non-critical errors
          if (event.exception) {
            const error = event.exception.values[0];
            if (error?.type === 'ChunkLoadError' || 
                error?.value?.includes('Loading chunk') ||
                error?.value?.includes('Script error')) {
              return null; // Don't send these errors
            }
          }
          return event;
        }
      });

      this.sentryInitialized = true;
      console.log('Sentry initialized');
    } catch (error) {
      console.warn('Failed to initialize Sentry:', error);
    }
  }

  initPerformanceMonitoring() {
    // Core Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      try {
        // Largest Contentful Paint (LCP)
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            this.trackMetric('LCP', entry.startTime, 'ms');
          }
        }).observe({ entryTypes: ['largest-contentful-paint'] });

        // First Input Delay (FID)
        new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries()) {
            this.trackMetric('FID', entry.processingStart - entry.startTime, 'ms');
          }
        }).observe({ entryTypes: ['first-input'] });

        // Cumulative Layout Shift (CLS)
        new PerformanceObserver((entryList) => {
          let clsValue = 0;
          for (const entry of entryList.getEntries()) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
            }
          }
          this.trackMetric('CLS', clsValue, 'score');
        }).observe({ entryTypes: ['layout-shift'] });

      } catch (error) {
        console.warn('Performance monitoring setup failed:', error);
      }
    }

    // Page load performance
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.getEntriesByType('navigation')[0];
        if (perfData) {
          this.trackMetric('PageLoad', perfData.loadEventEnd - perfData.fetchStart, 'ms');
          this.trackMetric('DOMContentLoaded', perfData.domContentLoadedEventEnd - perfData.fetchStart, 'ms');
          this.trackMetric('TimeToFirstByte', perfData.responseStart - perfData.fetchStart, 'ms');
        }
      }, 0);
    });
  }

  initErrorHandlers() {
    // Global error handler
    window.addEventListener('error', (event) => {
      this.captureError(new Error(event.message), {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        type: 'javascript'
      });
    });

    // Unhandled promise rejection handler
    window.addEventListener('unhandledrejection', (event) => {
      this.captureError(event.reason, {
        type: 'promise_rejection',
        promise: true
      });
    });

    // API error handler
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        
        // Track API performance
        if (args[0] && typeof args[0] === 'string') {
          const url = new URL(args[0], window.location.origin);
          this.trackAPICall(url.pathname, response.status, response.ok);
        }
        
        return response;
      } catch (error) {
        this.captureError(error, {
          type: 'api_error',
          url: args[0],
          method: args[1]?.method || 'GET'
        });
        throw error;
      }
    };
  }

  // Error tracking
  captureError(error, context = {}) {
    const errorData = {
      message: error.message || 'Unknown error',
      stack: error.stack,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userAgent: navigator.userAgent,
      context
    };

    if (this.sentryInitialized && window.Sentry) {
      window.Sentry.captureException(error, { extra: context });
    } else {
      // Queue for later or send to custom endpoint
      this.errorQueue.push(errorData);
      
      if (this.isOnline) {
        this.flushErrorQueue();
      }
    }

    // Log to console in development
    if (window.location.hostname.includes('localhost')) {
      console.error('Captured error:', errorData);
    }
  }

  // Performance tracking
  trackMetric(name, value, unit = '') {
    const metric = {
      name,
      value,
      unit,
      timestamp: new Date().toISOString(),
      url: window.location.pathname
    };

    if (this.sentryInitialized && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'performance',
        message: `${name}: ${value}${unit}`,
        level: 'info',
        data: metric
      });
    }

    // Send to custom analytics endpoint
    this.sendMetric(metric);

    console.log(`Performance metric - ${name}: ${value}${unit}`);
  }

  // API call tracking
  trackAPICall(endpoint, status, success) {
    const apiData = {
      endpoint,
      status,
      success,
      timestamp: new Date().toISOString()
    };

    if (this.sentryInitialized && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'api',
        message: `API call to ${endpoint}: ${status}`,
        level: success ? 'info' : 'error',
        data: apiData
      });
    }

    // Track failed API calls as errors
    if (!success) {
      this.captureError(new Error(`API call failed: ${endpoint} returned ${status}`), {
        type: 'api_error',
        endpoint,
        status
      });
    }
  }

  // Performance marks and measures
  startTiming(name) {
    const markName = `${name}-start`;
    performance.mark(markName);
    this.performanceMarks.set(name, markName);
  }

  endTiming(name) {
    const startMark = this.performanceMarks.get(name);
    if (startMark) {
      const endMark = `${name}-end`;
      performance.mark(endMark);
      performance.measure(name, startMark, endMark);
      
      const measure = performance.getEntriesByName(name, 'measure')[0];
      if (measure) {
        this.trackMetric(name, Math.round(measure.duration), 'ms');
      }
      
      this.performanceMarks.delete(name);
    }
  }

  // Custom event tracking
  trackEvent(category, action, label = '', value = 0) {
    const eventData = {
      category,
      action,
      label,
      value,
      timestamp: new Date().toISOString(),
      url: window.location.pathname
    };

    if (this.sentryInitialized && window.Sentry) {
      window.Sentry.addBreadcrumb({
        category: 'user_action',
        message: `${category}: ${action}`,
        level: 'info',
        data: eventData
      });
    }

    // Send to analytics
    this.sendEvent(eventData);
  }

  // User identification
  setUser(userData) {
    if (this.sentryInitialized && window.Sentry) {
      window.Sentry.setUser(userData);
    }
  }

  // Context setting
  setContext(key, context) {
    if (this.sentryInitialized && window.Sentry) {
      window.Sentry.setContext(key, context);
    }
  }

  // Send metrics to custom endpoint
  async sendMetric(metric) {
    if (!this.isOnline) return;

    try {
      // Only send to custom endpoint if available
      if (window.ANALYTICS_ENDPOINT) {
        await fetch(window.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'metric', data: metric })
        });
      }
    } catch (error) {
      console.warn('Failed to send metric:', error);
    }
  }

  // Send events to custom endpoint
  async sendEvent(event) {
    if (!this.isOnline) return;

    try {
      if (window.ANALYTICS_ENDPOINT) {
        await fetch(window.ANALYTICS_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'event', data: event })
        });
      }
    } catch (error) {
      console.warn('Failed to send event:', error);
    }
  }

  // Flush queued errors
  async flushErrorQueue() {
    if (!this.isOnline || this.errorQueue.length === 0) return;

    const errors = [...this.errorQueue];
    this.errorQueue = [];

    try {
      if (window.ERROR_ENDPOINT) {
        await fetch(window.ERROR_ENDPOINT, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ errors })
        });
      }
    } catch (error) {
      // Re-queue errors if sending fails
      this.errorQueue.push(...errors);
      console.warn('Failed to flush error queue:', error);
    }
  }

  // Health check
  async healthCheck() {
    const startTime = performance.now();
    
    try {
      const response = await fetch('/healthz');
      const endTime = performance.now();
      const responseTime = endTime - startTime;
      
      this.trackMetric('HealthCheck', Math.round(responseTime), 'ms');
      
      return {
        healthy: response.ok,
        responseTime: Math.round(responseTime),
        status: response.status
      };
    } catch (error) {
      this.captureError(error, { type: 'health_check' });
      return { healthy: false, error: error.message };
    }
  }
}

// Initialize global monitoring service
window.monitoring = new MonitoringService();

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MonitoringService;
}