// PromptVault offline service worker — build 20260918145252
const CACHE = 'pv-20260918145252';
const SHELL = ['./','index.html','manifest.webmanifest','icon-180.png','icon-192.png','icon-512.png'];
self.addEventListener('install', e => { self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL.concat(['data.js','vec.js']).map(u => new Request(u, {cache:'reload'}))))); });
self.addEventListener('activate', e => { e.waitUntil(
  caches.keys().then(ks => Promise.all(ks.filter(k => k!==CACHE).map(k => caches.delete(k)))).then(()=>self.clients.claim())); });
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  // data.js + vec.js: network-first so a Mac-on refresh brings new prompts; cache fallback offline.
  if(e.request.mode === 'navigate' || url.pathname.endsWith('index.html') || url.pathname.endsWith('sw.js')
     || url.pathname.endsWith('data.js') || url.pathname.endsWith('vec.js')){
    const key = url.origin + url.pathname;
    e.respondWith(fetch(e.request.url, {cache:'no-store'}).then(r => {
        if(r.ok){ const cp = r.clone(); caches.open(CACHE).then(c => c.put(key, cp)); } return r; })
      .catch(() => caches.match(key, {ignoreSearch:true}).then(r => r || caches.match('index.html')).then(r => {
        if(!r) return r;   // mark offline answers so the page can tell "no network" from "already current"
        const h = new Headers(r.headers); h.set('X-PV-From-Cache', '1');
        return new Response(r.body, {status: r.status, statusText: r.statusText, headers: h});
      }))); return;
  }
  // everything else: cache-first (instant + offline).
  e.respondWith(caches.match(e.request).then(r => r || fetch(e.request)));
});