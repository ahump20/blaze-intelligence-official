/**
 * Mobile App API Endpoints
 * Provides REST API endpoints specifically for the Blaze Intelligence mobile app
 */

import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';
import { body, validationResult } from 'express-validator';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';

const router = express.Router();

// Rate limiting for mobile endpoints
const mobileRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this device, please try again later.',
    retryAfter: 900
  }
});

// CORS configuration for mobile app
const corsOptions = {
  origin: ['capacitor://localhost', 'ionic://localhost', 'http://localhost'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Platform', 'X-App-Version'],
  credentials: true
};

router.use(cors(corsOptions));
router.use(mobileRateLimit);

// Multer configuration for video uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // 100MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMimes = ['video/mp4', 'video/quicktime', 'video/x-msvideo'];
    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only MP4, MOV, and AVI are allowed.'));
    }
  }
});

// Authentication middleware
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    // Verify token (implement your JWT verification logic)
    const userId = await verifyToken(token);
    req.userId = userId;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

// Mock token verification (replace with actual implementation)
async function verifyToken(token) {
  // This should verify JWT token and return user ID
  if (token === 'demo_token') {
    return 'demo_user_123';
  }
  throw new Error('Invalid token');
}

// Authentication endpoints
router.post('/auth/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    
    // Demo authentication (replace with actual logic)
    if (email === 'demo@blaze-intelligence.com' && password === 'demo123') {
      const token = crypto.randomBytes(32).toString('hex');
      
      res.json({
        success: true,
        token: token,
        user: {
          id: 'demo_user_123',
          name: 'Austin Humphrey',
          email: email,
          blazeScore: 85,
          sport: 'Baseball',
          position: 'Pitcher',
          team: 'Cardinals'
        }
      });
    } else {
      res.status(401).json({
        success: false,
        error: 'Invalid credentials'
      });
    }
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/auth/register', [
  body('name').isLength({ min: 2 }),
  body('email').isEmail().normalizeEmail(),
  body('password').isLength({ min: 6 }),
  body('sport').isIn(['Baseball', 'Football', 'Basketball'])
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password, sport, position, team } = req.body;
    const token = crypto.randomBytes(32).toString('hex');
    
    res.json({
      success: true,
      token: token,
      user: {
        id: crypto.randomUUID(),
        name,
        email,
        sport,
        position,
        team,
        blazeScore: 0,
        memberSince: new Date().getFullYear().toString()
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Sports data endpoints
router.get('/sports/:league/:team', authenticateToken, async (req, res) => {
  try {
    const { league, team } = req.params;
    
    // Mock sports data (replace with actual API calls)
    const sportsData = {
      MLB: {
        Cardinals: { blazeScore: 152, wins: 85, losses: 77, streak: 'W3' },
      },
      NFL: {
        Titans: { blazeScore: 74, wins: 8, losses: 9, streak: 'L2' },
      },
      NBA: {
        Grizzlies: { blazeScore: 129, wins: 42, losses: 40, streak: 'W1' },
      },
      NCAA: {
        Longhorns: { blazeScore: 59, wins: 15, losses: 12, streak: 'W2' },
      }
    };

    const data = sportsData[league.toUpperCase()]?.[team];
    if (!data) {
      return res.status(404).json({ error: 'Team not found' });
    }

    res.json({
      [team]: {
        ...data,
        lastUpdated: new Date().toISOString(),
        league: league.toUpperCase()
      }
    });
  } catch (error) {
    console.error('Sports data error:', error);
    res.status(500).json({ error: 'Failed to fetch sports data' });
  }
});

// Video upload endpoint
router.post('/video/upload', authenticateToken, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file uploaded' });
    }

    const videoId = crypto.randomUUID();
    const fileName = `${videoId}_${Date.now()}.mp4`;
    
    // In production, upload to S3 or similar storage
    // For now, save locally (implement S3 upload here)
    const uploadPath = path.join(process.cwd(), 'uploads', fileName);
    await fs.writeFile(uploadPath, req.file.buffer);

    // Queue for analysis
    const analysisId = crypto.randomUUID();
    
    res.json({
      success: true,
      videoId: videoId,
      analysisId: analysisId,
      uploadUrl: `/uploads/${fileName}`,
      message: 'Video uploaded successfully, analysis queued'
    });
  } catch (error) {
    console.error('Video upload error:', error);
    res.status(500).json({ error: 'Failed to upload video' });
  }
});

