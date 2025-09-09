import React, { useState, useEffect, useRef } from 'react';
import useBlazeSocket from '../hooks/useBlazeSocket';

interface TeamData {
  name: string;
  score: number;
  timeouts: number;
  possession: boolean;
  stats: {
    totalYards: number;
    passingYards: number;
    rushingYards: number;
    turnovers: number;
    firstDowns: number;
  };
}

interface GameState {
  quarter: number;
  timeRemaining: string;
  down: number;
  distance: number;
  yardLine: number;
  homeTeam: TeamData;
  awayTeam: TeamData;
  lastPlay: string;
  gameStatus: 'pre' | 'live' | 'final';
}

interface PlayerStats {
  id: string;
  name: string;
  position: string;
  jerseyNumber: number;
  stats: {
    passingYards?: number;
    rushingYards?: number;
    receivingYards?: number;
    tackles?: number;
    sacks?: number;
    interceptions?: number;
  };
  pressureIndex: number;
  performanceGrade: string;
}

const NFLInteractiveDemo: React.FC = () => {
  const [gameState, setGameState] = useState<GameState>({
    quarter: 1,
    timeRemaining: '15:00',
    down: 1,
    distance: 10,
    yardLine: 25,
    homeTeam: {
      name: 'Cardinals',
      score: 0,
      timeouts: 3,
      possession: true,
      stats: {
        totalYards: 0,
        passingYards: 0,
        rushingYards: 0,
        turnovers: 0,
        firstDowns: 0
      }
    },
    awayTeam: {
      name: 'Titans',
      score: 0,
      timeouts: 3,
      possession: false,
      stats: {
        totalYards: 0,
        passingYards: 0,
        rushingYards: 0,
        turnovers: 0,
        firstDowns: 0
      }
    },
    lastPlay: 'Game Ready - First Down',
    gameStatus: 'pre'
  });

  const [selectedPlayers, setSelectedPlayers] = useState<PlayerStats[]>([]);
  const [liveData, setLiveData] = useState<any>(null);
  const [analyticsMode, setAnalyticsMode] = useState<'basic' | 'advanced' | 'pressure'>('basic');

  const { isConnected, subscribe, unsubscribe, onMessage, requestLiveData } = useBlazeSocket({
    debug: true,
    autoConnect: true
  });

  const fieldRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (isConnected) {
      subscribe('game_updates');
      subscribe('pressure_analytics');
      requestLiveData('football', 'NFL');

      const unsubscribeGameUpdates = onMessage('game_update', (data) => {
        setGameState(data);
      });

      const unsubscribePressure = onMessage('pressure_stream', (data) => {
        updatePlayerPressure(data);
      });

      return () => {
        unsubscribeGameUpdates();
        unsubscribePressure();
        unsubscribe('game_updates');
        unsubscribe('pressure_analytics');
      };
    }
  }, [isConnected]);

  useEffect(() => {
    drawField();
    generateLiveGame();
    const interval = setInterval(generateLiveGame, 5000);
    return () => clearInterval(interval);
  }, []);

  const generateLiveGame = () => {
    setGameState(prev => {
      const newState = { ...prev };
      
      // Simulate game progression
      if (prev.gameStatus === 'pre') {
        newState.gameStatus = 'live';
      }

      // Update game clock
      const timeArray = prev.timeRemaining.split(':');
      let minutes = parseInt(timeArray[0]);
      let seconds = parseInt(timeArray[1]);
      
      seconds -= Math.floor(Math.random() * 30) + 15;
      if (seconds < 0) {
        minutes--;
        seconds += 60;
      }

      if (minutes < 0) {
        newState.quarter++;
        minutes = 15;
        seconds = 0;
        if (newState.quarter > 4) {
          newState.gameStatus = 'final';
        }
      }

      newState.timeRemaining = `${minutes}:${seconds.toString().padStart(2, '0')}`;

      // Random play generation
      const plays = [
        'Murray passes to Hopkins for 12 yards',
        'Conner rushes up the middle for 7 yards',
        'Henry breaks through for 23 yard gain',
        'Tannehill sacked for loss of 8 yards',
        'Field Goal attempt - GOOD!',
        'Touchdown pass - Cardinals!',
        'Interception by Titans defense!'
      ];

      newState.lastPlay = plays[Math.floor(Math.random() * plays.length)];

      // Update scores randomly
      if (Math.random() < 0.1) {
        if (newState.homeTeam.possession) {
          newState.homeTeam.score += Math.random() < 0.7 ? 3 : 7;
        } else {
          newState.awayTeam.score += Math.random() < 0.7 ? 3 : 7;
        }
      }

      // Switch possession occasionally
      if (Math.random() < 0.3) {
        newState.homeTeam.possession = !newState.homeTeam.possession;
        newState.awayTeam.possession = !newState.awayTeam.possession;
        newState.down = 1;
        newState.distance = 10;
        newState.yardLine = Math.floor(Math.random() * 80) + 10;
      } else {
        newState.down = Math.min(4, newState.down + 1);
        newState.distance = Math.max(1, newState.distance - Math.floor(Math.random() * 8));
      }

      // Update team stats
      newState.homeTeam.stats.totalYards += Math.floor(Math.random() * 20);
      newState.awayTeam.stats.totalYards += Math.floor(Math.random() * 20);

      return newState;
    });

    // Generate player data
    generatePlayerStats();
  };

  const generatePlayerStats = () => {
    const players: PlayerStats[] = [
      {
        id: 'qb1',
        name: 'Kyler Murray',
        position: 'QB',
        jerseyNumber: 1,
        stats: {
          passingYards: Math.floor(Math.random() * 300) + 150,
          rushingYards: Math.floor(Math.random() * 50) + 20
        },
        pressureIndex: Math.random() * 100,
        performanceGrade: generateGrade()
      },
      {
        id: 'rb1',
        name: 'James Conner',
        position: 'RB',
        jerseyNumber: 6,
        stats: {
          rushingYards: Math.floor(Math.random() * 150) + 50,
          receivingYards: Math.floor(Math.random() * 30) + 10
        },
        pressureIndex: Math.random() * 100,
        performanceGrade: generateGrade()
      },
      {
        id: 'wr1',
        name: 'DeAndre Hopkins',
        position: 'WR',
        jerseyNumber: 10,
        stats: {
          receivingYards: Math.floor(Math.random() * 120) + 60
        },
        pressureIndex: Math.random() * 100,
        performanceGrade: generateGrade()
      },
      {
        id: 'qb2',
        name: 'Ryan Tannehill',
        position: 'QB',
        jerseyNumber: 17,
        stats: {
          passingYards: Math.floor(Math.random() * 280) + 120,
          rushingYards: Math.floor(Math.random() * 30) + 5
        },
        pressureIndex: Math.random() * 100,
        performanceGrade: generateGrade()
      },
      {
        id: 'rb2',
        name: 'Derrick Henry',
        position: 'RB',
        jerseyNumber: 22,
        stats: {
          rushingYards: Math.floor(Math.random() * 180) + 80,
          receivingYards: Math.floor(Math.random() * 20) + 5
        },
        pressureIndex: Math.random() * 100,
        performanceGrade: generateGrade()
      }
    ];

    setSelectedPlayers(players);
  };

  const generateGrade = (): string => {
    const grades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-'];
    return grades[Math.floor(Math.random() * grades.length)];
  };

  const updatePlayerPressure = (data: any) => {
    if (data.players) {
      setSelectedPlayers(prev => 
        prev.map(player => ({
          ...player,
          pressureIndex: Math.random() * 100
        }))
      );
    }
  };

  const drawField = () => {
    const canvas = fieldRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 400;

    // Draw field background
    ctx.fillStyle = '#2d5d31';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw yard lines
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    
    for (let i = 0; i <= 10; i++) {
      const x = (i * canvas.width) / 10;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, canvas.height);
      ctx.stroke();
      
      // Yard markers
      if (i > 0 && i < 10) {
        ctx.fillStyle = '#ffffff';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        const yardNumber = i <= 5 ? i * 10 : (10 - i) * 10;
        ctx.fillText(yardNumber.toString(), x, canvas.height / 2);
      }
    }

    // Draw hash marks
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) {
      const x = (i * canvas.width) / 10;
      for (let j = 1; j < 4; j++) {
        const y = (j * canvas.height) / 4;
        ctx.beginPath();
        ctx.moveTo(x - 5, y);
        ctx.lineTo(x + 5, y);
        ctx.stroke();
      }
    }

    // Draw ball position
    const ballX = (gameState.yardLine / 100) * canvas.width;
    ctx.fillStyle = '#BF5700';
    ctx.beginPath();
    ctx.arc(ballX, canvas.height / 2, 8, 0, 2 * Math.PI);
    ctx.fill();
  };

  const getPressureColor = (pressure: number): string => {
    if (pressure > 80) return '#ff4444';
    if (pressure > 60) return '#ff8844';
    if (pressure > 40) return '#ffaa44';
    return '#44ff44';
  };

  return (
    <div className="nfl-interactive-demo">
      <div className="demo-header">
        <h2>🏈 NFL Live Analytics Demo</h2>
        <div className="connection-status">
          <span className={`status-indicator ${isConnected ? 'connected' : 'disconnected'}`}>
            {isConnected ? '🟢 Connected' : '🔴 Disconnected'}
          </span>
        </div>
      </div>

      <div className="game-overview">
        <div className="scoreboard">
          <div className="team away-team">
            <h3>{gameState.awayTeam.name}</h3>
            <div className="score">{gameState.awayTeam.score}</div>
            <div className="timeouts">TO: {gameState.awayTeam.timeouts}</div>
          </div>
          
          <div className="game-info">
            <div className="quarter">Q{gameState.quarter}</div>
            <div className="time">{gameState.timeRemaining}</div>
            <div className="down-distance">
              {gameState.down} & {gameState.distance}
            </div>
            <div className="field-position">{gameState.yardLine} yard line</div>
            <div className="game-status">{gameState.gameStatus.toUpperCase()}</div>
          </div>
          
          <div className="team home-team">
            <h3>{gameState.homeTeam.name}</h3>
            <div className="score">{gameState.homeTeam.score}</div>
            <div className="timeouts">TO: {gameState.homeTeam.timeouts}</div>
          </div>
        </div>

        <div className="last-play">
          <strong>Last Play:</strong> {gameState.lastPlay}
        </div>
      </div>

      <div className="analytics-controls">
        <div className="mode-selector">
          <button 
            className={analyticsMode === 'basic' ? 'active' : ''}
            onClick={() => setAnalyticsMode('basic')}
          >
            Basic Stats
          </button>
          <button 
            className={analyticsMode === 'advanced' ? 'active' : ''}
            onClick={() => setAnalyticsMode('advanced')}
          >
            Advanced Analytics
          </button>
          <button 
            className={analyticsMode === 'pressure' ? 'active' : ''}
            onClick={() => setAnalyticsMode('pressure')}
          >
            Pressure Index
          </button>
        </div>
      </div>

      <div className="field-visualization">
        <canvas ref={fieldRef} className="football-field"></canvas>
      </div>

      <div className="player-stats">
        <h3>Player Performance</h3>
        <div className="stats-grid">
          {selectedPlayers.map(player => (
            <div key={player.id} className="player-card">
              <div className="player-header">
                <span className="jersey-number">#{player.jerseyNumber}</span>
                <div className="player-info">
                  <h4>{player.name}</h4>
                  <span className="position">{player.position}</span>
                </div>
                <div className="performance-grade">{player.performanceGrade}</div>
              </div>
              
              {analyticsMode === 'basic' && (
                <div className="basic-stats">
                  {player.stats.passingYards && (
                    <div className="stat">
                      <span>Passing:</span> {player.stats.passingYards} yds
                    </div>
                  )}
                  {player.stats.rushingYards && (
                    <div className="stat">
                      <span>Rushing:</span> {player.stats.rushingYards} yds
                    </div>
                  )}
                  {player.stats.receivingYards && (
                    <div className="stat">
                      <span>Receiving:</span> {player.stats.receivingYards} yds
                    </div>
                  )}
                </div>
              )}

              {analyticsMode === 'pressure' && (
                <div className="pressure-analytics">
                  <div className="pressure-meter">
                    <div className="pressure-label">Pressure Index</div>
                    <div 
                      className="pressure-bar"
                      style={{ 
                        width: `${player.pressureIndex}%`,
                        backgroundColor: getPressureColor(player.pressureIndex)
                      }}
                    ></div>
                    <span className="pressure-value">
                      {Math.round(player.pressureIndex)}
                    </span>
                  </div>
                </div>
              )}

              {analyticsMode === 'advanced' && (
                <div className="advanced-stats">
                  <div className="stat">
                    <span>EPA:</span> +{(Math.random() * 10).toFixed(1)}
                  </div>
                  <div className="stat">
                    <span>WPA:</span> +{(Math.random() * 0.5).toFixed(2)}
                  </div>
                  <div className="stat">
                    <span>CPOE:</span> +{(Math.random() * 20 - 10).toFixed(1)}%
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="real-time-data">
        <h3>Live Data Stream</h3>
        <div className="data-stream">
          <div className="stream-item">
            <span className="timestamp">{new Date().toLocaleTimeString()}</span>
            <span className="data-point">Live pressure metrics updated</span>
          </div>
          <div className="stream-item">
            <span className="timestamp">{new Date().toLocaleTimeString()}</span>
            <span className="data-point">Player tracking synchronized</span>
          </div>
          <div className="stream-item">
            <span className="timestamp">{new Date().toLocaleTimeString()}</span>
            <span className="data-point">Analytics engine processing...</span>
          </div>
        </div>
      </div>

      <style jsx>{`
        .nfl-interactive-demo {
          max-width: 1200px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #0A192F 0%, #112240 100%);
          color: white;
          border-radius: 12px;
        }

        .demo-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 30px;
          padding-bottom: 15px;
          border-bottom: 2px solid #BF5700;
        }

        .demo-header h2 {
          margin: 0;
          color: #BF5700;
        }

        .status-indicator {
          padding: 8px 16px;
          border-radius: 20px;
          font-weight: bold;
          font-size: 14px;
        }

        .status-indicator.connected {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
        }

        .status-indicator.disconnected {
          background: rgba(244, 67, 54, 0.2);
          color: #F44336;
        }

        .scoreboard {
          display: grid;
          grid-template-columns: 1fr auto 1fr;
          gap: 20px;
          align-items: center;
          margin-bottom: 20px;
          padding: 20px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          backdrop-filter: blur(10px);
        }

        .team {
          text-align: center;
        }

        .team h3 {
          margin: 0 0 10px 0;
          font-size: 24px;
        }

        .team .score {
          font-size: 48px;
          font-weight: bold;
          color: #BF5700;
        }

        .team .timeouts {
          margin-top: 10px;
          opacity: 0.8;
        }

        .game-info {
          text-align: center;
          padding: 0 20px;
        }

        .game-info > div {
          margin: 5px 0;
        }

        .quarter {
          font-size: 18px;
          font-weight: bold;
        }

        .time {
          font-size: 24px;
          color: #BF5700;
        }

        .last-play {
          text-align: center;
          padding: 15px;
          background: rgba(191, 87, 0, 0.1);
          border-radius: 8px;
          border-left: 4px solid #BF5700;
        }

        .analytics-controls {
          margin: 30px 0;
        }

        .mode-selector {
          display: flex;
          gap: 10px;
          justify-content: center;
        }

        .mode-selector button {
          padding: 12px 24px;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
        }

        .mode-selector button:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .mode-selector button.active {
          background: #BF5700;
          border-color: #BF5700;
        }

        .field-visualization {
          margin: 30px 0;
          text-align: center;
        }

        .football-field {
          border: 2px solid #BF5700;
          border-radius: 8px;
          max-width: 100%;
        }

        .stats-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .player-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .player-header {
          display: flex;
          align-items: center;
          margin-bottom: 15px;
        }

        .jersey-number {
          background: #BF5700;
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          font-weight: bold;
          margin-right: 15px;
        }

        .player-info {
          flex: 1;
        }

        .player-info h4 {
          margin: 0;
          font-size: 18px;
        }

        .position {
          color: #BF5700;
          font-weight: bold;
        }

        .performance-grade {
          background: rgba(76, 175, 80, 0.2);
          color: #4CAF50;
          padding: 6px 12px;
          border-radius: 20px;
          font-weight: bold;
        }

        .stat {
          display: flex;
          justify-content: space-between;
          margin: 8px 0;
        }

        .stat span {
          color: #BF5700;
          font-weight: bold;
        }

        .pressure-meter {
          margin-top: 10px;
        }

        .pressure-label {
          font-size: 14px;
          margin-bottom: 8px;
          color: #BF5700;
        }

        .pressure-bar {
          height: 8px;
          border-radius: 4px;
          transition: all 0.3s ease;
          position: relative;
        }

        .pressure-value {
          position: absolute;
          right: 0;
          top: -25px;
          font-size: 12px;
          font-weight: bold;
        }

        .real-time-data {
          margin-top: 30px;
        }

        .data-stream {
          background: rgba(0, 0, 0, 0.3);
          border-radius: 8px;
          padding: 15px;
          max-height: 200px;
          overflow-y: auto;
        }

        .stream-item {
          display: flex;
          justify-content: space-between;
          padding: 8px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .stream-item:last-child {
          border-bottom: none;
        }

        .timestamp {
          color: #BF5700;
          font-size: 12px;
        }

        .data-point {
          font-size: 14px;
        }
      `}</style>
    </div>
  );
};

export default NFLInteractiveDemo;