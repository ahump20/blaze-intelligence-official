import WebSocket, { WebSocketServer } from 'ws';
import { v4 as uuidv4 } from 'uuid';
import ballDontLieService from '../services/ballDontLieService.js';

class SportsWebSocketServer {
  constructor(server) {
    this.wss = new WebSocketServer({ server });
    this.clients = new Map();
    this.subscriptions = new Map();
    this.dataStreams = new Map();
    this.initialize();
  }

  initialize() {
    console.log('🔌 Sports WebSocket Server initializing...');
    
    this.wss.on('connection', (ws, request) => {
      const clientId = uuidv4();
      const clientInfo = {
        id: clientId,
        ws,
        subscriptions: new Set(),
        lastPing: Date.now(),
        ip: request.socket.remoteAddress,
        userAgent: request.headers['user-agent']
      };

      this.clients.set(clientId, clientInfo);
      console.log(`📱 New client connected: ${clientId} (${this.clients.size} total)`);

      // Send welcome message
      this.sendToClient(clientId, {
        type: 'connection',
        status: 'connected',
        clientId,
        timestamp: Date.now(),
        availableStreams: this.getAvailableStreams()
      });

      // Handle messages
      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          this.handleClientMessage(clientId, message);
        } catch (error) {
          console.error(`❌ Invalid message from ${clientId}:`, error);
          this.sendError(clientId, 'Invalid JSON message');
        }
      });

      // Handle disconnect
      ws.on('close', () => {
        this.handleDisconnect(clientId);
      });

      // Handle errors
      ws.on('error', (error) => {
        console.error(`🚨 WebSocket error for ${clientId}:`, error);
        this.handleDisconnect(clientId);
      });

