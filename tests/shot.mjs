// node shot.mjs out.png "js to run in page (async)" [w h]
import { chromium } from 'playwright';
const [,, out, code, w, h] = process.argv;
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: +(w || 1600), height: +(h || 1000) } });
const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.text()); });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });   // P41 catalog: a fresh profile installs no tools — this script needs every one
await p.goto('file:///home/claude/eravos/canvas/index.html?noboot');
await p.waitForTimeout(300);
if (code) { const r = await p.evaluate(new Function('return (async()=>{' + code + '})()')); if (r !== undefined) console.log('result:', JSON.stringify(r)); }
await p.waitForTimeout(1200);
await p.screenshot({ path: out });
if (errs.length) console.log('errors:\n' + errs.slice(0, 20).join('\n'));
await b.close();
