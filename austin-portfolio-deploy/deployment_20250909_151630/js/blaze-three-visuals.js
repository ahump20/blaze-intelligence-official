/**
 * Blaze Intelligence Three.js Visual Engine
 * Professional-tier 3D visualizations for sports analytics
 */

class BlazeThreeVisuals {
    constructor() {
        this.scenes = {};
        this.renderers = {};
        this.cameras = {};
        this.animationFrames = {};
        this.particles = {};
        this.meshes = {};
        this.uniforms = {};
    }

    /**
     * Initialize Hero Header with 3D particle field
     */
    initHeroHeader(containerId, options = {}) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true,
            powerPreference: "high-performance"
        });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        container.appendChild(renderer.domElement);

        // Store references
        this.scenes[containerId] = scene;
        this.renderers[containerId] = renderer;
        this.cameras[containerId] = camera;

        // Create particle system for hero background
        const particleCount = options.particleCount || 2000;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        const sizes = new Float32Array(particleCount);

        // Blaze Intelligence color palette
        const blazeColors = [
            new THREE.Color(0xBF5700), // Burnt orange
            new THREE.Color(0x00FFFF), // Neon blue
            new THREE.Color(0xFF8C00), // Neon orange
            new THREE.Color(0x00FF00)  // Neon green
        ];

        for (let i = 0; i < particleCount; i++) {
            positions[i * 3] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 1] = (Math.random() - 0.5) * 100;
            positions[i * 3 + 2] = (Math.random() - 0.5) * 50;

            const color = blazeColors[Math.floor(Math.random() * blazeColors.length)];
            colors[i * 3] = color.r;
            colors[i * 3 + 1] = color.g;
            colors[i * 3 + 2] = color.b;

            sizes[i] = Math.random() * 2 + 0.5;
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1));

        // Custom shader material for glowing particles
        const shaderMaterial = new THREE.ShaderMaterial({
            uniforms: {
                time: { value: 0 },
                pixelRatio: { value: renderer.getPixelRatio() }
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
                    pos.y += sin(time + position.x * 0.1) * 0.5;
                    pos.x += cos(time + position.y * 0.1) * 0.5;
                    
                    vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
                    gl_Position = projectionMatrix * mvPosition;
                    gl_PointSize = size * pixelRatio * (300.0 / -mvPosition.z);
                }
            `,
            fragmentShader: `
                varying vec3 vColor;
                
                void main() {
                    float r = distance(gl_PointCoord, vec2(0.5, 0.5));
                    if (r > 0.5) discard;
                    
                    float opacity = 1.0 - smoothstep(0.0, 0.5, r);
                    gl_FragColor = vec4(vColor, opacity * 0.8);
                }
            `,
            transparent: true,
            depthWrite: false,
            blending: THREE.AdditiveBlending
        });

        const particles = new THREE.Points(geometry, shaderMaterial);
        scene.add(particles);
        this.particles[containerId] = particles;
        this.uniforms[containerId] = shaderMaterial.uniforms;

        camera.position.z = 30;

        // Add interactive mouse movement
        if (options.interactive !== false) {
            this.addMouseInteraction(containerId);
        }

        // Start animation
        this.animate(containerId);

        // Handle resize
        window.addEventListener('resize', () => this.handleResize(containerId));

        return { scene, camera, renderer, particles };
    }

    /**
     * Create 3D data visualization for dashboard
     */
    createDataVisualization(containerId, data, type = 'bar') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(60, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true,
            alpha: true 
        });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(renderer.domElement);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(10, 10, 5);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        scene.add(directionalLight);

        // Create visualization based on type
        if (type === 'bar') {
            this.create3DBarChart(scene, data);
        } else if (type === 'sphere') {
            this.create3DSphereChart(scene, data);
        } else if (type === 'network') {
            this.create3DNetworkGraph(scene, data);
        }

        camera.position.set(0, 15, 30);
        camera.lookAt(0, 0, 0);

        // Add OrbitControls for interactivity
        const controls = new THREE.OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;
        controls.maxPolarAngle = Math.PI / 2;

        // Store references
        const id = `${containerId}_viz`;
        this.scenes[id] = scene;
        this.renderers[id] = renderer;
        this.cameras[id] = camera;

        // Animate
        const animate = () => {
            this.animationFrames[id] = requestAnimationFrame(animate);
            controls.update();
            renderer.render(scene, camera);
        };
        animate();

        return { scene, camera, renderer };
    }

    /**
     * Create 3D bar chart
     */
    create3DBarChart(scene, data) {
        const barWidth = 2;
        const barSpacing = 3;
        const maxValue = Math.max(...data.map(d => d.value));

        data.forEach((item, index) => {
            const height = (item.value / maxValue) * 20;
            const geometry = new THREE.BoxGeometry(barWidth, height, barWidth);
            
            // Gradient material based on value
            const color = new THREE.Color();
            color.setHSL(0.1 - (item.value / maxValue) * 0.1, 1, 0.5);
            
            const material = new THREE.MeshPhongMaterial({
                color: color,
                emissive: color,
                emissiveIntensity: 0.2,
                shininess: 100
            });

            const bar = new THREE.Mesh(geometry, material);
            bar.position.x = (index - data.length / 2) * barSpacing;
            bar.position.y = height / 2;
            bar.castShadow = true;
            bar.receiveShadow = true;

            // Add label
            if (item.label) {
                const loader = new THREE.FontLoader();
                // Note: In production, you'd load an actual font file
                // For now, we'll use a sprite for labels
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.width = 256;
                canvas.height = 64;
                context.font = '24px Inter';
                context.fillStyle = 'white';
                context.textAlign = 'center';
                context.fillText(item.label, 128, 32);

                const texture = new THREE.CanvasTexture(canvas);
                const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
                const sprite = new THREE.Sprite(spriteMaterial);
                sprite.position.set(bar.position.x, -2, bar.position.z);
                sprite.scale.set(4, 1, 1);
                scene.add(sprite);
            }

            scene.add(bar);

            // Animate bar growth
            bar.scale.y = 0;
            const growAnimation = () => {
                if (bar.scale.y < 1) {
                    bar.scale.y += 0.05;
                    requestAnimationFrame(growAnimation);
                }
            };
            setTimeout(() => growAnimation(), index * 100);
        });

        // Add ground plane
        const planeGeometry = new THREE.PlaneGeometry(50, 50);
        const planeMaterial = new THREE.ShadowMaterial({ opacity: 0.3 });
        const plane = new THREE.Mesh(planeGeometry, planeMaterial);
        plane.rotation.x = -Math.PI / 2;
        plane.position.y = -0.1;
        plane.receiveShadow = true;
        scene.add(plane);
    }

    /**
     * Create 3D sphere visualization (for player stats)
     */
    create3DSphereChart(scene, data) {
        const sphereRadius = 15;
        const pointCount = data.length;

        // Create main sphere wireframe
        const sphereGeometry = new THREE.SphereGeometry(sphereRadius, 32, 32);
        const sphereWireframe = new THREE.WireframeGeometry(sphereGeometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x00FFFF, 
            opacity: 0.2,
            transparent: true 
        });
        const sphere = new THREE.LineSegments(sphereWireframe, lineMaterial);
        scene.add(sphere);

        // Add data points on sphere surface
        data.forEach((point, index) => {
            const phi = Math.acos(-1 + (2 * index) / pointCount);
            const theta = Math.sqrt(pointCount * Math.PI) * phi;

            const x = sphereRadius * Math.cos(theta) * Math.sin(phi);
            const y = sphereRadius * Math.sin(theta) * Math.sin(phi);
            const z = sphereRadius * Math.cos(phi);

            // Create glowing point
            const pointGeometry = new THREE.SphereGeometry(0.5 + point.value * 0.1, 16, 16);
            const pointMaterial = new THREE.MeshPhongMaterial({
                color: 0xFF8C00,
                emissive: 0xFF8C00,
                emissiveIntensity: point.value / 100,
                transparent: true,
                opacity: 0.8
            });

            const pointMesh = new THREE.Mesh(pointGeometry, pointMaterial);
            pointMesh.position.set(x, y, z);
            scene.add(pointMesh);

            // Add connecting lines to center
            const lineGeometry = new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(0, 0, 0),
                new THREE.Vector3(x, y, z)
            ]);
            const connectionLine = new THREE.Line(lineGeometry, new THREE.LineBasicMaterial({
                color: 0x00FF00,
                opacity: 0.3,
                transparent: true
            }));
            scene.add(connectionLine);
        });

        // Rotate sphere continuously
        const animateSphere = () => {
            sphere.rotation.y += 0.002;
            sphere.rotation.x += 0.001;
            requestAnimationFrame(animateSphere);
        };
        animateSphere();
    }

    /**
     * Create 3D network graph (for team relationships)
     */
    create3DNetworkGraph(scene, data) {
        const nodes = data.nodes || [];
        const links = data.links || [];

        const nodePositions = {};
        const nodeMeshes = {};

        // Create nodes
        nodes.forEach((node, index) => {
            const angle = (index / nodes.length) * Math.PI * 2;
            const radius = 10 + Math.random() * 10;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            const y = (Math.random() - 0.5) * 10;

            const nodeGeometry = new THREE.SphereGeometry(node.size || 1, 32, 32);
            const nodeMaterial = new THREE.MeshPhongMaterial({
                color: node.color || 0xBF5700,
                emissive: node.color || 0xBF5700,
                emissiveIntensity: 0.3
            });

            const nodeMesh = new THREE.Mesh(nodeGeometry, nodeMaterial);
            nodeMesh.position.set(x, y, z);
            scene.add(nodeMesh);

            nodePositions[node.id] = nodeMesh.position;
            nodeMeshes[node.id] = nodeMesh;
        });

        // Create links
        links.forEach(link => {
            const sourcePos = nodePositions[link.source];
            const targetPos = nodePositions[link.target];

            if (sourcePos && targetPos) {
                const curve = new THREE.QuadraticBezierCurve3(
                    sourcePos,
                    new THREE.Vector3(
                        (sourcePos.x + targetPos.x) / 2,
                        (sourcePos.y + targetPos.y) / 2 + 5,
                        (sourcePos.z + targetPos.z) / 2
                    ),
                    targetPos
                );

                const points = curve.getPoints(50);
                const geometry = new THREE.BufferGeometry().setFromPoints(points);
                const material = new THREE.LineBasicMaterial({
                    color: 0x00FFFF,
                    opacity: 0.6,
                    transparent: true
                });

                const line = new THREE.Line(geometry, material);
                scene.add(line);
            }
        });

        // Animate nodes
        const animateNetwork = () => {
            Object.values(nodeMeshes).forEach(mesh => {
                mesh.rotation.y += 0.01;
            });
            requestAnimationFrame(animateNetwork);
        };
        animateNetwork();
    }

    /**
     * Add mouse interaction to hero header
     */
    addMouseInteraction(containerId) {
        const mouse = new THREE.Vector2();
        const raycaster = new THREE.Raycaster();

        const handleMouseMove = (event) => {
            const container = document.getElementById(containerId);
            const rect = container.getBoundingClientRect();
            mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
            mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

            if (this.cameras[containerId]) {
                this.cameras[containerId].position.x = mouse.x * 5;
                this.cameras[containerId].position.y = mouse.y * 5;
                this.cameras[containerId].lookAt(0, 0, 0);
            }
        };

        document.addEventListener('mousemove', handleMouseMove);
    }

    /**
     * Animate scene
     */
    animate(containerId) {
        this.animationFrames[containerId] = requestAnimationFrame(() => this.animate(containerId));

        if (this.uniforms[containerId]) {
            this.uniforms[containerId].time.value += 0.01;
        }

        if (this.particles[containerId]) {
            this.particles[containerId].rotation.y += 0.0005;
        }

        if (this.renderers[containerId] && this.scenes[containerId] && this.cameras[containerId]) {
            this.renderers[containerId].render(this.scenes[containerId], this.cameras[containerId]);
        }
    }

    /**
     * Handle window resize
     */
    handleResize(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const camera = this.cameras[containerId];
        const renderer = this.renderers[containerId];

        if (camera && renderer) {
            camera.aspect = container.offsetWidth / container.offsetHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(container.offsetWidth, container.offsetHeight);
        }
    }

    /**
     * Create animated logo
     */
    createAnimatedLogo(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(50, container.offsetWidth / container.offsetHeight, 0.1, 1000);
        
        const renderer = new THREE.WebGLRenderer({ 
            antialias: true, 
            alpha: true 
        });
        renderer.setSize(container.offsetWidth, container.offsetHeight);
        container.appendChild(renderer.domElement);

        // Create "B" logo geometry
        const loader = new THREE.FontLoader();
        const textGeometry = new THREE.TextGeometry('B', {
            font: 'helvetiker', // You'd load an actual font in production
            size: 10,
            height: 2,
            curveSegments: 12,
            bevelEnabled: true,
            bevelThickness: 0.5,
            bevelSize: 0.3,
            bevelSegments: 5
        });

        // Create gradient material
        const material = new THREE.MeshPhongMaterial({
            color: 0xBF5700,
            emissive: 0xFF8C00,
            emissiveIntensity: 0.3,
            shininess: 100
        });

        const mesh = new THREE.Mesh(textGeometry, material);
        mesh.position.set(-5, 0, 0);
        scene.add(mesh);

        // Add lighting
        const light1 = new THREE.PointLight(0x00FFFF, 1, 100);
        light1.position.set(10, 10, 10);
        scene.add(light1);

        const light2 = new THREE.PointLight(0xFF8C00, 1, 100);
        light2.position.set(-10, -10, 10);
        scene.add(light2);

        camera.position.z = 30;

        // Animate logo
        const animateLogo = () => {
            requestAnimationFrame(animateLogo);
            mesh.rotation.y += 0.01;
            mesh.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
            renderer.render(scene, camera);
        };
        animateLogo();

        return { scene, camera, renderer, mesh };
    }

    /**
     * Clean up resources
     */
    dispose(containerId) {
        // Cancel animation frame
        if (this.animationFrames[containerId]) {
            cancelAnimationFrame(this.animationFrames[containerId]);
        }

        // Dispose of Three.js objects
        if (this.renderers[containerId]) {
            this.renderers[containerId].dispose();
        }

        // Clean up references
        delete this.scenes[containerId];
        delete this.renderers[containerId];
        delete this.cameras[containerId];
        delete this.particles[containerId];
        delete this.uniforms[containerId];
        delete this.animationFrames[containerId];
    }
}

// Initialize on load
const blazeVisuals = new BlazeThreeVisuals();

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeThreeVisuals;
}