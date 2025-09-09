// Blaze Intelligence Interactive NFL Demo
// Live game simulation with predictive analytics

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Line, Bar } from 'react-chartjs-2';
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
  Filler
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
  Filler
);

// Sample NFL game data - Cowboys vs Eagles 2024 Week 9
const GAME_DATA = {
  teams: {
    home: { 
      id: 'DAL', 
      name: 'Dallas Cowboys', 
      color: '#002244',
      logo: '/logos/dal.svg',
      record: '6-2'
    },
    away: { 
      id: 'PHI', 
      name: 'Philadelphia Eagles', 
      color: '#004C54',
      logo: '/logos/phi.svg',
      record: '7-1'
    }
  },
  plays: [
    {
      id: 1,
      quarter: 1,
      time: '15:00',
      down: 1,
      distance: 10,
      fieldPosition: 25,
      possession: 'PHI',
      playType: 'pass',
      result: 'complete',
      yards: 12,
      description: 'Hurts pass complete to Brown for 12 yards',
      winProbabilityChange: 0.03,
      expectedPoints: 0.8,
      successRate: 0.72
    },
    {
      id: 2,
      quarter: 1,
      time: '14:23',
      down: 1,
      distance: 10,
      fieldPosition: 37,
      possession: 'PHI',
      playType: 'run',
      result: 'gain',
      yards: 4,
      description: 'Swift rushes for 4 yards',
      winProbabilityChange: 0.01,
      expectedPoints: 0.3,
      successRate: 0.45
    },
    // Add more plays for realistic simulation
  ],
  predictions: {
    pregame: {
      home: 0.48,
      away: 0.52,
      overUnder: 47.5,
      spread: -2.5
    },
    live: {
      home: 0.51,
      away: 0.49,
      projectedTotal: 49,
      nextScore: { team: 'DAL', probability: 0.62, type: 'field_goal' }
    }
  }
};

interface DemoProps {
  autoPlay?: boolean;
  speed?: number;
}

