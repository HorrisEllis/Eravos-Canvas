// node docs/previews/element-synthesis.shots.mjs — PREVIEW (ES1): Piano's face today (left) beside its face synthesised from its elements
// (right: the display and keys kept, the knob cards made by ElementSynthesis from each control's element, in the sound's order) → docs/previews/element-synthesis-piano.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1340, height: 1400 }, deviceScaleFactor: 2 });
p.on('pageerror', e => console.log('ERR', e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.ElementSynthesis && OrganismFactory.def('eravos.piano'), null, { timeout: 90000 });
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); document.querySelectorAll('.overlay').forEach(o => o.remove()); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
await p.evaluate(async () => {
  CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  const A = OrganismFactory.spawn('eravos.piano', { x: 20, y: 20 }), B = OrganismFactory.spawn('eravos.piano', { x: 650, y: 20 });
  await new Promise(r => setTimeout(r, 900));
  const hb = OrganismFactory.handle(B), wb = document.querySelector(`.wm-win[data-instance="${B}"]`);
  const old = [...wb.querySelectorAll('.uk-panel')], more = [...wb.querySelectorAll('button')].find(x => /More depth/.test(x.textContent));
  const syn = ElementSynthesis.face(hb.view || OrganismFactory.makeView(hb, wb), { skip: ['model', 'pedal'] });
  old[0].parentNode.insertBefore(syn, old[0]); old.forEach(x => { x.style.display = 'none'; }); if (more) more.parentNode.style.display = 'none';
  await new Promise(r => setTimeout(r, 200)); CanvasWM.fitToContent(B);
  const t = wb.querySelector('.wm-title, .wm-head b, .wm-head .wm-name'); if (t) t.textContent = 'PIANO · from its elements';
  [A, B].forEach(id => { const c = OrganismFactory.handle(id).ctx; c.params.set('model', 'tine'); });
});
await p.waitForTimeout(900);
const box = await p.evaluate(() => { const ws = [...document.querySelectorAll('.wm-win')].filter(w => !w.closest('#dock')).map(w => w.getBoundingClientRect()); const x = Math.min(...ws.map(r => r.left)) - 6, y = Math.min(...ws.map(r => r.top)) - 6; return { x, y, width: Math.max(...ws.map(r => r.right)) - x + 6, height: Math.max(...ws.map(r => r.bottom)) - y + 6 }; });
await p.screenshot({ path: path.join(ROOT, 'docs/previews/element-synthesis-piano.png'), clip: box }); console.log('shot element-synthesis-piano.png', JSON.stringify(box));
await b.close();
