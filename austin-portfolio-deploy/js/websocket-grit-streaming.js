/**
 * Blaze Intelligence WebSocket Grit Index Streaming
 * Real-time streaming connection for Grit Index and character metrics
 * Enhanced for 2025 season with micro-expression analysis
 */

class GritIndexStreaming {
    constructor(options = {}) {
        this.gatewayURL = options.gatewayURL || 'wss://blaze-vision-ai-gateway.humphrey-austin20.workers.dev';
        this.reconnectInterval = options.reconnectInterval || 3000;
        this.maxReconnectAttempts = options.maxReconnectAttempts || 10;
        
        this.websocket = null;
        this.reconnectAttempts = 0;
        this.isConnected = false;
        this.sessionId = this.generateSessionId();
        this.messageQueue = [];
        
        // Streaming data cache
        this.gritCache = new Map();
        this.characterProfiles = new Map();
        this.microExpressions = new Map();
        
        // Enhanced Grit Index components
        this.gritComponents = {
            mentalToughness: { weight: 0.25, value: 0 },
            determinationIndex: { weight: 0.25, value: 0 },
            resilienceScore: { weight: 0.20, value: 0 },
            clutchPerformance: { weight: 0.15, value: 0 },
            leadershipQuotient: { weight: 0.15, value: 0 }
        };
        
        this.init();
    }

    async init() {
        console.log('🔥 Initializing Grit Index WebSocket Streaming...');
        console.log('🎯 Gateway:', this.gatewayURL);
        
        try {
            await this.connect();
            this.setupEventListeners();
            console.log('✅ Grit Index Streaming initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Grit Index Streaming:', error);
            this.scheduleReconnect();
        }
    }

    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Convert HTTP(S) URL to WebSocket URL if needed
                let wsUrl = this.gatewayURL;
                if (wsUrl.startsWith('http')) {
                    wsUrl = wsUrl.replace('http://', 'ws://').replace('https://', 'wss://');
                }
                
                // Add WebSocket endpoint path
                if (!wsUrl.includes('/ws')) {
                    wsUrl = wsUrl.endsWith('/') ? wsUrl + 'ws/grit-stream' : wsUrl + '/ws/grit-stream';
                }
                
                console.log('🔌 Connecting to:', wsUrl);
                this.websocket = new WebSocket(wsUrl);
                
                this.websocket.onopen = (event) => {
                    console.log('✅ WebSocket connected successfully');
                    this.isConnected = true;
                    this.reconnectAttempts = 0;
                    
                    // Send authentication and session info
                    this.sendMessage({
                        type: 'auth',
                        sessionId: this.sessionId,
                        platform: 'blaze-intelligence',
                        timestamp: Date.now()
                    });
                    
                    // Subscribe to grit index streams
                    this.subscribeToGritStreams();
                    
                    resolve(event);
                };
                
                this.websocket.onmessage = (event) => {
                    this.handleMessage(event);
                };
                
                this.websocket.onclose = (event) => {
                    console.log('🔌 WebSocket closed:', event.code, event.reason);
                    this.isConnected = false;
                    
                    if (event.code !== 1000) { // Not a normal closure
                        this.scheduleReconnect();
                    }
                };
                
                this.websocket.onerror = (error) => {
                    console.error('❌ WebSocket error:', error);
                    this.isConnected = false;
                    reject(error);
                };
                
