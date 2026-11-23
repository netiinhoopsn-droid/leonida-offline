// Generated per release; never cache external analytics, APIs, or private data.
const CACHE="atlas-6a48eef5-9194f19ee83d", PREFIX="atlas-6a48eef5-", BASE="/leonida-offline/";
const CORE=["/leonida-offline/","/leonida-offline/index.html","/leonida-offline/favicon.svg","/leonida-offline/manifest.webmanifest","/leonida-offline/apple-touch-icon.png","/leonida-offline/assets/BackupDialog-DOR4qFGT.js","/leonida-offline/assets/gtadb-CZYq3MnW.js","/leonida-offline/assets/index-Bwtb0d9F.css","/leonida-offline/assets/index-CWzaIW2t.js","/leonida-offline/assets/inter-cyrillic-400-normal-obahsSVq.woff2","/leonida-offline/assets/inter-cyrillic-600-normal-CWCymEST.woff2","/leonida-offline/assets/inter-cyrillic-ext-400-normal-BQZuk6qB.woff2","/leonida-offline/assets/inter-cyrillic-ext-600-normal-Dfes3d0z.woff2","/leonida-offline/assets/inter-greek-400-normal-B4URO6DV.woff2","/leonida-offline/assets/inter-greek-600-normal-plRanbMR.woff2","/leonida-offline/assets/inter-greek-ext-400-normal-DGGRlc-M.woff2","/leonida-offline/assets/inter-greek-ext-600-normal-DRtmH8MT.woff2","/leonida-offline/assets/inter-latin-400-normal-C38fXH4l.woff2","/leonida-offline/assets/inter-latin-600-normal-LgqL8muc.woff2","/leonida-offline/assets/inter-latin-ext-400-normal-C1nco2VV.woff2","/leonida-offline/assets/inter-latin-ext-600-normal-D2bJ5OIk.woff2","/leonida-offline/assets/inter-vietnamese-400-normal-DMkecbls.woff2","/leonida-offline/assets/inter-vietnamese-600-normal-Cc8MFFhd.woff2","/leonida-offline/assets/jsx-runtime-DyZJNswf.js","/leonida-offline/assets/leonida-coordinates-CXGuqbYF.js","/leonida-offline/assets/leonida-evidence-BTSqoURv.js","/leonida-offline/assets/leonida-research-CEfrIt76.js","/leonida-offline/assets/MarkerEditor-o7CPa4TH.js","/leonida-offline/assets/Modal-CxNLfOxW.js","/leonida-offline/assets/oswald-cyrillic-500-normal-Dz4ZC46J.woff2","/leonida-offline/assets/oswald-cyrillic-ext-500-normal-DngHVvy4.woff2","/leonida-offline/assets/oswald-latin-500-normal-B-eyT0Dw.woff2","/leonida-offline/assets/oswald-latin-ext-500-normal-QdEKgtiz.woff2","/leonida-offline/assets/oswald-vietnamese-500-normal-hXcn5ojQ.woff2","/leonida-offline/assets/PlaceDetails-BlC2PqEM.js","/leonida-offline/assets/ProjectPage-JKmotwX6.js","/leonida-offline/assets/public-path-C-ELsMoT.js","/leonida-offline/assets/RegionalResearch-BhRApGhg.css","/leonida-offline/assets/RegionalResearch-BMk5519g.js","/leonida-offline/assets/SettingsDialog-C3n7-ddm.js","/leonida-offline/assets/gta6-leonida-atlas/basemap.svg","/leonida-offline/assets/street-leonida/maps/gtadb-landmarks-5c1d69f.json"], TILES='leonida-tiles-v1';
const APP_FILES=CORE.concat(["/leonida-offline/assets/ExplorerView-Bb45WZsc.js","/leonida-offline/assets/ExplorerView-CPZbGovK.css","/leonida-offline/assets/walk-geography-2zItdoZW.js","/leonida-offline/assets/walk-overlays-DgXykj0B.js","/leonida-offline/assets/walk-world-C8LOGA3B.js"]);
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(CORE)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith(PREFIX)&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==self.location.origin||!url.pathname.startsWith(BASE))return;
  if(url.pathname===BASE+'analytics.html'||url.pathname===BASE+'analytics-bootstrap.js')return;
  if(url.pathname.startsWith(BASE+'tiles/')){
    // Tiles: primeiro o cache do aparelho (download offline), depois a rede. O manifesto vai pela rede.
    event.respondWith(caches.open(TILES).then(async cache=>{
      const key=url.pathname;
      if(key.endsWith('/manifest.json')){
        try{const response=await fetch(request);if(response.ok)await cache.put(key,response.clone());return response;}
        catch{const hit=await cache.match(key);if(hit)return hit;throw new Error('offline');}
      }
      const hit=await cache.match(key);if(hit)return hit;
      const response=await fetch(request);
      if(response.ok){try{await cache.put(key,response.clone());}catch{}}
      return response;
    }));
    return;
  }
  const navigation=request.mode==='navigate';
  const publicOptional=url.pathname.startsWith(BASE+'assets/street-leonida/')&&/\.(?:webp|jpg|png|svg|json)$/.test(url.pathname);
  const asset=APP_FILES.includes(url.pathname)||publicOptional;
  if(request.headers.has('authorization')||(!navigation&&url.search))return;
  if(!navigation&&!asset)return;
  if(navigation){event.respondWith(fetch(request).catch(()=>caches.match(BASE+'index.html')));return;}
  event.respondWith(caches.open(CACHE).then(async cache=>{
    const cached=await cache.match(request);if(cached)return cached;
    const response=await fetch(request);
    if(response.ok&&response.type==='basic'&&!/private|no-store/i.test(response.headers.get('cache-control')||'')){
      // Bound optional 3D asset caching; the app shell and public data remain pinned.
      try {
        if(publicOptional&&!APP_FILES.includes(url.pathname)){
          const keys=await cache.keys();const extras=keys.filter(key=>!APP_FILES.includes(new URL(key.url).pathname));
          if(extras.length>=200)await cache.delete(extras[0]);
        }
        await cache.put(request,response.clone());
      } catch { /* Cache quota must not discard a successful network response. */ }
    }
    return response;
  }).catch(()=>fetch(request)));
});
