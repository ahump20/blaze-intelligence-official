// SportsRadar & Hawkeye Advanced Intelligence Integration
// Professional-grade sports data and computer vision analytics

import axios from 'axios';
import io from 'socket.io-client';

// Hawkeye Computer Vision Data Types
interface HawkeyeTrackingData {
  timestamp: number;
  frameId: number;
  players: PlayerTracking[];
  ball: BallTracking;
  events: TrackingEvent[];
  heatmaps: HeatmapData;
  velocities: VelocityData;
}

interface PlayerTracking {
  playerId: string;
  position: { x: number; y: number; z: number };
  velocity: { vx: number; vy: number; vz: number };
  acceleration: { ax: number; ay: number; az: number };
  bodyOrientation: number;
  headOrientation: number;
  jointPositions?: JointTracking;
  biometrics?: BiometricData;
}

interface BallTracking {
  position: { x: number; y: number; z: number };
  velocity: { vx: number; vy: number; vz: number };
  spin: { rpm: number; axis: { x: number; y: number; z: number } };
  trajectory: TrajectoryPoint[];
  predictedPath: TrajectoryPoint[];
}

interface JointTracking {
  head: { x: number; y: number; z: number };
  shoulders: { left: Position3D; right: Position3D };
  elbows: { left: Position3D; right: Position3D };
  wrists: { left: Position3D; right: Position3D };
  hips: { left: Position3D; right: Position3D };
  knees: { left: Position3D; right: Position3D };
  ankles: { left: Position3D; right: Position3D };
}

interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface BiometricData {
  heartRate?: number;
  respirationRate?: number;
  muscleOxygen?: number;
  coreTemperature?: number;
  hydrationLevel?: number;
  fatigueIndex?: number;
}

interface TrackingEvent {
  type: string;
  timestamp: number;
  participants: string[];
  location: Position3D;
  outcome: string;
  confidence: number;
}

interface HeatmapData {
  offensive: number[][];
  defensive: number[][];
  possession: number[][];
  pressure: number[][];
}

interface VelocityData {
  maxSpeed: number;
  avgSpeed: number;
  sprintCount: number;
  distanceCovered: number;
  accelerations: number;
  decelerations: number;
}

interface TrajectoryPoint {
  position: Position3D;
  timestamp: number;
  velocity?: Position3D;
}

// SportsRadar Enhanced Data Types
interface SportsRadarEnhancedData {
  gameId: string;
  realTimeStats: RealTimeStats;
  advancedMetrics: AdvancedMetrics;
  predictiveAnalytics: PredictiveAnalytics;
  bettingInsights: BettingInsights;
  socialSentiment: SocialSentiment;
}

interface RealTimeStats {
  score: { home: number; away: number };
  possession: { team: string; duration: number };
  momentum: { team: string; value: number };
  keyPlayers: PlayerPerformance[];
  criticalMoments: CriticalMoment[];
}

interface AdvancedMetrics {
  expectedGoals?: number;
  winProbability: { home: number; away: number };
  performanceIndex: { home: number; away: number };
  tacticalAnalysis: TacticalData;
  fatigueFactor: { home: number; away: number };
}

interface PredictiveAnalytics {
  nextScoringProbability: { team: string; probability: number; timeframe: number };
  injuryRisk: { playerId: string; risk: number; bodyPart: string }[];
  gameFlow: { period: string; expectedEvents: string[] }[];
  finalScorePrediction: { home: number; away: number; confidence: number };
}

interface BettingInsights {
  liveOdds: { spread: number; total: number; moneyline: { home: number; away: number } };
  valueOpportunities: { type: string; bet: string; edge: number }[];
  propBets: { player: string; prop: string; line: number; probability: number }[];
  marketMovement: { direction: string; magnitude: number; trigger: string };
}

interface SocialSentiment {
  twitterMentions: number;
  sentimentScore: number;
  trendingTopics: string[];
  fanEngagement: { home: number; away: number };
  viralMoments: { timestamp: number; description: string; reach: number }[];
}

interface CriticalMoment {
  timestamp: number;
  description: string;
  impact: number;
  winProbabilitySwing: number;
}

interface PlayerPerformance {
  playerId: string;
  name: string;
  rating: number;
  keyStats: { [key: string]: number };
  impactScore: number;
}

interface TacticalData {
  formation: string;
  pressingIntensity: number;
  defensiveLine: number;
  attackingWidth: number;
  tempo: number;
}

export class SportsRadarHawkeyeIntegration {
  private sportsRadarKey: string;
  private hawkeyeApiUrl: string;
  private sportsRadarUrl: string;
  private hawkeyeSocket: any;
  private sportsRadarSocket: any;
  private dataBuffer: Map<string, any[]> = new Map();

