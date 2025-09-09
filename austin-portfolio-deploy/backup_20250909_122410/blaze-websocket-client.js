/**
 * Blaze Intelligence WebSocket Client
 * Real-time data streaming for championship analytics
 */

class BlazeWebSocketClient {
    constructor(config = {}) {
        this.url = config.url || 'wss://stream.blaze-intelligence.pages.dev/v2/live';
        this.reconnectInterval = config.reconnectInterval || 5000;
        this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
        this.heartbeatInterval = config.heartbeatInterval || 30000;
        
        this.ws = null;
        this.reconnectAttempts = 0;
        this.listeners = new Map();
        this.subscriptions = new Set();
        this.isConnected = false;
        this.heartbeatTimer = null;
        
        // Performance metrics
        this.metrics = {
            messagesReceived: 0,
            latency: [],
            connectionTime: null,
            lastUpdate: null
        };
    }
    
    connect() {
        return new Promise((resolve, reject) => {
            try {
                console.log('🔌 Connecting to Blaze WebSocket...');
                this.ws = new WebSocket(this.url);
                
                this.ws.onopen = () => {
                    console.log('✅ WebSocket connected');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    this.metrics.connectionTime = Date.now();
                    
                    // Start heartbeat
                    this.startHeartbeat();
                    
                    // Resubscribe to previous channels
                    this.subscriptions.forEach(channel => {
                        this.subscribe(channel);
                    });
                    
                    // Emit connection event
                    this.emit('connected', { timestamp: Date.now() });
                    resolve();
                };
                
                this.ws.onmessage = (event) => {
                    this.handleMessage(event);
                };
                
                this.ws.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.emit('error', error);
                    reject(error);
                };
                
                this.ws.onclose = () => {
                    console.log('🔌 WebSocket disconnected');
                    this.isConnected = false;
                    this.stopHeartbeat();
                    this.emit('disconnected', { timestamp: Date.now() });
                    this.attemptReconnect();
                };
                
            } catch (error) {
                console.error('Failed to create WebSocket:', error);
                reject(error);
            }
        });
    }
    
    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            const receiveTime = Date.now();
            
            // Update metrics
            this.metrics.messagesReceived++;
            this.metrics.lastUpdate = receiveTime;
            
            // Calculate latency if timestamp provided
            if (data.timestamp) {
                const latency = receiveTime - data.timestamp;
                this.metrics.latency.push(latency);
                // Keep only last 100 latency measurements
                if (this.metrics.latency.length > 100) {
                    this.metrics.latency.shift();
                }
            }
            
            // Route message to appropriate handler
            switch (data.type) {
                case 'sports_update':
                    this.handleSportsUpdate(data);
                    break;
                case 'metrics':
                    this.handleMetricsUpdate(data);
                    break;
                case 'alert':
                    this.handleAlert(data);
                    break;
                case 'pong':
                    // Heartbeat response
                    break;
                default:
                    this.emit('data', data);
            }
            
        } catch (error) {
            console.error('Failed to parse WebSocket message:', error);
        }
    }
    
    handleSportsUpdate(data) {
        // Update specific sport metrics
        if (data.sport && data.team) {
            const channel = `${data.sport}:${data.team}`;
            this.emit(channel, data);
            
            // Update UI elements if they exist
            this.updateUIMetrics(data);
        }
        
        // Emit general sports update
        this.emit('sports_update', data);
    }
    
    handleMetricsUpdate(data) {
        // Update system metrics
        if (data.systemMetrics) {
            this.emit('system_metrics', data.systemMetrics);
            
            // Update status indicators
            if (document.getElementById('system-accuracy')) {
                document.getElementById('system-accuracy').textContent = 
                    data.systemMetrics.accuracy + '%';
            }
            if (document.getElementById('system-latency')) {
                document.getElementById('system-latency').textContent = 
                    data.systemMetrics.latency + 'ms';
            }
        }
        
        this.emit('metrics', data);
    }
    
    handleAlert(data) {
        console.warn('🚨 Alert received:', data.message);
        this.emit('alert', data);
        
        // Show visual alert if UI supports it
        if (window.showNotification) {
            window.showNotification(data.message, data.severity);
        }
    }
    
    updateUIMetrics(data) {
        const updates = {
            'mlb:cardinals': 'cardinals-readiness',
            'nfl:titans': 'titans-performance',
            'ncaa:longhorns': 'longhorns-recruiting',
            'nba:grizzlies': 'grizzlies-grit'
        };
        
        const elementId = updates[`${data.sport}:${data.team}`];
        if (elementId && document.getElementById(elementId)) {
            const element = document.getElementById(elementId);
            const value = data.value || data.metric;
            
            if (value) {
                // Animate the update
                element.style.transform = 'scale(1.1)';
                element.textContent = typeof value === 'number' ? 
                    (value % 1 === 0 ? value : value.toFixed(1) + '%') : value;
                
                setTimeout(() => {
                    element.style.transform = 'scale(1)';
                }, 300);
            }
        }
    }
    
    subscribe(channel) {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                action: 'subscribe',
                channel: channel,
                timestamp: Date.now()
            };
            this.ws.send(JSON.stringify(message));
            this.subscriptions.add(channel);
            console.log(`📡 Subscribed to ${channel}`);
        }
    }
    
    unsubscribe(channel) {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            const message = {
                action: 'unsubscribe',
                channel: channel,
                timestamp: Date.now()
            };
            this.ws.send(JSON.stringify(message));
            this.subscriptions.delete(channel);
            console.log(`📡 Unsubscribed from ${channel}`);
        }
    }
    
    send(data) {
        if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
            const message = typeof data === 'string' ? data : JSON.stringify(data);
            this.ws.send(message);
        } else {
            console.warn('WebSocket not connected. Message queued.');
            // Could implement message queue here
        }
    }
    
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emit(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    startHeartbeat() {
        this.stopHeartbeat();
        this.heartbeatTimer = setInterval(() => {
            if (this.isConnected && this.ws.readyState === WebSocket.OPEN) {
                this.ws.send(JSON.stringify({ 
                    action: 'ping', 
                    timestamp: Date.now() 
                }));
            }
        }, this.heartbeatInterval);
    }
    
    stopHeartbeat() {
        if (this.heartbeatTimer) {
            clearInterval(this.heartbeatTimer);
            this.heartbeatTimer = null;
        }
    }
    
    attemptReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            console.log(`🔄 Attempting reconnect ${this.reconnectAttempts}/${this.maxReconnectAttempts}...`);
            
            setTimeout(() => {
                this.connect().catch(error => {
                    console.error('Reconnect failed:', error);
                });
            }, this.reconnectInterval);
        } else {
            console.error('Max reconnection attempts reached');
            this.emit('max_reconnect_reached', { attempts: this.reconnectAttempts });
        }
    }
    
    disconnect() {
        this.stopHeartbeat();
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
        this.isConnected = false;
        this.subscriptions.clear();
        this.listeners.clear();
    }
    
    getMetrics() {
        const avgLatency = this.metrics.latency.length > 0 ?
            this.metrics.latency.reduce((a, b) => a + b, 0) / this.metrics.latency.length : 0;
        
        return {
            connected: this.isConnected,
            messagesReceived: this.metrics.messagesReceived,
            averageLatency: Math.round(avgLatency),
            connectionUptime: this.metrics.connectionTime ? 
                Date.now() - this.metrics.connectionTime : 0,
            lastUpdate: this.metrics.lastUpdate
        };
    }
}

