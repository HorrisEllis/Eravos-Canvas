/* ERAVOS "Now" songbook (3.173) — data only. His words, 2026-11-12: "also add songs that use the new tools, automation, and full extent of
 * eravos." Three genres, two songs each — every song its own variant (cx.seed), so no two play the same (the 3.172 measure: < 80 % shared notes).
 *   NEW TOOLS   Retro DCO (bass, brass, lead) · Swarm Oscillator (Blooming Chord, Metal Swarm — the Living pack) · Tape Memory on the keys ·
 *               Wobble Bass (vowels, rate, wavetable per note) · Retro Poly Lofi Keys · Sub Engine · the Lo-fi Dust and Synthwave Gated kits
 *   AUTOMATION  curve lanes: the keys' filter opens for the chorus and closes for the break · the DCO lead's vibrato depth (lfoPitch) grows ·
 *               the DCO bass filter opens through the build, the brass filter swells over each drop · the Swarm's coupling pulls together into the drop, its restlessness in the
 *               break · a Pitch riser into the drop · the Wobble's depth swinging (an LFO on the lane), its rate bending up through the build,
 *               its filter closing then ripping open
 *   NOTES       (the Workshop's depth, written per note) chords from one note, strummed, softer voices · a shape per note (pitch or a knob,
 *               a base + modulators whose rate or depth have modulators) compiled as the Workshop compiles it · plays / skips on pass k of
 *               N · ratchets that speed up / slow down · humanize · chance · microtiming · a knob for one note · a note at double speed
 *   CHAINS      effects in series (tape → pump; echo; grit → pump) · every part its own lane, so any of it opens in the Workshop
 * Pitches through MusicTheory.degreeToMidi (the song's key); drums: the Song Engine's pads (36 + PAD). Original parts — nothing copies a record. */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const MT = () => window.MusicTheory, SP = () => window.ShowcasePatterns;
  const PAD = SE.helpers.PAD, D = (k) => 36 + PAD[k];
  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  // a chord from one note: the scale's tones above the degree (3rd, 5th, 7th, 9th …) as intervals from the root note
  const chordFrom = (cx, o, tones) => { const at = (d) => MT().degreeToMidi(d, o, cx.key.root, cx.key.scale), r = at(cx.deg); return { root: r, iv: tones.map(t => at(cx.deg + t) - r) }; };
  const shaped = (n, T, R) => SP() ? SP().shaped(n, T, R) : n, sig = (b, m) => SP().sig(b, m), mod = (...a) => SP().mod(...a);
  const V = (cx) => (cx.seed | 0) % 2;   // the song's variant: each song of a genre writes its own parts

  // ======================================================================== LOFI TAPE (80–84)
  const RPR = { cutoff: [60, 16000] }, DCO = { cutoff: [60, 16000], lfoPitch: [0, 100], pwm: [0, 1] };
  function lofiBar(cx) {
    const p = cx.partKey, v = V(cx), b = cx.b, n = [], N = (x) => n.push(x), at = (d, o) => MT().degreeToMidi(d, o, cx.key.root, cx.key.scale);
    if (p === 'keys') {   // one note a bar, a chord from it (9ths, or 7ths + 11 in the second song), strummed, the tape drifting, its filter settling
      const c = chordFrom(cx, 3, v ? [2, 4, 6, 10] : [2, 4, 6, 8]);
      N(shaped({ s: v ? 2 : 0, l: v ? 13 : 15, n: c.root, v: 0.6 + 0.05 * (b % 2), x: { iv: c.iv, strum: v ? 70 : 45, dir: b % 4 === 3 ? 'down' : 'up', fall: 0.12, ht: 14, hv: 0.08 } },
        { pitch: sig([[0, 0], [1, 0]], [mod('smooth', 2.5, 0.07, { seed: 3 + b + 10 * v })]), 'k:cutoff': sig([[0, 2600], [0.25, 1500], [1, v ? 700 : 950]], [mod('sine', 1, 120)]) }, RPR));
      return n;
    }
    if (p === 'sub') {   // the root slides in; the bar's end falls; a pickup only on the last pass of four
      const r = at(cx.deg, 2), L = v ? [[0, 6], [8, 6]] : [[0, 10], [10, 6]];
      N({ s: L[0][0], l: L[0][1], n: r, v: 0.85, b: { from: -3, to: 0, shape: 'early' } });
      N({ s: L[1][0], l: L[1][1], n: r + (v ? 7 : 0), v: 0.7, b: { from: 0, to: -2, shape: 'late', at: 0.6 } });
      if (b % 4 === 3) N({ s: 14, l: 2, n: at(cx.deg + 1, 2), v: 0.75, x: { cond: { every: 4, at: 3 } } });
      return n;
    }
    if (p === 'lead') {   // the DCO: a lazy line, late notes, ghosts by chance; long notes wobble — the wobble's depth has its own modulator
      const line = v ? [[0, 3, 4], [3, 3, 3], [6, 10, 2]] : [[0, 6, 4], [6, 2, 5], [8, 8, 2]], shift = b % 2 ? -1 : 0;
      line.forEach(([s, l, d], i) => { const x = { s, l, n: at(cx.deg + d + shift, 5), v: 0.55 + 0.1 * i, x: { ht: 10, hv: 0.06 } };
        if (i === 1) { x.mt = 0.18; x.pr = 0.7; }
        N(l >= 8 ? shaped(x, { pitch: sig([[0, 0], [1, 0]], [mod('sine', 3, 0.05, { fade: 0.3, depthMods: [mod('triangle', 1, 0.05)] })]) }) : x); });
      return n;
    }
    if (p === 'drums') {   // boom bap that leans back: the snare late, hats by chance, ghost snares, a dragging hat ratchet at the phrase end
      const H = (s, k, vv, o) => N(Object.assign({ s, l: 1, n: D(k), v: vv }, o || {}));
      if (cx.kind === 'intro' || cx.kind === 'break') { for (let s = 0; s < 16; s += 4) H(s, 'hat', 0.35, { pr: 0.8, x: { ht: 14, hv: 0.12 } }); return n; }
      H(0, 'kick', 0.95); H(v ? 6 : 7, 'kick', 0.7, { pr: 0.6 }); H(10, 'kick', 0.85);
      H(4, 'snare', 0.9, { mt: v ? 0.2 : 0.15 }); H(12, 'snare', 0.9, { mt: v ? 0.2 : 0.15 }); H(9, 'snare', 0.22, { pr: 0.5 }); H(15, 'snare', 0.2, { pr: 0.45 });
      for (let s = 0; s < 16; s += 2) H(s, 'hat', s % 4 ? 0.4 : 0.6, Object.assign({ x: { ht: 12, hv: 0.12 } }, s % 4 ? { pr: 0.8 } : {}));
      if (b % 4 === 3) H(14, 'hat', 0.5, { l: 2, rt: v ? 3 : 4, x: { rs: 'decel', rv: 'fade' } });
      return n;
    }
    return null;
  }
  function lofiCurves(secs) {
    const out = [], add = (part, key, name, pts) => out.push({ part, key, name, points: pts });
    secs.forEach(s => { const a = s.bar, e = s.bar + s.bars - 0.01;
      add('keys', 'cutoff', 'Keys filter', s.kind === 'chorus' ? [[a, 1400], [e, 3200]] : s.kind === 'break' ? [[a, 1200], [e, 600]] : [[a, 1500], [e, 1700]]);
      add('lead', 'lfoPitch', 'Lead vibrato', s.kind === 'chorus' ? [[a, 4], [e, 22]] : [[a, 2]]); });
    const m = new Map(); out.forEach(c => { const k = c.part + '|' + c.key; if (!m.has(k)) m.set(k, Object.assign({}, c, { points: [] })); m.get(k).points.push(...c.points); });
    return Array.from(m.values());
  }
  SE.addGenre({
    id: 'now-lofi-tape', label: 'ERAVOS Now · Lofi Tape', icon: '📼', accent: '#c9a26b', family: 'Chill', category: 'now', curve: false, impact: false,
    bpm: [80, 84], roots: [0, 2, 5, 7, 9], scales: ['minor'], progs: [[2, 5, 1, 6], [1, 4, 7, 3], [6, 2, 5, 1]],
    tagline: 'Retro Poly keys through Tape Memory (one note a bar, a 9th chord from it, strummed, the tape drifting), a Retro DCO line whose wobble wobbles, a sub that sighs, drums that lean back',
    form: [S('intro', 'intro', 4, ['keys', 'drums']), S('verse', 'verse', 8, ['keys', 'sub', 'drums']), S('chorus', 'chorus', 8, ['keys', 'sub', 'drums', 'lead']),
      S('break', 'break', 4, ['keys', 'lead', 'drums']), S('chorus 2', 'chorus', 8, ['keys', 'sub', 'drums', 'lead']), S('outro', 'outro', 4, ['keys'])],
    bar: lofiBar, curves: lofiCurves,
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Cinematic & Lo-fi · Lo-fi Dust', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Lofi Soft Sub', name: 'Sub' },
      keys: { role: 'chords', organism: 'eravos.retro-poly', preset: 'Lofi Keys', name: 'Keys' },
      lead: { role: 'lead', organism: 'eravos.retro-dco', preset: 'VHS Dreams', name: 'Lead (Retro DCO)' },
    },
    fx: [{ organism: 'eravos.tape-memory', preset: ['Lofi Study', 'Lofi Rainy'], on: 'keys' }, { organism: 'eravos.sidechain-compressor', preset: 'Lofi Gentle Pump', on: 'fx0' },
      { organism: 'eravos.fx-echo', preset: ['Lofi Warm Echo', 'Lofi Long Night'], on: 'lead' }, { organism: 'eravos.fx-destroyer', preset: 'Lo-fi 12-bit 22k', on: 'drums' }],
    master: { compThresh: -12, compRatio: 2.5, reverbMix: 0.12 },
  });

  // ======================================================================== SYNTHWAVE NIGHT (100–110)
  const SWR = { coupling: [0, 1], cluster: [0, 1], restless: [0, 1] };
  function swBar(cx) {
    const p = cx.partKey, v = V(cx), b = cx.b, n = [], N = (x) => n.push(x), at = (d, o) => MT().degreeToMidi(d, o, cx.key.root, cx.key.scale), last = b === cx.sec.bars - 1;
    if (p === 'bass') {   // Retro DCO 8ths (the second song: a gallop), every note's filter snapping shut; the bar's last note ratchets
      const r = at(cx.deg, 2), steps = v ? [0, 3, 4, 6, 8, 11, 12, 14] : [0, 2, 4, 6, 8, 10, 12, 14];
      steps.forEach((s, i) => N(shaped(Object.assign({ s, l: v && i % 2 ? 1 : 2, n: r + (i % 2 ? 12 : 0), v: i % 2 ? 0.78 : 0.95 }, i === 7 ? { rt: 2, x: { rs: 'accel', rv: 'grow' } } : {}),
        { 'k:cutoff': sig([[0, 2200 + 300 * (i % 2)], [0.35, 700], [1, 380]]) }, DCO)));
      return n;
    }
    if (p === 'brass') {   // one note a bar: a chord from it, strummed; the filter swells open; a vibrato that blooms (its depth rises)
      const c = chordFrom(cx, 4, v ? [2, 4, 7] : [2, 4, 6]);
      N(shaped({ s: 0, l: 16, n: c.root, v: 0.8, x: { iv: c.iv, strum: v ? 35 : 22, fall: 0.08 } },
        { 'k:cutoff': sig([[0, 500], [0.6, 3800], [1, 2600]]), pitch: sig([[0, 0], [1, 0]], [mod('sine', 22, [[0, 0], [0.4, 0], [1, 0.14]])]) }, DCO));
      return n;
    }
    if (p === 'pad') {   // Swarm: two bars a chord, spread out from the middle; the swarm pulls together (coupling), its cluster breathes on a
      // triangle whose rate has a modulator; on pass 2 of 2 the second chord rests (space)
      if (b % 2) return [];
      const c = chordFrom(cx, 3, [4, 7, 9]);
      N(shaped({ s: 0, l: 32, n: c.root, v: 0.7, x: Object.assign({ iv: c.iv, strum: 60, dir: 'out', fall: 0.1 }, v && b % 4 === 2 ? { cond: { every: 2, at: 1, skip: true } } : {}) },
        { 'k:coupling': sig([[0, 0.1], [0.7, 0.85], [1, 0.7]]), 'k:cluster': sig([[0, 0.35], [1, 0.35]], [mod('triangle', 2, 0.25, { rateMods: [mod('ramp', 1, -1.5)] })]) }, SWR));
      return n;
    }
    if (p === 'lead') {   // Retro DCO: a bend into the hook, a vibrato on held notes, a ratchet that speeds up, passing notes by chance, a
      // note that runs the tool at double speed; the last bar of a build rises a 4th
      if (cx.kind === 'build') { N({ s: 0, l: 16, n: at(cx.deg + (b % 4), 5), v: 0.5 + 0.4 * b / cx.sec.bars, b: last ? { from: 0, to: 5, shape: 'late', at: 0.3 } : undefined }); if (!last) delete n[0].b; return n; }
      const ph = (b + v) % 4, hi = at(cx.deg + 4, 5), mid = at(cx.deg + 2, 5), lo = at(cx.deg, 5);
      if (ph === 0) { N({ s: 0, l: 6, n: hi, v: 0.9, b: { from: -2, to: 0, shape: 'early' } }); N({ s: 6, l: 2, n: mid, v: 0.75, pr: 0.75 }); N({ s: 8, l: 8, n: lo, v: 0.9, b: { from: 0, to: 0, osc: { rate: '1/16', depth: 0.25, shape: 'sine', fade: 0.4 } } }); }
      else if (ph === 1) { N({ s: 0, l: 4, n: mid, v: 0.85, rt: 4, x: { rs: 'accel', rv: 'grow' } }); N({ s: 4, l: 4, n: hi, v: 0.9 }); N({ s: 8, l: 8, n: at(cx.deg + 5, 5), v: 0.95, x: { tempo: 2 } }); }
      else if (ph === 2) { N({ s: 0, l: 3, n: hi, v: 0.85 }); N({ s: 3, l: 3, n: mid, v: 0.8, pr: 0.6 }); N({ s: 6, l: 10, n: lo, v: 0.9, b: { from: 0, to: -1, shape: 'late', at: 0.7 } }); }
      else N({ s: 0, l: 16, n: lo, v: 0.95, b: { from: -5, to: 0, shape: 'early', osc: { rate: '1/8', rateTo: '1/32', depth: 0.3, shape: 'sine', fade: 0.5 } } });
      return n;
    }
    if (p === 'drums') {   // four on the floor, gated snare + clap, 16th hats humanized (offbeats by chance); a snare ratchet fill on pass 4
      const H = (s, k, vv, o) => N(Object.assign({ s, l: 1, n: D(k), v: vv }, o || {}));
      if (cx.kind === 'intro' || cx.kind === 'break') { H(0, 'kick', 0.8); H(8, 'kick', 0.7); for (let s = 2; s < 16; s += 4) H(s, 'hat', 0.4, { x: { hv: 0.15 } }); return n; }
      if (cx.kind === 'build') { const div = [4, 2, 1, 1][Math.min(3, Math.floor(b / Math.max(1, cx.sec.bars / 4)))]; for (let s = 0; s < 16; s += div) H(s, 'snare', 0.35 + 0.6 * (b * 16 + s) / (cx.sec.bars * 16)); return n; }
      for (let k = 0; k < 16; k += 4) H(k, 'kick', 0.95);
      H(4, 'snare', 1); H(12, 'snare', 1); H(4, 'clap', 0.7); H(12, 'clap', 0.7);
      for (let s = 0; s < 16; s++) H(s, 'hat', s % 4 === 2 ? 0.7 : 0.35, Object.assign({ x: { hv: 0.15, ht: 6 } }, s % 2 ? { pr: v ? 0.7 : 0.85 } : {}));
      H(14, 'ohat', 0.55, { l: 2 });
      if (b % 4 === 3) H(12, 'snare', 0.8, { l: 4, rt: v ? 4 : 6, x: { rs: 'accel', rv: 'grow', cond: { every: 4, at: 3 } } });
      return n;
    }
    return null;
  }
  function swCurves(secs) {
    const out = [], add = (part, key, name, pts) => out.push({ part, key, name, points: pts });
    secs.forEach(s => { const a = s.bar, e = s.bar + s.bars - 0.01;
      if (s.kind === 'build') { add('bass', 'cutoff', 'Bass filter', [[a, 500], [e, 4000]]); add('pad', 'coupling', 'Swarm pulls together', [[a, 0.15], [e, 0.95]]); add('lead', '@pitch', 'Lead riser', [[a, 0], [s.bar + s.bars - 0.05, 7], [s.bar + s.bars, 0]]); }
      else if (s.kind === 'drop' || s.kind === 'chorus') { add('brass', 'cutoff', 'Brass filter', [[a, 900], [a + s.bars / 2, 3600], [e, 1800]]); add('bass', 'cutoff', 'Bass filter', [[a, 2400]]); add('pad', 'coupling', 'Swarm pulls together', [[a, 0.7]]); add('pad', 'restless', 'Swarm restless', [[a, 0.1]]); }
      else { add('bass', 'cutoff', 'Bass filter', [[a, 900], [e, 1300]]); add('pad', 'restless', 'Swarm restless', [[a, s.kind === 'break' ? 0.6 : 0.25]]); add('pad', 'coupling', 'Swarm pulls together', [[a, 0.3]]); } });
    const m = new Map(); out.forEach(c => { const k = c.part + '|' + c.key; if (!m.has(k)) m.set(k, Object.assign({}, c, { points: [] })); m.get(k).points.push(...c.points); });
    return Array.from(m.values());
  }
  SE.addGenre({
    id: 'now-synthwave-night', label: 'ERAVOS Now · Synthwave Night', icon: '🌆', accent: '#ff3fa4', family: 'Synth', category: 'now', curve: false,
    bpm: [100, 110], roots: [4, 9, 2, 11], scales: ['minor'], progs: [[1, 6, 3, 7], [6, 4, 1, 5], [1, 7, 6, 7]],
    tagline: 'Retro DCO bass, brass and lead (shaped filters per note, a blooming vibrato, a ratchet that speeds up), a Swarm pad that pulls together into the drop, the Synthwave Gated kit',
    form: [S('intro', 'intro', 4, ['pad', 'drums']), S('verse', 'verse', 8, ['bass', 'pad', 'drums']), S('build', 'build', 4, ['bass', 'pad', 'drums', 'lead']),
      S('drop', 'drop', 8, ['bass', 'brass', 'pad', 'drums', 'lead']), S('break', 'break', 4, ['pad', 'drums']), S('build 2', 'build', 4, ['bass', 'pad', 'drums', 'lead']),
      S('drop 2', 'drop', 8, ['bass', 'brass', 'pad', 'drums', 'lead']), S('outro', 'outro', 4, ['pad'])],
    bar: swBar, curves: swCurves,
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Retro Machines · Synthwave Gated', name: 'Drums' },
      bass: { role: 'bass', organism: 'eravos.retro-dco', preset: 'Analog Machine Bass', name: 'Bass (Retro DCO)' },
      brass: { role: 'chords', organism: 'eravos.retro-dco', preset: 'Five-Voice Brass Swell', name: 'Brass (Retro DCO)' },
      pad: { role: 'chords', organism: 'eravos.swarm-oscillator', preset: 'Blooming Chord', name: 'Swarm' },
      lead: { role: 'lead', organism: 'eravos.retro-dco', preset: 'Outrun Lead', name: 'Lead (Retro DCO)' },
    },
    fx: [{ organism: 'eravos.fx-echo', preset: '80s · Dotted Synthwave Delay', on: 'lead' }, { organism: 'eravos.sidechain-compressor', preset: 'Classic 1/4 Pump', on: 'pad' },
      { organism: 'eravos.tape-memory', preset: 'Sunbleached Reel', on: 'brass' }],
    master: { compThresh: -10, compRatio: 3, reverbMix: 0.16 },
  });

  // ======================================================================== WOBBLE LAB (140–150, half time)
  const WBR = { depth: [0, 8], wtPos: [0, 1], fmIndex: [0, 12], formantShift: [-24, 24], rateBend: [0.25, 4] };
  function wbBar(cx) {
    const p = cx.partKey, v = V(cx), b = cx.b, n = [], N = (x) => n.push(x), at = (d, o) => MT().degreeToMidi(d, o, cx.key.root, cx.key.scale), last = b === cx.sec.bars - 1;
    if (p === 'wob') {
      const r = at(cx.deg, 2);
      if (cx.kind === 'build') { N(shaped({ s: 0, l: 16, n: r, v: 0.6 + 0.35 * b / cx.sec.bars, p: { div: ['1/4', '1/8', '1/16', '1/32'][Math.min(3, Math.floor(4 * b / cx.sec.bars))] } }, { 'k:wtPos': sig([[0, 0.1], [1, 0.9]]) }, WBR)); return n; }
      if (v) {   // the second song talks: vowels per note, the formant sliding in held notes, a swap up a 4th on pass 2 of 2
        const VW = [['OO', 'AH'], ['EE', 'OO'], ['AH', 'YOI'], ['UH', 'AH']][b % 4];
        N(shaped({ s: 0, l: 6, n: r, v: 0.95, p: { vowelA: VW[0], vowelB: VW[1], div: '1/8t' } }, { 'k:formantShift': sig([[0, -4], [1, 6]], [mod('sine', 2, 2)]) }, WBR));
        N({ s: 6, l: 2, n: r, v: 0.85, p: { vowelA: 'EE', vowelB: 'YOI', div: '1/16' }, pr: 0.7 });
        N({ s: 8, l: 8, n: r + 3, v: 0.9, p: { vowelA: VW[1], vowelB: VW[0], div: '1/8' }, x: { cond: { every: 2, at: 1, skip: true } } });
        N({ s: 8, l: 8, n: r + 5, v: 0.9, p: { vowelA: 'YOI', vowelB: 'AH', div: '1/8' }, x: { cond: { every: 2, at: 1 } } });
        return n;
      }
      // the first song: the rate per note, and inside each long note the rate bends up while the wavetable sweeps; stabs ratchet both
      // ways; the phrase's last bar dives (a pitch shape whose fall stutters: a square modulator whose depth grows)
      if (b % 4 === 3) { N(shaped({ s: 0, l: 16, n: r, v: 1, p: { div: '1/8' } }, { pitch: sig([[0, 0], [0.5, 0], [1, -12]], [mod('square', 8, [[0, 0], [0.5, 0], [1, 1.5]])]), 'k:depth': sig([[0, 3], [1, 6]]) }, WBR)); return n; }
      N(shaped({ s: 0, l: 8, n: r, v: 0.95, p: { div: '1/8' } }, { 'k:rateBend': sig([[0, 1], [1, 2.5]]), 'k:wtPos': sig([[0, 0.1], [1, 0.8]]) }, WBR));
      N({ s: 8, l: 4, n: r + 12, v: 0.9, rt: 3, x: { rs: 'accel', rv: 'grow', ht: 8 } });
      N({ s: 12, l: 4, n: r, v: 0.9, rt: 5, pr: 0.8, x: { rs: 'decel', rv: 'fade' } });
      return n;
    }
    if (p === 'sub') { const r = at(cx.deg, 1); N({ s: 0, l: 12, n: r, v: 1 }); N({ s: 12, l: 4, n: r, v: 0.85, b: last && cx.kind === 'build' ? { from: 0, to: -10, shape: 'late', at: 0.4 } : undefined }); if (!n[1].b) delete n[1].b; return n; }
    if (p === 'swarm') {   // Metal Swarm stabs: a chord from one note, a laser that grows on the phrase end (its vibrato's depth has a modulator)
      const c = chordFrom(cx, 4, [2, 4]);
      if (b % 2 === 0) N({ s: v ? 6 : 0, l: 2, n: c.root, v: 0.8, x: { iv: c.iv, strum: 12 } });
      if (b % 4 === 3) N(shaped({ s: 8, l: 8, n: at(cx.deg, 5), v: 0.9 }, { pitch: sig([[0, 12], [1, -12]], [mod('sine', 12, [[0, 0], [1, 2]], { depthMods: [mod('square', 4, 0.6)] })]) }));
      return n;
    }
    if (p === 'drums') {   // half time: kick 1 and the "and" of 3, snare on 3, hats by chance, ratchet rolls into each phrase, humanized
      const H = (s, k, vv, o) => N(Object.assign({ s, l: 1, n: D(k), v: vv }, o || {}));
      if (cx.kind === 'build') { const div = [4, 2, 1, 0.5][Math.min(3, Math.floor(b / Math.max(1, cx.sec.bars / 4)))]; for (let s = 0; s < 16; s += div) H(s, 'snare', 0.3 + 0.65 * (b * 16 + s) / (cx.sec.bars * 16), { l: Math.min(1, div) }); return n; }
      if (cx.kind === 'intro' || cx.kind === 'break') { H(0, 'kick', 0.8); for (let s = 4; s < 16; s += 8) H(s, 'hat', 0.4); return n; }
      H(0, 'kick', 1); H(10, 'kick', 0.85, { pr: v ? 0.7 : 1 }); H(8, 'snare', 1); H(8, 'clap', 0.85);
      for (let s = 0; s < 16; s += 2) H(s, 'hat', s % 4 ? 0.5 : 0.75, Object.assign({ x: { ht: 6, hv: 0.1 } }, s % 4 ? { pr: 0.75 } : {}));
      if (b % 4 === 3) H(12, 'snare', 0.75, { l: 4, rt: v ? 6 : 8, x: { rs: 'accel', rv: 'grow' } });
      return n;
    }
    return null;
  }
  function wbCurves(secs) {
    const out = [], add = (part, key, name, pts, osc) => out.push(Object.assign({ part, key, name, points: pts }, osc ? { osc } : {}));
    secs.forEach(s => { const a = s.bar, e = s.bar + s.bars - 0.01;
      if (s.kind === 'build') { add('wob', 'cutoff', 'Wobble filter', [[a, 2500], [a + s.bars * 0.7, 220], [e - 0.04, 260], [e, 8000]]); add('wob', 'rateBend', 'Wobble rate bend', [[a, 1], [e, 3]]); }
      else if (s.kind === 'drop') { add('wob', 'depth', 'Wobble depth', [[a, 3], [e, 6]], { rate: '1/2', depth: 1.2, shape: 'triangle' }); add('wob', 'cutoff', 'Wobble filter', [[a, 400]]); add('wob', 'rateBend', 'Wobble rate bend', [[a, 1]]); }
      else { add('wob', 'cutoff', 'Wobble filter', [[a, 600]]); } });
    const m = new Map(); out.forEach(c => { const k = c.part + '|' + c.key; if (!m.has(k)) m.set(k, Object.assign({}, c, { points: [] })); m.get(k).points.push(...c.points); });
    return Array.from(m.values());
  }
  SE.addGenre({
    id: 'now-wobble-lab', label: 'ERAVOS Now · Wobble Lab', icon: '〰', accent: '#7cff6b', family: 'EDM', category: 'now', curve: false,
    bpm: [140, 150], roots: [5, 7, 9, 2], scales: ['minor'], progs: [[1, 1, 6, 7], [1, 6, 4, 5], [1, 3, 6, 5]],
    tagline: 'A Wobble Bass shaped per note (its rate, vowels, wavetable; ratchets both ways; a stuttering dive), a filter that closes then rips open, a Metal Swarm laser that grows',
    form: [S('intro', 'intro', 4, ['swarm', 'drums']), S('build', 'build', 8, ['wob', 'drums', 'swarm']), S('drop', 'drop', 16, ['wob', 'sub', 'drums', 'swarm']),
      S('break', 'break', 4, ['swarm', 'drums']), S('build 2', 'build', 4, ['wob', 'drums', 'sub']), S('drop 2', 'drop', 16, ['wob', 'sub', 'drums', 'swarm']), S('outro', 'outro', 4, ['swarm'])],
    bar: wbBar, curves: wbCurves,
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Dubstep Sub Layer', configure: { octave: 0 }, name: 'Sub' },
      wob: { role: 'bass', organism: 'eravos.wobble-bass', preset: ['Classic Wub 1/8', 'Yoi Talker'], name: 'Wobble' },
      swarm: { role: 'lead', organism: 'eravos.swarm-oscillator', preset: 'Metal Swarm', name: 'Swarm (Living)' },
    },
    fx: [{ organism: 'eravos.fx-destroyer', preset: 'Wub Grit · sub stays clean', on: 'wob' }, { organism: 'eravos.sidechain-compressor', preset: 'Odd · Wobble Breathes With Kick', on: 'fx0' }],
    master: { compThresh: -9, compRatio: 3.5, reverbMix: 0.08 },
  });

  const NOTE = (g) => ({ listen: 'Open any note in the Workshop (✎ Edit note…): its shape, its chord, when it plays — each made with what ERAVOS has now.', drop: g, voice: 'Her recordings fit the intro and the break.', tools: 'Retro DCO · Swarm Oscillator · Tape Memory · Wobble Bass · Retro Poly · Sub Engine · Pads · curve lanes · the Workshop’s notes' });
  const SHELF = [
    ['now1', 'Tape Hiss Diary', 'now-lofi-tape', 8102, ['warm'], 'No drop — the chorus opens the keys’ filter and the lead’s vibrato grows.'],
    ['now2', 'Rain on the Reel', 'now-lofi-tape', 8105, ['her', 'warm'], 'No drop — the break closes the filter; the tape keeps drifting.'],
    ['now3', 'Neon Cartography', 'now-synthwave-night', 8202, ['80s'], 'The swarm pulls together through the build; the lead rises a 4th and the brass swells in on the drop.'],
    ['now4', 'Midnight Voice Cards', 'now-synthwave-night', 8207, ['80s', 'dark'], 'A gallop bass, the second Swarm chord resting every other pass; the drop opens every filter.'],
    ['now5', 'Workshop Wub', 'now-wobble-lab', 8302, ['heavy', 'party'], 'The filter closes, then rips open on the last 16th; the wobble’s rate bends up and dives at every phrase end.'],
    ['now6', 'Vowel Machine', 'now-wobble-lab', 8309, ['heavy'], 'The wobble talks — a vowel per note, the formant sliding — and swaps up a 4th every other pass.'],
  ];
  const SONGS = SHELF.map(([id, title, genre, seed, mood, drop]) => Object.assign({ id, title, genre, seed, mood: ['edm'].concat(mood) }, NOTE(drop)));
  if (window.Songbook && window.Songbook.add) SONGS.forEach(window.Songbook.add);
  window.EravosNowSongbook = { genres: ['now-lofi-tape', 'now-synthwave-night', 'now-wobble-lab'], songs: SONGS.map(s => s.id) };
})();
