// Blaze Intelligence Analytics Pipeline
// User behavior tracking and business intelligence system

import { useEffect } from 'react';
import mixpanel from 'mixpanel-browser';
import * as Sentry from '@sentry/nextjs';
import { v4 as uuidv4 } from 'uuid';

// Configuration
const ANALYTICS_CONFIG = {
  mixpanel: {
    token: process.env.NEXT_PUBLIC_MIXPANEL_TOKEN || '',
    config: {
      debug: process.env.NODE_ENV === 'development',
      track_pageview: true,
      persistence: 'localStorage',
      ip: false, // GDPR compliance
      property_blacklist: ['$current_url', '$referrer']
    }
  },
  segment: {
    writeKey: process.env.NEXT_PUBLIC_SEGMENT_WRITE_KEY || ''
  },
  google: {
    measurementId: process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''
  },
  hotjar: {
    siteId: process.env.NEXT_PUBLIC_HOTJAR_SITE_ID || ''
  },
  amplitude: {
    apiKey: process.env.NEXT_PUBLIC_AMPLITUDE_API_KEY || ''
  }
};

// User identification and session management
class UserSession {
  private sessionId: string;
  private userId: string | null;
  private sessionStart: number;
  private pageViews: number;
  private events: any[];
  
  constructor() {
    this.sessionId = this.getOrCreateSessionId();
    this.userId = this.getUserId();
    this.sessionStart = Date.now();
    this.pageViews = 0;
    this.events = [];
    
    this.initializeSession();
  }
  
  private getOrCreateSessionId(): string {
    const stored = sessionStorage.getItem('blaze_session_id');
    if (stored) return stored;
    
    const newId = uuidv4();
    sessionStorage.setItem('blaze_session_id', newId);
    return newId;
  }
  
  private getUserId(): string | null {
    return localStorage.getItem('blaze_user_id');
  }
  
  private initializeSession() {
    // Set session timeout (30 minutes of inactivity)
    let timeout: NodeJS.Timeout;
    const resetTimeout = () => {
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        this.endSession();
        this.sessionId = this.getOrCreateSessionId();
        this.sessionStart = Date.now();
        this.pageViews = 0;
      }, 30 * 60 * 1000);
    };
    
    ['mousedown', 'keydown', 'scroll', 'touchstart'].forEach(event => {
      document.addEventListener(event, resetTimeout);
    });
    
    resetTimeout();
  }
  
  public setUserId(userId: string) {
    this.userId = userId;
    localStorage.setItem('blaze_user_id', userId);
  }
  
  public clearUserId() {
    this.userId = null;
    localStorage.removeItem('blaze_user_id');
  }
  
  public incrementPageViews() {
    this.pageViews++;
  }
  
  public addEvent(event: any) {
    this.events.push({
      ...event,
      timestamp: Date.now()
    });
  }
  
  public getSessionData() {
    return {
      sessionId: this.sessionId,
      userId: this.userId,
      duration: Date.now() - this.sessionStart,
      pageViews: this.pageViews,
      eventCount: this.events.length
    };
  }
  
  private endSession() {
    const sessionData = this.getSessionData();
    // Send session data to analytics
    BlazeAnalytics.track('Session Ended', sessionData);
  }
}

// Main Analytics Class
class BlazeAnalyticsCore {
  private initialized: boolean = false;
  private session: UserSession;
  private queue: any[] = [];
  private userProperties: Record<string, any> = {};
  
  constructor() {
    this.session = new UserSession();
  }
  
  public async initialize() {
    if (this.initialized) return;
    
    try {
      // Initialize Mixpanel
      if (ANALYTICS_CONFIG.mixpanel.token) {
        mixpanel.init(ANALYTICS_CONFIG.mixpanel.token, ANALYTICS_CONFIG.mixpanel.config);
      }
      
      // Initialize Segment
      if (ANALYTICS_CONFIG.segment.writeKey && typeof window !== 'undefined') {
        const analytics = (window as any).analytics;
        if (analytics) {
          analytics.load(ANALYTICS_CONFIG.segment.writeKey);
        }
      }
      
      // Initialize Google Analytics
      if (ANALYTICS_CONFIG.google.measurementId && typeof window !== 'undefined') {
        const script = document.createElement('script');
        script.src = `https://www.googletagmanager.com/gtag/js?id=${ANALYTICS_CONFIG.google.measurementId}`;
        script.async = true;
        document.head.appendChild(script);
        
        (window as any).dataLayer = (window as any).dataLayer || [];
        function gtag(...args: any[]) {
          (window as any).dataLayer.push(arguments);
        }
        gtag('js', new Date());
        gtag('config', ANALYTICS_CONFIG.google.measurementId);
      }
      
      // Process queued events
      this.processQueue();
      this.initialized = true;
      
      console.log('🔥 Blaze Analytics initialized');
    } catch (error) {
      console.error('Failed to initialize analytics:', error);
      Sentry.captureException(error);
    }
  }
  
