/* ERAVOS showcase patterns (3.171) — data only, into the Pattern Library: Lofi, Synthwave and Wobble Bass patterns that use what the
 * Workshop and the Timeline can do now, so each can be heard and opened. His words, 2026-11-12: "also can you make some patterns testing
 * all the new tools and features. lofi, synthwave, and wobblebass?"
 *   new tools     Retro DCO · Swarm Oscillator (and its Living pack) · Tape Memory under the Lofi setup's keys
 *   new features  a note's SHAPE (sh: pitch or any knob as a base + modulators whose rate and depth have modulators — fractal) ·
 *                 HOW IT PLAYS (x: a chord from one note, strum, direction, softer voices · plays / skips on pass k of N · the ratchet's
 *                 shape · humanize · the tool's speed for one note) · chance (pr) · ratchet (rt) · microtiming (mt) · a knob for one
 *                 note (p) · bend and oscillate (b)
 * Every shape is compiled here the way the Workshop compiles it (timeline.workshop.js compile(): pitch → b.path, a knob → c[key], 64 points
 * from 256 samples), so it PLAYS as written and OPENS in the Workshop as it was made. Pitches: semitones from the key's root (r); drums: pads (n). */
(function (global) {
  'use strict';
  const PL = global.PatternLibrary; if (!PL || !PL.addSource) return;
  const M = () => global.MusicParts && global.MusicParts.modTree;
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  const R2 = 36, R3 = 48, R4 = 60;
  const KICK = 36, SNARE = 37, CLAP = 38, HAT = 39, OHAT = 40;

  // ---- a shape: a base and modulators; mod(shape, rate, depth, { rate: [mods], depth: [mods], fade, phase }) nests (the fractal)
  const sig = (base, mods) => ({ base: base.map(q => q.slice()), mods: mods || [] });
  function mod(shape, rate, depth, o) {
    o = o || {}; const m = { shape, rate: sig(Array.isArray(rate) ? rate : [[0, rate], [1, rate]], o.rateMods), depth: sig(Array.isArray(depth) ? depth : [[0, depth], [1, depth]], o.depthMods), seed: o.seed || 1 };
    if (o.fade) m.fade = o.fade; if (o.phase) m.phase = o.phase; return m;
  }
  // the Workshop's compile, for data: pitch owns the bend (b.path); each knob a curve (c), clamped to its range
  function shaped(n, T, ranges) {
    const MT = M(); if (!MT) return n; n.sh = { t: T };
    if (T.pitch) { const path = MT.resample(MT.sample(T.pitch, 256), 64).map(([t, v]) => [t, clamp(v, -48, 48)]), osc = n.b && n.b.osc;
      n.b = Object.assign({ from: path[0][1], to: path[63][1], shape: 'path', at: 0, path }, osc ? { osc } : {}); }
    Object.keys(T).filter(t => t.startsWith('k:')).forEach(t => { const k = t.slice(2), r = (ranges || {})[k] || [-1e9, 1e9];
      n.c = Object.assign({}, n.c, { [k]: MT.resample(MT.sample(T[t], 256), 64).map(([x, v]) => [x, clamp(v, r[0], r[1])]) }); });
    return n;
  }

  // ======================================================================== LOFI (82 BPM, the Lofi setup's sounds)
  const LOFI = (o) => Object.assign({ genre: 'lofi-showcase', genreLabel: 'Lofi · showcase', bpm: 82, scale: 'minor', source: 'hand-made · 3.171' }, o);
  const KEYS = { tool: 'eravos.retro-poly', preset: 'Lofi Keys' }, RPR = { cutoff: [60, 16000], res: [0.3, 20], drift: [0, 1] };
  function lofiKeys() {   // i9 · iv9 · VII9 · IIImaj9, one note each, a chord from it: strummed, each voice softer, humanized, the tape drifting
    const ch = [[R3, [3, 7, 10, 14]], [R3 + 5, [3, 7, 10, 14]], [R3 - 2, [4, 7, 10, 14]], [R3 + 3, [4, 7, 11, 14]]];
    return ch.map(([r, iv], b) => shaped({ s: b * 16, l: 15, r, v: 0.62 + 0.06 * (b % 2), x: { iv, strum: 45 + 15 * (b % 3), dir: b === 2 ? 'down' : 'up', fall: 0.12, ht: 14, hv: 0.08 } },
      { pitch: sig([[0, 0], [1, 0]], [mod('smooth', 2.5, 0.07, { seed: 11 + b })]),   // wow: a slow, seeded wander, never the same twice per chord
        'k:cutoff': sig([[0, 2600], [0.25, 1500], [1, 900]], [mod('sine', 1, 120)]) }, RPR));   // the filter settles, breathing once
  }
  function lofiMelody() {   // a lazy line; long notes wobble like tape — the wobble's DEPTH has its own modulator (a modulator on a modulator)
    const line = [[0, 4, 7], [4, 2, 10], [6, 6, 12], [16, 3, 15], [19, 3, 14], [22, 10, 10], [32, 4, 7], [36, 4, 5], [40, 8, 3], [48, 2, 2], [50, 14, 0]];
    return line.map(([s, l, st], i) => { const long = l >= 6, n = { s, l, r: R4 + st, v: 0.55 + 0.1 * ((i * 7) % 3) / 2, mt: i % 3 === 1 ? 0.18 : 0, x: { ht: 10, hv: 0.06 } };
      if (!n.mt) delete n.mt; if (i % 4 === 3) n.pr = 0.7;   // a ghosted note, now and then
      if (i === 3) n.b = { from: -2, to: 0, shape: 'early' };   // a slide up into the phrase
      return long ? shaped(n, { pitch: sig([[0, 0], [1, 0]], [mod('sine', 3, 0.05, { fade: 0.3, depthMods: [mod('triangle', 1, 0.05)] })]) }) : n; });
  }
  const SUB = { tool: 'eravos.sub-engine', preset: 'Lofi Soft Sub' };
  function lofiBass() {   // roots that sigh: a slide in, a fall at the end of each bar; the turnaround only on pass 4 of 4
    const roots = [0, 5, -2, 3], out = [];
    roots.forEach((st, b) => { out.push({ s: b * 16, l: 10, r: 24 + st, v: 0.85, b: { from: -3, to: 0, shape: 'early' } });
      out.push({ s: b * 16 + 10, l: 6, r: 24 + st + (b === 3 ? 7 : 0), v: 0.7, b: { from: 0, to: -2, shape: 'late', at: 0.6 } }); });
    out.push({ s: 60, l: 4, r: 24 + 2, v: 0.75, x: { cond: { every: 4, at: 3 } } });   // a pickup only before the loop comes round
    return out;
  }
  const DUST = { tool: 'eravos.pads', preset: 'Cinematic & Lo-fi · Lo-fi Dust', drums: true };
  function lofiDrums() {   // boom bap that leans back: the snare late (microtiming), hats by chance, ghost snares, a dragging hat ratchet
    const n = [], hit = (s, p, v, o) => n.push(Object.assign({ s, l: 1, n: p, v }, o || {}));
    for (let b = 0; b < 4; b++) { const o = b * 16;
      hit(o, KICK, 0.95); hit(o + 7, KICK, 0.7, { pr: 0.6 }); hit(o + 10, KICK, 0.85);
      hit(o + 4, SNARE, 0.9, { mt: 0.15 }); hit(o + 12, SNARE, 0.9, { mt: 0.15 });
      hit(o + 9, SNARE, 0.22, { pr: 0.5 }); hit(o + 15, SNARE, 0.2, { pr: 0.45 });
      for (let s = 0; s < 16; s += 2) hit(o + s, HAT, s % 4 ? 0.4 : 0.6, Object.assign({ x: { ht: 12, hv: 0.12 } }, s % 4 ? { pr: 0.8 } : {}));
      if (b === 3) hit(o + 14, HAT, 0.5, { l: 2, rt: 4, x: { rs: 'decel', rv: 'fade' } }); }
    hit(46, OHAT, 0.5, { l: 2, x: { cond: { every: 2, at: 1 } } });   // the open hat every other pass
    return n;
  }

  // ======================================================================== SYNTHWAVE (105 BPM; Retro DCO, Swarm, the Neon Gated kit)
  const SW = (o) => Object.assign({ genre: 'synthwave-showcase', genreLabel: 'Synthwave · showcase', bpm: 105, scale: 'minor', source: 'hand-made · 3.171' }, o);
  const DCOR = { cutoff: [60, 16000], res: [0, 1], pwm: [0, 1], width: [0.05, 0.5], drive: [0, 24], envAmt: [-1, 1] };
  function outrunBass() {   // 8ths, octave pump; every note's filter snaps shut (a shaped cutoff); the last of each bar ratchets
    const roots = [0, 0, -4, -2], out = [];
    roots.forEach((st, b) => { for (let i = 0; i < 8; i++) { const s = b * 16 + i * 2, last = i === 7;
      out.push(shaped(Object.assign({ s, l: 2, r: (i % 2 ? R2 : 24) + st, v: i % 2 ? 0.78 : 0.95 }, last ? { rt: 2, x: { rs: 'accel', rv: 'grow' } } : {}),
        { 'k:cutoff': sig([[0, 2200 + 300 * (i % 2)], [0.35, 700], [1, 380]]) }, DCOR)); } });
    return out;
  }
  function brassSwell() {   // one note per bar, a five-voice chord from it; the filter swells open, a vibrato that blooms (its depth rises)
    const ch = [[R3, [3, 7, 12]], [R3 - 4, [4, 7, 11]], [R3 - 7, [4, 7, 12]], [R3 - 2, [4, 7, 10]]];
    return ch.map(([r, iv], b) => shaped({ s: b * 16, l: 16, r, v: 0.8, x: { iv, strum: 22, fall: 0.08 } },
      { 'k:cutoff': sig([[0, 500], [0.6, 3800], [1, 2600]]), pitch: sig([[0, 0], [1, 0]], [mod('sine', 22, [[0, 0], [0.4, 0], [1, 0.14]])]) }, DCOR));
  }
  function nightLead() {   // the lead: a bend into the hook, a vibrato that oscillates on held notes, a 1/16 ratchet that speeds up,
    // passing notes by chance, and one note that runs the tool twice as fast (its synced LFO doubles)
    const line = [[0, 6, 12, { b: { from: -2, to: 0, shape: 'early' } }], [6, 2, 10], [8, 4, 7, { pr: 0.75 }], [12, 4, 10],
      [16, 8, 15, { b: { from: 0, to: 0, osc: { rate: '1/16', depth: 0.25, shape: 'sine', fade: 0.4 } } }], [24, 4, 14, { rt: 4, x: { rs: 'accel', rv: 'grow' } }], [28, 4, 12],
      [32, 6, 10, { x: { tempo: 2 } }], [38, 2, 7, { pr: 0.6 }], [40, 8, 8, { b: { from: 0, to: -1, shape: 'late', at: 0.7 } }], [48, 16, 7, { b: { from: 0, to: 0, osc: { rate: '1/8', rateTo: '1/32', depth: 0.3, shape: 'sine', fade: 0.5 } } }]];
    return line.map(([s, l, st, o]) => Object.assign({ s, l, r: R4 + st, v: 0.85 }, o || {}));
  }
  const SWR = { coupling: [0, 1], cluster: [0, 1], spread: [0, 1], cutoff: [40, 18000], restless: [0, 1] };
  function swarmBloom() {   // two bars per chord: the swarm pulls together as the chord blooms (coupling rises), its cluster breathes
    // (a triangle whose RATE speeds up — a modulator on the rate), and it may skip the last chord on pass 2 of 2 (space)
    const ch = [[R3, [7, 12, 15]], [R3 - 4, [7, 11, 16]]];
    return ch.map(([r, iv], b) => shaped({ s: b * 32, l: 32, r, v: 0.7, x: Object.assign({ iv, strum: 60, dir: 'out', fall: 0.1 }, b ? { cond: { every: 2, at: 1, skip: true } } : {}) },
      { 'k:coupling': sig([[0, 0.1], [0.7, 0.85], [1, 0.7]]), 'k:cluster': sig([[0, 0.35], [1, 0.35]], [mod('triangle', 2, 0.25, { rateMods: [mod('ramp', 1, -1.5)] })]) }, SWR));
  }
  const NEON = { tool: 'eravos.pads', preset: 'Synthwave · Neon Gated', drums: true };
  function neonDrums() {   // four on the floor, gated snare + clap on 2 and 4, 16th hats humanized, offbeats by chance, a snare ratchet fill on pass 4
    const n = [], hit = (s, p, v, o) => n.push(Object.assign({ s, l: 1, n: p, v }, o || {}));
    for (let b = 0; b < 4; b++) { const o = b * 16;
      for (let k = 0; k < 16; k += 4) hit(o + k, KICK, 0.95);
      hit(o + 4, SNARE, 1); hit(o + 12, SNARE, 1); hit(o + 4, CLAP, 0.7); hit(o + 12, CLAP, 0.7);
      for (let s = 0; s < 16; s++) hit(o + s, HAT, s % 4 === 2 ? 0.7 : 0.35, Object.assign({ x: { hv: 0.15, ht: 6 } }, s % 2 ? { pr: 0.85 } : {}));
      hit(o + 14, OHAT, 0.55, { l: 2 }); }
    hit(60, SNARE, 0.8, { l: 4, rt: 6, x: { rs: 'accel', rv: 'grow', cond: { every: 4, at: 3 } } });
    return n;
  }

  // ======================================================================== WOBBLE BASS (150 BPM, half time)
  const WB = (o) => Object.assign({ genre: 'wub-showcase', genreLabel: 'Wobble Bass · showcase', bpm: 150, scale: 'minor', source: 'hand-made · 3.171' }, o);
  const WBR = { depth: [0, 8], wtPos: [0, 1], fmIndex: [0, 12], formantShift: [-24, 24], cutoff: [40, 8000], vibrato: [0, 2400], rateBend: [0.25, 4] };
  const WOB = (preset) => ({ tool: 'eravos.wobble-bass', preset });
  function rateClimb() {   // the wobble's rate per note (p.div), and INSIDE each long note the rate bends up (rateBend shaped) while the
    // wavetable sweeps; the drop's last note dives (a pitch shape whose fall has a stutter: a square modulator on it)
    const N = [[0, 8, '1/8'], [8, 4, '1/16'], [12, 4, '1/8t'], [16, 12, '1/4t'], [28, 4, '1/16']];
    const notes = N.map(([s, l, div], i) => shaped({ s, l, r: R2 + (i === 2 ? 7 : 0), v: 0.95, p: { div } },
      { 'k:rateBend': sig([[0, 1], [1, l >= 8 ? 2.5 : 1.4]]), 'k:wtPos': sig([[0, 0.1], [1, 0.8]]) }, WBR));
    notes.push(shaped({ s: 32, l: 32, r: R2, v: 1, p: { div: '1/8' } }, { pitch: sig([[0, 0], [0.5, 0], [1, -12]], [mod('square', 8, [[0, 0], [0.5, 0], [1, 1.5]])]), 'k:depth': sig([[0, 3], [1, 6]]) }, WBR));
    return notes;
  }
  function yoiTalk() {   // the vowels change per note (a knob for one note), the formant slides inside held notes; on pass 2 of 2 the
    // third note swaps up a 4th (two notes, one plays, one skips)
    const V = [['OO', 'AH'], ['EE', 'OO'], ['AH', 'YOI'], ['OO', 'EE'], ['UH', 'AH']], out = [];
    [[0, 6], [6, 2], [8, 8], [16, 6], [22, 10]].forEach(([s, l], i) => {
      const n = { s, l, r: R2 + [0, 0, 3, 0, -2][i], v: 0.9, p: { vowelA: V[i][0], vowelB: V[i][1], div: l >= 8 ? '1/8t' : '1/16' } };
      if (l >= 6) shaped(n, { 'k:formantShift': sig([[0, -4], [1, 6]], [mod('sine', 2, 2)]) }, WBR);
      if (i === 2) { n.x = { cond: { every: 2, at: 1, skip: true } }; out.push(Object.assign(JSON.parse(JSON.stringify(n)), { r: n.r + 5, x: { cond: { every: 2, at: 1 } } })); }
      out.push(n); });
    return out;
  }
  function tearout() {   // stabs that ratchet (speeding up and slowing down), a laser dive whose wobble GROWS (the depth of its vibrato is
    // a ramp with its own modulator), chance stutters, humanized hits
    const out = [];
    [[0, 4, 0, { rt: 3, x: { rs: 'accel', rv: 'grow' } }], [4, 2, 12, { pr: 0.6 }], [6, 2, 0], [8, 4, 7, { rt: 5, x: { rs: 'decel', rv: 'fade' } }], [12, 4, 0, { pr: 0.7 }]].forEach(([s, l, st, o]) =>
      out.push(Object.assign({ s, l, r: R2 + st, v: 0.95, x: { ht: 8 } }, o, o && o.x ? { x: Object.assign({ ht: 8 }, o.x) } : {})));
    out.push(shaped({ s: 16, l: 16, r: R3, v: 1 }, { pitch: sig([[0, 12], [1, -24]], [mod('sine', 12, [[0, 0], [1, 2]], { depthMods: [mod('square', 4, 0.6)] })]), 'k:fmIndex': sig([[0, 1], [1, 9]]) }, WBR));
    return out;
  }
  function riddim() {   // half-time square: two notes run the tool at double speed (its synced wobble at twice the rate), stutters by chance
    const out = [];
    [[0, 6, 0], [8, 2, 0, { pr: 0.55 }], [10, 2, 0, { pr: 0.55 }], [12, 4, 3, { x: { tempo: 2 } }], [16, 6, 0], [24, 4, -2, { x: { tempo: 2 } }], [28, 4, 0, { rt: 2 }]].forEach(([s, l, st, o]) =>
      out.push(Object.assign({ s, l, r: R2 + st, v: 0.95 }, o || {})));
    return out;
  }

  PL.addSource(() => [
    LOFI(Object.assign({ name: 'Lofi keys: lazy 9ths, strummed, the tape drifting', type: 'chords', bars: 4, notes: lofiKeys() }, KEYS)),
    LOFI(Object.assign({ name: 'Lofi melody: a line that wobbles like tape', type: 'lead', bars: 4, notes: lofiMelody() }, KEYS)),
    LOFI(Object.assign({ name: 'Lofi bass: a sub that sighs, a pickup on pass 4', type: 'bass', bars: 4, notes: lofiBass() }, SUB)),
    LOFI(Object.assign({ name: 'Lofi drums: a late snare, hats by chance, a dragging ratchet', type: 'drums', bars: 4, notes: lofiDrums() }, DUST)),
    SW(Object.assign({ name: 'Outrun bass: 8ths, the filter snaps shut on every note', type: 'bass', bars: 4, notes: outrunBass() }, { tool: 'eravos.retro-dco', preset: 'Analog Machine Bass' })),
    SW(Object.assign({ name: 'Brass swell: a chord from one note, a vibrato that blooms', type: 'chords', bars: 4, notes: brassSwell() }, { tool: 'eravos.retro-dco', preset: 'Five-Voice Brass Swell' })),
    SW(Object.assign({ name: 'Night drive lead: bends, a ratchet that speeds up, a note at double speed', type: 'lead', bars: 4, notes: nightLead() }, { tool: 'eravos.retro-dco', preset: 'Outrun Lead' })),
    SW(Object.assign({ name: 'Swarm bloom: the swarm pulls together as the chord opens', type: 'chords', bars: 4, notes: swarmBloom() }, { tool: 'eravos.swarm-oscillator', preset: 'Blooming Chord' })),
    SW(Object.assign({ name: 'Neon drums: gated snare, humanized 16ths, a ratchet fill on pass 4', type: 'drums', bars: 4, notes: neonDrums() }, NEON)),
    WB(Object.assign({ name: 'Wobble: the rate climbs inside each note, a stuttering dive', type: 'wobble', bars: 4, notes: rateClimb() }, WOB('Classic Wub 1/8'))),
    WB(Object.assign({ name: 'Yoi talk: vowels per note, the formant slides, a swap on pass 2', type: 'wobble', bars: 2, notes: yoiTalk() }, WOB('Yoi Talker'))),
    WB(Object.assign({ name: 'Tearout: ratchets both ways, a laser dive that grows', type: 'drop', bars: 2, notes: tearout() }, WOB('Tearout Screech'))),
    WB(Object.assign({ name: 'Riddim: half-time square, two notes at double speed', type: 'wobble', bars: 2, notes: riddim() }, WOB('Riddim Square 1/16t')))
  ]);
  global.ShowcasePatterns = { shaped, sig, mod };
})(typeof window !== 'undefined' ? window : globalThis);
