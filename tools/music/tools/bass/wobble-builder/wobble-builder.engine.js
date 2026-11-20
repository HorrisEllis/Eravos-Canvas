/* ERAVOS tool — Wobble Builder 1.0.0 (tools/music/planned/wobble-builder.spec; WB1–WB3, 2026-11-20). His words: "I want to make like a wobble
 * synthsize tool." → "A wobble builder" → (the preview) "yes build it."
 * A wobble as a chain of SLOTS, each filled by a shared component (SOURCE osc-va · DRIVE · MOUTH · WOBBLE lfo → the mouth's detune · FX · SUB · OUT);
 * swap any slot on the spot, mutate / keep / throw (FieldMutate, the one every tool uses), ◆ SYNTHESIZE INTO A TOOL (a real tool of its own).
 * ONE engine, nothing re-implemented: the settings make a DAG (Model.dag), the DAG is assembled from the components' own kernels
 * (tools/core/compat/assemble.js + tools/music/compat/adapters.js) and runs in ONE AudioWorklet built from their text — the same code renders
 * offline (tests, the novelty gate) and live (what you hear). A knob reaches the sound in place (an adapter's set(): the kernel keeps its state,
 * no click); a slot swap builds the new chain and cross-fades to it (256 samples).
 *   window.WobbleBuilder → { SET, DIVS, BEATS, defaults(), dag(settings, bpm), shape(dag), Voice, source(MP), PARTS,
 *     made(), make(name, settings, bpm, MusicNovelty), judge(…), defineMade(rec), forget(id) }   (the model and Voice also require()-able) */
