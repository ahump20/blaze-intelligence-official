// Enhanced Three.js Hero Visualization
// Advanced particle network with dynamic connections and sports data integration

class BlazeHeroVisualization {
    constructor() {
        this.container = document.getElementById('hero-canvas');
        if (!this.container) {
            this.createHeroCanvas();
        }
        
        this.init();
        this.animate();
        this.setupInteractions();
    }

    createHeroCanvas() {
        const heroSection = document.querySelector('.hero');
        if (heroSection) {
            const canvas = document.createElement('canvas');
            canvas.id = 'hero-canvas';
            canvas.style.position = 'absolute';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '1';
            heroSection.prepend(canvas);
            this.container = canvas;
        }
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.Fog(0x000a14, 100, 1000);

        // Camera setup
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 50;

        // Renderer setup
        this.renderer = new THREE.WebGLRenderer({
            canvas: this.container,
            antialias: true,
            alpha: true
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

        // Particle system for data points
        this.createParticleNetwork();
        
        // Add floating sport objects
        this.createSportElements();
        
        // Add glowing orbs for metrics
        this.createMetricOrbs();
        
        // Lighting
        this.setupLighting();

        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }

    createParticleNetwork() {
        const particleCount = 150;
        const geometry = new THREE.BufferGeometry();
        const positions = [];
        const colors = [];
        this.particles = [];

        // Create particles representing data points
        for (let i = 0; i < particleCount; i++) {
            const x = (Math.random() - 0.5) * 100;
            const y = (Math.random() - 0.5) * 100;
            const z = (Math.random() - 0.5) * 100;
            
            positions.push(x, y, z);
            
            // Burnt orange to cardinal blue gradient
            const color = new THREE.Color();
            const hue = Math.random() * 0.15 + 0.05; // Orange to blue range
            color.setHSL(hue, 0.8, 0.5);
            colors.push(color.r, color.g, color.b);
            
            this.particles.push({
                x, y, z,
                vx: (Math.random() - 0.5) * 0.02,
                vy: (Math.random() - 0.5) * 0.02,
                vz: (Math.random() - 0.5) * 0.02
            });
        }

        geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        // Custom shader material for glowing particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                size: { value: 3.0 }
            },
            vertexShader: `
                uniform float time;
                uniform float size;
                attribute vec3 color;
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vColor = color;
                    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
                    
                    // Pulsing effect
                    float pulse = sin(time * 2.0 + position.x * 0.1) * 0.5 + 0.5;
                    gl_PointSize = size * (1.0 + pulse * 0.5) * (300.0 / -mvPosition.z);
                    
                    vAlpha = 1.0 - smoothstep(1.0, 100.0, -mvPosition.z);
                    gl_Position = projectionMatrix * mvPosition;
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                varying float vAlpha;
                
                void main() {
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    if (dist > 0.5) discard;
                    
                    float alpha = smoothstep(0.5, 0.0, dist) * vAlpha;
                    gl_FragColor = vec4(vColor, alpha);
                }
            `,
            transparent: true,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });

        this.particleSystem = new THREE.Points(geometry, material);
        this.scene.add(this.particleSystem);

