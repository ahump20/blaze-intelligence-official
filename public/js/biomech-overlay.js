// Biomech Pose Overlay Module
// Real-time biomechanical analysis with privacy-first design

class BiomechOverlay {
  constructor(canvasId, options = {}) {
    this.canvas = document.getElementById(canvasId);
    this.ctx = this.canvas.getContext('2d');
    this.options = {
      width: options.width || 640,
      height: options.height || 480,
      showSkeleton: true,
      showMetrics: true,
      showFatigue: true,
      colors: {
        skeleton: '#9BCBEB',
        joints: '#BF5700',
        strain: '#FF5555',
        optimal: '#64FFDA',
        fatigued: '#FFB86C'
      },
      ...options
    };
    
    this.keypoints = [];
    this.metrics = {
      speed: 0,
      acceleration: 0,
      strideLength: 0,
      jointAngles: {},
      fatigue: 0,
      flowState: 0.5
    };
    
    this.privacyConsent = false;
    this.init();
  }
  
  init() {
    this.canvas.width = this.options.width;
    this.canvas.height = this.options.height;
    
    // Check privacy consent
    if (!this.checkConsent()) {
      this.showConsentPrompt();
      return;
    }
    
    this.startAnalysis();
  }
  
  checkConsent() {
    const consent = localStorage.getItem('consent_biometric');
    this.privacyConsent = consent === 'granted';
    return this.privacyConsent;
  }
  
  showConsentPrompt() {
    this.ctx.fillStyle = 'rgba(10, 25, 47, 0.9)';
    this.ctx.fillRect(0, 0, this.options.width, this.options.height);
    
    this.ctx.fillStyle = '#E6F1FF';
    this.ctx.font = '18px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('Biometric Analysis Requires Consent', this.options.width / 2, this.options.height / 2 - 30);
    
    this.ctx.font = '14px Inter, sans-serif';
    this.ctx.fillStyle = '#8892B0';
    this.ctx.fillText('Click to enable performance tracking', this.options.width / 2, this.options.height / 2 + 10);
    
    this.canvas.addEventListener('click', () => {
      localStorage.setItem('consent_biometric', 'granted');
      this.privacyConsent = true;
      this.startAnalysis();
    }, { once: true });
  }
  
  startAnalysis() {
    // Initialize pose detection connections
    this.connections = [
      // Head to spine
      [0, 1], [1, 2], [2, 3],
      // Left arm
      [1, 4], [4, 5], [5, 6],
      // Right arm
      [1, 7], [7, 8], [8, 9],
      // Left leg
      [3, 10], [10, 11], [11, 12],
      // Right leg
      [3, 13], [13, 14], [14, 15]
    ];
    
    this.animate();
  }
  
  updateKeypoints(keypoints) {
    if (!this.privacyConsent) return;
    
    // Smooth keypoints to reduce jitter
    if (this.keypoints.length > 0) {
      keypoints = keypoints.map((kp, i) => {
        const prev = this.keypoints[i] || kp;
        return {
          x: prev.x * 0.7 + kp.x * 0.3,
          y: prev.y * 0.7 + kp.y * 0.3,
          confidence: kp.confidence
        };
      });
    }
    
    this.keypoints = keypoints;
    this.calculateMetrics();
  }
  
  calculateMetrics() {
    if (this.keypoints.length < 16) return;
    
    // Calculate speed from hip movement
    const hip = this.keypoints[3];
    if (this.previousHip) {
      const dx = hip.x - this.previousHip.x;
      const dy = hip.y - this.previousHip.y;
      const distance = Math.sqrt(dx * dx + dy * dy);
      this.metrics.speed = distance * 30; // Assuming 30fps
      
      // Calculate acceleration
      if (this.previousSpeed !== undefined) {
        this.metrics.acceleration = (this.metrics.speed - this.previousSpeed) * 30;
      }
      this.previousSpeed = this.metrics.speed;
    }
    this.previousHip = hip;
    
    // Calculate stride length
    const leftFoot = this.keypoints[12];
    const rightFoot = this.keypoints[15];
    this.metrics.strideLength = Math.abs(leftFoot.x - rightFoot.x);
    
    // Calculate joint angles for strain detection
    this.calculateJointAngles();
    
    // Detect fatigue patterns
    this.detectFatigue();
    
    // Calculate flow state
    this.calculateFlowState();
  }
  
