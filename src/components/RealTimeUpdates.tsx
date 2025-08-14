import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BellIcon,
  XMarkIcon,
  TrophyIcon,
  ClockIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import { useSportsData } from '../contexts/SportsDataContext';
import { useAuth } from '../contexts/AuthContext';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'score_update' | 'game_start' | 'game_end' | 'milestone' | 'prediction';
  title: string;
  message: string;
  timestamp: Date;
  gameId?: string;
  priority: 'low' | 'medium' | 'high';
  read: boolean;
}

const RealTimeUpdates: React.FC = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  
  const { liveGames, isConnected } = useSportsData();
  const { user, canAccessFeature } = useAuth();

  useEffect(() => {
    // Listen for live game updates and generate notifications
    const gameUpdateHandler = () => {
      liveGames.forEach((game) => {
        if (game.status === 'live') {
          // Check for score changes and generate notifications
          const existingNotification = notifications.find(
            (n) => n.gameId === game.id && n.type === 'score_update'
          );

          if (!existingNotification) {
            const notification: Notification = {
              id: `${game.id}-${Date.now()}`,
              type: 'score_update',
              title: 'Live Score Update',
              message: `${game.homeTeam} ${game.homeScore} - ${game.awayScore} ${game.awayTeam}`,
              timestamp: new Date(),
              gameId: game.id,
              priority: 'high',
              read: false,
            };

            addNotification(notification);
          }
        }
      });
    };

    if (isConnected && liveGames.length > 0) {
      gameUpdateHandler();
    }
  }, [liveGames, isConnected]);

  useEffect(() => {
    // Generate welcome notification for new users
    if (user && notifications.length === 0) {
      const welcomeNotification: Notification = {
        id: 'welcome',
        type: 'milestone',
        title: 'Welcome to Blaze Intelligence!',
        message: 'Get ready for real-time sports insights and AI-powered analytics.',
        timestamp: new Date(),
        priority: 'medium',
        read: false,
      };
      addNotification(welcomeNotification);
    }
  }, [user]);

  useEffect(() => {
    // Update unread count
    const unread = notifications.filter((n) => !n.read).length;
    setUnreadCount(unread);
  }, [notifications]);

  const addNotification = (notification: Notification) => {
    if (!canAccessFeature('live_data') && notification.type === 'score_update') {
      return; // Skip live data notifications for free users
    }

    setNotifications((prev) => [notification, ...prev.slice(0, 19)]); // Keep only 20 notifications

    // Show toast for high priority notifications
    if (notification.priority === 'high') {
      toast(notification.message, {
        icon: getNotificationIcon(notification.type),
        duration: 3000,
      });
    }
  };

  const markAsRead = (notificationId: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === notificationId ? { ...n, read: true } : n))
    );
  };

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const removeNotification = (notificationId: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
  };

  const getNotificationIcon = (type: Notification['type']) => {
    switch (type) {
      case 'score_update':
        return '🏈';
      case 'game_start':
        return '🚀';
      case 'game_end':
        return '🏁';
      case 'milestone':
        return '🎉';
      case 'prediction':
        return '🔮';
      default:
        return '📢';
    }
  };

  const getPriorityColor = (priority: Notification['priority']) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  // Generate some sample notifications for demo purposes
  useEffect(() => {
    const demoNotifications: Notification[] = [
      {
        id: 'demo-1',
        type: 'prediction',
        title: 'AI Prediction Alert',
        message: 'High confidence prediction: Cowboys have 78% win probability against Packers',
        timestamp: new Date(Date.now() - 1000 * 60 * 5), // 5 minutes ago
        priority: 'high',
        read: false,
      },
      {
        id: 'demo-2',
        type: 'milestone',
        title: 'Performance Milestone',
        message: 'LeBron James just reached 25 points in the 3rd quarter!',
        timestamp: new Date(Date.now() - 1000 * 60 * 10), // 10 minutes ago
        priority: 'medium',
        read: false,
      },
      {
        id: 'demo-3',
        type: 'game_start',
        title: 'Game Starting Soon',
        message: 'Chiefs vs Bills kicks off in 15 minutes - predictions available!',
        timestamp: new Date(Date.now() - 1000 * 60 * 15), // 15 minutes ago
        priority: 'low',
        read: true,
      },
    ];

    // Add demo notifications after a short delay
    const timer = setTimeout(() => {
      if (notifications.length <= 1) {
        setNotifications((prev) => [...demoNotifications, ...prev]);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Connection Status Indicator */}
      {isConnected && (
        <div className="fixed top-20 right-4 z-40">
          <motion.div
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-2 bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs"
          >
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span>Live Data Connected</span>
          </motion.div>
        </div>
      )}

      {/* Notification Bell */}
      <motion.button
        onClick={() => setShowNotifications(!showNotifications)}
        className="fixed top-4 right-4 p-2 bg-white rounded-full shadow-lg border hover:shadow-xl transition-shadow z-50"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <BellIcon className="w-6 h-6 text-gray-700" />
        {unreadCount > 0 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </motion.div>
        )}
      </motion.button>

      {/* Notifications Panel */}
      <AnimatePresence>
        {showNotifications && (
          <motion.div
            initial={{ opacity: 0, x: 400 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 400 }}
            className="fixed top-16 right-4 w-96 max-h-[600px] bg-white rounded-lg shadow-2xl border z-40 overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b bg-gray-50">
              <div className="flex items-center space-x-2">
                <BellIcon className="w-5 h-5 text-gray-600" />
                <h3 className="font-semibold text-gray-900">Live Updates</h3>
                {unreadCount > 0 && (
                  <span className="bg-red-500 text-white text-xs px-2 py-1 rounded-full">
                    {unreadCount}
                  </span>
                )}
              </div>
              <div className="flex items-center space-x-2">
                {unreadCount > 0 && (
                  <button
                    onClick={markAllAsRead}
                    className="text-xs text-blaze-600 hover:text-blaze-700"
                  >
                    Mark all read
                  </button>
                )}
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <XMarkIcon className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Notifications List */}
            <div className="max-h-96 overflow-y-auto">
              {notifications.length > 0 ? (
                <div className="divide-y divide-gray-100">
                  {notifications.map((notification) => (
                    <motion.div
                      key={notification.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`p-4 border-l-4 ${getPriorityColor(notification.priority)} ${
                        !notification.read ? 'bg-blue-50' : 'bg-white'
                      } hover:bg-gray-50 transition-colors cursor-pointer`}
                      onClick={() => markAsRead(notification.id)}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <h4 className={`text-sm font-medium ${
                              !notification.read ? 'text-gray-900' : 'text-gray-700'
                            }`}>
                              {notification.title}
                            </h4>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {notification.message}
                          </p>
                          <div className="flex items-center space-x-2 mt-2">
                            <ClockIcon className="w-3 h-3 text-gray-400" />
                            <span className="text-xs text-gray-400">
                              {notification.timestamp.toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {!notification.read && (
                              <div className="w-2 h-2 bg-blue-500 rounded-full" />
                            )}
                          </div>
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            removeNotification(notification.id);
                          }}
                          className="text-gray-400 hover:text-gray-600 ml-2"
                        >
                          <XMarkIcon className="w-4 h-4" />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-gray-500">
                  <BellIcon className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">No notifications yet</p>
                  <p className="text-xs mt-1">
                    You'll see live updates and alerts here
                  </p>
                </div>
              )}
            </div>

            {/* Feature Upgrade Prompt */}
            {!canAccessFeature('live_data') && (
              <div className="p-4 bg-gradient-to-r from-blaze-500 to-blaze-600 text-white">
                <div className="flex items-center space-x-2">
                  <TrophyIcon className="w-5 h-5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium">Upgrade for Real-Time Updates</p>
                    <p className="text-xs opacity-90">
                      Get live scores, predictions, and instant notifications
                    </p>
                  </div>
                  <ChartBarIcon className="w-5 h-5" />
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default RealTimeUpdates;