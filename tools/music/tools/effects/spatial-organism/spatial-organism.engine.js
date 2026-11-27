/* eravos.spatial-organism 1.0.0 — Spatial Organism (spec: spatial-organism.spec · planned: tools/music/planned/spatial-organism.spec ·
 * direction: specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2)). His words (2026-11-27): "i want a bunch of spacial tools and ui
 * elements for components" · "yes build them use the null renderer to make sure its novel in relation to the rest of eravos".
 *
 * Any sound, placed around you and moved. The input's MID (L+R)/2 becomes a point (panner): an Angle and a Distance (level, air, the time it
 * takes to arrive), and with Ears the far ear hears it later and darker (binaural, for headphones). An ORBIT moves it (lfo: sine, triangle or
 * the pendulum, which lingers on one side by Lean), swinging the angle by Orbit depth and, with Orbit distance, carrying it away as it swings.
 * A ROOM answers it (early-reflections: twelve echoes from the room's size, absorption, damping, spread). The input's own SIDE (L−R)/2 is kept
 * by Width, and Bass mono folds what is under it to the centre (stereo-tools). Out 2: where it is now (the angle 0…1), for any other tool.
 * Built from components (never re-implemented here): panner · early-reflections · lfo · stereo-tools — their kernel text runs in this tool's
 * worklet. Angle 0, Distance 0, Ears 0, Orbit depth 0, Room 0, Width 1, Bass mono 0: the input's mid comes out −3 dB a side and its side as it
 * was — a plain equal-power centre, nothing added. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK, MP = window.MusicParts;
  const SHAPES = ['sine', 'triangle', 'pendulum'], LFO_SHAPE = { sine: 0, triangle: 1, pendulum: 7 };
  const SET = ['angle', 'distance', 'ears', 'orbit', 'shape', 'orbitDepth', 'lean', 'orbitDist', 'size', 'predelay', 'room', 'absorption', 'damping', 'spread', 'width', 'bassMono'];
  const DESC = SET.map(k => ({ name: k, defaultValue: 0, minValue: -1e6, maxValue: 1e6, automationRate: 'k-rate' }))
    .concat([{ name: 'angleMod', defaultValue: 0, minValue: -2, maxValue: 2, automationRate: 'k-rate' }, { name: 'distMod', defaultValue: 0, minValue: -1, maxValue: 1, automationRate: 'k-rate' }]);
  const SRC = () => `const Panner = ${MP.Panner};
const Reflections = ${MP.Reflections};
const LFO = ${MP.LFO};
const MonoBelow = ${MP.MonoBelow};
const SET = ${JSON.stringify(SET)};
class EravosSpatial extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(DESC)}; }
  constructor() { super(); this.p = Panner(); this.er = Reflections(); this.lfo = LFO(); this.mono = MonoBelow(); this.s = {}; this.key = ''; this.lfo.reset(); this.L = new Float32Array(128); this.R = new Float32Array(128); }
  apply() { const s = this.s; this.er.set({ size: s.size, predelay: s.predelay, absorption: s.absorption, damping: s.damping, spread: s.spread, level: 1 }, sampleRate);
    this.lfo.set({ shape: s.shape | 0, rate: Math.max(0.01, s.orbit), lean: s.lean }, sampleRate); this.mono.set(s.bassMono, sampleRate); }
  process(inputs, outputs, p) {
    let key = ''; for (const k of SET) { const v = p[k][0]; this.s[k] = v; key += v + ','; } if (key !== this.key) { this.key = key; this.apply(); }
    const s = this.s, inp = inputs[0] || [], out = outputs[0], ao = outputs[1] && outputs[1][0], iL = inp[0], iR = inp[1] || inp[0], B = out[0].length;
    // the orbit moves once a block (2.7 ms at 48 kHz): the swing, and how far it carries the sound away
    let ph = 0; for (let j = 0; j < B; j++) ph = this.lfo.next();
    const ang = Math.max(-1, Math.min(1, s.angle + p.angleMod[0] + s.orbitDepth * ph)), dist = Math.max(0, Math.min(1, s.distance + p.distMod[0] + s.orbitDist * (0.5 - 0.5 * Math.cos(Math.PI * ph))));
    this.p.set({ angle: ang, distance: dist, ears: s.ears }, sampleRate);
    const L = this.L, R = this.R, room = s.room, w = s.width;
    for (let j = 0; j < B; j++) {
      const l = iL ? iL[j] : 0, r = iR ? iR[j] : 0, m = (l + r) * 0.5, sd = (l - r) * 0.5, v = this.p.process(m), e = room > 0 ? this.er.process(v[0] + v[1]) : null;
      L[j] = v[0] + sd * w + (e ? e[0] * room : 0); R[j] = v[1] - sd * w + (e ? e[1] * room : 0);
      if (ao) ao[j] = (ang + 1) * 0.5;
    }
    if (s.bassMono > 0) this.mono.process(L, R, B);
    out[0].set(L.subarray(0, B)); if (out[1]) out[1].set(R.subarray(0, B));
    return true;
  }
}
registerProcessor('eravos-spatial', EravosSpatial);`;
  OrganismFactory.define({
    id: 'eravos.spatial-organism', domain: 'music', version: '1.0.0', label: 'Spatial Organism', icon: '◎', accent: '#5ac8ff',
    category: 'Effects', blurb: 'Any sound placed around you and moved: angle, distance, a room that answers, an orbit that swings or lingers. Ears for headphones.',
    size: { w: 600, h: 600 }, minSize: { w: 440, h: 400 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx', 'capability.mod_out'],
    hooks: SDK.fxHooks([S.mod_in('sp.hook.mod_angle', 'angle'), S.mod_in('sp.hook.mod_distance', 'distance'), Object.assign(S.mod_out('sp.hook.where_out', 'where'), { label: 'where it is' })]),
    config: [
      { key: 'angle', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Angle', group: 'PLACE', element: 'panner', hint: '−1 left · 0 ahead · 1 right' },
      { key: 'distance', type: 'number', default: 0.2, min: 0, max: 1, step: 0.01, label: 'Distance', group: 'PLACE', element: 'panner', hint: 'quieter, darker and later the further it is' },
      { key: 'ears', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Ears', group: 'PLACE', element: 'panner', hint: 'binaural: the far ear hears it later and darker (headphones)' },
      { key: 'orbit', type: 'number', default: 0.25, min: 0.02, max: 6, step: 0.01, unit: 'Hz', label: 'Orbit', group: 'MOTION', element: 'lfo' },
      { key: 'shape', type: 'enum', options: SHAPES, default: 'pendulum', label: 'Swing', group: 'MOTION', element: 'lfo' },
      { key: 'orbitDepth', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Swing width', group: 'MOTION', element: 'lfo' },
      { key: 'lean', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Lean', group: 'MOTION', element: 'lfo', hint: 'pendulum: lingers right (> 0) or left (< 0)' },
      { key: 'orbitDist', type: 'number', default: 0.2, min: 0, max: 1, step: 0.01, label: 'Swing away', group: 'MOTION', hint: 'how far the swing carries it away from you' },
      { key: 'room', type: 'number', default: 0.35, min: 0, max: 1, step: 0.01, label: 'Room', group: 'ROOM', element: 'early-reflections' },
      { key: 'size', type: 'number', default: 12, min: 2, max: 60, step: 0.1, unit: 'm', label: 'Size', group: 'ROOM', element: 'early-reflections' },
      { key: 'predelay', type: 'number', default: 8, min: 0, max: 100, step: 0.1, unit: 'ms', label: 'Pre-delay', group: 'ROOM', element: 'early-reflections' },
      { key: 'absorption', type: 'number', default: 0.35, min: 0, max: 0.95, step: 0.01, label: 'Absorb', group: 'ROOM', element: 'early-reflections' },
      { key: 'damping', type: 'number', default: 0.4, min: 0, max: 1, step: 0.01, label: 'Damping', group: 'ROOM', element: 'early-reflections' },
      { key: 'spread', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Spread', group: 'ROOM', element: 'early-reflections' },
      { key: 'width', type: 'number', default: 1, min: 0, max: 2, step: 0.01, label: 'Width', group: 'OUT', element: 'stereo-tools', hint: 'the input’s own stereo (its side)' },
      { key: 'bassMono', type: 'number', default: 120, min: 0, max: 400, step: 1, unit: 'Hz', label: 'Bass mono', group: 'OUT', element: 'stereo-tools' },
    ].concat(SDK.STD_FX_CONFIG),
    defaultPreset: 'Moving Orbit',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, fx = SDK.fxShell(ctx);
      const whereBus = ac.createGain(); ctx.track(whereBus); ctx.port('where', { kind: 'mod', direction: 'out', node: whereBus, label: 'where it is' });
      const angleMod = ctx.modBus('angle', { min: -1, max: 1 }), distMod = ctx.modBus('distance', { min: -1, max: 1 });
      const valueOf = (k) => k === 'shape' ? LFO_SHAPE[P.get('shape')] : P.get(k);
      let node = null; const pass = ac.createGain(); fx.wetIn.connect(pass); pass.connect(fx.wetOut); ctx.track(pass);
      ctx.ready = ctx.loadWorklet('eravos-spatial', SRC()).then(() => {
        if (ctx.disposed) return;
        node = new AudioWorkletNode(ac, 'eravos-spatial', { numberOfInputs: 1, numberOfOutputs: 2, outputChannelCount: [2, 1], channelCount: 2, channelCountMode: 'explicit', parameterData: Object.fromEntries(SET.map(k => [k, valueOf(k)])) });
        ctx.track(node); node.onprocessorerror = (er) => ctx.fault('RUNTIME_003', 'spatial worklet stopped: ' + ((er && er.message) || 'processor error'));
        fx.wetIn.connect(node); node.connect(fx.wetOut, 0); node.connect(whereBus, 1); angleMod.connect(node.parameters.get('angleMod')); distMod.connect(node.parameters.get('distMod'));
        try { fx.wetIn.disconnect(pass); } catch (e) {} SET.forEach(k => node.parameters.get(k).setValueAtTime(valueOf(k), 0));
      }).catch(er => ctx.fault('RUNTIME_003', 'spatial worklet: ' + er.message));
      SET.forEach(k => P.onChange(k, () => { if (node) node.parameters.get(k).setValueAtTime(valueOf(k), ac.currentTime); }));
      return {};
    },
  });
})();
