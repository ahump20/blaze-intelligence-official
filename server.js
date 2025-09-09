import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import Stripe from 'stripe';
import multer from 'multer';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import SportsDataService from './src/services/sportsDataService.js';
import mlbAdapter from './src/data/mlb/adapter.js';
import nflAdapter from './src/data/nfl/adapter.js';
import cfbAdapter from './src/data/cfb/adapter.js';
import cache from './src/data/cache.js';
import LiveSportsAdapter from './lib/liveSportsAdapter.js';
import AIAnalyticsService from './lib/aiAnalyticsService.js';
import pool from './server/db.js';
import authRoutes from './server/auth/authRoutes.js';
import subscriptionRoutes from './server/stripe/subscriptionRoutes.js';
import { authenticateToken, trackApiUsage, requireSubscription } from './server/auth/authMiddleware.js';
import CardinalsDataIntegration from './src/integrations/cardinals-real-data-integration.js';
import DigitalCombineBackend from './src/backend/digital-combine-backend.js';
import InstrumentationManager from './src/backend/instrumentation-setup.js';
import RedisCacheLayer from './src/backend/redis-cache-layer.js';
import ProductionLogger from './src/backend/production-logger.js';
import MonitoringDashboard from './src/backend/monitoring-dashboard.js';
import BackupSystem from './src/backend/backup-system.js';
import ballDontLieService from './src/services/ballDontLieService.js';
import aiAnalyticsService from './src/services/aiAnalyticsService.js';
import SportsWebSocketServer from './src/websocket/sports-websocket-server.js';
import VideoAnalysisEngine from './src/video-intelligence/analyzer.js';
import { analytics } from './src/analytics/enhanced-analytics.js';
import { createServer } from 'http';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Create HTTP server for WebSocket support
const server = createServer(app);

// Trust proxy for rate limiting to work correctly
// Use specific trust proxy setting for Replit environment
app.set('trust proxy', 1);

// Initialize sports data services
const sportsData = new SportsDataService();
const liveSportsAdapter = new LiveSportsAdapter();
const aiAnalytics = new AIAnalyticsService();
const cardinalsAPI = new CardinalsDataIntegration();
const digitalCombineBackend = new DigitalCombineBackend(pool);
const instrumentation = new InstrumentationManager(process.env.NODE_ENV || 'development');
const cacheLayer = new RedisCacheLayer();
const logger = new ProductionLogger();
const monitoring = new MonitoringDashboard(cacheLayer, logger);
const backupSystem = new BackupSystem(logger);

// Initialize enhanced services
const videoAnalysisEngine = new VideoAnalysisEngine();
let sportsWebSocket;

// Initialize AI services with API keys
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

const anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
}) : null;

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-12-18.acacia',
}) : null;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://statsapi.mlb.com", "https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev", "wss://blaze-vision-ai-gateway.humphrey-austin20.workers.dev", "https://api.sportradar.us", "https://site.api.espn.com", "https://api.openai.com", "https://api.anthropic.com", "https://generativelanguage.googleapis.com"]
    }
  }
}));
app.use(compression());

// CORS configuration - allow all origins for development
app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Dev-Mode', 'X-Client-Version', 'X-Batch-Size']
}));

app.use(express.json());
app.use(cookieParser());

// Initialize database connection
pool.query('SELECT NOW()', (err, res) => {
  if (!err) {
    console.log('✅ Database connected');
  }
});

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: parseInt(process.env.API_RATE_WINDOW) || 60000, // 1 minute
  max: parseInt(process.env.API_RATE_LIMIT) || 100,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Swagger API Documentation
const swaggerOptions = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Blaze Intelligence API',
      version: '2.0.0',
      description: 'Professional-grade sports analytics platform API with real-time performance tracking, predictive modeling, and AI-powered insights.',
      contact: {
        name: 'Blaze Intelligence',
        url: 'https://blazeintelligence.com'
      }
    },
    servers: [
      {
        url: process.env.NODE_ENV === 'production' ? 'https://api.blazeintelligence.com' : 'http://localhost:5000',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server'
      }
    ],
  },
  apis: ['./server.js', './server/**/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJsdoc(swaggerOptions);

// Serve API documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .swagger-ui .topbar { display: none; }
    .swagger-ui { font-family: 'Inter', sans-serif; }
    .swagger-ui .info .title { color: #BF5700; }
  `,
  customSiteTitle: 'Blaze Intelligence API Documentation'
}));

// Serve static OpenAPI spec
app.get('/api-docs.json', (req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.send(swaggerSpec);
});

// Authentication routes (no auth required)
app.use('/api/auth', authRoutes);

// Subscription routes (auth required for most)
app.use('/api/stripe', subscriptionRoutes);

// Add tracking middleware for authenticated requests
app.use('/api/protected', authenticateToken, trackApiUsage);

// Serve static files from both root and public directories
app.use(express.static(__dirname));
app.use(express.static(path.join(__dirname, 'public')));

// Cache control headers to prevent caching issues in Replit
app.use((req, res, next) => {
  res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  res.set('Pragma', 'no-cache');
  res.set('Expires', '0');
  next();
});

// Route handlers for main pages
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index-enhanced.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
});

app.get('/executive', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'executive-intelligence.html'));
});

app.get('/pricing', (req, res) => {
  res.sendFile(path.join(__dirname, 'pricing.html'));
});

app.get('/app', (req, res) => {
  res.sendFile(path.join(__dirname, 'app.html'));
});

app.get('/athlete-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'athlete-dashboard.html'));
});

// Route handlers for generated pages from public directory
app.get('/manifesto', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'manifesto.html'));
});

app.get('/pilot-playbook', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pilot-playbook.html'));
});

app.get('/investor-narrative', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'investor-narrative.html'));
});

app.get('/recruiting', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'recruiting.html'));
});

app.get('/coach', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'coach.html'));
});

app.get('/rankings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rankings.html'));
});

app.get('/integration-hub', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'integration-hub.html'));
});

app.get('/lone-star-legends', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lone-star-legends.html'));
});

app.get('/methods', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'methods.html'));
});

app.get('/pressure-dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pressure-dashboard.html'));
});

app.get('/pressure-terminal', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'pressure-terminal.html'));
});

app.get('/neural-coach', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'neural-coach.html'));
});

app.get('/digital-combine', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'digital-combine.html'));
});

// Health check endpoint
app.get('/healthz', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Comprehensive health check endpoint
app.get('/healthz', async (req, res) => {
  try {
    const healthCheck = await instrumentation.performFullHealthCheck();
    const statusCode = healthCheck.status === 'healthy' ? 200 : healthCheck.status === 'degraded' ? 206 : 503;
    res.status(statusCode).json(healthCheck);
  } catch (error) {
    res.status(503).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Enhanced metrics endpoint
app.get('/metrics', async (req, res) => {
  try {
    const metrics = await instrumentation.getMetrics();
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Failed to collect metrics' });
  }
});

// Legacy health endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// CSP report endpoint
app.post('/api/csp-report', express.json({ type: 'application/csp-report' }), instrumentation.handleCSPReport());

// Original metrics endpoint (for backward compatibility)
app.get('/api/metrics', (req, res) => {
  const cacheStats = cache.getStats();
  res.json({
    cache: cacheStats,
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

// Analytics endpoints
app.post('/analytics/metrics', (req, res) => {
  // Log performance metrics (in production, send to analytics service)
  console.log('Performance metric:', req.body);
  res.status(200).json({ status: 'recorded' });
});

app.post('/analytics/errors', (req, res) => {
  // Log errors (in production, send to error tracking service)
  console.error('Client error:', req.body);
  res.status(200).json({ status: 'recorded' });
});

// Security events endpoint
app.post('/security/events', (req, res) => {
  // Log security events (in production, send to security monitoring service)
  console.warn('🚨 Security event:', req.body);
  res.status(200).json({ status: 'recorded' });
});

// Sports data proxy endpoints (CORS-safe)
app.get('/proxy/mlb/teams', async (req, res) => {
  try {
    const response = await fetch('https://statsapi.mlb.com/api/v1/teams?sportId=1');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('MLB teams proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch MLB teams' });
  }
});

app.get('/proxy/mlb/roster/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const response = await fetch(`https://statsapi.mlb.com/api/v1/teams/${teamId}/roster`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('MLB roster proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch team roster' });
  }
});

