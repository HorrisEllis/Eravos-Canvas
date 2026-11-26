/* P227 — the catalog's look (3.227). His words, 2026-11-25: "okay, i hate the font. also the green. also i want the thumbnails back. and i want
 * those generated per tool, mutated tool, consistent style." · "make it colored. the themes, and the reactive colors."
 * (1) nothing that says on / ready / done is a fixed green: it is the theme's colour (--ok), which the reactive colours move;
 * (2) every tool has its painting; a tool made on the canvas gets one, painted in the same style (ToolArt), seeded by its id;
 * (3) Font is a choice beside the theme (today's the default). */
window.__phase = 'P227';
describe('P227 the catalog: colour, paintings, font', () => {
  const css = (el, k) => getComputedStyle(el).getPropertyValue(k).trim();
  it('on / ready / done is the theme\'s colour, never the fixed green', async () => {
    const root = document.documentElement, was = root.dataset.theme, chip = document.createElement('span'); chip.className = 'ap-chip built'; document.body.appendChild(chip);
    try { ['dusk', 'studio', 'field', 'midnight'].forEach(t => { root.dataset.theme = t; const c = getComputedStyle(chip).color; assert.ok(!/rgb\(0, 255, 136\)/.test(c), t + ': not #00ff88 (' + c + ')'); });
      root.dataset.theme = 'dusk'; root.dataset.react = 'beat'; root.style.setProperty('--beat-col', '#123456'); assert.equal(getComputedStyle(chip).color, 'rgb(18, 52, 86)', 'the reactive colour moves it');
    } finally { delete root.dataset.react; root.style.removeProperty('--beat-col'); if (was) root.dataset.theme = was; else delete root.dataset.theme; chip.remove(); }
  });
  it('every tool has a painting; a made tool is painted in the same style, the same every time', async () => {
    const C = window.Catalog; if (C && C.tools) { const none = C.tools().filter(t => !t.hidden && !t.art).map(t => t.id); assert.deepEqual(none, [], 'tools without a painting'); }
    assert.ok(window.ToolArt, 'the painter is loaded');
    const a = ToolArt.paint({ id: 'x', accents: ['#ff2266', '#ff2bd6'] }), b = ToolArt.paint({ id: 'x', accents: ['#ff2266', '#ff2bd6'] }), c = ToolArt.paint({ id: 'y', accents: ['#ff2266'] , mutated: true });
    assert.equal(a, b, 'seeded by its id'); assert.ok(a !== c, 'another tool, another painting'); assert.ok(/viewBox="0 0 240 150"/.test(a), 'the cards\' 240 × 150');
    assert.ok(a.includes('#ff2266') && /stroke="#ff2bd6"/.test(a), 'a ribbon in each parent\'s colour');
    const img = new Image(); img.src = ToolArt.url({ id: 'z', accents: ['#00d4ff'] }); await new Promise(r => { img.onload = r; img.onerror = r; setTimeout(r, 1500); }); assert.equal(img.naturalWidth, 240, 'it draws as an image');
  });
  it('Font is a choice beside the theme; today\'s stays the default', async () => {
    assert.ok(Themes.fonts().length >= 3, 'fonts offered'); const was = Themes.getFont();
    try { assert.ok(Themes.setFont('grotesk')); assert.ok(/ERV Grotesk/.test(css(document.documentElement, '--font')), 'it sets the text face');
      Themes.setFont('theme'); assert.ok(!document.documentElement.dataset.font, 'as it is = no attribute'); } finally { Themes.setFont(was); }
  });
});
