// sw.js - Medical App Service Worker v1.8.6
const APP_VERSION = '1.9.6';
const CACHE_NAME = `medical-app-${APP_VERSION}`;

// Complete file list - Add your CSS/JS files here
const urlsToCache = [
  // Root files
  '/',
  '/index.html',
  '/profile.html',
  '/offline.html',
  '/manifest.json',
  '/dashboard.html',
  '/404.html',
  
  // Year 1 main pages
  '/yr1/ps.html',
  '/yr1/pc.html',
  '/yr1/im.html',
  '/yr1/an.html',
  '/yr1/pcd.html',
  '/yr1/pr.html',
  '/yr1/pt.html',
  '/yr1/micro.html',
  
  // pt subfolder
  '/yr1/pt/hem1.html',
  '/yr1/pt/logo.png',
  '/yr1/pt/pte2013.html',
  '/yr1/pt/pte2014.html',
  '/yr1/pt/pte2014e.html',
  '/yr1/pt/pte2017.html',
  '/yr1/pt/ptp-1.html',
  '/yr1/pt/ptp-2.html',
  '/yr1/pt/ptp-3.html',
  '/yr1/pt/ptp-4.html',
  '/yr1/pt/ptp-5.html',

  // pc
  '/yr1/pc/2014.13.png',
  '/yr1/pc/2014.14.png',
  '/yr1/pc/2015.8.png',
  '/yr1/pc/2015.9.png',
  '/yr1/pc/2015.54.png',
  '/yr1/pc/logo.png',
  '/yr1/pc/pce.2014.html',
  '/yr1/pc/pce.2014re.html',
  '/yr1/pc/pce.2015.html',
  '/yr1/pc/pce.2016.html',
  '/yr1/pc/lipincot.html',
  
  // pcd
  '/yr1/pcd/logo.png',
  '/yr1/pcd/pcd.2014.html',
  '/yr1/pcd/pcd.2016.html',
  '/yr1/pcd/pcd2016.html',
  
  // micro
  '/yr1/micro/logo.png',
  '/yr1/micro/mib.2013.html',
  '/yr1/micro/mib.2015.html',
  '/yr1/micro/mibpr1.html',
  '/yr1/micro/mibpr2.html',
  '/yr1/micro/micro2.html',
  '/yr1/micro/microp1.html',
  
  // im
  '/yr1/im/ime2013.html',
  '/yr1/im/ime2014,2015.html',
  '/yr1/im/impl.html',
  '/yr1/im/logo - Copy.png',
  '/yr1/im/logo.png',
  
  // pr
  '/yr1/pr/logo.png',
  '/yr1/pr/pre.2014.html',
  '/yr1/pr/pre.2015.html',
  '/yr1/pr/pre.2016.html',
  
  // bc
  '/yr1/bc/bce2014.html',
  '/yr1/bc/bio-chem.2013.html',
  '/yr1/bc/bio-chem.2015.html',
  
  // JavaScript files
  '/auth-check.js',
  '/protect.js',
  
  // ⚠️ ADD YOUR CSS/JS FILES HERE:
  // Example: '/styles.css',
  // Example: '/app.js',
  // Example: '/yr1/ps.js',
];

// Files that should never be cached (always fetch fresh)
const NEVER_CACHE = [
  '/sw.js',
  '/api/',
  '/auth/'
];

// Install event - Cache all essential files
self.addEventListener('install', (event) => {
  console.log(`🚀 Medical App v${APP_VERSION}: Installing...`);
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log(`📦 Opening cache: ${CACHE_NAME}`);
        
        // Use cache.addAll() for better performance
        return cache.addAll(urlsToCache)
          .then(() => {
            console.log(`✅ Successfully cached ${urlsToCache.length} files`);
          })
          .catch(error => {
            console.log('⚠️ Some files failed to cache:', error);
            // Continue anyway - partial cache is OK
          });
      })
      .then(() => {
        console.log('✨ Installation complete');
        return self.skipWaiting(); // Activate immediately
      })
      .catch(error => {
        console.error('💥 Installation failed:', error);
      })
  );
});

// Fetch event - Smart caching strategy
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  const request = event.request;
  
  // Skip non-GET requests and cross-origin requests
  if (request.method !== 'GET' || url.origin !== self.location.origin) {
    return;
  }
  
  // Skip files that should never be cached
  if (NEVER_CACHE.some(path => url.pathname.startsWith(path))) {
    return;
  }
  
  // Strategy 1: HTML pages - Network First (for fresh content)
  if (request.mode === 'navigate' || 
      request.headers.get('Accept')?.includes('text/html')) {
    event.respondWith(handleHtmlRequest(request));
    return;
  }
  
  // Strategy 2: Images - Cache First (stale-while-revalidate)
  if (request.destination === 'image' || 
      url.pathname.match(/\.(png|jpg|jpeg|gif|svg|ico)$/)) {
    event.respondWith(handleImageRequest(request));
    return;
  }
  
  // Strategy 3: CSS, JS, Fonts - Cache First with background update
  if (request.destination === 'style' || 
      request.destination === 'script' || 
      request.destination === 'font' ||
      url.pathname.match(/\.(css|js|woff|woff2|ttf|eot)$/)) {
    event.respondWith(handleAssetRequest(request));
    return;
  }
  
  // Strategy 4: Everything else - Network First
  event.respondWith(handleDefaultRequest(request));
});

