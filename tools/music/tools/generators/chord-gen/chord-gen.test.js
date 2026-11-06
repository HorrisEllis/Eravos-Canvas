/* Chords (eravos.chord-gen) — tests that travel with the tool. The contract is shared (tests/harness.js TH.toolContract):
 * spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind, Stop all is
 * obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.chord-gen');

// 3.132 Voicing (his words: "i also want to be able to make lofi" · "yes" to the Lofi setup)
describe('tool · Chords — Voicing and the jazz progressions (3.132)', () => {
  const MT = window.MusicTheory;
  // today's rule, written out once more: the default voicing must stay exactly this
  function oldRule(degree, ten, k, o) {
    const tri = MT.chord(degree, k.root, k.scale, 'triad', o), r = tri[0];
    if (ten < 0.25) return tri.concat([tri[0] + 12]);
    if (ten < 0.5) return [tri[0], tri[1], tri[2], MT.degreeToMidi(degree + 8, o, k.root, k.scale)];
    if (ten < 0.75) { const s = MT.chord(degree, k.root, k.scale, 'sus4', o); return [s[0], s[1], s[2], MT.degreeToMidi(degree + 6, o, k.root, k.scale)]; }
    return [r, r + 6, r + 13, tri[2] + 12];
  }
  it('the default voicing is today’s rule, for every degree and tension; the progression menu keeps the five first, default unchanged', () => {
    const U = TH.universe(0.2), id = TH.spawn(U, 'eravos.chord-gen'), c = OrganismFactory.handle(id).ctx;
    assert.equal(c.params.get('voicing'), 'tension'); assert.equal(c.params.get('progression'), 'i-VI-III-VII');
    const opts = OrganismFactory.handle(id).def.config.find(x => x.key === 'progression').options; assert.deepEqual(opts.slice(0, 5), Object.keys(MusicParts.PROGRESSIONS)); assert.ok(opts.includes('ii-V-I-vi'), 'the jazz six offered');
    for (let d = 1; d <= 7; d++) for (const t of [0, 0.3, 0.6, 0.9]) assert.deepEqual(c.voicing(d, t), oldRule(d, t, c.key, c.params.get('octave')), `degree ${d} tension ${t}`);
  });
  it('7th / 9th / rootless 9 stack the scale’s own thirds (a minor key: ii is half-diminished, III major 7)', () => {
    const U = TH.universe(0.2), id = TH.spawn(U, 'eravos.chord-gen'), c = OrganismFactory.handle(id).ctx, k = c.key, o = c.params.get('octave');
    const thirds = (d, st) => st.map(x => MT.degreeToMidi(d + x, o, k.root, k.scale));
    c.params.set('voicing', '7th'); assert.deepEqual(c.voicing(2, 0.3), thirds(2, [0, 2, 4, 6]));
    c.params.set('voicing', '9th'); assert.deepEqual(c.voicing(5, 0.9), thirds(5, [0, 2, 4, 6, 8]), 'TENSION does nothing to a jazz voicing');
    c.params.set('voicing', 'rootless 9'); const rl = c.voicing(1, 0); assert.deepEqual(rl, thirds(1, [2, 4, 6, 8])); assert.ok(!rl.includes(thirds(1, [0])[0]), 'no root');
    c.params.set('voicing', '7th'); const i7 = c.voicing(1, 0).map(n => n - c.voicing(1, 0)[0]);
    assert.deepEqual(i7, k.scale === 'minor' ? [0, 3, 7, 10] : i7, 'in minor, i7 is a minor seventh chord');
  });
});
