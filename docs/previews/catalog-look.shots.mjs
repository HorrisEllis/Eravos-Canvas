// node docs/previews/catalog-look.shots.mjs — 3.227 (his words, 2026-11-25: "okay, i hate the font. also the green. also i want the thumbnails
// back. and i want those generated per tool, mutated tool, consistent style." · "make it colored. the themes, and the reactive colors."):
//   catalog-look-modes.png  the Modes page: each mode's painting, no green (the theme's colour)
//   catalog-look-made.png   two tools made on the canvas (Wobble Bass × Retro DCO, and one mutated from Wobble Bass), each painted in the cards' style
//   catalog-font-<id>.png   the same page in each font choice (Settings › Look › Font) — for him to pick
import { chromium } from '../../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const HERE = path.dirname(fileURLToPath(import.meta.url)), ROOT = path.resolve(HERE, '../..');
const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1600, height: 900 }, deviceScaleFactor: 2 });
const errs = []; p.on('pageerror', e => errs.push(e.message)); await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; window.ERAVOS_NO_MOTION = true; });
await p.goto('file://' + ROOT + '/canvas/index.html?noboot'); await p.waitForFunction(() => window.Shell && window.Shell.X && window.FieldBoard && window.AssembledTool);
const open = (o) => p.evaluate((o) => { if (AddMenu.isOpen()) AddMenu.close(); AddMenu.show(Shell, Shell.X, o); }, o);
await p.evaluate(() => { Shell.activate(); Shell.X.enterMode('music'); document.querySelectorAll('.toast').forEach(t => t.remove()); });
await open({ view: 'modes' }); await p.waitForTimeout(900); await p.screenshot({ path: HERE + '/catalog-look-modes.png' });
await p.evaluate(async () => { MadeTools.save(AssembledTool.MADE_KEY, []);
  const a = OrganismFactory.spawn('eravos.wobble-bass', { x: 20, y: 20 }), r = OrganismFactory.spawn('eravos.retro-dco', { x: 2600, y: 20 }); await new Promise(res => setTimeout(res, 800));
  const m1 = await AssembledTool.synthesize(a, r), m2 = await AssembledTool.synthesize(r, a, { flip: true });
  const N = await new Promise(res => { const s = document.createElement('script'); s.src = (window.ERAVOS_TOOLS || '') + 'music/compat/novelty.js'; s.onload = () => res(window.MusicNovelty); document.head.appendChild(s); });
  const P = Object.assign(AssembledTool.defaults(), { cutoff: 900, reso: 0.7, rate: '1/16', lfoShape: 'square', drive: 'bitcrusher', dCrushBits: 6 });
  window.__made = [m1, m2, AssembledTool.make('Wobble Bass · mutated', P, 120, N, ['Wobble Bass'])].map(x => x && (x.id || x.why));
  document.querySelectorAll('.toast').forEach(t => t.remove()); });
console.log('made:', await p.evaluate(() => JSON.stringify(window.__made)));
await open({ view: 'cat', cat: 'Bass', q: '' }); await p.waitForTimeout(300);
await p.evaluate(() => { const q = document.querySelector('.ap-search'); q.value = '×'; q.dispatchEvent(new Event('input')); });
await p.waitForTimeout(200);
await p.evaluate(() => { const q = document.querySelector('.ap-search'); q.value = 'synthesized'; q.dispatchEvent(new Event('input')); });
await p.waitForTimeout(900); await p.screenshot({ path: HERE + '/catalog-look-made.png' });
for (const f of ['theme', 'grotesk', 'grotesk-all', 'plain']) {
  await p.evaluate((f) => Themes.setFont(f), f); await open({ view: 'modes' }); await p.waitForTimeout(700);
  await p.evaluate(() => { const m = document.querySelector('.ap-main, .ap-grid'); const g = document.querySelector('.ap-grid'); if (g && g.parentElement) g.parentElement.scrollTop = 0; });
  await p.screenshot({ path: HERE + '/catalog-font-' + f + '.png' });
  const card = await p.$('.ap-grid .ap-card'); if (card) await card.screenshot({ path: HERE + '/catalog-font-card-' + f + '.png' });
  const det = await p.$('.ap-detail, .ap-d'); if (det) await det.screenshot({ path: HERE + '/catalog-font-detail-' + f + '.png' });
}
await p.evaluate(() => { Themes.setFont('theme'); MadeTools.save(AssembledTool.MADE_KEY, []); });
console.log(errs.length ? 'errors: ' + errs.join(' | ') : 'no page errors'); await b.close();
