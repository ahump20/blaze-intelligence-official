# 🎯 Trackman Baseball API Integration & Deployment Guide

## Complete Setup for Blaze Intelligence Platform (2025)

## 📊 Overview

Trackman Baseball provides the most accurate ball tracking data in baseball, using military-grade Doppler radar technology to capture comprehensive metrics for both pitching and hitting. This guide covers the complete integration, setup, and deployment process for the Blaze Intelligence platform.

## 🚀 Quick Start

### Prerequisites
```bash
# Required accounts and access
✅ Trackman API credentials (contact sales@trackman.com)
✅ Redis server for caching
✅ Kafka cluster (optional, for streaming)
✅ Node.js 18+ and TypeScript 5+
✅ SSL certificate for webhook endpoints
```

### Installation
```bash
# Install dependencies
npm install axios ws ioredis kafkajs express helmet
npm install --save-dev @types/ws @types/express

# Environment setup
cp .env.example .env.trackman
# Edit .env.trackman with your credentials
```

## 🔑 API Authentication Setup

### 1. Obtain Credentials

Contact Trackman to receive:
- **Client ID**: Unique identifier for your application
- **Client Secret**: Secret key for authentication
- **Username**: Your organization's username
- **Password**: Your organization's password

### 2. Environment Configuration

```env
# .env.trackman
TRACKMAN_CLIENT_ID=your_client_id_here
TRACKMAN_CLIENT_SECRET=your_client_secret_here
TRACKMAN_USERNAME=your_username_here
TRACKMAN_PASSWORD=your_password_here
TRACKMAN_BASE_URL=https://api.trackman.com
TRACKMAN_STAGING_URL=https://staging-api.trackman.com
TRACKMAN_WEBHOOK_URL=https://your-domain.com/webhooks/trackman
TRACKMAN_SYSTEM_TYPE=V3  # or B1 or both

# Infrastructure
REDIS_URL=redis://localhost:6379
KAFKA_BROKERS=localhost:9092
KAFKA_CLIENT_ID=trackman-consumer

# Features
ENABLE_WEBHOOKS=true
ENABLE_WEBSOCKET=true
ENABLE_KAFKA=true
```

### 3. Initialize Service

```typescript
import { TrackmanBaseballService } from './services/trackmanBaseball';

const trackman = new TrackmanBaseballService({
  clientId: process.env.TRACKMAN_CLIENT_ID!,
  clientSecret: process.env.TRACKMAN_CLIENT_SECRET!,
  username: process.env.TRACKMAN_USERNAME!,
  password: process.env.TRACKMAN_PASSWORD!,
  systemType: 'V3',
  enableWebhooks: true,
  enableWebSocket: true,
  enableKafka: true,
  redisUrl: process.env.REDIS_URL,
  kafkaConfig: {
    brokers: [process.env.KAFKA_BROKERS!],
    clientId: process.env.KAFKA_CLIENT_ID!
  }
});

// Wait for authentication
trackman.on('authenticated', () => {
  console.log('✅ Trackman API authenticated');
});
```

## 📡 Data Integration Methods

### Method 1: REST API (Post-Session)

Best for: Historical data, batch processing, reports

```typescript
// Query historical pitch data
const pitches = await trackman.queryPitches({
  pitcherId: 'player-123',
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-08-15'),
  minVelocity: 90,
  pitchType: '4-seam'
});

// Get player trends
const trends = await trackman.getPlayerTrends(
  'player-123',
  'velocity',
  30  // last 30 days
);
```

### Method 2: WebSocket (Real-Time)

Best for: Live game tracking, immediate updates

```typescript
// Stream live game data
await trackman.streamGameData('game-456');

// Subscribe to specific player
trackman.subscribeToPlayer('player-123');

// Handle real-time events
trackman.on('pitch', (pitch) => {
  console.log(`New pitch: ${pitch.releaseSpeed} mph`);
  // Update UI, trigger alerts, etc.
});

trackman.on('barrel', (hit) => {
  console.log(`BARREL! ${hit.exitSpeed} mph at ${hit.launchAngle}°`);
});
```

### Method 3: Webhooks (Semi Real-Time)

Best for: Automated workflows, 3-second latency acceptable

```typescript
// Express webhook endpoint
app.post('/webhooks/trackman', async (req, res) => {
  const payload = req.body;
  
  // Verify signature (important for security)
  const signature = req.headers['x-trackman-signature'];
  if (!verifySignature(payload, signature)) {
    return res.status(401).send('Invalid signature');
  }
  
  // Process webhook
  await trackman.processWebhook(payload);
  
  res.status(200).send('OK');
});
```

