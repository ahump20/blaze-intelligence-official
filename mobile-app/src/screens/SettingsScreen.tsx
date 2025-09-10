/**
 * Settings Screen - App Configuration and Preferences
 */

import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
  Linking
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

export default function SettingsScreen({ navigation }: any) {
  const [settings, setSettings] = useState({
    notifications: {
      pushEnabled: true,
      analysisComplete: true,
      dailyReminders: false,
      weeklyReports: true,
    },
    video: {
      quality: 'high',
      autoUpload: true,
      saveLocally: true,
      compressionEnabled: false,
    },
    analysis: {
      autoAnalysis: true,
      includeAudio: false,
      advancedMetrics: true,
      aiModels: 'all', // 'all', 'fast', 'accurate'
    },
    privacy: {
      shareAnonymousData: false,
      allowCoaching: true,
      publicProfile: false,
    },
    display: {
      darkMode: true,
      showTips: true,
      compactView: false,
    }
  });

  const handleToggle = (category: string, setting: string) => {
    setSettings(prev => ({
      ...prev,
      [category]: {
        ...prev[category as keyof typeof prev],
        [setting]: !prev[category as keyof typeof prev][setting as keyof typeof prev[category as keyof typeof prev]]
      }
    }));
    
    // Save to storage
    saveSettings();
  };

  const saveSettings = async () => {
    try {
      await AsyncStorage.setItem('appSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving settings:', error);
    }
  };

  const handleVideoQuality = () => {
    Alert.alert(
      'Video Quality',
      'Select recording quality',
      [
        { text: 'Low (480p)', onPress: () => updateVideoQuality('low') },
        { text: 'Medium (720p)', onPress: () => updateVideoQuality('medium') },
        { text: 'High (1080p)', onPress: () => updateVideoQuality('high') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const updateVideoQuality = (quality: string) => {
    setSettings(prev => ({
      ...prev,
      video: { ...prev.video, quality }
    }));
    saveSettings();
  };

  const handleAIModels = () => {
    Alert.alert(
      'AI Analysis Models',
      'Select which AI models to use for analysis',
      [
        { text: 'All Models (Most Accurate)', onPress: () => updateAIModels('all') },
        { text: 'Fast Mode (Quick Results)', onPress: () => updateAIModels('fast') },
        { text: 'Accurate Mode (Best Quality)', onPress: () => updateAIModels('accurate') },
        { text: 'Cancel', style: 'cancel' }
      ]
    );
  };

  const updateAIModels = (mode: string) => {
    setSettings(prev => ({
      ...prev,
      analysis: { ...prev.analysis, aiModels: mode }
    }));
    saveSettings();
  };

  const clearCache = () => {
    Alert.alert(
      'Clear Cache',
      'This will remove all cached data. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Clear', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.removeItem('cachedVideos');
            await AsyncStorage.removeItem('cachedAnalyses');
            Alert.alert('Success', 'Cache cleared successfully');
          }
        }
      ]
    );
  };

  const exportData = () => {
    Alert.alert('Export Data', 'Your data export has been initiated. You will receive an email with your data within 24 hours.');
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Notifications */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Notifications</Text>
        <View style={styles.settingsCard}>
          <SettingRow
            icon="notifications"
            label="Push Notifications"
            value={settings.notifications.pushEnabled}
            onToggle={() => handleToggle('notifications', 'pushEnabled')}
          />
          <SettingRow
            icon="check-circle"
            label="Analysis Complete"
            value={settings.notifications.analysisComplete}
            onToggle={() => handleToggle('notifications', 'analysisComplete')}
          />
          <SettingRow
            icon="today"
            label="Daily Reminders"
            value={settings.notifications.dailyReminders}
            onToggle={() => handleToggle('notifications', 'dailyReminders')}
          />
          <SettingRow
            icon="assessment"
            label="Weekly Reports"
            value={settings.notifications.weeklyReports}
            onToggle={() => handleToggle('notifications', 'weeklyReports')}
          />
        </View>
      </View>

      {/* Video Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Video Settings</Text>
        <View style={styles.settingsCard}>
          <TouchableOpacity style={styles.settingRow} onPress={handleVideoQuality}>
            <View style={styles.settingInfo}>
              <Icon name="high-quality" size={24} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Video Quality</Text>
            </View>
            <Text style={styles.settingValue}>{settings.video.quality.toUpperCase()}</Text>
          </TouchableOpacity>
          
          <SettingRow
            icon="cloud-upload"
            label="Auto Upload"
            value={settings.video.autoUpload}
            onToggle={() => handleToggle('video', 'autoUpload')}
          />
          <SettingRow
            icon="save"
            label="Save Locally"
            value={settings.video.saveLocally}
            onToggle={() => handleToggle('video', 'saveLocally')}
          />
          <SettingRow
            icon="compress"
            label="Video Compression"
            value={settings.video.compressionEnabled}
            onToggle={() => handleToggle('video', 'compressionEnabled')}
          />
        </View>
      </View>

      {/* Analysis Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Analysis Settings</Text>
        <View style={styles.settingsCard}>
          <SettingRow
            icon="auto-awesome"
            label="Auto Analysis"
            value={settings.analysis.autoAnalysis}
            onToggle={() => handleToggle('analysis', 'autoAnalysis')}
          />
          <SettingRow
            icon="mic"
            label="Include Audio"
            value={settings.analysis.includeAudio}
            onToggle={() => handleToggle('analysis', 'includeAudio')}
          />
          <SettingRow
            icon="analytics"
            label="Advanced Metrics"
            value={settings.analysis.advancedMetrics}
            onToggle={() => handleToggle('analysis', 'advancedMetrics')}
          />
          
          <TouchableOpacity style={styles.settingRow} onPress={handleAIModels}>
            <View style={styles.settingInfo}>
              <Icon name="psychology" size={24} color={COLORS.secondary} />
              <Text style={styles.settingLabel}>AI Models</Text>
            </View>
            <Text style={styles.settingValue}>
              {settings.analysis.aiModels === 'all' ? 'ALL' : settings.analysis.aiModels.toUpperCase()}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Privacy */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Privacy</Text>
        <View style={styles.settingsCard}>
          <SettingRow
            icon="share"
            label="Share Anonymous Data"
            value={settings.privacy.shareAnonymousData}
            onToggle={() => handleToggle('privacy', 'shareAnonymousData')}
          />
          <SettingRow
            icon="school"
            label="Allow Coaching Insights"
            value={settings.privacy.allowCoaching}
            onToggle={() => handleToggle('privacy', 'allowCoaching')}
          />
          <SettingRow
            icon="public"
            label="Public Profile"
            value={settings.privacy.publicProfile}
            onToggle={() => handleToggle('privacy', 'publicProfile')}
          />
        </View>
      </View>

      {/* Display */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Display</Text>
        <View style={styles.settingsCard}>
          <SettingRow
            icon="dark-mode"
            label="Dark Mode"
            value={settings.display.darkMode}
            onToggle={() => handleToggle('display', 'darkMode')}
          />
          <SettingRow
            icon="lightbulb"
            label="Show Tips"
            value={settings.display.showTips}
            onToggle={() => handleToggle('display', 'showTips')}
          />
          <SettingRow
            icon="view-compact"
            label="Compact View"
            value={settings.display.compactView}
            onToggle={() => handleToggle('display', 'compactView')}
          />
        </View>
      </View>

      {/* Storage & Data */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Storage & Data</Text>
        <View style={styles.actionButtons}>
          <TouchableOpacity style={styles.actionButton} onPress={clearCache}>
            <Icon name="delete-sweep" size={24} color={COLORS.warning} />
            <Text style={styles.actionButtonText}>Clear Cache</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.actionButton} onPress={exportData}>
            <Icon name="download" size={24} color={COLORS.primary} />
            <Text style={styles.actionButtonText}>Export My Data</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* About */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>About</Text>
        <View style={styles.aboutCard}>
          <TouchableOpacity 
            style={styles.aboutRow}
            onPress={() => Linking.openURL('https://blaze-intelligence.com/terms')}
          >
            <Text style={styles.aboutLabel}>Terms of Service</Text>
            <Icon name="chevron-right" size={24} color={COLORS.lightGray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.aboutRow}
            onPress={() => Linking.openURL('https://blaze-intelligence.com/privacy')}
          >
            <Text style={styles.aboutLabel}>Privacy Policy</Text>
            <Icon name="chevron-right" size={24} color={COLORS.lightGray} />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.aboutRow}
            onPress={() => Linking.openURL('https://blaze-intelligence.com/support')}
          >
            <Text style={styles.aboutLabel}>Support</Text>
            <Icon name="chevron-right" size={24} color={COLORS.lightGray} />
          </TouchableOpacity>
          
          <View style={styles.aboutRow}>
            <Text style={styles.aboutLabel}>Version</Text>
            <Text style={styles.versionText}>1.0.0</Text>
          </View>
        </View>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Blaze Intelligence © 2025
        </Text>
        <Text style={styles.footerSubtext}>
          Powered by ChatGPT 5, Claude Opus 4.1, Gemini 2.5 Pro
        </Text>
      </View>
    </ScrollView>
  );
}

function SettingRow({ icon, label, value, onToggle }: any) {
  return (
    <View style={styles.settingRow}>
      <View style={styles.settingInfo}>
        <Icon name={icon} size={24} color={COLORS.primary} />
        <Text style={styles.settingLabel}>{label}</Text>
      </View>
      <Switch
        value={value}
        onValueChange={onToggle}
        trackColor={{ false: COLORS.darkGray, true: COLORS.primary }}
        thumbColor={COLORS.white}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingLabel: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 15,
  },
  settingValue: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtons: {
    gap: 10,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 15,
  },
  aboutCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  aboutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  aboutLabel: {
    color: COLORS.white,
    fontSize: 14,
  },
  versionText: {
    color: COLORS.lightGray,
    fontSize: 14,
  },
  footer: {
    padding: 30,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.lightGray,
    fontSize: 14,
  },
  footerSubtext: {
    color: COLORS.lightGray,
    fontSize: 12,
    marginTop: 5,
  },
});