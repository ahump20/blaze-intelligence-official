/**
 * Blaze Intelligence - Video Intelligence Utilities
 * Helper functions for championship-level analysis
 */

import { BLAZE_CONFIG } from './config';
import type {
  BiomechanicalFrame,
  PerformanceMetrics,
  ActionableInsight,
  EliteComparison,
  AnalysisResults,
} from './types';

/**
 * Calculate overall confidence score for analysis
 */
export function calculateConfidenceScore(frames: BiomechanicalFrame[]): number {
  if (!frames || frames.length === 0) return 0;
  
  const confidences = frames.map(f => f.confidence);
  const mean = confidences.reduce((a, b) => a + b, 0) / confidences.length;
  
  // Apply weighted scoring based on frame importance
  const criticalFrames = identifyCriticalFrames(frames);
  const criticalConfidence = criticalFrames
    .map(f => f.confidence)
    .reduce((a, b) => a + b, 0) / criticalFrames.length;
  
  // Weight critical frames more heavily
  return mean * 0.6 + criticalConfidence * 0.4;
}

/**
 * Generate comprehensive insight report
 */
export function generateInsightReport(
  insights: ActionableInsight[],
  metrics: PerformanceMetrics,
  sport: string
): {
  executive_summary: string;
  priority_actions: string[];
  timeline: any;
  expectedOutcomes: string[];
} {
  const highPriorityInsights = insights.filter(i => i.priority === 'HIGH');
  const mediumPriorityInsights = insights.filter(i => i.priority === 'MEDIUM');
  
  const executive_summary = `
    Analysis identified ${highPriorityInsights.length} critical improvements and 
    ${mediumPriorityInsights.length} optimization opportunities for ${sport} performance.
    Implementing recommended corrections could yield ${estimateImprovement(insights)}% 
    performance improvement within ${estimateTimeframe(insights)} weeks.
  `.trim();
  
  const priority_actions = highPriorityInsights
    .slice(0, 3)
    .map(i => `${i.title}: ${i.correction}`);
  
  const timeline = generateImplementationTimeline(insights);
  
  const expectedOutcomes = generateExpectedOutcomes(insights, metrics);
  
  return {
    executive_summary,
    priority_actions,
    timeline,
    expectedOutcomes,
  };
}

/**
 * Compare performance to elite benchmarks
 */
export async function compareToEliteBenchmarks(
  metrics: PerformanceMetrics,
  sport: string,
  position?: string
): Promise<EliteComparison[]> {
  const benchmarks = await fetchEliteBenchmarks(sport, position);
  const comparisons: EliteComparison[] = [];
  
  for (const [category, categoryMetrics] of Object.entries(metrics.values)) {
    for (const [metric, value] of Object.entries(categoryMetrics as any)) {
      const benchmark = benchmarks[category]?.[metric];
      
      if (benchmark && typeof value === 'number') {
        const percentile = calculatePercentile(value, benchmark);
        
        comparisons.push({
          metric: `${category}.${metric}`,
          athleteValue: value,
          eliteAverage: benchmark.average,
          eliteTop10: benchmark.top10,
          percentile,
          gap: benchmark.top10 - value,
          improvementPath: generateImprovementPath(metric, value, benchmark),
        });
      }
    }
  }
  
  return comparisons.sort((a, b) => a.percentile - b.percentile);
}

/**
 * Export analysis data in various formats
 */
export function exportAnalysisData(
  results: AnalysisResults,
  format: 'json' | 'csv' | 'xml' | 'binary'
): string | ArrayBuffer {
  switch (format) {
    case 'json':
      return JSON.stringify(results, null, 2);
      
    case 'csv':
      return convertToCSV(results);
      
    case 'xml':
      return convertToXML(results);
      
    case 'binary':
      return convertToBinary(results);
      
    default:
      throw new Error(`Unsupported format: ${format}`);
  }
}

/**
 * Identify critical frames in the motion
 */
function identifyCriticalFrames(frames: BiomechanicalFrame[]): BiomechanicalFrame[] {
  const critical: BiomechanicalFrame[] = [];
  
  // Identify frames with high force generation
  const maxForce = Math.max(...frames.map(f => f.forces?.totalMagnitude || 0));
  const forceThreshold = maxForce * 0.8;
  
  // Identify frames at key positions
  frames.forEach((frame, index) => {
    // High force frames
    if (frame.forces?.totalMagnitude >= forceThreshold) {
      critical.push(frame);
    }
    
    // Contact/release points
    if (isContactPoint(frame, frames[index - 1])) {
      critical.push(frame);
    }
    
    // Maximum angle frames
    if (isMaxAngleFrame(frame, frames)) {
      critical.push(frame);
    }
  });
  
  return critical;
}

