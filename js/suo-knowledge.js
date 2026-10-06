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

  const QUESTION_WORDS=new Set([
    "berapa","apakah","apa","siapa","mana","tolong","boleh","nak","saya","aku","kau",
    "the","what","how","much","many","is","are","of"
  ]);

  const normaliseIntent=value=>normalize(value)
    .replace(/\bluas\b/g,"keluasan")
    .replace(/\barea\b/g,"keluasan")
    .replace(/\bpopulasi\b/g,"penduduk")
    .replace(/\bpopulation\b/g,"penduduk")
    .replace(/\bdensity\b/g,"kepadatan")
    .replace(/\blocal authority\b/g,"pbt");

  const meaningfulTerms=query=>normaliseIntent(query)
    .split(" ")
    .filter(t=>t.length>1 && !QUESTION_WORDS.has(t));

  const score=(query,text,title="",keywords=[])=>{
    const q=normaliseIntent(query);
    const terms=meaningfulTerms(query);
    if(!terms.length) return 0;

    const hay=normaliseIntent(text);
    const head=normaliseIntent(title);
    const core=terms.join(" ");
    let total=0;

    terms.forEach(term=>{
      if(head.includes(term)) total+=5;
      if(hay.includes(term)) total+=2;
    });

    // Strongly prefer records whose title matches the actual subject + attribute.
    if(core && head.includes(core)) total+=34;
    else if(core && hay.includes(core)) total+=18;

    const titleAll=terms.every(term=>head.includes(term));
    const hayAll=terms.every(term=>hay.includes(term));
    if(titleAll) total+=24;
    else if(hayAll) total+=10;

    // Multi-word keywords act as named-entity / exact-topic aliases.
    (keywords||[]).forEach(keyword=>{
      const k=normaliseIntent(keyword);
      if(!k) return;
      if(q.includes(k)) total+=k.includes(" ")?28:8;
    });

    if(head===core) total+=20;
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
        const s=score(query,text,item.title,item.keywords||[]);
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
        const s=score(query,item.term+" "+item.definition,item.term,[]);
        if(s>0) results.push({
          type:"glossary",score:s,title:item.term,text:item.definition,
          category:"Glosari",source:null,raw:item
        });
      });
    }

    if(types.includes("faq")){
      (state.faq?.faqs||[]).forEach(item=>{
        const s=score(query,item.question+" "+item.answer,item.question,[]);
        if(s>0) results.push({
          type:"faq",score:s,id:item.id,title:item.question,text:item.answer,
          category:"FAQ",source:null,raw:item
        });
      });
    }

    return results.sort((a,b)=>b.score-a.score).slice(0,limit);
  };

  window.SUOKnowledge={
    PATHS,normalize,normaliseIntent,meaningfulTerms,load,search,sourceById
  };
})();