// node docs/previews/feelings-spectrum.shots.mjs — 3.240 (his words, 2026-11-26: "Different harmonic and irrational frequencies … Like the full
// spectrum. Like moving across the screen."): Feelings with Across = spectrum, the dot dragged left, middle, right — what the pad says, and any fault.
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] }); const p = await b.newPage({ viewport: { width: 1400, height: 900 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.OrganismFactory);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); document.querySelectorAll('.toast').forEach(t => t.remove()); window.__id = OrganismFactory.spawn('eravos.feelings', { x: 40, y: 20 }); });
await p.waitForTimeout(1200);
const faults = () => p.evaluate(() => JSON.stringify((Kernel.faults && Kernel.faults.list ? Kernel.faults.list() : []).slice(-3)));
const sh = async (name, across, x, y) => {
  await p.evaluate(({ across }) => { const h = OrganismFactory.handle(window.__id); h.ctx.params.set('across', across); }, { across });
  await p.evaluate(async ({ x, y }) => { const c = document.querySelector('canvas[data-pad]'), r = c.getBoundingClientRect(), ev = (t, fx) => c.dispatchEvent(new PointerEvent(t, { bubbles: true, pointerId: 1, clientX: r.left + r.width * fx, clientY: r.top + r.height * y }));
    ev('pointerdown', 0.1); for (let k = 0; k <= 12; k++) { ev('pointermove', 0.1 + (x - 0.1) * k / 12); await new Promise(res => setTimeout(res, 30)); } window.__up = () => ev('pointerup', x); }, { x, y });
  await p.waitForTimeout(500); await p.screenshot({ path: HERE + '/' + name + '.png' }); await p.evaluate(() => window.__up()); await p.waitForTimeout(300);
};
await sh('feelings-colour', 'colour', 0.6, 0.4);
await sh('feelings-spectrum-left', 'spectrum', 0.05, 0.4);
await sh('feelings-spectrum-mid', 'spectrum', 0.5, 0.4);
await sh('feelings-spectrum-right', 'spectrum', 0.95, 0.4);
console.log('faults', await faults()); console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors'); await b.close();
