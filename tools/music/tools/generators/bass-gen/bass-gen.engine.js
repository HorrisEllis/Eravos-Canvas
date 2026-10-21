/* eravos.bass-gen 1.0.0 — Bassline: EDM Lab's bass brain as a part of its own (map eravos.phase48-map P48.10).
 * It plays the root of the chord on the rhythm: the chord comes from a Chords wired into its chord in (else its own progression),
 * the rhythm from a Groove wired into its groove in (its kick — EDM Lab's rule), else its own pattern. It makes no sound: notes go
 * to each bass tool wired from its note out (Reese Bass, Wobble Bass, Acid Synth, Wub Osc…). High ENERGY jumps an octave on the
 * off-beat and shortens the notes, as EDM Lab 3.0 did. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const PROG = { 'i-VI-III-VII': [1, 6, 3, 7], 'i-iv-v-i': [1, 4, 5, 1], 'vi-IV-I-V': [6, 4, 1, 5], 'i-i-VI-VII': [1, 1, 6, 7], 'i-v-VI-iv': [1, 5, 6, 4] };
  // its own rhythm when no Groove is wired in: steps of a 16-step bar
  const PATTERNS = { 'groove kick': [0, 10], 'every beat': [0, 4, 8, 12], 'offbeats': [2, 6, 10, 14], 'eighths': [0, 2, 4, 6, 8, 10, 12, 14], 'half-time': [0] };
  OrganismFactory.define({
    id: 'eravos.bass-gen', domain: 'music', version: '1.0.0', label: 'Bassline', icon: '🎸', accent: '#7c4dff',
    category: 'Generators', blurb: 'The root of the chord on the kick: follows a wired Chords and Groove, plays any bass tool wired to it.',
    size: { w: 400, h: 300 }, minSize: { w: 320, h: 240 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],   // audio_out: its mod input is an audio-rate port
    provides: ['capability.generation', 'capability.note_out'],
    hooks: [
      S.note_out('bassg.hook.note_out'), S.transport_in('bassg.hook.transport_in'), S.theory_in('bassg.hook.theory_in'),
      S.event('bassg.hook.chord_in', 'in', 'harmony:chord', { type: 'object' }, '1.0.0'),
      S.event('bassg.hook.groove_in', 'in', 'groove:step', { type: 'object' }, '1.0.0'),
      S.mod_in('bassg.hook.mod_energy', 'energy'),
    ],
    config: [
      { key: 'rhythm', type: 'enum', options: Object.keys(PATTERNS), default: 'groove kick', label: 'Rhythm', group: 'BASSLINE', hint: 'groove kick = on the kick of a wired Groove (its own two hits when none is wired)' },
      { key: 'energy', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'ENERGY', group: 'BASSLINE', hint: 'harder, shorter, and an octave jump on the off-beat when high' },
      { key: 'octave', type: 'integer', default: 2, min: 0, max: 4, label: 'Octave', group: 'BASSLINE' },
      { key: 'length', type: 'number', default: 2.5, min: 0.5, max: 8, step: 0.1, unit: 'steps', label: 'Length', group: 'BASSLINE' },
      { key: 'progression', type: 'enum', options: Object.keys(PROG), default: 'i-VI-III-VII', label: 'Own chords', group: 'ALONE', hint: 'used only when no Chords is wired in' },
      { key: 'chordBars', type: 'enum', options: [1, 2, 4], default: 1, label: 'Bars/chord', group: 'ALONE' },
    ],
    ui_hooks: [],
    presets: {},
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory;
      const cs = ctx.modBus('energy', { min: 0, max: 1 }), an = ac.createAnalyser(); an.fftSize = 32; cs.connect(an); const mb = new Float32Array(32);
      const energy = () => { an.getFloatTimeDomainData(mb); return Math.max(0, Math.min(1, P.get('energy') + (mb[mb.length - 1] || 0))); };
      let heard = null;   // the last chord from a wired Chords
      const from = (hook, p) => p && p._from && ctx.wiredIn(hook).includes(p._from);
      ctx.on('harmony:chord', { type: 'object' }, (p) => { if (from('bassg.hook.chord_in', p)) heard = p; });
      const ownDegree = (bar) => { const pr = PROG[P.get('progression')]; return pr[Math.floor(bar / +P.get('chordBars')) % pr.length]; };
      const degree = (bar) => (heard && ctx.wiredIn('bassg.hook.chord_in').length ? heard.degree : ownDegree(bar));
      let lastNote = null;
      function play(t, bar, step, stepDur) {
        const e = energy(), k = ctx.key, up = step % 8 === 4 && e > 0.7 ? 1 : 0;
        const note = MT.degreeToMidi(degree(bar), P.get('octave') + up, k.root, k.scale), dur = stepDur * P.get('length') * (e > 0.6 ? 0.65 : 1);
        ctx.wiredOut('bassg.hook.note_out').forEach(target => ctx.emit('note:trigger', { target, note, velocity: 0.7 + 0.3 * e, time: t, duration: dur, slide: step % 4 !== 0 }));
        lastNote = { note, name: MT.noteName(note), time: t };
        ctx.emitUI('bass_note', lastNote);
      }
      const following = () => P.get('rhythm') === 'groove kick' && ctx.wiredIn('bassg.hook.groove_in').length > 0;
      ctx.on('groove:step', { type: 'object' }, (p) => { if (following() && from('bassg.hook.groove_in', p) && p.kick) play(p.time, p.bar, p.step % 16, p.stepDur); });
      ctx.onTick((tk) => {
        if (following()) return;
        const bar = Math.floor(tk.step16 / 16), step = tk.step16 % 16;
        if (PATTERNS[P.get('rhythm')].includes(step)) play(tk.time, bar, step, tk.stepDur);
      });
      ctx.stateExtra = () => ({ note: lastNote, following: following(), chordFrom: ctx.wiredIn('bassg.hook.chord_in').length > 0 });
      return { unmount() { try { cs.disconnect(); } catch (e) {} } };
    },
  });
})();
