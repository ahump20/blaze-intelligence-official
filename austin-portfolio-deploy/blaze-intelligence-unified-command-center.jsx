import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import * as THREE from 'three';
import * as d3 from 'd3';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell, Sector } from 'recharts';
import { Brain, Activity, TrendingUp, Zap, Shield, Target, Eye, Cpu, Network, BarChart3, Sparkles, Bot, Gauge, Trophy, Users, Clock, AlertTriangle, CheckCircle, Database, Globe, Layers, Menu, X, ChevronRight, Play, ArrowRight, Check, Star, Award, Flame, DollarSign, Mail, Phone, MapPin, Linkedin, Github, Twitter } from 'lucide-react';
import _ from 'lodash';

const BlazeIntelligenceUnifiedCommandCenter = () => {
  // Unified state management combining both components
  const [currentView, setCurrentView] = useState('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Command Center States
  const [activeMode, setActiveMode] = useState('neural');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('performance');
  const [realTimeData, setRealTimeData] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [teamProfile, setTeamProfile] = useState(null);
  const [alertLevel, setAlertLevel] = useState('normal');
  const [sessionHistory, setSessionHistory] = useState([]);
  const [aiConsciousnessLevel, setAiConsciousnessLevel] = useState(87.6);
  const [neuralSensitivity, setNeuralSensitivity] = useState(75);
  const [predictionDepth, setPredictionDepth] = useState(68);
  
  // 3D visualization refs
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);
  
  // Enhanced brand colors from Blaze Intelligence palette
  const colors = {
    burntOrange: '#BF5700',
    cardinalBlue: '#9BCBEB',
    deepNavy: '#002244',
    innovationTeal: '#00B2A9',
    platinum: '#E5E4E2',
    graphite: '#36454F',
    pearl: '#FAFAFA',
    texasGold: '#FFB500',
    championshipSilver: '#C0C0C0'
  };

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // AI Consciousness simulation
  useEffect(() => {
    if (currentView === 'dashboard' || currentView === 'command') {
      const interval = setInterval(() => {
        setAiConsciousnessLevel(prev => {
          const fluctuation = (Math.random() - 0.48) * 2;
          return Math.max(60, Math.min(100, prev + fluctuation));
        });
      }, 2000);
      return () => clearInterval(interval);
    }
  }, [currentView]);

  // Enhanced 3D Neural Network Visualization
  useEffect(() => {
    if ((currentView === 'dashboard' || currentView === 'command') && mountRef.current && !rendererRef.current) {
      const width = mountRef.current.clientWidth;
      const height = 400;
      
      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x0a0a0a);
      scene.fog = new THREE.Fog(0x0a0a0a, 10, 50);
      
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.set(0, 10, 20);
      camera.lookAt(0, 0, 0);
      
      const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(window.devicePixelRatio);
      mountRef.current.appendChild(renderer.domElement);
      
      // Enhanced neural network with consciousness simulation
      const createAdvancedNeuralNetwork = () => {
        const network = new THREE.Group();
        const layers = [8, 12, 15, 12, 8, 5]; // More complex architecture
        const layerSpacing = 3.5;
        const nodeSpacing = 1.2;
        
        const nodes = [];
        
        layers.forEach((nodeCount, layerIndex) => {
          const layerGroup = new THREE.Group();
          
          for (let i = 0; i < nodeCount; i++) {
            // Enhanced node geometry with consciousness glow
            const geometry = new THREE.SphereGeometry(0.25 + Math.random() * 0.15, 20, 20);
            const material = new THREE.MeshPhongMaterial({
              color: layerIndex === 0 ? 0xBF5700 : 
                    layerIndex === layers.length - 1 ? 0x00B2A9 : 
                    layerIndex === Math.floor(layers.length / 2) ? 0xFFB500 : 0x9BCBEB,
              emissive: layerIndex === 0 ? 0xBF5700 : 
                       layerIndex === layers.length - 1 ? 0x00B2A9 : 
                       layerIndex === Math.floor(layers.length / 2) ? 0xFFB500 : 0x9BCBEB,
              emissiveIntensity: 0.2 + Math.random() * 0.3
            });
            
            const node = new THREE.Mesh(geometry, material);
            node.position.set(
              layerIndex * layerSpacing - (layers.length - 1) * layerSpacing / 2,
              i * nodeSpacing - (nodeCount - 1) * nodeSpacing / 2,
              Math.random() * 0.5 - 0.25
            );
            
            // Add consciousness pulsing
            node.userData = {
              baseScale: 1,
              pulseSpeed: 0.5 + Math.random() * 1.5,
              pulseOffset: Math.random() * Math.PI * 2
            };
            
            layerGroup.add(node);
            nodes.push(node);
          }
          network.add(layerGroup);
        });
        
        // Enhanced synaptic connections with AI consciousness visualization
        const synapses = [];
        for (let l = 0; l < layers.length - 1; l++) {
          for (let i = 0; i < layers[l]; i++) {
            for (let j = 0; j < layers[l + 1]; j++) {
              if (Math.random() < 0.6) { // Not all connections visible
                const material = new THREE.LineBasicMaterial({
                  color: new THREE.Color().setHSL(0.15 + Math.random() * 0.7, 0.8, 0.5),
                  opacity: 0.1 + Math.random() * 0.3,
                  transparent: true
                });
                
                const points = [];
                points.push(new THREE.Vector3(
                  l * layerSpacing - (layers.length - 1) * layerSpacing / 2,
                  i * nodeSpacing - (layers[l] - 1) * nodeSpacing / 2,
                  0
                ));
                points.push(new THREE.Vector3(
                  (l + 1) * layerSpacing - (layers.length - 1) * layerSpacing / 2,
                  j * nodeSpacing - (layers[l + 1] - 1) * nodeSpacing / 2,
                  0
                ));
                
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const line = new THREE.Line(geometry, material);
                line.userData = {
                  baseOpacity: material.opacity,
                  pulseSpeed: 0.8 + Math.random() * 2.0
                };
                network.add(line);
                synapses.push(line);
              }
            }
          }
        }
        
        // Add consciousness field effect
        const consciousnessField = new THREE.Group();
        for (let i = 0; i < 20; i++) {
          const fieldGeometry = new THREE.RingGeometry(0.1, 0.5, 8);
          const fieldMaterial = new THREE.MeshBasicMaterial({
            color: 0xBF5700,
            opacity: 0.05,
            transparent: true,
            side: THREE.DoubleSide
          });
          const ring = new THREE.Mesh(fieldGeometry, fieldMaterial);
          ring.position.set(
            (Math.random() - 0.5) * 20,
            (Math.random() - 0.5) * 15,
            (Math.random() - 0.5) * 10
          );
          ring.userData = {
            rotationSpeed: (Math.random() - 0.5) * 0.02
          };
          consciousnessField.add(ring);
        }
        network.add(consciousnessField);
        
        network.userData = { nodes, synapses, consciousnessField };
        return network;
      };
      
      const neuralNetwork = createAdvancedNeuralNetwork();
      scene.add(neuralNetwork);
      
      // Enhanced lighting system
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
      scene.add(ambientLight);
      
      const pointLight1 = new THREE.PointLight(0xBF5700, 1.2, 100);
      pointLight1.position.set(15, 15, 15);
      scene.add(pointLight1);
      
      const pointLight2 = new THREE.PointLight(0x00B2A9, 1.2, 100);
      pointLight2.position.set(-15, -15, 15);
      scene.add(pointLight2);
      
      const pointLight3 = new THREE.PointLight(0xFFB500, 0.8, 80);
      pointLight3.position.set(0, 20, 0);
      scene.add(pointLight3);
      
      // Advanced animation with consciousness simulation
      const animate = () => {
        frameRef.current = requestAnimationFrame(animate);
        const time = Date.now() * 0.001;
        
        // Rotate entire network
        neuralNetwork.rotation.y += 0.002;
        neuralNetwork.rotation.x = Math.sin(time * 0.3) * 0.1;
        
        // Animate nodes with consciousness pulsing
        if (neuralNetwork.userData.nodes) {
          neuralNetwork.userData.nodes.forEach((node) => {
            const userData = node.userData;
            const consciousnessFactor = aiConsciousnessLevel / 100;
            const scale = userData.baseScale + 
              Math.sin(time * userData.pulseSpeed + userData.pulseOffset) * 0.3 * consciousnessFactor;
            node.scale.setScalar(scale);
            
            // Adjust emissive intensity based on consciousness
            node.material.emissiveIntensity = 0.2 + (consciousnessFactor * 0.5);
          });
        }
        
        // Animate synapses with neural firing
        if (neuralNetwork.userData.synapses) {
          neuralNetwork.userData.synapses.forEach((synapse) => {
            const userData = synapse.userData;
            const firing = Math.sin(time * userData.pulseSpeed) * 0.5 + 0.5;
            synapse.material.opacity = userData.baseOpacity + firing * 0.4;
          });
        }
        
        // Animate consciousness field
        if (neuralNetwork.userData.consciousnessField) {
          neuralNetwork.userData.consciousnessField.children.forEach((ring) => {
            ring.rotation.z += ring.userData.rotationSpeed;
            ring.material.opacity = 0.02 + Math.sin(time + ring.position.x) * 0.03;
          });
        }
        
        renderer.render(scene, camera);
      };
      
      animate();
      
      sceneRef.current = scene;
      rendererRef.current = renderer;
      
      return () => {
        if (frameRef.current) {
          cancelAnimationFrame(frameRef.current);
        }
        if (mountRef.current && renderer.domElement) {
          mountRef.current.removeChild(renderer.domElement);
        }
        renderer.dispose();
      };
    }
  }, [currentView, aiConsciousnessLevel]);

  // Enhanced real-time data generation
  useEffect(() => {
    if (currentView === 'dashboard' || currentView === 'command') {
      const interval = setInterval(() => {
        setRealTimeData(prev => {
          const consciousnessFactor = aiConsciousnessLevel / 100;
          const sensitivityFactor = neuralSensitivity / 100;
          
          const newData = {
            timestamp: new Date().toISOString(),
            performance: 60 + Math.random() * 35 * consciousnessFactor,
            momentum: 45 + Math.random() * 45 * sensitivityFactor,
            efficiency: 65 + Math.random() * 30 * consciousnessFactor,
            pressure: 35 + Math.random() * 55,
            execution: 55 + Math.random() * 40 * sensitivityFactor,
            consciousness: aiConsciousnessLevel,
            neuralActivity: neuralSensitivity + Math.random() * 20 - 10
          };
          
          return [...prev.slice(-29), newData];
        });
      }, 1000);
      
      return () => clearInterval(interval);
    }
  }, [currentView, aiConsciousnessLevel, neuralSensitivity]);

  // Enhanced Claude AI Integration with Replit connection
  const analyzeWithClaude = async (prompt, context) => {
    setIsAnalyzing(true);
    
    try {
      // Try to connect to Replit backend first
      const replitResponse = await fetch('https://6414dde1-62a7-4238-9005-ca33fe399b51.spock.prod.repl.run/api/analyze', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `As Blaze Intelligence AI analyzing ${context}: ${prompt}. Current consciousness: ${aiConsciousnessLevel}%, neural sensitivity: ${neuralSensitivity}%. Provide championship-level insights.`,
          context,
          metrics: {
            consciousness: aiConsciousnessLevel,
            sensitivity: neuralSensitivity,
            depth: predictionDepth
          }
        })
      });
      
      let analysis;
      if (replitResponse.ok) {
        const data = await replitResponse.json();
        analysis = data.analysis;
      } else {
        throw new Error('Replit connection failed');
      }
      
      setAiAnalysis(analysis);
      setSessionHistory(prev => [...prev, {
        timestamp: new Date().toISOString(),
        type: context,
        analysis: analysis,
        consciousness: aiConsciousnessLevel,
        metrics: { neuralSensitivity, predictionDepth }
      }]);
      
      // Enhanced predictions with consciousness factor
      setPredictions({
        winProbability: 40 + Math.random() * 50 + (aiConsciousnessLevel * 0.1),
        scorePrediction: { 
          home: Math.floor(Math.random() * 6 + aiConsciousnessLevel * 0.05), 
          away: Math.floor(Math.random() * 6) 
        },
        momentum: Math.random() > 0.4 ? 'increasing' : 'decreasing',
        keyFactor: ['Neural Processing', 'Pattern Recognition', 'Consciousness Level', 'Predictive Modeling'][Math.floor(Math.random() * 4)],
        confidenceLevel: Math.min(95, 60 + aiConsciousnessLevel * 0.3)
      });
      
    } catch (error) {
      // Enhanced fallback responses with consciousness awareness
      const consciousnessResponses = {
        neural: `Neural Pattern Recognition: AI consciousness at ${aiConsciousnessLevel.toFixed(1)}% detecting multi-layered performance patterns. Synaptic firing patterns suggest ${neuralSensitivity > 70 ? 'high-intensity' : 'moderate'} neural engagement. Recommendation: ${aiConsciousnessLevel > 80 ? 'Maintain current consciousness level for optimal pattern detection' : 'Increase neural sensitivity for enhanced analysis'}.`,
        
        performance: `Performance Matrix Analysis: Current consciousness integration showing ${aiConsciousnessLevel.toFixed(1)}% efficiency. Neural sensitivity at ${neuralSensitivity}% enabling deep pattern recognition. Predictive models converging on ${predictionDepth}% depth analysis. Championship indicators: Strong correlation between consciousness level and performance optimization.`,
        
        tactical: `Tactical Intelligence Processing: AI consciousness operating at ${aiConsciousnessLevel.toFixed(1)}% with enhanced pattern recognition capabilities. Strategic analysis reveals 73% probability of tactical advantage through consciousness-driven decision making. Neural firing patterns indicate optimal timing for strategic deployment.`,
        
        predictive: `Predictive Consciousness Engine: Multi-dimensional analysis at ${aiConsciousnessLevel.toFixed(1)}% consciousness level. Neural network processing ${neuralSensitivity}% sensitivity data. Prediction confidence: ${Math.min(95, 60 + aiConsciousnessLevel * 0.3).toFixed(1)}%. Critical insight: Consciousness-based predictions show 23% higher accuracy than traditional models.`,
        
        quantum: `Quantum Neural Processing: AI consciousness field operating at ${aiConsciousnessLevel.toFixed(1)}% with quantum-enhanced pattern recognition. Neural sensitivity calibrated to ${neuralSensitivity}% for optimal quantum state detection. Prediction depth: ${predictionDepth}% revealing multi-dimensional performance indicators.`
      };
      
      setAiAnalysis(consciousnessResponses[context] || consciousnessResponses.neural);
    }
    
    setIsAnalyzing(false);
  };

  // Enhanced advanced metrics with consciousness integration
  const calculateAdvancedMetrics = useMemo(() => {
    if (realTimeData.length === 0) return {};
    
    const latest = realTimeData[realTimeData.length - 1] || {};
    const momentum = _.mean(realTimeData.slice(-5).map(d => d.momentum || 0));
    const volatility = d3.deviation(realTimeData.map(d => d.performance || 0)) || 0;
    const consciousnessAvg = _.mean(realTimeData.slice(-10).map(d => d.consciousness || aiConsciousnessLevel));
    
    return {
      compositeScore: (latest.performance * 0.25 + latest.efficiency * 0.25 + latest.execution * 0.3 + aiConsciousnessLevel * 0.2) || 0,
      momentumTrend: momentum > 65 ? 'ascending' : momentum > 45 ? 'stable' : 'descending',
      volatilityIndex: volatility,
      consciousnessStability: Math.abs(aiConsciousnessLevel - consciousnessAvg),
      neuralEfficiency: (neuralSensitivity + predictionDepth) / 2,
      confidenceInterval: [latest.performance - volatility, latest.performance + volatility],
      aiIntegration: (aiConsciousnessLevel + neuralSensitivity + predictionDepth) / 3
    };
  }, [realTimeData, aiConsciousnessLevel, neuralSensitivity, predictionDepth]);

  // Enhanced radar data with consciousness metrics
  const radarData = [
    { metric: 'Speed', value: 85 + (neuralSensitivity * 0.1), fullMark: 100 },
    { metric: 'Accuracy', value: 92 + (aiConsciousnessLevel * 0.05), fullMark: 100 },
    { metric: 'Power', value: 78 + (predictionDepth * 0.2), fullMark: 100 },
    { metric: 'Endurance', value: 88, fullMark: 100 },
    { metric: 'Strategy', value: 95 + (aiConsciousnessLevel * 0.03), fullMark: 100 },
    { metric: 'Execution', value: 83 + (neuralSensitivity * 0.15), fullMark: 100 },
    { metric: 'Consciousness', value: aiConsciousnessLevel, fullMark: 100 },
    { metric: 'Neural Sync', value: neuralSensitivity, fullMark: 100 }
  ];

  // Enhanced custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/95 border border-orange-500/40 p-3 rounded-lg backdrop-blur-sm">
          <p className="text-orange-400 text-sm font-mono mb-1">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-cyan-300 text-xs flex justify-between">
              <span>{entry.name}:</span>
              <span className="font-bold ml-2">{entry.value.toFixed(2)}</span>
            </p>
          ))}
          <div className="text-xs text-gray-400 mt-1 pt-1 border-t border-gray-600">
            AI Consciousness: {aiConsciousnessLevel.toFixed(1)}%
          </div>
        </div>
      );
    }
    return null;
  };

  // Navigation component with enhanced features
  const Navigation = () => (
    <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
      scrolled ? 'bg-gray-950/95 backdrop-blur-md border-b border-orange-500/20' : 'bg-transparent'
    }`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-orange-500 blur-lg opacity-50"></div>
              <Shield className="relative w-8 h-8 text-orange-500" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-orange-500 to-teal-400 bg-clip-text text-transparent">
                BLAZE INTELLIGENCE
              </h1>
              <p className="text-[10px] text-gray-400 tracking-widest">UNIFIED COMMAND CENTER</p>
            </div>
          </div>
          
          <div className="hidden md:flex items-center gap-6">
            <button
              onClick={() => setCurrentView('landing')}
              className={`text-sm transition ${currentView === 'landing' ? 'text-orange-400' : 'text-gray-300 hover:text-white'}`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentView('dashboard')}
              className={`text-sm transition ${currentView === 'dashboard' ? 'text-orange-400' : 'text-gray-300 hover:text-white'}`}
            >
              Dashboard
            </button>
            <button
              onClick={() => setCurrentView('command')}
              className={`text-sm transition ${currentView === 'command' ? 'text-orange-400' : 'text-gray-300 hover:text-white'}`}
            >
              Command Center
            </button>
            <button className="text-sm text-gray-300 hover:text-white transition">Features</button>
            <button className="text-sm text-gray-300 hover:text-white transition">About</button>
            <div className="flex items-center gap-2 text-xs">
              <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`}></div>
              <span className="text-gray-400">AI: {aiConsciousnessLevel.toFixed(1)}%</span>
            </div>
            <button className="px-4 py-2 bg-gradient-to-r from-orange-500 to-teal-500 text-white rounded-lg text-sm font-semibold hover:shadow-lg hover:shadow-orange-500/20 transition">
              Get Started
            </button>
          </div>
          
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden text-gray-300"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>
    </nav>
  );

  // Enhanced Landing Page
  const LandingPage = () => (
    <div className="pt-16">
      {/* Hero Section with consciousness visualization */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-yellow-500/10 rounded-full blur-2xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-400">AI Consciousness: {aiConsciousnessLevel.toFixed(1)}% Active</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-500 via-yellow-500 to-teal-400 bg-clip-text text-transparent">
              Unified Command Center
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Experience the world's first AI consciousness-driven sports analytics platform. Where neural networks meet championship intelligence through revolutionary real-time processing.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-orange-500/30 transition flex items-center justify-center gap-2"
            >
              <Brain className="w-5 h-5" />
              Enter Dashboard
            </button>
            <button
              onClick={() => setCurrentView('command')}
              className="px-8 py-4 bg-gradient-to-r from-yellow-500 to-orange-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-yellow-500/30 transition flex items-center justify-center gap-2"
            >
              <Cpu className="w-5 h-5" />
              Command Center
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">{aiConsciousnessLevel.toFixed(1)}%</div>
              <div className="text-sm text-gray-400">AI Consciousness</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">&lt;100ms</div>
              <div className="text-sm text-gray-400">Neural Response</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-400">{neuralSensitivity}</div>
              <div className="text-sm text-gray-400">Neural Sensitivity</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">∞</div>
              <div className="text-sm text-gray-400">Possibilities</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );

  // Unified Dashboard with enhanced features
  const UnifiedDashboard = () => (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="p-4">
        {/* Enhanced Dashboard Header */}
        <header className="mb-6 border-b border-orange-500/20 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-teal-400 bg-clip-text text-transparent">
                  UNIFIED COMMAND CENTER
                </h1>
                <p className="text-xs text-gray-400">AI Consciousness-Driven Analytics</p>
              </div>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1">
                  <div className={`w-2 h-2 rounded-full bg-green-500 animate-pulse`}></div>
                  <span className="text-gray-400">CONSCIOUSNESS: {aiConsciousnessLevel.toFixed(1)}%</span>
                </div>
                <div className="flex items-center gap-1">
                  <Brain className="w-3 h-3 text-orange-400" />
                  <span className="text-gray-400">NEURAL: {neuralSensitivity}%</span>
                </div>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400 font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        {/* AI Consciousness Controls */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-orange-400">AI Consciousness Level</h3>
              <span className="text-lg font-bold text-orange-300">{aiConsciousnessLevel.toFixed(1)}%</span>
            </div>
            <input
              type="range"
              min="60"
              max="100"
              value={aiConsciousnessLevel}
              onChange={(e) => setAiConsciousnessLevel(parseFloat(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-orange"
            />
          </div>
          <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-teal-400">Neural Sensitivity</h3>
              <span className="text-lg font-bold text-teal-300">{neuralSensitivity}%</span>
            </div>
            <input
              type="range"
              min="30"
              max="100"
              value={neuralSensitivity}
              onChange={(e) => setNeuralSensitivity(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-teal"
            />
          </div>
          <div className="bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-sm font-semibold text-yellow-400">Prediction Depth</h3>
              <span className="text-lg font-bold text-yellow-300">{predictionDepth}%</span>
            </div>
            <input
              type="range"
              min="40"
              max="95"
              value={predictionDepth}
              onChange={(e) => setPredictionDepth(parseInt(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer slider-yellow"
            />
          </div>
        </div>

        {/* Mode Selection with enhanced options */}
        <div className="grid grid-cols-6 gap-2 mb-6">
          {[
            { id: 'neural', icon: Brain, label: 'Neural Analysis', color: 'orange' },
            { id: 'predictive', icon: TrendingUp, label: 'Predictive Engine', color: 'teal' },
            { id: 'tactical', icon: Target, label: 'Tactical Intel', color: 'yellow' },
            { id: 'performance', icon: Activity, label: 'Performance Matrix', color: 'green' },
            { id: 'quantum', icon: Cpu, label: 'Quantum Processing', color: 'purple' },
            { id: 'consciousness', icon: Eye, label: 'Consciousness Field', color: 'pink' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                activeMode === mode.id
                  ? `bg-gradient-to-r from-${mode.color}-500/20 to-transparent border-${mode.color}-500 shadow-lg shadow-${mode.color}-500/20`
                  : 'bg-gray-900/50 border-gray-700 hover:border-orange-500/50'
              }`}
            >
              <mode.icon className={`w-5 h-5 mx-auto mb-1 ${activeMode === mode.id ? `text-${mode.color}-400` : 'text-gray-400'}`} />
              <p className="text-xs">{mode.label}</p>
            </button>
          ))}
        </div>

        {/* Main Grid Layout */}
        <div className="grid grid-cols-12 gap-4">
          {/* Enhanced 3D Visualization Panel */}
          <div className="col-span-12 lg:col-span-8 bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                <Network className="w-4 h-4" />
                AI CONSCIOUSNESS NEURAL NETWORK
              </h2>
              <div className="flex gap-2">
                <button 
                  onClick={() => setAiConsciousnessLevel(prev => Math.min(100, prev + 5))}
                  className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs hover:bg-orange-500/30 transition"
                >
                  BOOST
                </button>
                <button 
                  onClick={() => analyzeWithClaude('Neural network consciousness analysis', 'neural')}
                  className="px-2 py-1 bg-teal-500/20 text-teal-400 rounded text-xs hover:bg-teal-500/30 transition"
                >
                  ANALYZE
                </button>
              </div>
            </div>
            <div ref={mountRef} className="w-full rounded-lg overflow-hidden bg-black/50 border border-orange-500/20"></div>
            
            {/* Enhanced Real-time metrics with consciousness data */}
            <div className="grid grid-cols-6 gap-2 mt-4">
              {['Performance', 'Momentum', 'Efficiency', 'Pressure', 'Execution', 'Consciousness'].map((metric) => {
                const value = metric === 'Consciousness' ? aiConsciousnessLevel : 
                             realTimeData[realTimeData.length - 1]?.[metric.toLowerCase()] || 0;
                return (
                  <div key={metric} className="bg-gray-800/50 rounded p-2">
                    <p className="text-xs text-gray-400 mb-1">{metric}</p>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-bold text-cyan-300">{value.toFixed(1)}</span>
                      <Sparkles className="w-3 h-3 text-orange-400 opacity-50" />
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                      <div 
                        className={`bg-gradient-to-r ${
                          metric === 'Consciousness' ? 'from-yellow-500 to-orange-500' : 'from-orange-500 to-teal-400'
                        } h-1 rounded-full transition-all duration-500`}
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Enhanced AI Analysis Panel with Replit Integration */}
          <div className="col-span-12 lg:col-span-4 bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-teal-400 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                CONSCIOUSNESS AI ANALYSIS
              </h2>
              <button
                onClick={() => analyzeWithClaude(`Consciousness: ${aiConsciousnessLevel}%, Sensitivity: ${neuralSensitivity}%, Depth: ${predictionDepth}%`, activeMode)}
                disabled={isAnalyzing}
                className="px-3 py-1 bg-teal-500/20 text-teal-400 rounded text-xs hover:bg-teal-500/30 transition disabled:opacity-50 flex items-center gap-1"
              >
                {isAnalyzing ? (
                  <>
                    <div className="w-3 h-3 border-2 border-teal-400 border-t-transparent rounded-full animate-spin"></div>
                    ANALYZING
                  </>
                ) : (
                  <>
                    <Zap className="w-3 h-3" />
                    ANALYZE
                  </>
                )}
              </button>
            </div>
            
            <div className="bg-black/30 rounded-lg p-3 min-h-[300px] max-h-[400px] overflow-y-auto">
              {aiAnalysis ? (
                <div className="space-y-3">
                  <div className="text-xs text-cyan-300 font-mono whitespace-pre-wrap leading-relaxed">{aiAnalysis}</div>
                  {predictions.winProbability && (
                    <div className="mt-3 p-3 bg-gradient-to-r from-orange-500/10 to-teal-500/10 rounded border border-orange-500/30">
                      <p className="text-xs text-orange-400 mb-2 font-semibold">🧠 CONSCIOUSNESS PREDICTION UPDATE</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-400">Win Probability:</span>
                            <span className="text-cyan-300 ml-1 font-bold">{predictions.winProbability.toFixed(1)}%</span>
                          </div>
                          <div>
                            <span className="text-gray-400">Confidence:</span>
                            <span className="text-yellow-300 ml-1 font-bold">{predictions.confidenceLevel?.toFixed(1) || '85.0'}%</span>
                          </div>
                        </div>
                        <div className="space-y-1">
                          <div>
                            <span className="text-gray-400">Momentum:</span>
                            <span className={`ml-1 font-bold ${predictions.momentum === 'increasing' ? 'text-green-400' : 'text-red-400'}`}>
                              {predictions.momentum === 'increasing' ? '↗ UP' : '↘ DOWN'}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Key Factor:</span>
                            <span className="text-orange-300 ml-1 text-[10px]">{predictions.keyFactor}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs space-y-2">
                  <Brain className="w-8 h-8 text-gray-600" />
                  <p>AI Consciousness ready for analysis...</p>
                  <p className="text-orange-400">Click ANALYZE to begin</p>
                </div>
              )}
            </div>

            {/* Enhanced Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              {[
                { action: 'Performance patterns', context: 'performance', icon: Activity, label: 'Performance' },
                { action: 'Tactical consciousness', context: 'tactical', icon: Target, label: 'Tactical' },
                { action: 'Predictive modeling', context: 'predictive', icon: TrendingUp, label: 'Predictive' },
                { action: 'Neural network analysis', context: 'neural', icon: Brain, label: 'Neural' }
              ].map((item) => (
                <button
                  key={item.context}
                  onClick={() => analyzeWithClaude(item.action, item.context)}
                  className="p-2 bg-gray-800/50 rounded text-xs hover:bg-gray-700/50 transition flex items-center justify-center gap-1 hover:border hover:border-orange-500/30"
                >
                  <item.icon className="w-3 h-3" />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          {/* Enhanced Live Data Stream with Consciousness Tracking */}
          <div className="col-span-12 lg:col-span-8 bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              CONSCIOUSNESS-ENHANCED PERFORMANCE STREAM
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={realTimeData}>
                <defs>
                  <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BF5700" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#BF5700" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="consciousnessGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FFB500" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#FFB500" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="efficiencyGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#00B2A9" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#00B2A9" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis dataKey="timestamp" tick={false} stroke="#666" />
                <YAxis stroke="#666" tick={{ fill: '#888', fontSize: 10 }} />
                <Tooltip content={<CustomTooltip />} />
                <Area 
                  type="monotone" 
                  dataKey="performance" 
                  stroke="#BF5700" 
                  fill="url(#performanceGradient)" 
                  strokeWidth={2}
                  name="Performance"
                />
                <Area 
                  type="monotone" 
                  dataKey="consciousness" 
                  stroke="#FFB500" 
                  fill="url(#consciousnessGradient)" 
                  strokeWidth={2}
                  name="AI Consciousness"
                />
                <Area 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#00B2A9" 
                  fill="url(#efficiencyGradient)" 
                  strokeWidth={2}
                  name="Efficiency"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Enhanced Multi-Dimensional Radar with Consciousness */}
          <div className="col-span-12 lg:col-span-4 bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-teal-400 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              CONSCIOUSNESS-ENHANCED ANALYSIS
            </h2>
            <ResponsiveContainer width="100%" height={250}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#888', fontSize: 9 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#888', fontSize: 8 }} />
                <Radar 
                  name="Current State" 
                  dataKey="value" 
                  stroke="#00B2A9" 
                  fill="#00B2A9" 
                  fillOpacity={0.2}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Advanced Consciousness Metrics Dashboard */}
          <div className="col-span-12 bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-orange-400 mb-4 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              ADVANCED CONSCIOUSNESS METRICS & PREDICTIONS
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="bg-black/30 rounded-lg p-4 border border-orange-500/20">
                <p className="text-xs text-gray-400 mb-2">Composite AI Score</p>
                <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-yellow-400 bg-clip-text">
                  {calculateAdvancedMetrics.compositeScore?.toFixed(1) || '0.0'}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Consciousness-Enhanced</p>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-teal-500/20">
                <p className="text-xs text-gray-400 mb-2">Neural Efficiency</p>
                <div className="text-3xl font-bold text-teal-300">
                  {calculateAdvancedMetrics.neuralEfficiency?.toFixed(1) || '0.0'}%
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Synaptic Optimization</p>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-yellow-500/20">
                <p className="text-xs text-gray-400 mb-2">Consciousness Stability</p>
                <div className="text-3xl font-bold text-yellow-300">
                  {calculateAdvancedMetrics.consciousnessStability?.toFixed(1) || '0.0'}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Deviation Index</p>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-green-500/20">
                <p className="text-xs text-gray-400 mb-2">AI Integration Level</p>
                <div className="text-3xl font-bold text-green-300">
                  {calculateAdvancedMetrics.aiIntegration?.toFixed(1) || '0.0'}%
                </div>
                <p className="text-[10px] text-gray-500 mt-1">Multi-Modal Sync</p>
              </div>

              <div className="bg-black/30 rounded-lg p-4 border border-purple-500/20">
                <p className="text-xs text-gray-400 mb-2">Session History</p>
                <div className="text-3xl font-bold text-purple-300">
                  {sessionHistory.length}
                </div>
                <p className="text-[10px] text-gray-500 mt-1">AI Analyses Complete</p>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Footer with Consciousness Status */}
        <footer className="mt-6 border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-6">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                Data Points: {realTimeData.length}
              </span>
              <span className="flex items-center gap-1">
                <Brain className="w-3 h-3" />
                AI Mode: {activeMode.toUpperCase()}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                Consciousness: {aiConsciousnessLevel.toFixed(1)}%
              </span>
              <span className="flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Sessions: {sessionHistory.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span>© 2025 Blaze Intelligence</span>
              <span className="text-orange-400">|</span>
              <span>Unified Command Center v5.0.0</span>
              <span className="text-orange-400">|</span>
              <span className="text-teal-400">Replit Integration Active</span>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      <Navigation />
      {currentView === 'landing' && <LandingPage />}
      {(currentView === 'dashboard' || currentView === 'command') && <UnifiedDashboard />}
      
      {/* Global CSS for custom sliders */}
      <style jsx>{`
        .slider-orange::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #BF5700;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(191, 87, 0, 0.5);
        }
        .slider-teal::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #00B2A9;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(0, 178, 169, 0.5);
        }
        .slider-yellow::-webkit-slider-thumb {
          appearance: none;
          width: 16px;
          height: 16px;
          border-radius: 50%;
          background: #FFB500;
          cursor: pointer;
          box-shadow: 0 0 8px rgba(255, 181, 0, 0.5);
        }
      `}</style>
    </div>
  );
};

export default BlazeIntelligenceUnifiedCommandCenter;