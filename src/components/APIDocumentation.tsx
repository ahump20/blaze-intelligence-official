import React, { useState, useEffect } from 'react';

interface APIEndpoint {
  method: string;
  path: string;
  summary: string;
  description?: string;
  parameters?: Parameter[];
  requestBody?: RequestBody;
  responses: Record<string, Response>;
  tags?: string[];
  security?: string[];
}

interface Parameter {
  name: string;
  in: 'query' | 'path' | 'header' | 'cookie';
  required: boolean;
  schema: {
    type: string;
    format?: string;
    enum?: string[];
    example?: any;
  };
  description?: string;
}

interface RequestBody {
  description?: string;
  required: boolean;
  content: Record<string, {
    schema: any;
    example?: any;
  }>;
}

interface Response {
  description: string;
  content?: Record<string, {
    schema: any;
    example?: any;
  }>;
}

interface OpenAPISpec {
  openapi: string;
  info: {
    title: string;
    description: string;
    version: string;
    contact?: {
      name: string;
      email: string;
      url: string;
    };
  };
  servers: Array<{
    url: string;
    description: string;
  }>;
  paths: Record<string, Record<string, APIEndpoint>>;
  components?: {
    schemas?: Record<string, any>;
    securitySchemes?: Record<string, any>;
  };
}