### Method 4: Kafka Streaming

Best for: High-volume processing, distributed systems

```typescript
// Kafka consumer setup
const consumer = kafka.consumer({ groupId: 'trackman-analytics' });
await consumer.subscribe({ topics: ['trackman-pitches', 'trackman-hits'] });

await consumer.run({
  eachMessage: async ({ topic, message }) => {
    const data = JSON.parse(message.value.toString());
    
    if (topic === 'trackman-pitches') {
      await processPitch(data);
    } else if (topic === 'trackman-hits') {
      await processHit(data);
    }
  }
});
```

## 📈 Key Metrics and Use Cases

### Pitching Metrics

```typescript
interface PitchingMetrics {
  // Velocity
  releaseSpeed: number;        // 85-105 mph typical
  velocityAtPlate: number;     // Speed when crossing plate
  
  // Spin
  spinRate: number;            // 1800-3000 rpm typical
  spinEfficiency: number;      // 0-100% (Magnus efficiency)
  activeSpin: number;          // Contributes to movement
  
  // Movement
  verticalBreak: number;       // -20 to +20 inches
  horizontalBreak: number;     // -20 to +20 inches
  
  // Release
  extension: number;           // 5-7 feet typical
  releaseHeight: number;       // 5-6.5 feet typical
  
  // Advanced
  stuffPlus: number;           // 100 = league average
  locationPlus: number;        // 100 = league average
}
```

### Hitting Metrics

```typescript
interface HittingMetrics {
  // Contact
  exitVelocity: number;        // 60-120 mph
  launchAngle: number;         // -90 to +90 degrees
  
  // Optimal ranges
  barrelZone: {
    exitVelo: [98, 120],       // mph
    launchAngle: [26, 30]      // degrees
  };
  
  // Classification
  sweetSpot: boolean;          // 8-32° launch angle
  hardHit: boolean;           // 95+ mph exit velo
  barrel: boolean;            // Optimal contact
}
```

## 🎮 In-App Implementation

### 1. Real-Time Dashboard Component

```typescript
// components/TrackmanDashboard.tsx
import React, { useEffect, useState } from 'react';
import { TrackmanBaseballService } from '../services/trackmanBaseball';

const TrackmanDashboard: React.FC = () => {
  const [currentPitch, setCurrentPitch] = useState(null);
  const [sessionStats, setSessionStats] = useState(null);
  const [alerts, setAlerts] = useState([]);

  useEffect(() => {
    const trackman = new TrackmanBaseballService(config);

    // Real-time pitch tracking
    trackman.on('pitch', (pitch) => {
      setCurrentPitch(pitch);
      
      // Check for notable pitches
      if (pitch.releaseSpeed > 98) {
        setAlerts(prev => [...prev, {
          type: 'high-velo',
          message: `🔥 ${pitch.releaseSpeed} mph heater!`
        }]);
      }
    });

    // Barrel detection
    trackman.on('barrel', (hit) => {
      setAlerts(prev => [...prev, {
        type: 'barrel',
        message: `💥 Barrel! ${hit.exitSpeed} mph at ${hit.launchAngle}°`
      }]);
    });

    return () => trackman.disconnect();
  }, []);

  return (
    <div className="trackman-dashboard">
      <div className="pitch-display">
        {currentPitch && (
          <>
            <h2>{currentPitch.releaseSpeed} mph</h2>
            <p>Spin: {currentPitch.spinRate} rpm</p>
            <p>Break: {currentPitch.verticalMovement}" V, {currentPitch.horizontalMovement}" H</p>
          </>
        )}
      </div>
      
      <div className="alerts">
        {alerts.map((alert, i) => (
          <div key={i} className={`alert alert-${alert.type}`}>
            {alert.message}
          </div>
        ))}
      </div>
    </div>
  );
};
```

### 2. Session Management Interface

```typescript
// components/TrackmanSession.tsx
const TrackmanSession: React.FC = () => {
  const [session, setSession] = useState(null);
  const [isRecording, setIsRecording] = useState(false);

  const startSession = async (playerId: string, type: string) => {
    const newSession = await trackman.startSession(playerId, type);
    setSession(newSession);
    setIsRecording(true);
  };

  const endSession = async () => {
    if (session) {
      const summary = await trackman.endSession(session.sessionId);
      console.log('Session Summary:', summary);
      setIsRecording(false);
    }
  };

  return (
    <div className="session-manager">
      {!isRecording ? (
        <button onClick={() => startSession('player-123', 'bullpen')}>
          Start Bullpen Session
        </button>
      ) : (
        <>
          <div className="recording-indicator">
            🔴 Recording Session: {session.sessionId}
          </div>
          <button onClick={endSession}>End Session</button>
        </>
      )}
    </div>
  );
};
```

