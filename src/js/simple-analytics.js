// Simple Analytics for Streamlined Blaze Intelligence Site
// Track page performance and user interactions

class BlazeAnalytics {
    constructor() {
        this.startTime = performance.now();
        this.sessionId = this.generateSessionId();
        this.init();
    }
    
    generateSessionId() {
        return 'blaze_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
    }
    
    init() {
        // Track page load performance
        window.addEventListener('load', () => {
            this.trackPageLoad();
        });
        
        // Track page visibility
        document.addEventListener('visibilitychange', () => {
            this.trackVisibility();
        });
        
        // Track CTA clicks
        this.trackCTAClicks();
        
        // Track navigation usage
        this.trackNavigation();
    }
    
    trackPageLoad() {
        const loadTime = performance.now() - this.startTime;
        const navigation = performance.getEntriesByType('navigation')[0];
        
        const metrics = {
            page: window.location.pathname,
            loadTime: Math.round(loadTime),
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            firstContentfulPaint: this.getFCP(),
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent.substr(0, 100), // Truncated for privacy
            referrer: document.referrer || 'direct',
            viewportSize: `${window.innerWidth}x${window.innerHeight}`
        };
        
        this.sendAnalytics('page_load', metrics);
    }
    
    getFCP() {
        try {
            const fcpEntry = performance.getEntriesByType('paint')
                .find(entry => entry.name === 'first-contentful-paint');
            return fcpEntry ? Math.round(fcpEntry.startTime) : null;
        } catch (e) {
            return null;
        }
    }
    
    trackVisibility() {
        const isVisible = !document.hidden;
        this.sendAnalytics('visibility_change', {
            visible: isVisible,
            page: window.location.pathname,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
        });
    }
    
    trackCTAClicks() {
        // Track clicks on our key CTA buttons
        document.addEventListener('click', (e) => {
            const target = e.target.closest('.cta-button, .contact-link, .pricing-card a');
            if (target) {
                this.sendAnalytics('cta_click', {
                    buttonText: target.textContent.trim(),
                    buttonHref: target.href || target.getAttribute('href') || 'no-href',
                    page: window.location.pathname,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }
    
    trackNavigation() {
        // Track navigation usage
        document.addEventListener('click', (e) => {
            const navLink = e.target.closest('nav a, .nav a');
            if (navLink) {
                this.sendAnalytics('nav_click', {
                    linkText: navLink.textContent.trim(),
                    linkHref: navLink.href || navLink.getAttribute('href'),
                    page: window.location.pathname,
                    sessionId: this.sessionId,
                    timestamp: new Date().toISOString()
                });
            }
        });
    }
    
    sendAnalytics(event, data) {
        // For now, just console.log - in production this would send to your analytics service
        console.log(`📊 Blaze Analytics: ${event}`, data);
        
        // Optional: Send to analytics endpoint
        // fetch('/api/analytics', {
        //     method: 'POST',
        //     headers: { 'Content-Type': 'application/json' },
        //     body: JSON.stringify({ event, data })
        // }).catch(err => console.warn('Analytics failed:', err));
    }
    
    // Track custom events
    track(eventName, eventData = {}) {
        this.sendAnalytics(eventName, {
            ...eventData,
            page: window.location.pathname,
            sessionId: this.sessionId,
            timestamp: new Date().toISOString()
        });
    }
}

// Initialize analytics on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.blazeAnalytics = new BlazeAnalytics();
    });
} else {
    window.blazeAnalytics = new BlazeAnalytics();
}

// Export for manual tracking
window.trackEvent = (eventName, eventData) => {
    if (window.blazeAnalytics) {
        window.blazeAnalytics.track(eventName, eventData);
    }
};