/**
 * Free Sports APIs Integration Service
 * Comprehensive collection of free and open-source sports data APIs
 * Including MCP (Model Context Protocol) integrations
 * 2025 Implementation - American Sports Focus (No Soccer)
 */

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import WebSocket from 'ws';

// ============================================
// FREE SPORTS APIS CONFIGURATION
// ============================================

export const FREE_SPORTS_APIS = {
  // Completely Free APIs (No Registration Required)
  BALLDONTLIE: {
    name: 'BallDontLie NBA API',
    baseUrl: 'https://www.balldontlie.io/api/v1',
    sports: ['NBA'],
    features: ['Live Scores', 'Stats', 'Players', 'Teams', 'Games'],
    rateLimit: '60 requests/minute',
    registration: false,
    documentation: 'https://www.balldontlie.io/#introduction'
  },

  // ESPN Hidden API (Unofficial but Free)
  ESPN_HIDDEN: {
    name: 'ESPN Hidden API',
    baseUrl: 'https://site.api.espn.com/apis/site/v2/sports',
    sports: ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB'],
    features: ['Scores', 'Schedules', 'Standings', 'Stats', 'News', 'Teams', 'Players'],
    rateLimit: 'Unknown - Use responsibly',
    registration: false,
    endpoints: {
      nfl: '/football/nfl',
      nba: '/basketball/nba',
      mlb: '/baseball/mlb',
      nhl: '/hockey/nhl',
      ncaaf: '/football/college-football',
      ncaab: '/basketball/mens-college-basketball'
    }
  },

  // TheSportsDB (Free with Registration)
  THESPORTSDB: {
    name: 'TheSportsDB',
    baseUrl: 'https://www.thesportsdb.com/api/v1/json',
    sports: ['NFL', 'NBA', 'MLB', 'NHL'],
    features: ['Teams', 'Players', 'Events', 'Leagues', 'Seasons', 'Stats'],
    rateLimit: 'Reasonable use',
    registration: true,
    apiKey: 'FREE_TIER_KEY', // Replace with actual key
    documentation: 'https://www.thesportsdb.com/api.php'
  },

  // MySportsFeeds (Free for Non-Commercial)
  MYSPORTSFEEDS: {
    name: 'MySportsFeeds',
    baseUrl: 'https://api.mysportsfeeds.com/v2.1/pull',
    sports: ['NFL', 'NBA', 'MLB', 'NHL'],
    features: ['Live Scores', 'Stats', 'DFS', 'Odds', 'Injuries', 'Play-by-Play'],
    rateLimit: '250 API calls/month (free tier)',
    registration: true,
    authentication: 'Basic Auth',
    documentation: 'https://www.mysportsfeeds.com/data-feeds/api-docs'
  },

  // College Football Data (Completely Free)
  CFB_DATA: {
    name: 'College Football Data API',
    baseUrl: 'https://api.collegefootballdata.com',
    sports: ['NCAAF'],
    features: ['Games', 'Stats', 'Rankings', 'Recruiting', 'Betting Lines'],
    rateLimit: '120 requests/minute',
    registration: false,
    documentation: 'https://api.collegefootballdata.com/api/docs'
  },

  // API-Football (Free Tier Available)
  API_SPORTS: {
    name: 'API-Sports',
    baseUrl: 'https://v1.american-football.api-sports.io',
    sports: ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB'],
    features: ['Live Scores', 'Stats', 'Standings', 'Odds', 'Predictions'],
    rateLimit: '100 requests/day (free tier)',
    registration: true,
    documentation: 'https://api-sports.io/documentation'
  },

  // The Odds API (Limited Free Tier)
  THE_ODDS_API: {
    name: 'The Odds API',
    baseUrl: 'https://api.the-odds-api.com/v4',
    sports: ['NFL', 'NBA', 'MLB', 'NHL', 'NCAAF', 'NCAAB'],
    features: ['Betting Odds', 'Spreads', 'Totals', 'Props', 'Live Odds'],
    rateLimit: '500 requests/month (free tier)',
    registration: true,
    documentation: 'https://the-odds-api.com/liveapi/guides/v4/'
  }
};

// ============================================
// MCP (Model Context Protocol) SERVERS
// ============================================

