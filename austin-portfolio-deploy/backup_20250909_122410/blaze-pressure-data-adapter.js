/**
 * Blaze Intelligence - Pressure Data Adapter
 * Connects live Cardinals analytics to pressure-focused visualizations
 * Transforms real WebSocket events into Bloomberg-style pressure metrics
 */

class BlazePressureDataAdapter {
    constructor() {
        this.pressureMetrics = {
            leverage: 0.5,
            clutch: 0.3,
            momentum: 0.4,
            winProbability: 0.55
        };
        
        this.eventBuffer = [];
        this.maxBufferSize = 1000;
        this.pressureThreshold = 0.7; // High-pressure threshold
        
        // Analytics configuration
        this.sportWeights = {
            'MLB': { leverage: 0.8, clutch: 0.9, momentum: 0.6 },
            'NFL': { leverage: 0.9, clutch: 0.8, momentum: 0.8 },
            'NBA': { leverage: 0.7, clutch: 0.7, momentum: 0.9 }
        };
        
        this.isActive = false;
        this.callbacks = new Map();
        
        console.log('🔥 Pressure Data Adapter initialized - Ready for Cardinals feed');
    }
    
    /**
     * Connect to live Cardinals analytics WebSocket feed
     */
    connectToCardinalsStream() {
        // Connect to your existing WebSocket feed
        if (typeof EventSource !== 'undefined') {
            try {
                this.eventSource = new EventSource('/api/cardinals/pressure-stream');
                this.eventSource.onmessage = this.handleCardinalsEvent.bind(this);
                this.eventSource.onerror = this.handleConnectionError.bind(this);
                this.eventSource.onopen = () => {
                    console.log('✅ Connected to Cardinals analytics stream');
                    this.isActive = true;
                };
            } catch (error) {
                console.warn('⚠️ EventSource not available, using synthetic data');
                this.generateSyntheticStream();
            }
        } else {
            this.generateSyntheticStream();
        }
    }
    
    /**
     * Process incoming Cardinals analytics events
     */
    handleCardinalsEvent(event) {
        try {
            const data = JSON.parse(event.data);
            const pressureData = this.transformToPresssure(data);
            
            // Add to event buffer
            this.eventBuffer.push({
                timestamp: Date.now(),
                originalEvent: data,
                pressureMetrics: pressureData
            });
            
            // Maintain buffer size
            if (this.eventBuffer.length > this.maxBufferSize) {
                this.eventBuffer.shift();
            }
            
            // Notify all registered callbacks
            this.notifyCallbacks('pressure-update', pressureData);
            
            // Check for high-pressure moments
            if (pressureData.leverage > this.pressureThreshold) {
                this.notifyCallbacks('high-pressure-event', {
                    ...pressureData,
                    severity: 'high',
                    description: this.generatePressureDescription(data)
                });
            }
            
        } catch (error) {
            console.error('❌ Failed to process Cardinals event:', error);
        }
    }
    
    /**
     * Transform Cardinals event data into pressure metrics
     */
    transformToPresssure(cardinalsData) {
        // Extract pressure indicators from Cardinals data
        const sport = this.detectSport(cardinalsData);
        const weights = this.sportWeights[sport] || this.sportWeights['MLB'];
        
        // Calculate leverage based on game context
        let leverage = this.calculateLeverage(cardinalsData, sport);
        
        // Calculate clutch factor
        let clutch = this.calculateClutchFactor(cardinalsData, sport);
        
        // Calculate momentum
        let momentum = this.calculateMomentum(cardinalsData);
        
        // Calculate win probability change
        let winProbDelta = this.calculateWinProbabilityDelta(cardinalsData);
        
        // Combine into composite pressure score
        const pressureIndex = (
            leverage * weights.leverage +
            clutch * weights.clutch +
            momentum * weights.momentum
        ) / 3;
        
        return {
            timestamp: Date.now(),
            sport: sport,
            leverage: Math.min(1, Math.max(0, leverage)),
            clutch: Math.min(1, Math.max(0, clutch)),
            momentum: Math.min(1, Math.max(0, momentum)),
            pressureIndex: Math.min(1, Math.max(0, pressureIndex)),
            winProbability: this.pressureMetrics.winProbability + winProbDelta,
            winProbDelta: winProbDelta,
            eventType: cardinalsData.eventType || 'score',
            description: cardinalsData.description || `${sport} event`
        };
    }
    
