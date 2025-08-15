/**
 * MLB Integration Hub for Blaze Intelligence
 * Combines MLB Gameday Bot, MLB Data Lab, and Trackman Baseball
 * Real-time game tracking, advanced analytics, and Discord integration
 * 2025 Implementation
 */

import { EventEmitter } from 'events';
import axios, { AxiosInstance } from 'axios';
import { Client as DiscordClient, TextChannel, EmbedBuilder } from 'discord.js';
import { exec } from 'child_process';
import { promisify } from 'util';
import Redis from 'ioredis';
import { TrackmanBaseballService, TrackmanPitch, TrackmanHit } from './trackmanBaseball';
import { ChampionEnigmaEngine } from './championEnigmaEngine';
import path from 'path';
import fs from 'fs/promises';

const execAsync = promisify(exec);

// ============================================
// Types and Interfaces
// ============================================

interface MLBGame {
  gamePk: number;
  gameDate: Date;
  status: 'Scheduled' | 'Pre-Game' | 'In Progress' | 'Final' | 'Postponed';
  inning?: number;
  inningState?: 'Top' | 'Bottom';
  
  // Teams
  homeTeam: {
    id: number;
    name: string;
    abbreviation: string;
    score: number;
    hits: number;
    errors: number;
  };
  awayTeam: {
    id: number;
    name: string;
    abbreviation: string;
    score: number;
    hits: number;
    errors: number;
  };
  
  // Current state
  currentPitcher?: MLBPlayer;
  currentBatter?: MLBPlayer;
  count?: { balls: number; strikes: number; outs: number };
  runners?: { first: boolean; second: boolean; third: boolean };
  
  // Probables
  homeProbablePitcher?: MLBPlayer;
  awayProbablePitcher?: MLBPlayer;
}

interface MLBPlayer {
  id: number;
  fullName: string;
  primaryNumber?: string;
  primaryPosition: string;
  
  // Current season stats
  stats?: {
    batting?: BattingStats;
    pitching?: PitchingStats;
  };
  
  // Advanced metrics
  savantMetrics?: SavantMetrics;
  
  // Champion analysis
  championProfile?: any;
  
  // Trackman data
  trackmanData?: {
    recentPitches?: TrackmanPitch[];
    recentHits?: TrackmanHit[];
  };
}

interface BattingStats {
  avg: number;
  obp: number;
  slg: number;
  ops: number;
  homeRuns: number;
  rbi: number;
  stolenBases: number;
  strikeouts: number;
  walks: number;
  wRC?: number;
  wOBA?: number;
  WAR?: number;
}

interface PitchingStats {
  wins: number;
  losses: number;
  era: number;
  whip: number;
  strikeouts: number;
  walks: number;
  saves?: number;
  holds?: number;
  innings: number;
  FIP?: number;
  xFIP?: number;
  WAR?: number;
}

interface SavantMetrics {
  // Batting
  exitVelocity?: number;
  hardHitRate?: number;
  barrelRate?: number;
  xBA?: number;
  xSLG?: number;
  xwOBA?: number;
  sprintSpeed?: number;
  
  // Pitching
  fastballVelocity?: number;
  spinRate?: number;
  whiffRate?: number;
  chasRate?: number;
  stuffPlus?: number;
  locationPlus?: number;
}

interface GameEvent {
  type: 'pitch' | 'hit' | 'run' | 'out' | 'substitution' | 'end_inning' | 'game_end';
  description: string;
  timestamp: Date;
  
  // Event details
  pitch?: any;
  hit?: any;
  runners?: any;
  score?: { home: number; away: number };
  
  // Statcast data
  statcast?: {
    exitVelocity?: number;
    launchAngle?: number;
    distance?: number;
    hitProbability?: number;
  };
  
  // Trackman data
  trackman?: TrackmanPitch | TrackmanHit;
}

