# ⚾ MLB Integration Deployment Guide

## Complete Setup for Blaze Intelligence MLB Platform (2025)

## 🏆 Overview

This guide covers the deployment of the unified MLB integration platform that combines:
- **MLB Gameday Bot** - Real-time Discord game tracking
- **MLB Data Lab** - Advanced analytics and visualization
- **Trackman Baseball** - Professional ball tracking
- **Champion Enigma Engine** - Biometric analysis
- **MLB Stats API** - Official MLB data
- **Baseball Savant** - Statcast metrics

## 🚀 Quick Start

### Prerequisites
```bash
# System Requirements
✅ Node.js 18+ and Python 3.9+
✅ PostgreSQL 14+
✅ Redis 7+
✅ Discord Bot Token (optional)
✅ Trackman API Credentials (optional)
✅ 8GB RAM minimum
✅ 100GB storage for data
```

### Installation
```bash
# Clone repositories
git clone https://github.com/ahump20/mlb-gameday-bot.git
git clone https://github.com/ahump20/mlb-data-lab.git

# Install Node dependencies
cd blaze-intelligence-official
npm install discord.js axios ioredis kafkajs pybaseball

# Install Python dependencies
pip install -r mlb-data-lab/requirements.txt
pip install pybaseball MLB-StatsAPI pandas numpy matplotlib seaborn

# Setup databases
createdb mlb_data_lab_db
psql -d mlb_data_lab_db -f mlb-data-lab/setup_db.sql
```

## 📋 Environment Configuration

### Create `.env.mlb` file:
```env
# MLB Configuration
MLB_TEAM_ID=114  # Cleveland Guardians (see team IDs below)
MLB_SEASON=2025

# Discord Bot (Optional)
DISCORD_TOKEN=your_discord_bot_token
DISCORD_CLIENT_ID=your_client_id
DISCORD_CHANNEL_IDS=channel1,channel2

# MLB Data Lab
PYTHON_PATH=/usr/bin/python3
MLB_DATA_LAB_PATH=/path/to/mlb-data-lab
OUTPUT_PATH=/path/to/output

# Trackman (Optional)
TRACKMAN_CLIENT_ID=your_client_id
TRACKMAN_CLIENT_SECRET=your_secret
TRACKMAN_USERNAME=your_username
TRACKMAN_PASSWORD=your_password

# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mlb_data_lab_db
REDIS_URL=redis://localhost:6379

# Features
ENABLE_DISCORD=true
ENABLE_TRACKMAN=false
ENABLE_CHAMPION_ANALYSIS=true
ENABLE_DATA_LAB=true

# Performance
CACHE_TTL=60000
POLL_INTERVAL=30000
LOG_LEVEL=info
```

## 🏟️ MLB Team IDs

```javascript
const MLB_TEAMS = {
  // American League East
  'Baltimore Orioles': 110,
  'Boston Red Sox': 111,
  'New York Yankees': 147,
  'Tampa Bay Rays': 139,
  'Toronto Blue Jays': 141,
  
  // American League Central
  'Chicago White Sox': 145,
  'Cleveland Guardians': 114,
  'Detroit Tigers': 116,
  'Kansas City Royals': 118,
  'Minnesota Twins': 142,
  
  // American League West
  'Houston Astros': 117,
  'Los Angeles Angels': 108,
  'Oakland Athletics': 133,
  'Seattle Mariners': 136,
  'Texas Rangers': 140,
  
  // National League East
  'Atlanta Braves': 144,
  'Miami Marlins': 146,
  'New York Mets': 121,
  'Philadelphia Phillies': 143,
  'Washington Nationals': 120,
  
  // National League Central
  'Chicago Cubs': 112,
  'Cincinnati Reds': 113,
  'Milwaukee Brewers': 158,
  'Pittsburgh Pirates': 134,
  'St. Louis Cardinals': 138,
  
  // National League West
  'Arizona Diamondbacks': 109,
  'Colorado Rockies': 115,
  'Los Angeles Dodgers': 119,
  'San Diego Padres': 135,
  'San Francisco Giants': 137
};
```

