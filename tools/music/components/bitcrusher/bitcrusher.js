/* eravos.component.bitcrusher 1.0.0 — fewer bits, a lower sample rate (Tape Memory, a chop station, harmonic weapon stand on it).
 * NEW code (2026-11-06, for Tape Memory — his "yes"), proved on its own (bitcrusher.test.mjs); moving fx-destroyer onto it is a later step
 * that must null-render.
 *   bits    1–24: a mid-tread quantiser (step 2 / 2^bits over −1…1); 24 = untouched
 *   rate    200 Hz – the context's rate: sample-and-hold on a fractional phase (≥ the context's rate = untouched)
 *   aa      1 = a 4-pole low-pass at 0.45 × rate before the hold (the clean way down) · 0 = the aliasing, on purpose
 *   jitter  0–1: each hold's length wanders by up to ± half a period (seeded) — a cheap converter's clock
 *   dither  1 = TPDF noise of ±1 step before the quantiser (quiet detail survives as noise instead of vanishing)
 *   mix     0 dry … 1 crushed
 * Real-time safe: process() allocates nothing (the filters' coefficients are recomputed only when rate moves).
 *   MusicParts.Crusher() the kernel · MusicParts.CRUSHER_WORKLET (the SAME kernel text) ·
 *   MusicParts.bitcrusher(ac, opts?) → Promise<AudioWorkletNode 'eravos-bitcrusher'> (params: CRUSHER_PARAMS)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function Crusher() {
    const MAX_CH = 2;
    let sr = 48000, seed = 0x9E3779B9 >>> 0, lastRate = -1, ph = 1, thr = 1;
    const held = new Float64Array(MAX_CH), z = new Float64Array(MAX_CH * 4);   // two biquads per channel (DF-II transposed: 2 states each)
    const c = new Float64Array(10);   // b0 b1 b2 a1 a2 (×2 sections, Butterworth Q 0.5412 / 1.3066)
    function R() { seed = (seed + 0x6D2B79F5) >>> 0; let t = seed; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }
    function design(fc) {
      const w = 2 * Math.PI * Math.min(fc, sr * 0.49) / sr, cw = Math.cos(w), sw = Math.sin(w);
      [0.5411961, 1.3065630].forEach((Q, s) => { const al = sw / (2 * Q), a0 = 1 + al, o = s * 5;
        c[o] = (1 - cw) / 2 / a0; c[o + 1] = (1 - cw) / a0; c[o + 2] = (1 - cw) / 2 / a0; c[o + 3] = -2 * cw / a0; c[o + 4] = (1 - al) / a0; });
    }
    function lp(ch, x) {
      for (let s = 0; s < 2; s++) { const o = s * 5, k = ch * 4 + s * 2, y = c[o] * x + z[k]; z[k] = c[o + 1] * x - c[o + 3] * y + z[k + 1]; z[k + 1] = c[o + 2] * x - c[o + 4] * y; x = y; }
      if (x < 1e-20 && x > -1e-20) x = 0; return x;
    }
    const v = (A, j) => A.length > 1 ? A[j] : A[0];
    const api = {
      setRate(rate) { sr = rate; lastRate = -1; },
      reset(s) { if (s !== undefined) seed = s >>> 0; held.fill(0); z.fill(0); ph = 1; thr = 1; lastRate = -1; },
      process(ins, outs, n, P) {
        const chs = Math.min(MAX_CH, outs.length), aa = P.aa[0] >= 0.5, dith = P.dither[0] >= 0.5, jit = Math.max(0, Math.min(1, P.jitter[0]));
        for (let j = 0; j < n; j++) {
          const bits = Math.max(1, Math.min(24, v(P.bits, j))), rate = Math.max(200, v(P.rate, j)), mix = Math.max(0, Math.min(1, v(P.mix, j)));
          const hold = rate < sr, q = bits < 24 ? 2 / Math.pow(2, bits) : 0;
          if (hold && aa && Math.abs(rate - lastRate) > 0.5) { design(0.45 * rate); lastRate = rate; }
          let take = !hold;
          if (hold) { ph += rate / sr; if (ph >= thr) { ph -= thr; thr = 1 + (jit ? jit * (R() - 0.5) : 0); take = true; } }
          const d = q && dith ? (R() - R()) * q : 0;
          for (let ch = 0; ch < chs; ch++) {
            const inp = ins[ch] || ins[0], x = inp ? inp[j] : 0, f = hold && aa ? lp(ch, x) : x;
            if (take) { let y = f; if (q) { y = Math.round((y + d) / q) * q; if (y > 1) y = 1; else if (y < -1) y = -1; } held[ch] = y; }
            outs[ch][j] = mix === 1 ? held[ch] : x * (1 - mix) + held[ch] * mix;
          }
        }
      },
    };
    return api;
  }
  const PARAMS = [
    { name: 'bits', defaultValue: 24, minValue: 1, maxValue: 24, automationRate: 'a-rate' },
    { name: 'rate', defaultValue: 48000, minValue: 200, maxValue: 192000, automationRate: 'a-rate' },
    { name: 'aa', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'jitter', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'dither', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
  ];
  const CRUSHER_WORKLET = `const Crusher = ${Crusher.toString()};
class EravosBitcrusher extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor(o) { super(); this.k = Crusher(); this.k.setRate(sampleRate); this.k.reset((o && o.processorOptions && o.processorOptions.seed) || 1); }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process(inputs[0] || [], out, out[0].length, p); return true; }
}
registerProcessor('eravos-bitcrusher', EravosBitcrusher);`;
  function bitcrusher(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-bitcrusher', CRUSHER_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([CRUSHER_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-bitcrusher', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [o.channels || 2], parameterData: o.params || {}, processorOptions: { seed: o.seed || 1 } }));
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Crusher, CRUSHER_WORKLET, CRUSHER_PARAMS: PARAMS, bitcrusher });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Crusher, CRUSHER_WORKLET, CRUSHER_PARAMS: PARAMS, bitcrusher };
})(typeof window !== 'undefined' ? window : globalThis);
