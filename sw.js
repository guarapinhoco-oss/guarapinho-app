// Guarda la pantalla en el celular para que la app abra sin internet. Versión d7aaa80082.
const CACHE = 'guarapinho-d7aaa80082';
const FUENTES = 'fuentes-guarapinho';
const ARCHIVOS = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './icon-512.png', './apple-touch-icon.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
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
      // Con señal trae la versión nueva; si no responde en 4 segundos o no hay señal, abre la guardada.
      const red = fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put('./index.html', c)); } return r; });
      const guardada = () => caches.match('./index.html', { ignoreSearch: true });
      e.respondWith(new Promise(ok => {
        let listo = false;
        const t = setTimeout(() => guardada().then(r => { if (r && !listo) { listo = true; ok(r); } }), 4000);
        red.then(r => { if (!listo) { listo = true; clearTimeout(t); ok(r); } })
          .catch(() => guardada().then(r => { if (!listo) { listo = true; clearTimeout(t); ok(r || Response.error()); } }));
      }));
      return;
    }
    e.respondWith(caches.match(req, { ignoreSearch: true }).then(r => r || fetch(req)));
    return;
  }
  if (/(^|\.)fonts\.(googleapis|gstatic)\.com$/.test(url.hostname)) {
    e.respondWith(caches.open(FUENTES).then(c => c.match(req).then(r => r || fetch(req).then(res => { c.put(req, res.clone()); return res; }))));
  }
});
