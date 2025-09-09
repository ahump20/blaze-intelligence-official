/**
 * Blaze Intelligence Comprehensive Error Handling & Circuit Breaker System
 * Enhanced production-ready error management with telemetry and recovery strategies
 */

class BlazeErrorHandler {
    constructor(options = {}) {
        this.config = {
            circuitBreakerThreshold: options.threshold || 5,
            circuitBreakerTimeout: options.timeout || 60000,
            retryAttempts: options.retryAttempts || 3,
            retryDelay: options.retryDelay || 1000,
            telemetryEndpoint: options.telemetryEndpoint || 'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/telemetry',
            enableTelemetry: options.enableTelemetry !== false,
            enableConsoleLogging: options.enableConsoleLogging !== false,
            errorCategories: {
                NETWORK: 'network',
                API: 'api',
                WEBSOCKET: 'websocket',
                DATA: 'data',
                UI: 'ui',
                SYSTEM: 'system'
            }
        };
        
        this.circuitBreakers = new Map();
        this.errorCache = new Map();
        this.telemetryQueue = [];
        this.sessionId = this.generateSessionId();
        
        this.init();
    }

    init() {
        console.log('🛡️ Initializing Blaze Error Handler...');
        
        // Global error handlers
        this.setupGlobalErrorHandlers();
        
        // Initialize circuit breakers for known endpoints
        this.initializeCircuitBreakers();
        
        // Start telemetry flushing
        if (this.config.enableTelemetry) {
            this.startTelemetryFlush();
        }
        
        console.log('✅ Error Handler initialized successfully');
    }

