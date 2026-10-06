(() => {
  const PATHS={
    facts:"data/suo-facts.json",
    glossary:"data/suo-glossary.json",
    faq:"data/suo-faq.json",
    selangor:"data/selangor-basics.json"
  };

  let cache=null;
  let loading=null;

  const normalize=value=>String(value??"")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9\s]/g," ")
    .replace(/\s+/g," ")
    .trim();

  const fetchJson=async path=>{
    const response=await fetch(path,{cache:"no-cache"});
    if(!response.ok) throw new Error("Unable to load "+path);
    return response.json();
  };

  const load=()=>{
    if(cache) return Promise.resolve(cache);
    if(loading) return loading;
    loading=Promise.all([
      fetchJson(PATHS.facts),
      fetchJson(PATHS.glossary),
      fetchJson(PATHS.faq),
      fetchJson(PATHS.selangor)
    ]).then(([facts,glossary,faq,selangor])=>{
      cache={facts,glossary,faq,selangor};
      return cache;
    }).finally(()=>{loading=null;});
    return loading;
  };

  const score=(query,text,title="")=>{
    const q=normalize(query);
    const terms=q.split(" ").filter(t=>t.length>1);
    if(!terms.length) return 0;
    const hay=normalize(text);
    const head=normalize(title);
    let total=0;
    terms.forEach(term=>{
      if(head.includes(term)) total+=5;
      if(hay.includes(term)) total+=2;
      if(hay===term) total+=4;
    });
    if(hay.includes(q)) total+=6;
    if(head.includes(q)) total+=8;
    return total;
  };

  const sourceById=(state,id)=>
    (state?.selangor?.sources||[]).find(s=>s.id===id)||null;

  const search=async(query,{limit=6,types=["facts","selangor","glossary","faq"]}={})=>{
    const state=await load();
    const results=[];

    if(types.includes("facts")){
      (state.facts?.facts||[]).forEach(item=>{
        const text=[item.title,item.fact,...(item.keywords||[])].join(" ");
        const s=score(query,text,item.title);
        if(s>0) results.push({
          type:"fact",score:s,id:item.id,title:item.title,text:item.fact,
          category:item.category,keywords:item.keywords||[],source:null,raw:item
        });
      });
    }

    if(types.includes("selangor")){
      (state.selangor?.figures||[]).forEach(item=>{
        const text=[item.title,item.fact,item.value,item.display_value,item.unit,item.as_of,...(item.keywords||[])].join(" ");
        const s=score(query,text,item.title);
        if(s>0) results.push({
          type:"selangor",score:s,id:item.id,title:item.title,text:item.fact,
          category:"Selangor Asas",keywords:item.keywords||[],
          source:sourceById(state,item.source_id),raw:item
        });
      });
    }

    if(types.includes("glossary")){
      (state.glossary?.glossary||[]).forEach(item=>{
        const s=score(query,item.term+" "+item.definition,item.term);
        if(s>0) results.push({
          type:"glossary",score:s,title:item.term,text:item.definition,
          category:"Glosari",source:null,raw:item
        });
      });
    }

    if(types.includes("faq")){
      (state.faq?.faqs||[]).forEach(item=>{
        const s=score(query,item.question+" "+item.answer,item.question);
        if(s>0) results.push({
          type:"faq",score:s,id:item.id,title:item.question,text:item.answer,
          category:"FAQ",source:null,raw:item
        });
      });
    }

    return results.sort((a,b)=>b.score-a.score).slice(0,limit);
  };

  window.SUOKnowledge={PATHS,normalize,load,search,sourceById};
})();