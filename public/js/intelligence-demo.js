// Intelligence Demo Animation
// Real-time visualization of sports analytics processing

class IntelligenceDemo {
    constructor() {
        this.canvas = document.getElementById('intelligence-canvas');
        this.processedTeamsEl = document.getElementById('processed-teams');
        this.accuracyRateEl = document.getElementById('accuracy-rate');
        this.responseTimeEl = document.getElementById('response-time');
        
        if (!this.canvas) return;
        
        this.ctx = this.canvas.getContext('2d');
        this.isRunning = false;
        this.animationId = null;
        
        this.stats = {
            processedTeams: 0,
            accuracyRate: 0,
            responseTime: 0
        };
        
        this.targetStats = {
            processedTeams: 227,
            accuracyRate: 94.6,
            responseTime: 85
        };
        
        this.particles = [];
        this.dataPoints = [];
        
        this.setupCanvas();
        this.initializeDemo();
    }
    
    setupCanvas() {
        const rect = this.canvas.getBoundingClientRect();
        const dpr = window.devicePixelRatio || 1;
        
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        this.ctx.scale(dpr, dpr);
        this.canvas.style.width = rect.width + 'px';
        this.canvas.style.height = rect.height + 'px';
        
        this.width = rect.width;
        this.height = rect.height;
    }
    
