import { BalldontlieAPI } from '@balldontlie/sdk';

class BallDontLieService {
  constructor() {
    // Initialize without API key for free tier
    this.api = new BalldontlieAPI({
      apiKey: process.env.BALLDONTLIE_API_KEY || ''
    });
    this.cache = new Map();
    this.cacheTimeout = 60000; // 1 minute cache
  }

  // NBA Methods
  async getNBAGames(date) {
    const cacheKey = `nba-games-${date}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const games = await this.api.nba.getGames({
        dates: date ? [date] : undefined,
        per_page: 25
      });
      
      this.setCache(cacheKey, games);
      return games;
    } catch (error) {
      console.error('Error fetching NBA games:', error);
      return { data: [], meta: {} };
    }
  }

  async getNBATeams() {
    const cacheKey = 'nba-teams';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const teams = await this.api.nba.getTeams({
        per_page: 30
      });
      
      this.setCache(cacheKey, teams);
      return teams;
    } catch (error) {
      console.error('Error fetching NBA teams:', error);
      return { data: [], meta: {} };
    }
  }

  async getNBAPlayers(teamId) {
    const cacheKey = `nba-players-${teamId || 'all'}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const players = await this.api.nba.getPlayers({
        team_ids: teamId ? [teamId] : undefined,
        per_page: 50
      });
      
      this.setCache(cacheKey, players);
      return players;
    } catch (error) {
      console.error('Error fetching NBA players:', error);
      return { data: [], meta: {} };
    }
  }

  async getNBAStats(playerId, season) {
    const cacheKey = `nba-stats-${playerId}-${season}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const stats = await this.api.nba.getStats({
        player_ids: playerId ? [playerId] : undefined,
        seasons: season ? [season] : [2024],
        per_page: 100
      });
      
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching NBA stats:', error);
      return { data: [], meta: {} };
    }
  }

  // NFL Methods
  async getNFLGames(week, season) {
    const cacheKey = `nfl-games-${week}-${season}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const games = await this.api.nfl.getGames({
        weeks: week ? [week] : undefined,
        seasons: season ? [season] : [2024],
        per_page: 25
      });
      
      this.setCache(cacheKey, games);
      return games;
    } catch (error) {
      console.error('Error fetching NFL games:', error);
      return { data: [], meta: {} };
    }
  }

  async getNFLTeams() {
    const cacheKey = 'nfl-teams';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const teams = await this.api.nfl.getTeams({
        per_page: 32
      });
      
      this.setCache(cacheKey, teams);
      return teams;
    } catch (error) {
      console.error('Error fetching NFL teams:', error);
      return { data: [], meta: {} };
    }
  }

  async getNFLPlayers(teamId) {
    const cacheKey = `nfl-players-${teamId || 'all'}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const players = await this.api.nfl.getPlayers({
        team_ids: teamId ? [teamId] : undefined,
        per_page: 100
      });
      
      this.setCache(cacheKey, players);
      return players;
    } catch (error) {
      console.error('Error fetching NFL players:', error);
      return { data: [], meta: {} };
    }
  }

  async getNFLStats(playerId, season) {
    const cacheKey = `nfl-stats-${playerId}-${season}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const stats = await this.api.nfl.getStats({
        player_ids: playerId ? [playerId] : undefined,
        seasons: season ? [season] : [2024],
        per_page: 100
      });
      
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching NFL stats:', error);
      return { data: [], meta: {} };
    }
  }

  // MLB Methods
  async getMLBGames(date) {
    const cacheKey = `mlb-games-${date}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const games = await this.api.mlb.getGames({
        dates: date ? [date] : undefined,
        per_page: 25
      });
      
      this.setCache(cacheKey, games);
      return games;
    } catch (error) {
      console.error('Error fetching MLB games:', error);
      return { data: [], meta: {} };
    }
  }

  async getMLBTeams() {
    const cacheKey = 'mlb-teams';
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const teams = await this.api.mlb.getTeams({
        per_page: 30
      });
      
      this.setCache(cacheKey, teams);
      return teams;
    } catch (error) {
      console.error('Error fetching MLB teams:', error);
      return { data: [], meta: {} };
    }
  }

  async getMLBPlayers(teamId) {
    const cacheKey = `mlb-players-${teamId || 'all'}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const players = await this.api.mlb.getPlayers({
        team_ids: teamId ? [teamId] : undefined,
        per_page: 100
      });
      
      this.setCache(cacheKey, players);
      return players;
    } catch (error) {
      console.error('Error fetching MLB players:', error);
      return { data: [], meta: {} };
    }
  }

  async getMLBStats(playerId, season) {
    const cacheKey = `mlb-stats-${playerId}-${season}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const stats = await this.api.mlb.getStats({
        player_ids: playerId ? [playerId] : undefined,
        seasons: season ? [season] : [2024],
        per_page: 100
      });
      
      this.setCache(cacheKey, stats);
      return stats;
    } catch (error) {
      console.error('Error fetching MLB stats:', error);
      return { data: [], meta: {} };
    }
  }

  // Live Score Aggregator
  async getAllLiveScores() {
    const today = new Date().toISOString().split('T')[0];
    
    try {
      const [nbaGames, nflGames, mlbGames] = await Promise.all([
        this.getNBAGames(today),
        this.getNFLGames(null, 2024),
        this.getMLBGames(today)
      ]);

      return {
        nba: nbaGames.data || [],
        nfl: nflGames.data || [],
        mlb: mlbGames.data || [],
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error fetching all live scores:', error);
      return {
        nba: [],
        nfl: [],
        mlb: [],
        timestamp: new Date().toISOString()
      };
    }
  }

  // Cache helpers
  getCached(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.cacheTimeout) {
      this.cache.delete(key);
      return null;
    }
    
    return item.data;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }
}

export default new BallDontLieService();