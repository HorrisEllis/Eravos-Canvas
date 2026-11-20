/* P203 — components swapped between tools blown up on the canvas (tools/core/field/board.js component boxes + tools/music/data/part-exchange.js;
 * his words, 2026-11-20: "Give Eravos the tools to swap tools components when they are blown up on the canvas. Like give me the ability to
 * mutate or synthesize tools together." · "when you blow up a tool on the canvas … you click on the component' box and can pick a new one or one
 * from another tool. then uses the ui element for the compoenent as a block" · "drag components, delete them, change them. not drop down menus"). */
window.__phase = 'P203';
describe('P203 swap components between tools on the canvas', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('drag a component from one tool\'s box into another\'s, drop a new one from the tray, ✕ deletes; its block shows; MUTATE takes parts across', async () => {
    host(); assert.ok(FieldBoard.exchange && FieldBoard.exchange.has('eravos.wobble-bass') && FieldBoard.exchange.has('eravos.retro-dco'), 'the music domain hands the board its parts');
    const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), b = OrganismFactory.spawn('eravos.retro-dco', { x: 2000, y: 20 }), A = OrganismFactory.handle(a), B = OrganismFactory.handle(b);
    try {
      await TH.sleep(400);
      [['chorus', 'II'], ['filter', 'ladder'], ['cutoff', 1400], ['res', 0.4], ['drive', 6]].forEach(([k, v]) => B.view.emit('config_change', { key: k, value: v })); await TH.sleep(100);
      FieldBoard.explode(a, 'eravos.wobble-bass'); FieldBoard.explode(b, 'eravos.retro-dco'); await TH.sleep(200);
      const boxA = [...document.querySelectorAll('.fb-board[data-instance="' + a + '"] .fb-gate.fb-comp')].map(g => g.dataset.piece);
      ['filter-vowels', 'grit', 'noise', 'squash'].forEach(k => assert.ok(boxA.includes(k), 'Wobble Bass\'s ' + k + ' box is a component box: ' + boxA));
      assert.ok(document.querySelectorAll('.fb-board[data-instance="' + b + '"] .fb-gate.fb-comp').length >= 4, 'so are Retro DCO\'s (VCF, chorus, noise, LFO)');
      CanvasWM.view = { x: 10, y: 10, z: 0.28 }; CanvasWM.applyView(); await TH.sleep(50);   // both boards on the screen (a drag lands where it is seen)
      const box = (inst, re) => [...document.querySelectorAll('.fb-board[data-instance="' + inst + '"] .fb-gate.fb-comp')].find(g => re.test(g.dataset.piece + ' ' + g.querySelector('.fb-lab').textContent));
      const drag = (from, to, hold) => { const p1 = from.getBoundingClientRect(), p2 = to.getBoundingClientRect(), o = { bubbles: true, button: 0, pointerId: 1 };
        from.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ clientX: p1.left + 6, clientY: p1.top + 5 }, o)));
        document.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: p2.left + p2.width / 2, clientY: p2.top + Math.min(40, p2.height / 2) }, o)));
        if (!hold) document.dispatchEvent(new PointerEvent('pointerup', Object.assign({ clientX: p2.left + 4, clientY: p2.top + 4 }, o))); };
      assert.ok(!document.querySelector('.fb-swap'), 'no menus: no ⇄ chips');
      const gF = box(a, /filter-vowels/), h0 = Kernel.history ? Kernel.history.state().undo : null;
      drag(box(b, /vcf/i).querySelector('.fb-tile'), gF, true);
      assert.ok(gF.classList.contains('fb-over') && document.querySelectorAll('.fb-gate.fb-cannot').length > 0, 'carried over a box it fits: that box lights, the ones it does not fit dim');
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 1 })); await TH.sleep(250);
      assert.equal(A.ctx.params.get('partFilter'), 'filter-ladder', 'Retro DCO\'s ladder dragged into Wobble Bass\'s mouth'); assert.equal(A.ctx.params.get('cutoff'), 1400, 'at its cutoff'); assert.equal(A.ctx.params.get('pfLadDrive'), 6, 'and its drive');
      assert.ok(/ladder 1\.4k/.test(gF.querySelector('.fb-tile').textContent), 'the box\'s tile says what is in it now');
      const blk = gF.querySelector('.fb-block'); assert.ok(blk && /filter-ladder · from Retro DCO/.test(blk.textContent) && blk.querySelector('[data-key="pfLadDrive"]'), 'and shows it as its block (its own controls)');
      if (h0 != null) assert.ok(Kernel.history.state().undo > h0, 'one undo step');
      drag(box(b, /chorus/i).querySelector('.fb-tile'), box(a, /squash/)); await TH.sleep(200);
      assert.equal(A.ctx.params.get('partInsert'), 'ensemble-core', 'Retro DCO\'s Juno chorus dragged after Wobble Bass\'s amp'); assert.equal(A.ctx.params.get('peMode'), 'juno II', 'Juno II');
      const tray = [...document.querySelectorAll('.fb-board[data-instance="' + a + '"] .fb-ttile')]; assert.ok(tray.some(t => /bitcrusher/.test(t.textContent)), 'the PARTS tray holds new components');
      drag(tray.find(t => /bitcrusher/.test(t.textContent)), box(a, /grit/)); await TH.sleep(200); assert.equal(A.ctx.params.get('partDrive'), 'bitcrusher', 'a new one dragged from the tray changes the grit');
      box(a, /squash/).querySelector('.fb-del').click(); await TH.sleep(150); assert.equal(A.ctx.params.get('partInsert'), 'none', '✕ deletes it (the box is empty again)');
      const rects = [...document.querySelectorAll('.fb-board[data-instance="' + a + '"] .fb-gate')].map(g => g.getBoundingClientRect()); let ov = 0;
      for (let i = 0; i < rects.length; i++) for (let j = i + 1; j < rects.length; j++) { const P = rects[i], Q = rects[j]; if (P.left < Q.right - 2 && Q.left < P.right - 2 && P.top < Q.bottom - 2 && Q.top < P.bottom - 2) ov++; }
      assert.equal(ov, 0, 'a box that grew pushed the others down: nothing covers anything');
      const lg = box(b, /lfo/i); drag(box(a, /rate-beyond/).querySelector('.fb-tile'), lg, true);
      document.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, button: 0, pointerId: 1 })); await TH.sleep(150);
      assert.ok(B.ctx.params.get('lfoCutoff') > 0, 'the other way: Wobble Bass\'s wobble dragged into Retro DCO\'s LFO (' + B.ctx.params.get('lfoCutoff') + ' c)');
      const dock = document.querySelector('.fb-board[data-instance="' + a + '"] .fm-dock'); let across = 0;
      for (let i = 0; i < 12; i++) { dock.mutateNow(); if (/Retro DCO/.test(dock.querySelector('.fm-line').textContent)) across++; dock.throwNow(); }
      assert.ok(across > 0, 'MUTATE takes the other tool\'s parts too (' + across + ' of 12)');
    } finally { for (const x of [a, b]) { if (FieldBoard.isOpen(x)) await FieldBoard.assemble(x, { now: true }); OrganismFactory.close(x); } FieldMutate.forget('eravos.wobble-bass'); }
  });
});
