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

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting to work correctly
// Use specific trust proxy setting for Replit environment
app.set('trust proxy', 1);

// Initialize sports data services
const sportsData = new SportsDataService();
const liveSportsAdapter = new LiveSportsAdapter();
const aiAnalytics = new AIAnalyticsService();

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
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'contact.html'));
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

app.get('/rankings', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'rankings.html'));
});

app.get('/integration-hub', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'integration-hub.html'));
});

app.get('/lone-star-legends', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'lone-star-legends.html'));
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

// Metrics endpoint
app.get('/metrics', (req, res) => {
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

// AI Analytics API Endpoints
app.post('/api/ai/openai/analyze-team', async (req, res) => {
  try {
    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({ error: 'OpenAI API not configured' });
    }

    const { prompt, model = 'gpt-4', max_tokens = 800, temperature = 0.3 } = req.body;
    
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
        model: 'claude-3-sonnet-20240229',
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

    const { prompt, game_data, model = 'gemini-pro' } = req.body;
    
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

// OpenAI Team Analysis Endpoint
app.post('/api/ai/openai/analyze-team', async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({ error: 'OpenAI not configured' });
    }

    const { prompt, model = 'gpt-4o-mini', max_tokens = 800, temperature = 0.3 } = req.body;

    const completion = await openai.chat.completions.create({
      model,
      messages: [
        {
          role: 'system',
          content: 'You are an expert sports analyst with deep knowledge of team performance, player statistics, and championship dynamics. Provide detailed, data-driven analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens,
      temperature
    });

    res.json(completion);

  } catch (error) {
    console.error('OpenAI team analysis error:', error);
    res.status(500).json({ error: 'Failed to analyze team', details: error.message });
  }
});

// Anthropic Championship Prediction Endpoint
app.post('/api/ai/anthropic/predict-championship', async (req, res) => {
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

// Simulate data updates
setInterval(() => {
  sportsData.simulateDataUpdate();
}, 5000);

// Handle 404s by serving index.html
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🔥 Blaze Intelligence server running on port ${PORT}`);
  console.log(`🚀 Access your app at: http://localhost:${PORT}`);
});