/* P170 — drawing on the Workshop draws. His words, 2026-11-12: "okay exploded view works. drawing does nothing."
 * At the note a drag only opened the pitch (a drum note: nothing), and in 3D every press turned the camera. Now a drag draws: at the note
 * into the shape it is over (made if needed, one step), and in 3D on the plane under the pen; the camera turns off the planes, Alt, or O. */
window.__phase = 'P170';
describe('P170 drawing draws', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  async function make(target, notes) {
    host(); const view0 = Object.assign({}, CanvasWM.view), id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); const inst = OrganismFactory.spawn(target, { x: 40, y: 700 }); await TH.sleep(200);
    pub('lane_add', { kind: 'inst', name: 'Lane', target: inst }); await TH.sleep(80);
    pub('clip_add', { kind: 'notes', startBar: 1, bars: 1, notes }); await TH.sleep(120);
    const H = OrganismFactory.handle(id), clip = H.ctx.internals.clips.find(c => c.kind === 'notes'); H.view.openClip(clip.id); await TH.sleep(300);
    H.view.roll.openWorkshop(0); await TH.sleep(80);
    return { ws: Workshop.current, done: () => { if (Workshop.current) Workshop.current.close(); OrganismFactory.close(id); OrganismFactory.close(inst); CanvasWM.view = view0; CanvasWM.applyView(); } };
  }
  const cvOf = (ws) => ws.el.querySelector('.ws-canvas');
  async function dragPath(ws, pts, opt) {   // pts in canvas pixels
    const cv = cvOf(ws), r = cv.getBoundingClientRect(), ev = (t, [x, y]) => cv.dispatchEvent(new PointerEvent(t, Object.assign({ bubbles: true, clientX: r.left + x, clientY: r.top + y, pointerId: 7, button: 0, buttons: 1 }, opt || {})));
    ev('pointerdown', pts[0]); for (let i = 1; i < pts.length; i++) { ev('pointermove', pts[i]); await TH.sleep(2); } ev('pointerup', pts[pts.length - 1]); await TH.sleep(40);
  }
  const rising = (W, H) => Array.from({ length: 24 }, (_, i) => [40 + i / 23 * (W - 80), H - 60 - i / 23 * (H * 0.45)]);
  const onPlane = (pl, u, v) => { const [p0, px, , pz] = pl.poly; return [p0[0] + u * (px[0] - p0[0]) + v * (pz[0] - p0[0]), p0[1] + u * (px[1] - p0[1]) + v * (pz[1] - p0[1])]; };
  const at = (base, x) => base.reduce((b, q) => Math.abs(q[0] - x) < Math.abs(b[0] - x) ? q : b, base[0])[1];   // the drawn value nearest x (the pen keeps the curve's ends)
  const rises = (base) => base.length > 4 && at(base, 0.85) - at(base, 0.15) > 0;
  const shapeOf = (ws, t) => { const a = ws.doc().notes[ws.doc().sel | 0]; return a.sh && a.sh.t && a.sh.t[t]; };
  it('2D, a drum note: a drag at the note draws its first knob — the shape made and drawn in one step; undo takes it away', async () => {
    const t = await make('eravos.pads', [{ s: 0, l: 4, n: 36, v: 0.8 }]);
    try {
      const ws = t.ws, r = cvOf(ws).getBoundingClientRect(), h0 = ws.history().length, k0 = (ws.doc().knobs || [])[0]; assert.ok(k0, 'the drum machine has a knob');
      await dragPath(ws, rising(r.width, r.height));
      const sh = shapeOf(ws, 'k:' + k0.key); assert.ok(sh, 'a ' + k0.label + ' shape was made');
      assert.ok(rises(sh.base), 'the drawn base rises like the stroke: ' + JSON.stringify(sh.base.slice(0, 4)));
      assert.equal(ws.history().length, h0 + 1, 'one history step: ' + ws.history().slice(-2).join(' | '));
      ws.undo(); await TH.sleep(30); assert.ok(!shapeOf(ws, 'k:' + k0.key), 'undo takes it away');
    } finally { t.done(); }
  });
  it('2D, a melodic note: a drag at the note draws the pitch', async () => {
    const t = await make('eravos.retro-poly', [{ s: 0, l: 8, n: 60, v: 0.8 }]);
    try {
      const ws = t.ws, r = cvOf(ws).getBoundingClientRect(); await dragPath(ws, rising(r.width, r.height));
      const sh = shapeOf(ws, 'pitch'); assert.ok(sh, 'the pitch is shaped'); assert.ok(rises(sh.base) && at(sh.base, 0.85) - at(sh.base, 0.15) > 1, 'it bends up as drawn: ' + at(sh.base, 0.15).toFixed(2) + ' → ' + at(sh.base, 0.85).toFixed(2));
    } finally { t.done(); }
  });
  it('3D: the pen draws on the plane under it; off the planes the camera turns', async () => {
    const t = await make('eravos.retro-poly', [{ s: 0, l: 8, n: 60, v: 0.8 }]);
    try {
      const ws = t.ws; ws.set('add', 'Pitch'); await TH.sleep(30);   // into the pitch shape: base, result
      ws.view({ mode: '3d', exploded: true }); await TH.sleep(40);
      const P = ws.view().planes, base = P.find(p => p.id === 'base'); assert.ok(base, 'the base is a plane: ' + P.map(p => p.id).join(','));
      // draw on the base: a rise across it (v is depth into the plane; up on the drawing = toward v 0)
      const pts = Array.from({ length: 20 }, (_, i) => onPlane(base, 0.08 + i / 19 * 0.84, 0.85 - i / 19 * 0.7));
      const yaw0 = ws.view().cam.yaw; await dragPath(ws, pts);
      assert.ok(Math.abs(ws.view().cam.yaw - yaw0) < 1e-9, 'the camera did not turn while drawing');
      const bs = shapeOf(ws, 'pitch').base; assert.ok(rises(bs) && at(bs, 0.85) - at(bs, 0.15) > 1, 'the base rises as drawn on its plane: ' + at(bs, 0.15).toFixed(2) + ' → ' + at(bs, 0.85).toFixed(2));
      // off every plane: the camera turns
      const cv = cvOf(ws), r = cv.getBoundingClientRect(); await dragPath(ws, [[8, 8], [60, 20], [120, 30]]);
      assert.ok(Math.abs(ws.view().cam.yaw - yaw0) > 0.1, 'a drag off the planes turns the camera');
      // Alt + drag on a plane turns it too
      const y1 = ws.view().cam.yaw, b2 = ws.view().planes.find(p => p.id === 'base'); await dragPath(ws, [onPlane(b2, 0.3, 0.5), onPlane(b2, 0.6, 0.5)].concat([onPlane(b2, 0.9, 0.5)]), { altKey: true });
      assert.ok(Math.abs(ws.view().cam.yaw - y1) > 0.05, 'Alt + drag turns the camera');
    } finally { t.done(); }
  });
});
