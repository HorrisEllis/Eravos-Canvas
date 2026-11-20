// node docs/previews/wobble-builder/built.shots.mjs — the BUILT Wobble Builder on the real canvas (WB1–WB3, 2026-11-20): its window, a slot swapped,
// a mutation, a tool synthesized and opened beside it, the builder exploded on the Field board → built-{window,made,field}.png; prints what happened
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1200 } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; try { localStorage.removeItem('eravos.made-tools.wobble-builder'); localStorage.removeItem('eravos.mutate.eravos.wobble-builder'); } catch (e) {} });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.WobbleBuilder);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); const d = document.getElementById('dock'); if (d) d.style.display = 'none';
  window.__a = OrganismFactory.spawn('eravos.wobble-builder', { x: 20, y: 20 }); });
await p.waitForTimeout(1200);
const info = await p.evaluate(async () => { const h = OrganismFactory.handle(window.__a); await h.ctx.internals.ready; CanvasWM.place(window.__a, { w: 1000, h: 1060 }); CanvasWM.view = { x: 0, y: 0, z: 1 }; CanvasWM.applyView();
  h.view.emit('config_change', { key: 'mouth', value: 'filter-ladder' }); h.view.emit('config_change', { key: 'fx', value: 'delay-line' });
  h.view.emit('audition', { note: 45, velocity: 0.9, duration: 30 }); return { node: !!h.ctx.internals.node(), faults: Kernel.faults.list().slice(-3).map(f => f.code + ' ' + (f.message || '')) }; });
await p.waitForTimeout(900); await p.screenshot({ path: HERE + '/built-window.png' });
const made = await p.evaluate(async () => { const h = OrganismFactory.handle(window.__a); h.view.emit('audition_off', { note: 45 });
  const dock = document.querySelector('.wm-win .fm-dock'); dock.mutateNow(); await new Promise(r => setTimeout(r, 200)); const line = dock.querySelector('.fm-line').textContent; dock.keepNow();
  await new Promise((res) => { const s = document.createElement('script'); s.src = ERAVOS_TOOLS + 'music/compat/novelty.js'; s.onload = res; document.head.appendChild(s); });
  const S = h.ctx.internals.settings(), r = WobbleBuilder.make('Gutter Mouth', S, 120, MusicNovelty);
  const id = r.ok ? OrganismFactory.spawn(r.id, { x: 1060, y: 20 }) : null; await new Promise(res => setTimeout(res, 800));
  const again = WobbleBuilder.make('Gutter Mouth', S, 120, MusicNovelty);
  return { mutated: line, made: r.ok ? r.rec.name + ' · ' + r.verdict + ' · nearest ' + r.near + ' (' + r.d + ')' : r.why, opened: !!id, again: again.ok ? 'made again?!' : again.why }; });
await p.evaluate(() => { CanvasWM.view = { x: 0, y: 0, z: 0.75 }; CanvasWM.applyView(); }); await p.waitForTimeout(400); await p.screenshot({ path: HERE + '/built-made.png' });
const field = await p.evaluate(async () => { document.querySelectorAll('.wm-win').forEach(w => { if (w.dataset.instance !== window.__a) w.style.display = 'none'; }); const x = FieldBoard.explode(window.__a, 'eravos.wobble-builder'); await new Promise(r => setTimeout(r, 300)); return x ? { pieces: x.pieces, missing: x.missing } : null; });
await p.waitForTimeout(400); await p.screenshot({ path: HERE + '/built-field.png' });
console.log(JSON.stringify({ info, made, field }, null, 1)); console.log('errors', errs.slice(0, 6)); await b.close();
