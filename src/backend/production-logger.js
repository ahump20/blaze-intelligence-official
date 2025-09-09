/**
 * Production Logger with Rotation and Monitoring
 * Enterprise-grade logging for Blaze Intelligence
 */

import winston from 'winston';
import DailyRotateFile from 'winston-daily-rotate-file';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

class ProductionLogger {
  constructor() {
    this.logger = null;
    this.initialize();
  }

  initialize() {
    const logDir = path.join(process.cwd(), 'logs');
    
    // Custom log format
    const logFormat = winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss.SSS Z'
      }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
        
        if (Object.keys(meta).length) {
          log += ` | ${JSON.stringify(meta)}`;
        }
        
        return log;
      })
    );

    // Console format for development
    const consoleFormat = winston.format.combine(
      winston.format.colorize(),
      winston.format.timestamp({
        format: 'HH:mm:ss'
      }),
      winston.format.printf(({ timestamp, level, message, ...meta }) => {
        let log = `${timestamp} ${level}: ${message}`;
        
        if (Object.keys(meta).length && process.env.NODE_ENV !== 'production') {
          log += ` ${JSON.stringify(meta, null, 2)}`;
        }
        
        return log;
      })
    );

    // Create transports
    const transports = [
      // Console output
      new winston.transports.Console({
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: consoleFormat,
        handleExceptions: true,
        handleRejections: true
      }),

      // Error log file (daily rotation)
      new DailyRotateFile({
        filename: path.join(logDir, 'error-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'error',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '30d',
        handleExceptions: true,
        handleRejections: true
      }),

      // Combined log file (daily rotation)
      new DailyRotateFile({
        filename: path.join(logDir, 'combined-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
        format: logFormat,
        maxSize: '50m',
        maxFiles: '14d'
      }),

      // Performance log file
      new DailyRotateFile({
        filename: path.join(logDir, 'performance-%DATE%.log'),
        datePattern: 'YYYY-MM-DD',
        level: 'info',
        format: logFormat,
        maxSize: '20m',
        maxFiles: '7d'
      })
    ];

    // Create logger
    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'production' ? 'info' : 'debug'),
      format: logFormat,
      transports,
      exitOnError: false,
      silent: false
    });

    // Handle transport errors
    this.logger.on('error', (error) => {
      console.error('Logger error:', error);
    });

    console.log('✅ Production logger initialized');
  }

  /**
   * Log application startup
   */
  logStartup(config) {
    this.logger.info('🚀 Blaze Intelligence starting up', {
      nodeEnv: process.env.NODE_ENV,
      nodeVersion: process.version,
      port: config.port || process.env.PORT,
      pid: process.pid,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log API requests with performance metrics
   */
  logRequest(req, res, responseTime) {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      timestamp: new Date().toISOString()
    };

    // Add user info if authenticated
    if (req.user) {
      logData.userId = req.user.id;
      logData.userEmail = req.user.email;
    }

    if (res.statusCode >= 400) {
      this.logger.warn('HTTP Request Error', logData);
    } else if (responseTime > 1000) {
      this.logger.warn('Slow HTTP Request', logData);
    } else {
      this.logger.info('HTTP Request', logData);
    }
  }

  /**
   * Log performance metrics
   */
  logPerformance(metric, value, context = {}) {
    this.logger.info('Performance Metric', {
      metric,
      value,
      unit: this.getMetricUnit(metric),
      context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log security events
   */
  logSecurity(event, details = {}) {
    this.logger.warn('🚨 Security Event', {
      event,
      ...details,
      timestamp: new Date().toISOString(),
      severity: this.getSecuritySeverity(event)
    });
  }

  /**
   * Log business events (subscriptions, payments, etc.)
   */
  logBusiness(event, details = {}) {
    this.logger.info('💰 Business Event', {
      event,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log system health and monitoring
   */
  logHealth(component, status, metrics = {}) {
    const logLevel = status === 'healthy' ? 'info' : 'warn';
    
    this.logger[logLevel]('🏥 Health Check', {
      component,
      status,
      metrics,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log database operations
   */
  logDatabase(operation, table, details = {}) {
    this.logger.debug('🗄️  Database Operation', {
      operation,
      table,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Log errors with stack traces
   */
  logError(error, context = {}) {
    this.logger.error('❌ Application Error', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      ...context,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Get appropriate unit for performance metrics
   */
  getMetricUnit(metric) {
    const units = {
      'response_time': 'ms',
      'cpu_usage': '%',
      'memory_usage': 'MB',
      'disk_usage': 'GB',
      'cache_hit_rate': '%',
      'requests_per_second': 'req/s',
      'error_rate': '%'
    };
    
    return units[metric] || 'count';
  }

  /**
   * Get security event severity
   */
  getSecuritySeverity(event) {
    const severities = {
      'failed_login': 'medium',
      'rate_limit_exceeded': 'medium',
      'sql_injection_attempt': 'high',
      'xss_attempt': 'high',
      'unauthorized_access': 'high',
      'suspicious_upload': 'medium',
      'invalid_token': 'low'
    };
    
    return severities[event] || 'medium';
  }

  /**
   * Get logger instance
   */
  getLogger() {
    return this.logger;
  }

  /**
   * Express middleware for request logging
   */
  requestMiddleware() {
    return (req, res, next) => {
      const start = Date.now();
      
      res.on('finish', () => {
        const responseTime = Date.now() - start;
        this.logRequest(req, res, responseTime);
      });
      
      next();
    };
  }

  /**
   * Express error handling middleware
   */
  errorMiddleware() {
    return (err, req, res, next) => {
      this.logError(err, {
        method: req.method,
        url: req.originalUrl || req.url,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      
      next(err);
    };
  }
}

export default ProductionLogger;