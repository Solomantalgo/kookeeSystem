// Kookee Service Worker - Network-First Image Caching
// Version 1.0

const CACHE_VERSION = 'kookee-v1';
const IMAGE_CACHE = `${CACHE_VERSION}-images`;
const STATIC_CACHE = `${CACHE_VERSION}-static`;

// Install event - prepare caches
self.addEventListener('install', (event) => {
    console.log('[SW] Installing service worker...');

    event.waitUntil(
        caches.open(STATIC_CACHE).then((cache) => {
            console.log('[SW] Cache opened');
            // Pre-cache critical static assets if needed
            return cache.addAll([
                '/',
                '/index.html'
            ]);
        })
    );

    // Force the waiting service worker to become the active service worker
    self.skipWaiting();
});

// Activate event - clean up old caches
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating service worker...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // Delete old caches that don't match current version
                    if (cacheName.startsWith('kookee-') && cacheName !== IMAGE_CACHE && cacheName !== STATIC_CACHE) {
                        console.log('[SW] Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // Take control of all pages immediately
    return self.clients.claim();
});

// Fetch event - Network-First with Cache Fallback for images
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // Only handle same-origin requests
    if (url.origin !== location.origin) {
        return;
    }

    // Network-first strategy for images (as per requirements)
    if (request.url.includes('/images/') && !request.url.endsWith('/images/')) {
        event.respondWith(
            caches.open(IMAGE_CACHE).then((cache) => {
                return fetch(request)
                    .then((networkResponse) => {
                        // Network succeeded - cache the fresh response
                        if (networkResponse && networkResponse.status === 200) {
                            console.log('[SW] Caching fresh image:', request.url);
                            cache.put(request, networkResponse.clone());
                        }
                        return networkResponse;
                    })
                    .catch(() => {
                        // Network failed - fallback to cache
                        console.log('[SW] Network failed, trying cache for:', request.url);
                        return cache.match(request).then((cachedResponse) => {
                            if (cachedResponse) {
                                console.log('[SW] Serving from cache:', request.url);
                                return cachedResponse;
                            }
                            // No cache either - return a placeholder or error
                            console.log('[SW] No cache available for:', request.url);
                            return new Response('Image not available offline', {
                                status: 503,
                                statusText: 'Service Unavailable'
                            });
                        });
                    });
            })
        );
        return;
    }

    // For non-image requests, use default browser behavior
    return;
});

// Listen for messages from the main thread
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        console.log('[SW] Received CLEAR_CACHE message');

        event.waitUntil(
            caches.keys().then((cacheNames) => {
                return Promise.all(
                    cacheNames.map((cacheName) => {
                        if (cacheName.startsWith('kookee-')) {
                            console.log('[SW] Clearing cache:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            }).then(() => {
                // Notify the client that cache is cleared
                event.ports[0].postMessage({ success: true });
            })
        );
    }
});
