// node docs/previews/step-dynamic.shots.mjs — PREVIEW: one Workshop, three steps of the Fiverr pipeline, the UI reshaped by each step's own data
//   → docs/previews/step-dynamic-<step>.png
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 780 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.Erv && window.Workshop);
await p.evaluate(async (text) => { Shell.activate(); Shell.X.enterMode('agents'); document.querySelectorAll('.overlay').forEach(o => o.remove()); await Erv.open(text); await new Promise(x => setTimeout(x, 500)); }, fs.readFileSync(ROOT + '/docs/previews/fiverr-gig.erv', 'utf8'));
await p.evaluate((id) => { const w = CanvasWM.windowOf(id); [...w.querySelectorAll('button')].find(x => /Open in Workshop/.test(x.textContent)).click(); Workshop.current && Workshop.current.close(); }, 'overview');   // the Box registers its kind
for (const id of ['overview', 'on-pricing', 'pricing']) {
  await p.evaluate((id) => { const h = OrganismFactory.handle(id), c = h.ctx, x = c.stateExtra(), q = c.params;
    const L = window.Workshop.open('agents.step', { kind: q.get('kind'), ref: q.get('ref'), step: q.get('step'), state: q.get('state'), kinds: x.kinds, box: x.box, last: x.last });
    const first = window.EravosStepKind && window.Workshop.current; const ls = document.querySelectorAll('.ws-app [data-layer], .ws-app .ws-layer'); if (ls[0]) ls[0].click(); }, id);
  await p.waitForTimeout(500); await p.screenshot({ path: ROOT + `/docs/previews/step-dynamic-${id}.png` });
  await p.evaluate(() => Workshop.current && Workshop.current.close());
}
await b.close(); console.log('ok');
