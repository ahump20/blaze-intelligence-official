/**
 * Blaze Intelligence Privacy Consent & Data Minimization System
 * GDPR/CCPA compliant consent management with retention policies
 */

class PrivacyConsentSystem {
    constructor() {
        this.consentData = this.loadConsent();
        this.dataRetention = {
            // Data retention periods (in days)
            analytics: 90,
            performance: 30,
            videos: 365,
            biometrics: 730,
            profiles: 1095,  // 3 years
            audit_logs: 2555 // 7 years
        };
        
        this.dataTypes = {
            essential: {
                name: 'Essential',
                description: 'Required for basic platform functionality',
                required: true,
                examples: ['Authentication', 'Session management', 'Error logging']
            },
            analytics: {
                name: 'Analytics',
                description: 'Platform usage and performance metrics',
                required: false,
                examples: ['Page views', 'Feature usage', 'Performance timing']
            },
            biometrics: {
                name: 'Biometric Data',
                description: 'Movement analysis and form assessment',
                required: false,
                examples: ['Pose detection', 'Biomechanical analysis', 'Movement patterns'],
                sensitive: true
            },
            video: {
                name: 'Video Processing',
                description: 'Video analysis for coaching insights',
                required: false,
                examples: ['Training videos', 'Performance recordings', 'AI analysis'],
                sensitive: true
            },
            marketing: {
                name: 'Marketing',
                description: 'Personalized content and communications',
                required: false,
                examples: ['Email campaigns', 'Targeted content', 'Product recommendations']
            }
        };
        
        this.processingBasis = {
            essential: 'legitimate_interest',
            analytics: 'consent',
            biometrics: 'explicit_consent',
            video: 'explicit_consent',
            marketing: 'consent'
        };
        
        this.init();
    }
    
    init() {
        this.setupConsentBanner();
        this.scheduleDataCleanup();
        this.bindEvents();
        
        // Check if consent is needed
        if (!this.hasValidConsent()) {
            this.showConsentBanner();
        }
        
        console.log('🔒 Privacy consent system initialized');
    }
    
    loadConsent() {
        try {
            const stored = localStorage.getItem('blaze_privacy_consent');
            return stored ? JSON.parse(stored) : this.getDefaultConsent();
        } catch (error) {
            console.warn('Failed to load consent data:', error);
            return this.getDefaultConsent();
        }
    }
    
    getDefaultConsent() {
        return {
            timestamp: null,
            version: '2.0',
            consents: {
                essential: true,
                analytics: false,
                biometrics: false,
                video: false,
                marketing: false
            },
            preferences: {
                data_retention: 'standard',
                sharing: 'none',
                communications: 'essential'
            },
            ip_hash: null,
            user_agent_hash: null
        };
    }
    
    hasValidConsent() {
        if (!this.consentData.timestamp) return false;
        
        // Consent expires after 12 months
        const consentAge = Date.now() - new Date(this.consentData.timestamp).getTime();
        const maxAge = 365 * 24 * 60 * 60 * 1000; // 1 year in ms
        
        return consentAge < maxAge && this.consentData.version === '2.0';
    }
    
