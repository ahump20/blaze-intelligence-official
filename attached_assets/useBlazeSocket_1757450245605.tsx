// Blaze Intelligence WebSocket Client Hook
// React/Next.js implementation for real-time data streaming

import { useEffect, useState, useCallback, useRef } from 'react';
import io, { Socket } from 'socket.io-client';

interface BlazeSocketOptions {
  autoConnect?: boolean;
  tier?: 'starter' | 'professional' | 'enterprise';
  channels?: string[];
}

interface GameData {
  id: string;
  home: string;
  away: string;
  score: { home: number; away: number };
  quarter: number;
  time: string;
  possession: string;
  situation: string;
  winProbability: { home: number; away: number };
  lastUpdate: number;
}

interface Insight {
  type: string;
  team: string;
  value: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  factors: string[];
}

interface StreamData {
  games: GameData[];
  insights: Insight[];
}

interface ConnectionStatus {
  connected: boolean;
  latency: number;
  tier: string;
  channels: string[];
}

export const useBlazeSocket = (options: BlazeSocketOptions = {}) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>({
    connected: false,
    latency: 0,
    tier: '',
    channels: []
  });
  const [streamData, setStreamData] = useState<Map<string, StreamData>>(new Map());
  const [error, setError] = useState<string | null>(null);
  
  const latencyCheckInterval = useRef<NodeJS.Timeout>();
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  // Initialize socket connection
  useEffect(() => {
    if (!options.autoConnect) return;

    const socketInstance = io(process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001', {
      auth: {
        token: localStorage.getItem('blazeToken') || ''
      },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts
    });

    // Connection event handlers
    socketInstance.on('connect', () => {
      console.log('🔥 Blaze Intelligence Connected');
      setConnectionStatus(prev => ({ ...prev, connected: true }));
      reconnectAttempts.current = 0;
      setError(null);
      
      // Start latency monitoring
      startLatencyCheck(socketInstance);
    });

    socketInstance.on('connected', (data) => {
      setConnectionStatus(prev => ({
        ...prev,
        tier: data.tier,
        channels: data.channels
      }));
    });

    socketInstance.on('disconnect', () => {
      console.log('Disconnected from Blaze Intelligence');
      setConnectionStatus(prev => ({ ...prev, connected: false }));
      stopLatencyCheck();
    });

    socketInstance.on('connect_error', (err) => {
      setError(`Connection error: ${err.message}`);
      reconnectAttempts.current++;
      
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        socketInstance.disconnect();
        setError('Maximum reconnection attempts reached. Please refresh the page.');
      }
    });

    // Data event handlers
    socketInstance.on('data-update', (data: { channel: string; timestamp: number; data: StreamData }) => {
      setStreamData(prev => {
        const updated = new Map(prev);
        updated.set(data.channel, data.data);
        return updated;
      });
      
      // Calculate and update latency
      const latency = Date.now() - data.timestamp;
      setConnectionStatus(prev => ({ ...prev, latency }));
    });

    socketInstance.on('initial-data', (data: { channel: string; data: StreamData }) => {
      setStreamData(prev => {
        const updated = new Map(prev);
        updated.set(data.channel, data.data);
        return updated;
      });
    });

    socketInstance.on('error', (data: { message: string }) => {
      setError(data.message);
    });

    socketInstance.on('metrics', (data: any) => {
      console.log('📊 Metrics:', data);
    });

    setSocket(socketInstance);

    // Auto-subscribe to channels if provided
    if (options.channels && options.channels.length > 0) {
      options.channels.forEach(channel => {
        socketInstance.emit('subscribe', channel);
      });
    }

    return () => {
      stopLatencyCheck();
      socketInstance.disconnect();
    };
  }, [options.autoConnect]);

  // Latency monitoring
  const startLatencyCheck = (socketInstance: Socket) => {
    latencyCheckInterval.current = setInterval(() => {
      const start = Date.now();
      socketInstance.emit('ping');
      socketInstance.once('pong', () => {
        const latency = Date.now() - start;
        setConnectionStatus(prev => ({ ...prev, latency }));
      });
    }, 5000);
  };

  const stopLatencyCheck = () => {
    if (latencyCheckInterval.current) {
      clearInterval(latencyCheckInterval.current);
    }
  };

  // Subscribe to a channel
  const subscribe = useCallback((channel: string) => {
    if (!socket) {
      setError('Socket not connected');
      return;
    }
    socket.emit('subscribe', channel);
  }, [socket]);

  // Unsubscribe from a channel
  const unsubscribe = useCallback((channel: string) => {
    if (!socket) return;
    socket.emit('unsubscribe', channel);
    setStreamData(prev => {
      const updated = new Map(prev);
      updated.delete(channel);
      return updated;
    });
  }, [socket]);

  // Query specific game data
  const queryGame = useCallback((gameId: string, metrics: string[], timeRange?: { start: number; end: number }) => {
    return new Promise((resolve, reject) => {
      if (!socket) {
        reject(new Error('Socket not connected'));
        return;
      }

      const queryId = `query_${Date.now()}`;
      const timeout = setTimeout(() => {
        reject(new Error('Query timeout'));
      }, 5000);

      socket.emit('query', {
        queryId,
        gameId,
        metrics,
        timeRange,
        timestamp: Date.now()
      });

      socket.once('query-result', (data) => {
        if (data.queryId === queryId) {
          clearTimeout(timeout);
          resolve(data.result);
        }
      });

      socket.once('query-error', (data) => {
        if (data.queryId === queryId) {
          clearTimeout(timeout);
          reject(new Error(data.error));
        }
      });
    });
  }, [socket]);

  // Manual connect/disconnect
  const connect = useCallback(() => {
    if (socket && !socket.connected) {
      socket.connect();
    }
  }, [socket]);

  const disconnect = useCallback(() => {
    if (socket && socket.connected) {
      socket.disconnect();
    }
  }, [socket]);

  return {
    // Connection management
    connect,
    disconnect,
    connectionStatus,
    
    // Data streaming
    subscribe,
    unsubscribe,
    streamData,
    
    // Queries
    queryGame,
    
    // Status
    error,
    isConnected: connectionStatus.connected,
    latency: connectionStatus.latency
  };
};

