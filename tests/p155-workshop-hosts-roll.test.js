/* P155 — the Workshop hosts the whole piano roll (W2b, specs/eravos.workshop.spec ADDENDUM 2026-11-08 W2b). His words, 2026-11-08: "need all of
 * the node editor from the timeline, like workshop needs much more. can you continue the workshop." Every tool of the roll works inside the
 * Workshop, each roll edit is a step in its HISTORY, undo there puts the clip back, and the roll returns to the Timeline when it closes. */
window.__phase = 'P155';
describe('P155 the Workshop hosts the piano roll', () => {
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
  const NOTES = [{ s: 0, l: 4, n: 60, v: 0.8 }, { s: 4, l: 4, n: 64, v: 0.6 }, { s: 8, l: 8, n: 67, v: 0.9 }];
  it('the roll moves into the viewport with all its tools, and comes back to the same spot on close', async () => {
    const t = await make(NOTES), home = t.roll.el.parentNode, next = t.roll.el.nextSibling;
    try {
      t.roll.openWorkshop(1); await TH.sleep(60); const ws = Workshop.current;
      assert.equal(ws.view(), 'host', 'the roll is the first view');
      assert.ok(t.roll.el.parentNode && t.roll.el.parentNode.classList.contains('ws-vp'), 'the roll sits in the Workshop viewport');
      const r = t.roll.el.getBoundingClientRect(), v = t.roll.el.parentNode.getBoundingClientRect();
      assert.ok(r.width > v.width - 4 && r.height > v.height - 4, 'and fills it: ' + Math.round(r.width) + '×' + Math.round(r.height) + ' in ' + Math.round(v.width) + '×' + Math.round(v.height));
      assert.ok(/PIANO ROLL/.test(document.querySelector('.ws-tabs').textContent), 'its tab is named');
      ['Draw', 'Select'].forEach(w => assert.ok(new RegExp(w, 'i').test(t.roll.el.textContent + Array.from(t.roll.el.querySelectorAll('[title]')).map(b => b.title).join(' ')), 'the roll\'s ' + w + ' tool is there'));
      ws.view('drawn'); await TH.sleep(20); assert.equal(getComputedStyle(t.roll.el).display, 'none', 'the drawn view hides the roll');
      assert.ok(getComputedStyle(document.querySelector('.ws-app .ws-canvas')).display !== 'none', 'and shows the drawing');
      ws.view('host'); await TH.sleep(20); assert.ok(getComputedStyle(t.roll.el).display !== 'none', 'back to the roll');
      ws.close(); await TH.sleep(30);
      assert.equal(t.roll.el.parentNode, home, 'closing puts the roll back in the Timeline'); assert.equal(t.roll.el.nextSibling, next, 'at the same spot');
      assert.ok(!t.roll.el.classList.contains('tlpr-in-ws') && t.roll.el.style.display === '', 'with its own look');
    } finally { closeWs(); OrganismFactory.close(t.id); restoreView(); }
  });
  it('a roll edit is one step in HISTORY; undo there puts the clip back; the inspector follows the selection', async () => {
    const t = await make(NOTES);
    try {
      t.roll.openWorkshop(0); await TH.sleep(60); const ws = Workshop.current, n0 = ws.history().length;
      t.roll.select([2]); await TH.sleep(30);
      assert.ok(/NOTE · G4/.test(document.querySelector('.ws-stations').textContent), 'selecting G4 in the roll opens it in the inspector: ' + document.querySelector('.ws-stations').textContent);
      assert.equal(ws.history().length, n0, 'selecting is not an edit');
      t.roll.select([0, 1, 2]); t.roll.connectEdges(); await TH.sleep(40);
      const after = JSON.stringify(t.clip().notes); assert.ok(after !== JSON.stringify(NOTES), 'Connect edges (a roll tool) changed the clip');
      assert.equal(ws.history().length, n0 + 1, 'one step in HISTORY: ' + ws.history().slice(-1)[0]);
      assert.equal(JSON.stringify(ws.doc().notes), after, 'the Workshop holds what the roll made');
      ws.undo(); await TH.sleep(40);
      const sorted = (a) => JSON.stringify(a.map(n => ({ s: n.s, l: n.l, n: n.n, v: n.v })));
      assert.equal(sorted(t.clip().notes), sorted(NOTES), 'undo on the Workshop put the clip back');
      assert.equal(sorted(t.roll.state.notes), sorted(NOTES), 'and the roll shows it');
      ws.set('v', 100, 'Velocity'); await TH.sleep(30);
      assert.equal(Math.round(t.clip().notes[0].v * 127), 100, 'an inspector edit still reaches the clip');
      assert.ok(!/EDIT · /.test(ws.history().slice(-1)[0]), 'and is not recorded twice (the roll does not echo it back)');
    } finally { closeWs(); OrganismFactory.close(t.id); restoreView(); }
  });
  it('Esc with notes selected clears the selection; Esc again closes the Workshop; closing the roll closes the Workshop', async () => {
    const t = await make(NOTES);
    try {
      t.roll.openWorkshop(0); await TH.sleep(60); t.roll.select([1]); document.body.focus();
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await TH.sleep(20);
      assert.ok(Workshop.current, 'the first Esc belongs to the roll (its selection)');
      window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await TH.sleep(20);
      assert.ok(!Workshop.current, 'the second closes the Workshop');
      t.roll.openWorkshop(0); await TH.sleep(40); t.roll.hide(); await TH.sleep(20);
      assert.ok(!Workshop.current && !document.querySelector('.ws-app'), 'hiding the roll closes the Workshop');
    } finally { closeWs(); OrganismFactory.close(t.id); restoreView(); }
  });
});
