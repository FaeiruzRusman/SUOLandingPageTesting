(()=>{"use strict";
const norm=s=>String(s??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
const contains=(q,s)=>(" "+q+" ").includes(" "+s+" ");
const DISTRICTS=[["Petaling",49839.19],["Klang",62359.75],["Gombak",62639.47],["Hulu Langat",83700.86],["Sepang",55147.36],["Kuala Langat",85091.82],["Kuala Selangor",118856.93],["Hulu Selangor",175169.63],["Sabak Bernam",99311.08]];
const PBT=[["MBSA","Majlis Bandaraya Shah Alam",["shah alam"]],["MBPJ","Majlis Bandaraya Petaling Jaya",["petaling jaya"]],["MBSJ","Majlis Bandaraya Subang Jaya",["subang jaya","mpsj"]],["MBDK","Majlis Bandaraya Diraja Klang",["mpk"]],["MPS","Majlis Perbandaran Selayang",["selayang"]],["MPAJ","Majlis Perbandaran Ampang Jaya",["ampang jaya"]],["MPKj","Majlis Perbandaran Kajang",["kajang"]],["MPSepang","Majlis Perbandaran Sepang",["mpsp"]],["MPKL","Majlis Perbandaran Kuala Langat",["mdkl"]],["MPKS","Majlis Perbandaran Kuala Selangor",["mdks"]],["MPHS","Majlis Perbandaran Hulu Selangor",["mdhs"]],["MDSB","Majlis Daerah Sabak Bernam",[]]];
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const fmt=v=>new Intl.NumberFormat("ms-MY",{maximumFractionDigits:2,minimumFractionDigits:2}).format(v);
const demourl="https://selangorurbanobservatory.github.io/Dashboard-Demografi-Sosioekonomi-Negeri-Selangor/";
const isScope=q=>/\b(pbt|pihak berkuasa tempatan|majlis|mbsa|mbpj|mbsj|mbdk|mpkj|mpaj|mpkl|mpks|mphs|mdsb|mpsp|mpsepang|mpk|mpsj)\b/.test(q);
const detect=q=>{
  const n=norm(q);
  const indicator=/\b(gini|ketidaksamaan|inequality)\b/.test(n)?"gini"
    :/\b(median)\b/.test(n)&&/\b(pendapatan|income|isi rumah)\b/.test(n)?"income_median"
    :/\b(purata|mean|average)\b/.test(n)&&/\b(pendapatan|income|isi rumah)\b/.test(n)?"income_mean"
    :/\b(pendapatan|income)\b/.test(n)?"income_median"
    :/\b(kemiskinan relatif|relative poverty)\b/.test(n)?"poverty_relative"
    :/\b(kemiskinan mutlak|absolute poverty)\b/.test(n)?"poverty_absolute"
    :/\b(kemiskinan|poverty|miskin)\b/.test(n)?"poverty_absolute"
    :/\b(kadar pengangguran|unemployment rate)\b/.test(n)?"u_rate"
    :/\b(kadar penyertaan|labour force participation|labor force participation)\b/.test(n)?"p_rate"
    :/\b(nisbah guna tenaga|employment population ratio)\b/.test(n)?"ep_ratio"
    :/\b(luar tenaga buruh|outside labour force)\b/.test(n)?"lf_outside"
    :/\b(penganggur|pengangguran|unemployed|unemployment)\b/.test(n)?"lf_unemployed"
    :/\b(penduduk bekerja|pekerjaan|employed|employment)\b/.test(n)?"lf_employed"
    :/\b(tenaga buruh|labour force|labor force)\b/.test(n)?"lf"
    :/\b(kepadatan|density)\b/.test(n)?"density"
    :/\b(penduduk|populasi|population)\b/.test(n)?"population"
    :/\b(luas|keluasan|area)\b/.test(n)?"area":null;
  const year=(n.match(/\b(20[0-3][0-9])\b/)||[])[1];
  let scope=/\b(daerah|district)\b/.test(n)?"district":isScope(n)?"pbt":null;
  const namedPbt=PBT.find(p=>[p[0],...p[2]].some(s=>contains(n,norm(s))));
  const district=DISTRICTS.filter(d=>contains(n,norm(d[0]))).sort((a,b)=>b[0].length-a[0].length)[0];
  if(!scope) scope=namedPbt?"pbt":district?"district":/\b(selangor|negeri)\b/.test(n)?"state":null;
  let entity=scope==="pbt"?namedPbt:scope==="district"?district:null;
  if(scope==="pbt"&&!entity&&district)entity=PBT.find(p=>p[1].toLowerCase().includes(district[0].toLowerCase()))||null;
  // The word 'klang' by itself defaults to the district, not MBDK.
  return {q:n,indicator,year:year?Number(year):null,scope,entity};
};
const educationUrl="https://selangorurbanobservatory.github.io/Dashboard-Kemudahan-Pendidikan-Negeri-Selangor/";
let schoolDataPromise=null;
const schoolData=()=>schoolDataPromise||(schoolDataPromise=fetch("data/suo-schools-index.json",{cache:"no-cache"}).then(r=>{if(!r.ok)throw Error("School index "+r.status);return r.json()}).catch(e=>{schoolDataPromise=null;throw e}));
const schoolQuestion=q=>/\b(sekolah|school|smk|sjkc|sjkt|sra|srai|samt|mits|sbp|sekolah agama)\b/.test(norm(q));
const schoolReply=async raw=>{
 const q=norm(raw),parsed=detect(raw);
 const listMode=/\b(senarai|list|nama|cari|carikan|apakah|apa|ade|ada|mana)\b/.test(q);
 const countMode=/\b(berapa|bilangan|jumlah|count|banyak)\b/.test(q);
 const district=DISTRICTS.filter(d=>contains(q,norm(d[0]))).sort((a,b)=>b[0].length-a[0].length)[0]?.[0]||null;
 const matchedPbt=PBT.find(p=>[p[0],...p[2]].some(s=>contains(q,norm(s))));
 const explicitPbt=isScope(q);
 const pbt=matchedPbt&&(!district||explicitPbt)?matchedPbt[0]:null;
 const category=/\b(agama|sra|srai|samt|mits)\b/.test(q)?"agama":/\b(menengah|smk|sbp)\b/.test(q)?"menengah":/\b(rendah|sk|sjkc|sjkt)\b/.test(q)?"rendah":null;
 const actions=[{label:"Dashboard Kemudahan Pendidikan",url:educationUrl}];
 try{
   const data=await schoolData();
   const schools=data.schools||[];
   const isNamed=/\b(sekolah|smk|sjkc|sjkt|sra|srai|samt|mits)\b/.test(q)&&!countMode&&!/^(?:senarai|list|nama|cari|carikan|apakah|apa|berapa)\b/.test(q);
   // Unspecified school name: search any non-geographic significant terms rather than return unrelated generic cards.
   const ignore=new Set(["sekolah","school","apa","apakah","yang","ada","di","dalam","negeri","selangor","daerah","pbt","majlis","nama","cari","carikan","berkaitan","tentang","mana","senarai","berapa","bilangan","jumlah","rendah","menengah","agama","dan","di","untuk","lokasi"]);
   const placeWords=new Set(norm(district||"").split(" ").concat(norm(matchedPbt?.[0]||"").split(" ")));
   const nameTerms=q.split(" ").filter(t=>t.length>=3&&!ignore.has(t)&&!placeWords.has(t)&&!["2023","2024","2025","2026"].includes(t));
   const filtered=schools.filter(s=>{
     if(district&&(!pbt||/daerah/.test(q))&&norm(s.district)!==norm(district))return false;
     if(pbt&&norm(s.pbt)!==norm(pbt))return false;
     if(category&&!norm(s.level+" "+s.category).includes(category))return false;
     return true;
   });
   let shown=filtered;
   const nameSearch=/\b(bernama|nama sekolah|sekolah (?:smk|sk|sra|srai|sjkc|sjkt)|smk |sra |srai |sjkc |sjkt )\b/.test(q)||(!district&&!pbt&&!category&&nameTerms.length>0&&!countMode);
   if(nameSearch){
     const cleaned=nameTerms.filter(t=>t!=="smk"&&t!=="sjkc"&&t!=="sjkt"&&t!=="sra"&&t!=="srai");
     if(cleaned.length)shown=shown.filter(s=>cleaned.every(t=>norm(s.name).includes(t)));
   }
   const label=pbt?"PBT "+pbt:district?"Daerah "+district:"Selangor";
   const scopeNote=pbt?"Rekod JAIS tanpa kod PBT tidak dapat diambil kira secara pasti dalam tapisan PBT. ":"";
   const sample=shown.slice(0,15).map((s,i)=>(i+1)+". "+esc(s.name)+" ("+esc(s.district)+", "+esc(s.level)+(s.category?" — "+esc(s.category):"")+")");
   const list=sample.length?"<ol>"+sample.map(s=>"<li>"+s.replace(/^\d+\.\s/,"")+"</li>").join("")+"</ol>":"";
   let summary=countMode
     ?"Terdapat <strong>"+shown.length+" rekod sekolah</strong> untuk <strong>"+esc(label)+"</strong>"+(category?" bagi kategori <strong>"+esc(category)+"</strong>":"")+" dalam indeks semasa SUO. "+scopeNote+"Jumlah ini mewakili rekod dataset, bukan statistik rasmi sekolah keseluruhan."
     :shown.length?"Ditemui <strong>"+shown.length+" rekod sekolah</strong> yang sepadan dengan carian di <strong>"+esc(label)+"</strong>. "+scopeNote+"Berikut "+Math.min(15,shown.length)+" rekod pertama:"+list
     :"Tiada padanan sekolah ditemui dalam indeks SUO bagi kriteria ini. Semak ejaan, tahap geografi atau kategori; tiada rekod rekaan diberikan.";
   return {title:"Kemudahan Pendidikan · "+label,badge:"DATA SEKOLAH SUO",summary,insights:[{label:"Liputan",title:"Indeks GeoJSON",text:"Sekolah umum dan JAIS; deduplikasi nama+daerah. Rekod memerlukan semakan ketepatan/kelengkapan."}],sources:["Dashboard Kemudahan Pendidikan SUO · sekolah_negeri_selangor.geojson dan sekolah_agama_jais_selangor.geojson · indeks "+data.meta.generated_date],actions};
 }catch(e){console.warn("School query failed",e);return {title:"Data sekolah belum dapat dimuatkan",badge:"SUMBER TIDAK TERSEDIA",summary:"Indeks sekolah SUO gagal dibaca. Saya tidak akan menggantikan jawapan dengan anggaran tanpa sumber.",sources:[],actions};}
};
const getBasics=async()=>{if(!window.SUOKnowledge?.load)throw Error("Knowledge Base unavailable");let d=await window.SUOKnowledge.load();return d.selangor};
const source=(db,id)=>db.sources?.find(x=>x.id===id);
const answer=async query=>{
  const v=detect(query);
  if(schoolQuestion(query))return schoolReply(query);
  if(!v.indicator||!v.scope)return null;
  // Query observed socioeconomic series before generic fact matching.
  const SOCIO={
    income_mean:{group:"income",title:"Purata pendapatan isi rumah",unit:"RM sebulan"},
    income_median:{group:"income",title:"Median pendapatan isi rumah",unit:"RM sebulan"},
    poverty_absolute:{group:"poverty",title:"Insiden kemiskinan mutlak",unit:"%"},
    poverty_relative:{group:"poverty",title:"Insiden kemiskinan relatif",unit:"%"},
    gini:{group:"inequality",title:"Pekali Gini",unit:"pekali"},
    lf:{group:"labour",title:"Tenaga buruh",unit:"ribu orang"},
    lf_employed:{group:"labour",title:"Penduduk bekerja",unit:"ribu orang"},
    lf_unemployed:{group:"labour",title:"Penduduk menganggur",unit:"ribu orang"},
    lf_outside:{group:"labour",title:"Luar tenaga buruh",unit:"ribu orang"},
    p_rate:{group:"labour",title:"Kadar penyertaan tenaga buruh",unit:"%"},
    u_rate:{group:"labour",title:"Kadar pengangguran",unit:"%"},
    ep_ratio:{group:"labour",title:"Nisbah guna tenaga kepada penduduk",unit:"%"}
  };
  if(SOCIO[v.indicator]){
    const spec=SOCIO[v.indicator];
    const actions=[{label:"Dashboard Demografi & Sosioekonomi",url:demourl}];
    const title=spec.title+" · "+(v.entity?.[0]||v.scope||"Selangor");
    const unavailable=explanation=>({title,badge:"DATA TIDAK TERSEDIA",summary:explanation,sources:["SUO · Rekod sosioekonomi mengikut daerah (sumber CSV DOSM)"],actions});
    if(v.scope!=="district"||!v.entity)
      return unavailable("Indikator <strong>"+esc(spec.title)+"</strong> dalam dataset ini tersedia pada peringkat <strong>daerah pentadbiran</strong> sahaja. Sila nyatakan satu daripada 9 daerah Selangor; data tidak akan diagregatkan menjadi angka negeri atau PBT tanpa metodologi yang sesuai.");
    try{
      const response=await fetch("data/district-socioeconomic-suo.json",{cache:"no-cache"});
      if(!response.ok)throw Error("Socioeconomic dataset HTTP "+response.status);
      const dataset=await response.json();
      const eligible=dataset.records.filter(row=>row.group===spec.group&&norm(row.district)===norm(v.entity[0])&&Number.isFinite(row[v.indicator]));
      const availableYears=[...new Set(eligible.map(row=>row.year))].sort((a,b)=>a-b);
      const chosenYear=v.year||availableYears[availableYears.length-1];
      const row=eligible.find(row=>row.year===chosenYear);
      if(!row)return unavailable("Tiada nilai <strong>"+esc(spec.title)+"</strong> bagi <strong>Daerah "+esc(v.entity[0])+"</strong>"+(v.year?" pada "+v.year:"")+". Tahun yang tersedia: "+(availableYears.join(", ")||"tiada")+". Tiada nilai interpolasi atau angka andaian digunakan.");
      const value=row[v.indicator];
      const digits=v.indicator==="gini"?3:spec.unit==="ribu orang"?1:spec.unit==="%"?1:0;
      const display=new Intl.NumberFormat("ms-MY",{minimumFractionDigits:digits,maximumFractionDigits:digits}).format(value);
      const formattedValue=spec.unit==="RM sebulan"?"RM"+display:display+" "+spec.unit;
      const note=spec.unit==="ribu orang"?" (bersamaan kira-kira "+new Intl.NumberFormat("ms-MY").format(Math.round(value*1000))+" orang; sumber dalam ribu orang).":".";
      return {
        title:spec.title+" · Daerah "+v.entity[0],badge:"SOSIOEKONOMI · "+chosenYear,
        summary:"<strong>"+esc(spec.title)+"</strong> bagi <strong>Daerah "+esc(v.entity[0])+"</strong> pada <strong>"+chosenYear+"</strong> ialah <strong>"+esc(formattedValue)+"</strong>"+note,
        insights:[{label:"Sumber berstruktur",title:spec.group.toUpperCase(),text:"Data daerah daripada fail CSV Dashboard Demografi SUO; nilai dikekalkan mengikut tahun dan unit sumber."}],
        sources:["Dashboard Demografi & Sosioekonomi SUO · "+dataset.meta.files.find(file=>file.includes(spec.group==="income"?"hh_income":spec.group==="poverty"?"hh_poverty":spec.group==="inequality"?"hh_inequality":"lfs_district"))+" · rujukan DOSM"],actions
      };
    }catch(err){console.warn("SUO socioeconomic dataset",err);return unavailable("Dataset sosioekonomi gagal dimuatkan buat sementara. Cuba lagi selepas rangkaian pulih.");}
  }
  // Preserve the existing complete 12-PBT list response for generic area queries.
  if(v.scope==="pbt"&&!v.entity&&v.indicator==="area")return null;
  const label=v.scope==="district"?"Daerah "+(v.entity?.[0]||"Selangor"):v.scope==="pbt"?(v.entity?.[0]||"PBT Selangor"):"Negeri Selangor";
  const appAction=[{label:"Dashboard Demografi & Sosioekonomi",url:demourl}];
  let db;try{db=await getBasics()}catch(err){console.warn(err);return {title:label,badge:"SUMBER TIDAK TERSEDIA",summary:"Knowledge Base tidak dapat dimuatkan. Tiada angka alternatif diberikan.",sources:[],actions:appAction};}
  const figures=db.figures||[];
  const fact=id=>figures.find(f=>f.id===id);
  const result=(title,summary,f,sources,actions)=>({title,badge:"PERTANYAAN BERSTRUKTUR",summary,insights:[],sources:sources||[f?.source_id?((source(db,f.source_id)?.agency||"Sumber")+" · "+(f.as_of||"")):"Sumber tidak dinyatakan"],actions:actions||[]});
  const missing=(reason)=>result(label+" · "+v.indicator,"Data <strong>"+esc(v.indicator==="area"?"keluasan":v.indicator==="density"?"kepadatan penduduk":"jumlah penduduk")+"</strong> untuk <strong>"+esc(label)+"</strong>"+(v.year?" bagi tahun "+v.year:"")+" belum disahkan dalam sumber SUO. "+reason,null,["Knowledge Base SUO · rekod daerah/PBT mengikut tahun belum tersedia"],appAction);
  if(v.indicator==="area"){
    if(v.scope==="district"){
      if(!v.entity)return missing("Nyatakan nama daerah.");
      if(v.year&&v.year!==2023)return missing("Rujukan keluasan daerah dalam RSN menggunakan data 2023, bukan tahun yang diminta.");
      return result("Keluasan Daerah "+v.entity[0],"Keluasan kawasan kajian <strong>Daerah "+esc(v.entity[0])+"</strong> ialah <strong>"+fmt(v.entity[1])+" hektar</strong> ("+fmt(v.entity[1]/100)+" km²). Rujukan ini tidak sama dengan keluasan PBT.",null,["RS Negeri Selangor 2035 (Pengubahan), Seksyen 1.2, halaman 1-5 · PLANMalaysia Selangor 2023"]);
    }
    const f=v.scope==="pbt"?figures.find(row=>row.id.startsWith("PBT-AREA-")&&norm(row.title).includes(norm(v.entity?.[0]||"UNMATCHED"))):fact("SGR-003");if(!f||v.year&&v.year!==2024)return missing("Rujukan keluasan ini adalah JUPEM 2024.");
    const ha=Number(f.value)*100;
    return result("Keluasan "+label,"Berdasarkan JUPEM 2024, keluasan <strong>"+esc(label)+"</strong> ialah <strong>"+fmt(ha)+" hektar</strong> ("+fmt(f.value)+" km²).",f,["JUPEM 2024 · Jadual keluasan 12 PBT yang dibekalkan kepada SUO"]);
  }
  if(v.scope==="pbt")return missing("Statistik penduduk daerah tidak boleh ditukar menjadi penduduk PBT.");
  if(v.scope==="district"){
    if(!v.entity)return missing("Nyatakan nama daerah.");
    const district=v.entity[0];
    if(v.indicator==="population"){
      try{
        const response=await fetch("data/district-population-suo.json",{cache:"no-cache"});
        if(!response.ok)throw Error("Population dataset HTTP "+response.status);
        const dataset=await response.json();
        const years=(dataset.records||[]).filter(r=>norm(r.district)===norm(district)).map(r=>r.year);
        const year=v.year||Math.max(...years);
        const row=(dataset.records||[]).find(r=>norm(r.district)===norm(district)&&r.year===year);
        if(!row)return missing("Siri data tersedia bagi tahun 2020 hingga 2026 sahaja.");
        const population=Math.round(row.thousand*1000);
        return result("Penduduk Daerah "+district,"Jumlah penduduk <strong>Daerah "+esc(district)+"</strong> pada <strong>"+year+"</strong> dianggarkan <strong>"+new Intl.NumberFormat("ms-MY").format(population)+" orang</strong> (nilai sumber: "+row.thousand.toFixed(1)+" ribu orang).",null,["Dashboard Demografi & Sosioekonomi SUO · dataset penduduk daerah daripada DOSM · "+year+" · jantina/umur/etnik keseluruhan"],appAction);
      }catch(err){console.warn("SUO district population:",err);return missing("Fail data penduduk daerah tidak dapat dimuatkan ketika ini.");}
    }
    let f=null;
    if(v.indicator==="density"&&district==="Petaling")f=fact("SGR-018");
    if(v.indicator==="population"&&district==="Sabak Bernam")f=fact("SGR-020");
    if(v.indicator==="density"&&district==="Sabak Bernam")f=fact("SGR-021");
    if(v.indicator==="population"&&district==="Petaling"&&(!v.year||v.year===2025)){
      const base=fact("SGR-017");
      return result("Penduduk Daerah Petaling","Anggaran penduduk <strong>Daerah Petaling</strong> pada <strong>2025</strong> ialah kira-kira <strong>2,370,600 orang</strong>. Ini anggaran, bukan angka Banci 2020.",base,["DOSM / OpenDOSM · Anggaran Penduduk Mengikut Daerah Pentadbiran 2025"],appAction);
    }
    if(!f||v.year&&Number(String(f.as_of).match(/20\d\d/)?.[0])!==v.year)return missing("Semak Dashboard Demografi untuk siri data terkini.");
    return result((v.indicator==="density"?"Kepadatan":"Penduduk")+" Daerah "+district,"<strong>"+esc(district)+"</strong>: <strong>"+new Intl.NumberFormat("ms-MY").format(f.value)+" "+(v.indicator==="density"?"orang/km²":"orang")+"</strong> ("+esc(f.as_of)+").",f,null,appAction);
  }
  const f=v.indicator==="population"?fact(v.year===2020?"SGR-007":"SGR-010"):v.indicator==="density"?fact("SGR-008"):null;
  if(!f||v.year&&Number(String(f.as_of).match(/20\d\d/)?.[0])!==v.year)return missing("Tahun tersedia berbeza daripada tahun yang diminta.");
  return result((v.indicator==="population"?"Jumlah Penduduk":"Kepadatan Penduduk")+" Selangor","<strong>"+new Intl.NumberFormat("ms-MY").format(f.value)+" "+esc(f.unit)+"</strong> ("+esc(f.as_of)+").",f,null,appAction);
};
window.SUOStructuredQuery={detect,answer};
})();