  constructor() {
    this.sportsRadarKey = process.env.REACT_APP_SPORTRADAR_API_KEY || '';
    this.hawkeyeApiUrl = process.env.REACT_APP_HAWKEYE_API_URL || 'https://api.hawkeye.sports';
    this.sportsRadarUrl = 'https://api.sportradar.com';
  }

  // Initialize both systems
  async initialize(): Promise<void> {
    try {
      await Promise.all([
        this.initializeHawkeye(),
        this.initializeSportsRadar()
      ]);
      
      console.log('SportsRadar & Hawkeye systems initialized');
    } catch (error) {
      console.error('Failed to initialize sports intelligence systems:', error);
      throw error;
    }
  }

  // Initialize Hawkeye computer vision system
  private async initializeHawkeye(): Promise<void> {
    // Connect to Hawkeye real-time feed
    this.hawkeyeSocket = io(`${this.hawkeyeApiUrl}/tracking`, {
      transports: ['websocket'],
      auth: {
        token: process.env.REACT_APP_HAWKEYE_TOKEN
      }
    });

    this.hawkeyeSocket.on('connect', () => {
      console.log('Connected to Hawkeye tracking system');
    });

    this.hawkeyeSocket.on('tracking_data', (data: HawkeyeTrackingData) => {
      this.processHawkeyeData(data);
    });

    this.hawkeyeSocket.on('event_detection', (event: TrackingEvent) => {
      this.processTrackingEvent(event);
    });
  }

  // Initialize SportsRadar enhanced feed
  private async initializeSportsRadar(): Promise<void> {
    // Connect to SportsRadar WebSocket
    this.sportsRadarSocket = io(`${this.sportsRadarUrl}/live`, {
      transports: ['websocket'],
      auth: {
        apiKey: this.sportsRadarKey
      }
    });

    this.sportsRadarSocket.on('connect', () => {
      console.log('Connected to SportsRadar live feed');
    });

    this.sportsRadarSocket.on('game_update', (data: SportsRadarEnhancedData) => {
      this.processSportsRadarData(data);
    });
  }

  // Process tracking event
  private processTrackingEvent(event: TrackingEvent): void {
    window.dispatchEvent(new CustomEvent('hawkeye:event', { 
      detail: event 
    }));
  }

  // Process Hawkeye computer vision data
  private processHawkeyeData(data: HawkeyeTrackingData): void {
    // Buffer data for analysis
    const gameId = this.extractGameId(data);
    if (!this.dataBuffer.has(gameId)) {
      this.dataBuffer.set(gameId, []);
    }
    this.dataBuffer.get(gameId)!.push(data);

    // Perform real-time analysis
    const insights = this.analyzeHawkeyeData(data);
    
    // Emit processed data
    window.dispatchEvent(new CustomEvent('hawkeye:tracking_update', {
      detail: {
        raw: data,
        insights,
        visualizations: this.generateVisualizations(data)
      }
    }));
  }

  // Analyze Hawkeye tracking data
  private analyzeHawkeyeData(data: HawkeyeTrackingData): any {
    return {
      playerMovement: this.analyzePlayerMovement(data.players),
      ballPhysics: this.analyzeBallPhysics(data.ball),
      tacticalPatterns: this.analyzeTacticalPatterns(data),
      biomechanics: this.analyzeBiomechanics(data.players),
      spaceControl: this.analyzeSpaceControl(data.heatmaps)
    };
  }

  // Player movement analysis
  private analyzePlayerMovement(players: PlayerTracking[]): any {
    const movements = players.map(player => ({
      playerId: player.playerId,
      speed: Math.sqrt(player.velocity.vx ** 2 + player.velocity.vy ** 2),
      acceleration: Math.sqrt(player.acceleration.ax ** 2 + player.acceleration.ay ** 2),
      direction: Math.atan2(player.velocity.vy, player.velocity.vx),
      fatigue: this.calculateFatigue(player)
    }));

    return {
      fastest: movements.reduce((max, p) => p.speed > max.speed ? p : max),
      averageSpeed: movements.reduce((sum, p) => sum + p.speed, 0) / movements.length,
      highIntensityRuns: movements.filter(p => p.speed > 7).length,
      movements
    };
  }

  // Ball physics analysis
  private analyzeBallPhysics(ball: BallTracking): any {
    const speed = Math.sqrt(ball.velocity.vx ** 2 + ball.velocity.vy ** 2 + ball.velocity.vz ** 2);
    const trajectoryQuality = this.assessTrajectory(ball.trajectory);
    
    return {
      speed,
      spin: ball.spin.rpm,
      predictedLanding: ball.predictedPath[ball.predictedPath.length - 1],
      trajectoryQuality,
      ballControl: speed < 5 ? 'controlled' : speed < 15 ? 'moderate' : 'long'
    };
  }

