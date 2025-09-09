// Enhanced Analytics Pipeline
import { v4 as uuidv4 } from 'uuid';

export interface AnalyticsEvent {
  id: string;
  timestamp: number;
  type: string;
  userId?: string;
  sessionId: string;
  data: Record<string, any>;
  metadata: {
    userAgent?: string;
    ip?: string;
    referrer?: string;
    page?: string;
    browser?: string;
    os?: string;
    device?: string;
  };
}

export interface MetricDefinition {
  name: string;
  type: 'counter' | 'gauge' | 'histogram' | 'timer';
  description: string;
  tags?: string[];
  unit?: string;
}

export interface AnalyticsConfig {
  enableRealTime: boolean;
  batchSize: number;
  flushInterval: number;
  retentionDays: number;
  enableDebug: boolean;
  endpoints: {
    collect: string;
    query: string;
    dashboard: string;
  };
}

export class EnhancedAnalytics {
  private events: AnalyticsEvent[] = [];
  private metrics: Map<string, any> = new Map();
  private sessionId: string;
  private userId?: string;
  private config: AnalyticsConfig;
  private flushTimer?: NodeJS.Timeout;
  private realTimeEnabled = true;

  constructor(config: Partial<AnalyticsConfig> = {}) {
    this.config = {
      enableRealTime: true,
      batchSize: 100,
      flushInterval: 30000, // 30 seconds
      retentionDays: 30,
      enableDebug: false,
      endpoints: {
        collect: '/api/analytics/collect',
        query: '/api/analytics/query',
        dashboard: '/api/analytics/dashboard'
      },
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.startFlushTimer();
    this.setupMetrics();
    
    if (this.config.enableDebug) {
      console.log('🔍 Enhanced Analytics initialized', {
        sessionId: this.sessionId,
        config: this.config
      });
    }
  }

  // Event Tracking
  track(event: string, data: Record<string, any> = {}, metadata: Partial<AnalyticsEvent['metadata']> = {}): void {
    const analyticsEvent: AnalyticsEvent = {
      id: uuidv4(),
      timestamp: Date.now(),
      type: event,
      userId: this.userId,
      sessionId: this.sessionId,
      data,
      metadata: {
        userAgent: navigator?.userAgent,
        referrer: document?.referrer,
        page: window?.location?.pathname,
        ...this.getDeviceInfo(),
        ...metadata
      }
    };

    this.events.push(analyticsEvent);

    if (this.config.enableDebug) {
      console.log('📊 Event tracked:', analyticsEvent);
    }

    // Real-time processing
    if (this.realTimeEnabled) {
      this.processEventRealTime(analyticsEvent);
    }

    // Auto-flush if batch size reached
    if (this.events.length >= this.config.batchSize) {
      this.flush();
    }
  }

  // Page View Tracking
  trackPageView(page?: string, data: Record<string, any> = {}): void {
    this.track('page_view', {
      page: page || window?.location?.pathname,
      title: document?.title,
      ...data
    });
  }

  // User Interaction Tracking
  trackClick(element: string, data: Record<string, any> = {}): void {
    this.track('click', {
      element,
      ...data
    });
  }

  // Performance Tracking
  trackPerformance(metric: string, value: number, unit: string = 'ms'): void {
    this.track('performance', {
      metric,
      value,
      unit,
      timestamp: Date.now()
    });
    
    this.updateMetric(metric, value);
  }

  // Error Tracking
  trackError(error: Error | string, context: Record<string, any> = {}): void {
    const errorData = typeof error === 'string' ? { message: error } : {
      message: error.message,
      stack: error.stack,
      name: error.name
    };

    this.track('error', {
      ...errorData,
      context
    });
  }

  // Sports-Specific Events
  trackSportsEvent(sport: string, eventType: string, data: Record<string, any> = {}): void {
    this.track('sports_event', {
      sport,
      eventType,
      ...data
    });
  }

  // Video Analysis Events
  trackVideoAnalysis(analysisId: string, progress: number, data: Record<string, any> = {}): void {
    this.track('video_analysis', {
      analysisId,
      progress,
      ...data
    });
  }

  // WebSocket Events
  trackWebSocketEvent(eventType: string, data: Record<string, any> = {}): void {
    this.track('websocket', {
      eventType,
      ...data
    });
  }

  // Metric Management
  updateMetric(name: string, value: number): void {
    const existing = this.metrics.get(name) || { count: 0, sum: 0, min: Infinity, max: -Infinity };
    
    this.metrics.set(name, {
      count: existing.count + 1,
      sum: existing.sum + value,
      min: Math.min(existing.min, value),
      max: Math.max(existing.max, value),
      avg: (existing.sum + value) / (existing.count + 1),
      last: value,
      lastUpdated: Date.now()
    });
  }

  getMetric(name: string): any {
    return this.metrics.get(name);
  }

  getAllMetrics(): Record<string, any> {
    return Object.fromEntries(this.metrics.entries());
  }

  // Real-time Processing
  private processEventRealTime(event: AnalyticsEvent): void {
    // Process high-priority events immediately
    const highPriorityEvents = ['error', 'performance', 'sports_event'];
    
    if (highPriorityEvents.includes(event.type)) {
      this.sendEventImmediate(event);
    }

    // Update real-time metrics
    this.updateRealTimeMetrics(event);
  }

  private updateRealTimeMetrics(event: AnalyticsEvent): void {
    // Update session metrics
    this.updateMetric('events_per_session', 1);
    this.updateMetric('session_duration', Date.now() - this.getSessionStartTime());

    // Update event type metrics
    this.updateMetric(`events_${event.type}`, 1);

    // Sports-specific metrics
    if (event.type === 'sports_event') {
      this.updateMetric(`sports_${event.data.sport}`, 1);
    }
  }

  // Data Persistence
  async flush(): Promise<void> {
    if (this.events.length === 0) return;

    const eventsToSend = [...this.events];
    this.events = [];

    if (this.config.enableDebug) {
      console.log(`🚀 Flushing ${eventsToSend.length} events`);
    }

    try {
      await this.sendEvents(eventsToSend);
    } catch (error) {
      console.error('❌ Failed to send analytics events:', error);
      // Re-add events to queue for retry
      this.events.unshift(...eventsToSend);
    }
  }

  private async sendEvents(events: AnalyticsEvent[]): Promise<void> {
    const response = await fetch(this.config.endpoints.collect, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        events,
        metadata: {
          sessionId: this.sessionId,
          userId: this.userId,
          timestamp: Date.now()
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Analytics API error: ${response.status}`);
    }
  }

  private async sendEventImmediate(event: AnalyticsEvent): Promise<void> {
    try {
      await this.sendEvents([event]);
    } catch (error) {
      console.error('❌ Failed to send immediate event:', error);
    }
  }

  // Session Management
  setUserId(userId: string): void {
    this.userId = userId;
    this.track('user_identified', { userId });
  }

  startNewSession(): void {
    this.sessionId = this.generateSessionId();
    this.track('session_start');
  }

  endSession(): void {
    this.track('session_end', {
      duration: Date.now() - this.getSessionStartTime(),
      eventCount: this.events.length
    });
    this.flush();
  }

  // Utility Methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private getSessionStartTime(): number {
    // Extract timestamp from session ID
    const match = this.sessionId.match(/session_(\d+)_/);
    return match ? parseInt(match[1]) : Date.now();
  }

  private getDeviceInfo(): Partial<AnalyticsEvent['metadata']> {
    if (typeof navigator === 'undefined') return {};

    return {
      browser: this.getBrowserName(),
      os: this.getOSName(),
      device: this.getDeviceType()
    };
  }

  private getBrowserName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Chrome')) return 'Chrome';
    if (userAgent.includes('Firefox')) return 'Firefox';
    if (userAgent.includes('Safari')) return 'Safari';
    if (userAgent.includes('Edge')) return 'Edge';
    return 'Unknown';
  }

  private getOSName(): string {
    const userAgent = navigator.userAgent;
    if (userAgent.includes('Windows')) return 'Windows';
    if (userAgent.includes('Mac')) return 'macOS';
    if (userAgent.includes('Linux')) return 'Linux';
    if (userAgent.includes('Android')) return 'Android';
    if (userAgent.includes('iOS')) return 'iOS';
    return 'Unknown';
  }

  private getDeviceType(): string {
    const userAgent = navigator.userAgent;
    if (/Mobi|Android/i.test(userAgent)) return 'Mobile';
    if (/Tablet|iPad/i.test(userAgent)) return 'Tablet';
    return 'Desktop';
  }

  // Timer Management
  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      this.flush();
    }, this.config.flushInterval);
  }

  private stopFlushTimer(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer);
      this.flushTimer = undefined;
    }
  }

  // Setup Methods
  private setupMetrics(): void {
    // Initialize core metrics
    this.metrics.set('session_start_time', {
      value: Date.now(),
      type: 'timestamp'
    });

    // Setup performance observer if available
    if (typeof PerformanceObserver !== 'undefined') {
      this.setupPerformanceObserver();
    }
  }

  private setupPerformanceObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        entries.forEach((entry) => {
          this.trackPerformance(`${entry.entryType}_${entry.name}`, entry.duration);
        });
      });

      observer.observe({ entryTypes: ['navigation', 'paint', 'largest-contentful-paint'] });
    } catch (error) {
      if (this.config.enableDebug) {
        console.warn('⚠️ Performance Observer not supported:', error);
      }
    }
  }

  // Cleanup
  destroy(): void {
    this.stopFlushTimer();
    this.flush();
    this.events = [];
    this.metrics.clear();
  }

  // Query Interface
  async query(queryParams: Record<string, any>): Promise<any> {
    const response = await fetch(this.config.endpoints.query, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(queryParams)
    });

    if (!response.ok) {
      throw new Error(`Analytics query error: ${response.status}`);
    }

    return response.json();
  }

  // Dashboard Data
  async getDashboardData(): Promise<any> {
    const response = await fetch(this.config.endpoints.dashboard);
    
    if (!response.ok) {
      throw new Error(`Dashboard data error: ${response.status}`);
    }

    return response.json();
  }
}

// Global Analytics Instance
export const analytics = new EnhancedAnalytics({
  enableDebug: process.env.NODE_ENV === 'development',
  enableRealTime: true
});

// Auto-setup for browser environment
if (typeof window !== 'undefined') {
  // Track page loads
  window.addEventListener('load', () => {
    analytics.trackPageView();
  });

  // Track page unloads
  window.addEventListener('beforeunload', () => {
    analytics.endSession();
  });

  // Track errors
  window.addEventListener('error', (event) => {
    analytics.trackError(event.error || event.message, {
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno
    });
  });

  // Track clicks
  document.addEventListener('click', (event) => {
    const target = event.target as HTMLElement;
    if (target.dataset.track) {
      analytics.trackClick(target.dataset.track, {
        text: target.textContent,
        tagName: target.tagName,
        className: target.className
      });
    }
  });
}

export default analytics;