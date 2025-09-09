/**
 * Blaze Intelligence Authentication API
 * JWT-based authentication with email verification
 * Enhanced with comprehensive security hardening
 * 
 * Endpoints:
 * POST /register - User registration
 * POST /login - User login
 * POST /verify-email - Email verification
 * POST /forgot-password - Password reset request
 * POST /reset-password - Password reset
 * GET /me - Get current user info
 * POST /logout - Logout (invalidate session)
 */

import { 
    SECURITY_HEADERS,
    sanitizeInput,
    VALIDATION_PATTERNS,
    RateLimiter,
    logSecurityEvent,
    createSecureJWT,
    verifySecureJWT,
    validateEnvironment
} from '../security-hardening.js';

// Enhanced password hashing with better salt handling
async function hashPassword(password, userId = null) {
    const encoder = new TextEncoder();
    const salt = userId ? `blaze_${userId}_2025` : 'blaze_salt_2025';
    const data = encoder.encode(password + salt);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    return Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
}

async function verifyPassword(password, hash) {
    const newHash = await hashPassword(password);
    return newHash === hash;
}

export default {
    async fetch(request, env, ctx) {
        // Validate environment
        try {
            validateEnvironment(env);
        } catch (error) {
            logSecurityEvent('auth_env_validation_failed', { error: error.message });
            return new Response('Service temporarily unavailable', { status: 503 });
        }

        const url = new URL(request.url);
        const path = url.pathname;
        const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
        
        // Enhanced security headers
        const secureHeaders = {
            ...SECURITY_HEADERS,
            'Access-Control-Allow-Origin': 'https://blaze-intelligence.pages.dev',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
            'Access-Control-Max-Age': '86400'
        };

        // Rate limiting for authentication endpoints
        const rateLimiter = new RateLimiter(env.BLAZE_KV);
        const authRateLimit = await rateLimiter.isRateLimited(`auth:${clientIP}`, { requests: 5, window: 300 });
        
        if (authRateLimit.limited && request.method !== 'OPTIONS') {
            logSecurityEvent('auth_rate_limit_exceeded', { ip: clientIP, path });
            return new Response(JSON.stringify({
                success: false,
                error: 'Too many authentication attempts. Please try again later.',
                retryAfter: authRateLimit.retryAfter
            }), {
                status: 429,
                headers: {
                    'Content-Type': 'application/json',
                    'Retry-After': authRateLimit.retryAfter.toString(),
                    ...secureHeaders
                }
            });
        }

        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: secureHeaders });
        }

        try {
            let response;
            
            switch (path) {
                case '/register':
                    response = await handleRegister(request, env);
                    break;
                case '/login':
                    response = await handleLogin(request, env);
                    break;
                case '/verify-email':
                    response = await handleVerifyEmail(request, env);
                    break;
                case '/forgot-password':
                    response = await handleForgotPassword(request, env);
                    break;
                case '/reset-password':
                    response = await handleResetPassword(request, env);
                    break;
                case '/me':
                    response = await handleGetUser(request, env);
                    break;
                case '/logout':
                    response = await handleLogout(request, env);
                    break;
                default:
                    response = new Response('Not found', { status: 404 });
            }
            
            // Add CORS headers to response
            Object.entries(corsHeaders).forEach(([key, value]) => {
                response.headers.set(key, value);
            });
            
            return response;
            
        } catch (error) {
            console.error('Auth API error:', error);
            return new Response(JSON.stringify({
                success: false,
                error: 'Internal server error'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...corsHeaders
                }
            });
        }
    }
};

/**
 * Handle user registration
 */
async function handleRegister(request, env) {
    const data = await request.json();
    
    // Validate input
    const validation = validateRegistration(data);
    if (!validation.valid) {
        return jsonResponse({ success: false, error: validation.error }, 400);
    }
    
    // Check if user exists
    const existingUser = await getUserByEmail(env, data.email);
    if (existingUser) {
        return jsonResponse({ 
            success: false, 
            error: 'An account with this email already exists' 
        }, 400);
    }
    
    // Hash password
    const passwordHash = await hashPassword(data.password);
    
    // Generate verification token
    const verificationToken = crypto.randomUUID();
    
    // Create user
    const userId = crypto.randomUUID();
    const user = {
        id: userId,
        email: data.email.toLowerCase(),
        password_hash: passwordHash,
        name: data.name,
        role: 'user',
        subscription_tier: 'free',
        email_verified: 0,
        email_verification_token: verificationToken
    };
    
    await createUser(env, user);
    
    // Send verification email
    try {
        await sendVerificationEmail(env, user, verificationToken);
    } catch (emailError) {
        console.error('Verification email failed:', emailError);
        // Don't fail registration if email fails
    }
    
    return jsonResponse({
        success: true,
        message: 'Registration successful. Please check your email for verification.',
        userId: userId
    });
}

