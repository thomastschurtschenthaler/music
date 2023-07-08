var _clientID = "b_"+(new Date()).getTime()+""+Math.random();
let _fetch=fetch;

window._isPWA = window.location.href.startsWith("https:");
window._isPWA = true;

if (!window._isPWA) {
    window.fetch = async (url, params, isgit)=> {
        let resp = await _fetch("/api/fetch?"+encodeURIComponent(JSON.stringify({clientID:_clientID, url:url, params:params, isgit:isgit})));
        return resp;
    }
}

(async function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('serviceWorker.js')
        .then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    }

    let GIT_URL="https://api.github.com/repos/thomastschurtschenthaler/wmovies/contents/";
    let local = (!window._isPWA) && true;
    let useCache = window._isPWA || false;
    async function loadAndCacheResource(respath) {
        let cacheid = "res_"+respath;
        let fromCache = window.localStorage.getItem(cacheid);
        if (fromCache!=null && useCache) {
            console.log("from cache", cacheid);
            let respbuffer = Uint8Array.from(atob(fromCache), c => c.charCodeAt(0));
            return respbuffer;
        }
        let url =  GIT_URL+respath;
        let resp = null;
        if (window._isPWA) {
            let gheaders={
                'Authorization': 'token ' + window._GIT_TOKEN
            };
            let headers = new Headers();
            for (let h in gheaders) {
                headers.set(h, gheaders[h]);
            }
            resp = await fetch(url,{method: 'GET', headers:headers});
        } else {
            resp = await fetch(url,{method: 'GET'}, local?"local":true);
        }
        let respbuffer = await resp.arrayBuffer();
        let toCache=null;
        if (local) {
            toCache = btoa(new Uint8Array(respbuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
        } else {
            let enc = new TextDecoder("utf-8");
            let content = JSON.parse(enc.decode(respbuffer)).content;
            toCache = content;
            respbuffer = Uint8Array.from(atob(content), c => c.charCodeAt(0));
        }
        window.localStorage.setItem(cacheid, toCache);
        return respbuffer;
    }

    async function loadScript(src) {
        let res = await loadAndCacheResource("/music/"+src);
        let enc = new TextDecoder("utf-8");
        let scriptjs = enc.decode(res);
        let screl = document.createElement("script");
        screl.appendChild(document.createTextNode(scriptjs));
        document.getElementById("injected").appendChild(screl);
    }

    window._loadApp = async function () {
        window.loadedStyles = {
            "bootstrap": await loadAndCacheResource("/lib/bootstrap.min.css"),
            "common": await loadAndCacheResource("/music/comp/common.css"),
            "materialcss": await loadAndCacheResource("/music/comp/font/material.css2"),
            "materialfont": await loadAndCacheResource("/music/comp/font/material.woff2")
        }
        loadScript("comp/common.js");
        loadScript("comp/player.js");
        loadScript("comp/search.js");
        loadScript("comp/playlist.js");
        loadScript("comp/playlists.js");
        loadScript("comp/main.js");
        loadScript("app.js");
        window.localStorage.setItem("cached", "true");
    };

    if (window._isPWA && window._GIT_TOKEN==null && window.localStorage.getItem("cached")==null) {
        document.getElementById("main").innerHTML="GIT Token: <input id='gittoken' type='text' size=100></input>"
        document.getElementById("gittoken").addEventListener("change", async (e)=>{
            window._GIT_TOKEN=e.target.value;
            document.getElementById("main").innerHTML="";
            window._loadApp();
        });
        return;
    }

    window._loadApp();
})();

async function musicPlayerLoadPlaylist() {
    try {
        let rplaylist = await _fetch("/api/musicPlayerLoadPlaylist");
        let splaylist = await rplaylist.text();
        if (splaylist==null || splaylist.length==0) return null;
        let playlist = JSON.parse(splaylist);
        return playlist;
    } catch (e) {
        console.log("httpapi musicPlayerLoadPlaylist ERROR ", e);
        return null;
    }
}
async function musicPlayerSavePlaylist(playlist) {
    _fetch("/api/musicPlayerSavePlaylist", {method:"POST", body:JSON.stringify(playlist)});
}

