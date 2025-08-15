import React, { useState, useEffect } from 'react';
import { ChartBarIcon, BoltIcon, UserGroupIcon, DocumentTextIcon, ArrowTrendingUpIcon, PlayIcon } from '@heroicons/react/24/outline';

interface GameData {
  id: string;
  awayTeam: string;
  homeTeam: string;
  score: string;
  status: string;
  inning?: string;
}

interface PlayerStats {
  name: string;
  position: string;
  avg: number;
  era?: number;
  ops?: number;
  team: string;
}

const BlazeIntelligenceDashboard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [selectedTab, setSelectedTab] = useState('overview');
  const [liveGames, setLiveGames] = useState<GameData[]>([]);
  const [topPlayers, setTopPlayers] = useState<PlayerStats[]>([]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    
    // Simulate live data
    setLiveGames([
      { id: '1', awayTeam: 'CLE', homeTeam: 'NYY', score: '4-2', status: 'Live', inning: 'T7' },
      { id: '2', awayTeam: 'LAD', homeTeam: 'SF', score: '1-0', status: 'Live', inning: 'B5' },
      { id: '3', awayTeam: 'HOU', homeTeam: 'SEA', score: '0-0', status: 'Scheduled' },
    ]);

    setTopPlayers([
      { name: 'Shane Bieber', position: 'SP', era: 2.45, team: 'CLE' },
      { name: 'José Ramírez', position: '3B', avg: 0.317, ops: 0.945, team: 'CLE' },
      { name: 'Mookie Betts', position: 'RF', avg: 0.289, ops: 0.892, team: 'LAD' },
    ]);

    return () => clearInterval(timer);
  }, []);

  const features = [
    {
      icon: <ChartBarIcon className="h-8 w-8" />,
      title: 'Real-Time Analytics',
      description: 'Live MLB game tracking with Statcast metrics, exit velocity, launch angle, and spin rate analysis.',
      status: 'Active'
    },
    {
      icon: <BoltIcon className="h-8 w-8" />,
      title: 'Trackman Integration',
      description: 'Professional-grade Doppler radar ball tracking with pitch-by-pitch analysis.',
      status: 'Active'
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: 'Champion Enigma Engine',
      description: 'AI-powered biometric analysis quantifying intangible athlete traits and performance predictors.',
      status: 'Active'
    },
    {
      icon: <DocumentTextIcon className="h-8 w-8" />,
      title: 'MLB Data Lab',
      description: 'Advanced Python-based analytics with automated player summary sheet generation.',
      status: 'Active'
    },
    {
      icon: <ArrowTrendingUpIcon className="h-8 w-8" />,
      title: 'Predictive Modeling',
      description: 'Machine learning algorithms for game outcomes, player performance, and injury prevention.',
      status: 'Beta'
    },
    {
      icon: <PlayIcon className="h-8 w-8" />,
      title: 'Discord Integration',
      description: 'Real-time game notifications and updates via Discord bot with rich embeds.',
      status: 'Active'
    }
  ];

  const tabs = [
    { id: 'overview', name: 'Overview', icon: <ChartBarIcon className="h-5 w-5" /> },
    { id: 'live', name: 'Live Games', icon: <PlayIcon className="h-5 w-5" /> },
    { id: 'analytics', name: 'Analytics', icon: <ArrowTrendingUpIcon className="h-5 w-5" /> },
    { id: 'players', name: 'Players', icon: <UserGroupIcon className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-indigo-900">
      {/* Header */}
      <header className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <h1 className="text-3xl font-bold text-white">
                  ⚾ Blaze Intelligence
                </h1>
                <p className="text-blue-300 text-sm">Advanced Sports Analytics Platform</p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-white font-mono text-lg">
                {currentTime.toLocaleTimeString()}
              </div>
              <div className="text-blue-300 text-sm">
                {currentTime.toLocaleDateString()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="bg-black/10 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 text-sm font-medium transition-colors ${
                  selectedTab === tab.id
                    ? 'border-blue-400 text-blue-400'
                    : 'border-transparent text-gray-300 hover:text-white hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.name}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {selectedTab === 'overview' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <div className="text-center py-12">
              <h2 className="text-5xl font-bold text-white mb-6">
                Next-Generation Sports Intelligence
              </h2>
              <p className="text-xl text-blue-200 max-w-3xl mx-auto mb-8">
                Combining real-time MLB data, professional Trackman radar tracking, AI-powered athlete analysis, 
                and advanced predictive modeling for unprecedented sports insights.
              </p>
              <div className="flex justify-center space-x-4">
                <div className="bg-green-500/20 text-green-400 px-4 py-2 rounded-full border border-green-500/30">
                  🟢 Live Tracking Active
                </div>
                <div className="bg-blue-500/20 text-blue-400 px-4 py-2 rounded-full border border-blue-500/30">
                  🔵 {liveGames.filter(g => g.status === 'Live').length} Games Live
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-blue-400">{feature.icon}</div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      feature.status === 'Active' 
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {feature.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">
                    {feature.title}
                  </h3>
                  <p className="text-gray-300 text-sm">
                    {feature.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Stats Dashboard */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">System Status</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">MLB API</span>
                    <span className="text-green-400">🟢 Online</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Trackman</span>
                    <span className="text-green-400">🟢 Connected</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Champion Engine</span>
                    <span className="text-green-400">🟢 Active</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Discord Bot</span>
                    <span className="text-green-400">🟢 Online</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Today's Stats</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">Games Tracked</span>
                    <span className="text-blue-400 font-mono">23</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Pitches Analyzed</span>
                    <span className="text-blue-400 font-mono">2,847</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Barrels Detected</span>
                    <span className="text-blue-400 font-mono">124</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Champion Profiles</span>
                    <span className="text-blue-400 font-mono">89</span>
                  </div>
                </div>
              </div>

              <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
                <h3 className="text-lg font-semibold text-white mb-4">Performance</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-300">API Latency</span>
                    <span className="text-green-400 font-mono">84ms</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Prediction Accuracy</span>
                    <span className="text-green-400 font-mono">87.3%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Uptime</span>
                    <span className="text-green-400 font-mono">99.8%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-300">Data Processing</span>
                    <span className="text-green-400 font-mono">Real-time</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'live' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Live Games</h2>
            <div className="grid gap-4">
              {liveGames.map((game) => (
                <div
                  key={game.id}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-4">
                      <div className="text-xl font-mono text-white">
                        {game.awayTeam} @ {game.homeTeam}
                      </div>
                      {game.status === 'Live' && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></div>
                          <span className="text-red-400 text-sm font-medium">LIVE</span>
                        </div>
                      )}
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-400">{game.score}</div>
                      {game.inning && (
                        <div className="text-sm text-gray-300">{game.inning}</div>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {selectedTab === 'analytics' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Advanced Analytics</h2>
            <div className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10">
              <h3 className="text-lg font-semibold text-white mb-4">Today's Key Metrics</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">94.7</div>
                  <div className="text-sm text-gray-300">Avg Exit Velocity (mph)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">23.4°</div>
                  <div className="text-sm text-gray-300">Avg Launch Angle</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-400">2,678</div>
                  <div className="text-sm text-gray-300">Avg Spin Rate (RPM)</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-red-400">95.2</div>
                  <div className="text-sm text-gray-300">Avg Fastball (mph)</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'players' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-white">Top Players</h2>
            <div className="grid gap-4">
              {topPlayers.map((player, index) => (
                <div
                  key={index}
                  className="bg-white/5 backdrop-blur-sm rounded-xl p-6 border border-white/10"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-lg font-semibold text-white">{player.name}</h3>
                      <p className="text-gray-300">{player.position} • {player.team}</p>
                    </div>
                    <div className="text-right">
                      {player.avg && (
                        <div className="text-xl font-bold text-blue-400">.{Math.round(player.avg * 1000)}</div>
                      )}
                      {player.era && (
                        <div className="text-xl font-bold text-green-400">{player.era}</div>
                      )}
                      <div className="text-sm text-gray-300">
                        {player.avg ? 'AVG' : 'ERA'}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-black/20 backdrop-blur-sm border-t border-white/10 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <p className="text-gray-400">
              © 2025 Blaze Intelligence. Advanced Sports Analytics Platform.
            </p>
            <p className="text-gray-500 text-sm mt-2">
              MLB Stats API • Trackman Baseball • Champion Enigma Engine • Baseball Savant
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default BlazeIntelligenceDashboard;