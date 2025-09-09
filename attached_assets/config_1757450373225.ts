/**
 * Blaze Intelligence - Video Intelligence Configuration
 * Texas Heritage meets Silicon Valley Innovation
 */

export const BLAZE_CONFIG = {
  brand: {
    colors: {
      primary: {
        texasLegacy: '#BF5700', // Burnt Orange Heritage
        cardinalClarity: '#9BCBEB', // Cardinal Sky Blue
      },
      secondary: {
        oilerNavy: '#002244', // Tennessee Deep
        grizzlyTeal: '#00B2A9', // Vancouver Throwback Teal
      },
      supporting: {
        platinum: '#E5E4E2',
        graphite: '#36454F',
        pearl: '#FAFAFA',
      },
    },
    typography: {
      primary: 'Neue Haas Grotesk Display',
      secondary: 'Inter',
      technical: 'JetBrains Mono',
    },
  },
  
  sports: {
    baseball: {
      id: 'BASEBALL',
      displayName: 'Baseball',
      icon: 'baseball-bat-ball',
      biomechanics: {
        keyPoints: 33,
        criticalAngles: [
          'hip_shoulder_separation',
          'launch_angle',
          'swing_plane',
          'bat_lag',
          'front_knee_angle',
        ],
        trackingZones: [
          'strike_zone',
          'contact_point',
          'follow_through',
        ],
      },
      metrics: {
        hitting: [
          'exit_velocity',
          'launch_angle',
          'bat_speed',
          'time_to_contact',
          'attack_angle',
        ],
        pitching: [
          'release_point',
          'spin_rate',
          'velocity',
          'break_angle',
          'arm_slot',
        ],
        fielding: [
          'first_step_time',
          'glove_presentation',
          'transfer_time',
          'throw_velocity',
        ],
      },
    },
    
    football: {
      id: 'FOOTBALL',
      displayName: 'Football',
      icon: 'football',
      biomechanics: {
        keyPoints: 35,
        criticalAngles: [
          'hip_flexibility',
          'shoulder_rotation',
          'knee_drive',
          'arm_angle',
          'torso_lean',
        ],
        trackingZones: [
          'pocket_presence',
          'release_window',
          'catch_radius',
          'tackle_box',
        ],
      },
      metrics: {
        quarterback: [
          'release_time',
          'arm_strength',
          'footwork_efficiency',
          'pocket_movement',
          'throwing_motion',
        ],
        receiver: [
          'route_precision',
          'separation_speed',
          'catch_radius',
          'yards_after_catch',
        ],
        lineman: [
          'first_contact',
          'leverage_point',
          'hand_placement',
          'pad_level',
        ],
        defense: [
          'pursuit_angle',
          'tackle_form',
          'coverage_technique',
          'reaction_time',
        ],
      },
    },
    
    basketball: {
      id: 'BASKETBALL',
      displayName: 'Basketball',
      icon: 'basketball',
      biomechanics: {
        keyPoints: 31,
        criticalAngles: [
          'elbow_alignment',
          'release_angle',
          'hip_rotation',
          'defensive_stance',
          'jump_mechanics',
        ],
        trackingZones: [
          'shooting_pocket',
          'paint_presence',
          'perimeter_movement',
          'transition_lanes',
        ],
      },
      metrics: {
        shooting: [
          'release_time',
          'arc_trajectory',
          'rotation_rate',
          'elbow_alignment',
          'follow_through',
        ],
        movement: [
          'first_step_burst',
          'lateral_quickness',
          'vertical_leap',
          'deceleration_control',
        ],
        defense: [
          'closeout_speed',
          'hip_positioning',
          'hand_activity',
          'help_rotation_timing',
        ],
      },
    },
    
    golf: {
      id: 'GOLF',
      displayName: 'Golf',
      icon: 'golf-ball-tee',
      biomechanics: {
        keyPoints: 28,
        criticalAngles: [
          'spine_angle',
          'hip_turn',
          'shoulder_plane',
          'wrist_hinge',
          'knee_flex',
        ],
        trackingZones: [
          'address_position',
          'backswing_plane',
          'impact_zone',
          'follow_through',
        ],
      },
      metrics: {
        fullSwing: [
          'club_head_speed',
          'attack_angle',
          'face_angle',
          'path_direction',
          'smash_factor',
        ],
        shortGame: [
          'spin_rate',
          'launch_angle',
          'carry_distance',
          'roll_percentage',
        ],
        putting: [
          'face_angle_at_impact',
          'stroke_tempo',
          'path_consistency',
          'green_reading',
        ],
      },
    },
  },
  
  analysis: {
    frameRates: {
      standard: 60,
      high: 120,
      ultra: 240,
    },
    confidenceThresholds: {
      minimum: 0.85,
      recommended: 0.92,
      professional: 0.95,
    },
    processingModes: {
      realtime: 'REAL_TIME',
      batch: 'BATCH_PROCESS',
      hybrid: 'HYBRID_SMART',
    },
  },
  
  storage: {
    retention: {
      raw: 30, // days
      processed: 365, // days
      highlights: -1, // permanent
    },
    compression: {
      algorithm: 'H.265',
      quality: 'PRESERVE_DETAIL',
      keyFrameInterval: 60,
    },
  },
};

export type SportType = keyof typeof BLAZE_CONFIG.sports;
export type AnalysisMode = typeof BLAZE_CONFIG.analysis.processingModes[keyof typeof BLAZE_CONFIG.analysis.processingModes];
