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
