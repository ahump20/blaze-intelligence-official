// Digital Combine™ Demo Component
class DigitalCombine {
    constructor() {
        this.sampleClips = [
            { id: 'sample1', name: 'Baseball Swing Analysis', sport: 'baseball' },
            { id: 'sample2', name: 'Football Quarterback Throw', sport: 'football' },
            { id: 'sample3', name: 'Basketball Free Throw', sport: 'basketball' }
        ];
        this.currentAnalysis = null;
        this.init();
    }

    init() {
        this.createCombineSection();
        this.bindEventListeners();
    }

    createCombineSection() {
        const section = document.createElement('section');
        section.id = 'digital-combine';
        section.className = 'digital-combine-section';
        section.innerHTML = `
            <div class="combine-container">
                <div class="section-header" data-aos="fade-up">
                    <span class="section-badge">AI-POWERED</span>
                    <h2 class="section-title">Digital Combine™ Demo</h2>
                    <p class="section-subtitle">Upload or select a clip for instant biomechanical analysis</p>
                </div>

                <div class="combine-interface" data-aos="fade-up" data-aos-delay="100">
                    <!-- Upload Zone -->
                    <div class="upload-zone" id="upload-zone">
                        <div class="upload-content">
                            <svg class="upload-icon" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                <polyline points="17 8 12 3 7 8"/>
                                <line x1="12" y1="3" x2="12" y2="15"/>
                            </svg>
                            <h3>Drop your clip here</h3>
                            <p>or click to browse</p>
                            <input type="file" id="file-input" accept="video/*" hidden>
                        </div>
                    </div>

                    <!-- Sample Assets -->
                    <div class="sample-assets">
                        <h4>Or try a sample clip:</h4>
                        <div class="sample-clips">
                            ${this.sampleClips.map(clip => `
                                <button class="sample-clip-btn" data-clip="${clip.id}">
                                    <span class="clip-icon">${this.getSportIcon(clip.sport)}</span>
                                    <span>${clip.name}</span>
                                </button>
                            `).join('')}
                        </div>
                    </div>

                    <!-- Analysis Results -->
                    <div id="analysis-results" class="analysis-results" style="display: none;">
                        <h3>Analysis Results</h3>
                        <div class="results-grid">
                            <div class="result-card">
                                <span class="result-label">Mechanics Score</span>
                                <span class="result-value" id="mechanics-score">--</span>
                                <div class="result-bar">
                                    <div class="result-fill" id="mechanics-fill"></div>
                                </div>
                            </div>
                            <div class="result-card">
                                <span class="result-label">Load Balance</span>
                                <span class="result-value" id="load-balance">--</span>
                                <div class="result-bar">
                                    <div class="result-fill" id="balance-fill"></div>
                                </div>
                            </div>
                            <div class="result-card">
                                <span class="result-label">Timing Delta</span>
                                <span class="result-value" id="timing-delta">--</span>
                                <div class="result-info">Optimal: < 50ms</div>
                            </div>
                        </div>

                        <!-- Coaching Cue -->
                        <div class="coaching-cue">
                            <h4>Coaching Cue</h4>
                            <p id="coaching-text">--</p>
                        </div>

                        <!-- Reproduce Analysis -->
                        <div class="reproduce-section">
                            <h4>Reproduce this analysis</h4>
                            <div class="code-tabs">
                                <button class="code-tab active" data-lang="curl">cURL</button>
                                <button class="code-tab" data-lang="js">JavaScript</button>
                            </div>
                            <pre class="code-block" id="code-curl"><code>curl -X POST https://api.blaze-intelligence.com/v1/digital-combine \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "https://example.com/clip.mp4",
    "analysis_type": "biomechanics",
    "sport": "baseball"
  }'</code></pre>
                            <pre class="code-block" id="code-js" style="display: none;"><code>const analyzeClip = async (videoUrl) => {
  const response = await fetch('https://api.blaze-intelligence.com/v1/digital-combine', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      video_url: videoUrl,
      analysis_type: 'biomechanics',
      sport: 'baseball'
    })
  });
  
  return await response.json();
};</code></pre>
                            <button class="copy-btn" onclick="window.digitalCombine.copyCode()">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                Copy Code
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        `;

        // Insert after features section
        const featuresSection = document.getElementById('features');
        if (featuresSection) {
            featuresSection.parentNode.insertBefore(section, featuresSection.nextSibling);
        }
    }

