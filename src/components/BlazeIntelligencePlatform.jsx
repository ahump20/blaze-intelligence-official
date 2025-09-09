import React, { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';

const BlazeIntelligencePlatform = () => {
  const [activeModule, setActiveModule] = useState('dashboard');
  const [realTimeData, setRealTimeData] = useState({});
  const [analyticsData, setAnalyticsData] = useState({});
  const [isLoading, setIsLoading] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  
  const canvasRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const animationFrameRef = useRef(null);

  // Platform modules
  const modules = {
    dashboard: {
      name: 'Live Dashboard',
      icon: '📊',
      description: 'Real-time sports analytics and live data visualization'
    },
    'digital-combine': {
      name: 'Digital Combine™',
      icon: '🏃‍♂️',
      description: 'Biomechanical analysis and performance assessment'
    },
    'video-analysis': {
      name: 'Video Intelligence',
      icon: '🎬',
      description: 'AI-powered video analysis and player tracking'
    },
    'pressure-analytics': {
      name: 'Pressure Analytics',
      icon: '💓',
      description: 'Real-time biometric and pressure monitoring'
    },
    'nil-engine': {
      name: 'NIL Valuation Engine™',
      icon: '💰',
      description: 'Name, Image, and Likeness valuation for college athletes'
    },
    'team-intelligence': {
      name: 'Team Intelligence',
      icon: '🧠',
      description: 'Advanced team analytics and strategy optimization'
    },
    'api-docs': {
      name: 'API Documentation',
      icon: '📚',
      description: 'Interactive API documentation and testing'
    }
  };

  useEffect(() => {
    initializeThreeJS();
    loadRealTimeData();
    setupWebSocketConnection();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeThreeJS = () => {
    if (!canvasRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0A192F);
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(
      75,
      canvasRef.current.clientWidth / canvasRef.current.clientHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ 
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(canvasRef.current.clientWidth, canvasRef.current.clientHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    rendererRef.current = renderer;

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
    scene.add(ambientLight);

    const directionalLight = new THREE.DirectionalLight(0xBF5700, 1);
    directionalLight.position.set(5, 5, 5);
    directionalLight.castShadow = true;
    scene.add(directionalLight);

    // Create animated elements
    createAnimatedElements(scene);

    // Start animation loop
    animate();
  };

  const createAnimatedElements = (scene) => {
    // Floating data nodes
    const nodeGeometry = new THREE.SphereGeometry(0.1, 16, 16);
    const nodeMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xBF5700,
      transparent: true,
      opacity: 0.8
    });

    for (let i = 0; i < 20; i++) {
      const node = new THREE.Mesh(nodeGeometry, nodeMaterial.clone());
      node.position.set(
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10,
        (Math.random() - 0.5) * 10
      );
      node.userData = {
        originalPosition: node.position.clone(),
        speed: Math.random() * 0.02 + 0.01,
        phase: Math.random() * Math.PI * 2
      };
      scene.add(node);
    }

    // Central hub
    const hubGeometry = new THREE.OctahedronGeometry(0.5);
    const hubMaterial = new THREE.MeshPhongMaterial({ 
      color: 0x112240,
      wireframe: true
    });
    const hub = new THREE.Mesh(hubGeometry, hubMaterial);
    hub.userData = { rotationSpeed: 0.01 };
    scene.add(hub);

    // Connection lines
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: 0xBF5700,
      transparent: true,
      opacity: 0.3
    });

    const lineGeometry = new THREE.BufferGeometry();
    const positions = [];
    
    for (let i = 0; i < 100; i++) {
      positions.push(
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20,
        (Math.random() - 0.5) * 20
      );
    }
    
    lineGeometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    const lines = new THREE.Line(lineGeometry, lineMaterial);
    scene.add(lines);
  };

  const animate = () => {
    animationFrameRef.current = requestAnimationFrame(animate);

    if (!sceneRef.current || !rendererRef.current) return;

    const time = Date.now() * 0.001;

    // Animate nodes
    sceneRef.current.children.forEach(child => {
      if (child.userData.originalPosition) {
        child.position.y = child.userData.originalPosition.y + 
          Math.sin(time * child.userData.speed + child.userData.phase) * 0.5;
        child.rotation.x += 0.01;
        child.rotation.y += 0.01;
      }
      
      if (child.userData.rotationSpeed) {
        child.rotation.x += child.userData.rotationSpeed;
        child.rotation.y += child.userData.rotationSpeed;
      }
    });

    rendererRef.current.render(sceneRef.current, rendererRef.current.camera || new THREE.PerspectiveCamera());
  };

  const loadRealTimeData = async () => {
    setIsLoading(true);
    try {
      const responses = await Promise.all([
        fetch('/api/sports/live'),
        fetch('/api/analytics/dashboard'),
        fetch('/api/pressure/current')
      ]);

      const [sportsData, analyticsData, pressureData] = await Promise.all(
        responses.map(r => r.json())
      );

      setRealTimeData({
        sports: sportsData,
        analytics: analyticsData,
        pressure: pressureData
      });
      
      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error loading real-time data:', error);
      setConnectionStatus('error');
    } finally {
      setIsLoading(false);
    }
  };

  const setupWebSocketConnection = () => {
    try {
      const ws = new WebSocket(`ws://${window.location.host}`);
      
      ws.onopen = () => {
        setConnectionStatus('connected');
        ws.send(JSON.stringify({
          type: 'subscribe',
          streams: ['pressure_analytics', 'live_scores', 'performance_metrics']
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        handleWebSocketMessage(data);
      };

      ws.onclose = () => {
        setConnectionStatus('disconnected');
        // Attempt reconnection
        setTimeout(setupWebSocketConnection, 5000);
      };

      ws.onerror = () => {
        setConnectionStatus('error');
      };
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      setConnectionStatus('error');
    }
  };

  const handleWebSocketMessage = (data) => {
    switch (data.type) {
      case 'pressure_stream':
        setRealTimeData(prev => ({
          ...prev,
          pressure: data.data
        }));
        break;
      case 'live_scores':
        setRealTimeData(prev => ({
          ...prev,
          sports: data.data
        }));
        break;
      case 'performance_metrics':
        setAnalyticsData(prev => ({
          ...prev,
          performance: data.data
        }));
        break;
    }
  };

  const cleanup = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (rendererRef.current) {
      rendererRef.current.dispose();
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#4CAF50';
      case 'connecting': return '#FF9800';
      case 'disconnected': return '#757575';
      case 'error': return '#F44336';
      default: return '#757575';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return '🟢 Connected';
      case 'connecting': return '🟡 Connecting...';
      case 'disconnected': return '⚪ Disconnected';
      case 'error': return '🔴 Connection Error';
      default: return '⚪ Unknown';
    }
  };

  const renderDashboard = () => (
    <div className="dashboard-content">
      <div className="metrics-grid">
        <div className="metric-card">
          <h3>🏈 Live Games</h3>
          <div className="metric-value">{realTimeData.sports?.games?.length || 0}</div>
          <p>Active games being tracked</p>
        </div>
        
        <div className="metric-card">
          <h3>👥 Players Monitored</h3>
          <div className="metric-value">{realTimeData.pressure?.players?.length || 0}</div>
          <p>Real-time biometric tracking</p>
        </div>
        
        <div className="metric-card">
          <h3>📊 Data Points/sec</h3>
          <div className="metric-value">{analyticsData.performance?.messagesSent || 0}</div>
          <p>Live data processing rate</p>
        </div>
        
        <div className="metric-card">
          <h3>⚡ Latency</h3>
          <div className="metric-value">{analyticsData.performance?.dataLatency || 0}ms</div>
          <p>Real-time data latency</p>
        </div>
      </div>

      <div className="live-updates">
        <h3>Live Data Feed</h3>
        <div className="updates-list">
          <div className="update-item">
            <span className="timestamp">{new Date().toLocaleTimeString()}</span>
            <span className="update-text">Pressure analytics updated for 12 players</span>
          </div>
          <div className="update-item">
            <span className="timestamp">{new Date().toLocaleTimeString()}</span>
            <span className="update-text">Live scores refreshed - Cardinals vs Titans</span>
          </div>
          <div className="update-item">
            <span className="timestamp">{new Date().toLocaleTimeString()}</span>
            <span className="update-text">Video analysis completed - Job #47283</span>
          </div>
        </div>
      </div>
    </div>
  );

  const renderModuleContent = () => {
    switch (activeModule) {
      case 'dashboard':
        return renderDashboard();
      case 'digital-combine':
        return (
          <div className="module-content">
            <h2>🏃‍♂️ Digital Combine™</h2>
            <p>Biomechanical analysis and performance assessment tools</p>
            <div className="feature-grid">
              <div className="feature-card">
                <h4>📹 Video Analysis</h4>
                <p>Upload training videos for biomechanical analysis</p>
                <button className="action-button">Upload Video</button>
              </div>
              <div className="feature-card">
                <h4>📊 Performance Metrics</h4>
                <p>Track speed, agility, and movement efficiency</p>
                <button className="action-button">View Metrics</button>
              </div>
              <div className="feature-card">
                <h4>🎯 Skill Assessment</h4>
                <p>Comprehensive skill evaluation and scoring</p>
                <button className="action-button">Start Assessment</button>
              </div>
            </div>
          </div>
        );
      case 'video-analysis':
        return (
          <div className="module-content">
            <h2>🎬 Video Intelligence</h2>
            <p>AI-powered video analysis and player tracking</p>
            <div className="analysis-status">
              <div className="status-item">
                <span>Active Jobs:</span>
                <span className="status-value">3</span>
              </div>
              <div className="status-item">
                <span>Completed Today:</span>
                <span className="status-value">27</span>
              </div>
              <div className="status-item">
                <span>Processing Queue:</span>
                <span className="status-value">5</span>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="module-content">
            <h2>{modules[activeModule]?.icon} {modules[activeModule]?.name}</h2>
            <p>{modules[activeModule]?.description}</p>
            <div className="coming-soon">
              <h3>🚧 Coming Soon</h3>
              <p>This module is under active development.</p>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="blaze-intelligence-platform">
      {/* Header */}
      <header className="platform-header">
        <div className="header-content">
          <div className="logo-section">
            <h1>🔥 Blaze Intelligence</h1>
            <span className="platform-tagline">Championship-Level Sports Analytics</span>
          </div>
          
          <div className="header-stats">
            <div className="connection-status" style={{ color: getConnectionStatusColor() }}>
              {getConnectionStatusText()}
            </div>
            <div className="active-users">
              👥 {Math.floor(Math.random() * 500) + 100} Active Users
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="platform-content">
        {/* Sidebar Navigation */}
        <nav className="platform-sidebar">
          <div className="nav-section">
            <h3>Platform Modules</h3>
            {Object.entries(modules).map(([key, module]) => (
              <button
                key={key}
                className={`nav-item ${activeModule === key ? 'active' : ''}`}
                onClick={() => setActiveModule(key)}
              >
                <span className="nav-icon">{module.icon}</span>
                <span className="nav-text">{module.name}</span>
              </button>
            ))}
          </div>
          
          <div className="nav-section">
            <h3>Quick Actions</h3>
            <button className="quick-action">
              📊 View Analytics
            </button>
            <button className="quick-action">
              🎬 Upload Video
            </button>
            <button className="quick-action">
              📈 Generate Report
            </button>
          </div>
        </nav>

        {/* Main Content Area */}
        <main className="main-content">
          {isLoading ? (
            <div className="loading-container">
              <div className="loading-spinner"></div>
              <p>Loading platform data...</p>
            </div>
          ) : (
            <div className="content-wrapper">
              <div className="content-header">
                <h2>{modules[activeModule]?.icon} {modules[activeModule]?.name}</h2>
                <p>{modules[activeModule]?.description}</p>
              </div>
              
              {renderModuleContent()}
            </div>
          )}
        </main>

        {/* 3D Visualization Panel */}
        <aside className="visualization-panel">
          <div className="panel-header">
            <h3>🌐 Live Data Visualization</h3>
          </div>
          <canvas 
            ref={canvasRef} 
            className="three-canvas"
            width="300"
            height="400"
          />
          <div className="visualization-controls">
            <button className="viz-control">🎮 Controls</button>
            <button className="viz-control">📊 Data View</button>
            <button className="viz-control">🔄 Reset</button>
          </div>
        </aside>
      </div>

      <style jsx>{`
        .blaze-intelligence-platform {
          min-height: 100vh;
          background: linear-gradient(135deg, #0A192F 0%, #112240 100%);
          color: white;
          font-family: 'Inter', sans-serif;
        }

        .platform-header {
          background: rgba(255, 255, 255, 0.05);
          backdrop-filter: blur(10px);
          border-bottom: 1px solid rgba(191, 87, 0, 0.3);
          padding: 20px 0;
        }

        .header-content {
          max-width: 1400px;
          margin: 0 auto;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0 20px;
        }

        .logo-section h1 {
          margin: 0;
          color: #BF5700;
          font-size: 28px;
          font-weight: 700;
        }

        .platform-tagline {
          color: #888;
          font-size: 14px;
          font-weight: 500;
        }

        .header-stats {
          display: flex;
          gap: 30px;
          align-items: center;
        }

        .connection-status, .active-users {
          font-size: 14px;
          font-weight: 500;
        }

        .platform-content {
          max-width: 1400px;
          margin: 0 auto;
          display: grid;
          grid-template-columns: 280px 1fr 320px;
          gap: 30px;
          padding: 30px 20px;
          min-height: calc(100vh - 120px);
        }

        .platform-sidebar {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          height: fit-content;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .nav-section {
          margin-bottom: 30px;
        }

        .nav-section h3 {
          color: #BF5700;
          margin: 0 0 15px 0;
          font-size: 16px;
          font-weight: 600;
        }

        .nav-item {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 16px;
          background: transparent;
          border: none;
          color: white;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;
          margin-bottom: 8px;
          text-align: left;
        }

        .nav-item:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .nav-item.active {
          background: rgba(191, 87, 0, 0.2);
          border-left: 4px solid #BF5700;
        }

        .nav-icon {
          font-size: 18px;
        }

        .nav-text {
          font-size: 14px;
          font-weight: 500;
        }

        .quick-action {
          display: block;
          width: 100%;
          padding: 10px 16px;
          background: rgba(76, 175, 80, 0.1);
          border: 1px solid rgba(76, 175, 80, 0.3);
          color: #4CAF50;
          border-radius: 6px;
          cursor: pointer;
          margin-bottom: 8px;
          font-size: 14px;
          transition: all 0.3s ease;
        }

        .quick-action:hover {
          background: rgba(76, 175, 80, 0.2);
        }

        .main-content {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 30px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          overflow-y: auto;
        }

        .content-header {
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .content-header h2 {
          margin: 0 0 10px 0;
          color: #BF5700;
          font-size: 24px;
          font-weight: 600;
        }

        .metrics-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 20px;
          margin-bottom: 30px;
        }

        .metric-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
          text-align: center;
        }

        .metric-card h3 {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #BF5700;
        }

        .metric-value {
          font-size: 32px;
          font-weight: 700;
          color: white;
          margin-bottom: 10px;
        }

        .metric-card p {
          margin: 0;
          color: #888;
          font-size: 14px;
        }

        .live-updates {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 12px;
          padding: 20px;
        }

        .live-updates h3 {
          margin: 0 0 15px 0;
          color: #BF5700;
        }

        .updates-list {
          max-height: 200px;
          overflow-y: auto;
        }

        .update-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 10px 0;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .update-item:last-child {
          border-bottom: none;
        }

        .timestamp {
          color: #BF5700;
          font-size: 12px;
          font-weight: 500;
        }

        .update-text {
          color: #ccc;
          font-size: 14px;
        }

        .feature-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .feature-card {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .feature-card h4 {
          margin: 0 0 10px 0;
          color: #BF5700;
        }

        .feature-card p {
          margin: 0 0 15px 0;
          color: #ccc;
          font-size: 14px;
        }

        .action-button {
          background: #BF5700;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: 500;
          transition: all 0.3s ease;
        }

        .action-button:hover {
          background: #e67e00;
        }

        .visualization-panel {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          height: fit-content;
        }

        .panel-header h3 {
          margin: 0 0 20px 0;
          color: #BF5700;
          font-size: 16px;
          font-weight: 600;
        }

        .three-canvas {
          width: 100%;
          height: 400px;
          border-radius: 8px;
          background: rgba(0, 0, 0, 0.2);
        }

        .visualization-controls {
          display: flex;
          gap: 10px;
          margin-top: 15px;
        }

        .viz-control {
          flex: 1;
          background: rgba(255, 255, 255, 0.1);
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          font-size: 12px;
          transition: all 0.3s ease;
        }

        .viz-control:hover {
          background: rgba(255, 255, 255, 0.2);
        }

        .loading-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          height: 400px;
        }

        .loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left: 4px solid #BF5700;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        .analysis-status {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
          gap: 20px;
          margin-top: 20px;
        }

        .status-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          padding: 15px;
          background: rgba(255, 255, 255, 0.05);
          border-radius: 8px;
        }

        .status-value {
          font-size: 24px;
          font-weight: bold;
          color: #BF5700;
          margin-top: 5px;
        }

        .coming-soon {
          text-align: center;
          padding: 50px;
          color: #888;
        }

        .coming-soon h3 {
          color: #BF5700;
          margin-bottom: 15px;
        }
      `}</style>
    </div>
  );
};

export default BlazeIntelligencePlatform;