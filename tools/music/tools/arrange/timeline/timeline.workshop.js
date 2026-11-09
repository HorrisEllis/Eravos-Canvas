/* eravos.timeline — the Workshop's NOTES kind (music.notes), W2 slice a (specs/eravos.workshop.spec ADDENDUM 2026-11-08).
 * His words, 2026-11-08: "The edit pattern or note doesn’t open workshop." · 2026-11-06 (13:28:34): the note editor and the pattern editor are one —
 * "the note editor IS the workshop at note scale; patterns are the workshop at pattern scale". canvas/runtime/workshop.js stays domain-free:
 * every word and picture of a note is here. The document is the clip's notes exactly as the piano roll keeps them, so Apply is not needed:
 * every edit goes back through the roll's own commit (live), and a note round-trips unchanged when nothing was touched.
 *   EravosTimelineWorkshop.KIND · EravosTimelineWorkshop.ensure() → true when the kind is on the Workshop */
(function (global) {
  'use strict';
  const NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
  const nameOf = (n) => NAMES[((n % 12) + 12) % 12] + (Math.floor(n / 12) - 1);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const BEND0 = { from: 0, to: 0, at: 0, shape: 'smooth' }, OSC0 = { rate: '1/16', depth: 0, shape: 'sine', fade: 0 };
  const RATES = ['1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
  const FIELDS = {   // key → [read from a note, write into a note]
    s: [(a) => a.s, (a, v) => { a.s = Math.max(0, v); }], l: [(a) => a.l, (a, v) => { a.l = Math.max(0.25, v); }],
    mt: [(a) => Math.round((a.mt || 0) * 100), (a, v) => { a.mt = clamp(v, -50, 50) / 100; if (!a.mt) delete a.mt; }],
    n: [(a) => a.n, (a, v) => { a.n = Math.round(clamp(v, 0, 127)); }],
    v: [(a) => Math.round(a.v * 127), (a, v) => { a.v = clamp(Math.round(v) / 127, 0.05, 1); }],
    pr: [(a) => Math.round((a.pr || 1) * 100), (a, v) => { a.pr = clamp(v, 5, 100) / 100; if (!(a.pr < 1)) delete a.pr; }],
    rt: [(a) => a.rt || 1, (a, v) => { a.rt = Math.round(clamp(v, 1, 8)); if (!(a.rt > 1)) delete a.rt; }],
  };
  ['from', 'to', 'at', 'shape'].forEach(k => { FIELDS['b.' + k] = [(a) => Object.assign({}, BEND0, a.b)[k], (a, v) => { a.b = Object.assign({}, BEND0, a.b, { [k]: v }); }]; });
  ['rate', 'depth', 'shape', 'fade'].forEach(k => { FIELDS['osc.' + k] = [(a) => Object.assign({}, OSC0, a.b && a.b.osc)[k], (a, v) => { const b = Object.assign({}, BEND0, a.b); b.osc = Object.assign({}, OSC0, b.osc, { [k]: v }); a.b = b; }]; });
  // W3d HOW IT PLAYS (note.x — the Timeline plays it): when, a chord from the note, the ratchet's shape, humanize per play
  const CHORDS = { none: [], 'octave up': [12], 'octave down': [-12], fifth: [7], 'power (5 + 8)': [7, 12], major: [4, 7], minor: [3, 7], sus2: [2, 7], sus4: [5, 7],
    dim: [3, 6], aug: [4, 8], '7th': [4, 7, 10], maj7: [4, 7, 11], min7: [3, 7, 10], add9: [4, 7, 14], 'minor 9': [3, 7, 10, 14], 'stack of 4ths': [5, 10, 15] };
  const chordName = (iv) => { const k = JSON.stringify(iv || []); return Object.keys(CHORDS).find(n => JSON.stringify(CHORDS[n]) === k) || (iv && iv.length ? 'custom' : 'none'); };
  const RS = { even: null, 'speeds up': 'accel', 'slows down': 'decel' }, RV = { fades: null, flat: 'flat', grows: 'grow' }, DIRS = { up: null, down: 'down', 'from the root out': 'out' };
  const xOf = (a) => Object.assign({}, a.x || {}), putX = (a, o) => { Object.keys(o).forEach(k => { if (o[k] === null || o[k] === undefined || o[k] === 0 || o[k] === '') delete o[k]; }); if (o.cond && !(o.cond.every > 1)) delete o.cond; if (!o.iv || !o.iv.length) { delete o.iv; delete o.strum; delete o.dir; delete o.fall; } if (Object.keys(o).length) a.x = o; else delete a.x; };
  const keyOfVal = (m, v) => Object.keys(m).find(k => m[k] === (v || null)) || Object.keys(m)[0];
  Object.assign(FIELDS, {
    'x.every': [(a) => (a.x && a.x.cond ? a.x.cond.every : 1), (a, v) => { const o = xOf(a), ev = Math.round(clamp(v, 1, 16)); o.cond = ev > 1 ? Object.assign({}, o.cond || {}, { every: ev, at: Math.min(ev - 1, (o.cond && o.cond.at) || 0) }) : null; putX(a, o); }],
    'x.at': [(a) => (a.x && a.x.cond ? a.x.cond.at + 1 : 1), (a, v) => { const o = xOf(a); if (!o.cond) return; o.cond = Object.assign({}, o.cond, { at: Math.round(clamp(v, 1, o.cond.every)) - 1 }); putX(a, o); }],
    'x.skip': [(a) => (a.x && a.x.cond && a.x.cond.skip ? 'skips' : 'plays'), (a, v) => { const o = xOf(a); if (!o.cond) return; o.cond = Object.assign({}, o.cond); if (v === 'skips') o.cond.skip = true; else delete o.cond.skip; putX(a, o); }],
    'x.chord': [(a) => chordName(a.x && a.x.iv), (a, v) => { const o = xOf(a); o.iv = (CHORDS[v] || []).slice(); putX(a, o); }],
    'x.strum': [(a) => (a.x && a.x.strum) || 0, (a, v) => { const o = xOf(a); o.strum = Math.round(clamp(v, 0, 250)); putX(a, o); }],
    'x.dir': [(a) => keyOfVal(DIRS, a.x && a.x.dir), (a, v) => { const o = xOf(a); o.dir = DIRS[v] || null; putX(a, o); }],
    'x.fall': [(a) => Math.round(((a.x && a.x.fall) || 0) * 100), (a, v) => { const o = xOf(a); o.fall = clamp(v, 0, 50) / 100; putX(a, o); }],
    'x.rs': [(a) => keyOfVal(RS, a.x && a.x.rs), (a, v) => { const o = xOf(a); o.rs = RS[v] || null; putX(a, o); }],
    'x.rv': [(a) => keyOfVal(RV, a.x && a.x.rv), (a, v) => { const o = xOf(a); o.rv = RV[v] || null; putX(a, o); }],
    'x.ht': [(a) => (a.x && a.x.ht) || 0, (a, v) => { const o = xOf(a); o.ht = Math.round(clamp(v, 0, 60)); putX(a, o); }],
    'x.hv': [(a) => Math.round(((a.x && a.x.hv) || 0) * 100), (a, v) => { const o = xOf(a); o.hv = clamp(v, 0, 40) / 100; putX(a, o); }],
  });
  // the roll's own rule (3.117): defaults are not stored
  function tidy(a) { if (a.b) { if (a.b.osc && !(a.b.osc.depth > 0)) delete a.b.osc; if (!a.b.from && !a.b.to && !a.b.osc && !a.b.path) delete a.b; } return a; }
  const noteOf = (d) => (d.notes || [])[clamp(d.sel | 0, 0, Math.max(0, (d.notes || []).length - 1))];

  // the pitch over the note, in semitones from its own pitch: the bend curve, plus the oscillation around it (what the roll's engine plays)
  function curve(a, t) {
    const b = Object.assign({}, BEND0, a.b), u = t <= b.at ? 0 : (t - b.at) / Math.max(1e-6, 1 - b.at);
    const e = b.shape === 'linear' ? u : b.shape === 'early' ? 1 - Math.pow(1 - u, 3) : b.shape === 'late' ? u * u * u : u * u * (3 - 2 * u);
    let st = b.from + (b.to - b.from) * e; const o = b.osc;
    if (o && o.depth > 0) { const cyc = typeof o.rate === 'number' ? o.rate * 2 : 8, ph = t * cyc, f = o.fade ? Math.min(1, t / o.fade) : 1;
      const w = o.shape === 'square' ? Math.sign(Math.sin(ph * 2 * Math.PI)) : o.shape === 'triangle' ? 1 - 4 * Math.abs((ph % 1) - 0.5) : o.shape === 'saw' ? 2 * (ph % 1) - 1 : Math.sin(ph * 2 * Math.PI);
      st += w * o.depth * f; }
    return st;
  }


  // ---- W3b SHAPE: a note shaped fractally (specs/eravos.workshop.spec ADDENDUM 2026-11-08 (night); components/mod-tree)
  // note.sh = { t: { pitch: SIGNAL, 'k:<knob>': SIGNAL } }. The open place in the tree: d.at = { t: target, p: [[modIndex, 'rate'|'depth'], …] }.
  // Every edit compiles the tree into what the engine plays: pitch → b.path (64 points), a knob → c[knob] (64 points, in its range).
  const MT = () => (global.MusicParts && global.MusicParts.modTree) || null;
  const COLORS = ['#ff4fd8', '#ffb000', '#2bff88', '#a78bfa', '#ff6b6b', '#4dd0ff', '#f0f'];
  const PRESETS = ['flat', 'rise', 'fall', 'arch', 'dip', 's-curve', 'zigzag', 'steps'];
  function presetPts(shape, lo, hi) {
    const L = (t) => lo + (hi - lo) * t;
    switch (shape) {
      case 'rise': return [[0, lo], [1, hi]];
      case 'fall': return [[0, hi], [1, lo]];
      case 'arch': return [[0, lo], [0.5, hi], [1, lo]];
      case 'dip': return [[0, hi], [0.5, lo], [1, hi]];
      case 's-curve': return [0, 0.15, 0.3, 0.45, 0.55, 0.7, 0.85, 1].map(t => [t, L(t * t * (3 - 2 * t))]);
      case 'zigzag': return [0, 0.25, 0.5, 0.75, 1].map((t, i) => [t, i % 2 ? hi : lo]);
      case 'steps': return [[0, lo], [0.333, lo], [0.334, L(0.5)], [0.666, L(0.5)], [0.667, hi], [1, hi]];
      default: return [[0, lo], [1, lo]];
    }
  }
  const knobOf = (d, k) => (d.knobs || []).find(x => x.key === k) || null;
  function targetInfo(d, t, a) {
    if (t === 'pitch') return { label: 'Pitch', unit: 'st', min: -48, max: 48, def: 0 };
    const k = knobOf(d, String(t).slice(2)); if (!k) return { label: String(t).slice(2), unit: '', min: 0, max: 1, def: 0 };
    const v = a && a.p && isFinite(a.p[k.key]) ? +a.p[k.key] : k.val;
    return { label: k.label, unit: k.unit || '', min: +k.min, max: +k.max, def: clamp(+v, +k.min, +k.max) };
  }
  // where a place in the tree lives inside the note, and the range of what is there
  const sigPath = (at) => ['sh', 't', at.t].concat(...(at.p || []).map(([i, sub]) => ['mods', i, sub]));
  function rangeOf(d, at, a) {
    let r = targetInfo(d, at.t, a), lo = r.min, hi = r.max, unit = r.unit;
    for (const [, sub] of (at.p || [])) { if (sub === 'rate') { lo = 0; hi = 64; unit = 'cycles'; } else { hi = (hi - lo) / 2; lo = 0; } }
    return { lo, hi, unit };
  }
  const atLabel = (d, at, a) => targetInfo(d, at.t, a).label + (at.p || []).map(([i, sub]) => ' › MOD ' + (i + 1) + ' › ' + sub.toUpperCase()).join('');
  function compile(a, d) {
    const M = MT(); if (!M) return a; const T = (a.sh && a.sh.t) || {};
    // pitch owns the bend while it is shaped; the note's own oscillation still plays on top (the engine adds it to the path)
    if (T.pitch) {
      const path = M.resample(M.sample(T.pitch, 256), 64).map(([t, v]) => [t, clamp(v, -48, 48)]), osc = a.b && a.b.osc;
      if (path.some(q => Math.abs(q[1]) > 1e-4)) a.b = Object.assign({ from: path[0][1], to: path[63][1], shape: 'path', at: 0, path }, osc ? { osc } : {});
      else if (osc) a.b = { from: 0, to: 0, at: 0, shape: 'smooth', osc }; else delete a.b;
    } else if (a.b && a.b.shape === 'path' && a._shPitch) { const osc = a.b.osc; if (osc) a.b = { from: 0, to: 0, at: 0, shape: 'smooth', osc }; else delete a.b; }
    const c = Object.assign({}, a.c || {});
    Object.keys(a._shKnobs || {}).forEach(k => { if (!T['k:' + k]) delete c[k]; });
    Object.keys(T).filter(t => t.startsWith('k:')).forEach(t => { const r = targetInfo(d, t, a); c[t.slice(2)] = M.resample(M.sample(T[t], 256), 64).map(([x, v]) => [x, clamp(v, r.min, r.max)]); });
    if (Object.keys(c).length) a.c = c; else delete a.c;
    delete a._shPitch; delete a._shKnobs;
    if (a.sh && !Object.keys(T).length) delete a.sh;
    return a;
  }
  const signalAt = (a, at) => { const M = MT(); return M ? M.get(a, sigPath(at).slice(0)) : null; };
  // sample one thing in the open place: the result, the base, one mod's own contribution, a mod's rate / depth
  function series(a, at, what, N) {
    const M = MT(), sig = signalAt(a, at); if (!M || !sig) return null;
    if (what === 'result') return M.sample(sig, N);
    if (what === 'base') return M.sample({ base: sig.base, mods: [] }, N);
    const m = /^m:(\d+)(?::(rate|depth))?$/.exec(what); if (!m) return null; const mod = (sig.mods || [])[+m[1]]; if (!mod) return null;
    return m[2] ? M.sample(mod[m[2]], N) : M.sample({ base: [], mods: [Object.assign({}, mod, { on: true })] }, N);
  }
  function plot(g, arr, x0, y0, W, H, lo, hi, color, width, dash) {
    if (!arr) return; g.strokeStyle = color; g.lineWidth = width; g.setLineDash(dash || []); g.beginPath();
    for (let i = 0; i < arr.length; i++) { const x = x0 + (i / (arr.length - 1)) * W, y = y0 + (1 - (clamp(arr[i], lo, hi) - lo) / Math.max(1e-9, hi - lo)) * H; if (i) g.lineTo(x, y); else g.moveTo(x, y); }
    g.stroke(); g.setLineDash([]);
  }
  function shapeLayers(d, a) {
    const at = d.at, sig = signalAt(a, at), M = MT(), r = rangeOf(d, at, a), depth = (at.p || []).length, deep = depth + 1 >= (M ? M.MAX_DEPTH : 8);
    const pre = sig && sig.pre, fmt = (v) => (Math.round(v * 100) / 100) + (r.unit ? ' ' + r.unit : '');
    const L = [{ id: 'result', group: 'WHAT PLAYS', type: 'curve', label: 'Result', sub: atLabel(d, at, a) + ' · base + ' + ((sig && sig.mods) || []).length + ' mods', fields: [] },
      { id: 'base', group: 'BASE', type: 'curve', label: 'Base', sub: pre ? pre.shape + ' ' + fmt(pre.lo) + ' → ' + fmt(pre.hi) : 'drawn — draw it in the view', fields: [
        { key: 'base.preset', label: 'Shape', type: 'enum', options: PRESETS }, { key: 'base.lo', label: 'From', type: 'number', min: r.lo, max: r.hi, step: (r.hi - r.lo) / 200 || 0.01, unit: r.unit },
        { key: 'base.hi', label: 'To', type: 'number', min: r.lo, max: r.hi, step: (r.hi - r.lo) / 200 || 0.01, unit: r.unit }] }];
    ((sig && sig.mods) || []).forEach((m, i) => {
      const rate = M ? M.baseAt(m.rate.base, 0) : 0, dep = M ? M.baseAt(m.depth.base, 0) : 0, g = 'MOD ' + (i + 1) + (m.on === false ? ' (off)' : '');
      L.push({ id: 'm:' + i, group: g, type: 'curve', label: 'Mod ' + (i + 1) + ' · ' + m.shape, sub: 'rate ' + (Math.round(rate * 100) / 100) + (M && M.count(m.rate) ? '~' : '') + ' · depth ' + fmt(dep) + (M && M.count(m.depth) ? '~' : '') + (M && (M.count(m.rate) + M.count(m.depth)) ? ' · ' + (M.count(m.rate) + M.count(m.depth)) + ' inside' : ''), fields: [
        { key: 'm.' + i + '.shape', label: 'Wave', type: 'enum', options: M ? M.SHAPES : ['sine'] },
        { key: 'm.' + i + '.rate', label: 'Rate', type: 'number', min: 0, max: 64, step: 0.25, unit: 'cycles' },
        { key: 'm.' + i + '.depth', label: 'Depth', type: 'number', min: 0, max: Math.max(0.01, (r.hi - r.lo) / 2), step: ((r.hi - r.lo) / 400) || 0.01, unit: r.unit },
        { key: 'm.' + i + '.phase', label: 'Phase', type: 'number', min: 0, max: 1, step: 0.05 }, { key: 'm.' + i + '.fade', label: 'Fade in', type: 'number', min: 0, max: 1, step: 0.05 },
        { key: 'm.' + i + '.seed', label: 'Seed', type: 'number', min: 1, max: 9999, step: 1 }, { key: 'm.' + i + '.on', label: 'On', type: 'enum', options: ['on', 'off'] }] });
      if (!deep) ['rate', 'depth'].forEach(sub => L.push({ id: 'm:' + i + ':' + sub, group: g, type: 'curve', label: (sub === 'rate' ? 'Rate' : 'Depth') + ' of mod ' + (i + 1), sub: (M ? M.count(m[sub]) : 0) + ' mods inside — ▾ INTO to shape it', fields: [] }));
    });
    return L;
  }
  function shapeAt(d) { return d.at && d.at.t ? d.at : null; }
  let HOOK = {};   // the opener's: { hear(note) } — the roll plays a note through its lane's instrument, curves and all
  const bind = (h) => { HOOK = h || {}; };
  // the view's range for the open curve: its whole range for a target's base; for a mod's rate / depth, what it holds (with room)
  function viewRange(d, at, a) {
    const r = rangeOf(d, at, a); if (!(at.p || []).length && at.t !== 'pitch') return r;
    const arr = Array.from(series(a, at, 'result', 160) || [0]), mn = Math.min(...arr), mx = Math.max(...arr);
    if (at.t === 'pitch' && !(at.p || []).length) { const m = Math.max(2, Math.abs(mn), Math.abs(mx)) * 1.25; return { lo: -Math.min(48, m), hi: Math.min(48, m), unit: r.unit }; }
    return { lo: Math.max(r.lo, Math.min(0, mn)), hi: Math.max(mx * 1.3, r.lo + (r.hi - r.lo) * 0.1, 1e-3), unit: r.unit };
  }
  function drawShape(g, W, H, d, a, top, o) {
    const ns = d.notes || [], at = d.at, end = Math.max(16, ...ns.map(x => x.s + x.l)), lo = Math.min(...ns.map(x => x.n)) - 1, hi = Math.max(...ns.map(x => x.n)) + 1;
    g.fillStyle = '#0a0b0d'; g.fillRect(0, 0, W, H);
    const X = (s) => 10 + (s / end) * (W - 20), Y = (n) => 44 + (1 - (n - lo) / Math.max(1, hi - lo)) * (top - 56);
    ns.forEach((x, i) => { g.fillStyle = i === (d.sel | 0) ? '#00d4ff' : 'rgba(0,212,255,0.35)'; g.fillRect(X(x.s), Y(x.n) - 3, Math.max(3, X(x.s + x.l) - X(x.s) - 1), 6); });
    g.strokeStyle = '#1c2026'; g.beginPath(); g.moveTo(0, top); g.lineTo(W, top); g.stroke();
    const sig = signalAt(a, at), r = viewRange(d, at, a), y0 = top + 26, h = H - y0 - 14, x0 = 16, w = W - 32, sel = o.selected || '';
    g.fillStyle = '#7f93a8'; g.font = '12px sans-serif'; g.fillText(atLabel(d, at, a).toUpperCase() + ' · over the note (' + a.l + ' sixteenths) · draw in here', x0, top + 17);
    // the grid: the range's ends and its middle, in its units
    g.strokeStyle = '#151a20'; g.fillStyle = '#4c5a69'; g.font = '10px monospace';
    [0, 0.5, 1].forEach(f => { const y = y0 + (1 - f) * h; g.beginPath(); g.moveTo(x0, y); g.lineTo(x0 + w, y); g.stroke(); g.fillText(String(Math.round((r.lo + (r.hi - r.lo) * f) * 100) / 100) + (r.unit ? ' ' + r.unit : ''), x0 + w - 70, y - 3); });
    for (let k = 1; k < 4; k++) { const x = x0 + w * k / 4; g.beginPath(); g.moveTo(x, y0); g.lineTo(x, y0 + h); g.stroke(); }
    const mi = /^m:(\d+)$/.exec(sel), mod = mi && sig && sig.mods[+mi[1]];
    if (mod) {   // the selected modulator's wave, one cycle, large in the background (draw over it to make your own)
      const M = MT(), cyc = new Float64Array(161).map((_, i) => M ? M.wave(mod, i / 160) : 0);
      g.globalAlpha = 0.35; plot(g, cyc, x0, y0, w, h, -1.05, 1.05, COLORS[+mi[1] % COLORS.length], 1.5, [3, 4]); g.globalAlpha = 1;
      g.fillStyle = COLORS[+mi[1] % COLORS.length]; g.fillText('MOD ' + (+mi[1] + 1) + ' · ONE CYCLE OF ITS WAVE (dashed) — draw here to make a wave of your own', x0, y0 + h + 12);
    }
    const hid = o.hidden || new Set();
    ((sig && sig.mods) || []).forEach((m, i) => { if (hid.has('m:' + i)) return; const arr = series(a, at, 'm:' + i, 320); if (!arr) return; const off = new Float64Array(arr.length).map((_, j) => arr[j] + (r.lo + r.hi) / 2); g.globalAlpha = m.on === false ? 0.2 : 0.7; plot(g, off, x0, y0, w, h, r.lo, r.hi, COLORS[i % COLORS.length], sel === 'm:' + i ? 2 : 1); g.globalAlpha = 1; });
    if (!hid.has('base')) plot(g, series(a, at, 'base', 320), x0, y0, w, h, r.lo, r.hi, sel === 'base' ? '#00d4ff' : 'rgba(255,255,255,0.55)', sel === 'base' ? 2 : 1.2, [8, 5]);
    if (!hid.has('result')) plot(g, series(a, at, 'result', 640), x0, y0, w, h, r.lo, r.hi, '#00d4ff', 2.6);
  }
  const KIND = {
    id: 'music.notes', label: 'Notes',
    title: (d) => d.name || 'Pattern',
    stations: (d) => { const a = noteOf(d), at = shapeAt(d); const st = ['SONG', 'PATTERN · ' + (d.name || 'clip'), a ? 'NOTE · ' + (d.drums ? 'pad ' + a.n : nameOf(a.n)) : 'NOTE'];
      if (at && a) { st.push(targetInfo(d, at.t, a).label.toUpperCase()); (at.p || []).forEach(([i, sub]) => { st.push('MOD ' + (i + 1)); st.push(sub.toUpperCase()); }); } return st; },
    stationKey: 'go',
    // the bar: up and into the tree (the fractal), add / take away a modulator, stop shaping
    actions(d, o) {
      const a = noteOf(d), at = shapeAt(d), sel = (o && o.selected) || '', M = MT(); if (!a) return [];
      const into = /^(T:.+|m:\d+:(rate|depth))$/.test(sel), out = [];
      out.push({ label: '▶ HEAR', name: "Hear it", keys: 'Space', hint: 'play this note alone, shaped (its instrument, its curves, its knobs)', disabled: !HOOK.hear, run: (doc) => { const x = noteOf(doc); if (x && HOOK.hear) HOOK.hear(x); return 'heard ' + (doc.drums ? 'pad ' + x.n : nameOf(x.n)); } });
      // A / B: keep this version as A, change it, then hear and swap — the studio's before / after
      const ab = d.ab && d.ab.i === (d.sel | 0) ? d.ab : null;
      out.push({ label: ab ? 'A ← NOW' : 'SET A', name: "Keep this as A", keys: 'A', key: 'abSet', value: true, hint: 'keep the note as it is now as A, to compare against' });
      if (ab) { out.push({ label: '▶ A', name: "Hear A", keys: 'Shift+Space', hint: 'hear A', disabled: !HOOK.hear, run: () => { HOOK.hear(ab.note); return 'heard A'; } }); out.push({ label: '⇄ A/B', name: "Swap A and B", keys: 'X', key: 'abSwap', value: true, hint: 'swap: the note becomes A, A becomes what it was' }); }
      if ((a.sh && Object.keys(a.sh.t || {}).length) || a.p || a.x) out.push({ label: '⇉ ALL NOTES', name: "Give every note this shape", keys: 'Shift+A', key: 'shapeAll', value: true, disabled: (d.notes || []).length < 2, hint: 'give every note in this pattern this note\'s shape and its own knob values' });
      const pk = /^P:(.+)$/.exec(sel); if (!at && pk) out.push({ label: '✕ KNOB', name: "Back to the instrument's value", keys: 'Delete', icon: '−', only: 'layer', key: 'unsetp', value: pk[1], hint: 'this note goes back to the instrument\'s own value' });
      if (at) out.push({ label: '▴ UP', name: "Up a level", keys: 'Backspace', icon: '⤴', key: 'nav', value: 'up', hint: 'one level up the tree' });
      out.push({ label: '▾ INTO', name: "Open it", keys: 'Enter', icon: '⤵', open: true, key: 'nav', value: 'into:' + sel, disabled: !into, hint: 'open the selected curve and shape IT (its own base and modulators)' });
      if (at) { const n = ((signalAt(a, at) || {}).mods || []).length; out.push({ label: '＋ MOD', name: "Add a modulator", keys: 'M', icon: '＋', key: 'addmod', value: n, hint: 'add a modulator here (its rate and depth can be shaped too)' });
        const mi = /^m:(\d+)$/.exec(sel); out.push({ label: '− MOD', name: "Remove the modulator", keys: 'Delete', icon: '−', only: 'layer', key: 'delmod', value: mi ? +mi[1] : -1, disabled: !mi, hint: 'take the selected modulator away' });
        if (!(at.p || []).length) out.push({ label: '✕ UNSHAPE', name: "Stop shaping this", keys: 'U', icon: '⊘', key: 'unshape', value: at.t, hint: 'stop shaping this (the note plays as before it was shaped)' }); }
      return out;
    },
    layers(d) {
      const a = noteOf(d), N = (d.notes || []).length; if (!a) return [{ id: 'pattern', group: 'PATTERN', type: 'events', label: 'No notes', sub: 'draw some in the piano roll', fields: [] }];
      if (shapeAt(d)) return shapeLayers(d, a);
      const T = (a.sh && a.sh.t) || {};
      const L = [
        { id: 'pattern', group: 'PATTERN', type: 'events', label: 'Note ' + ((d.sel | 0) + 1) + ' of ' + N, sub: 'click a note in the view to open it', fields: [{ key: 'sel', label: 'Note', type: 'number', min: 1, max: N, step: 1 }] },
        { id: 'timing', group: 'THIS NOTE', type: 'value', label: 'Timing', sub: 'start ' + a.s + ' · length ' + a.l + ' (16ths)', fields: [{ key: 's', label: 'Start', type: 'number', min: 0, step: 0.25, unit: '16ths' }, { key: 'l', label: 'Length', type: 'number', min: 0.25, step: 0.25, unit: '16ths' }, { key: 'mt', label: 'Nudge', type: 'number', min: -50, max: 50, step: 1, unit: '%' }] },
        { id: 'pitch', group: 'THIS NOTE', type: 'value', label: d.drums ? 'Pad' : 'Pitch', sub: d.drums ? 'pad ' + a.n : nameOf(a.n), fields: [{ key: 'n', label: d.drums ? 'Pad' : 'Pitch', type: 'number', min: 0, max: 127, step: 1 }] },
        { id: 'velocity', group: 'THIS NOTE', type: 'value', label: 'Velocity', sub: String(Math.round(a.v * 127)), fields: [{ key: 'v', label: 'Velocity', type: 'number', min: 1, max: 127, step: 1 }] },
        { id: 'depth', group: 'THIS NOTE', type: 'value', label: 'Chance and ratchet', sub: Math.round((a.pr || 1) * 100) + ' % · ' + ((a.rt || 1) > 1 ? '×' + a.rt : 'no ratchet'), fields: [{ key: 'pr', label: 'Chance', type: 'number', min: 5, max: 100, step: 1, unit: '%' }, { key: 'rt', label: 'Ratchet', type: 'number', min: 1, max: 8, step: 1 }] },
      ];
      if (!d.drums) {
        const b = Object.assign({}, BEND0, a.b), o = Object.assign({}, OSC0, a.b && a.b.osc);
        if (!T.pitch) L.push({ id: 'bend', group: 'ITS CURVES', type: 'curve', label: 'Bend', sub: b.from || b.to ? (b.from > 0 ? '+' : '') + b.from + ' → ' + (b.to > 0 ? '+' : '') + b.to + ' st, ' + b.shape : 'flat', fields: [{ key: 'b.from', label: 'From', type: 'number', min: -48, max: 48, step: 0.1, unit: 'st' }, { key: 'b.to', label: 'Bend to', type: 'number', min: -48, max: 48, step: 0.1, unit: 'st' }, { key: 'b.at', label: 'Starts', type: 'number', min: 0, max: 0.95, step: 0.01 }, { key: 'b.shape', label: 'Curve', type: 'enum', options: ['smooth', 'linear', 'early', 'late'] }] });
        L.push({ id: 'osc', group: 'ITS CURVES', type: 'curve', label: 'Oscillate', sub: o.depth > 0 ? '±' + o.depth + ' st, ' + o.shape + ', ' + o.rate : 'off', fields: [{ key: 'osc.depth', label: 'Depth', type: 'number', min: 0, max: 12, step: 0.05, unit: 'st' }, { key: 'osc.rate', label: 'Rate', type: 'enum', options: RATES }, { key: 'osc.shape', label: 'Shape', type: 'enum', options: ['sine', 'triangle', 'saw', 'square', 'random'] }, { key: 'osc.fade', label: 'Fade in', type: 'number', min: 0, max: 1, step: 0.01 }] });
      }
      // HOW IT PLAYS: when, as a chord, its ratchet's shape, humanize (the Timeline plays every one)
      const x = a.x || {}, cnd = x.cond;
      L.push({ id: 'when', group: 'HOW IT PLAYS', type: 'value', label: 'When', sub: cnd ? (cnd.skip ? 'skips' : 'plays') + ' on pass ' + (cnd.at + 1) + ' of every ' + cnd.every : 'every time', fields: [
        { key: 'x.every', label: 'Every', type: 'number', min: 1, max: 16, step: 1, unit: 'passes' }, { key: 'x.at', label: 'On pass', type: 'number', min: 1, max: cnd ? cnd.every : 1, step: 1 }, { key: 'x.skip', label: 'It', type: 'enum', options: ['plays', 'skips'] }] });
      L.push({ id: 'chord', group: 'HOW IT PLAYS', type: 'value', label: 'Chord', sub: x.iv ? chordName(x.iv) + ' · ' + (x.iv.length + 1) + ' voices' + (x.strum ? ' · strum ' + x.strum + ' ms' : '') : 'one voice', fields: [
        { key: 'x.chord', label: 'Chord', type: 'enum', options: Object.keys(CHORDS) }, { key: 'x.strum', label: 'Strum', type: 'number', min: 0, max: 250, step: 1, unit: 'ms' },
        { key: 'x.dir', label: 'Strum from', type: 'enum', options: Object.keys(DIRS) }, { key: 'x.fall', label: 'Each voice softer', type: 'number', min: 0, max: 50, step: 1, unit: '%' }] });
      if ((a.rt || 1) > 1) L.push({ id: 'repeat', group: 'HOW IT PLAYS', type: 'value', label: 'Ratchet shape', sub: '×' + a.rt + ' · ' + keyOfVal(RS, x.rs) + ' · ' + keyOfVal(RV, x.rv), fields: [
        { key: 'x.rs', label: 'Hits', type: 'enum', options: Object.keys(RS) }, { key: 'x.rv', label: 'Velocity', type: 'enum', options: Object.keys(RV) }] });
      L.push({ id: 'human', group: 'HOW IT PLAYS', type: 'value', label: 'Humanize', sub: x.ht || x.hv ? '± ' + (x.ht || 0) + ' ms · ± ' + Math.round((x.hv || 0) * 100) + ' % velocity, new each pass' : 'exact', fields: [
        { key: 'x.ht', label: 'Timing', type: 'number', min: 0, max: 60, step: 1, unit: '± ms' }, { key: 'x.hv', label: 'Velocity', type: 'number', min: 0, max: 40, step: 1, unit: '± %' }] });
      // SHAPE: what this note moves over its life, each a tree of modulators (▾ INTO to shape it)
      const M = MT();
      Object.keys(T).forEach(t => { const r = targetInfo(d, t, a); L.push({ id: 'T:' + t, group: 'SHAPE · WHAT IT MOVES', type: 'curve', label: r.label, sub: (M ? M.count(T[t]) : 0) + ' mods · ' + (M ? M.depthOf(T[t]) : 0) + ' deep — ▾ INTO', fields: [] }); });
      // ITS KNOBS: any knob of the instrument set for this note only (an envelope per note: its attack, its release …)
      Object.keys(a.p || {}).forEach(k => { const kn = knobOf(d, k); if (!kn) return; L.push({ id: 'P:' + k, group: 'ITS KNOBS · THIS NOTE ONLY', type: 'value', label: kn.label, sub: a.p[k] + (kn.unit ? ' ' + kn.unit : '') + ' (the instrument: ' + kn.val + ')', fields: [{ key: 'p.' + k, label: kn.label, type: 'number', min: kn.min, max: kn.max, step: (kn.max - kn.min) / 200 || 0.01, unit: kn.unit }] }); });
      const freeK = (d.knobs || []).filter(k => !(a.p && a.p[k.key] !== undefined));
      if (freeK.length) L.push({ id: 'setknob', group: 'ITS KNOBS · THIS NOTE ONLY', type: 'value', label: '＋ Set a knob for this note', sub: 'only this note plays with it', fields: [{ key: 'setp', label: 'Knob', type: 'enum', options: freeK.map(k => k.label) }] });
      const can = (d.drums ? [] : ['Pitch']).filter(() => !T.pitch).concat((d.knobs || []).filter(k => !T['k:' + k.key]).map(k => k.label));
      if (M && can.length) L.push({ id: 'addshape', group: 'SHAPE · WHAT IT MOVES', type: 'value', label: '＋ Shape something', sub: 'pitch or any knob of ' + (d.knobs && d.knobs.length ? 'its instrument' : 'the note'), fields: [{ key: 'add', label: 'Shape', type: 'enum', options: can }] });
      return L;
    },
    get(d, key) {
      const at = shapeAt(d), a0 = noteOf(d);
      if (key === 'add' || key === 'setp') return '';
      if (/^p\./.test(key) && a0) return a0.p ? a0.p[key.slice(2)] : undefined;
      if (at && a0) { const sig = signalAt(a0, at) || {}, M = MT();
        if (key === 'base.preset') return (sig.pre && sig.pre.shape) || '';
        if (key === 'base.lo' || key === 'base.hi') { const r = rangeOf(d, at, a0); return sig.pre ? sig.pre[key.slice(5)] : (M ? M.at(sig, key === 'base.lo' ? 0 : 1) : r.lo); }
        const m = /^m\.(\d+)\.(\w+)$/.exec(key); if (m) { const mod = (sig.mods || [])[+m[1]] || {}; if (m[2] === 'rate' || m[2] === 'depth') return M && mod[m[2]] ? Math.round(M.baseAt(mod[m[2]].base, 0) * 1000) / 1000 : 0; if (m[2] === 'on') return mod.on === false ? 'off' : 'on'; return mod[m[2]]; } } if (key === 'sel') return (d.sel | 0) + 1; const a = noteOf(d), f = FIELDS[key]; return a && f ? f[0](a) : undefined; },
    set(d, key, v) {
      const out = Object.assign({}, d, { notes: (d.notes || []).map(x => JSON.parse(JSON.stringify(x))) });
      if (key === 'sel') { out.sel = clamp(Math.round(v) - 1, 0, Math.max(0, out.notes.length - 1)); out.at = null; return out; }
      const i0 = clamp(out.sel | 0, 0, out.notes.length - 1), a0 = out.notes[i0], M = MT();
      // where you are in the tree (not the note's data)
      if (key === 'go') { const k = Math.round(v); if (k <= 2) out.at = null; else if (out.at) out.at = { t: out.at.t, p: (out.at.p || []).slice(0, Math.max(0, Math.floor((k - 3) / 2))) }; return out; }
      if (key === 'nav') {
        if (v === 'up') { out.at = out.at && (out.at.p || []).length ? { t: out.at.t, p: out.at.p.slice(0, -1) } : null; return out; }
        const m = /^into:(?:T:(.+)|m:(\d+):(rate|depth))$/.exec(String(v)); if (!m) return d;
        out.at = m[1] ? { t: m[1], p: [] } : (out.at ? { t: out.at.t, p: (out.at.p || []).concat([[+m[2], m[3]]]) } : null); return out;
      }
      if (key === 'setp' || key === 'unsetp' || /^p\./.test(key)) {
        if (!a0) return d; const kk = key === 'setp' ? ((out.knobs || []).find(q => q.label === v) || {}).key : key === 'unsetp' ? v : key.slice(2), kn = knobOf(out, kk); if (!kn) return d;
        const pp = Object.assign({}, a0.p || {}); if (key === 'unsetp') delete pp[kk]; else pp[kk] = key === 'setp' ? kn.val : clamp(+v, kn.min, kn.max);
        if (Object.keys(pp).length) a0.p = pp; else delete a0.p; out.notes[i0] = a0; return out;
      }
      if (key === 'abSet') { if (!a0) return d; out.ab = { i: i0, note: JSON.parse(JSON.stringify(a0)) }; return out; }
      if (key === 'abSwap') { const ab = out.ab; if (!a0 || !ab || ab.i !== i0) return d; out.notes[i0] = JSON.parse(JSON.stringify(ab.note)); out.ab = { i: i0, note: JSON.parse(JSON.stringify(a0)) }; return out; }
      if (key === 'shapeAll') {
        if (!a0 || !M) return d; const sh = a0.sh ? JSON.parse(JSON.stringify(a0.sh)) : null, pp = a0.p ? Object.assign({}, a0.p) : null;
        out.notes = out.notes.map((x, j) => { if (j === i0) return x; const prevT = Object.keys((x.sh && x.sh.t) || {}); x._shPitch = prevT.includes('pitch'); x._shKnobs = {}; prevT.filter(t => t.startsWith('k:')).forEach(t => { x._shKnobs[t.slice(2)] = 1; });
          if (sh) x.sh = JSON.parse(JSON.stringify(sh)); else delete x.sh; if (pp) x.p = Object.assign({}, x.p || {}, pp); if (a0.x) x.x = JSON.parse(JSON.stringify(a0.x)); return tidy(compile(x, out)); });
        return out;
      }
      if (/^(add|unshape|stroke|addmod|delmod)$|^base\.|^m\.\d/.test(key)) {
      if (!a0 || !M) return d;
      const prevT = Object.keys((a0.sh && a0.sh.t) || {}); a0._shPitch = prevT.includes('pitch'); a0._shKnobs = {}; prevT.filter(t => t.startsWith('k:')).forEach(t => { a0._shKnobs[t.slice(2)] = 1; });
      const put = (path, val) => { const x = M.set(a0, path, val); Object.keys(x).forEach(k2 => { a0[k2] = x[k2]; }); };
      if (key === 'add') {
        const k = v === 'Pitch' ? 'pitch' : ((out.knobs || []).find(q => q.label === v) ? 'k:' + (out.knobs || []).find(q => q.label === v).key : null); if (!k) return d;
        const r = targetInfo(out, k, a0), base = k === 'pitch' ? (a0.b && (a0.b.from || a0.b.to) ? (a0.b.path || [[0, a0.b.from], [1, a0.b.to]]) : [[0, 0], [1, 0]]) : [[0, r.def], [1, r.def]];
        put(['sh', 't', k], { base: base.map(q => [q[0], q[1]]), mods: [] }); out.at = { t: k, p: [] };
      } else if (key === 'unshape') { const t2 = Object.assign({}, (a0.sh && a0.sh.t) || {}); delete t2[v]; a0.sh = { t: t2 }; out.at = null; }
      else {
        const at = out.at; if (!at) return d; const P = sigPath(at), sig = M.get(a0, P); if (!sig) return d; const r = rangeOf(out, at, a0);
        if (key === 'base.preset' || key === 'base.lo' || key === 'base.hi') {
          const pre = Object.assign({ shape: 'flat', lo: M.at(sig, 0), hi: M.at(sig, 1) }, sig.pre || {}); pre[key.slice(5) === 'preset' ? 'shape' : key.slice(5)] = key === 'base.preset' ? v : clamp(+v, r.lo, r.hi);
          put(P, Object.assign({}, sig, { pre, base: presetPts(pre.shape, pre.lo, pre.hi) }));
        } else if (key === 'stroke') {
          if (v && v.wave !== undefined) { const mi = +v.wave; put(P.concat(['mods', mi]), Object.assign({}, sig.mods[mi], { shape: 'drawn', wave: v.pts })); }
          else { const nx = Object.assign({}, sig, { base: v.pts.map(q => [q[0], clamp(q[1], r.lo, r.hi)]) }); delete nx.pre; put(P, nx); }
        } else if (key === 'addmod') {
          const span = (r.hi - r.lo) / 2, md = M.mod('sine', r.unit === 'cycles' ? 2 : 4, at.t === 'pitch' && !(at.p || []).length ? 0.5 : span * 0.25); md.seed = (sig.mods || []).length + 1;
          put(P.concat(['mods']), (sig.mods || []).concat([md]));
        } else if (key === 'delmod') { if (v < 0) return d; put(P.concat(['mods']), (sig.mods || []).filter((_, j) => j !== +v)); }
        else { const m = /^m\.(\d+)\.(\w+)$/.exec(key); if (!m) return d; const mi = +m[1], f = m[2], mod = (sig.mods || [])[mi]; if (!mod) return d;
          if (f === 'rate' || f === 'depth') { const flat = clamp(+v, 0, f === 'rate' ? 64 : Math.max(0.01, (r.hi - r.lo) / 2)); put(P.concat(['mods', mi, f, 'base']), [[0, flat], [1, flat]]); }
          else if (f === 'on') put(P.concat(['mods', mi, 'on']), v !== 'off');
          else if (f === 'shape') put(P.concat(['mods', mi, 'shape']), String(v));
          else put(P.concat(['mods', mi, f]), f === 'seed' ? Math.round(+v) : clamp(+v, 0, 1)); }
      }
      out.notes[i0] = tidy(compile(a0, out)); return out;
      }
      const i = clamp(out.sel | 0, 0, out.notes.length - 1), a = out.notes[i], f = FIELDS[key]; if (!a || !f) return d;
      f[1](a, v); out.notes[i] = tidy(a); return out;
    },
    outline(d) { return [[0, 'SONG'], [1, 'PATTERN · ' + (d.name || 'clip'), 'pattern']].concat((d.notes || []).map((a, i) => [2, (i === (d.sel | 0) ? '▸ ' : '') + (d.drums ? 'pad ' + a.n : nameOf(a.n)) + ' @ ' + a.s, i === (d.sel | 0) ? 'timing' : null])); },
    status(d) { const a = noteOf(d); return [['NOTES', (d.notes || []).length]].concat(a ? [['OPEN', d.drums ? 'pad ' + a.n : nameOf(a.n)], ['VEL', Math.round(a.v * 127)]] : []); },
    // the view: the pattern along the top (pattern scale: click a note to open it), the open note large below (note scale: its pitch curve)
    draw(g, W, H, d, o) {
      const ns = d.notes || [], a = noteOf(d), top = Math.round(H * 0.32);
      if (shapeAt(d) && a) return drawShape(g, W, H, d, a, top, o || {});
      g.fillStyle = '#0a0b0d'; g.fillRect(0, 0, W, H);
      if (!ns.length) { g.fillStyle = '#7f93a8'; g.font = '13px sans-serif'; g.fillText('No notes in this clip', 16, 24); return; }
      const end = Math.max(16, ...ns.map(x => x.s + x.l)), lo = Math.min(...ns.map(x => x.n)) - 1, hi = Math.max(...ns.map(x => x.n)) + 1;
      const X = (s) => 10 + (s / end) * (W - 20), Y = (n) => 44 + (1 - (n - lo) / Math.max(1, hi - lo)) * (top - 56);
      g.strokeStyle = '#1c2026'; g.beginPath(); g.moveTo(0, top); g.lineTo(W, top); g.stroke();
      ns.forEach((x, i) => { g.fillStyle = i === (d.sel | 0) ? '#00d4ff' : 'rgba(0,212,255,0.35)'; g.fillRect(X(x.s), Y(x.n) - 3, Math.max(3, X(x.s + x.l) - X(x.s) - 1), 6); });
      if (!a) return;
      // the open note: its length across the width, its pitch curve in semitones around it (bend + oscillation), velocity as its weight
      // the view holds the note's curve and every chord voice above or below it
      const cs = [0, 0.1, 0.25, 0.4, 0.5, 0.6, 0.75, 0.9, 1].map(t => curve(a, t)), ivs = [0].concat((a.x && a.x.iv) || []);
      const vLo = Math.min(...cs) + Math.min(...ivs), vHi = Math.max(...cs) + Math.max(...ivs), pad = Math.max(2, (vHi - vLo) * 0.12), lo2 = Math.min(vLo - pad, -2), hi2 = Math.max(vHi + pad, 2);
      const k = (H - top - 40) / (hi2 - lo2), y0 = top + 28 + hi2 * k;
      g.strokeStyle = '#1c2026'; g.beginPath(); g.moveTo(16, y0); g.lineTo(W - 16, y0); g.stroke();
      g.fillStyle = '#7f93a8'; g.font = '12px sans-serif'; g.fillText((d.drums ? 'pad ' + a.n : nameOf(a.n)) + ' · ' + a.l + ' sixteenths · velocity ' + Math.round(a.v * 127), 16, top + 18);
      g.strokeStyle = '#00d4ff'; g.lineWidth = 1 + 4 * a.v; g.beginPath();
      for (let p = 0; p <= 200; p++) { const t = p / 200, x = 16 + t * (W - 32), y = y0 - curve(a, t) * k; if (p) g.lineTo(x, y); else g.moveTo(x, y); }
      g.stroke(); g.lineWidth = 1;
      // how it plays: the chord's voices (their own lines, as far apart as they sound), the ratchet's hits, when it plays
      const xx = a.x || {}, strumW = xx.strum ? Math.min(0.2, xx.strum / 1000 / Math.max(0.1, a.l / 4 * 0.5)) : 0;
      (xx.iv || []).forEach((iv, vi) => { g.strokeStyle = 'rgba(255,79,216,' + (0.75 - 0.08 * vi) + ')'; g.lineWidth = 1 + 3 * a.v * (1 - (xx.fall || 0) * (vi + 1)); g.beginPath();
        for (let p = 0; p <= 120; p++) { const t = p / 120, x = 16 + (strumW * (vi + 1) + t * (1 - strumW * (vi + 1))) * (W - 32), y = y0 - (curve(a, t) + iv) * k; if (y < top + 24 || y > H - 6) { g.moveTo(x, Math.max(top + 24, Math.min(H - 6, y))); continue; } if (p) g.lineTo(x, y); else g.moveTo(x, y); }
        g.stroke(); g.fillStyle = '#ff4fd8'; g.fillText((iv > 0 ? '+' : '') + iv + ' st', W - 52, Math.max(top + 30, Math.min(H - 8, y0 - (curve(a, 1) + iv) * k)) - 4); }); g.lineWidth = 1;
      const hits = a.rt || 1; if (hits > 1) { const at = (q) => !xx.rs ? q / hits : xx.rs === 'accel' ? Math.pow(q / hits, 0.6) : 1 - Math.pow(1 - q / hits, 0.6);
        for (let q = 0; q < hits; q++) { const vq = !xx.rv ? 1 - 0.1 * q / hits : xx.rv === 'flat' ? 1 : 0.7 + 0.3 * (q + 1) / hits; g.fillStyle = '#ffb000'; g.fillRect(16 + at(q) * (W - 32), H - 8 - 22 * vq, 3, 22 * vq); } }
      g.fillStyle = '#7f93a8'; const when = xx.cond ? (xx.cond.skip ? 'skips' : 'plays') + ' on pass ' + (xx.cond.at + 1) + ' of every ' + xx.cond.every : '';
      const hum = xx.ht || xx.hv ? 'humanize ± ' + (xx.ht || 0) + ' ms ± ' + Math.round((xx.hv || 0) * 100) + ' %' : ''; g.fillText([when, hum].filter(Boolean).join(' · '), W - 16 - g.measureText([when, hum].filter(Boolean).join(' · ')).width, top + 18);
    },
    // W3a the 3D viewport: each layer on its own plane (the kind draws it; the canvas places the plane)
    drawLayer(g, W, H, d, id, o) {
      const a = noteOf(d), lw = (o && o.wire) ? 1.2 : 2.2, col = (o && o.selected) ? '#00d4ff' : '#7fdcff';
      if (!a) return; g.shadowColor = col; g.shadowBlur = (o && o.wire) ? 0 : 8;
      const at = shapeAt(d);
      if (at) { const r = rangeOf(d, at, a), k = /^m:(\d+)$/.exec(id), sym = k || id === 'result' ? 1 : 0;
        const arr = series(a, at, id, 160); if (!arr) return;
        let lo = r.lo, hi = r.hi; if (/:(rate)$/.test(id)) { lo = 0; hi = Math.max(1, ...arr); } else if (/:(depth)$/.test(id) || k) { const mx = Math.max(1e-6, ...Array.from(arr).map(Math.abs)); lo = -mx; hi = mx; } else if (id === 'result' || id === 'base') { const mn = Math.min(...arr), mx = Math.max(...arr), pad = (mx - mn) * 0.15 || 1; lo = mn - pad; hi = mx + pad; }
        plot(g, arr, 8, 8, W - 16, H - 16, lo, hi, k ? COLORS[+k[1] % COLORS.length] : id === 'result' ? '#ffffff' : col, id === 'result' ? lw + 1 : lw, id === 'base' ? [10, 6] : null);
        g.shadowBlur = 0; return void sym; }
      if (id === 'pattern') { const ns = d.notes || [], end = Math.max(16, ...ns.map(x => x.s + x.l)), lo = Math.min(...ns.map(x => x.n)) - 1, hi = Math.max(...ns.map(x => x.n)) + 1;
        ns.forEach((x, i) => { g.fillStyle = i === (d.sel | 0) ? '#00d4ff' : 'rgba(0,212,255,0.4)'; g.fillRect(8 + x.s / end * (W - 16), 8 + (1 - (x.n - lo) / Math.max(1, hi - lo)) * (H - 24), Math.max(4, x.l / end * (W - 16) - 2), 10); }); g.shadowBlur = 0; return; }
      const T = (a.sh && a.sh.t) || {}, M = MT();
      if (id.startsWith('T:') && M && T[id.slice(2)]) { const arr = M.sample(T[id.slice(2)], 160), mn = Math.min(...arr), mx = Math.max(...arr), pad = (mx - mn) * 0.15 || 1; plot(g, arr, 8, 8, W - 16, H - 16, mn - pad, mx + pad, col, lw); g.shadowBlur = 0; return; }
      if (id === 'bend' || id === 'osc') { const arr = new Float64Array(160).map((_, i) => curve(a, i / 159)); const mx = Math.max(2, ...Array.from(arr).map(Math.abs)); plot(g, arr, 8, 8, W - 16, H - 16, -mx, mx, col, lw); g.shadowBlur = 0; return; }
      // a value: a bar as long as the value is high in its range
      const val = id === 'velocity' ? a.v : id === 'pitch' ? a.n / 127 : id === 'depth' ? (a.pr || 1) : id === 'timing' ? Math.min(1, a.l / 16) : 0.5;
      g.fillStyle = col; g.globalAlpha = (o && o.wire) ? 0.35 : 0.8; g.fillRect(8, H / 2 - 8, (W - 16) * clamp(val, 0, 1), 16); g.globalAlpha = 1; g.shadowBlur = 0;
    },
    // a drag in the view draws: the open curve's base, or — a drawn modulator selected — its wave (one cycle)
    stroke(d, pts, W, H, o) {
      const a = noteOf(d), at = shapeAt(d); if (!a || !at || pts.length < 2) return null;
      const top = Math.round(H * 0.32), y0 = top + 26, h = H - y0 - 14, sel = (o && o.selected) || '', mi = /^m:(\d+)$/.exec(sel), sig = signalAt(a, at);
      const mod = mi && sig && sig.mods[+mi[1]];
      const xs = pts.map(([x, y]) => [clamp((x - 16) / Math.max(1, W - 32), 0, 1), clamp(1 - (y - y0) / Math.max(1, h), 0, 1)]).sort((p, q) => p[0] - q[0]);
      // keep one point per 1/64 of the width (the hand's jitter out, at most 65 points)
      const binned = []; xs.forEach(([x, y]) => { const b = Math.round(x * 64) / 64; const last = binned[binned.length - 1]; if (last && last[0] === b) last[1] = (last[1] + y) / 2; else binned.push([b, y]); });
      if (binned.length < 2) return null;
      if (mod) return { key: 'stroke', value: { wave: +mi[1], pts: binned.filter(q => q[0] < 1).map(([x, y]) => [x, Math.round((y * 2 - 1) * 1000) / 1000]) }, label: 'Draw the wave of mod ' + (+mi[1] + 1) };
      const r = viewRange(d, at, a);
      return { key: 'stroke', value: { pts: binned.map(([x, y]) => [x, Math.round((r.lo + (r.hi - r.lo) * y) * 1000) / 1000]) }, label: 'Draw ' + atLabel(d, at, a) };
    },
    // a click on the pattern strip opens that note (the zoom from pattern scale to note scale)
    pick(d, x, y, W, H) {
      const ns = d.notes || [], top = Math.round(H * 0.32); if (!ns.length || y > top) return null;
      const end = Math.max(16, ...ns.map(q => q.s + q.l)), s = ((x - 10) / (W - 20)) * end;
      let best = -1, bd = 1e9; ns.forEach((q, i) => { const dd = s < q.s ? q.s - s : s > q.s + q.l ? s - q.s - q.l : 0; if (dd < bd) { bd = dd; best = i; } });
      return best >= 0 && best !== (d.sel | 0) ? { key: 'sel', value: best + 1, label: 'Open note' } : null;
    },
  };
  function ensure() { const W = global.Workshop; if (!W) return false; if (W.kinds().includes(KIND.id)) return true; const r = W.addKind(KIND); if (!r.ok) console.error('Timeline: the Workshop refused the notes kind —', r.problems.join('; ')); return r.ok; }
  global.EravosTimelineWorkshop = { KIND, ensure, curve, bind };
})(typeof window !== 'undefined' ? window : globalThis);