    initializeDemo() {
        // Create initial particles representing teams
        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: Math.random() * this.width,
                y: Math.random() * this.height,
                vx: (Math.random() - 0.5) * 2,
                vy: (Math.random() - 0.5) * 2,
                size: 2 + Math.random() * 4,
                color: this.getRandomColor(),
                processed: false,
                opacity: 0.7 + Math.random() * 0.3
            });
        }
        
        // Create data stream points
        for (let i = 0; i < 20; i++) {
            this.dataPoints.push({
                x: -10,
                y: Math.random() * this.height,
                speed: 2 + Math.random() * 3,
                size: 1 + Math.random() * 2,
                color: '#BF5700',
                opacity: 0.8
            });
        }
        
        this.startDemo();
    }
    
    getRandomColor() {
        const colors = ['#BF5700', '#FF7A00', '#FFB81C', '#FF6B35'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    startDemo() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animateStats();
        this.animate();
        
        console.log('🔥 Intelligence Demo Started');
    }
    
    stopDemo() {
        this.isRunning = false;
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
    }
    
    animateStats() {
        const duration = 3000; // 3 seconds
        const startTime = Date.now();
        
        const animateValue = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Ease out animation
            const easeOut = 1 - Math.pow(1 - progress, 3);
            
            this.stats.processedTeams = Math.floor(this.targetStats.processedTeams * easeOut);
            this.stats.accuracyRate = (this.targetStats.accuracyRate * easeOut).toFixed(1);
            this.stats.responseTime = Math.floor(this.targetStats.responseTime * easeOut);
            
            // Update DOM elements
            if (this.processedTeamsEl) {
                this.processedTeamsEl.textContent = this.stats.processedTeams;
            }
            if (this.accuracyRateEl) {
                this.accuracyRateEl.textContent = this.stats.accuracyRate + '%';
            }
            if (this.responseTimeEl) {
                this.responseTimeEl.textContent = this.stats.responseTime + 'ms';
            }
            
            if (progress < 1) {
                setTimeout(animateValue, 16); // ~60fps
            }
        };
        
        animateValue();
    }
    
    animate() {
        if (!this.isRunning) return;
        
        this.ctx.fillStyle = 'rgba(10, 10, 15, 0.1)';
        this.ctx.fillRect(0, 0, this.width, this.height);
        
        this.updateAndDrawParticles();
        this.updateAndDrawDataPoints();
        this.drawConnections();
        this.drawProcessingIndicators();
        
        this.animationId = requestAnimationFrame(() => this.animate());
    }
    
    updateAndDrawParticles() {
        this.particles.forEach((particle, index) => {
            // Update position
            particle.x += particle.vx;
            particle.y += particle.vy;
            
            // Bounce off walls
            if (particle.x <= 0 || particle.x >= this.width) particle.vx *= -1;
            if (particle.y <= 0 || particle.y >= this.height) particle.vy *= -1;
            
            // Keep particles in bounds
            particle.x = Math.max(0, Math.min(this.width, particle.x));
            particle.y = Math.max(0, Math.min(this.height, particle.y));
            
            // Processing effect
            if (!particle.processed && Math.random() < 0.003) {
                particle.processed = true;
                particle.color = '#00DC82'; // Green for processed
                
                // Create processing burst
                this.createProcessingBurst(particle.x, particle.y);
            }
            
            // Draw particle
            this.ctx.beginPath();
            this.ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
            this.ctx.fillStyle = particle.color + Math.floor(particle.opacity * 255).toString(16).padStart(2, '0');
            this.ctx.fill();
            
            // Draw processing ring for processed particles
            if (particle.processed) {
                this.ctx.beginPath();
                this.ctx.arc(particle.x, particle.y, particle.size + 3, 0, Math.PI * 2);
                this.ctx.strokeStyle = '#00DC82';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            }
        });
    }
    
    updateAndDrawDataPoints() {
        this.dataPoints.forEach((point, index) => {
            point.x += point.speed;
            
            // Reset position when off screen
            if (point.x > this.width + 10) {
                point.x = -10;
                point.y = Math.random() * this.height;
                point.speed = 2 + Math.random() * 3;
            }
            
            // Draw data point
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, point.size, 0, Math.PI * 2);
            this.ctx.fillStyle = point.color + Math.floor(point.opacity * 255).toString(16).padStart(2, '0');
            this.ctx.fill();
            
            // Draw trail
            this.ctx.beginPath();
            this.ctx.moveTo(point.x - point.speed * 3, point.y);
            this.ctx.lineTo(point.x, point.y);
            this.ctx.strokeStyle = point.color + '40';
            this.ctx.lineWidth = point.size;
            this.ctx.stroke();
        });
    }
    
    drawConnections() {
        // Draw connections between nearby processed particles
        this.particles.forEach((particle1, i) => {
            if (!particle1.processed) return;
            
            this.particles.forEach((particle2, j) => {
                if (i >= j || !particle2.processed) return;
                
                const distance = Math.sqrt(
                    Math.pow(particle1.x - particle2.x, 2) + 
                    Math.pow(particle1.y - particle2.y, 2)
                );
                
                if (distance < 100) {
                    const opacity = 1 - (distance / 100);
                    this.ctx.beginPath();
                    this.ctx.moveTo(particle1.x, particle1.y);
                    this.ctx.lineTo(particle2.x, particle2.y);
                    this.ctx.strokeStyle = `rgba(191, 87, 0, ${opacity * 0.3})`;
                    this.ctx.lineWidth = 1;
                    this.ctx.stroke();
                }
            });
        });
    }
    
    drawProcessingIndicators() {
        // Draw AI processing waves
        const time = Date.now() * 0.002;
        const centerX = this.width / 2;
        const centerY = this.height / 2;
        
        for (let i = 0; i < 3; i++) {
            const radius = 30 + i * 20 + Math.sin(time + i) * 10;
            const opacity = 0.3 - i * 0.1;
            
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
            this.ctx.strokeStyle = `rgba(191, 87, 0, ${opacity})`;
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        }
        
        // Draw central AI core
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 8, 0, Math.PI * 2);
        this.ctx.fillStyle = '#BF5700';
        this.ctx.fill();
        
        this.ctx.beginPath();
        this.ctx.arc(centerX, centerY, 5, 0, Math.PI * 2);
        this.ctx.fillStyle = '#FFB81C';
        this.ctx.fill();
    }
    
    createProcessingBurst(x, y) {
        // Create visual burst effect when a team is processed
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const speed = 2 + Math.random() * 3;
            
            setTimeout(() => {
                const burstX = x + Math.cos(angle) * 20;
                const burstY = y + Math.sin(angle) * 20;
                
                this.ctx.beginPath();
                this.ctx.arc(burstX, burstY, 2, 0, Math.PI * 2);
                this.ctx.fillStyle = '#00DC82';
                this.ctx.fill();
            }, i * 50);
        }
    }
    
    // Public methods for external control
    reset() {
        this.stats = {
            processedTeams: 0,
            accuracyRate: 0,
            responseTime: 0
        };
        
        this.particles.forEach(particle => {
            particle.processed = false;
            particle.color = this.getRandomColor();
        });
        
        this.animateStats();
    }
    
    pause() {
        this.isRunning = false;
    }
    
    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.animate();
        }
    }
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    // Use Intersection Observer to start demo when visible
    const intelligenceSection = document.getElementById('intelligence-showcase');
    if (intelligenceSection) {
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting && !window.intelligenceDemo) {
                    window.intelligenceDemo = new IntelligenceDemo();
                    observer.unobserve(intelligenceSection);
                }
            });
        }, { threshold: 0.3 });
        
        observer.observe(intelligenceSection);
    }
});

// Export for manual control
window.IntelligenceDemo = IntelligenceDemo;