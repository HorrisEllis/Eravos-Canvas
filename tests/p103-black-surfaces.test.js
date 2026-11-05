/* P103 · black surfaces — his words, 2026-11-05: "i dont like the tint. everything but the colors should be what they are. make them
 * darker even. like black". */
window.__phase = 'P103';
describe('P103 · surfaces are neutral black; colours stay exactly what they are', () => {
  it('a dark tinted surface becomes a darker neutral grey; a colour (bright, or dark but clearly coloured) is untouched', () => {
    const N = BlackSurfaces.neutral;
    assert.ok(/^#(..)\1\1$/.test(N('#0b1119')), `hex stays hex, neutral (${N('#0b1119')})`);
    const grey = (c) => { const m = /rgba?\((\d+), (\d+), (\d+)/.exec(c) || /#(..)(..)(..)/.exec(c); const v = m[0][0] === '#' ? [1, 2, 3].map(i => parseInt(m[i], 16)) : [1, 2, 3].map(i => +m[i]); return v[0] === v[1] && v[1] === v[2] ? v[0] : -1; };
    for (const c of ['#0b1119', '#111823', 'rgb(11, 7, 16)', 'rgba(7, 9, 13, 0.9)', '#16202d']) { const g = grey(N(c)); assert.ok(g >= 0, `${c} → neutral (${N(c)})`); }
    assert.ok(grey(N('#111823')) < 0x18, 'darker than it was');
    assert.ok(/^rgba\((\d+), \1, \1, 0\.9\)$/.test(N('rgba(7, 9, 13, 0.9)')), `alpha kept (${N('rgba(7, 9, 13, 0.9)')})`);
    for (const c of ['#ff2266', '#00d4ff', '#3a1020', '#00ff88', '#ffaa00', '#e2e2e2', '#7f93a8']) assert.equal(N(c), c, `${c} is a colour (or text): untouched`);
  });
  it('the surface tokens are neutral black in every theme; the accents keep their colour', () => {
    const was = document.documentElement.dataset.theme;
    try { for (const t of ['dusk', 'studio', 'field', 'midnight']) { document.documentElement.dataset.theme = t; const cs = getComputedStyle(document.documentElement);
      for (const k of ['--bg', '--bg2', '--panel', '--panel2', '--well']) { const v = cs.getPropertyValue(k).trim(); assert.ok(/^#([0-9a-f])\1([0-9a-f])\2([0-9a-f])\3$|^#(\w\w)\4\4$/i.test(v) || /^#(..)\1\1$/i.test(v), `${t} ${k} ${v} is neutral`); }
      assert.ok(!/^#(..)\1\1$/i.test(cs.getPropertyValue('--pink').trim()), `${t}: --pink is still a colour`); } }
    finally { document.documentElement.dataset.theme = was; }
  });
  it('a display a tool draws: its dark tinted background is drawn neutral, its colours as they are', () => {
    const w = document.createElement('div'); w.className = 'wm-win'; const cv = document.createElement('canvas'); cv.width = cv.height = 4; w.appendChild(cv); document.body.appendChild(w);
    const g = cv.getContext('2d'); g.fillStyle = '#0b1119'; g.fillRect(0, 0, 2, 4); g.fillStyle = '#ff2266'; g.fillRect(2, 0, 2, 4);
    const a = g.getImageData(0, 0, 1, 1).data, b = g.getImageData(3, 0, 1, 1).data; w.remove();
    assert.ok(a[0] === a[1] && a[1] === a[2] && a[0] < 0x11, `background drawn neutral and darker (${a[0]},${a[1]},${a[2]})`);
    assert.ok(b[0] === 255 && b[1] === 0x22 && b[2] === 0x66, 'the colour drawn as it is');
  });
});
