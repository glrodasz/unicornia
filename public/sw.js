// Service worker: lets the home-screen app open without internet.
//   Pages (/, /es): network first, so a new version shows up as soon as there is a connection;
//                   the last copy is served offline.
//   Everything else (three.js, icons, Google Fonts): cache first, refreshed in the background.
// Bump VERSION to drop old caches when the list of files changes.
const VERSION = 'v1';
const CACHE = `unicornia-${VERSION}`;
const PRECACHE = ['/', '/es', '/vendor/three.min.js', '/favicon.svg', '/apple-touch-icon.png', '/icons/icon-192.png', '/icons/icon-512.png'];
const FONT_HOSTS = ['fonts.googleapis.com', 'fonts.gstatic.com'];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(PRECACHE)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('unicornia-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

// Safari refuses a redirected response for a navigation, so store a clean copy.
const unredirect = (res) => (res.redirected ? res.blob().then((b) => new Response(b, { status: res.status, statusText: res.statusText, headers: res.headers })) : res);

async function page(req) {
  const cache = await caches.open(CACHE);
  const key = new URL(req.url).pathname; // ?lite=1 and friends share one copy
  try {
    const res = await unredirect(await fetch(req));
    if (res.ok) cache.put(key, res.clone());
    return res;
  } catch (err) {
    return (await cache.match(key)) || (await cache.match(key.startsWith('/es') ? '/es' : '/')) || Response.error();
  }
}

async function asset(req) {
  const cache = await caches.open(CACHE);
  const hit = await cache.match(req);
  const fresh = fetch(req).then((res) => {
    if (res.ok || res.type === 'opaque') cache.put(req, res.clone());
    return res;
  }).catch(() => hit);
  return hit || fresh;
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (req.mode === 'navigate' && url.origin === location.origin) e.respondWith(page(req));
  else if (url.origin === location.origin || FONT_HOSTS.includes(url.hostname)) e.respondWith(asset(req));
});
