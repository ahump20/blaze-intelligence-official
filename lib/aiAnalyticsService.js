// AI-Powered Sports Analytics Service
// Integrates OpenAI, Anthropic, and Gemini for advanced sports intelligence

class AIAnalyticsService {
    constructor() {
        this.cache = new Map();
        this.cacheTimeout = 300000; // 5 minutes for AI responses
        this.rateLimits = {
            openai: { calls: 0, resetTime: Date.now() + 60000 },
            anthropic: { calls: 0, resetTime: Date.now() + 60000 },
            gemini: { calls: 0, resetTime: Date.now() + 60000 }
        };
    }

    // Team Performance Analysis using OpenAI
    async analyzeTeamPerformance(team, seasonData = {}) {
        const cacheKey = `team_analysis_${team.id}_${Date.now().toString().slice(0, -5)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) return cached;

        try {
            const prompt = this.buildTeamAnalysisPrompt(team, seasonData);
            
            const response = await fetch('/api/ai/openai/analyze-team', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    model: 'gpt-4',
                    max_tokens: 800,
                    temperature: 0.3
                })
            });

            if (!response.ok) {
                throw new Error(`OpenAI API error: ${response.status}`);
            }

            const analysis = await response.json();
            
            const result = {
                team: team.name,
                league: team.league,
                analysis: analysis.choices[0]?.message?.content || 'Analysis unavailable',
                strengths: this.extractStrengths(analysis.choices[0]?.message?.content),
                weaknesses: this.extractWeaknesses(analysis.choices[0]?.message?.content),
                outlook: this.extractOutlook(analysis.choices[0]?.message?.content),
                timestamp: new Date().toISOString()
            };

            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error('OpenAI team analysis error:', error);
            return this.getFallbackAnalysis(team);
        }
    }

    // Championship Probability using Anthropic
    async predictChampionshipOdds(teams, historicalData = {}) {
        const cacheKey = `championship_odds_${teams.length}_${Date.now().toString().slice(0, -5)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) return cached;

        try {
            const prompt = this.buildChampionshipPrompt(teams, historicalData);
            
            const response = await fetch('/api/ai/anthropic/predict-championship', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    max_tokens: 1000,
                    temperature: 0.2
                })
            });

            if (!response.ok) {
                throw new Error(`Anthropic API error: ${response.status}`);
            }

            const prediction = await response.json();
            
            const result = {
                predictions: this.parseChampionshipPredictions(prediction.content),
                confidence: this.extractConfidence(prediction.content),
                methodology: 'Advanced AI analysis using historical performance, current form, and championship patterns',
                timestamp: new Date().toISOString(),
                topContenders: this.extractTopContenders(prediction.content),
                darkHorses: this.extractDarkHorses(prediction.content)
            };

            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Anthropic championship prediction error:', error);
            return this.getFallbackPredictions(teams);
        }
    }

    // Multi-Modal Analysis using Gemini
    async analyzeGameHighlights(gameData, mediaUrls = []) {
        const cacheKey = `game_highlights_${gameData.id}_${Date.now().toString().slice(0, -5)}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached) return cached;

        try {
            const prompt = this.buildHighlightsPrompt(gameData);
            
            const response = await fetch('/api/ai/gemini/analyze-highlights', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    prompt,
                    game_data: gameData,
                    media_urls: mediaUrls,
                    model: 'gemini-pro'
                })
            });

            if (!response.ok) {
                throw new Error(`Gemini API error: ${response.status}`);
            }

            const analysis = await response.json();
            
            const result = {
                gameId: gameData.id,
                keyMoments: this.extractKeyMoments(analysis.content),
                playerPerformance: this.extractPlayerInsights(analysis.content),
                strategicInsights: this.extractStrategicInsights(analysis.content),
                gameFlow: this.extractGameFlow(analysis.content),
                timestamp: new Date().toISOString()
            };

            this.cache.set(cacheKey, result);
            return result;

        } catch (error) {
            console.error('Gemini highlights analysis error:', error);
            return this.getFallbackHighlightsAnalysis(gameData);
        }
    }

    // Comprehensive League Intelligence
    async generateLeagueIntelligence(league, season = '2025') {
        const cacheKey = `league_intel_${league}_${season}`;
        const cached = this.cache.get(cacheKey);
        
        if (cached && (Date.now() - cached.timestamp) < this.cacheTimeout) {
            return cached;
        }

        try {
            // Use all three AI services for comprehensive analysis
            const [teamAnalysis, predictions, trendAnalysis] = await Promise.all([
                this.analyzeLeagueTeams(league),
                this.predictSeasonOutcomes(league),
                this.analyzeTrends(league)
            ]);

            const intelligence = {
                league,
                season,
                overview: {
                    totalTeams: teamAnalysis.totalTeams,
                    competitiveBalance: teamAnalysis.competitiveBalance,
                    championshipFavorites: predictions.topContenders.slice(0, 5),
                    emergingTrends: trendAnalysis.keyTrends
                },
                teamAnalysis,
                predictions,
                trends: trendAnalysis,
                timestamp: Date.now(),
                lastUpdated: new Date().toISOString()
            };

            this.cache.set(cacheKey, intelligence);
            return intelligence;

        } catch (error) {
            console.error('League intelligence generation error:', error);
            return this.getFallbackLeagueIntelligence(league);
        }
    }

    // Prompt Building Methods
    buildTeamAnalysisPrompt(team, seasonData) {
        return `Analyze the ${team.market} ${team.name} (${team.league}) for the 2025 season.

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
    }

    buildChampionshipPrompt(teams, historicalData) {
        const teamSummaries = teams.slice(0, 20).map(team => 
            `${team.market} ${team.name}: ${team.titles} titles, Competitive: ${team.competitive}, Legacy: ${team.legacy}`
        ).join('\n');

        return `Based on the following team data, provide championship probability analysis for the 2025 season:

${teamSummaries}

Please provide:
1. Top 5 championship contenders with percentage odds
2. Dark horse candidates (3-5 teams with upset potential)
3. Confidence level in predictions (High/Medium/Low)
4. Key factors that will determine championship outcomes
5. Methodology and reasoning behind odds

Format as structured prediction with clear percentages and reasoning.`;
    }

    buildHighlightsPrompt(gameData) {
        return `Analyze this ${gameData.sport} game: ${gameData.name}

Game Details:
- Teams: ${gameData.teams.map(t => `${t.name} (${t.score})`).join(' vs ')}
- Status: ${gameData.status.type.description}
- Venue: ${gameData.venue?.name || 'Unknown'}

Provide analysis of:
1. Key game-changing moments
2. Outstanding individual performances
3. Strategic decisions that impacted outcome
4. Game flow and momentum shifts
5. Statistical insights and context`;
    }

    // Data Extraction Methods
    extractStrengths(content) {
        const strengthsMatch = content.match(/(?:strengths|advantages)[:\s]*(.*?)(?=\n.*?(?:weak|concern|challenge|outlook))/is);
        return strengthsMatch ? strengthsMatch[1].trim().split(/[,;]/).slice(0, 3) : [];
    }

    extractWeaknesses(content) {
        const weaknessMatch = content.match(/(?:weak|concern|challenge)[:\s]*(.*?)(?=\n.*?(?:strength|outlook|champion))/is);
        return weaknessMatch ? weaknessMatch[1].trim().split(/[,;]/).slice(0, 3) : [];
    }

    extractOutlook(content) {
        const outlookMatch = content.match(/(?:outlook|projection|forecast)[:\s]*(.*?)(?=\n\n|\n.*?[1-9]\.)/is);
        return outlookMatch ? outlookMatch[1].trim() : 'Positive outlook expected';
    }

    parseChampionshipPredictions(content) {
        const predictions = [];
        const lines = content.split('\n');
        
        lines.forEach(line => {
            const match = line.match(/(.*?):\s*(\d+(?:\.\d+)?%)/);
            if (match) {
                predictions.push({
                    team: match[1].trim(),
                    probability: parseFloat(match[2]),
                    odds: this.convertToOdds(parseFloat(match[2]))
                });
            }
        });

        return predictions.sort((a, b) => b.probability - a.probability);
    }

    convertToOdds(percentage) {
        if (percentage <= 0) return '+10000';
        const decimal = 100 / percentage;
        return decimal >= 2 ? `+${Math.round((decimal - 1) * 100)}` : `-${Math.round(100 / (decimal - 1))}`;
    }

    // Fallback Methods
    getFallbackAnalysis(team) {
        return {
            team: team.name,
            league: team.league,
            analysis: `The ${team.market} ${team.name} represents a ${team.competitive > 150 ? 'highly competitive' : 'developing'} franchise with ${team.titles} championship${team.titles !== 1 ? 's' : ''} in their legacy.`,
            strengths: ['Competitive experience', 'Strong fundamentals', 'Team chemistry'],
            weaknesses: ['Areas for improvement identified', 'Depth concerns', 'Consistency challenges'],
            outlook: team.competitive > 150 ? 'Strong championship contention expected' : 'Building foundation for future success',
            timestamp: new Date().toISOString()
        };
    }

    getFallbackPredictions(teams) {
        const topTeams = teams.sort((a, b) => b.competitive - a.competitive).slice(0, 5);
        return {
            predictions: topTeams.map((team, index) => ({
                team: `${team.market} ${team.name}`,
                probability: Math.max(5, 25 - (index * 4)),
                odds: index === 0 ? '+300' : `+${400 + (index * 200)}`
            })),
            confidence: 'Medium',
            methodology: 'Based on competitive scores and historical performance',
            timestamp: new Date().toISOString()
        };
    }

    // Rate Limiting and Health Checks
    async checkAPIHealth() {
        const healthStatus = {
            openai: false,
            anthropic: false,
            gemini: false,
            timestamp: new Date().toISOString()
        };

        try {
            const healthChecks = await Promise.allSettled([
                fetch('/api/ai/openai/health'),
                fetch('/api/ai/anthropic/health'),
                fetch('/api/ai/gemini/health')
            ]);

            healthStatus.openai = healthChecks[0].status === 'fulfilled' && healthChecks[0].value.ok;
            healthStatus.anthropic = healthChecks[1].status === 'fulfilled' && healthChecks[1].value.ok;
            healthStatus.gemini = healthChecks[2].status === 'fulfilled' && healthChecks[2].value.ok;

        } catch (error) {
            console.error('AI API health check failed:', error);
        }

        return healthStatus;
    }

    clearCache() {
        this.cache.clear();
        console.log('🧹 AI Analytics cache cleared');
    }
}

export default AIAnalyticsService;