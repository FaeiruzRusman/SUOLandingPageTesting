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
})();