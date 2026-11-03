/* P94 · the Wobble Bass suite (3.95) — asked: "maybe make it a suite. with all of the enhancements you did" · "all the pieces of the
 * wobble base wire together." Every part is built, every wire the suite names is on, one bassline plays three voices, and it sounds. */
window.__phase = 'P94';
describe('P94 · the Wobble Bass suite — every piece wired together', () => {
  const F = () => OrganismFactory, ctxOf = (id) => F().handle(id).ctx;
  const wired = (K, a, ah, b, bh) => K.wires.list().some(w => w.src.instanceId === a && (!ah || w.src.hookId === ah) && w.dst.instanceId === b && (!bh || w.dst.hookId === bh));
  it('built whole: every part is here and every wire the suite names is on', () => {
    const U = TH.universe(0.2, { bpm: 140 }), K = U.K, s = Suites.get('music.wobble-suite'), hub = Suites.open('music.wobble-suite', { K });
    assert.ok(s && hub, 'the suite is indexed and opens');
    Suites.build(K, hub);
    s.parts.forEach(p => assert.ok(Suites.instanceOf(K, hub, p.tool), p.tool + ' is a member'));
    s.wiring.forEach(w => { const a = Suites.instanceOf(K, hub, w.from[0]), b = Suites.instanceOf(K, hub, w.to[0]);
      assert.ok(wired(K, a, w.from[1], b, w.to[1]), `${w.from.join(' ')} → ${w.to.join(' ')}`); });
    assert.ok(Suites.wiring(K, hub).every(w => w.on || !w.possible), 'every possible wire is on');
    const bass = Suites.instanceOf(K, hub, 'eravos.bass-gen');
    ['eravos.wobble-bass', 'eravos.bass-forge', 'eravos.sub-engine'].forEach(t => assert.ok(wired(K, bass, 'bassg.hook.note_out', Suites.instanceOf(K, hub, t)), 'one line plays ' + t));
    ['eravos.drum-forge', 'eravos.wobble-bass', 'eravos.bass-forge', 'eravos.sub-engine'].forEach(t => assert.ok(wired(K, Suites.instanceOf(K, hub, t), null, hub, 'suite.hook.audio_in'), t + ' ends in the suite'));
  });
  it('a macro turns every target at once; it sounds', async () => {
    const U = TH.universe(1.2, { bpm: 140 }), K = U.K, hub = Suites.open('music.wobble-suite', { K }); Suites.build(K, hub);
    const grit = Suites.get('music.wobble-suite').macros.findIndex(m => m.label === 'GRIT');
    const drv = () => ['eravos.wobble-bass', 'eravos.bass-forge', 'eravos.fx-destroyer'].map(t => ctxOf(Suites.instanceOf(K, hub, t)).params.get('drive'));
    Suites.macro(K, hub, grit, 0); const lo = drv(); Suites.macro(K, hub, grit, 1); const hi = drv();
    hi.forEach((v, i) => assert.gt(v, lo[i], 'GRIT turns drive ' + i + ': ' + lo[i] + ' → ' + v));
    TH.note(U, Suites.instanceOf(K, hub, 'eravos.wobble-bass'), 33, 0.05, { duration: 1 });
    TH.note(U, Suites.instanceOf(K, hub, 'eravos.bass-forge'), 33, 0.05, { duration: 1 });
    const b = await TH.render(U); assert.gt(TH.db(TH.rms(b, 0.2, 1)), -40, 'the wobble and the growl sound through the suite');
  });
});
