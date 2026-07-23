
"use strict";
document.addEventListener("DOMContentLoaded",()=>{
  const cards=[...document.querySelectorAll(".app-card")];
  const input=document.getElementById("appSearch");
  const filters=[...document.querySelectorAll(".side-filter")];
  const empty=document.getElementById("emptyState");
  const count=document.getElementById("resultCount");
  let active="all";

  function refresh(){
    const q=(input?.value||"").trim().toLowerCase();
    let visible=0;
    cards.forEach(card=>{
      const category=card.dataset.category;
      const hay=(card.dataset.search+" "+card.textContent).toLowerCase();
      const show=(active==="all"||active===category)&&(!q||hay.includes(q));
      card.classList.toggle("hidden",!show);
      if(show) visible++;
    });
    if(empty) empty.classList.toggle("show",visible===0);
    if(count) count.textContent=SUO.lang==="ms"?`${visible} aplikasi`:`${visible} applications`;
  }
  filters.forEach(btn=>btn.addEventListener("click",()=>{
    active=btn.dataset.filter;
    filters.forEach(b=>b.classList.toggle("active",b===btn));
    refresh();
  }));
  if(input) input.addEventListener("input",refresh);
  document.addEventListener("suo:language",refresh);
  refresh();
});