/**
 * Check if frame is a contact point
 */
function isContactPoint(current: BiomechanicalFrame, previous?: BiomechanicalFrame): boolean {
  if (!previous) return false;
  
  // Check for sudden force spike
  const currentForce = current.forces?.totalMagnitude || 0;
  const previousForce = previous.forces?.totalMagnitude || 0;
  
  return currentForce > previousForce * 2;
}

/**
 * Check if frame has maximum angle
 */
function isMaxAngleFrame(frame: BiomechanicalFrame, allFrames: BiomechanicalFrame[]): boolean {
  if (!frame.angles) return false;
  
  for (const [angleName, angleData] of Object.entries(frame.angles)) {
    const allValues = allFrames
      .map(f => f.angles?.[angleName]?.degrees || 0)
      .filter(v => v > 0);
    
    const maxValue = Math.max(...allValues);
    
    if (angleData.degrees >= maxValue * 0.95) {
      return true;
    }
  }
  
  return false;
}

/**
 * Estimate performance improvement potential
 */
function estimateImprovement(insights: ActionableInsight[]): number {
  const highImpact = insights.filter(i => i.priority === 'HIGH').length * 3;
  const mediumImpact = insights.filter(i => i.priority === 'MEDIUM').length * 1.5;
  const lowImpact = insights.filter(i => i.priority === 'LOW').length * 0.5;
  
  const totalImpact = highImpact + mediumImpact + lowImpact;
  
  // Cap at realistic improvement percentage
  return Math.min(25, Math.round(totalImpact));
}

/**
 * Estimate implementation timeframe
 */
function estimateTimeframe(insights: ActionableInsight[]): number {
  if (insights.length === 0) return 0;
  
  const timelines = insights.map(i => i.timelineWeeks);
  return Math.max(...timelines);
}

/**
 * Generate implementation timeline
 */
function generateImplementationTimeline(insights: ActionableInsight[]): any {
  const timeline = {
    week1_2: [] as string[],
    week3_4: [] as string[],
    week5_8: [] as string[],
    week9_12: [] as string[],
    beyond: [] as string[],
  };
  
  insights.forEach(insight => {
    if (insight.timelineWeeks <= 2) {
      timeline.week1_2.push(insight.title);
    } else if (insight.timelineWeeks <= 4) {
      timeline.week3_4.push(insight.title);
    } else if (insight.timelineWeeks <= 8) {
      timeline.week5_8.push(insight.title);
    } else if (insight.timelineWeeks <= 12) {
      timeline.week9_12.push(insight.title);
    } else {
      timeline.beyond.push(insight.title);
    }
  });
  
  return timeline;
}

/**
 * Generate expected outcomes
 */
function generateExpectedOutcomes(
  insights: ActionableInsight[],
  metrics: PerformanceMetrics
): string[] {
  const outcomes: string[] = [];
  
  // Calculate potential improvements
  const mechanicalInsights = insights.filter(i => i.category === 'MECHANICAL');
  if (mechanicalInsights.length > 0) {
    outcomes.push(`${mechanicalInsights.length * 2-3}% increase in mechanical efficiency`);
  }
  
  const injuryInsights = insights.filter(i => i.category === 'INJURY_PREVENTION');
  if (injuryInsights.length > 0) {
    outcomes.push(`${injuryInsights.length * 15}% reduction in injury risk factors`);
  }
  
  const performanceInsights = insights.filter(i => i.category === 'PERFORMANCE');
  if (performanceInsights.length > 0) {
    outcomes.push(`${performanceInsights.length * 3-5}% improvement in key performance metrics`);
  }
  
  return outcomes;
}

/**
 * Fetch elite benchmarks from database
 */
async function fetchEliteBenchmarks(sport: string, position?: string): Promise<any> {
  // This would connect to actual benchmark database
  // For now, return mock data
  return {
    hitting: {
      exitVelocity: { average: 95, top10: 105 },
      launchAngle: { average: 25, top10: 28 },
      batSpeed: { average: 75, top10: 82 },
    },
    pitching: {
      velocity: { average: 92, top10: 98 },
      spinRate: { average: 2400, top10: 2800 },
    },
  };
}

