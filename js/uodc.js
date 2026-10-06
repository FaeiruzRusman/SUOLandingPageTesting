"use strict";
document.addEventListener("DOMContentLoaded",()=>{
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
  const cards=[...document.querySelectorAll(".uodc-dataset")];
  const count=document.getElementById("catalogCount");

  const updateStats=()=>{
    document.getElementById("statTotal").textContent=cards.length;
    document.getElementById("statSpatial").textContent=cards.filter(c=>c.dataset.type==="spatial").length;
    document.getElementById("statCategories").textContent=new Set(cards.map(c=>c.dataset.category)).size;
  };

  const applyFilter=()=>{
    const q=(search?.value||"").toLowerCase().trim();
    const category=filter?.value||"all";
    let visible=0;
    cards.forEach(card=>{
      const categoryOk=category==="all"||card.dataset.category===category;
      const searchOk=!q||((card.dataset.search||"")+" "+card.textContent).toLowerCase().includes(q);
      const show=categoryOk&&searchOk;
      card.classList.toggle("hidden",!show);
      if(show) visible++;
    });
    if(count) count.textContent=visible;
  };

  search?.addEventListener("input",applyFilter);
  filter?.addEventListener("change",applyFilter);
  updateStats();
  applyFilter();

  const modal=document.getElementById("metadataModal");
  const close=modal?.querySelector(".uodc-modal-close");
  document.querySelectorAll(".uodc-meta").forEach(btn=>btn.addEventListener("click",()=>{
    document.getElementById("metaTitle").textContent=btn.dataset.title||"Metadata";
    document.getElementById("metaOwner").textContent=btn.dataset.owner||"—";
    document.getElementById("metaType").textContent=btn.dataset.type||"—";
    document.getElementById("metaUpdate").textContent=btn.dataset.update||"—";
    document.getElementById("metaStatus").textContent=btn.dataset.status||"—";
    modal?.showModal();
  }));
  close?.addEventListener("click",()=>modal.close());
  modal?.addEventListener("click",e=>{if(e.target===modal)modal.close();});
});