/* P48.8 + P48.10 · the suite as a control panel; EDM Lab rebuilt as a suite of parts (map eravos.phase48-map, ADDENDUM "later").
 * James, 2026-10-21: "the suite should be like a synthesis tool of the respective tools. Like the edm lab needs rebuilt. like a control
 * panel of the respective tools. basically to group them, like anything form a tool that other tools can use need to be decomposed,
 * and grouped by the tool suite" */
window.__phase = 'P48';
describe('P48.10 · EDM Lab as a suite — Groove, Chords, Bassline as parts; the suite as a control panel', () => {
  const F = () => OrganismFactory, ctxOf = (id) => F().handle(id).ctx;
  const wire = (U, a, ah, b, bh) => { const r = U.K.wires.register({ src: { instanceId: a, hookId: ah }, dst: { instanceId: b, hookId: bh } }); assert.ok(r.ok, `${ah} → ${bh}: ${JSON.stringify(r.fault || '')}`); return r; };
  const notesFrom = (U, src) => { const got = []; U.K.bus.subscribe('note:trigger', (p) => { if (p._from === src) got.push(p); }, 'test'); return got; };

  it('Groove plays EDM Lab 3.0’s rhythm: same map, seed and energy → the same hits', () => {
    const U = TH.universe(0.2), old = TH.spawn(U, 'eravos.edm-lab'), g = TH.spawn(U, 'eravos.groove-gen');
    ctxOf(old).params.setMany({ seed: 7, energy: 0.6 }); ctxOf(g).params.setMany({ seed: 7, energy: 0.6, style: 'dubstep' });
    assert.deepEqual(ctxOf(g).internals.map, ctxOf(old).internals.map, 'the dubstep map is EDM Lab’s');
    for (let bar = 0; bar < 2; bar++) for (let st = 0; st < 16; st++) assert.deepEqual(ctxOf(g).hits(bar, st), ctxOf(old).hits(bar, st), `bar ${bar} step ${st}`);
  });
  it('Groove sends its hits to the drum tool wired to it, and to nothing else; ENERGY decides how many fire', () => {
    const count = (e) => {
      const U = TH.universe(0.2), g = TH.spawn(U, 'eravos.groove-gen'), pads = TH.spawn(U, 'eravos.pads'), other = TH.spawn(U, 'eravos.pads');
      ctxOf(g).params.setMany({ energy: e, swing: 0 }); wire(U, g, 'groove.hook.note_out', pads, 'pads.hook.note_in');
      const got = notesFrom(U, g); U.T.renderTicks(0, 32, 0.05);
      assert.ok(got.every(p => p.target === pads), 'only the wired Pads'); assert.ok(!got.some(p => p.target === other));
      assert.ok(got.every(p => p.note >= 36 && p.note < 52), 'pad notes 36…51');
      return got.length;
    };
    const lo = count(0), hi = count(1); assert.gt(hi, lo, `energy 1 fires more hits (${hi}) than energy 0 (${lo})`); assert.gt(lo, 0, 'even at 0 the strongest painted hits fire');
  });
  it('Chords: a chord every bar in key to the wired poly tool; TENSION 0.9 voices a cluster; it tells the bassline the chord', () => {
    const U = TH.universe(0.2), c = TH.spawn(U, 'eravos.chord-gen'), pf = TH.spawn(U, 'eravos.pad-forge');
    wire(U, c, 'chordg.hook.note_out', pf, 'pad.hook.note_in');
    const got = notesFrom(U, c), chords = []; U.K.bus.subscribe('harmony:chord', (p) => { if (p._from === c) chords.push(p); }, 'test');
    ctxOf(c).params.setMany({ tension: 0.1, chordBars: 1 }); U.T.renderTicks(0, 64, 0.05);
    assert.equal(chords.length, 4, 'four bars → four chords'); assert.deepEqual(chords.map(x => x.degree), [1, 6, 3, 7], 'i-VI-III-VII');
    assert.ok(got.length === 16 && got.every(p => p.target === pf), 'four notes each, to the wired Pad Forge');
    assert.ok(got.every(p => MusicTheory.inScale(p.note, ctxOf(c).key.root, ctxOf(c).key.scale)), 'every note in key at low tension');
    const cl = ctxOf(c).voicing(1, 0.9); assert.deepEqual([cl[1] - cl[0], cl[2] - cl[0]], [6, 13], 'cluster: tritone and b9 over the root');
  });
  it('Bassline: the root of the wired Chords’ chord, on the wired Groove’s kick; alone it plays its own pattern', () => {
    const U = TH.universe(0.2), g = TH.spawn(U, 'eravos.groove-gen'), c = TH.spawn(U, 'eravos.chord-gen'), b = TH.spawn(U, 'eravos.bass-gen'), r = TH.spawn(U, 'eravos.reese-bass');
    ctxOf(g).params.setMany({ swing: 0, energy: 1 }); ctxOf(b).params.setMany({ energy: 0.5 });
    wire(U, c, 'chordg.hook.chord_out', b, 'bassg.hook.chord_in'); wire(U, g, 'groove.hook.step_out', b, 'bassg.hook.groove_in'); wire(U, b, 'bassg.hook.note_out', r, 'reese.hook.note_in');
    const bass = notesFrom(U, b), kicks = [], chords = [];
    U.K.bus.subscribe('groove:step', (p) => { if (p._from === g && p.kick) kicks.push(+p.time.toFixed(6)); }, 'test');
    U.K.bus.subscribe('harmony:chord', (p) => { if (p._from === c) chords.push(p); }, 'test');
    U.T.renderTicks(0, 32, 0.05);
    assert.gt(bass.length, 0, 'it played'); assert.deepEqual(bass.map(p => +p.time.toFixed(6)), kicks, 'one note on each kick, at its time');
    assert.ok(bass.every(p => p.target === r), 'to the wired Reese Bass');
    // strict (2026-10-22): each note is the root of the chord playing AT ITS TIME — a kick at a chord change waits for that chord
    const at = (t) => chords.filter(x => x.time <= t + 1e-6).pop();
    bass.forEach(p => assert.equal(p.note % 12, at(p.time).notes[0] % 12, `bass at ${p.time.toFixed(3)} s is the root of the chord then (${at(p.time).name})`));
    // alone: its own steps (groove kick with no Groove = steps 0 and 10)
    const U2 = TH.universe(0.2), b2 = TH.spawn(U2, 'eravos.bass-gen'), r2 = TH.spawn(U2, 'eravos.reese-bass'); wire(U2, b2, 'bassg.hook.note_out', r2, 'reese.hook.note_in');
    const own = notesFrom(U2, b2); U2.T.renderTicks(0, 16, 0.05); assert.equal(own.length, 2, 'two notes in a bar on its own');
  });
  it('the EDM Lab suite: built whole, every wire on, ENERGY turns all three generators, a scene sets every part, and it sounds', async () => {
    const U = TH.universe(2.2, { bpm: 140 }), K = U.K, hub = Suites.open('music.edm-lab', { K });
    assert.equal(ctxOf(hub).params.get('m1'), 0.6, 'the ENERGY knob starts at the suite’s own default');
    const out = Suites.build(K, hub); assert.equal(out.filter(Boolean).length, 6, 'six required parts');
    // found 2026-10-21: a generator opened before its instrument joined nothing, and the starter scene opened a second one
    ['eravos.groove-gen', 'eravos.pads', 'eravos.chord-gen', 'eravos.pad-forge', 'eravos.bass-gen', 'eravos.reese-bass'].forEach(t => assert.equal(K.registry.byOrganism(t).length, 1, t + ' opened once'));
    assert.ok(Suites.wiring(K, hub).every(w => w.on || !w.possible), 'every wire whose ends are here is on: ' + JSON.stringify(Suites.wiring(K, hub).filter(w => !w.on && w.possible).map(w => w.wire)));
    const at = (t) => Suites.instanceOf(K, hub, t);
    assert.equal(Suites.macro(K, hub, 0, 1), 3, 'ENERGY reached three parts');
    ['eravos.groove-gen', 'eravos.chord-gen', 'eravos.bass-gen'].forEach(t => assert.equal(ctxOf(at(t)).params.get('energy'), 1, t + ' energy 1'));
    assert.equal(ctxOf(hub).params.get('m1'), 1, 'the macro is kept on the suite window');
    Suites.macro(K, hub, 1, 0.9); assert.equal(ctxOf(at('eravos.chord-gen')).params.get('tension'), 0.9, 'TENSION');
    Suites.scene(K, hub, 'House'); assert.equal(ctxOf(at('eravos.groove-gen')).params.get('style'), 'house', 'the House scene set the Groove');
    U.T.renderTicks(0, 32, 0.05); const buf = await TH.render(U);
    assert.gt(TH.db(TH.rms(buf, 0.1, 1.9)), -45, 'drums, chords and bass come out of the suite');
  });
  it('the panel: every part’s controls inside the suite window, macros on top, ⤢ shows a whole face, the part windows fold', async () => {
    if (!CanvasWM.world) { CanvasWM.init(document.getElementById('wmhost'), Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    const K = Kernel, hub = Suites.open('music.edm-lab', { K, x: 20, y: 20 }); await TH.sleep(40);
    const ids = () => Array.from(Suites.members(K, hub).keys());
    try {
      const win = CanvasWM.windowOf(hub);
      assert.ok(win.querySelector('.su-build'), 'empty: the panel offers to build');
      Suites.build(K, hub); await TH.sleep(80);
      assert.equal(win.querySelectorAll('.su-macro').length, 3, 'ENERGY, TENSION, SWING');
      assert.equal(win.querySelectorAll('.su-card').length, 6, 'a card per part');
      const gc = win.querySelector(`.su-card[data-instance="${Suites.instanceOf(K, hub, 'eravos.groove-gen')}"]`);
      assert.ok(gc && gc.querySelector('.uk-knob'), 'the Groove’s knobs are on its card');
      Array.from(gc.querySelectorAll('.su-chead button')).find(b => b.textContent === '⤢').click(); await TH.sleep(40);
      assert.ok(win.querySelector(`.su-card[data-instance="${Suites.instanceOf(K, hub, 'eravos.groove-gen')}"] .gg-map`), '⤢ shows its whole face — the paint canvas — inside the suite');
      win.querySelector('.su-fold').click(); await TH.sleep(20);
      assert.ok(ids().every(id => !CanvasWM.windowOf(id) || CanvasWM.windowOf(id).classList.contains('collapsed')), 'every part window folded to its title bar');
    } finally { ids().forEach(id => F().close(id)); F().close(hub); }
  });
});