export const MCP_SPORTS_SERVERS = {
  MLB_MCP: {
    name: 'MLB API MCP Server',
    repo: 'https://github.com/guillochon/mlb-api-mcp',
    sports: ['MLB'],
    features: [
      'Current standings',
      'Game schedules and results',
      'Player statistics (traditional & sabermetric)',
      'Live game data (boxscores, play-by-play)',
      'Team rosters'
    ],
    installation: 'npm install mlb-api-mcp'
  },

  NHL_MCP: {
    name: 'NHL MCP Server',
    repo: 'https://github.com/dylangroos/nhl-mcp',
    sports: ['NHL'],
    features: [
      'Live NHL games',
      'Scores and stats',
      'Team information',
      'Player analysis',
      'Generate reports'
    ],
    installation: 'npm install nhl-mcp'
  },

  NBA_MCP: {
    name: 'NBA Stats MCP',
    description: 'Basketball Reference Integration',
    sports: ['NBA'],
    features: [
      'Career statistics',
      'Season comparisons',
      'Advanced metrics',
      'Game logs',
      'Awards voting',
      'All-time rankings'
    ]
  }
};

// ============================================
// Main Free Sports API Service
// ============================================

export class FreeSportsAPIService extends EventEmitter {
  private ballDontLie: AxiosInstance;
  private espn: AxiosInstance;
  private theSportsDB: AxiosInstance;
  private mySportsFeeds: AxiosInstance;
  private cfbData: AxiosInstance;
  private theOddsApi: AxiosInstance;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_TTL = 60000; // 1 minute cache

  constructor(private config?: {
    theSportsDBKey?: string;
    mySportsFeedsAuth?: { username: string; password: string };
    theOddsApiKey?: string;
    apiSportsKey?: string;
  }) {
    super();

    // Initialize free API clients
    this.ballDontLie = axios.create({
      baseURL: FREE_SPORTS_APIS.BALLDONTLIE.baseUrl,
      headers: { 'Accept': 'application/json' }
    });

    this.espn = axios.create({
      baseURL: FREE_SPORTS_APIS.ESPN_HIDDEN.baseUrl,
      headers: { 'Accept': 'application/json' }
    });

    this.theSportsDB = axios.create({
      baseURL: `${FREE_SPORTS_APIS.THESPORTSDB.baseUrl}/${config?.theSportsDBKey || '1'}`,
      headers: { 'Accept': 'application/json' }
    });

    this.mySportsFeeds = axios.create({
      baseURL: FREE_SPORTS_APIS.MYSPORTSFEEDS.baseUrl,
      auth: config?.mySportsFeedsAuth
    });

    this.cfbData = axios.create({
      baseURL: FREE_SPORTS_APIS.CFB_DATA.baseUrl,
      headers: { 'Accept': 'application/json' }
    });

    this.theOddsApi = axios.create({
      baseURL: FREE_SPORTS_APIS.THE_ODDS_API.baseUrl,
      params: { apiKey: config?.theOddsApiKey }
    });

    this.cache = new Map();
  }

  // ============================================
  // NBA Data (BallDontLie - Completely Free)
  // ============================================