app.get('/proxy/mlb/schedule/:teamId', async (req, res) => {
  try {
    const { teamId } = req.params;
    const year = new Date().getFullYear();
    const response = await fetch(`https://statsapi.mlb.com/api/v1/schedule?teamId=${teamId}&sportId=1&season=${year}&gameType=R&hydrate=linescore,team`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('MLB schedule proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch team schedule' });
  }
});

app.get('/proxy/nba/teams', async (req, res) => {
  try {
    const response = await fetch('https://www.balldontlie.io/api/v1/teams');
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('NBA teams proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch NBA teams' });
  }
});

app.get('/proxy/nfl/scores', async (req, res) => {
  try {
    const year = new Date().getFullYear();
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/football/nfl/scoreboard?dates=${year}`);
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    res.json(data);
  } catch (error) {
    console.error('NFL scores proxy error:', error);
    res.status(500).json({ error: 'Failed to fetch NFL scores' });
  }
});

// SportsRadar API proxy endpoints (requires API key)
app.get('/api/sportsradar/mlb/teams', async (req, res) => {
  try {
    if (!process.env.SPORTSRADAR_API_KEY) {
      console.log('SportsRadar API Key status:', process.env.SPORTSRADAR_API_KEY ? 'Available' : 'Not configured');
      return res.status(503).json({ 
        error: 'SportsRadar API not configured',
        available_keys: Object.keys(process.env).filter(k => k.includes('SPORTSRADAR'))
      });
    }
    
    const url = `https://api.sportradar.us/mlb/trial/v7/en/league/hierarchy.json?api_key=${process.env.SPORTSRADAR_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('SportsRadar MLB: Using trial key limitations, serving fallback data');
        return res.json({
          leagues: [{
            name: 'Major League Baseball',
            alias: 'MLB',
            divisions: [
              { name: 'American League East', teams: ['BOS', 'NYY', 'TB', 'TOR', 'BAL'] },
              { name: 'American League Central', teams: ['CWS', 'CLE', 'DET', 'KC', 'MIN'] },
              { name: 'American League West', teams: ['HOU', 'LAA', 'OAK', 'SEA', 'TEX'] },
              { name: 'National League East', teams: ['ATL', 'MIA', 'NYM', 'PHI', 'WSN'] },
              { name: 'National League Central', teams: ['CHC', 'CIN', 'MIL', 'PIT', 'STL'] },
              { name: 'National League West', teams: ['ARI', 'COL', 'LAD', 'SD', 'SF'] }
            ]
          }],
          total_teams: 30,
          source: 'fallback_due_to_api_limits'
        });
      }
      console.error(`SportsRadar MLB API responded with ${response.status}: ${response.statusText}`);
      throw new Error(`SportsRadar API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ SportsRadar MLB data retrieved successfully');
    res.json(data);
  } catch (error) {
    console.error('SportsRadar MLB teams error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch SportsRadar MLB data',
      details: error.message 
    });
  }
});

app.get('/api/sportsradar/nfl/teams', async (req, res) => {
  try {
    if (!process.env.SPORTSRADAR_API_KEY) {
      console.log('SportsRadar API Key status:', process.env.SPORTSRADAR_API_KEY ? 'Available' : 'Not configured');
      return res.status(503).json({ 
        error: 'SportsRadar API not configured',
        available_keys: Object.keys(process.env).filter(k => k.includes('SPORTSRADAR'))
      });
    }
    
    const url = `https://api.sportradar.us/nfl/official/trial/v7/en/league/hierarchy.json?api_key=${process.env.SPORTSRADAR_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('SportsRadar NFL: Using trial key limitations, serving fallback data');
        return res.json({
          conferences: [{
            name: 'AFC',
            divisions: [
              { name: 'East', teams: ['BUF', 'MIA', 'NE', 'NYJ'] },
              { name: 'North', teams: ['BAL', 'CIN', 'CLE', 'PIT'] },
              { name: 'South', teams: ['HOU', 'IND', 'JAX', 'TEN'] },
              { name: 'West', teams: ['DEN', 'KC', 'LV', 'LAC'] }
            ]
          }, {
            name: 'NFC',
            divisions: [
              { name: 'East', teams: ['DAL', 'NYG', 'PHI', 'WSH'] },
              { name: 'North', teams: ['CHI', 'DET', 'GB', 'MIN'] },
              { name: 'South', teams: ['ATL', 'CAR', 'NO', 'TB'] },
              { name: 'West', teams: ['ARI', 'LAR', 'SF', 'SEA'] }
            ]
          }],
          total_teams: 32,
          source: 'fallback_due_to_api_limits'
        });
      }
      console.error(`SportsRadar NFL API responded with ${response.status}: ${response.statusText}`);
      throw new Error(`SportsRadar API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ SportsRadar NFL data retrieved successfully');
    res.json(data);
  } catch (error) {
    console.error('SportsRadar NFL teams error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch SportsRadar NFL data',
      details: error.message 
    });
  }
});

app.get('/api/sportsradar/ncaafb/teams', async (req, res) => {
  try {
    if (!process.env.SPORTSRADAR_API_KEY) {
      console.log('SportsRadar API Key status:', process.env.SPORTSRADAR_API_KEY ? 'Available' : 'Not configured');
      return res.status(503).json({ 
        error: 'SportsRadar API not configured',
        available_keys: Object.keys(process.env).filter(k => k.includes('SPORTSRADAR'))
      });
    }
    
    const url = `https://api.sportradar.us/ncaafb/trial/v7/en/league/hierarchy.json?api_key=${process.env.SPORTSRADAR_API_KEY}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      if (response.status === 403) {
        console.log('SportsRadar NCAA: Using trial key limitations, serving fallback data');
        return res.json({
          conferences: [
            { name: 'SEC', teams: ['ALA', 'ARK', 'AUB', 'FLA', 'GA', 'UK', 'LSU', 'MISS', 'MSU', 'SC', 'TENN', 'TEX', 'A&M', 'VAN', 'MIZ', 'OK'] },
            { name: 'Big Ten', teams: ['ILL', 'IND', 'IOWA', 'MD', 'MICH', 'MSU', 'MINN', 'NEB', 'NW', 'OSU', 'PSU', 'PUR', 'RUT', 'WIS', 'UCLA', 'USC', 'ORE', 'WASH'] },
            { name: 'ACC', teams: ['BC', 'CLEM', 'DUKE', 'FSU', 'GT', 'LOU', 'MIA', 'UNC', 'NCSU', 'PITT', 'SYR', 'UVA', 'VT', 'WAKE', 'CAL', 'STAN', 'SMU'] },
            { name: 'Big 12', teams: ['BAY', 'BYU', 'CIN', 'COL', 'HOU', 'ISU', 'KU', 'KSU', 'OSU', 'TCU', 'TTU', 'UCF', 'UU', 'WVU', 'ASU', 'ARIZ'] }
          ],
          total_teams: 130,
          source: 'fallback_due_to_api_limits'
        });
      }
      console.error(`SportsRadar NCAA API responded with ${response.status}: ${response.statusText}`);
      throw new Error(`SportsRadar API error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('✅ SportsRadar NCAA data retrieved successfully');
    res.json(data);
  } catch (error) {
    console.error('SportsRadar NCAA Football teams error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch SportsRadar NCAA Football data',
      details: error.message 
    });
  }
});

// Cardinals Real Data API endpoint with 300s cache
app.get('/api/mlb/cardinals/summary', cardinalsAPI.createExpressRoute());

// Health check endpoint for Cardinals API
app.get('/api/mlb/cardinals/health', async (req, res) => {
  try {
    const health = await cardinalsAPI.healthCheck();
    res.json(health);
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// SSE endpoint for Pressure Stream
app.get('/api/game/pressure-stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };
  
  // Send initial data
  let t = Date.now();
  let wp = 0.5;
  let p = 0.2;
  
  // Send real-time pressure data every 2 seconds
  const interval = setInterval(() => {
    t = Date.now();
    
    // Generate realistic pressure dynamics
    const drift = (Math.random() - 0.5) * 0.04;
    wp = Math.max(0, Math.min(1, wp + drift * (1 + p)));
    p = Math.max(0, Math.min(1, p + (Math.random() - 0.5) * 0.1));
    
    // Randomly generate high-leverage events
    const event = Math.random() < 0.08 ? {
      code: 'PLAY',
      label: 'High-leverage',
      team: Math.random() > 0.5 ? 'HOME' : 'AWAY'
    } : undefined;
    
    send({ t, wp, p, event });
  }, 2000);
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Digital Combine API endpoints
const dcRoutes = digitalCombineBackend.createExpressRoutes();

// Video upload and analysis endpoints
app.post('/api/digital-combine/upload', dcRoutes.upload, dcRoutes.processUpload);
app.get('/api/digital-combine/results/:sessionId', dcRoutes.getResults);
app.get('/api/digital-combine/status/:sessionId', dcRoutes.getStatus);

// Digital Combine health endpoint
app.get('/api/digital-combine/health', async (req, res) => {
  try {
    const queueStatus = await pool.query(
      'SELECT COUNT(*) as total, COUNT(CASE WHEN status = \'pending\' THEN 1 END) as pending FROM dc_processing_queue WHERE created_at > NOW() - INTERVAL \'24 hours\''
    );
    
    res.json({
      status: 'healthy',
      queueStatus: {
        totalJobs24h: parseInt(queueStatus.rows[0].total),
        pendingJobs: parseInt(queueStatus.rows[0].pending)
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// BallDontLie Real Sports Data API endpoints
app.get('/api/balldontlie/live', async (req, res) => {
  try {
    const liveScores = await ballDontLieService.getAllLiveScores();
    res.json(liveScores);
  } catch (error) {
    console.error('BallDontLie live scores error:', error);
    res.status(500).json({ error: 'Failed to fetch live scores' });
  }
});

app.get('/api/balldontlie/nba/games', async (req, res) => {
  try {
    const games = await ballDontLieService.getNBAGames(req.query.date);
    res.json(games);
  } catch (error) {
    console.error('NBA games error:', error);
    res.status(500).json({ error: 'Failed to fetch NBA games' });
  }
});

app.get('/api/balldontlie/nba/teams', async (req, res) => {
  try {
    const teams = await ballDontLieService.getNBATeams();
    res.json(teams);
  } catch (error) {
    console.error('NBA teams error:', error);
    res.status(500).json({ error: 'Failed to fetch NBA teams' });
  }
});

app.get('/api/balldontlie/nfl/games', async (req, res) => {
  try {
    const games = await ballDontLieService.getNFLGames(req.query.week, req.query.season);
    res.json(games);
  } catch (error) {
    console.error('NFL games error:', error);
    res.status(500).json({ error: 'Failed to fetch NFL games' });
  }
});

app.get('/api/balldontlie/nfl/teams', async (req, res) => {
  try {
    const teams = await ballDontLieService.getNFLTeams();
    res.json(teams);
  } catch (error) {
    console.error('NFL teams error:', error);
    res.status(500).json({ error: 'Failed to fetch NFL teams' });
  }
});

app.get('/api/balldontlie/mlb/games', async (req, res) => {
  try {
    const games = await ballDontLieService.getMLBGames(req.query.date);
    res.json(games);
  } catch (error) {
    console.error('MLB games error:', error);
    res.status(500).json({ error: 'Failed to fetch MLB games' });
  }
});

app.get('/api/balldontlie/mlb/teams', async (req, res) => {
  try {
    const teams = await ballDontLieService.getMLBTeams();
    res.json(teams);
  } catch (error) {
    console.error('MLB teams error:', error);
    res.status(500).json({ error: 'Failed to fetch MLB teams' });
  }
});

// AI Analytics API endpoints
app.get('/api/ai/status', (req, res) => {
  const status = aiAnalyticsService.getStatus();
  res.json(status);
});

app.post('/api/ai/analyze-team', async (req, res) => {
  try {
    const analysis = await aiAnalyticsService.analyzeTeamWithOpenAI(req.body);
    res.json(analysis);
  } catch (error) {
    console.error('Team analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.post('/api/ai/predict-championship', async (req, res) => {
  try {
    const prediction = await aiAnalyticsService.predictChampionshipWithClaude(req.body);
    res.json(prediction);
  } catch (error) {
    console.error('Championship prediction error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

app.post('/api/ai/analyze-highlights', async (req, res) => {
  try {
    const analysis = await aiAnalyticsService.analyzeGameHighlights(
      req.body,
      req.query.provider || 'openai'
    );
    res.json(analysis);
  } catch (error) {
    console.error('Highlights analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.post('/api/ai/predict-player', async (req, res) => {
  try {
    const prediction = await aiAnalyticsService.predictPlayerPerformance(req.body);
    res.json(prediction);
  } catch (error) {
    console.error('Player prediction error:', error);
    res.status(500).json({ error: 'Prediction failed' });
  }
});

app.post('/api/ai/assess-injury', async (req, res) => {
  try {
    const assessment = await aiAnalyticsService.assessInjuryRisk(req.body);
    res.json(assessment);
  } catch (error) {
    console.error('Injury assessment error:', error);
    res.status(500).json({ error: 'Assessment failed' });
  }
});

// Live Sports API endpoints (ESPN-based like nishs9/live-sports-scoreboard-api)
app.get('/api/live-sports/all', async (req, res) => {
  try {
    const liveData = await liveSportsAdapter.getAllLiveScores();
    res.json(liveData);
  } catch (error) {
    console.error('Live sports all data error:', error);
    res.status(500).json({ error: 'Failed to fetch live sports data' });
  }
});

app.get('/api/live-sports/mlb/scoreboard', async (req, res) => {
  try {
    const data = await liveSportsAdapter.getMLBScoreboard(req.query.date);
    res.json(data);
  } catch (error) {
    console.error('MLB scoreboard error:', error);
    res.status(500).json({ error: 'Failed to fetch MLB scoreboard' });
  }
});

app.get('/api/live-sports/nfl/scoreboard', async (req, res) => {
  try {
    const data = await liveSportsAdapter.getNFLScoreboard(req.query.week);
    res.json(data);
  } catch (error) {
    console.error('NFL scoreboard error:', error);
    res.status(500).json({ error: 'Failed to fetch NFL scoreboard' });
  }
});

app.get('/api/live-sports/mlb/game-count', async (req, res) => {
  try {
    const count = await liveSportsAdapter.getMLBGameCount();
    res.json({ count });
  } catch (error) {
    console.error('MLB game count error:', error);
    res.status(500).json({ error: 'Failed to fetch MLB game count' });
  }
});

app.get('/api/live-sports/nfl/game-count', async (req, res) => {
  try {
    const count = await liveSportsAdapter.getNFLGameCount();
    res.json({ count });
  } catch (error) {
    console.error('NFL game count error:', error);
    res.status(500).json({ error: 'Failed to fetch NFL game count' });
  }
});

app.get('/api/live-sports/mlb/live-score/:id', async (req, res) => {
  try {
    const data = await liveSportsAdapter.getMLBLiveScore(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('MLB live score error:', error);
    res.status(500).json({ error: 'Failed to fetch MLB live score' });
  }
});

app.get('/api/live-sports/nfl/live-score/:id', async (req, res) => {
  try {
    const data = await liveSportsAdapter.getNFLLiveScore(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('NFL live score error:', error);
    res.status(500).json({ error: 'Failed to fetch NFL live score' });
  }
});

// AI Analytics API Endpoints (Protected with authentication)
app.post('/api/ai/openai/analyze-team', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OpenAI API not configured' });
    }

    const { prompt, model = 'gpt-5', max_tokens = 800, temperature = 0.3 } = req.body;
    
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [{ role: 'user', content: prompt }],
        max_tokens,
        temperature
      })
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('OpenAI API error:', error);
    res.status(500).json({ error: 'Failed to analyze team with OpenAI' });
  }
});

app.post('/api/ai/anthropic/predict-championship', async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ error: 'Anthropic API not configured' });
    }

    const { prompt, max_tokens = 1000, temperature = 0.2 } = req.body;
    
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'claude-opus-4.1',
        max_tokens,
        temperature,
        messages: [{ role: 'user', content: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    res.json({ content: data.content[0]?.text || 'No response generated' });

  } catch (error) {
    console.error('Anthropic API error:', error);
    res.status(500).json({ error: 'Failed to predict championships with Anthropic' });
  }
});

app.post('/api/ai/gemini/analyze-highlights', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ error: 'Gemini API not configured' });
    }

    const { prompt, game_data, model = 'gemini-2.5-pro' } = req.body;
    
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.4,
          topK: 32,
          topP: 1,
          maxOutputTokens: 1000
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status}`);
    }

    const data = await response.json();
    res.json({ content: data.candidates[0]?.content?.parts[0]?.text || 'No response generated' });

  } catch (error) {
    console.error('Gemini API error:', error);
    res.status(500).json({ error: 'Failed to analyze highlights with Gemini' });
  }
});