                // Connection timeout
                setTimeout(() => {
                    if (!this.isConnected) {
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000);
                
            } catch (error) {
                reject(error);
            }
        });
    }

    subscribeToGritStreams() {
        const subscriptions = [
            'grit-index-realtime',
            'character-analysis',
            'micro-expressions',
            'clutch-performance',
            'leadership-metrics'
        ];
        
        subscriptions.forEach(stream => {
            this.sendMessage({
                type: 'subscribe',
                stream: stream,
                sessionId: this.sessionId,
                timestamp: Date.now()
            });
        });
        
        console.log('📡 Subscribed to', subscriptions.length, 'grit streams');
    }

    handleMessage(event) {
        try {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'grit-update':
                    this.processGritUpdate(data);
                    break;
                    
                case 'character-profile':
                    this.processCharacterProfile(data);
                    break;
                    
                case 'micro-expression':
                    this.processMicroExpression(data);
                    break;
                    
                case 'clutch-performance':
                    this.processClutchUpdate(data);
                    break;
                    
                case 'system-status':
                    this.processSystemStatus(data);
                    break;
                    
                case 'auth-response':
                    console.log('🔐 Authentication:', data.status);
                    break;
                    
                default:
                    console.log('📨 Unknown message type:', data.type);
            }
            
        } catch (error) {
            console.error('❌ Error parsing WebSocket message:', error);
        }
    }

    processGritUpdate(data) {
        const { playerId, playerName, team, gritScore, components, timestamp } = data;
        
        const gritData = {
            playerId,
            playerName,
            team,
            overall: parseFloat(gritScore),
            components: {
                mentalToughness: components.mentalToughness || 0,
                determinationIndex: components.determinationIndex || 0,
                resilienceScore: components.resilienceScore || 0,
                clutchPerformance: components.clutchPerformance || 0,
                leadershipQuotient: components.leadershipQuotient || 0
            },
            trend: this.calculateGritTrend(playerId, gritScore),
            confidence: data.confidence || 'Medium',
            timestamp: timestamp || Date.now()
        };
        
        this.gritCache.set(playerId, gritData);
        this.broadcastGritUpdate(gritData);
        
        console.log(`🎯 Grit Update: ${playerName} - ${gritScore}/100`);
    }

    processCharacterProfile(data) {
        const { playerId, profile } = data;
        
        const characterData = {
            playerId,
            traits: {
                leadership: profile.leadership || 0,
                resilience: profile.resilience || 0,
                determination: profile.determination || 0,
                teamwork: profile.teamwork || 0,
                adaptability: profile.adaptability || 0
            },
            bodyLanguageScore: profile.bodyLanguage || 0,
            vocalToneAnalysis: profile.vocalTone || 0,
            consistencyIndex: profile.consistency || 0,
            pressureResponse: profile.pressureResponse || 0,
            timestamp: data.timestamp || Date.now()
        };
        
        this.characterProfiles.set(playerId, characterData);
        this.broadcastCharacterUpdate(characterData);
        
        console.log(`👤 Character Profile: Player ${playerId} - Leadership: ${characterData.traits.leadership}`);
    }

    processMicroExpression(data) {
        const { playerId, expressions, situation, confidence } = data;
        
        const microData = {
            playerId,
            situation: situation || 'general',
            expressions: {
                determination: expressions.determination || 0,
                confidence: expressions.confidence || 0,
                focus: expressions.focus || 0,
                stress: expressions.stress || 0,
                resilience: expressions.resilience || 0
            },
            overallCharacterScore: this.calculateCharacterScore(expressions),
            analysisConfidence: confidence || 0.5,
            timestamp: data.timestamp || Date.now()
        };
        
        this.microExpressions.set(`${playerId}_${Date.now()}`, microData);
        this.broadcastMicroExpressionUpdate(microData);
        
        console.log(`🎭 Micro-Expression: Player ${playerId} - ${situation} - Character: ${microData.overallCharacterScore.toFixed(1)}`);
    }

    processClutchUpdate(data) {
        const clutchData = {
            playerId: data.playerId,
            situation: data.situation,
            pressure: data.pressure || 0,
            performance: data.performance || 0,
            clutchRating: data.clutchRating || 0,
            timestamp: data.timestamp || Date.now()
        };
        
        this.broadcastClutchUpdate(clutchData);
    }

    processSystemStatus(data) {
        const statusData = {
            activeStreams: data.activeStreams || 0,
            dataQuality: data.dataQuality || 0,
            latency: data.latency || 0,
            timestamp: data.timestamp || Date.now()
        };
        
        this.broadcastSystemStatus(statusData);
    }

    calculateGritTrend(playerId, currentScore) {
        const cached = this.gritCache.get(playerId);
        if (!cached) return 'stable';
        
        const diff = currentScore - cached.overall;
        if (diff > 2) return 'rising';
        if (diff < -2) return 'declining';
        return 'stable';
    }

    calculateCharacterScore(expressions) {
        const weights = {
            determination: 0.25,
            confidence: 0.20,
            focus: 0.20,
            resilience: 0.25,
            stress: -0.10 // Negative impact
        };
        
        let score = 0;
        for (const [trait, value] of Object.entries(expressions)) {
            if (weights[trait]) {
                score += value * weights[trait];
            }
        }
        
        return Math.max(0, Math.min(100, score));
    }

    broadcastGritUpdate(data) {
        const event = new CustomEvent('gritIndexUpdate', {
            detail: data
        });
        document.dispatchEvent(event);
    }

    broadcastCharacterUpdate(data) {
        const event = new CustomEvent('characterProfileUpdate', {
            detail: data
        });
        document.dispatchEvent(event);
    }

    broadcastMicroExpressionUpdate(data) {
        const event = new CustomEvent('microExpressionUpdate', {
            detail: data
        });
        document.dispatchEvent(event);
    }

    broadcastClutchUpdate(data) {
        const event = new CustomEvent('clutchPerformanceUpdate', {
            detail: data
        });
        document.dispatchEvent(event);
    }

    broadcastSystemStatus(data) {
        const event = new CustomEvent('gritSystemStatus', {
            detail: data
        });
        document.dispatchEvent(event);
    }

    sendMessage(message) {
        if (this.isConnected && this.websocket.readyState === WebSocket.OPEN) {
            this.websocket.send(JSON.stringify(message));
        } else {
            this.messageQueue.push(message);
        }
    }

    scheduleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.error('❌ Max reconnection attempts reached');
            return;
        }
        
        this.reconnectAttempts++;
        const delay = this.reconnectInterval * Math.pow(2, Math.min(this.reconnectAttempts - 1, 4));
        
        console.log(`🔄 Scheduling reconnect attempt ${this.reconnectAttempts} in ${delay}ms...`);
        
        setTimeout(() => {
            this.connect().catch(() => {
                this.scheduleReconnect();
            });
        }, delay);
    }

    setupEventListeners() {
        // Listen for page visibility changes
        document.addEventListener('visibilitychange', () => {
            if (document.visibilityState === 'visible' && !this.isConnected) {
                console.log('🔄 Page became visible, attempting reconnect...');
                this.connect().catch(() => this.scheduleReconnect());
            }
        });
        
        // Handle before page unload
        window.addEventListener('beforeunload', () => {
            this.disconnect();
        });
    }

    disconnect() {
        if (this.websocket) {
            console.log('🔌 Disconnecting WebSocket...');
            this.websocket.close(1000, 'Client disconnect');
            this.isConnected = false;
        }
    }

    generateSessionId() {
        return 'grit_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // Public API methods
    getGritScore(playerId) {
        return this.gritCache.get(playerId);
    }

    getCharacterProfile(playerId) {
        return this.characterProfiles.get(playerId);
    }

    getAllGritScores() {
        return Object.fromEntries(this.gritCache);
    }

    getStreamingStatus() {
        return {
            connected: this.isConnected,
            sessionId: this.sessionId,
            reconnectAttempts: this.reconnectAttempts,
            cacheSize: this.gritCache.size,
            lastUpdate: Math.max(...Array.from(this.gritCache.values()).map(g => g.timestamp), 0)
        };
    }
}

