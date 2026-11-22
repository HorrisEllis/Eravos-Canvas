/* P205 — the whole box: drag a part from anywhere on it (not a control), Ctrl+click selects across tools, right-click synthesizes the
 * selection into one tool (tools/core/field/board.js; tools/music/core/assembled-tool.js synthesizeParts; tools/music/data/tool-blend.js).
 * His words, 2026-11-22: "i want to be able to drag any component from the tools, not grabbing a small area but anywhere on the ui of the
 * component when exploded, drag then around. maybe holding control to select multiple parts at a time and right click with a synthesize into
 * one tool? like i want the ability to combine retro dcs and wobble bass." */
window.__phase = 'P205';
describe('P205 the whole box: drag anywhere, Ctrl selects, synthesize the selection', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('moves a box from its body, swaps by dropping the box, selects with Ctrl across tools, synthesizes the selection', async () => {
    host(); const keep = MadeTools.list(AssembledTool.MADE_KEY); MadeTools.save(AssembledTool.MADE_KEY, []);
    const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), b = OrganismFactory.spawn('eravos.retro-dco', { x: 2000, y: 20 }), A = OrganismFactory.handle(a), B = OrganismFactory.handle(b);
    let made = null;
    try {
      await TH.sleep(400);
      [['partDrive', 'saturator-tape'], ['partInsert', 'bitcrusher']].forEach(([k, v]) => A.view.emit('config_change', { key: k, value: v }));
      [['chorus', 'II'], ['filter', 'ladder'], ['cutoff', 1400], ['pulse', 0.9], ['saw', 0.2]].forEach(([k, v]) => B.view.emit('config_change', { key: k, value: v })); await TH.sleep(100);
      FieldBoard.explode(a, 'eravos.wobble-bass'); FieldBoard.explode(b, 'eravos.retro-dco'); await TH.sleep(200);
      CanvasWM.view = { x: 10, y: 10, z: 0.28 }; CanvasWM.applyView(); await TH.sleep(50);
      const box = (inst, re) => [...document.querySelectorAll('.fb-board[data-instance="' + inst + '"] .fb-gate')].find(g => re.test(g.dataset.piece + ' ' + g.querySelector('.fb-lab').textContent));
      const o = { bubbles: true, button: 0, pointerId: 1 }, at = (g, fx, fy) => { const r = g.getBoundingClientRect(); return { clientX: r.left + r.width * fx, clientY: r.top + r.height * fy }; };
      // 1. a box moved by its body (pressed on the box itself, not a control, not the label)
      const gNoise = box(a, /noise/), l0 = gNoise.offsetLeft, p0 = at(gNoise, 0.5, 0.98);
      gNoise.dispatchEvent(new PointerEvent('pointerdown', Object.assign({}, p0, o)));
      document.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: p0.clientX + 3, clientY: p0.clientY }, o)));
      assert.equal(gNoise.offsetLeft, l0, 'a press that barely moves is not a drag (a click stays a click)');
      document.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: p0.clientX + 60, clientY: p0.clientY + 30 }, o)));
      assert.ok(gNoise.classList.contains('fb-carried'), 'lifted while it is carried');
      document.dispatchEvent(new PointerEvent('pointerup', Object.assign({ clientX: p0.clientX + 60, clientY: p0.clientY + 30 }, o)));
      assert.ok(gNoise.offsetLeft > l0 + 100, 'the box moved by its body (' + l0 + ' → ' + gNoise.offsetLeft + ')');
      // a control inside a box is still a control: pressing it moves nothing
      const knob = box(a, /noise/).querySelector('.uk-knob, [data-key]'); if (knob) { const l1 = gNoise.offsetLeft, p1 = at(knob, 0.5, 0.5);
        knob.dispatchEvent(new PointerEvent('pointerdown', Object.assign({}, p1, o))); document.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: p1.clientX + 80, clientY: p1.clientY }, o)));
        document.dispatchEvent(new PointerEvent('pointerup', Object.assign({ clientX: p1.clientX + 80, clientY: p1.clientY }, o))); assert.equal(gNoise.offsetLeft, l1, 'a knob turns; the box does not move'); }
      // 2. the box dropped on another box: its part goes there (a swap), the box glides home
      const gSq = box(a, /squash/), gGrit = box(a, /grit/), home = gSq.offsetLeft, ps = at(gSq, 0.5, 0.98), pg = at(gGrit, 0.5, 0.5);
      gSq.dispatchEvent(new PointerEvent('pointerdown', Object.assign({}, ps, o)));
      document.dispatchEvent(new PointerEvent('pointermove', Object.assign({ clientX: ps.clientX + 20, clientY: ps.clientY }, o)));
      document.dispatchEvent(new PointerEvent('pointermove', Object.assign({}, pg, o)));
      assert.ok(gGrit.classList.contains('fb-over'), 'carried over a box its part fits: it lights');
      const tag = document.querySelector('.fb-ghost'); assert.ok(tag && /swaps with/.test(tag.textContent), 'and says it swaps: ' + (tag && tag.textContent));
      document.dispatchEvent(new PointerEvent('pointerup', Object.assign({}, pg, o))); await TH.sleep(250);
      assert.equal(A.ctx.params.get('partDrive'), 'bitcrusher', 'the bitcrusher went into the grit'); assert.equal(A.ctx.params.get('partInsert'), 'saturator-tape', 'and the tape came back: swapped');
      assert.equal(gSq.offsetLeft, home, 'the box glided home');
      // 3. Ctrl+click selects, across tools
      const ctrl = (g) => g.dispatchEvent(new PointerEvent('pointerdown', Object.assign({ ctrlKey: true }, at(g, 0.5, 0.5), o)));
      const gWob = box(a, /rate-beyond|wobble/), gVcf = box(b, /vcf/i), gCho = box(b, /chorus/i);
      [gWob, gVcf, gCho].forEach(ctrl); await TH.sleep(30);
      assert.equal(FieldBoard.selected().length, 3, 'three parts selected, from two tools'); assert.ok([gWob, gVcf, gCho].every(g => g.classList.contains('fb-sel')), 'each shows it');
      assert.ok(document.querySelector('.fb-selbar'), 'the board says how many and what right-click does');
      ctrl(gCho); assert.equal(FieldBoard.selected().length, 2, 'Ctrl+click again deselects'); ctrl(gCho);
      gVcf.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: 300, clientY: 300 })); await TH.sleep(40);
      const cm = document.querySelector('.cm'); assert.ok(cm && /Synthesize these 3 parts into one tool/.test(cm.textContent), 'right-click: synthesize them into one tool'); ContextMenu.close();
      // 4. synthesize the selection
      const r = await FieldBoard.synthesizeSel(); assert.ok(r && r.id && /^eravos\.wb-/.test(r.id), 'one tool of its own was made: ' + JSON.stringify(r && r.id)); made = r;
      const P = r.rec.settings;
      assert.equal(P.fx, 'ensemble-core', 'the chorus picked from Retro DCO is its FX'); assert.equal(P.fEnsMode, 'juno II', 'Juno II, as it was set');
      assert.equal(P.mouth, 'filter-ladder', 'the VCF picked from Retro DCO is its mouth (the ladder)');
      const wbWob = ToolBlend.slots('eravos.wobble-bass', ToolBlend.paramsOf(a), 120).wobble; assert.equal(P.rate, wbWob.rate, 'the wobble picked from Wobble Bass is its wobble (' + P.rate + ')');
      assert.ok(/Wobble Bass/.test(r.rec.name) && /Retro DCO/.test(r.rec.name), 'named for both: ' + r.rec.name);
      assert.equal(FieldBoard.selected().length, 0, 'the selection is cleared once it is made');
      await TH.sleep(900); assert.ok(FieldBoard.isOpen(r.inst), 'the new tool opens blown up');
      // 5. Esc clears a selection before it closes a board
      ctrl(box(a, /noise/)); document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await TH.sleep(30);
      assert.equal(FieldBoard.selected().length, 0, 'Esc clears the selection'); assert.ok(FieldBoard.isOpen(a), 'and leaves the board open');
    } finally {
      for (const x of [a, b, made && made.inst].filter(Boolean)) { if (FieldBoard.isOpen(x)) await FieldBoard.assemble(x, { now: true }); OrganismFactory.close(x); }
      if (made) AssembledTool.forget && AssembledTool.forget(made.id); MadeTools.save(AssembledTool.MADE_KEY, keep); FieldMutate.forget('eravos.wobble-bass');
    }
  });
});
