/* ERAVOS tension & drop patterns (3.72 · specs/eravos.pattern-library.spec, addendum 3.72) — data only, into the Pattern Library.
 * James, 2026-10-24: "curves, depth, deep bass, huge drop, contrast and a lot of tensnio'"
 *   🔺 TENSION  a snare roll that speeds up 1/4 → 1/64 · a kick that thins out to nothing · both together · a sub that rises out of the floor ·
 *              a wobble whose rate speeds up bar by bar · a riser lead that climbs and bends up · curves: a riser (+12) and a filter that
 *              closes, then rips open on the last beat
 *   💥 DROP     the sub slams down from an octave above · wobble hits (a rate per note, a dive at the turn) · a Reese + sub stack · the
 *              half-time drum groove with the crash on the one and a roll back into the next phrase · the Wobble's depth swinging
 *   ⛓ CHAINS   build (8 bars of tension) → the pause (one of the four Floor Falls moves: the contrast) → a 4-bar huge drop, one click
 * Every sub plays its real note (Sub Engine Octave 0: C#1 ≈ 35 Hz) and no dive goes under ~18 Hz (3.70's finding on his #5901 session).
 * Pitches are semitones from the key's root (r): 24 = the root at octave 1 (the sub), 36 octave 2, 48 octave 3. */
