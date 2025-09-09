// Blaze Intelligence API Documentation Component
// Interactive Swagger UI implementation

import React, { useEffect, useState } from 'react';
import SwaggerUI from 'swagger-ui-react';
import 'swagger-ui-react/swagger-ui.css';
import { useAnalytics } from '../blaze-analytics/analytics';

// Custom Swagger UI theme matching Blaze Intelligence brand
const customStyles = `
  /* Blaze Intelligence Swagger Theme */
  .swagger-ui {
    font-family: 'Inter', system-ui, sans-serif;
  }

  .swagger-ui .topbar {
    background-color: #002244;
    padding: 1rem;
  }

  .swagger-ui .topbar .download-url-wrapper {
    display: none;
  }

  .swagger-ui .info .title {
    color: #BF5700;
    font-family: 'Neue Haas Grotesk Display', sans-serif;
    font-weight: 700;
  }

  .swagger-ui .info .title small {
    background: linear-gradient(135deg, #BF5700 0%, #9BCBEB 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    font-weight: 600;
  }

  .swagger-ui .scheme-container {
    background: #36454F;
    border: 1px solid rgba(191, 87, 0, 0.2);
    border-radius: 8px;
    padding: 1rem;
  }

  .swagger-ui .opblock.opblock-post {
    border-color: #BF5700;
    background: rgba(191, 87, 0, 0.1);
  }

  .swagger-ui .opblock.opblock-post .opblock-summary-method {
    background: #BF5700;
  }

  .swagger-ui .opblock.opblock-get {
    border-color: #9BCBEB;
    background: rgba(155, 203, 235, 0.1);
  }

  .swagger-ui .opblock.opblock-get .opblock-summary-method {
    background: #9BCBEB;
    color: #002244;
  }

  .swagger-ui .opblock.opblock-put {
    border-color: #00B2A9;
    background: rgba(0, 178, 169, 0.1);
  }

  .swagger-ui .opblock.opblock-put .opblock-summary-method {
    background: #00B2A9;
  }

  .swagger-ui .opblock.opblock-delete {
    border-color: #FF3D00;
    background: rgba(255, 61, 0, 0.1);
  }

  .swagger-ui .btn.authorize {
    background: #BF5700;
    border-color: #BF5700;
    color: white;
  }

  .swagger-ui .btn.authorize:hover {
    background: #9C4500;
    border-color: #9C4500;
  }

  .swagger-ui .btn.execute {
    background: #00B2A9;
    border-color: #00B2A9;
  }

  .swagger-ui .btn.execute:hover {
    background: #008E87;
    border-color: #008E87;
  }

  .swagger-ui select {
    background: #36454F;
    color: #FAFAFA;
    border: 1px solid rgba(191, 87, 0, 0.3);
  }

  .swagger-ui .model-box {
    background: rgba(54, 69, 79, 0.1);
    border: 1px solid rgba(191, 87, 0, 0.2);
    border-radius: 4px;
  }

  .swagger-ui .response-col_status {
    color: #00B2A9;
    font-weight: 600;
  }

  .swagger-ui table tbody tr td {
    border-bottom: 1px solid rgba(229, 228, 226, 0.1);
  }

  .swagger-ui .parameter__name {
    color: #BF5700;
    font-weight: 600;
  }

  .swagger-ui .parameter__type {
    color: #9BCBEB;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.875rem;
  }

  /* Custom scrollbar */
  .swagger-ui ::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }

  .swagger-ui ::-webkit-scrollbar-track {
    background: #36454F;
  }

  .swagger-ui ::-webkit-scrollbar-thumb {
    background: #BF5700;
    border-radius: 4px;
  }

  .swagger-ui ::-webkit-scrollbar-thumb:hover {
    background: #9C4500;
  }
`;

interface APIDocumentationProps {
  specUrl?: string;
  spec?: any;
  apiKey?: string;
}

