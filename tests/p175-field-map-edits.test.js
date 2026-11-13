/* P175 — erase parts of notes, longer / shorter, move, thicker / thinner on the Field's map. His words, 2026-11-13: "erasing parts of the notes
 * or patterns. Making it thicker or thinner, longer." · thickness: "Maybe options for it? Or pitch width." · and the name: "Rename it Field". */
window.__phase = 'P175';
describe('P175 the Field: its name, and the map edits notes', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  async function make(notes) {
    host(); try { localStorage.removeItem('eravos.field.thick'); } catch (e) {}
    const view0 = Object.assign({}, CanvasWM.view), id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); const inst = OrganismFactory.spawn('eravos.retro-poly', { x: 40, y: 700 }); await TH.sleep(200);
    pub('lane_add', { kind: 'inst', name: 'Lead', target: inst }); await TH.sleep(80); pub('clip_add', { kind: 'notes', startBar: 1, bars: 1, notes }); await TH.sleep(120);
    const H = OrganismFactory.handle(id), clip = H.ctx.internals.clips.find(c => c.kind === 'notes'); H.view.openClip(clip.id); await TH.sleep(300);
    H.view.roll.openWorkshop(0); await TH.sleep(80);
    return { ws: Workshop.current, clip: () => H.ctx.internals.clips.find(c => c.id === clip.id), done: () => { if (Workshop.current) Workshop.current.close(); OrganismFactory.close(id); OrganismFactory.close(inst); CanvasWM.view = view0; CanvasWM.applyView(); try { localStorage.removeItem('eravos.field.thick'); } catch (e) {} } };
  }
  // where a step and a pitch sit on the open map (the kind's own geometry)
  function at(ws, st, n) { const cv = ws.el.querySelector('.ws-canvas'), r = cv.getBoundingClientRect(), W = EravosTimelineWorkshop, top = W.navTop(r.height), G = W.navGeom(ws.doc(), r.width, top);
    return [G.X(st), G.Y(n) + G.rh / 2]; }
  async function drag(ws, pts, o) { const cv = ws.el.querySelector('.ws-canvas'), r = cv.getBoundingClientRect(), ev = (t, [x, y]) => cv.dispatchEvent(new PointerEvent(t, Object.assign({ bubbles: true, clientX: r.left + x, clientY: r.top + y, pointerId: 9, button: 0, buttons: 1 }, o || {})));
    ev('pointerdown', pts[0]); for (let i = 1; i < pts.length; i++) { ev('pointermove', pts[i]); await TH.sleep(2); } ev('pointerup', pts[pts.length - 1]); await TH.sleep(30); }
  const tool = (ws, k) => window.dispatchEvent(new KeyboardEvent('keydown', { key: k, bubbles: true, cancelable: true }));
  it('it is called the Field', async () => {
    const t = await make([{ s: 0, l: 8, n: 60, v: 0.8 }]);
    try { const bar = t.ws.el.querySelector('.ws-name'); assert.equal(bar.textContent, 'FIELD'); assert.ok(/Close the Field/.test(t.ws.el.querySelector('.ws-close').title));
      assert.ok(!/Workshop/.test(t.ws.el.textContent), 'nowhere does it say Workshop'); } finally { t.done(); }
  });
  it('ERASE cuts out the part it passes over — a long note splits in two; one undo step brings it back', async () => {
    const t = await make([{ s: 0, l: 16, n: 60, v: 0.8 }]);
    try { const ws = t.ws; EravosTimelineWorkshop.navOpen || ws.action('NAVIGATOR'); tool(ws, 'e'); assert.equal(ws.tool(), 'erase');
      await drag(ws, [at(ws, 6, 60), at(ws, 7, 60), at(ws, 8, 60), at(ws, 9, 60)]);
      const N = t.clip().notes; assert.equal(N.length, 2, 'two parts: ' + JSON.stringify(N.map(q => [q.s, q.l])));
      assert.ok(N[0].s === 0 && N[0].l <= 6 && N[1].s >= 9 && N[1].s + N[1].l === 16, 'the middle is gone: ' + JSON.stringify(N.map(q => [q.s, q.l])));
      ws.undo(); await TH.sleep(20); assert.equal(t.clip().notes.length, 1, 'undo: one note again');
    } finally { t.done(); }
  });
  it('MOVE: drag the end — longer; the start — later; the note — another time and pitch', async () => {
    const t = await make([{ s: 0, l: 4, n: 60, v: 0.8 }, { s: 8, l: 4, n: 64, v: 0.8 }]);
    try { const ws = t.ws; tool(ws, 'g'); assert.equal(ws.tool(), 'move');
      await drag(ws, [at(ws, 4, 60), at(ws, 5, 60), at(ws, 6, 60)]); assert.equal(t.clip().notes[0].l, 6, 'the end dragged: longer (4 → 6)');
      await drag(ws, [at(ws, 6, 60), at(ws, 4.5, 60), at(ws, 4, 60)]); assert.equal(t.clip().notes[0].l, 4, 'and back: shorter');
      await drag(ws, [at(ws, 9.5, 64), at(ws, 11, 66), at(ws, 12, 67)]); const m = t.clip().notes.find(q => q.n === 67); assert.ok(m && m.s === 10.5, 'the note moved in time and pitch: ' + JSON.stringify(t.clip().notes.map(q => [q.s, q.n])));
    } finally { t.done(); }
  });
  it('THICKNESS has options: pitch width (the default) widens the note; loudness; voices — Shift + drag up', async () => {
    const t = await make([{ s: 0, l: 8, n: 60, v: 0.5 }]);
    try { const ws = t.ws; tool(ws, 'g'); assert.equal(ws.doc().thick || 'pitch width', 'pitch width');
      assert.ok(Array.from(ws.el.querySelectorAll('.ws-opts *')).some(x => /THICKNESS/.test(x.textContent)), 'the option sits in the options bar');
      const [x, y] = at(ws, 3, 60); await drag(ws, [[x, y], [x, y - 20], [x, y - 40]], { shiftKey: true });
      const n0 = t.clip().notes[0]; assert.ok(n0.b && n0.b.osc && n0.b.osc.depth >= 0.4, 'thicker: a wider pitch (' + JSON.stringify(n0.b) + ')');
      ws.set('thick', 'loudness'); await drag(ws, [[x, y], [x, y - 40]], { shiftKey: true }); assert.ok(t.clip().notes[0].v > 0.55, 'loudness: louder ' + t.clip().notes[0].v);
      ws.set('thick', 'voices'); await drag(ws, [[x, y], [x, y - 40]], { shiftKey: true }); assert.ok(t.clip().notes[0].x && t.clip().notes[0].x.iv && t.clip().notes[0].x.iv.length >= 1, 'voices: notes stacked on it');
      await drag(ws, [[x, y], [x, y + 60]], { shiftKey: true }); assert.ok(!(t.clip().notes[0].x && t.clip().notes[0].x.iv), 'thinner: back to one voice');
    } finally { t.done(); }
  });
});
