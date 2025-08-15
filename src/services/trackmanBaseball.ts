/**
 * Trackman Baseball API Integration Service
 * Comprehensive ball tracking and biomechanics data for MLB and development
 * Integrates with Stadium V3 and Portable B1 systems
 * 2025 Implementation for Blaze Intelligence
 */

import axios, { AxiosInstance } from 'axios';
import { EventEmitter } from 'events';
import WebSocket from 'ws';
import Redis from 'ioredis';
import { Kafka, Producer, Consumer } from 'kafkajs';

// ============================================
// Types and Interfaces
// ============================================

/**
 * Core Trackman pitch tracking data
 */
export interface TrackmanPitch {
  // Identifiers
  pitchId: string;
  gameId?: string;
  pitcherId: string;
  batterId: string;
  timestamp: Date;
  pitchNumber: number;
  inning: number;
  balls: number;
  strikes: number;
  outs: number;

  // Release Metrics
  releaseSpeed: number;           // mph
  releaseHeight: number;          // feet
  releaseSide: number;           // feet (from center of rubber)
  extension: number;             // feet (how far from rubber at release)
  verticalReleaseAngle: number; // degrees
  horizontalReleaseAngle: number; // degrees
  
  // Spin Metrics
  spinRate: number;              // rpm
  spinAxis: number;              // degrees (like clock face)
  spinEfficiency: number;        // percentage
  activeSpin: number;            // rpm (Magnus force component)
  gyroAngle: number;             // degrees
  measuredTilt: string;          // clock notation (e.g., "1:45")
  
  // Movement Metrics
  verticalMovement: number;      // inches (vs gravity-only trajectory)
  horizontalMovement: number;    // inches
  inducedVerticalBreak: number; // inches
  
  // Zone Location
  plateHeight: number;           // feet
  plateSide: number;            // feet (from center)
  verticalApproachAngle: number; // degrees
  horizontalApproachAngle: number; // degrees
  velocityAtPlate: number;      // mph
  
  // Result
  pitchType?: string;            // 4-seam, slider, curve, etc.
  pitchResult: 'ball' | 'strike' | 'hit' | 'foul' | 'hbp';
  contactMade: boolean;
  swingMade: boolean;
  
  // Advanced Metrics
  stuffPlus?: number;            // Stuff+ rating
  locationPlus?: number;         // Location+ rating
  breakPlus?: number;           // Break+ rating
  seams?: string;               // seam orientation
  pressure?: number;            // Magnus force
}

/**
 * Trackman hitting/batted ball data
 */
export interface TrackmanHit {
  // Identifiers
  hitId: string;
  pitchId: string;
  batterId: string;
  pitcherId: string;
  timestamp: Date;
  
  // Contact Metrics
  exitSpeed: number;            // mph (exit velocity)
  launchAngle: number;         // degrees
  launchDirection: number;      // degrees (pull/center/oppo)
  spinRate: number;            // rpm
  spinAxis: number;            // degrees
  
  // Contact Point
  contactHeight: number;        // feet
  contactDepth: number;        // feet (from front of plate)
  contactSide: number;         // feet (from center)
  contact3D: {
    x: number;
    y: number;
    z: number;
  };
  
  // Ball Flight
  distance: number;            // feet
  hangTime: number;           // seconds
  maxHeight: number;          // feet
  landingAngle: number;       // degrees
  
  // Hit Classification
  hitType: 'ground_ball' | 'line_drive' | 'fly_ball' | 'popup';
  hitResult: 'single' | 'double' | 'triple' | 'home_run' | 'out' | 'error';
  fieldingPosition?: number;  // position that fielded ball
  
  // Advanced Metrics
  xBA?: number;               // expected batting average
  xSLG?: number;              // expected slugging
  barrelClassification?: 'barrel' | 'solid_contact' | 'flare' | 'poorly_hit';
  sweetSpotContact: boolean;  // 8-32 degree launch angle
  hardHit: boolean;          // 95+ mph exit velocity
  
  // Sprint Speed (if runner)
  sprintSpeed?: number;       // ft/sec
  timeToFirst?: number;      // seconds
}

/**
 * Player biomechanics and delivery metrics
 */
export interface TrackmanBiomechanics {
  playerId: string;
  timestamp: Date;
  
