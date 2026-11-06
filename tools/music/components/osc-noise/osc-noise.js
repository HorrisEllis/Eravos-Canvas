/* eravos.component.osc-noise 1.0.0 — noise, every colour (retro-dco, riser-forge, drum-foundry, tape-memory, analog-drift …, 7 planned
 * tools, docs/eco-graph.md). NEW code (2026-11-06), proved on its own (osc-noise.test.mjs).
 *   colour   0 white (flat) · 1 pink (−3 dB/oct, Paul Kellet's filter) · 2 brown (−6 dB/oct, a leaky integrator) · 3 velvet (±1
 *            impulses, `density` a second, one at a random place in each period — smooth to the ear, sparse to the CPU) · 4 crackle
 *            (random clicks of random size, `density` a second on average, like dust on a record) · 5 band-limited (random points
 *            `rate` a second, joined smoothly (Catmull-Rom): flat to about 0.3 × `rate`, 30 dB down by 4 × `rate` — for drift, flutter and wind)
 *   tilt     −1 … +1 = −6 … +6 dB below / above a 1 kHz pivot (a ±12 dB tilt from lows to highs), on any colour
 *   width    0 the same noise in both channels · 1 two independent noises (power kept between)
 *   level    linear gain
 *   seed     reset(seed): the same seed is the same noise, sample for sample (xorshift32 — no Math.random)
 * Real-time safe: process() allocates nothing; denormals flushed. Self-contained (stringified into the worklet).
 *   MusicParts.Noise() · MusicParts.NOISE_WORKLET · MusicParts.noise(ac, opts?) → Promise<AudioWorkletNode 'eravos-noise'> (0 inputs)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function Noise() {
    const TINY = 1e-20;
    let sr = 48000, aB = 0, aT = 0;
    const st = new Uint32Array(2), pk = new Float64Array(14), br = new Float64Array(2), tl = new Float64Array(2),
      vCount = new Float64Array(2), vAt = new Float64Array(2), vSign = new Float64Array(2), cr = new Float64Array(2),
      bl = new Float64Array(8);   // band-limited: per channel  phase, a, b, c, d (4-point) → slots c*4
    const blPh = new Float64Array(2);
    function rnd(c) { let x = st[c]; x ^= x << 13; x ^= x >>> 17; x ^= x << 5; st[c] = x >>> 0; return st[c] / 4294967296; }   // 0 … 1
    function white(c) { return rnd(c) * 2 - 1; }
    function reset(seed) {
      seed = (seed === undefined ? 1 : seed) >>> 0; st[0] = (seed * 2654435761 + 1) >>> 0 || 1; st[1] = (seed * 2246822519 + 7) >>> 0 || 7;
      pk.fill(0); br.fill(0); tl.fill(0); cr.fill(0); vCount.fill(0); vAt.fill(-1); bl.fill(0); blPh.fill(0);
      for (let c = 0; c < 2; c++) for (let i = 0; i < 4; i++) bl[c * 4 + i] = white(c);
    }
    function sample(c, colour, density, rate) {
      if (colour === 0) return white(c);
      if (colour === 1) { const w = white(c), o = c * 7;   // Kellet's "pink" (refined): within ±0.05 dB of −3 dB/oct over 9 octaves
        pk[o] = 0.99886 * pk[o] + w * 0.0555179; pk[o + 1] = 0.99332 * pk[o + 1] + w * 0.0750759; pk[o + 2] = 0.96900 * pk[o + 2] + w * 0.1538520;
        pk[o + 3] = 0.86650 * pk[o + 3] + w * 0.3104856; pk[o + 4] = 0.55000 * pk[o + 4] + w * 0.5329522; pk[o + 5] = -0.7616 * pk[o + 5] - w * 0.0168980;
        const y = pk[o] + pk[o + 1] + pk[o + 2] + pk[o + 3] + pk[o + 4] + pk[o + 5] + pk[o + 6] + w * 0.5362; pk[o + 6] = w * 0.115926; return y * 0.11; }
      if (colour === 2) { let y = br[c] = aB * br[c] + white(c); if (y < TINY && y > -TINY) y = br[c] = 0; return y * (1 - aB) * 9; }
      if (colour === 3) {   // velvet: one impulse per period, at a random sample of it
        const T = sr / Math.max(1, density);
        if (vCount[c] <= 0) { vCount[c] += T; vAt[c] = Math.floor(rnd(c) * T); vSign[c] = rnd(c) < 0.5 ? -1 : 1; }
        vCount[c] -= 1; const hit = vAt[c] === 0; vAt[c] -= 1; return hit ? vSign[c] : 0;
      }
      if (colour === 4) {   // crackle: Poisson clicks of random size (u⁴ — mostly small, now and then a loud one), a 0.3 ms tail
        let y = cr[c] *= 0.93; if (y < TINY && y > -TINY) y = cr[c] = 0;
        if (rnd(c) < density / sr) { const u = rnd(c), a = u * u * u * u; y = cr[c] = (rnd(c) < 0.5 ? -a : a); }
        return y;
      }
      // band-limited: new random points `rate` a second, a Catmull-Rom curve through them
      const o = c * 4; blPh[c] += Math.max(0.01, Math.min(sr / 2, rate)) / sr;
      while (blPh[c] >= 1) { blPh[c] -= 1; bl[o] = bl[o + 1]; bl[o + 1] = bl[o + 2]; bl[o + 2] = bl[o + 3]; bl[o + 3] = white(c); }
      const t = blPh[c], p0 = bl[o], p1 = bl[o + 1], p2 = bl[o + 2], p3 = bl[o + 3];
      return 0.5 * (2 * p1 + (-p0 + p2) * t + (2 * p0 - 5 * p1 + 4 * p2 - p3) * t * t + (-p0 + 3 * p1 - 3 * p2 + p3) * t * t * t);
    }
    reset(1);
    const v = (A, j) => A.length > 1 ? A[j] : A[0];
    return {
      setRate(rate) { sr = rate; aB = Math.exp(-2 * Math.PI * 10 / sr); aT = 1 - Math.exp(-2 * Math.PI * 1000 / sr); },
      reset,
      // outs: arrays of Float32Array per channel; P: { colour, density, rate, tilt, width, level } each length 1 or n
      process(outs, n, P) {
        if (!aT) this.setRate(sr);
        const colour = Math.max(0, Math.min(5, Math.round(P.colour[0]))), chs = Math.min(2, outs.length);
        for (let j = 0; j < n; j++) {
          const den = v(P.density, j), rate = v(P.rate, j), tilt = Math.max(-1, Math.min(1, v(P.tilt, j))), lev = v(P.level, j);
          const wd = Math.max(0, Math.min(1, v(P.width, j))), th = wd * Math.PI / 2, gLo = Math.pow(10, -6 * tilt / 20), gHi = Math.pow(10, 6 * tilt / 20);
          const a = sample(0, colour, den, rate), b = chs > 1 ? sample(1, colour, den, rate) : 0;
          for (let c = 0; c < chs; c++) {
            let x = c === 0 ? a : Math.cos(th) * a + Math.sin(th) * b;
            if (tilt !== 0) { let l = tl[c] += aT * (x - tl[c]); if (l < TINY && l > -TINY) l = tl[c] = 0; x = l * gLo + (x - l) * gHi; }
            outs[c][j] = x * lev;
          }
        }
      },
    };
  }
  const PARAMS = [
    { name: 'colour', defaultValue: 0, minValue: 0, maxValue: 5, automationRate: 'k-rate' },
    { name: 'density', defaultValue: 2000, minValue: 1, maxValue: 20000, automationRate: 'a-rate' },
    { name: 'rate', defaultValue: 200, minValue: 0.01, maxValue: 20000, automationRate: 'a-rate' },
    { name: 'tilt', defaultValue: 0, minValue: -1, maxValue: 1, automationRate: 'a-rate' },
    { name: 'width', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'level', defaultValue: 0.5, minValue: 0, maxValue: 4, automationRate: 'a-rate' },
  ];
  const NOISE_WORKLET = `const Noise = ${Noise.toString()};
class EravosNoise extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor(o) { super(); this.k = Noise(); this.k.setRate(sampleRate); this.k.reset((o && o.processorOptions && o.processorOptions.seed) || 1);
    this.port.onmessage = (e) => { if (e.data && e.data.seed !== undefined) this.k.reset(e.data.seed); }; }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process(out, out[0].length, p); return true; }
}
registerProcessor('eravos-noise', EravosNoise);`;
  function noise(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-noise', NOISE_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([NOISE_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-noise', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [o.channels || 2], parameterData: o.params || {}, processorOptions: { seed: o.seed || 1 } }));
  }
  const COLOURS = ['white', 'pink', 'brown', 'velvet', 'crackle', 'band-limited'];
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Noise, NOISE_WORKLET, NOISE_PARAMS: PARAMS, NOISE_COLOURS: COLOURS, noise });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Noise, NOISE_WORKLET, NOISE_PARAMS: PARAMS, NOISE_COLOURS: COLOURS, noise };
})(typeof window !== 'undefined' ? window : globalThis);
