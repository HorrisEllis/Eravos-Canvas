/* 3.71 MOTION + PERFORM — "more dynamic control and a better ui … all the above while not cluttering". A tool with perform: true
 * moves its own knobs (no extra windows, no wires): shapes in time with the song, four macro knobs, an XY pad. Groove is the first. */
window.__phase = 'P71';
describe('P71 · motion and perform, built into a tool', () => {
  const ctxOf = (id) => OrganismFactory.handle(id).ctx;
  const M = () => window.MusicMotion;
  it('the shapes: sine / triangle / saws / square in −1…1, random repeats per cycle and changes between cycles, steps read their bars', () => {
    const S = M().shapeAt;
    assert.near(S('sine', 0.25), 1, 1e-9); assert.near(S('triangle', 0.25), 1, 1e-9); assert.near(S('triangle', 0.75), -1, 1e-9);
    assert.near(S('saw', 0), 1, 1e-9); assert.near(S('ramp', 0), -1, 1e-9); assert.equal(S('square', 0.1), 1); assert.equal(S('square', 0.6), -1);
    assert.equal(S('random', 3.1, 5), S('random', 3.9, 5), 'held for the cycle'); assert.ok(S('random', 3.1, 5) !== S('random', 4.1, 5), 'a new one next cycle');
    assert.equal(S('steps', 0.6, 0, [1, -1, 0.5, 0]), 0.5);
    for (let c = 0; c < 8; c += 0.37) ['sine', 'triangle', 'saw', 'ramp', 'square', 'random', 'smooth'].forEach(sh => { const v = S(sh, c, 9); assert.ok(v >= -1 && v <= 1, sh + ' in range'); });
  });
  it('a perform tool gets four macro knobs (real knobs: they have knob inputs) and two hidden settings; other tools do not', () => {
    const d = OrganismFactory.def('eravos.groove-gen');
    assert.deepEqual(['m1', 'm2', 'm3', 'm4'].map(k => !!d.config.find(c => c.key === k && c.perform)), [true, true, true, true]);
    assert.ok(d.config.find(c => c.key === '_motion' && c.hidden) && d.config.find(c => c.key === '_perform' && c.hidden));
    assert.ok(d.hooks.some(hk => hk.hook_id === 'knob.m1'), 'm1 can be wired or MIDI-moved like any knob');
    assert.ok(!OrganismFactory.def('eravos.fx-echo').config.some(c => c.key === 'm1'), 'opt-in only');
  });
  it('a knob moved by a 1-bar sine: ENERGY follows it at each step, in time with the song, around its own value — which is never written', async () => {
    const U = TH.universe(0.2, { bpm: 120 }), g = TH.spawn(U, 'eravos.groove-gen'), c = ctxOf(g), seen = [];
    c.params.setMany({ energy: 0.5, swing: 0 }); c.params.set('_motion', [{ key: 'energy', shape: 'sine', beats: 4, depth: 0.5, phase: 0 }]); await TH.sleep(5);
    U.K.bus.subscribe('groove:step', (p) => { if (p._from === g) seen.push(+p.energy.toFixed(3)); }, 'test');
    U.T.renderTicks(0, 16, 0.05);
    assert.near(seen[0], 0.5, 0.02, 'bar start: the sine is at 0'); assert.near(seen[4], 0.75, 0.02, 'beat 2: the top — its value + depth 0.5 × half the range');
    assert.near(seen[12], 0.25, 0.02, 'beat 4: the bottom'); assert.equal(c.params.base('energy'), 0.5, 'its own value stays');
    c.params.set('_motion', []); await TH.sleep(5); assert.ok(!c.params.isLive('energy'), 'no movement: the knob is its own again');
  });
  it('a macro turns several knobs at once by their own amounts; at 0 it changes nothing; the XY pad sets two macros', async () => {
    const U = TH.universe(0.2), g = TH.spawn(U, 'eravos.groove-gen'), c = ctxOf(g);
    c.params.setMany({ energy: 0.4, swing: 0.1, humanize: 0 });
    c.params.set('_perform', { names: ['Push', 'Macro 2', 'Macro 3', 'Macro 4'], map: [{ energy: 0.5, swing: -0.25 }, {}, {}, {}], xy: { x: 0, y: 1 } }); await TH.sleep(5);
    U.T.renderTicks(0, 1, 0.05); assert.ok(!c.params.isLive('energy'), 'macro at 0: nothing moves');
    c.params.set('m1', 1); await TH.sleep(5); U.T.renderTicks(1, 2, 0.2);
    assert.near(c.params.get('energy'), 0.9, 1e-6, 'energy +0.5 of its range'); assert.near(c.params.get('swing'), 0, 1e-6, 'swing −0.25 of 0…0.6 = −0.15, clamped at 0');
    c.params.set('m1', 0.5); await TH.sleep(5); U.T.renderTicks(2, 3, 0.3); assert.near(c.params.get('energy'), 0.65, 1e-6, 'half way');
    assert.equal(c.params.base('energy'), 0.4, 'its own value stays');
    const s = c.serialize(); assert.equal(s.params._perform.names[0], 'Push', 'saved with the tool'); assert.equal(s.params.m1, 0.5);
  });
  it('the PAGE: horizontal tabs (Panel, Feel, Motion, Perform …); Panel shows the tool live before it is on the canvas; Add to canvas keeps what you set', async () => {
    const host = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(host, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    OrganismFactory.clearAll && OrganismFactory.clearAll(Kernel);
    const before = Kernel.registry.list().length;
    ToolPage.open('eravos.groove-gen', { K: Kernel }); await TH.sleep(80);
    try {
      const nav = document.querySelector('.tp-nav'), tabs = [...nav.querySelectorAll('.tp-tab')];
      assert.deepEqual(tabs.slice(0, 4).map(b => b.textContent.trim()), ['Panel', 'Feel', 'Motion', 'Perform']);
      const r0 = tabs[0].getBoundingClientRect(), r1 = tabs[1].getBoundingClientRect(); assert.near(r0.top, r1.top, 1, 'one row'); assert.gt(r1.left, r0.left, 'side by side');
      assert.ok(r0.width < nav.getBoundingClientRect().width / 2, 'sized to their names, not full width');
      const panel = document.querySelector('.tp-sec[data-sec="panel"]'); assert.ok(!panel.hidden && panel.querySelector('.gg-map'), 'Panel open by default, the painting in it');
      assert.ok(!CanvasWM.windowOf || !document.querySelector('.wm-win[data-organism="eravos.groove-gen"]'), 'nothing added to the canvas yet');
      // set something on the page, then add it
      tabs[2].click(); await TH.sleep(20); const sel = document.querySelector('.tp-sec[data-sec="motion"] .mo-head select'); sel.value = 'swing'; sel.dispatchEvent(new Event('change')); await TH.sleep(30);
      document.querySelector('.tp-act .tp-btn.pri').click(); await TH.sleep(80);
      const win = document.querySelector('.wm-win[data-organism="eravos.groove-gen"]'); assert.ok(win, 'now on the canvas');
      const id = win.dataset.instance; assert.equal(OrganismFactory.handle(id).ctx.params.get('_motion')[0].key, 'swing', 'what you set on the page came along');
      assert.ok(!win.querySelector('.mo-tabs'), 'the window has no tabs of its own: it is the tool');
      OrganismFactory.close(id);
    } finally { ToolPage.close(); }
    await TH.sleep(30); assert.equal(Kernel.registry.list().length, before, 'closing the page leaves nothing behind');
  });
});
