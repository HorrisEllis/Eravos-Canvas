/* eravos.band-collision 1.0.0 — Collision (spec: band-collision.spec · direction: specs/eravos.contrast-space.spec ADDENDUM 2026-11-27 (2))
 * His words (2026-11-27): "the frequencies how the collide" · "Okay but not one monolith" · "yes build them use the null renderer to make sure
 * its novel in relation to the rest of eravos".
 *
 * Where two sounds fight for the same band, one steps back. The sound through it (a bass) is split at Split (multiband-splitter, LR4, sums
 * flat); the KEY (wire a kick into it) is heard by envelope-follower; each time the key hits, the LOW band ducks by Low duck dB and the MID
 * band by Mid duck dB (in step with the key's own loudness: a softer kick takes less), back over Release. Low mono folds the low band to the
 * centre (the sub belongs in the middle). The view shows both spectra and, lit, where they collide (masking-analyzer).
 * Out 2: the duck as a modulation signal (0 none … 1 the full Low duck) — the same moment can move any other knob.
 * Built from components (never re-implemented here): multiband-splitter (Splitter) · envelope-follower (Follower) — their kernel text runs in
 * this tool's worklet, so what their tests prove is what plays · masking-analyzer (the view). With nothing wired to the key and Split
 * anywhere, the bands sum back to the input (only an allpass's phase): Low duck 0 + Mid duck 0 + Low mono off = the sound, untouched in level. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, SDK = OrganismSDK, MP = window.MusicParts;
  const SET = ['split', 'lowDuck', 'midDuck', 'attack', 'release', 'hold', 'floor', 'lowMono', 'lowGain', 'midGain'];
  const DESC = SET.map(k => ({ name: k, defaultValue: 0, minValue: -1e6, maxValue: 1e6, automationRate: 'k-rate' }));
  const SRC = () => `const Splitter = ${MP.Splitter};
const Follower = ${MP.Follower};
const SET = ${JSON.stringify(SET)};
class EravosCollision extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(DESC)}; }
  constructor() { super(); this.sp = [Splitter(), Splitter()]; this.f = Follower(); this.key = ''; this.s = {}; }
  apply() { const s = this.s; this.sp.forEach(x => x.set(Math.max(20, s.split), 0, 2, sampleRate)); this.f.set({ attack: s.attack, release: s.release, hold: s.hold, floor: s.floor }, sampleRate); }
  process(inputs, outputs, p) {
    let key = ''; for (const k of SET) { const v = p[k][0]; this.s[k] = v; key += v + ','; } if (key !== this.key) { this.key = key; this.apply(); }
    const s = this.s, inp = inputs[0] || [], kin = inputs[1] || [], out = outputs[0], dk = outputs[1] && outputs[1][0];
    const L = out[0], R = out[1] || out[0], B = L.length, iL = inp[0], iR = inp[1] || inp[0], kL = kin[0], kR = kin[1] || kin[0];
    const lowG = Math.pow(10, s.lowGain / 20), midG = Math.pow(10, s.midGain / 20), mono = s.lowMono > 0.5;
    for (let j = 0; j < B; j++) {
      const kx = kL ? Math.max(Math.abs(kL[j]), kR ? Math.abs(kR[j]) : 0) : 0, e = this.f.next(kx);
      const gl = lowG * Math.pow(10, -s.lowDuck * e / 20), gm = midG * Math.pow(10, -s.midDuck * e / 20);
      if (dk) dk[j] = s.lowDuck > 0 ? e : 0;
      if (!iL) { L[j] = 0; if (R !== L) R[j] = 0; this.sp[0].process(0); this.sp[1].process(0); continue; }
      const a = this.sp[0].process(iL[j]), lo0 = a[0], hi0 = a[1], b = this.sp[1].process(iR[j]), lo1 = b[0], hi1 = b[1];
      const lm = mono ? (lo0 + lo1) * 0.5 : 0;
      L[j] = (mono ? lm : lo0) * gl + hi0 * gm; if (R !== L) R[j] = (mono ? lm : lo1) * gl + hi1 * gm;
    }
    return true;
  }
}
registerProcessor('eravos-collision', EravosCollision);`;
  OrganismFactory.define({
    id: 'eravos.band-collision', domain: 'music', version: '1.0.0', label: 'Collision', icon: '⨯', accent: '#ff5a3c',
    category: 'Effects', blurb: 'Where two sounds fight for one band, one steps back: the low end ducks on the kick, the mid can too. See where they collide.',
    size: { w: 600, h: 560 }, minSize: { w: 440, h: 380 },
    permissions: ['audio_out', 'audio_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.fx', 'capability.mod_out'],
    hooks: SDK.fxHooks([Object.assign(S.audio_in('col.hook.key_in', 'key', true), { intent: 'KEY: the sound that takes the low end (wire a kick into it)', label: 'Key' }),
      S.mod_in('col.hook.mod_split', 'split'), Object.assign(S.mod_out('col.hook.duck_out', 'duck'), { label: 'The duck' })]),
    config: [
      { key: 'split', type: 'number', default: 130, min: 30, max: 600, step: 1, unit: 'Hz', label: 'Split', group: 'SPLIT', element: 'multiband-splitter', hint: 'Under it is the LOW band (the sub), over it the MID' },
      { key: 'lowDuck', type: 'number', default: 20, min: 0, max: 36, step: 0.1, unit: 'dB', label: 'Low duck', group: 'DUCK', hint: 'How far the low band steps back when the key hits' },
      { key: 'midDuck', type: 'number', default: 0, min: 0, max: 24, step: 0.1, unit: 'dB', label: 'Mid duck', group: 'DUCK' },
      { key: 'attack', type: 'number', default: 0.5, min: 0.1, max: 50, step: 0.1, unit: 'ms', label: 'Attack', group: 'KEY', element: 'envelope-follower' },
      { key: 'hold', type: 'number', default: 70, min: 0, max: 300, step: 1, unit: 'ms', label: 'Hold', group: 'KEY', element: 'envelope-follower' },
      { key: 'release', type: 'number', default: 180, min: 5, max: 1500, step: 1, unit: 'ms', label: 'Release', group: 'KEY', element: 'envelope-follower' },
      { key: 'floor', type: 'number', default: -48, min: -90, max: -12, step: 1, unit: 'dB', label: 'Hears from', group: 'KEY', element: 'envelope-follower', hint: 'The key under this is silence to it' },
      { key: 'lowMono', type: 'boolean', default: true, label: 'Low mono', group: 'SPLIT', hint: 'The low band folded to the centre' },
      { key: 'lowGain', type: 'number', default: 0, min: -24, max: 12, step: 0.1, unit: 'dB', label: 'Low', group: 'BANDS' },
      { key: 'midGain', type: 'number', default: 0, min: -24, max: 12, step: 0.1, unit: 'dB', label: 'Mid', group: 'BANDS' },
    ].concat(SDK.STD_FX_CONFIG),
    defaultPreset: 'Kick Takes the Floor',
    survey: { key: 'kick' },   // tests/tool-audio.mjs measures it with a kick in the key (it acts only when the key hits)
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, fx = SDK.fxShell(ctx);
      const keyIn = ac.createGain(); keyIn.channelCount = 2; keyIn.channelCountMode = 'explicit'; ctx.track(keyIn);
      ctx.port('key', { kind: 'audio', direction: 'in', node: keyIn, label: 'Key' });
      const duckBus = ac.createGain(); ctx.track(duckBus); ctx.port('duck', { kind: 'mod', direction: 'out', node: duckBus, label: 'The duck' });
      const splitMod = ctx.modBus('split', { min: -200, max: 200 });
      // the view's ears: the sound in, the key — the masking-analyzer reads them (never the audio thread)
      const anIn = ac.createAnalyser(), anKey = ac.createAnalyser(); [anIn, anKey].forEach(a => { a.fftSize = 4096; a.smoothingTimeConstant = 0.7; ctx.track(a); });
      fx.wetIn.connect(anIn); keyIn.connect(anKey); ctx.analysers = { in: anIn, key: anKey };
      let node = null; const valueOf = (k) => k === 'lowMono' ? (P.get(k) ? 1 : 0) : P.get(k);
      const pass = ac.createGain(); fx.wetIn.connect(pass); pass.connect(fx.wetOut); ctx.track(pass);   // until the worklet is ready: the sound as it is
      ctx.ready = ctx.loadWorklet('eravos-collision', SRC()).then(() => {
        if (ctx.disposed) return;
        node = new AudioWorkletNode(ac, 'eravos-collision', { numberOfInputs: 2, numberOfOutputs: 2, outputChannelCount: [2, 1], channelCount: 2, channelCountMode: 'explicit', parameterData: Object.fromEntries(SET.map(k => [k, valueOf(k)])) });
        ctx.track(node); node.onprocessorerror = (er) => ctx.fault('RUNTIME_003', 'collision worklet stopped: ' + ((er && er.message) || 'processor error'));
        fx.wetIn.connect(node, 0, 0); keyIn.connect(node, 0, 1); node.connect(fx.wetOut, 0); node.connect(duckBus, 1);
        splitMod.connect(node.parameters.get('split'));
        try { fx.wetIn.disconnect(pass); } catch (e) {} SET.forEach(k => node.parameters.get(k).setValueAtTime(valueOf(k), 0));
      }).catch(er => ctx.fault('RUNTIME_003', 'collision worklet: ' + er.message));
      SET.forEach(k => P.onChange(k, () => { if (node) node.parameters.get(k).setValueAtTime(valueOf(k), ac.currentTime); }));
      ctx.collide = () => { const a = new Float32Array(anIn.frequencyBinCount), b = new Float32Array(anKey.frequencyBinCount); anIn.getFloatFrequencyData(a); anKey.getFloatFrequencyData(b);
        return Object.assign(MP.masking(a, b, { binHz: ac.sampleRate / anIn.fftSize }), { a, b, binHz: ac.sampleRate / anIn.fftSize }); };
      return {};
    },
  });
})();
