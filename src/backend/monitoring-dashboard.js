/**
 * Monitoring Dashboard for Production
 * Real-time system health and performance monitoring
 */

import os from 'os';
import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

class MonitoringDashboard {
  constructor(cacheLayer = null, logger = null) {
    this.cacheLayer = cacheLayer;
    this.logger = logger;
    this.startTime = Date.now();
    this.metrics = new Map();
    this.alerts = [];
    this.thresholds = {
      cpu: 80, // CPU usage %
      memory: 85, // Memory usage %
      disk: 90, // Disk usage %
      responseTime: 2000, // Response time ms
      errorRate: 5 // Error rate %
    };
    
    // Start collecting metrics
    this.startMetricsCollection();
  }

  /**
   * Start periodic metrics collection
   */
  startMetricsCollection() {
    // Collect system metrics every 30 seconds
    setInterval(async () => {
      await this.collectSystemMetrics();
      await this.checkThresholds();
    }, 30000);

    // Clean old metrics every 5 minutes
    setInterval(() => {
      this.cleanOldMetrics();
    }, 300000);
  }

  /**
   * Get comprehensive system health
   */
  async getSystemHealth() {
    const health = {
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: this.getUptime(),
      environment: process.env.NODE_ENV || 'development',
      system: await this.getSystemMetrics(),
      application: await this.getApplicationMetrics(),
      services: await this.getServiceHealth(),
      cache: this.cacheLayer ? await this.cacheLayer.healthCheck() : { status: 'disabled' },
      alerts: this.getActiveAlerts()
    };

    // Determine overall health status
    if (health.alerts.some(alert => alert.severity === 'critical')) {
      health.status = 'critical';
    } else if (health.alerts.some(alert => alert.severity === 'warning')) {
      health.status = 'warning';
    }

    return health;
  }

  /**
   * Get system metrics (CPU, memory, disk)
   */
  async getSystemMetrics() {
    const metrics = {
      cpu: await this.getCPUUsage(),
      memory: this.getMemoryUsage(),
      disk: await this.getDiskUsage(),
      load: os.loadavg(),
      platform: os.platform(),
      nodeVersion: process.version
    };

    this.recordMetric('system', metrics);
    return metrics;
  }

  /**
   * Get application-specific metrics
   */
  async getApplicationMetrics() {
    const processMemory = process.memoryUsage();
    const metrics = {
      pid: process.pid,
      memory: {
        rss: Math.round(processMemory.rss / 1024 / 1024), // MB
        heapTotal: Math.round(processMemory.heapTotal / 1024 / 1024), // MB
        heapUsed: Math.round(processMemory.heapUsed / 1024 / 1024), // MB
        external: Math.round(processMemory.external / 1024 / 1024) // MB
      },
      eventLoop: await this.getEventLoopLag(),
      activeHandles: process._getActiveHandles().length,
      activeRequests: process._getActiveRequests().length
    };

    this.recordMetric('application', metrics);
    return metrics;
  }

  /**
   * Get service health checks
   */
  async getServiceHealth() {
    const services = {
      database: await this.checkDatabaseHealth(),
      api: await this.checkAPIHealth(),
      cache: this.cacheLayer ? await this.cacheLayer.healthCheck() : { status: 'disabled' }
    };

    return services;
  }