// Handle HTML requests (Network First)
async function handleHtmlRequest(request) {
  try {
    // Try network first
    const networkResponse = await fetch(request);
    
    // Cache the fresh response for next time
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    
    return networkResponse;
  } catch (error) {
    console.log(`🌐 Network failed for ${request.url}, trying cache...`);
    
    // Network failed, try cache
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    
    // No cache, show offline page for navigation requests
    if (request.mode === 'navigate') {
      const offlineResponse = await caches.match('/offline.html');
      if (offlineResponse) {
        return offlineResponse;
      }
    }
    
    // Return generic offline response
    return new Response(
      '<h1>Offline</h1><p>Please check your internet connection.</p>',
      { 
        status: 503, 
        statusText: 'Offline',
        headers: { 'Content-Type': 'text/html; charset=utf-8' }
      }
    );
  }
}

// Handle Image requests (Cache First with background update)
async function handleImageRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update cache in background
    fetchAndCache(request);
    return cachedResponse;
  }
  
  // Not in cache, try network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      // Cache for next time
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return placeholder for missing images
    return new Response(
      '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150" viewBox="0 0 200 150">' +
      '<rect width="200" height="150" fill="#f0f0f0"/>' +
      '<text x="100" y="75" text-anchor="middle" fill="#999" font-family="sans-serif" font-size="12">' +
      'Image offline</text></svg>',
      { 
        headers: { 'Content-Type': 'image/svg+xml' }
      }
    );
  }
}

// Handle Asset requests (Cache First)
async function handleAssetRequest(request) {
  // Try cache first
  const cachedResponse = await caches.match(request);
  if (cachedResponse) {
    // Update in background
    fetchAndCache(request);
    return cachedResponse;
  }
  
  // Not in cache, fetch from network
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
    return networkResponse;
  } catch (error) {
    // Return empty response for failed assets
    if (request.destination === 'style') {
      return new Response('/* Styles offline */', {
        headers: { 'Content-Type': 'text/css' }
      });
    }
    if (request.destination === 'script') {
      return new Response('// Script offline', {
        headers: { 'Content-Type': 'application/javascript' }
      });
    }
    return new Response('Resource offline', { status: 503 });
  }
}

// Handle Default requests (Network First)
async function handleDefaultRequest(request) {
  try {
    const networkResponse = await fetch(request);
    return networkResponse;
  } catch (error) {
    const cachedResponse = await caches.match(request);
    if (cachedResponse) {
      return cachedResponse;
    }
    return new Response('Offline', { status: 503 });
  }
}

// Background cache update
async function fetchAndCache(request) {
  try {
    const networkResponse = await fetch(request);
    if (networkResponse.ok) {
      const cache = await caches.open(CACHE_NAME);
      await cache.put(request, networkResponse.clone());
    }
  } catch (error) {
    // Silent fail for background updates
  }
}

// Activate event - Clean up old caches
self.addEventListener('activate', (event) => {
  console.log(`🔥 Medical App v${APP_VERSION}: Activated`);
  
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          // Delete old medical-app caches
          if (cacheName.startsWith('medical-app-') && cacheName !== CACHE_NAME) {
            console.log(`🗑️ Deleting old cache: ${cacheName}`);
            return caches.delete(cacheName);
          }
        })
      );
    })
    .then(() => {
      console.log(`✅ v${APP_VERSION} ready to serve`);
      
      // Notify all clients about the update
      return self.clients.matchAll().then(clients => {
        clients.forEach(client => {
          client.postMessage({
            type: 'SW_UPDATED',
            version: APP_VERSION,
            timestamp: new Date().toISOString(),
            message: 'Medical App updated successfully'
          });
        });
      });
    })
    .then(() => self.clients.claim()) // Take control immediately
  );
});

// Message handling
self.addEventListener('message', (event) => {
  if (!event.data) return;
  
  switch (event.data.type) {
    case 'SKIP_WAITING':
      console.log('⏩ Skipping waiting - activating immediately');
      self.skipWaiting();
      break;
      
    case 'CHECK_FOR_UPDATES':
      console.log('🔍 Checking for updates...');
      self.registration.update();
      break;
      
    case 'CLEAR_CACHE':
      console.log('🧹 Clearing cache...');
      caches.delete(CACHE_NAME).then(() => {
        event.source.postMessage({ type: 'CACHE_CLEARED' });
      });
      break;
      
    case 'GET_CACHE_INFO':
      caches.open(CACHE_NAME).then(cache => {
        cache.keys().then(requests => {
          event.source.postMessage({
            type: 'CACHE_INFO',
            count: requests.length,
            version: APP_VERSION
          });
        });
      });
      break;
  }
});

// Periodic sync (if needed in future)
self.addEventListener('sync', event => {
  if (event.tag === 'sync-data') {
    console.log('🔄 Background sync triggered');
    // Implement your sync logic here
  }
});

// Push notifications (if needed in future)
self.addEventListener('push', event => {
  const options = {
    body: event.data?.text() || 'Medical App Update',
    icon: '/icon-192.png',
    badge: '/badge-72.png',
    vibrate: [200, 100, 200],
    data: {
      url: '/'
    }
  };
  
  event.waitUntil(
    self.registration.showNotification('Medical App', options)
  );
});

self.addEventListener('notificationclick', event => {
  event.notification.close();
  event.waitUntil(
    clients.matchAll({ type: 'window' }).then(clientList => {
      for (const client of clientList) {
        if (client.url === '/' && 'focus' in client) {
          return client.focus();
        }
      }
      if (clients.openWindow) {
        return clients.openWindow('/');
      }
    })
  );
});

// Error handling
self.addEventListener('error', event => {
  console.error('SW Error:', event.error);
});

self.addEventListener('unhandledrejection', event => {
  console.error('SW Unhandled Rejection:', event.reason);

});






