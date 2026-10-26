/* ERAVOS drum recipes (3.74b · specs/eravos.phase74b-map.spec D-74b.1) — window.DrumRecipes. Packs ADD drum sounds as data.
 * James, 2026-10-25: "each pack for the dumpad needs to be completely different sounds. every pack needs to be additive." · "yes like there
 * is supposed to be full range of synthwave sounds and tools".
 * A recipe is one named sound for one of the Drum Machine's voices (kick snare clap hat openhat 808 rim tom crash perc shaker cowbell),
 * registered by a pack and played next to the built-in models — nothing is replaced. The Drum Machine plays it through its own
 * interpreter (pads.engine.js recipeVoice): the pad's Tune shifts every pitch, its Decay stretches every envelope (relative to the recipe's
 * own decay), Tone / Drive / Level / Pan work as on any pad.
 *   { pack, voice, name, label?, decay, color?, layers: [layer…] }   — layers sound together:
 *   tone   { k:'tone', wave, f, from?, glide?, a?, d, hold?, gain, filter? }    an oscillator; from × f → f over glide s (a pitch drop / "pew")
 *   noise  { k:'noise', color?, filter:{ type, f, q, to?, time? }, a?, d, hold?, gain }   filtered noise; to = where the filter sweeps
 *   fm     { k:'fm', f, ratio, index, d, gain, from?, glide? }                   a sine modulated by a sine (bells, metal, zaps)
 *   metal  { k:'metal', base?, ratios?, filter, d, hold?, gain }                 squares at metallic ratios through a filter (hats, bells)
 *   burst  { k:'burst', count, gap, each, filter, tail?, gain }                  repeated noise hits then a tail (claps)
 *   stack  { k:'stack', wave, f, notes:[semitones], d, gain, filter?, detune? }   a chord of oscillators (an orchestra hit)
 *   hold (s): the level holds, then falls in 10 ms — the GATED tail of an 80s room. Decays are seconds at Decay = the recipe's decay. */
(function (global) {
  'use strict';
  const all = new Map();   // voice|name → recipe
  const key = (v, n) => v + '|' + n;
  const VOICES = ['kick', 'snare', 'hat', 'openhat', 'clap', '808', 'rim', 'tom', 'crash', 'perc', 'shaker', 'cowbell'];
  const DR = {
    add(r) {
      if (!r || !VOICES.includes(r.voice) || !r.name || !Array.isArray(r.layers) || !r.layers.length) throw new Error('DrumRecipes.add: { pack, voice, name, layers } needed');
      const k = key(r.voice, r.name); if (all.has(k) && all.get(k).pack !== r.pack) throw new Error(`DrumRecipes: ${r.voice} "${r.name}" already belongs to ${all.get(k).pack}`);   // additive: a pack never overwrites another's sound
      all.set(k, Object.assign({ decay: 0.3 }, r)); return DR;
    },
    has: (v, n) => all.has(key(v, n)),
    get: (v, n) => all.get(key(v, n)) || null,
    names: (v) => Array.from(all.values()).filter(r => r.voice === v).map(r => r.name),
    defaults: (v, n) => { const r = all.get(key(v, n)); return r ? Object.assign({ decay: r.decay }, r.color ? { color: r.color } : {}) : null; },
    byPack: (pack) => Array.from(all.values()).filter(r => r.pack === pack),
    packs: () => Array.from(new Set(Array.from(all.values()).map(r => r.pack))),
    all: () => Array.from(all.values()),
  };
  global.DrumRecipes = DR;
})(typeof window !== 'undefined' ? window : globalThis);
