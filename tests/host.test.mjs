// ERAVOS host — node tests/host.test.mjs : SISO, ERAVOS COS (nested compartments, gates, archetype) and ERAVOS Glass end to end
// (a real canvas in Chromium driven through the command door). Spec eravos.host.
import { createRequire } from 'module'; import fs from 'fs'; import os from 'os'; import path from 'path'; import { fileURLToPath } from 'url';
import { chromium } from '../host/driver/glass.js';   // Clear Glass's driver, not Playwright (his call, 2026-10-21)
const require = createRequire(import.meta.url), ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { Stream, Gate, check } = require('../host/siso.js'), { Cos } = require('../host/cos.js'), glass = require('../host/glass.js');
let pass = 0, fail = 0;
const ok = (c, m) => { if (!c) throw new Error(m || 'assertion failed'); };
async function it(name, fn) { try { await fn(); pass++; console.log('  ✓ ' + name); } catch (e) { fail++; console.log('  ✗ ' + name + ' — ' + e.message); } }
const tmp = (p) => fs.mkdtempSync(path.join(os.tmpdir(), p));
// a throwaway repo: the real canvas/ + the music domain holding one real tool, so gates never touch this checkout
function sandboxRepo() {
  const r = tmp('eravos-host-'), cp = (a) => fs.cpSync(path.join(ROOT, a), path.join(r, a), { recursive: true });
  ['canvas', 'tools/index.js', 'tools/music/core', 'tools/music/data', 'tools/music/content', 'tools/music/domain.js', 'tools/music/index.js', 'tools/music/tools/wubs/wub-sub'].forEach(cp);
  const dj = JSON.parse(fs.readFileSync(path.join(ROOT, 'tools/music/domain.json'), 'utf8')); dj.starter = ['eravos.wub-sub'];
  fs.writeFileSync(path.join(r, 'tools/music/domain.json'), JSON.stringify(dj));
  fs.writeFileSync(path.join(r, 'tools/music/tools/index.js'), '[["eravos.wub-sub",[["js","tools/wubs/wub-sub/wub-sub.engine.js"]]]]');
  return r;
}

console.log('\n[host] siso');
await it('one signature, one gate: a second gate for the same command is refused', () => {
  const s = new Stream(); s.gate('a.b', () => 1); let threw = false; try { s.gate('a.b', () => 2); } catch (e) { threw = /one signature, one gate/.test(e.message); } ok(threw);
  ok(s.emit('a.b') === 1, 'the gate answers'); ok(s.emit('nobody') === undefined, 'unclaimed events are kept, not answered');
  ok(s.since(1).length === 1 && s.tail(5).length === 2, 'ring');
});
await it('schemas refuse bad commands before the gate runs', () => {
  ok(check({ id: 'string', 'n?': 'number' }, { id: 'x' }) === null); ok(/missing/.test(check({ id: 'string' }, {}))); ok(/must be number/.test(check({ 'n?': 'number' }, { n: '1' })));
  const s = new Stream(); let ran = false; s.register(new Gate('x', () => { ran = true; }, { schema: { id: 'string' } }));
  let threw = false; try { s.emit('x', {}); } catch (e) { threw = e.code === 'SCHEMA'; } ok(threw && !ran);
});

