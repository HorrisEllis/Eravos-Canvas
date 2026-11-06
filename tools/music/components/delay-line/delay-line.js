/* eravos.component.delay-line 1.0.0 — the delay line (15 planned tools stand on it: echoes, choruses, dub, shimmer, tape memory …,
 * docs/eco-graph.md). NEW sound code (2026-11-06), proved on its own (delay-line.test.mjs); moving fx-echo and fx-moddelay onto it is a
 * later step that must null-render.
 *   time       0.001 – 20 s, or SYNC: beats (> 0) at bpm → beats · 60 / bpm seconds; + an LFO (mod depth ms, mod rate Hz) for chorus/flutter
 *   read       fractional, 4-point Hermite interpolation (a modulated delay without the zipper of a rounded one)
 *   mode       0 TAPE: a change of time glides (80 ms), so the pitch bends like a tape machine's · 1 DIGITAL: a change of time cross-fades
 *              (30 ms) from the old tap to the new one — no pitch
 *   feedback   0 … 1.2, through the loop's own filters: low cut (high-pass, Hz; 1 = off) · damp (low-pass, Hz; 20 000 and up = off) · drive (dB, tanh: past 1 it
 *              saturates instead of running away)
 *   freeze     1 = what is in the line loops for ever, exactly (input shut, filters and drive out of the loop, an integer tap)
 *   mix        0 dry … 1 wet
 * Real-time safe: the buffer is made once by setRate(rate, maxSeconds) (default 20 s); process() allocates nothing; denormals flushed.
 *   MusicParts.Delay()                     the kernel factory (plain JS — node tests use it directly)
 *   MusicParts.DELAY_WORKLET               the AudioWorklet source: the SAME kernel text, so what is tested is what plays
 *   MusicParts.delay(ac, opts?) → Promise<AudioWorkletNode 'eravos-delay'>  (params: DELAY_PARAMS, all modulation destinations)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function Delay() {
    const MAX_CH = 2, TINY = 1e-20, bufs = [];
    let sr = 48000, size = 0, w = 0, d = -1, dOld = 0, dNew = 0, xf = 1, xfStep = 0, smK = 0, lfoPh = 0;
    const lp = new Float64Array(MAX_CH), hp = new Float64Array(MAX_CH);
    function hermite(b, pos) {
      let i = Math.floor(pos); const f = pos - i; i = ((i % size) + size) % size;
      const xm = b[i === 0 ? size - 1 : i - 1], x0 = b[i], x1 = b[i + 1 >= size ? i + 1 - size : i + 1], x2 = b[i + 2 >= size ? i + 2 - size : i + 2];
      const c1 = 0.5 * (x1 - xm), c2 = xm - 2.5 * x0 + 2 * x1 - 0.5 * x2, c3 = 0.5 * (x2 - xm) + 1.5 * (x0 - x1);
      return ((c3 * f + c2) * f + c1) * f + x0;
    }
    function sat(x) { if (x > 4.97) return 1; if (x < -4.97) return -1; const x2 = x * x; return x * (135135 + x2 * (17325 + x2 * (378 + x2))) / (135135 + x2 * (62370 + x2 * (3150 + x2 * 28))); }
    const v = (A, j) => A.length > 1 ? A[j] : A[0];
    const api = {
      setRate(rate, maxSeconds) { sr = rate; size = Math.ceil((maxSeconds || 20) * rate) + 8; bufs.length = 0; for (let c = 0; c < MAX_CH; c++) bufs.push(new Float32Array(size));
        w = 0; d = -1; xf = 1; smK = 1 - Math.exp(-1 / (0.08 * sr)); xfStep = 1 / (0.03 * sr); lp.fill(0); hp.fill(0); },
      reset() { bufs.forEach(b => b.fill(0)); lp.fill(0); hp.fill(0); d = -1; xf = 1; lfoPh = 0; },
      get maxSeconds() { return (size - 8) / sr; },
      // ins/outs: arrays of Float32Array per channel; P: each param an array of length 1 or n (DELAY_PARAMS)
      process(ins, outs, n, P) {
        if (!size) api.setRate(sr, 20);
        const chs = Math.min(MAX_CH, outs.length), mode = Math.round(P.mode[0]) === 1 ? 1 : 0, frz = P.freeze[0] >= 0.5;
        for (let j = 0; j < n; j++) {
          const beats = v(P.sync, j), bpm = Math.max(20, v(P.bpm, j)), sec = beats > 0 ? beats * 60 / bpm : v(P.time, j);
          const T = Math.min(size - 6, Math.max(1, sec * sr));
          if (d < 0) { d = T; dOld = dNew = T; }
          if (mode === 0) { d += (T - d) * smK; xf = 1; dNew = d; }
          else if (Math.abs(T - dNew) > 0.5) { dOld = xf < 0.5 ? dOld : dNew; dNew = T; xf = 0; }
          if (xf < 1) { xf += xfStep; if (xf > 1) xf = 1; }
          const depth = v(P.modDepth, j) * sr / 1000, lfo = depth > 0 ? Math.sin(2 * Math.PI * lfoPh) * depth : 0;
          lfoPh += v(P.modRate, j) / sr; if (lfoPh >= 1) lfoPh -= 1;
          const fb = Math.max(0, Math.min(1.2, v(P.feedback, j))), mix = Math.max(0, Math.min(1, v(P.mix, j)));
          const dmp = v(P.damp, j), dampOn = dmp < 20000, aL = dampOn ? 1 - Math.exp(-2 * Math.PI * Math.min(sr * 0.45, Math.max(20, dmp)) / sr) : 1;
          const lc = v(P.lowcut, j), cutOn = lc > 1, aH = cutOn ? 1 - Math.exp(-2 * Math.PI * Math.min(2000, lc) / sr) : 0;
          const dDb = Math.max(0, Math.min(24, v(P.drive, j))), D = dDb > 0 ? Math.pow(10, dDb / 20) : 0;
          for (let c = 0; c < chs; c++) {
            const b = bufs[c], inp = ins[c] || ins[0], x = inp ? inp[j] : 0;
            let y;
            if (frz) y = b[((w - Math.round(dNew)) % size + size) % size];
            else {
              const m = mode === 0 ? d : dNew;
              y = hermite(b, w - Math.max(1, m + lfo));
              if (xf < 1) y = y * xf + hermite(b, w - Math.max(1, dOld + lfo)) * (1 - xf);
            }
            let wr;
            if (frz) wr = y;
            else {
              let l = y; if (dampOn) { l = lp[c] += aL * (y - lp[c]); if (l < TINY && l > -TINY) l = lp[c] = 0; }
              let f = l; if (cutOn) { let h = hp[c] += aH * (l - hp[c]); if (h < TINY && h > -TINY) h = hp[c] = 0; f = l - h; } if (D) f = sat(f * D) / D;
              wr = x + fb * f; if (wr < TINY && wr > -TINY) wr = 0;
            }
            b[w] = wr; outs[c][j] = x * (1 - mix) + y * mix;
          }
          w++; if (w >= size) w = 0;
        }
      },
    };
    return api;
  }
  const PARAMS = [
    { name: 'time', defaultValue: 0.375, minValue: 0.001, maxValue: 20, automationRate: 'a-rate' },
    { name: 'sync', defaultValue: 0, minValue: 0, maxValue: 64, automationRate: 'k-rate' },
    { name: 'bpm', defaultValue: 120, minValue: 20, maxValue: 400, automationRate: 'k-rate' },
    { name: 'feedback', defaultValue: 0.4, minValue: 0, maxValue: 1.2, automationRate: 'a-rate' },
    { name: 'damp', defaultValue: 8000, minValue: 20, maxValue: 22000, automationRate: 'a-rate' },
    { name: 'lowcut', defaultValue: 1, minValue: 1, maxValue: 2000, automationRate: 'a-rate' },
    { name: 'drive', defaultValue: 0, minValue: 0, maxValue: 24, automationRate: 'a-rate' },
    { name: 'freeze', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'mix', defaultValue: 0.35, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'mode', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'modDepth', defaultValue: 0, minValue: 0, maxValue: 20, automationRate: 'a-rate' },
    { name: 'modRate', defaultValue: 0.5, minValue: 0.01, maxValue: 10, automationRate: 'a-rate' },
  ];
  const DELAY_WORKLET = `const Delay = ${Delay.toString()};
class EravosDelay extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor(o) { super(); this.k = Delay(); this.k.setRate(sampleRate, (o && o.processorOptions && o.processorOptions.maxSeconds) || 20); }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process(inputs[0] || [], out, out[0].length, p); return true; }
}
registerProcessor('eravos-delay', EravosDelay);`;
  function delay(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-delay', DELAY_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([DELAY_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-delay', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [o.channels || 2], parameterData: o.params || {}, processorOptions: { maxSeconds: o.maxSeconds || 20 } }));
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Delay, DELAY_WORKLET, DELAY_PARAMS: PARAMS, delay });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Delay, DELAY_WORKLET, DELAY_PARAMS: PARAMS, delay };
})(typeof window !== 'undefined' ? window : globalThis);
