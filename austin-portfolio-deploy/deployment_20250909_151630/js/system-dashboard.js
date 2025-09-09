/**
 * Blaze Intelligence System Dashboard
 * Real-time monitoring of system health, errors, and circuit breaker status
 */

class BlazeSystemDashboard {
    constructor() {
        this.isVisible = false;
        this.updateInterval = 5000; // 5 seconds
        this.updateTimer = null;
        this.errorHandler = null;
        this.apiWrapper = null;
        
        this.init();
    }

    init() {
        console.log('📊 Initializing System Dashboard...');
        this.createDashboard();
        this.setupEventListeners();
        this.waitForDependencies();
        console.log('✅ System Dashboard initialized');
    }

    async waitForDependencies() {
        const checkDependencies = () => {
            if (window.blazeErrorHandler && window.blazeAPIWrapper) {
                this.errorHandler = window.blazeErrorHandler;
                this.apiWrapper = window.blazeAPIWrapper;
                this.startAutoUpdate();
            } else {
                setTimeout(checkDependencies, 100);
            }
        };
        checkDependencies();
    }

    createDashboard() {
        // Create dashboard container
        const dashboard = document.createElement('div');
        dashboard.id = 'blaze-system-dashboard';
        dashboard.className = 'system-dashboard hidden';
        dashboard.innerHTML = `
            <div class="dashboard-header">
                <h3>🔧 System Dashboard</h3>
                <div class="dashboard-controls">
                    <button class="refresh-btn" title="Refresh Data">🔄</button>
                    <button class="close-btn" title="Close Dashboard">✕</button>
                </div>
            </div>
            
            <div class="dashboard-content">
                <div class="dashboard-section">
                    <h4>🛡️ Circuit Breakers</h4>
                    <div class="circuit-breaker-grid" id="circuit-breakers">
                        <!-- Circuit breaker status will be inserted here -->
                    </div>
                </div>
                
                <div class="dashboard-section">
                    <h4>📊 Error Statistics</h4>
                    <div class="error-stats" id="error-stats">
                        <!-- Error statistics will be inserted here -->
                    </div>
                </div>
                
                <div class="dashboard-section">
                    <h4>🌐 API Health</h4>
                    <div class="api-health" id="api-health">
                        <!-- API health status will be inserted here -->
                    </div>
                </div>
                
                <div class="dashboard-section">
                    <h4>📈 System Metrics</h4>
                    <div class="system-metrics" id="system-metrics">
                        <!-- System metrics will be inserted here -->
                    </div>
                </div>
            </div>
        `;

        this.addStyles();
        document.body.appendChild(dashboard);
        
        // Store reference
        this.dashboard = dashboard;
    }

