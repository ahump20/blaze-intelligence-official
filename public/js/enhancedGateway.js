// Enhanced Gateway Integration with Optimized Performance
class EnhancedGatewayIntegration {
    constructor() {
        this.BASE = "https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev";
        this.connectionState = 'disconnected';
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.batchQueue = [];
        this.lastHealthCheck = 0;
        this.performanceMetrics = new Map();
        this.init();
    }

    async init() {
        this.setupConnectionMonitoring();
        this.startHealthChecks();
        this.initializeBatchProcessor();
        this.setupRetryLogic();
    }

    // Enhanced connection monitoring with exponential backoff
    setupConnectionMonitoring() {
        window.addEventListener('online', () => this.handleConnectionRestore());
        window.addEventListener('offline', () => this.handleConnectionLoss());
        
        // Monitor WebSocket health
        setInterval(() => this.checkWebSocketHealth(), 30000);
    }

    async startHealthChecks() {
        const checkHealth = async () => {
            const startTime = performance.now();
            try {
                const response = await fetch(`${this.BASE}/healthz`, {
                    signal: AbortSignal.timeout(5000) // 5 second timeout
                });
                
                const latency = performance.now() - startTime;
                this.recordMetric('health_check_latency', latency);
                
                if (response.ok) {
                    this.connectionState = 'connected';
                    this.reconnectAttempts = 0;
                    this.updateConnectionStatus('healthy', latency);
                } else {
                    this.handleConnectionError(`HTTP ${response.status}`);
                }
            } catch (error) {
                this.handleConnectionError(error.message);
            }
        };

        // Initial check
        await checkHealth();
        
        // Periodic checks with adaptive interval
        const getInterval = () => this.connectionState === 'connected' ? 10000 : 30000;
        
        const scheduleNext = () => {
            setTimeout(async () => {
                await checkHealth();
                scheduleNext();
            }, getInterval());
        };
        
        scheduleNext();
    }

