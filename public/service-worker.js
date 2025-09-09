// Blaze Intelligence PWA Service Worker
// Provides offline capability, caching, and performance optimization

const CACHE_NAME = 'blaze-intelligence-v2.0.0';
const RUNTIME_CACHE = 'blaze-runtime-v1';
const API_CACHE = 'blaze-api-v1';

// Core assets to cache for offline
const STATIC_ASSETS = [
    '/',
    '/coach',
    '/dashboard',
    '/pricing',
    '/public/css/blaze-styles.css',
    '/public/css/dashboard.css',
    '/public/css/neural-coach.css',
    '/public/css/neural-coach-enhanced.css',
    '/public/js/neural-coach.js',
    '/public/js/neural-coach-enhanced.js',
    '/public/js/neural-network-bg.js',
    '/public/js/enhanced-three-hero.js',
    '/public/js/enhanced-sports-data.js',
    '/public/js/intelligence-demo.js',
    '/public/assets/logo.png',
    '/public/assets/favicon.png',
    'https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=Space+Grotesk:wght@300;400;500;700&display=swap'
];

// Demo data for offline fallback
const DEMO_DATA = {
    '/api/coach/analysis': {
        status: 'offline',
        mode: 'demo',
        data: {
            confidence: 78,
            engagement: 85,
            stress: 'Moderate',
            posture: 'Good',
            message: 'Using cached demo data - offline mode'
        }
    },
    '/api/sports/mlb': {
        status: 'offline',
        teams: ['Cardinals', 'Yankees', 'Dodgers'],
        message: 'Cached MLB data'
    }
};

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('🚀 Service Worker installing');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching static assets');
                return cache.addAll(STATIC_ASSETS)
                    .catch(err => {
                        console.warn('Failed to cache some assets:', err);
                        // Continue even if some assets fail to cache
                        return Promise.resolve();
                    });
            })
            .then(() => self.skipWaiting())
    );
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
    console.log('✅ Service Worker activated');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(cacheName => {
                            return cacheName !== CACHE_NAME && 
                                   cacheName !== RUNTIME_CACHE && 
                                   cacheName !== API_CACHE;
                        })
                        .map(cacheName => {
                            console.log('🗑️ Deleting old cache:', cacheName);
                            return caches.delete(cacheName);
                        })
                );
            })
            .then(() => self.clients.claim())
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle API requests
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle static assets
    event.respondWith(handleStaticRequest(request));
});

// Handle API requests with cache and fallback
async function handleApiRequest(request) {
    const cache = await caches.open(API_CACHE);
    
    try {
        // Try network first for API requests
        const networkResponse = await fetchWithTimeout(request, 5000);
        
        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('📱 API request failed, checking cache:', request.url);
        
        // Try cache
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            console.log('✅ Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // Fallback to demo data if available
        const demoPath = new URL(request.url).pathname;
        if (DEMO_DATA[demoPath]) {
            console.log('🎭 Serving demo data for:', demoPath);
            return new Response(
                JSON.stringify(DEMO_DATA[demoPath]),
                {
                    headers: {
                        'Content-Type': 'application/json',
                        'X-Source': 'demo-fallback'
                    }
                }
            );
        }
        
        // Return error response
        return new Response(
            JSON.stringify({ 
                error: 'Offline', 
                message: 'No cached data available' 
            }),
            {
                status: 503,
                headers: { 'Content-Type': 'application/json' }
            }
        );
    }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // Check cache first
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        // Update cache in background
        fetchAndCache(request, cache);
        return cachedResponse;
    }
    
    // Try network
    try {
        const networkResponse = await fetchWithTimeout(request, 10000);
        
        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('📴 Offline, no cache for:', request.url);
        
        // Return offline page for navigation requests
        if (request.mode === 'navigate') {
            return caches.match('/offline.html')
                .then(response => response || createOfflineResponse());
        }
        
        // Return placeholder for other assets
        return createPlaceholderResponse(request);
    }
}

// Fetch with timeout
function fetchWithTimeout(request, timeout = 5000) {
    return Promise.race([
        fetch(request),
        new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeout)
        )
    ]);
}

// Background cache update
async function fetchAndCache(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            cache.put(request, response);
        }
    } catch (error) {
        // Silent fail for background updates
    }
}

// Create offline response
function createOfflineResponse() {
    const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Offline - Blaze Intelligence</title>
            <style>
                body {
                    background: #0a0a0f;
                    color: white;
                    font-family: 'Space Grotesk', sans-serif;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    min-height: 100vh;
                    margin: 0;
                    text-align: center;
                }
                .offline-container {
                    max-width: 500px;
                    padding: 40px;
                }
                h1 {
                    color: #BF5700;
                    font-size: 3rem;
                    margin-bottom: 20px;
                }
                p {
                    color: rgba(255, 255, 255, 0.8);
                    line-height: 1.6;
                    margin-bottom: 30px;
                }
                button {
                    padding: 12px 30px;
                    background: linear-gradient(135deg, #BF5700, #FF7A00);
                    border: none;
                    border-radius: 10px;
                    color: white;
                    font-weight: 600;
                    cursor: pointer;
                    transition: transform 0.3s ease;
                }
                button:hover {
                    transform: translateY(-2px);
                }
            </style>
        </head>
        <body>
            <div class="offline-container">
                <h1>📴 Offline Mode</h1>
                <p>You're currently offline. Neural Coach and core features are still available with cached data.</p>
                <p>Some features may be limited until connection is restored.</p>
                <button onclick="location.reload()">Try Again</button>
            </div>
        </body>
        </html>
    `;
    
    return new Response(html, {
        headers: { 'Content-Type': 'text/html' }
    });
}

// Create placeholder response for missing assets
function createPlaceholderResponse(request) {
    const url = new URL(request.url);
    
    // Return transparent pixel for images
    if (url.pathname.match(/\.(png|jpg|jpeg|gif|svg)$/i)) {
        return new Response(
            new Uint8Array([137, 80, 78, 71, 13, 10, 26, 10]),
            { headers: { 'Content-Type': 'image/png' } }
        );
    }
    
    // Return empty for scripts/styles
    if (url.pathname.match(/\.(js|css)$/i)) {
        return new Response('', {
            headers: { 
                'Content-Type': url.pathname.endsWith('.js') 
                    ? 'application/javascript' 
                    : 'text/css'
            }
        });
    }
    
    // Default empty response
    return new Response('', { status: 404 });
}

// Message handler for cache management
self.addEventListener('message', (event) => {
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(cacheNames => {
            Promise.all(cacheNames.map(cache => caches.delete(cache)));
        });
    }
    
    if (event.data.type === 'CACHE_ASSETS') {
        const assets = event.data.assets;
        caches.open(RUNTIME_CACHE).then(cache => {
            cache.addAll(assets);
        });
    }
});

// Periodic background sync
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-analytics') {
        event.waitUntil(syncAnalytics());
    }
});

async function syncAnalytics() {
    // Sync offline analytics data
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
        if (request.url.includes('/api/analytics')) {
            try {
                await fetch(request);
                await cache.delete(request);
            } catch (error) {
                console.log('Sync failed, will retry:', request.url);
            }
        }
    }
}

console.log('🚀 Blaze Intelligence Service Worker loaded');