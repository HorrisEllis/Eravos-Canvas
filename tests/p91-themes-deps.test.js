/* 3.91 — "please make those themes. and hook into the reactive. make all the buttons beautiful. make a themes section in the settings.
 * make a dependancy graph. also when clearing the canvas should remove all dependancies." */
window.__phase = 'P91';
describe('P91 · themes · the dependency graph · Clear takes the dependencies', () => {
  const R = document.documentElement;
  it('three themes; set() puts it on <html>, tells listeners, and each says how far the reactive colours may tint a surface', () => {
    const was = Themes.get(), seen = []; const on = (e) => seen.push(e.detail.id); window.addEventListener('eravos:theme', on);
    try {
      assert.deepEqual(Themes.list().map(t => t.id), ['dusk', 'studio', 'field', 'midnight']);
      const sc = {}; ['dusk', 'studio', 'midnight'].forEach(t => { Themes.set(t); assert.equal(R.dataset.theme, t); sc[t] = parseFloat(getComputedStyle(R).getPropertyValue('--react-surface')); });
      assert.deepEqual(seen, ['dusk', 'studio', 'midnight'], 'the reactive colours hear each switch');
      assert.ok(sc.dusk < 1 && sc.midnight < sc.dusk && sc.studio === 1, JSON.stringify(sc));
      assert.equal(Themes.set('nope'), false, 'an unknown theme is refused');
      Themes.set('dusk'); const btn = document.createElement('button'); btn.className = 'uk-btn'; document.body.appendChild(btn);
      assert.equal(getComputedStyle(btn).borderTopLeftRadius, '10px', 'Dusk: a soft rectangle, not a pill'); assert.ok(parseFloat(getComputedStyle(btn).borderTopWidth) >= 1, 'Dusk buttons keep their border'); btn.remove();
      const p = Themes.panel(); assert.equal(p.querySelectorAll('.thm-card').length, 4, 'the section: a card per theme');
    } finally { window.removeEventListener('eravos:theme', on); Themes.set(was === 'dusk' ? 'studio' : was); R.dataset.theme = 'studio'; }
  });
  it('the shell remembers what each part added: reset() takes every part, mode and key away; prune() keeps what the tools need; graph() draws it', () => {
    const K = Kernel, X = Expansion.create({ slot: (n) => document.getElementById('slot-' + n), brand() {}, boundKeys: () => Array.from(keys.keys()), bindKey: (c, f) => { keys.set(c, f); return true; }, unbindKey: (c) => keys.delete(c) }, K);
    const keys = new Map(), slot = document.createElement('div'); slot.id = 'slot-p89'; document.body.appendChild(slot);
    try {
      X.unit({ id: 'p89.base', label: 'Base', build(S) { slot.appendChild(document.createElement('i')); S.bindKey('KeyQ', () => {}); } });
      X.unit({ id: 'p89.top', label: 'Top', requires: ['p89.base'], build() { slot.appendChild(document.createElement('b')); } });
      X.unit({ id: 'p89.spare', label: 'Spare', build() { slot.appendChild(document.createElement('u')); } });
      X.mode({ id: 'p89.mode', label: 'P89', units: ['p89.top', 'p89.spare'] });
      X.enterMode('p89.mode'); assert.deepEqual(X.built().sort(), ['p89.base', 'p89.spare', 'p89.top']); assert.equal(slot.children.length, 3); assert.ok(keys.has('KeyQ'));
      const g = X.graph(); assert.deepEqual(g.modes.map(m => m.id), ['p89.mode']); assert.equal(g.units.find(u => u.id === 'p89.top').requires[0], 'p89.base');
      assert.deepEqual(X.prune('test').sort(), ['p89.base', 'p89.spare', 'p89.top'], 'no tool needs any of them'); assert.equal(slot.children.length, 0);
      X.enterMode('p89.mode'); const r = X.reset('test'); assert.equal(r.units.length, 3); assert.deepEqual(r.modes, ['p89.mode']);
      assert.equal(X.built().length + X.active().length, 0, 'agnostic again'); assert.equal(slot.children.length, 0, 'what they added is gone'); assert.ok(!keys.has('KeyQ'), 'their keys too');
    } finally { slot.remove(); }
  });
  it('⋯ Options carries Theme and Dependencies; the graph page draws the canvas', () => {
    if (!document.getElementById('slot-options')) return;   // only on the full canvas page
    assert.ok(document.getElementById('themeBtn')); assert.ok(document.getElementById('depsBtn'));
  });
  it('3.94 a knob drags from anywhere on it — its value and its name too, not only the ring', () => {
    let got = null; const k = UIKit.Knob({ label: 'Grab', min: 0, max: 1, value: 0.5, default: 0.5, onChange: (v) => { got = v; } }); document.body.appendChild(k.el);
    try {
      const val = k.el.querySelector('.uk-knob-val'), r = val.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      const ev = (t, yy) => new PointerEvent(t, { bubbles: true, clientX: x, clientY: yy, pointerId: 1, buttons: t === 'pointerup' ? 0 : 1 });
      val.dispatchEvent(ev('pointerdown', y)); k.el.dispatchEvent(ev('pointermove', y - 40)); k.el.dispatchEvent(ev('pointerup', y - 40));
      assert.ok(got > 0.5, 'a drag that starts on the value turns the knob: ' + got);
    } finally { k.el.remove(); }
  });
  it('3.98 Field: one gradient across the canvas; an accent takes the colour under it, and moving it changes them', async () => {
    const R = document.documentElement, was = R.dataset.theme, F = ColourField;
    assert.ok(F.at(0, 0) !== F.at(2000, 1200), 'the field runs across the canvas');
    const host = document.createElement('div'); host.className = 'wm-win'; host.style.cssText = 'position:fixed;left:0;top:0;width:300px;height:80px';
    const b = document.createElement('button'); b.className = 'uk-btn'; b.textContent = 'x'; b.style.width = '200px'; host.appendChild(b); document.body.appendChild(host);
    try {
      Themes.set('field'); F.sweep();
      assert.ok(b.hasAttribute('data-f') && /^#/.test(b.style.getPropertyValue('--fl')), 'the button is painted from the field');
      assert.ok(b.style.getPropertyValue('--fl') !== b.style.getPropertyValue('--fr'), 'its left and right differ — the field runs across it');
      const c0 = b.style.getPropertyValue('--fc'); host.style.left = '900px'; host.style.top = '500px'; F.sweep();
      assert.ok(b.style.getPropertyValue('--fc') !== c0, 'moved, it shows another part of the field');
      assert.equal(getComputedStyle(b).backgroundColor, 'rgba(0, 0, 0, 0)', 'clear: a border and a label only');
      const c1 = b.style.getPropertyValue('--fc'); F.phase = F.phase + 0.3; F.flow();
      assert.ok(b.style.getPropertyValue('--fc') !== c1, '3.100 the field flows: the colours move with nothing moved');
      assert.ok(F.at(500, 500, 0.4) === F.at(500, 500, 2.4), 'it comes round again (a mirrored run, no seam)');
      Themes.set('studio'); await TH.sleep(0); assert.ok(!b.hasAttribute('data-f'), 'another theme takes the field away');
    } finally { host.remove(); Themes.set(was === 'field' ? 'studio' : was); R.dataset.theme = 'studio'; }
  });
});