    setupGlobalErrorHandlers() {
        // Unhandled JavaScript errors
        window.addEventListener('error', (event) => {
            this.handleError({
                type: this.config.errorCategories.SYSTEM,
                message: event.message,
                filename: event.filename,
                lineno: event.lineno,
                colno: event.colno,
                error: event.error,
                severity: 'high',
                context: 'global_error_handler'
            });
        });

        // Unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.handleError({
                type: this.config.errorCategories.SYSTEM,
                message: 'Unhandled Promise Rejection',
                error: event.reason,
                severity: 'high',
                context: 'unhandled_promise_rejection'
            });
            
            // Prevent the default behavior (logging to console)
            event.preventDefault();
        });

        // Network errors
        window.addEventListener('offline', () => {
            this.handleError({
                type: this.config.errorCategories.NETWORK,
                message: 'Network connection lost',
                severity: 'medium',
                context: 'network_status'
            });
        });

        window.addEventListener('online', () => {
            this.log('🌐 Network connection restored', 'info');
        });
    }

    initializeCircuitBreakers() {
        const endpoints = [
            'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev',
            'https://statsapi.mlb.com/api/v1',
            'https://site.api.espn.com/apis',
            'https://api.collegefootballdata.com'
        ];

        endpoints.forEach(endpoint => {
            this.circuitBreakers.set(endpoint, {
                state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
                failureCount: 0,
                lastFailureTime: null,
                nextAttemptTime: null
            });
        });
    }

    async handleError(errorDetails) {
        const errorId = this.generateErrorId();
        const timestamp = new Date().toISOString();
        
        const enrichedError = {
            id: errorId,
            timestamp,
            sessionId: this.sessionId,
            url: window.location.href,
            userAgent: navigator.userAgent,
            ...errorDetails
        };

        // Cache the error
        this.errorCache.set(errorId, enrichedError);

        // Log to console if enabled
        if (this.config.enableConsoleLogging) {
            const logLevel = this.getLogLevel(errorDetails.severity);
            console[logLevel](`🚨 [${errorDetails.type.toUpperCase()}] ${errorDetails.message}`, enrichedError);
        }

        // Add to telemetry queue
        if (this.config.enableTelemetry) {
            this.telemetryQueue.push(enrichedError);
        }

        // Handle based on error type
        await this.processErrorByType(enrichedError);

        // Dispatch custom event for UI components to handle
        this.dispatchErrorEvent(enrichedError);

        return errorId;
    }

    async processErrorByType(error) {
        switch (error.type) {
            case this.config.errorCategories.NETWORK:
                await this.handleNetworkError(error);
                break;
            case this.config.errorCategories.API:
                await this.handleAPIError(error);
                break;
            case this.config.errorCategories.WEBSOCKET:
                await this.handleWebSocketError(error);
                break;
            case this.config.errorCategories.DATA:
                await this.handleDataError(error);
                break;
            case this.config.errorCategories.UI:
                await this.handleUIError(error);
                break;
            default:
                await this.handleGenericError(error);
        }
    }

    async handleNetworkError(error) {
        // Implement network-specific recovery strategies
        const endpoint = error.endpoint;
        if (endpoint) {
            this.updateCircuitBreaker(endpoint, false);
        }

        // Show user-friendly network error message
        this.showUserNotification('Network connection issue detected. Retrying...', 'warning');
    }

    async handleAPIError(error) {
        const endpoint = error.endpoint;
        if (endpoint) {
            this.updateCircuitBreaker(endpoint, false);
        }

        // Implement API-specific fallback strategies
        if (error.fallbackData) {
            this.log('🔄 Using fallback data due to API error', 'warn');
            return error.fallbackData;
        }
    }

    async handleWebSocketError(error) {
        // Implement WebSocket reconnection logic
        this.log('🔌 WebSocket error detected, scheduling reconnection...', 'warn');
        
        // Dispatch event for WebSocket components to handle reconnection
        document.dispatchEvent(new CustomEvent('websocketErrorRecovery', {
            detail: { error, reconnectDelay: 3000 }
        }));
    }

    async handleDataError(error) {
        // Handle data validation and transformation errors
        this.log('📊 Data processing error, attempting recovery...', 'warn');
        
        // Could implement data sanitization or alternative data sources
    }

    async handleUIError(error) {
        // Handle UI rendering errors
        this.log('🖥️ UI error detected, attempting component recovery...', 'warn');
        
        // Could implement component re-rendering or fallback UI
        this.showUserNotification('Display issue detected. Refreshing...', 'info');
    }

    async handleGenericError(error) {
        this.log('⚠️ Generic error handled', 'warn');
    }

    updateCircuitBreaker(endpoint, success) {
        const breaker = this.circuitBreakers.get(endpoint);
        if (!breaker) return;

        const now = Date.now();

        if (success) {
            breaker.failureCount = 0;
            breaker.state = 'CLOSED';
            breaker.lastFailureTime = null;
            breaker.nextAttemptTime = null;
        } else {
            breaker.failureCount++;
            breaker.lastFailureTime = now;

            if (breaker.failureCount >= this.config.circuitBreakerThreshold) {
                breaker.state = 'OPEN';
                breaker.nextAttemptTime = now + this.config.circuitBreakerTimeout;
                
                this.log(`🔴 Circuit breaker OPEN for ${endpoint}`, 'error');
                
                this.handleError({
                    type: this.config.errorCategories.SYSTEM,
                    message: `Circuit breaker opened for endpoint: ${endpoint}`,
                    endpoint,
                    severity: 'high',
                    context: 'circuit_breaker'
                });
            }
        }

        this.circuitBreakers.set(endpoint, breaker);
    }

    isCircuitBreakerOpen(endpoint) {
        const breaker = this.circuitBreakers.get(endpoint);
        if (!breaker) return false;

        const now = Date.now();

        if (breaker.state === 'OPEN') {
            if (now >= breaker.nextAttemptTime) {
                breaker.state = 'HALF_OPEN';
                this.log(`🟡 Circuit breaker HALF_OPEN for ${endpoint}`, 'warn');
            } else {
                return true;
            }
        }

        return false;
    }

    async retryWithCircuitBreaker(endpoint, operation, context = {}) {
        if (this.isCircuitBreakerOpen(endpoint)) {
            throw new Error(`Circuit breaker is OPEN for ${endpoint}`);
        }

        let lastError;
        
        for (let attempt = 1; attempt <= this.config.retryAttempts; attempt++) {
            try {
                const result = await operation();
                
                // Success - update circuit breaker
                this.updateCircuitBreaker(endpoint, true);
                
                if (attempt > 1) {
                    this.log(`✅ Operation succeeded on attempt ${attempt} for ${endpoint}`, 'info');
                }
                
                return result;
            } catch (error) {
                lastError = error;
                
                // Log the attempt
                this.log(`❌ Attempt ${attempt}/${this.config.retryAttempts} failed for ${endpoint}: ${error.message}`, 'warn');
                
                // Update circuit breaker on failure
                this.updateCircuitBreaker(endpoint, false);
                
                // Don't retry if circuit breaker is now open
                if (this.isCircuitBreakerOpen(endpoint)) {
                    break;
                }
                
                // Wait before retry (exponential backoff)
                if (attempt < this.config.retryAttempts) {
                    const delay = this.config.retryDelay * Math.pow(2, attempt - 1);
                    await this.sleep(delay);
                }
            }
        }

        // All retries failed
        const errorId = await this.handleError({
            type: this.config.errorCategories.API,
            message: `All retry attempts failed for ${endpoint}`,
            endpoint,
            error: lastError,
            context: context.operation || 'unknown',
            severity: 'high'
        });

        throw new Error(`Operation failed after ${this.config.retryAttempts} attempts. Error ID: ${errorId}`);
    }

    startTelemetryFlush() {
        setInterval(async () => {
            if (this.telemetryQueue.length > 0) {
                await this.flushTelemetry();
            }
        }, 30000); // Flush every 30 seconds
    }

    async flushTelemetry() {
        if (this.telemetryQueue.length === 0) return;

        const batch = [...this.telemetryQueue];
        this.telemetryQueue.length = 0; // Clear the queue

        try {
            await fetch(this.config.telemetryEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Session-ID': this.sessionId
                },
                body: JSON.stringify({
                    timestamp: new Date().toISOString(),
                    sessionId: this.sessionId,
                    errors: batch
                })
            });

            this.log(`📊 Flushed ${batch.length} errors to telemetry`, 'info');
        } catch (error) {
            // Failed to send telemetry - put errors back in queue
            this.telemetryQueue.unshift(...batch);
            this.log('❌ Failed to flush telemetry, errors requeued', 'warn');
        }
    }

    dispatchErrorEvent(error) {
        document.dispatchEvent(new CustomEvent('blazeError', {
            detail: error
        }));
    }

    showUserNotification(message, type = 'info') {
        // Create or update notification element
        let notification = document.getElementById('blaze-error-notification');
        
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'blaze-error-notification';
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                padding: 12px 20px;
                border-radius: 8px;
                color: white;
                font-family: 'Inter', sans-serif;
                font-size: 14px;
                font-weight: 500;
                max-width: 400px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
                transition: all 0.3s ease;
                transform: translateX(100%);
            `;
            document.body.appendChild(notification);
        }

        // Set color based on type
        const colors = {
            info: 'linear-gradient(135deg, #00B2A9, #0066cc)',
            warning: 'linear-gradient(135deg, #ff8c00, #ffaa00)',
            error: 'linear-gradient(135deg, #ff4757, #ff3742)'
        };

        notification.style.background = colors[type] || colors.info;
        notification.textContent = message;
        notification.style.transform = 'translateX(0)';

        // Auto-hide after 5 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
        }, 5000);
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    generateSessionId() {
        return 'blaze_session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    generateErrorId() {
        return 'err_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6);
    }

    getLogLevel(severity) {
        switch (severity) {
            case 'high': return 'error';
            case 'medium': return 'warn';
            case 'low': return 'info';
            default: return 'log';
        }
    }

    log(message, level = 'info') {
        if (this.config.enableConsoleLogging) {
            console[level](`🛡️ [Blaze ErrorHandler] ${message}`);
        }
    }

    // Public API methods
    getCircuitBreakerStatus() {
        const status = {};
        this.circuitBreakers.forEach((breaker, endpoint) => {
            status[endpoint] = {
                state: breaker.state,
                failureCount: breaker.failureCount,
                isOpen: this.isCircuitBreakerOpen(endpoint)
            };
        });
        return status;
    }

    getErrorStats() {
        const errorsByType = {};
        this.errorCache.forEach(error => {
            errorsByType[error.type] = (errorsByType[error.type] || 0) + 1;
        });

        return {
            totalErrors: this.errorCache.size,
            errorsByType,
            telemetryQueueSize: this.telemetryQueue.length,
            sessionId: this.sessionId
        };
    }

    clearErrorCache() {
        this.errorCache.clear();
        this.telemetryQueue.length = 0;
        this.log('🧹 Error cache cleared', 'info');
    }
}

// Global instance
let blazeErrorHandler;

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            blazeErrorHandler = new BlazeErrorHandler({
                threshold: 3,
                timeout: 30000,
                retryAttempts: 3,
                enableTelemetry: true,
                enableConsoleLogging: true
            });

            window.blazeErrorHandler = blazeErrorHandler;

            // Add event listener for error events
            document.addEventListener('blazeError', (event) => {
                console.log('🚨 Blaze Error Event:', event.detail);
            });

            console.log('✅ Blaze Error Handler loaded successfully');

        } catch (error) {
            console.error('❌ Failed to initialize Blaze Error Handler:', error);
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeErrorHandler;
}