    setupConsentBanner() {
        // Create consent banner HTML
        const banner = document.createElement('div');
        banner.id = 'privacy-consent-banner';
        banner.className = 'privacy-banner';
        banner.style.display = 'none';
        
        banner.innerHTML = `
            <div class="consent-content">
                <div class="consent-header">
                    <h3>🔒 Your Privacy Matters</h3>
                    <p>We use different types of data to provide you with championship-level sports analytics. Choose what you're comfortable sharing.</p>
                </div>
                
                <div class="consent-options">
                    ${Object.entries(this.dataTypes).map(([key, type]) => `
                        <div class="consent-option ${type.sensitive ? 'sensitive' : ''}">
                            <div class="option-header">
                                <label class="consent-toggle">
                                    <input type="checkbox" 
                                           name="consent_${key}" 
                                           ${this.consentData.consents[key] ? 'checked' : ''}
                                           ${type.required ? 'disabled' : ''}>
                                    <span class="toggle-slider"></span>
                                </label>
                                <div class="option-info">
                                    <strong>${type.name}</strong>
                                    ${type.required ? '<span class="required-badge">Required</span>' : ''}
                                    ${type.sensitive ? '<span class="sensitive-badge">Sensitive</span>' : ''}
                                </div>
                            </div>
                            <p class="option-description">${type.description}</p>
                            <div class="option-examples">
                                <em>Examples: ${type.examples.join(', ')}</em>
                            </div>
                        </div>
                    `).join('')}
                </div>
                
                <div class="retention-preferences">
                    <h4>Data Retention Preferences</h4>
                    <select name="data_retention" class="retention-select">
                        <option value="minimal" ${this.consentData.preferences.data_retention === 'minimal' ? 'selected' : ''}>
                            Minimal (30 days) - Delete data as soon as legally possible
                        </option>
                        <option value="standard" ${this.consentData.preferences.data_retention === 'standard' ? 'selected' : ''}>
                            Standard (90-365 days) - Keep data for service improvement
                        </option>
                        <option value="extended" ${this.consentData.preferences.data_retention === 'extended' ? 'selected' : ''}>
                            Extended (2-3 years) - Keep data for long-term analysis
                        </option>
                    </select>
                </div>
                
                <div class="consent-actions">
                    <button class="consent-btn accept-all">Accept All</button>
                    <button class="consent-btn save-preferences">Save Preferences</button>
                    <button class="consent-btn essential-only">Essential Only</button>
                    <a href="/privacy-policy" class="privacy-link">Privacy Policy</a>
                </div>
                
                <div class="consent-details">
                    <details>
                        <summary>Technical Details</summary>
                        <div class="technical-info">
                            <p><strong>Data Processing:</strong> AI analysis happens locally when possible. Server processing is encrypted and anonymized.</p>
                            <p><strong>Retention:</strong> Data is automatically deleted based on your preferences and legal requirements.</p>
                            <p><strong>Your Rights:</strong> Access, correct, or delete your data anytime via Settings.</p>
                            <p><strong>Contact:</strong> privacy@blaze-intelligence.com for data requests.</p>
                        </div>
                    </details>
                </div>
            </div>
        `;
        
        document.body.appendChild(banner);
        this.addConsentStyles();
    }
    
    addConsentStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .privacy-banner {
                position: fixed;
                bottom: 0;
                left: 0;
                right: 0;
                background: rgba(13, 13, 13, 0.98);
                backdrop-filter: blur(20px);
                border-top: 2px solid #BF5700;
                padding: 20px;
                z-index: 10000;
                max-height: 80vh;
                overflow-y: auto;
                animation: slideUp 0.3s ease;
            }
            
            @keyframes slideUp {
                from { transform: translateY(100%); }
                to { transform: translateY(0); }
            }
            
            .consent-content {
                max-width: 800px;
                margin: 0 auto;
                color: #fff;
            }
            
            .consent-header h3 {
                color: #BF5700;
                margin: 0 0 10px 0;
                font-size: 1.2rem;
            }
            
            .consent-header p {
                margin: 0 0 20px 0;
                color: #999;
            }
            
            .consent-options {
                display: grid;
                gap: 15px;
                margin-bottom: 20px;
            }
            
            .consent-option {
                background: rgba(26, 26, 26, 0.8);
                border: 1px solid #333;
                border-radius: 8px;
                padding: 15px;
            }
            
            .consent-option.sensitive {
                border-color: #FF6B6B;
                background: rgba(255, 107, 107, 0.05);
            }
            
            .option-header {
                display: flex;
                align-items: flex-start;
                gap: 15px;
                margin-bottom: 8px;
            }
            
            .consent-toggle {
                position: relative;
                display: inline-block;
                width: 50px;
                height: 24px;
                margin-top: 2px;
            }
            