const APIDocumentation: React.FC = () => {
  const [apiSpec, setApiSpec] = useState<OpenAPISpec | null>(null);
  const [selectedEndpoint, setSelectedEndpoint] = useState<{ path: string; method: string; endpoint: APIEndpoint } | null>(null);
  const [selectedTag, setSelectedTag] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [testResponse, setTestResponse] = useState<string>('');
  const [testLoading, setTestLoading] = useState(false);

  useEffect(() => {
    loadAPISpec();
  }, []);

  const loadAPISpec = async () => {
    try {
      const response = await fetch('/api/docs/spec.json');
      const spec = await response.json();
      setApiSpec(spec);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load API specification:', error);
      // Fallback to built-in spec
      setApiSpec(getBuiltInSpec());
      setLoading(false);
    }
  };

  const getBuiltInSpec = (): OpenAPISpec => {
    return {
      openapi: '3.0.0',
      info: {
        title: 'Blaze Intelligence API',
        description: 'Professional-grade sports analytics platform API',
        version: '2.0.0',
        contact: {
          name: 'Blaze Intelligence',
          email: 'api@blazeintelligence.com',
          url: 'https://blazeintelligence.com'
        }
      },
      servers: [
        {
          url: '/api',
          description: 'Production API Server'
        }
      ],
      paths: {
        '/sports/live': {
          get: {
            method: 'GET',
            path: '/sports/live',
            summary: 'Get live sports data',
            description: 'Retrieve real-time sports scores and game updates',
            tags: ['Sports Data'],
            parameters: [
              {
                name: 'sport',
                in: 'query',
                required: false,
                schema: { type: 'string', enum: ['nfl', 'nba', 'mlb', 'ncaa'], example: 'nfl' },
                description: 'Filter by sport'
              },
              {
                name: 'team',
                in: 'query',
                required: false,
                schema: { type: 'string', example: 'cardinals' },
                description: 'Filter by team'
              }
            ],
            responses: {
              '200': {
                description: 'Live sports data',
                content: {
                  'application/json': {
                    schema: { type: 'object' },
                    example: {
                      games: [
                        {
                          id: 'game123',
                          homeTeam: 'Cardinals',
                          awayTeam: 'Titans',
                          homeScore: 21,
                          awayScore: 14,
                          status: 'live',
                          quarter: 3,
                          timeRemaining: '8:45'
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        },
        '/video-intelligence/analyze': {
          post: {
            method: 'POST',
            path: '/video-intelligence/analyze',
            summary: 'Analyze sports video',
            description: 'Upload and analyze sports video with AI-powered insights',
            tags: ['Video Intelligence'],
            requestBody: {
              required: true,
              description: 'Video file and analysis configuration',
              content: {
                'multipart/form-data': {
                  schema: {
                    type: 'object',
                    properties: {
                      video: { type: 'string', format: 'binary' },
                      config: { type: 'string', description: 'JSON configuration' }
                    }
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'Analysis job created',
                content: {
                  'application/json': {
                    schema: { type: 'object' },
                    example: {
                      jobId: 'job_abc123',
                      status: 'queued',
                      estimatedTime: 180
                    }
                  }
                }
              }
            }
          }
        },
        '/analytics/pressure': {
          get: {
            method: 'GET',
            path: '/analytics/pressure',
            summary: 'Get pressure analytics',
            description: 'Retrieve real-time pressure and biometric data',
            tags: ['Analytics'],
            parameters: [
              {
                name: 'playerId',
                in: 'query',
                required: false,
                schema: { type: 'string', example: 'player123' },
                description: 'Filter by player ID'
              },
              {
                name: 'timeframe',
                in: 'query',
                required: false,
                schema: { type: 'string', enum: ['1h', '24h', '7d'], example: '1h' },
                description: 'Data timeframe'
              }
            ],
            responses: {
              '200': {
                description: 'Pressure analytics data',
                content: {
                  'application/json': {
                    schema: { type: 'object' },
                    example: {
                      players: [
                        {
                          id: 'player123',
                          name: 'John Smith',
                          pressureIndex: 87.5,
                          heartRate: 145,
                          timestamp: 1640995200000
                        }
                      ]
                    }
                  }
                }
              }
            }
          }
        },
        '/websocket/connect': {
          post: {
            method: 'POST',
            path: '/websocket/connect',
            summary: 'Connect to WebSocket',
            description: 'Establish WebSocket connection for real-time data',
            tags: ['WebSocket'],
            requestBody: {
              required: true,
              description: 'Connection parameters',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      streams: { type: 'array', items: { type: 'string' } },
                      clientId: { type: 'string' }
                    }
                  },
                  example: {
                    streams: ['pressure_analytics', 'live_scores'],
                    clientId: 'client123'
                  }
                }
              }
            },
            responses: {
              '200': {
                description: 'WebSocket connection established',
                content: {
                  'application/json': {
                    schema: { type: 'object' },
                    example: {
                      wsUrl: 'ws://localhost:5000/ws',
                      connectionId: 'conn_abc123'
                    }
                  }
                }
              }
            }
          }
        }
      },
      components: {
        securitySchemes: {
          BearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT'
          }
        }
      }
    };
  };

  const getAllTags = (): string[] => {
    if (!apiSpec) return [];
    
    const tags = new Set<string>();
    Object.values(apiSpec.paths).forEach(pathMethods => {
      Object.values(pathMethods).forEach(endpoint => {
        endpoint.tags?.forEach(tag => tags.add(tag));
      });
    });
    
    return Array.from(tags).sort();
  };

  const getFilteredEndpoints = () => {
    if (!apiSpec) return [];
    
    const endpoints: Array<{ path: string; method: string; endpoint: APIEndpoint }> = [];
    
    Object.entries(apiSpec.paths).forEach(([path, methods]) => {
      Object.entries(methods).forEach(([method, endpoint]) => {
        if (selectedTag === 'all' || endpoint.tags?.includes(selectedTag)) {
          endpoints.push({ path, method: method.toUpperCase(), endpoint });
        }
      });
    });
    
    return endpoints;
  };

  const testEndpoint = async (path: string, method: string, endpoint: APIEndpoint) => {
    setTestLoading(true);
    setTestResponse('');
    
    try {
      // Build test request
      const url = new URL(path, window.location.origin);
      
      // Add query parameters if present
      endpoint.parameters?.forEach(param => {
        if (param.in === 'query' && param.schema.example) {
          url.searchParams.set(param.name, param.schema.example);
        }
      });

      const options: RequestInit = {
        method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      // Add request body for POST/PUT requests
      if (endpoint.requestBody && ['POST', 'PUT', 'PATCH'].includes(method)) {
        const contentType = Object.keys(endpoint.requestBody.content)[0];
        const content = endpoint.requestBody.content[contentType];
        
        if (content.example) {
          options.body = JSON.stringify(content.example);
        }
      }

      const response = await fetch(url.toString(), options);
      const data = await response.json();
      
      setTestResponse(JSON.stringify(data, null, 2));
    } catch (error) {
      setTestResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setTestLoading(false);
    }
  };

  const getMethodColor = (method: string): string => {
    switch (method.toUpperCase()) {
      case 'GET': return '#4CAF50';
      case 'POST': return '#2196F3';
      case 'PUT': return '#FF9800';
      case 'DELETE': return '#F44336';
      case 'PATCH': return '#9C27B0';
      default: return '#757575';
    }
  };

  if (loading) {
    return (
      <div className="api-docs-loading">
        <div className="loading-spinner"></div>
        <p>Loading API Documentation...</p>
      </div>
    );
  }

  if (!apiSpec) {
    return (
      <div className="api-docs-error">
        <h2>❌ Failed to load API documentation</h2>
        <p>Please try again later.</p>
      </div>
    );
  }

  return (
    <div className="api-documentation">
      <div className="api-docs-header">
        <h1>📚 {apiSpec.info.title}</h1>
        <p>{apiSpec.info.description}</p>
        <div className="api-info">
          <span className="version">v{apiSpec.info.version}</span>
          <span className="server">{apiSpec.servers[0]?.url}</span>
        </div>
      </div>

      <div className="api-docs-content">
        <div className="sidebar">
          <div className="tag-filter">
            <h3>Categories</h3>
            <div className="tag-list">
              <button
                className={selectedTag === 'all' ? 'active' : ''}
                onClick={() => setSelectedTag('all')}
              >
                All Endpoints ({Object.keys(apiSpec.paths).length})
              </button>
              {getAllTags().map(tag => (
                <button
                  key={tag}
                  className={selectedTag === tag ? 'active' : ''}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="endpoint-list">
            <h3>Endpoints</h3>
            {getFilteredEndpoints().map(({ path, method, endpoint }, index) => (
              <div
                key={`${method}-${path}`}
                className={`endpoint-item ${selectedEndpoint?.path === path && selectedEndpoint?.method === method ? 'active' : ''}`}
                onClick={() => setSelectedEndpoint({ path, method, endpoint })}
              >
                <div className="endpoint-method" style={{ backgroundColor: getMethodColor(method) }}>
                  {method}
                </div>
                <div className="endpoint-path">
                  <div className="path">{path}</div>
                  <div className="summary">{endpoint.summary}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="main-content">
          {selectedEndpoint ? (
            <div className="endpoint-details">
              <div className="endpoint-header">
                <div className="method-path">
                  <span 
                    className="method-badge"
                    style={{ backgroundColor: getMethodColor(selectedEndpoint.method) }}
                  >
                    {selectedEndpoint.method}
                  </span>
                  <span className="path">{selectedEndpoint.path}</span>
                </div>
                <button
                  className="test-button"
                  onClick={() => testEndpoint(selectedEndpoint.path, selectedEndpoint.method, selectedEndpoint.endpoint)}
                  disabled={testLoading}
                >
                  {testLoading ? 'Testing...' : 'Test Endpoint'}
                </button>
              </div>

              <div className="endpoint-description">
                <h3>{selectedEndpoint.endpoint.summary}</h3>
                {selectedEndpoint.endpoint.description && (
                  <p>{selectedEndpoint.endpoint.description}</p>
                )}
              </div>

              {selectedEndpoint.endpoint.parameters && selectedEndpoint.endpoint.parameters.length > 0 && (
                <div className="parameters-section">
                  <h4>Parameters</h4>
                  <div className="parameters-table">
                    <div className="table-header">
                      <div>Name</div>
                      <div>Type</div>
                      <div>Required</div>
                      <div>Description</div>
                    </div>
                    {selectedEndpoint.endpoint.parameters.map((param, index) => (
                      <div key={index} className="table-row">
                        <div className="param-name">
                          {param.name}
                          <span className="param-location">({param.in})</span>
                        </div>
                        <div className="param-type">
                          {param.schema.type}
                          {param.schema.format && <span className="format">({param.schema.format})</span>}
                        </div>
                        <div className="param-required">
                          {param.required ? '✅ Yes' : '❌ No'}
                        </div>
                        <div className="param-description">
                          {param.description}
                          {param.schema.example && (
                            <div className="example">Example: <code>{JSON.stringify(param.schema.example)}</code></div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedEndpoint.endpoint.requestBody && (
                <div className="request-body-section">
                  <h4>Request Body</h4>
                  <p>{selectedEndpoint.endpoint.requestBody.description}</p>
                  {Object.entries(selectedEndpoint.endpoint.requestBody.content).map(([contentType, content]) => (
                    <div key={contentType} className="content-example">
                      <h5>{contentType}</h5>
                      {content.example && (
                        <pre className="code-block">
                          {JSON.stringify(content.example, null, 2)}
                        </pre>
                      )}
                    </div>
                  ))}
                </div>
              )}

              <div className="responses-section">
                <h4>Responses</h4>
                {Object.entries(selectedEndpoint.endpoint.responses).map(([statusCode, response]) => (
                  <div key={statusCode} className="response-item">
                    <div className="status-code">{statusCode}</div>
                    <div className="response-description">{response.description}</div>
                    {response.content && Object.entries(response.content).map(([contentType, content]) => (
                      <div key={contentType} className="response-example">
                        <h6>{contentType}</h6>
                        {content.example && (
                          <pre className="code-block">
                            {JSON.stringify(content.example, null, 2)}
                          </pre>
                        )}
                      </div>
                    ))}
                  </div>
                ))}
              </div>

              {testResponse && (
                <div className="test-response-section">
                  <h4>Test Response</h4>
                  <pre className="test-response">
                    {testResponse}
                  </pre>
                </div>
              )}
            </div>
          ) : (
            <div className="no-selection">
              <h3>Select an endpoint to view details</h3>
              <p>Choose an endpoint from the list to see its documentation and test it.</p>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .api-documentation {
          max-width: 1400px;
          margin: 0 auto;
          padding: 20px;
          background: linear-gradient(135deg, #0A192F 0%, #112240 100%);
          color: white;
          border-radius: 12px;
          min-height: 800px;
        }

        .api-docs-header {
          text-align: center;
          margin-bottom: 30px;
          padding-bottom: 20px;
          border-bottom: 2px solid #BF5700;
        }

        .api-docs-header h1 {
          color: #BF5700;
          margin-bottom: 10px;
        }

        .api-info {
          display: flex;
          justify-content: center;
          gap: 20px;
          margin-top: 15px;
        }

        .version {
          background: #BF5700;
          color: white;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: bold;
        }

        .server {
          background: rgba(255, 255, 255, 0.1);
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 12px;
          font-family: monospace;
        }

        .api-docs-content {
          display: grid;
          grid-template-columns: 350px 1fr;
          gap: 30px;
          height: 700px;
        }

        .sidebar {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          overflow-y: auto;
        }

        .tag-filter {
          margin-bottom: 30px;
        }

        .tag-filter h3 {
          color: #BF5700;
          margin-bottom: 15px;
        }

        .tag-list {
          display: flex;
          flex-direction: column;
          gap: 8px;
        }

        .tag-list button {
          background: transparent;
          border: 1px solid rgba(255, 255, 255, 0.2);
          color: white;
          padding: 8px 12px;
          border-radius: 6px;
          cursor: pointer;
          text-align: left;
          transition: all 0.3s ease;
        }

        .tag-list button:hover {
          background: rgba(255, 255, 255, 0.1);
        }

        .tag-list button.active {
          background: #BF5700;
          border-color: #BF5700;
        }

        .endpoint-list h3 {
          color: #BF5700;
          margin-bottom: 15px;
        }

        .endpoint-item {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px;
          border-radius: 8px;
          cursor: pointer;
          margin-bottom: 8px;
          transition: all 0.3s ease;
          border: 1px solid transparent;
        }

        .endpoint-item:hover {
          background: rgba(255, 255, 255, 0.05);
        }

        .endpoint-item.active {
          background: rgba(191, 87, 0, 0.2);
          border-color: #BF5700;
        }

        .endpoint-method {
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 12px;
          font-weight: bold;
          min-width: 50px;
          text-align: center;
        }

        .endpoint-path {
          flex: 1;
        }

        .path {
          font-family: monospace;
          font-size: 14px;
          font-weight: bold;
        }

        .summary {
          font-size: 12px;
          color: #ccc;
          margin-top: 2px;
        }

        .main-content {
          background: rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          overflow-y: auto;
        }

        .endpoint-details {
          height: 100%;
        }

        .endpoint-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        .method-path {
          display: flex;
          align-items: center;
          gap: 15px;
        }

        .method-badge {
          color: white;
          padding: 8px 16px;
          border-radius: 6px;
          font-weight: bold;
          font-size: 14px;
        }

        .method-path .path {
          font-family: monospace;
          font-size: 20px;
          font-weight: bold;
        }

        .test-button {
          background: #4CAF50;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 6px;
          cursor: pointer;
          font-weight: bold;
          transition: all 0.3s ease;
        }

        .test-button:hover:not(:disabled) {
          background: #45a049;
        }

        .test-button:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }

        .endpoint-description h3 {
          color: #BF5700;
          margin-bottom: 10px;
        }

        .parameters-section, .request-body-section, .responses-section, .test-response-section {
          margin: 30px 0;
        }

        .parameters-section h4, .request-body-section h4, .responses-section h4, .test-response-section h4 {
          color: #BF5700;
          margin-bottom: 15px;
        }

        .parameters-table {
          background: rgba(0, 0, 0, 0.2);
          border-radius: 8px;
          overflow: hidden;
        }

        .table-header {
          display: grid;
          grid-template-columns: 1fr 1fr 100px 2fr;
          gap: 15px;
          padding: 12px 15px;
          background: rgba(191, 87, 0, 0.2);
          font-weight: bold;
        }

        .table-row {
          display: grid;
          grid-template-columns: 1fr 1fr 100px 2fr;
          gap: 15px;
          padding: 12px 15px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.05);
        }

        .table-row:last-child {
          border-bottom: none;
        }

        .param-name {
          font-family: monospace;
          font-weight: bold;
        }

        .param-location {
          color: #888;
          font-size: 12px;
          margin-left: 5px;
        }

        .param-type {
          color: #4CAF50;
        }

        .format {
          color: #888;
          margin-left: 5px;
        }

        .example {
          margin-top: 5px;
          font-size: 12px;
        }

        .example code {
          background: rgba(255, 255, 255, 0.1);
          padding: 2px 4px;
          border-radius: 3px;
          font-family: monospace;
        }

        .code-block {
          background: rgba(0, 0, 0, 0.3);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 6px;
          padding: 15px;
          overflow-x: auto;
          font-family: monospace;
          font-size: 14px;
          line-height: 1.4;
          margin: 10px 0;
        }

        .response-item {
          background: rgba(255, 255, 255, 0.02);
          border-radius: 8px;
          padding: 15px;
          margin-bottom: 15px;
        }

        .status-code {
          display: inline-block;
          background: #4CAF50;
          color: white;
          padding: 4px 8px;
          border-radius: 4px;
          font-weight: bold;
          margin-bottom: 8px;
        }

        .test-response {
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid #BF5700;
          border-radius: 6px;
          padding: 15px;
          font-family: monospace;
          font-size: 14px;
          line-height: 1.4;
          overflow-x: auto;
          max-height: 300px;
          overflow-y: auto;
        }

        .no-selection {
          text-align: center;
          padding: 50px;
          color: #888;
        }

        .api-docs-loading, .api-docs-error {
          text-align: center;
          padding: 50px;
        }

        .loading-spinner {
          border: 4px solid rgba(255, 255, 255, 0.1);
          border-left: 4px solid #BF5700;
          border-radius: 50%;
          width: 40px;
          height: 40px;
          animation: spin 1s linear infinite;
          margin: 0 auto 20px;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default APIDocumentation;