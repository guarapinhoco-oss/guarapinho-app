// Guarda la pantalla en el celular para que la app abra sin internet. Versión 6bd398e99e.
const CACHE = 'guarapinho-6bd398e99e';
const FUENTES = 'fuentes-guarapinho';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS.map(u => new Request(u, { cache: 'reload' })))).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k.indexOf('guarapinho-') === 0 && k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return; // las llamadas al servidor (POST) no pasan por aquí
  const url = new URL(req.url);
  if (url.origin === location.origin) {
    if (req.mode === 'navigate') {
      // Abre al instante con la pantalla guardada en el celular y en segundo plano trae la versión nueva para la próxima vez.
      // Si todavía no hay nada guardado (primera vez), la trae de internet.
      const red = fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); } return r; });
      e.waitUntil(red.catch(() => {}));
      e.respondWith(caches.match('./index.html', { ignoreSearch: true }).then(g => g || red));
      return;
    }
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
    return;
  }
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FUENTES).then(c => c.match(req).then(r => r || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
});
