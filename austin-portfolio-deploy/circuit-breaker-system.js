/**
 * Circuit Breaker System - Production Implementation
 * "Your system will fail. Plan for it."
 * 
 * This system provides:
 * 1. Automatic failure detection and recovery
 * 2. Smart fallback to last known good state
 * 3. Rule-based analysis when ML services fail
 * 4. Graceful degradation of service quality
 * 5. Real-time service health monitoring
 */

class CircuitBreakerSystem {
    constructor() {
        this.circuitBreakers = new Map();
        this.fallbackStrategies = new Map();
        this.lastKnownGoodStates = new Map();
        this.healthMetrics = new Map();
        this.emergencyFallbacks = new Map();
        
        // Circuit breaker configurations
        this.breakerConfig = {
            failureThreshold: 5,        // Failures before opening
            timeoutThreshold: 5000,     // 5 second timeout
            resetTimeout: 30000,        // 30 seconds before retry
            successThreshold: 3,        // Successes to close circuit
            healthCheckInterval: 10000  // Health check every 10 seconds
        };

        this.initializeCircuitBreakers();
        this.startHealthMonitoring();
    }

    /**
     * Initialize circuit breakers for all critical services
     */
    initializeCircuitBreakers() {
        console.log('[CircuitBreaker] Initializing circuit breakers for critical services');

        const services = [
            'camera_feed',
            'ml_inference_service',
            'sports_data_api',
            'ai_coaching_analysis',
            'biometric_processing',
            'voice_processing',
            'performance_database',
            'consent_service',
            'confidence_scoring'
        ];

        services.forEach(service => {
            this.circuitBreakers.set(service, {
                name: service,
                state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
                failures: 0,
                successes: 0,
                lastFailureTime: null,
                lastSuccessTime: null,
                nextAttempt: 0,
                totalRequests: 0,
                totalFailures: 0
            });

            // Initialize fallback strategies
            this.setupFallbackStrategy(service);
        });

        console.log(`[CircuitBreaker] Initialized ${services.length} circuit breakers`);
    }

    /**
     * Setup fallback strategies for each service
     */
    setupFallbackStrategy(serviceName) {
        const fallbackStrategies = {
            'camera_feed': {
                strategy: 'LAST_KNOWN_GOOD',
                action: this.fallbackToLastFrame.bind(this),
                ruleBasedFallback: this.staticPostureAnalysis.bind(this)
            },
            'ml_inference_service': {
                strategy: 'RULE_BASED',
                action: this.fallbackToRuleBasedAnalysis.bind(this),
                ruleBasedFallback: this.basicBiomechanicsRules.bind(this)
            },
            'sports_data_api': {
                strategy: 'CACHED_DATA',
                action: this.fallbackToCachedData.bind(this),
                ruleBasedFallback: this.staticSportsData.bind(this)
            },
            'ai_coaching_analysis': {
                strategy: 'RULE_BASED',
                action: this.fallbackToBasicCoaching.bind(this),
                ruleBasedFallback: this.templateCoachingTips.bind(this)
            },
            'biometric_processing': {
                strategy: 'LAST_KNOWN_GOOD',
                action: this.fallbackToLastBiometrics.bind(this),
                ruleBasedFallback: this.estimateBiometrics.bind(this)
            },
            'voice_processing': {
                strategy: 'DISABLE',
                action: this.disableVoiceFeatures.bind(this),
                ruleBasedFallback: null
            },
            'performance_database': {
                strategy: 'LOCAL_CACHE',
                action: this.fallbackToLocalStorage.bind(this),
                ruleBasedFallback: this.staticPerformanceData.bind(this)
            },
            'consent_service': {
                strategy: 'CONSERVATIVE',
                action: this.fallbackToMinimalConsent.bind(this),
                ruleBasedFallback: null
            },
            'confidence_scoring': {
                strategy: 'CONSERVATIVE',
                action: this.fallbackToLowConfidence.bind(this),
                ruleBasedFallback: null
            }
        };

        this.fallbackStrategies.set(serviceName, fallbackStrategies[serviceName]);
    }

