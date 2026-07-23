
"use strict";
const SUO = {
  lang: localStorage.getItem("suo-lang") || "ms",
  theme: localStorage.getItem("suo-theme") || "light"
};
function applyTheme(){
  document.body.classList.toggle("dark",SUO.theme==="dark");
  const b=document.getElementById("themeToggle");
  if(b) b.textContent=SUO.theme==="dark"?"☀":"◐";
}
function applyLanguage(){
  document.documentElement.lang=SUO.lang;
  document.querySelectorAll("[data-ms][data-en]").forEach(el=>{
    el.innerHTML = SUO.lang==="ms" ? el.dataset.ms : el.dataset.en;
  });
  document.querySelectorAll("[data-placeholder-ms][data-placeholder-en]").forEach(el=>{
    el.placeholder = SUO.lang==="ms" ? el.dataset.placeholderMs : el.dataset.placeholderEn;
  });
  const label=document.getElementById("languageLabel");
  if(label) label.textContent=SUO.lang==="ms"?"BM":"EN";
  document.querySelectorAll(".lang-option").forEach(el=>el.classList.toggle("active",el.dataset.lang===SUO.lang));
  document.dispatchEvent(new CustomEvent("suo:language",{detail:{lang:SUO.lang}}));
}
function setupShell(){
  const header=document.querySelector(".site-header");
  const topBtn=document.getElementById("toTop");
  const updateScroll=()=>{
    if(header) header.classList.toggle("scrolled",scrollY>18);
    if(topBtn) topBtn.classList.toggle("show",scrollY>650);
  };
  addEventListener("scroll",updateScroll,{passive:true}); updateScroll();

  const theme=document.getElementById("themeToggle");
  if(theme) theme.addEventListener("click",()=>{
    SUO.theme=SUO.theme==="dark"?"light":"dark";
    localStorage.setItem("suo-theme",SUO.theme); applyTheme();
  });

  const langBtn=document.getElementById("languageButton");
  const langMenu=document.getElementById("languageMenu");
  if(langBtn&&langMenu){
    langBtn.addEventListener("click",e=>{e.stopPropagation();langMenu.classList.toggle("open")});
    document.querySelectorAll(".lang-option").forEach(el=>el.addEventListener("click",()=>{
      SUO.lang=el.dataset.lang;localStorage.setItem("suo-lang",SUO.lang);applyLanguage();langMenu.classList.remove("open");
    }));
    document.addEventListener("click",()=>langMenu.classList.remove("open"));
  }

  const mobileBtn=document.getElementById("mobileButton");
  const mobilePanel=document.getElementById("mobilePanel");
  if(mobileBtn&&mobilePanel){
    mobileBtn.addEventListener("click",()=>{
      const open=mobilePanel.classList.toggle("open");
      document.body.classList.toggle("menu-open",open);
      mobileBtn.textContent=open?"×":"☰";
    });
    mobilePanel.querySelectorAll("a").forEach(a=>a.addEventListener("click",()=>{
      mobilePanel.classList.remove("open");document.body.classList.remove("menu-open");mobileBtn.textContent="☰";
    }));
  }

  if(topBtn) topBtn.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));

  const observer=new IntersectionObserver(entries=>{
    entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add("visible");observer.unobserve(e.target)}});
  },{threshold:.12});
  document.querySelectorAll(".reveal").forEach(el=>observer.observe(el));

  applyTheme();applyLanguage();
}
document.addEventListener("DOMContentLoaded",setupShell);
