/* P112 · the piano roll as its own window, and Connect edges (3.112) — asked: "I want to be able to select notes and right click and
 * have a connect edges in the context menu. Also make the piano roll popout its own window. It's badly implimented." */
window.__phase = 'P112';
describe('P112 · piano roll: Connect edges · its own window', () => {
  function host() { const h = document.getElementById('wmhost'); if (!CanvasWM.world) { CanvasWM.init(h, Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); } Kernel.audio.boot(); }
  async function make(notes) {
    host(); const id = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1300, h: 600 }), pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl);
    await TH.sleep(150); pub('lane_add', { kind: 'inst', name: 'Lead' }); await TH.sleep(60);
    pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes }); await TH.sleep(80);
    const H = OrganismFactory.handle(id), clip = H.ctx.internals.clips.find(c => c.kind === 'notes');
    H.view.openClip(clip.id); await TH.sleep(250);
    return { id, H, pub, roll: H.view.roll, clip: () => H.ctx.internals.clips.find(c => c.id === clip.id), panel: () => document.querySelector(`.wm-panel[data-owner="${id}"]`) };
  }
  it('right-click on selected notes: the menu offers Connect edges; it makes one note gliding through each pitch, its edges meeting', async () => {
    const t = await make([{ s: 0, l: 4, n: 60, v: 0.8 }, { s: 4, l: 4, n: 64, v: 0.8 }, { s: 10, l: 2, n: 67, v: 0.6 }]);
    try {
      t.roll.select([0, 1, 2]);
      const cv = t.roll.canvas, r = cv.getBoundingClientRect();
      cv.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, button: 2, buttons: 2, clientX: r.left + 30, clientY: r.top + 30, pointerId: 1 }));
      await TH.sleep(10);
      const menu = document.querySelector('.cm'); assert.ok(menu, 'a menu opens'); assert.ok(/3 notes/.test(menu.textContent), 'for the 3 selected notes');
      const item = Array.from(menu.querySelectorAll('.cm-item')).find(b => /Connect edges/.test(b.textContent)); assert.ok(item && !item.disabled, 'Connect edges is in it');
      item.click(); await TH.sleep(60);
      const ns = t.roll.state.notes; assert.equal(ns.length, 1, 'one note now');
      const one = ns[0]; assert.equal(one.s, 0); assert.equal(one.l, 12, 'from the first start to the last end'); assert.equal(one.n, 60);
      assert.ok(one.b && one.b.shape === 'path', 'it glides along a path');
      const at = (t0) => { const p = one.b.path; for (let i = 1; i < p.length; i++) if (p[i][0] >= t0) { const a = p[i - 1], b = p[i]; return a[1] + (b[1] - a[1]) * (t0 - a[0]) / ((b[0] - a[0]) || 1); } return p[p.length - 1][1]; };
      assert.near(at(1 / 12), 0, 0.01, 'at the first note: its own pitch'); assert.near(at(6 / 12), 4, 0.01, 'at the second: +4'); assert.near(at(11 / 12), 7, 0.01, 'at the third: +7');
      assert.ok(at(9 / 12) > 4 && at(9 / 12) < 7, 'across the gap it slides');
      assert.equal(t.clip().notes.length, 1, 'and the clip has it');
    } finally { if (window.ContextMenu) ContextMenu.close(); OrganismFactory.close(t.id); }
  });
  it('one note cannot connect, and it says why', async () => {
    const t = await make([{ s: 0, l: 4, n: 60, v: 0.8 }]);
    try {
      t.roll.select([0]); t.roll.connectEdges(); assert.equal(t.roll.state.notes.length, 1, 'one note stays one note');
      assert.ok(/two or more/.test(t.roll.el.textContent), 'and it says why');
    } finally { OrganismFactory.close(t.id); }
  });
  it('its own window by default: under the Timeline (never over it), with a title bar; the Timeline gives the room back', async () => {
    const t = await make([{ s: 0, l: 4, n: 69, v: 0.8 }]);
    try {
      await TH.sleep(250);
      const p = t.panel(), w = CanvasWM.windowOf(t.id); assert.ok(p, 'the roll is its own window');
      const pr = p.getBoundingClientRect(), wr = w.getBoundingClientRect();
      assert.ok(pr.top >= wr.bottom - 1, `under the Timeline, not over it (${Math.round(pr.top)} ≥ ${Math.round(wr.bottom)})`);
      const strip = p.querySelector('.wm-pstrip'); assert.ok(strip.offsetHeight >= 26 && /piano roll/i.test(strip.textContent), 'a title bar that reads as a window');
      assert.ok(w.offsetHeight < 600, 'the Timeline shrank to its tracks: ' + w.offsetHeight);
    } finally { OrganismFactory.close(t.id); }
  });
});
