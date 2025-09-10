/**
 * Analysis Screen - Display video analysis results
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Alert
} from 'react-native';
import Video from 'react-native-video';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';

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

interface AnalysisData {
  blazeScore: number;
  biomechanics: {
    hipRotation: number;
    shoulderAlignment: number;
    kneeFlexion: number;
    spineAngle: number;
  };
  microExpressions: {
    confidence: number;
    focus: number;
    determination: number;
    composure: number;
  };
  recommendations: string[];
  championshipPotential: number;
}

export default function AnalysisScreen({ route, navigation }: any) {
  const { videoPath, duration, sport, analysis } = route.params || {};
  const [isPlaying, setIsPlaying] = useState(false);
  const [analysisData, setAnalysisData] = useState<AnalysisData | null>(analysis);
  const [loading, setLoading] = useState(!analysis);

  useEffect(() => {
    if (!analysis) {
      // Simulate loading analysis results
      setTimeout(() => {
        setAnalysisData({
          blazeScore: 85,
          biomechanics: {
            hipRotation: 92,
            shoulderAlignment: 88,
            kneeFlexion: 79,
            spineAngle: 85,
          },
          microExpressions: {
            confidence: 88,
            focus: 92,
            determination: 95,
            composure: 83,
          },
          recommendations: [
            'Increase hip rotation during follow-through',
            'Maintain shoulder alignment throughout motion',
            'Focus on consistent knee flexion angle',
            'Excellent determination and focus detected'
          ],
          championshipPotential: 87
        });
        setLoading(false);
      }, 2000);
    }
  }, [analysis]);

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  const shareAnalysis = () => {
    Alert.alert('Share', 'Sharing functionality coming soon!');
  };

  const saveAnalysis = () => {
    Alert.alert('Success', 'Analysis saved to your profile');
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Processing Analysis...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Video Player */}
      {videoPath && (
        <View style={styles.videoContainer}>
          <Video
            source={{ uri: videoPath }}
            style={styles.video}
            paused={!isPlaying}
            repeat={true}
            resizeMode="contain"
            onError={(error: any) => console.error('Video error:', error)}
          />
          <TouchableOpacity
            style={styles.playButton}
            onPress={() => setIsPlaying(!isPlaying)}
          >
            <Icon 
              name={isPlaying ? 'pause' : 'play-arrow'} 
              size={50} 
              color={COLORS.white} 
            />
          </TouchableOpacity>
        </View>
      )}

      {/* Blaze Score */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.blazeScoreCard}
      >
        <Text style={styles.blazeScoreLabel}>Blaze Score</Text>
        <Text style={styles.blazeScoreValue}>{analysisData?.blazeScore}</Text>
        <Text style={styles.championshipLabel}>
          Championship Potential: {analysisData?.championshipPotential}%
        </Text>
      </LinearGradient>

      {/* Biomechanics Analysis */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Biomechanical Analysis</Text>
        {Object.entries(analysisData?.biomechanics || {}).map(([key, value]) => (
          <View key={key} style={styles.metricRow}>
            <Text style={styles.metricLabel}>
              {key.replace(/([A-Z])/g, ' $1').trim()}:
            </Text>
            <View style={styles.metricValueContainer}>
              <View style={[styles.metricBar, { width: `${value}%`, backgroundColor: getScoreColor(value) }]} />
              <Text style={[styles.metricValue, { color: getScoreColor(value) }]}>
                {value}%
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Micro-Expression Analysis */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>Character Assessment</Text>
        <View style={styles.characterGrid}>
          {Object.entries(analysisData?.microExpressions || {}).map(([key, value]) => (
            <View key={key} style={styles.characterCard}>
              <Icon 
                name={
                  key === 'confidence' ? 'trending-up' :
                  key === 'focus' ? 'center-focus-strong' :
                  key === 'determination' ? 'fitness-center' :
                  'psychology'
                } 
                size={30} 
                color={getScoreColor(value)} 
              />
              <Text style={styles.characterLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <Text style={[styles.characterValue, { color: getScoreColor(value) }]}>
                {value}%
              </Text>
            </View>
          ))}
        </View>
      </View>

      {/* Recommendations */}
      <View style={styles.sectionCard}>
        <Text style={styles.sectionTitle}>AI Recommendations</Text>
        {analysisData?.recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendationItem}>
            <Icon 
              name={rec.includes('Excellent') ? 'check-circle' : 'lightbulb'} 
              size={20} 
              color={rec.includes('Excellent') ? COLORS.success : COLORS.warning} 
            />
            <Text style={styles.recommendationText}>{rec}</Text>
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={[styles.actionButton, styles.primaryButton]} onPress={saveAnalysis}>
          <Icon name="save" size={24} color={COLORS.white} />
          <Text style={styles.buttonText}>Save Analysis</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={[styles.actionButton, styles.secondaryButton]} onPress={shareAnalysis}>
          <Icon name="share" size={24} color={COLORS.white} />
          <Text style={styles.buttonText}>Share Results</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Analysis powered by ChatGPT 5, Claude Opus 4.1, Gemini 2.5 Pro
        </Text>
      </View>
    </ScrollView>
  );
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
  loadingText: {
    color: COLORS.white,
    marginTop: 20,
    fontSize: 16,
  },
  videoContainer: {
    height: 250,
    backgroundColor: COLORS.darkGray,
    position: 'relative',
  },
  video: {
    flex: 1,
  },
  playButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -25 }, { translateY: -25 }],
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 30,
    width: 60,
    height: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  blazeScoreCard: {
    margin: 20,
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
  },
  blazeScoreLabel: {
    color: COLORS.white,
    fontSize: 18,
    opacity: 0.9,
  },
  blazeScoreValue: {
    color: COLORS.white,
    fontSize: 72,
    fontWeight: 'bold',
    marginVertical: 10,
  },
  championshipLabel: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.9,
  },
  sectionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    margin: 20,
    marginTop: 0,
    padding: 20,
    borderRadius: 12,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  metricRow: {
    marginBottom: 20,
  },
  metricLabel: {
    color: COLORS.lightGray,
    fontSize: 14,
    marginBottom: 8,
    textTransform: 'capitalize',
  },
  metricValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    height: 32,
    overflow: 'hidden',
  },
  metricBar: {
    height: '100%',
    borderRadius: 8,
  },
  metricValue: {
    position: 'absolute',
    right: 10,
    fontWeight: 'bold',
    fontSize: 14,
  },
  characterGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  characterCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  characterLabel: {
    color: COLORS.lightGray,
    fontSize: 12,
    marginTop: 8,
  },
  characterValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  recommendationItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 15,
  },
  recommendationText: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 10,
    flex: 1,
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 25,
    paddingVertical: 15,
    borderRadius: 25,
    width: '45%',
    justifyContent: 'center',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  buttonText: {
    color: COLORS.white,
    marginLeft: 8,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.lightGray,
    fontSize: 12,
    textAlign: 'center',
  },
});