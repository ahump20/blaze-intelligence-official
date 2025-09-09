/**
 * Blaze Intelligence Contact Form API
 * Cloudflare Worker for handling contact form submissions
 * 
 * Features:
 * - Form validation and sanitization
 * - Email notification via SendGrid
 * - Data storage in D1 database
 * - Rate limiting and spam protection
 * - Enhanced security hardening
 */

import { 
    SECURITY_HEADERS, 
    sanitizeInput, 
    VALIDATION_PATTERNS,
    RateLimiter,
    logSecurityEvent,
    validateEnvironment
} from '../security-hardening.js';

export default {
    async fetch(request, env, ctx) {
        // Validate environment variables
        try {
            validateEnvironment(env);
        } catch (error) {
            console.error('Environment validation failed:', error);
            return new Response('Service temporarily unavailable', { status: 503 });
        }

        // Enhanced security headers
        const secureHeaders = {
            ...SECURITY_HEADERS,
            'Access-Control-Allow-Origin': 'https://blaze-intelligence.pages.dev',
            'Access-Control-Allow-Methods': 'POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Requested-With',
            'Access-Control-Max-Age': '86400'
        };

        // Handle preflight requests
        if (request.method === 'OPTIONS') {
            return new Response(null, { headers: secureHeaders });
        }

        // Only allow POST requests
        if (request.method !== 'POST') {
            logSecurityEvent('invalid_method_attempt', { method: request.method });
            return new Response('Method not allowed', { 
                status: 405,
                headers: secureHeaders 
            });
        }

        // Validate request origin for additional security
        const origin = request.headers.get('origin');
        const allowedOrigins = [
            'https://blaze-intelligence.pages.dev',
            'https://austin-portfolio-deploy.pages.dev',
            'http://localhost:8000'
        ];
        
        if (origin && !allowedOrigins.includes(origin)) {
            logSecurityEvent('invalid_origin_attempt', { origin });
            return new Response('Forbidden', { 
                status: 403,
                headers: secureHeaders 
            });
        }

        try {
            // Parse request data with size limit
            const contentLength = request.headers.get('content-length');
            if (contentLength && parseInt(contentLength) > 10000) {
                logSecurityEvent('oversized_request', { size: contentLength });
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Request too large',
                    code: 'REQUEST_TOO_LARGE'
                }), {
                    status: 413,
                    headers: { 'Content-Type': 'application/json', ...secureHeaders }
                });
            }

            const formData = await request.json();
            
            // Enhanced validation with security patterns
            const validation = validateContactForm(formData);
            if (!validation.valid) {
                logSecurityEvent('form_validation_failed', { errors: validation.errors });
                return new Response(JSON.stringify({
                    success: false,
                    error: validation.error,
                    code: 'VALIDATION_ERROR'
                }), {
                    status: 400,
                    headers: {
                        'Content-Type': 'application/json',
                        ...secureHeaders
                    }
                });
            }

            // Enhanced rate limiting
            const clientIP = request.headers.get('CF-Connecting-IP') || request.headers.get('x-forwarded-for') || 'unknown';
            const rateLimiter = new RateLimiter(env.BLAZE_KV);
            const rateLimit = await rateLimiter.isRateLimited(clientIP, { requests: 3, window: 300 });
            
            if (rateLimit.limited) {
                logSecurityEvent('rate_limit_exceeded', { ip: clientIP, retryAfter: rateLimit.retryAfter });
                return new Response(JSON.stringify({
                    success: false,
                    error: 'Too many submissions. Please try again later.',
                    code: 'RATE_LIMIT_EXCEEDED',
                    retryAfter: rateLimit.retryAfter
                }), {
                    status: 429,
                    headers: {
                        'Content-Type': 'application/json',
                        'Retry-After': rateLimit.retryAfter.toString(),
                        ...secureHeaders
                    }
                });
            }

            // Store in database with enhanced sanitization
            const submissionId = crypto.randomUUID();
            const submission = {
                id: submissionId,
                name: sanitizeInput(formData.name, 'name'),
                email: sanitizeInput(formData.email, 'email'),
                organization: sanitizeInput(formData.organization || '', 'organization'),
                interest: sanitizeInput(formData.interest || ''),
                message: sanitizeInput(formData.message || ''),
                ip_address: clientIP.substring(0, 45), // Limit IP length for security
                user_agent: (request.headers.get('User-Agent') || '').substring(0, 500),
                submitted_at: new Date().toISOString(),
                status: 'pending'
            };
            
            // Log successful form submission for monitoring
            logSecurityEvent('form_submission_success', { 
                submissionId,
                hasOrganization: !!formData.organization,
                hasMessage: !!formData.message 
            });

            await storeSubmission(env, submission);

            // Send email notification
            try {
                await sendEmailNotification(env, submission);
                
                // Update submission status
                await updateSubmissionStatus(env, submissionId, 'sent');
                
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                
                // Update submission status but don't fail the request
                await updateSubmissionStatus(env, submissionId, 'email_failed');
            }

            // Track submission in analytics
            await trackSubmission(env, submission);

            return new Response(JSON.stringify({
                success: true,
                message: 'Thank you for your interest! We will get back to you within 24 hours.',
                submissionId: submissionId
            }), {
                status: 200,
                headers: {
                    'Content-Type': 'application/json',
                    ...secureHeaders
                }
            });

        } catch (error) {
            console.error('Contact form error:', error);
            logSecurityEvent('form_processing_error', { 
                error: error.message,
                stack: error.stack?.substring(0, 500)
            });
            
            return new Response(JSON.stringify({
                success: false,
                error: 'An unexpected error occurred. Please try again or email us directly at ahump20@outlook.com.',
                code: 'INTERNAL_ERROR'
            }), {
                status: 500,
                headers: {
                    'Content-Type': 'application/json',
                    ...secureHeaders
                }
            });
        }
    }
};

