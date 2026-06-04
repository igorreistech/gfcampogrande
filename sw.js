const CACHE = 'monitor-cgr-v4';
const ASSETS = [
  '/gfcampogrande/',
  '/gfcampogrande/index.html',
  '/gfcampogrande/app.js',
  '/gfcampogrande/styles.css',
  '/gfcampogrande/manifest.json'
];

self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE).then(cache => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(key => key !== CACHE).map(key => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const request = e.request;
  if (request.mode === 'navigate') {
    e.respondWith(
      fetch(request)
        .then(response => response)
        .catch(() => caches.match('/gfcampogrande/') )
    );
    return;
  }

  e.respondWith(
    caches.match(request).then(cached => cached || fetch(request).then(response => {
      if (response && response.status === 200 && response.type === 'basic') {
        const clone = response.clone();
        caches.open(CACHE).then(cache => cache.put(request, clone));
      }
      return response;
    }).catch(() => cached))
  );
});
