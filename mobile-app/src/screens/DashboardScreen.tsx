/**
 * Dashboard Screen - Analytics and Performance Overview
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
  RefreshControl
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

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

interface PerformanceData {
  weeklyAnalyses: number;
  avgBlazeScore: number;
  improvementRate: number;
  totalVideos: number;
  recentSessions: Array<{
    date: string;
    sport: string;
    blazeScore: number;
    duration: string;
  }>;
  skillBreakdown: {
    biomechanics: number;
    mentalToughness: number;
    consistency: number;
    athleticism: number;
  };
}

export default function DashboardScreen({ navigation }: any) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [performanceData, setPerformanceData] = useState<PerformanceData>({
    weeklyAnalyses: 0,
    avgBlazeScore: 0,
    improvementRate: 0,
    totalVideos: 0,
    recentSessions: [],
    skillBreakdown: {
      biomechanics: 0,
      mentalToughness: 0,
      consistency: 0,
      athleticism: 0,
    }
  });

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      // Simulate loading from API/storage
      const savedData = await AsyncStorage.getItem('dashboardData');
      
      if (savedData) {
        setPerformanceData(JSON.parse(savedData));
      } else {
        // Demo data
        setPerformanceData({
          weeklyAnalyses: 7,
          avgBlazeScore: 82,
          improvementRate: 15,
          totalVideos: 43,
          recentSessions: [
            { date: '2025-01-09', sport: 'Baseball', blazeScore: 88, duration: '5:23' },
            { date: '2025-01-08', sport: 'Football', blazeScore: 79, duration: '4:15' },
            { date: '2025-01-07', sport: 'Basketball', blazeScore: 85, duration: '6:02' },
            { date: '2025-01-06', sport: 'Baseball', blazeScore: 81, duration: '5:45' },
          ],
          skillBreakdown: {
            biomechanics: 85,
            mentalToughness: 88,
            consistency: 78,
            athleticism: 82,
          }
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return COLORS.success;
    if (score >= 60) return COLORS.warning;
    return COLORS.error;
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <ScrollView 
      style={styles.container}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          tintColor={COLORS.primary}
        />
      }
    >
      {/* Header Stats */}
      <View style={styles.headerStats}>
        <LinearGradient
          colors={[COLORS.primary, COLORS.secondary]}
          style={styles.mainStatCard}
        >
          <Text style={styles.mainStatValue}>{performanceData.avgBlazeScore}</Text>
          <Text style={styles.mainStatLabel}>Avg Blaze Score</Text>
          <View style={styles.trendContainer}>
            <Icon 
              name="trending-up" 
              size={20} 
              color={COLORS.white} 
            />
            <Text style={styles.trendText}>+{performanceData.improvementRate}%</Text>
          </View>
        </LinearGradient>

        <View style={styles.secondaryStats}>
          <View style={styles.statCard}>
            <Icon name="videocam" size={24} color={COLORS.primary} />
            <Text style={styles.statValue}>{performanceData.totalVideos}</Text>
            <Text style={styles.statLabel}>Total Videos</Text>
          </View>
          
          <View style={styles.statCard}>
            <Icon name="calendar-today" size={24} color={COLORS.cardinalBlue} />
            <Text style={styles.statValue}>{performanceData.weeklyAnalyses}</Text>
            <Text style={styles.statLabel}>This Week</Text>
          </View>
        </View>
      </View>

      {/* Skill Breakdown */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Skill Breakdown</Text>
        <View style={styles.skillsContainer}>
          {Object.entries(performanceData.skillBreakdown).map(([skill, value]) => (
            <View key={skill} style={styles.skillItem}>
              <View style={styles.skillHeader}>
                <Text style={styles.skillName}>
                  {skill.replace(/([A-Z])/g, ' $1').trim()}
                </Text>
                <Text style={[styles.skillValue, { color: getScoreColor(value) }]}>
                  {value}
                </Text>
              </View>
              <View style={styles.skillBarContainer}>
                <View 
                  style={[
                    styles.skillBar, 
                    { 
                      width: `${value}%`, 
                      backgroundColor: getScoreColor(value) 
                    }
                  ]} 
                />
              </View>
            </View>
          ))}
        </View>
      </View>

      {/* Recent Sessions */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Recent Sessions</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Analysis')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        {performanceData.recentSessions.map((session, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.sessionCard}
            onPress={() => navigation.navigate('Analysis')}
          >
            <View style={styles.sessionLeft}>
              <Icon 
                name={
                  session.sport === 'Baseball' ? 'sports-baseball' :
                  session.sport === 'Football' ? 'sports-football' :
                  'sports-basketball'
                } 
                size={30} 
                color={COLORS.primary} 
              />
            </View>
            <View style={styles.sessionContent}>
              <Text style={styles.sessionSport}>{session.sport}</Text>
              <Text style={styles.sessionDate}>{session.date} • {session.duration}</Text>
            </View>
            <View style={styles.sessionRight}>
              <Text style={[styles.sessionScore, { color: getScoreColor(session.blazeScore) }]}>
                {session.blazeScore}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Camera')}
          >
            <Icon name="add-a-photo" size={32} color={COLORS.primary} />
            <Text style={styles.actionText}>New Session</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Profile')}
          >
            <Icon name="person" size={32} color={COLORS.secondary} />
            <Text style={styles.actionText}>Profile</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionCard}
            onPress={() => navigation.navigate('Settings')}
          >
            <Icon name="settings" size={32} color={COLORS.cardinalBlue} />
            <Text style={styles.actionText}>Settings</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Insights */}
      <View style={styles.insightCard}>
        <Icon name="lightbulb" size={24} color={COLORS.warning} />
        <View style={styles.insightContent}>
          <Text style={styles.insightTitle}>AI Insight</Text>
          <Text style={styles.insightText}>
            Your biomechanics score has improved 12% this week. Focus on maintaining consistency for optimal results.
          </Text>
        </View>
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
  headerStats: {
    padding: 20,
  },
  mainStatCard: {
    padding: 30,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 20,
  },
  mainStatValue: {
    fontSize: 56,
    fontWeight: 'bold',
    color: COLORS.white,
  },
  mainStatLabel: {
    fontSize: 16,
    color: COLORS.white,
    opacity: 0.9,
    marginTop: 5,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  trendText: {
    color: COLORS.white,
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '600',
  },
  secondaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.white,
    marginVertical: 8,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 15,
  },
  viewAllText: {
    color: COLORS.primary,
    fontSize: 14,
  },
  skillsContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
  },
  skillItem: {
    marginBottom: 20,
  },
  skillHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  skillName: {
    color: COLORS.lightGray,
    fontSize: 14,
    textTransform: 'capitalize',
  },
  skillValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  skillBarContainer: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  skillBar: {
    height: '100%',
    borderRadius: 4,
  },
  sessionCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
    alignItems: 'center',
  },
  sessionLeft: {
    marginRight: 15,
  },
  sessionContent: {
    flex: 1,
  },
  sessionSport: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  sessionDate: {
    color: COLORS.lightGray,
    fontSize: 12,
    marginTop: 2,
  },
  sessionRight: {
    alignItems: 'center',
  },
  sessionScore: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  actionText: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 8,
  },
  insightCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 140, 0, 0.1)',
    margin: 20,
    padding: 15,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.warning,
  },
  insightContent: {
    flex: 1,
    marginLeft: 15,
  },
  insightTitle: {
    color: COLORS.warning,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
  },
  insightText: {
    color: COLORS.white,
    fontSize: 13,
    lineHeight: 18,
  },
});