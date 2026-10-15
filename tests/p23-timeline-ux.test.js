/* 3.35 — the Timeline is easier to use: ⤢ is 1:1 at any canvas zoom (Esc back), the arrangement canvas is only as wide
 * as what is visible (a long song at high zoom no longer goes blank past the browser's canvas limit), clicks map through
 * the scroll, the piano roll has a splitter, exports are one menu, wheel scrolls time when the lanes fit. */
window.__phase = 'P23';
describe('Timeline usability (3.35)', () => {
  function host() { const host = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(host, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('⤢ at canvas zoom 0.5 fills the canvas at 1:1 screen size, follows pan/zoom, Esc restores the exact rect', async () => {
    host(); const z0 = Object.assign({}, CanvasWM.view); const id = OrganismFactory.spawn('eravos.fx-echo', { x: 30, y: 40, w: 300, h: 200 });
    try {
      await TH.sleep(20); CanvasWM.view = { x: 0, y: 0, z: 0.5 }; CanvasWM.applyView();
      const r0 = CanvasWM.rectOf(id), win = CanvasWM.windowOf(id), cr = CanvasWM.canvas.getBoundingClientRect();
      assert.equal(CanvasWM.maximize(id), true);
      let wr = win.getBoundingClientRect();
      assert.ok(Math.abs(wr.width - (cr.width - 16)) < 2 && Math.abs(wr.height - (cr.height - 16)) < 2, `screen size ${wr.width}×${wr.height} vs canvas ${cr.width}×${cr.height}`);
      assert.ok(Math.abs(wr.left - (cr.left + 8)) < 2 && Math.abs(wr.top - (cr.top + 8)) < 2, 'pinned to the canvas corner');
      CanvasWM.view = { x: -300, y: 120, z: 1.3 }; CanvasWM.applyView(); wr = win.getBoundingClientRect();
      assert.ok(Math.abs(wr.width - (cr.width - 16)) < 2 && Math.abs(wr.left - (cr.left + 8)) < 2, 'stays put after pan + zoom');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      assert.ok(!win.classList.contains('maximized'), 'Esc leaves it'); const r2 = CanvasWM.rectOf(id);
      assert.equal(r2.x, r0.x); assert.equal(r2.y, r0.y); assert.equal(r2.w, r0.w); assert.equal(r2.h, r0.h); assert.equal(win.style.transform, '');
    } finally { CanvasWM.view = z0; CanvasWM.applyView(); OrganismFactory.close(id); }
  });
  it('a 300-bar song at 300 px/bar (90 000 px) keeps a viewport-sized canvas, and clicks land on the clip after scrolling', async () => {
    host(); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 });
    try {
      await TH.sleep(30); const pub = (t, p) => Kernel.bus.publish('ui:' + t + ':' + tl, p);
      pub('config_change', { key: 'pxPerBar', value: 300 }); pub('config_change', { key: 'songBars', value: 300 });
      pub('lane_add', { kind: 'pattern' }); const lane = OrganismFactory.handle(tl).ctx.internals.lanes.find(l => l.kind === 'pattern');
      pub('clip_add', { kind: 'pattern', lane: lane.id, startBar: 280, bars: 2, slot: 'C' }); await TH.sleep(40);
      const cv = CanvasWM.windowOf(tl).querySelector('canvas[aria-label^="arrangement"]'), sc = cv.parentNode.parentNode;
      assert.ok(sc.scrollWidth >= 299 * 300, 'the scrollbar spans the whole song: ' + sc.scrollWidth);
      assert.ok(cv.offsetWidth <= sc.clientWidth + 1 && cv.width <= 2 * sc.clientWidth + 2, `canvas is the viewport (${cv.offsetWidth} css px, ${cv.width} device px), not the song`);
      sc.scrollLeft = (280 - 1) * 300 - 50; await TH.sleep(40);
      const li = OrganismFactory.handle(tl).ctx.internals.lanes.indexOf(lane), ly = 26 + li * 48 + 24, cx = (280 - 1) * 300 + 40;
      const r = cv.getBoundingClientRect(), s = r.width / cv.offsetWidth, X = r.left + (cx - sc.scrollLeft) * s, Y = r.top + ly * s;
      const back = cv._toContent(X, Y); assert.ok(Math.abs(back.x - cx) < 0.5, `content x round-trips through the scroll (${back.x} vs ${cx})`);
      const id = cv._hit(cx, ly); assert.ok(id, 'the far clip is under that point');
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: X, clientY: Y, pointerId: 11, button: 0, buttons: 1, pointerType: 'mouse' }));
      assert.equal(cv._state().sel, id, 'click selects it'); cv.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 11 }));
    } finally { OrganismFactory.close(tl); }
  });
  it('wheel scrolls time; + / − zoom; one Export menu; the splitter shows only with the piano roll', async () => {
    host(); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 });
    try {
      await TH.sleep(30); const win = CanvasWM.windowOf(tl), cv = win.querySelector('canvas[aria-label^="arrangement"]'), sc = cv.parentNode.parentNode;
      const sl0 = sc.scrollLeft; sc.dispatchEvent(new WheelEvent('wheel', { bubbles: true, cancelable: true, deltaY: 300 }));
      assert.ok(sc.scrollLeft > sl0, 'a plain wheel scrolls time when every lane fits: ' + sc.scrollLeft);
      const w0 = sc.scrollWidth; cv.dispatchEvent(new KeyboardEvent('keydown', { key: '+', bubbles: true })); await TH.sleep(20);
      assert.ok(sc.scrollWidth > w0, '+ zooms in'); cv.dispatchEvent(new KeyboardEvent('keydown', { key: '-', bubbles: true })); await TH.sleep(20);
      assert.ok(sc.scrollWidth < w0 * 1.1, '− zooms out');
      const sel = Array.from(win.querySelectorAll('select')).find(s => /Export/.test(s.options[0] && s.options[0].text));
      assert.ok(sel && ['bounce', 'midi', 'stems', 'json'].every(v => Array.from(sel.options).some(o => o.value === v)), 'one Export menu with WAV / MIDI / stems / JSON');
      assert.ok(!Array.from(win.querySelectorAll('button')).some(b => /Bounce song|⤓ MIDI|⤓ Stems/.test(b.textContent)), 'the four buttons are gone');
      const split = win.querySelector('.tl-split'); assert.ok(split, 'splitter exists'); assert.equal(getComputedStyle(split).display, 'none', 'hidden while the roll is closed');
      win.querySelector('.tlpr').classList.add('open'); assert.ok(getComputedStyle(split).display !== 'none', 'shown with the roll');
      split.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); assert.ok(/px/.test(win.querySelector('.tlpr').style.flex), 'double-click sets the split');
    } finally { OrganismFactory.close(tl); }
  });
});
