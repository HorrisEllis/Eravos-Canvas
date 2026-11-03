/* P99 · updates (3.99) — asked: "an installer for eravos with an update service to check GitHub for updates with a toast asking to
 * update it". The app (desktop/updater.js) checks; the page asks: Update now · What's new · Later (not asked again for that version). */
window.__phase = 'P99';
describe('P99 · an update is out: the toast asks', () => {
  it('shows the version, stays until answered; Later remembers the version; Update now asks the app to install it', async () => {
    const was = window.eravosDesktop; let installed = 0;
    try {
      const card = Updates.show({ version: '9.9.9', current: '0.1.0', notes: 'Field theme\nWobble Bass Suite', page: 'https://example.invalid/r' });
      assert.ok(card && card.isConnected && /ERAVOS 9\.9\.9 is out/.test(card.textContent) && /you have 0\.1\.0/.test(card.textContent), 'the toast says what is out');
      const btns = Array.from(card.querySelectorAll('button')).map(b => b.textContent); assert.deepEqual(btns, ['Update now', 'What’s new', 'Later']);
      Array.from(card.querySelectorAll('button')).find(b => b.textContent === 'Later').click();
      assert.ok(!card.isConnected, 'Later closes it'); assert.equal(localStorage.getItem('eravos.update.skip'), '9.9.9', 'and that version is not asked again');
      window.eravosDesktop = { installUpdate: async () => { installed++; return true; } };
      const c2 = Updates.show({ version: '9.9.10', current: '0.1.0' }); c2.querySelector('button').click(); await TH.sleep(0);
      assert.equal(installed, 1, 'Update now asks the app to install it');
      Updates.close();
    } finally { window.eravosDesktop = was; localStorage.removeItem('eravos.update.skip'); }
  });
  it('⋯ Options carries Check for updates', () => { if (!document.getElementById('slot-options')) return; assert.ok(document.getElementById('updBtn')); });
});
