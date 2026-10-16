/* ERAVOS desktop — the canvas as an app (spec eravos.phase12-desktop).
 * One window, served from eravos://app/ (privileged secure scheme: stable origin, secure context, no port).
 * The app grants MIDI + microphone to its own origin only. The exe folder has the project's own layout:
 *   canvas/ tools/ schemas/ README.md   — the same folders as the repo, served as the app (tools/ = every domain)
 *   projects/ (saves) · exports/ (bounces) · drop/ (anything → canvas) · packs/ (extra .zip packs, loaded every start)
 *   .appdata/ (ERAVOS's own storage). One folder holds everything: copy it to move or back up ERAVOS. */
'use strict';
const { app, BrowserWindow, protocol, net, session, shell, ipcMain, Menu, dialog } = require('electron');
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url');

const SCHEME = 'eravos', ORIGIN = 'eravos://app';
// the project tree: next to ERAVOS.exe (a build), or the repo root (electron desktop/ in dev)
const hasCanvas = (d) => fs.existsSync(path.join(d, 'canvas', 'index.html'));
const APP_DIR = [path.dirname(process.execPath), path.resolve(__dirname, '..', '..'), path.resolve(__dirname, '..')].find(hasCanvas) || path.resolve(__dirname, '..');
const SERVED = new Set(['canvas', 'tools', 'schemas', 'README.md']);   // the only top-level names the app serves
protocol.registerSchemesAsPrivileged([{ scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true, codeCache: true } }]);

// ---------------------------------------------------------------- your folders (beside canvas/ and tools/)
function writable(dir) { try { fs.mkdirSync(dir, { recursive: true }); const t = path.join(dir, '.write-test'); fs.writeFileSync(t, ''); fs.unlinkSync(t); return true; } catch (e) { return false; } }
function pickHome() {
  if (process.env.ERAVOS_LIBRARY) return path.resolve(process.env.ERAVOS_LIBRARY);
  if (writable(path.join(APP_DIR, 'projects'))) return APP_DIR;
  return path.join(app.getPath('documents'), 'ERAVOS');   // e.g. installed under Program Files: keep your work in Documents
}
const HOME = pickHome();
const DIRS = { drop: path.join(HOME, 'drop'), packs: path.join(HOME, 'packs'), projects: path.join(HOME, 'projects'), exports: path.join(HOME, 'exports'), appdata: path.join(HOME, '.appdata') };
// older builds kept these in "ERAVOS Library" — move your saves, bounces, dropped files and autosave across once.
// Its Mods/Packs are left behind: the tools now ship in tools/, and the old music packs would load them twice.
const OLD = [path.join(HOME, 'ERAVOS Library'), path.join(app.getPath('documents'), 'ERAVOS Library')].find(d => fs.existsSync(d));
if (OLD) [['Projects', 'projects'], ['Exports', 'exports'], ['Drop Here', 'drop'], ['.appdata', 'appdata']].forEach(([from, to]) => {
  const src = path.join(OLD, from), dst = DIRS[to];
  try { if (fs.existsSync(src) && (!fs.existsSync(dst) || !fs.readdirSync(dst).length)) { fs.rmSync(dst, { recursive: true, force: true }); fs.renameSync(src, dst); } } catch (e) { console.error('moving', src, e.message); }
});
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));
app.setPath('userData', DIRS.appdata);

// ---------------------------------------------------------------- one instance
const PRIMARY = app.requestSingleInstanceLock();
if (!PRIMARY) app.quit();
let win = null;
app.on('second-instance', () => { if (win) { if (win.isMinimized()) win.restore(); win.focus(); } });

// ---------------------------------------------------------------- window state
const STATE = path.join(DIRS.appdata, 'window.json');
function loadState() { try { return JSON.parse(fs.readFileSync(STATE, 'utf8')); } catch (e) { return { width: 1600, height: 1000, maximized: true }; } }
function saveState() { if (!win || win.isDestroyed()) return; try { const b = win.getNormalBounds(); fs.writeFileSync(STATE, JSON.stringify(Object.assign(b, { maximized: win.isMaximized() }))); } catch (e) {} }

