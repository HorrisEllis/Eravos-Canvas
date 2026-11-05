/* P113 · the piano roll, easier — his words, 2026-11-05: "make it easier" → the toolbar preview: "yes, and i dont like the fill options,
 * replace it with pattern selection. also easier to manipulate notes, like size and moving."
 *   · one row of everyday controls; More ▾ holds the rest (remembered)
 *   · Pattern: the track's patterns; picking one makes the clip's notes (repeated to its length); Ctrl+Z undoes (the Timeline's undo)
 *   · a note's ends grab over 6–12 px; a short note's right half sizes it; Ctrl+←/→ sizes the selection by a grid step */
window.__phase = 'P113';
describe('P113 · piano roll: one row, patterns, easier sizing', () => {
  const HI = 107;
  function roll(notes) {
    const log = [], view = { ui: UIKit, emit: (k, p) => log.push([k, p]) };
    const host = document.createElement('div'); host.style.cssText = 'position:fixed;left:0;top:0;width:1100px;height:460px;z-index:99999;background:#000';
    document.body.appendChild(host);
    const pr = EravosTimelinePianoRoll.create(view, {}); host.appendChild(pr.el);
    pr.show({ id: 'c1', bars: 2, startBar: 1, notes: notes || [] }, { id: 'l1', name: 'Lead', color: '#ff66cc', target: 'eravos.supersaw' }, { key: { root: 9, scale: 'minor' } });
    const cv = pr.canvas, pt = (s, n, dx) => { const r = cv.getBoundingClientRect(), st = pr.state, k = r.width / cv.offsetWidth; return { clientX: r.left + (s * st.pps + (dx || 0)) * k, clientY: r.top + ((HI - n) * st.row + st.row / 2) * k }; };
    const fire = (type, p) => cv.dispatchEvent(new PointerEvent(type, Object.assign({ bubbles: true, cancelable: true, pointerId: 1, pointerType: 'mouse', button: 0, buttons: type === 'pointerup' ? 0 : 1 }, p)));
    return { pr, log, cv, pt, fire, done: () => host.remove(), notes: () => pr.state.notes };
  }
  it('one row; More ▾ shows the rest and is kept with the Timeline; no Fill row', () => {
    const r = roll();
    try {
      const more = r.pr.el.querySelector('.tlpr-more'); assert.ok(more && more.hidden, 'More is closed at first');
      assert.ok(!/✦ Fill/.test(r.pr.el.textContent), 'the Fill row is gone');
      const btn = [...r.pr.el.querySelectorAll('.tlpr-bar button')].find(b => /More/.test(b.textContent)); btn.click();
      assert.ok(!more.hidden, 'More opens'); const cc = r.log.filter(x => x[0] === 'config_change').pop(); assert.ok(cc && cc[1].key === 'rollMore' && cc[1].value === true, 'kept with the Timeline (rollMore)');
      assert.ok(/Length/.test(more.textContent) && /Quantize/.test(more.textContent), 'the rest is in it'); btn.click(); assert.ok(more.hidden);
    } finally { r.done(); }
  });
  it('Pattern: the track’s patterns; picking one fills the clip (repeated to its length), in the key', () => {
    const r = roll([{ s: 0, l: 4, n: 60, v: 0.8 }]);
    try {
      const sel = [...r.pr.el.querySelectorAll('.tlpr-bar select')].find(s => /pick/.test(s.options[0] && s.options[0].textContent));
      assert.ok(sel, 'a Pattern picker'); assert.gt(sel.options.length, 3, 'with patterns for this track');
      sel.value = '1'; sel.dispatchEvent(new Event('change', { bubbles: true }));
      const out = r.log.filter(x => x[0] === 'clip_edit').pop(); assert.ok(out, 'it became the clip’s notes'); const ns = out[1].patch.notes;
      assert.gt(ns.length, 1); assert.ok(ns.every(n => n.s >= 0 && n.s + n.l <= 32 + 1e-6), 'inside the clip'); assert.equal(sel.value, '', 'the picker is ready again');
    } finally { r.done(); }
  });
  it('sizing: a wide note’s end grabs 10 px in; a short note’s right half sizes it; Ctrl+→ / Ctrl+← size the selection', () => {
    const r = roll([{ s: 0, l: 8, n: 69, v: 0.8 }, { s: 12, l: 1, n: 72, v: 0.8 }]);
    try {
      r.pr.setGrid('1'); const pps = r.pr.state.pps;
      // grab the wide note 8 px inside its right end and drag 2 steps right
      r.fire('pointerdown', r.pt(8, 69, -8)); for (let i = 1; i <= 6; i++) r.fire('pointermove', r.pt(8, 69, -8 + i * pps * 2 / 6)); r.fire('pointerup', r.pt(10, 69, -8));
      assert.near(r.notes()[0].l, 10, 0.01, 'sized from 8 px in (was only 4 px)'); assert.equal(r.notes()[0].s, 0, 'not moved');
      // the short note: its right half sizes it
      r.fire('pointerdown', r.pt(12, 72, pps * 0.75)); for (let i = 1; i <= 6; i++) r.fire('pointermove', r.pt(12, 72, pps * 0.75 + i * pps * 3 / 6)); r.fire('pointerup', r.pt(15, 72, pps * 0.75));
      assert.near(r.notes()[1].l, 4, 0.01, 'a 1-step note sized by its right half'); assert.equal(r.notes()[1].s, 12);
      // keys: select the first, Ctrl+→ twice, Ctrl+← once
      r.fire('pointerdown', r.pt(2, 69)); r.fire('pointerup', r.pt(2, 69)); document.querySelectorAll('.tlpr-edit.open').forEach(e => e.classList.remove('open'));
      const key = (k, o) => r.cv.dispatchEvent(new KeyboardEvent('keydown', Object.assign({ key: k, bubbles: true, cancelable: true }, o)));
      const l0 = r.notes()[0].l; key('ArrowRight', { ctrlKey: true }); key('ArrowRight', { ctrlKey: true }); key('ArrowLeft', { ctrlKey: true });
      assert.near(r.notes()[0].l, l0 + 1, 0.01, 'Ctrl+→ ×2, Ctrl+← ×1 = one step longer'); assert.equal(r.notes()[0].s, 0, 'its start stays');
    } finally { r.done(); }
  });
});
