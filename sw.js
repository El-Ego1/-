/* HESABATI ERP — Service Worker (offline-first) */
const VERSION = 'hesabati-v3.1';
const SHELL = 'shell-' + VERSION;
const RUNTIME = 'runtime-' + VERSION;

const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
  './icons/icon-maskable-512.png'
];

// مكتبات خارجية يحتاجها التطبيق (تتخزن أول مرة وتشتغل بعدها أوفلاين)
const CDN_LIBS = [
  'https://cdn.jsdelivr.net/npm/chart.js@4.4.1/dist/chart.umd.min.js',
  'https://cdn.jsdelivr.net/npm/xlsx@0.18.5/dist/xlsx.full.min.js'
];

self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const shell = await caches.open(SHELL);
    await shell.addAll(APP_SHELL);
    const runtime = await caches.open(RUNTIME);
    // أي مكتبة تفشل ما توقفش التثبيت
    await Promise.all(CDN_LIBS.map(async url => {
      try { await runtime.add(new Request(url, { mode: 'cors' })); } catch (e) {}
    }));
    await self.skipWaiting();
  })());
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k !== SHELL && k !== RUNTIME).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message', event => {
  if (event.data === 'SKIP_WAITING') self.skipWaiting();
});

self.addEventListener('fetch', event => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);

  // صفحات التنقل: شبكة أولاً ثم الكاش (عشان التحديثات توصل)، وfallback لـ index.html
  if (req.mode === 'navigate') {
    event.respondWith((async () => {
      try {
        const fresh = await fetch(req);
        const cache = await caches.open(SHELL);
        cache.put('./index.html', fresh.clone());
        return fresh;
      } catch (e) {
        return (await caches.match(req, { ignoreSearch: true })) ||
               (await caches.match('./index.html')) ||
               new Response('أنت غير متصل بالإنترنت', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
      }
    })());
    return;
  }

  // خطوط جوجل + مكتبات CDN: كاش أولاً مع تحديث في الخلفية
  const isCDN = /(^|\.)(googleapis|gstatic|jsdelivr)\.(com|net)$/.test(url.hostname);
  if (isCDN) {
    event.respondWith((async () => {
      const cache = await caches.open(RUNTIME);
      const cached = await cache.match(req);
      const network = fetch(req).then(res => {
        if (res && (res.ok || res.type === 'opaque')) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      return cached || (await network) || Response.error();
    })());
    return;
  }

  // باقي الملفات المحلية: كاش أولاً
  if (url.origin === self.location.origin) {
    event.respondWith((async () => {
      const cached = await caches.match(req, { ignoreSearch: true });
      if (cached) return cached;
      try {
        const res = await fetch(req);
        if (res.ok) (await caches.open(SHELL)).put(req, res.clone());
        return res;
      } catch (e) {
        return Response.error();
      }
    })());
  }
});
