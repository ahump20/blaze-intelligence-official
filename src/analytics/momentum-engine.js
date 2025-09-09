// Momentum Engine - Predictive Analytics Core
// Hybrid ML architecture: Bayesian + XGBoost + LSTM for game momentum prediction

class MomentumEngine {
  constructor(config = {}) {
    this.config = {
      updateInterval: 1000,  // 1 second updates
      predictionHorizon: 300000,  // 5 minutes ahead
      confidenceThreshold: 0.75,
      ...config
    };
    
    // Model states
    this.bayesianModel = null;
    this.features = {};
    this.predictions = {
      momentum: 0.5,
      winProbability: 0.5,
      pressureIndex: 0,
      confidence: 0
    };
    
    // Historical data buffers
    this.gameState = [];
    this.scoringTrends = [];
    this.possessionData = [];
    this.playerEfficiency = new Map();
    
    // Leverage Index calculation weights
    this.leverageWeights = {
      scoreDifferential: 0.3,
      timeRemaining: 0.25,
      gameContext: 0.2,
      possessionValue: 0.15,
      playerForm: 0.1
    };
    
    this.init();
  }
  
  init() {
    // Initialize Bayesian prior
    this.bayesianModel = {
      prior: { alpha: 1, beta: 1 },  // Beta distribution parameters
      likelihood: { successes: 0, failures: 0 },
      posterior: { alpha: 1, beta: 1 }
    };
    
    // Initialize feature extractors
    this.initializeFeatureExtractors();
  }
  
  // Calculate Leverage Index (core of pressure calculation)
  calculateLeverageIndex(gameState) {
    const {
      scoreDiff,
      timeRemaining,
      quarter,
      possession,
      isPlayoffs,
      lastScoringRun
    } = gameState;
    
    // Time pressure increases exponentially as game ends
    const timePressure = Math.exp(-timeRemaining / 600) * this.leverageWeights.timeRemaining;
    
    // Score pressure peaks at tied games
    const scorePressure = Math.exp(-Math.abs(scoreDiff) / 10) * this.leverageWeights.scoreDifferential;
    
    // Context multiplier (playoffs, rivalry, etc.)
    const contextMultiplier = isPlayoffs ? 1.5 : 1.0;
    
    // Possession value (higher in close games)
    const possessionValue = possession === 'home' ? 
      (0.5 + (0.1 * Math.sign(scoreDiff))) : 
      (0.5 - (0.1 * Math.sign(scoreDiff)));
    
    // Momentum factor from recent scoring
    const momentumFactor = this.calculateMomentumFactor(lastScoringRun);
    
    // Combine all factors
    const leverageIndex = (
      timePressure + 
      scorePressure + 
      (this.leverageWeights.gameContext * contextMultiplier) +
      (this.leverageWeights.possessionValue * possessionValue) +
      (this.leverageWeights.playerForm * momentumFactor)
    );
    
    return Math.min(1, Math.max(0, leverageIndex));
  }
  
  // Calculate momentum from recent scoring patterns
  calculateMomentumFactor(scoringRun) {
    if (!scoringRun || scoringRun.length === 0) return 0.5;
    
    // Weight recent scores more heavily
    let momentum = 0;
    const weights = scoringRun.map((_, i) => Math.exp(-i / 3));
    const totalWeight = weights.reduce((a, b) => a + b, 0);
    
    scoringRun.forEach((score, i) => {
      momentum += (score * weights[i]) / totalWeight;
    });
    
    // Normalize to [0, 1]
    return (Math.tanh(momentum / 5) + 1) / 2;
  }
  
  // Update Bayesian model with new evidence
  updateBayesian(outcome) {
    // Update likelihood based on outcome
    if (outcome.success) {
      this.bayesianModel.likelihood.successes++;
    } else {
      this.bayesianModel.likelihood.failures++;
    }
    
    // Update posterior using conjugate prior
    this.bayesianModel.posterior.alpha = 
      this.bayesianModel.prior.alpha + this.bayesianModel.likelihood.successes;
    this.bayesianModel.posterior.beta = 
      this.bayesianModel.prior.beta + this.bayesianModel.likelihood.failures;
    
    // Calculate expected value (mean of Beta distribution)
    const expectedValue = this.bayesianModel.posterior.alpha / 
      (this.bayesianModel.posterior.alpha + this.bayesianModel.posterior.beta);
    
    return expectedValue;
  }
  