    setupEventListeners() {
        // Toggle dashboard with Ctrl+Shift+D
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.key === 'D') {
                e.preventDefault();
                this.toggle();
            }
        });

        // Dashboard controls
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('refresh-btn')) {
                this.updateDashboard();
            }
            
            if (e.target.classList.contains('close-btn')) {
                this.hide();
            }
            
            if (e.target.id === 'blaze-system-dashboard' && e.target === e.currentTarget) {
                this.hide();
            }
        });

        // Listen for system errors
        document.addEventListener('blazeError', (event) => {
            if (this.isVisible) {
                this.updateDashboard();
            }
        });
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    show() {
        this.isVisible = true;
        this.dashboard.classList.remove('hidden');
        this.updateDashboard();
        this.startAutoUpdate();
        console.log('📊 System Dashboard opened');
    }

    hide() {
        this.isVisible = false;
        this.dashboard.classList.add('hidden');
        this.stopAutoUpdate();
        console.log('📊 System Dashboard closed');
    }

    startAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
        }
        
        this.updateTimer = setInterval(() => {
            if (this.isVisible) {
                this.updateDashboard();
            }
        }, this.updateInterval);
    }

    stopAutoUpdate() {
        if (this.updateTimer) {
            clearInterval(this.updateTimer);
            this.updateTimer = null;
        }
    }

    async updateDashboard() {
        if (!this.errorHandler || !this.apiWrapper) return;

        try {
            await Promise.all([
                this.updateCircuitBreakers(),
                this.updateErrorStats(),
                this.updateAPIHealth(),
                this.updateSystemMetrics()
            ]);
            
            // Update timestamp
            const timestamp = document.querySelector('.dashboard-timestamp');
            if (timestamp) {
                timestamp.textContent = `Last updated: ${new Date().toLocaleTimeString()}`;
            }
            
        } catch (error) {
            console.error('Error updating dashboard:', error);
        }
    }

    updateCircuitBreakers() {
        const container = document.getElementById('circuit-breakers');
        if (!container) return;

        const breakerStatus = this.errorHandler.getCircuitBreakerStatus();
        
        container.innerHTML = Object.entries(breakerStatus).map(([endpoint, status]) => {
            const domain = new URL(endpoint).hostname;
            const statusClass = status.state.toLowerCase();
            
            return `
                <div class="circuit-breaker ${statusClass}">
                    <div class="breaker-header">
                        <span class="breaker-name">${domain}</span>
                        <span class="breaker-state ${statusClass}">${status.state}</span>
                    </div>
                    <div class="breaker-details">
                        <div>Failures: ${status.failureCount}</div>
                        <div>Status: ${status.isOpen ? 'BLOCKED' : 'ALLOWING'}</div>
                    </div>
                </div>
            `;
        }).join('');
    }

    updateErrorStats() {
        const container = document.getElementById('error-stats');
        if (!container) return;

        const stats = this.errorHandler.getErrorStats();
        
        container.innerHTML = `
            <div class="stat-grid">
                <div class="stat-item">
                    <div class="stat-value">${stats.totalErrors}</div>
                    <div class="stat-label">Total Errors</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${stats.telemetryQueueSize}</div>
                    <div class="stat-label">Queued for Telemetry</div>
                </div>
                <div class="stat-item">
                    <div class="stat-value">${Object.keys(stats.errorsByType).length}</div>
                    <div class="stat-label">Error Types</div>
                </div>
            </div>
            
            <div class="error-breakdown">
                <h5>Errors by Type</h5>
                ${Object.entries(stats.errorsByType).map(([type, count]) => `
                    <div class="error-type">
                        <span class="error-type-name">${type.toUpperCase()}</span>
                        <span class="error-type-count">${count}</span>
                    </div>
                `).join('')}
            </div>
        `;
    }

    async updateAPIHealth() {
        const container = document.getElementById('api-health');
        if (!container) return;

        try {
            // Test endpoint health
            const healthResults = await this.apiWrapper.testEndpoints();
            
            container.innerHTML = Object.entries(healthResults).map(([name, result]) => {
                const statusClass = result.status === 'healthy' ? 'healthy' : 'error';
                const responseTime = result.responseTime || 0;
                
                return `
                    <div class="api-endpoint ${statusClass}">
                        <div class="endpoint-header">
                            <span class="endpoint-name">${name.toUpperCase()}</span>
                            <span class="endpoint-status ${statusClass}">${result.status}</span>
                        </div>
                        <div class="endpoint-details">
                            ${result.status === 'healthy' ? 
                                `<div>Response: ${responseTime}ms</div>` :
                                `<div>Error: ${result.error}</div>`
                            }
                        </div>
                    </div>
                `;
            }).join('');
            
        } catch (error) {
            container.innerHTML = '<div class="error-message">Failed to test API endpoints</div>';
        }
    }

    updateSystemMetrics() {
        const container = document.getElementById('system-metrics');
        if (!container) return;

        const cacheStats = this.apiWrapper.getCacheStats();
        const memoryUsage = performance.memory ? {
            used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
            total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
            limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        } : null;

        container.innerHTML = `
            <div class="metric-grid">
                <div class="metric-item">
                    <div class="metric-value">${cacheStats.size}</div>
                    <div class="metric-label">Cache Entries</div>
                </div>
                
                <div class="metric-item">
                    <div class="metric-value">${cacheStats.fallbackDataKeys.length}</div>
                    <div class="metric-label">Fallback Keys</div>
                </div>
                
                ${memoryUsage ? `
                    <div class="metric-item">
                        <div class="metric-value">${memoryUsage.used}MB</div>
                        <div class="metric-label">Memory Used</div>
                    </div>
                    
                    <div class="metric-item">
                        <div class="metric-value">${Math.round((memoryUsage.used / memoryUsage.limit) * 100)}%</div>
                        <div class="metric-label">Memory Usage</div>
                    </div>
                ` : ''}
                
                <div class="metric-item">
                    <div class="metric-value">${navigator.onLine ? 'Online' : 'Offline'}</div>
                    <div class="metric-label">Connection</div>
                </div>
                
                <div class="metric-item">
                    <div class="metric-value">${new Date().toLocaleTimeString()}</div>
                    <div class="metric-label dashboard-timestamp">Current Time</div>
                </div>
            </div>
        `;
    }

    addStyles() {
        const styles = `
            <style>
                .system-dashboard {
                    position: fixed;
                    top: 0;
                    left: 0;
                    width: 100%;
                    height: 100%;
                    background: rgba(0, 0, 0, 0.9);
                    color: white;
                    z-index: 10000;
                    font-family: 'Inter', sans-serif;
                    display: flex;
                    flex-direction: column;
                    backdrop-filter: blur(10px);
                }
                
                .system-dashboard.hidden {
                    display: none;
                }
                
                .dashboard-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    padding: 20px;
                    background: rgba(191, 87, 0, 0.1);
                    border-bottom: 1px solid var(--burnt-orange);
                }
                
                .dashboard-controls {
                    display: flex;
                    gap: 10px;
                }
                
                .dashboard-controls button {
                    background: rgba(255, 255, 255, 0.1);
                    border: 1px solid rgba(255, 255, 255, 0.2);
                    color: white;
                    padding: 8px 12px;
                    border-radius: 6px;
                    cursor: pointer;
                    font-size: 14px;
                }
                
                .dashboard-controls button:hover {
                    background: rgba(255, 255, 255, 0.2);
                }
                
                .dashboard-content {
                    flex: 1;
                    padding: 20px;
                    overflow-y: auto;
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
                    gap: 20px;
                }
                
                .dashboard-section {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 12px;
                    padding: 20px;
                }
                
                .dashboard-section h4 {
                    margin: 0 0 15px 0;
                    color: var(--burnt-orange);
                }
                
                .circuit-breaker-grid, .api-health {
                    display: grid;
                    gap: 10px;
                }
                
                .circuit-breaker, .api-endpoint {
                    background: rgba(255, 255, 255, 0.05);
                    border: 1px solid rgba(255, 255, 255, 0.1);
                    border-radius: 8px;
                    padding: 12px;
                }
                
                .circuit-breaker.open, .api-endpoint.error {
                    border-color: #ff4757;
                    background: rgba(255, 71, 87, 0.1);
                }
                
                .circuit-breaker.closed, .api-endpoint.healthy {
                    border-color: #00ff88;
                    background: rgba(0, 255, 136, 0.1);
                }
                
                .breaker-header, .endpoint-header {
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    margin-bottom: 8px;
                }
                
                .breaker-state, .endpoint-status {
                    font-size: 0.8em;
                    padding: 2px 8px;
                    border-radius: 4px;
                    font-weight: 600;
                }
                
                .breaker-state.open, .endpoint-status.error {
                    background: #ff4757;
                    color: white;
                }
                
                .breaker-state.closed, .endpoint-status.healthy {
                    background: #00ff88;
                    color: black;
                }
                
                .breaker-state.half_open {
                    background: #ffd700;
                    color: black;
                }
                
                .stat-grid, .metric-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
                    gap: 15px;
                }
                
                .stat-item, .metric-item {
                    text-align: center;
                    background: rgba(255, 255, 255, 0.05);
                    padding: 15px;
                    border-radius: 8px;
                }
                
                .stat-value, .metric-value {
                    font-size: 1.5em;
                    font-weight: 700;
                    color: var(--burnt-orange);
                    font-family: 'JetBrains Mono', monospace;
                }
                
                .stat-label, .metric-label {
                    font-size: 0.8em;
                    margin-top: 5px;
                    opacity: 0.8;
                }
                
                .error-breakdown {
                    margin-top: 20px;
                }
                
                .error-type {
                    display: flex;
                    justify-content: space-between;
                    padding: 8px;
                    border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                }
                
                .error-type:last-child {
                    border-bottom: none;
                }
                
                .error-type-count {
                    color: var(--burnt-orange);
                    font-weight: 600;
                }
                
                @media (max-width: 768px) {
                    .dashboard-content {
                        grid-template-columns: 1fr;
                    }
                }
            </style>
        `;
        
        document.head.insertAdjacentHTML('beforeend', styles);
    }
}

// Initialize when DOM is ready
if (typeof window !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        try {
            window.blazeSystemDashboard = new BlazeSystemDashboard();
            
            // Show hint for first-time users
            setTimeout(() => {
                console.log('💡 Tip: Press Ctrl+Shift+D to open System Dashboard');
            }, 5000);
            
        } catch (error) {
            console.error('❌ Failed to initialize System Dashboard:', error);
        }
    });
}

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeSystemDashboard;
}