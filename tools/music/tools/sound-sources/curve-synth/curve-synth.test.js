/* Curve (eravos.curve-synth) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.curve-synth');

// 3.53 — "the curve tool is also not working, is a little weird. It's not doing much. The overlap is important."
window.__phase = 'P53';
describe('Curve 1.1 — plays the notes it is given, as long as they last, overlaps and all', () => {
  const uni = (sec) => { const sr = 22050, ctx = new OfflineAudioContext(1, Math.ceil(sec * sr), sr), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 127 }).boot(); return { sr, ctx, K }; };
  it('Follow note: the gesture starts exactly on the note played and bends ±Span from it', () => {
    const { K } = uni(0.2), a = OrganismFactory.spawn('eravos.curve-synth', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    c.params.set('follow', 'note'); c.params.set('span', 12);
    [48, 60, 72].forEach(n => { const { ys, freqs } = c.internals.path(0, n); assert.near(freqs[0], MusicTheory.hz(n), 0.01); const top = Math.max(...ys); assert.near(Math.max(...freqs), MusicTheory.hz(n + (top - ys[0]) * 12), 0.5); });
  });
  it('Length note + overlapping notes (a timeline lead): sound under every sixteenth a note is held', async () => {
    const notes = [[0, 17, 61], [8, 11, 73], [10, 15, 64], [16, 17, 64], [24, 11, 73], [26, 15, 68], [32, 17, 69], [40, 11, 81], [42, 15, 73], [48, 17, 71]];
    const sd = 15 / 127, { sr, ctx, K } = uni(70 * sd + 1), a = OrganismFactory.spawn('eravos.curve-synth', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    c.presets.load('Bending Lead');
    K.audio.chain.out.gain.value = 0; K.audio.port(a, 'out').node.connect(ctx.destination);
    notes.forEach(([s, l, n]) => K.bus.publish('note:trigger', { target: a, note: n, velocity: 0.9, time: 0.1 + s * sd, duration: l * sd }));
    const d = (await ctx.startRendering()).getChannelData(0), silent = [];
    for (let s = 0; s < 65; s++) { const i0 = Math.floor((0.1 + s * sd) * sr), i1 = Math.floor((0.1 + (s + 1) * sd) * sr); let q = 0; for (let i = i0; i < i1; i++) q += d[i] * d[i]; if (10 * Math.log10(q / (i1 - i0) + 1e-12) < -50) silent.push(s); }
    assert.equal(silent.join(','), '', 'silent sixteenths while a note is held');
  });
  it('the 1.0 presets keep their sound: a fixed sweep, Duration long', () => {
    const { K } = uni(0.2), a = OrganismFactory.spawn('eravos.curve-synth', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    ['Songs-for-the-Dead Dive', 'Ricochet', 'Siren', 'Drop Whoop'].forEach(n => { c.presets.load(n); assert.equal(c.params.get('follow'), 'range', n); assert.equal(c.params.get('length'), 'fixed', n); });
  });
});
