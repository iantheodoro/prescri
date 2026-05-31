// ============================================================
//  sw.js — Service Worker — PrescriçõesMed
// ============================================================

const CACHE_NAME = "rxmed-v31050932";

const SITE_ASSETS = [
  "/prescri/index.html",
  "/prescri/style.css",
  "/prescri/app.js",
  "/prescri/db.js",
  "/prescri/pediatria.js",
  "/prescri/shortcuts.js",
  "/prescri/manifest.json",
  "/prescri/icon-192.png",
  "/prescri/icon-512.png",
];

const EXTERNAL_ASSETS = [
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js",
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap"
];

// ── Install ─────────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      Promise.allSettled(
        [...SITE_ASSETS, ...EXTERNAL_ASSETS].map(url =>
          cache.add(url).catch(e => console.warn("Cache miss:", url, e))
        )
      )
    )
  );
  self.skipWaiting();
});

// ── Activate ─────────────────────────────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
    )
  );
  self.clients.claim();
});

// ── Fetch ────────────────────────────────────────────────
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Firestore: sempre tenta a rede
  if (url.hostname.includes("firestore.googleapis.com")) {
    event.respondWith(
      fetch(event.request).catch(() =>
        new Response(JSON.stringify({ offline: true }), {
          headers: { "Content-Type": "application/json" }
        })
      )
    );
    return;
  }

  // Assets externos (Firebase, fontes): cache-first (raramente mudam)
  const isExternal = url.hostname.includes("gstatic.com") ||
                     url.hostname.includes("fonts.googleapis.com") ||
                     url.hostname.includes("fonts.gstatic.com");

  if (isExternal) {
    event.respondWith(
      caches.match(event.request).then(cached => cached || fetch(event.request))
    );
    return;
  }

  // Assets do proprio site: network-first -> atualiza sempre que online
  // Se offline, serve do cache
  event.respondWith(
    fetch(event.request)
      .then(response => {
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() =>
        caches.match(event.request).then(cached =>
          cached || caches.match("/prescri/index.html")
        )
      )
  );
});
