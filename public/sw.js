/* Social9 service worker: makes the app work offline after the first visit.
 *  - pages: network first, fall back to the cached copy
 *  - build assets, images, fonts, models: cache first (they are content-hashed or versioned)
 *  - AI runtime from jsDelivr: cache first (pinned version)
 * AI model files are cached by the app itself in "social9-models-v2" (each file checked against its SHA-256).
 */
const VERSION = "v4";
const PAGES = `social9-pages-${VERSION}`;
const ASSETS = `social9-assets-${VERSION}`;
const PRECACHE = ["/", "/editor", "/manifest.webmanifest", "/icon.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(PAGES)
      .then((c) => c.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("social9-") && !k.endsWith(VERSION) && k !== "social9-models-v2").map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

const isAsset = (url) =>
  url.origin === self.location.origin
    ? /^\/(_next\/static|demo|samples|backdrops|models|reel)\//.test(url.pathname) || /\.(woff2|png|svg|webp|jpg|onnx)$/.test(url.pathname)
    : url.hostname === "cdn.jsdelivr.net";

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(request, copy));
          return res;
        })
        .catch(async () => (await caches.match(request, { ignoreSearch: true })) ?? (await caches.match("/editor")) ?? Response.error()),
    );
    return;
  }

  if (isAsset(url)) {
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((res) => {
            if (res.ok || res.type === "opaque") {
              const copy = res.clone();
              caches.open(ASSETS).then((c) => c.put(request, copy));
            }
            return res;
          }),
      ),
    );
    return;
  }

  // Next.js route data (RSC payloads): network first, cache fallback so client navigation works offline.
  if (url.origin === self.location.origin && (url.searchParams.has("_rsc") || request.headers.get("RSC") === "1")) {
    event.respondWith(
      fetch(request)
        .then((res) => {
          const copy = res.clone();
          caches.open(PAGES).then((c) => c.put(request, copy));
          return res;
        })
        .catch(() => caches.match(request)),
    );
  }
});
