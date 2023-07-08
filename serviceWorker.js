console.log("serviceWorker 0");
const urlsToCache = [
    "music.html", "load/loader.js"];
console.log("serviceWorker 1");
self.addEventListener("install", async (event) => {
   console.log("Service worker installed");
   //event.waitUntil(async () => {
      console.log("Service worker start cache");
      const cache = await caches.open("music-assets");
      console.log("Service worker add to cache");
      cache.addAll(urlsToCache);
   //});
});
console.log("serviceWorker 2");
self.addEventListener("fetch", event => {
    console.log("Service worker fetch event");
    if (event.request.url.indexOf("/music.html")>=0 || event.request.url.indexOf("/load/loader.js")>=0) {
        event.respondWith(caches.match(event.request));
    } else {
        //console.log("Service worker fetch from server");
        event.respondWith(
            fetch(event.request).catch(error => {
                console.log("Service worker fetch from server error: ", error);
            })
        )
    }
});
console.log("serviceWorker 3");

