// Instrumentation Setup for Blaze Intelligence
// Implements Sentry error tracking, Google Analytics 4, comprehensive health endpoints, and CSP headers

class InstrumentationManager {
    constructor(environment = 'development') {
        this.environment = environment;
        this.isProduction = environment === 'production';
        this.metrics = new Map();
        this.healthCheckers = new Map();
        this.init();
    }

    // Initialize all instrumentation
    init() {
        this.setupSentry();
        this.setupGA4();
        this.setupHealthChecks();
        this.setupMetrics();
        this.setupCSPHeaders();
        console.log('✅ Instrumentation manager initialized');
    }

    // Sentry Error Tracking Setup
    setupSentry() {
        // Client-side Sentry integration (to be added to HTML head)
        this.sentryClientConfig = `
            <script src="https://browser.sentry-cdn.com/7.91.0/bundle.tracing.min.js" 
                    integrity="sha384-baEL+naDTaO6QR5l0jCgzR0KLMpj8c9+B2mW4OEo0F3pG5HE/i7jZEa6pGtLBODa" 
                    crossorigin="anonymous"></script>
            <script>
                if (typeof Sentry !== 'undefined' && window.location.hostname !== 'localhost') {
                    Sentry.init({
                        dsn: 'SENTRY_DSN_PLACEHOLDER', // To be replaced with real DSN
                        integrations: [
                            new Sentry.BrowserTracing(),
                            new Sentry.Replay({
                                maskAllText: true,
                                blockAllMedia: true,
                            })
                        ],
                        tracesSampleRate: 0.1,
                        replaysSessionSampleRate: 0.02,
                        replaysOnErrorSampleRate: 1.0,
                        environment: '${this.environment}',
                        beforeSend: function(event, hint) {
                            // Filter out unhandled promise rejections we're already handling
                            if (event.exception?.values?.some(e => 
                                e.type === 'UnhandledPromiseRejectionWarning' ||
                                e.value?.includes('unhandled_promise_rejection')
                            )) {
                                return null;
                            }
                            return event;
                        }
                    });
                }
            </script>
        `;
    }

    // Google Analytics 4 Setup
    setupGA4() {
        this.ga4Config = `
            <!-- Google tag (gtag.js) -->
            <script async src="https://www.googletagmanager.com/gtag/js?id=GA_TRACKING_ID_PLACEHOLDER"></script>
            <script>
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                
                gtag('config', 'GA_TRACKING_ID_PLACEHOLDER', {
                    page_title: document.title,
                    page_location: window.location.href,
                    content_group1: 'Sports Analytics Platform',
                    custom_map: {
                        'dimension1': 'user_type',
                        'dimension2': 'subscription_tier',
                        'dimension3': 'feature_usage'
                    }
                });

                // Track custom events
                function trackFeatureUsage(featureName, category = 'feature') {
                    gtag('event', 'feature_usage', {
                        event_category: category,
                        event_label: featureName,
                        custom_parameter_1: new Date().toISOString()
                    });
                }

                // Track subscription events
                function trackSubscription(action, tier) {
                    gtag('event', 'subscription', {
                        event_category: 'subscription',
                        event_label: tier,
                        value: tier === 'enterprise' ? 299 : 99,
                        currency: 'USD'
                    });
                }

                // Track API usage
                function trackAPIUsage(endpoint, responseTime) {
                    gtag('event', 'api_usage', {
                        event_category: 'api',
                        event_label: endpoint,
                        value: Math.round(responseTime),
                        custom_parameter_2: 'response_time_ms'
                    });
                }

                // Expose tracking functions globally
                window.blazeAnalytics = {
                    trackFeature: trackFeatureUsage,
                    trackSubscription: trackSubscription,
                    trackAPI: trackAPIUsage
                };
            </script>
        `;
    }

