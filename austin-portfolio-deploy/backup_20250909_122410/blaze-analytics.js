/**
 * Blaze Intelligence Advanced Analytics System
 * Championship-level prospect behavior tracking and analysis
 */

class BlazeAnalytics {
    constructor() {
        this.sessionId = this.generateSessionId();
        this.startTime = Date.now();
        this.events = [];
        this.heatmapData = [];
        this.scrollMilestones = [];
        this.init();
    }

    generateSessionId() {
        return 'blz_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    init() {
        this.trackPageView();
        this.setupScrollTracking();
        this.setupClickTracking();
        this.setupFormTracking();
        this.setupEngagementTracking();
        this.setupHeatmapTracking();
        this.setupExitIntentTracking();
        this.sendPeriodicData();
    }

    trackPageView() {
        const pageData = {
            sessionId: this.sessionId,
            event: 'page_view',
            timestamp: Date.now(),
            page: {
                url: window.location.href,
                path: window.location.pathname,
                title: document.title,
                referrer: document.referrer,
                userAgent: navigator.userAgent,
                screenResolution: `${screen.width}x${screen.height}`,
                viewportSize: `${window.innerWidth}x${window.innerHeight}`
            },
            user: {
                language: navigator.language,
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                cookieEnabled: navigator.cookieEnabled
            }
        };

        this.logEvent(pageData);
        this.sendToAnalytics(pageData);
    }

    setupScrollTracking() {
        let maxScroll = 0;
        const milestones = [25, 50, 75, 90, 100];
        const achieved = new Set();

        const trackScroll = () => {
            const scrollPercent = Math.round(
                (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
            );
            
            maxScroll = Math.max(maxScroll, scrollPercent);

            // Track milestone achievements
            milestones.forEach(milestone => {
                if (scrollPercent >= milestone && !achieved.has(milestone)) {
                    achieved.add(milestone);
                    this.logEvent({
                        sessionId: this.sessionId,
                        event: 'scroll_milestone',
                        timestamp: Date.now(),
                        data: { 
                            milestone, 
                            timeToMilestone: Date.now() - this.startTime,
                            scrollSpeed: scrollPercent / ((Date.now() - this.startTime) / 1000)
                        }
                    });
                }
            });
        };

        let scrollTimeout;
        window.addEventListener('scroll', () => {
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(trackScroll, 100);
        });

        // Track final scroll on page unload
        window.addEventListener('beforeunload', () => {
            this.logEvent({
                sessionId: this.sessionId,
                event: 'final_scroll',
                timestamp: Date.now(),
                data: { maxScrollPercent: maxScroll, totalTime: Date.now() - this.startTime }
            });
        });
    }

    setupClickTracking() {
        document.addEventListener('click', (e) => {
            const element = e.target;
            const clickData = {
                sessionId: this.sessionId,
                event: 'element_click',
                timestamp: Date.now(),
                data: {
                    tagName: element.tagName.toLowerCase(),
                    className: element.className,
                    id: element.id,
                    text: element.textContent?.trim().substring(0, 100),
                    href: element.href,
                    coordinates: { x: e.clientX, y: e.clientY },
                    pageCoordinates: { x: e.pageX, y: e.pageY }
                }
            };

            this.logEvent(clickData);

            // Track specific high-value clicks
            const highValueSelectors = [
                'button', 
                'a[href*="calculator"]', 
                'a[href*="demo"]', 
                'a[href*="mailto"]',
                '.action-btn',
                '.test-button'
            ];

            if (highValueSelectors.some(selector => element.matches(selector))) {
                clickData.event = 'high_value_click';
                clickData.data.conversionPotential = 'high';
                this.sendToAnalytics(clickData);
            }
        });
    }

    setupFormTracking() {
        // Track form interactions
        document.addEventListener('input', (e) => {
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' || e.target.tagName === 'TEXTAREA') {
                this.logEvent({
                    sessionId: this.sessionId,
                    event: 'form_interaction',
                    timestamp: Date.now(),
                    data: {
                        fieldName: e.target.name || e.target.id,
                        fieldType: e.target.type,
                        valueLength: e.target.value.length
                    }
                });
            }
        });

        // Track calculator usage specifically
        const calculatorElements = document.querySelectorAll('#orgType, #numTeams, #hudlTier, #contractLength');
        calculatorElements.forEach(element => {
            element.addEventListener('change', () => {
                this.logEvent({
                    sessionId: this.sessionId,
                    event: 'calculator_usage',
                    timestamp: Date.now(),
                    data: {
                        field: element.id,
                        value: element.value,
                        engagementLevel: 'high'
                    }
                });
                this.sendToAnalytics({
                    sessionId: this.sessionId,
                    event: 'prospect_calculator_engaged',
                    timestamp: Date.now(),
                    conversionSignal: 'strong'
                });
            });
        });
    }

