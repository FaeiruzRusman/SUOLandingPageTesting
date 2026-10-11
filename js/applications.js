"use strict";
document.addEventListener("DOMContentLoaded",()=>{
  const search=document.getElementById("appSearch");
  const filters=[...document.querySelectorAll(".filter")];
  const empty=document.getElementById("empty");
  let activeFilter="all";

  const apply=()=>{
    const cards=[...document.querySelectorAll(".app-card")];
    const q=(search?.value||"").toLowerCase().trim();
    let visible=0;
    cards.forEach(card=>{
      const okCategory=activeFilter==="all"||card.dataset.category===activeFilter;
      const hay=((card.dataset.search||"")+" "+card.textContent).toLowerCase();
      const okSearch=!q||hay.includes(q);
      const show=okCategory&&okSearch;
      card.classList.toggle("hidden",!show);
      if(show) visible++;
    });
    empty?.classList.toggle("show",cards.length>0&&visible===0);
  };

  search?.addEventListener("input",apply);
  filters.forEach(button=>button.addEventListener("click",()=>{
    activeFilter=button.dataset.filter||"all";
    filters.forEach(x=>x.classList.toggle("active",x===button));
    apply();
  }));

  document.addEventListener("suo:applications-rendered",apply);
  apply();
});