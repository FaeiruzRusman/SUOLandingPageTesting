(() => {
  const SUPABASE_URL="https://wafxbgltfohxbupjzfsr.supabase.co";
  const SUPABASE_KEY="sb_publishable_o_7nBoBlcZZo6eDNdOVOYg_UCb1PfQC";
  const STORAGE_KEY="suo-visitor-id";

  const isLikelyBot=()=>{
    const ua=navigator.userAgent||"";
    return navigator.webdriver || /bot|crawler|spider|headless|preview|facebookexternalhit|whatsapp/i.test(ua);
  };

  const getVisitorId=()=>{
    try{
      let id=localStorage.getItem(STORAGE_KEY);
      if(!id){
        id=crypto.randomUUID ? crypto.randomUUID() :
          "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g,c=>{
            const r=Math.random()*16|0,v=c==="x"?r:(r&0x3|0x8); return v.toString(16);
          });
        localStorage.setItem(STORAGE_KEY,id);
      }
      return id;
    }catch{
      return crypto.randomUUID ? crypto.randomUUID() : "00000000-0000-4000-8000-000000000001";
    }
  };

  const fmt=n=>new Intl.NumberFormat(document.documentElement.lang==="en"?"en-MY":"ms-MY").format(Number(n||0));

  const updateCounter=(data)=>{
    const today=document.getElementById("suoTrafficToday");
    const total=document.getElementById("suoTrafficTotal");
    const unique=document.getElementById("suoTrafficUnique");
    if(today) today.textContent=fmt(data.today_views);
    if(total) total.textContent=fmt(data.portal_views);
    if(unique) unique.textContent=fmt(data.unique_visitors);
    document.querySelectorAll("[data-traffic-status]").forEach(el=>{
      el.dataset.trafficStatus="ready";
    });
  };

  const record=async()=>{
    if(location.protocol==="file:" || isLikelyBot()) return;
    const path=location.pathname.replace(/\/+$/,"/") || "/";
    const visitorId=getVisitorId();
    try{
      const res=await fetch(SUPABASE_URL+"/rest/v1/rpc/suo_record_portal_view",{
        method:"POST",
        headers:{
          "apikey":SUPABASE_KEY,
          "Content-Type":"application/json"
        },
        body:JSON.stringify({p_path:path,p_visitor_id:visitorId}),
        keepalive:true
      });
      if(!res.ok) throw new Error("Traffic RPC "+res.status);
      const rows=await res.json();
      if(Array.isArray(rows)&&rows[0]) updateCounter(rows[0]);
    }catch(err){
      console.warn("SUO traffic counter unavailable",err);
    }
  };

  if(document.readyState==="loading") document.addEventListener("DOMContentLoaded",record,{once:true});
  else record();
})();