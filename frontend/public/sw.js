const CACHE_NAME = 'vitalai-cache-v1';
const DYNAMIC_CACHE = 'vitalai-dynamic-v1';

const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json',
  '/images/abstract_woman_bg.jpg',
  '/images/ai_doctor_bg.jpg'
];

// Install event: cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate event: cleanup old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && key !== DYNAMIC_CACHE) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

// Fetch event: Network First for API, Cache First for Static
self.addEventListener('fetch', (event) => {
  const { request } = event;

  if (request.method !== 'GET') return; // Solo cacheamos GET

  // Si es una petición a la API de backend (ej. perfil de paciente)
  if (request.url.includes('/api/')) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clonamos y guardamos en caché dinámico para uso offline
          const resClone = response.clone();
          caches.open(DYNAMIC_CACHE).then((cache) => {
            cache.put(request, resClone);
          });
          return response;
        })
        .catch(async () => {
          // Si no hay red, intentamos buscar en caché dinámico
          const cached = await caches.match(request);
          return cached || new Response('{"error": "Offline"}', { status: 503, headers: { 'Content-Type': 'application/json' } });
        })
    );
  } else {
    // Para recursos estáticos y navegación (HTML/CSS/JS)
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        // Cache first, fall back to network
        return cachedResponse || fetch(request).then((response) => {
          // No cachear si no es un 200 OK
          if (!response || response.status !== 200 || response.type !== 'basic') {
             return response;
          }
          const responseToCache = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(request, responseToCache);
          });
          return response;
        }).catch(async () => {
          // Fallback para navegación si estamos offline
          if (request.mode === 'navigate') {
            const index = await caches.match('/index.html');
            if (index) return index;
          }
          return new Response('Network error and no cache', { status: 408, headers: { 'Content-Type': 'text/plain' } });
        });
      })
    );
  }
});
