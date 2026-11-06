// node docs/previews/start-page.shots.mjs — the Start page's START FROM section (setups with their paintings first) → docs/previews/start-from.png
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..'), OUT = ROOT + '/docs/previews';
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1280, height: 1000 }, deviceScaleFactor: 2 });
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
p.on('pageerror', e => console.log('ERR', e.message));
await p.goto('file://' + ROOT + '/canvas/index.html'); await p.waitForSelector('.boot', { timeout: 30000 });
await p.waitForTimeout(2500);
const box = await p.evaluate(() => { const secs = [...document.querySelectorAll('.boot-sec')]; const s = secs.find(x => x.textContent === 'START FROM'); s.scrollIntoView({ block: 'start' }); const g = s.nextElementSibling.getBoundingClientRect(), r = s.getBoundingClientRect();
  return { x: g.left - 8, y: r.top - 8, w: g.width + 16, h: g.bottom - r.top + 16, sections: secs.map(x => x.textContent), cards: [...s.nextElementSibling.querySelectorAll('.card b')].map(b => b.textContent) }; });
await p.waitForTimeout(800);
console.log(JSON.stringify({ sections: box.sections, cards: box.cards }));
await p.screenshot({ path: `${OUT}/start-from.png`, clip: { x: box.x, y: box.y, width: box.w, height: Math.min(box.h, 990) } });
await b.close(); console.log('ok');