// ---------------------------------------------------------------- import ledger (never take the same file twice; never move user files)
const LEDGER = path.join(DIRS.drop, '.imported.json');
let ledger = {}; try { ledger = JSON.parse(fs.readFileSync(LEDGER, 'utf8')); } catch (e) {}
const keyOf = (name, st) => `${name}|${st.size}|${Math.round(st.mtimeMs)}`;
function markImported(k) { ledger[k] = new Date().toISOString(); try { fs.writeFileSync(LEDGER, JSON.stringify(ledger, null, 1)); } catch (e) {} }
const skip = (name) => name.startsWith('.') || /^READ ME/i.test(name) || /\.(tmp|part|crdownload|download)$/i.test(name);

let seq = 0; const pending = new Map();
function sendFile(file, source) {
  let st; try { st = fs.statSync(file); } catch (e) { return; }
  if (!st.isFile()) return;
  const name = path.basename(file), key = keyOf(name, st);
  if (source === 'drop' && ledger[key]) return;
  const id = ++seq; pending.set(id, { key, source, file });
  const data = fs.readFileSync(file);
  win.webContents.send('eravos:file', { id, name, source, data: new Uint8Array(data.buffer, data.byteOffset, data.byteLength) });
}
function whenStable(file, fn) { // wait until a file being copied in stops growing
  let last = -1, tries = 0;
  const check = () => { let s; try { s = fs.statSync(file).size; } catch (e) { return; } if (s === last && s > 0) return fn(); last = s; if (++tries < 60) setTimeout(check, 400); };
  setTimeout(check, 300);
}
let watching = false;
// Packs go over as ONE batch: the page orders them by their manifests' dependencies (core before tools) and installs
// them before the start screen appears; the drop folder follows once the page says the packs are done.
function sendPacks() {
  const list = [];
  // packs/*.zip — extras on top of tools/ (packs dropped on the canvas are kept here)
  for (const n of fs.readdirSync(DIRS.packs).filter(n => /\.zip$/i.test(n) && !skip(n)).sort()) {
    const dir = DIRS.packs;
    try { const b = fs.readFileSync(path.join(dir, n)); list.push({ name: n, data: new Uint8Array(b.buffer, b.byteOffset, b.byteLength) }); } catch (e) { console.error('pack read failed', n, e.message); }
  }
  win.webContents.send('eravos:packs', list);
}
function startLibrary() {
  fs.readdirSync(DIRS.drop).filter(n => !skip(n)).sort().forEach(n => sendFile(path.join(DIRS.drop, n), 'drop'));
  if (watching) return; watching = true;
  const seen = new Map();
  try {
    fs.watch(DIRS.drop, (ev, name) => {
      if (!name || skip(name)) return; const file = path.join(DIRS.drop, name);
      if (seen.get(name)) return; seen.set(name, true);
      whenStable(file, () => { seen.delete(name); sendFile(file, 'drop'); });
    });
  } catch (e) { console.error('drop folder watch failed:', e.message); }
}

// ---------------------------------------------------------------- IPC
ipcMain.on('eravos:ready', () => sendPacks());
ipcMain.on('eravos:packs-done', () => startLibrary());
ipcMain.on('eravos:file-done', (e, r) => { const p = pending.get(r.id); if (!p) return; pending.delete(r.id); if (r.ok && p.source === 'drop') markImported(p.key); });
ipcMain.handle('eravos:info', () => ({ library: HOME, dirs: DIRS, version: app.getVersion(), desktop: true }));
ipcMain.handle('eravos:keep-pack', (e, { name, data }) => {
  const safe = path.basename(String(name || 'pack.zip')).replace(/[^\w.\- ]+/g, '_'); const dst = path.join(DIRS.packs, /\.zip$/i.test(safe) ? safe : safe + '.zip');
  try { if (fs.existsSync(dst) && fs.statSync(dst).size === data.byteLength) return { kept: false, path: dst }; fs.writeFileSync(dst, Buffer.from(data)); return { kept: true, path: dst }; } catch (err) { return { kept: false, error: err.message }; }
});
ipcMain.on('eravos:open-library', (e, sub) => shell.openPath(sub && DIRS[sub] ? DIRS[sub] : HOME));

// ---------------------------------------------------------------- app
const ALLOWED = new Set(['midi', 'midiSysex', 'media', 'fullscreen', 'clipboard-sanitized-write']);
// Node's URL doesn't know eravos: is a standard scheme (its .origin is "null") — compare scheme + host explicitly
const ours = (u) => { try { const x = new URL(String(u)); return x.protocol === SCHEME + ':' && x.host === 'app'; } catch (e) { return false; } };
function uniquePath(dir, name) { let p = path.join(dir, name); const ext = path.extname(name), base = path.basename(name, ext); for (let i = 2; fs.existsSync(p); i++) p = path.join(dir, `${base} (${i})${ext}`); return p; }

