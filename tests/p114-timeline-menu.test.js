/* P114 · the Timeline: select a stretch and right-click it — his words, 2026-11-05: "also remove the split button from the timeline?, and
 * let me select where and right click." The ✂ Split button is gone (S and the menu split); right-click on a selected stretch, a clip, or a
 * spot on a track opens its menu. */
window.__phase = 'P114';
describe('P114 · Timeline: right-click a selected stretch, a clip, a spot', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  async function make() {
    host(); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 }), syn = OrganismFactory.spawn('eravos.supersaw', { x: 900, y: 10 });
    await TH.sleep(30); const pub = (t, p) => Kernel.bus.publish('ui:' + t + ':' + tl, p), I = OrganismFactory.handle(tl).ctx.internals, v = OrganismFactory.handle(tl).view;
    pub('config_change', { key: 'snap', value: 'bar' }); pub('lane_add', { kind: 'inst', target: syn, name: 'Keys' });
    pub('clip_add', { kind: 'notes', target: syn, startBar: 1, bars: 8, notes: [{ s: 0, l: 4, n: 60, v: 0.8 }] }); await TH.sleep(40);
    const cv = v.root.querySelector('canvas[aria-label^="arrangement"]'), li = I.lanes.findIndex(l => l.name === 'Keys'), r = cv.getBoundingClientRect(), s = r.width / cv.offsetWidth, ppb = OrganismFactory.handle(tl).ctx.params.get('pxPerBar');
    const R = () => cv.getBoundingClientRect();   // measured each time: selecting a clip opens its bar and moves the tracks down
    const Y = (i) => R().top + (26 + i * 48 + 24) * s, X = (bar) => R().left + (bar - 1) * ppb * s;
    const ev = (t, x, y, o) => cv.dispatchEvent(new PointerEvent(t, Object.assign({ bubbles: true, clientX: x, clientY: y, pointerId: 31, button: 0, buttons: t === 'pointerup' ? 0 : 1, pointerType: 'mouse', shiftKey: true }, o || {})));
    const menu = (x, y) => { ContextMenu.close && ContextMenu.close(); cv.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 })); return [...document.querySelectorAll('.cm .cm-item')]; };
    const clipsOn = () => I.clips.filter(c => c.lane === I.lanes[li].id).map(c => [c.startBar, c.bars]).sort((a, b) => a[0] - b[0]);
    return { tl, syn, v, I, li, X, Y, ev, menu, clipsOn, ctx: OrganismFactory.handle(tl).ctx, done: () => { document.querySelectorAll('.cm').forEach(m => m.remove()); OrganismFactory.close(tl); OrganismFactory.close(syn); } };
  }
  it('a selected stretch: Delete what is in it cuts at its edges and removes the middle; Loop this stretch sets the loop', async () => {
    const t = await make();
    try {
      t.ev('pointerdown', t.X(3), t.Y(t.li)); t.ev('pointermove', t.X(4), t.Y(t.li)); t.ev('pointermove', t.X(5), t.Y(t.li)); t.ev('pointerup', t.X(5), t.Y(t.li)); await TH.sleep(20);
      let items = t.menu(t.X(4), t.Y(t.li)); assert.deepEqual(items.map(b => b.textContent.replace(/^\W+\s*/, '')).slice(0, 2), ['Split here', 'Loop this stretch']);
      items.find(b => /Loop this stretch/.test(b.textContent)).click(); await TH.sleep(10);
      assert.equal(t.ctx.params.get('loopStartBar'), 3); assert.equal(t.ctx.params.get('loopEndBar'), 5); assert.equal(t.ctx.params.get('loopOn'), true);
      items = t.menu(t.X(4), t.Y(t.li)); items.find(b => /Delete what is in it/.test(b.textContent)).click(); await TH.sleep(20);
      assert.deepEqual(t.clipsOn(), [[1, 2], [5, 4]], 'bars 3–5 emptied, the rest kept'); assert.equal(t.v.frame, null);
    } finally { t.done(); }
  });
  it('right-press does not start a selection; right-click a clip: Split here / Duplicate / Delete; on empty space: New clip here', async () => {
    const t = await make();
    try {
      t.ev('pointerdown', t.X(6), t.Y(t.li), { button: 2, buttons: 2, shiftKey: false }); t.ev('pointerup', t.X(6), t.Y(t.li), { button: 2, shiftKey: false }); assert.equal(t.v.frame, null, 'no selection from a right press');
      let items = t.menu(t.X(6.2), t.Y(t.li)); assert.ok(items.some(b => /Duplicate/.test(b.textContent)), 'the clip’s menu');
      items.find(b => /Split here/.test(b.textContent)).click(); await TH.sleep(120); assert.deepEqual(t.clipsOn(), [[1, 5], [6, 3]], 'cut at bar 6 (snap: bar)');
      items = t.menu(t.X(7), t.Y(t.li)); items.find(b => /Delete/.test(b.textContent)).click(); await TH.sleep(20); assert.deepEqual(t.clipsOn(), [[1, 5]]);
      items = t.menu(t.X(12), t.Y(t.li)); const nc = items.find(b => /New clip here/.test(b.textContent)); assert.ok(nc); nc.click(); await TH.sleep(30);
      assert.equal(t.clipsOn().length, 2, 'a new clip where you right-clicked');
    } finally { t.done(); }
  });
});
