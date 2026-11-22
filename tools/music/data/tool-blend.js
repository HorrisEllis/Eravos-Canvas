/* ERAVOS music data — tool-blend.js → window.ToolBlend (2026-11-20; specs/eravos.assembled-tool.spec ADDENDA (3), 2026-11-21).
 * His words (2026-11-20): "next. i want to be able to swap components between tools. like i want to combine wobble bass and retro dco."
 * Data beside the tools, never in their engines (axiom 1): for each tool that has a PROFILE, its saved settings → the Wobble Builder's slots
 * (voice · wobble · mouth · drive · fx), so two tools blown up on the canvas can be SYNTHESIZED together — each part from the tool it is most
 * itself in — into one tool of its own (tools/music/core/assembled-tool.js; his words 2026-11-21: "Do it. Then remove that tool.").
 * A tool is read through its saved settings (what a project keeps), never its internals. What a profile cannot carry is named (behind).
 *   ToolBlend.has(toolId) · ToolBlend.slots(toolId, params, bpm) → { voice: {…}, wobble: {…}, mouth: {…}, drive: {…}, fx: {…} }
 *   ToolBlend.combine(a, b, pick, bpm) → builder settings     a / b: { id, params }   pick: { voice: 'a' | 'b', wobble, mouth, drive, fx }
 *   ToolBlend.paramsOf(instanceId) → its saved settings · ToolBlend.defaultsOf(toolId) · ToolBlend.behind(toolId) → [what stays behind]
 *   ToolBlend.SLOTS · ToolBlend.pickFor(aId, bId) → the default pick (each slot from the tool it is most itself in) */