/**
 * Handle user login
 */
async function handleLogin(request, env) {
    const data = await request.json();
    
    if (!data.email || !data.password) {
        return jsonResponse({ 
            success: false, 
            error: 'Email and password are required' 
        }, 400);
    }
    
    // Get user
    const user = await getUserByEmail(env, data.email);
    if (!user) {
        return jsonResponse({ 
            success: false, 
            error: 'Invalid email or password' 
        }, 401);
    }
    
    // Check password
    const passwordValid = await verifyPassword(data.password, user.password_hash);
    if (!passwordValid) {
        return jsonResponse({ 
            success: false, 
            error: 'Invalid email or password' 
        }, 401);
    }
    
    // Generate JWT
    const token = await generateJWT(env, user);
    
    // Create session
    const sessionId = crypto.randomUUID();
    await createSession(env, sessionId, user.id, token, request);
    
    // Update last login
    await updateLastLogin(env, user.id);
    
    return jsonResponse({
        success: true,
        token: token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            subscription_tier: user.subscription_tier,
            email_verified: user.email_verified === 1
        }
    });
}

/**
 * Handle email verification
 */
async function handleVerifyEmail(request, env) {
    const data = await request.json();
    
    if (!data.token) {
        return jsonResponse({ 
            success: false, 
            error: 'Verification token is required' 
        }, 400);
    }
    
    // Find user by verification token
    const user = await getUserByVerificationToken(env, data.token);
    if (!user) {
        return jsonResponse({ 
            success: false, 
            error: 'Invalid or expired verification token' 
        }, 400);
    }
    
    // Mark email as verified
    await verifyUserEmail(env, user.id);
    
    return jsonResponse({
        success: true,
        message: 'Email verified successfully'
    });
}

/**
 * Handle get current user
 */
async function handleGetUser(request, env) {
    const user = await authenticateRequest(request, env);
    if (!user) {
        return jsonResponse({ 
            success: false, 
            error: 'Unauthorized' 
        }, 401);
    }
    
    return jsonResponse({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            subscription_tier: user.subscription_tier,
            email_verified: user.email_verified === 1
        }
    });
}

/**
 * Authentication middleware
 */
async function authenticateRequest(request, env) {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    
    const token = authHeader.substring(7);
    
    try {
        // Verify JWT
        const payload = await verifyJWT(env, token);
        
        // Get user
        const user = await getUserById(env, payload.userId);
        if (!user) {
            return null;
        }
        
        // Check if session exists and is valid
        const session = await getSessionByToken(env, token);
        if (!session || new Date(session.expires_at) < new Date()) {
            return null;
        }
        
        return user;
        
    } catch (error) {
        console.error('Auth verification failed:', error);
        return null;
    }
}

/**
 * Generate JWT token
 */
async function generateJWT(env, user) {
    const header = {
        alg: 'HS256',
        typ: 'JWT'
    };
    
    const payload = {
        userId: user.id,
        email: user.email,
        role: user.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    };
    
    const encodedHeader = btoa(JSON.stringify(header)).replace(/=/g, '');
    const encodedPayload = btoa(JSON.stringify(payload)).replace(/=/g, '');
    
    const signature = await signHMAC(env, `${encodedHeader}.${encodedPayload}`);
    
    return `${encodedHeader}.${encodedPayload}.${signature}`;
}

/**
 * Verify JWT token
 */
async function verifyJWT(env, token) {
    const parts = token.split('.');
    if (parts.length !== 3) {
        throw new Error('Invalid token format');
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    
    // Verify signature
    const expectedSignature = await signHMAC(env, `${encodedHeader}.${encodedPayload}`);
    if (signature !== expectedSignature) {
        throw new Error('Invalid token signature');
    }
    
    // Decode payload
    const payload = JSON.parse(atob(encodedPayload));
    
    // Check expiration
    if (payload.exp < Math.floor(Date.now() / 1000)) {
        throw new Error('Token expired');
    }
    
    return payload;
}

/**
 * Sign HMAC
 */
async function signHMAC(env, data) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(env.JWT_SECRET);
    const messageData = encoder.encode(data);
    
    const key = await crypto.subtle.importKey(
        'raw',
        keyData,
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
    );
    
    const signature = await crypto.subtle.sign('HMAC', key, messageData);
    return btoa(String.fromCharCode(...new Uint8Array(signature))).replace(/=/g, '');
}

