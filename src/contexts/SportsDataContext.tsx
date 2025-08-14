import React, { createContext, useContext, useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import toast from 'react-hot-toast';

interface GameScore {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeScore: number;
  awayScore: number;
  status: 'live' | 'final' | 'scheduled';
  quarter?: string;
  timeRemaining?: string;
  sport: string;
}

interface PlayerStats {
  playerId: string;
  name: string;
  team: string;
  position: string;
  stats: Record<string, number>;
  performance: {
    rating: number;
    trend: 'up' | 'down' | 'stable';
  };
}

interface SportsDataContextType {
  liveGames: GameScore[];
  playerStats: PlayerStats[];
  isConnected: boolean;
  subscribeToGame: (gameId: string) => void;
  unsubscribeFromGame: (gameId: string) => void;
  getGamePrediction: (gameId: string) => Promise<any>;
  searchPlayers: (query: string) => Promise<PlayerStats[]>;
  refreshData: () => void;
}

const SportsDataContext = createContext<SportsDataContextType | undefined>(undefined);

export const SportsDataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [liveGames, setLiveGames] = useState<GameScore[]>([]);
  const [playerStats, setPlayerStats] = useState<PlayerStats[]>([]);
  const [socket, setSocket] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize WebSocket connection
    const newSocket = io(process.env.REACT_APP_WEBSOCKET_URL || 'ws://localhost:3001', {
      transports: ['websocket'],
      autoConnect: true,
    });

    newSocket.on('connect', () => {
      setIsConnected(true);
      toast.success('Connected to live sports data');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
      toast.error('Lost connection to live data');
    });

    newSocket.on('gameUpdate', (gameData: GameScore) => {
      setLiveGames((prev) =>
        prev.map((game) => (game.id === gameData.id ? gameData : game))
      );
      
      if (gameData.status === 'live') {
        toast(`Score Update: ${gameData.homeTeam} ${gameData.homeScore} - ${gameData.awayScore} ${gameData.awayTeam}`, {
          icon: '🏈',
        });
      }
    });

    newSocket.on('playerUpdate', (playerData: PlayerStats) => {
      setPlayerStats((prev) =>
        prev.map((player) => (player.playerId === playerData.playerId ? playerData : player))
      );
    });

    setSocket(newSocket);

    // Load initial data
    loadInitialData();

    return () => {
      newSocket.close();
    };
  }, []);

  const loadInitialData = async () => {
    try {
      // Load live games using SportsRadar API
      const gamesResponse = await axios.get(
        `https://api.sportradar.us/nfl/official/trial/v7/en/games/live.json?api_key=${process.env.REACT_APP_SPORTSRADAR_API_KEY}`
      );

      // Transform SportsRadar data to our format
      const games: GameScore[] = gamesResponse.data.games?.map((game: any) => ({
        id: game.id,
        homeTeam: game.home?.name || 'TBD',
        awayTeam: game.away?.name || 'TBD',
        homeScore: game.home_points || 0,
        awayScore: game.away_points || 0,
        status: game.status === 'inprogress' ? 'live' : game.status,
        quarter: game.quarter ? `Q${game.quarter}` : undefined,
        timeRemaining: game.clock,
        sport: 'football',
      })) || [];

      setLiveGames(games);

      // Load featured player stats
      const playersResponse = await axios.get('/api/players/featured');
      setPlayerStats(playersResponse.data || []);
    } catch (error) {
      console.error('Failed to load sports data:', error);
      
      // Fallback to mock data
      setLiveGames([
        {
          id: '1',
          homeTeam: 'Dallas Cowboys',
          awayTeam: 'Green Bay Packers',
          homeScore: 21,
          awayScore: 17,
          status: 'live',
          quarter: 'Q3',
          timeRemaining: '8:42',
          sport: 'football',
        },
        {
          id: '2',
          homeTeam: 'Los Angeles Lakers',
          awayTeam: 'Boston Celtics',
          homeScore: 98,
          awayScore: 102,
          status: 'live',
          quarter: 'Q4',
          timeRemaining: '2:15',
          sport: 'basketball',
        },
      ]);

      setPlayerStats([
        {
          playerId: '1',
          name: 'Dak Prescott',
          team: 'Dallas Cowboys',
          position: 'QB',
          stats: { passing_yards: 287, touchdowns: 2, completions: 23 },
          performance: { rating: 94.2, trend: 'up' },
        },
        {
          playerId: '2',
          name: 'LeBron James',
          team: 'Los Angeles Lakers',
          position: 'PF',
          stats: { points: 28, rebounds: 8, assists: 6 },
          performance: { rating: 88.5, trend: 'stable' },
        },
      ]);
    }
  };

  const subscribeToGame = (gameId: string) => {
    if (socket) {
      socket.emit('subscribeToGame', gameId);
      toast.success('Subscribed to live game updates');
    }
  };

  const unsubscribeFromGame = (gameId: string) => {
    if (socket) {
      socket.emit('unsubscribeFromGame', gameId);
      toast.success('Unsubscribed from game updates');
    }
  };

  const getGamePrediction = async (gameId: string) => {
    try {
      // Use AI to generate game predictions
      const response = await axios.post('/api/predictions/game', {
        gameId,
        model: 'advanced',
      });
      return response.data;
    } catch (error) {
      console.error('Failed to get prediction:', error);
      return null;
    }
  };

  const searchPlayers = async (query: string): Promise<PlayerStats[]> => {
    try {
      const response = await axios.get(`/api/players/search?q=${query}`);
      return response.data || [];
    } catch (error) {
      console.error('Failed to search players:', error);
      return [];
    }
  };

  const refreshData = () => {
    loadInitialData();
    toast.success('Data refreshed');
  };

  const value: SportsDataContextType = {
    liveGames,
    playerStats,
    isConnected,
    subscribeToGame,
    unsubscribeFromGame,
    getGamePrediction,
    searchPlayers,
    refreshData,
  };

  return (
    <SportsDataContext.Provider value={value}>
      {children}
    </SportsDataContext.Provider>
  );
};

export const useSportsData = () => {
  const context = useContext(SportsDataContext);
  if (context === undefined) {
    throw new Error('useSportsData must be used within a SportsDataProvider');
  }
  return context;
};

export default SportsDataContext;