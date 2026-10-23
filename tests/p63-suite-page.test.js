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

/* 3.63 — "Where are the rest of the suites. Synthesis tool for each suite": the four suites the 3.48 map named and never built
 * (Synthwave, Gothic, Sound System, Xen — Heavy Drops is the drop rig), and every suite window a control panel: macros on all six. */
describe('P63 · the rest of the suites — every suite a control panel', () => {
  const F = () => OrganismFactory;
  const NEW = ['music.synthwave', 'music.gothic', 'music.sound-system', 'music.xen'];
  it('every suite has macros, and every macro names a part’s real number knob', () => {
    const all = Suites.list(); NEW.concat(['music.wub-lab', 'music.synthesis-lab', 'music.edm-lab', 'music.heavy-drops']).forEach(id => assert.ok(Suites.get(id), id + ' is offered'));
    all.forEach(s => {
      assert.ok((s.macros || []).length >= 3 && s.macros.length <= 4, `${s.id}: 3–4 macros on its panel (${(s.macros || []).length})`);
      s.macros.forEach(m => m.targets.forEach(t => {
        assert.ok(s.parts.some(p => p.tool === t.tool), `${s.id} · ${m.label}: ${t.tool} is a part`);
        const c = (F().def(t.tool).config || []).find(x => x.key === t.key);
        assert.ok(c && typeof c.min === 'number' && typeof c.max === 'number', `${s.id} · ${m.label}: ${t.tool}.${t.key} is a number knob`);
      }));
    });
  });
  NEW.forEach(id => it(id.split('.')[1] + ': built whole, every wire on, every macro turns its knobs, and the system sounds', async () => {
    const s = Suites.get(id), U = TH.universe(4.5, { bpm: 120 }), K = U.K, hub = Suites.open(id, { K });
    const want = s.parts.filter(p => p.required), out = Suites.build(K, hub);
    assert.equal(out.filter(Boolean).length, want.length, 'every required part');
    assert.equal(Suites.members(K, hub).size, want.length, 'all of them members');
    assert.ok(Suites.wiring(K, hub).every(w => w.on || !w.possible), 'every possible wire is on: ' + JSON.stringify(Suites.wiring(K, hub).filter(w => w.possible && !w.on).map(w => w.wire)));
    assert.equal(F().handle(hub).ctx.params.get('scene'), s.starter, 'starter scene');
    s.macros.forEach((m, i) => [0, 1].forEach(v => {
      Suites.macro(K, hub, i, v);
      m.targets.forEach(t => { const c = F().def(t.tool).config.find(x => x.key === t.key), lo = t.min !== undefined ? t.min : c.min, hi = t.max !== undefined ? t.max : c.max;
        const got = F().handle(Suites.instanceOf(K, hub, t.tool)).ctx.params.get(t.key); assert.ok(Math.abs(got - (v ? hi : lo)) <= Math.abs(hi - lo) * 0.02 + 1e-6, `${m.label} ${v}: ${t.tool}.${t.key} = ${got}`); });
      Suites.macro(K, hub, i, m.default);
    }));
    U.T.bpm = 120; U.T.renderTicks(0, 32, 0.05);
    const b = await TH.render(U);
    assert.gt(TH.db(TH.rms(b, 0.3, 4)), -45, 'the system sounds through the suite: ' + TH.db(TH.rms(b, 0.3, 4)).toFixed(1) + ' dB');
  }));
});
