/* P204 — a part dragged from one box of a tool to another swaps when what is there fits back, else replaces it (inside one tool it moves);
 * right-click on a part: mutate only it, delete it, show it as a block or a tile; ⚄ Open in Mutation Lab (tools/core/field/board.js).
 * His words, 2026-11-21: "i want to be able to drag one component from one part of a tool to another. like directly, with differnt ui options,
 * more components. utilize right click, open in mutation lab, like, i want to drag components to one tool and have them either swap if compatible
 * or remove the one its replacing." */
window.__phase = 'P204';
describe('P204 drag a part to another box: swap or replace; right-click a part; Mutation Lab', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('swap when compatible, replace (and move) when not; right-click items; tile view; Open in Mutation Lab', async () => {
    host(); const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), A = OrganismFactory.handle(a), P = (k) => A.ctx.params.get(k);
    try {
      await TH.sleep(400); [['partDrive', 'saturator-tape'], ['partInsert', 'bitcrusher']].forEach(([k, v]) => A.view.emit('config_change', { key: k, value: v })); await TH.sleep(80);
      const menu = ContextMenu.windowItems(A, {}); assert.ok(menu.some(i => /Open in Mutation Lab/.test(i.label || '')), 'the window\'s right-click offers ⚄ Open in Mutation Lab');
      FieldBoard.lab(a); await TH.sleep(300); assert.ok(FieldBoard.isOpen(a), 'Open in Mutation Lab blows it up on the canvas');
      assert.ok(document.querySelector('.fb-board[data-instance="' + a + '"] .fm-dock'), 'with MUTATE · KEEP · THROW');
      const gx = (re) => FieldBoard.gates(a).find(x => re.test(x.g.dataset.piece)), drive = gx(/grit/), ins = gx(/squash/);
      const hit = (src, dst) => { const tp = FieldBoard.partIn(a, dst), sp = FieldBoard.partIn(a, src); return { o: { inst: a, g: dst }, patch: { [dst.socket.key]: sp.comp }, back: tp.own || tp.empty ? null : { [src.socket.key]: tp.comp } }; };
      // through the real drag: grit's tape onto the squash box (it holds the bitcrusher, which the grit takes) → a swap
      CanvasWM.view = { x: 10, y: 10, z: 0.28 }; CanvasWM.applyView(); await TH.sleep(50);
      const drag = (from, to) => { const p1 = from.getBoundingClientRect(), p2 = to.getBoundingClientRect(), o = { bubbles: true, button: 0, pointerId: 1 };
        from.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ clientX: p1.left + 6, clientY: p1.top + 5 }, o)));
        document.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: p2.left + p2.width / 2, clientY: p2.top + Math.min(40, p2.height / 2) }, o)));
        const g = document.querySelector('.fb-ghost'), said = g ? g.textContent : '';
        document.dispatchEvent(new PointerEvent('pointerup', Object.assign({ clientX: p2.left + 4, clientY: p2.top + 4 }, o))); return said; };
      const said = drag(drive.tile, ins.g); await TH.sleep(250);
      assert.ok(/swaps with/.test(said), 'carried over it, the part says it will swap: ' + said);
      assert.equal(P('partInsert'), 'saturator-tape', 'the tape is in the squash box now'); assert.equal(P('partDrive'), 'bitcrusher', 'and the bitcrusher went back to the grit: swapped');
      // the squash box holds a delay line, which the grit cannot take → the bitcrusher replaces it and leaves the grit (a move)
      A.view.emit('config_change', { key: 'partInsert', value: 'delay-line' }); await TH.sleep(120);
      const said2 = drag(drive.tile, ins.g); await TH.sleep(250);
      assert.ok(/replaces .*moved/.test(said2), 'it says it replaces it: ' + said2);
      assert.equal(P('partInsert'), 'bitcrusher', 'the bitcrusher replaced the delay line'); assert.equal(P('partDrive'), 'own', 'and the grit box it left is back to its own part');
      // right-click a part
      const items = FieldBoard.partItems(a, ins).map(i => i.label || ''); ['Mutate only this part', 'Remove it', 'Show as a block', 'Show as a tile only', 'Open in Mutation Lab'].forEach(w => assert.ok(items.some(l => l.includes(w)), 'right-click on a part: ' + w));
      ins.g.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 200, clientY: 200 })); await TH.sleep(50);
      const cm = document.querySelector('.cm'); assert.ok(cm && /Mutate only this part/.test(cm.textContent), 'the menu opens on the box'); ContextMenu.close();
      const before = {}; A.def.config.forEach(c => { before[c.key] = P(c.key); });
      const m = FieldBoard.mutatePart(a, ins); await TH.sleep(150); assert.ok(m, 'mutated');
      const own = (c) => c.key === 'partInsert' || (c.part && (!c.of || c.of === 'partInsert') && [].concat(c.part).some(q => ins.socket.options.includes(q)));
      const changed = A.def.config.filter(c => P(c.key) !== before[c.key]); assert.ok(changed.length > 0 && changed.every(own), 'only that part changed: ' + changed.map(c => c.key));
      A.view.emit('config_change', { key: 'partInsert', value: 'delay-line' }); await TH.sleep(150);
      const show = (v) => FieldBoard.partItems(a, ins).find(i => (i.label || '').includes(v)).run();
      show('Show as a block'); assert.ok(ins.g.querySelector('.fb-block'), 'as a block: its own controls in the box');
      show('Show as a tile only'); assert.ok(!ins.g.querySelector('.fb-block'), 'as a tile only: no block'); show('Show as a block');
    } finally { if (FieldBoard.isOpen(a)) await FieldBoard.assemble(a, { now: true }); OrganismFactory.close(a); FieldMutate.forget('eravos.wobble-bass'); try { localStorage.removeItem('eravos.fieldboard.view.eravos.wobble-bass'); } catch (e) {} }
  });
});
