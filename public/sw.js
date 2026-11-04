// The house as an app on a phone (ADR 0033). Its job is small: being here is
// what lets Chrome, Edge and Android offer "Install", and while the phone's
// offline it shows a kind page instead of the browser's error. It keeps the
// house's pictures and fonts on the phone, since their addresses never
// change. It never keeps a page: everything friends leave is in the house's
// database, and a page from yesterday would show yesterday's house.
//
// Served at each house's own address (/sw.js, /h/<code>/sw.js) with BASE
// and VERSION written in by src/server.ts, so each house is its own app.
const BASE = "__BASE__";
const VERSION = "__VERSION__";
const ART = `art-${VERSION}`;
const OFFLINE = `${BASE}/offline`;

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(ART).then((cache) => cache.add(OFFLINE)).catch(() => {}).then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith("art-") && k !== ART).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);
  // The live line and anything that isn't a page or a picture go straight through.
  if (url.pathname.endsWith("/live")) return;
  const picture = url.origin === location.origin && url.pathname.startsWith("/art/") && url.searchParams.has("v");
  const font = url.hostname === "fonts.gstatic.com" || url.hostname === "fonts.googleapis.com";
  if (picture || font) {
    event.respondWith(
      caches.open(ART).then((cache) =>
        cache.match(req).then((hit) => hit || fetch(req).then((res) => {
          if (res.ok || res.type === "opaque") cache.put(req, res.clone());
          return res;
        })),
      ),
    );
    return;
  }
  // A page: always from the house. Offline, the kind page.
  if (req.mode === "navigate") {
    event.respondWith(fetch(req).catch(() => caches.match(OFFLINE).then((page) => page || Response.error())));
  }
});
