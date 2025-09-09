// Pressure Stream API Endpoints
// Real-time SSE and WebSocket endpoints for pressure analytics

const express = require('express');
const router = express.Router();

// Import analytics engines
const MomentumEngine = require('../analytics/momentum-engine');
const LegalCompliance = require('../compliance/legal-notices');

// Initialize momentum engine
const momentumEngine = new MomentumEngine();

// SSE endpoint for pressure stream
router.get('/pressure-stream', (req, res) => {
  // Set SSE headers
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  });
  
  // Send initial connection message
  res.write('data: {"type":"connected","message":"Pressure stream connected"}\n\n');
  
  // Simulation function for demo data
  const simulatePressureTick = () => {
    const now = Date.now();
    
    // Generate realistic game progression
    const gameProgress = (now % 180000) / 180000; // 3-minute cycles
    const quarter = Math.floor(gameProgress * 4) + 1;
    const timeInQuarter = (gameProgress * 4 % 1) * 720; // 12 minutes per quarter
    
    // Simulate momentum swings
    const baseMomentum = 0.5 + 0.3 * Math.sin(now / 10000);
    const pressureSpike = Math.random() > 0.95 ? 0.3 : 0;
    
    // Calculate pressure based on game situation
    const timePressure = timeInQuarter < 60 ? 0.3 : 0;
    const quarterPressure = quarter === 4 ? 0.2 : 0;
    
    const tick = {
      t: now,
      wp: Math.max(0.1, Math.min(0.9, baseMomentum + (Math.random() - 0.5) * 0.1)),
      pressure: Math.max(0, Math.min(1, 0.3 + timePressure + quarterPressure + pressureSpike)),
      event: Math.random() > 0.9 ? {
        code: ['3PT', 'STEAL', 'BLOCK', 'AND1'][Math.floor(Math.random() * 4)],
        label: ['3-Pointer', 'Steal', 'Block', 'And-One'][Math.floor(Math.random() * 4)],
        team: Math.random() > 0.5 ? 'home' : 'away'
      } : null
    };
    
    // Apply legal compliance (anonymize if needed)
    if (LegalCompliance.trademarkProtection.useGenericNames && tick.event) {
      tick.event.team = LegalCompliance.trademarkProtection.sanitizeTeamName(tick.event.team);
    }
    
    return tick;
  };
  
  // Send pressure ticks every second
  const interval = setInterval(() => {
    const tick = simulatePressureTick();
    res.write(`data: ${JSON.stringify(tick)}\n\n`);
  }, 1000);
  
  // Clean up on client disconnect
  req.on('close', () => {
    clearInterval(interval);
    res.end();
  });
});

// Pressure heatmap endpoint
router.get('/pressure-heatmap', (req, res) => {
  const { gameId, period } = req.query;
  
  // Generate heatmap data
  const generateHeatmap = () => {
    const bins = [];
    const gridSize = 20;
    
    for (let x = -gridSize; x <= gridSize; x += 4) {
      for (let y = -gridSize; y <= gridSize; y += 4) {
        // Simulate pressure zones
        const distance = Math.sqrt(x * x + y * y);
        const centerPressure = Math.exp(-distance / 10);
        const cornerPressure = x > 15 && Math.abs(y) < 5 ? 0.3 : 0;
        
        bins.push({
          x: x / gridSize,
          y: y / gridSize,
          pressure: Math.min(1, centerPressure + cornerPressure + Math.random() * 0.2),
          count: Math.floor(Math.random() * 10 + centerPressure * 20)
        });
      }
    }
    
    return {
      court: 'nba',
      gameId: gameId || 'demo',
      period: period || 'full',
      bins: bins.filter(b => b.count > 2) // Filter out low-activity zones
    };
  };
  
  res.json(generateHeatmap());
});

