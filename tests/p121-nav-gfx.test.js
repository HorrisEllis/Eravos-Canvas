/* P121 · WASD moves the view; Settings › Graphics (3.121) — asked: "wasd to navigate. Hold middle mouse and drag to move. Having major
 * performance issues … maybe add a graphic settings for low end hardware." */
window.__phase = 'P121';
describe('P121 · WASD · graphics levels', () => {
  it('W A S D move the view while held, not while typing', async () => {
    const hst = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(hst, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    const v0 = Object.assign({}, CanvasWM.view);
    try {
      document.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyD', key: 'd', bubbles: true })); await TH.sleep(150);
      document.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyD', key: 'd', bubbles: true }));
      assert.ok(CanvasWM.view.x < v0.x - 20, 'D moves the view to the right (the canvas slides left): ' + (CanvasWM.view.x - v0.x));
      const inp = document.createElement('input'); document.body.appendChild(inp); inp.focus(); const x1 = CanvasWM.view.x;
      inp.dispatchEvent(new KeyboardEvent('keydown', { code: 'KeyA', key: 'a', bubbles: true })); await TH.sleep(120);
      inp.dispatchEvent(new KeyboardEvent('keyup', { code: 'KeyA', key: 'a', bubbles: true })); inp.remove();
      assert.equal(CanvasWM.view.x, x1, 'typing an "a" does not move it');
    } finally { CanvasWM.view = v0; CanvasWM.applyView(); }
  });
  it('Graphics: Low draws displays at most 15 times a second (High as before), and turns blur off', async () => {
    const R = document.documentElement, was = R.dataset.gfx; let n = 0;
    const el = document.createElement('div'); document.body.appendChild(el); const stop = UIKit.loop(el, () => { n++; });
    try {
      CanvasPrefs.setGfx('high'); n = 0; await TH.sleep(500); const hi = n;
      CanvasPrefs.setGfx('low'); n = 0; await TH.sleep(500); const lo = n;
      assert.ok(lo <= 9 && hi > lo * 2, `high ${hi} redraws / 0.5 s, low ${lo}`);
      const d = document.createElement('div'); d.style.backdropFilter = 'blur(6px)'; document.body.appendChild(d);
      assert.ok(!/blur/.test(getComputedStyle(d).backdropFilter || ''), 'no blur on Low'); d.remove();
    } finally { stop(); el.remove(); CanvasPrefs.setGfx(was || 'high'); }
  });
});
describe('P122 · a suite plays from the Timeline', () => {
  it('the suite window takes notes and plays its voices (not its drums, bassline or chords); the Timeline offers it as an instrument', async () => {
    const U = TH.universe(0.3, { bpm: 140 }), K = U.K, hub = Suites.open('music.wobble-suite', { K }); Suites.build(K, hub);
    const got = new Map(); K.bus.subscribe('note:trigger', (p) => { if (p.target !== hub) got.set(p.target, (got.get(p.target) || 0) + 1); });
    K.bus.publish('note:trigger', { target: hub, note: 40, velocity: 0.9, time: 0.05, duration: 0.3 });
    const tool = (id) => K.registry.get(id) && K.registry.get(id).organism_id;
    const heard = Array.from(got.keys()).map(tool).sort();
    assert.ok(heard.includes('eravos.wobble-bass') && heard.includes('eravos.bass-forge') && heard.includes('eravos.sub-engine'), 'the voices play: ' + heard.join(', '));
    ['eravos.drum-forge', 'eravos.bass-gen', 'eravos.groove-gen', 'eravos.chord-gen'].forEach(t => assert.ok(!heard.includes(t), t + ' does not'));
    const tl = OrganismFactory.spawn('eravos.timeline', { K, headless: true }), v = OrganismFactory.handle(tl);
    const inst = (id) => Array.from(K.registry.get(id).hooks.values()).some(hk => hk.direction === 'in' && hk.event_type === 'note:trigger');
    assert.ok(inst(hub), 'a suite counts as an instrument for the Timeline');
  });
});
describe('P122b · slide across the keys', () => {
  it('holding and sliding across a tool keyboard plays each key it reaches, letting the last one go', () => {
    const ons = [], offs = []; const kb = UIKit.Keyboard({ low: 60, high: 72, lock: false, onDown: (n) => ons.push(n), onUp: (n) => offs.push(n) });
    document.body.appendChild(kb.el); kb.el.style.cssText = 'position:fixed;left:0;top:0;width:520px;height:80px;z-index:99999';
    try {
      const keyOf = (n) => kb.el.querySelector('[data-n="' + n + '"]'), at = (n) => { const r = keyOf(n).getBoundingClientRect(); return { clientX: r.left + r.width / 2, clientY: r.bottom - 6 }; };
      keyOf(60).dispatchEvent(new PointerEvent('pointerdown', Object.assign({ bubbles: true, pointerId: 7, button: 0, buttons: 1 }, at(60))));
      [62, 64, 65].forEach(n => keyOf(n).dispatchEvent(new PointerEvent('pointermove', Object.assign({ bubbles: true, pointerId: 7, buttons: 1 }, at(n)))));
      kb.el.dispatchEvent(new PointerEvent('pointerup', Object.assign({ bubbles: true, pointerId: 7 }, at(65))));
      assert.deepEqual(ons, [60, 62, 64, 65], 'each key slid onto plays'); assert.deepEqual(offs, [60, 62, 64, 65], 'and each lets go');
    } finally { kb.el.remove(); }
  });
});
