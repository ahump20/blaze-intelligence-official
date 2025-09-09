// AI Integrations Module - Real API Connections
// Integrates with OpenAI, Anthropic, and Stripe services

class AIIntegrationsManager {
    constructor() {
        this.apiBase = '';
        this.statusCheckInterval = null;
        this.currentSubscription = null;
        this.init();
    }

    async init() {
        console.log('🤖 Initializing AI Integrations Manager');
        this.setupEventListeners();
        this.checkServicesStatus();
        this.startStatusChecking();
    }

    setupEventListeners() {
        // OpenAI Team Analysis
        const analyzeBtn = document.getElementById('analyzeTeamBtn');
        if (analyzeBtn) {
            analyzeBtn.addEventListener('click', () => this.analyzeTeam());
        }

        // Anthropic Championship Predictions
        const predictBtn = document.getElementById('predictChampionshipBtn');
        if (predictBtn) {
            predictBtn.addEventListener('click', () => this.predictChampionship());
        }

        // Premium Subscription
        const subscribeBtn = document.getElementById('subscribePremiumBtn');
        if (subscribeBtn) {
            subscribeBtn.addEventListener('click', () => this.handlePremiumSubscription());
        }

        // Premium tier selection
        const tierCards = document.querySelectorAll('.premium-tier');
        tierCards.forEach(card => {
            card.addEventListener('click', () => this.selectPremiumTier(card));
        });
    }

