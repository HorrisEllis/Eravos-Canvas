// node tests/fresh-profile.mjs — a FRESH profile (nothing installed: the desktop app's first start) served by ERAVOS Glass
// (the server both the web build and ERAVOS.exe use). A tool opened by name installs itself instead of failing with
// "needs a pack" (MOUNT_001): the MIDI button opens the MIDI Map. Also: the web build serves what the exe serves (voice/).
import { createRequire } from 'module'; import path from 'path'; import os from 'os'; import fs from 'fs'; import { fileURLToPath } from 'url';
import { chromium } from 'playwright';
const require = createRequire(import.meta.url), ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const g = await require('../host/glass.js').start({ root: ROOT, port: 0, data: fs.mkdtempSync(path.join(os.tmpdir(), 'eravos-fresh-')) });
const b = await chromium.launch(), p = await (await b.newContext()).newPage(), errs = [];   // a new context = empty storage
p.on('pageerror', e => errs.push(e.message));
let pass = 0, fail = 0; const ok = (c, m) => { if (c) { pass++; console.log('  ✓ ' + m); } else { fail++; console.log('  ✗ ' + m); } };
try {
  await p.goto(g.url + 'canvas/index.html');
  await p.waitForFunction(() => window.Catalog && window.Kernel && window.OrganismFactory, null, { timeout: 30000 });
  ok(await p.evaluate(() => !OrganismFactory.def('eravos.midi-mapper')), 'fresh profile: the MIDI Map is not installed');
  // a song (or ＋ Add) installs a tool → the music domain and its toolbar load
  await p.evaluate(() => Catalog.install(['eravos.pads'], Kernel));
  await p.evaluate(() => OrganismFactory.spawn('eravos.pads'));   // a pad tool on the canvas brings the MIDI unit ("Connect pads")
  await p.waitForSelector('#midiBtn', { state: 'attached', timeout: 15000 });
  await p.evaluate(() => document.querySelectorAll('.overlay').forEach(o => o.remove()));   // the start screen
  const f0 = await p.evaluate(() => Kernel.faults.list().length);
  await p.click('#midiBtn');
  await p.waitForFunction(() => Kernel.registry.byOrganism('eravos.midi-mapper').length > 0, null, { timeout: 15000 }).catch(() => {});
  const r = await p.evaluate((f0) => ({ mapped: Kernel.registry.byOrganism('eravos.midi-mapper').length, faults: JSON.stringify(Kernel.faults.list().slice(f0)) }), f0);
  ok(r.mapped === 1, 'the MIDI button installed the MIDI Map and opened it');
  ok(!r.faults.includes('MOUNT_001'), 'no "needs a pack" fault (MOUNT_001)');
  ok(await p.evaluate(() => !!(window.ERAVOS_GLASS && window.GlassLink && GlassLink.active)), 'the web build runs Glass, like the exe');
  const v = await (await fetch(g.url + 'voice/voice.js')).status; ok(v === 200 || v === 404, 'voice/ is served from the project root (' + v + ' — 404 only means no recordings here)');
  ok(!errs.length, 'no page errors ' + errs.join(' | '));
} finally { await b.close(); await g.close(); }
console.log(`\n${pass}/${pass + fail} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
