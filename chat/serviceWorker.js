const urlsToCache = ["chat.html", "serviceWorker.js", "manifest.json", "loader.js", "icon.png", "callsound.ogg"];
self.addEventListener("install", async (event) => {
    const heartBeat = async function() {
        const allClients = await clients.matchAll({
            includeUncontrolled: true
        });
        if (allClients.length>0) {
            allClients[0].postMessage({
                beat: true
            });
        }
        console.log("Service worker clients", allClients);
        setTimeout(heartBeat, 2000);
    }
    setTimeout(heartBeat, 2000);
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
    if (event.request.url.endsWith("chat.html")) {
        clients.get(event.clientId).then(client=>{
            client.postMessage({
                fetchbeat: true
            });
        });
    }
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