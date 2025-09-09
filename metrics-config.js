// Canonical metrics configuration for Blaze Intelligence
// Single source of truth for all platform claims and statistics

export const BLAZE_METRICS = {
  accuracy: {
    value: "94.6%",
    description: "Prediction accuracy (rolling 12 months)",
    period: "12 months"
  },
  data_points: {
    value: "2.8M+",
    description: "Data points analyzed daily"
  },
  availability: {
    uptime_percentage: "99.9",
    response_time_ms: 182,
    description: "Platform availability"
  },
  cost_savings: {
    minimum_percentage: 67,
    maximum_percentage: 80,
    description: "Cost savings vs competitors"
  },
  pricing: {
    annual_fee: 1188,
    monthly_fee: 99,
    enterprise_fee: 299,
    description: "Platform pricing"
  },
  performance: {
    events_per_second: "100K+",
    latency_p95_ms: 100,
    description: "System performance"
  },
  value: {
    nil_value_identified: "$42.3M",
    description: "NIL value identified"
  }
};

export function formatMetric(metricPath) {
  const parts = metricPath.split('.');
  let value = BLAZE_METRICS;
  for (const part of parts) {
    value = value[part];
    if (!value) return '';
  }
  return typeof value === 'object' ? value.value : value;
}