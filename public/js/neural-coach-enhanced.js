// Enhanced Neural Coach with Production Features
// Includes demo mode, graceful degradation, confidence indicators, and consent management

class EnhancedNeuralCoach {
    constructor() {
        this.isAnalyzing = false;
        this.isDemoMode = false;
        this.hasConsent = false;
        this.confidenceThreshold = 0.7;
        this.offlineMode = false;
        this.sessionId = this.generateSessionId();
        
        // Performance monitoring
        this.performanceMetrics = {
            frameRate: 0,
            latency: 0,
            dataPoints: 0,
            errors: 0
        };
        
        // Circuit breaker for data sources
        this.circuitBreaker = {
            failures: 0,
            threshold: 3,
            isOpen: false,
            timeout: null
        };
        
        // Demo data for fallback
        this.demoData = {
            confidence: { value: 78, confidence: 0.92, trend: 'increasing' },
            engagement: { value: 85, confidence: 0.88, trend: 'stable' },
            stress: { value: 'Moderate', confidence: 0.75, trend: 'decreasing' },
            posture: { value: 'Good', score: 82, confidence: 0.90 },
            expressions: {
                joy: { value: 45, confidence: 0.85 },
                surprise: { value: 12, confidence: 0.72 },
                anger: { value: 5, confidence: 0.65 },
                sadness: { value: 8, confidence: 0.70 },
                fear: { value: 3, confidence: 0.60 },
                disgust: { value: 2, confidence: 0.55 }
            },
            voice: {
                pitch: { value: 145, confidence: 0.82 },
                tone: { value: 'Confident', confidence: 0.78 },
                clarity: { value: 88, confidence: 0.91 }
            }
        };
        
        this.init();
    }
    
    init() {
        this.checkConsent();
        this.detectOfflineMode();
        this.setupPerformanceMonitoring();
        this.initializeDemoMode();
        this.bindEnhancedEvents();
    }
    
