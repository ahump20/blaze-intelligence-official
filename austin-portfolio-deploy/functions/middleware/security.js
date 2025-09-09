/**
 * Enterprise Security Middleware - Cloudflare Pages Functions
 * Implements comprehensive security measures for production deployment
 */

// Security configuration
const SECURITY_CONFIG = {
  rateLimit: {
    requests: 2000,
    windowMs: 15 * 60 * 1000, // 15 minutes
    skipSuccessfulRequests: true
  },
  cors: {
    allowedOrigins: [
      'https://blaze-intelligence.com',
      'https://www.blaze-intelligence.com',
      'https://*.blaze-intelligence-production.pages.dev'
    ],
    credentials: false,
    maxAge: 86400
  },
  contentSecurity: {
    scriptSrc: ["'self'", "'unsafe-inline'", 'https://cdn.tailwindcss.com', 'https://unpkg.com'],
    styleSrc: ["'self'", "'unsafe-inline'", 'https://cdnjs.cloudflare.com'],
    imgSrc: ["'self'", 'data:', 'https:'],
    connectSrc: ["'self'", 'https://*.blaze-intelligence.com']
  }
};

// IP-based rate limiting store (simplified in-memory for demo)
const rateLimitStore = new Map();

export function applySecurityMiddleware(request) {
  const url = new URL(request.url);
  const clientIP = request.headers.get('CF-Connecting-IP') || 'unknown';
  const userAgent = request.headers.get('User-Agent') || '';
  
  // Security headers
  const securityHeaders = {
    // Security Headers
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=(), payment=()',
    
    // Content Security Policy
    'Content-Security-Policy': buildCSP(),
    
    // CORS Headers
    'Access-Control-Allow-Origin': getCORSOrigin(request),
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-API-Key, X-Requested-With',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'false',
    
    // Performance Headers
    'Cache-Control': 'public, max-age=300, s-maxage=600',
    'X-Robots-Tag': 'index, follow',
    
    // Custom Security Headers
    'X-Powered-By': 'Blaze Intelligence Enterprise',
    'X-Security-Level': 'enterprise',
    'X-Rate-Limit-Requests': SECURITY_CONFIG.rateLimit.requests.toString(),
    'X-Rate-Limit-Window': (SECURITY_CONFIG.rateLimit.windowMs / 1000).toString()
  };

  // Rate limiting check
  const rateLimitResult = checkRateLimit(clientIP, url.pathname);
  if (rateLimitResult.blocked) {
    return createRateLimitResponse(rateLimitResult);
  }

  // Bot detection
  const botResult = detectBot(userAgent, clientIP);
  if (botResult.blocked) {
    return createBotBlockResponse(botResult);
  }

  // Security validation
  const securityResult = validateRequest(request);
  if (!securityResult.valid) {
    return createSecurityErrorResponse(securityResult);
  }

  return {
    allowed: true,
    headers: securityHeaders,
    rateLimitInfo: rateLimitResult,
    securityInfo: {
      clientIP,
      userAgent: userAgent.substring(0, 100),
      timestamp: new Date().toISOString()
    }
  };
}

