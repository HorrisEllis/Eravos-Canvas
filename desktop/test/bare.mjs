import { _electron as electron } from 'playwright';
import fs from 'fs';
const R = {};
const app = await electron.launch({ executablePath: process.env.ELECTRON, args: ['--no-sandbox', process.env.APP], env: Object.assign({}, process.env, { ERAVOS_LIBRARY: process.env.LIB }) });
const p = await app.firstWindow(); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('dialog', d => { R.dialog = d.message().slice(0, 60); d.accept(); });
await p.waitForFunction(() => document.querySelector('.overlay .boot'), null, { timeout: 30000 });
R.bare = await p.evaluate(() => ({ domains: Kernel.domains.list().length, organisms: OrganismFactory.defined().length, cards: Array.from(document.querySelectorAll('.overlay .hero-card h2, .overlay .card b')).map(e => e.textContent), faults: Kernel.faults.list().length }));
// user drops the core pack, then the effects pack, onto the canvas (start screen still open)
for (const f of ['Music 0 - Core.zip', 'Music 6 - Effects.zip', 'Music 3 - Synths and basses.zip']) {
  const b = fs.readFileSync(process.env.PACKS + '/' + f).toString('base64');
  await p.evaluate(async ([n, b64]) => { const s = atob(b64), u = new Uint8Array(s.length); for (let i = 0; i < s.length; i++) u[i] = s.charCodeAt(i); await ShellIntake.file(n, u.buffer, 'application/zip'); }, [f, b]);
  await p.waitForTimeout(400);
}
R.grown = await p.evaluate(() => ({ domains: Kernel.domains.list().map(d => d.id), organisms: OrganismFactory.defined().map(d => d.label), toolbar: document.querySelectorAll('#slot-bar > *').length, faults: Kernel.faults.list().map(f => f.code), styles: document.querySelectorAll('style[data-pack]').length,
  cards: Array.from(document.querySelectorAll('.overlay .hero-card h2, .overlay .card b')).map(e => e.textContent) }));
await p.waitForTimeout(500);
R.kept = fs.readdirSync(process.env.LIB + '/Packs');
R.errs = errs; await app.close();
// restart: the dropped packs were kept → canvas comes back with them, no prompt
const app2 = await electron.launch({ executablePath: process.env.ELECTRON, args: ['--no-sandbox', process.env.APP], env: Object.assign({}, process.env, { ERAVOS_LIBRARY: process.env.LIB }) });
const p2 = await app2.firstWindow(); await p2.waitForFunction(() => document.querySelector('.overlay .boot'), null, { timeout: 30000 });
R.restart = await p2.evaluate(() => ({ organisms: OrganismFactory.defined().length, loaded: window.ERAVOS_PACKS_LOADED }));
await app2.close();
console.log(JSON.stringify(R, null, 1));
