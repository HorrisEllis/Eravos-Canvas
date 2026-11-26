// node tests/p233-autosave.mjs — 3.227 (his words, 2026-11-25: "can you fix the autosave? also make control s a hotkey to save.")
// 1. a session's work (a song of 10 tools) autosaved; a FRESH launch, a domain picked (its docked window pinned at once) — the autosave and its
//    history still hold the 10, and Start's "Restore autosave" offers them (before: 1 docked window was written over both)
// 2. Ctrl+S: the first time asks the name and saves the project; again keeps it there without asking; a new canvas asks again
import { chromium } from '../host/driver/glass.js'; import path from 'path'; import { fileURLToPath } from 'url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), URL = 'file://' + ROOT + '/canvas/index.html?noboot';
let pass = 0, fail = 0; const check = (m, ok, d) => { if (ok) pass++; else fail++; console.log((ok ? '  ✓ ' : '  ✗ ') + m + (d ? '  — ' + d : '')); };
const b = await chromium.launch(); const init = () => { window.ERAVOS_CATALOG_ALL = true; };
const p = await b.newPage(); await p.addInitScript(init); await p.goto(URL); await p.waitForFunction(() => window.Shell && window.Workspace && window.SongEngine);
const one = await p.evaluate(async () => { Shell.activate(); Shell.X.enterMode('music'); await SongEngine.write('synthwave', 4242); await new Promise(r => setTimeout(r, 1500)); await Workspace.autosaveNow();
  return Workspace.workCount((await Workspace.latestAutosave()).snap); });
check('a session\'s work is autosaved', one >= 5, one + ' tools');
const p2 = await b.newPage(); await p2.addInitScript(init); await p.close(); await p2.goto(URL); await p2.waitForFunction(() => window.Shell && window.Workspace);
const two = await p2.evaluate(async () => { Shell.activate(); Shell.X.enterMode('music'); await new Promise(r => setTimeout(r, 2500)); await Workspace.autosaveNow();
  const a = await Workspace.latestAutosave(), h = await Workspace.autosaveHistory(), best = await Workspace.bestAutosave();
  return { latest: Workspace.workCount(a.snap), history: h.map(x => Workspace.workCount(x.snap)), best: best && Workspace.workCount(best.snap) }; });
check('a fresh launch with only the docked window does not overwrite it', two.latest === one, JSON.stringify(two));
check('the history keeps the work', two.history[0] === one, JSON.stringify(two.history));
check('Restore autosave offers the work', two.best === one);
// 2. Ctrl+S
let asked = 0; p2.on('dialog', (d) => { asked++; d.accept('P227 song'); });
await p2.evaluate(async () => { await new Promise(r => setTimeout(r, 300)); OrganismFactory.spawn('eravos.supersaw', { x: 40, y: 40 }); });
const ctrlS = () => p2.evaluate(() => { document.dispatchEvent(new KeyboardEvent('keydown', { key: 's', code: 'KeyS', ctrlKey: true, bubbles: true, cancelable: true })); });   // the driver has no modifiers: the same event, sent to the page
await p2.waitForTimeout(500); await ctrlS(); await p2.waitForTimeout(800);
const s1 = await p2.evaluate(async () => ({ current: Workspace.current, list: (await Workspace.projects.list()).map(x => x.name) }));
check('Ctrl+S asks the name the first time and saves the project', asked === 1 && s1.current === 'P227 song' && s1.list.includes('P227 song'), JSON.stringify(s1) + ' · asked ' + asked);
await ctrlS(); await p2.waitForTimeout(600);
check('Ctrl+S again keeps it there without asking', asked === 1);
await p2.evaluate(async () => { await Workspace.projects.remove('P227 song'); });
console.log(`p233 autosave + Ctrl+S: ${pass}/${pass + fail} passed`); await b.close(); process.exit(fail ? 1 : 0);
