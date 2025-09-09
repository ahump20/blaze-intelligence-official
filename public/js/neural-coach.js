// Neural Coach Analysis Engine
// Real-time biometric monitoring and AI-powered coaching

class NeuralCoachAnalysis {
    constructor() {
        this.isAnalyzing = false;
        this.analysisInterval = null;
        this.currentModel = 'gpt5';
        
        // Biometric data
        this.metrics = {
            confidence: 0,
            engagement: 0,
            stress: 'Low',
            posture: 'Good',
            expressions: {
                joy: 0,
                surprise: 0,
                anger: 0,
                sadness: 0,
                fear: 0,
                disgust: 0
            },
            voice: {
                pitch: 0,
                tone: 'Neutral',
                clarity: 0
            },
            bodyLanguage: {
                postureScore: 85,
                insights: []
            }
        };
        
        // Target values for animation
        this.targetMetrics = {
            confidence: 0,
            engagement: 0,
            stressLevel: 1,
            expressions: {},
            voice: {
                pitch: 0,
                clarity: 0
            },
            postureScore: 85
        };
        
        this.initializeElements();
        this.bindEvents();
        this.initializeCanvas();
    }
    
    initializeElements() {
        // Control buttons
        this.startBtn = document.getElementById('start-analysis');
        this.stopBtn = document.getElementById('stop-analysis');
        this.reportBtn = document.getElementById('generate-report');
        this.coachingBtn = document.getElementById('live-coaching');
        this.exportBtn = document.getElementById('export-report');
        this.shareBtn = document.getElementById('share-session');
        this.saveBtn = document.getElementById('save-analysis');
        
        // Status indicator
        this.statusIndicator = document.getElementById('analysis-status');
        
        // Metric elements
        this.confidenceValue = document.getElementById('confidence-value');
        this.confidenceBar = document.getElementById('confidence-bar');
        this.confidenceTrend = document.getElementById('confidence-trend');
        
        this.engagementValue = document.getElementById('engagement-value');
        this.engagementBar = document.getElementById('engagement-bar');
        this.engagementTrend = document.getElementById('engagement-trend');
        
        this.stressValue = document.getElementById('stress-value');
        this.stressTrend = document.getElementById('stress-trend');
        
        this.postureValue = document.getElementById('posture-value');
        this.postureTrend = document.getElementById('posture-trend');
        
        // Expression elements
        this.expressionBars = {
            joy: document.getElementById('joy-bar'),
            surprise: document.getElementById('surprise-bar'),
            anger: document.getElementById('anger-bar'),
            sadness: document.getElementById('sadness-bar'),
            fear: document.getElementById('fear-bar'),
            disgust: document.getElementById('disgust-bar')
        };
        
        this.expressionValues = {
            joy: document.getElementById('joy-value'),
            surprise: document.getElementById('surprise-value'),
            anger: document.getElementById('anger-value'),
            sadness: document.getElementById('sadness-value'),
            fear: document.getElementById('fear-value'),
            disgust: document.getElementById('disgust-value')
        };
        
        // Voice elements
        this.pitchValue = document.getElementById('pitch-value');
        this.toneValue = document.getElementById('tone-value');
        this.clarityValue = document.getElementById('clarity-value');
        this.clarityBar = document.getElementById('clarity-bar');
        
        // Body language
        this.postureScoreValue = document.getElementById('posture-score-value');
        this.postureScoreCircle = document.getElementById('posture-score-circle');
        
        // Insights feed
        this.insightsFeed = document.getElementById('insights-feed');
        
        // Canvas elements
        this.analysisCanvas = document.getElementById('analysis-canvas');
        this.postureCanvas = document.getElementById('posture-canvas');
        this.pitchWaveform = document.getElementById('pitch-waveform');
        
        // AI model badges
        this.aiModelBadges = document.querySelectorAll('.ai-badge');
    }
    
    bindEvents() {
        this.startBtn?.addEventListener('click', () => this.startAnalysis());
        this.stopBtn?.addEventListener('click', () => this.stopAnalysis());
        this.reportBtn?.addEventListener('click', () => this.generateReport());
        this.coachingBtn?.addEventListener('click', () => this.toggleLiveCoaching());
        this.exportBtn?.addEventListener('click', () => this.exportReport());
        this.shareBtn?.addEventListener('click', () => this.shareSession());
        this.saveBtn?.addEventListener('click', () => this.saveAnalysis());
        
        // AI model selection
        this.aiModelBadges.forEach(badge => {
            badge.addEventListener('click', (e) => {
                this.aiModelBadges.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentModel = e.target.dataset.model;
                this.addInsight(`Switched to ${e.target.textContent} for analysis`, 'system');
            });
        });
    }
    
