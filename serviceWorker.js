const urlsToCache = ["music.html", "load/loader.js", "manifest.json", "serviceWorker.js"];
self.addEventListener("install", async (event) => {
   console.log("Service worker installed");
   //event.waitUntil(async () => {
      console.log("Service worker start cache");
      const cache = await caches.open("music-assets");
      console.log("Service worker add to cache");
      cache.addAll(urlsToCache);
   //});
});
self.addEventListener("fetch", async (event) => {
    console.log("Service worker fetch event");
    for (let url of urlsToCache) {
        if (event.request.url.indexOf(url)>=0) {
            console.log("Service worker fetch from cache", event.request.url);
            event.respondWith(caches.match(event.request));
            return;
        }
    }
    event.respondWith(
        fetch(event.request).catch(error => {
            console.log("Service worker fetch from server error: ", error);
        })
    )
});