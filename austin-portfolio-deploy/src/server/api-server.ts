/**
 * Blaze Intelligence API Server
 * Production-ready Express server with CORS, caching, and sports data proxying
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { mlbAdapter } from '../data/mlb/adapter.js';
import { nflAdapter } from '../data/nfl/adapter.js';
import { cfbAdapter } from '../data/cfb/adapter.js';

const app = express();
const PORT = process.env.PORT || 3000;

// === SECURITY MIDDLEWARE ===
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "fonts.googleapis.com", "cdnjs.cloudflare.com"],
      fontSrc: ["'self'", "fonts.gstatic.com"],
      scriptSrc: ["'self'", "'unsafe-inline'", "cdnjs.cloudflare.com", "cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "statsapi.mlb.com", "site.api.espn.com", "api.collegefootballdata.com"]
    }
  }
}));

// === CORS CONFIGURATION ===
const corsOptions = {
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    const allowedOrigins = process.env.CORS_ORIGINS?.split(',') || [
      'http://localhost:3000',
      'http://localhost:8000',
      'https://blaze-intelligence.pages.dev',
      'https://blaze-intelligence-production.pages.dev'
    ];
    
    // Allow requests with no origin (mobile apps, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

// === RATE LIMITING ===
const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100'), // limit each IP to 100 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/api/', limiter);

// === MIDDLEWARE ===
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} ${req.method} ${req.url} - ${req.ip}`);
  next();
});

// === CACHE HEADERS MIDDLEWARE ===
const setCacheHeaders = (maxAge: number = 300) => {
  return (req: express.Request, res: express.Response, next: express.NextFunction) => {
    res.set({
      'Cache-Control': `public, max-age=${maxAge}, stale-while-revalidate=600`,
      'X-Cache-TTL': maxAge.toString(),
      'X-Data-Source': 'Blaze Intelligence API'
    });
    next();
  };
};

// === ERROR HANDLING UTILITY ===
const handleApiError = (res: express.Response, error: any, operation: string) => {
  console.error(`API Error in ${operation}:`, error);
  
  const statusCode = error.status || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal server error' 
    : error.message;

  res.status(statusCode).json({
    error: true,
    message,
    operation,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { stack: error.stack })
  });
};

// === HEALTH CHECK ENDPOINTS ===
app.get('/healthz', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: process.env.API_VERSION || '1.0.0',
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get('/metrics', (req, res) => {
  const memUsage = process.memoryUsage();
  const uptime = process.uptime();
  
  res.json({
    system: {
      uptime: `${Math.floor(uptime / 60)} minutes`,
      memory: {
        used: `${Math.round(memUsage.heapUsed / 1024 / 1024)} MB`,
        total: `${Math.round(memUsage.heapTotal / 1024 / 1024)} MB`
      },
      nodeVersion: process.version
    },
    cache: {
      mlb: mlbAdapter.getCacheStats(),
      nfl: nflAdapter.getCacheStats(),
      cfb: cfbAdapter.getCacheStats()
    },
    timestamp: new Date().toISOString()
  });
});

// === MLB API ROUTES ===
app.get('/api/mlb/team/:teamId', setCacheHeaders(300), async (req, res) => {
  try {
    const teamId = parseInt(req.params.teamId);
    if (isNaN(teamId)) {
      return res.status(400).json({ error: 'Invalid team ID' });
    }
    
    const teamSummary = await mlbAdapter.getTeamSummary(teamId);
    res.json({
      success: true,
      data: teamSummary,
      meta: {
        cached: true,
        asOf: teamSummary.lastUpdated,
        source: teamSummary.source,
        confidence: teamSummary.confidence
      }
    });
  } catch (error) {
    handleApiError(res, error, 'MLB Team Summary');
  }
});

app.get('/api/mlb/player/:playerId', setCacheHeaders(300), async (req, res) => {
  try {
    const playerId = parseInt(req.params.playerId);
    if (isNaN(playerId)) {
      return res.status(400).json({ error: 'Invalid player ID' });
    }
    
    const playerSummary = await mlbAdapter.getPlayerSummary(playerId);
    res.json({
      success: true,
      data: playerSummary,
      meta: {
        cached: true,
        asOf: playerSummary.lastUpdated,
        source: playerSummary.source,
        confidence: playerSummary.confidence
      }
    });
  } catch (error) {
    handleApiError(res, error, 'MLB Player Summary');
  }
});

app.get('/api/mlb/games', setCacheHeaders(60), async (req, res) => {
  try {
    const games = await mlbAdapter.getLiveGames();
    res.json({
      success: true,
      data: games,
      meta: {
        count: games.length,
        asOf: new Date().toISOString(),
        sources: [...new Set(games.map(g => g.source))]
      }
    });
  } catch (error) {
    handleApiError(res, error, 'MLB Live Games');
  }
});

// === NFL API ROUTES ===
app.get('/api/nfl/team/:teamAbbr', setCacheHeaders(300), async (req, res) => {
  try {
    const teamAbbr = req.params.teamAbbr.toUpperCase();
    const teamSummary = await nflAdapter.getTeamSummary(teamAbbr);
    
    res.json({
      success: true,
      data: teamSummary,
      meta: {
        cached: true,
        asOf: teamSummary.lastUpdated,
        source: teamSummary.source,
        confidence: teamSummary.confidence
      }
    });
  } catch (error) {
    handleApiError(res, error, 'NFL Team Summary');
  }
});

app.get('/api/nfl/player/:playerId', setCacheHeaders(300), async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const playerSummary = await nflAdapter.getPlayerSummary(playerId);
    
    res.json({
      success: true,
      data: playerSummary,
      meta: {
        cached: true,
        asOf: playerSummary.lastUpdated,
        source: playerSummary.source,
        confidence: playerSummary.confidence
      }
    });
  } catch (error) {
    handleApiError(res, error, 'NFL Player Summary');
  }
});

app.get('/api/nfl/games', setCacheHeaders(60), async (req, res) => {
  try {
    const games = await nflAdapter.getLiveGames();
    res.json({
      success: true,
      data: games,
      meta: {
        count: games.length,
        asOf: new Date().toISOString(),
        sources: [...new Set(games.map(g => g.source))]
      }
    });
  } catch (error) {
    handleApiError(res, error, 'NFL Live Games');
  }
});

// === COLLEGE FOOTBALL API ROUTES ===
app.get('/api/cfb/team/:teamName', setCacheHeaders(300), async (req, res) => {
  try {
    const teamName = decodeURIComponent(req.params.teamName);
    const teamSummary = await cfbAdapter.getTeamSummary(teamName);
    
    res.json({
      success: true,
      data: teamSummary,
      meta: {
        cached: true,
        asOf: teamSummary.lastUpdated,
        source: teamSummary.source,
        confidence: teamSummary.confidence,
        season: '2025-2026'
      }
    });
  } catch (error) {
    handleApiError(res, error, 'CFB Team Summary');
  }
});

app.get('/api/cfb/player/:playerId', setCacheHeaders(300), async (req, res) => {
  try {
    const playerId = req.params.playerId;
    const playerSummary = await cfbAdapter.getPlayerSummary(playerId);
    
    res.json({
      success: true,
      data: playerSummary,
      meta: {
        cached: true,
        asOf: playerSummary.lastUpdated,
        source: playerSummary.source,
        confidence: playerSummary.confidence
      }
    });
  } catch (error) {
    handleApiError(res, error, 'CFB Player Summary');
  }
});

app.get('/api/cfb/games', setCacheHeaders(60), async (req, res) => {
  try {
    const games = await cfbAdapter.getLiveGames();
    res.json({
      success: true,
      data: games,
      meta: {
        count: games.length,
        asOf: new Date().toISOString(),
        sources: [...new Set(games.map(g => g.source))],
        season: '2025-2026'
      }
    });
  } catch (error) {
    handleApiError(res, error, 'CFB Live Games');
  }
});

// === COMBINED ENDPOINTS ===
app.get('/api/dashboard/summary', setCacheHeaders(120), async (req, res) => {
  try {
    const [cardinalsData, titansData, longhornsData] = await Promise.allSettled([
      mlbAdapter.getTeamSummary(138), // Cardinals team ID
      nflAdapter.getTeamSummary('TEN'), // Titans
      cfbAdapter.getTeamSummary('Texas') // Longhorns
    ]);

    const result = {
      cardinals: cardinalsData.status === 'fulfilled' ? cardinalsData.value : null,
      titans: titansData.status === 'fulfilled' ? titansData.value : null,
      longhorns: longhornsData.status === 'fulfilled' ? longhornsData.value : null
    };

    res.json({
      success: true,
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
        season: '2025-2026',
        errors: [
          cardinalsData.status === 'rejected' ? { sport: 'MLB', error: cardinalsData.reason?.message } : null,
          titansData.status === 'rejected' ? { sport: 'NFL', error: titansData.reason?.message } : null,
          longhornsData.status === 'rejected' ? { sport: 'CFB', error: longhornsData.reason?.message } : null
        ].filter(Boolean)
      }
    });
  } catch (error) {
    handleApiError(res, error, 'Dashboard Summary');
  }
});

// === CACHE MANAGEMENT ===
app.delete('/api/cache/clear', (req, res) => {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Cache clearing only allowed in development' });
  }
  
  mlbAdapter.clearCache();
  nflAdapter.clearCache();
  cfbAdapter.clearCache();
  
  res.json({
    success: true,
    message: 'All caches cleared',
    timestamp: new Date().toISOString()
  });
});

// === 404 HANDLER ===
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API endpoint not found',
    path: req.path,
    method: req.method,
    timestamp: new Date().toISOString()
  });
});

// === GLOBAL ERROR HANDLER ===
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Global error handler:', error);
  
  if (res.headersSent) {
    return next(error);
  }
  
  res.status(500).json({
    error: 'Internal server error',
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV !== 'production' && { 
      message: error.message,
      stack: error.stack 
    })
  });
});

// === SERVER START ===
if (import.meta.url === `file://${process.argv[1]}`) {
  app.listen(PORT, () => {
    console.log(`🔥 Blaze Intelligence API Server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Health check: http://localhost:${PORT}/healthz`);
    console.log(`Metrics: http://localhost:${PORT}/metrics`);
  });
}

export default app;