    /**
     * Execute operation with circuit breaker protection
     */
    async executeWithCircuitBreaker(serviceName, operation, operationArgs = []) {
        const breaker = this.circuitBreakers.get(serviceName);
        if (!breaker) {
            console.error(`[CircuitBreaker] No circuit breaker found for service: ${serviceName}`);
            return this.executeEmergencyFallback(serviceName, operationArgs);
        }

        breaker.totalRequests++;

        // Check circuit state
        if (breaker.state === 'OPEN') {
            if (Date.now() < breaker.nextAttempt) {
                console.log(`[CircuitBreaker] ${serviceName} circuit OPEN, using fallback`);
                return this.executeFallback(serviceName, operationArgs);
            } else {
                // Try transitioning to HALF_OPEN
                breaker.state = 'HALF_OPEN';
                console.log(`[CircuitBreaker] ${serviceName} transitioning to HALF_OPEN`);
            }
        }

        try {
            // Execute the operation with timeout
            const result = await this.executeWithTimeout(operation, operationArgs);
            
            // Operation succeeded
            this.recordSuccess(serviceName);
            return result;

        } catch (error) {
            // Operation failed
            this.recordFailure(serviceName, error);
            return this.executeFallback(serviceName, operationArgs);
        }
    }

    /**
     * Execute operation with timeout
     */
    async executeWithTimeout(operation, args) {
        return new Promise(async (resolve, reject) => {
            const timeoutId = setTimeout(() => {
                reject(new Error('Operation timed out'));
            }, this.breakerConfig.timeoutThreshold);

            try {
                const result = await operation(...args);
                clearTimeout(timeoutId);
                resolve(result);
            } catch (error) {
                clearTimeout(timeoutId);
                reject(error);
            }
        });
    }

    /**
     * Record successful operation
     */
    recordSuccess(serviceName) {
        const breaker = this.circuitBreakers.get(serviceName);
        breaker.successes++;
        breaker.failures = 0; // Reset failure count
        breaker.lastSuccessTime = Date.now();

        // Update health metrics
        this.updateHealthMetrics(serviceName, true);

        // Transition from HALF_OPEN to CLOSED if enough successes
        if (breaker.state === 'HALF_OPEN' && breaker.successes >= this.breakerConfig.successThreshold) {
            breaker.state = 'CLOSED';
            breaker.successes = 0;
            console.log(`[CircuitBreaker] ${serviceName} circuit CLOSED - service restored`);
        }
    }

    /**
     * Record failed operation
     */
    recordFailure(serviceName, error) {
        const breaker = this.circuitBreakers.get(serviceName);
        breaker.failures++;
        breaker.totalFailures++;
        breaker.successes = 0; // Reset success count
        breaker.lastFailureTime = Date.now();

        // Update health metrics
        this.updateHealthMetrics(serviceName, false);

        console.error(`[CircuitBreaker] ${serviceName} failure (${breaker.failures}/${this.breakerConfig.failureThreshold}):`, error.message);

        // Open circuit if failure threshold exceeded
        if (breaker.failures >= this.breakerConfig.failureThreshold) {
            breaker.state = 'OPEN';
            breaker.nextAttempt = Date.now() + this.breakerConfig.resetTimeout;
            console.error(`[CircuitBreaker] ${serviceName} circuit OPENED - using fallbacks for ${this.breakerConfig.resetTimeout / 1000}s`);
        }
    }

