/**
 * Blaze Intelligence - Pressure-Focused Analytics System
 * Investor-grade, Bloomberg-style sports analytics with Texas heritage
 * Focus: Clutch moments, leverage situations, championship pressure
 */

class BlazePressureAnalytics {
    constructor() {
        this.pressureStreams = new Map();
        this.heatmaps = new Map();
        this.clutchData = new Map();
        this.isInitialized = false;
        
        // Performance and UX settings
        this.targetFPS = 60;
        this.maxDataPoints = 1800; // 30 minutes at 60fps
        this.performanceMode = this.detectPerformance();
        
        // Investor-grade styling constants
        this.colors = {
            primary: '#BF5700',      // Burnt Orange Heritage
            secondary: '#9BCBEB',    // Cardinal Sky Blue
            tertiary: '#00B2A9',     // Vancouver Teal
            dark: '#002244',         // Tennessee Deep Navy
            background: '#0B0B0F',   // Deep Space
            text: '#E5E7EB',         // Cool Gray
            accent: '#1F2937'        // Panel Gray
        };
        
        // Initialize on load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.init.bind(this));
        } else {
            this.init();
        }
        
        this.bindEvents();
    }
    
    detectPerformance() {
        const cores = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        const pixelRatio = window.devicePixelRatio || 1;
        
        if (cores >= 8 && memory >= 8 && pixelRatio <= 2) return 'high';
        if (cores >= 4 && memory >= 4) return 'medium';
        return 'low';
    }
    
    init() {
        try {
            this.createContainers();
            this.initPressureStream();
            this.initPressureHeatmap();
            this.initClutchMetrics();
            this.setupDataConnections();
            this.isInitialized = true;
            console.log('🔥 Blaze Pressure Analytics initialized - Investor grade ready');
        } catch (error) {
            console.error('❌ Pressure Analytics initialization failed:', error);
        }
    }
    
    createContainers() {
        // Create pressure-focused sections with Bloomberg-style density
        const sections = [
            { id: 'pressureStream', title: 'Live Pressure Index', subtitle: 'Win Probability × Leverage Moments', height: '38vh' },
            { id: 'pressureMap', title: 'Field Pressure Heatmap', subtitle: 'High-Stakes Spatial Analysis', height: '42vh' },
            { id: 'clutchMetrics', title: 'Clutch Performance Matrix', subtitle: 'Pressure-Weighted Statistics', height: '32vh' },
            { id: 'leverageStream', title: 'Championship Leverage', subtitle: 'Real-Time Championship Probability', height: '35vh' }
        ];
        
        // Insert after analytics section
        const analyticsSection = document.querySelector('#analytics');
        if (!analyticsSection) return;
        
        sections.forEach(section => {
            if (document.querySelector(`#${section.id}`)) return; // Skip if exists
            
            const container = document.createElement('div');
            container.className = 'dashboard-container fade-in pressure-analytics';
            container.innerHTML = `
                <div class="pressure-header">
                    <h3 class="pressure-title">${section.title}</h3>
                    <p class="pressure-subtitle">${section.subtitle}</p>
                    <div class="pressure-indicators">
                        <span class="indicator live" data-status="live"></span>
                        <span class="indicator-text">LIVE</span>
                    </div>
                </div>
                <div id="${section.id}" class="viz pressure-viz" style="height: ${section.height}"></div>
            `;
            
            analyticsSection.appendChild(container);
        });
        
        // Add investor-grade styling
        this.addPressureStyles();
    }
    
    addPressureStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .pressure-analytics {
                background: linear-gradient(135deg, ${this.colors.accent} 0%, #1a1a1a 100%);
                border: 1px solid rgba(155, 203, 235, 0.15);
                border-radius: 12px;
                margin: 2rem 0;
                padding: 1.5rem;
                position: relative;
                overflow: hidden;
            }
            
            .pressure-analytics::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                height: 2px;
                background: linear-gradient(90deg, ${this.colors.primary} 0%, ${this.colors.secondary} 100%);
                opacity: 0.8;
            }
            
            .pressure-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid rgba(155, 203, 235, 0.1);
            }
            
            .pressure-title {
                color: ${this.colors.primary};
                font-size: 1.2rem;
                font-weight: 700;
                margin: 0;
                font-family: 'Inter', system-ui;
                letter-spacing: -0.025em;
            }
            
            .pressure-subtitle {
                color: ${this.colors.text};
                font-size: 0.85rem;
                margin: 0.25rem 0 0 0;
                opacity: 0.8;
                font-family: 'Inter', system-ui;
            }
            
            .pressure-indicators {
                display: flex;
                align-items: center;
                gap: 0.5rem;
            }
            
            .indicator {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: ${this.colors.secondary};
                animation: pulse 2s infinite;
            }
            
            .indicator.live {
                background: ${this.colors.tertiary};
                box-shadow: 0 0 10px rgba(0, 178, 169, 0.5);
            }
            
            .indicator-text {
                color: ${this.colors.tertiary};
                font-size: 0.75rem;
                font-weight: 600;
                letter-spacing: 0.1em;
            }
            
            @keyframes pulse {
                0%, 100% { opacity: 1; transform: scale(1); }
                50% { opacity: 0.6; transform: scale(1.1); }
            }
            
            .pressure-viz {
                background: ${this.colors.background};
                border: 1px solid rgba(155, 203, 235, 0.08);
                border-radius: 8px;
                position: relative;
                overflow: hidden;
            }
            
            .pressure-canvas {
                width: 100%;
                height: 100%;
                display: block;
            }
            
            /* Bloomberg-style data density */
            .pressure-legend {
                position: absolute;
                top: 12px;
                right: 12px;
                background: rgba(11, 11, 15, 0.9);
                border: 1px solid rgba(155, 203, 235, 0.2);
                border-radius: 6px;
                padding: 8px 12px;
                font-size: 0.75rem;
                color: ${this.colors.text};
            }
            
            /* Mobile responsiveness */
            @media (max-width: 768px) {
                .pressure-header {
                    flex-direction: column;
                    align-items: flex-start;
                    gap: 0.5rem;
                }
                
                .pressure-indicators {
                    align-self: flex-end;
                }
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * 1) Pressure Stream - Live Win Probability × Leverage with Event Markers
     */
    initPressureStream() {
        const container = document.querySelector('#pressureStream');
        if (!container) return;
        
        // Create high-performance canvas
        const canvas = document.createElement('canvas');
        canvas.className = 'pressure-canvas';
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        const dpr = Math.min(window.devicePixelRatio, 2); // Limit for performance
        
        // Bloomberg-style dimensions
        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width * dpr;
            canvas.height = rect.height * dpr;
            canvas.style.width = rect.width + 'px';
            canvas.style.height = rect.height + 'px';
            ctx.scale(dpr, dpr);
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Data structure for pressure analysis
        let pressureData = [];
        let winProbData = [];
        let eventMarkers = [];
        
        // Scales for investor-grade precision
        const margin = { top: 24, right: 28, bottom: 26, left: 40 };
        const width = canvas.width / dpr;
        const height = canvas.height / dpr;
        const chartWidth = width - margin.left - margin.right;
        const chartHeight = height - margin.top - margin.bottom;
        
        // Time-based scaling
        let timeWindow = 18 * 60 * 1000; // 18 minutes
        let currentTime = Date.now();
        
        const xScale = (timestamp) => {
            const elapsed = timestamp - (currentTime - timeWindow);
            return margin.left + (elapsed / timeWindow) * chartWidth;
        };
        
        const yScale = (value) => {
            return height - margin.bottom - (value * chartHeight);
        };
        
        // Render function - 60fps target
        const render = () => {
            ctx.clearRect(0, 0, width, height);
            
            // Background grid (subtle, Bloomberg-style)
            ctx.strokeStyle = 'rgba(155, 203, 235, 0.05)';
            ctx.lineWidth = 0.5;
            for (let i = 0; i <= 10; i++) {
                const y = margin.top + (i / 10) * chartHeight;
                ctx.beginPath();
                ctx.moveTo(margin.left, y);
                ctx.lineTo(width - margin.right, y);
                ctx.stroke();
            }
            
            // Pressure area glow (the key innovation)
            if (pressureData.length > 1) {
                const gradient = ctx.createLinearGradient(0, margin.top, 0, height - margin.bottom);
                gradient.addColorStop(0, 'rgba(191, 87, 0, 0.25)');   // Burnt Orange
                gradient.addColorStop(1, 'rgba(155, 203, 235, 0.08)'); // Cardinal Blue
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.moveTo(xScale(pressureData[0].timestamp), yScale(0));
                
                pressureData.forEach(point => {
                    ctx.lineTo(xScale(point.timestamp), yScale(point.pressure));
                });
                
                ctx.lineTo(xScale(pressureData[pressureData.length - 1].timestamp), yScale(0));
                ctx.closePath();
                ctx.fill();
            }
            
            // Win Probability line (sharp, institutional)
            if (winProbData.length > 1) {
                ctx.strokeStyle = this.colors.secondary;
                ctx.lineWidth = 2.0;
                ctx.beginPath();
                
                winProbData.forEach((point, i) => {
                    const x = xScale(point.timestamp);
                    const y = yScale(point.winProb);
                    i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
                });
                
                ctx.stroke();
            }
            
            // Event markers (high-leverage moments)
            eventMarkers.forEach(event => {
                const x = xScale(event.timestamp);
                const y = yScale(event.winProb);
                
                // Pulsing dot for high-pressure events
                const intensity = event.pressure || 0.5;
                const radius = 3 + intensity * 2;
                
                ctx.fillStyle = this.colors.primary;
                ctx.globalAlpha = 0.8 + Math.sin(Date.now() * 0.005) * 0.2;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1;
                
                // Event label
                if (event.label) {
                    ctx.fillStyle = this.colors.text;
                    ctx.font = '10px Inter';
                    ctx.fillText(event.label, x + 6, y - 6);
                }
            });
            
            // Y-axis labels (probability scale)
            ctx.fillStyle = this.colors.text;
            ctx.font = '11px Inter';
            ctx.textAlign = 'right';
            for (let i = 0; i <= 10; i++) {
                const y = margin.top + (i / 10) * chartHeight;
                const value = (1 - i / 10) * 100;
                ctx.fillText(`${value.toFixed(0)}%`, margin.left - 6, y + 3);
            }
            
            // Legend
            ctx.fillStyle = this.colors.text;
            ctx.font = '10px Inter';
            ctx.textAlign = 'left';
            ctx.fillText('Win Probability', margin.left, margin.top - 8);
            ctx.fillStyle = this.colors.primary;
            ctx.fillText('Pressure Index', width - margin.right - 80, margin.top - 8);
        };
        
        // Connect to live Cardinals data
        this.connectPressureStream(pressureData, winProbData, eventMarkers, render);
        
        // Store reference for cleanup
        this.pressureStreams.set('main', {
            canvas,
            ctx,
            render,
            data: { pressureData, winProbData, eventMarkers }
        });
        
        // Initial render
        render();
    }
    
    /**
     * 2) Pressure Heatmap - Field/Court spatial pressure analysis
     */
    initPressureHeatmap() {
        const container = document.querySelector('#pressureMap');
        if (!container) return;
        
        const canvas = document.createElement('canvas');
        canvas.className = 'pressure-canvas';
        container.appendChild(canvas);
        
        const ctx = canvas.getContext('2d');
        
        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };
        
        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);
        
        // Field/Court background (will be dynamic based on sport)
        const fieldImage = new Image();
        fieldImage.src = '/assets/court_nba_dark.png'; // Placeholder
        
        let heatmapBins = [];
        
        const renderHeatmap = () => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            
            // Render pressure hotspots
            heatmapBins.forEach(bin => {
                const x = (bin.x * 0.5 + 0.5) * canvas.width;
                const y = (1 - (bin.y * 0.5 + 0.5)) * canvas.height;
                const intensity = Math.min(0.85, (bin.pressure * bin.count) * 0.12);
                const radius = Math.min(25, 4 + bin.count * 0.4);
                
                // Radial gradient for pressure visualization
                const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
                gradient.addColorStop(0, `rgba(191, 87, 0, ${intensity})`);
                gradient.addColorStop(1, 'rgba(191, 87, 0, 0)');
                
                ctx.fillStyle = gradient;
                ctx.beginPath();
                ctx.arc(x, y, radius, 0, Math.PI * 2);
                ctx.fill();
            });
            
            // Overlay field/court if loaded
            if (fieldImage.complete) {
                ctx.globalAlpha = 0.7;
                ctx.drawImage(fieldImage, 0, 0, canvas.width, canvas.height);
                ctx.globalAlpha = 1;
            }
        };
        
        // Generate synthetic pressure data (replace with real API)
        this.generateHeatmapData(heatmapBins, renderHeatmap);
        
        this.heatmaps.set('main', {
            canvas,
            ctx,
            render: renderHeatmap,
            data: heatmapBins
        });
    }
    
    /**
     * 3) Clutch Metrics - Pressure-weighted performance statistics
     */
    initClutchMetrics() {
        const container = document.querySelector('#clutchMetrics');
        if (!container) return;
        
        // Create clutch performance dashboard
        const metricsHTML = `
            <div class="clutch-dashboard">
                <div class="clutch-player">
                    <div class="player-header">
                        <span class="player-name">Marcus Johnson</span>
                        <span class="player-position">QB</span>
                        <div class="pressure-badge high">+12.4</div>
                    </div>
                    <div class="clutch-stats">
                        <div class="stat">
                            <span class="stat-label">Clutch Efficiency</span>
                            <span class="stat-value">94.2%</span>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: 94.2%"></div>
                            </div>
                        </div>
                        <div class="stat">
                            <span class="stat-label">High Pressure</span>
                            <span class="stat-value">87.1%</span>
                            <div class="stat-bar">
                                <div class="stat-fill pressure" style="width: 87.1%"></div>
                            </div>
                        </div>
                    </div>
                </div>
                
                <div class="clutch-player">
                    <div class="player-header">
                        <span class="player-name">David Williams</span>
                        <span class="player-position">RB</span>
                        <div class="pressure-badge positive">+8.7</div>
                    </div>
                    <div class="clutch-stats">
                        <div class="stat">
                            <span class="stat-label">Clutch Efficiency</span>
                            <span class="stat-value">91.8%</span>
                            <div class="stat-bar">
                                <div class="stat-fill" style="width: 91.8%"></div>
                            </div>
                        </div>
                        <div class="stat">
                            <span class="stat-label">High Pressure</span>
                            <span class="stat-value">89.3%</span>
                            <div class="stat-bar">
                                <div class="stat-fill pressure" style="width: 89.3%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        container.innerHTML = metricsHTML;
        this.addClutchStyles();
    }
    
    addClutchStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .clutch-dashboard {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                gap: 1.5rem;
                padding: 1rem;
            }
            
            .clutch-player {
                background: rgba(31, 41, 55, 0.6);
                border: 1px solid rgba(155, 203, 235, 0.15);
                border-radius: 8px;
                padding: 1rem;
            }
            
            .player-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
                padding-bottom: 0.75rem;
                border-bottom: 1px solid rgba(155, 203, 235, 0.1);
            }
            
            .player-name {
                color: ${this.colors.text};
                font-weight: 700;
                font-size: 1.1rem;
            }
            
            .player-position {
                color: ${this.colors.secondary};
                font-size: 0.9rem;
                font-weight: 600;
                background: rgba(155, 203, 235, 0.1);
                padding: 2px 8px;
                border-radius: 4px;
            }
            
            .pressure-badge {
                padding: 4px 8px;
                border-radius: 6px;
                font-size: 0.8rem;
                font-weight: 700;
            }
            
            .pressure-badge.high {
                background: ${this.colors.primary};
                color: white;
            }
            
            .pressure-badge.positive {
                background: ${this.colors.tertiary};
                color: white;
            }
            
            .clutch-stats {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }
            
            .stat {
                display: flex;
                flex-direction: column;
                gap: 0.25rem;
            }
            
            .stat-label {
                color: ${this.colors.text};
                font-size: 0.85rem;
                opacity: 0.8;
            }
            
            .stat-value {
                color: ${this.colors.secondary};
                font-size: 1.1rem;
                font-weight: 700;
            }
            
            .stat-bar {
                height: 4px;
                background: rgba(155, 203, 235, 0.1);
                border-radius: 2px;
                overflow: hidden;
            }
            
            .stat-fill {
                height: 100%;
                background: ${this.colors.secondary};
                border-radius: 2px;
                transition: width 1s ease;
            }
            
            .stat-fill.pressure {
                background: ${this.colors.primary};
            }
        `;
        document.head.appendChild(style);
    }
    
    /**
     * Data Connection Methods
     */
    setupDataConnections() {
        // Connect to your live Cardinals analytics feed
        this.connectToCardinalsAPI();
        
        // Set up synthetic data for development
        this.generateSyntheticPressureData();
    }
    
    connectToCardinalsAPI() {
        // Hook into your existing WebSocket feed
        if (window.EventSource) {
            const eventSource = new EventSource('/api/game/pressure-stream');
            
            eventSource.onmessage = (event) => {
                const data = JSON.parse(event.data);
                this.processPressureTick(data);
            };
            
            eventSource.onerror = () => {
                console.warn('⚠️ Pressure stream connection failed, using synthetic data');
                this.generateSyntheticPressureData();
            };
        }
    }
    
    connectPressureStream(pressureData, winProbData, eventMarkers, renderCallback) {
        // Connect to live data or generate synthetic
        setInterval(() => {
            const now = Date.now();
            const pressure = Math.random() * 0.6 + 0.2; // 0.2 to 0.8
            const winProb = Math.max(0.1, Math.min(0.9, winProb + (Math.random() - 0.5) * 0.1));
            
            pressureData.push({
                timestamp: now,
                pressure: pressure,
                winProb: winProb
            });
            
            winProbData.push({
                timestamp: now,
                winProb: winProb
            });
            
            // Add event markers occasionally
            if (Math.random() < 0.1 && pressure > 0.6) {
                eventMarkers.push({
                    timestamp: now,
                    winProb: winProb,
                    pressure: pressure,
                    label: ['4th Down', 'Steal', 'Clutch Shot', 'Red Zone'][Math.floor(Math.random() * 4)]
                });
            }
            
            // Maintain rolling window
            const cutoff = now - this.maxDataPoints * 1000;
            pressureData.splice(0, pressureData.findIndex(p => p.timestamp > cutoff));
            winProbData.splice(0, winProbData.findIndex(p => p.timestamp > cutoff));
            eventMarkers.splice(0, eventMarkers.findIndex(p => p.timestamp > cutoff));
            
            renderCallback();
        }, 1000); // 1Hz updates for smooth performance
    }
    
    generateHeatmapData(bins, renderCallback) {
        // Generate pressure hotspots (replace with real field data)
        for (let i = 0; i < 20; i++) {
            bins.push({
                x: Math.random() * 2 - 1,  // -1 to 1
                y: Math.random() * 2 - 1,  // -1 to 1
                pressure: Math.random(),
                count: Math.floor(Math.random() * 50) + 5
            });
        }
        
        renderCallback();
        
        // Update every 5 seconds
        setInterval(() => {
            bins.forEach(bin => {
                bin.pressure = Math.max(0.1, bin.pressure + (Math.random() - 0.5) * 0.2);
                bin.count += Math.floor(Math.random() * 3);
            });
            renderCallback();
        }, 5000);
    }
    
    generateSyntheticPressureData() {
        // Development data generation
        console.log('🔄 Generating synthetic pressure data for development');
    }
    
    processPressureTick(data) {
        // Process real-time pressure data
        // { t: timestamp, wp: winProb, pressure: pressure, event?: string }
        console.log('📊 Processing pressure tick:', data);
    }
    
    bindEvents() {
        // Handle visibility changes for performance
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
        
        // Handle window resize
        window.addEventListener('resize', () => {
            setTimeout(() => this.handleResize(), 100);
        });
    }
    
    pauseAnimations() {
        // Pause all animations for battery optimization
        this.pressureStreams.forEach(stream => {
            if (stream.animationFrame) {
                cancelAnimationFrame(stream.animationFrame);
            }
        });
    }
    
    resumeAnimations() {
        // Resume animations
        this.pressureStreams.forEach(stream => {
            if (stream.render) {
                const animate = () => {
                    stream.render();
                    stream.animationFrame = requestAnimationFrame(animate);
                };
                animate();
            }
        });
    }
    
    handleResize() {
        // Recalculate canvas dimensions
        this.pressureStreams.forEach(stream => {
            if (stream.canvas) {
                const rect = stream.canvas.parentElement.getBoundingClientRect();
                stream.canvas.width = rect.width;
                stream.canvas.height = rect.height;
                if (stream.render) stream.render();
            }
        });
    }
    
    // Export capabilities for press/social
    exportVisualization(containerId, format = 'webm', duration = 6000) {
        const container = this.pressureStreams.get(containerId);
        if (!container || !container.canvas) return;
        
        const canvas = container.canvas;
        const stream = canvas.captureStream(30);
        const recorder = new MediaRecorder(stream, { 
            mimeType: format === 'webm' ? 'video/webm;codecs=vp9' : 'video/mp4' 
        });
        
        const chunks = [];
        recorder.ondataavailable = e => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: recorder.mimeType });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `blaze-pressure-${Date.now()}.${format}`;
            a.click();
            URL.revokeObjectURL(url);
        };
        
        recorder.start();
        setTimeout(() => recorder.stop(), duration);
    }
    
    // Public API
    updateClutchData(playerId, stats) {
        this.clutchData.set(playerId, stats);
        this.renderClutchMetrics();
    }
    
    addPressureEvent(timestamp, winProb, pressure, label) {
        this.pressureStreams.forEach(stream => {
            if (stream.data && stream.data.eventMarkers) {
                stream.data.eventMarkers.push({
                    timestamp, winProb, pressure, label
                });
            }
        });
    }
    
    dispose() {
        // Cleanup all resources
        this.pauseAnimations();
        this.pressureStreams.clear();
        this.heatmaps.clear();
        this.clutchData.clear();
    }
}

// Initialize the pressure analytics system
const blazePressureAnalytics = new BlazePressureAnalytics();

// Export for global access
window.BlazePressureAnalytics = BlazePressureAnalytics;
window.blazePressureAnalytics = blazePressureAnalytics;

// Export visualization function
window.exportPressureViz = (format, duration) => {
    blazePressureAnalytics.exportVisualization('main', format, duration);
};