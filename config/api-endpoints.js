// API Configuration
// Temporary using pages.dev until Cloudflare Access is removed

export const API_CONFIG = {
  // Base API URL - switch to https://blaze-intelligence.com after CF Access removal
  API_BASE: 'https://blaze-intelligence.pages.dev',
  
  // Worker endpoints
  LEAD_CAPTURE_WORKER: 'https://blaze-lead-capture.humphrey-austin20.workers.dev',
  
  // Data endpoints
  CARDINALS_DATA: 'https://raw.githubusercontent.com/ahump20/Cardinals-Readiness-Board/main/data/cardinals_live_data.json',
  
  // HubSpot Configuration (replace with your actual IDs)
  HUBSPOT_PORTAL_ID: '45558709',  // Replace with your HubSpot portal ID
  HUBSPOT_FORM_ID: 'c7e2c9d3-5f8a-4b2e-9e1a-3d4f5e6a7b8c',  // Replace with your form ID
  
  // Analytics endpoints
  ANALYTICS_BASE: 'https://blaze-intelligence.pages.dev/api',
  
  // Monitoring endpoints
  HEALTH_CHECK: '/api/health',
  METRICS: '/api/metrics',
  
  // AI Service endpoints
  OPENAI_ANALYZE: '/api/ai/openai/analyze-team',
  ANTHROPIC_PREDICT: '/api/ai/anthropic/predict-championship',
  GEMINI_HIGHLIGHTS: '/api/ai/gemini/analyze-highlights'
};

// Helper function to build full URLs
export function buildApiUrl(endpoint) {
  return `${API_CONFIG.API_BASE}${endpoint}`;
}

// Helper function for external data sources
export function getDataSourceUrl(source) {
  switch(source) {
    case 'cardinals':
      return API_CONFIG.CARDINALS_DATA;
    case 'lead-capture':
      return API_CONFIG.LEAD_CAPTURE_WORKER;
    default:
      return `${API_CONFIG.API_BASE}/api/data/${source}`;
  }
}