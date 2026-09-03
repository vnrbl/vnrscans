// vnrscans Progressive Web App Service Worker
const CACHE_NAME = "vnrscans-pwa-v1";
const STATIC_ASSETS = [
  "/",
  "/home",
  "/site.webmanifest",
  "/favicon.ico",
  "/favicon.svg"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch(() => {});
    })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME && !key.startsWith("vnrscans-offline-chapters")) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  // Only handle GET requests
  if (event.request.method !== "GET") return;

  const url = new URL(event.request.url);

  // Skip supabase api, chrome extension, and analytics
  if (
    url.hostname.includes("supabase.co") ||
    url.pathname.startsWith("/api/") ||
    url.protocol.startsWith("chrome-extension")
  ) {
    return;
  }

  // Network-first with cache fallback for HTML pages
  if (event.request.mode === "navigate") {
    event.respondWith(
      fetch(event.request).catch(() => {
        return caches.match(event.request).then((cached) => {
          return cached || caches.match("/home") || caches.match("/");
        });
      })
    );
    return;
  }

  // Cache-first for offline chapter images
  if (event.request.destination === "image") {
    event.respondWith(
      caches.match(event.request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(event.request).catch(() => {
          return new Response("", { status: 408, statusText: "Offline Image Unavailable" });
        });
      })
    );
    return;
  }
});