  // Extract features for ML models
  extractFeatures(gameState) {
    const features = {
      // Temporal features
      timeRemaining: gameState.timeRemaining,
      quarter: gameState.quarter,
      shotClock: gameState.shotClock || 24,
      
      // Score features
      scoreDifferential: gameState.scoreDiff,
      scoringRate: this.calculateScoringRate(),
      lastScoreTime: gameState.lastScoreTime,
      
      // Possession features
      possessionTime: gameState.possessionTime,
      turnovers: gameState.turnovers,
      offensiveRebounds: gameState.offRebounds,
      
      // Player features
      starPlayerOn: gameState.starPlayerActive ? 1 : 0,
      benchPoints: gameState.benchPoints,
      foulsToGive: gameState.foulsRemaining,
      
      // Momentum features
      consecutiveScores: this.getConsecutiveScores(),
      scoringDrought: this.getScoringDrought(),
      runLength: gameState.currentRun,
      
      // Advanced metrics
      leverageIndex: this.calculateLeverageIndex(gameState),
      paceFactor: this.calculatePace(),
      efficiencyDifferential: this.getEfficiencyDifferential()
    };
    
    this.features = features;
    return features;
  }
  
  // Simulate XGBoost prediction (placeholder for actual implementation)
  predictWithXGBoost(features) {
    // In production, this would call a trained XGBoost model
    // For now, we'll use a weighted combination of features
    
    const weights = {
      leverageIndex: 0.25,
      scoreDifferential: 0.20,
      timeRemaining: 0.15,
      scoringRate: 0.15,
      consecutiveScores: 0.10,
      efficiencyDifferential: 0.10,
      starPlayerOn: 0.05
    };
    
    let prediction = 0.5;  // Start neutral
    
    // Apply weighted features
    prediction += (features.leverageIndex - 0.5) * weights.leverageIndex;
    prediction += (Math.tanh(features.scoreDifferential / 10)) * weights.scoreDifferential;
    prediction += ((features.timeRemaining / 2880) - 0.5) * weights.timeRemaining;
    prediction += (features.scoringRate - 0.5) * weights.scoringRate;
    prediction += (Math.tanh(features.consecutiveScores / 3)) * weights.consecutiveScores;
    prediction += features.efficiencyDifferential * weights.efficiencyDifferential;
    prediction += (features.starPlayerOn - 0.5) * weights.starPlayerOn;
    
    // Bound to [0, 1]
    return Math.max(0, Math.min(1, prediction));
  }
  
  // LSTM-style sequence prediction (simplified)
  predictSequence(gameSequence) {
    if (gameSequence.length < 3) return 0.5;
    
    // Simple momentum calculation based on recent sequence
    const recentWindow = gameSequence.slice(-10);
    const momentum = recentWindow.reduce((acc, state, i) => {
      const weight = Math.exp(-(recentWindow.length - i) / 3);
      return acc + (state.momentum * weight);
    }, 0) / recentWindow.length;
    
    // Detect patterns (simplified pattern recognition)
    const pattern = this.detectPattern(recentWindow);
    
    // Combine momentum and pattern
    const sequencePrediction = momentum * 0.7 + pattern * 0.3;
    
    return sequencePrediction;
  }
  
  // Pattern detection in game sequence
  detectPattern(sequence) {
    if (sequence.length < 3) return 0.5;
    
    // Check for momentum swings
    let swings = 0;
    for (let i = 1; i < sequence.length; i++) {
      if (Math.sign(sequence[i].momentum - 0.5) !== 
          Math.sign(sequence[i-1].momentum - 0.5)) {
        swings++;
      }
    }
    
    // High volatility suggests upcoming swing
    const volatility = swings / sequence.length;
    
    // Recent trend
    const trend = sequence[sequence.length - 1].momentum - 
                 sequence[Math.max(0, sequence.length - 5)].momentum;
    
    return 0.5 + (trend * 0.5) - (volatility * 0.2);
  }
  
  // Main prediction method combining all models
  predict(gameState) {
    // Extract features
    const features = this.extractFeatures(gameState);
    
    // Get individual model predictions
    const bayesianPred = this.updateBayesian({
      success: gameState.lastPlay?.success || false
    });
    
    const xgboostPred = this.predictWithXGBoost(features);
    
    const sequencePred = this.predictSequence(this.gameState);
    
    // Ensemble prediction with confidence weighting
    const weights = {
      bayesian: 0.3,
      xgboost: 0.5,
      sequence: 0.2
    };
    
    const ensemblePrediction = 
      bayesianPred * weights.bayesian +
      xgboostPred * weights.xgboost +
      sequencePred * weights.sequence;
    
    // Calculate confidence based on model agreement
    const modelPredictions = [bayesianPred, xgboostPred, sequencePred];
    const variance = this.calculateVariance(modelPredictions);
    const confidence = Math.max(0, 1 - (variance * 2));
    
    // Update predictions
    this.predictions = {
      momentum: ensemblePrediction,
      winProbability: this.momentumToWinProbability(ensemblePrediction, features),
      pressureIndex: features.leverageIndex,
      confidence: confidence,
      nextPlay: this.predictNextPlay(features, ensemblePrediction)
    };
    
    // Store state for sequence models
    this.gameState.push({
      ...gameState,
      momentum: ensemblePrediction,
      timestamp: Date.now()
    });
    
    // Maintain window size
    if (this.gameState.length > 100) {
      this.gameState.shift();
    }
    
    return this.predictions;
  }
  
