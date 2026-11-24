// node desktop/test/setup-copy.mjs — the Setup's own window's copy (3.210, desktop/setup-copy.js), plain node: every file copied, every size
// checked on disk, the app's own folders cleared (a removed tool does not linger), a folder of its own, the library choice, the answer file.
import fs from 'fs'; import os from 'os'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url), C = require('../setup-copy.js'), L = require('../library-tools.js');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } };
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'eravos-setup-')), S = path.join(T, 'stage'), D = path.join(T, 'Program Files', 'ERAVOS');
const put = (base, rel, n) => { const f = path.join(base, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, Buffer.alloc(n, 7)); };
put(S, 'ERAVOS.exe', 5 << 20); put(S, 'resources/app/main.js', 1200); put(S, 'tools/music/a.js', 300); put(S, 'locales/en-US.pak', 4000);
put(D, 'ERAVOS.exe', 10); put(D, 'tools/music/removed-upstream.js', 5); put(D, 'Uninstall ERAVOS.exe', 9);   // an older install
const p = C.plan(S); ok(p.files.length === 4 && p.bytes === (5 << 20) + 1200 + 300 + 4000, 'the plan: every file and its size');
const seen = []; const r = await C.install(S, D, p, (s) => seen.push(s.phase));
ok(r.ok && !r.bad.length, 'installed, every size as built: ' + JSON.stringify(r.bad));
ok(fs.statSync(path.join(D, 'ERAVOS.exe')).size === 5 << 20, 'ERAVOS.exe in full (not the old 10 bytes)');
ok(!fs.existsSync(path.join(D, 'tools/music/removed-upstream.js')), 'a tool removed upstream does not linger');
ok(fs.existsSync(path.join(D, 'Uninstall ERAVOS.exe')), 'what is not the app\'s own folders stays (the uninstaller)');
ok(seen.includes('copy') && seen.includes('check'), 'progress told while copying and checking');
// a file cut short after copying is caught
const p2 = { files: p.files.concat([{ rel: 'ghost.dll', size: 99 }]), bytes: p.bytes + 99 };
put(S, 'ghost.dll', 50); const r2 = await C.install(S, D, p2);
ok(!r2.ok && r2.bad.some(b => /ghost\.dll \(50 of 99 bytes\)/.test(b)), 'a file not the size it was built at = not ok, named: ' + r2.bad);
// a folder of its own
ok(C.folder('D:\\Apps') === path.join('D:\\Apps', 'ERAVOS') || C.folder('D:\\Apps').endsWith('ERAVOS'), 'a folder of its own inside the one picked');
ok(C.folder(path.join(T, 'ERAVOS')) === path.join(T, 'ERAVOS') && C.folder(path.join(T, 'eravos') + path.sep) === path.join(T, 'eravos'), 'one named ERAVOS is kept as it is');
// the library choice → what ERAVOS reads at start
const AD = path.join(T, 'AppData'), LIB = path.join(T, 'Music', 'ERAVOS'); C.saveLibrary(AD, LIB);
ok(L.chosen(path.join(AD, 'ERAVOS', 'library.txt')) === LIB && fs.existsSync(LIB), 'the library chosen is the one ERAVOS opens, and the folder is made');
// the answer for the Setup (UTF-16 INI)
const RES = path.join(T, 'result.ini'); C.writeResult(RES, { ok: true, dest: D, library: LIB, start: true });
const txt = fs.readFileSync(RES); ok(txt[0] === 0xff && txt[1] === 0xfe && /\[result\]\r\nok=1\r\ndest=.*ERAVOS\r\nlibrary=.*\r\nstart=1/.test(txt.slice(2).toString('utf16le')), 'the answer: UTF-16 INI the Setup reads');
// a folder that is not ERAVOS's: its folders are never cleared
const O2 = path.join(T, 'shared'); put(O2, 'tools/theirs.txt', 3); put(O2, 'other.txt', 3); ok(C.prepare(O2) === false && fs.existsSync(path.join(O2, 'tools/theirs.txt')), 'someone else\'s folder: nothing cleared');
// 3.213 a held ERAVOS.exe (still running) is moved aside, never left in the way; the next install sweeps the old copy
const H = path.join(T, 'held'); put(H, 'ERAVOS.exe', 10); C.moveAside(path.join(H, 'ERAVOS.exe'));
const old = fs.readdirSync(H).filter(n => /^ERAVOS\.exe\.old-\d+$/.test(n));
ok(!fs.existsSync(path.join(H, 'ERAVOS.exe')) && old.length === 1, 'a held ERAVOS.exe is moved aside: ' + fs.readdirSync(H));
put(H, 'ERAVOS.exe', 10); C.prepare(H); ok(!fs.readdirSync(H).some(n => /\.old-/.test(n)), 'the next install sweeps the old copy away');
// 3.215 a running ERAVOS Update.exe (EBUSY, cannot be renamed) is kept as it is - never a failed install
const U = path.join(T, 'upd-stage'), UD = path.join(T, 'upd-dest'); put(U, 'ERAVOS.exe', 2000); put(U, 'ERAVOS Update.exe', 300); put(UD, 'ERAVOS Update.exe', 100);
const realCreate = fs.createWriteStream, realRename = fs.renameSync;
fs.createWriteStream = (f, o) => { if (/ERAVOS Update\.exe$/.test(f)) { const e = Object.assign(new Error('EBUSY: resource busy or locked, open \'' + f + '\''), { code: 'EBUSY' }); throw e; } return realCreate(f, o); };
fs.renameSync = (a, b) => { if (/ERAVOS Update\.exe$/.test(a)) throw Object.assign(new Error('EBUSY'), { code: 'EBUSY' }); return realRename(a, b); };
const ru = await C.install(U, UD, C.plan(U));
fs.createWriteStream = realCreate; fs.renameSync = realRename;
ok(ru.ok && ru.kept.includes('ERAVOS Update.exe') && fs.statSync(path.join(UD, 'ERAVOS.exe')).size === 2000, 'a running ERAVOS Update.exe is kept, the rest installs: ' + JSON.stringify(ru));
fs.rmSync(T, { recursive: true, force: true });
console.log(`setup-copy: ${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