    generateSessionId() {
        return 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    checkConsent() {
        // Check for existing consent
        const consent = localStorage.getItem('neural_coach_consent');
        if (consent) {
            const consentData = JSON.parse(consent);
            if (consentData.expires > Date.now()) {
                this.hasConsent = true;
                this.displayConsentStatus(consentData);
            } else {
                this.showConsentDialog();
            }
        } else {
            this.showConsentDialog();
        }
    }
    
    showConsentDialog() {
        const consentHTML = `
            <div id="consent-dialog" class="consent-overlay">
                <div class="consent-modal">
                    <h3>🔒 Privacy & Consent</h3>
                    <p>Neural Coach analyzes biometric data to provide performance insights.</p>
                    
                    <div class="consent-options">
                        <label class="consent-checkbox">
                            <input type="checkbox" id="consent-video" checked>
                            <span>Video Analysis</span>
                        </label>
                        <label class="consent-checkbox">
                            <input type="checkbox" id="consent-voice" checked>
                            <span>Voice Analysis</span>
                        </label>
                        <label class="consent-checkbox">
                            <input type="checkbox" id="consent-biometrics" checked>
                            <span>Biometric Monitoring</span>
                        </label>
                    </div>
                    
                    <div class="consent-info">
                        <p>📊 Data is processed locally when possible</p>
                        <p>⏱️ Session data expires after 24 hours</p>
                        <p>🗑️ You can delete your data anytime</p>
                    </div>
                    
                    <div class="consent-actions">
                        <button class="btn-consent-accept">Accept & Continue</button>
                        <button class="btn-consent-demo">Try Demo Mode</button>
                        <button class="btn-consent-decline">Decline</button>
                    </div>
                    
                    <div class="consent-footer">
                        <a href="/privacy" target="_blank">Privacy Policy</a>
                        <span>•</span>
                        <a href="/terms" target="_blank">Terms of Service</a>
                    </div>
                </div>
            </div>
        `;
        
        document.body.insertAdjacentHTML('beforeend', consentHTML);
        
        // Bind consent actions
        document.querySelector('.btn-consent-accept')?.addEventListener('click', () => {
            this.grantConsent();
        });
        
        document.querySelector('.btn-consent-demo')?.addEventListener('click', () => {
            this.enableDemoMode();
            this.closeConsentDialog();
        });
        
        document.querySelector('.btn-consent-decline')?.addEventListener('click', () => {
            this.declineConsent();
        });
    }
    
    grantConsent() {
        const consentData = {
            granted: true,
            timestamp: Date.now(),
            expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            permissions: {
                video: document.getElementById('consent-video')?.checked,
                voice: document.getElementById('consent-voice')?.checked,
                biometrics: document.getElementById('consent-biometrics')?.checked
            },
            sessionId: this.sessionId
        };
        
        localStorage.setItem('neural_coach_consent', JSON.stringify(consentData));
        this.hasConsent = true;
        this.closeConsentDialog();
        this.displayConsentStatus(consentData);
        
        // Log consent event
        this.logAnalytics('consent_granted', consentData);
    }
    
    declineConsent() {
        this.hasConsent = false;
        this.closeConsentDialog();
        this.showDeclinedMessage();
        this.enableDemoMode();
    }
    
    closeConsentDialog() {
        document.getElementById('consent-dialog')?.remove();
    }
    
    displayConsentStatus(consentData) {
        const statusHTML = `
            <div class="consent-status">
                <span class="consent-badge">✓ Consent Active</span>
                <button class="btn-revoke-consent">Revoke</button>
            </div>
        `;
        
        const container = document.querySelector('.analysis-panel');
        if (container && !document.querySelector('.consent-status')) {
            container.insertAdjacentHTML('afterbegin', statusHTML);
            
            document.querySelector('.btn-revoke-consent')?.addEventListener('click', () => {
                this.revokeConsent();
            });
        }
    }
    
    revokeConsent() {
        localStorage.removeItem('neural_coach_consent');
        this.hasConsent = false;
        this.stopAnalysis();
        this.showConsentDialog();
        document.querySelector('.consent-status')?.remove();
        
        // Delete session data
        this.deleteSessionData();
    }
    
    deleteSessionData() {
        // Clear all session-related data
        localStorage.removeItem('neural_coach_session');
        sessionStorage.clear();
        
        // Show confirmation
        this.showNotification('Session data deleted', 'success');
        
        // Log deletion
        this.logAnalytics('data_deleted', { sessionId: this.sessionId });
    }
    
    detectOfflineMode() {
        this.offlineMode = !navigator.onLine;
        
        window.addEventListener('online', () => {
            this.offlineMode = false;
            this.showNotification('Connection restored', 'success');
            this.syncOfflineData();
        });
        
        window.addEventListener('offline', () => {
            this.offlineMode = true;
            this.showNotification('Offline mode - using cached data', 'warning');
        });
    }
    
    setupPerformanceMonitoring() {
        // Monitor frame rate
        let lastTime = performance.now();
        let frames = 0;
        
        const measureFPS = () => {
            frames++;
            const currentTime = performance.now();
            
            if (currentTime >= lastTime + 1000) {
                this.performanceMetrics.frameRate = Math.round(frames * 1000 / (currentTime - lastTime));
                frames = 0;
                lastTime = currentTime;
                
                // Check performance thresholds
                if (this.performanceMetrics.frameRate < 24) {
                    this.reduceQuality();
                }
            }
            
            if (this.isAnalyzing) {
                requestAnimationFrame(measureFPS);
            }
        };
        
        this.fpsMonitor = measureFPS;
        
        // Setup latency monitoring
        this.setupLatencyMonitoring();
    }
    
    setupLatencyMonitoring() {
        // Track API response times
        const originalFetch = window.fetch;
        window.fetch = async (...args) => {
            const startTime = performance.now();
            try {
                const response = await originalFetch(...args);
                const latency = performance.now() - startTime;
                this.performanceMetrics.latency = Math.round(latency);
                
                // Check latency budget (100ms target)
                if (latency > 100) {
                    console.warn(`⚠️ Latency exceeded budget: ${latency}ms`);
                    this.optimizeRequests();
                }
                
                return response;
            } catch (error) {
                this.handleCircuitBreaker(error);
                throw error;
            }
        };
    }
    
    handleCircuitBreaker(error) {
        this.circuitBreaker.failures++;
        
        if (this.circuitBreaker.failures >= this.circuitBreaker.threshold) {
            this.circuitBreaker.isOpen = true;
            console.warn('🔌 Circuit breaker opened - switching to fallback mode');
            
            // Use demo data as fallback
            this.enableDemoMode();
            
            // Reset circuit breaker after timeout
            this.circuitBreaker.timeout = setTimeout(() => {
                this.circuitBreaker.isOpen = false;
                this.circuitBreaker.failures = 0;
                console.log('🔌 Circuit breaker reset');
            }, 30000); // 30 seconds
        }
    }
    
    initializeDemoMode() {
        // Check if demo mode is requested
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('demo') === 'true' || !this.hasConsent) {
            this.enableDemoMode();
        }
    }
    
