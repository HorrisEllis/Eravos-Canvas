/* 3.90 — James, 2026-11-01: "what about a setting to play tools in proximity also zooming out makes it quiter." */
window.__phase = 'P90';
describe('🎧 Hear by place (3.90)', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  const place = (id) => Kernel.audio.ports(id).find(p => p.direction === 'out' && p.place);
  it('the middle of the view is full, far off screen is a whisper; zooming out quietens; it pans with where it sits', () => {
    const view = { left: 0, top: 0, width: 1000, height: 600 }, win = (x, y) => ({ getBoundingClientRect: () => ({ left: x - 100, top: y - 100, width: 200, height: 200 }) });
    const P = Proximity.placeOf;
    assert.ok(P(win(500, 300), view, 1).gain > 0.99, 'centre: full');
    assert.ok(Math.abs(P(win(4000, 300), view, 1).gain - Proximity.FLOOR) < 0.01, 'far off: a whisper');
    const mid = P(win(950, 300), view, 1); assert.ok(mid.gain < 0.99 && mid.gain > Proximity.FLOOR, 'the edge: between'); assert.gt(mid.pan, 0.3, 'and to the right');
    assert.lt(P(win(80, 300), view, 1).pan, -0.3, 'left is left');
    const z = P(win(500, 300), view, 0.5).gain; assert.ok(z > 0.4 && z < 0.6, 'zoom 50 %: about −6 dB, ' + z.toFixed(2));
  });
  it('on: a synth in the middle plays full, moved far away it fades; an effect is left alone; off puts every one back', async () => {
    host(); const K = Kernel; await K.audio.ctx.resume(); Proximity.init(K); const was = Proximity.on;
    const syn = OrganismFactory.spawn('eravos.supersaw', { x: 0, y: 0, w: 300, h: 200 }), fx = OrganismFactory.spawn('eravos.fx-echo', { x: 0, y: 0 }); await TH.sleep(60);
    try {
      const host = CanvasWM.canvas, vr = host.getBoundingClientRect(), z = CanvasWM.view.z || 1;
      CanvasWM.place(syn, { x: (vr.width / 2 - CanvasWM.view.x) / z - 150, y: (vr.height / 2 - CanvasWM.view.y) / z - 100 });
      Proximity.set(true); Proximity.step(); await TH.sleep(500);
      const g0 = place(syn).place.gain.value; assert.gt(g0, 0.6, 'near the middle: loud (' + g0.toFixed(2) + ')');
      CanvasWM.place(syn, { x: 20000, y: 20000 }); Proximity.step(); await TH.sleep(600);
      const g1 = place(syn).place.gain.value; assert.lt(g1, 0.2, 'far away: quiet (' + g1.toFixed(2) + ')');
      assert.ok(!place(fx), 'the effect untouched (no place stage at all)');
      Proximity.set(false); await TH.sleep(500); assert.gt(place(syn).place.gain.value, 0.97, 'off: back to full');
    } finally { Proximity.set(was); OrganismFactory.close(syn); OrganismFactory.close(fx); }
  });
});
