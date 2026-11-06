/* eravos.component.filter-ladder 1.0.0 — the 4-pole transistor-ladder filter (lead-glide · poly-filter-matrix · retro-dco stand on it,
 * and Retro Poly's rebuild). NEW sound code (2026-11-06), proved on its own (filter-ladder.test.mjs).
 *
 * Four zero-delay-feedback (trapezoidal, topology-preserving) one-pole stages in a loop, as in Vadim Zavalishin, "The Art of VA
 * Filter Design" (2012, ch. 5): the feedback is solved in the same sample (no unit delay, so the cutoff and resonance are where they
 * say at every frequency). The DRIVE is inside the loop: the stages' input is tanh(drive·x − k·y4), so the feedback itself
 * saturates — the loudness of a ladder pushed hard, and why it self-oscillates without blowing up (semi-implicit: the loop is
 * solved linearly, the result saturated; the stages are BIBO-stable one-poles fed a bounded signal, so the output is bounded).
 *   modes      0 LP 24 dB (y4) · 1 LP 12 dB (y2) · 2 BP 12 dB · 3 HP 12 dB · 4 HP 24 dB (the pole-mixing taps)
 *   cutoff     16 Hz – 20 kHz (and under 0.49 × the sample rate), + detune in cents (key-track, envelopes and LFOs sum here)
 *   resonance  0…1 → loop gain k = 4.2 × resonance (k = 4 is the edge; past it, it sings on its own)
 *   drive      dB 0…36: tanh pushed harder; the small-signal level is kept (÷ drive), so drive changes colour, not volume
 *   bass       0…1 compensation: the input is raised by (1 + k·bass), so the passband does not thin as the resonance rises
 * Real-time safe: process() allocates nothing (2 channels × 4 stages preallocated); denormals are flushed.
 *   MusicParts.Ladder()                    the kernel factory (plain JS — node tests use it directly)
 *   MusicParts.LADDER_WORKLET              the AudioWorklet source: the SAME kernel text, so what is tested is what plays
 *   MusicParts.ladder(ac, opts?) → Promise<AudioWorkletNode 'eravos-ladder'>
 *        params (all AudioParams, all modulation destinations): frequency · detune · resonance · drive · bass · mode
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function Ladder() {
    const MAX_CH = 2, LO = 16, HI = 20000, TINY = 1e-20;
    const s = new Float64Array(MAX_CH * 4);
    let sr = 48000, lastF = -1, G = 0, B = 1, G2 = 0, G3 = 0, G4 = 0;
    function hz(f, cents) { const x = f * Math.pow(2, cents / 1200); return Math.min(Math.min(HI, sr * 0.49), Math.max(LO, x)); }
    function coeffs(fc) { if (fc === lastF) return; lastF = fc; const g = Math.tan(Math.PI * fc / sr); G = g / (1 + g); B = 1 / (1 + g); G2 = G * G; G3 = G2 * G; G4 = G3 * G; }
    // a tanh that is cheap and exact enough (Padé 7/6, clamped where it reaches ±1)
    function sat(x) { if (x > 4.97) return 1; if (x < -4.97) return -1; const x2 = x * x; return x * (135135 + x2 * (17325 + x2 * (378 + x2))) / (135135 + x2 * (62370 + x2 * (3150 + x2 * 28))); }
    function flush(v) { return v < TINY && v > -TINY ? 0 : v; }
    return {
      setRate(rate) { sr = rate; lastF = -1; },
      reset() { s.fill(0); },
      // ins/outs: arrays of Float32Array per channel; P: { frequency, detune, resonance, drive, bass, mode } each length 1 or n
      process(ins, outs, n, P) {
        const chs = Math.min(MAX_CH, outs.length), fA = P.frequency, dA = P.detune, rA = P.resonance, vA = P.drive, bA = P.bass;
        const mode = Math.max(0, Math.min(4, Math.round(P.mode[0]))), fv = fA.length > 1 || dA.length > 1;
        if (!fv) coeffs(hz(fA[0], dA[0]));
        for (let j = 0; j < n; j++) {
          if (fv) coeffs(hz(fA.length > 1 ? fA[j] : fA[0], dA.length > 1 ? dA[j] : dA[0]));
          const r = rA.length > 1 ? rA[j] : rA[0], k = 4.2 * (r < 0 ? 0 : r > 1 ? 1 : r);
          const dDb = vA.length > 1 ? vA[j] : vA[0], D = Math.pow(10, (dDb < 0 ? 0 : dDb > 36 ? 36 : dDb) / 20);
          const bb = bA.length > 1 ? bA[j] : bA[0], comp = 1 + k * (bb < 0 ? 0 : bb > 1 ? 1 : bb);
          for (let c = 0; c < chs; c++) {
            const inp = ins[c] || ins[0], o = c * 4, xin = (inp ? inp[j] : 0) * D * comp;
            // solve the loop in this sample: y4 = G⁴u + S, u = xin − k·y4
            const S = B * (G3 * s[o] + G2 * s[o + 1] + G * s[o + 2] + s[o + 3]);
            const u = sat(xin - k * (G4 * xin + S) / (1 + k * G4));
            const y1 = G * u + B * s[o], y2 = G * y1 + B * s[o + 1], y3 = G * y2 + B * s[o + 2], y4 = G * y3 + B * s[o + 3];
            s[o] = flush(2 * y1 - s[o]); s[o + 1] = flush(2 * y2 - s[o + 1]); s[o + 2] = flush(2 * y3 - s[o + 2]); s[o + 3] = flush(2 * y4 - s[o + 3]);
            const y = mode === 0 ? y4 : mode === 1 ? y2 : mode === 2 ? 2 * (y1 - y2) : mode === 3 ? u - 2 * y1 + y2 : u - 4 * y1 + 6 * y2 - 4 * y3 + y4;
            outs[c][j] = y / D;
          }
        }
      },
    };
  }
  const PARAMS = [
    { name: 'frequency', defaultValue: 1000, minValue: 16, maxValue: 20000, automationRate: 'a-rate' },
    { name: 'detune', defaultValue: 0, minValue: -9600, maxValue: 9600, automationRate: 'a-rate' },
    { name: 'resonance', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'drive', defaultValue: 0, minValue: 0, maxValue: 36, automationRate: 'a-rate' },
    { name: 'bass', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 4, automationRate: 'k-rate' },
  ];
  const LADDER_WORKLET = `const Ladder = ${Ladder.toString()};
class EravosLadder extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor() { super(); this.k = Ladder(); this.k.setRate(sampleRate); }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process(inputs[0] || [], out, out[0].length, p); return true; }
}
registerProcessor('eravos-ladder', EravosLadder);`;
  function ladder(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-ladder', LADDER_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([LADDER_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-ladder', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [o.channels || 2], parameterData: o.params || {} }));
  }
  const MODES = ['lowpass 24', 'lowpass 12', 'bandpass 12', 'highpass 12', 'highpass 24'];
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Ladder, LADDER_WORKLET, LADDER_PARAMS: PARAMS, LADDER_MODES: MODES, ladder });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Ladder, LADDER_WORKLET, LADDER_PARAMS: PARAMS, LADDER_MODES: MODES, ladder };
})(typeof window !== 'undefined' ? window : globalThis);
