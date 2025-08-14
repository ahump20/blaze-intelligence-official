import React from 'react';
import { motion } from 'framer-motion';
import { ChartBarIcon, LightBulbIcon, TrophyIcon } from '@heroicons/react/24/outline';

const Hero: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100 pt-16 pb-24">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blaze-200 rounded-full opacity-20 animate-pulse-slow"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-orange-200 rounded-full opacity-20 animate-pulse-slow"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl md:text-6xl font-bold text-gray-900 mb-6"
          >
            Revolutionizing Sports Analytics with{' '}
            <span className="gradient-text">AI-Powered Intelligence</span>
          </motion.h1>
          
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto"
          >
            Blaze Intelligence combines cutting-edge AI, real-time data processing, and advanced 
            psychological profiling to deliver unprecedented insights into sports performance.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="flex flex-col sm:flex-row gap-4 justify-center mb-12"
          >
            <button className="gradient-blaze text-white px-8 py-3 rounded-lg text-lg font-semibold hover:opacity-90 transition-opacity">
              Start Free Trial
            </button>
            <button className="bg-white text-gray-900 px-8 py-3 rounded-lg text-lg font-semibold border-2 border-gray-300 hover:border-blaze-500 transition-colors">
              Watch Demo
            </button>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto"
          >
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 gradient-blaze rounded-full flex items-center justify-center mb-3">
                <ChartBarIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Real-Time Analytics</h3>
              <p className="text-gray-600 text-sm">Process and analyze game data in milliseconds</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 gradient-blaze rounded-full flex items-center justify-center mb-3">
                <LightBulbIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">AI-Driven Insights</h3>
              <p className="text-gray-600 text-sm">Machine learning models for predictive analysis</p>
            </div>
            
            <div className="flex flex-col items-center">
              <div className="w-16 h-16 gradient-blaze rounded-full flex items-center justify-center mb-3">
                <TrophyIcon className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Multi-Sport Support</h3>
              <p className="text-gray-600 text-sm">Football, Basketball, Baseball, and more</p>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Hero;