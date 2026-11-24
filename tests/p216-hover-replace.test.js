/* P216 — a component box framed whole; hovering it says, in the simplest words, what it is, what it is for and what it does to the sound;
 * right-click › REPLACE WITH lists what the box takes (its own options and the parts in the other tools blown up), one step like a drop.
 * His words, 2026-11-24: "maybe when you hover tells you what it is and the point of it and how it effects sound, in the simplest ways, so even a
 * child could understand it" · "the purple box should surround the entire component ui. also right click to replace." */
window.__phase = 'P216';
describe('P216 the box is the component; hover words; right-click › Replace with', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('frames the whole box, explains it, replaces from the list and from another tool', async () => {
    host(); const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), b = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 });
    const A = OrganismFactory.handle(a), B = OrganismFactory.handle(b);
    try {
      await TH.sleep(400); B.view.emit('config_change', { key: 'filter', value: 'ladder' }); B.view.emit('config_change', { key: 'cutoff', value: 1400 }); await TH.sleep(60);
      FieldBoard.explode(a, 'eravos.wobble-bass'); FieldBoard.explode(b, 'eravos.retro-dco'); await TH.sleep(400);
      const mouth = FieldBoard.gates(a).find(x => x.slot === 'filter'), wob = FieldBoard.gates(a).find(x => x.slot === 'wobble');
      assert.ok(mouth && wob, 'the mouth and the wobble are component boxes');
      // the box is the component: its tile is the box's title strip (no border of its own), the box is framed solid
      const ts = getComputedStyle(mouth.tile), gs = getComputedStyle(mouth.g);
      assert.equal(ts.borderTopStyle, 'none', 'the tile is not a box of its own'); assert.equal(gs.borderTopStyle, 'solid', 'the whole box is framed');
      // the words: every component the exchange swaps has them
      ['own', 'filter-svf', 'filter-ladder', 'saturator-tube', 'saturator-tape', 'bitcrusher', 'osc-noise', 'delay-line', 'ensemble-core', 'lfo'].forEach(c => {
        const w = PartExchange.explain(c); assert.ok(w && w.name && w.what && w.point && w.sound, c + ' has its words'); });
      FieldBoard.showCard(a, wob); const card = document.querySelector('.fb-card');
      assert.ok(card && /WOBBLE|wobble/.test(card.textContent) && /wub-wub/.test(card.textContent) && /Wobble Bass/.test(card.textContent), 'the card says what it is, where, what it does: ' + (card && card.textContent));
      // replace: the list, then one taken from Retro DCO
      const rep = FieldBoard.replacements(a, mouth), labels = rep.map(r => r.label);
      assert.ok(labels.some(l => /ladder filter/.test(l)), 'its own options are offered: ' + labels);
      const from = rep.find(r => /from Retro DCO/.test(r.label)); assert.ok(from, 'the ladder in Retro DCO is offered: ' + labels);
      FieldBoard.replace(a, mouth, from); await TH.sleep(150);
      assert.equal(A.ctx.params.get('partFilter'), 'filter-ladder', 'the mouth is a ladder now'); assert.equal(Math.round(A.ctx.params.get('cutoff')), 1400, 'with Retro DCO\'s settings');
      const items = FieldBoard.partItems(a, mouth).map(i => i.section || i.label || ''); assert.ok(items.includes('REPLACE WITH'), 'right-click carries REPLACE WITH');
      assert.ok(!FieldBoard.replacements(a, mouth).some(r => /→ ladder filter/.test(r.label)), 'what is in the box now is not offered again');
    } finally { document.querySelectorAll('.fb-card').forEach(c => c.remove()); [a, b].forEach(i => { try { FieldBoard.isOpen(i) && FieldBoard.close && FieldBoard.close(i); } catch (e) {} OrganismFactory.destroy && OrganismFactory.destroy(i); }); }
  });
});
