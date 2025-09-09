// NIL Ribbon Parametric Visualization
// Three.js parametric ribbon representing athlete marketability

class NILRibbon {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    this.options = {
      width: options.width || window.innerWidth,
      height: options.height || 400,
      colors: {
        primary: 0xBF5700,  // Burnt orange
        secondary: 0x9BCBEB, // Turquoise
        background: 0x0A192F // Dark navy
      },
      ...options
    };
    
    this.metrics = {
      followers: 10000,
      engagement: 0.5,
      awards: 3
    };
    
    this.init();
  }
  
  init() {
    // Create scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.colors.background);
    
    // Create camera
    this.camera = new THREE.PerspectiveCamera(
      75,
      this.options.width / this.options.height,
      0.1,
      1000
    );
    this.camera.position.set(0, 0, 5);
    
    // Create renderer
    this.renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true 
    });
    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.container.appendChild(this.renderer.domElement);
    
    // Add lights
    this.setupLights();
    
    // Create ribbon
    this.createRibbon();
    
    // Add orbit controls for interactivity
    this.setupControls();
    
    // Start animation
    this.animate();
    
    // Handle resize
    window.addEventListener('resize', () => this.onWindowResize());
  }
  
  setupLights() {
    // Ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
    this.scene.add(ambientLight);
    
    // Point lights for dramatic effect
    const pointLight1 = new THREE.PointLight(this.options.colors.primary, 1, 100);
    pointLight1.position.set(5, 5, 5);
    this.scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(this.options.colors.secondary, 0.8, 100);
    pointLight2.position.set(-5, -5, 5);
    this.scene.add(pointLight2);
    
    // Directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
    directionalLight.position.set(0, 1, 1);
    this.scene.add(directionalLight);
  }
  
  createRibbon() {
    // Remove old ribbon if exists
    if (this.ribbonMesh) {
      this.scene.remove(this.ribbonMesh);
      this.ribbonMesh.geometry.dispose();
      this.ribbonMesh.material.dispose();
    }
    
    // Calculate ribbon parameters based on metrics
    const length = Math.log10(this.metrics.followers) * 2; // Length based on follower count
    const twists = this.metrics.engagement * 5; // Twists based on engagement rate
    const spikes = Math.floor(this.metrics.awards); // Spikes based on awards
    
    // Create parametric geometry
    const geometry = this.createParametricGeometry(length, twists, spikes);
    
    // Create material with gradient
    const material = new THREE.MeshPhongMaterial({
      color: this.options.colors.primary,
      emissive: this.options.colors.secondary,
      emissiveIntensity: 0.2,
      shininess: 100,
      side: THREE.DoubleSide,
      vertexColors: true
    });
    
    // Create mesh
    this.ribbonMesh = new THREE.Mesh(geometry, material);
    this.scene.add(this.ribbonMesh);
    
    // Add glow effect
    this.addGlowEffect();
  }
  
  createParametricGeometry(length, twists, spikes) {
    const segments = 200;
    const width = 0.5;
    
    const vertices = [];
    const colors = [];
    const indices = [];
    
    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const angle = twists * Math.PI * 2 * t;
      
      // Parametric equations for ribbon
      const x = Math.sin(angle) * (1 + Math.sin(spikes * angle) * 0.2);
      const y = (t - 0.5) * length;
      const z = Math.cos(angle) * (1 + Math.sin(spikes * angle) * 0.2);
      
      // Create ribbon width
      const normal = new THREE.Vector3(-Math.sin(angle), 0, -Math.cos(angle));
      normal.normalize();
      
      // Left edge
      vertices.push(
        x - normal.x * width,
        y,
        z - normal.z * width
      );
      
      // Right edge
      vertices.push(
        x + normal.x * width,
        y,
        z + normal.z * width
      );
      
      // Add color gradient
      const color = new THREE.Color();
      color.setHSL(t * 0.1 + 0.05, 0.8, 0.5 + t * 0.2);
      
      colors.push(color.r, color.g, color.b);
      colors.push(color.r, color.g, color.b);
    }
    
    // Create faces
    for (let i = 0; i < segments; i++) {
      const a = i * 2;
      const b = i * 2 + 1;
      const c = (i + 1) * 2;
      const d = (i + 1) * 2 + 1;
      
      // Two triangles per segment
      indices.push(a, b, c);
      indices.push(b, d, c);
    }
    
    // Create BufferGeometry
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    
    return geometry;
  }
  
  addGlowEffect() {
    // Create glow sprite
    const spriteMaterial = new THREE.SpriteMaterial({
      map: this.createGlowTexture(),
      blending: THREE.AdditiveBlending,
      color: this.options.colors.primary,
      opacity: 0.5
    });
    
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.scale.set(4, 4, 1);
    this.ribbonMesh.add(sprite);
  }
  
  createGlowTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    
    const context = canvas.getContext('2d');
    const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
    
    gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
    gradient.addColorStop(0.2, 'rgba(191, 87, 0, 1)');
    gradient.addColorStop(0.4, 'rgba(191, 87, 0, 0.5)');
    gradient.addColorStop(1, 'rgba(191, 87, 0, 0)');
    
    context.fillStyle = gradient;
    context.fillRect(0, 0, 128, 128);
    
    const texture = new THREE.CanvasTexture(canvas);
    return texture;
  }
  
  setupControls() {
    // Simple auto-rotation for now
    this.autoRotate = true;
    
    // Mouse interaction
    this.container.addEventListener('mouseenter', () => {
      this.autoRotate = false;
    });
    
    this.container.addEventListener('mouseleave', () => {
      this.autoRotate = true;
    });
    
    // Mouse movement for manual rotation
    let mouseX = 0;
    let mouseY = 0;
    
    this.container.addEventListener('mousemove', (event) => {
      const rect = this.container.getBoundingClientRect();
      mouseX = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      mouseY = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      
      if (!this.autoRotate && this.ribbonMesh) {
        this.ribbonMesh.rotation.y = mouseX * Math.PI;
        this.ribbonMesh.rotation.x = mouseY * Math.PI * 0.5;
      }
    });
  }
  
  updateMetrics(followers, engagement, awards) {
    this.metrics = {
      followers: Math.max(1, followers),
      engagement: Math.max(0, Math.min(1, engagement)),
      awards: Math.max(0, awards)
    };
    
    // Recreate ribbon with new parameters
    this.createRibbon();
    
    // Trigger animation
    this.animateTransition();
  }
  
  animateTransition() {
    // Smooth transition animation
    const startScale = 0.8;
    const endScale = 1;
    const duration = 1000;
    const startTime = Date.now();
    
    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      
      if (this.ribbonMesh) {
        const scale = startScale + (endScale - startScale) * easeProgress;
        this.ribbonMesh.scale.set(scale, scale, scale);
        
        // Add rotation effect
        this.ribbonMesh.rotation.z = (1 - easeProgress) * Math.PI * 2;
      }
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      }
    };
    
    animate();
  }
  
  animate() {
    requestAnimationFrame(() => this.animate());
    
    // Auto-rotate ribbon
    if (this.autoRotate && this.ribbonMesh) {
      this.ribbonMesh.rotation.y += 0.005;
      this.ribbonMesh.rotation.x = Math.sin(Date.now() * 0.001) * 0.1;
    }
    
    // Pulsing glow effect
    if (this.ribbonMesh) {
      const pulse = Math.sin(Date.now() * 0.002) * 0.1 + 0.9;
      this.ribbonMesh.material.emissiveIntensity = 0.2 * pulse;
    }
    
    this.renderer.render(this.scene, this.camera);
  }
  
  onWindowResize() {
    const width = this.container.clientWidth;
    const height = this.container.clientHeight;
    
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
    
    this.renderer.setSize(width, height);
  }
  
  exportVisualization() {
    // Export current frame as image
    this.renderer.render(this.scene, this.camera);
    const dataURL = this.renderer.domElement.toDataURL('image/png');
    
    // Create download link
    const link = document.createElement('a');
    link.href = dataURL;
    link.download = `nil-ribbon-${Date.now()}.png`;
    link.click();
  }
  
  getMetricsDescription() {
    const followers = this.metrics.followers.toLocaleString();
    const engagement = (this.metrics.engagement * 100).toFixed(1);
    const awards = this.metrics.awards;
    
    return {
      followers: `${followers} followers`,
      engagement: `${engagement}% engagement rate`,
      awards: `${awards} major awards`,
      marketability: this.calculateMarketability()
    };
  }
  
  calculateMarketability() {
    // Calculate overall marketability score
    const followerScore = Math.log10(this.metrics.followers) / 7; // Normalize to 0-1 (10M max)
    const engagementScore = this.metrics.engagement;
    const awardScore = Math.min(this.metrics.awards / 10, 1); // Max 10 awards
    
    const marketability = (followerScore * 0.4 + engagementScore * 0.4 + awardScore * 0.2) * 100;
    
    return {
      score: marketability.toFixed(1),
      rating: marketability > 80 ? 'Elite' : 
              marketability > 60 ? 'High' : 
              marketability > 40 ? 'Moderate' : 'Emerging'
    };
  }
  
  destroy() {
    // Clean up Three.js resources
    if (this.ribbonMesh) {
      this.ribbonMesh.geometry.dispose();
      this.ribbonMesh.material.dispose();
    }
    
    this.renderer.dispose();
    this.container.removeChild(this.renderer.domElement);
    
    window.removeEventListener('resize', this.onWindowResize);
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = NILRibbon;
} else {
  window.NILRibbon = NILRibbon;
}