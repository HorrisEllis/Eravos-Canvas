/* eravos.wobble-bass UI 3.0 — live spectrum of its own output with the wobble range / vowel formants overlaid ·
 * SHAPE editor (draw the wobble: points, bends, snap) · WUB SEQ rate roll (a rate, shape, hold or stop per step) */
OrganismFactory.reg('eravos.wobble-bass', function (view) {
  const UI = view.ui, h = UI.h;
  let vowels = null;
  const an = view.tap('out', 4096);
  const spec = UI.Spectrum(an, {
    width: 480, height: 110, color: '#ff2266',
    overlay(g, W, H) {
      const s = view.state; const X = (f) => Math.log(f / 20) / Math.log(1000) * W;
      if (s.filterMode === 'lowpass') {
        const a = X(s.cutoff), b = X(Math.min(20000, s.cutoff * Math.pow(2, s.depth)));
        g.fillStyle = 'rgba(255,34,102,.12)'; g.fillRect(a, 0, b - a, H);
        g.fillStyle = '#ff2266'; g.fillRect(a, 0, 2, H); g.font = '10px monospace'; g.fillText('closed', a + 4, 12); g.fillText('open', b - 28, 12);
      } else if (vowels) {
        const A = vowels[s.vowelA], B = vowels[s.vowelB];
        A.f.forEach((f, i) => { const xa = X(f), xb = X(B.f[i]); g.strokeStyle = '#ffaa00'; g.beginPath(); g.moveTo(xa, H - 20 - i * 18); g.lineTo(xb, H - 20 - i * 18); g.stroke(); g.fillStyle = '#ffaa00'; g.fillRect(xa - 2, H - 24 - i * 18, 4, 8); g.fillStyle = '#00d4ff'; g.fillRect(xb - 2, H - 24 - i * 18, 4, 8); });
        g.font = '11px monospace'; g.fillStyle = '#ffaa00'; g.fillText(s.vowelA, 6, 14); g.fillStyle = '#00d4ff'; g.fillText('→ ' + s.vowelB, 30, 14);
      }
    },
  });
  const divLadder = UI.divisionLadder(view, 'div'); view.bind('div', (v) => divLadder.set(v));
  const cfg = (k) => view.descriptor.config.find(c => c.key === k);
  const ctl = (k, o) => UI.paramControl(view, cfg(k), o);
  const shape = ctl('lfoShape'), mode = ctl('filterMode'), va = ctl('vowelA'), vb = ctl('vowelB');
  const sync = ctl('lfoSync'), retrig = ctl('retrig'), subOct = ctl('subOct');
  const ladderBox = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '6px', alignItems: 'center' } }, [divLadder.el]);
  // the grid ladder is in charge when Sync is on; the Free rate knob when it is off
  view.bind('lfoSync', (on) => { ladderBox.style.opacity = on ? '1' : '0.3'; ladderBox.title = on ? '' : 'Sync is off — the Free rate knob sets the speed'; });
  const kb = UI.Keyboard({ low: 33, high: 57, key: view.key, onDown: (n, v) => view.emit('audition', { note: n + 12, velocity: v, duration: 30 }), onUp: (n) => view.emit('audition_off', { note: n + 12 }) });
  view.observe('theory:key-change', (k) => kb.setKey(k));
  view.on('state_sync', (s) => { if (s.vowels) vowels = s.vowels; });
  const sec = (t) => h('div', { class: 'uk-group-title', style: { margin: '8px 0 4px' }, text: t });
  const L = view.descriptor.lib, stopEv = (e) => { e.stopPropagation(); e.preventDefault(); };

  // ---- SHAPE editor: the wobble you draw is the wobble you hear (same function the engine turns into a wave)
  const ed = UI.Canvas(480, 120); ed.style.cursor = 'crosshair'; ed.setAttribute('aria-label', 'wobble shape editor');
  let snap = true, drag = null, hover = -1;
  const pts = () => (L.cleanPts(view.state.shapePts) || [[0, -1, 0], [0.5, 1, 0]]).map(q => q.slice());
  const geo = () => { const W = ed.W, H = 120, pad = 8; return { W, H, X: (x) => pad + x * (W - 2 * pad), Y: (y) => H / 2 - y * (H / 2 - pad), ix: (px) => (px - pad) / (W - 2 * pad), iy: (py) => (H / 2 - py) / (H / 2 - pad) }; };
  const local = (e) => { const r = ed.getBoundingClientRect(); return { x: (e.clientX - r.left) * ed.W / r.width, y: (e.clientY - r.top) * 120 / r.height }; };
  const near = (P, m, G) => P.findIndex(q => Math.hypot(G.X(q[0]) - m.x, G.Y(q[1]) - m.y) < 9);
  const segAt = (P, x) => { let i = P.length - 1; while (i > 0 && P[i][0] > x) i--; return i; };
  // bend > 0 = the segment moves late; so "push the curve up" means late on a falling segment, early on a rising one
  const upSign = (P, j) => ((j + 1 < P.length ? P[j + 1][1] : P[0][1]) >= P[j][1] ? -1 : 1);
  const send = (P) => view.emit('shape_pts', { points: P });
  UI.loop(ed, () => {
    const g = ed.g; ed.fit(); const G = geo(), on = view.state.lfoShape === 'draw', P = pts(), f = L.drawFn(P);
    g.fillStyle = '#080b10'; g.fillRect(0, 0, G.W, G.H);
    for (let i = 0; i <= 16; i++) { g.strokeStyle = i % 4 ? '#121a24' : '#1e2a38'; g.beginPath(); g.moveTo(G.X(i / 16), 0); g.lineTo(G.X(i / 16), G.H); g.stroke(); }
    [-0.5, 0, 0.5].forEach(y => { g.strokeStyle = y ? '#121a24' : '#1e2a38'; g.beginPath(); g.moveTo(0, G.Y(y)); g.lineTo(G.W, G.Y(y)); g.stroke(); });
    g.fillStyle = '#5b6f84'; g.font = '9px monospace'; g.textAlign = 'right'; g.fillText('open', G.W - 3, 10); g.fillText('shut', G.W - 3, G.H - 3); g.textAlign = 'left';
    g.strokeStyle = on ? '#ff2266' : '#5a2a3a'; g.lineWidth = 2; g.beginPath();
    for (let i = 0; i <= 240; i++) { const x = i / 240, y = f(Math.min(0.9999, x)); i ? g.lineTo(G.X(x), G.Y(y)) : g.moveTo(G.X(x), G.Y(y)); } g.stroke(); g.lineWidth = 1;
    P.forEach((q, i) => { g.fillStyle = i === hover || (drag && drag.i === i) ? '#ffffff' : on ? '#ff2266' : '#7a3a4f'; g.beginPath(); g.arc(G.X(q[0]), G.Y(q[1]), i ? 5 : 6, 0, 7); g.fill(); });
    if (!on) { g.fillStyle = '#9fb3c8'; g.font = '11px sans-serif'; g.fillText('Draw a shape (or pick ✎ Draw) to hear it', G.W / 2 - 110, 16); }
  }, 30);
  ed.addEventListener('pointerdown', (e) => {
    stopEv(e); const m = local(e), G = geo(), P = pts(); let i = near(P, m, G);
    if (e.shiftKey && i < 0) { drag = { bend: segAt(P, G.ix(m.x)), y0: m.y, b0: P[segAt(P, G.ix(m.x))][2], P }; }
    else {
      if (i < 0) { if (P.length >= 32) return; const x = Math.max(0.001, Math.min(0.999, G.ix(m.x))); P.push([x, Math.max(-1, Math.min(1, G.iy(m.y))), 0]); P.sort((a, b) => a[0] - b[0]); i = P.findIndex(q => q[0] === x); send(P); }
      drag = { i, P };
    }
    try { ed.setPointerCapture(e.pointerId); } catch (_) {}
  });
  ed.addEventListener('pointermove', (e) => {
    const m = local(e), G = geo();
    if (!drag) { const h0 = hover; hover = near(pts(), m, G); if (h0 !== hover) ed.style.cursor = hover >= 0 ? 'grab' : 'crosshair'; return; }
    const P = drag.P;
    if (drag.bend !== undefined) { P[drag.bend][2] = Math.max(-1, Math.min(1, +(drag.b0 + upSign(P, drag.bend) * (drag.y0 - m.y) / 60).toFixed(2))); return send(P); }
    let x = G.ix(m.x), y = Math.max(-1, Math.min(1, G.iy(m.y)));
    if (snap) { x = Math.round(x * 32) / 32; y = Math.round(y * 8) / 8; }
    const i = drag.i, lo = i ? P[i - 1][0] + 0.004 : 0, hi = i < P.length - 1 ? P[i + 1][0] - 0.004 : 0.999;
    P[i][0] = i ? Math.max(lo, Math.min(hi, x)) : 0; P[i][1] = y; send(P);
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => ed.addEventListener(t, () => { drag = null; }));
  ed.addEventListener('dblclick', (e) => { stopEv(e); const P = pts(), i = near(P, local(e), geo()); if (i > 0 && P.length > 2) { P.splice(i, 1); send(P); } });
  ed.addEventListener('wheel', (e) => { stopEv(e); const P = pts(), j = segAt(P, geo().ix(local(e).x)); P[j][2] = Math.max(-1, Math.min(1, +(P[j][2] - upSign(P, j) * Math.sign(e.deltaY) * 0.1).toFixed(2))); send(P); }, { passive: false });
  const STARTS = {
    Yoi: [[0, -1, 0.5], [0.2, 1, 0], [0.42, 0.15, -0.4], [0.55, 0.55, 0.3], [0.62, 0.1, 0]],
    Talk: [[0, -1, -0.5], [0.25, 0.6, 0.4], [0.4, -0.2, -0.3], [0.6, 0.9, 0.5], [0.8, -0.6, 0]],
    Saw: [[0, 1, 0.3], [0.97, -1, 0]],
    Hiccup: [[0, -1, 0], [0.06, 1, 0], [0.25, -0.4, -0.6], [0.5, -1, 0], [0.53, 0.8, 0], [0.62, -1, 0]],
    Stair: [[0, -1, 0], [0.25, -0.33, 0], [0.5, 0.33, 0], [0.75, 1, 0]],
    Gate: [[0, 1, 0], [0.45, 1, 0], [0.5, -1, 0], [0.95, -1, 0]],
  };
  const snapB = UI.Button({ label: 'Snap ✓', hint: 'snap points to 1/32 of the cycle and 1/8 of the range', onClick: () => { snap = !snap; snapB.set(snap ? 'Snap ✓' : 'Snap'); } });
  const shapeRow = h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '4px', margin: '4px 0 0' } },
    Object.keys(STARTS).map(n => UI.Button({ label: n, hint: 'start the drawn shape from ' + n, onClick: () => send(STARTS[n]) }).el).concat([snapB.el]));

  // ---- WUB SEQ rate roll: rows are rates (fast at the top), one column per step; a click sets it, the same click clears it
  const ROWS = ['1/32', '1/16t', '1/16', '1/8t', '1/8', '1/4t', '1/4', '1/2', '1/1', 'x'], RH = 13, SH = 16;
  const SHORT = { '': '·', sine: '∿', sawdown: '⩘', square: '⊓', yoy: 'y', draw: '✎' }, CYCLE = ['', 'sine', 'sawdown', 'square', 'yoy', 'draw'];
  const roll = UI.Canvas(480, ROWS.length * RH + SH + 2); roll.setAttribute('aria-label', 'wub sequence: a wobble rate per step');
  const cells = () => { const c = (view.state.wubSeq || []).slice(0, 16); while (c.length < 16) c.push(''); return c.map(String); };
  let playStep = -1, paint = null;
  view.observe('transport:tick', (t) => { const len = { '1/16': 1, '1/8': 2, '1/4': 4, '1/2': 8, '1/1': 16 }[view.state.wubStep] || 4; playStep = Math.floor(t.step16 / len) % Math.max(1, view.state.wubLen || 8); });
  view.observe('transport:stop', () => { playStep = -1; });
  const rgeo = () => { const W = roll.W, lab = 34, cw = (W - lab) / 16; return { W, lab, cw, col: (px) => Math.floor((px - lab) / cw), row: (py) => Math.floor(py / RH) }; };
  UI.loop(roll, () => {
    const g = roll.g; roll.fit(); const G = rgeo(), C = cells(), n = view.state.wubLen || 8, on = !!view.state.wubOn, H = ROWS.length * RH;
    g.fillStyle = '#080b10'; g.fillRect(0, 0, G.W, H + SH + 2);
    ROWS.forEach((r, j) => { g.fillStyle = r === 'x' ? '#ff6b6b' : '#7f93a8'; g.font = '9px monospace'; g.fillText(r === 'x' ? 'stop' : r, 2, j * RH + 10); });
    for (let i = 0; i < 16; i++) {
      const x = G.lab + i * G.cw, live = i < n, cell = L.parseCell(C[i]);
      g.fillStyle = i === playStep && on ? '#1c2b3c' : i % 4 ? '#0c121a' : '#101823'; g.fillRect(x + 1, 0, G.cw - 2, H);
      if (cell) { const j = cell.stop ? ROWS.length - 1 : ROWS.indexOf(cell.div); g.fillStyle = !live ? '#2a2f38' : cell.stop ? '#ff6b6b' : on ? '#ff2266' : '#8a3a52'; g.fillRect(x + 2, j * RH + 1, G.cw - 4, RH - 2); }
      else if (live) { g.fillStyle = '#2a3a4c'; g.fillRect(x + G.cw / 2 - 1, H / 2 - 1, 2, 2); }
      const sh = (cell && cell.shape) || ''; g.fillStyle = live ? (sh ? '#ffaa00' : '#3a4a5c') : '#20262e'; g.font = '11px monospace'; g.fillText(SHORT[sh], x + G.cw / 2 - 4, H + 13);
      if (!live) { g.fillStyle = 'rgba(8,11,16,.6)'; g.fillRect(x, 0, G.cw, H + SH); }
    }
  }, 30);
  const setCell = (i, v) => { const C = cells(); if (C[i] === v) return; C[i] = v; view.emit('wub_seq', { cells: C }); };
  roll.addEventListener('pointerdown', (e) => {
    stopEv(e); const r = roll.getBoundingClientRect(), G = rgeo(), px = (e.clientX - r.left) * roll.W / r.width, py = (e.clientY - r.top) * roll.H / r.height, i = G.col(px), j = G.row(py);
    if (i < 0 || i > 15) return; const C = cells(), cur = L.parseCell(C[i]);
    if (j >= ROWS.length) { const sh = (cur && cur.shape) || '', nx = CYCLE[(CYCLE.indexOf(sh) + 1) % CYCLE.length]; if (cur && cur.div) setCell(i, cur.div + (nx ? ':' + nx : '')); return; }
    const row = ROWS[j], v = row === 'x' ? 'x' : row + (cur && cur.shape ? ':' + cur.shape : ''), same = cur && (row === 'x' ? cur.stop : cur.div === row);
    paint = same ? '' : row; setCell(i, same ? '' : v); try { roll.setPointerCapture(e.pointerId); } catch (_) {}
  });
  roll.addEventListener('pointermove', (e) => {
    if (paint === null) return; const r = roll.getBoundingClientRect(), i = rgeo().col((e.clientX - r.left) * roll.W / r.width);
    if (i >= 0 && i < 16) { const cur = L.parseCell(cells()[i]); setCell(i, paint === '' ? '' : paint === 'x' ? 'x' : paint + (cur && cur.shape ? ':' + cur.shape : '')); }
  });
  ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(t => roll.addEventListener(t, () => { paint = null; }));
  const shift = (k) => { const i = L.DIVS; view.emit('wub_seq', { cells: cells().map(c => { const p = L.parseCell(c); if (!p || p.stop) return c; const j = Math.max(0, Math.min(i.length - 1, i.indexOf(p.div) + k)); return i[j] + (p.shape ? ':' + p.shape : ''); }) }); };
  let seed = 1;
  const rnd = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  const FILLS = {
    Riddim: ['1/4', '', '1/8', '', '1/16', '', '1/8t', 'x'],
    Stair: ['1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'],
    Brostep: ['1/8:yoy', '1/16', 'x', '1/8t:yoy', '1/4', '1/32', 'x', '1/16:square'],
    Halftime: ['1/2', '', '', '', '1/4t', '', '1/8', 'x'],
  };
  const fill = (a) => { const c = a.concat(Array(16 - a.length).fill('')); view.emit('wub_seq', { cells: c, on: true }); };
  const seqBtns = h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '4px', margin: '4px 0 0' } }, Object.keys(FILLS).map(n => UI.Button({ label: n, hint: 'write the ' + n + ' wub rhythm (and turn the sequence on)', onClick: () => fill(FILLS[n]) }).el).concat([
    UI.Button({ label: '🎲 Tear', hint: 'a new seeded tearout rhythm — press again for another', onClick: () => { seed = (seed * 7 + 13) % 997 + 1; const R = ['1/4', '1/8', '1/8t', '1/16', '1/16t', '1/32', 'x', '']; fill(Array.from({ length: 8 }, () => { const r = R[Math.floor(rnd() * R.length)], sh = rnd() < 0.3 ? ':' + ['yoy', 'square', 'draw'][Math.floor(rnd() * 3)] : ''; return r && r !== 'x' ? r + sh : r; })); } }).el,
    UI.Button({ label: 'Faster', hint: 'every step one rate faster', onClick: () => shift(1) }).el,
    UI.Button({ label: 'Slower', hint: 'every step one rate slower', onClick: () => shift(-1) }).el,
    UI.Button({ label: '1–8 → 9–16', hint: 'copy the first 8 steps onto steps 9–16', onClick: () => { const C = cells(); view.emit('wub_seq', { cells: C.slice(0, 8).concat(C.slice(0, 8)) }); } }).el,
    UI.Button({ label: 'Clear', hint: 'every step holds (the wobble keeps rolling)', onClick: () => view.emit('wub_seq', { cells: Array(16).fill('') }) }).el,
  ]));
  const wubOn = ctl('wubOn'), wubLen = ctl('wubLen', { size: 28 }), wubStep = ctl('wubStep');
  view.root.append(
    h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view), shape.el]),
    spec,
    sec('WOBBLE RATE'),
    h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '6px', margin: 0 } }, [ladderBox, sync.el, retrig.el]),
    sec('SHAPE — drag points · click to add · double-click removes · shift-drag or wheel bends a segment'),
    ed, shapeRow,
    sec('WUB SEQ — a rate per step (fast at the top) · bottom row: that step\'s shape · on = notes play pitch only'),
    h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '6px', margin: 0, alignItems: 'center' } }, [wubOn.el, wubLen.el, wubStep.el]),
    roll, seqBtns,
    sec('FILTER + VOWELS'),
    h('div', { class: 'org-row', style: { flexWrap: 'wrap', gap: '8px', margin: 0 } }, [mode.el, va.el, vb.el, subOct.el]),
    UI.paramPanel(view, ['depth', 'lfoHz', 'lfoPhase', 'ampMod', 'vibrato', 'cutoff', 'res', 'formantShift', 'osc2', 'sub', 'drive', 'shaper', 'spread', 'width', 'noise', 'octave', 'level', 'glide', 'attack', 'release', 'pitchDive', 'diveTime'], { size: 32 }),
    h('div', { style: { height: '6px' } }), kb.el,
    UI.hint('Sync off + Free rate = a growl that ignores the grid. Retrig off keeps the wobble rolling across notes. Dive drops into each note; Pitch wub and Vol wub ride the same LFO. Wub seq: each step restarts the wobble on the bar grid at its own rate — stop freezes it shut, an empty step holds.'),
  );
});
