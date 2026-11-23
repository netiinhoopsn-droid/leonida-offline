(function(){
  var id="",expectedOrigin="",parentOrigin="",base="/leonida-offline/";
  // Only the dedicated, different origin may run the tag, and only inside a frame.
  if(!id||!expectedOrigin||!parentOrigin||expectedOrigin===parentOrigin||window.parent===window||window.origin!==expectedOrigin||location.origin!==expectedOrigin)return;
  // An empty hidden page must not manufacture Enhanced Measurement scroll events.
  document.body.style.minHeight='10000px';
  var configured=false,revoked=false;
  function send(type){window.parent.postMessage({type:type},parentOrigin);}
  function revoke(){
    revoked=true;window['ga-disable-'+id]=true;
    ['atlas_ga','atlas_ga_'+id.slice(2)].forEach(function(name){document.cookie=name+'=; Max-Age=0; Path='+base+'; SameSite=Lax; Secure';});
    send('atlas:analytics:revoked');
  }
  window.addEventListener('message',function(event){
    if(event.source!==window.parent||event.origin!==parentOrigin||!event.data||typeof event.data!=='object'||Array.isArray(event.data))return;
    var data=event.data;
    if(data.type==='atlas:analytics:revoke'&&Object.keys(data).length===1){revoke();return;}
    if(configured||revoked||data.type!=='atlas:analytics:configure'||data.consent!=='granted'||Object.keys(data).length!==2)return;
    configured=true;
    window.dataLayer=[];function gtag(){window.dataLayer.push(arguments);}
    gtag('consent','default',{analytics_storage:'granted',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
    gtag('js',new Date());
    var safeLocation=parentOrigin+base;
    gtag('config',id,{send_page_view:false,cookie_domain:'none',cookie_path:base,cookie_prefix:'atlas',cookie_flags:'SameSite=Lax;Secure',page_location:safeLocation,page_referrer:'',allow_google_signals:false,allow_ad_personalization_signals:false});
    gtag('event','page_view',{page_title:'Leonida Atlas',page_location:safeLocation,page_referrer:''});
    var script=document.createElement('script');script.async=true;script.src='https://www.googletagmanager.com/gtag/js?id='+id;document.head.appendChild(script);
  });
  send('atlas:analytics:ready');
})();