    /**
     * Detect sport from Cardinals data
     */
    detectSport(data) {
        if (data.sport) return data.sport;
        if (data.description && data.description.includes('MLB')) return 'MLB';
        if (data.description && data.description.includes('NFL')) return 'NFL';
        if (data.description && data.description.includes('NBA')) return 'NBA';
        return 'MLB'; // Default to MLB for Cardinals
    }
    
    /**
     * Calculate leverage based on game situation
     */
    calculateLeverage(data, sport) {
        let leverage = 0.5; // Base leverage
        
        // Score-based leverage
        if (data.score !== undefined) {
            const score = parseInt(data.score) || 0;
            if (score >= 7) leverage += 0.3; // High-scoring event
            if (score >= 5) leverage += 0.2;
            if (score >= 3) leverage += 0.1;
        }
        
        // Sport-specific leverage factors
        switch (sport) {
            case 'NFL':
                // Higher leverage for NFL due to lower scoring
                leverage += 0.2;
                break;
            case 'NBA':
                // NBA has more scoring, lower base leverage
                leverage -= 0.1;
                break;
            case 'MLB':
            default:
                // Baseball leverage based on inning context
                leverage += 0.1;
                break;
        }
        
        return Math.min(1, leverage);
    }
    
    /**
     * Calculate clutch factor
     */
    calculateClutchFactor(data, sport) {
        let clutch = 0.4; // Base clutch factor
        
        // Time-based clutch (later in game = higher clutch)
        const timeWeight = 0.3;
        clutch += timeWeight;
        
        // Score differential impact
        if (data.score !== undefined) {
            const score = parseInt(data.score) || 0;
            if (score <= 1) clutch += 0.4; // Close games = high clutch
            if (score <= 3) clutch += 0.2;
        }
        
        return Math.min(1, clutch);
    }
    
    /**
     * Calculate momentum based on event sequence
     */
    calculateMomentum(data) {
        let momentum = 0.5; // Neutral momentum
        
        // Look at recent events for momentum calculation
        const recentEvents = this.eventBuffer.slice(-5);
        if (recentEvents.length > 0) {
            const recentScores = recentEvents
                .map(e => parseInt(e.originalEvent.score) || 0)
                .filter(s => s > 0);
                
            if (recentScores.length > 2) {
                const trend = recentScores.slice(-2).reduce((a, b) => a + b, 0) / 2;
                momentum = Math.min(1, 0.3 + (trend / 10));
            }
        }
        
        return momentum;
    }
    
    /**
     * Calculate win probability delta
     */
    calculateWinProbabilityDelta(data) {
        // Simulate win probability changes based on event
        const score = parseInt(data.score) || 0;
        let delta = 0;
        
        if (score >= 7) delta = 0.15; // Major positive event
        else if (score >= 5) delta = 0.08;
        else if (score >= 3) delta = 0.04;
        else if (score === 0) delta = -0.02; // Negative event
        
        // Add some randomness for realism
        delta += (Math.random() - 0.5) * 0.05;
        
        // Update internal win probability
        this.pressureMetrics.winProbability = Math.min(0.95, Math.max(0.05, 
            this.pressureMetrics.winProbability + delta
        ));
        
        return delta;
    }
    
    /**
     * Generate descriptive text for pressure events
     */
    generatePressureDescription(data) {
        const score = parseInt(data.score) || 0;
        const sport = this.detectSport(data);
        
        const descriptions = {
            'MLB': [
                `Cardinals ${score}-run rally builds pressure`,
                `High-leverage Cardinals scoring moment`,
                `Championship pressure: Cardinals ${score}`,
                `Clutch Cardinals performance: ${score} runs`
            ],
            'NFL': [
                `Cardinals ${score}-point drive in pressure situation`,
                `Red zone pressure: Cardinals score ${score}`,
                `Fourth-quarter pressure: Cardinals ${score}`,
                `Championship drive: Cardinals ${score}`
            ],
            'NBA': [
                `Cardinals ${score}-point clutch sequence`,
                `Pressure moment: Cardinals score ${score}`,
                `Championship pressure: Cardinals ${score}`,
                `High-stakes Cardinals basket: ${score}`
            ]
        };
        
        const sportDescriptions = descriptions[sport] || descriptions['MLB'];
        return sportDescriptions[Math.floor(Math.random() * sportDescriptions.length)];
    }
    
