/**
 * Blaze Intelligence - Specialized Sports Visualizations
 * Decision-focused design philosophy with broadcast-quality motion graphics
 * Implementation of Harvard Science Review and Sloan Sports Conference research
 */

class BlazeSpecializedVisualizations {
    constructor() {
        this.canvas2D = null;
        this.ctx = null;
        this.visualizations = new Map();
        this.animationFrameId = null;
        this.isActive = false;
        
        // Decision-focused design principles
        this.cognitiveLoadLimits = {
            maxVisualElements: 7,        // 5-7 pieces per chart (research-backed)
            maxColorCount: 5,           // Simplified color palette
            animationDuration: 400,     // Optimal transition time
            hoverDelay: 150            // Prevent accidental triggers
        };
        
        // Texas heritage + institutional color system
        this.institutionalPalette = {
            primary: '#BF5700',         // Burnt Orange Heritage
            secondary: '#9BCBEB',       // Cardinal Sky Blue  
            accent: '#00B2A9',          // Vancouver Teal
            dark: '#002244',            // Tennessee Deep Navy
            neutral: '#1a1a1a',         // Professional Dark Gray
            success: '#10B981',         // Emerald
            warning: '#F59E0B',         // Amber
            critical: '#EF4444'         // Red
        };
        
        // Performance-optimized rendering
        this.renderQueue = [];
        this.objectPool = new Map();
        this.lastRenderTime = 0;
        this.targetFPS = 60;
        
        this.initialize();
        console.log('🎯 Specialized Visualizations ready - Decision-focused design active');
    }
    
    initialize() {
        this.setupCanvas();
        this.initializeVisualizations();
        this.bindInteractions();
    }
    
    setupCanvas() {
        this.canvas2D = document.createElement('canvas');
        this.canvas2D.id = 'blaze-specialized-canvas';
        this.canvas2D.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100vw;
            height: 100vh;
            pointer-events: auto;
            z-index: 500;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        
        // High-DPI support for crisp visuals
        const dpr = window.devicePixelRatio || 1;
        this.canvas2D.width = window.innerWidth * dpr;
        this.canvas2D.height = window.innerHeight * dpr;
        this.canvas2D.style.width = window.innerWidth + 'px';
        this.canvas2D.style.height = window.innerHeight + 'px';
        
        this.ctx = this.canvas2D.getContext('2d');
        this.ctx.scale(dpr, dpr);
        
        document.body.appendChild(this.canvas2D);
    }
    
    initializeVisualizations() {
        // Initialize specialized visualization types
        this.visualizations.set('pressureHeatmap', new PressureHeatmapViz(this));
        this.visualizations.set('clutchTimeline', new ClutchTimelineViz(this));
        this.visualizations.set('momentumFlow', new MomentumFlowViz(this));
        this.visualizations.set('tacticalNetwork', new TacticalNetworkViz(this));
        this.visualizations.set('performanceRadar', new PerformanceRadarViz(this));
        this.visualizations.set('winProbabilityStream', new WinProbabilityStreamViz(this));
    }
    
    bindInteractions() {
        // Implement "fast and intuitive" interactions for decision-makers
        this.canvas2D.addEventListener('mousemove', this.handleMouseMove.bind(this));
        this.canvas2D.addEventListener('click', this.handleClick.bind(this));
        this.canvas2D.addEventListener('wheel', this.handleZoom.bind(this));
        
        // Keyboard shortcuts for power users (Cmd+K style)
        document.addEventListener('keydown', this.handleKeyboard.bind(this));
        
        // Touch interactions for mobile
        this.canvas2D.addEventListener('touchstart', this.handleTouchStart.bind(this));
        this.canvas2D.addEventListener('touchmove', this.handleTouchMove.bind(this));
    }
    
    handleMouseMove(event) {
        const rect = this.canvas2D.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        // Intelligent hover detection with cognitive load management
        clearTimeout(this.hoverTimeout);
        this.hoverTimeout = setTimeout(() => {
            this.processHover(x, y);
        }, this.cognitiveLoadLimits.hoverDelay);
    }
    
    processHover(x, y) {
        // Check all active visualizations for hover targets
        let hoverTarget = null;
        let highestPriority = 0;
        
        this.visualizations.forEach((viz, type) => {
            const target = viz.getHoverTarget(x, y);
            if (target && target.priority > highestPriority) {
                hoverTarget = target;
                highestPriority = target.priority;
            }
        });
        
        if (hoverTarget) {
            this.showTooltip(hoverTarget);
            this.canvas2D.style.cursor = 'pointer';
        } else {
            this.hideTooltip();
            this.canvas2D.style.cursor = 'default';
        }
    }
    
    handleClick(event) {
        // Decision-focused click handling
        const rect = this.canvas2D.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        this.visualizations.forEach((viz) => {
            viz.handleClick(x, y);
        });
    }
    