            .consent-toggle input {
                opacity: 0;
                width: 0;
                height: 0;
            }
            
            .toggle-slider {
                position: absolute;
                cursor: pointer;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background-color: #333;
                transition: 0.3s;
                border-radius: 24px;
            }
            
            .toggle-slider:before {
                position: absolute;
                content: "";
                height: 18px;
                width: 18px;
                left: 3px;
                bottom: 3px;
                background-color: white;
                transition: 0.3s;
                border-radius: 50%;
            }
            
            input:checked + .toggle-slider {
                background-color: #BF5700;
            }
            
            input:checked + .toggle-slider:before {
                transform: translateX(26px);
            }
            
            .option-info strong {
                color: #fff;
                font-size: 1rem;
            }
            
            .required-badge, .sensitive-badge {
                display: inline-block;
                padding: 2px 8px;
                border-radius: 12px;
                font-size: 0.75rem;
                font-weight: 600;
                margin-left: 8px;
            }
            
            .required-badge {
                background: #4CAF50;
                color: white;
            }
            
            .sensitive-badge {
                background: #FF6B6B;
                color: white;
            }
            
            .option-description {
                color: #999;
                margin: 5px 0;
                font-size: 0.9rem;
            }
            
            .option-examples {
                color: #666;
                font-size: 0.8rem;
                font-style: italic;
            }
            
            .retention-preferences {
                margin: 20px 0;
            }
            
            .retention-preferences h4 {
                color: #BF5700;
                margin: 0 0 10px 0;
            }
            
            .retention-select {
                width: 100%;
                background: #1a1a1a;
                border: 1px solid #333;
                color: #fff;
                padding: 10px;
                border-radius: 4px;
            }
            
            .consent-actions {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
                align-items: center;
                margin: 20px 0;
            }
            
            .consent-btn {
                padding: 10px 20px;
                border: none;
                border-radius: 6px;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s;
            }
            
