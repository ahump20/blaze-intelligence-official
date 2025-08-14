import React from 'react';
import { motion } from 'framer-motion';

const technologies = [
  { name: 'React', category: 'Frontend', logo: '⚛️' },
  { name: 'TypeScript', category: 'Language', logo: '📘' },
  { name: 'Python', category: 'Backend', logo: '🐍' },
  { name: 'TensorFlow', category: 'AI/ML', logo: '🧠' },
  { name: 'Node.js', category: 'Runtime', logo: '💚' },
  { name: 'PostgreSQL', category: 'Database', logo: '🐘' },
  { name: 'AWS', category: 'Cloud', logo: '☁️' },
  { name: 'Docker', category: 'DevOps', logo: '🐳' },
  { name: 'ESPN API', category: 'Data Source', logo: '📊' },
  { name: 'Live Scores API', category: 'Real-time', logo: '⚡' },
];

const TechnologyStack: React.FC = () => {
  return (
    <section className="py-20 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            viewport={{ once: true }}
            className="text-4xl font-bold text-gray-900 mb-4"
          >
            Built with Modern Technology
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Leveraging cutting-edge technologies including custom ESPN API integration and live sports data feeds
          </motion.p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-6">
          {technologies.map((tech, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.4, delay: index * 0.05 }}
              viewport={{ once: true }}
              whileHover={{ scale: 1.05 }}
              className="bg-gray-50 rounded-lg p-6 text-center hover:shadow-lg transition-all duration-300 cursor-pointer"
            >
              <div className="text-4xl mb-2">{tech.logo}</div>
              <h3 className="font-semibold text-gray-900">{tech.name}</h3>
              <p className="text-sm text-gray-600">{tech.category}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          viewport={{ once: true }}
          className="mt-12 bg-gradient-to-r from-blaze-50 to-orange-50 rounded-2xl p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 mb-4">API Integration Features</h3>
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">ESPN Public API</h4>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Real-time game scores and statistics</li>
                <li>✓ Player profiles and performance metrics</li>
                <li>✓ Team standings and historical data</li>
                <li>✓ Schedule and fixture information</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900 mb-2">Live Sports Scoreboard API</h4>
              <ul className="space-y-2 text-gray-600">
                <li>✓ Real-time score updates</li>
                <li>✓ Multi-sport coverage</li>
                <li>✓ Live game events and play-by-play</li>
                <li>✓ WebSocket connections for instant updates</li>
              </ul>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default TechnologyStack;