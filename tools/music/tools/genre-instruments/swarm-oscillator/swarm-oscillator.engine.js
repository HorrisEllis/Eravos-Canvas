/* eravos.swarm-oscillator 1.0.0 — Swarm Oscillator (spec: tools/music/planned/swarm-oscillator.spec · UI: …/swarm-oscillator.ui.md)
 * Beyond supersaw: unison voices that PULL on each other — drift apart, beat, lock into one wave — and how locked they are is a signal.
 * His go, 2026-11-06: "Make the swarm oscillator first. Since you were ready to."
 *
 * Built from components (tools/music/components — never re-implemented here); the sound runs in ONE AudioWorklet whose code is the
 * components' own kernel text, so what their tests prove is what plays:
 *   oscillator-population (POP) the coupled phases · osc-va (VA) saw/pulse/tri · osc-wavetable (WT) the table shape · env-adsr (ADSR)
 *   amp + filter envelopes · lfo (LFO) moves the coupling · filter-svf (SVF) 24 dB low-pass per note · stereo-tools (panL/panR,
 *   spread, MonoBelow) each voice across the width, mono below.
 * Per note (8 at once, the oldest gives way): a swarm of 1–32 voices. Every control changes while it plays (his rule, 2026-11-06:
 * "Tools, keys and values can be adjusted while playing them"). Lock on beat: each division of the transport snaps every phase to the
 * swarm's mean. Out: stereo audio · Coherence (0…1, audio-rate) as a modulation signal for any other tool. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, MP = window.MusicParts;
  const SHAPES = ['saw', 'pulse', 'tri', 'table'], MODES = ['free', 'coupled', 'harmonic', 'chaotic'], SYNC = { off: 0, '1/4': 4, '1/2': 8, bar: 16 };

  // ---------------------------------------------------------------- the worklet: the components' kernels, then the swarm
  // Everything timed travels as AudioParams (scheduled to the sample, and in step with an offline render — messages are not: a
  // render runs ahead of them). Settings are k-rate params; notes play through 8 voice slots, each a trigger (a count that changes
  // when a note starts), a gate, a note and a velocity; Lock on beat is a count too. The tables come in with the node.
  const SET = ['mode', 'shape', 'voices', 'spread', 'coupling', 'pull', 'drift', 'cluster', 'table', 'sub', 'octave', 'cutoff', 'res', 'envAmt', 'attack', 'decay', 'sustain', 'release', 'lfoRate', 'lfoCouple', 'width', 'monoBelow', 'level', 'restless', 'form', 'fieldFm', 'cohTone'];
  const SLOTS = 8;
  const DESC = SET.map(k => ({ name: k, defaultValue: 0, minValue: -1e6, maxValue: 1e6, automationRate: 'k-rate' }))
    .concat([{ name: 'couplingMod', defaultValue: 0, minValue: -1, maxValue: 1, automationRate: 'a-rate' }, { name: 'cutoffMod', defaultValue: 0, minValue: -9600, maxValue: 9600, automationRate: 'a-rate' },
      { name: 'snap', defaultValue: 0, minValue: 0, maxValue: 1e9, automationRate: 'a-rate' }])
    .concat([].concat(...Array.from({ length: SLOTS }, (_, i) => [{ name: 'trig' + i, defaultValue: 0, minValue: 0, maxValue: 1e9, automationRate: 'a-rate' },
      { name: 'gate' + i, defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' }, { name: 'note' + i, defaultValue: 60, minValue: 0, maxValue: 127, automationRate: 'k-rate' },
      { name: 'vel' + i, defaultValue: 0.8, minValue: 0, maxValue: 1, automationRate: 'k-rate' }])));
  const PROC = `
const SET = ${JSON.stringify(SET)}, SLOTS = ${SLOTS};
class EravosSwarm extends AudioWorkletProcessor {
  static get parameterDescriptors() { return ${JSON.stringify(DESC)}; }
  constructor(o) {
    super();
    const sr = sampleRate, B = 128, opt = (o && o.processorOptions) || {}; this.sr = sr;
    this.va = VA(); this.wt = WT(); if (opt.tables) this.wt.load(opt.tables); this.lfo = LFO(); this.mono = MonoBelow(); this.mono.set(120, sr);
    this.s = Object.assign({}, opt.values || {}); this.key = '';
    this.slots = [];
    for (let i = 0; i < SLOTS; i++) { const svf = SVF(); svf.setRate(sr);
      this.slots.push({ snapSeen: 0, trig: 0, gate: 0, f0: 220, vel: 0.8, born: 0, pop: POP(32), amp: ADSR(), fenv: ADSR(), svf, sub: 0, gL: new Float32Array(32), gR: new Float32Array(32),
        L: new Float32Array(B), R: new Float32Array(B), A: new Float32Array(B), F: new Float32Array(B) }); }
    this.count = 0; this.coh = 0; this.post = 0;
    this.P = { frequency: null, detune: [0], resonance: [0.2], gain: [0], mode: [0], stages: [2] };
    this.port.onmessage = (e) => { if (e.data && e.data.type === 'panic') for (const sl of this.slots) { sl.amp.reset(); sl.fenv.reset(); sl.gate = 0; } };
    this.apply();
  }
  pans(sl) { const n = sl.pop.n; for (let i = 0; i < n; i++) { const x = spread(i, n, this.s.width); sl.gL[i] = panL(x); sl.gR[i] = panR(x); } }
  // every control, live: sounding notes follow at once (voices, spread, width, envelopes, the swarm's physics)
  apply() {
    const s = this.s, sr = this.sr;
    this.lfo.set({ shape: 0, rate: s.lfoRate }, sr); this.mono.set(s.monoBelow, sr); this.P.resonance[0] = Math.min(0.97, s.res);
    for (const sl of this.slots) {
      sl.amp.set(s.attack, s.decay, s.sustain, s.release, sr); sl.fenv.set(s.attack * 0.5, s.decay, s.sustain * 0.5, s.release, sr);
      sl.pop.set({ mode: s.mode | 0, pull: s.pull, drift: s.drift, cluster: s.cluster, restless: s.restless, form: s.form, fm: s.fieldFm });
      if (!sl.amp.done) { sl.pop.configure(s.voices | 0, s.spread * 50); this.pans(sl); }
    }
  }
  start(sl, note, vel) {
    sl.f0 = 440 * Math.pow(2, (note - 69) / 12 + (this.s.octave | 0)); sl.vel = vel; sl.born = ++this.count; sl.sub = 0;
    if (sl.amp.done) sl.svf.reset();
    sl.pop.configure(this.s.voices | 0, this.s.spread * 50, (note * 7919 + sl.born * 104729) >>> 0);
    sl.pop.set({ mode: this.s.mode | 0, pull: this.s.pull, drift: this.s.drift, cluster: this.s.cluster, restless: this.s.restless, form: this.s.form, fm: this.s.fieldFm }); this.pans(sl);
  }
  process(inputs, outputs, params) {
    const out = outputs[0], cohOut = outputs[1] && outputs[1][0], L = out[0], R = out[1] || out[0], B = L.length, sr = this.sr, s = this.s;
    // settings (k-rate): any change → apply (live)
    let key = ''; for (const k of SET) { const v = params[k][0]; s[k] = v; key += v + ','; } if (key !== this.key) { this.key = key; this.apply(); }
    L.fill(0); if (R !== L) R.fill(0);
    const cm = params.couplingMod, fm = params.cutoffMod, sn = params.snap, shape = s.shape | 0, va = this.va, wt = this.wt, lfo = this.lfo;
    let lfoV = 0; for (let j = 0; j < B; j++) { const v = lfo.next(); if (j === 0) lfoV = v; }
    const K0 = Math.max(0, Math.min(1, s.coupling + s.lfoCouple * lfoV));
    let loud = null, loudA = 0;
    for (let q = 0; q < SLOTS; q++) {
      const sl = this.slots[q], tg = params['trig' + q], gt = params['gate' + q];
      const quiet = sl.amp.done && tg.length === 1 && tg[0] === sl.trig && gt.length === 1 && gt[0] < 0.5 && sl.gate < 0.5;
      if (quiet) { sl.snapSeen = sn[sn.length - 1]; continue; }   // a silent slot keeps up with Lock on beat (no snap when it starts)
      const pop = sl.pop, sub = s.sub;
      for (let j = 0; j < B; j++) {
        const t = tg.length > 1 ? tg[j] : tg[0], g = gt.length > 1 ? gt[j] : gt[0];
        if (t !== sl.trig) { sl.trig = t; this.start(sl, params['note' + q][0], params['vel' + q][0]); sl.amp.gate(true); sl.fenv.gate(true); sl.gate = 1; }
        else if (g < 0.5 && sl.gate >= 0.5) { sl.gate = 0; sl.amp.gate(false); sl.fenv.gate(false); }
        const sv = sn.length > 1 ? sn[j] : sn[0]; if (sv !== sl.snapSeen) { sl.snapSeen = sv; pop.snap(); }
        if ((j & 31) === 0) pop.set({ coupling: Math.max(0, Math.min(1, K0 + (cm.length > 1 ? cm[j] : cm[0]))) });
        pop.step(sl.f0, sr);
        const n = pop.n, norm = 1 / Math.sqrt(n); let l = 0, r = 0;
        for (let i = 0; i < n; i++) {
          const ph = pop.phase(i), dt = pop.dt(i), x = shape === 3 ? wt.sample(s.table, ph, dt) : shape === 0 ? va.saw(ph, dt) : shape === 1 ? va.pulse(ph, dt, 0.3) : va.tri(ph);
          l += x * sl.gL[i]; r += x * sl.gR[i];
        }
        const subDt = sl.f0 * 0.5 / sr; sl.sub += subDt; if (sl.sub >= 1) sl.sub -= 1; const sb = sub ? sub * va.square(sl.sub, subDt) * 0.7 : 0;
        sl.L[j] = l * norm + sb; sl.R[j] = r * norm + sb;
        const a = sl.amp.next(), fe = sl.fenv.next();   // cutoff below: Lock → tone moves it ±2 octaves by how locked the swarm is
        sl.A[j] = a * (0.25 + 0.75 * sl.vel);
        const c = s.cutoff * Math.pow(2, s.envAmt * fe * 5 + (fm.length > 1 ? fm[j] : fm[0]) / 1200 + s.cohTone * (pop.R - 0.5) * 4); sl.F[j] = c < 20 ? 20 : c > 20000 ? 20000 : c;
      }
      this.P.frequency = sl.F; sl.svf.process([sl.L, sl.R], [sl.L, sl.R], B, this.P);
      for (let j = 0; j < B; j++) { L[j] += sl.L[j] * sl.A[j]; if (R !== L) R[j] += sl.R[j] * sl.A[j]; }
      if (sl.amp.level > loudA) { loudA = sl.amp.level; loud = sl; }
    }
    this.mono.process(L, R, B);
    const g = s.level * 0.17; for (let j = 0; j < B; j++) { L[j] *= g; if (R !== L) R[j] *= g; }
    // coherence: the loudest note's swarm, smoothed (an audio-rate modulation signal, 0…1)
    const target = loud ? loud.pop.R : this.coh; this.coh += (target - this.coh) * 0.05;
    if (cohOut) cohOut.fill(this.coh);
    if ((this.post += B) >= 1600) { this.post = 0; const p = loud && loud.pop, ph = []; if (p) { const psi = p.psi / (2 * Math.PI); for (let i = 0; i < p.n; i++) ph.push(p.eff(i) - psi); }
      this.port.postMessage({ type: 'state', coh: this.coh, phases: ph, sounding: !!loud }); }
    return true;
  }
}
registerProcessor('eravos-swarm', EravosSwarm);`;
  const SRC = () => [`const VA = ${MP.VA}`, `const WT = ${MP.WT}`, `const POP = ${MP.POP}`, `const ADSR = ${MP.ADSR}`, `const LFO = ${MP.LFO}`, `const SVF = ${MP.SVF}`,
    `const MonoBelow = ${MP.MonoBelow}`, `const panL = ${MP.panL}`, `const panR = ${MP.panR}`, `const spread = ${MP.spread}`, PROC].join(';\n');
  let TABLES = null;   // the wavetable, built once on the main thread (never on the audio thread) and posted to every swarm
  const tables = () => { if (!TABLES) { const w = MP.WT(); w.build(MP.WT_RECIPES.basic); TABLES = w.tables(); } return TABLES; };
  const n = (key, label, group, def, min, max, step, unit, hint) => ({ key, type: 'number', default: def, min, max, step: step || 0.01, label, group, unit, hint });

  OrganismFactory.define({
    id: 'eravos.swarm-oscillator', domain: 'music', version: '1.0.0', label: 'Swarm Oscillator', icon: '🐝', accent: '#8a5cff', phase: 'P123',
    category: 'Genre instruments', blurb: 'Beyond supersaw: unison voices that pull on each other — drift apart, beat, lock into one wave. Coherence out moves any knob.',
    size: { w: 580, h: 660 }, minSize: { w: 460, h: 480 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.lead_voice'],
    needs: { works_with: ['eravos.timeline', 'eravos.lfo', 'eravos.retro-poly', 'eravos.fx-echo', 'eravos.chord-gen'] },
    hooks: [S.audio_out('so.hook.audio_out'), S.note_in('so.hook.note_in'), S.midi_in('so.hook.midi_in'), S.theory_in('so.hook.theory_in'), S.transport_in('so.hook.transport_in'),
      S.mod_in('so.hook.mod_coupling', 'coupling'), S.mod_in('so.hook.mod_cutoff', 'cutoff'), Object.assign(S.mod_out('so.hook.coherence', 'coherence'), { intent: 'how locked the swarm is, 0…1 — wire it to any knob' })],
    config: [
      { key: 'mode', type: 'enum', options: MODES, default: 'coupled', label: 'Mode', group: 'SWARM', hint: 'free: no pull · coupled: phases pull together · harmonic: they settle on a chord · chaotic: they push apart' },
      n('voices', 'Voices', 'SWARM', 9, 1, 32, 1, '', 'how many oscillators in each note’s swarm'),
      n('spread', 'Spread', 'SWARM', 0.35, 0, 1, 0.01, '', 'how far apart their own pitches are (±50 cents at 1)'),
      n('coupling', 'Coupling', 'SWARM', 0.45, 0, 1, 0.01, '', 'how hard they pull on each other: low = a loose supersaw, high = one locked wave'),
      n('pull', 'Pull', 'SWARM+', 0.5, 0, 1, 0.01, '', 'while coupled, how fast their own pitches come together'),
      n('drift', 'Drift', 'SWARM+', 0.25, 0, 1, 0.01, '', 'each voice’s own slow wander (up to ±15 cents)'),
      n('cluster', 'Cluster', 'SWARM', 0, 0, 1, 0.01, '', 'harmonic mode: how far toward 3rds, 5ths and octaves'),
      { key: 'sync', type: 'enum', options: Object.keys(SYNC), default: 'off', label: 'Lock on beat', group: 'SWARM', hint: 'snap every voice into phase on the grid (needs the transport playing)' },
      { key: 'shape', type: 'enum', options: SHAPES, default: 'saw', label: 'Shape', group: 'OSC' },
      n('table', 'Table', 'OSC+', 0, 0, 1, 0.01, '', 'table shape: sine → triangle → saw → square → pulse → formant'),
      n('sub', 'Sub', 'OSC+', 0.2, 0, 1), n('octave', 'Octave', 'OSC+', 0, -3, 3, 1),
      n('cutoff', 'Cutoff', 'TONE', 6000, 40, 18000, 1, 'Hz'), n('res', 'Res', 'TONE', 0.2, 0, 1), n('envAmt', 'Env amt', 'FILTER+', 0.4, 0, 1),
      n('attack', 'Attack', 'TONE', 0.01, 0.001, 10, 0.001, 's'), n('decay', 'Decay', 'AMP+', 0.4, 0.01, 4, 0.01, 's'), n('sustain', 'Sustain', 'AMP+', 0.8, 0, 1),
      n('release', 'Release', 'TONE', 0.6, 0.01, 12, 0.01, 's'),
      n('lfoRate', 'LFO rate', 'MOVE', 0.3, 0.01, 20, 0.01, 'Hz'), n('lfoCouple', 'LFO→Pull', 'MOVE', 0, -1, 1, 0.01, '', 'the LFO moves Coupling'),
      // 1.1 (N2, 2026-11-06: "The swarm doesn't seem like anything new sound wise") — all off by default: the presets keep their sound
      n('restless', 'Restless', 'LIFE', 0, 0, 1, 0.01, '', 'once locked, the swarm bursts apart and is drawn back in — a breathing cycle, faster when higher'),
      n('form', 'Form glide', 'LIFE', 0, 0, 4, 0.01, 's', 'harmonic mode: each note blooms from one pitch into its chord, and a new Cluster is reached this slowly'),
      n('fieldFm', 'Field FM', 'LIFE', 0, 0, 1, 0.01, '', 'the swarm’s own sum bends every voice — locked it brightens, apart it growls'),
      n('cohTone', 'Lock → tone', 'LIFE', 0, -1, 1, 0.01, '', 'how locked the swarm is opens (+) or closes (−) the filter, up to 2 octaves'),
      n('width', 'Width', 'OUT', 0.8, 0, 1), n('monoBelow', 'Mono <', 'OUT+', 120, 20, 400, 1, 'Hz'), n('level', 'Level', 'OUT', 0.7, 0, 1),
    ],
    // presets are data beside the tool (packs/factory/pack.json) — never in the engine (his rule, 2026-11-06: no packs hard-wired in)
    defaultPreset: 'Locked Unison',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const out = ac.createGain(), coh = ac.createGain(); ctx.track(out); ctx.track(coh);
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'swarm' });
      ctx.port('coherence', { kind: 'mod', direction: 'out', node: coh, label: 'coherence' });
      const cMod = ctx.modBus('coupling', { min: -1, max: 1 }), fMod = ctx.modBus('cutoff', { min: -4800, max: 4800 });
      let node = null, last = { coh: 0, phases: [], sounding: false }, trig = 0, snapN = 0; const ids = new Map(), queue = [];
      const slots = Array.from({ length: SLOTS }, () => ({ id: 0, from: 0, until: 0 }));
      const value = (k) => k === 'mode' ? MODES.indexOf(P.get('mode')) : k === 'shape' ? SHAPES.indexOf(P.get('shape')) : P.get(k);
      const values = () => { const v = {}; SET.forEach(k => { v[k] = value(k); }); return v; };
      const prm = (k) => node.parameters.get(k);
      // every setting is an AudioParam: a change lands at the next block, sample-true, live and offline alike
      const setAll = (t) => SET.forEach(k => prm(k).setValueAtTime(value(k), t === undefined ? ac.currentTime : t));
      const ready = ctx.loadWorklet('eravos-swarm', SRC()).then(() => {
        if (ctx.disposed) return null;
        node = new AudioWorkletNode(ac, 'eravos-swarm', { numberOfInputs: 0, numberOfOutputs: 2, outputChannelCount: [2, 1], processorOptions: { tables: tables(), values: values() } }); ctx.track(node);
        node.onprocessorerror = (e) => ctx.fault('RUNTIME_003', 'swarm worklet stopped: ' + ((e && e.message) || 'processor error'));
        node.connect(out, 0); node.connect(coh, 1); cMod.connect(prm('couplingMod')); fMod.connect(prm('cutoffMod'));
        node.port.onmessage = (e) => { if (e.data && e.data.type === 'state') { last = e.data; ctx.emitUI('swarm', e.data); } };
        setAll(0); queue.splice(0).forEach(f => f()); return node;
      }).catch(e => { ctx.fault('RUNTIME_003', 'swarm worklet: ' + e.message); return null; });
      const when = (f) => { if (node) f(); else queue.push(f); };
      SET.forEach(k => P.onChange(k, () => when(() => prm(k).setValueAtTime(value(k), ac.currentTime))));
      // a note takes a slot: a free one, else the one that started longest ago
      function on(note, vel, t, dur) {
        const at = Math.max(t || ac.currentTime, ac.currentTime), id = ++trig, rel = P.get('release') * 1.7 + 0.05;
        let sl = slots.find(x => x.until <= at) || slots.reduce((a, b) => (a.from < b.from ? a : b)); const i = slots.indexOf(sl);
        sl.id = id; sl.from = at; sl.until = dur === undefined ? Infinity : at + dur + rel;
        when(() => { prm('note' + i).setValueAtTime(note, at); prm('vel' + i).setValueAtTime(vel === undefined ? 0.8 : vel, at); prm('trig' + i).setValueAtTime(id, at); prm('gate' + i).setValueAtTime(1, at);
          if (dur !== undefined) prm('gate' + i).setValueAtTime(0, at + Math.max(0.005, dur)); });
        return id;
      }
      function off(id, t) { const i = slots.findIndex(x => x.id === id); if (i < 0) return; const at = Math.max(t || ac.currentTime, ac.currentTime); slots[i].until = at + P.get('release') * 1.7 + 0.05;
        when(() => prm('gate' + i).setValueAtTime(0, at)); }
      ctx.onNote((p) => on(p.note, p.velocity, p.time, p.duration));
      ctx.onMidi((p) => { if (p.on) ids.set(p.note, on(p.note, p.velocity)); else if (ids.has(p.note)) { off(ids.get(p.note)); ids.delete(p.note); } });
      ctx.audition = (p) => { const k = p.note || 60; if (ids.has(k)) off(ids.get(k)); ids.set(k, on(k, p.velocity || 0.8, ac.currentTime, p.duration > 10 ? undefined : p.duration)); };
      ctx.auditionOff = (p) => { const k = p.note || 60; if (ids.has(k)) { off(ids.get(k)); ids.delete(k); } };
      // Lock on beat: each division of the transport snaps every voice to the swarm's mean phase (a count, sample-true)
      ctx.onTick((tk) => { const d = SYNC[P.get('sync')]; if (d && tk.step16 % d === 0) { const n = ++snapN; when(() => prm('snap').setValueAtTime(n, tk.time)); } });
      ctx.allNotesOff = () => { ids.clear(); slots.forEach(x => { x.until = 0; }); if (node) { node.port.postMessage({ type: 'panic' }); for (let i = 0; i < SLOTS; i++) { const g = prm('gate' + i); g.cancelScheduledValues(ac.currentTime); g.setValueAtTime(0, ac.currentTime); } } };
      ctx.onDispose(() => { if (node) { node.port.postMessage({ type: 'panic' }); node.port.onmessage = null; } });
      ctx.internals = { ready, node: () => node, state: () => last, on, off, values };
      return {};
    },
  });
})();
