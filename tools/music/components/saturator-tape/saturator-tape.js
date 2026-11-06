/* eravos.component.saturator-tape 1.0.0 — tape saturation (Tape Memory, dub echo, echo architecture, harmonic weapon stand on it).
 * NEW code (2026-11-06, for Tape Memory — his "yes"), proved on its own (saturator-tape.test.mjs); moving fx-echo's saturation onto it is a
 * later step that must null-render.
 *   pre-emphasis   a +6 dB high shelf (~3 kHz) before the tape and its EXACT inverse after (the same biquad, numerator and denominator
 *                  swapped), so the highs saturate first, as on tape, and a clean signal comes back unchanged
 *   drive 0–24 dB  into tanh with a bias (bias 0–1: even harmonics) and a little memory (the curve leans on its last output: rising and
 *                  falling edges differ — hysteresis). The saturation fades in over the first 6 dB, so drive 0 is the signal exactly.
 *                  Level: a full-scale peak stays near full scale; quieter parts come up (tape's compression)
 *   bump 0–6 dB    the head bump: a peaking filter at bumpFreq 30–200 Hz (Q 0.8)
 *   hf             gap loss: a 2-pole low-pass, 2 000–22 000 Hz (22 000 and up = off)
 *   out −24…+6 dB · mix 0 dry … 1 tape
 * Real-time safe: process() allocates nothing (filters redesigned only when their settings move).
 *   MusicParts.TapeSat() the kernel · MusicParts.TAPESAT_WORKLET (the SAME kernel text) ·
 *   MusicParts.saturatorTape(ac, opts?) → Promise<AudioWorkletNode 'eravos-saturator-tape'> (params: TAPESAT_PARAMS)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function TapeSat() {
    const MAX_CH = 2, TINY = 1e-20;
    let sr = 48000, keyB = '', keyH = '', bumpOn = false, hfOn = false, lagK = 0;
    const pre = new Float64Array(5), de = new Float64Array(5), bmp = new Float64Array(5), hfc = new Float64Array(5);
    const zPre = new Float64Array(MAX_CH * 2), zDe = new Float64Array(MAX_CH * 2), zB = new Float64Array(MAX_CH * 2), zH = new Float64Array(MAX_CH * 2), last = new Float64Array(MAX_CH);
    // RBJ biquads, normalised to a0 = 1: [b0 b1 b2 a1 a2]
    function shelf(o, f, gDb) { const A = Math.pow(10, gDb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), al = Math.sin(w) / 2 * Math.SQRT2, sA = 2 * Math.sqrt(A) * al;
      const b0 = A * ((A + 1) + (A - 1) * cw + sA), b1 = -2 * A * ((A - 1) + (A + 1) * cw), b2 = A * ((A + 1) + (A - 1) * cw - sA), a0 = (A + 1) - (A - 1) * cw + sA, a1 = 2 * ((A - 1) - (A + 1) * cw), a2 = (A + 1) - (A - 1) * cw - sA;
      o[0] = b0 / a0; o[1] = b1 / a0; o[2] = b2 / a0; o[3] = a1 / a0; o[4] = a2 / a0; }
    function peak(o, f, gDb, Q) { const A = Math.pow(10, gDb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), al = Math.sin(w) / (2 * Q), a0 = 1 + al / A;
      o[0] = (1 + al * A) / a0; o[1] = -2 * cw / a0; o[2] = (1 - al * A) / a0; o[3] = -2 * cw / a0; o[4] = (1 - al / A) / a0; }
    function lowpass(o, f) { const w = 2 * Math.PI * Math.min(f, sr * 0.49) / sr, cw = Math.cos(w), al = Math.sin(w) / Math.SQRT2, a0 = 1 + al;
      o[0] = (1 - cw) / 2 / a0; o[1] = (1 - cw) / a0; o[2] = (1 - cw) / 2 / a0; o[3] = -2 * cw / a0; o[4] = (1 - al) / a0; }
    function bq(c, z, k, x) { const y = c[0] * x + z[k]; z[k] = c[1] * x - c[3] * y + z[k + 1]; z[k + 1] = c[2] * x - c[4] * y; if (y < TINY && y > -TINY) { z[k] = z[k + 1] = 0; return 0; } return y; }
    function inverse() { const b0 = pre[0]; de[0] = 1 / b0; de[1] = pre[3] / b0; de[2] = pre[4] / b0; de[3] = pre[1] / b0; de[4] = pre[2] / b0; }   // 1/H: the exact undo (the shelf's zeros lie inside the unit circle)
    const v = (A, j) => A.length > 1 ? A[j] : A[0];
    const api = {
      setRate(rate) { sr = rate; lagK = 1 - Math.exp(-1 / (0.002 * sr)); shelf(pre, 3000, 6); inverse(); keyB = keyH = ''; },
      reset() { zPre.fill(0); zDe.fill(0); zB.fill(0); zH.fill(0); last.fill(0); },
      process(ins, outs, n, P) {
        if (!pre[0]) api.setRate(sr);
        const chs = Math.min(MAX_CH, outs.length), bump = Math.max(0, Math.min(6, P.bump[0])), bf = Math.max(30, Math.min(200, P.bumpFreq[0])), hf = P.hf[0];
        const kb = bump.toFixed(3) + '|' + bf.toFixed(2); if (kb !== keyB) { keyB = kb; bumpOn = bump > 0.001; if (bumpOn) peak(bmp, bf, bump, 0.8); }
        const kh = hf.toFixed(1); if (kh !== keyH) { keyH = kh; hfOn = hf < 22000; if (hfOn) lowpass(hfc, Math.max(2000, hf)); }
        for (let j = 0; j < n; j++) {
          const dDb = Math.max(0, Math.min(24, v(P.drive, j))), w = Math.min(1, dDb / 6), G = Math.pow(10, dDb / 20), beta = Math.max(0, Math.min(1, v(P.bias, j))) * 0.6;
          const t0 = Math.tanh(beta), norm = Math.tanh(G + beta) - t0, mem = 0.25 * w, mix = Math.max(0, Math.min(1, v(P.mix, j))), og = Math.pow(10, Math.max(-24, Math.min(6, v(P.out, j))) / 20);
          for (let ch = 0; ch < chs; ch++) {
            const inp = ins[ch] || ins[0], x = inp ? inp[j] : 0, k = ch * 2;
            let y = x;
            if (w > 0) {
              const e = bq(pre, zPre, k, x), s = (Math.tanh(G * e + beta + mem * last[ch]) - t0) / norm; last[ch] += lagK * (s - last[ch]);   // the magnetisation lags (~2 ms): rising and falling edges meet it from different sides
              y = bq(de, zDe, k, e + (s - e) * w);
            }
            if (bumpOn) y = bq(bmp, zB, k, y);
            if (hfOn) y = bq(hfc, zH, k, y);
            y *= og;
            outs[ch][j] = mix === 1 ? y : x * (1 - mix) + y * mix;
          }
        }
      },
    };
    return api;
  }
  const PARAMS = [
    { name: 'drive', defaultValue: 6, minValue: 0, maxValue: 24, automationRate: 'a-rate' },
    { name: 'bias', defaultValue: 0.2, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'bump', defaultValue: 2, minValue: 0, maxValue: 6, automationRate: 'k-rate' },
    { name: 'bumpFreq', defaultValue: 90, minValue: 30, maxValue: 200, automationRate: 'k-rate' },
    { name: 'hf', defaultValue: 14000, minValue: 2000, maxValue: 24000, automationRate: 'k-rate' },
    { name: 'out', defaultValue: 0, minValue: -24, maxValue: 6, automationRate: 'a-rate' },
    { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
  ];
  const TAPESAT_WORKLET = `const TapeSat = ${TapeSat.toString()};
class EravosSaturatorTape extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor() { super(); this.k = TapeSat(); this.k.setRate(sampleRate); }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process(inputs[0] || [], out, out[0].length, p); return true; }
}
registerProcessor('eravos-saturator-tape', EravosSaturatorTape);`;
  function saturatorTape(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-saturator-tape', TAPESAT_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([TAPESAT_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-saturator-tape', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [o.channels || 2], parameterData: o.params || {} }));
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { TapeSat, TAPESAT_WORKLET, TAPESAT_PARAMS: PARAMS, saturatorTape });
  if (typeof module !== 'undefined' && module.exports) module.exports = { TapeSat, TAPESAT_WORKLET, TAPESAT_PARAMS: PARAMS, saturatorTape };
})(typeof window !== 'undefined' ? window : globalThis);
