// Neural Network Background Animation
// Creates an animated neural network visualization for the coach page

class NeuralNetworkBackground {
    constructor() {
        this.canvas = document.getElementById('neural-network-canvas');
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.nodes = [];
        this.connections = [];
        this.particles = [];
        
        this.setupCanvas();
        this.createNetwork();
        this.animate();
        
        // Handle resize
        window.addEventListener('resize', () => this.setupCanvas());
    }
    
    setupCanvas() {
        const rect = this.canvas.parentElement.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        this.width = rect.width;
        this.height = rect.height;
    }
    
    createNetwork() {
        // Create neural network nodes
        const layers = 5;
        const nodesPerLayer = [3, 5, 7, 5, 3];
        
        this.nodes = [];
        this.connections = [];
        
        for (let layer = 0; layer < layers; layer++) {
            const nodeCount = nodesPerLayer[layer];
            const layerX = (layer / (layers - 1)) * this.width;
            
            for (let i = 0; i < nodeCount; i++) {
                const y = ((i + 1) / (nodeCount + 1)) * this.height;
                
                this.nodes.push({
                    x: layerX,
                    y: y,
                    layer: layer,
                    index: i,
                    radius: 4 + Math.random() * 4,
                    pulsePhase: Math.random() * Math.PI * 2,
                    activity: Math.random()
                });
            }
        }
        
        // Create connections between layers
        for (let layer = 0; layer < layers - 1; layer++) {
            const currentLayerNodes = this.nodes.filter(n => n.layer === layer);
            const nextLayerNodes = this.nodes.filter(n => n.layer === layer + 1);
            
            currentLayerNodes.forEach(node1 => {
                nextLayerNodes.forEach(node2 => {
                    if (Math.random() < 0.6) { // 60% connection probability
                        this.connections.push({
                            from: node1,
                            to: node2,
                            strength: Math.random() * 0.5 + 0.1,
                            pulseOffset: Math.random() * Math.PI * 2
                        });
                    }
                });
            });
        }
        
        // Create floating particles
        for (let i = 0; i < 30; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 0.5,
                vy: (Math.random() - 0.5) * 0.5,
                size: 1 + Math.random() * 2,
                opacity: 0.3 + Math.random() * 0.4
            });
        }
    }
    
    animate() {
        // Clear canvas with fade effect
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.05)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        const time = Date.now() * 0.001;
        
        // Draw connections with pulsing effect
        this.connections.forEach(conn => {
            const pulse = Math.sin(time + conn.pulseOffset) * 0.5 + 0.5;
            const opacity = conn.strength * pulse * 0.3;
            
            // Create gradient for connection
            const gradient = this.ctx.createLinearGradient(
                conn.from.x, conn.from.y,
                conn.to.x, conn.to.y
            );
            gradient.addColorStop(0, `rgba(191, 87, 0, ${opacity})`);
            gradient.addColorStop(0.5, `rgba(255, 184, 28, ${opacity * 0.8})`);
            gradient.addColorStop(1, `rgba(191, 87, 0, ${opacity})`);
            
            this.ctx.strokeStyle = gradient;
            this.ctx.lineWidth = conn.strength * 2;
            this.ctx.beginPath();
            this.ctx.moveTo(conn.from.x, conn.from.y);
            this.ctx.lineTo(conn.to.x, conn.to.y);
            this.ctx.stroke();
            
            // Draw signal pulses along connections
            if (pulse > 0.8 && Math.random() < 0.1) {
                const t = (Math.sin(time * 2 + conn.pulseOffset) + 1) / 2;
                const signalX = conn.from.x + (conn.to.x - conn.from.x) * t;
                const signalY = conn.from.y + (conn.to.y - conn.from.y) * t;
                
                this.ctx.beginPath();
                this.ctx.arc(signalX, signalY, 3, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(255, 184, 28, ${pulse})`;
                this.ctx.fill();
            }
        });
        
        // Draw nodes with pulsing glow
        this.nodes.forEach(node => {
            const pulse = Math.sin(time * 2 + node.pulsePhase) * 0.3 + 0.7;
            node.activity = Math.max(0.1, Math.min(1, node.activity + (Math.random() - 0.5) * 0.1));
            
            // Draw glow
            const glowRadius = node.radius * 3 * pulse;
            const glowGradient = this.ctx.createRadialGradient(
                node.x, node.y, 0,
                node.x, node.y, glowRadius
            );
            glowGradient.addColorStop(0, `rgba(191, 87, 0, ${node.activity * 0.3})`);
            glowGradient.addColorStop(0.5, `rgba(255, 184, 28, ${node.activity * 0.2})`);
            glowGradient.addColorStop(1, 'rgba(191, 87, 0, 0)');
            
            this.ctx.fillStyle = glowGradient;
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
            this.ctx.fill();
            
            // Draw node core
            this.ctx.beginPath();
            this.ctx.arc(node.x, node.y, node.radius * pulse, 0, Math.PI * 2);
            
            const coreGradient = this.ctx.createRadialGradient(
                node.x - node.radius/3, node.y - node.radius/3, 0,
                node.x, node.y, node.radius
            );
            coreGradient.addColorStop(0, '#FFB81C');
            coreGradient.addColorStop(0.5, '#BF5700');
            coreGradient.addColorStop(1, '#8B3A00');
            
            this.ctx.fillStyle = coreGradient;
            this.ctx.fill();
            
            // Draw node ring
            this.ctx.strokeStyle = `rgba(255, 184, 28, ${node.activity * 0.5})`;
            this.ctx.lineWidth = 1;
            this.ctx.stroke();
        });
        
        // Update and draw particles
        this.particles.forEach(particle => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Wrap around edges
            if (particle.x < 0) particle.x = this.width;
            if (particle.x > this.width) particle.x = 0;
            if (particle.y < 0) particle.y = this.height;
            if (particle.y > this.height) particle.y = 0;
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = `rgba(255, 184, 28, ${particle.opacity})`;
            this.ctx.fill();
        });
        
        // Draw data streams
        this.drawDataStreams(time);
        
        requestAnimationFrame(() => this.animate());
    }
    
    drawDataStreams(time) {
        // Create flowing data visualization
        const streamCount = 3;
        
        for (let i = 0; i < streamCount; i++) {
            const offset = (i / streamCount) * Math.PI * 2;
            const x = (Math.sin(time * 0.5 + offset) + 1) * 0.5 * this.width;
            const y = (Math.cos(time * 0.3 + offset) + 1) * 0.5 * this.height;
            
            // Draw stream trail
            for (let j = 0; j < 10; j++) {
                const trailX = x - j * 10 * Math.sin(time * 0.5 + offset);
                const trailY = y - j * 10 * Math.cos(time * 0.3 + offset);
                const opacity = (1 - j / 10) * 0.3;
                
                this.ctx.beginPath();
                this.ctx.arc(trailX, trailY, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = `rgba(0, 220, 130, ${opacity})`;
                this.ctx.fill();
            }
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.neuralNetworkBg = new NeuralNetworkBackground();
    console.log('🌐 Neural Network Background initialized');
});