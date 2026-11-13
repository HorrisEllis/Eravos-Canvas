/* eravos.bass-gen 2.0.0 — Bassline: EDM Lab's bass brain as a part of its own (map eravos.phase48-map P48.10).
 * It plays the root of the chord on the rhythm: the chord comes from a Chords wired into its chord in (else its own progression),
 * the rhythm from a Groove wired into its groove in (its kick — EDM Lab's rule), else its own pattern. It makes no sound: notes go
 * to each bass tool wired from its note out (Reese Bass, Wobble Bass, Acid Synth, Wub Osc…). High ENERGY jumps an octave on the
 * off-beat and shortens the notes, as EDM Lab 3.0 did.
 * 1.1 (James, 2026-10-24: "all need more dynamic control and a better ui"): FEEL — slides (with a chance), ghost notes, octave
 * jumps, movement (the fifth, or a step toward the next chord), humanize, accent, follow (how many of the kicks it plays), a seed;
 * STEPS — a 16-step lane for level, octave and slide on each step; and the shared MOTION + PERFORM (perform: true). All neutral
 * by default: an old song plays exactly the notes it did.
 * 2.0 (his words, 2026-11-13: "I love the bassline, needs more depth and control. like tempo and the cord tool." · "The bassline tool. Way more
 * depth. I like that tool. A lot." — bass-gen.spec ADDENDUM 2026-11-13): TIME — feel (half / normal / double), swing, phrase + answer; NOTES — a
 * pool (root, + fifth, + octave, chord tones, scale, walking) left by Tension, a range, anticipation of the next chord; STEPS — lanes for a
 * locked pitch and a rest. Every one neutral by default: 1.1's notes, bar for bar (tested). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const PROG = MusicParts.ALL_PROGRESSIONS;   // the shared tables (components/progression): the five, then the jazz six (3.132)
  // its own rhythm when no Groove is wired in: steps of a 16-step bar
  const PATTERNS = { 'groove kick': [0, 10], 'every beat': [0, 4, 8, 12], 'offbeats': [2, 6, 10, 14], 'eighths': [0, 2, 4, 6, 8, 10, 12, 14], 'half-time': [0] };
  // the step lanes: level −1…1 (× 1 + level/2), octave −1 / 0 / +1, slide 0 auto · 1 on · −1 off
  const STEPS0 = () => ({ vel: new Array(16).fill(0), oct: new Array(16).fill(0), slide: new Array(16).fill(0), lock: new Array(16).fill(0), rest: new Array(16).fill(0) });
  // 2.0 a step's locked pitch: 0 free · 1 root · 2 3rd · 3 5th · 4 7th · 5 octave · 6 a step up · 7 a step down (in scale degrees)
  const LOCK = [null, 0, 2, 4, 6, 7, 1, -1], POOLS = ['root', 'root + fifth', 'root + octave', 'chord tones', 'scale', 'walking'];
  const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
  function cleanSteps(x) {
    const d = STEPS0(); if (!x || typeof x !== 'object') return d;
    for (let i = 0; i < 16; i++) {
      if (x.vel && isFinite(+x.vel[i])) d.vel[i] = clamp(+x.vel[i], -1, 1);
      if (x.oct && isFinite(+x.oct[i])) d.oct[i] = clamp(Math.round(+x.oct[i]), -1, 1);
      if (x.slide && isFinite(+x.slide[i])) d.slide[i] = clamp(Math.round(+x.slide[i]), -1, 1);
      if (x.lock && isFinite(+x.lock[i])) d.lock[i] = clamp(Math.round(+x.lock[i]), 0, 7);
      if (x.rest && isFinite(+x.rest[i])) d.rest[i] = +x.rest[i] ? 1 : 0;
    }
    return d;
  }
  OrganismFactory.define({
    id: 'eravos.bass-gen', domain: 'music', version: '2.0.0', perform: true, label: 'Bassline', icon: '🎸', accent: '#7c4dff',
    category: 'Bass', blurb: 'The root of the chord on the kick: follows a wired Chords and Groove, plays any bass tool wired to it.',
    size: { w: 600, h: 440 }, minSize: { w: 440, h: 320 },
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
      { key: 'slides', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Slides', group: 'FEEL', hint: 'the chance a note off the beat slides in (1 = every one, as before)' },
      { key: 'ghosts', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Ghosts', group: 'FEEL', hint: 'quiet short notes in the gaps between the played ones' },
      { key: 'jumps', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Jumps', group: 'FEEL', hint: 'notes off the beat sometimes jump an octave up' },
      { key: 'move', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Movement', group: 'FEEL', hint: 'notes off the beat sometimes play the fifth, or step toward the next chord' },
      { key: 'humanize', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Humanize', group: 'FEEL', hint: 'notes land a little early or late, a little softer or harder, a little longer or shorter' },
      { key: 'accent', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Accent', group: 'FEEL', hint: 'the beats hit harder and the in-betweens softer' },
      { key: 'follow', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Follow', group: 'FEEL', hint: 'how many of the kicks (or its own rhythm’s steps) it plays — the first of the bar always' },
      { key: 'seed', type: 'integer', default: 7, min: 1, max: 99999, label: 'Seed', group: 'FEEL', hint: 'the chances above: the same seed plays the same line' },
      // 2.0 TIME
      { key: 'feel', type: 'enum', options: ['half', 'normal', 'double'], default: 'normal', label: 'Feel', group: 'TIME', hint: 'its own rhythm at half time (over two bars), as written, or twice in a bar' },
      { key: 'swing', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Swing', group: 'TIME', hint: 'the 16ths between the 8ths land late (up to a triplet feel)' },
      { key: 'phrase', type: 'enum', options: [1, 2, 4, 8], default: 2, label: 'Phrase', group: 'TIME', hint: 'bars in a phrase: Answer moves the notes of its second half' },
      { key: 'answer', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Answer', group: 'TIME', hint: 'the second half of each phrase answers the first: the same rhythm, its notes moved up to the third or fifth' },
      // 2.0 NOTES — its own voicing, the way Chords has Voicing and Tension
      { key: 'pool', type: 'enum', options: POOLS, default: 'root', label: 'Pool', group: 'NOTES', hint: 'what it may play besides the root: the fifth, the octave, the chord’s tones, the scale, or a walk toward the next chord' },
      { key: 'tension', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Tension', group: 'NOTES', hint: 'how often it leaves the root for the notes above (the first of the bar stays the root)' },
      { key: 'span', type: 'integer', default: 3, min: 1, max: 3, label: 'Range', group: 'NOTES', hint: 'octaves it may climb above its Octave — a lower range folds high notes down' },
      { key: 'anticipate', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Ahead', group: 'NOTES', hint: 'anticipation: lands the next chord’s root an 8th before the bar (its own chords)' },
      { key: 'steps', type: 'object', default: STEPS0(), hidden: true, label: 'Steps' },
    ],
    ui_hooks: ['step_set', 'reseed'],
    presets: {},
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory;
      const cs = ctx.modBus('energy', { min: 0, max: 1 }), an = ac.createAnalyser(); an.fftSize = 32; cs.connect(an); const mb = new Float32Array(32);
      const energy = () => { an.getFloatTimeDomainData(mb); return Math.max(0, Math.min(1, P.get('energy') + (mb[mb.length - 1] || 0))); };
      let heard = null;   // the last chord from a wired Chords
      const from = (hook, p) => p && p._from && ctx.wiredIn(hook).includes(p._from);
      // a kick at a chord change can arrive before that chord does (whichever part ticks first — found 2026-10-22): it waits for it
      let pending = [];
      const chordWired = () => ctx.wiredIn('bassg.hook.chord_in').length > 0;
      const heardEnd = () => heard ? heard.time + (heard.bars || 1) * 16 * (heard.stepDur || 0.125) : -Infinity;
      ctx.on('harmony:chord', { type: 'object' }, (p) => {
        if (!from('bassg.hook.chord_in', p)) return;
        const old = pending.filter(x => x.t < p.time - 1e-6); old.forEach(x => play(x.t, x.bar, x.step, x.stepDur, true, x.ghost));
        heard = p; const now = pending.filter(x => x.t >= p.time - 1e-6); pending = []; now.forEach(x => play(x.t, x.bar, x.step, x.stepDur, true, x.ghost));
      });
      const ownDegree = (bar) => MusicParts.degreeAt(PROG, P.get('progression'), bar, P.get('chordBars'));
      const degree = (bar) => (heard && ctx.wiredIn('bassg.hook.chord_in').length ? heard.degree : ownDegree(bar));
      let lastNote = null;
      const rnd = (bar, step, k) => ctx.dsp.mulberry32((P.get('seed') * 104729 + bar * 977 + step * 61 + k * 13) >>> 0)();
      // the next chord's degree, when it is known (its own progression): a moving note steps toward it
      const nextDegree = (bar) => (heard && chordWired()) ? null : ownDegree(bar + 1);
      function play(t, bar, step, stepDur, now, ghost, nextRoot) {
        if (!now && chordWired() && t >= heardEnd() - 1e-6) { pending.push({ t, bar, step, stepDur, ghost }); return; }
        const e = energy(), k = ctx.key, St = cleanSteps(P.get('steps')), onBeat = step % 4 === 0;
        if (St.rest[step] && !nextRoot) return;   // 2.0 a rest: this step never plays
        if (!ghost && step !== 0 && P.get('follow') < 1 && rnd(bar, step, 1) >= P.get('follow')) return;
        let up = step % 8 === 4 && e > 0.7 ? 1 : 0;
        if (!onBeat && P.get('jumps') && rnd(bar, step, 2) < P.get('jumps') * 0.6) up = 1;
        let deg = degree(bar);
        if (step % 8 !== 0 && !ghost && P.get('move') && rnd(bar, step, 3) < P.get('move') * 0.5) {
          const nd = nextDegree(bar);
          deg = nd !== null && step >= 12 && rnd(bar, step, 4) < 0.6 ? nd + (nd >= deg ? -1 : 1) : deg + 4;
        }
        // 2.0 NOTES: the pool, left by Tension (never the first of the bar); a walk steps toward the next chord on the beats
        const pool = P.get('pool'), ten = P.get('tension');
        if (!ghost && step !== 0 && ten && pool !== 'root' && rnd(bar, step, 10) < ten) {
          if (pool === 'walking') { const nd = nextDegree(bar); if (onBeat && nd !== null && nd !== deg) deg += Math.sign(nd - deg) * Math.min(Math.abs(nd - deg), step / 4); else if (onBeat) deg += [0, 2, 4, 2][step / 4]; }
          else { const opts = pool === 'root + fifth' ? [4] : pool === 'root + octave' ? [7] : pool === 'chord tones' ? [2, 4, 6] : [1, 2, 3, 4, 5, 6]; deg += opts[Math.floor(rnd(bar, step, 11) * opts.length) % opts.length]; }
        }
        // 2.0 TIME: the second half of a phrase answers the first (the same rhythm, the notes up a third or a fifth)
        const ph = +P.get('phrase') || 2, ans = P.get('answer');
        if (!ghost && step !== 0 && ans && ph > 1 && (bar % ph) >= ph / 2 && rnd(bar % (ph / 2), step, 12) < ans) deg += rnd(bar % (ph / 2), step, 13) < 0.5 ? 2 : 4;
        if (nextRoot !== undefined) deg = nextRoot;   // 2.0 anticipation: the next chord's root, early
        if (St.lock[step]) deg = degree(bar) + LOCK[St.lock[step]];   // 2.0 a locked step plays its lock
        let note = MT.degreeToMidi(deg, P.get('octave') + up + St.oct[step], k.root, k.scale);
        const floor = MT.degreeToMidi(0, P.get('octave'), k.root, k.scale), span = P.get('span'); while (note >= floor + span * 12 + 12) note -= 12;   // 2.0 Range
        let dur = stepDur * P.get('length') * (e > 0.6 ? 0.65 : 1), vel = 0.7 + 0.3 * e, tt = t;
        const acc = P.get('accent'), hum = P.get('humanize');
        if (acc) vel *= onBeat ? 1 + 0.35 * acc : 1 - 0.3 * acc;
        vel *= 1 + St.vel[step] / 2;
        if (P.get('swing') && step % 2 === 1) tt = t + stepDur * P.get('swing') / 3;   // 2.0 swing: the off 16ths late (1 = a triplet's)
        if (hum) { vel *= 1 + (rnd(bar, step, 5) - 0.5) * 0.4 * hum; tt = Math.max(ac.currentTime, tt + (rnd(bar, step, 6) - 0.5) * 0.02 * hum); dur *= 1 + (rnd(bar, step, 7) - 0.5) * 0.5 * hum; }
        let slide = !onBeat && (P.get('slides') >= 1 || rnd(bar, step, 8) < P.get('slides'));
        if (St.slide[step]) slide = St.slide[step] > 0;
        if (ghost) { vel = 0.25 + 0.15 * e; dur = stepDur * 0.45; slide = false; }
        vel = clamp(vel, 0.05, 1);
        ctx.wiredOut('bassg.hook.note_out').forEach(target => ctx.emit('note:trigger', { target, note, velocity: vel, time: tt, duration: dur, slide }));
        lastNote = { note, name: MT.noteName(note), time: tt, step: (bar % 2) * 16 + step, dur: dur / stepDur, vel, slide, ghost: !!ghost };
        ctx.emitUI('bass_note', lastNote);
      }
      // a ghost: a quiet note on a step nothing else plays on (its own seeded chance)
      const ghostAt = (t, bar, step, stepDur) => { const g = P.get('ghosts'); if (g && rnd(bar, step, 9) < g * 0.45) play(t, bar, step, stepDur, false, true); };
      const following = () => P.get('rhythm') === 'groove kick' && ctx.wiredIn('bassg.hook.groove_in').length > 0;
      ctx.on('groove:step', { type: 'object' }, (p) => { if (!following() || !from('bassg.hook.groove_in', p)) return; if (p.kick) play(p.time, p.bar, p.step % 16, p.stepDur); else ghostAt(p.time, p.bar, p.step % 16, p.stepDur); ctx.emitUI('bass_step', { step: (p.bar % 2) * 16 + p.step % 16, time: p.time }); });
      ctx.onTick((tk) => {
        // a kick still waiting from an earlier tick: no chord came for it, so it plays on the last one
        const stale = pending.filter(x => x.t < tk.time - 1e-6); if (stale.length) { pending = pending.filter(x => !stale.includes(x)); stale.forEach(x => play(x.t, x.bar, x.step, x.stepDur, true, x.ghost)); }
        if (following()) return;
        const bar = Math.floor(tk.step16 / 16), step = tk.step16 % 16;
        const pat = PATTERNS[P.get('rhythm')], f = P.get('feel'), hit = f === 'double' ? pat.includes((step * 2) % 16) : f === 'half' ? (((bar % 2) * 16 + step) % 2 === 0 && pat.includes(((bar % 2) * 16 + step) / 2)) : pat.includes(step);
        // 2.0 anticipation: an 8th before the bar, the next chord's root (when its own chords say it changes)
        const nd = nextDegree(bar);
        if (step === 14 && P.get('anticipate') && nd !== null && nd !== ownDegree(bar) && rnd(bar, 14, 14) < P.get('anticipate')) play(tk.time, bar, step, tk.stepDur, false, false, nd);
        else if (hit) play(tk.time, bar, step, tk.stepDur); else ghostAt(tk.time, bar, step, tk.stepDur);
        ctx.emitUI('bass_step', { step: (bar % 2) * 16 + step, time: tk.time });
      });
      ctx.onUI('step_set', { type: 'object', required: ['step'] }, (p) => {
        const St = cleanSteps(P.get('steps')), i = clamp(p.step | 0, 0, 15);
        ['vel', 'oct', 'slide', 'lock', 'rest'].forEach(k => { if (k in p && isFinite(+p[k])) St[k][i] = +p[k]; });
        if (p.all) ['vel', 'oct', 'slide', 'lock', 'rest'].forEach(k => { if (k in p.all) St[k] = new Array(16).fill(+p.all[k] || 0); });
        P.set('steps', cleanSteps(St));
      });
      ctx.onUI('reseed', null, () => P.set('seed', Math.floor(Math.random() * 99998) + 1));
      ctx.internals = { cleanSteps, STEPS0, PATTERNS, LOCK, POOLS };
      ctx.stateExtra = () => ({ note: lastNote, following: following(), chordFrom: ctx.wiredIn('bassg.hook.chord_in').length > 0 });
      return { unmount() { try { cs.disconnect(); } catch (e) {} } };
    },
  });
})();