(function (root) {
  'use strict';
  // ---------------------------------------------------------------- the model: settings (data) → the DAG. The UI, the mutation and the engine read this one list.
  const DIVS = ['1/1', '1/2', '1/4', '1/4t', '1/8', '1/8t', '1/16', '1/16t', '1/32'];
  const BEATS = { '1/1': 4, '1/2': 2, '1/4': 1, '1/4t': 2 / 3, '1/8': 0.5, '1/8t': 1 / 3, '1/16': 0.25, '1/16t': 1 / 6, '1/32': 0.125, '1/8.': 0.75 };
  const LFO_SHAPES = ['sine', 'triangle', 'saw up', 'saw down', 'square', 'sample & hold', 'smooth random'];
  const n = (key, label, group, min, max, step, def, o) => Object.assign({ key, label, group, type: 'number', min, max, step, default: def }, o || {});
  const e = (key, label, group, options, def, o) => Object.assign({ key, label, group, type: 'enum', options, default: def }, o || {});
  const SET = [
    e('rate', 'Rate', 'WOBBLE', DIVS, '1/8', { hint: 'the wobble on the beat' }), e('lfoShape', 'Shape', 'WOBBLE', LFO_SHAPES, 'sine'),
    n('depth', 'Depth', 'WOBBLE', 0, 5, 0.05, 2.5, { unit: 'oct', hint: 'how many octaves the wobble opens the mouth' }),
    n('cutoff', 'Cutoff', 'MOUTH', 40, 3000, 1, 220, { unit: 'Hz', hint: 'where the mouth rests; the wobble opens it from here' }), n('reso', 'Reso', 'MOUTH', 0, 0.95, 0.01, 0.55),
    e('wave', 'Wave', 'VOICE', ['saw', 'pulse', 'square', 'triangle'], 'saw'), n('pw', 'Width', 'VOICE', 0.05, 0.95, 0.01, 0.5, { hint: 'the pulse width' }),
    n('sub', 'Sub', 'VOICE', 0, 1, 0.01, 0.55, { hint: 'a clean sine under it all: never through the drive or the mouth' }), e('subOct', 'Sub octave', 'VOICE', [-1, -2], -1),
    n('glide', 'Glide', 'VOICE', 0, 0.5, 0.001, 0.02, { unit: 's' }), n('octave', 'Octave', 'VOICE', -2, 1, 1, -1, { mutate: false }),
    n('width', 'Width', 'OUT', 0, 1, 0.01, 0.8, { hint: 'stereo width above 120 Hz' }), n('level', 'Level', 'OUT', 0, 1.2, 0.01, 0.8, { mutate: false }),
    e('drive', 'Drive part', 'PARTS', ['none', 'saturator-tube', 'saturator-tape', 'bitcrusher'], 'saturator-tube', { socket: 'drive', near: 'drive', hint: 'before the mouth: gives the wobble something to bite' }),
    e('mouth', 'Mouth part', 'PARTS', ['filter-svf', 'filter-ladder'], 'filter-svf', { socket: 'mouth', near: 'cutoff', hint: 'the filter the wobble moves' }),
    e('fx', 'FX part', 'PARTS', ['none', 'delay-line', 'saturator-tape', 'bitcrusher'], 'none', { socket: 'fx', near: 'fx', hint: 'after the mouth' }),
    n('dTubeDrive', 'Drive', 'DRIVE', 0, 20, 0.5, 8, { unit: 'dB', part: 'saturator-tube', of: 'drive', v: 'drive' }), n('dTubeBias', 'Bias', 'DRIVE', 0, 1, 0.01, 0.3, { part: 'saturator-tube', of: 'drive', v: 'bias' }),
    n('dTubeTone', 'Tone', 'DRIVE', -1, 1, 0.01, 0, { part: 'saturator-tube', of: 'drive', v: 'tone' }),
    n('dTapeDrive', 'Drive', 'DRIVE', 0, 20, 0.5, 8, { unit: 'dB', part: 'saturator-tape', of: 'drive', v: 'drive' }), n('dTapeBump', 'Bump', 'DRIVE', 0, 6, 0.1, 2, { unit: 'dB', part: 'saturator-tape', of: 'drive', v: 'bump' }),
    n('dTapeHf', 'Top', 'DRIVE', 3000, 20000, 10, 12000, { unit: 'Hz', part: 'saturator-tape', of: 'drive', v: 'hf' }),
    n('dCrushBits', 'Bits', 'DRIVE', 3, 16, 1, 8, { part: 'bitcrusher', of: 'drive', v: 'bits' }), n('dCrushRate', 'Rate', 'DRIVE', 2000, 40000, 10, 12000, { unit: 'Hz', part: 'bitcrusher', of: 'drive', v: 'rate' }),
    e('mSvfMode', 'Mode', 'MOUTH', ['lowpass', 'bandpass', 'notch', 'peak'], 'lowpass', { part: 'filter-svf', of: 'mouth', v: 'mode' }), n('mSvfStages', 'Poles ×2', 'MOUTH', 1, 3, 1, 2, { part: 'filter-svf', of: 'mouth', v: 'stages' }),
    e('mLadMode', 'Tap', 'MOUTH', ['lowpass 24', 'lowpass 12', 'bandpass 12', 'highpass 12', 'highpass 24'], 'lowpass 24', { part: 'filter-ladder', of: 'mouth', v: 'mode' }),
    n('mLadDrive', 'Ladder drive', 'MOUTH', 0, 18, 0.5, 6, { unit: 'dB', part: 'filter-ladder', of: 'mouth', v: 'drive' }), n('mLadBass', 'Bass', 'MOUTH', 0, 1, 0.01, 0.5, { part: 'filter-ladder', of: 'mouth', v: 'bass' }),
    e('fDelTime', 'Echo time', 'FX', ['1/16', '1/8', '1/8.', '1/4'], '1/8.', { part: 'delay-line', of: 'fx' }), n('fDelFb', 'Feedback', 'FX', 0, 0.8, 0.01, 0.35, { part: 'delay-line', of: 'fx', v: 'feedback' }),
    n('fDelMix', 'Echo mix', 'FX', 0, 0.5, 0.01, 0.25, { part: 'delay-line', of: 'fx', v: 'mix' }),
    n('fTapeDrive', 'Tape drive', 'FX', 0, 12, 0.5, 4, { unit: 'dB', part: 'saturator-tape', of: 'fx', v: 'drive' }), n('fTapeHf', 'Tape top', 'FX', 3000, 16000, 10, 9000, { unit: 'Hz', part: 'saturator-tape', of: 'fx', v: 'hf' }),
    n('fCrushBits', 'Crush bits', 'FX', 4, 16, 1, 10, { part: 'bitcrusher', of: 'fx', v: 'bits' }), n('fCrushRate', 'Crush rate', 'FX', 4000, 40000, 10, 16000, { unit: 'Hz', part: 'bitcrusher', of: 'fx', v: 'rate' }),
  ];
  const K = {}; SET.forEach(c => { K[c.key] = c; });
  const defaults = () => { const o = {}; SET.forEach(c => { o[c.key] = c.default; }); return o; };
  const lfoHz = (s, bpm) => 1 / (BEATS[s.rate] * 60 / (bpm || 120));
  function dag(s, bpm) {   // the settings → the chain (what SYNTHESIZE writes, what the engine plays)
    bpm = bpm || 120;
    const vars = (part, of) => { const o = {}; SET.filter(c => c.part === part && c.of === of && c.v).forEach(c => { o[c.v] = s[c.key]; }); return o; };
    const nodes = [{ id: 'osc', component: 'osc-va', vars: { shape: s.wave, width: s.pw } }, { id: 'sub', component: 'osc-sub', vars: { octave: s.subOct, shape: 'sine' } },
      { id: 'lfo', component: 'lfo', vars: { rate: lfoHz(s, bpm), shape: s.lfoShape } }], edges = [];
    let last = 'osc.out';
    if (s.drive !== 'none') { const v = vars(s.drive, 'drive'); if (s.drive !== 'bitcrusher') v.out = -Math.min(12, (v.drive || 0) * 0.5 + 3); else v.aa = true;   // a saturator trimmed as its drive comes in
      nodes.push({ id: 'drv', component: s.drive, vars: v }); edges.push({ from: last, to: 'drv.in' }); last = 'drv.out'; }
    nodes.push({ id: 'flt', component: s.mouth, vars: Object.assign({ frequency: s.cutoff, resonance: s.reso }, vars(s.mouth, 'mouth')) });
    edges.push({ from: last, to: 'flt.in' }, { from: 'lfo.out', to: 'flt.detune', amount: s.depth * 1200 }); last = 'flt.out';
    if (s.fx !== 'none') { const v = vars(s.fx, 'fx'); if (s.fx === 'delay-line') Object.assign(v, { time: BEATS[s.fDelTime] * 60 / bpm, sync: 0, damp: 5000, lowcut: 120 });
      if (s.fx === 'saturator-tape') v.out = -Math.min(9, (v.drive || 0) * 0.5); if (s.fx === 'bitcrusher') v.aa = true;
      nodes.push({ id: 'fx', component: s.fx, vars: v }); edges.push({ from: last, to: 'fx.in' }); last = 'fx.out'; }
    nodes.push({ id: 'st', component: 'stereo-tools', vars: { width: s.width, hz: 120 } }); edges.push({ from: last, to: 'st.in', amount: 0.7 }, { from: 'sub.out', to: 'st.in', amount: s.sub * 0.6 });
    return { nodes, edges, outs: ['st.out'] };
  }
  const shape = (d) => d.nodes.map(x => x.id + ':' + x.component).join(',') + '|' + d.edges.map(x => x.from + '>' + x.to).join(',');   // same shape = a knob, not a swap

  // ---------------------------------------------------------------- the voice: ONE function, offline (tests, the novelty gate) and in the worklet
  // mono, last note wins; hz and gate per sample (a-rate AudioParams live); the gate's envelope and the level after the chain (4 ms up, 50 ms down)
  function Voice(A, MA, MP, contracts, sr) {
    const dom = MA(MP), B = 128; let eng = null, old = null, xf = 0, hz = 0, env = 0, wasGate = 0;
    const XF = 256, up = 1 / (0.004 * sr), dn = 1 / (0.05 * sr), oL = new Float32Array(B), oR = new Float32Array(B);
    function load(d) { const e = A.assemble(JSON.parse(JSON.stringify(d)), contracts, dom, { sr, block: B }); if (!e.ok) return e.why; if (eng) { old = eng; xf = 0; } eng = e; return null; }
    function process(L, R, n, hzA, gateA, level, glide) {   // n ≤ 128
      if (!eng) { L.fill(0, 0, n); R.fill(0, 0, n); return; }
      const k = glide > 0 ? 1 - Math.exp(-1 / (glide * sr)) : 1;
      for (let j = 0; j < n; j++) { const t = hzA.length > 1 ? hzA[j] : hzA[0], g = gateA.length > 1 ? gateA[j] : gateA[0];
        if (!hz || (g >= 0.5 && !wasGate && glide <= 0)) hz = t; else hz += (t - hz) * k; wasGate = g >= 0.5 ? 1 : 0;
        eng.hz[j] = hz; eng.gate[j] = g; if (old) { old.hz[j] = hz; old.gate[j] = g; } }
      const out = eng.block(n), o2 = old ? old.block(n) : null;
      if (o2) for (let j = 0; j < n; j++) { oL[j] = o2[0][j]; oR[j] = o2[Math.min(1, o2.length - 1)][j]; }
      for (let j = 0; j < n; j++) {
        const g = eng.gate[j] >= 0.5; env = g ? Math.min(1, env + up) : Math.max(0, env - dn);
        let a = out[0][j], b = out[Math.min(1, out.length - 1)][j];
        if (o2) { const w = Math.min(1, (xf + j) / XF); a = a * w + oL[j] * (1 - w); b = b * w + oR[j] * (1 - w); }
        const v = env * level; L[j] = isFinite(a) ? a * v : 0; R[j] = isFinite(b) ? b * v : 0;
      }
      if (o2) { xf += n; if (xf >= XF) old = null; }
    }
    function render(d, notes, secs, level, glide) {   // offline: the same process(), notes as hz / gate per sample
      const why = load(d); if (why) return { ok: false, why };
      const N = Math.round(secs * sr), L = new Float32Array(N), R = new Float32Array(N), hA = new Float32Array(B), gA = new Float32Array(B), bl = new Float32Array(B), br = new Float32Array(B);
      for (let s0 = 0; s0 < N; s0 += B) { const m = Math.min(B, N - s0);
        for (let j = 0; j < m; j++) { const t = (s0 + j) / sr; let h = 0, g = 0; for (const x of notes) if (t >= x.t && t < x.t + x.dur) { h = x.hz; g = 1; } else if (!g && t >= x.t) h = x.hz; hA[j] = h || notes[0].hz; gA[j] = g; }
        process(bl, br, m, hA.subarray(0, m), gA.subarray(0, m), level, glide || 0); L.set(bl.subarray(0, m), s0); R.set(br.subarray(0, m), s0); }
      return { ok: true, L, R, sr };
    }
    return { load, process, render, set: (id, v) => eng && eng.set(id, v), amount: (i, v) => eng && eng.amount(i, v), get engine() { return eng; } };
  }
  // the parts the worklet needs: the kernels and their param lists, as text (each is self-contained: stringified, as every worklet tool does)
  // (named one by one, so the components map and the tool's DAG see which components it stands on)
  const kernels = (MP) => ({ SVF: MP.SVF, SVF_PARAMS: MP.SVF_PARAMS, Ladder: MP.Ladder, LADDER_PARAMS: MP.LADDER_PARAMS, TapeSat: MP.TapeSat, TAPESAT_PARAMS: MP.TAPESAT_PARAMS,
    TubeSat: MP.TubeSat, TUBESAT_PARAMS: MP.TUBESAT_PARAMS, Crusher: MP.Crusher, CRUSHER_PARAMS: MP.CRUSHER_PARAMS, Delay: MP.Delay, DELAY_PARAMS: MP.DELAY_PARAMS,
    VA: MP.VA, Sub: MP.Sub, ADSR: MP.ADSR, MonoBelow: MP.MonoBelow, LFO: MP.LFO });
  const PARTS = Object.keys(kernels({}));
  function source(MP, Assemble, MusicAdapters) {
    const K = kernels(MP), mp = PARTS.filter(k => K[k] !== undefined).map(k => `MP.${k} = ${typeof K[k] === 'function' ? K[k].toString() : JSON.stringify(K[k])};`).join('\n');
    return ['const MP = {};', mp, Assemble.SRC, MusicAdapters.SRC, `const Voice = ${Voice.toString()};`, `
class EravosWobbleBuilder extends AudioWorkletProcessor {
  static get parameterDescriptors() { return [{ name: 'hz', defaultValue: 55, minValue: 1, maxValue: 20000, automationRate: 'a-rate' }, { name: 'gate', defaultValue: 0, minValue: 0, maxValue: 1, automationRate: 'a-rate' },
    { name: 'level', defaultValue: 0.8, minValue: 0, maxValue: 2, automationRate: 'k-rate' }, { name: 'glide', defaultValue: 0, minValue: 0, maxValue: 2, automationRate: 'k-rate' }]; }
  constructor(o) { super(); const p = o.processorOptions; this.v = Voice(globalThis.Assemble, globalThis.MusicAdapters, MP, p.contracts, sampleRate); const why = this.v.load(p.dag); if (why) this.port.postMessage({ type: 'fault', why });
    this.port.onmessage = (m) => { const d = m.data; if (!d) return;
      if (d.type === 'dag') { const w = this.v.load(d.dag); if (w) this.port.postMessage({ type: 'fault', why: w }); }
      else if (d.type === 'vars') { d.list.forEach(x => { if (!this.v.set(x.id, x.vars)) this.port.postMessage({ type: 'rebuild' }); }); }
      else if (d.type === 'amount') d.list.forEach(x => this.v.amount(x.i, x.v)); }; }
  process(ins, outs, p) { const o = outs[0]; if (!o || !o.length) return true; this.v.process(o[0], o[1] || o[0], o[0].length, p.hz, p.gate, p.level[0], p.glide[0]); return true; }
}
registerProcessor('eravos-wobble-builder', EravosWobbleBuilder);`].join('\n');
  }
  // what a tool made by the builder carries (WB3): its settings and its DAG, saved; it runs on this same engine
  const MADE_KEY = 'wobble-builder';
  const Model = { SET, K, DIVS, BEATS, LFO_SHAPES, defaults, dag, shape, lfoHz, Voice, PARTS, source, MADE_KEY, version: '1.0.0' };
  if (typeof module === 'object' && module.exports) module.exports = Model;
  if (!root) return;
  root.WobbleBuilder = Model;

  // ---------------------------------------------------------------- the tool (and every tool it makes: the same engine, its settings as defaults)
  const S = root.OrganismSDK && root.OrganismSDK.STD;
  function descriptor(o) {
    o = o || {};
    return {
      id: o.id || 'eravos.wobble-builder', domain: 'music', version: o.version || '1.0.0', label: o.label || 'Wobble Builder', icon: o.icon || '🧪', accent: o.accent || '#ffcc00', phase: 'P202',
      category: 'Bass', blurb: o.blurb || 'Build a wobble from shared parts: pick each slot, wire the wobble into the mouth, mutate, keep or throw — then synthesize it into a tool of its own.',
      size: o.made ? { w: 760, h: 760 } : { w: 980, h: 900 }, minSize: { w: 560, h: 560 },
      permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'], provides: ['capability.audio_out', 'capability.note_in', 'capability.bass_voice'],
      needs: { works_with: ['eravos.timeline', 'eravos.bass-gen', 'eravos.wobble-bass', 'eravos.fx-echo'] },
      hooks: [S.audio_out('wb.hook.audio_out'), S.note_in('wb.hook.note_in'), S.midi_in('wb.hook.midi_in'), S.transport_in('wb.hook.transport_in')],
      config: SET.map(c => Object.assign({}, c, o.settings && o.settings[c.key] !== undefined ? { default: o.settings[c.key] } : {})),
      made: o.made || null,
      engine,
    };
  }
  function engine(ctx) {
    const ac = ctx.ac, P = ctx.params, MP = root.MusicParts, C = root.MusicContracts;
    const out = ac.createGain(); ctx.track(out); ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'wobble' });
    const settings = () => { const o = {}; SET.forEach(c => { o[c.key] = P.get(c.key); }); return o; };
    let node = null, cur = dag(settings(), ctx.bpm); const queue = [];
    const prm = (k) => node.parameters.get(k);
    const ready = ctx.loadWorklet('eravos-wobble-builder', source(MP, root.Assemble, root.MusicAdapters)).then(() => {
      if (ctx.disposed) return null;
      node = new AudioWorkletNode(ac, 'eravos-wobble-builder', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { dag: cur, contracts: C.contracts } }); ctx.track(node);
      node.onprocessorerror = (er) => ctx.fault('RUNTIME_003', 'wobble builder worklet stopped: ' + ((er && er.message) || 'processor error'));
      node.port.onmessage = (m) => { const d = m.data || {};  if (d.type === 'fault') ctx.fault('RUNTIME_003', 'wobble builder: ' + d.why.join('; ')); if (d.type === 'rebuild') node.port.postMessage({ type: 'dag', dag: cur }); };
      node.connect(out); prm('level').setValueAtTime(P.get('level'), 0); prm('glide').setValueAtTime(P.get('glide'), 0);
      queue.splice(0).forEach(f => f()); return node;
    }).catch(er => { ctx.fault('RUNTIME_003', 'wobble builder worklet: ' + er.message); return null; });
    const when = (f) => { if (node) f(); else queue.push(f); };
    // a change: the same shape → each part's new settings in place, each edge's new amount; another shape (a slot swapped) → the new chain, cross-faded
    function update() {
      const next = dag(settings(), ctx.bpm), prev = cur; cur = next;
      when(() => {
        if (shape(next) !== shape(prev)) { node.port.postMessage({ type: 'dag', dag: next }); return; }
        const vars = next.nodes.filter((x, i) => JSON.stringify(x.vars) !== JSON.stringify(prev.nodes[i].vars)).map(x => ({ id: x.id, vars: x.vars }));
        const amts = next.edges.map((x, i) => ({ i, v: x.amount })).filter((x, i) => x.v !== prev.edges[i].amount);
        if (vars.length) node.port.postMessage({ type: 'vars', list: vars }); if (amts.length) node.port.postMessage({ type: 'amount', list: amts });
      });
    }
    P.onChange('*', (v, was, k) => { if (k === 'level') return when(() => prm('level').setValueAtTime(v, ac.currentTime)); if (k === 'glide') return when(() => prm('glide').setValueAtTime(v, ac.currentTime)); if (K[k]) update(); });
    let bpmWas = ctx.bpm; ctx.onTick(() => { if (ctx.bpm !== bpmWas) { bpmWas = ctx.bpm; update(); } });   // the wobble and the echo stay on the beat
    // notes: mono, last note wins; each new note restarts the wobble (the gate falls for one sample) unless it glides
    const held = [], hzOf = (m) => 440 * Math.pow(2, (m + 12 * P.get('octave') - 69) / 12);
    function on(note, t) { when(() => { const at = Math.max(t || 0, ac.currentTime); prm('hz').setValueAtTime(hzOf(note), at);
      if (P.get('glide') > 0 && held.length > 1) prm('gate').setValueAtTime(1, at); else { prm('gate').setValueAtTime(0, at); prm('gate').setValueAtTime(1, at + 2 / ac.sampleRate); } }); }
    function off(t) { when(() => prm('gate').setValueAtTime(0, Math.max(t || 0, ac.currentTime))); }
    function noteOn(note, vel, t, dur) { held.push(note); on(note, t); if (dur !== undefined) { const end = Math.max(t || ac.currentTime, ac.currentTime) + Math.max(0.01, dur); setTimeout(() => { const i = held.lastIndexOf(note); if (i >= 0) held.splice(i, 1); }, Math.max(0, (end - ac.currentTime) * 1000)); off(end); } }
    function noteOff(note, t) { const i = held.lastIndexOf(note); if (i >= 0) held.splice(i, 1); if (held.length) on(held[held.length - 1], t); else off(t); }
    ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration));
    ctx.onMidi((p) => p.on ? noteOn(p.note, p.velocity) : noteOff(p.note));
    ctx.audition = (p) => { const k = p.note || 45; if (p.duration !== undefined && p.duration < 30) return noteOn(k, p.velocity || 0.9, ac.currentTime, p.duration); noteOn(k, p.velocity || 0.9); };
    ctx.auditionOff = (p) => noteOff(p.note || 45);
    ctx.allNotesOff = () => { held.length = 0; off(); };
    ctx.onDispose(() => { if (node) node.port.onmessage = null; });
    ctx.internals = { ready, node: () => node, dag: () => cur, settings, noteOn, noteOff };
    return {};
  }
  Model.descriptor = descriptor;
  if (root.OrganismFactory) root.OrganismFactory.define(descriptor({ id: 'eravos.wobble-builder' }));

  // ---------------------------------------------------------------- WB3: SYNTHESIZE — a made tool is real: its own id, name, settings (its defaults and its
  // first preset), the DAG it was made as; it runs on this same engine (nothing copied), opens, plays, explodes and mutates like any tool.
  // Kept in this ERAVOS (tools/music/data/made-tools.js: its own storage, across restarts and updates); defined again at every start.
  const ld = () => root.MadeTools ? root.MadeTools.list(MADE_KEY) : [];   // kept by the domain's data (tools/music/data/made-tools.js): a tool keeps no storage
  const keep = (L) => { if (root.MadeTools) root.MadeTools.save(MADE_KEY, L); };
  const slug = (name) => String(name || 'made').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'made';
  Model.made = ld;
  Model.idFor = (name) => 'eravos.wb-' + slug(name);
  Model.defineMade = function (r) {   // → the made tool's id, defined (and its window, once the builder's UI is here)
    const F = root.OrganismFactory; if (!F) return null;
    if (!F.def || !F.def(r.id)) F.define(descriptor({ id: r.id, label: r.name, icon: '🧪', accent: r.accent || '#ffcc00', settings: r.settings, version: '1.0.0',
      blurb: 'Made with the Wobble Builder (' + String(r.at || '').slice(0, 10) + '): ' + r.chain + '. ' + (r.verdict === 'novel' ? 'New to ERAVOS.' : 'Close to ' + r.near + '.'), made: { from: 'eravos.wobble-builder', at: r.at, dag: r.dag, verdict: r.verdict, near: r.near, d: r.d } }));
    if (Model.ui) F.reg(r.id, Model.ui); return r.id;
  };
  Model.forget = (id) => keep(ld().filter(r => r.id !== id));
  Model.chainOf = (d) => d.nodes.filter(x => !['lfo', 'sub', 'st'].includes(x.id)).map(x => x.component).join(' → ') + ' · wobble into ' + (d.nodes.find(x => x.id === 'flt') || {}).component;
  // the gates every made tool passes (D5, D6): it plays (finite, not silent, never pinned), and it is not a twin of anything in ERAVOS or made before
  const RIFF = (bpm) => { const b = 60 / bpm; return [33, 33, 36, 31].map((m, i) => ({ t: 0.03 + i * 2 * b, dur: 2 * b - 0.06, hz: 440 * Math.pow(2, (m - 69) / 12) })); };
  Model.judge = function (settings, bpm, N) {   // N: window.MusicNovelty (tools/music/compat/novelty.js)
    const sr = 48000, notes = RIFF(bpm), secs = notes[3].t + notes[3].dur + 0.2, d = dag(settings, bpm);
    const r = Voice(root.Assemble, root.MusicAdapters, root.MusicParts, root.MusicContracts.contracts, sr).render(d, notes, secs, settings.level, settings.glide);
    if (!r.ok) return { ok: false, why: 'it does not build: ' + r.why.join('; ') };
    let bad = 0, pinned = 0, q = 0; const mono = new Float32Array(r.L.length);
    for (let i = 0; i < r.L.length; i++) { const a = r.L[i], b = r.R[i]; if (!isFinite(a) || !isFinite(b)) bad++; if (Math.max(Math.abs(a), Math.abs(b)) >= 0.999) pinned++; q += 0.5 * (a * a + b * b); mono[i] = 0.5 * (a + b); }
    const rmsDb = 20 * Math.log10(Math.sqrt(q / r.L.length) + 1e-12);
    if (bad) return { ok: false, why: bad + ' samples are not numbers' }; if (rmsDb < -50) return { ok: false, why: 'it is silent (' + rmsDb.toFixed(1) + ' dB)' };
    if (pinned / r.L.length > 0.005) return { ok: false, why: 'it sits at full scale ' + (100 * pinned / r.L.length).toFixed(1) + ' % of the time (turn the level or the drive down)' };
    const fp = N.measure.fingerprint(mono, sr, 0.1, secs - 0.1); if (!fp || fp.frames < 4) return { ok: false, why: 'too short to fingerprint' };
    const B = N.baseline, C = N.core, dist = C.makeDist(C.groupsFor(B.D)), me = (v) => ({ v, n: C.norm(v, B.lo, B.hi) }), mine = me(fp.v);
    let best = { d: 9, what: '' };
    B.items.forEach(x => { const dd = dist(mine, me(x.v)); if (dd < best.d) best = { d: dd, what: x.label + ' · ' + x.preset }; });
    ld().forEach(t => { if (!t.fp) return; const dd = dist(mine, me(t.fp)); if (dd < best.d) best = { d: dd, what: 'your ' + t.name }; });
    const verdict = best.d < B.twin ? 'TWIN' : best.d < B.close ? 'CLOSE' : 'novel';
    return { ok: verdict !== 'TWIN', why: verdict === 'TWIN' ? 'this is ' + best.what + ' again (' + best.d.toFixed(3) + ') — change something that can be heard' : '', verdict, near: best.what, d: +best.d.toFixed(3), fp: fp.v.map(x => +x.toPrecision(5)), dag: d, rmsDb };
  };
  Model.make = function (name, settings, bpm, N) {   // → { ok, id, rec } or { ok: false, why }
    const j = Model.judge(settings, bpm, N); if (!j.ok) return j;
    const L = ld(); let nm = String(name || 'Made Wobble').trim() || 'Made Wobble', i = 2; const base = nm; while (L.some(r => r.name === nm) || (root.OrganismFactory && root.OrganismFactory.def(Model.idFor(nm)))) nm = base + ' ' + i++;
    const rec = { id: Model.idFor(nm), name: nm, at: new Date().toISOString(), settings: JSON.parse(JSON.stringify(settings)), bpm, dag: j.dag, chain: Model.chainOf(j.dag), fp: j.fp, verdict: j.verdict, near: j.near, d: j.d };
    L.unshift(rec); keep(L); Model.defineMade(rec); return { ok: true, id: rec.id, rec, verdict: j.verdict, near: j.near, d: j.d };
  };
  ld().forEach(r => { try { Model.defineMade(r); } catch (er) {} });   // every tool you made, at every start
})(typeof window !== 'undefined' ? window : null);
