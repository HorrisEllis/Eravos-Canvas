/* ERAVOS music — compat/adapters.js → window.MusicAdapters / require (CG3). How each music component's own kernel runs as one node of an
 * assembled engine (tools/core/compat/assemble.js): its ports in and out as buffers, its variables as the kernel's own parameters. No sound
 * is re-implemented here — each adapter only calls the component's tested kernel (eravos.components: never copy a component).
 *   MusicAdapters(MP) → { adapters, bridges }   MP: the kernels (window.MusicParts in a page; the components' modules in node)
 * Today (2026-11-20 + ensemble-core, osc-noise): the audio processors that share process(ins, outs, n, P) (one adapter for all; a control wired into a port named like a kernel
 * param — a filter's detune — rides on it), osc-va, osc-sub, env-adsr, lfo (2026-11-20: the wobble, restarted per note), stereo-tools.
 * Each adapter may take new settings live (set(vars): the kernel's state kept — a knob moved while it plays). A component without an adapter cannot be assembled yet — assemble() says so and the mutant is not offered. */
(function adaptersFactory(root) {
  'use strict';
  // a variable's value as the kernel reads it: an enum is its option's index, a boolean 0/1

  function MusicAdapters(MP) {
  const asNum = (v, x) => v.type === 'enum' ? Math.max(0, (v.options || []).indexOf(x)) : v.type === 'boolean' ? (x ? 1 : 0) : +x;
    // the processors: process(ins, outs, n, P), P = { name: [value] } in the kernel's own order (its *_PARAMS)
    const PROC = { 'filter-svf': ['SVF', 'SVF_PARAMS'], 'filter-ladder': ['Ladder', 'LADDER_PARAMS'], 'saturator-tape': ['TapeSat', 'TAPESAT_PARAMS'],
      'saturator-tube': ['TubeSat', 'TUBESAT_PARAMS'], 'bitcrusher': ['Crusher', 'CRUSHER_PARAMS'], 'delay-line': ['Delay', 'DELAY_PARAMS'],
      'ensemble-core': ['Ensemble', 'ENSEMBLE_PARAMS'] };   // 2026-11-20: the Juno chorus (Retro DCO's), for the Wobble Builder's COMBINE
    const adapters = {};
    Object.keys(PROC).forEach(id => {
      const [K, PA] = PROC[id]; if (!MP[K] || !MP[PA]) return;
      adapters[id] = (sr, c, vars) => {
        const k = MP[K](); k.setRate(sr); const P = {};
        const fill = (vv) => MP[PA].forEach(p => { const v = (c.variables || []).find(x => x.key === p.name); P[p.name] = [v && vv[p.name] !== undefined ? asNum(v, vv[p.name]) : p.defaultValue]; }); fill(vars);   // a setting not given: its default
        // a control wired into a port named like one of the kernel's params (a filter's detune: the wobble) rides on that param, sample by sample
        const mods = (c.ports || []).filter(pt => pt.dir === 'in' && pt.id !== 'in' && P[pt.id]).map(pt => ({ id: pt.id, base: P[pt.id][0], buf: new Float32Array(4096) }));
        return { run(ins, outs, n) { const i = ins.in.map(b => b.subarray(0, n)), o = outs.out.map(b => b.subarray(0, n));
          mods.forEach(m => { const src = ins[m.id] && ins[m.id][0]; if (!src) return; const b = m.buf.subarray(0, n); for (let j = 0; j < n; j++) b[j] = m.base + src[j]; P[m.id] = b; });
          k.process(i, o, n, P); },
          set(vv) { fill(vv); mods.forEach(m => { m.base = P[m.id][0]; }); } };   // live: new settings, the kernel's state kept (no click)
      };
    });
    if (MP.VA) adapters['osc-va'] = (sr, c, vars) => {
      const k = MP.VA(); let shape = asNum(c.variables.find(v => v.key === 'shape'), vars.shape), w = +vars.width, ph = 0;
      return { run(ins, outs, n) { const hz = ins.pitch[0], o = outs.out[0];
        for (let j = 0; j < n; j++) { const dt = Math.min(0.5, Math.max(0, hz[j] / sr)); o[j] = k.sample(shape, ph, dt, w); ph += dt; if (ph >= 1) ph -= 1; } },
        set(v) { shape = asNum(c.variables.find(x => x.key === 'shape'), v.shape); w = +v.width; } };
    };
    if (MP.Sub) adapters['osc-sub'] = (sr, c, vars) => {
      const k = MP.Sub(); let shape = asNum(c.variables.find(v => v.key === 'shape'), vars.shape), oct = +vars.octave;
      return { run(ins, outs, n) { const hz = ins.pitch[0], o = outs.out[0]; for (let j = 0; j < n; j++) o[j] = k.next(hz[j], sr, oct, shape); },
        set(v) { shape = asNum(c.variables.find(x => x.key === 'shape'), v.shape); oct = +v.octave; } };
    };
    if (MP.Noise && MP.NOISE_PARAMS) adapters['osc-noise'] = (sr, c, vars) => {   // a source: no input, its colour and level its settings (2026-11-20)
      const k = MP.Noise(); k.setRate(sr); const P = {}, fill = (vv) => MP.NOISE_PARAMS.forEach(p => { const v = (c.variables || []).find(x => x.key === p.name); P[p.name] = [v && vv[p.name] !== undefined ? asNum(v, vv[p.name]) : p.defaultValue]; }); fill(vars);
      return { run(ins, outs, n) { k.process(outs.out.map(b => b.subarray(0, n)), n, P); }, set(vv) { fill(vv); } };
    };
    if (MP.LFO) adapters['lfo'] = (sr, c, vars) => {   // the wobble: −1…1 (or 0…1), restarted on each note (its gate rising), unless free
      const k = MP.LFO(), cfg = (v) => ({ shape: asNum(c.variables.find(x => x.key === 'shape'), v.shape), rate: +v.rate, phase: +v.phase, fade: +v.fade, unipolar: !!v.unipolar }); k.set(cfg(vars), sr); k.reset(); let was = 0;
      return { run(ins, outs, n, ctx) { const o = outs.out[0], g = ctx && ctx.gate; for (let j = 0; j < n; j++) { const on = g && g[j] >= 0.5 ? 1 : 0; if (on && !was) k.reset(); was = on; o[j] = k.next(); } },
        set(v) { k.set(cfg(v)); } };   // a new rate or shape from where it is in its cycle
    };
    if (MP.ADSR) adapters['env-adsr'] = (sr, c, vars) => {
      const k = MP.ADSR(); k.set(+vars.attack, +vars.decay, +vars.sustain, +vars.release, sr); let was = 0;
      return { run(ins, outs, n) { const g = ins.gate[0], o = outs.out[0]; for (let j = 0; j < n; j++) { const on = g[j] >= 0.5 ? 1 : 0; if (on !== was) { k.gate(!!on); was = on; } o[j] = k.next(); } },
        set(v) { k.set(+v.attack, +v.decay, +v.sustain, +v.release, sr); } };
    };
    if (MP.MonoBelow) adapters['stereo-tools'] = (sr, c, vars) => {
      const k = MP.MonoBelow(); k.set(+vars.hz, sr); let wd = +vars.width;
      return { run(ins, outs, n) { const [iL, iR] = ins.in, [L, R] = outs.out;
        for (let j = 0; j < n; j++) { const m = 0.5 * (iL[j] + iR[j]), s = 0.5 * (iL[j] - iR[j]) * wd; L[j] = m + s; R[j] = m - s; }
        k.process(L, R, n); },
        set(v) { k.set(+v.hz, sr); wd = +v.width; } };
    };
    // a bridge carries one type into another (tools/music/types.json › bridges): control → pitch bends the note up to an octave per unit
    const bridges = { 'control→pitch': (x, ctx) => ctx.hz * Math.pow(2, x), 'gate→trigger': (x) => (x >= 0.5 ? 1 : 0), 'audio→control': (x) => Math.abs(x) };
    return { adapters, bridges };
  }

  if (typeof module === 'object' && module.exports) module.exports = { MusicAdapters };
  if (root) { root.MusicAdapters = MusicAdapters; MusicAdapters.SRC = '(' + adaptersFactory.toString() + ')(globalThis);'; }   // the whole file, for a worklet (2026-11-20)
})(typeof window !== 'undefined' ? window : null);
