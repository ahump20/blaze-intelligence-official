#!/usr/bin/env node

// Blaze Intelligence - Analytics Setup
// Configures Google Analytics, Mixpanel, and custom tracking

const fs = require('fs').promises;
const path = require('path');

class AnalyticsSetup {
    constructor() {
        this.gaId = process.env.GOOGLE_ANALYTICS_ID;
        this.mixpanelToken = process.env.MIXPANEL_TOKEN;
        this.sentryDsn = process.env.SENTRY_DSN;
    }

    async initialize() {
        console.log('📈 Setting up analytics and tracking...');
        
        // Create analytics includes directory
        await fs.mkdir('includes', { recursive: true });
        
        // Setup Google Analytics
        if (this.gaId) {
            await this.setupGoogleAnalytics();
        }
        
        // Setup Mixpanel
        if (this.mixpanelToken) {
            await this.setupMixpanel();
        }
        
        // Setup Sentry
        if (this.sentryDsn) {
            await this.setupSentry();
        }
        
        // Create custom tracking for Blaze events
        await this.setupBlazeTracking();
        
        // Update HTML templates to include analytics
        await this.updateHTMLTemplates();
        
        console.log('✅ Analytics setup complete');
    }

    async setupGoogleAnalytics() {
        console.log('🔍 Setting up Google Analytics...');
        
        const gaScript = `<!-- Google Analytics 4 -->
<script async src="https://www.googletagmanager.com/gtag/js?id=${this.gaId}"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  
  gtag('config', '${this.gaId}', {
    // Enhanced ecommerce for pricing tracking
    custom_map: {
      'custom_parameter_1': 'pricing_tier',
      'custom_parameter_2': 'team_focus'
    },
    // Track user engagement
    engagement_time_msec: 100
  });
  
  // Custom events for Blaze Intelligence
  gtag('event', 'page_view', {
    'custom_parameter_1': 'sports_analytics',
    'custom_parameter_2': window.location.pathname
  });
</script>

<!-- Enhanced Ecommerce Events -->
<script>
// Track pricing interactions
function trackPricingView(tier) {
  gtag('event', 'view_item', {
    currency: 'USD',
    value: tier === 'starter' ? 1188 : tier === 'growth' ? 3588 : 10000,
    items: [{
      item_id: 'blaze_' + tier,
      item_name: 'Blaze ' + tier.charAt(0).toUpperCase() + tier.slice(1),
      item_category: 'Sports Analytics',
      price: tier === 'starter' ? 1188 : tier === 'growth' ? 3588 : 10000,
      quantity: 1
    }]
  });
}

// Track lead generation
function trackLead(source) {
  gtag('event', 'generate_lead', {
    currency: 'USD',
    value: 1188, // Average customer value
    source: source
  });
}

// Track team analytics views
function trackTeamView(team) {
  gtag('event', 'view_content', {
    content_type: 'team_analytics',
    content_id: team.toLowerCase(),
    custom_parameter_1: 'team_focus',
    custom_parameter_2: team
  });
}
</script>`;
        
        await fs.writeFile('includes/google-analytics.html', gaScript);
        console.log('✅ Google Analytics configured');
    }

