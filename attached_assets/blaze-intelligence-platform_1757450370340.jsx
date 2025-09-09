import React, { useState, useEffect, useRef, useMemo } from 'react';
import * as THREE from 'three';
import * as d3 from 'd3';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
import { Brain, Activity, TrendingUp, Zap, Shield, Target, Eye, Cpu, Network, BarChart3, Sparkles, Bot, Gauge, Trophy, Users, Clock, AlertTriangle, CheckCircle, Database, Globe, Layers, Menu, X, ChevronRight, Play, ArrowRight, Check, Star, Award, Flame, DollarSign, Mail, Phone, MapPin, Linkedin, Github, Twitter } from 'lucide-react';
import _ from 'lodash';

const BlazeIntelligencePlatform = () => {
  const [currentView, setCurrentView] = useState('landing');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  
  // Command Center States
  const [activeMode, setActiveMode] = useState('neural');
  const [aiAnalysis, setAiAnalysis] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [realTimeData, setRealTimeData] = useState([]);
  const [predictions, setPredictions] = useState({});
  const [alertLevel, setAlertLevel] = useState('normal');
  const [sessionHistory, setSessionHistory] = useState([]);
  
  const mountRef = useRef(null);
  const sceneRef = useRef(null);
  const rendererRef = useRef(null);
  const frameRef = useRef(null);
  
  const colors = {
    burntOrange: '#BF5700',
    cardinalBlue: '#9BCBEB',
    deepNavy: '#002244',
    innovationTeal: '#00B2A9',
    platinum: '#E5E4E2',
    graphite: '#36454F',
    pearl: '#FAFAFA'
  };

  // Scroll handler
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Generate real-time data
  useEffect(() => {
    if (currentView === 'dashboard') {
      const interval = setInterval(() => {
        setRealTimeData(prev => {
          const newData = {
            timestamp: new Date().toISOString(),
            performance: 65 + Math.random() * 30,
            momentum: 50 + Math.random() * 40,
            efficiency: 70 + Math.random() * 25,
            pressure: 40 + Math.random() * 50,
            execution: 60 + Math.random() * 35
          };
          return [...prev.slice(-19), newData];
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [currentView]);

  // Initialize 3D visualization for dashboard
  useEffect(() => {
    if (currentView === 'dashboard' && mountRef.current) {
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
      
      // Create neural network
      const createNeuralNetwork = () => {
        const network = new THREE.Group();
        const layers = [5, 8, 8, 5, 3];
        const layerSpacing = 4;
        const nodeSpacing = 1.5;
        
        layers.forEach((nodeCount, layerIndex) => {
          const layerGroup = new THREE.Group();
          
          for (let i = 0; i < nodeCount; i++) {
            const geometry = new THREE.SphereGeometry(0.3, 16, 16);
            const material = new THREE.MeshPhongMaterial({
              color: layerIndex === 0 ? 0xBF5700 : layerIndex === layers.length - 1 ? 0x00B2A9 : 0x9BCBEB,
              emissive: layerIndex === 0 ? 0xBF5700 : layerIndex === layers.length - 1 ? 0x00B2A9 : 0x9BCBEB,
              emissiveIntensity: 0.3
            });
            
            const node = new THREE.Mesh(geometry, material);
            node.position.set(
              layerIndex * layerSpacing - (layers.length - 1) * layerSpacing / 2,
              i * nodeSpacing - (nodeCount - 1) * nodeSpacing / 2,
              0
            );
            layerGroup.add(node);
          }
          network.add(layerGroup);
        });
        
        // Add connections
        for (let l = 0; l < layers.length - 1; l++) {
          for (let i = 0; i < layers[l]; i++) {
            for (let j = 0; j < layers[l + 1]; j++) {
              const material = new THREE.LineBasicMaterial({
                color: 0x9BCBEB,
                opacity: 0.2,
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
              network.add(line);
            }
          }
        }
        return network;
      };
      
      const neuralNetwork = createNeuralNetwork();
      scene.add(neuralNetwork);
      
      // Lighting
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
      scene.add(ambientLight);
      
      const pointLight1 = new THREE.PointLight(0xBF5700, 1, 100);
      pointLight1.position.set(10, 10, 10);
      scene.add(pointLight1);
      
      const pointLight2 = new THREE.PointLight(0x00B2A9, 1, 100);
      pointLight2.position.set(-10, -10, 10);
      scene.add(pointLight2);
      
      // Animation
      const animate = () => {
        frameRef.current = requestAnimationFrame(animate);
        neuralNetwork.rotation.y += 0.003;
        neuralNetwork.children.forEach((layer, index) => {
          layer.children.forEach((node, nodeIndex) => {
            if (node.isMesh) {
              node.scale.setScalar(1 + Math.sin(Date.now() * 0.001 + index + nodeIndex) * 0.1);
            }
          });
        });
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
  }, [currentView]);

  // AI Analysis function
  const analyzeWithClaude = async (prompt, context) => {
    setIsAnalyzing(true);
    
    // Simulated AI response
    const simulatedResponses = {
      performance: "Pattern Recognition: Performance metrics show cyclical patterns with 3-minute peaks. Predictive Indicator: Current trajectory suggests 73% probability of sustained excellence. Recommendation: Maintain intensity while optimizing recovery windows.",
      tactical: "Formation Analysis: Opponent showing vulnerability in zone coverage transitions. Key Opportunity: 67% success rate on quick releases. Strategic Adjustment: Increase tempo to exploit defensive rotation delays.",
      predictive: "ML Model Output: Convergence of momentum indicators suggests critical phase approaching. Win Probability: 71.3% based on execution metrics. Critical Factor: Next 5 possessions determine outcome trajectory."
    };
    
    setTimeout(() => {
      setAiAnalysis(simulatedResponses[context] || simulatedResponses.performance);
      setPredictions({
        winProbability: 50 + Math.random() * 40,
        scorePrediction: { home: Math.floor(Math.random() * 5), away: Math.floor(Math.random() * 5) },
        momentum: Math.random() > 0.5 ? 'increasing' : 'decreasing',
        keyFactor: ['Defense', 'Offense', 'Special Teams'][Math.floor(Math.random() * 3)]
      });
      setSessionHistory(prev => [...prev, {
        timestamp: new Date().toISOString(),
        type: context,
        analysis: simulatedResponses[context]
      }]);
      setIsAnalyzing(false);
    }, 1500);
  };

  // Calculate advanced metrics
  const calculateAdvancedMetrics = useMemo(() => {
    if (realTimeData.length === 0) return {};
    
    const latest = realTimeData[realTimeData.length - 1] || {};
    const momentum = _.mean(realTimeData.slice(-5).map(d => d.momentum || 0));
    const volatility = d3.deviation(realTimeData.map(d => d.performance || 0)) || 0;
    
    return {
      compositeScore: (latest.performance * 0.3 + latest.efficiency * 0.3 + latest.execution * 0.4) || 0,
      momentumTrend: momentum > 60 ? 'ascending' : momentum > 40 ? 'stable' : 'descending',
      volatilityIndex: volatility,
      confidenceInterval: [latest.performance - volatility, latest.performance + volatility]
    };
  }, [realTimeData]);

  // Radar data
  const radarData = [
    { metric: 'Speed', value: 85, fullMark: 100 },
    { metric: 'Accuracy', value: 92, fullMark: 100 },
    { metric: 'Power', value: 78, fullMark: 100 },
    { metric: 'Endurance', value: 88, fullMark: 100 },
    { metric: 'Strategy', value: 95, fullMark: 100 },
    { metric: 'Execution', value: 83, fullMark: 100 }
  ];

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-black/90 border border-orange-500/30 p-3 rounded">
          <p className="text-orange-400 text-sm font-mono">{label}</p>
          {payload.map((entry, index) => (
            <p key={index} className="text-cyan-300 text-xs">
              {entry.name}: {entry.value.toFixed(2)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  // Navigation component
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
              <p className="text-[10px] text-gray-400 tracking-widest">ELITE SPORTS ANALYTICS</p>
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
              Live Dashboard
            </button>
            <button className="text-sm text-gray-300 hover:text-white transition">Features</button>
            <button className="text-sm text-gray-300 hover:text-white transition">Pricing</button>
            <button className="text-sm text-gray-300 hover:text-white transition">About</button>
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
      
      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-gray-950/95 backdrop-blur-md border-b border-orange-500/20">
          <div className="px-4 py-3 space-y-2">
            <button
              onClick={() => { setCurrentView('landing'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded"
            >
              Home
            </button>
            <button
              onClick={() => { setCurrentView('dashboard'); setMobileMenuOpen(false); }}
              className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded"
            >
              Live Dashboard
            </button>
            <button className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded">
              Features
            </button>
            <button className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded">
              Pricing
            </button>
            <button className="block w-full text-left px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded">
              About
            </button>
          </div>
        </div>
      )}
    </nav>
  );

  // Landing page component
  const LandingPage = () => (
    <div className="pt-16">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950"></div>
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-500/20 rounded-full blur-3xl"></div>
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-teal-500/20 rounded-full blur-3xl"></div>
        </div>
        
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="mb-6 inline-flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full">
            <Flame className="w-4 h-4 text-orange-400" />
            <span className="text-sm text-orange-400">Where Texas Grit Meets Silicon Valley Innovation</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold mb-6">
            <span className="bg-gradient-to-r from-orange-500 to-teal-400 bg-clip-text text-transparent">
              Elite Sports Analytics
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-300 mb-8 max-w-3xl mx-auto">
            Pioneer sports analytics through cutting-edge AI, real-time performance tracking, and predictive modeling. Transform raw data into championship decisions.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <button
              onClick={() => setCurrentView('dashboard')}
              className="px-8 py-4 bg-gradient-to-r from-orange-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-orange-500/30 transition flex items-center justify-center gap-2"
            >
              <Play className="w-5 h-5" />
              Try Live Dashboard
            </button>
            <button className="px-8 py-4 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition flex items-center justify-center gap-2">
              <Calendar className="w-5 h-5" />
              Schedule Demo
            </button>
          </div>
          
          <div className="grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">94.6%</div>
              <div className="text-sm text-gray-400">Prediction Accuracy</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-teal-400">&lt;100ms</div>
              <div className="text-sm text-gray-400">Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-400">227</div>
              <div className="text-sm text-gray-400">Teams Analyzed</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-teal-400 bg-clip-text text-transparent">
                Championship-Grade Features
              </span>
            </h2>
            <p className="text-xl text-gray-400">Everything you need to analyze, optimize, and dominate</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Brain,
                title: "Neural Network Analysis",
                description: "Advanced AI analyzing millions of data points to identify winning patterns",
                color: "orange"
              },
              {
                icon: Activity,
                title: "Real-Time Performance",
                description: "Track metrics with millisecond precision as the action happens",
                color: "teal"
              },
              {
                icon: Target,
                title: "Predictive Modeling",
                description: "ML models trained on championship data predict outcomes with 94.6% accuracy",
                color: "orange"
              },
              {
                icon: Shield,
                title: "Integrity First",
                description: "Uncompromising data integrity for critical championship decisions",
                color: "teal"
              },
              {
                icon: Gauge,
                title: "Custom Dashboards",
                description: "Build personalized analytics tailored to your team's specific KPIs",
                color: "orange"
              },
              {
                icon: Trophy,
                title: "Championship Insights",
                description: "Access data from leagues worldwide with integrated scouting database",
                color: "teal"
              }
            ].map((feature, idx) => (
              <div key={idx} className="bg-gray-800/50 rounded-xl p-6 border border-gray-700 hover:border-orange-500/50 transition">
                <div className={`w-12 h-12 bg-${feature.color}-500/20 rounded-lg flex items-center justify-center mb-4`}>
                  <feature.icon className={`w-6 h-6 text-${feature.color}-400`} />
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-400">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Integration Section */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-teal-400 bg-clip-text text-transparent">
                Powered by Leading AI
              </span>
            </h2>
            <p className="text-xl text-gray-400">Experience real AI-powered analysis for championship insights</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl p-6 border border-orange-500/30">
              <div className="text-2xl font-bold mb-2">ChatGPT 5</div>
              <p className="text-gray-400 mb-4">Deep team insights powered by OpenAI's advanced language models</p>
              <div className="flex items-center gap-2 text-sm text-orange-400">
                <CheckCircle className="w-4 h-4" />
                <span>Active Integration</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-teal-500/10 to-transparent rounded-xl p-6 border border-teal-500/30">
              <div className="text-2xl font-bold mb-2">Claude Opus 4.1</div>
              <p className="text-gray-400 mb-4">Advanced championship probability analysis with detailed predictions</p>
              <div className="flex items-center gap-2 text-sm text-teal-400">
                <CheckCircle className="w-4 h-4" />
                <span>Active Integration</span>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-orange-500/10 to-transparent rounded-xl p-6 border border-orange-500/30">
              <div className="text-2xl font-bold mb-2">Gemini 2.5 Pro</div>
              <p className="text-gray-400 mb-4">Deep game analysis and highlight detection for performance insights</p>
              <div className="flex items-center gap-2 text-sm text-orange-400">
                <CheckCircle className="w-4 h-4" />
                <span>Active Integration</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section className="py-20 bg-gray-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              <span className="bg-gradient-to-r from-orange-500 to-teal-400 bg-clip-text text-transparent">
                Professional Pricing
              </span>
            </h2>
            <p className="text-xl text-gray-400">Clear, no-surprise pricing for championship teams</p>
          </div>
          
          <div className="max-w-md mx-auto">
            <div className="bg-gradient-to-br from-orange-500/10 to-teal-500/10 rounded-xl p-8 border border-orange-500/30">
              <div className="text-center mb-6">
                <div className="text-sm text-orange-400 mb-2">PROFESSIONAL</div>
                <div className="text-5xl font-bold mb-2">$297</div>
                <div className="text-gray-400">per month</div>
              </div>
              
              <div className="space-y-3 mb-8">
                {[
                  "Real-time analytics dashboard",
                  "AI-powered predictions",
                  "Custom team dashboards",
                  "Advanced player tracking",
                  "Priority support",
                  "API access"
                ].map((feature, idx) => (
                  <div key={idx} className="flex items-center gap-3">
                    <Check className="w-5 h-5 text-teal-400" />
                    <span className="text-gray-300">{feature}</span>
                  </div>
                ))}
              </div>
              
              <button className="w-full py-3 bg-gradient-to-r from-orange-500 to-teal-500 text-white rounded-lg font-semibold hover:shadow-xl hover:shadow-orange-500/30 transition">
                Start Free Trial
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-gradient-to-b from-gray-950 to-gray-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-6">
                <span className="bg-gradient-to-r from-orange-500 to-teal-400 bg-clip-text text-transparent">
                  Multi-Sport Athlete turned Analytics Pioneer
                </span>
              </h2>
              <p className="text-gray-300 mb-4">
                Former Texas high school running back (#20) and Perfect Game baseball player who brings a unique blend of athletic experience and analytical expertise.
              </p>
              <p className="text-gray-300 mb-6">
                With a B.A. in International Relations from UT Austin and an M.S. in Sports Management from Full Sail University, Austin combines on-field experience with cutting-edge technology to revolutionize sports analytics.
              </p>
              <div className="flex items-center gap-4">
                <a href="https://www.linkedin.com/in/john-humphrey-2033" className="text-orange-400 hover:text-orange-300 transition">
                  <Linkedin className="w-6 h-6" />
                </a>
                <a href="mailto:ahump20@outlook.com" className="text-orange-400 hover:text-orange-300 transition">
                  <Mail className="w-6 h-6" />
                </a>
                <a href="tel:+12102735538" className="text-orange-400 hover:text-orange-300 transition">
                  <Phone className="w-6 h-6" />
                </a>
              </div>
            </div>
            
            <div className="bg-gray-800/50 rounded-xl p-8 border border-gray-700">
              <div className="text-center mb-6">
                <div className="w-32 h-32 bg-gradient-to-br from-orange-500 to-teal-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <span className="text-3xl font-bold">AH</span>
                </div>
                <h3 className="text-2xl font-bold">Austin Humphrey</h3>
                <p className="text-gray-400">Founder & CEO</p>
                <p className="text-sm text-gray-500 mt-2">📍 Boerne, Texas</p>
              </div>
              
              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Education:</span>
                  <span className="text-gray-300">UT Austin & Full Sail</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Sports:</span>
                  <span className="text-gray-300">Football & Baseball</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-gray-400">Focus:</span>
                  <span className="text-gray-300">Sports Analytics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 border-t border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between">
            <div className="flex items-center gap-3 mb-4 md:mb-0">
              <Shield className="w-6 h-6 text-orange-500" />
              <span className="text-sm text-gray-400">© 2025 Blaze Intelligence. All rights reserved.</span>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-400">
              <button className="hover:text-white transition">Privacy</button>
              <button className="hover:text-white transition">Terms</button>
              <button className="hover:text-white transition">Contact</button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );

  // Dashboard component (Command Center)
  const Dashboard = () => (
    <div className="pt-16 min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950">
      <div className="p-4">
        {/* Dashboard Header */}
        <header className="mb-6 border-b border-orange-500/20 pb-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-orange-500 to-teal-400 bg-clip-text text-transparent">
                COMMAND CENTER ALPHA
              </h1>
              <p className="text-xs text-gray-400">Real-time Analytics Dashboard</p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-xs">
                <div className={`w-2 h-2 rounded-full ${alertLevel === 'normal' ? 'bg-green-500' : 'bg-red-500'} animate-pulse`}></div>
                <span className="text-gray-400">SYSTEM: OPTIMAL</span>
              </div>
              <Clock className="w-4 h-4 text-gray-400" />
              <span className="text-xs text-gray-400 font-mono">{new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </header>

        {/* Mode Selection */}
        <div className="grid grid-cols-5 gap-2 mb-6">
          {[
            { id: 'neural', icon: Brain, label: 'Neural Analysis' },
            { id: 'predictive', icon: TrendingUp, label: 'Predictive Engine' },
            { id: 'tactical', icon: Target, label: 'Tactical Intel' },
            { id: 'performance', icon: Activity, label: 'Performance Matrix' },
            { id: 'quantum', icon: Cpu, label: 'Quantum Processing' }
          ].map(mode => (
            <button
              key={mode.id}
              onClick={() => setActiveMode(mode.id)}
              className={`p-3 rounded-lg border transition-all duration-300 ${
                activeMode === mode.id
                  ? 'bg-gradient-to-r from-orange-500/20 to-teal-500/20 border-orange-500 shadow-lg shadow-orange-500/20'
                  : 'bg-gray-900/50 border-gray-700 hover:border-orange-500/50'
              }`}
            >
              <mode.icon className={`w-5 h-5 mx-auto mb-1 ${activeMode === mode.id ? 'text-orange-400' : 'text-gray-400'}`} />
              <p className="text-xs">{mode.label}</p>
            </button>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-12 gap-4">
          {/* 3D Visualization */}
          <div className="col-span-12 lg:col-span-8 bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-orange-400 flex items-center gap-2">
                <Network className="w-4 h-4" />
                NEURAL NETWORK VISUALIZATION
              </h2>
              <div className="flex gap-2">
                <button className="px-2 py-1 bg-orange-500/20 text-orange-400 rounded text-xs hover:bg-orange-500/30 transition">
                  RECALIBRATE
                </button>
              </div>
            </div>
            <div ref={mountRef} className="w-full rounded-lg overflow-hidden bg-black/50"></div>
            
            {/* Real-time metrics */}
            <div className="grid grid-cols-5 gap-2 mt-4">
              {['Performance', 'Momentum', 'Efficiency', 'Pressure', 'Execution'].map((metric) => {
                const value = realTimeData[realTimeData.length - 1]?.[metric.toLowerCase()] || 0;
                return (
                  <div key={metric} className="bg-gray-800/50 rounded p-2">
                    <p className="text-xs text-gray-400 mb-1">{metric}</p>
                    <div className="flex items-end justify-between">
                      <span className="text-lg font-bold text-cyan-300">{value.toFixed(1)}</span>
                      <Sparkles className="w-3 h-3 text-orange-400 opacity-50" />
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-1 mt-1">
                      <div 
                        className="bg-gradient-to-r from-orange-500 to-teal-400 h-1 rounded-full transition-all duration-500"
                        style={{ width: `${value}%` }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Analysis Panel */}
          <div className="col-span-12 lg:col-span-4 bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-teal-400 flex items-center gap-2">
                <Bot className="w-4 h-4" />
                CLAUDE AI ANALYSIS
              </h2>
              <button
                onClick={() => analyzeWithClaude(`Current metrics`, activeMode)}
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
            
            <div className="bg-black/30 rounded-lg p-3 min-h-[200px] max-h-[300px] overflow-y-auto">
              {aiAnalysis ? (
                <div className="space-y-2">
                  <div className="text-xs text-cyan-300 font-mono whitespace-pre-wrap">{aiAnalysis}</div>
                  {predictions.winProbability && (
                    <div className="mt-3 p-2 bg-orange-500/10 rounded border border-orange-500/30">
                      <p className="text-xs text-orange-400 mb-1">PREDICTION UPDATE</p>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-gray-400">Win Prob:</span>
                          <span className="text-cyan-300 ml-1 font-bold">{predictions.winProbability.toFixed(1)}%</span>
                        </div>
                        <div>
                          <span className="text-gray-400">Momentum:</span>
                          <span className={`ml-1 font-bold ${predictions.momentum === 'increasing' ? 'text-green-400' : 'text-red-400'}`}>
                            {predictions.momentum === 'increasing' ? '↑' : '↓'}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500 text-xs">
                  <p>Awaiting analysis request...</p>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-2 mt-3">
              <button
                onClick={() => analyzeWithClaude('Performance patterns', 'performance')}
                className="p-2 bg-gray-800/50 rounded text-xs hover:bg-gray-700/50 transition flex items-center justify-center gap-1"
              >
                <Activity className="w-3 h-3" />
                Performance
              </button>
              <button
                onClick={() => analyzeWithClaude('Tactical recommendations', 'tactical')}
                className="p-2 bg-gray-800/50 rounded text-xs hover:bg-gray-700/50 transition flex items-center justify-center gap-1"
              >
                <Target className="w-3 h-3" />
                Tactical
              </button>
            </div>
          </div>

          {/* Live Data Stream */}
          <div className="col-span-12 lg:col-span-6 bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              REAL-TIME PERFORMANCE STREAM
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={realTimeData}>
                <defs>
                  <linearGradient id="performanceGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#BF5700" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#BF5700" stopOpacity={0.1}/>
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
                />
                <Area 
                  type="monotone" 
                  dataKey="efficiency" 
                  stroke="#00B2A9" 
                  fill="url(#efficiencyGradient)" 
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* Radar Analysis */}
          <div className="col-span-12 lg:col-span-6 bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-teal-400 mb-3 flex items-center gap-2">
              <Eye className="w-4 h-4" />
              MULTI-DIMENSIONAL ANALYSIS
            </h2>
            <ResponsiveContainer width="100%" height={200}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#333" />
                <PolarAngleAxis dataKey="metric" tick={{ fill: '#888', fontSize: 10 }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={{ fill: '#888', fontSize: 10 }} />
                <Radar 
                  name="Current" 
                  dataKey="value" 
                  stroke="#00B2A9" 
                  fill="#00B2A9" 
                  fillOpacity={0.3}
                  strokeWidth={2}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          {/* Advanced Metrics */}
          <div className="col-span-12 bg-gray-900/50 rounded-xl border border-gray-700 p-4">
            <h2 className="text-sm font-semibold text-orange-400 mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4" />
              ADVANCED METRICS & PREDICTIONS
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Composite Score</p>
                <div className="text-3xl font-bold text-transparent bg-gradient-to-r from-orange-400 to-teal-400 bg-clip-text">
                  {calculateAdvancedMetrics.compositeScore?.toFixed(1) || '0.0'}
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Momentum Trend</p>
                <div className={`text-2xl font-bold ${
                  calculateAdvancedMetrics.momentumTrend === 'ascending' ? 'text-green-400' :
                  calculateAdvancedMetrics.momentumTrend === 'stable' ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {calculateAdvancedMetrics.momentumTrend === 'ascending' ? '↗' :
                   calculateAdvancedMetrics.momentumTrend === 'stable' ? '→' : '↘'}
                  <span className="text-sm ml-2 uppercase">{calculateAdvancedMetrics.momentumTrend}</span>
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Volatility Index</p>
                <div className="text-2xl font-bold text-cyan-300">
                  {calculateAdvancedMetrics.volatilityIndex?.toFixed(2) || '0.00'}
                </div>
              </div>

              <div className="bg-black/30 rounded-lg p-3">
                <p className="text-xs text-gray-400 mb-2">Sessions</p>
                <div className="text-2xl font-bold text-orange-400">
                  {sessionHistory.length}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-6 border-t border-gray-700 pt-4">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Database className="w-3 h-3" />
                Data Points: {realTimeData.length}
              </span>
              <span className="flex items-center gap-1">
                <Globe className="w-3 h-3" />
                Mode: {activeMode.toUpperCase()}
              </span>
            </div>
            <span>© 2025 Blaze Intelligence | Command Center v4.1.0</span>
          </div>
        </footer>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-slate-900 to-gray-950 text-white">
      <Navigation />
      {currentView === 'landing' ? <LandingPage /> : <Dashboard />}
    </div>
  );
};

// Add missing Calendar import at the top
const Calendar = Clock; // Using Clock as fallback since Calendar isn't in lucide-react

export default BlazeIntelligencePlatform;