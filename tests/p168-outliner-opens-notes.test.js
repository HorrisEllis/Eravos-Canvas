/* P168 — the notes listed in the note Workshop open when clicked. His words, 2026-11-12: "the notes listed in the note workshop don't do
 * anything." The OUTLINER gave a link only to the open note; every other note was text. Now each row opens its note (one history step). */
window.__phase = 'P168';
describe('P168 the outliner opens the note you click', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('click the third note in the OUTLINER: it opens; undo goes back to the first', async () => {
    host(); const view0 = Object.assign({}, CanvasWM.view), id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150);
    try {
      pub('lane_add', { kind: 'inst', name: 'Lead' }); await TH.sleep(80);
      pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes: [{ s: 0, l: 4, n: 60, v: 0.8 }, { s: 4, l: 4, n: 64, v: 0.8 }, { s: 8, l: 4, n: 67, v: 0.8 }] }); await TH.sleep(80);
      const H = OrganismFactory.handle(id), clip = H.ctx.internals.clips.find(c => c.kind === 'notes'); H.view.openClip(clip.id); await TH.sleep(300);
      H.view.roll.openWorkshop(0); await TH.sleep(60); const ws = Workshop.current;
      assert.equal(ws.doc().sel | 0, 0, 'the first note is open');
      const tab = Array.from(ws.el.querySelectorAll('.ws-ph span')).find(s => s.textContent === 'OUTLINER'); assert.ok(tab, 'an OUTLINER tab'); tab.click(); await TH.sleep(30);
      const rows = Array.from(ws.el.querySelectorAll('.ws-tree div')), row = rows.find(r => /G4 @ 8/.test(r.textContent));
      assert.ok(row, 'the third note is listed: ' + rows.map(r => r.textContent.trim()).join(' | '));
      assert.ok(row.classList.contains('go'), 'it looks clickable');
      row.click(); await TH.sleep(40);
      assert.equal(ws.doc().sel, 2, 'the third note is open');
      assert.ok(/▸ G4 @ 8/.test(ws.el.querySelector('.ws-tree').textContent), 'the outliner marks it');
      assert.ok(/^Open note/.test(ws.history().slice(-1)[0]), 'one history step: ' + ws.history().slice(-1)[0]);
      ws.undo(); await TH.sleep(30); assert.equal(ws.doc().sel | 0, 0, 'undo goes back to the first note');
    } finally { if (Workshop.current) Workshop.current.close(); OrganismFactory.close(id); CanvasWM.view = view0; CanvasWM.applyView(); }
  });
});
