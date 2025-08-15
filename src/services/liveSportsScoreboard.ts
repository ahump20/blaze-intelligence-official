// Live Sports Scoreboard API Integration
// Real-time scores and game data across all major sports

import axios from 'axios';
import io from 'socket.io-client';

interface LiveGame {
  id: string;
  sport: 'MLB' | 'NBA' | 'NFL' | 'NHL' | 'NCAAF' | 'NCAAB';
  homeTeam: TeamInfo;
  awayTeam: TeamInfo;
  score: {
    home: number;
    away: number;
  };
  period: string;
  timeRemaining: string;
  status: 'scheduled' | 'in_progress' | 'final' | 'delayed';
  possession?: string;
  lastPlay?: string;
  winProbability?: {
    home: number;
    away: number;
  };
  keyStats?: GameStats;
  betting?: BettingInfo;
}

interface TeamInfo {
  id: string;
  name: string;
  abbreviation: string;
  logo: string;
  record: string;
  standing: number;
  colors: {
    primary: string;
    secondary: string;
  };
}

interface GameStats {
  [key: string]: {
    home: number | string;
    away: number | string;
  };
}

interface BettingInfo {
  spread: {
    team: string;
    line: number;
  };
  total: {
    over: number;
    under: number;
  };
  moneyline: {
    home: number;
    away: number;
  };
}

interface PlayerPerformance {
  playerId: string;
  name: string;
  team: string;
  position: string;
  stats: {
    [key: string]: number | string;
  };
  fantasyPoints: number;
  trending: 'up' | 'down' | 'neutral';
}

