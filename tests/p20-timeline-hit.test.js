/* 3.33 — timeline hit-testing on a zoomed canvas ("the position is off sometimes, I can't click on it").
 * RCA: the timeline + piano roll mapped a pointer with `clientX - rect.left`. The window lives in CanvasWM's world, which is
 * CSS-transformed by scale(view.z): the rect is in screen px (× z), the drawing in the canvas' CSS px — at z ≠ 1 every click
 * landed z× off (seek, clip select/move/trim, piano-roll notes). Fix: EravosTimelinePianoRoll.toContent maps client → content
 * through the live rect against the element's layout size. Plus: a cancelled / lost pointer capture ends any drag. */
window.__phase = 'P20';
describe('timeline hit-testing at any canvas zoom (3.33)', () => {
  const ZS = [0.6, 1, 1.4];
  it('mapPoint: client → content undoes the world scale and offset', () => {
    const M = window.EravosTimelinePianoRoll.mapPoint;
    ZS.forEach(z => {
      const rect = { left: 37, top: 91, width: 800 * z, height: 300 * z };
      [[0, 0], [100, 26], [799, 299], [432.5, 151]].forEach(([cx, cy]) => {
        const p = M(rect, 800, 300, rect.left + cx * z, rect.top + cy * z);
        assert.ok(Math.abs(p.x - cx) < 1e-6 && Math.abs(p.y - cy) < 1e-6, `z ${z}: (${cx},${cy}) → (${p.x},${p.y})`);
      });
    });
    const p = M({ left: 0, top: 0, width: 0, height: 0 }, 0, 0, 5, 7); assert.equal(p.x, 5); assert.equal(p.y, 7); // collapsed/unlaid: no NaN
  });
  it('toContent on a real element inside a translate+scale world (as CanvasWM does), DPR-independent', () => {
    const world = document.createElement('div'); world.style.cssText = 'position:fixed;left:0;top:0;transform-origin:0 0';
    const cv = document.createElement('canvas'); const dpr = 2; cv.width = 640 * dpr; cv.height = 218 * dpr; cv.style.cssText = 'display:block;width:640px;height:218px;margin:13px 0 0 29px';
    world.appendChild(cv); document.body.appendChild(world);
    try {
      ZS.forEach(z => {
        world.style.transform = `translate(${-120 * z}px, ${45}px) scale(${z})`;
        const r = cv.getBoundingClientRect();
        [[10, 10], [320, 109], [600, 200]].forEach(([cx, cy]) => {
          const p = window.EravosTimelinePianoRoll.toContent(cv, r.left + cx * z, r.top + cy * z);
          assert.ok(Math.abs(p.x - cx) < 0.01 && Math.abs(p.y - cy) < 0.01, `z ${z}: (${cx},${cy}) → (${p.x.toFixed(2)},${p.y.toFixed(2)})`);
          const naive = (r.left + cx * z) - r.left; if (z !== 1) assert.ok(Math.abs(naive - cx) > 1, 'the naive mapping really is off at z ' + z);
        });
      });
    } finally { world.remove(); }
  });
  it('the mounted timeline selects the clip under the pointer at zoom 0.6 / 1 / 1.4; a lost capture ends the drag', async () => {
    const host = document.getElementById('wmhost');
    if (!window.CanvasWM.world) { CanvasWM.init(host, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    Kernel.audio.boot();
    const z0 = Object.assign({}, CanvasWM.view);
    const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 });
    try {
      await TH.sleep(30);
      const pub = (t, p) => Kernel.bus.publish('ui:' + t + ':' + tl, p);
      if (!OrganismFactory.handle(tl).ctx.internals.lanes.some(l => l.kind === 'pattern')) pub('lane_add', { kind: 'pattern' });
      const lane = OrganismFactory.handle(tl).ctx.internals.lanes.find(l => l.kind === 'pattern');
      pub('clip_add', { kind: 'pattern', lane: lane.id, startBar: 2, bars: 1, slot: 'A' });
      pub('clip_add', { kind: 'pattern', lane: lane.id, startBar: 4, bars: 1, slot: 'B' });
      await TH.sleep(30);
      const cv = CanvasWM.windowOf(tl).querySelector('canvas[aria-label^="arrangement"]');
      assert.ok(cv && cv._toContent && cv._state, 'timeline canvas exposes its mapping');
      const li = OrganismFactory.handle(tl).ctx.internals.lanes.indexOf(lane);
      ZS.forEach(z => {
        CanvasWM.view = { x: -15, y: 7, z }; CanvasWM.applyView();
        const r = cv.getBoundingClientRect(), s = r.width / cv.offsetWidth;
        const ly = 26 + li * 48 + 24;
        // find each clip's content x by probing the canvas' own hit-test, then click it through client coordinates
        const ids = new Set(); for (let x = 0; x < 600; x += 4) { const id = cv._hit(x, ly); if (id && !ids.has(id)) { ids.add(id);
          const cx = x + 6, X = r.left + cx * s, Y = r.top + ly * s;
          const back = cv._toContent(X, Y); assert.ok(Math.abs(back.x - cx) < 0.5 && Math.abs(back.y - ly) < 0.5, `z ${z}: mapping round-trips`);
          cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: X, clientY: Y, pointerId: 7, button: 0, buttons: 1, pointerType: 'mouse' }));
          assert.equal(cv._state().sel, id, `z ${z}: clicked clip ${id} at content x ${cx}`);
          assert.ok(cv._state().dragging, 'drag armed');
          cv.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 7 }));
          assert.ok(!cv._state().dragging, `z ${z}: lost capture ends the drag`);
        } }
        assert.equal(ids.size, 2, `z ${z}: both clips found`);
      });
      // pointercancel and a buttonless move (release never seen) also end a drag
      const r = cv.getBoundingClientRect(), s = r.width / cv.offsetWidth;
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 200 * s, clientY: r.top + 10 * s, pointerId: 8, button: 0, buttons: 1, pointerType: 'mouse' }));
      assert.ok(cv._state().dragging); cv.dispatchEvent(new PointerEvent('pointercancel', { bubbles: true, pointerId: 8 })); assert.ok(!cv._state().dragging, 'pointercancel ends it');
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 200 * s, clientY: r.top + 10 * s, pointerId: 9, button: 0, buttons: 1, pointerType: 'mouse' }));
      cv.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + 260 * s, clientY: r.top + 10 * s, pointerId: 9, buttons: 0, pointerType: 'mouse' }));
      assert.ok(!cv._state().dragging, 'a move with no button held ends a stale drag');
    } finally { CanvasWM.view = z0; CanvasWM.applyView(); OrganismFactory.close(tl); }
  });
});
