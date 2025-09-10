/**
 * Camera Screen - Video Recording and Real-time Analysis
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Alert,
  Dimensions,
  Platform,
  ActivityIndicator
} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner,
  VideoFile
} from 'react-native-vision-camera';
import Icon from 'react-native-vector-icons/MaterialIcons';
import RNFS from 'react-native-fs';
import LinearGradient from 'react-native-linear-gradient';
import { VideoAnalysisService } from '../services/VideoAnalysisService';

const { width, height } = Dimensions.get('window');

const COLORS = {
  primary: '#BF5700',
  secondary: '#FF8C00',
  cardinalBlue: '#9BCBEB',
  dark: '#0d0d0d',
  darkGray: '#1a1a1a',
  lightGray: '#999',
  white: '#ffffff',
  success: '#00ff00',
  warning: '#ffaa00',
  error: '#ff0000'
};

interface MetricsOverlay {
  formScore: number;
  confidence: number;
  focus: number;
  energy: number;
}

export default function CameraScreen({ navigation }: any) {
  const camera = useRef<Camera>(null);
  const device = useCameraDevice('back');
  const { hasPermission, requestPermission } = useCameraPermission();
  
  const [isRecording, setIsRecording] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentSport, setCurrentSport] = useState('baseball');
  const [showMetrics, setShowMetrics] = useState(false);
  const [metrics, setMetrics] = useState<MetricsOverlay>({
    formScore: 0,
    confidence: 0,
    focus: 0,
    energy: 0
  });
  
  const recordingTimer = useRef<NodeJS.Timeout | null>(null);
  const videoAnalysisService = useRef(new VideoAnalysisService());

  useEffect(() => {
    requestCameraPermission();
    
    return () => {
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
      }
    };
  }, []);

  const requestCameraPermission = async () => {
    if (!hasPermission) {
      const granted = await requestPermission();
      if (!granted) {
        Alert.alert(
          'Camera Permission',
          'Camera access is required for video analysis',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    }
  };

  const startRecording = async () => {
    if (!camera.current) return;
    
    try {
      setIsRecording(true);
      setRecordingTime(0);
      
      // Start recording timer
      recordingTimer.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      // Start video recording
      const video = await camera.current.startRecording({
        onRecordingFinished: (video: VideoFile) => {
          console.log('Recording finished:', video.path);
          processVideo(video);
        },
        onRecordingError: (error: any) => {
          console.error('Recording error:', error);
          Alert.alert('Recording Error', 'Failed to record video');
        }
      });
      
      // Start real-time analysis simulation
      startRealtimeAnalysis();
      
    } catch (error) {
      console.error('Start recording error:', error);
      Alert.alert('Error', 'Failed to start recording');
      setIsRecording(false);
    }
  };

  const stopRecording = async () => {
    if (!camera.current || !isRecording) return;
    
    try {
      await camera.current.stopRecording();
      setIsRecording(false);
      
      if (recordingTimer.current) {
        clearInterval(recordingTimer.current);
        recordingTimer.current = null;
      }
    } catch (error) {
      console.error('Stop recording error:', error);
    }
  };

  const startRealtimeAnalysis = () => {
    setShowMetrics(true);
    
    // Simulate real-time metrics updates
    const analysisInterval = setInterval(() => {
      if (!isRecording) {
        clearInterval(analysisInterval);
        return;
      }
      
      setMetrics({
        formScore: Math.floor(70 + Math.random() * 30),
        confidence: Math.floor(60 + Math.random() * 40),
        focus: Math.floor(65 + Math.random() * 35),
        energy: Math.floor(55 + Math.random() * 45)
      });
    }, 2000);
  };

  const processVideo = async (video: VideoFile) => {
    setIsAnalyzing(true);
    
    try {
      // Upload video for analysis
      const analysisResult = await videoAnalysisService.current.analyzeVideo(
        video.path,
        currentSport
      );
      
      // Navigate to results screen
      navigation.navigate('Analysis', {
        videoPath: video.path,
        duration: recordingTime,
        sport: currentSport,
        analysis: analysisResult
      });
      
    } catch (error) {
      console.error('Video processing error:', error);
      Alert.alert('Analysis Error', 'Failed to analyze video');
    } finally {
      setIsAnalyzing(false);
      setShowMetrics(false);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const switchCamera = () => {
    // Camera switching logic would go here
    Alert.alert('Info', 'Camera switching not implemented in demo');
  };

  const changeSport = () => {
    const sports = ['baseball', 'football', 'basketball'];
    const currentIndex = sports.indexOf(currentSport);
    const nextIndex = (currentIndex + 1) % sports.length;
    setCurrentSport(sports[nextIndex]);
  };

  if (!hasPermission) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.permissionText}>Requesting camera permission...</Text>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!device) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.permissionText}>No camera device found</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Camera
        ref={camera}
        style={StyleSheet.absoluteFill}
        device={device}
        isActive={true}
        video={true}
        audio={true}
      />
      
      {/* Top Controls */}
      <View style={styles.topControls}>
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="close" size={30} color={COLORS.white} />
        </TouchableOpacity>
        
        <View style={styles.sportSelector}>
          <TouchableOpacity onPress={changeSport}>
            <Text style={styles.sportText}>{currentSport.toUpperCase()}</Text>
          </TouchableOpacity>
        </View>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={switchCamera}
        >
          <Icon name="flip-camera-ios" size={30} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      {/* Recording Timer */}
      {isRecording && (
        <View style={styles.recordingTimer}>
          <View style={styles.recordingDot} />
          <Text style={styles.timerText}>{formatTime(recordingTime)}</Text>
        </View>
      )}
      
      {/* Metrics Overlay */}
      {showMetrics && (
        <View style={styles.metricsOverlay}>
          <Text style={styles.metricsTitle}>Live Analysis</Text>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Form Score:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(metrics.formScore) }]}>
              {metrics.formScore}%
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Confidence:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(metrics.confidence) }]}>
              {metrics.confidence}%
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Focus:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(metrics.focus) }]}>
              {metrics.focus}%
            </Text>
          </View>
          
          <View style={styles.metricRow}>
            <Text style={styles.metricLabel}>Energy:</Text>
            <Text style={[styles.metricValue, { color: getScoreColor(metrics.energy) }]}>
              {metrics.energy}%
            </Text>
          </View>
        </View>
      )}
      
      {/* Bottom Controls */}
      <View style={styles.bottomControls}>
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => Alert.alert('Info', 'Upload feature coming soon')}
        >
          <Icon name="photo-library" size={30} color={COLORS.white} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.recordButton, isRecording && styles.recordButtonActive]}
          onPress={isRecording ? stopRecording : startRecording}
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <ActivityIndicator size="large" color={COLORS.white} />
          ) : (
            <View style={[styles.recordButtonInner, isRecording && styles.recordButtonInnerActive]} />
          )}
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => setShowMetrics(!showMetrics)}
        >
          <Icon name="analytics" size={30} color={COLORS.white} />
        </TouchableOpacity>
      </View>
      
      {/* Analysis Loading Overlay */}
      {isAnalyzing && (
        <View style={styles.analyzingOverlay}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.analyzingText}>Analyzing Video...</Text>
          <Text style={styles.analyzingSubtext}>
            Processing with ChatGPT 5, Claude Opus 4.1, Gemini 2.5 Pro
          </Text>
        </View>
      )}
    </View>
  );
}