// Analysis endpoints
router.get('/analysis/:analysisId', authenticateToken, async (req, res) => {
  try {
    const { analysisId } = req.params;
    
    // Mock analysis results (replace with actual analysis data)
    const analysisResult = {
      id: analysisId,
      status: 'completed',
      blazeScore: Math.floor(70 + Math.random() * 30),
      biomechanics: {
        hipRotation: Math.floor(75 + Math.random() * 25),
        shoulderAlignment: Math.floor(70 + Math.random() * 30),
        kneeFlexion: Math.floor(65 + Math.random() * 35),
        spineAngle: Math.floor(80 + Math.random() * 20),
      },
      microExpressions: {
        confidence: Math.floor(60 + Math.random() * 40),
        focus: Math.floor(70 + Math.random() * 30),
        determination: Math.floor(75 + Math.random() * 25),
        composure: Math.floor(65 + Math.random() * 35),
      },
      recommendations: [
        'Increase hip rotation during follow-through',
        'Maintain shoulder alignment throughout motion',
        'Focus on consistent knee flexion angle',
        'Excellent determination and focus detected'
      ],
      championshipPotential: Math.floor(60 + Math.random() * 40),
      completedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      analysis: analysisResult
    });
  } catch (error) {
    console.error('Analysis fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch analysis' });
  }
});

// Blaze Score calculation
router.post('/analytics/blaze-score', authenticateToken, [
  body('biomechanics').isObject(),
  body('microExpressions').isObject(),
  body('sport').isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { biomechanics, microExpressions, sport } = req.body;
    
    // Calculate Blaze Score (implement actual algorithm)
    const biomechanicsScore = Object.values(biomechanics).reduce((a, b) => a + b, 0) / Object.keys(biomechanics).length;
    const mentalScore = Object.values(microExpressions).reduce((a, b) => a + b, 0) / Object.keys(microExpressions).length;
    
    // Sport-specific weights
    const sportWeights = {
      Baseball: { biomechanics: 0.6, mental: 0.4 },
      Football: { biomechanics: 0.7, mental: 0.3 },
      Basketball: { biomechanics: 0.5, mental: 0.5 }
    };
    
    const weights = sportWeights[sport] || { biomechanics: 0.6, mental: 0.4 };
    const blazeScore = Math.round(
      (biomechanicsScore * weights.biomechanics) + (mentalScore * weights.mental)
    );

    res.json({
      success: true,
      blazeScore: blazeScore,
      breakdown: {
        biomechanics: Math.round(biomechanicsScore),
        mental: Math.round(mentalScore),
        weights: weights
      },
      calculatedAt: new Date().toISOString()
    });
  } catch (error) {
    console.error('Blaze Score calculation error:', error);
    res.status(500).json({ error: 'Failed to calculate Blaze Score' });
  }
});

// User profile endpoints
router.get('/user/profile', authenticateToken, async (req, res) => {
  try {
    // Mock user profile (replace with database query)
    const userProfile = {
      id: req.userId,
      name: 'Austin Humphrey',
      email: 'ahump20@outlook.com',
      sport: 'Baseball',
      position: 'Pitcher',
      team: 'Cardinals',
      blazeScore: 85,
      totalAnalyses: 43,
      memberSince: '2024',
      achievements: [
        'Champion Mindset',
        'Weekly Warrior',
        'Form Master',
        'Data Driven'
      ],
      settings: {
        notifications: true,
        autoAnalysis: true,
        shareData: false,
        darkMode: true,
      }
    };

    res.json({
      success: true,
      profile: userProfile
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

router.put('/user/profile', authenticateToken, [
  body('name').optional().isLength({ min: 2 }),
  body('sport').optional().isIn(['Baseball', 'Football', 'Basketball']),
  body('position').optional().isString(),
  body('team').optional().isString()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // Update user profile in database
    const updatedProfile = {
      ...req.body,
      updatedAt: new Date().toISOString()
    };

    res.json({
      success: true,
      profile: updatedProfile,
      message: 'Profile updated successfully'
    });
  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});

// Training data collection
router.post('/training/collect', authenticateToken, async (req, res) => {
  try {
    const trainingData = {
      id: crypto.randomUUID(),
      userId: req.userId,
      ...req.body,
      collectedAt: new Date().toISOString()
    };

    // Store training data (implement database storage)
    
    res.json({
      success: true,
      trainingDataId: trainingData.id,
      message: 'Training data collected successfully'
    });
  } catch (error) {
    console.error('Training data collection error:', error);
    res.status(500).json({ error: 'Failed to collect training data' });
  }
});

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'blaze-mobile-api',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// Error handling middleware
router.use((error, req, res, next) => {
  console.error('Mobile API error:', error);
  
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'File too large. Maximum size is 100MB.' });
    }
  }
  
  res.status(500).json({ 
    error: 'Internal server error',
    requestId: crypto.randomUUID()
  });
});

export default router;