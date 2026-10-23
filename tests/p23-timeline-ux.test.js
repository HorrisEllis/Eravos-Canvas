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

// 3.62 — "also the adjustment doesn't work" (2026-10-23): every edit came back as arrangement_sync and rebuilt the clip inspector,
// so the knob or bars field under the pointer was thrown away after its first step (the browser drops the pointer capture of a
// removed element: the drag ends). The inspector now keeps its controls while the same clip is selected.
describe('Timeline inspector keeps its controls while you drag them (3.62)', () => {
  function host() { const host = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(host, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('a pattern block’s bars: dragged 4 → 8 in two steps, the same field the whole way', async () => {
    host(); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 });
    try {
      await TH.sleep(30); const pub = (t, p) => Kernel.bus.publish('ui:' + t + ':' + tl, p), I = OrganismFactory.handle(tl).ctx.internals;
      pub('lane_add', { kind: 'pattern' }); const lane = I.lanes.find(l => l.kind === 'pattern');
      pub('clip_add', { kind: 'pattern', lane: lane.id, startBar: 2, bars: 4, slot: 'A' }); await TH.sleep(40);
      const cv = CanvasWM.windowOf(tl).querySelector('canvas[aria-label^="arrangement"]'), li = I.lanes.indexOf(lane), cx = 64 + 40, ly = 26 + li * 48 + 24;
      const r = cv.getBoundingClientRect(), s = r.width / cv.offsetWidth;
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + cx * s, clientY: r.top + ly * s, pointerId: 12, button: 0, buttons: 1, pointerType: 'mouse' }));
      cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.left + cx * s, clientY: r.top + ly * s, pointerId: 12, button: 0, buttons: 0, pointerType: 'mouse' }));
      const num = [...CanvasWM.windowOf(tl).querySelectorAll('.uk-num')].find(x => /bars/.test(x.textContent) && x.offsetParent);   // (the closed piano roll has a bars field too) assert.ok(num, 'the bars field is in the inspector');
      const y0 = 300, ev = (t, y) => num.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: 10, clientY: y, pointerId: 13, button: 0, buttons: t === 'pointerup' ? 0 : 1, pointerType: 'mouse' }));
      ev('pointerdown', y0); ev('pointermove', y0 - 8); await TH.sleep(20);
      assert.equal(I.clips.find(c => c.lane === lane.id).bars, 6, 'first step'); assert.ok(num.isConnected, 'the field under the pointer is still the one on screen');
      ev('pointermove', y0 - 16); ev('pointerup', y0 - 16); await TH.sleep(20);
      assert.equal(I.clips.find(c => c.lane === lane.id).bars, 8, 'second step');
    } finally { OrganismFactory.close(tl); }
  });
  it('⛶ the whole timeline over the page: tracks, toolbar and clicks still land; Esc puts it back in its window', async () => {
    host(); const z0 = Object.assign({}, CanvasWM.view); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 });
    try {
      await TH.sleep(30); CanvasWM.view = { x: 0, y: 0, z: 0.6 }; CanvasWM.applyView();
      const root = OrganismFactory.handle(tl).view.root, home = root.parentNode;
      const btn = [...root.querySelectorAll('button')].find(b => b.textContent === '⛶'); assert.ok(btn, 'a ⛶ in the timeline toolbar'); btn.click(); await TH.sleep(40);
      assert.equal(root.parentNode, document.body, 'moved out of the zoomed canvas'); const rc = root.getBoundingClientRect(); assert.near(rc.width, innerWidth, 2); assert.near(rc.height, innerHeight, 2);
      const pub = (t, p) => Kernel.bus.publish('ui:' + t + ':' + tl, p), I = OrganismFactory.handle(tl).ctx.internals;
      pub('lane_add', { kind: 'pattern' }); const lane = I.lanes.find(l => l.kind === 'pattern'); pub('clip_add', { kind: 'pattern', lane: lane.id, startBar: 2, bars: 2, slot: 'A' }); await TH.sleep(40);
      const cv = root.querySelector('canvas[aria-label^="arrangement"]'), li = I.lanes.indexOf(lane), r = cv.getBoundingClientRect(), s = r.width / cv.offsetWidth, ppb = OrganismFactory.handle(tl).ctx.params.get('pxPerBar');
      const X = r.left + (ppb + 20) * s, Y = r.top + (26 + li * 48 + 24) * s;
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: X, clientY: Y, pointerId: 14, button: 0, buttons: 1, pointerType: 'mouse' }));
      assert.equal(cv._state().sel, I.clips[0].id, 'a click in full screen lands on the clip'); cv.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 14 }));
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await TH.sleep(20);
      assert.equal(root.parentNode, home, 'Esc: back in its window'); assert.ok(!root.classList.contains('tl-full'));
    } finally { const v = OrganismFactory.handle(tl) && OrganismFactory.handle(tl).view; if (v && v.full) v.setFull(false); CanvasWM.view = z0; CanvasWM.applyView(); OrganismFactory.close(tl); }
  });
  it('✂ in an instrument lane’s header and ⟳ Repeat every in a note clip’s inspector do what they say', async () => {
    host(); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 }), syn = OrganismFactory.spawn('eravos.supersaw', { x: 900, y: 10 });
    try {
      await TH.sleep(30); const pub = (t, p) => Kernel.bus.publish('ui:' + t + ':' + tl, p), I = OrganismFactory.handle(tl).ctx.internals, root = OrganismFactory.handle(tl).view.root;
      pub('lane_add', { kind: 'inst', target: syn, name: 'Keys' }); pub('clip_add', { kind: 'notes', target: syn, startBar: 1, bars: 2, notes: [{ s: 0, l: 4, n: 36, v: 1 }, { s: 0, l: 8, n: 64, v: 0.8 }] }); await TH.sleep(40);
      const sp = root.querySelector('select[aria-label="Split this lane"]'); assert.ok(sp, 'a ✂ on the lane');
      sp.value = 'pitch'; sp.dispatchEvent(new Event('change')); await TH.sleep(20);
      assert.deepEqual(I.lanes.filter(l => l.kind === 'inst').map(l => l.name), ['Keys', 'Keys · from E4']);
      const cv = root.querySelector('canvas[aria-label^="arrangement"]'), c = I.clips.find(x => x.lane === I.lanes.find(l => l.name === 'Keys').id), li = I.lanes.findIndex(l => l.id === c.lane);
      const r = cv.getBoundingClientRect(), s = r.width / cv.offsetWidth;
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + 20 * s, clientY: r.top + (26 + li * 48 + 24) * s, pointerId: 15, button: 0, buttons: 1, pointerType: 'mouse' }));
      cv.dispatchEvent(new PointerEvent('lostpointercapture', { bubbles: true, pointerId: 15 })); await TH.sleep(20);
      const rep = [...root.querySelectorAll('select')].find(x => x.offsetParent && [...x.options].some(o => o.text === '½ bar')); assert.ok(rep, 'a Repeat every choice in the inspector');
      rep.value = '16'; rep.dispatchEvent(new Event('change')); await TH.sleep(20);
      assert.equal(I.clips.find(x => x.id === c.id).loop, 16, 'repeats every bar');
    } finally { OrganismFactory.close(tl); OrganismFactory.close(syn); }
  });
  it('drag across a track to frame bars 3–5, ✂ Split: the clip is cut there (3.62 "select a frame … split to cut a pattern in half")', async () => {
    host(); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 }), syn = OrganismFactory.spawn('eravos.supersaw', { x: 900, y: 10 });
    try {
      await TH.sleep(30); const pub = (t, p) => Kernel.bus.publish('ui:' + t + ':' + tl, p), I = OrganismFactory.handle(tl).ctx.internals, v = OrganismFactory.handle(tl).view;
      pub('config_change', { key: 'snap', value: 'bar' }); pub('lane_add', { kind: 'inst', target: syn, name: 'Keys' });
      pub('clip_add', { kind: 'notes', target: syn, startBar: 1, bars: 8, notes: [{ s: 0, l: 4, n: 60, v: 0.8 }] }); await TH.sleep(40);
      const cv = v.root.querySelector('canvas[aria-label^="arrangement"]'), li = I.lanes.findIndex(l => l.name === 'Keys'), r = cv.getBoundingClientRect(), s = r.width / cv.offsetWidth, ppb = OrganismFactory.handle(tl).ctx.params.get('pxPerBar');
      // the clip fills the lane: Shift+drag frames over it (a plain drag would move the clip)
      const Y = (i) => r.top + (26 + i * 48 + 24) * s, X = (bar) => r.left + (bar - 1) * ppb * s;
      const ev = (t, x, y) => cv.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerId: 21, button: 0, buttons: t === 'pointerup' ? 0 : 1, pointerType: 'mouse', shiftKey: true }));
      ev('pointerdown', X(3), Y(li)); ev('pointermove', X(4), Y(li)); ev('pointermove', X(5), Y(li)); ev('pointerup', X(5), Y(li)); await TH.sleep(20);
      assert.deepEqual(Object.assign({}, v.frame, { l0: undefined, l1: undefined }), { a: 3, b: 5, l0: undefined, l1: undefined }, 'framed bars 3–5');
      const btn = [...v.root.querySelectorAll('button')].find(b => /✂ Split/.test(b.textContent)); btn.click(); await TH.sleep(20);
      assert.deepEqual(I.clips.filter(c => c.lane === I.lanes[li].id).map(c => [c.startBar, c.bars]).sort((a, b) => a[0] - b[0]), [[1, 2], [3, 2], [5, 4]]);
      assert.equal(v.frame, null, 'the frame is used up'); assert.equal(I.clips.filter(c => c.lane === I.lanes[li].id).length, 3, 'the clip was not moved by the Shift+drag');
    } finally { OrganismFactory.close(tl); OrganismFactory.close(syn); }
  });
});
