// ============================================================
//  sw.js — desativado
// ============================================================
//
// Mantido apenas para remover instalações antigas do service worker.
// Não faz cache offline e se desregistra assim que ativado.

self.addEventListener("install", event => {
  self.skipWaiting();
});

self.addEventListener("activate", event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.map(key => caches.delete(key)));
    await self.registration.unregister();
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", event => {
  event.respondWith(fetch(event.request));
});