console.log('\n[host] cos');
await it('compartments nest: canvas › every domain › its tools; the whole tree passes its birth gates', () => {
  const c = new Cos({ root: ROOT }); c.home = tmp('eravos-cos-');
  const list = c.list(), doms = list.filter(x => x.kind === 'domain');
  ok(list[0].id === 'eravos.canvas' && !list[0].parent, 'the canvas is the root');
  ok(doms.length >= 6 && doms.every(d => d.parent === 'eravos.canvas'), doms.map(d => d.id).join(','));
  ok(list.filter(x => x.kind === 'tool').every(t => t.parent === 'eravos.domain.' + t.domain), 'every tool sits in its domain');
  ok(!list.some(x => x.id === 'eravos.domain.ui'), 'a folder of plans (no domain.json) is not a compartment');
  const r = c.gate('eravos.canvas'); ok(r.state === 'integrated', JSON.stringify({ failed: r.failed, holding: r.holding }));
  ok(r.inside.length === doms.length && c.list().every(x => x.state === 'integrated'), 'gating the root gated everything');
});
await it('a broken tool is recycled, and says why (a preset setting the tool lacks, a path out of its folder, a missing spec)', () => {
  const r = sandboxRepo(), c = new Cos({ root: r }), dir = path.join(r, 'tools/music/tools/wubs/wub-sub');
  ok(c.gate('wub-sub').state === 'integrated', 'healthy first');
  const pk = path.join(dir, 'packs/factory/pack.json'), j = JSON.parse(fs.readFileSync(pk, 'utf8')); const first = Object.keys(j.items['eravos.wub-sub'].presets)[0];
  j.items['eravos.wub-sub'].presets[first].params.notAKnob = 1; fs.writeFileSync(pk, JSON.stringify(j));
  fs.appendFileSync(path.join(dir, 'wub-sub.engine.js'), "\nconst stray = '../sub-engine/x.js';\n"); fs.unlinkSync(path.join(dir, 'wub-sub.spec'));
  const g = c.gate('wub-sub'), why = g.results.filter(x => !x.ok).flatMap(x => x.why.map(w => x.gate + ': ' + w)).join('\n');
  ok(g.state === 'recycled', 'recycled'); ok(/packs: .*notAKnob/.test(why) && /sealed: .*\.\.\//.test(why) && /shape: no spec/.test(why), why);
  ok(c.list().find(x => x.id === 'eravos.wub-sub').state === 'recycled', 'the state is kept');
});
await it('a broken tool holds back its domain and the canvas above it; fixing it frees them', () => {
  const r = sandboxRepo(), c = new Cos({ root: r }), spec = path.join(r, 'tools/music/tools/wubs/wub-sub/wub-sub.spec'), keep = fs.readFileSync(spec);
  ok(c.gate('eravos.canvas').state === 'integrated', 'healthy first');
  fs.unlinkSync(spec); const g = c.gate('eravos.canvas');
  ok(g.state === 'recycled' && g.failed.length === 0 && g.holding.includes('eravos.domain.music'), 'canvas held back, its own gates fine: ' + JSON.stringify(g.failed));
  const m = g.inside.find(x => x.id === 'eravos.domain.music'); ok(m.state === 'recycled' && m.holding.includes('eravos.wub-sub'), 'the domain is held back by the tool');
  fs.writeFileSync(spec, keep); ok(c.gate('wub-sub').state === 'integrated' && c.gate('music').state === 'integrated', 'fixed → free');
});
await it('domain gates: a stale tool list, a domain reaching into another, a starter that is not its own', () => {
  const r = sandboxRepo(), c = new Cos({ root: r }), d = path.join(r, 'tools/music');
  fs.writeFileSync(path.join(d, 'tools/index.js'), '[["eravos.wub-sub",[]],["eravos.ghost",[]]]');
  fs.appendFileSync(path.join(d, 'domain.js'), "\nconst x = 'image/core/image-core.js';\n");
  const dj = JSON.parse(fs.readFileSync(path.join(d, 'domain.json'), 'utf8')); dj.starter.push('eravos.not-here'); fs.writeFileSync(path.join(d, 'domain.json'), JSON.stringify(dj));
  fs.mkdirSync(path.join(r, 'tools/image'), { recursive: true }); fs.writeFileSync(path.join(r, 'tools/image/domain.json'), JSON.stringify({ schema: 'eravos.domain/1', id: 'image', label: 'Image', version: '1.0.0' }));
  const g = c.gate('music', { nested: false }), why = g.results.filter(x => !x.ok).flatMap(x => x.why.map(w => x.gate + ': ' + w)).join('\n');
  ok(/loader: .*eravos\.ghost.*no folder/.test(why) && /walls: .*image domain/.test(why) && /charter: starter eravos\.not-here/.test(why), why);
});
await it('the canvas gate catches a domain word in the skeleton', () => {
  const r = sandboxRepo(), c = new Cos({ root: r }); ok(c.gate('eravos.canvas').state === 'integrated');
  fs.appendFileSync(path.join(r, 'canvas/runtime/history.js'), '\n// the tempo\n'); const g = c.gate('eravos.canvas', { nested: false });
  ok(g.state === 'recycled' && g.results[0].why.some(w => /tempo/.test(w)), JSON.stringify(g.results[0].why));
});
await it('the eravos-canvas archetype is generated from this repo (never a stale copy)', () => {
  const r = sandboxRepo(), c = new Cos({ root: r }), o = tmp('eravos-arch-'); const a = c.archetype(o), j = JSON.parse(fs.readFileSync(path.join(o, 'archetype.json'), 'utf8'));
  ok(j.name === 'eravos-canvas' && j.tools.some(t => t.id === 'eravos.wub-sub') && j.domains.some(d => d.id === 'eravos.domain.music'), 'archetype.json'); ok(fs.readFileSync(path.join(o, 'canvas/kernel/kernel.js'), 'utf8') === fs.readFileSync(path.join(r, 'canvas/kernel/kernel.js'), 'utf8'), 'the current kernel');
  ok(a.files > 20);
});

console.log('\n[host] glass');
const g = await glass.start({ root: ROOT, port: 0, data: tmp('eravos-glass-'), timeoutMs: 6000 });
const cmd = async (type, data, headers) => { const r = await fetch(g.url + 'glass/cmd', { method: 'POST', headers: Object.assign({ 'Content-Type': 'application/json', 'X-Eravos-Glass': '1' }, headers || {}), body: JSON.stringify({ type, data }) }); return Object.assign(await r.json(), { status: r.status }); };
await it('the door: health, signatures, cos commands; no header → refused; unknown command → 404; bad data → 400', async () => {
  const h = await (await fetch(g.url + 'glass/health')).json(); ok(h.app === 'eravos-glass' && h.page === false);
  const sig = await (await fetch(g.url + 'glass/signatures')).json(); ok(sig.some(s => s.type === 'canvas.set') && sig.some(s => s.type === 'cos.gate'));
  const l = await cmd('cos.list'); ok(l.ok && l.result.length >= 60 && l.result.some(x => x.kind === 'domain'));
  ok((await cmd('cos.list', {}, { 'X-Eravos-Glass': '0' })).status === 403, 'header'); ok((await cmd('nope')).status === 404); ok((await cmd('cos.gate', {})).status === 400, 'schema');
  ok((await cmd('canvas.state')).status === 409, 'no canvas open yet');
});
const b = await chromium.launch(), p = await b.newPage(), errs = [];
p.on('pageerror', e => errs.push(e.message));
await p.addInitScript(() => { window.ERAVOS_CATALOG_ALL = true; });
await p.goto(g.url + 'canvas/index.html?noboot');
await p.waitForFunction(() => window.GlassLink && window.GlassLink.active && window.OrganismFactory && OrganismFactory.defined().length > 30, null, { timeout: 30000 });
for (let i = 0; i < 50 && !(await (await fetch(g.url + 'glass/health')).json()).page; i++) await new Promise(r => setTimeout(r, 100));
await it('a canvas under Glass joins the stream; canvas.tools lists its tools', async () => {
  const t = await cmd('canvas.tools'); ok(t.ok && t.result.some(x => x.id === 'eravos.wobble-bass' && x.suite && x.presets.length > 10), JSON.stringify(t).slice(0, 200));
});
await it('driven from outside: spawn on a preset, turn knobs, wire, read the state back, close — the page shows every step', async () => {
  const seen = []; const un = g.stream.onAny(ev => { if (ev.type.startsWith('page:')) seen.push(ev.type); });
  const s = await cmd('canvas.spawn', { tool: 'eravos.wobble-bass', preset: 'Tearout Screech' }); ok(s.ok, JSON.stringify(s)); const id = s.result.instanceId;
  const v = await cmd('canvas.set', { instanceId: id, params: { cutoff: 900, rateBend: 1.5 } }); ok(v.ok && v.result.cutoff === 900 && v.result.rateBend === 1.5, JSON.stringify(v));
  ok((await cmd('canvas.set', { instanceId: id, key: 'notAKnob', value: 1 })).error.includes('no setting'), 'unknown knob refused');
  const l = await cmd('canvas.spawn', { tool: 'eravos.lfo' }); const w = await cmd('canvas.wire', { from: [l.result.instanceId, 'lfo.hook.mod_out'], to: [id, 'wobble.hook.mod_rate'] }); ok(w.ok, JSON.stringify(w));
  const st = await cmd('canvas.state'); const win = st.result.windows.find(x => x.instanceId === id);
  ok(win && win.params.cutoff === 900 && st.result.wires.some(x => x.wireId === w.result.wireId), 'state');
  ok(await p.evaluate((i) => OrganismFactory.handle(i).ctx.params.get('cutoff'), id) === 900, 'the knob really moved');
  ok((await cmd('canvas.close', { instanceId: l.result.instanceId })).ok);
  await new Promise(r => setTimeout(r, 300)); un();
  ok(seen.includes('page:opened') && seen.includes('page:wired') && seen.includes('page:closed'), seen.join(','));
});
await it('canvas.suite loads a tool’s whole suite through its 📘 page (two mods inside, three tools wired)', async () => {
  const s = await cmd('canvas.suite', { tool: 'eravos.wobble-bass' }); ok(s.ok && s.result.loaded === 5, JSON.stringify(s));
  const mods = await p.evaluate((i) => Mods.entries(i).length, s.result.instanceId); ok(mods === 2, 'two mods inside');
});
await it('suites through the door: list, open and build Wub Lab, mix in a part of another suite, load a scene, read it back', async () => {
  const l = await cmd('canvas.suites'); ok(l.ok && l.result.some(s => s.id === 'music.wub-lab') && l.result.some(s => s.id === 'music.synthesis-lab'), JSON.stringify(l).slice(0, 200));
  const o = await cmd('canvas.suite.open', { suite: 'music.wub-lab', build: true }); ok(o.ok && o.result.parts.filter(x => x.instanceId).length === 4, JSON.stringify(o).slice(0, 300));
  const a = await cmd('canvas.suite.add', { instanceId: o.result.instanceId, tool: 'eravos.syn-partials' }); ok(a.ok && a.result.parts.some(x => x.mixed && x.tool === 'eravos.syn-partials'), 'mixed in');
  const sc = await cmd('canvas.suite.scene', { instanceId: o.result.instanceId, name: 'Riddim' }); ok(sc.ok && sc.result.scene === 'Riddim', JSON.stringify(sc).slice(0, 200));
  ok((await cmd('canvas.suite.scene', { instanceId: o.result.instanceId, name: 'Nope' })).error.includes('no scene'), 'unknown scene refused');
  ok((await cmd('canvas.suite.state', { instanceId: o.result.instanceId })).result.wiring.every(w => w.on || !w.possible), 'every wire whose two ends are here is on');
});
await it('SSE: an outside listener sees commands and page events', async () => {
  const ctl = new AbortController(), r = await fetch(g.url + 'glass/events?replay=5', { signal: ctl.signal }), rd = r.body.getReader(); let txt = '';
  const t0 = Date.now(); while (Date.now() - t0 < 3000 && !txt.includes('"type"')) { const { value } = await rd.read(); txt += new TextDecoder().decode(value); }
  ctl.abort(); ok(/"type":"(page:|canvas:cmd|glass:page)/.test(txt), txt.slice(0, 200));
});
await b.close(); await g.close();
await it('no page errors', () => ok(!errs.length, errs.join('\n')));
console.log(`\n${pass}/${pass + fail} passed, ${fail} failed`); process.exitCode = fail ? 1 : 0;
