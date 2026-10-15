/* eravos.xen-synth 1.0.0 — Xen Synth · spec eravos.organism.xen-synth
 * Additive poly synth for NON-STANDARD harmonic data: any tuning (EDO-N, equal divisions of irrational periods φ/π/e,
 * non-octave Carlos α/β/γ, Bohlen–Pierce, irrational-generator MOS, just intonation, typed Scala lists) played by
 * keys/notes (key − baseNote = scale step), and any partial spectrum (harmonic, stretched, piano-B, φ-series, bar /
 * membrane / bell modes, primes, tuning-matched). Each voice = up to 24 sine partials at f0 · r_k with their own
 * amplitudes, so irrational partial ratios are exact — a PeriodicWave could only hold integer harmonics.
 * Accepts note:trigger with an exact `freq` (from the Ratio Lattice), xen:tuning and xen:spectrum from the
 * Harmonic Analyzer / Recursive Spectra. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, XT = window.XenTheory;
  const PERIODS = ['2 (octave)', '3 (tritave)', 'φ (golden)', 'π', 'e', 'none'];
  const XEN_SCHEMA = { type: 'object' };
  OrganismFactory.define({
    id: 'eravos.xen-synth', preview: 'chord', domain: 'music', version: '1.0.0', label: 'Xen Synth', icon: '∿', accent: '#00ffcc', phase: 'P14',
    category: 'Xenharmonic', blurb: 'Play irrational frequencies: any tuning (φ, π, e, Bohlen–Pierce, 31-EDO, Carlos α, your own ratios) with any partial spectrum.',
    size: { w: 600, h: 620 }, minSize: { w: 460, h: 460 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.xen_in'],
    needs: { notes: ['Ignores the song key on purpose: the tuning IS the key. Key C4 (60) = step 0 by default.'], works_with: ['eravos.ratio-lattice', 'eravos.harmonic-analyzer', 'eravos.recursive-spectra'] },
    hooks: [
      S.audio_out('xen.hook.audio_out'), S.note_in('xen.hook.note_in'), S.midi_in('xen.hook.midi_in'),
      S.event('xen.hook.tuning_in', 'in', 'xen:tuning', XEN_SCHEMA, '1.0.0'),
      S.event('xen.hook.spectrum_in', 'in', 'xen:spectrum', XEN_SCHEMA, '1.0.0'),
      S.mod_in('xen.hook.mod_level', 'level'),
    ],
    config: [
      { key: 'tuning', type: 'enum', options: Object.keys(XT.TUNINGS), default: 'Golden generator (φ-MOS)', label: 'Tuning', group: 'TUNING' },
      { key: 'n', type: 'integer', default: 7, min: 1, max: 72, label: 'Steps N', group: 'TUNING' },
      { key: 'generator', type: 'enum', options: Object.keys(XT.GENERATORS), default: 'φ (golden)', label: 'Generator', group: 'TUNING' },
      { key: 'period', type: 'enum', options: PERIODS, default: '2 (octave)', label: 'Period', group: 'TUNING' },
      { key: 'scaleText', type: 'string', default: '9/8 5/4 phi 3/2 2^(11/12) 2/1', label: 'Scale (ratios / cents, last = period)', group: 'TUNING' },
      { key: 'baseHz', type: 'number', default: 261.63, min: 16, max: 1000, step: 0.01, unit: 'Hz', label: 'Base Hz', group: 'TUNING' },
      { key: 'baseNote', type: 'integer', default: 60, min: 0, max: 127, label: 'Base key', group: 'TUNING' },
      { key: 'spectrum', type: 'enum', options: Object.keys(XT.SPECTRA).concat(['received']), default: 'harmonic', label: 'Spectrum', group: 'SPECTRUM' },
      { key: 'partials', type: 'integer', default: 10, min: 1, max: 24, label: 'Partials', group: 'SPECTRUM' },
      { key: 'shape', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Shape', group: 'SPECTRUM', hint: 'the spectrum’s own parameter (octave stretch, B, power…)' },
      { key: 'tilt', type: 'number', default: 1.1, min: 0, max: 3, step: 0.01, label: 'Tilt', group: 'SPECTRUM' },
      { key: 'even', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Even', group: 'SPECTRUM' },
      { key: 'bright', type: 'number', default: 7000, min: 200, max: 16000, step: 1, unit: 'Hz', label: 'Bright', group: 'SPECTRUM' },
      { key: 'shimmer', type: 'number', default: 0.15, min: 0, max: 1, step: 0.01, label: 'Shimmer', group: 'SPECTRUM', hint: 'slow per-partial drift — beating made audible' },
      { key: 'spread', type: 'number', default: 2, min: 0, max: 40, step: 0.1, unit: '¢', label: 'Spread', group: 'SPECTRUM', hint: 'random detune per partial' },
      { key: 'attack', type: 'number', default: 0.01, min: 0.001, max: 4, step: 0.001, unit: 's', label: 'Attack', group: 'ENV' },
      { key: 'decay', type: 'number', default: 0.6, min: 0.01, max: 8, step: 0.01, unit: 's', label: 'Decay', group: 'ENV' },
      { key: 'sustain', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Sustain', group: 'ENV' },
      { key: 'release', type: 'number', default: 0.8, min: 0.01, max: 10, step: 0.01, unit: 's', label: 'Release', group: 'ENV' },
      { key: 'partialDecay', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Bell decay', group: 'ENV', hint: 'upper partials die faster (struck sounds)' },
      { key: 'level', type: 'number', default: 0.6, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'OUT' },
    ],
    ui_hooks: ['play_step'],
    defaultPreset: 'Golden Bells',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp;
      const out = ac.createGain(), level = ac.createGain(); out.connect(level);
      const levelMod = ctx.modBus('level', { min: 0, max: 1.5 }); levelMod.connect(level.gain);
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'xen' });
      // one slow shimmer LFO, scaled per partial into detune (cents)
      const shim = ac.createOscillator(); shim.frequency.value = 0.23; shim.start(); ctx.track(shim);
      const shim2 = ac.createOscillator(); shim2.frequency.value = 0.37 * XT.PHI; shim2.start(); ctx.track(shim2);
      [out, level].forEach(n => ctx.track(n));
      let tun = null, spec = null, received = null;
      function rebuild() {
        try {
          const per = P.get('period');
          tun = XT.tuning(P.get('tuning'), { n: P.get('n'), generator: P.get('generator'), period: per === 'none' ? 'none' : per, text: P.get('scaleText') });
        } catch (e) { ctx.fault('RUNTIME_002', 'tuning: ' + e.message); tun = XT.tuning('12-TET'); }
        const kind = P.get('spectrum');
        if (kind === 'received' && received) spec = received.slice(0, P.get('partials'));
        else {
          const S0 = XT.SPECTRA[kind] || XT.SPECTRA.harmonic, pr = S0.param ? S0.param.min + (S0.param.max - S0.param.min) * P.get('shape') : undefined;
          spec = XT.spectrum(kind === 'received' ? 'harmonic' : kind, { partials: P.get('partials'), param: pr, tilt: P.get('tilt'), even: P.get('even'), tuning: tun });
        }
        ctx.syncUI();
      }
      ['tuning', 'n', 'generator', 'period', 'scaleText', 'spectrum', 'partials', 'shape', 'tilt', 'even'].forEach(k => P.onChange(k, rebuild));
      P.onChange('level', (v) => dsp.setSmooth(level.gain, v, ac));
      level.gain.value = P.get('level');
      rebuild();

      const voices = []; const MAXV = 8;
      function freqOfStep(step) { return XT.freq(tun, step, P.get('baseHz')); }
      function noteOn(o) {
        const t = Math.max(o.time || ac.currentTime, ac.currentTime), vel = o.velocity === undefined ? 0.8 : o.velocity;
        const f0 = o.freq || freqOfStep(o.step);
        if (!(f0 > 0) || f0 > 20000) return null;
        while (voices.length >= MAXV) kill(voices[0], t);
        const amp = ac.createGain(); amp.gain.value = 0; amp.connect(out);
        const ny = ac.sampleRate * 0.45, br = P.get('bright'), sp = P.get('spread'), sh = P.get('shimmer'), pd = P.get('partialDecay');
        const parts = spec.filter(p => f0 * p.r < ny);
        const amps = parts.map(p => p.a / (1 + Math.pow(f0 * p.r / br, 2)));
        const norm = 0.28 / Math.sqrt(amps.reduce((s, a) => s + a * a, 0) || 1);
        const rnd = dsp.mulberry32((Math.round(f0 * 1000) ^ voices.length * 7919) >>> 0);
        const nodes = [];
        // per-voice taps of the two shared shimmer LFOs (so a finished voice unhooks with exactly two disconnects)
        const vs1 = ac.createGain(), vs2 = ac.createGain(); shim.connect(vs1); shim2.connect(vs2);
        const unhook = () => { try { shim.disconnect(vs1); } catch (e) {} try { shim2.disconnect(vs2); } catch (e) {} };
        const A = P.get('attack'), D = P.get('decay'), Sus = P.get('sustain');
        parts.forEach((p, k) => {
          const o2 = ac.createOscillator(); o2.frequency.value = f0 * p.r; o2.detune.value = (rnd() * 2 - 1) * sp;
          const g = ac.createGain(); g.gain.value = amps[k] * norm;
          if (pd > 0 && k > 0) { const tau = Math.max(0.03, D * 3 * Math.pow(1 - pd * 0.85, k)); g.gain.setValueAtTime(amps[k] * norm, t); g.gain.setTargetAtTime(amps[k] * norm * (1 - pd), t + A, tau); }
          if (sh > 0) { const dg = ac.createGain(); dg.gain.value = sh * (3 + 2 * Math.sqrt(k + 1)) * (k % 2 ? -1 : 1); (k % 3 ? vs1 : vs2).connect(dg); dg.connect(o2.detune); nodes.push(dg); }
          o2.connect(g); g.connect(amp); o2.start(t); nodes.push(o2, g);
        });
        dsp.adsr(amp.gain, t, { a: A, d: D, s: Sus, peak: 0.2 + 0.8 * vel });
        nodes.push(vs1, vs2);
        const v = { amp, nodes, unhook, step: o.step, note: o.note, f0, t, off: Infinity };
        voices.push(v);
        if (o.duration !== undefined) release(v, t + o.duration);
        ctx.lastVoice = { f0, partials: parts.map(p => f0 * p.r), t };
        return v;
      }
      function release(v, t) {
        if (v.off !== Infinity && v.off <= t) return;
        v.off = t; const R = P.get('release');
        dsp.release(v.amp.gain, t, R);
        v.nodes.forEach(n => { if (n.stop) { try { n.stop(t + R * 1.6 + 0.05); } catch (e) {} } });
        const last = v.nodes.find(n => n.stop);
        const done = () => { v.unhook(); v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); try { v.amp.disconnect(); } catch (e) {} const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1); };
        if (last) last.onended = done; else done();
      }
      function kill(v, t) {
        const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1);
        v.amp.gain.cancelScheduledValues(t); v.amp.gain.setTargetAtTime(0, t, 0.005);
        const last = v.nodes.filter(n => n.stop); last.forEach(n => { try { n.stop(t + 0.05); } catch (e) {} });
        const done = () => { v.unhook(); v.nodes.forEach(n => { try { n.disconnect(); } catch (e) {} }); try { v.amp.disconnect(); } catch (e) {} };
        if (last.length) last[last.length - 1].onended = done; else done();
      }
      const keyOf = (note) => note - P.get('baseNote');
      ctx.onNote((p) => noteOn({ step: keyOf(p.note), note: p.note, freq: p.freq, velocity: p.velocity, time: p.time, duration: p.duration }));
      ctx.onMidi((p) => { if (p.on) noteOn({ step: keyOf(p.note), note: p.note, velocity: p.velocity }); else voices.filter(v => v.note === p.note && v.off === Infinity).forEach(v => release(v, ac.currentTime)); });
      ctx.audition = (p) => noteOn({ step: p.step !== undefined ? p.step : keyOf(p.note || 60), note: p.note, freq: p.freq, velocity: p.velocity || 0.8, duration: p.duration || 1.5 });
      ctx.auditionOff = (p) => voices.filter(v => v.off === Infinity && (p.step !== undefined ? v.step === p.step : v.note === p.note)).forEach(v => release(v, ac.currentTime));
      ctx.onUI('play_step', { type: 'object', required: ['step', 'on'] }, (p) => {
        if (p.on) noteOn({ step: p.step, note: -1000 - p.step, velocity: 0.8 });
        else voices.filter(v => v.step === p.step && v.off === Infinity).forEach(v => release(v, ac.currentTime));
      });
      const forMe = (p) => !p.target || p.target === '*' || p.target === ctx.id;
      ctx.on('xen:tuning', XEN_SCHEMA, (p) => {
        if (!forMe(p) || !Array.isArray(p.steps) || !p.steps.length) return;
        const per = Number(p.period) > 0 ? Number(p.period) : 1200;
        const txt = p.steps.filter(c => c > 0.0001 && c < per).map(c => (+c).toFixed(3)).concat([(+per).toFixed(3)]).join(' ');
        P.set('scaleText', txt); P.set('tuning', 'Custom (text)');
        ctx.emitUI('received', { what: 'tuning', name: p.name || 'tuning', from: p._from });
      });
      ctx.on('xen:spectrum', XEN_SCHEMA, (p) => {
        if (!forMe(p) || !Array.isArray(p.partials) || !p.partials.length) return;
        const base = p.partials[0].r || 1;
        received = p.partials.filter(x => x && x.r > 0).map(x => ({ r: x.r / base, a: Math.max(0, x.a === undefined ? 1 : x.a) })).sort((a, b) => a.r - b.r).slice(0, 24);
        P.set('partials', Math.min(24, received.length)); P.set('spectrum', 'received'); rebuild();
        ctx.emitUI('received', { what: 'spectrum', name: p.name || 'spectrum', from: p._from });
      });
      ctx.saveExtra = () => ({ received });
      ctx.loadExtra = (x) => { if (x && Array.isArray(x.received)) { received = x.received; rebuild(); } };
      ctx.stateExtra = () => ({
        tun: { name: tun.name, steps: tun.steps, period: tun.period, describe: tun.describe, equalStep: !!tun.equalStep },
        spec: spec.map(p => ({ r: p.r, a: p.a, d: XT.describeRatio(p.r, 24) })),
      });
      ctx.internals = { get tun() { return tun; }, get spec() { return spec; }, voices, freqOfStep };
      ctx.onDispose(() => voices.slice().forEach(v => kill(v, ac.currentTime)));
      return {};
    },
  });
})();
