(() => {
  const $=s=>document.querySelector(s);
  const messages=$("#messages"),form=$("#askForm"),input=$("#askInput");
  const avatar="https://selangorurbanobservatory.github.io/3D-Geoportal/assets/avatar/mr-tpr-suo.png?v=8.0.5D";
  const state={lastQuery:"",lastTopics:[],lastApps:[]};

  const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#39;"}[c]));
  const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();

  const TOPICS={
    housing:["perumahan","housing","rumah","rsku","lphs"],
    economy:["ekonomi","economy","pelancongan","tourism","geopark"],
    industry:["industri","perindustrian","industry","industrial"],
    facilities:["kemudahan","facility","facilities","kesihatan","health","pendidikan","education","sekolah","school","keselamatan","safety","hospital","klinik","polis","bomba"],
    environment:["alam sekitar","environment","ksas","tanah lapang","open space","geopark","banjir","flood"],
    planning:["perancangan","planning","guna tanah","land use","sia","murninets","lembaga rayuan","rancangan struktur","rsn"],
    community:["desa","komuniti","smartdesa","rural","community"],
    mobility:["mobiliti","mobility","trafik","traffic","rel","rail","mrt","lrt","ktm","tod"],
    demographics:["demografi","demographic","sosioekonomi","socioeconomic","penduduk","population","pendapatan","income","kemiskinan","poverty","buruh","labour"],
    infrastructure:["infrastruktur","infrastructure","utiliti","utility","telekomunikasi","telco"],
    resilience:["risiko","risk","daya tahan","resilience","banjir","flood","bencana","disaster"],
    landdev:["tanah","land","pembangunan","development","kadaster","cadastral","lot"]
  };

  const topicLabels={housing:"Perumahan",economy:"Ekonomi",industry:"Industri",facilities:"Kemudahan",environment:"Alam Sekitar",planning:"Perancangan",community:"Desa & Komuniti",mobility:"Mobiliti",demographics:"Demografi & Sosioekonomi",infrastructure:"Infrastruktur & Utiliti",resilience:"Risiko & Daya Tahan",landdev:"Tanah & Pembangunan"};

  // Spatial intelligence: derive area directly from SUO boundary geometry when
  // the question is spatial, instead of allowing place-name keyword matches to
  // override the intended geographic level.
  const STATE_DISTRICT_BOUNDARY_URL="https://selangorurbanobservatory.github.io/3D-Geoportal/data/pentadbiran/sempadan_daerah_selangor.geojson";
  const PBT_BOUNDARY_URL="https://selangorurbanobservatory.github.io/3D-Geoportal/data/pentadbiran/sempadan_pbt_selangor_2024.geojson";
  let pbtBoundaryCache=null;
  const isAreaQuestion=q=>/\b(luas|keluasan|area)\b/.test(norm(q));
  const isPbtAreaQuestion=q=>isAreaQuestion(q)&&/\b(pbt|pihak berkuasa tempatan|majlis|mbsa|mbpj|mbdk|mbsj|mps|mpaj|mpkj|mpsepang|mpkl|mpks|mphs|mdsb|mpk|mpsj|mdkl|mdks|mdhs|sabak bernam|shah alam|petaling jaya|subang jaya|ampang jaya|selayang|kajang|sepang|kuala langat|hulu selangor|kuala selangor|klang)\b/.test(norm(q));
  let stateBoundaryCache=null;

  const isStateAreaQuery=q=>{
    const n=norm(q);
    const asksArea=/\b(luas|keluasan|area)\b/.test(n);
    const saysSelangor=/\bselangor\b/.test(n);
    const namedSubarea=/\b(kuala selangor|hulu selangor|petaling|klang|gombak|sepang|hulu langat|kuala langat|sabak bernam|mbsa|mbpj|mbdk|mps|mbsj|mpaj|mpkj|mpsepang|mpkl|mpks|mphs|mdsb)\b/.test(n);
    return asksArea && saysSelangor && !namedSubarea && !isPbtAreaQuestion(q);
  };

  const rad=d=>d*Math.PI/180;
  const ringArea=coords=>{
    if(!Array.isArray(coords)||coords.length<3) return 0;
    const R=6378137;
    let total=0;
    for(let i=0;i<coords.length;i++){
      const lower=coords[(i+coords.length-1)%coords.length];
      const middle=coords[i];
      const upper=coords[(i+1)%coords.length];
      total+=(rad(upper[0])-rad(lower[0]))*Math.sin(rad(middle[1]));
    }
    return total*R*R/2;
  };
  const polygonArea=poly=>{
    if(!Array.isArray(poly)||!poly.length) return 0;
    let area=Math.abs(ringArea(poly[0]));
    for(let i=1;i<poly.length;i++) area-=Math.abs(ringArea(poly[i]));
    return Math.max(0,area);
  };
  const geometryArea=g=>{
    if(!g) return 0;
    if(g.type==="Polygon") return polygonArea(g.coordinates);
    if(g.type==="MultiPolygon") return g.coordinates.reduce((sum,p)=>sum+polygonArea(p),0);
    if(g.type==="GeometryCollection") return (g.geometries||[]).reduce((sum,x)=>sum+geometryArea(x),0);
    return 0;
  };
  const loadStateBoundary=async()=>{
    if(stateBoundaryCache) return stateBoundaryCache;
    stateBoundaryCache=fetch(STATE_DISTRICT_BOUNDARY_URL,{cache:"force-cache"})
      .then(r=>{if(!r.ok)throw new Error("Boundary GeoJSON "+r.status);return r.json()});
    return stateBoundaryCache;
  };
  const deriveSelangorArea=async()=>{
    const fc=await loadStateBoundary();
    const sqm=(fc.features||[]).reduce((sum,f)=>sum+geometryArea(f.geometry),0);
    if(!Number.isFinite(sqm)||sqm<=0) throw new Error("Invalid boundary area");
    return sqm/1e6;
  };



  // PBT area figures supplied for SUO, expressed in hectares (ha).
  // Boundary GeoJSON remains the map geometry source; its web_area attribute
  // is intentionally NOT used for the answer because the supplied reference
  // figures are the designated area values.
  const PBT_AREA_REFERENCE=[
    {code:"MBSA",name:"Majlis Bandaraya Shah Alam",ha:30144.60,aliases:["mbsa","shah alam"]},
    {code:"MBPJ",name:"Majlis Bandaraya Petaling Jaya",ha:9810.73,aliases:["mbpj","petaling jaya"]},
    {code:"MBSJ",name:"Majlis Bandaraya Subang Jaya",ha:16283.80,aliases:["mbsj","mpsj","subang jaya"]},
    {code:"MBDK",name:"Majlis Bandaraya Diraja Klang",ha:74762.02,aliases:["mbdk","mpk","klang"]},
    {code:"MPS",name:"Majlis Perbandaran Selayang",ha:52385.78,aliases:["mps","selayang"]},
    {code:"MPAJ",name:"Majlis Perbandaran Ampang Jaya",ha:13905.78,aliases:["mpaj","ampang jaya"]},
    {code:"MPKJ",name:"Majlis Perbandaran Kajang",ha:80601.53,aliases:["mpkj","kajang"]},
    {code:"MPSp",name:"Majlis Perbandaran Sepang",ha:56344.59,aliases:["mpsp","mpsepang","sepang"]},
    {code:"MPKL",name:"Majlis Perbandaran Kuala Langat",ha:89998.13,aliases:["mpkl","mdkl","kuala langat"]},
    {code:"MPKS",name:"Majlis Perbandaran Kuala Selangor",ha:126487.69,aliases:["mpks","mdks","kuala selangor"]},
    {code:"MPHS",name:"Majlis Perbandaran Hulu Selangor",ha:175185.57,aliases:["mphs","mdhs","hulu selangor"]},
    {code:"MDSB",name:"Majlis Daerah Sabak Bernam",ha:107810.51,aliases:["mdsb","sabak bernam"]}
  ];
  const matchNamedPbt=question=>{
    const tokens=" "+norm(question)+" ";
    return PBT_AREA_REFERENCE.find(row=>[row.code,...row.aliases].some(alias=>tokens.includes(" "+norm(alias)+" ")))||null;
  };
  const areaFormat=n=>new Intl.NumberFormat("ms-MY",{minimumFractionDigits:2,maximumFractionDigits:2}).format(n);
  const answerPbtArea=async question=>{
    const target=matchNamedPbt(question);
    const rows=target?[target]:PBT_AREA_REFERENCE;
    const totalHa=PBT_AREA_REFERENCE.reduce((sum,row)=>sum+row.ha,0);
    const listHtml='<ul>'+rows.map(r=>'<li><strong>'+esc(r.code)+' — '+esc(r.name)+'</strong>: '+areaFormat(r.ha)+' ha ('+areaFormat(r.ha/100)+' km²)</li>').join("")+'</ul>';
    return {
      title:target?"Keluasan "+target.code:"Keluasan 12 PBT Negeri Selangor",
      badge:"JUPEM 2024",
      summary:target
        ? 'Berdasarkan <strong>jadual keluasan PBT JUPEM 2024</strong>, keluasan <strong>'+esc(target.code)+' ('+esc(target.name)+')</strong> ialah <strong>'+areaFormat(target.ha)+' hektar</strong> ('+areaFormat(target.ha/100)+' km²).'
        : 'Berikut ialah keluasan <strong>12 PBT</strong> berdasarkan jadual JUPEM 2024 dalam unit hektar (ha):'+listHtml+'<p><strong>Jumlah nilai jadual: '+areaFormat(totalHa)+' ha ('+areaFormat(totalHa/100)+' km²).</strong> Jumlah ini merupakan keluasan Negeri Selangor berdasarkan jadual JUPEM 2024.</p>',
      insights:[{label:"Unit",title:"Hektar (ha)",text:"1 km² = 100 ha. Keluasan PBT dirujuk daripada jadual nilai yang dibekalkan, bukan atribut web_area GeoJSON."}],
      sources:["Jabatan Ukur dan Pemetaan Malaysia (JUPEM), 2024 · Jadual keluasan 12 PBT (hektar)"],
      actions:[{label:"Buka 3D GeoPortal (sempadan PBT)",url:"https://selangorurbanobservatory.github.io/3D-Geoportal/"}]
    };
  };

  const detectTopics=q=>{
    const n=norm(q); return Object.entries(TOPICS).filter(([,terms])=>terms.some(t=>n.includes(norm(t)))).map(([k])=>k);
  };
  const isDiscovery=q=>/ada data|dataset|data apa|mana data|cari data|dashboard apa|aplikasi apa|sumber data|data tersedia/i.test(q);
  const isNavigation=q=>/buka|open|pergi ke|go to|launch|terokai/i.test(q);
  const isComparison=q=>/banding|compare|perbandingan|vs\b|versus|antara .* dan /i.test(q);
  const isInsight=q=>/isu|insight|trend|corak|pattern|utama|ringkas|analisis|analysis|rumus|summary/i.test(q);
  const isShortFollowup=q=>norm(q).split(" ").length<=5 && /pula|lagi|yang|kalau|bagaimana|mcm mana|macam mana/i.test(q);

  const addUser=text=>{
    const el=document.createElement("div"); el.className="msg user";
    el.innerHTML='<div class="bubble">'+esc(text)+'</div>'; messages.appendChild(el); scrollEnd();
  };
  const addTyping=()=>{
    const el=document.createElement("div");el.className="msg bot";el.id="typing";
    el.innerHTML='<div class="mini"><img src="'+avatar+'" alt=""></div><div class="bubble"><span class="typing"><i></i><i></i><i></i></span></div>';
    messages.appendChild(el);scrollEnd();
  };
  const removeTyping=()=>$("#typing")?.remove();
  const scrollEnd=()=>requestAnimationFrame(()=>messages.scrollTop=messages.scrollHeight);

  const actionHtml=(actions=[])=>actions.length?'<div class="answer-section"><div class="answer-section-title">Teroka seterusnya</div><div class="actions">'+actions.map((a,i)=>'<a '+(i===0?'class="primary" ':'')+'href="'+esc(a.url)+'" '+(/^https?:/.test(a.url)?'target="_blank" rel="noopener"':'')+'>'+esc(a.label)+' ↗</a>').join("")+'</div></div>':"";
  const sourceHtml=sources=>sources.length?'<div class="answer-section"><div class="answer-section-title">Sumber data</div><div class="source-list">'+sources.slice(0,4).map(s=>'<div class="source">'+esc(s)+'</div>').join("")+'</div></div>':"";
  const insightHtml=insights=>insights.length?'<div class="insight-grid">'+insights.slice(0,4).map(x=>'<div class="insight"><small>'+esc(x.label)+'</small><b>'+esc(x.title)+'</b><span>'+esc(x.text)+'</span></div>').join("")+'</div>':"";

  const addAnswer=ans=>{
    const el=document.createElement("div");el.className="msg bot";
    el.innerHTML='<div class="mini"><img src="'+avatar+'" alt=""></div><div class="bubble"><div class="answer-head"><strong>'+esc(ans.title||"Mr. TPr SUO")+'</strong><span class="answer-badge">'+esc(ans.badge||"URBAN INTELLIGENCE")+'</span></div><div class="answer-summary">'+ans.summary+'</div>'+insightHtml(ans.insights||[])+sourceHtml(ans.sources||[])+actionHtml(ans.actions||[])+'</div>';
    messages.appendChild(el);scrollEnd();
  };

  const getApps=async()=>{
    if(!window.SUOApps) return [];
    try{return await window.SUOApps.active()}catch{return []}
  };
  const appText=a=>norm([a.title_ms,a.title_en,a.description_ms,a.description_en,a.tag_ms,a.tag_en,...(a.keywords||[]),...(a.themes||[])].join(" "));
  const matchApps=(apps,q,topics)=>{
    const terms=norm(q).split(" ").filter(x=>x.length>2);
    return apps.map(a=>{
      const hay=appText(a); let score=0;
      terms.forEach(t=>{if(hay.includes(t))score+=2});
      (topics||[]).forEach(t=>{if((a.themes||[]).includes(t))score+=7});
      if(norm(a.title_ms)===norm(q)||norm(a.title_en)===norm(q))score+=15;
      return {a,score};
    }).filter(x=>x.score>0).sort((x,y)=>y.score-x.score).map(x=>x.a);
  };

  const appAction=a=>({label:a.title_ms||a.title_en,url:a.url||"index.html#applications"});
  const knowledgeSearch=async(q,limit=6)=>{
    if(!window.SUOKnowledge) return [];
    try{return await window.SUOKnowledge.search(q,{limit})}catch{return []}
  };
  const sourceLabel=item=>{
    if(item.raw?.source_document) return item.raw.source_document+" · "+(item.raw.source_page||"rujukan dasar")+(item.raw.gazette_number?" · Warta "+item.raw.gazette_number:"");
    if(item.source?.agency) return item.source.agency+(item.raw?.as_of?" · "+item.raw.as_of:"");
    if(item.category) return item.category;
    return "";
  };

  const answer=async raw=>{
    const effective=isShortFollowup(raw)&&state.lastQuery ? state.lastQuery+" "+raw : raw;

    // PBT area requests must resolve against 12 PBT polygons before state/knowledge lookup.
    if(isPbtAreaQuestion(effective)){
      const result=await answerPbtArea(effective);
      state.lastQuery=effective;state.lastTopics=["landdev"];state.lastApps=[];
      return result;
    }

    // Geographic-level guard: "luas Selangor" means the whole state, not
    // Kuala Selangor or another PBT whose name merely contains "Selangor".
    if(isStateAreaQuery(effective)){
      const totalHa=PBT_AREA_REFERENCE.reduce((sum,row)=>sum+row.ha,0);
      state.lastQuery=effective;state.lastTopics=["landdev"];state.lastApps=[];
      return {
        title:"Keluasan Negeri Selangor",
        badge:"JUPEM 2024",
        summary:'Berdasarkan <strong>rujukan JUPEM 2024</strong> yang dibekalkan untuk SUO, keluasan Negeri Selangor ialah <strong>'+areaFormat(totalHa)+' hektar</strong> ('+areaFormat(totalHa/100)+' km²). Angka ini merupakan jumlah keluasan 12 PBT dalam jadual rujukan.',
        insights:[
          {label:"Sumber",title:"JUPEM 2024",text:"Jumlah 12 nilai keluasan PBT dalam jadual rujukan."},
          {label:"Unit",title:"Hektar dan km²",text:"1 km² bersamaan 100 hektar. Angka ini tidak menggantikan geometri sempadan untuk tujuan paparan peta."}
        ],
        sources:["Jabatan Ukur dan Pemetaan Malaysia (JUPEM), 2024 · Jadual keluasan 12 PBT dibekalkan kepada SUO"],
        actions:[{label:"Lihat sempadan dalam 3D GeoPortal",url:"https://selangorurbanobservatory.github.io/3D-Geoportal/"}]
      };
    }

    // Answer precise RSN questions directly instead of showing broad SUO topic matches.
    const intent=norm(effective);
    const isRsn=/\b(rsn|rancangan struktur|rs negeri|rsn selangor)\b/.test(intent);
    const asksGazette=/\b(bila|tarikh|tahun|diwartakan|warta|wartakan|pewartaan|gazette|gazetted)\b/.test(intent);
    const asksRsnPillars=/\b(teras|strategi utama|hala tuju strategik)\b/.test(intent);
    const asksMp34=/\bmp34\b|\bdasar suo\b|\bdasar selangor urban observatory\b/.test(intent);
    if(isRsn && asksGazette){
      state.lastQuery=effective;state.lastTopics=["planning"];state.lastApps=[];
      return {
        title:"Tarikh Pewartaan RS Negeri Selangor 2035 (Pengubahan)",
        badge:"WARTA NEGERI",
        summary:"<strong>RS Negeri Selangor 2035 (Pengubahan) diwartakan pada 19 Mac 2026 melalui Warta No. 1000.</strong>",
        insights:[
          {label:"Kelulusan JPNS",title:"10 Jun 2025",text:"Mesyuarat Jawatankuasa Perancang Negeri Selangor Bil. 3/2025."},
          {label:"Persetujuan PBN",title:"17 Oktober 2025",text:"Majlis Mesyuarat Kerajaan Negeri (MMKN) Ke-30/2025."}
        ],
        sources:["RS Negeri Selangor 2035 (Pengubahan), halaman i (PDF halaman 3), Fakta Persetujuan Diwartakan"],
        actions:[{label:"Rujuk Kamus SUO",url:"knowledge.html"}]
      };
    }
    if(isRsn && asksRsnPillars){
      state.lastQuery=effective;state.lastTopics=["planning"];state.lastApps=[];
      return {
        title:"Tiga Teras RS Negeri Selangor 2035 (Pengubahan)",
        badge:"DASAR RSN",
        summary:"<strong>Teras 1:</strong> Ke Arah Negeri Dinamik, Maju dan Berdaya Saing. <strong>Teras 2:</strong> Ke Arah Negeri Mampan dan Berdaya Tahan. <strong>Teras 3:</strong> Ke Arah Negeri Cekap Sumber dan Berdaya Huni.",
        sources:["RS Negeri Selangor 2035 (Pengubahan), Bab 4 seksyen 4.2, halaman 4-3 hingga 4-5"],
        actions:[{label:"Rujuk Kamus SUO",url:"knowledge.html"}]
      };
    }
    if(asksMp34){
      state.lastQuery=effective;state.lastTopics=["planning"];state.lastApps=[];
      return {
        title:"Dasar MP34 — Pelaksanaan SUO",
        badge:"DASAR RSN",
        summary:"<strong>Dasar MP34</strong> menetapkan pelaksanaan Selangor Urban Observatory (SUO) bagi menyelaras, mengintegrasi dan mengurus data raya peringkat negeri. Inisiatif P1 ialah sistem pemantauan perbandaran bersepadu untuk analitik data raya; P2 ialah pangkalan data dan sistem GIS bersepadu.",
        sources:["RS Negeri Selangor 2035 (Pengubahan), Teras 2, Dasar MP34 (PDF halaman 334)"],
        actions:[{label:"Rujuk Kamus SUO",url:"knowledge.html"}]
      };
    }

    const topics=detectTopics(effective);
    const apps=await getApps();
    const matched=matchApps(apps,effective,topics);
    const facts=await knowledgeSearch(effective,8);
    const actions=[];
    matched.slice(0,4).forEach(a=>{if(a.url)actions.push(appAction(a))});
    if(!actions.length) actions.push({label:"Terokai Aplikasi SUO",url:"index.html#applications"});

    state.lastQuery=effective;state.lastTopics=topics;state.lastApps=matched.slice(0,5);

    if(isNavigation(raw)&&matched[0]){
      return {title:"Aplikasi ditemui",badge:"NAVIGASI",summary:'Saya jumpa aplikasi yang paling hampir dengan permintaan anda: <strong>'+esc(matched[0].title_ms||matched[0].title_en)+'</strong>.',insights:matched.slice(0,3).map(a=>({label:a.group||"Aplikasi",title:a.title_ms,text:a.description_ms||""})),sources:[],actions};
    }

    if(isDiscovery(raw)){
      return {title:"Data Discovery",badge:"DATA DISCOVERY",summary:matched.length?'Saya jumpa <strong>'+matched.length+'</strong> aplikasi/dataset berkaitan dalam ekosistem SUO. Saya susun yang paling relevan dahulu.':'Saya belum jumpa aplikasi yang padan tepat, tetapi anda masih boleh terokai katalog aplikasi SUO.',insights:matched.slice(0,4).map(a=>({label:(a.group||"aplikasi").toUpperCase(),title:a.title_ms,text:a.description_ms||"Aplikasi SUO"})),sources:facts.map(sourceLabel).filter(Boolean),actions};
    }

    if(isComparison(raw)||isInsight(raw)||topics.length>1){
      const insightItems=[];
      facts.slice(0,4).forEach(f=>insightItems.push({label:f.category||"Fakta SUO",title:f.title,text:f.text}));
      if(insightItems.length<4) matched.slice(0,4-insightItems.length).forEach(a=>insightItems.push({label:(a.group||"Aplikasi").toUpperCase(),title:a.title_ms,text:a.description_ms||""}));
      const summary=isComparison(raw)
        ? 'Untuk perbandingan ini, SUO mempunyai beberapa sumber berkaitan. Saya boleh <strong>hubungkan sumber yang relevan</strong>, tetapi saya tidak akan mereka angka yang belum ada dalam Knowledge Base.'
        : 'Saya gabungkan padanan daripada <strong>Knowledge Base</strong> dan <strong>Central Applications Registry</strong> supaya jawapan lebih berasaskan konteks, bukan sekadar satu keyword.';
      return {title:"Urban Intelligence",badge:"CROSS-SOURCE",summary,insights:insightItems,sources:facts.map(sourceLabel).filter(Boolean),actions};
    }

    if(facts.length){
      const top=facts[0];
      const insights=facts.slice(0,4).map(f=>({label:f.category||f.type,title:f.title,text:f.text}));
      return {title:top.title||"Jawapan SUO",badge:"FAKTA & KONTEKS",summary:'<strong>'+esc(top.text)+'</strong>',insights:insights.slice(1),sources:facts.map(sourceLabel).filter(Boolean),actions};
    }

    if(matched.length){
      return {title:"Aplikasi Berkaitan",badge:"APLIKASI SUO",summary:'Saya belum jumpa fakta khusus dalam Knowledge Base, tetapi ada aplikasi SUO yang berkaitan dengan pertanyaan anda.',insights:matched.slice(0,4).map(a=>({label:(a.group||"Aplikasi").toUpperCase(),title:a.title_ms,text:a.description_ms||""})),sources:[],actions};
    }

    return {title:"Belum ada rekod tepat",badge:"KNOWLEDGE GAP",summary:'Saya belum jumpa rekod yang cukup tepat untuk menjawab soalan itu tanpa membuat andaian. Cuba nyatakan <strong>topik, daerah/PBT atau indikator</strong> yang anda mahu semak.',insights:[],sources:[],actions:[{label:"SUO Knowledge Base",url:"knowledge.html"},{label:"Terokai Aplikasi SUO",url:"index.html#applications"}]};
  };

  const run=async q=>{
    q=q.trim();if(!q)return;addUser(q);input.value="";addTyping();
    try{const ans=await answer(q);removeTyping();addAnswer(ans)}
    catch(err){removeTyping();addAnswer({title:"Ralat sementara",badge:"SYSTEM",summary:"Saya tidak dapat membaca sumber SUO buat sementara. Cuba lagi sebentar.",actions:[{label:"Kamus SUO",url:"knowledge.html"}]});console.warn(err)}
  };

  form.addEventListener("submit",e=>{e.preventDefault();run(input.value)});
  document.querySelectorAll("[data-q]").forEach(b=>b.addEventListener("click",()=>run(b.dataset.q)));
  const qp=new URLSearchParams(location.search).get("q"); if(qp){input.value=qp;setTimeout(()=>run(qp),250)}
})();