/* S1 · James, 2026-11-01: "b is also nice. why not add all of those to the themes" (and "i chose d") — button styles with any theme */
window.__phase = 'P84';
describe('P84 · button styles in the themes', () => {
  // the buttons fade between looks; read them without the fade
  const still = () => { const st = document.createElement('style'); st.textContent = '* { transition: none !important; }'; document.head.appendChild(st); return st; };
  it('each style restyles buttons (same size), "the theme\'s own" puts them back exactly, the choice is remembered', () => {
    const st = still(), was = Themes.getButtons(), box = document.createElement('div'); box.innerHTML = '<button class="uk-btn">Go</button><button class="uk-toggle on">On</button><span class="uk-seg"><button class="on">1/8</button><button>1/4</button></span>'; document.body.appendChild(box);
    const b = box.querySelector('.uk-btn'), look = () => { const cs = getComputedStyle(b); return [cs.backgroundImage, cs.borderTopColor, cs.color, cs.borderRadius].join('|'); };
    try {
      Themes.setButtons('theme'); const own = look(), size = [b.offsetWidth, b.offsetHeight].join('x');
      const seen = new Set([own]);
      for (const id of ['a', 'b', 'c', 'd']) { assert.ok(Themes.setButtons(id), id); assert.equal(document.documentElement.dataset.buttons, id); const l = look(); assert.ok(!seen.has(l), id + ' looks different'); seen.add(l);
        assert.equal(localStorage.getItem('eravos.buttons'), id, 'remembered'); if (id !== 'c') assert.equal([b.offsetWidth, b.offsetHeight].join('x'), size, id + ': same size'); }
      assert.ok(/conic-gradient/.test(getComputedStyle(b).backgroundImage), 'D: the rainbow rim');
      Themes.setButtons('theme'); assert.ok(!('buttons' in document.documentElement.dataset), 'no attribute'); assert.equal(look(), own, 'back exactly');
      assert.ok(!Themes.setButtons('zz'), 'an unknown style is refused');
    } finally { box.remove(); Themes.setButtons(was); st.remove(); }
  });
  it('the theme panel shows every style as a live card, each drawn in its own style whatever is chosen', () => {
    const st = still(), was = Themes.getButtons(); Themes.setButtons('d'); const p = Themes.panel(() => {}); document.body.appendChild(p);
    try {
      const cards = p.querySelectorAll('.thm-bcard'); assert.equal(cards.length, 5);
      const bg = (id) => getComputedStyle(p.querySelector(`[data-buttons-demo="${id}"] .uk-btn`)).backgroundImage;
      assert.ok(!/conic/.test(bg('a')) && /conic/.test(bg('d')), 'card A is not drawn in D although D is chosen');
      cards[2].click(); assert.equal(Themes.getButtons(), 'b');
    } finally { p.remove(); Themes.setButtons(was); st.remove(); }
  });
});
