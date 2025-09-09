import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import SportsDataService from './src/services/sportsDataService.js';
import mlbAdapter from './src/data/mlb/adapter.js';
import nflAdapter from './src/data/nfl/adapter.js';
import cfbAdapter from './src/data/cfb/adapter.js';
import cache from './src/data/cache.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Trust proxy for rate limiting to work correctly
// Use specific trust proxy setting for Replit environment
app.set('trust proxy', 1);

// Initialize sports data service
const sportsData = new SportsDataService();

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdnjs.cloudflare.com", "https://cdn.jsdelivr.net", "https://unpkg.com"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://statsapi.mlb.com", "https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev", "wss://blaze-vision-ai-gateway.humphrey-austin20.workers.dev"]
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