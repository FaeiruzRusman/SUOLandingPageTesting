(() => {
  const $=s=>document.querySelector(s);
  const $$=s=>Array.from(document.querySelectorAll(s));

  const els={
    search:$("#search"),
    tabs:$$(".kb-tab"),
    panels:$$(".kb-panel"),
    factsGrid:$("#factsGrid"),
    glossaryGrid:$("#glossaryGrid"),
    faqList:$("#faqList"),
    selangorGrid:$("#selangorGrid"),
    categoryChips:$("#categoryChips"),
    districtList:$("#districtList"),
    pbtList:$("#pbtList"),
    logicList:$("#logicList"),
    resultsCount:$("#resultsCount"),
    selangorCount:$("#selangorCount"),
    statFacts:$("#statFacts"),
    statSelangor:$("#statSelangor"),
    statGlossary:$("#statGlossary"),
    statFaq:$("#statFaq")
  };

  let state=null;
  let activeCategory="ALL";

  const escapeHtml=value=>String(value??"").replace(/[&<>"']/g,ch=>({
    "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"
  }[ch]));

  const sourceFor=id=>SUOKnowledge.sourceById(state,id);

  const renderFacts=(query="")=>{
    const facts=state.facts?.facts||[];
    const q=SUOKnowledge.normalize(query);
    const filtered=facts.filter(item=>{
      if(activeCategory!=="ALL" && item.category_code!==activeCategory) return false;
      if(!q) return true;
      const hay=SUOKnowledge.normalize([item.title,item.fact,...(item.keywords||[])].join(" "));
      return q.split(" ").filter(Boolean).every(term=>hay.includes(term));
    });

    els.resultsCount.textContent=filtered.length+" fakta";
    els.factsGrid.innerHTML=filtered.map(item=>`
      <article class="kb-card">
        <div class="kb-card-meta"><span>${escapeHtml(item.id)}</span><b>${escapeHtml(item.category_code)}</b></div>
        <h3>${escapeHtml(item.title)}</h3>
        <p>${escapeHtml(item.fact)}</p>
        <small>${escapeHtml(item.category)}</small>
      </article>
    `).join("") || '<div class="kb-empty">Tiada fakta yang sepadan.</div>';
  };

  const renderCategories=()=>{
    const categories=state.facts?.meta?.categories||{};
    const buttons=[['ALL','Semua'],...Object.entries(categories)];
    els.categoryChips.innerHTML=buttons.map(([code,label])=>`
      <button class="kb-chip ${code===activeCategory?'active':''}" data-category="${escapeHtml(code)}">
        ${escapeHtml(code==='ALL'?label:code+" · "+label)}
      </button>
    `).join("");
    els.categoryChips.addEventListener("click",event=>{
      const btn=event.target.closest("[data-category]");
      if(!btn) return;
      activeCategory=btn.dataset.category;
      $$(".kb-chip").forEach(x=>x.classList.toggle("active",x===btn));
      renderFacts(els.search.value);
    });
  };

  const renderGlossary=(query="")=>{
    const q=SUOKnowledge.normalize(query);
    const items=(state.glossary?.glossary||[]).filter(item=>{
      if(!q) return true;
      return SUOKnowledge.normalize(item.term+" "+item.definition).includes(q);
    });
    els.glossaryGrid.innerHTML=items.map(item=>`
      <article class="kb-card kb-glossary-card">
        <h3>${escapeHtml(item.term)}</h3>
        <p>${escapeHtml(item.definition)}</p>
      </article>
    `).join("") || '<div class="kb-empty">Tiada istilah yang sepadan.</div>';
  };

  const renderFaq=(query="")=>{
    const q=SUOKnowledge.normalize(query);
    const items=(state.faq?.faqs||[]).filter(item=>{
      if(!q) return true;
      return SUOKnowledge.normalize(item.question+" "+item.answer).includes(q);
    });
    els.faqList.innerHTML=items.map(item=>`
      <details class="kb-faq-item">
        <summary><span>${escapeHtml(item.id)}</span>${escapeHtml(item.question)}</summary>
        <p>${escapeHtml(item.answer)}</p>
      </details>
    `).join("") || '<div class="kb-empty">Tiada FAQ yang sepadan.</div>';
  };

  const renderSelangor=(query="")=>{
    const q=SUOKnowledge.normalize(query);
    const items=(state.selangor?.figures||[]).filter(item=>{
      if(!q) return true;
      return SUOKnowledge.normalize([item.title,item.fact,item.value,item.display_value,item.unit,item.as_of,...(item.keywords||[])].join(" ")).includes(q);
    });
    els.selangorCount.textContent=items.length+" fakta";
    els.selangorGrid.innerHTML=items.map(item=>{
      const source=sourceFor(item.source_id);
      const value=item.display_value??item.value;
      return `
        <article class="kb-card kb-figure-card">
          <div class="kb-card-meta"><span>${escapeHtml(item.id)}</span><b>${escapeHtml(item.as_of||"")}</b></div>
          <strong class="kb-figure">${escapeHtml(value)}${item.unit?" <em>"+escapeHtml(item.unit)+"</em>":""}</strong>
          <h3>${escapeHtml(item.title)}</h3>
          <p>${escapeHtml(item.fact)}</p>
          ${item.caveat?'<small class="kb-caveat">'+escapeHtml(item.caveat)+'</small>':""}
          ${source?'<a class="kb-source" target="_blank" rel="noopener" href="'+escapeHtml(source.url)+'">Sumber: '+escapeHtml(source.agency)+' ↗</a>':""}
        </article>`;
    }).join("") || '<div class="kb-empty">Tiada fakta Selangor yang sepadan.</div>';

    els.districtList.innerHTML=(state.selangor?.districts||[]).map(x=>
      '<span>'+escapeHtml(x.name)+(x.official_dosm_label?' <small>DOSM: '+escapeHtml(x.official_dosm_label)+'</small>':'')+'</span>'
    ).join("");

    els.pbtList.innerHTML=(state.selangor?.local_authorities||[]).map(x=>
      '<div><b>'+escapeHtml(x.abbr)+'</b><span>'+escapeHtml(x.name)+'</span></div>'
    ).join("");

    els.logicList.innerHTML=(state.selangor?.logic_rules||[]).map(x=>
      '<article><b>'+escapeHtml(x.title)+'</b><p>'+escapeHtml(x.rule)+'</p></article>'
    ).join("");
  };

  const renderActive=()=>{
    const query=els.search.value.trim();
    const active=$(".kb-panel.active")?.id;
    if(active==="factsPanel") renderFacts(query);
    if(active==="selangorPanel") renderSelangor(query);
    if(active==="glossaryPanel") renderGlossary(query);
    if(active==="faqPanel") renderFaq(query);
  };

  const setTab=target=>{
    els.tabs.forEach(btn=>btn.classList.toggle("active",btn.dataset.target===target));
    els.panels.forEach(panel=>panel.classList.toggle("active",panel.id===target));
    renderActive();
  };

  const init=async()=>{
    try{
      state=await SUOKnowledge.load();
      els.statFacts.textContent=state.facts?.facts?.length||0;
      els.statSelangor.textContent=state.selangor?.figures?.length||0;
      els.statGlossary.textContent=state.glossary?.glossary?.length||0;
      els.statFaq.textContent=state.faq?.faqs?.length||0;

      renderCategories();
      renderFacts();
      renderSelangor();
      renderGlossary();
      renderFaq();

      els.tabs.forEach(btn=>btn.addEventListener("click",()=>setTab(btn.dataset.target)));
      els.search.addEventListener("input",renderActive);
    }catch(error){
      console.error(error);
      document.querySelector(".kb-main").innerHTML='<div class="kb-empty">Knowledge Base tidak dapat dimuatkan. Sila cuba semula.</div>';
    }
  };

  init();
})();