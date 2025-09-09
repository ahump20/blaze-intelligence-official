/**
 * Security Hardening Configuration for Blaze Intelligence
 * Implements comprehensive security measures across the platform
 */

// Security headers configuration
export const SECURITY_HEADERS = {
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'X-XSS-Protection': '1; mode=block',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'accelerometer=(), camera=(), microphone=(), geolocation=()',
  'Content-Security-Policy': `
    default-src 'self';
    script-src 'self' 'unsafe-inline' https://cdn.tailwindcss.com https://cdnjs.cloudflare.com https://www.googletagmanager.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://cdn.tailwindcss.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' data: https:;
    connect-src 'self' https://*.humphrey-austin20.workers.dev https://api.stripe.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
  `.replace(/\s+/g, ' ').trim()
};

// Rate limiting configuration
export const RATE_LIMITS = {
  // API endpoints
  contact: { requests: 5, window: 300 }, // 5 requests per 5 minutes
  auth: { requests: 10, window: 600 }, // 10 requests per 10 minutes  
  stripe: { requests: 20, window: 3600 }, // 20 requests per hour
  
  // General endpoints
  api: { requests: 100, window: 3600 }, // 100 requests per hour
  static: { requests: 1000, window: 3600 } // 1000 static requests per hour
};

// Input validation patterns
export const VALIDATION_PATTERNS = {
  email: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
  name: /^[a-zA-Z\s'-]{2,50}$/,
  phone: /^\+?[1-9]\d{1,14}$/,
  organization: /^[a-zA-Z0-9\s&.-]{2,100}$/,
  userId: /^[a-zA-Z0-9_-]{8,36}$/
};

// Sanitization functions
export function sanitizeInput(input, type = 'general') {
  if (!input || typeof input !== 'string') return '';
  
  // Remove potentially dangerous characters
  let sanitized = input
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=\s*"[^"]*"/gi, '')
    .replace(/on\w+\s*=\s*'[^']*'/gi, '')
    .trim();
  
  // Type-specific sanitization
  switch (type) {
    case 'email':
      return sanitized.toLowerCase().substring(0, 254);
    case 'name':
      return sanitized.substring(0, 50);
    case 'organization':
      return sanitized.substring(0, 100);
    case 'phone':
      return sanitized.replace(/[^\d+\-\s()]/g, '').substring(0, 20);
    default:
      return sanitized.substring(0, 1000);
  }
}

// Request validation middleware
export function validateRequest(request, expectedFields = []) {
  const errors = [];
  const contentType = request.headers.get('content-type');
  
  // Check content type for POST requests
  if (request.method === 'POST' && !contentType?.includes('application/json')) {
    errors.push('Invalid content type');
  }
  
  // Validate required fields
  expectedFields.forEach(field => {
    if (!request.body?.[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  return {
    valid: errors.length === 0,
    errors
  };
}

// Rate limiting implementation
export class RateLimiter {
  constructor(kv) {
    this.kv = kv;
  }
  
  async isRateLimited(key, limit) {
    const now = Date.now();
    const windowStart = now - (limit.window * 1000);
    const countKey = `rate_limit:${key}:${Math.floor(now / (limit.window * 1000))}`;
    
    try {
      const currentCount = await this.kv.get(countKey);
      const count = currentCount ? parseInt(currentCount) : 0;
      
      if (count >= limit.requests) {
        return { limited: true, retryAfter: limit.window };
      }
      
      await this.kv.put(countKey, (count + 1).toString(), { expirationTtl: limit.window });
      return { limited: false, remaining: limit.requests - count - 1 };
    } catch (error) {
      console.error('Rate limiting error:', error);
      return { limited: false, remaining: limit.requests };
    }
  }
}

// Security monitoring
export function logSecurityEvent(event, details = {}) {
  const timestamp = new Date().toISOString();
  const logEntry = {
    timestamp,
    event,
    details,
    severity: getSeverityLevel(event),
    source: 'blaze-security'
  };
  
  console.log('[SECURITY]', JSON.stringify(logEntry));
  
  // In production, send to security monitoring service
  if (details.severity === 'high') {
    // Alert security team
    console.warn('[SECURITY ALERT]', logEntry);
  }
}

function getSeverityLevel(event) {
  const highSeverityEvents = [
    'brute_force_attempt',
    'sql_injection_attempt', 
    'xss_attempt',
    'unauthorized_access',
    'data_breach_attempt'
  ];
  
  const mediumSeverityEvents = [
    'rate_limit_exceeded',
    'invalid_auth_token',
    'suspicious_pattern'
  ];
  
  if (highSeverityEvents.includes(event)) return 'high';
  if (mediumSeverityEvents.includes(event)) return 'medium';
  return 'low';
}

// JWT security utilities
export async function createSecureJWT(payload, secret, expiresIn = '1h') {
  const header = { alg: 'HS256', typ: 'JWT' };
  const now = Math.floor(Date.now() / 1000);
  
  const jwtPayload = {
    ...payload,
    iat: now,
    exp: now + parseExpiresIn(expiresIn),
    jti: crypto.randomUUID() // Unique token ID
  };
  
  const encodedHeader = base64URLEncode(JSON.stringify(header));
  const encodedPayload = base64URLEncode(JSON.stringify(jwtPayload));
  const signature = await sign(`${encodedHeader}.${encodedPayload}`, secret);
  
  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export async function verifySecureJWT(token, secret) {
  try {
    const [headerB64, payloadB64, signature] = token.split('.');
    const data = `${headerB64}.${payloadB64}`;
    
    // Verify signature
    const expectedSignature = await sign(data, secret);
    if (signature !== expectedSignature) {
      throw new Error('Invalid signature');
    }
    
    // Verify payload
    const payload = JSON.parse(base64URLDecode(payloadB64));
    const now = Math.floor(Date.now() / 1000);
    
    if (payload.exp && payload.exp < now) {
      throw new Error('Token expired');
    }
    
    if (payload.nbf && payload.nbf > now) {
      throw new Error('Token not yet valid');
    }
    
    return { valid: true, payload };
  } catch (error) {
    return { valid: false, error: error.message };
  }
}

// Utility functions
function parseExpiresIn(expiresIn) {
  if (typeof expiresIn === 'number') return expiresIn;
  
  const match = expiresIn.match(/^(\d+)([smhd])$/);
  if (!match) return 3600; // Default 1 hour
  
  const [, value, unit] = match;
  const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
  return parseInt(value) * multipliers[unit];
}

function base64URLEncode(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

function base64URLDecode(str) {
  str += '==='.slice(0, (4 - str.length % 4) % 4);
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

async function sign(data, secret) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return base64URLEncode(String.fromCharCode(...new Uint8Array(signature)));
}

// Environment validation
export function validateEnvironment(env) {
  const required = [
    'STRIPE_SECRET_KEY',
    'JWT_SECRET',
    'SENDGRID_API_KEY'
  ];
  
  const missing = required.filter(key => !env[key]);
  
  if (missing.length > 0) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }
  
  // Validate secret formats
  if (env.STRIPE_SECRET_KEY && !env.STRIPE_SECRET_KEY.startsWith('sk_')) {
    throw new Error('Invalid Stripe secret key format');
  }
  
  if (env.JWT_SECRET && env.JWT_SECRET.length < 32) {
    throw new Error('JWT secret must be at least 32 characters');
  }
}

export default {
  SECURITY_HEADERS,
  RATE_LIMITS,
  VALIDATION_PATTERNS,
  sanitizeInput,
  validateRequest,
  RateLimiter,
  logSecurityEvent,
  createSecureJWT,
  verifySecureJWT,
  validateEnvironment
};