## 🎮 TypeScript Implementation

### Initialize MLB Hub
```typescript
import { MLBIntegrationHub } from './services/mlbIntegrationHub';

const mlbHub = new MLBIntegrationHub({
  teamId: 114, // Cleveland Guardians
  
  gamedayBot: {
    discordToken: process.env.DISCORD_TOKEN,
    discordClientId: process.env.DISCORD_CLIENT_ID,
    teamId: 114,
    channelIds: ['channel1', 'channel2']
  },
  
  dataLab: {
    pythonPath: '/usr/bin/python3',
    scriptPath: './mlb-data-lab/scripts',
    outputPath: './output'
  },
  
  trackman: {
    clientId: process.env.TRACKMAN_CLIENT_ID,
    clientSecret: process.env.TRACKMAN_CLIENT_SECRET,
    username: process.env.TRACKMAN_USERNAME,
    password: process.env.TRACKMAN_PASSWORD,
    systemType: 'V3'
  },
  
  enableChampionAnalysis: true,
  redisUrl: process.env.REDIS_URL
});

// Listen for game events
mlbHub.on('gameEvent', (event) => {
  console.log('Game Event:', event.description);
  
  if (event.statcast) {
    console.log(`Exit Velo: ${event.statcast.exitVelocity} mph`);
    console.log(`Launch Angle: ${event.statcast.launchAngle}°`);
  }
});

// Listen for Trackman data
mlbHub.on('barrel', (hit) => {
  console.log(`💥 BARREL! ${hit.exitSpeed} mph at ${hit.launchAngle}°`);
});
```

## 🎯 Key Features Implementation

### 1. Real-Time Game Tracking
```typescript
// Get current game status
const currentGame = await mlbHub.getCurrentGameStatus();
console.log(`${currentGame.awayTeam.name} @ ${currentGame.homeTeam.name}`);
console.log(`Score: ${currentGame.awayTeam.score} - ${currentGame.homeTeam.score}`);

// Subscribe Discord channel to updates
await mlbHub.subscribeChannel('discord-channel-id');

// Game events will automatically post to Discord
mlbHub.on('gameEvent', (event) => {
  // Automatically sends formatted embeds to Discord
});
```

### 2. Player Analytics
```typescript
// Get comprehensive player stats
const player = await mlbHub.getPlayerStats(660271); // Shane Bieber
console.log('ERA:', player.stats.pitching.era);
console.log('Savant Metrics:', player.savantMetrics);
console.log('Champion Profile:', player.championProfile);

// Generate visual summary sheet
const summary = await mlbHub.generatePlayerSummarySheet('Shane Bieber', 2025);
// Outputs: ./output/2025/Guardians/pitcher_summary_shane_bieber.png
```

### 3. Advanced Matchup Analysis
```typescript
// Analyze pitcher vs batter matchup
const matchup = await mlbHub.getMatchupAnalysis(
  pitcherId,
  batterId
);

console.log('Historical:', matchup.history);
console.log('Advantage:', matchup.advantage);
console.log('Confidence:', matchup.confidence);
console.log('Predicted Outcome:', matchup.prediction);
```

### 4. Team Summaries
```typescript
// Generate summary sheets for entire team
const teamSummaries = await mlbHub.generateTeamSummaries(
  'Cleveland Guardians',
  2025
);

// Generates individual PNG files for each player
// ./output/2025/Guardians/batter_summary_jose_ramirez.png
// ./output/2025/Guardians/pitcher_summary_shane_bieber.png
// etc.
```

## 🐳 Docker Deployment

