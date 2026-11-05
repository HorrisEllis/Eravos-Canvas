/* eravos.component.filter-svf 1.0.0 — the state-variable filter (phase 1 · the most-used component: 35 planned tools stand on it,
 * docs/eco-graph.md). NEW sound code, not an extraction: Web Audio has no SVF (every filter in ERAVOS today is a BiquadFilterNode),
 * so this one proves its own numbers (filter-svf.test.mjs) instead of "no change".
 *
 * The kernel is the zero-delay-feedback (trapezoidal) state-variable filter as published by Andrew Simper (Cytomic,
 * "Solving the continuous SVF equations using trapezoidal integration", 2013): every response from one set of states, stable for
 * every cutoff and resonance, and free of the zipper/blow-up a biquad has when its cutoff moves fast — the point for wobbles,
 * sweeps and audio-rate modulation.
 *   modes   0 lowpass · 1 highpass · 2 bandpass (0 dB at the peak) · 3 notch · 4 peak · 5 bell · 6 low shelf · 7 high shelf · 8 all-pass
 *   slope   stages 1 · 2 · 3 = 12 · 24 · 36 dB/oct (lowpass, highpass, bandpass); the resonance lives on the last stage
 *   cutoff  16 Hz – 20 kHz (and under 0.49 × the sample rate), + detune in cents (key-track, envelope, velocity and LFOs all arrive
 *           here, summed, as Wobble Bass's filter bus does) · resonance 0…1 (0 = Butterworth, flat; 1 = Q 500, rings near forever)
 *   gain    dB, for bell and shelves
 * Real-time safe: process() allocates nothing (all state is preallocated, 2 channels × 3 stages); denormals are flushed.
 *
 *   MusicParts.SVF                       the kernel factory (plain JS — node tests and offline maths use it directly)
 *   MusicParts.SVF_WORKLET               the AudioWorklet source: the SAME kernel text, so what is tested is what plays
 *   MusicParts.svf(ac, opts?) → Promise<AudioWorkletNode 'eravos-svf'>
 *        params (all AudioParams, all modulation destinations): frequency (Hz) · detune (cents) · resonance (0…1) · gain (dB) ·
 *        mode (0…8) · stages (1…3)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  // ---- the kernel: written once, used here and stringified into the worklet (keep it self-contained: no outside names)
  function SVF() {
    const MAX_CH = 2, MAX_ST = 3, LO = 16, HI = 20000, KB = Math.SQRT2, KMIN = 0.002, TINY = 1e-20;
    const ic1 = new Float64Array(MAX_CH * MAX_ST), ic2 = new Float64Array(MAX_CH * MAX_ST);
    // coefficients per stage, recomputed only when an input to them changes
    const a1 = new Float64Array(MAX_ST), a2 = new Float64Array(MAX_ST), a3 = new Float64Array(MAX_ST), kk = new Float64Array(MAX_ST);
    let m0 = 0, m1 = 0, m2 = 0, lastF = -1, lastR = -1, lastG = -1e9, lastM = -1, lastS = -1, sr = 48000;
    function hz(f, cents, rate) { const x = f * Math.pow(2, cents / 1200); return Math.min(Math.min(HI, rate * 0.49), Math.max(LO, x)); }
    function coeffs(fc, res, gainDb, mode, stages) {
      if (fc === lastF && res === lastR && gainDb === lastG && mode === lastM && stages === lastS) return;
      lastF = fc; lastR = res; lastG = gainDb; lastM = mode; lastS = stages;
      const r = res < 0 ? 0 : res > 1 ? 1 : res, kRes = Math.max(KMIN, KB * (1 - r));
      const A = Math.pow(10, gainDb / 40), t = Math.tan(Math.PI * fc / sr);
      for (let s = 0; s < MAX_ST; s++) {
        let k = s === stages - 1 ? kRes : KB, g = t;
        if (mode === 5) k = kRes / A;                                   // bell: Q scaled by the gain (constant-Q peak)
        if (mode === 6) g = t / Math.sqrt(A); else if (mode === 7) g = t * Math.sqrt(A);
        kk[s] = k; a1[s] = 1 / (1 + g * (g + k)); a2[s] = g * a1[s]; a3[s] = g * a2[s];
      }
      const k = kk[0];
      // y = m0·v0 + m1·band + m2·low   (Simper's mixing, per mode)
      switch (mode) {
        case 0: m0 = 0; m1 = 0; m2 = 1; break;                          // lowpass
        case 1: m0 = 1; m1 = -k; m2 = -1; break;                        // highpass
        case 2: m0 = 0; m1 = k; m2 = 0; break;                          // bandpass, 0 dB at the peak
        case 3: m0 = 1; m1 = -k; m2 = 0; break;                         // notch
        case 4: m0 = 1; m1 = -k; m2 = -2; break;                        // peak (low − high)
        case 5: m0 = 1; m1 = k * (A * A - 1); m2 = 0; break;            // bell
        case 6: m0 = 1; m1 = k * (A - 1); m2 = A * A - 1; break;        // low shelf
        case 7: m0 = A * A; m1 = k * (1 - A) * A; m2 = 1 - A * A; break;// high shelf
        default: m0 = 1; m1 = -2 * k; m2 = 0;                           // all-pass
      }
    }
    // one sample through one stage of channel ch; returns [band, low] via the two out slots
    let vb = 0, vl = 0;
    function tick(i, s, v0) {
      const v3 = v0 - ic2[i], v1 = a1[s] * ic1[i] + a2[s] * v3, v2 = ic2[i] + a2[s] * ic1[i] + a3[s] * v3;
      let c1 = 2 * v1 - ic1[i], c2 = 2 * v2 - ic2[i];
      if (c1 < TINY && c1 > -TINY) c1 = 0; if (c2 < TINY && c2 > -TINY) c2 = 0;   // flush denormals
      ic1[i] = c1; ic2[i] = c2; vb = v1; vl = v2;
    }
    function mix(v0) { return m0 * v0 + m1 * vb + m2 * vl; }
    // a cascaded stage's own output (its own k: the resonance lives on the last stage only)
    function stageOut(mode, v0, s) { const k = kk[s]; return mode === 0 ? vl : mode === 1 ? v0 - k * vb - vl : k * vb; }
    function cascades(mode) { return mode === 0 || mode === 1 || mode === 2; }
    return {
      setRate(rate) { sr = rate; lastF = -1; },
      reset() { ic1.fill(0); ic2.fill(0); },
      // inputs/outputs: arrays of Float32Array per channel; P: { frequency, detune, resonance, gain, mode, stages } each an array
      // of length 1 (constant this block) or n (per sample). Allocation-free.
      process(ins, outs, n, P) {
        const chs = Math.min(MAX_CH, outs.length);
        const fA = P.frequency, dA = P.detune, rA = P.resonance, gA = P.gain, mA = P.mode, sA = P.stages;
        const varying = fA.length > 1 || dA.length > 1 || rA.length > 1 || gA.length > 1;
        const mode = Math.max(0, Math.min(8, Math.round(mA[0]))), stages = cascades(mode) ? Math.max(1, Math.min(MAX_ST, Math.round(sA[0]))) : 1;
        if (!varying) coeffs(hz(fA[0], dA[0], sr), rA[0], gA[0], mode, stages);
        for (let j = 0; j < n; j++) {
          if (varying) coeffs(hz(fA.length > 1 ? fA[j] : fA[0], dA.length > 1 ? dA[j] : dA[0], sr), rA.length > 1 ? rA[j] : rA[0], gA.length > 1 ? gA[j] : gA[0], mode, stages);
          for (let c = 0; c < chs; c++) {
            const inp = ins[c] || ins[0], out = outs[c]; let x = inp ? inp[j] : 0;
            if (stages === 1) { tick(c * MAX_ST, 0, x); out[j] = mix(x); }
            else { for (let s = 0; s < stages; s++) { tick(c * MAX_ST + s, s, x); x = stageOut(mode, x, s); } out[j] = x; }
          }
        }
      },
    };
  }
  const PARAMS = [
    { name: 'frequency', defaultValue: 1000, minValue: 16, maxValue: 20000, automationRate: 'a-rate' },
    { name: 'detune', defaultValue: 0, minValue: -9600, maxValue: 9600, automationRate: 'a-rate' },
    { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'gain', defaultValue: 0, minValue: -36, maxValue: 36, automationRate: 'a-rate' },
    { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 8, automationRate: 'k-rate' },
    { name: 'stages', defaultValue: 1, minValue: 1, maxValue: 3, automationRate: 'k-rate' },
  ];
  const SVF_WORKLET = `const SVF = ${SVF.toString()};
class EravosSVF extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor() { super(); this.k = SVF(); this.k.setRate(sampleRate); }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process(inputs[0] || [], out, out[0].length, p); return true; }
}
registerProcessor('eravos-svf', EravosSVF);`;
  function svf(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-svf', SVF_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([SVF_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-svf', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [o.channels || 2], parameterData: o.params || {} }));
  }
  const MODES = ['lowpass', 'highpass', 'bandpass', 'notch', 'peak', 'bell', 'lowshelf', 'highshelf', 'allpass'];
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { SVF, SVF_WORKLET, SVF_PARAMS: PARAMS, SVF_MODES: MODES, svf });
  if (typeof module !== 'undefined' && module.exports) module.exports = { SVF, SVF_WORKLET, SVF_PARAMS: PARAMS, SVF_MODES: MODES, svf };
})(typeof window !== 'undefined' ? window : globalThis);
