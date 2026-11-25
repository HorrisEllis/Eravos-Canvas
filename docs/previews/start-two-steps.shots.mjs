// node docs/previews/start-two-steps.shots.mjs — 3.220: Start in two steps — the domains first (start-1-domains.png), then a domain picked:
// its modes, songs and START FROM (start-2-music.png)
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 1 });
const errs = []; p.on('pageerror', e => errs.push(e.message));
await p.goto('file://' + ROOT + '/canvas/index.html'); await p.waitForSelector('.overlay .boot', { timeout: 30000 }); await p.waitForTimeout(800);
const one = await p.evaluate(() => [...document.querySelectorAll('.overlay .boot-sec')].map(e => e.textContent));
await p.screenshot({ path: HERE + '/start-1-domains.png' });
await p.evaluate(() => { const c = [...document.querySelectorAll('.overlay .domain-card')].find(e => /Music/i.test(e.textContent)); c && c.click(); });
await p.waitForTimeout(1500);
const two = await p.evaluate(() => [...document.querySelectorAll('.overlay .boot-sec')].map(e => e.textContent));
await p.screenshot({ path: HERE + '/start-2-music.png' });
// 3.225 back to the domains with Music still on, then Image Manipulation: only its own setups (his: "these shouldn't show in other domains")
await p.evaluate(() => { const b = [...document.querySelectorAll('.overlay button')].find(x => /All domains/.test(x.textContent)); b && b.click(); }); await p.waitForTimeout(400);
await p.evaluate(() => { const c = [...document.querySelectorAll('.overlay .domain-card')].find(e => /Image/i.test(e.textContent)); c && c.click(); }); await p.waitForTimeout(2500);
const three = await p.evaluate(() => [...document.querySelectorAll('.overlay .card b')].map(e => e.textContent));
await p.screenshot({ path: HERE + '/start-3-image.png' }); console.log('image domain cards:', JSON.stringify(three));
console.log('step 1 sections:', JSON.stringify(one)); console.log('step 2 sections:', JSON.stringify(two)); console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors');
await b.close();
