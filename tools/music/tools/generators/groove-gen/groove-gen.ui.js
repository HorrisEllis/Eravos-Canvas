/* eravos.groove-gen UI — 1.1 (3.71): the window is the painting; its page adds tabs (Feel here, Motion and Perform from the domain).
 *   PLAY     the density canvas from EDM Lab (paint where the rhythm is busy; right-click erases; click a row's name to mute it,
 *            Alt-click to solo it), style, ENERGY, swing, seed
 *   FEEL     humanize, accent, rolls, fill, evolve, loop — and each drum row: mute, solo, level, chance, which pad it plays
 *   MOTION   any knob moving on its own (core/motion-ui.js)        PERFORM  four macros + an XY pad */
OrganismFactory.reg('eravos.groove-gen', function (view) {
  const UI = view.ui, h = UI.h;
  let map = null, rows = [], cursor = -1, fillNow = false, R = null; const flash = {};
  const brush = { size: 1, strength: 1 };
  const COL = ['#ff2266', '#ffaa00', '#b87a00', '#ffdd00', '#ddff44', '#ff66aa', '#00ff88', '#ccff99'];
  const LW = 58;   // the row names
  // the rows' settings, filled in (a partial or old setting reads as its defaults)
  const rowsCfg = () => { const x = R || view.state.rows; if (!rows.length) return null; const f = (k, d) => rows.map((_, i) => (x && Array.isArray(x[k]) && x[k][i] !== undefined && x[k][i] !== null) ? x[k][i] : d(i));
    const PAD = [0, 1, 1, 3, 4, 2, 9, 10]; return { mute: f('mute', () => false), solo: f('solo', () => false), level: f('level', () => 1), chance: f('chance', () => 0), pad: f('pad', i => PAD[i]) }; };
  const cv = UI.Canvas(520, 176); cv.style.cursor = 'crosshair'; cv.classList.add('gg-map');
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = cv.H, rh = H / 8, cw = (W - LW) / 32; g.fillStyle = '#080b10'; g.fillRect(0, 0, W, H);
    if (!map) return;
    const rc = rowsCfg(), solo = rc && rc.solo && rc.solo.some(Boolean), oneBar = view.state.loop === '1 bar';
    rows.forEach((r, i) => {
      const off = rc && (rc.mute[i] || (solo && !rc.solo[i]));
      g.globalAlpha = off ? 0.3 : 1; g.fillStyle = COL[i]; g.font = '9px monospace'; g.fillText((rc && rc.solo[i] ? 'S ' : rc && rc.mute[i] ? 'M ' : '') + r, 3, i * rh + rh / 2 + 3);
      for (let s = 0; s < 32; s++) {
        const v = map[i][s], x = LW + s * cw, y = i * rh, dim = oneBar && s >= 16;
        g.globalAlpha = (off ? 0.3 : 1) * (dim ? 0.35 : 1);
        g.fillStyle = s % 4 === 0 ? '#141c27' : '#10161f'; g.fillRect(x + 1, y + 1, cw - 2, rh - 2);
        if (v > 0) { g.fillStyle = COL[i]; g.globalAlpha *= 0.2 + 0.8 * v; g.fillRect(x + 1, y + 1 + (1 - v) * (rh - 2), cw - 2, v * (rh - 2)); }
        g.globalAlpha = 1;
        const f = flash[i + ':' + s]; if (f && performance.now() - f < 140) { g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(x + 1, y + 1, cw - 2, rh - 2); }
      }
    });
    g.globalAlpha = 1;
    if (cursor >= 0) { g.fillStyle = fillNow ? 'rgba(255,170,0,.22)' : 'rgba(255,255,255,.15)'; g.fillRect(LW + cursor * cw, 0, cw, H); }
  }, 30);
  let painting = false;
  const geo = (e) => { const r = cv.getBoundingClientRect(), lw = LW * r.width / cv.offsetWidth, cw = (r.width - lw) / 32; return { x: e.clientX - r.left, lw, row: Math.max(0, Math.min(7, Math.floor((e.clientY - r.top) / (r.height / 8)))), step: Math.max(0, Math.min(31, Math.floor((e.clientX - r.left - lw) / cw))) }; };
  const paint = (e) => { const p = geo(e); view.emit('paint', { row: p.row, step: p.step, radius: brush.size - 1, value: e.button === 2 || e.buttons === 2 ? 0 : brush.strength }); };
  cv.addEventListener('contextmenu', e => e.preventDefault());
  cv.addEventListener('pointerdown', (e) => {
    e.stopPropagation(); const p = geo(e);
    if (p.x < p.lw) { const rc = rowsCfg(); if (!rc) return; if (e.altKey) view.emit('row_set', { row: p.row, solo: !rc.solo[p.row] }); else view.emit('row_set', { row: p.row, mute: !rc.mute[p.row] }); return; }   // the names: mute / Alt solo
    painting = true; try { cv.setPointerCapture(e.pointerId); } catch (x) {} paint(e);
  });
  cv.addEventListener('pointermove', (e) => { if (painting) paint(e); });
  ['pointerup', 'pointercancel'].forEach(t => cv.addEventListener(t, () => { painting = false; }));
  view.on('map', (m) => { map = m.map; });
  view.on('state_sync', (s) => { if (s.map) map = s.map; if (s.rowNames) rows = s.rowNames; else if (Array.isArray(s.rows)) rows = s.rows; if (s.params && s.params.rows) { R = s.params.rows; paintRows(); } });
  view.bind('rows', (v) => { R = v; paintRows(); });
  view.on('hits', (x) => UI.atTime(view.ac, x.time, () => { cursor = x.step; fillNow = !!x.fill; const n = performance.now(); x.rows.forEach((on, i) => { if (on) flash[i + ':' + x.step] = n; }); }));
  const size = UI.Segmented({ options: [{ value: 1, label: '•', hint: 'small brush' }, { value: 2, label: '●', hint: 'medium brush' }, { value: 4, label: '⬤', hint: 'big brush' }], value: 1, onChange: (v) => { brush.size = +v; } });

  // PLAY
  const play = h('div', { class: 'gg-play' }, [
    h('div', { class: 'org-row', style: { justifyContent: 'space-between', margin: 0 } }, [UI.presetBar(view), h('div', { class: 'org-row', style: { margin: 0 } }, [size.el, UI.Button({ label: '🎲', hint: 'a new seed: the same map, other hits', onClick: () => view.emit('reseed', {}) }).el, UI.Button({ label: 'Clear', onClick: () => view.emit('clear', {}) }).el])]),
    cv, UI.paramPanel(view, ['style', 'energy', 'swing', 'seed'], { flat: true, size: 34 }),
    UI.hint('Paint where the drums are busy; right-click erases. Click a row name to mute it, Alt-click to solo. Wire the note out (orange dot) into Pads or Drum Forge.'),
  ]);

  // FEEL: the feel knobs, then one line per drum row
  const rowBox = h('div', { class: 'gg-rows' });
  let held = false, owed = false;   // a number being dragged: no rebuild under the hand (it repaints when let go)
  rowBox.addEventListener('pointerdown', () => { held = true; }, true);
  window.addEventListener('pointerup', () => { if (held) { held = false; if (owed) { owed = false; paintRows(); } } });
  function paintRows() {
    const rc = rowsCfg(); if (!rc || !rows.length) return; if (held) { owed = true; return; }
    rowBox.innerHTML = '';
    rowBox.appendChild(h('div', { class: 'gg-rh' }, ['row', 'mute', 'solo', 'level', 'chance', 'pad'].map(t => h('span', { text: t }))));
    rows.forEach((r, i) => {
      const tog = (k, label) => { const b = h('button', { class: 'uk-btn gg-tg' + (rc[k][i] ? ' on' : ''), text: label, title: k + ' ' + r }); b.addEventListener('click', (e) => { e.stopPropagation(); view.emit('row_set', { row: i, [k]: !rc[k][i] }); }); b.addEventListener('pointerdown', e => e.stopPropagation()); return b; };
      const lvl = UI.NumberDrag({ value: Math.round(rc.level[i] * 100), min: 0, max: 150, step: 1, format: (v) => v + '%', label: r + ' level', onChange: (v) => view.emit('row_set', { row: i, level: v / 100 }) });
      const ch = UI.NumberDrag({ value: Math.round(rc.chance[i] * 100), min: -100, max: 100, step: 1, format: (v) => (v > 0 ? '+' : '') + v + '%', label: r + ' chance', onChange: (v) => view.emit('row_set', { row: i, chance: v / 100 }) });
      const pad = UI.NumberDrag({ value: rc.pad[i] + 1, min: 1, max: 16, step: 1, format: (v) => 'pad ' + v, label: r + ' pad', onChange: (v) => view.emit('row_set', { row: i, pad: v - 1 }) });
      rowBox.appendChild(h('div', { class: 'gg-row' + (rc.mute[i] ? ' muted' : '') }, [h('b', { text: r, style: { color: COL[i] } }), tog('mute', 'M'), tog('solo', 'S'), lvl.el, ch.el, pad.el]));
    });
  }
  const feel = h('div', { class: 'gg-feel' }, [
    UI.paramPanel(view, ['humanize', 'accent', 'rolls', 'fill', 'evolve', 'loop'], { flat: true, size: 34 }),
    h('div', { class: 'mo-head' }, [h('span', { class: 'mo-cap', text: 'ROWS' }), h('span', { class: 'mo-dim', text: 'drag a number · chance makes a row busier (+) or sparser (−) than its painting · pad is the drum it plays' })]),
    rowBox,
  ]);

  // the window is the tool: Play. Feel is a tab on its page (with Motion and Perform) — his call, 3.71
  view.root.append(play);
  if (view.pageTab) view.pageTab('feel', 'Feel', feel, 'sliders-vertical');
  paintRows();
});
