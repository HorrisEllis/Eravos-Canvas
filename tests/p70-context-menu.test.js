/* 3.70 — James, 2026-10-24: "also right clikc on the canvas for context menu. tool dependant context menu" */
window.__phase = 'P70';
describe('Right-click menu: the canvas, any window, and what each tool adds (3.70)', () => {
  function host() { const host = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(host, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  const rc = (el, x, y) => { const ev = new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: x, clientY: y, button: 2 }); el.dispatchEvent(ev); return ev; };
  const items = () => [...document.querySelectorAll('.cm .cm-item')].map(b => b.textContent);
  const click = (re) => { const b = [...document.querySelectorAll('.cm .cm-item')].find(x => re.test(x.textContent)); assert.ok(b, 'menu item ' + re + ' in ' + items().join(' | ')); b.click(); };
  it('on the empty canvas: add here, tidy, show everything, undo / redo, stop all — and the browser menu is not shown', () => {
    host(); const r = CanvasWM.canvas.getBoundingClientRect(), ev = rc(CanvasWM.canvas, r.left + 40, r.top + 40);
    try { assert.ok(ev.defaultPrevented, 'ours, not the browser’s'); const it = items().join(' | ');
      ['Add a tool here', 'Tidy up', 'Show everything', 'Undo', 'Redo', 'Stop all'].forEach(w => assert.ok(it.includes(w), w + ' in ' + it)); }
    finally { ContextMenu.close(); }
  });
  it('on a window: its tool items, presets, duplicate (same settings), page, expand, fold, close', async () => {
    host(); const id = OrganismFactory.spawn('eravos.wobble-bass', { x: 60, y: 60 });
    try {
      await TH.sleep(30); Kernel.bus.publish('ui:config_change:' + id, { key: 'depth', value: 5.5 });
      const win = CanvasWM.windowOf(id), hd = win.querySelector('.wm-head'), r = hd.getBoundingClientRect(); rc(hd, r.left + 60, r.top + 8);
      const it = items().join(' | ');
      ['Hear it', 'random preset', 'Classic Wub 1/8', 'Duplicate', 'Its page', 'Expand', 'Fold', 'Close'].forEach(w => assert.ok(it.includes(w), w + ' in ' + it));
      const before = Kernel.registry.byOrganism('eravos.wobble-bass').length; click(/Duplicate/); await TH.sleep(30);
      const all = Kernel.registry.byOrganism('eravos.wobble-bass'); assert.equal(all.length, before + 1, 'a second one');
      const copy = all.map(x => x.instance_id).find(x => x !== id); assert.equal(OrganismFactory.handle(copy).ctx.params.get('depth'), 5.5, 'with the same settings');
      OrganismFactory.close(copy);
      rc(hd, r.left + 60, r.top + 8); click(/Fold/); assert.ok(win.classList.contains('collapsed'), 'folded'); rc(hd, r.left + 60, r.top + 8); click(/Unfold/); assert.ok(!win.classList.contains('collapsed'));
    } finally { ContextMenu.close(); OrganismFactory.close(id); }
  });
  it('a knob keeps its own right-click (Move with), and a text field keeps the browser’s', async () => {
    host(); const id = OrganismFactory.spawn('eravos.wobble-bass', { x: 60, y: 60 });
    try {
      await TH.sleep(30); const win = CanvasWM.windowOf(id), knob = win.querySelector('.uk-knob svg, .uk-knob');
      if (knob) { const r = knob.getBoundingClientRect(); rc(knob, r.left + 5, r.top + 5); assert.ok(!document.querySelector('.cm'), 'no canvas menu over a knob'); }
      const inp = document.createElement('input'); win.querySelector('.wm-body').appendChild(inp); const ev = rc(inp, 10, 10); assert.ok(!ev.defaultPrevented && !document.querySelector('.cm'), 'the browser’s own menu on a text field');
    } finally { ContextMenu.close(); document.querySelectorAll('.km').forEach(x => x.remove()); OrganismFactory.close(id); }
  });
  it('the timeline adds its own: over a clip — split here, in half, repeat, delete; a right-click on a curve lane still deletes its point', async () => {
    host(); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 }), syn = OrganismFactory.spawn('eravos.supersaw', { x: 900, y: 10 });
    try {
      await TH.sleep(30); const pub = (t, p) => Kernel.bus.publish('ui:' + t + ':' + tl, p), I = OrganismFactory.handle(tl).ctx.internals, v = OrganismFactory.handle(tl).view;
      pub('config_change', { key: 'snap', value: 'bar' }); pub('lane_add', { kind: 'inst', target: syn, name: 'Keys' });
      pub('clip_add', { kind: 'notes', target: syn, startBar: 1, bars: 8, notes: [{ s: 0, l: 4, n: 60, v: 0.8 }] }); await TH.sleep(40);
      const cv = v.root.querySelector('canvas[aria-label^="arrangement"]'), li = I.lanes.findIndex(l => l.name === 'Keys'), r = cv.getBoundingClientRect(), s = r.width / cv.offsetWidth, ppb = OrganismFactory.handle(tl).ctx.params.get('pxPerBar');
      rc(cv, r.left + (3 * ppb + 10) * s, r.top + (26 + li * 48 + 24) * s);
      const it = items().join(' | '); ['Split here (bar 4)', 'In half', 'Repeat ×1', 'Delete the clip', 'full screen', 'Bounce'].forEach(w => assert.ok(it.includes(w), w + ' in ' + it));
      click(/Split here/); await TH.sleep(20); assert.deepEqual(I.clips.map(c => [c.startBar, c.bars]).sort((a, b) => a[0] - b[0]), [[1, 3], [4, 5]], 'cut at bar 4');
      pub('lane_add', { kind: 'auto', target: syn, key: 'cutoff', points: [[2, 1000]] }); await TH.sleep(30);
      const ai = I.lanes.findIndex(l => l.kind === 'auto'), ev = rc(cv, r.left + (ppb + 10) * s, r.top + (26 + ai * 48 + 24) * s);
      assert.ok(ev.defaultPrevented && !document.querySelector('.cm'), 'a curve lane keeps its right-click');
    } finally { ContextMenu.close(); OrganismFactory.close(tl); OrganismFactory.close(syn); }
  });
});