  // Pitching Mechanics
  delivery?: {
    tempo: number;              // seconds from start to release
    armSlot: number;           // degrees
    strideLength: number;      // feet
    shoulderAbduction: number; // degrees
    hipShoulder: number;       // hip-shoulder separation degrees
    leadLegBlock: number;      // degrees at footstrike
  };
  
  // Batting Mechanics
  swing?: {
    batSpeed: number;          // mph at contact
    attackAngle: number;       // degrees
    timeToContact: number;     // seconds from start
    rotationalVelocity: number; // degrees/sec
    posture: number;          // degrees of tilt
  };
}

/**
 * Game state and context
 */
export interface TrackmanGameState {
  gameId: string;
  homeTeam: string;
  awayTeam: string;
  stadium: string;
  
  // Environmental
  temperature: number;         // fahrenheit
  humidity: number;           // percentage
  windSpeed: number;          // mph
  windDirection: number;      // degrees
  altitude: number;           // feet
  pressure: number;           // inHg
  
  // Game situation
  inning: number;
  topBottom: 'top' | 'bottom';
  score: { home: number; away: number };
  outs: number;
  count: { balls: number; strikes: number };
  runners: {
    first: boolean;
    second: boolean;
    third: boolean;
  };
  
  // Current matchup
  currentPitcher: string;
  currentBatter: string;
  pitchCount: number;
  leverageIndex: number;
}

/**
 * Session data for practice/bullpen
 */
export interface TrackmanSession {
  sessionId: string;
  playerId: string;
  sessionType: 'bullpen' | 'batting_practice' | 'game' | 'live_bp';
  startTime: Date;
  endTime?: Date;
  
  // Session metrics
  totalPitches?: number;
  totalSwings?: number;
  strikes?: number;
  balls?: number;
  
  // Aggregated data
  avgVelocity?: number;
  maxVelocity?: number;
  avgSpinRate?: number;
  avgBreak?: { vertical: number; horizontal: number };
  
  // Fatigue metrics
  velocityTrend?: number[];    // velocity over time
  spinRateTrend?: number[];   // spin over time
  releaseTrend?: number[];    // release point consistency
}

/**
 * Webhook payload for real-time feeds
 */
export interface TrackmanWebhookPayload {
  eventType: 'pitch' | 'hit' | 'session_start' | 'session_end';
  timestamp: Date;
  data: TrackmanPitch | TrackmanHit | TrackmanSession;
  metadata: {
    systemId: string;
    systemType: 'V3' | 'B1';
    venue?: string;
    operator?: string;
  };
}

// ============================================
// Configuration
// ============================================

export interface TrackmanConfig {
  // API Credentials
  clientId: string;
  clientSecret: string;
  username: string;
  password: string;
  
  // API Endpoints
  baseUrl?: string;           // Default: https://api.trackman.com
  stagingUrl?: string;        // For testing
  webhookUrl?: string;        // Your endpoint for receiving data
  
  // System Type
  systemType: 'V3' | 'B1' | 'both';
  
  // Features
  enableWebhooks?: boolean;
  enableWebSocket?: boolean;
  enableKafka?: boolean;
  
  // Infrastructure
  redisUrl?: string;
  kafkaConfig?: {
    brokers: string[];
    clientId: string;
  };
}

// ============================================
// Main Trackman Service
// ============================================

export class TrackmanBaseballService extends EventEmitter {
  private api: AxiosInstance;
  private redis: Redis;
  private ws?: WebSocket;
  private kafkaProducer?: Producer;
  private accessToken?: string;
  private tokenExpiry?: Date;
  private cache: Map<string, { data: any; timestamp: number }>;
  private readonly CACHE_TTL = 5000; // 5 seconds for live data

