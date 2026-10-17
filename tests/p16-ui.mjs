// P16 UI checks against the real shell (node tests/p16-ui.mjs [outDir]) — start screen, every genre in 📖 Songs, Connect menu,
// windows open un-clipped, recorder ▶ leaves the canvas silent. Screenshots land in outDir (default: tests/out).
import { chromium } from 'playwright';
import path from 'path'; import fs from 'fs'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = process.argv[2] || path.join(ROOT, 'tests', 'out');
fs.mkdirSync(OUT, { recursive: true });
const b = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required'] });
const p = await b.newPage({ viewport: { width: 1500, height: 1000 } }); const errs = []; p.on('pageerror', e => errs.push(e.message));
const results = []; const check = (name, ok, info) => { results.push({ name, ok: !!ok, info }); console.log(`  ${ok ? '✓' : '✗'} ${name}${info ? '  — ' + info : ''}`); };
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });   // P41 catalog: a fresh profile installs no tools — this script needs every one
await p.goto('file://' + ROOT + '/canvas/index.html'); await p.waitForSelector('.overlay .boot', { timeout: 15000 });
// enter Music Production from the start screen
await p.evaluate(() => { const m = Array.from(document.querySelectorAll('.mode-card')).find(c => /Music Production/.test(c.textContent)); m && m.click(); });
await p.waitForTimeout(300);
const modes = await p.evaluate(() => Array.from(document.querySelectorAll('.mode-card b')).map(b => b.textContent.replace(/\s+✓$/, '').trim()));
// 3.37: every installed domain has a card (Music, Image, Video, AI, Coding …) and Lab is one of Music's modes
check('Music Production and Lab are on the start screen', modes.some(m => /Music Production/.test(m)) && modes.some(m => /Lab/.test(m)), modes.join(' | '));
await p.screenshot({ path: path.join(OUT, 'start-screen.png') });
// 3.34: the Song Engine moved off the start screen into 📖 Songs — every genre must have a card there
await p.evaluate(() => { const c = Array.from(document.querySelectorAll('.overlay .card')).find(x => /Empty canvas/.test(x.textContent)); c && c.click(); });
await p.waitForFunction(() => window.SongEngine && window.Songbook && document.getElementById('songbookBtn'), null, { timeout: 15000 }); await p.click('#songbookBtn'); await p.waitForSelector('.overlay.sbk');
const cover = await p.evaluate(() => { const shown = new Set(window.Songbook.all().map(s => s.genre)); return window.SongEngine.genres().filter(g => !shown.has(g.id)).map(g => g.id); });
check('📖 Songs has a card for every Song Engine genre', cover.length === 0, cover.length ? 'missing: ' + cover.join(', ') : 'every genre');
// write the synthwave song the way a person does: click its card, press ▶ Write this song
await p.evaluate(() => { const c = Array.from(document.querySelectorAll('.sbk-card')).find(x => /Synthwave/.test(x.textContent)); c.click(); });
await p.click('.sbk-go'); await p.waitForTimeout(2500);
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
// every control is reachable: a window's body scrolls to its end with the real mouse wheel (3.39: the Wobble editor, the Organ's
// amp + rotary grew past the opening size on a 1000-px screen — fine if you can scroll to them; not fine if a knob ate the wheel)
const unreach = [], tall = [];
for (const id of ['eravos.retro-poly', 'eravos.organ', 'eravos.xy-pad', 'eravos.wobble-bass', 'eravos.supersaw', 'eravos.lfo', 'eravos.xen-synth', 'eravos.dub-station', 'eravos.bass-forge']) {
  const inst = await p.evaluate((id) => OrganismFactory.spawn(id, { x: 40, y: 40 }), id); await p.waitForTimeout(450);
  // the gesture starts on the panel itself (its left padding), not on a control — a wheel that starts on a knob turns the knob
  const g = await p.evaluate((i) => { const win = document.querySelector(`.wm-win[data-instance="${i}"]`); win.style.zIndex = 99999; CanvasWM.view = { x: 40 - parseFloat(win.style.left), y: 60 - parseFloat(win.style.top), z: 1 }; CanvasWM.applyView();
    const w = win.querySelector('.wm-body'), r = w.getBoundingClientRect(); return { x: r.x + 4, y: r.y + r.height / 2, extra: w.scrollHeight - w.clientHeight }; }, inst);
  if (g.extra <= 3) { await p.evaluate((i) => OrganismFactory.close(i), inst); continue; } tall.push(id.replace('eravos.', '') + ' ' + g.extra + 'px');
  await p.mouse.move(g.x, g.y); for (let k = 0; k < 14; k++) { await p.mouse.wheel(0, 300); await p.waitForTimeout(25); } await p.waitForTimeout(150);
  const end = await p.evaluate((i) => { const w = document.querySelector(`.wm-win[data-instance="${i}"] .wm-body`); return w.scrollTop + w.clientHeight >= w.scrollHeight - 2; }, inst);
  if (!end) unreach.push(id);
  await p.evaluate((i) => OrganismFactory.close(i), inst);
}
check('every control in a tool window is reachable (the body wheels to its end)', !unreach.length, (unreach.length ? 'stuck: ' + unreach.join(', ') + ' · ' : '') + (tall.length ? 'taller than their window: ' + tall.join(', ') : 'all fit'));
// recorder ▶ with nothing recorded does not start the canvas
const rec = await p.evaluate(async () => { const r = Kernel.registry.byOrganism('eravos.song-recorder')[0]; let n = 0; const u = Kernel.bus.subscribe('ui:transport-play', () => n++); Kernel.bus.publish('ui:play:' + r.instance_id, {}); await new Promise(r => setTimeout(r, 100)); return n; });
check('Song Recorder ▶ does not start the canvas transport', rec === 0, rec + ' transport starts');
if (errs.length) console.log('page errors:', errs.slice(0, 5));
const fail = results.filter(r => !r.ok).length;
console.log(`\n${results.length - fail}/${results.length} UI checks passed`);
await b.close(); process.exit(fail || errs.length ? 1 : 0);
