
"use strict";
const dictionary={
 ms:{home:"Laman Utama",featured:"Pilihan",directory:"Direktori",coming:"Akan Datang",back:"← Kembali",
 hero:"Terokai Ekosistem Digital<br>Perancangan Negeri Selangor.",copy:"Satu direktori bersepadu untuk dashboard, StoryMaps, aplikasi spatial dan sumber kecerdasan bandar PLANMalaysia Selangor.",
 placeholder:"Cari aplikasi, dashboard atau StoryMaps...",all:"Semua",dash:"Dashboard",story:"StoryMaps",soon:"Akan Datang",
 featuredBadge:"Aplikasi Pilihan",featuredTitle:"Platform Utama SUO",directoryTitle:"Dashboard dan StoryMaps",empty:"Tiada aplikasi ditemui."},
 en:{home:"Home",featured:"Featured",directory:"Directory",coming:"Coming Soon",back:"← Back",
 hero:"Explore Selangor's Digital<br>Planning Ecosystem.",copy:"An integrated directory for dashboards, StoryMaps, spatial applications and urban intelligence resources by PLANMalaysia Selangor.",
 placeholder:"Search applications, dashboards or StoryMaps...",all:"All",dash:"Dashboards",story:"StoryMaps",soon:"Coming Soon",
 featuredBadge:"Featured Application",featuredTitle:"SUO Flagship Platform",directoryTitle:"Dashboards and StoryMaps",empty:"No applications found."}
};
let filter="all";
const cards=[...document.querySelectorAll(".app-card")],search=document.getElementById("appSearch");
function update(){
 const q=search.value.trim().toLowerCase();let count=0;
 cards.forEach(card=>{const ok=(filter==="all"||card.dataset.category===filter)&&(!q||(card.dataset.search+" "+card.textContent).toLowerCase().includes(q));card.classList.toggle("hidden",!ok);if(ok)count++});
 document.getElementById("empty").classList.toggle("show",count===0);
 document.getElementById("count").textContent=count+" "+(document.documentElement.lang==="ms"?"aplikasi":"applications");
}
function applyLang(lang){
 document.documentElement.lang=lang;localStorage.setItem("suoLanguage",lang);
 document.querySelectorAll("[data-i18n]").forEach(el=>{const v=dictionary[lang][el.dataset.i18n];if(v)el.textContent=v});
 document.querySelectorAll("[data-i18n-html]").forEach(el=>{const v=dictionary[lang][el.dataset.i18nHtml];if(v)el.innerHTML=v});
 search.placeholder=dictionary[lang].placeholder;
 document.getElementById("currentLanguageLabel").textContent=lang==="ms"?"BM":"EN";
 document.querySelectorAll(".language-option").forEach(x=>x.classList.toggle("active",x.dataset.language===lang));update();
}
const menu=document.getElementById("languageMenu"),btn=document.getElementById("languageButton");
btn.addEventListener("click",e=>{e.stopPropagation();menu.classList.toggle("open")});
document.querySelectorAll(".language-option").forEach(x=>x.addEventListener("click",()=>{applyLang(x.dataset.language);menu.classList.remove("open")}));
document.addEventListener("click",()=>menu.classList.remove("open"));
document.getElementById("themeToggle").addEventListener("click",()=>{document.body.classList.toggle("dark");localStorage.setItem("suoTheme",document.body.classList.contains("dark")?"dark":"light")});
document.querySelectorAll(".filter").forEach(b=>b.addEventListener("click",()=>{filter=b.dataset.filter;document.querySelectorAll(".filter").forEach(x=>x.classList.toggle("active",x===b));update()}));
search.addEventListener("input",update);
const topBtn=document.getElementById("backToTop");addEventListener("scroll",()=>topBtn.classList.toggle("show",scrollY>500),{passive:true});topBtn.addEventListener("click",()=>scrollTo({top:0,behavior:"smooth"}));
if(localStorage.getItem("suoTheme")==="dark")document.body.classList.add("dark");
applyLang(localStorage.getItem("suoLanguage")||"ms");update();