  public identify(userId: string, traits?: Record<string, any>) {
    if (!this.initialized) {
      this.queue.push({ type: 'identify', userId, traits });
      return;
    }
    
    this.session.setUserId(userId);
    this.userProperties = { ...this.userProperties, ...traits };
    
    // Mixpanel
    if (mixpanel.get_distinct_id) {
      mixpanel.identify(userId);
      if (traits) mixpanel.people.set(traits);
    }
    
    // Segment
    const analytics = (window as any).analytics;
    if (analytics?.identify) {
      analytics.identify(userId, traits);
    }
    
    // Amplitude
    if ((window as any).amplitude) {
      (window as any).amplitude.getInstance().setUserId(userId);
      if (traits) {
        (window as any).amplitude.getInstance().setUserProperties(traits);
      }
    }
  }
  
  public track(eventName: string, properties?: Record<string, any>) {
    if (!this.initialized) {
      this.queue.push({ type: 'track', eventName, properties });
      return;
    }
    
    const enrichedProperties = {
      ...properties,
      ...this.getContextProperties(),
      timestamp: new Date().toISOString()
    };
    
    this.session.addEvent({ name: eventName, properties: enrichedProperties });
    
    // Mixpanel
    if (mixpanel.track) {
      mixpanel.track(eventName, enrichedProperties);
    }
    
    // Segment
    const analytics = (window as any).analytics;
    if (analytics?.track) {
      analytics.track(eventName, enrichedProperties);
    }
    
    // Google Analytics
    if ((window as any).gtag) {
      (window as any).gtag('event', eventName, enrichedProperties);
    }
    
    // Amplitude
    if ((window as any).amplitude) {
      (window as any).amplitude.getInstance().logEvent(eventName, enrichedProperties);
    }
    
    // Custom backend logging
    this.sendToBackend(eventName, enrichedProperties);
  }
  
  public page(name?: string, properties?: Record<string, any>) {
    this.session.incrementPageViews();
    
    const pageProperties = {
      name: name || document.title,
      url: window.location.href,
      path: window.location.pathname,
      referrer: document.referrer,
      ...properties,
      ...this.getContextProperties()
    };
    
    this.track('Page Viewed', pageProperties);
    
    // Segment specific
    const analytics = (window as any).analytics;
    if (analytics?.page) {
      analytics.page(name, pageProperties);
    }
  }
  
  public timing(category: string, variable: string, value: number, label?: string) {
    this.track('Performance Timing', {
      category,
      variable,
      value,
      label,
      unit: 'ms'
    });
    
    // Google Analytics specific timing
    if ((window as any).gtag) {
      (window as any).gtag('event', 'timing_complete', {
        name: variable,
        value,
        event_category: category,
        event_label: label
      });
    }
  }
  
  public revenue(amount: number, properties?: Record<string, any>) {
    const revenueProperties = {
      amount,
      currency: 'USD',
      ...properties
    };
    
    this.track('Revenue Generated', revenueProperties);
    
    // Mixpanel specific revenue tracking
    if (mixpanel.people?.track_charge) {
      mixpanel.people.track_charge(amount, revenueProperties);
    }
  }
  
  public reset() {
    this.session.clearUserId();
    this.userProperties = {};
    
    if (mixpanel.reset) mixpanel.reset();
    
    const analytics = (window as any).analytics;
    if (analytics?.reset) analytics.reset();
  }
  
  private getContextProperties() {
    return {
      sessionId: this.session.getSessionData().sessionId,
      sessionDuration: this.session.getSessionData().duration,
      pageViews: this.session.getSessionData().pageViews,
      browser: this.getBrowserInfo(),
      device: this.getDeviceInfo(),
      location: this.getLocationInfo(),
      utm: this.getUTMParameters(),
      ...this.userProperties
    };
  }
  
  private getBrowserInfo() {
    return {
      userAgent: navigator.userAgent,
      language: navigator.language,
      platform: navigator.platform,
      vendor: navigator.vendor,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      viewportSize: `${window.innerWidth}x${window.innerHeight}`,
      colorDepth: window.screen.colorDepth
    };
  }
  
  private getDeviceInfo() {
    const ua = navigator.userAgent;
    return {
      isMobile: /Mobile|Android|iPhone/i.test(ua),
      isTablet: /iPad|Tablet/i.test(ua),
      isDesktop: !/Mobile|Android|iPhone|iPad|Tablet/i.test(ua),
      os: this.detectOS(),
      browser: this.detectBrowser()
    };
  }
  