  constructor(private config: TrackmanConfig) {
    super();

    // Initialize API client
    this.api = axios.create({
      baseURL: config.baseUrl || 'https://api.trackman.com',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Initialize Redis for caching
    this.redis = new Redis(config.redisUrl || 'redis://localhost:6379');

    // Initialize local cache
    this.cache = new Map();

    // Set up authentication
    this.authenticate();

    // Initialize real-time connections
    if (config.enableWebSocket) {
      this.initializeWebSocket();
    }

    if (config.enableKafka && config.kafkaConfig) {
      this.initializeKafka(config.kafkaConfig);
    }

    // Set up webhook server if enabled
    if (config.enableWebhooks && config.webhookUrl) {
      this.setupWebhookReceiver();
    }
  }

  // ============================================
  // Authentication
  // ============================================

  private async authenticate(): Promise<void> {
    try {
      const response = await this.api.post('/auth/token', {
        client_id: this.config.clientId,
        client_secret: this.config.clientSecret,
        username: this.config.username,
        password: this.config.password,
        grant_type: 'password'
      });

      this.accessToken = response.data.access_token;
      this.tokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);

      // Set authorization header for all requests
      this.api.defaults.headers.common['Authorization'] = `Bearer ${this.accessToken}`;

      // Schedule token refresh
      const refreshTime = (response.data.expires_in - 300) * 1000; // Refresh 5 min before expiry
      setTimeout(() => this.refreshToken(), refreshTime);

      this.emit('authenticated');
    } catch (error) {
      console.error('Trackman authentication failed:', error);
      this.emit('authError', error);
      throw error;
    }
  }

  private async refreshToken(): Promise<void> {
    await this.authenticate();
  }

  // ============================================
  // Live Data Retrieval
  // ============================================

  /**
   * Get live pitch data
   */
  async getLivePitch(pitchId: string): Promise<TrackmanPitch | null> {
    const cacheKey = `pitch:${pitchId}`;
    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.api.get(`/v1/pitches/${pitchId}`);
      const pitch = this.normalizePitchData(response.data);
      
      await this.setCached(cacheKey, pitch, 60); // Cache for 60 seconds
      return pitch;
    } catch (error) {
      console.error('Error fetching pitch data:', error);
      return null;
    }
  }

