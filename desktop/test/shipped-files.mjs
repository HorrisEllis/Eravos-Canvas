// node desktop/test/shipped-files.mjs — every file the app's main process requires is shipped by BOTH builds (packaging/windows/make-exe.ps1,
// which makes ERAVOS-Setup.exe, and desktop/build.mjs). 0.2.18 → 0.2.19: main.js required ./library-tools.js, make-exe.ps1 did not copy it,
// and ERAVOS would not open ("Cannot find module './library-tools.js'"). This fails before that can ship again.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), D = path.join(ROOT, 'desktop');
const ps = fs.readFileSync(path.join(ROOT, 'packaging/windows/make-exe.ps1'), 'utf8'), bm = fs.readFileSync(path.join(D, 'build.mjs'), 'utf8');
const seen = new Set(), queue = ['main.js', 'preload.js']; let bad = 0;
while (queue.length) {
  const f = queue.shift(); if (seen.has(f)) continue; seen.add(f);
  const src = fs.readFileSync(path.join(D, f), 'utf8');
  for (const m of src.matchAll(/require\(\s*['"]\.\/([\w.\-]+)['"]\s*\)/g)) { const dep = m[1].endsWith('.js') ? m[1] : m[1] + '.js'; if (fs.existsSync(path.join(D, dep))) queue.push(dep); else { console.log('  ✗ ' + f + ' requires ./' + m[1] + ' — not in desktop/'); bad++; } }
}
for (const f of seen) {
  const inPs = new RegExp("desktop\\\\\\\\" + f.replace('.', '\\.') + "'").test(ps) || ps.includes("desktop\\" + f + "'"), inBm = bm.includes("'" + f + "'");
  if (!inPs) { console.log('  ✗ make-exe.ps1 does not copy desktop\\' + f + ' (the Setup would not start)'); bad++; }
  if (!inBm) { console.log('  ✗ build.mjs does not copy ' + f); bad++; }
}
console.log(`shipped-files: ${seen.size} files the app needs (${[...seen].join(', ')}) — ${bad ? bad + ' missing' : 'all shipped by both builds'}`); process.exit(bad ? 1 : 0);
