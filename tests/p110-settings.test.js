/* P110 · ⚙ Settings is a page, not a dropdown — his words, 2026-11-05: "also need a actual settings built not a drop down".
 * One page like the tool pages, a tab per section; sections are contributed (the canvas: Look, About & updates; the music domain:
 * Reactive colours, Sound), so the canvas names none of a domain's settings. ⋯ Options keeps only actions. */
window.__phase = 'P110';
describe('P110 · ⚙ Settings: one page, a tab per section', () => {
  it('the sections are there, in order, and each opens with its own controls', async () => {
    const ids = AppSettings.sections().map(s => s.id);
    ['look', 'reactive', 'sound', 'about'].forEach(id => assert.ok(ids.includes(id), id + ' is a section'));
    assert.ok(ids.indexOf('look') < ids.indexOf('about'), 'Look first, About last');
    try {
      AppSettings.open(); await TH.sleep(30);
      const ov = document.querySelector('.as-overlay'); assert.ok(ov, 'the page opens'); assert.ok(ov.querySelector('.tp-page'), 'styled like the tool pages');
      const tabs = [...ov.querySelectorAll('.as-nav .tp-tab')]; assert.equal(tabs.length, ids.length, 'a tab per section');
      for (const t of tabs) { t.click(); await TH.sleep(20); const sec = document.querySelector('.as-sec'); assert.equal(sec.dataset.sec, t.dataset.tab, 'the tab opens its section'); assert.ok(sec.querySelector('button, input, select'), t.dataset.tab + ' has controls'); assert.ok(document.querySelector('.as-nav .tp-tab.on').dataset.tab === t.dataset.tab); }
      // Look: picking a material from the page sets it
      AppSettings.open('look'); await TH.sleep(20); const was = Themes.getMaterial();
      try { const card = [...document.querySelectorAll('.as-sec .thm-panel *')].find(e => e.textContent.trim().startsWith('Grain') && e.closest('[role="button"], button')); assert.ok(card, 'the Grain card'); card.closest('[role="button"], button').click(); assert.equal(Themes.getMaterial(), 'grain'); } finally { Themes.setMaterial(was); }
      // Sound: the switch is the same setting
      AppSettings.open('sound'); await TH.sleep(20); const on0 = Proximity.on; document.querySelector('.as-sec .uk-toggle').click(); assert.equal(Proximity.on, !on0, 'Hear by place switches'); Proximity.set(on0);
      document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true })); await TH.sleep(10); assert.ok(!document.querySelector('.as-overlay'), 'Esc closes it');
      document.dispatchEvent(new KeyboardEvent('keydown', { key: ',', ctrlKey: true, bubbles: true })); await TH.sleep(10); assert.ok(document.querySelector('.as-overlay'), 'Ctrl+, opens it');
    } finally { AppSettings.close(); }
  });
  it('a section can be added by anyone, and a broken one does not break the page', async () => {
    AppSettings.addSection({ id: 'p110.x', label: 'Test', order: 95, make: () => { throw new Error('boom'); } });
    try { AppSettings.open('p110.x'); await TH.sleep(10); assert.ok(/could not open: boom/.test(document.querySelector('.as-sec').textContent)); assert.ok(document.querySelectorAll('.as-nav .tp-tab').length >= 5); } finally { AppSettings.close(); }
  });
});