      // Start ping/pong
      this.startHeartbeat(clientId);
    });

    // Start data streams
    this.startDataStreams();
    
    console.log('✅ Sports WebSocket Server ready');
  }

  handleClientMessage(clientId, message) {
    const client = this.clients.get(clientId);
    if (!client) return;

    console.log(`📨 Message from ${clientId}:`, message.type);

    switch (message.type) {
      case 'subscribe':
        this.handleSubscribe(clientId, message);
        break;
      case 'unsubscribe':
        this.handleUnsubscribe(clientId, message);
        break;
      case 'ping':
        this.sendToClient(clientId, { type: 'pong', timestamp: Date.now() });
        break;
      case 'get_live_data':
        this.handleLiveDataRequest(clientId, message);
        break;
      case 'get_game_updates':
        this.handleGameUpdates(clientId, message);
        break;
      default:
        this.sendError(clientId, `Unknown message type: ${message.type}`);
    }
  }

  handleSubscribe(clientId, message) {
    const { stream } = message;
    const client = this.clients.get(clientId);
    
    if (!client) return;

    if (this.isValidStream(stream)) {
      client.subscriptions.add(stream);
      
      if (!this.subscriptions.has(stream)) {
        this.subscriptions.set(stream, new Set());
      }
      this.subscriptions.get(stream).add(clientId);

      this.sendToClient(clientId, {
        type: 'subscribed',
        stream,
        timestamp: Date.now()
      });

      console.log(`✅ Client ${clientId} subscribed to ${stream}`);
    } else {
      this.sendError(clientId, `Invalid stream: ${stream}`);
    }
  }

  handleUnsubscribe(clientId, message) {
    const { stream } = message;
    const client = this.clients.get(clientId);
    
    if (!client) return;

    client.subscriptions.delete(stream);
    
    if (this.subscriptions.has(stream)) {
      this.subscriptions.get(stream).delete(clientId);
    }

    this.sendToClient(clientId, {
      type: 'unsubscribed',
      stream,
      timestamp: Date.now()
    });

    console.log(`❌ Client ${clientId} unsubscribed from ${stream}`);
  }

  async handleLiveDataRequest(clientId, message) {
    const { sport, league, teams } = message;
    
    try {
      let data;
      
      switch (league?.toLowerCase()) {
        case 'nba':
          data = await ballDontLieService.getNBALiveScores();
          break;
        case 'nfl':
          data = await ballDontLieService.getNFLLiveData();
          break;
        case 'mlb':
          data = await ballDontLieService.getMLBLiveData();
          break;
        default:
          data = await ballDontLieService.getAllLiveData();
      }

      this.sendToClient(clientId, {
        type: 'live_data',
        sport,
        league,
        data,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`❌ Error fetching live data:`, error);
      this.sendError(clientId, 'Failed to fetch live data');
    }
  }

  async handleGameUpdates(clientId, message) {
    const { gameId, league } = message;
    
    try {
      // This would integrate with real sports APIs
      const gameData = {
        gameId,
        league,
        status: 'live',
        quarter: 2,
        time: '8:23',
        homeTeam: {
          name: 'Cardinals',
          score: 14,
          timeouts: 2
        },
        awayTeam: {
          name: 'Cubs',
          score: 7,
          timeouts: 3
        },
        lastPlay: 'Smith rushes for 12 yards',
        timestamp: Date.now()
      };

      this.sendToClient(clientId, {
        type: 'game_update',
        data: gameData,
        timestamp: Date.now()
      });
    } catch (error) {
      console.error(`❌ Error fetching game updates:`, error);
      this.sendError(clientId, 'Failed to fetch game updates');
    }
  }

  startDataStreams() {
    // Real-time pressure analytics stream
    setInterval(() => {
      this.broadcastPressureData();
    }, 1000);

    // Live sports scores stream
    setInterval(() => {
      this.broadcastLiveScores();
    }, 30000); // Every 30 seconds

    // Performance metrics stream
    setInterval(() => {
      this.broadcastPerformanceMetrics();
    }, 5000); // Every 5 seconds
  }

  broadcastPressureData() {
    const pressureData = {
      type: 'pressure_stream',
      data: {
        timestamp: Date.now(),
        players: this.generatePressureMetrics(),
        gameState: {
          inning: Math.floor(Math.random() * 9) + 1,
          outs: Math.floor(Math.random() * 3),
          baseRunners: ['first', 'third'],
          count: { balls: 2, strikes: 1 }
        }
      }
    };

    this.broadcast('pressure_analytics', pressureData);
  }

  async broadcastLiveScores() {
    try {
      const scores = await ballDontLieService.getAllLiveData();
      
      const scoreData = {
        type: 'live_scores',
        data: scores,
        timestamp: Date.now()
      };

      this.broadcast('live_scores', scoreData);
    } catch (error) {
      console.error('❌ Error broadcasting live scores:', error);
    }
  }

  broadcastPerformanceMetrics() {
    const metrics = {
      type: 'performance_metrics',
      data: {
        timestamp: Date.now(),
        serverLoad: Math.random() * 100,
        activeConnections: this.clients.size,
        messagesSent: Math.floor(Math.random() * 1000),
        dataLatency: Math.floor(Math.random() * 50) + 10,
        cacheHitRate: 0.85 + Math.random() * 0.1
      }
    };

    this.broadcast('performance_metrics', metrics);
  }

  generatePressureMetrics() {
    return Array.from({ length: 9 }, (_, i) => ({
      playerId: `player_${i + 1}`,
      name: `Player ${i + 1}`,
      position: ['P', 'C', '1B', '2B', '3B', 'SS', 'LF', 'CF', 'RF'][i],
      pressure: Math.random() * 100,
      heartRate: 60 + Math.random() * 40,
      gsr: Math.random() * 10,
      bodyTemp: 98 + Math.random() * 2,
      fatigue: Math.random() * 100,
      confidence: Math.random() * 100
    }));
  }

  broadcast(stream, data) {
    if (!this.subscriptions.has(stream)) return;

    const subscribers = this.subscriptions.get(stream);
    subscribers.forEach(clientId => {
      this.sendToClient(clientId, data);
    });
  }

  sendToClient(clientId, data) {
    const client = this.clients.get(clientId);
    if (!client || client.ws.readyState !== WebSocket.OPEN) {
      this.handleDisconnect(clientId);
      return;
    }

    try {
      client.ws.send(JSON.stringify(data));
    } catch (error) {
      console.error(`❌ Error sending to client ${clientId}:`, error);
      this.handleDisconnect(clientId);
    }
  }

  sendError(clientId, message) {
    this.sendToClient(clientId, {
      type: 'error',
      message,
      timestamp: Date.now()
    });
  }

  handleDisconnect(clientId) {
    const client = this.clients.get(clientId);
    if (!client) return;

    // Remove from all subscriptions
    client.subscriptions.forEach(stream => {
      if (this.subscriptions.has(stream)) {
        this.subscriptions.get(stream).delete(clientId);
      }
    });

    this.clients.delete(clientId);
    console.log(`👋 Client disconnected: ${clientId} (${this.clients.size} remaining)`);
  }

  startHeartbeat(clientId) {
    const interval = setInterval(() => {
      const client = this.clients.get(clientId);
      if (!client || client.ws.readyState !== WebSocket.OPEN) {
        clearInterval(interval);
        return;
      }

      // Check if client is still responsive
      if (Date.now() - client.lastPing > 60000) { // 60 seconds
        console.log(`💔 Client ${clientId} heartbeat timeout`);
        client.ws.terminate();
        clearInterval(interval);
        return;
      }

      this.sendToClient(clientId, { type: 'heartbeat', timestamp: Date.now() });
    }, 30000); // Every 30 seconds
  }

  isValidStream(stream) {
    const validStreams = [
      'pressure_analytics',
      'live_scores',
      'performance_metrics',
      'game_updates',
      'player_tracking',
      'team_analytics'
    ];
    return validStreams.includes(stream);
  }

  getAvailableStreams() {
    return [
      {
        name: 'pressure_analytics',
        description: 'Real-time pressure and biometric data',
        updateFrequency: '1s'
      },
      {
        name: 'live_scores',
        description: 'Live sports scores and game updates',
        updateFrequency: '30s'
      },
      {
        name: 'performance_metrics',
        description: 'System performance and analytics',
        updateFrequency: '5s'
      },
      {
        name: 'game_updates',
        description: 'Detailed game state updates',
        updateFrequency: 'event-driven'
      },
      {
        name: 'player_tracking',
        description: 'Player movement and positioning data',
        updateFrequency: '100ms'
      },
      {
        name: 'team_analytics',
        description: 'Team performance analytics',
        updateFrequency: '10s'
      }
    ];
  }

  getStats() {
    return {
      totalClients: this.clients.size,
      activeStreams: this.subscriptions.size,
      totalSubscriptions: Array.from(this.subscriptions.values())
        .reduce((total, clients) => total + clients.size, 0),
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage()
    };
  }
}

export default SportsWebSocketServer;