/**
 * Blaze Intelligence Mobile App
 * React Native implementation for iOS and Android
 * 
 * To run:
 * 1. npm install -g react-native-cli
 * 2. npx react-native init BlazeIntelligence
 * 3. Copy this file to App.js
 * 4. npm install dependencies
 * 5. npx react-native run-ios or run-android
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  ScrollView,
  View,
  Text,
  StatusBar,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Dimensions,
  Platform,
  Alert,
  Image,
  FlatList,
  RefreshControl,
  Animated,
  PanResponder,
} from 'react-native';

import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import PushNotification from 'react-native-push-notification';
import { Camera } from 'react-native-vision-camera';
import Video from 'react-native-video';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

// ========================================
// CONSTANTS & CONFIGURATION
// ========================================

const COLORS = {
  primary: '#BF5700',
  secondary: '#FF8C00',
  dark: '#0d0d0d',
  light: '#ffffff',
  gray: '#999999',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

const API_BASE = 'https://api.blaze-intelligence.com';

const METRICS = {
  accuracy: '94.6%',
  latency: '<100ms',
  dataPoints: '2.8M+',
  price: '$1,188',
};

// ========================================
// AUTHENTICATION CONTEXT
// ========================================

const AuthContext = React.createContext();

const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const storedToken = await AsyncStorage.getItem('token');
      const storedUser = await AsyncStorage.getItem('user');
      
      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('Auth check error:', error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      const response = await fetch(`${API_BASE}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (data.success) {
        await AsyncStorage.setItem('token', data.token);
        await AsyncStorage.setItem('user', JSON.stringify(data.user));
        setToken(data.token);
        setUser(data.user);
        return { success: true };
      } else {
        return { success: false, error: data.error };
      }
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  const logout = async () => {
    await AsyncStorage.removeItem('token');
    await AsyncStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// ========================================
// LOGIN SCREEN
// ========================================

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = React.useContext(AuthContext);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }

    setLoading(true);
    const result = await login(email, password);
    setLoading(false);

    if (!result.success) {
      Alert.alert('Login Failed', result.error || 'Invalid credentials');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.loginContainer}>
        <Text style={styles.logo}>BLAZE</Text>
        <Text style={styles.tagline}>Intelligence</Text>
        
        <View style={styles.inputContainer}>
          <Icon name="email" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={COLORS.gray}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock" size={20} color={COLORS.gray} style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor={COLORS.gray}
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>

        <TouchableOpacity 
          style={styles.loginButton}
          onPress={handleLogin}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color={COLORS.light} />
          ) : (
            <Text style={styles.loginButtonText}>Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity onPress={() => navigation.navigate('Register')}>
          <Text style={styles.linkText}>Don't have an account? Sign up</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

// ========================================
// DASHBOARD SCREEN
// ========================================

const DashboardScreen = () => {
  const [refreshing, setRefreshing] = useState(false);
  const [analytics, setAnalytics] = useState(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fetchAnalytics();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch(`${API_BASE}/analytics`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setAnalytics(data);
    } catch (error) {
      console.error('Analytics fetch error:', error);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAnalytics();
    setRefreshing(false);
  };

  const chartConfig = {
    backgroundGradientFrom: COLORS.dark,
    backgroundGradientTo: COLORS.dark,
    color: (opacity = 1) => `rgba(191, 87, 0, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.5,
    useShadowColorFromDataset: false,
  };

  return (
    <ScrollView 
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Animated.View style={{ opacity: fadeAnim }}>
        {/* Metrics Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{METRICS.accuracy}</Text>
            <Text style={styles.metricLabel}>Accuracy</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{METRICS.latency}</Text>
            <Text style={styles.metricLabel}>Latency</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{METRICS.dataPoints}</Text>
            <Text style={styles.metricLabel}>Data Points</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={styles.metricValue}>{METRICS.price}</Text>
            <Text style={styles.metricLabel}>Annual</Text>
          </View>
        </View>

        {/* Performance Chart */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Performance Trends</Text>
          <LineChart
            data={{
              labels: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
              datasets: [{
                data: [88, 92, 89, 94, 91, 95, 94.6],
              }],
            }}
            width={screenWidth - 40}
            height={220}
            chartConfig={chartConfig}
            bezier
            style={styles.chart}
          />
        </View>

        {/* Team Stats */}
        <View style={styles.chartContainer}>
          <Text style={styles.chartTitle}>Team Statistics</Text>
          <BarChart
            data={{
              labels: ['Offense', 'Defense', 'Speed', 'Power'],
              datasets: [{
                data: [85, 78, 92, 88],
              }],
            }}
            width={screenWidth - 40}
            height={200}
            chartConfig={chartConfig}
            style={styles.chart}
          />
        </View>
      </Animated.View>
    </ScrollView>
  );
};