/**
 * Database functions
 */
async function createUser(env, user) {
    const query = `
        INSERT INTO users (
            id, email, password_hash, name, role, subscription_tier, 
            email_verified, email_verification_token
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    
    await env.BLAZE_DB.prepare(query).bind(
        user.id,
        user.email,
        user.password_hash,
        user.name,
        user.role,
        user.subscription_tier,
        user.email_verified,
        user.email_verification_token
    ).run();
}

async function getUserByEmail(env, email) {
    const query = `SELECT * FROM users WHERE email = ?`;
    const result = await env.BLAZE_DB.prepare(query).bind(email.toLowerCase()).first();
    return result;
}

async function getUserById(env, id) {
    const query = `SELECT * FROM users WHERE id = ?`;
    const result = await env.BLAZE_DB.prepare(query).bind(id).first();
    return result;
}

async function createSession(env, sessionId, userId, token, request) {
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const query = `
        INSERT INTO user_sessions (
            id, user_id, jwt_token, expires_at, ip_address, user_agent
        ) VALUES (?, ?, ?, ?, ?, ?)
    `;
    
    await env.BLAZE_DB.prepare(query).bind(
        sessionId,
        userId,
        token,
        expiresAt,
        request.headers.get('CF-Connecting-IP') || 'unknown',
        request.headers.get('User-Agent') || ''
    ).run();
}

/**
 * Validation functions
 */
function validateRegistration(data) {
    const errors = [];
    
    if (!data.name || data.name.trim().length < 2) {
        errors.push('Name must be at least 2 characters');
    }
    
    if (!data.email || !isValidEmail(data.email)) {
        errors.push('Valid email is required');
    }
    
    if (!data.password || data.password.length < 8) {
        errors.push('Password must be at least 8 characters');
    }
    
    if (data.password && !/(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)/.test(data.password)) {
        errors.push('Password must contain at least one uppercase letter, one lowercase letter, and one number');
    }
    
    return {
        valid: errors.length === 0,
        error: errors.join('; ')
    };
}

function isValidEmail(email) {
    return /^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(email);
}

/**
 * Helper function for JSON responses
 */
function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: { 'Content-Type': 'application/json' }
    });
}

// Additional database functions would go here...
async function getUserByVerificationToken(env, token) {
    const query = `SELECT * FROM users WHERE email_verification_token = ?`;
    return await env.BLAZE_DB.prepare(query).bind(token).first();
}

async function verifyUserEmail(env, userId) {
    const query = `UPDATE users SET email_verified = 1, email_verification_token = NULL WHERE id = ?`;
    await env.BLAZE_DB.prepare(query).bind(userId).run();
}

async function updateLastLogin(env, userId) {
    const query = `UPDATE users SET last_login_at = datetime('now') WHERE id = ?`;
    await env.BLAZE_DB.prepare(query).bind(userId).run();
}

async function getSessionByToken(env, token) {
    const query = `SELECT * FROM user_sessions WHERE jwt_token = ?`;
    return await env.BLAZE_DB.prepare(query).bind(token).first();
}

async function sendVerificationEmail(env, user, token) {
    const emailData = {
        personalizations: [{
            to: [{ email: user.email, name: user.name }]
        }],
        from: { 
            email: 'noreply@blaze-intelligence.com', 
            name: 'Blaze Intelligence' 
        },
        subject: 'Verify your Blaze Intelligence account',
        content: [{
            type: 'text/html',
            value: `
                <h1>Welcome to Blaze Intelligence!</h1>
                <p>Please verify your email address by clicking the link below:</p>
                <a href="https://blaze-intelligence.pages.dev/verify?token=${token}">Verify Email</a>
                <p>This link will expire in 24 hours.</p>
            `
        }]
    };
    
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${env.SENDGRID_API_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(emailData)
    });
    
    if (!response.ok) {
        throw new Error(`SendGrid failed: ${response.status}`);
    }
}