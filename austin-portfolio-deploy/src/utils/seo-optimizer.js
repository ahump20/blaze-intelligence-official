/**
 * Advanced SEO and Performance Optimization System
 * Implements technical SEO, structured data, performance monitoring, and Core Web Vitals
 */

class SEOOptimizer {
  constructor() {
    this.config = {
      siteName: 'Blaze Intelligence',
      siteUrl: 'https://blaze-intelligence.pages.dev',
      defaultDescription: 'Elite Sports Analytics Platform delivering championship-level insights for MLB, NFL, NBA, and NCAA teams.',
      defaultKeywords: ['sports analytics', 'MLB analytics', 'NFL analytics', 'NCAA sports', 'sports intelligence', 'AI sports', 'Texas sports tech'],
      twitterHandle: '@BlazeIntel',
      organization: {
        name: 'Blaze Intelligence',
        founder: 'Austin Humphrey',
        location: 'Boerne, Texas',
        email: 'ahump20@outlook.com',
        phone: '(210) 273-5538'
      }
    };
    
    this.webVitals = {
      lcp: null,
      fid: null,
      cls: null,
      fcp: null,
      ttfb: null
    };
    
    this.initialize();
  }
  
  initialize() {
    this.enhanceMetaTags();
    this.addStructuredData();
    this.addCanonicalUrls();
    this.implementOpenGraph();
    this.setupWebVitalsTracking();
    this.optimizeImages();
    this.preloadCriticalResources();
    this.setupSitemap();
  }
  
