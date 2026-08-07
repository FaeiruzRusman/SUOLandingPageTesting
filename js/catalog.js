
"use strict";
document.addEventListener("DOMContentLoaded",()=>{const s=document.getElementById("catalogSearch"),f=document.getElementById("catalogFilter"),c=[...document.querySelectorAll(".dataset")];function r(){const q=(s?.value||"").toLowerCase(),a=f?.value||"all";c.forEach(x=>x.classList.toggle("hidden",!((a==="all"||x.dataset.category===a)&&(!q||(x.dataset.search+" "+x.textContent).toLowerCase().includes(q)))))}s?.addEventListener("input",r);f?.addEventListener("change",r);r()});
