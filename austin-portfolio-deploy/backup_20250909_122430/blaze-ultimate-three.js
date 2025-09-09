// Blaze Intelligence Ultimate Three.js Visualization Engine
// Advanced 3D graphics and animations for sports analytics

class BlazeUltimateThree {
    constructor() {
        this.scenes = {};
        this.cameras = {};
        this.renderers = {};
        this.animations = {};
        this.data = {
            cardinals: { readiness: 87.3, leverage: 4.2, efficiency: 92.1, winProb: 64.8 },
            titans: { offense: 78.5, defense: 85.2, special: 91.3 },
            longhorns: { recruiting: 94.2, performance: 88.7 },
            grizzlies: { offensive: 82.1, defensive: 79.8 }
        };
        this.colors = {
            blazeOrange: 0xBF5700,
            blazeSky: 0x9BCBEB,
            blazeNavy: 0x002244,
            blazeTeal: 0x00B2A9,
            blazeGold: 0xFFD700
        };
    }

    // Initialize main hero visualization
    initHeroVisualization(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        // Setup scene
        const scene = new THREE.Scene();
        scene.fog = new THREE.Fog(0x000000, 10, 100);

        // Setup camera
        const camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        camera.position.set(0, 0, 30);

        // Setup renderer
        const renderer = new THREE.WebGLRenderer({
            canvas: container,
            alpha: true,
            antialias: true
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.2;

        // Create main sphere with data points
        const sphereGeometry = new THREE.SphereGeometry(8, 64, 64);
        const sphereMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.blazeOrange,
            emissive: this.colors.blazeOrange,
            emissiveIntensity: 0.2,
            wireframe: true,
            transparent: true,
            opacity: 0.3
        });
        const mainSphere = new THREE.Mesh(sphereGeometry, sphereMaterial);
        scene.add(mainSphere);

        // Create data points orbiting the sphere
        const dataPoints = new THREE.Group();
        const pointGeometry = new THREE.SphereGeometry(0.3, 16, 16);
        
        for (let i = 0; i < 50; i++) {
            const theta = Math.random() * Math.PI * 2;
            const phi = Math.random() * Math.PI;
            const radius = 10 + Math.random() * 5;
            
            const pointMaterial = new THREE.MeshPhongMaterial({
                color: Object.values(this.colors)[Math.floor(Math.random() * 5)],
                emissive: Object.values(this.colors)[Math.floor(Math.random() * 5)],
                emissiveIntensity: 0.5
            });
            
            const point = new THREE.Mesh(pointGeometry, pointMaterial);
            point.position.set(
                radius * Math.sin(phi) * Math.cos(theta),
                radius * Math.sin(phi) * Math.sin(theta),
                radius * Math.cos(phi)
            );
            
            dataPoints.add(point);
        }
        scene.add(dataPoints);

        // Create particle field
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 1000;
        const posArray = new Float32Array(particlesCount * 3);
        
        for (let i = 0; i < particlesCount * 3; i++) {
            posArray[i] = (Math.random() - 0.5) * 100;
        }
        
        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(posArray, 3));
        const particlesMaterial = new THREE.PointsMaterial({
            size: 0.1,
            color: this.colors.blazeSky,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending
        });
        
        const particlesMesh = new THREE.Points(particlesGeometry, particlesMaterial);
        scene.add(particlesMesh);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
        scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(10, 10, 10);
        scene.add(directionalLight);

        const pointLight = new THREE.PointLight(this.colors.blazeOrange, 2, 100);
        pointLight.position.set(0, 0, 0);
        scene.add(pointLight);

