/* P167 — the exploded view explodes however many layers a document has. His words, 2026-11-12: "the eploded view doesn't explode it anymore".
 * The gap was 1.15 / layers: an instrument's fourteen stages ended 0.08 apart — one block. Now the layers keep their distance and the
 * camera steps back to fit the stack; a document with few layers looks as it did. */
window.__phase = 'P167';
describe('P167 the exploded view stays exploded', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  const centres = (P) => P.map(p => (p.poly[0][1] + p.poly[1][1] + p.poly[2][1] + p.poly[3][1]) / 4);
  it('fourteen stages: each plane clear of the next, all of them in view; FLAT still stacks them', async () => {
    host(); const id = OrganismFactory.spawn('eravos.retro-dco', { x: 40, y: 40 }); await TH.sleep(300);
    try {
      InstrumentWorkshop.open(id); await TH.sleep(80); const ws = Workshop.current;
      ws.view({ mode: '3d', exploded: true }); await TH.sleep(40);
      const P = ws.view().planes, c = centres(P), r = ws.el.querySelector('canvas').getBoundingClientRect();
      assert.ok(P.length >= 10, P.length + ' planes');
      const steps = c.slice(1).map((y, i) => Math.abs(y - c[i])), minStep = Math.min(...steps), span = Math.max(...c) - Math.min(...c);
      assert.ok(minStep >= 25, 'each plane at least 25 px from the next: ' + minStep.toFixed(1));
      P.forEach(p => p.poly.forEach(([x, y]) => assert.ok(x >= -2 && y >= -2 && x <= r.width + 2 && y <= r.height + 2, p.id + ' in view: ' + x.toFixed(0) + ',' + y.toFixed(0))));
      ws.view({ exploded: false }); await TH.sleep(40); const f = centres(ws.view().planes), fspan = Math.max(...f) - Math.min(...f);
      assert.ok(span > fspan * 3, 'exploded ' + span.toFixed(0) + ' px vs flat ' + fspan.toFixed(0) + ' px');
    } finally { if (Workshop.current) Workshop.current.close(); OrganismFactory.close(id); }
  });
});