### Docker Compose Configuration
```yaml
# docker-compose.yml
version: '3.8'

services:
  mlb-hub:
    build: .
    environment:
      - MLB_TEAM_ID=${MLB_TEAM_ID}
      - DISCORD_TOKEN=${DISCORD_TOKEN}
      - TRACKMAN_CLIENT_ID=${TRACKMAN_CLIENT_ID}
      - DATABASE_URL=postgresql://postgres:password@db:5432/mlb
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis
    volumes:
      - ./output:/app/output
      - ./mlb-data-lab:/app/mlb-data-lab
    ports:
      - "3000:3000"

  db:
    image: postgres:14
    environment:
      - POSTGRES_DB=mlb
      - POSTGRES_USER=postgres
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./mlb-data-lab/setup_db.sql:/docker-entrypoint-initdb.d/setup.sql

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

  gameday-bot:
    build: ./mlb-gameday-bot
    environment:
      - TOKEN=${DISCORD_TOKEN}
      - CLIENT_ID=${DISCORD_CLIENT_ID}
      - TEAM_ID=${MLB_TEAM_ID}
      - DATABASE_STRING=${DATABASE_URL}
    depends_on:
      - db

volumes:
  postgres_data:
```

### Dockerfile
```dockerfile
FROM node:18-alpine as node-builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM python:3.9-slim

# Install Node.js
RUN apt-get update && apt-get install -y nodejs npm

# Copy Node app
COPY --from=node-builder /app /app

# Install Python dependencies
COPY mlb-data-lab/requirements.txt /tmp/
RUN pip install -r /tmp/requirements.txt

WORKDIR /app

EXPOSE 3000
CMD ["node", "dist/server.js"]
```

## ☸️ Kubernetes Deployment

```yaml
# mlb-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: mlb-integration-hub
spec:
  replicas: 2
  selector:
    matchLabels:
      app: mlb-hub
  template:
    metadata:
      labels:
        app: mlb-hub
    spec:
      containers:
      - name: mlb-hub
        image: blazeintel/mlb-hub:latest
        env:
        - name: MLB_TEAM_ID
          value: "114"
        - name: DISCORD_TOKEN
          valueFrom:
            secretKeyRef:
              name: mlb-secrets
              key: discord-token
        - name: REDIS_URL
          value: redis://redis-service:6379
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "1Gi"
            cpu: "500m"
          limits:
            memory: "2Gi"
            cpu: "1000m"
---
apiVersion: v1
kind: Service
metadata:
  name: mlb-hub-service
spec:
  selector:
    app: mlb-hub
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 🔄 CI/CD Pipeline

### GitHub Actions Workflow
```yaml
# .github/workflows/mlb-deploy.yml
name: Deploy MLB Integration

on:
  push:
    branches: [main]
    paths:
      - 'src/services/mlb*.ts'
      - 'mlb-gameday-bot/**'
      - 'mlb-data-lab/**'

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
    
    - name: Setup Python
      uses: actions/setup-python@v4
      with:
        python-version: '3.9'
    
    - name: Install dependencies
      run: |
        npm ci
        pip install -r mlb-data-lab/requirements.txt
    
    - name: Run tests
      run: |
        npm test
        python -m pytest mlb-data-lab/tests
    
    - name: Build Docker image
      run: |
        docker build -t blazeintel/mlb-hub:${{ github.sha }} .
        docker tag blazeintel/mlb-hub:${{ github.sha }} blazeintel/mlb-hub:latest
    
    - name: Push to registry
      run: |
        echo ${{ secrets.DOCKER_PASSWORD }} | docker login -u ${{ secrets.DOCKER_USERNAME }} --password-stdin
        docker push blazeintel/mlb-hub:${{ github.sha }}
        docker push blazeintel/mlb-hub:latest
    
    - name: Deploy to Kubernetes
      run: |
        kubectl set image deployment/mlb-integration-hub mlb-hub=blazeintel/mlb-hub:${{ github.sha }}
        kubectl rollout status deployment/mlb-integration-hub
