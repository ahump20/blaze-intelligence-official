/**
 * WebSocket Server for Mobile App Real-time Communication
 * Handles real-time updates for video analysis, sports data, and notifications
 */

import { WebSocketServer } from 'ws';
import jwt from 'jsonwebtoken';
import { createServer } from 'http';
import express from 'express';

const app = express();
const server = createServer(app);

// WebSocket server configuration
const wss = new WebSocketServer({
  server,
  path: '/mobile-ws',
  perMessageDeflate: false
});

// Connected clients map
const clients = new Map();

// Message types
const MESSAGE_TYPES = {
  AUTH: 'auth',
  SUBSCRIBE: 'subscribe',
  UNSUBSCRIBE: 'unsubscribe',
  BLAZE_SCORE_UPDATE: 'blaze_score_update',
  ANALYSIS_COMPLETE: 'analysis_complete',
  SPORTS_DATA_UPDATE: 'sports_data_update',
  LIVE_METRICS: 'live_metrics',
  NOTIFICATION: 'notification',
  PING: 'ping',
  PONG: 'pong'
};

// Client authentication
function authenticateClient(token) {
  try {
    // In production, verify JWT token
    if (token === 'demo_token') {
      return {
        userId: 'demo_user_123',
        name: 'Austin Humphrey',
        permissions: ['sports_data', 'analysis', 'notifications']
      };
    }
    return null;
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

// WebSocket connection handler
wss.on('connection', (ws, request) => {
  console.log('New mobile WebSocket connection from:', request.socket.remoteAddress);
  
  const clientId = generateClientId();
  let isAuthenticated = false;
  let userId = null;
  let subscriptions = new Set();

  // Store client connection
  clients.set(clientId, {
    ws,
    userId,
    subscriptions,
    connectedAt: new Date(),
    lastPing: new Date()
  });

  // Send connection acknowledgment
  ws.send(JSON.stringify({
    type: 'connection',
    clientId,
    message: 'Connected to Blaze Intelligence Mobile WebSocket'
  }));

  // Message handler
  ws.on('message', async (data) => {
    try {
      const message = JSON.parse(data.toString());
      
      switch (message.type) {
        case MESSAGE_TYPES.AUTH:
          await handleAuthentication(ws, clientId, message);
          break;
          
        case MESSAGE_TYPES.SUBSCRIBE:
          if (isAuthenticated) {
            handleSubscription(ws, clientId, message);
          } else {
            sendError(ws, 'Authentication required');
          }
          break;
          
        case MESSAGE_TYPES.UNSUBSCRIBE:
          if (isAuthenticated) {
            handleUnsubscription(ws, clientId, message);
          }
          break;
          
        case MESSAGE_TYPES.PING:
          ws.send(JSON.stringify({ type: MESSAGE_TYPES.PONG, timestamp: Date.now() }));
          clients.get(clientId).lastPing = new Date();
          break;
          
        default:
          sendError(ws, `Unknown message type: ${message.type}`);
      }
    } catch (error) {
      console.error('Message parsing error:', error);
      sendError(ws, 'Invalid message format');
    }
  });

  // Authentication handler
  async function handleAuthentication(ws, clientId, message) {
    const user = authenticateClient(message.token);
    
    if (user) {
      isAuthenticated = true;
      userId = user.userId;
      
      // Update client info
      const client = clients.get(clientId);
      client.userId = userId;
      client.user = user;
      
      ws.send(JSON.stringify({
        type: 'auth_success',
        userId: user.userId,
        permissions: user.permissions
      }));
      
      console.log(`Client ${clientId} authenticated as ${user.name}`);
    } else {
      sendError(ws, 'Authentication failed');
    }
  }

  // Subscription handler
  function handleSubscription(ws, clientId, message) {
    const { channels } = message;
    const client = clients.get(clientId);
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        client.subscriptions.add(channel);
      });
      
      ws.send(JSON.stringify({
        type: 'subscription_success',
        channels: Array.from(client.subscriptions)
      }));
      
      console.log(`Client ${clientId} subscribed to:`, channels);
    }
  }

  // Unsubscription handler
  function handleUnsubscription(ws, clientId, message) {
    const { channels } = message;
    const client = clients.get(clientId);
    
    if (Array.isArray(channels)) {
      channels.forEach(channel => {
        client.subscriptions.delete(channel);
      });
      
      ws.send(JSON.stringify({
        type: 'unsubscription_success',
        channels: channels
      }));
    }
  }

  // Connection close handler
  ws.on('close', (code, reason) => {
    console.log(`Client ${clientId} disconnected:`, code, reason.toString());
    clients.delete(clientId);
  });

  // Error handler
  ws.on('error', (error) => {
    console.error(`WebSocket error for client ${clientId}:`, error);
    clients.delete(clientId);
  });
});

