// ============================================================
//  sw.js — Service Worker — PrescriçõesMed
// ============================================================

const CACHE_NAME = "rxmed-v31050931";

const STATIC_ASSETS = [
  "/prescri/index.html",
  "/prescri/style.css",
  "/prescri/app.js",
  "/prescri/db.js",
  "/prescri/pediatria.js",
  "/prescri/shortcuts.js",
  "/prescri/manifest.json",
  "/prescri/icon-192.png",
  "/prescri/icon-512.png",
  // Scripts do Firebase — precisam estar cacheados para funcionar offline
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/9.23.0/firebase-firestore-compat.js",
  // Fontes
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap"
];

// ── Install ─────────────────────────────────────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      // Adiciona um por um para não falhar tudo se uma fonte não carregar
      return Promise.allSettled(
        STATIC_ASSETS.map(url => cache.add(url).catch(e => console.warn("Cache miss:", url, e)))
      );
    })
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

// ── Fetch: cache-first para tudo ─────────────────────────
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Requisições do Firestore (dados): network-first, sem fallback de dados
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

  // Tudo mais (incluindo scripts Firebase, fontes, assets): cache-first
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cacheia dinamicamente qualquer asset novo bem-sucedido
        if (response.ok) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => caches.match("/prescri/index.html"));
    })
  );
});
