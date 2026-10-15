/* eravos.edm-lab 3.0.0 — groove generator (P6) · resolves F-18(lab)
 * Paint where the rhythm is busy, turn one TENSION dial: the lab plays a drum groove, an in-key
 * bassline and a harmony bed that follow it. PRINT bakes the current seed into a real sequencer.
 * No private clock (transport:tick), own compact voices, three out ports. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const ROWS = ['kick', 'snare', 'ghost', 'hat', 'openhat', 'clap', 'perc', 'shaker'];
  const PAD_OF = { kick: 0, snare: 1, ghost: 1, hat: 3, openhat: 4, clap: 2, perc: 9, shaker: 10 };
  const PROG = { 'i-VI-III-VII': [1, 6, 3, 7], 'i-iv-v-i': [1, 4, 5, 1], 'vi-IV-I-V': [6, 4, 1, 5], 'i-i-VI-VII': [1, 1, 6, 7] };
  function blank() { return ROWS.map(() => new Array(32).fill(0)); }
  function presetMap(kind) {
    const m = blank(); const set = (r, steps, v) => steps.forEach(s => { m[ROWS.indexOf(r)][s] = v; });
    const every = (n, off) => Array.from({ length: 32 }, (_, i) => i).filter(i => (i - (off || 0)) % n === 0);
    if (kind === 'ukg') { set('kick', [0, 10, 16, 26], 1); set('snare', [4, 12, 20, 28], 0.95); set('hat', every(4, 2), 0.9); set('ghost', [7, 15, 23, 30], 0.5); set('shaker', every(2, 1), 0.4); set('perc', [3, 19], 0.5); }
    else if (kind === 'dubstep') { set('kick', [0, 10, 16, 22, 26], 1); set('snare', [8, 24], 1); set('clap', [8, 24], 0.8); set('hat', every(4, 2), 0.85); set('ghost', [14, 30], 0.45); set('openhat', [30], 0.5); }
    else if (kind === 'house') { set('kick', every(4), 1); set('clap', [4, 12, 20, 28], 0.9); set('openhat', every(4, 2), 0.85); set('hat', every(2, 1), 0.5); set('shaker', every(1), 0.3); }
    else if (kind === 'neuro') { set('kick', [0, 10, 16, 26], 1); set('snare', [4, 12, 20, 28], 1); set('hat', every(2), 0.7); set('ghost', [6, 14, 18, 22, 30], 0.5); set('perc', [11, 27], 0.4); }
    else { set('kick', [0, 7, 10, 16, 23], 0.9); set('snare', [4, 12, 20, 28], 0.85); set('hat', every(2), 0.55); set('ghost', [15, 31], 0.35); set('shaker', every(4, 3), 0.3); }
    return m;
  }
  OrganismFactory.define({
    id: 'eravos.edm-lab', domain: 'music', version: '3.0.0', label: 'EDM Lab', icon: '⚗', accent: '#ff2266', phase: 'P6',
    category: 'Generators', blurb: 'Paint where the rhythm is busy, turn TENSION: drums, bass and chords follow — always in key.',
    size: { w: 760, h: 500 }, minSize: { w: 560, h: 380 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.audio_out', 'capability.generation'],
    hooks: [
      S.audio_out('lab.hook.out_rhythm', 'rhythm'), S.audio_out('lab.hook.out_bass', 'bass'), S.audio_out('lab.hook.out_harmony', 'harmony'),
      S.transport_in('lab.hook.transport_in'), S.theory_in('lab.hook.theory_in'),
      S.event('lab.hook.print_out', 'out', 'seq:pattern_suggest', { type: 'object', required: ['target', 'track', 'steps'] }, '1.0.0'),
      S.event('lab.hook.drop_out', 'out', 'edm:drop-fired', { type: 'object', required: ['time'] }, '1.0.0'),
      S.mod_in('lab.hook.mod_energy', 'energy'), S.mod_in('lab.hook.mod_tension', 'tension'),
    ],
    config: [
      { key: 'energy', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'ENERGY', group: 'MACRO' },
      { key: 'tension', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'TENSION', group: 'MACRO' },
      { key: 'progression', type: 'enum', options: Object.keys(PROG), default: 'i-VI-III-VII', label: 'Chords', group: 'HARMONY' },
      { key: 'chordBars', type: 'enum', options: [1, 2], default: 1, label: 'Bars/chord', group: 'HARMONY' },
      { key: 'swing', type: 'number', default: 0.1, min: 0, max: 0.6, step: 0.01, label: 'Swing', group: 'RHYTHM' },
      { key: 'seed', type: 'integer', default: 7, min: 1, max: 99999, label: 'Seed', group: 'RHYTHM' },
      { key: 'rhythmLevel', type: 'number', default: 0.9, min: 0, max: 1, step: 0.01, label: 'Drums', group: 'LEVELS' },
      { key: 'bassLevel', type: 'number', default: 0.8, min: 0, max: 1, step: 0.01, label: 'Bass', group: 'LEVELS' },
      { key: 'harmonyLevel', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Chords', group: 'LEVELS' },
      { key: 'rhythmOn', type: 'boolean', default: true, label: 'Drums', group: 'LEVELS' },
      { key: 'bassOn', type: 'boolean', default: true, label: 'Bass', group: 'LEVELS' },
      { key: 'harmonyOn', type: 'boolean', default: true, label: 'Chords', group: 'LEVELS' },
    ],
    ui_hooks: ['paint', 'clear', 'reseed', 'drop_arm', 'print'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      const outs = {}; ['rhythm', 'bass', 'harmony'].forEach(k => { const g = ac.createGain(); outs[k] = g; ctx.port(k, { kind: 'audio', direction: 'out', node: g, label: k }); });
      const levels = () => { outs.rhythm.gain.setTargetAtTime(P.get('rhythmOn') ? P.get('rhythmLevel') : 0, ac.currentTime, 0.02); outs.bass.gain.setTargetAtTime(P.get('bassOn') ? P.get('bassLevel') : 0, ac.currentTime, 0.02); outs.harmony.gain.setTargetAtTime(P.get('harmonyOn') ? P.get('harmonyLevel') : 0, ac.currentTime, 0.02); };
      levels(); ['rhythmLevel', 'bassLevel', 'harmonyLevel', 'rhythmOn', 'bassOn', 'harmonyOn'].forEach(k => P.onChange(k, levels));
      // event-rate modulation inputs: summing bus sampled by an analyser at tick time
      const modIn = (key) => { const cs = ctx.modBus(key, { min: 0, max: 1 }); const an = ac.createAnalyser(); an.fftSize = 32; cs.connect(an); const b = new Float32Array(32); return () => { an.getFloatTimeDomainData(b); return b[b.length - 1] || 0; }; };
      const modE = modIn('energy'), modT = modIn('tension');
      const energy = () => Math.max(0, Math.min(1, P.get('energy') + modE() + dropBoost));
      const tension = () => Math.max(0, Math.min(1, P.get('tension') + modT()));
      let map = presetMap('dubstep');
      let dropBoost = 0, dropArm = null; // {buildBar}
      const hitRand = (bar, row, step) => dsp.mulberry32((P.get('seed') * 7919 + bar * 131 + row * 17 + step) >>> 0)();
      ctx.hitRand = hitRand;
      function hits(bar, step) { // which rows fire at (bar, step16 within bar) — deterministic per seed + map
        const s32 = (bar % 2) * 16 + step, e = energy();
        return ROWS.map((r, i) => map[i][s32] > 0 && hitRand(bar, i, step) < map[i][s32] * (0.35 + 0.65 * e) * (r === 'kick' || r === 'snare' ? 1.4 : 1) ? map[i][s32] : 0);
      }
      ctx.hits = hits;
      // ---- drum voices (compact, lab-own)
      const noiseBuf = dsp.noise(ac, 1);
      const nz = (t, d) => { const n = ac.createBufferSource(); n.buffer = noiseBuf; n.start(t, Math.random() * 0.5); n.stop(t + d); return n; };
      const env = (g, t, pk, d) => { g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(pk, t + 0.002); g.gain.exponentialRampToValueAtTime(0.0005, t + d); };
      const V = {
        kick(t, v) { const o = ac.createOscillator(); o.frequency.setValueAtTime(160, t); o.frequency.exponentialRampToValueAtTime(48, t + 0.08); const g = ac.createGain(); env(g, t, v, 0.38); o.connect(g); g.connect(outs.rhythm); o.start(t); o.stop(t + 0.4); },
        snare(t, v) { const n = nz(t, 0.2), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 1500; const g = ac.createGain(); env(g, t, v * 0.7, 0.18); n.connect(f); f.connect(g); g.connect(outs.rhythm); const o = ac.createOscillator(); o.type = 'triangle'; o.frequency.value = 210; const og = ac.createGain(); env(og, t, v * 0.4, 0.08); o.connect(og); og.connect(outs.rhythm); o.start(t); o.stop(t + 0.1); },
        ghost(t, v) { const n = nz(t, 0.08), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 2500; const g = ac.createGain(); env(g, t, v * 0.25, 0.07); n.connect(f); f.connect(g); g.connect(outs.rhythm); },
        hat(t, v) { const n = nz(t, 0.06), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 8000; const g = ac.createGain(); env(g, t, v * 0.35, 0.045); n.connect(f); f.connect(g); g.connect(outs.rhythm); },
        openhat(t, v) { const n = nz(t, 0.35), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 7000; const g = ac.createGain(); env(g, t, v * 0.3, 0.3); n.connect(f); f.connect(g); g.connect(outs.rhythm); },
        clap(t, v) { const n = nz(t, 0.2), f = ac.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 1100; f.Q.value = 1.5; const g = ac.createGain(); g.gain.setValueAtTime(0, t); [0, 0.009, 0.018].forEach(d => { g.gain.setValueAtTime(v * 0.8, t + d); g.gain.exponentialRampToValueAtTime(0.05, t + d + 0.008); }); g.gain.setValueAtTime(v * 0.5, t + 0.027); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.18); n.connect(f); f.connect(g); g.connect(outs.rhythm); },
        perc(t, v) { const c = ac.createOscillator(), m = ac.createOscillator(), mg = ac.createGain(); c.frequency.value = 620; m.frequency.value = 620 * 1.41; mg.gain.setValueAtTime(900, t); mg.gain.exponentialRampToValueAtTime(1, t + 0.12); m.connect(mg); mg.connect(c.frequency); const g = ac.createGain(); env(g, t, v * 0.35, 0.12); c.connect(g); g.connect(outs.rhythm); c.start(t); m.start(t); c.stop(t + 0.15); m.stop(t + 0.15); },
        shaker(t, v) { const n = nz(t, 0.09), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 5500; const g = ac.createGain(); g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(v * 0.18, t + 0.03); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.08); n.connect(f); f.connect(g); g.connect(outs.rhythm); },
      };
      // ---- bass voice (mono saw+sub → LP env → soft clip, glide on off-beats)
      const bOsc = ac.createOscillator(); bOsc.type = 'sawtooth'; const bSub = ac.createOscillator(); bSub.type = 'sine';
      const bLp = ac.createBiquadFilter(); bLp.type = 'lowpass'; bLp.Q.value = 4; const bSh = ac.createWaveShaper(); bSh.curve = dsp.curve('tanh', 0.4);
      const bAmp = ac.createGain(); bAmp.gain.value = 0; const bSubG = ac.createGain(); bSubG.gain.value = 0.7;
      bOsc.connect(bLp); bSub.connect(bSubG); bLp.connect(bSh); bSubG.connect(bSh); bSh.connect(bAmp); bAmp.connect(outs.bass);
      [bOsc, bSub].forEach(o => { o.frequency.value = 55; o.start(); ctx.track(o); });
      let bassLog = [];
      function bassNote(t, midi, glide, dur) {
        const f = MT.hz(midi);
        if (glide) { bOsc.frequency.setTargetAtTime(f, t, 0.03); bSub.frequency.setTargetAtTime(f / 2, t, 0.03); }
        else { bOsc.frequency.setValueAtTime(f, t); bSub.frequency.setValueAtTime(f / 2, t); }
        const e = energy();
        bLp.frequency.cancelScheduledValues(t); bLp.frequency.setValueAtTime(200 + e * 2200, t); bLp.frequency.setTargetAtTime(120 + e * 300, t + 0.01, 0.08);
        bAmp.gain.cancelScheduledValues(t); bAmp.gain.setValueAtTime(bAmp.gain.value, t); bAmp.gain.linearRampToValueAtTime(0.55, t + 0.005); bAmp.gain.setTargetAtTime(0, t + dur, 0.03);
        bassLog.push({ t, midi, name: MT.noteName(midi) }); if (bassLog.length > 32) bassLog.shift();
        ctx.emitUI('bass_note', { time: t, midi, name: MT.noteName(midi) });
      }
      // ---- harmony (4 detuned voices → LP → slow swell)
      const hLp = ac.createBiquadFilter(); hLp.type = 'lowpass'; hLp.frequency.value = 1800; hLp.Q.value = 0.7; hLp.connect(outs.harmony);
      const hVoices = Array.from({ length: 4 }, (_, i) => { const a = ac.createOscillator(), b = ac.createOscillator(); a.type = 'triangle'; b.type = 'sawtooth'; b.detune.value = 7 * (i % 2 ? 1 : -1); const bg = ac.createGain(); bg.gain.value = 0.25; const g = ac.createGain(); g.gain.value = 0; a.connect(g); b.connect(bg); bg.connect(g); g.connect(hLp); a.start(); b.start(); ctx.track(a); ctx.track(b); return { a, b, g }; });
      function voicing(degree, ten) {
        const k = ctx.key; const tri = MT.chord(degree, k.root, k.scale, 'triad', 3); const r = tri[0];
        if (ten < 0.25) return { notes: tri.concat([tri[0] + 12]), cut: 1600 };
        if (ten < 0.5) return { notes: [tri[0], tri[1], tri[2], MT.degreeToMidi(degree + 8, 3, k.root, k.scale)], cut: 2000 };             // add9
        if (ten < 0.75) { const s = MT.chord(degree, k.root, k.scale, 'sus4', 3); return { notes: [s[0], s[1], s[2], MT.degreeToMidi(degree + 6, 3, k.root, k.scale)], cut: 2400 }; } // 7sus4
        return { notes: [r, r + 6, r + 13, tri[2] + 12], cut: 900 };                                                                   // cluster: tritone + b9, squeezed
      }
      ctx.voicing = voicing;
      let lastChord = null;
      function chordAt(bar) { const prog = PROG[P.get('progression')]; return prog[Math.floor(bar / P.get('chordBars')) % prog.length]; }
      ctx.chordAt = chordAt;
      function playChord(t, degree) {
        const v = voicing(degree, tension()); const e = energy();
        v.notes.forEach((n, i) => { const hv = hVoices[i]; hv.a.frequency.setTargetAtTime(MT.hz(n), t, 0.02); hv.b.frequency.setTargetAtTime(MT.hz(n), t, 0.02); hv.g.gain.cancelScheduledValues(t); hv.g.gain.setTargetAtTime(0.12, t, 0.35); });
        hLp.frequency.setTargetAtTime(v.cut * (0.5 + e), t, 0.3); hLp.Q.setTargetAtTime(tension() > 0.75 ? 6 : 0.7, t, 0.3);
        lastChord = { degree, notes: v.notes, name: MT.chordName(v.notes.slice().sort((a, b) => a - b)) };
        ctx.emitUI('chord', Object.assign({ time: t }, lastChord));
      }
      // ---- DROP (armed → next bar = 1-bar filtered build, silent last beat, impact on the bar after)
      function impact(t) {
        const o = ac.createOscillator(); o.frequency.setValueAtTime(55, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.2); const g = ac.createGain(); env(g, t, 0.9, 1.3); o.connect(g); g.connect(outs.rhythm); o.start(t); o.stop(t + 1.4);
        const n = nz(t, 1.6), f = ac.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = 3500; const ng = ac.createGain(); env(ng, t, 0.35, 1.5); n.connect(f); f.connect(ng); ng.connect(outs.rhythm);
      }
      ctx.onTick((tk) => {
        const bar = Math.floor(tk.step16 / 16), step = tk.step16 % 16;
        let silent = false;
        if (dropArm) {
          if (dropArm.buildBar === null && step === 0) dropArm.buildBar = bar;
          if (dropArm.buildBar !== null) {
            if (bar === dropArm.buildBar) { dropBoost = -0.4 + 0.4 * step / 16; ['rhythm', 'bass', 'harmony'].forEach(k => outs[k].gain.setTargetAtTime(k === 'rhythm' ? 0.5 * P.get('rhythmLevel') : 0.3, tk.time, 0.05)); if (step >= 12) silent = true; }
            if (bar === dropArm.buildBar + 1 && step === 0) { impact(tk.time); dropBoost = 0.4; levels(); ctx.emit('edm:drop-fired', { time: tk.time, bar: bar + 1 }); ctx.emitUI('drop', { time: tk.time }); dropArm = null; ctx.dropAt = tk.time; }
          }
        } else if (dropBoost > 0 && step === 0) dropBoost = Math.max(0, dropBoost - 0.1);
        if (silent) { ['rhythm', 'bass', 'harmony'].forEach(k => outs[k].gain.setValueAtTime(0, tk.time)); return; }
        const swing = step % 2 === 1 ? P.get('swing') * tk.stepDur : 0, t = tk.time + swing;
        const h = hits(bar, step);
        h.forEach((v, i) => { if (v) V[ROWS[i]](t, Math.min(1, v * (0.6 + 0.4 * energy()))); });
        ctx.emitUI('hits', { step: (bar % 2) * 16 + step, rows: h.map(v => v > 0), time: tk.time });
        if (step === 0 && bar % P.get('chordBars') === 0) playChord(tk.time, chordAt(bar));
        // bass on kick-density peaks ≥ 0.5
        const s32 = (bar % 2) * 16 + step, kd = map[0];
        if (kd[s32] >= 0.5 && kd[s32] >= (kd[(s32 + 31) % 32] || 0) && kd[s32] >= (kd[(s32 + 1) % 32] || 0)) {
          const deg = chordAt(bar); const k = ctx.key; const e = energy();
          const oct = step % 8 === 4 && e > 0.7 ? 2 : 1;
          const midi = MT.degreeToMidi(deg, oct, k.root, k.scale);
          bassNote(t, midi, step % 4 !== 0, tk.stepDur * (e > 0.6 ? 1.6 : 2.5));
        }
      });
      ctx.onStop(() => { dropBoost = 0; dropArm = null; levels(); bAmp.gain.setTargetAtTime(0, ac.currentTime, 0.05); hVoices.forEach(v => v.g.gain.setTargetAtTime(0, ac.currentTime, 0.2)); });
      // ---- UI hooks
      ctx.onUI('paint', { type: 'object', required: ['row', 'step', 'value'], properties: { row: { type: 'integer', minimum: 0, maximum: 7 }, step: { type: 'integer', minimum: 0, maximum: 31 }, value: { type: 'number', minimum: 0, maximum: 1 } } }, (p) => {
        const r = Math.max(0, Math.min(8, p.radius || 0));
        for (let s = p.step - Math.ceil(r); s <= p.step + Math.ceil(r); s++) { if (s < 0 || s > 31) continue; const w = r ? Math.max(0, 1 - Math.abs(s - p.step) / (r + 1)) : (s === p.step ? 1 : 0); if (!w) continue; const cur = map[p.row][s]; map[p.row][s] = +(cur + (p.value - cur) * w).toFixed(3); }
        ctx.emitUI('map', { map });
      });
      ctx.onUI('clear', { type: 'object' }, (p) => { if (typeof p.row === 'number') map[p.row].fill(0); else map = blank(); ctx.emitUI('map', { map }); });
      ctx.onUI('reseed', null, () => P.set('seed', Math.floor(Math.random() * 99998) + 1));
      ctx.onUI('drop_arm', null, () => { dropArm = dropArm ? null : { buildBar: null }; ctx.emitUI('drop', { armed: !!dropArm }); });
      function print(target) {
        if (!ctx.K.registry.has(target)) return ctx.fault('RUNTIME_003', 'print: sequencer not mounted');
        ROWS.forEach((r, i) => {
          const steps = []; for (let bar = 0; bar < 2; bar++) for (let st = 0; st < 16; st++) { const v = hits(bar, st)[i]; steps.push({ on: v > 0, vel: r === 'ghost' ? 0.35 : Math.min(1, 0.6 + 0.4 * v) }); }
          if (steps.some(s => s.on)) ctx.emit('seq:pattern_suggest', { target, track: 'lab ' + r, steps, drumNote: 36 + PAD_OF[r], length: 32 });
        });
        const bassSteps = []; const k = ctx.key;
        for (let bar = 0; bar < 2; bar++) for (let st = 0; st < 16; st++) { const s32 = bar * 16 + st, kd = map[0]; const on = kd[s32] >= 0.5 && kd[s32] >= (kd[(s32 + 31) % 32] || 0) && kd[s32] >= (kd[(s32 + 1) % 32] || 0); bassSteps.push({ on, degree: chordAt(bar), octave: 0, gate: 2 }); }
        const bassInst = ['eravos.wobble-bass', 'eravos.reese-bass', 'eravos.acid-synth'].map(id => ctx.K.registry.byOrganism(id)[0]).find(Boolean);
        ctx.emit('seq:pattern_suggest', { target, track: 'lab bass', steps: bassSteps, instrument: bassInst ? bassInst.instance_id : null, transpose: -2, length: 32 });
      }
      ctx.print = print;
      ctx.onUI('print', { type: 'object', required: ['target'] }, (p) => print(p.target));
      ctx.stateExtra = () => ({ map, rows: ROWS, chord: lastChord, sequencers: ctx.K.registry.byOrganism('eravos.sequencer').map(r => ({ value: r.instance_id, label: '⬛ Sequencer ' + r.instance_id.split('-').slice(-2).join('') })) });
      ctx.on('kernel:organism-mounted', null, () => ctx.syncUI());
      ctx.saveExtra = () => ({ map });
      ctx.loadExtra = (x) => { if (!x) return; if (typeof x.map === 'string') map = presetMap(x.map); else if (Array.isArray(x.map)) map = x.map; ctx.emitUI('map', { map }); };
      ctx.internals = { get map() { return map; }, set map(m) { map = m; }, presetMap, ROWS };
      ctx.armDrop = () => { dropArm = { buildBar: null }; };
      return {};
    },
  });
})();
