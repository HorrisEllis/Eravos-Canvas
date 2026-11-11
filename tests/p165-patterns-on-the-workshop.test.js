/* P165 — patterns made on the Workshop (specs/eravos.workshop.spec ADDENDUM 2026-11-11). His words, 2026-11-10: "the ability to add a note on the
 * piano roll from the map would be usefull. also the pattern editor is meant to be in the workshop, like more than just a note, i want to be able to
 * add or create patterns for the library and the timeline and import them into the timeline." · 2026-11-11: "i want to make music badly. im
 * struggling with complex patterns. never done this before". The map adds a note where it is clicked; ✦ IDEA fills the pattern with notes in the
 * song's key (again = another take; busier / sparser); SAVE PATTERN keeps it in the rhythm library (Yours); ＋ New pattern starts an empty one. */
window.__phase = 'P165';
describe('P165 patterns made on the Workshop', () => {
  const key = (k, o) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, o || {})));
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  const tls = () => Kernel.registry.byOrganism('eravos.timeline').map(r => r.instance_id);
  const cleanup = (before, view0) => { if (window.PatternLibrary && document.querySelector('.plib')) PatternLibrary.open(); if (Workshop.current) Workshop.current.close(); Kernel.registry.list().map(r => r.instance_id).filter(id => !before.has(id)).forEach(id => { try { OrganismFactory.close(id); } catch (e) {} }); CanvasWM.view = view0; CanvasWM.applyView(); };
  const inKey = (n) => { const k = Kernel.music.key, sc = MusicParts.KEY.SCALES[k.scale] || MusicParts.KEY.SCALES.minor; return sc.includes((((n - k.root) % 12) + 12) % 12); };
  it('＋ New pattern → an empty pattern on the Workshop; the map adds a note; IDEA fills it in key; busier; the note leaves; all live in the clip', async () => {
    host(); const before = new Set(Kernel.registry.list().map(r => r.instance_id)), view0 = Object.assign({}, CanvasWM.view);
    try {
      const r0 = PatternLibrary.newPattern(); assert.ok(r0 && r0.tl, 'a Timeline has the new pattern'); await TH.sleep(500);
      const ws = Workshop.current; assert.ok(ws && ws.kind === 'music.notes', 'open on the Workshop'); assert.equal(ws.doc().notes.length, 0, 'empty');
      const T = OrganismFactory.handle(r0.tl).ctx, clip = () => T.internals.clips.find(c => c.id === r0.clip);
      const cv = document.querySelector('.ws-app .ws-canvas'), r = cv.getBoundingClientRect(), WK = EravosTimelineWorkshop, G = WK.navGeom(ws.doc(), r.width, WK.navTop(r.height));
      const click = (st, n) => { const x = r.left + G.X(st) + 2, y = r.top + G.Y(n) + G.rh / 2; cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: x, clientY: y, pointerId: 1 })); cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: x, clientY: y, pointerId: 1 })); };
      click(4, 64); await TH.sleep(60); const d1 = ws.doc(); assert.equal(d1.notes.length, 1, 'a click on the empty map added a note'); assert.equal(d1.notes[0].s, 4, 'on the step under the hand'); assert.equal(d1.notes[0].n, 64, 'at the key under the hand');
      assert.equal(clip().notes.length, 1, 'and it is in the Timeline\'s clip (live)');
      key('i'); await TH.sleep(80); const a = ws.doc().notes; assert.gt(a.length, 3, 'I: an idea — ' + a.length + ' notes'); assert.ok(a.every(x => inKey(x.n)), 'every one in the song\'s key'); assert.equal(clip().notes.length, a.length, 'live in the clip');
      key('i'); await TH.sleep(80); const b = ws.doc().notes; assert.ok(JSON.stringify(b) !== JSON.stringify(a), 'I again: another take');
      ws.action('＋ BUSIER'); await TH.sleep(60); assert.gt(ws.doc().notes.length, b.length - 1, 'busier: no fewer notes (' + b.length + ' → ' + ws.doc().notes.length + ')');
      ws.undo(); await TH.sleep(40); assert.equal(JSON.stringify(ws.doc().notes), JSON.stringify(b), 'undo brings the take back');
      const n0 = ws.doc().notes.length; ws.action('✕ NOTE'); await TH.sleep(40); assert.equal(ws.doc().notes.length, n0 - 1, '✕ NOTE takes the open note away');
    } finally { cleanup(before, view0); }
  });
  it('SAVE PATTERN keeps it in the rhythm library under Yours; from there it goes to the Timeline in the song\'s key', async () => {
    host(); const before = new Set(Kernel.registry.list().map(r => r.instance_id)), view0 = Object.assign({}, CanvasWM.view), was = localStorage.getItem(MusicParts.PF_LIB.SAVED);
    try {
      localStorage.removeItem(MusicParts.PF_LIB.SAVED); const r0 = PatternLibrary.newPattern(); await TH.sleep(500); const ws = Workshop.current;
      key('i'); await TH.sleep(80); const notes = ws.doc().notes; ws.action('SAVE PATTERN'); await TH.sleep(60);
      const blk = PatternLibrary.all().find(p => p.genre === 'yours' && p.source === 'your pattern'); assert.ok(blk, 'a block under Yours: ' + (blk && blk.name));
      const root = Kernel.music.key.root; assert.deepEqual(blk.notes.map(n => n.s + ':' + (n.r + root)).sort(), notes.map(n => n.s + ':' + n.n).sort(), 'its notes are the pattern\'s (kept from the root, so any key)');
      ws.close(); const U = TH.universe(0.2), sent = PatternLibrary.send(blk, { K: U.K, headless: true }), c2 = OrganismFactory.handle(sent.tl).ctx.internals.clips.find(c => c.name === blk.name);
      assert.ok(c2 && c2.notes.length === notes.length, 'sent to a Timeline as a clip with every note'); void r0;
    } finally { if (was === null) localStorage.removeItem(MusicParts.PF_LIB.SAVED); else localStorage.setItem(MusicParts.PF_LIB.SAVED, was); PatternLibrary.rebuild(); cleanup(before, view0); }
  });
});
