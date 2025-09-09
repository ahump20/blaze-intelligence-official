/**
 * Blaze Intelligence - Video Intelligence Type Definitions
 * Precision Types for Championship Intelligence
 */

export interface BiomechanicalFrame {
  timestamp: number;
  pose: PoseData;
  angles: AngleData;
  objects: ObjectDetection[];
  forces: ForceVectorData;
  confidence: number;
}

export interface PoseData {
  keypoints: Keypoint[];
  connections: Array<[number, number]>;
  confidence: number;
}

export interface Keypoint {
  x: number;
  y: number;
  z?: number;
  confidence: number;
  name: string;
}

export interface AngleData {
  [angleName: string]: {
    degrees: number;
    radians: number;
    position: { x: number; y: number };
    optimal: number;
    deviation: number;
  };
}

export interface ObjectDetection {
  type: 'ball' | 'bat' | 'glove' | 'football' | 'basketball' | 'golf_club' | 'golf_ball';
  boundingBox: BoundingBox;
  confidence: number;
  velocity?: Vector3D;
  spin?: SpinData;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface Vector3D {
  x: number;
  y: number;
  z: number;
  magnitude: number;
}

export interface SpinData {
  rate: number; // RPM
  axis: Vector3D;
  efficiency: number;
}

export interface ForceVectorData {
  vectors: ForceVector[];
  totalMagnitude: number;
  efficiency: number;
  kineticChain: KineticChainAnalysis;
}

export interface ForceVector {
  origin: { x: number; y: number };
  magnitude: number;
  angle: number;
  type: 'ground_reaction' | 'rotational' | 'linear' | 'impact';
}

export interface KineticChainAnalysis {
  sequence: string[];
  efficiency: number;
  leakPoints: LeakPoint[];
}

export interface LeakPoint {
  segment: string;
  energyLoss: number;
  correction: string;
}

export interface PerformanceMetrics {
  sport: string;
  timestamp: string;
  values: {
    [category: string]: {
      [metric: string]: number | string | MetricDetail;
    };
  };
  comparisons?: EliteComparison[];
}

export interface MetricDetail {
  value: number;
  unit: string;
  percentile?: number;
  trend?: 'improving' | 'stable' | 'declining';
}

export interface EliteComparison {
  metric: string;
  athleteValue: number;
  eliteAverage: number;
  eliteTop10: number;
  percentile: number;
  gap: number;
  improvementPath: string;
}

export interface ActionableInsight {
  priority: 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'MECHANICAL' | 'INJURY_PREVENTION' | 'PERFORMANCE' | 'TACTICAL';
  title: string;
  description: string;
  correction: string;
  drills: string[];
  timelineWeeks: number;
  confidenceScore: number;
  videoTimestamps?: number[];
  visualizations?: InsightVisualization[];
}

export interface InsightVisualization {
  type: 'overlay' | 'graph' | 'comparison';
  data: any;
  frames: number[];
}

// Sport-specific metric interfaces

export interface BaseballMetrics {
  hitting: HittingMetrics;
  pitching: PitchingMetrics;
  fielding: FieldingMetrics;
}

export interface HittingMetrics {
  exitVelocity: number;
  launchAngle: number;
  batSpeed: number;
  timeToContact: number;
  attackAngle: number;
  hipShoulderSeparation: number;
  barrelControl: number;
  swingPath: SwingPathData;
}

export interface SwingPathData {
  plane: number;
  efficiency: number;
  adjustability: number;
  powerZone: BoundingBox;
}

export interface PitchingMetrics {
  releasePoint: Vector3D;
  spinRate: number;
  velocity: number;
  breakAngle: number;
  armSlot: number;
  extension: number;
  strideLength: number;
  hipShoulderSeparation: number;
}

export interface FieldingMetrics {
  firstStepTime: number;
  glovePresentation: number;
  transferTime: number;
  throwVelocity: number;
  footwork: FootworkAnalysis;
  routeEfficiency: number;
}

export interface FootworkAnalysis {
  steps: FootStep[];
  efficiency: number;
  balance: number;
  explosiveness: number;
}

export interface FootStep {
  position: { x: number; y: number };
  timestamp: number;
  force: number;
  angle: number;
}

export interface FootballMetrics {
  quarterback: QuarterbackMetrics;
  receiver: ReceiverMetrics;
  lineman: LinemanMetrics;
  defense: DefensiveMetrics;
}

export interface QuarterbackMetrics {
  releaseTime: number;
  armStrength: number;
  footworkEfficiency: number;
  pocketMovement: PocketPresenceData;
  throwingMechanics: ThrowingForm;
  accuracy: AccuracyData;
}

export interface PocketPresenceData {
  awareness: number;
  movement: number;
  composure: number;
  escapeAbility: number;
}

export interface ThrowingForm {
  windUp: number;
  release: number;
  followThrough: number;
  consistency: number;
}

export interface AccuracyData {
  short: number;
  intermediate: number;
  deep: number;
  pressure: number;
}

export interface ReceiverMetrics {
  routePrecision: number;
  separationSpeed: number;
  catchRadius: number;
  yardsAfterCatch: number;
  hands: HandsData;
  routeTree: RouteTreeAnalysis;
}

export interface HandsData {
  catchRate: number;
  contestedCatchRate: number;
  dropRate: number;
  reliability: number;
}

export interface RouteTreeAnalysis {
  proficiency: { [route: string]: number };
  versatility: number;
  explosiveness: number;
}

export interface LinemanMetrics {
  firstContact: number;
  leveragePoint: number;
  handPlacement: number;
  padLevel: number;
  footwork: LinemanFootwork;
  power: PowerMetrics;
}

export interface LinemanFootwork {
  setSpeed: number;
  lateralMovement: number;
  balance: number;
  recovery: number;
}

export interface PowerMetrics {
  initial: number;
  sustained: number;
  explosive: number;
  functional: number;
}

export interface DefensiveMetrics {
  pursuitAngle: number;
  tackleForm: number;
  coverageTechnique: number;
  reactionTime: number;
  playRecognition: number;
  physicality: PhysicalityMetrics;
}

export interface PhysicalityMetrics {
  strength: number;
  speed: number;
  agility: number;
  violence: number;
}

export interface BasketballMetrics {
  shooting: ShootingMetrics;
  movement: MovementMetrics;
  defense: BasketballDefenseMetrics;
}

export interface ShootingMetrics {
  releaseTime: number;
  arcTrajectory: number;
  rotationRate: number;
  elbowAlignment: number;
  followThrough: number;
  consistency: ShotConsistency;
  range: ShootingRange;
}

export interface ShotConsistency {
  form: number;
  release: number;
  footwork: number;
  overall: number;
}

export interface ShootingRange {
  paint: number;
  midRange: number;
  threePoint: number;
  deep: number;
}

export interface MovementMetrics {
  firstStepBurst: number;
  lateralQuickness: number;
  verticalLeap: number;
  decelerationControl: number;
  changeOfDirection: number;
  bodyControl: BodyControlMetrics;
}

export interface BodyControlMetrics {
  balance: number;
  coordination: number;
  flexibility: number;
  core: number;
}

export interface BasketballDefenseMetrics {
  closeoutSpeed: number;
  hipPositioning: number;
  handActivity: number;
  helpRotationTiming: number;
  onBallDefense: OnBallDefenseMetrics;
  offBallDefense: OffBallDefenseMetrics;
}

export interface OnBallDefenseMetrics {
  pressure: number;
  containment: number;
  recovery: number;
  anticipation: number;
}

export interface OffBallDefenseMetrics {
  positioning: number;
  communication: number;
  helpTiming: number;
  rotation: number;
}

export interface GolfMetrics {
  fullSwing: FullSwingMetrics;
  shortGame: ShortGameMetrics;
  putting: PuttingMetrics;
}

export interface FullSwingMetrics {
  clubHeadSpeed: number;
  attackAngle: number;
  faceAngle: number;
  pathDirection: number;
  smashFactor: number;
  spineAngleMaintenance: number;
  sequencing: SwingSequencing;
  power: GolfPowerMetrics;
}

export interface SwingSequencing {
  kinematicSequence: string[];
  timing: number;
  efficiency: number;
  consistency: number;
}

export interface GolfPowerMetrics {
  xFactor: number;
  xFactorStretch: number;
  groundForce: number;
  efficiency: number;
}

export interface ShortGameMetrics {
  spinRate: number;
  launchAngle: number;
  carryDistance: number;
  rollPercentage: number;
  landingAngle: number;
  control: ShortGameControl;
}

export interface ShortGameControl {
  distance: number;
  direction: number;
  trajectory: number;
  spin: number;
}

export interface PuttingMetrics {
  faceAngleAtImpact: number;
  strokeTempo: number;
  pathConsistency: number;
  greenReading: number;
  speed: PuttingSpeed;
  mechanics: PuttingMechanics;
}

export interface PuttingSpeed {
  control: number;
  consistency: number;
  lag: number;
  aggressive: number;
}

export interface PuttingMechanics {
  setup: number;
  stroke: number;
  impact: number;
  followThrough: number;
}

// Analysis session types

export interface AnalysisSession {
  id: string;
  athleteId: string;
  teamId?: string;
  sport: string;
  timestamp: string;
  duration: number;
  videoUrl: string;
  results: AnalysisResults;
  status: 'processing' | 'completed' | 'failed';
}

export interface AnalysisResults {
  frames: BiomechanicalFrame[];
  metrics: PerformanceMetrics;
  insights: ActionableInsight[];
  confidence: number;
  summary: AnalysisSummary;
  recommendations: Recommendation[];
}

export interface AnalysisSummary {
  strengths: string[];
  weaknesses: string[];
  improvements: string[];
  riskFactors: string[];
  overallScore: number;
  trend: 'improving' | 'stable' | 'declining';
}

export interface Recommendation {
  priority: number;
  category: string;
  title: string;
  description: string;
  implementation: ImplementationPlan;
  expectedOutcome: string;
  measurableGoals: MeasurableGoal[];
}

export interface ImplementationPlan {
  phases: TrainingPhase[];
  totalDuration: number;
  frequency: string;
  equipment: string[];
}

export interface TrainingPhase {
  name: string;
  duration: number;
  focus: string[];
  drills: Drill[];
  progressionCriteria: string[];
}

export interface Drill {
  name: string;
  description: string;
  reps: string;
  sets: string;
  intensity: string;
  videoUrl?: string;
}

export interface MeasurableGoal {
  metric: string;
  current: number;
  target: number;
  timeline: number;
  unit: string;
}

// Export all types
export type {
  SportType,
  AnalysisMode,
} from './config';
