/**
 * Service Worker Apotek Sehatku (PWA prototype)
 * - App shell + halaman: network-first, fallback cache, lalu /offline
 * - Aset statis & gambar: cache-first
 * - Katalog JSON ter-bundle dalam app shell → tetap bisa dibuka offline
 *   setelah kunjungan pertama.
 *
 * Catatan: data transaksional (keranjang/pesanan/chat) hidup di LocalStorage,
 * sehingga tetap tersedia offline. Sinkronisasi ke server dibahas di
 * MIGRATION_TO_SUPABASE.md.
 */
const VERSION = "apotek-v1";
const SHELL_CACHE = `${VERSION}-shell`;
const ASSET_CACHE = `${VERSION}-assets`;

const PRECACHE_URLS = [
  "/",
  "/offline",
  "/manifest.webmanifest",
  "/icons/icon.svg",
  "/icons/icon-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) => cache.addAll(PRECACHE_URLS))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))
        )
      )
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  // Navigasi halaman: network-first
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          const copy = response.clone();
          caches.open(SHELL_CACHE).then((cache) => cache.put(request, copy));
          return response;
        })
        .catch(() =>
          caches
            .match(request)
            .then((cached) => cached ?? caches.match("/offline"))
        )
    );
    return;
  }

  // Aset statis: cache-first
  const isStatic =
    url.pathname.startsWith("/_next/static") ||
    url.pathname.startsWith("/images/") ||
    url.pathname.startsWith("/icons/");
  if (isStatic) {
    event.respondWith(
      caches.match(request).then(
        (cached) =>
          cached ??
          fetch(request).then((response) => {
            const copy = response.clone();
            caches.open(ASSET_CACHE).then((cache) => cache.put(request, copy));
            return response;
          })
      )
    );
  }
});
