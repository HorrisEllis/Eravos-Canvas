/* eravos.timeline — piano roll (P9 · G-02) + DRUM LANES (P11 gate D). Own UI area (own file + timeline.pianoroll.css).
 * When the track plays a drum tool (anything that announces its pads on pad:bank-change), the rows are that tool's pads
 * by name — kick, snare, hat … — not piano keys; no scale lock, clicks add hits, up/down moves a hit to another pad.
 * Edits a note clip; every change goes out through the timeline's ui_hooks (clip_edit, clip_fill, note_audition, seek).
 * Notes: {s: step16 from clip start, l: steps, n: midi, v: 0..1}. Scale rows shaded from the song key.
 * 3.48 PRECISION (timeline.spec § 3.48 P1–P2):
 *   P1 a hover GHOST shows exactly where a click lands (and the toolbar reads bar.beat.tick + the note) · a click adds,
 *      a drag only starts past a 4 px dead zone, and every move/resize snaps from where the note started (no floor-then-
 *      round drift) · grids 1/4 … 1/64, triplets, off (1/128) · Alt held = no snap · row height 6–28 px · continuous
 *      zoom (Ctrl+wheel keeps the spot under the pointer) · fit · a bar/beat RULER (click = move the playhead)
 *   P2 tools: ✎ Draw (1) · 🖌 Paint (2: drag = one note per grid cell along the path) · ✂ Split (3) · ⌫ Erase (4: drag
 *      deletes what it crosses) · resize from BOTH edges (edge zone = max(4 px, 25 % of the note)) · new notes take the
 *      last length you drew or resized ("Length: last") */