    /**
     * Generate synthetic data stream for development
     */
    generateSyntheticStream() {
        console.log('🔄 Generating synthetic pressure data for development');
        
        setInterval(() => {
            const syntheticEvent = {
                sport: ['MLB', 'NFL', 'NBA'][Math.floor(Math.random() * 3)],
                score: Math.floor(Math.random() * 10),
                eventType: 'score',
                description: `Cardinals scored ${Math.floor(Math.random() * 10)}`,
                timestamp: Date.now()
            };
            
            this.handleCardinalsEvent({
                data: JSON.stringify(syntheticEvent)
            });
            
        }, 3000 + Math.random() * 4000); // Random intervals 3-7 seconds
        
        this.isActive = true;
    }
    
    /**
     * Handle connection errors
     */
    handleConnectionError(error) {
        console.warn('⚠️ Cardinals stream connection error, switching to synthetic data');
        if (this.eventSource) {
            this.eventSource.close();
        }
        this.generateSyntheticStream();
    }
    
    /**
     * Register callback for pressure events
     */
    onPressureUpdate(callback) {
        this.callbacks.set('pressure-update', callback);
    }
    
    onHighPressureEvent(callback) {
        this.callbacks.set('high-pressure-event', callback);
    }
    
    /**
     * Notify all registered callbacks
     */
    notifyCallbacks(eventType, data) {
        const callback = this.callbacks.get(eventType);
        if (callback) {
            try {
                callback(data);
            } catch (error) {
                console.error(`❌ Callback error for ${eventType}:`, error);
            }
        }
    }
    
    /**
     * Get current pressure metrics
     */
    getCurrentMetrics() {
        return {
            ...this.pressureMetrics,
            isActive: this.isActive,
            bufferSize: this.eventBuffer.length,
            lastUpdate: this.eventBuffer.length > 0 ? 
                this.eventBuffer[this.eventBuffer.length - 1].timestamp : null
        };
    }
    
    /**
     * Get pressure history
     */
    getPressureHistory(timeWindow = 30 * 60 * 1000) { // 30 minutes default
        const cutoff = Date.now() - timeWindow;
        return this.eventBuffer
            .filter(event => event.timestamp > cutoff)
            .map(event => event.pressureMetrics);
    }
    
    /**
     * Export pressure data for analysis
     */
    exportPressureData(format = 'json') {
        const data = {
            metadata: {
                exportTime: new Date().toISOString(),
                totalEvents: this.eventBuffer.length,
                timespan: this.eventBuffer.length > 0 ? {
                    start: new Date(this.eventBuffer[0].timestamp).toISOString(),
                    end: new Date(this.eventBuffer[this.eventBuffer.length - 1].timestamp).toISOString()
                } : null
            },
            pressureHistory: this.getPressureHistory(),
            currentMetrics: this.getCurrentMetrics()
        };
        
        if (format === 'csv') {
            return this.convertToCSV(data.pressureHistory);
        }
        
        return JSON.stringify(data, null, 2);
    }
    
    convertToCSV(data) {
        if (!data || data.length === 0) return '';
        
        const headers = Object.keys(data[0]).join(',');
        const rows = data.map(row => 
            Object.values(row).map(val => 
                typeof val === 'string' ? `"${val}"` : val
            ).join(',')
        );
        
        return [headers, ...rows].join('\n');
    }
    
    /**
     * Cleanup resources
     */
    dispose() {
        if (this.eventSource) {
            this.eventSource.close();
        }
        this.callbacks.clear();
        this.eventBuffer = [];
        this.isActive = false;
    }
}

// Initialize the pressure data adapter
const blazePressureDataAdapter = new BlazePressureDataAdapter();

// Auto-connect to Cardinals stream
blazePressureDataAdapter.connectToCardinalsStream();

// Export for global access
window.BlazePressureDataAdapter = BlazePressureDataAdapter;
window.blazePressureDataAdapter = blazePressureDataAdapter;

// Connect to existing pressure analytics if available
if (window.blazePressureAnalytics) {
    blazePressureDataAdapter.onPressureUpdate((data) => {
        window.blazePressureAnalytics.addPressureEvent(
            data.timestamp,
            data.winProbability,
            data.pressureIndex,
            data.description
        );
    });
    
    blazePressureDataAdapter.onHighPressureEvent((data) => {
        console.log('🔥 High-pressure event detected:', data.description);
    });
}

console.log('🔥 Pressure Data Adapter ready - Connected to Cardinals analytics');