(function (root) {
  'use strict';
  const SLOTS = ['voice', 'wobble', 'mouth', 'drive', 'fx'];
  const BDIVS = ['1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
  const BEATS = { '1/1': 4, '1/2': 2, '1/4': 1, '1/4t': 2 / 3, '1/8': 0.5, '1/8t': 1 / 3, '1/16': 0.25, '1/16t': 1 / 6, '1/32': 0.125 };
  const clamp = (x, a, b) => Math.max(a, Math.min(b, +x || 0));
  const nearestDiv = (hz, bpm) => { let best = '1/8', d = 1e9; BDIVS.forEach(k => { const f = 1 / (BEATS[k] * 60 / (bpm || 120)), e = Math.abs(Math.log(f / Math.max(0.01, hz))); if (e < d) { d = e; best = k; } }); return best; };
  const divOf = (dv) => ({ '1/4.': '1/4', '1/8.': '1/8', '1/16.': '1/16', '1/64': '1/32' })[dv] || (BDIVS.includes(dv) ? dv : '1/8');
  const echo = (t) => ({ '1/4.': '1/4', '1/2': '1/4' })[t] || (['1/16', '1/8', '1/8.', '1/4'].includes(t) ? t : '1/8.');

  const PROFILES = {
    'eravos.wobble-bass': {
      behind: ['its formant / comb mouth (vowels)', 'the wub sequence and drawn shapes', 'FM, ring, unison voices, the wavetable', 'the amp chain, squash, clipper'],
      slots: (P) => ({
        voice: { wave: (P.osc2 || 0) > 0.6 ? 'square' : 'saw', pw: 0.5, sub: clamp(P.sub, 0, 1), subOct: P.subOct === '-2' ? -2 : -1, octave: clamp(P.octave, -2, 1), glide: clamp(P.glide, 0, 0.5),
          noise: clamp(P.noise, 0, 1), noiseColour: P.partNoise === 'osc-noise' ? ({ band: 'band-limited' })[P.pnColour] || P.pnColour || 'white' : 'white' },
        wobble: { rate: divOf(P.div), lfoShape: ({ sine: 'sine', sawdown: 'saw down', square: 'square', yoy: 'triangle', draw: 'smooth random' })[P.lfoShape] || 'sine', depth: clamp(P.depth, 0, 5) },
        mouth: Object.assign({ cutoff: clamp(P.cutoff, 40, 3000), reso: clamp(((+P.res || 6) - 0.5) / 20, 0, 0.95), envAmt: clamp(P.fEnvAmt, 0, 4), envDecay: clamp(P.fEnvDecay || 0.3, 0.01, 2), envSustain: 0 },
          P.partFilter === 'filter-ladder' ? { mouth: 'filter-ladder', mLadMode: ({ lp24: 'lowpass 24', lp12: 'lowpass 12', bp12: 'bandpass 12', hp12: 'highpass 12', hp24: 'highpass 24' })[P.pfLadMode] || 'lowpass 24', mLadDrive: clamp(P.pfLadDrive, 0, 18), mLadBass: clamp(P.pfBass, 0, 1) }
            : { mouth: 'filter-svf', mSvfMode: ['bandpass', 'notch'].includes(P.filterMode) ? P.filterMode : 'lowpass', mSvfStages: P.slope === '12' ? 1 : P.slope === '36' ? 3 : 2 }),
        drive: P.partDrive === 'saturator-tape' ? { drive: 'saturator-tape', dTapeDrive: clamp(P.pdDrive, 0, 20), dTapeBump: clamp(P.pdBump, 0, 6) }
          : P.partDrive === 'bitcrusher' ? { drive: 'bitcrusher', dCrushBits: clamp(P.pdBits, 3, 16), dCrushRate: clamp(P.pdRate, 2000, 40000) }
          : P.partDrive === 'saturator-tube' ? { drive: 'saturator-tube', dTubeDrive: clamp(P.pdDrive, 0, 20), dTubeBias: clamp(P.pdBias, 0, 1), dTubeTone: clamp(P.pdTone, -1, 1) }
          : { drive: 'saturator-tube', dTubeDrive: clamp((+P.drive || 0.4) * 20, 0, 20) },   // its own pre-drive, as the nearest shared part
        fx: P.partInsert === 'delay-line' ? { fx: 'delay-line', fDelTime: echo(P.piTime), fDelFb: clamp(P.piFeedback, 0, 0.8), fDelMix: clamp(P.piMix, 0, 0.5) }
          : P.partInsert === 'ensemble-core' ? { fx: 'ensemble-core', fEnsMode: P.peMode || 'juno I', fEnsMix: clamp(P.peMix === undefined ? 0.5 : P.peMix, 0, 1) }   // the chorus dragged in from Retro DCO (3.204)
          : P.partInsert === 'saturator-tape' ? { fx: 'saturator-tape', fTapeDrive: clamp(P.pdDrive, 0, 12) } : P.partInsert === 'bitcrusher' ? { fx: 'bitcrusher', fCrushBits: clamp(P.pdBits, 4, 16) } : { fx: 'none' },
      }),
      best: ['wobble', 'drive'],   // what it is most itself in (the default pick)
    },
    'eravos.retro-dco': {
      behind: ['the voice cards (poly, steal)', 'poly-mod, hard sync, the arp', 'unison and drift', 'the bucket-brigade hiss in front of the chorus'],
      slots: (P, bpm) => ({
        voice: { wave: (+P.pulse || 0) > (+P.saw || 0) ? 'pulse' : 'saw', pw: clamp(P.width, 0.05, 0.95), sub: clamp(P.sub, 0, 1), subOct: P.subOct === '-2' ? -2 : -1, octave: clamp(P.octave, -2, 1),
          glide: clamp(P.glide, 0, 0.5), noise: clamp(P.noise, 0, 1), noiseColour: P.noiseColour || 'white' },
        wobble: { rate: nearestDiv(+P.lfoRate || 5, bpm), lfoShape: ({ sine: 'sine', triangle: 'triangle', square: 'square', saw: 'saw up', random: 'sample & hold' })[P.lfoShape] || 'triangle', depth: clamp((+P.lfoCutoff || 0) / 1200, 0, 5) },
        mouth: Object.assign({ cutoff: clamp(P.cutoff, 40, 3000), reso: clamp((+P.res || 0) * 0.95, 0, 0.95), envAmt: clamp(Math.abs(+P.envAmt || 0) * 4, 0, 4), envDecay: clamp(P.fD || 0.35, 0.01, 2), envSustain: clamp(P.fS, 0, 1) },
          P.filter === 'ladder' ? { mouth: 'filter-ladder', mLadMode: 'lowpass 24', mLadDrive: clamp(P.drive, 0, 18), mLadBass: 0.5 } : { mouth: 'filter-svf', mSvfMode: 'lowpass', mSvfStages: 2 }),
        drive: { drive: 'none' },
        fx: P.chorus && P.chorus !== 'off' ? { fx: 'ensemble-core', fEnsMode: 'juno ' + P.chorus, fEnsMix: clamp(P.chorusMix === undefined ? 0.5 : P.chorusMix, 0, 1) } : { fx: 'none' },
      }),
      best: ['voice', 'mouth', 'fx'],
    },
  };
  const builderProfile = { behind: [], best: SLOTS, slots: (P) => { const W = root.AssembledTool, o = {}; if (!W) return o;
    const of = { voice: ['wave', 'pw', 'sub', 'subOct', 'octave', 'glide', 'noise', 'noiseColour'], wobble: ['rate', 'lfoShape', 'depth'], mouth: ['mouth', 'cutoff', 'reso', 'envAmt', 'envDecay', 'envSustain'], drive: ['drive'], fx: ['fx'] };
    SLOTS.forEach(sl => { o[sl] = {}; of[sl].forEach(k => { if (P[k] !== undefined) o[sl][k] = P[k]; }); W.SET.filter(c => c.of === sl).forEach(c => { if (P[c.key] !== undefined) o[sl][c.key] = P[c.key]; }); }); return o; } };
  const profileOf = (id) => PROFILES[id] || (/^eravos\.wb-/.test(id) ? builderProfile : null);   // a tool made by synthesizing: its settings are the assembled engine's
  const F = () => root.OrganismFactory;
  function defaultsOf(id) { const d = F() && F().def(id), o = {}; ((d && d.config) || []).forEach(c => { o[c.key] = c.default; }); return o; }
  function paramsOf(instanceId) { const h = F() && F().handle(instanceId); if (!h) return null; const s = h.ctx.serialize(); return Object.assign(defaultsOf(h.id), s && s.params); }   // its saved settings
  function slots(id, params, bpm) { const p = profileOf(id); return p ? p.slots(Object.assign(defaultsOf(id), params || {}), bpm || 120) : null; }
  function pickFor(aId, bId) { const A = (profileOf(aId) || {}).best || [], B = (profileOf(bId) || {}).best || [], o = {}; SLOTS.forEach(sl => { o[sl] = B.includes(sl) && !A.includes(sl) ? 'b' : 'a'; }); return o; }   // each slot from the tool it is most itself in; a tie stays with A
  function combine(a, b, pick, bpm) {
    const W = root.AssembledTool, out = W ? W.defaults() : {}, sa = slots(a.id, a.params, bpm), sb = slots(b.id, b.params, bpm); if (!sa || !sb) return null;
    pick = pick || pickFor(a.id, b.id); SLOTS.forEach(sl => Object.assign(out, (pick[sl] === 'b' ? sb : sa)[sl] || {}));
    return out;
  }
  // 3.211 parts picked by hand (his words, 2026-11-22: "holding control to select multiple parts at a time and right click with a synthesize
  // into one tool"): each engine slot from the tool whose part was picked for it, the rest from the base tool (the one most parts came from)
  //   combineFrom({ voice: { id, params }, wobble: …, … }, base, bpm) → settings
  const PART_SLOT = { filter: 'mouth', drive: 'drive', noise: 'voice', insert: 'fx', chorus: 'fx', fx: 'fx', wobble: 'wobble' };
  function combineFrom(from, base, bpm) {
    const W = root.AssembledTool, out = W ? W.defaults() : {}, cache = new Map(), sl = (src) => { const k = src.id + '#' + JSON.stringify(src.params); if (!cache.has(k)) cache.set(k, slots(src.id, src.params, bpm)); return cache.get(k); };
    for (const s of SLOTS) { const src = from[s] || base, got = src && sl(src); if (!got) return null; Object.assign(out, got[s] || {}); }
    return out;
  }
  root.ToolBlend = { SLOTS, PART_SLOT, has: (id) => !!profileOf(id), slots, combine, combineFrom, pickFor, paramsOf, defaultsOf, behind: (id) => (profileOf(id) || {}).behind || [], nearestDiv };
  if (typeof module === 'object' && module.exports) module.exports = root.ToolBlend;
})(typeof window !== 'undefined' ? window : globalThis);