export class LiveSportsScoreboard {
  private apiUrl: string;
  private socket: any;
  private subscriptions: Map<string, Function> = new Map();
  private updateInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.apiUrl = process.env.REACT_APP_LIVE_SPORTS_API || 'https://api.live-sports-scoreboard.com';
  }

  // Initialize connection to live sports feed
  async initialize(): Promise<void> {
    try {
      // Connect to WebSocket for real-time updates
      this.socket = io(this.apiUrl, {
        transports: ['websocket'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000
      });

      this.setupSocketListeners();
      
      // Start polling for scores
      this.startPolling();
      
      console.log('Live Sports Scoreboard connected');
    } catch (error) {
      console.error('Failed to initialize Live Sports Scoreboard:', error);
      throw error;
    }
  }

  // Set up WebSocket event listeners
  private setupSocketListeners(): void {
    this.socket.on('connect', () => {
      console.log('Connected to live sports feed');
      this.socket.emit('subscribe', { sports: ['MLB', 'NBA', 'NFL', 'NHL'] });
    });

    this.socket.on('score_update', (data: any) => {
      this.handleScoreUpdate(data);
    });

    this.socket.on('game_event', (data: any) => {
      this.handleGameEvent(data);
    });

    this.socket.on('player_update', (data: any) => {
      this.handlePlayerUpdate(data);
    });

    this.socket.on('betting_update', (data: any) => {
      this.handleBettingUpdate(data);
    });

    this.socket.on('disconnect', () => {
      console.log('Disconnected from live sports feed');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
    });
  }

  // Start polling for regular updates
  private startPolling(): void {
    // Poll every 30 seconds for non-real-time updates
    this.updateInterval = setInterval(async () => {
      await this.fetchAllScores();
    }, 30000);
  }

  // Get all live scores across sports
  async fetchAllScores(): Promise<LiveGame[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/scores/all`);
      const games = response.data;
      
      // Process and emit updates
      games.forEach((game: LiveGame) => {
        this.emitGameUpdate(game);
      });
      
      return games;
    } catch (error) {
      console.error('Error fetching scores:', error);
      throw error;
    }
  }

  // Get scores for specific sport
  async getSportScores(sport: string): Promise<LiveGame[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/scores/${sport.toLowerCase()}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${sport} scores:`, error);
      throw error;
    }
  }

  // Get specific game details
  async getGameDetails(gameId: string): Promise<LiveGame> {
    try {
      const response = await axios.get(`${this.apiUrl}/game/${gameId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching game details:', error);
      throw error;
    }
  }

  // Get play-by-play data
  async getPlayByPlay(gameId: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/game/${gameId}/plays`);
      return response.data;
    } catch (error) {
      console.error('Error fetching play-by-play:', error);
      throw error;
    }
  }

  // Get box score
  async getBoxScore(gameId: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/game/${gameId}/boxscore`);
      return response.data;
    } catch (error) {
      console.error('Error fetching box score:', error);
      throw error;
    }
  }

  // Get player statistics for a game
  async getPlayerStats(gameId: string): Promise<PlayerPerformance[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/game/${gameId}/players`);
      return response.data;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      throw error;
    }
  }

  // Get team statistics
  async getTeamStats(teamId: string, season?: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/team/${teamId}/stats`, {
        params: { season }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching team stats:', error);
      throw error;
    }
  }

  // Get league standings
  async getStandings(league: string): Promise<any> {
    try {
      const response = await axios.get(`${this.apiUrl}/standings/${league}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching standings:', error);
      throw error;
    }
  }

  // Get betting lines
  async getBettingLines(gameId: string): Promise<BettingInfo> {
    try {
      const response = await axios.get(`${this.apiUrl}/betting/${gameId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching betting lines:', error);
      throw error;
    }
  }

  // Subscribe to game updates
  subscribeToGame(gameId: string, callback: Function): void {
    this.subscriptions.set(gameId, callback);
    this.socket.emit('subscribe_game', { gameId });
  }

  // Unsubscribe from game updates
  unsubscribeFromGame(gameId: string): void {
    this.subscriptions.delete(gameId);
    this.socket.emit('unsubscribe_game', { gameId });
  }

  // Subscribe to team updates
  subscribeToTeam(teamId: string, callback: Function): void {
    this.subscriptions.set(`team_${teamId}`, callback);
    this.socket.emit('subscribe_team', { teamId });
  }

  // Handle score updates
  private handleScoreUpdate(data: any): void {
    const callback = this.subscriptions.get(data.gameId);
    if (callback) {
      callback(data);
    }
    
    // Emit global event
    this.emitGameUpdate(data);
  }

  // Handle game events (touchdowns, home runs, etc.)
  private handleGameEvent(data: any): void {
    window.dispatchEvent(new CustomEvent('scoreboard:game_event', { 
      detail: {
        gameId: data.gameId,
        event: data.event,
        description: data.description,
        impact: data.impact
      }
    }));
  }

  // Handle player updates
  private handlePlayerUpdate(data: any): void {
    window.dispatchEvent(new CustomEvent('scoreboard:player_update', { 
      detail: data 
    }));
  }

  // Handle betting line updates
  private handleBettingUpdate(data: any): void {
    window.dispatchEvent(new CustomEvent('scoreboard:betting_update', { 
      detail: data 
    }));
  }

  // Emit game update event
  private emitGameUpdate(game: LiveGame): void {
    window.dispatchEvent(new CustomEvent('scoreboard:score_update', { 
      detail: game 
    }));
  }

  // Get upcoming games
  async getUpcomingGames(hours: number = 24): Promise<LiveGame[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/games/upcoming`, {
        params: { hours }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching upcoming games:', error);
      throw error;
    }
  }

  // Get completed games
  async getCompletedGames(date?: string): Promise<LiveGame[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/games/completed`, {
        params: { date }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching completed games:', error);
      throw error;
    }
  }

  // Get trending players
  async getTrendingPlayers(sport?: string): Promise<PlayerPerformance[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/players/trending`, {
        params: { sport }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending players:', error);
      throw error;
    }
  }

  // Get injury reports
  async getInjuryReports(team?: string): Promise<any[]> {
    try {
      const response = await axios.get(`${this.apiUrl}/injuries`, {
        params: { team }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching injury reports:', error);
      throw error;
    }
  }

  // Cleanup
  disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
    }
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
    }
    
    this.subscriptions.clear();
  }
}

// Export singleton instance
export const liveScoreboard = new LiveSportsScoreboard();