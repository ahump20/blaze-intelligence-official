/**
 * Blaze Intelligence - Ultimate Visual System
 * Cutting-edge Three.js visualizations for sports analytics platform
 * Features: Data Constellation, Live Flow Field, Metric Rings, NIL Ribbon, Player Cards, Biomech Pose Lines
 */

class BlazeUltimateVisuals {
    constructor() {
        this.scenes = new Map();
        this.renderers = new Map();
        this.cameras = new Map();
        this.animationFrames = new Map();
        this.isInitialized = false;
        this.performanceMode = this.detectPerformanceMode();
        
        // Bind methods
        this.init = this.init.bind(this);
        this.resize = this.resize.bind(this);
        this.dispose = this.dispose.bind(this);
        
        // Initialize on DOM load
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', this.init);
        } else {
            this.init();
        }
        
        // Handle window resize
        window.addEventListener('resize', this.resize);
        
        // Handle page visibility
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pauseAnimations();
            } else {
                this.resumeAnimations();
            }
        });
    }
    
    detectPerformanceMode() {
        const pixelRatio = window.devicePixelRatio || 1;
        const hardwareConcurrency = navigator.hardwareConcurrency || 4;
        const memory = navigator.deviceMemory || 4;
        
        if (pixelRatio > 2 || hardwareConcurrency < 4 || memory < 4) {
            return 'low';
        } else if (hardwareConcurrency >= 8 && memory >= 8) {
            return 'high';
        }
        return 'medium';
    }
    
    init() {
        try {
            // Initialize all visual components
            this.initDataConstellation();
            this.initLiveFlowField();
            this.initMetricRings();
            this.initNILRibbon();
            this.initHolographicPlayerCards();
            this.initBiomechPoseOverlay();
            
            this.isInitialized = true;
            console.log('🔥 Blaze Ultimate Visuals initialized successfully');
        } catch (error) {
            console.error('❌ Error initializing Blaze Ultimate Visuals:', error);
        }
    }
    
    /**
     * 1) Hero "Data Constellation" - Procedural node-link network with depth glow
     */
    initDataConstellation() {
        const canvas = document.querySelector('.hero-canvas');
        if (!canvas) return;
        
        const container = canvas.parentElement;
        const renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: true,
            powerPreference: "high-performance"
        });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 0.1, 2000);
        camera.position.set(0, 0, 65);
        
        // Store references
        this.scenes.set('heroConstellation', scene);
        this.renderers.set('heroConstellation', renderer);
        this.cameras.set('heroConstellation', camera);
        
        // Gradient fog/background
        scene.fog = new THREE.FogExp2(0x0b0b0f, 0.018);
        
        // Node count based on performance
        const nodeCount = this.performanceMode === 'high' ? 1200 : 
                         this.performanceMode === 'medium' ? 800 : 400;
        
        // Nodes (instanced spheres)
        const geo = new THREE.IcosahedronGeometry(0.15, 2);
        const mat = new THREE.MeshStandardMaterial({
            color: 0x9BCBEB,
            emissive: 0x092b33,
            emissiveIntensity: 0.9,
            roughness: 0.5,
            metalness: 0.2
        });
        const inst = new THREE.InstancedMesh(geo, mat, nodeCount);
        scene.add(inst);
        
        // Links (GPU efficient line segments)
        const linkMat = new THREE.LineBasicMaterial({
            color: 0xBF5700,
            transparent: true,
            opacity: 0.35
        });
        const linkGeo = new THREE.BufferGeometry();
        const linkPos = new Float32Array(nodeCount * 6); // two points per link
        linkGeo.setAttribute('position', new THREE.BufferAttribute(linkPos, 3));
        const links = new THREE.LineSegments(linkGeo, linkMat);
        scene.add(links);
        
        // Lights
        scene.add(new THREE.AmbientLight(0x203040, 0.6));
        const keyLight = new THREE.PointLight(0xBF5700, 2, 200);
        keyLight.position.set(30, 20, 40);
        scene.add(keyLight);
        
        // Generate random positions on warped sphere
        const pts = [];
        for (let i = 0; i < nodeCount; i++) {
            const r = 25 + Math.sin(i * 0.13) * 2 + Math.cos(i * 0.07) * 1.2;
            const phi = Math.acos(THREE.MathUtils.randFloatSpread(2));
            const theta = THREE.MathUtils.randFloat(0, Math.PI * 2);
            const p = new THREE.Vector3(
                r * Math.sin(phi) * Math.cos(theta),
                r * Math.cos(phi),
                r * Math.sin(phi) * Math.sin(theta)
            );
            pts.push(p);
            const m = new THREE.Matrix4().setPosition(p);
            inst.setMatrixAt(i, m);
        }
        
        // Build soft links between k-nearest neighbors
        let w = 0;
        for (let i = 0; i < nodeCount; i++) {
            const a = pts[i];
            // Pick neighbors by distance in index space (fast/cheap)
            const j = (i + Math.floor(Math.random() * 70) + 1) % nodeCount;
            const k2 = (i + Math.floor(Math.random() * 90) + 1) % nodeCount;
            [pts[j], pts[k2]].forEach(b => {
                linkPos[w++] = a.x; linkPos[w++] = a.y; linkPos[w++] = a.z;
                linkPos[w++] = b.x; linkPos[w++] = b.y; linkPos[w++] = b.z;
            });
        }
        links.geometry.attributes.position.needsUpdate = true;
        
        // Animation loop
        let t = 0;
        const clock = new THREE.Clock();
        const animate = () => {
            if (document.hidden) return;
            
            const dt = clock.getDelta();
            t += dt;
            
            inst.rotation.y += dt * 0.07;
            links.rotation.y -= dt * 0.04;
            keyLight.position.x = 30 * Math.cos(t * 0.6);
            keyLight.position.z = 40 * Math.sin(t * 0.6);
            
            renderer.setSize(container.clientWidth, container.clientHeight);
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            
            renderer.render(scene, camera);
            this.animationFrames.set('heroConstellation', requestAnimationFrame(animate));
        };
        
        this.animationFrames.set('heroConstellation', requestAnimationFrame(animate));
    }
    
    /**
     * 2) Live Flow Field - GPU-feel particle intelligence
     */
    initLiveFlowField() {
        const container = document.querySelector('#liveFlow') || this.createContainer('liveFlow', 'analytics');
        if (!container) return;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 1000);
        camera.position.set(0, 0, 50);
        
        // Store references
        this.scenes.set('liveFlow', scene);
        this.renderers.set('liveFlow', renderer);
        this.cameras.set('liveFlow', camera);
        
        // Particle geometry
        const N = this.performanceMode === 'high' ? 12000 : 
                  this.performanceMode === 'medium' ? 6000 : 3000;
        
        const pGeo = new THREE.BufferGeometry();
        const pos = new Float32Array(N * 3);
        const vel = new Float32Array(N * 3);
        const col = new Float32Array(N * 3);
        
        for (let i = 0; i < N; i++) {
            pos[3 * i + 0] = THREE.MathUtils.randFloatSpread(60);
            pos[3 * i + 1] = THREE.MathUtils.randFloatSpread(30);
            pos[3 * i + 2] = THREE.MathUtils.randFloatSpread(10);
            vel[3 * i + 0] = THREE.MathUtils.randFloatSpread(0.1);
            vel[3 * i + 1] = THREE.MathUtils.randFloatSpread(0.1);
            vel[3 * i + 2] = THREE.MathUtils.randFloatSpread(0.1);
            
            const isAccent = Math.random() < 0.15;
            const c = isAccent ? new THREE.Color(0xBF5700) : new THREE.Color(0x00bcd4);
            c.toArray(col, 3 * i);
        }
        
        pGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
        pGeo.setAttribute('velocity', new THREE.BufferAttribute(vel, 3));
        pGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
        
        const pMat = new THREE.PointsMaterial({
            size: 1.6,
            vertexColors: true,
            transparent: true,
            opacity: 0.85
        });
        const points = new THREE.Points(pGeo, pMat);
        scene.add(points);
        
        // Curl-noise flow function
        const curl = (x, y, z) => {
            const s = 0.015;
            x *= s; y *= s; z *= s;
            const nx = Math.sin(y) - Math.cos(z);
            const ny = Math.sin(z) - Math.cos(x);
            const nz = Math.sin(x) - Math.cos(y);
            return new THREE.Vector3(nx, ny, nz);
        };
        
        const step = () => {
            const dt = 0.016;
            const P = pGeo.attributes.position.array;
            const V = pGeo.attributes.velocity.array;
            
            for (let i = 0; i < N; i++) {
                const ii = 3 * i;
                const C = curl(P[ii], P[ii + 1], P[ii + 2]).multiplyScalar(0.7);
                V[ii] += C.x * dt; V[ii + 1] += C.y * dt; V[ii + 2] += C.z * dt;
                P[ii] += V[ii]; P[ii + 1] += V[ii + 1]; P[ii + 2] += V[ii + 2];
                
                // Wrap boundaries
                if (P[ii] > 32) P[ii] -= 64; if (P[ii] < -32) P[ii] += 64;
                if (P[ii + 1] > 18) P[ii + 1] -= 36; if (P[ii + 1] < -18) P[ii + 1] += 36;
            }
            pGeo.attributes.position.needsUpdate = true;
        };
        
        const loop = () => {
            if (document.hidden) return;
            
            step();
            renderer.setSize(container.clientWidth, container.clientHeight);
            camera.aspect = container.clientWidth / container.clientHeight;
            camera.updateProjectionMatrix();
            scene.rotation.y += 0.001;
            renderer.render(scene, camera);
            this.animationFrames.set('liveFlow', requestAnimationFrame(loop));
        };
        
        this.animationFrames.set('liveFlow', requestAnimationFrame(loop));
    }
    
    /**
     * 3) Metric Rings - KPI torus visualization
     */
    initMetricRings() {
        const container = document.querySelector('#metricRings') || this.createContainer('metricRings', 'stats-section', 'small');
        if (!container) return;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.z = 7;
        
        // Store references
        this.scenes.set('metricRings', scene);
        this.renderers.set('metricRings', renderer);
        this.cameras.set('metricRings', camera);
        
        scene.add(new THREE.AmbientLight(0x203040, 0.8));
        const light = new THREE.PointLight(0xBF5700, 3, 50);
        light.position.set(6, 2, 8);
        scene.add(light);
        
        const createRing = (progress, color) => {
            const geo = new THREE.TorusGeometry(2, 0.2, 20, 200, Math.PI * 2 * progress);
            const mat = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.6,
                roughness: 0.25,
                emissive: color,
                emissiveIntensity: 0.2
            });
            return new THREE.Mesh(geo, mat);
        };
        
        // Demo values - these would come from real data
        const accuracy = 0.946; // 94.6%
        const latency = 0.85;   // <100ms represented as 85% of ring
        
        const accuracyRing = createRing(accuracy, 0x9BCBEB);
        const latencyRing = createRing(latency, 0xBF5700);
        latencyRing.rotation.x = Math.PI / 2;
        
        scene.add(accuracyRing);
        scene.add(latencyRing);
        
        const animate = (t) => {
            if (document.hidden) return;
            
            accuracyRing.rotation.y = t / 2000;
            latencyRing.rotation.z = -t / 2500;
            renderer.render(scene, camera);
            this.animationFrames.set('metricRings', requestAnimationFrame(animate));
        };
        
        this.animationFrames.set('metricRings', requestAnimationFrame(animate));
    }
    
    /**
     * 4) NIL Valuation Ribbon - Twisted surface visualization
     */
    initNILRibbon() {
        const container = document.querySelector('#nilRibbon') || this.createContainer('nilRibbon', 'pricing', 'tall');
        if (!container) return;
        
        const renderer = new THREE.WebGLRenderer({ antialias: true });
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);
        
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 100);
        camera.position.set(0, 1.5, 8);
        
        // Store references
        this.scenes.set('nilRibbon', scene);
        this.renderers.set('nilRibbon', renderer);
        this.cameras.set('nilRibbon', camera);
        
        scene.add(new THREE.HemisphereLight(0x88aaff, 0x080820, 0.9));
        const mat = new THREE.MeshPhysicalMaterial({
            color: 0x9BCBEB,
            roughness: 0.2,
            metalness: 0.6,
            emissive: 0x072b36,
            emissiveIntensity: 0.25,
            transmission: 0.05,
            clearcoat: 0.7
        });
        
        // Default values
        let followers = 120000;
        let engagement = 0.045;
        let awards = 3;
        
        const buildRibbon = () => {
            if (scene.userData.mesh) scene.remove(scene.userData.mesh);
            
            const L = Math.max(10, Math.log10(followers) * 8);     // length
            const twist = engagement * Math.PI * 8;               // total twist
            const width = 1 + engagement * 6;                     // width
            const segments = 400;
            const geo = new THREE.BufferGeometry();
            const positions = new Float32Array(segments * 2 * 3);
            const indices = [];
            
            for (let i = 0; i < segments; i++) {
                const t = i / (segments - 1);
                const angle = twist * t - twist / 2;
                const x = (t - 0.5) * L;
                const w = width * (0.6 + 0.4 * Math.sin(t * 3.14)); // slight breathing
                const y = Math.sin(t * 6.28 * awards) * 0.5 * awards; // height spikes by awards
                
                // Two edge points
                positions.set([x, y + w / 2 * Math.cos(angle), w / 2 * Math.sin(angle)], i * 6);
                positions.set([x, y - w / 2 * Math.cos(angle), -w / 2 * Math.sin(angle)], i * 6 + 3);
                
                if (i < segments - 1) {
                    const a = 2 * i, b = 2 * i + 1, c = 2 * i + 2, d = 2 * i + 3;
                    indices.push(a, b, c, b, d, c);
                }
            }
            
            geo.setIndex(indices);
            geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
            geo.computeVertexNormals();
            const mesh = new THREE.Mesh(geo, mat);
            scene.add(mesh);
            scene.userData.mesh = mesh;
        };
        
        buildRibbon();
        
        const animate = (t) => {
            if (document.hidden) return;
            
            if (scene.userData.mesh) {
                scene.userData.mesh.rotation.y = t / 3000;
            }
            renderer.render(scene, camera);
            this.animationFrames.set('nilRibbon', requestAnimationFrame(animate));
        };
        
        this.animationFrames.set('nilRibbon', requestAnimationFrame(animate));
        
        // Expose update function globally
        window.updateNILRibbon = (f, e, a) => {
            followers = f; engagement = e; awards = a;
            buildRibbon();
        };
    }
    
    /**
     * 5) Holographic Player Cards
     */
    initHolographicPlayerCards() {
        const container = document.querySelector('#playerCards') || this.createPlayerCardsContainer();
        if (!container) return;
        
        const playerData = [
            { name: 'Marcus Johnson', pos: 'QB', speed: 88, acc: 92, pow: 85, sta: 90 },
            { name: 'David Williams', pos: 'RB', speed: 95, acc: 78, pow: 82, sta: 88 },
            { name: 'James Miller', pos: 'WR', speed: 93, acc: 85, pow: 75, sta: 86 },
            { name: 'Robert Davis', pos: 'LB', speed: 82, acc: 80, pow: 92, sta: 85 }
        ];
        
        playerData.forEach(data => {
            const cardDiv = document.createElement('div');
            cardDiv.innerHTML = `
                <div class="holographic-card">
                    <svg class="card-glow" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <defs>
                            <linearGradient id="cardGrad${data.name.replace(' ', '')}" x1="0" y1="0" x2="1" y2="1">
                                <stop offset="0%" stop-color="#9BCBEB"/>
                                <stop offset="100%" stop-color="#BF5700"/>
                            </linearGradient>
                        </defs>
                        <rect x="1.5" y="1.5" width="97" height="97" rx="8" ry="8" 
                              fill="none" stroke="url(#cardGrad${data.name.replace(' ', '')})" stroke-width="1.5">
                        </rect>
                    </svg>
                    <div class="card-content">
                        <h4>${data.name} <small>${data.pos}</small></h4>
                        <div class="stat-row"><span>Speed</span><b>${data.speed}</b></div>
                        <div class="stat-row"><span>Accuracy</span><b>${data.acc}</b></div>
                        <div class="stat-row"><span>Power</span><b>${data.pow}</b></div>
                        <div class="stat-row"><span>Stamina</span><b>${data.sta}</b></div>
                    </div>
                </div>`;
            container.appendChild(cardDiv);
        });
        
        // Add holographic card styles
        this.addHolographicCardStyles();
    }
    
    /**
     * 6) Biomech Pose Lines overlay
     */
    initBiomechPoseOverlay() {
        const canvas = document.querySelector('#poseOverlay') || this.createPoseOverlayCanvas();
        if (!canvas) return;
        
        const ctx = canvas.getContext('2d');
        
        const resize = () => {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        };
        
        window.addEventListener('resize', resize);
        resize();
        
        // Pose connection links (MediaPipe/OpenPose standard)
        const links = [
            [11, 13], [13, 15], [12, 14], [14, 16], [11, 12], [23, 24],
            [11, 23], [12, 24], [23, 25], [25, 27], [24, 26], [26, 28]
        ];
        
        let smooth = Array(33).fill().map(() => ({ x: 0, y: 0, px: 0, py: 0 }));
        
        // Global function to draw poses
        window.drawPose = (keypoints) => {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.lineWidth = 3;
            ctx.globalCompositeOperation = 'lighter';
            
            // Spring smoothing
            for (let i = 0; i < keypoints.length; i++) {
                const k = keypoints[i];
                if (!k || k.visibility < 0.3) continue;
                
                const sx = k.x * canvas.width;
                const sy = k.y * canvas.height;
                const p = smooth[i];
                p.px = (p.px * 0.7 + sx * 0.3);
                p.py = (p.py * 0.7 + sy * 0.3);
                p.x = p.px;
                p.y = p.py;
            }
            
            // Draw bones
            ctx.strokeStyle = '#9BCBEB55';
            links.forEach(([a, b]) => {
                const A = smooth[a], B = smooth[b];
                if (!A || !B) return;
                ctx.beginPath();
                ctx.moveTo(A.x, A.y);
                ctx.lineTo(B.x, B.y);
                ctx.stroke();
            });
            
            // Draw joints with glow
            for (let i = 0; i < smooth.length; i++) {
                const p = smooth[i];
                ctx.fillStyle = i % 2 ? '#BF5700AA' : '#00BCD4AA';
                ctx.beginPath();
                ctx.arc(p.x, p.y, i % 2 ? 4 : 3, 0, Math.PI * 2);
                ctx.fill();
            }
        };
    }
    
    // Helper methods
    createContainer(id, parentSelector, sizeClass = '') {
        const parent = document.querySelector(`.${parentSelector}`) || document.querySelector(`#${parentSelector}`);
        if (!parent) return null;
        
        const container = document.createElement('div');
        container.id = id;
        container.className = `viz ${sizeClass}`;
        container.style.cssText = `
            position: relative;
            width: 100%;
            height: ${sizeClass === 'small' ? '30vh' : sizeClass === 'tall' ? '60vh' : '52vh'};
            background: #0B0B0F;
            margin: 1rem 0;
            border-radius: 8px;
            overflow: hidden;
        `;
        parent.appendChild(container);
        return container;
    }
    
    createPlayerCardsContainer() {
        const section = document.querySelector('#features') || document.querySelector('.section');
        if (!section) return null;
        
        const container = document.createElement('div');
        container.id = 'playerCards';
        container.className = 'card-row';
        container.style.cssText = `
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
            gap: 16px;
            margin: 2rem 0;
        `;
        section.appendChild(container);
        return container;
    }
    
    createPoseOverlayCanvas() {
        const canvas = document.createElement('canvas');
        canvas.id = 'poseOverlay';
        canvas.className = 'viz-overlay';
        canvas.style.cssText = `
            position: fixed;
            inset: 0;
            pointer-events: none;
            mix-blend-mode: screen;
            z-index: 100;
        `;
        document.body.appendChild(canvas);
        return canvas;
    }
    
    addHolographicCardStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .holographic-card {
                height: 200px;
                border-radius: 16px;
                background: linear-gradient(180deg, #0F172A, #0B0B0F);
                position: relative;
                overflow: hidden;
                transition: transform 0.3s ease, box-shadow 0.3s ease;
            }
            .holographic-card:hover {
                transform: translateY(-5px);
                box-shadow: 0 10px 30px rgba(191, 87, 0, 0.3);
            }
            .card-glow {
                position: absolute;
                inset: 0;
                filter: drop-shadow(0 0 6px #00BCD4) drop-shadow(0 0 10px #BF5700);
                opacity: 0.7;
                transition: opacity 0.3s ease;
            }
            .holographic-card:hover .card-glow {
                opacity: 1;
            }
            .card-content {
                position: absolute;
                inset: 10px 12px;
                color: #E5E7EB;
                font-family: 'Inter', system-ui;
            }
            .card-content h4 {
                margin: 0 0 8px;
                font-weight: 800;
                color: #9BCBEB;
            }
            .card-content h4 small {
                opacity: 0.6;
                font-weight: 600;
                margin-left: 6px;
                color: #BF5700;
            }
            .stat-row {
                display: flex;
                justify-content: space-between;
                opacity: 0.9;
                margin-bottom: 4px;
            }
            .stat-row b {
                color: #BF5700;
                font-weight: 700;
            }
        `;
        document.head.appendChild(style);
    }
    
    // Performance and lifecycle management
    pauseAnimations() {
        this.animationFrames.forEach((frameId, key) => {
            cancelAnimationFrame(frameId);
        });
    }
    
    resumeAnimations() {
        if (this.isInitialized) {
            this.init(); // Re-initialize animations
        }
    }
    
    resize() {
        this.renderers.forEach((renderer, key) => {
            const container = renderer.domElement.parentElement;
            if (container) {
                renderer.setSize(container.clientWidth, container.clientHeight);
                const camera = this.cameras.get(key);
                if (camera) {
                    camera.aspect = container.clientWidth / container.clientHeight;
                    camera.updateProjectionMatrix();
                }
            }
        });
    }
    
    dispose() {
        // Clean up all resources
        this.pauseAnimations();
        
        this.renderers.forEach(renderer => {
            renderer.dispose();
        });
        
        this.scenes.forEach(scene => {
            scene.traverse((object) => {
                if (object.geometry) object.geometry.dispose();
                if (object.material) {
                    if (Array.isArray(object.material)) {
                        object.material.forEach(material => material.dispose());
                    } else {
                        object.material.dispose();
                    }
                }
            });
        });
        
        // Clear maps
        this.scenes.clear();
        this.renderers.clear();
        this.cameras.clear();
        this.animationFrames.clear();
        
        // Remove event listeners
        window.removeEventListener('resize', this.resize);
    }
}

// Initialize when script loads
const blazeVisuals = new BlazeUltimateVisuals();

// Export for global access
window.BlazeUltimateVisuals = BlazeUltimateVisuals;
window.blazeVisuals = blazeVisuals;