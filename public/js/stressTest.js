// Client-side Stress Testing and Load Simulation
class StressTestRunner {
    constructor() {
        this.BASE = "https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev";
        this.results = {
            gateway: [],
            websockets: [],
            apis: []
        };
    }

    // Test gateway health endpoint under load
    async testGatewayHealth(concurrent = 10, duration = 30000) {
        console.log(`🚀 Starting gateway health stress test: ${concurrent} concurrent requests for ${duration/1000}s`);
        
        const startTime = Date.now();
        const promises = [];

        for (let i = 0; i < concurrent; i++) {
            promises.push(this.continuousHealthCheck(startTime + duration));
        }

        await Promise.all(promises);
        this.analyzeResults('gateway');
    }

    async continuousHealthCheck(endTime) {
        while (Date.now() < endTime) {
            const startRequest = performance.now();
            try {
                const response = await fetch(`${this.BASE}/healthz`);
                const endRequest = performance.now();
                
                this.results.gateway.push({
                    latency: endRequest - startRequest,
                    status: response.status,
                    success: response.ok,
                    timestamp: Date.now()
                });
            } catch (error) {
                this.results.gateway.push({
                    latency: null,
                    status: 'error',
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
            
            // Wait 100ms between requests
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    // Test WebSocket connections under load
    async testWebSocketStress(concurrent = 5, duration = 30000) {
        console.log(`🔌 Starting WebSocket stress test: ${concurrent} concurrent connections for ${duration/1000}s`);
        
        const promises = [];
        for (let i = 0; i < concurrent; i++) {
            promises.push(this.createStressWebSocket(i, duration));
        }
        
        await Promise.all(promises);
        this.analyzeResults('websockets');
    }

    async createStressWebSocket(id, duration) {
        // Create session first
        const sessionId = `stress-${id}-${Date.now()}`;
        
        try {
            await fetch(`${this.BASE}/vision/sessions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Dev-Mode': 'true'
                },
                body: JSON.stringify({
                    session_id: sessionId,
                    player_id: `stress_player_${id}`,
                    sport: 'baseball'
                })
            });

            const wsUrl = `${this.BASE.replace('https://', 'wss://')}/vision/session/${sessionId}/stream`;
            const ws = new WebSocket(wsUrl);
            const startTime = Date.now();
            let messageCount = 0;
            let errorCount = 0;

            ws.onopen = () => {
                this.results.websockets.push({
                    event: 'connection_opened',
                    sessionId,
                    latency: Date.now() - startTime,
                    timestamp: Date.now()
                });
            };

            ws.onmessage = () => {
                messageCount++;
            };

            ws.onerror = () => {
                errorCount++;
            };

            // Send telemetry periodically
            const telemetryInterval = setInterval(() => {
                if (ws.readyState === WebSocket.OPEN) {
                    this.sendStressTelemetry(sessionId);
                }
            }, 1000);

            // Close after duration
            setTimeout(() => {
                clearInterval(telemetryInterval);
                ws.close();
                
                this.results.websockets.push({
                    event: 'connection_summary',
                    sessionId,
                    duration: Date.now() - startTime,
                    messageCount,
                    errorCount,
                    timestamp: Date.now()
                });
            }, duration);

        } catch (error) {
            this.results.websockets.push({
                event: 'connection_failed',
                sessionId,
                error: error.message,
                timestamp: Date.now()
            });
        }
    }

    async sendStressTelemetry(sessionId) {
        try {
            await fetch(`${this.BASE}/vision/telemetry`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Dev-Mode': 'true'
                },
                body: JSON.stringify([{
                    session_id: sessionId,
                    t: Date.now(),
                    device: {
                        fps: 60,
                        resolution: [1920, 1080],
                        has_webgpu: true,
                        has_webgl: true,
                        camera_count: 1
                    },
                    stress_test: true
                }])
            });
        } catch (error) {
            // Silently fail during stress test
        }
    }

    // Test API endpoints
    async testAPIStress() {
        console.log('📊 Starting API endpoint stress test');
        
        const endpoints = [
            '/proxy/mlb/teams',
            '/metrics',
            '/healthz'
        ];

        const promises = [];
        for (const endpoint of endpoints) {
            promises.push(this.testEndpointLoad(endpoint, 20));
        }

        await Promise.all(promises);
        this.analyzeResults('apis');
    }

    async testEndpointLoad(endpoint, requestCount) {
        const results = [];
        
        for (let i = 0; i < requestCount; i++) {
            const startTime = performance.now();
            try {
                const response = await fetch(endpoint);
                const endTime = performance.now();
                
                results.push({
                    endpoint,
                    latency: endTime - startTime,
                    status: response.status,
                    success: response.ok,
                    timestamp: Date.now()
                });
            } catch (error) {
                results.push({
                    endpoint,
                    latency: null,
                    status: 'error',
                    success: false,
                    error: error.message,
                    timestamp: Date.now()
                });
            }
            
            // Small delay between requests
            await new Promise(resolve => setTimeout(resolve, 50));
        }
        
        this.results.apis.push(...results);
    }

    analyzeResults(category) {
        const data = this.results[category];
        if (!data.length) return;

        const successful = data.filter(r => r.success !== false);
        const failed = data.filter(r => r.success === false);
        const latencies = successful.map(r => r.latency).filter(l => l !== null);

        const stats = {
            total: data.length,
            successful: successful.length,
            failed: failed.length,
            successRate: (successful.length / data.length * 100).toFixed(2),
            avgLatency: latencies.length ? (latencies.reduce((a, b) => a + b, 0) / latencies.length).toFixed(2) : 'N/A',
            p95Latency: latencies.length ? this.calculatePercentile(latencies, 0.95).toFixed(2) : 'N/A',
            p99Latency: latencies.length ? this.calculatePercentile(latencies, 0.99).toFixed(2) : 'N/A'
        };

        console.log(`📈 ${category.toUpperCase()} Results:`, stats);
        return stats;
    }

    calculatePercentile(values, percentile) {
        const sorted = values.slice().sort((a, b) => a - b);
        const index = Math.ceil(sorted.length * percentile) - 1;
        return sorted[index];
    }

    // Run full stress test suite
    async runFullSuite() {
        console.log('🚀 Starting comprehensive stress test suite...');
        
        try {
            await this.testGatewayHealth(10, 30000);
            await new Promise(resolve => setTimeout(resolve, 2000)); // Brief pause
            
            await this.testWebSocketStress(5, 20000);
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await this.testAPIStress();
            
            console.log('✅ Stress test suite completed');
            return this.generateReport();
        } catch (error) {
            console.error('❌ Stress test suite failed:', error);
            throw error;
        }
    }

    generateReport() {
        const report = {
            timestamp: new Date().toISOString(),
            gateway: this.analyzeResults('gateway'),
            websockets: this.analyzeResults('websockets'),
            apis: this.analyzeResults('apis'),
            summary: {
                totalRequests: Object.values(this.results).flat().length,
                duration: '2+ minutes',
                status: 'completed'
            }
        };

        // Store report locally
        localStorage.setItem('stress_test_report', JSON.stringify(report));
        console.log('📊 Full stress test report:', report);
        
        return report;
    }
}

// Expose stress test runner globally for manual testing
window.StressTestRunner = StressTestRunner;

// Auto-run light stress test on page load (disabled by default)
document.addEventListener('DOMContentLoaded', () => {
    if (localStorage.getItem('enable_auto_stress_test') === 'true') {
        setTimeout(async () => {
            const runner = new StressTestRunner();
            await runner.testGatewayHealth(3, 10000); // Light test
        }, 5000);
    }
});