// Utility functions
function generateClientId() {
  return 'mobile_' + Math.random().toString(36).substr(2, 9);
}

function sendError(ws, message) {
  ws.send(JSON.stringify({
    type: 'error',
    message,
    timestamp: Date.now()
  }));
}

// Broadcast functions
export function broadcastToSubscribers(channel, data) {
  const message = JSON.stringify({
    type: MESSAGE_TYPES.SPORTS_DATA_UPDATE,
    channel,
    data,
    timestamp: Date.now()
  });

  clients.forEach((client, clientId) => {
    if (client.subscriptions.has(channel) && client.ws.readyState === 1) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error(`Failed to send to client ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  });
}

export function notifyAnalysisComplete(userId, analysisData) {
  const message = JSON.stringify({
    type: MESSAGE_TYPES.ANALYSIS_COMPLETE,
    data: analysisData,
    timestamp: Date.now()
  });

  clients.forEach((client, clientId) => {
    if (client.userId === userId && client.ws.readyState === 1) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error(`Failed to notify client ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  });
}

export function updateBlazeScore(userId, newScore) {
  const message = JSON.stringify({
    type: MESSAGE_TYPES.BLAZE_SCORE_UPDATE,
    data: { blazeScore: newScore },
    timestamp: Date.now()
  });

  clients.forEach((client, clientId) => {
    if (client.userId === userId && client.ws.readyState === 1) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error(`Failed to update client ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  });
}

export function broadcastLiveMetrics(metricsData) {
  const message = JSON.stringify({
    type: MESSAGE_TYPES.LIVE_METRICS,
    data: metricsData,
    timestamp: Date.now()
  });

  clients.forEach((client, clientId) => {
    if (client.subscriptions.has('live_metrics') && client.ws.readyState === 1) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error(`Failed to send metrics to client ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  });
}

export function sendNotification(userId, notification) {
  const message = JSON.stringify({
    type: MESSAGE_TYPES.NOTIFICATION,
    data: notification,
    timestamp: Date.now()
  });

  clients.forEach((client, clientId) => {
    if (client.userId === userId && client.ws.readyState === 1) {
      try {
        client.ws.send(message);
      } catch (error) {
        console.error(`Failed to send notification to client ${clientId}:`, error);
        clients.delete(clientId);
      }
    }
  });
}

// Periodic cleanup of stale connections
setInterval(() => {
  const now = new Date();
  const timeout = 5 * 60 * 1000; // 5 minutes

  clients.forEach((client, clientId) => {
    if (now - client.lastPing > timeout) {
      console.log(`Removing stale client ${clientId}`);
      client.ws.terminate();
      clients.delete(clientId);
    }
  });
}, 60000); // Check every minute

// Start server
const PORT = process.env.WS_PORT || 3001;
server.listen(PORT, () => {
  console.log(`🔥 Blaze Intelligence Mobile WebSocket server running on port ${PORT}`);
  console.log(`WebSocket endpoint: ws://localhost:${PORT}/mobile-ws`);
});

// Export server for external use
export default server;