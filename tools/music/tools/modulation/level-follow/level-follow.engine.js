/* eravos.level-follow 1.0.0 — Follow: one tool's loudness moves another tool's knob (spec: level-follow.spec). A connector.
 * His words (2026-11-27): "Also tools to connect to tools."
 *
 * Wire any sound in (it is only listened to: it still plays where it played) and its loudness comes out as a signal 0…1 (envelope-follower:
 * Attack, Hold, Release; Hears from = the level that counts as nothing). Amount scales it, Invert turns it over (loud → 0: a duck), Offset
 * lifts it. Wire the out (violet) into any knob: a bass opens a filter, a kick ducks a pad, a voice moves a wobble.
 * Built from components (never re-implemented here): envelope-follower — its kernel text runs in this tool's worklet.
 * Nothing wired in: the out is Offset (0 by default). */
(function () {
  'use strict';
  const S = OrganismSDK.STD, MP = window.MusicParts;
  const SET = ['attack', 'hold', 'release', 'floor', 'amount', 'invert', 'offset'];
  const DESC = SET.map(k => ({ name: k, defaultValue: 0, minValue: -1e6, maxValue: 1e6, automationRate: 'k-rate' }));
  const SRC = () => `const Follower = ${MP.Follower};
const SET = ${JSON.stringify(SET)};
class EravosFollow extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(DESC)}; }
  constructor() { super(); this.f = Follower(); this.s = {}; this.key = ''; }
  process(inputs, outputs, p) {
    let key = ''; for (const k of SET) { const v = p[k][0]; this.s[k] = v; key += v + ','; } if (key !== this.key) { this.key = key; this.f.set({ attack: this.s.attack, hold: this.s.hold, release: this.s.release, floor: this.s.floor }, sampleRate); }
    const s = this.s, inp = inputs[0] || [], L = inp[0], R = inp[1] || inp[0], o = outputs[0][0];
    for (let j = 0; j < o.length; j++) { const x = L ? Math.max(Math.abs(L[j]), R ? Math.abs(R[j]) : 0) : 0, e = this.f.next(x), v = s.invert > 0.5 ? 1 - e : e;
      o[j] = Math.max(0, Math.min(1, s.offset + s.amount * v)); }
    return true;
  }
}
registerProcessor('eravos-follow', EravosFollow);`;
  OrganismFactory.define({
    id: 'eravos.level-follow', domain: 'music', version: '1.0.0', label: 'Follow', icon: 'F', accent: '#7fe08a',
    category: 'Modulation', blurb: 'One tool’s loudness moves another tool’s knob: a bass opens a filter, a kick ducks a pad, a voice moves a wobble.',
    size: { w: 460, h: 420 }, minSize: { w: 360, h: 320 },
    permissions: ['audio_in', 'audio_out', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.mod_out'],
    hooks: [Object.assign(S.audio_in('fol.hook.audio_in', 'in', true), { primary: true, intent: 'The sound to follow (it still plays where it played)' }),
      Object.assign(S.mod_out('fol.hook.level', 'level'), { label: 'Level', intent: 'How loud it is, 0…1 — wire it into any knob' })],
    config: [
      { key: 'attack', type: 'number', default: 5, min: 0.1, max: 500, step: 0.1, unit: 'ms', label: 'Attack', group: 'FOLLOW', element: 'envelope-follower', hint: 'How fast it rises when the sound gets louder' },
      { key: 'hold', type: 'number', default: 0, min: 0, max: 500, step: 1, unit: 'ms', label: 'Hold', group: 'FOLLOW', element: 'envelope-follower', hint: 'How long it stays up before it may fall' },
      { key: 'release', type: 'number', default: 150, min: 1, max: 3000, step: 1, unit: 'ms', label: 'Release', group: 'FOLLOW', element: 'envelope-follower', hint: 'How fast it falls when the sound gets quieter' },
      { key: 'floor', type: 'number', default: -48, min: -90, max: -6, step: 1, unit: 'dB', label: 'Hears from', group: 'FOLLOW', element: 'envelope-follower', hint: 'Quieter than this counts as nothing' },
      { key: 'amount', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Amount', group: 'OUT', hint: 'How far the knob it is wired to moves' },
      { key: 'invert', type: 'boolean', default: false, label: 'Invert', group: 'OUT', hint: 'Loud → down (a duck) instead of up' },
      { key: 'offset', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Offset', group: 'OUT', hint: 'Where it rests when nothing is heard' },
    ],
    defaultPreset: 'Bass Opens',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const inp = ac.createGain(); inp.channelCount = 2; inp.channelCountMode = 'explicit'; ctx.track(inp);
      ctx.port('in', { kind: 'audio', direction: 'in', node: inp, tap: true, label: 'In' });
      const out = ac.createGain(); ctx.track(out); ctx.port('level', { kind: 'mod', direction: 'out', node: out, label: 'Level' });
      const valueOf = (k) => k === 'invert' ? (P.get(k) ? 1 : 0) : P.get(k);
      let node = null;
      ctx.ready = ctx.loadWorklet('eravos-follow', SRC()).then(() => {
        if (ctx.disposed) return;
        node = new AudioWorkletNode(ac, 'eravos-follow', { numberOfInputs: 1, numberOfOutputs: 1, outputChannelCount: [1], channelCount: 2, channelCountMode: 'explicit', parameterData: Object.fromEntries(SET.map(k => [k, valueOf(k)])) });
        ctx.track(node); node.onprocessorerror = (er) => ctx.fault('RUNTIME_003', 'follow worklet stopped: ' + ((er && er.message) || 'processor error'));
        inp.connect(node); node.connect(out); SET.forEach(k => node.parameters.get(k).setValueAtTime(valueOf(k), 0));
      }).catch(er => ctx.fault('RUNTIME_003', 'follow worklet: ' + er.message));
      SET.forEach(k => P.onChange(k, () => { if (node) node.parameters.get(k).setValueAtTime(valueOf(k), ac.currentTime); }));
      return {};
    },
  });
})();