  // === META TAGS AND SEO BASICS ===
  enhanceMetaTags() {
    // Enhanced title with dynamic updates
    this.updateTitle();
    
    // Meta description
    this.setMetaTag('description', this.config.defaultDescription);
    
    // Keywords
    this.setMetaTag('keywords', this.config.defaultKeywords.join(', '));
    
    // Language and region
    this.setMetaTag('language', 'English');
    this.setMetaTag('geo.region', 'US-TX');
    this.setMetaTag('geo.placename', 'Boerne, Texas');
    
    // Robots
    this.setMetaTag('robots', 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1');
    
    // Author and copyright
    this.setMetaTag('author', 'Austin Humphrey');
    this.setMetaTag('copyright', '© 2025 Blaze Intelligence. All rights reserved.');
    
    // Theme color for mobile browsers
    this.setMetaTag('theme-color', '#BF5700');
    
    // Additional mobile optimization
    this.setMetaTag('format-detection', 'telephone=no');
    this.setMetaTag('mobile-web-app-capable', 'yes');
    this.setMetaTag('apple-mobile-web-app-capable', 'yes');
    this.setMetaTag('apple-mobile-web-app-status-bar-style', 'black-translucent');
  }
  
  setMetaTag(name, content) {
    let meta = document.querySelector(`meta[name="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('name', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }
  
  updateTitle() {
    // Dynamic title updates based on current section
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const section = entry.target;
          let title = this.config.siteName;
          
          switch (section.id) {
            case 'home':
              title = `${this.config.siteName} | Elite Sports Analytics Platform`;
              break;
            case 'features':
              title = `Features | ${this.config.siteName} - Championship-Level Analytics`;
              break;
            case 'analytics':
              title = `Live Analytics | ${this.config.siteName} - Real-Time Sports Data`;
              break;
            case 'about':
              title = `About Austin Humphrey | ${this.config.siteName} Founder`;
              break;
            case 'contact':
              title = `Contact | ${this.config.siteName} - Transform Your Game`;
              break;
            default:
              title = `${this.config.siteName} | Elite Sports Analytics Platform`;
          }
          
          document.title = title;
        }
      });
    }, { threshold: 0.5 });
    
    // Observe main sections
    const sections = document.querySelectorAll('section[id]');
    sections.forEach(section => observer.observe(section));
  }
  
  // === STRUCTURED DATA ===
  addStructuredData() {
    const structuredData = {
      '@context': 'https://schema.org',
      '@graph': [
        // Organization
        {
          '@type': 'Organization',
          '@id': `${this.config.siteUrl}#organization`,
          'name': this.config.organization.name,
          'url': this.config.siteUrl,
          'logo': `${this.config.siteUrl}/favicon.ico`,
          'description': this.config.defaultDescription,
          'founder': {
            '@type': 'Person',
            'name': this.config.organization.founder,
            'jobTitle': 'Founder & CEO'
          },
          'address': {
            '@type': 'PostalAddress',
            'addressLocality': 'Boerne',
            'addressRegion': 'TX',
            'addressCountry': 'US'
          },
          'contactPoint': {
            '@type': 'ContactPoint',
            'telephone': this.config.organization.phone,
            'email': this.config.organization.email,
            'contactType': 'customer service'
          },
          'sameAs': [
            'https://linkedin.com/company/blaze-intelligence'
          ]
        },
        
        // Website
        {
          '@type': 'WebSite',
          '@id': `${this.config.siteUrl}#website`,
          'url': this.config.siteUrl,
          'name': this.config.siteName,
          'description': this.config.defaultDescription,
          'publisher': {
            '@id': `${this.config.siteUrl}#organization`
          },
          'potentialAction': [
            {
              '@type': 'SearchAction',
              'target': `${this.config.siteUrl}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string'
            }
          ]
        },
        
        // WebPage
        {
          '@type': 'WebPage',
          '@id': `${this.config.siteUrl}#webpage`,
          'url': this.config.siteUrl,
          'name': document.title,
          'description': this.config.defaultDescription,
          'isPartOf': {
            '@id': `${this.config.siteUrl}#website`
          },
          'about': {
            '@id': `${this.config.siteUrl}#organization`
          },
          'datePublished': '2025-01-01',
          'dateModified': new Date().toISOString().split('T')[0]
        },
        
        // Software Application
        {
          '@type': 'SoftwareApplication',
          'name': this.config.siteName,
          'description': this.config.defaultDescription,
          'applicationCategory': 'Sports Analytics',
          'applicationSubCategory': 'Business Intelligence',
          'operatingSystem': 'Web Browser',
          'offers': {
            '@type': 'Offer',
            'price': '0',
            'priceCurrency': 'USD'
          },
          'author': {
            '@id': `${this.config.siteUrl}#organization`
          },
          'featureList': [
            'Real-time sports analytics',
            'AI-powered insights', 
            'Multi-league coverage',
            'Performance tracking',
            'Predictive analytics'
          ]
        },
        
        // Service
        {
          '@type': 'Service',
          'name': 'Sports Analytics Consulting',
          'description': 'Elite sports analytics and intelligence consulting services',
          'provider': {
            '@id': `${this.config.siteUrl}#organization`
          },
          'serviceType': 'Sports Analytics',
          'areaServed': {
            '@type': 'Country',
            'name': 'United States'
          }
        }
      ]
    };
    
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(structuredData, null, 2);
    document.head.appendChild(script);
  }
  
  // === OPEN GRAPH AND SOCIAL MEDIA ===
  implementOpenGraph() {
    // Open Graph
    this.setProperty('og:title', document.title);
    this.setProperty('og:description', this.config.defaultDescription);
    this.setProperty('og:image', `${this.config.siteUrl}/og-image.jpg`);
    this.setProperty('og:url', window.location.href);
    this.setProperty('og:type', 'website');
    this.setProperty('og:site_name', this.config.siteName);
    this.setProperty('og:locale', 'en_US');
    
    // Twitter Card
    this.setProperty('twitter:card', 'summary_large_image');
    this.setProperty('twitter:site', this.config.twitterHandle);
    this.setProperty('twitter:creator', this.config.twitterHandle);
    this.setProperty('twitter:title', document.title);
    this.setProperty('twitter:description', this.config.defaultDescription);
    this.setProperty('twitter:image', `${this.config.siteUrl}/twitter-card.jpg`);
    
    // LinkedIn
    this.setProperty('linkedin:owner', 'john-humphrey-2033');
  }
  
  setProperty(property, content) {
    let meta = document.querySelector(`meta[property="${property}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', property);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }
  
  // === CANONICAL URLS ===
  addCanonicalUrls() {
    let canonical = document.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.setAttribute('rel', 'canonical');
      document.head.appendChild(canonical);
    }
    canonical.setAttribute('href', window.location.origin + window.location.pathname);
    
    // Add alternate language versions if applicable
    const altLink = document.createElement('link');
    altLink.setAttribute('rel', 'alternate');
    altLink.setAttribute('hreflang', 'en-US');
    altLink.setAttribute('href', canonical.href);
    document.head.appendChild(altLink);
  }
  
  // === PERFORMANCE OPTIMIZATION ===
  preloadCriticalResources() {
    // Preload critical fonts
    this.addPreload('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;900&display=swap', 'style');
    
    // Preload critical JavaScript
    this.addPreload('/src/client/live-data-client.js', 'script');
    
    // DNS prefetch for external domains
    this.addDNSPrefetch('https://fonts.googleapis.com');
    this.addDNSPrefetch('https://fonts.gstatic.com');
    
    // Prefetch likely next page resources
    this.addPrefetch('/contact.html');
  }
  
  addPreload(href, as) {
    const link = document.createElement('link');
    link.rel = 'preload';
    link.href = href;
    link.as = as;
    if (as === 'style') {
      link.onload = function() { this.rel = 'stylesheet'; };
    }
    document.head.appendChild(link);
  }
  
  addDNSPrefetch(href) {
    const link = document.createElement('link');
    link.rel = 'dns-prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
  
  addPrefetch(href) {
    const link = document.createElement('link');
    link.rel = 'prefetch';
    link.href = href;
    document.head.appendChild(link);
  }
  
  // === IMAGE OPTIMIZATION ===
  optimizeImages() {
    // Lazy load images that are not critical
    const images = document.querySelectorAll('img[data-src]');
    
    if ('IntersectionObserver' in window) {
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.removeAttribute('data-src');
            imageObserver.unobserve(img);
          }
        });
      });
      
      images.forEach(img => imageObserver.observe(img));
    } else {
      // Fallback for browsers without IntersectionObserver
      images.forEach(img => {
        img.src = img.dataset.src;
        img.removeAttribute('data-src');
      });
    }
    
    // Add loading="lazy" to non-critical images
    document.querySelectorAll('img:not([loading])').forEach(img => {
      const rect = img.getBoundingClientRect();
      if (rect.top > window.innerHeight) {
        img.setAttribute('loading', 'lazy');
      }
    });
  }
  
  // === WEB VITALS TRACKING ===
  setupWebVitalsTracking() {
    // Core Web Vitals measurement
    this.measureLCP();
    this.measureFID();
    this.measureCLS();
    this.measureFCP();
    this.measureTTFB();
    
    // Send vitals to analytics
    setTimeout(() => this.reportWebVitals(), 5000);
  }
  
  measureLCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        this.webVitals.lcp = lastEntry.startTime;
      });
      observer.observe({ entryTypes: ['largest-contentful-paint'] });
    }
  }
  
  measureFID() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach(entry => {
          this.webVitals.fid = entry.processingStart - entry.startTime;
        });
      });
      observer.observe({ entryTypes: ['first-input'] });
    }
  }
  
  measureCLS() {
    if ('PerformanceObserver' in window) {
      let clsValue = 0;
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        });
        this.webVitals.cls = clsValue;
      });
      observer.observe({ entryTypes: ['layout-shift'] });
    }
  }
  
  measureFCP() {
    if ('PerformanceObserver' in window) {
      const observer = new PerformanceObserver((list) => {
        list.getEntries().forEach(entry => {
          if (entry.name === 'first-contentful-paint') {
            this.webVitals.fcp = entry.startTime;
          }
        });
      });
      observer.observe({ entryTypes: ['paint'] });
    }
  }
  
  measureTTFB() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      this.webVitals.ttfb = timing.responseStart - timing.requestStart;
    }
  }
  
  reportWebVitals() {
    const report = {
      url: window.location.href,
      timestamp: Date.now(),
      vitals: this.webVitals,
      performance: this.getPerformanceMetrics(),
      viewport: {
        width: window.innerWidth,
        height: window.innerHeight
      },
      connection: this.getConnectionInfo()
    };
    
    console.log('Web Vitals Report:', report);
    
    // Send to analytics endpoint
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/analytics/vitals', JSON.stringify(report));
    }
  }
  
  getPerformanceMetrics() {
    if (!window.performance) return null;
    
    const navigation = window.performance.getEntriesByType('navigation')[0];
    if (!navigation) return null;
    
    return {
      domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
      domComplete: navigation.domComplete - navigation.navigationStart,
      loadComplete: navigation.loadEventEnd - navigation.navigationStart,
      transferSize: navigation.transferSize,
      encodedBodySize: navigation.encodedBodySize,
      decodedBodySize: navigation.decodedBodySize
    };
  }
  
  getConnectionInfo() {
    if (navigator.connection) {
      return {
        effectiveType: navigator.connection.effectiveType,
        downlink: navigator.connection.downlink,
        rtt: navigator.connection.rtt
      };
    }
    return null;
  }
  
  // === SITEMAP GENERATION ===
  setupSitemap() {
    // Generate dynamic sitemap data
    const sitemap = {
      pages: [
        {
          url: this.config.siteUrl,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: 1.0
        },
        {
          url: `${this.config.siteUrl}#features`,
          lastmod: new Date().toISOString(),
          changefreq: 'weekly',
          priority: 0.8
        },
        {
          url: `${this.config.siteUrl}#analytics`,
          lastmod: new Date().toISOString(),
          changefreq: 'daily',
          priority: 0.9
        },
        {
          url: `${this.config.siteUrl}#about`,
          lastmod: new Date().toISOString(),
          changefreq: 'monthly',
          priority: 0.7
        },
        {
          url: `${this.config.siteUrl}#contact`,
          lastmod: new Date().toISOString(),
          changefreq: 'monthly',
          priority: 0.6
        }
      ]
    };
    