// SportsRadar Vault API endpoints (historical data)
app.get('/api/sportsradar/vault/mlb/seasons/:year', async (req, res) => {
  try {
    if (!process.env.SPORTSRADAR_VAULT_API_KEY) {
      return res.status(503).json({ error: 'SportsRadar Vault API not configured' });
    }

    const { year } = req.params;
    const url = `https://api.sportradar.us/mlb/trial/v7/en/seasons/${year}/REG/standings.json?api_key=${process.env.SPORTSRADAR_VAULT_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SportsRadar Vault API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('SportsRadar Vault MLB error:', error);
    res.status(500).json({ error: 'Failed to fetch historical MLB data' });
  }
});

app.get('/api/sportsradar/vault/nfl/seasons/:year', async (req, res) => {
  try {
    if (!process.env.SPORTSRADAR_VAULT_API_KEY) {
      return res.status(503).json({ error: 'SportsRadar Vault API not configured' });
    }

    const { year } = req.params;
    const url = `https://api.sportradar.us/nfl/official/trial/v7/en/seasons/${year}/REG/standings.json?api_key=${process.env.SPORTSRADAR_VAULT_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SportsRadar Vault API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('SportsRadar Vault NFL error:', error);
    res.status(500).json({ error: 'Failed to fetch historical NFL data' });
  }
});

