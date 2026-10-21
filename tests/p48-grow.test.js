/* P48.7 · windows that grow — what is inside follows the window's size; first: a keyboard that grows to all 88 keys.
 * spec eravos.phase48-map P48.7 · James, 2026-10-21: "make it so the tools expand when resized, like that way it can expand to
 * capture the full range of piano keys" */
window.__phase = 'P48';
describe('P48.7 · windows that grow — the keyboard', () => {
  const F = () => OrganismFactory;
  const whites = (a, b) => { let n = 0; for (let k = a; k <= b; k++) if ([0, 2, 4, 5, 7, 9, 11].includes(k % 12)) n++; return n; };
  it('keyRange: its own range is the floor; wider adds white keys below and above in turn; 88 keys at most', () => {
    const r = UIKit.keyRange;
    assert.deepEqual(r(24, 48, 100), [24, 48], 'narrow → its own range (C1–C3), never fewer');
    const [a, b] = r(24, 48, 24 * 22); assert.equal(whites(a, b), 22, '22 whites fit → 22 shown'); assert.ok(a < 24 && b > 48, 'grew both ways');
    const [m, n] = r(48, 72, 24 * 25); assert.ok(Math.abs(whites(m, 47) - whites(73, n)) <= 1, `C3–C5 stays in the middle: ${whites(m, 47)} white keys below, ${whites(73, n)} above`);
    assert.equal(whites(a, 23), 2, 'C1–C3 has only A0 and B0 below it, so the rest grows upward');
    assert.deepEqual(r(24, 48, 5000), [21, 108], 'wide → the whole piano, A0–C8');
    assert.equal(whites(21, 108), 52);
    const [c] = r(21, 40, 24 * 30); assert.equal(c, 21, 'at the bottom it grows upward only');
  });
  it('a tool window grows its keys when resized wider, gives them back when narrower, and the keys still play', async () => {
    if (!CanvasWM.world) { CanvasWM.init(document.getElementById('wmhost'), Kernel); WireSystem.init(Kernel); OrganismFactory.boot(Kernel); }
    const K = Kernel, id = F().spawn('eravos.wub-osc', { K, x: 20, y: 20 }); await TH.sleep(30);
    const frames = async () => { for (let i = 0; i < 4; i++) await new Promise(r => requestAnimationFrame(r)); };
    try {
      const win = CanvasWM.windowOf(id), kb = () => win.querySelector('.uk-keys'), count = () => kb().querySelectorAll('.uk-key').length;
      win.style.width = '400px'; await frames();
      assert.equal(kb().dataset.range, '24-48', 'at 400 px: its own two octaves'); const small = count();
      win.style.width = '1400px'; await frames();
      assert.equal(kb().dataset.range, '21-108', 'at 1400 px: all 88 keys'); assert.equal(count(), 88);
      assert.ok(kb().classList.contains('grown') && Array.from(kb().querySelectorAll('.uk-key span')).some(s => s.textContent === 'C4'), 'grown: the Cs carry their octave');
      // a key that was not there before plays
      const played = []; const off = K.bus.subscribe('ui:audition:' + id, (p) => played.push(p.note), 'test');
      const k = kb().querySelector('.uk-key[data-n="96"]'); k.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, cancelable: true, pointerId: 3 }));
      kb().dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 3 })); off && off();
      assert.ok(played.length === 1 && Math.abs(played[0] - 96) <= 1, 'C7 (new) plays, in key: ' + played[0]);
      win.style.width = '400px'; await frames();
      assert.equal(count(), small, 'narrow again → back to its own range');
    } finally { F().close(id); }
  });
  it('every keyboard tool grows (all of them draw through UI.Keyboard); grow:false keeps a fixed range', () => {
    const fixed = UIKit.Keyboard({ low: 48, high: 72, grow: false }); assert.equal(fixed.setWidth ? fixed.range().join('-') : '', '48-72');
    const g = UIKit.Keyboard({ low: 48, high: 72 }); g.setWidth(24 * 52); assert.deepEqual(g.range(), [21, 108]); g.setWidth(10); assert.deepEqual(g.range(), [48, 72]);
  });
});
