/* ERAVOS desktop — setup-copy.js (3.210): what the Setup's own window does with the files, in plain Node (tested without Electron:
 * desktop/test/setup-copy.mjs). His words, 2026-11-21: "it is the old one." (of the stock installer, after the look was approved) ·
 * "have it ask where you want to save … the default be the documents … a browse button to change it" · "update broke my eravos."
 * The Setup (packaging/windows/eravos.nsi) unpacks the app into a stage folder and starts its ERAVOS.exe with --eravos-setup; that window
 * (desktop/setup-window.js + setup.html) asks where the canvas and the library go and calls these:
 *   plan(stage) → { files: [{ rel, size }], bytes }       every file of the app, as built
 *   folder(chosen) → chosen, or chosen\ERAVOS            a folder of its own inside the one picked
 *   install(stage, dest, plan, onProgress) → { ok, bad }  the app's own folders cleared first (a tool removed upstream must not linger),
 *                                                          every file copied, then every size checked on disk (a short file = not ok)
 *   saveLibrary(appData, dir)                              %APPDATA%\ERAVOS\library.txt, UTF-16 with a BOM (desktop/library-tools.js reads it)
 *   writeResult(file, r)                                   the answer for the Setup: an INI it reads with ReadINIStr (UTF-16 with a BOM) */
'use strict';
const fs = require('fs'), path = require('path');
const APP_DIRS = ['canvas', 'tools', 'schemas', 'host', 'tests', 'resources', 'locales'];   // the app's own folders (eravos.nsi clears the same)

function plan(stage) {
  const files = []; let bytes = 0;
  (function walk(dir) { for (const e of fs.readdirSync(dir, { withFileTypes: true })) { const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p); else { const size = fs.statSync(p).size; files.push({ rel: path.relative(stage, p), size }); bytes += size; } } })(stage);
  files.sort((a, b) => b.size - a.size); return { files, bytes };
}
function folder(chosen) { const c = String(chosen || '').replace(/[\\/]+$/, ''); return !c ? c : /^eravos$/i.test(path.win32.basename(c)) || /^eravos$/i.test(path.basename(c)) ? c : path.join(c, 'ERAVOS'); }

// only a folder that is ERAVOS's (it has ERAVOS.exe, or is empty / new) has its app folders cleared
function prepare(dest) {
  fs.mkdirSync(dest, { recursive: true });
  const mine = fs.existsSync(path.join(dest, 'ERAVOS.exe')) || !fs.readdirSync(dest).length;
  if (mine) APP_DIRS.forEach(d => fs.rmSync(path.join(dest, d), { recursive: true, force: true }));
  return mine;
}
function copyOne(src, dst, onBytes) {
  return new Promise((res, rej) => {
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    const r = fs.createReadStream(src, { highWaterMark: 1 << 20 }), w = fs.createWriteStream(dst);
    r.on('data', (b) => onBytes(b.length)); r.on('error', rej); w.on('error', rej); w.on('finish', res); r.pipe(w);
  });
}
async function install(stage, dest, p, onProgress) {
  p = p || plan(stage); prepare(dest);
  let done = 0, last = 0; const tell = (file, phase) => { if (onProgress) onProgress({ phase, file, done, total: p.bytes }); };
  for (const f of p.files) {
    let tries = 0;
    for (;;) {
      try { await copyOne(path.join(stage, f.rel), path.join(dest, f.rel), (n) => { done += n; if (done - last > (2 << 20)) { last = done; tell(f.rel, 'copy'); } }); break; }
      catch (e) { if (++tries > 5) throw new Error(f.rel + ': ' + e.message); await new Promise(r => setTimeout(r, 400 * tries)); }   // a file held a moment (a scanner): again
    }
    tell(f.rel, 'copy');
  }
  const bad = []; let n = 0;
  for (const f of p.files) { let s = -1; try { s = fs.statSync(path.join(dest, f.rel)).size; } catch (e) {} if (s !== f.size) bad.push(f.rel + ' (' + (s < 0 ? 'missing' : s + ' of ' + f.size + ' bytes') + ')');
    if (++n % 50 === 0 && onProgress) onProgress({ phase: 'check', file: f.rel, done: n, total: p.files.length }); }
  if (onProgress) onProgress({ phase: 'check', file: '', done: p.files.length, total: p.files.length });
  return { ok: !bad.length, bad, files: p.files.length };
}
const utf16 = (s) => Buffer.concat([Buffer.from([0xff, 0xfe]), Buffer.from(s, 'utf16le')]);
function saveLibrary(appData, dir) { const d = path.join(appData, 'ERAVOS'); fs.mkdirSync(d, { recursive: true }); fs.mkdirSync(dir, { recursive: true }); fs.writeFileSync(path.join(d, 'library.txt'), utf16(dir)); }
function writeResult(file, r) {
  const line = (k, v) => k + '=' + String(v == null ? '' : v).replace(/[\r\n]+/g, ' ');
  fs.writeFileSync(file, utf16(['[result]', line('ok', r.ok ? 1 : 0), line('dest', r.dest), line('library', r.library), line('start', r.start ? 1 : 0), line('why', r.why)].join('\r\n') + '\r\n'));
}
module.exports = { plan, folder, prepare, install, saveLibrary, writeResult, APP_DIRS };
