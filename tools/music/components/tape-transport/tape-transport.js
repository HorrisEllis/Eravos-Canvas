/* eravos.component.tape-transport 1.0.0 — how the tape moves (Tape Memory, a rewind tool, time mutation stand on it).
 * NEW code (2026-11-06, for Tape Memory — his "yes"), proved on its own (tape-transport.test.mjs).
 *   ch0  the speed the tape actually runs at: varispeed (glides over 20 ms) × the motor (1 running … 0 stopped); rewind = backwards at 2×
 *   ch1  the lag: how far the read head has fallen behind real time, ∫ (1 − speed) dt, 0 … maxLag seconds. A tool feeds it to a
 *        delay-line's time, so what plays bends exactly like a tape that slows, stops, rewinds or runs fast.
 *   stop 1 = brake to a stop over stopTime · 0 = spin back up over startTime. One motor position (0 running … 1 stopped) moves at those
 *        rates, so letting go half-way through a stop spins up from where it was (continuous). curve −1…1: the shape of both
 *        (0 straight · > 0 slows early, like a heavy reel losing power · < 0 slows late, like a brake grabbing at the end)
 * Real-time safe: process() allocates nothing.
 *   MusicParts.Transport() the kernel · MusicParts.TRANSPORT_WORKLET (the SAME kernel text) ·
 *   MusicParts.tapeTransport(ac, opts?) → Promise<AudioWorkletNode 'eravos-tape-transport'> (params: TRANSPORT_PARAMS)
 * A component imports no tool (eravos.components). */
(function (root) {
  'use strict';
  function Transport() {
    let sr = 48000, sp = 1, pos = 0, lag = 0, k = 0;
    const v = (A, j) => A.length > 1 ? A[j] : A[0];
    function motor(p, c) { return c >= 0 ? Math.pow(1 - p, 1 + 3 * c) : 1 - Math.pow(p, 1 - 3 * c); }
    const api = {
      setRate(rate) { sr = rate; k = 1 - Math.exp(-1 / (0.02 * sr)); },
      reset() { sp = 1; pos = 0; lag = 0; },
      get lag() { return lag; }, get position() { return pos; },
      motor,
      process(ins, outs, n, P) {
        if (!k) api.setRate(sr);
        const o0 = outs[0], o1 = outs[1], stopping = P.stop[0] >= 0.5, rew = P.rewind[0] >= 0.5, c = Math.max(-1, Math.min(1, P.curve[0]));
        const maxLag = Math.max(0.1, Math.min(20, P.maxLag[0]));
        for (let j = 0; j < n; j++) {
          const want = Math.max(-2, Math.min(2, v(P.speed, j))), target = rew ? -2 * Math.abs(want) : want;
          sp += (target - sp) * k;
          if (stopping) { pos += 1 / (Math.max(0.02, v(P.stopTime, j)) * sr); if (pos > 1) pos = 1; }
          else if (pos > 0) { pos -= 1 / (Math.max(0.02, v(P.startTime, j)) * sr); if (pos < 0) pos = 0; }
          const s = sp * motor(pos, c);
          lag += (1 - s) / sr; if (lag < 0) lag = 0; else if (lag > maxLag) lag = maxLag;
          if (o0) o0[j] = s; if (o1) o1[j] = lag;
        }
      },
    };
    return api;
  }
  const PARAMS = [
    { name: 'speed', defaultValue: 1, minValue: -2, maxValue: 2, automationRate: 'a-rate' },
    { name: 'stop', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
    { name: 'stopTime', defaultValue: 0.8, minValue: 0.02, maxValue: 8, automationRate: 'a-rate' },
    { name: 'startTime', defaultValue: 0.4, minValue: 0.02, maxValue: 8, automationRate: 'a-rate' },
    { name: 'curve', defaultValue: 0.3, minValue: -1, maxValue: 1, automationRate: 'k-rate' },
    { name: 'maxLag', defaultValue: 8, minValue: 0.1, maxValue: 20, automationRate: 'k-rate' },
    { name: 'rewind', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'k-rate' },
  ];
  const TRANSPORT_WORKLET = `const Transport = ${Transport.toString()};
class EravosTapeTransport extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(PARAMS)}; }
  constructor() { super(); this.k = Transport(); this.k.setRate(sampleRate); }
  process(inputs, outputs, p) { const out = outputs[0]; if (!out || !out.length) return true; this.k.process([], out, out[0].length, p); return true; }
}
registerProcessor('eravos-tape-transport', EravosTapeTransport);`;
  function tapeTransport(ac, o) {
    o = o || {};
    const SDK = root.OrganismSDK, load = SDK && SDK.loadWorklet ? SDK.loadWorklet(ac, 'eravos-tape-transport', TRANSPORT_WORKLET)
      : ac.audioWorklet.addModule(URL.createObjectURL(new Blob([TRANSPORT_WORKLET], { type: 'text/javascript' })));
    return Promise.resolve(load).then(() => new AudioWorkletNode(ac, 'eravos-tape-transport', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], parameterData: o.params || {} }));
  }
  root.MusicParts = root.MusicParts || {};
  Object.assign(root.MusicParts, { Transport, TRANSPORT_WORKLET, TRANSPORT_PARAMS: PARAMS, tapeTransport });
  if (typeof module !== 'undefined' && module.exports) module.exports = { Transport, TRANSPORT_WORKLET, TRANSPORT_PARAMS: PARAMS, tapeTransport };
})(typeof window !== 'undefined' ? window : globalThis);
