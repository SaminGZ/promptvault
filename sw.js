// PromptVault offline service worker — build 20260715162916
const CACHE = 'pv-20260715162916';
const SHELL = ['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.concat(['data.js','vec.js'])))); });
self.addEventListener('activate', e => { e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k!==CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // data.js + vec.js: network-first so a Mac-on refresh brings new prompts; cache fallback offline.
  if(url.pathname.endsWith('data.js') || url.pathname.endsWith('vec.js')){
    e.respondWith(fetch(e.request).then(r => { caches.open(CACHE).then(c => c.put(e.request, r.clone())); return r; })
      .catch(() => caches.match(e.request))); return;
  }
  // everything else: cache-first (instant + offline).
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});