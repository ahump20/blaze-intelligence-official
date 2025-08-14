import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  UserCircleIcon,
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  BellIcon,
  ShieldCheckIcon,
  CreditCardIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface ProfileForm {
  name: string;
  email: string;
  favoriteTeams: string[];
  favoriteSports: string[];
  notifications: boolean;
}

const UserProfile: React.FC = () => {
  const { user, updateUser } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<ProfileForm>({
    name: user?.name || '',
    email: user?.email || '',
    favoriteTeams: user?.preferences?.favoriteTeams || [],
    favoriteSports: user?.preferences?.favoriteSports || ['football', 'basketball'],
    notifications: user?.preferences?.notifications || true,
  });
  const [newTeam, setNewTeam] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const availableSports = [
    { id: 'football', name: 'Football', icon: '🏈' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'baseball', name: 'Baseball', icon: '⚾' },
    { id: 'hockey', name: 'Hockey', icon: '🏒' },
    { id: 'soccer', name: 'Soccer', icon: '⚽' },
    { id: 'tennis', name: 'Tennis', icon: '🎾' },
    { id: 'golf', name: 'Golf', icon: '⛳' },
    { id: 'mma', name: 'MMA', icon: '🥊' },
  ];

  const popularTeams = [
    'Dallas Cowboys', 'Green Bay Packers', 'New England Patriots', 'Pittsburgh Steelers',
    'Los Angeles Lakers', 'Boston Celtics', 'Golden State Warriors', 'Chicago Bulls',
    'New York Yankees', 'Los Angeles Dodgers', 'Boston Red Sox', 'Chicago Cubs',
  ];

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // Update user preferences
      updateUser({
        ...user!,
        name: formData.name,
        preferences: {
          favoriteTeams: formData.favoriteTeams,
          favoriteSports: formData.favoriteSports,
          notifications: formData.notifications,
        },
      });

      // In a real app, you'd send this to your backend
      await new Promise(resolve => setTimeout(resolve, 1000));

      setIsEditing(false);
      toast.success('Profile updated successfully!');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      name: user?.name || '',
      email: user?.email || '',
      favoriteTeams: user?.preferences?.favoriteTeams || [],
      favoriteSports: user?.preferences?.favoriteSports || ['football', 'basketball'],
      notifications: user?.preferences?.notifications || true,
    });
    setIsEditing(false);
  };

  const addFavoriteTeam = (team: string) => {
    if (team && !formData.favoriteTeams.includes(team)) {
      setFormData(prev => ({
        ...prev,
        favoriteTeams: [...prev.favoriteTeams, team],
      }));
      setNewTeam('');
    }
  };

  const removeFavoriteTeam = (teamToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteTeams: prev.favoriteTeams.filter(team => team !== teamToRemove),
    }));
  };

  const toggleSport = (sport: string) => {
    setFormData(prev => ({
      ...prev,
      favoriteSports: prev.favoriteSports.includes(sport)
        ? prev.favoriteSports.filter(s => s !== sport)
        : [...prev.favoriteSports, sport],
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view your profile</h2>
          <p className="text-gray-600">Access your account settings and preferences.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Profile - Blaze Intelligence</title>
        <meta name="description" content="Manage your account settings and preferences" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <h1 className="text-3xl font-bold text-gray-900">Account Profile</h1>
            <p className="text-gray-600 mt-1">Manage your account settings and preferences</p>
          </motion.div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Profile Card */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-1"
            >
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex flex-col items-center">
                  <img
                    className="w-24 h-24 rounded-full mb-4"
                    src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=f83b3b&color=fff&size=200`}
                    alt={user.name}
                  />
                  <h3 className="text-xl font-semibold text-gray-900">{user.name}</h3>
                  <p className="text-gray-600">{user.email}</p>
                  <div className="mt-4 px-3 py-1 bg-blaze-100 text-blaze-800 rounded-full text-sm font-medium">
                    {user.subscription?.plan.toUpperCase()} Plan
                  </div>
                </div>

                <div className="mt-6 space-y-4">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ShieldCheckIcon className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-gray-700">Account Status</span>
                    </div>
                    <span className="text-sm font-medium text-green-600">Active</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <ChartBarIcon className="w-5 h-5 text-blue-600" />
                      <span className="text-sm text-gray-700">Total Predictions</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">247</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <CreditCardIcon className="w-5 h-5 text-purple-600" />
                      <span className="text-sm text-gray-700">Member Since</span>
                    </div>
                    <span className="text-sm font-medium text-gray-900">Jan 2024</span>
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Profile Settings */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="lg:col-span-2"
            >
              <div className="bg-white p-6 rounded-lg shadow-md border">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Profile Settings</h3>
                  {!isEditing ? (
                    <button
                      onClick={() => setIsEditing(true)}
                      className="flex items-center space-x-2 text-blaze-600 hover:text-blaze-700 transition-colors"
                    >
                      <PencilIcon className="w-4 h-4" />
                      <span>Edit</span>
                    </button>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={handleSave}
                        disabled={isLoading}
                        className="flex items-center space-x-2 bg-blaze-600 text-white px-4 py-2 rounded-lg hover:bg-blaze-700 transition-colors disabled:opacity-50"
                      >
                        <CheckIcon className="w-4 h-4" />
                        <span>{isLoading ? 'Saving...' : 'Save'}</span>
                      </button>
                      <button
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="flex items-center space-x-2 text-gray-600 hover:text-gray-700 transition-colors"
                      >
                        <XMarkIcon className="w-4 h-4" />
                        <span>Cancel</span>
                      </button>
                    </div>
                  )}
                </div>

                <div className="space-y-6">
                  {/* Basic Information */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Basic Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                        {isEditing ? (
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-500 focus:border-transparent"
                          />
                        ) : (
                          <p className="py-2 text-gray-900">{user.name}</p>
                        )}
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                        <p className="py-2 text-gray-600">{user.email}</p>
                        {isEditing && (
                          <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Favorite Sports */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Favorite Sports</h4>
                    {isEditing ? (
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {availableSports.map((sport) => (
                          <button
                            key={sport.id}
                            onClick={() => toggleSport(sport.id)}
                            className={`p-3 rounded-lg border-2 transition-all ${
                              formData.favoriteSports.includes(sport.id)
                                ? 'border-blaze-500 bg-blaze-50 text-blaze-700'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                          >
                            <div className="text-2xl mb-1">{sport.icon}</div>
                            <div className="text-sm font-medium">{sport.name}</div>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.favoriteSports.map((sport) => {
                          const sportInfo = availableSports.find(s => s.id === sport);
                          return sportInfo ? (
                            <div
                              key={sport}
                              className="flex items-center space-x-2 bg-blaze-100 text-blaze-800 px-3 py-1 rounded-full"
                            >
                              <span>{sportInfo.icon}</span>
                              <span className="text-sm font-medium">{sportInfo.name}</span>
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}
                  </div>

                  {/* Favorite Teams */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Favorite Teams</h4>
                    {isEditing ? (
                      <div className="space-y-4">
                        <div className="flex space-x-2">
                          <input
                            type="text"
                            value={newTeam}
                            onChange={(e) => setNewTeam(e.target.value)}
                            placeholder="Add a team..."
                            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blaze-500 focus:border-transparent"
                            onKeyPress={(e) => e.key === 'Enter' && addFavoriteTeam(newTeam)}
                          />
                          <button
                            onClick={() => addFavoriteTeam(newTeam)}
                            className="px-4 py-2 bg-blaze-600 text-white rounded-lg hover:bg-blaze-700 transition-colors"
                          >
                            Add
                          </button>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-2">Popular teams:</p>
                          <div className="flex flex-wrap gap-2">
                            {popularTeams.filter(team => !formData.favoriteTeams.includes(team)).map((team) => (
                              <button
                                key={team}
                                onClick={() => addFavoriteTeam(team)}
                                className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded transition-colors"
                              >
                                {team}
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {formData.favoriteTeams.map((team) => (
                            <div
                              key={team}
                              className="flex items-center space-x-2 bg-blaze-100 text-blaze-800 px-3 py-1 rounded-full"
                            >
                              <span className="text-sm font-medium">{team}</span>
                              <button
                                onClick={() => removeFavoriteTeam(team)}
                                className="text-blaze-600 hover:text-blaze-700"
                              >
                                <XMarkIcon className="w-3 h-3" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {formData.favoriteTeams.length > 0 ? (
                          formData.favoriteTeams.map((team) => (
                            <div
                              key={team}
                              className="bg-blaze-100 text-blaze-800 px-3 py-1 rounded-full"
                            >
                              <span className="text-sm font-medium">{team}</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-gray-600">No favorite teams selected</p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Notifications */}
                  <div>
                    <h4 className="text-md font-medium text-gray-900 mb-4">Notification Preferences</h4>
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-3">
                        <BellIcon className="w-5 h-5 text-gray-600" />
                        <div>
                          <p className="font-medium text-gray-900">Push Notifications</p>
                          <p className="text-sm text-gray-600">Receive alerts for live games and predictions</p>
                        </div>
                      </div>
                      {isEditing ? (
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, notifications: !prev.notifications }))}
                          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                            formData.notifications ? 'bg-blaze-600' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                              formData.notifications ? 'translate-x-6' : 'translate-x-1'
                            }`}
                          />
                        </button>
                      ) : (
                        <span className={`text-sm font-medium ${
                          formData.notifications ? 'text-green-600' : 'text-gray-600'
                        }`}>
                          {formData.notifications ? 'Enabled' : 'Disabled'}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default UserProfile;