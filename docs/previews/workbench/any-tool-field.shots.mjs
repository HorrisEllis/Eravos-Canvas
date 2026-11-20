// node docs/previews/workbench/any-tool-field.shots.mjs [ids…] — any tool exploded on the real canvas from its own window (board.js autoLayout,
// 2026-11-20), mutated once → docs/previews/workbench/field-<tool>.png; prints pieces, overlaps, what the mutation did
import { chromium } from '../../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../..'), OUT = (f) => ROOT + '/docs/previews/workbench/' + f;
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ['eravos.retro-dco', 'eravos.piano', 'eravos.tape-memory', 'eravos.swarm-oscillator', 'eravos.supersaw', 'eravos.drum-machine'];
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1800, height: 1100 } });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); const d = document.getElementById('dock'); if (d) d.style.display = 'none'; });
for (const id of ids) {
  const r = await p.evaluate(async (id) => {
    CanvasWM.world.querySelectorAll('.wm-win').forEach(w => { if (!w.closest('#dock')) w.remove(); }); document.querySelectorAll('.fb-board').forEach(e => e.remove());
    if (!OrganismFactory.defined().some(d => d.id === id)) return { id, error: 'not defined' };
    const a = OrganismFactory.spawn(id, { x: 300, y: 120 }); await new Promise(r => setTimeout(r, 900));
    const x = FieldBoard.explode(a, id); if (!x) return { id, error: 'did not explode' };
    await new Promise(r => setTimeout(r, 300));
    const gs = [...document.querySelectorAll('.fb-gate')].map(g => g.getBoundingClientRect()), core = document.querySelector('.fb-core').getBoundingClientRect(); let ov = 0;
    const all = gs.concat([core]); for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const A = all[i], B = all[j]; if (A.left < B.right - 2 && B.left < A.right - 2 && A.top < B.bottom - 2 && B.top < A.bottom - 2) ov++; }
    const dock = document.querySelector('.fb-board .fm-dock'); if (dock) dock.mutateNow(); await new Promise(r => setTimeout(r, 200));
    window.__a = a; return { id, pieces: x.pieces, missing: x.missing, overlaps: ov, dock: !!dock, did: dock ? dock.querySelector('.fm-line').textContent : '' };
  }, id);
  console.log(JSON.stringify(r));
  if (!r.error) await p.screenshot({ path: OUT('field-' + id.replace('eravos.', '') + '.png') });
}
console.log('errors', errs.slice(0, 6)); await b.close();
