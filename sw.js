const CACHE_NAME = 'musichris-themes-v2';
const ASSETS = [
  './',
  'index.html',
  'assets/logo_app.png',
  'assets/master_template.png'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request).then((response) => {
      return response || fetch(event.request);
    })
  );
});
