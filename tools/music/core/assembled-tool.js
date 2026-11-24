/* ERAVOS music core — assembled-tool.js → window.AssembledTool (2026-11-21; specs/eravos.assembled-tool.spec). His words (2026-11-21): "Do it. Then
 * remove that tool. Dont hide it." — the Wobble Builder (3.202–3.203) is gone as a tool; its engine is what SYNTHESIZING tools together makes:
 * drag one blown-up tool's ◆ onto another's core on the canvas (tools/core/field/board.js) → one tool of its own, each part from the tool it is
 * most itself in (tools/music/data/tool-blend.js), checked (it plays cleanly; no twin of anything in ERAVOS or made before), opened blown up.
 * ONE engine, nothing re-implemented: the settings make a DAG (dag), the DAG is assembled from the components' own kernels
 * (tools/core/compat/assemble.js + tools/music/compat/adapters.js) and runs in ONE AudioWorklet built from their text — the same code renders
 * offline (tests, the novelty gate) and live. A knob reaches the sound in place; a part swapped rebuilds the chain, cross-faded (256 samples).
 *   window.AssembledTool → { SET, defaults(), dag(settings, bpm), shape(dag), Voice, source(MP, Assemble, MusicAdapters), descriptor(o),
 *     made(), make(name, settings, bpm, MusicNovelty), judge(…), defineMade(rec), forget(id), synthesize(aInstance, bInstance) → Promise }
 *   (the model and Voice also require()-able) */
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
    n('envAmt', 'Env amount', 'MOUTH', 0, 4, 0.05, 0, { unit: 'oct', hint: 'a filter envelope on each note (env-adsr into the mouth): how far it opens it' }),
    n('envDecay', 'Env decay', 'MOUTH', 0.01, 2, 0.01, 0.3, { unit: 's' }), n('envSustain', 'Env sustain', 'MOUTH', 0, 1, 0.01, 0.2),
    e('wave', 'Wave', 'VOICE', ['saw', 'pulse', 'square', 'triangle'], 'saw'), n('pw', 'Width', 'VOICE', 0.05, 0.95, 0.01, 0.5, { hint: 'the pulse width' }),
    n('sub', 'Sub', 'VOICE', 0, 1, 0.01, 0.55, { hint: 'a clean sine under it all: never through the drive or the mouth' }), e('subOct', 'Sub octave', 'VOICE', [-1, -2], -1),
    n('glide', 'Glide', 'VOICE', 0, 0.5, 0.001, 0.02, { unit: 's' }),
    n('noise', 'Noise', 'VOICE', 0, 1, 0.01, 0, { hint: 'a noise layer before the drive, so it wobbles too (osc-noise)' }),
    e('noiseColour', 'Noise colour', 'VOICE', ['white', 'pink', 'brown', 'velvet', 'crackle', 'band-limited'], 'white'), n('octave', 'Octave', 'VOICE', -2, 1, 1, -1, { mutate: false }),
    n('width', 'Width', 'OUT', 0, 1, 0.01, 0.8, { hint: 'stereo width above 120 Hz' }), n('level', 'Level', 'OUT', 0, 1.2, 0.01, 0.8, { mutate: false }),
    e('drive', 'Drive part', 'PARTS', ['none', 'saturator-tube', 'saturator-tape', 'bitcrusher'], 'saturator-tube', { socket: 'drive', near: 'drive', hint: 'before the mouth: gives the wobble something to bite' }),
    e('mouth', 'Mouth part', 'PARTS', ['filter-svf', 'filter-ladder'], 'filter-svf', { socket: 'mouth', near: 'cutoff', hint: 'the filter the wobble moves' }),
    e('fx', 'FX part', 'PARTS', ['none', 'delay-line', 'saturator-tape', 'bitcrusher', 'ensemble-core'], 'none', { socket: 'fx', near: 'fx', hint: 'after the mouth · ensemble-core = the Juno chorus (Retro DCO\'s)' }),
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
    e('fEnsMode', 'Chorus', 'FX', ['juno I', 'juno II', 'juno I+II', 'string machine', 'dimension'], 'juno I', { part: 'ensemble-core', of: 'fx' }),
    n('fEnsMix', 'Chorus mix', 'FX', 0, 1, 0.01, 0.5, { part: 'ensemble-core', of: 'fx', v: 'mix' }),
    n('fCrushBits', 'Crush bits', 'FX', 4, 16, 1, 10, { part: 'bitcrusher', of: 'fx', v: 'bits' }), n('fCrushRate', 'Crush rate', 'FX', 4000, 40000, 10, 16000, { unit: 'Hz', part: 'bitcrusher', of: 'fx', v: 'rate' }),
  ];
  const K = {}; SET.forEach(c => { K[c.key] = c; });
  // ensemble-core's machines are its own data (MusicParts.ENSEMBLE_MODES); kept here as read so the model runs without a page (tests)
  const ENSEMBLE = { 'juno I': { taps: 2, base: 3.5, depth: 1.85, rate: 0.513, depth2: 0, shape: 1, spread: 1 }, 'juno II': { taps: 2, base: 3.5, depth: 1.85, rate: 0.863, depth2: 0, shape: 1, spread: 1 },
    'juno I+II': { taps: 2, base: 3.2, depth: 0.25, rate: 9.75, depth2: 0, shape: 0, spread: 1 }, 'string machine': { taps: 3, base: 6, depth: 1.5, rate: 0.6, depth2: 0.25, rate2: 6, shape: 0, spread: 0.8 },
    'dimension': { taps: 4, base: 8, depth: 0.6, rate: 0.25, depth2: 0, shape: 1, spread: 0.6 } };
  const defaults = () => { const o = {}; SET.forEach(c => { o[c.key] = c.default; }); return o; };
  const lfoHz = (s, bpm) => 1 / (BEATS[s.rate] * 60 / (bpm || 120));
  function dag(s, bpm) {   // the settings → the chain (what SYNTHESIZE writes, what the engine plays)
    bpm = bpm || 120;
    const vars = (part, of) => { const o = {}; SET.filter(c => c.part === part && c.of === of && c.v).forEach(c => { o[c.v] = s[c.key]; }); return o; };
    const nodes = [{ id: 'osc', component: 'osc-va', vars: { shape: s.wave, width: s.pw } }, { id: 'sub', component: 'osc-sub', vars: { octave: s.subOct, shape: 'sine' } },
      { id: 'lfo', component: 'lfo', vars: { rate: lfoHz(s, bpm), shape: s.lfoShape } }], edges = [];
    let last = 'osc.out';
    if (s.noise > 0) nodes.push({ id: 'nz', component: 'osc-noise', vars: { colour: s.noiseColour, level: 1, width: 1 } });
    if (s.drive !== 'none') { const v = vars(s.drive, 'drive'); if (s.drive !== 'bitcrusher') v.out = -Math.min(12, (v.drive || 0) * 0.5 + 3); else v.aa = true;   // a saturator trimmed as its drive comes in
      nodes.push({ id: 'drv', component: s.drive, vars: v }); edges.push({ from: last, to: 'drv.in' }); if (s.noise > 0) edges.push({ from: 'nz.out', to: 'drv.in', amount: s.noise * 0.5 }); last = 'drv.out'; }
    else if (s.noise > 0) edges.push({ from: 'nz.out', to: 'flt.in', amount: s.noise * 0.5 });
    nodes.push({ id: 'flt', component: s.mouth, vars: Object.assign({ frequency: s.cutoff, resonance: s.reso }, vars(s.mouth, 'mouth')) });
    edges.push({ from: last, to: 'flt.in' }, { from: 'lfo.out', to: 'flt.detune', amount: s.depth * 1200 }); last = 'flt.out';
    if (s.envAmt > 0) { nodes.push({ id: 'env', component: 'env-adsr', vars: { attack: 0.003, decay: s.envDecay, sustain: s.envSustain, release: 0.15 } }); edges.push({ from: 'env.out', to: 'flt.detune', amount: s.envAmt * 1200 }); }
    if (s.fx !== 'none') { const v = vars(s.fx, 'fx'); if (s.fx === 'delay-line') Object.assign(v, { time: BEATS[s.fDelTime] * 60 / bpm, sync: 0, damp: 5000, lowcut: 120 });
      if (s.fx === 'saturator-tape') v.out = -Math.min(9, (v.drive || 0) * 0.5); if (s.fx === 'bitcrusher') v.aa = true;
      if (s.fx === 'ensemble-core') Object.assign(v, ENSEMBLE[s.fEnsMode] || {}, { mix: s.fEnsMix, shape: (ENSEMBLE[s.fEnsMode] || {}).shape ? 'triangle' : 'sine' });
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
    VA: MP.VA, Sub: MP.Sub, ADSR: MP.ADSR, MonoBelow: MP.MonoBelow, LFO: MP.LFO, Ensemble: MP.Ensemble, ENSEMBLE_PARAMS: MP.ENSEMBLE_PARAMS, Noise: MP.Noise, NOISE_PARAMS: MP.NOISE_PARAMS });
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
registerProcessor('eravos-assembled', EravosWobbleBuilder);`].join('\n');
  }
  // what a tool made by the builder carries (WB3): its settings and its DAG, saved; it runs on this same engine
  const MADE_KEY = 'wobble-builder';
  const Model = { SET, K, ENSEMBLE, DIVS, BEATS, LFO_SHAPES, defaults, dag, shape, lfoHz, Voice, PARTS, source, MADE_KEY, version: '1.0.0' };
  if (typeof module === 'object' && module.exports) module.exports = Model;
  if (!root) return;
  root.AssembledTool = Model;

  // ---------------------------------------------------------------- the tool (and every tool it makes: the same engine, its settings as defaults)
  const S = root.OrganismSDK && root.OrganismSDK.STD;
  function descriptor(o) {
    o = o || {};
    return {
      id: o.id, domain: 'music', version: o.version || '1.0.0', label: o.label || 'Synthesized', icon: o.icon || '🧪', accent: o.accent || '#ffcc00', phase: 'P202',
      category: 'Bass', blurb: o.blurb || 'A tool synthesized from others: its parts are shared components, assembled into one engine.',
      size: { w: 760, h: 720 }, minSize: { w: 480, h: 480 },
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
    const ready = ctx.loadWorklet('eravos-assembled', source(MP, root.Assemble, root.MusicAdapters)).then(() => {
      if (ctx.disposed) return null;
      node = new AudioWorkletNode(ac, 'eravos-assembled', { numberOfInputs: 0, numberOfOutputs: 1, outputChannelCount: [2], processorOptions: { dag: cur, contracts: C.contracts } }); ctx.track(node);
      node.onprocessorerror = (er) => ctx.fault('RUNTIME_003', 'synthesized tool worklet stopped: ' + ((er && er.message) || 'processor error'));
      node.port.onmessage = (m) => { const d = m.data || {};  if (d.type === 'fault') ctx.fault('RUNTIME_003', 'synthesized tool: ' + d.why.join('; ')); if (d.type === 'rebuild') node.port.postMessage({ type: 'dag', dag: cur }); };
      node.connect(out); prm('level').setValueAtTime(P.get('level'), 0); prm('glide').setValueAtTime(P.get('glide'), 0);
      queue.splice(0).forEach(f => f()); return node;
    }).catch(er => { ctx.fault('RUNTIME_003', 'synthesized tool worklet: ' + er.message); return null; });
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
      blurb: 'Synthesized ' + String(r.at || '').slice(0, 10) + (r.of ? ' from ' + r.of.join(' × ') : '') + ': ' + r.chain + '. ' + (r.verdict === 'novel' ? 'New to ERAVOS.' : 'Close to ' + r.near + '.'), made: { from: 'synthesized', of: r.of || [], at: r.at, dag: r.dag, verdict: r.verdict, near: r.near, d: r.d } }));
    if (Model.ui) F.reg(r.id, Model.ui); return r.id;
  };
  Model.forget = (id) => keep(ld().filter(r => r.id !== id));
  Model.chainOf = (d) => d.nodes.filter(x => !['lfo', 'sub', 'st'].includes(x.id)).map(x => x.component).join(' → ') + ' · wobble into ' + (d.nodes.find(x => x.id === 'flt') || {}).component;
  // the gates every made tool passes (D5, D6): it plays (finite, not silent, never pinned), and it is not a twin of anything in ERAVOS or made before
  const RIFF = (bpm) => { const b = 60 / bpm; return [33, 33, 36, 31].map((m, i) => ({ t: 0.03 + i * 2 * b, dur: 2 * b - 0.06, hz: 440 * Math.pow(2, (m - 69) / 12) })); };
  // 3.217 what a made tool sounds like, offline (the same render the judge measures) → { ok, L, R, sr } — to hear what ERAVOS made
  Model.render = function (settings, bpm) { const sr = 48000, notes = RIFF(bpm), secs = notes[3].t + notes[3].dur + 0.2; const r = Voice(root.Assemble, root.MusicAdapters, root.MusicParts, root.MusicContracts.contracts, sr).render(dag(settings, bpm), notes, secs, settings.level, settings.glide); return Object.assign({ sr }, r); };
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
  Model.make = function (name, settings, bpm, N, of) {   // → { ok, id, rec } or { ok: false, why } · of: the tools it was synthesized from
    const j = Model.judge(settings, bpm, N); if (!j.ok) return j;
    const L = ld(); let nm = String(name || 'Made Wobble').trim() || 'Made Wobble', i = 2; const base = nm; while (L.some(r => r.name === nm) || (root.OrganismFactory && root.OrganismFactory.def(Model.idFor(nm)))) nm = base + ' ' + i++;
    const rec = { id: Model.idFor(nm), name: nm, of: of || [], at: new Date().toISOString(), settings: JSON.parse(JSON.stringify(settings)), bpm, dag: j.dag, chain: Model.chainOf(j.dag), fp: j.fp, verdict: j.verdict, near: j.near, d: j.d };
    L.unshift(rec); keep(L); Model.defineMade(rec); return { ok: true, id: rec.id, rec, verdict: j.verdict, near: j.near, d: j.d };
  };
  // ---------------------------------------------------------------- SYNTHESIZE TOGETHER: two tools blown up on the canvas → one of its own
  // (the board calls this when one tool's ◆ is dropped on another's core). Each part from the tool it is most itself in (ToolBlend.pickFor);
  // the same gates (it plays cleanly; no twin). Its name is theirs: "<A> × <B>".
  function loadNovelty() {
    if (root.MusicNovelty) return Promise.resolve(root.MusicNovelty);
    return new Promise((res, rej) => { const s2 = root.document.createElement('script'); s2.src = (root.ERAVOS_TOOLS || '') + 'music/compat/novelty.js'; s2.onload = () => res(root.MusicNovelty); s2.onerror = () => rej(new Error('the novelty measure did not load')); root.document.head.appendChild(s2); });
  }
  Model.synthesize = async function (aInst, bInst) {
    const F = root.OrganismFactory, TB = root.ToolBlend, A = F && F.handle(aInst), B = F && F.handle(bInst);
    if (!A || !B || !TB || !TB.has(A.id) || !TB.has(B.id)) return { ok: false, why: 'these two have no parts the engine runs yet' };
    let N; try { N = await loadNovelty(); } catch (er) { return { ok: false, why: er.message }; }
    const bpm = (root.Kernel && root.Kernel.music && root.Kernel.music.bpm) || 120, a = { id: A.id, params: TB.paramsOf(aInst) }, b = { id: B.id, params: TB.paramsOf(bInst) };
    const settings = TB.combine(a, b, TB.pickFor(A.id, B.id), bpm), names = [A.def.label, B.def.label];
    return Model.make(names.join(' × '), settings, bpm, N, names);
  };
  // 3.211 the parts he picked (Ctrl+click on the board, any tools blown up) → one tool: each picked part takes its place in the engine,
  // the rest comes from the tool most of them came from. list: [{ inst, slot }] (slot: the exchange's box id). Same gates, same naming.
  // 3.217 opts.restFrom: the tool (instance) everything not picked comes from — his choice (the menu offers each tool blown up); without it,
  // the tool most of the picked parts came from. A part is taken by its swap slot, else by what it is (TB.slotOfPiece: the voice, …).
  Model.synthesizeParts = async function (list, opts) {
    const F = root.OrganismFactory, TB = root.ToolBlend; if (!F || !TB) return { ok: false, why: 'the engine is not loaded' };
    const parts = (list || []).map(x => ({ x, h: F.handle(x.inst), to: TB.PART_SLOT[x.slot] || (TB.slotOfPiece && TB.slotOfPiece(x.label)) })).filter(o => o.h);
    const usable = parts.filter(o => o.to && TB.has(o.h.id)), left = parts.filter(o => !usable.includes(o));
    if (!usable.length) return { ok: false, why: 'none of these parts runs in the engine yet' + (left.length ? ' (' + left.map(o => o.h.def.label + ' · ' + o.x.slot).join(', ') + ')' : '') };
    let N; try { N = await loadNovelty(); } catch (er) { return { ok: false, why: er.message }; }
    const bpm = (root.Kernel && root.Kernel.music && root.Kernel.music.bpm) || 120, src = (h) => ({ id: h.id, params: TB.paramsOf(h.instanceId) });
    const count = new Map(); usable.forEach(o => count.set(o.h, (count.get(o.h) || 0) + 1));
    const rest = opts && opts.restFrom && F.handle(opts.restFrom), base = rest && TB.has(rest.id) ? rest : [...count.entries()].sort((a, b) => b[1] - a[1])[0][0], from = {};
    usable.forEach(o => { from[o.to] = src(o.h); });
    const settings = TB.combineFrom(from, src(base), bpm); if (!settings) return { ok: false, why: 'these parts could not be read' };
    const names = [...new Set(usable.map(o => o.h.def.label).concat(base.def.label))];
    const r = await Model.make(names.length > 1 ? names.join(' × ') : names[0] + ' · parts', settings, bpm, N, names);
    if (r) r.left = left.map(o => o.h.def.label + ' · ' + o.x.slot); return r;
  };
  if (root.PartExchange) { root.PartExchange.synthesize = Model.synthesize; root.PartExchange.synthesizeParts = Model.synthesizeParts; }   // the board finds it on the exchange the music domain hands it

  // ---------------------------------------------------------------- the face of a synthesized tool: the kit, its parts as cards (what is in each, its settings)
  Model.ui = function (view) {
    const UI = view.ui, h = UI.h, cfg = (k) => view.descriptor.config.find(c => c.key === k), st = (k) => view.state[k] !== undefined ? view.state[k] : cfg(k).default, made = view.descriptor.made || {};
    const ctl = (k, o) => { const c = UI.paramControl(view, cfg(k), Object.assign({ size: 30 }, o || {})); c.el.dataset.key = k; return c; };
    const row = (kids) => h('div', { class: 'uk-row', style: { flexWrap: 'wrap', gap: '8px', alignItems: 'flex-end' } }, kids);
    const card = (title, kids) => h('div', { class: 'uk-group', style: { breakInside: 'avoid', margin: '0 0 8px' } }, [h('div', { class: 'uk-group-title', text: title })].concat(kids));
    const part = (title, socket, always) => { const box = h('div'), draw = () => box.replaceChildren(row((always || []).map(k => ctl(k).el).concat(view.descriptor.config.filter(c => c.part && c.of === socket && [].concat(c.part).includes(st(socket))).map(c => ctl(c.key).el))));
      draw(); view.bind(socket, () => setTimeout(draw, 0)); return card(title, [ctl(socket, { segMax: 5, noLabel: true }).el, box]); };
    const kb = UI.Keyboard ? UI.Keyboard({ low: 33, high: 57, key: view.key, onDown: (n, v) => view.emit('audition', { note: n, velocity: v, duration: 30 }), onUp: (n) => view.emit('audition_off', { note: n }) }) : { el: h('div') };
    view.root.append(h('div', { class: 'org-row', style: { justifyContent: 'space-between' } }, [UI.presetBar(view)]),
      UI.hint('Synthesized' + (made.of && made.of.length ? ' from ' + made.of.join(' × ') : '') + ' · ' + (made.verdict === 'novel' ? 'new to ERAVOS' : 'close to ' + made.near) + ' · blow it up on the canvas to swap its parts'),
      h('div', { style: { columnWidth: '300px', columnGap: '8px', marginTop: '6px' } }, [
        card('WOBBLE', [row(['rate', 'lfoShape', 'depth'].map(k => ctl(k, k === 'rate' ? { segMax: 9 } : {}).el))]),
        part('MOUTH', 'mouth', ['cutoff', 'reso', 'envAmt', 'envDecay', 'envSustain']),
        part('DRIVE', 'drive'), part('FX', 'fx'),
        card('VOICE', [row(['wave', 'pw', 'sub', 'subOct', 'noise', 'noiseColour', 'glide', 'octave'].map(k => ctl(k).el))]),
        card('OUT', [row(['width', 'level'].map(k => ctl(k).el))])]),
      h('div', { style: { height: '6px' } }), kb.el);
  };
  ld().forEach(r => { try { Model.defineMade(r); } catch (er) {} });   // every tool you made, at every start
})(typeof window !== 'undefined' ? window : null);