export const NFLInteractiveDemo: React.FC<DemoProps> = ({ 
  autoPlay = false, 
  speed = 2000 
}) => {
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(autoPlay);
  const [score, setScore] = useState({ home: 0, away: 0 });
  const [quarter, setQuarter] = useState(1);
  const [timeRemaining, setTimeRemaining] = useState('15:00');
  const [winProbability, setWinProbability] = useState([50, 50]);
  const [selectedMetric, setSelectedMetric] = useState<'winProb' | 'expectedPoints' | 'successRate'>('winProb');
  const [historicalData, setHistoricalData] = useState<number[][]>([[50], [50]]);
  
  const intervalRef = useRef<NodeJS.Timeout>();

  // Simulate game progression
  useEffect(() => {
    if (isPlaying && currentPlayIndex < GAME_DATA.plays.length) {
      intervalRef.current = setInterval(() => {
        advancePlay();
      }, speed);
    } else {
      setIsPlaying(false);
    }

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isPlaying, currentPlayIndex, speed]);

  const advancePlay = () => {
    if (currentPlayIndex >= GAME_DATA.plays.length) {
      setIsPlaying(false);
      return;
    }

    const play = GAME_DATA.plays[currentPlayIndex];
    
    // Update game state
    setQuarter(play.quarter);
    setTimeRemaining(play.time);
    
    // Simulate scoring (simplified)
    if (Math.random() > 0.9) {
      if (play.possession === GAME_DATA.teams.home.id) {
        setScore(prev => ({ ...prev, home: prev.home + 3 }));
      } else {
        setScore(prev => ({ ...prev, away: prev.away + 3 }));
      }
    }
    
    // Update win probability with smooth transition
    const newHomeProb = Math.min(95, Math.max(5, 
      winProbability[0] + (play.winProbabilityChange * 100 * (play.possession === GAME_DATA.teams.home.id ? 1 : -1))
    ));
    setWinProbability([newHomeProb, 100 - newHomeProb]);
    
    // Track historical data
    setHistoricalData(prev => [
      [...prev[0], newHomeProb],
      [...prev[1], 100 - newHomeProb]
    ]);
    
    setCurrentPlayIndex(prev => prev + 1);
  };

  const resetDemo = () => {
    setCurrentPlayIndex(0);
    setScore({ home: 0, away: 0 });
    setQuarter(1);
    setTimeRemaining('15:00');
    setWinProbability([50, 50]);
    setHistoricalData([[50], [50]]);
    setIsPlaying(false);
  };

  // Chart configurations
  const winProbabilityChart = {
    labels: historicalData[0].map((_, i) => `Play ${i + 1}`),
    datasets: [
      {
        label: GAME_DATA.teams.home.name,
        data: historicalData[0],
        borderColor: '#BF5700',
        backgroundColor: 'rgba(191, 87, 0, 0.1)',
        fill: true,
        tension: 0.4
      },
      {
        label: GAME_DATA.teams.away.name,
        data: historicalData[1],
        borderColor: '#9BCBEB',
        backgroundColor: 'rgba(155, 203, 235, 0.1)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        labels: {
          color: '#FAFAFA',
          font: {
            family: 'Inter',
            size: 12
          }
        }
      },
      tooltip: {
        backgroundColor: '#36454F',
        titleColor: '#FAFAFA',
        bodyColor: '#E5E4E2',
        borderColor: '#BF5700',
        borderWidth: 1
      }
    },
    scales: {
      y: {
        min: 0,
        max: 100,
        ticks: {
          color: '#E5E4E2',
          callback: (value: any) => `${value}%`
        },
        grid: {
          color: 'rgba(229, 228, 226, 0.1)'
        }
      },
      x: {
        ticks: {
          color: '#E5E4E2'
        },
        grid: {
          display: false
        }
      }
    }
  };

  const currentPlay = GAME_DATA.plays[currentPlayIndex] || GAME_DATA.plays[0];

  return (
    <div className="bg-oiler-navy rounded-xl p-8 shadow-2xl border border-burnt-orange/20">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-pearl">Live Game Simulation</h2>
        <div className="flex items-center space-x-4">
          <span className="text-sm text-pearl/60">
            Powered by Blaze Intelligence
          </span>
          <div className="w-2 h-2 bg-grizzly-teal rounded-full animate-pulse" />
        </div>
      </div>

      {/* Scoreboard */}
      <div className="bg-graphite/50 rounded-lg p-6 mb-6">
        <div className="grid grid-cols-3 gap-4">
          {/* Away Team */}
          <div className="text-center">
            <div className="text-pearl/60 text-sm mb-2">{GAME_DATA.teams.away.record}</div>
            <div className="text-pearl font-bold text-xl mb-1">{GAME_DATA.teams.away.id}</div>
            <div className="text-4xl font-mono text-cardinal-blue">{score.away}</div>
          </div>
          
          {/* Game Info */}
          <div className="text-center">
            <div className="text-pearl/60 text-sm">Q{quarter}</div>
            <div className="text-pearl text-2xl font-mono mb-2">{timeRemaining}</div>
            <div className="text-xs text-pearl/40">
              {currentPlay.down && `${currentPlay.down}${['st','nd','rd','th'][currentPlay.down-1]} & ${currentPlay.distance}`}
            </div>
          </div>
          
          {/* Home Team */}
          <div className="text-center">
            <div className="text-pearl/60 text-sm mb-2">{GAME_DATA.teams.home.record}</div>
            <div className="text-pearl font-bold text-xl mb-1">{GAME_DATA.teams.home.id}</div>
            <div className="text-4xl font-mono text-burnt-orange">{score.home}</div>
          </div>
        </div>

        {/* Win Probability Bar */}
        <div className="mt-6">
          <div className="flex justify-between text-xs text-pearl/60 mb-2">
            <span>Win Probability</span>
            <span>{winProbability[0].toFixed(1)}% - {winProbability[1].toFixed(1)}%</span>
          </div>
          <div className="relative h-8 bg-graphite rounded-full overflow-hidden">
            <motion.div
              className="absolute left-0 top-0 h-full bg-gradient-to-r from-burnt-orange to-burnt-orange/80"
              animate={{ width: `${winProbability[0]}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute right-0 top-0 h-full bg-gradient-to-l from-cardinal-blue to-cardinal-blue/80"
              animate={{ width: `${winProbability[1]}%` }}
              transition={{ duration: 0.5, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>

      {/* Play-by-Play */}
      <div className="bg-graphite/30 rounded-lg p-4 mb-6 max-h-32 overflow-y-auto">
        <div className="text-xs text-pearl/60 mb-2">PLAY-BY-PLAY</div>
        <AnimatePresence mode="popLayout">
          {GAME_DATA.plays.slice(0, currentPlayIndex + 1).reverse().map((play, idx) => (
            <motion.div
              key={play.id}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: idx === 0 ? 1 : 0.6, y: 0 }}
              exit={{ opacity: 0 }}
              className={`text-sm text-pearl mb-2 ${idx === 0 ? 'font-medium' : ''}`}
            >
              <span className="text-cardinal-blue">[{play.time}]</span> {play.description}
              <span className="text-grizzly-teal ml-2">
                ({play.yards > 0 ? '+' : ''}{play.yards} yds)
              </span>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Analytics Chart */}
      <div className="bg-graphite/30 rounded-lg p-4 mb-6">
        <div className="flex justify-between items-center mb-4">
          <div className="text-sm text-pearl/60">WIN PROBABILITY TREND</div>
          <div className="flex space-x-2">
            {(['winProb', 'expectedPoints', 'successRate'] as const).map(metric => (
              <button
                key={metric}
                onClick={() => setSelectedMetric(metric)}
                className={`px-3 py-1 text-xs rounded transition-all ${
                  selectedMetric === metric
                    ? 'bg-burnt-orange text-pearl'
                    : 'bg-graphite text-pearl/60 hover:bg-graphite/80'
                }`}
              >
                {metric === 'winProb' ? 'Win %' : 
                 metric === 'expectedPoints' ? 'EPA' : 'Success Rate'}
              </button>
            ))}
          </div>
        </div>
        <div className="h-48">
          <Line data={winProbabilityChart} options={chartOptions} />
        </div>
      </div>

      {/* AI Insights */}
      <div className="bg-grizzly-teal/10 border border-grizzly-teal/30 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between mb-3">
          <div className="text-sm font-medium text-grizzly-teal">AI PREDICTION</div>
          <div className="text-xs text-pearl/60">Confidence: 87%</div>
        </div>
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-pearl/60">Next Score:</span>
            <span className="text-pearl ml-2 font-medium">
              {GAME_DATA.predictions.live.nextScore.team} {GAME_DATA.predictions.live.nextScore.type}
            </span>
          </div>
          <div>
            <span className="text-pearl/60">Probability:</span>
            <span className="text-pearl ml-2 font-medium">
              {(GAME_DATA.predictions.live.nextScore.probability * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      </div>

      {/* Control Panel */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-3">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="px-6 py-2 bg-burnt-orange text-pearl rounded-lg font-medium hover:bg-burnt-orange/90 transition-all"
          >
            {isPlaying ? 'Pause' : 'Play'} Simulation
          </button>
          <button
            onClick={resetDemo}
            className="px-6 py-2 bg-graphite text-pearl rounded-lg font-medium hover:bg-graphite/80 transition-all"
          >
            Reset
          </button>
        </div>
        
        <div className="text-xs text-pearl/40">
          Play {currentPlayIndex + 1} of {GAME_DATA.plays.length}
        </div>
      </div>

      {/* Feature Callouts */}
      <div className="mt-6 pt-6 border-t border-pearl/10">
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-burnt-orange">
              {(winProbability[0] > 50 ? '+' : '-')}{Math.abs(winProbability[0] - 50).toFixed(1)}%
            </div>
            <div className="text-xs text-pearl/60">Live Win Δ</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-cardinal-blue">
              <100ms
            </div>
            <div className="text-xs text-pearl/60">Data Latency</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-grizzly-teal">
              95.3%
            </div>
            <div className="text-xs text-pearl/60">Prediction Accuracy</div>
          </div>
        </div>
      </div>
    </div>
  );
};