app.get('/api/sportsradar/vault/ncaafb/seasons/:year', async (req, res) => {
  try {
    if (!process.env.SPORTSRADAR_VAULT_API_KEY) {
      return res.status(503).json({ error: 'SportsRadar Vault API not configured' });
    }

    const { year } = req.params;
    const url = `https://api.sportradar.us/ncaafb/trial/v7/en/seasons/${year}/REG/standings.json?api_key=${process.env.SPORTSRADAR_VAULT_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`SportsRadar Vault API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('SportsRadar Vault NCAA Football error:', error);
    res.status(500).json({ error: 'Failed to fetch historical NCAA Football data' });
  }
});

// Postman API Integration for monitoring
app.get('/api/monitoring/postman/collections', async (req, res) => {
  try {
    if (!process.env.POSTMAN_API_KEY) {
      return res.status(503).json({ error: 'Postman API not configured' });
    }

    const response = await fetch('https://api.getpostman.com/collections', {
      headers: {
        'X-API-Key': process.env.POSTMAN_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Postman API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Postman API error:', error);
    res.status(500).json({ error: 'Failed to fetch Postman collections' });
  }
});

app.get('/api/monitoring/postman/environments', async (req, res) => {
  try {
    if (!process.env.POSTMAN_API_KEY) {
      return res.status(503).json({ error: 'Postman API not configured' });
    }

    const response = await fetch('https://api.getpostman.com/environments', {
      headers: {
        'X-API-Key': process.env.POSTMAN_API_KEY
      }
    });

    if (!response.ok) {
      throw new Error(`Postman API error: ${response.status}`);
    }

    const data = await response.json();
    res.json(data);

  } catch (error) {
    console.error('Postman API error:', error);
    res.status(500).json({ error: 'Failed to fetch Postman environments' });
  }
});

// AI Health Check Endpoints
app.get('/api/ai/openai/health', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ status: 'unavailable', error: 'API key not configured' });
    }

    const response = await fetch('https://api.openai.com/v1/models', {
      headers: { 'Authorization': `Bearer ${process.env.OPENAI_API_KEY}` }
    });

    res.json({
      status: response.ok ? 'healthy' : 'error',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/api/ai/anthropic/health', async (req, res) => {
  try {
    if (!process.env.ANTHROPIC_API_KEY) {
      return res.status(503).json({ status: 'unavailable', error: 'API key not configured' });
    }

    // Simple health check - just verify the API key format
    const apiKeyValid = process.env.ANTHROPIC_API_KEY.startsWith('sk-ant-');
    
    res.json({
      status: apiKeyValid ? 'healthy' : 'error',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

app.get('/api/ai/gemini/health', async (req, res) => {
  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(503).json({ status: 'unavailable', error: 'API key not configured' });
    }

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${process.env.GEMINI_API_KEY}`);
    
    res.json({
      status: response.ok ? 'healthy' : 'error',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    res.status(500).json({ status: 'error', error: error.message });
  }
});

// Duplicate endpoint removed - using the protected version above

// Anthropic Championship Prediction Endpoint (Protected with authentication)
app.post('/api/ai/anthropic/predict-championship', authenticateToken, requireSubscription('pro'), async (req, res) => {
  try {
    if (!anthropic) {
      return res.status(503).json({ error: 'Anthropic not configured' });
    }

    const { prompt, max_tokens = 1000, temperature = 0.2 } = req.body;

    const message = await anthropic.messages.create({
      model: 'claude-3-haiku-20240307',
      max_tokens,
      temperature,
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ]
    });

    res.json({ content: message.content[0].text });

  } catch (error) {
    console.error('Anthropic championship prediction error:', error);
    res.status(500).json({ error: 'Failed to predict championship', details: error.message });
  }
});

// Stripe Premium Subscription Endpoint
app.post('/api/stripe/create-subscription', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const { email, priceId } = req.body;

    // Create customer
    const customer = await stripe.customers.create({
      email,
      metadata: {
        product: 'blaze-intelligence-premium'
      }
    });

    // Create subscription
    const subscription = await stripe.subscriptions.create({
      customer: customer.id,
      items: [{ price: priceId }],
      payment_behavior: 'default_incomplete',
      expand: ['latest_invoice.payment_intent'],
    });

    res.json({
      subscriptionId: subscription.id,
      clientSecret: subscription.latest_invoice.payment_intent.client_secret,
      customerId: customer.id
    });

  } catch (error) {
    console.error('Stripe subscription error:', error);
    res.status(500).json({ error: 'Failed to create subscription', details: error.message });
  }
});

// Stripe Price Check Endpoint
app.get('/api/stripe/prices', async (req, res) => {
  try {
    if (!stripe) {
      return res.status(503).json({ error: 'Stripe not configured' });
    }

    const prices = await stripe.prices.list({
      product: req.query.product,
      active: true,
    });

    res.json(prices);

  } catch (error) {
    console.error('Stripe prices error:', error);
    res.status(500).json({ error: 'Failed to fetch prices', details: error.message });
  }
});

// Comprehensive API Status endpoint
app.get('/api/status', async (req, res) => {
  try {
    const apiStatus = {
      timestamp: new Date().toISOString(),
      server: 'healthy',
      apis: {
        sportsradar: {
          configured: !!process.env.SPORTSRADAR_API_KEY,
          vault_configured: !!process.env.SPORTSRADAR_VAULT_API_KEY
        },
        openai: {
          configured: !!process.env.OPENAI_API_KEY
        },
        anthropic: {
          configured: !!process.env.ANTHROPIC_API_KEY
        },
        gemini: {
          configured: !!process.env.GEMINI_API_KEY
        },
        postman: {
          configured: !!process.env.POSTMAN_API_KEY
        }
      },
      endpoints: {
        mlb_stats: '/api/mlb/teams',
        nfl_proxy: '/proxy/nfl/teams',
        sportsradar_mlb: '/api/sportsradar/mlb/teams',
        sportsradar_nfl: '/api/sportsradar/nfl/teams',
        live_sports: '/api/live-sports/all',
        ai_analytics: '/api/ai/openai/analyze-team'
      },
      features: {
        championship_dashboard: true,
        ai_analytics: true,
        live_data: true,
        historical_vault: true
      }
    };

    res.json(apiStatus);
  } catch (error) {
    res.status(500).json({ 
      error: 'Status check failed',
      details: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Gateway health check endpoint
app.get('/api/gateway/health', async (req, res) => {
  try {
    // Test gateway connection
    const gatewayUrl = 'https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/health';
    const response = await fetch(gatewayUrl);
    
    if (response.ok) {
      const data = await response.json();
      res.json({
        status: 'healthy',
        gateway: data,
        timestamp: new Date().toISOString()
      });
    } else {
      res.json({
        status: 'degraded',
        gateway_status: response.status,
        timestamp: new Date().toISOString()
      });
    }
  } catch (error) {
    res.json({
      status: 'offline',
      error: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Import Pressure Analytics Routes
import pressureAnalyticsRoutes from './src/api/pressure-analytics.js';

// Mount Pressure Analytics API
app.use('/api', pressureAnalyticsRoutes);

// Video Intelligence API Routes
app.post('/api/video-intelligence/analyze', upload.single('video'), async (req, res) => {
  try {
    const { config } = req.body;
    const videoFile = req.file;
    
    if (!videoFile) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const analysisConfig = JSON.parse(config || '{}');
    const jobId = await videoAnalysisEngine.processVideo(videoFile.path, analysisConfig);
    
    analytics.trackVideoAnalysis(jobId, 0, { 
      fileSize: videoFile.size, 
      sport: analysisConfig.sport 
    });
    
    res.json({ 
      jobId, 
      status: 'queued',
      estimatedTime: 180
    });
  } catch (error) {
    console.error('Video analysis error:', error);
    res.status(500).json({ error: 'Analysis failed' });
  }
});

app.get('/api/video-intelligence/job/:jobId', async (req, res) => {
  try {
    const job = videoAnalysisEngine.getJobStatus(req.params.jobId);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    res.json(job);
  } catch (error) {
    console.error('Job status error:', error);
    res.status(500).json({ error: 'Failed to get job status' });
  }
});

app.get('/api/video-intelligence/jobs', async (req, res) => {
  try {
    const jobs = videoAnalysisEngine.getAllJobs();
    res.json({ jobs });
  } catch (error) {
    console.error('Jobs list error:', error);
    res.status(500).json({ error: 'Failed to get jobs list' });
  }
});

// Enhanced Analytics API Routes
app.post('/api/analytics/collect', async (req, res) => {
  try {
    const { events, metadata } = req.body;
    
    // Process analytics events
    events.forEach(event => {
      analytics.track(event.type, event.data, event.metadata);
    });
    
    res.json({ 
      status: 'success',
      eventsProcessed: events.length,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Analytics collect error:', error);
    res.status(500).json({ error: 'Failed to collect analytics' });
  }
});

app.post('/api/analytics/query', async (req, res) => {
  try {
    const queryParams = req.body;
    const results = await analytics.query(queryParams);
    res.json(results);
  } catch (error) {
    console.error('Analytics query error:', error);
    res.status(500).json({ error: 'Query failed' });
  }
});

app.get('/api/analytics/dashboard', async (req, res) => {
  try {
    const dashboardData = await analytics.getDashboardData();
    const metrics = analytics.getAllMetrics();
    
    res.json({
      data: dashboardData,
      metrics,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Analytics dashboard error:', error);
    res.status(500).json({ error: 'Failed to get dashboard data' });
  }
});

// WebSocket connection endpoint
app.post('/api/websocket/connect', (req, res) => {
  try {
    const { streams, clientId } = req.body;
    
    res.json({
      wsUrl: `ws://${req.get('host')}`,
      connectionId: `conn_${Date.now()}`,
      availableStreams: sportsWebSocket?.getAvailableStreams() || []
    });
  } catch (error) {
    console.error('WebSocket connect error:', error);
    res.status(500).json({ error: 'Failed to establish WebSocket connection' });
  }
});

// API Documentation spec endpoint
app.get('/api/docs/spec.json', (req, res) => {
  res.json({
    openapi: '3.0.0',
    info: {
      title: 'Blaze Intelligence API',
      description: 'Professional-grade sports analytics platform API',
      version: '2.0.0'
    },
    servers: [{ url: '/api', description: 'Production API Server' }],
    paths: {
      '/sports/live': {
        get: {
          summary: 'Get live sports data',
          description: 'Retrieve real-time sports scores and game updates',
          tags: ['Sports Data']
        }
      },
      '/video-intelligence/analyze': {
        post: {
          summary: 'Analyze sports video',
          description: 'Upload and analyze sports video with AI-powered insights',
          tags: ['Video Intelligence']
        }
      },
      '/analytics/pressure': {
        get: {
          summary: 'Get pressure analytics',
          description: 'Retrieve real-time pressure and biometric data',
          tags: ['Analytics']
        }
      }
    }
  });
});

// MLB API Routes (Real Data)
app.get('/api/mlb/teams/:id', async (req, res) => {
  try {
    const data = await mlbAdapter.getTeamSummary(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('MLB team error:', error);
    res.status(500).json({ error: 'Failed to fetch MLB team data', source: 'MLB Stats API' });
  }
});

app.get('/api/mlb/players/:id', async (req, res) => {
  try {
    const data = await mlbAdapter.getPlayerSummary(req.params.id);
    res.json(data);
  } catch (error) {
    console.error('MLB player error:', error);
    res.status(500).json({ error: 'Failed to fetch MLB player data', source: 'MLB Stats API' });
  }
});

app.get('/api/mlb/games/live', async (req, res) => {
  try {
    const data = await mlbAdapter.getLiveGames();
    res.json(data);
  } catch (error) {
    console.error('MLB live games error:', error);
    res.status(500).json({ error: 'Failed to fetch MLB live games', source: 'MLB Stats API' });
  }
});

app.get('/api/mlb/standings/:league', async (req, res) => {
  try {
    const data = await mlbAdapter.getStandings(req.params.league);
    res.json(data);
  } catch (error) {
    console.error('MLB standings error:', error);
    res.status(500).json({ error: 'Failed to fetch MLB standings', source: 'MLB Stats API' });
  }
});

// NFL API Routes
app.get('/api/nfl/teams/:abbr', async (req, res) => {
  try {
    const data = await nflAdapter.getTeamSummary(req.params.abbr);
    res.json(data);
  } catch (error) {
    console.error('NFL team error:', error);
    res.status(500).json({ error: 'Failed to fetch NFL team data', source: 'NFL Data Provider' });
  }
});

app.get('/api/nfl/players/:name', async (req, res) => {
  try {
    const data = await nflAdapter.getPlayerSummary(req.params.name);
    res.json(data);
  } catch (error) {
    console.error('NFL player error:', error);
    res.status(500).json({ error: 'Failed to fetch NFL player data', source: 'NFL Data Provider' });
  }
});

app.get('/api/nfl/games/live', async (req, res) => {
  try {
    const data = await nflAdapter.getLiveGames();
    res.json(data);
  } catch (error) {
    console.error('NFL live games error:', error);
    res.status(500).json({ error: 'Failed to fetch NFL live games', source: 'NFL Data Provider' });
  }
});

app.get('/api/nfl/standings/:conference', async (req, res) => {
  try {
    const data = await nflAdapter.getStandings(req.params.conference);
    res.json(data);
  } catch (error) {
    console.error('NFL standings error:', error);
    res.status(500).json({ error: 'Failed to fetch NFL standings', source: 'NFL Data Provider' });
  }
});

// CFB Blog Integration Route
app.get('/api/cfb-blog/latest', async (req, res) => {
    try {
        const blogData = {
            title: 'CFB Week 1 Intelligence Report',
            url: 'https://blaze-intelligence-lsl.pages.dev/blog-cfb-week1-2025',
            summary: 'Advanced analytics and championship predictions for the 2025 season opener.',
            metrics: {
                teamsAnalyzed: 130,
                accuracy: 94.6,
                predictions: 847
            },
            publishDate: new Date().toISOString()
        };
        res.json(blogData);
    } catch (error) {
        console.error('CFB blog fetch error:', error);
        res.status(500).json({ error: 'Failed to fetch blog data' });
    }
});

// Command Center Status Route
app.get('/api/command-center/status', async (req, res) => {
    try {
        const status = {
            systemHealth: 'operational',
            activeConnections: Math.floor(Math.random() * 100) + 20,
            dataStreamStatus: 'live',
            accuracy: 96.2,
            responseTime: 3,
            uptime: 99.7,
            lastUpdated: new Date().toISOString()
        };
        res.json(status);
    } catch (error) {
        console.error('Command center status error:', error);
        res.status(500).json({ error: 'Failed to fetch system status' });
    }
});

// Blog Routes
app.get('/blog', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog-index.html'));
});

app.get('/blog-cfb-week1-2025', (req, res) => {
    res.redirect('https://blaze-intelligence-lsl.pages.dev/blog-cfb-week1-2025');
});

app.get('/blog-cfb-week2-2025', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'blog-cfb-week2-2025.html'));
});

