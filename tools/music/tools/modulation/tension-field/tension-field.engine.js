/* eravos.tension-field 1.0.0 — Tension Field (spec: tension-field.spec · planned: tools/music/planned/tension-field.spec · direction:
 * specs/eravos.contrast-space.spec, CS5). His words (2026-11-27): "the way it creates ripples and tension" · "actually continue with the tensino
 * field then release first."
 *
 * Tension as a signal. MEASURE: whatever is wired into it is heard (tension-meter: loudness, brightness, density, motion, weighted). TARGET: a
 * build held over Hold bars from the moment the transport plays (energy-curve: it waits and rushes by Shape, reaches Peak on the last bar) and
 * lets go — at the end of the hold, on ⇣ RELEASE, or when its release input is pushed past half — falling to Floor over Release; with Loop it
 * rests and builds again. BOTH: the higher of the two (the music's own tension, never below the plan). Every kind goes out on its own (map
 * mode: wire loudness to one knob, brightness to another), the result as Tension, and the moment of letting go as Release (1 → 0).
 * Built from components (never re-implemented here): tension-meter · energy-curve — their kernel text runs in this tool's worklet.
 * Nothing in, mode Measure: every output 0. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, MP = window.MusicParts;
  const MODES = ['measure', 'target', 'both'], OUTS = ['tension', 'release', 'loudness', 'brightness', 'density', 'motion'];
  const SET = ['mode', 'holdS', 'shape', 'releaseS', 'floor', 'peak', 'loop', 'restS', 'wLoud', 'wBright', 'wDense', 'wMotion'];
  const DESC = SET.map(k => ({ name: k, defaultValue: 0, minValue: -1e6, maxValue: 1e6, automationRate: 'k-rate' }))
    .concat(['startT', 'releaseT', 'relMod'].map(k => ({ name: k, defaultValue: 0, minValue: -1e9, maxValue: 1e9, automationRate: 'k-rate' })));
  const SRC = () => `const TensionMeter = ${MP.TensionMeter};
const EnergyCurve = ${MP.EnergyCurve};
const SET = ${JSON.stringify(SET)};
class EravosTension extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(DESC)}; }
  constructor() { super(); this.m = TensionMeter(); this.c = EnergyCurve(); this.s = {}; this.key = ''; this.st = 0; this.rt = 0; this.mod = 0; this.pulse = 0; this.lastRel = -1; }
  apply() { const s = this.s; this.m.set({ wLoud: s.wLoud, wBright: s.wBright, wDense: s.wDense, wMotion: s.wMotion }, sampleRate);
    this.c.set({ hold: s.holdS, shape: s.shape, release: s.releaseS, floor: s.floor, peak: s.peak, loop: s.loop, rest: s.restS }); }
  process(inputs, outputs, p) {
    let key = ''; for (const k of SET) { const v = p[k][0]; this.s[k] = v; key += v + ','; } if (key !== this.key) { this.key = key; this.apply(); }
    const now = currentTime, B = outputs[0][0].length, inp = inputs[0] || [], s = this.s;
    const st = p.startT[0]; if (st !== this.st) { this.st = st; if (st > 0) this.c.start(st); }
    const rt = p.releaseT[0]; if (rt !== this.rt) { this.rt = rt; if (rt > 0) this.c.release(Math.max(rt, now)); }
    const rm = p.relMod[0]; if (rm > 0.5 && this.mod <= 0.5) this.c.release(now); this.mod = rm;
    const m = inp[0] ? this.m.block(inp[0], inp[1] || null, B) : this.m.state;
    if (!inp[0]) { m.loudness = 0; m.brightness = 0; m.density = 0; m.motion = 0; m.sum = 0; }
    const cv = this.c.at(now), mode = s.mode | 0, rel = this.c.released;
    if (rel >= 0 && rel !== this.lastRel && now >= rel) { this.lastRel = rel; this.pulse = 1; }
    const tension = mode === 0 ? m.sum : mode === 1 ? cv : Math.max(m.sum, cv);
    const fall = Math.exp(-B / (Math.max(0.001, s.releaseS) * sampleRate / 4.6));
    const vals = [tension, this.pulse, m.loudness, m.brightness, m.density, m.motion];
    for (let o = 0; o < vals.length; o++) { const ch = outputs[o] && outputs[o][0]; if (ch) ch.fill(vals[o]); }
    this.pulse *= fall; if (this.pulse < 1e-4) this.pulse = 0;
    return true;
  }
}
registerProcessor('eravos-tension', EravosTension);`;
  OrganismFactory.define({
    id: 'eravos.tension-field', domain: 'music', version: '1.0.0', label: 'Tension Field', icon: 'T', accent: '#ff5a3c',
    category: 'Modulation', blurb: 'Tension as a signal: hear it in any sound, or build it to a peak by a bar and let it go at RELEASE. Every kind goes out to move any knob.',
    size: { w: 600, h: 600 }, minSize: { w: 440, h: 400 },
    permissions: ['audio_in', 'audio_out', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.mod_out'],
    hooks: [Object.assign(S.audio_in('tf.hook.audio_in', 'in', true), { intent: 'The sound whose tension is heard (any tool, or the whole mix)' }), S.transport_in('tf.hook.transport_in'),
      Object.assign(S.mod_in('tf.hook.mod_release', 'releaseIn'), { primary: true, intent: 'Pushed past half, it lets go' }),
      Object.assign(S.mod_out('tf.hook.tension', 'tension'), { label: 'Tension' }), Object.assign(S.mod_out('tf.hook.release', 'release'), { label: 'Release' }),
      Object.assign(S.mod_out('tf.hook.loudness', 'loudness'), { label: 'Loudness' }), Object.assign(S.mod_out('tf.hook.brightness', 'brightness'), { label: 'Brightness' }),
      Object.assign(S.mod_out('tf.hook.density', 'density'), { label: 'Density' }), Object.assign(S.mod_out('tf.hook.motion', 'motion'), { label: 'Motion' })],
    config: [
      { key: 'mode', type: 'enum', options: MODES, default: 'both', label: 'Mode', group: 'MODE', hint: 'Measure: heard · Target: the build · Both: the higher of the two' },
      { key: 'hold', type: 'number', default: 8, min: 1, max: 64, step: 1, unit: 'bars', label: 'Hold', group: 'BUILD', element: 'energy-curve', hint: 'The build reaches Peak on the last bar of the hold' },
      { key: 'shape', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Shape', group: 'BUILD', element: 'energy-curve', hint: '0 a straight climb · 1 it waits, then rushes' },
      { key: 'release', type: 'number', default: 0.2, min: 0.01, max: 8, step: 0.01, unit: 's', label: 'Release', group: 'BUILD', element: 'energy-curve' },
      { key: 'floor', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Floor', group: 'BUILD', element: 'energy-curve' },
      { key: 'peak', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Peak', group: 'BUILD', element: 'energy-curve' },
      { key: 'loop', type: 'boolean', default: true, label: 'Loop', group: 'BUILD', element: 'energy-curve' },
      { key: 'rest', type: 'number', default: 0, min: 0, max: 32, step: 1, unit: 'bars', label: 'Rest', group: 'BUILD', element: 'energy-curve' },
      { key: 'wLoud', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Loudness', group: 'HEAR', element: 'tension-meter' },
      { key: 'wBright', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Bright', group: 'HEAR', element: 'tension-meter' },
      { key: 'wDense', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Density', group: 'HEAR', element: 'tension-meter' },
      { key: 'wMotion', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Motion', group: 'HEAR', element: 'tension-meter' },
    ],
    ui_hooks: ['release_now', 'build_now'],
    defaultPreset: 'Pre-Drop',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, bar = () => 240 / (ctx.bpm || 120);
      const inp = ac.createGain(); inp.channelCount = 2; inp.channelCountMode = 'explicit'; ctx.track(inp); ctx.port('in', { kind: 'audio', direction: 'in', node: inp, label: 'In' });
      const relMod = ctx.modBus('releaseIn', { min: 0, max: 1 });
      const buses = OUTS.map(k => { const g = ac.createGain(); ctx.track(g); ctx.port(k, { kind: 'mod', direction: 'out', node: g, label: k }); return g; });
      const valueOf = (k) => k === 'mode' ? MODES.indexOf(P.get('mode')) : k === 'holdS' ? P.get('hold') * bar() : k === 'releaseS' ? P.get('release') : k === 'restS' ? P.get('rest') * bar() : k === 'loop' ? (P.get('loop') ? 1 : 0) : P.get(k);
      let node = null; const queue = [];
      const when = (f) => { if (node) f(); else queue.push(f); };
      const prm = (k) => node.parameters.get(k);
      ctx.ready = ctx.loadWorklet('eravos-tension', SRC()).then(() => {
        if (ctx.disposed) return;
        node = new AudioWorkletNode(ac, 'eravos-tension', { numberOfInputs: 1, numberOfOutputs: OUTS.length, outputChannelCount: OUTS.map(() => 1), channelCount: 2, channelCountMode: 'explicit' });
        ctx.track(node); node.onprocessorerror = (er) => ctx.fault('RUNTIME_003', 'tension worklet stopped: ' + ((er && er.message) || 'processor error'));
        inp.connect(node); buses.forEach((g, o) => node.connect(g, o)); relMod.connect(prm('relMod'));
        SET.forEach(k => prm(k).setValueAtTime(valueOf(k), 0)); queue.splice(0).forEach(f => f());
      }).catch(er => ctx.fault('RUNTIME_003', 'tension worklet: ' + er.message));
      const setK = (k) => when(() => prm(k).setValueAtTime(valueOf(k), ac.currentTime));
      ['mode', 'shape', 'floor', 'peak', 'loop', 'wLoud', 'wBright', 'wDense', 'wMotion'].forEach(k => P.onChange(k, () => setK(k)));
      P.onChange('hold', () => setK('holdS')); P.onChange('release', () => setK('releaseS')); P.onChange('rest', () => setK('restS'));
      ctx.onBpm(() => { setK('holdS'); setK('restS'); });
      // the build starts when the transport plays (and on ⇡ BUILD); RELEASE lets go now. Times travel as AudioParams (an offline render runs ahead of messages)
      let building = false;
      const start = (t) => { building = true; when(() => prm('startT').setValueAtTime(Math.max(1e-6, t), ac.currentTime)); ctx.emitUI('build', { at: t }); };
      const letGo = (t) => { building = false; when(() => prm('releaseT').setValueAtTime(Math.max(1e-6, t), ac.currentTime)); ctx.emitUI('release', { at: t }); };
      ctx.onPlay((p) => start(p && p.time !== undefined ? p.time : ac.currentTime));
      ctx.onUI('release_now', { type: 'object' }, () => letGo(ac.currentTime));
      ctx.onUI('build_now', { type: 'object' }, () => start(ac.currentTime));
      ctx.startBuild = start; ctx.releaseAt = letGo; ctx.isBuilding = () => building;
      return {};
    },
  });
})();