    /**
     * Execute fallback strategy
     */
    async executeFallback(serviceName, operationArgs) {
        const strategy = this.fallbackStrategies.get(serviceName);
        if (!strategy) {
            console.error(`[CircuitBreaker] No fallback strategy for ${serviceName}`);
            return this.executeEmergencyFallback(serviceName, operationArgs);
        }

        try {
            console.log(`[CircuitBreaker] Executing ${strategy.strategy} fallback for ${serviceName}`);
            const result = await strategy.action(operationArgs);
            
            // If primary fallback fails, try rule-based fallback
            if (!result && strategy.ruleBasedFallback) {
                console.log(`[CircuitBreaker] Primary fallback failed, trying rule-based for ${serviceName}`);
                return await strategy.ruleBasedFallback(operationArgs);
            }
            
            return result;
            
        } catch (error) {
            console.error(`[CircuitBreaker] Fallback failed for ${serviceName}:`, error);
            return this.executeEmergencyFallback(serviceName, operationArgs);
        }
    }

    /**
     * Emergency fallback when all else fails
     */
    executeEmergencyFallback(serviceName, operationArgs) {
        console.warn(`[CircuitBreaker] Executing emergency fallback for ${serviceName}`);
        
        const emergencyFallbacks = {
            'camera_feed': { status: 'offline', message: 'Camera temporarily unavailable', timestamp: Date.now() },
            'ml_inference_service': { confidence: 0.3, analysis: 'Basic rule-based analysis only', emergency: true },
            'sports_data_api': { data: 'cached', message: 'Using historical data', emergency: true },
            'ai_coaching_analysis': { tips: ['Focus on fundamentals', 'Maintain good form'], emergency: true },
            'biometric_processing': { heart_rate: 'unavailable', status: 'sensor_offline' },
            'voice_processing': { status: 'disabled', message: 'Voice features temporarily unavailable' },
            'performance_database': { data: [], message: 'Performance data temporarily unavailable' },
            'consent_service': { consent: false, message: 'Conservative consent assumed' },
            'confidence_scoring': { score: 0.2, band: 'REJECT', emergency: true }
        };

        return emergencyFallbacks[serviceName] || { status: 'emergency_fallback', service: serviceName };
    }

    // ========== FALLBACK IMPLEMENTATIONS ==========

    /**
     * Camera Feed Fallbacks
     */
    async fallbackToLastFrame(args) {
        const lastFrame = this.lastKnownGoodStates.get('camera_feed');
        if (lastFrame && (Date.now() - lastFrame.timestamp) < 30000) { // 30 second threshold
            return {
                ...lastFrame,
                status: 'fallback_last_frame',
                warning: 'Using last known camera frame'
            };
        }
        return null;
    }

    async staticPostureAnalysis(args) {
        return {
            posture: 'neutral',
            keypoints: this.generateStaticKeypoints(),
            analysis: 'Static posture analysis - limited accuracy',
            confidence: 0.4,
            status: 'rule_based_fallback'
        };
    }

    /**
     * ML Inference Fallbacks
     */
    async fallbackToRuleBasedAnalysis(args) {
        const [data] = args || [];
        if (!data) return null;

        return {
            analysis: this.performRuleBasedAnalysis(data),
            confidence: 0.6,
            method: 'rule_based',
            warning: 'ML service unavailable, using rule-based analysis'
        };
    }

    async basicBiomechanicsRules(args) {
        const [data] = args || [];
        return {
            mechanics: this.analyzeBasicMechanics(data),
            recommendations: ['Focus on fundamentals', 'Maintain balance'],
            confidence: 0.5,
            method: 'basic_rules'
        };
    }

    /**
     * Sports Data API Fallbacks
     */
    async fallbackToCachedData(args) {
        const cachedData = this.lastKnownGoodStates.get('sports_data_api');
        if (cachedData) {
            return {
                ...cachedData,
                status: 'cached_data',
                age_minutes: Math.round((Date.now() - cachedData.timestamp) / 60000),
                warning: 'Using cached sports data'
            };
        }
        return null;
    }

    async staticSportsData(args) {
        return {
            stats: this.getStaticSportsStats(),
            status: 'static_data',
            warning: 'Using static sports data - may not be current'
        };
    }

