(()=>{"use strict";
const norm=v=>String(v??"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9\s]/g," ").replace(/\s+/g," ").trim();
const districts=["Kuala Selangor","Hulu Selangor","Kuala Langat","Hulu Langat","Sabak Bernam","Petaling","Klang","Gombak","Sepang"];
const pbts=["MBSA","MBPJ","MBSJ","MBDK","MPS","MPAJ","MPKj","MPSepang","MPKL","MPKS","MPHS","MDSB"];
const knownPlaces=["Petaling Jaya","Shah Alam","Subang Jaya","Ampang Jaya","Selayang","Kajang"];
const aliases={"mpsp":"MPSepang","mpsepang":"MPSepang","mpsj":"MBSJ","mpk":"MBDK","ulu langat":"Hulu Langat","ulu selangor":"Hulu Selangor"};
const contains=(q,p)=>(" "+q+" ").includes(" "+norm(p)+" ");
const match=(q,terms)=>terms.find(x=>contains(q,x))||null;
const yearOf=q=>Number(q.match(/\b20[0-3]\d\b/)?.[0]||0)||null;
const indicatorOf=q=>{
 if(/\b(sekolah|sjkc|sjkt|sra|srai|smk|pendidikan)\b/.test(q))return "sekolah";
 if(/\b(kemiskinan|poverty)\b/.test(q))return "kemiskinan";
 if(/\b(pendapatan|income)\b/.test(q))return "pendapatan";
 if(/\b(gini|ketidaksamaan)\b/.test(q))return "gini";
 if(/\b(tenaga buruh|pengangguran|kadar penyertaan|pekerjaan)\b/.test(q))return "tenaga buruh";
 if(/\b(penduduk|populasi|kepadatan|population)\b/.test(q))return "penduduk";
 if(/\b(luas|keluasan|area)\b/.test(q))return "keluasan";
 return null;
};
const categoryOf=q=>/\b(rendah|sk|sjkc|sjkt)\b/.test(q)?"rendah":/\b(menengah|smk)\b/.test(q)?"menengah":/\b(agama|sra|srai|samt|mits)\b/.test(q)?"agama":null;
let state={location:null,scope:null,indicator:null,year:null,category:null,turns:0};
const reset=()=>{state={location:null,scope:null,indicator:null,year:null,category:null,turns:0};return {...state}};
const snapshot=()=>({...state});
const resolve=raw=>{
 const q=norm(raw);
 if(/^(reset|mula semula|topik baru|clear context)$/.test(q)){reset();return {query:raw,reset:true,context:snapshot()};}
 const namedPbt=match(q,pbts)||match(q,knownPlaces);
 const district=match(q,districts)||match(q,Object.keys(aliases).filter(x=>x.startsWith("ulu ")));
 const explicitDistrict=/\b(daerah|district)\b/.test(q);
 const explicitPbt=/\b(pbt|majlis bandaraya|majlis perbandaran)\b/.test(q)||!!match(q,pbts);
 const givenLocation=explicitDistrict?district:(explicitPbt?namedPbt||district:namedPbt||district);
 const location=aliases[norm(givenLocation)]||givenLocation||null;
 const scope=explicitDistrict?"daerah":explicitPbt?"pbt":(knownPlaces.includes(location)?"pbt":location?"daerah":null);
 const ind=indicatorOf(q);
 const category=categoryOf(q);
 const year=yearOf(q);
 const follow=/\b(tu|itu|tadi|pula|lagi|seterusnya|sebelumnya|sebelum|yang sama|banding|pecahkan|perincikan|further)\b/.test(q);
 const useContext=state.turns>0 && (follow||(!location&&!!ind)||(!ind&&!!location&&/pula|banding/.test(q)));
 let requestedYear=year;
 if(useContext && !year && state.year && /\b(tahun sebelum|tahun lepas|tahun sebelumnya)\b/.test(q))requestedYear=state.year-1;
 const effectiveLocation=location||(useContext?state.location:null);
 const effectiveScope=scope||(useContext?state.scope:null);
 const effectiveInd=ind||(useContext?state.indicator:null);
 const effectiveCategory=category||(useContext?state.category:null);
 const effectiveYear=requestedYear||(useContext?state.year:null);
 let parts=[raw];
 if(useContext){
   if(!location&&effectiveLocation)parts.push(effectiveScope==="pbt"?"PBT "+effectiveLocation:"daerah "+effectiveLocation);
   if(!ind&&effectiveInd)parts.push(effectiveInd==="sekolah"?"sekolah":effectiveInd);
   if(effectiveInd==="sekolah"&&!category&&effectiveCategory)parts.push("sekolah "+effectiveCategory);
   if(!year&&effectiveYear&&effectiveInd!=="sekolah")parts.push(String(effectiveYear));
 }
 const effective=parts.join(" ");
 return {query:effective,original:raw,context:{location:effectiveLocation,scope:effectiveScope,indicator:effectiveInd,category:effectiveCategory,year:effectiveYear},followup:useContext};
};
const commit=result=>{
 if(result?.reset)return;
 const c=result?.context;if(!c)return;
 const hasIntent=!!(c.location||c.indicator);
 if(!hasIntent)return;
 state={...c,turns:state.turns+1};
};
window.SUOConversationContext={resolve,commit,reset,snapshot};
})();