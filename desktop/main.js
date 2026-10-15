/* ERAVOS desktop — the canvas as an app (spec eravos.phase12-desktop).
 * One window, served from eravos://app/ (privileged secure scheme: stable origin, secure context, no port).
 * The app grants MIDI + microphone to its own origin only. "ERAVOS Library" next to the exe is the folder:
 * Drop Here (anything → canvas), Packs (installed every start), Projects (saves), Exports (bounces), .appdata (storage). */
'use strict';
const { app, BrowserWindow, protocol, net, session, shell, ipcMain, Menu, dialog } = require('electron');
const path = require('path'), fs = require('fs'), { pathToFileURL } = require('url');

const SCHEME = 'eravos', ORIGIN = 'eravos://app';
const APP_DIR = fs.existsSync(path.join(__dirname, 'eravos', 'index.html')) ? path.join(__dirname, 'eravos') : path.resolve(__dirname, '..');
protocol.registerSchemesAsPrivileged([{ scheme: SCHEME, privileges: { standard: true, secure: true, supportFetchAPI: true, stream: true, corsEnabled: true, codeCache: true } }]);

// ---------------------------------------------------------------- the library folder
function writable(dir) { try { fs.mkdirSync(dir, { recursive: true }); const t = path.join(dir, '.write-test'); fs.writeFileSync(t, ''); fs.unlinkSync(t); return true; } catch (e) { return false; } }
function pickLibrary() {
  if (process.env.ERAVOS_LIBRARY) return path.resolve(process.env.ERAVOS_LIBRARY);
  const beside = path.join(app.isPackaged ? path.dirname(process.execPath) : path.resolve(APP_DIR, '..'), 'ERAVOS Library');
  if (writable(beside)) return beside;
  return path.join(app.getPath('documents'), 'ERAVOS Library');
}
const LIB = pickLibrary();
const DIRS = { drop: path.join(LIB, 'Drop Here'), packs: path.join(LIB, 'Packs'), mods: path.join(LIB, 'Mods'), projects: path.join(LIB, 'Projects'), exports: path.join(LIB, 'Exports'), appdata: path.join(LIB, '.appdata') };
Object.values(DIRS).forEach(d => fs.mkdirSync(d, { recursive: true }));
const README = path.join(LIB, 'READ ME.txt');
if (!fs.existsSync(README)) fs.writeFileSync(README, [
  'ERAVOS Library', '',
  'Drop Here  - put sounds, .mid files, packs (.zip) or projects (.eravos.json) here and they appear on the canvas,',
  '             like dropping them on the canvas. Files stay here; each is taken in once.',
  'Mods       - everything ERAVOS can do, one folder per domain (Mods\\Music, Mods\\Image, …). Every .zip in Mods or in a',
  '             domain folder loads every start and fills the ＋ Add menu. Remove a .zip to remove what it adds.',
  'Packs      - older place for packs; still loaded. Packs you drop on the canvas are kept here.',
  '             Only put packs here that you trust: they run as part of ERAVOS.',
  'Projects   - Session > Save writes your songs here.',
  'Exports    - bounced WAVs and other exports land here.',
  '.appdata   - ERAVOS\'s own storage (autosave, presets). Copy the whole ERAVOS folder to move everything.', ''].join('\r\n'));
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
// them before the start screen appears; Drop Here follows once the page says the packs are done.
function sendPacks() {
  const list = [];
  // Packs/*.zip, Mods/*.zip and Mods/<Domain>/*.zip — each domain keeps to its own folder (3.30)
  // the same pack name in two places loads once (Mods wins — an old Packs copy left by an update is ignored)
  const dirs = fs.readdirSync(DIRS.mods, { withFileTypes: true }).filter(d => d.isDirectory() && !skip(d.name)).map(d => path.join(DIRS.mods, d.name)).concat([DIRS.mods, DIRS.packs]), seen = new Set();
  for (const dir of dirs) for (const n of fs.readdirSync(dir).filter(n => /\.zip$/i.test(n) && !skip(n)).sort()) {
    if (seen.has(n.toLowerCase())) continue; seen.add(n.toLowerCase());
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
  } catch (e) { console.error('Drop Here watch failed:', e.message); }
}

// ---------------------------------------------------------------- IPC
ipcMain.on('eravos:ready', () => sendPacks());
ipcMain.on('eravos:packs-done', () => startLibrary());
ipcMain.on('eravos:file-done', (e, r) => { const p = pending.get(r.id); if (!p) return; pending.delete(r.id); if (r.ok && p.source === 'drop') markImported(p.key); });
ipcMain.handle('eravos:info', () => ({ library: LIB, dirs: DIRS, version: app.getVersion(), desktop: true }));
ipcMain.handle('eravos:keep-pack', (e, { name, data }) => {
  const safe = path.basename(String(name || 'pack.zip')).replace(/[^\w.\- ]+/g, '_'); const dst = path.join(DIRS.packs, /\.zip$/i.test(safe) ? safe : safe + '.zip');
  try { if (fs.existsSync(dst) && fs.statSync(dst).size === data.byteLength) return { kept: false, path: dst }; fs.writeFileSync(dst, Buffer.from(data)); return { kept: true, path: dst }; } catch (err) { return { kept: false, error: err.message }; }
});
ipcMain.on('eravos:open-library', (e, sub) => shell.openPath(sub && DIRS[sub] ? DIRS[sub] : LIB));

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
    if (/(^|[\\/])(node_modules|desktop|\.git)([\\/]|$)/.test(path.relative(APP_DIR, file))) return new Response('not found', { status: 404 });
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
      { label: 'Open ERAVOS Library folder', click: () => shell.openPath(LIB) },
      { label: 'Open Drop Here folder', click: () => shell.openPath(DIRS.drop) },
      { type: 'separator' }, { role: 'reload' }, { role: 'togglefullscreen' }, { role: 'toggleDevTools' }, { type: 'separator' }, { role: 'quit' } ] },
    { role: 'editMenu' },
  ]));
  win.loadURL(ORIGIN + '/index.html');
  win.on('closed', () => { win = null; });
});
app.on('window-all-closed', () => app.quit());
