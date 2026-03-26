const urlsToCache = ["chat.html", "serviceWorker.js", "manifest.json", "loader.js", "icon.png", "callsound.ogg"];
self.addEventListener("install", async (event) => {
   console.log("Service worker install");
   event.waitUntil(
    caches
      .open("chat-assets")
      .then(cache => {
        console.log('Service Worker: Caching Files', cache);
        cache.addAll(urlsToCache).then(() => {
            console.log("skipWaiting"); 
            self.skipWaiting()
        });
      })
  );
});
self.addEventListener("fetch", async (event) => {
    if (urlsToCache.filter(url=>event.request.url.endsWith(url)).length>0) {
        event.respondWith(caches.match(event.request));
    } else {
        event.respondWith(
            fetch(event.request).catch(error => {
                console.log("Service worker fetch from server error: ", error);
            })
        );
    }
});