### 3. Player Comparison Tool

```typescript
// components/PlayerComparison.tsx
const PlayerComparison: React.FC = () => {
  const [comparison, setComparison] = useState(null);

  const compareToLeague = async (playerId: string) => {
    const data = await trackman.compareToLeague(playerId, 'MLB');
    setComparison(data);
  };

  return (
    <div className="comparison-chart">
      {comparison && (
        <>
          <h3>League Comparison</h3>
          <div className="metric">
            <span>Velocity</span>
            <span>{comparison.velocity.percentile}th percentile</span>
            <span>{comparison.velocity.player} mph (League: {comparison.velocity.league})</span>
          </div>
          <div className="metric">
            <span>Spin Rate</span>
            <span>{comparison.spinRate.percentile}th percentile</span>
            <span>{comparison.spinRate.player} rpm (League: {comparison.spinRate.league})</span>
          </div>
        </>
      )}
    </div>
  );
};
```

## 🚢 Deployment

### 1. Docker Configuration

```dockerfile
# Dockerfile
FROM node:18-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

EXPOSE 3000

CMD ["node", "dist/server.js"]
```

### 2. Docker Compose Setup

```yaml
# docker-compose.yml
version: '3.8'

services:
  trackman-service:
    build: .
    environment:
      - TRACKMAN_CLIENT_ID=${TRACKMAN_CLIENT_ID}
      - TRACKMAN_CLIENT_SECRET=${TRACKMAN_CLIENT_SECRET}
      - TRACKMAN_USERNAME=${TRACKMAN_USERNAME}
      - TRACKMAN_PASSWORD=${TRACKMAN_PASSWORD}
      - REDIS_URL=redis://redis:6379
      - KAFKA_BROKERS=kafka:9092
    depends_on:
      - redis
      - kafka
    ports:
      - "3000:3000"

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data

  kafka:
    image: confluentinc/cp-kafka:latest
    environment:
      - KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181
      - KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://kafka:9092
    depends_on:
      - zookeeper

  zookeeper:
    image: confluentinc/cp-zookeeper:latest
    environment:
      - ZOOKEEPER_CLIENT_PORT=2181

volumes:
  redis_data:
```

### 3. Kubernetes Deployment

```yaml
# trackman-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: trackman-service
spec:
  replicas: 3
  selector:
    matchLabels:
      app: trackman
  template:
    metadata:
      labels:
        app: trackman
    spec:
      containers:
      - name: trackman
        image: blazeintel/trackman:latest
        env:
        - name: TRACKMAN_CLIENT_ID
          valueFrom:
            secretKeyRef:
              name: trackman-secrets
              key: client-id
        - name: TRACKMAN_CLIENT_SECRET
          valueFrom:
            secretKeyRef:
              name: trackman-secrets
              key: client-secret
        ports:
        - containerPort: 3000
        resources:
          requests:
            memory: "256Mi"
            cpu: "250m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: trackman-service
spec:
  selector:
    app: trackman
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

### 4. Production Deployment Script

```bash
#!/bin/bash
# deploy-trackman.sh

# Build and tag Docker image
docker build -t blazeintel/trackman:latest .
docker tag blazeintel/trackman:latest blazeintel/trackman:$(git rev-parse --short HEAD)

# Push to registry
docker push blazeintel/trackman:latest
docker push blazeintel/trackman:$(git rev-parse --short HEAD)

# Deploy to Kubernetes
kubectl apply -f trackman-deployment.yaml
kubectl rollout status deployment/trackman-service

# Verify deployment
kubectl get pods -l app=trackman
kubectl logs -l app=trackman --tail=50