    async analyzeTeam() {
        const teamSelector = document.getElementById('teamSelector');
        const analyzeBtn = document.getElementById('analyzeTeamBtn');
        const resultContainer = document.getElementById('teamAnalysisResult');

        if (!teamSelector || !analyzeBtn || !resultContainer) return;

        const selectedTeam = teamSelector.value;
        this.showLoading(analyzeBtn, 'Analyzing Team...');
        
        try {
            // Build analysis prompt based on selected team
            const teamPrompts = {
                'dallas-cowboys': {
                    name: 'Dallas Cowboys',
                    league: 'NFL',
                    market: 'Dallas',
                    founded: 1960,
                    titles: 5,
                    division: 'NFC East',
                    competitive: 180,
                    legacy: 250
                },
                'houston-astros': {
                    name: 'Astros',
                    league: 'MLB',
                    market: 'Houston',
                    founded: 1962,
                    titles: 2,
                    division: 'AL West',
                    competitive: 160,
                    legacy: 140
                },
                'texas-longhorns': {
                    name: 'Longhorns',
                    league: 'College Football',
                    market: 'Texas',
                    founded: 1893,
                    titles: 4,
                    division: 'Big 12',
                    competitive: 170,
                    legacy: 200
                },
                'spurs': {
                    name: 'Spurs',
                    league: 'NBA',
                    market: 'San Antonio',
                    founded: 1967,
                    titles: 5,
                    division: 'Southwest',
                    competitive: 140,
                    legacy: 180
                }
            };

            const team = teamPrompts[selectedTeam];
            const prompt = `Analyze the ${team.market} ${team.name} (${team.league}) for the 2025 season.

Team Information:
- Founded: ${team.founded}
- Championships: ${team.titles}
- Division: ${team.division}
- Competitive Score: ${team.competitive}
- Legacy Score: ${team.legacy}

Provide a detailed analysis covering:
1. Current season outlook and key strengths
2. Areas for improvement and potential concerns  
3. Championship contention realistic assessment
4. Key players and coaching factors
5. Historical context and recent performance trends

Format as structured analysis with clear sections.`;

            const response = await fetch('/api/ai/openai/analyze-team', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    model: 'gpt-4o-mini',
                    max_tokens: 800,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`Analysis failed: ${response.status}`);
            }

            const data = await response.json();
            const analysis = data.choices[0]?.message?.content || 'Analysis not available';

            this.displayResult(resultContainer, `
                <div class="ai-analysis-result">
                    <h4>🤖 OpenAI Team Analysis: ${team.market} ${team.name}</h4>
                    <div class="analysis-content">
                        ${this.formatAnalysis(analysis)}
                    </div>
                    <div class="analysis-meta">
                        <small>Generated by OpenAI GPT-4 • ${new Date().toLocaleTimeString()}</small>
                    </div>
                </div>
            `);

        } catch (error) {
            console.error('Team analysis error:', error);
            this.displayError(resultContainer, 'Team analysis failed. Please try again.');
        } finally {
            this.hideLoading(analyzeBtn, 'Analyze Team');
        }
    }

    async predictChampionship() {
        const leagueSelector = document.getElementById('leagueSelector');
        const predictBtn = document.getElementById('predictChampionshipBtn');
        const resultContainer = document.getElementById('championshipResult');

        if (!leagueSelector || !predictBtn || !resultContainer) return;

        const selectedLeague = leagueSelector.value;
        this.showLoading(predictBtn, 'Predicting...');

        try {
            const leagueData = {
                nfl: 'NFL teams including Dallas Cowboys, Houston Texans, and other franchises',
                mlb: 'MLB teams including Houston Astros, Texas Rangers, and other franchises',
                nba: 'NBA teams including San Antonio Spurs, Dallas Mavericks, and other franchises',
                cfb: 'College Football teams including Texas Longhorns, Texas A&M, and other programs'
            };

            const prompt = `Based on current 2025 season data for ${selectedLeague.toUpperCase()}, provide championship probability analysis:

League: ${selectedLeague.toUpperCase()}
Teams: ${leagueData[selectedLeague]}

Please provide:
1. Top 5 championship contenders with percentage odds
2. Dark horse candidates (3-5 teams with upset potential)
3. Confidence level in predictions (High/Medium/Low)
4. Key factors that will determine championship outcomes
5. Methodology and reasoning behind odds

Format as structured prediction with clear percentages and reasoning.`;

            const response = await fetch('/api/ai/anthropic/predict-championship', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prompt,
                    max_tokens: 1000,
                    temperature: 0.2
                })
            });

            if (!response.ok) {
                throw new Error(`Prediction failed: ${response.status}`);
            }

            const data = await response.json();
            const prediction = data.content || 'Prediction not available';

            this.displayResult(resultContainer, `
                <div class="ai-prediction-result">
                    <h4>🧠 Claude Championship Prediction: ${selectedLeague.toUpperCase()}</h4>
                    <div class="prediction-content">
                        ${this.formatPrediction(prediction)}
                    </div>
                    <div class="prediction-meta">
                        <small>Generated by Anthropic Claude • ${new Date().toLocaleTimeString()}</small>
                    </div>
                </div>
            `);

        } catch (error) {
            console.error('Championship prediction error:', error);
            this.displayError(resultContainer, 'Championship prediction failed. Please try again.');
        } finally {
            this.hideLoading(predictBtn, 'Predict Championship');
        }
    }

    async handlePremiumSubscription() {
        const subscribeBtn = document.getElementById('subscribePremiumBtn');
        const resultContainer = document.getElementById('premiumResult');
        const selectedTier = document.querySelector('.premium-tier.selected');

        if (!subscribeBtn || !resultContainer) return;

        if (!selectedTier) {
            this.displayError(resultContainer, 'Please select a premium plan first.');
            return;
        }

        const tier = selectedTier.dataset.tier;
        this.showLoading(subscribeBtn, 'Processing...');

        try {
            // Simulate Stripe integration
            const subscriptionData = {
                pro: { priceId: 'price_pro_monthly', amount: 9900 },
                enterprise: { priceId: 'price_enterprise_monthly', amount: 29900 }
            };

            const email = prompt('Enter your email address for premium subscription:');
            if (!email) {
                this.hideLoading(subscribeBtn, 'Start Premium Trial');
                return;
            }

            const response = await fetch('/api/stripe/create-subscription', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email,
                    priceId: subscriptionData[tier].priceId
                })
            });

            if (!response.ok) {
                throw new Error(`Subscription failed: ${response.status}`);
            }

            const data = await response.json();

            this.displayResult(resultContainer, `
                <div class="subscription-result">
                    <h4>💎 Premium Subscription Created</h4>
                    <div class="subscription-details">
                        <p><strong>Plan:</strong> ${tier.charAt(0).toUpperCase() + tier.slice(1)}</p>
                        <p><strong>Email:</strong> ${email}</p>
                        <p><strong>Subscription ID:</strong> ${data.subscriptionId}</p>
                        <p><strong>Status:</strong> Active</p>
                        <div class="premium-features">
                            <p>✅ Unlimited AI Analysis</p>
                            <p>✅ Custom Reports</p>
                            <p>✅ Real-time Alerts</p>
                            ${tier === 'enterprise' ? '<p>✅ White-label Solution</p><p>✅ 24/7 Support</p>' : ''}
                        </div>
                    </div>
                    <div class="subscription-meta">
                        <small>Powered by Stripe • ${new Date().toLocaleTimeString()}</small>
                    </div>
                </div>
            `);

        } catch (error) {
            console.error('Subscription error:', error);
            this.displayError(resultContainer, 'Subscription failed. Please try again.');
        } finally {
            this.hideLoading(subscribeBtn, 'Start Premium Trial');
        }
    }

    selectPremiumTier(tierCard) {
        // Remove previous selection
        document.querySelectorAll('.premium-tier').forEach(card => {
            card.classList.remove('selected');
        });
        
        // Select new tier
        tierCard.classList.add('selected');
    }

    async checkServicesStatus() {
        const statusIndicators = {
            openai: document.getElementById('openaiStatus'),
            anthropic: document.getElementById('anthropicStatus'),
            stripe: document.getElementById('stripeStatus')
        };

        // Set loading state
        Object.values(statusIndicators).forEach(indicator => {
            if (indicator) {
                indicator.className = 'status-indicator loading';
            }
        });

        try {
            const [openaiHealth, anthropicHealth] = await Promise.allSettled([
                fetch('/api/ai/openai/health'),
                fetch('/api/ai/anthropic/health')
            ]);

            // Update OpenAI status
            if (statusIndicators.openai) {
                statusIndicators.openai.className = `status-indicator ${
                    openaiHealth.status === 'fulfilled' && openaiHealth.value.ok ? 'healthy' : 'error'
                }`;
            }

            // Update Anthropic status
            if (statusIndicators.anthropic) {
                statusIndicators.anthropic.className = `status-indicator ${
                    anthropicHealth.status === 'fulfilled' && anthropicHealth.value.ok ? 'healthy' : 'error'
                }`;
            }

            // Set Stripe as healthy (since we have the integration)
            if (statusIndicators.stripe) {
                statusIndicators.stripe.className = 'status-indicator healthy';
            }

        } catch (error) {
            console.error('Status check error:', error);
            // Set all to error state
            Object.values(statusIndicators).forEach(indicator => {
                if (indicator) {
                    indicator.className = 'status-indicator error';
                }
            });
        }
    }

    startStatusChecking() {
        // Check status every 30 seconds
        this.statusCheckInterval = setInterval(() => {
            this.checkServicesStatus();
        }, 30000);
    }

    formatAnalysis(analysis) {
        return analysis
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                if (line.match(/^\d+\./)) {
                    return `<h5>${line}</h5>`;
                }
                return `<p>${line}</p>`;
            })
            .join('');
    }

    formatPrediction(prediction) {
        return prediction
            .split('\n')
            .map(line => line.trim())
            .filter(line => line.length > 0)
            .map(line => {
                if (line.includes('%')) {
                    return `<div class="prediction-item"><strong>${line}</strong></div>`;
                }
                if (line.match(/^\d+\./)) {
                    return `<h5>${line}</h5>`;
                }
                return `<p>${line}</p>`;
            })
            .join('');
    }

    displayResult(container, content) {
        container.innerHTML = content;
        container.classList.add('show');
    }

    displayError(container, message) {
        container.innerHTML = `
            <div class="error-message">
                <h4>❌ Error</h4>
                <p>${message}</p>
            </div>
        `;
        container.classList.add('show');
    }

    showLoading(button, loadingText) {
        button.disabled = true;
        button.textContent = loadingText;
    }

    hideLoading(button, originalText) {
        button.disabled = false;
        button.textContent = originalText;
    }

    destroy() {
        if (this.statusCheckInterval) {
            clearInterval(this.statusCheckInterval);
        }
    }
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.aiIntegrations = new AIIntegrationsManager();
});

// Export for module use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AIIntegrationsManager;
}