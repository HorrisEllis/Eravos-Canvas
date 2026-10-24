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
 *      curves (dive, drop, rise, glide in), and any knob of the track's tool for this note only.
 * 3.57 ✍ SKETCH (7): draw anywhere on the roll; when you let go the line becomes notes — 'curves': the line is simplified
 *      (Ramer–Douglas–Peucker, ⅓ semitone) and every straight run becomes notes that glide along it, so the shape you drew is
 *      what plays · 'notes': one note per grid cell on the nearest (scale) pitch, repeats merged. Shift: replaces the notes
 *      under the stroke. Notes may also OSCILLATE (b.osc: vibrato, trill, siren …) — the note's knobs, ∿ row. */
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
  let CLIPBOARD = null;
  const TOOL_PANEL = { on: true };   // 3.59 the tool panel on/off, shared by every piano roll for this session   // shared by every piano roll: copy in one clip, paste in another
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
      [stampSel, lockT, progSel, styleSel, voiceSel, fillBtn, rowSel, sketchSel].forEach(c => { c.el.style.display = drums ? 'none' : ''; });
      if (drums && len === 0) lastLen = 1;
    }
    // ---- toolbar
    const title = h('span', { class: 'tlpr-title', text: '' });
    // 3.59 THE ROLL IS THE TOOL'S EDITOR: the corner says (and changes) which tool this track plays; the side panel is that tool
    // (its presets and every knob, live) until you click a note — then that note — and back to the tool when you let it go.
    let toolsAll = {}, toolOn = TOOL_PANEL.on, edMode = null, toolCtl = new Map(), toolSig = '';
    const toolSel = UI.Select({ label: '', hint: 'the tool this track plays — change it here', options: [{ value: '', label: '— tool —' }], value: '', onChange: (v) => { if (lane && v && v !== lane.target) view.emit('lane_edit', { id: lane.id, patch: { target: v } }); } });
    toolSel.el.classList.add('tlpr-toolsel');
    const toolBtn = h('button', { class: 'tlpr-tool tlpr-ed', title: 'the tool panel: its presets and every knob, beside the notes (on / off)', text: '🎛' });
    toolBtn.addEventListener('click', (e) => { e.stopPropagation(); toolOn = TOOL_PANEL.on = !toolOn; toolBtn.classList.toggle('on', toolOn); if (edMode !== 'note') closeEditor(); });
    const bars = UI.NumberDrag({ label: 'bars', min: 1, max: 128, step: 1, value: 4, suffix: ' bars', onChange: (v) => clip && view.emit('clip_edit', { id: clip.id, patch: { bars: v } }) });
    const tools = [['draw', '✎', 'Draw (1) — click adds, drag moves, drag an edge to stretch'], ['paint', '🖌', 'Paint (2) — drag across the grid: one note per grid cell, following the pointer'],
      ['split', '✂', 'Split (3) — click a note to cut it at the grid line'], ['erase', '⌫', 'Erase (4) — click or drag across notes to delete them'],
      ['select', '⬚', 'Select (5) — drag a box; Shift adds; drag a selected note to move them all (Ctrl+drag copies)'],
      ['bend', '〰', 'Bend (6) — drag a note up or down: its pitch curves there (grab its start: it slides in from there) · Alt fine · right-click flattens'],
      ['sketch', '✍', 'Sketch (7) — draw a line anywhere: it becomes notes (curves: they glide along your line · notes: stepped on the scale) · Shift replaces what is under it']];
    const toolBtns = tools.map(([id, icon, hint]) => { const b = h('button', { class: 'tlpr-tool', title: hint, 'aria-label': hint, 'data-tool': id, text: icon }); b.addEventListener('click', (e) => { e.stopPropagation(); setTool(id); }); return b; });
    const toolBox = h('span', { class: 'tlpr-tools', role: 'group', 'aria-label': 'note tools' }, toolBtns);
    function setTool(t) { tool = t; toolBtns.forEach(b => b.classList.toggle('on', b.dataset.tool === t)); cv.dataset.tool = t; ghost = null; draw(); }
    const gridSel = UI.Select({ label: 'Grid', hint: 'snap — hold Alt to place freely', options: GRIDS.map(([v, l]) => ({ value: v, label: l })), value: '1', onChange: (v) => { grid = GRIDS.find(g => g[0] === String(v))[2]; draw(); } });
    const lenSel = UI.Select({ label: 'Length', hint: '"last" = the length of the last note you drew or stretched', options: [{ value: '0', label: 'last' }, { value: '0.25', label: '1/64' }, { value: '0.5', label: '1/32' }, { value: '1', label: '1/16' }, { value: '2', label: '1/8' }, { value: '4', label: '1/4' }, { value: '8', label: '1/2' }, { value: '16', label: '1 bar' }, { value: '32', label: '2 bars' }, { value: '64', label: '4 bars' }], value: '0', onChange: (v) => { len = +v; } });
    const stampSel = UI.Select({ label: 'Click adds', options: [{ value: 'note', label: 'note' }, { value: 'triad', label: 'triad' }, { value: 'seventh', label: '7th chord' }, { value: 'add9', label: 'add9 chord' }, { value: 'sus2', label: 'sus2 chord' }, { value: 'power', label: 'power' }], value: 'note', onChange: (v) => { stamp = v; } });
    const lockT = UI.Toggle({ label: 'Scale lock', value: true, onChange: (v) => { lock = v; } });
    let sketchAs = 'curves';
    const sketchSel = UI.Select({ label: 'Sketch makes', hint: 'curves: notes that glide along the line you draw · notes: stepped notes on the scale', options: [{ value: 'curves', label: 'curves' }, { value: 'notes', label: 'notes' }], value: 'curves', onChange: (v) => { sketchAs = v; } });
    const zoomSel = UI.Select({ label: 'Zoom', hint: 'Ctrl+wheel zooms smoothly', options: [{ value: '8', label: 'S' }, { value: '14', label: 'M' }, { value: '22', label: 'L' }, { value: '40', label: 'XL' }, { value: 'fit', label: 'fit clip' }], value: '14', onChange: (v) => { if (v === 'fit') fit(); else zoomTo(+v); } });
    // 3.53 EXPRESSION LANE — the lane under the notes draws velocity, or ANY knob of this track's tool, per note (note.p[knob]):
    // that note plays with that value (the tool takes it for the note's length, then hands back to its own knob — sdk-music
    // ctx.onNote). Drag draws, Ctrl-drag ramps, right-click hands a note back to the knob (a faint ghost = "uses the knob").
    let knobsAll = {}, knobsRaw = {}, xk = null, VH = VEL, autoL = null, lanesAll = [], pendingCurve = null;   // 3.58 autoL: a track curve drawn in the lane
    const laneSel = UI.Select({ label: 'Lane', hint: 'what the lane under the notes draws — velocity, or any knob of this track’s tool, per note', options: [{ value: '', label: 'velocity' }], value: '', onChange: (v) => setLane(v) });
    function setLane(v) {
      if (v === 'newpitch') { if (lane) { pendingCurve = '@pitch'; view.emit('lane_add', { kind: 'auto', target: lane.target, key: '@pitch' }); } laneSel.set(''); return; }
      if (String(v).startsWith('curve:')) { autoL = lanesAll.find(l => l.id === String(v).slice(6)) || null; xk = null; VH = autoL ? 96 : VEL; vcorner.textContent = autoL ? '〰 ' + autoL.name : 'vel'; vcorner.title = 'the track’s curve over this clip — click adds a point, drag moves, right-click removes'; if (laneSel.select.value !== String(v)) laneSel.set(String(v)); draw(); return; }
      autoL = null; const list = (lane && knobsAll[lane.target]) || []; xk = list.find(k => k.key === v) || null; VH = xk ? 72 : VEL; vcorner.textContent = xk ? xk.label : 'vel'; vcorner.title = xk ? xk.label + ' per note — right-click a bar: back to the knob' : 'velocity'; if (laneSel.select.value !== (xk ? xk.key : '')) laneSel.set(xk ? xk.key : ''); draw(); }
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
    const bar = h('div', { class: 'tlpr-bar' }, [toolSel.el, title, bars.el, toolBtn, h('span', { class: 'tlpr-sep' }), toolBox, gridSel.el, lenSel.el, stampSel.el, lockT.el, sketchSel.el, zoomSel.el, rowSel.el, laneSel.el, edBox, readout, h('span', { class: 'tlpr-sep' }), progSel.el, styleSel.el, voiceSel.el, fillBtn.el, clearBtn.el, fullBtn.el, closeBtn.el]);
    const keys = document.createElement('canvas'); keys.className = 'tlpr-keys';
    const ruler = document.createElement('canvas'); ruler.className = 'tlpr-ruler';
    const cv = document.createElement('canvas'); cv.className = 'tlpr-grid'; cv.tabIndex = 0; cv.setAttribute('role', 'application'); cv.setAttribute('aria-label', 'Note grid — 1 draw, 2 paint, 3 split, 4 erase, 5 select; click to add, drag to move, drag an edge to stretch, Shift-click or drag a box to select, Ctrl+C / V / D, arrow keys nudge, Q quantize, double-click for the note knobs; hold Alt for no snap');
    const vel = document.createElement('canvas'); vel.className = 'tlpr-vel'; vel.setAttribute('aria-label', 'velocity lane — drag to draw velocities, Ctrl-drag for a ramp');
    const corner = h('div', { class: 'tlpr-corner' }), vcorner = h('div', { class: 'tlpr-vcorner', text: 'vel' });
    const keyCol = h('div', { class: 'tlpr-keycol' }, [corner, keys, vcorner]);
    const gridCol = h('div', { class: 'tlpr-gridcol' }, [ruler, cv, vel]);
    const editor = h('div', { class: 'tlpr-edit', role: 'dialog', 'aria-label': 'note fields' });
    const scroll = h('div', { class: 'tlpr-scroll' }, [keyCol, gridCol]);
    const main = h('div', { class: 'tlpr-main' }, [scroll, editor]);   // 3.58 the note inspector docks beside the notes
    const el = h('div', { class: 'tlpr' }, [bar, main]);

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
        if (!drums && nt.b) { drawBend(g, nt, S.has(i)); curveMark(g, nt, x, y, w); return; }   // 3.58 a bent note IS its curve: the block bends
        g.globalAlpha = 0.35 + 0.65 * nt.v; g.fillStyle = c2; g.fillRect(x + 1, y + 1, w - 1, ROW - 2); g.globalAlpha = 1;
        g.strokeStyle = S.has(i) ? '#fff' : '#000'; g.lineWidth = 1; g.strokeRect(x + 1.5, y + 1.5, w - 2, ROW - 3);
        curveMark(g, nt, x, y, w);
      });
      // 3.62 a repeating clip: past its repeat point the notes are the first bars again — shaded, drawn faint, not editable there
      const L = clip.loop || 0;
      if (L && L < st) {
        g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(L * pps, 0, W - L * pps, H);
        g.globalAlpha = 0.3; for (let o = L; o < st; o += L) notes.forEach(nt => { if (nt.s >= L || (drums && rowNotes.indexOf(nt.n) < 0)) return; const x = (o + nt.s) * pps; if (x >= st * pps) return; g.fillStyle = col; g.fillRect(x + 1, yOf(nt.n) + 1, Math.max(3, Math.min(nt.l, L - nt.s, st - o - nt.s) * pps - 1) - 1, ROW - 2); });
        g.globalAlpha = 1; g.fillStyle = '#fff'; g.fillRect(L * pps - 1, 0, 2, H);
        g.font = '10px sans-serif'; g.fillText('⟳ repeats from here', L * pps + 6, Math.max(12, (scroll.scrollTop || 0) + 12));
      }
      if (ghost && !drag) {   // where a click lands
        const x = ghost.s * pps, y = yOf(ghost.n), w = Math.max(3, ghost.l * pps - 1);
        g.globalAlpha = 0.45; g.fillStyle = tool === 'erase' ? '#ff4d4d' : '#ffd24a'; g.fillRect(x + 1, y + 1, w - 1, ROW - 2); g.globalAlpha = 1;
        g.strokeStyle = '#ffd24a'; g.setLineDash([3, 2]); g.strokeRect(x + 1.5, y + 1.5, w - 2, ROW - 3); g.setLineDash([]);
      }
      if (ghost && ghost.split !== undefined) { g.fillStyle = '#ffd24a'; g.fillRect(ghost.split * pps, yOf(ghost.n), 2, ROW); }
      if (drag && drag.mode === 'box' && drag.armed) { const bx = Math.min(drag.x0, drag.x1), by = Math.min(drag.y0, drag.y1); g.fillStyle = 'rgba(255,210,74,.12)'; g.fillRect(bx, by, Math.abs(drag.x1 - drag.x0), Math.abs(drag.y1 - drag.y0)); g.strokeStyle = '#ffd24a'; g.strokeRect(bx + 0.5, by + 0.5, Math.abs(drag.x1 - drag.x0), Math.abs(drag.y1 - drag.y0)); }
      if (drag && drag.mode === 'sketch' && drag.pts.length > 1) { g.save(); g.strokeStyle = '#ffe08a'; g.lineWidth = 3; g.lineCap = g.lineJoin = 'round'; g.globalAlpha = 0.9; g.beginPath(); drag.pts.forEach(([ss, pp], k) => { const xx = ss * pps, yy = yOfP(pp); k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); }); g.stroke(); g.restore(); }
      if (stepOn) { g.fillStyle = '#00e5ff'; g.fillRect(cursor * pps, 0, 2, H); }
      if (playStep !== null && playStep >= 0 && playStep <= st) { g.fillStyle = '#fff'; g.fillRect(playStep * pps, 0, 2, H); }
      drawRuler(W); drawVel(W);
    }
    // 3.56 the pitch curve of a bent note: from its start (at from) to its end (at to), one row per semitone
    const SHAPES = { smooth: (x) => x * x * (3 - 2 * x), linear: (x) => x, early: (x) => 1 - Math.pow(1 - x, 3), late: (x) => x * x * x };
    const ODIV = { '4/1': 1 / 16, '2/1': 1 / 8, '1/1': 0.25, '1/2': 0.5, '1/2t': 0.75, '1/4': 1, '1/4t': 1.5, '1/8': 2, '1/8t': 3, '1/16': 4, '1/16t': 6, '1/32': 8 };
    const cyc = (r, beats) => typeof r === 'number' ? r * beats * 0.5 : (ODIV[r] || 0) * beats;   // Hz drawn at 120 bpm (½ s a beat)
    const owave = (sh, ph) => { const f = ph - Math.floor(ph); if (sh === 'triangle') return 1 - 4 * Math.abs(f - 0.5); if (sh === 'saw') return 2 * f - 1; if (sh === 'square') return f < 0.5 ? 1 : -1; if (sh === 'random') { const x = Math.sin(Math.floor(ph) * 12.9898 + 78.233) * 43758.5453; return 2 * (x - Math.floor(x)) - 1; } return Math.sin(2 * Math.PI * f); };
    function bendY(nt, f) {
      const b = nt.b, at = b.at || 0, k = f <= at ? 0 : (SHAPES[b.shape] || SHAPES.smooth)((f - at) / (1 - at)); let st = b.from + (b.to - b.from) * k;
      const o = b.osc; if (o && o.depth > 0) { const beats = nt.l / 4, c0 = cyc(o.rate, beats), c1 = o.rateTo ? cyc(o.rateTo, beats) : c0, ph = c0 * f + (c1 - c0) * f * f / 2, fd = o.fade > 0 ? Math.min(1, f / o.fade) : 1; st += o.depth * fd * owave(o.shape, ph); }
      return yOf(nt.n) + ROW / 2 - st * ROW;
    }
    // 3.65 curve helpers shared by the curve editor and note behaviours. A knob's ROLE: filter, drive, wobble (else knob:<key>);
    // its PICTURE: 0…1 across its range — on a frequency knob as the ear hears it (log), so a curve drawn or saved on one tool's
    // cutoff means the same opening on another's
    const C_ROLES = [['filter', /cutoff|bright|tone|freq/i], ['drive', /drive|grit|fold|crush|dist/i], ['wobble', /depth|wobble/i]];
    const roleRank = (k) => { const r = C_ROLES.findIndex(([, re]) => re.test(k.key) || re.test(k.label || '')); return r < 0 ? 9 : r; };
    const roleOf = (k) => { const r = C_ROLES.find(([, re]) => re.test(k.key) || re.test(k.label || '')); return r ? r[0] : 'knob:' + k.key; };
    const numKnobs = () => ((lane && knobsAll[lane.target]) || []).filter(k => k.type === 'number' || k.type === 'integer');
    const knobForRole = (role) => { const ks = numKnobs(); if (role.startsWith('knob:')) return ks.find(k => k.key === role.slice(5)) || null; const re = (C_ROLES.find(x => x[0] === role) || [])[1]; return re ? ks.filter(k => re.test(k.key) || re.test(k.label || '')).sort((a, b) => roleRank(a) - roleRank(b))[0] || null : null; };
    const isLogK = (k) => k.unit === 'Hz' && k.min > 0 && k.max / k.min >= 20;
    const fyK = (k, v) => isLogK(k) ? clampN(Math.log(Math.max(k.min, +v) / k.min) / Math.log(k.max / k.min), 0, 1) : xFrac(k, v);
    const vyK = (k, f) => { f = clampN(f, 0, 1); let v = isLogK(k) ? k.min * Math.pow(k.max / k.min, f) : k.min + f * (k.max - k.min); if (k.type === 'integer') v = Math.round(v); return +(+v).toPrecision(4); };
    // 3.67 BÉZIER: a point may carry the handle of the segment that ends at it — [t, v, [hx 0…1 across the segment, handle v]] — the
    // segment is then the quadratic Bézier through its ends with that control point (the SDK plays exactly this: sdk-music bezAt)
    // a curved segment bends in the knob's own picture: log on a frequency knob (k: the knob, when known)
    const segAt = (a, b, x, k) => { if (!(b[0] > a[0])) return b[1]; const hd = b[2]; if (!hd) return a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]);
      if (k && isLogK(k)) { const L = (v) => Math.log(Math.max(k.min, +v)); return Math.exp(segAt([a[0], L(a[1])], [b[0], L(b[1]), [hd[0], L(hd[1])]], x)); }
      const cx = a[0] + hd[0] * (b[0] - a[0]), A = a[0] - 2 * cx + b[0], B = 2 * (cx - a[0]), C = a[0] - x; let u = Math.abs(A) < 1e-12 ? -C / B : (-B + Math.sqrt(Math.max(0, B * B - 4 * A * C))) / (2 * A); u = clampN(u, 0, 1);
      return (1 - u) * (1 - u) * a[1] + 2 * u * (1 - u) * hd[1] + u * u * b[1]; };
    const valAt = (pts, x, k) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) return segAt(pts[i - 1], pts[i], x, k); return pts[pts.length - 1][1]; };
    const flattenC = (pts, k) => { if (!pts.some(q => q[2])) return pts; const out = [pts[0].slice(0, 2)]; for (let i = 1; i < pts.length; i++) { const a = pts[i - 1], b = pts[i]; if (b[2]) for (let j = 1; j < 8; j++) { const x = a[0] + (b[0] - a[0]) * j / 8; out.push([x, segAt(a, b, x, k)]); } out.push(b.slice(0, 2)); } return out; };
    // a picture-space curve onto a knob: on a log knob each straight segment is resampled, so the straight line the tool plays sounds as
    // drawn; a curved segment keeps its handle (moved into the knob's units)
    const toKnob = (k, pts) => { const out = []; pts.forEach((q, i) => { if (i && isLogK(k) && !q[2]) { const a = pts[i - 1]; for (let j = 1; j < 4; j++) { const f = j / 4; out.push([+(a[0] + (q[0] - a[0]) * f).toFixed(4), vyK(k, a[1] + (q[1] - a[1]) * f)]); } } out.push(q[2] ? [q[0], vyK(k, q[1]), [q[2][0], vyK(k, q[2][1])]] : [q[0], vyK(k, q[1])]); }); return out; };
    let behavioursAll = [];
    // 3.65 the part of a note's curves between f0 and f1 (fractions of it), as the curves of that part (the split tool)
    function cropCurves(c, f0, f1) {
      const o = {}; Object.keys(c).forEach(k => { const pts = flattenC(c[k], numKnobs().find(z => z.key === k)), at = (x) => { if (x <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return b[0] > a[0] ? a[1] + (b[1] - a[1]) * (x - a[0]) / (b[0] - a[0]) : b[1]; } return pts[pts.length - 1][1]; };
        o[k] = [[0, at(f0)]].concat(pts.filter(q => q[0] > f0 && q[0] < f1).map(q => [(q[0] - f0) / (f1 - f0), q[1]]), [[1, at(f1)]]); }); return o;
    }
    // 3.65 a note with curves shows the first of them as a thin line through its block (low at the bottom, high at the top)
    function curveMark(g, nt, x, y, w) {
      if (!nt.c || w < 8) return; const key = Object.keys(nt.c)[0], pts = nt.c[key], k = ((lane && knobsAll[lane.target]) || []).find(z => z.key === key); if (!pts || !k) return;
      const f = (v) => k.unit === 'Hz' && k.min > 0 && k.max / k.min >= 20 ? Math.log(Math.max(k.min, v) / k.min) / Math.log(k.max / k.min) : (v - k.min) / ((k.max - k.min) || 1);
      const Y = (v) => y + ROW - 3 - clampN(f(v), 0, 1) * (ROW - 6);
      g.save(); g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 1.2; g.beginPath(); const N = Math.max(8, Math.min(64, Math.round(w / 3)));
      for (let j = 0; j <= N; j++) { const t = j / N, px = x + 2 + t * (w - 4); if (j) g.lineTo(px, Y(valAt(pts, t, k))); else g.moveTo(px, Y(valAt(pts, t, k))); } g.stroke(); g.restore();
    }
    function drawBend(g, nt, on) {
      const x0 = nt.s * pps + 1, w = Math.max(3, nt.l * pps - 2), col = lane ? lane.color : '#ff66cc';
      g.save(); g.lineJoin = 'round';
      const o = nt.b.osc, NS = o && o.depth > 0 ? Math.min(600, Math.max(48, Math.ceil(Math.max(cyc(o.rate, nt.l / 4), o.rateTo ? cyc(o.rateTo, nt.l / 4) : 0) * 16))) : 32;
      // where the note is written: a faint outline on its own row (drag it there to move it)
      g.globalAlpha = 0.22; g.strokeStyle = col; g.setLineDash([3, 3]); g.strokeRect(x0 + 0.5, yOf(nt.n) + 1.5, w - 1, ROW - 3); g.setLineDash([]);
      // the block itself, bent along the pitch it plays: a ribbon one row thick (edge, then body)
      const path = () => { g.beginPath(); for (let k = 0; k <= NS; k++) { const xx = x0 + w * k / NS, yy = bendY(nt, k / NS); k ? g.lineTo(xx, yy) : g.moveTo(xx, yy); } };
      g.lineCap = 'butt'; g.globalAlpha = 1; g.strokeStyle = on ? '#ffffff' : '#000000'; g.lineWidth = Math.max(3, ROW - 1); path(); g.stroke();
      g.globalAlpha = 0.35 + 0.65 * nt.v; g.strokeStyle = col; g.lineWidth = Math.max(2, ROW - 3); path(); g.stroke();
      if (o && o.depth > 0) { g.globalAlpha = 0.9; g.strokeStyle = '#7cf7ff'; g.lineWidth = 1; path(); g.stroke(); }   // ∿ a thin cyan spine on an oscillating note
      g.globalAlpha = 1; g.fillStyle = on ? '#ffffff' : '#ffe08a'; g.beginPath(); g.arc(x0 + w, bendY(nt, 1), 3, 0, 7); g.fill();
      if (ROW >= 9 && w >= 36) { g.font = '9px monospace'; g.fillText((nt.b.from || nt.b.to ? (nt.b.to > 0 ? '+' : '') + (+nt.b.to.toFixed(1)) + ' st' : '') + (o && o.depth > 0 ? ' ∿' : ''), x0 + w + 5, bendY(nt, 1) + 3); }
      g.restore();
    }
    const bendSay = (b) => !b ? 'flat' : (b.from ? 'from ' + (b.from > 0 ? '+' : '') + b.from + ' st ' : '') + 'to ' + (b.to > 0 ? '+' : '') + b.to + ' st';
    function drawVel(W) {
      const g = size(vel, W, VH); vcorner.style.width = KW + 'px'; vcorner.style.height = VH + 'px';
      g.fillStyle = '#0b1119'; g.fillRect(0, 0, W, VH); g.fillStyle = '#223044'; g.fillRect(0, 0, W, 1);
      for (let s = 0; s <= steps(); s += 4) { g.fillStyle = s % 16 === 0 ? '#2d3f57' : '#151f2c'; g.fillRect(s * pps, 0, 1, VH); }
      if (autoL) return drawCurve(g, W);
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
    // 3.57 sketch: a pointer y → a fractional pitch (row centres are whole notes), and back
    const pOf = (y) => clampN(HI - (y - ROW / 2) / ROW, LO, HI), yOfP = (p) => (HI - p) * ROW + ROW / 2;
    function rdp(pts, eps) {
      if (pts.length < 3) return pts.slice(); const keep = new Array(pts.length).fill(false); keep[0] = keep[pts.length - 1] = true; const st = [[0, pts.length - 1]];
      while (st.length) { const [a, b] = st.pop(); let mx = 0, at = -1; for (let i = a + 1; i < b; i++) { const t = (pts[i][0] - pts[a][0]) / ((pts[b][0] - pts[a][0]) || 1e-9), yv = pts[a][1] + (pts[b][1] - pts[a][1]) * t, dd = Math.abs(pts[i][1] - yv); if (dd > mx) { mx = dd; at = i; } } if (mx > eps && at > 0) { keep[at] = true; st.push([a, at], [at, b]); } }
      return pts.filter((_, i) => keep[i]);
    }
    /** the drawn line → notes (one undo step). Exposed for tests: sketch(points [[step, pitch]], 'curves' | 'notes', replace) */
    function sketchToNotes(d, as) {
      as = as || sketchAs; const g = grid || FREE, st = steps();
      // left to right, the last pass over a spot wins (going back over the line redraws it)
      const byS = new Map(); d.pts.forEach(([ss, pp]) => byS.set(Math.round(ss * 64) / 64, pp));
      const pts = Array.from(byS.entries()).sort((a, b) => a[0] - b[0]).map(([ss, pp]) => [clampN(ss, 0, st), pp]);
      if (pts.length < 2 || pts[pts.length - 1][0] - pts[0][0] < g * 0.5) { draw(); return []; }
      const at = (s0) => { if (s0 <= pts[0][0]) return pts[0][1]; for (let i = 1; i < pts.length; i++) if (pts[i][0] >= s0) { const a = pts[i - 1], b = pts[i]; return a[1] + (b[1] - a[1]) * (s0 - a[0]) / ((b[0] - a[0]) || 1e-9); } return pts[pts.length - 1][1]; };
      const s0 = q(Math.floor(pts[0][0] / g + 1e-9) * g), s1 = q(Math.min(st, Math.ceil(pts[pts.length - 1][0] / g - 1e-9) * g)), add = [];
      if (as === 'notes') {
        for (let c = s0; c < s1 - 1e-9; c = q(c + g)) { const n = clampN(pitchFor(Math.round(at(c + g / 2))), LO, HI), last = add[add.length - 1]; if (last && last.n === n && Math.abs(last.s + last.l - c) < 1e-6) last.l = q(last.l + g); else add.push({ s: c, l: q(g), n, v: 0.85 }); }
      } else {
        // the line's corners, on the grid; each straight run → notes that glide along it (a note at most a bar, at least a grid cell)
        const corners = rdp(pts, 1 / 3).map(([ss]) => q(clampN(Math.round(ss / g) * g, s0, s1)));
        const cuts = Array.from(new Set([s0].concat(corners, [s1]))).sort((a, b) => a - b);
        for (let k = 0; k + 1 < cuts.length; k++) {
          for (let a = cuts[k]; a < cuts[k + 1] - 1e-9;) {
            const b = q(Math.min(cuts[k + 1], a + 16)); if (b - a < g * 0.99 && add.length) { add[add.length - 1].l = q(add[add.length - 1].l + (b - a)); a = b; continue; }
            const pa = at(a), pb = at(b), n = clampN(lock ? pitchFor(Math.round(pa)) : Math.round(pa), LO, HI), nt = { s: a, l: q(b - a), n, v: 0.85 };
            const from = Math.round((pa - n) * 100) / 100, to = Math.round((pb - n) * 100) / 100;
            if (Math.abs(from) >= 0.05 || Math.abs(to) >= 0.05) nt.b = { from, to, shape: 'linear', at: 0 };
            add.push(nt); a = b;
          }
        }
      }
      if (!add.length) { draw(); return []; }
      const keep = d.replace ? notes.filter(nt => nt.s + nt.l <= s0 + 1e-6 || nt.s >= s1 - 1e-6) : notes;
      const base = keep.length; selOnly(add.map((_, k) => base + k)); commit(keep.concat(add)); audition([add[0].n]);
      readout.textContent = `✍ ${add.length} notes${as === 'curves' ? ' along your line' : ''}`; return add;
    }
    // ---- 3.58 the track's curve, in the lane under the notes: the same points as the timeline's lane, for this clip's bars
    const curveK = () => autoL && lane ? ((knobsRaw[lane.target] || []).find(k => k.key === autoL.key) || { min: 0, max: 1, type: 'number' }) : null;
    const cX = (bar) => (bar - clip.startBar) * 16 * pps, cBar = (x) => clip.startBar + x / pps / 16;
    const cY = (k, v) => { const f = k.type === 'enum' ? Math.max(0, k.options.map(String).indexOf(String(v))) / Math.max(1, k.options.length - 1) : clampN((+v - k.min) / ((k.max - k.min) || 1), 0, 1); return 5 + (1 - f) * (VH - 10); };
    const cV = (k, y) => { const f = clampN(1 - (y - 5) / (VH - 10), 0, 1); if (k.type === 'enum') return k.options[Math.round(f * (k.options.length - 1))]; let v = k.min + f * (k.max - k.min); if (k.type === 'integer') v = Math.round(v); else v = Math.round(v / (k.step || 0.01)) * (k.step || 0.01); return +clampN(v, k.min, k.max).toFixed(4); };
    const cPts = () => (drag && drag.mode === 'curve' ? drag.pts : (autoL.points || []));
    function drawCurve(g, W) {
      const k = curveK(), pts = cPts(), col = '#ffd24a';
      if (k.min < 0 && k.max > 0) { g.fillStyle = '#1d2a3a'; g.fillRect(0, cY(k, 0), W, 1); }
      g.font = '9px monospace'; g.fillStyle = '#7f93a8'; g.fillText(k.max + (k.unit ? ' ' + k.unit : ''), 3, 11); g.fillText(String(k.min), 3, VH - 4);
      if (!pts.length) { g.fillStyle = '#7f93a8'; g.font = '10px sans-serif'; g.fillText('click to draw the ' + autoL.name + ' curve for this clip · drag moves a point · right-click removes', 60, VH / 2 + 4); return; }
      const at = (bar) => { if (bar <= pts[0][0]) return pts[0][1]; const L = pts[pts.length - 1]; if (bar >= L[0]) return L[1]; let j = 1; while (pts[j][0] < bar) j++; const a = pts[j - 1], b = pts[j]; return typeof a[1] !== 'number' ? a[1] : a[1] + (b[1] - a[1]) * (bar - a[0]) / (b[0] - a[0]); };
      g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); for (let x = 0; x <= W; x += 2) { const y = cY(k, at(cBar(x))); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.lineWidth = 1;
      if (autoL.osc && k.type !== 'enum') { g.strokeStyle = '#7cf7ff'; g.globalAlpha = 0.8; g.beginPath(); for (let x = 0; x <= W; x += 2) { const bar = cBar(x), beats = (bar - 1) * 4, o = autoL.osc, ph = typeof o.rate === 'number' ? beats * 0.5 * o.rate : beats * (ODIV[o.rate] || 1), y = cY(k, clampN(+at(bar) + o.depth * owave(o.shape, ph), k.min, k.max)); x ? g.lineTo(x, y) : g.moveTo(x, y); } g.stroke(); g.globalAlpha = 1; }
      g.fillStyle = '#fff'; pts.forEach(q => { const x = cX(q[0]); if (x < -4 || x > W + 4) return; g.beginPath(); g.arc(x, cY(k, q[1]), 3.5, 0, 7); g.fill(); });
    }
    function curveDown(e) {
      const { x, y } = vLocal(e), k = curveK(), pts = (autoL.points || []).map(q => q.slice()), near = pts.findIndex(q => Math.abs(cX(q[0]) - x) < 7 && Math.abs(cY(k, q[1]) - y) < 8);
      if (e.button === 2) { if (near >= 0) { pts.splice(near, 1); view.emit('auto_points', { id: autoL.id, points: pts }); autoL = Object.assign({}, autoL, { points: pts }); draw(); } return; }
      let at = near;
      if (at < 0) { const bar = Math.max(1, Math.round(cBar(x) * 64) / 64); pts.push([bar, cV(k, y)]); pts.sort((a, b) => a[0] - b[0]); at = pts.findIndex(q => q[0] === bar); }
      drag = { mode: 'curve', pts, at, changed: near < 0 }; say(clip.startBar ? (pts[at][0] - clip.startBar) * 16 : 0, 60, autoL.name + ' ' + pts[at][1]); draw();
    }
    function curveMove(e) {
      const { x, y } = vLocal(e), k = curveK(), q = drag.pts[drag.at], lo = drag.at > 0 ? drag.pts[drag.at - 1][0] + 1e-3 : 1, hi = drag.at < drag.pts.length - 1 ? drag.pts[drag.at + 1][0] - 1e-3 : 1e9;
      q[0] = clampN(Math.round(cBar(x) * 64) / 64, lo, hi); q[1] = cV(k, y); drag.changed = true; readout.textContent = autoL.name + ' ' + q[1] + (k.unit ? ' ' + k.unit : '') + ' · bar ' + q[0].toFixed(2); draw();
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
    function hit(x, y) { const n = nOf(y), st = x / pps; for (let i = notes.length - 1; i >= 0; i--) { const a = notes[i]; if (st < a.s || st > a.s + a.l) continue; if (a.n === n) return i;
      if (a.b && !drums && Math.abs(y - bendY(a, (st - a.s) / Math.max(a.l, 1e-6))) <= ROW / 2 + 1) return i; } return -1; }   // a bent note is grabbed on its curve too
    // which part of a note the pointer is on: 'L' / 'R' edge (max 4 px, 25 % of the note) or the body
    function zone(i, x) { const a = notes[i], x0 = a.s * pps, x1 = (a.s + a.l) * pps, z = Math.max(4, (x1 - x0) * 0.25); return x1 - x < z ? 'R' : x - x0 < z && a.l > (grid || FREE) ? 'L' : 'B'; }

    cv.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); cv.focus({ preventScroll: true }); if (!clip) return;
      const { x, y } = local(e); const i = hit(x, y), g = g0(e), st = steps();
      if (e.button === 2 && tool === 'bend') { if (i >= 0 && notes[i].b) { const next = notes.slice(), sel = S.has(i) ? Array.from(S) : [i]; sel.forEach(j => { if (next[j]) { next[j] = Object.assign({}, next[j]); delete next[j].b; } }); commit(next); say(notes[i].s, notes[i].n, 'bend: flat'); } return; }
      if (e.button === 2) { if (i >= 0) { S.clear(); commit(notes.filter((_, j) => j !== i)); } return; }
      if (i < 0 || tool === 'erase') closeEditor();
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      ghost = null;
      if (tool === 'erase') { drag = { mode: 'erase', orig: notes.slice(), x0: x, y0: y, armed: true, changed: false }; eraseAt(x, y); draw(); return; }
      if (tool === 'sketch') { if (drums) return; drag = { mode: 'sketch', pts: [[x / pps, pOf(y)]], replace: e.shiftKey, armed: true, changed: false }; draw(); return; }
      if (tool === 'bend') {
        if (drums || i < 0) return; if (!S.has(i)) selOnly(i);
        const a = notes[i], end = (x / pps - a.s) / Math.max(a.l, 1e-6) < 0.33 ? 'from' : 'to';
        drag = { mode: 'bend', grab: i, end, idx: Array.from(S), orig: notes.map(n => Object.assign({}, n)), x0: x, y0: y, row0: yOf(a.n) + ROW / 2, armed: false, changed: false };
        draw(); return;
      }
      if (tool === 'split') {
        if (i >= 0) { const a = notes[i], at = q(snapTo(x / pps, g)); if (at > a.s + 1e-6 && at < a.s + a.l - 1e-6) { const next = notes.slice(); const fc = (at - a.s) / a.l, L = Object.assign({}, a, { l: q(at - a.s) }), Rn = Object.assign({}, a, { s: at, l: q(a.s + a.l - at) }); if (a.c) { L.c = cropCurves(a.c, 0, fc); Rn.c = cropCurves(a.c, fc, 1); } next.splice(i, 1, L, Rn); selOnly(i + 1); commit(next); } }   // 3.65 each half keeps its part of the curves
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
      if (drag.mode === 'sketch') { const s2 = clampN(x / pps, 0, st), p2 = pOf(y), l2 = drag.pts[drag.pts.length - 1]; if (Math.abs(s2 - l2[0]) * pps + Math.abs(p2 - l2[1]) * ROW > 1.5) drag.pts.push([s2, p2]); say(s2, Math.round(p2), 'sketch'); draw(); return; }
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
      if (tool === 'sketch') { ghost = null; cv.classList.toggle('edge', false); say(x / pps, Math.round(pOf(y)), '✍ draw a line — it becomes ' + sketchAs); draw(); return; }
      if (tool === 'bend') { ghost = null; cv.classList.toggle('edge', false); if (i >= 0) say(notes[i].s, notes[i].n, (notes[i].b ? 'bend ' + bendSay(notes[i].b) + ' · ' : '') + ((x / pps - notes[i].s) / notes[i].l < 0.33 ? 'drag: slide in from…' : 'drag: bend to…')); else readout.textContent = '〰 drag a note up or down'; draw(); return; }
      if (i >= 0) say(notes[i].s, notes[i].n, `len ${+(notes[i].l / 4).toFixed(3)} beat · click: edit it`); else say(gh ? gh.s : x / pps, n);
    }
    cv.addEventListener('pointerleave', () => { hoverS = null; if (!drag && ghost) { ghost = null; draw(); drawKeys(); } readout.textContent = ''; });
    const endDrag = () => {
      cv.classList.remove('move'); if (!drag) return; const d = drag; drag = null;
      if ((d.mode === 'resize' || d.mode === 'resizeL') && d.changed) lastLen = notes[d.grab].l;   // new notes take this length
      if (d.mode === 'box') { draw(); return; }
      if (d.mode === 'sketch') { sketchToNotes(d); return; }
      // 3.58 a click on a note (no drag) opens it in the inspector; after a move the open inspector follows the note
      if ((d.mode === 'move' || d.mode === 'resize' || d.mode === 'resizeL' || d.mode === 'bend') && d.grab !== undefined && !d.copied && (!d.changed || editor.classList.contains('open'))) { const g2 = d.grab; if (d.changed) commit(notes.slice()); if (notes[g2]) openEditor(g2); return; }
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
      if (!mod && !e.altKey && ['1', '2', '3', '4', '5', '6', '7'].includes(k)) { eat(); setTool(tools[+k - 1][0]); return; }
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
      if (autoL) return curveDown(e);
      if (xk && e.button === 2) { drag = { mode: 'clr', changed: false }; xClear(x); return; }
      if (e.ctrlKey || e.metaKey) { drag = { mode: 'ramp', x0: x, x1: x, vy0: y, vy1: y, changed: false }; return; }
      drag = { mode: 'vel', changed: false }; velAt(x, y);
    });
    function velAt(x, y) {
      if (xk) { const v = xVal(xk, fOf(y)), hits = atX(x); if (!hits.length) return; hits.forEach(i => { notes[i] = Object.assign({}, notes[i], { p: Object.assign({}, notes[i].p, { [xk.key]: v }) }); }); drag.changed = true; draw(); say(notes[hits[0]].s, notes[hits[0]].n, xSay(xk, v)); return; }
      const v = vOf(y), hits = atX(x); if (!hits.length) return; hits.forEach(i => { notes[i] = Object.assign({}, notes[i], { v }); }); drag.changed = true; draw(); say(notes[hits[0]].s, notes[hits[0]].n, 'vel ' + Math.round(v * 127)); }
    vel.addEventListener('pointermove', (e) => {
      if (drag && drag.mode === 'curve') return curveMove(e);
      if (!drag || (drag.mode !== 'vel' && drag.mode !== 'ramp' && drag.mode !== 'clr')) return; const { x, y } = vLocal(e);
      if (drag.mode === 'clr') return xClear(x);
      if (drag.mode === 'vel') return velAt(x, y);
      drag.x1 = x; drag.vy1 = y; draw();
    });
    const velEnd = () => {
      if (drag && drag.mode === 'curve') { const d = drag; drag = null; if (d.changed && autoL) { view.emit('auto_points', { id: autoL.id, points: d.pts }); autoL = Object.assign({}, autoL, { points: d.pts }); } draw(); return; }
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
    let insts = [], edNote = null;
    const toolName = () => { const r = lane && insts.find(x => x.value === lane.target); return r ? r.label.replace(/\s*·[^·]*$/, '') : (lane ? lane.name : 'this tool'); };
    function openEditor(i) {
      const a0 = notes[i]; if (!a0) return; if (!S.has(i)) selOnly(i); draw(); editor.innerHTML = ''; edMode = 'note'; toolCtl = new Map(); toolSig = '';   // a note inside a selection keeps the selection
      let cur = Object.assign({}, a0), timer = null;
      const ed = edNote = { i, get pending() { return !!timer; } };   // 3.62: show() moves ed.i when the engine hands the notes back re-sorted
      const st = steps(), gs = grid || FREE;
      const apply = (patch) => {
        cur = Object.assign({}, cur, patch); cur.s = q(clampN(cur.s, 0, st - FREE)); cur.l = q(clampN(cur.l, FREE, st - cur.s)); cur.n = Math.round(clampN(cur.n, drums ? 0 : LO, drums ? 127 : HI)); cur.v = clampN(Math.round(cur.v * 100) / 100, 0.05, 1);
        if (cur.b && !cur.b.from && !cur.b.to && !(cur.b.osc && cur.b.osc.depth > 0)) delete cur.b;
        if (cur.p && !Object.keys(cur.p).length) delete cur.p;
        if (!cur.c || !Object.keys(cur.c).length) delete cur.c;
        notes[ed.i] = Object.assign({}, cur); draw(); say(cur.s, cur.n, lenName(cur.l) + ' · vel ' + Math.round(cur.v * 127) + (cur.b ? ' · bend ' + bendSay(cur.b) : ''));
        clearTimeout(timer); timer = setTimeout(() => { timer = null; commit(notes.slice()); }, 250);   // one commit after the knob settles
      };
      const knob = (label, o, set) => { const k = UI.Knob(Object.assign({ label, size: 44, onChange: (v) => set(v) }, o)); return k; };
      const kS = knob('Start', { min: 0, max: st - gs, value: cur.s, format: (v) => where(Math.round(v / gs) * gs) }, (v) => apply({ s: Math.round(v / gs) * gs }));
      const kL = knob('Length', { min: FREE, max: st, value: cur.l, format: (v) => lenName(Math.max(FREE, Math.round(v / gs) * gs || gs)) }, (v) => apply({ l: Math.max(gs, Math.round(v / gs) * gs) }));
      const kP = drums ? knob('Pad', { min: 0, max: rowNotes.length - 1, value: Math.max(0, rowNotes.indexOf(cur.n)), format: (v) => nameOf(rowNotes[Math.round(v)]) }, (v) => apply({ n: rowNotes[Math.round(v)] }))
        : knob('Pitch', { min: LO, max: HI, value: cur.n, format: (v) => nameOf(Math.round(lock ? pitchFor(Math.round(v)) : v)) }, (v) => { const n = lock ? pitchFor(Math.round(v)) : Math.round(v); if (n !== cur.n) audition([n]); apply({ n }); });
      const kV = knob('Velocity', { min: 1, max: 127, value: Math.round(cur.v * 127), format: (v) => String(Math.round(v)) }, (v) => apply({ v: Math.round(v) / 127 }));
      const done = h('button', { class: 'tlpr-tool', title: 'done (Esc)', text: '✓' });
      editor.append(h('div', { class: 'tlpr-eh tlpr-ihead' }, [h('b', { text: '🎹 ' + toolName(), style: { color: lane ? lane.color : '' } }), h('span', { class: 'tlpr-hint', text: ' · note ' + nameOf(cur.n) }), h('span', { class: 'wm-spacer' }), done]), h('div', { class: 'tlpr-knobs' }, [kS.el, kL.el, kP.el, kV.el]));
      // 3.56 BEND — the note's pitch curve, with knobs; you hear it as you turn them
      const noteSec = () => clampN(cur.l / 4 * 60 / ((window.Kernel && Kernel.music && Kernel.music.bpm) || 120), 0.3, 4);
      let hearT = null; const hear = (always) => { clearTimeout(hearT); hearT = setTimeout(() => { if (lane && (cur.b || cur.c || always)) view.emit('note_audition', Object.assign({ lane: lane.id, note: cur.n, duration: cur.c ? noteSec() : 0.9 }, cur.b ? { bend: cur.b } : {}, cur.c ? { curves: cur.c } : {}, cur.p ? { params: cur.p } : {})); }, 280); };
      const B = () => Object.assign({ from: 0, to: 0, shape: 'smooth', at: 0 }, cur.b || {});   // (keeps its osc)
      const setB = (patch, quiet) => { apply({ b: Object.assign(B(), patch) }); syncB(); if (!quiet) hear(); };
      const stFmt = (v) => (v > 0 ? '+' : '') + (+(+v).toFixed(1)) + ' st';
      const kTo = knob('Bend to', { min: -48, max: 48, step: 0.1, value: B().to, default: 0, format: stFmt }, (v) => setB({ to: Math.round(v * 10) / 10 }));
      const kFrom = knob('From', { min: -48, max: 48, step: 0.1, value: B().from, default: 0, format: stFmt }, (v) => setB({ from: Math.round(v * 10) / 10 }));
      const kAt = knob('Starts', { min: 0, max: 0.95, step: 0.01, value: B().at, default: 0, format: (v) => Math.round(v * 100) + ' %' }, (v) => setB({ at: Math.round(v * 100) / 100 }));
      const shSel = UI.Select({ label: 'Curve', hint: 'smooth: eases in and out · linear: straight · early: bends at once, then holds · late: holds, then dives', options: ['smooth', 'linear', 'early', 'late'].map(v => ({ value: v, label: v })), value: B().shape, onChange: (v) => setB({ shape: v }) });
      function syncB() { const b = B(); [[kTo, b.to], [kFrom, b.from], [kAt, b.at]].forEach(([k, v]) => { if (k.set) k.set(v); }); if (shSel.set) shSel.set(b.shape); }
      const prevNote = () => notes.filter((nt, j) => j !== ed.i && nt.s < cur.s - 1e-6).sort((x, y) => y.s - x.s)[0];
      const quick = [['↘ dive', 'down an octave, late — a drop', { from: 0, to: -12, shape: 'late', at: 0.2 }], ['⤓ deep drop', 'two octaves down: the floor falls out', { from: 0, to: -24, shape: 'late', at: 0.1 }],
        ['↗ rise', 'up an octave', { from: 0, to: 12, shape: 'smooth', at: 0 }], ['⤳ glide in', 'slides in from the note before it — a smooth transition', null], ['— flat', 'no bend', { from: 0, to: 0, shape: 'smooth', at: 0 }]]
        .map(([t, hint, b]) => { const btn = h('button', { class: 'tlpr-tool tlpr-ed', title: hint, text: t }); btn.addEventListener('click', (e) => { e.stopPropagation(); if (b) return setB(b);
          const pv = prevNote(); if (!pv) { readout.textContent = 'no note before this one to glide from'; return; } setB({ from: Math.max(-48, Math.min(48, pv.n + (pv.b ? pv.b.to : 0) - cur.n)), to: 0, shape: 'early', at: 0 }); }); return btn; });
      if (!drums) editor.append(h('div', { class: 'tlpr-eh' }, [h('b', { text: '〰 Bend' }), h('span', { class: 'tlpr-hint', text: ' its pitch curve' })]),
        h('div', { class: 'tlpr-knobs' }, [kFrom.el, kTo.el, kAt.el, shSel.el]), h('div', { class: 'tlpr-quick' }, quick));
      // 3.57 OSCILLATE — the note's pitch swings around its curve: vibrato, a trill, a siren, a wobble that speeds up
      const O = () => Object.assign({ rate: '1/16', depth: 0, shape: 'sine', fade: 0 }, (cur.b && cur.b.osc) || {});
      const setO = (patch, quiet) => { const o = Object.assign(O(), patch); const b = B(); if (o.depth > 0) b.osc = o; else delete b.osc; if (!b.from && !b.to && !b.osc) { apply({ b: { from: 0, to: 0 } }); } else { cur.b = b; apply({ b }); } syncO(); if (!quiet) hear(); };
      const RATES = ['1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'].map(v => ({ value: v, label: v })).concat([2, 4, 5.5, 7, 10, 14].map(v => ({ value: 'hz' + v, label: v + ' Hz' })));
      const rOf = (v) => String(v).startsWith('hz') ? +String(v).slice(2) : v, rVal = (r) => typeof r === 'number' ? 'hz' + r : r;
      const oRate = UI.Select({ label: 'Rate', options: RATES, value: rVal(O().rate), onChange: (v) => setO({ rate: rOf(v) }) });
      const oTo = UI.Select({ label: 'Speeds to', hint: 'the rate at the end of the note — a wobble that speeds up or slows down', options: [{ value: '', label: 'same' }].concat(RATES), value: O().rateTo ? rVal(O().rateTo) : '', onChange: (v) => setO({ rateTo: v ? rOf(v) : undefined }) });
      const oDepth = knob('Depth', { min: 0, max: 12, step: 0.05, value: O().depth, default: 0, format: (v) => '±' + (+(+v).toFixed(2)) + ' st' }, (v) => setO({ depth: Math.round(v * 100) / 100 }));
      const oShape = UI.Select({ label: 'Shape', options: ['sine', 'triangle', 'saw', 'square', 'random'].map(v => ({ value: v, label: v })), value: O().shape, onChange: (v) => setO({ shape: v }) });
      const oFade = knob('Fade in', { min: 0, max: 1, step: 0.01, value: O().fade, default: 0, format: (v) => Math.round(v * 100) + ' %' }, (v) => setO({ fade: Math.round(v * 100) / 100 }));
      function syncO() { const o = O(); if (oDepth.set) oDepth.set(o.depth); if (oFade.set) oFade.set(o.fade); if (oRate.set) oRate.set(rVal(o.rate)); if (oTo.set) oTo.set(o.rateTo ? rVal(o.rateTo) : ''); if (oShape.set) oShape.set(o.shape); }
      const oquick = [['vibrato', 'a singer’s vibrato that blooms', { rate: 5.5, depth: 0.35, shape: 'sine', fade: 0.4, rateTo: undefined }], ['trill', 'flicks to the note above and back', { rate: '1/32', depth: 1, shape: 'square', fade: 0, rateTo: undefined }],
        ['siren', 'a dub siren', { rate: '1/2', depth: 5, shape: 'triangle', fade: 0, rateTo: undefined }], ['speed-up', 'a wobble that speeds up into the drop', { rate: '1/8', rateTo: '1/32', depth: 2, shape: 'sine', fade: 0 }],
        ['chaos', 'random steps', { rate: '1/16', depth: 3, shape: 'random', fade: 0, rateTo: undefined }], ['off', 'no oscillation', { depth: 0 }]]
        .map(([t, hint, o]) => { const btn = h('button', { class: 'tlpr-tool tlpr-ed', title: hint, text: t }); btn.addEventListener('click', (e) => { e.stopPropagation(); setO(o); }); return btn; });
      if (!drums) editor.append(h('div', { class: 'tlpr-eh' }, [h('b', { text: '∿ Oscillate' }), h('span', { class: 'tlpr-hint', text: ' swings around it' })]),
        h('div', { class: 'tlpr-knobs' }, [oRate.el, oTo.el, oDepth.el, oShape.el, oFade.el]), h('div', { class: 'tlpr-quick' }, oquick));
      // 3.65 CURVES — knobs that move ACROSS this note: a filter that opens, drive that builds, a wobble that deepens. MONOPHONIC by
      // design: the knob is the tool's, so overlapping notes take it in turn (the later note wins) — meant for one line, a bass.
      // Click to add a point, drag it, double-click (or right-click) to remove it; a quick shape replaces the curve; you hear the note
      // with its curves as you shape them. A curve is stored over the note's length (0 … 1), so it moves, stretches and copies with it.
      const knobList = (lane && knobsAll[lane.target]) || [], nums = knobList.filter(k => k.type === 'number' || k.type === 'integer');
      if (!drums && nums.length) editor.append(curveSection());
      function curveSection() {
        const sorted = nums.slice().sort((a, b) => roleRank(a) - roleRank(b));
        let ck = (cur.c && Object.keys(cur.c).find(key => nums.some(k => k.key === key))) || sorted[0].key;
        const kOf = (key) => nums.find(k => k.key === key);
        const fy = fyK, vy = vyK;
        const ptsOf = (key) => (cur.c && cur.c[key]) ? cur.c[key].map(q => q.slice()) : null;
        const setC = (key, pts, quiet) => { const c = Object.assign({}, cur.c); if (pts && pts.length) c[key] = pts.map(q => { const o = [Math.round(clampN(q[0], 0, 1) * 10000) / 10000, q[1]]; if (q[2]) o.push(q[2].slice()); return o; }).sort((a, b) => a[0] - b[0]); else delete c[key]; apply({ c }); drawC(); syncC(); if (!quiet) hear(true); };
        // quick shapes, in the knob's own picture (on a log knob — cutoff — they are resampled, so they sound as they look)
        const SHAPES = [['↗ open', 'opens across the note', [[0, 0.08], [1, 0.92]]], ['↘ close', 'closes across the note', [[0, 0.92], [1, 0.08]]],
          ['⌐ late open', 'holds shut, then opens at the end — into the next hit', [[0, 0.08], [0.6, 0.14], [1, 0.95]]],
          ['∧ swell', 'up and back', [[0, 0.15], [0.5, 0.9], [1, 0.15]]], ['∨ dip', 'down and back', [[0, 0.85], [0.5, 0.15], [1, 0.85]]],
          ['⋀⋀ pump', 'four pumps across the note', [0, 1, 2, 3, 4, 5, 6, 7, 8].map(i => [i / 8, i % 2 ? 0.15 : 0.9])],
          // 3.67 curved shapes (Bézier handles): drag a segment's ◇ to bend it yourself
          ['◟ ease in', 'stays low, then opens fast at the end', [[0, 0.08], [1, 0.92, [0.92, 0.08]]]],
          ['◜ ease out', 'opens fast, then settles', [[0, 0.08], [1, 0.92, [0.08, 0.92]]]],
          ['⌒ arc', 'rises in an arc and falls back', [[0, 0.1], [0.5, 0.9, [0.12, 0.9]], [1, 0.1, [0.88, 0.9]]]]];
        const shapeTo = (k, name) => { const sh = SHAPES.find(x => x[0] === name || x[0].includes(name)); return sh ? toKnob(k, sh[2]) : null; };
        const sel = UI.Select({ label: 'Knob', hint: 'which of the tool’s knobs moves across this note (● = this note has a curve on it)', options: [], value: ck, onChange: (v) => { ck = v; drawC(); syncC(); } });
        function syncC() { const opts = sorted.map(k => ({ value: k.key, label: (cur.c && cur.c[k.key] ? '● ' : '') + k.label + (k.unit ? ' (' + k.unit + ')' : '') })); sel.setOptions(opts); sel.set(ck); rm.disabled = !ptsOf(ck); chips.innerHTML = ''; Object.keys(cur.c || {}).forEach(key => { const k = kOf(key); if (!k) return; const b = h('button', { class: 'tlpr-tool tlpr-ed' + (key === ck ? ' on' : ''), title: 'edit the ' + k.label + ' curve', text: k.label }); b.addEventListener('click', (e) => { e.stopPropagation(); ck = key; drawC(); syncC(); }); chips.append(b); }); }
        const rm = h('button', { class: 'tlpr-tool', title: 'remove this curve — the knob stays where the tool (or the note’s own setting) has it', text: '×' });
        rm.addEventListener('click', (e) => { e.stopPropagation(); setC(ck, null); });
        const chips = h('span', { class: 'tlpr-cchips' });
        const quick = SHAPES.map(([t, hint]) => { const b = h('button', { class: 'tlpr-tool tlpr-ed', title: hint, text: t }); b.addEventListener('click', (e) => { e.stopPropagation(); setC(ck, shapeTo(kOf(ck), t)); }); return b; });
        // the curve canvas
        const CH = 96, cc = h('canvas', { class: 'tlpr-curve', height: String(CH), 'aria-label': 'the curve of this knob across the note' });
        const box = () => { const r = cc.getBoundingClientRect(); return { r, w: cc.clientWidth || 300 }; };
        function drawC() {
          const w = cc.clientWidth || 300, dpr = Math.min(2, window.devicePixelRatio || 1); if (cc.width !== Math.round(w * dpr)) { cc.width = Math.round(w * dpr); cc.height = Math.round(CH * dpr); }
          const g = cc.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, CH);
          g.fillStyle = '#080d14'; g.fillRect(0, 0, w, CH); g.strokeStyle = '#18222f'; g.lineWidth = 1;
          for (let i = 1; i < 4; i++) { g.beginPath(); g.moveTo(Math.round(w * i / 4) + 0.5, 0); g.lineTo(Math.round(w * i / 4) + 0.5, CH); g.stroke(); }
          const k = kOf(ck), Y = (f) => 6 + (1 - f) * (CH - 12), X = (t) => 6 + t * (w - 12);
          const col = lane ? lane.color : '#ff66cc';
          // the knob where the tool has it (dashed): what the note returns to when it ends
          const base = cur.p && cur.p[ck] !== undefined ? cur.p[ck] : (k.val !== undefined ? k.val : k.def); g.setLineDash([3, 4]); g.strokeStyle = '#3d5575'; g.beginPath(); g.moveTo(0, Y(fy(k, base))); g.lineTo(w, Y(fy(k, base))); g.stroke(); g.setLineDash([]);
          // the note's other curves, faint
          Object.keys(cur.c || {}).filter(key => key !== ck && kOf(key)).forEach(key => { const k2 = kOf(key); g.strokeStyle = 'rgba(160,180,200,.35)'; plot(g, cur.c[key], k2, X, Y); });
          const pts = ptsOf(ck);
          g.fillStyle = '#5d6f82'; g.font = '10px sans-serif'; g.fillText(k.label + ' · ' + fmtV(k, vy(k, 1)), 8, 14); g.fillText(fmtV(k, vy(k, 0)), 8, CH - 6);
          if (!pts) { g.fillStyle = '#8fa1b6'; g.textAlign = 'center'; g.fillText('click to start a curve — or pick a shape', w / 2, CH / 2 + 4); g.textAlign = 'left'; return; }
          g.strokeStyle = col; g.lineWidth = 2; plot(g, pts, k, X, Y); g.lineWidth = 1;
          for (let i = 1; i < pts.length; i++) { if (pts[i][0] - pts[i - 1][0] < 0.04) continue; const hp = handlePos(pts, i), hx = X(hp[0]), hy = Y(fy(k, hp[1])), on = hotH === i, curved = !!pts[i][2];
            if (curved) { g.setLineDash([2, 3]); g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.moveTo(X(pts[i - 1][0]), Y(fy(k, pts[i - 1][1]))); g.lineTo(hx, hy); g.lineTo(X(pts[i][0]), Y(fy(k, pts[i][1]))); g.stroke(); g.setLineDash([]); }
            g.save(); g.translate(hx, hy); g.rotate(Math.PI / 4); g.fillStyle = curved ? (on ? '#fff' : col) : 'rgba(8,13,20,.9)'; g.strokeStyle = on ? '#fff' : col; g.lineWidth = 1.5; const r = on ? 4.5 : 3.5; g.fillRect(-r, -r, 2 * r, 2 * r); g.strokeRect(-r, -r, 2 * r, 2 * r); g.restore(); }
          pts.forEach((q, i) => { g.fillStyle = i === hot ? '#fff' : col; g.beginPath(); g.arc(X(q[0]), Y(fy(k, q[1])), i === hot ? 5 : 4, 0, Math.PI * 2); g.fill(); g.strokeStyle = '#000'; g.stroke(); });
        }
        // drawn as the tool plays it: straight between points, or along a segment's Bézier; on a log knob as it sounds (a straight line curves)
        function plot(g, pts, k, X, Y) { g.beginPath(); const N = 160; for (let j = 0; j <= N; j++) { const t = j / N; if (j) g.lineTo(X(t), Y(fy(k, valAt(pts, t, k)))); else g.moveTo(X(t), Y(fy(k, valAt(pts, t, k)))); } g.stroke(); }
        // a segment's handle: where it is drawn (its own control point, or the middle of a straight segment, ready to pull)
        const handlePos = (pts, i) => { const a = pts[i - 1], b = pts[i], k = kOf(ck); if (b[2]) return [a[0] + b[2][0] * (b[0] - a[0]), b[2][1]]; const mx = (a[0] + b[0]) / 2; return [mx, valAt([a, b], mx, k)]; };   // on the line itself
        const fmtV = (k, v) => (Math.abs(v) >= 100 ? Math.round(v) : +(+v).toFixed(2)) + (k.unit ? ' ' + k.unit : '');
        let hot = -1, hotH = -1, dragC = null;
        const at = (e) => { const { r, w } = box(), x = (e.clientX - r.left) * (w / r.width), y = (e.clientY - r.top) * (CH / r.height); return { t: clampN((x - 6) / (w - 12), 0, 1), f: clampN(1 - (y - 6) / (CH - 12), 0, 1), x, y }; };
        const near = (p) => { const pts = ptsOf(ck) || [], k = kOf(ck), w = box().w; return pts.findIndex(q => Math.hypot(6 + q[0] * (w - 12) - p.x, 6 + (1 - fy(k, q[1])) * (CH - 12) - p.y) < 8); };
        const nearH = (p) => { const pts = ptsOf(ck) || [], k = kOf(ck), w = box().w; for (let i = 1; i < pts.length; i++) { if (pts[i][0] - pts[i - 1][0] < 0.04) continue; const hp = handlePos(pts, i); if (Math.hypot(6 + hp[0] * (w - 12) - p.x, 6 + (1 - fy(k, hp[1])) * (CH - 12) - p.y) < 7) return i; } return -1; };
        cc.addEventListener('contextmenu', (e) => e.preventDefault());
        cc.addEventListener('pointerdown', (e) => {
          e.stopPropagation(); const p = at(e), k = kOf(ck); let pts = ptsOf(ck) || []; let i = near(p);
          const hi0 = i < 0 ? nearH(p) : -1;   // 3.67 a segment's ◇: drag it to bend the segment (right-click or double-click straightens it)
          if (hi0 > 0) { if (e.button === 2) { delete pts[hi0][2]; pts[hi0] = pts[hi0].slice(0, 2); setC(ck, pts); return; } dragC = { h: hi0, pts }; hotH = hi0; try { cc.setPointerCapture(e.pointerId); } catch (x) {} drawC(); return; }
          if (e.button === 2) { if (i >= 0) { pts.splice(i, 1); setC(ck, pts); } return; }
          if (i < 0) { pts.push([p.t, vy(k, p.f)]); pts.sort((a, b) => a[0] - b[0]); i = pts.findIndex(q => q[0] === p.t); cur.c = Object.assign({}, cur.c, { [ck]: pts }); }
          dragC = { i, pts }; hot = i; try { cc.setPointerCapture(e.pointerId); } catch (x) {} drawC(); syncC();
        });
        cc.addEventListener('pointermove', (e) => {
          const p = at(e);
          if (!dragC) { const i = near(p), j = i < 0 ? nearH(p) : -1; if (i !== hot || j !== hotH) { hot = i; hotH = j; drawC(); } cc.style.cursor = i >= 0 || j > 0 ? 'grab' : 'crosshair'; return; }
          const k = kOf(ck), pts = dragC.pts;
          if (dragC.h) { const j = dragC.h, a = pts[j - 1], b = pts[j]; pts[j] = [b[0], b[1], [Math.round(clampN((p.t - a[0]) / ((b[0] - a[0]) || 1), 0.02, 0.98) * 1000) / 1000, vy(k, p.f)]]; cur.c = Object.assign({}, cur.c, { [ck]: pts }); drawC();
            readout.textContent = k.label + ' · this segment bends toward ' + fmtV(k, pts[j][2][1]);
            if (!dragC.heard || performance.now() - dragC.heard > 350) { dragC.heard = performance.now(); apply({ c: cur.c }); hear(true); } return; }
          const i = dragC.i, lo = i > 0 ? pts[i - 1][0] + 0.002 : 0, hi = i < pts.length - 1 ? pts[i + 1][0] - 0.002 : 1;
          pts[i] = [clampN(p.t, lo, hi), vy(k, p.f)].concat(pts[i][2] ? [pts[i][2]] : []); cur.c = Object.assign({}, cur.c, { [ck]: pts }); drawC();
          readout.textContent = k.label + ' ' + fmtV(k, pts[i][1]) + ' at ' + Math.round(pts[i][0] * 100) + ' % of the note';
          if (!dragC.heard || performance.now() - dragC.heard > 350) { dragC.heard = performance.now(); apply({ c: cur.c }); hear(true); }
        });
        const endC = () => { if (!dragC) return; const pts = dragC.pts; dragC = null; setC(ck, pts); };
        cc.addEventListener('pointerup', endC); cc.addEventListener('pointercancel', endC); cc.addEventListener('lostpointercapture', endC);
        cc.addEventListener('dblclick', (e) => { e.stopPropagation(); const p = at(e), i = near(p), pts = ptsOf(ck); if (!pts) return; if (i >= 0) { pts.splice(i, 1); setC(ck, pts); return; } const j = nearH(p); if (j > 0 && pts[j][2]) { pts[j] = pts[j].slice(0, 2); setC(ck, pts); } });
        if (window.ResizeObserver) new ResizeObserver(() => drawC()).observe(cc);
        // ◈ BEHAVIOURS — a note's curves and bend, saved to use again: apply one to this note (or every selected note), stretched to
        // each note, reversed, or scaled (intensity 0 = the knob held where it is · 1 = as saved · 2 = twice as far)
        let inten = 1, rev = false, bsel = '';
        const bList = () => behavioursAll || [];
        const bSelect = UI.Select({ label: 'Behaviour', hint: 'a saved set of curves (and a bend) — fits any tool: filter, drive and wobble find this tool’s own knobs', options: [], value: '', onChange: (v) => { bsel = v; syncB2(); } });
        const bApply = h('button', { class: 'tlpr-tool tlpr-ed', title: 'put it on this note — and on every selected note', text: 'Apply' });
        const bKnob = knob('Intensity', { min: 0, max: 2, step: 0.01, value: 1, default: 1, size: 36, format: (v) => Math.round(v * 100) + ' %' }, (v) => { inten = v; });
        const bRev = UI.Toggle({ label: '⇆ Reverse', hint: 'play it backwards across the note', value: false, onChange: (v) => { rev = !!v; } });
        const bSave = h('button', { class: 'tlpr-tool tlpr-ed', title: 'save this note’s curves and bend as a behaviour', text: '＋ Save' });
        const bDel = h('button', { class: 'tlpr-tool', title: 'remove this behaviour (yours only)', text: '×' });
        function syncB2() { const L = bList(); bSelect.setOptions([{ value: '', label: '— behaviour —' }].concat(L.map(b => ({ value: b.id, label: (b.factory ? '' : '★ ') + b.name })))); bSelect.set(bsel); const b = L.find(x => x.id === bsel); bApply.disabled = !b; bDel.disabled = !b || !!b.factory; bSave.disabled = !cur.c && !cur.b; }
        function behave(b, o) {
          o = o || {}; const I = o.intensity !== undefined ? o.intensity : inten, RV = o.reverse !== undefined ? o.reverse : rev, used = [], skipped = [];
          const onNote = (nt) => { const out = Object.assign({}, nt), c = Object.assign({}, nt.c);
            Object.keys(b.curves || {}).forEach(role => { const k = knobForRole(role); if (!k) { if (!skipped.includes(role)) skipped.push(role); return; } if (!used.includes(k.label)) used.push(k.label);
              const base = fyK(k, nt.p && nt.p[k.key] !== undefined ? nt.p[k.key] : (k.val !== undefined ? k.val : k.def));
              const sc = (f) => clampN(base + (f - base) * I, 0, 1), src = b.curves[role], n = src.length;
              let pts = src.map(q => q[2] ? [q[0], sc(q[1]), [q[2][0], sc(q[2][1])]] : [q[0], sc(q[1])]);
              // reversed: time runs back; a segment's handle moves to its new end point and mirrors across the segment
              if (RV) pts = pts.slice().reverse().map((q, j) => { const r4 = (v) => Math.round(v * 10000) / 10000, o = [r4(1 - q[0]), q[1]], from = pts[n - j]; if (j && from && from[2]) o.push([r4(1 - from[2][0]), from[2][1]]); return o; });
              c[k.key] = toKnob(k, pts); });
            if (Object.keys(c).length) out.c = c;
            if (b.bend) { const bb = Object.assign({}, b.bend), r1 = (v) => Math.round(v * I * 10) / 10; bb.from = r1(b.bend.from || 0); bb.to = r1(b.bend.to || 0); if (bb.osc) bb.osc = Object.assign({}, bb.osc, { depth: Math.round(bb.osc.depth * I * 100) / 100 });
              if (RV) { const f = bb.from; bb.from = bb.to; bb.to = f; bb.shape = bb.shape === 'early' ? 'late' : bb.shape === 'late' ? 'early' : bb.shape; }
              if (bb.from || bb.to || (bb.osc && bb.osc.depth > 0)) out.b = bb; else delete out.b; }
            return out; };
          Array.from(S).filter(j => j !== ed.i && notes[j]).forEach(j => { notes[j] = onNote(notes[j]); });
          const mine = onNote(cur); apply({ c: mine.c, b: mine.b }); if (!mine.b) { delete cur.b; notes[ed.i] = Object.assign({}, cur); }
          if (cur.c && !cur.c[ck]) ck = Object.keys(cur.c)[0] || ck; drawC(); syncC(); if (typeof syncB === 'function') syncB(); syncB2();
          readout.textContent = b.name + (used.length ? ' → ' + used.join(', ') : '') + (b.bend ? (used.length ? ' + ' : ' → ') + 'bend' : '') + (skipped.length ? ' · skipped (no such knob here): ' + skipped.join(', ') : '') + (S.size > 1 ? ' · on ' + S.size + ' notes' : '');
          if (!o.quiet) hear(true); return { used, skipped };
        }
        function saveAs(name) {
          const curves = {}; Object.keys(cur.c || {}).forEach(key => { const k = kOf(key); if (!k) return; let role = roleOf(k); if (knobForRole(role) !== k) role = 'knob:' + k.key; curves[role] = cur.c[key].map(q => q[2] ? [q[0], +fyK(k, q[1]).toFixed(4), [q[2][0], +fyK(k, q[2][1]).toFixed(4)]] : [q[0], +fyK(k, q[1]).toFixed(4)]); });
          view.emit('behaviour_save', Object.assign({ name }, cur.b ? { bend: cur.b } : {}, { curves }));
        }
        bApply.addEventListener('click', (e) => { e.stopPropagation(); const b = bList().find(x => x.id === bsel); if (b) behave(b); });
        bSave.addEventListener('click', (e) => { e.stopPropagation(); UI.ask('Name this behaviour').then((n) => { if (n && String(n).trim()) saveAs(String(n).trim()); }); });
        bDel.addEventListener('click', (e) => { e.stopPropagation(); const b = bList().find(x => x.id === bsel); if (b && !b.factory) { view.emit('behaviour_remove', { id: b.id }); bsel = ''; } });
        ed.behave = (name, o) => { const b = bList().find(x => x.name === name || x.id === name); return b ? behave(b, Object.assign({ quiet: true }, o)) : null; };
        ed.saveBehaviour = saveAs; ed.syncBehaviours = syncB2;
        syncB2();
        const sec = h('div', { class: 'tlpr-csec' }, [
          h('div', { class: 'tlpr-eh' }, [h('b', { text: '〽 Curves' }), h('span', { class: 'tlpr-hint', text: ' knobs that move across it', title: 'one line at a time: the knob is the tool’s, so overlapping notes take turns (the later note wins)' })]),
          h('div', { class: 'tlpr-knobs tlpr-crow tlpr-brow' }, [h('span', { class: 'tlpr-blabel', text: '◈' }), bSelect.el, bApply, bKnob.el, bRev.el, bSave, bDel]),
          h('div', { class: 'tlpr-knobs tlpr-crow' }, [sel.el, rm, chips]), h('div', { class: 'tlpr-quick' }, quick), cc]);
        ed.curve = (key, pts) => { if (key) ck = key; setC(ck, pts, true); }; ed.curveShape = (key, name) => { ck = key; setC(ck, shapeTo(kOf(key), name), true); };
        sel.el.classList.add('tlpr-cknob'); syncC(); requestAnimationFrame(drawC);
        return sec;
      }
      // SOUND — EVERY knob of this track's tool, grouped the way the tool groups them (3.58: "click a note and edit it completely").
      // A faded knob = this note uses the tool's own setting (shown where the tool has it now); turn it and the note has its own
      // value (gold); × hands it back to the tool.
      const list = (lane && knobsAll[lane.target]) || [], soundBox = h('div', { class: 'tlpr-sound' });
      const groupsOf = () => { const m = new Map(); list.forEach(k => { const g = k.group || 'SOUND'; if (!m.has(g)) m.set(g, []); m.get(g).push(k); }); return m; };
      const openG = new Set(); Object.keys(cur.p || {}).forEach(key => { const k = list.find(x => x.key === key); if (k) openG.add(k.group || 'SOUND'); });
      function drawSound() {
        soundBox.innerHTML = '';
        groupsOf().forEach((ks, gname) => {
          const own = ks.filter(k => cur.p && cur.p[k.key] !== undefined).length, row = h('div', { class: 'tlpr-knobs' });
          ks.forEach(k => {
            const has = !!(cur.p && cur.p[k.key] !== undefined), v = has ? cur.p[k.key] : (k.val !== undefined ? k.val : k.def);
            const set = (nv) => { apply({ p: Object.assign({}, cur.p, { [k.key]: nv }) }); if (!has) drawSound(); };
            const ctl = k.type === 'enum' ? UI.Select({ label: k.label, options: k.options.map(o => ({ value: o, label: String(o) })), value: v, onChange: (nv) => set(k.options.find(o => String(o) === String(nv))) })
              : k.type === 'boolean' ? UI.Toggle({ label: k.label, value: !!v, onChange: (nv) => set(!!nv) })
              : knob(k.label, { min: k.min, max: k.max, step: k.step || (k.type === 'integer' ? 1 : (k.max - k.min) / 200), value: +v, default: k.def, unit: k.unit, size: 36 }, (nv) => set(xVal(k, xFrac(k, nv))));
            const cell = h('span', { class: 'tlpr-pk' + (has ? ' own' : ''), title: has ? 'this note’s own ' + k.label : k.label + ': the tool’s setting — turn it to give this note its own' }, [ctl.el]);
            if (has) { const x = h('button', { class: 'tlpr-tool', title: 'back to the tool’s own knob for this note', text: '×' }); x.addEventListener('click', (e) => { e.stopPropagation(); const p2 = Object.assign({}, cur.p); delete p2[k.key]; apply({ p: p2 }); drawSound(); }); cell.append(x); }
            row.append(cell);
          });
          const det = h('details', { class: 'tlpr-group' }, [h('summary', { text: gname.toLowerCase() + (own ? '  · ' + own + ' set on this note' : '') }), row]);
          if (openG.has(gname)) det.open = true; det.addEventListener('toggle', () => { if (det.open) openG.add(gname); else openG.delete(gname); });
          soundBox.append(det);
        });
      }
      if (list.length) { editor.append(h('div', { class: 'tlpr-eh' }, [h('b', { text: '🎛 Sound' }), h('span', { class: 'tlpr-hint', text: ' every knob of ' + toolName() + ' — for this note only' })]), soundBox); drawSound(); }
      const finish = () => { if (timer) { clearTimeout(timer); timer = null; commit(notes.slice()); } closeEditor(); cv.focus({ preventScroll: true }); };
      done.addEventListener('click', (e) => { e.stopPropagation(); finish(); });
      editor.onkeydown = (e) => { e.stopPropagation(); if (e.key === 'Escape' || e.key === 'Enter') finish(); };
      editor.onpointerdown = (e) => e.stopPropagation();
      editor.classList.add('open');
      // for tests and scripts: the same path a knob takes
      return { start: (v) => apply({ s: Math.round(v / gs) * gs }), length: (v) => apply({ l: Math.max(gs, Math.round(v / gs) * gs) }), pitch: (n) => apply({ n }), velocity: (v) => apply({ v: v / 127 }), finish,
        bend: (b) => setB(b, true), osc: (o) => setO(o, true), quick: (label) => { const q2 = quick.concat(oquick).find(x => x.textContent.includes(label)); if (q2) q2.click(); }, knob: (key, v) => apply({ p: Object.assign({}, cur.p, { [key]: v }) }), curve: (key, pts) => ed.curve && ed.curve(key, pts), behave: (name, o) => ed.behave && ed.behave(name, o), saveBehaviour: (name) => ed.saveBehaviour && ed.saveBehaviour(name), curveShape: (key, name) => ed.curveShape && ed.curveShape(key, name), get note() { return Object.assign({}, cur); } };
    }
    function closeEditor() { edNote = null; edMode = null; editor.classList.remove('open'); editor.innerHTML = ''; toolCtl = new Map(); toolSig = ''; if (toolOn && clip && lane && lane.target && toolsAll[lane.target]) openTool(); }
    // ---- the tool panel
    function openTool() {
      const t = toolsAll[lane.target], list = (knobsAll[lane.target] || []), sig = lane.target + '|' + list.map(k => k.key).join() + '|' + (t.presets || []).length;
      if (edMode === 'tool' && toolSig === sig) { list.forEach(k => { const c = toolCtl.get(k.key); if (c && c.set && !c.el.contains(document.activeElement) && !c.el.matches(':active')) c.set(k.type === 'number' || k.type === 'integer' ? +k.val : k.val); }); return; }
      edMode = 'tool'; toolSig = sig; toolCtl = new Map(); editor.innerHTML = '';
      const send = (key, v) => view.emit('tool_set', { target: lane.target, key, value: v });
      const goto = h('button', { class: 'tlpr-tool', title: 'show its own window', text: '↗' }); goto.addEventListener('click', (e) => { e.stopPropagation(); if (window.Kernel) Kernel.bus.publish('canvas:focus-request', { instanceId: lane.target }); });
      const pre = UI.Select({ label: 'Preset', hint: 'load one of its presets', options: [{ value: '', label: '— preset —' }].concat((t.presets || []).map(n => ({ value: n, label: n }))), value: '', onChange: (v) => { if (v) { view.emit('tool_preset', { target: lane.target, name: v }); readout.textContent = (t.label || 'tool') + ': ' + v; } } });
      editor.append(h('div', { class: 'tlpr-eh tlpr-ihead' }, [h('b', { text: (t.icon ? t.icon + ' ' : '') + t.label }), h('span', { class: 'tlpr-hint', text: ' · the whole track · click a note to give it its own' }), h('span', { class: 'wm-spacer' }), goto]), pre.el);
      const groups = new Map(); list.forEach(k => { const g = k.group || 'SOUND'; if (!groups.has(g)) groups.set(g, []); groups.get(g).push(k); });
      let first = true;
      groups.forEach((ks, gname) => {
        const row = h('div', { class: 'tlpr-knobs' });
        ks.forEach(k => {
          const v = k.val !== undefined ? k.val : k.def;
          const c = k.type === 'enum' ? UI.Select({ label: k.label, options: k.options.map(o => ({ value: o, label: String(o) })), value: v, onChange: (nv) => send(k.key, k.options.find(o => String(o) === String(nv))) })
            : k.type === 'boolean' ? UI.Toggle({ label: k.label, value: !!v, onChange: (nv) => send(k.key, !!nv) })
            : UI.Knob({ label: k.label, min: k.min, max: k.max, step: k.step || (k.type === 'integer' ? 1 : (k.max - k.min) / 200), value: +v, default: k.def, unit: k.unit, size: 36, onChange: (nv) => send(k.key, k.type === 'integer' ? Math.round(nv) : nv) });
          toolCtl.set(k.key, c); row.append(h('span', { class: 'tlpr-pk own' }, [c.el]));
        });
        const det = h('details', { class: 'tlpr-group' }, [h('summary', { text: gname.toLowerCase() }), row]); if (first) det.open = true; first = false; editor.append(det);
      });
      editor.classList.add('open');
    }
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

    // 3.62 ("the adjustment doesn't work"): the engine hands a clip's notes back SORTED (start, then pitch). The selection and the
    // open note's knobs hold positions in this array, so they are carried over by the note itself, not its old index — else a
    // knob turned after a Start/Pitch change wrote over the neighbour the note had just passed.
    const nKey = (n) => n.s + '|' + n.n + '|' + n.l;
    function adopt(next) {
      if (next.length && notes.length && (S.size || edNote)) {
        const used = new Set(), find = (old) => { if (!old) return -1; const k = nKey(old); const j = next.findIndex((m, x) => !used.has(x) && nKey(m) === k); if (j >= 0) used.add(j); return j; };
        const e = edNote ? find(notes[edNote.i]) : -1, s2 = new Set(); S.forEach(i => { const j = i === (edNote && edNote.i) ? e : find(notes[i]); if (j >= 0) s2.add(j); }); S = s2;
        if (edNote) { if (e >= 0) edNote.i = e; else { notes = next; closeEditor(); return next; } }
      }
      return next;
    }
    function setOptions(sel2, list) { if (sel2.setOptions && list && list.length) sel2.setOptions(list); }
    function show(c, ln, A) {
      const first = openedId !== c.id;
      clip = c; lane = ln; openedId = c.id; if (A && A.key) key = A.key; if (A && A.instruments) insts = A.instruments;
      el.style.setProperty('--tool-acc', ln && ln.color ? ln.color : '#ffd24a');   // the roll wears its track's colour
      const pads = ln && ln.target && A && A.drumNames ? A.drumNames[ln.target] : null;
      if (first || !!pads !== !!drums || (pads && drums && pads.map(p => p.name).join() !== drums.map(p => p.name).join())) setMode(pads);
      if (first) { S.clear(); closeEditor(); }
      if (!drag && !(edNote && edNote.pending)) notes = adopt((c.notes || []).map(n => Object.assign({}, n)));
      // (the track-wide Pitch lane is not a per-note knob)
      if (A && Array.isArray(A.behaviours)) { const sig = JSON.stringify(A.behaviours.map(b => b.id + b.name)); if (sig !== (behavioursAll._sig || '')) { behavioursAll = A.behaviours.slice(); behavioursAll._sig = sig; if (edNote && edNote.syncBehaviours) edNote.syncBehaviours(); } }   // 3.65
      if (A && A.knobs) { knobsAll = {}; Object.keys(A.knobs).forEach(t => { knobsAll[t] = A.knobs[t].filter(k => !k.lane); }); const list = (ln && knobsAll[ln.target]) || []; const ks = list.map(k => k.key).join();
        knobsRaw = A.knobs; lanesAll = (A.lanes || []).filter(l => l.kind === 'auto' && ln && l.target === ln.target);
        if (pendingCurve) { const nl = lanesAll.find(l => l.key === pendingCurve); if (nl) { pendingCurve = null; requestAnimationFrame(() => setLane('curve:' + nl.id)); } }
        if (autoL) autoL = lanesAll.find(l => l.id === autoL.id) || null;
        const curveOpts = lanesAll.map(l => ({ value: 'curve:' + l.id, label: '〰 curve · ' + l.name })).concat(lanesAll.some(l => l.key === '@pitch') || !ln ? [] : [{ value: 'newpitch', label: '〰 new Pitch curve' }]), ks2 = ks + '|' + curveOpts.map(o => o.value + o.label).join();
        if (laneSel._ks !== ks2) { laneSel._ks = ks2; laneSel.setOptions([{ value: '', label: 'velocity' }].concat(curveOpts, list.map(k => ({ value: k.key, label: (k.group ? k.group.toLowerCase() + ' · ' : '') + k.label })))); }
        if (xk && !list.some(k => k.key === xk.key)) setLane(''); else if (xk) xk = list.find(k => k.key === xk.key);
        if (autoL && laneSel.select.value !== 'curve:' + autoL.id) laneSel.set('curve:' + autoL.id); if (!autoL && String(laneSel.select.value).startsWith('curve:')) setLane(''); }
      if (A) { if (A.progressions && progs !== A.progressions) { progs = A.progressions; setOptions(progSel, progs); } if (A.fillStyles && styles !== A.fillStyles) { styles = A.fillStyles; setOptions(styleSel, styles); } }
      title.textContent = (ln ? ln.name : '') + ' · ' + (c.name || 'clip'); title.style.color = ln ? ln.color : '';
      if (A && A.tools) toolsAll = A.tools;
      if (A && A.instruments) { const opts = [{ value: '', label: '— tool —' }].concat(A.instruments.map(o => ({ value: o.value, label: o.label }))), sg = opts.map(o => o.value + o.label).join(); if (toolSel._sg !== sg) { toolSel._sg = sg; toolSel.setOptions(opts); } }
      if (toolSel.select.value !== ((ln && ln.target) || '')) toolSel.set((ln && ln.target) || '');
      toolBtn.classList.toggle('on', toolOn);
      if (edMode !== 'note') { if (toolOn && ln && ln.target && toolsAll[ln.target]) openTool(); else if (edMode === 'tool') closeEditor(); }
      if (bars.set) bars.set(c.bars);
      el.classList.add('open'); drawKeys(); draw();
      // 3.59: an empty bass track opens down where basses live
      if (first) requestAnimationFrame(() => { if (drums) { scroll.scrollTop = 0; scroll.scrollLeft = 0; return; } const ps = notes.map(n => n.n); const tl0 = ln && toolsAll[ln.target], low = tl0 && /bass|sub|wub|reese|808/i.test(tl0.id + ' ' + tl0.label + ' ' + tl0.category); const mid = ps.length ? ps.reduce((a, b) => a + b, 0) / ps.length : (low ? 36 : 60) + key.root; scroll.scrollTop = Math.max(0, yOf(Math.round(mid)) - scroll.clientHeight / 2); scroll.scrollLeft = 0; });
    }
    function hide() { setFull(false); clip = null; openedId = null; closeEditor(); setStep(false); el.classList.remove('open'); }
    function playhead(barPos) { if (!clip) return; const p = barPos === null ? null : (barPos - clip.startBar) * 16; if (p !== playStep) { playStep = p; draw(); } }
    setMode(null); setTool('draw');
    return { el, show, hide, playhead, setFull, get full() { return !!full; }, get open() { return !!clip; }, get clipId() { return clip && clip.id; }, get drums() { return drums; },
      // for tests and the timeline's own keys: the grid/tool/zoom the roll is in, and what it holds
      get state() { return { tool, grid, len, lastLen, pps, row: ROW, step: stepOn, cursor, notes: notes.map(n => Object.assign({}, n)) }; }, setTool, zoomTo, setRow,
      setGrid: (v) => { gridSel.set(v); grid = GRIDS.find(g => g[0] === String(v))[2]; draw(); }, canvas: cv, ruler, vel, openEditor, setLane, sketch: (pts, as, replace) => sketchToNotes({ pts, replace }, as), get lane() { return xk ? xk.key : ''; }, setStep, get selected() { return Array.from(S).sort((a, b) => a - b); } };
  }
  global.EravosTimelinePianoRoll = { create, mapPoint, toContent, GRIDS };
})(window);