(function (global) {
  'use strict';
  const PL = global.PatternLibrary; if (!PL || !PL.addSource) return;
  const BPM = 145, KICK = 36, SNARE = 37, CLAP = 38, HAT = 39, OHAT = 40, CRASH = 44;
  const R1 = 24, R2 = 36, R3 = 48;
  const SUB = { tool: 'eravos.sub-engine', preset: 'Dubstep Sub Layer', configure: { octave: 0, floor: 24, level: 0.45, phantom: 0.35 } };   // 0.45: the drop's depth (measured: 30–60 Hz share)
  const WOB = { tool: 'eravos.wobble-bass', preset: 'Half-time Growl 1/4t' };
  const REESE = { tool: 'eravos.reese-bass', preset: 'Her Drop (dubstep reese)', configure: { sub: 0.3, subOct: '0', level: 0.75 } };
  const DRUMS = { tool: 'eravos.pads', preset: 'Heavy (Dubstep/Trap)', drums: true };
  const LEAD = { tool: 'eravos.supersaw', preset: 'Festival Lead' };
  const P = (o) => Object.assign({ genre: 'tension-drops', genreLabel: 'Tension & Drops', bpm: BPM, scale: 'minor', source: 'hand-made · 3.72' }, o);
  // ---- drums
  function roll(bars) {   // the snare roll: 1/4 · 1/8 · 1/16 · 1/32 · 1/64 across the build, rising
    const n = [], div = (b) => [4, 4, 2, 2, 1, 1, 0.5, 0.25][Math.min(7, Math.floor(b * 8 / bars))];
    for (let b = 0; b < bars; b++) for (let s = 0; s < 16; s += div(b)) n.push({ s: b * 16 + s, l: Math.min(1, div(b)), n: SNARE, v: +(0.12 + 0.88 * Math.pow((b * 16 + s) / (bars * 16), 1.6)).toFixed(3) });   // starts as a whisper (tension needs room to grow)
    return n;
  }
  function thinKick(bars) {   // four on the floor → half → one a bar → nothing (the floor taken away before it falls)
    const n = []; for (let b = 0; b < bars; b++) { const f = b / bars, step = f < 0.5 ? 4 : f < 0.75 ? 8 : f < 0.875 ? 16 : 0; if (step) for (let s = 0; s < 16; s += step) n.push({ s: b * 16 + s, l: 1, n: KICK, v: 0.95 }); }
    return n;
  }
  function dropDrums() {   // half-time: the crash on the one, kick 1 and the "and" of 3, snare + clap on 3, hats in 8ths, a roll back in at the end
    const n = [], hit = (s, p, v, l) => n.push({ s, l: l || 1, n: p, v });
    for (let b = 0; b < 4; b++) { const o = b * 16;
      if (b === 0) hit(o, CRASH, 1, 8);
      hit(o, KICK, 1); hit(o + 10, KICK, 0.85); hit(o + 8, SNARE, 1); hit(o + 8, CLAP, 0.9);
      for (let s = 0; s < 16; s += 2) hit(o + s, s % 4 ? HAT : HAT, s % 4 ? 0.55 : 0.8); hit(o + 6, OHAT, 0.6); hit(o + 14, OHAT, 0.6);
      if (b === 3) for (let s = 12; s < 16; s += 0.5) hit(o + s, SNARE, +(0.5 + 0.5 * (s - 12) / 4).toFixed(3), 0.5); }
    return n;
  }
  // the gap: a build stops dead half a beat before the pause (the Song Engine's own cut before a drop) — nothing rings into the hole
  const gap = (notes, bars) => { const cut = bars * 16 - 2; return notes.filter(n => n.s < cut).map(n => n.s + n.l > cut ? Object.assign({}, n, { l: cut - n.s }) : n); };
  // ---- the patterns
  const T_ROLL = P(Object.assign({ name: 'Snare roll that speeds up', type: 'tension', bars: 8, notes: gap(roll(8), 8) }, DRUMS));
  const T_KICK = P(Object.assign({ name: 'Kick that thins out to nothing', type: 'tension', bars: 8, notes: thinKick(8) }, DRUMS));
  const T_DRUMS = P(Object.assign({ name: 'Build: the kick thins, the roll speeds up', type: 'tension', bars: 8, notes: gap(thinKick(8).concat(roll(8)), 8).sort((a, b) => a.s - b.s) }, DRUMS));
  // the sub comes in halfway and climbs out of the floor, louder each bar (one long rise, cut into four so it can grow)
  const T_SUB = P(Object.assign({ name: 'Sub rising out of the floor', type: 'tension', bars: 4, notes: [0, 1, 2, 3].map(b => ({ s: b * 16, l: 16, r: R1, v: +(0.35 + 0.17 * b).toFixed(2), b: { from: -10 + 2.5 * b, to: -7.5 + 2.5 * b, shape: 'linear', at: 0 } })).map((n, i) => i === 3 ? Object.assign(n, { l: 14 }) : n) }, SUB));
  const T_WOB = P(Object.assign({ name: 'Wobble that speeds up', type: 'tension', bars: 4, notes: ['1/4', '1/8', '1/16', '1/32'].map((div, b) => Object.assign({ s: b * 16, l: 16, r: R2, v: +(0.6 + 0.13 * b).toFixed(2), p: { div } }, b === 3 ? { b: { from: 0, to: 0, osc: { rate: '1/16', rateTo: '1/32', depth: 0.5, shape: 'sine', fade: 0.3 } } } : {})).map((n, i) => i === 3 ? Object.assign(n, { l: 14 }) : n) }, WOB));
  const T_LEAD = P(Object.assign({ name: 'Riser lead: climbs, then bends up', type: 'tension', bars: 8, notes: [0, 0, 2, 3, 5, 7, 8, 10].map((st, b) => Object.assign({ s: b * 16, l: 16, r: R3 + 12 + st, v: +(0.22 + 0.7 * Math.pow(b / 7, 1.4)).toFixed(2) }, b === 7 ? { b: { from: 0, to: 12, shape: 'early', osc: { rate: '1/16', rateTo: '1/32', depth: 0.3, shape: 'sine', fade: 0.3 } } } : {})).map((n, i) => i === 7 ? Object.assign(n, { l: 14 }) : n) }, LEAD));
  const T_RISER = P(Object.assign({ name: 'Riser curve: up an octave, snaps back on the hit', type: 'tension', bars: 8, curve: { key: '@pitch', points: [[0, 0], [7.95, 12], [8, 0]] } }, LEAD));
  const T_RIP = P(Object.assign({ name: 'Filter closes, then rips open', type: 'tension', bars: 8, curve: { key: 'cutoff', points: [[0, 2500], [5, 220], [7.6, 260], [7.95, 8000], [8, 400]] } }, WOB));
  const D_SUB = P(Object.assign({ name: '💥 Sub slams down from an octave above', type: 'bass', bars: 4, notes: [
    { s: 0, l: 10, r: R1, v: 1, b: { from: 12, to: 0, shape: 'early' } }, { s: 12, l: 4, r: R1, v: 0.85 }, { s: 16, l: 10, r: R1, v: 1 }, { s: 28, l: 4, r: R1, v: 0.85 },
    { s: 32, l: 10, r: R1 + 3, v: 1 }, { s: 44, l: 4, r: R1 + 3, v: 0.85 }, { s: 48, l: 16, r: R1, v: 1, b: { from: 0, to: -10, shape: 'late', at: 0.5 } }] }, SUB));
  const D_WOB = P(Object.assign({ name: '💥 Wobble hits: a rate per note, a dive at the turn', type: 'wobble', bars: 4, notes: [
    { s: 0, l: 4, r: R2, v: 1, p: { div: '1/8' } }, { s: 4, l: 2, r: R2, v: 0.9, p: { div: '1/16' } }, { s: 8, l: 6, r: R2 + 7, v: 0.95, p: { div: '1/8t' }, b: { from: 5, to: 0, shape: 'early' } },
    { s: 16, l: 3, r: R2, v: 1, p: { div: '1/16' } }, { s: 19, l: 3, r: R3, v: 0.9, p: { div: '1/16' }, b: { from: 0, to: -12, shape: 'linear' } }, { s: 24, l: 8, r: R2, v: 0.95, p: { div: '1/4t' } },
    { s: 32, l: 6, r: R2, v: 1, p: { div: '1/8t' } }, { s: 38, l: 2, r: R2 + 7, v: 0.85, p: { div: '1/16' } }, { s: 40, l: 4, r: R3, v: 0.95, p: { div: '1/16' }, b: { from: 7, to: 0, shape: 'early' } }, { s: 44, l: 4, r: R2, v: 0.9, p: { div: '1/8' } },
    { s: 48, l: 16, r: R2, v: 1, p: { div: '1/8' }, b: { from: 0, to: -12, shape: 'late', at: 0.4, osc: { rate: '1/8', rateTo: '1/32', depth: 0.4, shape: 'sine' } } }] }, WOB));
  const D_REESE = P(Object.assign({ name: '💥 Reese + sub: the stack that talks', type: 'bass', bars: 4, notes: [
    { s: 0, l: 6, r: R3, v: 1, b: { from: -2, to: 0, shape: 'early' } }, { s: 6, l: 2, r: R3 + 7, v: 0.85 }, { s: 8, l: 8, r: R3, v: 0.95, b: { from: 0, to: 0, osc: { rate: '1/8', depth: 0.5, shape: 'sine', fade: 0.3 } } },
    { s: 16, l: 3, r: R3, v: 1 }, { s: 19, l: 3, r: R3 + 3, v: 0.9, b: { from: 2, to: 0, shape: 'early' } }, { s: 24, l: 8, r: R3 + 5, v: 0.95, b: { from: 0, to: -5, shape: 'late', at: 0.5 } },
    { s: 32, l: 4, r: R3, v: 1 }, { s: 36, l: 4, r: R3 + 12, v: 0.9, b: { from: 0, to: -12, shape: 'linear' } }, { s: 40, l: 8, r: R3, v: 0.95, b: { from: 0, to: 0, osc: { rate: '1/16', rateTo: '1/4', depth: 0.6, shape: 'triangle' } } },
    { s: 48, l: 16, r: R3, v: 1, b: { from: 0, to: -12, shape: 'late', at: 0.45, osc: { rate: '1/8', rateTo: '1/32', depth: 0.35, shape: 'sine' } } }] }, REESE));
  const D_DRUMS = P(Object.assign({ name: '💥 Half-time drop drums: crash on the one, a roll back in', type: 'drums', bars: 4, notes: dropDrums() }, DRUMS));
  const D_DEPTH = P(Object.assign({ name: '💥 Wobble depth swinging through the drop', type: 'curve', bars: 4, curve: { key: 'depth', points: [[0, 3], [3.95, 6], [4, 3]], osc: { rate: '1/2', depth: 1.2, shape: 'triangle' } } }, WOB));
  // ---- chains: build → pause (a Floor Falls move) → huge drop
  function pauses() {
    const FF = global.FloorFallsSongbook, SE = global.SongEngine, G = FF && SE && SE.genres().find(g => g.id === 'hd-floor-falls'); if (!G) return [];
    return [7001, 7002, 7003, 7004].map(seed => { const mv = FF.moveOf(seed), all = PL.fromGenre(G, seed, '') || [], p = all.find(x => x.type === 'drop'); if (!p) return null;
      // freefall is the sub's fall plus every bass bending down an octave with it: its Pitch curves come along (the Wobble's and the Reese's)
      const curves = mv === 'freefall' ? all.filter(x => x.curve && x.curve.key === '@pitch' && /Freefall/.test(x.name)).map(c => Object.assign(c, { curve: Object.assign({}, c.curve, { points: c.curve.points.filter(q => q[0] <= 1.01) }), bars: 1 })) : [];
      return Object.assign(p, { move: mv, with: curves }); }).filter(Boolean);
  }
  const SAY = { falls: 'the floor falls', stairs: 'stairs down', freefall: 'freefall', rises: 'rises from the floor' };
  PL.addSource(() => {
    const base = [T_ROLL, T_KICK, T_DRUMS, T_SUB, T_WOB, T_LEAD, T_RISER, T_RIP, D_SUB, D_WOB, D_REESE, D_DRUMS, D_DEPTH];
    const chains = pauses().map((pause, i) => {
      const bass = i % 2 ? D_REESE : D_WOB;   // two chains drop on the Wobble, two on Raven Drop's Reese
      // the pause is a HOLE above the sub: the move alone (its dive is the event), everything else stops — measured above 150 Hz
      const hole = Object.assign({}, pause, { notes: pause.notes.map(n => Object.assign({}, n, { v: +(n.v * 0.6).toFixed(3), p: Object.assign({}, n.p, { phantom: 0, drive: 0, click: 0 }) })) });   // per-note: a pure sine — nothing above the sub
      const parts = [{ at: 0, pattern: T_DRUMS }, { at: 4, pattern: T_SUB }, { at: 0, pattern: T_LEAD }, { at: 0, pattern: T_RISER }, { at: 4, pattern: T_WOB }, { at: 0, pattern: T_RIP },
        { at: 8, pattern: hole }, ...(pause.with || []).filter(c => c.tool === (bass === D_WOB ? WOB.tool : REESE.tool) || c.tool === WOB.tool).map(c => ({ at: 8, pattern: c })), { at: 9, pattern: D_DRUMS }, { at: 9, pattern: D_SUB }, { at: 9, pattern: bass }].concat(bass === D_WOB ? [{ at: 9, pattern: D_DEPTH }] : []);
      return P({ name: 'Build → ' + SAY[pause.move] + ' → ' + (bass === D_WOB ? 'wobble drop' : 'Reese drop'), type: 'chain', bars: 13, tool: 'eravos.pads', move: pause.move, parts });
    });
    return base.concat(chains);
  });
  global.TensionDropPatterns = { BPM, parts: { T_ROLL, T_KICK, T_DRUMS, T_SUB, T_WOB, T_LEAD, T_RISER, T_RIP, D_SUB, D_WOB, D_REESE, D_DRUMS, D_DEPTH } };
})(typeof window !== 'undefined' ? window : globalThis);