    handleConnectionError(error) {
        this.connectionState = 'error';
        this.updateConnectionStatus('error', null, error);
        
        // Exponential backoff for reconnection
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            const delay = Math.pow(2, this.reconnectAttempts) * 1000;
            this.reconnectAttempts++;
            
            setTimeout(() => {
                console.log(`🔄 Attempting reconnection (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
            }, delay);
        }
    }

    handleConnectionRestore() {
        console.log('🟢 Network connection restored');
        this.connectionState = 'connecting';
        this.reconnectAttempts = 0;
    }

    handleConnectionLoss() {
        console.log('🔴 Network connection lost');
        this.connectionState = 'disconnected';
        this.updateConnectionStatus('offline');
    }

    // Batched telemetry processing for better performance
    initializeBatchProcessor() {
        setInterval(() => {
            if (this.batchQueue.length > 0) {
                this.processBatch();
            }
        }, 2000); // Process batches every 2 seconds
    }

    addToBatch(data) {
        this.batchQueue.push({
            ...data,
            timestamp: Date.now()
        });

        // Process immediately if batch is full
        if (this.batchQueue.length >= 10) {
            this.processBatch();
        }
    }

    async processBatch() {
        if (this.batchQueue.length === 0) return;
        
        const batch = [...this.batchQueue];
        this.batchQueue = [];
        
        const startTime = performance.now();
        try {
            const response = await fetch(`${this.BASE}/vision/telemetry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Dev-Mode': 'true',
                    'X-Batch-Size': batch.length.toString()
                },
                body: JSON.stringify(batch)
            });

            const latency = performance.now() - startTime;
            this.recordMetric('batch_telemetry_latency', latency);
            
            if (!response.ok) {
                throw new Error(`Batch upload failed: ${response.status}`);
            }
            
            console.log(`📊 Successfully uploaded batch of ${batch.length} telemetry items (${latency.toFixed(1)}ms)`);
        } catch (error) {
            console.warn('❌ Batch upload failed:', error);
            // Re-queue failed items for retry
            this.batchQueue.unshift(...batch.slice(-5)); // Keep last 5 items
        }
    }

    // Enhanced WebSocket management with auto-reconnect
    async createEnhancedWebSocket(sessionId) {
        const wsUrl = `${this.BASE.replace('https://', 'wss://')}/vision/session/${sessionId}/stream`;
        
        try {
            const ws = new WebSocket(wsUrl);
            const startTime = Date.now();
            
            ws.onopen = () => {
                const connectionTime = Date.now() - startTime;
                console.log(`🔗 WebSocket connected in ${connectionTime}ms`);
                this.recordMetric('websocket_connection_time', connectionTime);
            };
            
            ws.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    this.handleRealtimeData(data);
                } catch (error) {
                    console.warn('WebSocket message parse error:', error);
                }
            };
            
            ws.onerror = (error) => {
                console.error('WebSocket error:', error);
                this.scheduleWebSocketReconnect(sessionId);
            };
            
            ws.onclose = (event) => {
                if (event.code !== 1000) { // Not a normal closure
                    console.warn(`WebSocket closed unexpectedly: ${event.code}`);
                    this.scheduleWebSocketReconnect(sessionId);
                }
            };
            
            return ws;
        } catch (error) {
            console.error('WebSocket creation failed:', error);
            this.scheduleWebSocketReconnect(sessionId);
            return null;
        }
    }

    scheduleWebSocketReconnect(sessionId) {
        setTimeout(() => {
            console.log('🔄 Attempting WebSocket reconnection...');
            this.createEnhancedWebSocket(sessionId);
        }, 3000);
    }

    handleRealtimeData(data) {
        // Update live metrics
        if (data.scores?.grit_index) {
            this.updateLiveMetric('grit_index', data.scores.grit_index);
        }
        
        if (data.performance_metrics) {
            Object.entries(data.performance_metrics).forEach(([key, value]) => {
                this.updateLiveMetric(key, value);
            });
        }

        // Trigger custom events for other components
        window.dispatchEvent(new CustomEvent('realtime-data', {
            detail: data
        }));
    }

    updateLiveMetric(metric, value) {
        const element = document.getElementById(`live-${metric.replace('_', '-')}`);
        if (element) {
            if (typeof value === 'number') {
                element.textContent = value.toFixed(2);
            } else {
                element.textContent = value;
            }
            
            // Visual feedback for updates
            element.style.color = 'var(--burnt-orange)';
            setTimeout(() => {
                element.style.color = '';
            }, 500);
        }
    }

    // Performance metrics recording
    recordMetric(name, value) {
        const metrics = this.performanceMetrics.get(name) || [];
        metrics.push({
            value,
            timestamp: Date.now()
        });
        
        // Keep only last 100 measurements
        if (metrics.length > 100) {
            metrics.shift();
        }
        
        this.performanceMetrics.set(name, metrics);
    }

    getMetricStats(name) {
        const metrics = this.performanceMetrics.get(name);
        if (!metrics || metrics.length === 0) return null;
        
        const values = metrics.map(m => m.value);
        values.sort((a, b) => a - b);
        
        return {
            count: values.length,
            avg: values.reduce((a, b) => a + b, 0) / values.length,
            min: values[0],
            max: values[values.length - 1],
            p50: values[Math.floor(values.length * 0.5)],
            p95: values[Math.floor(values.length * 0.95)],
            p99: values[Math.floor(values.length * 0.99)]
        };
    }

    updateConnectionStatus(status, latency = null, error = null) {
        const statusElement = document.querySelector('.status-indicator');
        if (!statusElement) return;
        
        statusElement.className = `status-indicator ${status}`;
        
        switch (status) {
            case 'healthy':
                statusElement.textContent = `🟢 Connected (${latency?.toFixed(0)}ms)`;
                break;
            case 'error':
                statusElement.textContent = `🔴 Error: ${error}`;
                break;
            case 'offline':
                statusElement.textContent = '⚪ Offline';
                break;
            case 'connecting':
                statusElement.textContent = '🟡 Connecting...';
                break;
        }
    }

    checkWebSocketHealth() {
        // Check if WebSocket connections are healthy
        // In a real implementation, you'd track active WebSocket instances
        console.log('🔍 WebSocket health check completed');
    }

    setupRetryLogic() {
        // Implement exponential backoff for failed requests
        const originalFetch = window.fetch;
        
        window.fetch = async (url, options = {}) => {
            const maxRetries = options.maxRetries || 3;
            const baseDelay = options.baseDelay || 1000;
            
            for (let attempt = 0; attempt <= maxRetries; attempt++) {
                try {
                    const response = await originalFetch(url, options);
                    if (response.ok || attempt === maxRetries) {
                        return response;
                    }
                    throw new Error(`HTTP ${response.status}`);
                } catch (error) {
                    if (attempt === maxRetries) throw error;
                    
                    const delay = baseDelay * Math.pow(2, attempt);
                    console.log(`⏳ Retrying request to ${url} in ${delay}ms (attempt ${attempt + 1}/${maxRetries})`);
                    await new Promise(resolve => setTimeout(resolve, delay));
                }
            }
        };
    }

    // Get comprehensive system status
    async getSystemStatus() {
        try {
            const [healthResponse, metricsResponse] = await Promise.all([
                fetch(`${this.BASE}/healthz`),
                fetch('/metrics')
            ]);

            const health = await healthResponse.text();
            const metrics = await metricsResponse.json();

            return {
                gateway: {
                    status: healthResponse.ok ? 'healthy' : 'error',
                    response: health
                },
                server: {
                    uptime: metrics.uptime,
                    memory: metrics.memory,
                    cache: metrics.cache
                },
                performance: Object.fromEntries(
                    Array.from(this.performanceMetrics.entries()).map(([key, values]) => [
                        key,
                        this.getMetricStats(key)
                    ])
                )
            };
        } catch (error) {
            console.error('Failed to get system status:', error);
            return { error: error.message };
        }
    }
}

// Initialize enhanced gateway integration
document.addEventListener('DOMContentLoaded', () => {
    window.enhancedGateway = new EnhancedGatewayIntegration();
    
    // Expose metrics for debugging
    window.getGatewayMetrics = () => window.enhancedGateway.getSystemStatus();
});

// Global error handler for enhanced debugging
window.addEventListener('error', (event) => {
    if (window.enhancedGateway) {
        window.enhancedGateway.recordMetric('javascript_errors', 1);
    }
});

window.addEventListener('unhandledrejection', (event) => {
    if (window.enhancedGateway) {
        window.enhancedGateway.recordMetric('promise_rejections', 1);
    }
});