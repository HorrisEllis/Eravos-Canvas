/* eravos.component.saturator-tube 1.0.0 — tube warmth (Piano, harmonic weapon, reese architecture stand on it).
 * NEW code (2026-11-06, for Piano — his "yes"), proved on its own (saturator-tube.test.mjs).
 *   drive 0–24 dB  into a triode-like curve: soft on the way up (tanh), harder on the way down (it clips sooner, by 1 + 3·bias) —
 *                  the asymmetry is the even harmonics; bias 0 is symmetric (odd harmonics only). Level: a full-scale peak stays at
 *                  full scale, quieter parts come up. The saturation fades in over the first 6 dB, so drive 0 is the signal exactly.
 *   DC blocker     on what the tube adds (a 5 Hz high-pass on the difference), so the asymmetry's offset never leaves and the dry
 *                  signal is untouched by it
 *   tone −1…1      a gentle tilt about 1 kHz (±6 dB across the band; 0 = flat, exactly)
 *   out −24…+6 dB · mix 0 dry … 1 tube
 * Real-time safe: process() allocates nothing (the tilt is redesigned only when tone moves).
 *   MusicParts.TubeSat() the kernel · MusicParts.TUBESAT_WORKLET (the SAME kernel text) ·
 *   MusicParts.saturatorTube(ac, opts?) → Promise<AudioWorkletNode 'eravos-saturator-tube'> (params: TUBESAT_PARAMS)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function TubeSat() {
    const MAX_CH = 2, TINY = 1e-20;
    let sr = 48000, keyT = '', toneOn = false, toneG = 1, dcR = 0.9993;
    const tc = new Float64Array(5), zT = new Float64Array(MAX_CH * 2), dcX = new Float64Array(MAX_CH), dcY = new Float64Array(MAX_CH);
    function shelf(o, f, gDb) { const A = Math.pow(10, gDb / 40), w = 2 * Math.PI * f / sr, cw = Math.cos(w), al = Math.sin(w) / 2 * Math.SQRT2, sA = 2 * Math.sqrt(A) * al;
      const b0 = A * ((A + 1) + (A - 1) * cw + sA), b1 = -2 * A * ((A - 1) + (A + 1) * cw), b2 = A * ((A + 1) + (A - 1) * cw - sA), a0 = (A + 1) - (A - 1) * cw + sA, a1 = 2 * ((A - 1) - (A + 1) * cw), a2 = (A + 1) - (A - 1) * cw - sA;
      o[0] = b0 / a0; o[1] = b1 / a0; o[2] = b2 / a0; o[3] = a1 / a0; o[4] = a2 / a0; }
    function bq(c, z, k, x) { const y = c[0] * x + z[k]; z[k] = c[1] * x - c[3] * y + z[k + 1]; z[k + 1] = c[2] * x - c[4] * y; if (y < TINY && y > -TINY) { z[k] = z[k + 1] = 0; return 0; } return y; }
    // the triode-like curve: tanh up, a harder (sooner) tanh down; slope 1 at 0 on both sides, so it is smooth through zero
    const curve = (u, k) => u >= 0 ? Math.tanh(u) : Math.tanh(k * u) / k;
    const v = (A, j) => A.length > 1 ? A[j] : A[0];
    const api = {
      setRate(rate) { sr = rate; dcR = Math.exp(-2 * Math.PI * 5 / sr); keyT = ''; },
      reset() { zT.fill(0); dcX.fill(0); dcY.fill(0); },
      process(ins, outs, n, P) {
        const chs = Math.min(MAX_CH, outs.length), tone = Math.max(-1, Math.min(1, P.tone[0]));
        const kt = tone.toFixed(4); if (kt !== keyT) { keyT = kt; toneOn = Math.abs(tone) > 1e-4; if (toneOn) { shelf(tc, 1000, 12 * tone); toneG = Math.pow(10, -6 * tone / 20); } }
        for (let j = 0; j < n; j++) {
          const dDb = Math.max(0, Math.min(24, v(P.drive, j))), w = Math.min(1, dDb / 6), G = Math.pow(10, dDb / 20), kk = 1 + 3 * Math.max(0, Math.min(1, v(P.bias, j)));
          const norm = Math.tanh(G), mix = Math.max(0, Math.min(1, v(P.mix, j))), og = Math.pow(10, Math.max(-24, Math.min(6, v(P.out, j))) / 20);
          for (let ch = 0; ch < chs; ch++) {
            const inp = ins[ch] || ins[0], x = inp ? inp[j] : 0;
            let y = x;
            if (w > 0) {
              const d = curve(G * x, kk) / norm - x;   // what the tube adds
              let h = d - dcX[ch] + dcR * dcY[ch]; dcX[ch] = d; if (h < TINY && h > -TINY) h = 0; dcY[ch] = h;   // its offset taken out
              y = x + w * h;
            }
            if (toneOn) y = bq(tc, zT, ch * 2, y) * toneG;
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
    { name: 'bias', defaultValue: 0.3, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'tone', defaultValue: 0, minValue: -1, maxValue: 1, automationRate: 'k-rate' },
    { name: 'out', defaultValue: 0, minValue: -24, maxValue: 6, automationRate: 'a-rate' },
    { name: 'mix', defaultValue: 1, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
  ];
  const TUBESAT_WORKLET = `const TubeSat = ${TubeSat.toString()};
class EravosSaturatorTube extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor() { super(); this.k = TubeSat(); this.k.setRate(sampleRate); }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process(inputs[0] || [], out, out[0].length, p); return true; }
}
registerProcessor('eravos-saturator-tube', EravosSaturatorTube);`;
  function saturatorTube(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-saturator-tube', TUBESAT_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([TUBESAT_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-saturator-tube', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [o.channels || 2], parameterData: o.params || {} }));
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { TubeSat, TUBESAT_WORKLET, TUBESAT_PARAMS: PARAMS, saturatorTube });
  if (typeof module !== 'undefined' && module.exports) module.exports = { TubeSat, TUBESAT_WORKLET, TUBESAT_PARAMS: PARAMS, saturatorTube };
})(typeof window !== 'undefined' ? window : globalThis);
