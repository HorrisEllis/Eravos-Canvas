/* eravos.wub-sub 1.0.0 — Wub Sub · spec wub-sub.spec
 * The low end under a wobble, and nothing else: one clean mono sub voice (sine, triangle or warm) that never wobbles,
 * so the drop keeps its weight while the mid-range talks. By default it follows the notes sent to any Wub Osc on the
 * canvas — one sequencer track plays both. Its violet "level" input ducks it (sidechain, or Wub Rate inverted). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.wub-sub', domain: 'music', version: '1.0.0', label: 'Wub Sub', icon: '◉', accent: '#7c4dff',
    category: 'Wubs', blurb: 'The clean low end under the wobble — follows your Wub Osc notes, never wobbles, glides with it.',
    size: { w: 500, h: 420 }, minSize: { w: 360, h: 300 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.audio_out', 'capability.note_in', 'capability.sub'],
    hooks: [S.audio_out('wubs.hook.audio_out'), S.note_in('wubs.hook.note_in'), S.midi_in('wubs.hook.midi_in'), S.mod_in('wubs.hook.mod_level', 'level')],
    config: [
      { key: 'follow', type: 'boolean', default: true, label: 'Follow Wub Osc', group: 'NOTES', hint: 'play the notes sent to any Wub Osc too' },
      { key: 'wave', type: 'enum', options: ['sine', 'triangle', 'warm'], default: 'sine', label: 'Wave', group: 'TONE', hint: 'warm adds a little 2nd/3rd harmonic so the sub is heard on phones' },
      { key: 'octave', type: 'integer', default: -1, min: -3, max: 0, label: 'Octave', group: 'TONE', hint: 'against the note: −1 = the same pitch as a Wub Osc at its default octave (−1)' },
      { key: 'cut', type: 'number', default: 150, min: 40, max: 400, step: 1, unit: 'Hz', label: 'Low-pass', group: 'TONE' },
      { key: 'glide', type: 'number', default: 0.05, min: 0, max: 0.6, step: 0.001, unit: 's', label: 'Glide', group: 'ENV' },
      { key: 'attack', type: 'number', default: 0.006, min: 0.001, max: 0.5, step: 0.001, unit: 's', label: 'Attack', group: 'ENV' },
      { key: 'release', type: 'number', default: 0.12, min: 0.01, max: 2, step: 0.001, unit: 's', label: 'Release', group: 'ENV' },
      { key: 'level', type: 'number', default: 0.8, min: 0, max: 1.5, step: 0.01, label: 'Level', group: 'OUT' },
    ],
    defaultPreset: 'Clean Sine',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, MT = window.MusicTheory, dsp = ctx.dsp, K = ctx.K;
      const hz = ac.createConstantSource(); hz.offset.value = 55; hz.start();
      const o = ac.createOscillator(); o.frequency.value = 0; hz.connect(o.frequency); o.start();
      const sh = ac.createWaveShaper(), lp = ac.createBiquadFilter(), amp = ac.createGain(), duck = ac.createGain(), level = ac.createGain();
      lp.type = 'lowpass'; lp.Q.value = 0.6; amp.gain.value = 0;
      o.connect(sh); sh.connect(lp); lp.connect(amp); amp.connect(duck); duck.connect(level);
      [hz, o, sh, lp, amp, duck, level].forEach(n => ctx.track(n));
      ctx.port('out', { kind: 'audio', direction: 'out', node: level, label: 'sub' });
      const levelMod = ctx.modBus('level', { min: -1, max: 1 }); levelMod.connect(duck.gain);   // −1 → silent, 0 → as set
      const linear = new Float32Array([-1, 1]);
      function tone() {
        const w = P.get('wave'), now = ac.currentTime;
        o.type = w === 'triangle' ? 'triangle' : 'sine';
        sh.curve = w === 'warm' ? dsp.curve('asym', 0.22) : linear;
        lp.frequency.setTargetAtTime(P.get('cut'), now, 0.01);
        level.gain.setTargetAtTime(0.42 * P.get('level') * (w === 'warm' ? 0.85 : 1), now, 0.01);
      }
      tone(); ['wave', 'cut', 'level'].forEach(k => P.onChange(k, tone));
      let held = null, curF = 55;
      const peak = (vel) => 0.25 + 0.75 * Math.max(0, Math.min(1, vel));   // a sub stays solid: velocity matters less
      function noteOn(note, vel, t, op) {
        op = op || {}; t = Math.max(t, ac.currentTime);
        const f = MT.hz(Math.max(0, Math.min(127, note + 12 * P.get('octave'))));
        const legato = held && held.off > t - 1e-4;
        hz.offset.cancelScheduledValues(t);
        if (legato || op.slide) { hz.offset.setValueAtTime(curF, t); hz.offset.exponentialRampToValueAtTime(f, t + Math.max(0.003, P.get('glide'))); }
        else hz.offset.setValueAtTime(f, t);
        curF = f;
        if (!(op.slide && legato)) { const g = amp.gain; g.cancelScheduledValues(t); if (!legato) g.setValueAtTime(0, t); g.linearRampToValueAtTime(peak(vel), t + P.get('attack')); }
        const off = op.duration !== undefined ? t + op.duration : Infinity;
        held = { note, off };
        if (off !== Infinity) { amp.gain.setValueAtTime(peak(vel), off); amp.gain.setTargetAtTime(0, off, P.get('release') / 4); }
        ctx.lastNote = { note, f, t };
      }
      function noteOff(note, t) {
        if (!held || held.note !== note) return;
        t = Math.max(t || ac.currentTime, ac.currentTime);
        if (typeof amp.gain.cancelAndHoldAtTime === 'function') amp.gain.cancelAndHoldAtTime(t); else amp.gain.cancelScheduledValues(t);
        amp.gain.setTargetAtTime(0, t, P.get('release') / 4); held.off = t;
      }
      const play = (p) => noteOn(p.note, p.velocity, typeof p.time === 'number' ? p.time : ac.currentTime, { duration: p.duration, slide: p.slide });
      ctx.onNote(play);
      // follow: notes addressed to any Wub Osc (not to this sub — those already arrive through onNote)
      ctx.on('note:trigger', null, (p) => {
        if (!P.get('follow') || !p || ctx.isTarget(p) || typeof p.note !== 'number') return;
        const r = K.registry.get(p.target); if (!r || r.organism_id !== 'eravos.wub-osc') return;
        play(Object.assign({ velocity: 0.9 }, p));
      });
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime); else noteOff(p.note, ac.currentTime); });
      ctx.allNotesOff = (p) => { const t = (p && typeof p.time === 'number') ? Math.max(p.time, ac.currentTime) : ac.currentTime; amp.gain.cancelScheduledValues(t); amp.gain.setTargetAtTime(0, t, p && p.hard ? 0.005 : P.get('release') / 4); if (held) held.off = t; };
      ctx.audition = (p) => noteOn(p.note || 45, p.velocity || 0.9, ac.currentTime, { duration: p.duration || 1.2 });
      ctx.auditionOff = (p) => noteOff(p.note || 45);
      ctx.internals = { hz, amp, duck, level, lp };
      return {};
    },
  });
})();