// ========================================
// LIVE FEED SCREEN
// ========================================

const LiveFeedScreen = () => {
  const [games, setGames] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLiveGames();
    const interval = setInterval(fetchLiveGames, 10000); // Update every 10 seconds
    return () => clearInterval(interval);
  }, []);

  const fetchLiveGames = async () => {
    try {
      const response = await fetch(`${API_BASE}/live-games`);
      const data = await response.json();
      setGames(data.games || []);
    } catch (error) {
      console.error('Live games fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderGame = ({ item }) => (
    <TouchableOpacity style={styles.gameCard}>
      <View style={styles.gameHeader}>
        <Text style={styles.gameLeague}>{item.league}</Text>
        {item.isLive && (
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
        )}
      </View>
      <View style={styles.gameTeams}>
        <View style={styles.team}>
          <Text style={styles.teamName}>{item.homeTeam}</Text>
          <Text style={styles.teamScore}>{item.homeScore}</Text>
        </View>
        <Text style={styles.vs}>vs</Text>
        <View style={styles.team}>
          <Text style={styles.teamName}>{item.awayTeam}</Text>
          <Text style={styles.teamScore}>{item.awayScore}</Text>
        </View>
      </View>
      <View style={styles.gameFooter}>
        <Text style={styles.gameTime}>{item.time}</Text>
        <TouchableOpacity style={styles.analyzeButton}>
          <Text style={styles.analyzeButtonText}>AI Analysis</Text>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <FlatList
      data={games}
      renderItem={renderGame}
      keyExtractor={(item) => item.id}
      contentContainerStyle={styles.feedContainer}
      ListEmptyComponent={
        <Text style={styles.emptyText}>No live games at the moment</Text>
      }
    />
  );
};

// ========================================
// VISION AI SCREEN
// ========================================

const VisionAIScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [videoPath, setVideoPath] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const camera = useRef(null);

  useEffect(() => {
    checkCameraPermission();
  }, []);

  const checkCameraPermission = async () => {
    const status = await Camera.requestCameraPermission();
    setHasPermission(status === 'authorized');
  };

  const startRecording = async () => {
    if (camera.current && !isRecording) {
      setIsRecording(true);
      const video = await camera.current.startRecording({
        onRecordingFinished: (video) => {
          setVideoPath(video.path);
          setIsRecording(false);
          analyzeVideo(video.path);
        },
        onRecordingError: (error) => {
          console.error(error);
          setIsRecording(false);
        },
      });
    }
  };

  const stopRecording = async () => {
    if (camera.current && isRecording) {
      await camera.current.stopRecording();
    }
  };

  const analyzeVideo = async (path) => {
    // Upload video for analysis
    const formData = new FormData();
    formData.append('video', {
      uri: path,
      type: 'video/mp4',
      name: 'analysis.mp4',
    });

    try {
      const response = await fetch(`${API_BASE}/vision-ai/analyze`, {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = await response.json();
      setAnalysis(data);
    } catch (error) {
      console.error('Video analysis error:', error);
      Alert.alert('Error', 'Failed to analyze video');
    }
  };

  if (hasPermission === null) {
    return <View style={styles.container} />;
  }

  if (hasPermission === false) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Camera permission required</Text>
        <TouchableOpacity style={styles.button} onPress={checkCameraPermission}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {!videoPath ? (
        <Camera
          ref={camera}
          style={styles.camera}
          device={'back'}
          isActive={true}
          video={true}
          audio={true}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity
              style={[styles.recordButton, isRecording && styles.recordingButton]}
              onPress={isRecording ? stopRecording : startRecording}
            >
              <View style={styles.recordButtonInner} />
            </TouchableOpacity>
            {isRecording && (
              <Text style={styles.recordingText}>Recording...</Text>
            )}
          </View>
        </Camera>
      ) : (
        <ScrollView>
          <Video
            source={{ uri: videoPath }}
            style={styles.videoPlayer}
            controls={true}
            paused={false}
          />
          
          {analysis && (
            <View style={styles.analysisContainer}>
              <Text style={styles.analysisTitle}>AI Analysis Results</Text>
              
              <View style={styles.analysisCard}>
                <Text style={styles.analysisLabel}>Biomechanics Score</Text>
                <Text style={styles.analysisValue}>{analysis.biomechanics}%</Text>
              </View>
              
              <View style={styles.analysisCard}>
                <Text style={styles.analysisLabel}>Grit Score</Text>
                <Text style={styles.analysisValue}>{analysis.grit}%</Text>
              </View>
              
              <View style={styles.analysisCard}>
                <Text style={styles.analysisLabel}>Injury Risk</Text>
                <Text style={[
                  styles.analysisValue,
                  { color: analysis.injuryRisk > 70 ? COLORS.danger : COLORS.success }
                ]}>
                  {analysis.injuryRisk}%
                </Text>
              </View>
              
              <TouchableOpacity 
                style={styles.button}
                onPress={() => {
                  setVideoPath(null);
                  setAnalysis(null);
                }}
              >
                <Text style={styles.buttonText}>Record New Video</Text>
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  );
};

// ========================================
// PROFILE SCREEN
// ========================================

const ProfileScreen = () => {
  const { user, logout } = React.useContext(AuthContext);
  const [subscription, setSubscription] = useState(null);

  useEffect(() => {
    fetchSubscription();
  }, []);

  const fetchSubscription = async () => {
    try {
      const response = await fetch(`${API_BASE}/user/subscription`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Subscription fetch error:', error);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Logout', onPress: logout, style: 'destructive' },
      ]
    );
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profileHeader}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {user?.name?.charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={styles.profileName}>{user?.name}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Subscription</Text>
        <View style={styles.subscriptionCard}>
          <Text style={styles.subscriptionPlan}>
            {subscription?.plan || 'Free Trial'}
          </Text>
          <Text style={styles.subscriptionPrice}>
            {subscription?.price || '$0/month'}
          </Text>
          {subscription?.expiresAt && (
            <Text style={styles.subscriptionExpiry}>
              Expires: {new Date(subscription.expiresAt).toLocaleDateString()}
            </Text>
          )}
          <TouchableOpacity style={styles.upgradeButton}>
            <Text style={styles.upgradeButtonText}>Upgrade Plan</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="notifications" size={24} color={COLORS.gray} />
          <Text style={styles.settingText}>Notifications</Text>
          <Icon name="chevron-right" size={24} color={COLORS.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="security" size={24} color={COLORS.gray} />
          <Text style={styles.settingText}>Privacy & Security</Text>
          <Icon name="chevron-right" size={24} color={COLORS.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="help" size={24} color={COLORS.gray} />
          <Text style={styles.settingText}>Help & Support</Text>
          <Icon name="chevron-right" size={24} color={COLORS.gray} />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.settingItem}>
          <Icon name="info" size={24} color={COLORS.gray} />
          <Text style={styles.settingText}>About</Text>
          <Icon name="chevron-right" size={24} color={COLORS.gray} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={handleLogout}>
        <Text style={styles.logoutButtonText}>Logout</Text>
      </TouchableOpacity>
    </ScrollView>
  );
};

// ========================================
// NAVIGATION
// ========================================

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();

const TabNavigator = () => (
  <Tab.Navigator
    screenOptions={({ route }) => ({
      tabBarIcon: ({ focused, color, size }) => {
        let iconName;
        if (route.name === 'Dashboard') iconName = 'dashboard';
        else if (route.name === 'Live') iconName = 'sports-baseball';
        else if (route.name === 'Vision AI') iconName = 'videocam';
        else if (route.name === 'Profile') iconName = 'person';
        
        return <Icon name={iconName} size={size} color={color} />;
      },
      tabBarActiveTintColor: COLORS.primary,
      tabBarInactiveTintColor: COLORS.gray,
      tabBarStyle: {
        backgroundColor: COLORS.dark,
        borderTopColor: 'rgba(255, 255, 255, 0.1)',
      },
      headerStyle: {
        backgroundColor: COLORS.dark,
      },
      headerTintColor: COLORS.light,
    })}
  >
    <Tab.Screen name="Dashboard" component={DashboardScreen} />
    <Tab.Screen name="Live" component={LiveFeedScreen} />
    <Tab.Screen name="Vision AI" component={VisionAIScreen} />
    <Tab.Screen name="Profile" component={ProfileScreen} />
  </Tab.Navigator>
);

// ========================================
// MAIN APP
// ========================================

const App = () => {
  const { user, loading } = React.useContext(AuthContext);

  useEffect(() => {
    configurePushNotifications();
  }, []);

  const configurePushNotifications = () => {
    PushNotification.configure({
      onRegister: function (token) {
        console.log('TOKEN:', token);
      },
      onNotification: function (notification) {
        console.log('NOTIFICATION:', notification);
      },
      permissions: {
        alert: true,
        badge: true,
        sound: true,
      },
      popInitialNotification: true,
      requestPermissions: true,
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar barStyle="light-content" backgroundColor={COLORS.dark} />
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          <Stack.Screen name="Main" component={TabNavigator} />
        ) : (
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

// ========================================
// STYLES
// ========================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.dark,
  },
  loginContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 30,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
  },
  tagline: {
    fontSize: 18,
    color: COLORS.gray,
    textAlign: 'center',
    marginBottom: 50,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 10,
    marginBottom: 15,
    paddingHorizontal: 15,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    height: 50,
    color: COLORS.light,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: COLORS.primary,
    height: 50,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 20,
  },
  loginButtonText: {
    color: COLORS.light,
    fontSize: 18,
    fontWeight: 'bold',
  },
  linkText: {
    color: COLORS.primary,
    textAlign: 'center',
    marginTop: 20,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 20,
    justifyContent: 'space-between',
  },
  metricCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 10,
    marginBottom: 15,
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
  },
  metricLabel: {
    fontSize: 12,
    color: COLORS.gray,
    marginTop: 5,
  },
  chartContainer: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.light,
    marginBottom: 15,
  },
  chart: {
    borderRadius: 10,
  },
  gameCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    marginHorizontal: 20,
    marginVertical: 10,
    padding: 20,
    borderRadius: 10,
  },
  gameHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  gameLeague: {
    color: COLORS.gray,
    fontSize: 14,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.danger,
    marginRight: 5,
  },
  liveText: {
    color: COLORS.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  gameTeams: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    marginBottom: 15,
  },
  team: {
    alignItems: 'center',
  },
  teamName: {
    color: COLORS.light,
    fontSize: 16,
    marginBottom: 5,
  },
  teamScore: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  vs: {
    color: COLORS.gray,
    fontSize: 14,
  },
  gameFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  gameTime: {
    color: COLORS.gray,
    fontSize: 14,
  },
  analyzeButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: 15,
    paddingVertical: 8,
    borderRadius: 5,
  },
  analyzeButtonText: {
    color: COLORS.light,
    fontSize: 12,
    fontWeight: 'bold',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  recordButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  recordingButton: {
    backgroundColor: 'rgba(255, 0, 0, 0.3)',
  },
  recordButtonInner: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: COLORS.danger,
  },
  recordingText: {
    color: COLORS.danger,
    marginTop: 10,
    fontSize: 16,
    fontWeight: 'bold',
  },
  videoPlayer: {
    height: 300,
    backgroundColor: COLORS.dark,
  },
  analysisContainer: {
    padding: 20,
  },
  analysisTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.light,
    marginBottom: 20,
  },
  analysisCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  analysisLabel: {
    color: COLORS.gray,
    fontSize: 16,
  },
  analysisValue: {
    color: COLORS.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 30,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  avatarText: {
    color: COLORS.light,
    fontSize: 32,
    fontWeight: 'bold',
  },
  profileName: {
    color: COLORS.light,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileEmail: {
    color: COLORS.gray,
    fontSize: 16,
    marginTop: 5,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 30,
  },
  sectionTitle: {
    color: COLORS.light,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  subscriptionCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 10,
  },
  subscriptionPlan: {
    color: COLORS.light,
    fontSize: 20,
    fontWeight: 'bold',
  },
  subscriptionPrice: {
    color: COLORS.primary,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 5,
  },
  subscriptionExpiry: {
    color: COLORS.gray,
    fontSize: 14,
    marginTop: 10,
  },
  upgradeButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: 10,
    borderRadius: 5,
    marginTop: 15,
  },
  upgradeButtonText: {
    color: COLORS.light,
    textAlign: 'center',
    fontWeight: 'bold',
  },
  settingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  settingText: {
    color: COLORS.light,
    fontSize: 16,
    flex: 1,
    marginLeft: 15,
  },
  logoutButton: {
    backgroundColor: COLORS.danger,
    marginHorizontal: 20,
    marginBottom: 30,
    paddingVertical: 15,
    borderRadius: 10,
  },
  logoutButtonText: {
    color: COLORS.light,
    textAlign: 'center',
    fontSize: 16,
    fontWeight: 'bold',
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    marginTop: 20,
  },
  buttonText: {
    color: COLORS.light,
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: COLORS.light,
    fontSize: 16,
    marginBottom: 20,
  },
  emptyText: {
    color: COLORS.gray,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 50,
  },
  feedContainer: {
    paddingVertical: 20,
  },
});

// ========================================
// EXPORT
// ========================================

export default () => (
  <AuthProvider>
    <App />
  </AuthProvider>
);