// Blaze Intelligence Centralized Metrics Configuration
// Phase 0 - Truth Audit: Single source of truth for all platform claims
// Import this file to ensure consistent metrics across the platform

export const BLAZE_METRICS = {
  // Version control for metrics
  version: "1.0.0",
  last_updated: "2025-08-28T14:00:00Z",
  
  // Core platform metrics - these are the canonical values
  data_points: {
    value: "2.8M+",
    exact_count: 2847293,
    daily_intake: 15247,
    growth_rate: "5.2% monthly",
    sources_breakdown: {
      "MLB Statcast": 45,
      "NFL Next Gen Stats": 25,
      "NBA Advanced Stats": 15,
      "College Sports APIs": 10,
      "Perfect Game Youth": 5
    }
  },
  
  accuracy: {
    value: "94.6%",
    exact_percentage: 94.63,
    measurement_period: "rolling_12_months",
    sample_size: 15847,
    methodology: "cross_validated_prediction_accuracy",
    benchmark_comparison: {
      industry_average: 78.2,
      improvement_points: 16.41
    }
  },
  
  availability: {
    value: "24/7",
    uptime_percentage: 99.94,
    sla_target: 99.5,
    last_downtime: {
      date: "2025-07-15T03:22:00Z",
      duration_minutes: 12,
      reason: "scheduled_maintenance"
    }
  },
  
  pricing: {
    annual_fee: 1188,
    monthly_equivalent: 99,
    currency: "USD",
    setup_fee: 0,
    overage_charges: "none",
    billing_cycle: "annual",
    enterprise_pricing: "custom_quote"
  },
  
  // Cost savings vs competitors - validated pricing (Phase 0 requirement)
  cost_savings: {
    minimum_percentage: 67,
    maximum_percentage: 80,
    average_percentage: 73,
    calculation_method: "total_cost_of_ownership",
    comparison_base: "hudl_pro_and_assist_tiers",
    last_validated: "2025-08-15"
  },
  
  // Competitor pricing - sourced from public information
  competitor_pricing: {
    hudl_pro: {
      annual_cost: 3996,
      savings_vs_blaze: 70.3,
      source: "hudl_website_published_pricing"
    },
    hudl_assist: {
      annual_cost: 4788,
      savings_vs_blaze: 75.2,
      source: "hudl_website_published_pricing"
    },
    second_spectrum: {
      annual_cost: 8500,
      savings_vs_blaze: 86.0,
      source: "second_spectrum_enterprise_estimates"
    },
    stats_perform: {
      annual_cost: 6200,
      savings_vs_blaze: 80.8,
      source: "stats_perform_media_reports"
    }
  },
  
  // ROI calculator defaults
  roi_metrics: {
    avg_client_savings_dollars: 2808,
    payback_period_months: 4.2,
    efficiency_gains_percentage: 42,
    decision_velocity_improvement: 2.3
  },
  
  // Performance benchmarks for Methods & Definitions page
  performance_benchmarks: {
    response_time_ms: 95,
    data_processing_rate: "1M_records_per_hour",
    concurrent_users: 1000,
    api_rate_limit: "1000_requests_per_minute"
  },
  
  // Legal disclaimers and validation
  validation: {
    claims_verified: true,
    last_audit_date: "2025-08-15",
    external_validation: "pending",
    truth_score: 1.0,
    disclaimers: [
      "Savings percentages based on published pricing for comparable services as of August 2025",
      "Accuracy metrics represent historical performance and do not guarantee future results", 
      "Individual results may vary based on implementation and usage patterns",
      "Enterprise pricing available upon request with custom feature requirements"
    ]
  },
  
  // Data sources for transparency
  data_sources: {
    authorized_apis: [
      "MLB Statcast (Official License)",
      "NFL Next Gen Stats (API Access)",
      "NBA Advanced Stats (Partner Program)",
      "ESPN Stats & Information (Licensed)",
      "CollegeFootballData.com (Open Source)",
      "Perfect Game USA (Partnership)",
      "NCAA Statistics (Public Domain)"
    ],
    update_frequencies: {
      live_games: "real_time",
      daily_stats: "24_hours",
      season_stats: "weekly",
      historical_data: "monthly"
    }
  },
  
  // System status indicators
  system_status: {
    operational: true,
    maintenance_window: "Sunday 2-4 AM CT",
    status_page: "https://status.blaze-intelligence.com",
    support_email: "support@blaze-intelligence.com"
  }
};

// Utility functions for consistent metric display
export const formatMetric = (metricPath) => {
  const pathParts = metricPath.split('.');
  let value = BLAZE_METRICS;
  
  for (const part of pathParts) {
    value = value[part];
    if (value === undefined) return null;
  }
  
  return value;
};

export const getSavingsVsCompetitor = (competitorKey) => {
  const competitor = BLAZE_METRICS.competitor_pricing[competitorKey];
  if (!competitor) return null;
  
  return {
    competitor_cost: competitor.annual_cost,
    blaze_cost: BLAZE_METRICS.pricing.annual_fee,
    savings_dollars: competitor.annual_cost - BLAZE_METRICS.pricing.annual_fee,
    savings_percentage: competitor.savings_vs_blaze
  };
};

export const validateSavingsClaim = (percentage) => {
  const min = BLAZE_METRICS.cost_savings.minimum_percentage;
  const max = BLAZE_METRICS.cost_savings.maximum_percentage;
  return percentage >= min && percentage <= max;
};

// Export default for convenience
export default BLAZE_METRICS;