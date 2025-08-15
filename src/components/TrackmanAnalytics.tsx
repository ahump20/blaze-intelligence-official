import React, { useState, useEffect } from 'react';
import { ChartBarIcon, FireIcon, BeakerIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';
import { Line, Bar, Scatter, Radar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  RadialLinearScale,
  ArcElement
);

const TrackmanAnalytics: React.FC = () => {
  const [selectedView, setSelectedView] = useState('overview');
  const [selectedPitcher, setSelectedPitcher] = useState('all');
  const [selectedBatter, setSelectedBatter] = useState('all');
  const [selectedPitchType, setSelectedPitchType] = useState<string[]>([]);
  const [strikeZoneData, setStrikeZoneData] = useState<any>(null);

  // Sample Trackman data structure
  const pitchTypes = {
    'FF': 'Four-Seamer',
    'ST': 'Sinker/Two-Seamer',
    'CT': 'Cutter',
    'SL': 'Slider',
    'CR': 'Curveball',
    'CH': 'Changeup',
    'SP': 'Splitter'
  };

  const features = [
    {
      id: 'pitch-visualizer',
      title: 'Pitch-by-Pitch Visualizer',
      description: '15+ interactive graphs analyzing every pitch with Trackman precision',
      icon: <ChartBarIcon className="h-6 w-6" />,
      metrics: ['Velocity', 'Spin Rate', 'Movement', 'Release Point']
    },
    {
      id: 'strike-zone',
      title: 'Strike Zone Analytics',
      description: 'Advanced heat maps and zone analysis with umpire tendencies',
      icon: <CubeTransparentIcon className="h-6 w-6" />,
      metrics: ['Zone %', 'Chase Rate', 'Whiff %', 'xwOBA']
    },
    {
      id: 'spray-charts',
      title: 'Spray Charts & Batted Balls',
      description: 'Visual analysis of hit locations and batted ball outcomes',
      icon: <FireIcon className="h-6 w-6" />,
      metrics: ['Exit Velocity', 'Launch Angle', 'Distance', 'Hit Probability']
    },
    {
      id: 'predictive-models',
      title: 'AI Predictive Models',
      description: 'Machine learning models for xwOBA and performance prediction',
      icon: <BeakerIcon className="h-6 w-6" />,
      metrics: ['xwOBA', 'xBA', 'Pitch Quality', 'Outcome Probability']
    }
  ];

  // Sample data for visualization
  const velocityData = {
    labels: ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5'],
    datasets: [
      {
        label: 'Fastball Velocity (mph)',
        data: [94.2, 93.8, 95.1, 94.5, 93.9],
        borderColor: '#BF5700',
        backgroundColor: 'rgba(191, 87, 0, 0.1)',
        tension: 0.4
      },
      {
        label: 'Breaking Ball Velocity (mph)',
        data: [82.3, 81.9, 83.2, 82.7, 82.1],
        borderColor: '#FFA500',
        backgroundColor: 'rgba(255, 165, 0, 0.1)',
        tension: 0.4
      }
    ]
  };

  const spinRateData = {
    labels: ['FF', 'ST', 'CT', 'SL', 'CR', 'CH'],
    datasets: [
      {
        label: 'Average Spin Rate (RPM)',
        data: [2312, 2145, 2456, 2678, 2789, 1432],
        backgroundColor: [
          'rgba(191, 87, 0, 0.8)',
          'rgba(255, 165, 0, 0.8)',
          'rgba(139, 63, 0, 0.8)',
          'rgba(255, 140, 0, 0.8)',
          'rgba(210, 105, 30, 0.8)',
          'rgba(255, 191, 0, 0.8)'
        ]
      }
    ]
  };

  const zoneData = {
    labels: ['Zone 1', 'Zone 2', 'Zone 3', 'Zone 4', 'Zone 5', 'Zone 6', 'Zone 7', 'Zone 8', 'Zone 9'],
    datasets: [
      {
        label: 'Strike %',
        data: [68, 72, 65, 58, 85, 62, 71, 69, 74],
        backgroundColor: 'rgba(191, 87, 0, 0.6)',
        borderColor: '#BF5700',
        borderWidth: 2
      },
      {
        label: 'Whiff %',
        data: [32, 28, 35, 42, 15, 38, 29, 31, 26],
        backgroundColor: 'rgba(255, 165, 0, 0.6)',
        borderColor: '#FFA500',
        borderWidth: 2
      }
    ]
  };

  const performanceMetrics = {
    labels: ['Velocity', 'Spin Rate', 'Movement', 'Command', 'Deception', 'Effectiveness'],
    datasets: [
      {
        label: 'Current Performance',
        data: [85, 78, 92, 73, 88, 81],
        backgroundColor: 'rgba(191, 87, 0, 0.2)',
        borderColor: '#BF5700',
        borderWidth: 2,
        pointBackgroundColor: '#BF5700'
      },
      {
        label: 'League Average',
        data: [75, 75, 75, 75, 75, 75],
        backgroundColor: 'rgba(128, 128, 128, 0.1)',
        borderColor: '#808080',
        borderWidth: 1,
        pointBackgroundColor: '#808080'
      }
    ]
  };

  return (
    <section className="py-16 px-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
            Trackman <span style={{ color: '#BF5700' }}>Baseball Analytics</span>
          </h2>
          <p className="text-lg text-gray-300 max-w-3xl mx-auto">
            Professional-grade baseball analytics powered by Trackman data. Visualize pitch-by-pitch performance,
            analyze strike zones, and leverage predictive models for competitive advantage.
          </p>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((feature) => (
            <div
              key={feature.id}
              className="glass-effect p-6 rounded-lg hover-lift cursor-pointer transition-all"
              onClick={() => setSelectedView(feature.id)}
              style={{
                border: selectedView === feature.id ? '2px solid #BF5700' : '2px solid transparent'
              }}
            >
              <div className="flex items-center mb-4" style={{ color: '#BF5700' }}>
                {feature.icon}
                <h3 className="text-lg font-bold ml-2">{feature.title}</h3>
              </div>
              <p className="text-sm mb-4">{feature.description}</p>
              <div className="flex flex-wrap gap-2">
                {feature.metrics.map((metric) => (
                  <span
                    key={metric}
                    className="text-xs px-2 py-1 rounded-full"
                    style={{ backgroundColor: 'rgba(191, 87, 0, 0.2)', color: '#FFA500' }}
                  >
                    {metric}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Controls */}
        <div className="glass-effect p-6 rounded-lg mb-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Pitcher</label>
              <select
                value={selectedPitcher}
                onChange={(e) => setSelectedPitcher(e.target.value)}
                className="w-full p-2 rounded glass-effect bg-transparent border border-gray-600"
              >
                <option value="all">All Pitchers</option>
                <option value="pitcher1">Jacob deGrom</option>
                <option value="pitcher2">Shane Bieber</option>
                <option value="pitcher3">Gerrit Cole</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Batter</label>
              <select
                value={selectedBatter}
                onChange={(e) => setSelectedBatter(e.target.value)}
                className="w-full p-2 rounded glass-effect bg-transparent border border-gray-600"
              >
                <option value="all">All Batters</option>
                <option value="batter1">Mike Trout</option>
                <option value="batter2">Mookie Betts</option>
                <option value="batter3">Ronald Acuña Jr.</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Pitch Types</label>
              <div className="flex flex-wrap gap-2">
                {Object.entries(pitchTypes).map(([key, value]) => (
                  <button
                    key={key}
                    onClick={() => {
                      setSelectedPitchType(prev =>
                        prev.includes(key)
                          ? prev.filter(p => p !== key)
                          : [...prev, key]
                      );
                    }}
                    className={`px-3 py-1 rounded text-xs transition-colors ${
                      selectedPitchType.includes(key)
                        ? 'bg-orange-600 text-white'
                        : 'glass-effect hover:bg-orange-700'
                    }`}
                  >
                    {key}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Visualization Area */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Velocity Trends */}
          <div className="glass-effect p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#BF5700' }}>
              Velocity Trends
            </h3>
            <Line data={velocityData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                title: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: false,
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  ticks: { color: '#fff' }
                },
                x: {
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  ticks: { color: '#fff' }
                }
              }
            }} />
          </div>

          {/* Spin Rate Analysis */}
          <div className="glass-effect p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#BF5700' }}>
              Spin Rate by Pitch Type
            </h3>
            <Bar data={spinRateData} options={{
              responsive: true,
              plugins: {
                legend: { display: false },
                title: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  ticks: { color: '#fff' }
                },
                x: {
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  ticks: { color: '#fff' }
                }
              }
            }} />
          </div>

          {/* Strike Zone Performance */}
          <div className="glass-effect p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#BF5700' }}>
              Strike Zone Performance
            </h3>
            <Bar data={zoneData} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const },
                title: { display: false }
              },
              scales: {
                y: {
                  beginAtZero: true,
                  max: 100,
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  ticks: { color: '#fff', callback: (value) => value + '%' }
                },
                x: {
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  ticks: { color: '#fff' }
                }
              }
            }} />
          </div>

          {/* Performance Radar */}
          <div className="glass-effect p-6 rounded-lg">
            <h3 className="text-xl font-bold mb-4" style={{ color: '#BF5700' }}>
              Performance Metrics
            </h3>
            <Radar data={performanceMetrics} options={{
              responsive: true,
              plugins: {
                legend: { position: 'top' as const }
              },
              scales: {
                r: {
                  beginAtZero: true,
                  max: 100,
                  grid: { color: 'rgba(255, 255, 255, 0.1)' },
                  pointLabels: { color: '#fff' },
                  ticks: { color: '#fff', backdropColor: 'transparent' }
                }
              }
            }} />
          </div>
        </div>

        {/* Key Insights */}
        <div className="glass-effect p-6 rounded-lg mt-8">
          <h3 className="text-xl font-bold mb-4" style={{ color: '#BF5700' }}>
            Key Insights & Predictive Analysis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: '#FFA500' }}>0.326</div>
              <div className="text-sm text-gray-400">Expected wOBA (xwOBA)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: '#FFA500' }}>42.3%</div>
              <div className="text-sm text-gray-400">Hard Hit Rate</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold" style={{ color: '#FFA500' }}>28.7°</div>
              <div className="text-sm text-gray-400">Average Launch Angle</div>
            </div>
          </div>
        </div>

        {/* Integration Notice */}
        <div className="text-center mt-12 p-6 glass-effect rounded-lg">
          <h4 className="text-lg font-semibold mb-2" style={{ color: '#BF5700' }}>
            Trackman Integration Status
          </h4>
          <p className="text-sm text-gray-300 mb-4">
            This advanced baseball analytics system integrates Trackman's precision measurement technology
            with AI-powered predictive models. Upload your Trackman CSV data or connect via API for real-time analysis.
          </p>
          <div className="flex justify-center gap-4">
            <button className="px-6 py-2 rounded-lg font-semibold transition-colors hover-lift"
              style={{ backgroundColor: '#BF5700', color: '#000' }}
              onMouseEnter={(e) => (e.target as HTMLElement).style.backgroundColor = '#FFA500'}
              onMouseLeave={(e) => (e.target as HTMLElement).style.backgroundColor = '#BF5700'}
            >
              Upload Trackman Data
            </button>
            <a
              href="https://github.com/byw-5/Trackman_baseball_visualizer"
              target="_blank"
              rel="noreferrer"
              className="px-6 py-2 rounded-lg font-semibold glass-effect hover-lift transition-colors"
            >
              View Source Code
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default TrackmanAnalytics;