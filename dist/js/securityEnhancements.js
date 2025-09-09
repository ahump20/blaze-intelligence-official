// Security Enhancements and Protection Layer
class SecurityManager {
    constructor() {
        this.trustedOrigins = [
            'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev',
            'https://statsapi.mlb.com',
            'https://www.balldontlie.io',
            'https://site.api.espn.com'
        ];
        this.rateLimits = new Map();
        this.requestCount = 0;
        this.startTime = Date.now();
        this.init();
    }

    init() {
        this.setupContentSecurityPolicy();
        this.interceptFetchRequests();
        this.setupInputValidation();
        this.monitorSuspiciousActivity();
        this.setupSecureHeaders();
    }

    setupContentSecurityPolicy() {
        // Add CSP meta tag if not present
        if (!document.querySelector('meta[http-equiv="Content-Security-Policy"]')) {
            const meta = document.createElement('meta');
            meta.httpEquiv = 'Content-Security-Policy';
            meta.content = [
                "default-src 'self'",
                "script-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com https://cdn.jsdelivr.net https://unpkg.com",
                "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
                "font-src 'self' https://fonts.gstatic.com",
                "img-src 'self' data: https:",
                "connect-src 'self' https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev wss://blaze-vision-ai-gateway.humphrey-austin20.workers.dev https://statsapi.mlb.com https://www.balldontlie.io https://site.api.espn.com",
                "frame-ancestors 'none'",
                "base-uri 'self'",
                "object-src 'none'"
            ].join('; ');
            document.head.appendChild(meta);
        }
    }

    interceptFetchRequests() {
        const originalFetch = window.fetch;
        
        window.fetch = (url, options = {}) => {
            // Validate URL
            if (!this.isValidURL(url)) {
                console.warn(`🚫 Security: Blocked request to untrusted URL: ${url}`);
                return Promise.reject(new Error('Request blocked by security policy'));
            }

            // Rate limiting
            if (!this.checkRateLimit(url)) {
                console.warn(`🚫 Security: Rate limit exceeded for: ${url}`);
                return Promise.reject(new Error('Rate limit exceeded'));
            }

            // Add security headers
            const secureOptions = {
                ...options,
                headers: {
                    ...options.headers,
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-Client-Version': '2.0.0'
                }
            };

            // Remove sensitive headers from logs
            this.logSecureRequest(url, this.sanitizeHeaders(secureOptions.headers));

            return originalFetch(url, secureOptions);
        };
    }

    isValidURL(url) {
        try {
            const urlObj = new URL(url, window.location.origin);
            
            // Allow same-origin requests
            if (urlObj.origin === window.location.origin) {
                return true;
            }

            // Check against trusted origins
            return this.trustedOrigins.some(trusted => 
                urlObj.origin === trusted || urlObj.href.startsWith(trusted)
            );
        } catch (error) {
            return false;
        }
    }

    checkRateLimit(url) {
        const now = Date.now();
        const key = new URL(url, window.location.origin).origin;
        
        if (!this.rateLimits.has(key)) {
            this.rateLimits.set(key, []);
        }

        const requests = this.rateLimits.get(key);
        
        // Remove requests older than 1 minute
        const filtered = requests.filter(timestamp => now - timestamp < 60000);
        
        // Allow max 100 requests per minute per origin
        if (filtered.length >= 100) {
            return false;
        }

        filtered.push(now);
        this.rateLimits.set(key, filtered);
        
        this.requestCount++;
        return true;
    }

    sanitizeHeaders(headers) {
        if (!headers) return {};
        
        const sanitized = { ...headers };
        
        // Remove sensitive headers from logs
        const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key', 'x-auth-token'];
        sensitiveHeaders.forEach(header => {
            if (sanitized[header]) {
                sanitized[header] = '[REDACTED]';
            }
        });
        
        return sanitized;
    }

    logSecureRequest(url, headers) {
        // Only log in development
        if (window.location.hostname === 'localhost' || window.location.hostname.includes('replit')) {
            console.log('🔒 Secure request:', {
                url: url.replace(/([?&])(api[_-]?key|token|auth)=[^&]*/gi, '$1$2=[REDACTED]'),
                headers,
                timestamp: new Date().toISOString()
            });
        }
    }

    setupInputValidation() {
        // Validate all form inputs
        document.addEventListener('input', (event) => {
            if (event.target.tagName === 'INPUT' || event.target.tagName === 'TEXTAREA') {
                this.validateInput(event.target);
            }
        });

        // Prevent XSS in dynamic content
        this.setupXSSProtection();
    }