  /**
   * Check database connectivity
   */
  async checkDatabaseHealth() {
    try {
      // Import pool dynamically to avoid circular dependencies
      const { default: pool } = await import('../../server/db.js');
      const start = Date.now();
      const result = await pool.query('SELECT 1');
      const responseTime = Date.now() - start;
      
      return {
        status: 'healthy',
        responseTime: `${responseTime}ms`,
        connected: true
      };
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        connected: false
      };
    }
  }

  /**
   * Check API endpoints health
   */
  async checkAPIHealth() {
    const endpoints = [
      '/api/mlb/cardinals/summary',
      '/healthz',
      '/metrics'
    ];

    const results = await Promise.all(
      endpoints.map(async (endpoint) => {
        try {
          const start = Date.now();
          const response = await fetch(`http://localhost:${process.env.PORT || 5000}${endpoint}`);
          const responseTime = Date.now() - start;
          
          return {
            endpoint,
            status: response.ok ? 'healthy' : 'unhealthy',
            statusCode: response.status,
            responseTime: `${responseTime}ms`
          };
        } catch (error) {
          return {
            endpoint,
            status: 'unhealthy',
            error: error.message
          };
        }
      })
    );

    return {
      status: results.every(r => r.status === 'healthy') ? 'healthy' : 'degraded',
      endpoints: results
    };
  }

  /**
   * Get CPU usage percentage
   */
  async getCPUUsage() {
    return new Promise((resolve) => {
      const startUsage = process.cpuUsage();
      const startTime = Date.now();
      
      setTimeout(() => {
        const currentUsage = process.cpuUsage(startUsage);
        const currentTime = Date.now();
        const elapsedTime = currentTime - startTime;
        
        const cpuPercent = (currentUsage.user + currentUsage.system) / (elapsedTime * 1000);
        resolve(Math.round(cpuPercent * 100 * 100) / 100); // Round to 2 decimal places
      }, 100);
    });
  }

  /**
   * Get memory usage
   */
  getMemoryUsage() {
    const totalMemory = os.totalmem();
    const freeMemory = os.freemem();
    const usedMemory = totalMemory - freeMemory;
    
    return {
      total: Math.round(totalMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
      used: Math.round(usedMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
      free: Math.round(freeMemory / 1024 / 1024 / 1024 * 100) / 100, // GB
      percentage: Math.round((usedMemory / totalMemory) * 100)
    };
  }

  /**
   * Get disk usage
   */
  async getDiskUsage() {
    try {
      const { stdout } = await execAsync("df -h / | tail -1 | awk '{print $2,$3,$4,$5}'");
      const [total, used, available, percentage] = stdout.trim().split(' ');
      
      return {
        total,
        used,
        available,
        percentage: parseInt(percentage.replace('%', ''))
      };
    } catch (error) {
      return {
        error: 'Unable to get disk usage',
        message: error.message
      };
    }
  }

  /**
   * Measure event loop lag
   */
  getEventLoopLag() {
    return new Promise((resolve) => {
      const start = process.hrtime();
      setImmediate(() => {
        const delta = process.hrtime(start);
        const lag = delta[0] * 1000 + delta[1] * 1e-6; // Convert to milliseconds
        resolve(Math.round(lag * 100) / 100);
      });
    });
  }

  /**
   * Get uptime in human readable format
   */
  getUptime() {
    const uptimeMs = Date.now() - this.startTime;
    const seconds = Math.floor(uptimeMs / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) return `${days}d ${hours % 24}h ${minutes % 60}m`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
    return `${seconds}s`;
  }

  /**
   * Record metric with timestamp
   */
  recordMetric(category, data) {
    const timestamp = Date.now();
    if (!this.metrics.has(category)) {
      this.metrics.set(category, []);
    }
    
    this.metrics.get(category).push({
      timestamp,
      data
    });

    // Keep only last 100 entries per category
    const categoryMetrics = this.metrics.get(category);
    if (categoryMetrics.length > 100) {
      categoryMetrics.splice(0, categoryMetrics.length - 100);
    }
  }

  /**
   * Check if metrics exceed thresholds
   */
  async checkThresholds() {
    const systemMetrics = await this.getSystemMetrics();
    const currentTime = Date.now();
    
    // Check CPU usage
    if (systemMetrics.cpu > this.thresholds.cpu) {
      this.addAlert('cpu_high', `CPU usage is ${systemMetrics.cpu}%`, 'warning');
    }

    // Check memory usage
    if (systemMetrics.memory.percentage > this.thresholds.memory) {
      this.addAlert('memory_high', `Memory usage is ${systemMetrics.memory.percentage}%`, 'warning');
    }

    // Check disk usage
    if (systemMetrics.disk.percentage && systemMetrics.disk.percentage > this.thresholds.disk) {
      this.addAlert('disk_high', `Disk usage is ${systemMetrics.disk.percentage}%`, 'critical');
    }
  }

  /**
   * Add alert
   */
  addAlert(type, message, severity = 'warning') {
    const alert = {
      id: `${type}_${Date.now()}`,
      type,
      message,
      severity,
      timestamp: new Date().toISOString(),
      active: true
    };

    this.alerts.push(alert);
    
    if (this.logger) {
      this.logger.logHealth('monitoring', 'alert', { alert });
    }

    // Keep only last 50 alerts
    if (this.alerts.length > 50) {
      this.alerts.splice(0, this.alerts.length - 50);
    }
  }

  /**
   * Get active alerts
   */
  getActiveAlerts() {
    return this.alerts.filter(alert => alert.active);
  }

  /**
   * Clear old metrics (older than 1 hour)
   */
  cleanOldMetrics() {
    const oneHourAgo = Date.now() - (60 * 60 * 1000);
    
    for (const [category, metrics] of this.metrics.entries()) {
      const filtered = metrics.filter(metric => metric.timestamp > oneHourAgo);
      this.metrics.set(category, filtered);
    }
  }

  /**
   * Get metrics for specific category and timeframe
   */
  getMetrics(category, timeframeMinutes = 60) {
    const cutoff = Date.now() - (timeframeMinutes * 60 * 1000);
    const categoryMetrics = this.metrics.get(category) || [];
    
    return categoryMetrics.filter(metric => metric.timestamp > cutoff);
  }

  /**
   * Get dashboard data for frontend
   */
  async getDashboardData() {
    const health = await this.getSystemHealth();
    
    return {
      ...health,
      metrics: {
        system: this.getMetrics('system', 30),
        application: this.getMetrics('application', 30)
      },
      performance: {
        avgResponseTime: this.getAverageResponseTime(),
        requestCount: this.getRequestCount(),
        errorRate: this.getErrorRate()
      }
    };
  }

  /**
   * Get average response time from recent metrics
   */
  getAverageResponseTime() {
    // This would be populated by request logging middleware
    return 0; // Placeholder
  }

  /**
   * Get request count from recent metrics
   */
  getRequestCount() {
    // This would be populated by request logging middleware
    return 0; // Placeholder
  }

  /**
   * Get error rate from recent metrics
   */
  getErrorRate() {
    // This would be calculated from error logs
    return 0; // Placeholder
  }
}

export default MonitoringDashboard;