/* eravos.groove-gen UI — 1.1 (3.71b/3.72b, in the look kit). The window is the tool: the pattern screen (paint where the rhythm is
 * busy; right-click erases; click a row's name to mute it, Alt-click to solo), the style strip, a knob bank (ENERGY large, swing,
 * humanize, accent, rolls, seed) and the loop / fill strips. Its page adds FEEL — a mixer strip per drum (LED mute / solo, a
 * level fader, a hit meter, chance and pad) and evolve — beside MOTION and PERFORM from the domain. */
OrganismFactory.reg('eravos.groove-gen', function (view) {
  const UI = view.ui, h = UI.h;
  let map = null, rows = [], cursor = -1, fillNow = false, R = null; const flash = {}, meter = new Array(8).fill(0);
  const brush = { size: 1, strength: 1 };
  const COL = ['#ff2266', '#ffaa00', '#b87a00', '#ffdd00', '#ddff44', '#ff66aa', '#00ff88', '#ccff99'];
  const LW = 64;   // the row names
  const cfg = (k) => (view.descriptor.config || []).find(c => c.key === k);
  const ctl = (k, o) => UI.paramControl(view, cfg(k), o || {});
  // the rows' settings, filled in (a partial or old setting reads as its defaults)
  const rowsCfg = () => { const x = R || view.state.rows; if (!rows.length) return null; const f = (k, d) => rows.map((_, i) => (x && Array.isArray(x[k]) && x[k][i] !== undefined && x[k][i] !== null) ? x[k][i] : d(i));
    const PAD = [0, 1, 1, 3, 4, 2, 9, 10]; return { mute: f('mute', () => false), solo: f('solo', () => false), level: f('level', () => 1), chance: f('chance', () => 0), pad: f('pad', i => PAD[i]) }; };

  // ---- the pattern screen
  const cv = UI.Canvas(560, 184); cv.style.cursor = 'crosshair'; cv.classList.add('gg-map');
  UI.loop(cv, () => {
    const g = cv.g, W = cv.fit().W, H = cv.H, rh = H / 8, cw = (W - LW) / 32; g.clearRect(0, 0, W, H);
    if (!map) return;
    const rc = rowsCfg(), solo = rc && rc.solo && rc.solo.some(Boolean), oneBar = view.state.loop === '1 bar', now = performance.now();
    rows.forEach((r, i) => {
      const off = rc && (rc.mute[i] || (solo && !rc.solo[i]));
      g.globalAlpha = off ? 0.3 : 1; g.fillStyle = COL[i]; g.font = '600 9px monospace';
      g.fillText((rc && rc.solo[i] ? 'S ' : rc && rc.mute[i] ? 'M ' : '') + r.toUpperCase(), 6, i * rh + rh / 2 + 3);
      for (let s = 0; s < 32; s++) {
        const v = map[i][s], x = LW + s * cw, y = i * rh, dim = oneBar && s >= 16;
        g.globalAlpha = (off ? 0.3 : 1) * (dim ? 0.35 : 1);
        g.fillStyle = s % 4 === 0 ? '#121a24' : '#0c121a'; g.fillRect(x + 1, y + 1, cw - 2, rh - 2);
        if (v > 0) { g.fillStyle = COL[i]; g.globalAlpha *= 0.25 + 0.75 * v; g.shadowColor = COL[i]; g.shadowBlur = 8 * v; g.fillRect(x + 1.5, y + 1.5 + (1 - v) * (rh - 3), cw - 3, v * (rh - 3)); g.shadowBlur = 0; }
        g.globalAlpha = 1;
        const f = flash[i + ':' + s]; if (f && now - f < 160) { g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.shadowColor = COL[i]; g.shadowBlur = 10; g.strokeRect(x + 1.5, y + 1.5, cw - 3, rh - 3); g.shadowBlur = 0; }
      }
    });
    g.globalAlpha = 1;
    if (cursor >= 0) { const x = LW + cursor * cw, c = fillNow ? '#ff2266' : '#ffaa00'; g.fillStyle = 'rgba(255,255,255,.07)'; g.fillRect(x, 0, cw, H); g.fillStyle = c; g.shadowColor = c; g.shadowBlur = 8; g.fillRect(x, 0, 2, H); g.shadowBlur = 0; }
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
  view.on('state_sync', (s) => { if (s.map) map = s.map; if (s.rowNames) rows = s.rowNames; else if (Array.isArray(s.rows)) rows = s.rows; if (s.params && s.params.rows) R = s.params.rows; paintRows(); });
  view.bind('rows', (v) => { R = v; paintRows(); });
  view.on('hits', (x) => UI.atTime(view.ac, x.time, () => { cursor = x.step; fillNow = !!x.fill; const n = performance.now(); x.rows.forEach((on, i) => { if (on) { flash[i + ':' + x.step] = n; meter[i] = 1; } }); }));

  // ---- the window: a panel with the screen, the style strip, the knob bank and the loop / fill strips
  const size = UI.Segmented({ options: [{ value: 1, label: '•', hint: 'small brush' }, { value: 2, label: '●', hint: 'medium brush' }, { value: 4, label: '⬤', hint: 'big brush' }], value: 1, onChange: (v) => { brush.size = +v; } });
  const head = (title, right) => h('div', { class: 'mo-head' }, [h('span', { class: 'mo-dot' }), h('span', { class: 'mo-cap', text: title }), h('span', { class: 'mo-rule' })].concat(right || []));
  const strip = (k, label) => { const c = ctl(k, { noLabel: true, segMax: 9 }); return h('div', { class: 'gg-strip' }, [h('div', { class: 'mo-lab', text: label }), c ? c.el : null]); };
  const play = h('div', { class: 'gg-play' }, [
    h('div', { class: 'gg-top' }, [UI.presetBar(view), h('div', { class: 'gg-tools' }, [size.el, UI.Button({ label: '🎲', hint: 'a new seed: the same painting, other hits', onClick: () => view.emit('reseed', {}) }).el, UI.Button({ label: 'Clear', hint: 'clear the painting', onClick: () => view.emit('clear', {}) }).el])]),
    h('section', { class: 'gg-sec' }, [head('Pattern', [ctl('style', { noLabel: true }).el]), cv,
      h('div', { class: 'gg-bank' }, [
        h('div', { class: 'gg-knobs' }, [ctl('energy', { big: true, size: 64 }).el, ctl('swing', { size: 44 }).el, ctl('humanize', { size: 44 }).el, ctl('accent', { size: 44 }).el, ctl('rolls', { size: 44 }).el, ctl('seed', { size: 44 }).el]),
        h('div', { class: 'gg-strips' }, [strip('loop', 'Loop'), strip('fill', 'Fill every')]),
      ])]),
    h('div', { class: 'gg-hint', text: 'PAINT WHERE IT IS BUSY · RIGHT-CLICK ERASES · CLICK A ROW NAME TO MUTE, ALT-CLICK TO SOLO' }),
  ]);

  // ---- FEEL (its page): a mixer strip per drum row, then evolve
  const rowBox = h('div', { class: 'gg-mixer' });
  let held = false, owed = false;   // a fader or number being dragged: no rebuild under the hand (it repaints when let go)
  rowBox.addEventListener('pointerdown', () => { held = true; }, true);
  window.addEventListener('pointerup', () => { if (held) { held = false; if (owed) { owed = false; paintRows(); } } });
  const meters = [];
  UI.loop(rowBox, () => { meters.forEach((m, i) => { if (!m) return; meter[i] *= 0.86; m.style.height = (meter[i] * 100).toFixed(1) + '%'; }); }, 30);
  function paintRows() {
    const rc = rowsCfg(); if (!rc || !rows.length) return; if (held) { owed = true; return; }
    rowBox.innerHTML = ''; meters.length = 0;
    rows.forEach((r, i) => {
      const led = (k, label) => UI.Toggle({ label, value: rc[k][i], hint: (k === 'mute' ? 'mute ' : 'solo ') + r, onChange: (v) => view.emit('row_set', { row: i, [k]: v }) }).el;
      const lvl = UI.Fader({ min: 0, max: 1.5, step: 0.01, value: rc.level[i], default: 1, height: 104, label: r + ' level', format: (v) => Math.round(v * 100) + '%', onChange: (v) => view.emit('row_set', { row: i, level: +v.toFixed(2) }) });
      const ch = UI.NumberDrag({ value: Math.round(rc.chance[i] * 100), min: -100, max: 100, step: 1, format: (v) => (v > 0 ? '+' : '') + v + '%', label: r + ' chance — busier (+) or sparser (−) than painted', onChange: (v) => view.emit('row_set', { row: i, chance: v / 100 }) });
      const pad = UI.NumberDrag({ value: rc.pad[i] + 1, min: 1, max: 16, step: 1, format: (v) => 'P' + v, label: r + ' — the pad it plays', onChange: (v) => view.emit('row_set', { row: i, pad: v - 1 }) });
      const m = h('i'); meters[i] = m;
      rowBox.appendChild(h('div', { class: 'gg-ch' + (rc.mute[i] ? ' muted' : ''), style: { '--acc': COL[i] } }, [
        h('b', { class: 'gg-chn', text: r }), h('div', { class: 'gg-leds' }, [led('mute', 'M'), led('solo', 'S')]),
        h('div', { class: 'gg-fd' }, [lvl.el, h('div', { class: 'gg-meter', title: 'hits' }, [m])]),
        h('div', { class: 'gg-small' }, [h('span', { class: 'mo-lab', text: 'chance' }), ch.el]), h('div', { class: 'gg-small' }, [h('span', { class: 'mo-lab', text: 'pad' }), pad.el]),
      ]));
    });
  }
  const feel = h('div', { class: 'gg-feel' }, [head('Rows', [h('span', { class: 'mo-count', text: 'LEVEL · CHANCE · PAD — EACH DRUM ITS OWN' })]), rowBox,
    head('Evolve', [h('span', { class: 'mo-count', text: 'THE SAME PAINTING, NEW HITS EVERY N BARS' })]), h('div', { class: 'gg-strips row' }, [strip('evolve', 'Evolve every')])]);

  view.root.append(play);
  if (view.pageTab) view.pageTab('feel', 'Feel', feel, 'sliders-vertical');
  paintRows();
});
