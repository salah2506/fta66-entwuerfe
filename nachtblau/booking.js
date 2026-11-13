/* FTA66 Platzbuchung (Demo, Belegung simuliert)
   - feste Buchungsleiste unten auf jeder Seite (immer sichtbar)
   - Buchungsfenster in 3 Schritten: Zeit → Platz → Fertig
   - API: window.FTA.open({sport, day, hour, court}), FTA.nextFree(sport), FTA.freeAt(sport, day, hour), FTA.courtName(c) */
(function () {
  const SPORTS = {
    tennis: { name: 'Tennis', courts: [1, 2, 3, 4, 5, 6, 7, 8], from: 8, to: 20 },
    padel: { name: 'Padel', courts: [9, 10], from: 8, to: 21 }
  };
  const WD = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'], WDL = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const MO = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];
  const now = new Date();
  const st = { step: 1, sport: 'tennis', day: 0, hour: null, court: null };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const courtName = (c) => c >= 9 ? 'Padel-Court ' + (c - 8) : 'Platz ' + c;
  const dateOf = (i) => { const d = new Date(now); d.setDate(d.getDate() + i); return d; };
  const dayLabel = (i, long) => { const d = dateOf(i); const rel = i === 0 ? 'Heute' : i === 1 ? 'Morgen' : (long ? WDL : WD)[d.getDay()]; return long ? `${rel}, ${d.getDate()}. ${MO[d.getMonth()]}` : rel; };
  const hh = (h) => String(h).padStart(2, '0') + ':00';
  const busy = (day, hour, court) => {
    if (day === 0 && hour <= now.getHours()) return true;
    const x = (day * 131 + hour * 17 + court * 71 + now.getDate() * 7) % 97;
    return x / 97 < 0.36 + (hour >= 17 && hour <= 19 ? 0.25 : 0);
  };
  const freeAt = (sport, day, hour) => SPORTS[sport].courts.filter((c) => !busy(day, hour, c));
  const nextFree = (sport) => { const S = SPORTS[sport]; for (let d = 0; d < 14; d++) for (let h = S.from; h <= S.to; h++) { const f = freeAt(sport, d, h); if (f.length) return { sport, day: d, hour: h, court: f[0] }; } };
  const freeToday = (sport) => { const S = SPORTS[sport]; let n = 0; for (let h = S.from; h <= S.to; h++) if (freeAt(sport, 0, h).length) n++; return n; };

  // ---------- Buchungsleiste (immer sichtbar)
  const dock = document.createElement('div');
  dock.className = 'dock';
  dock.innerHTML = `<div class="dock-in">
    <div class="dock-seg" role="group" aria-label="Sport wählen"><button data-s="tennis" aria-pressed="true">Tennis</button><button data-s="padel" aria-pressed="false">Padel</button></div>
    <div class="dock-info"><span class="dock-dot" aria-hidden="true"></span><span class="dock-txt"></span></div>
    <button class="dock-go">Platz buchen</button></div>`;
  document.body.appendChild(dock);
  document.body.classList.add('has-dock');
  function updDock() {
    dock.querySelectorAll('.dock-seg button').forEach((b) => b.setAttribute('aria-pressed', b.dataset.s === st.sport));
    const n = freeToday(st.sport), nf = nextFree(st.sport);
    dock.querySelector('.dock-txt').innerHTML = n ? `Heute noch <b>${n} ${n === 1 ? 'Uhrzeit' : 'Uhrzeiten'}</b> frei` : `Nächste freie Zeit: <b>${dayLabel(nf.day)} ${hh(nf.hour)}</b>`;
  }
  dock.addEventListener('click', (e) => {
    const s = e.target.closest('[data-s]'); if (s) { st.sport = s.dataset.s; updDock(); return; }
    if (e.target.closest('.dock-go')) open({ sport: st.sport });
  });

  // ---------- Buchungsfenster
  const dlg = document.createElement('dialog');
  dlg.className = 'bk-dlg';
  dlg.setAttribute('aria-label', 'Platz buchen');
  document.body.appendChild(dlg);
  dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
  dlg.addEventListener('close', () => document.body.classList.remove('bk-open'));

  function steps() {
    return `<ol class="bk-steps">${['Tag & Uhrzeit', 'Platz', 'Fertig'].map((n, i) => `<li class="${i + 1 === st.step ? 'on' : i + 1 < st.step ? 'done' : ''}"><span>${i + 1 < st.step ? '✓' : i + 1}</span>${n}</li>`).join('')}</ol>`;
  }
  function courtMap() {
    const free = new Set(freeAt(st.sport, st.day, st.hour));
    const box = (c, x, y, w, h) => {
      const mine = SPORTS[st.sport].courts.includes(c), f = mine && free.has(c);
      const cls = !mine ? 'off' : f ? (st.court === c ? 'sel' : 'free') : 'busy';
      return `<g class="bk-court ${cls}" ${f ? `data-a="court" data-v="${c}" tabindex="0" role="button" aria-label="${courtName(c)} wählen"` : ''}><rect x="${x}" y="${y}" width="${w}" height="${h}" rx="4"/><line x1="${x + 6}" x2="${x + w - 6}" y1="${y + h / 2}" y2="${y + h / 2}"/><text x="${x + w / 2}" y="${y + h / 2 - 8}" text-anchor="middle">${c >= 9 ? 'P' + (c - 8) : c}</text></g>`;
    };
    let s = '';
    [[5, 0], [4, 1]].forEach(([c, i]) => s += box(c, 12 + i * 52, 18, 48, 84));
    [[3, 0], [2, 1], [1, 2]].forEach(([c, i]) => s += box(c, 132 + i * 52, 18, 48, 84));
    [[8, 0], [7, 1], [6, 2]].forEach(([c, i]) => s += box(c, 112 + i * 52, 138, 48, 84));
    s += box(9, 300, 150, 42, 62) + box(10, 346, 150, 42, 62);
    return `<svg class="bk-map" viewBox="0 0 400 236" aria-label="Lageplan"><rect class="bk-ground" width="400" height="236" rx="10"/><rect class="bk-house" x="300" y="22" width="88" height="56" rx="4"/><text class="bk-lbl" x="344" y="55" text-anchor="middle">Platz 13</text><text class="bk-lbl" x="12" y="231">Danziger Straße</text>${s}</svg>`;
  }
  function render() {
    let h = `<div class="bk-head">${steps()}<button class="bk-x" data-a="close" aria-label="Schließen">✕</button></div>`;
    if (st.step === 1) {
      const S = SPORTS[st.sport], nf = nextFree(st.sport);
      let days = ''; for (let i = 0; i < 14; i++) { const d = dateOf(i); days += `<button class="bk-day" aria-pressed="${i === st.day}" data-a="day" data-v="${i}"><small>${dayLabel(i)}</small><b>${d.getDate()}.</b><small>${MO[d.getMonth()]}</small></button>`; }
      let times = ''; for (let t = S.from; t <= S.to; t++) { const n = freeAt(st.sport, st.day, t).length; times += `<button class="bk-time" ${n ? '' : 'disabled'} data-a="hour" data-v="${t}"><b>${hh(t)}</b><span>${n ? (n === 1 ? '1 Platz frei' : n + ' Plätze frei') : 'belegt'}</span></button>`; }
      h += `<h2 class="bk-title">Wann möchten Sie spielen?</h2>
        <div class="bk-seg" role="group" aria-label="Sport"><button data-a="sport" data-v="tennis" aria-pressed="${st.sport === 'tennis'}">Tennis</button><button data-a="sport" data-v="padel" aria-pressed="${st.sport === 'padel'}">Padel</button></div>
        ${nf ? `<button class="bk-quick" data-a="quick"><span><small>Am schnellsten</small>${dayLabel(nf.day, true)}, ${hh(nf.hour)} Uhr · ${courtName(nf.court)}</span><b>Nehmen →</b></button>` : ''}
        <div class="bk-days">${days}</div><div class="bk-times">${times}</div>
        <p class="bk-fine">Buchbar bis 2 Wochen im Voraus, je 1 Stunde. ${st.sport === 'padel' ? 'Padel: nur Mitglieder, 10 € pro Stunde.' : 'Tennis-Gäste melden sich bei info@fta66.de.'}</p>`;
    } else if (st.step === 2) {
      const free = freeAt(st.sport, st.day, st.hour); if (!free.includes(st.court)) st.court = free[0];
      h += `<h2 class="bk-title">Welcher Platz?</h2><p class="bk-fine">${dayLabel(st.day, true)}, ${hh(st.hour)}–${hh(st.hour + 1)} Uhr. Ein freier Platz ist schon ausgewählt, tippen Sie einen anderen an, wenn Sie möchten.</p>
        ${courtMap()}<div class="bk-legend"><span class="l-free">frei</span><span class="l-sel">Ihre Wahl</span><span class="l-busy">belegt</span></div>
        <div class="bk-sum"><span>${SPORTS[st.sport].name} · ${courtName(st.court)}<br><small>${dayLabel(st.day, true)}, ${hh(st.hour)}–${hh(st.hour + 1)} Uhr${st.sport === 'padel' ? ' · 10 €' : ''}</small></span></div>
        <div class="bk-row"><button class="bk-sec" data-a="back">← Andere Zeit</button><button class="bk-pri" data-a="book">Verbindlich buchen</button></div>`;
    } else {
      h += `<div class="bk-done" role="status"><div class="bk-ticket"><small>Gebucht (Demo)</small><b>${courtName(st.court)}</b><span>${dayLabel(st.day, true)} · ${hh(st.hour)}–${hh(st.hour + 1)} Uhr</span><i aria-hidden="true"></i></div>
        <p>Viel Spaß auf dem Platz! In der fertigen Seite kommt die Bestätigung per E-Mail.</p>
        <div class="bk-row"><button class="bk-sec" data-a="again">Noch einen Platz</button><button class="bk-pri" data-a="close">Fertig</button></div></div>`;
    }
    dlg.innerHTML = `<div class="bk">${h}</div>`;
    const sd = dlg.querySelector('.bk-day[aria-pressed="true"]'); if (sd) sd.scrollIntoView({ block: 'nearest', inline: 'center' });
  }
  function open(o = {}) {
    Object.assign(st, { day: 0, hour: null, court: null }, o);
    st.step = o.hour != null ? 2 : 1;
    render();
    if (!dlg.open) { dlg.showModal(); document.body.classList.add('bk-open'); }
    updDock();
  }
  function celebrate(btn) {
    try { const A = new (window.AudioContext || window.webkitAudioContext)(); [0, 0.16].forEach((t, i) => { const o = A.createOscillator(), g = A.createGain(); o.type = 'triangle'; o.frequency.setValueAtTime(i ? 520 : 680, A.currentTime + t); o.frequency.exponentialRampToValueAtTime(140, A.currentTime + t + 0.09); g.gain.setValueAtTime(0.35, A.currentTime + t); g.gain.exponentialRampToValueAtTime(0.001, A.currentTime + t + 0.12); o.connect(g).connect(A.destination); o.start(A.currentTime + t); o.stop(A.currentTime + t + 0.13); }); } catch (e) {}
    if (reduce) return;
    const r = btn.getBoundingClientRect();
    for (let i = 0; i < 16; i++) {
      const b = document.createElement('span'); b.className = 'bk-burst';
      b.style.left = r.left + r.width / 2 + 'px'; b.style.top = r.top + 'px';
      dlg.appendChild(b);
      const ang = Math.PI * (1.1 + Math.random() * 0.8), v = 180 + Math.random() * 220;
      b.animate([{ transform: 'translate(0,0) scale(.6)', opacity: 1 }, { transform: `translate(${Math.cos(ang) * v}px,${Math.sin(ang) * v + 260}px) scale(1) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1100 + Math.random() * 400, easing: 'cubic-bezier(.2,.7,.4,1)' }).onfinish = () => b.remove();
    }
  }
  dlg.addEventListener('click', (e) => {
    const b = e.target.closest('[data-a]'); if (!b) return;
    const a = b.dataset.a, v = b.dataset.v;
    if (a === 'close') dlg.close();
    else if (a === 'sport') { st.sport = v; render(); updDock(); }
    else if (a === 'day') { st.day = +v; render(); }
    else if (a === 'hour') { st.hour = +v; st.court = null; st.step = 2; render(); }
    else if (a === 'quick') { Object.assign(st, nextFree(st.sport)); st.step = 2; render(); }
    else if (a === 'court') { st.court = +v; render(); }
    else if (a === 'back') { st.step = 1; render(); }
    else if (a === 'book') { st.step = 3; render(); celebrate(dlg.querySelector('.bk-ticket')); }
    else if (a === 'again') { st.step = 1; st.hour = null; render(); }
  });
  dlg.addEventListener('keydown', (e) => { if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('.bk-court[data-a]')) { e.preventDefault(); e.target.dispatchEvent(new MouseEvent('click', { bubbles: true })); } });
  // alle Links/Knöpfe mit data-book öffnen die Buchung
  document.addEventListener('click', (e) => { const t = e.target.closest('[data-book]'); if (t) { e.preventDefault(); open({ sport: t.dataset.book || st.sport }); } });

  window.FTA = { open, nextFree, freeAt, busy, courtName, dayLabel, hh, SPORTS };
  updDock();
})();
