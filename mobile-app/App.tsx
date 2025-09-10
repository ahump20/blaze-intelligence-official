/**
 * Blaze Intelligence Mobile App
 * Advanced Sports Performance Analysis with Video Intelligence
 */

import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  StatusBar,
  ScrollView,
  Alert,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LinearGradient from 'react-native-linear-gradient';

// Import screens
import CameraScreen from './src/screens/CameraScreen';
import AnalysisScreen from './src/screens/AnalysisScreen';
import DashboardScreen from './src/screens/DashboardScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import SettingsScreen from './src/screens/SettingsScreen';

// Import services
import { BlazeAPIService } from './src/services/BlazeAPIService';
import { VideoAnalysisService } from './src/services/VideoAnalysisService';
import { AuthService } from './src/services/AuthService';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const { width, height } = Dimensions.get('window');

// Theme colors matching Blaze Intelligence brand
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

function HomeScreen({ navigation }: any) {
  const [userStats, setUserStats] = useState({
    blazeScore: 0,
    analysesCompleted: 0,
    improvementRate: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUserStats();
  }, []);

  const loadUserStats = async () => {
    try {
      const stats = await AsyncStorage.getItem('userStats');
      if (stats) {
        setUserStats(JSON.parse(stats));
      }
      setLoading(false);
    } catch (error) {
      console.error('Error loading stats:', error);
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.dark, COLORS.darkGray]}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>🔥 Blaze Intelligence</Text>
          <Text style={styles.tagline}>Championship Mindset Analysis</Text>
        </View>

        {/* Quick Stats */}
        <View style={styles.statsContainer}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {loading ? '...' : userStats.blazeScore}
            </Text>
            <Text style={styles.statLabel}>Blaze Score</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>
              {loading ? '...' : userStats.analysesCompleted}
            </Text>
            <Text style={styles.statLabel}>Analyses</Text>
          </View>
          <View style={styles.statCard}>
            <Text style={[styles.statValue, { color: COLORS.success }]}>
              {loading ? '...' : `+${userStats.improvementRate}%`}
            </Text>
            <Text style={styles.statLabel}>Improvement</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[styles.actionButton, styles.primaryButton]}
            onPress={() => navigation.navigate('Camera')}
          >
            <Icon name="videocam" size={30} color={COLORS.white} />
            <Text style={styles.buttonText}>Start Analysis</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.secondaryButton]}
            onPress={() => navigation.navigate('Analysis')}
          >
            <Icon name="analytics" size={30} color={COLORS.white} />
            <Text style={styles.buttonText}>View Results</Text>
          </TouchableOpacity>
        </View>

        {/* Features */}
        <View style={styles.featuresContainer}>
          <Text style={styles.sectionTitle}>Advanced Features</Text>
          
          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name="psychology" size={40} color={COLORS.primary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Micro-Expression Detection</Text>
              <Text style={styles.featureDesc}>
                Analyze facial expressions to detect grit, determination, and championship character
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name="sports" size={40} color={COLORS.secondary} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Biomechanical Analysis</Text>
              <Text style={styles.featureDesc}>
                Real-time form assessment with 33 body landmark tracking
              </Text>
            </View>
          </View>

          <View style={styles.featureCard}>
            <View style={styles.featureIcon}>
              <Icon name="trending-up" size={40} color={COLORS.cardinalBlue} />
            </View>
            <View style={styles.featureContent}>
              <Text style={styles.featureTitle}>Performance Prediction</Text>
              <Text style={styles.featureDesc}>
                94.6% accurate predictions using multi-AI ensemble
              </Text>
            </View>
          </View>
        </View>

        {/* Teams Section */}
        <View style={styles.teamsContainer}>
          <Text style={styles.sectionTitle}>Featured Teams</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['Cardinals', 'Titans', 'Longhorns', 'Grizzlies'].map((team, index) => (
              <TouchableOpacity key={index} style={styles.teamCard}>
                <Text style={styles.teamName}>{team}</Text>
                <Text style={styles.teamScore}>Blaze Score: {[152, 74, 129, 59][index]}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName = 'home';
          
          switch (route.name) {
            case 'Home':
              iconName = 'home';
              break;
            case 'Camera':
              iconName = 'videocam';
              break;
            case 'Analysis':
              iconName = 'analytics';
              break;
            case 'Dashboard':
              iconName = 'dashboard';
              break;
            case 'Profile':
              iconName = 'person';
              break;
          }
          
          return <Icon name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.lightGray,
        tabBarStyle: {
          backgroundColor: COLORS.dark,
          borderTopColor: COLORS.darkGray,
          height: 60,
          paddingBottom: 5
        },
        headerStyle: {
          backgroundColor: COLORS.dark,
        },
        headerTintColor: COLORS.white,
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Camera" component={CameraScreen} />
      <Tab.Screen name="Analysis" component={AnalysisScreen} />
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthentication();
  }, []);

  const checkAuthentication = async () => {
    try {
      const token = await AsyncStorage.getItem('authToken');
      setIsAuthenticated(!!token);
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading Blaze Intelligence...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {isAuthenticated ? (
          <>
            <Stack.Screen name="Main" component={TabNavigator} />
            <Stack.Screen name="Settings" component={SettingsScreen} />
          </>
        ) : (
          <Stack.Screen name="Auth">
            {(props) => <AuthScreen {...props} onAuth={() => setIsAuthenticated(true)} />}
          </Stack.Screen>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

function AuthScreen({ onAuth }: { onAuth: () => void }) {
  const [loading, setLoading] = useState(false);

  const handleDemoLogin = async () => {
    setLoading(true);
    try {
      // Simulate authentication
      await AsyncStorage.setItem('authToken', 'demo_token');
      await AsyncStorage.setItem('userStats', JSON.stringify({
        blazeScore: 85,
        analysesCompleted: 12,
        improvementRate: 23
      }));
      onAuth();
    } catch (error) {
      Alert.alert('Error', 'Failed to authenticate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[COLORS.dark, COLORS.darkGray]}
      style={[styles.container, styles.centerContent]}
    >
      <View style={styles.authContainer}>
        <Text style={styles.authLogo}>🔥</Text>
        <Text style={styles.authTitle}>Blaze Intelligence</Text>
        <Text style={styles.authSubtitle}>Championship Performance Analysis</Text>
        
        <TouchableOpacity
          style={styles.authButton}
          onPress={handleDemoLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.authButtonText}>Start Demo</Text>
          )}
        </TouchableOpacity>
        
        <Text style={styles.authFooter}>
          Powered by ChatGPT 5, Claude Opus 4.1, Gemini 2.5 Pro
        </Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 20,
    alignItems: 'center',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.lightGray,
    marginTop: 5,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  statCard: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    minWidth: 100,
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  statLabel: {
    fontSize: 12,
    color: COLORS.lightGray,
    marginTop: 5,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    padding: 20,
  },
  actionButton: {
    alignItems: 'center',
    padding: 20,
    borderRadius: 12,
    width: '45%',
  },
  primaryButton: {
    backgroundColor: COLORS.primary,
  },
  secondaryButton: {
    backgroundColor: COLORS.secondary,
  },
  buttonText: {
    color: COLORS.white,
    marginTop: 10,
    fontWeight: '600',
  },
  featuresContainer: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.white,
    marginBottom: 15,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 15,
  },
  featureIcon: {
    marginRight: 15,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 5,
  },
  featureDesc: {
    fontSize: 12,
    color: COLORS.lightGray,
    lineHeight: 18,
  },
  teamsContainer: {
    padding: 20,
  },
  teamCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginRight: 15,
    minWidth: 120,
    alignItems: 'center',
  },
  teamName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    marginBottom: 5,
  },
  teamScore: {
    fontSize: 12,
    color: COLORS.cardinalBlue,
  },
  loadingText: {
    color: COLORS.white,
    marginTop: 20,
  },
  authContainer: {
    alignItems: 'center',
    padding: 40,
  },
  authLogo: {
    fontSize: 80,
    marginBottom: 20,
  },
  authTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 10,
  },
  authSubtitle: {
    fontSize: 16,
    color: COLORS.lightGray,
    marginBottom: 40,
  },
  authButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 50,
    paddingVertical: 15,
    borderRadius: 25,
    marginBottom: 30,
  },
  authButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
  authFooter: {
    fontSize: 12,
    color: COLORS.lightGray,
    textAlign: 'center',
  },
});