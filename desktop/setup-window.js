/* ERAVOS desktop — setup-window.js (3.210): ERAVOS.exe started by the Setup with --eravos-setup shows the Setup's own window instead of the
 * canvas — the look he approved (docs/previews/installer/, 2026-11-21: "It looks fucking significantly better."): black, the palette's waves,
 * the wordmark flowing, a glowing progress / ring. Nothing of the canvas runs here (main.js hands over before anything else).
 *   --eravos-setup --mode=install|update --dest=<folder> --version=<v> --result=<file.ini> [--library=<folder>]
 * The stage it runs from (the Setup unpacked it) is the app to copy. It answers the Setup in --result and exits: 0 done, 1 cancelled, 3 failed. */
'use strict';
const path = require('path'), fs = require('fs'), os = require('os');
function arg(k) { const p = '--' + k + '='; const a = process.argv.find(x => x.startsWith(p)); return a ? a.slice(p.length).replace(/^"|"$/g, '') : ''; }
function run() {
  const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
  app.setPath('userData', path.join(os.tmpdir(), 'eravos-setup-' + process.pid));   // never the canvas's own (it may be closing still)
  const o = { mode: arg('mode') === 'update' ? 'update' : 'install', dest: arg('dest'), version: arg('version'), result: arg('result'),
    stage: path.dirname(process.execPath), docs: app.getPath('documents'), appData: app.getPath('appData'), library: arg('library') };
  if (!o.library) try { o.library = require('./library-tools.js').chosen(path.join(o.appData, 'ERAVOS', 'library.txt')) || ''; } catch (e) {}   // the last choice, if any
  let win = null, answered = false;
  const answer = (r) => { if (answered) return; answered = true; try { if (o.result) require('./setup-copy.js').writeResult(o.result, r); } catch (e) {} app.exit(r.ok ? 0 : r.cancelled ? 1 : 3); };
  ipcMain.handle('setup:opts', () => o);
  ipcMain.handle('setup:pick', async (e, title, def) => { const r = await dialog.showOpenDialog(win, { title, defaultPath: def, properties: ['openDirectory', 'createDirectory', 'promptToCreate'] }); return r.canceled ? null : r.filePaths[0]; });
  ipcMain.handle('setup:open', (e, dir) => shell.openPath(dir));
  ipcMain.on('setup:done', (e, r) => answer(r));
  ipcMain.on('setup:min', () => win && win.minimize());
  app.whenReady().then(() => {
    win = new BrowserWindow({ width: o.mode === 'update' ? 440 : 700, height: o.mode === 'update' ? 460 : 470, frame: false, resizable: false, backgroundColor: '#000000', show: false,
      title: 'ERAVOS ' + (o.mode === 'update' ? 'Update' : 'Setup'), webPreferences: { nodeIntegration: true, contextIsolation: false, sandbox: false } });
    win.setMenuBarVisibility(false); win.loadFile(path.join(__dirname, 'setup.html'));
    win.once('ready-to-show', () => { win.show(); win.focus(); });
    win.on('closed', () => answer({ ok: false, cancelled: true, why: 'closed' }));
  });
  app.on('window-all-closed', () => answer({ ok: false, cancelled: true, why: 'closed' }));
}
module.exports = { run };
