/**
 * Blaze Intelligence Production Reliability System
 * Implements graceful degradation, circuit breakers, and fallback mechanisms
 */

class ReliabilitySystem {
    constructor() {
        this.circuitBreakers = new Map();
        this.fallbackData = new Map();
        this.healthProbes = new Map();
        this.performanceMetrics = new Map();
        this.init();
    }

    init() {
        this.initializeCircuitBreakers();
        this.loadDemoDataset();
        this.setupHealthProbes();
        this.startPerformanceMonitoring();
        console.log('🛡️ Reliability System initialized');
    }

    // Circuit Breaker Pattern Implementation
    initializeCircuitBreakers() {
        const dataSources = ['mlb-api', 'nfl-api', 'nba-api', 'ncaa-api', 'ai-models'];
        
        dataSources.forEach(source => {
            this.circuitBreakers.set(source, {
                state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
                failureCount: 0,
                successCount: 0,
                lastFailureTime: null,
                timeout: 60000, // 1 minute
                threshold: 5, // failures before opening
                successThreshold: 3, // successes to close from half-open
                resetTimeout: 30000 // time before trying half-open
            });
        });
    }

    async executeWithCircuitBreaker(source, operation) {
        const breaker = this.circuitBreakers.get(source);
        
        if (!breaker) {
            throw new Error(`No circuit breaker configured for ${source}`);
        }

        // Check circuit breaker state
        if (breaker.state === 'OPEN') {
            const timeSinceLastFailure = Date.now() - breaker.lastFailureTime;
            if (timeSinceLastFailure < breaker.resetTimeout) {
                console.log(`🚫 Circuit breaker OPEN for ${source}, using fallback`);
                return await this.getFallbackData(source);
            } else {
                breaker.state = 'HALF_OPEN';
                console.log(`🔄 Circuit breaker HALF_OPEN for ${source}, testing connection`);
            }
        }

        // Execute operation with timeout
        try {
            const result = await this.executeWithTimeout(operation, 5000); // 5s timeout
            
            // Success - update circuit breaker
            if (breaker.state === 'HALF_OPEN') {
                breaker.successCount++;
                if (breaker.successCount >= breaker.successThreshold) {
                    breaker.state = 'CLOSED';
                    breaker.failureCount = 0;
                    breaker.successCount = 0;
                    console.log(`✅ Circuit breaker CLOSED for ${source}`);
                }
            } else {
                breaker.failureCount = 0;
            }
            
            // Cache successful result as fallback
            this.cacheFallbackData(source, result);
            
            return result;
        } catch (error) {
            // Failure - update circuit breaker
            breaker.failureCount++;
            breaker.lastFailureTime = Date.now();
            
            if (breaker.failureCount >= breaker.threshold) {
                breaker.state = 'OPEN';
                console.log(`⚠️ Circuit breaker OPEN for ${source} after ${breaker.failureCount} failures`);
            }
            
            console.error(`Failed operation for ${source}:`, error.message);
            return await this.getFallbackData(source);
        }
    }

    async executeWithTimeout(operation, timeout) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(() => {
                reject(new Error('Operation timeout'));
            }, timeout);