    // Comprehensive Health Check System
    setupHealthChecks() {
        this.healthCheckers.set('database', async () => {
            try {
                const startTime = Date.now();
                const result = await this.testDatabaseConnection();
                const responseTime = Date.now() - startTime;
                
                return {
                    status: result ? 'healthy' : 'unhealthy',
                    responseTime,
                    details: result ? 'Connection successful' : 'Connection failed',
                    lastChecked: new Date().toISOString()
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    error: error.message,
                    lastChecked: new Date().toISOString()
                };
            }
        });

        this.healthCheckers.set('cardinals_api', async () => {
            try {
                const startTime = Date.now();
                const response = await fetch('http://localhost:5000/api/mlb/cardinals/health', {
                    timeout: 5000
                });
                const responseTime = Date.now() - startTime;
                const data = await response.json();
                
                return {
                    status: response.ok ? 'healthy' : 'unhealthy',
                    responseTime,
                    details: data,
                    lastChecked: new Date().toISOString()
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    error: error.message,
                    lastChecked: new Date().toISOString()
                };
            }
        });

        this.healthCheckers.set('digital_combine', async () => {
            try {
                const startTime = Date.now();
                const response = await fetch('http://localhost:5000/api/digital-combine/health', {
                    timeout: 5000
                });
                const responseTime = Date.now() - startTime;
                const data = await response.json();
                
                return {
                    status: response.ok ? 'healthy' : 'unhealthy',
                    responseTime,
                    details: data,
                    lastChecked: new Date().toISOString()
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    error: error.message,
                    lastChecked: new Date().toISOString()
                };
            }
        });

        this.healthCheckers.set('ai_services', async () => {
            try {
                const checks = await Promise.allSettled([
                    fetch('http://localhost:5000/api/ai/openai/health', { timeout: 3000 }),
                    fetch('http://localhost:5000/api/ai/anthropic/health', { timeout: 3000 })
                ]);

                const openaiHealthy = checks[0].status === 'fulfilled' && checks[0].value.ok;
                const anthropicHealthy = checks[1].status === 'fulfilled' && checks[1].value.ok;

                return {
                    status: (openaiHealthy && anthropicHealthy) ? 'healthy' : 'degraded',
                    details: {
                        openai: openaiHealthy ? 'healthy' : 'unhealthy',
                        anthropic: anthropicHealthy ? 'healthy' : 'unhealthy'
                    },
                    lastChecked: new Date().toISOString()
                };
            } catch (error) {
                return {
                    status: 'unhealthy',
                    error: error.message,
                    lastChecked: new Date().toISOString()
                };
            }
        });

        this.healthCheckers.set('external_apis', async () => {
            try {
                const checks = await Promise.allSettled([
                    fetch('https://statsapi.mlb.com/api/v1/teams/138', { timeout: 5000 }),
                    fetch('https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/healthz', { timeout: 5000 })
                ]);

                const mlbHealthy = checks[0].status === 'fulfilled' && checks[0].value.ok;
                const gatewayHealthy = checks[1].status === 'fulfilled' && checks[1].value.ok;

                return {
                    status: (mlbHealthy && gatewayHealthy) ? 'healthy' : 'degraded',
                    details: {
                        mlb_stats_api: mlbHealthy ? 'healthy' : 'unhealthy',
                        blaze_gateway: gatewayHealthy ? 'healthy' : 'unhealthy'
                    },
                    lastChecked: new Date().toISOString()
                };
            } catch (error) {
                return {
                    status: 'degraded',
                    error: error.message,
                    lastChecked: new Date().toISOString()
                };
            }
        });
    }

    // Metrics Collection System
    setupMetrics() {
        this.metricsCollectors = {
            // System metrics
            system: () => ({
                memory: process.memoryUsage(),
                cpu: process.cpuUsage(),
                uptime: process.uptime(),
                timestamp: new Date().toISOString()
            }),

            // Request metrics (to be integrated with Express middleware)
            requests: {
                total: 0,
                errors: 0,
                responseTimeHistogram: [],
                endpointStats: new Map()
            },

            // Database metrics
            database: {
                connections: 0,
                queryCount: 0,
                slowQueries: 0,
                avgResponseTime: 0
            },

            // Feature usage metrics
            features: {
                digitalCombineUploads: 0,
                aiAnalysisRequests: 0,
                subscriptionCheckouts: 0,
                apiCalls: 0
            }
        };

        // Update metrics every 30 seconds
        setInterval(() => {
            this.updateMetrics();
        }, 30000);
    }

