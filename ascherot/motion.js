/* FTA66 Bewegung: ruhige, hochwertige Scroll-Animationen. Ohne JS oder bei "weniger Bewegung" bleibt alles sichtbar und statisch.
   data-reveal      Element gleitet beim Hineinscrollen weich hoch
   data-wipe        Bild wird wie ein Vorhang aufgezogen
   data-words       Wörter leuchten nacheinander auf, während man scrollt
   data-bg="#hex"   Seitenhintergrund wechselt weich, wenn der Abschnitt die Bildschirmmitte erreicht
   data-expand      Bild wächst beim Scrollen vom gerahmten Bild zur vollen Breite
   data-hscroll     Abschnitt wird auf großen Bildschirmen seitlich durchgescrollt
   data-marquee     Laufband, das mit der Scroll-Geschwindigkeit schneller wird
   data-draw        SVG-Linien zeichnen sich beim Hineinscrollen
   data-parallax="0.15"  leichte Tiefenwirkung */
(function () {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => [...r.querySelectorAll(s)];
  const vh = () => innerHeight;
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  document.documentElement.classList.add('js');

  // Wörter aufteilen (auch ohne Bewegung, damit Layout gleich bleibt)
  $('[data-words]').forEach((el) => {
    el.innerHTML = el.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(' ');
  });
  if (reduce) { $('[data-words] .w').forEach((w) => (w.style.opacity = 1)); return; }

  // Einblenden: nur Elemente unterhalb des ersten Bildschirms werden vorbereitet
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) { e.target.classList.remove('pre'); e.target.classList.add('in'); io.unobserve(e.target); }
  }), { threshold: 0.15, rootMargin: '0px 0px -6% 0px' });
  $('[data-reveal],[data-wipe],[data-draw]').forEach((el) => {
    if (el.getBoundingClientRect().top > vh() * 0.92) { el.classList.add('pre'); io.observe(el); }
    else requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('in')));
  });

  const words = $('[data-words]'), bgs = $('[data-bg]'), exps = $('[data-expand]'), hs = $('[data-hscroll]'), pars = $('[data-parallax]');
  const mqs = $('[data-marquee]').map((el) => ({ el, x: 0, w: 0 }));
  let lastY = scrollY, vel = 0, curBg = null;

  function setupH() {
    hs.forEach((s) => {
      const track = s.querySelector('.h-track'), wide = innerWidth > 900;
      s.classList.toggle('h-on', wide);
      if (wide) { const extra = Math.max(0, track.scrollWidth - innerWidth + 80); s.style.height = `calc(${extra}px + 100vh)`; s._extra = extra; }
      else { s.style.height = ''; track.style.transform = ''; }
    });
    mqs.forEach((m) => (m.w = m.el.querySelector('.mq-track').scrollWidth / 2));
  }

  function frame() {
    const y = scrollY; vel = vel * 0.85 + (y - lastY) * 0.15; lastY = y;
    const H = vh();
    words.forEach((el) => {
      const r = el.getBoundingClientRect(); const p = clamp((H * 0.85 - r.top) / (r.height + H * 0.4));
      const ws = el.children, n = ws.length;
      for (let i = 0; i < n; i++) ws[i].style.opacity = 0.18 + 0.82 * clamp(p * n * 1.15 - i);
    });
    let pick = null;
    bgs.forEach((el) => { const r = el.getBoundingClientRect(); if (r.top < H * 0.55 && r.bottom > H * 0.55) pick = el.dataset.bg; });
    if (pick && pick !== curBg) { curBg = pick; document.body.style.backgroundColor = pick; }
    exps.forEach((el) => {
      const r = el.getBoundingClientRect(); const p = clamp((H - r.top) / (H * 0.9));
      const ix = (1 - p) * 9, iy = (1 - p) * 7, rad = (1 - p) * 28;
      el.style.clipPath = `inset(${iy}% ${ix}% ${iy}% ${ix}% round ${rad}px)`;
      const img = el.querySelector('img'); if (img) img.style.transform = `scale(${1.18 - p * 0.18})`;
    });
    hs.forEach((s) => {
      if (!s.classList.contains('h-on')) return;
      const r = s.getBoundingClientRect(); const p = clamp(-r.top / (s._extra || 1));
      s.querySelector('.h-track').style.transform = `translate3d(${-p * s._extra}px,0,0)`;
      const bar = s.querySelector('.h-bar i'); if (bar) bar.style.transform = `scaleX(${p})`;
    });
    pars.forEach((el) => { const r = el.getBoundingClientRect(); const c = r.top + r.height / 2 - H / 2; el.style.transform = `translate3d(0,${c * -(+el.dataset.parallax || 0.12)}px,0)`; });
    mqs.forEach((m) => {
      if (!m.w) return; m.x -= 0.6 + Math.abs(vel) * 0.35; if (m.x <= -m.w) m.x += m.w;
      m.el.querySelector('.mq-track').style.transform = `translate3d(${m.x}px,0,0) skewX(${clamp(-vel * 0.25, -10, 10)}deg)`;
    });
    requestAnimationFrame(frame);
  }
  addEventListener('resize', setupH);
  addEventListener('load', setupH);
  setupH(); requestAnimationFrame(frame);
})();
