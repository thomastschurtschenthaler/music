var _clientID = "b_"+(new Date()).getTime()+""+Math.random();
let _fetch=fetch;

window._noCaching = false; window._noServiceWorker = false;
window._isPWA = window.location.href.startsWith("https:");

//https://raw.githack.com/thomastschurtschenthaler/music/t6/music.html
//window._isPWA = true; window._noCaching = true; window._noServiceWorker = true;

if (!window._isPWA || window._noCaching) {
    window.fetch = async (url, params, isgit)=> {
        let resp = await _fetch("/api/fetch?"+encodeURIComponent(JSON.stringify({clientID:_clientID, url:url, params:params, isgit:isgit})));
        return resp;
    }
}

(async function () {
    if (!_noServiceWorker && window._isPWA && 'serviceWorker' in navigator) {
        navigator.serviceWorker.register('serviceWorker.js')
        .then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    }

    let GIT_URL="https://api.github.com/repos/thomastschurtschenthaler/wmovies/contents/";
    let local =  !window._isPWA || _noCaching;
    
    async function loadAndCacheResource(respath, noCache) {
        try {
            let useCache = window._isPWA && (!noCache) && (!_noCaching);

            let cacheid = "res_"+respath;
            let fromCache = window.localStorage.getItem(cacheid);
            if (fromCache!=null && useCache) {
                console.log("from cache", cacheid);
                let respbuffer = Uint8Array.from(atob(fromCache), c => c.charCodeAt(0));
                return respbuffer;
            }
            let url =  GIT_URL+respath+(local?"":"?token="+((new Date()).getTime()+""));
            let resp = null;
            if (window._isPWA && !window._noCaching) {
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
        } catch (e) {
            console.log("loadAndCacheResource error", e+"; "+respath);
            if (window._isPWA && (!window._noCaching)) {
                window.localStorage.setItem("showgittokeninput", "true");
                window.location.reload();
            }
        }
    }

    async function loadScript(src, reload) {
        let res = await loadAndCacheResource("/music/"+src, reload);
        if (!reload) {
            let enc = new TextDecoder("utf-8");
            let scriptjs = enc.decode(res)+"\n//# sourceURL="+src;
            let screl = document.createElement("script");
            screl.appendChild(document.createTextNode(scriptjs));
            document.getElementById("injected").appendChild(screl);
        }
    }

    window._loadApp = async function(reload) {
        await loadScript("assets.js", reload);
        window.loadedStyles = {};
        for (let asset in window.assets.css) {
            window.loadedStyles[asset] = await loadAndCacheResource(window.assets.css[asset], reload);
        }
        for (let asset in window.assets.js) {
            await loadScript(window.assets.js[asset], reload);
        }

        window.localStorage.setItem("cached", "true");
        if (!reload) {
            window.app.init();
        }
    };
    window.reloadApp = async function() {
        await window._loadApp(true);
        window.location.reload();
    }

    window._GIT_TOKEN = window.localStorage.getItem("GIT_TOKEN");
    if (window._isPWA && (!window._noCaching) && ((window._GIT_TOKEN==null && window.localStorage.getItem("cached")==null) || window.localStorage.getItem("showgittokeninput")!=null)) {
        window.localStorage.removeItem("showgittokeninput");
        document.getElementById("main").innerHTML="GIT Token: <input id='gittoken' type='text' size=100></input>"
        document.getElementById("gittoken").addEventListener("change", async (e)=>{
            window._GIT_TOKEN=e.target.value;
            window.localStorage.setItem("GIT_TOKEN", e.target.value);
            document.getElementById("main").innerHTML="bussy..";
            window._loadApp();
        });
        return;
    }

    try {
        await window._loadApp();
    } catch (e) {
        document.getElementById("main").innerHTML=`
            <div>Error: ${e}</div>
            <div><button id="reloadbtn">Reload</button></div>
            `;
        document.getElementById("reloadbtn").addEventListener("click", (ev)=>{
            window.reloadApp();
        });
    }
})();

async function musicPlayerLoadPlaylist() {
    try {
        let splaylist = null;
        if (window._isPWA) {
            splaylist = localStorage.getItem("playlists");
        } else {
            let rplaylist = await _fetch("/api/musicPlayerLoadPlaylist");
            splaylist = await rplaylist.text();
        }
        if (splaylist==null || splaylist.length==0) return null;
        let playlist = JSON.parse(splaylist);
        return playlist;
    } catch (e) {
        console.log("httpapi musicPlayerLoadPlaylist ERROR ", e);
        return null;
    }
}
async function musicPlayerSavePlaylist(playlist) {
    if (window._isPWA) {
        localStorage.setItem("playlists", JSON.stringify(playlist));
    } else {
        _fetch("/api/musicPlayerSavePlaylist", {method:"POST", body:JSON.stringify(playlist)});
    }
}