    async setupMixpanel() {
        console.log('📊 Setting up Mixpanel...');
        
        const mixpanelScript = `<!-- Mixpanel -->
<script type="text/javascript">
(function(c,a){if(!a.__SV){var b=window;try{var d,m,j,k=b.location,f=k.hash;d=function(a,b){return(m=a.match(RegExp(b+"=([^&]*)")))?m[1]:null};f&&d(f,"state")&&(j=JSON.parse(decodeURIComponent(d(f,"state"))),"mpeditor"===j.action&&(b.sessionStorage.setItem("_mpcehash",f),history.replaceState(j.desiredHash||"",c.title,k.pathname+k.search)))}catch(n){}var l,h;window.mixpanel=a;a._i=[];a.init=function(b,d,g){function c(b,i){var a=i.split(".");2==a.length&&(b=b[a[0]],i=a[1]);b[i]=function(){b.push([i].concat(Array.prototype.slice.call(arguments,0)))}}var e=a;"undefined"!==typeof g?e=a[g]=[]:g="mixpanel";e.people=e.people||[];e.toString=function(b){var a="mixpanel";"mixpanel"!==g&&(a+="."+g);b||(a+=" (stub)");return a};e.people.toString=function(){return e.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms track_with_groups add_group set_group remove_group register register_once alias unregister identify name_tag set_config reset opt_in_tracking opt_out_tracking has_opted_in_tracking has_opted_out_tracking clear_opt_in_out_tracking start_batch_senders people.set people.set_once people.unset people.increment people.append people.union people.track_charge people.clear_charges people.delete_user people.remove".split(" ");for(h=0;h<l.length;h++)c(e,l[h]);var f="set track_pageview track identify alias people.set people.set_once set_config register register_once".split(" ");for(h=0;h<f.length;h++)e[f[h]]=function(){e.push([f[h]].concat(Array.prototype.slice.call(arguments,0)))};a._i.push([b,d,g])};a.__SV=1.2;b=c.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===c.location.protocol&&"//cdn4.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn4.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn4.mxpnl.com/libs/mixpanel-2-latest.min.js";d=c.getElementsByTagName("script")[0];d.parentNode.insertBefore(b,d)}})(document,window.mixpanel||[]);

mixpanel.init('${this.mixpanelToken}', {
  debug: ${process.env.NODE_ENV === 'development'},
  track_pageview: true,
  persistence: 'localStorage'
});

// Custom Blaze Intelligence tracking
mixpanel.track('Page View', {
  'source': 'blaze_intelligence',
  'page': window.location.pathname,
  'timestamp': new Date().toISOString()
});

// Track Blaze events
window.blazeAnalytics = {
  trackPricing: function(tier) {
    mixpanel.track('Pricing View', {
      'tier': tier,
      'annual_price': tier === 'starter' ? 1188 : tier === 'growth' ? 3588 : 10000
    });
  },
  
  trackTeam: function(team) {
    mixpanel.track('Team Analytics View', {
      'team': team,
      'focus_teams': ['Cardinals', 'Titans', 'Longhorns', 'Grizzlies'].includes(team)
    });
  },
  
  trackLead: function(source) {
    mixpanel.track('Lead Generated', {
      'source': source,
      'potential_value': 1188
    });
  },
  
  trackReadiness: function(team, score) {
    mixpanel.track('Readiness Score', {
      'team': team,
      'score': score,
      'high_readiness': score > 85
    });
  }
};
</script>`;
        
        await fs.writeFile('includes/mixpanel.html', mixpanelScript);
        console.log('✅ Mixpanel configured');
    }

    async setupSentry() {
        console.log('🐛 Setting up Sentry error tracking...');
        
        const sentryScript = `<!-- Sentry Error Tracking -->
<script src="https://browser.sentry-cdn.com/7.114.0/bundle.tracing.min.js" 
        integrity="sha384-..." crossorigin="anonymous"></script>
<script>
  Sentry.init({
    dsn: '${this.sentryDsn}',
    environment: '${process.env.NODE_ENV || 'production'}',
    integrations: [
      new Sentry.BrowserTracing({
        // Track all route changes
        routingInstrumentation: Sentry.reactRouterV6Instrumentation(
          React.useEffect,
          useLocation,
          useNavigationType,
          createRoutesFromChildren,
          matchRoutes
        ),
      }),
    ],
    
    // Performance monitoring
    tracesSampleRate: 0.1,
    
    // Custom context for Blaze Intelligence
    beforeSend(event) {
      event.contexts = event.contexts || {};
      event.contexts.blaze = {
        platform: 'sports_analytics',
        focus_teams: ['Cardinals', 'Titans', 'Longhorns', 'Grizzlies']
      };
      return event;
    }
  });
  
  // Custom error boundaries for critical components
  window.addEventListener('unhandledrejection', function(event) {
    Sentry.captureException(event.reason);
  });
  
  // Track critical Blaze events as breadcrumbs
  window.blazeErrorTracking = {
    logDataUpdate: function(source) {
      Sentry.addBreadcrumb({
        message: 'Data pipeline update',
        category: 'data',
        data: { source: source },
        level: 'info'
      });
    },
    
    logAgentError: function(agent, error) {
      Sentry.captureException(new Error(\`Agent \${agent} failed: \${error}\`));
    }
  };
</script>`;
        
        await fs.writeFile('includes/sentry.html', sentryScript);
        console.log('✅ Sentry configured');
    }