interface PlayerSummarySheet {
  playerId: number;
  playerName: string;
  team: string;
  year: number;
  position: string;
  imageUrl?: string;
  
  // Generated visualization
  summaryImagePath?: string;
  
  // Key stats
  keyStats: { [key: string]: any };
  
  // Advanced analytics
  advancedMetrics: { [key: string]: any };
  
  // Visualizations
  charts: {
    sprayChart?: string;
    heatMap?: string;
    trendChart?: string;
    splits?: string;
  };
}

interface MLBDataLabConfig {
  pythonPath: string;
  scriptPath: string;
  outputPath: string;
}

interface GamedayBotConfig {
  discordToken?: string;
  discordClientId?: string;
  teamId: number;
  channelIds?: string[];
  webhookUrl?: string;
}

// ============================================
// Main MLB Integration Hub
// ============================================

export class MLBIntegrationHub extends EventEmitter {
  private mlbApi: AxiosInstance;
  private savantApi: AxiosInstance;
  private discordClient?: DiscordClient;
  private trackmanService?: TrackmanBaseballService;
  private championEngine?: ChampionEnigmaEngine;
  private redis: Redis;
  private gamePollingInterval?: NodeJS.Timeout;
  private currentGame?: MLBGame;
  private subscribedChannels: Set<string>;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_TTL = 60000; // 1 minute

  constructor(private config: {
    teamId: number;
    gamedayBot?: GamedayBotConfig;
    dataLab?: MLBDataLabConfig;
    trackman?: any;
    enableChampionAnalysis?: boolean;
    redisUrl?: string;
  }) {
    super();

    // Initialize MLB Stats API client
    this.mlbApi = axios.create({
      baseURL: 'https://statsapi.mlb.com/api/v1',
      headers: { 'Accept': 'application/json' }
    });

    // Initialize Baseball Savant API client
    this.savantApi = axios.create({
      baseURL: 'https://baseballsavant.mlb.com',
      headers: { 'Accept': 'application/json' }
    });

    // Initialize Redis
    this.redis = new Redis(config.redisUrl || 'redis://localhost:6379');

    // Initialize collections
    this.subscribedChannels = new Set();
    this.cache = new Map();

    // Initialize services
    this.initializeServices();

    // Start game polling
    this.startGamePolling();
  }

  // ============================================
  // Service Initialization
  // ============================================

  private async initializeServices(): Promise<void> {
    // Initialize Discord client if configured
    if (this.config.gamedayBot?.discordToken) {
      this.discordClient = new DiscordClient({
        intents: ['Guilds', 'GuildMessages']
      });

      this.discordClient.once('ready', () => {
        console.log('Discord bot connected');
        this.emit('discordReady');
      });

      await this.discordClient.login(this.config.gamedayBot.discordToken);
    }

    // Initialize Trackman service if configured
    if (this.config.trackman) {
      this.trackmanService = new TrackmanBaseballService(this.config.trackman);
      
      this.trackmanService.on('pitch', (pitch) => {
        this.handleTrackmanPitch(pitch);
      });

      this.trackmanService.on('hit', (hit) => {
        this.handleTrackmanHit(hit);
      });
    }

    // Initialize Champion Engine if enabled
    if (this.config.enableChampionAnalysis) {
      this.championEngine = new ChampionEnigmaEngine({
        enableGPU: false
      });
    }
  }

  // ============================================
  // Game Polling and Monitoring
  // ============================================

  private startGamePolling(): void {
    // Poll for games every 30 seconds
    this.gamePollingInterval = setInterval(async () => {
      await this.pollGames();
    }, 30000);

    // Initial poll
    this.pollGames();
  }