(function (global) {
  'use strict';
  const DROW = 20, KEYW = 46, DKEYW = 96, LO = 24, HI = 107, RULER = 18; // C1 … B7 (piano) · pads (drums)
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const BLACK = new Set([1, 3, 6, 8, 10]);
  // grid values in 1/16 steps; 0 = off (free, 1/128 note = 1/8 step)
  const GRIDS = [['4', '1/4', 4], ['2', '1/8', 2], ['1', '1/16', 1], ['0.5', '1/32', 0.5], ['0.25', '1/64', 0.25],
    ['8t', '1/8 triplet', 4 / 3], ['16t', '1/16 triplet', 2 / 3], ['32t', '1/32 triplet', 1 / 3], ['off', 'off (free)', 0]];
  const FREE = 0.125, DEAD = 4, PPS_MIN = 4, PPS_MAX = 96;
  const mod = (a, n) => ((a % n) + n) % n;
  const clampN = (v, a, b) => Math.max(a, Math.min(b, v));
  const q = (v) => Math.round(v * 192) / 192;   // the engine's resolution (1/192 step: exact for 1/64 and every triplet)
  /* 3.33 hit-test RCA ("position is off sometimes, can't click it"): the timeline/piano-roll canvases live inside a
   * CanvasWM window whose world is CSS-transformed (translate + scale(view.z)). getBoundingClientRect() is in SCREEN px
   * (already × z) while every draw/hit coordinate is in the canvas' CSS (layout) px — so `clientX - rect.left` was off by a
   * factor of z (z 0.6 → clicks landed at 60 % of the intended x, z 1.4 → 140 %). Map client → content by the live rect
   * against the element's own layout size (offsetWidth/Height: untouched by transforms, = the size drawn in), so any zoom,
   * pan, window move, scroll or devicePixelRatio maps the same. */
  // the zoom-safe mapping is shared by every tool (runtime/ui-kit.js)
  const mapPoint = global.UIKit.mapPoint, toContent = global.UIKit.toContent;

  function create(view, opts) {
    const UI = view.ui, h = UI.h, MT = global.MusicTheory;
    let clip = null, lane = null, key = { root: 0, scale: 'minor' }, notes = [], drag = null, playStep = null, sel = -1, openedId = null;
    let grid = 1, len = 0, lastLen = 4, stamp = 'note', lock = true, pps = 14, prow = 11, progs = [], styles = [], tool = 'draw', ghost = null;
    // row model: piano = every note HI…LO; drums = the target's pads (top = pad 1)
    let drums = null, ROW = prow, rowNotes = [], KW = KEYW;
    const PIANO_ROWS = []; for (let n = HI; n >= LO; n--) PIANO_ROWS.push(n);
    function setMode(pads) {
      drums = pads && pads.length ? pads : null; ROW = drums ? DROW : prow; KW = drums ? DKEYW : KEYW;
      rowNotes = drums ? drums.map(p => p.note) : PIANO_ROWS;
      el.classList.toggle('drums', !!drums);
      [stampSel, lockT, progSel, styleSel, voiceSel, fillBtn, rowSel].forEach(c => { c.el.style.display = drums ? 'none' : ''; });
      if (drums && len === 0) lastLen = 1;
    }
    // ---- toolbar
    const title = h('span', { class: 'tlpr-title', text: '' });
    const bars = UI.NumberDrag({ label: 'bars', min: 1, max: 128, step: 1, value: 4, suffix: ' bars', onChange: (v) => clip && view.emit('clip_edit', { id: clip.id, patch: { bars: v } }) });
    const tools = [['draw', '✎', 'Draw (1) — click adds, drag moves, drag an edge to stretch'], ['paint', '🖌', 'Paint (2) — drag across the grid: one note per grid cell, following the pointer'],
      ['split', '✂', 'Split (3) — click a note to cut it at the grid line'], ['erase', '⌫', 'Erase (4) — click or drag across notes to delete them']];
    const toolBtns = tools.map(([id, icon, hint]) => { const b = h('button', { class: 'tlpr-tool', title: hint, 'aria-label': hint, 'data-tool': id, text: icon }); b.addEventListener('click', (e) => { e.stopPropagation(); setTool(id); }); return b; });
    const toolBox = h('span', { class: 'tlpr-tools', role: 'group', 'aria-label': 'note tools' }, toolBtns);
    function setTool(t) { tool = t; toolBtns.forEach(b => b.classList.toggle('on', b.dataset.tool === t)); cv.dataset.tool = t; ghost = null; draw(); }
    const gridSel = UI.Select({ label: 'Grid', hint: 'snap — hold Alt to place freely', options: GRIDS.map(([v, l]) => ({ value: v, label: l })), value: '1', onChange: (v) => { grid = GRIDS.find(g => g[0] === String(v))[2]; draw(); } });
    const lenSel = UI.Select({ label: 'Length', hint: '"last" = the length of the last note you drew or stretched', options: [{ value: '0', label: 'last' }, { value: '0.25', label: '1/64' }, { value: '0.5', label: '1/32' }, { value: '1', label: '1/16' }, { value: '2', label: '1/8' }, { value: '4', label: '1/4' }, { value: '8', label: '1/2' }, { value: '16', label: '1 bar' }], value: '0', onChange: (v) => { len = +v; } });
    const stampSel = UI.Select({ label: 'Click adds', options: [{ value: 'note', label: 'note' }, { value: 'triad', label: 'triad' }, { value: 'seventh', label: '7th chord' }, { value: 'add9', label: 'add9 chord' }, { value: 'sus2', label: 'sus2 chord' }, { value: 'power', label: 'power' }], value: 'note', onChange: (v) => { stamp = v; } });
    const lockT = UI.Toggle({ label: 'Scale lock', value: true, onChange: (v) => { lock = v; } });
    const zoomSel = UI.Select({ label: 'Zoom', hint: 'Ctrl+wheel zooms smoothly', options: [{ value: '8', label: 'S' }, { value: '14', label: 'M' }, { value: '22', label: 'L' }, { value: '40', label: 'XL' }, { value: 'fit', label: 'fit clip' }], value: '14', onChange: (v) => { if (v === 'fit') fit(); else zoomTo(+v); } });
    const rowSel = UI.Select({ label: 'Rows', hint: 'row height — Ctrl+Shift+wheel', options: [{ value: '7', label: 'S' }, { value: '11', label: 'M' }, { value: '16', label: 'L' }, { value: '24', label: 'XL' }], value: '11', onChange: (v) => setRow(+v) });
    const progSel = UI.Select({ label: 'Fill', options: [{ value: 'anthem', label: 'Anthem 1–6–3–7' }], value: 'anthem', onChange: () => {} });
    const styleSel = UI.Select({ options: [{ value: 'future', label: 'Future-bass chops' }], value: 'future', onChange: () => {} });
    const voiceSel = UI.Select({ options: ['add9', 'seventh', 'triad', 'sus2', 'power', 'single'].map(v => ({ value: v, label: v === 'seventh' ? '7th' : v === 'single' ? 'root only (synth plays chord)' : v })), value: 'add9', onChange: () => {} });
    const fillBtn = UI.Button({ label: '✦ Fill', hint: 'replace this clip with a chord progression in the song key', onClick: () => { if (clip && (!notes.length || confirm('Replace the notes in this clip?'))) view.emit('clip_fill', { id: clip.id, progression: progSel.get(), style: styleSel.get(), voicing: voiceSel.get() }); } });
    const clearBtn = UI.Button({ label: 'Clear', kind: 'danger', onClick: () => { if (clip && notes.length && confirm('Delete every note in this clip?')) commit([]); } });
    const closeBtn = UI.Button({ label: '×', hint: 'close piano roll', onClick: () => { hide(); if (opts && opts.onClose) opts.onClose(); } });
    const readout = h('span', { class: 'tlpr-pos', 'aria-live': 'polite', text: '' });
    const bar = h('div', { class: 'tlpr-bar' }, [title, bars.el, h('span', { class: 'tlpr-sep' }), toolBox, gridSel.el, lenSel.el, stampSel.el, lockT.el, zoomSel.el, rowSel.el, readout, h('span', { class: 'tlpr-sep' }), progSel.el, styleSel.el, voiceSel.el, fillBtn.el, clearBtn.el, closeBtn.el]);
    const keys = document.createElement('canvas'); keys.className = 'tlpr-keys';
    const ruler = document.createElement('canvas'); ruler.className = 'tlpr-ruler';
    const cv = document.createElement('canvas'); cv.className = 'tlpr-grid'; cv.tabIndex = 0; cv.setAttribute('role', 'application'); cv.setAttribute('aria-label', 'Note grid — 1 draw, 2 paint, 3 split, 4 erase; click to add, drag to move, drag an edge to stretch, arrow keys move the selected note, Delete removes it; hold Alt for no snap');
    const corner = h('div', { class: 'tlpr-corner' });
    const keyCol = h('div', { class: 'tlpr-keycol' }, [corner, keys]);
    const gridCol = h('div', { class: 'tlpr-gridcol' }, [ruler, cv]);
    const scroll = h('div', { class: 'tlpr-scroll' }, [keyCol, gridCol]);
    const el = h('div', { class: 'tlpr' }, [bar, scroll]);

    const Hh = () => rowNotes.length * ROW;
    const steps = () => clip ? clip.bars * 16 : 64;
    const yOf = (n) => { const i = rowNotes.indexOf(n); return (i < 0 ? (drums ? rowNotes.length : HI - n) : i) * ROW; };
    const nOf = (y) => rowNotes[Math.max(0, Math.min(rowNotes.length - 1, Math.floor(y / ROW)))];
    const inScale = (n) => drums ? true : MT.inScale(n, key.root, key.scale);
    const g0 = (e) => (e && e.altKey) ? 0 : grid;                       // the grid in force for this gesture
    const cellOf = (st, g) => g ? Math.floor(st / g + 1e-9) * g : Math.floor(st / FREE) * FREE;   // the cell the pointer is in
    const snapTo = (st, g) => g ? Math.round(st / g) * g : Math.round(st / FREE) * FREE;          // the nearest grid line
    const newLen = () => len || lastLen;
    function size(c, W, H) { const dpr = Math.min(2, devicePixelRatio || 1); if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; } const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return g; }
    function drawKeys() {
      const g = size(keys, KW, Hh()); corner.style.width = KW + 'px'; corner.style.height = RULER + 'px';
      if (drums) { // pad names, in the pad's own colour
        drums.forEach((p, i) => { const y = i * ROW; g.fillStyle = i % 2 ? '#111821' : '#141c27'; g.fillRect(0, y, KW, ROW - 1); g.fillStyle = p.color || '#00ff88'; g.fillRect(0, y, 4, ROW - 1); g.fillStyle = '#d7e0ea'; g.font = '11px sans-serif'; g.fillText(String(p.name || 'pad').slice(0, 12), 8, y + ROW - 6); g.fillStyle = '#5d6b7a'; g.font = '9px monospace'; g.fillText(String(i + 1), KW - 16, y + ROW - 6); });
        return;
      }
      for (let n = LO; n <= HI; n++) {
        const y = yOf(n), pc = mod(n, 12), blk = BLACK.has(pc);
        g.fillStyle = mod(n - key.root, 12) === 0 ? (lane ? lane.color : '#00d4ff') : blk ? '#10161e' : '#d7e0ea';
        if (!inScale(n) && !blk) g.fillStyle = '#6d7680';
        if (ghost && ghost.n === n) g.fillStyle = '#ffd24a';
        g.fillRect(0, y, KEYW, ROW - 1);
        if (ROW >= 9 && (pc === 0 || mod(n - key.root, 12) === 0 || ROW >= 16)) { g.fillStyle = blk ? '#aaa' : '#111'; g.font = Math.min(11, ROW - 2) + 'px monospace'; g.fillText(NAMES[pc] + (Math.floor(n / 12) - 1), 3, y + ROW - 2); }
      }
    }
    function drawRuler(W) {
      const g = size(ruler, W, RULER), st = steps();
      g.fillStyle = '#0d1520'; g.fillRect(0, 0, W, RULER); g.fillStyle = '#223044'; g.fillRect(0, RULER - 1, W, 1);
      g.font = '10px monospace';
      for (let s = 0; s <= st; s++) {
        const x = s * pps, barLine = s % 16 === 0, beat = s % 4 === 0;
        if (barLine) { g.fillStyle = '#7f9bbd'; g.fillRect(x, 0, 1, RULER); if (s < st) g.fillText(String((clip ? clip.startBar : 1) + s / 16), x + 3, 11); }
        else if (beat && pps * 4 >= 14) { g.fillStyle = '#3d5575'; g.fillRect(x, RULER - 7, 1, 6); if (pps * 4 >= 40) { g.fillStyle = '#5d7590'; g.fillText('.' + (s % 16 / 4 + 1), x + 2, 11); } }
        else if (pps >= 10) { g.fillStyle = '#26364a'; g.fillRect(x, RULER - 4, 1, 3); }
      }
      if (playStep !== null && playStep >= 0 && playStep <= st) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(playStep * pps - 5, 0); g.lineTo(playStep * pps + 5, 0); g.lineTo(playStep * pps, 7); g.fill(); }
    }
    function draw() {
      if (!clip) return;
      const st = steps(), W = Math.max(200, st * pps), H = Hh();
      const g = size(cv, W, H);
      if (drums) rowNotes.forEach((n, i) => { g.fillStyle = i % 2 ? '#0e141c' : '#111822'; g.fillRect(0, i * ROW, W, ROW); g.fillStyle = '#0a0f15'; g.fillRect(0, i * ROW + ROW - 1, W, 1); });
      else for (let n = LO; n <= HI; n++) {
        const y = yOf(n), pc = mod(n, 12);
        g.fillStyle = mod(n - key.root, 12) === 0 ? '#16243a' : inScale(n) ? (BLACK.has(pc) ? '#101822' : '#131d29') : '#0a0e14';
        g.fillRect(0, y, W, ROW); g.fillStyle = pc === 0 ? '#2d3f57' : '#0f1620'; g.fillRect(0, y + ROW - 1, W, 1);
      }
      // the grid in force: its own lines (faint) where they are at least 5 px apart, beats and bars on top
      const gs = grid || FREE;
      if (gs * pps >= 5 && gs !== 1 && gs !== 4) { g.fillStyle = '#121a25'; for (let s = 0; s <= st + 1e-9; s += gs) g.fillRect(Math.round(s * pps), 0, 1, H); }
      for (let s = 0; s <= st; s++) { g.fillStyle = s % 16 === 0 ? '#3d5575' : s % 4 === 0 ? '#1f2d40' : '#141d29'; if (pps >= 10 || s % 4 === 0) g.fillRect(s * pps, 0, 1, H); }
      const col = lane ? lane.color : '#ff66cc';
      notes.forEach((nt, i) => {
        if (drums && rowNotes.indexOf(nt.n) < 0) return; // a note no pad answers to: kept in the clip, not drawn as a hit
        const x = nt.s * pps, y = yOf(nt.n), w = Math.max(3, nt.l * pps - 1);
        const c2 = drums ? ((drums[rowNotes.indexOf(nt.n)] || {}).color || col) : col;
        g.globalAlpha = 0.35 + 0.65 * nt.v; g.fillStyle = c2; g.fillRect(x + 1, y + 1, w - 1, ROW - 2); g.globalAlpha = 1;
        g.strokeStyle = i === sel ? '#fff' : '#000'; g.lineWidth = 1; g.strokeRect(x + 1.5, y + 1.5, w - 2, ROW - 3);
      });
      if (ghost && !drag) {   // where a click lands
        const x = ghost.s * pps, y = yOf(ghost.n), w = Math.max(3, ghost.l * pps - 1);
        g.globalAlpha = 0.45; g.fillStyle = tool === 'erase' ? '#ff4d4d' : '#ffd24a'; g.fillRect(x + 1, y + 1, w - 1, ROW - 2); g.globalAlpha = 1;
        g.strokeStyle = '#ffd24a'; g.setLineDash([3, 2]); g.strokeRect(x + 1.5, y + 1.5, w - 2, ROW - 3); g.setLineDash([]);
      }
      if (ghost && ghost.split !== undefined) { g.fillStyle = '#ffd24a'; g.fillRect(ghost.split * pps, yOf(ghost.n), 2, ROW); }
      if (playStep !== null && playStep >= 0 && playStep <= st) { g.fillStyle = '#fff'; g.fillRect(playStep * pps, 0, 2, H); }
      drawRuler(W);
    }
    function commit(next) { notes = next; draw(); if (clip) view.emit('clip_edit', { id: clip.id, patch: { notes: next } }); }
    function audition(ns) { if (lane) view.emit('note_audition', { lane: lane.id, note: ns[0], notes: ns }); }
    function pitchFor(n) { return drums ? n : lock ? MT.quantize(n, key.root, key.scale) : n; }
    function stampNotes(n) {
      const p = pitchFor(n); if (drums || stamp === 'note') return [p];
      const dg = MT.degreeOf(p, key.root, key.scale); return MT.chord(dg.degree, key.root, key.scale, stamp, dg.octave);
    }
    const nameOf = (n) => { if (drums) { const p = drums[rowNotes.indexOf(n)]; return p ? p.name : String(n); } return NAMES[mod(n, 12)] + (Math.floor(n / 12) - 1); };
    // bar.beat.tick of a step (480 ticks a beat), in song bars
    const where = (s) => { const b = (clip ? clip.startBar : 1) + Math.floor(s / 16 + 1e-9), beat = Math.floor(mod(s, 16) / 4 + 1e-9) + 1, tick = Math.round(mod(s, 4) * 120) % 480; return `${b}.${beat}.${String(tick).padStart(3, '0')}`; };
    function say(s, n, extra) { readout.textContent = s === null ? '' : `${where(s)} · ${nameOf(n)}${extra ? ' · ' + extra : ''}`; }
    const local = (e) => toContent(cv, e.clientX, e.clientY);
    function hit(x, y) { const n = nOf(y), st = x / pps; for (let i = notes.length - 1; i >= 0; i--) { const a = notes[i]; if (a.n === n && st >= a.s && st <= a.s + a.l) return i; } return -1; }
    // which part of a note the pointer is on: 'L' / 'R' edge (max 4 px, 25 % of the note) or the body
    function zone(i, x) { const a = notes[i], x0 = a.s * pps, x1 = (a.s + a.l) * pps, z = Math.max(4, (x1 - x0) * 0.25); return x1 - x < z ? 'R' : x - x0 < z && a.l > (grid || FREE) ? 'L' : 'B'; }

    cv.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); cv.focus({ preventScroll: true }); if (!clip) return;
      const { x, y } = local(e); const i = hit(x, y), g = g0(e), st = steps();
      if (e.button === 2) { if (i >= 0) { sel = -1; commit(notes.filter((_, j) => j !== i)); } return; }
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      ghost = null;
      if (tool === 'erase') { drag = { mode: 'erase', orig: notes.slice(), x0: x, y0: y, armed: true, changed: false }; eraseAt(x, y); draw(); return; }
      if (tool === 'split') {
        if (i >= 0) { const a = notes[i], at = q(snapTo(x / pps, g)); if (at > a.s + 1e-6 && at < a.s + a.l - 1e-6) { const next = notes.slice(); next.splice(i, 1, Object.assign({}, a, { l: q(at - a.s) }), Object.assign({}, a, { s: at, l: q(a.s + a.l - at) })); sel = i + 1; commit(next); } }
        return;
      }
      if (tool === 'paint') {
        const cell = q(cellOf(x / pps, g)), n = pitchFor(nOf(y)), l = q(Math.min(g || FREE, st - cell));
        drag = { mode: 'paint', g, cells: new Set(), orig: notes.slice(), x0: x, y0: y, armed: true, changed: false };
        paintAt(cell, n, l); draw(); return;
      }
      if (i >= 0) {
        sel = i; const z = zone(i, x);
        drag = { mode: z === 'R' ? 'resize' : z === 'L' ? 'resizeL' : 'move', idx: [i], orig: notes.map(n => Object.assign({}, n)), x0: x, y0: y, armed: false, changed: false };
        if (z === 'B') audition([notes[i].n]);
      } else {
        const s = q(clampN(cellOf(x / pps, g), 0, st - (g || FREE)));
        const ps = stampNotes(nOf(y)).filter(n => drums ? rowNotes.includes(n) : (n >= LO && n <= HI));
        if (!ps.length) return;
        const add = ps.map(n => ({ s, l: q(Math.min(newLen(), st - s)), n, v: 0.85 }));
        const next = notes.concat(add); const idx = add.map((_, k) => notes.length + k);
        notes = next; sel = idx[0]; audition(ps);
        drag = { mode: 'move', idx, orig: next.map(n => Object.assign({}, n)), x0: x, y0: y, armed: false, changed: true };
      }
      draw();
    });
    function eraseAt(x, y) { const i = hit(x, y); if (i >= 0) { notes = notes.filter((_, j) => j !== i); sel = -1; drag.changed = true; } }
    function paintAt(cell, n, l) {
      if (drag.cells.has(cell) || l <= 0) return; drag.cells.add(cell);
      if (drums && !rowNotes.includes(n)) return; if (!drums && (n < LO || n > HI)) return;
      if (notes.some(a => a.n === n && Math.abs(a.s - cell) < 1e-6)) return;
      notes = notes.concat([{ s: cell, l, n, v: 0.85 }]); drag.changed = true; audition([n]);
    }
    cv.addEventListener('pointermove', (e) => {
      if (!clip) return;
      const { x, y } = local(e);
      if (drag && e.buttons === 0 && e.pointerType === 'mouse') endDrag(); // the button came up somewhere we never heard about
      if (!drag) { hover(x, y, e); return; }
      // a click is a click: nothing moves until the pointer has travelled past the dead zone
      if (!drag.armed) { if (Math.hypot(x - drag.x0, y - drag.y0) < DEAD) return; drag.armed = true; }
      cv.classList.add('move');
      const st = steps(), g = g0(e);
      if (drag.mode === 'erase') { eraseAt(x, y); draw(); return; }
      if (drag.mode === 'paint') {
        // every cell between the last point and this one (a fast drag skips none)
        const gg = e.altKey ? FREE : (drag.g || FREE), a = Math.min(drag.lastX === undefined ? drag.x0 : drag.lastX, x), b = Math.max(drag.lastX === undefined ? drag.x0 : drag.lastX, x);
        for (let c = cellOf(a / pps, gg); c <= cellOf(b / pps, gg) + 1e-9; c += gg) { const cell = q(c); if (cell >= 0 && cell < st) paintAt(cell, pitchFor(nOf(y)), q(Math.min(gg, st - cell))); }
        drag.lastX = x; draw(); say(cellOf(x / pps, gg), pitchFor(nOf(y)), 'paint'); return;
      }
      const gs = g || FREE;
      if (drag.mode === 'move') {
        // the note follows the CELL under the pointer, not the distance moved: sliding inside the cell (or the row) you
        // clicked never moves it — the old round(distance) moved it a step or a semitone on a half-cell slide
        const ds = cellOf(x / pps, gs) - cellOf(drag.x0 / pps, gs), dn = Math.floor(drag.y0 / ROW) - Math.floor(y / ROW);
        const moveN = (n) => { if (!drums) return Math.max(LO, Math.min(HI, pitchFor(n + dn))); const r = rowNotes.indexOf(n); return r < 0 ? n : rowNotes[Math.max(0, Math.min(rowNotes.length - 1, r - dn))]; };
        drag.idx.forEach(i => { const o = drag.orig[i]; const s = q(clampN(o.s + ds, 0, st - FREE)); notes[i] = Object.assign({}, o, { s, l: q(Math.min(o.l, st - s)), n: moveN(o.n) }); });
        if (ds || dn) drag.changed = true;
        const a = notes[drag.idx[0]]; say(a.s, a.n);
      } else if (drag.mode === 'resize') {
        drag.idx.forEach(i => { const o = drag.orig[i]; const end = q(clampN(snapTo(x / pps, g), o.s + gs, st)); notes[i] = Object.assign({}, o, { l: q(Math.max(Math.min(gs, FREE * 2), end - o.s)) }); });
        drag.changed = true; const a = notes[drag.idx[0]]; say(a.s + a.l, a.n, 'end');
      } else {   // resizeL: the end stays put
        drag.idx.forEach(i => { const o = drag.orig[i], end = o.s + o.l; const s = q(clampN(snapTo(x / pps, g), 0, end - gs)); notes[i] = Object.assign({}, o, { s, l: q(end - s) }); });
        drag.changed = true; const a = notes[drag.idx[0]]; say(a.s, a.n, 'start');
      }
      draw();
    });
    function hover(x, y, e) {
      const st = steps(), i = hit(x, y), g = g0(e), n = drums ? nOf(y) : pitchFor(nOf(y));
      let gh = null;
      if (tool === 'erase') gh = i >= 0 ? Object.assign({}, notes[i]) : null;
      else if (tool === 'split') gh = i >= 0 ? { s: notes[i].s, l: notes[i].l, n: notes[i].n, split: q(snapTo(x / pps, g)) } : null;
      else if (i < 0) { const s = q(clampN(cellOf(x / pps, g), 0, st - (g || FREE))); gh = { s, l: q(Math.min(tool === 'paint' ? (g || FREE) : newLen(), st - s)), n }; }
      const z = i >= 0 && tool === 'draw' ? zone(i, x) : null;
      cv.classList.toggle('edge', z === 'R' || z === 'L');
      const keyChanged = (ghost && ghost.n) !== (gh && gh.n);
      ghost = gh; draw(); if (keyChanged) drawKeys();
      if (i >= 0) say(notes[i].s, notes[i].n, `len ${+(notes[i].l / 4).toFixed(3)} beat`); else say(gh ? gh.s : x / pps, n);
    }
    cv.addEventListener('pointerleave', () => { if (!drag && ghost) { ghost = null; draw(); drawKeys(); } readout.textContent = ''; });
    const endDrag = () => {
      cv.classList.remove('move'); if (!drag) return; const d = drag; drag = null;
      if ((d.mode === 'resize' || d.mode === 'resizeL') && d.changed) lastLen = notes[d.idx[0]].l;   // new notes take this length
      if (d.changed) commit(notes.slice()); else draw();
    };
    cv.addEventListener('pointerdown', () => { if (drag && !drag.done) drag.done = global.UIKit.drag.begin(endDrag); }); // 3.34 guard
    cv.addEventListener('pointerup', endDrag);
    // a lost capture / cancelled pointer (alt-tab, touch cancel, window torn down mid-drag) must never leave a drag armed
    cv.addEventListener('pointercancel', endDrag); cv.addEventListener('lostpointercapture', endDrag);
    cv.addEventListener('dblclick', (e) => { if (tool !== 'draw') return; const { x, y } = local(e); const i = hit(x, y); if (i >= 0) { sel = -1; commit(notes.filter((_, j) => j !== i)); } });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    // zoom that keeps the time (x) or the note (y) under the pointer where it is
    function zoomTo(p, atX) {
      const ax = atX === undefined ? scroll.scrollLeft + scroll.clientWidth / 2 - KW : atX, t = ax / pps;
      pps = clampN(p, PPS_MIN, PPS_MAX); draw();
      scroll.scrollLeft = Math.max(0, t * pps - (ax - scroll.scrollLeft));
      zoomSel.set([8, 14, 22, 40].reduce((a, b) => Math.abs(b - pps) < Math.abs(a - pps) ? b : a));   // the nearest preset
    }
    function fit() { if (!clip) return; zoomTo(Math.max(PPS_MIN, (scroll.clientWidth - KW - 4) / steps())); scroll.scrollLeft = 0; }
    function setRow(r, atY) {
      if (drums) return; const ay = atY === undefined ? scroll.scrollTop + scroll.clientHeight / 2 : atY, row = ay / ROW;
      prow = clampN(Math.round(r), 6, 28); ROW = prow; drawKeys(); draw();
      scroll.scrollTop = Math.max(0, row * ROW - (ay - scroll.scrollTop)); rowSel.set([7, 11, 16, 24].reduce((a, b) => Math.abs(b - prow) < Math.abs(a - prow) ? b : a));
    }
    cv.addEventListener('wheel', (e) => {
      const { x, y } = local(e);
      if (e.ctrlKey && e.shiftKey) { e.preventDefault(); e.stopPropagation(); setRow(ROW * (e.deltaY < 0 ? 1.15 : 1 / 1.15), y); return; }
      if (e.ctrlKey || e.metaKey) { e.preventDefault(); e.stopPropagation(); zoomTo(pps * (e.deltaY < 0 ? 1.15 : 1 / 1.15), x); return; }
      const i = hit(x, y); if (i < 0) return;
      e.preventDefault(); e.stopPropagation();
      const next = notes.slice(); next[i] = Object.assign({}, next[i], { v: Math.max(0.05, Math.min(1, next[i].v + (e.deltaY < 0 ? 0.05 : -0.05))) }); sel = i;
      notes = next; draw(); say(next[i].s, next[i].n, 'vel ' + Math.round(next[i].v * 127)); clearTimeout(cv._wt); cv._wt = setTimeout(() => commit(notes.slice()), 250);
    }, { passive: false });
    cv.addEventListener('keydown', (e) => {
      if (!e.ctrlKey && !e.metaKey && !e.altKey && ['1', '2', '3', '4'].includes(e.key)) { e.preventDefault(); e.stopPropagation(); setTool(tools[+e.key - 1][0]); return; }
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel >= 0 && notes[sel]) { e.preventDefault(); e.stopPropagation(); const i = sel; sel = -1; commit(notes.filter((_, j) => j !== i)); }
      else if (drums && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { if (sel < 0 || !notes[sel]) return; e.preventDefault(); e.stopPropagation(); const r = rowNotes.indexOf(notes[sel].n), r2 = Math.max(0, Math.min(rowNotes.length - 1, r + (e.key === 'ArrowUp' ? -1 : 1))); const next = notes.slice(); next[sel] = Object.assign({}, next[sel], { n: rowNotes[r2] }); audition([rowNotes[r2]]); commit(next); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { if (sel < 0 || !notes[sel]) return; e.preventDefault(); e.stopPropagation(); const next = notes.slice(); const d = e.key === 'ArrowUp' ? (e.shiftKey ? 12 : 1) : (e.shiftKey ? -12 : -1); let n = next[sel].n + d; if (lock && Math.abs(d) === 1) { while (!inScale(n) && n > LO && n < HI) n += d; } next[sel] = Object.assign({}, next[sel], { n: Math.max(LO, Math.min(HI, n)) }); audition([next[sel].n]); commit(next); }
    });
    keys.addEventListener('pointerdown', (e) => { e.stopPropagation(); audition([nOf(toContent(keys, e.clientX, e.clientY).y)]); });
    // the ruler: click (or drag) moves the playhead to that point of the song
    ruler.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); if (!clip) return;
      const seek = (ev) => { const s = clampN(snapTo(toContent(ruler, ev.clientX, ev.clientY).x / pps, g0(ev) || FREE), 0, steps()); view.emit('seek', { bar: clip.startBar + s / 16 }); say(s, ghost ? ghost.n : 60, 'playhead'); };
      seek(e); try { ruler.setPointerCapture(e.pointerId); } catch (_) {}
      const mv = (ev) => { if (ev.buttons) seek(ev); }, up = () => { ruler.removeEventListener('pointermove', mv); ruler.removeEventListener('pointerup', up); };
      ruler.addEventListener('pointermove', mv); ruler.addEventListener('pointerup', up);
    });

    function setOptions(sel2, list) { if (sel2.setOptions && list && list.length) sel2.setOptions(list); }
    function show(c, ln, A) {
      const first = openedId !== c.id;
      clip = c; lane = ln; openedId = c.id; if (A && A.key) key = A.key;
      const pads = ln && ln.target && A && A.drumNames ? A.drumNames[ln.target] : null;
      if (first || !!pads !== !!drums || (pads && drums && pads.map(p => p.name).join() !== drums.map(p => p.name).join())) setMode(pads);
      if (!drag) notes = (c.notes || []).map(n => Object.assign({}, n));
      if (A) { if (A.progressions && progs !== A.progressions) { progs = A.progressions; setOptions(progSel, progs); } if (A.fillStyles && styles !== A.fillStyles) { styles = A.fillStyles; setOptions(styleSel, styles); } }
      title.textContent = '🎹 ' + (ln ? ln.name : '') + ' · ' + (c.name || 'clip'); title.style.color = ln ? ln.color : '';
      if (bars.set) bars.set(c.bars);
      el.classList.add('open'); drawKeys(); draw();
      if (first) requestAnimationFrame(() => { if (drums) { scroll.scrollTop = 0; scroll.scrollLeft = 0; return; } const ps = notes.map(n => n.n); const mid = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 60 + key.root; scroll.scrollTop = Math.max(0, yOf(Math.round(mid)) - scroll.clientHeight / 2); scroll.scrollLeft = 0; });
    }
    function hide() { clip = null; openedId = null; el.classList.remove('open'); }
    function playhead(barPos) { if (!clip) return; const p = barPos === null ? null : (barPos - clip.startBar) * 16; if (p !== playStep) { playStep = p; draw(); } }
    setMode(null); setTool('draw');
    return { el, show, hide, playhead, get open() { return !!clip; }, get clipId() { return clip && clip.id; }, get drums() { return drums; },
      // for tests and the timeline's own keys: the grid/tool/zoom the roll is in, and what it holds
      get state() { return { tool, grid, len, lastLen, pps, row: ROW, notes: notes.map(n => Object.assign({}, n)) }; }, setTool, zoomTo, setRow,
      setGrid: (v) => { gridSel.set(v); grid = GRIDS.find(g => g[0] === String(v))[2]; draw(); }, canvas: cv, ruler };
  }
  global.EravosTimelinePianoRoll = { create, mapPoint, toContent, GRIDS };
})(window);
