// Enhanced Three.js Hero Animation with Advanced Particle System
// Merged from Blaze Intelligence OS

class EnhancedThreeHero {
    constructor(canvasId = 'three-canvas') {
        this.canvas = document.getElementById(canvasId);
        if (!this.canvas) {
            console.warn('Three.js canvas not found, creating default canvas');
            this.createDefaultCanvas();
        }
        
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.sphere = null;
        this.animationId = null;
        
        this.init();
    }

    createDefaultCanvas() {
        this.canvas = document.createElement('canvas');
        this.canvas.id = 'three-canvas';
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100vh';
        this.canvas.style.zIndex = '1';
        this.canvas.style.opacity = '0.7';
        document.body.appendChild(this.canvas);
    }

    init() {
        this.createScene();
        this.createCamera();
        this.createRenderer();
        this.createParticleSystem();
        this.createGlowingSphere();
        this.setupEventListeners();
        this.animate();
        
        console.log('🔥 Enhanced Three.js Hero Animation Initialized');
    }

    createScene() {
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0a0f, 0.002);
    }

    createCamera() {
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 30;
        this.camera.position.y = 0;
    }

    createRenderer() {
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: this.canvas, 
            alpha: true,
            antialias: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setClearColor(0x0a0a0f, 0);
    }

    createParticleSystem() {
        const particles = new THREE.BufferGeometry();
        const particleCount = 8000; // Increased particle count for more dramatic effect
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        for(let i = 0; i < particleCount * 3; i += 3) {
            // Create expanding sphere distribution
            const radius = 20 + Math.random() * 80;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;

            positions[i] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i + 2] = radius * Math.cos(phi);
            
            // Enhanced UT Orange to Gold gradient with more variety
            const mix = Math.random();
            const intensity = 0.7 + Math.random() * 0.3;
            
            if (mix < 0.6) {
                // UT Burnt Orange (#BF5700)
                colors[i] = 0.75 * intensity;     // R
                colors[i + 1] = 0.34 * intensity; // G
                colors[i + 2] = 0;                // B
            } else if (mix < 0.8) {
                // Gold/Yellow (#FFB81C)
                colors[i] = 1.0 * intensity;      // R
                colors[i + 1] = 0.72 * intensity; // G
                colors[i + 2] = 0.11 * intensity; // B
            } else {
                // Hot Orange (#FF7A00)
                colors[i] = 1.0 * intensity;      // R
                colors[i + 1] = 0.48 * intensity; // G
                colors[i + 2] = 0;                // B
            }

            // Variable particle sizes
            sizes[i / 3] = 0.5 + Math.random() * 2;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particles.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        particles.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        const particleMaterial = new THREE.PointsMaterial({
            size: 1,
            sizeAttenuation: true,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particles = new THREE.Points(particles, particleMaterial);
        this.scene.add(this.particles);
    }

    createGlowingSphere() {
        // Main central sphere
        const sphereGeometry = new THREE.SphereGeometry(6, 32, 32);
        const sphereMaterial = new THREE.MeshBasicMaterial({
            color: 0xBF5700,
            wireframe: true,
            transparent: true,
            opacity: 0.4
        });
        this.sphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        this.scene.add(this.sphere);

        // Add inner glow sphere
        const glowGeometry = new THREE.SphereGeometry(5, 16, 16);
        const glowMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF7A00,
            transparent: true,
            opacity: 0.2,
            blending: THREE.AdditiveBlending
        });
        const glowSphere = new THREE.Mesh(glowGeometry, glowMaterial);
        this.sphere.add(glowSphere);

        // Add outer ring
        const ringGeometry = new THREE.RingGeometry(8, 10, 32);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFB81C,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        this.sphere.add(ring);
    }

    animate() {
        this.animationId = requestAnimationFrame(() => this.animate());
        
        const time = Date.now() * 0.001;
        
        // Enhanced particle animation
        if (this.particles) {
            this.particles.rotation.y += 0.002;
            this.particles.rotation.x += 0.001;
            
            // Pulse effect on particles
            const positions = this.particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                const originalY = positions[i + 1];
                positions[i + 1] = originalY + Math.sin(time * 2 + i * 0.01) * 0.1;
            }
            this.particles.geometry.attributes.position.needsUpdate = true;
        }
        
        // Enhanced sphere animation
        if (this.sphere) {
            this.sphere.rotation.x += 0.01;
            this.sphere.rotation.y += 0.015;
            
            // Dynamic scaling with multiple harmonics
            const scale = 1 + 
                Math.sin(time * 2) * 0.05 + 
                Math.sin(time * 3.7) * 0.03 +
                Math.sin(time * 1.3) * 0.02;
            
            this.sphere.scale.setScalar(scale);
            
            // Color shifting
            const hue = (time * 0.1) % 1;
            this.sphere.material.color.setHSL(0.08 + hue * 0.1, 1, 0.5);
        }
        
        // Camera movement
        this.camera.position.x = Math.sin(time * 0.1) * 2;
        this.camera.position.y = Math.cos(time * 0.15) * 1;
        this.camera.lookAt(this.scene.position);
        
        this.renderer.render(this.scene, this.camera);
    }

    setupEventListeners() {
        window.addEventListener('resize', () => this.handleResize());
        
        // Mouse interaction
        document.addEventListener('mousemove', (event) => this.handleMouseMove(event));
        
        // Scroll-based effects
        window.addEventListener('scroll', () => this.handleScroll());
    }

    handleResize() {
        if (!this.camera || !this.renderer) return;
        
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    handleMouseMove(event) {
        if (!this.particles) return;
        
        const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
        const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        
        // Subtle particle response to mouse
        this.particles.rotation.x += (mouseY - this.particles.rotation.x) * 0.002;
        this.particles.rotation.y += (mouseX - this.particles.rotation.y) * 0.002;
    }

    handleScroll() {
        if (!this.sphere) return;
        
        const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
        
        // Adjust opacity and rotation based on scroll
        this.sphere.material.opacity = 0.4 * (1 - scrollPercent * 0.5);
        if (this.particles) {
            this.particles.material.opacity = 0.8 * (1 - scrollPercent * 0.3);
        }
    }

    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        // Clean up resources
        if (this.scene) {
            this.scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        }
        
        if (this.renderer) {
            this.renderer.dispose();
        }
        
        console.log('🔥 Enhanced Three.js Hero Animation Destroyed');
    }

    // Public methods for external control
    setParticleCount(count) {
        if (this.particles) {
            this.scene.remove(this.particles);
            // Recreate with new count
            this.createParticleSystem();
        }
    }

    setParticleOpacity(opacity) {
        if (this.particles) {
            this.particles.material.opacity = opacity;
        }
    }

    setSphereOpacity(opacity) {
        if (this.sphere) {
            this.sphere.material.opacity = opacity;
        }
    }

    pauseAnimation() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
    }

    resumeAnimation() {
        if (!this.animationId) {
            this.animate();
        }
    }
}

// Auto-initialize if THREE.js is available
if (typeof THREE !== 'undefined') {
    // Wait for DOM to be ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            window.enhancedThreeHero = new EnhancedThreeHero();
        });
    } else {
        window.enhancedThreeHero = new EnhancedThreeHero();
    }
} else {
    console.warn('Three.js not found - Enhanced Three.js Hero Animation disabled');
}

// Export for manual initialization
window.EnhancedThreeHero = EnhancedThreeHero;