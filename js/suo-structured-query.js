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
  const indicator=/\b(kepadatan|density)\b/.test(n)?"density":/\b(penduduk|populasi|population|population count)\b/.test(n)?"population":/\b(luas|keluasan|area)\b/.test(n)?"area":null;
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
const getBasics=async()=>{if(!window.SUOKnowledge?.load)throw Error("Knowledge Base unavailable");let d=await window.SUOKnowledge.load();return d.selangor};
const source=(db,id)=>db.sources?.find(x=>x.id===id);
const answer=async query=>{
  const v=detect(query);
  if(!v.indicator||!v.scope)return null;
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