/* Radar Mercado Público — service worker
   Guarda el armazón de la app para que abra sin señal.
   Las consultas a api.mercadopublico.cl nunca se cachean: siempre van a la red. */
const CACHE = 'radar-mp-v10';
const ARMAZON = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png'
];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARMAZON.map(u => new Request(u, {cache: 'reload'})))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET') return;
  if (url.hostname.endsWith('mercadopublico.cl')) return;          // datos: siempre en vivo
  if (url.origin !== self.location.origin) return;                  // fuentes y externos: al navegador
  /* La página va primero a la red: así una versión nueva se ve en la siguiente carga, sin quedar
     pegada en la copia guardada. La copia solo se usa sin señal. */
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request, {cache: 'no-store'}).then(r => {
        const copia = r.clone();
        caches.open(CACHE).then(c => c.put('./index.html', copia)).catch(() => {});
        return r;
      }).catch(() => caches.match('./index.html'))
    );
    return;
  }
  e.respondWith(
    caches.match(e.request).then(hit => hit || fetch(e.request).then(r => {
      const copia = r.clone();
      caches.open(CACHE).then(c => c.put(e.request, copia)).catch(() => {});
      return r;
    }).catch(() => caches.match('./index.html')))
  );
});
