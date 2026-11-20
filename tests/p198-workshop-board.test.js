/* P198 — the Workshop's exploded BOARD (tools/core/field/field.js; his words, 2026-11-20: "Love that. Now the exploded view. Of the notes.
 * Agnostic"). Any kind — here one from no domain at all, with no 3D — opens as a board: a gate per layer (live fields: field(), one undo step
 * an edit), wired to a core (the document), a canvas of its own (drag, wheel); a gate clicked selects its layer. */
window.__phase = 'P198';
describe('P198 the Workshop board — every layer apart, live, any kind', () => {
  const KIND = { id: 'test.board198', label: 'Box', title: (d) => 'Box ' + d.w + '×' + d.h,
    layers: (d) => [{ id: 'w', group: 'SIZE', type: 'value', label: 'Width', sub: d.w + ' px', fields: [{ key: 'w', label: 'Width', type: 'number', min: 1, max: 400 }] },
      { id: 'h', group: 'SIZE', type: 'value', label: 'Height', sub: d.h + ' px', fields: [{ key: 'h', label: 'Height', type: 'number', min: 1, max: 400 }] },
      { id: 'c', group: 'LOOK', type: 'constraint', label: 'Colour', sub: d.c, fields: [{ key: 'c', label: 'Colour', type: 'enum', options: ['cyan', 'pink', 'gold'] }] },
      { id: 'n', group: 'LOOK', type: 'events', label: 'Notes', sub: 'nothing to set', fields: [] }],
    get: (d, k) => d[k], set: (d, k, v) => Object.assign({}, d, { [k]: v }), draw: (g) => { g.fillStyle = '#00d4ff'; g.fillRect(4, 4, 20, 20); }, status: (d) => [['AREA', d.w * d.h]] };
  it('a kind from no domain opens as a board: gates, live fields, the core, its own canvas', async () => {
    if (!Workshop.kinds().includes(KIND.id)) assert.ok(Workshop.addKind(KIND).ok, 'a kind');
    const ws = Workshop.open(KIND.id, { w: 20, h: 10, c: 'cyan' });
    try {
      assert.ok([...document.querySelectorAll('.ws-vph .ws-chip')].some(b => b.textContent === 'BOARD'), 'BOARD is offered to a kind with no 3D');
      ws.view({ mode: 'board' }); await TH.sleep(30);
      const gates = [...document.querySelectorAll('.ws-gate')];
      assert.equal(gates.length, 4, 'a gate per layer'); assert.ok(document.querySelector('.ws-vp.boardview'), 'the viewport shows the board');
      assert.ok(/BOX 20×10 · CORE/.test(document.querySelector('.ws-bcore').textContent) && /AREA/.test(document.querySelector('.ws-bcore').textContent), 'the core is the document: its title, its status');
      assert.equal(document.querySelectorAll('.ws-bwires path').length, 4, 'every gate wired to the core');
      const glab = gates.map(g => g.querySelector('.ws-glab').textContent); assert.ok(glab[0].startsWith('SIZE · WIDTH') && glab[2].startsWith('LOOK · COLOUR'), 'labelled group · layer: ' + glab.join(' | '));
      const inp = gates[1].querySelector('.ws-num'), h0 = ws.history().length; inp.value = '30'; inp.dispatchEvent(new Event('change'));
      assert.equal(ws.doc().h, 30, 'a field in a gate edits the document'); assert.equal(ws.history().length, h0 + 1, 'one undo step');
      assert.ok(document.querySelector('.ws-vp.boardview') && /BOX 20×30/.test(document.querySelector('.ws-bcore').textContent), 'still the board, the core follows');
      [...document.querySelectorAll('.ws-gate')][2].querySelector('.ws-chip:not(.on)').click(); assert.ok(ws.doc().c !== 'cyan', 'an enum in a gate edits it');
      ws.undo(); assert.equal(ws.doc().c, 'cyan', 'undo');
      const g3 = [...document.querySelectorAll('.ws-gate')][3]; g3.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true })); await TH.sleep(20);
      assert.equal(ws.selected, 'n', 'a gate clicked selects its layer'); assert.ok(document.querySelector('.ws-gate.sel[data-id="n"]'), 'and shows it');
      const st = document.querySelector('.ws-bstage'), t0 = st.style.transform, brd = document.querySelector('.ws-board'), r = brd.getBoundingClientRect();
      brd.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: -100, clientX: r.left + 50, clientY: r.top + 50 }));
      assert.ok(document.querySelector('.ws-bstage').style.transform !== t0, 'the wheel zooms the board (its own canvas)');
      ws.view({ mode: '2d' }); await TH.sleep(20); assert.ok(!document.querySelector('.ws-vp.boardview'), 'and back to the view');
    } finally { ws.close(); }
  });
});
