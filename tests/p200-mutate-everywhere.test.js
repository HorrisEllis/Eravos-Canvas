/* P200 — mutation everywhere, one mechanism (tools/core/field/mutate.js; his words, 2026-11-20: "need to be able to swap them out. then i want each
 * tool to be able to be able to do that. then the workshop or field. like i want full mutation, like keep going"). Any tool explodes on the canvas
 * from its own window (no board of its own needed) with ⚄ MUTATE; a tool's sockets get ⇄ chips (Retro DCO's filter); the Workshop's BOARD mutates
 * any kind's document as one undo step, throw = back; one learning store per target; what a domain keeps out is never moved. */
window.__phase = 'P200';
describe('P200 mutate any tool, any document', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('a tool with no board of its own explodes from its window, swaps its filter and mutates', async () => {
    host(); const id = 'eravos.retro-dco'; FieldMutate.forget(id); assert.ok(!FieldBoard.has(id), 'Retro DCO has no hand-made board');
    const a = OrganismFactory.spawn(id, { x: 20, y: 20 }), h = OrganismFactory.handle(a);
    try {
      await TH.sleep(400); const r = FieldBoard.explode(a, id);
      assert.ok(r && r.pieces >= 8 && !r.missing.length, 'every section of its window in a gate: ' + JSON.stringify(r && { p: r.pieces, m: r.missing }));
      const board = document.querySelector('.fb-board[data-instance="' + a + '"]'), gs = [...board.querySelectorAll('.fb-gate')].map(g => g.getBoundingClientRect()).concat([board.querySelector('.fb-core').getBoundingClientRect()]);
      let ov = 0; for (let i = 0; i < gs.length; i++) for (let j = i + 1; j < gs.length; j++) { const A = gs[i], B = gs[j]; if (A.left < B.right - 2 && B.left < A.right - 2 && A.top < B.bottom - 2 && B.top < A.bottom - 2) ov++; }
      assert.equal(ov, 0, 'no gate covers another or the core');
      const chip = [...board.querySelectorAll('.fb-gate.fb-comp')].filter(g => /VCF/.test(g.textContent)).map(g => g.querySelector('.fb-tile'))[0]; assert.ok(chip && /svf 24|SVF/.test(chip.textContent), 'the VCF box carries its filter as a tile: ' + (chip && chip.textContent));
      h.view.emit('config_change', { key: 'filter', value: 'ladder' }); await TH.sleep(60); assert.ok(/ladder/.test(chip.textContent), 'the tile follows the swap');
      const dock = board.querySelector('.fm-dock'); assert.ok(dock, '⚄ MUTATE on its board');
      const before = JSON.stringify(h.ctx.params.all ? h.ctx.params.all() : {}); dock.mutateNow(); await TH.sleep(30);
      assert.ok(/→/.test(dock.querySelector('.fm-line').textContent), 'it says what it changed: ' + dock.querySelector('.fm-line').textContent);
      assert.equal(h.ctx.params.get('level'), 0.6, 'a guarded setting (how loud) never moves');
      dock.throwNow(); await TH.sleep(30); if (h.ctx.params.all) assert.equal(JSON.stringify(h.ctx.params.all()), before, 'thrown: exactly back to before');
      assert.equal(FieldMutate.learned(id).thrown, 1, 'learned under the tool');
    } finally { await FieldBoard.assemble(a, { now: true }); OrganismFactory.close(a); FieldMutate.forget(id); }
  });
  it('the Workshop board mutates the document: one undo step, throw = back, keep learns', async () => {
    const KIND = { id: 'test.mut200', label: 'Box', title: (d) => 'Box ' + d.w,
      layers: (d) => [{ id: 'w', group: 'SIZE', type: 'value', label: 'Width', sub: d.w + '', fields: [{ key: 'w', label: 'Width', type: 'number', min: 1, max: 400, step: 1 }] },
        { id: 'c', group: 'LOOK', type: 'value', label: 'Colour', sub: d.c, fields: [{ key: 'c', label: 'Colour', type: 'enum', options: ['cyan', 'pink', 'gold'] }] }],
      get: (d, k) => d[k], set: (d, k, v) => Object.assign({}, d, { [k]: v }), draw: (g) => { g.fillRect(0, 0, 4, 4); } };
    if (!Workshop.kinds().includes(KIND.id)) assert.ok(Workshop.addKind(KIND).ok, 'a kind'); FieldMutate.forget('ws.' + KIND.id);
    const ws = Workshop.open(KIND.id, { w: 100, c: 'cyan' });
    try {
      ws.view({ mode: 'board' }); await TH.sleep(30);
      const dock = document.querySelector('.ws-board .fm-dock'); assert.ok(dock, '⚄ MUTATE under the document’s core');
      const h0 = ws.history().length; dock.mutateNow(); await TH.sleep(30);
      const d1 = ws.doc(); assert.ok(d1.w !== 100 || d1.c !== 'cyan', 'the document changed: ' + JSON.stringify(d1)); assert.equal(ws.history().length, h0 + 1, 'one undo step');
      assert.ok(document.querySelector('.ws-board .fm-dock') === dock && !dock.querySelector('.fm-keep').disabled, 'the same dock after the redraw, waiting for keep / throw');
      dock.throwNow(); await TH.sleep(30); assert.deepEqual(ws.doc(), { w: 100, c: 'cyan' }, 'thrown: back to before');
      dock.mutateNow(); await TH.sleep(30); dock.keepNow(); assert.equal(FieldMutate.learned('ws.' + KIND.id).kept, 1, 'kept: learned under the kind');
      ws.undo(); assert.deepEqual(ws.doc(), { w: 100, c: 'cyan' }, 'and undo takes a kept one back');
    } finally { ws.close(); FieldMutate.forget('ws.' + KIND.id); }
  });
});
