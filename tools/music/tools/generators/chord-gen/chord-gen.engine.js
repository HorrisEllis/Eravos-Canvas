/* eravos.chord-gen 1.0.0 — Chords: EDM Lab's harmony brain as a part of its own (map eravos.phase48-map P48.10).
 * A progression in the song key, voiced by TENSION: triad + octave → add9 → 7sus4 → a squeezed cluster (EDM Lab 3.0's voicing
 * rule, carried over). It makes no sound: every chord goes as notes to each poly tool wired from its note out (Pad Forge,
 * Supersaw, Retro Poly…), and as harmony:chord to each part wired from its chord out (the Bassline follows it).
 * The audit (specs/eravos.decomposition.spec) found the chord job inside EDM Lab, Supersaw and Pitch with no tool for it. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const PROG = { 'i-VI-III-VII': [1, 6, 3, 7], 'i-iv-v-i': [1, 4, 5, 1], 'vi-IV-I-V': [6, 4, 1, 5], 'i-i-VI-VII': [1, 1, 6, 7], 'i-v-VI-iv': [1, 5, 6, 4] };
  const CHORD = { type: 'object', required: ['degree', 'notes', 'time'] };
  OrganismFactory.define({
    id: 'eravos.chord-gen', domain: 'music', version: '1.0.0', label: 'Chords', icon: '🎹', accent: '#b066ff',
    category: 'Generators', blurb: 'A chord progression in key, voiced by TENSION: it plays any poly tool wired to it and tells the Bassline the chord.',
    size: { w: 420, h: 340 }, minSize: { w: 340, h: 260 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],   // audio_out: its mod input is an audio-rate port
    provides: ['capability.generation', 'capability.note_out', 'capability.harmony'],
    hooks: [
      S.note_out('chordg.hook.note_out'), S.transport_in('chordg.hook.transport_in'), S.theory_in('chordg.hook.theory_in'),
      S.event('chordg.hook.chord_out', 'out', 'harmony:chord', CHORD, '1.0.0'),
      S.mod_in('chordg.hook.mod_tension', 'tension'),
    ],
    config: [
      { key: 'progression', type: 'enum', options: Object.keys(PROG), default: 'i-VI-III-VII', label: 'Progression', group: 'HARMONY' },
      { key: 'chordBars', type: 'enum', options: [1, 2, 4], default: 1, label: 'Bars/chord', group: 'HARMONY' },
      { key: 'tension', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'TENSION', group: 'HARMONY', hint: 'triad → add9 → 7sus4 → cluster' },
      { key: 'energy', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'ENERGY', group: 'PLAY', hint: 'how hard the chords are played' },
      { key: 'octave', type: 'integer', default: 3, min: 2, max: 5, label: 'Octave', group: 'PLAY' },
      { key: 'gate', type: 'number', default: 0.95, min: 0.1, max: 1, step: 0.01, label: 'Length', group: 'PLAY', hint: 'how much of its bars a chord holds' },
    ],
    ui_hooks: [],
    presets: {},
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory;
      const cs = ctx.modBus('tension', { min: 0, max: 1 }), an = ac.createAnalyser(); an.fftSize = 32; cs.connect(an); const mb = new Float32Array(32);
      const tension = () => { an.getFloatTimeDomainData(mb); return Math.max(0, Math.min(1, P.get('tension') + (mb[mb.length - 1] || 0))); };
      function voicing(degree, ten) {
        const k = ctx.key, o = P.get('octave'), tri = MT.chord(degree, k.root, k.scale, 'triad', o), r = tri[0];
        if (ten < 0.25) return tri.concat([tri[0] + 12]);
        if (ten < 0.5) return [tri[0], tri[1], tri[2], MT.degreeToMidi(degree + 8, o, k.root, k.scale)];                        // add9
        if (ten < 0.75) { const s = MT.chord(degree, k.root, k.scale, 'sus4', o); return [s[0], s[1], s[2], MT.degreeToMidi(degree + 6, o, k.root, k.scale)]; }   // 7sus4
        return [r, r + 6, r + 13, tri[2] + 12];                                                                                  // cluster
      }
      const chordAt = (bar) => { const pr = PROG[P.get('progression')]; return pr[Math.floor(bar / +P.get('chordBars')) % pr.length]; };
      ctx.voicing = voicing; ctx.chordAt = chordAt;
      let last = null;
      ctx.onTick((tk) => {
        const bar = Math.floor(tk.step16 / 16), step = tk.step16 % 16, cb = +P.get('chordBars');
        if (step !== 0 || bar % cb !== 0) return;
        const degree = chordAt(bar), notes = voicing(degree, tension()), dur = cb * 16 * tk.stepDur * P.get('gate'), vel = 0.45 + 0.45 * P.get('energy');
        ctx.wiredOut('chordg.hook.note_out').forEach(target => notes.forEach(n => ctx.emit('note:trigger', { target, note: n, velocity: vel, time: tk.time, duration: dur })));
        last = { degree, notes, name: MT.chordName(notes.slice().sort((a, b) => a - b)), time: tk.time, bar, bars: cb, stepDur: tk.stepDur };
        ctx.emit('harmony:chord', last);
        ctx.emitUI('chord', last);
      });
      ctx.stateExtra = () => ({ chord: last });
      return { unmount() { try { cs.disconnect(); } catch (e) {} } };
    },
  });
})();
