// Service Worker de auto-destrucción para limpiar cachés obsoletas en dispositivos
self.addEventListener('install', (event) => {
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(keys.map((key) => caches.delete(key)));
    }).then(() => {
      return self.registration.unregister();
    }).then(() => {
      return self.clients.claim();
    })
  );
});

self.addEventListener('fetch', (event) => {
  // Pasar todas las solicitudes a la red/assets locales sin tocar la caché
  event.respondWith(fetch(event.request));
});