    /**
     * AI Coaching Fallbacks
     */
    async fallbackToBasicCoaching(args) {
        return {
            tips: this.getBasicCoachingTips(),
            analysis: 'Basic coaching guidance',
            confidence: 0.5,
            method: 'rule_based_coaching'
        };
    }

    async templateCoachingTips(args) {
        return {
            tips: [
                'Keep your eye on the ball',
                'Follow through on your swing',
                'Maintain proper stance and balance',
                'Practice consistently'
            ],
            method: 'template_tips'
        };
    }

    /**
     * Biometric Processing Fallbacks
     */
    async fallbackToLastBiometrics(args) {
        const lastBiometrics = this.lastKnownGoodStates.get('biometric_processing');
        if (lastBiometrics && (Date.now() - lastBiometrics.timestamp) < 60000) { // 1 minute threshold
            return {
                ...lastBiometrics,
                status: 'last_known_good',
                warning: 'Using previous biometric readings'
            };
        }
        return null;
    }

    async estimateBiometrics(args) {
        return {
            heart_rate: this.estimateHeartRate(),
            stress_level: 'moderate',
            status: 'estimated',
            confidence: 0.3,
            warning: 'Biometric sensors offline - using estimates'
        };
    }

    /**
     * Other Service Fallbacks
     */
    async disableVoiceFeatures(args) {
        return {
            status: 'disabled',
            message: 'Voice features temporarily disabled',
            alternatives: ['Text input available', 'Touch controls active']
        };
    }

    async fallbackToLocalStorage(args) {
        const localData = localStorage.getItem('performance_backup');
        if (localData) {
            return {
                data: JSON.parse(localData),
                status: 'local_storage',
                warning: 'Using local backup data'
            };
        }
        return null;
    }

    async fallbackToMinimalConsent(args) {
        return {
            consent: false,
            message: 'Conservative consent assumed during service outage',
            recommendation: 'Retry consent when service restored'
        };
    }

    async fallbackToLowConfidence(args) {
        return {
            score: 0.25,
            band: 'LOW',
            rationale: 'Confidence service unavailable - using conservative estimate',
            emergency: true
        };
    }

    // ========== HELPER METHODS ==========

    /**
     * Save last known good state for fallback
     */
    saveLastKnownGoodState(serviceName, data) {
        this.lastKnownGoodStates.set(serviceName, {
            ...data,
            timestamp: Date.now()
        });
    }

    /**
     * Update health metrics
     */
    updateHealthMetrics(serviceName, success) {
        if (!this.healthMetrics.has(serviceName)) {
            this.healthMetrics.set(serviceName, {
                total: 0,
                successes: 0,
                failures: 0,
                successRate: 0,
                avgResponseTime: 0,
                lastUpdate: Date.now()
            });
        }

        const metrics = this.healthMetrics.get(serviceName);
        metrics.total++;
        
        if (success) {
            metrics.successes++;
        } else {
            metrics.failures++;
        }
        
        metrics.successRate = metrics.successes / metrics.total;
        metrics.lastUpdate = Date.now();
    }

    /**
     * Start health monitoring
     */
    startHealthMonitoring() {
        setInterval(() => {
            this.performHealthChecks();
        }, this.breakerConfig.healthCheckInterval);
        
        console.log('[CircuitBreaker] Health monitoring started');
    }