  calculateJointAngles() {
    // Calculate key joint angles
    const angles = {};
    
    // Knee angle (hip-knee-ankle)
    angles.leftKnee = this.getAngle(
      this.keypoints[10], // hip
      this.keypoints[11], // knee
      this.keypoints[12]  // ankle
    );
    
    angles.rightKnee = this.getAngle(
      this.keypoints[13],
      this.keypoints[14],
      this.keypoints[15]
    );
    
    // Elbow angle
    angles.leftElbow = this.getAngle(
      this.keypoints[4],  // shoulder
      this.keypoints[5],  // elbow
      this.keypoints[6]   // wrist
    );
    
    angles.rightElbow = this.getAngle(
      this.keypoints[7],
      this.keypoints[8],
      this.keypoints[9]
    );
    
    this.metrics.jointAngles = angles;
  }
  
  getAngle(p1, p2, p3) {
    if (!p1 || !p2 || !p3) return 0;
    
    const v1 = { x: p1.x - p2.x, y: p1.y - p2.y };
    const v2 = { x: p3.x - p2.x, y: p3.y - p2.y };
    
    const dot = v1.x * v2.x + v1.y * v2.y;
    const det = v1.x * v2.y - v1.y * v2.x;
    
    return Math.atan2(det, dot) * (180 / Math.PI);
  }
  
  detectFatigue() {
    // Simple fatigue detection based on movement patterns
    const variability = this.calculateMovementVariability();
    const efficiency = this.calculateMovementEfficiency();
    
    // Fatigue increases with high variability and low efficiency
    this.metrics.fatigue = Math.min(1, variability * 0.5 + (1 - efficiency) * 0.5);
  }
  
  calculateMovementVariability() {
    // Calculate standard deviation of joint positions
    let variance = 0;
    this.keypoints.forEach(kp => {
      if (kp.confidence > 0.5) {
        variance += Math.abs(kp.x - this.options.width / 2) / this.options.width;
        variance += Math.abs(kp.y - this.options.height / 2) / this.options.height;
      }
    });
    return variance / this.keypoints.length;
  }
  
  calculateMovementEfficiency() {
    // Check if joints are in optimal ranges
    let efficiency = 1;
    const angles = this.metrics.jointAngles;
    
    // Optimal knee angle during running: 140-160 degrees
    if (angles.leftKnee < 140 || angles.leftKnee > 160) efficiency -= 0.1;
    if (angles.rightKnee < 140 || angles.rightKnee > 160) efficiency -= 0.1;
    
    // Optimal elbow angle: 90-110 degrees
    if (angles.leftElbow < 90 || angles.leftElbow > 110) efficiency -= 0.1;
    if (angles.rightElbow < 90 || angles.rightElbow > 110) efficiency -= 0.1;
    
    return Math.max(0, efficiency);
  }
  
  calculateFlowState() {
    // Flow state based on consistency and efficiency
    const consistency = 1 - this.calculateMovementVariability();
    const efficiency = this.calculateMovementEfficiency();
    const lowFatigue = 1 - this.metrics.fatigue;
    
    this.metrics.flowState = (consistency + efficiency + lowFatigue) / 3;
  }
  
  draw() {
    // Clear canvas
    this.ctx.clearRect(0, 0, this.options.width, this.options.height);
    
    if (!this.privacyConsent || this.keypoints.length === 0) return;
    
    // Draw skeleton
    if (this.options.showSkeleton) {
      this.drawSkeleton();
    }
    
    // Draw metrics overlay
    if (this.options.showMetrics) {
      this.drawMetrics();
    }
    
    // Draw fatigue indicators
    if (this.options.showFatigue) {
      this.drawFatigueIndicators();
    }
  }
  
  drawSkeleton() {
    // Draw connections
    this.ctx.strokeStyle = this.options.colors.skeleton;
    this.ctx.lineWidth = 2;
    
    this.connections.forEach(([i, j]) => {
      const p1 = this.keypoints[i];
      const p2 = this.keypoints[j];
      
      if (p1 && p2 && p1.confidence > 0.3 && p2.confidence > 0.3) {
        // Color based on strain
        const angle = this.getAngle(p1, p2, { x: p2.x + 10, y: p2.y });
        const strain = Math.abs(angle - 90) / 90; // Normalized strain
        
        const gradient = this.ctx.createLinearGradient(p1.x, p1.y, p2.x, p2.y);
        gradient.addColorStop(0, strain > 0.5 ? this.options.colors.strain : this.options.colors.skeleton);
        gradient.addColorStop(1, strain > 0.5 ? this.options.colors.strain : this.options.colors.skeleton);
        
        this.ctx.strokeStyle = gradient;
        this.ctx.beginPath();
        this.ctx.moveTo(p1.x, p1.y);
        this.ctx.lineTo(p2.x, p2.y);
        this.ctx.stroke();
      }
    });
    
    // Draw joints
    this.keypoints.forEach((kp, i) => {
      if (kp.confidence > 0.3) {
        const size = 6 + kp.confidence * 4;
        
        // Glow effect for joints under strain
        if (this.isJointUnderStrain(i)) {
          this.ctx.shadowColor = this.options.colors.strain;
          this.ctx.shadowBlur = 15;
        } else {
          this.ctx.shadowColor = this.options.colors.joints;
          this.ctx.shadowBlur = 10;
        }
        
        this.ctx.fillStyle = this.options.colors.joints;
        this.ctx.beginPath();
        this.ctx.arc(kp.x, kp.y, size, 0, Math.PI * 2);
        this.ctx.fill();
        
        this.ctx.shadowBlur = 0;
      }
    });
  }
  
