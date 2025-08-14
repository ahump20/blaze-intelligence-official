import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PlayIcon, PauseIcon } from '@heroicons/react/24/solid';

const DemoSection: React.FC = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [liveScore, setLiveScore] = useState({ home: 0, away: 0 });

  // Simulate live score updates
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => prev + 1);
        // Randomly update scores
        if (Math.random() > 0.8) {
          setLiveScore((prev) => ({
            home: prev.home + Math.floor(Math.random() * 3) + 1,
            away: prev.away + Math.floor(Math.random() * 3) + 1,
          }));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isPlaying]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

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
            See Blaze Intelligence in Action
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            viewport={{ once: true }}
            className="text-xl text-gray-600 max-w-3xl mx-auto"
          >
            Experience real-time analysis with our live demo simulation
          </motion.p>
        </div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="bg-white rounded-2xl shadow-xl overflow-hidden"
        >
          {/* Video/Demo Area */}
          <div className="relative bg-gradient-to-br from-gray-900 to-gray-800 aspect-video">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                {/* Live Score Display */}
                <div className="mb-8">
                  <p className="text-white/60 text-sm mb-2">LIVE SIMULATION</p>
                  <div className="flex items-center justify-center gap-8">
                    <div className="text-white">
                      <p className="text-sm opacity-60">HOME</p>
                      <p className="text-5xl font-bold">{liveScore.home}</p>
                    </div>
                    <div className="text-white text-2xl">VS</div>
                    <div className="text-white">
                      <p className="text-sm opacity-60">AWAY</p>
                      <p className="text-5xl font-bold">{liveScore.away}</p>
                    </div>
                  </div>
                  <p className="text-white/60 mt-4">Game Time: {formatTime(currentTime)}</p>
                </div>

                {/* Play Button */}
                <button
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition-colors"
                >
                  {isPlaying ? (
                    <PauseIcon className="w-10 h-10 text-white ml-1" />
                  ) : (
                    <PlayIcon className="w-10 h-10 text-white ml-1" />
                  )}
                </button>
              </div>
            </div>

            {/* Animated Elements */}
            {isPlaying && (
              <div className="absolute inset-0 pointer-events-none">
                <motion.div
                  animate={{ x: [0, 100, 0], y: [0, -50, 0] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="absolute top-1/4 left-1/4 w-4 h-4 bg-blaze-500 rounded-full opacity-60"
                />
                <motion.div
                  animate={{ x: [0, -100, 0], y: [0, 50, 0] }}
                  transition={{ duration: 4, repeat: Infinity }}
                  className="absolute bottom-1/4 right-1/4 w-4 h-4 bg-orange-500 rounded-full opacity-60"
                />
              </div>
            )}
          </div>

          {/* Demo Features */}
          <div className="p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Live Demo Features</h3>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-green-500 flex-shrink-0 flex items-center justify-center">
                  <span className="text-white text-sm">1</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">Real-Time Updates</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Watch as scores and statistics update in real-time
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-blue-500 flex-shrink-0 flex items-center justify-center">
                  <span className="text-white text-sm">2</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">AI Predictions</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    See predictive analytics adjust based on game flow
                  </p>
                </div>
              </div>
              
              <div className="flex items-start">
                <div className="w-8 h-8 rounded-full bg-purple-500 flex-shrink-0 flex items-center justify-center">
                  <span className="text-white text-sm">3</span>
                </div>
                <div className="ml-3">
                  <h4 className="font-semibold text-gray-900">Instant Insights</h4>
                  <p className="text-gray-600 text-sm mt-1">
                    Get actionable insights as events unfold
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col sm:flex-row gap-4">
              <button className="gradient-blaze text-white px-6 py-3 rounded-lg font-semibold hover:opacity-90 transition-opacity">
                Try Full Demo
              </button>
              <button className="bg-gray-100 text-gray-900 px-6 py-3 rounded-lg font-semibold hover:bg-gray-200 transition-colors">
                Schedule Live Demo
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default DemoSection;