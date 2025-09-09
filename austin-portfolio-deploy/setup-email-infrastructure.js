/**
 * Email Infrastructure Setup for Blaze Intelligence
 * Comprehensive email system with templates and automation
 */

// Email templates
export const EMAIL_TEMPLATES = {
    // Contact form notification
    CONTACT_NOTIFICATION: {
        subject: 'New Contact Form Submission - {{interest}}',
        template: `
            <html>
            <head>
                <style>
                    .header { background: linear-gradient(135deg, #BF5700 0%, #FF8C00 100%); color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; background: #f8f9fa; font-family: Arial, sans-serif; }
                    .footer { background: #343a40; color: white; padding: 15px; text-align: center; font-size: 12px; }
                    .highlight { background: white; padding: 15px; border-left: 4px solid #BF5700; border-radius: 4px; margin: 10px 0; }
                    .button { display: inline-block; padding: 12px 24px; background: #BF5700; color: white; text-decoration: none; border-radius: 5px; margin: 10px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>New Contact Form Submission</h1>
                    <p>Blaze Intelligence Platform</p>
                </div>
                
                <div class="content">
                    <h2>Contact Details</h2>
                    <p><strong>Name:</strong> {{name}}</p>
                    <p><strong>Email:</strong> {{email}}</p>
                    <p><strong>Organization:</strong> {{organization}}</p>
                    <p><strong>Interest Level:</strong> {{interest}}</p>
                    <p><strong>Submitted:</strong> {{submittedAt}}</p>
                    
                    <h3>Message</h3>
                    <div class="highlight">{{message}}</div>
                    
                    <a href="mailto:{{email}}" class="button">Reply Directly</a>
                    
                    <h3>Technical Details</h3>
                    <p><strong>Submission ID:</strong> {{submissionId}}</p>
                    <p><strong>IP Address:</strong> {{ipAddress}}</p>
                    <p><strong>Priority Score:</strong> {{priorityScore}}/10</p>
                </div>
                
                <div class="footer">
                    <p>This email was generated automatically by the Blaze Intelligence contact form system.</p>
                    <p>Response SLA: 4 hours for enterprise inquiries, 24 hours for general inquiries</p>
                </div>
            </body>
            </html>
        `
    },

    // Welcome email for new users
    WELCOME_EMAIL: {
        subject: 'Welcome to Blaze Intelligence - Your Sports Analytics Journey Begins',
        template: `
            <html>
            <head>
                <style>
                    .header { background: linear-gradient(135deg, #BF5700 0%, #FF8C00 100%); color: white; padding: 30px; text-align: center; }
                    .content { padding: 30px; background: #ffffff; font-family: Arial, sans-serif; line-height: 1.6; }
                    .footer { background: #f8f9fa; padding: 20px; text-align: center; font-size: 12px; color: #666; }
                    .button { display: inline-block; padding: 15px 30px; background: #BF5700; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                    .feature-box { background: #f8f9fa; padding: 20px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #BF5700; }
                    .stats { background: #e8f4f8; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Welcome to Blaze Intelligence!</h1>
                    <p>Turn Data Into Dominance</p>
                </div>
                
                <div class="content">
                    <h2>Hello {{name}},</h2>
                    
                    <p>Welcome to the future of sports analytics! You've just joined a platform that's revolutionizing how teams, coaches, and analysts approach performance data.</p>
                    
                    <div class="stats">
                        <h3>What You Get Access To:</h3>
                        <p><strong>96.2% Prediction Accuracy</strong> • <strong>&lt;100ms Latency</strong> • <strong>2.8M+ Data Points</strong></p>
                    </div>
                    
                    <h3>Your Next Steps:</h3>
                    
                    <div class="feature-box">
                        <h4>🔓 Verify Your Email</h4>
                        <p>Click the button below to verify your email and unlock full platform access.</p>
                        <a href="{{verificationLink}}" class="button">Verify Email Address</a>
                    </div>
                    
                    <div class="feature-box">
                        <h4>📊 Explore Your Dashboard</h4>
                        <p>Access real-time analytics, AI-powered insights, and our exclusive multi-AI analysis engine featuring ChatGPT 5, Claude Opus 4.1, and Gemini 2.5 Pro.</p>
                    </div>
                    
                    <div class="feature-box">
                        <h4>🎯 Start Your Free Trial</h4>
                        <p>Your 14-day free trial includes full access to all premium features. No credit card required.</p>
                    </div>
                    
                    <h3>Need Help Getting Started?</h3>
                    <p>Our team is here to help you maximize your analytics potential:</p>
                    <ul>
                        <li>📧 Email: <a href="mailto:support@blaze-intelligence.pages.dev">support@blaze-intelligence.pages.dev</a></li>
                        <li>📞 Phone: (210) 273-5538</li>
                        <li>💬 Live Chat: Available in your dashboard</li>
                    </ul>
                    
                    <p>Ready to dominate your competition with data-driven insights?</p>
                    <a href="https://blaze-intelligence.pages.dev/user-dashboard.html" class="button">Access Your Dashboard</a>
                </div>
                
                <div class="footer">
                    <p>Blaze Intelligence LLC | 8319 Monument Oak, Boerne, TX 78015</p>
                    <p>This email was sent to {{email}}. <a href="{{unsubscribeLink}}">Unsubscribe</a> | <a href="https://blaze-intelligence.pages.dev/privacy.html">Privacy Policy</a></p>
                </div>
            </body>
            </html>
        `
    },

    // Email verification
    EMAIL_VERIFICATION: {
        subject: 'Verify Your Email - Blaze Intelligence',
        template: `
            <html>
            <head>
                <style>
                    .header { background: linear-gradient(135deg, #BF5700 0%, #FF8C00 100%); color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #ffffff; font-family: Arial, sans-serif; line-height: 1.6; text-align: center; }
                    .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
                    .button { display: inline-block; padding: 15px 30px; background: #BF5700; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                    .code { background: #f8f9fa; padding: 20px; border-radius: 8px; font-size: 24px; font-weight: bold; letter-spacing: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Email Verification Required</h1>
                    <p>Blaze Intelligence</p>
                </div>
                
                <div class="content">
                    <h2>Hi {{name}},</h2>
                    <p>Please verify your email address to complete your Blaze Intelligence account setup.</p>
                    
                    <p>Click the button below or use the verification code:</p>
                    <div class="code">{{verificationCode}}</div>
                    
                    <a href="{{verificationLink}}" class="button">Verify Email Address</a>
                    
                    <p><small>This link will expire in 24 hours for security reasons.</small></p>
                    <p><small>If you didn't create an account with us, please ignore this email.</small></p>
                </div>
                
                <div class="footer">
                    <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                    <p>{{verificationLink}}</p>
                </div>
            </body>
            </html>
        `
    },

    // Password reset
    PASSWORD_RESET: {
        subject: 'Reset Your Password - Blaze Intelligence',
        template: `
            <html>
            <head>
                <style>
                    .header { background: linear-gradient(135deg, #BF5700 0%, #FF8C00 100%); color: white; padding: 20px; text-align: center; }
                    .content { padding: 30px; background: #ffffff; font-family: Arial, sans-serif; line-height: 1.6; }
                    .footer { background: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; }
                    .button { display: inline-block; padding: 15px 30px; background: #BF5700; color: white; text-decoration: none; border-radius: 5px; margin: 20px 0; font-weight: bold; }
                    .warning { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Password Reset Request</h1>
                    <p>Blaze Intelligence</p>
                </div>
                
                <div class="content">
                    <h2>Hi {{name}},</h2>
                    <p>We received a request to reset your password for your Blaze Intelligence account.</p>
                    
                    <a href="{{resetLink}}" class="button">Reset Your Password</a>
                    
                    <div class="warning">
                        <strong>Security Notice:</strong>
                        <ul>
                            <li>This link will expire in 1 hour</li>
                            <li>If you didn't request this, please ignore this email</li>
                            <li>Your current password will remain unchanged until you create a new one</li>
                        </ul>
                    </div>
                    
                    <p>If you continue to have problems, contact our support team at <a href="mailto:support@blaze-intelligence.pages.dev">support@blaze-intelligence.pages.dev</a></p>
                </div>
                
                <div class="footer">
                    <p>If you're having trouble clicking the button, copy and paste this URL into your browser:</p>
                    <p>{{resetLink}}</p>
                </div>
            </body>
            </html>
        `
    }
};

