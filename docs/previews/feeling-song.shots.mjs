// node docs/previews/feeling-song.shots.mjs — pictures of the Feelings pad preview in the real canvas, silent. Not built.
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url'; import fs from 'fs';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1000, height: 800 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); });
await p.evaluate(fs.readFileSync(`${OUT}/feeling-song.preview.js`, 'utf8'));
const id = await p.evaluate(() => { CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  return OrganismFactory.spawn('eravos.feeling-song', { x: 20, y: 20 }); });
await p.evaluate(() => { const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
const path_ = Array.from({ length: 60 }, (_, i) => { const t = i / 59; return [0.3 + 0.35 * t + 0.08 * Math.sin(t * 9), 0.7 - 0.4 * t + 0.06 * Math.cos(t * 7), 1]; });
await p.evaluate(([id, pt]) => { const v = OrganismFactory.handle(id); const view = CanvasWM.windowOf(id); window.__fsView = view; }, [id, path_]);
for (const f of ['sadness', 'anger', 'love']) {
  await p.evaluate(([id, f, pt]) => { const r = CanvasWM.windowOf(id).querySelector('canvas'); const root = r.closest('.wm-win');
    const v = Object.values(OrganismFactory.handle(id).views || {})[0] || null; (window.__views = window.__views || []);
    [...root.querySelectorAll('button')].filter(b => b.textContent.trim().toLowerCase() === f).forEach(b => b.click());
    const last = pt[pt.length - 1]; const box = r.getBoundingClientRect();
    const ev = (t, x, y) => r.dispatchEvent(new PointerEvent(t, { bubbles: true, clientX: box.left + x * box.width, clientY: box.top + y * box.height }));
    ev('pointerdown', pt[0][0], pt[0][1]); }, [id, f, path_]);
  for (const q of path_) { await p.evaluate(([id, q]) => { const r = CanvasWM.windowOf(id).querySelector('canvas'), box = r.getBoundingClientRect();
    window.dispatchEvent(new PointerEvent('pointermove', { clientX: box.left + q[0] * box.width, clientY: box.top + q[1] * box.height })); }, [id, q]); await p.waitForTimeout(25); }
  await p.waitForTimeout(300);
  await (await p.$(`.wm-win[data-instance="${id}"]`)).screenshot({ path: `${OUT}/feeling-song-${f}.png` });
  await p.evaluate(() => window.dispatchEvent(new PointerEvent('pointerup')));
}
await b.close(); console.log('ok');
