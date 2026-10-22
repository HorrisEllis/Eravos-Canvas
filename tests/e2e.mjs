// E2E: build the raven-drop song with a (synthetic) vocal, bounce it, save the WAV + screenshots
import { chromium } from '../host/driver/glass.js';   // Clear Glass's driver, not Playwright (his call, 2026-10-21)
import fs from 'fs';
const OUT = process.argv[2] || '/tmp/claude-0/e2e';
const vocal = fs.readFileSync(OUT + '/give_your_head_a_shake.wav').toString('base64');
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1900, height: 1150 } });
const errs = []; p.on('pageerror', e => errs.push('PAGEERR ' + e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });   // P41 catalog: a fresh profile installs no tools — this script needs every one
await p.goto('file:///home/claude/eravos/canvas/index.html?noboot');
await p.waitForTimeout(400);
const rep = await p.evaluate(async () => {
  Kernel.audio.boot(); Transport.boot(); await Kernel.audio.ctx.resume();
  const r = await Recipes.run('eravos.recipe.raven-drop', { clear: true, origin: { x: 30, y: 20 } });
  window.__alias = r.alias; CanvasWM.fitAll();
  window.__files = []; Workspace.download = (name, data, mime) => { window.__files.push({ name, data, mime }); };
  return { mounted: r.mounted.length, wires: r.wires.length, faults: r.faults.map(f => f.fault_class + ' ' + f.message) };
});
console.log('recipe:', JSON.stringify(rep));
await p.waitForTimeout(800);
await p.screenshot({ path: OUT + '/1-recipe.png' });
const v = await p.evaluate(async (b64) => {
  const bin = atob(b64); const ab = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) ab[i] = bin.charCodeAt(i);
  const A = window.__alias;
  Kernel.bus.publish('ui:load:' + A.vocal, { arrayBuffer: ab.buffer, name: 'give_your_head_a_shake.wav' });
  await new Promise(r => setTimeout(r, 600));
  Kernel.bus.publish('ui:send:' + A.vocal, { target: A.drop });
  await new Promise(r => setTimeout(r, 400));
  Kernel.bus.publish('ui:config_change:' + A.drop, { key: 'stutter', value: 3 });
  const dr = OrganismFactory.handle(A.drop).ctx;
  const ss = OrganismFactory.handle(A.session).ctx;
  return { vocal: dr.internals.vox && dr.internals.vox.name, bounceBars: ss.params.get('bounceBars'), coachStep: OrganismFactory.handle(A.coach).ctx.params.get('step') };
}, vocal);
console.log('vocal:', JSON.stringify(v));
await p.screenshot({ path: OUT + '/2-vocal.png' });
const t0 = Date.now();
await p.evaluate(() => { Kernel.bus.publish('ui:bounce:' + window.__alias.session, {}); });
// wait for the bounce file
let done = null;
for (let i = 0; i < 200 && !done; i++) { await p.waitForTimeout(1000); done = await p.evaluate(() => window.__files.find(f => /\.wav$/.test(f.name)) ? true : null); if (i === 20) await p.screenshot({ path: OUT + '/3-playing.png' }); }
console.log('bounce seconds', (Date.now() - t0) / 1000);
const res = await p.evaluate(() => {
  const f = window.__files.find(f => /\.wav$/.test(f.name)); if (!f) return null;
  const u = new Uint8Array(f.data); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000));
  return { name: f.name, b64: btoa(s), faults: Kernel.faults.list().map(x => x.fault_class + ' ' + x.message), coach: OrganismFactory.handle(window.__alias.coach).ctx.params.get('step') };
});
if (res) { fs.writeFileSync(OUT + '/' + res.name, Buffer.from(res.b64, 'base64')); console.log('wrote', res.name, 'faults', JSON.stringify(res.faults.slice(0, 20)), 'coach step', res.coach); }
else console.log('NO WAV');
if (errs.length) console.log('console:\n' + errs.slice(0, 30).join('\n'));
await b.close();
