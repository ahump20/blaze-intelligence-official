import jwt from 'jsonwebtoken';
import pool from '../db.js';

// Generate JWT tokens
export const generateTokens = (userId) => {
  const accessToken = jwt.sign(
    { userId, type: 'access' },
    process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    { expiresIn: '15m' }
  );
  
  const refreshToken = jwt.sign(
    { userId, type: 'refresh' },
    process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
    { expiresIn: '7d' }
  );
  
  return { accessToken, refreshToken };
};

// Verify JWT middleware
export const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ error: 'Access token required' });
    }
    
    jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      async (err, decoded) => {
        if (err) {
          return res.status(403).json({ error: 'Invalid or expired token' });
        }
        
        // Get user from database
        const result = await pool.query(
          'SELECT id, email, full_name, role FROM users WHERE id = $1',
          [decoded.userId]
        );
        
        if (result.rows.length === 0) {
          return res.status(404).json({ error: 'User not found' });
        }
        
        req.user = result.rows[0];
        next();
      }
    );
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Authentication failed' });
  }
};

// Check subscription status middleware
export const requireSubscription = (requiredPlan = 'pro') => {
  return async (req, res, next) => {
    try {
      const result = await pool.query(
        `SELECT s.* FROM subscriptions s 
         WHERE s.user_id = $1 AND s.status = 'active'`,
        [req.user.id]
      );
      
      if (result.rows.length === 0) {
        return res.status(403).json({ 
          error: 'Active subscription required',
          requiredPlan 
        });
      }
      
      const subscription = result.rows[0];
      
      // Check if user has required plan level
      const planHierarchy = { free: 0, pro: 1, enterprise: 2 };
      if (planHierarchy[subscription.plan_type] < planHierarchy[requiredPlan]) {
        return res.status(403).json({ 
          error: 'Insufficient subscription plan',
          currentPlan: subscription.plan_type,
          requiredPlan 
        });
      }
      
      req.subscription = subscription;
      next();
    } catch (error) {
      console.error('Subscription check error:', error);
      res.status(500).json({ error: 'Failed to verify subscription' });
    }
  };
};

// Rate limiting per user
export const userRateLimit = (maxRequests = 100, windowMs = 60000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    if (!req.user) return next();
    
    const userId = req.user.id;
    const now = Date.now();
    const userRequests = requests.get(userId) || [];
    
    // Clean old requests
    const validRequests = userRequests.filter(time => now - time < windowMs);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({ 
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000) 
      });
    }
    
    validRequests.push(now);
    requests.set(userId, validRequests);
    next();
  };
};

// Track API usage
export const trackApiUsage = async (req, res, next) => {
  const startTime = Date.now();
  
  // Capture the original send function
  const originalSend = res.send;
  
  res.send = function(data) {
    res.send = originalSend;
    
    // Track the usage
    if (req.user) {
      const responseTime = Date.now() - startTime;
      pool.query(
        `INSERT INTO api_usage (user_id, endpoint, method, status_code, response_time_ms, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          req.user.id,
          req.originalUrl,
          req.method,
          res.statusCode,
          responseTime,
          req.ip,
          req.get('user-agent')
        ]
      ).catch(err => console.error('Failed to track API usage:', err));
    }
    
    return res.send(data);
  };
  
  next();
};