  /**
   * Get live hit data
   */
  async getLiveHit(hitId: string): Promise<TrackmanHit | null> {
    const cacheKey = `hit:${hitId}`;
    const cached = await this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const response = await this.api.get(`/v1/hits/${hitId}`);
      const hit = this.normalizeHitData(response.data);
      
      await this.setCached(cacheKey, hit, 60);
      return hit;
    } catch (error) {
      console.error('Error fetching hit data:', error);
      return null;
    }
  }

  /**
   * Stream live game data
   */
  async streamGameData(gameId: string): Promise<void> {
    try {
      const response = await this.api.get(`/v1/games/${gameId}/stream`, {
        responseType: 'stream'
      });

      response.data.on('data', (chunk: Buffer) => {
        const data = JSON.parse(chunk.toString());
        this.handleStreamData(data);
      });

      response.data.on('error', (error: Error) => {
        console.error('Stream error:', error);
        this.emit('streamError', error);
      });

      this.emit('streamStarted', gameId);
    } catch (error) {
      console.error('Error starting stream:', error);
      throw error;
    }
  }

  // ============================================
  // Session Management
  // ============================================

  /**
   * Start a new tracking session (bullpen, BP, etc.)
   */
  async startSession(
    playerId: string,
    sessionType: 'bullpen' | 'batting_practice' | 'live_bp'
  ): Promise<TrackmanSession> {
    try {
      const response = await this.api.post('/v1/sessions', {
        player_id: playerId,
        session_type: sessionType,
        start_time: new Date().toISOString()
      });

      const session: TrackmanSession = {
        sessionId: response.data.session_id,
        playerId,
        sessionType,
        startTime: new Date(response.data.start_time)
      };

      // Start monitoring session
      this.monitorSession(session.sessionId);

      this.emit('sessionStarted', session);
      return session;
    } catch (error) {
      console.error('Error starting session:', error);
      throw error;
    }
  }

  /**
   * End tracking session and get summary
   */
  async endSession(sessionId: string): Promise<TrackmanSession> {
    try {
      const response = await this.api.post(`/v1/sessions/${sessionId}/end`);
      
      const session: TrackmanSession = {
        ...response.data,
        endTime: new Date()
      };

      // Get session summary
      const summary = await this.getSessionSummary(sessionId);
      Object.assign(session, summary);

      this.emit('sessionEnded', session);
      return session;
    } catch (error) {
      console.error('Error ending session:', error);
      throw error;
    }
  }

  /**
   * Get session summary with aggregated metrics
   */
  async getSessionSummary(sessionId: string): Promise<any> {
    try {
      const response = await this.api.get(`/v1/sessions/${sessionId}/summary`);
      return response.data;
    } catch (error) {
      console.error('Error getting session summary:', error);
      return {};
    }
  }

  // ============================================
  // Data Query and Analysis
  // ============================================

  /**
   * Query historical pitch data
   */
  async queryPitches(params: {
    pitcherId?: string;
    batterId?: string;
    gameId?: string;
    startDate?: Date;
    endDate?: Date;
    pitchType?: string;
    minVelocity?: number;
    maxVelocity?: number;
    limit?: number;
  }): Promise<TrackmanPitch[]> {
    try {
      const response = await this.api.get('/v1/pitches', { params });
      return response.data.map((p: any) => this.normalizePitchData(p));
    } catch (error) {
      console.error('Error querying pitches:', error);
      return [];
    }
  }

  /**
   * Query historical hit data
   */
  async queryHits(params: {
    batterId?: string;
    pitcherId?: string;
    gameId?: string;
    startDate?: Date;
    endDate?: Date;
    minExitVelo?: number;
    minLaunchAngle?: number;
    maxLaunchAngle?: number;
    limit?: number;
  }): Promise<TrackmanHit[]> {
    try {
      const response = await this.api.get('/v1/hits', { params });
      return response.data.map((h: any) => this.normalizeHitData(h));
    } catch (error) {
      console.error('Error querying hits:', error);
      return [];
    }
  }

  /**
   * Get player trends over time
   */
  async getPlayerTrends(
    playerId: string,
    metric: 'velocity' | 'spin_rate' | 'break' | 'exit_velocity' | 'launch_angle',
    days: number = 30
  ): Promise<{
    dates: Date[];
    values: number[];
    average: number;
    trend: 'improving' | 'declining' | 'stable';
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const response = await this.api.get(`/v1/players/${playerId}/trends`, {
        params: {
          metric,
          start_date: startDate.toISOString(),
          end_date: endDate.toISOString()
        }
      });

      const trend = this.calculateTrend(response.data.values);

      return {
        dates: response.data.dates.map((d: string) => new Date(d)),
        values: response.data.values,
        average: response.data.average,
        trend
      };
    } catch (error) {
      console.error('Error getting player trends:', error);
      throw error;
    }
  }

  /**
   * Compare player to league averages
   */
  async compareToLeague(
    playerId: string,
    level: 'MLB' | 'AAA' | 'AA' | 'A' | 'College' | 'HS'
  ): Promise<{
    velocity: { player: number; league: number; percentile: number };
    spinRate: { player: number; league: number; percentile: number };
    break: { player: number; league: number; percentile: number };
    command: { player: number; league: number; percentile: number };
  }> {
    try {
      const response = await this.api.get(`/v1/players/${playerId}/comparison`, {
        params: { level }
      });

      return response.data;
    } catch (error) {
      console.error('Error comparing to league:', error);
      throw error;
    }
  }

  // ============================================
  // Advanced Analytics
  // ============================================

  /**
   * Get pitch arsenal analysis
   */
  async getPitchArsenal(pitcherId: string): Promise<{
    pitches: Array<{
      type: string;
      usage: number;
      avgVelocity: number;
      avgSpinRate: number;
      avgBreak: { vertical: number; horizontal: number };
      whiffRate: number;
      stuffPlus: number;
    }>;
    effectiveness: number;
    diversity: number;
  }> {
    try {
      const response = await this.api.get(`/v1/pitchers/${pitcherId}/arsenal`);
      return response.data;
    } catch (error) {
      console.error('Error getting pitch arsenal:', error);
      throw error;
    }
  }

  /**
   * Get batting hot zones
   */
  async getBattingHotZones(batterId: string): Promise<{
    zones: Array<{
      zone: number;
      battingAverage: number;
      slugging: number;
      swingRate: number;
      whiffRate: number;
      barrelRate: number;
    }>;
    strengths: string[];
    weaknesses: string[];
  }> {
    try {
      const response = await this.api.get(`/v1/batters/${batterId}/hotzones`);
      return response.data;
    } catch (error) {
      console.error('Error getting batting hot zones:', error);
      throw error;
    }
  }

  /**
   * Calculate pitch sequencing effectiveness
   */
  async analyzeSequencing(
    pitcherId: string,
    gameId?: string
  ): Promise<{
    sequences: Array<{
      sequence: string[];
      frequency: number;
      effectiveness: number;
      putAwayRate: number;
    }>;
    tunneling: number;
    predictability: number;
  }> {
    try {
      const params = gameId ? { game_id: gameId } : {};
      const response = await this.api.get(`/v1/pitchers/${pitcherId}/sequencing`, { params });
      return response.data;
    } catch (error) {
      console.error('Error analyzing sequencing:', error);
      throw error;
    }
  }

  /**
   * Predict pitch type based on situation
   */
  async predictNextPitch(
    pitcherId: string,
    batterId: string,
    gameState: Partial<TrackmanGameState>
  ): Promise<{
    predictions: Array<{
      pitchType: string;
      probability: number;
      location: { x: number; y: number };
    }>;
    confidence: number;
  }> {
    try {
      const response = await this.api.post('/v1/predictions/pitch', {
        pitcher_id: pitcherId,
        batter_id: batterId,
        game_state: gameState
      });

      return response.data;
    } catch (error) {
      console.error('Error predicting pitch:', error);
      throw error;
    }
  }

  // ============================================
  // Real-time Event Handling
  // ============================================

  private handleStreamData(data: any): void {
    switch (data.type) {
      case 'pitch':
        const pitch = this.normalizePitchData(data.payload);
        this.emit('pitch', pitch);
        this.processPitchIntelligence(pitch);
        break;
      
      case 'hit':
        const hit = this.normalizeHitData(data.payload);
        this.emit('hit', hit);
        this.processHitIntelligence(hit);
        break;
      
      case 'game_state':
        this.emit('gameState', data.payload);
        break;
      
      default:
        console.log('Unknown stream data type:', data.type);
    }
  }

  private async processPitchIntelligence(pitch: TrackmanPitch): Promise<void> {
    // Check for notable metrics
    if (pitch.releaseSpeed > 98) {
      this.emit('highVelocity', pitch);
    }

    if (pitch.spinRate > 2800) {
      this.emit('highSpinRate', pitch);
    }

    // Check pitch effectiveness
    if (pitch.stuffPlus && pitch.stuffPlus > 120) {
      this.emit('elitePitch', pitch);
    }

    // Store in Redis for quick access
    await this.redis.set(
      `pitch:${pitch.pitchId}`,
      JSON.stringify(pitch),
      'EX',
      300 // 5 minute expiry
    );

    // Send to Kafka if enabled
    if (this.kafkaProducer) {
      await this.kafkaProducer.send({
        topic: 'trackman-pitches',
        messages: [{
          key: pitch.pitchId,
          value: JSON.stringify(pitch)
        }]
      });
    }
  }

  private async processHitIntelligence(hit: TrackmanHit): Promise<void> {
    // Check for barrels
    if (hit.barrelClassification === 'barrel') {
      this.emit('barrel', hit);
    }

    // Check for hard hit balls
    if (hit.exitSpeed > 110) {
      this.emit('crushed', hit);
    }

    // Check for perfect launch angle
    if (hit.launchAngle >= 25 && hit.launchAngle <= 35 && hit.exitSpeed > 95) {
      this.emit('optimalContact', hit);
    }

    // Store in Redis
    await this.redis.set(
      `hit:${hit.hitId}`,
      JSON.stringify(hit),
      'EX',
      300
    );

    // Send to Kafka if enabled
    if (this.kafkaProducer) {
      await this.kafkaProducer.send({
        topic: 'trackman-hits',
        messages: [{
          key: hit.hitId,
          value: JSON.stringify(hit)
        }]
      });
    }
  }

  // ============================================
  // WebSocket Management
  // ============================================

  private initializeWebSocket(): void {
    const wsUrl = `wss://stream.trackman.com/v1/live`;
    
    this.ws = new WebSocket(wsUrl, {
      headers: {
        'Authorization': `Bearer ${this.accessToken}`
      }
    });

    this.ws.on('open', () => {
      console.log('Trackman WebSocket connected');
      this.emit('wsConnected');
    });

    this.ws.on('message', (data: string) => {
      try {
        const message = JSON.parse(data);
        this.handleStreamData(message);
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    });

    this.ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      this.emit('wsError', error);
    });

    this.ws.on('close', () => {
      console.log('WebSocket connection closed');
      this.emit('wsDisconnected');
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.initializeWebSocket(), 5000);
    });
  }

  // ============================================
  // Webhook Receiver
  // ============================================

  private setupWebhookReceiver(): void {
    // This would typically be handled by your Express/Fastify server
    // Example webhook handler:
    /*
    app.post('/webhooks/trackman', async (req, res) => {
      const payload: TrackmanWebhookPayload = req.body;
      
      // Verify webhook signature
      if (!this.verifyWebhookSignature(req)) {
        return res.status(401).send('Invalid signature');
      }
      
      // Process webhook
      await this.processWebhook(payload);
      
      res.status(200).send('OK');
    });
    */
  }

  async processWebhook(payload: TrackmanWebhookPayload): Promise<void> {
    switch (payload.eventType) {
      case 'pitch':
        await this.processPitchIntelligence(payload.data as TrackmanPitch);
        break;
      
      case 'hit':
        await this.processHitIntelligence(payload.data as TrackmanHit);
        break;
      
      case 'session_start':
        this.emit('sessionStarted', payload.data);
        break;
      
      case 'session_end':
        this.emit('sessionEnded', payload.data);
        break;
    }
  }

  // ============================================
  // Kafka Integration
  // ============================================

  private async initializeKafka(config: any): Promise<void> {
    const { Kafka } = require('kafkajs');
    
    const kafka = new Kafka({
      clientId: config.clientId,
      brokers: config.brokers
    });

    this.kafkaProducer = kafka.producer();
    if (this.kafkaProducer) {
      await this.kafkaProducer.connect();
    }

    console.log('Kafka producer connected for Trackman data');
  }

  // ============================================
  // Data Normalization
  // ============================================

  private normalizePitchData(raw: any): TrackmanPitch {
    return {
      pitchId: raw.pitch_id || raw.id,
      gameId: raw.game_id,
      pitcherId: raw.pitcher_id,
      batterId: raw.batter_id,
      timestamp: new Date(raw.timestamp),
      pitchNumber: raw.pitch_number,
      inning: raw.inning,
      balls: raw.balls,
      strikes: raw.strikes,
      outs: raw.outs,
      
      releaseSpeed: raw.release_speed,
      releaseHeight: raw.release_height,
      releaseSide: raw.release_side,
      extension: raw.extension,
      verticalReleaseAngle: raw.vertical_release_angle,
      horizontalReleaseAngle: raw.horizontal_release_angle,
      
      spinRate: raw.spin_rate,
      spinAxis: raw.spin_axis,
      spinEfficiency: raw.spin_efficiency,
      activeSpin: raw.active_spin,
      gyroAngle: raw.gyro_angle,
      measuredTilt: raw.measured_tilt,
      
      verticalMovement: raw.vertical_movement,
      horizontalMovement: raw.horizontal_movement,
      inducedVerticalBreak: raw.induced_vertical_break,
      
      plateHeight: raw.plate_height,
      plateSide: raw.plate_side,
      verticalApproachAngle: raw.vertical_approach_angle,
      horizontalApproachAngle: raw.horizontal_approach_angle,
      velocityAtPlate: raw.velocity_at_plate,
      
      pitchType: raw.pitch_type,
      pitchResult: raw.pitch_result,
      contactMade: raw.contact_made,
      swingMade: raw.swing_made,
      
      stuffPlus: raw.stuff_plus,
      locationPlus: raw.location_plus,
      breakPlus: raw.break_plus,
      seams: raw.seams,
      pressure: raw.pressure
    };
  }

  private normalizeHitData(raw: any): TrackmanHit {
    return {
      hitId: raw.hit_id || raw.id,
      pitchId: raw.pitch_id,
      batterId: raw.batter_id,
      pitcherId: raw.pitcher_id,
      timestamp: new Date(raw.timestamp),
      
      exitSpeed: raw.exit_speed,
      launchAngle: raw.launch_angle,
      launchDirection: raw.launch_direction,
      spinRate: raw.spin_rate,
      spinAxis: raw.spin_axis,
      
      contactHeight: raw.contact_height,
      contactDepth: raw.contact_depth,
      contactSide: raw.contact_side,
      contact3D: {
        x: raw.contact_x,
        y: raw.contact_y,
        z: raw.contact_z
      },
      
      distance: raw.distance,
      hangTime: raw.hang_time,
      maxHeight: raw.max_height,
      landingAngle: raw.landing_angle,
      
      hitType: raw.hit_type,
      hitResult: raw.hit_result,
      fieldingPosition: raw.fielding_position,
      
      xBA: raw.xba,
      xSLG: raw.xslg,
      barrelClassification: raw.barrel_classification,
      sweetSpotContact: raw.sweet_spot_contact,
      hardHit: raw.hard_hit,
      
      sprintSpeed: raw.sprint_speed,
      timeToFirst: raw.time_to_first
    };
  }

  // ============================================
  // Utility Methods
  // ============================================

  private calculateTrend(values: number[]): 'improving' | 'declining' | 'stable' {
    if (values.length < 2) return 'stable';
    
    // Simple linear regression
    const n = values.length;
    const indices = Array.from({ length: n }, (_, i) => i);
    
    const sumX = indices.reduce((a, b) => a + b, 0);
    const sumY = values.reduce((a, b) => a + b, 0);
    const sumXY = indices.reduce((sum, x, i) => sum + x * values[i], 0);
    const sumX2 = indices.reduce((sum, x) => sum + x * x, 0);
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
    
    if (Math.abs(slope) < 0.01) return 'stable';
    return slope > 0 ? 'improving' : 'declining';
  }

  private monitorSession(sessionId: string): void {
    // Set up monitoring for active session
    const interval = setInterval(async () => {
      try {
        const summary = await this.getSessionSummary(sessionId);
        this.emit('sessionUpdate', { sessionId, summary });
        
        // Check if session ended
        if (summary.status === 'ended') {
          clearInterval(interval);
        }
      } catch (error) {
        console.error('Error monitoring session:', error);
        clearInterval(interval);
      }
    }, 5000); // Check every 5 seconds
  }

  // ============================================
  // Cache Management
  // ============================================

  private async getCached(key: string): Promise<any> {
    try {
      const cached = await this.redis.get(key);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  private async setCached(key: string, value: any, ttl: number = 60): Promise<void> {
    try {
      await this.redis.set(key, JSON.stringify(value), 'EX', ttl);
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // ============================================
  // Public API
  // ============================================

  /**
   * Get comprehensive pitcher report
   */
  async getPitcherReport(
    pitcherId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    summary: any;
    arsenal: any;
    trends: any;
    comparison: any;
    recentPitches: TrackmanPitch[];
  }> {
    const [summary, arsenal, trends, comparison, recentPitches] = await Promise.all([
      this.api.get(`/v1/pitchers/${pitcherId}/summary`),
      this.getPitchArsenal(pitcherId),
      this.getPlayerTrends(pitcherId, 'velocity', 30),
      this.compareToLeague(pitcherId, 'MLB'),
      this.queryPitches({ pitcherId, limit: 100 })
    ]);

    return {
      summary: summary.data,
      arsenal,
      trends,
      comparison,
      recentPitches
    };
  }

  /**
   * Get comprehensive batter report
   */
  async getBatterReport(
    batterId: string,
    dateRange?: { start: Date; end: Date }
  ): Promise<{
    summary: any;
    hotZones: any;
    trends: any;
    recentHits: TrackmanHit[];
  }> {
    const [summary, hotZones, trends, recentHits] = await Promise.all([
      this.api.get(`/v1/batters/${batterId}/summary`),
      this.getBattingHotZones(batterId),
      this.getPlayerTrends(batterId, 'exit_velocity', 30),
      this.queryHits({ batterId, limit: 100 })
    ]);

    return {
      summary: summary.data,
      hotZones,
      trends,
      recentHits
    };
  }

  /**
   * Subscribe to player updates
   */
  subscribeToPlayer(playerId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'subscribe',
        type: 'player',
        player_id: playerId
      }));
    }
  }

  /**
   * Unsubscribe from player updates
   */
  unsubscribeFromPlayer(playerId: string): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({
        action: 'unsubscribe',
        type: 'player',
        player_id: playerId
      }));
    }
  }

  /**
   * Disconnect and cleanup
   */
  disconnect(): void {
    if (this.ws) {
      this.ws.close();
    }
    if (this.kafkaProducer) {
      this.kafkaProducer.disconnect();
    }
    this.redis.disconnect();
    this.removeAllListeners();
  }
}

// ============================================
// Export
// ============================================

export default TrackmanBaseballService;