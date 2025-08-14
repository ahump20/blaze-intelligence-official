import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuth0 } from '@auth0/auth0-react';
import axios from 'axios';
import { identifyUser, trackEvent } from '../utils/analytics';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
  subscription?: {
    plan: 'free' | 'starter' | 'professional' | 'enterprise';
    status: 'active' | 'cancelled' | 'past_due';
    expiresAt?: string;
  };
  preferences?: {
    favoriteTeams: string[];
    favoriteSports: string[];
    notifications: boolean;
  };
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: () => void;
  logout: () => void;
  updateUser: (updates: Partial<User>) => void;
  hasActiveSubscription: boolean;
  canAccessFeature: (feature: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user: auth0User,
    isAuthenticated: auth0IsAuthenticated,
    isLoading: auth0IsLoading,
    loginWithRedirect,
    logout: auth0Logout,
    getAccessTokenSilently,
  } = useAuth0();

  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initUser = async () => {
      if (auth0IsAuthenticated && auth0User) {
        try {
          const token = await getAccessTokenSilently();
          
          // Fetch or create user profile from your backend
          const response = await axios.get('/api/users/profile', {
            headers: { Authorization: `Bearer ${token}` },
          });

          const userData: User = {
            id: auth0User.sub!,
            email: auth0User.email!,
            name: auth0User.name!,
            picture: auth0User.picture,
            subscription: response.data.subscription || { plan: 'free', status: 'active' },
            preferences: response.data.preferences || {
              favoriteTeams: [],
              favoriteSports: ['football', 'basketball'],
              notifications: true,
            },
          };

          setUser(userData);
          
          // Track user identification for analytics
          identifyUser(userData.id, {
            email: userData.email,
            name: userData.name,
            subscription_plan: userData.subscription?.plan || 'free',
            subscription_status: userData.subscription?.status || 'active',
            favorite_sports: userData.preferences?.favoriteSports,
            signup_date: new Date().toISOString(),
          });

          // Track login event
          trackEvent({
            action: 'login',
            category: 'authentication',
            label: 'successful',
            custom_parameters: {
              user_id: userData.id,
              plan: userData.subscription?.plan || 'free',
            },
          });
        } catch (error) {
          console.error('Failed to initialize user:', error);
          // Create default user profile
          const defaultUser: User = {
            id: auth0User.sub!,
            email: auth0User.email!,
            name: auth0User.name!,
            picture: auth0User.picture,
            subscription: { plan: 'free' as const, status: 'active' as const },
            preferences: {
              favoriteTeams: [],
              favoriteSports: ['football', 'basketball'],
              notifications: true,
            },
          };
          
          setUser(defaultUser);

          // Track new user signup
          identifyUser(defaultUser.id, {
            email: defaultUser.email,
            name: defaultUser.name,
            subscription_plan: 'free',
            subscription_status: 'active',
            is_new_user: true,
            signup_date: new Date().toISOString(),
          });

          trackEvent({
            action: 'signup',
            category: 'authentication',
            label: 'new_user',
            custom_parameters: {
              user_id: defaultUser.id,
              plan: 'free',
            },
          });
        }
      } else {
        setUser(null);
      }
      setIsLoading(false);
    };

    if (!auth0IsLoading) {
      initUser();
    }
  }, [auth0IsAuthenticated, auth0User, auth0IsLoading, getAccessTokenSilently]);

  const login = () => {
    loginWithRedirect();
  };

  const logout = () => {
    // Track logout event before clearing user data
    if (user) {
      trackEvent({
        action: 'logout',
        category: 'authentication',
        label: 'user_initiated',
        custom_parameters: {
          user_id: user.id,
          plan: user.subscription?.plan || 'free',
          session_duration: Date.now(), // Could calculate actual duration
        },
      });
    }

    auth0Logout({
      logoutParams: {
        returnTo: window.location.origin,
      },
    });
    setUser(null);
  };

  const updateUser = (updates: Partial<User>) => {
    if (user) {
      setUser({ ...user, ...updates });
    }
  };

  const hasActiveSubscription = user?.subscription?.status === 'active' && user?.subscription?.plan !== 'free';

  const canAccessFeature = (feature: string): boolean => {
    if (!user) return false;
    
    const plan = user.subscription?.plan || 'free';
    
    const featureAccess = {
      free: ['basic_analytics', 'demo'],
      starter: ['basic_analytics', 'demo', 'live_data', 'basic_reports'],
      professional: ['basic_analytics', 'demo', 'live_data', 'basic_reports', 'ai_insights', 'advanced_reports', 'api_access'],
      enterprise: ['all'],
    };

    if (plan === 'enterprise') return true;
    
    return featureAccess[plan]?.includes(feature) || false;
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: auth0IsAuthenticated,
    isLoading: isLoading || auth0IsLoading,
    login,
    logout,
    updateUser,
    hasActiveSubscription,
    canAccessFeature,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;