function getScoreColor(score: number): string {
  if (score >= 80) return COLORS.success;
  if (score >= 60) return COLORS.warning;
  return COLORS.error;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  permissionText: {
    color: COLORS.white,
    fontSize: 16,
    marginBottom: 20,
  },
  topControls: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    zIndex: 100,
  },
  controlButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sportSelector: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  sportText: {
    color: COLORS.white,
    fontWeight: 'bold',
    fontSize: 14,
  },
  recordingTimer: {
    position: 'absolute',
    top: 120,
    alignSelf: 'center',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  recordingDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.error,
    marginRight: 10,
  },
  timerText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  metricsOverlay: {
    position: 'absolute',
    left: 20,
    top: 180,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 15,
    borderRadius: 12,
    minWidth: 200,
  },
  metricsTitle: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  metricRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  metricLabel: {
    color: COLORS.lightGray,
    fontSize: 14,
  },
  metricValue: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  bottomControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingHorizontal: 50,
  },
  secondaryButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.white,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordButtonActive: {
    backgroundColor: COLORS.error,
  },
  recordButtonInner: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: COLORS.error,
  },
  recordButtonInnerActive: {
    width: 30,
    height: 30,
    borderRadius: 5,
    backgroundColor: COLORS.white,
  },
  analyzingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  analyzingText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 20,
  },
  analyzingSubtext: {
    color: COLORS.lightGray,
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
});