// Example usage component
export const LiveDataFeed: React.FC = () => {
  const {
    connectionStatus,
    streamData,
    subscribe,
    unsubscribe,
    isConnected,
    latency,
    error
  } = useBlazeSocket({
    autoConnect: true,
    channels: ['nfl:live', 'betting:odds']
  });

  const nflData = streamData.get('nfl:live');
  const bettingData = streamData.get('betting:odds');

  return (
    <div className="bg-graphite rounded-lg p-6 border border-burnt-orange/20">
      {/* Connection Status Bar */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-grizzly-teal' : 'bg-red-500'} animate-pulse`} />
          <span className="text-pearl text-sm font-medium">
            {isConnected ? 'Live' : 'Disconnected'}
          </span>
        </div>
        <div className="text-pearl/60 text-xs">
          Latency: {latency}ms | Tier: {connectionStatus.tier}
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500 rounded p-3 mb-4">
          <p className="text-red-400 text-sm">{error}</p>
        </div>
      )}

      {/* Live Game Data */}
      {nflData?.games.map(game => (
        <div key={game.id} className="mb-4 p-4 bg-oiler-navy/30 rounded">
          <div className="flex justify-between items-center mb-2">
            <div className="flex space-x-4">
              <span className="text-pearl font-bold">{game.away}</span>
              <span className="text-cardinal-blue text-2xl font-mono">
                {game.score.away} - {game.score.home}
              </span>
              <span className="text-pearl font-bold">{game.home}</span>
            </div>
            <div className="text-pearl/60 text-sm">
              Q{game.quarter} {game.time}
            </div>
          </div>
          
          <div className="flex items-center space-x-4 text-sm">
            <span className="text-pearl/80">
              {game.possession === game.home ? '🏈' : ''} {game.situation}
            </span>
            <div className="flex-1 bg-graphite rounded-full h-2 overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-burnt-orange to-cardinal-blue transition-all duration-1000"
                style={{ width: `${game.winProbability.home * 100}%` }}
              />
            </div>
            <span className="text-pearl/60">
              {(game.winProbability.home * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      ))}

      {/* AI Insights */}
      {nflData?.insights.map((insight, idx) => (
        <div key={idx} className="p-3 bg-grizzly-teal/10 border-l-2 border-grizzly-teal rounded mb-2">
          <div className="flex items-center justify-between">
            <span className="text-pearl text-sm font-medium">
              {insight.type.toUpperCase()}: {insight.team}
            </span>
            <span className={`text-xs ${insight.trend === 'increasing' ? 'text-green-400' : 'text-red-400'}`}>
              {insight.trend === 'increasing' ? '↑' : '↓'} {(insight.value * 100).toFixed(1)}%
            </span>
          </div>
          <p className="text-pearl/60 text-xs mt-1">
            {insight.factors.join(' • ')}
          </p>
        </div>
      ))}
    </div>
  );
};
