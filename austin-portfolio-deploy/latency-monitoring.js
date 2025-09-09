/**
 * Blaze Intelligence Latency Monitoring & Performance Budget System
 * Hard latency budgets with stage-specific monitoring and alerts
 */

class LatencyMonitor {
    constructor() {
        this.budgets = {
            // 100ms end-to-end budget split by stage
            stages: {
                auth: { budget: 15, current: 0, violations: 0 },
                api_call: { budget: 35, current: 0, violations: 0 },
                ai_processing: { budget: 40, current: 0, violations: 0 },
                render: { budget: 10, current: 0, violations: 0 }
            },
            total: { budget: 100, current: 0, violations: 0 },
            // Error budgets (SLO targets)
            errorBudgets: {
                availability: { target: 99.9, current: 100, remaining: 100 },
                latency: { target: 95, current: 100, remaining: 100 }, // 95% under budget
                success_rate: { target: 99.5, current: 100, remaining: 100 }
            }
        };
        
        this.alerts = [];
        this.metrics = new Map();
        this.thresholds = {
            warning: 0.8,  // 80% of budget
            critical: 1.0, // 100% of budget
            burnRate: 0.02 // 2% error budget burn per hour is critical
        };
        
        // Core Web Vitals targets
        this.vitals = {
            LCP: { target: 2500, current: 0 }, // Largest Contentful Paint
            FID: { target: 100, current: 0 },  // First Input Delay
            CLS: { target: 0.1, current: 0 }   // Cumulative Layout Shift
        };
        
        this.init();
    }
    
    init() {
        this.setupPerformanceObserver();
        this.startMetricsCollection();
        this.scheduleHealthChecks();
        console.log('🎯 Latency monitoring initialized with 100ms budget');
    }
    