// Email sending utility
export class EmailService {
    constructor(env) {
        this.sendgridApiKey = env.SENDGRID_API_KEY;
        this.fromEmail = 'noreply@blaze-intelligence.pages.dev';
        this.fromName = 'Blaze Intelligence';
    }

    async sendEmail(template, data, options = {}) {
        try {
            const emailTemplate = EMAIL_TEMPLATES[template];
            if (!emailTemplate) {
                throw new Error(`Email template '${template}' not found`);
            }

            const subject = this.replaceTokens(emailTemplate.subject, data);
            const htmlContent = this.replaceTokens(emailTemplate.template, data);

            const emailData = {
                personalizations: [{
                    to: [{ 
                        email: data.email, 
                        name: data.name || data.email 
                    }],
                    subject: subject
                }],
                from: { 
                    email: options.from || this.fromEmail,
                    name: options.fromName || this.fromName
                },
                content: [{
                    type: 'text/html',
                    value: htmlContent
                }],
                tracking_settings: {
                    click_tracking: { enable: true },
                    open_tracking: { enable: true },
                    subscription_tracking: { enable: true }
                }
            };

            // Add reply-to if specified
            if (options.replyTo) {
                emailData.reply_to = {
                    email: options.replyTo,
                    name: options.replyToName || options.replyTo
                };
            }

            const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${this.sendgridApiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(emailData)
            });

            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`SendGrid API failed (${response.status}): ${errorText}`);
            }

            return {
                success: true,
                messageId: response.headers.get('X-Message-Id')
            };

        } catch (error) {
            console.error('Email sending failed:', error);
            throw error;
        }
    }

    replaceTokens(template, data) {
        return template.replace(/\{\{(\w+)\}\}/g, (match, token) => {
            const value = data[token];
            if (value === undefined || value === null) {
                console.warn(`Missing token value for: ${token}`);
                return match;
            }
            return String(value);
        });
    }

    // Specialized methods for common email types
    async sendContactNotification(submission) {
        const priorityScore = this.calculatePriorityScore(submission);
        
        return this.sendEmail('CONTACT_NOTIFICATION', {
            ...submission,
            submittedAt: new Date(submission.submitted_at).toLocaleString(),
            organization: submission.organization || 'Not provided',
            interest: submission.interest || 'General Inquiry',
            message: submission.message || 'No message provided',
            priorityScore
        }, {
            replyTo: submission.email,
            replyToName: submission.name
        });
    }

    async sendWelcomeEmail(user, verificationToken) {
        const verificationLink = `https://blaze-intelligence.pages.dev/verify-email?token=${verificationToken}`;
        const unsubscribeLink = `https://blaze-intelligence.pages.dev/unsubscribe?token=${verificationToken}`;
        
        return this.sendEmail('WELCOME_EMAIL', {
            name: user.name,
            email: user.email,
            verificationLink,
            unsubscribeLink
        });
    }

    async sendEmailVerification(user, verificationToken, verificationCode) {
        const verificationLink = `https://blaze-intelligence.pages.dev/verify-email?token=${verificationToken}`;
        
        return this.sendEmail('EMAIL_VERIFICATION', {
            name: user.name,
            email: user.email,
            verificationCode,
            verificationLink
        });
    }

    async sendPasswordReset(user, resetToken) {
        const resetLink = `https://blaze-intelligence.pages.dev/reset-password?token=${resetToken}`;
        
        return this.sendEmail('PASSWORD_RESET', {
            name: user.name,
            email: user.email,
            resetLink
        });
    }

    // Calculate priority score for contact submissions
    calculatePriorityScore(submission) {
        let score = 1;
        
        // Higher score for enterprise/team inquiries
        if (submission.organization && submission.organization.toLowerCase().includes('team')) score += 3;
        if (submission.organization && submission.organization.toLowerCase().includes('school')) score += 2;
        if (submission.organization && submission.organization.toLowerCase().includes('university')) score += 2;
        if (submission.organization && submission.organization.toLowerCase().includes('college')) score += 2;
        
        // Higher score for specific interests
        if (submission.interest && submission.interest.includes('Enterprise')) score += 4;
        if (submission.interest && submission.interest.includes('Team')) score += 3;
        if (submission.interest && submission.interest.includes('Demo')) score += 2;
        
        // Bonus for detailed messages
        if (submission.message && submission.message.length > 200) score += 1;
        if (submission.message && submission.message.length > 500) score += 1;
        
        return Math.min(score, 10); // Cap at 10
    }
}

