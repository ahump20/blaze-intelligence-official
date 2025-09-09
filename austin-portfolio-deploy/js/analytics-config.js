/**
 * Blaze Intelligence Analytics Configuration
 * Google Analytics 4 + Custom Event Tracking
 */

// GA4 Configuration
window.BLAZE_ANALYTICS = {
    // Google Analytics Measurement ID
    // Replace with your actual GA4 measurement ID from Google Analytics
    GA_MEASUREMENT_ID: 'G-XXXXXXXXXX', // TODO: Replace with actual ID
    
    // Enable debug mode for testing
    DEBUG_MODE: false,
    
    // Custom dimensions for sports analytics tracking
    CUSTOM_DIMENSIONS: {
        sport_type: 'dimension1',
        team_name: 'dimension2',
        user_type: 'dimension3',
        feature_accessed: 'dimension4'
    },
    
    // Conversion events to track
    CONVERSION_EVENTS: {
        demo_request: { value: 100, currency: 'USD' },
        contact_form_submit: { value: 50, currency: 'USD' },
        calculator_complete: { value: 25, currency: 'USD' },
        trial_signup: { value: 200, currency: 'USD' },
        api_key_request: { value: 150, currency: 'USD' },
        blog_subscribe: { value: 10, currency: 'USD' },
        video_view: { value: 5, currency: 'USD' },
        video_complete: { value: 15, currency: 'USD' },
        transcript_view: { value: 3, currency: 'USD' }
    },
    
    // Video tracking events
    VIDEO_EVENTS: {
        video_page_view: 'video_page_view',
        video_card_click: 'video_card_click',
        watch_strip_impression: 'watch_strip_impression',
        transcript_click: 'transcript_click',
        video_25_percent: 'video_25_percent',
        video_50_percent: 'video_50_percent',
        video_75_percent: 'video_75_percent',
        video_complete: 'video_complete'
    },
    
    // Enhanced ecommerce settings
    ECOMMERCE: {
        currency: 'USD',
        tax: 0,
        shipping: 0
    }
};

// Initialize Google Analytics
function initializeAnalytics() {
    // Check if GA is already loaded
    if (typeof gtag === 'undefined') {
        // Load GA4 script
        const script = document.createElement('script');
        script.async = true;
        script.src = `https://www.googletagmanager.com/gtag/js?id=${window.BLAZE_ANALYTICS.GA_MEASUREMENT_ID}`;
        document.head.appendChild(script);
        
        // Initialize dataLayer and gtag
        window.dataLayer = window.dataLayer || [];
        window.gtag = function() { dataLayer.push(arguments); }
        gtag('js', new Date());
        
        // Configure GA4 with enhanced measurement
        gtag('config', window.BLAZE_ANALYTICS.GA_MEASUREMENT_ID, {
            'page_title': document.title,
            'page_path': window.location.pathname,
            'debug_mode': window.BLAZE_ANALYTICS.DEBUG_MODE,
            'custom_map': window.BLAZE_ANALYTICS.CUSTOM_DIMENSIONS,
            'currency': window.BLAZE_ANALYTICS.ECOMMERCE.currency,
            'send_page_view': true,
            'anonymize_ip': true,
            'link_attribution': true,
            'allow_google_signals': true,
            'allow_ad_personalization_signals': false
        });
        
        // Set user properties
        gtag('set', 'user_properties', {
            'platform': 'web',
            'product': 'blaze_intelligence'
        });
        
        console.log('Google Analytics initialized');
    }
}

// Track custom events
function trackEvent(eventName, parameters = {}) {
    if (typeof gtag !== 'undefined') {
        // Check if it's a conversion event
        const conversionConfig = window.BLAZE_ANALYTICS.CONVERSION_EVENTS[eventName];
        if (conversionConfig) {
            parameters = { ...parameters, ...conversionConfig };
        }
        
        // Send event to GA4
        gtag('event', eventName, {
            'event_category': parameters.category || 'engagement',
            'event_label': parameters.label || '',
            'value': parameters.value || 0,
            ...parameters
        });
        
        if (window.BLAZE_ANALYTICS.DEBUG_MODE) {
            console.log('Event tracked:', eventName, parameters);
        }
    }
}

// Track enhanced ecommerce events
function trackEcommerce(action, data) {
    if (typeof gtag !== 'undefined') {
        gtag('event', action, {
            'currency': window.BLAZE_ANALYTICS.ECOMMERCE.currency,
            ...data
        });
    }
}

// Track scroll depth
function initScrollTracking() {
    let maxScroll = 0;
    const scrollThresholds = [25, 50, 75, 90, 100];
    const trackedThresholds = new Set();
    
    window.addEventListener('scroll', function() {
        const scrollPercent = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        
        if (scrollPercent > maxScroll) {
            maxScroll = scrollPercent;
            
            scrollThresholds.forEach(threshold => {
                if (scrollPercent >= threshold && !trackedThresholds.has(threshold)) {
                    trackedThresholds.add(threshold);
                    trackEvent('scroll_depth', {
                        'percent_scrolled': threshold,
                        'page_url': window.location.pathname
                    });
                }
            });
        }
    });
}

