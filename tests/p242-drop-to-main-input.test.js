/* P242 · a wire dropped on a window lands on the input that moves its sound (3.245) — his words (2026-11-27): "also some of the tools wont connect
 * and route audio. like the wub tools wire but don't route." Measured before: Wub Rate (or any LFO) dropped on Wub Filter's window went to its
 * Mix (the shared effect input listed first) — the wire drew, the filter never moved. Now a tool marks its main input (primary) and the shared
 * Mix is secondary; a drop takes the main one. A drop exactly on a dot still takes that dot. */
window.__phase = 'P242';
describe('P242 · a dropped wire takes the main input', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  // start a drag from the source's main output dot (lights every compatible input), ask where a drop on the target's window would land
  async function dropTarget(srcTool, dstTool) {
    host(); const a = OrganismFactory.spawn(srcTool, { x: 20, y: 20 }), b = OrganismFactory.spawn(dstTool, { x: 700, y: 20 }); await TH.sleep(120);
    try {
      const dot = CanvasWM.windowOf(a).querySelector('.rail.right .port-dot.modulation') || CanvasWM.windowOf(a).querySelector('.rail.right .port-dot');
      const r = dot.getBoundingClientRect(); dot.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 0, buttons: 1, clientX: r.left + 2, clientY: r.top + 2, pointerId: 7 }));
      await TH.sleep(10); const t = WireSystem.mainTarget(CanvasWM.windowOf(b), false);
      window.dispatchEvent(new PointerEvent('pointercancel', { pointerId: 7 })); return t ? t.dataset.hook : null;
    } finally { OrganismFactory.close(a); OrganismFactory.close(b); }
  }
  it('Wub Rate dropped on Wub Filter goes to its Wub input (it went to Mix)', async () => {
    assert.equal(await dropTarget('eravos.wub-rate', 'eravos.wub-filter'), 'wubf.hook.mod_wub');
  });
  it('an LFO dropped on any effect does not land on its Mix', async () => {
    for (const fx of ['eravos.fx-filter', 'eravos.wub-filter', 'eravos.band-collision', 'eravos.spatial-organism']) { const h = await dropTarget('eravos.lfo', fx); assert.ok(h && h !== 'fx.hook.mod_mix', fx + ': ' + h); }
  });
  it('wired that way, Wub Rate moves the filtered sound (the level swings, not flat)', async () => {
    const U = TH.universe(2.2, { bpm: 120 }), osc = TH.spawn(U, 'eravos.wub-osc'), fil = TH.spawn(U, 'eravos.wub-filter'), rate = TH.spawn(U, 'eravos.wub-rate');
    const w1 = U.K.wires.register({ src: { instanceId: osc, hookId: 'wubo.hook.audio_out' }, dst: { instanceId: fil, hookId: 'fx.hook.audio_in' } });
    const w2 = U.K.wires.register({ src: { instanceId: rate, hookId: 'wubrate.hook.mod_out' }, dst: { instanceId: fil, hookId: 'wubf.hook.mod_wub' } });
    assert.ok(w1.ok && w2.ok, 'both wires register');
    const c = OrganismFactory.handle(fil).ctx; if (c.ready) await c.ready;
    U.K.audio.chain.out.gain.value = 0; U.K.audio.ports(fil).find(x => x.kind === 'audio' && x.direction === 'out').node.connect(U.ctx.destination);
    TH.note(U, osc, 45, 0.1, { duration: 2 }); U.T.renderTicks(0, Math.floor(2.2 * 120 / 15), 0);
    const buf = await TH.render(U), lv = []; for (let t = 0.3; t < 2; t += 0.05) lv.push(TH.rms(buf, t, t + 0.05));
    const mx = Math.max(...lv), mn = Math.min(...lv); assert.gt(mx, 0.005, 'it sounds'); assert.gt(mx / Math.max(mn, 1e-6), 1.5, `the wub moves it: loudest / quietest ${(mx / Math.max(mn, 1e-6)).toFixed(2)}`);
  });
});
