/* P162 — what to do with it (W3h, specs/eravos.workshop.spec ADDENDUM 2026-11-09 (6)). His words, 2026-11-09: "what do i even do with this? i cant
 * edit layers or draw, manipulate or do anything with it. no way to close, save or play the note either." */
window.__phase = 'P162';
describe('P162 the Workshop says what to do; play, save, close at hand; 3D shows shapes and picks them', () => {
  it('▶ ⤓ ✕ at the foot of the tool strip; a help line in the view; 3D shows only shapes, a click picks a plane, a double-click opens it', async () => {
    const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot();
    const view0 = Object.assign({}, CanvasWM.view), id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    const mine = [], before = new Set(NoteLibrary.all().map(s => s.id));
    try {
      await TH.sleep(150); pub('lane_add', { kind: 'inst', name: 'Lead' }); await TH.sleep(60); pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes: [{ s: 0, l: 8, n: 60, v: 0.8 }, { s: 8, l: 8, n: 64, v: 0.7 }] }); await TH.sleep(80);
      const H = OrganismFactory.handle(id), clipOf = () => H.ctx.internals.clips.find(c => c.kind === 'notes'); H.view.openClip(clipOf().id); await TH.sleep(250);
      H.view.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current, app = document.querySelector('.ws-app');
      const top = Array.from(app.querySelectorAll('.ws-bar .ws-ab')).map(b => b.textContent); assert.deepEqual(top, ['⤓', '▶', '✕'], 'save, play, close at the top right (2026-11-12): ' + top.join(' '));
      const all = Array.from(app.querySelectorAll('button')).map(b => b.textContent.trim()); ['⤓', '▶', '✕'].forEach(g => assert.equal(all.filter(x => x === g).length, 1, g + ' appears once (his: "no duplicates in the ui")'));
      assert.ok(!app.querySelector('.ws-strip .ws-sa'), 'the tool strip holds only editing tools');
      assert.ok(/Space plays/.test(app.querySelector('.ws-hintline').textContent) && /Esc closes/.test(app.querySelector('.ws-hintline').textContent), 'the help line says what to do: ' + app.querySelector('.ws-hintline').textContent);
      const save = Array.from(app.querySelectorAll('.ws-bar .ws-ab')).find(b => b.textContent === '⤓'); save.click(); await TH.sleep(20);
      NoteLibrary.all().filter(s => !before.has(s.id)).forEach(s => mine.push(s.id)); assert.equal(mine.length, 1, '⤓ saves the note to the library');
      // 3D: only shapes are planes; a click picks one; a double-click opens it
      ws.set('add', 'Pitch'); ws.action('＋ MOD'); ws.action('▴ UP'); await TH.sleep(10);
      ws.view({ mode: '3d', cam: { yaw: 0, pitch: Math.PI / 2 - 0.001, zoom: 1 } }); await TH.sleep(30);
      assert.ok(/3D/.test(app.querySelector('.ws-hintline').textContent), 'the help line in 3D says how');
      const cv = app.querySelector('.ws-canvas'), r = cv.getBoundingClientRect();
      // from the top the planes stack on one spot: a click there picks the uppermost shape, never a value layer
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1 }));
      cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, pointerId: 1 })); await TH.sleep(20);
      const L = EravosTimelineWorkshop.KIND.layers(ws.doc()), picked = L.find(l => l.id === ws.selected); assert.ok(picked && picked.type !== 'value', 'a click picked a shape: ' + (picked && picked.label));
      ws.select('T:pitch'); cv.dispatchEvent(new MouseEvent('dblclick', { bubbles: true })); await TH.sleep(20); assert.ok(/PITCH/.test(document.querySelector('.ws-stations').textContent), 'a double-click opens it');
      Array.from(app.querySelectorAll('.ws-bar .ws-ab')).find(b => b.textContent === '✕').click(); await TH.sleep(20); assert.ok(!Workshop.current, '✕ closes the Workshop');
    } finally { mine.forEach(x => NoteLibrary.remove(x)); if (window.Workshop && Workshop.current) Workshop.current.close(); OrganismFactory.close(id); CanvasWM.view = view0; CanvasWM.applyView(); }
  });
});