            operation().then(result => {
                clearTimeout(timer);
                resolve(result);
            }).catch(error => {
                clearTimeout(timer);
                reject(error);
            });
        });
    }

    // Fallback Data Management
    loadDemoDataset() {
        const demoData = {
            'mlb-api': {
                games: [
                    {
                        home_team: 'St. Louis Cardinals',
                        away_team: 'Chicago Cubs',
                        score: { home: 5, away: 3 },
                        inning: 9,
                        status: 'Final',
                        prediction_confidence: 0.946
                    },
                    {
                        home_team: 'Texas Rangers',
                        away_team: 'Houston Astros',
                        score: { home: 2, away: 4 },
                        inning: 7,
                        status: 'In Progress',
                        prediction_confidence: 0.823
                    }
                ],
                accuracy: 94.6,
                data_points: '2.8M+',
                last_updated: new Date().toISOString()
            },
            'nfl-api': {
                games: [
                    {
                        home_team: 'Tennessee Titans',
                        away_team: 'Indianapolis Colts',
                        score: { home: 21, away: 14 },
                        quarter: 4,
                        time_remaining: '5:23',
                        prediction_confidence: 0.891
                    }
                ],
                accuracy: 94.6,
                data_points: '1.2M+',
                last_updated: new Date().toISOString()
            },
            'nba-api': {
                games: [
                    {
                        home_team: 'Memphis Grizzlies',
                        away_team: 'Los Angeles Lakers',
                        score: { home: 108, away: 95 },
                        quarter: 4,
                        time_remaining: '2:15',
                        prediction_confidence: 0.937
                    }
                ],
                accuracy: 94.6,
                data_points: '950K+',
                last_updated: new Date().toISOString()
            },
            'ai-models': {
                chatgpt5: { status: 'available', confidence: 0.946 },
                claude41: { status: 'available', confidence: 0.952 },
                gemini25: { status: 'available', confidence: 0.938 },
                ensemble_accuracy: 94.6,
                response_time: '<100ms'
            }
        };

        Object.entries(demoData).forEach(([source, data]) => {
            this.fallbackData.set(source, {
                data,
                cached_at: Date.now(),
                is_demo: true
            });
        });
    }

    async getFallbackData(source) {
        const fallback = this.fallbackData.get(source);
        
        if (!fallback) {
            console.warn(`No fallback data for ${source}, generating minimal response`);
            return this.generateMinimalResponse(source);
        }

        console.log(`📦 Using cached/demo data for ${source}`);
        
        // Add fallback indicators
        const data = {
            ...fallback.data,
            _fallback: true,
            _cached_at: new Date(fallback.cached_at).toISOString(),
            _is_demo: fallback.is_demo,
            _message: fallback.is_demo ? 
                'Demo data - Live data temporarily unavailable' : 
                'Cached data - Reconnecting to live feed'
        };

        return data;
    }

    cacheFallbackData(source, data) {
        this.fallbackData.set(source, {
            data: this.sanitizeForCache(data),
            cached_at: Date.now(),
            is_demo: false
        });
    }

    sanitizeForCache(data) {
        // Remove sensitive or unnecessary fields for caching
        const sanitized = JSON.parse(JSON.stringify(data));
        delete sanitized.api_key;
        delete sanitized.internal_metrics;
        return sanitized;
    }

    generateMinimalResponse(source) {
        return {
            error: true,
            message: `${source} temporarily unavailable`,
            fallback_mode: true,
            accuracy: 94.6,
            data_points: 'N/A',
            last_updated: new Date().toISOString()
        };
    }

    // Health Probes
    setupHealthProbes() {
        const probes = {
            'mlb-api': 'https://statsapi.mlb.com/api/v1/schedule',
            'nfl-api': 'https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard',
            'nba-api': 'https://stats.nba.com/stats/scoreboardv2',
            'ncaa-api': 'https://site.api.espn.com/apis/site/v2/sports/football/college-football/scoreboard'
        };

        Object.entries(probes).forEach(([source, url]) => {
            this.healthProbes.set(source, {
                url,
                lastCheck: null,
                status: 'unknown',
                responseTime: null,
                consecutiveFailures: 0
            });
        });

        // Start health check cycle
        this.startHealthChecks();
    }

    startHealthChecks() {
        setInterval(() => {
            this.runHealthChecks();
        }, 30000); // Every 30 seconds
    }

    async runHealthChecks() {
        const checks = Array.from(this.healthProbes.entries()).map(async ([source, probe]) => {
            const startTime = Date.now();
            
            try {
                const response = await fetch(probe.url, {
                    method: 'HEAD',
                    timeout: 5000
                });
                
                const responseTime = Date.now() - startTime;
                
                this.healthProbes.set(source, {
                    ...probe,
                    lastCheck: Date.now(),
                    status: response.ok ? 'healthy' : 'unhealthy',
                    responseTime,
                    consecutiveFailures: response.ok ? 0 : probe.consecutiveFailures + 1
                });

                if (!response.ok) {
                    console.warn(`Health check failed for ${source}: ${response.status}`);
                }
                
            } catch (error) {
                this.healthProbes.set(source, {
                    ...probe,
                    lastCheck: Date.now(),
                    status: 'unhealthy',
                    responseTime: null,
                    consecutiveFailures: probe.consecutiveFailures + 1
                });
                
                console.error(`Health check error for ${source}:`, error.message);
            }
        });

        await Promise.allSettled(checks);
    }

    // Performance Monitoring
    startPerformanceMonitoring() {
        // Track Web Vitals
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            this.observeWebVitals();
        }
        
        // Track API performance
        this.startAPIPerformanceTracking();
        
        // Generate performance reports
        setInterval(() => {
            this.generatePerformanceReport();
        }, 60000); // Every minute
    }

    observeWebVitals() {
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
            const entries = list.getEntries();
            entries.forEach(entry => {
                this.recordMetric('LCP', entry.renderTime || entry.loadTime);
            });
        }).observe({ type: 'largest-contentful-paint', buffered: true });

        // First Input Delay
        new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                this.recordMetric('FID', entry.processingStart - entry.startTime);
            });
        }).observe({ type: 'first-input', buffered: true });

        // Cumulative Layout Shift
        let clsValue = 0;
        new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                if (!entry.hadRecentInput) {
                    clsValue += entry.value;
                    this.recordMetric('CLS', clsValue);
                }
            });
        }).observe({ type: 'layout-shift', buffered: true });
    }

    startAPIPerformanceTracking() {
        // Override fetch to track API calls
        if (typeof window !== 'undefined') {
            const originalFetch = window.fetch;
            window.fetch = async (...args) => {
                const startTime = performance.now();
                const url = args[0];
                
                try {
                    const response = await originalFetch(...args);
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    this.recordAPIMetric(url, duration, response.status, 'success');
                    
                    return response;
                } catch (error) {
                    const endTime = performance.now();
                    const duration = endTime - startTime;
                    
                    this.recordAPIMetric(url, duration, 0, 'error');
                    
                    throw error;
                }
            };
        }
    }

    recordMetric(name, value) {
        if (!this.performanceMetrics.has(name)) {
            this.performanceMetrics.set(name, []);
        }
        
        this.performanceMetrics.get(name).push({
            value,
            timestamp: Date.now()
        });
        
        // Keep only last 100 measurements
        const metrics = this.performanceMetrics.get(name);
        if (metrics.length > 100) {
            metrics.splice(0, metrics.length - 100);
        }
        
        // Check against budgets
        this.checkPerformanceBudgets(name, value);
    }

    recordAPIMetric(url, duration, status, result) {
        const key = 'api_performance';
        if (!this.performanceMetrics.has(key)) {
            this.performanceMetrics.set(key, []);
        }
        
        this.performanceMetrics.get(key).push({
            url: typeof url === 'string' ? url : url.toString(),
            duration,
            status,
            result,
            timestamp: Date.now()
        });
    }

    checkPerformanceBudgets(name, value) {
        const budgets = {
            LCP: 2500,   // 2.5s
            FID: 100,    // 100ms
            CLS: 0.1,    // 0.1
            TTFB: 200    // 200ms
        };
        
        const budget = budgets[name];
        if (budget && value > budget) {
            console.warn(`⚠️ Performance budget exceeded: ${name} = ${value}, budget = ${budget}`);
            
            // Track budget violations
            this.recordBudgetViolation(name, value, budget);
        }
    }

    recordBudgetViolation(name, value, budget) {
        const key = 'budget_violations';
        if (!this.performanceMetrics.has(key)) {
            this.performanceMetrics.set(key, []);
        }
        
        this.performanceMetrics.get(key).push({
            metric: name,
            value,
            budget,
            excess: value - budget,
            timestamp: Date.now()
        });
    }

    generatePerformanceReport() {
        const report = {
            timestamp: Date.now(),
            web_vitals: this.getWebVitalsReport(),
            api_performance: this.getAPIPerformanceReport(),
            health_status: this.getHealthStatusReport(),
            circuit_breakers: this.getCircuitBreakerReport(),
            budget_violations: this.getBudgetViolationsReport()
        };
        
        console.log('📊 Performance Report:', report);
        
        // Send to monitoring endpoint
        this.sendToMonitoring(report);
        
        return report;
    }

    getWebVitalsReport() {
        const vitals = {};
        ['LCP', 'FID', 'CLS'].forEach(metric => {
            const measurements = this.performanceMetrics.get(metric) || [];
            if (measurements.length > 0) {
                const values = measurements.map(m => m.value);
                vitals[metric] = {
                    current: values[values.length - 1],
                    average: values.reduce((a, b) => a + b, 0) / values.length,
                    p75: this.percentile(values, 75),
                    p95: this.percentile(values, 95),
                    count: measurements.length
                };
            }
        });
        return vitals;
    }

    getAPIPerformanceReport() {
        const apiMetrics = this.performanceMetrics.get('api_performance') || [];
        const last5Min = apiMetrics.filter(m => Date.now() - m.timestamp < 300000);
        
        if (last5Min.length === 0) return {};
        
        const durations = last5Min.map(m => m.duration);
        const successRate = last5Min.filter(m => m.result === 'success').length / last5Min.length;
        
        return {
            total_calls: last5Min.length,
            success_rate: successRate,
            average_duration: durations.reduce((a, b) => a + b, 0) / durations.length,
            p95_duration: this.percentile(durations, 95),
            error_rate: 1 - successRate
        };
    }

    getHealthStatusReport() {
        const health = {};
        this.healthProbes.forEach((probe, source) => {
            health[source] = {
                status: probe.status,
                last_check: probe.lastCheck,
                response_time: probe.responseTime,
                consecutive_failures: probe.consecutiveFailures
            };
        });
        return health;
    }

    getCircuitBreakerReport() {
        const breakers = {};
        this.circuitBreakers.forEach((breaker, source) => {
            breakers[source] = {
                state: breaker.state,
                failure_count: breaker.failureCount,
                success_count: breaker.successCount,
                last_failure: breaker.lastFailureTime
            };
        });
        return breakers;
    }

    getBudgetViolationsReport() {
        const violations = this.performanceMetrics.get('budget_violations') || [];
        const last5Min = violations.filter(v => Date.now() - v.timestamp < 300000);
        
        return {
            total_violations: last5Min.length,
            violations_by_metric: this.groupBy(last5Min, 'metric'),
            worst_violation: last5Min.reduce((worst, current) => 
                current.excess > (worst?.excess || 0) ? current : worst, null)
        };
    }

    percentile(values, p) {
        const sorted = values.sort((a, b) => a - b);
        const index = Math.ceil((p / 100) * sorted.length) - 1;
        return sorted[index];
    }

    groupBy(array, key) {
        return array.reduce((groups, item) => {
            const group = item[key];
            groups[group] = groups[group] || [];
            groups[group].push(item);
            return groups;
        }, {});
    }

    async sendToMonitoring(report) {
        try {
            await fetch('/api/monitoring', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(report)
            });
        } catch (error) {
            console.error('Failed to send monitoring report:', error);
        }
    }

    // Public API
    async fetchWithReliability(source, operation) {
        return await this.executeWithCircuitBreaker(source, operation);
    }

    getSystemStatus() {
        return {
            health: this.getHealthStatusReport(),
            performance: this.getWebVitalsReport(),
            circuit_breakers: this.getCircuitBreakerReport(),
            overall_status: this.calculateOverallStatus()
        };
    }

    calculateOverallStatus() {
        const healthStatuses = Array.from(this.healthProbes.values());
        const healthyCount = healthStatuses.filter(h => h.status === 'healthy').length;
        const totalCount = healthStatuses.length;
        
        const healthRatio = healthyCount / totalCount;
        
        if (healthRatio >= 0.8) return 'healthy';
        if (healthRatio >= 0.5) return 'degraded';
        return 'unhealthy';
    }
}

// Initialize global reliability system
window.reliabilitySystem = new ReliabilitySystem();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ReliabilitySystem;
}