        // Create rotating rings
        const ringGeometry = new THREE.TorusGeometry(12, 0.5, 16, 100);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: this.colors.blazeTeal,
            emissive: this.colors.blazeTeal,
            emissiveIntensity: 0.3,
            transparent: true,
            opacity: 0.6
        });
        
        const ring1 = new THREE.Mesh(ringGeometry, ringMaterial);
        const ring2 = new THREE.Mesh(ringGeometry, ringMaterial.clone());
        const ring3 = new THREE.Mesh(ringGeometry, ringMaterial.clone());
        
        ring2.rotation.x = Math.PI / 3;
        ring3.rotation.x = -Math.PI / 3;
        
        scene.add(ring1);
        scene.add(ring2);
        scene.add(ring3);

        // Store references
        this.scenes.hero = scene;
        this.cameras.hero = camera;
        this.renderers.hero = renderer;

        // Animation loop
        const animate = () => {
            requestAnimationFrame(animate);

            // Rotate main sphere
            mainSphere.rotation.y += 0.003;
            mainSphere.rotation.x += 0.001;

            // Rotate data points
            dataPoints.rotation.y += 0.005;
            dataPoints.rotation.z += 0.002;

            // Rotate rings
            ring1.rotation.z += 0.01;
            ring2.rotation.z -= 0.008;
            ring3.rotation.z += 0.006;

            // Animate particles
            particlesMesh.rotation.y += 0.001;

            // Pulse effect for main sphere
            const pulse = Math.sin(Date.now() * 0.001) * 0.1;
            mainSphere.scale.set(1 + pulse, 1 + pulse, 1 + pulse);

            // Render
            renderer.render(scene, camera);
        };

        animate();

        // Handle resize
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }

    // Create player biomechanics visualization
    createBiomechanicsViz(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // Create skeletal structure
        const bodyParts = {
            head: new THREE.Mesh(
                new THREE.SphereGeometry(0.5, 16, 16),
                new THREE.MeshPhongMaterial({ color: this.colors.blazeTeal })
            ),
            torso: new THREE.Mesh(
                new THREE.BoxGeometry(1, 2, 0.5),
                new THREE.MeshPhongMaterial({ color: this.colors.blazeSky })
            ),
            leftArm: new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 1.5),
                new THREE.MeshPhongMaterial({ color: this.colors.blazeOrange })
            ),
            rightArm: new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 1.5),
                new THREE.MeshPhongMaterial({ color: this.colors.blazeOrange })
            ),
            leftLeg: new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 2),
                new THREE.MeshPhongMaterial({ color: this.colors.blazeNavy })
            ),
            rightLeg: new THREE.Mesh(
                new THREE.CylinderGeometry(0.25, 0.25, 2),
                new THREE.MeshPhongMaterial({ color: this.colors.blazeNavy })
            )
        };

        // Position body parts
        bodyParts.head.position.y = 2;
        bodyParts.torso.position.y = 0;
        bodyParts.leftArm.position.set(-1, 0.5, 0);
        bodyParts.rightArm.position.set(1, 0.5, 0);
        bodyParts.leftLeg.position.set(-0.3, -2, 0);
        bodyParts.rightLeg.position.set(0.3, -2, 0);

        // Add all parts to scene
        Object.values(bodyParts).forEach(part => scene.add(part));

        // Create motion tracking points
        const trackingPoints = [];
        const pointGeometry = new THREE.SphereGeometry(0.1, 8, 8);
        
        for (let i = 0; i < 15; i++) {
            const point = new THREE.Mesh(
                pointGeometry,
                new THREE.MeshBasicMaterial({
                    color: this.colors.blazeGold,
                    emissive: this.colors.blazeGold
                })
            );
            point.position.set(
                Math.random() * 4 - 2,
                Math.random() * 4 - 2,
                Math.random() * 2 - 1
            );
            trackingPoints.push(point);
            scene.add(point);
        }

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        camera.position.z = 8;

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);

            // Simulate running motion
            const time = Date.now() * 0.001;
            
            bodyParts.leftArm.rotation.x = Math.sin(time * 3) * 0.5;
            bodyParts.rightArm.rotation.x = -Math.sin(time * 3) * 0.5;
            bodyParts.leftLeg.rotation.x = -Math.sin(time * 3) * 0.3;
            bodyParts.rightLeg.rotation.x = Math.sin(time * 3) * 0.3;
            
            // Animate tracking points
            trackingPoints.forEach((point, i) => {
                point.position.y += Math.sin(time + i) * 0.01;
                point.material.opacity = 0.5 + Math.sin(time * 2 + i) * 0.5;
            });

            renderer.render(scene, camera);
        };

        animate();
    }

    // Create data flow visualization
    createDataFlowViz(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // Create data flow tubes
        const tubeRadius = 0.2;
        const tubeSegments = 100;
        const curves = [];
        
        for (let i = 0; i < 5; i++) {
            const curve = new THREE.CatmullRomCurve3([
                new THREE.Vector3(-5, Math.random() * 4 - 2, 0),
                new THREE.Vector3(-2, Math.random() * 4 - 2, Math.random() * 2),
                new THREE.Vector3(2, Math.random() * 4 - 2, Math.random() * 2),
                new THREE.Vector3(5, Math.random() * 4 - 2, 0)
            ]);
            
            const tubeGeometry = new THREE.TubeGeometry(curve, tubeSegments, tubeRadius, 8, false);
            const tubeMaterial = new THREE.MeshPhongMaterial({
                color: Object.values(this.colors)[i % 5],
                emissive: Object.values(this.colors)[i % 5],
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.7
            });
            
            const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
            scene.add(tube);
            curves.push({ mesh: tube, curve: curve });
        }

        // Create data packets
        const packets = [];
        const packetGeometry = new THREE.SphereGeometry(0.3, 8, 8);
        
        curves.forEach((curveObj, index) => {
            const packet = new THREE.Mesh(
                packetGeometry,
                new THREE.MeshPhongMaterial({
                    color: 0xffffff,
                    emissive: Object.values(this.colors)[index % 5],
                    emissiveIntensity: 0.8
                })
            );
            packets.push({ mesh: packet, curve: curveObj.curve, progress: Math.random() });
            scene.add(packet);
        });

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        scene.add(directionalLight);

        camera.position.z = 10;
        camera.position.y = 2;

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);

            // Move data packets along curves
            packets.forEach(packet => {
                packet.progress += 0.01;
                if (packet.progress > 1) packet.progress = 0;
                
                const point = packet.curve.getPoint(packet.progress);
                packet.mesh.position.copy(point);
                
                // Pulse effect
                const scale = 1 + Math.sin(Date.now() * 0.01 + packet.progress * Math.PI * 2) * 0.2;
                packet.mesh.scale.set(scale, scale, scale);
            });

            renderer.render(scene, camera);
        };

        animate();
    }

    // Create real-time metrics visualization
    createMetricsViz(containerId, metricType = 'cardinals') {
        const container = document.getElementById(containerId);
        if (!container) return;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
            60,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
        
        renderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(renderer.domElement);

        // Create metric bars
        const metrics = this.data[metricType];
        const bars = [];
        let index = 0;
        
        for (const [key, value] of Object.entries(metrics)) {
            const height = value / 20;
            const barGeometry = new THREE.BoxGeometry(1, height, 1);
            const barMaterial = new THREE.MeshPhongMaterial({
                color: Object.values(this.colors)[index % 5],
                emissive: Object.values(this.colors)[index % 5],
                emissiveIntensity: 0.3
            });
            
            const bar = new THREE.Mesh(barGeometry, barMaterial);
            bar.position.x = (index - 1.5) * 2;
            bar.position.y = height / 2;
            bars.push({ mesh: bar, targetHeight: height, currentHeight: 0 });
            scene.add(bar);
            
            index++;
        }

        // Add grid
        const gridHelper = new THREE.GridHelper(10, 10, 0x444444, 0x222222);
        scene.add(gridHelper);

        // Add lighting
        const ambientLight = new THREE.AmbientLight(0x404040);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 10, 5);
        scene.add(directionalLight);

        camera.position.set(0, 5, 10);
        camera.lookAt(0, 2, 0);

        // Animation
        const animate = () => {
            requestAnimationFrame(animate);

            // Animate bars growing
            bars.forEach(bar => {
                if (bar.currentHeight < bar.targetHeight) {
                    bar.currentHeight += 0.05;
                    bar.mesh.scale.y = bar.currentHeight / bar.targetHeight;
                    bar.mesh.position.y = (bar.currentHeight * bar.targetHeight) / 2;
                }
                
                // Pulse effect
                const pulse = 1 + Math.sin(Date.now() * 0.005) * 0.05;
                bar.mesh.scale.x = pulse;
                bar.mesh.scale.z = pulse;
            });

            renderer.render(scene, camera);
        };

        animate();
    }

    // Update live data
    updateLiveData(newData) {
        Object.assign(this.data, newData);
        // Trigger re-render of affected visualizations
    }

    // Initialize all visualizations
    initAll() {
        // Hero visualization
        if (document.getElementById('hero-canvas')) {
            this.initHeroVisualization('hero-canvas');
        }
        
        // Vision AI demo
        if (document.getElementById('vision-ai-demo')) {
            this.createBiomechanicsViz('vision-ai-demo');
        }
        
        // Additional visualizations can be initialized here
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.blazeUltimateThree = new BlazeUltimateThree();
    window.blazeUltimateThree.initAll();
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeUltimateThree;
}