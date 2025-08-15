/**
 * Trackman Live Tracker Component
 * Real-time baseball tracking visualization for Blaze Intelligence
 * Displays pitch metrics, hit data, and session analytics
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { TrackmanBaseballService, TrackmanPitch, TrackmanHit } from '../services/trackmanBaseball';
import { ChampionEnigmaEngine } from '../services/championEnigmaEngine';
import './TrackmanLiveTracker.css';

// ============================================
// Types
// ============================================

interface TrackmanLiveTrackerProps {
  playerId?: string;
  gameId?: string;
  sessionId?: string;
  mode: 'game' | 'bullpen' | 'batting_practice';
  enableChampionAnalysis?: boolean;
  onPitchEvent?: (pitch: TrackmanPitch) => void;
  onHitEvent?: (hit: TrackmanHit) => void;
}

interface PitchVisualization {
  velocity: number;
  spinRate: number;
  verticalBreak: number;
  horizontalBreak: number;
  location: { x: number; y: number };
  result: string;
  stuffPlus?: number;
}

interface SessionMetrics {
  totalPitches: number;
  strikes: number;
  balls: number;
  swings: number;
  misses: number;
  avgVelocity: number;
  maxVelocity: number;
  avgSpinRate: number;
  fatigueIndex: number;
}

interface ChampionMetrics {
  clutchRating: number;
  consistencyScore: number;
  dominanceIndex: number;
  arsenalDiversity: number;
  tunnelEffectiveness: number;
}

// ============================================
// Main Component
// ============================================

const TrackmanLiveTracker: React.FC<TrackmanLiveTrackerProps> = ({
  playerId,
  gameId,
  sessionId,
  mode,
  enableChampionAnalysis = false,
  onPitchEvent,
  onHitEvent
}) => {
  // State Management
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [currentPitch, setCurrentPitch] = useState<TrackmanPitch | null>(null);
  const [currentHit, setCurrentHit] = useState<TrackmanHit | null>(null);
  const [recentPitches, setRecentPitches] = useState<TrackmanPitch[]>([]);
  const [recentHits, setRecentHits] = useState<TrackmanHit[]>([]);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    totalPitches: 0,
    strikes: 0,
    balls: 0,
    swings: 0,
    misses: 0,
    avgVelocity: 0,
    maxVelocity: 0,
    avgSpinRate: 0,
    fatigueIndex: 0
  });
  const [championMetrics, setChampionMetrics] = useState<ChampionMetrics>({
    clutchRating: 0,
    consistencyScore: 0,
    dominanceIndex: 0,
    arsenalDiversity: 0,
    tunnelEffectiveness: 0
  });
  const [alerts, setAlerts] = useState<Array<{ type: string; message: string; timestamp: Date }>>([]);

  // Refs
  const trackmanService = useRef<TrackmanBaseballService | null>(null);
  const championEngine = useRef<ChampionEnigmaEngine | null>(null);
  const strikeZoneCanvas = useRef<HTMLCanvasElement>(null);
  const releasePointCanvas = useRef<HTMLCanvasElement>(null);

  // ============================================
  // Service Initialization
  // ============================================

  useEffect(() => {
    const initializeServices = async () => {
      try {
        // Initialize Trackman service
        trackmanService.current = new TrackmanBaseballService({
          clientId: process.env.REACT_APP_TRACKMAN_CLIENT_ID!,
          clientSecret: process.env.REACT_APP_TRACKMAN_CLIENT_SECRET!,
          username: process.env.REACT_APP_TRACKMAN_USERNAME!,
          password: process.env.REACT_APP_TRACKMAN_PASSWORD!,
          systemType: 'V3',
          enableWebSocket: true,
          enableKafka: false
        });

        // Initialize Champion Engine if enabled
        if (enableChampionAnalysis) {
          championEngine.current = new ChampionEnigmaEngine();
        }

        // Set up event listeners
        setupEventListeners();

        // Wait for authentication
        trackmanService.current.on('authenticated', () => {
          setIsConnected(true);
          console.log('✅ Trackman connected');

          // Start streaming if game mode
          if (mode === 'game' && gameId && trackmanService.current) {
            trackmanService.current.streamGameData(gameId);
          }

          // Subscribe to player if specified
          if (playerId && trackmanService.current) {
            trackmanService.current.subscribeToPlayer(playerId);
          }
        });

      } catch (error) {
        console.error('Failed to initialize Trackman service:', error);
        addAlert('error', 'Failed to connect to Trackman');
      }
    };

    initializeServices();

    // Cleanup on unmount
    return () => {
      if (trackmanService.current) {
        trackmanService.current.disconnect();
      }
    };
  }, [mode, gameId, playerId, enableChampionAnalysis]);

  // ============================================
  // Event Handlers
  // ============================================

  const setupEventListeners = () => {
    if (!trackmanService.current) return;

    // Pitch events
    trackmanService.current.on('pitch', handlePitchEvent);
    trackmanService.current.on('hit', handleHitEvent);
    trackmanService.current.on('highVelocity', handleHighVelocity);
    trackmanService.current.on('highSpinRate', handleHighSpinRate);
    trackmanService.current.on('elitePitch', handleElitePitch);
    trackmanService.current.on('barrel', handleBarrel);
    trackmanService.current.on('crushed', handleCrushed);
    trackmanService.current.on('optimalContact', handleOptimalContact);

    // Session events
    trackmanService.current.on('sessionUpdate', handleSessionUpdate);
    trackmanService.current.on('sessionEnded', handleSessionEnd);

    // Connection events
    trackmanService.current.on('wsError', handleConnectionError);
    trackmanService.current.on('wsDisconnected', handleDisconnection);
  };

  const handlePitchEvent = async (pitch: TrackmanPitch) => {
    setCurrentPitch(pitch);
    setRecentPitches(prev => [pitch, ...prev].slice(0, 10));
    updateSessionMetrics(pitch);
    
    // Draw on strike zone
    if (strikeZoneCanvas.current) {
      drawPitchLocation(pitch);
    }

    // Champion analysis
    if (enableChampionAnalysis && championEngine.current) {
      await analyzeChampionMetrics(pitch);
    }

    // Callback
    if (onPitchEvent) {
      onPitchEvent(pitch);
    }
  };

  const handleHitEvent = (hit: TrackmanHit) => {
    setCurrentHit(hit);
    setRecentHits(prev => [hit, ...prev].slice(0, 10));
    
    if (onHitEvent) {
      onHitEvent(hit);
    }
  };

  const handleHighVelocity = (pitch: TrackmanPitch) => {
    addAlert('velocity', `🔥 ${pitch.releaseSpeed} mph heater!`);
  };

  const handleHighSpinRate = (pitch: TrackmanPitch) => {
    addAlert('spin', `🌪️ ${pitch.spinRate} rpm spin!`);
  };

  const handleElitePitch = (pitch: TrackmanPitch) => {
    addAlert('elite', `⭐ Elite pitch! Stuff+ ${pitch.stuffPlus}`);
  };

  const handleBarrel = (hit: TrackmanHit) => {
    addAlert('barrel', `💥 BARREL! ${hit.exitSpeed} mph at ${hit.launchAngle}°`);
  };

  const handleCrushed = (hit: TrackmanHit) => {
    addAlert('crushed', `🚀 CRUSHED! ${hit.exitSpeed} mph exit velo!`);
  };

  const handleOptimalContact = (hit: TrackmanHit) => {
    addAlert('optimal', `🎯 Perfect contact! ${hit.distance} ft`);
  };

  const handleSessionUpdate = (update: any) => {
    // Update session metrics
    if (update.summary) {
      setSessionMetrics(prev => ({
        ...prev,
        ...update.summary
      }));
    }
  };

  const handleSessionEnd = (session: any) => {
    setIsRecording(false);
    addAlert('info', `Session ended. ${session.totalPitches} pitches tracked.`);
  };

  const handleConnectionError = (error: Error) => {
    setIsConnected(false);
    addAlert('error', 'Connection error. Attempting to reconnect...');
  };

  const handleDisconnection = () => {
    setIsConnected(false);
  };

  // ============================================
  // Utility Functions
  // ============================================

  const updateSessionMetrics = (pitch: TrackmanPitch) => {
    setSessionMetrics(prev => {
      const newTotal = prev.totalPitches + 1;
      const newStrikes = prev.strikes + (pitch.pitchResult === 'strike' ? 1 : 0);
      const newBalls = prev.balls + (pitch.pitchResult === 'ball' ? 1 : 0);
      const newSwings = prev.swings + (pitch.swingMade ? 1 : 0);
      const newMisses = prev.misses + (pitch.swingMade && !pitch.contactMade ? 1 : 0);
      
      // Update averages
      const velocitySum = prev.avgVelocity * prev.totalPitches + pitch.releaseSpeed;
      const spinSum = prev.avgSpinRate * prev.totalPitches + pitch.spinRate;
      
      return {
        totalPitches: newTotal,
        strikes: newStrikes,
        balls: newBalls,
        swings: newSwings,
        misses: newMisses,
        avgVelocity: velocitySum / newTotal,
        maxVelocity: Math.max(prev.maxVelocity, pitch.releaseSpeed),
        avgSpinRate: spinSum / newTotal,
        fatigueIndex: calculateFatigue(recentPitches)
      };
    });
  };

  const analyzeChampionMetrics = async (pitch: TrackmanPitch) => {
    if (!championEngine.current) return;

    // Analyze pitch for champion qualities
    const analysis = await championEngine.current.analyzeAthlete(
      pitch.pitcherId || 'unknown',
      `Pitcher ${pitch.pitcherId}`,
      'baseball',
      undefined,
      {
        velocity: pitch.releaseSpeed,
        spinRate: pitch.spinRate,
        movement: {
          vertical: pitch.verticalMovement,
          horizontal: pitch.horizontalMovement
        },
        location: {
          height: pitch.plateHeight,
          side: pitch.plateSide
        },
        situation: {
          balls: pitch.balls,
          strikes: pitch.strikes,
          outs: pitch.outs
        }
      }
    );

    // Update champion metrics
    setChampionMetrics({
      clutchRating: analysis.dimensions.clutchGene || 0,
      consistencyScore: calculateConsistency(recentPitches),
      dominanceIndex: analysis.dimensions.killerInstinct || 0,
      arsenalDiversity: calculateArsenalDiversity(recentPitches),
      tunnelEffectiveness: analysis.championScore || 0
    });
  };

  const calculateFatigue = (pitches: TrackmanPitch[]): number => {
    if (pitches.length < 10) return 0;
    
    const recent5 = pitches.slice(0, 5);
    const earlier5 = pitches.slice(5, 10);
    
    const recentAvg = recent5.reduce((sum, p) => sum + p.releaseSpeed, 0) / 5;
    const earlierAvg = earlier5.reduce((sum, p) => sum + p.releaseSpeed, 0) / 5;
    
    const decline = earlierAvg - recentAvg;
    return Math.max(0, Math.min(100, decline * 20)); // Scale to 0-100
  };

  const calculateConsistency = (pitches: TrackmanPitch[]): number => {
    if (pitches.length < 5) return 0;
    
    // Calculate standard deviation of release points
    const releases = pitches.map(p => ({ height: p.releaseHeight, side: p.releaseSide }));
    const avgHeight = releases.reduce((sum, r) => sum + r.height, 0) / releases.length;
    const avgSide = releases.reduce((sum, r) => sum + r.side, 0) / releases.length;
    
    const variance = releases.reduce((sum, r) => {
      return sum + Math.pow(r.height - avgHeight, 2) + Math.pow(r.side - avgSide, 2);
    }, 0) / releases.length;
    
    const stdDev = Math.sqrt(variance);
    return Math.max(0, Math.min(100, 100 - stdDev * 50)); // Lower std dev = higher consistency
  };

  const calculateArsenalDiversity = (pitches: TrackmanPitch[]): number => {
    const pitchTypes = new Set(pitches.map(p => p.pitchType).filter(Boolean));
    return Math.min(100, pitchTypes.size * 20); // 5 pitch types = 100
  };

  const addAlert = (type: string, message: string) => {
    setAlerts(prev => [
      { type, message, timestamp: new Date() },
      ...prev
    ].slice(0, 5));
  };

  // ============================================
  // Canvas Drawing
  // ============================================

  const drawPitchLocation = (pitch: TrackmanPitch) => {
    const canvas = strikeZoneCanvas.current;
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Map plate coordinates to canvas
    const x = (pitch.plateSide + 1.5) * (canvas.width / 3); // -1.5 to 1.5 feet
    const y = canvas.height - (pitch.plateHeight * (canvas.height / 4)); // 0 to 4 feet

    // Draw pitch dot
    ctx.beginPath();
    ctx.arc(x, y, 5, 0, 2 * Math.PI);
    
    // Color based on result
    if (pitch.pitchResult === 'strike') {
      ctx.fillStyle = '#22c55e'; // Green
    } else if (pitch.pitchResult === 'ball') {
      ctx.fillStyle = '#ef4444'; // Red
    } else if (pitch.pitchResult === 'hit') {
      ctx.fillStyle = '#3b82f6'; // Blue
    } else {
      ctx.fillStyle = '#6b7280'; // Gray
    }
    
    ctx.fill();
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    ctx.stroke();
  };

  // ============================================
  // Session Controls
  // ============================================

  const startSession = async () => {
    if (!trackmanService.current || !playerId) return;

    try {
      const session = await trackmanService.current.startSession(
        playerId,
        mode === 'bullpen' ? 'bullpen' : 'batting_practice'
      );
      
      setIsRecording(true);
      addAlert('info', `Session started: ${session.sessionId}`);
    } catch (error) {
      console.error('Failed to start session:', error);
      addAlert('error', 'Failed to start session');
    }
  };

  const endSession = async () => {
    if (!trackmanService.current || !sessionId) return;

    try {
      const summary = await trackmanService.current.endSession(sessionId);
      setIsRecording(false);
      addAlert('info', `Session ended. ${summary.totalPitches} pitches recorded.`);
    } catch (error) {
      console.error('Failed to end session:', error);
      addAlert('error', 'Failed to end session');
    }
  };

  // ============================================
  // Render
  // ============================================

  return (
    <div className="trackman-live-tracker">
      {/* Header */}
      <div className="tracker-header">
        <h2>Trackman Live Tracker</h2>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`} />
          {isConnected ? 'Connected' : 'Disconnected'}
        </div>
      </div>

      {/* Session Controls */}
      {mode !== 'game' && (
        <div className="session-controls">
          {!isRecording ? (
            <button onClick={startSession} className="btn-primary">
              Start {mode === 'bullpen' ? 'Bullpen' : 'BP'} Session
            </button>
          ) : (
            <>
              <div className="recording-indicator">
                <span className="recording-dot" />
                Recording Session
              </div>
              <button onClick={endSession} className="btn-danger">
                End Session
              </button>
            </>
          )}
        </div>
      )}

      {/* Main Display */}
      <div className="tracker-main">
        {/* Current Pitch Display */}
        <div className="current-pitch-display">
          {currentPitch ? (
            <>
              <div className="pitch-velocity">
                <span className="metric-value">{currentPitch.releaseSpeed}</span>
                <span className="metric-label">mph</span>
              </div>
              <div className="pitch-metrics">
                <div className="metric">
                  <span className="label">Spin</span>
                  <span className="value">{currentPitch.spinRate} rpm</span>
                </div>
                <div className="metric">
                  <span className="label">V-Break</span>
                  <span className="value">{currentPitch.verticalMovement}"</span>
                </div>
                <div className="metric">
                  <span className="label">H-Break</span>
                  <span className="value">{currentPitch.horizontalMovement}"</span>
                </div>
              </div>
              {currentPitch.stuffPlus && (
                <div className="stuff-plus">
                  Stuff+ <span className="value">{currentPitch.stuffPlus}</span>
                </div>
              )}
            </>
          ) : (
            <div className="no-data">Waiting for pitch data...</div>
          )}
        </div>

        {/* Strike Zone Visualization */}
        <div className="strike-zone-container">
          <canvas
            ref={strikeZoneCanvas}
            width={300}
            height={400}
            className="strike-zone-canvas"
          />
          <div className="zone-label">Strike Zone</div>
        </div>

        {/* Session Metrics */}
        <div className="session-metrics">
          <h3>Session Metrics</h3>
          <div className="metrics-grid">
            <div className="metric-card">
              <span className="label">Total Pitches</span>
              <span className="value">{sessionMetrics.totalPitches}</span>
            </div>
            <div className="metric-card">
              <span className="label">Strike %</span>
              <span className="value">
                {sessionMetrics.totalPitches > 0
                  ? ((sessionMetrics.strikes / sessionMetrics.totalPitches) * 100).toFixed(1)
                  : '0'}%
              </span>
            </div>
            <div className="metric-card">
              <span className="label">Avg Velocity</span>
              <span className="value">{sessionMetrics.avgVelocity.toFixed(1)} mph</span>
            </div>
            <div className="metric-card">
              <span className="label">Max Velocity</span>
              <span className="value">{sessionMetrics.maxVelocity} mph</span>
            </div>
            <div className="metric-card">
              <span className="label">Avg Spin</span>
              <span className="value">{sessionMetrics.avgSpinRate.toFixed(0)} rpm</span>
            </div>
            <div className="metric-card">
              <span className="label">Fatigue Index</span>
              <span className="value" style={{
                color: sessionMetrics.fatigueIndex > 50 ? '#ef4444' : '#22c55e'
              }}>
                {sessionMetrics.fatigueIndex.toFixed(0)}
              </span>
            </div>
          </div>
        </div>

        {/* Champion Metrics (if enabled) */}
        {enableChampionAnalysis && (
          <div className="champion-metrics">
            <h3>Champion Analysis</h3>
            <div className="champion-grid">
              <div className="champion-metric">
                <span className="label">Clutch Rating</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${championMetrics.clutchRating}%` }}
                  />
                </div>
              </div>
              <div className="champion-metric">
                <span className="label">Consistency</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${championMetrics.consistencyScore}%` }}
                  />
                </div>
              </div>
              <div className="champion-metric">
                <span className="label">Dominance</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${championMetrics.dominanceIndex}%` }}
                  />
                </div>
              </div>
              <div className="champion-metric">
                <span className="label">Arsenal Diversity</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${championMetrics.arsenalDiversity}%` }}
                  />
                </div>
              </div>
              <div className="champion-metric">
                <span className="label">Tunnel Effect</span>
                <div className="progress-bar">
                  <div 
                    className="progress-fill"
                    style={{ width: `${championMetrics.tunnelEffectiveness}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Recent Hits (if batting practice) */}
        {mode === 'batting_practice' && currentHit && (
          <div className="current-hit-display">
            <h3>Last Contact</h3>
            <div className="hit-metrics">
              <div className="metric">
                <span className="label">Exit Velo</span>
                <span className="value">{currentHit.exitSpeed} mph</span>
              </div>
              <div className="metric">
                <span className="label">Launch Angle</span>
                <span className="value">{currentHit.launchAngle}°</span>
              </div>
              <div className="metric">
                <span className="label">Distance</span>
                <span className="value">{currentHit.distance} ft</span>
              </div>
              {currentHit.barrelClassification && (
                <div className="barrel-badge">
                  {currentHit.barrelClassification.toUpperCase()}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Alerts */}
        <div className="alerts-container">
          {alerts.map((alert, index) => (
            <div key={index} className={`alert alert-${alert.type}`}>
              <span className="alert-message">{alert.message}</span>
              <span className="alert-time">
                {new Date(alert.timestamp).toLocaleTimeString()}
              </span>
            </div>
          ))}
        </div>

        {/* Recent Pitches Table */}
        <div className="recent-pitches">
          <h3>Recent Pitches</h3>
          <table className="pitches-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Type</th>
                <th>Velo</th>
                <th>Spin</th>
                <th>V-Break</th>
                <th>H-Break</th>
                <th>Result</th>
              </tr>
            </thead>
            <tbody>
              {recentPitches.map((pitch, index) => (
                <tr key={pitch.pitchId}>
                  <td>{recentPitches.length - index}</td>
                  <td>{pitch.pitchType || '-'}</td>
                  <td>{pitch.releaseSpeed}</td>
                  <td>{pitch.spinRate}</td>
                  <td>{pitch.verticalMovement.toFixed(1)}</td>
                  <td>{pitch.horizontalMovement.toFixed(1)}</td>
                  <td className={`result-${pitch.pitchResult}`}>
                    {pitch.pitchResult}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default TrackmanLiveTracker;