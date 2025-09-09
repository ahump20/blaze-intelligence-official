/**
 * Cloudflare Worker for Blaze Neural Coach
 * Handles video analysis, WebSocket connections, and real-time sports data
 */

export default {
    async fetch(request, env, ctx) {
        const url = new URL(request.url);
        
        // Handle WebSocket upgrade requests
        if (request.headers.get('Upgrade') === 'websocket') {
            return handleWebSocket(request, env);
        }
        
        // API Routes
        if (url.pathname.startsWith('/api/')) {
            return handleAPI(request, env, url.pathname);
        }
        
        // Serve static files
        if (url.pathname === '/' || url.pathname === '/neural-coach') {
            return serveHTML('neural-coach-enhanced.html', env);
        }
        
        if (url.pathname.endsWith('.js')) {
            return serveJS(url.pathname, env);
        }
        
        if (url.pathname.endsWith('.css')) {
            return serveCSS(url.pathname, env);
        }
        
        // Default to Neural Coach page
        return serveHTML('neural-coach-enhanced.html', env);
    }
};

// WebSocket handler
async function handleWebSocket(request, env) {
    const upgradeHeader = request.headers.get('Upgrade');
    if (!upgradeHeader || upgradeHeader !== 'websocket') {
        return new Response('Expected Upgrade: websocket', { status: 426 });
    }

    const webSocketPair = new WebSocketPair();
    const [client, server] = Object.values(webSocketPair);

    // Accept the WebSocket connection
    server.accept();

    // Get sport from URL
    const url = new URL(request.url);
    const sport = url.pathname.split('/ws/')[1] || 'mlb';

    // Setup message handling
    server.addEventListener('message', async (event) => {
        try {
            const data = JSON.parse(event.data);
            
            // Handle different message types
            switch (data.type) {
                case 'subscribe':
                    await handleSubscribe(server, data.sport, env);
                    break;
                    
                case 'analysis':
                    await handleAnalysis(server, data, env);
                    break;
                    
                case 'ping':
                    server.send(JSON.stringify({ type: 'pong' }));
                    break;
                    
                default:
                    console.log('Unknown message type:', data.type);
            }
        } catch (error) {
            console.error('WebSocket message error:', error);
            server.send(JSON.stringify({ 
                type: 'error', 
                message: error.message 
            }));
        }
    });

    // Send initial connection message
    server.send(JSON.stringify({
        type: 'connected',
        sport: sport,
        timestamp: Date.now(),
        message: `Connected to Blaze Neural Coach ${sport.toUpperCase()} stream`
    }));

    // Start sending periodic updates
    startDataStream(server, sport, env);

    return new Response(null, {
        status: 101,
        webSocket: client,
    });
}

// Handle API requests
async function handleAPI(request, env, pathname) {
    const headers = {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type'
    };

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
        return new Response(null, { headers });
    }

    try {
        switch (pathname) {
            case '/api/vision-analysis':
                return await handleVisionAnalysis(request, env);
                
            case '/api/cardinals-readiness':
                return await handleCardinalsReadiness(env);
                
            case '/api/team-intelligence':
                return await handleTeamIntelligence(request, env);
                
            case '/api/health':
                return new Response(JSON.stringify({
                    status: 'healthy',
                    timestamp: new Date().toISOString(),
                    service: 'neural-coach'
                }), { headers });
                
            default:
                return new Response(JSON.stringify({ 
                    error: 'Not found' 
                }), { 
                    status: 404, 
                    headers 
                });
        }
    } catch (error) {
        console.error('API error:', error);
        return new Response(JSON.stringify({ 
            error: 'Internal server error' 
        }), { 
            status: 500, 
            headers 
        });
    }
}