// Track time on page
function initTimeTracking() {
    const startTime = Date.now();
    const intervals = [10, 30, 60, 120, 180]; // seconds
    const trackedIntervals = new Set();
    
    setInterval(() => {
        const timeOnPage = Math.round((Date.now() - startTime) / 1000);
        
        intervals.forEach(interval => {
            if (timeOnPage >= interval && !trackedIntervals.has(interval)) {
                trackedIntervals.add(interval);
                trackEvent('time_on_page', {
                    'seconds': interval,
                    'page_url': window.location.pathname
                });
            }
        });
    }, 5000); // Check every 5 seconds
}

// Track outbound links
function initLinkTracking() {
    document.addEventListener('click', function(e) {
        const link = e.target.closest('a');
        if (link && link.href && !link.href.includes(window.location.hostname)) {
            trackEvent('outbound_link', {
                'link_url': link.href,
                'link_text': link.textContent.trim().substring(0, 100)
            });
        }
    });
}

// Track form interactions
function initFormTracking() {
    // Track form field focus
    document.addEventListener('focusin', function(e) {
        if (e.target.matches('input, textarea, select')) {
            const form = e.target.closest('form');
            if (form) {
                trackEvent('form_interaction', {
                    'form_id': form.id || 'unknown',
                    'field_name': e.target.name || e.target.id || 'unknown',
                    'field_type': e.target.type || 'text',
                    'action': 'field_focus'
                });
            }
        }
    });
    
    // Track form submissions
    document.addEventListener('submit', function(e) {
        const form = e.target;
        const formId = form.id || form.className || 'unknown';
        
        // Track the submission
        trackEvent('form_submit', {
            'form_id': formId,
            'form_action': form.action,
            'method': form.method
        });
        
        // Check if it's a conversion form
        if (formId.includes('contact') || formId.includes('demo')) {
            trackEvent('contact_form_submit', {
                'form_id': formId
            });
        }
    });
}

// Track video engagement (if any videos exist)
function initVideoTracking() {
    const videos = document.querySelectorAll('video');
    
    videos.forEach(video => {
        let hasStarted = false;
        let has25 = false;
        let has50 = false;
        let has75 = false;
        
        video.addEventListener('play', () => {
            if (!hasStarted) {
                hasStarted = true;
                trackEvent('video_start', {
                    'video_title': video.getAttribute('data-title') || 'Unknown',
                    'video_duration': video.duration
                });
            }
        });
        
        video.addEventListener('timeupdate', () => {
            const percent = (video.currentTime / video.duration) * 100;
            
            if (percent >= 25 && !has25) {
                has25 = true;
                trackEvent('video_progress', { 'percent': 25 });
            }
            if (percent >= 50 && !has50) {
                has50 = true;
                trackEvent('video_progress', { 'percent': 50 });
            }
            if (percent >= 75 && !has75) {
                has75 = true;
                trackEvent('video_progress', { 'percent': 75 });
            }
        });
        
        video.addEventListener('ended', () => {
            trackEvent('video_complete', {
                'video_title': video.getAttribute('data-title') || 'Unknown'
            });
        });
    });
}

// Track CTA clicks
function initCTATracking() {
    // Track all buttons and CTA links
    document.addEventListener('click', function(e) {
        const target = e.target.closest('button, .enhanced-btn, .submit-btn, [data-cta]');
        
        if (target) {
            const ctaText = target.textContent.trim();
            const ctaLocation = target.closest('section')?.id || 
                               target.closest('[class*="hero"]') ? 'hero' : 'unknown';
            
            trackEvent('cta_click', {
                'cta_text': ctaText,
                'cta_location': ctaLocation,
                'cta_url': target.href || 'button',
                'page_url': window.location.pathname
            });
            
            // Special handling for high-value CTAs
            if (ctaText.toLowerCase().includes('demo') || 
                ctaText.toLowerCase().includes('trial')) {
                trackEvent('demo_request', {
                    'source': ctaLocation
                });
            }
        }
    });
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    // Initialize GA4
    initializeAnalytics();
    
    // Wait a bit for GA to load, then initialize tracking
    setTimeout(() => {
        initScrollTracking();
        initTimeTracking();
        initLinkTracking();
        initFormTracking();
        initVideoTracking();
        initCTATracking();
        
        // Track initial page view with custom dimensions
        trackEvent('page_view_enhanced', {
            'page_title': document.title,
            'page_location': window.location.href,
            'page_path': window.location.pathname,
            'page_referrer': document.referrer,
            'sport_type': document.body.getAttribute('data-sport') || 'general',
            'team_name': document.body.getAttribute('data-team') || 'none'
        });
        
        console.log('Blaze Intelligence Analytics tracking initialized');
    }, 1000);
});

// Export for use in other scripts
window.BlazeAnalytics = {
    track: trackEvent,
    trackEcommerce: trackEcommerce,
    initialize: initializeAnalytics
};