// Email automation workflows
export class EmailAutomation {
    constructor(env) {
        this.emailService = new EmailService(env);
        this.kv = env.BLAZE_KV;
        this.db = env.BLAZE_DB;
    }

    // New user registration workflow
    async handleNewUserRegistration(user) {
        try {
            // Generate verification token
            const verificationToken = crypto.randomUUID();
            const verificationCode = Math.random().toString(36).substring(2, 8).toUpperCase();
            
            // Store verification data
            await this.kv.put(`verify:${verificationToken}`, JSON.stringify({
                userId: user.id,
                email: user.email,
                code: verificationCode,
                created: Date.now()
            }), { expirationTtl: 86400 }); // 24 hours
            
            // Send verification email
            await this.emailService.sendEmailVerification(user, verificationToken, verificationCode);
            
            // Schedule welcome email for after verification
            await this.scheduleWelcomeEmail(user.id, verificationToken);
            
            return { success: true, verificationToken };
            
        } catch (error) {
            console.error('Registration email workflow failed:', error);
            throw error;
        }
    }

    // Contact form submission workflow
    async handleContactSubmission(submission) {
        try {
            // Send immediate notification
            await this.emailService.sendContactNotification(submission);
            
            // Schedule follow-up automation
            await this.scheduleFollowUpSequence(submission);
            
            return { success: true };
            
        } catch (error) {
            console.error('Contact submission workflow failed:', error);
            throw error;
        }
    }