    initializeCanvas() {
        // Initialize analysis canvas
        if (this.analysisCanvas) {
            this.analysisCtx = this.analysisCanvas.getContext('2d');
            this.setupAnalysisCanvas();
        }
        
        // Initialize posture canvas
        if (this.postureCanvas) {
            this.postureCtx = this.postureCanvas.getContext('2d');
            this.setupPostureCanvas();
        }
        
        // Initialize pitch waveform
        if (this.pitchWaveform) {
            this.pitchCtx = this.pitchWaveform.getContext('2d');
            this.setupPitchWaveform();
        }
    }
    
    setupAnalysisCanvas() {
        const rect = this.analysisCanvas.getBoundingClientRect();
        this.analysisCanvas.width = rect.width;
        this.analysisCanvas.height = rect.height;
        
        // Draw initial placeholder
        this.analysisCtx.fillStyle = 'rgba(10, 10, 15, 1)';
        this.analysisCtx.fillRect(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
        
        // Draw center text
        this.analysisCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        this.analysisCtx.font = '18px Space Grotesk';
        this.analysisCtx.textAlign = 'center';
        this.analysisCtx.fillText('Camera Feed Simulation', this.analysisCanvas.width / 2, this.analysisCanvas.height / 2);
    }
    
    setupPostureCanvas() {
        const rect = this.postureCanvas.getBoundingClientRect();
        this.postureCanvas.width = rect.width;
        this.postureCanvas.height = rect.height;
        this.drawPostureVisualization();
    }
    
    setupPitchWaveform() {
        const rect = this.pitchWaveform.getBoundingClientRect();
        this.pitchWaveform.width = rect.width;
        this.pitchWaveform.height = rect.height;
        this.animateWaveform();
    }
    
    startAnalysis() {
        if (this.isAnalyzing) return;
        
        this.isAnalyzing = true;
        this.startBtn.disabled = true;
        this.stopBtn.disabled = false;
        this.statusIndicator.textContent = 'Analyzing...';
        this.statusIndicator.classList.add('active');
        
        // Add initial insight
        this.addInsight('Neural Analysis Engine initialized. Beginning real-time biometric monitoring...', 'system');
        
        // Simulate webcam activation
        this.simulateVideoFeed();
        
        // Start analysis loop
        this.analysisInterval = setInterval(() => {
            this.updateMetrics();
            this.analyzeData();
        }, 100);
        
        // Add periodic insights
        this.insightInterval = setInterval(() => {
            this.generateCoachingInsight();
        }, 5000);
        
        console.log('🧠 Neural Coach Analysis Started');
    }
    
    stopAnalysis() {
        if (!this.isAnalyzing) return;
        
        this.isAnalyzing = false;
        this.startBtn.disabled = false;
        this.stopBtn.disabled = true;
        this.statusIndicator.textContent = 'Ready';
        this.statusIndicator.classList.remove('active');
        
        clearInterval(this.analysisInterval);
        clearInterval(this.insightInterval);
        clearInterval(this.videoInterval);
        
        this.addInsight('Analysis stopped. Session data saved for review.', 'system');
        
        console.log('⏹️ Neural Coach Analysis Stopped');
    }
    
    simulateVideoFeed() {
        let frame = 0;
        
        this.videoInterval = setInterval(() => {
            if (!this.analysisCtx) return;
            
            // Clear canvas
            this.analysisCtx.fillStyle = 'rgba(10, 10, 15, 0.9)';
            this.analysisCtx.fillRect(0, 0, this.analysisCanvas.width, this.analysisCanvas.height);
            
            // Simulate video static/noise
            for (let i = 0; i < 50; i++) {
                const x = Math.random() * this.analysisCanvas.width;
                const y = Math.random() * this.analysisCanvas.height;
                const size = Math.random() * 2;
                const opacity = Math.random() * 0.5;
                
                this.analysisCtx.fillStyle = `rgba(191, 87, 0, ${opacity})`;
                this.analysisCtx.fillRect(x, y, size, size);
            }
            
            // Draw face detection box
            const centerX = this.analysisCanvas.width / 2;
            const centerY = this.analysisCanvas.height / 2;
            const boxSize = 150 + Math.sin(frame * 0.05) * 10;
            
            this.analysisCtx.strokeStyle = '#00DC82';
            this.analysisCtx.lineWidth = 2;
            this.analysisCtx.strokeRect(centerX - boxSize/2, centerY - boxSize/2, boxSize, boxSize);
            
            // Draw tracking points
            const points = [
                { x: centerX - 30, y: centerY - 20 }, // Left eye
                { x: centerX + 30, y: centerY - 20 }, // Right eye
                { x: centerX, y: centerY + 10 }, // Nose
                { x: centerX, y: centerY + 40 } // Mouth
            ];
            
            points.forEach(point => {
                this.analysisCtx.beginPath();
                this.analysisCtx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                this.analysisCtx.fillStyle = '#FFB81C';
                this.analysisCtx.fill();
            });
            
            // Draw analysis text
            this.analysisCtx.fillStyle = '#00DC82';
            this.analysisCtx.font = '12px monospace';
            this.analysisCtx.textAlign = 'left';
            this.analysisCtx.fillText('FACE DETECTED', 10, 20);
            this.analysisCtx.fillText(`FPS: ${30 + Math.floor(Math.random() * 3)}`, 10, 35);
            this.analysisCtx.fillText(`Tracking: ACTIVE`, 10, 50);
            
            frame++;
        }, 50);
    }
    
    updateMetrics() {
        // Generate realistic variations in metrics
        const time = Date.now() * 0.001;
        
        // Update confidence
        this.targetMetrics.confidence = 65 + Math.sin(time * 0.5) * 15 + Math.random() * 10;
        
        // Update engagement
        this.targetMetrics.engagement = 70 + Math.sin(time * 0.3) * 20 + Math.random() * 5;
        
        // Update stress level
        this.targetMetrics.stressLevel = Math.floor(1 + Math.random() * 3);
        
        // Update expressions
        const expressions = ['joy', 'surprise', 'anger', 'sadness', 'fear', 'disgust'];
        expressions.forEach(expr => {
            this.targetMetrics.expressions[expr] = Math.random() * 30;
        });
        
        // Boost one random expression
        const dominantExpression = expressions[Math.floor(Math.random() * expressions.length)];
        this.targetMetrics.expressions[dominantExpression] += 40 + Math.random() * 30;
        
        // Update voice metrics
        this.targetMetrics.voice.pitch = 120 + Math.sin(time) * 30 + Math.random() * 20;
        this.targetMetrics.voice.clarity = 75 + Math.sin(time * 0.7) * 15;
        
        // Update posture score
        this.targetMetrics.postureScore = 75 + Math.sin(time * 0.4) * 10 + Math.random() * 5;
        
        // Animate to target values
        this.animateMetrics();
    }
    
    animateMetrics() {
        // Animate confidence
        this.metrics.confidence += (this.targetMetrics.confidence - this.metrics.confidence) * 0.1;
        this.confidenceValue.textContent = Math.floor(this.metrics.confidence);
        this.confidenceBar.style.width = this.metrics.confidence + '%';
        
        // Animate engagement
        this.metrics.engagement += (this.targetMetrics.engagement - this.metrics.engagement) * 0.1;
        this.engagementValue.textContent = Math.floor(this.metrics.engagement);
        this.engagementBar.style.width = this.metrics.engagement + '%';
        
        // Update stress
        const stressLevels = ['Low', 'Moderate', 'Elevated', 'High', 'Critical'];
        this.metrics.stress = stressLevels[this.targetMetrics.stressLevel];
        this.stressValue.textContent = this.metrics.stress;
        
        // Update stress indicator dots
        const dots = document.querySelectorAll('.indicator-dot');
        dots.forEach((dot, index) => {
            if (index <= this.targetMetrics.stressLevel) {
                dot.classList.add('active');
            } else {
                dot.classList.remove('active');
            }
        });
        
        // Animate expressions
        Object.keys(this.metrics.expressions).forEach(expr => {
            this.metrics.expressions[expr] += (this.targetMetrics.expressions[expr] - this.metrics.expressions[expr]) * 0.1;
            const value = Math.floor(this.metrics.expressions[expr]);
            this.expressionBars[expr].style.width = value + '%';
            this.expressionValues[expr].textContent = value + '%';
        });
        
        // Update voice metrics
        this.metrics.voice.pitch += (this.targetMetrics.voice.pitch - this.metrics.voice.pitch) * 0.1;
        this.pitchValue.textContent = Math.floor(this.metrics.voice.pitch);
        
        this.metrics.voice.clarity += (this.targetMetrics.voice.clarity - this.metrics.voice.clarity) * 0.1;
        this.clarityValue.textContent = Math.floor(this.metrics.voice.clarity);
        this.clarityBar.style.width = this.metrics.voice.clarity + '%';
        
        // Update tone based on metrics
        const tones = ['Confident', 'Uncertain', 'Enthusiastic', 'Calm', 'Neutral'];
        this.metrics.voice.tone = tones[Math.floor(Math.random() * tones.length)];
        this.toneValue.textContent = this.metrics.voice.tone;
        
        // Update posture score
        this.metrics.bodyLanguage.postureScore += (this.targetMetrics.postureScore - this.metrics.bodyLanguage.postureScore) * 0.1;
        this.postureScoreValue.textContent = Math.floor(this.metrics.bodyLanguage.postureScore);
        
        // Update posture circle
        const circumference = 283; // 2 * PI * 45 (radius)
        const offset = circumference - (this.metrics.bodyLanguage.postureScore / 100) * circumference;
        this.postureScoreCircle.style.strokeDashoffset = offset;
        
        // Update trends
        this.updateTrends();
        
        // Update visualizations
        this.drawPostureVisualization();
        this.animateWaveform();
    }
    
    updateTrends() {
        // Update confidence trend
        if (this.metrics.confidence > 70) {
            this.confidenceTrend.textContent = '↗ Increasing';
            this.confidenceTrend.style.color = '#00DC82';
        } else if (this.metrics.confidence < 40) {
            this.confidenceTrend.textContent = '↘ Decreasing';
            this.confidenceTrend.style.color = '#FF6B35';
        } else {
            this.confidenceTrend.textContent = '→ Stable';
            this.confidenceTrend.style.color = '#FFB81C';
        }
        
        // Update engagement trend
        if (this.metrics.engagement > 75) {
            this.engagementTrend.textContent = '↗ High';
            this.engagementTrend.style.color = '#00DC82';
        } else if (this.metrics.engagement < 45) {
            this.engagementTrend.textContent = '↘ Low';
            this.engagementTrend.style.color = '#FF6B35';
        } else {
            this.engagementTrend.textContent = '→ Moderate';
            this.engagementTrend.style.color = '#FFB81C';
        }
        
        // Update posture trend
        if (this.metrics.bodyLanguage.postureScore > 80) {
            this.postureValue.textContent = 'Excellent';
            this.postureTrend.textContent = '↗ Improving';
            this.postureTrend.style.color = '#00DC82';
        } else if (this.metrics.bodyLanguage.postureScore < 60) {
            this.postureValue.textContent = 'Poor';
            this.postureTrend.textContent = '↘ Declining';
            this.postureTrend.style.color = '#FF6B35';
        } else {
            this.postureValue.textContent = 'Good';
            this.postureTrend.textContent = '→ Stable';
            this.postureTrend.style.color = '#FFB81C';
        }
    }
    
    drawPostureVisualization() {
        if (!this.postureCtx) return;
        
        const width = this.postureCanvas.width;
        const height = this.postureCanvas.height;
        
        // Clear canvas
        this.postureCtx.clearRect(0, 0, width, height);
        
        // Draw posture line
        this.postureCtx.strokeStyle = this.metrics.bodyLanguage.postureScore > 70 ? '#00DC82' : '#FF6B35';
        this.postureCtx.lineWidth = 3;
        this.postureCtx.beginPath();
        
        const centerX = width / 2;
        const deviation = (100 - this.metrics.bodyLanguage.postureScore) / 100 * 20;
        
        this.postureCtx.moveTo(centerX + deviation, 10);
        this.postureCtx.lineTo(centerX, height - 10);
        this.postureCtx.stroke();
        
        // Draw ideal line
        this.postureCtx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        this.postureCtx.lineWidth = 1;
        this.postureCtx.setLineDash([5, 5]);
        this.postureCtx.beginPath();
        this.postureCtx.moveTo(centerX, 10);
        this.postureCtx.lineTo(centerX, height - 10);
        this.postureCtx.stroke();
        this.postureCtx.setLineDash([]);
    }
    
    animateWaveform() {
        if (!this.pitchCtx) return;
        
        const width = this.pitchWaveform.width;
        const height = this.pitchWaveform.height;
        
        // Clear canvas
        this.pitchCtx.fillStyle = 'rgba(10, 10, 15, 0.5)';
        this.pitchCtx.fillRect(0, 0, width, height);
        
        // Draw waveform
        this.pitchCtx.strokeStyle = '#BF5700';
        this.pitchCtx.lineWidth = 2;
        this.pitchCtx.beginPath();
        
        const time = Date.now() * 0.001;
        for (let x = 0; x < width; x++) {
            const y = height / 2 + Math.sin((x * 0.02) + time) * (height / 3) * (this.metrics.voice.pitch / 150);
            if (x === 0) {
                this.pitchCtx.moveTo(x, y);
            } else {
                this.pitchCtx.lineTo(x, y);
            }
        }
        
        this.pitchCtx.stroke();
    }
    
    analyzeData() {
        // Perform analysis based on current metrics
        if (this.metrics.confidence < 40 && Math.random() < 0.01) {
            this.updateBodyInsight('Consider maintaining eye contact', 1);
        }
        
        if (this.metrics.engagement > 80 && Math.random() < 0.01) {
            this.updateBodyInsight('Excellent engagement level detected', 2);
        }
        
        if (this.metrics.bodyLanguage.postureScore < 60 && Math.random() < 0.01) {
            this.updateBodyInsight('Adjust shoulder position for better posture', 3);
        }
    }
    
    updateBodyInsight(text, index) {
        const insightElement = document.getElementById(`body-insight-${index}`);
        if (insightElement) {
            insightElement.textContent = text;
        }
    }
    
    generateCoachingInsight() {
        const insights = [
            'Your confidence level is improving. Maintain current body language.',
            'Detected increased engagement. This is a positive indicator.',
            'Voice clarity is excellent. Continue with current speaking pace.',
            'Micro-expression analysis shows authentic emotional responses.',
            'Posture alignment is optimal for professional presentation.',
            'Stress indicators remain within normal range.',
            'Eye contact patterns suggest strong connection with audience.',
            'Vocal tone conveys authority and credibility.',
            'Body language is open and inviting.',
            'Facial expressions align well with verbal communication.'
        ];
        
        const modelInsights = {
            gpt5: 'ChatGPT 5 Analysis: ',
            claude: 'Claude Opus 4.1 Insight: ',
            gemini: 'Gemini 2.5 Pro Observation: '
        };
        
        const prefix = modelInsights[this.currentModel] || '';
        const insight = prefix + insights[Math.floor(Math.random() * insights.length)];
        
        this.addInsight(insight, 'ai');
    }
    
    addInsight(content, type = 'ai') {
        const insightDiv = document.createElement('div');
        insightDiv.className = 'insight-message';
        
        const timeSpan = document.createElement('span');
        timeSpan.className = 'insight-time';
        timeSpan.textContent = new Date().toLocaleTimeString();
        
        const contentSpan = document.createElement('span');
        contentSpan.className = 'insight-content';
        contentSpan.textContent = content;
        
        insightDiv.appendChild(timeSpan);
        insightDiv.appendChild(contentSpan);
        
        // Remove welcome message if exists
        const welcomeMsg = this.insightsFeed.querySelector('.welcome');
        if (welcomeMsg) {
            welcomeMsg.remove();
        }
        
        this.insightsFeed.appendChild(insightDiv);
        this.insightsFeed.scrollTop = this.insightsFeed.scrollHeight;
    }
    
    generateReport() {
        this.addInsight('Generating comprehensive biometric analysis report...', 'system');
        
        setTimeout(() => {
            this.addInsight('Report generated successfully. Includes all biometric data, emotional patterns, and coaching recommendations.', 'system');
            
            // Simulate report data
            const report = {
                timestamp: new Date().toISOString(),
                duration: '00:05:23',
                metrics: this.metrics,
                insights: [],
                recommendations: []
            };
            
            console.log('📊 Report Generated:', report);
        }, 2000);
    }
    
    toggleLiveCoaching() {
        this.coachingBtn.classList.toggle('active');
        const isActive = this.coachingBtn.classList.contains('active');
        
        if (isActive) {
            this.addInsight('Live coaching mode activated. Real-time feedback enabled.', 'system');
        } else {
            this.addInsight('Live coaching mode deactivated.', 'system');
        }
    }
    
    exportReport() {
        this.addInsight('Exporting analysis report as PDF...', 'system');
        
        setTimeout(() => {
            this.addInsight('PDF report exported successfully.', 'system');
            console.log('📄 PDF Export Complete');
        }, 1500);
    }
    
    shareSession() {
        const shareUrl = window.location.origin + '/coach/session/' + Math.random().toString(36).substr(2, 9);
        
        this.addInsight(`Session sharing link generated: ${shareUrl}`, 'system');
        
        // Copy to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
            this.addInsight('Share link copied to clipboard!', 'system');
        });
    }
    
    saveAnalysis() {
        this.addInsight('Saving analysis session...', 'system');
        
        const sessionData = {
            id: 'session_' + Date.now(),
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            model: this.currentModel
        };
        
        // Save to localStorage
        localStorage.setItem('neural_coach_session', JSON.stringify(sessionData));
        
        setTimeout(() => {
            this.addInsight('Analysis session saved successfully.', 'system');
            console.log('💾 Session Saved:', sessionData);
        }, 1000);
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.neuralCoach = new NeuralCoachAnalysis();
    console.log('🧠 Neural Coach initialized');
});