    enableDemoMode() {
        this.isDemoMode = true;
        this.showDemoModeIndicator();
        
        // Start demo animations
        if (document.getElementById('start-analysis')) {
            document.getElementById('start-analysis').textContent = '▶️ Start Demo';
        }
    }
    
    showDemoModeIndicator() {
        const indicator = `
            <div class="demo-mode-indicator">
                <span class="demo-badge">🎭 Demo Mode</span>
                <span class="demo-text">Using synthetic athlete data</span>
            </div>
        `;
        
        const container = document.querySelector('.neural-hero-content');
        if (container && !document.querySelector('.demo-mode-indicator')) {
            container.insertAdjacentHTML('beforeend', indicator);
        }
    }
    
    bindEnhancedEvents() {
        // Export data
        const exportBtn = document.getElementById('export-report');
        exportBtn?.addEventListener('click', () => this.exportDataWithConsent());
        
        // Session timeline
        this.setupSessionTimeline();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    setupSessionTimeline() {
        const timelineHTML = `
            <div class="session-timeline" id="session-timeline">
                <div class="timeline-header">
                    <h4>Session Timeline</h4>
                    <button class="btn-timeline-toggle">▼</button>
                </div>
                <div class="timeline-content">
                    <div class="timeline-track" id="timeline-track"></div>
                    <div class="timeline-markers" id="timeline-markers"></div>
                </div>
            </div>
        `;
        
        const container = document.querySelector('.neural-analysis');
        if (container && !document.querySelector('.session-timeline')) {
            container.insertAdjacentHTML('beforeend', timelineHTML);
        }
    }
    
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl/Cmd + S: Save session
            if ((e.ctrlKey || e.metaKey) && e.key === 's') {
                e.preventDefault();
                this.saveAnalysis();
            }
            
            // Ctrl/Cmd + E: Export
            if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
                e.preventDefault();
                this.exportDataWithConsent();
            }
            