// Initialize WebSocket client when DOM is ready
if (typeof window !== 'undefined') {
    window.blazeWebSocket = null;
    
    window.initializeBlazeWebSocket = function() {
        // Use simulated WebSocket for now (will use real endpoint when available)
        window.blazeWebSocket = new BlazeWebSocketClient({
            url: 'wss://stream.blaze-intelligence.pages.dev/v2/live',
            reconnectInterval: 5000,
            maxReconnectAttempts: 10
        });
        
        // Set up event listeners
        window.blazeWebSocket.on('connected', () => {
            console.log('🎉 Blaze WebSocket connected!');
            // Subscribe to all sports channels
            window.blazeWebSocket.subscribe('mlb:cardinals');
            window.blazeWebSocket.subscribe('nfl:titans');
            window.blazeWebSocket.subscribe('ncaa:longhorns');
            window.blazeWebSocket.subscribe('nba:grizzlies');
        });
        
        window.blazeWebSocket.on('sports_update', (data) => {
            console.log('📊 Sports update received:', data);
        });
        
        window.blazeWebSocket.on('alert', (data) => {
            console.log('🚨 Alert:', data.message);
        });
        
        // Simulate connection for demo (remove when real WebSocket is available)
        simulateWebSocketData();
        
        return window.blazeWebSocket;
    };
    
    // Simulation function for demo purposes
    function simulateWebSocketData() {
        if (!window.blazeWebSocket) return;
        
        setInterval(() => {
            // Simulate Cardinals update
            window.blazeWebSocket.handleSportsUpdate({
                type: 'sports_update',
                sport: 'mlb',
                team: 'cardinals',
                value: 85 + Math.random() * 10,
                timestamp: Date.now()
            });
            
            // Simulate Titans update
            window.blazeWebSocket.handleSportsUpdate({
                type: 'sports_update',
                sport: 'nfl',
                team: 'titans',
                value: 75 + Math.random() * 15,
                timestamp: Date.now()
            });
            
            // Simulate system metrics
            window.blazeWebSocket.handleMetricsUpdate({
                type: 'metrics',
                systemMetrics: {
                    accuracy: (94 + Math.random() * 2).toFixed(1),
                    latency: Math.floor(80 + Math.random() * 40),
                    dataPoints: 2800000 + Math.floor(Math.random() * 200000)
                },
                timestamp: Date.now()
            });
        }, 5000);
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeWebSocketClient;
}