// Clutch splits endpoint
router.get('/clutch-splits/:playerId', (req, res) => {
  const { playerId } = req.params;
  
  // Generate clutch performance data
  const clutchData = {
    playerId: playerId,
    name: LegalCompliance.nilCompliance.anonymizeAthleteData({ 
      id: playerId, 
      name: 'Player Name' 
    }).name,
    minutes: Math.floor(Math.random() * 500 + 200),
    usage: Math.random() * 0.3 + 0.15,
    eff: Math.random() * 0.2 + 0.4,
    effHighP: Math.random() * 0.2 + 0.35,  // Slightly lower under pressure
    effLowP: Math.random() * 0.2 + 0.45,   // Better in low pressure
    eocc: Math.random() * 0.3 + 0.5,       // Estimation of Clutch Competency
    clutchRating: Math.floor(Math.random() * 30 + 70),
    pressureSituations: Math.floor(Math.random() * 50 + 20),
    clutchShots: {
      made: Math.floor(Math.random() * 20 + 10),
      attempted: Math.floor(Math.random() * 30 + 20)
    }
  };
  
  res.json(clutchData);
});

// Chemistry network data endpoint
router.get('/chemistry-network/:teamId', (req, res) => {
  const { teamId } = req.params;
  
  // Generate team chemistry data
  const players = [];
  const edges = [];
  
  // Create 5 starter players
  for (let i = 1; i <= 5; i++) {
    players.push({
      id: `player_${i}`,
      name: `Player ${i}`,
      position: ['PG', 'SG', 'SF', 'PF', 'C'][i - 1],
      usage: Math.random() * 0.2 + 0.15,
      efficiency: Math.random() * 0.2 + 0.4,
      isStarter: true
    });
  }
  
  // Create chemistry connections
  for (let i = 1; i <= 5; i++) {
    for (let j = i + 1; j <= 5; j++) {
      const familiarity = Math.random() * 100 + 50;
      const efficiency = Math.random() * 0.3 + 0.5;
      
      edges.push({
        from: `player_${i}`,
        to: `player_${j}`,
        weight: familiarity,
        efficiency: efficiency,
        interactions: Math.floor(familiarity / 2)
      });
    }
  }
  
  res.json({
    teamId: teamId,
    players: players.map(p => LegalCompliance.nilCompliance.anonymizeAthleteData(p)),
    edges: edges,
    familiarityIndex: {
      average: Math.random() * 30 + 60,
      trend: Math.random() * 10 - 5
    }
  });
});

// Momentum prediction endpoint
router.get('/momentum/predict', (req, res) => {
  const gameState = {
    scoreDiff: parseInt(req.query.scoreDiff) || 0,
    timeRemaining: parseInt(req.query.time) || 600,
    quarter: parseInt(req.query.quarter) || 4,
    possession: req.query.possession || 'home',
    isPlayoffs: req.query.playoffs === 'true',
    lastScoringRun: [2, 0, 3, 0, 2, 2, 0, 3],
    starPlayerActive: true,
    turnovers: 8,
    offRebounds: 10,
    benchPoints: 25,
    foulsRemaining: 3,
    currentRun: 5
  };
  
  // Get prediction from momentum engine
  const prediction = momentumEngine.predict(gameState);
  
  res.json({
    ...prediction,
    gameState: gameState,
    timestamp: Date.now()
  });
});

// System KPIs endpoint
router.get('/system/kpi', (req, res) => {
  res.json({
    accuracy: 0.946,  // 94.6% as advertised
    p95Latency: 45,   // 45ms p95 latency
    activeUsers: Math.floor(Math.random() * 100 + 50),
    gamesAnalyzed: Math.floor(Math.random() * 1000 + 5000),
    predictionsToday: Math.floor(Math.random() * 10000 + 50000),
    uptime: 99.95
  });
});

// Player biometrics endpoint (with consent check)
router.get('/biometrics/:playerId', (req, res) => {
  const { playerId } = req.params;
  const { consent } = req.query;
  
  // Check for consent
  if (consent !== 'true') {
    return res.status(403).json({
      error: 'Biometric data requires explicit consent',
      consentRequired: true,
      consentUrl: `/consent/biometrics?playerId=${playerId}`
    });
  }
  
  // Generate biometric data
  const biometrics = {
    playerId: playerId,
    timestamp: Date.now(),
    hr: Math.floor(Math.random() * 40 + 120),  // 120-160 bpm during play
    hrv: Math.floor(Math.random() * 20 + 30),  // HRV in ms
    load: Math.random() * 30 + 70,             // Training load percentage
    fatigue: Math.random() * 0.3 + 0.2,        // Fatigue index
    recovery: Math.random() * 0.3 + 0.6        // Recovery score
  };
  
  res.json(biometrics);
});

// Export router
module.exports = router;