    // Store sitemap data for server generation
    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('sitemap-data', JSON.stringify(sitemap));
    }
  }
  
  // === BREADCRUMBS ===
  generateBreadcrumbs() {
    const breadcrumbs = [];
    const pathSegments = window.location.pathname.split('/').filter(segment => segment);
    
    breadcrumbs.push({
      '@type': 'ListItem',
      'position': 1,
      'name': 'Home',
      'item': this.config.siteUrl
    });
    
    let currentPath = this.config.siteUrl;
    pathSegments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      breadcrumbs.push({
        '@type': 'ListItem',
        'position': index + 2,
        'name': this.formatSegmentName(segment),
        'item': currentPath
      });
    });
    
    if (breadcrumbs.length > 1) {
      const breadcrumbSchema = {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        'itemListElement': breadcrumbs
      };
      
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.textContent = JSON.stringify(breadcrumbSchema);
      document.head.appendChild(script);
    }
  }
  
  formatSegmentName(segment) {
    return segment
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }
  
  // === ACCESSIBILITY SEO ===
  enhanceAccessibilitySEO() {
    // Add alt text to images without it
    document.querySelectorAll('img:not([alt])').forEach(img => {
      img.setAttribute('alt', 'Blaze Intelligence sports analytics visualization');
    });
    
    // Ensure proper heading hierarchy
    this.validateHeadingHierarchy();
    
    // Add ARIA labels where missing
    document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])').forEach(btn => {
      if (btn.textContent.trim()) {
        btn.setAttribute('aria-label', btn.textContent.trim());
      }
    });
  }
  
  validateHeadingHierarchy() {
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let currentLevel = 0;
    
    headings.forEach((heading, index) => {
      const level = parseInt(heading.tagName.charAt(1));
      
      if (index === 0 && level !== 1) {
        console.warn('SEO Warning: Page should start with h1 heading');
      }
      
      if (level > currentLevel + 1) {
        console.warn(`SEO Warning: Heading level skipped from h${currentLevel} to h${level}`);
      }
      
      currentLevel = level;
    });
  }
  
  // === UTILITY METHODS ===
  getPageLoadScore() {
    const lcp = this.webVitals.lcp;
    const fid = this.webVitals.fid;
    const cls = this.webVitals.cls;
    
    let score = 100;
    
    // LCP scoring (Good: <2.5s, Needs Improvement: 2.5s-4s, Poor: >4s)
    if (lcp > 4000) score -= 30;
    else if (lcp > 2500) score -= 15;
    
    // FID scoring (Good: <100ms, Needs Improvement: 100-300ms, Poor: >300ms)
    if (fid > 300) score -= 25;
    else if (fid > 100) score -= 10;
    
    // CLS scoring (Good: <0.1, Needs Improvement: 0.1-0.25, Poor: >0.25)
    if (cls > 0.25) score -= 25;
    else if (cls > 0.1) score -= 10;
    
    return Math.max(0, score);
  }
}

// Initialize SEO optimizer
if (typeof window !== 'undefined') {
  document.addEventListener('DOMContentLoaded', () => {
    window.seoOptimizer = new SEOOptimizer();
  });
}

export default SEOOptimizer;