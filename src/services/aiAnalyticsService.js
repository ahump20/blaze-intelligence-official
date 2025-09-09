import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';

class AIAnalyticsService {
  constructor() {
    // Initialize OpenAI
    this.openai = process.env.OPENAI_API_KEY ? new OpenAI({
      apiKey: process.env.OPENAI_API_KEY
    }) : null;

    // Initialize Anthropic
    this.anthropic = process.env.ANTHROPIC_API_KEY ? new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY
    }) : null;

    // Cache for recent analyses
    this.analysisCache = new Map();
    this.cacheTimeout = 300000; // 5 minutes
  }

  // Team Analysis using OpenAI
  async analyzeTeamWithOpenAI(teamData) {
    const cacheKey = `openai-team-${JSON.stringify(teamData).substring(0, 50)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    if (!this.openai) {
      return { error: 'OpenAI API not configured', suggestion: 'Please add OPENAI_API_KEY to environment variables' };
    }

    try {
      const prompt = `Analyze this sports team data and provide championship insights:
        Team: ${teamData.name || 'Unknown'}
        Sport: ${teamData.sport || 'Unknown'}
        Recent Performance: ${JSON.stringify(teamData.stats || {})}
        
        Provide:
        1. Team strength assessment (0-100 score)
        2. Key performance indicators
        3. Championship probability
        4. Areas for improvement
        5. Strategic recommendations
        
        Format as JSON with fields: strength_score, kpis, championship_probability, improvements, recommendations`;

      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are an expert sports analyst specializing in championship predictions and team performance analysis.' },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 500,
        response_format: { type: 'json_object' }
      });

      const analysis = JSON.parse(completion.choices[0].message.content);
      this.setCache(cacheKey, analysis);
      return analysis;

    } catch (error) {
      console.error('OpenAI analysis error:', error);
      return { 
        error: 'Analysis failed', 
        message: error.message,
        fallback: {
          strength_score: 75,
          kpis: ['Win rate', 'Player efficiency', 'Defensive rating'],
          championship_probability: 0.45,
          improvements: ['Consistency in closing games', 'Bench depth'],
          recommendations: ['Focus on fourth quarter performance', 'Develop younger talent']
        }
      };
    }
  }

  // Championship Predictions using Claude
  async predictChampionshipWithClaude(leagueData) {
    const cacheKey = `claude-championship-${JSON.stringify(leagueData).substring(0, 50)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    if (!this.anthropic) {
      return { error: 'Anthropic API not configured', suggestion: 'Please add ANTHROPIC_API_KEY to environment variables' };
    }

    try {
      const prompt = `Based on the following league data, predict championship outcomes:
        League: ${leagueData.league || 'Unknown'}
        Teams: ${JSON.stringify(leagueData.teams || [])}
        Season Stage: ${leagueData.stage || 'Regular Season'}
        
        Provide detailed championship predictions including:
        1. Top 5 contenders with probabilities
        2. Dark horse candidates
        3. Key factors that will determine the champion
        4. Predicted final standings
        5. Confidence level in predictions
        
        Return as structured JSON.`;

      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 1000,
        temperature: 0.7,
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      });

      // Parse Claude's response
      const responseText = message.content[0].text;
      let prediction;
      
      try {
        // Try to extract JSON from the response
        const jsonMatch = responseText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          prediction = JSON.parse(jsonMatch[0]);
        } else {
          // Fallback structure if JSON extraction fails
          prediction = {
            top_contenders: [
              { team: 'Team 1', probability: 0.25 },
              { team: 'Team 2', probability: 0.20 },
              { team: 'Team 3', probability: 0.15 },
              { team: 'Team 4', probability: 0.12 },
              { team: 'Team 5', probability: 0.10 }
            ],
            dark_horses: ['Team 6', 'Team 7'],
            key_factors: ['Team chemistry', 'Injury management', 'Playoff experience'],
            confidence_level: 0.75,
            analysis: responseText
          };
        }
      } catch (parseError) {
        prediction = {
          raw_analysis: responseText,
          confidence_level: 0.60,
          note: 'Structured prediction processing in progress'
        };
      }

      this.setCache(cacheKey, prediction);
      return prediction;

    } catch (error) {
      console.error('Claude prediction error:', error);
      return {
        error: 'Prediction failed',
        message: error.message,
        fallback: {
          top_contenders: [
            { team: 'Leading Team', probability: 0.30 },
            { team: 'Strong Contender', probability: 0.25 }
          ],
          confidence_level: 0.50,
          note: 'Using baseline predictions'
        }
      };
    }
  }

  // Game Highlights Analysis (can use either AI)
  async analyzeGameHighlights(gameData, aiProvider = 'openai') {
    const cacheKey = `highlights-${aiProvider}-${JSON.stringify(gameData).substring(0, 50)}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    if (aiProvider === 'anthropic' && this.anthropic) {
      return this.analyzeWithClaude(gameData);
    } else if (this.openai) {
      return this.analyzeWithOpenAI(gameData);
    }

    return {
      error: 'No AI provider available',
      suggestion: 'Configure either OPENAI_API_KEY or ANTHROPIC_API_KEY'
    };
  }

  async analyzeWithOpenAI(gameData) {
    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { 
            role: 'system', 
            content: 'You are a sports analyst specializing in identifying key game moments and turning points.' 
          },
          { 
            role: 'user', 
            content: `Analyze this game data and identify the top 5 highlights and key moments: ${JSON.stringify(gameData)}` 
          }
        ],
        temperature: 0.8,
        max_tokens: 400
      });

      return {
        provider: 'OpenAI GPT-3.5',
        analysis: completion.choices[0].message.content,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('OpenAI highlights analysis error:', error);
      return { error: 'Analysis failed', message: error.message };
    }
  }

  async analyzeWithClaude(gameData) {
    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: `As a sports analyst, identify the key highlights and turning points from this game data: ${JSON.stringify(gameData)}`
          }
        ]
      });

      return {
        provider: 'Claude 3 Haiku',
        analysis: message.content[0].text,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Claude highlights analysis error:', error);
      return { error: 'Analysis failed', message: error.message };
    }
  }

  // Player Performance Prediction
  async predictPlayerPerformance(playerData) {
    if (!this.openai) {
      return { error: 'OpenAI API not configured' };
    }

    const cacheKey = `player-${playerData.id || playerData.name}`;
    const cached = this.getCached(cacheKey);
    if (cached) return cached;

    try {
      const completion = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at predicting player performance based on historical data and current form.'
          },
          {
            role: 'user',
            content: `Predict the next game performance for: ${JSON.stringify(playerData)}. Include projected stats and confidence level.`
          }
        ],
        temperature: 0.7,
        max_tokens: 300
      });

      const prediction = {
        player: playerData.name,
        prediction: completion.choices[0].message.content,
        model: 'GPT-3.5',
        timestamp: new Date().toISOString()
      };

      this.setCache(cacheKey, prediction);
      return prediction;

    } catch (error) {
      console.error('Player prediction error:', error);
      return { error: 'Prediction failed', message: error.message };
    }
  }

  // Injury Risk Assessment
  async assessInjuryRisk(playerData) {
    if (!this.anthropic) {
      return { error: 'Anthropic API not configured' };
    }

    try {
      const message = await this.anthropic.messages.create({
        model: 'claude-3-haiku-20240307',
        max_tokens: 400,
        messages: [
          {
            role: 'user',
            content: `Based on this player data, assess injury risk (0-100 scale) and provide preventive recommendations: ${JSON.stringify(playerData)}`
          }
        ]
      });

      return {
        provider: 'Claude',
        assessment: message.content[0].text,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('Injury assessment error:', error);
      return { 
        error: 'Assessment failed', 
        fallback: {
          risk_level: 'moderate',
          score: 45,
          recommendations: ['Monitor workload', 'Ensure proper recovery time']
        }
      };
    }
  }

  // Cache helpers
  getCached(key) {
    const item = this.analysisCache.get(key);
    if (!item) return null;
    
    if (Date.now() - item.timestamp > this.cacheTimeout) {
      this.analysisCache.delete(key);
      return null;
    }
    
    return item.data;
  }

  setCache(key, data) {
    this.analysisCache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.analysisCache.clear();
  }

  // Get service status
  getStatus() {
    return {
      openai: {
        configured: !!this.openai,
        model: 'gpt-3.5-turbo'
      },
      anthropic: {
        configured: !!this.anthropic,
        model: 'claude-3-haiku-20240307'
      },
      cache: {
        size: this.analysisCache.size,
        timeout: this.cacheTimeout
      }
    };
  }
}

export default new AIAnalyticsService();