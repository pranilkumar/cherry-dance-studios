// Service Worker for PWA offline support and real-time features
const CACHE_NAME = 'cherry-dance-v1';
const RUNTIME_CACHE = 'runtime-cache-v1';
const API_CACHE = 'api-cache-v1';

const urlsToCache = [
  '/',
  '/index.html',
  '/manifest.json',
  '/styles/main.css',
];

// Install event
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache).catch(err => {
        console.log('Cache addAll error:', err);
      });
    }).then(() => self.skipWaiting())
  );
});

// Activate event
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME && cacheName !== RUNTIME_CACHE && cacheName !== API_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// Fetch event with Network-First strategy for API calls
self.addEventListener('fetch', event => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests and external URLs
  if (request.method !== 'GET') {
    return;
  }

  // API calls - Network First
  if (url.pathname.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then(response => {
          if (!response || response.status !== 200) {
            return response;
          }
          const responseClone = response.clone();
          caches.open(API_CACHE).then(cache => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          return caches.match(request).then(cachedResponse => {
            return cachedResponse || new Response('Offline - API not available', {
              status: 503,
              statusText: 'Service Unavailable',
              headers: new Headers({
                'Content-Type': 'text/plain'
              })
            });
          });
        })
    );
    return;
  }

  // Static assets - Cache First
  event.respondWith(
    caches.match(request).then(response => {
      if (response) {
        return response;
      }
      return fetch(request).then(response => {
        if (!response || response.status !== 200 || response.type === 'error') {
          return response;
        }
        const responseClone = response.clone();
        caches.open(RUNTIME_CACHE).then(cache => {
          cache.put(request, responseClone);
        });
        return response;
      }).catch(() => {
        return caches.match('/index.html');
      });
    })
  );
});

// Background Sync for offline form submissions
self.addEventListener('sync', event => {
  if (event.tag === 'sync-registrations') {
    event.waitUntil(syncRegistrations());
  }
  if (event.tag === 'sync-payments') {
    event.waitUntil(syncPayments());
  }
});

async function syncRegistrations() {
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/registrations')) {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('Sync registrations failed:', error);
  }
}

async function syncPayments() {
  try {
    const cache = await caches.open(API_CACHE);
    const requests = await cache.keys();
    
    for (const request of requests) {
      if (request.url.includes('/payments')) {
        const response = await fetch(request);
        if (response.ok) {
          await cache.delete(request);
        }
      }
    }
  } catch (error) {
    console.error('Sync payments failed:', error);
  }
}

// Push notification handling
self.addEventListener('push', event => {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'New notification from Cherry Dance Studios',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'cherry-dance-notification',
    requireInteraction: false,
    actions: [
      {
        action: 'open',
        title: 'Open',
        icon: '/icons/open-icon.png'
      },
      {
        action: 'close',
        title: 'Close',
        icon: '/icons/close-icon.png'
      }
    ],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: data.id || 1
    }
  };

  event.waitUntil(
    self.registration.showNotification(data.title || 'Cherry Dance Studios', options)
  );
});

// Notification click handling
self.addEventListener('notificationclick', event => {
  event.notification.close();

  if (event.action === 'open') {
    event.waitUntil(
      clients.matchAll({ type: 'window', includeUncontrolled: true }).then(clientList => {
        for (let i = 0; i < clientList.length; i++) {
          const client = clientList[i];
          if (client.url === '/' && 'focus' in client) {
            return client.focus();
          }
        }
        if (clients.openWindow) {
          return clients.openWindow(event.notification.data.url || '/');
        }
      })
    );
  }
});

// Message handling from clients
self.addEventListener('message', event => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
