/**
 * Blaze Intelligence - Video Analysis Interface
 * Where Heritage Meets Algorithmic Excellence
 */

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BLAZE_CONFIG, SportType } from './config';
import BlazeVideoAnalyzer from './analyzer';
import type { 
  BiomechanicalFrame, 
  PerformanceMetrics, 
  ActionableInsight 
} from './types';

interface VideoAnalysisProps {
  sport: SportType;
  athleteId: string;
  teamId?: string;
}

export const VideoAnalysisInterface: React.FC<VideoAnalysisProps> = ({
  sport,
  athleteId,
  teamId,
}) => {
  // State management
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFrame, setCurrentFrame] = useState(0);
  const [analysisResults, setAnalysisResults] = useState<{
    frames: BiomechanicalFrame[];
    metrics: PerformanceMetrics;
    insights: ActionableInsight[];
    confidence: number;
  } | null>(null);
  const [selectedInsight, setSelectedInsight] = useState<ActionableInsight | null>(null);
  const [comparisonMode, setComparisonMode] = useState(false);
  const [overlayOpacity, setOverlayOpacity] = useState(0.5);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);
  const analyzer = useRef<BlazeVideoAnalyzer | null>(null);
  
  // Initialize analyzer on mount
  useEffect(() => {
    analyzer.current = new BlazeVideoAnalyzer(sport);
  }, [sport]);
  
  // Handle video upload
  const handleVideoUpload = useCallback(async (file: File) => {
    setVideoFile(file);
    const url = URL.createObjectURL(file);
    if (videoRef.current) {
      videoRef.current.src = url;
    }
  }, []);
  
  // Process video for analysis
  const processVideo = useCallback(async () => {
    if (!videoFile || !analyzer.current) return;
    
    setIsAnalyzing(true);
    
    try {
      const buffer = await videoFile.arrayBuffer();
      const results = await analyzer.current.analyzeVideo(buffer, {
        frameRate: 120,
        confidenceThreshold: 0.92,
        compareToElite: true,
      });
      
      setAnalysisResults(results);
      
      // Draw initial overlays
      if (results.frames.length > 0) {
        drawFrameOverlay(results.frames[0]);
      }
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  }, [videoFile]);
  
  // Draw biomechanical overlays on canvas
  const drawFrameOverlay = useCallback((frame: BiomechanicalFrame) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw pose skeleton with burnt orange
    ctx.strokeStyle = BLAZE_CONFIG.brand.colors.primary.texasLegacy;
    ctx.lineWidth = 2;
    
    // Draw pose connections
    if (frame.pose && frame.pose.connections) {
      frame.pose.connections.forEach((connection: [number, number]) => {
        const [start, end] = connection;
        const startPoint = frame.pose.keypoints[start];
        const endPoint = frame.pose.keypoints[end];
        
        if (startPoint && endPoint) {
          ctx.beginPath();
          ctx.moveTo(startPoint.x * canvas.width, startPoint.y * canvas.height);
          ctx.lineTo(endPoint.x * canvas.width, endPoint.y * canvas.height);
          ctx.stroke();
        }
      });
    }
    
    // Draw force vectors in cardinal blue
    ctx.strokeStyle = BLAZE_CONFIG.brand.colors.primary.cardinalClarity;
    ctx.lineWidth = 3;
    
    if (frame.forces && frame.forces.vectors) {
      frame.forces.vectors.forEach((vector: any) => {
        ctx.beginPath();
        ctx.moveTo(vector.origin.x * canvas.width, vector.origin.y * canvas.height);
        ctx.lineTo(
          vector.origin.x * canvas.width + vector.magnitude * Math.cos(vector.angle),
          vector.origin.y * canvas.height + vector.magnitude * Math.sin(vector.angle)
        );
        ctx.stroke();
        
        // Draw arrowhead
        ctx.save();
        ctx.translate(
          vector.origin.x * canvas.width + vector.magnitude * Math.cos(vector.angle),
          vector.origin.y * canvas.height + vector.magnitude * Math.sin(vector.angle)
        );
        ctx.rotate(vector.angle);
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-10, -5);
        ctx.lineTo(-10, 5);
        ctx.closePath();
        ctx.fill();
        ctx.restore();
      });
    }
    
    // Draw critical angles
    ctx.fillStyle = BLAZE_CONFIG.brand.colors.secondary.grizzlyTeal;
    ctx.font = '14px JetBrains Mono';
    
    if (frame.angles) {
      Object.entries(frame.angles).forEach(([angleName, angleValue]: [string, any]) => {
        if (angleValue.position) {
          ctx.fillText(
            `${angleValue.degrees.toFixed(1)}°`,
            angleValue.position.x * canvas.width,
            angleValue.position.y * canvas.height
          );
        }
      });
    }
  }, []);
  
  // Timeline scrubbing
  const handleTimelineSeek = useCallback((event: React.MouseEvent<HTMLDivElement>) => {
    if (!timelineRef.current || !videoRef.current || !analysisResults) return;
    
    const rect = timelineRef.current.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const percentage = x / rect.width;
    const frameIndex = Math.floor(percentage * analysisResults.frames.length);
    
    setCurrentFrame(frameIndex);
    drawFrameOverlay(analysisResults.frames[frameIndex]);
    
    // Sync video playback
    const video = videoRef.current;
    video.currentTime = (frameIndex / analysisResults.frames.length) * video.duration;
  }, [analysisResults, drawFrameOverlay]);
  
  return (
    <div className="blaze-video-analysis" style={{
      backgroundColor: BLAZE_CONFIG.brand.colors.supporting.graphite,
      minHeight: '100vh',
      fontFamily: BLAZE_CONFIG.brand.typography.secondary,
    }}>
      {/* Navigation Bar */}
      <nav style={{
        backgroundColor: BLAZE_CONFIG.brand.colors.secondary.oilerNavy,
        padding: '1rem 2rem',
        borderBottom: `1px solid ${BLAZE_CONFIG.brand.colors.primary.texasLegacy}`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h1 style={{
            fontFamily: BLAZE_CONFIG.brand.typography.primary,
            fontSize: '24px',
            fontWeight: 'bold',
            color: BLAZE_CONFIG.brand.colors.primary.texasLegacy,
            margin: 0,
          }}>
            BLAZE INTELLIGENCE
          </h1>
          <div style={{ display: 'flex', gap: '1rem' }}>
            {Object.keys(BLAZE_CONFIG.sports).map((sportKey) => (
              <button
                key={sportKey}
                onClick={() => window.location.href = `?sport=${sportKey}`}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: sport === sportKey 
                    ? BLAZE_CONFIG.brand.colors.primary.texasLegacy
                    : 'transparent',
                  color: sport === sportKey
                    ? 'white'
                    : BLAZE_CONFIG.brand.colors.primary.cardinalClarity,
                  border: `1px solid ${BLAZE_CONFIG.brand.colors.primary.cardinalClarity}`,
                  borderRadius: '4px',
                  fontFamily: BLAZE_CONFIG.brand.typography.secondary,
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                {BLAZE_CONFIG.sports[sportKey as SportType].displayName}
              </button>
            ))}
          </div>
        </div>
      </nav>
      
      {/* Main Content Area */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '2fr 1fr',
        gap: '1rem',
        padding: '1rem',
        maxWidth: '1920px',
        margin: '0 auto',
      }}>
        {/* Video Player Section */}
        <div style={{
          backgroundColor: BLAZE_CONFIG.brand.colors.supporting.graphite,
          borderRadius: '8px',
          overflow: 'hidden',
          position: 'relative',
        }}>
          <div style={{ position: 'relative', paddingBottom: '56.25%' }}>
            <video
              ref={videoRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                backgroundColor: 'black',
              }}
              controls={false}
            />
            <canvas
              ref={canvasRef}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
                opacity: overlayOpacity,
              }}
            />
            
            {/* Upload Overlay */}
            {!videoFile && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
              }}>
                <label style={{
                  padding: '2rem 4rem',
                  backgroundColor: BLAZE_CONFIG.brand.colors.primary.texasLegacy,
                  color: 'white',
                  borderRadius: '8px',
                  fontFamily: BLAZE_CONFIG.brand.typography.primary,
                  fontSize: '18px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 400ms cubic-bezier(0.4, 0, 0.2, 1)',
                }}>
                  Upload Video for Analysis
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => e.target.files?.[0] && handleVideoUpload(e.target.files[0])}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}
            
            {/* Analysis Loading */}
            {isAnalyzing && (
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: 'rgba(0, 0, 0, 0.9)',
              }}>
                <div style={{ textAlign: 'center' }}>
                  <div className="loading-spinner" style={{
                    width: '60px',
                    height: '60px',
                    border: `4px solid ${BLAZE_CONFIG.brand.colors.supporting.platinum}`,
                    borderTop: `4px solid ${BLAZE_CONFIG.brand.colors.primary.texasLegacy}`,
                    borderRadius: '50%',
                    animation: 'spin 1s linear infinite',
                    margin: '0 auto 1rem',
                  }} />
                  <p style={{
                    color: BLAZE_CONFIG.brand.colors.primary.cardinalClarity,
                    fontFamily: BLAZE_CONFIG.brand.typography.technical,
                    fontSize: '14px',
                  }}>
                    Analyzing Biomechanics...
                  </p>
                </div>
              </div>
            )}
          </div>
          
          {/* Timeline Controls */}
          <div
            ref={timelineRef}
            onClick={handleTimelineSeek}
            style={{
              height: '60px',
              backgroundColor: BLAZE_CONFIG.brand.colors.supporting.pearl,
              borderTop: `1px solid ${BLAZE_CONFIG.brand.colors.primary.texasLegacy}`,
              position: 'relative',
              cursor: 'pointer',
            }}
          >
            {analysisResults && (
              <div style={{
                position: 'absolute',
                top: '20px',
                left: 0,
                right: 0,
                height: '20px',
                backgroundColor: BLAZE_CONFIG.brand.colors.supporting.platinum,
                borderRadius: '2px',
              }}>
                {/* Performance heat map */}
                {analysisResults.frames.map((frame, index) => (
                  <div
                    key={index}
                    style={{
                      position: 'absolute',
                      left: `${(index / analysisResults.frames.length) * 100}%`,
                      width: `${100 / analysisResults.frames.length}%`,
                      height: '100%',
                      backgroundColor: frame.confidence > 0.9
                        ? BLAZE_CONFIG.brand.colors.primary.texasLegacy
                        : frame.confidence > 0.8
                        ? BLAZE_CONFIG.brand.colors.primary.cardinalClarity
                        : BLAZE_CONFIG.brand.colors.secondary.grizzlyTeal,
                      opacity: 0.6,
                    }}
                  />
                ))}
                
                {/* Current position indicator */}
                <div style={{
                  position: 'absolute',
                  left: `${(currentFrame / (analysisResults.frames.length || 1)) * 100}%`,
                  top: '-5px',
                  width: '2px',
                  height: '30px',
                  backgroundColor: BLAZE_CONFIG.brand.colors.primary.texasLegacy,
                  boxShadow: '0 0 10px rgba(191, 87, 0, 0.5)',
                }}/>
              </div>
            )}
          </div>
          
          {/* Video Controls */}
          <div style={{
            padding: '1rem',
            backgroundColor: BLAZE_CONFIG.brand.colors.secondary.oilerNavy,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}>
            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => videoRef.current?.play()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: BLAZE_CONFIG.brand.colors.primary.texasLegacy,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Play
              </button>
              <button
                onClick={() => videoRef.current?.pause()}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: BLAZE_CONFIG.brand.colors.secondary.grizzlyTeal,
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Pause
              </button>
              <button
                onClick={processVideo}
                disabled={!videoFile || isAnalyzing}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: videoFile && !isAnalyzing
                    ? BLAZE_CONFIG.brand.colors.primary.cardinalClarity
                    : BLAZE_CONFIG.brand.colors.supporting.platinum,
                  color: videoFile && !isAnalyzing ? 'black' : 'gray',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: videoFile && !isAnalyzing ? 'pointer' : 'not-allowed',
                }}
              >
                Analyze
              </button>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <label style={{ color: 'white', fontSize: '14px' }}>
                Overlay Opacity:
              </label>
              <input
                type="range"
                min="0"
                max="100"
                value={overlayOpacity * 100}
                onChange={(e) => setOverlayOpacity(Number(e.target.value) / 100)}
                style={{ width: '100px' }}
              />
              <button
                onClick={() => setComparisonMode(!comparisonMode)}
                style={{
                  padding: '0.5rem 1rem',
                  backgroundColor: comparisonMode
                    ? BLAZE_CONFIG.brand.colors.primary.texasLegacy
                    : 'transparent',
                  color: comparisonMode ? 'white' : BLAZE_CONFIG.brand.colors.primary.cardinalClarity,
                  border: `1px solid ${BLAZE_CONFIG.brand.colors.primary.cardinalClarity}`,
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Comparison Mode
              </button>
            </div>
          </div>
        </div>
        
        {/* Intelligence Panel */}
        <div style={{
          backgroundColor: BLAZE_CONFIG.brand.colors.supporting.platinum,
          borderRadius: '8px',
          padding: '1.5rem',
          overflowY: 'auto',
          maxHeight: 'calc(100vh - 120px)',
        }}>
          <h2 style={{
            fontFamily: BLAZE_CONFIG.brand.typography.primary,
            fontSize: '20px',
            fontWeight: 'bold',
            color: BLAZE_CONFIG.brand.colors.secondary.oilerNavy,
            marginBottom: '1rem',
          }}>
            Biomechanical Intelligence
          </h2>
          
          {analysisResults && (
            <>
              {/* Confidence Score */}
              <div style={{
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                marginBottom: '1rem',
                borderLeft: `4px solid ${BLAZE_CONFIG.brand.colors.primary.texasLegacy}`,
              }}>
                <h3 style={{
                  fontSize: '14px',
                  color: BLAZE_CONFIG.brand.colors.secondary.oilerNavy,
                  marginBottom: '0.5rem',
                }}>
                  Analysis Confidence
                </h3>
                <div style={{
                  fontSize: '32px',
                  fontFamily: BLAZE_CONFIG.brand.typography.technical,
                  fontWeight: 'bold',
                  color: analysisResults.confidence > 0.9
                    ? BLAZE_CONFIG.brand.colors.primary.texasLegacy
                    : analysisResults.confidence > 0.8
                    ? BLAZE_CONFIG.brand.colors.secondary.grizzlyTeal
                    : BLAZE_CONFIG.brand.colors.secondary.oilerNavy,
                }}>
                  {(analysisResults.confidence * 100).toFixed(1)}%
                </div>
              </div>
              
              {/* Key Metrics */}
              <div style={{
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '8px',
                marginBottom: '1rem',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: BLAZE_CONFIG.brand.colors.secondary.oilerNavy,
                  marginBottom: '1rem',
                }}>
                  Performance Metrics
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {Object.entries(analysisResults.metrics.values).map(([category, metrics]) => (
                    <div key={category}>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: BLAZE_CONFIG.brand.colors.primary.texasLegacy,
                        marginBottom: '0.5rem',
                        textTransform: 'capitalize',
                      }}>
                        {category}
                      </h4>
                      <div style={{ paddingLeft: '1rem' }}>
                        {Object.entries(metrics as any).map(([metric, value]) => (
                          <div
                            key={metric}
                            style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              padding: '0.25rem 0',
                              fontSize: '13px',
                            }}
                          >
                            <span style={{ color: BLAZE_CONFIG.brand.colors.supporting.graphite }}>
                              {metric.replace(/([A-Z])/g, ' $1').trim()}:
                            </span>
                            <span style={{
                              fontFamily: BLAZE_CONFIG.brand.typography.technical,
                              fontWeight: 'bold',
                              color: BLAZE_CONFIG.brand.colors.secondary.oilerNavy,
                            }}>
                              {typeof value === 'number' ? value.toFixed(2) : value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Actionable Insights */}
              <div style={{
                padding: '1rem',
                backgroundColor: 'white',
                borderRadius: '8px',
              }}>
                <h3 style={{
                  fontSize: '16px',
                  fontWeight: 'bold',
                  color: BLAZE_CONFIG.brand.colors.secondary.oilerNavy,
                  marginBottom: '1rem',
                }}>
                  Actionable Insights
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {analysisResults.insights.map((insight, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      onClick={() => setSelectedInsight(insight)}
                      style={{
                        padding: '0.75rem',
                        backgroundColor: selectedInsight === insight
                          ? BLAZE_CONFIG.brand.colors.primary.cardinalClarity + '20'
                          : BLAZE_CONFIG.brand.colors.supporting.pearl,
                        borderRadius: '6px',
                        cursor: 'pointer',
                        borderLeft: `3px solid ${
                          insight.priority === 'HIGH'
                            ? BLAZE_CONFIG.brand.colors.primary.texasLegacy
                            : insight.priority === 'MEDIUM'
                            ? BLAZE_CONFIG.brand.colors.secondary.grizzlyTeal
                            : BLAZE_CONFIG.brand.colors.supporting.platinum
                        }`,
                      }}
                    >
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        marginBottom: '0.5rem',
                      }}>
                        <span style={{
                          fontSize: '12px',
                          fontWeight: 'bold',
                          color: insight.priority === 'HIGH'
                            ? BLAZE_CONFIG.brand.colors.primary.texasLegacy
                            : insight.priority === 'MEDIUM'
                            ? BLAZE_CONFIG.brand.colors.secondary.grizzlyTeal
                            : BLAZE_CONFIG.brand.colors.supporting.graphite,
                        }}>
                          {insight.priority}
                        </span>
                        <span style={{
                          fontSize: '11px',
                          fontFamily: BLAZE_CONFIG.brand.typography.technical,
                          color: BLAZE_CONFIG.brand.colors.supporting.graphite,
                        }}>
                          {insight.confidenceScore.toFixed(0)}% confidence
                        </span>
                      </div>
                      <h4 style={{
                        fontSize: '14px',
                        fontWeight: '600',
                        color: BLAZE_CONFIG.brand.colors.secondary.oilerNavy,
                        marginBottom: '0.25rem',
                      }}>
                        {insight.title}
                      </h4>
                      <p style={{
                        fontSize: '12px',
                        color: BLAZE_CONFIG.brand.colors.supporting.graphite,
                        lineHeight: '1.4',
                      }}>
                        {insight.description}
                      </p>
                      {selectedInsight === insight && (
                        <AnimatePresence>
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            style={{ marginTop: '0.75rem' }}
                          >
                            <div style={{
                              padding: '0.75rem',
                              backgroundColor: 'white',
                              borderRadius: '4px',
                            }}>
                              <p style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: BLAZE_CONFIG.brand.colors.primary.texasLegacy,
                                marginBottom: '0.5rem',
                              }}>
                                Correction:
                              </p>
                              <p style={{
                                fontSize: '12px',
                                color: BLAZE_CONFIG.brand.colors.supporting.graphite,
                                marginBottom: '0.75rem',
                              }}>
                                {insight.correction}
                              </p>
                              <p style={{
                                fontSize: '12px',
                                fontWeight: '600',
                                color: BLAZE_CONFIG.brand.colors.secondary.grizzlyTeal,
                                marginBottom: '0.5rem',
                              }}>
                                Recommended Drills:
                              </p>
                              <ul style={{
                                fontSize: '12px',
                                color: BLAZE_CONFIG.brand.colors.supporting.graphite,
                                paddingLeft: '1.5rem',
                                marginBottom: '0.5rem',
                              }}>
                                {insight.drills.map((drill, idx) => (
                                  <li key={idx}>{drill}</li>
                                ))}
                              </ul>
                              <p style={{
                                fontSize: '11px',
                                fontFamily: BLAZE_CONFIG.brand.typography.technical,
                                color: BLAZE_CONFIG.brand.colors.supporting.graphite,
                                marginTop: '0.5rem',
                              }}>
                                Estimated improvement timeline: {insight.timelineWeeks} weeks
                              </p>
                            </div>
                          </motion.div>
                        </AnimatePresence>
                      )}
                    </motion.div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default VideoAnalysisInterface;
