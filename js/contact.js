
"use strict";
document.addEventListener("DOMContentLoaded",()=>{
  const form=document.getElementById("contactForm");
  const note=document.getElementById("formNotice");
  if(form) form.addEventListener("submit",e=>{
    e.preventDefault();
    note.hidden=false;
    note.textContent=SUO.lang==="ms"
      ?"Borang demo sahaja. Sila gunakan e-mel rasmi yang dipaparkan untuk menghubungi pihak SUO."
      :"This is a demonstration form. Please use the official email shown to contact SUO.";
  });
});
