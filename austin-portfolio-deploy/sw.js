/**
 * Blaze Intelligence Service Worker v2.0
 * Progressive Web App with offline capabilities
 */

const CACHE_NAME = 'blaze-intelligence-v2.0';
const RUNTIME_CACHE = 'blaze-runtime-v2.0';
const DATA_CACHE = 'blaze-data-v2.0';

// Core assets to cache for offline use
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/blaze-intelligence-ios-app.html',
    '/blaze-intelligence-championship.html',
    '/coach-enhanced.html',
    '/strategic-command-center.html',
    '/css/styles.css',
    '/css/team-intelligence.css',
    '/public/brand.css',
    '/public/brand-components.css',
    '/js/team-intelligence-dashboard.js',
    '/js/nil-valuation-engine.js',
    '/js/cultural-intelligence-system.js',
    '/js/championship-mindset-module.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// Dynamic content patterns
const DYNAMIC_PATTERNS = [
    /^\/api\//,
    /^\/data\/live-/,
    /\.json$/
];

// Install event - cache static assets
self.addEventListener('install', event => {
    console.log('🔥 Service Worker installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('📦 Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('✅ Service Worker installed');
                return self.skipWaiting();
            })
    );
});

// Activate event - clean old caches
self.addEventListener('activate', event => {
    console.log('⚡ Service Worker activating...');
    
    event.waitUntil(
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames
                    .filter(name => {
                        return name !== CACHE_NAME && 
                               name !== RUNTIME_CACHE && 
                               name !== DATA_CACHE;
                    })
                    .map(name => {
                        console.log('🗑️ Deleting old cache:', name);
                        return caches.delete(name);
                    })
            );
        }).then(() => {
            console.log('✅ Service Worker activated');
            return self.clients.claim();
        })
    );
});

// Fetch event - serve from cache with network fallback
self.addEventListener('fetch', event => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Handle API requests differently
    if (url.pathname.startsWith('/api/')) {
        event.respondWith(handleApiRequest(request));
        return;
    }
    
    // Handle static assets
    if (isStaticAsset(url.pathname)) {
        event.respondWith(handleStaticRequest(request));
        return;
    }
    
    // Handle dynamic content
    event.respondWith(handleDynamicRequest(request));
});

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
    const cache = await caches.open(DATA_CACHE);
    
    try {
        // Try network first
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            await cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('📡 Network failed, checking cache for:', request.url);
        
        // Fall back to cache
        const cachedResponse = await cache.match(request);
        
        if (cachedResponse) {
            console.log('💾 Serving from cache:', request.url);
            return cachedResponse;
        }
        
        // Return offline response
        return new Response(JSON.stringify({
            offline: true,
            message: 'Currently offline. Data may be outdated.',
            cached_at: new Date().toISOString()
        }), {
            headers: { 'Content-Type': 'application/json' }
        });
    }
}

// Handle static assets with cache-first strategy
async function handleStaticRequest(request) {
    const cache = await caches.open(CACHE_NAME);
    
    // Check cache first
    const cachedResponse = await cache.match(request);
    
    if (cachedResponse) {
        // Update cache in background
        event.waitUntil(updateCache(request, cache));
        return cachedResponse;
    }
    
    // Fetch from network
    try {
        const networkResponse = await fetch(request);
        await cache.put(request, networkResponse.clone());
        return networkResponse;
    } catch (error) {
        console.error('Failed to fetch:', request.url);
        return new Response('Offline', { status: 503 });
    }
}

// Handle dynamic content with stale-while-revalidate
async function handleDynamicRequest(request) {
    const cache = await caches.open(RUNTIME_CACHE);
    
    // Return cached version immediately if available
    const cachedResponse = await cache.match(request);
    
    // Fetch fresh version in background
    const fetchPromise = fetch(request).then(response => {
        if (response.ok) {
            cache.put(request, response.clone());
        }
        return response;
    }).catch(() => cachedResponse);
    
    return cachedResponse || fetchPromise;
}

// Update cache in background
async function updateCache(request, cache) {
    try {
        const response = await fetch(request);
        if (response.ok) {
            await cache.put(request, response);
        }
    } catch (error) {
        console.log('Background update failed for:', request.url);
    }
}

// Check if request is for static asset
function isStaticAsset(pathname) {
    return pathname.endsWith('.css') ||
           pathname.endsWith('.js') ||
           pathname.endsWith('.png') ||
           pathname.endsWith('.jpg') ||
           pathname.endsWith('.webp') ||
           pathname.endsWith('.woff2');
}

// Handle background sync
self.addEventListener('sync', event => {
    console.log('🔄 Background sync triggered');
    
    if (event.tag === 'sync-analytics') {
        event.waitUntil(syncAnalytics());
    } else if (event.tag === 'sync-updates') {
        event.waitUntil(syncUpdates());
    }
});

// Sync analytics data
async function syncAnalytics() {
    try {
        const response = await fetch('/api/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                timestamp: Date.now(),
                type: 'analytics'
            })
        });
        
        if (response.ok) {
            console.log('✅ Analytics synced');
        }
    } catch (error) {
        console.error('Failed to sync analytics:', error);
    }
}

// Sync updates
async function syncUpdates() {
    try {
        // Update team data
        await updateTeamData();
        
        // Update live scores
        await updateLiveScores();
        
        console.log('✅ Updates synced');
    } catch (error) {
        console.error('Failed to sync updates:', error);
    }
}

// Update team data
async function updateTeamData() {
    const cache = await caches.open(DATA_CACHE);
    const response = await fetch('/data/team-intelligence.json');
    
    if (response.ok) {
        await cache.put('/data/team-intelligence.json', response);
    }
}

// Update live scores
async function updateLiveScores() {
    const cache = await caches.open(DATA_CACHE);
    const response = await fetch('/data/live-intelligence.json');
    
    if (response.ok) {
        await cache.put('/data/live-intelligence.json', response);
    }
}

// Handle push notifications
self.addEventListener('push', event => {
    console.log('📬 Push notification received');
    
    const options = {
        body: event.data ? event.data.text() : 'New update from Blaze Intelligence',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [200, 100, 200],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1
        },
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/icons/view.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/close.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification('Blaze Intelligence', options)
    );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
    console.log('🔔 Notification clicked');
    
    event.notification.close();
    
    if (event.action === 'view') {
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});

// Handle message from client
self.addEventListener('message', event => {
    console.log('📨 Message from client:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    } else if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(clearAllCaches());
    } else if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(cacheUrls(event.data.urls));
    }
});

// Clear all caches
async function clearAllCaches() {
    const cacheNames = await caches.keys();
    await Promise.all(cacheNames.map(name => caches.delete(name)));
    console.log('🗑️ All caches cleared');
}

// Cache specific URLs
async function cacheUrls(urls) {
    const cache = await caches.open(RUNTIME_CACHE);
    await cache.addAll(urls);
    console.log('✅ URLs cached:', urls);
}

// Periodic background sync
self.addEventListener('periodicsync', event => {
    if (event.tag === 'update-scores') {
        event.waitUntil(updateLiveScores());
    }
});

console.log('🔥 Blaze Intelligence Service Worker loaded');
console.log('Version: 2.0');
console.log('Features: Offline, Background Sync, Push Notifications');