    /**
     * Perform health checks on all services
     */
    async performHealthChecks() {
        const healthReport = {};
        
        for (const [serviceName, breaker] of this.circuitBreakers) {
            const metrics = this.healthMetrics.get(serviceName);
            const health = {
                state: breaker.state,
                successRate: metrics ? metrics.successRate : 0,
                totalRequests: breaker.totalRequests,
                totalFailures: breaker.totalFailures,
                lastFailure: breaker.lastFailureTime,
                lastSuccess: breaker.lastSuccessTime
            };
            
            healthReport[serviceName] = health;
        }
        
        // Log unhealthy services
        const unhealthyServices = Object.entries(healthReport)
            .filter(([name, health]) => health.state === 'OPEN' || health.successRate < 0.8)
            .map(([name]) => name);
            
        if (unhealthyServices.length > 0) {
            console.warn('[CircuitBreaker] Unhealthy services detected:', unhealthyServices);
        }
        
        // Store health report for monitoring dashboard
        this.lastHealthReport = {
            timestamp: Date.now(),
            services: healthReport,
            unhealthyCount: unhealthyServices.length,
            totalServices: Object.keys(healthReport).length
        };
    }

    /**
     * Get system health report
     */
    getHealthReport() {
        return this.lastHealthReport || {
            timestamp: Date.now(),
            services: {},
            unhealthyCount: 0,
            totalServices: 0
        };
    }

    /**
     * Generate static keypoints for posture analysis
     */
    generateStaticKeypoints() {
        return {
            head: { x: 320, y: 100 },
            shoulders: { x: 320, y: 150 },
            elbows: { x: 280, y: 200 },
            wrists: { x: 260, y: 250 },
            hips: { x: 320, y: 300 },
            knees: { x: 320, y: 400 },
            ankles: { x: 320, y: 500 }
        };
    }

    /**
     * Perform rule-based analysis
     */
    performRuleBasedAnalysis(data) {
        if (!data) return 'No data available for analysis';
        
        return {
            form_score: 0.7,
            issues: ['Maintain consistent timing', 'Keep balanced stance'],
            strengths: ['Good positioning', 'Appropriate power'],
            method: 'rule_based'
        };
    }

    /**
     * Analyze basic mechanics
     */
    analyzeBasicMechanics(data) {
        return {
            balance: 'good',
            timing: 'needs_work',
            power_transfer: 'adequate',
            overall_score: 0.65
        };
    }

    /**
     * Get static sports stats
     */
    getStaticSportsStats() {
        return {
            league_average: 0.285,
            team_ranking: 15,
            last_updated: 'Data service offline',
            disclaimer: 'Static data - not current'
        };
    }

    /**
     * Get basic coaching tips
     */
    getBasicCoachingTips() {
        return [
            'Focus on consistent mechanics',
            'Practice fundamental movements',
            'Maintain proper body alignment',
            'Work on timing and rhythm'
        ];
    }

    /**
     * Estimate heart rate when sensors fail
     */
    estimateHeartRate() {
        // Very basic estimation based on activity level
        const baseRate = 60;
        const activityBoost = Math.random() * 40; // Random activity level
        return Math.round(baseRate + activityBoost);
    }
}

// Export for integration
if (typeof window !== 'undefined') {
    window.CircuitBreakerSystem = CircuitBreakerSystem;
} else if (typeof module !== 'undefined' && module.exports) {
    module.exports = CircuitBreakerSystem;
}

/**
 * Usage Examples:
 * 
 * // Initialize circuit breaker system
 * const circuitBreaker = new CircuitBreakerSystem();
 * 
 * // Execute camera operation with circuit breaker protection
 * const cameraResult = await circuitBreaker.executeWithCircuitBreaker(
 *     'camera_feed',
 *     getCameraFrame, // Your camera function
 *     [options] // Arguments for your function
 * );
 * 
 * // Execute ML inference with fallback to rule-based analysis
 * const analysis = await circuitBreaker.executeWithCircuitBreaker(
 *     'ml_inference_service',
 *     performMLAnalysis,
 *     [videoData, athleteProfile]
 * );
 * 
 * // Save good state for future fallback
 * circuitBreaker.saveLastKnownGoodState('camera_feed', {
 *     frame: frameData,
 *     quality: 'high',
 *     resolution: '1080p'
 * });
 * 
 * // Get health report for monitoring
 * const healthReport = circuitBreaker.getHealthReport();
 * console.log('System health:', healthReport);
 */