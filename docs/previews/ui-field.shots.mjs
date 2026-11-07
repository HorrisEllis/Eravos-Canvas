// node docs/previews/ui-field.shots.mjs — the UI from a DAG, laid out by a constraint field, on the real Swarm Oscillator (preview)
// → docs/previews/ui-field-free.png, ui-field-coupled.png, ui-field-harmonic.png (each: the window as the field lays it out, the DAG beside it)
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; }); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(async () => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  window.__sw = OrganismFactory.spawn('eravos.swarm-oscillator', { x: 20, y: 20 }); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
await p.waitForTimeout(600); await p.evaluate(() => CanvasWM.place(window.__sw, { w: 640, h: 830 })); await p.waitForTimeout(200); await p.evaluate(fs.readFileSync(ROOT + '/docs/previews/ui-field.preview.js', 'utf8'));
for (const mode of ['free', 'coupled', 'harmonic']) {
  const r = await p.evaluate((mode) => { CanvasWM.view = { x: 0, y: 0, z: 0.7 }; CanvasWM.applyView(); const w0 = CanvasWM.windowOf(window.__sw); w0.style.height = '815px'; w0.style.maxHeight = 'none'; w0.querySelectorAll('*').forEach(e => { const cs = getComputedStyle(e); if (cs.overflowY === 'auto' || cs.overflowY === 'scroll' || cs.overflowY === 'hidden') { e.style.overflow = 'visible'; e.style.maxHeight = 'none'; } }); Kernel.bus.publish('ui:config_change:' + window.__sw, { key: 'mode', value: mode }); const out = window.__uiField({ mode, shape: 'saw' }); window.__uiDag(500, 70, 920, 810, { mode, shape: 'saw' }); return out.slice(0, 12).join(' '); }, mode);
  await p.waitForTimeout(700); console.log(mode, '→', r); await p.screenshot({ path: ROOT + `/docs/previews/ui-field-${mode}.png` });
}
await b.close(); console.log('ok');
