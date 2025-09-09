/**
 * Authentication Service
 * Handles user authentication and session management
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import BlazeAPIService from './BlazeAPIService';

class AuthService {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  async initialize() {
    try {
      const token = await AsyncStorage.getItem('authToken');
      const userProfile = await AsyncStorage.getItem('userProfile');
      
      if (token && userProfile) {
        this.isAuthenticated = true;
        this.currentUser = JSON.parse(userProfile);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Auth initialization error:', error);
      return false;
    }
  }

  async login(email, password) {
    try {
      const response = await BlazeAPIService.login(email, password);
      
      if (response.success) {
        this.isAuthenticated = true;
        this.currentUser = response.user;
        
        // Store credentials
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userProfile', JSON.stringify(response.user));
        
        // Connect WebSocket for real-time data
        BlazeAPIService.connectWebSocket(this.handleWebSocketMessage);
        BlazeAPIService.subscribeToSportsData();
        
        return { success: true, user: response.user };
      }
      
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Login error:', error);
      return { success: false, error: error.message };
    }
  }

  async register(userData) {
    try {
      const response = await BlazeAPIService.register(userData);
      
      if (response.success) {
        this.isAuthenticated = true;
        this.currentUser = response.user;
        
        await AsyncStorage.setItem('authToken', response.token);
        await AsyncStorage.setItem('userProfile', JSON.stringify(response.user));
        
        return { success: true, user: response.user };
      }
      
      return { success: false, error: response.error };
    } catch (error) {
      console.error('Registration error:', error);
      return { success: false, error: error.message };
    }
  }

  async logout() {
    try {
      await BlazeAPIService.logout();
      await AsyncStorage.multiRemove(['authToken', 'userProfile']);
      
      this.isAuthenticated = false;
      this.currentUser = null;
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      return { success: false, error: error.message };
    }
  }

  async refreshToken() {
    try {
      const currentToken = await AsyncStorage.getItem('authToken');
      if (!currentToken) {
        return { success: false, error: 'No token found' };
      }
      
      // Call refresh endpoint
      const response = await BlazeAPIService.apiClient.post('/auth/refresh', {
        token: currentToken
      });
      
      if (response.data.token) {
        await AsyncStorage.setItem('authToken', response.data.token);
        return { success: true, token: response.data.token };
      }
      
      return { success: false, error: 'Failed to refresh token' };
    } catch (error) {
      console.error('Token refresh error:', error);
      return { success: false, error: error.message };
    }
  }

  async updatePassword(currentPassword, newPassword) {
    try {
      const response = await BlazeAPIService.apiClient.post('/auth/change-password', {
        currentPassword,
        newPassword
      });
      
      return { success: response.data.success };
    } catch (error) {
      console.error('Password update error:', error);
      return { success: false, error: error.message };
    }
  }

  async requestPasswordReset(email) {
    try {
      const response = await BlazeAPIService.apiClient.post('/auth/reset-password', {
        email
      });
      
      return { success: response.data.success };
    } catch (error) {
      console.error('Password reset error:', error);
      return { success: false, error: error.message };
    }
  }

  handleWebSocketMessage(message) {
    // Handle real-time updates
    console.log('WebSocket message:', message);
    
    switch (message.type) {
      case 'blaze_score_update':
        // Update user's Blaze Score
        if (this.currentUser) {
          this.currentUser.blazeScore = message.data.blazeScore;
          AsyncStorage.setItem('userProfile', JSON.stringify(this.currentUser));
        }
        break;
      
      case 'analysis_complete':
        // Notify user of completed analysis
        break;
      
      case 'sports_data_update':
        // Handle live sports data updates
        break;
      
      default:
        console.log('Unknown message type:', message.type);
    }
  }

  getCurrentUser() {
    return this.currentUser;
  }

  isUserAuthenticated() {
    return this.isAuthenticated;
  }
}

export default new AuthService();