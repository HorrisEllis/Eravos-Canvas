/* P119 · suites are a tool and its components wired; systems of whole tools are setups; make your own from the canvas
 * His words, 2026-11-06: "Suites are tools with each component wired in." · "can you clear out suites and make them the tool and its
 * components wired together? But also the ability to create them?" · (asked how) "That or setups on the screen. Like what's wired
 * together. This is meant to be a way to explore creatively. Like connecting things to things and seeing what can be made from it.
 * Across domains." · "Each tool with each component/ui/packs/mod/suite/etc all with a clear line of seperation all added to the tool page" */
window.__phase = 'P119';
describe('P119 · suites, setups, your own suites, the Components and Suites tabs', () => {
  it('the suite list holds only suites; the 7 systems of whole tools are Start › SETUPS cards, opening exactly as before', async () => {
    assert.ok(Suites.list().every(s => s.kind === 'suite'), 'only suites listed');
    assert.ok(Suites.get('music.wub-lab') && Suites.list().includes(Suites.get('music.wub-lab')), 'Wub Lab (Wobble Bass as parts) is a suite');
    const set = Suites.setups().map(s => s.id).sort();
    assert.deepEqual(set, ['music.edm-lab', 'music.gothic', 'music.heavy-drops', 'music.sound-system', 'music.synthwave', 'music.wobble-suite', 'music.xen']);
    await TH.sleep(60);
    set.forEach(id => { const r = Recipes.get('setup:' + id); assert.ok(r && r.section === 'SETUPS' && r.steps[0].op === 'suite', id + ' is a Start card'); });
    assert.ok(Recipes.list().some(r => r.id === 'setup:music.synthwave'), 'offered on Start');
    const U = TH.universe(0.2), rep = await Recipes.run('setup:music.xen', { K: U.K, headless: true });
    const hub = U.K.registry.byOrganism('eravos.suite-hub')[0]; assert.ok(hub, 'its suite window opened');
    const sx = Suites.get('music.xen'), req = sx.parts.filter(p => p.required).length || sx.parts.length;
    assert.equal(Suites.status(U.K, hub.instance_id).filter(x => x.instanceId).length, req, 'and every part it needs is built (as Build the whole suite did)');
    assert.equal(rep.faults.length, 0, 'no faults');
  });
  it('Save what is wired as a suite: parts, wires and settings, across tools; kept, listed, opened, deleted', () => {
    const U = TH.universe(0.2), K = U.K, a = TH.spawn(U, 'eravos.retro-poly'), b = TH.spawn(U, 'eravos.fx-echo'), lone = TH.spawn(U, 'eravos.sub-engine');
    const w = K.wires.register({ src: { instanceId: a, hookId: 'rp.hook.audio_out' }, dst: { instanceId: b, hookId: 'fx.hook.audio_in' } }); assert.ok(w.ok, 'wired');
    K.bus.publish('ui:config_change:' + a, { key: 'cutoff', value: 1234 });
    assert.equal(Suites.capture(K, lone), null, 'a window wired to nothing is not a suite');
    const s = Suites.capture(K, b, { label: 'Night Echo' });
    assert.deepEqual(s.parts.map(p => p.tool).sort(), ['eravos.fx-echo', 'eravos.retro-poly'], 'the wired group, nothing else');
    assert.deepEqual(s.wiring, [{ from: ['eravos.retro-poly', 'rp.hook.audio_out'], to: ['eravos.fx-echo', 'fx.hook.audio_in'] }], 'its wires');
    assert.equal(s.scenes['As saved']['eravos.retro-poly'].params.cutoff, 1234, 'its settings, as a scene');
    assert.equal(s.kind, 'suite'); assert.ok(s.user); assert.equal(s.hub, 'eravos.suite-hub', 'opens in the domain’s suite window');
    try {
      assert.ok(Suites.saveUser(s)); assert.ok(Suites.list().some(x => x.id === s.id), 'listed with the suites');
      assert.ok(JSON.parse(localStorage.getItem('eravos.userSuites')).some(x => x.id === s.id), 'kept across restarts');
      const V = TH.universe(0.2), hub = Suites.open(s.id, { K: V.K }); Suites.build(V.K, hub);
      const echo = Suites.instanceOf(V.K, hub, 'eravos.fx-echo'), rp = Suites.instanceOf(V.K, hub, 'eravos.retro-poly');
      assert.ok(echo && rp, 'opening it builds both parts');
      assert.ok(V.K.wires.list().some(x => x.src.instanceId === rp && x.dst.instanceId === echo), 'wired as saved');
      assert.equal(OrganismFactory.handle(rp).ctx.params.get('cutoff'), 1234, 'set as saved');
    } finally { Suites.removeUser(s.id); }
    assert.ok(!Suites.get(s.id) && !JSON.parse(localStorage.getItem('eravos.userSuites') || '[]').some(x => x.id === s.id), 'deleted for good');
  });
  it('the tool page: Components and Suites, each its own tab', () => {
    try {
      let el = ToolPage.open('eravos.wobble-bass', { K: Kernel });
      const comp = el.querySelector('.tp-sec[data-sec="components"]'), su = el.querySelector('.tp-sec[data-sec="suites"]');
      assert.ok(comp && /filter formant/.test(comp.textContent) && /Wub Filter/.test(comp.textContent), 'Components: filter-formant, shared with Wub Filter');
      assert.ok(/Comes out of it/.test(comp.textContent) && /Planned/.test(comp.textContent), 'what comes out of it, what is planned');
      assert.ok(su && /Wub Lab/.test(su.textContent) && /Open as suite/.test(su.textContent), 'Suites: open it as its suite');
      assert.ok([...el.querySelectorAll('.tp-nav button')].some(b => /Components/.test(b.textContent)) && [...el.querySelectorAll('.tp-nav button')].some(b => /Suites/.test(b.textContent)), 'both tabs');
    } finally { ToolPage.close(); }
  });
});
