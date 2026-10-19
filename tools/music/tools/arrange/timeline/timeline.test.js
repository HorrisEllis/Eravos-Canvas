/* Timeline (eravos.timeline) — tests that travel with the tool. The contract is shared (tests/harness.js
 * TH.toolContract): spawns clean, every shipped preset loads in range, save → load is exact, closing leaves nothing behind,
 * Stop all is obeyed. Add this tool's own tests below it. */
TH.toolContract('eravos.timeline');

// 3.48 piano roll precision (timeline.spec § 3.48 P1–P2): real pointer events on a real roll, at canvas zoom 1 and 0.6
describe('tool · Timeline — piano roll precision (3.48)', () => {
  const HI = 107;
  function roll(o) {
    o = o || {};
    const log = [], view = { ui: UIKit, emit: (k, p) => log.push([k, p]) };
    const host = document.createElement('div'); host.style.cssText = `position:fixed;left:0;top:0;width:900px;height:420px;transform-origin:0 0;transform:scale(${o.z || 1});z-index:99999;background:#000`;
    document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el);
    const clip = { id: 'c1', bars: 2, startBar: 3, notes: o.notes || [] };
    pr.show(clip, { id: 'l1', name: 'Lead', color: '#ff66cc' }, { key: { root: 0, scale: 'minor' } });
    const cv = pr.canvas;
    // client point of (step, midi) — through the window's zoom, like a hand
    const pt = (s, n, dx) => { const r = cv.getBoundingClientRect(), st = pr.state, k = r.width / cv.offsetWidth; return { clientX: r.left + (s * st.pps + (dx || 0)) * k, clientY: r.top + ((HI - n) * st.row + st.row / 2) * k }; };
    const fire = (type, p, extra) => cv.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1 }, p, extra || {})));
    const click = (s, n, extra, wobble) => { fire('pointerdown', pt(s, n), extra); if (wobble) fire('pointermove', pt(s, n, wobble), extra); fire('pointerup', pt(s, n, wobble || 0), extra); };
    const dragTo = (a, b, extra) => { fire('pointerdown', pt(a[0], a[1], a[2]), extra); for (let i = 1; i <= 6; i++) fire('pointermove', pt(a[0] + (b[0] - a[0]) * i / 6, a[1], (a[2] || 0) + ((b[2] || 0) - (a[2] || 0)) * i / 6), extra); fire('pointerup', pt(b[0], b[1], b[2]), extra); };
    const done = () => host.remove();
    return { pr, log, pt, fire, click, dragTo, done, notes: () => pr.state.notes, edits: () => log.filter(x => x[0] === 'clip_edit').length };
  }

  [1, 0.6].forEach(z => it(`a click with a 3 px wobble lands exactly on the ghost's cell (canvas zoom ${z})`, () => {
    const r = roll({ z });
    try {
      r.fire('pointermove', r.pt(4.6, 60), { buttons: 0 });           // hover: the ghost shows cell 4
      r.click(4.6, 60, {}, 3);
      assert.equal(r.notes().length, 1); assert.equal(r.notes()[0].s, 4, 'cell 4, not 5'); assert.equal(r.notes()[0].n, 60);
      assert.equal(r.notes()[0].l, 4, 'the default length (a beat)');
    } finally { r.done(); }
  }));
  it('the old drift is gone: sliding inside the clicked cell and row (past the dead zone) never moves the note', () => {
    const r = roll();
    try {
      r.pr.zoomTo(8);                                                    // S zoom: a 1/16 cell is 8 px, a row 11 px
      const st = r.pr.state, p0 = r.pt(4.1, 60); p0.clientY -= st.row * 0.4;   // near the top-left of cell 4 / row C4
      const p1 = { clientX: p0.clientX + 0.8 * st.pps, clientY: p0.clientY + st.row * 0.75 };   // 6.4 px right, 8 px down: same cell, same row
      r.fire('pointerdown', p0); r.fire('pointermove', p1); r.fire('pointerup', p1);
      assert.deepEqual([r.notes()[0].s, r.notes()[0].n], [4, 60], 'was moved to step 5 and B3 by round(distance)');
      // a real drag still moves it, cell by cell
      r.dragTo([4.5, 60], [7.5, 60]); assert.equal(r.notes()[0].s, 7, 'dragged three cells');
    } finally { r.done(); }
  });
  it('paint across 8 cells at 1/16 adds 8 notes, one per cell, in one undo step', () => {
    const r = roll();
    try { r.pr.setTool('paint'); r.dragTo([0.5, 60], [7.5, 60]); const ns = r.notes();
      assert.deepEqual(ns.map(n => n.s), [0, 1, 2, 3, 4, 5, 6, 7]); assert.ok(ns.every(n => n.l === 1 && n.n === 60)); assert.equal(r.edits(), 1, 'one commit'); }
    finally { r.done(); }
  });
  it('erase drag removes exactly the notes it crosses', () => {
    const r = roll({ notes: [0, 2, 4, 6].map(s => ({ s, l: 1, n: 60, v: 0.8 })).concat([{ s: 2, l: 1, n: 63, v: 0.8 }]) });
    try { r.pr.setTool('erase'); r.dragTo([1.5, 60], [4.5, 60]);
      assert.deepEqual(r.notes().map(n => n.s + ':' + n.n).sort(), ['0:60', '2:63', '6:60']); }
    finally { r.done(); }
  });
  it('triplet grid places on thirds exactly; Alt places freely', () => {
    const r = roll();
    try {
      r.pr.setGrid('16t'); r.click(1.0, 60); const s = r.notes()[0].s; assert.lt(Math.abs(s - 2 / 3), 1e-9, 'cell 2/3'); assert.equal(Math.round(s * 192), s * 192, 'exact at the engine resolution');
      r.pr.setGrid('1'); r.click(4.6, 63, { altKey: true }); assert.equal(r.notes()[1].s, 4.5, 'free: 1/128-note cells');
    } finally { r.done(); }
  });
  it('stretch from the left edge keeps the end; the next note takes that length', () => {
    const r = roll({ notes: [{ s: 4, l: 4, n: 60, v: 0.8 }] });
    try {
      r.dragTo([4, 60, 1], [2, 60, 1]);
      assert.deepEqual([r.notes()[0].s, r.notes()[0].l], [2, 6], 'start 2, end still 8');
      r.click(12.2, 63); assert.equal(r.notes()[1].l, 6 > 32 - 12 ? 20 : 6, 'last length');
      r.dragTo([12, 63, 6 * r.pr.state.pps - 2], [15, 63, 0]); assert.equal(r.notes()[1].l, 3, 'right edge: end at 15');
    } finally { r.done(); }
  });
  it('split cuts a note at the grid line; the ruler moves the playhead to song time', () => {
    const r = roll({ notes: [{ s: 0, l: 8, n: 60, v: 0.8 }] });
    try {
      r.pr.setTool('split'); r.click(3.2, 60);
      assert.deepEqual(r.notes().map(n => [n.s, n.l]), [[0, 3], [3, 5]]);
      const rr = r.pr.ruler.getBoundingClientRect(), k = rr.width / r.pr.ruler.offsetWidth;
      r.pr.ruler.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 2, clientX: rr.left + 16 * r.pr.state.pps * k + 1, clientY: rr.top + 5, buttons: 1 }));
      const seek = r.log.filter(x => x[0] === 'seek').pop(); assert.ok(seek, 'seek sent'); assert.equal(seek[1].bar, 4, 'step 16 of a clip at bar 3 = bar 4');
    } finally { r.done(); }
  });
});