        // Create connections between nearby particles
        this.createConnections();
    }

    createConnections() {
        const connectionGeometry = new THREE.BufferGeometry();
        const connectionPositions = [];
        const connectionColors = [];
        const maxDistance = 20;

        for (let i = 0; i < this.particles.length; i++) {
            for (let j = i + 1; j < this.particles.length; j++) {
                const p1 = this.particles[i];
                const p2 = this.particles[j];
                const distance = Math.sqrt(
                    Math.pow(p1.x - p2.x, 2) +
                    Math.pow(p1.y - p2.y, 2) +
                    Math.pow(p1.z - p2.z, 2)
                );

                if (distance < maxDistance) {
                    connectionPositions.push(p1.x, p1.y, p1.z);
                    connectionPositions.push(p2.x, p2.y, p2.z);
                    
                    const alpha = 1 - distance / maxDistance;
                    connectionColors.push(0.75, 0.34, 0, alpha * 0.3); // Burnt orange with fade
                    connectionColors.push(0.61, 0.8, 0.92, alpha * 0.3); // Cardinal blue with fade
                }
            }
        }

        connectionGeometry.setAttribute('position', new THREE.Float32BufferAttribute(connectionPositions, 3));
        connectionGeometry.setAttribute('color', new THREE.Float32BufferAttribute(connectionColors, 4));

        const connectionMaterial = new THREE.LineBasicMaterial({
            vertexColors: true,
            transparent: true,
            opacity: 0.3,
            blending: THREE.AdditiveBlending
        });

        this.connections = new THREE.LineSegments(connectionGeometry, connectionMaterial);
        this.scene.add(this.connections);
    }

    createSportElements() {
        // Baseball
        const baseballGeometry = new THREE.SphereGeometry(2, 16, 16);
        const baseballMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0xBF5700,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.8
        });
        this.baseball = new THREE.Mesh(baseballGeometry, baseballMaterial);
        this.baseball.position.set(30, 10, -20);
        this.scene.add(this.baseball);

        // Football (American)
        const footballGeometry = new THREE.IcosahedronGeometry(2.5, 0);
        const footballMaterial = new THREE.MeshPhongMaterial({
            color: 0x8B4513,
            emissive: 0x9BCBEB,
            emissiveIntensity: 0.15,
            transparent: true,
            opacity: 0.8
        });
        this.football = new THREE.Mesh(footballGeometry, footballMaterial);
        this.football.position.set(-35, -15, -25);
        this.scene.add(this.football);

        // Basketball
        const basketballGeometry = new THREE.SphereGeometry(2.2, 32, 32);
        const basketballMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF6600,
            emissive: 0x002244,
            emissiveIntensity: 0.1,
            transparent: true,
            opacity: 0.8
        });
        this.basketball = new THREE.Mesh(basketballGeometry, basketballMaterial);
        this.basketball.position.set(25, -20, -30);
        this.scene.add(this.basketball);
    }

    createMetricOrbs() {
        // Create glowing orbs representing key metrics
        const orbPositions = [
            { x: -40, y: 20, z: -10, color: 0xBF5700, metric: '94.6%' },
            { x: 40, y: -10, z: -15, color: 0x9BCBEB, metric: '<100ms' },
            { x: 0, y: 30, z: -20, color: 0x00B2A9, metric: '2.8M+' }
        ];

        this.orbs = [];
        orbPositions.forEach(pos => {
            const orbGeometry = new THREE.SphereGeometry(3, 32, 32);
            const orbMaterial = new THREE.MeshPhongMaterial({
                color: pos.color,
                emissive: pos.color,
                emissiveIntensity: 0.5,
                transparent: true,
                opacity: 0.6
            });
            const orb = new THREE.Mesh(orbGeometry, orbMaterial);
            orb.position.set(pos.x, pos.y, pos.z);
            orb.userData = { metric: pos.metric, baseY: pos.y };
            
            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(4, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: pos.color,
                transparent: true,
                opacity: 0.2
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            orb.add(glow);
            
            this.orbs.push(orb);
            this.scene.add(orb);
        });
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        this.scene.add(ambientLight);

        // Point lights for dramatic effect
        const pointLight1 = new THREE.PointLight(0xBF5700, 1, 100);
        pointLight1.position.set(50, 50, 50);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x9BCBEB, 1, 100);
        pointLight2.position.set(-50, -50, 50);
        this.scene.add(pointLight2);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5);
        directionalLight.position.set(0, 10, 5);
        this.scene.add(directionalLight);
    }

    setupInteractions() {
        this.mouse = new THREE.Vector2();
        this.raycaster = new THREE.Raycaster();

        window.addEventListener('mousemove', (event) => {
            this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
        });

        // Scroll-based camera movement
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            this.camera.position.y = scrollY * 0.01;
            this.camera.rotation.x = scrollY * 0.0001;
        });
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Update particle positions
        if (this.particleSystem) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            for (let i = 0; i < this.particles.length; i++) {
                const particle = this.particles[i];
                
                // Gentle floating motion
                positions[i * 3] = particle.x + Math.sin(time + i) * 0.5;
                positions[i * 3 + 1] = particle.y + Math.cos(time + i) * 0.5;
                positions[i * 3 + 2] = particle.z + Math.sin(time + i * 0.5) * 0.5;
            }
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
            this.particleSystem.material.uniforms.time.value = time;
            this.particleSystem.rotation.y = time * 0.05;
        }

        // Rotate sport elements
        if (this.baseball) {
            this.baseball.rotation.x += 0.005;
            this.baseball.rotation.y += 0.01;
            this.baseball.position.y = 10 + Math.sin(time) * 2;
        }
        if (this.football) {
            this.football.rotation.x += 0.007;
            this.football.rotation.z += 0.005;
            this.football.position.y = -15 + Math.cos(time) * 2;
        }
        if (this.basketball) {
            this.basketball.rotation.y += 0.008;
            this.basketball.rotation.z += 0.003;
            this.basketball.position.y = -20 + Math.sin(time * 1.2) * 2;
        }

        // Animate metric orbs
        this.orbs.forEach((orb, index) => {
            orb.position.y = orb.userData.baseY + Math.sin(time + index) * 3;
            orb.rotation.y = time * 0.5;
            orb.children[0].scale.setScalar(1 + Math.sin(time * 2) * 0.1);
        });

        // Camera follows mouse slightly
        if (this.mouse) {
            this.camera.position.x += (this.mouse.x * 10 - this.camera.position.x) * 0.05;
            this.camera.position.y += (-this.mouse.y * 10 - this.camera.position.y) * 0.05;
            this.camera.lookAt(0, 0, 0);
        }

        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }

    destroy() {
        // Cleanup method for removing the visualization
        window.removeEventListener('resize', this.handleResize);
        this.renderer.dispose();
        this.scene.clear();
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    try {
        // Check if Three.js is loaded
        if (typeof THREE !== 'undefined') {
            window.blazeHeroViz = new BlazeHeroVisualization();
        } else {
            console.warn('Three.js not loaded, skipping hero visualization');
        }
    } catch (error) {
        console.warn('Hero visualization failed to initialize:', error);
    }
});