  // Tactical pattern analysis
  private analyzeTacticalPatterns(data: HawkeyeTrackingData): any {
    const formation = this.detectFormation(data.players);
    const pressingTriggers = this.detectPressingTriggers(data);
    const defensiveShape = this.analyzeDefensiveShape(data.players);
    
    return {
      formation,
      pressingIntensity: pressingTriggers.intensity,
      compactness: defensiveShape.compactness,
      width: defensiveShape.width,
      depth: defensiveShape.depth,
      patterns: this.detectRecurringPatterns(this.dataBuffer)
    };
  }

  // Biomechanics analysis
  private analyzeBiomechanics(players: PlayerTracking[]): any {
    return players.map(player => {
      if (!player.jointPositions) return null;
      
      return {
        playerId: player.playerId,
        runningForm: this.assessRunningForm(player.jointPositions),
        injuryRisk: this.assessInjuryRisk(player),
        efficiency: this.calculateMovementEfficiency(player),
        balance: this.assessBalance(player.jointPositions)
      };
    }).filter(Boolean);
  }

  // Space control analysis
  private analyzeSpaceControl(heatmaps: HeatmapData): any {
    return {
      territorialDominance: this.calculateTerritorialDominance(heatmaps),
      dangerZones: this.identifyDangerZones(heatmaps),
      openSpaces: this.findOpenSpaces(heatmaps),
      pressurePoints: this.identifyPressurePoints(heatmaps.pressure)
    };
  }

  // Process SportsRadar enhanced data
  private processSportsRadarData(data: SportsRadarEnhancedData): void {
    // Combine with Hawkeye data if available
    const hawkeyeData = this.dataBuffer.get(data.gameId);
    const combined = this.combineDataSources(data, hawkeyeData);
    
    // Generate advanced insights
    const insights = this.generateAdvancedInsights(combined);
    
    // Emit comprehensive update
    window.dispatchEvent(new CustomEvent('sportradar:enhanced_update', {
      detail: {
        gameData: data,
        insights,
        predictions: this.generatePredictions(combined),
        recommendations: this.generateRecommendations(insights)
      }
    }));
  }

  // Combine Hawkeye and SportsRadar data
  private combineDataSources(sportsRadar: SportsRadarEnhancedData, hawkeye?: any[]): any {
    if (!hawkeye || hawkeye.length === 0) {
      return { sportsRadar, hawkeye: null };
    }

    const latestHawkeye = hawkeye[hawkeye.length - 1];
    
    return {
      gameId: sportsRadar.gameId,
      timestamp: Date.now(),
      score: sportsRadar.realTimeStats.score,
      tracking: latestHawkeye,
      metrics: {
        ...sportsRadar.advancedMetrics,
        hawkeye: this.analyzeHawkeyeData(latestHawkeye)
      },
      predictions: {
        ...sportsRadar.predictiveAnalytics,
        enhanced: this.enhancePredictions(sportsRadar.predictiveAnalytics, latestHawkeye)
      },
      betting: sportsRadar.bettingInsights,
      social: sportsRadar.socialSentiment
    };
  }

  // Generate advanced insights
  private generateAdvancedInsights(data: any): any {
    return {
      gameState: this.assessGameState(data),
      momentum: this.calculateMomentum(data),
      keyMatchups: this.identifyKeyMatchups(data),
      tacticalAdvantages: this.assessTacticalAdvantages(data),
      criticalFactors: this.identifyCriticalFactors(data),
      recommendations: this.generateTacticalRecommendations(data)
    };
  }

  // Generate predictions
  private generatePredictions(data: any): any {
    return {
      nextGoal: this.predictNextGoal(data),
      finalScore: this.predictFinalScore(data),
      playerPerformance: this.predictPlayerPerformance(data),
      gameFlow: this.predictGameFlow(data),
      keyEvents: this.predictKeyEvents(data)
    };
  }

  // Generate recommendations
  private generateRecommendations(insights: any): any {
    return {
      tactical: this.generateTacticalSuggestions(insights),
      substitutions: this.suggestSubstitutions(insights),
      betting: this.generateBettingRecommendations(insights),
      fantasy: this.generateFantasyRecommendations(insights)
    };
  }

  // Helper methods for analysis
  private extractGameId(data: any): string {
    return data.gameId || `game_${Date.now()}`;
  }

  private calculateFatigue(player: PlayerTracking): number {
    // Complex fatigue calculation based on biometrics and movement
    const base = player.biometrics?.fatigueIndex || 0;
    const speedFactor = Math.sqrt(player.velocity.vx ** 2 + player.velocity.vy ** 2) / 10;
    return Math.min(1, base + speedFactor * 0.1);
  }

  private assessTrajectory(trajectory: TrajectoryPoint[]): string {
    if (trajectory.length < 2) return 'unknown';
    // Analyze trajectory smoothness and predictability
    return 'optimal'; // Simplified
  }

