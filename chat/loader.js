//https://raw.githack.com/thomastschurtschenthaler/music/chat/chat.html

window.GIT_URL="https://api.github.com/repos/thomastschurtschenthaler/mychat/contents/";
//window._isLocal = true; window._noCaching=true;

(async function () {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('serviceWorker.js')
        .then(function(registration) {
            console.log('ServiceWorker registration successful with scope: ', registration.scope);
        }).catch(function(err) {
            console.log('ServiceWorker registration failed: ', err);
        });
    }    
    async function loadAndCacheResource(respath, noCache) {
        try {
            let useCache = !noCache && !window._noCaching;
            let cacheid = "res_"+respath;
            let fromCache = window.localStorage.getItem(cacheid);
            if (useCache && fromCache!=null) {
                console.log("from cache", cacheid);
                let respbuffer = Uint8Array.from(atob(fromCache), c => c.charCodeAt(0));
                return respbuffer;
            }
            
            let resp = null;
            if (!window._isLocal) {
                let url =  GIT_URL+respath+"?token="+(new Date()).getTime();
                let gheaders={
                    'Authorization': 'token ' + window._GIT_TOKEN
                };
                let headers = new Headers();
                for (let h in gheaders) {
                    headers.set(h, gheaders[h]);
                }
                resp = await fetch(url,{method: 'GET', headers:headers});
            } else {
                resp = await fetch("http://127.0.0.1:5501"+respath, {method: 'GET'});
            }
            let respbuffer = await resp.arrayBuffer();
            let toCache=null;
            if (window._isLocal) {
                toCache = btoa(new Uint8Array(respbuffer).reduce((data, byte) => data + String.fromCharCode(byte), ''));
            } else {
                let enc = new TextDecoder("utf-8");
                let content = JSON.parse(enc.decode(respbuffer)).content;
                toCache = content;
                respbuffer = Uint8Array.from(atob(content), c => c.charCodeAt(0));
            }
            if (!window._noCaching) {
                window.localStorage.setItem(cacheid, toCache);
            }
            return respbuffer;
        } catch (e) {
            console.log("loadAndCacheResource error", e+"; "+respath);
            if (!window._isLocal && (!window._noCaching)) {
                window.localStorage.setItem("showgittokeninput", "true");
                window.location.reload();
            }
        }
    }

    async function loadScript(src, reload) {
        let res = await loadAndCacheResource("/chat/"+src, reload);
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
            window.loadedStyles[asset] = await loadAndCacheResource("/chat/"+window.assets.css[asset], reload);
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
    if (!window._isLocal && (!window._noCaching) && ((window._GIT_TOKEN==null && window.localStorage.getItem("cached")==null) || window.localStorage.getItem("showgittokeninput")!=null)) {
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
        console.error("loader error", e);
        document.getElementById("main").innerHTML=`
            <div>Error: ${e}</div>
            <div><button id="reloadbtn">Reload</button></div>
            `;
        document.getElementById("reloadbtn").addEventListener("click", (ev)=>{
            window.reloadApp();
        });
    }
})();