  isJointUnderStrain(jointIndex) {
    const angles = this.metrics.jointAngles;
    
    // Check if specific joints are under strain
    if (jointIndex === 11 || jointIndex === 14) { // Knees
      return angles.leftKnee < 120 || angles.rightKnee < 120;
    }
    if (jointIndex === 5 || jointIndex === 8) { // Elbows
      return angles.leftElbow < 80 || angles.rightElbow < 80;
    }
    
    return false;
  }
  
  drawMetrics() {
    // Background panel
    this.ctx.fillStyle = 'rgba(17, 34, 64, 0.8)';
    this.ctx.fillRect(10, 10, 250, 120);
    
    this.ctx.fillStyle = '#E6F1FF';
    this.ctx.font = 'bold 14px Inter, sans-serif';
    this.ctx.fillText('BIOMECHANICAL METRICS', 20, 30);
    
    // Metrics
    this.ctx.font = '12px JetBrains Mono, monospace';
    this.ctx.fillStyle = '#9BCBEB';
    
    this.ctx.fillText(`Speed: ${this.metrics.speed.toFixed(1)} m/s`, 20, 50);
    this.ctx.fillText(`Acceleration: ${this.metrics.acceleration.toFixed(1)} m/s²`, 20, 70);
    this.ctx.fillText(`Stride Length: ${(this.metrics.strideLength / 100).toFixed(2)} m`, 20, 90);
    this.ctx.fillText(`Flow State: ${(this.metrics.flowState * 100).toFixed(0)}%`, 20, 110);
  }
  
  drawFatigueIndicators() {
    const fatigue = this.metrics.fatigue;
    
    // Fatigue bar
    const barX = this.options.width - 60;
    const barY = 20;
    const barHeight = 150;
    
    // Background
    this.ctx.fillStyle = 'rgba(17, 34, 64, 0.8)';
    this.ctx.fillRect(barX - 10, barY - 10, 50, barHeight + 20);
    
    // Gradient for fatigue level
    const gradient = this.ctx.createLinearGradient(0, barY, 0, barY + barHeight);
    gradient.addColorStop(0, this.options.colors.strain);
    gradient.addColorStop(0.5, this.options.colors.fatigued);
    gradient.addColorStop(1, this.options.colors.optimal);
    
    // Fill based on fatigue level
    this.ctx.fillStyle = gradient;
    this.ctx.fillRect(barX, barY + barHeight * (1 - fatigue), 30, barHeight * fatigue);
    
    // Border
    this.ctx.strokeStyle = '#8892B0';
    this.ctx.strokeRect(barX, barY, 30, barHeight);
    
    // Label
    this.ctx.fillStyle = '#E6F1FF';
    this.ctx.font = '10px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.fillText('FATIGUE', barX + 15, barY + barHeight + 20);
    
    // Warning if high fatigue
    if (fatigue > 0.7) {
      this.ctx.fillStyle = this.options.colors.strain;
      this.ctx.font = 'bold 12px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('⚠ REST RECOMMENDED', this.options.width / 2, this.options.height - 20);
    }
  }
  
  animate() {
    this.draw();
    
    // Simulate keypoint updates for demo
    if (this.keypoints.length === 0) {
      this.generateDemoKeypoints();
    }
    
    requestAnimationFrame(() => this.animate());
  }
  
  generateDemoKeypoints() {
    // Generate demo skeleton for visualization
    const time = Date.now() / 1000;
    const centerX = this.options.width / 2;
    const centerY = this.options.height / 2;
    
    const keypoints = [];
    for (let i = 0; i < 16; i++) {
      const x = centerX + Math.sin(time + i * 0.5) * 50;
      const y = centerY - 150 + i * 20 + Math.cos(time + i * 0.3) * 10;
      
      keypoints.push({
        x: x,
        y: y,
        confidence: 0.8 + Math.random() * 0.2
      });
    }
    
    this.updateKeypoints(keypoints);
  }
  
  exportMetrics() {
    return {
      timestamp: Date.now(),
      metrics: this.metrics,
      privacyConsent: this.privacyConsent
    };
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = BiomechOverlay;
} else {
  window.BiomechOverlay = BiomechOverlay;
}