  private detectOS() {
    const ua = navigator.userAgent;
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad/i.test(ua)) return 'iOS';
    return 'Unknown';
  }
  
  private detectBrowser() {
    const ua = navigator.userAgent;
    if (/Chrome/i.test(ua)) return 'Chrome';
    if (/Safari/i.test(ua)) return 'Safari';
    if (/Firefox/i.test(ua)) return 'Firefox';
    if (/Edge/i.test(ua)) return 'Edge';
    return 'Unknown';
  }
  
  private getLocationInfo() {
    return {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      locale: navigator.language
    };
  }
  
  private getUTMParameters() {
    const params = new URLSearchParams(window.location.search);
    return {
      source: params.get('utm_source'),
      medium: params.get('utm_medium'),
      campaign: params.get('utm_campaign'),
      term: params.get('utm_term'),
      content: params.get('utm_content')
    };
  }
  
  private async sendToBackend(eventName: string, properties: Record<string, any>) {
    try {
      await fetch('/api/analytics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: eventName,
          properties,
          timestamp: Date.now()
        })
      });
    } catch (error) {
      console.error('Failed to send analytics to backend:', error);
    }
  }
  
  private processQueue() {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (item.type === 'identify') {
        this.identify(item.userId, item.traits);
      } else if (item.type === 'track') {
        this.track(item.eventName, item.properties);
      }
    }
  }
}

// Singleton instance
export const BlazeAnalytics = new BlazeAnalyticsCore();

// React Hooks
export const useAnalytics = () => {
  useEffect(() => {
    BlazeAnalytics.initialize();
  }, []);
  
  return {
    track: BlazeAnalytics.track.bind(BlazeAnalytics),
    identify: BlazeAnalytics.identify.bind(BlazeAnalytics),
    page: BlazeAnalytics.page.bind(BlazeAnalytics),
    timing: BlazeAnalytics.timing.bind(BlazeAnalytics),
    revenue: BlazeAnalytics.revenue.bind(BlazeAnalytics),
    reset: BlazeAnalytics.reset.bind(BlazeAnalytics)
  };
};

// Performance monitoring
export const usePerformanceTracking = () => {
  useEffect(() => {
    // Web Vitals tracking
    if ('PerformanceObserver' in window) {
      // First Contentful Paint
      const paintObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.name === 'first-contentful-paint') {
            BlazeAnalytics.timing('Performance', 'FCP', Math.round(entry.startTime));
          }
        }
      });
      paintObserver.observe({ entryTypes: ['paint'] });
      
      // Largest Contentful Paint
      const lcpObserver = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        BlazeAnalytics.timing('Performance', 'LCP', Math.round(lastEntry.startTime));
      });
      lcpObserver.observe({ entryTypes: ['largest-contentful-paint'] });
      
      // First Input Delay
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const eventEntry = entry as any;
          const fid = eventEntry.processingStart - eventEntry.startTime;
          BlazeAnalytics.timing('Performance', 'FID', Math.round(fid));
        }
      });
      fidObserver.observe({ entryTypes: ['first-input'] });
    }
    
    // Page Load Time
    window.addEventListener('load', () => {
      setTimeout(() => {
        const perfData = performance.timing;
        const pageLoadTime = perfData.loadEventEnd - perfData.navigationStart;
        BlazeAnalytics.timing('Performance', 'Page Load', pageLoadTime);
        
        // Additional metrics
        const dnsTime = perfData.domainLookupEnd - perfData.domainLookupStart;
        const tcpTime = perfData.connectEnd - perfData.connectStart;
        const ttfb = perfData.responseStart - perfData.navigationStart;
        
        BlazeAnalytics.track('Performance Metrics', {
          pageLoadTime,
          dnsTime,
          tcpTime,
          ttfb,
          domContentLoaded: perfData.domContentLoadedEventEnd - perfData.navigationStart,
          domInteractive: perfData.domInteractive - perfData.navigationStart
        });
      }, 0);
    });
  }, []);
};

// Event tracking utilities
export const trackClick = (elementName: string, properties?: Record<string, any>) => {
  BlazeAnalytics.track('Element Clicked', {
    element: elementName,
    ...properties
  });
};

export const trackFormSubmit = (formName: string, properties?: Record<string, any>) => {
  BlazeAnalytics.track('Form Submitted', {
    form: formName,
    ...properties
  });
};

export const trackError = (error: Error, context?: Record<string, any>) => {
  BlazeAnalytics.track('Error Occurred', {
    message: error.message,
    stack: error.stack,
    ...context
  });
  Sentry.captureException(error, { extra: context });
};

// Conversion tracking
export const trackConversion = (type: string, value?: number, properties?: Record<string, any>) => {
  BlazeAnalytics.track('Conversion', {
    type,
    value,
    ...properties
  });
  
  if (value) {
    BlazeAnalytics.revenue(value, { conversionType: type, ...properties });
  }
};
