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
 *      last length you drew or resized ("Length: last")
 *   P3 ⬚ Select (5) box select · Shift-click adds/removes · Ctrl+A · drag moves the selection (Ctrl+drag copies) ·
 *      edges stretch every selected note · Ctrl+C/X/V (paste at the pointer, else the playhead) · Ctrl+D duplicates ·
 *      ← → nudge one grid step (Shift: a bar) · ↑ ↓ semitone (Shift: octave) · Quantize (strength) · Humanize · Legato ·
 *      a VELOCITY lane under the notes (drag to draw, Ctrl-drag a ramp) · every edit is one undo step
 *   P4 double-click a note → its own KNOBS (start on the grid, length, pitch, velocity — live, one undo step) · ⏎ STEP input:
 *      computer keys Z S X D C V G B H N J M (+ Q 2 W 3 E R 5 T 6 Y 7 U an octave up) land at the step cursor, which
 *      advances by the grid; Space = rest, Backspace = back, ← → move the cursor
 * 3.56 CURVED NOTES: a note may bend — b: { from, to } semitones, shape, at — drawn as its pitch curve. 〰 Bend (6): drag
 *      a note up/down to bend its end there (from its first third: where it slides in FROM) · Alt = fine (0.1 st) ·
 *      right-click flattens it · the selection bends together. Double-click a note: its knobs, the bend's knobs and quick
 *      curves (dive, drop, rise, glide in), and any knob of the track's tool for this note only. */
