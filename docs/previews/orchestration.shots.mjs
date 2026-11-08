// node docs/previews/orchestration.shots.mjs — a Nexus pipeline opened in the real canvas → docs/previews/orchestration.png
// docs/previews/fiverr-gig.erv was written by Nexus (cos/automation/box.eg, `eg run cos/automation/cli.eg erv`) from its fiverr-gig.pipeline;
// it is opened with ERAVOS's own Erv.open, exactly as Start › Open would. Nothing in the canvas is drawn here.
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const file = process.argv[2] || ROOT + '/docs/previews/fiverr-gig.erv', out = process.argv[3] || ROOT + '/docs/previews/orchestration.png';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 760 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.Erv && window.Workspace);
const r = await p.evaluate(async (text) => { Shell.activate(); Shell.X.enterMode('agents'); document.querySelectorAll('.overlay').forEach(o => o.remove());
  const res = await Erv.open(text); await new Promise(x => setTimeout(x, 600));
  return { ok: res.ok, windows: Kernel.registry.list().filter(x => x.organism_id === 'eravos.agents.box').length, wires: Kernel.wires.list().length,
    faults: Kernel.faults.list().slice(-3).map(f => f.message) }; }, fs.readFileSync(file, 'utf8'));
console.log(JSON.stringify(r));
await p.screenshot({ path: out }); await b.close(); console.log('ok');
