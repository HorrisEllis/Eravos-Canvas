/* P217 — synthesis keeps the parts he picks, and the rest from the tool he names: the voice is a part he can pick (its oscillator boxes), and
 * right-click › "◆ … the rest from <tool>" says where everything not picked comes from. ERAVOS makes the tool; the test only picks.
 * His words, 2026-11-24: "my goal is to add the capability to create a mix of the retro dcs and the wobble bass … combine the sound of retro dcs
 * with the rest of wobble bass" · "eravos makes it, not you. only add capability. always capability first." */
window.__phase = 'P217';
describe('P217 pick the voice, say where the rest comes from', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('Retro DCO\'s voice + the rest from Wobble Bass, made by ERAVOS from the picks, plays clean', async () => {
    host(); const keep = MadeTools.list(AssembledTool.MADE_KEY); MadeTools.save(AssembledTool.MADE_KEY, []); let made = null;
    const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), b = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 });
    const B = OrganismFactory.handle(b);
    try {
      await TH.sleep(400); [['pulse', 0.9], ['saw', 0.1], ['width', 0.3]].forEach(([k, v]) => B.view.emit('config_change', { key: k, value: v })); await TH.sleep(60);
      FieldBoard.explode(a, 'eravos.wobble-bass'); FieldBoard.explode(b, 'eravos.retro-dco'); await TH.sleep(400);
      assert.equal(ToolBlend.slotOfPiece('dco'), 'voice', 'the DCO box is the voice'); assert.equal(ToolBlend.slotOfPiece('osc-va · square  ✓ built'), 'voice', 'and Wobble Bass\'s oscillator');
      const dco = FieldBoard.gates(b).find(x => /^dco/i.test(x.lab.textContent.trim())); assert.ok(dco, 'Retro DCO has a DCO box');
      FieldBoard.clearSel(); FieldBoard.select(b, dco, true); assert.equal(FieldBoard.selected().length, 1, 'the voice is selected');
      const items = FieldBoard.selItems().map(i => i.label || ''); assert.ok(items.some(l => /the rest from Wobble Bass/.test(l)) && items.some(l => /the rest from Retro DCO/.test(l)), 'right-click offers where the rest comes from: ' + items);
      const r = await FieldBoard.synthesizeSel({ restFrom: a }); assert.ok(r && r.id, 'ERAVOS made it: ' + JSON.stringify(r && (r.why || r.id))); made = r;
      const P = r.rec.settings, rv = ToolBlend.slots('eravos.retro-dco', ToolBlend.paramsOf(b), 120).voice, wb = ToolBlend.slots('eravos.wobble-bass', ToolBlend.paramsOf(a), 120);
      assert.equal(P.wave, rv.wave, 'its voice is Retro DCO\'s (' + P.wave + ')'); assert.equal(+P.pw.toFixed(2), +rv.pw.toFixed(2), 'with its pulse width');
      assert.equal(P.rate, wb.wobble.rate, 'its wobble is Wobble Bass\'s'); assert.equal(P.mouth, wb.mouth.mouth, 'its mouth is Wobble Bass\'s'); assert.equal(P.drive, wb.drive.drive, 'its drive is Wobble Bass\'s');
      assert.ok(/Retro DCO/.test(r.rec.name) && /Wobble Bass/.test(r.rec.name), 'named for both: ' + r.rec.name);
      const s = AssembledTool.render(P, 120); let peak = 0, bad = 0; for (let i = 0; i < s.L.length; i++) { const v = Math.abs(s.L[i]); if (!isFinite(v)) bad++; else peak = Math.max(peak, v); }
      assert.equal(bad, 0, 'no broken sample'); assert.ok(peak > 0.05 && peak < 0.999, 'it sounds, and does not clip: peak ' + peak.toFixed(3));
    } finally { if (made) AssembledTool.forget(made.id); MadeTools.save(AssembledTool.MADE_KEY, keep); FieldBoard.clearSel(); [a, b].forEach(i => { try { OrganismFactory.destroy && OrganismFactory.destroy(i); } catch (e) {} }); }
  });
});