echo "✅ Trackman service deployed successfully"
```

## 🎯 Advanced Use Cases

### 1. Pitch Prediction Model

```typescript
// Predict next pitch based on game situation
const predictNextPitch = async (gameState) => {
  const prediction = await trackman.predictNextPitch(
    gameState.pitcherId,
    gameState.batterId,
    {
      count: { balls: 2, strikes: 1 },
      runners: { first: true, second: false, third: false },
      inning: 7,
      score: { home: 3, away: 2 }
    }
  );

  // Display prediction probabilities
  prediction.predictions.forEach(p => {
    console.log(`${p.pitchType}: ${(p.probability * 100).toFixed(1)}%`);
  });
};
```

### 2. Fatigue Detection

```typescript
// Monitor velocity decline over session
const detectFatigue = (session) => {
  const velocityTrend = session.velocityTrend;
  const recentAvg = velocityTrend.slice(-5).reduce((a, b) => a + b, 0) / 5;
  const initialAvg = velocityTrend.slice(0, 5).reduce((a, b) => a + b, 0) / 5;
  
  const decline = initialAvg - recentAvg;
  
  if (decline > 2) {
    console.warn(`⚠️ Velocity down ${decline.toFixed(1)} mph - possible fatigue`);
    return true;
  }
  return false;
};
```

### 3. Tunnel Analysis

```typescript
// Analyze pitch tunneling effectiveness
const analyzeTunnel = async (pitcherId: string) => {
  const sequencing = await trackman.analyzeSequencing(pitcherId);
  
  if (sequencing.tunneling > 80) {
    console.log('🎯 Elite tunneling - pitches look identical longer');
  }
  
  // Find most effective sequences
  const bestSequences = sequencing.sequences
    .filter(s => s.effectiveness > 0.7)
    .sort((a, b) => b.putAwayRate - a.putAwayRate);
  
  return bestSequences;
};
```

## 📊 Performance Benchmarks

### System Requirements
- **CPU**: 2+ cores recommended
- **RAM**: 4GB minimum, 8GB recommended
- **Storage**: 100GB for data caching
- **Network**: 10 Mbps minimum for real-time streaming

### Data Latency
- **REST API**: 100-500ms response time
- **WebSocket**: <50ms for live updates
- **Webhooks**: 3 seconds from capture to delivery
- **Kafka**: <100ms end-to-end

### Rate Limits
- **V3 Stadium**: No hard limits (reasonable use)
- **B1 Portable**: 1000 requests/minute
- **Webhooks**: Can handle 100+ events/second

## 🔒 Security Best Practices

1. **API Key Storage**: Never commit credentials to version control
2. **Webhook Verification**: Always verify webhook signatures
3. **SSL/TLS**: Use HTTPS for all API communications
4. **Rate Limiting**: Implement client-side rate limiting
5. **Data Encryption**: Encrypt sensitive data at rest
6. **Access Control**: Use role-based access for different user types

## 🆘 Troubleshooting

### Common Issues

#### Authentication Failures
```typescript
// Check token expiry and refresh
trackman.on('authError', async (error) => {
  console.error('Auth failed:', error);
  // Attempt to re-authenticate
  await trackman.authenticate();
});
```

#### WebSocket Connection Issues
```typescript
// Implement reconnection logic
trackman.on('wsDisconnected', () => {
  console.log('WebSocket disconnected, will auto-reconnect...');
});

trackman.on('wsConnected', () => {
  console.log('WebSocket reconnected');
  // Re-subscribe to necessary channels
});
```

#### Data Quality Issues
```typescript
// Validate incoming data
const validatePitchData = (pitch) => {
  if (pitch.releaseSpeed < 40 || pitch.releaseSpeed > 110) {
    console.warn('Suspicious velocity reading:', pitch.releaseSpeed);
    return false;
  }
  if (pitch.spinRate < 0 || pitch.spinRate > 4000) {
    console.warn('Suspicious spin rate:', pitch.spinRate);
    return false;
  }
  return true;
};
```

## 📞 Support Resources

### Trackman Support
- **Email**: support@trackman.com
- **Phone**: 1-844-TRACKMAN
- **Documentation**: https://support.trackmanbaseball.com
- **API Status**: https://status.trackman.com

### Community Resources
- **GitHub**: Search for "trackman-api" repositories
- **Stack Overflow**: Tag questions with "trackman-baseball"
- **Reddit**: r/baseballdata, r/Sabermetrics

### Integration Partners
- **6-4-3 Charts**: Visual analytics platform
- **Baseball Savant**: MLB Statcast integration
- **FanGraphs**: Advanced statistics platform

## 📅 Maintenance Schedule

- **API Updates**: Quarterly (check changelog)
- **Webhook Schema**: Version locked, changes announced 30 days ahead
- **Maintenance Windows**: Sunday 2-6 AM ET (announced 48h ahead)

---

**Last Updated**: August 2025
**API Version**: 3.0
**Integration Version**: 1.0.0

For the latest updates and documentation, visit the [Trackman Developer Portal](https://developer.trackman.com).