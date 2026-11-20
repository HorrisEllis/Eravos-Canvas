/* P196 — a tool exploded on the canvas (tools/core/field/board.js; his words, 2026-11-20: "okay now let me edit and change the wobble base. also i
 * feel it should be a canvas in itself. so i can scroll around"). Wobble Bass's live face lifted apart into the Field board of 2026-11-15 on the
 * canvas: every piece found, the parts MOVED (the same live controls, not copies), still the tool's own (a setting reaches them, a control in a
 * gate still sets the tool), the window's menu offers it, and put back together everything is where it was. */
window.__phase = 'P196';
describe('P196 a tool exploded on the canvas — live, editable, put back', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }   // a canvas, as P102
  it('Wobble Bass explodes into its board: every piece, the live controls moved, still the tool', async () => {
    host(); assert.ok(window.FieldBoard && FieldBoard.has('eravos.wobble-bass'), 'Wobble Bass has a board');
    const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), h = OrganismFactory.handle(a);
    try {
      await new Promise(r => setTimeout(r, 300));
      const win = CanvasWM.windowOf(a); assert.ok(win, 'its window: spawn gave ' + JSON.stringify(a) + ' · windows: ' + [...document.querySelectorAll('.wm-win')].map(w => w.dataset.instance).join(','));
      const cutoff = win.querySelector('[data-key="cutoff"]'), keys = win.querySelector('.uk-keys'), shape = [...win.querySelectorAll('.uk-group-title')].find(t => t.textContent.trim() === 'SHAPE');
      assert.ok(cutoff && keys && shape, 'the live face has its parts');
      const r = FieldBoard.explode(a, 'eravos.wobble-bass');
      assert.ok(r, 'it explodes'); assert.deepEqual(r.missing, [], 'every piece found: ' + r.missing.join(', '));
      assert.equal(r.pieces, FieldBoard.boards.get('eravos.wobble-bass').pieces.length + FieldBoard.boards.get('eravos.wobble-bass').more.length, 'the board’s pieces + what it has grown since');
      const board = document.querySelector('.fb-board[data-instance="' + a + '"]');
      assert.ok(board && board.parentNode === CanvasWM.world, 'the board is on the canvas itself (pans, zooms, scrolls)');
      assert.ok(board.contains(cutoff) && board.contains(keys) && board.contains(shape), 'the same live controls, moved — not copies');
      assert.ok(cutoff.closest('.fb-gate').dataset.piece === 'mouth' && keys.closest('.fb-gate').dataset.piece === 'keys', 'each in its gate');
      assert.ok(win.classList.contains('fb-away'), 'the window steps aside while it is apart');
      h.ctx.params.set('cutoff', 1234); assert.equal(h.ctx.params.get('cutoff'), 1234, 'the tool is the same tool');
      const before = h.ctx.params.get('res'); h.view.emit('config_change', { key: 'res', value: 3.3 });   // what a knob in a gate sends
      await new Promise(r => setTimeout(r, 50)); assert.equal(h.ctx.params.get('res'), 3.3, 'a control in a gate still sets the tool (was ' + before + ')');
      assert.ok(FieldBoard.isOpen(a), 'open');
      assert.ok(FieldBoard.assemble(a), 'put back together');
      assert.ok(win.contains(cutoff) && win.contains(keys) && win.contains(shape), 'every part back in its window');
      assert.ok(!document.querySelector('.fb-board[data-instance="' + a + '"]') && !win.classList.contains('fb-away'), 'the board gone, the window back');
      assert.ok(!win.querySelector('.wb-deep').contains(cutoff), 'parts went back where they came from');
    } finally { if (FieldBoard.isOpen(a)) FieldBoard.assemble(a); OrganismFactory.close(a); }
  });
});