```

## 📊 Monitoring & Logging

### Grafana Dashboard Configuration
```json
{
  "dashboard": {
    "title": "MLB Integration Hub",
    "panels": [
      {
        "title": "Games Tracked",
        "targets": [
          {
            "expr": "mlb_games_tracked_total"
          }
        ]
      },
      {
        "title": "Discord Messages Sent",
        "targets": [
          {
            "expr": "rate(discord_messages_sent_total[5m])"
          }
        ]
      },
      {
        "title": "API Response Time",
        "targets": [
          {
            "expr": "histogram_quantile(0.95, mlb_api_duration_seconds)"
          }
        ]
      },
      {
        "title": "Trackman Events",
        "targets": [
          {
            "expr": "rate(trackman_events_total[1m])"
          }
        ]
      }
    ]
  }
}
```

### Logging Configuration
```typescript
// Winston logger setup
import winston from 'winston';

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.simple()
    })
  ]
});

// Use in MLB Hub
mlbHub.on('error', (error) => {
  logger.error('MLB Hub Error:', error);
});
```

## 🎯 Production Checklist

- [ ] Set up SSL certificates for webhook endpoints
- [ ] Configure rate limiting for API calls
- [ ] Set up database backups
- [ ] Configure Redis persistence
- [ ] Set up monitoring alerts
- [ ] Configure auto-scaling policies
- [ ] Set up error tracking (Sentry)
- [ ] Configure CDN for generated images
- [ ] Set up health check endpoints
- [ ] Document API keys and secrets

## 🔧 Troubleshooting

### Common Issues

#### Discord Bot Not Posting
```bash
# Check bot permissions
# Ensure bot has SEND_MESSAGES and EMBED_LINKS permissions

# Verify token
echo $DISCORD_TOKEN | base64 -d

# Check logs
docker logs mlb-gameday-bot
```

#### Python Scripts Not Running
```bash
# Verify Python path
which python3

# Check dependencies
pip list | grep pybaseball

# Test script manually
python mlb-data-lab/scripts/generate_player_summary.py --players "Shane Bieber"
```

#### API Rate Limiting
```typescript
// Implement exponential backoff
async function retryWithBackoff(fn: Function, retries = 3) {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(r => setTimeout(r, Math.pow(2, i) * 1000));
    }
  }
}
```

## 📈 Performance Optimization

### Caching Strategy
```typescript
// Redis caching for frequently accessed data
const cacheMiddleware = async (key: string, fn: Function, ttl = 60) => {
  const cached = await redis.get(key);
  if (cached) return JSON.parse(cached);
  
  const result = await fn();
  await redis.setex(key, ttl, JSON.stringify(result));
  return result;
};

// Use for player stats
const stats = await cacheMiddleware(
  `player:${playerId}`,
  () => mlbHub.getPlayerStats(playerId),
  300 // 5 minute cache
);
```

### Database Indexing
```sql
-- Optimize queries
CREATE INDEX idx_games_date ON games(game_date);
CREATE INDEX idx_players_team ON players(team_id);
CREATE INDEX idx_plate_appearances_game ON plate_appearances(game_id);
CREATE INDEX idx_pitches_pitcher ON pitches(pitcher_id);
```

## 📞 Support Resources

### Official Documentation
- **MLB Stats API**: https://statsapi.mlb.com/docs/
- **Baseball Savant**: https://baseballsavant.mlb.com/
- **Pybaseball**: https://github.com/jldbc/pybaseball
- **Discord.js**: https://discord.js.org/

### Community
- **Reddit**: r/Sabermetrics, r/baseball
- **GitHub Issues**: Report bugs in respective repos
- **Discord**: Baseball dev communities

---

**Last Updated**: August 2025
**Version**: 1.0.0
**Compatible With**: MLB Stats API v1, Discord.js v14, Python 3.9+

For questions or support, create an issue in the respective GitHub repositories.