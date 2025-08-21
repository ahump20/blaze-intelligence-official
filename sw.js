// Service Worker for Blaze Intelligence PWA

const CACHE_NAME = 'blaze-intelligence-v1.0.0';
const STATIC_CACHE_NAME = 'blaze-static-v1.0.0';
const DYNAMIC_CACHE_NAME = 'blaze-dynamic-v1.0.0';

// Files to cache immediately
const STATIC_FILES = [
  '/',
  '/index.html',
  '/app.html',
  '/pricing.html',
  '/loading.css',
  '/api-integration.js',
  '/manifest.json',
  // Add more static assets as needed
];

// Install event - cache static files
self.addEventListener('install', event => {
  console.log('Service Worker installing...');
  
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
      .then(cache => {
        console.log('Caching static files...');
        return cache.addAll(STATIC_FILES);
      })
      .then(() => {
        console.log('Static files cached successfully');
        return self.skipWaiting();
      })
      .catch(error => {
        console.error('Failed to cache static files:', error);
      })
  );
});

// Activate event - clean up old caches
self.addEventListener('activate', event => {
  console.log('Service Worker activating...');
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            // Delete old caches
            if (cacheName !== STATIC_CACHE_NAME && 
                cacheName !== DYNAMIC_CACHE_NAME &&
                cacheName.startsWith('blaze-')) {
              console.log('Deleting old cache:', cacheName);
              return caches.delete(cacheName);
            }
          })
        );
      })
      .then(() => {
        console.log('Service Worker activated');
        return self.clients.claim();
      })
  );
});

// Fetch event - serve cached content or fetch from network
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return;
  }

  // Skip chrome-extension requests
  if (url.protocol === 'chrome-extension:') {
    return;
  }

  // Handle API requests differently
  if (url.pathname.startsWith('/api/') || 
      url.hostname.includes('sportradar') ||
      url.hostname.includes('workers.dev')) {
    event.respondWith(handleApiRequest(request));
    return;
  }

  // Handle static files
  event.respondWith(handleStaticRequest(request));
});

// Handle static file requests with cache-first strategy
async function handleStaticRequest(request) {
  try {
    // Try cache first
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      // Serve from cache and update in background
      fetchAndCache(request);
      return cachedResponse;
    }

    // If not in cache, fetch from network
    return await fetchAndCache(request);
  } catch (error) {
    console.error('Failed to handle static request:', error);
    
    // Return offline fallback if available
    if (request.destination === 'document') {
      const offlinePage = await caches.match('/offline.html');
      return offlinePage || new Response('Offline', { status: 503 });
    }
    
    return new Response('Network Error', { status: 503 });
  }
}

// Handle API requests with network-first strategy
async function handleApiRequest(request) {
  try {
    // Try network first for fresh data
    const networkResponse = await fetch(request);
    
    // Cache successful responses
    if (networkResponse.ok) {
      const cache = await caches.open(DYNAMIC_CACHE_NAME);
      cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.warn('Network request failed, trying cache:', error);
    
    // Fallback to cache if network fails
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // Return mock data for critical API endpoints
    return handleOfflineApiRequest(request);
  }
}

// Fetch and cache helper function
async function fetchAndCache(request) {
  try {
    const response = await fetch(request);
    
    // Only cache successful responses
    if (response.ok) {
      const cache = await caches.open(STATIC_CACHE_NAME);
      cache.put(request, response.clone());
    }
    
    return response;
  } catch (error) {
    console.error('Fetch failed:', error);
    throw error;
  }
}

// Handle offline API requests with mock data
function handleOfflineApiRequest(request) {
  const url = new URL(request.url);
  
  // Mock responses for different endpoints
  const mockData = {
    '/api/teams': [
      { id: 'mem', name: 'Memphis Grizzlies', abbreviation: 'MEM' }
    ],
    '/api/games': [
      {
        id: 'offline-game',
        homeTeam: 'LAL',
        awayTeam: 'GSW',
        status: 'scheduled',
        date: new Date().toISOString()
      }
    ],
    '/api/players': [
      { 
        id: 'offline-player',
        name: 'Offline Player',
        position: 'Guard',
        stats: { ppg: 20.0, rpg: 5.0, apg: 7.0 }
      }
    ]
  };

  const endpoint = url.pathname;
  const data = mockData[endpoint] || { message: 'Offline - limited functionality' };
  
  return new Response(JSON.stringify(data), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-Offline': 'true'
    }
  });
}

// Background sync for pending data
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag);
  
  if (event.tag === 'sync-game-data') {
    event.waitUntil(syncGameData());
  } else if (event.tag === 'sync-player-stats') {
    event.waitUntil(syncPlayerStats());
  }
});

// Sync game data when back online
async function syncGameData() {
  try {
    // Get pending sync data from IndexedDB or localStorage
    const pendingData = getPendingSyncData('game-data');
    
    if (pendingData.length > 0) {
      for (const data of pendingData) {
        await fetch(data.url, {
          method: data.method,
          body: JSON.stringify(data.payload),
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      // Clear pending data after successful sync
      clearPendingSyncData('game-data');
      console.log('Game data synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync game data:', error);
  }
}

// Sync player stats when back online
async function syncPlayerStats() {
  try {
    const pendingData = getPendingSyncData('player-stats');
    
    if (pendingData.length > 0) {
      for (const data of pendingData) {
        await fetch(data.url, {
          method: data.method,
          body: JSON.stringify(data.payload),
          headers: { 'Content-Type': 'application/json' }
        });
      }
      
      clearPendingSyncData('player-stats');
      console.log('Player stats synced successfully');
    }
  } catch (error) {
    console.error('Failed to sync player stats:', error);
  }
}

// Helper functions for pending sync data (using localStorage as simple example)
function getPendingSyncData(type) {
  try {
    const data = localStorage.getItem(`pending-sync-${type}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Failed to get pending sync data:', error);
    return [];
  }
}

function clearPendingSyncData(type) {
  try {
    localStorage.removeItem(`pending-sync-${type}`);
  } catch (error) {
    console.error('Failed to clear pending sync data:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  console.log('Push notification received');
  
  const options = {
    body: 'New game update available!',
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
        title: 'View Game',
        icon: '/icons/view-action.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-action.png'
      }
    ]
  };

  if (event.data) {
    try {
      const payload = event.data.json();
      options.body = payload.body || options.body;
      options.title = payload.title || 'Blaze Intelligence';
      options.data = { ...options.data, ...payload.data };
    } catch (error) {
      console.error('Failed to parse push payload:', error);
    }
  }

  event.waitUntil(
    self.registration.showNotification('Blaze Intelligence', options)
  );
});

// Handle notification clicks
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.action);
  
  event.notification.close();

  if (event.action === 'view') {
    // Open the app to specific page
    event.waitUntil(
      clients.openWindow('/app.html#live-games')
    );
  } else if (event.action === 'close') {
    // Just close the notification
    return;
  } else {
    // Default action - open the app
    event.waitUntil(
      clients.openWindow('/')
    );
  }
});

// Update available notification
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});