    setupPerformanceObserver() {
        if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
            // Monitor Core Web Vitals
            const observer = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    this.recordVital(entry);
                }
            });
            
            observer.observe({ 
                entryTypes: ['navigation', 'resource', 'measure', 'paint', 'layout-shift'] 
            });
            
            // Monitor largest contentful paint
            new PerformanceObserver((list) => {
                const entries = list.getEntries();
                const lastEntry = entries[entries.length - 1];
                this.vitals.LCP.current = lastEntry.startTime;
                this.checkVitalThreshold('LCP');
            }).observe({ entryTypes: ['largest-contentful-paint'] });
            
            // Monitor first input delay
            new PerformanceObserver((list) => {
                const firstInput = list.getEntries()[0];
                if (firstInput) {
                    this.vitals.FID.current = firstInput.processingStart - firstInput.startTime;
                    this.checkVitalThreshold('FID');
                }
            }).observe({ entryTypes: ['first-input'] });
        }
    }
    
    recordVital(entry) {
        if (entry.entryType === 'layout-shift' && !entry.hadRecentInput) {
            this.vitals.CLS.current += entry.value;
            this.checkVitalThreshold('CLS');
        }
    }
    
    checkVitalThreshold(vital) {
        const { target, current } = this.vitals[vital];
        const ratio = current / target;
        
        if (ratio > 1) {
            this.triggerAlert(`Core Web Vital violation: ${vital} = ${current}ms (target: ${target}ms)`, 'critical');
        } else if (ratio > this.thresholds.warning) {
            this.triggerAlert(`Core Web Vital warning: ${vital} approaching limit`, 'warning');
        }
    }
    
    startStage(stageName) {
        const timestamp = performance.now();
        this.metrics.set(`${stageName}_start`, timestamp);
        return timestamp;
    }
    
    endStage(stageName) {
        const endTime = performance.now();
        const startTime = this.metrics.get(`${stageName}_start`);
        
        if (!startTime) {
            console.warn(`No start time recorded for stage: ${stageName}`);
            return 0;
        }
        
        const duration = Math.round(endTime - startTime);
        const budget = this.budgets.stages[stageName];
        
        if (budget) {
            budget.current = duration;
            
            // Check budget violation
            if (duration > budget.budget) {
                budget.violations++;
                this.triggerAlert(
                    `Budget violation: ${stageName} took ${duration}ms (budget: ${budget.budget}ms)`,
                    'critical'
                );
            } else if (duration > budget.budget * this.thresholds.warning) {
                this.triggerAlert(
                    `Budget warning: ${stageName} used ${Math.round(duration/budget.budget*100)}% of budget`,
                    'warning'
                );
            }
            
            // Update error budget
            this.updateErrorBudget('latency', duration <= budget.budget);
        }
        
        this.metrics.set(`${stageName}_duration`, duration);
        return duration;
    }
    
    measureEndToEnd(startTime) {
        const endTime = performance.now();
        const totalDuration = Math.round(endTime - startTime);
        
        this.budgets.total.current = totalDuration;
        
        if (totalDuration > this.budgets.total.budget) {
            this.budgets.total.violations++;
            this.triggerAlert(
                `End-to-end budget violation: ${totalDuration}ms (budget: ${this.budgets.total.budget}ms)`,
                'critical'
            );
        }
        
        return totalDuration;
    }
    
    updateErrorBudget(type, success) {
        const budget = this.budgets.errorBudgets[type];
        if (!budget) return;
        
        // Simple sliding window approach
        const windowSize = 100; // Track last 100 requests
        if (!budget.window) budget.window = [];
        
        budget.window.push(success ? 1 : 0);
        if (budget.window.length > windowSize) {
            budget.window.shift();
        }
        
        // Calculate current success rate
        const successCount = budget.window.reduce((sum, val) => sum + val, 0);
        budget.current = (successCount / budget.window.length) * 100;
        budget.remaining = Math.max(0, budget.current - budget.target);
        
        // Check burn rate
        if (budget.window.length >= 10) {
            const recentFailures = budget.window.slice(-10).filter(val => val === 0).length;
            const burnRate = recentFailures / 10;
            
            if (burnRate > this.thresholds.burnRate) {
                this.triggerAlert(
                    `High error budget burn rate: ${type} at ${(burnRate * 100).toFixed(1)}% failure rate`,
                    'critical'
                );
            }
        }
    }
    
    triggerAlert(message, severity) {
        const alert = {
            timestamp: new Date().toISOString(),
            message,
            severity,
            id: Date.now()
        };
        
        this.alerts.unshift(alert);
        
        // Keep only last 50 alerts
        if (this.alerts.length > 50) {
            this.alerts = this.alerts.slice(0, 50);
        }
        
        console.warn(`🚨 ${severity.toUpperCase()}: ${message}`);
        
        // Send to monitoring service
        if (typeof fetch !== 'undefined') {
            fetch('/api/alerts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(alert)
            }).catch(console.error);
        }
        
        // Show user notification for critical alerts
        if (severity === 'critical' && typeof window !== 'undefined') {
            this.showUserAlert(message);
        }
    }
    
    showUserAlert(message) {
        // Create non-intrusive toast notification
        const toast = document.createElement('div');
        toast.className = 'performance-alert';
        toast.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">⚡</span>
                <span class="alert-message">Performance issue detected</span>
                <button class="alert-dismiss" onclick="this.parentElement.parentElement.remove()">×</button>
            </div>
        `;
        
        // Add styles
        toast.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(255, 87, 51, 0.95);
            color: white;
            padding: 12px 16px;
            border-radius: 8px;
            font-size: 14px;
            z-index: 10000;
            backdrop-filter: blur(10px);
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(toast);
        
        // Auto-dismiss after 5 seconds
        setTimeout(() => {
            if (toast.parentElement) {
                toast.remove();
            }
        }, 5000);
    }
    
    scheduleHealthChecks() {
        // Run health checks every 30 seconds
        setInterval(() => {
            this.runHealthCheck();
        }, 30000);
        
        // Run SLO checks every 5 minutes
        setInterval(() => {
            this.checkSLOs();
        }, 300000);
    }
    
    async runHealthCheck() {
        const healthMetrics = {
            timestamp: Date.now(),
            stages: { ...this.budgets.stages },
            total: { ...this.budgets.total },
            vitals: { ...this.vitals },
            errorBudgets: { ...this.budgets.errorBudgets }
        };
        
        // Store metrics
        localStorage.setItem('blaze_performance_metrics', JSON.stringify(healthMetrics));
        
        // Send to monitoring endpoint
        if (typeof fetch !== 'undefined') {
            try {
                await fetch('/api/health/performance', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(healthMetrics)
                });
            } catch (error) {
                console.warn('Failed to send health metrics:', error);
            }
        }
    }
    
    checkSLOs() {
        Object.entries(this.budgets.errorBudgets).forEach(([metric, budget]) => {
            const { target, current, remaining } = budget;
            
            if (remaining < 10) { // Less than 10% error budget remaining
                this.triggerAlert(
                    `SLO risk: ${metric} error budget 90% consumed (${remaining.toFixed(1)}% remaining)`,
                    'critical'
                );
            } else if (remaining < 25) {
                this.triggerAlert(
                    `SLO warning: ${metric} error budget 75% consumed (${remaining.toFixed(1)}% remaining)`,
                    'warning'
                );
            }
        });
    }
    
    // Public API for components
    measureOperation(name, operation) {
        return new Promise(async (resolve, reject) => {
            const startTime = this.startStage(name);
            
            try {
                const result = await operation();
                this.endStage(name);
                resolve(result);
            } catch (error) {
                this.endStage(name);
                this.updateErrorBudget('success_rate', false);
                reject(error);
            }
        });
    }
    
    getMetrics() {
        return {
            budgets: this.budgets,
            vitals: this.vitals,
            alerts: this.alerts.slice(0, 10), // Recent alerts
            health: this.getHealthStatus()
        };
    }
    
    getHealthStatus() {
        const criticalAlerts = this.alerts.filter(a => 
            a.severity === 'critical' && 
            Date.now() - new Date(a.timestamp).getTime() < 300000 // Last 5 minutes
        ).length;
        
        const avgLatency = Object.values(this.budgets.stages)
            .reduce((sum, stage) => sum + stage.current, 0) / 4;
        
        const budgetUtilization = avgLatency / (this.budgets.total.budget / 4);
        
        if (criticalAlerts > 0 || budgetUtilization > 1) {
            return 'critical';
        } else if (budgetUtilization > 0.8) {
            return 'warning';
        } else {
            return 'healthy';
        }
    }
    
    reset() {
        // Reset all metrics
        Object.values(this.budgets.stages).forEach(stage => {
            stage.current = 0;
            stage.violations = 0;
        });
        
        this.budgets.total.current = 0;
        this.budgets.total.violations = 0;
        this.alerts = [];
        this.metrics.clear();
    }
}

// Initialize global latency monitor
window.blazeLatencyMonitor = new LatencyMonitor();

// Export for Node.js environment
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LatencyMonitor;
}

console.log('⚡ Latency monitoring system active - 100ms budget enforced');