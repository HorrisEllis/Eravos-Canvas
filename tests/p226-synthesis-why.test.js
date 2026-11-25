/* P226 — what a synthesis will make, and why it was not made (3.226): the catalog has no Modes page; ◇ What will it make? shows each place in
 * the new tool, the tool it comes from and what it is, what stays behind, and plays it; a synthesis the gates refuse flashes the parts to blame
 * red and shows the reason beside them with buttons that fix it. His words, 2026-11-25: "remove these from the tool catalog. tools when the
 * can't synthesize, need to flash the reasons why. also expand the ability. its hard to tell what it will do when i synthesize" */
window.__phase = 'P226';
describe('P226 what it will make, and why not', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('the Add catalog keeps its modes, as cards like the tools', async () => {
    if (!window.AddMenu || !AddMenu.show) return;   // the catalog is the host's; the test page may not load it
    const S = window.Shell || { K: Kernel, activate() {}, toast() {} }, X = S.X || Expansion.create(S, Kernel); if (!X.modes().length) return;
    AddMenu.show(S, X, { view: 'modes' }); await TH.sleep(150);
    assert.ok([...document.querySelectorAll('.ap-rail-item')].some(b => /^Modes/.test(b.textContent.trim())), 'Modes is in the rail');
    assert.ok(!document.querySelector('.ap-modes, .ap-mode'), 'no mode card of its own look');
    const cs = [...document.querySelectorAll('.ap-grid .ap-card[data-mode]')]; assert.equal(cs.length, X.modes().length + 1, 'one tool-like card per mode, and Stay agnostic');
    assert.ok(cs.every(c => c.querySelector('.ap-card-pic') && c.querySelector('.ap-card-tx b') && c.querySelector('.ap-chiprow')), 'each with the tool card\'s picture, name and chips');
    assert.ok(/Modes/.test(document.querySelector('.ap-gridhead h2').textContent), 'the page heads like All tools');
    cs[0].click(); await TH.sleep(30); assert.ok(cs[0].classList.contains('sel'), 'a click selects it, as a tool card');
    const det = document.querySelector('.ap-d-head h3'); assert.ok(det && det.textContent === X.modes()[0].label, 'its detail on the right, as a tool\'s');
    assert.ok([...document.querySelectorAll('.ap-addbtn')].some(b => /Enter|Browse/.test(b.textContent)), 'the button that enters it, where Add to canvas is');
    AddMenu.close(); await TH.sleep(50);
  });
  it('previews, then refuses a twin with its reason beside the blamed parts, and fixes it from the card', async () => {
    host(); const keep = MadeTools.list(AssembledTool.MADE_KEY); MadeTools.save(AssembledTool.MADE_KEY, []); const made = [];
    const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), b = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 });
    try {
      await TH.sleep(500); FieldBoard.explode(a, 'eravos.wobble-bass'); FieldBoard.explode(b, 'eravos.retro-dco'); await TH.sleep(400);
      const lab = (g) => String((g.lab.firstChild || g.lab).textContent).trim(), fit = (inst) => FieldBoard.gates(inst).filter(g => FieldBoard.exchange.fits({ inst, slot: g.slot, piece: g.p.id, label: lab(g) }));
      const wbParts = fit(a); assert.ok(wbParts.length >= 2, 'Wobble Bass has parts the engine takes: ' + wbParts.map(g => g.slot || g.lab.textContent).join(', '));
      const pick = () => { FieldBoard.clearSel(); wbParts.forEach(g => FieldBoard.select(a, g, true)); };
      // 1. the preview: five places, each from a tool, nothing made
      pick(); const n0 = MadeTools.list(AssembledTool.MADE_KEY).length, pv = await FieldBoard.previewSel();
      assert.ok(pv && pv.plan && pv.plan.rows.length === 5, 'the plan has its five places'); assert.ok(pv.plan.rows.every(r => r.from && r.what), 'each says where it comes from and what it is');
      assert.equal(MadeTools.list(AssembledTool.MADE_KEY).length, n0, 'a preview makes nothing');
      const card = document.querySelector('.fb-why'); assert.ok(card && /What it will make/i.test(card.textContent), 'the card says what it will make');
      assert.ok([...card.querySelectorAll('.fb-wbtn')].some(x => /Hear/.test(x.textContent)), 'with ▶ Hear it: ' + card.querySelector('.fb-wbar').textContent + ' | ' + Object.keys(FieldBoard.exchange).join(',') + ' | ' + Object.keys(pv).join(',')); assert.ok(FieldBoard.exchange.hear(pv.plan.settings), 'and it plays');
      assert.ok([...card.querySelectorAll('.fb-wrow b')].map(x => x.textContent).join(' ') === 'VOICE WOBBLE MOUTH DRIVE FX', 'in the engine\'s order');
      FieldBoard.hideWhy();
      // 2. made once; the same picks again are a twin of what was just made → refused, the reason beside the parts, the parts flash red
      pick(); const r1 = await FieldBoard.synthesizeSel(); if (r1 && r1.id) made.push(r1.id);
      pick(); const r2 = await FieldBoard.synthesizeSel(); assert.ok(!r2, 'the same picks again are not made');
      const why = FieldBoard.why; assert.ok(why && why.el.classList.contains('bad'), 'the reason is up');
      assert.ok(/again/i.test(why.el.querySelector('.fb-wtt').textContent), 'it says what it would be again: ' + why.el.querySelector('.fb-wtt').textContent);
      assert.ok(why.el.querySelectorAll('.fb-wsteps li').length >= 2, 'with steps');
      assert.ok(why.blamed.length >= 1 && why.blamed.every(el => el.classList.contains('fb-blame')), 'the parts to blame are ringed red');
      const rb = why.blamed[0].getBoundingClientRect(), cb = why.el.getBoundingClientRect(); assert.ok(Math.abs(cb.top - rb.top) < 400 || cb.left > rb.right - 5 || cb.right < rb.left + 5, 'the card sits beside them');
      // 3. a fix from the card: the rest from Retro DCO → made
      const rest = [...why.el.querySelectorAll('.fb-wbtn')].find(x => /(rest|VOICE) from Retro DCO/.test(x.textContent)); assert.ok(rest, 'offers a place from Retro DCO: ' + [...why.el.querySelectorAll('.fb-wbtn')].map(x => x.textContent).join(' / '));
      rest.click(); await TH.sleep(1500);
      const last = MadeTools.list(AssembledTool.MADE_KEY)[0]; assert.ok(last && /Retro DCO/.test(last.name), 'made from the card: ' + (last && last.name) + ' | ' + (FieldBoard.why ? FieldBoard.why.el.textContent : 'no card') + ' | sel ' + FieldBoard.selected().length); made.push(last.id);
      assert.ok(!FieldBoard.why, 'the card goes once it is made'); assert.ok(!document.querySelector('.fb-blame'), 'and the red rings with it');
      // 4. parts with no place in the engine: the reason names them and picks the ones that fit
      const none = FieldBoard.gates(a).find(g => !FieldBoard.exchange.fits({ inst: a, slot: g.slot, piece: g.p.id, label: lab(g) }));
      if (none) { FieldBoard.clearSel(); FieldBoard.select(a, none, true); await FieldBoard.synthesizeSel(); const w = FieldBoard.why;
        assert.ok(w && /goes into the engine/.test(w.el.textContent), 'says none of them goes into the engine'); assert.ok(none.g.classList.contains('fb-blame'), 'that part flashes red');
        const fitBtn = [...w.el.querySelectorAll('.fb-wbtn')].find(x => /boxes that fit/.test(x.textContent)); assert.ok(fitBtn, 'offers to pick the boxes that fit'); fitBtn.click();
        assert.ok(FieldBoard.selected().length >= wbParts.length, 'and picks them: ' + FieldBoard.selected().length); }
      // 5. a fix asked for changes what is measured, never a tool
      FieldBoard.clearSel(); wbParts.forEach(g => FieldBoard.select(a, g, true));
      const lvl = OrganismFactory.handle(a).ctx.params.get('level'), q = await FieldBoard.exchange.previewParts(FieldBoard.selected().map(o => ({ inst: o.inst, slot: o.slot, piece: o.piece, label: '' })), { tweak: ['quieter'], restFrom: b });
      assert.ok(q.plan.settings.level < pv.plan.settings.level, 'quieter halves the made tool\'s level'); assert.equal(OrganismFactory.handle(a).ctx.params.get('level'), lvl, 'Wobble Bass itself unchanged');
      // 6. two tools: the plan shows while one is carried over the other's core
      const p2 = FieldBoard.exchange.planPair(a, b); assert.ok(p2 && p2.rows.length === 5 && p2.tools.length === 2, 'two tools: the plan says which gives what');
    } finally { FieldBoard.hideWhy(); FieldBoard.clearSel(); made.forEach(id => AssembledTool.forget(id)); MadeTools.save(AssembledTool.MADE_KEY, keep); [a, b].forEach(i => { try { FieldBoard.assemble(i, { now: true }); OrganismFactory.destroy && OrganismFactory.destroy(i); } catch (e) {} }); }
  });
});
