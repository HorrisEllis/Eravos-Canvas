// node tests/no-playwright.mjs — fails if any script loads Playwright. ERAVOS drives its pages with Clear Glass's driver
// (host/driver/glass.js). James, 2026-10-21: "not playright. isn't clearglass in this project". Spec: eravos.phase48-map P48.0.
import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
// no exceptions left: the desktop app tests use the driver's app mode (electron.launch), 2026-11-04 "remove playwright from eravos"
const KNOWN = new Set();
const SKIP = /(^|\/)(node_modules|\.git|dist|\.eravos|host\/driver)(\/|$)/;   // (the driver's own comments name Playwright: it replaces it)
const hits = [], known = [];
(function walk(dir) {
  for (const n of fs.readdirSync(path.join(ROOT, dir))) {
    const rel = dir ? dir + '/' + n : n; if (SKIP.test(rel)) continue;
    const st = fs.statSync(path.join(ROOT, rel));
    if (st.isDirectory()) walk(rel);
    else if (/\.(m?js|cjs)$/.test(n) && /(from|require\()\s*['"](playwright|@playwright\/test)['"]/.test(fs.readFileSync(path.join(ROOT, rel), 'utf8'))) (KNOWN.has(rel) ? known : hits).push(rel);
  }
})('');
known.forEach(f => console.log('known exception (drives the packaged app, not yet on the driver): ' + f));
if (hits.length) { console.log('✗ loads Playwright — use host/driver/glass.js:\n  ' + hits.join('\n  ')); process.exit(1); }
console.log('✓ no script loads Playwright (' + known.length + ' known exceptions listed above)');
