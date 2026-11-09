/* P159 — the Workshop's layout, keys and menus (W3e, specs/eravos.workshop.spec ADDENDUM 2026-11-09 (3)). His words, 2026-11-09: "the ui needs
 * more of a photoshop format. Like layers. I hate the top right. Add key bindings. Right click context menus less explicit buttons … Like undo
 * doesn't need a button … Shouldn't be two places to change the chord either. Replace the bottom right with a photoshop esc layers menu and group
 * the layer tools there." */
window.__phase = 'P159';
describe('P159 the Workshop: layers, keys, menus, one place for a value', () => {
  const key = (k, o) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, o || {})));
  it('no buttons up top; PROPERTIES over LAYERS; a value has one place; keys do the work; right-click shows what can be done', async () => {
    const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot();
    const view0 = Object.assign({}, CanvasWM.view), id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    try {
      await TH.sleep(150); pub('lane_add', { kind: 'inst', name: 'Lead' }); await TH.sleep(60); pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes: [{ s: 0, l: 8, n: 60, v: 0.8 }, { s: 8, l: 8, n: 64, v: 0.7 }] }); await TH.sleep(80);
      const H = OrganismFactory.handle(id), clipOf = () => H.ctx.internals.clips.find(c => c.kind === 'notes'); H.view.openClip(clipOf().id); await TH.sleep(250);
      H.view.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current, app = document.querySelector('.ws-app');
      assert.equal(app.querySelectorAll('.ws-bar button, .ws-btn').length, 0, 'no buttons in the top bar');
      const right = app.querySelector('.ws-right'); assert.ok(right.children[0].classList.contains('ws-props') && right.children[1].classList.contains('ws-layers'), 'PROPERTIES over LAYERS');
      assert.ok(app.querySelector('.ws-layers .ws-lfoot') && app.querySelectorAll('.ws-layers .ws-thumb').length > 3, 'the layers panel: thumbnails, and the layer tools in its footer');
      ws.select('chord'); await TH.sleep(10);
      assert.equal(app.querySelectorAll('.ws-opts .ws-f').length, 0, 'the options bar holds no value fields');
      assert.ok(Array.from(app.querySelectorAll('.ws-props .ws-f')).some(f => /Chord/i.test(f.textContent)), 'the chord is set in PROPERTIES — the one place');
      // keys
      ws.set('add', 'Pitch'); await TH.sleep(10); const n0 = (clipOf().notes[0].sh.t.pitch.mods || []).length;
      key('m'); await TH.sleep(20); assert.equal(clipOf().notes[0].sh.t.pitch.mods.length, n0 + 1, 'M adds a modulator');
      ws.select('m:0'); key('Delete'); await TH.sleep(20); assert.equal(clipOf().notes[0].sh.t.pitch.mods.length, n0, 'Delete takes it away');
      key('z', { ctrlKey: true }); await TH.sleep(20); assert.equal(clipOf().notes[0].sh.t.pitch.mods.length, n0 + 1, 'Ctrl+Z undoes');
      key('z', { ctrlKey: true, shiftKey: true }); await TH.sleep(20); assert.equal(clipOf().notes[0].sh.t.pitch.mods.length, n0, 'Ctrl+Shift+Z redoes');
      key('m'); ws.select('m:0:rate'); key('Enter'); await TH.sleep(20); assert.ok(/RATE/.test(document.querySelector('.ws-stations').textContent), 'Enter opens it');
      key('Backspace'); await TH.sleep(20); assert.ok(!/RATE/.test(document.querySelector('.ws-stations').textContent), 'Backspace goes up');
      ws.select('base'); key('h'); await TH.sleep(10); assert.ok(ws.hidden.includes('base'), 'H hides the layer'); key('h'); assert.ok(!ws.hidden.includes('base'), 'and shows it');
      key('3'); assert.equal(ws.view().mode, '3d', '3 = the 3D view'); key('2'); assert.equal(ws.view().mode, '2d', '2 = 2D'); key('v'); assert.equal(ws.tool(), 'select', 'V = select');
      key('?'); await TH.sleep(10); assert.ok(app.querySelector('.ws-sheet') && /Add a modulator/i.test(app.querySelector('.ws-sheet').textContent), '? shows every key'); key('Escape'); assert.ok(!app.querySelector('.ws-sheet') && Workshop.current, 'Esc closes the sheet first');
      // right-click
      const cv = app.querySelector('.ws-canvas'), r = cv.getBoundingClientRect();
      cv.dispatchEvent(new MouseEvent('contextmenu', { bubbles: true, cancelable: true, clientX: r.left + 300, clientY: r.top + 300 })); await TH.sleep(20);
      const cm = document.querySelector('.cm'); assert.ok(cm, 'a menu opens'); const txt = cm.textContent;
      ['Hear it', 'Add a modulator', 'Undo', '3D view', 'Close the Workshop'].forEach(w => assert.ok(new RegExp(w, 'i').test(txt), 'the menu has ' + w));
      assert.ok(cm.querySelector('.cm-k') && /Space/.test(txt), 'and each item its key'); ContextMenu.close();
      key('Escape'); await TH.sleep(10); assert.ok(!Workshop.current, 'Esc closes the Workshop');
    } finally { if (window.ContextMenu) ContextMenu.close(); if (window.Workshop && Workshop.current) Workshop.current.close(); OrganismFactory.close(id); CanvasWM.view = view0; CanvasWM.applyView(); }
  });
});