    // Content Security Policy Headers
    setupCSPHeaders() {
        this.cspConfig = {
            directives: {
                defaultSrc: ["'self'"],
                scriptSrc: [
                    "'self'",
                    "'unsafe-inline'", // Required for inline scripts
                    "https://cdnjs.cloudflare.com",
                    "https://cdn.jsdelivr.net",
                    "https://unpkg.com",
                    "https://www.googletagmanager.com",
                    "https://browser.sentry-cdn.com",
                    "https://js.stripe.com"
                ],
                styleSrc: [
                    "'self'",
                    "'unsafe-inline'", // Required for dynamic styles
                    "https://fonts.googleapis.com",
                    "https://cdnjs.cloudflare.com"
                ],
                fontSrc: [
                    "'self'",
                    "https://fonts.gstatic.com"
                ],
                imgSrc: [
                    "'self'",
                    "data:",
                    "https:",
                    "blob:" // For Three.js textures
                ],
                connectSrc: [
                    "'self'",
                    "https://statsapi.mlb.com",
                    "https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev",
                    "wss://blaze-vision-ai-gateway.humphrey-austin20.workers.dev",
                    "https://api.sportradar.us",
                    "https://site.api.espn.com",
                    "https://api.openai.com",
                    "https://api.anthropic.com",
                    "https://api.stripe.com",
                    "https://www.google-analytics.com",
                    "https://o1072805.ingest.sentry.io"
                ],
                frameSrc: [
                    "'self'",
                    "https://js.stripe.com"
                ],
                objectSrc: ["'none'"],
                baseUri: ["'self'"],
                formAction: ["'self'"]
            },
            reportOnly: !this.isProduction, // Report-only mode in development
            reportUri: "/api/csp-report"
        };
    }

    // Express middleware for request metrics
    createRequestMetricsMiddleware() {
        return (req, res, next) => {
            const startTime = Date.now();
            
            res.on('finish', () => {
                const responseTime = Date.now() - startTime;
                
                // Update request metrics
                this.metricsCollectors.requests.total++;
                if (res.statusCode >= 400) {
                    this.metricsCollectors.requests.errors++;
                }
                
                // Track response times
                this.metricsCollectors.requests.responseTimeHistogram.push(responseTime);
                if (this.metricsCollectors.requests.responseTimeHistogram.length > 1000) {
                    this.metricsCollectors.requests.responseTimeHistogram.shift();
                }
                
                // Track by endpoint
                const endpoint = req.path;
                const endpointStats = this.metricsCollectors.requests.endpointStats.get(endpoint) || {
                    count: 0,
                    avgResponseTime: 0,
                    errors: 0
                };
                
                endpointStats.count++;
                endpointStats.avgResponseTime = (endpointStats.avgResponseTime * (endpointStats.count - 1) + responseTime) / endpointStats.count;
                if (res.statusCode >= 400) {
                    endpointStats.errors++;
                }
                
                this.metricsCollectors.requests.endpointStats.set(endpoint, endpointStats);

                // Track with GA4 if available
                if (typeof global !== 'undefined' && global.blazeAnalytics) {
                    global.blazeAnalytics.trackAPI(endpoint, responseTime);
                }
            });
            
            next();
        };
    }

    // Comprehensive health check endpoint
    async performFullHealthCheck() {
        const results = {};
        const startTime = Date.now();
        
        // Run all health checks
        for (const [name, checker] of this.healthCheckers) {
            try {
                results[name] = await checker();
            } catch (error) {
                results[name] = {
                    status: 'unhealthy',
                    error: error.message,
                    lastChecked: new Date().toISOString()
                };
            }
        }

        // Overall system health
        const allHealthy = Object.values(results).every(r => r.status === 'healthy');
        const anyDegraded = Object.values(results).some(r => r.status === 'degraded');
        
        const overallStatus = allHealthy ? 'healthy' : anyDegraded ? 'degraded' : 'unhealthy';
        
        return {
            status: overallStatus,
            timestamp: new Date().toISOString(),
            checkDuration: Date.now() - startTime,
            checks: results,
            system: this.metricsCollectors.system(),
            version: process.env.npm_package_version || '1.0.0'
        };
    }

