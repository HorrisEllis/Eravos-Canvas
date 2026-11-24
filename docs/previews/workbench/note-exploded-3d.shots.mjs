// node docs/previews/workbench/note-exploded-3d.shots.mjs — a note open in the Workshop, 3D · EXPLODED · LIT: every layer of it a plane, stacked
// (his screenshot, 2026-11-24: "like this") → note-exploded-3d.png (the README's "Blow a note apart")
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__tl = OrganismFactory.spawn('eravos.timeline', { x: 20, y: 20, w: 1250, h: 560 }); });
await p.waitForTimeout(800);
await p.evaluate(async () => { const id = window.__tl, pub = (t, pl) => Kernel.bus.publish('ui:' + t + ':' + id, pl), sleep = (ms) => new Promise(r => setTimeout(r, ms));
  pub('lane_add', { kind: 'inst', name: 'Lead' }); await sleep(80); pub('clip_add', { kind: 'notes', startBar: 1, bars: 2, notes: [0, 3, 7, 10, 12, 10, 7, 3].map((x, i) => ({ s: i * 4, l: 4, n: 57 + x, v: 0.8 })) }); await sleep(100);
  const H = OrganismFactory.handle(id); H.view.openClip(H.ctx.internals.clips.find(c => c.kind === 'notes').id); await sleep(300);
  H.view.roll.openWorkshop(2); await sleep(500);
  const chip = (t) => [...document.querySelectorAll('.ws-vph .ws-chip, .ws-chip')].find(c => c.textContent.trim() === t);
  ['3D', 'EXPLODED', 'LIT'].forEach(t => { const c = chip(t); if (c && !c.classList.contains('on')) c.click(); }); await sleep(600); });
await p.waitForTimeout(800); await p.screenshot({ path: HERE + '/note-exploded-3d.png' });
console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors'); await b.close();
