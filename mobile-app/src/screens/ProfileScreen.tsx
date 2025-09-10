/**
 * Profile Screen - User Profile and Settings
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  TextInput,
  Switch
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import LinearGradient from 'react-native-linear-gradient';
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

interface UserProfile {
  name: string;
  email: string;
  sport: string;
  position: string;
  team: string;
  blazeScore: number;
  totalAnalyses: number;
  memberSince: string;
  achievements: string[];
  settings: {
    notifications: boolean;
    autoAnalysis: boolean;
    shareData: boolean;
    darkMode: boolean;
  };
}

export default function ProfileScreen({ navigation }: any) {
  const [profile, setProfile] = useState<UserProfile>({
    name: 'Austin Humphrey',
    email: 'ahump20@outlook.com',
    sport: 'Baseball',
    position: 'Pitcher',
    team: 'Cardinals',
    blazeScore: 85,
    totalAnalyses: 43,
    memberSince: '2024',
    achievements: [
      'Champion Mindset',
      'Weekly Warrior',
      'Form Master',
      'Data Driven'
    ],
    settings: {
      notifications: true,
      autoAnalysis: true,
      shareData: false,
      darkMode: true,
    }
  });
  
  const [editing, setEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState(profile);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const savedProfile = await AsyncStorage.getItem('userProfile');
      if (savedProfile) {
        setProfile(JSON.parse(savedProfile));
        setEditedProfile(JSON.parse(savedProfile));
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    }
  };

  const saveProfile = async () => {
    try {
      await AsyncStorage.setItem('userProfile', JSON.stringify(editedProfile));
      setProfile(editedProfile);
      setEditing(false);
      Alert.alert('Success', 'Profile updated successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to save profile');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Logout', 
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.reset({
              index: 0,
              routes: [{ name: 'Auth' }],
            });
          }
        }
      ]
    );
  };

  const toggleSetting = (key: keyof typeof profile.settings) => {
    setEditedProfile({
      ...editedProfile,
      settings: {
        ...editedProfile.settings,
        [key]: !editedProfile.settings[key]
      }
    });
    if (!editing) {
      saveProfile();
    }
  };

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <LinearGradient
        colors={[COLORS.primary, COLORS.secondary]}
        style={styles.header}
      >
        <View style={styles.profileImageContainer}>
          <View style={styles.profileImage}>
            <Text style={styles.profileInitials}>
              {profile.name.split(' ').map(n => n[0]).join('')}
            </Text>
          </View>
          <TouchableOpacity style={styles.editImageButton}>
            <Icon name="camera-alt" size={20} color={COLORS.white} />
          </TouchableOpacity>
        </View>
        
        <Text style={styles.profileName}>{profile.name}</Text>
        <Text style={styles.profileEmail}>{profile.email}</Text>
        
        <View style={styles.statsRow}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.blazeScore}</Text>
            <Text style={styles.statLabel}>Blaze Score</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.totalAnalyses}</Text>
            <Text style={styles.statLabel}>Analyses</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{profile.memberSince}</Text>
            <Text style={styles.statLabel}>Member Since</Text>
          </View>
        </View>
      </LinearGradient>

      {/* Profile Info */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Profile Information</Text>
          <TouchableOpacity onPress={() => editing ? saveProfile() : setEditing(true)}>
            <Text style={styles.editButton}>{editing ? 'Save' : 'Edit'}</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.infoCard}>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Sport</Text>
            {editing ? (
              <TextInput
                style={styles.infoInput}
                value={editedProfile.sport}
                onChangeText={(text) => setEditedProfile({...editedProfile, sport: text})}
                placeholderTextColor={COLORS.lightGray}
              />
            ) : (
              <Text style={styles.infoValue}>{profile.sport}</Text>
            )}
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Position</Text>
            {editing ? (
              <TextInput
                style={styles.infoInput}
                value={editedProfile.position}
                onChangeText={(text) => setEditedProfile({...editedProfile, position: text})}
                placeholderTextColor={COLORS.lightGray}
              />
            ) : (
              <Text style={styles.infoValue}>{profile.position}</Text>
            )}
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Team</Text>
            {editing ? (
              <TextInput
                style={styles.infoInput}
                value={editedProfile.team}
                onChangeText={(text) => setEditedProfile({...editedProfile, team: text})}
                placeholderTextColor={COLORS.lightGray}
              />
            ) : (
              <Text style={styles.infoValue}>{profile.team}</Text>
            )}
          </View>
        </View>
      </View>

      {/* Achievements */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Achievements</Text>
        <View style={styles.achievementsGrid}>
          {profile.achievements.map((achievement, index) => (
            <View key={index} style={styles.achievementCard}>
              <Icon 
                name={
                  achievement.includes('Champion') ? 'emoji-events' :
                  achievement.includes('Weekly') ? 'calendar-today' :
                  achievement.includes('Form') ? 'fitness-center' :
                  'analytics'
                } 
                size={30} 
                color={COLORS.primary} 
              />
              <Text style={styles.achievementText}>{achievement}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Settings */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Settings</Text>
        
        <View style={styles.settingsCard}>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="notifications" size={24} color={COLORS.primary} />
              <Text style={styles.settingLabel}>Push Notifications</Text>
            </View>
            <Switch
              value={editedProfile.settings.notifications}
              onValueChange={() => toggleSetting('notifications')}
              trackColor={{ false: COLORS.darkGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="auto-awesome" size={24} color={COLORS.secondary} />
              <Text style={styles.settingLabel}>Auto Analysis</Text>
            </View>
            <Switch
              value={editedProfile.settings.autoAnalysis}
              onValueChange={() => toggleSetting('autoAnalysis')}
              trackColor={{ false: COLORS.darkGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
          
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Icon name="share" size={24} color={COLORS.cardinalBlue} />
              <Text style={styles.settingLabel}>Share Analytics Data</Text>
            </View>
            <Switch
              value={editedProfile.settings.shareData}
              onValueChange={() => toggleSetting('shareData')}
              trackColor={{ false: COLORS.darkGray, true: COLORS.primary }}
              thumbColor={COLORS.white}
            />
          </View>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="help" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Help & Support</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="privacy-tip" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>Privacy Policy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton}>
          <Icon name="info" size={20} color={COLORS.white} />
          <Text style={styles.actionButtonText}>About Blaze Intelligence</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.actionButton, styles.logoutButton]}
          onPress={handleLogout}
        >
          <Icon name="logout" size={20} color={COLORS.error} />
          <Text style={[styles.actionButtonText, { color: COLORS.error }]}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Version 1.0.0</Text>
        <Text style={styles.footerText}>Powered by ChatGPT 5, Claude Opus 4.1, Gemini 2.5 Pro</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.dark,
  },
  header: {
    padding: 30,
    alignItems: 'center',
    paddingTop: 50,
  },
  profileImageContainer: {
    position: 'relative',
    marginBottom: 20,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileInitials: {
    color: COLORS.white,
    fontSize: 36,
    fontWeight: 'bold',
  },
  editImageButton: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: COLORS.primary,
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: COLORS.white,
  },
  profileName: {
    color: COLORS.white,
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  profileEmail: {
    color: COLORS.white,
    fontSize: 14,
    opacity: 0.8,
    marginBottom: 20,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  statItem: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  statValue: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    color: COLORS.white,
    fontSize: 12,
    opacity: 0.7,
    marginTop: 2,
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    padding: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: 'bold',
  },
  editButton: {
    color: COLORS.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  infoLabel: {
    color: COLORS.lightGray,
    fontSize: 14,
  },
  infoValue: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
  },
  infoInput: {
    color: COLORS.white,
    fontSize: 14,
    fontWeight: '600',
    borderBottomWidth: 1,
    borderBottomColor: COLORS.primary,
    paddingVertical: 5,
    minWidth: 100,
    textAlign: 'right',
  },
  achievementsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  achievementCard: {
    width: '48%',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 15,
  },
  achievementText: {
    color: COLORS.white,
    fontSize: 12,
    marginTop: 10,
    textAlign: 'center',
  },
  settingsCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.05)',
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingLabel: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 15,
  },
  actions: {
    padding: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },
  actionButtonText: {
    color: COLORS.white,
    fontSize: 14,
    marginLeft: 15,
  },
  logoutButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: COLORS.error,
    backgroundColor: 'transparent',
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    color: COLORS.lightGray,
    fontSize: 12,
    marginBottom: 5,
  },
});