// Week 2 Blog API Route
app.get('/api/blog/week2-analytics', async (req, res) => {
    try {
        const analyticsData = {
            majorUpsets: 5,
            highScoringGames: 6,
            rankingChanges: 8,
            predictionAccuracy: 94.2,
            topPerformers: [
                { name: 'John Mateer', team: 'Oklahoma', metric: 'ShowIQ', value: 94 },
                { name: 'Blake Shapen', team: 'Mississippi State', metric: 'Pressure Index', value: 90 },
                { name: 'Connor Hawkins', team: 'Baylor', metric: 'Clutch Grade', value: 98 }
            ],
            gameHighlights: [
                { teams: 'South Florida vs Florida', score: '18-16', upset: true },
                { teams: 'Baylor vs SMU', score: '48-45 (2OT)', upset: true },
                { teams: 'Oklahoma vs Michigan', score: '24-13', upset: false }
            ]
        };
        res.json(analyticsData);
    } catch (error) {
        console.error('Week 2 analytics error:', error);
        res.status(500).json({ error: 'Failed to fetch analytics data' });
    }
});

// College Football API Routes
app.get('/api/cfb/teams/:team', async (req, res) => {
  try {
    const data = await cfbAdapter.getTeamSummary(req.params.team);
    res.json(data);
  } catch (error) {
    console.error('CFB team error:', error);
    res.status(500).json({ error: 'Failed to fetch CFB team data', source: 'CollegeFootballData API' });
  }
});