  async getNBAGames(date?: string): Promise<any> {
    const cacheKey = `nba-games-${date || 'today'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const params = date ? { 'dates[]': date } : {};
      const response = await this.ballDontLie.get('/games', { params });
      
      this.saveToCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error('Error fetching NBA games:', error);
      throw error;
    }
  }

  async getNBAStats(playerId: string, season?: string): Promise<any> {
    try {
      const params = {
        'player_ids[]': playerId,
        ...(season && { 'seasons[]': season })
      };
      
      const response = await this.ballDontLie.get('/stats', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching NBA stats:', error);
      throw error;
    }
  }

  async getNBAPlayers(search?: string): Promise<any> {
    try {
      const params = search ? { search } : {};
      const response = await this.ballDontLie.get('/players', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching NBA players:', error);
      throw error;
    }
  }

  // ============================================
  // ESPN Hidden API (All Major Sports)
  // ============================================

  async getESPNScoreboard(sport: 'nfl' | 'nba' | 'mlb' | 'nhl', date?: string): Promise<any> {
    const cacheKey = `espn-scoreboard-${sport}-${date || 'today'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const endpoint = FREE_SPORTS_APIS.ESPN_HIDDEN.endpoints[sport as keyof typeof FREE_SPORTS_APIS.ESPN_HIDDEN.endpoints];
      const params = date ? { dates: date } : {};
      
      const response = await this.espn.get(`${endpoint}/scoreboard`, { params });
      
      this.saveToCache(cacheKey, response.data);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ESPN ${sport} scoreboard:`, error);
      throw error;
    }
  }

  async getESPNTeamSchedule(sport: string, teamId: string, season?: string): Promise<any> {
    try {
      const endpoint = FREE_SPORTS_APIS.ESPN_HIDDEN.endpoints[sport as keyof typeof FREE_SPORTS_APIS.ESPN_HIDDEN.endpoints];
      const url = `${endpoint}/teams/${teamId}/schedule`;
      const params = season ? { season } : {};
      
      const response = await this.espn.get(url, { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching ESPN team schedule:', error);
      throw error;
    }
  }

  async getESPNStandings(sport: string): Promise<any> {
    try {
      const endpoint = FREE_SPORTS_APIS.ESPN_HIDDEN.endpoints[sport as keyof typeof FREE_SPORTS_APIS.ESPN_HIDDEN.endpoints];
      const response = await this.espn.get(`${endpoint}/standings`);
      return response.data;
    } catch (error) {
      console.error('Error fetching ESPN standings:', error);
      throw error;
    }
  }

  // ============================================
  // College Football Data (Free)
  // ============================================

  async getCollegeFootballGames(year: number, week?: number): Promise<any> {
    try {
      const params: any = { year };
      if (week) params.week = week;
      
      const response = await this.cfbData.get('/games', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching college football games:', error);
      throw error;
    }
  }

  async getCollegeFootballRankings(year: number, week?: number): Promise<any> {
    try {
      const params: any = { year };
      if (week) params.week = week;
      
      const response = await this.cfbData.get('/rankings', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching college football rankings:', error);
      throw error;
    }
  }

  async getCollegeFootballStats(year: number, team?: string): Promise<any> {
    try {
      const params: any = { year };
      if (team) params.team = team;
      
      const response = await this.cfbData.get('/stats/season', { params });
      return response.data;
    } catch (error) {
      console.error('Error fetching college football stats:', error);
      throw error;
    }
  }

  // ============================================
  // Betting Odds (The Odds API - Limited Free)
  // ============================================

  async getBettingOdds(sport: string, markets: string[] = ['h2h', 'spreads', 'totals']): Promise<any> {
    if (!this.config?.theOddsApiKey) {
      throw new Error('The Odds API key required for betting odds');
    }

    try {
      const response = await this.theOddsApi.get(`/sports/${sport}/odds`, {
        params: {
          regions: 'us',
          markets: markets.join(','),
          oddsFormat: 'american'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching betting odds:', error);
      throw error;
    }
  }

  async getLiveOdds(sport: string): Promise<any> {
    if (!this.config?.theOddsApiKey) {
      throw new Error('The Odds API key required for live odds');
    }

    try {
      const response = await this.theOddsApi.get(`/sports/${sport}/odds-live`, {
        params: {
          regions: 'us',
          markets: 'h2h,spreads,totals',
          oddsFormat: 'american'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching live odds:', error);
      throw error;
    }
  }

  // ============================================
  // MCP Server Integration
  // ============================================

  async initializeMCPServers(): Promise<{
    mlb?: any;
    nhl?: any;
    nba?: any;
  }> {
    const servers: any = {};

    try {
      // Initialize MLB MCP Server
      if (this.isMCPAvailable('mlb-api-mcp')) {
        const { MLBMCPServer } = await import('mlb-api-mcp');
        servers.mlb = new MLBMCPServer();
        console.log('MLB MCP Server initialized');
      }
    } catch (error) {
      console.log('MLB MCP Server not available');
    }

    try {
      // Initialize NHL MCP Server
      if (this.isMCPAvailable('nhl-mcp')) {
        const { NHLMCPServer } = await import('nhl-mcp');
        servers.nhl = new NHLMCPServer();
        console.log('NHL MCP Server initialized');
      }
    } catch (error) {
      console.log('NHL MCP Server not available');
    }

    return servers;
  }

  private isMCPAvailable(packageName: string): boolean {
    try {
      require.resolve(packageName);
      return true;
    } catch {
      return false;
    }
  }

  // ============================================
  // Aggregated Sports Data
  // ============================================

  async getAllScoresForToday(): Promise<{
    nfl: any;
    nba: any;
    mlb: any;
    nhl: any;
    ncaaf: any;
    ncaab: any;
  }> {
    const today = new Date().toISOString().split('T')[0];
    
    const [nfl, nba, mlb, nhl, ncaaf, ncaab] = await Promise.allSettled([
      this.getESPNScoreboard('nfl', today),
      this.getNBAGames(today),
      this.getESPNScoreboard('mlb', today),
      this.getESPNScoreboard('nhl', today),
      this.getCollegeFootballGames(new Date().getFullYear()),
      this.getESPNScoreboard('ncaab', today)
    ]);

    return {
      nfl: nfl.status === 'fulfilled' ? nfl.value : null,
      nba: nba.status === 'fulfilled' ? nba.value : null,
      mlb: mlb.status === 'fulfilled' ? mlb.value : null,
      nhl: nhl.status === 'fulfilled' ? nhl.value : null,
      ncaaf: ncaaf.status === 'fulfilled' ? ncaaf.value : null,
      ncaab: ncaab.status === 'fulfilled' ? ncaab.value : null
    };
  }

  async getComprehensiveSportsData(date?: string): Promise<{
    scores: any;
    odds?: any;
    news: any;
    standings: any;
  }> {
    const [scores, standings] = await Promise.all([
      this.getAllScoresForToday(),
      this.getAllStandings()
    ]);

    let odds = null;
    if (this.config?.theOddsApiKey) {
      try {
        odds = await this.getBettingOdds('americanfootball_nfl');
      } catch (error) {
        console.log('Odds API not configured or limit reached');
      }
    }

    return {
      scores,
      odds,
      news: [], // Would need to implement news aggregation
      standings
    };
  }

  async getAllStandings(): Promise<any> {
    const [nfl, nba, mlb, nhl] = await Promise.allSettled([
      this.getESPNStandings('nfl'),
      this.getESPNStandings('nba'),
      this.getESPNStandings('mlb'),
      this.getESPNStandings('nhl')
    ]);

    return {
      nfl: nfl.status === 'fulfilled' ? nfl.value : null,
      nba: nba.status === 'fulfilled' ? nba.value : null,
      mlb: mlb.status === 'fulfilled' ? mlb.value : null,
      nhl: nhl.status === 'fulfilled' ? nhl.value : null
    };
  }

  // ============================================
  // DFS / Fantasy Integration
  // ============================================

  async getDFSProjections(sport: string, slate?: string): Promise<any> {
    // MySportsFeeds has DFS data in their paid tier
    // For free tier, we can get basic player stats and create simple projections
    
    if (sport === 'nba') {
      // Use BallDontLie free data
      const players = await this.getNBAPlayers();
      // Simple projection based on recent stats
      return this.createSimpleDFSProjections(players.data);
    }
    
    // For other sports, would need to use ESPN data
    return null;
  }

  private createSimpleDFSProjections(players: any[]): any {
    // Simple DFS projection algorithm
    return players.map((player: any) => ({
      id: player.id,
      name: `${player.first_name} ${player.last_name}`,
      team: player.team?.abbreviation,
      position: player.position,
      projectedPoints: Math.random() * 50 + 10, // Placeholder
      salary: Math.floor(Math.random() * 5000 + 3000),
      value: 0 // Points per $1000
    }));
  }

  // ============================================
  // Helper Methods
  // ============================================

  private getFromCache(key: string): any {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return cached.data;
    }
    return null;
  }

  private saveToCache(key: string, data: any): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  // ============================================
  // Rate Limiting & Error Handling
  // ============================================

  private async rateLimitedRequest(
    apiName: string,
    requestFn: () => Promise<any>,
    retries: number = 3
  ): Promise<any> {
    for (let i = 0; i < retries; i++) {
      try {
        return await requestFn();
      } catch (error: any) {
        if (error.response?.status === 429) {
          // Rate limited, wait and retry
          const waitTime = Math.pow(2, i) * 1000; // Exponential backoff
          console.log(`Rate limited on ${apiName}, waiting ${waitTime}ms...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        } else if (i === retries - 1) {
          throw error;
        }
      }
    }
  }

  // ============================================
  // Public API Summary
  // ============================================

  getAvailableAPIs(): typeof FREE_SPORTS_APIS {
    return FREE_SPORTS_APIS;
  }

  getMCPServers(): typeof MCP_SPORTS_SERVERS {
    return MCP_SPORTS_SERVERS;
  }
}

// ============================================
// Export and Usage
// ============================================

export default FreeSportsAPIService;

/*
Usage Example:

const sportsAPI = new FreeSportsAPIService({
  theSportsDBKey: 'YOUR_KEY', // Get free at thesportsdb.com
  mySportsFeedsAuth: { 
    username: 'YOUR_USERNAME',
    password: 'YOUR_PASSWORD'
  },
  theOddsApiKey: 'YOUR_KEY', // Get free tier at the-odds-api.com
  apiSportsKey: 'YOUR_KEY' // Get free tier at api-sports.io
});

// Get all scores for today (completely free)
const scores = await sportsAPI.getAllScoresForToday();

// Get NBA data (completely free via BallDontLie)
const nbaGames = await sportsAPI.getNBAGames('2025-08-15');
const nbaPlayers = await sportsAPI.getNBAPlayers('lebron');

// Get ESPN data (free, no registration)
const nflScores = await sportsAPI.getESPNScoreboard('nfl');

// Get betting odds (requires free API key)
const nflOdds = await sportsAPI.getBettingOdds('americanfootball_nfl');

// Initialize MCP servers if installed
const mcpServers = await sportsAPI.initializeMCPServers();
*/