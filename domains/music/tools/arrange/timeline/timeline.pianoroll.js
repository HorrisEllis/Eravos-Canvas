/* eravos.timeline — piano roll (P9 · G-02) + DRUM LANES (P11 gate D). Own UI area (own file + timeline.pianoroll.css).
 * When the track plays a drum tool (anything that announces its pads on pad:bank-change), the rows are that tool's pads
 * by name — kick, snare, hat … — not piano keys; no scale lock, clicks add hits, up/down moves a hit to another pad.
 * Edits a note clip; every change goes out through the timeline's ui_hooks (clip_edit, clip_fill, note_audition).
 * Notes: {s: step16 from clip start, l: steps, n: midi, v: 0..1}. Scale rows shaded from the song key. */
(function (global) {
  'use strict';
  const PROW = 11, DROW = 20, KEYW = 46, DKEYW = 96, LO = 24, HI = 107; // C1 … B7 (piano) · pads (drums)
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const BLACK = new Set([1, 3, 6, 8, 10]);
  const mod = (a, n) => ((a % n) + n) % n;
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
    let grid = 1, len = 4, stamp = 'note', lock = true, pps = 14, progs = [], styles = [];
    // row model: piano = every note HI…LO; drums = the target's pads (top = pad 1)
    let drums = null, ROW = PROW, rowNotes = [], KW = KEYW;
    const PIANO_ROWS = []; for (let n = HI; n >= LO; n--) PIANO_ROWS.push(n);
    function setMode(pads) {
      drums = pads && pads.length ? pads : null; ROW = drums ? DROW : PROW; KW = drums ? DKEYW : KEYW;
      rowNotes = drums ? drums.map(p => p.note) : PIANO_ROWS;
      el.classList.toggle('drums', !!drums);
      [stampSel, lockT, progSel, styleSel, voiceSel, fillBtn].forEach(c => { c.el.style.display = drums ? 'none' : ''; });
      if (drums && len === 4) { len = 1; lenSel.set('1'); }
    }
    // ---- toolbar
    const title = h('span', { class: 'tlpr-title', text: '' });
    const bars = UI.NumberDrag({ label: 'bars', min: 1, max: 128, step: 1, value: 4, suffix: ' bars', onChange: (v) => clip && view.emit('clip_edit', { id: clip.id, patch: { bars: v } }) });
    const gridSel = UI.Select({ label: 'Grid', options: [{ value: '1', label: '1/16' }, { value: '2', label: '1/8' }, { value: '4', label: '1/4' }], value: '1', onChange: (v) => { grid = +v; } });
    const lenSel = UI.Select({ label: 'Length', options: [{ value: '1', label: '1/16' }, { value: '2', label: '1/8' }, { value: '4', label: '1/4' }, { value: '8', label: '1/2' }, { value: '16', label: '1 bar' }], value: '4', onChange: (v) => { len = +v; } });
    const stampSel = UI.Select({ label: 'Click adds', options: [{ value: 'note', label: 'note' }, { value: 'triad', label: 'triad' }, { value: 'seventh', label: '7th chord' }, { value: 'add9', label: 'add9 chord' }, { value: 'sus2', label: 'sus2 chord' }, { value: 'power', label: 'power' }], value: 'note', onChange: (v) => { stamp = v; } });
    const lockT = UI.Toggle({ label: 'Scale lock', value: true, onChange: (v) => { lock = v; } });
    const zoomSel = UI.Select({ label: 'Zoom', options: [{ value: '8', label: 'S' }, { value: '14', label: 'M' }, { value: '22', label: 'L' }], value: '14', onChange: (v) => { pps = +v; draw(); } });
    const progSel = UI.Select({ label: 'Fill', options: [{ value: 'anthem', label: 'Anthem 1–6–3–7' }], value: 'anthem', onChange: () => {} });
    const styleSel = UI.Select({ options: [{ value: 'future', label: 'Future-bass chops' }], value: 'future', onChange: () => {} });
    const voiceSel = UI.Select({ options: ['add9', 'seventh', 'triad', 'sus2', 'power', 'single'].map(v => ({ value: v, label: v === 'seventh' ? '7th' : v === 'single' ? 'root only (synth plays chord)' : v })), value: 'add9', onChange: () => {} });
    const fillBtn = UI.Button({ label: '✦ Fill', hint: 'replace this clip with a chord progression in the song key', onClick: () => { if (clip && (!notes.length || confirm('Replace the notes in this clip?'))) view.emit('clip_fill', { id: clip.id, progression: progSel.get(), style: styleSel.get(), voicing: voiceSel.get() }); } });
    const clearBtn = UI.Button({ label: 'Clear', kind: 'danger', onClick: () => { if (clip && notes.length && confirm('Delete every note in this clip?')) commit([]); } });
    const closeBtn = UI.Button({ label: '×', hint: 'close piano roll', onClick: () => { hide(); if (opts && opts.onClose) opts.onClose(); } });
    const bar = h('div', { class: 'tlpr-bar' }, [title, bars.el, h('span', { class: 'tlpr-sep' }), gridSel.el, lenSel.el, stampSel.el, lockT.el, zoomSel.el, h('span', { class: 'tlpr-sep' }), progSel.el, styleSel.el, voiceSel.el, fillBtn.el, clearBtn.el, closeBtn.el]);
    const keys = document.createElement('canvas'); keys.className = 'tlpr-keys';
    const cv = document.createElement('canvas'); cv.className = 'tlpr-grid'; cv.tabIndex = 0; cv.setAttribute('role', 'application'); cv.setAttribute('aria-label', 'Note grid — click to add, drag to move, arrow keys move the selected note, Delete removes it');
    const scroll = h('div', { class: 'tlpr-scroll' }, [keys, cv]);
    const el = h('div', { class: 'tlpr' }, [bar, scroll]);

    const Hh = () => rowNotes.length * ROW;
    const yOf = (n) => { const i = rowNotes.indexOf(n); return (i < 0 ? (drums ? rowNotes.length : HI - n) : i) * ROW; };
    const nOf = (y) => rowNotes[Math.max(0, Math.min(rowNotes.length - 1, Math.floor(y / ROW)))];
    const inScale = (n) => drums ? true : MT.inScale(n, key.root, key.scale);
    function size(c, W) { const H = Hh(), dpr = Math.min(2, devicePixelRatio || 1); if (c.width !== Math.round(W * dpr) || c.height !== Math.round(H * dpr)) { c.width = W * dpr; c.height = H * dpr; c.style.width = W + 'px'; c.style.height = H + 'px'; } const g = c.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); return g; }
    function drawKeys() {
      const g = size(keys, KW);
      if (drums) { // pad names, in the pad's own colour
        drums.forEach((p, i) => { const y = i * ROW; g.fillStyle = i % 2 ? '#111821' : '#141c27'; g.fillRect(0, y, KW, ROW - 1); g.fillStyle = p.color || '#00ff88'; g.fillRect(0, y, 4, ROW - 1); g.fillStyle = '#d7e0ea'; g.font = '11px sans-serif'; g.fillText(String(p.name || 'pad').slice(0, 12), 8, y + ROW - 6); g.fillStyle = '#5d6b7a'; g.font = '9px monospace'; g.fillText(String(i + 1), KW - 16, y + ROW - 6); });
        return;
      }
      for (let n = LO; n <= HI; n++) {
        const y = yOf(n), pc = mod(n, 12), blk = BLACK.has(pc);
        g.fillStyle = mod(n - key.root, 12) === 0 ? (lane ? lane.color : '#00d4ff') : blk ? '#10161e' : '#d7e0ea';
        if (!inScale(n) && !blk) g.fillStyle = '#6d7680';
        g.fillRect(0, y, KEYW, ROW - 1);
        if (pc === 0 || mod(n - key.root, 12) === 0) { g.fillStyle = blk ? '#aaa' : '#111'; g.font = '9px monospace'; g.fillText(NAMES[pc] + (Math.floor(n / 12) - 1), 3, y + ROW - 2); }
      }
    }
    function draw() {
      if (!clip) return;
      const steps = clip.bars * 16, W = Math.max(200, steps * pps), H = Hh();
      const g = size(cv, W);
      if (drums) rowNotes.forEach((n, i) => { g.fillStyle = i % 2 ? '#0e141c' : '#111822'; g.fillRect(0, i * ROW, W, ROW); g.fillStyle = '#0a0f15'; g.fillRect(0, i * ROW + ROW - 1, W, 1); });
      else for (let n = LO; n <= HI; n++) {
        const y = yOf(n), pc = mod(n, 12);
        g.fillStyle = mod(n - key.root, 12) === 0 ? '#16243a' : inScale(n) ? (BLACK.has(pc) ? '#101822' : '#131d29') : '#0a0e14';
        g.fillRect(0, y, W, ROW); g.fillStyle = pc === 0 ? '#2d3f57' : '#0f1620'; g.fillRect(0, y + ROW - 1, W, 1);
      }
      for (let s = 0; s <= steps; s++) { g.fillStyle = s % 16 === 0 ? '#3d5575' : s % 4 === 0 ? '#1f2d40' : '#141d29'; if (pps >= 10 || s % 4 === 0) g.fillRect(s * pps, 0, 1, H); }
      const col = lane ? lane.color : '#ff66cc';
      notes.forEach((nt, i) => {
        if (drums && rowNotes.indexOf(nt.n) < 0) return; // a note no pad answers to: kept in the clip, not drawn as a hit
        const x = nt.s * pps, y = yOf(nt.n), w = Math.max(3, nt.l * pps - 1);
        const c2 = drums ? ((drums[rowNotes.indexOf(nt.n)] || {}).color || col) : col;
        g.globalAlpha = 0.35 + 0.65 * nt.v; g.fillStyle = c2; g.fillRect(x + 1, y + 1, w - 1, ROW - 2); g.globalAlpha = 1;
        g.strokeStyle = i === sel ? '#fff' : '#000'; g.lineWidth = 1; g.strokeRect(x + 1.5, y + 1.5, w - 2, ROW - 3);
      });
      if (playStep !== null && playStep >= 0 && playStep <= steps) { g.fillStyle = '#fff'; g.fillRect(playStep * pps, 0, 2, H); }
    }
    function commit(next) { notes = next; draw(); if (clip) view.emit('clip_edit', { id: clip.id, patch: { notes: next } }); }
    function audition(ns) { if (lane) view.emit('note_audition', { lane: lane.id, note: ns[0], notes: ns }); }
    function pitchFor(n) { return drums ? n : lock ? MT.quantize(n, key.root, key.scale) : n; }
    function stampNotes(n) {
      const p = pitchFor(n); if (drums || stamp === 'note') return [p];
      const dg = MT.degreeOf(p, key.root, key.scale); return MT.chord(dg.degree, key.root, key.scale, stamp, dg.octave);
    }
    const local = (e) => toContent(cv, e.clientX, e.clientY);
    function hit(x, y) { const n = nOf(y), st = x / pps; for (let i = notes.length - 1; i >= 0; i--) { const a = notes[i]; if (a.n === n && st >= a.s && st <= a.s + a.l) return i; } return -1; }
    cv.addEventListener('pointerdown', (e) => {
      e.stopPropagation(); cv.focus({ preventScroll: true }); if (!clip) return;
      const { x, y } = local(e); const i = hit(x, y);
      if (e.button === 2) { if (i >= 0) { sel = -1; commit(notes.filter((_, j) => j !== i)); } return; }
      try { cv.setPointerCapture(e.pointerId); } catch (_) {}
      if (i >= 0) {
        sel = i; const a = notes[i], edge = (a.s + a.l) * pps - x < 6;
        drag = { mode: edge ? 'resize' : 'move', idx: [i], orig: notes.map(n => Object.assign({}, n)), x0: x, y0: y, changed: false };
        if (!edge) audition([a.n]);
      } else {
        const s = Math.max(0, Math.min(clip.bars * 16 - grid, Math.floor(x / pps / grid) * grid));
        const ps = stampNotes(nOf(y)).filter(n => drums ? rowNotes.includes(n) : (n >= LO && n <= HI));
        if (!ps.length) return;
        const add = ps.map(n => ({ s, l: Math.min(len, clip.bars * 16 - s), n, v: 0.85 }));
        const next = notes.concat(add); const idx = add.map((_, k) => notes.length + k);
        notes = next; sel = idx[0]; audition(ps);
        drag = { mode: 'move', idx, orig: next.map(n => Object.assign({}, n)), x0: x, y0: y, changed: true };
      }
      draw();
    });
    cv.addEventListener('pointermove', (e) => {
      const { x, y } = local(e);
      if (drag && e.buttons === 0 && e.pointerType === 'mouse') endDrag(); // the button came up somewhere we never heard about
      if (!drag) { const i = clip ? hit(x, y) : -1; cv.classList.toggle('edge', i >= 0 && (notes[i].s + notes[i].l) * pps - x < 6); return; }
      cv.classList.add('move');
      const steps = clip.bars * 16;
      if (drag.mode === 'move') {
        const ds = Math.round((x - drag.x0) / pps / grid) * grid, dn = Math.round((drag.y0 - y) / ROW);
        const moveN = (n) => { if (!drums) return Math.max(LO, Math.min(HI, pitchFor(n + dn))); const r = rowNotes.indexOf(n); return r < 0 ? n : rowNotes[Math.max(0, Math.min(rowNotes.length - 1, r - dn))]; };
        drag.idx.forEach(i => { const o = drag.orig[i]; const s = Math.max(0, Math.min(steps - 0.25, o.s + ds)); notes[i] = Object.assign({}, o, { s, l: Math.min(o.l, steps - s), n: moveN(o.n) }); });
        if (ds || dn) drag.changed = true;
      } else {
        drag.idx.forEach(i => { const o = drag.orig[i]; const end = Math.max(o.s + 0.25, Math.round(x / pps / grid) * grid); notes[i] = Object.assign({}, o, { l: Math.min(steps - o.s, Math.max(grid === 1 ? 0.25 : grid, end - o.s)) }); });
        drag.changed = true;
      }
      draw();
    });
    const endDrag = () => { cv.classList.remove('move'); if (!drag) return; const d = drag; drag = null; if (d.changed) commit(notes.slice()); };
    cv.addEventListener('pointerdown', () => { if (drag && !drag.done) drag.done = global.UIKit.drag.begin(endDrag); }); // 3.34 guard
    cv.addEventListener('pointerup', endDrag);
    // a lost capture / cancelled pointer (alt-tab, touch cancel, window torn down mid-drag) must never leave a drag armed
    cv.addEventListener('pointercancel', endDrag); cv.addEventListener('lostpointercapture', endDrag);
    cv.addEventListener('dblclick', (e) => { const { x, y } = local(e); const i = hit(x, y); if (i >= 0) { sel = -1; commit(notes.filter((_, j) => j !== i)); } });
    cv.addEventListener('contextmenu', (e) => e.preventDefault());
    cv.addEventListener('wheel', (e) => {
      const { x, y } = local(e); const i = hit(x, y); if (i < 0) return;
      e.preventDefault(); e.stopPropagation();
      const next = notes.slice(); next[i] = Object.assign({}, next[i], { v: Math.max(0.05, Math.min(1, next[i].v + (e.deltaY < 0 ? 0.05 : -0.05))) }); sel = i;
      notes = next; draw(); clearTimeout(cv._wt); cv._wt = setTimeout(() => commit(notes.slice()), 250);
    }, { passive: false });
    cv.addEventListener('keydown', (e) => {
      if ((e.key === 'Delete' || e.key === 'Backspace') && sel >= 0 && notes[sel]) { e.preventDefault(); e.stopPropagation(); const i = sel; sel = -1; commit(notes.filter((_, j) => j !== i)); }
      else if (drums && (e.key === 'ArrowUp' || e.key === 'ArrowDown')) { if (sel < 0 || !notes[sel]) return; e.preventDefault(); e.stopPropagation(); const r = rowNotes.indexOf(notes[sel].n), r2 = Math.max(0, Math.min(rowNotes.length - 1, r + (e.key === 'ArrowUp' ? -1 : 1))); const next = notes.slice(); next[sel] = Object.assign({}, next[sel], { n: rowNotes[r2] }); audition([rowNotes[r2]]); commit(next); }
      else if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { if (sel < 0 || !notes[sel]) return; e.preventDefault(); e.stopPropagation(); const next = notes.slice(); const d = e.key === 'ArrowUp' ? (e.shiftKey ? 12 : 1) : (e.shiftKey ? -12 : -1); let n = next[sel].n + d; if (lock && Math.abs(d) === 1) { while (!inScale(n) && n > LO && n < HI) n += d; } next[sel] = Object.assign({}, next[sel], { n: Math.max(LO, Math.min(HI, n)) }); audition([next[sel].n]); commit(next); }
    });
    keys.addEventListener('pointerdown', (e) => { e.stopPropagation(); audition([nOf(toContent(keys, e.clientX, e.clientY).y)]); });

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
    setMode(null);
    return { el, show, hide, playhead, get open() { return !!clip; }, get clipId() { return clip && clip.id; }, get drums() { return drums; } };
  }
  global.EravosTimelinePianoRoll = { create, mapPoint, toContent };
})(window);
