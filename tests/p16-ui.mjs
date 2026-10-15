// P16 UI checks against the real shell (node tests/p16-ui.mjs [outDir]) — start-screen Song Engine section, Connect menu,
// windows open un-clipped, recorder ▶ leaves the canvas silent. Screenshots land in outDir (default: tests/out).
import { chromium } from 'playwright';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = process.argv[2] || path.join(ROOT, 'tests', 'out');
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
const results = []; const check = (name, ok, info) => { results.push({ name, ok: !!ok, info }); console.log(`  ${ok ? '✓' : '✗'} ${name}${info ? '  — ' + info : ''}`); };
await p.goto('file://' + ROOT + '/canvas/index.html'); await p.waitForSelector('.overlay .boot', { timeout: 15000 });
// enter Music Production from the start screen
await p.evaluate(() => { const m = Array.from(document.querySelectorAll('.mode-card')).find(c => /Music Production/.test(c.textContent)); m && m.click(); });
await p.waitForTimeout(300);
const modes = await p.evaluate(() => Array.from(document.querySelectorAll('.mode-card b')).map(b => b.textContent.replace(/\s+✓$/, '').trim()));
check('two modes on the start screen: Music Production + Lab', modes.length === 2 && modes.some(m => /Music Production/.test(m)) && modes.some(m => /Lab/.test(m)), modes.join(' | '));
const sec = await p.evaluate(() => { const s = Array.from(document.querySelectorAll('.boot-sec')).find(x => /SONG ENGINE/.test(x.textContent)); return s ? s.nextElementSibling.querySelectorAll('.card').length : 0; });
check('start screen has a SONG ENGINE section with every genre', sec >= 12, sec + ' cards');
await p.screenshot({ path: path.join(OUT, 'start-screen.png') });
// press Synthwave
await p.evaluate(() => { const c = Array.from(document.querySelectorAll('.card')).find(x => /Synthwave/.test(x.textContent)); c.click(); });
await p.waitForTimeout(1500);
const built = await p.evaluate(() => ({ wins: document.querySelectorAll('.wm-win').length, faults: Kernel.faults.list().map(f => f.fault_class + ' ' + f.message), name: (Kernel.registry.byOrganism('eravos.session')[0] ? OrganismFactory.handle(Kernel.registry.byOrganism('eravos.session')[0].instance_id).ctx.params.get('songName') : '') }));
check('a click writes a whole song (windows on the canvas, no faults)', built.wins >= 8 && !built.faults.length, `${built.wins} windows · “${built.name}” · faults ${built.faults.length}`);
await p.screenshot({ path: path.join(OUT, 'song-engine-synthwave.png') });
// Connect menu: click the plug on the lead
const lead = await p.evaluate(() => Kernel.registry.list().find(r => r.organism_id === 'eravos.retro-poly').instance_id);
const plug = await p.$(`.wm-win[data-instance="${lead}"] .wm-plug`);
await p.evaluate((id) => { const w = document.querySelector(`.wm-win[data-instance="${id}"]`); w.style.zIndex = 99999; CanvasWM.view = { x: 40 - parseFloat(w.style.left), y: 60 - parseFloat(w.style.top), z: 1 }; CanvasWM.applyView(); }, lead);
await p.waitForTimeout(200);
await plug.click(); await p.waitForTimeout(250);
const menu = await p.evaluate(() => { const m = document.querySelector('.wire-menu'); return m ? { items: m.querySelectorAll('.wire-menu-item').length, on: m.querySelectorAll('.wire-menu-item.on').length, text: m.textContent.slice(0, 160) } : null; });
check('clicking a window’s plug opens “Connect to…” with every compatible input', menu && menu.items > 2, menu ? `${menu.items} targets, ${menu.on} already connected` : 'no menu');
await p.screenshot({ path: path.join(OUT, 'connect-menu.png') });
const w0 = await p.evaluate(() => Kernel.wires.list().length);
await p.evaluate(() => { const it = Array.from(document.querySelectorAll('.wire-menu-item')).find(x => !x.classList.contains('on') && /Channel|Master|Filter|Echo|Mod/.test(x.textContent)) || Array.from(document.querySelectorAll('.wire-menu-item')).find(x => !x.classList.contains('on')); it.click(); });
await p.waitForTimeout(200);
const w1 = await p.evaluate(() => Kernel.wires.list().length);
check('one click in the menu connects (a wire is registered)', w1 === w0 + 1, `${w0} → ${w1}`);
await p.keyboard.press('Escape');
// windows open un-clipped
const clip = await p.evaluate(async () => {
  const bad = [];
  for (const id of ['eravos.retro-poly', 'eravos.organ', 'eravos.xy-pad', 'eravos.wobble-bass', 'eravos.supersaw', 'eravos.lfo', 'eravos.xen-synth', 'eravos.dub-station', 'eravos.bass-forge']) {
    const i = OrganismFactory.spawn(id); await new Promise(r => setTimeout(r, 450));
    const w = document.querySelector(`.wm-win[data-instance="${i}"] .wm-body`); if (w.scrollHeight - w.clientHeight > 3 && w.closest('.wm-win').offsetHeight < 1100) bad.push(id + ' ' + (w.scrollHeight - w.clientHeight) + 'px');
    OrganismFactory.close(i);
  }
  return bad;
});
check('tools open showing everything (no clipped controls)', !clip.length, clip.join(', '));
// recorder ▶ with nothing recorded does not start the canvas
const rec = await p.evaluate(async () => { const r = Kernel.registry.byOrganism('eravos.song-recorder')[0]; let n = 0; const u = Kernel.bus.subscribe('ui:transport-play', () => n++); Kernel.bus.publish('ui:play:' + r.instance_id, {}); await new Promise(r => setTimeout(r, 100)); return n; });
check('Song Recorder ▶ does not start the canvas transport', rec === 0, rec + ' transport starts');
if (errs.length) console.log('page errors:', errs.slice(0, 5));
const fail = results.filter(r => !r.ok).length;
console.log(`\n${results.length - fail}/${results.length} UI checks passed`);
await b.close(); process.exit(fail || errs.length ? 1 : 0);
