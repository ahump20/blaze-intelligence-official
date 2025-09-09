// Digital Combine Display Methods Extension
// Handles results display and code generation for gateway integration

class DigitalCombineDisplay {
    constructor(digitalCombine) {
        this.combine = digitalCombine;
    }

    displayResults(analysis) {
        const results = document.getElementById('analysis-results');
        if (!results) return;

        results.style.display = 'block';
        results.innerHTML = `
            <h3>Analysis Results</h3>
            <div class="results-grid">
                <div class="result-card">
                    <span class="result-label">Mechanics Score</span>
                    <span class="result-value">${analysis.mechanics}/100</span>
                    <div class="result-bar">
                        <div class="result-fill" style="width: ${analysis.mechanics}%; background: ${this.getScoreColor(analysis.mechanics)};"></div>
                    </div>
                </div>
                <div class="result-card">
                    <span class="result-label">Load Balance</span>
                    <span class="result-value">${analysis.balance}%</span>
                    <div class="result-bar">
                        <div class="result-fill" style="width: ${analysis.balance}%; background: ${this.getScoreColor(analysis.balance)};"></div>
                    </div>
                </div>
                <div class="result-card">
                    <span class="result-label">Timing Score</span>
                    <span class="result-value">${analysis.timing}%</span>
                    <div class="result-info" style="color: ${analysis.timing > 80 ? '#00DC82' : '#FFB800'};">
                        ${analysis.timing > 80 ? 'Optimal' : 'Needs work'}
                    </div>
                </div>
            </div>

            <!-- Coaching Cue -->
            <div class="coaching-cue">
                <h4>Coaching Cue</h4>
                <p>${analysis.coachingCue}</p>
            </div>

            <!-- Reproduce Analysis -->
            <div class="reproduce-section">
                <h4>Reproduce this analysis</h4>
                <div class="code-tabs">
                    <button class="code-tab active" data-lang="curl">cURL</button>
                    <button class="code-tab" data-lang="js">JavaScript</button>
                </div>
                <pre class="code-block" id="code-curl"><code>${this.generateCurlCode()}</code></pre>
                <pre class="code-block" id="code-js" style="display: none;"><code>${this.generateJavaScriptCode()}</code></pre>
                <div class="copy-buttons">
                    <button class="copy-btn" data-target="code-curl">Copy cURL</button>
                    <button class="copy-btn" data-target="code-js">Copy JavaScript</button>
                </div>
            </div>
        `;

        // Bind copy functionality
        this.bindCopyButtons();
    }

    getScoreColor(score) {
        if (score >= 85) return '#00DC82';
        if (score >= 70) return '#FFB800';
        return '#FF6B6B';
    }

    generateCurlCode() {
        return `curl -X POST https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/vision/sessions \\
  -H "Content-Type: application/json" \\
  -H "X-Dev-Mode: true" \\
  -d '{
    "session_id": "analysis-demo123",
    "player_id": "player_456",
    "sport": "baseball"
  }'

curl -X POST https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/vision/telemetry \\
  -H "Content-Type: application/json" \\
  -H "X-Dev-Mode: true" \\
  -d '[{
    "session_id": "analysis-demo123",
    "t": 1641234567890,
    "biomechanics": {
      "swing_speed": 92.5,
      "load_balance": 0.87,
      "timing_score": 0.91
    }
  }]'`;
    }

    generateJavaScriptCode() {
        return `const analyzeClip = async (biomechanicsData) => {
  // Create analysis session
  const sessionId = "analysis-" + Math.random().toString(36).slice(2,8);
  
  await fetch('https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/vision/sessions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-Mode': 'true'
    },
    body: JSON.stringify({
      session_id: sessionId,
      player_id: "player_123",
      sport: 'baseball'
    })
  });
  
  // Send biomechanics telemetry
  const response = await fetch('https://blaze-vision-ai-gateway.humphrey-austin20.workers.dev/vision/telemetry', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Dev-Mode': 'true'
    },
    body: JSON.stringify([{
      session_id: sessionId,
      t: Date.now(),
      biomechanics: biomechanicsData
    }])
  });
  
  return await response.json();
};`;
    }

    bindCopyButtons() {
        document.querySelectorAll('.copy-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                const target = document.getElementById(btn.dataset.target);
                if (target) {
                    const text = target.textContent;
                    navigator.clipboard.writeText(text).then(() => {
                        const originalText = btn.textContent;
                        btn.textContent = '✓ Copied!';
                        setTimeout(() => {
                            btn.textContent = originalText;
                        }, 2000);
                    });
                }
            });
        });
    }
}

// Extend the existing DigitalCombine class
if (window.DigitalCombine) {
    const originalInit = window.DigitalCombine.prototype.init;
    window.DigitalCombine.prototype.init = function() {
        originalInit.call(this);
        this.display = new DigitalCombineDisplay(this);
    };

    // Add display methods
    window.DigitalCombine.prototype.displayResults = function(analysis) {
        if (this.display) {
            this.display.displayResults(analysis);
        }
    };

    window.DigitalCombine.prototype.updateCodeBlocks = function(data) {
        // Code blocks are now generated dynamically in displayResults
        console.log('Code blocks updated for:', data);
    };
}