/* eravos.groove-gen UI — the density canvas from EDM Lab (paint where the rhythm is busy; right-click erases), style, ENERGY. */
OrganismFactory.reg('eravos.groove-gen', function (view) {
  const UI = view.ui, h = UI.h;
  let map = null, rows = [], cursor = -1; const flash = {};
  const brush = { size: 1, strength: 1 };
  const COL = ['#ff2266', '#ffaa00', '#b87a00', '#ffdd00', '#ddff44', '#ff66aa', '#00ff88', '#ccff99'];
  const cv = UI.Canvas(460, 170); cv.style.cursor = 'crosshair'; cv.classList.add('gg-map');
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = cv.H, rh = H / 8, cw = (W - 50) / 32; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    if (!map) return;
    rows.forEach((r, i) => {
      g.fillStyle = COL[i]; g.font = '9px monospace'; g.fillText(r, 2, i * rh + rh / 2 + 3);
      for (let s = 0; s < 32; s++) {
        const v = map[i][s], x = 50 + s * cw, y = i * rh;
        g.fillStyle = s % 4 === 0 ? '#141c27' : '#10161f'; g.fillRect(x + 1, y + 1, cw - 2, rh - 2);
        if (v > 0) { g.fillStyle = COL[i]; g.globalAlpha = 0.2 + 0.8 * v; g.fillRect(x + 1, y + 1 + (1 - v) * (rh - 2), cw - 2, v * (rh - 2)); g.globalAlpha = 1; }
        const f = flash[i + ':' + s]; if (f && performance.now() - f < 140) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, cw - 2, rh - 2); }
      }
    });
    if (cursor >= 0) { g.fillStyle = 'rgba(255,255,255,.15)'; g.fillRect(50 + cursor * cw, 0, cw, H); }
  }, 30);
  let painting = false;
  const at = (e) => { const r = cv.getBoundingClientRect(), cw = (r.width - 50 * r.width / cv.offsetWidth) / 32; return { row: Math.max(0, Math.min(7, Math.floor((e.clientY - r.top) / (r.height / 8)))), step: Math.max(0, Math.min(31, Math.floor((e.clientX - r.left - 50 * r.width / cv.offsetWidth) / cw))) }; };
  const paint = (e) => { const p = at(e); view.emit('paint', { row: p.row, step: p.step, radius: brush.size - 1, value: e.button === 2 || e.buttons === 2 ? 0 : brush.strength }); };
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => { e.stopPropagation(); painting = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} paint(e); });
  cv.addEventListener('pointermove', (e) => { if (painting) paint(e); });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { painting = false; }));
  view.on('map', (m) => { map = m.map; });
  view.on('state_sync', (s) => { if (s.map) map = s.map; if (s.rows) rows = s.rows; });
  view.on('hits', (x) => UI.atTime(view.ac, x.time, () => { cursor = x.step; const n = performance.now(); x.rows.forEach((on, i) => { if (on) flash[i + ':' + x.step] = n; }); }));
  const size = UI.Segmented({ options: [{ value: 1, label: '•', hint: 'small brush' }, { value: 2, label: '●', hint: 'medium brush' }, { value: 4, label: '⬤', hint: 'big brush' }], value: 1, onChange: (v) => { brush.size = +v; } });
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { margin: 0 } }, [size.el, UI.Button({ label: '🎲', hint: 'a new seed: the same map, other hits', onClick: () => view.emit('reseed', {}) }).el, UI.Button({ label: 'Clear', onClick: () => view.emit('clear', {}) }).el])]),
    cv, UI.paramPanel(view, ['style', 'energy', 'swing', 'seed'], { flat: true, size: 34 }),
    UI.hint('Wire its note out (orange dot) into Pads or Drum Forge. Paint where the drums are busy; right-click erases. ENERGY decides how many painted hits fire.'),
  );
});
