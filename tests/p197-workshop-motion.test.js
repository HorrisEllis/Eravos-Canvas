/* P197 — the Workshop opens and closes with the Field's motion (tools/core/field/motion.js; his words, 2026-11-20: "I like that. But do that with
 * the workshop as well. It's supposed to be the same thing"). With motion on: its panels start where he pressed and land in their places, the
 * viewport blooms last; close() is immediate for every caller (gone from .ws-app, onClose heard) while a copy flies home and is then removed.
 * One motion, shared with the Field board (never copied). */
window.__phase = 'P197';
describe('P197 the Workshop opens and closes like the Field', () => {
  const SQUARE = { id: 'test.square197', label: 'Square', layers: (d) => [{ id: 'size', group: 'SHAPE', type: 'value', label: 'Size', sub: d.size + ' px', fields: [{ key: 'size', label: 'Size', type: 'number', min: 1, max: 200, step: 1 }] }],
    get: (d, k) => d[k], set: (d, k, v) => Object.assign({}, d, { [k]: v }), draw: (g, W, H, d) => { g.fillStyle = '#00d4ff'; g.fillRect(10, 10, d.size, d.size); }, status: (d) => [['SIZE', d.size]] };
  it('assembled out of what he pressed; closing is immediate for code while it flies home', async () => {
    assert.ok(window.FieldMotion && FieldMotion.enterApp && FieldMotion.leaveApp, 'one shared motion');
    if (!Workshop.kinds().includes(SQUARE.id)) assert.ok(Workshop.addKind(SQUARE).ok, 'a kind');
    const was = window.ERAVOS_NO_MOTION; window.ERAVOS_NO_MOTION = false;
    const btn = document.createElement('button'); btn.textContent = 'open'; btn.style.cssText = 'position:fixed;left:40px;top:500px;width:60px;height:24px;z-index:1'; document.body.appendChild(btn);
    let closed = null;
    try {
      const ws = Workshop.open(SQUARE.id, { size: 20 }, { from: btn, onClose: (d) => { closed = d; } }), root = ws.el;
      const bar = root.querySelector('.ws-bar'), vp = root.querySelector('.ws-vp');
      const anims = root.getAnimations({ subtree: true });
      assert.ok(anims.length >= 6, 'its panels and the root are moving: ' + anims.length);
      anims.forEach(a => a.pause()); anims.forEach(a => { a.currentTime = 0; });
      const r0 = bar.getBoundingClientRect(), b = btn.getBoundingClientRect();
      assert.ok(Math.abs(r0.left - b.left) < 2 && Math.abs(r0.top - b.top) < 2, 'the bar starts where he pressed (' + Math.round(r0.left) + ',' + Math.round(r0.top) + ' vs ' + b.left + ',' + b.top + ')');
      assert.equal(+getComputedStyle(vp).opacity, 0, 'the viewport (its core) has not bloomed yet');
      anims.forEach(a => a.finish()); await TH.sleep(30);
      const r1 = bar.getBoundingClientRect(); assert.ok(Math.abs(r1.left) < 2 && Math.abs(r1.top) < 2, 'the bar landed in its place (top left)');
      assert.equal(+getComputedStyle(vp).opacity, 1, 'the viewport bloomed');
      ws.close();
      assert.ok(!document.querySelector('.ws-app') && !Workshop.current && closed && closed.size === 20, 'closed at once for every caller (gone from .ws-app, onClose heard)');
      assert.ok(root.isConnected && root.classList.contains('ws-out') && getComputedStyle(root).pointerEvents === 'none', 'a copy is flying home, untouchable');
      await TH.sleep(2200);
      assert.ok(!root.isConnected, 'and then it is gone');
    } finally { window.ERAVOS_NO_MOTION = was; btn.remove(); if (Workshop.current) Workshop.current.close(); document.querySelectorAll('.ws-out').forEach(e => e.remove()); }
  });
});
