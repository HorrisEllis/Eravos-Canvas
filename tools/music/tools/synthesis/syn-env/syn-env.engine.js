/* eravos.syn-env 1.0.0 — Envelope (P44 · synthesis) · spec eravos.organism.syn-env
 * A shape in time you wire into ANY knob with a violet input — Morph Osc's morph, Destroyer's drive, Wub Filter's
 * position, a pad's cutoff. DELAY → ATTACK (curve) → HOLD → DECAY → SUSTAIN … RELEASE, velocity-scaled, optionally
 * LOOPING (attack/decay cycles while held: a note-synced wobble).
 * FOLLOW (links): it plays on the notes sent to the tools it is wired into — wire it, play the tool, it moves. It also
 * takes notes of its own (note in / MIDI) to be fired from a sequencer.
 * Output: 0 → depth (polarity + flips it, bipolar centres it), sample-accurate on the audio clock. */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  OrganismFactory.define({
    id: 'eravos.syn-env', domain: 'music', version: '1.0.0', label: 'Envelope', icon: '📈', accent: '#c58bff', phase: 'P44',
    category: 'Synthesis', blurb: 'An envelope you wire into any knob. It moves on the notes of whatever it is wired into.',
    size: { w: 480, h: 420 }, minSize: { w: 360, h: 300 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe', 'registry_read'],
    provides: ['capability.envelope', 'capability.lfo'],
    hooks: [S.mod_out('env.hook.mod_out', 'out'), S.note_in('env.hook.note_in'), S.midi_in('env.hook.midi_in'), S.mod_in('env.hook.mod_depth', 'depth')],
    face: ['attack', 'decay', 'sustain', 'release', 'depth', 'polarity'],
    config: [
      { key: 'delay', type: 'number', default: 0, min: 0, max: 4, step: 0.001, unit: 's', label: 'Delay', group: 'SHAPE' },
      { key: 'attack', type: 'number', default: 0.01, min: 0.001, max: 8, step: 0.001, unit: 's', label: 'Attack', group: 'SHAPE' },
      { key: 'curve', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Curve', group: 'SHAPE', hint: '− snaps up then eases · + swells in slowly' },
      { key: 'hold', type: 'number', default: 0, min: 0, max: 4, step: 0.001, unit: 's', label: 'Hold', group: 'SHAPE' },
      { key: 'decay', type: 'number', default: 0.4, min: 0.005, max: 8, step: 0.001, unit: 's', label: 'Decay', group: 'SHAPE' },
      { key: 'sustain', type: 'number', default: 0.3, min: 0, max: 1, step: 0.01, label: 'Sustain', group: 'SHAPE' },
      { key: 'release', type: 'number', default: 0.3, min: 0.005, max: 10, step: 0.001, unit: 's', label: 'Release', group: 'SHAPE' },
      { key: 'loop', type: 'boolean', default: false, label: 'Loop', group: 'MOTION', hint: 'attack → decay again and again while the note is held' },
      { key: 'depth', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Depth', group: 'OUTPUT' },
      { key: 'polarity', type: 'enum', options: ['+', '−', 'bipolar'], default: '+', label: 'Polarity', group: 'OUTPUT', hint: '+ opens the knob it is wired to · − closes it · bipolar swings both ways around where the knob is' },
      { key: 'velocity', type: 'number', default: 0.5, min: 0, max: 1, step: 0.01, label: 'Velocity', group: 'OUTPUT', hint: 'how much playing harder moves it further' },
      { key: 'retrig', type: 'enum', options: ['every note', 'legato'], default: 'every note', label: 'Restart', group: 'MOTION', hint: 'legato: overlapping notes keep the shape going' },
      { key: 'follow', type: 'boolean', default: true, label: 'Follow', group: 'MOTION', hint: 'move on the notes of the tools this is wired into' },
    ],
    defaultPreset: 'Pluck Sweep',
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params;
      const T = (n) => { ctx.track(n); return n; };
      const env = T(ac.createConstantSource()); env.offset.value = 0; env.start();        // 0..1 shape
      const shape = T(ac.createGain()), offset = T(ac.createConstantSource()), out = T(ac.createGain());
      offset.offset.value = 0; offset.start();
      env.connect(shape); shape.connect(out); offset.connect(out);
      ctx.port('out', { kind: 'mod', direction: 'out', node: out, label: 'envelope' });
      const depthMod = ctx.modBus('depth', { min: -1, max: 1 }); depthMod.connect(out.gain);
      function polarity() {   // out = depth · (sign·env + offset)
        const p = P.get('polarity'), t = ac.currentTime;
        shape.gain.setTargetAtTime(p === '−' ? -1 : p === 'bipolar' ? 2 : 1, t, 0.005);
        offset.offset.setTargetAtTime(p === 'bipolar' ? -1 : 0, t, 0.005);
        out.gain.setTargetAtTime(P.get('depth'), t, 0.005);
      }
      polarity(); ['polarity', 'depth'].forEach(k => P.onChange(k, polarity));
      const held = new Map();   // note → end time
      let level = 0, peak = 1;
      // a curved segment from → to over dur, written as short linear pieces (exact on the audio clock, renders offline)
      function segment(g, from, to, t, dur, curve) {
        const n = Math.abs(curve) < 0.02 ? 1 : 12;
        for (let i = 1; i <= n; i++) { const x = i / n, y = curve > 0 ? Math.pow(x, 1 + curve * 3) : curve < 0 ? 1 - Math.pow(1 - x, 1 - curve * 3) : x; g.linearRampToValueAtTime(from + (to - from) * y, t + dur * x); }
      }
      function start(vel, t, dur) {
        const g = env.offset, D = P.get('delay'), A = P.get('attack'), Hd = P.get('hold'), Dc = P.get('decay'), Sus = P.get('sustain');
        peak = (1 - P.get('velocity')) + P.get('velocity') * vel;
        const legato = P.get('retrig') === 'legato' && Array.from(held.values()).some(e => e > t);
        g.cancelScheduledValues(t); g.setValueAtTime(legato ? level : (D > 0 ? 0 : level * 0), t);
        if (legato) return;
        let at = t + D; if (D > 0) g.setValueAtTime(0, at);
        const end = dur !== undefined ? t + dur : Infinity;
        let cycles = 0;
        do {
          segment(g, cycles ? peak * Sus : 0, peak, at, A, P.get('curve')); at += A;
          if (Hd > 0) { g.setValueAtTime(peak, at + Hd); at += Hd; }
          segment(g, peak, peak * Sus, at, Dc, 0); at += Dc;
          cycles++;
        } while (P.get('loop') && at < Math.min(end, t + 64) && cycles < 512);
        level = peak * Sus;
        if (dur !== undefined) stop(t + dur);
      }
      function stop(t) {
        const g = env.offset, R = P.get('release');
        if (typeof g.cancelAndHoldAtTime === 'function') g.cancelAndHoldAtTime(t); else g.cancelScheduledValues(t);
        g.setTargetAtTime(0, t, R / 4); level = 0;
      }
      function noteOn(note, vel, t, dur) {
        t = Math.max(typeof t === 'number' ? t : ac.currentTime, ac.currentTime);
        start(typeof vel === 'number' ? vel : 0.8, t, dur);
        held.set(note, dur !== undefined ? t + dur : Infinity);
        ctx.emitUI('fired', { t, dur: dur === undefined ? null : dur });
      }
      function noteOff(note, t) { held.delete(note); if (![...held.values()].some(e => e > ac.currentTime)) stop(Math.max(t || ac.currentTime, ac.currentTime)); }
      ctx.onNote((p) => noteOn(p.note, p.velocity, p.time, p.duration === undefined ? 0.25 : p.duration));
      ctx.onMidi((p) => { if (p.on) noteOn(p.note, p.velocity, ac.currentTime); else noteOff(p.note); });
      ctx.audition = (p) => noteOn(p.note || 60, p.velocity || 0.85, ac.currentTime, p.duration || 1);
      // FOLLOW: the notes addressed to the tools this envelope is wired into
      let followed = new Set();
      ctx.onLinks((links) => { followed = new Set(links.filter(l => l.dir === 'out').map(l => l.peer)); ctx.emitUI('follows', { n: followed.size }); });
      ctx.on('note:trigger', null, (p) => {
        if (!P.get('follow') || !p || !followed.has(p.target) || typeof p.note !== 'number') return;
        noteOn(p.note, p.velocity, p.time, typeof p.duration === 'number' ? p.duration : 0.25);
      });
      ctx.onSilence(() => { held.clear(); const g = env.offset, t = ac.currentTime; g.cancelScheduledValues(t); g.setTargetAtTime(0, t, 0.005); level = 0; });
      ctx.internals = { env, out };
      return { unmount() {} };
    },
  });
})();
