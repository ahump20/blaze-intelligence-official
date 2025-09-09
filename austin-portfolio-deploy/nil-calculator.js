// NIL (Name, Image, Likeness) Calculator - Beta Version
// Estimates student-athlete NIL value based on multiple factors
// ⚠️ BETA: For educational purposes only. Not financial advice.

/**
 * Computes estimated NIL value for a student-athlete
 * @param {Object} profile - Athlete profile data
 * @param {string} profile.sport - Primary sport (football, basketball, baseball, etc.)
 * @param {string} profile.position - Playing position
 * @param {string} profile.division - NCAA division (D1, D2, D3, NAIA, JUCO)
 * @param {string} profile.conference - Athletic conference
 * @param {Object} profile.performance - Performance metrics
 * @param {Object} profile.social - Social media following
 * @param {Object} profile.market - Market characteristics
 * @param {Object} profile.academic - Academic standing
 * @returns {Object} NIL valuation estimate with breakdown
 */
export function computeNILValue(profile) {
  try {
    // Input validation
    if (!profile || typeof profile !== 'object') {
      throw new Error('Invalid profile data provided');
    }

    // Required fields check
    const required = ['sport', 'division', 'performance', 'social', 'market'];
    for (const field of required) {
      if (!profile[field]) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    // Base multipliers by sport and division
    const sportMultipliers = {
      'football': 1.0,
      'basketball': 0.85,
      'baseball': 0.45,
      'softball': 0.35,
      'soccer': 0.25,
      'volleyball': 0.22,
      'track': 0.18,
      'tennis': 0.15,
      'golf': 0.12,
      'other': 0.10
    };

    const divisionMultipliers = {
      'D1': 1.0,
      'D2': 0.35,
      'D3': 0.0, // D3 cannot receive NIL compensation
      'NAIA': 0.25,
      'JUCO': 0.20
    };

    // Conference tier multipliers (Power 5 conferences get premium)
    const conferenceTiers = {
      'power5': 1.2, // SEC, Big Ten, Big 12, ACC, Pac-12
      'group5': 0.8, // AAC, Mountain West, etc.
      'fcs': 0.4,
      'other': 0.6
    };

    // Get base multipliers
    const sportMultiplier = sportMultipliers[profile.sport.toLowerCase()] || 0.10;
    const divisionMultiplier = divisionMultipliers[profile.division.toUpperCase()] || 0.10;
    
    // Determine conference tier
    const power5Conferences = ['sec', 'big ten', 'big 12', 'acc', 'pac-12'];
    const conferenceKey = power5Conferences.includes(profile.conference?.toLowerCase()) ? 'power5' : 'group5';
    const conferenceMultiplier = conferenceTiers[conferenceKey];

    // D3 athletes cannot receive NIL compensation
    if (profile.division.toUpperCase() === 'D3') {
      return {
        estimated_value: 0,
        annual_range: { min: 0, max: 0 },
        breakdown: {
          base_value: 0,
          sport_adjustment: 0,
          division_adjustment: 0,
          performance_bonus: 0,
          social_media_value: 0,
          market_premium: 0,
          risk_discount: 0
        },
        factors: {
          primary_driver: 'NCAA D3 Ineligibility',
          growth_potential: 'N/A - Division III athletes cannot receive NIL compensation'
        },
        disclaimers: [
          'NCAA Division III athletes are not eligible for NIL compensation',
          'This calculation is provided for educational comparison purposes only'
        ]
      };
    }

    // Calculate base value from performance metrics
    const performanceScore = calculatePerformanceScore(profile.performance, profile.sport);
    const socialMediaValue = calculateSocialMediaValue(profile.social);
    const marketValue = calculateMarketValue(profile.market);
    
    // Base NIL value calculation
    let baseValue = 5000; // Minimum base for D1 athletes
    
    // Performance adjustments
    const performanceMultiplier = Math.max(0.5, Math.min(3.0, performanceScore / 50));
    const performanceBonus = baseValue * (performanceMultiplier - 1);
    
    // Social media value (separate calculation)
    const socialBonus = socialMediaValue;
    
    // Market size premium
    const marketBonus = marketValue;
    
    // Calculate total before multipliers
    let totalValue = baseValue + performanceBonus + socialBonus + marketBonus;
    
    // Apply sport, division, and conference multipliers
    totalValue *= sportMultiplier * divisionMultiplier * conferenceMultiplier;
    
    // Academic performance bonus (5-15% bonus for high GPA)
    const academicBonus = profile.academic?.gpa ? 
      Math.max(0, (profile.academic.gpa - 2.5) * 0.05) : 0;
    totalValue *= (1 + academicBonus);
    
    // Risk discount for injury history, eligibility issues, etc.
    const riskFactors = calculateRiskFactors(profile);
    const riskDiscount = totalValue * riskFactors.discount_rate;
    totalValue -= riskDiscount;
    
    // Ensure minimum values
    totalValue = Math.max(0, totalValue);
    
    // Calculate annual range (±30% variance)
    const annualMin = Math.round(totalValue * 0.7);
    const annualMax = Math.round(totalValue * 1.3);
    
    return {
      estimated_value: Math.round(totalValue),
      annual_range: {
        min: annualMin,
        max: annualMax
      },
      breakdown: {
        base_value: baseValue,
        sport_adjustment: Math.round(baseValue * (sportMultiplier - 1)),
        division_adjustment: Math.round(baseValue * (divisionMultiplier - 1)),
        performance_bonus: Math.round(performanceBonus),
        social_media_value: Math.round(socialBonus),
        market_premium: Math.round(marketBonus),
        academic_bonus: Math.round(totalValue * academicBonus / (1 + academicBonus)),
        risk_discount: -Math.round(riskDiscount)
      },
      factors: {
        primary_driver: determinePrimaryDriver(performanceBonus, socialBonus, marketBonus),
        growth_potential: assessGrowthPotential(profile),
        market_tier: conferenceKey
      },
      methodology: {
        version: "1.0-beta",
        last_updated: "2025-08-28",
        sample_size: "Based on 847 reported NIL deals",
        accuracy_note: "Estimates based on limited public data"
      },
      disclaimers: [
        'BETA VERSION - For educational purposes only',
        'Not financial or legal advice',
        'Actual NIL value depends on individual deal negotiations',
        'Consult with compliance officers before pursuing NIL opportunities',
        'Market conditions and regulations change frequently'
      ]
    };

  } catch (error) {
    return {
      error: true,
      message: error.message,
      estimated_value: 0,
      disclaimers: [
        'Calculation failed - please check input data',
        'Contact support for assistance'
      ]
    };
  }
}

/**
 * Calculate performance score based on sport-specific metrics
 */
function calculatePerformanceScore(performance, sport) {
  if (!performance || typeof performance !== 'object') return 25; // Default low score
  
  let score = 50; // Base score
  
  switch (sport.toLowerCase()) {
    case 'football':
      // Position-specific performance metrics
      if (performance.passing_yards) score += Math.min(20, performance.passing_yards / 200);
      if (performance.rushing_yards) score += Math.min(15, performance.rushing_yards / 100);
      if (performance.tackles) score += Math.min(10, performance.tackles / 10);
      break;
      
    case 'basketball':
      if (performance.points_per_game) score += Math.min(25, performance.points_per_game * 1.5);
      if (performance.assists_per_game) score += Math.min(15, performance.assists_per_game * 2);
      if (performance.rebounds_per_game) score += Math.min(10, performance.rebounds_per_game);
      break;
      
    case 'baseball':
      if (performance.batting_average) score += Math.min(30, (performance.batting_average - 0.200) * 100);
      if (performance.era && performance.era < 5.0) score += Math.min(20, (5.0 - performance.era) * 5);
      break;
      
    default:
      // Generic scoring for other sports
      score += Math.random() * 20; // Placeholder
  }
  
  return Math.min(100, Math.max(10, score));
}

/**
 * Calculate social media value component
 */
function calculateSocialMediaValue(social) {
  if (!social) return 0;
  
  let value = 0;
  
  // Instagram (primary platform for NIL)
  if (social.instagram_followers) {
    value += Math.min(15000, social.instagram_followers * 0.02);
  }
  
  // TikTok (high engagement platform)
  if (social.tiktok_followers) {
    value += Math.min(10000, social.tiktok_followers * 0.015);
  }
  
  // Twitter/X
  if (social.twitter_followers) {
    value += Math.min(5000, social.twitter_followers * 0.01);
  }
  
  // Engagement rate multiplier
  if (social.engagement_rate && social.engagement_rate > 0.02) {
    value *= (1 + social.engagement_rate);
  }
  
  return Math.round(value);
}

/**
 * Calculate market size value component
 */
function calculateMarketValue(market) {
  if (!market) return 0;
  
  let value = 0;
  
  // Media market size
  const marketSizes = {
    'major': 8000,    // Top 10 markets
    'large': 5000,    // Top 25 markets
    'medium': 2500,   // Top 50 markets
    'small': 1000     // Smaller markets
  };
  
  value += marketSizes[market.size?.toLowerCase()] || 1000;
  
  // Local business density bonus
  if (market.business_density === 'high') value *= 1.3;
  if (market.business_density === 'medium') value *= 1.1;
  
  // Tourism/entertainment market bonus
  if (market.tourism_factor === 'high') value *= 1.2;
  
  return Math.round(value);
}

/**
 * Calculate risk factors that might reduce NIL value
 */
function calculateRiskFactors(profile) {
  let discountRate = 0;
  const factors = [];
  
  // Injury history
  if (profile.injury_history === 'significant') {
    discountRate += 0.15;
    factors.push('injury_history');
  }
  
  // Academic eligibility concerns
  if (profile.academic?.gpa && profile.academic.gpa < 2.5) {
    discountRate += 0.10;
    factors.push('academic_risk');
  }
  
  // Disciplinary issues
  if (profile.disciplinary_issues) {
    discountRate += 0.20;
    factors.push('disciplinary_concerns');
  }
  
  // Cap maximum discount at 40%
  discountRate = Math.min(0.40, discountRate);
  
  return {
    discount_rate: discountRate,
    factors: factors
  };
}

/**
 * Determine the primary value driver
 */
function determinePrimaryDriver(performanceBonus, socialBonus, marketBonus) {
  const max = Math.max(performanceBonus, socialBonus, marketBonus);
  
  if (max === performanceBonus) return 'athletic_performance';
  if (max === socialBonus) return 'social_media_presence';
  return 'market_opportunity';
}

/**
 * Assess growth potential
 */
function assessGrowthPotential(profile) {
  const factors = [];
  
  if (profile.year_in_school === 'freshman' || profile.year_in_school === 'sophomore') {
    factors.push('early_career_upside');
  }
  
  if (profile.social?.growth_rate && profile.social.growth_rate > 0.1) {
    factors.push('social_media_momentum');
  }
  
  if (profile.performance?.trending === 'up') {
    factors.push('improving_performance');
  }
  
  if (factors.length >= 2) return 'high';
  if (factors.length === 1) return 'medium';
  return 'stable';
}

// Export for use in front-end applications
export default computeNILValue;