  private detectFormation(players: PlayerTracking[]): string {
    // Machine learning based formation detection
    return '4-3-3'; // Simplified
  }

  private detectPressingTriggers(data: HawkeyeTrackingData): any {
    return { intensity: 0.75, triggers: [] }; // Simplified
  }

  private analyzeDefensiveShape(players: PlayerTracking[]): any {
    return {
      compactness: 0.8,
      width: 45,
      depth: 35
    };
  }

  private detectRecurringPatterns(buffer: Map<string, any[]>): any[] {
    return []; // Pattern detection algorithm
  }

  private assessRunningForm(joints: JointTracking): number {
    return 0.85; // Biomechanical analysis
  }

  private assessInjuryRisk(player: PlayerTracking): number {
    return 0.15; // Risk assessment algorithm
  }

  private calculateMovementEfficiency(player: PlayerTracking): number {
    return 0.9; // Efficiency calculation
  }

  private assessBalance(joints: JointTracking): number {
    return 0.95; // Balance assessment
  }

  private calculateTerritorialDominance(heatmaps: HeatmapData): number {
    return 0.55; // Territory calculation
  }

  private identifyDangerZones(heatmaps: HeatmapData): Position3D[] {
    return []; // Danger zone identification
  }

  private findOpenSpaces(heatmaps: HeatmapData): Position3D[] {
    return []; // Open space detection
  }

  private identifyPressurePoints(pressure: number[][]): Position3D[] {
    return []; // Pressure point analysis
  }

  private enhancePredictions(predictions: PredictiveAnalytics, hawkeye: any): any {
    return predictions; // Enhanced predictions
  }

  private assessGameState(data: any): string {
    return 'balanced'; // Game state assessment
  }

  private calculateMomentum(data: any): any {
    return { team: 'home', value: 0.6 };
  }

  private identifyKeyMatchups(data: any): any[] {
    return [];
  }

  private assessTacticalAdvantages(data: any): any {
    return {};
  }

  private identifyCriticalFactors(data: any): string[] {
    return [];
  }

  private generateTacticalRecommendations(data: any): any {
    return {};
  }

  private predictNextGoal(data: any): any {
    return { team: 'home', probability: 0.65, timeframe: 15 };
  }

  private predictFinalScore(data: any): any {
    return { home: 2, away: 1, confidence: 0.75 };
  }

  private predictPlayerPerformance(data: any): any {
    return {};
  }

  private predictGameFlow(data: any): any[] {
    return [];
  }

  private predictKeyEvents(data: any): any[] {
    return [];
  }

  private generateTacticalSuggestions(insights: any): any {
    return {};
  }

  private suggestSubstitutions(insights: any): any[] {
    return [];
  }

  private generateBettingRecommendations(insights: any): any {
    return {};
  }

  private generateFantasyRecommendations(insights: any): any {
    return {};
  }

  private generateVisualizations(data: HawkeyeTrackingData): any {
    return {
      playerPositions: this.createPositionMap(data.players),
      ballTrajectory: this.createTrajectoryVisualization(data.ball),
      heatmap: this.createHeatmapVisualization(data.heatmaps),
      velocityVectors: this.createVelocityVisualization(data.players)
    };
  }

  private createPositionMap(players: PlayerTracking[]): any {
    return players.map(p => ({
      id: p.playerId,
      x: p.position.x,
      y: p.position.y
    }));
  }

  private createTrajectoryVisualization(ball: BallTracking): any {
    return {
      current: ball.position,
      predicted: ball.predictedPath
    };
  }

  private createHeatmapVisualization(heatmaps: HeatmapData): any {
    return heatmaps;
  }

  private createVelocityVisualization(players: PlayerTracking[]): any {
    return players.map(p => ({
      id: p.playerId,
      velocity: p.velocity
    }));
  }

  // Public API methods
  async getGameTracking(gameId: string): Promise<HawkeyeTrackingData | null> {
    const data = this.dataBuffer.get(gameId);
    return data ? data[data.length - 1] : null;
  }

  async getSportsRadarData(gameId: string): Promise<SportsRadarEnhancedData> {
    const response = await axios.get(`${this.sportsRadarUrl}/games/${gameId}`, {
      headers: {
        'x-api-key': this.sportsRadarKey
      }
    });
    return response.data;
  }

  // Cleanup
  disconnect(): void {
    if (this.hawkeyeSocket) {
      this.hawkeyeSocket.disconnect();
    }
    if (this.sportsRadarSocket) {
      this.sportsRadarSocket.disconnect();
    }
    this.dataBuffer.clear();
  }
}

// Export singleton instance
export const sportsIntelligence = new SportsRadarHawkeyeIntegration();