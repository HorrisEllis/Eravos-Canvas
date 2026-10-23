/* P48.5 · suites as systems — the suite window is the primary system its parts connect to; parts are tools; mixed and matched.
 * spec eravos.suites ADDENDUM 2026-10-21 · map eravos.phase48-map P48.5a/b · James, 2026-10-21: "like how there is 4 wub tools,
 * but no primay system. like i want each tool to have its components as tools, then they all connect to the suite, but can be
 * mixed and matched." */
window.__phase = 'P48';
describe('P48.5 · suites as systems — the suite window and its parts', () => {
  const F = () => OrganismFactory, ctxOf = (id) => F().handle(id).ctx, hookOf = (t, h) => (F().def(t).hooks || []).find(x => x.hook_id === h);
  const wired = (K, a, ah, b, bh) => K.wires.list().some(w => w.src.instanceId === a && (!ah || w.src.hookId === ah) && w.dst.instanceId === b && (!bh || w.dst.hookId === bh));
  const at = (K, hub, t) => Suites.instanceOf(K, hub, t);

  it('every shipped suite: its window and parts are installed, every preset its scenes name exists, every hook its wiring names exists', () => {
    const all = Suites.list(); assert.ok(all.length >= 2, 'Wub Lab and Synthesis Lab are indexed: ' + all.map(s => s.id).join(', '));
    all.forEach(s => {
      assert.ok(F().def(s.hub), `${s.id}: its window ${s.hub}`);
      s.parts.forEach(p => {
        assert.ok(F().def(p.tool), `${s.id}: ${p.tool} installed`);
        if (p.preset) assert.ok(F().def(p.tool).presets[p.preset], `${s.id}: ${p.tool} has “${p.preset}”`);
        if (p.as === 'mod') { assert.ok(s.parts.some(x => x.tool === p.in), `${s.id}: ${p.tool} lives in a part`); assert.ok((F().def(p.in).slots || []).some(x => x.id === p.slot), `${p.in} has slot ${p.slot}`); }
      });
      s.wiring.forEach(w => [w.from, w.to].forEach(([t, h]) => assert.ok(hookOf(t, h), `${s.id}: ${t} has ${h}`)));
      Object.entries(s.scenes).forEach(([n, sc]) => Object.entries(sc).forEach(([t, v]) => {
        assert.ok(s.parts.some(p => p.tool === t), `${s.id} · ${n}: ${t} is a part`);
        if (v.preset) assert.ok(F().def(t).presets[v.preset], `${s.id} · ${n}: ${t} has “${v.preset}”`);
      }));
      if (s.starter) assert.ok(s.scenes[s.starter], `${s.id}: starter scene exists`);
    });
  });
  it('Wub Lab built whole: four parts, wired as the suite says, the mouth and the sub end in the suite; it sounds', async () => {
    const U = TH.universe(1.2, { bpm: 140 }), K = U.K, hub = Suites.open('music.wub-lab', { K });
    assert.ok(hub && ctxOf(hub).params.get('suite') === 'music.wub-lab', 'the suite window holds Wub Lab');
    const out = Suites.build(K, hub); assert.equal(out.filter(Boolean).length, 4, 'every required part');
    const osc = at(K, hub, 'eravos.wub-osc'), filt = at(K, hub, 'eravos.wub-filter'), rate = at(K, hub, 'eravos.wub-rate'), sub = at(K, hub, 'eravos.wub-sub');
    assert.ok(osc && filt && rate && sub, 'all four are members');
    assert.ok(wired(K, osc, 'wubo.hook.audio_out', filt, 'fx.hook.audio_in'), 'voice → mouth');
    assert.ok(wired(K, rate, 'wubrate.hook.mod_out', filt, 'wubf.hook.mod_wub'), 'rhythm → mouth');
    assert.ok(wired(K, filt, null, hub, 'suite.hook.audio_in') && wired(K, sub, null, hub, 'suite.hook.audio_in'), 'mouth and low end end in the suite');
    assert.ok(!wired(K, osc, null, hub), 'the voice is heard through the mouth only, not twice');
    assert.equal(ctxOf(hub).params.get('scene'), 'Classic Wub', 'starter scene');
    const want = F().def('eravos.wub-filter').presets['Classic LP Wub'].params;
    Object.keys(want).forEach(k => assert.equal(JSON.stringify(ctxOf(filt).params.get(k)), JSON.stringify(want[k]), 'scene set the mouth · ' + k));
    assert.ok(Suites.wiring(K, hub).every(w => w.on || !w.possible), 'every possible wire is on');
    TH.note(U, osc, 33, 0.05, { duration: 1 }); const b = await TH.render(U);
    assert.gt(TH.db(TH.rms(b, 0.2, 1)), -40, 'the system sounds through the suite');
  });
  it('one part at a time: each joins what is here; the voice goes to the suite alone, then through the mouth once it arrives', () => {
    const U = TH.universe(0.2), K = U.K, hub = Suites.open('music.wub-lab', { K });
    const osc = Suites.addPart(K, hub, 'eravos.wub-osc');
    assert.ok(wired(K, osc, null, hub), 'alone, the voice ends in the suite');
    const filt = Suites.addPart(K, hub, 'eravos.wub-filter');
    assert.ok(wired(K, osc, null, filt) && wired(K, filt, null, hub), 'voice → mouth → suite');
    assert.ok(!wired(K, osc, null, hub), 'the voice no longer goes to the suite directly');
    const g = Suites.addPart(K, hub, 'eravos.fx-destroyer'); assert.ok(g, 'the grit mod');
    assert.deepEqual(Mods.entries(osc).map(e => e.tool), ['eravos.fx-destroyer'], 'it lives inside the voice');
    assert.ok(Array.from(Suites.members(K, hub).values()).includes('eravos.fx-destroyer'), 'a mod inside a part is a member');
    assert.equal(Suites.addPart(K, hub, 'eravos.wub-osc'), osc, 'a part already here is not added twice');
  });
  it('a scene sets every part here, and opens a missing required part first', () => {
    const U = TH.universe(0.2), K = U.K, hub = Suites.open('music.wub-lab', { K });
    Suites.addPart(K, hub, 'eravos.wub-osc');
    const n = Suites.scene(K, hub, 'Riddim'); assert.equal(n, 4, 'four parts set');
    const sc = Suites.get('music.wub-lab').scenes.Riddim;
    Object.entries(sc).forEach(([t, v]) => { const id = at(K, hub, t), want = F().def(t).presets[v.preset].params;
      Object.keys(want).forEach(k => assert.equal(JSON.stringify(ctxOf(id).params.get(k)), JSON.stringify(want[k]), `${t} · ${k}`)); });
  });
  it('mixed and matched: a part of another suite joins this system; any tool wired in belongs; pulling the wire takes it out', () => {
    const U = TH.universe(0.2), K = U.K, hub = Suites.open('music.wub-lab', { K });
    Suites.build(K, hub);
    assert.ok(Suites.mixable('music.wub-lab').some(m => m.tool === 'eravos.syn-partials'), 'Synthesis Lab parts are offered');
    const pt = Suites.addPart(K, hub, 'eravos.syn-partials'); assert.ok(pt && wired(K, pt, null, hub), 'Partials (from Synthesis Lab) ends in the Wub Lab suite');
    assert.ok(Suites.status(K, hub).some(x => x.mixed && x.instanceId === pt), 'shown as mixed in');
    const lfo = Suites.addPart(K, hub, 'eravos.lfo');
    assert.ok(Suites.members(K, hub).has(lfo), 'an LFO (a modulator) joins by the first ports that fit a member');
    // by hand: any tool wired into the suite window is a member; unwired, it is not
    const ss = TH.spawn(U, 'eravos.supersaw'); assert.ok(!Suites.members(K, hub).has(ss));
    const r = K.wires.register({ src: { instanceId: ss, hookId: (F().def('eravos.supersaw').hooks.find(h => h.wire_type === 'audio' && h.direction === 'out')).hook_id }, dst: { instanceId: hub, hookId: 'suite.hook.audio_in' } });
    assert.ok(r.ok && Suites.members(K, hub).has(ss), 'wired in → a member');
    K.wires.remove(r.wire_id, 'user'); assert.ok(!Suites.members(K, hub).has(ss), 'unwired → not a member');
    F().close(at(K, hub, 'eravos.wub-rate'));
    assert.ok(Suites.members(K, hub).has(at(K, hub, 'eravos.wub-osc')), 'closing one part leaves the rest of the system');
  });
  it('the suite window: Parts lists every part with ＋, Build makes the system, Scenes loads, its title is the suite’s name', async () => {
    if (!CanvasWM.world) { CanvasWM.init(document.getElementById('wmhost'), Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    const K = Kernel, hub = Suites.open('music.wub-lab', { K, x: 20, y: 20 }); await TH.sleep(60);
    const ids = () => Array.from(Suites.members(K, hub).keys());
    try {
      const win = CanvasWM.windowOf(hub);
      assert.equal(win.querySelector('.wm-title').textContent, 'Wub Lab');
      Array.from(win.querySelectorAll('.su-tabs button')).find(b => b.dataset.tab === 'parts').click(); await TH.sleep(10);   // P48.8: it opens on Panel
      assert.equal(win.querySelectorAll('.su-part').length, 6, 'six parts listed');
      win.querySelector('.su-build').click(); await TH.sleep(60);
      assert.equal(win.querySelectorAll('.su-part.on').length, 4, 'the four required parts are here (the optional ones wait for ＋)');
      Array.from(win.querySelectorAll('.su-tabs button')).find(b => b.dataset.tab === 'scenes').click(); await TH.sleep(10);
      win.querySelector('.su-scene[data-scene="Screech"] button').click(); await TH.sleep(60);
      assert.equal(ctxOf(hub).params.get('scene'), 'Screech');
      assert.ok(win.querySelector('.su-scene.on[data-scene="Screech"]'), 'the scene shows as loaded');
      assert.ok(win.querySelector('.su-kb .uk-keys'), 'a keyboard that plays the system');
    } finally { ids().forEach(id => F().close(id)); F().close(hub); }
  });
});
