/* ERAVOS drum pack: SYNTHWAVE (3.74b · specs/eravos.phase74b-map.spec P74b.2) — its OWN sounds, added next to every other pack's.
 * James, 2026-10-25: "also each pack for the dumpad needs to be completely different sounds. every pack needs to be additive." · "yes like
 * there is supposed to be full range of synthwave sounds and tools".
 * The full range of the 80s machines synthwave is built from, as recipes (core/drum-recipes.js), none of them a re-tune of a built-in model:
 *   LinnDrum / LM-1 (short sampled thump kick, tight snare, 4-hit clap, crisp hats) · Oberheim DMX (round kick, fat snare, open hat, cowbell)
 *   Simmons SDS-V (the swept "pew" toms and kick, the electronic snare) · the GATED-REVERB snare and clap (the room held, then cut) ·
 *   Syndrum (the long falling tom) · tambourine · cabasa · claves · the orchestra hit · a synth stab · a pulse bass hit · a gated crash.
 * Kits: Neon Gated (Linn + gated room) · Night Drive Simmons · DMX Outrun · Chrome Ballroom (darker, slower). Every pad of every kit plays
 * a Synthwave sound (tests/p74b-drum-packs.test.js measures each one apart from every other pack's sounds). */
(function (global) {
  'use strict';
  const DR = global.DrumRecipes, KP = global.KitPacks; if (!DR) return;
  const PACK = 'synthwave', S = (voice, name, label, decay, layers, color) => DR.add({ pack: PACK, voice, name, label, decay, layers, color });

  // ---- kicks
  S('kick', 'linn', 'LinnDrum kick: a short sampled thump, no boom', 0.14, [
    { k: 'tone', wave: 'sine', f: 78, from: 1.5, glide: 0.015, d: 0.13, gain: 0.9 },
    { k: 'tone', wave: 'triangle', f: 156, from: 1.3, glide: 0.01, d: 0.04, gain: 0.4 },
    { k: 'noise', color: 'white', filter: { type: 'bandpass', f: 3200, q: 0.7 }, d: 0.022, gain: 0.6 }]);
  S('kick', 'dmx', 'Oberheim DMX kick: round, a little saturated, a soft knock', 0.38, [
    { k: 'tone', wave: 'sine', f: 52, from: 2.4, glide: 0.04, d: 0.38, gain: 1 },
    { k: 'tone', wave: 'square', f: 52, from: 2, glide: 0.03, d: 0.12, gain: 0.35, filter: { type: 'lowpass', f: 900, q: 0.9 } },
    { k: 'noise', color: 'pink', filter: { type: 'bandpass', f: 1500, q: 0.9 }, d: 0.035, gain: 0.55 }]);
  S('kick', 'simmons', 'Simmons SDS-V kick: a long electronic sweep with a noise bite', 0.65, [
    { k: 'tone', wave: 'sine', f: 40, from: 5, glide: 0.22, d: 0.65, gain: 0.95 },
    { k: 'noise', color: 'white', filter: { type: 'bandpass', f: 2400, q: 1.2, to: 300, time: 0.12 }, d: 0.12, gain: 0.7 }]);

  // ---- snares
  S('snare', 'gated', 'GATED-REVERB snare: a big room held for 220 ms, then cut dead (Phil Collins, every 1984 ballad)', 0.3, [
    { k: 'tone', wave: 'triangle', f: 196, from: 1.25, glide: 0.02, d: 0.09, gain: 0.55 },
    { k: 'noise', color: 'white', filter: { type: 'bandpass', f: 2600, q: 0.6 }, d: 0.05, gain: 0.7 },
    { k: 'noise', color: 'pink', filter: { type: 'lowpass', f: 5200, q: 0.4 }, a: 0.012, d: 0.3, hold: 0.22, gain: 0.55 }]);
  S('snare', 'linn', 'LinnDrum snare: tight, bright, a short ring', 0.16, [
    { k: 'tone', wave: 'sine', f: 238, from: 1.15, glide: 0.012, d: 0.06, gain: 0.5 },
    { k: 'tone', wave: 'sine', f: 330, d: 0.04, gain: 0.25 },
    { k: 'noise', color: 'white', filter: { type: 'highpass', f: 3200, q: 0.5 }, d: 0.15, gain: 0.75 }]);
  S('snare', 'simmons', 'Simmons snare: pitched, swept down, plasticky', 0.24, [
    { k: 'tone', wave: 'sine', f: 280, from: 1.9, glide: 0.09, d: 0.22, gain: 0.75 },
    { k: 'noise', color: 'white', filter: { type: 'bandpass', f: 1700, q: 1.6, to: 900, time: 0.15 }, d: 0.2, gain: 0.55 }]);
  S('snare', 'dmx', 'DMX snare: fat and dark, a long pink tail', 0.32, [
    { k: 'tone', wave: 'triangle', f: 172, from: 1.3, glide: 0.025, d: 0.12, gain: 0.7 },
    { k: 'noise', color: 'pink', filter: { type: 'lowpass', f: 3400, q: 0.6 }, d: 0.3, gain: 0.85 }]);

  // ---- claps, rim
  S('clap', 'linn', 'LinnDrum clap: four quick hands, a bright tail', 0.16, [
    { k: 'burst', count: 4, gap: 0.0105, each: 0.009, filter: { type: 'bandpass', f: 2100, q: 2.2 }, tail: 0.14, gain: 0.95 }]);
  S('clap', 'gated', 'GATED clap: the clap in the held room, cut at 330 ms', 0.3, [
    { k: 'burst', count: 3, gap: 0.013, each: 0.01, filter: { type: 'bandpass', f: 1100, q: 1 }, tail: 0.05, gain: 0.8 },
    { k: 'noise', color: 'pink', filter: { type: 'bandpass', f: 1300, q: 0.5 }, a: 0.01, d: 0.36, hold: 0.32, gain: 0.7 }]);
  S('rim', 'electro', 'electronic rimshot: a woody FM tick (the 80s rim click)', 0.06, [
    { k: 'fm', f: 1720, ratio: 1.47, index: 1.6, d: 0.05, gain: 0.7 },
    { k: 'noise', color: 'white', filter: { type: 'highpass', f: 5000, q: 0.7 }, d: 0.012, gain: 0.35 }]);

  // ---- hats, cymbal
  S('hat', 'linn', 'LinnDrum hat: a crisp tick with a short sampled ring under it', 0.16, [
    { k: 'noise', color: 'white', filter: { type: 'bandpass', f: 10500, q: 3 }, a: 0.002, d: 0.04, gain: 1 },
    { k: 'metal', base: 640, filter: { type: 'bandpass', f: 6800, q: 4 }, d: 0.16, gain: 0.45 }]);
  S('openhat', 'dmx', 'DMX open hat: a long breathy wash', 0.5, [
    { k: 'noise', color: 'white', filter: { type: 'bandpass', f: 8200, q: 0.5 }, d: 0.5, gain: 0.8 },
    { k: 'metal', base: 330, filter: { type: 'highpass', f: 6000, q: 0.7 }, d: 0.3, gain: 0.2 }]);
  S('crash', 'gated', 'GATED crash: a splash held, then cut (the 80s stinger)', 0.5, [
    { k: 'noise', color: 'white', filter: { type: 'highpass', f: 4200, q: 0.5 }, d: 0.5, hold: 0.3, gain: 0.7 },
    { k: 'metal', base: 260, filter: { type: 'bandpass', f: 5200, q: 0.8 }, d: 0.5, hold: 0.3, gain: 0.3 }]);

  // ---- toms
  S('tom', 'simmons', 'Simmons tom: THE "pew" — a pitched sweep down with a noise attack', 0.6, [
    { k: 'tone', wave: 'sine', f: 105, from: 3.2, glide: 0.38, d: 0.6, gain: 0.95 },
    { k: 'noise', color: 'white', filter: { type: 'bandpass', f: 2600, q: 2, to: 500, time: 0.14 }, d: 0.1, gain: 0.6 }]);
  S('tom', 'syndrum', 'Syndrum: a long falling tone, an octave and more (the disco-into-80s laser tom)', 0.9, [
    { k: 'tone', wave: 'triangle', f: 150, from: 3.2, glide: 0.8, d: 0.9, gain: 0.8 }]);

  // ---- percussion
  S('perc', 'tambourine', 'tambourine: jingles shaken in, a shimmer out', 0.14, [
    { k: 'burst', count: 3, gap: 0.016, each: 0.012, filter: { type: 'highpass', f: 9500, q: 0.9 }, tail: 0.08, gain: 0.6 },
    { k: 'metal', base: 1460, ratios: [1, 1.13, 1.41, 1.73, 2.21], filter: { type: 'bandpass', f: 6500, q: 3 }, d: 0.28, gain: 0.85 }]);
  S('perc', 'claves', 'claves: two hard woods, one pitch', 0.06, [
    { k: 'tone', wave: 'sine', f: 2500, d: 0.06, gain: 0.85 }, { k: 'tone', wave: 'sine', f: 5020, d: 0.015, gain: 0.2 }]);
  S('perc', 'orch-hit', 'orchestra hit: the Fairlight stab — a whole orchestra on one note, falling in a lowpass', 0.55, [
    { k: 'stack', wave: 'sawtooth', f: 262, notes: [-12, 0, 4, 7, 12], detune: 9, filter: { type: 'lowpass', f: 5200, q: 1, to: 1100, time: 0.4 }, d: 0.55, gain: 0.9 },
    { k: 'noise', color: 'pink', filter: { type: 'bandpass', f: 900, q: 0.8 }, d: 0.04, gain: 0.35 }]);
  S('perc', 'stab', 'synth stab: a minor-7 chord of square waves, short', 0.28, [
    { k: 'stack', wave: 'square', f: 220, notes: [0, 3, 7, 10], detune: 6, filter: { type: 'lowpass', f: 3200, q: 3, to: 900, time: 0.2 }, d: 0.28, gain: 0.8 }]);
  S('shaker', 'cabasa', 'cabasa: beads rolled — a soft attack, a dry hiss', 0.13, [
    { k: 'burst', count: 2, gap: 0.03, each: 0.025, filter: { type: 'bandpass', f: 4800, q: 1.5 }, tail: 0.1, gain: 0.85 }]);
  S('cowbell', 'dmx', 'DMX cowbell: two squares a fifth-ish apart, a hollow ring', 0.3, [
    { k: 'metal', base: 562, ratios: [1, 1.48], filter: { type: 'bandpass', f: 2400, q: 1.6 }, d: 0.3, gain: 1 },
    { k: 'metal', base: 562, ratios: [1, 1.48], filter: { type: 'bandpass', f: 900, q: 2 }, d: 0.05, gain: 0.5 }]);
  S('808', 'pulse', 'pulse bass hit: a filtered saw note that plucks (the outrun bass on one pad)', 0.7, [
    { k: 'tone', wave: 'sawtooth', f: 55, d: 0.7, gain: 0.7, filter: { type: 'lowpass', f: 1800, q: 4, to: 220, time: 0.25 } },
    { k: 'tone', wave: 'square', f: 27.5, d: 0.7, gain: 0.35, filter: { type: 'lowpass', f: 300, q: 0.7 } }]);

  // ---- kits: every pad a Synthwave sound
  if (!KP) return;
  const P = (voice, model, o) => Object.assign({ voice, model }, o || {});
  KP.add({ id: PACK, label: 'Synthwave', kits: {
    'Neon Gated': [P('kick', 'linn'), P('snare', 'gated'), P('clap', 'gated'), P('hat', 'linn'), P('openhat', 'dmx', { choke: 1 }), P('808', 'pulse'), P('rim', 'electro'), P('tom', 'simmons', { tune: 5 }),
      P('crash', 'gated'), P('perc', 'tambourine'), P('shaker', 'cabasa'), P('cowbell', 'dmx'), P('tom', 'simmons'), P('snare', 'linn'), P('perc', 'orch-hit'), P('perc', 'claves')],
    'Night Drive Simmons': [P('kick', 'simmons'), P('snare', 'simmons'), P('clap', 'linn'), P('hat', 'linn', { tune: 2 }), P('openhat', 'dmx', { choke: 1, decay: 0.35 }), P('808', 'pulse', { tune: -2 }), P('rim', 'electro', { tune: -3 }), P('tom', 'simmons', { tune: 7 }),
      P('tom', 'simmons', { tune: 2 }), P('tom', 'simmons', { tune: -3 }), P('tom', 'simmons', { tune: -8 }), P('tom', 'syndrum'), P('perc', 'stab'), P('crash', 'gated'), P('snare', 'gated', { tune: -2 }), P('shaker', 'cabasa')],
    'DMX Outrun': [P('kick', 'dmx'), P('snare', 'dmx'), P('clap', 'linn', { tune: -2 }), P('hat', 'linn', { tune: -3, decay: 0.035 }), P('openhat', 'dmx', { choke: 1 }), P('808', 'pulse', { tune: 3 }), P('rim', 'electro'), P('tom', 'syndrum', { tune: 3 }),
      P('cowbell', 'dmx'), P('perc', 'tambourine', { tune: 2 }), P('perc', 'orch-hit'), P('perc', 'orch-hit', { tune: -5 }), P('perc', 'stab', { tune: 5 }), P('perc', 'claves', { tune: -2 }), P('crash', 'gated', { decay: 1 }), P('kick', 'linn', { tune: -3 })],
    'Chrome Ballroom': [P('kick', 'dmx', { tune: -3, decay: 0.45 }), P('snare', 'gated', { tune: -4, decay: 0.4 }), P('clap', 'gated', { tune: -3 }), P('hat', 'linn', { tune: -5 }), P('openhat', 'dmx', { choke: 1, tune: -4, decay: 0.7 }), P('808', 'pulse', { tune: -5, decay: 1.1 }), P('rim', 'electro', { tune: -7 }), P('tom', 'syndrum', { tune: -5 }),
      P('tom', 'simmons', { tune: -5 }), P('perc', 'stab', { tune: -5 }), P('perc', 'orch-hit', { tune: -7 }), P('crash', 'gated', { tune: -3 }), P('shaker', 'cabasa', { tune: -3 }), P('cowbell', 'dmx', { tune: -5 }), P('snare', 'simmons', { tune: -5 }), P('kick', 'simmons', { tune: -4 })],
  } });
})(typeof window !== 'undefined' ? window : globalThis);
