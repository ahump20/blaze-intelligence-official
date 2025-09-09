// Video Intelligence Type Definitions
export interface VideoFrame {
  timestamp: number;
  players: PlayerDetection[];
  ball?: BallDetection;
  field: FieldDetection;
}

export interface PlayerDetection {
  id: string;
  boundingBox: BoundingBox;
  position: Position;
  jersey?: string;
  team?: string;
  confidence: number;
  bodyPose?: BodyPose;
  velocity?: Velocity;
  acceleration?: Acceleration;
}

export interface BallDetection {
  boundingBox: BoundingBox;
  position: Position;
  velocity?: Velocity;
  confidence: number;
  trajectory?: TrajectoryPoint[];
}

export interface FieldDetection {
  bounds: BoundingBox;
  landmarks: FieldLandmark[];
  surface: 'grass' | 'turf' | 'clay' | 'court';
  sport: 'baseball' | 'football' | 'basketball' | 'soccer';
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Position {
  x: number;
  y: number;
  z?: number;
}

export interface BodyPose {
  keypoints: Keypoint[];
  stance: 'batting' | 'pitching' | 'fielding' | 'running' | 'throwing';
  confidence: number;
}

export interface Keypoint {
  name: string;
  position: Position;
  confidence: number;
  visible: boolean;
}

export interface Velocity {
  x: number;
  y: number;
  z?: number;
  magnitude: number;
}

export interface Acceleration {
  x: number;
  y: number;
  z?: number;
  magnitude: number;
}

export interface TrajectoryPoint {
  timestamp: number;
  position: Position;
  velocity?: Velocity;
}

export interface FieldLandmark {
  name: string;
  position: Position;
  type: 'base' | 'mound' | 'plate' | 'line' | 'goal' | 'yard';
  confidence: number;
}

export interface VideoMetrics {
  totalFrames: number;
  fps: number;
  duration: number;
  resolution: {
    width: number;
    height: number;
  };
  quality: number;
}

export interface AnalysisConfig {
  sport: string;
  trackPlayers: boolean;
  trackBall: boolean;
  detectField: boolean;
  extractMetrics: boolean;
  realTimeMode: boolean;
  confidenceThreshold: number;
  outputFormat: 'json' | 'csv' | 'video';
}

export interface AnalysisResult {
  videoId: string;
  frames: VideoFrame[];
  metrics: VideoMetrics;
  summary: AnalysisSummary;
  status: 'processing' | 'completed' | 'failed';
  processingTime: number;
}

export interface AnalysisSummary {
  playerCount: number;
  ballTracked: boolean;
  avgPlayerVelocity: number;
  maxPlayerVelocity: number;
  ballVelocity?: number;
  keyMoments: KeyMoment[];
  insights: string[];
}

export interface KeyMoment {
  timestamp: number;
  type: 'swing' | 'pitch' | 'catch' | 'tackle' | 'shot' | 'goal';
  description: string;
  confidence: number;
  participants: string[];
}

export interface ProcessingJob {
  id: string;
  videoUrl: string;
  config: AnalysisConfig;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  endTime?: number;
  result?: AnalysisResult;
  error?: string;
}