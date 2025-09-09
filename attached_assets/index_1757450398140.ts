/**
 * Blaze Intelligence - Video Intelligence Module
 * The Bloomberg Terminal of Sports Analytics
 * Where Texas Heritage Meets Silicon Valley Innovation
 */

// Core exports
export { BLAZE_CONFIG } from './config';
export { default as BlazeVideoAnalyzer } from './analyzer';
export { default as VideoAnalysisInterface } from './VideoAnalysisInterface';

// Type exports
export type {
  // Core types
  BiomechanicalFrame,
  PerformanceMetrics,
  ActionableInsight,
  AnalysisSession,
  AnalysisResults,
  
  // Sport-specific metrics
  BaseballMetrics,
  FootballMetrics,
  BasketballMetrics,
  GolfMetrics,
  
  // Detailed metric types
  HittingMetrics,
  PitchingMetrics,
  FieldingMetrics,
  QuarterbackMetrics,
  ReceiverMetrics,
  LinemanMetrics,
  DefensiveMetrics,
  ShootingMetrics,
  MovementMetrics,
  BasketballDefenseMetrics,
  FullSwingMetrics,
  ShortGameMetrics,
  PuttingMetrics,
  
  // Analysis types
  PoseData,
  Keypoint,
  AngleData,
  ObjectDetection,
  ForceVectorData,
  EliteComparison,
  Recommendation,
  
  // Configuration types
  SportType,
  AnalysisMode,
} from './types';

// Utility functions
export { 
  calculateConfidenceScore,
  generateInsightReport,
  compareToEliteBenchmarks,
  exportAnalysisData,
} from './utils';

// Constants
export const VIDEO_INTELLIGENCE_VERSION = '1.0.0';
export const SUPPORTED_SPORTS = ['baseball', 'football', 'basketball', 'golf'] as const;
export const MAX_VIDEO_SIZE_MB = 500;
export const SUPPORTED_VIDEO_FORMATS = ['.mp4', '.mov', '.avi', '.webm'] as const;

// Feature flags
export const FEATURES = {
  REAL_TIME_ANALYSIS: true,
  ELITE_COMPARISON: true,
  INJURY_PREVENTION: true,
  AUTOMATED_REPORTS: true,
  TEAM_ANALYTICS: true,
  TREND_ANALYSIS: true,
  MULTI_ANGLE_SUPPORT: false, // Coming soon
  AR_VISUALIZATION: false, // Coming soon
} as const;

// Performance benchmarks
export const PERFORMANCE_TARGETS = {
  analysisLatency: 100, // ms
  frameProcessingRate: 60, // fps
  confidenceThreshold: 0.92,
  accuracy: 0.95,
} as const;

// Pricing tiers
export const PRICING_TIERS = {
  PROFESSIONAL: {
    name: 'Professional Team',
    price: 5000,
    features: [
      'Unlimited video uploads',
      'Real-time analysis',
      'Elite comparison database',
      'Custom biomechanical baselines',
      'API access',
      'White-label reports',
      'Dedicated support',
    ],
    limits: {
      videos: -1, // Unlimited
      storage: -1, // Unlimited
      users: 50,
      apiCalls: 100000,
    },
  },
  ELITE: {
    name: 'Elite Program',
    price: 1500,
    features: [
      '500 hours monthly analysis',
      'D1/Pro benchmarks',
      'Recruiting reports',
      'Mobile app access',
      'Team collaboration',
      'Monthly consultations',
    ],
    limits: {
      videos: 500,
      storage: 1000, // GB
      users: 20,
      apiCalls: 10000,
    },
  },
  INDIVIDUAL_PRO: {
    name: 'Individual Pro',
    price: 299,
    features: [
      '50 hours monthly analysis',
      'Fundamental technique library',
      'Progress tracking',
      'Monthly coaching credits',
      'Personal dashboard',
    ],
    limits: {
      videos: 50,
      storage: 100, // GB
      users: 1,
      apiCalls: 1000,
    },
  },
} as const;

/**
 * Initialize the Blaze Video Intelligence system
 */
export async function initializeBlazeVideoIntelligence(config?: {
  apiKey?: string;
  environment?: 'development' | 'staging' | 'production';
  features?: Partial<typeof FEATURES>;
}): Promise<{
  analyzer: BlazeVideoAnalyzer;
  version: string;
  status: 'ready' | 'error';
  message?: string;
}> {
  try {
    // Validate API key
    if (config?.environment === 'production' && !config.apiKey) {
      throw new Error('API key required for production environment');
    }
    
    // Initialize default analyzer
    const analyzer = new BlazeVideoAnalyzer('baseball', 'HYBRID_SMART');
    
    return {
      analyzer,
      version: VIDEO_INTELLIGENCE_VERSION,
      status: 'ready',
    };
  } catch (error) {
    return {
      analyzer: null as any,
      version: VIDEO_INTELLIGENCE_VERSION,
      status: 'error',
      message: error.message,
    };
  }
}

/**
 * Quick start function for easy integration
 */
export async function analyzeSportsVideo(
  videoFile: File | ArrayBuffer | string,
  sport: SportType,
  options?: {
    quick?: boolean;
    detailed?: boolean;
    compareToElite?: boolean;
  }
): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const analyzer = new BlazeVideoAnalyzer(sport, options?.quick ? 'REAL_TIME' : 'HYBRID_SMART');
    
    let videoBuffer: ArrayBuffer;
    
    if (typeof videoFile === 'string') {
      // URL provided
      const response = await fetch(videoFile);
      videoBuffer = await response.arrayBuffer();
    } else if (videoFile instanceof File) {
      // File provided
      videoBuffer = await videoFile.arrayBuffer();
    } else {
      // ArrayBuffer provided
      videoBuffer = videoFile;
    }
    
    const results = await analyzer.analyzeVideo(videoBuffer, {
      frameRate: options?.quick ? 60 : 120,
      confidenceThreshold: options?.detailed ? 0.95 : 0.92,
      compareToElite: options?.compareToElite ?? true,
    });
    
    return {
      success: true,
      data: results,
    };
  } catch (error) {
    return {
      success: false,
      error: error.message,
    };
  }
}

// Default export for easy importing
export default {
  config: BLAZE_CONFIG,
  Analyzer: BlazeVideoAnalyzer,
  Interface: VideoAnalysisInterface,
  initialize: initializeBlazeVideoIntelligence,
  analyze: analyzeSportsVideo,
  version: VIDEO_INTELLIGENCE_VERSION,
  features: FEATURES,
  pricing: PRICING_TIERS,
};

/**
 * Blaze Intelligence - Video Intelligence Module
 * 
 * "Intelligence. Integrity. Innovation."
 * 
 * This module represents the fusion of Texas heritage with cutting-edge
 * computer vision technology. Every frame analyzed, every metric calculated,
 * and every insight generated embodies our commitment to excellence.
 * 
 * From the Friday night lights of Texas high school football to the
 * professional diamonds of MLB, from the hardwood of the NBA to the
 * pristine fairways of the PGA Tour - Blaze Intelligence delivers
 * championship-caliber analytics with unwavering integrity.
 * 
 * Built with pride in Boerne, Texas 🤠
 * Engineered for champions everywhere 🏆
 */
