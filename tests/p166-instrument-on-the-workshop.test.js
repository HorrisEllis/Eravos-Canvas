/* P166 — any tool on the Workshop, from its own settings (I1, specs/eravos.ui-field.spec ADDENDUM 2026-11-12). His words: "constraint field of
 * nodes? … the canvas dynamically changes around the dag. like could always have each tool, or domain have a template or every kind" · "How hard
 * would that be to edit?" · "Start." The view is the editor: drag a bar — live — one history step; a word steps; undo puts the tool back. */
window.__phase = 'P166';
describe('P166 any tool on the Workshop, from its own settings', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  const closeWs = () => { if (window.Workshop && Workshop.current) Workshop.current.close(); };
  const read = (id, k) => Kernel.registry.readParam('kernel', id, k);
  it('every tool with settings makes a whole kind: stages, fields, a flow that draws in 2D and 3D — no code per tool', () => {
    const IW = InstrumentWorkshop, defs = OrganismFactory.defined().filter(d => IW.groupsOf(d).length), bad = [];
    assert.ok(defs.length > 40, defs.length + ' tools have settings to show');
    const cv = document.createElement('canvas'); cv.width = 1200; cv.height = 800; const g = cv.getContext('2d');
    defs.forEach(def => { try {
      const values = {}; IW.groupsOf(def).forEach(gr => gr.knobs.forEach(c => { values[c.key] = c.default; })); const d = { organism: def.id, target: 'x', label: def.label, values };
      const L = IW.KIND.layers(d); if (!L.length || L.some(l => !l.fields.length)) bad.push(def.id + ': an empty stage');
      IW.KIND.draw(g, 1200, 800, d, { selected: L[0].id }); IW.KIND.drawLayer(g, 512, 256, d, L[0].id, {});
      const lay = IW.layout(def, 1200, 800); lay.groups.forEach(gr => { const b = lay.pos.get(gr.id); if (!(b.w > 20 && b.h > 20)) bad.push(def.id + ': ' + gr.id + ' has no room (' + Math.round(b.w) + '×' + Math.round(b.h) + ')'); });
    } catch (e) { bad.push(def.id + ': ' + e.message); } });
    assert.equal(bad.length, 0, bad.slice(0, 8).join(' | '));
  });
  it('Retro DCO: its stages in the order the sound flows; the wires its settings state; drag a bar — live, then one step; a word steps; undo', async () => {
    host(); const id = OrganismFactory.spawn('eravos.retro-dco', { x: 40, y: 40 }); await TH.sleep(300);
    try {
      const ws = InstrumentWorkshop.open(id); await TH.sleep(60); assert.ok(ws && Workshop.current.kind === 'music.instrument', 'it opens');
      const def = OrganismFactory.def('eravos.retro-dco'), IW = InstrumentWorkshop, st = (g) => IW.groupsOf(def).find(x => x.id === g).stage;
      assert.equal(st('DCO'), 'SOURCE'); assert.equal(st('VCF'), 'SHAPE'); assert.equal(st('ENV'), 'AMP'); assert.equal(st('LFO'), 'MOD'); assert.equal(st('OUT'), 'OUT');
      const wires = IW.wiresOf(def); assert.ok(wires.some(w => w.from === 'LFO' && w.to === 'VCF') && wires.some(w => w.from === 'VELOCITY' && w.to === 'VCF'), 'LFO → cutoff and Vel → cutoff are wired to the VCF: ' + JSON.stringify(wires));
      assert.ok(!wires.some(w => w.to === 'CARDS' || w.to === 'ARP'), 'nothing is guessed');
      assert.deepEqual(ws.tools(), ['select', 'pen'], 'the tools that mean something here (no Orbit: 2026-11-12)');
      // drag the Cutoff bar: live while the hand moves, kept when it lets go
      const cv = document.querySelector('.ws-app .ws-canvas'), r = cv.getBoundingClientRect(), L = IW.layout(def, r.width, r.height), bar = L.parts.get('VCF').bars.find(q => q.c.key === 'cutoff');
      const c0 = read(id, 'cutoff'), n0 = ws.history().length, X = r.left + bar.bx + bar.bw / 2, Y = (f) => r.top + bar.y + bar.h * (1 - f);
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: X, clientY: Y(0.5), pointerId: 1 }));
      cv.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: X, clientY: Y(0.9), pointerId: 1 })); await TH.sleep(20);
      const live = read(id, 'cutoff'); assert.ok(live > c0 && live > 10000, 'while the hand is down the tool already has it: ' + Math.round(live) + ' Hz (was ' + c0 + ')');
      assert.equal(ws.history().length, n0, 'not a history step yet');
      cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: X, clientY: Y(0.9), pointerId: 1 })); await TH.sleep(20);
      assert.equal(ws.history().length, n0 + 1, 'one step when it lets go: ' + ws.history().slice(-1)[0]); assert.equal(read(id, 'cutoff'), ws.doc().values.cutoff, 'the tool and the Workshop agree');
      ws.undo(); await TH.sleep(20); assert.equal(read(id, 'cutoff'), c0, 'undo puts the tool back');
      // Shift: fine — a quarter as far
      ws.drag('pen', [[bar.bx + 2, bar.y + bar.h * 0.5], [bar.bx + 2, bar.y + bar.h * 0.5 - bar.h * 0.4]], { shift: true }); await TH.sleep(20);
      const fine = (read(id, 'cutoff') - c0) / (16000 - 60); assert.ok(fine > 0.05 && fine < 0.15, 'Shift moves it a quarter as far (' + fine.toFixed(3) + ' of its range)'); ws.undo();
      // a word steps to its next choice
      const wd = L.parts.get('VCF').words.find(q => q.c.key === 'filter'), f0 = read(id, 'filter');
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + wd.x + wd.w / 2, clientY: r.top + wd.y + 6, pointerId: 1 })); cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.left + wd.x + wd.w / 2, clientY: r.top + wd.y + 6, pointerId: 1 })); await TH.sleep(20);
      assert.ok(read(id, 'filter') !== f0, 'a click on Filter steps it: ' + f0 + ' → ' + read(id, 'filter')); ws.undo(); await TH.sleep(10); assert.equal(read(id, 'filter'), f0);
      // a click on a stage selects it; PROPERTIES edits it too
      const b = L.pos.get('ENV'); cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + b.x + b.w - 6, clientY: r.top + b.y + 8, pointerId: 1 })); cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.left + b.x + b.w - 6, clientY: r.top + b.y + 8, pointerId: 1 })); await TH.sleep(20);
      assert.equal(ws.selected, 'ENV', 'a click on a stage selects it'); ws.set('release', 2.5, 'Release'); await TH.sleep(10); assert.equal(read(id, 'release'), 2.5, 'PROPERTIES reaches the tool');
      const errs = []; const oe = console.error; console.error = (...a) => { errs.push(a.join(' ')); oe.apply(console, a); }; try { ws.view({ mode: '3d' }); ws.view({ mode: '2d' }); } finally { console.error = oe; } assert.equal(errs.length, 0, '2D and 3D draw: ' + errs.join(' | '));
    } finally { closeWs(); OrganismFactory.close(id); }
  });
  it('right-click a tool › Open on the Workshop — an effect too', async () => {
    host(); const fx = OrganismFactory.defined().map(d => d.id).find(x => /tape-memory|fx-filter|echo/.test(x)), id = OrganismFactory.spawn(fx, { x: 40, y: 40 }); await TH.sleep(250);
    try {
      const rec = OrganismFactory.handle(id), items = ContextMenu.windowItems ? ContextMenu.windowItems(rec.instanceId ? rec : Object.assign({ instanceId: id }, rec)) : [];
      const it = (items || []).find(x => x && /Open on the Workshop/.test(x.label || '')); assert.ok(it, fx + ': the menu offers Open on the Workshop');
      it.run(); await TH.sleep(60); assert.ok(Workshop.current && Workshop.current.kind === 'music.instrument' && Workshop.current.doc().organism === fx, 'and it opens ' + fx);
      assert.ok(!Workshop.current.keys().some(k => k[0] === 'Hear it'), 'an effect has no Hear (it is not played)');
    } finally { closeWs(); OrganismFactory.close(id); }
  });
});
