(() => {
  const header = document.querySelector('.v7-header');
  const menu = document.querySelector('.v7-menu');
  const lang = document.querySelector('.v7-lang');
  const body = document.body;
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
  menu?.addEventListener('click', () => body.classList.toggle('v7-mobile-open'));

  document.querySelectorAll('.v7-links a').forEach(a => a.addEventListener('click',()=>body.classList.remove('v7-mobile-open')));

  const applyLang = (code) => {
    document.documentElement.lang = code === 'en' ? 'en' : 'ms';
    document.querySelectorAll('[data-ms][data-en]').forEach(el => {
      el.textContent = el.dataset[code] || el.textContent;
    });
    document.querySelectorAll('[data-placeholder-ms][data-placeholder-en]').forEach(el => {
      el.placeholder = code === 'en' ? el.dataset.placeholderEn : el.dataset.placeholderMs;
    });
    document.title = code === 'en'
      ? 'Selangor Urban Observatory | Urban Intelligence for a Smarter Selangor'
      : 'Selangor Urban Observatory | Kecerdasan Bandar untuk Selangor Lebih Pintar';
    if(lang) lang.textContent = code === 'en' ? 'EN | BM' : 'BM | EN';
    localStorage.setItem('suo-lang',code);
  };
  let code = localStorage.getItem('suo-lang') || 'ms';
  applyLang(code);
  lang?.addEventListener('click',()=>{code = code === 'ms' ? 'en' : 'ms'; applyLang(code)});

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
  }), {threshold:.12});
  document.querySelectorAll('.v7-reveal').forEach(el=>io.observe(el));

  document.querySelectorAll('.v7-theme').forEach(btn => btn.addEventListener('click',()=>{
    document.querySelectorAll('.v7-theme').forEach(x=>x.classList.remove('active'));
    btn.classList.add('active');
  }));

  const ask = document.querySelector('#v7AskBtn');
  const input = document.querySelector('#v7AskInput');
  const go = () => {
    const q = (input?.value || '').trim();
    location.href = q ? 'ai-assistant.html?q='+encodeURIComponent(q) : 'ai-assistant.html';
  };
  ask?.addEventListener('click',go);
  input?.addEventListener('keydown',e=>{if(e.key==='Enter')go()});


  const mapSources = {
    hero: "https://faeiruzrusman.github.io/selangor-3d-map/data/pentadbiran/sempadan_pbt_selangor_2024.geojson",
    spatial: "https://faeiruzrusman.github.io/selangor-3d-map/data/pentadbiran/sempadan_daerah_selangor.geojson"
  };

  const collectPoints = (geom) => {
    const out = [];
    const walk = (x) => {
      if (!Array.isArray(x)) return;
      if (typeof x[0] === "number" && typeof x[1] === "number") out.push(x);
      else x.forEach(walk);
    };
    walk(geom?.coordinates);
    return out;
  };

  const ringsForGeometry = (geom) => {
    if (!geom) return [];
    if (geom.type === "Polygon") return geom.coordinates;
    if (geom.type === "MultiPolygon") return geom.coordinates.flat();
    return [];
  };

  const renderRealSelangorMap = async (svgId, url, opts={}) => {
    const svg = document.getElementById(svgId);
    if (!svg) return;
    try {
      const res = await fetch(url, {cache:"force-cache"});
      if (!res.ok) throw new Error("GeoJSON "+res.status);
      const data = await res.json();
      const all = data.features.flatMap(f => collectPoints(f.geometry));
      if (!all.length) throw new Error("No coordinates");
      const xs=all.map(p=>p[0]), ys=all.map(p=>p[1]);
      const minX=Math.min(...xs), maxX=Math.max(...xs), minY=Math.min(...ys), maxY=Math.max(...ys);
      const W=480,H=520,pad=30;
      const sx=(W-pad*2)/(maxX-minX), sy=(H-pad*2)/(maxY-minY), s=Math.min(sx,sy);
      const contentW=(maxX-minX)*s, contentH=(maxY-minY)*s;
      const ox=(W-contentW)/2, oy=(H-contentH)/2;
      const project=([x,y])=>[ox+(x-minX)*s, H-(oy+(y-minY)*s)];
      const NS="http://www.w3.org/2000/svg";
      svg.replaceChildren();

      data.features.forEach((f,i)=>{
        const path=document.createElementNS(NS,"path");
        const d=ringsForGeometry(f.geometry).map(ring => ring.map((pt,j)=>{
          const [x,y]=project(pt); return (j?"L":"M")+x.toFixed(2)+" "+y.toFixed(2);
        }).join(" ")+" Z").join(" ");
        path.setAttribute("d",d);
        path.setAttribute("fill-rule","evenodd");
        path.setAttribute("class","real-polygon");
        path.setAttribute("fill", opts.district ? (i%2 ? "#E9A8B3":"#F2C4CB") : (i%3===0?"#8F0D23":i%3===1?"#B51230":"#D22442"));
        path.setAttribute("stroke",opts.district?"#C8102E":"rgba(255,255,255,.78)");
        path.setAttribute("stroke-width",opts.district?"1.35":"1.1");
        const title=document.createElementNS(NS,"title");
        title.textContent=f.properties?.web_name || f.properties?.NAMA_PBT || f.properties?.DAERAH || "Selangor";
        path.appendChild(title);
        svg.appendChild(path);

        const pts=collectPoints(f.geometry);
        if(pts.length){
          const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length;
          const cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;
          const [px,py]=project([cx,cy]);
          if(!opts.district || opts.labels){
            const node=document.createElementNS(NS,"circle");
            node.setAttribute("cx",px);node.setAttribute("cy",py);node.setAttribute("r",opts.district?3.1:4.2);node.setAttribute("class","real-node");
            svg.appendChild(node);
          }
        }
      });
    } catch(err) {
      console.warn("SUO real map preview fallback:",err);
      svg.innerHTML='<text x="240" y="260" text-anchor="middle" fill="#8F0D23" font-size="13">Peta Selangor sedang dimuatkan</text>';
    }
  };

  renderRealSelangorMap("v7HeroMap",mapSources.hero,{district:false});
  renderRealSelangorMap("v7SpatialMap",mapSources.spatial,{district:true,labels:false});
})();