// Handle vision analysis requests
async function handleVisionAnalysis(request, env) {
    if (request.method !== 'POST') {
        return new Response('Method not allowed', { status: 405 });
    }

    const data = await request.json();
    const { video, sport } = data;

    // Store in R2 for processing
    const videoId = `video_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    if (env.VIDEO_STORAGE) {
        await env.VIDEO_STORAGE.put(videoId, video);
    }

    // Queue for processing
    const analysisJob = {
        id: videoId,
        sport: sport,
        timestamp: new Date().toISOString(),
        status: 'queued'
    };

    // Store in KV
    if (env.VISION_CACHE) {
        await env.VISION_CACHE.put(
            `analysis_${videoId}`, 
            JSON.stringify(analysisJob),
            { expirationTtl: 3600 }
        );
    }

    // Return job ID for tracking
    return new Response(JSON.stringify({
        success: true,
        jobId: videoId,
        message: 'Analysis queued for processing'
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Handle Cardinals readiness data
async function handleCardinalsReadiness(env) {
    // Get cached data from KV
    let readinessData = null;
    
    if (env.VISION_CACHE) {
        const cached = await env.VISION_CACHE.get('cardinals_readiness');
        if (cached) {
            readinessData = JSON.parse(cached);
        }
    }

    // Generate fresh data if not cached
    if (!readinessData) {
        readinessData = {
            timestamp: new Date().toISOString(),
            team: 'Cardinals',
            blazeScore: 152,
            readiness: 87,
            momentum: 12,
            leveragePoints: [
                {
                    type: 'pitching_matchup',
                    description: 'Favorable bullpen matchup in late innings',
                    impact: 'high'
                },
                {
                    type: 'batting_order',
                    description: 'Optimized lineup against LHP',
                    impact: 'medium'
                }
            ],
            recommendations: [
                'Start Goldschmidt in cleanup position',
                'Use defensive shift against pull hitters',
                'Save closer for 9th inning only'
            ]
        };

        // Cache for 10 minutes
        if (env.VISION_CACHE) {
            await env.VISION_CACHE.put(
                'cardinals_readiness',
                JSON.stringify(readinessData),
                { expirationTtl: 600 }
            );
        }
    }

    return new Response(JSON.stringify(readinessData), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Handle team intelligence requests
async function handleTeamIntelligence(request, env) {
    const url = new URL(request.url);
    const team = url.searchParams.get('team') || 'cardinals';

    const teamData = {
        cardinals: { blazeScore: 152, readiness: 87, momentum: 12 },
        titans: { blazeScore: 74, readiness: 72, momentum: -5 },
        longhorns: { blazeScore: 129, readiness: 94, momentum: 18 },
        grizzlies: { blazeScore: 59, readiness: 91, momentum: 8 }
    };

    const data = teamData[team.toLowerCase()] || teamData.cardinals;

    return new Response(JSON.stringify({
        team: team,
        ...data,
        timestamp: new Date().toISOString()
    }), {
        headers: { 'Content-Type': 'application/json' }
    });
}

// Handle subscription to sport data
async function handleSubscribe(ws, sport, env) {
    // Send acknowledgment
    ws.send(JSON.stringify({
        type: 'subscribed',
        sport: sport,
        timestamp: Date.now()
    }));
}

// Handle analysis requests via WebSocket
async function handleAnalysis(ws, data, env) {
    // Simulate analysis processing
    ws.send(JSON.stringify({
        type: 'analysis_started',
        jobId: data.jobId,
        timestamp: Date.now()
    }));

    // Simulate progress updates
    setTimeout(() => {
        ws.send(JSON.stringify({
            type: 'analysis_progress',
            jobId: data.jobId,
            progress: 50,
            stage: 'Processing biomechanics'
        }));
    }, 1000);

    setTimeout(() => {
        ws.send(JSON.stringify({
            type: 'analysis_complete',
            jobId: data.jobId,
            results: {
                biomechanical: {
                    formScore: 85,
                    hipRotation: 38,
                    balance: 92
                },
                character: {
                    championshipMindset: 78,
                    grit: 82,
                    focus: 88
                },
                blazeScore: 83
            }
        }));
    }, 2000);
}

// Start streaming data for a sport
function startDataStream(ws, sport, env) {
    // Send updates every 10 seconds
    const interval = setInterval(() => {
        if (ws.readyState !== 1) {
            clearInterval(interval);
            return;
        }

        const data = generateSportData(sport);
        ws.send(JSON.stringify(data));
    }, 10000);
}

// Generate mock sport data
function generateSportData(sport) {
    const baseData = {
        type: 'data_update',
        sport: sport,
        timestamp: Date.now()
    };

    switch (sport) {
        case 'mlb':
            return {
                ...baseData,
                data: {
                    team: 'Cardinals',
                    score: { home: 4, away: 2 },
                    inning: 7,
                    outs: 1,
                    runners: [false, true, false]
                },
                blazeMetrics: {
                    blazeScore: 152,
                    momentum: 12,
                    winProbability: 0.67
                }
            };

        case 'nfl':
            return {
                ...baseData,
                data: {
                    team: 'Titans',
                    score: { home: 21, away: 17 },
                    quarter: 3,
                    timeRemaining: '8:45',
                    possession: 'home'
                },
                blazeMetrics: {
                    blazeScore: 74,
                    momentum: -5,
                    winProbability: 0.58
                }
            };

        case 'nba':
            return {
                ...baseData,
                data: {
                    team: 'Grizzlies',
                    score: { home: 98, away: 92 },
                    quarter: 4,
                    timeRemaining: '3:21',
                    possession: 'away'
                },
                blazeMetrics: {
                    blazeScore: 59,
                    momentum: 8,
                    winProbability: 0.78
                }
            };

        default:
            return baseData;
    }
}

// Serve HTML files
async function serveHTML(filename, env) {
    const html = await getAssetFromKV(filename, env);
    return new Response(html, {
        headers: {
            'Content-Type': 'text/html',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}

// Serve JavaScript files
async function serveJS(pathname, env) {
    const js = await getAssetFromKV(pathname.substring(1), env);
    return new Response(js, {
        headers: {
            'Content-Type': 'application/javascript',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}

// Serve CSS files
async function serveCSS(pathname, env) {
    const css = await getAssetFromKV(pathname.substring(1), env);
    return new Response(css, {
        headers: {
            'Content-Type': 'text/css',
            'Cache-Control': 'public, max-age=3600'
        }
    });
}

// Get asset from KV (simplified)
async function getAssetFromKV(key, env) {
    // In production, this would fetch from KV storage
    // For now, return a placeholder
    return `<!DOCTYPE html>
<html>
<head>
    <title>Blaze Neural Coach</title>
</head>
<body>
    <h1>Blaze Neural Coach - Loading...</h1>
    <script>window.location.href = '/neural-coach-enhanced.html';</script>
</body>
</html>`;
}

// WebSocket Durable Object handler
export class WebSocketHandler {
    constructor(state, env) {
        this.state = state;
        this.env = env;
        this.sessions = [];
    }

    async fetch(request) {
        const upgradeHeader = request.headers.get('Upgrade');
        if (!upgradeHeader || upgradeHeader !== 'websocket') {
            return new Response('Expected Upgrade: websocket', { status: 426 });
        }

        const webSocketPair = new WebSocketPair();
        const [client, server] = Object.values(webSocketPair);

        this.handleSession(server);

        return new Response(null, {
            status: 101,
            webSocket: client,
        });
    }

    handleSession(webSocket) {
        webSocket.accept();
        this.sessions.push(webSocket);

        webSocket.addEventListener('message', async (msg) => {
            try {
                const data = JSON.parse(msg.data);
                // Broadcast to all connected clients
                this.broadcast(data);
            } catch (error) {
                console.error('WebSocket error:', error);
            }
        });

        webSocket.addEventListener('close', () => {
            this.sessions = this.sessions.filter(ws => ws !== webSocket);
        });
    }

    broadcast(data) {
        this.sessions.forEach(session => {
            try {
                session.send(JSON.stringify(data));
            } catch (error) {
                // Session might be closed
            }
        });
    }
}