    setupEngagementTracking() {
        // Track time on elements
        let focusedElement = null;
        let focusStartTime = null;

        document.addEventListener('mouseenter', (e) => {
            if (e.target.matches('.demo-card, .calculator-panel, .insight-panel, .live-metrics')) {
                focusedElement = e.target;
                focusStartTime = Date.now();
            }
        });

        document.addEventListener('mouseleave', (e) => {
            if (focusedElement === e.target && focusStartTime) {
                const timeSpent = Date.now() - focusStartTime;
                if (timeSpent > 1000) { // Only track if spent more than 1 second
                    this.logEvent({
                        sessionId: this.sessionId,
                        event: 'element_engagement',
                        timestamp: Date.now(),
                        data: {
                            element: e.target.className,
                            timeSpent,
                            engagementScore: this.calculateEngagementScore(timeSpent)
                        }
                    });
                }
                focusedElement = null;
                focusStartTime = null;
            }
        });

        // Track video/demo interactions
        document.addEventListener('click', (e) => {
            if (e.target.matches('.test-button, button[onclick*="Test"]')) {
                this.logEvent({
                    sessionId: this.sessionId,
                    event: 'demo_interaction',
                    timestamp: Date.now(),
                    data: {
                        demoType: e.target.textContent.includes('Blaze') ? 'blaze_test' : 'competitor_test',
                        interactionStrength: 'strong'
                    }
                });
                this.sendToAnalytics({
                    sessionId: this.sessionId,
                    event: 'prospect_demo_engaged',
                    timestamp: Date.now(),
                    conversionSignal: 'very_strong'
                });
            }
        });
    }

    setupHeatmapTracking() {
        let mouseMoveCount = 0;
        
        document.addEventListener('mousemove', (e) => {
            mouseMoveCount++;
            
            // Sample mouse movements (every 50th movement)
            if (mouseMoveCount % 50 === 0) {
                this.heatmapData.push({
                    x: e.clientX,
                    y: e.clientY,
                    timestamp: Date.now()
                });
            }
        });

        // Track rage clicks (multiple rapid clicks in same area)
        let lastClick = null;
        let clickCount = 0;
        
        document.addEventListener('click', (e) => {
            const currentClick = { x: e.clientX, y: e.clientY, time: Date.now() };
            
            if (lastClick && 
                Math.abs(currentClick.x - lastClick.x) < 50 && 
                Math.abs(currentClick.y - lastClick.y) < 50 && 
                currentClick.time - lastClick.time < 2000) {
                clickCount++;
                
                if (clickCount >= 3) {
                    this.logEvent({
                        sessionId: this.sessionId,
                        event: 'rage_click',
                        timestamp: Date.now(),
                        data: {
                            coordinates: currentClick,
                            clickCount,
                            frustrationLevel: 'high'
                        }
                    });
                }
            } else {
                clickCount = 1;
            }
            
            lastClick = currentClick;
        });
    }

