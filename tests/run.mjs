// Playwright runner: node tests/run.mjs [filter]  → runs tests/run.html in Chromium, prints results
import { chromium } from 'playwright';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const filter = process.argv[2] || '';
// RCA 3.28: the whole suite in ONE page ran the renderer out of memory around test 330 (hundreds of offline audio
// universes) — the tab crashed and page.evaluate waited forever ("the full run hangs"). Now: batches of suites, each in a
// fresh page; a crash names its batch instead of hanging.
import fs from 'fs';
const root = path.join(__dirname, '..');
const read = (rel) => fs.readFileSync(path.join(root, rel), 'utf8');
const list = (dir, re) => fs.readdirSync(path.join(root, dir)).filter(f => re.test(f)).map(f => dir + '/' + f);
const skeleton = [...list('kernel', /\.js$/), ...list('runtime', /\.(js|css)$/), 'index.html', 'scripts.js'];
// every tool's code: domains/<d>/tools/<category>/<tool>/*.js (the generated packs/index.js is data, not tool code)
const toolDirs = fs.readdirSync(path.join(root, 'domains')).filter(d => fs.existsSync(path.join(root, 'domains', d, 'tools')))
  .flatMap(d => fs.readdirSync(path.join(root, 'domains', d, 'tools')).filter(c => fs.statSync(path.join(root, 'domains', d, 'tools', c)).isDirectory())
    .flatMap(c => fs.readdirSync(path.join(root, 'domains', d, 'tools', c)).filter(t => fs.existsSync(path.join(root, 'domains', d, 'tools', c, t, 'tool.json'))).map(t => `domains/${d}/tools/${c}/${t}`)));
const organismFiles = toolDirs.flatMap(dir => list(dir, /\.js$/).filter(f => !/\.test\.js$/.test(f)));   // a tool's own tests are not tool code
const SOURCES = { skeleton: Object.fromEntries(skeleton.map(f => [f, read(f)])), organisms: Object.fromEntries(organismFiles.map(f => [f, read(f)])) };
const BATCH = Number(process.env.BATCH || 8);
const browser = await chromium.launch({ args: ['--autoplay-policy=no-user-gesture-required', '--use-fake-ui-for-media-stream', '--js-flags=--max-old-space-size=4096'] });
const errors = [];
async function openPage() {
  const page = await browser.newPage();
  await page.addInitScript((src) => { window.__SOURCES = src; }, SOURCES);
  page.on('pageerror', e => errors.push('pageerror: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  if (process.env.PROGRESS) await page.exposeFunction('__onResult', (r) => console.log(`  ${r.ok ? '✓' : '✗'} [${r.phase}] ${r.suite} › ${r.test} (${r.ms}ms)`));
  await page.goto('file://' + path.join(__dirname, 'run.html') + '?auto=0');
  await page.waitForFunction(() => window.runAll, null, { timeout: 20000 });
  return page;
}
const first = await openPage();
const all = await first.evaluate(() => listSuites()); await first.close();
const want = all.filter(s => !filter || s.name.includes(filter) || (s.phase || '').includes(filter)).map(s => s.i);
const res = { pass: 0, fail: 0, total: 0, results: [] };
for (let b = 0; b < want.length; b += BATCH) {
  const idx = want.slice(b, b + BATCH), page = await openPage();
  const crashed = new Promise(r => page.on('crash', () => r('crash')));
  const out = await Promise.race([page.evaluate(async (i) => await window.runAll('', i), idx), crashed]);
  if (out === 'crash') { console.log(`PAGE CRASHED in batch ${idx.map(i => all[i].name).join(' | ')}`); res.fail++; res.total++; res.results.push({ suite: 'runner', phase: '', test: 'batch crashed', ok: false, err: 'renderer crash', ms: 0 }); continue; }
  res.pass += out.pass; res.fail += out.fail; res.total += out.total; res.results.push(...out.results);
  await page.close();
}
let cur = '';
for (const r of res.results) {
  if (r.suite !== cur) { cur = r.suite; console.log(`\n[${r.phase}] ${r.suite}`); }
  console.log(`  ${r.ok ? '✓' : '✗'} ${r.test}${r.ok ? '' : '  — ' + r.err}  (${r.ms}ms)`);
}
console.log(`\n${res.pass}/${res.total} passed, ${res.fail} failed`);
if (errors.length) console.log('\nPage errors:\n' + errors.slice(0, 30).join('\n'));
await browser.close();
process.exit(res.fail ? 1 : 0);
