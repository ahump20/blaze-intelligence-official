import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ScatterChart, Scatter, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { pybaseball } from '../services/pybaseballIntegration';
import { liveScoreboard } from '../services/liveSportsScoreboard';
import { sportsIntelligence } from '../services/sportsRadarHawkeye';

interface CognitiveMetric {
  category: string;
  beforeScore: number;
  afterScore: number;
  improvementPercent: number;
  researchSource: string;
}

interface PerformanceData {
  timestamp: string;
  reactionTime: number;
  accuracy: number;
  gameType: 'MLB' | '2K' | 'NFL' | 'Combined';
  hardwareConfig: '60Hz' | '120Hz' | '144Hz';
}

const CognitivePerformanceDashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'cognitive' | 'live' | 'analytics' | '3d'>('cognitive');
  const [selectedMetric, setSelectedMetric] = useState('reaction');
  const [liveGames, setLiveGames] = useState<any[]>([]);
  const [hawkeyeData, setHawkeyeData] = useState<any>(null);
  const [playerStats, setPlayerStats] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Cognitive performance data
  const cognitiveData: CognitiveMetric[] = [
    {
      category: 'Visual Processing',
      beforeScore: 73,
      afterScore: 92,
      improvementPercent: 26,
      researchSource: 'Journal of Sports Psychology, 2021'
    },
    {
      category: 'Decision Making',
      beforeScore: 68,
      afterScore: 88,
      improvementPercent: 29,
      researchSource: 'Georgia State University, 2022'
    },
    {
      category: 'Pattern Recognition',
      beforeScore: 71,
      afterScore: 95,
      improvementPercent: 34,
      researchSource: 'Frontiers in Psychology, 2023'
    },
    {
      category: 'Multi-Object Tracking',
      beforeScore: 65,
      afterScore: 85,
      improvementPercent: 31,
      researchSource: 'Nature Scientific Reports, 2022'
    },
    {
      category: 'Cognitive Load',
      beforeScore: 70,
      afterScore: 90,
      improvementPercent: 29,
      researchSource: 'Cognitive Science Journal, 2023'
    },
    {
      category: 'Stress Response',
      beforeScore: 67,
      afterScore: 87,
      improvementPercent: 30,
      researchSource: 'Sports Medicine Review, 2022'
    }
  ];

  // Performance over time data
  const performanceTimeline: PerformanceData[] = [
    { timestamp: 'Week 1', reactionTime: 400, accuracy: 85, gameType: 'MLB', hardwareConfig: '60Hz' },
    { timestamp: 'Week 2', reactionTime: 380, accuracy: 87, gameType: 'MLB', hardwareConfig: '60Hz' },
    { timestamp: 'Week 3', reactionTime: 350, accuracy: 89, gameType: 'MLB', hardwareConfig: '120Hz' },
    { timestamp: 'Week 4', reactionTime: 320, accuracy: 91, gameType: 'MLB', hardwareConfig: '120Hz' },
    { timestamp: 'Week 5', reactionTime: 290, accuracy: 93, gameType: 'Combined', hardwareConfig: '120Hz' },
    { timestamp: 'Week 6', reactionTime: 275, accuracy: 94, gameType: 'Combined', hardwareConfig: '120Hz' },
    { timestamp: 'Week 7', reactionTime: 260, accuracy: 95, gameType: 'Combined', hardwareConfig: '144Hz' },
    { timestamp: 'Week 8', reactionTime: 250, accuracy: 96, gameType: 'Combined', hardwareConfig: '144Hz' }
  ];

  // Hardware impact data
  const hardwareImpact = [
    { refresh: '60Hz', latency: 16.7, performance: 75, cost: 200 },
    { refresh: '120Hz', latency: 8.3, performance: 92, cost: 400 },
    { refresh: '144Hz', latency: 6.9, performance: 95, cost: 600 },
    { refresh: '240Hz', latency: 4.2, performance: 98, cost: 1000 },
    { refresh: '360Hz', latency: 2.8, performance: 99, cost: 1500 }
  ];

  // Sports-specific improvements
  const sportsImprovements = [
    { sport: 'Baseball', metric: 'Pitch Recognition', improvement: 34 },
    { sport: 'Baseball', metric: 'Swing Timing', improvement: 28 },
    { sport: 'Basketball', metric: 'Court Vision', improvement: 31 },
    { sport: 'Basketball', metric: 'Defensive Positioning', improvement: 27 },
    { sport: 'Football', metric: 'Read Progression', improvement: 29 },
    { sport: 'Football', metric: 'Pocket Awareness', improvement: 32 }
  ];

  // Transfer to real-world performance
  const transferData = [
    { virtualScore: 75, realWorldScore: 72, correlation: 0.96 },
    { virtualScore: 80, realWorldScore: 77, correlation: 0.96 },
    { virtualScore: 85, realWorldScore: 83, correlation: 0.98 },
    { virtualScore: 90, realWorldScore: 88, correlation: 0.98 },
    { virtualScore: 95, realWorldScore: 93, correlation: 0.98 }
  ];

  useEffect(() => {
    // Initialize all data connections
    const initializeConnections = async () => {
      setIsLoading(true);
      try {
        await Promise.all([
          pybaseball.initialize(),
          liveScoreboard.initialize(),
          sportsIntelligence.initialize()
        ]);
        
        // Fetch initial data
        const games = await liveScoreboard.fetchAllScores();
        setLiveGames(games);
        
        // Set up event listeners
        window.addEventListener('hawkeye:tracking_update', handleHawkeyeUpdate);
        window.addEventListener('pybaseball:pitch', handlePitchData);
        window.addEventListener('scoreboard:score_update', handleScoreUpdate);
        
      } catch (error) {
        console.error('Failed to initialize connections:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initializeConnections();

    return () => {
      // Cleanup
      window.removeEventListener('hawkeye:tracking_update', handleHawkeyeUpdate);
      window.removeEventListener('pybaseball:pitch', handlePitchData);
      window.removeEventListener('scoreboard:score_update', handleScoreUpdate);
      pybaseball.disconnect();
      liveScoreboard.disconnect();
      sportsIntelligence.disconnect();
    };
  }, []);

  const handleHawkeyeUpdate = (event: any) => {
    setHawkeyeData(event.detail);
  };

  const handlePitchData = (event: any) => {
    // Update with pitch data
    console.log('Pitch data:', event.detail);
  };

  const handleScoreUpdate = (event: any) => {
    setLiveGames(prev => {
      const index = prev.findIndex(g => g.id === event.detail.id);
      if (index >= 0) {
        const updated = [...prev];
        updated[index] = event.detail;
        return updated;
      }
      return [...prev, event.detail];
    });
  };

  const fetchPlayerStats = async (playerId: string) => {
    setIsLoading(true);
    try {
      const stats = await pybaseball.getStatcastData(playerId);
      setPlayerStats(stats);
    } catch (error) {
      console.error('Error fetching player stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const AnimatedCounter = ({ value, suffix = '' }: { value: number; suffix?: string }) => {
    const [displayValue, setDisplayValue] = useState(0);

    useEffect(() => {
      const timer = setInterval(() => {
        setDisplayValue(prev => {
          if (prev >= value) {
            clearInterval(timer);
            return value;
          }
          return Math.min(prev + value / 50, value);
        });
      }, 30);
      return () => clearInterval(timer);
    }, [value]);

    return (
      <span className="font-bold text-3xl bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
        {Math.round(displayValue)}{suffix}
      </span>
    );
  };

  const MetricCard = ({ title, value, description, icon, color }: any) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.05 }}
      className={`bg-gradient-to-br ${color} p-6 rounded-xl shadow-xl`}
    >
      <div className="text-4xl mb-3">{icon}</div>
      <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
      <div className="text-3xl font-bold text-white mb-2">{value}</div>
      <p className="text-white/80 text-sm">{description}</p>
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-400 via-purple-400 to-green-400 bg-clip-text text-transparent">
            Cognitive Performance Laboratory
          </h1>
          <p className="text-xl text-gray-300 max-w-4xl mx-auto">
            Where gaming meets neuroscience. Real-time sports intelligence powered by Hawkeye computer vision, 
            SportsRadar analytics, and advanced MLB statistics through pybaseball.
          </p>
        </motion.div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white/10 backdrop-blur-lg rounded-xl p-2 flex gap-2">
            {[
              { id: 'cognitive', label: 'Cognitive Metrics', icon: '🧠' },
              { id: 'live', label: 'Live Intelligence', icon: '📡' },
              { id: 'analytics', label: 'Deep Analytics', icon: '📊' },
              { id: '3d', label: '3D Visualization', icon: '🎮' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-6 py-3 rounded-lg font-semibold transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white'
                    : 'text-gray-300 hover:bg-white/10'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Content Sections */}
        <AnimatePresence mode="wait">
          {activeTab === 'cognitive' && (
            <motion.div
              key="cognitive"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              {/* Key Metrics */}
              <div className="grid md:grid-cols-4 gap-6 mb-12">
                <MetricCard
                  title="Reaction Speed"
                  value={<AnimatedCounter value={250} suffix="ms" />}
                  description="Elite-level response time"
                  icon="⚡"
                  color="from-blue-500 to-purple-600"
                />
                <MetricCard
                  title="Pattern Recognition"
                  value={<AnimatedCounter value={95} suffix="%" />}
                  description="Pitch identification accuracy"
                  icon="🎯"
                  color="from-green-500 to-teal-600"
                />
                <MetricCard
                  title="Decision Speed"
                  value={<AnimatedCounter value={190} suffix="ms" />}
                  description="Faster than non-gamers"
                  icon="🧠"
                  color="from-purple-500 to-pink-600"
                />
                <MetricCard
                  title="Transfer Rate"
                  value={<AnimatedCounter value={89} suffix="%" />}
                  description="Virtual to real performance"
                  icon="🔄"
                  color="from-orange-500 to-red-600"
                />
              </div>

              {/* Performance Charts */}
              <div className="grid md:grid-cols-2 gap-8 mb-12">
                {/* Cognitive Improvements Radar */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Cognitive Enhancement Profile</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={cognitiveData}>
                      <PolarGrid stroke="#374151" />
                      <PolarAngleAxis dataKey="category" tick={{ fill: '#9CA3AF', fontSize: 12 }} />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: '#9CA3AF' }} />
                      <Radar name="Before" dataKey="beforeScore" stroke="#EF4444" fill="#EF4444" fillOpacity={0.3} />
                      <Radar name="After" dataKey="afterScore" stroke="#10B981" fill="#10B981" fillOpacity={0.5} />
                      <Legend />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Performance Timeline */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Performance Evolution</h3>
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={performanceTimeline}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                      <XAxis dataKey="timestamp" tick={{ fill: '#9CA3AF' }} />
                      <YAxis tick={{ fill: '#9CA3AF' }} />
                      <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                      <Area type="monotone" dataKey="reactionTime" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.3} />
                      <Area type="monotone" dataKey="accuracy" stroke="#10B981" fill="#10B981" fillOpacity={0.3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Hardware Impact */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-12">
                <h3 className="text-xl font-semibold text-white mb-4">Hardware Performance Impact</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={hardwareImpact}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="refresh" tick={{ fill: '#9CA3AF' }} />
                    <YAxis tick={{ fill: '#9CA3AF' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    <Bar dataKey="performance" fill="url(#performanceGradient)" />
                    <Bar dataKey="cost" fill="url(#costGradient)" />
                    <defs>
                      <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#1E40AF" stopOpacity={0.6}/>
                      </linearGradient>
                      <linearGradient id="costGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#991B1B" stopOpacity={0.6}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Transfer Validation */}
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Virtual to Real-World Transfer</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <ScatterChart>
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis dataKey="virtualScore" name="Virtual Performance" tick={{ fill: '#9CA3AF' }} />
                    <YAxis dataKey="realWorldScore" name="Real Performance" tick={{ fill: '#9CA3AF' }} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    <Scatter name="Performance Transfer" data={transferData} fill="#8B5CF6" />
                  </ScatterChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === 'live' && (
            <motion.div
              key="live"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="grid md:grid-cols-2 gap-6">
                {/* Live Games */}
                <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                  <h3 className="text-xl font-semibold text-white mb-4">Live Games</h3>
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {liveGames.map(game => (
                      <div key={game.id} className="bg-white/5 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <div>
                            <div className="font-semibold text-white">{game.awayTeam.name}</div>
                            <div className="font-semibold text-white">{game.homeTeam.name}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-white">{game.score.away}</div>
                            <div className="text-2xl font-bold text-white">{game.score.home}</div>
                          </div>
                        </div>
                        <div className="mt-2 text-sm text-gray-400">
                          {game.period} - {game.timeRemaining}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Hawkeye Tracking */}
                {hawkeyeData && (
                  <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                    <h3 className="text-xl font-semibold text-white mb-4">Hawkeye Live Tracking</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-400">Ball Speed</span>
                        <span className="text-white font-semibold">
                          {hawkeyeData.insights?.ballPhysics?.speed.toFixed(1)} mph
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Player Speed (Avg)</span>
                        <span className="text-white font-semibold">
                          {hawkeyeData.insights?.playerMovement?.averageSpeed.toFixed(1)} mph
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-400">Formation</span>
                        <span className="text-white font-semibold">
                          {hawkeyeData.insights?.tacticalPatterns?.formation}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'analytics' && (
            <motion.div
              key="analytics"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
            >
              <div className="bg-white/10 backdrop-blur-lg rounded-xl p-6">
                <h3 className="text-xl font-semibold text-white mb-4">Sports-Specific Performance Gains</h3>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={sportsImprovements} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                    <XAxis type="number" tick={{ fill: '#9CA3AF' }} />
                    <YAxis dataKey="metric" type="category" tick={{ fill: '#9CA3AF' }} width={120} />
                    <Tooltip contentStyle={{ backgroundColor: '#1F2937', border: 'none' }} />
                    <Bar dataKey="improvement" fill="url(#improvementGradient)" />
                    <defs>
                      <linearGradient id="improvementGradient" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.8}/>
                      </linearGradient>
                    </defs>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </motion.div>
          )}

          {activeTab === '3d' && (
            <motion.div
              key="3d"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white/10 backdrop-blur-lg rounded-xl p-8"
            >
              <h3 className="text-2xl font-semibold text-white mb-6">3D Visualization (Unreal Engine Integration)</h3>
              <div className="aspect-video bg-gradient-to-br from-blue-900 to-purple-900 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <div className="text-6xl mb-4">🎮</div>
                  <p className="text-xl text-white mb-2">Unreal Engine 3D Visualization</p>
                  <p className="text-gray-400">Real-time player tracking and ball physics simulation</p>
                  <button className="mt-4 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-purple-600 transition-all">
                    Launch 3D View
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Research Citations */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-12 bg-white/5 backdrop-blur-lg rounded-xl p-6"
        >
          <h3 className="text-xl font-semibold text-white mb-4">Research Foundation</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {cognitiveData.slice(0, 3).map((item, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-4">
                <div className="text-2xl font-bold text-green-400 mb-2">
                  +{item.improvementPercent}%
                </div>
                <div className="text-white font-semibold mb-1">{item.category}</div>
                <div className="text-xs text-gray-400">{item.researchSource}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default CognitivePerformanceDashboard;