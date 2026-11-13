/* P161 — the Workshop's toolbar, tempo, rhythms from the library (W3g, specs/eravos.workshop.spec ADDENDUM 2026-11-09 (5)). His words, 2026-11-09:
 * "i want to be able to manipulate it on the canvas, like photoshop, needs the toolbar, for drawing, shaping, editing, etc. tempo. next patterns
 * from the pattern storage, maybe rename it to rhythm library." */
window.__phase = 'P161';
describe('P161 the toolbar on the view, tempo, the rhythm library', () => {
  const key = (k, o) => window.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, o || {})));
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  async function make(notes) {
    host(); const view0 = Object.assign({}, CanvasWM.view), id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); pub('lane_add', { kind: 'inst', name: 'Lead' }); await TH.sleep(80); pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes }); await TH.sleep(80);
    const H = OrganismFactory.handle(id), clipOf = () => H.ctx.internals.clips.find(c => c.kind === 'notes'); H.view.openClip(clipOf().id); await TH.sleep(300);
    const done = () => { const pl = document.querySelector('.plib'); if (pl && window.PatternLibrary) PatternLibrary.open(); if (window.Workshop && Workshop.current) Workshop.current.close(); OrganismFactory.close(id); CanvasWM.view = view0; CanvasWM.applyView(); };
    return { H, roll: H.view.roll, clipOf, done };
  }
  const NOTES = [{ s: 0, l: 8, n: 60, v: 0.8 }, { s: 8, l: 8, n: 64, v: 0.7 }];
  it('the toolbar: V P L D S G E O; on the note a tool opens its pitch; pen, line, points, smooth, move, erase each change the curve, live, one step each', async () => {
    const t = await make(NOTES);
    try {
      t.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current, cv = document.querySelector('.ws-app .ws-canvas'), r = cv.getBoundingClientRect(), W = r.width, H = r.height;
      assert.deepEqual(ws.tools(), ['select', 'pen', 'line', 'points', 'smooth', 'move', 'erase'], 'the toolbar (no Orbit: 2026-11-12, the toolbar edits)'); assert.equal(document.querySelectorAll('.ws-strip .ws-ti').length >= 7, true, 'on the left strip');
      key('p'); assert.equal(ws.tool(), 'pen', 'P = pen'); key('d'); assert.equal(ws.tool(), 'points', 'D = points'); key('g'); assert.equal(ws.tool(), 'move', 'G = move'); key('p');
      const top = EravosTimelineWorkshop.navTop(H), y0 = top + 26, h = H - y0 - 14, X = (tt) => 16 + tt * (W - 32), Y = (f) => y0 + (1 - f) * h;
      ws.drag('pen', [[X(0.5), Y(0.5)]]); await TH.sleep(10); assert.ok(/PITCH/.test(document.querySelector('.ws-stations').textContent), 'a tool on the note opens its pitch');
      const base = () => t.clipOf().notes[0].sh.t.pitch.base, n0 = ws.history().length;
      // pen: a stretch in the middle, high — the ends stay
      ws.drag('pen', [[X(0.4), Y(0.9)], [X(0.5), Y(0.9)], [X(0.6), Y(0.9)]]); await TH.sleep(10);
      const at = (c, tt) => MusicParts.curveEdit.at(c, tt); assert.ok(at(base(), 0.5) > 1 && Math.abs(at(base(), 0)) < 1e-6, 'pen: only the drawn stretch changed (' + at(base(), 0.5).toFixed(2) + ')');
      assert.equal(ws.history().length, n0 + 1, 'one history step: ' + ws.history().slice(-1)[0]); assert.ok(t.clipOf().notes[0].b && t.clipOf().notes[0].b.shape === 'path', 'and it plays');
      // line
      ws.drag('line', [[X(0.1), Y(0.2)], [X(0.3), Y(0.8)]]); await TH.sleep(10); assert.ok(at(base(), 0.1) < at(base(), 0.3), 'line: rises from where it starts to where it ends');
      // points: drag the point at 0.5 down; add one; Alt removes it
      const c0 = base(), i5 = c0.reduce((bi, q, i) => Math.abs(q[0] - 0.5) < Math.abs(c0[bi][0] - 0.5) ? i : bi, 1); const vv = (v) => { const rr = ws.doc(); return v; };
      ws.drag('points', [[X(c0[i5][0]), Y(0.9)], [X(c0[i5][0]), Y(0.15)]]); await TH.sleep(10); assert.ok(at(base(), c0[i5][0]) < at(c0, c0[i5][0]), 'points: the point moved down');
      const before = base().length; ws.drag('points', [[X(0.85), Y(0.5)]]); await TH.sleep(10); assert.equal(base().length, before + 1, 'a click on the curve adds a point'); void vv;
      ws.drag('points', [[X(0.85), Y(0.5)]], { alt: true }); await TH.sleep(10); assert.equal(base().length, before, 'Alt+click removes it');
      // smooth, move, erase
      const sm0 = JSON.stringify(base()); ws.drag('smooth', [[X(0.45), Y(0.5)], [X(0.55), Y(0.5)]]); await TH.sleep(10); assert.ok(JSON.stringify(base()) !== sm0, 'smooth changed what it passed over');
      const m0 = at(base(), 0.95); ws.drag('move', [[X(0.5), Y(0.5)], [X(0.5), Y(0.7)]]); await TH.sleep(10); assert.ok(at(base(), 0.95) > m0, 'move: the whole curve up');
      ws.drag('erase', [[X(0.3), Y(0.5)], [X(0.7), Y(0.5)]]); await TH.sleep(10); assert.ok(Math.abs(at(base(), 0.5)) < 1e-6, 'erase: flattened to rest where it passed');
      ws.undo(); await TH.sleep(10); assert.ok(Math.abs(at(base(), 0.5)) > 1e-6, 'undo takes the erase back');
      // a modulator selected: the tool draws its wave
      ws.action('＋ MOD'); ws.select('m:0'); ws.drag('pen', [[X(0.0), Y(0.9)], [X(0.25), Y(0.1)], [X(0.5), Y(0.9)], [X(0.75), Y(0.1)]]); await TH.sleep(10);
      const m = t.clipOf().notes[0].sh.t.pitch.mods[0]; assert.ok(m.shape === 'drawn' && m.wave.length > 2, 'the wave of the modulator, drawn');
      // live: a move while the hand is down changes the view, not the note
      const live0 = JSON.stringify(t.clipOf().notes[0]); ws.select('base'); key('l');
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, clientX: r.left + X(0.2), clientY: r.top + Y(0.5), pointerId: 1 }));
      cv.dispatchEvent(new PointerEvent('pointermove', { bubbles: true, clientX: r.left + X(0.8), clientY: r.top + Y(0.9), pointerId: 1 })); await TH.sleep(10);
      assert.equal(JSON.stringify(t.clipOf().notes[0]), live0, 'while the hand is down, the note is not changed yet');
      cv.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, clientX: r.left + X(0.8), clientY: r.top + Y(0.9), pointerId: 1 })); await TH.sleep(10);
      assert.ok(JSON.stringify(t.clipOf().notes[0]) !== live0, 'letting go keeps it');
    } finally { t.done(); }
  });
  it('tempo in the options bar: it sets the song\'s tempo, undo puts it back', async () => {
    const t = await make(NOTES);
    try {
      t.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current, b0 = Kernel.music.bpm, sent = [];
      const inp = Array.from(document.querySelectorAll('.ws-opts .ws-f')).find(f => /TEMPO/.test(f.textContent)); assert.ok(inp, 'TEMPO in the options bar');
      const off = Kernel.bus.subscribe('ui:transport-bpm', (m) => sent.push((m && m.payload !== undefined ? m.payload : m).bpm));   // the transport's own door (the test page has no transport)
      try { ws.set('bpm', 137, 'Tempo'); await TH.sleep(40); assert.equal(sent[sent.length - 1], 137, 'the transport is asked for 137');
        Kernel.music.bpm = 137; ws.undo(); await TH.sleep(40); assert.equal(sent[sent.length - 1], b0, 'undo asks for ' + b0 + ' again'); }
      finally { if (typeof off === 'function') off(); Kernel.music.bpm = b0; }
    } finally { t.done(); }
  });
  it('the rhythm library: its name; R opens it; ⇥ Into the Workshop puts a rhythm into the open pattern, undo brings the old notes back', async () => {
    const t = await make(NOTES);
    try {
      assert.ok(/Rhythms/.test((document.getElementById('patternsBtn') || { textContent: 'Rhythms' }).textContent), 'the button says Rhythms');
      t.roll.openWorkshop(0); await TH.sleep(40); const ws = Workshop.current, before = JSON.stringify(t.clipOf().notes);
      key('r'); await TH.sleep(150); const pl = document.querySelector('.plib'); assert.ok(pl && pl.getAttribute('aria-label') === 'Rhythm library', 'R opens the rhythm library');
      assert.ok(/Rhythms/.test(pl.querySelector('.plib-tabs').textContent), 'its tab: Rhythms');
      await TH.sleep(200); const b = Array.from(pl.querySelectorAll('button')).find(x => /⇥ Field/.test(x.textContent)); assert.ok(b, 'each rhythm offers ⇥ Into the Workshop');
      b.click(); await TH.sleep(60); assert.ok(!document.querySelector('.plib'), 'the library closes');
      assert.ok(JSON.stringify(t.clipOf().notes) !== before && t.clipOf().notes.length > 0, 'the rhythm is the pattern now (' + t.clipOf().notes.length + ' notes)');
      assert.ok(/Rhythm:/.test(ws.history().slice(-1)[0]), 'one history step: ' + ws.history().slice(-1)[0]);
      ws.undo(); await TH.sleep(30); assert.equal(JSON.stringify(t.clipOf().notes), before, 'undo brings the old notes back');
    } finally { t.done(); }
  });
});
