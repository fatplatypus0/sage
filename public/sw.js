/* SAGE offline shell — the plan has to work at 5:30 AM on dorm wifi (or without it). */
const CACHE = 'sage-v1';
const SHELL = ['/'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  // HTML: network first so a deploy is picked up, cache as the offline fallback
  if (req.mode === 'navigate' || (req.destination === 'document' && url.pathname.endsWith('.html'))) {
    e.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(CACHE).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/').then((r) => r || caches.match(new Request('/index.html')))),
    );
    return;
  }

  // hashed assets + icons: cache first, refresh in the background
  e.respondWith(
    caches.open(CACHE).then(async (c) => {
      const hit = await c.match(req);
      const fresh = fetch(req)
        .then((res) => {
          if (res && res.status === 200 && res.type === 'basic') c.put(req, res.clone());
          return res;
        })
        .catch(() => null);
      return hit || (await fresh) || Response.error();
    }),
  );
});
