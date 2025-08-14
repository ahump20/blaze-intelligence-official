import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

const performanceData = [
  { month: 'Jan', football: 4000, basketball: 2400, baseball: 2400 },
  { month: 'Feb', football: 3000, basketball: 1398, baseball: 2210 },
  { month: 'Mar', football: 2000, basketball: 9800, baseball: 2290 },
  { month: 'Apr', football: 2780, basketball: 3908, baseball: 2000 },
  { month: 'May', football: 1890, basketball: 4800, baseball: 2181 },
  { month: 'Jun', football: 2390, basketball: 3800, baseball: 2500 },
];

const playerStats = [
  { skill: 'Speed', A: 120, B: 110, fullMark: 150 },
  { skill: 'Strength', A: 98, B: 130, fullMark: 150 },
  { skill: 'Agility', A: 86, B: 130, fullMark: 150 },
  { skill: 'Endurance', A: 99, B: 100, fullMark: 150 },
  { skill: 'Technique', A: 85, B: 90, fullMark: 150 },
  { skill: 'Mental', A: 65, B: 85, fullMark: 150 },
];

const pieData = [
  { name: 'Offense', value: 400, color: '#f83b3b' },
  { name: 'Defense', value: 300, color: '#ff6969' },
  { name: 'Special Teams', value: 200, color: '#ffa0a0' },
  { name: 'Analytics', value: 100, color: '#ffc7c7' },
];

const SportsAnalytics: React.FC = () => {
  const [selectedSport, setSelectedSport] = useState('football');
  const [activeChart, setActiveChart] = useState('performance');

  const sports = [
    { id: 'football', name: 'Football', icon: '🏈' },
    { id: 'basketball', name: 'Basketball', icon: '🏀' },
    { id: 'baseball', name: 'Baseball', icon: '⚾' },
  ];

  return (
    <section className="py-20 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Real-Time Sports Analytics Dashboard
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Visualize performance metrics, player statistics, and predictive models across multiple sports
          </motion.p>
        </div>

        {/* Sport Selector */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex rounded-lg border border-gray-200 bg-white p-1">
            {sports.map((sport) => (
              <button
                key={sport.id}
                onClick={() => setSelectedSport(sport.id)}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  selectedSport === sport.id
                    ? 'gradient-blaze text-white'
                    : 'text-gray-700 hover:text-gray-900'
                }`}
              >
                <span className="mr-2">{sport.icon}</span>
                {sport.name}
              </button>
            ))}
          </div>
        </div>

        {/* Chart Type Selector */}
        <div className="flex justify-center mb-8">
          <div className="flex gap-4">
            {['performance', 'player', 'distribution'].map((chart) => (
              <button
                key={chart}
                onClick={() => setActiveChart(chart)}
                className={`px-4 py-2 rounded-lg transition-all duration-200 ${
                  activeChart === chart
                    ? 'bg-blaze-500 text-white'
                    : 'bg-white text-gray-700 border border-gray-200 hover:border-blaze-500'
                }`}
              >
                {chart.charAt(0).toUpperCase() + chart.slice(1)} Analysis
              </button>
            ))}
          </div>
        </div>

        {/* Charts Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {activeChart === 'performance' && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Performance Trends</h3>
              <ResponsiveContainer width="100%" height={400}>
                <LineChart data={performanceData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey={selectedSport}
                    stroke="#f83b3b"
                    strokeWidth={2}
                    dot={{ fill: '#f83b3b' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'player' && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Player Comparison</h3>
              <ResponsiveContainer width="100%" height={400}>
                <RadarChart data={playerStats}>
                  <PolarGrid />
                  <PolarAngleAxis dataKey="skill" />
                  <PolarRadiusAxis angle={90} domain={[0, 150]} />
                  <Radar
                    name="Player A"
                    dataKey="A"
                    stroke="#f83b3b"
                    fill="#f83b3b"
                    fillOpacity={0.6}
                  />
                  <Radar
                    name="Player B"
                    dataKey="B"
                    stroke="#ff6969"
                    fill="#ff6969"
                    fillOpacity={0.6}
                  />
                  <Legend />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          )}

          {activeChart === 'distribution' && (
            <div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-6">Resource Distribution</h3>
              <ResponsiveContainer width="100%" height={400}>
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </motion.div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
          {[
            { label: 'Games Analyzed', value: '10,234', change: '+12%' },
            { label: 'Predictions Made', value: '45,678', change: '+23%' },
            { label: 'Accuracy Rate', value: '94.5%', change: '+2.3%' },
            { label: 'Teams Using', value: '127', change: '+18%' },
          ].map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: index * 0.1 }}
              viewport={{ once: true }}
              className="bg-white rounded-lg shadow-md p-6"
            >
              <p className="text-gray-600 text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-green-500 text-sm mt-1">{stat.change} from last month</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SportsAnalytics;