/**
 * Blaze Intelligence 3D Background
 * Professional Three.js visualization with particle systems
 */

class Blaze3DBackground {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.particles = null;
        this.lines = [];
        this.mouseX = 0;
        this.mouseY = 0;
        this.targetX = 0;
        this.targetY = 0;
        this.clock = new THREE.Clock();
        
        this.init();
    }
    
    init() {
        // Create scene
        this.scene = new THREE.Scene();
        this.scene.fog = new THREE.FogExp2(0x0a0a0a, 0.001);
        
        // Setup camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.z = 50;
        
        // Setup renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true,
            powerPreference: 'high-performance'
        });
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setClearColor(0x0a0a0a, 0);
        
        // Add canvas to page
        const container = document.getElementById('three-canvas');
        if (container) {
            container.appendChild(this.renderer.domElement);
        } else {
            const canvas = document.createElement('div');
            canvas.id = 'three-canvas';
            canvas.style.position = 'fixed';
            canvas.style.top = '0';
            canvas.style.left = '0';
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            canvas.style.zIndex = '0';
            canvas.style.pointerEvents = 'none';
            document.body.prepend(canvas);
            canvas.appendChild(this.renderer.domElement);
        }
        
        // Create particle system
        this.createParticles();
        
        // Create connection lines
        this.createConnectionLines();
        
        // Add ambient light
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);
        this.scene.add(ambientLight);
        
        // Add point light
        const pointLight = new THREE.PointLight(0xBF5700, 1, 100);
        pointLight.position.set(20, 20, 20);
        this.scene.add(pointLight);
        
        // Add secondary light
        const pointLight2 = new THREE.PointLight(0x9BCBEB, 0.5, 100);
        pointLight2.position.set(-20, -20, 20);
        this.scene.add(pointLight2);
        
        // Setup event listeners
        this.setupEventListeners();
        
        // Start animation
        this.animate();
    }
    
    createParticles() {
        const particleCount = 1500;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);
        
        // Burnt orange and cardinal blue colors
        const color1 = new THREE.Color(0xBF5700);
        const color2 = new THREE.Color(0x9BCBEB);
        const color3 = new THREE.Color(0xFFFFFF);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // Position particles in a sphere
            const radius = 80;
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos((Math.random() * 2) - 1);
            
            positions[i3] = radius * Math.sin(phi) * Math.cos(theta);
            positions[i3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
            positions[i3 + 2] = radius * Math.cos(phi);
            
            // Random colors
            const mixRatio = Math.random();
            let color;
            if (mixRatio < 0.4) {
                color = color1;
            } else if (mixRatio < 0.7) {
                color = color2;
            } else {
                color = color3;
            }
            
            colors[i3] = color.r;
            colors[i3 + 1] = color.g;
            colors[i3 + 2] = color.b;
            
            // Random sizes
            sizes[i] = Math.random() * 2 + 0.5;
        }
        
        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));
        
        // Shader material for particles
        const material = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: this.renderer.getPixelRatio() }
            },
            vertexShader: `
                attribute float size;
                attribute vec3 color;
                varying vec3 vColor;
                uniform float time;
                uniform float pixelRatio;
                
                void main() {
                    vColor = color;
                    vec3 pos = position;
                    
                    // Add wave motion
                    pos.x += sin(time * 0.001 + position.y * 0.01) * 2.0;
                    pos.y += cos(time * 0.001 + position.x * 0.01) * 2.0;
                    pos.z += sin(time * 0.001 + position.x * 0.01) * 1.0;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    
                    // Size attenuation
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    // Circular particle shape
                    vec2 center = gl_PointCoord - vec2(0.5);
                    float dist = length(center);
                    
                    if (dist > 0.5) {
                        discard;
                    }
                    
                    // Soft edges
                    float alpha = smoothstep(0.5, 0.2, dist);
                    
                    gl_FragColor = vec4(vColor, alpha * 0.8);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(geometry, material);
        this.scene.add(this.particles);
    }
    
    createConnectionLines() {
        const lineCount = 50;
        const material = new THREE.LineBasicMaterial({
            color: 0xBF5700,
            opacity: 0.2,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        for (let i = 0; i < lineCount; i++) {
            const geometry = new THREE.BufferGeometry();
            const positions = new Float32Array(6);
            
            // Random start and end points
            for (let j = 0; j < 6; j++) {
                positions[j] = (Math.random() - 0.5) * 100;
            }
            
            geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            
            const line = new THREE.Line(geometry, material);
            this.lines.push(line);
            this.scene.add(line);
        }
    }
    
    setupEventListeners() {
        // Mouse movement
        document.addEventListener('mousemove', (event) => {
            this.mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            this.mouseY = -(event.clientY / window.innerHeight) * 2 + 1;
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
        // Scroll effect
        window.addEventListener('scroll', () => {
            const scrollY = window.scrollY;
            this.camera.position.y = scrollY * 0.01;
        });
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        const time = this.clock.getElapsedTime();
        
        // Smooth mouse follow
        this.targetX += (this.mouseX - this.targetX) * 0.05;
        this.targetY += (this.mouseY - this.targetY) * 0.05;
        
        // Rotate particles
        if (this.particles) {
            this.particles.rotation.x = time * 0.05;
            this.particles.rotation.y = time * 0.03;
            
            // Mouse influence
            this.particles.rotation.x += this.targetY * 0.5;
            this.particles.rotation.y += this.targetX * 0.5;
            
            // Update shader time
            this.particles.material.uniforms.time.value = time * 1000;
        }
        
        // Animate lines
        this.lines.forEach((line, index) => {
            const positions = line.geometry.attributes.position.array;
            const offset = index * 0.1;
            
            // Wave motion for lines
            positions[1] = Math.sin(time + offset) * 10;
            positions[4] = Math.cos(time + offset) * 10;
            
            line.geometry.attributes.position.needsUpdate = true;
            
            // Fade lines based on distance
            const distance = Math.sqrt(
                positions[0] * positions[0] + 
                positions[2] * positions[2]
            );
            line.material.opacity = Math.max(0, 0.3 - distance / 200);
        });
        
        // Camera movement
        this.camera.position.x += (this.targetX * 10 - this.camera.position.x) * 0.05;
        this.camera.position.y += (-this.targetY * 10 - this.camera.position.y) * 0.05;
        this.camera.lookAt(this.scene.position);
        
        // Render scene
        this.renderer.render(this.scene, this.camera);
    }
    
    // Public methods
    setIntensity(intensity) {
        if (this.particles) {
            this.particles.material.opacity = intensity;
        }
    }
    
    pause() {
        // Pause animation if needed
    }
    
    resume() {
        // Resume animation if needed
    }
    
    destroy() {
        // Clean up resources
        if (this.renderer) {
            this.renderer.dispose();
        }
    }
}

// Initialize on DOM ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        // Only initialize if Three.js is available
        if (typeof THREE !== 'undefined') {
            window.blaze3D = new Blaze3DBackground();
        }
    });
} else {
    if (typeof THREE !== 'undefined') {
        window.blaze3D = new Blaze3DBackground();
    }
}