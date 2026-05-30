// ============================================================
//  sw.js — Service Worker — PrescriçõesMed
// ============================================================

const CACHE_NAME = "rxmed-v1";

// Arquivos estáticos que ficam disponíveis offline
const STATIC_ASSETS = [
  "/index.html",
  "/style.css",
  "/app.js",
  "/db.js",
  "/pediatria.js",
  "/shortcuts.js",
  "/manifest.json",
  // Fontes do Google (serão cacheadas na primeira visita)
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=Syne:wght@400;600;700;800&display=swap"
];

// ── Install: cacheia os arquivos estáticos ──────────────
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// ── Activate: remove caches antigos ────────────────────
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys
          .filter(key => key !== CACHE_NAME)
          .map(key => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

// ── Fetch: cache-first para estáticos, network-first para Firestore ──
self.addEventListener("fetch", event => {
  const url = new URL(event.request.url);

  // Firestore e Firebase sempre pela rede (dados dinâmicos)
  if (
    url.hostname.includes("firestore.googleapis.com") ||
    url.hostname.includes("firebase") ||
    url.hostname.includes("gstatic.com")
  ) {
    event.respondWith(
      fetch(event.request).catch(() => {
        // Se offline e for Firestore, retorna resposta vazia controlada
        return new Response(JSON.stringify({ offline: true }), {
          headers: { "Content-Type": "application/json" }
        });
      })
    );
    return;
  }

  // Tudo mais: cache-first (app shell, CSS, JS, fontes)
  event.respondWith(
    caches.match(event.request).then(cached => {
      if (cached) return cached;

      return fetch(event.request).then(response => {
        // Cacheia respostas válidas de fontes e outros assets
        if (
          response.ok &&
          (url.hostname.includes("fonts.googleapis.com") ||
           url.hostname.includes("fonts.gstatic.com"))
        ) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      }).catch(() => {
        // Fallback para o index.html se offline e asset não cacheado
        return caches.match("/index.html");
      });
    })
  );
});
