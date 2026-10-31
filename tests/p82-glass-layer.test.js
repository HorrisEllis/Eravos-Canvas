/* 3.82 — James, 2026-10-31: "move to main. get to step 2" — a Looking Glass layer inside the canvas (specs/eravos.2026-10-22-brainstorm.
 * map.spec, addendum 2026-10-31). Reactive colours drawn on it: nothing on the page is written while it plays. */
window.__phase = 'P82';
describe('🔮 Glass layer: Looking Glass inside the canvas (3.82)', () => {
  const GLy = () => window.GlassLayer;
  it('typed data, variables, layers made on first use and removed when empty; values ease; at rest it stops asking for frames', async () => {
    await GLy().ready; const L = GLy().layer('t-a', { depth: 7 });
    assert.ok(!L.el.isConnected, 'no canvas until something is on it'); GLy().vars.set('t.amt', 0.8);
    L.set('g', { type: 'glow', rect: [20, 20, 120, 60], color: '#ff2266', intensity: { var: 't.amt' } }); assert.ok(L.el.isConnected && GLy().has('t-a'));
    let t = 1000; GLy().frame(t); const first = L.items.get('g').now.amt; assert.ok(first > 0 && first < 0.8, 'eases toward 0.8, not a jump: ' + first);
    for (let i = 0; i < 30; i++) GLy().frame(t += 16); assert.ok(Math.abs(L.items.get('g').now.amt - 0.8) < 0.01, 'arrives');
    GLy().vars.set('t.amt', 0); for (let i = 0; i < 40; i++) GLy().frame(t += 16);
    assert.equal(L.items.get('g').now.amt, 0); assert.equal(GLy().stats().running, false, 'nothing lit: no frames asked for');
    L.remove('g'); assert.ok(!GLy().has('t-a') && !L.el.isConnected, 'empty layer removed');
  });
  it('the 2D renderer draws a glow where its element is and nothing elsewhere; a wash tints the whole layer', async () => {
    await GLy().use('2d'); const L = GLy().layer('t-b', { depth: 7 });
    L.set('g', { type: 'glow', rect: [100, 100, 200, 100], color: '#00ff88', intensity: 1, spread: 16 }); let t = 5000; for (let i = 0; i < 30; i++) GLy().frame(t += 16);
    const g = L.el.getContext('2d'), dpr = L.dpr, a = (x, y) => g.getImageData(Math.round(x * dpr), Math.round(y * dpr), 1, 1).data[3];
    assert.gt(a(100, 150), 100, 'the rim is lit'); assert.gt(a(92, 150), 10, 'a halo outside it'); assert.equal(a(400, 400), 0, 'nothing far away');
    L.set('w', { type: 'wash', color: '#2255ff', alpha: 0.2 }); for (let i = 0; i < 30; i++) GLy().frame(t += 16); assert.gt(a(400, 400), 20, 'the wash covers the layer');
    L.clear(); assert.ok(!GLy().has('t-b'));
  });
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  it('Draw with GPU layer: the drums glow on the layer in their colour, and nothing on the page is written while they play', async () => {
    host(); const K = Kernel; await K.audio.ctx.resume(); SoundCSS.init(K); const was = [SoundCSS.mode, SoundCSS.draw];
    SoundCSS.setMode('static'); SoundCSS.setDraw('glass'); await GLy().use('2d');
    const pads = OrganismFactory.spawn('eravos.pads', { x: 40, y: 40 }); await TH.sleep(40); const w = CanvasWM.windowOf(pads);
    let writes = 0; // a colour or a level written by the reactive colours (a tool's own animation, like a pad's --hit flash, is the tool's, not this)
    const vars = (st) => { const o = {}; String(st || '').split(';').forEach(d => { const i = d.indexOf(':'); if (i > 0) o[d.slice(0, i).trim()] = d.slice(i + 1).trim(); }); return o; };
    const ours = (k, v) => /^--(snd-|tool-level|win-shift|lvl)/.test(k) || /^#[0-9a-f]{3,8}$|^rgba?\(/i.test(v || '');
    const seen = []; const mo = new MutationObserver(ms => ms.forEach(m => { const o = vars(m.oldValue), n = vars(m.target.getAttribute('style'));
      const ch = Object.keys(Object.assign({}, o, n)).filter(k => o[k] !== n[k] && (ours(k, o[k]) || ours(k, n[k]))); if (ch.length) { writes++; seen.push((m.target.className || m.target.tagName) + ': ' + ch.join(',')); } }));
    try {
      mo.observe(document.documentElement, { attributes: true, attributeFilter: ['style'], attributeOldValue: true }); mo.observe(w, { attributes: true, attributeFilter: ['style'], subtree: true, attributeOldValue: true });
      for (let i = 0; i < 14; i++) { K.bus.publish('note:trigger', { target: pads, note: 36, velocity: 1, time: K.audio.ctx.currentTime + 0.01, duration: 0.2 }); await TH.sleep(40); SoundCSS.step(); }
      await TH.sleep(0); mo.disconnect();
      assert.equal(writes, 0, 'no style written on the page or in the window: ' + seen.join(' | '));
      const L = GLy().layer('reactive'), e = L.items.get('win:' + pads); assert.ok(e, 'the drums have a glow'); assert.gt(e.def.intensity, 0.1, 'lit by their own sound');
      assert.equal(e.def.anchor, w, 'placed on their window'); assert.ok(L.items.has('mix'), 'and the mix wash');
      SoundCSS.setDraw('page'); assert.ok(!GLy().has('reactive'), 'Page: the layer is gone');
      SoundCSS.setDraw('glass'); SoundCSS.setMode('off'); assert.ok(!GLy().has('reactive'), 'Off: nothing on the layer');
    } finally { mo.disconnect(); OrganismFactory.close(pads); SoundCSS.setMode(was[0] === 'off' ? 'static' : was[0]); SoundCSS.setDraw(was[1]); }
  });
  it('the canvas file stays domain-free and its WGSL is the shader the native Looking Glass can take', () => {
    const src = window.__SOURCES && window.__SOURCES.skeleton && window.__SOURCES.skeleton['canvas/runtime/glass-layer.js'];
    if (src) ['audio', 'music', 'synth', 'drum', 'song'].forEach(t => assert.ok(!new RegExp('\\b' + t + '\\b', 'i').test(src), 'no "' + t + '"'));
    assert.ok(/@vertex fn vs/.test(GLy().WGSL) && /@fragment fn fs/.test(GLy().WGSL), 'vertex and fragment entry points');
  });
});
