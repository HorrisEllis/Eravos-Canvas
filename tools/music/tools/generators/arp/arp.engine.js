/* eravos.arp 2.0.0 — Arp: the arpeggiator as a part of its own (map eravos.phase49-map P49.4a).
 * James, 2026-10-22: "each ;arge tool rebuilt as parts if it can be used by another suite or tool". The audit found the arpeggiator
 * inside Retro Poly with no tool for it (Ratio Lattice's arp steps its own drone's ratios — a different job, it stays there).
 * Notes in (keys, a Sequencer, the Timeline, MIDI) or a chord from a wired Chords → the held notes stepped on the transport and sent
 * to every instrument wired from its note out. It makes no sound itself. Retro Poly's own arp rule (order, octaves, up-down without
 * repeating the ends).
 * 2.0 (3.61, "make arp more adjustable. i love it") — every control from one side to the other; the defaults play exactly as 1.0:
 *   PATTERN  12 orders (up · down · up-down · down-up · converge · diverge · pinky · thumb · scale run · random · as played · chord),
 *            rates 1/1 … 1/32t, 1–4 octaves going up / down / centred, each note repeated 1–8×, a pattern length that loops the
 *            first N notes, restart on every bar or on every new chord
 *   STEPS    a lane of 1–32 steps: each step's level (0 = a rest), its octave (−2…+2) and a slide (it glides in from the last note,
 *            through the pitch wheel — sdk-music 3.56). The lane walks with the arp's steps.
 *   FEEL     swing, chance (a step may skip), gate up to 2× (legato overlap) and its randomness, timing humanize, velocity: level,
 *            randomness and a ramp across the pattern, slide chance on every note
 *   PITCH    transpose ±3 octaves, stack (+octave · +5th · both) */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const ORDERS = ['up', 'down', 'up-down', 'down-up', 'converge', 'diverge', 'pinky', 'thumb', 'scale', 'random', 'played', 'chord'];
  const PERIOD = { '1/1': 16, '1/2': 8, '1/2t': 16 / 3, '1/4': 4, '1/4t': 8 / 3, '1/8': 2, '1/16': 1, '1/8t': 4 / 3, '1/16t': 2 / 3, '1/32': 0.5, '1/32t': 1 / 3 };   // in 16ths
  const MAXSTEPS = 32;
  const flat = (n, v) => new Array(n).fill(v);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  OrganismFactory.define({
    id: 'eravos.arp', domain: 'music', version: '2.0.0', label: 'Arp', icon: '🪜', accent: '#00d4ff',
    category: 'Generators', blurb: 'Hold notes (or wire in Chords): it steps through them on the beat and plays any instrument wired to it — every move adjustable.',
    size: { w: 760, h: 520 }, minSize: { w: 360, h: 300 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe', 'registry_read'],   // audio_out: its knob inputs are audio-rate ports
    provides: ['capability.generation', 'capability.note_out', 'capability.note_in'],
    hooks: [
      S.note_in('arp.hook.note_in'), S.midi_in('arp.hook.midi_in'), S.note_out('arp.hook.note_out'), S.transport_in('arp.hook.transport_in'),
      S.event('arp.hook.chord_in', 'in', 'harmony:chord', { type: 'object' }, '1.0.0'),
    ],
    config: [
      { key: 'order', type: 'enum', options: ORDERS, default: 'up', label: 'Order', group: 'PATTERN', hint: 'converge: outside → in · diverge: inside → out · pinky / thumb: the top / bottom note between every other · scale: a run up the song’s key from the lowest note · chord: all at once' },
      { key: 'div', type: 'enum', options: Object.keys(PERIOD), default: '1/16', label: 'Rate', group: 'PATTERN' },
      { key: 'octaves', type: 'integer', default: 1, min: 1, max: 4, label: 'Octaves', group: 'PATTERN' },
      { key: 'octDir', type: 'enum', options: ['up', 'down', 'center'], default: 'up', label: 'Octaves go', group: 'PATTERN' },
      { key: 'repeat', type: 'integer', default: 1, min: 1, max: 8, label: 'Repeat', group: 'PATTERN', hint: 'each note plays this many times before the next' },
      { key: 'length', type: 'integer', default: 0, min: 0, max: 32, label: 'Length', group: 'PATTERN', hint: '0: the whole pattern · N: loop its first N notes' },
      { key: 'restart', type: 'enum', options: ['off', 'bar', 'notes'], default: 'off', label: 'Restart', group: 'PATTERN', hint: 'start the pattern again on every bar, or whenever the held notes change' },
      { key: 'steps', type: 'integer', default: 16, min: 1, max: MAXSTEPS, label: 'Steps', group: 'STEPS', hint: 'how long the step lane is' },
      { key: 'swing', type: 'number', default: 0, min: 0, max: 0.75, step: 0.01, label: 'Swing', group: 'FEEL' },
      { key: 'chance', type: 'number', default: 1, min: 0, max: 1, step: 0.01, label: 'Chance', group: 'FEEL', hint: 'how likely each step is to play' },
      { key: 'gate', type: 'number', default: 0.55, min: 0.05, max: 2, step: 0.01, label: 'Gate', group: 'FEEL', hint: 'past 1: notes overlap (legato)' },
      { key: 'gateRand', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Gate rand', group: 'FEEL' },
      { key: 'humanize', type: 'number', default: 0, min: 0, max: 40, step: 1, unit: 'ms', label: 'Humanize', group: 'FEEL', hint: 'each note a little early or late' },
      { key: 'slide', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Slide', group: 'FEEL', hint: 'how often a note glides in from the last one (the lane’s slide steps always do)' },
      { key: 'latch', type: 'boolean', default: false, label: 'Latch', group: 'PATTERN', hint: 'keep playing the last notes after they are let go, until new ones come' },
      { key: 'velocity', type: 'number', default: 0.85, min: 0.05, max: 1, step: 0.01, label: 'Velocity', group: 'PLAY' },
      { key: 'velRand', type: 'number', default: 0, min: 0, max: 1, step: 0.01, label: 'Vel rand', group: 'PLAY' },
      { key: 'velRamp', type: 'number', default: 0, min: -1, max: 1, step: 0.01, label: 'Vel ramp', group: 'PLAY', hint: '+: each pattern rises · −: it falls away' },
      { key: 'transpose', type: 'integer', default: 0, min: -36, max: 36, label: 'Transpose', group: 'PLAY' },
      { key: 'stack', type: 'enum', options: ['none', '+oct', '+5th', '+oct+5th', '-oct'], default: 'none', label: 'Stack', group: 'PLAY', hint: 'play each note with its octave or fifth too' },
      { key: 'seed', type: 'integer', default: 7, min: 1, max: 9999, label: 'Seed', group: 'PLAY', hint: 'the dice for random order, chance and the rand knobs — the same seed plays the same' },
    ],
    ui_hooks: ['lane_edit', 'lane_shape'],
    presets: {},
    engine(ctx) {
      const P = ctx.params, ac = ctx.ac, MT = window.MusicTheory;
      // the step lane: level (0 = rest), octave, slide — per step
      let lane = { vel: flat(MAXSTEPS, 1), oct: flat(MAXSTEPS, 0), slide: flat(MAXSTEPS, false) };
      const cleanLane = (x) => ({ vel: Array.from({ length: MAXSTEPS }, (_, i) => clamp(+((x && x.vel && x.vel[i]) ?? 1), 0, 1)), oct: Array.from({ length: MAXSTEPS }, (_, i) => clamp(Math.round(+((x && x.oct && x.oct[i]) ?? 0)), -2, 2)), slide: Array.from({ length: MAXSTEPS }, (_, i) => !!(x && x.slide && x.slide[i])) });
      // held notes, each with the audio time it ends (notes arrive with a duration; MIDI holds until note-off)
      let held = [];   // { note, start, end, order }
      let latched = [], seq = 0, arpI = 0, laneI = 0, prevNote = null, lastSig = '', rnd = ctx.dsp.mulberry32(P.get('seed'));
      P.onChange('seed', (v) => { rnd = ctx.dsp.mulberry32(v); });
      const from = (hook, p) => p && p._from && ctx.wiredIn(hook).includes(p._from);
      // notes for the tick just played arrive late when their sender ticks after this tool (found 2026-10-22: Chords' first chord
      // lost its first step) — that tick is played again then, if it played nothing
      let lastTick = null, lastEmpty = false;
      const press = (note, t, end) => { held = held.filter(h => h.note !== note); held.push({ note, start: t, end, order: seq++ });
        if (lastTick && lastEmpty && Math.abs(t - lastTick.time) < 1e-6) { const tk = lastTick; lastTick = null; step(tk); } };
      ctx.onNote((p) => { const t = typeof p.time === 'number' ? p.time : ac.currentTime; press(p.note, t, t + (typeof p.duration === 'number' ? p.duration : 1)); });
      ctx.onMidi((p) => { if (p.on) press(p.note, ac.currentTime, Infinity); else held = held.filter(h => h.note !== p.note); });
      ctx.on('harmony:chord', { type: 'object' }, (p) => { if (!from('arp.hook.chord_in', p) || !Array.isArray(p.notes)) return; const end = p.time + (p.bars || 1) * 16 * (p.stepDur || 0.125); p.notes.forEach(n => press(n, p.time, end)); });
      function holding(t) {
        const now = held.filter(h => h.start <= t + 1e-6 && h.end > t);
        if (now.length) { if (P.get('latch')) latched = now.slice(); return now; }
        return P.get('latch') ? latched : [];
      }
      // ---- the pattern
      function octShifts() { const n = P.get('octaves'), d = P.get('octDir'); return Array.from({ length: n }, (_, o) => d === 'down' ? -o : d === 'center' ? o - Math.floor((n - 1) / 2) : o); }
      function sequence(notes) {
        const order = P.get('order');
        let base = order === 'played' ? notes.slice().sort((a, b) => a.order - b.order).map(h => h.note) : notes.map(h => h.note).sort((a, b) => a - b);
        if (order === 'scale' && base.length && MT) {   // a run up the song's key from the lowest held note, octaves × 7 degrees
          const key = ctx.key || { root: 0, scale: 'major' }, d0 = MT.degreeOf(base[0], key.root, key.scale), run = [];
          for (let i = 0; i < 7 * P.get('octaves') + 1; i++) run.push(MT.degreeToMidi(d0.degree + i, d0.octave, key.root, key.scale));
          return P.get('octDir') === 'down' ? run.map(n => n - 12 * (P.get('octaves'))).reverse() : run;
        }
        const out = []; octShifts().forEach(o => base.forEach(n => out.push(n + 12 * o)));
        if (P.get('octDir') === 'center') out.sort((a, b) => a - b);
        const up = order === 'played' ? out : out.slice().sort((a, b) => a - b);
        switch (order) {
          case 'down': return up.slice().reverse();
          case 'up-down': return up.length > 2 ? up.concat(up.slice(1, -1).reverse()) : up;
          case 'down-up': { const d = up.slice().reverse(); return d.length > 2 ? d.concat(d.slice(1, -1).reverse()) : d; }
          case 'converge': { const r = []; for (let i = 0, j = up.length - 1; i <= j; i++, j--) { r.push(up[i]); if (j !== i) r.push(up[j]); } return r; }
          case 'diverge': { const r = []; for (let i = 0, j = up.length - 1; i <= j; i++, j--) { r.push(up[i]); if (j !== i) r.push(up[j]); } return r.reverse(); }
          case 'pinky': { const top = up[up.length - 1], rest = up.slice(0, -1); return rest.length ? rest.flatMap(n => [n, top]) : up; }
          case 'thumb': { const low = up[0], rest = up.slice(1); return rest.length ? rest.flatMap(n => [low, n]) : up; }
          default: return up;   // up · random (picked from it) · played (kept in order) · chord (all of it)
        }
      }
      ctx.sequence = (notes) => sequence(notes.map((n, i) => ({ note: n, order: i })));
      const STACK = { none: [], '+oct': [12], '+5th': [7], '+oct+5th': [7, 12], '-oct': [-12] };
      function emit(note, vel, t, dur, b) {
        const extra = STACK[P.get('stack')] || [];
        ctx.wiredOut('arp.hook.note_out').forEach(target => [0].concat(extra).forEach((dn, k) => {
          const n = clamp(note + dn, 0, 127);
          ctx.emit('note:trigger', Object.assign({ target, note: n, velocity: clamp(vel * (k ? 0.8 : 1), 0.02, 1), time: t, duration: dur }, b && !k ? { bend: b } : {}));
        }));
      }
      function step(tk) {
        const per = PERIOD[P.get('div')] || 1, s = tk.step16; let played = 0;
        if (P.get('restart') === 'bar' && s % 16 === 0) { arpI = 0; laneI = 0; }
        for (let k = Math.ceil(s / per - 1e-9); k * per < s + 1 - 1e-9; k++) {
          let t = tk.time + (k * per - s) * tk.stepDur; const notes = holding(t);
          if (!notes.length) { arpI = 0; laneI = 0; prevNote = null; continue; }
          const sig = notes.map(h => h.note).sort((a, b) => a - b).join(',');
          if (P.get('restart') === 'notes' && sig !== lastSig) { arpI = 0; laneI = 0; } lastSig = sig;
          const sq = sequence(notes), nSteps = P.get('steps'), li = laneI % nSteps, lv = lane.vel[li]; laneI++;
          const idx = Math.floor(arpI / P.get('repeat')), len = P.get('length') > 0 ? Math.min(P.get('length'), sq.length) : sq.length, cyc = Math.max(1, len * P.get('repeat'));
          const pos = (arpI % cyc) / cyc; arpI++;
          if (lv <= 0.001 || rnd() > P.get('chance')) continue;   // a rest, or the dice said skip
          // swing: every second step of the grid a little late · humanize: a little either way
          if (k % 2 === 1) t += P.get('swing') * per * tk.stepDur * 0.66;
          if (P.get('humanize') > 0) t = Math.max(ac.currentTime, t + (rnd() * 2 - 1) * P.get('humanize') / 1000);
          const g = clamp(P.get('gate') * (1 + (rnd() * 2 - 1) * P.get('gateRand') * 0.8), 0.03, 2), dur = per * tk.stepDur * g;
          let vel = P.get('velocity') * lv * (1 + P.get('velRamp') * (pos - 0.5)) * (1 + (rnd() * 2 - 1) * P.get('velRand') * 0.5);
          const notesNow = P.get('order') === 'chord' ? sq : [P.get('order') === 'random' ? sq[Math.floor(rnd() * sq.length)] : sq[idx % len]];
          notesNow.forEach((n0, j) => {
            const note = n0 + P.get('transpose') + 12 * lane.oct[li];
            const sl = !j && prevNote !== null && prevNote !== note && (lane.slide[li] || rnd() < P.get('slide'));
            emit(note, vel, t, dur, sl ? { from: clamp(prevNote - note, -48, 48), to: 0, shape: 'early', at: 0 } : null);
            if (!j) { ctx.emitUI('step', { note, time: t, lane: li }); prevNote = note; }
          });
          played++;
        }
        held = held.filter(h => h.end > tk.time - 1);   // forget what ended long ago
        return played;
      }
      ctx.onTick((tk) => { lastTick = tk; lastEmpty = step(tk) === 0; });
      ctx.audition = (p) => press(p.note || 60, ac.currentTime, Infinity);
      ctx.auditionOff = (p) => { held = held.filter(h => h.note !== p.note); };
      ctx.onStop(() => { held = []; latched = []; arpI = 0; laneI = 0; prevNote = null; rnd = ctx.dsp.mulberry32(P.get('seed')); });
      // ---- the lane: edit it, or give it a shape
      const SHAPES = {
        all: () => ({ vel: flat(MAXSTEPS, 1) }),
        offbeats: () => ({ vel: Array.from({ length: MAXSTEPS }, (_, i) => i % 2 ? 1 : 0) }),
        gallop: () => ({ vel: Array.from({ length: MAXSTEPS }, (_, i) => [1, 0, 0.7, 0.7][i % 4]) }),
        accents: () => ({ vel: Array.from({ length: MAXSTEPS }, (_, i) => i % 4 === 0 ? 1 : i % 2 ? 0.45 : 0.65) }),
        trance: () => ({ vel: Array.from({ length: MAXSTEPS }, (_, i) => [1, 0.6, 0, 0.8, 1, 0, 0.7, 0.6][i % 8]) }),
        ramp: () => ({ vel: Array.from({ length: MAXSTEPS }, (_, i) => 0.25 + 0.75 * (i % P.get('steps')) / Math.max(1, P.get('steps') - 1)) }),
        octaves: () => ({ oct: Array.from({ length: MAXSTEPS }, (_, i) => [0, 0, 1, 0, 0, 1, 0, -1][i % 8]) }),
        flat: () => ({ oct: flat(MAXSTEPS, 0), slide: flat(MAXSTEPS, false) }),
        random: () => { const r = ctx.dsp.mulberry32(P.get('seed') * 31 + 1); return { vel: Array.from({ length: MAXSTEPS }, () => r() < 0.2 ? 0 : 0.4 + 0.6 * r()), oct: Array.from({ length: MAXSTEPS }, () => r() < 0.15 ? 1 : r() < 0.08 ? -1 : 0), slide: Array.from({ length: MAXSTEPS }, () => r() < 0.12) }; },
      };
      ctx.onUI('lane_edit', { type: 'object' }, (p) => { lane = cleanLane(Object.assign({}, lane, p.lane || {})); ctx.syncUI(); });
      ctx.onUI('lane_shape', { type: 'object', required: ['shape'] }, (p) => { const f = SHAPES[p.shape]; if (!f) return ctx.fault('RUNTIME_002', 'arp lane shape ' + p.shape); lane = cleanLane(Object.assign({}, lane, f())); ctx.syncUI(); });
      ctx.saveExtra = () => ({ lane: JSON.parse(JSON.stringify(lane)) });
      ctx.loadExtra = (x) => { lane = cleanLane(x && x.lane); ctx.syncUI(); };
      ctx.stateExtra = () => ({ holding: holding(ac.currentTime).map(h => h.note), lane, shapes: Object.keys(SHAPES) });
      ctx.internals = { get lane() { return lane; } };
      return {};
    },
  });
})();
