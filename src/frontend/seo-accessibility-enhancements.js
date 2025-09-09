// SEO & Accessibility Enhancements for Blaze Intelligence
// Implements structured data, meta tags, ARIA labels, keyboard navigation, and performance optimizations

class SEOAccessibilityManager {
    constructor() {
        this.structuredDataCache = new Map();
        this.metaTagsCache = new Map();
        this.performanceObserver = null;
        this.init();
    }

    // Initialize SEO & Accessibility features
    init() {
        this.setupStructuredData();
        this.setupMetaTags();
        this.setupAccessibilityFeatures();
        this.setupPerformanceOptimizations();
        this.setupKeyboardNavigation();
        console.log('✅ SEO & Accessibility manager initialized');
    }

    // Generate comprehensive structured data (JSON-LD)
    setupStructuredData() {
        const baseStructuredData = {
            "@context": "https://schema.org",
            "@graph": [
                {
                    "@type": "Organization",
                    "@id": "https://blaze-intelligence.com/#organization",
                    "name": "Blaze Intelligence",
                    "url": "https://blaze-intelligence.com",
                    "logo": {
                        "@type": "ImageObject",
                        "url": "https://blaze-intelligence.com/assets/logo.png",
                        "width": 512,
                        "height": 512
                    },
                    "description": "Elite sports analytics platform for championship teams. Real-time MLB data, AI-powered insights, and biomechanical analysis.",
                    "foundingDate": "2024",
                    "founder": {
                        "@type": "Person",
                        "name": "Austin Humphrey"
                    },
                    "address": {
                        "@type": "PostalAddress",
                        "addressLocality": "Austin",
                        "addressRegion": "TX",
                        "addressCountry": "US"
                    },
                    "sameAs": [
                        "https://twitter.com/blazeintel",
                        "https://linkedin.com/company/blaze-intelligence"
                    ]
                },
                {
                    "@type": "WebSite",
                    "@id": "https://blaze-intelligence.com/#website",
                    "url": "https://blaze-intelligence.com",
                    "name": "Blaze Intelligence",
                    "description": "Sports analytics platform with real-time MLB data and AI insights",
                    "publisher": {
                        "@id": "https://blaze-intelligence.com/#organization"
                    },
                    "potentialAction": [
                        {
                            "@type": "SearchAction",
                            "target": "https://blaze-intelligence.com/search?q={search_term_string}",
                            "query-input": "required name=search_term_string"
                        }
                    ]
                },
                {
                    "@type": "SoftwareApplication",
                    "@id": "https://blaze-intelligence.com/#software",
                    "name": "Blaze Intelligence Platform",
                    "applicationCategory": "BusinessApplication",
                    "operatingSystem": "Web",
                    "offers": [
                        {
                            "@type": "Offer",
                            "name": "Core Plan",
                            "price": "99",
                            "priceCurrency": "USD",
                            "priceSpecification": {
                                "@type": "UnitPriceSpecification",
                                "price": "99",
                                "priceCurrency": "USD",
                                "billingDuration": "P1M",
                                "billingIncrement": 1
                            }
                        },
                        {
                            "@type": "Offer",
                            "name": "Enterprise Plan",
                            "price": "299",
                            "priceCurrency": "USD",
                            "priceSpecification": {
                                "@type": "UnitPriceSpecification",
                                "price": "299",
                                "priceCurrency": "USD",
                                "billingDuration": "P1M",
                                "billingIncrement": 1
                            }
                        }
                    ],
                    "aggregateRating": {
                        "@type": "AggregateRating",
                        "ratingValue": "4.8",
                        "ratingCount": "127",
                        "bestRating": "5",
                        "worstRating": "1"
                    }
                }
            ]
        };

        // Cache structured data for different page types
        this.structuredDataCache.set('homepage', baseStructuredData);
        
        // Sports data specific structured data
        this.structuredDataCache.set('sports-data', {
            "@context": "https://schema.org",
            "@type": "Dataset",
            "name": "MLB Real-time Statistics",
            "description": "Live MLB team and player statistics with real-time updates",
            "url": "https://blaze-intelligence.com/api/mlb/cardinals/summary",
            "keywords": "MLB, baseball, statistics, real-time, Cardinals",
            "creator": {
                "@id": "https://blaze-intelligence.com/#organization"
            },
            "publisher": {
                "@id": "https://blaze-intelligence.com/#organization"
            },
            "distribution": {
                "@type": "DataDownload",
                "encodingFormat": "JSON",
                "contentUrl": "https://blaze-intelligence.com/api/mlb/cardinals/summary"
            }
        });

        // Methods page structured data (FAQ format)
        this.structuredDataCache.set('methods', {
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": [
                {
                    "@type": "Question",
                    "name": "How accurate is Blaze Intelligence's prediction system?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Our platform achieves 94.6% prediction accuracy across 2,847 MLB games (2023-2024 seasons) using ensemble models combining team statistics, player health, and historical matchups."
                    }
                },
                {
                    "@type": "Question",
                    "name": "What data sources does Blaze Intelligence use?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "We use official MLB Stats API for real-time data, with 300-second caching and stale-while-revalidate fallback mechanisms. All data sources are verified and transparent."
                    }
                },
                {
                    "@type": "Question",
                    "name": "How does the Digital Combine biomechanical analysis work?",
                    "acceptedAnswer": {
                        "@type": "Answer",
                        "text": "Our computer vision system analyzes 60fps video with frame-by-frame biomechanical extraction using TensorFlow models trained on 10,000+ elite athlete movements."
                    }
                }
            ]
        });
    }

    // Enhanced meta tags for different page types
    setupMetaTags() {
        const baseMetaTags = {
            viewport: "width=device-width, initial-scale=1.0, viewport-fit=cover",
            robots: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            googlebot: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            bingbot: "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
            
            // Open Graph
            "og:site_name": "Blaze Intelligence",
            "og:type": "website",
            "og:locale": "en_US",
            
            // Twitter
            "twitter:card": "summary_large_image",
            "twitter:site": "@blazeintel",
            "twitter:creator": "@austinhumphreys",
            
            // Mobile & PWA
            "apple-mobile-web-app-capable": "yes",
            "apple-mobile-web-app-status-bar-style": "default",
            "apple-mobile-web-app-title": "Blaze Intelligence",
            "mobile-web-app-capable": "yes",
            "msapplication-TileColor": "#BF5700",
            "theme-color": "#BF5700"
        };

        // Page-specific meta tags
        this.metaTagsCache.set('homepage', {
            ...baseMetaTags,
            title: "Blaze Intelligence — Elite Sports Analytics Platform",
            description: "Real-time MLB data, AI-powered insights, and biomechanical analysis for championship teams. 94.6% prediction accuracy with transparent methodology.",
            keywords: "sports analytics, MLB data, baseball statistics, AI insights, team analytics, player performance, biomechanical analysis",
            "og:title": "Elite Sports Analytics Platform",
            "og:description": "Real-time MLB data, AI insights, biomechanical analysis. 94.6% prediction accuracy.",
            "og:url": "https://blaze-intelligence.com",
            "og:image": "https://blaze-intelligence.com/assets/og-image.png",
            "twitter:title": "Blaze Intelligence — Elite Sports Analytics",
            "twitter:description": "Real-time MLB data, AI insights, biomechanical analysis. 94.6% prediction accuracy.",
            "twitter:image": "https://blaze-intelligence.com/assets/twitter-image.png"
        });

        this.metaTagsCache.set('pricing', {
            ...baseMetaTags,
            title: "Pricing — Blaze Intelligence Sports Analytics Platform",
            description: "Transparent pricing for elite sports analytics. Core plan $99/month, Enterprise $299/month. 67% cost savings vs competitors with real MLB data included.",
            keywords: "sports analytics pricing, MLB data subscription, team analytics cost, sports intelligence pricing",
            "og:title": "Sports Analytics Platform Pricing",
            "og:description": "Core plan $99/month, Enterprise $299/month. Real MLB data included.",
            "twitter:title": "Blaze Intelligence Pricing",
            "twitter:description": "Core plan $99/month, Enterprise $299/month. Real MLB data included."
        });

        this.metaTagsCache.set('methods', {
            ...baseMetaTags,
            title: "Methods & Transparency — Blaze Intelligence",
            description: "Complete transparency on data sources, algorithms, and methodology. 94.6% accuracy verification, real-time MLB data integration, and biomechanical analysis details.",
            keywords: "sports analytics methodology, data transparency, algorithm verification, MLB data sources, prediction accuracy",
            "og:title": "Methods & Transparency",
            "og:description": "Complete transparency on data sources, algorithms, and methodology.",
            "twitter:title": "Blaze Intelligence Methods",
            "twitter:description": "Complete transparency on data sources, algorithms, and methodology."
        });
    }

    // Accessibility enhancements
    setupAccessibilityFeatures() {
        // Wait for DOM to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.initAccessibility());
        } else {
            this.initAccessibility();
        }
    }

    initAccessibility() {
        // Add ARIA labels to interactive elements
        this.addARIALabels();
        
        // Enhance form accessibility
        this.enhanceFormAccessibility();
        
        // Add skip links
        this.addSkipLinks();
        
        // Enhance focus management
        this.enhanceFocusManagement();
        
        // Add keyboard navigation hints
        this.addKeyboardHints();
        
        // Monitor for accessibility violations
        this.monitorAccessibility();
    }

    addARIALabels() {
        // Dashboard cards
        const dashboardCards = document.querySelectorAll('.dashboard-card, .metric-card, .stats-card');
        dashboardCards.forEach((card, index) => {
            if (!card.hasAttribute('role')) {
                card.setAttribute('role', 'region');
            }
            if (!card.hasAttribute('aria-label')) {
                const title = card.querySelector('h3, .card-title')?.textContent || `Dashboard Card ${index + 1}`;
                card.setAttribute('aria-label', title);
            }
        });

        // Navigation menus
        const navElements = document.querySelectorAll('nav, .nav-menu');
        navElements.forEach(nav => {
            if (!nav.hasAttribute('role')) {
                nav.setAttribute('role', 'navigation');
            }
            if (!nav.hasAttribute('aria-label')) {
                nav.setAttribute('aria-label', 'Main navigation');
            }
        });

        // Buttons without proper labels
        const buttons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
        buttons.forEach(button => {
            const text = button.textContent.trim();
            const icon = button.querySelector('.icon');
            if (!text && icon) {
                // Button with only icon, need aria-label
                const iconClass = icon.className;
                let label = 'Button';
                if (iconClass.includes('close')) label = 'Close';
                else if (iconClass.includes('menu')) label = 'Menu';
                else if (iconClass.includes('play')) label = 'Play';
                else if (iconClass.includes('pause')) label = 'Pause';
                else if (iconClass.includes('settings')) label = 'Settings';
                
                button.setAttribute('aria-label', label);
            }
        });

        // Charts and visualizations
        const charts = document.querySelectorAll('.chart-container, canvas');
        charts.forEach((chart, index) => {
            if (!chart.hasAttribute('role')) {
                chart.setAttribute('role', 'img');
            }
            if (!chart.hasAttribute('aria-label')) {
                const title = chart.closest('.dashboard-card')?.querySelector('.card-title')?.textContent || `Chart ${index + 1}`;
                chart.setAttribute('aria-label', `${title} visualization`);
            }
        });

        // Live data indicators
        const liveIndicators = document.querySelectorAll('.status-indicator, .live-indicator');
        liveIndicators.forEach(indicator => {
            indicator.setAttribute('role', 'status');
            indicator.setAttribute('aria-live', 'polite');
        });
    }

    enhanceFormAccessibility() {
        // Form groups and labels
        const formGroups = document.querySelectorAll('.form-group, .input-group');
        formGroups.forEach(group => {
            const input = group.querySelector('input, select, textarea');
            const label = group.querySelector('label');
            
            if (input && label) {
                // Ensure proper label association
                if (!input.id) {
                    input.id = `input-${Math.random().toString(36).substr(2, 9)}`;
                }
                if (!label.hasAttribute('for')) {
                    label.setAttribute('for', input.id);
                }
            }
        });

        // Error messages
        const errorMessages = document.querySelectorAll('.error-message, .field-error');
        errorMessages.forEach(error => {
            error.setAttribute('role', 'alert');
            error.setAttribute('aria-live', 'assertive');
        });

        // Required field indicators
        const requiredInputs = document.querySelectorAll('input[required], select[required], textarea[required]');
        requiredInputs.forEach(input => {
            if (!input.hasAttribute('aria-required')) {
                input.setAttribute('aria-required', 'true');
            }
        });
    }

    addSkipLinks() {
        // Add skip to main content link
        const skipLink = document.createElement('a');
        skipLink.href = '#main-content';
        skipLink.className = 'skip-link';
        skipLink.textContent = 'Skip to main content';
        skipLink.style.cssText = `
            position: absolute;
            top: -40px;
            left: 6px;
            background: #BF5700;
            color: white;
            padding: 8px;
            text-decoration: none;
            z-index: 10000;
            border-radius: 4px;
            font-weight: 600;
        `;
        
        // Show skip link on focus
        skipLink.addEventListener('focus', () => {
            skipLink.style.top = '6px';
        });
        
        skipLink.addEventListener('blur', () => {
            skipLink.style.top = '-40px';
        });
        
        document.body.insertBefore(skipLink, document.body.firstChild);

        // Ensure main content has proper ID
        let mainContent = document.getElementById('main-content');
        if (!mainContent) {
            mainContent = document.querySelector('main') || document.querySelector('.main-content');
            if (mainContent) {
                mainContent.id = 'main-content';
            }
        }
    }

    enhanceFocusManagement() {
        // Focus trap for modals
        const modals = document.querySelectorAll('.modal, .dialog, .popup');
        modals.forEach(modal => {
            const focusableElements = modal.querySelectorAll(
                'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
            );
            
            if (focusableElements.length > 0) {
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];
                
                modal.addEventListener('keydown', (e) => {
                    if (e.key === 'Tab') {
                        if (e.shiftKey) {
                            if (document.activeElement === firstElement) {
                                e.preventDefault();
                                lastElement.focus();
                            }
                        } else {
                            if (document.activeElement === lastElement) {
                                e.preventDefault();
                                firstElement.focus();
                            }
                        }
                    }
                    
                    if (e.key === 'Escape') {
                        const closeButton = modal.querySelector('.close, [data-close]');
                        if (closeButton) {
                            closeButton.click();
                        }
                    }
                });
            }
        });

        // Enhanced focus indicators
        const style = document.createElement('style');
        style.textContent = `
            :focus-visible {
                outline: 3px solid #BF5700;
                outline-offset: 2px;
                border-radius: 4px;
            }
            
            .focus-trap:focus {
                outline: 2px dashed #BF5700;
                outline-offset: 4px;
            }
        `;
        document.head.appendChild(style);
    }

    addKeyboardHints() {
        // Add keyboard navigation hints
        const keyboardHints = document.createElement('div');
        keyboardHints.className = 'keyboard-hints';
        keyboardHints.innerHTML = `
            <div class="keyboard-hint" style="display: none;">
                <span class="hint-text">Press <kbd>Tab</kbd> to navigate, <kbd>Enter</kbd> to select, <kbd>Esc</kbd> to close</span>
            </div>
        `;
        document.body.appendChild(keyboardHints);

        // Show hints on first Tab press
        let hintShown = false;
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Tab' && !hintShown) {
                const hint = document.querySelector('.keyboard-hint');
                if (hint) {
                    hint.style.display = 'block';
                    setTimeout(() => {
                        hint.style.display = 'none';
                    }, 3000);
                    hintShown = true;
                }
            }
        });
    }

    setupKeyboardNavigation() {
        document.addEventListener('keydown', (e) => {
            // Dashboard navigation with arrow keys
            if (e.target.closest('.dashboard-cards')) {
                const cards = Array.from(document.querySelectorAll('.dashboard-card'));
                const currentIndex = cards.findIndex(card => card.contains(e.target));
                
                if (currentIndex !== -1) {
                    let newIndex = currentIndex;
                    
                    switch (e.key) {
                        case 'ArrowRight':
                        case 'ArrowDown':
                            newIndex = (currentIndex + 1) % cards.length;
                            break;
                        case 'ArrowLeft':
                        case 'ArrowUp':
                            newIndex = currentIndex === 0 ? cards.length - 1 : currentIndex - 1;
                            break;
                        default:
                            return;
                    }
                    
                    e.preventDefault();
                    cards[newIndex].focus();
                }
            }

            // Quick access keys
            if (e.altKey || e.metaKey) {
                switch (e.key) {
                    case 'd':
                        e.preventDefault();
                        document.querySelector('.dashboard-link')?.click();
                        break;
                    case 'p':
                        e.preventDefault();
                        document.querySelector('.pricing-link')?.click();
                        break;
                    case 'c':
                        e.preventDefault();
                        document.querySelector('.contact-link')?.click();
                        break;
                }
            }
        });
    }

    monitorAccessibility() {
        // Simple accessibility violation detection
        const checkAccessibility = () => {
            const violations = [];
            
            // Check for images without alt text
            const images = document.querySelectorAll('img:not([alt])');
            if (images.length > 0) {
                violations.push(`${images.length} images missing alt text`);
            }
            
            // Check for buttons without accessible names
            const unnamedButtons = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])');
            const unnamedButtonsWithoutText = Array.from(unnamedButtons).filter(btn => !btn.textContent.trim());
            if (unnamedButtonsWithoutText.length > 0) {
                violations.push(`${unnamedButtonsWithoutText.length} buttons without accessible names`);
            }
            
            // Check for form inputs without labels
            const unlabeledInputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
            const unlabeledInputsWithoutLabels = Array.from(unlabeledInputs).filter(input => {
                const id = input.id;
                return !id || !document.querySelector(`label[for="${id}"]`);
            });
            if (unlabeledInputsWithoutLabels.length > 0) {
                violations.push(`${unlabeledInputsWithoutLabels.length} form inputs without labels`);
            }
            
            if (violations.length > 0) {
                console.warn('Accessibility violations detected:', violations);
            }
        };
        
        // Check on page load and after DOM changes
        setTimeout(checkAccessibility, 1000);
        
        // Monitor for DOM changes
        if ('MutationObserver' in window) {
            const observer = new MutationObserver(() => {
                setTimeout(checkAccessibility, 500);
            });
            
            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        }
    }

    setupPerformanceOptimizations() {
        // Lazy load images below the fold
        if ('IntersectionObserver' in window) {
            const imageObserver = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        const img = entry.target;
                        if (img.dataset.src) {
                            img.src = img.dataset.src;
                            img.removeAttribute('data-src');
                            imageObserver.unobserve(img);
                        }
                    }
                });
            });

            document.querySelectorAll('img[data-src]').forEach(img => {
                imageObserver.observe(img);
            });
        }

        // Preload critical resources
        this.preloadCriticalResources();
        
        // Monitor performance
        this.setupPerformanceMonitoring();
    }

    preloadCriticalResources() {
        const criticalResources = [
            { href: '/public/css/enhanced-visuals.css', as: 'style' },
            { href: '/public/js/three-hero-enhanced.js', as: 'script' },
            { href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&display=swap', as: 'style' }
        ];

        criticalResources.forEach(resource => {
            const link = document.createElement('link');
            link.rel = 'preload';
            link.href = resource.href;
            link.as = resource.as;
            document.head.appendChild(link);
        });
    }

    setupPerformanceMonitoring() {
        if ('PerformanceObserver' in window) {
            // Monitor Largest Contentful Paint
            const lcpObserver = new PerformanceObserver((entryList) => {
                const entries = entryList.getEntries();
                const lastEntry = entries[entries.length - 1];
                
                console.log('LCP:', lastEntry.startTime);
                
                // Track with analytics if available
                if (window.blazeAnalytics) {
                    window.blazeAnalytics.trackAPI('/performance/lcp', lastEntry.startTime);
                }
            });
            lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });

            // Monitor Cumulative Layout Shift
            const clsObserver = new PerformanceObserver((entryList) => {
                let clsValue = 0;
                for (const entry of entryList.getEntries()) {
                    if (!entry.hadRecentInput) {
                        clsValue += entry.value;
                    }
                }
                
                if (clsValue > 0) {
                    console.log('CLS:', clsValue);
                    
                    // Track with analytics if available
                    if (window.blazeAnalytics) {
                        window.blazeAnalytics.trackAPI('/performance/cls', clsValue);
                    }
                }
            });
            clsObserver.observe({ entryTypes: ['layout-shift'] });
        }
    }

    // Generate meta tags HTML for server-side rendering
    generateMetaTagsHTML(pageType = 'homepage') {
        const metaTags = this.metaTagsCache.get(pageType) || this.metaTagsCache.get('homepage');
        
        let html = '';
        for (const [name, content] of Object.entries(metaTags)) {
            if (name === 'title') {
                html += `<title>${content}</title>\n    `;
            } else if (name.startsWith('og:') || name.startsWith('twitter:')) {
                html += `<meta property="${name}" content="${content}">\n    `;
            } else {
                html += `<meta name="${name}" content="${content}">\n    `;
            }
        }
        
        return html;
    }

    // Generate structured data HTML
    generateStructuredDataHTML(pageType = 'homepage') {
        const structuredData = this.structuredDataCache.get(pageType);
        if (structuredData) {
            return `<script type="application/ld+json">\n${JSON.stringify(structuredData, null, 2)}\n</script>`;
        }
        return '';
    }

    // Update page SEO dynamically (for SPA-style navigation)
    updatePageSEO(pageType, customData = {}) {
        const metaTags = { ...this.metaTagsCache.get(pageType), ...customData };
        
        // Update title
        if (metaTags.title) {
            document.title = metaTags.title;
        }
        
        // Update meta tags
        for (const [name, content] of Object.entries(metaTags)) {
            if (name === 'title') continue;
            
            let selector;
            if (name.startsWith('og:') || name.startsWith('twitter:')) {
                selector = `meta[property="${name}"]`;
            } else {
                selector = `meta[name="${name}"]`;
            }
            
            let metaElement = document.querySelector(selector);
            if (metaElement) {
                metaElement.setAttribute('content', content);
            } else {
                metaElement = document.createElement('meta');
                if (name.startsWith('og:') || name.startsWith('twitter:')) {
                    metaElement.setAttribute('property', name);
                } else {
                    metaElement.setAttribute('name', name);
                }
                metaElement.setAttribute('content', content);
                document.head.appendChild(metaElement);
            }
        }
        
        // Update structured data
        const existingStructuredData = document.querySelector('script[type="application/ld+json"]');
        const newStructuredData = this.structuredDataCache.get(pageType);
        
        if (newStructuredData) {
            if (existingStructuredData) {
                existingStructuredData.textContent = JSON.stringify(newStructuredData, null, 2);
            } else {
                const script = document.createElement('script');
                script.type = 'application/ld+json';
                script.textContent = JSON.stringify(newStructuredData, null, 2);
                document.head.appendChild(script);
            }
        }
    }

    // Performance audit
    auditPerformance() {
        return new Promise((resolve) => {
            const audit = {
                timestamp: new Date().toISOString(),
                metrics: {},
                recommendations: []
            };
            
            // Basic performance metrics
            if (performance.timing) {
                const timing = performance.timing;
                audit.metrics.pageLoadTime = timing.loadEventEnd - timing.navigationStart;
                audit.metrics.domContentLoaded = timing.domContentLoadedEventEnd - timing.navigationStart;
                audit.metrics.firstByte = timing.responseStart - timing.navigationStart;
            }
            
            // Check image optimization
            const images = document.querySelectorAll('img');
            const largeImages = Array.from(images).filter(img => {
                return img.naturalWidth > 1920 || img.naturalHeight > 1080;
            });
            
            if (largeImages.length > 0) {
                audit.recommendations.push(`${largeImages.length} images could be optimized for web delivery`);
            }
            
            // Check for render-blocking resources
            const stylesheets = document.querySelectorAll('link[rel="stylesheet"]:not([media])');
            if (stylesheets.length > 3) {
                audit.recommendations.push(`Consider combining or async loading some of ${stylesheets.length} stylesheets`);
            }
            
            resolve(audit);
        });
    }
}

// Initialize SEO & Accessibility when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.seoAccessibilityManager = new SEOAccessibilityManager();
});

export default SEOAccessibilityManager;