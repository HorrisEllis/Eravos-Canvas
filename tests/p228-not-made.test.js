/* P228 — when ERAVOS cannot make the tool, it says so where it happened: the parts flash, a card beside them says why and what to do, and
 * its buttons do it. His words, 2026-11-25: "i need it to like flash when it can't synthesize, not a toast with no direction". */
window.__phase = 'P228';
describe('P228 not made: flash, why, what to do', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('all parts from one tool → its own again: the parts flash, the card says why, "the rest from" another tool makes it', async () => {
    host(); const keep = MadeTools.list(AssembledTool.MADE_KEY); MadeTools.save(AssembledTool.MADE_KEY, []); const made = [];
    const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), b = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 });
    try {
      await TH.sleep(500); FieldBoard.explode(a, 'eravos.wobble-bass'); FieldBoard.explode(b, 'eravos.retro-dco'); await TH.sleep(500);
      const picks = () => { FieldBoard.clearSel(); FieldBoard.gates(a).filter(g => ['filter', 'drive', 'wobble'].includes(g.slot)).forEach(g => FieldBoard.select(a, g, true)); };   // three slots: the rest can still come from elsewhere
      picks();
      const first = await FieldBoard.synthesizeSel(); assert.ok(first && first.id, 'the first time it is made'); made.push(first.id); await TH.sleep(400);
      picks();   // the same picks again (as in his screenshot)
      const r = await FieldBoard.synthesizeSel(); assert.ok(!r, 'not made: it is what was just made, again');
      const card = document.querySelector('.fb-failcard'); assert.ok(card, 'a card, not only a toast');
      assert.ok(/every part came from Wobble Bass/.test(card.textContent), 'it says why: ' + card.textContent);
      assert.ok(/Ctrl\+click a part on ANOTHER tool/.test(card.textContent), 'and what to do');
      assert.ok(FieldBoard.gates(a).filter(g => ['filter', 'drive', 'wobble'].includes(g.slot)).every(g => g.g.classList.contains('fb-fail')), 'the parts flash');
      const rest = [...card.querySelectorAll('.fb-fbtn')].find(x => /The rest from Retro DCO/.test(x.textContent)); assert.ok(rest, 'a button: the rest from Retro DCO');
      rest.click(); await TH.sleep(2500);
      { const c2 = document.querySelector('.fb-failcard'); assert.ok(!c2, 'the card goes on the next try: ' + (c2 && c2.textContent)); }
      const m = MadeTools.list(AssembledTool.MADE_KEY).find(x => !made.includes(x.id)); assert.ok(m && /Retro DCO/.test(m.name), 'ERAVOS made it with the rest from Retro DCO: ' + (m && m.name)); if (m) made.push(m.id);
    } finally { FieldBoard.hideFail(); made.forEach(id => AssembledTool.forget(id)); MadeTools.save(AssembledTool.MADE_KEY, keep); FieldBoard.clearSel(); [a, b].forEach(i => { try { OrganismFactory.destroy && OrganismFactory.destroy(i); } catch (e) {} }); }
  });
  it('every slot picked from one tool: no "the rest from" button (it would change nothing); the card says to un-pick one', async () => {
    host(); const keep = MadeTools.list(AssembledTool.MADE_KEY); MadeTools.save(AssembledTool.MADE_KEY, []); const made = [];
    const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), b = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 });
    try {
      await TH.sleep(500); FieldBoard.explode(a, 'eravos.wobble-bass'); FieldBoard.explode(b, 'eravos.retro-dco'); await TH.sleep(500);
      const all = () => { FieldBoard.clearSel(); FieldBoard.gates(a).filter(g => g.slot).forEach(g => FieldBoard.select(a, g, true)); };
      all(); const first = await FieldBoard.synthesizeSel(); if (first) made.push(first.id); await TH.sleep(400);
      all(); const r = await FieldBoard.synthesizeSel(); assert.ok(!r, 'not made');
      const card = document.querySelector('.fb-failcard'); assert.ok(card && /un-pick one/.test(card.textContent), 'it says to un-pick one: ' + (card && card.textContent));
      assert.ok(![...card.querySelectorAll('.fb-fbtn')].some(x => /The rest from/.test(x.textContent)), 'no button that changes nothing');
    } finally { FieldBoard.hideFail(); made.forEach(id => AssembledTool.forget(id)); MadeTools.save(AssembledTool.MADE_KEY, keep); FieldBoard.clearSel(); [a, b].forEach(i => { try { OrganismFactory.destroy && OrganismFactory.destroy(i); } catch (e) {} }); }
  });
});
