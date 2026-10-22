/* eravos.acid-synth 2.0.0 — TB-303 model (P2) · resolves F-11(acid)
 * Accent and slide are per-note articulations that change the envelope circuit.
 * Accent-sweep capacitor: consecutive accents stack cutoff (charge leaks τ = 0.35 s).
 * Slide: pitch glides 60 ms to the NEXT note, gate held, no env retrigger.
 * Generator: scale-locked line → seq:pattern_suggest (never touches the sequencer, K-3). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.acid-synth', preview: 'bass', domain: 'music', version: '2.0.0', label: 'Acid Synth', icon: '⚡', accent: '#00ff88', phase: 'P2',
    category: 'Sound sources', blurb: 'The squelchy 303 line. Has a GENERATE button that writes an in-key bassline.',
    size: { w: 470, h: 420 }, minSize: { w: 380, h: 330 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in'],
    hooks: [
      S.audio_out('acid.hook.audio_out'), S.note_in('acid.hook.note_in'), S.midi_in('acid.hook.midi_in'), S.theory_in('acid.hook.theory_in'),
      S.mod_in('acid.hook.mod_cutoff', 'cutoff'), S.mod_in('acid.hook.mod_res', 'res'),
      S.event('acid.hook.pattern_out', 'out', 'seq:pattern_suggest', { type: 'object', required: ['target', 'track', 'steps'] }, '1.0.0'),
    ],
    config: [
      { key: 'cutoff', type: 'number', default: 350, min: 30, max: 5000, step: 1, unit: 'Hz', label: 'CUTOFF', group: 'FILTER' },
      { key: 'res', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'RES', group: 'FILTER' },
      { key: 'envMod', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'ENV MOD', group: 'FILTER' },
      { key: 'decay', type: 'number', default: 0.3, min: 0.05, max: 2, step: 0.01, unit: 's', label: 'Decay', group: 'CIRCUIT' },
      { key: 'accent', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'Accent', group: 'CIRCUIT' },
      { key: 'drive', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Drive', group: 'CIRCUIT' },
      { key: 'level', type: 'number', default: 1, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'CIRCUIT', hint: 'output level (every instrument has one)' },
      { key: 'wave', type: 'enum', options: ['saw', 'square'], default: 'saw', label: 'Wave', group: 'CIRCUIT' },
      { key: 'octave', type: 'integer', default: 0, min: -2, max: 2, label: 'Octave', group: 'CIRCUIT' },
      { key: 'tune', type: 'number', default: 0, min: -1, max: 1, step: 0.01, unit: 'st', label: 'Tune', group: 'CIRCUIT' },
    ],
    ui_hooks: ['generate'],
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp, MT = window.MusicTheory;
      const osc = ac.createOscillator(); osc.type = P.get('wave') === 'saw' ? 'sawtooth' : 'square'; osc.frequency.value = 110; osc.start(); ctx.track(osc);
      const f = [0, 1, 2].map(() => { const b = ac.createBiquadFilter(); b.type = 'lowpass'; return b; });
      osc.connect(f[0]); f[0].connect(f[1]); f[1].connect(f[2]);
      const vca = ac.createGain(); vca.gain.value = 0; f[2].connect(vca);
      const pre = ac.createGain(), sh = ac.createWaveShaper(), out = ac.createGain(); out.gain.value = 0.5;
      vca.connect(pre); pre.connect(sh); sh.connect(out);
      const lvlOut = ac.createGain(); lvlOut.gain.value = P.get('level'); out.connect(lvlOut); ctx.track(lvlOut); P.onChange('level', (v) => dsp.setSmooth(lvlOut.gain, v, ac));
      ctx.port('out', { kind: 'audio', direction: 'out', node: lvlOut, label: 'acid' });
      const cutMod = ctx.modBus('cutoff', { min: -4800, max: 4800 }); f.forEach(b => cutMod.connect(b.detune));
      const resMod = ctx.modBus('res', { min: 0, max: 22 }); resMod.connect(f[0].Q);
      function applyStatic() {
        const r = P.get('res'); f[0].Q.value = 0.7 + r * 21; f[1].Q.value = 0.5 + r * 2; f[2].Q.value = 0;
        sh.curve = dsp.curve('tanh', P.get('drive')); pre.gain.value = 1 + P.get('drive') * 3;
        out.gain.value = 0.45 / (0.5 + dsp.curveRms(sh.curve) * 0.6);
        osc.type = P.get('wave') === 'saw' ? 'sawtooth' : 'square';
        const c = P.get('cutoff'); f.forEach(b => { if (!ctx._busyUntil || ac.currentTime > ctx._busyUntil) b.frequency.setTargetAtTime(c, ac.currentTime, 0.01); });
      }
      applyStatic();
      ['res', 'drive', 'wave', 'cutoff'].forEach(k => P.onChange(k, applyStatic));

      // accent-sweep capacitor
      let charge = 0, chargeT = 0;
      function chargeAt(t) { return charge * Math.exp(-Math.max(0, t - chargeT) / 0.35); }
      ctx.chargeAt = chargeAt;
      let prev = null; // {slide, offTime}
      function noteOn(note, vel, t, o) {
        o = o || {};
        t = Math.max(t, ac.currentTime);
        const midi = note + 12 * P.get('octave') + P.get('tune');
        const hz = MT.hz(midi);
        const accented = !!o.accent;
        const slideIn = prev && prev.slide && prev.hold > t - 1e-4; // previous note asked to slide into this one
        if (accented) { charge = chargeAt(t) + P.get('accent') * 0.35; chargeT = t; }
        if (slideIn) {
          osc.frequency.cancelScheduledValues(t); osc.frequency.setValueAtTime(prev.hz, t);
          osc.frequency.setTargetAtTime(hz, t, 0.06 / 4); // ≈ reaches target by 60 ms
          osc.frequency.setValueAtTime(hz, t + 0.06);
          if (typeof vca.gain.cancelAndHoldAtTime === 'function') vca.gain.cancelAndHoldAtTime(t);
        } else {
          osc.frequency.cancelScheduledValues(t); osc.frequency.setValueAtTime(hz, t);
          // envelopes retrigger
          const base = P.get('cutoff'), em = P.get('envMod');
          const peakOct = em * 4 + (accented ? P.get('accent') * (em + 0.5) : 0) + chargeAt(t) * 2;
          const peak = Math.min(18000, base * Math.pow(2, peakOct));
          const dec = accented ? 0.2 : P.get('decay');
          f.forEach(b => { b.frequency.cancelScheduledValues(t); b.frequency.setValueAtTime(peak, t); b.frequency.setTargetAtTime(base, t + 0.002, dec / 3); });
          ctx._busyUntil = t + dec * 2;
          const a = (0.55 + vel * 0.3) * (accented ? dsp.dbToGain(P.get('accent') * 6) : 1);
          vca.gain.cancelScheduledValues(t); vca.gain.setValueAtTime(0, t); vca.gain.linearRampToValueAtTime(a, t + 0.003);
          vca.gain.setTargetAtTime(a * 0.65, t + 0.003, accented ? 0.08 : P.get('decay') / 2);
        }
        const dur = o.duration !== undefined ? o.duration : 0.12;
        const hold = o.slide ? t + dur + 0.25 : t + dur;  // slide: gate held into the next note
        // 3.37 (QA RCA: setValueAtTime(vca.gain.value, …) read the gain NOW — 0 when notes are scheduled ahead — so every
        // note-off jumped to silence in one sample = a click): the release continues from the decaying envelope
        if (!o.slide) { vca.gain.setTargetAtTime(0, t + dur, 0.008); }
        else { vca.gain.setTargetAtTime(0, hold, 0.008); }
        prev = { slide: !!o.slide, hold, t, hz };
        ctx.lastNote = { t, hz, accented, slideIn, peakCharge: chargeAt(t) };
        if (accented) reportCharge();
      }
      let chargeTimer = null;
      function reportCharge() {
        if (chargeTimer) return;
        chargeTimer = ctx.interval(() => { const c = chargeAt(ac.currentTime); ctx.emitUI('charge', { value: c }); if (c < 0.005) { clearInterval(chargeTimer); chargeTimer = null; } }, 33);
      }
      ctx.noteOn = noteOn;
      ctx.bendTargets([osc.detune]);   // 3.52 curves
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, { accent: p.accent, slide: p.slide, duration: p.duration }));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime, { accent: p.velocity > 0.8, duration: 0.25 }); });
      ctx.onKey(() => ctx.syncUI());

      // generator — seeded, scale degrees only, root-weighted
      function generate(o) {
        const rnd = dsp.mulberry32((o.seed >>> 0) || 1);
        const len = o.length || 16, steps = [];
        const bag = [1, 1, 2, 3, 4, 5, 5, 6, 7];
        for (let i = 0; i < len; i++) {
          const on = rnd() < (o.density === undefined ? 0.6 : o.density) || i === 0;
          const degree = bag[Math.floor(rnd() * bag.length)];
          const octave = Math.floor(rnd() * Math.max(1, Math.round(o.range || 1)));
          steps.push({ on, degree, octave: octave - 1, accent: on && rnd() < (o.accentRate === undefined ? 0.3 : o.accentRate), slide: on && rnd() < (o.slideRate === undefined ? 0.2 : o.slideRate) });
        }
        return steps;
      }
      ctx.generate = generate;
      ctx.onUI('generate', { type: 'object', required: ['target'] }, (p) => {
        const steps = generate(p);
        if (!ctx.K.registry.has(p.target)) return ctx.fault('RUNTIME_003', 'generate: target sequencer not mounted');
        ctx.emit('seq:pattern_suggest', { target: p.target, track: p.track === undefined ? 'acid' : p.track, steps, source: ctx.id, instrument: ctx.id });
        ctx.emitUI('generated', { steps });
      });
      ctx.audition = (p) => noteOn(p.note || 45, 0.9, ac.currentTime, { accent: !!p.accent, duration: 0.25 });
      return {};
    },
  });
})();