(function (global) {
  'use strict';
  const DROW = 20, KEYW = 46, DKEYW = 96, LO = 24, HI = 107, RULER = 18; // C1 … B7 (piano) · pads (drums)
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const BLACK = new Set([1, 3, 6, 8, 10]);
  // grid values in 1/16 steps; 0 = off (free, 1/128 note = 1/8 step)
  const GRIDS = [['4', '1/4', 4], ['2', '1/8', 2], ['1', '1/16', 1], ['0.5', '1/32', 0.5], ['0.25', '1/64', 0.25],
    ['8t', '1/8 triplet', 4 / 3], ['16t', '1/16 triplet', 2 / 3], ['32t', '1/32 triplet', 1 / 3], ['off', 'off (free)', 0]];
  const FREE = 0.125, DEAD = 4, PPS_MIN = 4, PPS_MAX = 96, VEL = 46, TPB = 480;   // ticks per beat (a 1/16 step = 120)
  const STEPKEYS = 'zsxdcvgbhnjm', STEPKEYS2 = 'q2w3er5t6y7u';
  let CLIPBOARD = null;   // shared by every piano roll: copy in one clip, paste in another
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
    let clip = null, lane = null, key = { root: 0, scale: 'minor' }, notes = [], drag = null, playStep = null, S = new Set(), openedId = null;
    let grid = 1, len = 0, lastLen = 4, stamp = 'note', lock = true, pps = 14, prow = 11, progs = [], styles = [], tool = 'draw', ghost = null, hoverS = null, stepOn = false, cursor = 0, qStrength = 1;
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
      ['split', '✂', 'Split (3) — click a note to cut it at the grid line'], ['erase', '⌫', 'Erase (4) — click or drag across notes to delete them'],
      ['select', '⬚', 'Select (5) — drag a box; Shift adds; drag a selected note to move them all (Ctrl+drag copies)'],
      ['bend', '〰', 'Bend (6) — drag a note up or down: its pitch curves there (grab its start: it slides in from there) · Alt fine · right-click flattens']];
    const toolBtns = tools.map(([id, icon, hint]) => { const b = h('button', { class: 'tlpr-tool', title: hint, 'aria-label': hint, 'data-tool': id, text: icon }); b.addEventListener('click', (e) => { e.stopPropagation(); setTool(id); }); return b; });
    const toolBox = h('span', { class: 'tlpr-tools', role: 'group', 'aria-label': 'note tools' }, toolBtns);
    function setTool(t) { tool = t; toolBtns.forEach(b => b.classList.toggle('on', b.dataset.tool === t)); cv.dataset.tool = t; ghost = null; draw(); }
    const gridSel = UI.Select({ label: 'Grid', hint: 'snap — hold Alt to place freely', options: GRIDS.map(([v, l]) => ({ value: v, label: l })), value: '1', onChange: (v) => { grid = GRIDS.find(g => g[0] === String(v))[2]; draw(); } });
    const lenSel = UI.Select({ label: 'Length', hint: '"last" = the length of the last note you drew or stretched', options: [{ value: '0', label: 'last' }, { value: '0.25', label: '1/64' }, { value: '0.5', label: '1/32' }, { value: '1', label: '1/16' }, { value: '2', label: '1/8' }, { value: '4', label: '1/4' }, { value: '8', label: '1/2' }, { value: '16', label: '1 bar' }], value: '0', onChange: (v) => { len = +v; } });
    const stampSel = UI.Select({ label: 'Click adds', options: [{ value: 'note', label: 'note' }, { value: 'triad', label: 'triad' }, { value: 'seventh', label: '7th chord' }, { value: 'add9', label: 'add9 chord' }, { value: 'sus2', label: 'sus2 chord' }, { value: 'power', label: 'power' }], value: 'note', onChange: (v) => { stamp = v; } });
    const lockT = UI.Toggle({ label: 'Scale lock', value: true, onChange: (v) => { lock = v; } });
    const zoomSel = UI.Select({ label: 'Zoom', hint: 'Ctrl+wheel zooms smoothly', options: [{ value: '8', label: 'S' }, { value: '14', label: 'M' }, { value: '22', label: 'L' }, { value: '40', label: 'XL' }, { value: 'fit', label: 'fit clip' }], value: '14', onChange: (v) => { if (v === 'fit') fit(); else zoomTo(+v); } });
    // 3.53 EXPRESSION LANE — the lane under the notes draws velocity, or ANY knob of this track's tool, per note (note.p[knob]):
    // that note plays with that value (the tool takes it for the note's length, then hands back to its own knob — sdk-music
    // ctx.onNote). Drag draws, Ctrl-drag ramps, right-click hands a note back to the knob (a faint ghost = "uses the knob").
    let knobsAll = {}, xk = null, VH = VEL;
    const laneSel = UI.Select({ label: 'Lane', hint: 'what the lane under the notes draws — velocity, or any knob of this track’s tool, per note', options: [{ value: '', label: 'velocity' }], value: '', onChange: (v) => setLane(v) });
    function setLane(v) { const list = (lane && knobsAll[lane.target]) || []; xk = list.find(k => k.key === v) || null; VH = xk ? 72 : VEL; vcorner.textContent = xk ? xk.label : 'vel'; vcorner.title = xk ? xk.label + ' per note — right-click a bar: back to the knob' : 'velocity'; if (laneSel.select.value !== (xk ? xk.key : '')) laneSel.set(xk ? xk.key : ''); draw(); }
    const xFrac = (k, v) => k.type === 'enum' ? (k.options.length > 1 ? Math.max(0, k.options.map(String).indexOf(String(v))) / (k.options.length - 1) : 0) : clampN((+v - k.min) / ((k.max - k.min) || 1), 0, 1);
    const xVal = (k, f) => { f = clampN(f, 0, 1); if (k.type === 'enum') return k.options[Math.round(f * (k.options.length - 1))]; let v = k.min + f * (k.max - k.min); if (k.type === 'integer') v = Math.round(v); else if (k.step) v = Math.round(v / k.step) * k.step; return +clampN(v, k.min, k.max).toFixed(6); };
    const xSay = (k, v) => k.label + ' ' + (k.type === 'enum' ? String(v) : (Math.abs(v) >= 100 ? Math.round(v) : +(+v).toFixed(2)) + (k.unit ? ' ' + k.unit : ''));
    const xHas = (nt) => !!(xk && nt.p && nt.p[xk.key] !== undefined);
    const rowSel = UI.Select({ label: 'Rows', hint: 'row height — Ctrl+Shift+wheel', options: [{ value: '7', label: 'S' }, { value: '11', label: 'M' }, { value: '16', label: 'L' }, { value: '24', label: 'XL' }], value: '11', onChange: (v) => setRow(+v) });
    const progSel = UI.Select({ label: 'Fill', options: [{ value: 'anthem', label: 'Anthem 1–6–3–7' }], value: 'anthem', onChange: () => {} });
    const styleSel = UI.Select({ options: [{ value: 'future', label: 'Future-bass chops' }], value: 'future', onChange: () => {} });
    const voiceSel = UI.Select({ options: ['add9', 'seventh', 'triad', 'sus2', 'power', 'single'].map(v => ({ value: v, label: v === 'seventh' ? '7th' : v === 'single' ? 'root only (synth plays chord)' : v })), value: 'add9', onChange: () => {} });
    const fillBtn = UI.Button({ label: '✦ Fill', hint: 'replace this clip with a chord progression in the song key', onClick: () => { if (clip && (!notes.length || confirm('Replace the notes in this clip?'))) view.emit('clip_fill', { id: clip.id, progression: progSel.get(), style: styleSel.get(), voicing: voiceSel.get() }); } });
    const clearBtn = UI.Button({ label: 'Clear', kind: 'danger', onClick: () => { if (clip && notes.length && confirm('Delete every note in this clip?')) commit([]); } });
    const closeBtn = UI.Button({ label: '×', hint: 'close piano roll', onClick: () => { hide(); if (opts && opts.onClose) opts.onClose(); } });
    // 3.53 "a way to full screen the notes screen, its cramped": the roll lives inside the canvas world (CSS-transformed, so
    // position:fixed would stay inside it) — full screen MOVES the roll onto the page over everything, and back to the same
    // spot after. Every hit test maps by the live rect (toContent), so nothing else changes. ⛶ again, Esc or closing the clip.
    let full = null;
    const fullBtn = UI.Button({ label: '⛶ Full screen', hint: 'the notes fill the whole screen — ⛶ again or Esc puts it back', onClick: () => setFull(!full) });
    function fullKey(e) { if (e.key !== 'Escape' || !full) return; if (S.size || stepOn || editor.classList.contains('open')) return; e.preventDefault(); e.stopPropagation(); setFull(false); }
    function setFull(on) {
      if (!!on === !!full) return;
      if (on) { full = { parent: el.parentNode, next: el.nextSibling }; document.body.appendChild(el); el.classList.add('tlpr-full'); document.addEventListener('keydown', fullKey, true); }
      else { const f = full; full = null; el.classList.remove('tlpr-full'); document.removeEventListener('keydown', fullKey, true); if (f.parent) f.parent.insertBefore(el, f.next && f.next.parentNode === f.parent ? f.next : null); }
      fullBtn.set(full ? '⤡ Back to the timeline' : '⛶ Full screen'); fullBtn.el.classList.toggle('on', !!full);
      if (clip) requestAnimationFrame(() => { draw(); cv.focus({ preventScroll: true }); });
    }
    const readout = h('span', { class: 'tlpr-pos', 'aria-live': 'polite', text: '' });
    const qSel = UI.Select({ label: 'Quantize', hint: 'how far Q pulls note starts onto the grid', options: [{ value: '1', label: '100 %' }, { value: '0.75', label: '75 %' }, { value: '0.5', label: '50 %' }, { value: '0.25', label: '25 %' }], value: '1', onChange: (v) => { qStrength = +v; } });
    const ebtn = (text, hint, fn) => { const b = h('button', { class: 'tlpr-tool tlpr-ed', title: hint, 'aria-label': hint, text }); b.addEventListener('click', (e) => { e.stopPropagation(); fn(); cv.focus({ preventScroll: true }); }); return b; };
    const qBtn = ebtn('Q', 'Quantize (Q) — note starts onto the grid (the selection, or every note)', () => quantize());
    const huBtn = ebtn('≈', 'Humanize (H) — a little looseness in time (±10 ticks) and velocity (±8 %)', () => humanize());
    const legBtn = ebtn('⟷', 'Legato (L) — each note lasts until the next one starts', () => legato());
    const stepBtn = ebtn('⏎', 'Step input — type notes on Z S X D C V G B H N J M (an octave up: Q 2 W 3 E R 5 T 6 Y 7 U); Space = rest; Backspace = back', () => setStep(!stepOn));
    const edBox = h('span', { class: 'tlpr-tools', role: 'group', 'aria-label': 'edit' }, [qSel.el, qBtn, huBtn, legBtn, stepBtn]);
    const bar = h('div', { class: 'tlpr-bar' }, [title, bars.el, h('span', { class: 'tlpr-sep' }), toolBox, gridSel.el, lenSel.el, stampSel.el, lockT.el, zoomSel.el, rowSel.el, laneSel.el, edBox, readout, h('span', { class: 'tlpr-sep' }), progSel.el, styleSel.el, voiceSel.el, fillBtn.el, clearBtn.el, fullBtn.el, closeBtn.el]);
    const keys = document.createElement('canvas'); keys.className = 'tlpr-keys';
    const ruler = document.createElement('canvas'); ruler.className = 'tlpr-ruler';
    const cv = document.createElement('canvas'); cv.className = 'tlpr-grid'; cv.tabIndex = 0; cv.setAttribute('role', 'application'); cv.setAttribute('aria-label', 'Note grid — 1 draw, 2 paint, 3 split, 4 erase, 5 select; click to add, drag to move, drag an edge to stretch, Shift-click or drag a box to select, Ctrl+C / V / D, arrow keys nudge, Q quantize, double-click for the note knobs; hold Alt for no snap');
    const vel = document.createElement('canvas'); vel.className = 'tlpr-vel'; vel.setAttribute('aria-label', 'velocity lane — drag to draw velocities, Ctrl-drag for a ramp');
    const corner = h('div', { class: 'tlpr-corner' }), vcorner = h('div', { class: 'tlpr-vcorner', text: 'vel' });
    const keyCol = h('div', { class: 'tlpr-keycol' }, [corner, keys, vcorner]);
    const gridCol = h('div', { class: 'tlpr-gridcol' }, [ruler, cv, vel]);
    const editor = h('div', { class: 'tlpr-edit', role: 'dialog', 'aria-label': 'note fields' });
    const scroll = h('div', { class: 'tlpr-scroll' }, [keyCol, gridCol]);
    const el = h('div', { class: 'tlpr' }, [bar, scroll, editor]);

    const Hh = () => rowNotes.length * ROW;
    const steps = () => clip ? clip.bars * 16 : 64;
    const yOf = (n) => { const i = rowNotes.indexOf(n); return (i < 0 ? (drums ? rowNotes.length : HI - n) : i) * ROW; };
    const nOf = (y) => rowNotes[Math.max(0, Math.min(rowNotes.length - 1, Math.floor(y / ROW)))];
    const inScale = (n) => drums ? true : MT.inScale(n, key.root, key.scale);
    const g0 = (e) => (e && e.altKey) ? 0 : grid;                       // the grid in force for this gesture
    const cellOf = (st, g) => g ? Math.floor(st / g + 1e-9) * g : Math.floor(st / FREE) * FREE;   // the cell the pointer is in
    const snapTo = (st, g) => g ? Math.round(st / g) * g : Math.round(st / FREE) * FREE;          // the nearest grid line
    const newLen = () => len || lastLen;
    const selOnly = (idx) => { S = new Set([].concat(idx)); };
    const chosen = () => S.size ? Array.from(S).filter(i => notes[i]).sort((a, b) => a - b) : notes.map((_, i) => i);   // the selection, or everything
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
        g.strokeStyle = S.has(i) ? '#fff' : '#000'; g.lineWidth = 1; g.strokeRect(x + 1.5, y + 1.5, w - 2, ROW - 3);
      });
      if (!drums) notes.forEach((nt, i) => { if (nt.b) drawBend(g, nt, S.has(i)); });
      if (ghost && !drag) {   // where a click lands
        const x = ghost.s * pps, y = yOf(ghost.n), w = Math.max(3, ghost.l * pps - 1);
        g.globalAlpha = 0.45; g.fillStyle = tool === 'erase' ? '#ff4d4d' : '#ffd24a'; g.fillRect(x + 1, y + 1, w - 1, ROW - 2); g.globalAlpha = 1;
        g.strokeStyle = '#ffd24a'; g.setLineDash([3, 2]); g.strokeRect(x + 1.5, y + 1.5, w - 2, ROW - 3); g.setLineDash([]);
      }
      if (ghost && ghost.split !== undefined) { g.fillStyle = '#ffd24a'; g.fillRect(ghost.split * pps, yOf(ghost.n), 2, ROW); }
      if (drag && drag.mode === 'box' && drag.armed) { const bx = Math.min(drag.x0, drag.x1), by = Math.min(drag.y0, drag.y1); g.fillStyle = 'rgba(255,210,74,.12)'; g.fillRect(bx, by, Math.abs(drag.x1 - drag.x0), Math.abs(drag.y1 - drag.y0)); g.strokeStyle = '#ffd24a'; g.strokeRect(bx + 0.5, by + 0.5, Math.abs(drag.x1 - drag.x0), Math.abs(drag.y1 - drag.y0)); }
      if (stepOn) { g.fillStyle = '#00e5ff'; g.fillRect(cursor * pps, 0, 2, H); }
      if (playStep !== null && playStep >= 0 && playStep <= st) { g.fillStyle = '#fff'; g.fillRect(playStep * pps, 0, 2, H); }
      drawRuler(W); drawVel(W);
    }
    // 3.56 the pitch curve of a bent note: from its start (at from) to its end (at to), one row per semitone
    const SHAPES = { smooth: (x) => x * x * (3 - 2 * x), linear: (x) => x, early: (x) => 1 - Math.pow(1 - x, 3), late: (x) => x * x * x };
    function bendY(nt, f) { const b = nt.b, at = b.at || 0, k = f <= at ? 0 : (SHAPES[b.shape] || SHAPES.smooth)((f - at) / (1 - at)); return yOf(nt.n) + ROW / 2 - (b.from + (b.to - b.from) * k) * ROW; }
    function drawBend(g, nt, on) {
      const x0 = nt.s * pps + 1, w = Math.max(3, nt.l * pps - 2), col = lane ? lane.color : '#ff66cc';
      g.save(); g.lineCap = 'round'; g.lineJoin = 'round';
      [[6, col, 0.3], [2.2, on ? '#ffffff' : '#ffe08a', 1]].forEach(([lw, c, a]) => { g.globalAlpha = a; g.strokeStyle = c; g.lineWidth = lw; g.beginPath(); for (let k = 0; k <= 32; k++) { const xx = x0 + w * k / 32, yy = bendY(nt, k / 32); k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } g.stroke(); });
      g.globalAlpha = 1; g.fillStyle = on ? '#ffffff' : '#ffe08a'; g.beginPath(); g.arc(x0 + w, bendY(nt, 1), 3.5, 0, 7); g.fill();
      if (ROW >= 9) { g.font = '9px monospace'; g.fillText((nt.b.to > 0 ? '+' : '') + (+nt.b.to.toFixed(1)) + ' st', x0 + w + 5, bendY(nt, 1) + 3); }
      g.restore();
    }
    const bendSay = (b) => !b ? 'flat' : (b.from ? 'from ' + (b.from > 0 ? '+' : '') + b.from + ' st ' : '') + 'to ' + (b.to > 0 ? '+' : '') + b.to + ' st';
    function drawVel(W) {
      const g = size(vel, W, VH); vcorner.style.width = KW + 'px'; vcorner.style.height = VH + 'px';
      g.fillStyle = '#0b1119'; g.fillRect(0, 0, W, VH); g.fillStyle = '#223044'; g.fillRect(0, 0, W, 1);
      for (let s = 0; s <= steps(); s += 4) { g.fillStyle = s % 16 === 0 ? '#2d3f57' : '#151f2c'; g.fillRect(s * pps, 0, 1, VH); }
      const col = lane ? lane.color : '#ff66cc';
      if (xk) {   // a knob per note: solid = this note sets it · faint outline = the note uses the tool's knob
        g.font = '9px monospace';
        notes.forEach((nt, i) => { const has = xHas(nt), f = xFrac(xk, has ? nt.p[xk.key] : xk.def), hgt = Math.max(2, Math.round(f * (VH - 6))), x = nt.s * pps + 1, w = Math.max(3, nt.l * pps - 2);
          g.globalAlpha = S.size && !S.has(i) ? 0.35 : 1;
          if (has) { g.fillStyle = S.has(i) ? '#ffffff' : '#ffd24a'; g.globalAlpha *= 0.85; g.fillRect(x, VH - hgt, w, hgt); g.globalAlpha = 1; if (w > 34) { g.fillStyle = '#0b1119'; g.fillText(xk.type === 'enum' ? String(nt.p[xk.key]) : String(+(+nt.p[xk.key]).toFixed(2)), x + 2, VH - 3); } }
          else { g.strokeStyle = col; g.globalAlpha *= 0.3; g.strokeRect(x + 0.5, VH - hgt + 0.5, w - 1, hgt - 1); g.globalAlpha = 1; } });
        if (drag && drag.mode === 'ramp') { g.strokeStyle = '#ffd24a'; g.beginPath(); g.moveTo(drag.x0, drag.vy0); g.lineTo(drag.x1, drag.vy1); g.stroke(); }
        return;
      }
      notes.forEach((nt, i) => { const hgt = Math.round(nt.v * (VEL - 6)); g.fillStyle = S.has(i) ? '#ffffff' : col; g.globalAlpha = S.size && !S.has(i) ? 0.35 : 0.9; g.fillRect(nt.s * pps + 1, VEL - hgt, Math.max(2, Math.min(4, nt.l * pps - 1)), hgt); g.fillRect(nt.s * pps + 1, VEL - hgt, Math.max(2, Math.min(nt.l * pps - 2, 10)), 2); g.globalAlpha = 1; });
      if (drag && drag.mode === 'ramp') { g.strokeStyle = '#ffd24a'; g.beginPath(); g.moveTo(drag.x0, drag.vy0); g.lineTo(drag.x1, drag.vy1); g.stroke(); }
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
      if (e.button === 2 && tool === 'bend') { if (i >= 0 && notes[i].b) { const next = notes.slice(), sel = S.has(i) ? Array.from(S) : [i]; sel.forEach(j => { if (next[j]) { next[j] = Object.assign({}, next[j]); delete next[j].b; } }); commit(next); say(notes[i].s, notes[i].n, 'bend: flat'); } return; }
      if (e.button === 2) { if (i >= 0) { S.clear(); commit(notes.filter((_, j) => j !== i)); } return; }
      closeEditor();
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      ghost = null;
      if (tool === 'erase') { drag = { mode: 'erase', orig: notes.slice(), x0: x, y0: y, armed: true, changed: false }; eraseAt(x, y); draw(); return; }
      if (tool === 'bend') {
        if (drums || i < 0) return; if (!S.has(i)) selOnly(i);
        const a = notes[i], end = (x / pps - a.s) / Math.max(a.l, 1e-6) < 0.33 ? 'from' : 'to';
        drag = { mode: 'bend', grab: i, end, idx: Array.from(S), orig: notes.map(n => Object.assign({}, n)), x0: x, y0: y, row0: yOf(a.n) + ROW / 2, armed: false, changed: false };
        draw(); return;
      }
      if (tool === 'split') {
        if (i >= 0) { const a = notes[i], at = q(snapTo(x / pps, g)); if (at > a.s + 1e-6 && at < a.s + a.l - 1e-6) { const next = notes.slice(); next.splice(i, 1, Object.assign({}, a, { l: q(at - a.s) }), Object.assign({}, a, { s: at, l: q(a.s + a.l - at) })); selOnly(i + 1); commit(next); } }
        return;
      }
      if (tool === 'paint') {
        const cell = q(cellOf(x / pps, g)), n = pitchFor(nOf(y)), l = q(Math.min(g || FREE, st - cell));
        drag = { mode: 'paint', g, cells: new Set(), orig: notes.slice(), x0: x, y0: y, armed: true, changed: false };
        paintAt(cell, n, l); draw(); return;
      }
      if (i >= 0 && e.shiftKey) { if (S.has(i)) S.delete(i); else S.add(i); draw(); return; }   // Shift-click: add / remove
      if (i < 0 && (tool === 'select' || e.shiftKey)) {   // a box: notes it touches are selected (Shift: added)
        drag = { mode: 'box', base: e.shiftKey ? new Set(S) : new Set(), x0: x, y0: y, x1: x, y1: y, armed: false, changed: false };
        if (!e.shiftKey) S.clear(); draw(); return;
      }
      if (i >= 0) {
        if (!S.has(i)) selOnly(i); const z = zone(i, x);
        drag = { mode: z === 'R' ? 'resize' : z === 'L' ? 'resizeL' : 'move', grab: i, idx: Array.from(S), orig: notes.map(n => Object.assign({}, n)), x0: x, y0: y, armed: false, changed: false, copy: (e.ctrlKey || e.metaKey) && z === 'B' };
        if (z === 'B') audition([notes[i].n]);
      } else if (tool === 'select') { return;
      } else {
        const s = q(clampN(cellOf(x / pps, g), 0, st - (g || FREE)));
        const ps = stampNotes(nOf(y)).filter(n => drums ? rowNotes.includes(n) : (n >= LO && n <= HI));
        if (!ps.length) return;
        const add = ps.map(n => ({ s, l: q(Math.min(newLen(), st - s)), n, v: 0.85 }));
        const next = notes.concat(add); const idx = add.map((_, k) => notes.length + k);
        notes = next; selOnly(idx); audition(ps);
        drag = { mode: 'move', idx, orig: next.map(n => Object.assign({}, n)), x0: x, y0: y, armed: false, changed: true };
      }
      draw();
    });
    function eraseAt(x, y) { const i = hit(x, y); if (i >= 0) { notes = notes.filter((_, j) => j !== i); S.clear(); drag.changed = true; } }
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
      if (drag.mode === 'box') {
        drag.x1 = x; drag.y1 = y; const s0 = Math.min(drag.x0, x) / pps, s1 = Math.max(drag.x0, x) / pps, r0 = Math.floor(Math.min(drag.y0, y) / ROW), r1 = Math.floor(Math.max(drag.y0, y) / ROW);
        S = new Set(drag.base); notes.forEach((a, i) => { const r = Math.floor(yOf(a.n) / ROW); if (r >= r0 && r <= r1 && a.s < s1 && a.s + a.l > s0) S.add(i); });
        draw(); readout.textContent = `${S.size} selected`; return;
      }
      if (drag.copy && !drag.copied) {   // Ctrl+drag: the copies move, the originals stay
        drag.copied = true; const base = notes.length; notes = notes.concat(drag.idx.map(i => Object.assign({}, notes[i])));
        drag.idx = drag.idx.map((_, k) => base + k); selOnly(drag.idx); drag.orig = notes.map(n => Object.assign({}, n)); drag.changed = true;
      }
      if (drag.mode === 'paint') {
        // every cell between the last point and this one (a fast drag skips none)
        const gg = e.altKey ? FREE : (drag.g || FREE), a = Math.min(drag.lastX === undefined ? drag.x0 : drag.lastX, x), b = Math.max(drag.lastX === undefined ? drag.x0 : drag.lastX, x);
        for (let c = cellOf(a / pps, gg); c <= cellOf(b / pps, gg) + 1e-9; c += gg) { const cell = q(c); if (cell >= 0 && cell < st) paintAt(cell, pitchFor(nOf(y)), q(Math.min(gg, st - cell))); }
        drag.lastX = x; draw(); say(cellOf(x / pps, gg), pitchFor(nOf(y)), 'paint'); return;
      }
      if (drag.mode === 'bend') {   // the pointer's height from the note's own row = semitones (Alt: tenths)
        const raw = (drag.row0 - y) / ROW, st2 = clampN(e.altKey ? Math.round(raw * 10) / 10 : Math.round(raw), -48, 48);
        drag.idx.forEach(j => { const o = drag.orig[j]; if (!o) return; const b = Object.assign({ from: 0, to: 0, shape: 'smooth', at: 0 }, o.b || {}); b[drag.end] = st2; const nt = Object.assign({}, o); if (b.from || b.to) nt.b = b; else delete nt.b; notes[j] = nt; });
        drag.changed = true; const a = notes[drag.grab]; say(a.s, a.n, 'bend ' + bendSay(a.b)); draw(); return;
      }
      const gs = g || FREE;
      if (drag.mode === 'move') {
        // the note follows the CELL under the pointer, not the distance moved: sliding inside the cell (or the row) you
        // clicked never moves it — the old round(distance) moved it a step or a semitone on a half-cell slide
        const ds = cellOf(x / pps, gs) - cellOf(drag.x0 / pps, gs), dn = Math.floor(drag.y0 / ROW) - Math.floor(y / ROW);
        const moveN = (n) => { if (!drums) return Math.max(LO, Math.min(HI, pitchFor(n + dn))); const r = rowNotes.indexOf(n); return r < 0 ? n : rowNotes[Math.max(0, Math.min(rowNotes.length - 1, r - dn))]; };
        drag.idx.forEach(i => { const o = drag.orig[i]; const s = q(clampN(o.s + ds, 0, st - FREE)); notes[i] = Object.assign({}, o, { s, l: q(Math.min(o.l, st - s)), n: moveN(o.n) }); });
        if (ds || dn) drag.changed = true;
        const a = notes[drag.grab !== undefined && !drag.copied ? drag.grab : drag.idx[0]] || notes[drag.idx[0]]; say(a.s, a.n);
      } else if (drag.mode === 'resize') {   // the grabbed note's end snaps; every selected note's end moves by the same amount
        const go = drag.orig[drag.grab], end = q(clampN(snapTo(x / pps, g), go.s + gs, st)), d = end - (go.s + go.l);
        drag.idx.forEach(i => { const o = drag.orig[i]; notes[i] = Object.assign({}, o, { l: q(clampN(o.l + d, Math.min(gs, FREE * 2), st - o.s)) }); });
        drag.changed = true; const a = notes[drag.grab]; say(a.s + a.l, a.n, 'end');
      } else {   // resizeL: the starts move, every end stays put
        const go = drag.orig[drag.grab], s1 = q(clampN(snapTo(x / pps, g), 0, go.s + go.l - gs)), d = s1 - go.s;
        drag.idx.forEach(i => { const o = drag.orig[i], end = o.s + o.l; const s = q(clampN(o.s + d, 0, end - Math.min(gs, FREE * 2))); notes[i] = Object.assign({}, o, { s, l: q(end - s) }); });
        drag.changed = true; const a = notes[drag.grab]; say(a.s, a.n, 'start');
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
      ghost = gh; hoverS = gh ? gh.s : q(cellOf(x / pps, g)); draw(); if (keyChanged) drawKeys();
      if (tool === 'bend') { ghost = null; cv.classList.toggle('edge', false); if (i >= 0) say(notes[i].s, notes[i].n, (notes[i].b ? 'bend ' + bendSay(notes[i].b) + ' · ' : '') + ((x / pps - notes[i].s) / notes[i].l < 0.33 ? 'drag: slide in from…' : 'drag: bend to…')); else readout.textContent = '〰 drag a note up or down'; draw(); return; }
      if (i >= 0) say(notes[i].s, notes[i].n, `len ${+(notes[i].l / 4).toFixed(3)} beat · double-click: its knobs`); else say(gh ? gh.s : x / pps, n);
    }
    cv.addEventListener('pointerleave', () => { hoverS = null; if (!drag && ghost) { ghost = null; draw(); drawKeys(); } readout.textContent = ''; });
    const endDrag = () => {
      cv.classList.remove('move'); if (!drag) return; const d = drag; drag = null;
      if ((d.mode === 'resize' || d.mode === 'resizeL') && d.changed) lastLen = notes[d.grab].l;   // new notes take this length
      if (d.mode === 'box') { draw(); return; }
      if (d.mode === 'bend' && d.changed && notes[d.grab] && notes[d.grab].b && lane) view.emit('note_audition', { lane: lane.id, note: notes[d.grab].n, bend: notes[d.grab].b, duration: 0.9 });
      if (d.changed) commit(notes.slice()); else draw();
    };
    cv.addEventListener('pointerdown', () => { if (drag && !drag.done) drag.done = global.UIKit.drag.begin(endDrag); }); // 3.34 guard
    cv.addEventListener('pointerup', endDrag);
    // a lost capture / cancelled pointer (alt-tab, touch cancel, window torn down mid-drag) must never leave a drag armed
    cv.addEventListener('pointercancel', endDrag); cv.addEventListener('lostpointercapture', endDrag);
    cv.addEventListener('dblclick', (e) => { const { x, y } = local(e); const i = hit(x, y); if (i >= 0) openEditor(i); });   // 3.48: exact fields (right-click deletes)
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
      const next = notes.slice(); next[i] = Object.assign({}, next[i], { v: Math.max(0.05, Math.min(1, next[i].v + (e.deltaY < 0 ? 0.05 : -0.05))) });
      notes = next; selOnly(i); draw(); say(next[i].s, next[i].n, 'vel ' + Math.round(next[i].v * 127)); clearTimeout(cv._wt); cv._wt = setTimeout(() => commit(notes.slice()), 250);
    }, { passive: false });
    cv.addEventListener('keydown', (e) => {
      const k = e.key, lower = k.length === 1 ? k.toLowerCase() : k, mod = e.ctrlKey || e.metaKey, eat = () => { e.preventDefault(); e.stopPropagation(); };
      if (!clip) return;
      if (stepOn && !mod && stepKey(e)) return eat();
      if (!mod && !e.altKey && ['1', '2', '3', '4', '5', '6'].includes(k)) { eat(); setTool(tools[+k - 1][0]); return; }
      if (mod && lower === 'a') { eat(); selOnly(notes.map((_, i) => i)); draw(); readout.textContent = `${S.size} selected`; return; }
      if (mod && (lower === 'c' || lower === 'x')) { eat(); copySel(); if (lower === 'x') removeSel(); return; }
      if (mod && lower === 'v') { eat(); paste(); return; }
      if (mod && lower === 'd') { eat(); duplicate(); return; }
      if (k === 'Escape') { if (S.size) { eat(); S.clear(); draw(); } return; }
      if (!mod && lower === 'q') { eat(); quantize(); return; }
      if (!mod && lower === 'h') { eat(); humanize(); return; }
      if (!mod && lower === 'l') { eat(); legato(); return; }
      const sel = Array.from(S).filter(i => notes[i]);
      if (!sel.length) return;
      if (k === 'Delete' || k === 'Backspace') { eat(); removeSel(); return; }
      if (k === 'ArrowLeft' || k === 'ArrowRight') {   // nudge in time: one grid step, Shift = a bar
        eat(); const d = (k === 'ArrowLeft' ? -1 : 1) * (e.shiftKey ? 16 : (grid || FREE)), st = steps();
        const lo = Math.min(...sel.map(i => notes[i].s)), hi = Math.max(...sel.map(i => notes[i].s + notes[i].l)), dd = clampN(d, -lo, st - hi);
        if (!dd) return; const next = notes.slice(); sel.forEach(i => { next[i] = Object.assign({}, next[i], { s: q(next[i].s + dd) }); }); commit(next); say(next[sel[0]].s, next[sel[0]].n); return;
      }
      if (k === 'ArrowUp' || k === 'ArrowDown') {
        eat(); const next = notes.slice(), up = k === 'ArrowUp';
        sel.forEach(i => {
          if (drums) { const r = rowNotes.indexOf(next[i].n); if (r < 0) return; next[i] = Object.assign({}, next[i], { n: rowNotes[clampN(r + (up ? -1 : 1), 0, rowNotes.length - 1)] }); return; }
          const d = up ? (e.shiftKey ? 12 : 1) : (e.shiftKey ? -12 : -1); let n = next[i].n + d; if (lock && Math.abs(d) === 1) { while (!inScale(n) && n > LO && n < HI) n += d; }
          next[i] = Object.assign({}, next[i], { n: clampN(n, LO, HI) });
        });
        audition(sel.map(i => next[i].n)); commit(next);
      }
    });
    // ---- P3 edits (each is one commit = one undo step)
    function removeSel() { const sel = new Set(S); S.clear(); commit(notes.filter((_, i) => !sel.has(i))); }
    function copySel() { const sel = Array.from(S).filter(i => notes[i]); if (!sel.length) return; const s0 = Math.min(...sel.map(i => notes[i].s)); CLIPBOARD = sel.map(i => Object.assign({}, notes[i], { s: notes[i].s - s0 })); readout.textContent = `${sel.length} copied`; }
    function place(list, at) {   // add copies of list (s relative) starting at `at`; they become the selection
      const st = steps(), add = list.map(n => Object.assign({}, n, { s: q(at + n.s) })).filter(n => n.s < st).map(n => Object.assign(n, { l: q(Math.min(n.l, st - n.s)) }));
      if (!add.length) return; const base = notes.length; selOnly(add.map((_, k) => base + k)); commit(notes.concat(add));
    }
    function paste() { if (!CLIPBOARD) return; const at = hoverS !== null ? hoverS : (playStep !== null && playStep >= 0 && playStep < steps() ? q(cellOf(playStep, grid)) : 0); place(CLIPBOARD, at); }
    function duplicate() {
      const sel = Array.from(S).filter(i => notes[i]); if (!sel.length) return;
      const s0 = Math.min(...sel.map(i => notes[i].s)), e0 = Math.max(...sel.map(i => notes[i].s + notes[i].l)), g = grid || FREE, span = Math.ceil((e0 - s0) / g - 1e-9) * g;
      place(sel.map(i => Object.assign({}, notes[i], { s: notes[i].s - s0 })), s0 + span);
    }
    function quantize() {
      const g = grid || 1, list = chosen(); if (!list.length) return; const next = notes.slice(), st = steps();
      list.forEach(i => { const a = next[i], t = Math.round(a.s / g) * g, s1 = q(clampN(a.s + (t - a.s) * qStrength, 0, st - FREE)); next[i] = Object.assign({}, a, { s: s1, l: q(Math.min(a.l, st - s1)) }); });
      commit(next); readout.textContent = `quantized ${list.length} · ${Math.round(qStrength * 100)} %`;
    }
    function humanize() {
      const list = chosen(); if (!list.length) return; const next = notes.slice(), st = steps(), r = () => Math.random() * 2 - 1;
      list.forEach(i => { const a = next[i], s1 = q(clampN(a.s + r() * 10 / 120, 0, st - FREE)); next[i] = Object.assign({}, a, { s: s1, l: q(Math.min(a.l, st - s1)), v: clampN(Math.round((a.v + r() * 0.08) * 100) / 100, 0.05, 1) }); });
      commit(next); readout.textContent = `humanized ${list.length}`;
    }
    function legato() {
      const list = chosen().sort((a, b) => notes[a].s - notes[b].s); if (list.length < 2) return; const next = notes.slice();
      list.forEach((i, k) => { const nxt = list.slice(k + 1).find(j => notes[j].s > notes[i].s + 1e-9); if (nxt !== undefined) next[i] = Object.assign({}, next[i], { l: q(notes[nxt].s - notes[i].s) }); });
      commit(next);
    }
    // ---- velocity lane: drag draws velocity onto the notes under the pointer (the selection's if any), Ctrl-drag = a ramp
    const vLocal = (e) => toContent(vel, e.clientX, e.clientY);
    const vOf = (y) => clampN(Math.round((1 - (y - 4) / (VEL - 6)) * 100) / 100, 0.05, 1);
    const fOf = (y) => clampN(1 - (y - 4) / (VH - 6), 0, 1);
    vel.addEventListener('contextmenu', (e) => e.preventDefault());
    function xClear(x) { const hits = atX(x); hits.forEach(i => { const nt = notes[i]; if (!xHas(nt)) return; const p = Object.assign({}, nt.p); delete p[xk.key]; const next = Object.assign({}, nt); if (Object.keys(p).length) next.p = p; else delete next.p; notes[i] = next; drag.changed = true; }); if (hits.length) { draw(); say(notes[hits[0]].s, notes[hits[0]].n, xk.label + ': the knob'); } }
    const atX = (x) => { const st = x / pps; return notes.map((a, i) => i).filter(i => notes[i].s <= st && st < notes[i].s + Math.max(notes[i].l, 4 / pps) && (!S.size || S.has(i))); };
    vel.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); if (!clip) return; const { x, y } = vLocal(e); try { vel.setPointerCapture(e.pointerId); } catch (_) {}
      if (xk && e.button === 2) { drag = { mode: 'clr', changed: false }; xClear(x); return; }
      if (e.ctrlKey || e.metaKey) { drag = { mode: 'ramp', x0: x, x1: x, vy0: y, vy1: y, changed: false }; return; }
      drag = { mode: 'vel', changed: false }; velAt(x, y);
    });
    function velAt(x, y) {
      if (xk) { const v = xVal(xk, fOf(y)), hits = atX(x); if (!hits.length) return; hits.forEach(i => { notes[i] = Object.assign({}, notes[i], { p: Object.assign({}, notes[i].p, { [xk.key]: v }) }); }); drag.changed = true; draw(); say(notes[hits[0]].s, notes[hits[0]].n, xSay(xk, v)); return; }
      const v = vOf(y), hits = atX(x); if (!hits.length) return; hits.forEach(i => { notes[i] = Object.assign({}, notes[i], { v }); }); drag.changed = true; draw(); say(notes[hits[0]].s, notes[hits[0]].n, 'vel ' + Math.round(v * 127)); }
    vel.addEventListener('pointermove', (e) => {
      if (!drag || (drag.mode !== 'vel' && drag.mode !== 'ramp' && drag.mode !== 'clr')) return; const { x, y } = vLocal(e);
      if (drag.mode === 'clr') return xClear(x);
      if (drag.mode === 'vel') return velAt(x, y);
      drag.x1 = x; drag.vy1 = y; draw();
    });
    const velEnd = () => {
      if (!drag || (drag.mode !== 'vel' && drag.mode !== 'ramp' && drag.mode !== 'clr')) return; const d = drag; drag = null;
      if (d.mode === 'ramp' && xk) {
        const a = Math.min(d.x0, d.x1) / pps, b = Math.max(d.x0, d.x1) / pps, fa = fOf(d.x0 <= d.x1 ? d.vy0 : d.vy1), fb = fOf(d.x0 <= d.x1 ? d.vy1 : d.vy0);
        const next = notes.slice(); let n = 0;
        next.forEach((nt, i) => { if (nt.s >= a - 1e-9 && nt.s <= b + 1e-9 && (!S.size || S.has(i))) { const t = b > a ? (nt.s - a) / (b - a) : 0; next[i] = Object.assign({}, nt, { p: Object.assign({}, nt.p, { [xk.key]: xVal(xk, fa + (fb - fa) * t) }) }); n++; } });
        if (n) commit(next); else draw(); return;
      }
      if (d.mode === 'ramp') {
        const a = Math.min(d.x0, d.x1) / pps, b = Math.max(d.x0, d.x1) / pps, va = vOf(d.x0 <= d.x1 ? d.vy0 : d.vy1), vb = vOf(d.x0 <= d.x1 ? d.vy1 : d.vy0);
        const next = notes.slice(); let n = 0;
        next.forEach((nt, i) => { if (nt.s >= a - 1e-9 && nt.s <= b + 1e-9 && (!S.size || S.has(i))) { const t = b > a ? (nt.s - a) / (b - a) : 0; next[i] = Object.assign({}, nt, { v: clampN(Math.round((va + (vb - va) * t) * 100) / 100, 0.05, 1) }); n++; } });
        if (n) commit(next); else draw(); return;
      }
      if (d.changed) commit(notes.slice());
    };
    vel.addEventListener('pointerup', velEnd); vel.addEventListener('pointercancel', velEnd); vel.addEventListener('lostpointercapture', velEnd);
    // ---- P4 the note's own knobs (no typing): start snaps to the grid, length, pitch, velocity — live, one undo step
    const lenName = (l) => { const m = { 0.25: '1/64', 0.5: '1/32', 1: '1/16', 2: '1/8', 3: '1/8.', 4: '1/4', 6: '1/4.', 8: '1/2', 12: '1/2.', 16: '1 bar' }; return m[Math.round(l * 192) / 192] || (+(l / 4).toFixed(3) + ' beat'); };
    function openEditor(i) {
      const a0 = notes[i]; if (!a0) return; selOnly(i); draw(); editor.innerHTML = '';
      let cur = Object.assign({}, a0), timer = null;
      const st = steps(), gs = grid || FREE;
      const apply = (patch) => {
        cur = Object.assign({}, cur, patch); cur.s = q(clampN(cur.s, 0, st - FREE)); cur.l = q(clampN(cur.l, FREE, st - cur.s)); cur.n = Math.round(clampN(cur.n, drums ? 0 : LO, drums ? 127 : HI)); cur.v = clampN(Math.round(cur.v * 100) / 100, 0.05, 1);
        if (cur.b && !cur.b.from && !cur.b.to) delete cur.b;
        if (cur.p && !Object.keys(cur.p).length) delete cur.p;
        notes[i] = Object.assign({}, cur); draw(); say(cur.s, cur.n, lenName(cur.l) + ' · vel ' + Math.round(cur.v * 127) + (cur.b ? ' · bend ' + bendSay(cur.b) : ''));
        clearTimeout(timer); timer = setTimeout(() => commit(notes.slice()), 250);   // one commit after the knob settles
      };
      const knob = (label, o, set) => { const k = UI.Knob(Object.assign({ label, size: 44, onChange: (v) => set(v) }, o)); return k; };
      const kS = knob('Start', { min: 0, max: st - gs, value: cur.s, format: (v) => where(Math.round(v / gs) * gs) }, (v) => apply({ s: Math.round(v / gs) * gs }));
      const kL = knob('Length', { min: FREE, max: Math.min(16, st), value: cur.l, format: (v) => lenName(Math.max(FREE, Math.round(v / gs) * gs || gs)) }, (v) => apply({ l: Math.max(gs, Math.round(v / gs) * gs) }));
      const kP = drums ? knob('Pad', { min: 0, max: rowNotes.length - 1, value: Math.max(0, rowNotes.indexOf(cur.n)), format: (v) => nameOf(rowNotes[Math.round(v)]) }, (v) => apply({ n: rowNotes[Math.round(v)] }))
        : knob('Pitch', { min: LO, max: HI, value: cur.n, format: (v) => nameOf(Math.round(lock ? pitchFor(Math.round(v)) : v)) }, (v) => { const n = lock ? pitchFor(Math.round(v)) : Math.round(v); if (n !== cur.n) audition([n]); apply({ n }); });
      const kV = knob('Velocity', { min: 1, max: 127, value: Math.round(cur.v * 127), format: (v) => String(Math.round(v)) }, (v) => apply({ v: Math.round(v) / 127 }));
      const done = h('button', { class: 'tlpr-tool', title: 'done (Esc)', text: '✓' });
      editor.append(h('div', { class: 'tlpr-eh' }, [h('b', { text: 'Note' }), h('span', { class: 'wm-spacer' }), done]), h('div', { class: 'tlpr-knobs' }, [kS.el, kL.el, kP.el, kV.el]));
      // 3.56 BEND — the note's pitch curve, with knobs; you hear it as you turn them
      let hearT = null; const hear = () => { clearTimeout(hearT); hearT = setTimeout(() => { if (lane && cur.b) view.emit('note_audition', { lane: lane.id, note: cur.n, bend: cur.b, duration: 0.9 }); }, 280); };
      const B = () => Object.assign({ from: 0, to: 0, shape: 'smooth', at: 0 }, cur.b || {});
      const setB = (patch, quiet) => { apply({ b: Object.assign(B(), patch) }); syncB(); if (!quiet) hear(); };
      const stFmt = (v) => (v > 0 ? '+' : '') + (+(+v).toFixed(1)) + ' st';
      const kTo = knob('Bend to', { min: -48, max: 48, step: 0.1, value: B().to, default: 0, format: stFmt }, (v) => setB({ to: Math.round(v * 10) / 10 }));
      const kFrom = knob('From', { min: -48, max: 48, step: 0.1, value: B().from, default: 0, format: stFmt }, (v) => setB({ from: Math.round(v * 10) / 10 }));
      const kAt = knob('Starts', { min: 0, max: 0.95, step: 0.01, value: B().at, default: 0, format: (v) => Math.round(v * 100) + ' %' }, (v) => setB({ at: Math.round(v * 100) / 100 }));
      const shSel = UI.Select({ label: 'Curve', hint: 'smooth: eases in and out · linear: straight · early: bends at once, then holds · late: holds, then dives', options: ['smooth', 'linear', 'early', 'late'].map(v => ({ value: v, label: v })), value: B().shape, onChange: (v) => setB({ shape: v }) });
      function syncB() { const b = B(); [[kTo, b.to], [kFrom, b.from], [kAt, b.at]].forEach(([k, v]) => { if (k.set) k.set(v); }); if (shSel.set) shSel.set(b.shape); }
      const prevNote = () => notes.filter((nt, j) => j !== i && nt.s < cur.s - 1e-6).sort((x, y) => y.s - x.s)[0];
      const quick = [['↘ dive', 'down an octave, late — a drop', { from: 0, to: -12, shape: 'late', at: 0.2 }], ['⤓ deep drop', 'two octaves down: the floor falls out', { from: 0, to: -24, shape: 'late', at: 0.1 }],
        ['↗ rise', 'up an octave', { from: 0, to: 12, shape: 'smooth', at: 0 }], ['⤳ glide in', 'slides in from the note before it — a smooth transition', null], ['— flat', 'no bend', { from: 0, to: 0, shape: 'smooth', at: 0 }]]
        .map(([t, hint, b]) => { const btn = h('button', { class: 'tlpr-tool tlpr-ed', title: hint, text: t }); btn.addEventListener('click', (e) => { e.stopPropagation(); if (b) return setB(b);
          const pv = prevNote(); if (!pv) { readout.textContent = 'no note before this one to glide from'; return; } setB({ from: Math.max(-48, Math.min(48, pv.n + (pv.b ? pv.b.to : 0) - cur.n)), to: 0, shape: 'early', at: 0 }); }); return btn; });
      if (!drums) editor.append(h('div', { class: 'tlpr-eh' }, [h('b', { text: '〰 Bend' }), h('span', { class: 'tlpr-hint', text: ' the pitch curves over the note — the whole track bends, like a pitch wheel' })]),
        h('div', { class: 'tlpr-knobs' }, [kFrom.el, kTo.el, kAt.el, shSel.el]), h('div', { class: 'tlpr-quick' }, quick));
      // SOUND — any knob of this track's tool, for this note only (the same values the expression lane draws)
      const list = (lane && knobsAll[lane.target]) || [], soundRow = h('div', { class: 'tlpr-knobs' });
      const addSel = UI.Select({ label: '+ knob', hint: 'give this note its own value for one of the tool’s knobs (wobble, cutoff, depth…)', options: [{ value: '', label: 'add…' }].concat(list.map(k => ({ value: k.key, label: (k.group ? k.group.toLowerCase() + ' · ' : '') + k.label }))), value: '', onChange: (v) => { if (!v) return; const k = list.find(x => x.key === v); if (k) { apply({ p: Object.assign({}, cur.p, { [k.key]: cur.p && cur.p[k.key] !== undefined ? cur.p[k.key] : k.def }) }); drawSound(); } addSel.set(''); } });
      function drawSound() {
        soundRow.innerHTML = '';
        Object.keys(cur.p || {}).forEach(key => {
          const k = list.find(x => x.key === key); if (!k) return; const v = cur.p[key];
          const set = (nv) => apply({ p: Object.assign({}, cur.p, { [key]: nv }) });
          const ctl = k.type === 'enum' ? UI.Select({ label: k.label, options: k.options.map(o => ({ value: o, label: String(o) })), value: v, onChange: (nv) => set(k.options.find(o => String(o) === String(nv))) })
            : k.type === 'boolean' ? UI.Toggle({ label: k.label, value: !!v, onChange: (nv) => set(!!nv) })
            : knob(k.label, { min: k.min, max: k.max, step: k.step || (k.type === 'integer' ? 1 : (k.max - k.min) / 200), value: v, default: k.def, unit: k.unit }, (nv) => set(xVal(k, xFrac(k, nv))));
          const x = h('button', { class: 'tlpr-tool', title: 'back to the tool’s own knob for this note', text: '×' });
          x.addEventListener('click', (e) => { e.stopPropagation(); const p2 = Object.assign({}, cur.p); delete p2[key]; apply({ p: p2 }); drawSound(); });
          soundRow.append(h('span', { class: 'tlpr-pk' }, [ctl.el, x]));
        });
        soundRow.append(addSel.el);
      }
      if (list.length) { editor.append(h('div', { class: 'tlpr-eh' }, [h('b', { text: '🎛 Sound' }), h('span', { class: 'tlpr-hint', text: ' this note only — the tool’s own knob takes over again after it' })]), soundRow); drawSound(); }
      const finish = () => { if (timer) { clearTimeout(timer); timer = null; commit(notes.slice()); } closeEditor(); cv.focus({ preventScroll: true }); };
      done.addEventListener('click', (e) => { e.stopPropagation(); finish(); });
      editor.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Escape' || e.key === 'Enter') finish(); };
      editor.onpointerdown = (e) => e.stopPropagation();
      editor.classList.add('open');
      // for tests and scripts: the same path a knob takes
      return { start: (v) => apply({ s: Math.round(v / gs) * gs }), length: (v) => apply({ l: Math.max(gs, Math.round(v / gs) * gs) }), pitch: (n) => apply({ n }), velocity: (v) => apply({ v: v / 127 }), finish,
        bend: (b) => setB(b, true), quick: (label) => { const q2 = quick.find(x => x.textContent.includes(label)); if (q2) q2.click(); }, knob: (key, v) => apply({ p: Object.assign({}, cur.p, { [key]: v }) }), get note() { return Object.assign({}, cur); } };
    }
    function closeEditor() { editor.classList.remove('open'); editor.innerHTML = ''; }
    // ---- P4 step input
    function setStep(on) { stepOn = !!on; stepBtn.classList.toggle('on', stepOn); if (stepOn) cursor = q(clampN(playStep !== null && playStep >= 0 ? cellOf(playStep, grid) : (S.size ? Math.max(...Array.from(S).map(i => notes[i] ? notes[i].s + notes[i].l : 0)) : 0), 0, steps() - FREE)); readout.textContent = stepOn ? 'step input · cursor ' + where(cursor) : ''; draw(); }
    function stepKey(e) {
      const k = e.key.length === 1 ? e.key.toLowerCase() : e.key, g = grid || 1, st = steps();
      const base = drums ? null : 12 * Math.floor((ghost && ghost.n ? ghost.n : 60) / 12);
      let n = null;
      if (STEPKEYS.includes(k)) n = drums ? rowNotes[STEPKEYS.indexOf(k)] : base + STEPKEYS.indexOf(k);
      else if (STEPKEYS2.includes(k)) n = drums ? rowNotes[STEPKEYS2.indexOf(k) + 12] : base + 12 + STEPKEYS2.indexOf(k);
      if (n !== null && n !== undefined) {
        if (!drums) n = pitchFor(n);
        const l = q(Math.min(len || g, st - cursor)), add = { s: cursor, l, n, v: 0.85 };
        const base2 = notes.length; selOnly(base2); commit(notes.concat([add])); audition([n]);
        cursor = q(Math.min(st - FREE, cursor + g)); say(cursor, n, 'step'); draw(); return true;
      }
      if (k === ' ') { cursor = q(Math.min(st - FREE, cursor + g)); say(cursor, 60, 'rest'); draw(); return true; }
      if (k === 'Backspace') { const back = q(Math.max(0, cursor - g)), j = notes.findIndex(a => Math.abs(a.s - back) < 1e-6); cursor = back; if (j >= 0) { S.clear(); commit(notes.filter((_, x) => x !== j)); } else draw(); return true; }
      if (k === 'ArrowLeft' || k === 'ArrowRight') { cursor = q(clampN(cursor + (k === 'ArrowLeft' ? -g : g), 0, st - FREE)); say(cursor, 60, 'cursor'); draw(); return true; }
      if (k === 'Escape' || k === 'Enter') { setStep(false); return true; }
      return false;
    }
    keys.addEventListener('pointerdown', (e) => { e.stopPropagation(); audition([nOf(toContent(keys, e.clientX, e.clientY).y)]); });
    // the ruler: click (or drag) moves the playhead to that point of the song
    ruler.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); if (!clip) return;
      const seek = (ev) => { const s = clampN(snapTo(toContent(ruler, ev.clientX, ev.clientY).x / pps, g0(ev) || FREE), 0, steps()); view.emit('seek', { bar: clip.startBar + s / 16 }); if (stepOn) { cursor = q(Math.min(s, steps() - FREE)); draw(); } say(s, ghost ? ghost.n : 60, stepOn ? 'cursor' : 'playhead'); };
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
      if (first) { S.clear(); closeEditor(); }
      if (!drag) notes = (c.notes || []).map(n => Object.assign({}, n));
      if (A && A.knobs) { knobsAll = A.knobs; const list = (ln && knobsAll[ln.target]) || []; const ks = list.map(k => k.key).join();
        if (laneSel._ks !== ks) { laneSel._ks = ks; laneSel.setOptions([{ value: '', label: 'velocity' }].concat(list.map(k => ({ value: k.key, label: (k.group ? k.group.toLowerCase() + ' · ' : '') + k.label })))); }
        if (xk && !list.some(k => k.key === xk.key)) setLane(''); else if (xk) xk = list.find(k => k.key === xk.key); }
      if (A) { if (A.progressions && progs !== A.progressions) { progs = A.progressions; setOptions(progSel, progs); } if (A.fillStyles && styles !== A.fillStyles) { styles = A.fillStyles; setOptions(styleSel, styles); } }
      title.textContent = '🎹 ' + (ln ? ln.name : '') + ' · ' + (c.name || 'clip'); title.style.color = ln ? ln.color : '';
      if (bars.set) bars.set(c.bars);
      el.classList.add('open'); drawKeys(); draw();
      if (first) requestAnimationFrame(() => { if (drums) { scroll.scrollTop = 0; scroll.scrollLeft = 0; return; } const ps = notes.map(n => n.n); const mid = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : 60 + key.root; scroll.scrollTop = Math.max(0, yOf(Math.round(mid)) - scroll.clientHeight / 2); scroll.scrollLeft = 0; });
    }
    function hide() { setFull(false); clip = null; openedId = null; closeEditor(); setStep(false); el.classList.remove('open'); }
    function playhead(barPos) { if (!clip) return; const p = barPos === null ? null : (barPos - clip.startBar) * 16; if (p !== playStep) { playStep = p; draw(); } }
    setMode(null); setTool('draw');
    return { el, show, hide, playhead, setFull, get full() { return !!full; }, get open() { return !!clip; }, get clipId() { return clip && clip.id; }, get drums() { return drums; },
      // for tests and the timeline's own keys: the grid/tool/zoom the roll is in, and what it holds
      get state() { return { tool, grid, len, lastLen, pps, row: ROW, step: stepOn, cursor, notes: notes.map(n => Object.assign({}, n)) }; }, setTool, zoomTo, setRow,
      setGrid: (v) => { gridSel.set(v); grid = GRIDS.find(g => g[0] === String(v))[2]; draw(); }, canvas: cv, ruler, vel, openEditor, setLane, get lane() { return xk ? xk.key : ''; }, setStep, get selected() { return Array.from(S).sort((a, b) => a - b); } };
  }
  global.EravosTimelinePianoRoll = { create, mapPoint, toContent, GRIDS };
})(window);
