#!/usr/bin/env node
/* P39 shell test (real page, real wheel): every tool's ⚙ Settings panel scrolls to its last section with the mouse
 * wheel, and the canvas does not move while it does. The bug (3.38): the panel sits on the window frame, outside
 * .wm-body, so the canvas took the wheel and panned — every setting below PACKS was unreachable.
 *   node tests/p39-settings-wheel.mjs   → exit 1 on any failure */
import { chromium } from 'playwright'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); let failed = 0, checked = 0;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 } }); p.on('dialog', d => d.accept());
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.ToolSettings);
const ids = await p.evaluate(() => OrganismFactory.defined().filter(d => !d.dock && ToolSettings.has(d)).map(d => d.id));
for (const id of ids) {
  const inst = await p.evaluate((id) => { OrganismFactory.clearAll && OrganismFactory.clearAll(Kernel); const i = OrganismFactory.spawn(id, { x: 200, y: 120 }); ToolSettings.open(i); return i; }, id);
  if (!inst) { console.log('✗ ' + id + ' did not spawn'); failed++; continue; }
  await p.waitForTimeout(150);
  const g = await p.evaluate((i) => { const h = OrganismFactory.handle(i), pn = h && h._settings; if (!pn) return null; const r = pn.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + Math.min(r.height - 20, 120), tall: pn.scrollHeight > pn.clientHeight + 1, view: JSON.stringify(CanvasWM.view) }; }, inst);
  if (!g) { console.log('✗ ' + id + ' has no settings panel'); failed++; continue; }
  if (!g.tall) continue; checked++;
  await p.mouse.move(g.x, g.y); for (let k = 0; k < 12; k++) await p.mouse.wheel(0, 400); await p.waitForTimeout(120);
  const r = await p.evaluate((i) => { const pn = OrganismFactory.handle(i)._settings; return { bottom: pn.scrollTop + pn.clientHeight >= pn.scrollHeight - 2, view: JSON.stringify(CanvasWM.view) }; }, inst);
  if (!r.bottom || r.view !== g.view) { failed++; console.log(`✗ ${id}: reached bottom ${r.bottom}, canvas moved ${r.view !== g.view}`); }
}
console.log(`${checked} tall settings panels wheeled to the bottom · ${failed} failed${errs.length ? ' · page errors: ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); process.exit(failed || errs.length ? 1 : 0);