  private async pollGames(): Promise<void> {
    try {
      const today = new Date();
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);

      // Fetch games in 48-hour window
      const response = await this.mlbApi.get('/schedule', {
        params: {
          hydrate: 'team,lineups,probablePitcher,linescore',
          sportId: 1,
          startDate: this.formatDate(yesterday),
          endDate: this.formatDate(tomorrow),
          teamId: this.config.teamId
        }
      });

      const games = this.extractGames(response.data);
      
      // Find the current/next game
      const currentGame = this.findCurrentGame(games);
      
      if (currentGame && (!this.currentGame || currentGame.gamePk !== this.currentGame.gamePk)) {
        this.currentGame = currentGame;
        this.emit('gameChanged', currentGame);
        
        // If game is live, subscribe to live feed
        if (currentGame.status === 'In Progress') {
          await this.subscribeToLiveFeed(currentGame.gamePk);
        }
      }

      // Update game status
      if (this.currentGame && currentGame) {
        this.currentGame = currentGame;
        this.emit('gameUpdate', currentGame);
      }

    } catch (error) {
      console.error('Error polling games:', error);
    }
  }

  private async subscribeToLiveFeed(gamePk: number): Promise<void> {
    // Subscribe to MLB Gameday live feed
    const feedUrl = `https://statsapi.mlb.com/api/v1.1/game/${gamePk}/feed/live`;
    
    // Poll live feed every 5 seconds when game is active
    const liveFeedInterval = setInterval(async () => {
      try {
        const response = await axios.get(feedUrl);
        const gameData = response.data;
        
        // Process live game events
        this.processLiveGameData(gameData);
        
        // Check if game ended
        if (gameData.gameData.status.abstractGameState === 'Final') {
          clearInterval(liveFeedInterval);
          this.emit('gameEnded', this.currentGame);
        }
      } catch (error) {
        console.error('Error fetching live feed:', error);
      }
    }, 5000);
  }

  private processLiveGameData(gameData: any): void {
    const liveData = gameData.liveData;
    const plays = liveData.plays.allPlays;
    
    // Process recent plays
    const recentPlay = plays[plays.length - 1];
    if (recentPlay) {
      const event: GameEvent = {
        type: this.determineEventType(recentPlay),
        description: recentPlay.result.description,
        timestamp: new Date(),
        score: {
          home: liveData.linescore.teams.home.runs,
          away: liveData.linescore.teams.away.runs
        }
      };

      // Add statcast data if available
      if (recentPlay.playEvents) {
        const lastEvent = recentPlay.playEvents[recentPlay.playEvents.length - 1];
        if (lastEvent.hitData) {
          event.statcast = {
            exitVelocity: lastEvent.hitData.launchSpeed,
            launchAngle: lastEvent.hitData.launchAngle,
            distance: lastEvent.hitData.totalDistance,
            hitProbability: lastEvent.hitData.hitProbability
          };
        }
      }

      this.emit('gameEvent', event);
      
      // Send to Discord if configured
      if (this.discordClient) {
        this.sendDiscordUpdate(event);
      }
    }
  }

  // ============================================
  // MLB Stats API Methods
  // ============================================

  async getPlayerStats(playerId: number, season?: number): Promise<MLBPlayer> {
    const cacheKey = `player-${playerId}-${season || 'current'}`;
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      // Get player info
      const playerResponse = await this.mlbApi.get(`/people/${playerId}`, {
        params: {
          hydrate: 'currentTeam,stats(group=[hitting,pitching],type=[season])'
        }
      });

      const player = playerResponse.data.people[0];
      
      // Get Savant metrics
      const savantMetrics = await this.getPlayerSavantMetrics(playerId);
      
      const mlbPlayer: MLBPlayer = {
        id: player.id,
        fullName: player.fullName,
        primaryNumber: player.primaryNumber,
        primaryPosition: player.primaryPosition.abbreviation,
        stats: this.extractPlayerStats(player.stats),
        savantMetrics
      };

      // Add Champion analysis if enabled
      if (this.championEngine) {
        mlbPlayer.championProfile = await this.analyzePlayerChampionProfile(mlbPlayer);
      }

      // Add Trackman data if available
      if (this.trackmanService) {
        mlbPlayer.trackmanData = await this.getPlayerTrackmanData(playerId);
      }

      this.saveToCache(cacheKey, mlbPlayer);
      return mlbPlayer;
    } catch (error) {
      console.error('Error fetching player stats:', error);
      throw error;
    }
  }

  async getPlayerSavantMetrics(playerId: number): Promise<SavantMetrics> {
    try {
      const year = new Date().getFullYear();
      const response = await this.savantApi.get('/savant-player', {
        params: {
          player_id: playerId,
          player_type: 'batter_pitcher',
          season: year
        }
      });

      // Parse Savant data
      return this.parseSavantMetrics(response.data);
    } catch (error) {
      console.error('Error fetching Savant metrics:', error);
      return {};
    }
  }

  async getBoxScore(gamePk: number): Promise<any> {
    try {
      const response = await this.mlbApi.get(`/game/${gamePk}/boxscore`);
      return response.data;
    } catch (error) {
      console.error('Error fetching box score:', error);
      throw error;
    }
  }

  async getLineScore(gamePk: number): Promise<any> {
    try {
      const response = await this.mlbApi.get(`/game/${gamePk}/linescore`);
      return response.data;
    } catch (error) {
      console.error('Error fetching line score:', error);
      throw error;
    }
  }

  async getStandings(divisionId?: number): Promise<any> {
    try {
      const response = await this.mlbApi.get('/standings', {
        params: {
          leagueId: '103,104', // AL and NL
          season: new Date().getFullYear(),
          standingsTypes: 'regularSeason',
          hydrate: 'division,team'
        }
      });

      if (divisionId) {
        // Filter for specific division
        return response.data.records.find((r: any) => r.division.id === divisionId);
      }

      return response.data.records;
    } catch (error) {
      console.error('Error fetching standings:', error);
      throw error;
    }
  }

  // ============================================
  // MLB Data Lab Integration
  // ============================================

  async generatePlayerSummarySheet(
    playerName: string,
    year?: number
  ): Promise<PlayerSummarySheet> {
    if (!this.config.dataLab) {
      throw new Error('MLB Data Lab not configured');
    }

    try {
      const scriptPath = path.join(
        this.config.dataLab.scriptPath,
        'generate_player_summary.py'
      );

      // Execute Python script
      const command = `${this.config.dataLab.pythonPath} ${scriptPath} --players "${playerName}" --year ${year || new Date().getFullYear()}`;
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.error('Python script error:', stderr);
      }

      // Parse output to get file path
      const outputMatch = stdout.match(/output\/(\d{4})\/(.+?)\/(.+\.png)/);
      if (outputMatch) {
        const summaryPath = path.join(
          this.config.dataLab.outputPath,
          outputMatch[0]
        );

        // Read player data
        const player = await this.getPlayerByName(playerName);

        return {
          playerId: player.id,
          playerName: player.fullName,
          team: player.currentTeam?.name || '',
          year: year || new Date().getFullYear(),
          position: player.primaryPosition,
          summaryImagePath: summaryPath,
          keyStats: player.stats || {},
          advancedMetrics: player.savantMetrics || {},
          charts: {
            sprayChart: await this.generateSprayChart(player.id),
            heatMap: await this.generateHeatMap(player.id),
            trendChart: await this.generateTrendChart(player.id)
          }
        };
      }

      throw new Error('Failed to generate summary sheet');
    } catch (error) {
      console.error('Error generating player summary:', error);
      throw error;
    }
  }

  async generateTeamSummaries(teamName: string, year?: number): Promise<PlayerSummarySheet[]> {
    if (!this.config.dataLab) {
      throw new Error('MLB Data Lab not configured');
    }

    try {
      const scriptPath = path.join(
        this.config.dataLab.scriptPath,
        'generate_player_summary.py'
      );

      // Execute Python script for entire team
      const command = `${this.config.dataLab.pythonPath} ${scriptPath} --teams "${teamName}" --year ${year || new Date().getFullYear()}`;
      const { stdout, stderr } = await execAsync(command);

      if (stderr) {
        console.error('Python script error:', stderr);
      }

      // Parse output for all generated files
      const summaries: PlayerSummarySheet[] = [];
      // Implementation would parse stdout for file paths

      return summaries;
    } catch (error) {
      console.error('Error generating team summaries:', error);
      throw error;
    }
  }

  // ============================================
  // Discord Integration
  // ============================================

  async subscribeChannel(channelId: string): Promise<void> {
    this.subscribedChannels.add(channelId);
    
    // Store in database
    await this.redis.sadd('subscribed_channels', channelId);
    
    this.emit('channelSubscribed', channelId);
  }

  async unsubscribeChannel(channelId: string): Promise<void> {
    this.subscribedChannels.delete(channelId);
    
    // Remove from database
    await this.redis.srem('subscribed_channels', channelId);
    
    this.emit('channelUnsubscribed', channelId);
  }

  private async sendDiscordUpdate(event: GameEvent): Promise<void> {
    if (!this.discordClient) return;

    // Create embed for the event
    const embed = new EmbedBuilder()
      .setTitle(`${this.currentGame?.awayTeam.name} @ ${this.currentGame?.homeTeam.name}`)
      .setDescription(event.description)
      .setTimestamp(event.timestamp)
      .setColor(this.getEventColor(event.type));

    // Add score
    if (event.score) {
      embed.addFields({
        name: 'Score',
        value: `${this.currentGame?.awayTeam.abbreviation} ${event.score.away} - ${event.score.home} ${this.currentGame?.homeTeam.abbreviation}`,
        inline: true
      });
    }

    // Add Statcast data
    if (event.statcast) {
      embed.addFields({
        name: 'Statcast',
        value: `Exit Velo: ${event.statcast.exitVelocity} mph\nLaunch Angle: ${event.statcast.launchAngle}°\nDistance: ${event.statcast.distance} ft`,
        inline: true
      });
    }

    // Send to all subscribed channels
    for (const channelId of this.subscribedChannels) {
      try {
        const channel = await this.discordClient.channels.fetch(channelId) as TextChannel;
        if (channel) {
          await channel.send({ embeds: [embed] });
        }
      } catch (error) {
        console.error(`Failed to send to channel ${channelId}:`, error);
      }
    }
  }

  private getEventColor(eventType: string): number {
    const colors: { [key: string]: number } = {
      'run': 0x00ff00,      // Green
      'hit': 0x0099ff,      // Blue
      'out': 0xff0000,      // Red
      'pitch': 0xffff00,    // Yellow
      'game_end': 0xff00ff  // Magenta
    };
    return colors[eventType] || 0x808080; // Gray default
  }

  // ============================================
  // Trackman Integration
  // ============================================

  private async getPlayerTrackmanData(playerId: number): Promise<any> {
    if (!this.trackmanService) return null;

    try {
      const [pitches, hits] = await Promise.all([
        this.trackmanService.queryPitches({ 
          pitcherId: playerId.toString(), 
          limit: 20 
        }),
        this.trackmanService.queryHits({ 
          batterId: playerId.toString(), 
          limit: 20 
        })
      ]);

      return {
        recentPitches: pitches,
        recentHits: hits
      };
    } catch (error) {
      console.error('Error fetching Trackman data:', error);
      return null;
    }
  }

  private handleTrackmanPitch(pitch: TrackmanPitch): void {
    // Enhance game events with Trackman data
    const event: GameEvent = {
      type: 'pitch',
      description: `${pitch.releaseSpeed} mph ${pitch.pitchType || 'pitch'}`,
      timestamp: new Date(),
      trackman: pitch
    };

    this.emit('trackmanPitch', event);
    
    // Check for notable pitches
    if (pitch.releaseSpeed > 98) {
      this.emit('highVelocityPitch', pitch);
    }
    
    if (pitch.spinRate > 2800) {
      this.emit('highSpinPitch', pitch);
    }
  }

  private handleTrackmanHit(hit: TrackmanHit): void {
    const event: GameEvent = {
      type: 'hit',
      description: `${hit.exitSpeed} mph, ${hit.launchAngle}° launch angle`,
      timestamp: new Date(),
      trackman: hit
    };

    this.emit('trackmanHit', event);
    
    // Check for barrels
    if (hit.barrelClassification === 'barrel') {
      this.emit('barrel', hit);
    }
  }

  // ============================================
  // Champion Analysis
  // ============================================

  private async analyzePlayerChampionProfile(player: MLBPlayer): Promise<any> {
    if (!this.championEngine) return null;

    try {
      // Prepare performance data
      const performanceData = {
        stats: player.stats,
        savantMetrics: player.savantMetrics,
        position: player.primaryPosition
      };

      // Analyze with Champion Engine
      const analysis = await this.championEngine.analyzeAthlete(
        player.id.toString(),
        player.fullName,
        'baseball',
        undefined,
        performanceData
      );

      return analysis;
    } catch (error) {
      console.error('Error analyzing champion profile:', error);
      return null;
    }
  }

  // ============================================
  // Advanced Analytics
  // ============================================

  async getMatchupAnalysis(
    pitcherId: number,
    batterId: number
  ): Promise<{
    history: any[];
    prediction: any;
    advantage: string;
    confidence: number;
  }> {
    try {
      // Get historical matchup data
      const history = await this.getMatchupHistory(pitcherId, batterId);
      
      // Get current season stats for both
      const [pitcher, batter] = await Promise.all([
        this.getPlayerStats(pitcherId),
        this.getPlayerStats(batterId)
      ]);

      // Analyze matchup
      const advantage = this.calculateMatchupAdvantage(pitcher, batter, history);
      
      // Predict outcome
      const prediction = await this.predictMatchupOutcome(pitcher, batter);

      return {
        history,
        prediction,
        advantage: advantage.player,
        confidence: advantage.confidence
      };
    } catch (error) {
      console.error('Error analyzing matchup:', error);
      throw error;
    }
  }

  private async getMatchupHistory(pitcherId: number, batterId: number): Promise<any[]> {
    // Would query historical at-bat data
    return [];
  }

  private calculateMatchupAdvantage(
    pitcher: MLBPlayer,
    batter: MLBPlayer,
    history: any[]
  ): { player: string; confidence: number } {
    // Complex matchup analysis logic
    let pitcherScore = 0;
    let batterScore = 0;

    // Historical performance
    if (history.length > 0) {
      const batterAvg = history.reduce((sum, ab) => sum + (ab.hit ? 1 : 0), 0) / history.length;
      if (batterAvg > 0.300) batterScore += 2;
      else if (batterAvg < 0.200) pitcherScore += 2;
    }

    // Current form
    if (pitcher.stats?.pitching?.era && pitcher.stats.pitching.era < 3.00) pitcherScore += 1;
    if (batter.stats?.batting?.avg && batter.stats.batting.avg > 0.300) batterScore += 1;

    // Savant metrics
    if (pitcher.savantMetrics?.whiffRate && pitcher.savantMetrics.whiffRate > 30) pitcherScore += 1;
    if (batter.savantMetrics?.barrelRate && batter.savantMetrics.barrelRate > 10) batterScore += 1;

    const advantage = pitcherScore > batterScore ? 'pitcher' : 'batter';
    const confidence = Math.abs(pitcherScore - batterScore) / 10;

    return {
      player: advantage,
      confidence: Math.min(1, confidence)
    };
  }

  private async predictMatchupOutcome(
    pitcher: MLBPlayer,
    batter: MLBPlayer
  ): Promise<any> {
    // Machine learning prediction would go here
    return {
      strikeout: 0.25,
      walk: 0.08,
      hit: 0.22,
      homeRun: 0.03,
      out: 0.42
    };
  }

  // ============================================
  // Utility Methods
  // ============================================

  private extractGames(scheduleData: any): MLBGame[] {
    const games: MLBGame[] = [];
    
    for (const date of scheduleData.dates) {
      for (const game of date.games) {
        games.push(this.parseGame(game));
      }
    }

    return games;
  }

  private parseGame(gameData: any): MLBGame {
    return {
      gamePk: gameData.gamePk,
      gameDate: new Date(gameData.gameDate),
      status: this.mapGameStatus(gameData.status.abstractGameState),
      inning: gameData.linescore?.currentInning,
      inningState: gameData.linescore?.inningState,
      homeTeam: {
        id: gameData.teams.home.team.id,
        name: gameData.teams.home.team.name,
        abbreviation: gameData.teams.home.team.abbreviation,
        score: gameData.teams.home.score || 0,
        hits: gameData.teams.home.hits || 0,
        errors: gameData.teams.home.errors || 0
      },
      awayTeam: {
        id: gameData.teams.away.team.id,
        name: gameData.teams.away.team.name,
        abbreviation: gameData.teams.away.team.abbreviation,
        score: gameData.teams.away.score || 0,
        hits: gameData.teams.away.hits || 0,
        errors: gameData.teams.away.errors || 0
      },
      homeProbablePitcher: gameData.teams.home.probablePitcher,
      awayProbablePitcher: gameData.teams.away.probablePitcher
    };
  }

  private findCurrentGame(games: MLBGame[]): MLBGame | null {
    // Find live game first
    const liveGame = games.find(g => g.status === 'In Progress');
    if (liveGame) return liveGame;

    // Find next scheduled game
    const now = new Date();
    const upcomingGames = games
      .filter(g => g.status === 'Scheduled' && g.gameDate > now)
      .sort((a, b) => a.gameDate.getTime() - b.gameDate.getTime());

    if (upcomingGames.length > 0) return upcomingGames[0];

    // Return most recent completed game
    const completedGames = games
      .filter(g => g.status === 'Final')
      .sort((a, b) => b.gameDate.getTime() - a.gameDate.getTime());

    return completedGames[0] || null;
  }

  private mapGameStatus(abstractState: string): MLBGame['status'] {
    switch (abstractState) {
      case 'Preview': return 'Scheduled';
      case 'Live': return 'In Progress';
      case 'Final': return 'Final';
      default: return 'Scheduled';
    }
  }

  private determineEventType(play: any): GameEvent['type'] {
    if (play.result.eventType === 'home_run') return 'run';
    if (play.result.eventType === 'single' || 
        play.result.eventType === 'double' || 
        play.result.eventType === 'triple') return 'hit';
    if (play.result.eventType === 'strikeout' ||
        play.result.eventType === 'groundout' ||
        play.result.eventType === 'flyout') return 'out';
    return 'pitch';
  }

  private formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  private extractPlayerStats(stats: any[]): any {
    const result: any = {};
    
    for (const statGroup of stats) {
      if (statGroup.group.displayName === 'hitting') {
        result.batting = this.parseBattingStats(statGroup.splits[0]?.stat);
      } else if (statGroup.group.displayName === 'pitching') {
        result.pitching = this.parsePitchingStats(statGroup.splits[0]?.stat);
      }
    }

    return result;
  }

  private parseBattingStats(stat: any): BattingStats | undefined {
    if (!stat) return undefined;

    return {
      avg: parseFloat(stat.avg) || 0,
      obp: parseFloat(stat.obp) || 0,
      slg: parseFloat(stat.slg) || 0,
      ops: parseFloat(stat.ops) || 0,
      homeRuns: stat.homeRuns || 0,
      rbi: stat.rbi || 0,
      stolenBases: stat.stolenBases || 0,
      strikeouts: stat.strikeOuts || 0,
      walks: stat.baseOnBalls || 0
    };
  }

  private parsePitchingStats(stat: any): PitchingStats | undefined {
    if (!stat) return undefined;

    return {
      wins: stat.wins || 0,
      losses: stat.losses || 0,
      era: parseFloat(stat.era) || 0,
      whip: parseFloat(stat.whip) || 0,
      strikeouts: stat.strikeOuts || 0,
      walks: stat.baseOnBalls || 0,
      saves: stat.saves || 0,
      holds: stat.holds || 0,
      innings: parseFloat(stat.inningsPitched) || 0
    };
  }

  private parseSavantMetrics(data: any): SavantMetrics {
    // Parse Baseball Savant HTML/JSON response
    return {
      exitVelocity: data.exit_velocity_avg,
      hardHitRate: data.hard_hit_percent,
      barrelRate: data.barrel_batted_rate,
      xBA: data.xba,
      xSLG: data.xslg,
      xwOBA: data.xwoba,
      sprintSpeed: data.sprint_speed,
      fastballVelocity: data.fastball_avg_speed,
      spinRate: data.fastball_avg_spin,
      whiffRate: data.whiff_percent,
      chasRate: data.chase_rate
    };
  }

  private async getPlayerByName(name: string): Promise<any> {
    try {
      const response = await this.mlbApi.get('/sports/1/players', {
        params: {
          season: new Date().getFullYear(),
          name: name
        }
      });

      if (response.data.people && response.data.people.length > 0) {
        return response.data.people[0];
      }

      throw new Error(`Player ${name} not found`);
    } catch (error) {
      console.error('Error finding player:', error);
      throw error;
    }
  }

  private async generateSprayChart(playerId: number): Promise<string> {
    // Would generate spray chart visualization
    return '';
  }

  private async generateHeatMap(playerId: number): Promise<string> {
    // Would generate heat map visualization
    return '';
  }

  private async generateTrendChart(playerId: number): Promise<string> {
    // Would generate trend chart visualization
    return '';
  }

  // ============================================
  // Cache Management
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
  // Public API
  // ============================================

  async getCurrentGameStatus(): Promise<MLBGame | null> {
    return this.currentGame || null;
  }

  async getTeamSchedule(days: number = 7): Promise<MLBGame[]> {
    const today = new Date();
    const endDate = new Date(today);
    endDate.setDate(endDate.getDate() + days);

    const response = await this.mlbApi.get('/schedule', {
      params: {
        hydrate: 'team,lineups,probablePitcher',
        sportId: 1,
        startDate: this.formatDate(today),
        endDate: this.formatDate(endDate),
        teamId: this.config.teamId
      }
    });

    return this.extractGames(response.data);
  }

  async getWildcardStandings(): Promise<any> {
    const response = await this.mlbApi.get('/standings', {
      params: {
        leagueId: '103,104',
        season: new Date().getFullYear(),
        standingsTypes: 'wildCard',
        hydrate: 'team'
      }
    });

    return response.data.records;
  }

  async getHighlights(gamePk: number): Promise<any[]> {
    try {
      const response = await this.mlbApi.get(`/game/${gamePk}/content`);
      return response.data.highlights?.highlights?.items || [];
    } catch (error) {
      console.error('Error fetching highlights:', error);
      return [];
    }
  }

  disconnect(): void {
    if (this.gamePollingInterval) {
      clearInterval(this.gamePollingInterval);
    }
    if (this.discordClient) {
      this.discordClient.destroy();
    }
    if (this.trackmanService) {
      this.trackmanService.disconnect();
    }
    this.redis.disconnect();
    this.removeAllListeners();
  }
}

// ============================================
// Export
// ============================================

export default MLBIntegrationHub;