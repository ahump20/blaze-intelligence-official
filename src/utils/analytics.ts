// Analytics and monitoring utilities
declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
    mixpanel: any;
    hj: (...args: any[]) => void;
    _hjSettings: {
      hjid: number;
      hjsv: number;
    };
  }
}

export interface AnalyticsEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
  custom_parameters?: Record<string, any>;
}

class Analytics {
  private isProduction = process.env.NODE_ENV === 'production';
  private gaId = process.env.REACT_APP_GOOGLE_ANALYTICS_ID;
  private hotjarId = process.env.REACT_APP_HOTJAR_ID;
  private mixpanelToken = process.env.REACT_APP_MIXPANEL_TOKEN;

  constructor() {
    this.initializeAnalytics();
  }

  private initializeAnalytics() {
    if (!this.isProduction) {
      console.log('🔧 Analytics disabled in development mode');
      return;
    }

    // Initialize Google Analytics 4
    if (this.gaId) {
      this.initializeGA4();
    }

    // Initialize Hotjar
    if (this.hotjarId) {
      this.initializeHotjar();
    }

    // Initialize Mixpanel
    if (this.mixpanelToken) {
      this.initializeMixpanel();
    }
  }

  private initializeGA4() {
    // Load GA4 script
    const script = document.createElement('script');
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${this.gaId}`;
    document.head.appendChild(script);

    // Initialize gtag
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() {
      window.dataLayer.push(arguments);
    };
    window.gtag('js', new Date());
    window.gtag('config', this.gaId!, {
      send_page_view: false, // We'll handle page views manually
      custom_map: {
        custom_user_id: 'user_id',
        custom_subscription_plan: 'subscription_plan',
      },
    });

    console.log('📊 Google Analytics 4 initialized');
  }

  private initializeHotjar() {
    // Hotjar tracking code
    const script = `
      (function(h,o,t,j,a,r){
        h.hj=h.hj||function(){(h.hj.q=h.hj.q||[]).push(arguments)};
        h._hjSettings={hjid:${this.hotjarId},hjsv:6};
        a=o.getElementsByTagName('head')[0];
        r=o.createElement('script');r.async=1;
        r.src=t+h._hjSettings.hjid+j+h._hjSettings.hjsv;
        a.appendChild(r);
      })(window,document,'https://static.hotjar.com/c/hotjar-','.js?sv=');
    `;

    const scriptElement = document.createElement('script');
    scriptElement.innerHTML = script;
    document.head.appendChild(scriptElement);

    console.log('🔥 Hotjar initialized');
  }

  private initializeMixpanel() {
    // Load Mixpanel script
    const script = `
      (function(c,a){if(!a.__SV){var b=window;try{var d,m,j,k=b.location,f=k.hash;d=function(a,b){return(m=a.match(RegExp(b+"=([^&]*)")))?m[1]:null};f&&d(f,"state")&&(j=JSON.parse(decodeURIComponent(d(f,"state"))),"mpeditor"===j.action&&(b.sessionStorage.setItem("_mpcehash",f),history.replaceState(j.desiredHash||"",c.title,k.pathname+k.search)))}catch(n){}var l,h;window.mixpanel=a;a._i=[];a.init=function(b,d,g){function c(b,i){var a=i.split(".");2==a.length&&(b=b[a[0]],i=a[1]);b[i]=function(){b.push([i].concat(Array.prototype.slice.call(arguments,0)))}}var e=a;"undefined"!==typeof g?e=a[g]=[]:g="mixpanel";e.people=e.people||[];e.toString=function(b){var a="mixpanel";"mixpanel"!==g&&(a+="."+g);b||(a+=" (stub)");return a};e.people.toString=function(){return e.toString(1)+".people (stub)"};l="disable time_event track track_pageview track_links track_forms register register_once alias unregister identify name_tag set_config reset people.set people.set_once people.increment people.append people.union people.track_charge people.clear_charges people.delete_user".split(" ");for(h=0;h<l.length;h++)c(e,l[h]);a._i.push([b,d,g])};a.__SV=1.2;b=c.createElement("script");b.type="text/javascript";b.async=!0;b.src="undefined"!==typeof MIXPANEL_CUSTOM_LIB_URL?MIXPANEL_CUSTOM_LIB_URL:"file:"===c.location.protocol&&"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js".match(/^\\/\\//)?"https://cdn.mxpnl.com/libs/mixpanel-2-latest.min.js":"//cdn.mxpnl.com/libs/mixpanel-2-latest.min.js";d=c.getElementsByTagName("script")[0];d.parentNode.insertBefore(b,d)}})(document,window.mixpanel||[]);
      mixpanel.init("${this.mixpanelToken}");
    `;

    const scriptElement = document.createElement('script');
    scriptElement.innerHTML = script;
    document.head.appendChild(scriptElement);

    console.log('📈 Mixpanel initialized');
  }

  // Track page views
  trackPageView(path: string, title?: string) {
    if (!this.isProduction) {
      console.log('📄 Page view:', path, title);
      return;
    }

    // Google Analytics
    if (window.gtag && this.gaId) {
      window.gtag('config', this.gaId, {
        page_path: path,
        page_title: title,
      });
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track('Page View', {
        path,
        title,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Track custom events
  trackEvent(event: AnalyticsEvent) {
    if (!this.isProduction) {
      console.log('📊 Event tracked:', event);
      return;
    }

    // Google Analytics
    if (window.gtag) {
      window.gtag('event', event.action, {
        event_category: event.category,
        event_label: event.label,
        value: event.value,
        ...event.custom_parameters,
      });
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.track(event.action, {
        category: event.category,
        label: event.label,
        value: event.value,
        ...event.custom_parameters,
        timestamp: new Date().toISOString(),
      });
    }
  }

  // Track user properties
  identifyUser(userId: string, properties: Record<string, any> = {}) {
    if (!this.isProduction) {
      console.log('👤 User identified:', userId, properties);
      return;
    }

    // Google Analytics
    if (window.gtag) {
      window.gtag('config', this.gaId!, {
        user_id: userId,
        custom_map: properties,
      });
    }

    // Mixpanel
    if (window.mixpanel) {
      window.mixpanel.identify(userId);
      window.mixpanel.people.set(properties);
    }
  }

  // Track conversions
  trackConversion(conversionType: string, value?: number, currency: string = 'USD') {
    if (!this.isProduction) {
      console.log('💰 Conversion tracked:', conversionType, value, currency);
      return;
    }

    this.trackEvent({
      action: 'conversion',
      category: 'ecommerce',
      label: conversionType,
      value,
      custom_parameters: {
        currency,
        conversion_type: conversionType,
      },
    });

    // Enhanced ecommerce tracking
    if (window.gtag && value) {
      window.gtag('event', 'purchase', {
        transaction_id: `${Date.now()}-${Math.random()}`,
        value,
        currency,
        items: [
          {
            item_id: conversionType,
            item_name: conversionType,
            category: 'subscription',
            quantity: 1,
            price: value,
          },
        ],
      });
    }
  }

  // Track user engagement
  trackEngagement(feature: string, duration?: number) {
    this.trackEvent({
      action: 'engagement',
      category: 'user_behavior',
      label: feature,
      value: duration,
      custom_parameters: {
        feature,
        engagement_time_msec: duration,
      },
    });
  }

  // Track AI chat interactions
  trackAIChat(action: 'message_sent' | 'response_received' | 'chat_opened' | 'chat_closed', metadata?: Record<string, any>) {
    this.trackEvent({
      action: `ai_chat_${action}`,
      category: 'ai_interaction',
      custom_parameters: {
        ...metadata,
        timestamp: new Date().toISOString(),
      },
    });
  }

  // Track subscription events
  trackSubscription(action: 'upgrade' | 'downgrade' | 'cancel' | 'renew', plan: string, value?: number) {
    this.trackEvent({
      action: `subscription_${action}`,
      category: 'subscription',
      label: plan,
      value,
      custom_parameters: {
        plan,
        action,
      },
    });

    if (action === 'upgrade' && value) {
      this.trackConversion(`subscription_${plan}`, value);
    }
  }

  // Track social sharing
  trackShare(platform: string, content: string) {
    this.trackEvent({
      action: 'share',
      category: 'social',
      label: platform,
      custom_parameters: {
        platform,
        content_type: content,
      },
    });
  }

  // Track errors
  trackError(error: Error, context?: string) {
    if (!this.isProduction) {
      console.error('❌ Error tracked:', error, context);
      return;
    }

    this.trackEvent({
      action: 'exception',
      category: 'errors',
      label: error.message,
      custom_parameters: {
        error_name: error.name,
        error_message: error.message,
        error_stack: error.stack?.substring(0, 150),
        context,
      },
    });
  }
}

// Create singleton instance
export const analytics = new Analytics();

// Convenience functions
export const trackPageView = (path: string, title?: string) => analytics.trackPageView(path, title);
export const trackEvent = (event: AnalyticsEvent) => analytics.trackEvent(event);
export const identifyUser = (userId: string, properties?: Record<string, any>) => analytics.identifyUser(userId, properties);
export const trackConversion = (type: string, value?: number, currency?: string) => analytics.trackConversion(type, value, currency);
export const trackEngagement = (feature: string, duration?: number) => analytics.trackEngagement(feature, duration);
export const trackAIChat = (action: 'message_sent' | 'response_received' | 'chat_opened' | 'chat_closed', metadata?: Record<string, any>) => analytics.trackAIChat(action, metadata);
export const trackSubscription = (action: 'upgrade' | 'downgrade' | 'cancel' | 'renew', plan: string, value?: number) => analytics.trackSubscription(action, plan, value);
export const trackShare = (platform: string, content: string) => analytics.trackShare(platform, content);
export const trackError = (error: Error, context?: string) => analytics.trackError(error, context);

export default analytics;