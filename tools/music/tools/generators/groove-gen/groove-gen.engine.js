/* eravos.groove-gen 1.0.0 — Groove: EDM Lab's rhythm brain as a part of its own (map eravos.phase48-map P48.10).
 * James, 2026-10-21: "anything form a tool that other tools can use need to be decomposed, and grouped by the tool suite".
 * Paint where the rhythm is busy (8 rows × 32 steps of density), turn ENERGY: each step fires the rows its density and the seed
 * allow — the same rule EDM Lab 3.0 plays (its density map and hit rule, carried over). It makes no sound: it sends notes to every
 * drum tool wired from its note out (Pads, Drum Forge: note 36 + pad index), and tells wired parts each step (groove:step — the
 * Bassline follows the kick). */
(function () {
  'use strict';
  const S = OrganismSDK.STD;
  const ROWS = ['kick', 'snare', 'ghost', 'hat', 'openhat', 'clap', 'perc', 'shaker'];
  const PAD_OF = { kick: 0, snare: 1, ghost: 1, hat: 3, openhat: 4, clap: 2, perc: 9, shaker: 10 };   // as EDM Lab prints to a Sequencer
  const STYLES = ['dubstep', 'ukg', 'house', 'neuro', 'breaks'];
  const blank = () => ROWS.map(() => new Array(32).fill(0));
  function styleMap(kind) {
    const m = blank(), set = (r, steps, v) => steps.forEach(s => { m[ROWS.indexOf(r)][s] = v; });
    const every = (n, off) => Array.from({ length: 32 }, (_, i) => i).filter(i => (i - (off || 0)) % n === 0);
    if (kind === 'ukg') { set('kick', [0, 10, 16, 26], 1); set('snare', [4, 12, 20, 28], 0.95); set('hat', every(4, 2), 0.9); set('ghost', [7, 15, 23, 30], 0.5); set('shaker', every(2, 1), 0.4); set('perc', [3, 19], 0.5); }
    else if (kind === 'dubstep') { set('kick', [0, 10, 16, 22, 26], 1); set('snare', [8, 24], 1); set('clap', [8, 24], 0.8); set('hat', every(4, 2), 0.85); set('ghost', [14, 30], 0.45); set('openhat', [30], 0.5); }
    else if (kind === 'house') { set('kick', every(4), 1); set('clap', [4, 12, 20, 28], 0.9); set('openhat', every(4, 2), 0.85); set('hat', every(2, 1), 0.5); set('shaker', every(1), 0.3); }
    else if (kind === 'neuro') { set('kick', [0, 10, 16, 26], 1); set('snare', [4, 12, 20, 28], 1); set('hat', every(2), 0.7); set('ghost', [6, 14, 18, 22, 30], 0.5); set('perc', [11, 27], 0.4); }
    else { set('kick', [0, 7, 10, 16, 23], 0.9); set('snare', [4, 12, 20, 28], 0.85); set('hat', every(2), 0.55); set('ghost', [15, 31], 0.35); set('shaker', every(4, 3), 0.3); }
    return m;
  }
  OrganismFactory.define({
    id: 'eravos.groove-gen', domain: 'music', version: '1.0.0', label: 'Groove', icon: '🥁', accent: '#ffaa00',
    category: 'Generators', blurb: 'Paint where the rhythm is busy, turn ENERGY: it plays any drum tool wired to it. EDM Lab’s rhythm, as a part.',
    size: { w: 560, h: 380 }, minSize: { w: 420, h: 300 },
    permissions: ['audio_out', 'bus_publish', 'bus_subscribe', 'registry_read'],   // audio_out: its mod input is an audio-rate port
    provides: ['capability.generation', 'capability.note_out'],
    hooks: [
      S.note_out('groove.hook.note_out'), S.transport_in('groove.hook.transport_in'),
      S.event('groove.hook.step_out', 'out', 'groove:step', { type: 'object', required: ['step', 'time'] }, '1.0.0'),
      S.mod_in('groove.hook.mod_energy', 'energy'),
    ],
    config: [
      { key: 'style', type: 'enum', options: STYLES, default: 'dubstep', label: 'Style', group: 'GROOVE', hint: 'starts the painted map from this style (painting changes it)' },
      { key: 'energy', type: 'number', default: 0.6, min: 0, max: 1, step: 0.01, label: 'ENERGY', group: 'GROOVE', hint: 'how many of the painted hits fire, and how hard' },
      { key: 'swing', type: 'number', default: 0.1, min: 0, max: 0.6, step: 0.01, label: 'Swing', group: 'GROOVE' },
      { key: 'seed', type: 'integer', default: 7, min: 1, max: 99999, label: 'Seed', group: 'GROOVE' },
    ],
    ui_hooks: ['paint', 'clear', 'reseed'],
    presets: {},
    engine(ctx) {
      const ac = ctx.ac, P = ctx.params, dsp = ctx.dsp;
      let map = styleMap(P.get('style'));
      P.onChange('style', () => { map = styleMap(P.get('style')); ctx.emitUI('map', { map }); });
      // event-rate modulation: a summing bus sampled at tick time (as EDM Lab does)
      const cs = ctx.modBus('energy', { min: 0, max: 1 }), an = ac.createAnalyser(); an.fftSize = 32; cs.connect(an); const mb = new Float32Array(32);
      const modE = () => { an.getFloatTimeDomainData(mb); return mb[mb.length - 1] || 0; };
      const energy = () => Math.max(0, Math.min(1, P.get('energy') + modE()));
      const hitRand = (bar, row, step) => dsp.mulberry32((P.get('seed') * 7919 + bar * 131 + row * 17 + step) >>> 0)();
      function hits(bar, step) {
        const s32 = (bar % 2) * 16 + step, e = energy();
        return ROWS.map((r, i) => map[i][s32] > 0 && hitRand(bar, i, step) < map[i][s32] * (0.35 + 0.65 * e) * (r === 'kick' || r === 'snare' ? 1.4 : 1) ? map[i][s32] : 0);
      }
      ctx.hits = hits;
      ctx.onTick((tk) => {
        const bar = Math.floor(tk.step16 / 16), step = tk.step16 % 16;
        const t = tk.time + (step % 2 === 1 ? P.get('swing') * tk.stepDur : 0), h = hits(bar, step), e = energy();
        const to = ctx.wiredOut('groove.hook.note_out');
        h.forEach((v, i) => { if (!v) return; const vel = Math.min(1, v * (0.6 + 0.4 * e)); to.forEach(target => ctx.emit('note:trigger', { target, note: 36 + PAD_OF[ROWS[i]], velocity: vel, time: t, duration: 0.1 })); });
        ctx.emit('groove:step', { step: tk.step16, bar, time: t, stepDur: tk.stepDur, kick: h[0] > 0, snare: h[1] > 0, energy: e });
        ctx.emitUI('hits', { step: (bar % 2) * 16 + step, rows: h.map(v => v > 0), time: tk.time });
      });
      ctx.onUI('paint', { type: 'object', required: ['row', 'step', 'value'] }, (p) => {
        const r = Math.max(0, Math.min(8, p.radius || 0)), row = Math.max(0, Math.min(7, p.row | 0));
        for (let s = p.step - Math.ceil(r); s <= p.step + Math.ceil(r); s++) { if (s < 0 || s > 31) continue; const w = r ? Math.max(0, 1 - Math.abs(s - p.step) / (r + 1)) : (s === p.step ? 1 : 0); if (w > 0) map[row][s] = p.value ? Math.max(map[row][s], p.value * w) : 0; }
        ctx.emitUI('map', { map });
      });
      ctx.onUI('clear', { type: 'object' }, (p) => { if (typeof p.row === 'number') map[p.row].fill(0); else map = blank(); ctx.emitUI('map', { map }); });
      ctx.onUI('reseed', null, () => P.set('seed', Math.floor(Math.random() * 99998) + 1));
      ctx.stateExtra = () => ({ map, rows: ROWS });
      ctx.saveExtra = () => ({ map });
      ctx.loadExtra = (x) => { if (x && Array.isArray(x.map)) { map = x.map; ctx.emitUI('map', { map }); } };
      ctx.internals = { get map() { return map; }, set map(m) { map = m; }, styleMap, ROWS, PAD_OF };
      return { unmount() { try { cs.disconnect(); } catch (e) {} } };
    },
  });
})();