function buildCSP() {
  const csp = SECURITY_CONFIG.contentSecurity;
  return [
    `default-src 'self'`,
    `script-src ${csp.scriptSrc.join(' ')}`,
    `style-src ${csp.styleSrc.join(' ')}`,
    `img-src ${csp.imgSrc.join(' ')}`,
    `connect-src ${csp.connectSrc.join(' ')}`,
    `font-src 'self' https://cdnjs.cloudflare.com`,
    `object-src 'none'`,
    `media-src 'self'`,
    `frame-src 'none'`,
    `worker-src 'self'`,
    `manifest-src 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `upgrade-insecure-requests`
  ].join('; ');
}

function getCORSOrigin(request) {
  const origin = request.headers.get('Origin');
  const allowedOrigins = SECURITY_CONFIG.cors.allowedOrigins;
  
  // Check exact matches
  if (allowedOrigins.includes(origin)) {
    return origin;
  }
  
  // Check wildcard patterns
  for (const allowed of allowedOrigins) {
    if (allowed.includes('*')) {
      const pattern = allowed.replace('*', '.*');
      const regex = new RegExp(`^${pattern}$`);
      if (regex.test(origin)) {
        return origin;
      }
    }
  }
  
  // Default to first allowed origin for API calls
  return allowedOrigins[0] || '*';
}

function checkRateLimit(clientIP, pathname) {
  const now = Date.now();
  const windowStart = now - SECURITY_CONFIG.rateLimit.windowMs;
  
  // Clean old entries
  for (const [key, data] of rateLimitStore.entries()) {
    if (data.lastRequest < windowStart) {
      rateLimitStore.delete(key);
    }
  }
  
  const key = `${clientIP}:${pathname}`;
  const clientData = rateLimitStore.get(key) || { 
    requests: 0, 
    lastRequest: now,
    firstRequest: now 
  };
  
  // Check if within rate limit
  if (clientData.requests >= SECURITY_CONFIG.rateLimit.requests) {
    const resetTime = clientData.firstRequest + SECURITY_CONFIG.rateLimit.windowMs;
    
    if (now < resetTime) {
      return {
        blocked: true,
        requests: clientData.requests,
        limit: SECURITY_CONFIG.rateLimit.requests,
        resetTime: new Date(resetTime).toISOString(),
        retryAfter: Math.ceil((resetTime - now) / 1000)
      };
    } else {
      // Reset window
      clientData.requests = 0;
      clientData.firstRequest = now;
    }
  }
  
  // Update counter
  clientData.requests++;
  clientData.lastRequest = now;
  rateLimitStore.set(key, clientData);
  
  return {
    blocked: false,
    requests: clientData.requests,
    limit: SECURITY_CONFIG.rateLimit.requests,
    remaining: SECURITY_CONFIG.rateLimit.requests - clientData.requests,
    resetTime: new Date(clientData.firstRequest + SECURITY_CONFIG.rateLimit.windowMs).toISOString()
  };
}

function detectBot(userAgent, clientIP) {
  const botPatterns = [
    /malicious/i, /attack/i, /hack/i, /exploit/i
  ];
  
  const allowedBots = [
    /googlebot/i, /bingbot/i, /slurp/i,
    /facebookexternalhit/i, /twitterbot/i,
    /linkedinbot/i, /whatsapp/i,
    /curl/i, /wget/i, /node/i, /python/i,
    /postman/i, /insomnia/i, /test/i
  ];
  
  // Check for allowed bots first
  for (const pattern of allowedBots) {
    if (pattern.test(userAgent)) {
      return { blocked: false, type: 'allowed-bot' };
    }
  }
  
  // Check for blocked bot patterns
  for (const pattern of botPatterns) {
    if (pattern.test(userAgent)) {
      return {
        blocked: true,
        type: 'blocked-bot',
        reason: 'Automated request detected',
        pattern: pattern.source
      };
    }
  }
  
  // Only block obviously malicious user agents
  if (userAgent.length < 3) {
    return {
      blocked: true,
      type: 'suspicious-client',
      reason: 'Invalid or missing user agent'
    };
  }
  
  return { blocked: false, type: 'human' };
}

function validateRequest(request) {
  const url = new URL(request.url);
  
  // Check for malicious patterns in URL
  const maliciousPatterns = [
    /\.\./,  // Path traversal
    /<script/i,  // XSS attempts
    /union.*select/i,  // SQL injection
    /exec\(/i,  // Code execution
    /eval\(/i,  // Code evaluation
  ];
  
  const fullUrl = url.pathname + url.search;
  
  for (const pattern of maliciousPatterns) {
    if (pattern.test(fullUrl)) {
      return {
        valid: false,
        reason: 'Malicious pattern detected',
        pattern: pattern.source,
        location: 'url'
      };
    }
  }
  
  // Validate headers for injection attempts
  const dangerousHeaders = ['x-forwarded-for', 'x-real-ip', 'host'];
  
  for (const headerName of dangerousHeaders) {
    const headerValue = request.headers.get(headerName);
    if (headerValue) {
      for (const pattern of maliciousPatterns) {
        if (pattern.test(headerValue)) {
          return {
            valid: false,
            reason: 'Malicious header detected',
            header: headerName,
            pattern: pattern.source
          };
        }
      }
    }
  }
  
  return { valid: true };
}

function createRateLimitResponse(rateLimitResult) {
  return new Response(JSON.stringify({
    type: '/errors/rate-limit-exceeded',
    title: 'Rate Limit Exceeded',
    status: 429,
    detail: `Too many requests. Limit: ${rateLimitResult.limit} requests per 15 minutes.`,
    retryAfter: rateLimitResult.retryAfter,
    resetTime: rateLimitResult.resetTime,
    timestamp: new Date().toISOString()
  }), {
    status: 429,
    headers: {
      'Content-Type': 'application/problem+json',
      'Retry-After': rateLimitResult.retryAfter.toString(),
      'X-RateLimit-Limit': rateLimitResult.limit.toString(),
      'X-RateLimit-Remaining': '0',
      'X-RateLimit-Reset': rateLimitResult.resetTime
    }
  });
}

function createBotBlockResponse(botResult) {
  return new Response(JSON.stringify({
    type: '/errors/access-denied',
    title: 'Access Denied',
    status: 403,
    detail: 'Automated access detected. Please contact support for API access.',
    reason: botResult.reason,
    timestamp: new Date().toISOString(),
    support: 'ahump20@outlook.com'
  }), {
    status: 403,
    headers: {
      'Content-Type': 'application/problem+json',
      'X-Block-Reason': botResult.reason,
      'X-Block-Type': botResult.type
    }
  });
}

function createSecurityErrorResponse(securityResult) {
  return new Response(JSON.stringify({
    type: '/errors/security-violation',
    title: 'Security Violation',
    status: 400,
    detail: 'Request blocked due to security policy violation.',
    reason: securityResult.reason,
    timestamp: new Date().toISOString()
  }), {
    status: 400,
    headers: {
      'Content-Type': 'application/problem+json',
      'X-Security-Violation': securityResult.reason
    }
  });
}

// Export for use in API handlers
export { SECURITY_CONFIG };