    validateInput(input) {
        const value = input.value;
        
        // Check for potential XSS patterns
        const xssPatterns = [
            /<script[^>]*>.*?<\/script>/gi,
            /javascript:/gi,
            /on\w+\s*=/gi,
            /eval\s*\(/gi,
            /document\.(write|writeln)/gi
        ];

        const hasXSS = xssPatterns.some(pattern => pattern.test(value));
        
        if (hasXSS) {
            input.setCustomValidity('Invalid characters detected');
            input.classList.add('security-violation');
            this.reportSecurityEvent('xss_attempt', {
                field: input.name || input.id,
                value: value.substring(0, 100) // Only log first 100 chars
            });
        } else {
            input.setCustomValidity('');
            input.classList.remove('security-violation');
        }
    }

    setupXSSProtection() {
        // Override innerHTML to prevent XSS
        const originalSetInnerHTML = Element.prototype.__lookupSetter__('innerHTML');
        
        if (originalSetInnerHTML) {
            Element.prototype.__defineSetter__('innerHTML', function(html) {
                const sanitized = this.sanitizeHTML(html);
                originalSetInnerHTML.call(this, sanitized);
            });
        }
    }

    sanitizeHTML(html) {
        // Basic HTML sanitization
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }

    monitorSuspiciousActivity() {
        let clickCount = 0;
        let lastClickTime = 0;

        document.addEventListener('click', (event) => {
            const now = Date.now();
            
            // Detect rapid clicking (potential bot)
            if (now - lastClickTime < 100) {
                clickCount++;
                if (clickCount > 10) {
                    this.reportSecurityEvent('suspicious_clicking', {
                        target: event.target.tagName,
                        clickCount
                    });
                }
            } else {
                clickCount = 0;
            }
            
            lastClickTime = now;
        });

        // Monitor for automated behavior
        this.monitorAutomation();
    }

    monitorAutomation() {
        // Detect headless browsers and automation tools
        const checks = [
            () => navigator.webdriver,
            () => window.phantom !== undefined,
            () => window._phantom !== undefined,
            () => window.callPhantom !== undefined,
            () => window.Buffer !== undefined,
            () => window.emit !== undefined,
            () => window.spawn !== undefined
        ];

        const automationDetected = checks.some(check => {
            try {
                return check();
            } catch {
                return false;
            }
        });

        if (automationDetected) {
            this.reportSecurityEvent('automation_detected', {
                userAgent: navigator.userAgent,
                timestamp: Date.now()
            });
        }
    }

    setupSecureHeaders() {
        // Add security-related meta tags
        const securityMeta = [
            { name: 'referrer', content: 'strict-origin-when-cross-origin' },
            { 'http-equiv': 'X-Content-Type-Options', content: 'nosniff' },
            { 'http-equiv': 'X-Frame-Options', content: 'DENY' },
            { 'http-equiv': 'X-XSS-Protection', content: '1; mode=block' }
        ];

        securityMeta.forEach(meta => {
            if (!document.querySelector(`meta[${Object.keys(meta)[0]}="${Object.values(meta)[0]}"]`)) {
                const metaTag = document.createElement('meta');
                Object.entries(meta).forEach(([key, value]) => {
                    metaTag.setAttribute(key, value);
                });
                document.head.appendChild(metaTag);
            }
        });
    }

    reportSecurityEvent(type, details) {
        const event = {
            type,
            details,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent,
            sessionId: this.getSessionId()
        };

        // Send to security monitoring endpoint
        fetch('/security/events', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(event)
        }).catch(() => {
            // Store locally if network fails
            this.storeSecurityEvent(event);
        });

        console.warn('🚨 Security event:', type, details);
    }

    storeSecurityEvent(event) {
        try {
            const stored = JSON.parse(localStorage.getItem('security_events') || '[]');
            stored.push(event);
            
            // Keep only last 50 events
            if (stored.length > 50) {
                stored.shift();
            }
            
            localStorage.setItem('security_events', JSON.stringify(stored));
        } catch (error) {
            console.error('Failed to store security event:', error);
        }
    }

    getSessionId() {
        let sessionId = sessionStorage.getItem('security_session_id');
        if (!sessionId) {
            sessionId = 'sec_' + Math.random().toString(36).substr(2, 16);
            sessionStorage.setItem('security_session_id', sessionId);
        }
        return sessionId;
    }

    // Get security status report
    getSecurityReport() {
        return {
            requestCount: this.requestCount,
            uptime: Date.now() - this.startTime,
            rateLimits: Object.fromEntries(this.rateLimits),
            trustedOrigins: this.trustedOrigins,
            securityEvents: JSON.parse(localStorage.getItem('security_events') || '[]'),
            timestamp: new Date().toISOString()
        };
    }

    // Manual security scan
    performSecurityScan() {
        const issues = [];

        // Check for mixed content
        if (window.location.protocol === 'https:') {
            const insecureElements = document.querySelectorAll('[src^="http://"], [href^="http://"]');
            if (insecureElements.length > 0) {
                issues.push({
                    type: 'mixed_content',
                    count: insecureElements.length,
                    elements: Array.from(insecureElements).map(el => el.tagName + '[' + (el.src || el.href) + ']')
                });
            }
        }

        // Check for inline scripts
        const inlineScripts = document.querySelectorAll('script:not([src])');
        if (inlineScripts.length > 0) {
            issues.push({
                type: 'inline_scripts',
                count: inlineScripts.length
            });
        }

        console.log('🔍 Security scan completed:', issues.length > 0 ? issues : 'No issues found');
        return issues;
    }
}

// Initialize security manager
document.addEventListener('DOMContentLoaded', () => {
    window.securityManager = new SecurityManager();
    
    // Expose security functions for debugging
    window.getSecurityReport = () => window.securityManager.getSecurityReport();
    window.performSecurityScan = () => window.securityManager.performSecurityScan();
});