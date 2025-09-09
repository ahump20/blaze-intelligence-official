/**
 * Blaze Vision AI - Advanced Video Intelligence Platform
 * Biomechanical Analysis + Micro-Expression Detection + Character Assessment
 * Copyright 2025 Blaze Intelligence
 */

class BlazeVisionAI {
    constructor() {
        this.models = {
            pose: null,
            face: null,
            emotion: null
        };
        this.metrics = {
            biomechanical: {},
            microExpression: {},
            character: {}
        };
        this.isInitialized = false;
        this.videoElement = null;
        this.canvasElement = null;
        this.ctx = null;
    }

    async initialize() {
        console.log('🔥 Initializing Blaze Vision AI...');
        
        // Load MediaPipe models
        await this.loadModels();
        
        // Setup video capture
        this.setupVideoCapture();
        
        // Initialize metrics tracking
        this.initializeMetrics();
        
        this.isInitialized = true;
        console.log('✅ Blaze Vision AI ready');
    }

    async loadModels() {
        // Load Pose Detection Model
        this.models.pose = new Pose({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/pose/${file}`
        });
        
        this.models.pose.setOptions({
            modelComplexity: 2,
            smoothLandmarks: true,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });
        
        // Load Face Mesh Model for micro-expressions
        this.models.face = new FaceMesh({
            locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
        });
        
        this.models.face.setOptions({
            maxNumFaces: 1,
            refineLandmarks: true,
            minDetectionConfidence: 0.7,
            minTrackingConfidence: 0.7
        });
        
        // Setup result callbacks
        this.models.pose.onResults(this.processPoseResults.bind(this));
        this.models.face.onResults(this.processFaceResults.bind(this));
    }

    setupVideoCapture() {
        this.videoElement = document.getElementById('video-input');
        this.canvasElement = document.getElementById('output-canvas');
        this.ctx = this.canvasElement.getContext('2d');
        
        // Setup camera
        const camera = new Camera(this.videoElement, {
            onFrame: async () => {
                if (this.models.pose) await this.models.pose.send({image: this.videoElement});
                if (this.models.face) await this.models.face.send({image: this.videoElement});
            },
            width: 1280,
            height: 720
        });
        
        camera.start();
    }

    processPoseResults(results) {
        if (!results.poseLandmarks) return;
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // Draw the video frame
        this.ctx.drawImage(results.image, 0, 0, this.canvasElement.width, this.canvasElement.height);
        
        // Analyze biomechanics
        const biomechanics = this.analyzeBiomechanics(results.poseLandmarks);
        this.metrics.biomechanical = biomechanics;
        
        // Draw skeleton and metrics
        this.drawPoseSkeleton(results.poseLandmarks, biomechanics);
        
        // Update UI with metrics
        this.updateBiomechanicalDisplay(biomechanics);
    }

    analyzeBiomechanics(landmarks) {
        const metrics = {
            // Baseball Swing Analysis
            hipRotation: this.calculateHipRotation(landmarks),
            shoulderTilt: this.calculateShoulderTilt(landmarks),
            kneeFlexion: this.calculateKneeFlexion(landmarks),
            
            // Football Throwing Mechanics
            elbowAngle: this.calculateElbowAngle(landmarks),
            releasePoint: this.calculateReleasePoint(landmarks),
            
            // Basketball Shooting Form
            shootingElbow: this.calculateShootingElbow(landmarks),
            followThrough: this.calculateFollowThrough(landmarks),
            
            // General Athletic Metrics
            centerOfGravity: this.calculateCenterOfGravity(landmarks),
            balance: this.calculateBalance(landmarks),
            explosiveness: this.calculateExplosiveness(landmarks),
            
            // Form Quality Score (0-100)
            formScore: 0
        };
        
        // Calculate overall form score
        metrics.formScore = this.calculateFormScore(metrics);
        
        return metrics;
    }

    calculateHipRotation(landmarks) {
        const leftHip = landmarks[23];
        const rightHip = landmarks[24];
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        
        // Calculate rotation angle
        const hipAngle = Math.atan2(rightHip.y - leftHip.y, rightHip.x - leftHip.x);
        const shoulderAngle = Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x);
        
        return Math.abs(hipAngle - shoulderAngle) * (180 / Math.PI);
    }

    calculateShoulderTilt(landmarks) {
        const leftShoulder = landmarks[11];
        const rightShoulder = landmarks[12];
        
        return Math.atan2(rightShoulder.y - leftShoulder.y, rightShoulder.x - leftShoulder.x) * (180 / Math.PI);
    }

    calculateKneeFlexion(landmarks) {
        const hip = landmarks[24];
        const knee = landmarks[26];
        const ankle = landmarks[28];
        
        return this.calculateAngle(hip, knee, ankle);
    }

    calculateElbowAngle(landmarks) {
        const shoulder = landmarks[12];
        const elbow = landmarks[14];
        const wrist = landmarks[16];
        
        return this.calculateAngle(shoulder, elbow, wrist);
    }

    calculateAngle(a, b, c) {
        const radians = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
        let angle = Math.abs(radians * 180 / Math.PI);
        if (angle > 180) angle = 360 - angle;
        return angle;
    }

    calculateReleasePoint(landmarks) {
        const wrist = landmarks[16];
        const shoulder = landmarks[12];
        
        // Height ratio for release point consistency
        return wrist.y / shoulder.y;
    }

    calculateShootingElbow(landmarks) {
        const shoulder = landmarks[12];
        const elbow = landmarks[14];
        const wrist = landmarks[16];
        
        // Check if elbow is aligned under wrist (ideal shooting form)
        const alignment = Math.abs(elbow.x - wrist.x) / Math.abs(shoulder.x - wrist.x);
        return alignment * 100; // Convert to percentage
    }

    calculateFollowThrough(landmarks) {
        const wrist = landmarks[16];
        const elbow = landmarks[14];
        
        // Analyze wrist flick and follow-through angle
        return Math.atan2(wrist.y - elbow.y, wrist.x - elbow.x) * (180 / Math.PI);
    }

    calculateCenterOfGravity(landmarks) {
        let sumX = 0, sumY = 0;
        for (let i = 0; i < landmarks.length; i++) {
            sumX += landmarks[i].x;
            sumY += landmarks[i].y;
        }
        return {
            x: sumX / landmarks.length,
            y: sumY / landmarks.length
        };
    }

    calculateBalance(landmarks) {
        const leftAnkle = landmarks[27];
        const rightAnkle = landmarks[28];
        const cog = this.calculateCenterOfGravity(landmarks);
        
        // Check if COG is between ankles
        const minX = Math.min(leftAnkle.x, rightAnkle.x);
        const maxX = Math.max(leftAnkle.x, rightAnkle.x);
        
        if (cog.x >= minX && cog.x <= maxX) {
            return 100; // Perfect balance
        }
        
        // Calculate deviation
        const deviation = cog.x < minX ? minX - cog.x : cog.x - maxX;
        return Math.max(0, 100 - (deviation * 200));
    }

    calculateExplosiveness(landmarks) {
        // Track velocity of key joints over time
        // This would need frame-by-frame comparison
        // Placeholder for demonstration
        return 85;
    }

    calculateFormScore(metrics) {
        const weights = {
            hipRotation: 0.15,
            shoulderTilt: 0.10,
            kneeFlexion: 0.10,
            elbowAngle: 0.15,
            balance: 0.20,
            explosiveness: 0.30
        };
        
        let score = 0;
        
        // Hip rotation optimal range: 30-45 degrees
        score += weights.hipRotation * this.scoreInRange(metrics.hipRotation, 30, 45, 60);
        
        // Shoulder tilt optimal range: 10-20 degrees
        score += weights.shoulderTilt * this.scoreInRange(Math.abs(metrics.shoulderTilt), 10, 20, 30);
        
        // Knee flexion optimal range: 90-120 degrees
        score += weights.kneeFlexion * this.scoreInRange(metrics.kneeFlexion, 90, 120, 150);
        
        // Elbow angle optimal range: 85-95 degrees
        score += weights.elbowAngle * this.scoreInRange(metrics.elbowAngle, 85, 95, 110);
        
        // Balance and explosiveness are already 0-100
        score += weights.balance * metrics.balance;
        score += weights.explosiveness * metrics.explosiveness;
        
        return Math.round(score);
    }

    scoreInRange(value, optimalMin, optimalMax, maxDeviation) {
        if (value >= optimalMin && value <= optimalMax) {
            return 100;
        }
        
        const deviation = value < optimalMin ? optimalMin - value : value - optimalMax;
        const score = 100 - (deviation / maxDeviation * 100);
        return Math.max(0, score);
    }

    processFaceResults(results) {
        if (!results.multiFaceLandmarks || results.multiFaceLandmarks.length === 0) return;
        
        const faceLandmarks = results.multiFaceLandmarks[0];
        
        // Analyze micro-expressions
        const microExpressions = this.analyzeMicroExpressions(faceLandmarks);
        this.metrics.microExpression = microExpressions;
        
        // Calculate character traits
        const characterTraits = this.assessCharacter(microExpressions);
        this.metrics.character = characterTraits;
        
        // Update displays
        this.updateMicroExpressionDisplay(microExpressions);
        this.updateCharacterDisplay(characterTraits);
    }

    analyzeMicroExpressions(landmarks) {
        return {
            // Eye metrics
            eyeOpenness: this.calculateEyeOpenness(landmarks),
            blinkRate: this.trackBlinkRate(landmarks),
            gazeDirection: this.calculateGazeDirection(landmarks),
            
            // Mouth metrics
            mouthCurvature: this.calculateMouthCurvature(landmarks),
            jawTension: this.calculateJawTension(landmarks),
            
            // Eyebrow metrics
            eyebrowHeight: this.calculateEyebrowHeight(landmarks),
            eyebrowFurrow: this.calculateEyebrowFurrow(landmarks),
            
            // Overall emotion indicators
            determination: 0,
            focus: 0,
            stress: 0,
            confidence: 0
        };
    }

    calculateEyeOpenness(landmarks) {
        // Left eye: 159 (upper), 145 (lower)
        // Right eye: 386 (upper), 374 (lower)
        const leftEyeHeight = Math.abs(landmarks[159].y - landmarks[145].y);
        const rightEyeHeight = Math.abs(landmarks[386].y - landmarks[374].y);
        
        return (leftEyeHeight + rightEyeHeight) / 2 * 1000; // Scale for visibility
    }

    trackBlinkRate(landmarks) {
        // This would need temporal tracking
        // Placeholder implementation
        return 15; // blinks per minute
    }

    calculateGazeDirection(landmarks) {
        // Calculate iris position relative to eye corners
        const leftEyeCenter = landmarks[468]; // Left iris
        const rightEyeCenter = landmarks[473]; // Right iris
        
        return {
            horizontal: (leftEyeCenter.x + rightEyeCenter.x) / 2,
            vertical: (leftEyeCenter.y + rightEyeCenter.y) / 2
        };
    }

    calculateMouthCurvature(landmarks) {
        const leftCorner = landmarks[61];
        const rightCorner = landmarks[291];
        const upperLip = landmarks[13];
        const lowerLip = landmarks[14];
        
        // Positive = smile, Negative = frown
        const avgCornerHeight = (leftCorner.y + rightCorner.y) / 2;
        const mouthCenter = (upperLip.y + lowerLip.y) / 2;
        
        return (mouthCenter - avgCornerHeight) * 100;
    }

    calculateJawTension(landmarks) {
        // Measure jaw width changes
        const jawLeft = landmarks[172];
        const jawRight = landmarks[397];
        
        return Math.abs(jawRight.x - jawLeft.x) * 100;
    }

    calculateEyebrowHeight(landmarks) {
        const leftBrow = landmarks[70];
        const rightBrow = landmarks[63];
        const leftEye = landmarks[159];
        const rightEye = landmarks[386];
        
        const leftHeight = Math.abs(leftBrow.y - leftEye.y);
        const rightHeight = Math.abs(rightBrow.y - rightEye.y);
        
        return (leftHeight + rightHeight) / 2 * 100;
    }

    calculateEyebrowFurrow(landmarks) {
        const leftInnerBrow = landmarks[107];
        const rightInnerBrow = landmarks[55];
        
        return Math.abs(rightInnerBrow.x - leftInnerBrow.x) * 100;
    }

    assessCharacter(microExpressions) {
        const traits = {
            grit: 0,
            determination: 0,
            focus: 0,
            confidence: 0,
            coachability: 0,
            leadershipPotential: 0,
            pressureResponse: 0,
            competitiveness: 0,
            mentalToughness: 0,
            championshipMindset: 0
        };
        
        // Calculate determination from eye metrics and jaw tension
        traits.determination = this.calculateDetermination(microExpressions);
        
        // Calculate focus from gaze stability and blink rate
        traits.focus = this.calculateFocus(microExpressions);
        
        // Calculate confidence from posture and facial relaxation
        traits.confidence = this.calculateConfidence(microExpressions);
        
        // Calculate grit from sustained effort indicators
        traits.grit = this.calculateGrit(microExpressions, traits.determination);
        
        // Calculate coachability from attention and responsiveness
        traits.coachability = this.calculateCoachability(microExpressions);
        
        // Calculate leadership potential from confidence and presence
        traits.leadershipPotential = (traits.confidence * 0.4 + traits.determination * 0.3 + traits.focus * 0.3);
        
        // Calculate pressure response from stress indicators
        traits.pressureResponse = this.calculatePressureResponse(microExpressions);
        
        // Calculate competitiveness from intensity markers
        traits.competitiveness = this.calculateCompetitiveness(microExpressions);
        
        // Calculate mental toughness composite
        traits.mentalToughness = (traits.grit * 0.3 + traits.determination * 0.3 + traits.pressureResponse * 0.4);
        
        // Calculate championship mindset score
        traits.championshipMindset = this.calculateChampionshipMindset(traits);
        
        return traits;
    }

    calculateDetermination(expressions) {
        // High jaw tension + focused eyes + slight frown = determination
        const jawComponent = Math.min(expressions.jawTension / 50, 1) * 40;
        const eyeComponent = (100 - expressions.eyeOpenness) / 100 * 30;
        const browComponent = expressions.eyebrowFurrow / 100 * 30;
        
        return jawComponent + eyeComponent + browComponent;
    }

    calculateFocus(expressions) {
        // Low blink rate + stable gaze + neutral expression = focus
        const blinkComponent = Math.max(0, 40 - expressions.blinkRate) / 40 * 50;
        const gazeComponent = 30; // Placeholder for gaze stability
        const expressionComponent = Math.abs(expressions.mouthCurvature) < 10 ? 20 : 0;
        
        return blinkComponent + gazeComponent + expressionComponent;
    }

    calculateConfidence(expressions) {
        // Relaxed face + slight smile + open eyes = confidence
        const smileComponent = Math.max(0, expressions.mouthCurvature) / 50 * 40;
        const eyeComponent = expressions.eyeOpenness / 50 * 30;
        const browComponent = (100 - expressions.eyebrowFurrow) / 100 * 30;
        
        return smileComponent + eyeComponent + browComponent;
    }

    calculateGrit(expressions, determination) {
        // Sustained determination over time + minimal stress indicators
        return determination * 0.7 + 30; // Base grit score
    }

    calculateCoachability(expressions) {
        // Open expression + attentive gaze = coachability
        return 75; // Placeholder - would need interaction data
    }

    calculatePressureResponse(expressions) {
        // Low stress indicators under pressure = good response
        const stressLevel = expressions.eyebrowFurrow / 2 + expressions.blinkRate;
        return Math.max(0, 100 - stressLevel);
    }

    calculateCompetitiveness(expressions) {
        // Intensity markers + forward lean + jaw set
        return expressions.jawTension / 2 + expressions.eyebrowFurrow / 2 + 20;
    }

    calculateChampionshipMindset(traits) {
        // Weighted combination of all traits
        const weights = {
            grit: 0.20,
            determination: 0.15,
            focus: 0.15,
            confidence: 0.10,
            mentalToughness: 0.20,
            pressureResponse: 0.20
        };
        
        let score = 0;
        score += traits.grit * weights.grit;
        score += traits.determination * weights.determination;
        score += traits.focus * weights.focus;
        score += traits.confidence * weights.confidence;
        score += traits.mentalToughness * weights.mentalToughness;
        score += traits.pressureResponse * weights.pressureResponse;
        
        return Math.round(score);
    }

    drawPoseSkeleton(landmarks, metrics) {
        // Draw connections
        const connections = [
            [11, 12], [11, 13], [13, 15], [12, 14], [14, 16], // Arms
            [11, 23], [12, 24], [23, 24], // Torso
            [23, 25], [25, 27], [24, 26], [26, 28] // Legs
        ];
        
        this.ctx.strokeStyle = '#BF5700';
        this.ctx.lineWidth = 3;
        
        connections.forEach(([start, end]) => {
            const startPoint = landmarks[start];
            const endPoint = landmarks[end];
            
            this.ctx.beginPath();
            this.ctx.moveTo(startPoint.x * this.canvasElement.width, startPoint.y * this.canvasElement.height);
            this.ctx.lineTo(endPoint.x * this.canvasElement.width, endPoint.y * this.canvasElement.height);
            this.ctx.stroke();
        });
        
        // Draw key points
        landmarks.forEach((landmark, index) => {
            const x = landmark.x * this.canvasElement.width;
            const y = landmark.y * this.canvasElement.height;
            
            this.ctx.fillStyle = '#FF8C00';
            this.ctx.beginPath();
            this.ctx.arc(x, y, 5, 0, 2 * Math.PI);
            this.ctx.fill();
        });
        
        // Draw metrics overlay
        this.drawMetricsOverlay(metrics);
    }

    drawMetricsOverlay(metrics) {
        // Draw form score
        this.ctx.fillStyle = metrics.formScore > 80 ? '#00FF00' : metrics.formScore > 60 ? '#FFFF00' : '#FF0000';
        this.ctx.font = 'bold 48px Inter';
        this.ctx.fillText(`Form: ${metrics.formScore}`, 50, 80);
        
        // Draw key metrics
        this.ctx.fillStyle = '#FFFFFF';
        this.ctx.font = '20px Inter';
        this.ctx.fillText(`Hip Rotation: ${metrics.hipRotation.toFixed(1)}°`, 50, 120);
        this.ctx.fillText(`Balance: ${metrics.balance.toFixed(0)}%`, 50, 150);
        this.ctx.fillText(`Explosiveness: ${metrics.explosiveness.toFixed(0)}%`, 50, 180);
    }

    updateBiomechanicalDisplay(metrics) {
        // Update UI elements with biomechanical data
        const displayElement = document.getElementById('biomechanical-metrics');
        if (displayElement) {
            displayElement.innerHTML = `
                <div class="metric-card">
                    <h3>Biomechanical Analysis</h3>
                    <div class="metric-row">
                        <span>Form Score:</span>
                        <span class="metric-value">${metrics.formScore}/100</span>
                    </div>
                    <div class="metric-row">
                        <span>Hip Rotation:</span>
                        <span class="metric-value">${metrics.hipRotation.toFixed(1)}°</span>
                    </div>
                    <div class="metric-row">
                        <span>Shoulder Tilt:</span>
                        <span class="metric-value">${metrics.shoulderTilt.toFixed(1)}°</span>
                    </div>
                    <div class="metric-row">
                        <span>Balance:</span>
                        <span class="metric-value">${metrics.balance.toFixed(0)}%</span>
                    </div>
                    <div class="metric-row">
                        <span>Explosiveness:</span>
                        <span class="metric-value">${metrics.explosiveness.toFixed(0)}%</span>
                    </div>
                </div>
            `;
        }
    }

    updateMicroExpressionDisplay(expressions) {
        const displayElement = document.getElementById('micro-expression-metrics');
        if (displayElement) {
            displayElement.innerHTML = `
                <div class="metric-card">
                    <h3>Micro-Expression Analysis</h3>
                    <div class="metric-row">
                        <span>Eye Focus:</span>
                        <span class="metric-value">${expressions.eyeOpenness.toFixed(0)}</span>
                    </div>
                    <div class="metric-row">
                        <span>Jaw Tension:</span>
                        <span class="metric-value">${expressions.jawTension.toFixed(0)}</span>
                    </div>
                    <div class="metric-row">
                        <span>Brow Furrow:</span>
                        <span class="metric-value">${expressions.eyebrowFurrow.toFixed(0)}</span>
                    </div>
                </div>
            `;
        }
    }

    updateCharacterDisplay(traits) {
        const displayElement = document.getElementById('character-metrics');
        if (displayElement) {
            displayElement.innerHTML = `
                <div class="metric-card">
                    <h3>Character Assessment</h3>
                    <div class="metric-row">
                        <span>Championship Mindset:</span>
                        <span class="metric-value highlight">${traits.championshipMindset.toFixed(0)}/100</span>
                    </div>
                    <div class="metric-row">
                        <span>Grit:</span>
                        <span class="metric-value">${traits.grit.toFixed(0)}%</span>
                    </div>
                    <div class="metric-row">
                        <span>Determination:</span>
                        <span class="metric-value">${traits.determination.toFixed(0)}%</span>
                    </div>
                    <div class="metric-row">
                        <span>Focus:</span>
                        <span class="metric-value">${traits.focus.toFixed(0)}%</span>
                    </div>
                    <div class="metric-row">
                        <span>Mental Toughness:</span>
                        <span class="metric-value">${traits.mentalToughness.toFixed(0)}%</span>
                    </div>
                    <div class="metric-row">
                        <span>Pressure Response:</span>
                        <span class="metric-value">${traits.pressureResponse.toFixed(0)}%</span>
                    </div>
                </div>
            `;
        }
    }

    exportMetrics() {
        return {
            timestamp: new Date().toISOString(),
            biomechanical: this.metrics.biomechanical,
            microExpression: this.metrics.microExpression,
            character: this.metrics.character,
            blazeScore: this.calculateBlazeScore()
        };
    }

    calculateBlazeScore() {
        // Proprietary Blaze Intelligence Score combining all metrics
        const bio = this.metrics.biomechanical.formScore || 0;
        const char = this.metrics.character.championshipMindset || 0;
        const focus = this.metrics.character.focus || 0;
        
        return Math.round(bio * 0.4 + char * 0.4 + focus * 0.2);
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.blazeVisionAI = new BlazeVisionAI();
    
    // Add initialization button
    const initButton = document.getElementById('init-vision-ai');
    if (initButton) {
        initButton.addEventListener('click', async () => {
            await window.blazeVisionAI.initialize();
        });
    }
});

// Export for module usage
if (typeof module !== 'undefined' && module.exports) {
    module.exports = BlazeVisionAI;
}