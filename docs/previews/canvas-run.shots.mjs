// node docs/previews/canvas-run.shots.mjs — PREVIEW: the pipeline's tools on the real canvas, executing, then a step added →
//   docs/previews/canvas-run-1.png (executing) · canvas-run-2.png (a step added and wired in).
// His words, 2026-11-08: "okay show me the tools on the canvas. it executing, adding a step."
// Real: the canvas, the Box tools, the .erv Nexus wrote, the wires, and the values (sent into the first box, passed on by each box along the
// canvas's own wires). Illustrative: the states (done / running / waiting) — set here as COS's run events would set them; not wired yet.
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1400, height: 640 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.Erv);
await p.evaluate(async (text) => { Shell.activate(); Shell.X.enterMode('agents'); document.querySelectorAll('.overlay').forEach(o => o.remove());
  await Erv.open(text); await new Promise(x => setTimeout(x, 400));
  const ctx = (id) => OrganismFactory.handle(id).ctx;
  ctx('overview').params.set('state', 'done'); ctx('on-pricing').params.set('state', 'done'); ctx('pricing').params.set('state', 'running');
  // a real value through the real wires: into overview's in → out to on-pricing → out to pricing
  const src = OrganismFactory.spawn('eravos.agents.box', { x: -400, y: -400 });
  Kernel.wires.register({ src: { instanceId: src, hookId: 'box.hook.out' }, dst: { instanceId: 'overview', hookId: 'box.hook.in' } });
  Kernel.data.send(src, 'out', { category: 'Programming & Tech', subcategory: 'AI Development' }); await new Promise(x => setTimeout(x, 300));
  OrganismFactory.close(src); }, fs.readFileSync(ROOT + '/docs/previews/fiverr-gig.erv', 'utf8'));
await p.waitForTimeout(400);
await p.screenshot({ path: ROOT + '/docs/previews/canvas-run-1.png' });
// adding a step, as a person does: a new Box from Add, set, and wired after pricing
const r = await p.evaluate(async () => { const id = OrganismFactory.spawn('eravos.agents.box', { x: 1000, y: 40 });
  const c = OrganismFactory.handle(id).ctx; c.params.setMany({ kind: 'agent', ref: 'write the description', step: 'cover', state: 'waiting' });
  c.loadExtra({ box: { id: 'cover', kind: 'agent', ref: 'write the description', contract: { requires: ['pricing'], gives: ['output'] } }, kinds: ['gate', 'system', 'agent', 'macro', 'pipeline', 'procedure', 'tool', 'build'] }); c.syncUI();
  const w = Kernel.wires.register({ src: { instanceId: 'pricing', hookId: 'box.hook.out' }, dst: { instanceId: id, hookId: 'box.hook.in' } });
  await new Promise(x => setTimeout(x, 400)); return { added: id, wired: !!(w && w.ok), boxes: Kernel.registry.list().filter(x => x.organism_id === 'eravos.agents.box').length, wires: Kernel.wires.list().length, faults: Kernel.faults.list().slice(-2).map(f => f.message) }; });
console.log(JSON.stringify(r));
await p.screenshot({ path: ROOT + '/docs/previews/canvas-run-2.png' }); await b.close(); console.log('ok');
