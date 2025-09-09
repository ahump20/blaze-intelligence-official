import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { body, validationResult } from 'express-validator';
import pool from '../db.js';
import { generateTokens, authenticateToken } from './authMiddleware.js';

const router = express.Router();

// Validation middleware
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

// Register new user
router.post('/register',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('organization').optional().trim(),
    body('primarySport').optional().trim()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password, fullName, organization, primarySport } = req.body;
      
      // Check if user exists
      const existingUser = await pool.query(
        'SELECT id FROM users WHERE email = $1',
        [email]
      );
      
      if (existingUser.rows.length > 0) {
        return res.status(400).json({ error: 'Email already registered' });
      }
      
      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      const verificationToken = uuidv4();
      
      // Create user
      const result = await pool.query(
        `INSERT INTO users (email, password_hash, full_name, organization, primary_sport, verification_token)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING id, email, full_name, role`,
        [email, passwordHash, fullName, organization, primarySport, verificationToken]
      );
      
      const user = result.rows[0];
      
      // Create default subscription (free tier)
      await pool.query(
        `INSERT INTO subscriptions (user_id, plan_type, status, trial_ends_at)
         VALUES ($1, 'free', 'active', $2)`,
        [user.id, new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)] // 14 day trial
      );
      
      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);
      
      // Store refresh token in database
      await pool.query(
        `INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          user.id,
          refreshToken,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          req.ip,
          req.get('user-agent')
        ]
      );
      
      res.status(201).json({
        message: 'Registration successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role
        },
        accessToken,
        refreshToken,
        verificationToken // In production, send this via email
      });
      
    } catch (error) {
      console.error('Registration error:', error);
      res.status(500).json({ error: 'Registration failed' });
    }
  }
);

// Login
router.post('/login',
  [
    body('email').isEmail().normalizeEmail(),
    body('password').notEmpty()
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email, password } = req.body;
      
      // Get user
      const result = await pool.query(
        'SELECT id, email, password_hash, full_name, role, email_verified FROM users WHERE email = $1',
        [email]
      );
      
      if (result.rows.length === 0) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      const user = result.rows[0];
      
      // Verify password
      const validPassword = await bcrypt.compare(password, user.password_hash);
      if (!validPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
      
      // Generate tokens
      const { accessToken, refreshToken } = generateTokens(user.id);
      
      // Store refresh token
      await pool.query(
        `INSERT INTO sessions (user_id, refresh_token, expires_at, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5)`,
        [
          user.id,
          refreshToken,
          new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          req.ip,
          req.get('user-agent')
        ]
      );
      
      // Get subscription info
      const subscriptionResult = await pool.query(
        'SELECT plan_type, status, trial_ends_at FROM subscriptions WHERE user_id = $1',
        [user.id]
      );
      
      res.json({
        message: 'Login successful',
        user: {
          id: user.id,
          email: user.email,
          fullName: user.full_name,
          role: user.role,
          emailVerified: user.email_verified
        },
        subscription: subscriptionResult.rows[0] || null,
        accessToken,
        refreshToken
      });
      
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: 'Login failed' });
    }
  }
);

// Refresh token
router.post('/refresh',
  [body('refreshToken').notEmpty()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { refreshToken } = req.body;
      
      // Verify refresh token
      jwt.verify(
        refreshToken,
        process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-key-change-in-production',
        async (err, decoded) => {
          if (err) {
            return res.status(403).json({ error: 'Invalid refresh token' });
          }
          
          // Check if token exists in database
          const sessionResult = await pool.query(
            'SELECT * FROM sessions WHERE refresh_token = $1 AND expires_at > NOW()',
            [refreshToken]
          );
          
          if (sessionResult.rows.length === 0) {
            return res.status(403).json({ error: 'Refresh token not found or expired' });
          }
          
          // Generate new tokens
          const { accessToken, refreshToken: newRefreshToken } = generateTokens(decoded.userId);
          
          // Update refresh token in database
          await pool.query(
            'UPDATE sessions SET refresh_token = $1, expires_at = $2 WHERE id = $3',
            [
              newRefreshToken,
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
              sessionResult.rows[0].id
            ]
          );
          
          res.json({ accessToken, refreshToken: newRefreshToken });
        }
      );
    } catch (error) {
      console.error('Token refresh error:', error);
      res.status(500).json({ error: 'Token refresh failed' });
    }
  }
);

// Logout
router.post('/logout', authenticateToken, async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    
    // Remove all sessions for this user
    await pool.query(
      'DELETE FROM sessions WHERE user_id = $1',
      [req.user.id]
    );
    
    res.json({ message: 'Logout successful' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Logout failed' });
  }
});

// Get current user
router.get('/me', authenticateToken, async (req, res) => {
  try {
    // Get subscription info
    const subscriptionResult = await pool.query(
      'SELECT * FROM subscriptions WHERE user_id = $1',
      [req.user.id]
    );
    
    // Get saved teams
    const teamsResult = await pool.query(
      'SELECT * FROM user_teams WHERE user_id = $1 ORDER BY created_at DESC LIMIT 5',
      [req.user.id]
    );
    
    res.json({
      user: req.user,
      subscription: subscriptionResult.rows[0] || null,
      savedTeams: teamsResult.rows
    });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to get user info' });
  }
});

// Verify email
router.post('/verify-email',
  [body('token').notEmpty()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { token } = req.body;
      
      const result = await pool.query(
        'UPDATE users SET email_verified = true, verification_token = NULL WHERE verification_token = $1 RETURNING id, email',
        [token]
      );
      
      if (result.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid verification token' });
      }
      
      res.json({ message: 'Email verified successfully' });
    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ error: 'Verification failed' });
    }
  }
);

// Request password reset
router.post('/forgot-password',
  [body('email').isEmail().normalizeEmail()],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { email } = req.body;
      const resetToken = uuidv4();
      const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
      
      const result = await pool.query(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE email = $3 RETURNING id',
        [resetToken, expires, email]
      );
      
      if (result.rows.length === 0) {
        // Don't reveal if email exists
        return res.json({ message: 'If the email exists, a reset link has been sent' });
      }
      
      // In production, send email with reset link
      res.json({ 
        message: 'Password reset link sent',
        resetToken // Remove this in production
      });
    } catch (error) {
      console.error('Password reset request error:', error);
      res.status(500).json({ error: 'Failed to process request' });
    }
  }
);

// Reset password
router.post('/reset-password',
  [
    body('token').notEmpty(),
    body('newPassword').isLength({ min: 8 })
  ],
  handleValidationErrors,
  async (req, res) => {
    try {
      const { token, newPassword } = req.body;
      
      // Find user with valid reset token
      const userResult = await pool.query(
        'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
        [token]
      );
      
      if (userResult.rows.length === 0) {
        return res.status(400).json({ error: 'Invalid or expired reset token' });
      }
      
      const userId = userResult.rows[0].id;
      const passwordHash = await bcrypt.hash(newPassword, 10);
      
      // Update password and clear reset token
      await pool.query(
        'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
        [passwordHash, userId]
      );
      
      res.json({ message: 'Password reset successful' });
    } catch (error) {
      console.error('Password reset error:', error);
      res.status(500).json({ error: 'Password reset failed' });
    }
  }
);

export default router;