  // Convert momentum to win probability
  momentumToWinProbability(momentum, features) {
    const baseProbability = momentum;
    
    // Adjust for time and score
    const timeAdjustment = features.timeRemaining < 120 ? 
      Math.abs(features.scoreDifferential) * 0.05 : 0;
    
    const scoreAdjustment = Math.tanh(features.scoreDifferential / 20) * 0.2;
    
    let winProbability = baseProbability + scoreAdjustment - timeAdjustment;
    
    // Bound to [0.01, 0.99] to avoid extremes
    return Math.max(0.01, Math.min(0.99, winProbability));
  }
  
  // Predict next likely play type
  predictNextPlay(features, momentum) {
    const predictions = {
      score: 0,
      turnover: 0,
      timeout: 0,
      foul: 0
    };
    
    // High pressure situations
    if (features.leverageIndex > 0.7) {
      predictions.timeout = features.timeRemaining < 60 ? 0.3 : 0.1;
      predictions.foul = features.scoreDifferential < 0 && features.timeRemaining < 30 ? 0.4 : 0.1;
    }
    
    // Momentum-based predictions
    if (momentum > 0.7) {
      predictions.score = 0.6;
      predictions.turnover = 0.1;
    } else if (momentum < 0.3) {
      predictions.score = 0.2;
      predictions.turnover = 0.3;
    } else {
      predictions.score = 0.4;
      predictions.turnover = 0.2;
    }
    
    return predictions;
  }
  
  // Helper methods
  calculateScoringRate() {
    if (this.scoringTrends.length < 2) return 0.5;
    
    const recentScores = this.scoringTrends.slice(-5);
    const rate = recentScores.reduce((a, b) => a + b, 0) / recentScores.length;
    
    return Math.min(1, Math.max(0, rate / 10));
  }
  
  getConsecutiveScores() {
    let consecutive = 0;
    const recent = this.scoringTrends.slice().reverse();
    
    for (const score of recent) {
      if (score > 0) consecutive++;
      else break;
    }
    
    return consecutive;
  }
  
  getScoringDrought() {
    let drought = 0;
    const recent = this.scoringTrends.slice().reverse();
    
    for (const score of recent) {
      if (score === 0) drought++;
      else break;
    }
    
    return drought;
  }
  
  calculatePace() {
    if (this.possessionData.length < 2) return 0.5;
    
    const recentPossessions = this.possessionData.slice(-10);
    const avgTime = recentPossessions.reduce((a, b) => a + b.duration, 0) / 
                   recentPossessions.length;
    
    // Normalize to [0, 1] where 0.5 is average pace
    return Math.max(0, Math.min(1, 1 - (avgTime / 48)));
  }
  
  getEfficiencyDifferential() {
    let homeEff = 0;
    let awayEff = 0;
    
    this.playerEfficiency.forEach((eff, playerId) => {
      if (playerId.startsWith('home')) homeEff += eff;
      else awayEff += eff;
    });
    
    const diff = homeEff - awayEff;
    return Math.tanh(diff / 10);
  }
  
  calculateVariance(values) {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance = values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / values.length;
    return variance;
  }
  
  initializeFeatureExtractors() {
    // Set up feature extraction pipelines
    this.featureExtractors = {
      temporal: (state) => ({
        time: state.timeRemaining,
        quarter: state.quarter,
        shotClock: state.shotClock
      }),
      
      spatial: (state) => ({
        courtPosition: state.courtPosition,
        distance: state.shotDistance,
        angle: state.shotAngle
      }),
      
      contextual: (state) => ({
        playoffs: state.isPlayoffs,
        rivalry: state.isRivalry,
        nationalTV: state.isNationalTV
      })
    };
  }
  
  // Update with live game event
  updateWithEvent(event) {
    switch (event.type) {
      case 'SCORE':
        this.scoringTrends.push(event.points);
        if (this.scoringTrends.length > 20) this.scoringTrends.shift();
        break;
        
      case 'POSSESSION':
        this.possessionData.push({
          team: event.team,
          duration: event.duration,
          result: event.result
        });
        if (this.possessionData.length > 50) this.possessionData.shift();
        break;
        
      case 'PLAYER_UPDATE':
        this.playerEfficiency.set(event.playerId, event.efficiency);
        break;
    }
    
    // Recalculate predictions with new data
    return this.predict(event.gameState);
  }
  
  // Get current predictions
  getPredictions() {
    return this.predictions;
  }
  
  // Reset engine for new game
  reset() {
    this.gameState = [];
    this.scoringTrends = [];
    this.possessionData = [];
    this.playerEfficiency.clear();
    this.init();
  }
}

// Export for use
if (typeof module !== 'undefined' && module.exports) {
  module.exports = MomentumEngine;
} else {
  window.MomentumEngine = MomentumEngine;
}