export const APIDocumentation: React.FC<APIDocumentationProps> = ({
  specUrl = '/api/openapi.json',
  spec,
  apiKey
}) => {
  const { track } = useAnalytics();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Inject custom styles
    const styleElement = document.createElement('style');
    styleElement.innerHTML = customStyles;
    document.head.appendChild(styleElement);

    return () => {
      document.head.removeChild(styleElement);
    };
  }, []);

  // Track API documentation views
  useEffect(() => {
    track('API Documentation Viewed', {
      page: 'swagger-ui',
      hasApiKey: !!apiKey
    });
  }, [track, apiKey]);

  const onComplete = () => {
    setIsLoading(false);
    track('API Documentation Loaded');
  };

  const onFailure = (error: any) => {
    setError(error.message || 'Failed to load API documentation');
    setIsLoading(false);
    track('API Documentation Load Failed', { error: error.message });
  };

  // Custom plugin to add authentication
  const authPlugin = () => {
    return {
      statePlugins: {
        auth: {
          actions: {
            authorize: (payload: any) => {
              track('API Key Added', { method: payload.schema.type });
              return {
                type: 'AUTHORIZE',
                payload
              };
            }
          }
        }
      }
    };
  };

  // Custom request interceptor for analytics
  const requestInterceptor = (request: any) => {
    track('API Request Made', {
      method: request.method,
      url: request.url,
      operationId: request.operationId
    });
    
    // Add custom headers
    request.headers['X-Client-Version'] = '1.0.0';
    request.headers['X-Request-ID'] = generateRequestId();
    
    return request;
  };

  // Custom response interceptor for analytics
  const responseInterceptor = (response: any) => {
    track('API Response Received', {
      status: response.status,
      url: response.url,
      duration: response.duration
    });
    
    return response;
  };

  const generateRequestId = () => {
    return `blaze_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  };

  return (
    <div className="min-h-screen bg-oiler-navy">
      {/* Header */}
      <div className="bg-graphite border-b border-burnt-orange/20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-display font-bold text-pearl">
                API Documentation
              </h1>
              <p className="mt-2 text-pearl/60">
                Blaze Intelligence API v1.0.0 - Institutional-grade sports analytics
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-sm text-pearl/60">
                <span className="text-grizzly-teal font-medium">Base URL:</span>
                <code className="ml-2 px-2 py-1 bg-graphite/50 rounded text-cardinal-blue font-mono text-xs">
                  https://api.blaze-intelligence.com/v1
                </code>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Start Guide */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-graphite/30 rounded-lg p-6 mb-8 border border-burnt-orange/20">
          <h2 className="text-xl font-semibold text-pearl mb-4">Quick Start</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <h3 className="text-cardinal-blue font-medium mb-2">1. Authentication</h3>
              <pre className="bg-oiler-navy/50 rounded p-3 text-xs overflow-x-auto">
                <code className="text-pearl/80">{`curl -H "Authorization: Bearer YOUR_API_KEY" \\
  https://api.blaze-intelligence.com/v1/games`}</code>
              </pre>
            </div>
            <div>
              <h3 className="text-cardinal-blue font-medium mb-2">2. WebSocket Connection</h3>
              <pre className="bg-oiler-navy/50 rounded p-3 text-xs overflow-x-auto">
                <code className="text-pearl/80">{`const ws = new WebSocket(
  'wss://api.blaze-intelligence.com/v1/stream'
);`}</code>
              </pre>
            </div>
            <div>
              <h3 className="text-cardinal-blue font-medium mb-2">3. Rate Limits</h3>
              <div className="bg-oiler-navy/50 rounded p-3">
                <ul className="text-xs text-pearl/80 space-y-1">
                  <li><span className="text-burnt-orange">Starter:</span> 1,000 req/hour</li>
                  <li><span className="text-burnt-orange">Professional:</span> 10,000 req/hour</li>
                  <li><span className="text-burnt-orange">Enterprise:</span> Unlimited</li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* SDK Examples */}
        <div className="bg-graphite/30 rounded-lg p-6 mb-8 border border-burnt-orange/20">
          <h2 className="text-xl font-semibold text-pearl mb-4">SDK Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-cardinal-blue font-medium mb-2">JavaScript/TypeScript</h3>
              <pre className="bg-oiler-navy/50 rounded p-3 text-xs overflow-x-auto">
                <code className="text-pearl/80">{`import { BlazeClient } from '@blaze-intelligence/sdk';

const client = new BlazeClient({
  apiKey: process.env.BLAZE_API_KEY
});

const predictions = await client.predictions.getGame('game_123');
console.log(predictions.winner.probability);`}</code>
              </pre>
            </div>
            <div>
              <h3 className="text-cardinal-blue font-medium mb-2">Python</h3>
              <pre className="bg-oiler-navy/50 rounded p-3 text-xs overflow-x-auto">
                <code className="text-pearl/80">{`from blaze_intelligence import BlazeClient

client = BlazeClient(api_key=os.getenv('BLAZE_API_KEY'))

predictions = client.predictions.get_game('game_123')
print(f"Win probability: {predictions['winner']['probability']}")`}</code>
              </pre>
            </div>
          </div>
        </div>
      </div>

      {/* Swagger UI Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-lg shadow-xl">
          {isLoading && (
            <div className="flex items-center justify-center h-64">
              <div className="text-graphite">Loading API documentation...</div>
            </div>
          )}
          
          {error && (
            <div className="p-8">
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-800">{error}</p>
              </div>
            </div>
          )}

          <SwaggerUI
            url={specUrl}
            spec={spec}
            docExpansion="list"
            defaultModelsExpandDepth={1}
            defaultModelExpandDepth={1}
            displayRequestDuration={true}
            filter={true}
            showExtensions={true}
            showCommonExtensions={true}
            tryItOutEnabled={true}
            onComplete={onComplete}
            onFailure={onFailure}
            requestInterceptor={requestInterceptor}
            responseInterceptor={responseInterceptor}
            plugins={[authPlugin]}
            preauthorizeApiKey={apiKey ? { ApiKeyAuth: apiKey } : undefined}
          />
        </div>
      </div>

      {/* API Status Dashboard */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-graphite/30 rounded-lg p-6 border border-burnt-orange/20">
          <h2 className="text-xl font-semibold text-pearl mb-4">API Status</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-grizzly-teal">99.99%</div>
              <div className="text-sm text-pearl/60">Uptime (30 days)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-cardinal-blue">&lt;50ms</div>
              <div className="text-sm text-pearl/60">Avg Response Time</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-burnt-orange">2.1B</div>
              <div className="text-sm text-pearl/60">API Calls (MTD)</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-pearl">v1.0.0</div>
              <div className="text-sm text-pearl/60">Current Version</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default APIDocumentation;
