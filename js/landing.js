
"use strict";
const dictionary={
 ms:{
  home:"Utama",ecosystem:"Ekosistem",about:"Mengenai",platform:"Platform",applications:"Aplikasi",roadmap:"Hala Tuju",contact:"Hubungi",
  eyebrow:"Selangor Urban Observatory",hero:"Data Bersepadu.<br><span>Keputusan Lebih Pintar.</span>",heroCopy:"Hab kecerdasan bandar Negeri Selangor yang menyatukan data spatial dan bukan spatial untuk menyokong perancangan, pemantauan dan keputusan berasaskan bukti.",
  explore:"Terokai Aplikasi",learn:"Kenali SUO",ecoTitle:"Ekosistem Data Bandar Selangor",aboutTitle:"Satu Platform. Pelbagai Wawasan.",platformTitle:"Asas Digital untuk Perancangan Negeri.",
  appsTitle:"Akses Semua Aplikasi SUO",appsCopy:"Dashboard, StoryMaps dan aplikasi perancangan dihimpunkan dalam satu direktori khusus.",openHub:"Buka Applications Hub",
  roadmapTitle:"Pelaksanaan Secara Berfasa",contactTitle:"Hubungi Selangor Urban Observatory"
 },
 en:{
  home:"Home",ecosystem:"Ecosystem",about:"About",platform:"Platform",applications:"Applications",roadmap:"Roadmap",contact:"Contact",
  eyebrow:"Selangor Urban Observatory",hero:"Integrated Data.<br><span>Smarter Decisions.</span>",heroCopy:"Selangor's urban intelligence hub, integrating spatial and non-spatial data to support evidence-based planning, monitoring and decision-making.",
  explore:"Explore Applications",learn:"Discover SUO",ecoTitle:"Selangor Urban Data Ecosystem",aboutTitle:"One Platform. Multiple Insights.",platformTitle:"A Digital Foundation for State Planning.",
  appsTitle:"Access All SUO Applications",appsCopy:"Dashboards, StoryMaps and planning applications are organised in a dedicated directory.",openHub:"Open Applications Hub",
  roadmapTitle:"Phased Implementation",contactTitle:"Contact Selangor Urban Observatory"
 }
};
function applyLang(lang){
 document.documentElement.lang=lang;
 localStorage.setItem("suoLanguage",lang);
 document.querySelectorAll("[data-i18n]").forEach(el=>{const v=dictionary[lang][el.dataset.i18n];if(v)el.textContent=v});
 document.querySelectorAll("[data-i18n-html]").forEach(el=>{const v=dictionary[lang][el.dataset.i18nHtml];if(v)el.innerHTML=v});
 document.getElementById("currentLanguageLabel").textContent=lang==="ms"?"BM":"EN";
 document.querySelectorAll(".language-option").forEach(x=>x.classList.toggle("active",x.dataset.language===lang));
}
const menu=document.getElementById("languageMenu"),btn=document.getElementById("languageButton");
btn.addEventListener("click",e=>{e.stopPropagation();menu.classList.toggle("open");btn.setAttribute("aria-expanded",menu.classList.contains("open"))});
document.querySelectorAll(".language-option").forEach(x=>x.addEventListener("click",()=>{applyLang(x.dataset.language);menu.classList.remove("open")}));
document.addEventListener("click",()=>menu.classList.remove("open"));
document.getElementById("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("suoTheme",document.body.classList.contains("dark")?"dark":"light")});
const topBtn=document.getElementById("backToTop");
addEventListener("scroll",()=>topBtn.classList.toggle("show",scrollY>600),{passive:true});
topBtn.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
if(localStorage.getItem("suoTheme")==="dark")document.body.classList.add("dark");
applyLang(localStorage.getItem("suoLanguage")||"ms");
