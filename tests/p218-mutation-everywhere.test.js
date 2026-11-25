/* P218 — mutation and synthesis reach the rest of ERAVOS (3.224): Supersaw, Swarm Oscillator, Retro Poly, Piano and Tape Memory blown up on
 * the canvas show their parts as boxes the exchange knows, take parts from other tools (Replace with), and can be picked into a made tool —
 * ERAVOS makes it; the test only picks. His words, 2026-11-25: "i love the mutation and synthesis. can you expand to the rest of eravos?" */
window.__phase = 'P218';
describe('P218 mutation and synthesis across ERAVOS', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  const WANT = { 'eravos.supersaw': ['filter'], 'eravos.swarm-oscillator': ['filter'], 'eravos.retro-poly': ['filter', 'chorus', 'noise'], 'eravos.piano': ['drive'], 'eravos.tape-memory': ['drive'] };
  it('each tool\'s parts are boxes; a part crosses tools; ERAVOS synthesizes from picks across them', async () => {
    host(); const keep = MadeTools.list(AssembledTool.MADE_KEY); MadeTools.save(AssembledTool.MADE_KEY, []); const made = [];
    const ids = Object.keys(WANT).concat(['eravos.wobble-bass']), inst = {}; let x = 20;
    try {
      ids.forEach(id => { inst[id] = OrganismFactory.spawn(id, { x, y: 20 }); x += 2600; }); await TH.sleep(800);
      OrganismFactory.handle(inst['eravos.tape-memory']).view.emit('config_change', { key: 'bits', value: 8 });
      ids.forEach(id => FieldBoard.explode(inst[id], id)); await TH.sleep(600);
      Object.keys(WANT).forEach(id => { const slots = FieldBoard.gates(inst[id]).map(g => g.slot).filter(Boolean);
        WANT[id].forEach(s => assert.ok(slots.includes(s), id + ' shows its ' + s + ' as a part box: ' + slots));
        assert.ok(ToolBlend.has(id), id + ' can be synthesized'); });
      const crush = FieldBoard.gates(inst['eravos.tape-memory']).find(g => g.slot === 'crush'); assert.ok(crush, 'Tape Memory\'s digital (8 bits) is a part box');
      // a part across tools: Wobble Bass's mouth into Retro Poly's VCF (its settings with it)
      const rp = inst['eravos.retro-poly'], vcf = FieldBoard.gates(rp).find(g => g.slot === 'filter');
      const from = FieldBoard.replacements(rp, vcf).find(r => /from Wobble Bass/.test(r.label)); assert.ok(from, 'Retro Poly\'s VCF is offered Wobble Bass\'s mouth');
      FieldBoard.replace(rp, vcf, from); await TH.sleep(120);
      const wbCut = ToolBlend.slots('eravos.wobble-bass', ToolBlend.paramsOf(inst['eravos.wobble-bass']), 120).mouth.cutoff;
      assert.equal(Math.round(OrganismFactory.handle(rp).ctx.params.get('cutoff')), Math.round(wbCut), 'and takes its cutoff');
      // a crusher refused where it has no place (the piano's tube), taken where it does (Wobble Bass's grit)
      const pDrive = FieldBoard.gates(inst['eravos.piano']).find(g => g.slot === 'drive');
      assert.ok(!FieldBoard.replacements(inst['eravos.piano'], pDrive).some(r => /bitcrusher|bits/.test(r.label)), 'the piano refuses a crusher');
      // synthesize: Swarm's swarm (its voice) + the piano's drive + Tape Memory's digital, the rest from Wobble Bass — ERAVOS makes it
      const sw = FieldBoard.gates(inst['eravos.swarm-oscillator']).find(g => /^swarm\b/i.test(g.lab.textContent.trim()));
      FieldBoard.clearSel(); [[inst['eravos.swarm-oscillator'], sw], [inst['eravos.piano'], pDrive], [inst['eravos.tape-memory'], crush]].forEach(([i, g]) => FieldBoard.select(i, g, true));
      const r = await FieldBoard.synthesizeSel({ restFrom: inst['eravos.wobble-bass'] }); assert.ok(r && r.id, 'ERAVOS made it: ' + JSON.stringify(r && (r.why || r.id))); made.push(r.id);
      const P = r.rec.settings; assert.equal(P.drive, 'saturator-tube', 'its drive is the piano\'s tube'); assert.equal(P.fx, 'bitcrusher', 'its FX the tape\'s digital'); assert.equal(P.fCrushBits, 8, 'at 8 bits');
      const wb = ToolBlend.slots('eravos.wobble-bass', ToolBlend.paramsOf(inst['eravos.wobble-bass']), 120); assert.equal(P.rate, wb.wobble.rate, 'its wobble from Wobble Bass');
      const s = AssembledTool.render(P, 120); let pk = 0, bad = 0; for (let i = 0; i < s.L.length; i++) { const v = Math.abs(s.L[i]); if (!isFinite(v)) bad++; else pk = Math.max(pk, v); }
      assert.equal(bad, 0, 'no broken sample'); assert.ok(pk > 0.05 && pk < 0.999, 'it plays, no clipping: ' + pk.toFixed(3));
    } finally { made.forEach(id => AssembledTool.forget(id)); MadeTools.save(AssembledTool.MADE_KEY, keep); FieldBoard.clearSel(); Object.values(inst).forEach(i => { try { OrganismFactory.destroy && OrganismFactory.destroy(i); } catch (e) {} }); }
  });
});
