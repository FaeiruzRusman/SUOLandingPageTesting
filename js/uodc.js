"use strict";
document.addEventListener("DOMContentLoaded",async()=>{
  const header=document.querySelector(".uodc-header");
  const mobileToggle=document.querySelector(".uodc-mobile-toggle");
  const dropdown=document.querySelector(".uodc-dropdown");
  const dropdownButton=dropdown?.querySelector("button");

  mobileToggle?.addEventListener("click",()=>{
    const open=header.classList.toggle("mobile-open");
    mobileToggle.setAttribute("aria-expanded",String(open));
  });

  dropdownButton?.addEventListener("click",(e)=>{
    e.stopPropagation();
    const open=dropdown.classList.toggle("open");
    dropdownButton.setAttribute("aria-expanded",String(open));
  });

  document.addEventListener("click",(e)=>{
    if(dropdown && !dropdown.contains(e.target)){
      dropdown.classList.remove("open");
      dropdownButton?.setAttribute("aria-expanded","false");
    }
  });

  const search=document.getElementById("catalogSearch");
  const filter=document.getElementById("catalogFilter");
  const list=document.getElementById("datasetList");
  const count=document.getElementById("catalogCount");
  const modal=document.getElementById("metadataModal");
  const close=modal?.querySelector(".uodc-modal-close");
  let datasets=[];

  const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,ch=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  const slug=value=>String(value||"").toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

  const statusClass=status=>{
    const s=String(status||"").toLowerCase();
    if(s==="aktif"||s==="live") return "verified";
    if(s==="staging"||s==="konfigurasi") return "draft";
    return "";
  };

  const repoUrl=repo=>repo ? "https://github.com/"+repo : "";
  const fileUrl=item=>{
    if(!item.repository || !item.paths?.length) return "";
    return "https://github.com/"+item.repository+"/blob/main/"+item.paths[0];
  };

  const buildSearchText=item=>[
    item.id,item.title,item.theme,item.owner,item.type,item.status,item.year,item.access,
    item.description,...(item.formats||[]),...(item.applications||[]),...(item.paths||[])
  ].join(" ").toLowerCase();

  const render=()=>{
    const q=(search?.value||"").trim().toLowerCase();
    const theme=filter?.value||"all";
    const visible=datasets.filter(item=>{
      const themeOk=theme==="all"||item.theme===theme;
      const queryOk=!q||buildSearchText(item).includes(q);
      return themeOk&&queryOk;
    });

    if(count) count.textContent=visible.length;

    list.innerHTML=visible.length ? visible.map((item,i)=>{
      const open=item.open_url||item.source_url||fileUrl(item);
      return `
        <article class="uodc-dataset" data-theme="${escapeHtml(item.theme)}">
          <div class="uodc-dataset-index">${String(i+1).padStart(2,"0")}</div>
          <div class="uodc-dataset-main">
            <div class="uodc-tags">
              <span>${escapeHtml(item.theme)}</span>
              <span>${escapeHtml(item.type)}</span>
              <span class="${statusClass(item.status)}">${escapeHtml(item.status)}</span>
              ${item.access&&item.access!=="Awam"?'<span class="access">'+escapeHtml(item.access)+'</span>':""}
            </div>
            <h3>${escapeHtml(item.title)}</h3>
            <p>${escapeHtml(item.owner)} · ${escapeHtml(item.year||"—")} · ${escapeHtml((item.formats||[]).join(" / "))}</p>
          </div>
          <div class="uodc-dataset-actions">
            <button type="button" class="uodc-meta" data-id="${escapeHtml(item.id)}">Metadata</button>
            ${open?'<a href="'+escapeHtml(open)+'" target="_blank" rel="noopener">'+(item.open_url?"Buka":"Sumber")+' ↗</a>':'<span class="uodc-disabled">Staging</span>'}
          </div>
        </article>
      `;
    }).join("") : '<div class="uodc-empty">Tiada dataset yang sepadan dengan carian atau tema ini.</div>';
  };

  const populateFilters=()=>{
    const themes=[...new Set(datasets.map(x=>x.theme))].sort((a,b)=>a.localeCompare(b,"ms"));
    filter.innerHTML='<option value="all">Semua tema</option>'+themes.map(t=>
      '<option value="'+escapeHtml(t)+'">'+escapeHtml(t)+'</option>'
    ).join("");
  };

  const updateStats=()=>{
    const spatial=datasets.filter(x=>/spatial/i.test(x.type)).length;
    const providers=new Set(datasets.map(x=>x.owner).filter(Boolean)).size;
    const staging=datasets.filter(x=>["Staging","Konfigurasi"].includes(x.status)).length;
    document.getElementById("statTotal").textContent=datasets.length;
    document.getElementById("statSpatial").textContent=spatial;
    document.getElementById("statProviders").textContent=providers;
    document.getElementById("statStaging").textContent=staging;
  };

  const showMetadata=item=>{
    if(!item||!modal) return;
    document.getElementById("metaTitle").textContent=item.title||"Metadata";
    document.getElementById("metaOwner").textContent=item.owner||"—";
    document.getElementById("metaType").textContent=item.type||"—";
    document.getElementById("metaFormat").textContent=(item.formats||[]).join(", ")||"—";
    document.getElementById("metaYear").textContent=item.year||"—";
    document.getElementById("metaStatus").textContent=item.status||"—";
    document.getElementById("metaAccess").textContent=item.access||"—";
    document.getElementById("metaApps").textContent=(item.applications||[]).join(", ")||"—";
    document.getElementById("metaRepo").textContent=item.repository||"Belum diterbitkan";
    document.getElementById("metaDescription").textContent=
      [item.description,item.note].filter(Boolean).join(" ");
    const actions=document.getElementById("metaActions");
    const actionItems=[];
    if(item.open_url) actionItems.push({label:"Buka Aplikasi",url:item.open_url,primary:true});
    if(item.source_url) actionItems.push({label:"Sumber Data",url:item.source_url});
    if(item.repository) actionItems.push({label:"Repositori",url:repoUrl(item.repository)});
    if(fileUrl(item)) actionItems.push({label:"Fail Sumber",url:fileUrl(item)});
    actions.innerHTML=actionItems.map(a=>
      '<a class="'+(a.primary?"primary":"")+'" target="_blank" rel="noopener" href="'+escapeHtml(a.url)+'">'+escapeHtml(a.label)+' ↗</a>'
    ).join("");
    modal.showModal();
  };

  list.addEventListener("click",e=>{
    const btn=e.target.closest(".uodc-meta");
    if(!btn) return;
    showMetadata(datasets.find(x=>x.id===btn.dataset.id));
  });
  close?.addEventListener("click",()=>modal.close());
  modal?.addEventListener("click",e=>{if(e.target===modal)modal.close();});

  search?.addEventListener("input",render);
  filter?.addEventListener("change",render);

  try{
    const response=await fetch("data/uodc-catalog.json",{cache:"no-cache"});
    if(!response.ok) throw new Error("Catalog unavailable");
    const payload=await response.json();
    datasets=Array.isArray(payload.datasets)?payload.datasets:[];
    populateFilters();
    updateStats();
    render();
  }catch(error){
    console.error(error);
    list.innerHTML='<div class="uodc-empty">Katalog data tidak dapat dimuatkan. Sila cuba semula.</div>';
    if(count) count.textContent="0";
  }
});