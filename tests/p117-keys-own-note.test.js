/* P117 · every piano key plays its own note — his words, 2026-11-06: "Move along the piano to change the keys, each key needs to play
 * its relative note." With the key lock on (the default), a key outside the key used to snap to a neighbour: F# played F, so a slide
 * across every key repeated or skipped notes. Now each key plays itself; keys outside the key stay shaded. */
window.__phase = 'P117';
describe('P117 · each key plays its own note', () => {
  it('a slide across every key (in and out of the key, lock on) plays each one, once, in order', () => {
    const ons = []; const kb = UIKit.Keyboard({ low: 57, high: 69, key: { root: 9, scale: 'minor' }, onDown: (n) => ons.push(n), onUp: () => {} });
    document.body.appendChild(kb.el); kb.el.style.cssText = 'position:fixed;left:0;top:0;width:520px;height:80px;z-index:99999';
    try {
      const keyOf = (n) => kb.el.querySelector('[data-n="' + n + '"]');
      const at = (n) => { const k = keyOf(n), r = k.getBoundingClientRect(); return { clientX: r.left + r.width / 2, clientY: r.top + r.height * (k.classList.contains('b') ? 0.35 : 0.9) }; };
      assert.ok(keyOf(58).classList.contains('out'), 'A# is outside A minor and shaded');
      keyOf(57).dispatchEvent(new PointerEvent('pointerdown', Object.assign({ bubbles: true, cancelable: true, pointerId: 9, buttons: 1 }, at(57))));
      for (let n = 58; n <= 69; n++) kb.el.dispatchEvent(new PointerEvent('pointermove', Object.assign({ bubbles: true, pointerId: 9, buttons: 1 }, at(n))));
      kb.el.dispatchEvent(new PointerEvent('pointerup', Object.assign({ bubbles: true, pointerId: 9 }, at(69))));
      assert.deepEqual(ons, [57, 58, 59, 60, 61, 62, 63, 64, 65, 66, 67, 68, 69], 'all 13 keys, each its own note');
    } finally { kb.el.remove(); }
  });
});