// Enhanced initialization with comprehensive error handling
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            window.gritIndexStreaming = new GritIndexStreaming({
                gatewayURL: 'wss://blaze-vision-ai-gateway.humphrey-austin20.workers.dev',
                reconnectInterval: 2000,
                maxReconnectAttempts: 15
            });
            
            // Add event listeners for real-time updates
            document.addEventListener('gritIndexUpdate', (event) => {
                console.log('🎯 Real-time Grit Update received:', event.detail);
                
                // Update UI elements if they exist
                const gritDisplay = document.querySelector('.grit-index-display');
                if (gritDisplay) {
                    gritDisplay.textContent = `${event.detail.overall}/100`;
                    gritDisplay.className = `grit-index-display trend-${event.detail.trend}`;
                }
            });
            
            document.addEventListener('characterProfileUpdate', (event) => {
                console.log('👤 Character Profile Update received:', event.detail);
            });
            
            document.addEventListener('microExpressionUpdate', (event) => {
                console.log('🎭 Micro-Expression Update received:', event.detail);
                
                // Update character indicators
                const characterScore = document.querySelector('.character-score');
                if (characterScore) {
                    characterScore.textContent = `${event.detail.overallCharacterScore.toFixed(1)}%`;
                }
            });
            
        } catch (error) {
            console.error('❌ Failed to initialize Grit Index Streaming:', error);
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = GritIndexStreaming;
}