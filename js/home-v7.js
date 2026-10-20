(() => {
  const header = document.querySelector('.v7-header');
  const menu = document.querySelector('.v7-menu');
  const lang = document.querySelector('.v7-lang');
  const body = document.body;
  const onScroll = () => header?.classList.toggle('scrolled', window.scrollY > 24);
  onScroll(); window.addEventListener('scroll', onScroll, {passive:true});
  menu?.addEventListener('click', () => {
    const open = body.classList.toggle('v7-mobile-open');
    menu.setAttribute('aria-expanded', String(open));
    if(!open){
      document.getElementById("v7ApplicationsNav")?.classList.remove("open");
      document.querySelector(".v7-nav-drop-toggle")?.setAttribute("aria-expanded","false");
    }
  });

  document.querySelectorAll('.v7-links a').forEach(a => a.addEventListener('click',()=>{
    body.classList.remove('v7-mobile-open');
    menu?.setAttribute('aria-expanded','false');
  }));

  // v7.19.5: primary navigation + Applications dropdown.
  const applicationsNav=document.getElementById("v7ApplicationsNav");
  const applicationsToggle=applicationsNav?.querySelector(".v7-nav-drop-toggle");
  // Flyout links are registry-rendered asynchronously; use event delegation.
  const primaryNavLinks=Array.from(document.querySelectorAll('#v7PrimaryNav > a[href^="#"]'));
  const primarySectionIds=["home","spatial","ecosystem","applications","roadmap","contact"];
  const primarySections=primarySectionIds
    .map(id=>document.getElementById(id))
    .filter(Boolean);

  const setApplicationsOpen=(open)=>{
    applicationsNav?.classList.toggle("open",open);
    applicationsToggle?.setAttribute("aria-expanded",String(open));
  };

  applicationsToggle?.addEventListener("click",(e)=>{
    e.stopPropagation();
    setApplicationsOpen(!applicationsNav?.classList.contains("open"));
  });

  applicationsNav?.addEventListener("click",(e)=>{
    const parent=e.target.closest(".v7-nav-flyout-parent");
    if(parent && window.matchMedia("(max-width:1000px)").matches){
      e.preventDefault();
      const item=parent.closest(".v7-nav-flyout-item");
      const open=!item?.classList.contains("submenu-open");
      applicationsNav.querySelectorAll(".v7-nav-flyout-item.submenu-open").forEach(x=>x.classList.remove("submenu-open"));
      item?.classList.toggle("submenu-open",open);
      return;
    }

    if(e.target.closest(".v7-nav-side-menu a")){
      setApplicationsOpen(false);
      body.classList.remove("v7-mobile-open");
      menu?.setAttribute("aria-expanded","false");
    }
  });

  document.addEventListener("click",(e)=>{
    if(applicationsNav && !applicationsNav.contains(e.target)) setApplicationsOpen(false);
  });

  primaryNavLinks.forEach(link=>link.addEventListener("click",()=>{
    body.classList.remove("v7-mobile-open");
    menu?.setAttribute("aria-expanded","false");
    const id=link.getAttribute("href")?.slice(1);
    if(id) setPrimaryNavActive(id);
  }));

  applicationsNav?.addEventListener("keydown",(e)=>{
    if(e.key==="Escape"){
      setApplicationsOpen(false);
      applicationsToggle?.focus();
    }
  });

  const setPrimaryNavActive=(id)=>{
    primaryNavLinks.forEach(link=>{
      const active=link.getAttribute("href")==="#"+id;
      link.classList.toggle("active",active);
      if(active) link.setAttribute("aria-current","page");
      else link.removeAttribute("aria-current");
    });

    const applicationsActive=id==="applications";
    applicationsToggle?.classList.toggle("active",applicationsActive);
    if(applicationsActive) applicationsToggle?.setAttribute("aria-current","page");
    else applicationsToggle?.removeAttribute("aria-current");
  };

  let navSpyTick=false;
  const syncPrimaryNav=()=>{
    navSpyTick=false;
    if(!primarySections.length) return;

    const headerOffset=(header?.offsetHeight || 72)+90;
    const marker=window.scrollY+headerOffset;
    let current=primarySections[0].id;

    primarySections.forEach(section=>{
      if(section.offsetTop<=marker) current=section.id;
    });

    const atBottom=(window.innerHeight+window.scrollY)>=document.documentElement.scrollHeight-6;
    if(atBottom && document.getElementById("contact")) current="contact";

    setPrimaryNavActive(current);
  };

  const queuePrimaryNavSync=()=>{
    if(navSpyTick) return;
    navSpyTick=true;
    window.requestAnimationFrame(syncPrimaryNav);
  };

  syncPrimaryNav();
  window.addEventListener("scroll",queuePrimaryNavSync,{passive:true});
  window.addEventListener("resize",queuePrimaryNavSync,{passive:true});


  // v7.8.2: use browser-native iframe lazy loading for reliable previews.
  // We no longer defer src via IntersectionObserver because it can fail to
  // initialize previews inside complex card layouts.
  const previewFrames = Array.from(document.querySelectorAll('iframe[loading="lazy"]'));

  const previewText = (state) => {
    const en = document.documentElement.lang === "en";
    if (state === "slow") return en
      ? ["Preview is taking longer to load","You can still open the application from its card or launch button."]
      : ["Pratonton mengambil masa untuk dimuatkan","Aplikasi masih boleh dibuka melalui kad atau butang pelancaran."];
    return en
      ? ["Preview is temporarily unavailable","Open the application directly to continue."]
      : ["Pratonton tidak tersedia buat sementara","Buka aplikasi secara terus untuk meneruskan."];
  };

  const ensurePreviewState = (frame) => {
    const host = frame?.parentElement;
    if (!host) return null;
    let state = host.querySelector(":scope > .v7-preview-state");
    if (!state) {
      state = document.createElement("div");
      state.className = "v7-preview-state";
      state.hidden = true;
      state.setAttribute("role","status");
      state.setAttribute("aria-live","polite");
      host.appendChild(state);
    }
    return state;
  };

  const showPreviewState = (frame, kind) => {
    const state = ensurePreviewState(frame);
    if (!state) return;
    const [title,copy] = previewText(kind);
    state.className = "v7-preview-state " + (kind === "slow" ? "is-warning" : "is-error");
    state.innerHTML = "<div><strong>"+title+"</strong><span>"+copy+"</span><span class=\"v7-preview-mini\">SUO</span></div>";
    state.hidden = false;
  };

  previewFrames.forEach(frame => {
    let settled = false;
    const slowTimer = window.setTimeout(() => {
      // Only warn if the frame has entered/approached the viewport.
      const rect = frame.getBoundingClientRect();
      if (!settled && rect.top < window.innerHeight + 300 && rect.bottom > -300) {
        showPreviewState(frame,"slow");
      }
    }, 15000);

    frame.addEventListener("load", () => {
      settled = true;
      window.clearTimeout(slowTimer);
      const state = ensurePreviewState(frame);
      if (state) state.hidden = true;
    }, { once:true });

    frame.addEventListener("error", () => {
      settled = true;
      window.clearTimeout(slowTimer);
      showPreviewState(frame,"error");
    }, { once:true });
  });

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
    const metaDescription=document.querySelector('meta[name="description"]');
    if(metaDescription) metaDescription.content = code === 'en'
      ? "Selangor Urban Observatory — an integrated platform for urban data, spatial analytics and digital applications in Selangor."
      : "Selangor Urban Observatory — platform bersepadu data bandar, analitik spatial dan aplikasi digital Negeri Selangor.";
    if(lang) lang.textContent = code === 'en' ? 'EN | BM' : 'BM | EN';
    localStorage.setItem('suo-lang',code);
  };
  let code = localStorage.getItem('suo-lang') || 'ms';
  applyLang(code);
  lang?.addEventListener('click',()=>{code = code === 'ms' ? 'en' : 'ms'; applyLang(code); window.setTimeout(()=>{ if(typeof renderSearch === "function" && searchPanel && !searchPanel.hidden) renderSearch(searchInput?.value || ""); if(typeof applyTheme === "function"){ const selected=document.querySelector(".v7-theme.active[data-theme]"); if(selected) applyTheme(selected.dataset.theme); } if(window.SUOApps) window.SUOApps.refreshLanguage().catch(()=>{}); },0)});

  const io = new IntersectionObserver(entries => entries.forEach(e => {
    if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); }
  }), {threshold:.12});
  document.querySelectorAll('.v7-reveal').forEach(el=>io.observe(el));
  document.addEventListener("suo:applications-rendered",()=>{
    document.querySelectorAll(".registry-app-card.v7-reveal:not(.visible)").forEach(el=>io.observe(el));
  });

  // Theme controls are wired below with real spatial overlays and linked applications.

  const ask = document.querySelector('#v7AskBtn');
  const input = document.querySelector('#v7AskInput');
  const go = () => {
    const q = (input?.value || '').trim();
    location.href = q ? 'ai-assistant.html?q='+encodeURIComponent(q) : 'ai-assistant.html';
  };
  ask?.addEventListener('click',go);
  input?.addEventListener('keydown',e=>{if(e.key==='Enter')go()});




  const themeCatalog = {
    housing:{
      eyebrow:{ms:"PERUMAHAN",en:"HOUSING"},
      title:{ms:"Perumahan",en:"Housing"},
      desc:{ms:"Perumahan umum dan perumahan mampu milik dihimpunkan dalam satu dimensi untuk perbandingan dan pemantauan.",en:"General and affordable housing are brought together in one dimension for comparison and monitoring."},
      primary:{ms:"Buka Dashboard Utama ↗",en:"Open Main Dashboard ↗",url:"https://geospatialpms-glitch.github.io/Dashboard-Perumahan-Negeri-Selangor/"},
      secondary:{ms:"Lihat Semua Aplikasi →",en:"View All Applications →",url:"#dashboard-tematik"},
      overlay:null
    },
    economy:{
      eyebrow:{ms:"EKONOMI",en:"ECONOMY"},
      title:{ms:"Ekonomi",en:"Economy"},
      desc:{ms:"Terokai aset dan aktiviti ekonomi melalui Geopark serta pelancongan untuk memahami potensi wilayah dan pembangunan ekonomi Negeri Selangor.",en:"Explore economic assets and activity through Geopark and tourism to understand regional potential and Selangor's economic development."},
      primary:{ms:"Buka Geopark ↗",en:"Open Geopark ↗",url:"https://geospatialpms-glitch.github.io/Dashboard-Geopark-Gombak-Hulu-Langat/"},
      secondary:{ms:"Lihat Semua Aplikasi →",en:"View All Applications →",url:"#dashboard-tematik"},
      overlay:null
    },
    industry:{
      eyebrow:{ms:"INDUSTRI",en:"INDUSTRY"},
      title:{ms:"Industri",en:"Industry"},
      desc:{ms:"Terokai taburan industri dan kawasan perindustrian Negeri Selangor bagi menyokong pemantauan pembangunan serta perancangan spatial.",en:"Explore the distribution of industries and industrial areas across Selangor to support development monitoring and spatial planning."},
      primary:{ms:"Buka Perindustrian ↗",en:"Open Industry ↗",url:"https://geospatialpms-glitch.github.io/Perindustrian-Negeri-Selangor/"},
      secondary:{ms:"Lihat Semua Aplikasi →",en:"View All Applications →",url:"#dashboard-tematik"},
      overlay:null
    },
    facilities:{
      eyebrow:{ms:"KEMUDAHAN & PERKHIDMATAN",en:"FACILITIES & SERVICES"},
      title:{ms:"Kemudahan",en:"Facilities"},
      desc:{ms:"Terokai kesihatan, keselamatan, pendidikan dan kemudahan berkaitan dalam satu paparan tematik.",en:"Explore health, safety, education and related facilities within one thematic view."},
      primary:{ms:"Buka Kemudahan Pendidikan ↗",en:"Open Education Facilities ↗",url:"https://faeiruzrusman.github.io/Dashboard-Kemudahan-Pendidikan-Selangor/"},
      secondary:{ms:"Buka 3D GeoPortal ↗",en:"Open 3D GeoPortal ↗",url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=health"},
      overlay:"health"
    },
    environment:{
      eyebrow:{ms:"ALAM SEKITAR",en:"ENVIRONMENT"},
      title:{ms:"Alam Sekitar",en:"Environment"},
      desc:{ms:"Satukan KSAS, tanah lapang dan geopark untuk memahami aset alam sekitar, rekreasi dan sensitiviti spatial.",en:"Bring together environmentally sensitive areas, open space and geopark assets to understand environmental and spatial sensitivities."},
      primary:{ms:"Buka KSAS ↗",en:"Open KSAS ↗",url:"https://geospatialpms-glitch.github.io/KSAS-Negeri-Selangor/"},
      secondary:{ms:"Buka 3D GeoPortal ↗",en:"Open 3D GeoPortal ↗",url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=environment"},
      overlay:null
    },
    planning:{
      eyebrow:{ms:"PERANCANGAN & TADBIR URUS",en:"PLANNING & GOVERNANCE"},
      title:{ms:"Perancangan",en:"Planning"},
      desc:{ms:"Gabungkan guna tanah, Lembaga Rayuan, SIA, MURNInets dan RSN Selangor 2035 untuk konteks perancangan yang lebih lengkap.",en:"Combine land use, the Appeal Board, SIA, MURNInets and the Selangor State Structure Plan 2035 for a fuller planning context."},
      primary:{ms:"Buka Guna Tanah ↗",en:"Open Land Use ↗",url:"https://sismaps.jpbdselangor.gov.my/dashboard"},
      secondary:{ms:"Buka RSN Selangor 2035 ↗",en:"Open RSN Selangor 2035 ↗",url:"https://arcg.is/11Sbea"},
      overlay:null
    },
    community:{
      eyebrow:{ms:"DESA & KOMUNITI",en:"RURAL & COMMUNITY"},
      title:{ms:"Desa & Komuniti",en:"Rural & Community"},
      desc:{ms:"Pusat SMARTDesa, dashboard SMARTDesa dan StoryMaps komuniti dihimpunkan untuk memahami pembangunan setempat.",en:"SMARTDesa centres, the SMARTDesa dashboard and community StoryMaps are combined to understand local development."},
      primary:{ms:"Buka Pusat SMARTDesa ↗",en:"Open SMARTDesa Centres ↗",url:"https://geospatialpms-glitch.github.io/STORY-MAP-PUSAT-SMART-DESA-NEGERI-SELANGOR/"},
      secondary:{ms:"Buka SMARTDesa ↗",en:"Open SMARTDesa ↗",url:"https://sismaps.jpbdselangor.gov.my/smartdesa"},
      overlay:null
    },
    demographics:{
      eyebrow:{ms:"DEMOGRAFI & SOSIOEKONOMI",en:"DEMOGRAPHICS & SOCIOECONOMICS"},
      title:{ms:"Demografi & Sosioekonomi",en:"Demographics & Socioeconomics"},
      desc:{ms:"Terokai profil penduduk, isi rumah, pendapatan, kemiskinan, tenaga buruh dan indikator sosioekonomi Negeri Selangor.",en:"Explore population, households, income, poverty, labour force and socioeconomic indicators across Selangor."},
      primary:{ms:"Buka Dashboard Demografi ↗",en:"Open Demographics Dashboard ↗",url:"https://faeiruzrusman.github.io/Dashboard-Demografi-Sosioekonomi-Selangor/"},
      secondary:{ms:"Lihat Semua Aplikasi →",en:"View All Applications →",url:"#dashboard-tematik"},
      overlay:null
    },
    infrastructure:{
      eyebrow:{ms:"INFRASTRUKTUR & UTILITI",en:"INFRASTRUCTURE & UTILITIES"},
      title:{ms:"Infrastruktur & Utiliti",en:"Infrastructure & Utilities"},
      desc:{ms:"Himpunkan maklumat infrastruktur asas, telekomunikasi dan utiliti untuk menyokong perancangan kapasiti serta pembangunan negeri.",en:"Bring together core infrastructure, telecommunications and utility information to support capacity planning and state development."},
      primary:{ms:"Buka 3D GeoPortal ↗",en:"Open 3D GeoPortal ↗",url:"https://faeiruzrusman.github.io/selangor-3d-map/"},
      secondary:{ms:"Buka SISMAPS ↗",en:"Open SISMAPS ↗",url:"https://sismaps.jpbdselangor.gov.my/index"},
      overlay:null
    },
    resilience:{
      eyebrow:{ms:"RISIKO & DAYA TAHAN",en:"RISK & RESILIENCE"},
      title:{ms:"Risiko & Daya Tahan",en:"Risk & Resilience"},
      desc:{ms:"Gabungkan maklumat banjir, kawasan sensitif, keselamatan dan indikator bandar mampan untuk menyokong perancangan bandar yang lebih berdaya tahan.",en:"Combine flood, sensitive-area, safety and sustainable-city information to support more resilient urban planning."},
      primary:{ms:"Buka 3D GeoPortal ↗",en:"Open 3D GeoPortal ↗",url:"https://faeiruzrusman.github.io/selangor-3d-map/"},
      secondary:{ms:"Buka KSAS ↗",en:"Open KSAS ↗",url:"https://geospatialpms-glitch.github.io/KSAS-Negeri-Selangor/"},
      overlay:null
    },
    landdev:{
      eyebrow:{ms:"TANAH & PEMBANGUNAN",en:"LAND & DEVELOPMENT"},
      title:{ms:"Tanah & Pembangunan",en:"Land & Development"},
      desc:{ms:"Terokai guna tanah, kawalan pembangunan dan maklumat spatial berkaitan tanah untuk memahami corak serta tekanan pembangunan Negeri Selangor.",en:"Explore land use, development control and land-related spatial information to understand development patterns and pressures across Selangor."},
      primary:{ms:"Buka Guna Tanah ↗",en:"Open Land Use ↗",url:"https://sismaps.jpbdselangor.gov.my/dashboard"},
      secondary:{ms:"Buka SISMAPS ↗",en:"Open SISMAPS ↗",url:"https://sismaps.jpbdselangor.gov.my/index"},
      overlay:null
    },
    mobility:{
      eyebrow:{ms:"MOBILITI",en:"MOBILITY"},
      title:{ms:"Mobiliti",en:"Mobility"},
      desc:{ms:"Terokai rangkaian rel, stesen, trafik dan analitik mobiliti melalui 3D GeoPortal serta Analitik Spatial SUO.",en:"Explore rail networks, stations, traffic and mobility analytics through the 3D GeoPortal and SUO Spatial Analytics."},
      primary:{ms:"Buka 3D GeoPortal ↗",en:"Open 3D GeoPortal ↗",url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=mobility"},
      secondary:{ms:"Analitik Spatial ↗",en:"Spatial Analytics ↗",url:"https://faeiruzrusman.github.io/spatial-analytics/"},
      overlay:"mobility"
    }
  };

  const renderThemeRelated=async(key)=>{
    const host=document.querySelector("#v7ThemeRelated .v7-theme-related-links");
    const label=document.querySelector("#v7ThemeRelated .v7-theme-related-label");
    if(!host) return;
    const langCode=document.documentElement.lang==="en"?"en":"ms";
    if(label) label.textContent=langCode==="en"?"RELATED APPLICATIONS":"APLIKASI BERKAITAN";
    try{
      const apps=window.SUOApps ? await window.SUOApps.active() : [];
      const related=apps.filter(app=>Array.isArray(app.themes)&&app.themes.includes(key));
      host.innerHTML=related.map(app=>{
        const title=app["title_"+langCode]||app.title_ms;
        const type=app.group==="storymap"?"StoryMap":app.group==="dashboard"?"Dashboard":"Platform";
        return '<a href="'+app.url+'" target="_blank" rel="noopener"><span>'+type+'</span>'+title+'</a>';
      }).join("");
      document.getElementById("v7ThemeRelated")?.classList.toggle("is-empty",related.length===0);
    }catch(err){
      host.innerHTML="";
      console.warn("SUO theme registry:",err);
    }
  };

  const themeSpatialSources = {
    health:"https://faeiruzrusman.github.io/selangor-3d-map/data/kesihatan/kemudahan_kesihatan_selangor.geojson",
    rail:"https://faeiruzrusman.github.io/selangor-3d-map/data/transport/rail_network_final.geojson",
    stations:"https://faeiruzrusman.github.io/selangor-3d-map/data/transport/rail_stations_final.geojson"
  };

  const themeMapProjector = {project:null};
  const themeDataCache = new Map();

  const loadThemeGeoJSON = async (url) => {
    if(themeDataCache.has(url)) return themeDataCache.get(url);
    const p=fetch(url,{cache:"force-cache"}).then(r=>{if(!r.ok)throw new Error("GeoJSON "+r.status);return r.json()});
    themeDataCache.set(url,p); return p;
  };

  const getSpatialProjector = async () => {
    if(themeMapProjector.project) return themeMapProjector.project;
    const data=await loadThemeGeoJSON("https://faeiruzrusman.github.io/selangor-3d-map/data/pentadbiran/sempadan_daerah_selangor.geojson");
    const all=data.features.flatMap(f=>collectPoints(f.geometry));
    const xs=all.map(p=>p[0]), ys=all.map(p=>p[1]);
    const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
    const W=480,H=520,pad=30,s=Math.min((W-pad*2)/(maxX-minX),(H-pad*2)/(maxY-minY));
    const contentW=(maxX-minX)*s,contentH=(maxY-minY)*s,ox=(W-contentW)/2,oy=(H-contentH)/2;
    themeMapProjector.project=([x,y])=>[ox+(x-minX)*s,H-(oy+(y-minY)*s)];
    return themeMapProjector.project;
  };

  const pointOnSegment = (p,a,b,eps=1e-10) => {
    const [x,y]=p,[x1,y1]=a,[x2,y2]=b;
    const cross=(x-x1)*(y2-y1)-(y-y1)*(x2-x1);
    if(Math.abs(cross)>eps) return false;
    const dot=(x-x1)*(x2-x1)+(y-y1)*(y2-y1);
    if(dot < -eps) return false;
    const len2=(x2-x1)*(x2-x1)+(y2-y1)*(y2-y1);
    return dot <= len2 + eps;
  };

  const pointInRing = (point, ring) => {
    if(!Array.isArray(ring) || ring.length<3) return false;
    let inside=false;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      const a=ring[j], b=ring[i];
      if(pointOnSegment(point,a,b)) return true;
      const xi=b[0], yi=b[1], xj=a[0], yj=a[1];
      const hit=((yi>point[1])!==(yj>point[1])) &&
        (point[0] < (xj-xi)*(point[1]-yi)/((yj-yi)||Number.EPSILON)+xi);
      if(hit) inside=!inside;
    }
    return inside;
  };

  const pointInPolygonCoords = (point, coords) => {
    if(!coords?.length || !pointInRing(point,coords[0])) return false;
    for(let i=1;i<coords.length;i++){
      if(pointInRing(point,coords[i])) return false;
    }
    return true;
  };

  const pointInGeometry = (point, geom) => {
    if(!geom) return false;
    if(geom.type==="Polygon") return pointInPolygonCoords(point,geom.coordinates);
    if(geom.type==="MultiPolygon") return geom.coordinates.some(poly=>pointInPolygonCoords(point,poly));
    return false;
  };

  const getSelangorDistrictData = () => loadThemeGeoJSON(
    "https://faeiruzrusman.github.io/selangor-3d-map/data/pentadbiran/sempadan_daerah_selangor.geojson"
  );

  const insideSelangor = (point, districtData) =>
    Array.isArray(point) &&
    Number.isFinite(point[0]) &&
    Number.isFinite(point[1]) &&
    districtData.features.some(f=>pointInGeometry(point,f.geometry));

  const splitLineInsideSelangor = (coords,districtData) => {
    const parts=[];
    let current=[];
    coords.forEach(pt=>{
      if(insideSelangor(pt,districtData)){
        current.push(pt);
      }else{
        if(current.length>=2) parts.push(current);
        current=[];
      }
    });
    if(current.length>=2) parts.push(current);
    return parts;
  };

  const renderThemeOverlay = async (kind) => {
    document.getElementById("v7ThemeOverlay")?.remove();
    const svg=document.getElementById("v7SpatialMap");
    if(!svg) return;

    svg.querySelector("#v7ThemeLayer")?.remove();
    if(!kind) return;

    const NS="http://www.w3.org/2000/svg";
    const project=svg.__suoProject || await getSpatialProjector();
    const layer=document.createElementNS(NS,"g");
    layer.setAttribute("id","v7ThemeLayer");
    layer.setAttribute("class","v7-theme-layer");
    svg.appendChild(layer);

    if(kind==="health"){
      const [data,districtData]=await Promise.all([
        loadThemeGeoJSON(themeSpatialSources.health),
        getSelangorDistrictData()
      ]);
      data.features.forEach(f=>{
        if(f.geometry?.type!=="Point") return;
        const coord=f.geometry.coordinates;
        if(!insideSelangor(coord,districtData)) return;
        const [x,y]=project(coord);
        const c=document.createElementNS(NS,"circle");
        c.setAttribute("cx",x);
        c.setAttribute("cy",y);
        c.setAttribute("r","3.2");
        c.setAttribute("class","theme-point");
        layer.appendChild(c);
      });
    }

    if(kind==="mobility"){
      const [rail,stations,districtData]=await Promise.all([
        loadThemeGeoJSON(themeSpatialSources.rail),
        loadThemeGeoJSON(themeSpatialSources.stations),
        getSelangorDistrictData()
      ]);

      const drawLine=(coords,cls)=>{
        if(!coords || coords.length<2) return;
        const p=document.createElementNS(NS,"path");
        const d=coords.map((pt,i)=>{
          const [x,y]=project(pt);
          return (i?"L":"M")+x.toFixed(2)+" "+y.toFixed(2);
        }).join(" ");
        p.setAttribute("d",d);
        p.setAttribute("class",cls);
        layer.appendChild(p);
      };

      const drawFilteredLine=(coords)=>{
        splitLineInsideSelangor(coords,districtData).forEach(segment=>{
          drawLine(segment,"theme-line-casing");
          drawLine(segment,"theme-line");
        });
      };

      rail.features.forEach(f=>{
        const g=f.geometry;
        if(!g) return;
        if(g.type==="LineString") drawFilteredLine(g.coordinates);
        if(g.type==="MultiLineString") g.coordinates.forEach(drawFilteredLine);
      });

      stations.features.forEach(f=>{
        if(f.geometry?.type!=="Point") return;
        const coord=f.geometry.coordinates;
        if(!insideSelangor(coord,districtData)) return;
        const [x,y]=project(coord);
        const c=document.createElementNS(NS,"circle");
        c.setAttribute("cx",x);
        c.setAttribute("cy",y);
        c.setAttribute("r","2.45");
        c.setAttribute("class","theme-point");
        layer.appendChild(c);
      });
    }
  };

  const applyTheme = async (key) => {
    const item=themeCatalog[key];
    if(!item) return;
    const detail=document.getElementById("v7ThemeDetail");
    if(detail) detail.hidden=false;
    const langCode=document.documentElement.lang==="en"?"en":"ms";
    document.querySelectorAll(".v7-theme").forEach(x=>{
      const active=x.dataset.theme===key;
      x.classList.toggle("active",active);
      x.setAttribute("aria-pressed",String(active));
    });
    const eyebrow=document.getElementById("v7ThemeEyebrow");
    const title=document.getElementById("v7ThemeTitle");
    const desc=document.getElementById("v7ThemeDesc");
    const primary=document.getElementById("v7ThemePrimary");
    const secondary=document.getElementById("v7ThemeSecondary");
    if(eyebrow)eyebrow.textContent=item.eyebrow[langCode];
    if(title)title.textContent=item.title[langCode];
    if(desc)desc.textContent=item.desc[langCode];
    if(primary){primary.textContent=item.primary[langCode];primary.href=item.primary.url;primary.target=item.primary.url.startsWith("http")?"_blank":"_self"}
    if(secondary){secondary.textContent=item.secondary[langCode];secondary.href=item.secondary.url;secondary.target=item.secondary.url.startsWith("http")?"_blank":"_self"}
    try{await renderThemeOverlay(item.overlay)}catch(err){console.warn("SUO theme overlay:",err)}
    await renderThemeRelated(key);
  };

  document.querySelectorAll(".v7-theme[data-theme]").forEach(btn=>btn.addEventListener("click",()=>applyTheme(btn.dataset.theme)));
  localStorage.removeItem("suo-theme");

  let suoSearchIndex = [
    {
      titleMs:"Dashboard Perumahan Negeri Selangor", titleEn:"Selangor Housing Dashboard",
      type:"Dashboard", icon:"⌂",
      url:"https://geospatialpms-glitch.github.io/Dashboard-Perumahan-Negeri-Selangor/",
      keywords:["perumahan","housing","rumah mampu milik","rsku","lphs"]
    },
    {
      titleMs:"Dashboard Kemudahan Keselamatan Negeri Selangor", titleEn:"Selangor Safety Facilities Dashboard",
      type:"Dashboard", icon:"◈",
      url:"https://faeiruzrusman.github.io/Dashboard-Kemudahan-Keselamatan/",
      keywords:["keselamatan","safety","polis","pdrm","ipk","ipd","bomba","jbpm","apm","coverage analysis","nearest facility"]
    },
    {
      titleMs:"Dashboard Geopark Gombak-Hulu Langat", titleEn:"Gombak-Hulu Langat Geopark Dashboard",
      type:"Dashboard", icon:"◉",
      url:"https://geospatialpms-glitch.github.io/Dashboard-Geopark-Gombak-Hulu-Langat/",
      keywords:["geopark","gombak","hulu langat","warisan geologi","geoheritage","geological heritage","geotourism","geopelancongan","konservasi","geologi"]
    },
    {
      titleMs:"Perindustrian Negeri Selangor", titleEn:"Selangor Industry Dashboard",
      type:"Dashboard", icon:"▥",
      url:"https://geospatialpms-glitch.github.io/Perindustrian-Negeri-Selangor/",
      keywords:["perindustrian","industry","kawasan industri","industrial park","ekonomi"]
    },
    {
      titleMs:"Kemudahan Kesihatan Negeri Selangor", titleEn:"Selangor Health Facilities",
      type:"Dashboard", icon:"✚",
      url:"https://geospatialpms-glitch.github.io/Kemudahan-Kesihatan-Negeri-Selangor/",
      keywords:["kesihatan","health","hospital","klinik","healthcare"]
    },
    {
      titleMs:"Tanah Lapang Awam Negeri Selangor", titleEn:"Selangor Public Open Space",
      type:"Dashboard", icon:"♧",
      url:"https://geospatialpms-glitch.github.io/TANAH-LAPANG-AWAM-NEGERI-SELANGOR/",
      keywords:["tanah lapang","open space","taman","rekreasi","public open space"]
    },
    {
      titleMs:"Tapak Perkuburan Negeri Selangor", titleEn:"Selangor Cemetery Sites",
      type:"Dashboard", icon:"◆",
      url:"https://geospatialpms-glitch.github.io/Tapak-Perkuburan-Negeri-Selangor/",
      keywords:["perkuburan","cemetery","kubur","burial","tanah perkuburan"]
    },
    {
      titleMs:"Dashboard Guna Tanah Negeri Selangor", titleEn:"Selangor Land Use Dashboard",
      type:"Dashboard", icon:"▦",
      url:"https://sismaps.jpbdselangor.gov.my/dashboard",
      keywords:["guna tanah","land use","zoning","tepu bina","sismaps"]
    },
    {
      titleMs:"SMARTDesa Negeri Selangor", titleEn:"Selangor SMARTDesa",
      type:"Dashboard", icon:"⌘",
      url:"https://sismaps.jpbdselangor.gov.my/sdbigscreen",
      keywords:["smartdesa","desa","rural","kampung","pembangunan desa"]
    },
    {
      titleMs:"RSN Selangor 2035", titleEn:"Selangor State Structure Plan 2035",
      type:"StoryMap", icon:"▤",
      url:"https://arcg.is/11Sbea",
      keywords:["rsn","rancangan struktur","struktur negeri","selangor 2035","planning policy"]
    },
    {
      titleMs:"Panduan Pelaksanaan Pelancongan Negeri Selangor", titleEn:"Selangor Tourism Implementation Guide",
      type:"StoryMap", icon:"◉",
      url:"https://arcg.is/1WiD0n2",
      keywords:["pelancongan","tourism","destinasi","tarikan","travel"]
    },
    {
      titleMs:"SUO 3D GeoPortal", titleEn:"SUO 3D GeoPortal",
      type:"Platform", icon:"3D",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/",
      keywords:["geoportal","3d map","peta selangor","layer spatial","map"]
    },
    {
      titleMs:"Analitik Spatial SUO", titleEn:"SUO Spatial Analytics",
      type:"Platform", icon:"⌁",
      url:"https://faeiruzrusman.github.io/spatial-analytics/",
      keywords:["analitik spatial","spatial analytics","nearest facility","coverage analysis","buffer"]
    },
    {
      titleMs:"Kemudahan Kesihatan — GeoPortal", titleEn:"Health Facilities — GeoPortal",
      typeMs:"Layer GeoPortal", typeEn:"GeoPortal Layer", icon:"✚",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=health",
      keywords:["hospital","klinik","kesihatan","health","healthcare"]
    },
    {
      titleMs:"Pendidikan — GeoPortal", titleEn:"Schools — GeoPortal",
      typeMs:"Layer GeoPortal", typeEn:"GeoPortal Layer", icon:"⌂",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=schools",
      keywords:["sekolah","pendidikan","school","education","ppd"]
    },
    {
      titleMs:"Polis Diraja Malaysia — GeoPortal", titleEn:"Police Facilities — GeoPortal",
      typeMs:"Layer GeoPortal", typeEn:"GeoPortal Layer", icon:"◆",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=police",
      keywords:["polis","pdrm","ipk","ipd","police"]
    },
    {
      titleMs:"Balai Bomba & Penyelamat — GeoPortal", titleEn:"Fire & Rescue Stations — GeoPortal",
      typeMs:"Layer GeoPortal", typeEn:"GeoPortal Layer", icon:"▲",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=fire",
      keywords:["bomba","balai bomba","fire station","fire rescue","jbpm"]
    },
    {
      titleMs:"Rangkaian Rel & Stesen — GeoPortal", titleEn:"Rail Network & Stations — GeoPortal",
      typeMs:"Layer GeoPortal", typeEn:"GeoPortal Layer", icon:"═",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=mobility",
      keywords:["rel","rail","stesen","station","mrt","lrt","ktm"]
    },
    {
      titleMs:"Lot Kadaster — GeoPortal", titleEn:"Cadastral Lots — GeoPortal",
      typeMs:"Layer GeoPortal", typeEn:"GeoPortal Layer", icon:"▦",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=cadastral",
      keywords:["kadaster","cadastral","lot","lot tanah","parcel"]
    },
    {
      titleMs:"Sempadan PBT — GeoPortal", titleEn:"Local Authority Boundaries — GeoPortal",
      typeMs:"Layer GeoPortal", typeEn:"GeoPortal Layer", icon:"◇",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=pbt",
      keywords:["pbt","sempadan pbt","local authority","mbsa","mbpj","mpkj"]
    },
    {
      titleMs:"Sempadan Daerah — GeoPortal", titleEn:"District Boundaries — GeoPortal",
      typeMs:"Layer GeoPortal", typeEn:"GeoPortal Layer", icon:"▱",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=districts",
      keywords:["daerah","district","sempadan daerah","klang","gombak","petaling"]
    },
    {
      titleMs:"Flood Intelligence — GeoPortal", titleEn:"Flood Intelligence — GeoPortal",
      typeMs:"Layer GeoPortal", typeEn:"GeoPortal Layer", icon:"≈",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=environment",
      keywords:["banjir","flood","hujan","rainfall","flood intelligence"]
    },
    {
      titleMs:"Trafik Langsung — GeoPortal", titleEn:"Live Traffic — GeoPortal",
      typeMs:"Layer GeoPortal", typeEn:"GeoPortal Layer", icon:"↝",
      url:"https://faeiruzrusman.github.io/selangor-3d-map/?focus=traffic",
      keywords:["trafik","traffic","live traffic","jalan","kesesakan","congestion"]
    }
  ];

  // v7.27.0: Applications come from the central registry.
  // Keep GeoPortal layer shortcuts from the legacy index, but replace app-level
  // Dashboard / StoryMap / Platform records with registry records.
  const syncSearchWithRegistry=async()=>{
    if(!window.SUOApps) return;
    try{
      const apps=await window.SUOApps.active();
      const registryItems=apps.map(app=>({
        titleMs:app.title_ms,
        titleEn:app.title_en,
        type:app.group==="dashboard"?"Dashboard":app.group==="storymap"?"StoryMap":"Platform",
        icon:app.group==="dashboard"?"▦":app.group==="storymap"?"▤":"◈",
        url:app.url,
        keywords:app.keywords||[]
      }));
      const layerOnly=suoSearchIndex.filter(item=>
        (item.typeMs==="Layer GeoPortal" || item.typeEn==="GeoPortal Layer")
      );
      suoSearchIndex=[...registryItems,...layerOnly];
      if(searchPanel && !searchPanel.hidden) renderSearch(searchInput?.value||"");
    }catch(err){ console.warn("SUO registry search sync failed",err); }
  };
  syncSearchWithRegistry();

  const normalizeSearch = (s) => (s || "")
    .toLowerCase()
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"")
    .replace(/[^a-z0-9\s]/g," ")
    .replace(/\s+/g," ").trim();

  const searchToggle = document.getElementById("v7SearchToggle");
  const searchPanel = document.getElementById("v7SearchPanel");
  const searchClose = document.getElementById("v7SearchClose");
  const searchInput = document.getElementById("v7SmartSearchInput");
  const searchResults = document.getElementById("v7SearchResults");

  const currentLang = () => document.documentElement.lang === "en" ? "en" : "ms";
  const popularKeywords = ["hospital","sekolah","bomba","kadaster","rel","banjir"];

  const scoreItem = (item, q) => {
    const hay = [
      item.titleMs,item.titleEn,item.type,item.typeMs,item.typeEn,...item.keywords
    ].map(normalizeSearch);
    let score = 0;
    for(const text of hay){
      if(text === q) score = Math.max(score,100);
      else if(text.startsWith(q)) score = Math.max(score,75);
      else if(text.includes(q)) score = Math.max(score,50);
      const words=q.split(" ").filter(Boolean);
      if(words.length>1 && words.every(w=>text.includes(w))) score=Math.max(score,65);
    }
    return score;
  };

  const renderSearch = (query="") => {
    if(!searchResults) return;
    const langCode=currentLang();
    const q=normalizeSearch(query);
    if(!q){
      searchResults.innerHTML =
        '<div class="v7-search-popular">' +
        popularKeywords.map(k=>'<button type="button" class="v7-search-chip" data-search-chip="'+k+'">'+k+'</button>').join("") +
        '</div>';
      searchResults.querySelectorAll("[data-search-chip]").forEach(btn=>{
        btn.addEventListener("click",()=>{searchInput.value=btn.dataset.searchChip;renderSearch(searchInput.value);searchInput.focus();});
      });
      return;
    }

    const found=suoSearchIndex
      .map(item=>({item,score:scoreItem(item,q)}))
      .filter(x=>x.score>0)
      .sort((a,b)=>b.score-a.score)
      .slice(0,8);

    if(!found.length){
      searchResults.innerHTML='<div class="v7-search-empty">'+(langCode==="en"?"No matching SUO application found.":"Tiada aplikasi SUO yang sepadan ditemui.")+'</div>';
      return;
    }

    searchResults.innerHTML=found.map(({item})=>{
      const title=langCode==="en"?item.titleEn:item.titleMs;
      const type=langCode==="en"?(item.typeEn||item.type||""):(item.typeMs||item.type||"");
      const kw=item.keywords.slice(0,5).join(" · ");
      return '<a class="v7-search-result" href="'+item.url+'" target="_blank" rel="noopener">'+
        '<span class="v7-search-result-icon">'+item.icon+'</span>'+
        '<span class="v7-search-result-copy"><b>'+title+'</b><span>'+kw+'</span></span>'+
        '<span class="v7-search-result-type">'+type+'</span></a>';
    }).join("");
  };

  const openSearch=()=>{
    if(!searchPanel) return;
    searchPanel.hidden=false;
    searchToggle?.setAttribute("aria-expanded","true");
    renderSearch(searchInput?.value || "");
    window.setTimeout(()=>searchInput?.focus(),30);
  };
  const closeSearch=()=>{
    if(searchPanel) searchPanel.hidden=true;
    searchToggle?.setAttribute("aria-expanded","false");
  };

  searchToggle?.addEventListener("click",()=>searchPanel?.hidden?openSearch():closeSearch());
  searchClose?.addEventListener("click",closeSearch);
  searchInput?.addEventListener("input",()=>renderSearch(searchInput.value));
  document.addEventListener("keydown",e=>{
    if((e.metaKey||e.ctrlKey)&&e.key.toLowerCase()==="k"){e.preventDefault();openSearch()}
    if(e.key==="Escape") closeSearch();
  });
  document.addEventListener("click",e=>{
    if(searchPanel?.hidden) return;
    if(!e.target.closest(".v7-smart-search")) closeSearch();
  });

  const mapSources = {
    hero: "https://faeiruzrusman.github.io/selangor-3d-map/data/pentadbiran/sempadan_daerah_selangor.geojson",
    spatial: "https://faeiruzrusman.github.io/selangor-3d-map/data/pentadbiran/sempadan_pbt_selangor_2024.geojson"
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

  const ringAreaAbs = (ring=[]) => {
    let a=0;
    for(let i=0,j=ring.length-1;i<ring.length;j=i++){
      a += (ring[j][0]*ring[i][1])-(ring[i][0]*ring[j][1]);
    }
    return Math.abs(a/2);
  };

  const mainOuterRing = (geom) => {
    if(!geom) return [];
    if(geom.type==="Polygon") return geom.coordinates?.[0] || [];
    if(geom.type==="MultiPolygon"){
      const rings=(geom.coordinates||[]).map(p=>p?.[0]||[]);
      return rings.sort((a,b)=>ringAreaAbs(b)-ringAreaAbs(a))[0] || [];
    }
    return [];
  };

  const projectedRingCentroid = (ring,project) => {
    const pts=(ring||[]).map(project);
    if(pts.length<3) return pts[0] || [240,260];
    let twiceArea=0,cx=0,cy=0;
    for(let i=0,j=pts.length-1;i<pts.length;j=i++){
      const cross=(pts[j][0]*pts[i][1])-(pts[i][0]*pts[j][1]);
      twiceArea+=cross;
      cx+=(pts[j][0]+pts[i][0])*cross;
      cy+=(pts[j][1]+pts[i][1])*cross;
    }
    if(Math.abs(twiceArea)<.0001){
      return [
        pts.reduce((s,p)=>s+p[0],0)/pts.length,
        pts.reduce((s,p)=>s+p[1],0)/pts.length
      ];
    }
    return [cx/(3*twiceArea),cy/(3*twiceArea)];
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
      if(svgId==="v7SpatialMap") svg.__suoProject=project;
      const NS="http://www.w3.org/2000/svg";
      svg.replaceChildren();

      data.features.forEach((f,i)=>{
        const path=document.createElementNS(NS,"path");
        const d=ringsForGeometry(f.geometry).map(ring => ring.map((pt,j)=>{
          const [x,y]=project(pt); return (j?"L":"M")+x.toFixed(2)+" "+y.toFixed(2);
        }).join(" ")+" Z").join(" ");
        path.setAttribute("d",d);
        path.setAttribute("fill-rule","evenodd");
        path.setAttribute("class",
          opts.heroDistrict
            ? "real-polygon hero-district"
            : opts.spatialPbt
              ? "real-polygon spatial-pbt"
              : "real-polygon"
        );
        path.style.setProperty("--district-i",i);
        path.setAttribute("fill",
          opts.heroDistrict
            ? (i%4===0?"#7E2030":i%4===1?"#963044":i%4===2?"#AA3B51":"#BB4D60")
            : opts.spatialPbt
              ? (i%3===0?"#E8BEC5":i%3===1?"#DFADB7":"#F0CED3")
              : opts.district
                ? (i%2 ? "#E9A8B3":"#F2C4CB")
                : (i%3===0?"#8F0D23":i%3===1?"#B51230":"#D22442")
        );
        path.setAttribute("stroke",
          opts.heroDistrict
            ? "rgba(255,255,255,.86)"
            : opts.spatialPbt
              ? "#B83246"
              : opts.district
                ? "#C8102E"
                : "rgba(255,255,255,.78)"
        );
        path.setAttribute("stroke-width",
          opts.heroDistrict ? "1.5" : opts.spatialPbt ? "1.15" : opts.district ? "1.35" : "1.1"
        );
        const title=document.createElementNS(NS,"title");
        title.textContent=f.properties?.web_name || f.properties?.NAMA_PBT || f.properties?.DAERAH || "Selangor";
        path.appendChild(title);
        svg.appendChild(path);

        const pts=collectPoints(f.geometry);
        if(pts.length){
          const cx=pts.reduce((a,p)=>a+p[0],0)/pts.length;
          const cy=pts.reduce((a,p)=>a+p[1],0)/pts.length;
          const [px,py]=project([cx,cy]);

          if(opts.heroDistrict){
            const ring=mainOuterRing(f.geometry);
            const [lx,ly]=projectedRingCentroid(ring,project);
            const districtName=
              f.properties?.DAERAH ||
              f.properties?.NAMA_DAERAH ||
              f.properties?.NAM_DAERAH ||
              f.properties?.DISTRICT ||
              f.properties?.web_name ||
              "DAERAH";
            const label=document.createElementNS(NS,"text");
            label.setAttribute("x",lx);
            label.setAttribute("y",ly);
            label.setAttribute("class","hero-district-label");
            label.setAttribute("text-anchor","middle");
            label.setAttribute("dominant-baseline","middle");
            label.style.setProperty("--district-i",i);
            label.textContent=String(districtName).toUpperCase();
            svg.appendChild(label);
          } else if((!opts.district && !opts.spatialPbt) || opts.labels){
            const node=document.createElementNS(NS,"circle");
            node.setAttribute("cx",px);
            node.setAttribute("cy",py);
            node.setAttribute("r",opts.district?3.1:4.2);
            node.setAttribute("class","real-node");
            svg.appendChild(node);
          }
        }
      });
      if(svgId==="v7SpatialMap" && typeof applyTheme==="function"){
        window.setTimeout(()=>applyTheme("housing"),0);
      }
    } catch(err) {
      console.warn("SUO real map preview fallback:",err);
      svg.innerHTML='<text x="240" y="260" text-anchor="middle" fill="#8F0D23" font-size="13">Peta Selangor sedang dimuatkan</text>';
    }
  };

  renderRealSelangorMap("v7HeroMap",mapSources.hero,{district:true,heroDistrict:true});
  renderRealSelangorMap("v7SpatialMap",mapSources.spatial,{district:false,spatialPbt:true,labels:false});

  const heroMapWrap=document.querySelector(".v7-hero .v7-map-wrap");
  const heroMap=document.getElementById("v7HeroMap");
  const heroOrb=document.querySelector(".v7-hero .v7-map-orb");

  if(heroMapWrap && heroMap && window.matchMedia("(pointer:fine)").matches){
    const resetHeroMap=()=>{
      heroMap.style.setProperty("--map-rx","0deg");
      heroMap.style.setProperty("--map-ry","0deg");
      heroMap.style.setProperty("--map-tx","0px");
      heroMap.style.setProperty("--map-ty","0px");
      heroOrb?.style.setProperty("--orb-x","0px");
      heroOrb?.style.setProperty("--orb-y","0px");
      heroMapWrap.classList.remove("is-map-hover");
    };

    heroMapWrap.addEventListener("pointerenter",()=>{
      heroMapWrap.classList.add("is-map-hover");
    });

    heroMapWrap.addEventListener("pointermove",(e)=>{
      const r=heroMapWrap.getBoundingClientRect();
      const nx=((e.clientX-r.left)/r.width)-.5;
      const ny=((e.clientY-r.top)/r.height)-.5;

      heroMap.style.setProperty("--map-rx",(-ny*2.8).toFixed(2)+"deg");
      heroMap.style.setProperty("--map-ry",(nx*3.6).toFixed(2)+"deg");
      heroMap.style.setProperty("--map-tx",(nx*7).toFixed(1)+"px");
      heroMap.style.setProperty("--map-ty",(ny*5).toFixed(1)+"px");

      heroOrb?.style.setProperty("--orb-x",(nx*11).toFixed(1)+"px");
      heroOrb?.style.setProperty("--orb-y",(ny*8).toFixed(1)+"px");
    });

    heroMapWrap.addEventListener("pointerleave",resetHeroMap);
  }

  const spatialMapWrap=document.querySelector(".v7-spatial .v7-spatial-map");
  const spatialMap=document.getElementById("v7SpatialMap");

  if(spatialMapWrap && spatialMap && window.matchMedia("(pointer:fine)").matches){
    const tooltip=document.createElement("div");
    tooltip.className="v7-spatial-tooltip";
    tooltip.setAttribute("aria-hidden","true");
    spatialMapWrap.appendChild(tooltip);

    const resetSpatialMap=()=>{
      spatialMap.style.setProperty("--spatial-rx","0deg");
      spatialMap.style.setProperty("--spatial-ry","0deg");
      spatialMap.style.setProperty("--spatial-tx","0px");
      spatialMap.style.setProperty("--spatial-ty","0px");
      spatialMapWrap.style.setProperty("--spot-x","50%");
      spatialMapWrap.style.setProperty("--spot-y","50%");
      spatialMapWrap.classList.remove("is-map-hover");
      tooltip.classList.remove("show");
    };

    spatialMapWrap.addEventListener("pointerenter",()=>{
      spatialMapWrap.classList.add("is-map-hover");
    });

    spatialMapWrap.addEventListener("pointermove",(e)=>{
      const r=spatialMapWrap.getBoundingClientRect();
      const px=e.clientX-r.left;
      const py=e.clientY-r.top;
      const nx=(px/r.width)-.5;
      const ny=(py/r.height)-.5;

      spatialMap.style.setProperty("--spatial-rx",(-ny*2.2).toFixed(2)+"deg");
      spatialMap.style.setProperty("--spatial-ry",(nx*2.8).toFixed(2)+"deg");
      spatialMap.style.setProperty("--spatial-tx",(nx*5).toFixed(1)+"px");
      spatialMap.style.setProperty("--spatial-ty",(ny*3).toFixed(1)+"px");

      spatialMapWrap.style.setProperty("--spot-x",px.toFixed(1)+"px");
      spatialMapWrap.style.setProperty("--spot-y",py.toFixed(1)+"px");

      tooltip.style.left=Math.min(r.width-18,Math.max(18,px+16))+"px";
      tooltip.style.top=Math.min(r.height-18,Math.max(18,py-12))+"px";
    });

    spatialMapWrap.addEventListener("pointerover",(e)=>{
      const shape=e.target.closest?.(".spatial-pbt");
      if(!shape) return;
      const title=shape.querySelector("title")?.textContent?.trim();
      if(title){
        tooltip.textContent=title;
        tooltip.classList.add("show");
      }
    });

    spatialMapWrap.addEventListener("pointerout",(e)=>{
      const shape=e.target.closest?.(".spatial-pbt");
      if(!shape) return;
      const next=e.relatedTarget?.closest?.(".spatial-pbt");
      if(!next) tooltip.classList.remove("show");
    });

    spatialMapWrap.addEventListener("pointerleave",resetSpatialMap);
  }

})();