    setupExitIntentTracking() {
        let hasShownExitIntent = false;
        
        document.addEventListener('mouseleave', (e) => {
            // Detect if mouse is leaving from the top of the page (likely closing tab)
            if (e.clientY <= 0 && !hasShownExitIntent && (Date.now() - this.startTime) > 30000) {
                hasShownExitIntent = true;
                
                this.logEvent({
                    sessionId: this.sessionId,
                    event: 'exit_intent',
                    timestamp: Date.now(),
                    data: {
                        timeOnPage: Date.now() - this.startTime,
                        scrollProgress: this.getMaxScroll(),
                        engagementLevel: this.calculateOverallEngagement()
                    }
                });

                // Show exit intent conversion
                this.showExitIntentModal();
            }
        });
    }

    showExitIntentModal() {
        // Don't show if already converted or on certain pages
        if (localStorage.getItem('blaze-exit-intent-shown')) return;
        
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; right: 0; bottom: 0; z-index: 99999;
            background: rgba(0,0,0,0.9); display: flex; align-items: center; justify-content: center;
            animation: fadeIn 0.3s ease-out;
        `;

        modal.innerHTML = `
            <div style="
                background: linear-gradient(135deg, #1a1a2e, #16213e);
                padding: 3rem; border-radius: 20px; text-align: center; max-width: 600px;
                border: 3px solid #00ffff; box-shadow: 0 20px 60px rgba(0,255,255,0.3);
            ">
                <h2 style="color: #00ffff; margin-bottom: 1rem; font-size: 2rem;">
                    🚨 Wait! Before You Go...
                </h2>
                <p style="color: #e2e8f0; margin-bottom: 2rem; font-size: 1.2rem; line-height: 1.6;">
                    You've seen our <strong>2ms response times</strong> and <strong>25-50% cost savings</strong>.<br>
                    Ready to experience live MLB intelligence?
                </p>
                <div style="display: flex; gap: 1rem; justify-content: center;">
                    <a href="/mlb-intelligence-showcase.html" onclick="blazeAnalytics.trackConversion('exit_intent_convert')" style="
                        background: linear-gradient(45deg, #00ffff, #ff8c00);
                        color: white; padding: 1.5rem 2rem; border-radius: 12px;
                        text-decoration: none; font-weight: bold; font-size: 1.1rem;
                    ">⚾ See Live MLB Data</a>
                    <a href="mailto:ahump20@outlook.com?subject=Blaze Intelligence Demo Request" onclick="blazeAnalytics.trackConversion('exit_intent_email')" style="
                        background: linear-gradient(45deg, #10b981, #059669);
                        color: white; padding: 1.5rem 2rem; border-radius: 12px;
                        text-decoration: none; font-weight: bold; font-size: 1.1rem;
                    ">📧 Request Demo</a>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" style="
                        background: rgba(255,255,255,0.1); color: #e2e8f0;
                        border: 1px solid rgba(255,255,255,0.2); padding: 1.5rem 2rem;
                        border-radius: 12px; cursor: pointer; font-size: 1.1rem;
                    ">Continue Browsing</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        localStorage.setItem('blaze-exit-intent-shown', 'true');
        
        this.sendToAnalytics({
            sessionId: this.sessionId,
            event: 'exit_intent_modal_shown',
            timestamp: Date.now(),
            conversionOpportunity: 'critical'
        });
    }

    calculateEngagementScore(timeSpent) {
        if (timeSpent > 10000) return 'very_high';
        if (timeSpent > 5000) return 'high';
        if (timeSpent > 2000) return 'medium';
        return 'low';
    }

    calculateOverallEngagement() {
        const timeOnPage = Date.now() - this.startTime;
        const eventCount = this.events.length;
        const scrollProgress = this.getMaxScroll();
        
        let score = 0;
        if (timeOnPage > 60000) score += 30; // 1+ minutes
        if (timeOnPage > 300000) score += 20; // 5+ minutes
        if (eventCount > 10) score += 25;
        if (scrollProgress > 75) score += 25;
        
        if (score >= 75) return 'very_high';
        if (score >= 50) return 'high';
        if (score >= 25) return 'medium';
        return 'low';
    }

    getMaxScroll() {
        const scrollPercent = Math.round(
            (window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100
        );
        return Math.max(0, Math.min(100, scrollPercent));
    }

    trackConversion(type) {
        this.logEvent({
            sessionId: this.sessionId,
            event: 'conversion',
            timestamp: Date.now(),
            data: {
                conversionType: type,
                timeToConversion: Date.now() - this.startTime,
                totalEvents: this.events.length,
                conversionPath: this.getConversionPath()
            }
        });
        
        this.sendToAnalytics({
            sessionId: this.sessionId,
            event: 'CONVERSION_ACHIEVED',
            timestamp: Date.now(),
            priority: 'critical',
            data: { type, sessionSummary: this.generateSessionSummary() }
        });
    }

    getConversionPath() {
        return this.events
            .filter(e => e.event.includes('click') || e.event.includes('demo') || e.event.includes('calculator'))
            .map(e => e.event)
            .slice(-10); // Last 10 relevant events
    }

    generateSessionSummary() {
        return {
            duration: Date.now() - this.startTime,
            totalEvents: this.events.length,
            maxScroll: this.getMaxScroll(),
            engagementLevel: this.calculateOverallEngagement(),
            highValueClicks: this.events.filter(e => e.event === 'high_value_click').length,
            conversionSignals: this.events.filter(e => e.conversionSignal).length
        };
    }

    logEvent(eventData) {
        this.events.push(eventData);
        console.log('🔥 Blaze Analytics:', eventData);
    }

    sendToAnalytics(data) {
        // In a real implementation, this would send to your analytics service
        // For now, we'll store locally and could send to a webhook
        
        try {
            // Store high-priority events for later transmission
            let storedAnalytics = JSON.parse(localStorage.getItem('blaze-analytics') || '[]');
            storedAnalytics.push(data);
            
            // Keep only last 100 events
            if (storedAnalytics.length > 100) {
                storedAnalytics = storedAnalytics.slice(-100);
            }
            
            localStorage.setItem('blaze-analytics', JSON.stringify(storedAnalytics));
            
            // Send critical events immediately (conversions, high-value actions)
            if (data.priority === 'critical' || data.conversionSignal || data.event.includes('conversion')) {
                this.sendImmediate(data);
            }
            
        } catch (error) {
            console.log('Analytics storage error:', error);
        }
    }

    sendImmediate(data) {
        // Send critical events to a webhook or analytics endpoint
        // This could integrate with Zapier, Google Analytics, or custom endpoint
        
        if (typeof fetch !== 'undefined') {
            // Example webhook integration (replace with your endpoint)
            const webhookUrl = 'https://hooks.zapier.com/hooks/catch/blaze-analytics/';
            
            fetch(webhookUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    source: 'blaze-intelligence',
                    timestamp: new Date().toISOString(),
                    data: data
                })
            }).catch(err => console.log('Webhook send failed:', err));
        }
    }

    sendPeriodicData() {
        // Send accumulated data every 5 minutes
        setInterval(() => {
            const summary = this.generateSessionSummary();
            summary.sessionId = this.sessionId;
            summary.timestamp = Date.now();
            
            this.sendToAnalytics({
                event: 'session_summary',
                priority: 'medium',
                data: summary
            });
        }, 300000);
    }

    // Export session data for analysis
    exportSessionData() {
        return {
            sessionId: this.sessionId,
            summary: this.generateSessionSummary(),
            events: this.events,
            heatmapData: this.heatmapData.slice(-1000), // Last 1000 mouse positions
            timestamp: new Date().toISOString()
        };
    }
}

// Auto-initialize analytics
let blazeAnalytics;
document.addEventListener('DOMContentLoaded', () => {
    blazeAnalytics = new BlazeAnalytics();
});

// Global access
window.BlazeAnalytics = BlazeAnalytics;
window.blazeAnalytics = blazeAnalytics;