app.whenReady().then(() => {
  if (!PRIMARY) return;
  protocol.handle(SCHEME, async (req) => {
    const u = new URL(req.url); if (u.host !== 'app') return new Response('not found', { status: 404 });
    let rel = decodeURIComponent(u.pathname); if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(APP_DIR, '.' + rel);
    if (!file.startsWith(APP_DIR + path.sep)) return new Response('forbidden', { status: 403 });
    // only the project's app folders — never your projects, .appdata or the Electron runtime next to them
    const parts = path.relative(APP_DIR, file).split(path.sep);
    if (!SERVED.has(parts[0]) || parts.some(p => p === 'node_modules' || p.startsWith('.'))) return new Response('not found', { status: 404 });
    try { if (!fs.statSync(file).isFile()) throw new Error(); } catch (e) { return new Response('not found', { status: 404 }); }
    return net.fetch(pathToFileURL(file).toString());
  });
  const ses = session.defaultSession;
  ses.setPermissionRequestHandler((wc, perm, cb, details) => {
    if (!ours(details.requestingUrl || wc.getURL()) || !ALLOWED.has(perm)) return cb(false);
    if (perm === 'media' && (details.mediaTypes || []).some(t => t !== 'audio')) return cb(false); // microphone only, never camera
    cb(true);
  });
  ses.setPermissionCheckHandler((wc, perm, origin) => ALLOWED.has(perm) && ours(origin));
  ses.on('will-download', (e, item) => {
    const name = item.getFilename(), dir = /\.json$/i.test(name) ? DIRS.projects : DIRS.exports, dst = uniquePath(dir, name);
    item.setSavePath(dst);
    item.once('done', (ev, state) => { if (win && !win.isDestroyed()) win.webContents.send('eravos:saved', { path: dst, folder: path.basename(dir), name: path.basename(dst), ok: state === 'completed' }); });
  });

  const st = loadState();
  win = new BrowserWindow({
    width: st.width || 1600, height: st.height || 1000, x: st.x, y: st.y, minWidth: 900, minHeight: 600,
    backgroundColor: '#07090d', title: 'ERAVOS', autoHideMenuBar: true, show: false,
    webPreferences: { preload: path.join(__dirname, 'preload.js'), contextIsolation: true, nodeIntegration: false, sandbox: true, backgroundThrottling: false, autoplayPolicy: 'no-user-gesture-required' },
  });
  if (st.maximized) win.maximize();
  win.once('ready-to-show', () => win.show());
  ['resize', 'move', 'close'].forEach(ev => win.on(ev, saveState));
  const wc = win.webContents;
  // P11.3 (gate S): the page says "unsaved changes" → ask, instead of silently refusing to close
  wc.on('will-prevent-unload', (e) => {
    const c = dialog.showMessageBoxSync(win, { type: 'question', buttons: ['Close anyway', 'Stay'], defaultId: 1, cancelId: 1, title: 'ERAVOS',
      message: 'This song has changes that aren’t kept in a project or file yet.', detail: 'Autosave has the latest state and ERAVOS will offer it next time. To keep a copy: Session → Keep as project, or Save.' });
    if (c === 0) e.preventDefault();
  });
  wc.on('will-navigate', (e, url) => { if (!ours(url)) { e.preventDefault(); if (/^https?:/i.test(url)) shell.openExternal(url); } });
  wc.setWindowOpenHandler(({ url }) => { if (/^https?:/i.test(url)) shell.openExternal(url); return { action: 'deny' }; });
  wc.on('before-input-event', (e, i) => {
    if (i.type !== 'keyDown') return;
    if (i.key === 'F11') { win.setFullScreen(!win.isFullScreen()); e.preventDefault(); }
    if (i.key === 'I' && i.control && i.shift) { wc.toggleDevTools(); e.preventDefault(); }
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: 'ERAVOS', submenu: [
      { label: 'Open the ERAVOS folder', click: () => shell.openPath(HOME) },
      { label: 'Open the drop folder', click: () => shell.openPath(DIRS.drop) },
      { type: 'separator' }, { role: 'reload' }, { role: 'togglefullscreen' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'quit' } ] },
    { role: 'editMenu' },
  ]));
  win.loadURL(ORIGIN + '/canvas/index.html');   // the canvas; its tools load from /tools/ — the tools/ folder beside it
  win.on('closed', () => { win = null; });
});
app.on('window-all-closed', () => app.quit());
