/* P230 — what mixes with what, and no more yellow (3.230). His words, 2026-11-26: "Also the color keeps being yellow. I want to be able to tell
 * what's mixing with what. Like I want to be able to mix the dco with the wobble bass and know it will make a wobble synthwave sound." */
window.__phase = 'P230';
describe('P230 what mixes with what', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('Retro DCO × Wobble Bass says it will sound like wobble synthwave — each place, which tool brings which character — before it is made', async () => {
    host(); const keep = MadeTools.list(AssembledTool.MADE_KEY); MadeTools.save(AssembledTool.MADE_KEY, []);
    const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), b = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 }); let made = null;
    try {
      await TH.sleep(500); FieldBoard.explode(a, 'eravos.wobble-bass'); FieldBoard.explode(b, 'eravos.retro-dco'); await TH.sleep(400);
      const p = FieldBoard.exchange.planPair(b, a); assert.ok(p && p.character, 'the plan carries its character');
      assert.equal(p.character.name, 'wobble synthwave', 'DCO × Wobble Bass = wobble synthwave: ' + JSON.stringify(p.character.mix));
      assert.ok(p.character.mix.find(m => m.style === 'synthwave').from.some(f => /Retro DCO/.test(f)) && p.character.mix.find(m => m.style === 'dubstep').from.some(f => /Wobble Bass's the wub/.test(f)), 'which tool brings which');
      assert.ok(p.rows.find(r => r.slot === 'wobble').char && /dubstep/.test(p.rows.find(r => r.slot === 'wobble').char), 'each place says its character');
      FieldBoard.showWhy({ ok: true, plan: p }, { anchor: [] }); const card = document.querySelector('.fb-why');
      assert.ok(/sound like wobble synthwave/i.test(card.querySelector('.fb-wtt').textContent), 'the card says it'); assert.ok(card.querySelectorAll('.fb-wseg').length >= 2, 'the mix, in shares');
      FieldBoard.hideWhy();
      // made: its colour is its parents' blended (no yellow), its board's parts the tool's own colour family, its words keep the character
      const r = await FieldBoard.synthesizeOnto(b, a); assert.ok(r && r.id, 'made'); made = r.id;
      const d = OrganismFactory.def(r.id); assert.ok(!/^#ffcc00$/i.test(d.accent), 'not yellow: ' + d.accent); assert.ok(/^Wobble synthwave/.test(d.blurb), 'its words: ' + d.blurb.slice(0, 40));
      await TH.sleep(900); const gates = FieldBoard.gates(r.inst); assert.ok(gates.length && gates.every(g => !/^#ffcc00$/i.test(g.p.col)), 'no yellow part on its board: ' + gates.map(g => g.p.col));
    } finally { FieldBoard.hideWhy(); MadeTools.list(AssembledTool.MADE_KEY).forEach(x => AssembledTool.forget(x.id)); MadeTools.save(AssembledTool.MADE_KEY, keep); [a, b].forEach(i => { try { FieldBoard.assemble(i, { now: true }); OrganismFactory.destroy && OrganismFactory.destroy(i); } catch (e) {} }); }
  });
});
