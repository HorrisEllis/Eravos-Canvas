/* eravos.component.bbd-line 1.0.0 — the bucket-brigade delay (the chorus / flanger character of Juno, Dimension and string machines;
 * retro-dco and ensemble-organism stand on it). NEW sound code (2026-11-06), proved on its own (bbd-line.test.mjs).
 *
 * A BBD chip moves the signal through N capacitor stages at a clock: delay = N / (2·clock). So a longer delay means a slower clock,
 * and a slower clock means less bandwidth. What this models, in the order the chip does it:
 *   compress (2:1, NE570-style)  → anti-alias low-pass (4-pole, at clock/3 — the margin BBD designs keep under clock/2) → sample at the clock (hold between)
 *   → the line (+ hiss inside it) → reconstruction low-pass (4-pole, the same corner) → + clock bleed → expand (1:2)
 * The compander is why a BBD's hiss breathes with the playing and sinks away in silence.
 *   time    0.0005 – 0.5 s (a-rate: modulate it for chorus / flanger) · stages 256 – 4096 (the chip: 512 MN3009, 1024 MN3007,
 *           2048, 4096 MN3005); clock = stages / (2·time), the bandwidth follows it
 *   hiss    dB of noise inside the line (−120 = none … −40) · bleed  dB of the clock tone at the output (−120 = none)
 *   compand 0 off · 1 on      · seed   reset(seed): the same seed, the same hiss
 * Real-time safe: the buffer is made once (setRate); process() allocates nothing; denormals flushed.
 *   MusicParts.BBD() · MusicParts.BBD_WORKLET (the SAME kernel text) · MusicParts.bbd(ac, opts?) → Promise<AudioWorkletNode 'eravos-bbd'>
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function BBD() {
    const MAX_CH = 2, TINY = 1e-20;
    let sr = 48000, size = 0, w = 0, seedState = 1;
    const bufs = [], ph = new Float64Array(MAX_CH), held = new Float64Array(MAX_CH), clkPh = new Float64Array(MAX_CH);
    // 2 × 2-pole TPT SVF low-passes (Butterworth, k = √2) before and after: 4 integrator states each, per channel
    const aa = new Float64Array(MAX_CH * 4), rc = new Float64Array(MAX_CH * 4), envC = new Float64Array(MAX_CH), envE = new Float64Array(MAX_CH);
    let g = 0, a1 = 0, a2 = 0, a3 = 0, lastFc = -1;
    const K = Math.SQRT2;
    function coeff(fc) { if (fc === lastFc) return; lastFc = fc; g = Math.tan(Math.PI * fc / sr); a1 = 1 / (1 + g * (g + K)); a2 = g * a1; a3 = g * a2; }
    function lp(st, o, x) {   // one 2-pole stage on states st[o], st[o+1]
      const v3 = x - st[o + 1], v1 = a1 * st[o] + a2 * v3, v2 = st[o + 1] + a2 * st[o] + a3 * v3;
      let c1 = 2 * v1 - st[o], c2 = 2 * v2 - st[o + 1]; if (c1 < TINY && c1 > -TINY) c1 = 0; if (c2 < TINY && c2 > -TINY) c2 = 0;
      st[o] = c1; st[o + 1] = c2; return v2;
    }
    function rnd() { let x = seedState; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; seedState = x >>> 0; return seedState / 4294967296 * 2 - 1; }
    function read(b, pos) {
      let i = Math.floor(pos); const f = pos - i; i = ((i % size) + size) % size;
      const xm = b[i === 0 ? size - 1 : i - 1], x0 = b[i], x1 = b[i + 1 >= size ? i + 1 - size : i + 1], x2 = b[i + 2 >= size ? i + 2 - size : i + 2];
      const c1 = 0.5 * (x1 - xm), c2 = xm - 2.5 * x0 + 2 * x1 - 0.5 * x2, c3 = 0.5 * (x2 - xm) + 1.5 * (x0 - x1);
      return ((c3 * f + c2) * f + c1) * f + x0;
    }
    const v = (A, j) => A.length > 1 ? A[j] : A[0];
    const ENV_FLOOR = 1e-4;   // the compander's floor (−80 dB): below it, silence stays silence
    const api = {
      setRate(rate, maxSeconds) { sr = rate; size = Math.ceil((maxSeconds || 0.5) * rate) + 8; bufs.length = 0; for (let c = 0; c < MAX_CH; c++) bufs.push(new Float32Array(size)); w = 0; lastFc = -1; api.reset(1); },
      reset(seed) { seedState = ((seed === undefined ? 1 : seed) * 2654435761 + 1) >>> 0 || 1; bufs.forEach(b => b.fill(0)); aa.fill(0); rc.fill(0); ph.fill(0); held.fill(0); clkPh.fill(0); envC.fill(ENV_FLOOR); envE.fill(ENV_FLOOR); },
      // the clock and the corner for a time and a stage count (exposed for tests and UIs)
      clock(time, stages) { return Math.max(256, Math.min(4096, stages)) / (2 * time); },
      corner(time, stages) { return Math.min(0.45 * sr, 18000, api.clock(time, stages) / 3); },
      process(ins, outs, n, P) {
        if (!size) api.setRate(sr, 0.5);
        const chs = Math.min(MAX_CH, outs.length), stages = Math.max(256, Math.min(4096, Math.round(P.stages[0]))), comp = P.compand[0] >= 0.5;
        const aEnv = 1 - Math.exp(-1 / (0.008 * sr));
        for (let j = 0; j < n; j++) {
          const time = Math.max(0.0005, Math.min((size - 8) / sr, v(P.time, j))), clk = stages / (2 * time);
          coeff(Math.min(0.45 * sr, 18000, clk / 3));
          const hiss = v(P.hiss, j), hissA = hiss <= -120 ? 0 : Math.pow(10, hiss / 20), bl = v(P.bleed, j), bleedA = bl <= -120 ? 0 : Math.pow(10, bl / 20);
          const step = clk / sr, D = time * sr;
          for (let c = 0; c < chs; c++) {
            const b = bufs[c], inp = ins[c] || ins[0]; let x = inp ? inp[j] : 0;
            if (comp) { const ax = x < 0 ? -x : x; envC[c] += aEnv * (ax - envC[c]); if (envC[c] < ENV_FLOOR) envC[c] = ENV_FLOOR; x = x / Math.sqrt(envC[c] / 0.5); }  // 2:1 around 0.5
            x = lp(aa, c * 4 + 2, lp(aa, c * 4, x));
            // sample-and-hold at the clock (when the clock is under the sample rate; above it, every sample is taken)
            if (step >= 1) held[c] = x; else { ph[c] += step; if (ph[c] >= 1) { ph[c] -= Math.floor(ph[c]); held[c] = x; } }
            b[w] = held[c] + (hissA ? hissA * rnd() : 0);
            let y = read(b, w - D);
            y = lp(rc, c * 4 + 2, lp(rc, c * 4, y));
            if (bleedA) { clkPh[c] += step; if (clkPh[c] >= 1) clkPh[c] -= Math.floor(clkPh[c]); y += bleedA * Math.sin(2 * Math.PI * clkPh[c]); }
            if (comp) { const ay = y < 0 ? -y : y; envE[c] += aEnv * (ay - envE[c]); if (envE[c] < ENV_FLOOR) envE[c] = ENV_FLOOR; y = y * envE[c] / 0.5; }   // 1:2 — undoes x/√(env/r): a level A came through as √(A·r/m), its envelope √(A·r·m), × env/r = A
            if (y < TINY && y > -TINY) y = 0; outs[c][j] = y;
          }
          w++; if (w >= size) w = 0;
        }
      },
    };
    return api;
  }
  const PARAMS = [
    { name: 'time', defaultValue: 0.005, minValue: 0.0005, maxValue: 0.5, automationRate: 'a-rate' },
    { name: 'stages', defaultValue: 1024, minValue: 256, maxValue: 4096, automationRate: 'k-rate' },
    { name: 'hiss', defaultValue: -84, minValue: -120, maxValue: -40, automationRate: 'k-rate' },
    { name: 'bleed', defaultValue: -120, minValue: -120, maxValue: -40, automationRate: 'k-rate' },
    { name: 'compand', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
  ];
  const BBD_WORKLET = `const BBD = ${BBD.toString()};
class EravosBBD extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor(o) { super(); this.k = BBD(); this.k.setRate(sampleRate, (o && o.processorOptions && o.processorOptions.maxSeconds) || 0.5); }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process(inputs[0] || [], out, out[0].length, p); return true; }
}
registerProcessor('eravos-bbd', EravosBBD);`;
  function bbd(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-bbd', BBD_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([BBD_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-bbd', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [o.channels || 2], parameterData: o.params || {}, processorOptions: { maxSeconds: o.maxSeconds || 0.5 } }));
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { BBD, BBD_WORKLET, BBD_PARAMS: PARAMS, bbd });
  if (typeof module !== 'undefined' && module.exports) module.exports = { BBD, BBD_WORKLET, BBD_PARAMS: PARAMS, bbd };
})(typeof window !== 'undefined' ? window : globalThis);
