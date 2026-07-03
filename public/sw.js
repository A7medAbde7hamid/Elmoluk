const CACHE = "elmoluk-v1";
const ASSETS = ["/", "/index.html"];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(ASSETS))
  );
});

self.addEventListener("fetch", (e) => {
  const { request } = e;
  if (request.method !== "GET") return;
  if (request.url.includes("/api/")) return;

  e.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
