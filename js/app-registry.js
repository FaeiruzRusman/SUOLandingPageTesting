(() => {
  const PATH="data/applications.json";
  let cache=null;
  let pending=null;

  const esc=value=>String(value??"").replace(/[&<>"']/g,ch=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  const lang=()=>document.documentElement.lang==="en"?"en":"ms";
  const title=(app,code=lang())=>app["title_"+code]||app.title_ms||app.id;
  const tag=(app,code=lang())=>app["tag_"+code]||app.tag_ms||"";
  const desc=(app,code=lang())=>app["description_"+code]||app.description_ms||"";
  const sortApps=apps=>[...apps].sort((a,b)=>title(a,"ms").localeCompare(title(b,"ms"),"ms",{sensitivity:"base"}));

  const load=()=>{
    if(cache) return Promise.resolve(cache);
    if(pending) return pending;
    pending=fetch(PATH,{cache:"no-cache"})
      .then(r=>{if(!r.ok)throw new Error("Applications registry "+r.status);return r.json();})
      .then(data=>{cache=data;return data;})
      .finally(()=>{pending=null;});
    return pending;
  };

  const all=async()=>((await load()).applications||[]);
  const active=async()=>sortApps((await all()).filter(x=>x.status==="active"));
  const group=async id=>sortApps((await all()).filter(x=>x.group===id && x.status==="active"));
  const getById=async id=>(await all()).find(x=>x.id===id)||null;

  const landingCard=app=>`
    <a class="v7-app v7-app-equal ${esc(app.card_class||app.id)} v7-reveal registry-app-card" href="${esc(app.url)}" target="_blank" rel="noopener" data-app-id="${esc(app.id)}">
      ${app.preview?'<div class="v7-live-preview"><iframe src="'+esc(app.url)+'" title="Live preview '+esc(title(app))+'" loading="lazy" tabindex="-1" aria-hidden="true"></iframe></div>':""}
      <span class="v7-tag">${esc(tag(app))}</span>
      <h3>${esc(title(app))}</h3>
      <p>${esc(desc(app))}</p>
      <span class="v7-app-link">${lang()==="en"?"Open →":"Buka →"}</span>
    </a>`;

  const flyoutLink=app=>`<a href="${esc(app.url)}" target="_blank" rel="noopener" data-app-id="${esc(app.id)}">${esc(title(app))}</a>`;

  const catalogCard=app=>{
    const groupLabel=app.group==="dashboard"?"Dashboard":app.group==="storymap"?"StoryMap":app.group==="soon"?"Dashboard":"Platform";
    const status=app.status==="soon"?"soon":(app.host==="SISMAPS"||app.host==="ArcGIS StoryMaps"?"external":"pages");
    const statusText=app.status==="soon"?"SOON":(status==="external"?"EXTERNAL":"PAGES");
    const search=[title(app,"ms"),title(app,"en"),desc(app,"ms"),desc(app,"en"),...(app.keywords||[])].join(" ");
    return `<article class="panel app-card" data-category="${esc(app.group==="geoportal"||app.group==="sismaps"||app.group==="smartdesa"||app.group==="platform"?"platform":app.group)}" data-search="${esc(search)}" data-app-id="${esc(app.id)}">
      <div class="app-meta"><span class="eyebrow">${groupLabel}</span><span class="status ${status}">${statusText}</span></div>
      <h3>${esc(title(app))}</h3>
      <p>${esc(desc(app))}</p>
      ${app.status==="soon"?'<span class="development">In development</span>':'<div class="freshness">Registry · '+esc(app.host||"SUO")+'</div><a target="_blank" rel="noopener" href="'+esc(app.url)+'">Launch ↗</a>'}
    </article>`;
  };

  const renderLanding=async()=>{
    const dashboards=await group("dashboard");
    const storymaps=await group("storymap");

    const dg=document.getElementById("registryDashboardGrid");
    if(dg) dg.innerHTML=dashboards.map(landingCard).join("");
    const sg=document.getElementById("registryStorymapGrid");
    if(sg) sg.innerHTML=storymaps.map(landingCard).join("");

    const dc=document.getElementById("registryDashboardCount");
    if(dc) dc.textContent=String(dashboards.length);
    const sc=document.getElementById("registryStorymapCount");
    if(sc) sc.textContent=String(storymaps.length);

    const flyouts={
      dashboard:dashboards,
      storymap:storymaps,
      geoportal:await group("geoportal"),
      sismaps:await group("sismaps"),
      smartdesa:await group("smartdesa")
    };
    for(const [key,apps] of Object.entries(flyouts)){
      const host=document.querySelector('[data-registry-flyout="'+key+'"]');
      if(host) host.innerHTML=apps.map(flyoutLink).join("");
    }

    document.dispatchEvent(new CustomEvent("suo:applications-rendered"));
  };

  const renderCatalog=async()=>{
    const host=document.getElementById("registryAppGrid");
    if(!host) return;
    const apps=(await all()).filter(x=>x.status==="active"||x.status==="soon");
    const rank={geoportal:1,platform:1,sismaps:1,smartdesa:1,dashboard:2,storymap:3,soon:4};
    apps.sort((a,b)=>(rank[a.group]||9)-(rank[b.group]||9)||title(a,"ms").localeCompare(title(b,"ms"),"ms",{sensitivity:"base"}));
    host.innerHTML=apps.map(catalogCard).join("");
    const count=apps.filter(x=>x.status==="active").length;
    document.querySelectorAll("[data-registry-active-count]").forEach(el=>el.textContent=String(count));
    document.dispatchEvent(new CustomEvent("suo:applications-rendered"));
  };

  const refreshLanguage=async()=>{
    await renderLanding();
  };

  window.SUOApps={PATH,load,all,active,group,getById,title,tag,desc,sortApps,renderLanding,renderCatalog,refreshLanguage};

  document.addEventListener("DOMContentLoaded",()=>{
    renderLanding().catch(console.error);
    renderCatalog().catch(console.error);
  });
})();