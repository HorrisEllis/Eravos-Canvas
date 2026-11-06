/* P132 · the Lofi setup — his words: "i also want to be able to make lofi" (2026-11-05) · "nope look at the claude.md" · "yes" (2026-11-06).
 * Lofi is not a tool (Axiom 1): a setup of whole tools (Axiom 3) + Lofi packs beside them + two additions to existing tools, each its
 * default unchanged: Chords' Voicing (7th, 9th, rootless 9) and the jazz progressions; Groove's boom bap style. specs/eravos.lofi-setup.spec */
window.__phase = 'P132';
describe('P132 · the Lofi setup: whole tools, packs, jazz chords, boom bap', () => {
  it('Start › SETUPS › Lofi builds every part and every wire, with no faults', async () => {
    const s = Suites.get('music.lofi'); assert.ok(s && s.kind === 'setup', 'a setup (not a suite, not a tool)');
    await TH.sleep(60); const r = Recipes.get('setup:music.lofi'); assert.ok(r && r.section === 'SETUPS', 'a Start card');
    const U = TH.universe(0.2), rep = await Recipes.run('setup:music.lofi', { K: U.K, headless: true });
    const hub = U.K.registry.byOrganism('eravos.suite-hub')[0]; assert.ok(hub, 'its suite window opened');
    const st = Suites.status(U.K, hub.instance_id); assert.equal(st.filter(x => x.instanceId).length, s.parts.length, 'every part built');
    assert.equal(rep.faults.length, 0, 'no faults: ' + JSON.stringify(rep.faults.slice(0, 2)));
    assert.equal(Math.round(U.T.bpm), 82, 'the setup sets lofi’s tempo (82 BPM)');
    const id = (t) => U.K.registry.byOrganism(t)[0].instance_id;
    s.wiring.forEach(w => { const a = id(w.from[0]), b = id(w.to[0]); assert.ok(U.K.wires.list().some(x => x.src.instanceId === a && x.src.hookId === w.from[1] && x.dst.instanceId === b && x.dst.hookId === w.to[1]), `${w.from.join('.')} → ${w.to.join('.')}`); });
  });
  it('every scene’s presets and the starter exist; every macro moves a real control in range', () => {
    const s = Suites.get('music.lofi'), def = (t) => OrganismFactory.def(t);
    assert.ok(s.scenes[s.starter], 'the starter is a scene');
    s.parts.forEach(p => { if (p.preset) assert.ok(def(p.tool).presets && def(p.tool).presets[p.preset], `${p.tool}: preset "${p.preset}"`); });
    Object.entries(s.scenes).forEach(([n, sc]) => Object.entries(sc).forEach(([t, o]) => assert.ok(def(t).presets[o.preset], `scene ${n}: ${t} "${o.preset}"`)));
    s.macros.forEach(m => m.targets.forEach(tg => { const c = def(tg.tool).config.find(x => x.key === tg.key); assert.ok(c, `${m.label}: ${tg.tool}.${tg.key}`);
      if (tg.min !== undefined) { const lo = Math.min(tg.min, tg.max), hi = Math.max(tg.min, tg.max); assert.ok(lo >= c.min && hi <= c.max, `${m.label}: ${tg.key} ${tg.min}…${tg.max} inside ${c.min}…${c.max}`); } }));
  });
  it('the Lofi Chords play jazz chords and the Bassline follows their roots; Groove’s boom bap lands kick and snare where it should', () => {
    const U = TH.universe(0.2), cg = TH.spawn(U, 'eravos.chord-gen'), C = OrganismFactory.handle(cg).ctx;
    U.K.bus.publish('ui:preset_load:' + cg, { name: 'Lofi Rainy' }); assert.equal(C.params.get('voicing'), 'rootless 9'); assert.equal(C.params.get('progression'), 'ii-V-I-vi');
    assert.equal(C.voicing(2, 0).length, 4, 'four notes, no root'); assert.equal(C.chordAt(0), 2, 'the first chord is the ii');
    const g = TH.spawn(U, 'eravos.groove-gen'), G = OrganismFactory.handle(g).ctx, m = G.internals.styleMap('boom bap');
    assert.equal(m[0][0], 1, 'kick on 1'); assert.equal(m[1][4], 1, 'snare on 2'); assert.equal(m[1][12], 1, 'snare on 4'); assert.equal(m[0][4], 0, 'no kick on the snare');
    assert.deepEqual(OrganismFactory.def('eravos.groove-gen').config.find(x => x.key === 'style').options, ['dubstep', 'ukg', 'house', 'neuro', 'breaks', 'boom bap'], 'the five styles first, in order; boom bap added');
    assert.equal(G.params.get('style'), 'dubstep', 'Groove’s default unchanged');
  });
});