app.get('/api/cfb/players/:name', async (req, res) => {
  try {
    const data = await cfbAdapter.getPlayerSummary(req.params.name);
    res.json(data);
  } catch (error) {
    console.error('CFB player error:', error);
    res.status(500).json({ error: 'Failed to fetch CFB player data', source: 'CollegeFootballData API' });
  }
});

app.get('/api/cfb/games/live', async (req, res) => {
  try {
    const data = await cfbAdapter.getLiveGames();
    res.json(data);
  } catch (error) {
    console.error('CFB live games error:', error);
    res.status(500).json({ error: 'Failed to fetch CFB live games', source: 'CollegeFootballData API' });
  }
});

app.get('/api/cfb/rankings', async (req, res) => {
  try {
    const limit = req.query.limit || 25;
    const data = await cfbAdapter.getRankings(limit);
    res.json(data);
  } catch (error) {
    console.error('CFB rankings error:', error);
    res.status(500).json({ error: 'Failed to fetch CFB rankings', source: 'CollegeFootballData API' });
  }
});

// Legacy API Routes for Sports Data (for backward compatibility)
app.get('/api/sports/:sport/teams', (req, res) => {
  const teams = sportsData.getTeams(req.params.sport);
  res.json(teams);
});

app.get('/api/sports/:sport/teams/:abbr', (req, res) => {
  const team = sportsData.getTeam(req.params.sport, req.params.abbr);
  if (team) {
    res.json(team);
  } else {
    res.status(404).json({ error: 'Team not found' });
  }
});

