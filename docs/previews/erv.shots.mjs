// node docs/previews/erv.shots.mjs — .erv: the Open dialog with a real file's layers → docs/previews/erv-open.png, and the file → docs/previews/example.erv
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.Erv);
const text = await p.evaluate(async () => { Shell.activate(); Shell.X.enterMode('music'); document.querySelectorAll('.overlay').forEach(o => o.remove());
  const a = OrganismFactory.spawn('eravos.swarm-oscillator', { x: 40, y: 40 }), b2 = OrganismFactory.spawn('eravos.fx-echo', { x: 700, y: 40 }), c = OrganismFactory.spawn('eravos.retro-poly', { x: 40, y: 760 });
  Kernel.wires.register({ src: { instanceId: a, hookId: 'so.hook.audio_out' }, dst: { instanceId: b2, hookId: 'fx.hook.audio_in' } });
  Kernel.wires.register({ src: { instanceId: a, hookId: 'so.hook.coherence' }, dst: { instanceId: c, hookId: 'rp.hook.mod_cutoff' } });
  await new Promise(r => setTimeout(r, 300)); return Erv.toErv(Workspace.snapshot(), { name: 'Night Drive' }); });
fs.writeFileSync(ROOT + '/docs/previews/example.erv', text);
await p.evaluate((t) => Erv.dialog(t, 'Night Drive.erv'), text); await p.waitForTimeout(400);
await p.screenshot({ path: ROOT + '/docs/previews/erv-open.png' });
await b.close(); console.log('ok', text.split('\n').length, 'lines');
