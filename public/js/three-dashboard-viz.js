// Three.js Dashboard Visualization for Sports Analytics
// Interactive 3D data visualization with real-time updates

class DashboardVisualization {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        
        this.data = {
            teams: [],
            players: [],
            metrics: []
        };
        
        this.init();
        this.animate();
        this.setupDataStreaming();
    }

    init() {
        // Scene setup
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a14);

        // Camera
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.container.clientWidth / this.container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 30, 50);
        this.camera.lookAt(0, 0, 0);

        // Renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.container.appendChild(this.renderer.domElement);

        // Controls
        if (typeof THREE.OrbitControls !== 'undefined') {
            this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.maxDistance = 100;
            this.controls.minDistance = 20;
        }

        // Create visualization elements
        this.createField();
        this.createDataPoints();
        this.createMetricBars();
        this.setupLighting();

        // Handle resize
        window.addEventListener('resize', () => this.handleResize());
    }

    createField() {
        // Create a stylized sports field
        const fieldGeometry = new THREE.PlaneGeometry(80, 50);
        const fieldMaterial = new THREE.MeshStandardMaterial({
            color: 0x0f3d0f,
            roughness: 0.8,
            metalness: 0.2
        });
        this.field = new THREE.Mesh(fieldGeometry, fieldMaterial);
        this.field.rotation.x = -Math.PI / 2;
        this.field.receiveShadow = true;
        this.scene.add(this.field);

        // Add field lines
        const lineMaterial = new THREE.LineBasicMaterial({ color: 0xffffff, opacity: 0.5, transparent: true });
        
        // Center line
        const centerLineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-40, 0.1, 0),
            new THREE.Vector3(40, 0.1, 0)
        ]);
        const centerLine = new THREE.Line(centerLineGeometry, lineMaterial);
        this.scene.add(centerLine);

        // Goal areas
        const goalBoxGeometry = new THREE.BoxGeometry(10, 0.1, 20);
        const goalBoxMaterial = new THREE.MeshBasicMaterial({
            color: 0xBF5700,
            opacity: 0.3,
            transparent: true
        });
        
        const leftGoal = new THREE.Mesh(goalBoxGeometry, goalBoxMaterial);
        leftGoal.position.set(-35, 0.1, 0);
        this.scene.add(leftGoal);
        
        const rightGoal = new THREE.Mesh(goalBoxGeometry, goalBoxMaterial.clone());
        rightGoal.material.color.set(0x9BCBEB);
        rightGoal.position.set(35, 0.1, 0);
        this.scene.add(rightGoal);
    }

    createDataPoints() {
        // Create floating data points representing players/metrics
        this.dataPoints = [];
        const pointCount = 22; // 11 players per team

        for (let i = 0; i < pointCount; i++) {
            const isHomeTeam = i < 11;
            const geometry = new THREE.SphereGeometry(1, 32, 32);
            const material = new THREE.MeshPhongMaterial({
                color: isHomeTeam ? 0xBF5700 : 0x9BCBEB,
                emissive: isHomeTeam ? 0xBF5700 : 0x9BCBEB,
                emissiveIntensity: 0.3,
                transparent: true,
                opacity: 0.9
            });
            
            const point = new THREE.Mesh(geometry, material);
            const side = isHomeTeam ? -1 : 1;
            point.position.set(
                side * (Math.random() * 30 + 5),
                Math.random() * 5 + 2,
                (Math.random() - 0.5) * 20
            );
            
            point.castShadow = true;
            point.userData = {
                isHomeTeam,
                velocity: new THREE.Vector3(
                    (Math.random() - 0.5) * 0.1,
                    (Math.random() - 0.5) * 0.05,
                    (Math.random() - 0.5) * 0.1
                ),
                metric: Math.random() * 100
            };
            
            // Add glow effect
            const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
            const glowMaterial = new THREE.MeshBasicMaterial({
                color: isHomeTeam ? 0xBF5700 : 0x9BCBEB,
                transparent: true,
                opacity: 0.2
            });
            const glow = new THREE.Mesh(glowGeometry, glowMaterial);
            point.add(glow);
            
            this.dataPoints.push(point);
            this.scene.add(point);
        }

        // Create connections between data points
        this.updateConnections();
    }

    updateConnections() {
        // Remove old connections
        if (this.connectionLines) {
            this.connectionLines.forEach(line => this.scene.remove(line));
        }
        this.connectionLines = [];

        // Create new connections based on proximity
        const maxDistance = 15;
        
        for (let i = 0; i < this.dataPoints.length; i++) {
            for (let j = i + 1; j < this.dataPoints.length; j++) {
                const p1 = this.dataPoints[i];
                const p2 = this.dataPoints[j];
                
                // Only connect same team
                if (p1.userData.isHomeTeam !== p2.userData.isHomeTeam) continue;
                
                const distance = p1.position.distanceTo(p2.position);
                
                if (distance < maxDistance) {
                    const geometry = new THREE.BufferGeometry().setFromPoints([
                        p1.position,
                        p2.position
                    ]);
                    
                    const opacity = 1 - (distance / maxDistance);
                    const material = new THREE.LineBasicMaterial({
                        color: p1.userData.isHomeTeam ? 0xBF5700 : 0x9BCBEB,
                        opacity: opacity * 0.3,
                        transparent: true
                    });
                    
                    const line = new THREE.Line(geometry, material);
                    this.connectionLines.push(line);
                    this.scene.add(line);
                }
            }
        }
    }

    createMetricBars() {
        // Create 3D bar chart for metrics
        this.metricBars = [];
        const barCount = 8;
        const barSpacing = 8;
        
        for (let i = 0; i < barCount; i++) {
            const height = Math.random() * 15 + 5;
            const geometry = new THREE.BoxGeometry(3, height, 3);
            const material = new THREE.MeshPhongMaterial({
                color: new THREE.Color().setHSL((i / barCount) * 0.15, 0.8, 0.5),
                emissive: new THREE.Color().setHSL((i / barCount) * 0.15, 0.8, 0.3),
                emissiveIntensity: 0.2
            });
            
            const bar = new THREE.Mesh(geometry, material);
            bar.position.set(
                -28 + i * barSpacing,
                height / 2,
                -30
            );
            bar.castShadow = true;
            bar.receiveShadow = true;
            
            bar.userData = {
                targetHeight: height,
                currentHeight: 0,
                speed: Math.random() * 0.02 + 0.01
            };
            
            this.metricBars.push(bar);
            this.scene.add(bar);
        }
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);

        // Directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(30, 50, 20);
        directionalLight.castShadow = true;
        directionalLight.shadow.camera.left = -50;
        directionalLight.shadow.camera.right = 50;
        directionalLight.shadow.camera.top = 50;
        directionalLight.shadow.camera.bottom = -50;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        this.scene.add(directionalLight);

        // Point lights for accent
        const pointLight1 = new THREE.PointLight(0xBF5700, 0.5, 50);
        pointLight1.position.set(-30, 20, 0);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0x9BCBEB, 0.5, 50);
        pointLight2.position.set(30, 20, 0);
        this.scene.add(pointLight2);

        // Spot light for dramatic effect
        const spotLight = new THREE.SpotLight(0xffffff, 0.5);
        spotLight.position.set(0, 40, 0);
        spotLight.angle = Math.PI / 6;
        spotLight.penumbra = 0.2;
        spotLight.castShadow = true;
        this.scene.add(spotLight);
    }

    setupDataStreaming() {
        // Simulate real-time data updates
        setInterval(() => {
            // Update metric bars
            this.metricBars.forEach(bar => {
                bar.userData.targetHeight = Math.random() * 15 + 5;
            });

            // Update data point metrics
            this.dataPoints.forEach(point => {
                point.userData.metric = Math.random() * 100;
                const intensity = point.userData.metric / 100;
                point.material.emissiveIntensity = 0.3 + intensity * 0.4;
            });
        }, 3000);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const time = Date.now() * 0.001;

        // Animate data points
        this.dataPoints.forEach((point, index) => {
            // Float animation
            point.position.y = 2 + Math.sin(time + index) * 1;
            
            // Rotation
            point.rotation.y = time * 0.5;
            
            // Move within boundaries
            point.position.add(point.userData.velocity);
            
            // Bounce off boundaries
            const side = point.userData.isHomeTeam ? -1 : 1;
            const minX = side * 35;
            const maxX = side * 5;
            
            if (side === -1) {
                if (point.position.x < minX) point.userData.velocity.x = Math.abs(point.userData.velocity.x);
                if (point.position.x > maxX) point.userData.velocity.x = -Math.abs(point.userData.velocity.x);
            } else {
                if (point.position.x > minX) point.userData.velocity.x = -Math.abs(point.userData.velocity.x);
                if (point.position.x < maxX) point.userData.velocity.x = Math.abs(point.userData.velocity.x);
            }
            
            if (Math.abs(point.position.z) > 20) {
                point.userData.velocity.z *= -1;
            }
            
            // Pulse based on metric
            const scale = 1 + Math.sin(time * 2 + index) * 0.1 * (point.userData.metric / 100);
            point.scale.setScalar(scale);
        });

        // Update connections periodically
        if (Math.floor(time) % 2 === 0 && !this.connectionsUpdated) {
            this.updateConnections();
            this.connectionsUpdated = true;
        } else if (Math.floor(time) % 2 !== 0) {
            this.connectionsUpdated = false;
        }

        // Animate metric bars
        this.metricBars.forEach((bar, index) => {
            const currentHeight = bar.geometry.parameters.height;
            const targetHeight = bar.userData.targetHeight;
            
            if (Math.abs(currentHeight - targetHeight) > 0.1) {
                const newHeight = currentHeight + (targetHeight - currentHeight) * 0.05;
                bar.geometry.dispose();
                bar.geometry = new THREE.BoxGeometry(3, newHeight, 3);
                bar.position.y = newHeight / 2;
                
                // Pulse effect
                const pulse = 1 + Math.sin(time * 3 + index) * 0.05;
                bar.scale.x = pulse;
                bar.scale.z = pulse;
            }
            
            // Rotate slowly
            bar.rotation.y = Math.sin(time * 0.5 + index) * 0.1;
        });

        // Update controls
        if (this.controls) {
            this.controls.update();
        }

        // Render
        this.renderer.render(this.scene, this.camera);
    }

    handleResize() {
        this.camera.aspect = this.container.clientWidth / this.container.clientHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(this.container.clientWidth, this.container.clientHeight);
    }

    updateData(newData) {
        // Method to update visualization with real data
        if (newData.teams) {
            this.data.teams = newData.teams;
        }
        if (newData.players) {
            this.data.players = newData.players;
        }
        if (newData.metrics) {
            this.data.metrics = newData.metrics;
            // Update metric bars with real data
            this.metricBars.forEach((bar, index) => {
                if (index < newData.metrics.length) {
                    bar.userData.targetHeight = newData.metrics[index].value * 0.2;
                }
            });
        }
    }

    destroy() {
        // Cleanup
        this.renderer.dispose();
        this.scene.clear();
        this.container.removeChild(this.renderer.domElement);
    }
}

// Initialize dashboard visualizations when ready
document.addEventListener('DOMContentLoaded', () => {
    // Create visualization containers if they don't exist
    const dashboardSections = document.querySelectorAll('.dashboard-section');
    
    dashboardSections.forEach((section, index) => {
        const vizContainer = document.createElement('div');
        vizContainer.id = `viz-container-${index}`;
        vizContainer.style.width = '100%';
        vizContainer.style.height = '400px';
        vizContainer.style.position = 'relative';
        vizContainer.style.marginTop = '2rem';
        vizContainer.style.borderRadius = '20px';
        vizContainer.style.overflow = 'hidden';
        vizContainer.classList.add('glass-card');
        
        // Only add to specific sections
        if (section.querySelector('.live-stats-card') && index === 0) {
            section.appendChild(vizContainer);
            new DashboardVisualization(`viz-container-${index}`);
        }
    });
});