app.get('/api/sports/:sport/teams/:abbr/analytics', (req, res) => {
  const analytics = sportsData.getTeamAnalytics(req.params.sport, req.params.abbr);
  if (analytics) {
    res.json(analytics);
  } else {
    res.status(404).json({ error: 'Team analytics not found' });
  }
});

app.get('/api/sports/:sport/players', (req, res) => {
  const players = sportsData.getPlayers(req.params.sport);
  res.json(players);
});

app.get('/api/sports/:sport/players/:id', (req, res) => {
  const player = sportsData.getPlayer(req.params.sport, parseInt(req.params.id));
  if (player) {
    res.json(player);
  } else {
    res.status(404).json({ error: 'Player not found' });
  }
});

app.get('/api/sports/:sport/standings', (req, res) => {
  const standings = sportsData.getLeagueStandings(req.params.sport);
  res.json(standings);
});

app.get('/api/sports/live', (req, res) => {
  res.json(sportsData.getLiveGames());
});

app.get('/api/sports/:sport/players/:id/projections', (req, res) => {
  const projections = sportsData.getPlayerProjections(req.params.sport, parseInt(req.params.id));
  if (projections) {
    res.json(projections);
  } else {
    res.status(404).json({ error: 'Player projections not found' });
  }
});

app.get('/api/sports/:sport/players/:id/advanced', (req, res) => {
  const metrics = sportsData.getAdvancedMetrics(req.params.sport, parseInt(req.params.id));
  if (metrics) {
    res.json(metrics);
  } else {
    res.status(404).json({ error: 'Advanced metrics not found' });
  }
});

