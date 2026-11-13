/* P169 — layers can be added on the Workshop. His words, 2026-11-12: "also why cant i add layers?" (a drum note in 3D: one plane) ·
 * "it worked before. when i was able to add mods. we are regressing. it was exploded before and i was able to draw. no it should be under the
 * layers section. also the mods." — every layer a plane again (as at 3.156); ＋ and ∿ (a mod) at the foot of LAYERS.
 * ＋ on LAYERS (Ctrl+Shift+N, right-click › NEW LAYER) lists what the kind can make; a shape is a curve, so it becomes a plane in 3D. */
window.__phase = 'P169';
describe('P169 a new layer on the Workshop', () => {
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
  it('a drum note: ＋ offers its knobs; shaping one adds a plane in 3D; undo takes it away', async () => {
    const t = await make('eravos.pads', [{ s: 0, l: 2, n: 36, v: 0.8 }, { s: 4, l: 2, n: 38, v: 0.8 }]);
    try {
      const ws = t.ws, btn = ws.el.querySelector('.ws-layers .ws-lfoot .ws-new');
      assert.ok(btn, 'a ＋ at the foot of LAYERS'); assert.ok(!ws.el.querySelector('.ws-layers .ws-ph .ws-new'), 'not in the header');
      assert.ok(Array.from(ws.el.querySelectorAll('.ws-lfoot .ws-lt')).some(b => b.textContent === '∿'), 'a ∿ (add a mod) beside it'); const A = ws.addable();
      assert.ok(A.some(x => /^SHAPE OVER THE NOTE( · [^›]+)? › /.test(x)), 'it can shape a knob over the note: ' + A.slice(0, 6).join(' | '));
      assert.ok(!A.some(x => /^SHAPE OVER THE NOTE[^›]* › Pitch$/.test(x)), 'a pad has no pitch to bend');
      ws.view({ mode: '3d', exploded: true }); await TH.sleep(40); const p0 = ws.view().planes.length;
      assert.ok(p0 >= 5, 'a drum note explodes into its layers again: ' + p0 + ' planes');
      assert.ok(A.some(x => /^MODULATE( · [^›]+)? › /.test(x)), 'MODULATE is offered');
      const first = A.find(x => /^SHAPE OVER THE NOTE( · [^›]+)? › /.test(x)).replace(/^.* › /, '');
      assert.ok(ws.add(first, 'SHAPE OVER THE NOTE'), 'shape ' + first); await TH.sleep(40);
      // back up to the note: the shape is a layer of it
      ws.undo(); ws.redo(); await TH.sleep(20);
      const L = Array.from(ws.el.querySelectorAll('.ws-layers .ws-lay')).map(r => r.textContent);
      assert.ok(ws.history().length >= 1, 'one history step: ' + ws.history().join(' | '));
      ws.undo(); await TH.sleep(30); assert.equal(ws.addable().filter(x => x.startsWith('SHAPE OVER THE NOTE') && x.endsWith(' › ' + first)).length, 1, 'undo takes the shape away');
      ws.view({ mode: '3d' }); await TH.sleep(30); assert.equal(ws.view().planes.length, p0, 'back to ' + p0 + ' plane(s)');
      // the button opens a menu
      btn.click(); await TH.sleep(30); const cm = document.querySelector('.cm');
      assert.ok(cm && /SHAPE OVER THE NOTE/i.test(cm.textContent), 'the ＋ opens the NEW LAYER menu');
      if (ContextMenu.close) ContextMenu.close();
    } finally { t.done(); }
  });
  it('∿ on a drum note: a modulator on its first knob, in one step; undo takes it back', async () => {
    const t = await make('eravos.pads', [{ s: 0, l: 4, n: 36, v: 0.8 }]);
    try {
      const ws = t.ws, b = Array.from(ws.el.querySelectorAll('.ws-lfoot .ws-lt')).find(x => x.textContent === '∿'); assert.ok(b && !b.disabled, 'a ∿');
      const h0 = ws.history().length; b.click(); await TH.sleep(40);
      const L = EravosTimelineWorkshop.KIND.layers(ws.doc()); assert.ok(L.some(l => /^m:0$/.test(l.id)), 'a modulator layer: ' + L.map(l => l.id).join(','));
      assert.equal(ws.history().length, h0 + 1, 'one history step');
      ws.undo(); await TH.sleep(30); assert.ok(!EravosTimelineWorkshop.KIND.layers(ws.doc()).some(l => /^m:/.test(l.id)), 'undo takes it back');
    } finally { t.done(); }
  });
  it('a melodic note: ＋ Pitch makes a pitch curve — two planes become three', async () => {
    const t = await make('eravos.retro-poly', [{ s: 0, l: 8, n: 60, v: 0.8 }]);
    try {
      const ws = t.ws; assert.ok(ws.addable().some(x => /^SHAPE OVER THE NOTE[^›]* › Pitch$/.test(x)), 'Pitch can be added: ' + ws.addable().slice(0, 4).join(' | '));
      ws.view({ mode: '3d' }); await TH.sleep(30); const n0 = ws.view().planes.length;
      assert.ok(ws.add('Pitch')); await TH.sleep(30);
      assert.ok(!ws.addable().some(x => /^SHAPE OVER THE NOTE[^›]* › Pitch$/.test(x)), 'pitch is shaped now, not offered again');
      assert.ok(ws.view().planes.length >= 1, 'the shape draws in 3D');
      assert.ok(n0 >= 1);
    } finally { t.done(); }
  });
});
