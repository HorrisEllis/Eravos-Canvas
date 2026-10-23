/* 3.63 — "Make a page for the suite like the rest … It opens the tool page but for a suite. I'm saying all tools. Like open the
 * tool page when you click on them." The Heavy Drops suite, a page for every suite, and ＋ Add opens a tool's page on a click. */
window.__phase = 'P63';
describe('P63 · Heavy Drops suite · a page for every suite · a click opens the page', () => {
  const F = () => OrganismFactory, at = (K, hub, t) => Suites.instanceOf(K, hub, t);
  const wired = (K, a, ah, b, bh) => K.wires.list().some(w => w.src.instanceId === a && w.src.hookId === ah && w.dst.instanceId === b && w.dst.hookId === bh);
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  const ov = () => document.querySelector('.tp-overlay'), btnText = (re) => [...ov().querySelectorAll('.tp-btn')].find(b => re.test(b.textContent));

  it('Heavy Drops built whole: the Bassline plays the wobble AND the sub, a Destroyer inside the growl, the Drop Builder on, WEIGHT turns the sub', () => {
    const U = TH.universe(1.2, { bpm: 145 }), K = U.K, hub = Suites.open('music.heavy-drops', { K });
    assert.ok(hub, 'the suite window opens');
    const out = Suites.build(K, hub); assert.equal(out.filter(Boolean).length, 8, 'every required part: ' + out.length);
    const bg = at(K, hub, 'eravos.bass-gen'), wb = at(K, hub, 'eravos.wobble-bass'), sub = at(K, hub, 'eravos.sub-engine'), gr = at(K, hub, 'eravos.groove-gen'), pads = at(K, hub, 'eravos.pads');
    assert.ok(wired(K, bg, 'bassg.hook.note_out', wb, 'wobble.hook.note_in') && wired(K, bg, 'bassg.hook.note_out', sub, 'sub.hook.note_in'), 'one bassline, two basses');
    assert.ok(wired(K, gr, 'groove.hook.note_out', pads, 'pads.hook.note_in'), 'the groove plays the drums');
    assert.ok(Mods.entries(wb).some(e => e.tool === 'eravos.fx-destroyer' && e.slot === 'growl'), 'the Destroyer lives in the growl');
    assert.ok(at(K, hub, 'eravos.bass-drop-builder'), 'the Drop Builder is on');
    assert.equal(F().handle(hub).ctx.params.get('scene'), 'Floor Falls Out', 'starter scene');
    Suites.macro(K, hub, 1, 1); assert.equal(F().handle(sub).ctx.params.get('drop'), 24, 'WEIGHT all the way: the sub dives two octaves');
    Suites.macro(K, hub, 1, 0); assert.equal(F().handle(sub).ctx.params.get('drop'), 0);
    F().clearAll(K);
  });

  it('the suite page: every part (with ▶, ＋ and 📘), its scenes, macros and wiring — ＋ Build makes the whole system', async () => {
    host(); const before = Kernel.registry.byOrganism('eravos.suite-hub').map(r => r.instance_id);
    try {
      ToolPage.openSuite('music.heavy-drops', { K: Kernel });
      assert.ok(ov(), 'the page is open'); assert.equal(ToolPage.current().suiteId, 'music.heavy-drops');
      const t = ov().textContent;
      assert.ok(/Heavy Drops/.test(t) && /10 parts/.test(t), 'name and parts');
      const s = Suites.get('music.heavy-drops');
      assert.equal(ov().querySelectorAll('.tp-part').length, s.parts.length, 'one row per part');
      ['scenes', 'macros', 'wiring'].forEach(k => assert.ok(ov().querySelector(`[data-sec="${k}"]`), 'a ' + k + ' section'));
      Object.keys(s.scenes).forEach(n => assert.ok(t.includes(n), 'scene ' + n));
      assert.ok(ov().querySelectorAll('.tp-partpage').length >= 8, 'every installed part links to its own page');
      await ToolPage.buildSuite(); await TH.sleep(60);
      const hub = Kernel.registry.byOrganism('eravos.suite-hub').map(r => r.instance_id).find(id => !before.includes(id));
      assert.ok(hub, 'Build opened a suite window'); assert.equal(Suites.members(Kernel, hub).size, 8, 'and built it whole');
      assert.ok(ov().querySelectorAll('.tp-part.on').length >= 7, 'the page marks the parts that are on: ' + ov().querySelectorAll('.tp-part.on').length);
      // a part's 📘 opens its page, ← Back returns to the suite's page
      ov().querySelector('.tp-part[data-tool="eravos.sub-engine"] .tp-partpage').click();
      assert.equal(ToolPage.current().defId, 'eravos.sub-engine', 'the part’s own page'); btnText(/Back/).click();
      assert.equal(ToolPage.current().suiteId, 'music.heavy-drops', 'back on the suite page');
      ToolPage.close();
      // the suite window's own 📘 opens the suite page, not the plain "Suite" tool page
      CanvasWM.windowOf(hub).querySelector('.tp-open').click();
      assert.equal(ToolPage.current() && ToolPage.current().suiteId, 'music.heavy-drops', '📘 on a suite window → its suite page');
      ToolPage.close();
    } finally { ToolPage.close(); Kernel.registry.byOrganism('eravos.suite-hub').map(r => r.instance_id).filter(id => !before.includes(id)).forEach(id => { Suites.members(Kernel, id).forEach((t, m) => { try { F().close(m); } catch (e) {} }); F().close(id); }); }
  });

  it('＋ Add: a click on a tool opens its page (← Back returns to the menu where you were); a suite card opens the suite page', async () => {
    host();
    try {
      const S = window.Shell || { K: Kernel, activate() {}, toast() {} }, X = S.X || Expansion.create(S, Kernel);   // the test page has no shell: a bare one
      AddMenu.show(S, X, { view: 'all' }); await TH.sleep(30);
      const card = document.querySelector('.ap-card[data-id="eravos.sub-engine"]'); assert.ok(card, 'the card is there');
      card.click(); await TH.sleep(10);
      assert.ok(!AddMenu.isOpen(), 'the menu steps aside'); assert.equal(ToolPage.current().defId, 'eravos.sub-engine', 'its page is open');
      btnText(/Back/).click(); await TH.sleep(30);
      assert.ok(AddMenu.isOpen() && !ToolPage.isOpen(), 'back in ＋ Add');
      assert.ok(document.querySelector('.ap-card.sel[data-id="eravos.sub-engine"]'), 'on the same tool');
      document.querySelector('.ap-card[data-id="suite:music.heavy-drops"]').click(); await TH.sleep(10);
      assert.equal(ToolPage.current().suiteId, 'music.heavy-drops', 'a suite card → the suite page');
    } finally { ToolPage.close(); AddMenu.close(); }
  });
});
