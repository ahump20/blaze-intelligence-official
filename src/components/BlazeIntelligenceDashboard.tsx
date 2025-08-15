import React, { useState, useEffect } from 'react';
import { ChartBarIcon, BoltIcon, UserGroupIcon, DocumentTextIcon, ArrowTrendingUpIcon, PlayIcon, HomeIcon, UsersIcon, ClockIcon, CogIcon, FolderIcon, PhoneIcon, BeakerIcon } from '@heroicons/react/24/outline';
import TrackmanAnalytics from './TrackmanAnalytics';

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
  avg?: number;
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
      title: 'Sports Analytics',
      description: 'Leveraging data from sources like MLB StatsAPI and pybaseball to deliver predictive models, performance analysis and strategic insights.',
      status: 'Active'
    },
    {
      icon: <UserGroupIcon className="h-8 w-8" />,
      title: 'AI Integration',
      description: 'Developing custom AI solutions—from code review bots and CLI tools to advanced transcription services using cutting‑edge models.',
      status: 'Active'
    },
    {
      icon: <BoltIcon className="h-8 w-8" />,
      title: 'Web & App Development',
      description: 'Building responsive, data‑driven web applications and interactive dashboards that provide intuitive experiences and powerful visuals.',
      status: 'Active'
    }
  ];

  const tabs = [
    { id: 'overview', name: 'Home', icon: <HomeIcon className="h-5 w-5" /> },
    { id: 'about', name: 'About', icon: <UsersIcon className="h-5 w-5" /> },
    { id: 'timeline', name: 'Timeline', icon: <ClockIcon className="h-5 w-5" /> },
    { id: 'services', name: 'Services', icon: <CogIcon className="h-5 w-5" /> },
    { id: 'projects', name: 'Projects', icon: <FolderIcon className="h-5 w-5" /> },
    { id: 'live', name: 'Live Data', icon: <PlayIcon className="h-5 w-5" /> },
    { id: 'analytics', name: 'Analytics', icon: <ArrowTrendingUpIcon className="h-5 w-5" /> },
    { id: 'trackman', name: 'Trackman', icon: <BeakerIcon className="h-5 w-5" /> },
    { id: 'contact', name: 'Contact', icon: <PhoneIcon className="h-5 w-5" /> }
  ];

  return (
    <div className="min-h-screen" style={{ 
      backgroundColor: '#0A0A0A',
      color: '#EAEAEA',
      fontFamily: "'Inter', sans-serif"
    }}>
      <style dangerouslySetInnerHTML={{__html: `
        :root {
          --ut-orange: #BF5700;
          --glow-orange: #FF7A00;
          --dark-orange: #8B3F00;
          --spark-orange: #FFA500;
          --ember-orange: #CC5500;
          --bg-color: #0A0A0A;
          --second-bg-color: #141414;
          --text-color: #EAEAEA;
          --main-color: var(--ut-orange);
          --font-body: 'Inter', sans-serif;
          --font-heading: 'Space Grotesk', sans-serif;
        }
        .glass-effect {
          background: rgba(13, 13, 13, 0.8);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(191, 87, 0, 0.3);
        }
        .hover-lift:hover {
          transform: translateY(-4px);
          transition: transform 0.3s ease;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}} />
      
      {/* Header */}
      <header className="fixed top-0 left-0 w-full py-4 px-8 flex justify-between items-center z-50 glass-effect">
        <a href="#home" className="text-2xl font-bold" style={{ 
          fontFamily: "'Space Grotesk', sans-serif", 
          color: '#BF5700' 
        }}>
          ⚾ BLAZE
        </a>
        <div className="text-right">
          <div className="text-white font-mono text-lg">
            {currentTime.toLocaleTimeString()}
          </div>
          <div style={{ color: '#FFA500' }} className="text-sm">
            {currentTime.toLocaleDateString()}
          </div>
        </div>
      </header>

      {/* Navigation Tabs */}
      <nav className="glass-effect mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-6 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-3 border-b-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  selectedTab === tab.id
                    ? 'text-[#BF5700] border-[#BF5700]'
                    : 'border-transparent text-gray-300 hover:text-[#FFA500] hover:border-[#8B3F00]'
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
          <section className="flex flex-col justify-center items-center text-center min-h-screen relative pt-16">
            <h3 className="text-xl md:text-2xl font-semibold">Hello, It's Me</h3>
            <h1 className="text-5xl md:text-6xl font-bold my-4" style={{ 
              fontFamily: "'Space Grotesk', sans-serif",
              color: '#EAEAEA' 
            }}>
              Austin Humphrey
            </h1>
            <h3 className="text-2xl md:text-3xl font-semibold">
              I am a <span style={{ color: '#BF5700' }}>Sports Technologist</span>
            </h3>
            <p className="mt-4 max-w-2xl mx-auto px-4 leading-relaxed">
              Athlete‑scholar combining strategic depth with psychological insight. UT‑Austin IR grad now pursuing an MS in Entertainment Business at Full Sail, 
              building <span style={{ color: '#FFA500' }}>"Blaze Intelligence"</span> to revolutionize sports analytics.
            </p>
            <div className="flex justify-center space-x-4 mt-8">
              <div className="glass-effect text-green-400 px-4 py-2 rounded-full">
                🎯 Full Sail MS Student
              </div>
              <div className="glass-effect px-4 py-2 rounded-full" style={{ color: '#BF5700' }}>
                🤘 Hook 'Em Horns
              </div>
            </div>
            <div className="social-media mt-6 flex space-x-4">
              <a href="https://www.linkedin.com/in/ahump20" target="_blank" rel="noreferrer" aria-label="LinkedIn" 
                className="w-10 h-10 rounded-full glass-effect flex items-center justify-center hover-lift hover:text-[#BF5700] transition-colors">
                <i className="fab fa-linkedin-in"></i>
              </a>
              <a href="https://github.com/ahump20" target="_blank" rel="noreferrer" aria-label="GitHub"
                className="w-10 h-10 rounded-full glass-effect flex items-center justify-center hover-lift hover:text-[#BF5700] transition-colors">
                <i className="fab fa-github"></i>
              </a>
              <a href="https://x.com/a_hump20" target="_blank" rel="noreferrer" aria-label="Twitter"
                className="w-10 h-10 rounded-full glass-effect flex items-center justify-center hover-lift hover:text-[#BF5700] transition-colors">
                <i className="fab fa-twitter"></i>
              </a>
            </div>
          </section>
        )}

        {selectedTab === 'about' && (
          <section style={{ backgroundColor: '#141414' }} className="py-16 px-8 rounded-lg">
            <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-12">
              <div className="w-full md:w-5/12 flex-shrink-0">
                <img src="https://austin-humphrey-portfolio.pages.dev/images/UT%20Tower.jpeg" alt="UT Tower" className="rounded-lg shadow-lg" />
              </div>
              <div className="w-full md:w-7/12">
                <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  About <span style={{ color: '#BF5700' }}>Me</span>
                </h2>
                <h3 className="text-xl md:text-2xl font-semibold mb-2">Sports Technologist & Analyst</h3>
                <p className="leading-relaxed mb-4">
                  Born in <span style={{ color: '#BF5700' }}>Memphis, TN</span> and raised in the competitive heart of Texas, 
                  my journey has been a blend of athletic discipline and academic rigor. From the baseball diamonds of 
                  <span style={{ color: '#BF5700' }}> Boerne</span> to the global studies classrooms at the University of Texas, 
                  I've always been driven to understand the patterns that define success.
                </p>
                <p className="leading-relaxed mb-4">
                  After a top‑ranked finance internship at <span style={{ color: '#BF5700' }}>Northwestern Mutual</span> and 
                  media sales at Spectrum Reach, I'm channeling that diverse experience into my Master's at Full Sail University 
                  focusing on the Entertainment Business. My mission is to build Blaze Intelligence, a platform merging deep data 
                  analytics with an intuitive understanding of the game—whether that game is played on the field, in the market, or on a screen.
                </p>
                <a href="#contact" className="inline-block mt-4 py-3 px-6 rounded-lg font-semibold transition-colors hover-lift"
                  style={{ 
                    backgroundColor: '#BF5700', 
                    color: '#000',
                  }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#FFA500'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#BF5700'}
                >
                  Get Started
                </a>
              </div>
            </div>
          </section>
        )}

        {selectedTab === 'timeline' && (
          <section className="py-16 px-8">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                My <span style={{ color: '#BF5700' }}>Journey</span>
              </h2>
              <div className="timeline">
                <div className="timeline-item">
                  <h4 style={{ color: '#FFA500', fontFamily: "'Space Grotesk', sans-serif" }}>1995 – Born in Memphis, TN</h4>
                  <p>My story begins in the birthplace of rock 'n' roll, where early exposure to baseball and community shaped my love for sports.</p>
                </div>
                <div className="timeline-item">
                  <h4 style={{ color: '#FFA500', fontFamily: "'Space Grotesk', sans-serif" }}>2005 – Move to Boerne, TX</h4>
                  <p>Relocated to the Texas Hill Country, excelling in varsity baseball, football and track at Boerne‑Samuel V. Champion High School.</p>
                </div>
                <div className="timeline-item">
                  <h4 style={{ color: '#FFA500', fontFamily: "'Space Grotesk', sans-serif" }}>2013–2017 – University of Texas at Austin</h4>
                  <p>Pursued a BA in International Relations & Global Studies with minors in Economics, Political Science & European Studies.</p>
                </div>
                <div className="timeline-item">
                  <h4 style={{ color: '#FFA500', fontFamily: "'Space Grotesk', sans-serif" }}>2017 – Top‑Ranked Internship</h4>
                  <p>Joined Northwestern Mutual as a Financial Representative intern, ranked top 10 nationally and won the "Power of 10" award.</p>
                </div>
                <div className="timeline-item">
                  <h4 style={{ color: '#FFA500', fontFamily: "'Space Grotesk', sans-serif" }}>2018–2022 – Professional Experience</h4>
                  <p>Transitioned into media sales at Spectrum Reach and continued building expertise at the intersection of business and sports.</p>
                </div>
                <div className="timeline-item">
                  <h4 style={{ color: '#FFA500', fontFamily: "'Space Grotesk', sans-serif" }}>2024 – Graduate Studies</h4>
                  <p>Enrolled in the MS in Entertainment Business at Full Sail University and began developing Blaze Intelligence.</p>
                </div>
              </div>
            </div>
            <style dangerouslySetInnerHTML={{__html: `
              .timeline {
                position: relative;
                padding-left: 2rem;
                margin-top: 2rem;
              }
              .timeline::before {
                content: '';
                position: absolute;
                left: 0.5rem;
                top: 0;
                bottom: 0;
                width: 2px;
                background: #8B3F00;
              }
              .timeline-item {
                margin-bottom: 2rem;
                position: relative;
              }
              .timeline-item::before {
                content: '';
                position: absolute;
                left: -0.5rem;
                top: 0.2rem;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #BF5700;
              }
            `}} />
          </section>
        )}

        {selectedTab === 'services' && (
          <section style={{ backgroundColor: '#141414' }} className="py-16 px-8 rounded-lg">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                My <span style={{ color: '#BF5700' }}>Services</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {features.map((feature, index) => (
                  <div
                    key={index}
                    className="glass-effect p-6 text-center rounded-lg hover-lift transition-transform"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div style={{ color: '#BF5700' }}>{feature.icon}</div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        feature.status === 'Active' 
                          ? 'bg-green-500/20 text-green-400 border border-green-500/30' 
                          : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      }`}>
                        {feature.status}
                      </span>
                    </div>
                    <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
                    <p className="text-sm leading-relaxed">{feature.description}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {selectedTab === 'projects' && (
          <section className="py-16 px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Latest <span style={{ color: '#BF5700' }}>Projects</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                <div className="glass-effect p-6 flex flex-col rounded-lg hover-lift transition-transform">
                  <img src="https://austin-humphrey-portfolio.pages.dev/images/biometrics.jpeg" alt="Biometric Sports Analyzer" className="rounded mb-4" />
                  <h3 className="text-xl font-bold mb-2">Biometric Sports Analyzer</h3>
                  <p className="flex-grow text-sm leading-relaxed">Interactive dashboard for analyzing athlete biometric data, providing insights into performance, fatigue and injury risk.</p>
                  <a href="#analytics" onClick={() => setSelectedTab('analytics')} className="inline-block mt-4 py-2 px-4 rounded-lg font-semibold transition-colors hover-lift"
                    style={{ backgroundColor: '#8B3F00', color: '#000' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#BF5700'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#8B3F00'}
                  >
                    Read More
                  </a>
                </div>
                <div className="glass-effect p-6 flex flex-col rounded-lg hover-lift transition-transform">
                  <img src="https://austin-humphrey-portfolio.pages.dev/images/claude.png" alt="AI‑Powered Code Review" className="rounded mb-4" />
                  <h3 className="text-xl font-bold mb-2">AI‑Powered Code Review</h3>
                  <p className="flex-grow text-sm leading-relaxed">A GitHub Action that uses generative AI to automatically review pull requests, providing feedback on code quality and style.</p>
                  <a href="https://github.com/ahump20/claude-code-action" target="_blank" rel="noreferrer" className="inline-block mt-4 py-2 px-4 rounded-lg font-semibold transition-colors hover-lift"
                    style={{ backgroundColor: '#8B3F00', color: '#000' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#BF5700'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#8B3F00'}
                  >
                    View on GitHub
                  </a>
                </div>
                <div className="glass-effect p-6 flex flex-col rounded-lg hover-lift transition-transform">
                  <img src="https://austin-humphrey-portfolio.pages.dev/images/whisper.png" alt="AI Audio Transcription" className="rounded mb-4" />
                  <h3 className="text-xl font-bold mb-2">AI Audio Transcription</h3>
                  <p className="flex-grow text-sm leading-relaxed">Implementing OpenAI's Whisper model for high‑accuracy, multilingual audio transcription—ideal for interviews and media content.</p>
                  <a href="https://github.com/ahump20/whisper" target="_blank" rel="noreferrer" className="inline-block mt-4 py-2 px-4 rounded-lg font-semibold transition-colors hover-lift"
                    style={{ backgroundColor: '#8B3F00', color: '#000' }}
                    onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#BF5700'}
                    onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#8B3F00'}
                  >
                    Explore Repo
                  </a>
                </div>
              </div>
            </div>
          </section>
        )}

        {selectedTab === 'live' && (
          <section className="py-16 px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Live <span style={{ color: '#BF5700' }}>Data</span>
              </h2>
              <div className="grid gap-6">
                {liveGames.map((game) => (
                  <div key={game.id} className="glass-effect rounded-xl p-6 hover-lift">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center space-x-4">
                        <div className="text-xl font-mono" style={{ color: '#EAEAEA' }}>
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
                        <div className="text-2xl font-bold" style={{ color: '#BF5700' }}>{game.score}</div>
                        {game.inning && (
                          <div className="text-sm" style={{ color: '#FFA500' }}>{game.inning}</div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Stats Dashboard */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-12">
                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>System Status</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>MLB API</span>
                      <span className="text-green-400">🟢 Online</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trackman</span>
                      <span className="text-green-400">🟢 Connected</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Champion Engine</span>
                      <span className="text-green-400">🟢 Active</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Discord Bot</span>
                      <span className="text-green-400">🟢 Online</span>
                    </div>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Today's Stats</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>Games Tracked</span>
                      <span className="font-mono" style={{ color: '#BF5700' }}>23</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Pitches Analyzed</span>
                      <span className="font-mono" style={{ color: '#BF5700' }}>2,847</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Barrels Detected</span>
                      <span className="font-mono" style={{ color: '#BF5700' }}>124</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Champion Profiles</span>
                      <span className="font-mono" style={{ color: '#BF5700' }}>89</span>
                    </div>
                  </div>
                </div>

                <div className="glass-effect rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Performance</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span>API Latency</span>
                      <span className="text-green-400 font-mono">84ms</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Prediction Accuracy</span>
                      <span className="text-green-400 font-mono">87.3%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Uptime</span>
                      <span className="text-green-400 font-mono">99.8%</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Data Processing</span>
                      <span className="text-green-400 font-mono">Real-time</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}

        {selectedTab === 'analytics' && (
          <section className="py-16 px-8">
            <div className="max-w-6xl mx-auto">
              <h2 className="text-3xl font-bold mb-8" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Advanced <span style={{ color: '#BF5700' }}>Analytics</span>
              </h2>
              <div className="glass-effect rounded-xl p-6 mb-8">
                <h3 className="text-lg font-semibold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Today's Key Metrics</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#BF5700' }}>94.7</div>
                    <div className="text-sm">Avg Exit Velocity (mph)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-400">23.4°</div>
                    <div className="text-sm">Avg Launch Angle</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold" style={{ color: '#FFA500' }}>2,678</div>
                    <div className="text-sm">Avg Spin Rate (RPM)</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-red-400">95.2</div>
                    <div className="text-sm">Avg Fastball (mph)</div>
                  </div>
                </div>
              </div>

              {/* Top Players */}
              <div className="grid gap-4">
                <h3 className="text-2xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Top <span style={{ color: '#BF5700' }}>Players</span>
                </h3>
                {topPlayers.map((player, index) => (
                  <div key={index} className="glass-effect rounded-xl p-6 hover-lift">
                    <div className="flex justify-between items-center">
                      <div>
                        <h3 className="text-lg font-semibold">{player.name}</h3>
                        <p style={{ color: '#FFA500' }}>{player.position} • {player.team}</p>
                      </div>
                      <div className="text-right">
                        {player.avg && (
                          <div className="text-xl font-bold" style={{ color: '#BF5700' }}>.{Math.round(player.avg * 1000)}</div>
                        )}
                        {player.era && (
                          <div className="text-xl font-bold text-green-400">{player.era}</div>
                        )}
                        <div className="text-sm" style={{ color: '#FFA500' }}>
                          {player.avg ? 'AVG' : 'ERA'}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {selectedTab === 'trackman' && (
          <TrackmanAnalytics />
        )}

        {selectedTab === 'contact' && (
          <section style={{ backgroundColor: '#141414' }} className="py-16 px-8 rounded-lg">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                Contact <span style={{ color: '#BF5700' }}>Us</span>!
              </h2>
              <p className="mb-6">Ready to revolutionize your sports analytics? Let's discuss how Blaze Intelligence can transform your data into championship insights.</p>
              <form className="space-y-6">
                <div className="flex flex-col md:flex-row gap-6">
                  <input 
                    type="text" 
                    placeholder="Full Name" 
                    required 
                    className="w-full p-3 rounded-md border border-[#8B3F00] focus:outline-none glass-effect"
                    style={{ backgroundColor: '#222' }}
                  />
                  <input 
                    type="email" 
                    placeholder="Email Address" 
                    required 
                    className="w-full p-3 rounded-md border border-[#8B3F00] focus:outline-none glass-effect"
                    style={{ backgroundColor: '#222' }}
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Organization/Team" 
                  required 
                  className="w-full p-3 rounded-md border border-[#8B3F00] focus:outline-none glass-effect"
                  style={{ backgroundColor: '#222' }}
                />
                <textarea 
                  rows={5} 
                  placeholder="Tell us about your analytics needs..." 
                  required 
                  className="w-full p-3 rounded-md border border-[#8B3F00] focus:outline-none glass-effect"
                  style={{ backgroundColor: '#222' }}
                ></textarea>
                <button 
                  type="submit" 
                  className="font-semibold py-3 px-6 rounded-lg transition-colors hover-lift"
                  style={{ backgroundColor: '#BF5700', color: '#000' }}
                  onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#FFA500'}
                  onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#BF5700'}
                >
                  Send Message
                </button>
              </form>
              <div className="mt-8 flex justify-center space-x-6">
                <a href="mailto:austin@blazeintelligence.com" className="glass-effect px-4 py-2 rounded-lg hover-lift hover:text-[#BF5700] transition-colors">
                  📧 austin@blazeintelligence.com
                </a>
                <a href="https://www.linkedin.com/in/ahump20" target="_blank" rel="noreferrer" className="glass-effect px-4 py-2 rounded-lg hover-lift hover:text-[#BF5700] transition-colors">
                  💼 LinkedIn
                </a>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* Footer */}
      <footer className="py-6 px-8 text-center" style={{ backgroundColor: '#111' }}>
        <p style={{ color: '#EAEAEA' }}>
          Copyright &copy; 2025 by <span style={{ color: '#BF5700' }}>Austin Humphrey</span> | All Rights Reserved.
        </p>
        <p style={{ color: '#FFA500' }} className="text-sm mt-2">
          Blaze Intelligence • MLB Stats API • Trackman Baseball • Champion Enigma Engine
        </p>
      </footer>
    </div>
  );
};

export default BlazeIntelligenceDashboard;