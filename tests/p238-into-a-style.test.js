/* P238 — synthesize anything into a style (3.238). His words, 2026-11-26: "Imagine combining those. Don't do it but if you can add rhe
 * capability. Like imagine being able to synthesize anything into a dubstep tool." The capability, proved: one tool on the canvas (Retro DCO),
 * a part of it picked, made "into dubstep" — every other place from what carries dubstep (Wobble Bass), which is not on the canvas. */
window.__phase = 'P238';
describe('P238 into a style', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('a Retro DCO part into dubstep: the rest from Wobble Bass, off the canvas; offered on the board; made, and it plays', async () => {
    host(); const keep = MadeTools.list(AssembledTool.MADE_KEY); MadeTools.save(AssembledTool.MADE_KEY, []); const made = [];
    const b = OrganismFactory.spawn('eravos.retro-dco', { x: 20, y: 20 });
    try {
      assert.ok(ToolBlend.styles().includes('dubstep') && ToolBlend.styles().includes('synthwave'), 'the styles: ' + ToolBlend.styles().join(', '));
      assert.equal(ToolBlend.styleSource('dubstep', 'wobble'), 'eravos.wobble-bass', 'dubstep\'s wobble comes from Wobble Bass');
      assert.ok(!Kernel.registry.byOrganism('eravos.wobble-bass').length, 'no Wobble Bass on the canvas');
      await TH.sleep(500); FieldBoard.explode(b, 'eravos.retro-dco'); await TH.sleep(400);
      const lab = (g) => String((g.lab.firstChild || g.lab).textContent).trim();
      const voice = FieldBoard.gates(b).find(g => FieldBoard.exchange.fits({ inst: b, slot: g.slot, piece: g.p.id, label: lab(g) }) && /osc|voice|dco|saw|pulse/i.test((g.slot || '') + lab(g)));
      assert.ok(voice, 'Retro DCO has a voice box: ' + FieldBoard.gates(b).map(lab).join(', '));
      const list = [{ inst: b, slot: voice.slot, piece: voice.p.id, label: lab(voice) }];
      const plain = FieldBoard.exchange.planParts(list), into = FieldBoard.exchange.planParts(list, { into: 'dubstep' });
      assert.ok(plain.rows.every(r => r.from === 'Retro DCO'), 'without a style: all from Retro DCO');
      const byS = {}; into.rows.forEach(r => { byS[r.slot] = r.from; });
      assert.equal(byS.voice, 'Retro DCO', 'the picked voice keeps Retro DCO'); assert.equal(byS.wobble, 'Wobble Bass', 'the wobble from Wobble Bass'); assert.equal(byS.mouth, 'Wobble Bass', 'the mouth too');
      assert.ok(into.character && into.character.mix.some(m => m.style === 'dubstep' && m.share >= 40), 'it says it is mostly dubstep: ' + (into.character && into.character.says));
      FieldBoard.clearSel(); FieldBoard.select(b, voice, true);
      const r = await FieldBoard.exchange.synthesizeParts(list, { into: 'dubstep' }); assert.ok(r && r.ok, 'made: ' + (r && r.why)); made.push(r.id);
      const h = OrganismFactory.def(r.id); assert.ok(h, 'a tool of its own'); assert.ok(/Wobble Bass/.test(r.rec.name) && /Retro DCO/.test(r.rec.name), 'named for both: ' + r.rec.name);
      const rr = AssembledTool.render(r.rec.settings, 120); assert.ok(rr.ok && rr.L.some(v => Math.abs(v) > 0.01), 'and it plays');
    } finally { FieldBoard.hideWhy && FieldBoard.hideWhy(); FieldBoard.clearSel(); made.forEach(id => AssembledTool.forget(id)); MadeTools.save(AssembledTool.MADE_KEY, keep); try { FieldBoard.assemble(b, { now: true }); OrganismFactory.destroy && OrganismFactory.destroy(b); } catch (e) {} }
  });
});
