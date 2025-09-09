// Video Intelligence Configuration
export const VIDEO_INTELLIGENCE_CONFIG = {
  // Processing settings
  processing: {
    maxConcurrentJobs: 3,
    timeoutMs: 300000, // 5 minutes
    retryAttempts: 2,
    chunkSize: 1000, // frames per chunk
    batchSize: 10, // frames per batch
  },

  // Detection thresholds
  detection: {
    player: {
      confidence: 0.75,
      minSize: 32, // pixels
      maxTracking: 22, // players
      trackingFrames: 30, // frames to maintain track
    },
    ball: {
      confidence: 0.6,
      minSize: 8, // pixels
      maxVelocity: 200, // mph
      trackingFrames: 60,
    },
    field: {
      confidence: 0.8,
      landmarkThreshold: 0.7,
      requiredLandmarks: 3,
    },
  },

  // Sport-specific configurations
  sports: {
    baseball: {
      playerPositions: [
        'pitcher', 'catcher', 'first_base', 'second_base', 'third_base',
        'shortstop', 'left_field', 'center_field', 'right_field', 'batter'
      ],
      fieldDimensions: {
        pitchingDistance: 60.5, // feet
        baseDistance: 90, // feet
        foulTerritory: true,
      },
      keyActions: ['pitch', 'swing', 'hit', 'catch', 'throw', 'steal'],
    },
    football: {
      playerPositions: [
        'quarterback', 'running_back', 'wide_receiver', 'tight_end',
        'offensive_line', 'defensive_line', 'linebacker', 'cornerback',
        'safety', 'kicker', 'punter'
      ],
      fieldDimensions: {
        length: 120, // yards (including end zones)
        width: 53.33, // yards
        endZone: 10, // yards
      },
      keyActions: ['snap', 'pass', 'run', 'tackle', 'kick', 'punt'],
    },
    basketball: {
      playerPositions: [
        'point_guard', 'shooting_guard', 'small_forward',
        'power_forward', 'center'
      ],
      fieldDimensions: {
        length: 94, // feet
        width: 50, // feet
        rimHeight: 10, // feet
      },
      keyActions: ['dribble', 'pass', 'shoot', 'rebound', 'steal', 'block'],
    },
  },

  // Video processing
  video: {
    supportedFormats: ['mp4', 'avi', 'mov', 'mkv', 'webm'],
    maxFileSize: 500 * 1024 * 1024, // 500MB
    maxDuration: 3600, // 1 hour
    targetFps: 30,
    maxResolution: {
      width: 1920,
      height: 1080,
    },
  },

  // Output settings
  output: {
    formats: {
      json: {
        compression: true,
        prettyPrint: false,
        includeRawData: false,
      },
      csv: {
        delimiter: ',',
        includeHeader: true,
        precision: 2,
      },
      video: {
        overlayEnabled: true,
        highlightPlayers: true,
        showTrajectories: true,
        showMetrics: true,
        format: 'mp4',
        quality: 'high',
      },
    },
  },

  // API settings
  api: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100, // requests per window
    },
    upload: {
      fieldName: 'video',
      maxFileSize: 500 * 1024 * 1024, // 500MB
      allowedMimeTypes: [
        'video/mp4',
        'video/avi',
        'video/quicktime',
        'video/x-msvideo',
        'video/webm',
      ],
    },
  },

  // Cache settings
  cache: {
    enabled: true,
    ttl: 3600, // 1 hour
    maxSize: 1000, // number of cached results
    strategy: 'lru', // least recently used
  },

  // Webhook settings
  webhooks: {
    enabled: true,
    retryAttempts: 3,
    retryDelay: 5000, // ms
    timeout: 10000, // ms
    events: [
      'job.started',
      'job.progress',
      'job.completed',
      'job.failed',
    ],
  },

  // Security settings
  security: {
    encryptionEnabled: true,
    dataRetention: 30, // days
    allowedOrigins: ['*'], // Configure for production
    requireAuth: true,
    maxUploadRate: 5, // files per minute
  },

  // Analytics settings
  analytics: {
    trackUsage: true,
    collectMetrics: true,
    exportInterval: 3600000, // 1 hour in ms
    metricsEndpoint: '/api/video-intelligence/metrics',
  },

  // Error handling
  errors: {
    maxRetries: 3,
    retryDelay: 1000, // ms
    logLevel: 'error',
    notifyOnFailure: true,
    fallbackEnabled: true,
  },

  // Performance settings
  performance: {
    enableGpu: true,
    maxMemoryUsage: 4 * 1024 * 1024 * 1024, // 4GB
    optimizeForSpeed: true,
    enableProfiling: false,
    warmupFrames: 10,
  },
};

export default VIDEO_INTELLIGENCE_CONFIG;