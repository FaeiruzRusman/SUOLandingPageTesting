(() => {
  "use strict";

  const API = "https://abacus.jasoncameron.dev";
  const NS = "selangor-urban-observatory-portal-2026";
  const TOTAL_KEY = "total-pageviews";
  const UNIQUE_KEY = "unique-browsers";
  const UNIQUE_FLAG = "suo_unique_visitor_v1";

  const hit = async (key) => {
    const r = await fetch(`${API}/hit/${NS}/${key}`, {cache:"no-store"});
    if(!r.ok) throw new Error("Traffic counter "+r.status);
    return r.json();
  };

  const get = async (key) => {
    const r = await fetch(`${API}/get/${NS}/${key}`, {cache:"no-store"});
    if(!r.ok) throw new Error("Traffic counter "+r.status);
    return r.json();
  };

  const valueOf = data => Number(data?.value ?? data?.count ?? 0) || 0;
  const format = n => new Intl.NumberFormat(document.documentElement.lang==="en"?"en-MY":"ms-MY").format(n);

  const paint = (total, unique) => {
    document.querySelectorAll("[data-suo-total-visits]").forEach(el => {
      el.textContent = format(total);
    });
    document.querySelectorAll("[data-suo-unique-visitors]").forEach(el => {
      el.textContent = format(unique);
    });
    document.querySelectorAll("[data-suo-traffic-status]").forEach(el => {
      el.hidden = true;
    });
  };

  const run = async () => {
    try{
      const totalData = await hit(TOTAL_KEY);

      let uniqueData;
      let alreadyCounted = false;
      try { alreadyCounted = localStorage.getItem(UNIQUE_FLAG) === "1"; } catch(_) {}

      if(!alreadyCounted){
        uniqueData = await hit(UNIQUE_KEY);
        try { localStorage.setItem(UNIQUE_FLAG,"1"); } catch(_) {}
      }else{
        uniqueData = await get(UNIQUE_KEY);
      }

      paint(valueOf(totalData), valueOf(uniqueData));
    }catch(err){
      console.warn("SUO traffic counter unavailable", err);
      document.querySelectorAll("[data-suo-traffic]").forEach(el => {
        el.hidden = true;
      });
    }
  };

  if(document.readyState==="loading"){
    document.addEventListener("DOMContentLoaded", run, {once:true});
  }else{
    run();
  }
})();