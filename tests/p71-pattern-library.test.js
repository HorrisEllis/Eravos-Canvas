/* 3.71 — James, 2026-10-24: "what about instead of so much songs, we have a pattern library" */
window.__phase = 'P71';
describe('🧩 Pattern Library: one idea at a time, from every genre (3.71)', () => {
  const L = () => PatternLibrary.all();
  it('at least 300 patterns, every type, each with a genre, a real tool, a length, its notes or its curve', () => {
    const lib = L(); assert.gt(lib.length, 299, lib.length + ' patterns');
    PatternLibrary.types.forEach(t => assert.ok(lib.some(p => p.type === t.id), 'type ' + t.id));
    const bad = lib.filter(p => !p.genre || !OrganismFactory.def(p.tool) || !(p.bars >= 1) || (p.type === 'curve' ? !(p.curve && p.curve.points.length) : !(p.notes && p.notes.length)));
    assert.equal(bad.map(p => p.name + ' (' + p.tool + ')').slice(0, 5).join(' · '), '');
    assert.equal(new Set(lib.map(p => p.id)).size, lib.length, 'ids unique');
  });
  it('Floor Falls’ four drops are there by name, with what makes them: the bends', () => {
    const drops = L().filter(p => p.type === 'drop' && p.move);
    assert.deepEqual(drops.map(p => p.move).sort(), ['falls', 'freefall', 'rises', 'stairs']);
    assert.equal(drops.find(p => p.move === 'stairs').notes.length, 4, 'four steps');
    assert.ok(drops.every(p => p.notes.some(n => n.b)), 'every drop bends');
    assert.ok(L().some(p => p.type === 'curve' && p.move === 'freefall'), 'the freefall curves too');
    assert.ok(L().some(p => p.type === 'wobble' && p.notes.some(n => n.p && n.p.div)), 'a wobble phrase keeps its rate per note');
  });
  function uni() { const ctx = new OfflineAudioContext(2, 24000, 24000), K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 140 }).boot(); return K; }
  it('→ Timeline: a new track with the tool, in the song’s key; the next one of that kind goes after it on the same track; a curve lands under it', () => {
    const K = uni(), wob = L().find(p => p.type === 'wobble' && p.bars >= 1), cur = L().find(p => p.type === 'curve' && p.tool === wob.tool);
    const tl = OrganismFactory.spawn('eravos.timeline', { K, headless: true }); K.bus.publish('theory:key-change', { root: 2, scale: 'minor' });
    const T = OrganismFactory.handle(tl).ctx; T.key = T.key || { root: 2, scale: 'minor' };
    const a = PatternLibrary.send(wob, { K, headless: true }), b = PatternLibrary.send(wob, { K, headless: true });
    assert.ok(a && b && a.lane.id === b.lane.id, 'same track'); assert.equal(K.registry.get(a.tool).organism_id, wob.tool, 'the right tool');
    const clips = T.internals.clips.filter(c => c.lane === a.lane.id).sort((x, y) => x.startBar - y.startBar);
    assert.equal(clips.length, 2); assert.equal(clips[1].startBar, clips[0].startBar + wob.bars, 'after the first');
    const root = T.key ? +T.key.root || 0 : 0; assert.equal(clips[0].notes[0].n - root, wob.notes.slice().sort((x, y) => x.s - y.s || (x.r - y.r))[0].r, 'in the key');
    assert.ok(clips[0].notes.some(n => n.b) === wob.notes.some(n => n.b), 'the bends come along');
    if (cur) { PatternLibrary.send(cur, { K, headless: true, bar: 1 }); assert.ok(T.internals.lanes.some(l => l.kind === 'auto' && l.key === cur.curve.key && l.target === a.tool), 'the curve under the track'); }
    OrganismFactory.clearAll(K);
  });
  it('▶ hear it: a drum groove and a drop render to sound, off the canvas', async () => {
    const n0 = Kernel.registry.list().length;
    for (const p of [L().find(x => x.type === 'drums'), L().find(x => x.type === 'drop' && x.move === 'falls')]) {
      const r = await PatternLibrary.render(p); assert.ok(r && !r.silent, p.name + ' sounds');
    }
    assert.equal(Kernel.registry.list().length, n0, 'nothing added to the canvas');
  });
  it('the page: type and genre chips, a card per pattern, the type chip filters', () => {
    const pg = PatternLibrary.open(); try {
      const ov = document.querySelector('.plib'); assert.ok(ov, 'open');
      const cards = () => ov.querySelectorAll('.plib-card').length; assert.gt(cards(), 50);
      const chip = [...ov.querySelectorAll('.sbk-chip')].find(b => /Drops/.test(b.textContent)); chip.click();
      assert.ok([...ov.querySelectorAll('.plib-card small')].every(s => /Drops/.test(s.textContent)), 'only drops'); assert.ok(cards() >= 4);
      assert.ok(ov.querySelector('.plib-card button'), '▶ and → Timeline on every card');
    } finally { pg.close(); }
  });
});
