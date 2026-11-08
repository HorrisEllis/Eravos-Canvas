// node desktop/test/library-tools.mjs — store S3: the tools go into Documents\ERAVOS\tools and are served from there (plain node, no Electron)
import fs from 'fs'; import os from 'os'; import path from 'path'; import { createRequire } from 'module';
const require = createRequire(import.meta.url); const L = require('../library-tools.js');
let pass = 0, fail = 0; const ok = (c, m) => { if (c) pass++; else { fail++; console.log('  ✗ ' + m); } };
const T = fs.mkdtempSync(path.join(os.tmpdir(), 'eravos-lib-')), B = path.join(T, 'app', 'tools'), D = path.join(T, 'Documents', 'ERAVOS', 'tools');
const put = (base, rel, s) => { const f = path.join(base, rel); fs.mkdirSync(path.dirname(f), { recursive: true }); fs.writeFileSync(f, s); };
const read = (base, rel) => fs.readFileSync(path.join(base, rel), 'utf8');
put(B, 'index.js', 'domains'); put(B, 'music/tools/a/a.engine.js', 'A1'); put(B, 'music/tools/b/b.engine.js', 'B1'); put(B, 'music/node_modules/x.js', 'no'); put(B, 'music/.hidden', 'no');
fs.mkdirSync(D, { recursive: true }); fs.writeFileSync(path.join(D, 'Extra Tool.zip'), 'zip');   // a dropped tool zip already there
let r = L.sync(B, D, { version: '1.0.0' });
ok(r.copied === 3, 'first start copies every tool file: ' + r.copied);
ok(read(D, 'music/tools/a/a.engine.js') === 'A1', 'the library has the tool');
ok(!fs.existsSync(path.join(D, 'music/node_modules')) && !fs.existsSync(path.join(D, 'music/.hidden')), 'node_modules and dot files stay behind');
ok(read(D, 'Extra Tool.zip') === 'zip', 'a dropped zip is untouched');
ok(L.sync(B, D, { version: '1.0.0' }).skipped, 'the same version: nothing to do');
// a new version: a changed file, a file you edited, a removed file, a new file
put(B, 'music/tools/a/a.engine.js', 'A2'); put(D, 'music/tools/b/b.engine.js', 'B-mine'); put(B, 'music/tools/b/b.engine.js', 'B2');
fs.unlinkSync(path.join(B, 'index.js')); put(B, 'music/tools/c/c.engine.js', 'C1');
r = L.sync(B, D, { version: '1.1.0' });
ok(read(D, 'music/tools/a/a.engine.js') === 'A2' && r.updated === 1, 'an untouched file takes the new version');
ok(read(D, 'music/tools/b/b.engine.js') === 'B-mine' && r.kept.includes('music/tools/b/b.engine.js'), 'a file you edited is kept');
ok(!fs.existsSync(path.join(D, 'index.js')) && r.removed === 1, 'a file the app no longer has is removed (untouched)');
ok(read(D, 'music/tools/c/c.engine.js') === 'C1', 'a new file arrives');
ok(L.sync(B, D, { version: '1.2.0' }).kept.includes('music/tools/b/b.engine.js'), 'and stays yours on later versions');
// serving: the library first, the app folder for what the library lacks, never outside
put(B, 'music/only-in-app.js', 'APP');
ok(L.resolve('music/tools/b/b.engine.js', D, B) === path.join(D, 'music/tools/b/b.engine.js'), 'served from the library');
ok(L.resolve('music/only-in-app.js', D, B) === path.join(B, 'music/only-in-app.js'), 'the app folder answers what the library lacks');
ok(L.resolve('../../secret', D, B) === null && L.resolve('music/.hidden', D, B) === null && L.resolve('nope.js', D, B) === null, 'nothing outside, no dot files, missing = null');
ok(L.sync(D, D, {}).skipped, 'the library is never synced onto itself (portable mode)');
fs.rmSync(T, { recursive: true, force: true });
console.log(`library-tools: ${pass}/${pass + fail} passed`); process.exit(fail ? 1 : 0);
