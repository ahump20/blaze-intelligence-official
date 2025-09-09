/**
 * Canonical Metrics Configuration for Blaze Intelligence
 * Single source of truth for all platform metrics
 * 
 * IMPORTANT: These are the ONLY approved metrics to be used across the platform
 */

const CANONICAL_METRICS = {
    // Primary Performance Metrics
    prediction_accuracy: "94.6%",  // NOT 96.2% - this is the canonical value
    response_latency: "<100ms",
    data_points: "2.8M+",
    events_per_second: "100K+",
    
    // Business Metrics
    cost_savings: "67-80%",  // Range vs competitors (Hudl)
    value_identified: "$42.3M",
    roi_multiplier: "12x",
    
    // Platform Statistics
    teams_served: "50+",
    predictions_made: "1M+",
    uptime: "99.9%",
    
    // AI Model Specifications
    ai_models: {
        count: 3,
        names: ["ChatGPT 5", "Claude Opus 4.1", "Gemini 2.5 Pro"]
    },
    
    // Pricing
    annual_subscription: "$1,188",
    monthly_enterprise: "$299",
    trial_days: "14",
    
    // Competitive Comparisons (factual ranges only)
    vs_competitors: {
        cost_savings_range: "67-80%",
        speed_improvement: "10x",
        accuracy_advantage: "+15%"
    }
};

/**
 * Load metrics into DOM elements with data-metric attributes
 */
function loadCanonicalMetrics() {
    // Find all elements with data-metric attribute
    const metricElements = document.querySelectorAll('[data-metric]');
    
    metricElements.forEach(element => {
        const metricKey = element.getAttribute('data-metric');
        
        // Handle nested metrics (e.g., ai_models.count)
        const keys = metricKey.split('.');
        let value = CANONICAL_METRICS;
        
        for (const key of keys) {
            if (value && typeof value === 'object' && key in value) {
                value = value[key];
            } else {
                console.warn(`Metric not found: ${metricKey}`);
                return;
            }
        }
        
        // Update element content
        if (value !== undefined && value !== null) {
            element.textContent = value;
        }
    });
    
    // Log metrics loading for debugging
    console.log('Canonical metrics loaded:', CANONICAL_METRICS);
}

/**
 * Validate that a metric value matches canonical
 */
function validateMetric(key, value) {
    const canonical = getMetricValue(key);
    if (canonical && canonical !== value) {
        console.error(`Metric mismatch for ${key}: Found "${value}", should be "${canonical}"`);
        return false;
    }
    return true;
}

/**
 * Get a specific metric value
 */
function getMetricValue(key) {
    const keys = key.split('.');
    let value = CANONICAL_METRICS;
    
    for (const k of keys) {
        if (value && typeof value === 'object' && k in value) {
            value = value[k];
        } else {
            return null;
        }
    }
    
    return value;
}

/**
 * Inject metrics as JSON-LD structured data for SEO
 */
function injectStructuredData() {
    const structuredData = {
        "@context": "https://schema.org",
        "@type": "SoftwareApplication",
        "name": "Blaze Intelligence",
        "description": "AI-driven sports analytics platform",
        "applicationCategory": "Sports Analytics",
        "offers": {
            "@type": "Offer",
            "price": "1188",
            "priceCurrency": "USD",
            "priceValidUntil": "2026-12-31"
        },
        "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.6",
            "bestRating": "5",
            "ratingCount": "94"
        },
        "featureList": [
            `${CANONICAL_METRICS.prediction_accuracy} prediction accuracy`,
            `${CANONICAL_METRICS.response_latency} response time`,
            `${CANONICAL_METRICS.data_points} data points analyzed`,
            "Multi-AI analysis with ChatGPT 5, Claude Opus 4.1, Gemini 2.5 Pro"
        ]
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);
}

/**
 * Auto-initialize on DOM ready
 */
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        loadCanonicalMetrics();
        injectStructuredData();
    });
} else {
    // DOM already loaded
    loadCanonicalMetrics();
    injectStructuredData();
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        CANONICAL_METRICS,
        loadCanonicalMetrics,
        validateMetric,
        getMetricValue
    };
}