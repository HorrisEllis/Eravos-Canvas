/* ERAVOS deep songbook (3.188) — data only. Spec: specs/eravos.deep-songs.spec · research: docs/research/landmark-songs-techniques.md.
 * His words (2026-11-14): "can you look at every major song of all synthwave, edm, dubstep, electronic, etc to make a wide contrast of songs per
 * catagory that are as complex and deep as eravos can be. like per note edits, automation, tools wired to other tools, etc. curves, etc. as
 * deep as possiblr" · carried: "stop making new catagories" (2026-11-12) — every genre id lands on a shelf that exists (Songbook CATS).
 * One song per sub-style, so a shelf holds six songs as different as the style allows — each its own form, tempo, groove and palette — and
 * each uses all of it: per-note knobs (p) and knob curves inside a note (c), bends with their own LFO, chords from one note, plays-on-pass-k,
 * chance, ratchets that speed up and grow, microtiming swing, humanize; curve lanes on instruments, effects and modulators; LFOs, the XY Pad,
 * and tools / effects driving other tools (sidechain envelopes, Swarm coherence, tape dropouts, gain reduction, Bass Forge's talk LFO).
 * Technique from the landmark records, never their notes ("technique not copies", 3.36). Batch 1: 80s · Synth and Dubstep. */
(function () {
  'use strict';
  const SE = window.SongEngine; if (!SE) return;
  const MT = () => window.MusicTheory, PAD = SE.helpers.PAD, D = (k) => 36 + PAD[k];
  const S = (name, kind, bars, play, o) => Object.assign({ name, kind, bars, play }, o || {});
  const clampMt = (x) => Math.max(-0.45, Math.min(0.45, x));
  // a bar's pen: at(degree, octave) in key; N(step, length, note, velocity, extra) → the note (so a caller can add to it)
  function pen(cx) { const at = (d, o) => MT().degreeToMidi(d, o, cx.key.root, cx.key.scale), n = [];
    const N = (s, l, m, v, x) => { const q = Object.assign({ s, l, n: m, v: v == null ? 0.9 : v }, x || {}); n.push(q); return q; }; return { n, N, at }; }
  const chord = (at, deg, o, tones) => { const r = at(deg, o); return { root: r, iv: tones.map(t => at(deg + t, o) - r) }; };
  // drums with depth — a lane is 16 characters: X accent · x hit · o ghost (plays by chance) · r a roll (a ratchet that speeds up and grows) · .
  // o.swing: every second 16th late (microtiming) · o.late: { lane: late by } · o.hum: humanize per pass (ms) · o.roll: hits in a roll
  function kit(N, pats, o) { o = o || {};
    Object.keys(pats || {}).forEach(lane => { const str = pats[lane]; if (!str) return;
      for (let s = 0; s < 16; s++) { const c = str[s % str.length]; if (c === '.' || c === ' ') continue;
        const x = {}, v = c === 'X' ? 1 : c === 'x' ? 0.78 : c === 'o' ? 0.4 : 0.6;
        if (c === 'o') x.pr = o.ghost || 0.55;
        if (c === 'r') { x.rt = o.roll || 3; x.x = { rs: 'accel', rv: 'grow' }; }
        let mt = (o.swing && s % 2 === 1 ? o.swing : 0) + ((o.late && o.late[lane]) || 0); if (mt) x.mt = clampMt(mt);
        if (o.hum) x.x = Object.assign({}, x.x || {}, { ht: o.hum, hv: 0.08 });
        N(s, 1, D(lane), v, x); } }); }
  // curve lanes: add(part, key, name, points [[bar, value]…], osc?) — one lane per part + key, its points merged in time
  function lanes() { const out = [];
    return { add: (part, key, name, points, osc) => out.push(Object.assign({ part, key, name, points }, osc ? { osc } : {})),
      done: () => { const m = new Map(); out.forEach(c => { const k = c.part + '|' + c.key; if (!m.has(k)) m.set(k, Object.assign({}, c, { points: [] })); const t = m.get(k); t.points.push(...c.points); if (c.osc) t.osc = c.osc; });
        return Array.from(m.values()).map(c => Object.assign(c, { points: c.points.sort((a, b) => a[0] - b[0]) })); } }; }
  const swells = (a, e, every, lo, hi) => { const p = []; for (let b = a; b < e; b += every) p.push([b, lo], [b + every * 0.8, hi], [b + every * 0.98, lo]); return p; };
  const GENRES = [], SONGS = [];
  const add = (g, song) => { SE.addGenre(g); GENRES.push(g.id); SONGS.push(Object.assign({ genre: g.id, mood: ['edm'] }, song)); };

  // ===================================================================================================== 🌆 80s · SYNTH
  // ---- 1. Nightdrive — Kavinsky's Nightcall / A Real Hero: slow, half-time, a gated snare, a talking lead, no drop (the chorus lifts by
  //         opening, not by adding drums). The lead is a Wobble Bass made to talk: each note its vowel, the vowel opening inside the note.
  add({ id: 'deepwave-nightdrive', label: 'Nightdrive (talk-box, half-time)', icon: '🌃', accent: '#ff3caa', family: 'Synth', impact: false,
    bpm: [88, 92], roots: [9, 4, 2], scales: ['minor'], progs: [[1, 6, 3, 7], [1, 7, 6, 7]], leadRhythm: 'sparse', drums: { main: {} },
    tagline: 'Slow and half-time: a gated snare, a lead that talks (its vowel opens inside every note), a chorus that lifts by opening the filters; the sidechain’s envelope breathes the pad’s filter',
    form: [S('intro', 'intro', 8, ['pad', 'bass']), S('verse', 'verse', 16, ['drums', 'bass', 'sub', 'pad', 'talk']), S('chorus', 'chorus', 16, ['drums', 'bass', 'sub', 'pad', 'talk', 'brass']),
      S('verse 2', 'verse', 16, ['drums', 'bass', 'sub', 'pad', 'talk']), S('chorus 2', 'chorus', 16, ['drums', 'bass', 'sub', 'pad', 'talk', 'brass']), S('bridge', 'break', 8, ['pad', 'talk']),
      S('chorus 3', 'chorus', 16, ['drums', 'bass', 'sub', 'pad', 'talk', 'brass', 'swarm']), S('outro', 'outro', 8, ['pad', 'bass'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Retro Machines · Synthwave Gated', name: 'Drums' },
      bass: { role: 'bass', organism: 'eravos.retro-dco', preset: 'Analog Machine Bass', name: 'Bass (Retro DCO)', configure: { level: 0.8 } },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Deep Sine', name: 'Sub', configure: { level: 0.45 } },
      pad: { role: 'chords', organism: 'eravos.retro-poly', preset: '80s · Blade Runner Pad', name: 'Pad', configure: { level: 0.35 } },
      talk: { role: 'lead', organism: 'eravos.wobble-bass', preset: 'Yoi Drawn Talker', name: 'Talking lead (Wobble Bass)', configure: { octave: 1, depth: 0, lfoSync: false, lfoHz: 0.02, ampMod: 0, drive: 0.15, shaper: 0, res: 4, level: 0.45 } },   // his ear (2026-11-14): "around .57 seconds, it sounds bad with the wobble" — the preset's drawn 1/8 LFO stopped; the talking is the vowel per note
      brass: { role: 'chords', organism: 'eravos.retro-dco', preset: 'Five-Voice Brass Swell', name: 'Brass', configure: { level: 0.55 } },
      swarm: { role: 'chords', organism: 'eravos.swarm-oscillator', preset: 'Blooming Chord', name: 'Swarm', configure: { level: 0.3 } },
    },
    bar(cx) { const { partKey: p, kind, b, deg, sec } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1;
      if (p === 'drums') { kit(N, { kick: 'X.........x.....', snare: '........X.......', hat: 'x.o.x.o.x.o.x.o.', tom: last ? '............xxxr' : '' }, { late: { snare: 0.12 }, hum: 8, roll: 4 }); return n; }
      if (p === 'bass') { const r = at(deg, 2);   // long roots; inside each note the filter opens and closes (a knob curve per note); an octave answer by chance
        N(0, kind === 'intro' || kind === 'outro' ? 16 : 10, r, 0.9, { c: { cutoff: [[0, 300], [0.25, 1600], [1, 500]] } });
        if (kind !== 'intro' && kind !== 'outro') N(12, 3, r + 12, 0.7, { pr: 0.6, c: { cutoff: [[0, 2200], [1, 600]] } }); return n; }
      if (p === 'sub') { N(0, 16, at(deg, 1), 0.8); return n; }
      if (p === 'pad') { const c = chord(at, deg, 3, [2, 4, 6]); N(0, 16, c.root, 0.65, { x: { iv: c.iv, strum: 40, fall: 0.06 } }); return n; }
      if (p === 'talk') { const ph = b % 4, vow = [-6, 4, 0, -3][ph], hi = at(deg + 4, 4), mid = at(deg + 2, 4), lo = at(deg, 4);
        const t = { p: { formantShift: vow }, c: { formantShift: [[0, vow - 8], [0.4, vow + 4], [1, vow + 8]] }, x: { ht: 12, hv: 0.06 } };
        if (kind === 'verse' || kind === 'break') { if (ph % 2) return n; N(2, 10, lo, 0.85, Object.assign({ b: { from: -3, to: 0, shape: 'early', osc: { rate: 5, depth: 0.25, shape: 'sine', fade: 0.6 } } }, t)); N(12, 4, mid, 0.7, Object.assign({ pr: 0.7 }, t)); return n; }
        N(0, 6, hi, 0.95, Object.assign({ b: { from: -2, to: 0, shape: 'early' } }, t)); N(6, 2, mid, 0.8, t); N(8, 8, ph === 3 ? at(deg + 5, 4) : lo, 0.95, Object.assign({ b: { from: 0, to: 0, osc: { rate: 5.5, depth: 0.3, shape: 'sine', fade: 0.5 } } }, t));
        if (ph === 3) N(14, 2, hi, 0.6, { x: { cond: { every: 2, at: 1 } }, rt: 3 }); return n; }
      if (p === 'brass') { if (b % 2) return n; const c = chord(at, deg, 4, [2, 4]); N(0, 32, c.root, 0.75, { x: { iv: c.iv, strum: 25, fall: 0.08, cond: b % 4 ? { every: 2, at: 1 } : undefined } }); return n; }
      if (p === 'swarm') { if (b % 4) return n; const c = chord(at, deg, 3, [4, 7]); N(0, 64, c.root, 0.6, { x: { iv: c.iv, strum: 70, dir: 'out' } }); return n; }
      return null; },
    curves(secs) { const L = lanes();
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
        L.add('pad', 'cutoff', 'Pad opens', [[a, s.kind === 'chorus' ? 2600 : s.kind === 'break' ? 700 : 1200], [e - 0.05, s.kind === 'chorus' ? 4200 : 1500]]);
        L.add('talk', 'cutoff', 'Talk brightness', [[a, s.kind === 'chorus' ? 3200 : 1600]]);
        L.add('fx1', 'mix', 'Talk echo throws', s.kind === 'chorus' ? swells(a, e, 4, 0.18, 0.5) : [[a, 0.25]]);
        L.add('fx2', 'wear', 'Pad tape wear', [[a, s.kind === 'break' ? 0.75 : s.kind === 'outro' ? 0.4 : 0.2], [e - 0.05, s.kind === 'outro' ? 1 : s.kind === 'break' ? 0.85 : 0.2]]);
        L.add('mod0', 'rate', 'Pad drift speed', [[a, s.kind === 'break' ? 0.6 : 0.08]]);
        L.add('mod1', 'posX', 'XY · X (talk vowel)', s.kind === 'chorus' ? [[a, 0.2], [a + s.bars / 2, 0.8], [e - 0.05, 0.4]] : [[a, 0.3]]);
        L.add('mod1', 'posY', 'XY · Y (echo feedback)', [[a, s.kind === 'break' ? 0.8 : 0.3]]);
        if (s.kind === 'chorus') L.add('brass', 'cutoff', 'Brass swells', swells(a, e, 2, 900, 3600));
        L.add('fx3', 'depth', 'Pad pump', [[a, s.kind === 'chorus' ? 0.6 : 0.3]]); L.add('talk', 'vibrato', 'Talk vibrato', [[a, 0], [e - 0.05, s.kind === 'chorus' ? 60 : 20]]);
        L.add('fx0', 'gateRange', 'Snare gate', [[a, s.kind === 'chorus' ? 60 : 40]]); L.add('bass', 'drive', 'Bass drive', [[a, s.kind === 'chorus' ? 8 : 3]]);
        if (s.name === 'chorus 3') L.add('swarm', 'coupling', 'Swarm locks', [[a, 0.1], [e - 0.05, 0.9]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.fx-dynamics', preset: '80s Gated Snare', on: 'drums' }, { organism: 'eravos.fx-echo', preset: '80s · Dotted Synthwave Delay', on: 'talk' },
      { organism: 'eravos.tape-memory', preset: 'Sunbleached Reel', on: 'pad' }, { organism: 'eravos.sidechain-compressor', preset: 'Half-time 1/2', on: 'fx2' }],
    mods: [{ organism: 'eravos.lfo', preset: '80s · Slow Juno Drift', to: 'pad', key: 'cutoff' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.5, maxY: 0.5 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'talk', key: 'knob.formantShift' }, { from: 'mod1', out: 'y', to: 'fx1', key: 'feedback' }, { from: 'fx3', out: 'env', to: 'fx1', key: 'mix' }],
    master: { compThresh: -12, compRatio: 2.5, reverbMix: 0.2 },
  }, { id: 'dp-nightdrive', title: 'Nightdrive Talk', seed: 8801, mood: ['80s', 'dark'],
    listen: 'Half-time and slow: the lead talks — every note its own vowel, opening inside the note. The chorus lifts by opening the filters, not by adding drums.', drop: 'No drop: a third chorus where the Swarm blooms and locks.', voice: 'Her voice in the bridge, over the worn pad.' });

  // ---- 2. Outrun Key Change — Lazerhawk / Mitch Murder / FM-84: driving, an octave bass that never stops, the Arp under everything, a guitar
  //         solo on a fuzzed lead, and the classic last chorus up a whole step — made as a Pitch curve on every instrument (the notes stay in key).
  add({ id: 'deepwave-outrun', label: 'Outrun (the last chorus up a step)', icon: '🏎', accent: '#ff7a00', family: 'Synth', impact: false,
    bpm: [116, 120], roots: [4, 9, 11], scales: ['minor'], progs: [[1, 6, 7, 1], [1, 7, 6, 5]], leadRhythm: 'anthem', drums: { main: {} },
    tagline: 'Driving: an octave bass that never stops, the Arp playing a DCO pluck, a fuzzed solo that bends and trills, and the last chorus up a whole step (a Pitch curve on every instrument)',
    form: [S('intro', 'intro', 8, ['bass', 'arp']), S('verse', 'verse', 16, ['drums', 'bass', 'arp', 'pad']), S('chorus', 'chorus', 16, ['drums', 'bass', 'arp', 'pad', 'lead', 'brass']),
      S('solo', 'break', 16, ['drums', 'bass', 'arp', 'pad', 'lead']), S('lift', 'build', 4, ['drums', 'pad', 'riser']), S('key change', 'chorus', 16, ['drums', 'bass', 'arp', 'pad', 'lead', 'brass']), S('outro', 'outro', 8, ['bass', 'arp', 'pad'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Retro Machines · Synthwave Gated', name: 'Drums' },
      bass: { role: 'bass', organism: 'eravos.retro-dco', preset: 'Analog Machine Bass', name: 'Bass (octaves)', configure: { level: 0.75 } },
      arp: { role: 'chords', organism: 'eravos.arp', style: 'sustain', voicing: 'seventh', octave: 4, repeat: true, name: 'Arp', configure: { order: 'up', div: '1/16', octaves: 2, gate: 0.4, restart: 'notes' } },
      pluck: { role: 'keys', organism: 'eravos.retro-dco', preset: 'Arcade Pulse', name: 'Pluck (the Arp plays it)', configure: { level: 0.35 } },
      pad: { role: 'chords', organism: 'eravos.supersaw', preset: '80s · Hyperspace Pad', name: 'Pad', configure: { level: 0.3 } },
      lead: { role: 'lead', organism: 'eravos.retro-dco', preset: 'Outrun Lead', name: 'Lead (fuzzed)', configure: { level: 0.6 } },
      brass: { role: 'chords', organism: 'eravos.retro-poly', preset: 'Brass Stab \'84', name: 'Brass stabs', configure: { level: 0.5 } },
      riser: { role: 'lead', organism: 'eravos.curve-synth', preset: 'Siren', name: 'Riser', configure: { level: 0.4 } },
    },
    wires: [[['arp', 'arp.hook.note_out'], ['pluck', 'rd.hook.note_in']]],
    bar(cx) { const { partKey: p, kind, b, deg, sec, seed } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1;
      if (p === 'drums') { if (kind === 'build') { for (let s = 0; s < 16; s += b === 3 ? 1 : 2) N(s, 1, D(b === 3 ? 'snare' : 'tom'), 0.4 + 0.5 * (b * 16 + s) / 64); return n; }
        kit(N, { kick: 'X...x...X...x...', snare: '....X.......X...', clap: kind === 'chorus' ? '....x.......x...' : '', hat: 'xoxoxoxoxoxoxoxo', crash: b === 0 && kind === 'chorus' ? 'X...............' : '', tom: last ? '........x.x.xxxr' : '' }, { ghost: 0.5, hum: 5, roll: 4 }); return n; }
      if (p === 'bass') { const r = at(deg, 1);   // octave-jumping 8ths, each note's filter set by where it falls (the accent pattern), a run into the next bar
        for (let s = 0; s < 16; s += 2) N(s, 1.6, r + (s % 4 ? 12 : 0), s % 4 ? 0.75 : 0.95, { p: { cutoff: s % 8 === 0 ? 2600 : s % 4 ? 1400 : 1900 } });
        if (b % 4 === 3) N(14, 2, at(deg + 4, 1), 0.9, { rt: 2, x: { rs: 'accel' } }); return n; }
      if (p === 'lead') { const ph = (b + seed) % 4, hi = at(deg + 4, 5), mid = at(deg + 2, 5), lo = at(deg, 5), top = at(deg + 7, 5);
        if (kind === 'break') {   // the solo: runs, bends from below, trills (ratchets), a passing note by chance, the vibrato blooming
          if (ph === 0) { [0, 1, 2, 3, 4, 5].forEach((k, i) => N(i * 2, 2, at(deg + k, 5), 0.8 + 0.03 * i, { mt: 0.05 })); N(12, 4, top, 1, { b: { from: -2, to: 0, shape: 'early', osc: { rate: 6, depth: 0.35, shape: 'sine', fade: 0.4 } } }); }
          else if (ph === 1) { N(0, 4, hi, 0.95, { rt: 4, x: { rs: 'accel', rv: 'grow' } }); N(4, 4, mid, 0.85, { b: { from: 0, to: -1, shape: 'late', at: 0.5 } }); N(8, 8, lo, 1, { b: { from: -5, to: 0, shape: 'early', osc: { rate: 6.5, depth: 0.4, shape: 'sine', fade: 0.5 } } }); }
          else if (ph === 2) { N(0, 2, top, 1, { b: { from: 2, to: 0, shape: 'early' } }); N(2, 2, hi, 0.8, { pr: 0.6 }); N(4, 4, mid, 0.9); N(8, 4, hi, 0.95, { p: { lfoPitch: 40 } }); N(12, 4, top, 1, { b: { from: 0, to: 2, shape: 'late', at: 0.3 } }); }
          else { N(0, 12, at(deg + 9, 5), 1, { b: { from: -12, to: 0, shape: 'early', osc: { rate: 6, depth: 0.45, shape: 'sine', fade: 0.3 } }, c: { cutoff: [[0, 1500], [0.4, 6000], [1, 3500]] } }); N(12, 4, hi, 0.7, { rt: 6, x: { rs: 'decel', rv: 'fade' } }); }
          return n; }
        if (ph % 2 === 0) { N(0, 6, hi, 0.95, { b: { from: -2, to: 0, shape: 'early' } }); N(6, 2, mid, 0.8); N(8, 8, lo, 0.95, { b: { from: 0, to: 0, osc: { rate: 5.5, depth: 0.3, shape: 'sine', fade: 0.5 } } }); }
        else { N(0, 4, mid, 0.9); N(4, 4, hi, 0.95); N(8, 8, top, 1, { b: { from: -3, to: 0, shape: 'early', osc: { rate: 5.5, depth: 0.25, shape: 'sine', fade: 0.6 } } }); }
        return n; }
      if (p === 'brass') { const c = chord(at, deg, 4, [2, 4]); [2, 6, 10, 14].forEach((s, i) => N(s, 1.5, c.root, i % 2 ? 0.7 : 0.85, { x: { iv: c.iv, strum: 8, cond: i === 3 ? { every: 2, at: 1 } : undefined } })); return n; }
      if (p === 'riser' && kind === 'build') { if (b === 0) N(0, 64, at(deg, 4), 0.8, { b: { from: -12, to: 7, shape: 'late', at: 0 } }); return n; }
      return null; },
    curves(secs) { const L = lanes(), PITCHED = ['bass', 'arp', 'pluck', 'pad', 'lead', 'brass'];
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars, up = s.name === 'key change' || s.name === 'outro';
        PITCHED.forEach(p => L.add(p, '@pitch', 'Key change (up a whole step)', [[a, up ? 2 : 0]]));
        L.add('arp', 'octaves', 'Arp octaves', [[a, s.kind === 'chorus' ? 3 : s.kind === 'break' ? 2 : 1]]); L.add('arp', 'gate', 'Arp gate', [[a, 0.3], [e - 0.05, s.kind === 'chorus' ? 0.8 : 0.5]]);
        L.add('arp', 'div', 'Arp rate', [[a, s.kind === 'intro' || s.kind === 'outro' ? '1/8' : '1/16']]);
        L.add('pluck', 'cutoff', 'Pluck filter', [[a, s.kind === 'intro' ? 600 : 1800], [e - 0.05, s.kind === 'intro' ? 3000 : 4200]]);
        L.add('lead', 'lfoPitch', 'Lead vibrato', [[a, 4], [e - 0.05, s.kind === 'break' ? 40 : 18]]);
        L.add('fx0', 'drive', 'Solo fuzz', [[a, s.kind === 'break' ? 0.75 : 0.35]]); L.add('fx1', 'feedback', 'Lead echo feedback', s.kind === 'break' ? swells(a, e, 4, 0.3, 0.7) : [[a, 0.3]]);
        L.add('mod0', 'depth', 'Pluck swirl depth', [[a, s.kind === 'chorus' ? 0.7 : 0.3]]);
        L.add('mod1', 'posX', 'XY · X (pluck filter)', [[a, 0.3], [e - 0.05, s.kind === 'build' ? 1 : 0.6]]); L.add('mod1', 'posY', 'XY · Y (fuzz)', [[a, s.kind === 'break' ? 0.8 : 0.2]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.fx-destroyer', preset: 'Fuzz Box', on: 'lead' }, { organism: 'eravos.fx-echo', preset: '80s · Dotted Synthwave Delay', on: 'fx0' },
      { organism: 'eravos.fx-moddelay', preset: '80s · Juno Chorus II', on: 'pad' }, { organism: 'eravos.sidechain-compressor', preset: 'Classic 1/4 Pump', on: 'fx2' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Pan Swirl', to: 'pluck', key: 'cutoff' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.4, maxY: 0.5 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'pluck', key: 'cutoff' }, { from: 'mod1', out: 'y', to: 'fx0', key: 'drive' }, { from: 'fx3', out: 'env', to: 'fx1', key: 'mix' }],
    master: { compThresh: -11, compRatio: 3, reverbMix: 0.14 },
  }, { id: 'dp-outrun', title: 'Outrun Key Change', seed: 8802, mood: ['80s', 'party'],
    listen: 'The bass jumps octaves and never stops; the Arp plays a pluck under everything. A fuzzed solo bends, trills and blooms its vibrato.', drop: 'After a 4-bar lift the last chorus goes up a whole step — a Pitch curve on every instrument.', voice: 'Her voice over the lift.' });

  // ---- 3. Turbo Breakdown — Carpenter Brut / Perturbator: darksynth at full speed, distorted 16th bass, glitching stabs, a half-time
  //         breakdown and a blast back. The sidechain's envelope opens the lead; the XY Pad drives the bass and the glitch.
  add({ id: 'deepwave-darksynth', label: 'Darksynth (breakdown and blast)', icon: '🩸', accent: '#d0142c', family: 'Synth',
    bpm: [124, 128], roots: [1, 4, 6], scales: ['phrygian', 'minor'], progs: [[1, 2, 1, 7], [1, 1, 6, 7]], leadRhythm: 'sparse', drums: { main: {} },
    tagline: 'Darksynth at full speed: a distorted 16th bass whose drive is set note by note, glitching stabs, a half-time breakdown and a blast back; the sidechain’s envelope opens the lead, the XY Pad drives the bass and the glitch',
    form: [S('intro', 'intro', 8, ['pad', 'drums']), S('verse', 'verse', 16, ['drums', 'bass', 'stabs', 'pad']), S('build', 'build', 8, ['drums', 'bass', 'pad', 'riser']),
      S('drop', 'drop', 16, ['drums', 'bass', 'stabs', 'lead', 'pad']), S('breakdown', 'break', 8, ['drums', 'pad', 'lead']), S('blast', 'build', 8, ['drums', 'bass', 'stabs', 'riser']),
      S('drop 2', 'drop', 16, ['drums', 'bass', 'stabs', 'lead', 'pad']), S('outro', 'outro', 8, ['pad', 'drums'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Techno & Hard · Industrial', name: 'Drums' },
      bass: { role: 'bass', organism: 'eravos.retro-dco', preset: 'Sub Growl', name: 'Bass (driven)', configure: { level: 0.7 } },
      stabs: { role: 'chords', organism: 'eravos.retro-poly', preset: 'Darksynth Saw', name: 'Stabs', configure: { level: 0.45 } },
      lead: { role: 'lead', organism: 'eravos.retro-dco', preset: 'Coldwave Lead', name: 'Lead', configure: { level: 0.55 } },
      pad: { role: 'chords', organism: 'eravos.pad-forge', preset: 'Dark Choir', name: 'Choir', configure: { level: 0.35 } },
      riser: { role: 'lead', organism: 'eravos.curve-synth', preset: 'Drop Whoop', name: 'Riser', configure: { level: 0.35 } },
    },
    bar(cx) { const { partKey: p, kind, b, deg, sec } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1;
      if (p === 'drums') {
        if (kind === 'build') { const q = Math.min(3, Math.floor(4 * b / sec.bars)); for (let s = 0; s < 16; s += [4, 2, 1, 1][q]) N(s, 1, D('snare'), 0.3 + 0.6 * (b * 16 + s) / (sec.bars * 16)); if (q < 2) kit(N, { kick: 'X...X...X...X...' }); if (last) N(12, 4, D('snare'), 0.9, { rt: 8, x: { rs: 'accel', rv: 'grow' } }); return n; }
        if (kind === 'break') { kit(N, { kick: 'X...............', snare: '........X.......', hat: 'x...x...x...x...', tom: last ? '........xxxxxxxr' : '' }, { late: { snare: 0.1 } }); return n; }   // half time
        if (kind === 'intro' || kind === 'outro') { kit(N, { kick: 'X.......X.......', hat: '..x...x...x...x.' }); return n; }
        kit(N, { kick: 'X...X...X...X.x.', snare: '....X.......X...', clap: '....X.......X..o', hat: 'xxxxxxxxxxxxxxxx', crash: b % 8 === 0 ? 'X...............' : '' }, { ghost: 0.45 }); return n; }
      if (p === 'bass') { const r = at(deg, 1);   // 16ths; the drive set note by note (accents dirtier), the last beat of a phrase a fall
        for (let s = 0; s < 16; s++) { if (b % 4 === 3 && s >= 12) { if (s === 12) N(12, 4, r, 1, { b: { from: 0, to: -12, shape: 'late', at: 0.3 } }); continue; } N(s, 0.85, s % 8 === 6 ? r + 12 : r, s % 4 ? 0.72 : 1, { p: { drive: s % 4 ? 8 : 18 } }); }
        return n; }
      if (p === 'stabs') { const c = chord(at, deg, 4, [2, 4, 7]); [0, 3, 6, 10].forEach((s, i) => N(s, 1, c.root, i ? 0.8 : 1, { x: { iv: c.iv, strum: 0, ht: 6, hv: 0.08, cond: i === 2 ? { every: 2, at: 1 } : undefined } })); N(14, 2, c.root, 0.7, { x: { iv: c.iv, rs: 'accel', rv: 'grow' }, rt: 4 }); return n; }
      if (p === 'lead') { const hi = at(deg + 4, 5), lo = at(deg, 5);
        if (kind === 'break') { N(0, 32, lo, 0.85, { b: { from: 0, to: 0, osc: { rate: '1/4', rateTo: '1/16', depth: 0.6, shape: 'triangle', fade: 0.2 } } }); return b % 2 ? [] : n; }
        N(0, 3, hi, 1); N(3, 3, at(deg + 3, 5), 0.85); N(6, 2, at(deg + 2, 5), 0.8, { pr: 0.7 }); N(8, 8, lo, 1, { b: { from: 0, to: last ? -12 : 0, shape: 'late', at: 0.5, osc: { rate: 6, depth: 0.3, shape: 'sine', fade: 0.4 } }, c: { cutoff: [[0, 5000], [1, 1500]] } }); return n; }
      if (p === 'pad') { const c = chord(at, deg, 3, [2, 4]); N(0, 16, c.root, 0.6, { x: { iv: c.iv, strum: 60 } }); return n; }
      if (p === 'riser') { if (b === 0) N(0, sec.bars * 16, at(deg, 4), 0.8, { b: { from: -12, to: 12, shape: 'late', at: 0 } }); return n; }
      return null; },
    curves(secs) { const L = lanes();
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
        if (s.kind === 'build') { L.add('bass', 'cutoff', 'Bass opens', [[a, 300], [e - 0.05, 9000]]); L.add('fx2', 'mix', 'Glitch rises', [[a, 0], [e - 0.05, 0.8], [e, 0.15]]); L.add('mod1', 'posX', 'XY · X (bass drive)', [[a, 0], [e - 0.05, 1]]); }
        else { L.add('bass', 'cutoff', 'Bass opens', [[a, s.kind === 'drop' ? 4200 : 1500]]); L.add('fx2', 'mix', 'Glitch rises', [[a, s.kind === 'drop' ? 0.2 : 0.05]]); L.add('mod1', 'posX', 'XY · X (bass drive)', [[a, s.kind === 'drop' ? 0.6 : 0.2]]); }
        L.add('stabs', 'cutoff', 'Stabs bite', s.kind === 'drop' ? swells(a, e, 1, 1200, 5200) : [[a, 1500]]);
        L.add('fx4', 'mix', 'Lead echo throws', s.kind === 'break' ? [[a, 0.6]] : [[a, 0.2], [e - 1, 0.2], [e - 0.05, 0.7]]);
        L.add('mod0', 'rate', 'Random speed', [[a, s.kind === 'drop' ? 8 : 4]]); L.add('mod1', 'posY', 'XY · Y (glitch)', [[a, s.kind === 'drop' ? 0.5 : 0.1]]);
        if (s.kind === 'break') L.add('pad', 'bloom', 'Choir blooms', [[a, 0.2], [e - 0.05, 0.9]]); L.add('lead', 'lfoPitch', 'Lead vibrato', [[a, 4], [e - 0.05, s.kind === 'break' ? 50 : 15]]); L.add('fx0', 'drive', 'Bass grit', [[a, s.kind === 'drop' ? 0.75 : 0.45]]); L.add('fx1', 'amount', 'Bass OTT', [[a, s.kind === 'drop' ? 0.8 : 0.4]]); L.add('fx3', 'depth', 'Choir pump', [[a, s.kind === 'drop' ? 0.75 : 0.4]]); L.add('pad', 'shimmer', 'Choir shimmer', [[a, 0.2], [e - 0.05, s.kind === 'outro' ? 0.8 : 0.3]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.fx-destroyer', preset: 'Bass Grit (parallel)', on: 'bass' }, { organism: 'eravos.fx-squash', preset: 'OTT Growl', on: 'fx0' }, { organism: 'eravos.fx-glitch', preset: 'Stutter 1/16', on: 'stabs' },
      { organism: 'eravos.sidechain-compressor', preset: 'Kick-triggered', on: 'pad' }, { organism: 'eravos.fx-echo', preset: 'Dub Throw', on: 'lead' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Stepped Random 1/16', to: 'stabs', key: 'cutoff' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.6, maxY: 0.5 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'bass', key: 'knob.drive' }, { from: 'mod1', out: 'y', to: 'fx2', key: 'mix' }, { from: 'fx3', out: 'env', to: 'lead', key: 'cutoff' }],
    master: { compThresh: -10, compRatio: 3.5, reverbMix: 0.12 },
  }, { id: 'dp-darksynth', title: 'Turbo Breakdown', seed: 8803, mood: ['80s', 'dark', 'heavy'],
    listen: 'Distorted 16ths whose drive is set note by note, stabs that glitch, a choir behind the pump.', drop: 'A half-time breakdown where the lead wobbles faster and faster, then a blast (an 8-hit roll that speeds up) back into the drop.', voice: 'Her voice alone in the breakdown.' });

  // ---- 4. Sunset Bloom — Timecop1983 / The Midnight / Gunship: dreamwave, slow, lush, a gated-reverb snare, electric piano chords strummed
  //         from one note, a sax-like lead whose filter breathes inside each note and whose vibrato blooms; a tape on the pad whose dropouts
  //         throw the lead's echo.
  add({ id: 'deepwave-dream', label: 'Dreamwave (sax-like lead, gated snare)', icon: '🌅', accent: '#ff9ec7', family: 'Synth', impact: false,
    bpm: [82, 86], roots: [7, 0, 5], scales: ['major', 'dorian'], progs: [[1, 5, 6, 4], [4, 5, 3, 6], [6, 4, 1, 5]], leadRhythm: 'anthem', drums: { main: {} },
    tagline: 'Dreamwave: a gated snare, electric-piano chords strummed from one note, a sax-like lead whose filter breathes inside each note and whose vibrato blooms; the pad’s tape drops out and throws the lead’s echo',
    form: [S('intro', 'intro', 8, ['pad', 'keys']), S('verse', 'verse', 16, ['drums', 'bass', 'keys', 'pad']), S('chorus', 'chorus', 16, ['drums', 'bass', 'keys', 'pad', 'lead']),
      S('interlude', 'break', 8, ['pad', 'swarm', 'keys']), S('verse 2', 'verse', 8, ['drums', 'bass', 'keys', 'pad']), S('chorus 2', 'chorus', 16, ['drums', 'bass', 'keys', 'pad', 'lead', 'swarm']), S('outro', 'outro', 16, ['pad', 'keys', 'lead'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Lost Love · Fly Back to Me (80s)', name: 'Drums' },
      bass: { role: 'bass', organism: 'eravos.retro-poly', preset: '80s · Miami Night Bass', name: 'Bass', configure: { level: 0.7 } },
      keys: { role: 'chords', organism: 'eravos.piano', preset: 'Tine Phaser', name: 'Electric piano', configure: { level: 0.5 } },
      pad: { role: 'chords', organism: 'eravos.retro-poly', preset: '80s · Jupiter Strings', name: 'Strings', configure: { level: 0.3 } },
      lead: { role: 'lead', organism: 'eravos.retro-dco', preset: 'VHS Dreams', name: 'Sax-like lead', configure: { level: 0.55 } },
      swarm: { role: 'chords', organism: 'eravos.swarm-oscillator', preset: 'Breathing Swarm', name: 'Swarm', configure: { level: 0.3 } },
    },
    bar(cx) { const { partKey: p, kind, b, deg, sec } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1;
      if (p === 'drums') { kit(N, { kick: 'X.......X.x.....', snare: '....X.......X...', hat: 'x.x.x.x.x.x.x.xo', tom: last ? '..........x.x.xr' : '' }, { late: { snare: 0.08 }, hum: 10, roll: 3 }); return n; }
      if (p === 'bass') { const r = at(deg, 2), f = at(deg + 4, 1);   // syncopated 8ths, slides in from below
        [[0, 3, r, 1], [3, 1, r, 0.7], [6, 2, r + 12, 0.8, { b: { from: -1, to: 0, shape: 'early' } }], [8, 3, r, 0.95], [11, 2, f, 0.75], [14, 2, r, 0.7, { pr: 0.7 }]].forEach(a => N(...a)); return n; }
      if (p === 'keys') { const c = chord(at, deg, 4, [2, 4, 6, 8]), t = [0, 6, 10];   // one note, the chord strummed from it; brighter on the downbeat
        t.forEach((s, i) => N(s, i === 0 ? 6 : 4, c.root, i ? 0.6 : 0.8, { x: { iv: c.iv, strum: 18 + 6 * i, dir: i === 1 ? 'down' : 'up', fall: 0.05, cond: i === 2 ? { every: 2, at: 0 } : undefined }, p: { brightness: i ? 0.35 : 0.6 } })); return n; }
      if (p === 'pad') { const c = chord(at, deg, 3, [2, 4]); N(0, 16, c.root, 0.6, { x: { iv: c.iv, strum: 80 } }); return n; }
      if (p === 'lead') { const ph = b % 4, hi = at(deg + 4, 5), mid = at(deg + 2, 5), lo = at(deg, 5);   // breath: the filter opens and settles inside the note
        const breath = { c: { cutoff: [[0, 500], [0.3, 3200], [1, 1400]] } }, bloom = { rate: 5, depth: 0.35, shape: 'sine', fade: 0.6 };
        if (kind === 'outro' && b % 2) return n;
        if (ph === 0) { N(0, 1, at(deg + 5, 5), 0.5, { mt: -0.2 }); N(1, 7, hi, 0.95, Object.assign({ b: { from: -1, to: 0, shape: 'early', osc: bloom } }, breath)); N(8, 8, mid, 0.85, Object.assign({ b: { from: 0, to: 0, osc: bloom } }, breath)); }
        else if (ph === 1) { N(0, 4, mid, 0.85, breath); N(4, 4, lo, 0.8); N(8, 8, at(deg + 6, 4), 0.9, Object.assign({ b: { from: -3, to: 0, shape: 'early', osc: bloom } }, breath)); }
        else if (ph === 2) { N(0, 6, hi, 0.95, Object.assign({ b: { from: 0, to: 0, osc: bloom } }, breath)); N(6, 2, at(deg + 5, 5), 0.7, { pr: 0.65 }); N(8, 8, hi, 0.9, Object.assign({ b: { from: 0, to: -1, shape: 'late', at: 0.6 } }, breath)); }
        else { N(0, 16, lo, 0.95, Object.assign({ b: { from: -2, to: 0, shape: 'early', osc: { rate: 4.5, depth: 0.45, shape: 'sine', fade: 0.7 } }, p: { lfoPitch: 25 } }, breath)); }
        return n; }
      if (p === 'swarm') { if (b % 4) return n; const c = chord(at, deg, 3, [4, 7]); N(0, 64, c.root, 0.6, { x: { iv: c.iv, strum: 90, dir: 'out' } }); return n; }
      return null; },
    curves(secs) { const L = lanes();
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
        L.add('pad', 'cutoff', 'Strings open', [[a, s.kind === 'chorus' ? 3000 : 1400], [e - 0.05, s.kind === 'chorus' ? 4500 : 1800]]);
        L.add('keys', 'trem', 'Piano tremolo', [[a, s.kind === 'break' ? 0.6 : 0.15]]); L.add('lead', 'lfoPitch', 'Lead vibrato', [[a, 6], [e - 0.05, 22]]);
        L.add('fx3', 'wear', 'Pad tape wear', [[a, s.kind === 'outro' ? 0.4 : 0.25], [e - 0.05, s.kind === 'outro' ? 1 : 0.3]]); L.add('fx3', 'dropouts', 'Pad dropouts', [[a, s.kind === 'break' || s.kind === 'outro' ? 0.5 : 0.08]]);
        L.add('fx1', 'mix', 'Lead echo', [[a, s.kind === 'outro' ? 0.5 : 0.28]]); L.add('mod0', 'depth', 'Strings drift depth', [[a, s.kind === 'break' ? 0.8 : 0.35]]);
        L.add('mod1', 'posX', 'XY · X (piano tremolo)', [[a, s.kind === 'break' ? 0.9 : 0.2]]); L.add('mod1', 'posY', 'XY · Y (lead echo)', [[a, 0.3], [e - 0.05, s.kind === 'chorus' ? 0.7 : 0.3]]);
        if (s.kind === 'break') L.add('swarm', 'coupling', 'Swarm gathers', [[a, 0.1], [e - 0.05, 0.85]]); L.add('bass', 'cutoff', 'Bass filter', [[a, 900], [e - 0.05, s.kind === 'chorus' ? 2200 : 1200]]); L.add('fx0', 'gateRange', 'Snare gate', [[a, s.kind === 'chorus' ? 60 : 45]]); L.add('fx2', 'depth', 'Piano width', [[a, s.kind === 'break' ? 0.9 : 0.5]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.fx-dynamics', preset: '80s Gated Snare', on: 'drums' }, { organism: 'eravos.fx-echo', preset: '80s · Gated Slap \'84', on: 'lead' },
      { organism: 'eravos.fx-moddelay', preset: '80s · Dimension D Wide', on: 'keys' }, { organism: 'eravos.tape-memory', preset: 'Sunbleached Reel', on: 'pad' }],
    mods: [{ organism: 'eravos.lfo', preset: '80s · Slow Juno Drift', to: 'pad', key: 'cutoff' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.5, maxY: 0.4 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'keys', key: 'knob.trem' }, { from: 'mod1', out: 'y', to: 'fx1', key: 'mix' }, { from: 'fx3', out: 'dropout', to: 'fx1', key: 'feedback' }],
    master: { compThresh: -13, compRatio: 2.2, reverbMix: 0.24 },
  }, { id: 'dp-dream', title: 'Sunset Bloom', seed: 8804, mood: ['80s', 'her', 'warm'],
    listen: 'Slow and lush: electric-piano chords strummed up and down from one note, a gated snare, a lead that breathes like a saxophone.', drop: 'No drop: the Swarm gathers in the interlude and the pad’s tape drops out, throwing the lead’s echo.', voice: 'Her voice in the interlude.' });

  // ---- 5. Sequence 84 — Moroder / Italo / synth-pop: four on the floor, the 16th octave sequence bass whose filter opens over minutes, cowbell
  //         and claps, the Arp on a Retro Poly; the whole bass through a filter whose sweep is a curve and whose resonance the XY Pad plays.
  add({ id: 'deepwave-italo', label: 'Italo sequence (the Moroder bass)', icon: '🪩', accent: '#9a6bff', family: 'Synth', impact: false,
    bpm: [120, 124], roots: [9, 2, 7], scales: ['minor'], progs: [[1, 1, 6, 7], [1, 4, 1, 5]], leadRhythm: 'synth', drums: { main: {} },
    tagline: 'Four on the floor and the 16th octave sequence — its filter opening over minutes (a curve), each step’s accent its own; cowbell, claps, the Arp on a Retro Poly; the sidechain’s envelope throws the lead’s echo',
    form: [S('intro', 'intro', 16, ['bass', 'drums']), S('verse', 'verse', 16, ['drums', 'bass', 'pad', 'arp']), S('chorus', 'chorus', 16, ['drums', 'bass', 'pad', 'arp', 'lead']),
      S('break', 'break', 8, ['bass', 'drums']), S('chorus 2', 'chorus', 16, ['drums', 'bass', 'pad', 'arp', 'lead']), S('outro', 'outro', 8, ['bass', 'drums', 'pad'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Retro Machines · 808 Classic', name: 'Drums' },
      bass: { role: 'bass', organism: 'eravos.retro-poly', preset: 'Synthwave Bass (arp)', name: 'Sequence bass', configure: { arp: 'off', mono: true, level: 0.65 } },
      arp: { role: 'chords', organism: 'eravos.arp', style: 'sustain', voicing: 'triad', octave: 4, repeat: true, name: 'Arp', configure: { order: 'up-down', div: '1/8', octaves: 2, gate: 0.5, restart: 'bar' } },
      keys: { role: 'keys', organism: 'eravos.retro-poly', preset: '80s · Stranger Arp', name: 'Arp synth (the Arp plays it)', configure: { arp: 'off', level: 0.3 } },
      pad: { role: 'chords', organism: 'eravos.pad-forge', preset: '80s · Vangelis Glass', name: 'Glass', configure: { level: 0.3 } },
      lead: { role: 'lead', organism: 'eravos.retro-poly', preset: '80s · Neon Sync Lead', name: 'Lead', configure: { level: 0.45 } },
    },
    wires: [[['arp', 'arp.hook.note_out'], ['keys', 'rp.hook.note_in']]],
    bar(cx) { const { partKey: p, kind, b, deg, sec } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1;
      if (p === 'drums') { if (kind === 'intro' && b < 8) { kit(N, { kick: 'X...X...X...X...' }); return n; }
        kit(N, { kick: 'X...X...X...X...', clap: kind === 'break' ? '' : '....X.......X...', ohat: '..x...x...x...x.', cowbell: kind === 'chorus' ? '..x..x....x..x..' : '', hat: kind === 'chorus' ? 'x.x.x.x.x.x.x.x.' : '', tom: last ? '............xxxr' : '' }, { hum: 4, swing: 0.06, late: { clap: 0.04 } }); return n; }
      if (p === 'bass') { const r = at(deg, 2);   // the sequence: root / octave 16ths, an accent pattern of filter values per step
        for (let s = 0; s < 16; s++) N(s, 0.8, r + (s % 2 ? 12 : 0), s % 4 === 0 ? 1 : 0.7, { p: { cutoff: [2200, 900, 1300, 900][s % 4] } });
        if (b % 4 === 3) { n.splice(12); [12, 13, 14, 15].forEach((s, i) => N(s, 0.8, at(deg + [4, 3, 2, 1][i], 2) + (s % 2 ? 12 : 0), 0.85)); } return n; }
      if (p === 'lead') { const hi = at(deg + 4, 5), lo = at(deg, 5), ph = b % 4;
        if (ph === 0) { N(0, 2, lo, 0.9); N(2, 2, hi, 0.9); N(4, 4, at(deg + 5, 5), 1, { b: { from: -2, to: 0, shape: 'early' } }); N(8, 6, hi, 0.9, { b: { from: 0, to: 0, osc: { rate: 6, depth: 0.25, shape: 'sine', fade: 0.4 } } }); }
        else if (ph === 2) { N(0, 6, at(deg + 7, 5), 1, { c: { cutoff: [[0, 2000], [0.5, 6000], [1, 3000]] } }); N(8, 2, hi, 0.8); N(10, 2, at(deg + 2, 5), 0.8, { pr: 0.7 }); N(12, 4, lo, 0.9, { rt: 4, x: { rs: 'decel', rv: 'fade' } }); }
        else N(0, 8, at(deg + 4, 5), 0.85, { x: { cond: { every: 2, at: 1 } } });
        return n; }
      if (p === 'pad') { const c = chord(at, deg, 3, [2, 4, 7]); N(0, 16, c.root, 0.55, { x: { iv: c.iv, strum: 50 } }); return n; }
      return null; },
    curves(secs) { const L = lanes(), total = secs[secs.length - 1].bar + secs[secs.length - 1].bars;
      L.add('fx0', 'cutoff', 'The sequence opens (the whole song)', [[1, 350], [secs[2].bar, 2400], [secs[3].bar, 5000], [secs[3].bar + 0.1, 600], [secs[4].bar - 0.05, 4500], [secs[4].bar, 3000], [total - 0.05, 9000]]);
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
        L.add('arp', 'octaves', 'Arp octaves', [[a, s.kind === 'chorus' ? 3 : 2]]); L.add('arp', 'div', 'Arp rate', [[a, s.kind === 'chorus' ? '1/16' : '1/8']]);
        L.add('keys', 'cutoff', 'Arp synth filter', [[a, 1500], [e - 0.05, s.kind === 'chorus' ? 5000 : 2500]]);
        L.add('fx1', 'feedback', 'Glass phaser', [[a, s.kind === 'break' ? 0.85 : 0.4]]); L.add('fx2', 'mix', 'Lead echo', [[a, 0.3]]);
        L.add('mod0', 'rate', 'Lead pump speed', [[a, s.kind === 'chorus' ? 8 : 2]]);
        L.add('mod1', 'posX', 'XY · X (sequence resonance)', s.kind === 'break' ? [[a, 0.1], [e - 0.05, 1]] : [[a, 0.3]]); L.add('mod1', 'posY', 'XY · Y (phaser feedback)', [[a, 0.3], [e - 0.05, 0.6]]); L.add('bass', 'res', 'Sequence resonance', [[a, 4], [e - 0.05, s.kind === 'break' ? 14 : 6]]); L.add('pad', 'bloom', 'Glass bloom', [[a, 0.3], [e - 0.05, s.kind === 'chorus' ? 0.8 : 0.4]]); L.add('fx3', 'depth', 'Glass pump', [[a, s.kind === 'chorus' ? 0.7 : 0.4]]); L.add('lead', 'pwm', 'Lead pulse width motion', [[a, 0.2], [e - 0.05, 0.7]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.fx-filter', preset: 'Muffled Intro', on: 'bass' }, { organism: 'eravos.fx-phaser', preset: '80s · Small Stone Swirl', on: 'pad' },
      { organism: 'eravos.fx-echo', preset: 'Ping-pong 1/8.', on: 'lead' }, { organism: 'eravos.sidechain-compressor', preset: 'Club · House Pump 1/4 (deep)', on: 'fx1' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Pump 1/4', to: 'lead', key: 'cutoff' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.6, maxY: 0.5 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'fx0', key: 'res' }, { from: 'mod1', out: 'y', to: 'fx1', key: 'feedback' }, { from: 'fx3', out: 'env', to: 'fx2', key: 'mix' }],
    master: { compThresh: -11, compRatio: 3, reverbMix: 0.15 },
  }, { id: 'dp-italo', title: 'Sequence 84', seed: 8805, mood: ['80s', 'party'],
    listen: 'The 16th octave sequence alone, then the kick: its filter opens over the whole song (one curve), every step its own accent.', drop: 'In the break the sequence closes to a whisper and its resonance climbs on the XY Pad.', voice: 'Her voice over the break.' });

  // ---- 6. Galactic Warble — Com Truise / chillwave: slow-motion funk, swung 16ths, a funk bass that lands late, detuned keys on a tape that
  //         tracks badly, a melt where both tapes slow down; the keys' tape dropouts throw the lead's chorus.
  add({ id: 'deepwave-slowfunk', label: 'Slow-motion funk (chillwave)', icon: '🪐', accent: '#3fd6c5', family: 'Synth', impact: false,
    bpm: [94, 98], roots: [2, 7, 9], scales: ['dorian'], progs: [[1, 4, 1, 4], [2, 5, 1, 6]], leadRhythm: 'sparse', drums: { main: {} },
    tagline: 'Slow-motion funk: swung 16ths, a funk bass that lands late, detuned keys on a tape that tracks badly, a melt where both tapes slow down; the keys’ tape dropouts throw the lead’s chorus',
    form: [S('intro', 'intro', 8, ['keys', 'pad']), S('groove', 'verse', 16, ['drums', 'bass', 'keys', 'pad']), S('hook', 'chorus', 16, ['drums', 'bass', 'keys', 'pad', 'lead']),
      S('melt', 'break', 8, ['keys', 'pad', 'lead']), S('hook 2', 'chorus', 16, ['drums', 'bass', 'keys', 'pad', 'lead']), S('outro', 'outro', 8, ['keys', 'pad', 'drums'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Retro Machines · 808 Classic', name: 'Drums' },
      bass: { role: 'bass', organism: 'eravos.acid-synth', preset: '80s · Electro Funk Bass', name: 'Funk bass', configure: { level: 0.6 } },
      keys: { role: 'chords', organism: 'eravos.retro-dco', preset: 'Chorus Glass Poly', name: 'Keys', configure: { level: 0.45 } },
      pad: { role: 'chords', organism: 'eravos.retro-poly', preset: 'EDM Pad · Chillwave Juno Wash', name: 'Wash', configure: { level: 0.3 } },
      lead: { role: 'lead', organism: 'eravos.retro-poly', preset: '80s · Neon Sync Lead', name: 'Lead', configure: { level: 0.4 } },
    },
    bar(cx) { const { partKey: p, kind, b, deg, sec } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1;
      if (p === 'drums') { kit(N, kind === 'outro' ? { kick: 'X.......X.......', hat: 'x.o.x.o.x.o.x.o.' }
        : { kick: 'X.....x...X..o..', snare: '....X..o....X...', hat: 'xoxoxoxoxoxoxoxo', clap: '....x.......x...', tom: last ? '...........x.xxr' : '' }, { swing: 0.28, late: { snare: 0.1, clap: 0.12 }, hum: 12, ghost: 0.5 }); return n; }
      if (p === 'bass') { const r = at(deg, 2), f = at(deg + 4, 2), o = at(deg, 3);   // syncopated, answers the kick late, slides
        [[0, 2, r, 1, { mt: 0.12 }], [3, 1, r, 0.6, { pr: 0.6, mt: 0.2 }], [6, 2, o, 0.85, { b: { from: -2, to: 0, shape: 'early' }, mt: 0.25 }], [10, 2, f, 0.8, { mt: 0.18 }], [13, 1, r, 0.7, { mt: 0.25 }], [14, 2, at(deg + 6, 1), 0.8, { b: { from: 0, to: 1, shape: 'late', at: 0.5 } }]].forEach(a => N(...a)); return n; }
      if (p === 'keys') { const c = chord(at, deg, 4, [2, 4, 6]);   // stabs on the and, strummed down, some only every other pass
        [[2, 2], [7, 1.5], [10, 2]].forEach(([s, l], i) => N(s, l, c.root, i === 1 ? 0.55 : 0.75, { p: { cutoff: [2400, 1500, 3200][i] }, mt: 0.25, x: { iv: c.iv, strum: 14, dir: 'down', fall: 0.06, cond: i === 1 ? { every: 2, at: 1 } : undefined, ht: 10, hv: 0.08 } })); return n; }
      if (p === 'pad') { const c = chord(at, deg, 3, [2, 4]); N(0, 16, c.root, 0.5, { x: { iv: c.iv, strum: 100 } }); return n; }
      if (p === 'lead') { const hi = at(deg + 4, 5), lo = at(deg, 5), ph = b % 4, wob = { rate: 0.6, depth: 0.35, shape: 'sine' };
        if (ph === 1) { N(4, 4, hi, 0.85, { b: { from: -1, to: 0, shape: 'early', osc: wob }, mt: 0.2 }); N(10, 6, lo, 0.8, { b: { from: 0, to: 0, osc: wob } }); }
        else if (ph === 3) { N(0, 3, at(deg + 2, 5), 0.8, { mt: 0.15 }); N(3, 3, hi, 0.85); N(8, 8, at(deg + 6, 4), 0.9, { b: { from: 0, to: -1, shape: 'late', at: 0.5, osc: wob }, c: { cutoff: [[0, 900], [0.5, 2800], [1, 1200]] } }); }
        return n; }
      return null; },
    curves(secs) { const L = lanes();
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars, melt = s.kind === 'break';
        const speed = melt ? [[a, 1], [a + s.bars * 0.6, 0.72], [e - 0.3, 0.7], [e - 0.05, 1]] : [[a, 1]];
        L.add('fx0', 'speed', 'Keys tape speed (the melt)', speed); L.add('fx1', 'speed', 'Wash tape speed (the melt)', speed);
        L.add('fx0', 'wow', 'Keys tape wow', [[a, melt ? 0.8 : 0.35]]); L.add('fx1', 'wear', 'Wash tape wear', [[a, 0.3], [e - 0.05, s.kind === 'outro' ? 1 : 0.4]]);
        L.add('fx2', 'depth', 'Wash pump', [[a, s.kind === 'chorus' ? 0.6 : 0.3]]); L.add('fx3', 'mix', 'Lead chorus', [[a, 0.4]]);
        L.add('keys', 'cutoff', 'Keys filter', [[a, 1200], [e - 0.05, s.kind === 'chorus' ? 3200 : 1800]]); L.add('mod0', 'depth', 'Keys filter wander', [[a, melt ? 0.8 : 0.3]]);
        L.add('mod1', 'posX', 'XY · X (keys wow)', [[a, melt ? 0.9 : 0.3]]); L.add('mod1', 'posY', 'XY · Y (lead filter)', [[a, 0.3], [e - 0.05, s.kind === 'chorus' ? 0.8 : 0.3]]); L.add('bass', 'envMod', 'Bass squelch', [[a, 0.3], [e - 0.05, s.kind === 'chorus' ? 0.75 : 0.4]]); L.add('pad', 'cutoff', 'Wash filter', [[a, 1200], [e - 0.05, s.kind === 'chorus' ? 2800 : 1500]]); L.add('lead', 'drift', 'Lead drift', [[a, melt ? 0.9 : 0.4]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.tape-memory', preset: 'Tracking Error', on: 'keys' }, { organism: 'eravos.tape-memory', preset: 'Chewed Tape', on: 'pad' },
      { organism: 'eravos.sidechain-compressor', preset: 'Lofi Gentle Pump', on: 'fx1' }, { organism: 'eravos.fx-moddelay', preset: 'Juno Wide', on: 'lead' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Odd · Golden LFO', to: 'keys', key: 'cutoff' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.6, maxY: 0.5 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'fx0', key: 'knob.wow' }, { from: 'mod1', out: 'y', to: 'lead', key: 'cutoff' }, { from: 'fx0', out: 'dropout', to: 'fx3', key: 'mix' }],
    master: { compThresh: -13, compRatio: 2.4, reverbMix: 0.16 },
  }, { id: 'dp-slowfunk', title: 'Galactic Warble', seed: 8806, mood: ['80s', 'warm', 'calm'],
    listen: 'Swung and slow: the bass lands late on purpose, the keys warble on a tape that tracks badly.', drop: 'The melt: both tapes slow to 70 % and come back up to speed.', voice: 'Her voice in the melt.' });

  // ===================================================================================================== 🔊 DUBSTEP & WUBS
  // ---- 7. Request Line Space — Skream / Benga / Digital Mystikz: the original sound — a huge clean sub, space and silence, a skanking stab
  //         thrown into the echo, a siren once in a while, long sections that change one thing at a time.
  add({ id: 'deepstep-og', label: 'Original dubstep (space, sub, skank)', icon: '🌒', accent: '#7fd36b', family: 'EDM',
    bpm: [138, 140], roots: [5, 7, 2], scales: ['minor', 'phrygian'], progs: [[1, 1, 1, 1], [1, 1, 2, 1], [1, 7, 1, 7]], leadRhythm: 'sparse', drums: { main: {} },
    tagline: 'The original sound: a huge clean sub that slides, space, a skank stab thrown into the echo, a siren now and then, long sections that change one thing at a time; the sidechain breathes the echo',
    form: [S('intro', 'intro', 16, ['drums', 'skank']), S('drop', 'drop', 32, ['drums', 'sub', 'skank', 'siren']), S('dub', 'break', 16, ['skank', 'siren', 'drums']),
      S('drop 2', 'drop', 32, ['drums', 'sub', 'skank', 'wub', 'siren']), S('outro', 'outro', 16, ['drums', 'skank'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Bass Music · 140 Half-Time Dub', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Dubstep Sub Layer', name: 'Sub', configure: { level: 0.7 } },
      skank: { role: 'chords', organism: 'eravos.piano', preset: 'Odd · Dub Honky Skank', name: 'Skank', configure: { level: 0.4 } },
      siren: { role: 'lead', organism: 'eravos.curve-synth', preset: 'Siren', name: 'Siren', configure: { level: 0.3 } },
      wub: { role: 'bass', organism: 'eravos.wobble-bass', preset: 'Sub Pressure', name: 'Wobble (low)', configure: { level: 0.45 } },
    },
    bar(cx) { const { partKey: p, kind, b, deg, sec } = cx, { n, N, at } = pen(cx);
      if (p === 'drums') { if (kind === 'intro' && b < 8) { kit(N, { hat: 'x..o..x..o..x..o', rim: '..........o.....' }, { hum: 6 }); return n; }
        kit(N, { kick: 'X.........o.....', snare: '........X.......', hat: 'x..o..x..o..x.ox', rim: '...o......o....o', crash: kind === 'drop' && b % 16 === 0 ? 'X...............' : '' }, { late: { snare: 0.06 }, hum: 6, ghost: 0.45 }); return n; }
      if (p === 'sub') { const r = at(deg, 1);   // long, clean, sliding; one change at a time (every 8 bars a new move)
        const mv = Math.floor(b / 8) % 4;
        if (mv === 0) N(0, 14, r, 1); else if (mv === 1) { N(0, 6, r, 1); N(8, 6, r, 0.9, { b: { from: 0, to: -5, shape: 'late', at: 0.6 } }); }
        else if (mv === 2) { N(0, 10, r, 1, { b: { from: -12, to: 0, shape: 'early' } }); N(12, 3, at(deg + 4, 1), 0.8, { pr: 0.7 }); } else N(0, 16, r, 1, { b: { from: 0, to: 0, osc: { rate: '1/4', depth: 0.15, shape: 'sine', fade: 0.5 } } });
        return n; }
      if (p === 'skank') { const c = chord(at, deg, 4, [2, 4]);   // the skank: off-beat stabs, some only every other pass, all thrown into the echo
        [4, 12].forEach((s, i) => N(s, 1, c.root, 0.7, { x: { iv: c.iv, strum: 6, cond: i && kind !== 'break' ? { every: 2, at: 1 } : undefined } })); if (b % 8 === 7) N(14, 1, c.root, 0.6, { x: { iv: c.iv, rs: 'decel', rv: 'fade' }, rt: 3 }); return n; }
      if (p === 'siren') { if (b % 8 !== 4) return n; N(0, 24, at(deg + 4, 5), 0.6, { x: { cond: { every: 2, at: 0 } } }); return n; }
      if (p === 'wub') { const r = at(deg, 1); N(0, 8, r, 0.8, { p: { div: '1/4' } }); N(8, 8, r, 0.8, { p: { div: b % 4 === 3 ? '1/4t' : '1/2' }, c: { cutoff: [[0, 300], [1, 900]] } }); return n; }
      return null; },
    curves(secs) { const L = lanes();
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
        L.add('fx0', 'feedback', 'Skank echo feedback', s.kind === 'break' ? [[a, 0.5], [e - 0.05, 0.92], [e, 0.5]] : [[a, 0.45]]);
        L.add('fx0', 'mix', 'Skank echo throws', s.kind === 'break' ? [[a, 0.6]] : swells(a, e, 8, 0.25, 0.55));
        L.add('fx2', 'cutoff', 'Drums filter', s.kind === 'intro' ? [[a, 600], [e - 0.05, 6000], [e, 18000]] : [[a, 18000]]);
        L.add('fx1', 'rate', 'Wobble phaser speed', [[a, 0.2], [e - 0.05, 0.8]]); L.add('wub', 'cutoff', 'Wobble filter', [[a, 300], [e - 0.05, 900]]);
        L.add('mod0', 'depth', 'Skank filter sweep', [[a, s.kind === 'break' ? 0.8 : 0.3]]);
        L.add('mod1', 'posX', 'XY · X (echo feedback)', [[a, s.kind === 'break' ? 0.9 : 0.2]]); L.add('mod1', 'posY', 'XY · Y (wobble filter)', [[a, 0.2], [e - 0.05, s.name === 'drop 2' ? 0.8 : 0.3]]); L.add('sub', 'drive', 'Sub warmth', [[a, s.name === 'drop 2' ? 0.3 : 0.1]]); L.add('skank', 'hardness', 'Skank attack', [[a, s.kind === 'break' ? 0.8 : 0.5]]); L.add('siren', 'drive', 'Siren grit', [[a, s.kind === 'break' ? 0.6 : 0.2]]); L.add('fx2', 'res', 'Drums filter peak', [[a, s.kind === 'intro' ? 6 : 0.7]]); L.add('fx3', 'depth', 'Echo breathes', [[a, s.kind === 'drop' ? 0.6 : 0.3]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.fx-echo', preset: 'Dub Throw', on: 'skank' }, { organism: 'eravos.fx-phaser', preset: 'Dubstep Sweep 1/8', on: 'wub' },
      { organism: 'eravos.fx-filter', preset: 'Muffled Intro', on: 'drums' }, { organism: 'eravos.sidechain-compressor', preset: 'Half-time 1/2', on: 'fx0' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Slow Filter Sweep 2 bars', to: 'skank', key: 'brightness' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.4, maxY: 0.5 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'fx0', key: 'feedback' }, { from: 'mod1', out: 'y', to: 'wub', key: 'cutoff' }, { from: 'fx3', out: 'env', to: 'fx0', key: 'mix' }],
    master: { compThresh: -12, compRatio: 2.5, reverbMix: 0.1 },
  }, { id: 'ds-og', title: 'Request Line Space', seed: 8901, mood: ['dark', 'calm'],
    listen: 'Space first: a clean sub that slides, a skank thrown into the echo, one thing changing at a time over 32-bar drops.', drop: 'In the dub break the echo’s feedback climbs to the edge and the XY Pad rides it.', voice: 'Her voice in the dub break, into the echo.' });

  // ---- 8. Cockney Wobble — Rusko / Caspa / early Flux Pavilion: the wobble era — every note its own LFO rate (1/8, 1/4 triplet, 1/16), the
  //         rate speeding up inside a note (a knob curve), swing, a Hammond bubble in the break; the sidechain's envelope throws its echo.
  add({ id: 'deepstep-wobble', label: 'Wobble era (a rate per note)', icon: '〰', accent: '#ffcc00', family: 'EDM',
    bpm: [140, 142], roots: [9, 4, 0], scales: ['minor'], progs: [[1, 6, 7, 1], [1, 1, 6, 7], [1, 4, 6, 7]], leadRhythm: 'sparse', drums: { main: {} },
    tagline: 'The wobble era: every note its own wobble rate, the rate speeding up inside a note, swing on the hats, a Hammond bubble in the break; the XY Pad works the FM and the vowel; the sidechain’s envelope throws the organ’s echo',
    form: [S('intro', 'intro', 16, ['drums', 'organ']), S('build', 'build', 8, ['drums', 'organ', 'riser']), S('drop', 'drop', 16, ['drums', 'sub', 'wub']), S('break', 'break', 16, ['organ', 'drums']),
      S('build 2', 'build', 8, ['drums', 'organ', 'riser']), S('drop 2', 'drop', 16, ['drums', 'sub', 'wub', 'organ']), S('outro', 'outro', 8, ['drums', 'organ'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Dubstep Sub Layer', name: 'Sub', configure: { level: 0.55 } },
      wub: { role: 'bass', organism: 'eravos.wobble-bass', preset: 'Classic Wub 1/8', name: 'Wobble', configure: { level: 0.6 } },
      organ: { role: 'chords', organism: 'eravos.organ', preset: 'Odd · Dub Bubble Hammond', name: 'Organ bubble', configure: { level: 0.35 } },
      riser: { role: 'lead', organism: 'eravos.wub-osc', preset: 'Slide Lead (+1 oct)', name: 'Riser', configure: { level: 0.35 } },
    },
    bar(cx) { const { partKey: p, kind, b, deg, sec } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1;
      if (p === 'drums') {
        if (kind === 'build') { for (let s = 0; s < 16; s += b < sec.bars / 2 ? 4 : b < sec.bars - 1 ? 2 : 1) N(s, 1, D('snare'), 0.3 + 0.6 * (b * 16 + s) / (sec.bars * 16)); if (last) N(12, 4, D('snare'), 0.9, { rt: 6, x: { rs: 'accel', rv: 'grow' } }); return n; }
        kit(N, kind === 'break' ? { hat: 'x.x.x.x.x.x.x.x.', rim: '....x.......x...' } : { kick: 'X.........x.....', snare: '........X.......', hat: 'x.xox.xox.xox.xo', ohat: '......x.......x.' }, { swing: 0.18, hum: 8 }); return n; }
      if (p === 'sub') { const r = at(deg, 1); N(0, 10, r, 1); N(12, 4, r, 0.8, b % 4 === 3 ? { b: { from: 0, to: -12, shape: 'late', at: 0.3 } } : null); return n; }
      if (p === 'wub') { const r = at(deg, 2), o = at(deg, 3), f = at(deg + 4, 2), v = b % 4;   // each note its own rate; inside a long note the rate speeds up
        if (v === 0) { N(0, 6, r, 1, { p: { div: '1/8' } }); N(6, 2, o, 0.85, { p: { div: '1/16' } }); N(8, 8, r, 0.95, { p: { div: '1/4t' }, c: { rateBend: [[0, 1], [1, 2]] } }); }
        else if (v === 1) { N(0, 4, f, 0.95, { p: { div: '1/8t' } }); N(4, 4, r, 0.9, { p: { div: '1/8' } }); N(8, 6, o, 1, { p: { div: '1/16' }, b: { from: 0, to: -12, shape: 'linear' } }); N(14, 2, r, 0.7, { p: { div: '1/32' }, pr: 0.7 }); }
        else if (v === 2) { N(0, 8, r, 1, { p: { div: '1/4' }, c: { rateBend: [[0, 1], [0.5, 1.5], [1, 3]] } }); N(8, 4, f, 0.9, { p: { div: '1/8' } }); N(12, 4, r, 0.85, { p: { div: '1/16t' }, rt: 2 }); }
        else { N(0, 16, r, 1, { p: { div: '1/8' }, c: { rateBend: [[0, 1], [0.75, 2], [1, 4]], cutoff: [[0, 900], [1, 4000]] }, b: { from: 0, to: last ? -12 : 0, shape: 'late', at: 0.7, osc: { rate: '1/16', depth: 0.12, shape: 'sine', fade: 0.5 } } }); }
        return n; }
      if (p === 'organ') { const c = chord(at, deg, 4, [2, 4]);   // the bubble: two off-beat hits, the second only every other pass
        [[2, 1.5, 0.7], [6, 1, 0.5], [10, 1.5, 0.7], [14, 1, 0.5]].forEach(([s, l, v], i) => N(s, l, c.root, v, { x: { iv: c.iv, cond: i % 2 ? { every: 2, at: 1 } : undefined, ht: 8, hv: 0.06 }, mt: 0.08 })); return n; }
      if (p === 'riser') { if (b === 0) N(0, sec.bars * 16, at(deg, 4), 0.8, { b: { from: -12, to: 12, shape: 'late', at: 0 } }); return n; }
      return null; },
    curves(secs) { const L = lanes();
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
        L.add('wub', 'cutoff', 'Wobble filter', s.kind === 'drop' ? swells(a, e, 4, 900, 4500) : [[a, 600]]); L.add('wub', 'formantShift', 'Wobble vowel', [[a, 0], [e - 0.05, s.name === 'drop 2' ? 12 : 4]]);
        L.add('fx0', 'drive', 'Wobble grit', [[a, s.name === 'drop 2' ? 0.7 : 0.45]]); L.add('fx1', 'depth', 'Wobble breathes with the kick', [[a, 0.6]]);
        L.add('fx2', 'mix', 'Organ echo', [[a, s.kind === 'break' ? 0.55 : 0.25]]); L.add('mod0', 'depth', 'Grit wobble depth', [[a, s.kind === 'drop' ? 0.6 : 0.1]]);
        L.add('mod1', 'posX', 'XY · X (wobble FM)', s.kind === 'build' ? [[a, 0], [e - 0.05, 1]] : [[a, s.kind === 'drop' ? 0.4 : 0]]); L.add('mod1', 'posY', 'XY · Y (wobble vowel)', [[a, 0.2], [e - 0.05, s.kind === 'drop' ? 0.8 : 0.2]]); L.add('sub', 'drive', 'Sub drive', [[a, s.name === 'drop 2' ? 0.3 : 0.1]]); L.add('organ', 'rotary', 'Organ rotor', [[a, s.kind === 'break' ? 0.8 : 0.3]]); L.add('riser', 'index', 'Riser FM', [[a, 2], [e - 0.05, s.kind === 'build' ? 16 : 2]]); L.add('fx2', 'feedback', 'Organ echo feedback', [[a, s.kind === 'break' ? 0.75 : 0.45]]); L.add('wub', 'squash', 'Wobble squash', [[a, s.kind === 'drop' ? 0.6 : 0.2]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.fx-destroyer', preset: 'Wub Grit · sub stays clean', on: 'wub' }, { organism: 'eravos.sidechain-compressor', preset: 'Odd · Wobble Breathes With Kick', on: 'fx0' },
      { organism: 'eravos.fx-echo', preset: 'Dub Throw', on: 'organ' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Wobble 1/8', to: 'fx0', key: 'drive' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.3, maxY: 0.5 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'wub', key: 'knob.fmIndex' }, { from: 'mod1', out: 'y', to: 'wub', key: 'knob.formantShift' }, { from: 'fx1', out: 'env', to: 'fx2', key: 'mix' }],
    master: { compThresh: -10, compRatio: 3, reverbMix: 0.1 },
  }, { id: 'ds-wobble', title: 'Cockney Wobble', seed: 8902, mood: ['party', 'heavy'],
    listen: 'Every note its own wobble rate — 1/8, triplets, 1/16 — and inside the long notes the rate speeds up.', drop: 'Drop 2 adds the organ bubble and opens the wobble’s vowel; the XY Pad works the FM.', voice: 'Her voice in the break, over the organ.' });

  // ---- 9. Talking Machines — Skrillex / Zomboy: brostep — a conversation: a Bass Forge that talks (its talk and formant set note by note,
  //         opening inside the note) answered every half bar by a Wobble Bass talker; hiccups (ratchets), drops at the phrase end, a screech.
  //         The pad's sidechain envelope throws the screech's stutter.
  add({ id: 'deepstep-talker', label: 'Brostep (two basses talking)', icon: '🗣', accent: '#00e5ff', family: 'EDM',
    bpm: [140, 140], roots: [1, 6, 8], scales: ['minor', 'phrygian'], progs: [[1, 1, 6, 7], [1, 1, 1, 2]], leadRhythm: 'sparse', drums: { main: {} },
    tagline: 'Brostep as a conversation: a Bass Forge that talks (its talk and vowel set note by note, opening inside the note) answered every half bar by a Wobble Bass, hiccups, drops at every phrase end, a screech; the sidechain’s envelope throws the screech’s stutter',
    form: [S('intro', 'intro', 8, ['pad', 'drums']), S('build', 'build', 8, ['drums', 'pad', 'screech']), S('drop', 'drop', 16, ['drums', 'sub', 'talk', 'yoi']), S('break', 'break', 8, ['pad', 'screech']),
      S('build 2', 'build', 8, ['drums', 'pad', 'screech']), S('drop 2', 'drop', 16, ['drums', 'sub', 'talk', 'yoi', 'screech']), S('switch-up', 'drop', 8, ['drums', 'sub', 'yoi', 'screech']), S('outro', 'outro', 4, ['pad', 'drums'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Bass Music · Brostep Metal', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Dubstep Sub Layer', name: 'Sub', configure: { level: 0.5 } },
      talk: { role: 'bass', organism: 'eravos.bass-forge', preset: 'Yoi Talker', name: 'Talker (Bass Forge)', configure: { level: 0.42 } },
      yoi: { role: 'bass', organism: 'eravos.wobble-bass', preset: 'Brostep Hiccup', name: 'Answer (Wobble Bass)', configure: { level: 0.4 } },
      screech: { role: 'lead', organism: 'eravos.wub-osc', preset: 'Dive Bomb', name: 'Screech', configure: { level: 0.35 } },
      pad: { role: 'chords', organism: 'eravos.supersaw', preset: 'EDM Pad · Dark Minor Seventh Pad', name: 'Pad', configure: { level: 0.3 } },
    },
    bar(cx) { const { partKey: p, kind, b, deg, sec } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1, phraseEnd = b % 4 === 3;
      if (p === 'drums') {
        if (kind === 'build') { for (let s = 0; s < 16; s += b < sec.bars / 2 ? 4 : b < sec.bars - 1 ? 2 : 1) N(s, 1, D('snare'), 0.3 + 0.6 * (b * 16 + s) / (sec.bars * 16)); if (last) N(12, 4, D('snare'), 0.95, { rt: 8, x: { rs: 'accel', rv: 'grow' } }); return n; }
        kit(N, kind === 'drop' ? { kick: 'X.........X..x..', snare: '........X.......', clap: '........X.......', hat: 'x.x.x.x.x.xxx.x.', perc: phraseEnd ? '............rr..' : '' } : { kick: 'X.......X.......', hat: '..x...x...x...x.' }, { roll: 4, hum: 4, late: { clap: 0.04 } }); return n; }
      if (p === 'sub') { if (kind !== 'drop') return n; N(0, 7, at(deg, 1), 1); N(8, 6, at(deg, 1), 0.9); return n; }
      if (p === 'talk') { const r = at(deg, 2), o = at(deg, 3), v = (b + (kind === 'drop' && b >= 8 ? 1 : 0)) % 4;   // the first half of every bar: the talker
        const say = (s, l, m, vel, talk, form, x) => N(s, l, m, vel, Object.assign({ p: { talk, formant: form }, c: { formant: [[0, form * 0.5], [1, Math.min(1, form + 0.4)]] } }, x || {}));
        if (v === 0) { say(0, 3, r, 1, 0.8, 0.2); say(3, 3, o, 0.85, 0.5, 0.6, { b: { from: 0, to: -2, shape: 'late', at: 0.5 } }); say(6, 2, r, 0.8, 0.9, 0.9, { rt: 2 }); }
        else if (v === 1) { say(0, 2, r, 1, 0.3, 0.1); say(2, 2, r, 0.9, 0.6, 0.5); say(4, 4, at(deg + 3, 2), 0.95, 0.9, 0.8, { b: { from: 5, to: 0, shape: 'early' } }); }
        else if (v === 2) { say(0, 8, r, 1, 0.7, 0.3, { rt: 4, x: { rs: 'accel', rv: 'grow' } }); }
        else { say(0, 4, o, 1, 0.9, 0.9, { b: { from: 0, to: -12, shape: 'linear' } }); say(4, 4, r, 0.85, 0.4, 0.2, { pr: 0.75 }); }
        if (phraseEnd) N(8, 8, r, 1, { p: { talk: 1, formant: 1 }, b: { from: 0, to: -24, shape: 'late', at: 0.25 } });
        return n; }
      if (p === 'yoi') { if (phraseEnd) return n; const r = at(deg, 2), v = b % 3;   // the answer: the second half of every bar
        if (v === 0) { N(8, 4, r, 0.95, { p: { div: '1/8t' } }); N(12, 4, at(deg + 4, 2), 0.9, { p: { div: '1/16' }, b: { from: 0, to: -5, shape: 'late', at: 0.5 } }); }
        else if (v === 1) N(8, 8, r, 1, { p: { div: '1/16' }, rt: 3, x: { rs: 'decel', rv: 'flat' }, c: { formantShift: [[0, -12], [1, 12]] } });
        else { N(8, 2, r, 0.9, { p: { div: '1/32' } }); N(10, 2, r + 12, 0.85, { p: { div: '1/16' } }); N(12, 4, r, 1, { p: { div: '1/4t' }, c: { formantShift: [[0, 12], [1, -6]] } }); }
        return n; }
      if (p === 'screech') { const h = at(deg + 2, 4);
        if (kind === 'build' || kind === 'break') { if (b % 2 === 0) N(0, 16, h, 0.7, { b: { from: -12, to: 0, shape: 'early', osc: { rate: '1/8', rateTo: '1/32', depth: 0.5, shape: 'triangle' } } }); return n; }
        if (b % 2) { N(12, 4, h + 12, 0.85, { b: { from: 0, to: -24, shape: 'late', at: 0.2 }, x: { cond: { every: 2, at: 1 } } }); } return n; }
      if (p === 'pad') { const c = chord(at, deg, 3, [2, 4, 6]); N(0, 16, c.root, 0.55, { x: { iv: c.iv, strum: 70 } }); return n; }
      return null; },
    curves(secs) { const L = lanes();
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
        L.add('talk', 'fm', 'Talker FM', s.kind === 'drop' ? swells(a, e, 2, 3, 12) : [[a, 2]]); L.add('talk', 'drive', 'Talker drive', [[a, s.name === 'drop 2' ? 0.85 : 0.6]]);
        L.add('yoi', 'cutoff', 'Answer brightness', [[a, 1500], [e - 0.05, s.kind === 'drop' ? 6000 : 2000]]);
        L.add('fx0', 'amount', 'Talker OTT', [[a, s.kind === 'drop' ? 0.8 : 0.3]]); L.add('fx1', 'repeats', 'Screech stutter', [[a, 2], [e - 0.05, s.kind === 'build' ? 16 : 4]]);
        L.add('fx3', 'depth', 'Pad pump', [[a, 0.7]]); L.add('pad', 'cutoff', 'Pad filter', s.kind === 'build' ? [[a, 600], [e - 0.05, 9000]] : [[a, 2200]]);
        L.add('mod0', 'rate', 'Random talk speed', [[a, s.kind === 'drop' ? 16 : 4]]);
        L.add('mod1', 'posX', 'XY · X (answer vowel)', s.kind === 'drop' ? swells(a, e, 4, 0.2, 0.9) : [[a, 0.3]]); L.add('mod1', 'posY', 'XY · Y (talker FM)', [[a, 0.2], [e - 0.05, s.kind === 'build' ? 1 : 0.5]]); L.add('talk', 'talk', 'Talker mouth', s.kind === 'drop' ? swells(a, e, 1, 0.3, 1) : [[a, 0.4]]); L.add('screech', 'index', 'Screech FM', [[a, 4], [e - 0.05, s.kind === 'build' ? 20 : 10]]); L.add('fx2', 'drive', 'Answer fold', [[a, s.name === 'drop 2' ? 0.8 : 0.5]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.fx-squash', preset: 'OTT Growl', on: 'talk' }, { organism: 'eravos.fx-glitch', preset: 'Pitched Stutter Up', on: 'screech' },
      { organism: 'eravos.fx-destroyer', preset: 'Growl Fold · sub stays clean', on: 'yoi' }, { organism: 'eravos.sidechain-compressor', preset: 'Kick-triggered', on: 'pad' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Stepped Random 1/16', to: 'talk', key: 'knob.formant' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.5, maxY: 0.4 } }],
    routes: [{ from: 'fx3', out: 'env', to: 'fx1', key: 'mix' }, { from: 'mod1', out: 'x', to: 'yoi', key: 'knob.formantShift' }, { from: 'mod1', out: 'y', to: 'talk', key: 'knob.fm' }],
    master: { compThresh: -9, compRatio: 3.5, reverbMix: 0.08 },
  }, { id: 'ds-talker', title: 'Talking Machines', seed: 8903, mood: ['heavy', 'party'],
    listen: 'Two basses in conversation: the Bass Forge says something in the first half of every bar (its vowel opening inside each note) and the Wobble Bass answers.', drop: 'Every fourth bar the talker dives two octaves; in drop 2 the screech stutters with the pad’s pump.', voice: 'Her voice in the break, over the screech.' });

  // ---- 10. Stop-Start Riddim — Subtronics / Svdden Death / riddim: 150, one minimal triplet bass repeated, stop-start silence, one small
  //          change per bar (an octave, a skip on some passes), and the FM / the wall moving instead of the notes. The sidechain's envelope
  //          moves the stair's filter.
  add({ id: 'deepstep-riddim', label: 'Riddim (stop-start, one change a bar)', icon: '🔁', accent: '#b6ff00', family: 'EDM',
    bpm: [148, 150], roots: [5, 1, 8], scales: ['minor'], progs: [[1, 1, 1, 1], [1, 1, 1, 2]], leadRhythm: 'sparse', drums: { main: {} },
    tagline: 'Riddim: one minimal triplet bass repeated, stop-start silence, one small change a bar (an octave, a skip on some passes), the FM and the wall moving instead of the notes; the sidechain’s envelope moves the stair',
    form: [S('intro', 'intro', 8, ['drums', 'pad']), S('build', 'build', 8, ['drums', 'pad']), S('pause', 'pause', 1, ['sub']), S('drop', 'drop', 16, ['drums', 'sub', 'riddim']),
      S('break', 'break', 8, ['pad']), S('build 2', 'build', 8, ['drums', 'pad']), S('pause 2', 'pause', 1, ['sub']), S('drop 2', 'drop', 16, ['drums', 'sub', 'stair', 'riddim']), S('outro', 'outro', 8, ['drums', 'pad'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Bass Music · Riddim Steel', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Dubstep Sub Layer', name: 'Sub', configure: { level: 0.55 } },
      riddim: { role: 'bass', organism: 'eravos.wobble-bass', preset: 'Riddim Square 1/16t', name: 'Riddim', configure: { level: 0.55 } },
      stair: { role: 'bass', organism: 'eravos.bass-forge', preset: 'Riddim Stair', name: 'Stair', configure: { level: 0.45 } },
      pad: { role: 'chords', organism: 'eravos.pad-forge', preset: 'EDM Pad · Neuro Dark Pad', name: 'Pad', configure: { level: 0.3 } },
    },
    bar(cx) { const { partKey: p, kind, b, deg, sec } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1;
      if (p === 'drums') {
        if (kind === 'build') { for (let s = 0; s < 16; s += b < 4 ? 4 : b < 7 ? 2 : 1) N(s, 1, D('snare'), 0.3 + 0.6 * (b * 16 + s) / 128); if (last) N(12, 4, D('snare'), 0.9, { rt: 8, x: { rs: 'accel', rv: 'grow' } }); return n; }
        kit(N, kind === 'drop' ? { kick: b % 2 ? 'X...........X...' : 'X.........X.....', snare: '........X.......', hat: 'x..x..x..x..x..x', perc: b % 4 === 3 ? '.............rr.' : '' } : { kick: 'X.......X.......', hat: 'x..x..x..x..x..x' }, { roll: 3, hum: 4, late: { snare: 0.03 } }); return n; }
      if (p === 'sub') { const r = at(deg, 1); if (kind === 'pause') { N(0, 16, r, 1, { b: { from: 0, to: -12, shape: 'late', at: 0.2, osc: { rate: '1/8', rateTo: '1/32', depth: 0.2, shape: 'sine' } } }); return n; } N(0, 6, r, 1); N(12, 4, r, 0.8, { pr: 0.6 }); return n; }
      if (p === 'riddim') { const r = at(deg, 2), up = b % 4 === 1 ? 12 : 0, stop = b % 2 === 1;   // one figure; per bar one change; every other bar it stops dead
        [0, 1, 2].forEach(i => N(i * 2, 1.6, r + (i === 2 ? up : 0), i ? 0.85 : 1, { p: { div: '1/16t' } }));
        N(6, 2, r, 0.9, { p: { div: '1/8t' }, x: { cond: { every: 2, at: 0, skip: b % 4 === 2 } } });
        if (!stop) { N(8, 4, r, 1, { p: { div: '1/16t' }, c: { fmIndex: [[0, 2], [1, 8]] } }); N(12, 4, r + up, 0.9, { p: { div: '1/4t' } }); }
        return n; }
      if (p === 'stair') { if (b % 2 === 0) return n; const r = at(deg, 2); [8, 10, 12, 14].forEach((s, i) => N(s, 1.8, at(deg - [0, 1, 2, 3][i], 3), 0.9 - 0.05 * i, { p: { octave: 0 }, rt: i === 3 ? 3 : 1 })); return n; }
      if (p === 'pad') { const c = chord(at, deg, 3, [2, 4]); N(0, 16, c.root, 0.5, { x: { iv: c.iv, strum: 60 } }); return n; }
      return null; },
    curves(secs) { const L = lanes();
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
        L.add('riddim', 'fmIndex', 'Riddim FM (the change, not the notes)', s.kind === 'drop' ? swells(a, e, 2, 2, 10) : [[a, 2]]); L.add('riddim', 'cutoff', 'Riddim filter', [[a, s.kind === 'drop' ? 3000 : 800], [e - 0.05, s.kind === 'drop' ? 5500 : 800]]);
        L.add('fx0', 'amount', 'The wall', [[a, s.kind === 'drop' ? 0.85 : 0.2]]); L.add('fx1', 'depth', 'Gate', [[a, s.kind === 'drop' ? 0.75 : 0.2]]);
        L.add('fx2', 'mix', 'Stair octave', [[a, 0.3], [e - 0.05, s.name === 'drop 2' ? 0.7 : 0.3]]); L.add('pad', 'cutoff', 'Pad filter', s.kind === 'build' ? [[a, 300], [e - 0.05, 9000]] : [[a, 1500]]);
        L.add('mod0', 'rate', 'Golden LFO speed', [[a, s.kind === 'drop' ? 2.4 : 0.6]]);
        L.add('mod1', 'posX', 'XY · X (riddim FM)', s.kind === 'build' ? [[a, 0], [e - 0.05, 1]] : [[a, 0.3]]); L.add('mod1', 'posY', 'XY · Y (the wall)', [[a, s.kind === 'drop' ? 0.7 : 0.1]]); L.add('stair', 'fm', 'Stair FM', [[a, 3], [e - 0.05, s.name === 'drop 2' ? 12 : 3]]); L.add('sub', 'drive', 'Sub drive', [[a, s.kind === 'drop' ? 0.25 : 0.05]]); L.add('pad', 'bloom', 'Pad bloom', [[a, 0.2], [e - 0.05, s.kind === 'break' ? 0.9 : 0.3]]); L.add('fx2', 'drive', 'Stair rectifier', [[a, 0.4], [e - 0.05, s.name === 'drop 2' ? 0.8 : 0.4]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.fx-squash', preset: 'Riddim Wall', on: 'riddim' }, { organism: 'eravos.sidechain-compressor', preset: 'Hard Gate 1/8', on: 'fx0' }, { organism: 'eravos.fx-destroyer', preset: 'Octave Rectifier', on: 'stair' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Odd · Golden LFO', to: 'riddim', key: 'knob.formantShift' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.4, maxY: 0.5 } }],
    routes: [{ from: 'mod1', out: 'x', to: 'riddim', key: 'knob.fmIndex' }, { from: 'mod1', out: 'y', to: 'fx0', key: 'amount' }, { from: 'fx1', out: 'env', to: 'stair', key: 'knob.cutoff' }],
    master: { compThresh: -9, compRatio: 3.5, reverbMix: 0.06 },
  }, { id: 'ds-riddim', title: 'Stop-Start Riddim', seed: 8904, mood: ['heavy'],
    listen: 'One triplet figure repeated; every other bar it stops dead; one small change a bar — an octave, a skip on some passes.', drop: 'The notes barely move: the FM and the wall do. Drop 2 adds a stair that falls an octave down a rectifier.', voice: 'Her voice in the pause.' });

  // ---- 11. Halo Fall — Seven Lions / Illenium / Said the Sky: melodic dubstep — a grand piano alone, emotional chords on supersaws pumping
  //          against a growl that answers, a lead that cries (bends, blooming vibrato); the pump's envelope opens the growl between pumps;
  //          the Swarm's coherence feeds the lead's echo.
  add({ id: 'deepstep-melodic', label: 'Melodic dubstep (piano, saws, a crying lead)', icon: '🕊', accent: '#8fd4ff', family: 'EDM',
    bpm: [148, 150], roots: [2, 7, 11], scales: ['major'], progs: [[6, 4, 1, 5], [1, 5, 6, 4], [4, 1, 5, 6]], leadRhythm: 'anthem', drums: { main: {} },
    tagline: 'Melodic dubstep: a grand piano alone, emotional chords on supersaws pumping against a growl that answers, a lead that cries; the pump’s envelope opens the growl between pumps, the Swarm’s coherence feeds the lead’s echo',
    form: [S('intro', 'intro', 8, ['piano']), S('verse', 'verse', 8, ['piano', 'pad', 'drums']), S('build', 'build', 8, ['drums', 'piano', 'saws', 'riser']), S('pause', 'pause', 1, ['piano']),
      S('drop', 'drop', 16, ['drums', 'sub', 'saws', 'growl', 'lead']), S('break', 'break', 8, ['piano', 'swarm']), S('build 2', 'build', 8, ['drums', 'piano', 'saws', 'riser']), S('pause 2', 'pause', 1, ['piano']),
      S('drop 2', 'drop', 16, ['drums', 'sub', 'saws', 'growl', 'lead', 'swarm']), S('outro', 'outro', 8, ['piano'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Bass Music · Melodic Dubstep', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Deep Sine', name: 'Sub', configure: { level: 0.5 } },
      piano: { role: 'chords', organism: 'eravos.piano', preset: 'Concert Grand', name: 'Grand piano', configure: { level: 0.55 } },
      pad: { role: 'chords', organism: 'eravos.pad-forge', preset: 'EDM Pad · Illenium Strings', name: 'Strings', configure: { level: 0.3 } },
      saws: { role: 'chords', organism: 'eravos.supersaw', preset: 'EDM Pad · Melodic Dubstep Saws', name: 'Saws', configure: { level: 0.4 } },
      growl: { role: 'bass', organism: 'eravos.wobble-bass', preset: 'Wide Melodic Wub', name: 'Growl', configure: { level: 0.45 } },
      lead: { role: 'lead', organism: 'eravos.supersaw', preset: 'Euphoric Lead', name: 'Lead', configure: { level: 0.4 } },
      swarm: { role: 'chords', organism: 'eravos.swarm-oscillator', preset: 'Blooming Chord', name: 'Swarm', configure: { level: 0.3 } },
      riser: { role: 'lead', organism: 'eravos.curve-synth', preset: 'Drop Whoop', name: 'Riser', configure: { level: 0.3 } },
    },
    bar(cx) { const { partKey: p, kind, b, deg, sec } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1;
      if (p === 'drums') {
        if (kind === 'build') { for (let s = 0; s < 16; s += b < 4 ? 4 : b < 7 ? 2 : 1) N(s, 1, D('snare'), 0.25 + 0.6 * (b * 16 + s) / 128); if (b < 4) kit(N, { kick: 'X.......X.......' }); if (last) N(12, 4, D('snare'), 0.9, { rt: 6, x: { rs: 'accel', rv: 'grow' } }); return n; }
        kit(N, kind === 'drop' ? { kick: 'X.........X.....', snare: '........X.......', clap: '........X.......', hat: 'x.x.x.x.x.x.xox.', ohat: '..............x.' } : { kick: 'X.......X.......', hat: '..x...x...x...x.' }, { hum: 6, late: { clap: 0.05 } }); return n; }
      if (p === 'sub') { N(0, 8, at(deg, 1), 1); N(8, 8, at(deg, 1), 0.9); return n; }
      if (p === 'piano') { const c = chord(at, deg, 4, [2, 4, 7]), lo = at(deg, 2);   // the left hand, the chord strummed up from one note, the pedal held (a knob per note)
        if (kind === 'pause') { N(0, 16, c.root, 0.8, { x: { iv: c.iv, strum: 120, fall: 0.05 }, p: { pedal: true } }); N(0, 16, lo, 0.7); return n; }
        N(0, 8, lo, 0.75, { p: { pedal: true } }); N(0, 8, c.root, 0.65, { x: { iv: c.iv, strum: 45, fall: 0.06, ht: 15, hv: 0.08 } }); N(8, 8, c.root, 0.55, { x: { iv: c.iv, strum: 60, dir: 'down', fall: 0.08, cond: b % 2 ? { every: 2, at: 1 } : undefined } }); return n; }
      if (p === 'pad') { const c = chord(at, deg, 3, [2, 4]); N(0, 16, c.root, 0.5, { x: { iv: c.iv, strum: 80 } }); return n; }
      if (p === 'saws') { const c = chord(at, deg, 4, [2, 4, 7]);
        if (kind === 'build') { N(0, 16, c.root, 0.5 + 0.4 * b / sec.bars, { x: { iv: c.iv, strum: 20 } }); return n; }
        [0, 3, 6, 8, 11, 14].forEach((s, i) => N(s, i % 3 === 2 ? 2 : 3, c.root, i % 3 ? 0.75 : 0.95, { x: { iv: c.iv, strum: 6 } })); return n; }
      if (p === 'growl') { const r = at(deg, 2); N(12, 4, r, 0.9, { p: { div: b % 2 ? '1/8t' : '1/16' }, c: { cutoff: [[0, 600], [1, 3500]] }, b: b % 4 === 3 ? { from: 0, to: -12, shape: 'late', at: 0.4 } : undefined }); return n; }
      if (p === 'lead') { const ph = b % 4, hi = at(deg + 4, 5), mid = at(deg + 2, 5), lo = at(deg, 5), cry = { rate: 6, depth: 0.4, shape: 'sine', fade: 0.5 };
        if (ph === 0) { N(0, 6, hi, 0.95, { b: { from: -2, to: 0, shape: 'early' } }); N(6, 2, mid, 0.8); N(8, 8, at(deg + 5, 5), 1, { b: { from: -1, to: 0, shape: 'early', osc: cry } }); }
        else if (ph === 1) { N(0, 4, hi, 0.9); N(4, 4, mid, 0.85, { b: { from: 0, to: -1, shape: 'late', at: 0.6 } }); N(8, 8, lo, 0.95, { b: { from: 0, to: 0, osc: cry } }); }
        else if (ph === 2) { N(0, 3, at(deg + 7, 5), 1, { b: { from: -3, to: 0, shape: 'early' } }); N(3, 3, hi, 0.85); N(6, 2, mid, 0.75, { pr: 0.6 }); N(8, 8, hi, 0.95, { b: { from: 0, to: 0, osc: cry }, c: { cutoff: [[0, 3000], [0.5, 9000], [1, 5000]] } }); }
        else { N(0, 12, at(deg + 4, 5), 1, { b: { from: -5, to: 0, shape: 'early', osc: { rate: 6, depth: 0.5, shape: 'sine', fade: 0.3 } } }); N(12, 4, mid, 0.75, { rt: 4, x: { rs: 'decel', rv: 'fade' } }); }
        return n; }
      if (p === 'swarm') { if (b % 4) return n; const c = chord(at, deg, 3, [4, 7, 9]); N(0, 64, c.root, 0.6, { x: { iv: c.iv, strum: 90, dir: 'out' } }); return n; }
      if (p === 'riser') { if (b === 0) N(0, sec.bars * 16, at(deg, 4), 0.7, { b: { from: -12, to: 12, shape: 'late', at: 0 } }); return n; }
      return null; },
    curves(secs) { const L = lanes();
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
        L.add('saws', 'cutoff', 'Saws open', s.kind === 'build' ? [[a, 400], [e - 0.05, 9000]] : [[a, 6000]]); L.add('fx0', 'depth', 'Saws pump', [[a, s.kind === 'drop' ? 0.85 : 0.3]]);
        L.add('piano', 'brightness', 'Piano brightness', [[a, s.kind === 'intro' || s.kind === 'outro' ? 0.35 : 0.55]]); L.add('fx2', 'mix', 'Piano shimmer', [[a, s.kind === 'break' ? 0.6 : 0.25], [e - 0.05, s.kind === 'outro' ? 0.7 : 0.3]]);
        L.add('fx1', 'mix', 'Lead echo', [[a, 0.3]]); L.add('fx3', 'drive', 'Growl fold', [[a, s.name === 'drop 2' ? 0.7 : 0.45]]);
        L.add('mod0', 'depth', 'Saws filter sweep', [[a, s.kind === 'drop' ? 0.5 : 0.1]]);
        L.add('mod1', 'posX', 'XY · X (lead filter)', [[a, 0.3], [e - 0.05, s.kind === 'drop' ? 0.9 : 0.4]]); L.add('mod1', 'posY', 'XY · Y (piano shimmer)', [[a, s.kind === 'break' ? 0.8 : 0.2]]);
        if (s.kind === 'break' || s.name === 'drop 2') L.add('swarm', 'coupling', 'Swarm locks', [[a, 0.1], [e - 0.05, 0.9]]); L.add('lead', 'detune', 'Lead width', [[a, 0.3], [e - 0.05, s.kind === 'drop' ? 0.7 : 0.3]]); L.add('growl', 'formantShift', 'Growl vowel', s.kind === 'drop' ? swells(a, e, 4, -6, 10) : [[a, 0]]); L.add('sub', 'drive', 'Sub warmth', [[a, s.name === 'drop 2' ? 0.25 : 0.1]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.sidechain-compressor', preset: 'Classic 1/4 Pump', on: 'saws' }, { organism: 'eravos.fx-echo', preset: 'Future Pluck Echo', on: 'lead' },
      { organism: 'eravos.fx-moddelay', preset: 'Slow Shimmer', on: 'piano' }, { organism: 'eravos.fx-destroyer', preset: 'Growl Fold · sub stays clean', on: 'growl' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Slow Filter Sweep 2 bars', to: 'saws', key: 'cutoff' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.5, maxY: 0.4 } }],
    routes: [{ from: 'fx0', out: 'env', to: 'growl', key: 'cutoff' }, { from: 'mod1', out: 'x', to: 'lead', key: 'cutoff' }, { from: 'mod1', out: 'y', to: 'fx2', key: 'mix' }, { from: 'swarm', out: 'coherence', to: 'fx1', key: 'feedback' }],
    master: { compThresh: -11, compRatio: 3, reverbMix: 0.16 },
  }, { id: 'ds-melodic', title: 'Halo Fall', seed: 8905, mood: ['her', 'warm'],
    listen: 'A grand piano alone, the pedal held, its chords strummed up from one note. Then saws pumping against a growl that answers on beat four.', drop: 'The lead cries — bends and a vibrato that blooms; in drop 2 the Swarm locks and its coherence feeds the lead’s echo.', voice: 'Her voice in the pauses, over the piano.' });

  // ---- 12. Metal Tearout — Excision / Virtual Riot / tearout: 150, chaos with a plan — the bass patch switches every half bar (three basses
  //          take turns), each hit's FM / fold / comb set note by note, machine-gun ratchets, fills that glitch; Dynamics' gain reduction
  //          drives the glitch's chaos.
  add({ id: 'deepstep-tearout', label: 'Tearout (three basses switching)', icon: '⚙', accent: '#ff2a00', family: 'EDM',
    bpm: [150, 152], roots: [6, 1, 11], scales: ['phrygian'], progs: [[1, 2, 1, 2], [1, 1, 2, 7]], leadRhythm: 'sparse', drums: { main: {} },
    tagline: 'Tearout: three basses switching every half bar, each hit’s FM, fold and comb set note by note, machine-gun ratchets, fills that glitch; Dynamics’ gain reduction drives the glitch’s chaos, the XY Pad the comb and the screech’s vowel',
    form: [S('intro', 'intro', 8, ['swarm', 'drums']), S('build', 'build', 8, ['drums', 'swarm']), S('pause', 'pause', 1, ['sub']), S('drop', 'drop', 16, ['drums', 'sub', 'metal', 'screech', 'clang']),
      S('glitch break', 'break', 4, ['swarm']), S('build 2', 'build', 8, ['drums', 'swarm']), S('pause 2', 'pause', 1, ['sub']), S('drop 2', 'drop', 24, ['drums', 'sub', 'metal', 'screech', 'clang']), S('outro', 'outro', 8, ['swarm', 'drums'])],
    parts: {
      drums: { role: 'drums', organism: 'eravos.pads', preset: 'Bass Music · Tearout Concrete', name: 'Drums' },
      sub: { role: 'bass', organism: 'eravos.sub-engine', preset: 'Dubstep Sub Layer', name: 'Sub', configure: { level: 0.5 } },
      metal: { role: 'bass', organism: 'eravos.bass-forge', preset: 'Tearout Metal', name: 'Metal (Bass Forge)', configure: { level: 0.45 } },
      screech: { role: 'bass', organism: 'eravos.wobble-bass', preset: 'Tearout Screech', name: 'Screech (Wobble Bass)', configure: { level: 0.42 } },
      clang: { role: 'bass', organism: 'eravos.wub-osc', preset: 'FM Clang 3:1', name: 'Clang (Wub Osc)', configure: { level: 0.4 } },
      swarm: { role: 'chords', organism: 'eravos.swarm-oscillator', preset: 'Metal Swarm', name: 'Swarm', configure: { level: 0.3 } },
    },
    bar(cx) { const { partKey: p, kind, b, deg, sec, seed } = cx, { n, N, at } = pen(cx), last = b === sec.bars - 1;
      const turn = (h) => ['metal', 'screech', 'clang'][(b * 2 + h + (kind === 'drop' && sec.name === 'drop 2' ? 1 : 0)) % 3];   // who has this half bar
      if (p === 'drums') {
        if (kind === 'build') { for (let s = 0; s < 16; s += b < 4 ? 4 : b < 7 ? 2 : 1) N(s, 1, D('snare'), 0.3 + 0.6 * (b * 16 + s) / 128); if (last) N(8, 8, D('snare'), 0.95, { rt: 8, x: { rs: 'accel', rv: 'grow' } }); return n; }
        kit(N, kind === 'drop' ? { kick: 'X.....X...X..X..', snare: '........X.......', clap: '........X.......', hat: 'x.x.x.x.x.x.x.x.', perc: b % 2 ? '....r.......rr..' : '' } : { kick: 'X.......X.......', hat: 'x.x.x.x.x.x.x.x.' }, { roll: 4, hum: 3, late: { clap: 0.03 } }); return n; }
      if (p === 'sub') { const r = at(deg, 1); if (kind === 'pause') { N(0, 16, r, 1, { b: { from: 0, to: -24, shape: 'late', at: 0.1 } }); return n; } N(0, 6, r, 1); N(8, 6, r, 0.9); return n; }
      if (p === 'metal' || p === 'screech' || p === 'clang') { const r = at(deg, 2), o = at(deg, 3);
        [0, 1].forEach(h => { if (turn(h) !== p) return; const s0 = h * 8, k = (b + h + seed) % 4;
          if (p === 'metal') { if (k === 0) N(s0, 8, r, 1, { rt: 8, x: { rs: 'accel', rv: 'grow' }, p: { fm: 12, fold: 0.6 } }); else { N(s0, 3, r, 1, { p: { fm: 6 + 2 * k, comb: 0.3 * k } }); N(s0 + 3, 3, o, 0.9, { p: { fold: 0.8 }, b: { from: 0, to: -12, shape: 'linear' } }); N(s0 + 6, 2, r, 0.85, { pr: 0.7, x: { cond: { every: 2, at: 1 } } }); } }
          else if (p === 'screech') { N(s0, 4, o, 1, { p: { div: '1/16' }, c: { formantShift: [[0, -12], [1, 18]] } }); N(s0 + 4, 4, r, 0.95, { p: { div: k % 2 ? '1/8t' : '1/32' }, b: { from: 0, to: last && h ? -24 : -5, shape: 'late', at: 0.4, osc: { rate: '1/32', depth: 0.3, shape: 'square' } } }); }
          else { N(s0, 2, r, 1); N(s0 + 2, 2, at(deg + 4, 2), 0.85, { b: { from: 5, to: 0, shape: 'early' } }); N(s0 + 4, 4, r, 0.9, { rt: 4, x: { rs: 'decel', rv: 'fade' }, p: { index: 18 } }); } });
        return n; }
      if (p === 'swarm') { if (b % 4) return n; const c = chord(at, deg, 3, [1, 4]); N(0, 64, c.root, 0.55, { x: { iv: c.iv, strum: 40, dir: 'out' } }); return n; }
      return null; },
    curves(secs) { const L = lanes();
      secs.forEach(s => { const a = s.bar, e = s.bar + s.bars;
        L.add('metal', 'comb', 'Metal comb', s.kind === 'drop' ? swells(a, e, 2, 0.1, 0.8) : [[a, 0.2]]); L.add('screech', 'fmIndex', 'Screech FM', [[a, 4], [e - 0.05, s.name === 'drop 2' ? 11 : 7]]);
        L.add('clang', 'index', 'Clang index', [[a, 8], [e - 0.05, 20]]); L.add('fx0', 'chaos', 'Glitch chaos', [[a, s.kind === 'drop' ? 0.5 : 0.1]]);
        L.add('fx1', 'amount', 'OTT', [[a, s.kind === 'drop' ? 0.85 : 0.3]]); L.add('fx2', 'drive', 'Screech destruction', [[a, s.name === 'drop 2' ? 0.85 : 0.6]]);
        L.add('swarm', 'restless', 'Swarm restless', [[a, s.kind === 'break' ? 0.2 : 0.6], [e - 0.05, s.kind === 'break' ? 0.9 : 0.6]]); L.add('mod0', 'rate', 'Random speed', [[a, s.kind === 'drop' ? 12 : 3]]);
        L.add('mod1', 'posX', 'XY · X (metal comb)', s.kind === 'build' ? [[a, 0], [e - 0.05, 1]] : [[a, 0.4]]); L.add('mod1', 'posY', 'XY · Y (screech vowel)', s.kind === 'drop' ? swells(a, e, 4, 0.1, 0.9) : [[a, 0.2]]); L.add('sub', 'drive', 'Sub drive', [[a, s.kind === 'drop' ? 0.3 : 0.05]]); L.add('metal', 'fm', 'Metal FM', s.kind === 'drop' ? swells(a, e, 1, 4, 16) : [[a, 4]]); L.add('fx3', 'thresh', 'Clang glue', [[a, s.kind === 'drop' ? -24 : -12]]); });
      return L.done(); },
    fx: [{ organism: 'eravos.fx-glitch', preset: 'Chaos 50', on: 'metal' }, { organism: 'eravos.fx-squash', preset: 'OTT Growl', on: 'fx0' },
      { organism: 'eravos.fx-destroyer', preset: 'Total Destruction', on: 'screech' }, { organism: 'eravos.fx-dynamics', preset: 'Bass Glue', on: 'clang' }],
    mods: [{ organism: 'eravos.lfo', preset: 'Stepped Random 1/16', to: 'metal', key: 'knob.fold' }, { organism: 'eravos.xy-pad', configure: { maxX: 0.6, maxY: 0.5 } }],
    routes: [{ from: 'fx3', out: 'gr', to: 'fx0', key: 'knob.chaos' }, { from: 'mod1', out: 'x', to: 'metal', key: 'knob.comb' }, { from: 'mod1', out: 'y', to: 'screech', key: 'knob.formantShift' }],
    master: { compThresh: -9, compRatio: 4, reverbMix: 0.06 },
  }, { id: 'ds-tearout', title: 'Metal Tearout', seed: 8906, mood: ['heavy', 'dark'],
    listen: 'Three basses take turns every half bar — metal, screech, clang — each hit its own FM, fold and comb.', drop: 'Machine-gun ratchets that speed up; the clang’s gain reduction drives the glitch’s chaos.', voice: 'Her voice in the pause, alone with the falling sub.' });

  // ===================================================================================================== gain staging (his ear, 2026-11-14:
  // "the rest sounds blown out" — measured: every kit alone at full scale, the subs as loud as the whole mix, the mixes −7 to −11 dB rms
  // against the master's −14). Every kit to 0.55, every sub halved, then each song's TRIM (dB, measured) on every part's level.
  const TRIM = { 'deepwave-nightdrive': -3.5, 'deepwave-outrun': -2.5, 'deepwave-darksynth': -5, 'deepwave-dream': 0, 'deepwave-italo': -1.5, 'deepwave-slowfunk': -3.5,
    'deepstep-og': -5.5, 'deepstep-wobble': -4, 'deepstep-talker': -4, 'deepstep-riddim': -3, 'deepstep-melodic': -4, 'deepstep-tearout': -5 };   // measured at each song's loudest 4 bars → −14 dB
  const DEFS = () => window.OrganismFactory && window.OrganismFactory.def;
  const lvlOf = (P) => { const d = DEFS() && DEFS()(P.organism), c = d && (d.config || []).find(x => x.key === (P.organism === 'eravos.pads' ? 'volume' : 'level')); return c ? c.default : 0.8; };
  function stage(G) { const k = Math.pow(10, (TRIM[G.id] || 0) / 20);
    Object.keys(G.parts).forEach(id => { const P = G.parts[id]; if (P.organism === 'eravos.arp') return;   // the Arp makes no sound
      const key = P.organism === 'eravos.pads' ? 'volume' : 'level'; P.configure = Object.assign({}, P.configure || {});
      let v = P.configure[key] !== undefined ? P.configure[key] : lvlOf(P);
      if (P.organism === 'eravos.pads') v = Math.min(v, 0.55); if (P.organism === 'eravos.sub-engine') v *= 0.5;
      P.configure[key] = Math.round(v * k * 1000) / 1000; }); }
  SE.genres().filter(g => GENRES.includes(g.id)).forEach(stage);

  // ===================================================================================================== the songs
  if (window.Songbook && window.Songbook.add) SONGS.forEach(s => window.Songbook.add(Object.assign({ tools: 'per-note knobs and knob curves · bends with their own LFO · chords from one note · plays on pass k · chance · ratchets · swing · curve lanes on tools, effects and modulators · LFO · XY Pad · a tool driving a tool' }, s)));
  window.DeepSongbook = { genres: GENRES.slice(), songs: SONGS.map(s => s.id), shelves: { '80s': GENRES.filter(g => /^deepwave/.test(g)), dubstep: GENRES.filter(g => /^deepstep/.test(g)) } };
})();
