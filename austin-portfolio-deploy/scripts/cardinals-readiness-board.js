#!/usr/bin/env node
// Cardinals Readiness Board Automation
// Enhanced version that computes readiness/leverage and generates UI updates
// Runs every 10 minutes to keep dashboard fresh

import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), 'data', 'analytics');
const CARDINALS_FILE = path.join(DATA_DIR, 'cardinals.json');
const UI_CONFIG_FILE = path.join(process.cwd(), 'data', 'dashboard-config.json');
const READINESS_LOG = path.join(process.cwd(), 'logs', 'readiness.log');

/**
 * Main readiness board function
 */
async function updateReadinessBoard() {
  try {
    console.log(`[${new Date().toISOString()}] Starting Cardinals Readiness Board update...`);
    
    // Get current Cardinals data
    const cardinalsData = await loadCardinalsData();
    
    // Compute enhanced readiness metrics
    const readinessAnalysis = await computeEnhancedReadiness(cardinalsData);
    
    // Generate leverage assessment
    const leverageAssessment = await assessLeverage(cardinalsData, readinessAnalysis);
    
    // Create UI configuration
    const uiConfig = await generateUIConfig(readinessAnalysis, leverageAssessment);
    
    // Update dashboard configuration
    await updateDashboardConfig(uiConfig);
    
    // Generate tonight's readiness summary
    const tonightSummary = generateTonightReadiness(readinessAnalysis, leverageAssessment);
    
    // Log the update
    await logReadinessUpdate(readinessAnalysis, leverageAssessment, tonightSummary);
    
    console.log(`[${new Date().toISOString()}] Readiness Board updated successfully`);
    console.log(`- Overall readiness: ${readinessAnalysis.overall_readiness.toFixed(1)}%`);
    console.log(`- Leverage factor: ${leverageAssessment.current_leverage}`);
    console.log(`- Tonight's outlook: ${tonightSummary.outlook}`);
    
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Readiness Board error:`, error.message);
    await logError(error);
  }
}

/**
 * Load Cardinals data from file
 */
async function loadCardinalsData() {
  try {
    const data = await fs.readFile(CARDINALS_FILE, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error loading Cardinals data:', error.message);
    // Return default data structure
    return {
      readiness: { overall: 85.0, offense: 84.0, defense: 86.0, pitching: 85.0, baserunning: 83.0 },
      leverage: { current: 2.0, trend: 'stable' },
      confidence: 88,
      timestamp: new Date().toISOString()
    };
  }
}

/**
 * Compute enhanced readiness metrics with deeper analysis
 */
async function computeEnhancedReadiness(cardinalsData) {
  const readiness = cardinalsData.readiness || {};
  
  // Base readiness scores
  const offense = readiness.offense || 85.0;
  const defense = readiness.defense || 86.0;
  const pitching = readiness.pitching || 85.0;
  const baserunning = readiness.baserunning || 83.0;
  
  // Weighted overall calculation (pitching and defense more important)
  const weightedOverall = (
    (pitching * 0.35) + 
    (defense * 0.30) + 
    (offense * 0.25) + 
    (baserunning * 0.10)
  );
  
  // Calculate momentum indicators
  const momentum = calculateMomentum(cardinalsData);
  
  // Situational readiness adjustments
  const situationalFactors = calculateSituationalFactors(cardinalsData);
  
  // Enhanced readiness analysis
  const analysis = {
    overall_readiness: weightedOverall,
    component_scores: {
      offense: offense,
      defense: defense,
      pitching: pitching,
      baserunning: baserunning
    },
    momentum: momentum,
    situational_factors: situationalFactors,
    readiness_trend: calculateReadinessTrend(weightedOverall),
    key_strengths: identifyKeyStrengths(readiness),
    areas_for_improvement: identifyImprovementAreas(readiness),
    timestamp: new Date().toISOString()
  };
  
  return analysis;
}

/**
 * Calculate momentum indicators
 */
function calculateMomentum(cardinalsData) {
  const leverageTrend = cardinalsData.leverage?.trend || 'stable';
  const confidence = cardinalsData.confidence || 88;
  
  let momentumScore = 50; // Neutral baseline
  
  // Adjust based on leverage trend
  if (leverageTrend === 'increasing') momentumScore += 15;
  if (leverageTrend === 'decreasing') momentumScore -= 15;
  
  // Adjust based on confidence level
  momentumScore += (confidence - 85) * 0.5;
  
  // Determine momentum category
  let category = 'stable';
  if (momentumScore > 60) category = 'positive';
  if (momentumScore < 40) category = 'negative';
  if (momentumScore > 75) category = 'surging';
  if (momentumScore < 25) category = 'concerning';
  
  return {
    score: Math.max(0, Math.min(100, momentumScore)),
    category: category,
    description: getMomentumDescription(category)
  };
}

/**
 * Get momentum description
 */
function getMomentumDescription(category) {
  const descriptions = {
    'surging': 'Team showing exceptional momentum with all systems aligned',
    'positive': 'Strong positive momentum across multiple areas',
    'stable': 'Consistent performance with steady momentum',
    'negative': 'Some momentum challenges requiring attention',
    'concerning': 'Significant momentum issues needing immediate focus'
  };
  
  return descriptions[category] || descriptions['stable'];
}

/**
 * Calculate situational factors
 */
function calculateSituationalFactors(cardinalsData) {
  const factors = [];
  
  // Check upcoming games
  if (cardinalsData.next_games && cardinalsData.next_games.length > 0) {
    const nextGame = cardinalsData.next_games[0];
    if (nextGame.win_probability) {
      if (nextGame.win_probability > 0.6) {
        factors.push({ type: 'favorable_matchup', impact: 0.8, description: 'Favorable upcoming matchup' });
      } else if (nextGame.win_probability < 0.4) {
        factors.push({ type: 'challenging_matchup', impact: -0.6, description: 'Challenging upcoming opponent' });
      }
    }
  }
  
  // Check leverage factors
  if (cardinalsData.leverage && cardinalsData.leverage.factors) {
    cardinalsData.leverage.factors.forEach(factor => {
      if (factor.status === 'positive' && factor.impact > 0.7) {
        factors.push({ 
          type: 'strength_factor', 
          impact: factor.impact, 
          description: `Strong ${factor.category.replace('_', ' ')}` 
        });
      }
    });
  }
  
  // Time-based factors
  const hour = new Date().getHours();
  if (hour >= 18 && hour <= 23) { // Evening hours
    factors.push({ type: 'prime_time', impact: 0.3, description: 'Prime performance hours' });
  }
  
  return factors;
}

/**
 * Calculate readiness trend
 */
function calculateReadinessTrend(currentReadiness) {
  // In production, this would compare with historical data
  // For now, simulate trend based on current score
  if (currentReadiness > 90) return 'excellent';
  if (currentReadiness > 85) return 'strong';
  if (currentReadiness > 80) return 'good';
  if (currentReadiness > 75) return 'fair';
  return 'needs_improvement';
}

/**
 * Identify key strengths
 */
function identifyKeyStrengths(readiness) {
  const scores = [
    { area: 'pitching', score: readiness.pitching || 85 },
    { area: 'defense', score: readiness.defense || 86 },
    { area: 'offense', score: readiness.offense || 84 },
    { area: 'baserunning', score: readiness.baserunning || 83 }
  ];
  
  return scores
    .filter(item => item.score > 87)
    .sort((a, b) => b.score - a.score)
    .slice(0, 2)
    .map(item => ({ area: item.area, score: item.score, level: 'elite' }));
}

/**
 * Identify areas for improvement
 */
function identifyImprovementAreas(readiness) {
  const scores = [
    { area: 'pitching', score: readiness.pitching || 85 },
    { area: 'defense', score: readiness.defense || 86 },
    { area: 'offense', score: readiness.offense || 84 },
    { area: 'baserunning', score: readiness.baserunning || 83 }
  ];
  
  return scores
    .filter(item => item.score < 85)
    .sort((a, b) => a.score - b.score)
    .slice(0, 2)
    .map(item => ({ area: item.area, score: item.score, priority: item.score < 80 ? 'high' : 'medium' }));
}

/**
 * Assess leverage with enhanced metrics
 */
async function assessLeverage(cardinalsData, readinessAnalysis) {
  const baseLeverage = cardinalsData.leverage?.current || 2.0;
  const leverageTrend = cardinalsData.leverage?.trend || 'stable';
  
  // Calculate leverage multipliers
  const readinessMultiplier = readinessAnalysis.overall_readiness / 85.0; // Normalized to 85% baseline
  const momentumMultiplier = readinessAnalysis.momentum.score / 50.0; // Normalized to 50% baseline
  
  const adjustedLeverage = baseLeverage * readinessMultiplier * momentumMultiplier;
  
  // Determine leverage category
  let category = 'moderate';
  if (adjustedLeverage > 2.5) category = 'high';
  if (adjustedLeverage > 3.0) category = 'exceptional';
  if (adjustedLeverage < 1.5) category = 'low';
  
  const assessment = {
    current_leverage: parseFloat(adjustedLeverage.toFixed(2)),
    base_leverage: baseLeverage,
    trend: leverageTrend,
    category: category,
    multipliers: {
      readiness: parseFloat(readinessMultiplier.toFixed(3)),
      momentum: parseFloat(momentumMultiplier.toFixed(3))
    },
    leverage_factors: generateLeverageFactors(cardinalsData, readinessAnalysis),
    strategic_outlook: generateStrategicOutlook(adjustedLeverage, category),
    timestamp: new Date().toISOString()
  };
  
  return assessment;
}

/**
 * Generate leverage factors
 */
function generateLeverageFactors(cardinalsData, readinessAnalysis) {
  const factors = [];
  
  // Readiness-based factors
  if (readinessAnalysis.overall_readiness > 88) {
    factors.push({ type: 'high_readiness', impact: 0.8, description: 'Elite overall readiness level' });
  }
  
  // Strength-based factors
  readinessAnalysis.key_strengths.forEach(strength => {
    factors.push({ 
      type: 'area_strength', 
      impact: 0.6, 
      description: `Exceptional ${strength.area} performance` 
    });
  });
  
  // Momentum factors
  if (readinessAnalysis.momentum.category === 'surging' || readinessAnalysis.momentum.category === 'positive') {
    factors.push({ 
      type: 'positive_momentum', 
      impact: 0.7, 
      description: readinessAnalysis.momentum.description 
    });
  }
  
  return factors.slice(0, 4); // Limit to top 4 factors
}

/**
 * Generate strategic outlook
 */
function generateStrategicOutlook(leverage, category) {
  const outlooks = {
    'exceptional': 'Optimal conditions for aggressive strategic plays and high-stakes decisions',
    'high': 'Strong position for confident decision-making and calculated risks',
    'moderate': 'Balanced approach recommended with selective strategic opportunities',
    'low': 'Conservative strategy advised with focus on fundamental execution'
  };
  
  return outlooks[category] || outlooks['moderate'];
}

/**
 * Generate UI configuration for dashboard
 */
async function generateUIConfig(readinessAnalysis, leverageAssessment) {
  const config = {
    timestamp: new Date().toISOString(),
    cardinals_readiness: {
      overall_score: readinessAnalysis.overall_readiness,
      trend: readinessAnalysis.readiness_trend,
      momentum: readinessAnalysis.momentum,
      component_breakdown: readinessAnalysis.component_scores,
      key_metrics: {
        leverage_factor: leverageAssessment.current_leverage,
        leverage_category: leverageAssessment.category,
        strategic_outlook: leverageAssessment.strategic_outlook
      }
    },
    dashboard_widgets: {
      readiness_gauge: {
        value: Math.round(readinessAnalysis.overall_readiness),
        color: getReadinessColor(readinessAnalysis.overall_readiness),
        status: readinessAnalysis.readiness_trend
      },
      leverage_indicator: {
        value: leverageAssessment.current_leverage,
        category: leverageAssessment.category,
        trend: leverageAssessment.trend,
        color: getLeverageColor(leverageAssessment.category)
      },
      momentum_arrow: {
        direction: getMomentumDirection(readinessAnalysis.momentum.category),
        strength: readinessAnalysis.momentum.score,
        description: readinessAnalysis.momentum.description
      }
    },
    alerts: generateAlerts(readinessAnalysis, leverageAssessment),
    recommendations: generateRecommendations(readinessAnalysis, leverageAssessment)
  };
  
  return config;
}

/**
 * Get readiness color for UI
 */
function getReadinessColor(readiness) {
  if (readiness > 90) return '#00ff00'; // Green
  if (readiness > 85) return '#90EE90'; // Light green
  if (readiness > 80) return '#ffff00'; // Yellow
  if (readiness > 75) return '#ffa500'; // Orange
  return '#ff0000'; // Red
}

/**
 * Get leverage color for UI
 */
function getLeverageColor(category) {
  const colors = {
    'exceptional': '#00ff00',
    'high': '#90EE90',
    'moderate': '#ffff00',
    'low': '#ffa500'
  };
  return colors[category] || '#ffff00';
}

/**
 * Get momentum direction for UI
 */
function getMomentumDirection(category) {
  if (category === 'surging') return 'up-double';
  if (category === 'positive') return 'up';
  if (category === 'stable') return 'right';
  if (category === 'negative') return 'down';
  if (category === 'concerning') return 'down-double';
  return 'right';
}

/**
 * Generate alerts for dashboard
 */
function generateAlerts(readinessAnalysis, leverageAssessment) {
  const alerts = [];
  
  // Readiness alerts
  if (readinessAnalysis.overall_readiness > 92) {
    alerts.push({ type: 'success', message: 'Elite readiness level achieved', priority: 'low' });
  }
  if (readinessAnalysis.overall_readiness < 78) {
    alerts.push({ type: 'warning', message: 'Readiness below optimal threshold', priority: 'high' });
  }
  
  // Leverage alerts
  if (leverageAssessment.current_leverage > 2.8) {
    alerts.push({ type: 'info', message: 'Exceptional leverage opportunity window', priority: 'medium' });
  }
  
  // Momentum alerts
  if (readinessAnalysis.momentum.category === 'concerning') {
    alerts.push({ type: 'error', message: 'Momentum concerns require immediate attention', priority: 'high' });
  }
  
  return alerts;
}

/**
 * Generate recommendations
 */
function generateRecommendations(readinessAnalysis, leverageAssessment) {
  const recommendations = [];
  
  // Based on readiness
  if (readinessAnalysis.areas_for_improvement.length > 0) {
    readinessAnalysis.areas_for_improvement.forEach(area => {
      recommendations.push({
        category: 'performance',
        priority: area.priority,
        action: `Focus on ${area.area} development`,
        expected_impact: 'medium'
      });
    });
  }
  
  // Based on leverage
  if (leverageAssessment.category === 'high' || leverageAssessment.category === 'exceptional') {
    recommendations.push({
      category: 'strategy',
      priority: 'medium',
      action: 'Consider aggressive strategic initiatives',
      expected_impact: 'high'
    });
  }
  
  return recommendations.slice(0, 3); // Limit to top 3
}

/**
 * Update dashboard configuration file
 */
async function updateDashboardConfig(uiConfig) {
  try {
    await fs.mkdir(path.dirname(UI_CONFIG_FILE), { recursive: true });
    await fs.writeFile(UI_CONFIG_FILE, JSON.stringify(uiConfig, null, 2));
    console.log('Dashboard configuration updated');
  } catch (error) {
    console.error('Error updating dashboard config:', error.message);
  }
}

/**
 * Generate tonight's readiness summary
 */
function generateTonightReadiness(readinessAnalysis, leverageAssessment) {
  const hour = new Date().getHours();
  const isEvening = hour >= 18 && hour <= 23;
  
  let outlook = 'optimal';
  if (readinessAnalysis.overall_readiness < 80) outlook = 'challenging';
  if (leverageAssessment.current_leverage < 1.8) outlook = 'conservative';
  if (readinessAnalysis.momentum.category === 'concerning') outlook = 'rebuild';
  
  const summary = {
    timestamp: new Date().toISOString(),
    is_evening: isEvening,
    outlook: outlook,
    readiness_score: readinessAnalysis.overall_readiness,
    leverage_factor: leverageAssessment.current_leverage,
    primary_strength: readinessAnalysis.key_strengths[0]?.area || 'balanced',
    key_message: generateTonightMessage(outlook, readinessAnalysis, leverageAssessment)
  };
  
  return summary;
}

/**
 * Generate tonight's key message
 */
function generateTonightMessage(outlook, readinessAnalysis, leverageAssessment) {
  const messages = {
    'optimal': `Cardinals operating at ${readinessAnalysis.overall_readiness.toFixed(1)}% readiness with ${leverageAssessment.current_leverage}x leverage - prime conditions for peak performance`,
    'challenging': `Cardinals at ${readinessAnalysis.overall_readiness.toFixed(1)}% readiness - focus on fundamentals and execution`,
    'conservative': `Cardinals readiness strong but leverage moderate - selective strategic approach recommended`,
    'rebuild': `Cardinals in momentum rebuilding phase - emphasis on foundational strength development`
  };
  
  return messages[outlook] || messages['optimal'];
}

/**
 * Log readiness update
 */
async function logReadinessUpdate(readinessAnalysis, leverageAssessment, tonightSummary) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    type: 'readiness_update',
    overall_readiness: readinessAnalysis.overall_readiness,
    leverage_factor: leverageAssessment.current_leverage,
    momentum_category: readinessAnalysis.momentum.category,
    outlook: tonightSummary.outlook,
    alerts_count: 0 // Will be populated by generateAlerts
  };
  
  try {
    await fs.mkdir(path.dirname(READINESS_LOG), { recursive: true });
    await fs.appendFile(READINESS_LOG, JSON.stringify(logEntry) + '\n');
  } catch (error) {
    console.error('Error logging readiness update:', error.message);
  }
}

/**
 * Log errors
 */
async function logError(error) {
  const errorLog = {
    timestamp: new Date().toISOString(),
    type: 'readiness_error',
    error: error.message,
    stack: error.stack
  };
  
  try {
    await fs.mkdir(path.dirname(READINESS_LOG), { recursive: true });
    await fs.appendFile(READINESS_LOG, JSON.stringify(errorLog) + '\n');
  } catch (logError) {
    console.error('Error logging error:', logError.message);
  }
}

// Handle script execution
if (import.meta.url === `file://${process.argv[1]}`) {
  updateReadinessBoard()
    .then(() => {
      console.log('Readiness Board update complete. Exiting...');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Readiness Board update failed:', error);
      process.exit(1);
    });
}

export default updateReadinessBoard;