    async setupBlazeTracking() {
        console.log('🔥 Setting up Blaze Intelligence custom tracking...');
        
        const blazeScript = `<!-- Blaze Intelligence Custom Analytics -->
<script>
// Blaze Intelligence Analytics Core
window.BlazeAnalytics = (function() {
  'use strict';
  
  // Internal event queue
  let eventQueue = [];
  let isInitialized = false;
  
  // Initialize tracking
  function init() {
    if (isInitialized) return;
    
    // Track page performance
    trackPagePerformance();
    
    // Track user engagement
    trackEngagement();
    
    // Track Cardinals updates
    trackCardinalsData();
    
    isInitialized = true;
    console.log('🔥 Blaze Analytics initialized');
  }
  
  function trackPagePerformance() {
    if (window.performance && window.performance.timing) {
      const timing = window.performance.timing;
      const loadTime = timing.loadEventEnd - timing.navigationStart;
      
      track('page_performance', {
        load_time: loadTime,
        dom_ready: timing.domContentLoadedEventEnd - timing.navigationStart,
        first_paint: timing.responseStart - timing.navigationStart
      });
    }
  }
  
  function trackEngagement() {
    let startTime = Date.now();
    let maxScroll = 0;
    
    // Track scroll depth
    window.addEventListener('scroll', function() {
      const scrollPercent = Math.round(
        (window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100
      );
      maxScroll = Math.max(maxScroll, scrollPercent);
    });
    
    // Track time on page when leaving
    window.addEventListener('beforeunload', function() {
      track('page_engagement', {
        time_on_page: Date.now() - startTime,
        max_scroll_percent: maxScroll,
        page: window.location.pathname
      });
    });
  }
  
  function trackCardinalsData() {
    // Check for Cardinals readiness updates
    if (window.cardinalsReadiness) {
      track('cardinals_readiness', {
        overall_score: window.cardinalsReadiness.overall,
        win_probability: window.cardinalsReadiness.winProbability,
        timestamp: new Date().toISOString()
      });
    }
  }
  
  // Core tracking function
  function track(event, properties) {
    const eventData = {
      event: event,
      properties: {
        ...properties,
        url: window.location.href,
        referrer: document.referrer,
        timestamp: new Date().toISOString(),
        user_agent: navigator.userAgent,
        platform: 'blaze_intelligence'
      }
    };
    
    // Send to all configured analytics
    if (window.gtag) {
      window.gtag('event', event, properties);
    }
    
    if (window.mixpanel) {
      window.mixpanel.track(event, properties);
    }
    
    // Store locally for debugging
    eventQueue.push(eventData);
    
    // Send to our own analytics endpoint
    fetch('/api/analytics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(eventData)
    }).catch(function(err) {
      console.warn('Analytics endpoint failed:', err);
    });
  }
  
  // Public API
  return {
    init: init,
    track: track,
    
    // Convenience methods
    trackLead: function(source) {
      track('lead_generated', { source: source });
    },
    
    trackPricing: function(tier) {
      track('pricing_interaction', { tier: tier });
    },
    
    trackTeamView: function(team) {
      track('team_analytics_view', { team: team });
    },
    
    trackReadiness: function(data) {
      track('readiness_update', data);
    },
    
    // Debug methods
    getEvents: function() { return eventQueue; },
    clearEvents: function() { eventQueue = []; }
  };
})();

// Auto-initialize on DOM ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', window.BlazeAnalytics.init);
} else {
  window.BlazeAnalytics.init();
}
</script>`;
        
        await fs.writeFile('includes/blaze-analytics.html', blazeScript);
        console.log('✅ Blaze custom tracking configured');
    }

    async updateHTMLTemplates() {
        console.log('📝 Updating HTML templates...');
        
        // List of HTML files to update
        const htmlFiles = [
            'index.html',
            'contact.html',
            'pricing.html',
            'pricing-comparison.html'
        ];
        
        const analyticsIncludes = `
    <!-- Analytics & Tracking -->
    ${this.gaId ? '<script src="/includes/google-analytics.html"></script>' : ''}
    ${this.mixpanelToken ? '<script src="/includes/mixpanel.html"></script>' : ''}
    ${this.sentryDsn ? '<script src="/includes/sentry.html"></script>' : ''}
    <script src="/includes/blaze-analytics.html"></script>`;
        
        for (const file of htmlFiles) {
            try {
                let content = await fs.readFile(file, 'utf8');
                
                // Add analytics before closing head tag
                if (!content.includes('blaze-analytics.html')) {
                    content = content.replace('</head>', analyticsIncludes + '\n</head>');
                    await fs.writeFile(file, content);
                    console.log(`✅ Updated ${file}`);
                }
            } catch (error) {
                console.log(`⏭️  Skipping ${file} (not found)`);
            }
        }
    }
}

// Run setup
const analytics = new AnalyticsSetup();
analytics.initialize().catch(console.error);