    // Schedule welcome email after verification
    async scheduleWelcomeEmail(userId, verificationToken) {
        const scheduledTask = {
            type: 'welcome_email',
            userId,
            verificationToken,
            scheduledFor: Date.now() + (5 * 60 * 1000), // 5 minutes after registration
            attempts: 0
        };
        
        await this.kv.put(`scheduled:${crypto.randomUUID()}`, JSON.stringify(scheduledTask), {
            expirationTtl: 7 * 24 * 3600 // 7 days
        });
    }

    // Schedule follow-up sequence for contact submissions
    async scheduleFollowUpSequence(submission) {
        // Follow-up email after 48 hours if no response
        const followUpTask = {
            type: 'contact_followup',
            submissionId: submission.id,
            scheduledFor: Date.now() + (48 * 60 * 60 * 1000), // 48 hours
            attempts: 0
        };
        
        await this.kv.put(`scheduled:${crypto.randomUUID()}`, JSON.stringify(followUpTask), {
            expirationTtl: 7 * 24 * 3600
        });
    }

    // Process scheduled email tasks (called by cron job)
    async processScheduledTasks() {
        // This would be implemented as a separate cron worker
        // For now, it serves as documentation of the intended workflow
        console.log('Email automation processing scheduled for cron implementation');
    }
}

export default {
    EMAIL_TEMPLATES,
    EmailService,
    EmailAutomation
};