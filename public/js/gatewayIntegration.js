// Gateway Integration for Blaze Intelligence
// Connects to live Cloudflare Worker gateway for real metrics and data

class BlazeGateway {
    constructor() {
        this.BASE = "https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev";
        this.statusUpdateInterval = null;
        this.websocket = null;
        this.sessionId = null;
        this.init();
    }

    init() {
        this.createStatusBar();
        this.startStatusUpdates();
        this.bindEvents();
    }

    // Helper functions for HTTP requests
    async json(url) {
        try {
            const response = await fetch(url);
            return response.ok ? await response.json() : null;
        } catch (error) {
            console.warn(`Gateway request failed: ${url}`, error);
            return null;
        }
    }

    async text(url) {
        try {
            const response = await fetch(url);
            return response.ok ? await response.text() : null;
        } catch (error) {
            console.warn(`Gateway request failed: ${url}`, error);
            return null;
        }
    }

    createStatusBar() {
        const statusBar = document.createElement('div');
        statusBar.className = 'status-bar';
        statusBar.innerHTML = `
            <div class="status-container">
                <div class="status-item">
                    <span class="status-icon">🟢</span>
                    <span id="sb-health">—</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Response:</span>
                    <span id="sb-p95">—ms</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Sessions:</span>
                    <span id="sb-sessions">—</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Ingest:</span>
                    <span id="sb-qps">— QPS</span>
                </div>
                <div class="status-item">
                    <span class="status-label">Grit Index:</span>
                    <span id="live-grit">—</span>
                </div>
            </div>
        `;

        // Insert status bar after navigation
        const nav = document.querySelector('nav');
        if (nav) {
            nav.parentNode.insertBefore(statusBar, nav.nextSibling);
        }
    }

    async loadStatus() {
        // Get health status
        const health = await this.text(`${this.BASE}/healthz`);
        const healthElement = document.getElementById('sb-health');
        const statusIcon = document.querySelector('.status-icon');
        
        if (health) {
            healthElement.textContent = health;
            statusIcon.textContent = '🟢';
            statusIcon.parentElement.classList.remove('status-error');
        } else {
            healthElement.textContent = 'Offline';
            statusIcon.textContent = '🔴';
            statusIcon.parentElement.classList.add('status-error');
        }

        // Get system stats
        const stats = await this.json(`${this.BASE}/vision/analytics/system/stats`);
        if (stats) {
            const p95Element = document.getElementById('sb-p95');
            const sessionsElement = document.getElementById('sb-sessions');
            const qpsElement = document.getElementById('sb-qps');

            p95Element.textContent = `${(stats.telemetry_p95_ms ?? 0).toFixed(0)}ms`;
            sessionsElement.textContent = `${stats.active_sessions ?? 0}`;
            qpsElement.textContent = `${(stats.ingest_qps ?? 0).toFixed(1)} QPS`;

            // Update proof bar with real metrics
            this.updateProofBar(stats);
        }
    }

    updateProofBar(stats) {
        const proofItems = document.querySelectorAll('.proof-item');
        if (proofItems.length >= 1) {
            // Update response time claim with real data
            const responseTime = stats.telemetry_p95_ms ?? 100;
            if (responseTime < 100) {
                proofItems[0].textContent = `Sub-${Math.ceil(responseTime)}ms responses`;
            }
        }
    }

    startStatusUpdates() {
        this.loadStatus(); // Initial load
        this.statusUpdateInterval = setInterval(() => this.loadStatus(), 5000);
    }

    stopStatusUpdates() {
        if (this.statusUpdateInterval) {
            clearInterval(this.statusUpdateInterval);
            this.statusUpdateInterval = null;
        }
    }

    // Real-time WebSocket streaming for Grit Index
    async startSession(playerId = "demo_player", sport = "baseball") {
        try {
            this.sessionId = "demo-" + Math.random().toString(36).slice(2, 8);
            
            const response = await fetch(`${this.BASE}/vision/sessions`, {
                method: "POST",
                headers: {
                    'Content-Type': 'application/json',
                    'X-Dev-Mode': 'true'
                },
                body: JSON.stringify({
                    session_id: this.sessionId,
                    player_id: playerId,
                    sport: sport
                })
            });

            if (response.ok) {
                this.connectWebSocket();
                this.startDemoFeed();
            }
        } catch (error) {
            console.warn("Failed to start session:", error);
        }
    }

    connectWebSocket() {
        if (this.websocket) {
            this.websocket.close();
        }

        const wsUrl = `${this.BASE.replace('https://', 'wss://')}/vision/session/${this.sessionId}/stream`;
        this.websocket = new WebSocket(wsUrl);

        this.websocket.onmessage = (event) => {
            try {
                const message = JSON.parse(event.data);
                if (message?.scores?.grit_index) {
                    const gritElement = document.getElementById('live-grit');
                    if (gritElement) {
                        gritElement.textContent = message.scores.grit_index.toFixed(2);
                    }
                }
            } catch (error) {
                console.warn("WebSocket message parse error:", error);
            }
        };

        this.websocket.onerror = (error) => {
            console.warn("WebSocket error:", error);
        };
    }

    sendTelemetry() {
        if (!this.sessionId) return;

        const payload = [{
            session_id: this.sessionId,
            t: Date.now(),
            device: {
                fps: 60,
                resolution: [1920, 1080],
                has_webgpu: true,
                has_webgl: true,
                camera_count: 1
            },
            // Add simulated pose/motion data for demo
            pose: {
                confidence: 0.85 + Math.random() * 0.15,
                keypoints: this.generateDemoKeypoints()
            }
        }];

        fetch(`${this.BASE}/vision/telemetry`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-Dev-Mode': 'true'
            },
            body: JSON.stringify(payload)
        }).catch(error => {
            console.warn("Telemetry send failed:", error);
        });
    }

    generateDemoKeypoints() {
        // Generate realistic demo keypoints for baseball batting stance
        return [
            { x: 0.5, y: 0.2, confidence: 0.9 }, // head
            { x: 0.45, y: 0.4, confidence: 0.85 }, // shoulder
            { x: 0.55, y: 0.4, confidence: 0.85 }, // shoulder
            { x: 0.4, y: 0.6, confidence: 0.8 }, // elbow
            { x: 0.6, y: 0.6, confidence: 0.8 }, // elbow
            { x: 0.35, y: 0.75, confidence: 0.75 }, // wrist
            { x: 0.65, y: 0.75, confidence: 0.75 }, // wrist
        ];
    }

    startDemoFeed() {
        // Send telemetry every second for demo
        setInterval(() => this.sendTelemetry(), 1000);
    }

    bindEvents() {
        // Initialize session when dashboard is viewed
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !this.sessionId) {
                    this.startSession();
                    observer.disconnect();
                }
            });
        });

        // Observe dashboard section
        setTimeout(() => {
            const dashboard = document.getElementById('dashboard');
            if (dashboard) {
                observer.observe(dashboard);
            }
        }, 1000);
    }

    cleanup() {
        this.stopStatusUpdates();
        if (this.websocket) {
            this.websocket.close();
        }
    }
}

// Initialize gateway integration
document.addEventListener('DOMContentLoaded', () => {
    window.blazeGateway = new BlazeGateway();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.blazeGateway) {
        window.blazeGateway.cleanup();
    }
});