/* eravos.arp 1.0.0 — Arp: the arpeggiator as a part of its own (map eravos.phase49-map P49.4a).
 * James, 2026-10-22: "each ;arge tool rebuilt as parts if it can be used by another suite or tool". The audit found the arpeggiator
 * inside Retro Poly with no tool for it (Ratio Lattice's arp steps its own drone's ratios — a different job, it stays there).
 * Notes in (keys, a Sequencer, the Timeline, MIDI) or a chord from a wired Chords → the held notes stepped up · down · up-down ·
 * random · as played, over 1–3 octaves, on the transport (1/4 … 1/16t), gated, optionally latched. It makes no sound: the notes go
 * to every instrument wired from its note out. Retro Poly's own arp rule (order, octaves, up-down without repeating the ends). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const ORDERS = ['up', 'down', 'up-down', 'random', 'played'];
  const PERIOD = { '1/4': 4, '1/8': 2, '1/16': 1, '1/8t': 4 / 3, '1/16t': 2 / 3, '1/32': 0.5 };   // in 16ths
  OrganismFactory.define({
    id: 'eravos.arp', domain: 'music', version: '1.0.0', label: 'Arp', icon: '🪜', accent: '#00d4ff',
    category: 'Generators', blurb: 'Hold notes (or wire in Chords): it steps through them on the beat and plays any instrument wired to it.',
    size: { w: 420, h: 300 }, minSize: { w: 320, h: 240 },
    permissions: ['audio_out', 'midi_in', 'bus_publish', 'bus_subscribe', 'registry_read'],   // audio_out: its knob inputs are audio-rate ports
    provides: ['capability.generation', 'capability.note_out', 'capability.note_in'],
    hooks: [
      S.note_in('arp.hook.note_in'), S.midi_in('arp.hook.midi_in'), S.note_out('arp.hook.note_out'), S.transport_in('arp.hook.transport_in'),
      S.event('arp.hook.chord_in', 'in', 'harmony:chord', { type: 'object' }, '1.0.0'),
    ],
    config: [
      { key: 'order', type: 'enum', options: ORDERS, default: 'up', label: 'Order', group: 'ARP' },
      { key: 'div', type: 'enum', options: Object.keys(PERIOD), default: '1/16', label: 'Rate', group: 'ARP' },
      { key: 'octaves', type: 'integer', default: 1, min: 1, max: 3, label: 'Octaves', group: 'ARP' },
      { key: 'gate', type: 'number', default: 0.55, min: 0.05, max: 1, step: 0.01, label: 'Gate', group: 'ARP' },
      { key: 'latch', type: 'boolean', default: false, label: 'Latch', group: 'ARP', hint: 'keep playing the last notes after they are let go, until new ones come' },
      { key: 'velocity', type: 'number', default: 0.85, min: 0.1, max: 1, step: 0.01, label: 'Velocity', group: 'PLAY' },
      { key: 'transpose', type: 'integer', default: 0, min: -24, max: 24, label: 'Transpose', group: 'PLAY' },
    ],
    ui_hooks: [],
    presets: {},
    engine(ctx) {
      const P = ctx.params, ac = ctx.ac;
      // held notes, each with the audio time it ends (notes arrive with a duration; MIDI holds until note-off)
      let held = [];   // { note, start, end, order }
      let latched = [], seq = 0, arpI = 0, rnd = ctx.dsp.mulberry32(7);
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
      function sequence(notes) {
        const order = P.get('order'), base = order === 'played' ? notes.slice().sort((a, b) => a.order - b.order).map(h => h.note) : notes.map(h => h.note).sort((a, b) => a - b);
        const out = []; for (let o = 0; o < P.get('octaves'); o++) base.forEach(n => out.push(n + 12 * o));
        if (order === 'down') out.reverse();
        if (order === 'up-down' && out.length > 2) return out.concat(out.slice(1, -1).reverse());
        return out;
      }
      ctx.sequence = (notes) => sequence(notes.map((n, i) => ({ note: n, order: i })));
      function step(tk) {
        const per = PERIOD[P.get('div')] || 1, s = tk.step16; let played = 0;
        for (let k = Math.ceil(s / per - 1e-9); k * per < s + 1 - 1e-9; k++) {
          const t = tk.time + (k * per - s) * tk.stepDur, notes = holding(t); if (!notes.length) { arpI = 0; continue; }
          const sq = sequence(notes), n = P.get('order') === 'random' ? sq[Math.floor(rnd() * sq.length)] : sq[arpI++ % sq.length];
          const note = n + P.get('transpose'), dur = per * tk.stepDur * P.get('gate');
          ctx.wiredOut('arp.hook.note_out').forEach(target => ctx.emit('note:trigger', { target, note, velocity: P.get('velocity'), time: t, duration: dur }));
          ctx.emitUI('step', { note, time: t }); played++;
        }
        held = held.filter(h => h.end > tk.time - 1);   // forget what ended long ago
        return played;
      }
      ctx.onTick((tk) => { lastTick = tk; lastEmpty = step(tk) === 0; });
      ctx.audition = (p) => press(p.note || 60, ac.currentTime, Infinity);
      ctx.auditionOff = (p) => { held = held.filter(h => h.note !== p.note); };
      ctx.onStop(() => { held = []; latched = []; arpI = 0; });
      ctx.stateExtra = () => ({ holding: holding(ac.currentTime).map(h => h.note) });
      return {};
    },
  });
})();