    bindEventListeners() {
        // Upload zone
        const uploadZone = document.getElementById('upload-zone');
        const fileInput = document.getElementById('file-input');

        uploadZone?.addEventListener('click', () => fileInput?.click());
        
        uploadZone?.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadZone.classList.add('dragover');
        });

        uploadZone?.addEventListener('dragleave', () => {
            uploadZone.classList.remove('dragover');
        });

        uploadZone?.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadZone.classList.remove('dragover');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.handleFileUpload(files[0]);
            }
        });

        fileInput?.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.handleFileUpload(e.target.files[0]);
            }
        });

        // Sample clips
        document.querySelectorAll('.sample-clip-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.analyzeSampleClip(btn.dataset.clip);
            });
        });

        // Code tabs
        document.querySelectorAll('.code-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.code-block').forEach(block => {
                    block.style.display = 'none';
                });
                document.getElementById(`code-${tab.dataset.lang}`).style.display = 'block';
            });
        });
    }

    getSportIcon(sport) {
        const icons = {
            baseball: '⚾',
            football: '🏈',
            basketball: '🏀'
        };
        return icons[sport] || '🏃';
    }

    handleFileUpload(file) {
        console.log('Uploading file:', file.name);
        // Simulate upload and analysis
        this.showLoadingState();
        setTimeout(() => {
            this.performAnalysis({
                fileName: file.name,
                fileSize: file.size,
                sport: this.detectSport(file.name)
            });
        }, 2000);
    }

    analyzeSampleClip(clipId) {
        const clip = this.sampleClips.find(c => c.id === clipId);
        if (!clip) return;

        this.showLoadingState();
        setTimeout(() => {
            this.performAnalysis({
                clipId: clip.id,
                clipName: clip.name,
                sport: clip.sport
            });
        }, 1500);
    }

    showLoadingState() {
        const results = document.getElementById('analysis-results');
        if (results) {
            results.style.display = 'block';
            results.innerHTML = `
                <div class="loading-state">
                    <div class="loading-spinner"></div>
                    <p>Analyzing biomechanics...</p>
                </div>
            `;
        }
    }

    performAnalysis(data) {
        // Generate random but realistic values
        const mechanics = Math.floor(Math.random() * 20 + 75);
        const balance = Math.floor(Math.random() * 15 + 80);
        const timing = Math.floor(Math.random() * 80 + 20);

        const coachingCues = [
            "Excellent hip rotation. Focus on maintaining shoulder alignment through follow-through.",
            "Strong foundation. Consider widening stance slightly for improved power transfer.",
            "Good timing on release. Work on maintaining consistent elbow height.",
            "Solid mechanics overall. Minor adjustment needed in weight transfer sequence."
        ];

        const results = document.getElementById('analysis-results');
        if (results) {
            results.style.display = 'block';
            results.innerHTML = `
                <h3>Analysis Results</h3>
                <div class="results-grid">
                    <div class="result-card">
                        <span class="result-label">Mechanics Score</span>
                        <span class="result-value">${mechanics}/100</span>
                        <div class="result-bar">
                            <div class="result-fill" style="width: ${mechanics}%; background: ${this.getScoreColor(mechanics)};"></div>
                        </div>
                    </div>
                    <div class="result-card">
                        <span class="result-label">Load Balance</span>
                        <span class="result-value">${balance}%</span>
                        <div class="result-bar">
                            <div class="result-fill" style="width: ${balance}%; background: ${this.getScoreColor(balance)};"></div>
                        </div>
                    </div>
                    <div class="result-card">
                        <span class="result-label">Timing Delta</span>
                        <span class="result-value">${timing}ms</span>
                        <div class="result-info" style="color: ${timing < 50 ? '#00DC82' : '#FFB800'};">
                            ${timing < 50 ? 'Optimal' : 'Needs work'}
                        </div>
                    </div>
                </div>

                <!-- Coaching Cue -->
                <div class="coaching-cue">
                    <h4>Coaching Cue</h4>
                    <p>${coachingCues[Math.floor(Math.random() * coachingCues.length)]}</p>
                </div>

                <!-- Reproduce Analysis -->
                <div class="reproduce-section">
                    <h4>Reproduce this analysis</h4>
                    <div class="code-tabs">
                        <button class="code-tab active" data-lang="curl">cURL</button>
                        <button class="code-tab" data-lang="js">JavaScript</button>
                    </div>
                    <pre class="code-block" id="code-curl"><code>curl -X POST https://api.blaze-intelligence.com/v1/digital-combine \\
  -H "Authorization: Bearer YOUR_API_KEY" \\
  -H "Content-Type: application/json" \\
  -d '{
    "video_url": "https://example.com/clip.mp4",
    "analysis_type": "biomechanics",
    "sport": "${data.sport || 'baseball'}"
  }'</code></pre>
                    <pre class="code-block" id="code-js" style="display: none;"><code>const analyzeClip = async (videoUrl) => {
  const response = await fetch('https://api.blaze-intelligence.com/v1/digital-combine', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_API_KEY',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      video_url: videoUrl,
      analysis_type: 'biomechanics',
      sport: '${data.sport || 'baseball'}'
    })
  });
  
  return await response.json();
};</code></pre>
                    <button class="copy-btn" onclick="window.digitalCombine.copyCode()">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                        </svg>
                        Copy Code
                    </button>
                </div>
            `;

            // Re-bind code tab listeners
            this.bindCodeTabListeners();
        }

        this.currentAnalysis = {
            mechanics,
            balance,
            timing,
            sport: data.sport
        };
    }

    bindCodeTabListeners() {
        document.querySelectorAll('.code-tab').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.code-tab').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                document.querySelectorAll('.code-block').forEach(block => {
                    block.style.display = 'none';
                });
                const codeBlock = document.getElementById(`code-${tab.dataset.lang}`);
                if (codeBlock) {
                    codeBlock.style.display = 'block';
                }
            });
        });
    }

    getScoreColor(score) {
        if (score >= 85) return '#00DC82';
        if (score >= 70) return '#FFB800';
        return '#FF3838';
    }

    detectSport(fileName) {
        const name = fileName.toLowerCase();
        if (name.includes('baseball') || name.includes('swing')) return 'baseball';
        if (name.includes('football') || name.includes('throw')) return 'football';
        if (name.includes('basketball') || name.includes('shot')) return 'basketball';
        return 'unknown';
    }

    copyCode() {
        const activeTab = document.querySelector('.code-tab.active');
        const lang = activeTab?.dataset.lang || 'curl';
        const codeBlock = document.getElementById(`code-${lang}`);
        
        if (codeBlock) {
            const code = codeBlock.textContent;
            navigator.clipboard.writeText(code).then(() => {
                const copyBtn = document.querySelector('.copy-btn');
                if (copyBtn) {
                    const originalText = copyBtn.innerHTML;
                    copyBtn.innerHTML = '✓ Copied!';
                    setTimeout(() => {
                        copyBtn.innerHTML = originalText;
                    }, 2000);
                }
            });
        }
    }
}

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', () => {
    window.digitalCombine = new DigitalCombine();
});