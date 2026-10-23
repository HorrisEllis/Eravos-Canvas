#!/usr/bin/env node
/* P39 shell test (real page, real wheel): every tool's ⚙ Settings panel scrolls to its last section with the mouse
 * wheel, and the canvas does not move while it does. The bug (3.38): the panel sits on the window frame, outside
 * .wm-body, so the canvas took the wheel and panned — every setting below PACKS was unreachable.
 *   node tests/p39-settings-wheel.mjs   → exit 1 on any failure */
import { chromium } from '../host/driver/glass.js';   // Clear Glass's driver, not Playwright (his call, 2026-10-21) import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = process.argv[2] || path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'); let failed = 0, checked = 0;
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 } }); p.on('dialog', d => d.accept());
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });   // P41 catalog: a fresh profile installs no tools — this script needs every one
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.ToolSettings);
const ids = await p.evaluate(() => OrganismFactory.defined().filter(d => !d.dock && ToolSettings.has(d)).map(d => d.id));
for (const id of ids) {
  const inst = await p.evaluate((id) => { OrganismFactory.clearAll && OrganismFactory.clearAll(Kernel); const i = OrganismFactory.spawn(id, { x: 200, y: 120 }); ToolSettings.open(i); return i; }, id);
  if (!inst) { console.log('✗ ' + id + ' did not spawn'); failed++; continue; }
  await p.waitForTimeout(150);
  const g = await p.evaluate((i) => { const h = OrganismFactory.handle(i), pn = h && h._settings; if (!pn) return null; const r = pn.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + Math.min(r.height - 20, 120), tall: pn.scrollHeight > pn.clientHeight + 1, view: JSON.stringify(CanvasWM.view) }; }, inst);
  if (!g) { console.log('✗ ' + id + ' has no settings panel'); failed++; continue; }
  if (!g.tall) continue; checked++;
  const params0 = await p.evaluate((i) => JSON.stringify(OrganismFactory.handle(i).ctx.params.all()), inst);
  await p.mouse.move(g.x, g.y); for (let k = 0; k < 12; k++) { await p.mouse.wheel(0, 400); await p.waitForTimeout(30); } await p.waitForTimeout(120);   // one gesture (gaps < 300 ms)
  const r = await p.evaluate((i) => { const pn = OrganismFactory.handle(i)._settings; return { bottom: pn.scrollTop + pn.clientHeight >= pn.scrollHeight - 2, view: JSON.stringify(CanvasWM.view), params: JSON.stringify(OrganismFactory.handle(i).ctx.params.all()) }; }, inst);
  // 3.39: scrolling must not turn the knobs that slide under the cursor (FX Dynamics' gate release went 120 → 113)
  const turned = (() => { const a = JSON.parse(params0), c = JSON.parse(r.params); return Object.keys(a).filter(k => JSON.stringify(a[k]) !== JSON.stringify(c[k])); })();
  if (!r.bottom || r.view !== g.view || turned.length) { failed++; console.log(`✗ ${id}: reached bottom ${r.bottom}, canvas moved ${r.view !== g.view}${turned.length ? ', scrolling turned ' + turned.join(', ') : ''}`); }
}
// a wheel gesture that STARTS on a knob still turns it (the rule must not take the wheel away from the knobs)
{ await p.waitForTimeout(400);
  const inst = await p.evaluate(() => { OrganismFactory.clearAll(Kernel); const i = OrganismFactory.spawn('eravos.fx-dynamics', { x: 200, y: 120 }); ToolSettings.open(i); return i; }); await p.waitForTimeout(200);
  const k = await p.evaluate((i) => { const s = OrganismFactory.handle(i)._settings.querySelector('.uk-knob svg'); s.scrollIntoView({ block: 'center' }); const r = s.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + r.height / 2 }; }, inst);
  const v0 = await p.evaluate((i) => JSON.stringify(OrganismFactory.handle(i).ctx.params.all()), inst);
  await p.mouse.move(k.x, k.y); await p.waitForTimeout(400); for (let n = 0; n < 3; n++) { await p.mouse.wheel(0, -100); await p.waitForTimeout(30); } await p.waitForTimeout(100);
  const v1 = await p.evaluate((i) => JSON.stringify(OrganismFactory.handle(i).ctx.params.all()), inst);
  if (v0 === v1) { failed++; console.log('✗ a wheel gesture that starts on a knob no longer turns it'); } else console.log('✓ a wheel gesture that starts on a knob turns it'); }
console.log(`${checked} tall settings panels wheeled to the bottom · ${failed} failed${errs.length ? ' · page errors: ' + errs.slice(0, 3).join(' | ') : ''}`);
await b.close(); process.exit(failed || errs.length ? 1 : 0);