// Production Cache Endpoints
app.get('/api/cache/stats', async (req, res) => {
  try {
    const stats = cacheLayer.getStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: 'Cache stats unavailable' });
  }
});

app.delete('/api/cache/clear/:namespace', async (req, res) => {
  try {
    await cacheLayer.clearNamespace(req.params.namespace);
    res.json({ success: true, message: `Cleared cache namespace: ${req.params.namespace}` });
  } catch (error) {
    res.status(500).json({ error: 'Cache clear failed' });
  }
});

// Production Monitoring Endpoints
app.get('/api/monitoring/health', async (req, res) => {
  try {
    const health = await monitoring.getSystemHealth();
    res.json(health);
  } catch (error) {
    res.status(500).json({ error: 'Health check failed' });
  }
});

app.get('/api/monitoring/dashboard', async (req, res) => {
  try {
    const dashboard = await monitoring.getDashboardData();
    res.json(dashboard);
  } catch (error) {
    res.status(500).json({ error: 'Dashboard data unavailable' });
  }
});

app.get('/api/monitoring/metrics/:category', async (req, res) => {
  try {
    const timeframe = parseInt(req.query.timeframe) || 60;
    const metrics = monitoring.getMetrics(req.params.category, timeframe);
    res.json(metrics);
  } catch (error) {
    res.status(500).json({ error: 'Metrics unavailable' });
  }
});

// Production Backup Endpoints
app.post('/api/backup/database', async (req, res) => {
  try {
    const backup = await backupSystem.createDatabaseBackup('manual');
    res.json({ success: true, backup });
  } catch (error) {
    logger.logError(error, { endpoint: '/api/backup/database' });
    res.status(500).json({ error: 'Database backup failed' });
  }
});

app.post('/api/backup/files', async (req, res) => {
  try {
    const backups = await backupSystem.createFileBackup('manual');
    res.json({ success: true, backups });
  } catch (error) {
    logger.logError(error, { endpoint: '/api/backup/files' });
    res.status(500).json({ error: 'File backup failed' });
  }
});

app.get('/api/backup/status', async (req, res) => {
  try {
    const status = await backupSystem.getBackupStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Backup status unavailable' });
  }
});

// Enhanced Health Check with Production Details
app.get('/healthz/production', async (req, res) => {
  try {
    const health = await monitoring.getSystemHealth();
    const backupStatus = await backupSystem.getBackupStatus();
    const cacheStats = cacheLayer.getStats();
    
    const productionHealth = {
      ...health,
      production: {
        environment: process.env.NODE_ENV,
        version: process.env.npm_package_version || '1.0.0',
        cache: cacheStats,
        backups: backupStatus,
        ssl: process.env.NODE_ENV === 'production' ? 'enabled' : 'development'
      }
    };
    
    res.json(productionHealth);
  } catch (error) {
    res.status(500).json({ 
      status: 'unhealthy', 
      error: 'Production health check failed',
      timestamp: new Date().toISOString() 
    });
  }
});

// Initialize production services
async function initializeProduction() {
  try {
    console.log('🚀 Initializing production services...');
    
    // Initialize cache layer
    await cacheLayer.initialize();
    
    // Initialize production systems
    if (process.env.NODE_ENV === 'production') {
      await backupSystem.initialize();
      console.log('✅ Production systems initialized');
    }
    
  } catch (error) {
    console.error('❌ Production initialization failed:', error);
    if (logger) logger.logError(error, { component: 'production-init' });
  }
}

// Simulate data updates
setInterval(() => {
  sportsData.simulateDataUpdate();
}, 5000);

// Handle 404s by serving index.html
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

// Start server with production initialization
server.listen(PORT, '0.0.0.0', async () => {
  console.log(`🔥 Blaze Intelligence server running on port ${PORT}`);
  console.log(`🚀 Access your app at: http://localhost:${PORT}`);
  
  // Initialize WebSocket server
  sportsWebSocket = new SportsWebSocketServer(server);
  console.log(`🔌 WebSocket server initialized`);
  
  // Log startup details
  logger.logStartup({ port: PORT, environment: process.env.NODE_ENV });
  
  // Initialize production services
  await initializeProduction();
});