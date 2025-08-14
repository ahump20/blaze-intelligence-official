import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Helmet } from 'react-helmet-async';
import {
  ChartBarIcon,
  TrophyIcon,
  FireIcon,
  StarIcon,
  UserGroupIcon,
  ClockIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  PlayIcon,
  EyeIcon,
} from '@heroicons/react/24/outline';
import { useAuth } from '../contexts/AuthContext';
import { useSportsData } from '../contexts/SportsDataContext';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { QuickShareButton } from './SocialSharing';

interface DashboardStats {
  totalPredictions: number;
  accuracyRate: number;
  favoriteTeamWins: number;
  weeklyInsights: number;
}

interface TrendingGame {
  id: string;
  title: string;
  teams: string;
  time: string;
  viewers: string;
  prediction: string;
  confidence: number;
}

const Dashboard: React.FC = () => {
  const { user, canAccessFeature } = useAuth();
  const { liveGames, playerStats } = useSportsData();
  const [stats, setStats] = useState<DashboardStats>({
    totalPredictions: 0,
    accuracyRate: 0,
    favoriteTeamWins: 0,
    weeklyInsights: 0,
  });

  const [performanceData] = useState([
    { month: 'Jan', accuracy: 68, predictions: 45 },
    { month: 'Feb', accuracy: 72, predictions: 52 },
    { month: 'Mar', accuracy: 75, predictions: 48 },
    { month: 'Apr', accuracy: 78, predictions: 67 },
    { month: 'May', accuracy: 82, predictions: 71 },
    { month: 'Jun', accuracy: 85, predictions: 63 },
  ]);

  const [trendingGames] = useState<TrendingGame[]>([
    {
      id: '1',
      title: 'Monday Night Football',
      teams: 'Cowboys vs Packers',
      time: '8:30 PM EST',
      viewers: '2.3M',
      prediction: 'Cowboys Win',
      confidence: 78,
    },
    {
      id: '2',
      title: 'NBA Finals Game 6',
      teams: 'Lakers vs Celtics',
      time: '9:00 PM EST',
      viewers: '1.8M',
      prediction: 'Lakers Win',
      confidence: 65,
    },
    {
      id: '3',
      title: 'Champions League',
      teams: 'Barcelona vs Real Madrid',
      time: '3:00 PM EST',
      viewers: '890K',
      prediction: 'Barcelona Win',
      confidence: 72,
    },
  ]);

  useEffect(() => {
    // Simulate loading user statistics
    const loadUserStats = async () => {
      // In a real app, this would fetch from your backend
      const mockStats: DashboardStats = {
        totalPredictions: 247,
        accuracyRate: 82.5,
        favoriteTeamWins: 18,
        weeklyInsights: 34,
      };
      
      setStats(mockStats);
    };

    loadUserStats();
  }, [user]);

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Please sign in to view your dashboard</h2>
          <p className="text-gray-600">Access your personalized sports analytics and insights.</p>
        </div>
      </div>
    );
  }

  const StatCard: React.FC<{
    icon: React.ReactNode;
    title: string;
    value: string | number;
    change?: string;
    changeType?: 'up' | 'down';
  }> = ({ icon, title, value, change, changeType }) => (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white p-6 rounded-lg shadow-md border"
    >
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-gray-600">{title}</p>
          <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
          {change && (
            <div className={`flex items-center mt-2 text-sm ${
              changeType === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {changeType === 'up' ? (
                <ArrowUpIcon className="w-4 h-4 mr-1" />
              ) : (
                <ArrowDownIcon className="w-4 h-4 mr-1" />
              )}
              {change}
            </div>
          )}
        </div>
        <div className="p-3 rounded-full bg-blaze-100 text-blaze-600">
          {icon}
        </div>
      </div>
    </motion.div>
  );

  return (
    <>
      <Helmet>
        <title>Dashboard - Blaze Intelligence</title>
        <meta name="description" content="Your personalized sports analytics dashboard" />
      </Helmet>

      <div className="min-h-screen bg-gray-50 pt-8 pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Welcome back, {user.name?.split(' ')[0]}!
                </h1>
                <p className="text-gray-600 mt-1">
                  Here's your sports analytics overview for today
                </p>
              </div>
              <div className="flex items-center space-x-2">
                <div className="px-3 py-1 bg-blaze-100 text-blaze-800 rounded-full text-sm font-medium">
                  {user.subscription?.plan.toUpperCase()} Plan
                </div>
              </div>
            </motion.div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <StatCard
              icon={<TrophyIcon className="w-6 h-6" />}
              title="Total Predictions"
              value={stats.totalPredictions}
              change="+12% this week"
              changeType="up"
            />
            <StatCard
              icon={<ChartBarIcon className="w-6 h-6" />}
              title="Accuracy Rate"
              value={`${stats.accuracyRate}%`}
              change="+5.2% vs last month"
              changeType="up"
            />
            <StatCard
              icon={<StarIcon className="w-6 h-6" />}
              title="Favorite Team Wins"
              value={stats.favoriteTeamWins}
              change="+3 this month"
              changeType="up"
            />
            <StatCard
              icon={<FireIcon className="w-6 h-6" />}
              title="Weekly Insights"
              value={stats.weeklyInsights}
              change="+18% engagement"
              changeType="up"
            />
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Performance Chart */}
            <div className="lg:col-span-2">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 rounded-lg shadow-md border"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-900">Prediction Performance</h3>
                  <div className="flex items-center space-x-2">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blaze-500 rounded-full"></div>
                      <span className="text-sm text-gray-600">Accuracy</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                      <span className="text-sm text-gray-600">Predictions</span>
                    </div>
                  </div>
                </div>
                {canAccessFeature('advanced_reports') ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={performanceData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="month" stroke="#666" />
                      <YAxis stroke="#666" />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'white',
                          border: '1px solid #e5e7eb',
                          borderRadius: '8px'
                        }}
                      />
                      <Line type="monotone" dataKey="accuracy" stroke="#f83b3b" strokeWidth={3} />
                      <Line type="monotone" dataKey="predictions" stroke="#9ca3af" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-300 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                    <div className="text-center">
                      <ChartBarIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600 font-medium">Advanced Analytics</p>
                      <p className="text-sm text-gray-500">Upgrade to Professional for detailed performance charts</p>
                    </div>
                  </div>
                )}
              </motion.div>
            </div>

            {/* Live Games */}
            <div className="space-y-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 rounded-lg shadow-md border"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Live Games</h3>
                {liveGames.length > 0 ? (
                  <div className="space-y-4">
                    {liveGames.slice(0, 3).map((game) => (
                      <div key={game.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900 text-sm">
                            {game.homeTeam} vs {game.awayTeam}
                          </p>
                          <p className="text-xs text-gray-600">{game.quarter} - {game.timeRemaining}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-blaze-600">
                            {game.homeScore} - {game.awayScore}
                          </p>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center text-xs text-green-600">
                              <div className="w-2 h-2 bg-green-500 rounded-full mr-1"></div>
                              LIVE
                            </div>
                            <QuickShareButton
                              title={`🔥 Live Game Update: ${game.homeTeam} vs ${game.awayTeam}`}
                              description={`Current Score: ${game.homeTeam} ${game.homeScore} - ${game.awayScore} ${game.awayTeam} | ${game.quarter} - ${game.timeRemaining} | Follow live updates on Blaze Intelligence`}
                              size="sm"
                              variant="outline"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <PlayIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No live games right now</p>
                    <p className="text-xs text-gray-500">Check back during game days</p>
                  </div>
                )}
              </motion.div>

              {/* Trending Games */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-lg shadow-md border"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Trending Games</h3>
                <div className="space-y-3">
                  {trendingGames.map((game) => (
                    <div key={game.id} className="p-3 border border-gray-200 rounded-lg hover:border-blaze-300 transition-colors">
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-medium text-gray-900 text-sm">{game.title}</p>
                        <div className="flex items-center text-xs text-gray-500">
                          <EyeIcon className="w-3 h-3 mr-1" />
                          {game.viewers}
                        </div>
                      </div>
                      <p className="text-sm text-gray-600 mb-1">{game.teams}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center text-xs text-gray-500">
                          <ClockIcon className="w-3 h-3 mr-1" />
                          {game.time}
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs">
                            <span className="text-blaze-600 font-medium">{game.prediction}</span>
                            <span className="text-gray-500 ml-1">({game.confidence}%)</span>
                          </div>
                          <QuickShareButton
                            title={`🏈 AI Prediction: ${game.teams}`}
                            description={`Prediction: ${game.prediction} (${game.confidence}% confidence) | ${game.title} - Get advanced sports analytics at Blaze Intelligence`}
                            size="sm"
                            variant="outline"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* Player Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-8 bg-white p-6 rounded-lg shadow-md border"
          >
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Featured Player Stats</h3>
            {playerStats.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {playerStats.slice(0, 6).map((player) => (
                  <div key={player.playerId} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-medium text-gray-900">{player.name}</p>
                        <p className="text-sm text-gray-600">{player.team} - {player.position}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-lg font-bold text-blaze-600">{player.performance.rating}</p>
                        <div className={`text-xs flex items-center ${
                          player.performance.trend === 'up' ? 'text-green-600' : 
                          player.performance.trend === 'down' ? 'text-red-600' : 'text-gray-600'
                        }`}>
                          {player.performance.trend === 'up' && <ArrowUpIcon className="w-3 h-3 mr-1" />}
                          {player.performance.trend === 'down' && <ArrowDownIcon className="w-3 h-3 mr-1" />}
                          {player.performance.trend.toUpperCase()}
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1">
                      {Object.entries(player.stats).map(([key, value]) => (
                        <div key={key} className="flex justify-between text-sm">
                          <span className="text-gray-600 capitalize">{key.replace('_', ' ')}</span>
                          <span className="font-medium">{value}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <UserGroupIcon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600">Player stats will appear here</p>
                <p className="text-xs text-gray-500">Check back for live player performance data</p>
              </div>
            )}
          </motion.div>

          {/* Upgrade Prompt for Free Users */}
          {user.subscription?.plan === 'free' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mt-8 bg-gradient-to-r from-blaze-500 to-blaze-600 p-6 rounded-lg shadow-md text-white"
            >
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold mb-2">Unlock Advanced Analytics</h3>
                  <p className="text-blaze-100">
                    Get AI predictions, detailed performance charts, and real-time insights
                  </p>
                </div>
                <div className="ml-6">
                  <button className="bg-white text-blaze-600 px-6 py-3 rounded-lg font-medium hover:bg-gray-100 transition-colors">
                    Upgrade Now
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
};

export default Dashboard;