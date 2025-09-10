/**
 * Blaze API Service
 * Central service for all API communications with Blaze Intelligence backend
 */

import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.blaze-intelligence.com';
const WS_BASE_URL = process.env.REACT_APP_WS_URL || 'wss://ws.blaze-intelligence.com';

class BlazeAPIService {
  constructor() {
    this.apiClient = axios.create({
      baseURL: API_BASE_URL,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Platform': Platform.OS,
        'X-App-Version': '1.0.0'
      }
    });

    this.wsClient = null;
    this.setupInterceptors();
  }

  setupInterceptors() {
    // Request interceptor for auth token
    this.apiClient.interceptors.request.use(
      async (config) => {
        const token = await AsyncStorage.getItem('authToken');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor for error handling
    this.apiClient.interceptors.response.use(
      (response) => response,
      async (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          await AsyncStorage.removeItem('authToken');
          // Navigate to login screen
        }
        return Promise.reject(error);
      }
    );
  }

  // Authentication
  async login(email, password) {
    const response = await this.apiClient.post('/auth/login', { email, password });
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
      await AsyncStorage.setItem('userProfile', JSON.stringify(response.data.user));
    }
    return response.data;
  }

  async register(userData) {
    const response = await this.apiClient.post('/auth/register', userData);
    if (response.data.token) {
      await AsyncStorage.setItem('authToken', response.data.token);
    }
    return response.data;
  }

  async logout() {
    await AsyncStorage.multiRemove(['authToken', 'userProfile']);
    this.disconnectWebSocket();
  }

  // Sports Data
  async getMLBData(team = 'Cardinals') {
    const response = await this.apiClient.get(`/sports/mlb/${team}`);
    return response.data;
  }

  async getNFLData(team = 'Titans') {
    const response = await this.apiClient.get(`/sports/nfl/${team}`);
    return response.data;
  }

  async getNBAData(team = 'Grizzlies') {
    const response = await this.apiClient.get(`/sports/nba/${team}`);
    return response.data;
  }

  async getNCAAData(team = 'Longhorns') {
    const response = await this.apiClient.get(`/sports/ncaa/${team}`);
    return response.data;
  }

  // Video Analysis
  async uploadVideo(videoFile) {
    const formData = new FormData();
    formData.append('video', videoFile);
    formData.append('timestamp', new Date().toISOString());
    formData.append('device', Platform.OS);

    const response = await this.apiClient.post('/video/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  }

  async getAnalysisResults(analysisId) {
    const response = await this.apiClient.get(`/analysis/${analysisId}`);
    return response.data;
  }

  async getUserAnalyses(userId) {
    const response = await this.apiClient.get(`/user/${userId}/analyses`);
    return response.data;
  }

  // Training Data Collection
  async collectTrainingData(videoData) {
    const response = await this.apiClient.post('/training/collect', {
      ...videoData,
      collectedAt: new Date().toISOString(),
      platform: Platform.OS
    });
    return response.data;
  }

  async getTrainingDatasets() {
    const response = await this.apiClient.get('/training/datasets');
    return response.data;
  }

  // Blaze Score Calculations
  async calculateBlazeScore(performanceData) {
    const response = await this.apiClient.post('/analytics/blaze-score', performanceData);
    return response.data;
  }

  async getHistoricalBlazeScores(userId, dateRange) {
    const response = await this.apiClient.get(`/analytics/blaze-scores/${userId}`, {
      params: dateRange
    });
    return response.data;
  }

  // Real-time WebSocket Connection
  connectWebSocket(onMessage) {
    if (this.wsClient) {
      return; // Already connected
    }

    this.wsClient = new WebSocket(WS_BASE_URL);

    this.wsClient.onopen = () => {
      console.log('WebSocket connected');
      this.authenticateWebSocket();
    };

    this.wsClient.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onMessage(data);
    };

    this.wsClient.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.wsClient.onclose = () => {
      console.log('WebSocket disconnected');
      this.wsClient = null;
      // Attempt reconnection after 5 seconds
      setTimeout(() => this.connectWebSocket(onMessage), 5000);
    };
  }

  async authenticateWebSocket() {
    if (!this.wsClient) return;
    
    const token = await AsyncStorage.getItem('authToken');
    if (token) {
      this.wsClient.send(JSON.stringify({
        type: 'auth',
        token: token
      }));
    }
  }

  subscribeToSportsData(sports = ['MLB', 'NFL', 'NBA', 'NCAA']) {
    if (!this.wsClient) return;
    
    this.wsClient.send(JSON.stringify({
      type: 'subscribe',
      channels: sports
    }));
  }

  disconnectWebSocket() {
    if (this.wsClient) {
      this.wsClient.close();
      this.wsClient = null;
    }
  }

  // User Profile Management
  async updateProfile(profileData) {
    const response = await this.apiClient.put('/user/profile', profileData);
    await AsyncStorage.setItem('userProfile', JSON.stringify(response.data));
    return response.data;
  }

  async getProfile() {
    const response = await this.apiClient.get('/user/profile');
    return response.data;
  }

  // Analytics and Reports
  async getPerformanceReport(userId, dateRange) {
    const response = await this.apiClient.get(`/reports/performance/${userId}`, {
      params: dateRange
    });
    return response.data;
  }

  async getTeamComparison(teamIds) {
    const response = await this.apiClient.post('/analytics/team-comparison', {
      teams: teamIds
    });
    return response.data;
  }

  // NIL Calculations
  async calculateNILValue(athleteData) {
    const response = await this.apiClient.post('/nil/calculate', athleteData);
    return response.data;
  }

  async getNILTrends(sport, position) {
    const response = await this.apiClient.get('/nil/trends', {
      params: { sport, position }
    });
    return response.data;
  }

  // Health Check
  async healthCheck() {
    try {
      const response = await this.apiClient.get('/health');
      return response.data;
    } catch (error) {
      return { status: 'error', message: error.message };
    }
  }
}

export default new BlazeAPIService();