/**
 * Enhanced validation with security patterns
 */
function validateContactForm(data) {
    const errors = [];
    
    // Check for required fields
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
        errors.push('Name is required and must be at least 2 characters');
    }
    
    if (!data.email || typeof data.email !== 'string' || !VALIDATION_PATTERNS.email.test(data.email)) {
        errors.push('Valid email address is required');
    }
    
    // Validate field lengths and patterns
    if (data.name && (!VALIDATION_PATTERNS.name.test(data.name) || data.name.length > 50)) {
        errors.push('Name contains invalid characters or is too long');
    }
    
    if (data.organization && data.organization.length > 100) {
        errors.push('Organization name must be less than 100 characters');
    }
    
    if (data.message && data.message.length > 2000) {
        errors.push('Message must be less than 2000 characters');
    }
    
    // Check for suspicious patterns
    const suspiciousPatterns = [
        /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
        /javascript:/gi,
        /<iframe/gi,
        /on\w+\s*=/gi,
        /\b(union|select|insert|delete|drop|update|exec|script)\b/gi
    ];
    
    const allText = `${data.name} ${data.email} ${data.organization || ''} ${data.message || ''}`;
    for (const pattern of suspiciousPatterns) {
        if (pattern.test(allText)) {
            logSecurityEvent('suspicious_input_detected', { 
                pattern: pattern.source,
                field: 'form_submission'
            });
            errors.push('Invalid characters detected in form submission');
            break;
        }
    }
    
    return {
        valid: errors.length === 0,
        error: errors.join('; '),
        errors: errors
    };
}


/**
 * Check rate limiting
 */
async function checkRateLimit(env, clientIP) {
    try {
        const key = `rate_limit:${clientIP}`;
        const current = await env.BLAZE_KV.get(key, 'json');
        const now = Date.now();
        const windowMs = 60000; // 1 minute window
        const maxRequests = 3; // 3 requests per minute
        
        if (!current) {
            await env.BLAZE_KV.put(key, JSON.stringify({
                count: 1,
                windowStart: now
            }), { expirationTtl: 3600 });
            
            return { allowed: true };
        }
        
        if (now - current.windowStart > windowMs) {
            // Reset window
            await env.BLAZE_KV.put(key, JSON.stringify({
                count: 1,
                windowStart: now
            }), { expirationTtl: 3600 });
            
            return { allowed: true };
        }
        
        if (current.count >= maxRequests) {
            const retryAfter = Math.ceil((windowMs - (now - current.windowStart)) / 1000);
            return { 
                allowed: false,
                retryAfter: retryAfter
            };
        }
        
        // Increment count
        await env.BLAZE_KV.put(key, JSON.stringify({
            count: current.count + 1,
            windowStart: current.windowStart
        }), { expirationTtl: 3600 });
        
        return { allowed: true };
        
    } catch (error) {
        console.error('Rate limit check failed:', error);
        // Allow request on error to avoid blocking legitimate users
        return { allowed: true };
    }
}

