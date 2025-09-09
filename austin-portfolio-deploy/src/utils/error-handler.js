/**
 * Advanced Error Handling and System Resilience
 * Comprehensive error management, retry mechanisms, graceful degradation, and recovery strategies
 */

class ErrorHandler {
  constructor() {
    this.errorQueue = [];
    this.retryQueue = new Map();
    this.errorCounts = new Map();
    this.systemHealth = {
      status: 'healthy',
      errors: 0,
      lastError: null,
      uptime: Date.now()
    };
    
    this.config = {
      maxRetries: 3,
      retryDelay: 1000,
      maxErrorQueue: 100,
      circuitBreakerThreshold: 5,
      healthCheckInterval: 30000,
      offlineRetryInterval: 5000,
      logToConsole: true,
      logToRemote: false
    };
    
    this.initialize();
  }
  
  initialize() {
    this.setupGlobalErrorHandlers();
    this.setupNetworkMonitoring();
    this.setupHealthChecks();
    this.setupRecoveryMechanisms();
    this.startBackgroundTasks();
  }
  
  // === GLOBAL ERROR HANDLING ===
  setupGlobalErrorHandlers() {
    // Uncaught JavaScript errors
    window.addEventListener('error', (event) => {
      this.handleError({
        type: 'javascript',
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        error: event.error,
        stack: event.error?.stack,
        severity: 'high',
        recoverable: false
      });
    });
    
    // Unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError({
        type: 'promise_rejection',
        message: event.reason?.message || 'Unhandled promise rejection',
        reason: event.reason,
        severity: 'medium',
        recoverable: true,
        retryable: true
      });
      
      // Prevent default browser handling
      event.preventDefault();
    });
    
    // Resource loading errors (images, scripts, etc.)
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        this.handleError({
          type: 'resource',
          message: `Failed to load resource: ${event.target.src || event.target.href}`,
          element: event.target.tagName,
          source: event.target.src || event.target.href,
          severity: 'low',
          recoverable: true,
          retryable: true
        });
      }
    }, true);
    
    // API and fetch errors (intercept fetch)
    this.interceptFetch();
  }
  
  interceptFetch() {
    const originalFetch = window.fetch;
    
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch.apply(window, args);
        
        if (!response.ok) {
          this.handleError({
            type: 'api',
            message: `HTTP ${response.status}: ${response.statusText}`,
            url: args[0],
            status: response.status,
            severity: response.status >= 500 ? 'high' : 'medium',
            recoverable: true,
            retryable: response.status >= 500 || response.status === 429
          });
        }
        
        return response;
      } catch (error) {
        this.handleError({
          type: 'network',
          message: error.message,
          url: args[0],
          error,
          severity: 'high',
          recoverable: true,
          retryable: true
        });
        
        throw error;
      }
    };
  }
  
  // === ERROR HANDLING CORE ===
  handleError(errorInfo) {
    const error = {
      id: this.generateErrorId(),
      timestamp: Date.now(),
      ...errorInfo,
      userAgent: navigator.userAgent,
      url: window.location.href,
      sessionId: this.getSessionId()
    };
    
    // Update system health
    this.updateSystemHealth(error);
    
    // Add to error queue
    this.addToQueue(error);
    
    // Log error
    this.logError(error);
    
    // Attempt recovery if possible
    if (error.recoverable) {
      this.attemptRecovery(error);
    }
    
    // Notify user if necessary
    if (error.severity === 'high' && !error.recoverable) {
      this.notifyUser(error);
    }
    
    // Track error patterns
    this.trackErrorPattern(error);
    
    return error.id;
  }
  
  generateErrorId() {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
  
  getSessionId() {
    if (!window.sessionStorage.getItem('sessionId')) {
      window.sessionStorage.setItem('sessionId', `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    }
    return window.sessionStorage.getItem('sessionId');
  }
  
  updateSystemHealth(error) {
    this.systemHealth.errors++;
    this.systemHealth.lastError = error;
    
    // Determine system status
    if (this.systemHealth.errors > 10) {
      this.systemHealth.status = 'critical';
    } else if (this.systemHealth.errors > 5) {
      this.systemHealth.status = 'degraded';
    } else if (error.severity === 'high') {
      this.systemHealth.status = 'warning';
    }
  }
  
  addToQueue(error) {
    this.errorQueue.push(error);
    
    // Maintain queue size
    if (this.errorQueue.length > this.config.maxErrorQueue) {
      this.errorQueue.shift();
    }
  }
  
  logError(error) {
    if (this.config.logToConsole) {
      const logLevel = error.severity === 'high' ? 'error' : error.severity === 'medium' ? 'warn' : 'log';
      console[logLevel](`[${error.type.toUpperCase()}] ${error.message}`, error);
    }
    
    if (this.config.logToRemote) {
      this.sendToRemoteLog(error);
    }
  }
  
  async sendToRemoteLog(error) {
    try {
      const payload = {
        ...error,
        // Remove circular references and large objects
        error: error.error ? {
          name: error.error.name,
          message: error.error.message,
          stack: error.error.stack
        } : null
      };
      
      if (navigator.sendBeacon) {
        navigator.sendBeacon('/api/errors', JSON.stringify(payload));
      } else {
        fetch('/api/errors', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        }).catch(() => {
          // Silently fail - don't create error loops
        });
      }
    } catch (logError) {
      console.warn('Failed to send error to remote log:', logError);
    }
  }
  
  // === RECOVERY MECHANISMS ===
  attemptRecovery(error) {
    switch (error.type) {
      case 'network':
      case 'api':
        if (error.retryable) {
          this.scheduleRetry(error);
        }
        break;
        
      case 'resource':
        this.handleResourceError(error);
        break;
        
      case 'promise_rejection':
        this.handlePromiseRejection(error);
        break;
        
      default:
        console.log(`No recovery mechanism for error type: ${error.type}`);
    }
  }
  
  scheduleRetry(error) {
    const retryKey = error.url || error.message;
    const existingRetry = this.retryQueue.get(retryKey);
    
    if (existingRetry && existingRetry.attempts >= this.config.maxRetries) {
      this.handleMaxRetriesExceeded(error);
      return;
    }
    
    const attempts = existingRetry ? existingRetry.attempts + 1 : 1;
    const delay = this.config.retryDelay * Math.pow(2, attempts - 1); // Exponential backoff
    
    this.retryQueue.set(retryKey, {
      error,
      attempts,
      nextRetry: Date.now() + delay
    });
    
    console.log(`Scheduled retry ${attempts}/${this.config.maxRetries} for ${retryKey} in ${delay}ms`);
  }
  
  handleResourceError(error) {
    const element = document.querySelector(`[src="${error.source}"], [href="${error.source}"]`);
    if (element) {
      // Try alternative sources or fallback content
      if (element.tagName === 'IMG') {
        element.src = '/assets/placeholder-image.jpg';
      } else if (element.tagName === 'SCRIPT') {
        // Load fallback script or show error message
        this.loadFallbackScript(element);
      }
    }
  }
  
  loadFallbackScript(scriptElement) {
    // Check if this is a critical script we have a fallback for
    const src = scriptElement.src;
    
    if (src.includes('live-data-client')) {
      // Show fallback message for data loading
      const dataCards = document.querySelectorAll('.data-card');
      dataCards.forEach(card => {
        const badge = card.querySelector('.data-badge');
        const value = card.querySelector('.data-value');
        if (badge) badge.textContent = 'OFFLINE';
        if (value) value.textContent = 'Data unavailable';
      });
    }
  }
  
  handlePromiseRejection(error) {
    // Log and potentially retry based on the rejection reason
    if (error.reason && error.reason.name === 'NetworkError') {
      this.scheduleRetry(error);
    }
  }
  
  handleMaxRetriesExceeded(error) {
    console.error(`Max retries exceeded for ${error.url || error.message}`);
    
    // Implement graceful degradation
    this.implementGracefulDegradation(error);
    
    // Remove from retry queue
    this.retryQueue.delete(error.url || error.message);
  }
  
  implementGracefulDegradation(error) {
    switch (error.type) {
      case 'api':
      case 'network':
        this.enableOfflineMode();
        break;
        
      case 'resource':
        this.hideAffectedComponents(error);
        break;
        
      default:
        this.showErrorMessage('Some features may be temporarily unavailable');
    }
  }
  
  enableOfflineMode() {
    document.body.classList.add('offline-mode');
    
    // Show offline indicator
    this.showOfflineIndicator();
    
    // Load cached data if available
    this.loadCachedData();
  }
  
  showOfflineIndicator() {
    let indicator = document.getElementById('offline-indicator');
    if (!indicator) {
      indicator = document.createElement('div');
      indicator.id = 'offline-indicator';
      indicator.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: #f39c12;
          color: white;
          text-align: center;
          padding: 8px;
          z-index: 10000;
          font-size: 14px;
        ">
          <span>⚠️ You're offline. Some features may be limited.</span>
          <button onclick="this.parentElement.remove()" style="
            background: none;
            border: none;
            color: white;
            font-size: 16px;
            margin-left: 10px;
            cursor: pointer;
          ">×</button>
        </div>
      `;
      document.body.appendChild(indicator);
    }
  }
  
  loadCachedData() {
    // Try to load data from cache
    if (window.liveDataClient && typeof window.liveDataClient.getCacheStats === 'function') {
      const stats = window.liveDataClient.getCacheStats();
      console.log('Loading from cache:', stats);
      
      // Trigger cache-based data loading
      if (typeof window.loadLiveData === 'function') {
        window.loadLiveData(true); // Force cache mode
      }
    }
  }
  
  hideAffectedComponents(error) {
    // Hide components that depend on the failed resource
    const affectedElements = document.querySelectorAll(`[data-depends="${error.source}"]`);
    affectedElements.forEach(el => {
      el.style.display = 'none';
    });
  }
  
  showErrorMessage(message, type = 'warning') {
    const notification = document.createElement('div');
    notification.className = `error-notification ${type}`;
    notification.innerHTML = `
      <div style="
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${type === 'error' ? '#e74c3c' : '#f39c12'};
        color: white;
        padding: 12px 16px;
        border-radius: 4px;
        z-index: 10001;
        max-width: 300px;
        font-size: 14px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      ">
        <span>${message}</span>
        <button onclick="this.parentElement.parentElement.remove()" style="
          background: none;
          border: none;
          color: white;
          font-size: 16px;
          margin-left: 10px;
          cursor: pointer;
        ">×</button>
      </div>
    `;
    
    document.body.appendChild(notification);
    
    // Auto-remove after 5 seconds
    setTimeout(() => {
      if (notification.parentNode) {
        notification.remove();
      }
    }, 5000);
  }
  
  // === NETWORK MONITORING ===
  setupNetworkMonitoring() {
    // Online/offline detection
    window.addEventListener('online', () => {
      console.log('Network connection restored');
      this.handleNetworkRestore();
    });
    
    window.addEventListener('offline', () => {
      console.log('Network connection lost');
      this.handleNetworkLoss();
    });
    
    // Connection quality monitoring
    if (navigator.connection) {
      navigator.connection.addEventListener('change', () => {
        this.handleConnectionChange();
      });
    }
  }
  
  handleNetworkRestore() {
    document.body.classList.remove('offline-mode');
    
    // Remove offline indicator
    const indicator = document.getElementById('offline-indicator');
    if (indicator) indicator.remove();
    
    // Retry failed requests
    this.retryPendingRequests();
    
    // Refresh data
    if (typeof window.loadLiveData === 'function') {
      window.loadLiveData(false); // Force fresh data
    }
    
    this.showErrorMessage('Connection restored! Refreshing data...', 'success');
  }
  
  handleNetworkLoss() {
    this.enableOfflineMode();
  }
  
  handleConnectionChange() {
    const connection = navigator.connection;
    console.log('Connection changed:', {
      effectiveType: connection.effectiveType,
      downlink: connection.downlink,
      rtt: connection.rtt
    });
    
    // Adjust behavior based on connection quality
    if (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
      this.enableSlowConnectionMode();
    }
  }
  
  enableSlowConnectionMode() {
    document.body.classList.add('slow-connection');
    this.showErrorMessage('Slow connection detected. Some features may be limited.', 'info');
  }
  
  retryPendingRequests() {
    for (const [key, retry] of this.retryQueue) {
      if (retry.attempts < this.config.maxRetries) {
        // Reset attempts for network restoration
        retry.attempts = 0;
        retry.nextRetry = Date.now() + 1000; // Try in 1 second
      }
    }
  }
  
  // === HEALTH MONITORING ===
  setupHealthChecks() {
    setInterval(() => {
      this.performHealthCheck();
    }, this.config.healthCheckInterval);
  }
  
  async performHealthCheck() {
    try {
      const checks = await Promise.allSettled([
        this.checkAPIHealth(),
        this.checkResourceAvailability(),
        this.checkLocalStorage(),
        this.checkMemoryUsage()
      ]);
      
      const results = checks.map((check, index) => ({
        name: ['API', 'Resources', 'Storage', 'Memory'][index],
        status: check.status === 'fulfilled' ? check.value : 'failed',
        error: check.reason
      }));
      
      this.updateHealthStatus(results);
    } catch (error) {
      console.error('Health check failed:', error);
    }
  }
  
  async checkAPIHealth() {
    try {
      const response = await fetch('/api/health', { 
        method: 'HEAD',
        cache: 'no-cache'
      });
      return response.ok ? 'healthy' : 'degraded';
    } catch {
      return 'unhealthy';
    }
  }
  
  checkResourceAvailability() {
    // Check if critical resources are loaded
    const criticalScripts = document.querySelectorAll('script[src*="live-data-client"]');
    return criticalScripts.length > 0 ? 'healthy' : 'degraded';
  }
  
  checkLocalStorage() {
    try {
      const testKey = 'health-check-test';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return 'healthy';
    } catch {
      return 'degraded';
    }
  }
  
  checkMemoryUsage() {
    if (performance.memory) {
      const usage = performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit;
      return usage < 0.8 ? 'healthy' : 'warning';
    }
    return 'unknown';
  }
  
  updateHealthStatus(results) {
    const healthyChecks = results.filter(r => r.status === 'healthy').length;
    const totalChecks = results.length;
    const healthPercentage = (healthyChecks / totalChecks) * 100;
    
    if (healthPercentage >= 75) {
      this.systemHealth.status = 'healthy';
    } else if (healthPercentage >= 50) {
      this.systemHealth.status = 'degraded';
    } else {
      this.systemHealth.status = 'critical';
    }
    
    console.log('System Health:', {
      status: this.systemHealth.status,
      percentage: healthPercentage,
      checks: results
    });
  }
  
  // === BACKGROUND TASKS ===
  startBackgroundTasks() {
    // Process retry queue
    setInterval(() => {
      this.processRetryQueue();
    }, 5000);
    
    // Clean old errors
    setInterval(() => {
      this.cleanOldErrors();
    }, 60000);
    
    // Report system status
    setInterval(() => {
      this.reportSystemStatus();
    }, 300000); // Every 5 minutes
  }
  
  processRetryQueue() {
    const now = Date.now();
    
    for (const [key, retry] of this.retryQueue) {
      if (retry.nextRetry <= now) {
        console.log(`Retrying: ${key}`);
        
        // Attempt the retry based on error type
        this.executeRetry(retry.error, retry.attempts)
          .then(() => {
            console.log(`Retry successful for: ${key}`);
            this.retryQueue.delete(key);
          })
          .catch((error) => {
            console.log(`Retry failed for: ${key}`, error);
            this.scheduleRetry(retry.error);
          });
      }
    }
  }
  
  async executeRetry(error, attemptNumber) {
    switch (error.type) {
      case 'api':
      case 'network':
        return fetch(error.url);
        
      case 'resource':
        return this.retryResourceLoad(error);
        
      default:
        throw new Error(`Cannot retry error type: ${error.type}`);
    }
  }
  
  retryResourceLoad(error) {
    return new Promise((resolve, reject) => {
      const element = document.querySelector(`[src="${error.source}"], [href="${error.source}"]`);
      if (element) {
        const newElement = element.cloneNode(true);
        newElement.onload = resolve;
        newElement.onerror = reject;
        element.parentNode.replaceChild(newElement, element);
      } else {
        reject(new Error('Element not found'));
      }
    });
  }
  
  cleanOldErrors() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    this.errorQueue = this.errorQueue.filter(error => error.timestamp > oneHourAgo);
  }
  
  reportSystemStatus() {
    const report = {
      ...this.systemHealth,
      uptime: Date.now() - this.systemHealth.uptime,
      errorQueue: this.errorQueue.length,
      retryQueue: this.retryQueue.size,
      recentErrors: this.errorQueue.slice(-5)
    };
    
    console.log('System Status Report:', report);
  }
  
  // === ERROR PATTERN TRACKING ===
  trackErrorPattern(error) {
    const key = `${error.type}:${error.message}`;
    const count = this.errorCounts.get(key) || 0;
    this.errorCounts.set(key, count + 1);
    
    // Detect error patterns
    if (count > 5) {
      this.handleErrorPattern(key, count);
    }
  }
  
  handleErrorPattern(pattern, count) {
    console.warn(`Error pattern detected: ${pattern} (${count} occurrences)`);
    
    // Could implement more sophisticated pattern detection
    // and automatic remediation strategies here
  }
  
  // === PUBLIC API ===
  getSystemHealth() {
    return { ...this.systemHealth };
  }
  
  getRecentErrors(limit = 10) {
    return this.errorQueue.slice(-limit);
  }
  
  notifyUser(error) {
    // Show user-friendly error notification
    const message = this.getUserFriendlyMessage(error);
    this.showErrorMessage(message, 'error');
  }
  
  getUserFriendlyMessage(error) {
    switch (error.type) {
      case 'network':
        return 'Network connection issues detected. Please check your internet connection.';
      case 'api':
        return 'Unable to load data. Please try refreshing the page.';
      case 'resource':
        return 'Some content failed to load. The page may not display correctly.';
      default:
        return 'An unexpected error occurred. Please refresh the page if issues persist.';
    }
  }
  
  // Manual error reporting
  reportError(error, context = {}) {
    return this.handleError({
      type: 'manual',
      message: error.message || error,
      error,
      context,
      severity: 'medium',
      recoverable: true
    });
  }
}

// Initialize error handler
if (typeof window !== 'undefined') {
  window.errorHandler = new ErrorHandler();
}

export default ErrorHandler;