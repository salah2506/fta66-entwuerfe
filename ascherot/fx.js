/* Schriftgröße A / A+ / A++ (für alle, die größer lesen möchten) */
(function () {
  const sizes = { s: '100%', m: '112.5%', l: '127%' };
  function set(k) {
    document.documentElement.style.fontSize = sizes[k] || '100%';
    document.querySelectorAll('[data-size]').forEach((b) => b.setAttribute('aria-pressed', b.dataset.size === k));
    try { localStorage.setItem('fta-size', k); } catch (e) {}
  }
  let k = 's'; try { k = localStorage.getItem('fta-size') || 's'; } catch (e) {}
  set(k);
  document.addEventListener('click', (e) => { const b = e.target.closest('[data-size]'); if (b) set(b.dataset.size); });
})();