/**
 * Store submission in D1 database
 */
async function storeSubmission(env, submission) {
    try {
        const query = `
            INSERT INTO contact_submissions (
                id, name, email, organization, interest, message, 
                ip_address, user_agent, submitted_at, status
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        await env.BLAZE_DB.prepare(query).bind(
            submission.id,
            submission.name,
            submission.email,
            submission.organization,
            submission.interest,
            submission.message,
            submission.ip_address,
            submission.user_agent,
            submission.submitted_at,
            submission.status
        ).run();
        
    } catch (error) {
        console.error('Database storage failed:', error);
        throw error;
    }
}

/**
 * Update submission status
 */
async function updateSubmissionStatus(env, submissionId, status) {
    try {
        const query = `UPDATE contact_submissions SET status = ? WHERE id = ?`;
        await env.BLAZE_DB.prepare(query).bind(status, submissionId).run();
    } catch (error) {
        console.error('Status update failed:', error);
    }
}

/**
 * Send email notification
 */
async function sendEmailNotification(env, submission) {
    const emailData = {
        personalizations: [{
            to: [{ email: 'ahump20@outlook.com', name: 'Austin Humphrey' }]
        }],
        from: { 
            email: 'noreply@blaze-intelligence.com', 
            name: 'Blaze Intelligence Contact Form' 
        },
        subject: `New Contact Form Submission - ${submission.interest || 'General Inquiry'}`,
        content: [{
            type: 'text/html',
            value: generateEmailTemplate(submission)
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
        throw new Error(`SendGrid API failed: ${response.status}`);
    }
}

/**
 * Generate email template
 */
function generateEmailTemplate(submission) {
    return `
        <html>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #BF5700 0%, #FF8C00 100%); color: white; padding: 20px; text-align: center;">
                <h1>New Contact Form Submission</h1>
                <p>Blaze Intelligence Platform</p>
            </div>
            
            <div style="padding: 20px; background: #f8f9fa;">
                <h2>Contact Details</h2>
                <p><strong>Name:</strong> ${submission.name}</p>
                <p><strong>Email:</strong> ${submission.email}</p>
                <p><strong>Organization:</strong> ${submission.organization || 'Not provided'}</p>
                <p><strong>Interest Level:</strong> ${submission.interest || 'Not specified'}</p>
                <p><strong>Submitted:</strong> ${new Date(submission.submitted_at).toLocaleString()}</p>
                
                <h3>Message</h3>
                <div style="background: white; padding: 15px; border-left: 4px solid #BF5700; border-radius: 4px;">
                    <p>${submission.message || 'No message provided'}</p>
                </div>
                
                <h3>Technical Details</h3>
                <p><strong>Submission ID:</strong> ${submission.id}</p>
                <p><strong>IP Address:</strong> ${submission.ip_address}</p>
                <p><strong>User Agent:</strong> ${submission.user_agent}</p>
            </div>
            
            <div style="background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px;">
                <p>This email was generated automatically by the Blaze Intelligence contact form system.</p>
                <p>Reply directly to this email to respond to ${submission.name}</p>
            </div>
        </body>
        </html>
    `;
}

/**
 * Track submission analytics
 */
async function trackSubmission(env, submission) {
    try {
        // Store analytics data
        const analyticsKey = `analytics:submissions:${new Date().toISOString().split('T')[0]}`;
        const existing = await env.BLAZE_KV.get(analyticsKey, 'json') || { count: 0, submissions: [] };
        
        existing.count += 1;
        existing.submissions.push({
            id: submission.id,
            interest: submission.interest,
            timestamp: submission.submitted_at,
            organization: submission.organization ? 'provided' : 'not_provided'
        });
        
        await env.BLAZE_KV.put(analyticsKey, JSON.stringify(existing), { expirationTtl: 86400 * 30 }); // 30 days
        
    } catch (error) {
        console.error('Analytics tracking failed:', error);
        // Don't fail the request for analytics issues
    }
}