/**
 * Calculate percentile ranking
 */
function calculatePercentile(value: number, benchmark: any): number {
  const { average, top10 } = benchmark;
  
  if (value >= top10) return 95;
  if (value >= average) {
    return 50 + ((value - average) / (top10 - average)) * 45;
  }
  
  return Math.max(5, (value / average) * 50);
}

/**
 * Generate improvement path
 */
function generateImprovementPath(metric: string, current: number, benchmark: any): string {
  const gap = benchmark.top10 - current;
  const percentageGap = (gap / current) * 100;
  
  if (percentageGap < 5) {
    return 'Elite level - maintain and refine';
  } else if (percentageGap < 10) {
    return 'Near elite - focused refinement needed';
  } else if (percentageGap < 20) {
    return 'Strong foundation - systematic improvement plan';
  } else {
    return 'Development phase - comprehensive training program';
  }
}

/**
 * Convert results to CSV format
 */
function convertToCSV(results: AnalysisResults): string {
  const rows: string[] = [];
  
  // Header
  rows.push('Timestamp,Metric,Value,Unit,Confidence');
  
  // Metrics
  for (const [category, metrics] of Object.entries(results.metrics.values)) {
    for (const [metric, value] of Object.entries(metrics as any)) {
      rows.push(`${results.metrics.timestamp},${category}.${metric},${value},,${results.confidence}`);
    }
  }
  
  // Insights
  results.insights.forEach(insight => {
    rows.push(`${results.metrics.timestamp},insight.${insight.category},${insight.title},,${insight.confidenceScore}`);
  });
  
  return rows.join('\n');
}

/**
 * Convert results to XML format
 */
function convertToXML(results: AnalysisResults): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<BlazeIntelligenceAnalysis>\n';
  xml += `  <timestamp>${results.metrics.timestamp}</timestamp>\n`;
  xml += `  <sport>${results.metrics.sport}</sport>\n`;
  xml += `  <confidence>${results.confidence}</confidence>\n`;
  
  xml += '  <metrics>\n';
  for (const [category, metrics] of Object.entries(results.metrics.values)) {
    xml += `    <${category}>\n`;
    for (const [metric, value] of Object.entries(metrics as any)) {
      xml += `      <${metric}>${value}</${metric}>\n`;
    }
    xml += `    </${category}>\n`;
  }
  xml += '  </metrics>\n';
  
  xml += '  <insights>\n';
  results.insights.forEach(insight => {
    xml += '    <insight>\n';
    xml += `      <priority>${insight.priority}</priority>\n`;
    xml += `      <title>${insight.title}</title>\n`;
    xml += `      <description>${insight.description}</description>\n`;
    xml += `      <confidence>${insight.confidenceScore}</confidence>\n`;
    xml += '    </insight>\n';
  });
  xml += '  </insights>\n';
  
  xml += '</BlazeIntelligenceAnalysis>';
  
  return xml;
}

/**
 * Convert results to binary format
 */
function convertToBinary(results: AnalysisResults): ArrayBuffer {
  // Serialize to binary format for efficient storage
  const json = JSON.stringify(results);
  const encoder = new TextEncoder();
  return encoder.encode(json).buffer;
}

/**
 * Validate video file
 */
export function validateVideoFile(file: File): {
  valid: boolean;
  error?: string;
} {
  const maxSize = 500 * 1024 * 1024; // 500MB
  const validFormats = ['.mp4', '.mov', '.avi', '.webm'];
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File too large. Maximum size is 500MB.`,
    };
  }
  
  const extension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
  if (!validFormats.includes(extension)) {
    return {
      valid: false,
      error: `Invalid format. Supported formats: ${validFormats.join(', ')}`,
    };
  }
  
  return { valid: true };
}

/**
 * Generate unique analysis ID
 */
export function generateAnalysisId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substr(2, 9);
  return `blaze_analysis_${timestamp}_${random}`;
}

/**
 * Format duration for display
 */
export function formatDuration(milliseconds: number): string {
  const seconds = Math.floor(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

export default {
  calculateConfidenceScore,
  generateInsightReport,
  compareToEliteBenchmarks,
  exportAnalysisData,
  validateVideoFile,
  generateAnalysisId,
  formatDuration,
};
