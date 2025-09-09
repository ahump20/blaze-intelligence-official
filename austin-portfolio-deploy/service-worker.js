/**
 * Blaze Intelligence Service Worker
 * Advanced caching and offline functionality
 */

const CACHE_NAME = 'blaze-intelligence-v3.0';
const DYNAMIC_CACHE = 'blaze-dynamic-v3.0';
const DATA_CACHE = 'blaze-data-v3.0';

// Assets to cache immediately
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/dashboard.html',
    '/vision-ai-demo.html',
    '/testimonials.html',
    '/contact.html',
    '/manifest.json',
    '/js/blaze-three-visuals.js',
    '/js/blaze-real-time-data.js',
    '/js/blaze-websocket-client.js',
    '/js/blaze-live-chat.js',
    '/js/cardinals-readiness-board.js',
    '/data/blaze-metrics.json',
    'https://cdn.tailwindcss.com',
    'https://cdnjs.cloudflare.com/ajax/libs/three.js/r158/three.min.js',
    'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.min.js',
    'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&display=swap'
];

// Network-first routes (always try to get fresh data)
const NETWORK_FIRST_ROUTES = [
    '/api/',
    '/data/live/',
    '/data/blaze-metrics.json'
];

// Cache-first routes (serve from cache when available)
const CACHE_FIRST_ROUTES = [
    '/js/',
    '/css/',
    '/fonts/',
    '/icons/'
];

// Install event - cache static assets
self.addEventListener('install', (event) => {
    console.log('[Service Worker] Installing...');
    
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[Service Worker] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => {
                console.log('[Service Worker] Installation complete');
                return self.skipWaiting();
            })
            .catch(error => {
                console.error('[Service Worker] Installation failed:', error);
            })
    );
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] Activating...');
    
    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames
                        .filter(name => {
                            return name.startsWith('blaze-') && 
                                   name !== CACHE_NAME && 
                                   name !== DYNAMIC_CACHE && 
                                   name !== DATA_CACHE;
                        })
                        .map(name => {
                            console.log('[Service Worker] Deleting old cache:', name);
                            return caches.delete(name);
                        })
                );
            })
            .then(() => {
                console.log('[Service Worker] Activation complete');
                return self.clients.claim();
            })
    );
});

// Fetch event - serve from cache or network
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);
    
    // Skip non-GET requests
    if (request.method !== 'GET') {
        return;
    }
    
    // Skip chrome-extension and other non-http(s) requests
    if (!request.url.startsWith('http')) {
        return;
    }
    
    // Determine caching strategy based on route
    if (isNetworkFirstRoute(url.pathname)) {
        event.respondWith(networkFirst(request));
    } else if (isCacheFirstRoute(url.pathname)) {
        event.respondWith(cacheFirst(request));
    } else {
        event.respondWith(staleWhileRevalidate(request));
    }
});

// Network-first strategy
async function networkFirst(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed, serving from cache:', error);
        
        const cachedResponse = await cache.match(request);
        if (cachedResponse) {
            return cachedResponse;
        }
        
        // Return offline page if no cache available
        return caches.match('/offline.html');
    }
}

// Cache-first strategy
async function cacheFirst(request) {
    const cache = await caches.open(CACHE_NAME);
    
    const cachedResponse = await cache.match(request);
    if (cachedResponse) {
        return cachedResponse;
    }
    
    try {
        const networkResponse = await fetch(request);
        
        // Cache successful responses
        if (networkResponse.ok) {
            cache.put(request, networkResponse.clone());
        }
        
        return networkResponse;
    } catch (error) {
        console.log('[Service Worker] Network failed for:', request.url);
        return caches.match('/offline.html');
    }
}

// Stale-while-revalidate strategy
async function staleWhileRevalidate(request) {
    const cache = await caches.open(DYNAMIC_CACHE);
    
    const cachedResponse = await cache.match(request);
    
    const fetchPromise = fetch(request)
        .then(networkResponse => {
            // Update cache in background
            if (networkResponse.ok) {
                cache.put(request, networkResponse.clone());
            }
            return networkResponse;
        })
        .catch(error => {
            console.log('[Service Worker] Fetch failed:', error);
            return cachedResponse || caches.match('/offline.html');
        });
    
    return cachedResponse || fetchPromise;
}

// Helper functions
function isNetworkFirstRoute(pathname) {
    return NETWORK_FIRST_ROUTES.some(route => pathname.startsWith(route));
}