    handleKeyboard(event) {
        // Power user keyboard shortcuts
        if (event.metaKey || event.ctrlKey) {
            switch (event.key.toLowerCase()) {
                case 'k':
                    event.preventDefault();
                    this.showCommandPalette();
                    break;
                case 'h':
                    event.preventDefault();
                    this.toggleHeatmaps();
                    break;
                case 'p':
                    event.preventDefault();
                    this.togglePressureView();
                    break;
                case 'n':
                    event.preventDefault();
                    this.toggleNetworkView();
                    break;
            }
        }
    }
    
    // Public API for data-driven visualizations
    updatePressureHeatmap(gameData) {
        const viz = this.visualizations.get('pressureHeatmap');
        if (viz) {
            viz.updateData(gameData);
            this.scheduleRender();
        }
    }
    
    updateClutchTimeline(timelineData) {
        const viz = this.visualizations.get('clutchTimeline');
        if (viz) {
            viz.updateData(timelineData);
            this.scheduleRender();
        }
    }
    
    updateWinProbability(probData) {
        const viz = this.visualizations.get('winProbabilityStream');
        if (viz) {
            viz.updateData(probData);
            this.scheduleRender();
        }
    }
    
    scheduleRender() {
        if (this.animationFrameId) return;
        
        this.animationFrameId = requestAnimationFrame(() => {
            this.render();
            this.animationFrameId = null;
        });
        
        // Show canvas when we have data to visualize
        if (this.canvas2D.style.opacity === '0') {
            this.canvas2D.style.opacity = '0.95';
            this.isActive = true;
        }
    }
    
    render() {
        const currentTime = Date.now();
        const deltaTime = currentTime - this.lastRenderTime;
        
        // Clear canvas with institutional dark background
        this.ctx.fillStyle = this.institutionalPalette.neutral;
        this.ctx.fillRect(0, 0, window.innerWidth, window.innerHeight);
        
        // Render all active visualizations
        this.visualizations.forEach((viz, type) => {
            if (viz.isActive) {
                viz.render(this.ctx, currentTime, deltaTime);
            }
        });
        
        this.lastRenderTime = currentTime;
    }
    
    showTooltip(target) {
        // Bloomberg Terminal-style tooltip
        const tooltip = document.getElementById('blaze-tooltip') || this.createTooltip();
        
        tooltip.innerHTML = `
            <div class="tooltip-header">${target.title}</div>
            <div class="tooltip-content">${target.content}</div>
            ${target.action ? `<div class="tooltip-action">${target.action}</div>` : ''}
        `;
        
        tooltip.style.display = 'block';
        tooltip.style.left = target.x + 'px';
        tooltip.style.top = (target.y - 10) + 'px';
    }
    
