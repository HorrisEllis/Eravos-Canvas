/* ERAVOS Song Engine (3.27) — music that makes music.
 * A genre is DATA (tempo range, keys, progressions, instruments + presets, drum grammar, bass/chord/lead styles,
 * song form). The engine turns a genre + a seed into a recipe: every run is a new, finished song written as
 * instrument tracks on the Timeline (editable in the piano roll), in key, with markers per section.
 * Add a genre (a pack can do this too):  SongEngine.addGenre({ id, label, … })  → it appears on the Start screen.
 * Same song again:                        SongEngine.write('synthwave', 4242)  (the seed is in the song name). */
(function () {
  'use strict';
  const R = window.Recipes;
  if (!R) return;
  const genres = new Map();

  // ---------------------------------------------------------------- seeded randomness (mulberry32)
  function rng(seed) { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  const pick = (r, a) => a[Math.floor(r() * a.length) % a.length];
  const VEL = { X: 1, x: 0.8, o: 0.45 };
  const PAD = { kick: 0, snare: 1, clap: 2, hat: 3, ohat: 4, b808: 5, rim: 6, tom: 7, crash: 8, perc: 9, shaker: 10, cowbell: 11 };

  // ---------------------------------------------------------------- drums
  function drumBar(G, r, mode, bar, bars, energy) {
    const n = [], hit = (s, pad, v, l) => n.push({ s, l: l || 1, n: 36 + pad, v: Math.max(0.05, Math.min(1, v)) });
    if (mode === 'none') return n;
    if (mode === 'build') { // snare roll that doubles every quarter of the build, rising
      const q = Math.min(3, Math.floor(bar / Math.max(1, bars / 4))), div = [4, 2, 1, 1][q];
      for (let s = 0; s < 16; s += div) hit(s, PAD.snare, 0.35 + 0.6 * (bar * 16 + s) / (bars * 16));
      if (q < 2) for (let s = 0; s < 16; s += 4) hit(s, PAD.kick, 0.9);
      return n;
    }
    const pat = (G.drums && G.drums[mode]) || G.drums.main;
    Object.keys(pat).forEach(lane => {
      const str = pat[lane].replace(/\|/g, ''), pad = PAD[lane];
      for (let s = 0; s < 16; s++) { const c = str[s % str.length]; if (VEL[c]) hit(s, pad, VEL[c] * (0.85 + 0.15 * energy)); }
    });
    // variation: ghost hats + the odd extra kick, seeded
    if (mode !== 'light') for (let s = 1; s < 16; s += 2) if (r() < 0.12 * energy) hit(s, PAD.hat, 0.35);
    if (r() < 0.25 && mode === 'main') hit(pick(r, [7, 11, 14]), PAD.kick, 0.7);
    // last bar of a section: a fill into the next one
    if (bar === bars - 1 && bars >= 4) for (let s = 12; s < 16; s++) hit(s, s % 2 ? PAD.snare : PAD.clap, 0.6 + (s - 12) * 0.1);
    return n;
  }

  // ---------------------------------------------------------------- pitched parts (always in key)
  function bassBar(style, deg, key, r, bar) {
    const MT = window.MusicTheory, root = (o) => MT.degreeToMidi(deg, o, key.root, key.scale), n = [], N = (s, l, m, v) => n.push({ s, l, n: m, v: v || 0.95 });
    const lo = root(1), hi = root(2);
    switch (style) {
      case 'half':    N(0, 6, lo); N(8, 3, lo, 0.85); if (r() < 0.6) N(12, 3, r() < 0.5 ? hi : lo, 0.8); break;   // dubstep / riddim / melodic
      case 'stutter': [0, 3, 6, 8, 11, 14].forEach((s, i) => N(s, i === 0 ? 3 : 2, i % 3 === 2 ? hi : lo, i ? 0.8 : 1)); break;
      case 'roll':    [0, 3, 6, 10, 12, 14].forEach((s, i) => N(s, 2, i === 3 && r() < 0.5 ? hi : lo, i ? 0.8 : 1)); break; // dnb
      case 'offbeat': [2, 6, 10, 14].forEach(s => N(s, 2, lo, 0.9)); if (r() < 0.4) N(15, 1, hi, 0.6); break;              // house
      case 'pulse8':  for (let s = 0; s < 16; s += 2) N(s, 1.5, s === 8 || s === 14 ? hi : lo, s % 4 ? 0.75 : 0.95); break; // synthwave
      case 'acid': { const sc = [0, 0, 2, 4, 7, -3]; for (let s = 0; s < 16; s++) if (r() < 0.62 || s % 4 === 0) n.push({ s, l: r() < 0.25 ? 2 : 1, n: MT.degreeToMidi(deg + pick(r, sc), 2, key.root, key.scale) + (r() < 0.2 ? 12 : 0), v: s % 4 === 0 || r() < 0.25 ? 1 : 0.7 }); break; }
      case '808':     N(0, 7, lo); if (r() < 0.7) N(7, 3, lo, 0.85); N(10, 6, r() < 0.3 ? hi : lo, 0.9); break;               // trap
      case 'drone':   N(0, 16, lo, 0.8); break;
      case 'onedrop': { const f = MT.degreeToMidi(deg + 4, 1, key.root, key.scale); N(0, 3, lo); N(4, 2, lo, 0.8); N(6, 2, MT.degreeToMidi(deg + 2, 1, key.root, key.scale), 0.8); if (r() < 0.6) N(10, 2, f, 0.75); N(12, 3, MT.degreeToMidi(deg + 4, 1, key.root, key.scale), 0.85); break; } // reggae: root, walk up, rest on beat 3
      case 'psy':     for (let s = 0; s < 16; s++) if (s % 4) N(s, 0.9, s % 4 === 3 && r() < 0.3 ? hi : lo, s % 4 === 2 ? 0.9 : 0.75); break; // rolling 16ths between the kicks (psytrance, tech house)
      case 'gallop':  for (let s = 0; s < 16; s += 4) { N(s + 2, 1, lo, 0.9); N(s + 3, 1, lo, 0.7); } break;                           // hardstyle / big room off-beat punch
      case 'dembow':  [0, 3, 6, 8, 11, 14].forEach((s, i) => N(s, i === 2 || i === 5 ? 2 : 3, i === 4 && r() < 0.5 ? hi : lo, i % 3 ? 0.85 : 1)); break; // 3-3-2 dancehall
      default:        for (let s = 0; s < 16; s += 2) N(s, 1.75, lo, s % 4 ? 0.8 : 1);
    }
    return n;
  }
  const FUTURE = [[0, 3], [3, 3], [6, 2], [8, 2], [10, 2], [12, 3.5]];
  function chordBar(style, deg, key, voicing, oct) {
    const MT = window.MusicTheory, ch = MT.chord(deg, key.root, key.scale, voicing || 'triad', oct || 4), n = [];
    switch (style) {
      case 'stab':   [2, 6, 10, 14].forEach(s => ch.forEach(m => n.push({ s, l: 1, n: m, v: 0.85 }))); break;
      case 'future': FUTURE.forEach(([s, l], i) => ch.forEach(m => n.push({ s, l, n: m, v: i ? 0.8 : 0.95 }))); break;
      case 'arp':    for (let s = 0; s < 16; s++) n.push({ s, l: 0.9, n: ch[s % ch.length] + (Math.floor(s / ch.length) % 2 ? 12 : 0), v: s % 4 ? 0.65 : 0.9 }); break;
      case 'pluck':  for (let e = 0; e < 8; e++) n.push({ s: e * 2, l: 1.5, n: ch[e % ch.length] + (e >= ch.length && e % 2 ? 12 : 0), v: e % 2 ? 0.7 : 0.9 }); break;
      case 'skank':  [4, 12].forEach(s => ch.forEach(m => n.push({ s, l: 1, n: m, v: 0.85 }))); break;                       // reggae: chops on 2 and 4
      case 'bubble': for (let e = 0; e < 8; e++) n.push({ s: e * 2 + 1, l: 0.8, n: e % 2 ? ch[ch.length - 1] : ch[0] - 12, v: e % 2 ? 0.7 : 0.55 }); break; // organ bubble on the off-beats
      case 'pulse':  for (let s = 0; s < 16; s += 2) ch.forEach(m => n.push({ s, l: 1.2, n: m, v: s % 4 ? 0.6 : 0.8 })); break;
      default:       ch.forEach(m => n.push({ s: 0, l: 16, n: m, v: 0.75 }));
    }
    return n;
  }
  // a 2-bar motif on chord tones, repeated with a changed answer — melodies that sound written, not random
  const RHYTHMS = {
    anthem: [[0, 3], [3, 3], [6, 2], [8, 4], [12, 2], [14, 2]],
    pluck:  [[0, 1], [2, 1], [3, 1], [6, 2], [8, 1], [10, 2], [12, 1], [14, 2]],
    sparse: [[0, 6], [8, 2], [10, 6]],
    synth:  [[0, 2], [2, 2], [4, 4], [8, 2], [10, 2], [12, 4]],
  };
  function makeMotif(r, rhythm) {
    const steps = [0, 2, 4, 7], bars = [];
    for (let b = 0; b < 2; b++) bars.push(RHYTHMS[rhythm].map(([s, l]) => ({ s, l, off: pick(r, steps), v: 0.8 + r() * 0.2 })).filter(() => r() > 0.12));
    return bars;
  }
  function leadBar(motif, bar, deg, key, r, oct) {
    const MT = window.MusicTheory, m = motif[bar % 2];
    return m.map((x, i) => {
      let off = x.off; if (bar % 4 === 3 && i === m.length - 1) off = pick(r, [0, 4, 7]); // the answer phrase lands somewhere new
      return { s: x.s, l: x.l, n: MT.degreeToMidi(deg + off, oct || 5, key.root, key.scale), v: x.v };
    });
  }

  // ---------------------------------------------------------------- genre → recipe steps
  const SIZE = { w: 500, h: 460 };
  // ---------------------------------------------------------------- 3.73 movement: notes that curve
  // James, 2026-10-24: "the patterns. Why do barely any of them curve?" — of 183 464 notes the 85 genres wrote, none had a per-note
  // curve and 218 had a bend: the curves came later and nothing wrote them. Now every melodic part plays with movement, chosen by its
  // role and the section — its filter opens, its growl builds, it talks, it dives at the end of a drop, a lead glides in — as curved
  // per-note curves (Bézier arcs) on the tool's own filter / drive / wobble knobs, and bends. Centred on the part's preset (its own
  // sound, moved). Seeded apart from the song's random numbers: the notes are exactly the same as before, only their movement is new.
  // A genre turns it off with curve: false, a part with P.curve === false; a note the genre already shaped (c / b) is kept.
  const KNOB_RE = { filter: /^cutoff$|cutoff|bright|tone|freq|tilt|morph|fmIndex/i, drive: /drive|grit|fold|crush|dist|shaper/i, wobble: /^depth$|depth|wobble/i };
  function knobsFor(organism, presetName) {
    const d = window.OrganismFactory && window.OrganismFactory.def(organism); if (!d) return {};
    const ks = (d.config || []).filter(c => (c.type === 'number') && !c.hidden && !c.perform && c.max > c.min);
    const pre = (presetName && d.presets && d.presets[presetName] && (d.presets[presetName].params || d.presets[presetName])) || {};
    const out = {};
    Object.keys(KNOB_RE).forEach(role => { const k = ks.find(c => KNOB_RE[role].test(c.key)) || ks.find(c => KNOB_RE[role].test(c.label || '')); if (k) out[role] = { k, v: typeof pre[k.key] === 'number' ? pre[k.key] : k.default }; });
    return out;
  }
  const isLog = (k) => k.unit === 'Hz' && k.min > 0 && k.max / k.min >= 20;
  const toF = (k, v) => isLog(k) ? Math.log(Math.max(k.min, v) / k.min) / Math.log(k.max / k.min) : (v - k.min) / (k.max - k.min);
  const fromF = (k, f) => { f = Math.max(0, Math.min(1, f)); const v = isLog(k) ? k.min * Math.pow(k.max / k.min, f) : k.min + f * (k.max - k.min); return Math.round(v * 1000) / 1000; };
  // a move: per role, points [t 0…1, offset −1…1 from the knob's own place, handle?: [hx 0…1 along the segment, offset]] — handles make arcs
  const MOVES = {
    open:   { filter: [[0, -0.35], [1, 0.35, [0.8, -0.3]]] },                                   // opens late, a rising arc
    swell:  { filter: [[0, -0.3], [0.55, 0.25, [0.5, -0.25]], [1, -0.05, [0.4, 0.3]]] },         // breathes in and back
    pluck:  { filter: [[0, 0.35], [0.35, -0.2, [0.1, -0.15]], [1, -0.3]] },                     // bright attack, falls away fast
    growl:  { drive: [[0, -0.25], [1, 0.4, [0.75, -0.2]]], filter: [[0, -0.2], [1, 0.3, [0.7, -0.15]]] },
    talk:   { filter: [[0, -0.3], [0.25, 0.3, [0.5, 0.45]], [0.5, -0.3, [0.5, -0.45]], [0.75, 0.3, [0.5, 0.45]], [1, -0.3, [0.5, -0.45]]] },
    deepen: { wobble: [[0, -0.3], [1, 0.4, [0.75, -0.25]]] },
    dive:   { filter: [[0, 0.25], [1, -0.45, [0.25, 0.3]]] },
  };
  function moveCurves(name, K, span) {
    const m = MOVES[name], c = {}; if (!m) return null;
    Object.keys(m).forEach(role => {
      const x = K[role]; if (!x) return; const f0 = Math.max(0.12, Math.min(0.88, toF(x.k, x.v)));
      c[x.k.key] = m[role].map(([t, o, hd]) => { const pt = [t, fromF(x.k, f0 + o * span)]; if (hd) pt.push([hd[0], fromF(x.k, f0 + hd[1] * span)]); return pt; });
    });
    return Object.keys(c).length ? c : null;
  }
  function shapeNotes(notes, P, K, kind, e, rr, last) {
    if (P.role === 'drums' || P.curve === false || !notes.length) return;
    const pickW = (opts) => { const tot = opts.reduce((a, o) => a + o[1], 0); let x = rr() * tot; for (const o of opts) { if ((x -= o[1]) <= 0) return o[0]; } return opts[0][0]; };
    const span = 0.55 + 0.35 * e, hot = kind === 'drop' || kind === 'chorus', byStart = new Map();
    notes.forEach(n => { const g = byStart.get(n.s) || []; g.push(n); byStart.set(n.s, g); });   // a chord moves as one (they share the knob)
    const starts = Array.from(byStart.keys()).sort((a, b) => a - b), lastS = starts[starts.length - 1];
    starts.forEach(s0 => {
      const grp = byStart.get(s0), L = Math.max(...grp.map(n => n.l)); if (grp.some(n => n.c)) return;
      let mv = null, bend = null;
      if (P.role === 'bass') {
        if (hot && s0 === lastS && last && rr() < 0.75) { mv = 'dive'; bend = { from: 0, to: -12, shape: 'late', at: 0.45 }; }
        else if (L >= 2 && rr() < (hot ? 0.7 : kind === 'build' ? 0.6 : 0.3)) mv = L < 4 ? pickW([['pluck', 2], ['growl', hot ? 2 : 0], ['open', 1]]) : hot ? pickW([['growl', 3], ['talk', 2], ['open', 1], ['deepen', K.wobble ? 2 : 0]]) : kind === 'build' ? 'open' : pickW([['open', 2], ['swell', 1]]);
      } else if (P.role === 'chords') {
        if (L >= 8 && rr() < (hot ? 0.45 : 0.65)) mv = hot ? pickW([['pluck', 2], ['open', 1]]) : pickW([['swell', 3], ['open', 2]]);
        else if (rr() < (hot ? 0.4 : 0.25)) mv = 'pluck';   // a stab: a filter snap
      } else {   // lead, arp and the genre's own parts
        if (L >= 2 && rr() < (hot ? 0.35 : 0.25)) bend = { from: pickW([[-2, 3], [-1, 2], [-12, hot ? 1 : 0], [2, 1]]), to: 0, shape: 'early', at: 0 };
        if (rr() < 0.4) mv = L < 4 ? 'pluck' : pickW([['pluck', 2], ['open', 2], ['swell', L >= 8 ? 2 : 0]]);
      }
      const c = mv ? moveCurves(mv, K, span) : null;
      grp.forEach(n => { if (c) n.c = JSON.parse(JSON.stringify(c)); if (bend && !n.b) n.b = Object.assign({}, bend); });
    });
  }
  // X (optional, 3.34.1 — used by RhythmExpand): { name, form:[sections], bar(ctx) → notes[] | null } — a caller can supply its own form and
  // write a part's bar itself (null = the genre's own bar). Without X nothing here changes: same seed → the same song as before.
  function generate(G, seed, X) {
    const r = rng(seed), bpm = G.bpm[0] + Math.round(r() * (G.bpm[1] - G.bpm[0]));
    const key = { root: pick(r, G.roots), scale: pick(r, G.scales || ['minor']) };
    const prog = pick(r, G.progs), energyOf = { intro: 0.4, build: 0.7, drop: 1, break: 0.3, outro: 0.5, verse: 0.6, chorus: 0.9 };
    const name = (X && X.name) || `${G.label} #${seed}`, form = (X && X.form) || G.form;
    const steps = [
      { op: 'bpm', bpm },
      { op: 'mount', organism: 'eravos.session', as: 'session', at: [0, 0], size: [400, 540] },
      { op: 'configure', target: 'session', params: { songName: name, root: key.root, scale: key.scale, bpm, autoLength: true } },
      { op: 'mount', organism: 'eravos.timeline', as: 'tl', at: [420, 0], size: [1180, 640] },
    ];
    const parts = Object.keys(G.parts);
    // lay windows out by their real sizes (4 per row) so nothing overlaps; tall tools grow to fit, so rows get headroom
    const sz = (org) => { const d = window.OrganismFactory && window.OrganismFactory.def(org); return (d && d.size) || SIZE; };
    let cx = 0, cy = 680, rowH = 0, col = 0;
    const place = (org) => { const z = sz(org); if (col === 4) { cx = 0; cy += rowH + 120; rowH = 0; col = 0; } const at = [cx, cy]; cx += z.w + 30; rowH = Math.max(rowH, z.h); col++; return at; };
    const presetOf = {};
    parts.forEach((p) => {
      const P = G.parts[p], preset = Array.isArray(P.preset) ? pick(r, P.preset) : P.preset; presetOf[p] = preset;
      steps.push({ op: 'mount', organism: P.organism, as: p, at: place(P.organism), preset });
      if (P.configure) steps.push({ op: 'configure', target: p, params: P.configure });
      steps.push({ op: 'event', target: 'tl', topic: 'lane_add', payload: { kind: 'inst', target: '@' + p, name: P.name || p } });
    });
    (G.fx || []).forEach((f, i) => {
      if (i === 0) col = 4;                      // effects start their own row under the instruments
      steps.push({ op: 'mount', organism: f.organism, as: 'fx' + i, at: place(f.organism), preset: Array.isArray(f.preset) ? pick(r, f.preset) : f.preset });
      steps.push({ op: 'patch', from: f.on, to: 'fx' + i });
    });
    // 3.40: modulators and followers — tools with no lane of their own. A mod with `to` + `key` is wired from its first
    // violet output into that tool's violet input (Wub Rate → Wub Filter's "wub"); without `to` it is just mounted
    // (Wub Sub follows the Wub Osc's notes by itself). Genres without mods are untouched (same seed → same song).
    (G.mods || []).forEach((m, i) => {
      steps.push({ op: 'mount', organism: m.organism, as: 'mod' + i, at: place(m.organism), preset: Array.isArray(m.preset) ? pick(r, m.preset) : m.preset });
      if (m.configure) steps.push({ op: 'configure', target: 'mod' + i, params: m.configure });
      if (m.to) steps.push({ op: 'modulate', from: 'mod' + i, to: m.to, key: m.key });
      if (m.wireFrom) steps.push({ op: 'wire', from: m.wireFrom, to: ['mod' + i, m.wireTo] });   // e.g. Clip Maker's clips → this Sample
      if (m.into) steps.push({ op: 'wire', from: ['mod' + i, m.out], to: m.into });                // 3.44: this tool → a part's input (Morph Osc → Morph Osc's FM in)
    });
    // 3.62: a genre can wire one part into another (G.wires: [[from, hook], [to, hook]] — the Arp's notes out → the synth it plays).
    // Both ends are parts, so both have a lane: the synth's lane carries its curves (filter …). Genres without it are untouched.
    (G.wires || []).forEach(([from, to]) => { if (G.parts[from[0]] && G.parts[to[0]]) steps.push({ op: 'wire', from, to }); });
    // form → markers + clips
    let bar = 1; const motif = makeMotif(r, G.leadRhythm || 'anthem');
    form.forEach(sec => {
      const kind = sec.kind || sec.name.replace(/\s*\d+$/, ''), e = energyOf[kind] !== undefined ? energyOf[kind] : 0.7;
      steps.push({ op: 'event', target: 'tl', topic: 'marker_edit', payload: { op: 'add', bar, name: sec.name } });
      const plays = sec.play;
      parts.forEach(p => {
        const P = G.parts[p]; if (!plays.includes(p)) return;
        const notes = [];
        const nextIsDrop = G.impact !== false && form[form.indexOf(sec) + 1] && (form[form.indexOf(sec) + 1].kind || form[form.indexOf(sec) + 1].name).replace(/\s*\d+$/, '') === 'drop';
        for (let b = 0; b < sec.bars; b++) {
          const deg = prog[b % prog.length], o = b * 16, add = (arr) => arr.forEach(x => notes.push(Object.assign({}, x, { s: x.s + o })));
          // 3.34.2: a genre can write its own bars too (G.bar) — same contract as X.bar; X wins, then the genre, then the stock bar below
          const cx = { role: P.role, P, sec, kind, b, deg, r, e, key, prog, partKey: p, motif, G, seed };   // 3.70: the seed too (a genre may pick a move per song)
          let own = X && X.bar ? X.bar(cx) : null;
          if (!own && G.bar) own = G.bar(cx);
          if (own) add(own);
          else if (P.role === 'drums') add(drumBar(G, r, sec.drums || (kind === 'drop' || kind === 'chorus' ? 'main' : kind === 'build' ? 'build' : 'light'), b, sec.bars, e));
          else if (P.role === 'bass') add(bassBar(sec.bassStyle || P.style, deg, key, r, b));
          else if (P.role === 'chords') add(chordBar(sec.chordStyle || P.style, deg, key, P.voicing, P.octave));
          else if (P.role === 'lead') add(leadBar(motif, b, deg, key, r, P.octave));
          if (P.role === 'drums' && kind === 'drop' && b === 0 && G.impact !== false) add([{ s: 0, l: 4, n: 36 + PAD.crash, v: 1 }, { s: 0, l: 1, n: 36 + PAD.kick, v: 1 }]);
        }
        // the gap: everything stops half a beat before the drop, so the drop hits out of silence (the head-shake)
        if (nextIsDrop) { const cut = (sec.bars - 1) * 16 + 14; for (let i = notes.length - 1; i >= 0; i--) { const x = notes[i]; if (x.s >= cut) notes.splice(i, 1); else if (x.s + x.l > cut) x.l = cut - x.s; } }
        // 3.73 movement (see shapeNotes): its own random numbers, so the song's notes stay exactly what they were
        if (G.curve !== false) { const hs = (str) => { let x = 2166136261; for (const ch of str) x = Math.imul(x ^ ch.charCodeAt(0), 16777619); return x >>> 0; };
          shapeNotes(notes, P, knobsFor(P.organism, presetOf[p]), kind, e, rng((seed * 2654435761 ^ hs(p + '|' + sec.name + '|' + bar)) >>> 0), !nextIsDrop); }
        // 3.62: a part with `repeat` writes one turn of the progression and lets the clip repeat it (⟳ Repeat every) — only when every
        // turn is the same notes; a section whose last bar differs (the gap before a drop, a fill) is written out in full, as before
        let loop = 0;
        if (P.repeat && notes.length) {
          const L = prog.length * 16, total = sec.bars * 16, key = (n) => [n.s % L, n.l, n.n, n.v, JSON.stringify(n.b || null), JSON.stringify(n.p || null), JSON.stringify(n.c || null)].join('|');
          if (total > L && total % L === 0) { const first = notes.filter(n => n.s < L), sig = first.map(key).sort().join(';'), same = Array.from({ length: total / L }, (_, k) => notes.filter(n => n.s >= k * L && n.s < (k + 1) * L && n.s + n.l <= (k + 1) * L + 1e-9).map(key).sort().join(';')).every(x => x === sig) && notes.every(n => Math.floor(n.s / L) === Math.floor((n.s + n.l - 1e-9) / L));
            if (same) { loop = L; notes.splice(0, notes.length, ...first); } }
        }
        if (notes.length) steps.push({ op: 'event', target: 'tl', topic: 'clip_add', payload: Object.assign({ kind: 'notes', target: '@' + p, startBar: bar, bars: sec.bars, name: `${P.name || p} · ${sec.name}`, notes }, loop ? { loop } : {}) });
      });
      bar += sec.bars;
    });
    // 3.59: a genre with `curves` writes curve lanes too (a Pitch riser into the drop, a filter that opens, a wobble that speeds up):
    // G.curves(sections, r) → [{ part, key, points: [[bar, value]…], osc? }]. Genres without it are untouched.
    if (G.curves) {
      let b = 1; const sections = form.map(sec => { const x = { name: sec.name, kind: sec.kind || sec.name.replace(/\s*\d+$/, ''), bar: b, bars: sec.bars }; b += sec.bars; return x; });
      (G.curves(sections, r, { key, prog, bpm, seed }) || []).forEach(c => { if (!G.parts[c.part]) return;
        steps.push({ op: 'event', target: 'tl', topic: 'lane_add', payload: Object.assign({ kind: 'auto', target: '@' + c.part, key: c.key, points: c.points, name: c.name }, c.osc ? { osc: c.osc } : {}) }); });
    }
    // 3.41: a genre with `voice` sings with her recordings (data/her-voice.js): the timeline's audio goes through a vocal
    // chain (EQ → level), then her phrases are laid on the timeline by section. Genres without it are untouched.
    if (G.voice) {
      steps.push({ op: 'mount', organism: 'eravos.fx-eq', as: 'voxEq', at: place('eravos.fx-eq'), preset: 'Vocal Clarity' }, { op: 'patch', from: 'tl', to: 'voxEq' });
      steps.push({ op: 'mount', organism: 'eravos.fx-dynamics', as: 'voxLvl', at: place('eravos.fx-dynamics'), preset: 'Vocal Level' }, { op: 'patch', from: 'voxEq', to: 'voxLvl' });
      let b = 1; const sections = form.map(sec => { const s = { name: sec.name, kind: sec.kind || sec.name.replace(/\s*\d+$/, ''), bar: b, bars: sec.bars }; b += sec.bars; return s; });
      steps.push({ op: 'her_voice', target: 'tl', out: 'voxLvl', sections, bpm, seed });
    }
    if (G.master) { steps.push({ op: 'mount', organism: 'eravos.master-fx', as: 'master', at: [1620, 0], size: [640, 440], reuse: true }); steps.push({ op: 'configure', target: 'master', params: G.master }); }
    return steps;
  }

  // ---------------------------------------------------------------- recipe op: patch A's sound into B (first audio out → first audio in)
  R.defineOp('patch', (st, c) => {
    const K = c.K, a = c.alias[st.from] || st.from, b = c.alias[st.to] || st.to;
    const ra = K.registry.get(a), rb = K.registry.get(b); if (!ra || !rb) return;
    const out = Array.from(ra.hooks.values()).find(h => h.wire_type === 'audio' && h.direction === 'out');
    const inn = Array.from(rb.hooks.values()).find(h => h.wire_type === 'audio' && h.direction === 'in');
    if (out && inn) K.wires.register({ src: { instanceId: a, hookId: out.hook_id }, dst: { instanceId: b, hookId: inn.hook_id } });
  });

  // ---------------------------------------------------------------- recipe op: modulate B's knob `key` from A (first violet out → B's mod.<key>)
  R.defineOp('modulate', (st, c) => {
    const K = c.K, a = c.alias[st.from] || st.from, b = c.alias[st.to] || st.to;
    const ra = K.registry.get(a), rb = K.registry.get(b); if (!ra || !rb) return;
    const out = Array.from(ra.hooks.values()).find(h => h.wire_type === 'modulation' && h.direction === 'out');
    const inn = Array.from(rb.hooks.values()).find(h => h.wire_type === 'modulation' && h.direction === 'in' && (h.mod_key === st.key || h.port === 'mod.' + st.key));
    if (!out || !inn) { K.fault('MOUNT_005', { message: `modulate: ${ra.organism_id} has no violet output or ${rb.organism_id} has no "${st.key}" input` }); return; }
    K.wires.register({ src: { instanceId: a, hookId: out.hook_id }, dst: { instanceId: b, hookId: inn.hook_id } });
  });

  // ---------------------------------------------------------------- registration: one Start card per genre, a new seed every press
  function addGenre(G) {
    genres.set(G.id, G);
    const rec = {
      id: 'eravos.recipe.engine.' + G.id, label: G.label, icon: G.icon || '✦', accent: G.accent || '#00d4ff', genome: 'eravos.genome.music',
      section: 'SONG ENGINE — every press writes a new song', tagline: G.tagline || '',
      hidden: true, // 3.34: every song lives behind ONE button — 📖 Songs (the Songbook writes these); not on the Start screen
      _seed: G.seed || 1, _shift: null,
      get steps() { return reshape(generate(G, this._seed), this._shift); },
    };
    R.register(rec);
  }
  R.onBeforeRun((r) => { if (r && /^eravos\.recipe\.engine\./.test(r.id)) { if (r._pinned) { r._seed = r._pinned; r._pinned = 0; } else { r._seed = 1 + Math.floor(Math.random() * 99999); r._shift = null; } } });

  // 3.44 — the same song, higher / lower and faster / slower: shift = { semis: −12…+12, tempo: 0.5…1.5 (× the BPM) }.
  // Every pitched note moves by exactly `semis` (so +5 really sounds higher, it never wraps down), the song key moves with
  // it (tools that follow the key stay in it), drums keep their pads. No shift → the steps are untouched (same seed → same song).
  function reshape(steps, sh) {
    const semis = sh ? Math.max(-24, Math.min(24, Math.round(sh.semis || 0))) : 0, tempo = sh ? Math.max(0.25, Math.min(2, +sh.tempo || 1)) : 1;
    if (!semis && tempo === 1) return steps;
    const bpm = (b) => Math.max(30, Math.min(300, Math.round(b * tempo))), drums = new Set();
    steps.forEach(st => { if (st.op === 'mount' && /^eravos\.(pads|drum-forge|sequencer)$/.test(st.organism)) drums.add('@' + st.as); });
    return steps.map(st => {
      if (st.op === 'bpm') return Object.assign({}, st, { bpm: bpm(st.bpm) });
      if (st.op === 'her_voice') return Object.assign({}, st, { bpm: bpm(st.bpm) });
      if (st.op === 'configure' && st.target === 'session') {
        const p = Object.assign({}, st.params); if (p.bpm) p.bpm = bpm(p.bpm); if (typeof p.root === 'number') p.root = ((p.root + semis) % 12 + 12) % 12;
        if (p.songName) p.songName += ' (' + [semis ? (semis > 0 ? '+' : '') + semis + ' st' : '', tempo !== 1 ? Math.round(tempo * 100) + '% speed' : ''].filter(Boolean).join(' · ') + ')';
        return Object.assign({}, st, { params: p });
      }
      if (semis && st.op === 'event' && st.topic === 'clip_add' && st.payload && st.payload.kind === 'notes' && !drums.has(st.payload.target))
        return Object.assign({}, st, { payload: Object.assign({}, st.payload, { notes: st.payload.notes.map(n => Object.assign({}, n, { n: Math.max(0, Math.min(127, n.n + semis)) })) }) });
      return st;
    });
  }

  // ---------------------------------------------------------------- the genres (data)
  const half = { kick: 'X.........X.....', snare: '........X.......', clap: '........x.......', hat: '..x...x...x...x.' };
  const halfLight = { hat: 'x.o.x.o.x.o.x.o.', kick: 'X...............' };
  const four = { kick: 'X...x...x...x...', clap: '....x.......x...', hat: '..x...x...x...x.', shaker: 'oxoxoxoxoxoxoxox' };
  const fourLight = { hat: '..x...x...x...x.', kick: 'x...............' };
  const twoStep = { kick: 'X.........X.....', snare: '....X.......X...', hat: 'x.x.x.xox.x.x.xo', shaker: 'oooooooooooooooo' };
  const trap = { kick: 'X......X..X.....', snare: '........X.......', hat: 'x.x.x.x.x.xxx.x.', b808: '................', ohat: '..............x.' };
  const eighties = { kick: 'X.......X.......', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.', tom: '..............o.' };
  const FORM_DROP = (drop2) => [
    { name: 'intro', bars: 8, play: ['chords', 'drums'] },
    { name: 'build', bars: 8, play: ['chords', 'drums', 'lead'] },
    { name: 'drop', bars: 16, play: ['drums', 'bass', 'lead', 'chords'] },
    { name: 'break', bars: 8, play: ['chords', 'lead'] },
    { name: 'build 2', kind: 'build', bars: 8, play: ['chords', 'drums'] },
    { name: 'drop 2', kind: 'drop', bars: 16, play: ['drums', 'bass', 'lead', 'chords'], bassStyle: drop2 },
    { name: 'outro', bars: 8, play: ['chords', 'drums'] },
  ];
  const FORM_SONG = [
    { name: 'intro', bars: 8, play: ['chords', 'drums'] },
    { name: 'verse', bars: 16, play: ['drums', 'bass', 'chords'] },
    { name: 'chorus', bars: 16, play: ['drums', 'bass', 'chords', 'lead'] },
    { name: 'verse 2', kind: 'verse', bars: 16, play: ['drums', 'bass', 'chords', 'lead'] },
    { name: 'chorus 2', kind: 'chorus', bars: 16, play: ['drums', 'bass', 'chords', 'lead'] },
    { name: 'outro', bars: 8, play: ['chords', 'drums'] },
  ];

  [
    { id: 'dubstep', label: 'Dubstep', icon: '🔊', accent: '#ff2266', bpm: [140, 140], roots: [5, 9, 2, 7], progs: [[1, 6, 3, 7], [1, 1, 6, 7], [1, 4, 6, 5]],
      tagline: '140 half-time, wobble drop, wide pads', drums: { main: half, light: halfLight }, leadRhythm: 'sparse', form: FORM_DROP('stutter'),
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Classic Wub 1/8', 'Yoi Talker', 'Head Shaker', 'Laser Dive Wub', 'Half-time Growl 1/4t'], style: 'half', name: 'Wobble' },
        chords: { role: 'chords', organism: 'eravos.pad-forge', preset: ['Dark Choir', 'Her Essence', 'Underwater'], style: 'sustain', voicing: 'triad', octave: 4, name: 'Pad' },
        lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Festival Lead', 'Euphoric Lead'], octave: 5, name: 'Lead' } },
      master: { compThresh: -10, compRatio: 3, reverbMix: 0.15 } },
    { id: 'riddim', label: 'Riddim', icon: '🤖', accent: '#ff3355', bpm: [140, 150], roots: [5, 7, 2], progs: [[1, 1, 1, 6], [1, 1, 2, 1]],
      tagline: 'Stripped, robotic, square-wave riddim at 140–150', drums: { main: half, light: halfLight }, leadRhythm: 'sparse', form: FORM_DROP('half'),
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Riddim Square 1/16t', 'Robot 1/16 square', 'Sub Quake (-2 oct)'], style: 'stutter', name: 'Riddim' },
        chords: { role: 'chords', organism: 'eravos.pad-forge', preset: ['Dark Choir', 'Underwater'], style: 'sustain', octave: 4, name: 'Atmos' },
        lead: { role: 'lead', organism: 'eravos.bass-forge', preset: ['Laser Zap', 'Screech'], octave: 4, name: 'Zap' } },
      master: { compThresh: -10, compRatio: 3, reverbMix: 0.1 } },
    { id: 'dnb', label: 'Drum & Bass', icon: '⚡', accent: '#00ccff', bpm: [172, 176], roots: [9, 2, 4, 0], progs: [[1, 6, 4, 5], [1, 7, 6, 7], [1, 3, 6, 4]],
      tagline: 'Rolling two-step at 174, Reese underneath', drums: { main: twoStep, light: { hat: 'x.x.x.x.x.x.x.x.', shaker: 'oooooooooooooooo' } }, leadRhythm: 'pluck', form: FORM_DROP('roll'),
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'EDM Core', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.reese-bass', preset: ['Classic Reese', 'Wide Rumble', 'Colour Bass'], style: 'roll', name: 'Reese' },
        chords: { role: 'chords', organism: 'eravos.pad-forge', preset: ['Celestial Glass', 'Golden Hour Strings'], style: 'sustain', voicing: 'seventh', octave: 4, name: 'Pad' },
        lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Trance Pluck', 'Monstercat Pluck'], octave: 5, name: 'Pluck' } },
      master: { compThresh: -10, compRatio: 2.5, reverbMix: 0.18 } },
    { id: 'neuro', label: 'Neurofunk', icon: '🧠', accent: '#8844ff', bpm: [172, 174], roots: [4, 5, 2], scales: ['minor', 'phrygian'], progs: [[1, 1, 2, 1], [1, 6, 1, 7]],
      tagline: 'Dark 174, flanged neuro Reese and stabs', drums: { main: twoStep, light: { hat: 'x.x.x.x.x.x.x.x.' } }, leadRhythm: 'sparse', form: FORM_DROP('stutter'),
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.reese-bass', preset: ['Neuro Flange', 'Melodic Growl', 'Hoover-ish'], style: 'roll', name: 'Neuro' },
        chords: { role: 'chords', organism: 'eravos.retro-poly', preset: ['Darksynth Saw', 'Brass Stab \'84'], configure: { arp: 'off' }, style: 'stab', octave: 4, name: 'Stabs' },
        lead: { role: 'lead', organism: 'eravos.bass-forge', preset: ['Neuro Reese-FM', 'Screech'], octave: 4, name: 'Growl' } },
      master: { compThresh: -9, compRatio: 3, reverbMix: 0.08 } },
    { id: 'future-bass', label: 'Future Bass', icon: '🌅', accent: '#ff66cc', bpm: [145, 155], roots: [5, 0, 7, 2], progs: [[1, 6, 3, 7], [6, 7, 5, 1], [4, 6, 1, 7], [1, 5, 6, 4]],
      tagline: 'Monstercat chops, plucks, colour bass', drums: { main: { kick: 'X.........x.....', clap: '........X.......', snare: '........x.......', hat: 'x.x.x.x.x.x.x.x.', ohat: '..............x.' }, light: { hat: 'x...x...x...x...' } },
      leadRhythm: 'pluck', form: FORM_DROP('half'),
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'Future (Monstercat)', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.reese-bass', preset: ['Colour Bass', 'Warm Future Sub'], style: 'half', name: 'Colour bass' },
        chords: { role: 'chords', organism: 'eravos.supersaw', preset: ['Future Bass Chords (add9)', 'Future Bass Chords (7th)'], configure: { chordMode: 'off' }, style: 'future', voicing: 'add9', octave: 4, name: 'Chords' },
        lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Monstercat Pluck', 'Trance Pluck'], octave: 5, name: 'Pluck' } },
      fx: [{ organism: 'eravos.fx-echo', preset: 'Future Pluck Echo', on: 'lead' }],
      master: { compThresh: -10, compRatio: 2.5, reverbMix: 0.2 } },
    { id: 'melodic', label: 'Melodic Dubstep', icon: '🌌', accent: '#aa66ff', bpm: [148, 152], roots: [2, 9, 5], progs: [[6, 4, 1, 5], [1, 6, 3, 7], [4, 6, 1, 7]],
      tagline: 'Strings, euphoric lead, growling melodic drop', drums: { main: half, light: halfLight }, leadRhythm: 'anthem', form: FORM_DROP('half'),
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'Future (Monstercat)', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.reese-bass', preset: ['Melodic Growl', 'Colour Bass'], style: 'half', name: 'Growl' },
        chords: { role: 'chords', organism: 'eravos.pad-forge', preset: ['Golden Hour Strings', 'Celestial Glass', 'Her Essence'], style: 'sustain', voicing: 'add9', octave: 4, name: 'Strings' },
        lead: { role: 'lead', organism: 'eravos.supersaw', preset: ['Euphoric Lead', 'Festival Lead'], octave: 5, name: 'Lead' } },
      fx: [{ organism: 'eravos.fx-echo', preset: 'Ping-pong 1/8.', on: 'lead' }],
      master: { compThresh: -10, compRatio: 2.5, reverbMix: 0.25 } },
    { id: 'house', label: 'House', icon: '🏠', accent: '#00ff88', bpm: [122, 126], roots: [9, 0, 7, 2], scales: ['minor', 'dorian'], progs: [[1, 4, 6, 5], [1, 7, 6, 7], [1, 1, 4, 4]],
      tagline: 'Four-on-the-floor, chord stabs, off-beat bass', drums: { main: four, light: fourLight }, leadRhythm: 'synth', form: FORM_SONG,
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'EDM Core', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.sub-engine', preset: ['Garage Punch', 'Deep Sine'], style: 'offbeat', name: 'Bass' },
        chords: { role: 'chords', organism: 'eravos.supersaw', preset: ['Chord Stab (triad)', 'Sidechain Chord Pump'], configure: { chordMode: 'off' }, style: 'stab', voicing: 'seventh', octave: 4, name: 'Stabs' },
        lead: { role: 'lead', organism: 'eravos.retro-poly', preset: ['Neon Keys', 'Arp Pluck'], configure: { arp: 'off' }, octave: 5, name: 'Keys' } },
      master: { compThresh: -12, compRatio: 2, reverbMix: 0.15 } },
    { id: 'techno', label: 'Techno', icon: '⚙', accent: '#cccccc', bpm: [128, 134], roots: [9, 4, 2], scales: ['minor', 'phrygian'], progs: [[1, 1, 1, 1], [1, 1, 6, 1]],
      tagline: 'Acid line, rolling kick, dark pad', drums: { main: { kick: 'X...X...X...X...', hat: '..x...x...x...x.', rim: '...o..o....o..o.', clap: '....x.......x...' }, light: { kick: 'X...X...X...X...', hat: '..x...x...x...x.' } },
      leadRhythm: 'sparse', form: FORM_SONG.map(s => Object.assign({}, s, { play: s.play.map(p => p === 'lead' ? 'bass' : p) })),
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'EDM Core', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.acid-synth', preset: ['Hardfloor Growl', 'Phuture Squelch', 'Rolling Bassline'], style: 'acid', name: '303' },
        chords: { role: 'chords', organism: 'eravos.pad-forge', preset: ['Underwater', 'Dark Choir'], style: 'sustain', octave: 3, name: 'Pad' } },
      master: { compThresh: -12, compRatio: 2.5, reverbMix: 0.12 } },
    { id: 'trap', label: 'Trap', icon: '💎', accent: '#ffaa00', bpm: [138, 146], roots: [1, 6, 11, 4], scales: ['minor', 'harmonic_minor'], progs: [[1, 6, 4, 5], [1, 1, 6, 5], [1, 7, 6, 5]],
      tagline: 'Half-time 140, sliding 808, hat rolls', drums: { main: trap, light: { hat: 'x.x.x.x.x.x.x.x.' } }, leadRhythm: 'pluck', form: FORM_SONG,
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.sub-engine', preset: ['808 Long Slide', '808 Boom'], style: '808', name: '808' },
        chords: { role: 'chords', organism: 'eravos.pad-forge', preset: ['Dark Choir', 'Her Essence'], style: 'sustain', octave: 4, name: 'Choir' },
        lead: { role: 'lead', organism: 'eravos.retro-poly', preset: ['Arp Pluck', 'Neon Keys'], configure: { arp: 'off' }, octave: 5, name: 'Bells' } },
      master: { compThresh: -10, compRatio: 3, reverbMix: 0.15 } },
    { id: 'synthwave', label: 'Synthwave (80s)', icon: '🌆', accent: '#ff44cc', bpm: [96, 110], roots: [9, 4, 2, 7], scales: ['minor', 'dorian'], progs: [[1, 6, 3, 7], [1, 7, 6, 7], [6, 4, 1, 5]],
      tagline: 'Neon 80s: pulsing bass, Juno pads, outrun lead', drums: { main: eighties, light: { kick: 'X.......X.......', hat: 'x.x.x.x.x.x.x.x.' } }, leadRhythm: 'synth', form: FORM_SONG,
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'EDM Core', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.retro-poly', preset: 'Synthwave Bass (arp)', configure: { arp: 'off', mono: true }, style: 'pulse8', name: 'Bass' },
        chords: { role: 'chords', organism: 'eravos.retro-poly', preset: ['Nightdrive Pad', 'String Machine'], configure: { arp: 'off' }, style: 'sustain', voicing: 'seventh', octave: 4, name: 'Pad' },
        lead: { role: 'lead', organism: 'eravos.retro-poly', preset: ['Outrun Lead', 'Brass Stab \'84'], configure: { arp: 'off' }, octave: 5, name: 'Lead' } },
      fx: [{ organism: 'eravos.fx-moddelay', preset: 'Juno Wide', on: 'chords' }, { organism: 'eravos.fx-echo', preset: 'Ping-pong 1/8.', on: 'lead' }],
      master: { compThresh: -12, compRatio: 2, reverbMix: 0.3, size: 3.5 } },
    { id: 'darkwave', label: 'Darkwave (80s)', icon: '🖤', accent: '#aa2255', bpm: [112, 124], roots: [4, 9, 11], scales: ['minor', 'phrygian'], progs: [[1, 6, 7, 1], [1, 4, 6, 5], [1, 7, 6, 5]],
      tagline: 'Cold 80s: driving bass, gothic organ, brass stabs', drums: { main: eighties, light: { kick: 'X.......X.......' } }, leadRhythm: 'synth', form: FORM_SONG,
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'EDM Core', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.retro-poly', preset: 'Darksynth Saw', configure: { arp: 'off', mono: true }, style: 'pulse8', name: 'Bass' },
        chords: { role: 'chords', organism: 'eravos.organ', preset: ['Vampire Ballroom', 'Cathedral Full', 'Hanging Tree'], style: 'sustain', octave: 4, name: 'Organ' },
        lead: { role: 'lead', organism: 'eravos.retro-poly', preset: ['Brass Stab \'84', 'Outrun Lead'], configure: { arp: 'off' }, octave: 5, name: 'Lead' } },
      fx: [{ organism: 'eravos.fx-echo', preset: 'Dub Throw', on: 'lead' }],
      master: { compThresh: -12, compRatio: 2, reverbMix: 0.28 } },
    { id: 'witch-house', label: 'Witch House', icon: '🔮', accent: '#6633aa', bpm: [64, 72], roots: [1, 4, 6], scales: ['minor', 'phrygian'], progs: [[1, 6, 1, 7], [1, 2, 1, 7]],
      tagline: 'Slow, screwed choir, 808 boom, haze', drums: { main: { kick: 'X.......X.......', snare: '........X.......', hat: 'x...x...x...x...' }, light: { hat: 'x.......x.......' } }, leadRhythm: 'sparse', form: FORM_SONG,
      parts: { drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
        bass: { role: 'bass', organism: 'eravos.sub-engine', preset: ['808 Boom', 'Earthquake Drop'], style: 'drone', name: 'Boom' },
        chords: { role: 'chords', organism: 'eravos.coven', preset: ['Witch House Choir', 'Séance Pad'], style: 'sustain', octave: 4, name: 'Choir' },
        lead: { role: 'lead', organism: 'eravos.coven', preset: ['Ritual Bell', 'Crystal Coven'], octave: 5, name: 'Bell' } },
      fx: [{ organism: 'eravos.fx-haunt', preset: 'Chopped & Screwed', on: 'chords' }],
      master: { compThresh: -12, compRatio: 2, reverbMix: 0.35 } },
  ].forEach(addGenre);

  window.SongEngine = {
    styles: { bass: ['half', 'stutter', 'roll', 'offbeat', 'pulse8', 'acid', '808', 'drone', 'onedrop', 'dembow', 'psy', 'gallop'], chords: ['stab', 'future', 'arp', 'pluck', 'skank', 'bubble', 'pulse', 'sustain'] },
    addGenre, genres: () => Array.from(genres.values()), generate: (id, seed, X) => genres.has(id) ? generate(genres.get(id), seed, X) : null,
    helpers: { rng, pick, drumBar, bassBar, chordBar, leadBar, PAD },   // 3.34.1: what RhythmExpand builds on
    // same song again: SongEngine.write('synthwave', 4242)
    // o.shift = { semis, tempo } writes the same song higher / lower, faster / slower (Songs → Key · Tempo)
    write(id, seed, o) { const rec = R.get('eravos.recipe.engine.' + id); if (!rec) return null; o = Object.assign({}, o); rec._pinned = seed || 1; rec._shift = o.shift || null; delete o.shift; return R.run(rec.id, Object.assign({ clear: true, origin: { x: 30, y: 20 } }, o)); },
    reshape,
  };
})();