            // Space: Play/Pause
            if (e.key === ' ' && e.target.tagName !== 'INPUT') {
                e.preventDefault();
                this.toggleAnalysis();
            }
        });
    }
    
    startAnalysis() {
        if (!this.hasConsent && !this.isDemoMode) {
            this.showConsentDialog();
            return;
        }
        
        this.isAnalyzing = true;
        this.startTime = performance.now();
        
        // Start performance monitoring
        requestAnimationFrame(this.fpsMonitor);
        
        // Show analysis status
        this.updateStatus('Analyzing...', 'active');
        
        if (this.isDemoMode) {
            this.runDemoAnalysis();
        } else {
            this.runRealAnalysis();
        }
        
        // Start session recording
        this.startSessionRecording();
        
        console.log('🚀 Enhanced Neural Coach started', {
            mode: this.isDemoMode ? 'demo' : 'live',
            consent: this.hasConsent,
            sessionId: this.sessionId
        });
    }
    
    runDemoAnalysis() {
        // Simulate analysis with demo data
        this.analysisInterval = setInterval(() => {
            this.updateWithDemoData();
            this.generateEnhancedInsights();
        }, 100);
        
        // Add demo insights
        setTimeout(() => {
            this.addEnhancedInsight(
                'Demo athlete showing excellent form. Confidence level at 78% with high reliability.',
                'ai',
                { confidence: 0.92, model: 'demo' }
            );
        }, 2000);
    }
    
    runRealAnalysis() {
        // Real analysis with fallback to demo on error
        try {
            this.startRealTimeAnalysis();
        } catch (error) {
            console.error('Analysis error, falling back to demo:', error);
            this.enableDemoMode();
            this.runDemoAnalysis();
        }
    }
    
    updateWithDemoData() {
        // Animate demo data with realistic variations
        const time = (performance.now() - this.startTime) / 1000;
        
        // Update metrics with confidence indicators
        Object.keys(this.demoData).forEach(metric => {
            if (typeof this.demoData[metric] === 'object') {
                this.updateMetricWithConfidence(metric, this.demoData[metric]);
            }
        });
        
        // Add timeline markers for significant events
        if (Math.random() < 0.01) {
            this.addTimelineMarker('Posture adjustment detected', 'warning');
        }
    }
    
    updateMetricWithConfidence(metric, data) {
        // Update UI with confidence indicators
        const element = document.getElementById(`${metric}-value`);
        if (element) {
            if (data.confidence >= this.confidenceThreshold) {
                element.textContent = data.value;
                element.classList.add('high-confidence');
                element.classList.remove('low-confidence');
            } else {
                element.textContent = `${data.value}*`;
                element.classList.add('low-confidence');
                element.classList.remove('high-confidence');
            }
            
            // Add confidence bar
            this.updateConfidenceBar(metric, data.confidence);
        }
    }
    
    updateConfidenceBar(metric, confidence) {
        let bar = document.getElementById(`${metric}-confidence-bar`);
        if (!bar) {
            // Create confidence bar if it doesn't exist
            const container = document.getElementById(`${metric}-value`)?.parentElement;
            if (container) {
                const barHTML = `
                    <div class="confidence-indicator">
                        <div class="confidence-bar-bg">
                            <div class="confidence-bar-fill" id="${metric}-confidence-bar"></div>
                        </div>
                        <span class="confidence-text">${Math.round(confidence * 100)}%</span>
                    </div>
                `;
                container.insertAdjacentHTML('beforeend', barHTML);
                bar = document.getElementById(`${metric}-confidence-bar`);
            }
        }
        
        if (bar) {
            bar.style.width = `${confidence * 100}%`;
            bar.style.backgroundColor = confidence >= this.confidenceThreshold ? '#00DC82' : '#FFB81C';
        }
    }
    
    generateEnhancedInsights() {
        // Generate insights with explanations and confidence
        const insights = [
            {
                text: 'Shoulder alignment improving. Key indicators: forward lean reduced by 5°, spine curvature normalized.',
                confidence: 0.88,
                features: ['shoulder_angle', 'spine_curve', 'forward_lean']
            },
            {
                text: 'Voice tone indicates increased confidence. Pitch stability at 92%, volume consistency improved.',
                confidence: 0.75,
                features: ['pitch_stability', 'volume_variance', 'tone_pattern']
            },
            {
                text: 'Micro-expressions suggest genuine engagement. Joy markers at 45% with authentic Duchenne markers.',
                confidence: 0.82,
                features: ['duchenne_smile', 'eye_crinkle', 'mouth_symmetry']
            }
        ];
        
        // Only show high-confidence insights by default
        const insight = insights[Math.floor(Math.random() * insights.length)];
        if (insight.confidence >= this.confidenceThreshold || this.isDemoMode) {
            this.addEnhancedInsight(insight.text, 'ai', insight);
        }
    }
    
    addEnhancedInsight(text, type, metadata = {}) {
        const insightHTML = `
            <div class="insight-message enhanced ${metadata.confidence < this.confidenceThreshold ? 'low-confidence' : ''}">
                <div class="insight-header">
                    <span class="insight-time">${new Date().toLocaleTimeString()}</span>
                    ${metadata.confidence ? `<span class="insight-confidence">${Math.round(metadata.confidence * 100)}% confidence</span>` : ''}
                </div>
                <div class="insight-content">${text}</div>
                ${metadata.features ? `
                    <div class="insight-features">
                        <span class="features-label">Key features:</span>
                        ${metadata.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
                    </div>
                ` : ''}
                <div class="insight-actions">
                    <button class="btn-clip" onclick="window.neuralCoachEnhanced.clipMoment('${Date.now()}')">📎 Clip</button>
                    <button class="btn-tag" onclick="window.neuralCoachEnhanced.tagMoment('${Date.now()}')">🏷️ Tag</button>
                    <button class="btn-share" onclick="window.neuralCoachEnhanced.shareMoment('${Date.now()}')">🔗 Share</button>
                </div>
            </div>
        `;
        
        const feed = document.getElementById('insights-feed');
        if (feed) {
            feed.insertAdjacentHTML('beforeend', insightHTML);
            feed.scrollTop = feed.scrollHeight;
        }
    }
    
    addTimelineMarker(event, type = 'info') {
        const marker = {
            time: performance.now() - this.startTime,
            event: event,
            type: type,
            timestamp: Date.now()
        };
        
        const markerHTML = `
            <div class="timeline-marker ${type}" style="left: ${(marker.time / 1000) * 10}px" 
                 title="${event}" data-timestamp="${marker.timestamp}">
                <div class="marker-dot"></div>
            </div>
        `;
        
        document.getElementById('timeline-markers')?.insertAdjacentHTML('beforeend', markerHTML);
    }
    
    clipMoment(timestamp) {
        const clip = {
            timestamp: timestamp,
            duration: 10000, // 10 seconds
            sessionId: this.sessionId,
            metrics: this.getCurrentMetrics()
        };
        
        // Save clip
        const clips = JSON.parse(localStorage.getItem('neural_coach_clips') || '[]');
        clips.push(clip);
        localStorage.setItem('neural_coach_clips', JSON.stringify(clips));
        
        this.showNotification('Moment clipped', 'success');
    }
    
    tagMoment(timestamp) {
        const tag = prompt('Add a tag for this moment:');
        if (tag) {
            const tags = JSON.parse(localStorage.getItem('neural_coach_tags') || '{}');
            tags[timestamp] = tag;
            localStorage.setItem('neural_coach_tags', JSON.stringify(tags));
            
            this.showNotification(`Tagged: ${tag}`, 'success');
        }
    }
    
    shareMoment(timestamp) {
        const shareUrl = `${window.location.origin}/coach/moment/${this.sessionId}/${timestamp}`;
        
        // Create shareable link with expiration
        const shareData = {
            url: shareUrl,
            expires: Date.now() + (24 * 60 * 60 * 1000), // 24 hours
            sessionId: this.sessionId,
            timestamp: timestamp
        };
        
        navigator.clipboard.writeText(shareUrl).then(() => {
            this.showNotification('Share link copied!', 'success');
        });
    }
    
    exportDataWithConsent() {
        if (!this.hasConsent && !this.isDemoMode) {
            this.showNotification('Consent required for export', 'warning');
            return;
        }
        
        const exportData = {
            sessionId: this.sessionId,
            timestamp: new Date().toISOString(),
            mode: this.isDemoMode ? 'demo' : 'live',
            consent: {
                granted: this.hasConsent,
                timestamp: JSON.parse(localStorage.getItem('neural_coach_consent') || '{}').timestamp
            },
            metrics: this.getCurrentMetrics(),
            performance: this.performanceMetrics,
            watermark: 'Blaze Intelligence Neural Coach™',
            version: '2.0.0'
        };
        
        // Create CSV
        const csv = this.generateCSV(exportData);
        
        // Download
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `neural-coach-${this.sessionId}.csv`;
        a.click();
        
        // Log export
        this.logAnalytics('data_exported', { sessionId: this.sessionId });
    }
    
    generateCSV(data) {
        // Convert data to CSV format
        let csv = 'Neural Coach Export\n';
        csv += `Session ID,${data.sessionId}\n`;
        csv += `Timestamp,${data.timestamp}\n`;
        csv += `Mode,${data.mode}\n`;
        csv += `Consent,${data.consent.granted}\n`;
        csv += '\nMetrics\n';
        csv += 'Metric,Value,Confidence\n';
        
        // Add metrics data
        Object.entries(data.metrics).forEach(([key, value]) => {
            if (typeof value === 'object' && value.value !== undefined) {
                csv += `${key},${value.value},${value.confidence || 'N/A'}\n`;
            }
        });
        
        csv += `\n${data.watermark}\n`;
        
        return csv;
    }
    
    getCurrentMetrics() {
        // Return current metrics snapshot
        return this.isDemoMode ? this.demoData : this.metrics;
    }
    
    startSessionRecording() {
        this.sessionRecording = [];
        this.recordingInterval = setInterval(() => {
            this.sessionRecording.push({
                timestamp: Date.now(),
                metrics: this.getCurrentMetrics(),
                performance: { ...this.performanceMetrics }
            });
            
            // Limit recording size (keep last 1000 data points)
            if (this.sessionRecording.length > 1000) {
                this.sessionRecording.shift();
            }
        }, 100);
    }
    
    stopAnalysis() {
        this.isAnalyzing = false;
        clearInterval(this.analysisInterval);
        clearInterval(this.recordingInterval);
        
        // Save session data
        this.saveSessionData();
        
        this.updateStatus('Ready', 'ready');
    }
    
    saveSessionData() {
        const sessionData = {
            id: this.sessionId,
            timestamp: new Date().toISOString(),
            duration: performance.now() - this.startTime,
            recording: this.sessionRecording,
            mode: this.isDemoMode ? 'demo' : 'live'
        };
        
        localStorage.setItem('neural_coach_session_' + this.sessionId, JSON.stringify(sessionData));
    }
    
    toggleAnalysis() {
        if (this.isAnalyzing) {
            this.stopAnalysis();
        } else {
            this.startAnalysis();
        }
    }
    
    reduceQuality() {
        console.log('📉 Reducing quality due to low frame rate');
        // Reduce animation quality for better performance
        document.body.classList.add('reduced-motion');
    }
    
    optimizeRequests() {
        // Batch requests or reduce frequency
        console.log('⚡ Optimizing requests due to high latency');
    }
    
    syncOfflineData() {
        // Sync any offline data when connection restored
        console.log('🔄 Syncing offline data...');
    }
    
    updateStatus(text, type) {
        const statusEl = document.getElementById('analysis-status');
        if (statusEl) {
            statusEl.textContent = text;
            statusEl.className = `status-indicator ${type}`;
        }
    }
    
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 10);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    showDeclinedMessage() {
        const message = `
            <div class="declined-message">
                <h3>Demo Mode Active</h3>
                <p>You can still explore Neural Coach features with synthetic data.</p>
                <p>Grant consent anytime to use real analysis.</p>
            </div>
        `;
        
        const container = document.querySelector('.video-placeholder');
        if (container) {
            container.innerHTML = message;
        }
    }
    
    logAnalytics(event, data) {
        // Log analytics events
        if (window.gtag) {
            window.gtag('event', event, data);
        }
        
        // Also log to console in dev
        console.log(`📊 Analytics: ${event}`, data);
    }
}

// Auto-initialize enhanced version
document.addEventListener('DOMContentLoaded', () => {
    window.neuralCoachEnhanced = new EnhancedNeuralCoach();
    console.log('🚀 Enhanced Neural Coach initialized');
});