    // Metrics endpoint data
    async getMetrics() {
        const metrics = {
            ...this.metricsCollectors,
            timestamp: new Date().toISOString(),
            environment: this.environment
        };

        // Calculate request statistics
        const responseTimes = metrics.requests.responseTimeHistogram;
        if (responseTimes.length > 0) {
            responseTimes.sort((a, b) => a - b);
            metrics.requests.statistics = {
                count: responseTimes.length,
                avg: responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length,
                p50: responseTimes[Math.floor(responseTimes.length * 0.5)],
                p95: responseTimes[Math.floor(responseTimes.length * 0.95)],
                p99: responseTimes[Math.floor(responseTimes.length * 0.99)],
                min: responseTimes[0],
                max: responseTimes[responseTimes.length - 1]
            };
        }

        return metrics;
    }

    // CSP Report endpoint handler
    handleCSPReport() {
        return (req, res) => {
            const report = req.body;
            
            // Log CSP violations (in production, send to monitoring service)
            console.warn('CSP Violation Report:', {
                'document-uri': report['document-uri'],
                'violated-directive': report['violated-directive'],
                'blocked-uri': report['blocked-uri'],
                'line-number': report['line-number'],
                'source-file': report['source-file'],
                timestamp: new Date().toISOString()
            });

            // Send to Sentry if available
            if (typeof Sentry !== 'undefined') {
                Sentry.captureMessage('CSP Violation', {
                    level: 'warning',
                    tags: {
                        directive: report['violated-directive'],
                        blocked_uri: report['blocked-uri']
                    },
                    extra: report
                });
            }

            res.status(204).end();
        };
    }

    // Update metrics periodically
    updateMetrics() {
        // Add any periodic metric updates here
        this.metricsCollectors.timestamp = new Date().toISOString();
    }

    // Test database connection
    async testDatabaseConnection() {
        // This would be integrated with the actual database pool
        try {
            // Placeholder - integrate with actual DB pool
            return true;
        } catch (error) {
            return false;
        }
    }

    // Feature usage tracking
    trackFeatureUsage(feature, userId = null, metadata = {}) {
        this.metricsCollectors.features[feature] = (this.metricsCollectors.features[feature] || 0) + 1;
        
        // Log for analytics
        console.log('Feature Usage:', {
            feature,
            userId,
            metadata,
            timestamp: new Date().toISOString()
        });
    }

    // Error reporting with context
    reportError(error, context = {}) {
        const errorReport = {
            error: {
                message: error.message,
                stack: error.stack,
                name: error.name
            },
            context,
            timestamp: new Date().toISOString(),
            environment: this.environment
        };

        console.error('Error Report:', errorReport);

        // Send to Sentry if available
        if (typeof Sentry !== 'undefined') {
            Sentry.captureException(error, {
                tags: context.tags || {},
                extra: context.extra || {},
                user: context.user || {}
            });
        }
    }

    // Get HTML snippets for client-side integration
    getClientScripts() {
        return {
            sentry: this.sentryClientConfig,
            ga4: this.ga4Config,
            csp: this.generateCSPMetaTag()
        };
    }

    // Generate CSP meta tag
    generateCSPMetaTag() {
        const directives = Object.entries(this.cspConfig.directives)
            .map(([key, values]) => `${key.replace(/[A-Z]/g, '-$&').toLowerCase()} ${values.join(' ')}`)
            .join('; ');
        
        const reportDirective = this.cspConfig.reportUri ? `; report-uri ${this.cspConfig.reportUri}` : '';
        
        return `<meta http-equiv="Content-Security-Policy" content="${directives}${reportDirective}">`;
    }
}

export default InstrumentationManager;