    createTooltip() {
        const tooltip = document.createElement('div');
        tooltip.id = 'blaze-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: ${this.institutionalPalette.dark};
            border: 1px solid ${this.institutionalPalette.primary};
            border-radius: 4px;
            padding: 8px 12px;
            font-family: 'JetBrains Mono', monospace;
            font-size: 12px;
            color: #ffffff;
            z-index: 10000;
            pointer-events: none;
            opacity: 0.95;
            max-width: 300px;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            display: none;
        `;
        
        document.body.appendChild(tooltip);
        return tooltip;
    }
    
    hideTooltip() {
        const tooltip = document.getElementById('blaze-tooltip');
        if (tooltip) {
            tooltip.style.display = 'none';
        }
    }
    
    showCommandPalette() {
        // Power user command interface
        console.log('🎯 Command Palette (Future Implementation)');
        // Implementation for Cmd+K style command palette
    }
    
    dispose() {
        if (this.canvas2D && this.canvas2D.parentNode) {
            this.canvas2D.parentNode.removeChild(this.canvas2D);
        }
        
        this.visualizations.clear();
        this.isActive = false;
        
        console.log('🎯 Specialized Visualizations disposed');
    }
}

// Specialized Visualization Classes

class PressureHeatmapViz {
    constructor(parent) {
        this.parent = parent;
        this.data = [];
        this.isActive = false;
        this.hexbins = new Map();
        this.maxFrequency = 1;
    }
    
    updateData(gameData) {
        this.data = gameData;
        this.processHexbins();
        this.isActive = this.data.length > 0;
    }
    
    processHexbins() {
        // Hexbin aggregation for spatial analysis (research implementation)
        this.hexbins.clear();
        this.maxFrequency = 1;
        
        const hexRadius = 25;
        
        this.data.forEach(point => {
            const hexKey = this.getHexKey(point.x, point.y, hexRadius);
            if (!this.hexbins.has(hexKey)) {
                this.hexbins.set(hexKey, {
                    centerX: point.x,
                    centerY: point.y,
                    frequency: 0,
                    efficiency: 0,
                    pressure: 0,
                    samples: 0
                });
            }
            
            const hex = this.hexbins.get(hexKey);
            hex.frequency += 1;
            hex.efficiency += point.efficiency || 0;
            hex.pressure += point.pressure || 0;
            hex.samples += 1;
            
            this.maxFrequency = Math.max(this.maxFrequency, hex.frequency);
        });
    }
    
    getHexKey(x, y, radius) {
        const q = (2/3 * x) / radius;
        const r = (-1/3 * x + Math.sqrt(3)/3 * y) / radius;
        return `${Math.round(q)},${Math.round(r)}`;
    }
    
    render(ctx, currentTime, deltaTime) {
        this.hexbins.forEach(hex => {
            const efficiency = hex.efficiency / hex.samples;
            const pressure = hex.pressure / hex.samples;
            const normalizedFreq = hex.frequency / this.maxFrequency;
            
            // Color based on efficiency vs league average
            let color;
            if (efficiency < -0.1) {
                color = this.parent.institutionalPalette.primary; // Burnt orange for poor
            } else if (efficiency > 0.1) {
                color = this.parent.institutionalPalette.secondary; // Cardinal blue for excellent
            } else {
                color = '#808080'; // Neutral gray
            }
            
            // Size based on frequency, opacity based on pressure
            const size = 15 + (normalizedFreq * 20);
            const alpha = 0.3 + (pressure * 0.7);
            
            ctx.save();
            ctx.globalAlpha = alpha;
            ctx.fillStyle = color;
            
            // Draw hexagon
            this.drawHexagon(ctx, hex.centerX, hex.centerY, size);
            ctx.fill();
            
            // Add pressure glow for high-pressure areas
            if (pressure > 0.7) {
                ctx.shadowColor = this.parent.institutionalPalette.accent;
                ctx.shadowBlur = 10;
                this.drawHexagon(ctx, hex.centerX, hex.centerY, size * 0.8);
                ctx.fill();
            }
            
            ctx.restore();
        });
    }
    
    drawHexagon(ctx, centerX, centerY, size) {
        ctx.beginPath();
        for (let i = 0; i < 6; i++) {
            const angle = (Math.PI / 3) * i;
            const x = centerX + size * Math.cos(angle);
            const y = centerY + size * Math.sin(angle);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        ctx.closePath();
    }
    
    getHoverTarget(x, y) {
        // Find hexbin under cursor
        for (const [key, hex] of this.hexbins) {
            const distance = Math.sqrt(
                Math.pow(x - hex.centerX, 2) + Math.pow(y - hex.centerY, 2)
            );
            
            if (distance < 30) {
                const efficiency = hex.efficiency / hex.samples;
                const pressure = hex.pressure / hex.samples;
                
                return {
                    x: x,
                    y: y,
                    title: 'Field Position Analytics',
                    content: `
                        Frequency: ${hex.frequency} plays<br>
                        Efficiency: ${(efficiency * 100).toFixed(1)}% vs avg<br>
                        Pressure Rating: ${(pressure * 100).toFixed(1)}%
                    `,
                    priority: 3
                };
            }
        }
        
        return null;
    }
    
    handleClick(x, y) {
        // Drill-down functionality
        const target = this.getHoverTarget(x, y);
        if (target) {
            console.log('🎯 Hexbin selected for drill-down analysis');
        }
    }
}

class ClutchTimelineViz {
    constructor(parent) {
        this.parent = parent;
        this.data = [];
        this.isActive = false;
        this.timelineHeight = 100;
        this.margin = 50;
    }
    
    updateData(timelineData) {
        this.data = timelineData;
        this.isActive = this.data.length > 0;
    }
    
    render(ctx, currentTime, deltaTime) {
        if (!this.isActive) return;
        
        const width = window.innerWidth - (this.margin * 2);
        const height = this.timelineHeight;
        const startY = window.innerHeight - this.timelineHeight - this.margin;
        
        // Background
        ctx.fillStyle = 'rgba(26, 26, 26, 0.9)';
        ctx.fillRect(this.margin, startY, width, height);
        
        // Border
        ctx.strokeStyle = this.parent.institutionalPalette.primary;
        ctx.lineWidth = 2;
        ctx.strokeRect(this.margin, startY, width, height);
        
        // Timeline data
        this.data.forEach((point, index) => {
            const x = this.margin + (index / (this.data.length - 1)) * width;
            const pressureHeight = point.clutchFactor * height;
            const y = startY + height - pressureHeight;
            
            // Pressure bar
            const color = point.clutchFactor > 0.7 ? 
                this.parent.institutionalPalette.accent : 
                this.parent.institutionalPalette.secondary;
            
            ctx.fillStyle = color;
            ctx.fillRect(x - 2, y, 4, pressureHeight);
            
            // Critical moments
            if (point.critical) {
                ctx.fillStyle = this.parent.institutionalPalette.warning;
                ctx.beginPath();
                ctx.arc(x, y - 5, 6, 0, Math.PI * 2);
                ctx.fill();
            }
        });
        
        // Labels
        ctx.fillStyle = '#ffffff';
        ctx.font = '12px JetBrains Mono';
        ctx.textAlign = 'center';
        ctx.fillText('CLUTCH PERFORMANCE TIMELINE', window.innerWidth / 2, startY - 10);
    }
    
    getHoverTarget(x, y) {
        // Timeline hover detection
        const startY = window.innerHeight - this.timelineHeight - this.margin;
        const width = window.innerWidth - (this.margin * 2);
        
        if (x >= this.margin && x <= this.margin + width && 
            y >= startY && y <= startY + this.timelineHeight) {
            
            const dataIndex = Math.floor(((x - this.margin) / width) * this.data.length);
            const point = this.data[dataIndex];
            
            if (point) {
                return {
                    x: x,
                    y: y - 20,
                    title: `Game Time: ${point.gameTime}`,
                    content: `
                        Clutch Factor: ${(point.clutchFactor * 100).toFixed(1)}%<br>
                        Win Probability: ${(point.winProbability * 100).toFixed(1)}%<br>
                        ${point.critical ? '<strong>CRITICAL MOMENT</strong>' : ''}
                    `,
                    priority: 2
                };
            }
        }
        
        return null;
    }
    
    handleClick(x, y) {
        // Timeline scrubbing for detailed analysis
        const target = this.getHoverTarget(x, y);
        if (target) {
            console.log('🎯 Timeline moment selected for analysis');
        }
    }
}

class WinProbabilityStreamViz {
    constructor(parent) {
        this.parent = parent;
        this.data = [];
        this.isActive = false;
        this.streamWidth = 300;
        this.streamHeight = 200;
    }
    
    updateData(probData) {
        this.data = probData;
        this.isActive = this.data.length > 0;
    }
    
    render(ctx, currentTime, deltaTime) {
        if (!this.isActive) return;
        
        const x = 50;
        const y = 50;
        
        // Background
        ctx.fillStyle = 'rgba(0, 34, 68, 0.8)';
        ctx.fillRect(x, y, this.streamWidth, this.streamHeight);
        
        // Grid lines
        ctx.strokeStyle = 'rgba(155, 203, 235, 0.2)';
        ctx.lineWidth = 1;
        
        for (let i = 0; i <= 4; i++) {
            const gridY = y + (i * this.streamHeight / 4);
            ctx.beginPath();
            ctx.moveTo(x, gridY);
            ctx.lineTo(x + this.streamWidth, gridY);
            ctx.stroke();
        }
        
        // Win probability curve
        ctx.beginPath();
        ctx.strokeStyle = this.parent.institutionalPalette.accent;
        ctx.lineWidth = 3;
        
        this.data.forEach((point, index) => {
            const plotX = x + (index / (this.data.length - 1)) * this.streamWidth;
            const plotY = y + this.streamHeight - (point.probability * this.streamHeight);
            
            if (index === 0) {
                ctx.moveTo(plotX, plotY);
            } else {
                ctx.lineTo(plotX, plotY);
            }
        });
        
        ctx.stroke();
        
        // Current value
        if (this.data.length > 0) {
            const currentProb = this.data[this.data.length - 1].probability;
            ctx.fillStyle = '#ffffff';
            ctx.font = 'bold 24px JetBrains Mono';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${(currentProb * 100).toFixed(1)}%`,
                x + this.streamWidth / 2,
                y + this.streamHeight / 2
            );
            
            ctx.font = '12px JetBrains Mono';
            ctx.fillText('WIN PROBABILITY', x + this.streamWidth / 2, y - 10);
        }
    }
    
    getHoverTarget(x, y) {
        if (x >= 50 && x <= 350 && y >= 50 && y <= 250) {
            return {
                x: x,
                y: y - 20,
                title: 'Win Probability Stream',
                content: 'Real-time championship odds based on game state and pressure analytics',
                priority: 1
            };
        }
        return null;
    }
    
    handleClick(x, y) {
        console.log('🎯 Win Probability stream interaction');
    }
}

// Additional visualization classes would be implemented here:
// - TacticalNetworkViz (for play-calling analysis)
// - MomentumFlowViz (for possession flow)
// - PerformanceRadarViz (for player comparisons)

// Initialize and make globally available
window.BlazeSpecializedVisualizations = BlazeSpecializedVisualizations;

console.log('🎯 Specialized Sports Visualizations loaded - Decision-focused design ready');