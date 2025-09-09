import { useState, useEffect, useRef, useCallback } from 'react';

interface BlazeSocketMessage {
  type: string;
  data?: any;
  timestamp: number;
  [key: string]: any;
}

interface BlazeSocketConfig {
  url?: string;
  autoConnect?: boolean;
  reconnectAttempts?: number;
  reconnectDelay?: number;
  debug?: boolean;
}

interface BlazeSocketState {
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  lastMessage: BlazeSocketMessage | null;
  subscriptions: Set<string>;
}

const useBlazeSocket = (config: BlazeSocketConfig = {}) => {
  const {
    url = `ws://${window.location.host}`,
    autoConnect = true,
    reconnectAttempts = 5,
    reconnectDelay = 3000,
    debug = false
  } = config;

  const [state, setState] = useState<BlazeSocketState>({
    isConnected: false,
    isConnecting: false,
    error: null,
    lastMessage: null,
    subscriptions: new Set()
  });

  const socketRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const messageHandlersRef = useRef<Map<string, (data: any) => void>>(new Map());
  const subscriptionsRef = useRef<Set<string>>(new Set());

  const log = useCallback((message: string, ...args: any[]) => {
    if (debug) {
      console.log(`[BlazeSocket] ${message}`, ...args);
    }
  }, [debug]);

  const connect = useCallback(() => {
    if (socketRef.current?.readyState === WebSocket.OPEN) {
      log('Already connected');
      return;
    }

    if (socketRef.current?.readyState === WebSocket.CONNECTING) {
      log('Connection already in progress');
      return;
    }

    setState(prev => ({ ...prev, isConnecting: true, error: null }));
    log('Connecting to', url);

    try {
      socketRef.current = new WebSocket(url);

      socketRef.current.onopen = () => {
        log('Connected successfully');
        reconnectAttemptsRef.current = 0;
        setState(prev => ({
          ...prev,
          isConnected: true,
          isConnecting: false,
          error: null
        }));

        // Resubscribe to streams
        subscriptionsRef.current.forEach(stream => {
          subscribe(stream);
        });
      };

      socketRef.current.onmessage = (event) => {
        try {
          const message: BlazeSocketMessage = JSON.parse(event.data);
          log('Message received:', message.type);

          setState(prev => ({ ...prev, lastMessage: message }));

          // Handle specific message types
          const handler = messageHandlersRef.current.get(message.type);
          if (handler) {
            handler(message.data || message);
          }

          // Handle global message handler
          const globalHandler = messageHandlersRef.current.get('*');
          if (globalHandler) {
            globalHandler(message);
          }
        } catch (error) {
          log('Error parsing message:', error);
        }
      };

      socketRef.current.onclose = (event) => {
        log('Connection closed:', event.code, event.reason);
        setState(prev => ({
          ...prev,
          isConnected: false,
          isConnecting: false
        }));

        // Attempt to reconnect if not a manual close
        if (event.code !== 1000 && reconnectAttemptsRef.current < reconnectAttempts) {
          attemptReconnect();
        }
      };

      socketRef.current.onerror = (error) => {
        log('Connection error:', error);
        setState(prev => ({
          ...prev,
          error: 'Connection failed',
          isConnecting: false
        }));
      };

    } catch (error) {
      log('Failed to create WebSocket:', error);
      setState(prev => ({
        ...prev,
        error: 'Failed to create connection',
        isConnecting: false
      }));
    }
  }, [url, reconnectAttempts, log]);

  const disconnect = useCallback(() => {
    log('Disconnecting...');
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (socketRef.current) {
      socketRef.current.close(1000, 'Manual disconnect');
      socketRef.current = null;
    }

    setState(prev => ({
      ...prev,
      isConnected: false,
      isConnecting: false
    }));
  }, [log]);

  const attemptReconnect = useCallback(() => {
    if (reconnectAttemptsRef.current >= reconnectAttempts) {
      log('Max reconnection attempts reached');
      setState(prev => ({
        ...prev,
        error: 'Max reconnection attempts reached'
      }));
      return;
    }

    reconnectAttemptsRef.current++;
    log(`Reconnection attempt ${reconnectAttemptsRef.current}/${reconnectAttempts} in ${reconnectDelay}ms`);

    reconnectTimeoutRef.current = setTimeout(() => {
      connect();
    }, reconnectDelay);
  }, [reconnectAttempts, reconnectDelay, connect, log]);

  const send = useCallback((message: any) => {
    if (!socketRef.current || socketRef.current.readyState !== WebSocket.OPEN) {
      log('Cannot send message: not connected');
      return false;
    }

    try {
      const messageToSend = typeof message === 'string' ? message : JSON.stringify(message);
      socketRef.current.send(messageToSend);
      log('Message sent:', message);
      return true;
    } catch (error) {
      log('Error sending message:', error);
      return false;
    }
  }, [log]);

  const subscribe = useCallback((stream: string) => {
    log('Subscribing to stream:', stream);
    subscriptionsRef.current.add(stream);
    
    const success = send({
      type: 'subscribe',
      stream,
      timestamp: Date.now()
    });

    if (success) {
      setState(prev => ({
        ...prev,
        subscriptions: new Set(subscriptionsRef.current)
      }));
    }

    return success;
  }, [send, log]);

  const unsubscribe = useCallback((stream: string) => {
    log('Unsubscribing from stream:', stream);
    subscriptionsRef.current.delete(stream);
    
    const success = send({
      type: 'unsubscribe',
      stream,
      timestamp: Date.now()
    });

    if (success) {
      setState(prev => ({
        ...prev,
        subscriptions: new Set(subscriptionsRef.current)
      }));
    }

    return success;
  }, [send, log]);

  const onMessage = useCallback((type: string, handler: (data: any) => void) => {
    messageHandlersRef.current.set(type, handler);
    
    return () => {
      messageHandlersRef.current.delete(type);
    };
  }, []);

  const requestLiveData = useCallback((sport?: string, league?: string, teams?: string[]) => {
    return send({
      type: 'get_live_data',
      sport,
      league,
      teams,
      timestamp: Date.now()
    });
  }, [send]);

  const requestGameUpdates = useCallback((gameId: string, league: string) => {
    return send({
      type: 'get_game_updates',
      gameId,
      league,
      timestamp: Date.now()
    });
  }, [send]);

  // Auto-connect on mount
  useEffect(() => {
    if (autoConnect) {
      connect();
    }

    return () => {
      disconnect();
    };
  }, [autoConnect, connect, disconnect]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, []);

  return {
    // State
    isConnected: state.isConnected,
    isConnecting: state.isConnecting,
    error: state.error,
    lastMessage: state.lastMessage,
    subscriptions: state.subscriptions,
    
    // Actions
    connect,
    disconnect,
    send,
    subscribe,
    unsubscribe,
    onMessage,
    requestLiveData,
    requestGameUpdates,
    
    // Stats
    reconnectAttempts: reconnectAttemptsRef.current,
    maxReconnectAttempts: reconnectAttempts
  };
};

export default useBlazeSocket;