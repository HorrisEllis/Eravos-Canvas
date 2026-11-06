// node docs/previews/pattern-editor.shots.mjs — the Pattern Editor preview in the real canvas → docs/previews/pattern-editor-preview.png
import { chromium } from '../../host/driver/glass.js'; import fs from 'fs'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 1300 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.EravosTimelinePianoRoll && window.MusicParts && MusicParts.PatternStore);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); document.querySelectorAll('.overlay').forEach(o => o.remove()); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
await p.evaluate(fs.readFileSync(ROOT + '/docs/previews/pattern-editor.preview.js', 'utf8'));
const id = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView(); return OrganismFactory.spawn('eravos.pattern-editor', { x: 10, y: 10 }); });
await p.waitForTimeout(1200);
console.log(await p.evaluate((id) => Kernel.faults.list().slice(-3).map(f => f.message).join(' | '), id));
await (await p.$(`.wm-win[data-instance="${id}"]`)).screenshot({ path: ROOT + '/docs/previews/pattern-editor-preview.png' });
await b.close(); console.log('ok');
