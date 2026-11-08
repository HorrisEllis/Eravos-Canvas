// node docs/previews/step-workshop.shots.mjs — PREVIEW: a Nexus step opened on the Workshop (the kind orchestration.step), in the real canvas
//   → docs/previews/step-workshop.png. Opens docs/previews/fiverr-gig.erv with Erv.open, then the Box's own "Open in Workshop" on one step.
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 820 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message)); p.on('console', m => { if (m.type() === 'error') console.log('console', m.text()); });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.Erv && window.Workshop);
const id = await p.evaluate(async (text) => { Shell.activate(); Shell.X.enterMode('orchestration'); document.querySelectorAll('.overlay').forEach(o => o.remove());
  await Erv.open(text); await new Promise(x => setTimeout(x, 500));
  return Kernel.registry.list().find(x => x.organism_id === 'eravos.orchestration.box' && x.instance_id === 'overview').instance_id; }, fs.readFileSync(ROOT + '/docs/previews/fiverr-gig.erv', 'utf8'));
await p.evaluate((id) => { const w = CanvasWM.windowOf(id); [...w.querySelectorAll('button')].find(x => /Open in Workshop/.test(x.textContent)).click(); }, id);
await p.waitForTimeout(700);
await p.evaluate(() => { const l = [...document.querySelectorAll('.ws-app *')].find(e => /^GATE$/i.test(e.textContent.trim())); if (l) l.click(); });
await p.waitForTimeout(300);
console.log(await p.evaluate(() => ({ open: !!Workshop.current, kinds: Workshop.kinds() })));
await p.screenshot({ path: ROOT + '/docs/previews/step-workshop.png' }); await b.close(); console.log('ok');