function isCacheFirstRoute(pathname) {
    return CACHE_FIRST_ROUTES.some(route => pathname.startsWith(route));
}

// Background sync for offline form submissions
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] Background sync:', event.tag);
    
    if (event.tag === 'sync-forms') {
        event.waitUntil(syncOfflineForms());
    }
});

async function syncOfflineForms() {
    // Get pending form submissions from IndexedDB
    const db = await openDB();
    const tx = db.transaction('pending-forms', 'readonly');
    const store = tx.objectStore('pending-forms');
    const forms = await store.getAll();
    
    for (const form of forms) {
        try {
            const response = await fetch(form.url, {
                method: 'POST',
                headers: form.headers,
                body: form.body
            });
            
            if (response.ok) {
                // Remove from pending if successful
                const deleteTx = db.transaction('pending-forms', 'readwrite');
                await deleteTx.objectStore('pending-forms').delete(form.id);
            }
        } catch (error) {
            console.error('[Service Worker] Sync failed:', error);
        }
    }
}

// Push notifications
self.addEventListener('push', (event) => {
    console.log('[Service Worker] Push received:', event);
    
    let data = {};
    if (event.data) {
        data = event.data.json();
    }
    
    const options = {
        body: data.body || 'New update from Blaze Intelligence',
        icon: '/icons/icon-192x192.png',
        badge: '/icons/badge-72x72.png',
        vibrate: [100, 50, 100],
        data: {
            dateOfArrival: Date.now(),
            primaryKey: 1,
            url: data.url || '/'
        },
        actions: [
            {
                action: 'view',
                title: 'View',
                icon: '/icons/checkmark.png'
            },
            {
                action: 'close',
                title: 'Close',
                icon: '/icons/xmark.png'
            }
        ]
    };
    
    event.waitUntil(
        self.registration.showNotification(
            data.title || 'Blaze Intelligence Alert',
            options
        )
    );
});

// Notification click handler
self.addEventListener('notificationclick', (event) => {
    console.log('[Service Worker] Notification clicked:', event);
    
    event.notification.close();
    
    if (event.action === 'view' || !event.action) {
        const urlToOpen = event.notification.data.url || '/';
        
        event.waitUntil(
            clients.matchAll({ type: 'window', includeUncontrolled: true })
                .then(windowClients => {
                    // Check if there's already a window open
                    for (const client of windowClients) {
                        if (client.url === urlToOpen && 'focus' in client) {
                            return client.focus();
                        }
                    }
                    // Open new window if none found
                    if (clients.openWindow) {
                        return clients.openWindow(urlToOpen);
                    }
                })
        );
    }
});

// Message handler for client communication
self.addEventListener('message', (event) => {
    console.log('[Service Worker] Message received:', event.data);
    
    if (event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    
    if (event.data.type === 'CLEAR_CACHE') {
        event.waitUntil(
            caches.keys()
                .then(cacheNames => {
                    return Promise.all(
                        cacheNames.map(cacheName => caches.delete(cacheName))
                    );
                })
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                })
        );
    }
    
    if (event.data.type === 'CACHE_URLS') {
        event.waitUntil(
            caches.open(DYNAMIC_CACHE)
                .then(cache => {
                    return cache.addAll(event.data.urls);
                })
                .then(() => {
                    event.ports[0].postMessage({ success: true });
                })
        );
    }
});

// Periodic background sync for data updates
self.addEventListener('periodicsync', (event) => {
    if (event.tag === 'update-analytics') {
        event.waitUntil(updateAnalyticsData());
    }
});

async function updateAnalyticsData() {
    try {
        const response = await fetch('/data/blaze-metrics.json');
        const data = await response.json();
        
        // Update cache with fresh data
        const cache = await caches.open(DATA_CACHE);
        await cache.put('/data/blaze-metrics.json', new Response(JSON.stringify(data)));
        
        // Notify clients of update
        const clients = await self.clients.matchAll();
        clients.forEach(client => {
            client.postMessage({
                type: 'DATA_UPDATED',
                data: data
            });
        });
    } catch (error) {
        console.error('[Service Worker] Analytics update failed:', error);
    }
}

// Helper function to open IndexedDB
function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open('BlazeIntelligence', 1);
        
        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);
        
        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            
            if (!db.objectStoreNames.contains('pending-forms')) {
                db.createObjectStore('pending-forms', { keyPath: 'id', autoIncrement: true });
            }
        };
    });
}

console.log('[Service Worker] Loaded successfully');