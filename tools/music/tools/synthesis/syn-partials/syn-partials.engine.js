/* eravos.syn-partials 1.0.0 — Partials (P44 · synthesis) · spec eravos.organism.syn-partials
 * Additive synthesis: every note is 24 sine partials you draw — two spectra, A and B. MORPH sets where between A and B
 * a note sits; EVOLVE (seconds) makes each note travel from that point to B. STRETCH pulls the partials off the
 * harmonic series (− tight, + bell / metal / piano-string), DAMP makes the high partials die first (plucks, mallets),
 * TILT and ODD/EVEN reshape the whole spectrum. Partials above 18 kHz are never built (no aliasing, no wasted voices).
 * Per voice: 24 oscillators → per-partial EVOLVE gain → per-partial DAMP gain → amp ADSR. 6 voices, oldest stolen. */
(function () {
  'use strict';
  const S = OrganismSDK.STD, NP = 24;
  const series = (fn) => Array.from({ length: NP }, (_, i) => +fn(i + 1).toFixed(3));
  const SAW = series(k => 1 / k), ORGAN = series(k => [1, 0.7, 0.5, 0.6, 0, 0.35, 0, 0.3][k - 1] || 0), HOLLOW = series(k => k % 2 ? 1 / k : 0), BELL = series(k => [1, 0, 0.6, 0, 0.4, 0.5, 0, 0.3, 0, 0.25][k - 1] || 0.04 / k);
  OrganismFactory.define({
    id: 'eravos.syn-partials', domain: 'music', version: '1.0.0', label: 'Partials', icon: '✳', accent: '#ffb547', phase: 'P44',
    category: 'Synthesis', blurb: 'Additive synth: draw 24 harmonics (two spectra), morph and evolve between them, stretch them into bells.',
    size: { w: 600, h: 600 }, minSize: { w: 440, h: 420 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.oscillator'],
    hooks: [S.audio_out('part.hook.audio_out'), S.note_in('part.hook.note_in'), S.midi_in('part.hook.midi_in'), S.mod_in('part.hook.mod_pitch', 'pitch')],
    face: ['morph', 'evolve', 'stretch', 'damp', 'tilt', 'level'],
    config: [
      { key: 'partialsA', type: 'array', default: SAW, label: 'Spectrum A', group: 'SPECTRA', hidden: true },
      { key: 'partialsB', type: 'array', default: HOLLOW, label: 'Spectrum B', group: 'SPECTRA', hidden: true },
      { key: 'morph', type: 'number', default: 0, min: 0, max: 1, step: 0.001, label: 'A ↔ B', group: 'SPECTRA', hint: 'where between spectrum A and B each note starts' },
      { key: 'evolve', type: 'number', default: 0, min: 0, max: 10, step: 0.01, unit: 's', label: 'Evolve', group: 'SPECTRA', hint: 'each note travels to spectrum B over this long (0 = stays put)' },
      { key: 'tilt', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Tilt', group: 'SHAPE', hint: '− darker · + brighter' },
      { key: 'oddEven', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Odd ↔ Even', group: 'SHAPE', hint: '− only odd partials (hollow, clarinet) · + only even (octave-up, airy)' },
      { key: 'stretch', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Stretch', group: 'SHAPE', hint: '0 = harmonic · + spreads the partials apart (bells, metal, piano strings)' },
      { key: 'damp', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Damp', group: 'SHAPE', hint: 'high partials fade first (plucks, mallets)' },
      { key: 'octave', type: 'integer', default: 0, min: -4, max: 4, label: 'Octave', group: 'PITCH' },
      { key: 'attack', type: 'number', default: 0.01, min: 0.001, max: 6, step: 0.001, unit: 's', label: 'Attack', group: 'AMP' },
      { key: 'decay', type: 'number', default: 0.6, min: 0.01, max: 10, step: 0.01, unit: 's', label: 'Decay', group: 'AMP' },
      { key: 'sustain', type: 'number', default: 0.7, min: 0, max: 1, step: 0.01, label: 'Sustain', group: 'AMP' },
      { key: 'release', type: 'number', default: 0.4, min: 0.01, max: 10, step: 0.01, unit: 's', label: 'Release', group: 'AMP' },
      { key: 'level', type: 'number', default: 0.7, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'AMP' },
    ],
    ui_hooks: ['partial_set'],
    defaultPreset: 'Glass Keys',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory, MAXV = 6, TOP = Math.min(18000, ac.sampleRate * 0.45);
      const out = ctx.track(ac.createGain()); out.gain.value = P.get('level') * 0.5;
      ctx.port('out', { kind: 'audio', direction: 'out', node: out, label: 'partials' });
      const pitchMod = ctx.modBus('pitch', { min: -1200, max: 1200 });
      const voices = [];
      // the spectrum a note plays at position x (0 = A, 1 = B), shaped by tilt and odd/even, RMS-normalised to one level
      function spectrum(x) {
        const A = P.get('partialsA'), B = P.get('partialsB'), tilt = P.get('tilt'), oe = P.get('oddEven');
        const a = []; let e = 0;
        for (let k = 1; k <= NP; k++) {
          let v = (+A[k - 1] || 0) * (1 - x) + (+B[k - 1] || 0) * x;
          v *= Math.pow(k, tilt * 1.2);
          if (k > 1) v *= k % 2 ? (oe > 0 ? 1 - oe : 1) : (oe < 0 ? 1 + oe : 1);
          a.push(Math.max(0, v)); e += v * v;
        }
        const g = e > 1e-9 ? 0.5 / Math.sqrt(e / 2) : 0;
        return a.map(v => v * g);
      }
      const ratioOf = (k) => k * (1 + P.get('stretch') * 0.035 * (k - 1));
      // stretched partials pull the heard pitch sharp — re-centre the series on the note (energy-weighted over the
      // first six partials), the way a piano tuner or a bell founder tunes a stretched instrument to its note
      function centre(sp) {   // each partial counted at its level half a second in (DAMP fading it), where the ear settles on a pitch
        const dm = P.get('damp'), D = P.get('decay'); let a = 0, b = 0;
        for (let k = 1; k <= 6; k++) { const tau = Math.max(0.005, D / (1 + dm * (k - 1) * 0.6) / 2), lv = k > 1 ? 1 - dm * (1 - Math.exp(-0.5 / tau)) : 1, e = sp[k - 1] * sp[k - 1] * lv * lv; a += e * k; b += e * ratioOf(k); }
        return b > 1e-12 ? a / b : 1;
      }
      function makeVoice(note, vel, t) {
        const f = MT.hz(note + 12 * P.get('octave')), x0 = P.get('morph'), ev = P.get('evolve'), damp = P.get('damp');
        const s0 = spectrum(x0), s1 = ev > 0 ? spectrum(1) : s0, D = P.get('decay'), fc = f * centre(s0);
        const amp = ac.createGain(); amp.gain.value = 0; amp.connect(out);
        const parts = [], wP = ctx.modWired('pitch');
        for (let k = 1; k <= NP; k++) {
          const fk = fc * ratioOf(k); if (fk >= TOP || (s0[k - 1] < 1e-5 && s1[k - 1] < 1e-5)) continue;
          const o = ac.createOscillator(); o.frequency.value = fk; if (wP) pitchMod.connect(o.detune);
          const gE = ac.createGain(), gD = ac.createGain(); o.connect(gE); gE.connect(gD); gD.connect(amp);
          gE.gain.setValueAtTime(s0[k - 1], t); if (ev > 0) gE.gain.linearRampToValueAtTime(s1[k - 1], t + ev);
          if (damp > 0 && k > 1) { const tau = D / (1 + damp * (k - 1) * 0.6); gD.gain.setValueAtTime(1, t); gD.gain.setTargetAtTime(1 - damp, t + P.get('attack'), Math.max(0.005, tau / 2)); }
          o.start(t, k * 0.0007); parts.push({ o, gE, gD });
        }
        const peak = 0.4 + 0.6 * vel, A = P.get('attack'), Sus = P.get('sustain');
        amp.gain.setValueAtTime(0, t); amp.gain.linearRampToValueAtTime(peak, t + A); amp.gain.setTargetAtTime(peak * Sus, t + A, D / 3);
        const v = { note, amp, parts, wP, start: t, released: false, end: Infinity }; voices.push(v); return v;
      }
      function release(v, t) {
        if (v.released) return; v.released = true; v.relT = t;
        const R = P.get('release'), g = v.amp.gain;
        if (typeof g.cancelAndHoldAtTime === 'function') g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
        g.setTargetAtTime(0, t, R / 4); v.end = t + R * 1.6 + 0.05;
        v.parts.forEach(p => { try { p.o.stop(v.end); } catch (e) {} });
        ctx.atAudioTime(v.end + 0.1, () => cleanup(v));
      }
      function kill(v, t) { const g = v.amp.gain; g.cancelScheduledValues(t); g.setTargetAtTime(0, t, 0.004); v.released = true; v.end = t + 0.03; v.parts.forEach(p => { try { p.o.stop(t + 0.03); } catch (e) {} }); ctx.atAudioTime(t + 0.08, () => cleanup(v)); }
      function cleanup(v) {
        const i = voices.indexOf(v); if (i >= 0) voices.splice(i, 1);
        v.parts.forEach(p => { try { if (v.wP) pitchMod.disconnect(p.o.detune); p.o.disconnect(); p.gD.disconnect(); } catch (e) {} }); try { v.amp.disconnect(); } catch (e) {}
        ctx.emitUI('voices', { active: voices.filter(x => !x.released).map(x => x.note) });
      }
      function noteOn(note, vel, t, dur) {
        t = Math.max(t, ac.currentTime);
        const live = voices.filter(v => v.end > t);
        if (live.length >= MAXV) { const victim = live.filter(v => v.released).sort((a, b) => a.relT - b.relT)[0] || live.sort((a, b) => a.start - b.start)[0]; voices.splice(voices.indexOf(victim), 1); kill(victim, t); }
        const v = makeVoice(note, vel, t); if (dur !== undefined) release(v, t + Math.max(0.01, dur));
        ctx.emitUI('voices', { active: voices.filter(x => !x.released).map(x => x.note) }); return v;
      }
      function noteOff(note, t) { t = Math.max(t || ac.currentTime, ac.currentTime); voices.filter(v => v.note === note && !v.released).forEach(v => release(v, t)); }
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration === undefined ? 0.25 : p.duration));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime); else noteOff(p.note); });
      ctx.audition = (p) => noteOn(p.note || 60, p.velocity || 0.85, ac.currentTime, p.duration || 0.8);
      ctx.auditionOff = (p) => noteOff(p.note);
      // drawing one bar: { set: 'A'|'B', k: 1..24, v: 0..1 }
      ctx.onUI('partial_set', { type: 'object', required: ['set', 'k', 'v'] }, (p) => {
        const key = p.set === 'B' ? 'partialsB' : 'partialsA', arr = (P.get(key) || []).slice(); while (arr.length < NP) arr.push(0);
        const k = Math.max(1, Math.min(NP, Math.round(p.k))); arr[k - 1] = Math.max(0, Math.min(1, +p.v || 0)); P.set(key, arr);
      });
      P.onChange('level', (v) => out.gain.setTargetAtTime(v * 0.5, ac.currentTime, 0.01));
      ctx.internals = { voices, spectrum, ratioOf, centre };
      return { unmount() { voices.slice().forEach(v => kill(v, ac.currentTime)); } };
    },
    spectra: { SAW, ORGAN, HOLLOW, BELL, NP },
  });
})();
