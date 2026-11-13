/* ERAVOS machine songbook (3.174) — data only. His words, 2026-11-13: "6? also they sound horrible. more like floor falls out." · "considering i
 * said everything eravos could do including automation. way too shallow for how much depth ive been giving it. also stop making new
 * catagories. i told you the catagories." (2026-11-12: "lofi, synthwave, and wobblebass")
 * So: his three categories, on the shelves that already exist (🌙 Chill — lofi-*, 🌆 80s · Synth — synthwave-*, 🔊 Dubstep & Wubs — wub-*),
 * eight songs each, every one built on Floor Falls Out's arc (intro · verse · build · a one-bar PAUSE where the floor goes · a 16-bar drop ·
 * break · build · pause · drop 2 · outro) and its proven parts (stock half-time grids, a wobble that changes rate per note and speeds up into
 * the turn, the sub that dives at the phrase end, the Drop Builder underneath) — then everything ERAVOS can do, wired in:
 *   AUTOMATION   curve lanes on instruments AND on effects and modulators (3.174: the Song Engine lets curves reach fx<i> / mod<i>) — filters,
 *                pitch risers, the Arp's octaves / gate / rate, the wobble's depth swinging on an LFO, Tape Memory's wear and speed, the
 *                echo's throws, the sidechain's depth, the XY Pad's X and Y (a macro: one lane moves two knobs on two tools)
 *   MODULATION   LFOs wired (violet) into knobs · the XY Pad's X and Y into two tools · the Swarm's COHERENCE out into an echo (as the swarm
 *                locks, the echoes ring) · Tape Memory's DROPOUT out into an echo (a dropout throws an echo) · (3.174: G.routes, any out → any knob)
 *   WIRING       the Arp → a Retro DCO pluck (notes) · effects in series (tape → sidechain, grit → sidechain) · the Drop Builder
 *   NEW TOOLS    Retro DCO (bass, pluck, brass, lead, riser) · Swarm Oscillator (Growl Cloud talking in drop 2, Blooming Chord, Breathing
 *                Swarm) · Tape Memory (on keys, drums and pads — it stops the tape in the lofi pause) · Wobble Bass · Retro Poly
 *   NOTES        the Workshop's depth where it earns its place: chords from one note (strummed), a shaped dive whose stutter grows, a ratchet
 *                into the pause, ghost notes by chance, a late snare
 * Each song is its own: its seed picks its pause MOVE (four per genre), its progression and its presets. v1 (3.173, six thin songs on a shelf
 * of their own) is replaced; it is in git (fa2dad5). Original parts in the style — nothing copies a record. */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const MT = () => window.MusicTheory, SP = () => window.ShowcasePatterns;
  const PAD = SE.helpers.PAD, D = (k) => 36 + PAD[k];
  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  const FLOOR = 14, dive = (note, by) => Math.max(-24, Math.min(0, Math.max(by, FLOOR - note)));   // no dive under ~18 Hz (Floor Falls, 3.70)
  const shaped = (n, T, R) => SP() ? SP().shaped(n, T, R) : n, sig = (b, m) => SP().sig(b, m), mod = (...a) => SP().mod(...a);
  const chordFrom = (at, deg, o, tones) => { const r = at(deg, o); return { root: r, iv: tones.map(t => at(deg + t, o) - r) }; };
  const moveOf = (MOVES) => (seed) => MOVES[((Math.round(+seed) || 1) - 1) % MOVES.length];
  const merge = (out) => { const m = new Map(); out.forEach(c => { const k = c.part + '|' + c.key; if (!m.has(k)) m.set(k, Object.assign({}, c, { points: [] })); const t = m.get(k); t.points.push(...c.points); if (c.osc) t.osc = c.osc; });
    return Array.from(m.values()).map(c => Object.assign(c, { points: c.points.sort((a, b) => a[0] - b[0]) })); };
  const FORM = (pauseParts, drop1, drop2, intro, verse, build, brk, outro) => [
    S('intro', 'intro', 8, intro, { drums: 'light' }), S('verse', 'verse', 8, verse, { drums: 'light' }), S('build', 'build', 8, build),
    S('pause', 'pause', 1, pauseParts), S('drop', 'drop', 16, drop1), S('break', 'break', 8, brk, { drums: 'none' }),
    S('build 2', 'build', 8, build), S('pause 2', 'pause', 1, pauseParts), S('drop 2', 'drop', 16, drop2, { drums: 'main2' }), S('outro', 'outro', 8, outro, { drums: 'light' })];
  const DROP_DB = { kick: 'X.........x.....', snare: '........X.......', clap: '........X.......', hat: 'x.x.x.x.x.x.x.x.', ohat: '......x.......x.' };
  const DROP_DB2 = { kick: 'X.....x...x.....', snare: '........X.......', clap: '........X.......', hat: 'xxx.x.xxx.x.x.xx', perc: '...o......o..o..' };
  const LIGHT = { kick: 'X.......X.......', hat: '..x...x...x...x.' };
  const BUILD_LEAD = (at, deg, b, sec, o) => ({ s: 0, l: 16, n: at(deg + [0, 0, 2, 2, 4, 4, 5, 7][b % 8], o), v: 0.6 + 0.4 * b / Math.max(1, sec.bars - 1) });
  const BOOM = { from: 0, to: 12, shape: 'early', osc: { rate: '1/16', rateTo: '1/32', depth: 0.3, shape: 'sine', fade: 0.3 } };

  // ===================================================================================== WOBBLE BASS — wub-floor-machine (🔊)
  const WMOVES = ['falls', 'stairs', 'freefall', 'rises'], wMove = moveOf(WMOVES);
  const WBR = { depth: [0, 8], fmIndex: [0, 12], formantShift: [-24, 24], cutoff: [40, 8000] };
  function wubBar(cx) {
    const { partKey: p, kind, b, deg, key, sec, r, seed } = cx, at = (d, o) => MT().degreeToMidi(d, o, key.root, key.scale), n = [], N = (s, l, m, v, x) => n.push(Object.assign({ s, l, n: m, v: v || 0.95 }, x || {}));
    const phraseEnd = b % 4 === 3, lastBar = b === sec.bars - 1, mv = wMove(seed), alt = Math.floor((seed - 1) / 4) % 2, rot = (seed * 3) % 4;   // rot: each song its own phrase order
    if (p === 'sub') { const root = at(deg, 1);
      if (kind === 'pause') {
        if (mv === 'stairs') { [0, -3, -7, -12].forEach((st, i) => N(i * 4, 4, root + st, 1 - i * 0.05, { b: { from: 0, to: dive(root + st, i === 3 ? -12 : -3), shape: 'late', at: 0.4 } })); return n; }
        if (mv === 'rises') { N(0, 15, root, 1, { b: { from: dive(root, -24), to: 0, shape: 'late', at: 0 } }); return n; }
        N(0, 16, root, 1, { b: { from: 0, to: dive(root, -24), shape: 'late', at: 0.1 } }); return n; }
      if (kind === 'drop') { if (lastBar) { N(0, 16, root, 1, { b: { from: 0, to: dive(root, -24), shape: 'late', at: 0.35 } }); return n; }
        N(0, phraseEnd ? 16 : 10, root, 1, phraseEnd ? { b: { from: 0, to: dive(root, -12), shape: 'late', at: 0.5 } } : null); if (!phraseEnd) N(12, 4, root, 0.85); return n; }
      return null; }
    if (p === 'growl' && kind === 'drop') {   // Floor Falls Out's drop; the second half of the shelf answers in another order, and the turn's dive
      // is a Workshop shape: the fall stutters (a square modulator) and the stutter grows as it falls
      const lo = at(deg, 2), hi = at(deg + 4, 2), oct = at(deg, 3), v = (b + rot) % 4;
      if (v === 0) { N(0, 4, lo, 1, { p: { div: '1/8' } }); N(4, 2, lo, 0.9, { p: { div: '1/16' } }); N(8, 6, hi, 0.95, { p: { div: '1/8t' }, b: { from: 5, to: 0, shape: 'early' } }); }
      else if (v === 1) { N(0, 3, lo, 1, { p: { div: '1/16' } }); N(3, 3, oct, 0.9, { p: { div: '1/16' }, b: { from: 0, to: -12, shape: 'linear' } }); N(8, 8, lo, 0.95, { p: { div: '1/4t' } }); }
      else if (v === 2) { N(0, 6, lo, 1, { p: { div: '1/8t' } }); N(6, 2, hi, 0.85, { p: { div: '1/16' } }); N(8, 4, oct, 0.95, { p: { div: '1/16' }, b: { from: 7, to: 0, shape: 'early' } }); N(12, 4, lo, 0.9, { p: { div: '1/8' } }); }
      else if (!phraseEnd || !alt) N(0, 16, lo, 1, { p: { div: '1/8' }, b: { from: 0, to: lastBar ? -12 : -5, shape: 'late', at: 0.4, osc: { rate: '1/8', rateTo: '1/32', depth: 0.4, shape: 'sine' } } });
      else n.push(shaped({ s: 0, l: 16, n: lo, v: 1, p: { div: '1/8' } }, { pitch: sig([[0, 0], [0.45, 0], [1, lastBar ? -12 : -7]], [mod('square', 8, [[0, 0], [0.45, 0], [1, 1.2]])]) }));
      return n; }
    if (p === 'talk' && kind === 'drop') {   // drop 2: the Swarm (Growl Cloud) talks like Raven Drop's Reese — slides, a fifth that answers, a dive at the turn
      const lo = at(deg, 3), v = (b + rot + 1) % 4, fifth = at(deg + 4, 3), third = at(deg + 2, 3), fourth = at(deg + 3, 3);   // 3.185: scale steps, so every note is in the key (P16)
      if (v === 0) { N(0, 6, lo, 1, { b: { from: -2, to: 0, shape: 'early' } }); N(6, 2, fifth, 0.85); N(8, 8, lo, 0.95, { b: { from: 0, to: 0, osc: { rate: '1/8', depth: 0.5, shape: 'sine', fade: 0.3 } } }); }
      else if (v === 1) { N(0, 3, lo, 1); N(3, 3, third, 0.9, { b: { from: 2, to: 0, shape: 'early' } }); N(8, 8, fourth, 0.95, { b: { from: 0, to: -5, shape: 'late', at: 0.5 } }); }
      else if (v === 2) { N(0, 4, lo, 1); N(4, 4, lo + 12, 0.9, { b: { from: 0, to: -12, shape: 'linear' } }); N(8, 8, lo, 0.95, { b: { from: 0, to: 0, osc: { rate: '1/16', rateTo: '1/4', depth: 0.6, shape: 'triangle' } } }); }
      else N(0, 16, lo, 1, { b: { from: 0, to: lastBar ? -12 : -7, shape: 'late', at: 0.45, osc: { rate: '1/8', rateTo: '1/32', depth: 0.35, shape: 'sine' } } });
      return n; }
    if (p === 'screech' && kind === 'drop') { const h = at(deg + 2, 4);
      if (b % 2 === 1) { N(4, 2, h, 0.85, { b: { from: -5, to: 0, shape: 'early' } }); N(12, 3, h + 12, 0.9, { b: { from: 0, to: -12, shape: 'late', at: 0.3 } }); }
      else if (r() < 0.5) N(14, 2, h, 0.7, { b: { from: 12, to: 0, shape: 'early' } });
      return n; }
    if (p === 'riser' && kind === 'build') { const x = BUILD_LEAD(at, deg, b, sec, 4); if (lastBar) x.b = BOOM; N(x.s, x.l, x.n, x.v, x.b ? { b: x.b } : null); return n; }
    if (p === 'drums' && kind === 'build' && lastBar) {   // the last bar into the pause: the stock roll, then a ratchet that speeds up and grows
      const div = 1; for (let s = 0; s < 12; s += div) N(s, 1, D('snare'), 0.55 + 0.4 * s / 12); N(12, 4, D('snare'), 1, { rt: 6, x: { rs: 'accel', rv: 'grow' } }); return n; }
    return null;
  }
  function wubCurves(secs, r, o) {
    const out = [], mv = wMove(o.seed), add = (part, key, name, pts, osc) => out.push(Object.assign({ part, key, name, points: pts }, osc ? { osc } : {}));
    secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
      if (s.kind === 'intro') { add('fx1', 'wear', 'Tape wear (pad)', [[a, 0.55], [e - 0.05, 0.2]]); add('mod2', 'posX', 'XY · X (growl FM)', [[a, 0]]); add('mod2', 'posY', 'XY · Y (screech echo)', [[a, 0.2]]); }
      if (s.kind === 'build') { add('pad', '@pitch', 'Pad riser', [[a, 0], [e - 0.05, mv === 'rises' ? 12 : 7], [e, 0]]); add('riser', 'cutoff', 'Riser opens', [[a, 600], [e - 0.05, 9000], [e, 1200]]);
        add('growl', 'cutoff', 'Wobble filter', [[a, 2500], [a + s.bars * 0.7, 220], [e - 0.05, 260], [e, 8000]]); add('mod2', 'posX', 'XY · X (growl FM)', [[a, 0], [e - 0.05, 1], [e, 0.2]]); add('fx3', 'mix', 'Screech throw', [[a, 0.15], [e - 0.05, 0.55], [e, 0.2]]); }
      if (s.kind === 'pause') { add('fx3', 'mix', 'Screech throw', [[a, 0.6], [e - 0.02, 0.6], [e, 0.2]]);
        if (mv === 'freefall') { const fall = [[a, 0], [e - 0.02, -12], [e, 0]]; add('growl', '@pitch', 'Freefall', fall); add('talk', '@pitch', 'Freefall', fall); add('pad', '@pitch', 'Pad riser', fall); } }
      if (s.name === 'drop') { add('growl', 'depth', 'Wobble depth', [[a, 3], [e - 0.05, 6], [e, 3]], { rate: '1/2', depth: 1.2, shape: 'triangle' }); add('growl', 'cutoff', 'Wobble filter', [[a, 420]]);
        add('mod2', 'posX', 'XY · X (growl FM)', [[a, 0.2], [a + 8 - 0.05, 0.7], [a + 8, 0.3], [e - 0.05, 1]]); add('fx2', 'depth', 'Pump depth', [[a, 0.6], [e - 0.05, 0.85]]); }
      if (s.kind === 'break') { add('fx1', 'wear', 'Tape wear (pad)', [[a, 0.2], [e - 0.05, 0.75]]); add('mod2', 'posY', 'XY · Y (screech echo)', [[a, 0.2], [e - 0.05, 0.9], [e, 0.3]]); }
      if (s.name === 'drop 2') { const pts = []; for (let b = a; b < e; b += 4) pts.push([b, 380], [b + 3.9, 1800]); pts.push([e, 380]); add('talk', 'cutoff', 'Swarm opens', pts);
        add('talk', 'coupling', 'Swarm locks', [[a, 0.2], [e - 0.05, 0.9]]); add('talk', '@pitch', 'Ripples', [[a, 0], [e - 0.05, 0]], { rate: '1/2', depth: 0.3, shape: 'sine' }); add('fx2', 'depth', 'Pump depth', [[a, 0.85]]); }
      if (s.kind === 'outro') { add('fx1', 'wear', 'Tape wear (pad)', [[a, 0.3], [e - 0.05, 1]]); add('mod2', 'posY', 'XY · Y (screech echo)', [[a, 0.3], [e - 0.05, 1]]); } });
    return merge(out);
  }
  SE.addGenre({
    id: 'wub-floor-machine', label: 'Wub Floor Machine (Floor Falls, wired)', icon: '🕳', accent: '#ff2266', family: 'EDM', category: 'dubstep',
    bpm: [140, 144], roots: [1, 9, 4, 6, 11], scales: ['phrygian', 'minor'], progs: [[1, 1, 6, 7], [1, 6, 4, 5], [1, 2, 1, 7], [1, 1, 4, 6], [1, 7, 6, 7]],
    tagline: 'Floor Falls Out, wired through all of ERAVOS: the floor falls / steps / freefalls / rises in the pause; a wobble that talks per note; in drop 2 a Swarm growls like Raven Drop’s Reese and its coherence wears the pad’s tape; an XY Pad drives the wobble’s FM and throws the screech’s echo; the Drop Builder underneath',
    drums: { main: DROP_DB, main2: DROP_DB2, light: LIGHT, none: {} }, leadRhythm: 'sparse', bar: wubBar, curves: wubCurves,
    form: FORM(['sub'], ['drums', 'sub', 'growl', 'screech'], ['drums', 'sub', 'talk', 'screech'], ['pad', 'drums'], ['drums', 'sub', 'pad'], ['drums', 'pad', 'riser'], ['pad', 'riser'], ['pad', 'drums']),
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
      // Floor Falls Out's own sound (measured 2026-11-13: Classic Wub 1/8 over Deep Sine = drop −7 dB, 21 % in 30–60 Hz, −19 dB above 150 Hz; Head
      // Shaker over Earthquake Drop — in Heavy Drops too — 3 %, −11 dB: thin and harsh)
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Deep Sine', style: 'half', name: 'Sub' },
      growl: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Classic Wub 1/8', 'Half-time Growl 1/4t'], style: 'half', name: 'Wobble' },
      talk: { role: 'bass', organism: 'eravos.swarm-oscillator', preset: 'Growl Cloud', name: 'Swarm (Growl Cloud)', configure: { level: 0.4 } },
      screech: { role: 'lead', organism: 'eravos.wub-osc', preset: ['Slide Lead (+1 oct)', 'Dive Bomb'], octave: 4, name: 'Screech' },
      pad: { role: 'chords', organism: 'eravos.supersaw', preset: 'EDM Pad · Dark Minor Seventh Pad', style: 'sustain', voicing: 'triad', octave: 4, name: 'Pad',
        configure: { unison: 7, detune: 0.25, mix: 0.6, spread: 0.9, cutoff: 2400, res: 0.3, fEnv: 0.2, aA: 0.35, aD: 1, aS: 0.8, aR: 1.4, chordMode: 'off', level: 0.35 } },   // his pad (Floor Falls, his fix of #5901)
      riser: { role: 'lead', organism: 'eravos.retro-dco', preset: 'Sync Sweep', octave: 4, name: 'Riser (Retro DCO)', configure: { level: 0.5 } },
    },
    fx: [{ organism: 'eravos.fx-destroyer', preset: ['Fold Growl', 'Bass Grit (parallel)'], on: 'growl' }, { organism: 'eravos.tape-memory', preset: ['Chewed Tape', 'Third Generation Dub'], on: 'pad' },
      { organism: 'eravos.sidechain-compressor', preset: 'Odd · Wobble Breathes With Kick', on: 'fx0' }, { organism: 'eravos.fx-echo', preset: 'Dub Throw', on: 'screech' }],
    mods: [{ organism: 'eravos.bass-drop-builder', preset: 'Long build 8/8/1/16',
      configure: { tensionBars: 0, buildBars: 8, pauseBars: 1, dropBars: 16, subDive: 0.9, subFrom: 62, subTo: 29, subLen: 3, spaceTail: 0.75, spaceSize: 6, spaceDuck: 0.6, crossover: 140, spaceWidth: 0.9, swell: 0.7, swellBeats: 2, orbit: 0.5, orbitBars: 2 } },
      { organism: 'eravos.lfo', preset: 'Slow Filter Sweep 2 bars', to: 'talk', key: 'cutoff' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.18, maxY: 0.6 } }],
    routes: [{ from: 'mod2', out: 'x', to: 'growl', key: 'knob.fmIndex' }, { from: 'mod2', out: 'y', to: 'fx3', key: 'mix' }, { from: 'talk', out: 'coherence', to: 'fx1', key: 'wear' }],
    master: { compThresh: -9, compRatio: 3.5, reverbMix: 0.12 },
  });

  // ===================================================================================== SYNTHWAVE — synthwave-night-machine (🌆)
  const SMOVES = ['gate', 'riser', 'cut', 'swell'], sMove = moveOf(SMOVES);
  const S_DRUMS = { main: { kick: 'X...X...X...X...', snare: '....X.......X...', clap: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.', ohat: '..o...o...o...o.' },
    main2: { kick: 'X...X...X...X.x.', snare: '....X.......X...', clap: '....X.......X...', hat: 'xxxxxxxxxxxxxxxx', ohat: '......o.......o.' }, light: { kick: 'X.......X.......', hat: '..x...x...x...x.' }, none: {} };
  const DCOR = { cutoff: [60, 16000] };
  function swBar(cx) {
    const { partKey: p, kind, b, deg, key, sec, seed } = cx, at = (d, o) => MT().degreeToMidi(d, o, key.root, key.scale), n = [], N = (s, l, m, v, x) => n.push(Object.assign({ s, l, n: m, v: v || 0.9 }, x || {}));
    const lastBar = b === sec.bars - 1, mv = sMove(seed), alt = Math.floor((seed - 1) / 4) % 2, rot = (seed * 3) % 4;
    if (p === 'bass') { const r = at(deg, 2);   // DCO 8ths (the second half of the shelf: a gallop); in the pause the bass holds and dives (cut) or rises (swell)
      if (kind === 'pause') { if (mv === 'cut') N(0, 16, r, 1, { b: { from: 0, to: -12, shape: 'late', at: 0.2 } }); else if (mv === 'swell') N(0, 16, r, 0.6, { b: { from: -12, to: 0, shape: 'late', at: 0 } }); return n; }
      if (kind === 'intro' || kind === 'break') return [];
      (alt ? [0, 3, 4, 6, 8, 11, 12, 14] : [0, 2, 4, 6, 8, 10, 12, 14]).forEach((s, i) => N(s, alt && i % 2 ? 1 : 2, r + (i % 2 ? 12 : 0), i % 2 ? 0.78 : 0.95));
      return n; }
    if (p === 'sub' && kind === 'drop') { const r1 = at(deg, 1); N(0, 8, r1, 1); N(8, 8, r1, 0.9); return n; }   // the weight under the drop (measured: −10.5 dB without it, Floor Falls Out −7)
    if (p === 'brass' && kind === 'drop') { if (b % 2) return [];   // one note every two bars, a chord from it, strummed; the filter swells (a curve)
      const c = chordFrom(at, deg, 4, alt ? [2, 4, 7] : [2, 4, 6]); N(0, 32, c.root, 0.8, { x: { iv: c.iv, strum: 22, fall: 0.08 } }); return n; }
    if (p === 'lead' && kind === 'drop') {   // glides into the hook, a vibrato that blooms on held notes (and its depth is a curve), a ratchet into the turn
      const ph = (b + rot) % 4, hi = at(deg + 4, 5), mid = at(deg + 2, 5), lo = at(deg, 5);
      if (ph === 0) { N(0, 6, hi, 0.95, { b: { from: -2, to: 0, shape: 'early' } }); N(6, 2, mid, 0.8); N(8, 8, lo, 0.95, { b: { from: 0, to: 0, osc: { rate: 5.5, depth: 0.3, shape: 'sine', fade: 0.5 } } }); }
      else if (ph === 1) { N(0, 4, mid, 0.9); N(4, 4, hi, 0.95); N(8, 8, at(deg + 5, 5), 1, { b: { from: -3, to: 0, shape: 'early', osc: { rate: 5.5, depth: 0.25, shape: 'sine', fade: 0.6 } } }); }
      else if (ph === 2) { N(0, 3, hi, 0.9); N(3, 3, mid, 0.85); N(6, 2, lo, 0.8, { pr: 0.7 }); N(8, 8, mid, 0.95, { b: { from: 0, to: 0, osc: { rate: 5, depth: 0.3, shape: 'sine', fade: 0.4 } } }); }
      else { N(0, 12, lo, 1, { b: { from: -5, to: 0, shape: 'early', osc: { rate: '1/16', rateTo: '1/32', depth: 0.2, shape: 'sine', fade: 0.7 } } }); N(12, 4, hi, 0.85, { rt: 4, x: { rs: 'accel', rv: 'grow' } }); }
      return n; }
    if (p === 'riser' && kind === 'build') { const x = BUILD_LEAD(at, deg, b, sec, 4); if (lastBar && mv !== 'cut') x.b = BOOM; N(x.s, x.l, x.n, x.v, x.b ? { b: x.b } : null); return n; }
    if (p === 'drums') {
      if (kind === 'pause') {   // the pause's move on the gated kit
        if (mv === 'gate') { for (let s = 0; s < 16; s += 2) N(s, 1, D('tom'), 0.3 + 0.35 * s / 16); return n; }
        if (mv === 'riser') { N(12, 4, D('snare'), 0.32, { rt: 6, x: { rs: 'accel', rv: 'grow' } }); return n; }   // measured: at 0.5 over half a bar the pause was no hole
        return []; }   // cut / swell: silence — the bass alone
      if (kind === 'build') {   // measured 2026-11-13: the stock roll made the build brighter than the drop (−11 vs −13.5 dB above 150 Hz) — now a whisper that rises
        const f = (b * 16) / (sec.bars * 16), div = [4, 2, 2, 1][Math.min(3, Math.floor(4 * b / sec.bars))];
        if (b < sec.bars / 2) for (let s = 0; s < 16; s += 4) N(s, 1, D('kick'), 0.8);
        for (let s = 0; s < (lastBar ? 12 : 16); s += div) N(s, 1, D('snare'), 0.2 + 0.4 * (f + s / (sec.bars * 16)));
        if (lastBar) N(12, 4, D('snare'), 0.6, { rt: 6, x: { rs: 'accel', rv: 'grow' } });
        return n; }
      return null; }
    if (p === 'swarm' && kind === 'drop') { if (b % 4) return [];   // drop 2: the Swarm blooms a chord from one note every four bars
      const c = chordFrom(at, deg, 3, [4, 7, 9]); N(0, 64, c.root, 0.7, { x: { iv: c.iv, strum: 60, dir: 'out', fall: 0.1 } }); return n; }
    return null;
  }
  function swCurves(secs, r, o) {
    const out = [], mv = sMove(o.seed), add = (part, key, name, pts, osc) => out.push(Object.assign({ part, key, name, points: pts }, osc ? { osc } : {}));
    secs.forEach(s => { const a = s.bar, e = s.bar + s.bars, mid = a + s.bars / 2;
      if (s.kind === 'build') { add('arp', 'octaves', 'Arp octaves', [[a, 1], [a + s.bars * 0.4, 2], [a + s.bars * 0.75, 3], [e - 0.01, 3]]); add('arp', 'gate', 'Arp gate', [[a, 0.25], [e - 0.01, 1.1]]);
        add('arp', 'div', 'Arp rate', [[a, '1/8'], [mid, '1/16'], [e - 0.01, '1/16']]); add('pluck', 'cutoff', 'Pluck filter', [[a, 900], [e - 0.01, 6000]]); add('bass', 'cutoff', 'Bass filter', [[a, 500], [e - 0.05, 4000]]);
        add('pad', '@pitch', 'Pad riser', [[a, 0], [e - 0.05, mv === 'swell' ? 12 : 7], [e, 0]]); add('mod1', 'posX', 'XY · X (swarm coupling)', [[a, 0.1], [e - 0.05, 0.95]]); add('mod1', 'posY', 'XY · Y (brass filter)', [[a, 0.2], [e - 0.05, 0.8]]); }
      else if (s.kind === 'pause') { add('fx0', 'mix', 'Lead echo throw', [[a, 0.7], [e - 0.02, 0.7], [e, 0.25]]); add('pad', '@pitch', 'Pad riser', mv === 'cut' ? [[a, 0], [e - 0.02, -12], [e, 0]] : [[a, 0]]); }
      else if (s.kind === 'drop') { add('arp', 'octaves', 'Arp octaves', [[a, 2]]); add('arp', 'gate', 'Arp gate', [[a, 0.55]]); add('arp', 'div', 'Arp rate', [[a, '1/16']]);
        add('pluck', 'cutoff', 'Pluck filter', [[a, 3500], [e - 0.01, 4500]]); add('bass', 'cutoff', 'Bass filter', [[a, 2400]]); add('lead', 'lfoPitch', 'Lead vibrato', [[a, 4], [e - 0.05, 26]]);
        add('brass', 'cutoff', 'Brass swells', (() => { const p2 = []; for (let b = a; b < e; b += 2) p2.push([b, 700], [b + 1.6, 3800], [b + 1.95, 1800]); return p2; })()); add('fx1', 'depth', 'Pad pump', [[a, 0.75]]);
        add('mod1', 'posX', 'XY · X (swarm coupling)', [[a, 0.4], [e - 0.05, 1]], s.name === 'drop 2' ? { rate: '2', depth: 0.25, shape: 'sine' } : null); add('fx0', 'mix', 'Lead echo throw', [[a, 0.25]]); }
      else { add('arp', 'octaves', 'Arp octaves', [[a, 1]]); add('arp', 'gate', 'Arp gate', [[a, s.kind === 'break' ? 0.9 : 0.45]]); add('arp', 'div', 'Arp rate', [[a, s.kind === 'break' ? '1/8' : '1/16']]);
        add('pluck', 'cutoff', 'Pluck filter', [[a, s.kind === 'break' ? 700 : 1400], [e - 0.01, s.kind === 'break' ? 1100 : 1800]]); add('bass', 'cutoff', 'Bass filter', [[a, 900], [e - 0.05, 1300]]); add('fx1', 'depth', 'Pad pump', [[a, 0.35]]);
        add('fx2', 'wear', 'Brass tape wear', [[a, s.kind === 'break' ? 0.7 : 0.25]]); add('mod1', 'posX', 'XY · X (swarm coupling)', [[a, 0.2]]); add('mod1', 'posY', 'XY · Y (brass filter)', [[a, 0.3]]); } });
    return merge(out);
  }
  SE.addGenre({
    id: 'synthwave-night-machine', label: 'Synthwave Night Machine', icon: '🌆', accent: '#ff44cc', family: 'Synth', category: '80s',
    bpm: [100, 108], roots: [4, 9, 2, 11, 7], scales: ['minor'], progs: [[1, 6, 3, 7], [6, 4, 1, 5], [1, 7, 6, 7], [6, 7, 5, 1]],
    tagline: 'A night drive on Floor Falls Out’s arc: the Arp plays a Retro DCO pluck and opens up through every build, the DCO bass drives, the pause gates / rises / cuts / swells, the drop swells the DCO brass and blooms a vibrato on the DCO lead; an XY Pad pulls the Swarm together and opens the brass; the Swarm’s coherence rings the lead’s echo',
    drums: S_DRUMS, leadRhythm: 'anthem', bar: swBar, curves: swCurves,
    form: FORM(['bass', 'drums'], ['drums', 'sub', 'bass', 'arp', 'pad', 'brass', 'lead'], ['drums', 'sub', 'bass', 'arp', 'pad', 'brass', 'lead', 'swarm'], ['arp', 'pad'], ['drums', 'bass', 'arp', 'pad'], ['drums', 'arp', 'pad', 'riser'], ['arp', 'pad', 'swarm'], ['arp', 'pad', 'drums']),
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Retro Machines · Synthwave Gated', name: 'Drums' },
      bass: { role: 'bass', organism: 'eravos.retro-dco', preset: ['Analog Machine Bass', 'Sub Growl'], name: 'Bass (Retro DCO)', configure: { level: 0.9 } },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Deep Sine', name: 'Sub', configure: { level: 0.6 } },   // 0.8 (its default) clipped 0.3 % of the drop
      arp: { role: 'chords', organism: 'eravos.arp', style: 'sustain', voicing: 'seventh', octave: 4, repeat: true, name: 'Arp',
        configure: { order: 'up-down', div: '1/16', octaves: 1, gate: 0.45, swing: 0.04, slide: 0.06, velRamp: 0.3, restart: 'notes' } },
      pluck: { role: 'keys', organism: 'eravos.retro-dco', preset: ['Arcade Pulse', 'Neon Noir Stab'], name: 'Pluck (the Arp plays it)', configure: { level: 0.38 } },
      pad: { role: 'chords', organism: 'eravos.retro-poly', preset: ['EDM Pad · Synthwave Sunset Pad', 'Nightdrive Pad', '80s · Blade Runner Pad'], style: 'sustain', voicing: 'triad', octave: 3, repeat: true, name: 'Pad', configure: { level: 0.3 } },
      brass: { role: 'chords', organism: 'eravos.retro-dco', preset: 'Five-Voice Brass Swell', name: 'Brass (Retro DCO)', configure: { level: 0.8 } },
      lead: { role: 'lead', organism: 'eravos.retro-dco', preset: ['Outrun Lead', 'Coldwave Lead'], octave: 5, name: 'Lead (Retro DCO)' },
      swarm: { role: 'chords', organism: 'eravos.swarm-oscillator', preset: ['Blooming Chord', 'Breathing Swarm'], name: 'Swarm', configure: { level: 0.4 } },
      riser: { role: 'lead', organism: 'eravos.supersaw', preset: ['80s · Hyperspace Pad', 'Festival Lead'], octave: 4, name: 'Riser', configure: { level: 0.4 } },
    },
    wires: [[['arp', 'arp.hook.note_out'], ['pluck', 'rd.hook.note_in']]],
    fx: [{ organism: 'eravos.fx-echo', preset: '80s · Dotted Synthwave Delay', on: 'lead' }, { organism: 'eravos.sidechain-compressor', preset: 'Classic 1/4 Pump', on: 'pad' },
      { organism: 'eravos.tape-memory', preset: 'Sunbleached Reel', on: 'brass' }],
    mods: [{ organism: 'eravos.lfo', preset: '80s · Slow Juno Drift', to: 'pad', key: 'pwm' }, { organism: 'eravos.xy-pad', configure: { minY: 0.15, maxY: 0.6 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'swarm', key: 'coupling' }, { from: 'mod1', out: 'y', to: 'brass', key: 'cutoff' }, { from: 'swarm', out: 'coherence', to: 'fx0', key: 'feedback' }],
    master: { compThresh: -10, compRatio: 3, reverbMix: 0.16 },
  });

  // ===================================================================================== LOFI — lofi-tape-machine (🌙)
  const LMOVES = ['stop', 'sag', 'dropout', 'rewind'], lMove = moveOf(LMOVES);
  const L_DRUMS = { main: { kick: 'X......x..X.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.x.' }, main2: { kick: 'X.....x...X..x..', snare: '....X.......X...', hat: 'x.xxx.x.x.xxx.x.', ohat: '..............o.' },
    light: { kick: 'X.........X.....', hat: '..x...x...x...x.' }, none: {} };
  function lofiBar(cx) {
    const { partKey: p, kind, b, deg, key, sec, seed } = cx, at = (d, o) => MT().degreeToMidi(d, o, key.root, key.scale), n = [], N = (s, l, m, v, x) => n.push(Object.assign({ s, l, n: m, v: v || 0.85 }, x || {}));
    const alt = Math.floor((seed - 1) / 4) % 2, rot = (seed * 3) % 4;
    if (p === 'keys') {   // one note a bar, a 9th chord from it (or 7th + 11th), strummed, the bar's last beat answered; the tape drifts (a shape)
      if (kind === 'pause') { const c = chordFrom(at, deg, 3, [2, 4, 6, 8]); N(0, 16, c.root, 0.6, { x: { iv: c.iv, strum: 120, fall: 0.15 } }); return n; }
      const c = chordFrom(at, deg, 3, alt ? [2, 4, 6, 10] : [2, 4, 6, 8]);
      n.push(shaped({ s: alt ? 2 : 0, l: alt ? 11 : 13, n: c.root, v: 0.62, x: { iv: c.iv, strum: alt ? 70 : 45, fall: 0.12, ht: 12, hv: 0.07 } }, { pitch: sig([[0, 0], [1, 0]], [mod('smooth', 2.5, 0.06, { seed: 3 + b })]) }));
      if ((b + rot) % 2) N(14 - 2 * (rot % 2), 2, at(deg + 4 + (rot > 1 ? 1 : 0), 4), 0.4, { pr: 0.7 });
      return n; }
    if (p === 'bass') { if (kind === 'intro' || kind === 'pause') return []; const r = at(deg, 2);
      N(0, alt ? 6 : 10, r, 0.9, { b: { from: -3, to: 0, shape: 'early' } }); N(alt ? 8 : 10, 6, r + (alt ? 7 : 0), 0.75, { b: { from: 0, to: -2, shape: 'late', at: 0.6 } }); return n; }
    if (p === 'lead' && (kind === 'drop' || kind === 'break')) {   // the Retro DCO line: lazy, late, a ghost by chance; long notes vibrato (its depth a curve)
      const ph = (b + rot) % 4, hi = at(deg + 4, 5), mid = at(deg + 2, 5), lo = at(deg, 5);
      if (ph === 0) { N(2, 6, hi, 0.7, { mt: 0.15 }); N(8, 8, mid, 0.65, { b: { from: -1, to: 0, shape: 'early' } }); }
      else if (ph === 1) { N(0, 3, mid, 0.6); N(3, 3, hi, 0.55, { pr: 0.6 }); N(6, 10, lo, 0.7); }
      else if (ph === 2) { N(4, 4, at(deg + 5, 5), 0.65, { mt: 0.2 }); N(8, 8, hi, 0.7); }
      else N(0, 16, lo, 0.7, { b: { from: -2, to: 0, shape: 'early' } });
      return n; }
    if (p === 'drums' && (kind === 'drop' || kind === 'verse' || kind === 'build')) {   // boom bap that leans back: the stock grid, the snare late, ghosts by chance; a dragging hat ratchet on the phrase end
      const g = kind === 'drop' && sec.name === 'drop 2' ? L_DRUMS.main2 : kind === 'drop' ? L_DRUMS.main : L_DRUMS.light;
      const H = (s, k, v, x) => N(s, 1, D(k), v, x);
      Object.keys(g).forEach(k => [...g[k]].forEach((ch, s) => { if (ch === '.') return; H(s, k, ch === 'X' ? 0.95 : ch === 'o' ? 0.5 : 0.7, k === 'snare' ? { mt: alt ? 0.2 : 0.15 } : k === 'hat' && s % 4 ? { pr: 0.8, x: { hv: 0.12, ht: 10 } } : null); }));
      if (kind === 'drop') { H(9, 'snare', 0.2, { pr: 0.5 }); H(15, 'snare', 0.2, { pr: 0.45 }); if (b % 4 === 3) H(14, 'hat', 0.5, { rt: 4, x: { rs: 'decel', rv: 'fade' } }); }
      return n; }
    return null;
  }
  function lofiCurves(secs, r, o) {
    const out = [], mv = lMove(o.seed), add = (part, key, name, pts, osc) => out.push(Object.assign({ part, key, name, points: pts }, osc ? { osc } : {}));
    secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
      if (s.kind === 'intro') { add('fx0', 'wear', 'Keys tape wear', [[a, 0.6], [e - 0.05, 0.3]]); add('keys', 'cutoff', 'Keys filter', [[a, 700], [e - 0.05, 1500]]); add('mod1', 'posX', 'XY · X (keys tape)', [[a, 0.6], [e - 0.05, 0.3]]); }
      if (s.kind === 'pause') {   // the floor, on tape: the tape stops / sags / drops out / rewinds — keys and drums together
        const fall = mv === 'stop' ? [[a, 1], [e - 0.05, 0.5], [e, 1]] : mv === 'sag' ? [[a, 1], [a + 0.5, 0.86], [e - 0.05, 0.8], [e, 1]] : mv === 'rewind' ? [[a, 1], [e - 0.05, 1.5], [e, 1]] : [[a, 1]];
        add('fx0', 'speed', 'Keys tape speed', fall); add('fx1', 'speed', 'Drums tape speed', fall);
        if (mv === 'dropout') { add('fx0', 'dropouts', 'Keys dropouts', [[a, 0.9], [e - 0.02, 0.9], [e, 0.1]]); add('fx2', 'mix', 'Echo throw', [[a, 0.7], [e - 0.02, 0.7], [e, 0.3]]); } }
      if (s.kind === 'verse' || s.kind === 'build') { add('keys', 'cutoff', 'Keys filter', [[a, 1100], [e - 0.05, s.kind === 'build' ? 1900 : 1500]]); add('fx0', 'speed', 'Keys tape speed', [[a, 1]]); add('fx1', 'speed', 'Drums tape speed', [[a, 1]]); }
      if (s.kind === 'drop') { add('keys', 'cutoff', 'Keys filter', [[a, 2400], [e - 0.05, 3400]]); add('lead', 'lfoPitch', 'Lead vibrato', [[a, 3], [e - 0.05, 18]]); add('fx3', 'depth', 'Keys pump', [[a, 0.3]]);
        add('fx0', 'speed', 'Keys tape speed', [[a, 1]]); add('fx1', 'speed', 'Drums tape speed', [[a, 1]]); add('mod1', 'posY', 'XY · Y (lead filter)', [[a, 0.3], [e - 0.05, 0.85]]); add('fx0', 'dropouts', 'Keys dropouts', [[a, 0.1]]); }
      if (s.kind === 'break') { add('keys', 'cutoff', 'Keys filter', [[a, 1200], [e - 0.05, 650]]); add('fx2', 'mix', 'Echo throw', [[a, 0.35], [e - 0.05, 0.6]]); add('mod1', 'posX', 'XY · X (keys tape)', [[a, 0.3], [e - 0.05, 0.8]]); }
      if (s.kind === 'outro') { add('fx0', 'wear', 'Keys tape wear', [[a, 0.3], [e - 0.05, 1]]); add('mod1', 'posX', 'XY · X (keys tape)', [[a, 0.4], [e - 0.05, 1]]); add('fx1', 'speed', 'Drums tape speed', [[a, 1], [e - 0.05, 0.6]]); } });
    return merge(out);
  }
  SE.addGenre({
    id: 'lofi-tape-machine', label: 'Lo-fi Tape Machine', icon: '📼', accent: '#c9a36b', family: 'Chill', category: 'chill', impact: false,
    bpm: [80, 86], roots: [0, 2, 5, 7, 9], scales: ['minor', 'dorian'], progs: [[2, 5, 1, 6], [1, 4, 7, 3], [6, 2, 5, 1], [4, 3, 2, 1]],
    tagline: 'Floor Falls Out’s arc, on tape: Retro Poly keys (9ths from one note, strummed) and the drums each through their own Tape Memory; in the pause the tape stops / sags / drops out / rewinds; a Retro DCO line on an echo that its tape’s dropouts throw; an LFO breathes the keys’ filter; an XY Pad wears the tape and opens the lead',
    drums: L_DRUMS, leadRhythm: 'sparse', bar: lofiBar, curves: lofiCurves,
    form: FORM(['keys'], ['drums', 'bass', 'keys', 'lead', 'air'], ['drums', 'bass', 'keys', 'lead', 'air'], ['keys', 'air'], ['drums', 'bass', 'keys'], ['drums', 'bass', 'keys', 'air'], ['keys', 'lead', 'air'], ['keys', 'air']),
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Cinematic & Lo-fi · Lo-fi Dust', name: 'Drums' },
      bass: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Lofi Soft Sub', name: 'Sub' },
      keys: { role: 'chords', organism: 'eravos.retro-poly', preset: ['Lofi Keys', 'Lofi Felt Keys'], name: 'Keys' },
      lead: { role: 'lead', organism: 'eravos.retro-dco', preset: ['VHS Dreams', 'Chorus Glass Poly'], octave: 5, name: 'Lead (Retro DCO)', configure: { level: 0.65 } },
      air: { role: 'chords', organism: 'eravos.swarm-oscillator', preset: 'Breathing Swarm', style: 'sustain', voicing: 'triad', octave: 3, repeat: true, name: 'Air (Swarm)', configure: { level: 0.22 } },
    },
    fx: [{ organism: 'eravos.tape-memory', preset: ['Lofi Study', 'Lofi Rainy', 'Lofi Late Night'], on: 'keys' }, { organism: 'eravos.tape-memory', preset: 'Lofi Cassette', on: 'drums' },
      { organism: 'eravos.fx-echo', preset: ['Lofi Warm Echo', 'Lofi Long Night'], on: 'lead' }, { organism: 'eravos.sidechain-compressor', preset: 'Lofi Gentle Pump', on: 'fx0' },
      { organism: 'eravos.fx-destroyer', preset: 'Lo-fi 12-bit 22k', on: 'fx1' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Slow Filter Sweep 2 bars', to: 'keys', key: 'cutoff' }, { organism: 'eravos.xy-pad', configure: { maxY: 0.5 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'fx0', key: 'wear' }, { from: 'mod1', out: 'y', to: 'lead', key: 'cutoff' }, { from: 'fx0', out: 'dropout', to: 'fx2', key: 'mix' }],
    master: { compThresh: -12, compRatio: 2.5, reverbMix: 0.12 },
  });

  // ===================================================================================== the shelves: eight a genre, each its own move
  const SAY = {
    falls: 'the floor falls two octaves', stairs: 'the floor goes down in four steps', freefall: 'everything falls together on Pitch curves', rises: 'the sub climbs back out of the floor',
    gate: 'a gated tom run climbs into the hit', riser: 'a snare ratchet speeds up and grows', cut: 'everything stops but the bass, diving', swell: 'the bass swells up an octave into the hit',
    stop: 'the tape stops (keys and drums slow to half speed)', sag: 'the tape sags', dropout: 'the tape drops out and throws its echo', rewind: 'the tape rewinds up to speed',
  };
  const NOTE = (mv, g) => ({ move: mv, listen: 'Floor Falls Out’s arc. In each pause ' + SAY[mv] + '. Open any lane: curves move the instruments, the effects and the XY Pad.', drop: g,
    voice: 'Her clips fit the two pauses — her voice alone where the floor goes.', tools: 'Retro DCO · Swarm Oscillator · Tape Memory · Wobble Bass · Arp · LFO · XY Pad · Sidechain · Echo · Destroyer · Drop Builder · curve lanes on tools, effects and modulators · the Field’s notes' });
  // a seed per song: base + its place, or its own where two drew the same progression (P172 measured 0.87 shared: 9105 → 9113, the same move)
  const OWN = { 9105: 9113 };
  const shelf = (genre, base, mv, titles, moods, drop) => titles.map((t, i) => { const seed = OWN[base + i + 1] || base + i + 1;
    return Object.assign({ id: genre.split('-')[0] + 'm' + (i + 1), title: t, genre, seed, mood: ['edm'].concat(moods[i % moods.length]) }, NOTE(mv(seed), drop)); });
  const SONGS = []
    .concat(shelf('wub-floor-machine', 9100, wMove, ['Floor Machine', 'Coherent Fall', 'Stairs in the Static', 'Freefall Grid', 'Rise Through the Wires', 'XY Under Pressure', 'Talking Swarm', 'Last Floor'],
      [['heavy', 'party'], ['heavy', 'dark'], ['heavy'], ['heavy', 'her']], 'Drop 1 is Floor Falls Out’s wobble; drop 2 the Swarm talks, opens every phrase and locks — and its echoes ring as it does.'))
    .concat(shelf('synthwave-night-machine', 9200, sMove, ['Night Machine', 'Arp Through the Rain', 'Cut the Engine', 'Swell Over the City', 'Gated Horizon', 'Chrome Arpeggio', 'Coherence Drive', 'Last Exit Neon'],
      [['80s'], ['80s', 'dark'], ['80s', 'party'], ['80s', 'her']], 'The drop swells the DCO brass every two bars and the lead’s vibrato grows; in drop 2 the Swarm blooms and the XY Pad pulls it together.'))
    .concat(shelf('lofi-tape-machine', 9300, lMove, ['Tape Machine', 'Sagging Afternoon', 'Dropout Diary', 'Rewind the Rain', 'Half-Speed Heart', 'Felt and Hiss', 'Echo in the Dropout', 'Worn to the End'],
      [['warm'], ['warm', 'her'], ['calm'], ['warm', 'calm']], 'No big drop — the hook returns at full speed after the tape’s move, the lead’s vibrato growing.'));
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.EravosNowSongbook = { genres: ['wub-floor-machine', 'synthwave-night-machine', 'lofi-tape-machine'], songs: SONGS.map(s => s.id), moves: { wub: WMOVES, synthwave: SMOVES, lofi: LMOVES } };
})();
