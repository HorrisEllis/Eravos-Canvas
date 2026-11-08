/* P154 — notes and patterns open on the Workshop (W2a, specs/eravos.workshop.spec ADDENDUM 2026-11-08). His words, 2026-11-08: "The edit
 * pattern or note doesn’t open workshop." · "The workshop should be built. It says in the commit". The note editor IS the Workshop at note scale,
 * patterns are the Workshop at pattern scale (his call, 2026-11-06). The quick inline editor stays on double-click: nothing is taken away. */
window.__phase = 'P154';
describe('P154 notes and patterns on the Workshop', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  let view0 = null; const restoreView = () => { if (view0) { CanvasWM.view = view0; CanvasWM.applyView(); view0 = null; } };
  const closeWs = () => { if (window.Workshop && Workshop.current) Workshop.current.close(); };
  async function make(notes) {
    host(); view0 = Object.assign({}, CanvasWM.view); const id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); pub('lane_add', { kind: 'inst', name: 'Lead' }); await TH.sleep(60);
    pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes }); await TH.sleep(80);
    const H = OrganismFactory.handle(id), clip = H.ctx.internals.clips.find(c => c.kind === 'notes');
    H.view.openClip(clip.id); await TH.sleep(250);
    return { id, H, roll: H.view.roll, clip: () => H.ctx.internals.clips.find(c => c.id === clip.id) };
  }
  const NOTES = [{ s: 0, l: 4, n: 60, v: 0.8 }, { s: 4, l: 4, n: 64, v: 0.6 }, { s: 8, l: 8, n: 67, v: 0.9, b: { from: 0, to: -12, at: 0.2, shape: 'late' } }];
  it('Edit note… opens that note on the Workshop; an edit reaches the clip at once; nothing changes when nothing is touched', async () => {
    const t = await make(NOTES);
    try {
      const before = JSON.stringify(t.clip().notes);
      t.roll.select([1]); t.roll.noteMenu(100, 100);
      const item = Array.from(document.querySelector('.cm').querySelectorAll('.cm-item')).find(b => /Edit note/.test(b.textContent)); assert.ok(item && !item.disabled, 'Edit note… is in the menu');
      item.click(); await TH.sleep(40);
      assert.ok(document.querySelector('.ws-app') && Workshop.current && Workshop.current.kind === 'music.notes', 'the Workshop is open with the notes kind');
      assert.ok(/NOTE · E4/.test(document.querySelector('.ws-stations').textContent), 'on the note that was clicked (E4): ' + document.querySelector('.ws-stations').textContent);
      assert.ok(/PATTERN/.test(document.querySelector('.ws-stations').textContent), 'its pattern is the station above it (the zoom chain)');
      assert.equal(JSON.stringify(t.clip().notes), before, 'opening it changed nothing');
      Workshop.current.set('v', 100, 'Velocity'); await TH.sleep(40);
      assert.equal(Math.round(t.clip().notes.find(n => n.n === 64).v * 127), 100, 'the velocity reached the clip, live');
      Workshop.current.set('b.to', 7, 'Bend to'); await TH.sleep(40);
      assert.equal(t.clip().notes.find(n => n.n === 64).b.to, 7, 'a bend reached the clip');
      Workshop.current.undo(); await TH.sleep(40); assert.ok(!t.clip().notes.find(n => n.n === 64).b, 'undo took the bend back out (defaults are not stored)');
    } finally { closeWs(); if (window.ContextMenu) ContextMenu.close(); OrganismFactory.close(t.id); restoreView(); }
  });
  it('pattern scale: a click on another note in the view opens it; its own bend is shown and kept', async () => {
    const t = await make(NOTES);
    try {
      t.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current;
      const cv = document.querySelector('.ws-app .ws-canvas'), r = cv.getBoundingClientRect();
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + r.width * 0.75, clientY: r.top + r.height * 0.05 })); await TH.sleep(20);
      assert.ok(/NOTE · G4/.test(document.querySelector('.ws-stations').textContent), 'the click opened the third note (G4)');
      ws.select('bend'); assert.ok(/-12/.test(document.querySelector('.ws-ins').textContent) || /−12|-12/.test(document.querySelector('.ws-lays, .ws-pane.ws-grow').textContent), 'its bend shows');
      const sorted = (o) => JSON.stringify(Object.keys(o).sort().map(k => [k, o[k]])); assert.equal(sorted(t.clip().notes.find(n => n.n === 67).b), sorted(NOTES[2].b), "and is kept exactly");
    } finally { closeWs(); OrganismFactory.close(t.id); restoreView(); }
  });
  it('the quick editor still opens on a double-click (nothing taken away)', async () => {
    const t = await make(NOTES);
    try { t.roll.openEditor(0); await TH.sleep(40); assert.ok(!document.querySelector('.ws-app'), 'no Workshop'); assert.ok(/Velocity/.test(t.roll.el.textContent), 'the inline editor is open'); }
    finally { closeWs(); OrganismFactory.close(t.id); restoreView(); }
  });
  it('Patterns › Edit notes opens the pattern on the Workshop', async () => {
    host(); const tl = OrganismFactory.spawn('eravos.timeline', { x: 10, y: 10 }); await TH.sleep(40); let made = [];
    try {
      const p = PatternLibrary.all().find(x => x.type === 'bass' && x.notes && x.notes.length > 2), before = new Set(Kernel.registry.list().map(r => r.instance_id));
      const r = PatternLibrary.edit(p); made = Kernel.registry.list().map(x => x.instance_id).filter(id => !before.has(id)); assert.ok(r && r.clip, 'a clip on the Timeline');
      await TH.sleep(150); assert.ok(Workshop.current && Workshop.current.kind === 'music.notes', 'the Workshop is open on it');
      assert.equal(Workshop.current.doc().notes.length, p.notes.length, 'with all its notes');
    } finally { closeWs(); OrganismFactory.close(tl); made.forEach(id => { try { OrganismFactory.close(id); } catch (e) {} }); }
  });
});
