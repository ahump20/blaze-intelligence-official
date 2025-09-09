-- Blaze Intelligence Database Schema
-- D1 Database for production Cloudflare Workers

-- Contact form submissions table
CREATE TABLE IF NOT EXISTS contact_submissions (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    organization TEXT,
    interest TEXT,
    message TEXT,
    ip_address TEXT,
    user_agent TEXT,
    submitted_at TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    responded_at TEXT,
    response_notes TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Users table for authentication system
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'user',
    subscription_tier TEXT DEFAULT 'free',
    email_verified INTEGER DEFAULT 0,
    email_verification_token TEXT,
    password_reset_token TEXT,
    password_reset_expires TEXT,
    last_login_at TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- User sessions table for JWT management
CREATE TABLE IF NOT EXISTS user_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    jwt_token TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now')),
    last_used_at TEXT DEFAULT (datetime('now')),
    ip_address TEXT,
    user_agent TEXT,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Subscription plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price_monthly INTEGER NOT NULL, -- cents
    price_yearly INTEGER, -- cents
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    features TEXT, -- JSON array
    api_calls_limit INTEGER DEFAULT 1000,
    teams_limit INTEGER DEFAULT 1,
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now'))
);

-- User subscriptions table
CREATE TABLE IF NOT EXISTS user_subscriptions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    plan_id TEXT NOT NULL,
    stripe_subscription_id TEXT,
    stripe_customer_id TEXT,
    status TEXT NOT NULL DEFAULT 'active',
    current_period_start TEXT,
    current_period_end TEXT,
    trial_end TEXT,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans (id)
);

-- Teams/Organizations table
CREATE TABLE IF NOT EXISTS teams (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    subscription_id TEXT,
    settings TEXT, -- JSON
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (owner_id) REFERENCES users (id),
    FOREIGN KEY (subscription_id) REFERENCES user_subscriptions (id)
);

-- Team members table
CREATE TABLE IF NOT EXISTS team_members (
    id TEXT PRIMARY KEY,
    team_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL DEFAULT 'member',
    permissions TEXT, -- JSON array
    invited_at TEXT,
    joined_at TEXT,
    status TEXT DEFAULT 'active',
    FOREIGN KEY (team_id) REFERENCES teams (id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    UNIQUE(team_id, user_id)
);

-- API usage tracking
CREATE TABLE IF NOT EXISTS api_usage (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    endpoint TEXT NOT NULL,
    method TEXT NOT NULL,
    response_status INTEGER,
    processing_time_ms INTEGER,
    timestamp TEXT NOT NULL DEFAULT (datetime('now')),
    date_key TEXT NOT NULL, -- YYYY-MM-DD for daily aggregation
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Sports data storage (for analytics)
CREATE TABLE IF NOT EXISTS sports_data_cache (
    id TEXT PRIMARY KEY,
    league TEXT NOT NULL, -- 'mlb', 'nfl', 'nba', 'ncaa'
    team TEXT,
    data_type TEXT NOT NULL, -- 'roster', 'games', 'stats', etc.
    data TEXT NOT NULL, -- JSON data
    cached_at TEXT NOT NULL DEFAULT (datetime('now')),
    expires_at TEXT,
    source TEXT -- data source identifier
);

-- User analytics preferences
CREATE TABLE IF NOT EXISTS user_analytics_settings (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    favorite_teams TEXT, -- JSON array
    notification_preferences TEXT, -- JSON
    dashboard_layout TEXT, -- JSON
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Email templates
CREATE TABLE IF NOT EXISTS email_templates (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    subject TEXT NOT NULL,
    html_content TEXT NOT NULL,
    text_content TEXT,
    variables TEXT, -- JSON array of template variables
    active INTEGER DEFAULT 1,
    created_at TEXT DEFAULT (datetime('now')),
    updated_at TEXT DEFAULT (datetime('now'))
);

-- Audit log for compliance
CREATE TABLE IF NOT EXISTS audit_log (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    action TEXT NOT NULL,
    resource_type TEXT,
    resource_id TEXT,
    details TEXT, -- JSON
    ip_address TEXT,
    user_agent TEXT,
    timestamp TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_contact_submissions_submitted_at ON contact_submissions(submitted_at);
CREATE INDEX IF NOT EXISTS idx_contact_submissions_status ON contact_submissions(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires_at ON user_sessions(expires_at);
CREATE INDEX IF NOT EXISTS idx_api_usage_user_id_date ON api_usage(user_id, date_key);
CREATE INDEX IF NOT EXISTS idx_sports_data_cache_league_team ON sports_data_cache(league, team);
CREATE INDEX IF NOT EXISTS idx_sports_data_cache_expires_at ON sports_data_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_audit_log_user_id ON audit_log(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_log_timestamp ON audit_log(timestamp);

-- Insert default subscription plans
INSERT OR IGNORE INTO subscription_plans (
    id, name, price_monthly, price_yearly, features, api_calls_limit, teams_limit
) VALUES 
(
    'starter', 
    'Starter', 
    9900, -- $99/month
    99900, -- $999/year
    '["Basic analytics", "Team performance tracking", "Standard reporting", "Email support"]',
    10000,
    1
),
(
    'professional', 
    'Professional', 
    29900, -- $299/month
    299900, -- $2999/year
    '["Advanced analytics", "Predictive modeling", "Custom dashboards", "API access", "Priority support"]',
    100000,
    5
),
(
    'enterprise', 
    'Enterprise', 
    0, -- Custom pricing
    0,
    '["Full platform access", "Custom integrations", "Dedicated support", "White-label options", "Implementation consulting"]',
    1000000,
    -1 -- unlimited
);

-- Insert default email templates
INSERT OR IGNORE INTO email_templates (id, name, subject, html_content, text_content, variables) VALUES 
(
    'welcome', 
    'Welcome Email',
    'Welcome to Blaze Intelligence!',
    '<h1>Welcome {{name}}!</h1><p>Thank you for joining Blaze Intelligence. Your account is ready to use.</p>',
    'Welcome {{name}}! Thank you for joining Blaze Intelligence. Your account is ready to use.',
    '["name"]'
),
(
    'contact_auto_reply',
    'Contact Form Auto Reply',
    'Thank you for contacting Blaze Intelligence',
    '<h1>Thank you {{name}}!</h1><p>We have received your message and will get back to you within 24 hours.</p>',
    'Thank you {{name}}! We have received your message and will get back to you within 24 hours.',
    '["name"]'
);

-- Trigger to update updated_at timestamps
CREATE TRIGGER IF NOT EXISTS update_users_updated_at 
    AFTER UPDATE ON users
    BEGIN
        UPDATE users SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_user_subscriptions_updated_at 
    AFTER UPDATE ON user_subscriptions
    BEGIN
        UPDATE user_subscriptions SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_teams_updated_at 
    AFTER UPDATE ON teams
    BEGIN
        UPDATE teams SET updated_at = datetime('now') WHERE id = NEW.id;
    END;

CREATE TRIGGER IF NOT EXISTS update_user_analytics_settings_updated_at 
    AFTER UPDATE ON user_analytics_settings
    BEGIN
        UPDATE user_analytics_settings SET updated_at = datetime('now') WHERE id = NEW.id;
    END;