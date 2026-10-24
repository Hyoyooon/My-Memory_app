const CACHE_NAME = "my-memory-pwa-v8";
const ASSETS = [
  "./",
  "./index.html",
  "./styles.css",
  "./app.js",
  "./cloud-sync.js",
  "./manifest.json",
  "./icon.svg",
  "./icon_set/icon_logo.png",
  "./icon_set/icon_logo_192.png",
  "./icon_set/icon_logo_large.png",
  "./icon_set/icon_logo_small.png",
  "./icon_set/icon_home_default.png",
  "./icon_set/icon_home_active.png",
  "./icon_set/icon_calendar_default.png",
  "./icon_set/icon_calendar_active.png",
  "./icon_set/icon_routine_default.png",
  "./icon_set/icon_routine_active.png",
  "./icon_set/icon_todo_default.png",
  "./icon_set/icon_todo_active.png",
  "./icon_set/icon_information_default.png",
  "./icon_set/icon_information_active.png",
  "./icon_set/icon_think_default.png",
  "./icon_set/icon_think_active.png",
  "./icon_set/icon_happiness_default_2.png",
  "./icon_set/icon_happiness_active_2.png",
  "./icon_set/icon_transcription_default.png",
  "./icon_set/icon_transcription_active.png",
  "./icon_set/icon_diary_default.png",
  "./icon_set/icon_diary_active.png"
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) return caches.delete(key);
        })
      )
    )
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  if (event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request)
      .then((networkRes) => {
        const resClone = networkRes.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, resClone);
        });
        return networkRes;
      })
      .catch(() =>
        caches.match(event.request).then((cached) => {
          if (cached) return cached;
          if (event.request.mode === "navigate") {
            return caches.match("./index.html");
          }
        })
      )
  );
});