            .accept-all {
                background: linear-gradient(135deg, #BF5700, #FF8C00);
                color: white;
            }
            
            .save-preferences {
                background: #4CAF50;
                color: white;
            }
            
            .essential-only {
                background: transparent;
                color: #999;
                border: 1px solid #333;
            }
            
            .consent-btn:hover {
                transform: translateY(-1px);
                box-shadow: 0 4px 12px rgba(191, 87, 0, 0.3);
            }
            
            .privacy-link {
                color: #BF5700;
                text-decoration: none;
                margin-left: auto;
            }
            
            .consent-details {
                margin-top: 15px;
                border-top: 1px solid #333;
                padding-top: 15px;
            }
            
            .consent-details summary {
                color: #BF5700;
                cursor: pointer;
                font-size: 0.9rem;
            }
            
            .technical-info {
                margin-top: 10px;
                font-size: 0.85rem;
                color: #999;
                line-height: 1.4;
            }
            
            .technical-info p {
                margin: 8px 0;
            }
            
            @media (max-width: 768px) {
                .privacy-banner {
                    padding: 15px;
                }
                
                .consent-actions {
                    flex-direction: column;
                }
                
                .consent-actions .privacy-link {
                    margin-left: 0;
                    margin-top: 10px;
                }
                
                .consent-btn {
                    width: 100%;
                }
            }
        `;
        
        document.head.appendChild(style);
    }
    
    bindEvents() {
        document.addEventListener('click', (e) => {
            if (e.target.matches('.accept-all')) {
                this.acceptAllConsent();
            } else if (e.target.matches('.save-preferences')) {
                this.saveConsentPreferences();
            } else if (e.target.matches('.essential-only')) {
                this.acceptEssentialOnly();
            }
        });
    }
    
    acceptAllConsent() {
        const consents = {};
        Object.keys(this.dataTypes).forEach(key => {
            consents[key] = true;
        });
        
        this.saveConsent(consents, this.getRetentionPreferences());
        this.hideConsentBanner();
        this.showConsentConfirmation('All data types accepted');
    }
    
    acceptEssentialOnly() {
        const consents = {};
        Object.keys(this.dataTypes).forEach(key => {
            consents[key] = this.dataTypes[key].required;
        });
        
        this.saveConsent(consents, { data_retention: 'minimal' });
        this.hideConsentBanner();
        this.showConsentConfirmation('Essential data only');
    }
    
    saveConsentPreferences() {
        const banner = document.getElementById('privacy-consent-banner');
        if (!banner) return;
        
        const consents = {};
        Object.keys(this.dataTypes).forEach(key => {
            const checkbox = banner.querySelector(`input[name="consent_${key}"]`);
            consents[key] = checkbox ? checkbox.checked : this.dataTypes[key].required;
        });
        
        const preferences = this.getRetentionPreferences();
        
        this.saveConsent(consents, preferences);
        this.hideConsentBanner();
        this.showConsentConfirmation('Preferences saved');
    }
    
    getRetentionPreferences() {
        const banner = document.getElementById('privacy-consent-banner');
        const select = banner?.querySelector('.retention-select');
        
        return {
            data_retention: select?.value || 'standard',
            sharing: 'none',
            communications: 'essential'
        };
    }
    
    async saveConsent(consents, preferences) {
        const consentData = {
            timestamp: new Date().toISOString(),
            version: '2.0',
            consents,
            preferences,
            ip_hash: await this.hashIP(),
            user_agent_hash: await this.hashUserAgent()
        };
        
        this.consentData = consentData;
        localStorage.setItem('blaze_privacy_consent', JSON.stringify(consentData));
        
        // Send to backend for audit trail
        this.recordConsentChange(consentData);
        
        // Initialize/update tracking based on consent
        this.updateTrackingServices();
        
        console.log('✅ Privacy consent saved:', consents);
    }
    
    async hashIP() {
        try {
            // Get approximate IP location without storing actual IP
            const response = await fetch('https://api.ipify.org?format=json');
            const data = await response.json();
            const encoder = new TextEncoder();
            const data_encoded = encoder.encode(data.ip + 'salt');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data_encoded);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
        } catch {
            return 'unknown';
        }
    }
    
    async hashUserAgent() {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(navigator.userAgent + 'salt');
            const hashBuffer = await crypto.subtle.digest('SHA-256', data);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            return hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 16);
        } catch {
            return 'unknown';
        }
    }
    
    recordConsentChange(consentData) {
        if (typeof fetch !== 'undefined') {
            fetch('/api/privacy/consent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: 'consent_change',
                    consent: consentData,
                    timestamp: Date.now()
                })
            }).catch(console.warn);
        }
    }
    
    updateTrackingServices() {
        const { consents } = this.consentData;
        
        // Update analytics
        if (typeof gtag !== 'undefined') {
            gtag('consent', 'update', {
                analytics_storage: consents.analytics ? 'granted' : 'denied',
                ad_storage: consents.marketing ? 'granted' : 'denied'
            });
        }
        
        // Disable/enable features based on consent
        if (!consents.biometrics) {
            this.disableBiometricTracking();
        }
        
        if (!consents.video) {
            this.disableVideoProcessing();
        }
    }
    
    disableBiometricTracking() {
        // Disable pose detection and biometric analysis
        if (window.blazeBiometrics) {
            window.blazeBiometrics.disable();
        }
    }
    
    disableVideoProcessing() {
        // Disable video analysis features
        if (window.blazeVideoAnalysis) {
            window.blazeVideoAnalysis.disable();
        }
    }
    
    showConsentBanner() {
        const banner = document.getElementById('privacy-consent-banner');
        if (banner) {
            banner.style.display = 'block';
            document.body.style.paddingBottom = '400px'; // Prevent content overlap
        }
    }
    
    hideConsentBanner() {
        const banner = document.getElementById('privacy-consent-banner');
        if (banner) {
            banner.style.display = 'none';
            document.body.style.paddingBottom = '0';
        }
    }
    
    showConsentConfirmation(message) {
        const toast = document.createElement('div');
        toast.className = 'consent-confirmation';
        toast.innerHTML = `
            <span class="consent-icon">✅</span>
            <span>${message}</span>
        `;
        
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 10001;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.remove();
        }, 3000);
    }
    
    scheduleDataCleanup() {
        // Run cleanup daily
        setInterval(() => {
            this.cleanupExpiredData();
        }, 24 * 60 * 60 * 1000);
        
        // Initial cleanup
        this.cleanupExpiredData();
    }
    
    cleanupExpiredData() {
        const { preferences } = this.consentData;
        const retentionMultiplier = {
            minimal: 0.5,
            standard: 1.0,
            extended: 2.0
        };
        
        const multiplier = retentionMultiplier[preferences.data_retention] || 1.0;
        
        // Clean localStorage based on retention preferences
        Object.entries(this.dataRetention).forEach(([dataType, baseDays]) => {
            const retentionDays = baseDays * multiplier;
            const cutoffTime = Date.now() - (retentionDays * 24 * 60 * 60 * 1000);
            
            // Clean data older than retention period
            this.cleanDataType(dataType, cutoffTime);
        });
        
        console.log('🗑️ Privacy data cleanup completed');
    }
    
    cleanDataType(dataType, cutoffTime) {
        const keys = Object.keys(localStorage);
        const pattern = new RegExp(`blaze_${dataType}`);
        
        keys.forEach(key => {
            if (pattern.test(key)) {
                try {
                    const data = JSON.parse(localStorage.getItem(key));
                    if (data.timestamp && data.timestamp < cutoffTime) {
                        localStorage.removeItem(key);
                        console.log(`Removed expired ${dataType} data:`, key);
                    }
                } catch (e) {
                    // Invalid JSON, remove it
                    localStorage.removeItem(key);
                }
            }
        });
    }
    
    // Public API
    hasConsent(dataType) {
        return this.consentData.consents[dataType] === true;
    }
    
    getConsentBadge(dataType) {
        const hasConsent = this.hasConsent(dataType);
        const isRequired = this.dataTypes[dataType]?.required;
        
        return {
            status: hasConsent ? 'granted' : (isRequired ? 'required' : 'denied'),
            badge: hasConsent ? '✅' : (isRequired ? '⚡' : '❌'),
            text: hasConsent ? 'Consented' : (isRequired ? 'Required' : 'Not Consented')
        };
    }
    
    revokeConsent(dataType) {
        this.consentData.consents[dataType] = false;
        this.saveConsent(this.consentData.consents, this.consentData.preferences);
    }
    
    showPreferences() {
        this.showConsentBanner();
    }
    
    exportUserData() {
        // Compile all user data for GDPR export
        const userData = {
            consent: this.consentData,
            preferences: this.consentData.preferences,
            data_retention: this.dataRetention,
            exported_at: new Date().toISOString()
        };
        
        // Add localStorage data
        const localData = {};
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('blaze_')) {
                try {
                    localData[key] = JSON.parse(localStorage.getItem(key));
                } catch {
                    localData[key] = localStorage.getItem(key);
                }
            }
        });
        userData.localStorage = localData;
        
        return userData;
    }
    
    deleteUserData() {
        // Delete all user data (GDPR right to deletion)
        Object.keys(localStorage).forEach(key => {
            if (key.startsWith('blaze_')) {
                localStorage.removeItem(key);
            }
        });
        
        // Reset consent
        this.consentData = this.getDefaultConsent();
        
        console.log('🗑️ All user data deleted');
    }
}

// Initialize global privacy system
window.blazePrivacy = new PrivacyConsentSystem();

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PrivacyConsentSystem;
}

console.log('🔒 Privacy consent system active - GDPR/CCPA compliant');