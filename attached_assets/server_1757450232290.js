// Blaze Intelligence WebSocket Server
// Real-time sports data streaming infrastructure

import { createServer } from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import express from 'express';
import cors from 'cors';

const app = express();
const httpServer = createServer(app);
const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: process.env.REDIS_PORT || 6379,
  retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Configure Socket.IO with production settings
const io = new Server(httpServer, {
  cors: {
    origin: process.env.CLIENT_URL || "https://blaze-intelligence.com",
    credentials: true
  },
  transports: ['websocket', 'polling'],
  pingTimeout: 60000,
  pingInterval: 25000
});

// Middleware
app.use(cors());
app.use(express.json());

// Room management for different data streams
const CHANNELS = {
  MLB: 'mlb:live',
  NFL: 'nfl:live',
  NBA: 'nba:live',
  NCAA: 'ncaa:live',
  BETTING: 'betting:odds',
  INSIGHTS: 'ai:insights'
};

// Authentication middleware for Socket.IO
io.use(async (socket, next) => {
  const token = socket.handshake.auth.token;
  try {
    // Verify JWT token and subscription tier
    const user = await verifyToken(token);
    socket.userId = user.id;
    socket.tier = user.subscriptionTier;
    socket.allowedChannels = getTierChannels(user.subscriptionTier);
    next();
  } catch (err) {
    next(new Error('Authentication failed'));
  }
});

// Connection handler
io.on('connection', (socket) => {
  console.log(`Client connected: ${socket.id} | User: ${socket.userId}`);
  
  // Send connection confirmation with server time
  socket.emit('connected', {
    serverTime: Date.now(),
    tier: socket.tier,
    channels: socket.allowedChannels
  });

  // Subscribe to sport-specific channels
  socket.on('subscribe', async (channel) => {
    if (!socket.allowedChannels.includes(channel)) {
      socket.emit('error', { message: 'Insufficient subscription tier' });
      return;
    }
    
    socket.join(channel);
    
    // Send latest cached data immediately
    const cachedData = await redis.get(`cache:${channel}`);
    if (cachedData) {
      socket.emit('initial-data', {
        channel,
        data: JSON.parse(cachedData)
      });
    }
    
    socket.emit('subscribed', { channel });
  });

  // Handle real-time game queries
  socket.on('query', async (data) => {
    const { gameId, metrics, timeRange } = data;
    
    try {
      const result = await processGameQuery(gameId, metrics, timeRange);
      socket.emit('query-result', {
        queryId: data.queryId,
        result,
        latency: Date.now() - data.timestamp
      });
    } catch (error) {
      socket.emit('query-error', {
        queryId: data.queryId,
        error: error.message
      });
    }
  });

  // Unsubscribe from channels
  socket.on('unsubscribe', (channel) => {
    socket.leave(channel);
    socket.emit('unsubscribed', { channel });
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Real-time data broadcast system
class DataBroadcaster {
  constructor() {
    this.intervals = new Map();
  }

  startBroadcast(channel, interval = 1000) {
    if (this.intervals.has(channel)) return;
    
    const broadcastInterval = setInterval(async () => {
      try {
        // Fetch latest data from your data sources
        const data = await fetchLatestData(channel);
        
        // Cache in Redis
        await redis.setex(`cache:${channel}`, 5, JSON.stringify(data));
        
        // Broadcast to all clients in the channel
        io.to(channel).emit('data-update', {
          channel,
          timestamp: Date.now(),
          data
        });
        
        // Emit performance metrics
        io.to(channel).emit('metrics', {
          channel,
          connectedClients: io.sockets.adapter.rooms.get(channel)?.size || 0,
          dataPoints: data.length,
          updateInterval: interval
        });
      } catch (error) {
        console.error(`Broadcast error for ${channel}:`, error);
      }
    }, interval);
    
    this.intervals.set(channel, broadcastInterval);
  }

  stopBroadcast(channel) {
    const interval = this.intervals.get(channel);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(channel);
    }
  }
}

// Mock data fetcher (replace with actual data sources)
async function fetchLatestData(channel) {
  // This would connect to your actual data providers
  return {
    games: [
      {
        id: 'game_001',
        home: 'DAL',
        away: 'PHI',
        score: { home: 21, away: 17 },
        quarter: 3,
        time: '8:42',
        possession: 'DAL',
        situation: '2nd & 7',
        winProbability: { home: 0.68, away: 0.32 },
        lastUpdate: Date.now()
      }
    ],
    insights: [
      {
        type: 'momentum',
        team: 'DAL',
        value: 0.73,
        trend: 'increasing',
        factors: ['3 consecutive first downs', 'opponent timeout used']
      }
    ]
  };
}

// Initialize broadcasters for each channel
const broadcaster = new DataBroadcaster();
Object.values(CHANNELS).forEach(channel => {
  broadcaster.startBroadcast(channel, channel.includes('betting') ? 500 : 1000);
});

// Health check endpoint
app.get('/health', (req, res) => {
  const rooms = io.sockets.adapter.rooms;
  res.json({
    status: 'healthy',
    uptime: process.uptime(),
    connections: io.sockets.sockets.size,
    rooms: Array.from(rooms.keys()).filter(room => !room.startsWith('/')),
    timestamp: Date.now()
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing connections...');
  io.close(() => {
    redis.disconnect();
    process.exit(0);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => {
  console.log(`Blaze Intelligence WebSocket Server running on port ${PORT}`);
});

// Helper functions
function getTierChannels(tier) {
  const channels = {
    starter: [CHANNELS.MLB, CHANNELS.NFL],
    professional: [...Object.values(CHANNELS)].filter(c => !c.includes('ai')),
    enterprise: Object.values(CHANNELS)
  };
  return channels[tier] || [];
}

async function verifyToken(token) {
  // Implement JWT verification
  return { id: 'user_123', subscriptionTier: 'professional' };
}

async function processGameQuery(gameId, metrics, timeRange) {
  // Implement game query logic
  return { gameId, metrics, data: [] };
}
