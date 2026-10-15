/* eravos.fx-dynamics 1.0.0 — Dynamics (P11 gate F) · spec eravos.organism.fx-dynamics · inherits STD.fx
 * One AudioWorklet does the whole job, sample by sample, stereo-linked:
 *   detector (the input — or the KEY input when "Key" is on and something is wired into it)
 *   → GATE / expander (threshold, range, attack · hold · release)
 *   → COMPRESSOR (threshold, ratio, soft knee, attack, release, makeup; feed-forward, log domain)
 * Output 2 is the gain reduction as a modulation signal (0 = none … 1 = 48 dB) — wire it to anything.
 * Mix is New-York parallel compression (dry + squashed). No worklet → the browser's compressor (no gate, no key) + a notice. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK;
  const DYN = `
const db = (x) => 20 * Math.log10(Math.max(1e-9, x)), lin = (d) => Math.pow(10, d / 20);
class EravosDyn extends AudioWorkletProcessor {
  static get parameterDescriptors() {
    const p = (name, def, min, max) => ({ name, defaultValue: def, minValue: min, maxValue: max, automationRate: 'k-rate' });
    return [p('gateOn', 0, 0, 1), p('gateThresh', -50, -90, 0), p('gateRange', 40, 0, 90), p('gateAttack', 1, 0.05, 100), p('gateHold', 20, 0, 500), p('gateRelease', 120, 5, 2000),
      p('compOn', 1, 0, 1), p('thresh', -18, -60, 0), p('ratio', 4, 1, 20), p('knee', 0, 0, 30), p('attack', 5, 0.1, 100), p('release', 120, 10, 1000), p('makeup', 0, 0, 24), p('keyed', 0, 0, 1)];
  }
  constructor() { super(); this.envC = 0; this.gGate = 1; this.hold = 0; this.port.onmessage = (e) => { if (e.data === 'reset') { this.envC = 0; this.gGate = 1; } }; }
  process(inputs, outputs, P) {
    const inp = inputs[0], key = inputs[1], out = outputs[0], grOut = outputs[1] && outputs[1][0];
    const n = out[0].length, sr = sampleRate;
    const k = (ms) => Math.exp(-1 / Math.max(1, ms * 0.001 * sr));
    const gOn = P.gateOn[0] > 0.5, cOn = P.compOn[0] > 0.5, keyed = P.keyed[0] > 0.5 && key && key.length > 0;
    const gT = lin(P.gateThresh[0]), gR = lin(-P.gateRange[0]), gA = k(P.gateAttack[0]), gRel = k(P.gateRelease[0]), holdN = P.gateHold[0] * 0.001 * sr;
    const T = P.thresh[0], R = P.ratio[0], W = P.knee[0], aA = k(P.attack[0]), aR = k(P.release[0]), mk = P.makeup[0];
    const L = inp[0] || null, Rr = inp[1] || inp[0] || null;
    for (let i = 0; i < n; i++) {
      const xl = L ? L[i] : 0, xr = Rr ? Rr[i] : 0;
      let d = Math.max(Math.abs(xl), Math.abs(xr));
      if (keyed) { const kl = key[0] ? key[0][i] : 0, kr = key[1] ? key[1][i] : kl; d = Math.max(Math.abs(kl), Math.abs(kr)); }
      // gate: open above threshold, stays open for 'hold', then closes to -range (expander-style ramp)
      let g = 1;
      if (gOn) {
        if (d >= gT) this.hold = holdN; else if (this.hold > 0) this.hold--;
        const target = (d >= gT || this.hold > 0) ? 1 : gR;
        const c = target > this.gGate ? gA : gRel; this.gGate = target + (this.gGate - target) * c; g = this.gGate;
      }
      // compressor: peak detector with attack/release, soft-knee gain computer in dB
      let gr = 0;
      if (cOn) {
        const c = d > this.envC ? aA : aR; this.envC = d + (this.envC - d) * c;
        const over = db(this.envC) - T, slope = 1 / R - 1;
        if (W > 0 && 2 * Math.abs(over) <= W) gr = slope * (over + W / 2) * (over + W / 2) / (2 * W);
        else if (over > 0) gr = slope * over;
        g *= lin(gr + mk);
      }
      out[0][i] = xl * g; if (out[1]) out[1][i] = xr * g;
      if (grOut) grOut[i] = Math.max(0, Math.min(1, -(gr + (gOn ? db(g / Math.max(1e-9, cOn ? lin(gr + mk) : 1)) : 0)) / 48));
    }
    return true;
  }
}
registerProcessor('eravos-dyn', EravosDyn);`;
  const KNOBS = ['gateThresh', 'gateRange', 'gateAttack', 'gateHold', 'gateRelease', 'thresh', 'ratio', 'knee', 'attack', 'release', 'makeup'];
  OrganismFactory.define({
    id: 'eravos.fx-dynamics', domain: 'music', version: '1.0.0', label: 'Dynamics', icon: '⊓', accent: '#ff8800', phase: 'P11',
    category: 'Effects', blurb: 'Punch and control: compressor, gate, parallel smash — and a KEY input so one sound can duck another.',
    size: { w: 620, h: 560 }, minSize: { w: 460, h: 420 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx', 'capability.mod_out'],
    hooks: SDK.fxHooks([Object.assign(S.audio_in('dyn.hook.key_in', 'key', true), { intent: 'KEY: the sound that drives the compressor (sidechain) when Key is on', label: 'key' }), Object.assign(S.mod_out('dyn.hook.gr_out', 'gr'), { label: 'gain reduction' })]),
    config: [
      { key: 'gateOn', type: 'boolean', default: false, label: 'Gate', group: 'GATE' },
      { key: 'gateThresh', type: 'number', default: -50, min: -80, max: 0, step: 0.5, unit: 'dB', label: 'Thresh', group: 'GATE' },
      { key: 'gateRange', type: 'number', default: 40, min: 0, max: 80, step: 0.5, unit: 'dB', label: 'Range', group: 'GATE' },
      { key: 'gateAttack', type: 'number', default: 1, min: 0.1, max: 50, step: 0.1, unit: 'ms', label: 'Attack', group: 'GATE' },
      { key: 'gateHold', type: 'number', default: 20, min: 0, max: 500, step: 1, unit: 'ms', label: 'Hold', group: 'GATE' },
      { key: 'gateRelease', type: 'number', default: 120, min: 5, max: 2000, step: 1, unit: 'ms', label: 'Release', group: 'GATE' },
      { key: 'compOn', type: 'boolean', default: true, label: 'Comp', group: 'COMPRESSOR' },
      { key: 'thresh', type: 'number', default: -18, min: -60, max: 0, step: 0.1, unit: 'dB', label: 'Thresh', group: 'COMPRESSOR' },
      { key: 'ratio', type: 'number', default: 4, min: 1, max: 20, step: 0.1, label: 'Ratio', group: 'COMPRESSOR' },
      { key: 'knee', type: 'number', default: 6, min: 0, max: 30, step: 0.5, unit: 'dB', label: 'Knee', group: 'COMPRESSOR' },
      { key: 'attack', type: 'number', default: 5, min: 0.1, max: 100, step: 0.1, unit: 'ms', label: 'Attack', group: 'COMPRESSOR' },
      { key: 'release', type: 'number', default: 120, min: 10, max: 1000, step: 1, unit: 'ms', label: 'Release', group: 'COMPRESSOR' },
      { key: 'makeup', type: 'number', default: 0, min: 0, max: 24, step: 0.1, unit: 'dB', label: 'Makeup', group: 'COMPRESSOR' },
      { key: 'keyed', type: 'boolean', default: false, label: 'Key', group: 'COMPRESSOR', hint: 'the KEY input drives the compressor and gate (wire a kick into it)' },
    ].concat(SDK.STD_FX_CONFIG),
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const fx = SDK.fxShell(ctx);
      const keyIn = ac.createGain(); keyIn.channelCount = 2; keyIn.channelCountMode = 'explicit'; ctx.track(keyIn);
      ctx.port('key', { kind: 'audio', direction: 'in', node: keyIn, label: 'key' });
      const grBus = ac.createGain(); grBus.gain.value = 1; ctx.track(grBus);
      ctx.port('gr', { kind: 'mod', direction: 'out', node: grBus, label: 'gain reduction' });
      let dyn = null, native = null;
      const PARAM = { gateOn: (v) => v ? 1 : 0, compOn: (v) => v ? 1 : 0, keyed: (v) => v ? 1 : 0 };
      function apply(now) {
        if (dyn) Object.keys(PARAM).concat(KNOBS).forEach(k => { const a = dyn.parameters.get(k); const v = PARAM[k] ? PARAM[k](P.get(k)) : P.get(k); if (now) a.setValueAtTime(v, ac.currentTime); else a.setTargetAtTime(v, ac.currentTime, 0.005); });
        if (native) { const t = ac.currentTime; native.c.threshold.setTargetAtTime(P.get('thresh'), t, 0.01); native.c.ratio.setTargetAtTime(P.get('ratio'), t, 0.01); native.c.knee.setTargetAtTime(P.get('knee'), t, 0.01); native.c.attack.setTargetAtTime(P.get('attack') / 1000, t, 0.01); native.c.release.setTargetAtTime(P.get('release') / 1000, t, 0.01); native.m.gain.setTargetAtTime(P.get('compOn') ? Math.pow(10, P.get('makeup') / 20) : 1, t, 0.01); }
      }
      ctx.ready = ctx.loadWorklet('eravos-dyn', DYN).then(() => {
        dyn = new AudioWorkletNode(ac, 'eravos-dyn', { numberOfInputs: 2, numberOfOutputs: 2, outputChannelCount: [2, 1], channelCount: 2, channelCountMode: 'explicit' });
        ctx.track(dyn); fx.wetIn.connect(dyn, 0, 0); keyIn.connect(dyn, 0, 1); dyn.connect(fx.wetOut, 0); dyn.connect(grBus, 1); apply(true);
      }).catch(() => {
        const c = ac.createDynamicsCompressor(), m = ac.createGain(); native = { c, m }; ctx.track(c); ctx.track(m);
        fx.wetIn.connect(c); c.connect(m); m.connect(fx.wetOut); apply(true);
        ctx.fault('RUNTIME_003', 'Dynamics: AudioWorklet unavailable — simple compressor only (no gate, no key input)');
      });
      Object.keys(PARAM).concat(KNOBS).forEach(k => P.onChange(k, () => apply(false)));
      ctx.internals = { get dyn() { return dyn; }, keyIn, grBus };
      return { unmount() { if (dyn) try { dyn.port.postMessage('reset'); } catch (e) {} } };
    },
  });
})();
