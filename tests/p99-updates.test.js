/* P99 · updates (3.99) — asked: "an installer for eravos with an update service to check GitHub for updates with a toast asking to
 * update it". The app (desktop/updater.js) checks; the page asks: Update now · What's new · Later (not asked again for that version). */
window.__phase = 'P99';
describe('P99 · an update is out: the toast asks', () => {
  it('shows the version, stays until answered; Later remembers the version; Update downloads in the background, then Restart now', async () => {
    const was = window.eravosDesktop;
    try {
      const card = Updates.show({ version: '9.9.9', current: '0.1.0', notes: 'Field theme\nWobble Bass Suite', page: 'https://example.invalid/r' });
      assert.ok(card && card.isConnected && /ERAVOS 9\.9\.9 is out/.test(card.textContent) && /you have 0\.1\.0/.test(card.textContent), 'the toast says what is out');
      const btns = Array.from(card.querySelectorAll('button')).map(b => b.textContent); assert.deepEqual(btns, ['Update', 'What’s new', 'Later']);
      Array.from(card.querySelectorAll('button')).find(b => b.textContent === 'Later').click();
      assert.ok(!card.isConnected, 'Later closes it'); assert.equal(localStorage.getItem('eravos.update.skip'), '9.9.9', 'and that version is not asked again');
      // 3.101 in the background: Update downloads (ERAVOS stays open), the card follows it, then Restart now / When I close ERAVOS
      const calls = []; window.eravosDesktop = { downloadUpdate: async () => { calls.push('download'); return true; }, applyUpdate: async () => { calls.push('apply'); return true; }, updateLater: async () => { calls.push('later'); return true; } };
      const c2 = Updates.show({ version: '9.9.10', current: '0.1.0' }); c2.querySelector('button').click(); await TH.sleep(0);
      assert.deepEqual(calls, ['download'], 'Update starts the download, nothing closes');
      Updates.on({ state: 'downloading', version: '9.9.10', got: 50, total: 100 });
      const dl = document.querySelector('.upd-toast'); assert.equal(dl.dataset.state, 'downloading'); assert.equal(dl.querySelector('.upd-bar i').style.width, '50%', 'how far it is');
      Updates.on({ state: 'ready', version: '9.9.10' });
      assert.deepEqual(Array.from(document.querySelectorAll('.upd-toast button')).map(b => b.textContent), ['Restart now', 'When I close ERAVOS']);
      document.querySelector('.upd-toast button').click(); await TH.sleep(0); assert.deepEqual(calls, ['download', 'apply'], 'Restart now hands over to ERAVOS Update');
      Updates.on({ state: 'failed', version: '9.9.10', message: 'robocopy failed (16)' });
      assert.ok(/did not go in/.test(document.querySelector('.upd-toast').textContent) && /robocopy failed/.test(document.querySelector('.upd-toast').textContent), 'a failure says what went wrong');
      Updates.close();
    } finally { window.eravosDesktop = was; localStorage.removeItem('eravos.update.skip'); }
  });
  it('⋯ Options carries Check for updates', () => { if (!document.getElementById('slot-options')) return; assert.ok(document.getElementById('updBtn')); });
});
