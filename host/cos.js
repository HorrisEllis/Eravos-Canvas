/* ERAVOS host — cos.js · ERAVOS COS, the Compartment OS made for this canvas (spec eravos.host). Node built-ins only.
 * From Nexus COS: every part lives in a sealed COMPARTMENT that earns its place by passing BIRTH GATES; its state is kept
 * on disk. Made specifically ERAVOS — compartments NEST the way the project does:
 *   eravos.canvas                      the empty canvas (canvas/)            gates: boundary · scripts
 *     eravos.domain.<id>               each domain (tools/<id>/)             gates: charter · loader · listed · walls
 *       eravos.<tool>                  each tool (tools/<id>/tools/<cat>/<tool>/)   gates: manifest · shape · sealed · packs ·
 *                                                                             spec  (+ --deep: tests · sound)
 *   states  sandbox → integrated | recycled. A parent is integrated only when its own gates pass AND every compartment
 *           inside it is integrated; gating a parent gates everything inside it.
 *   archetype  the COS `eravos-canvas` archetype, generated from this repo (never a stale copy) */
'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), { spawnSync } = require('child_process');

const STATE = { SANDBOX: 'sandbox', INTEGRATED: 'integrated', RECYCLED: 'recycled' };
const TOOL_GATES = ['manifest', 'shape', 'sealed', 'packs', 'spec'], DEEP_GATES = ['tests', 'sound'];
const CANVAS_GATES = ['boundary', 'scripts'], DOMAIN_GATES = ['charter', 'loader', 'listed', 'walls'];
// the words the empty canvas must never say (the boundary test derives more from what domains register; this is its fixed list)
const DOMAIN_WORDS = ['audio', 'music', 'midi', 'bpm', 'tempo', 'reverb', 'sidechain', 'synth', 'chord', 'melody', 'drum', 'song', 'vocal', 'transport', 'AudioContext', 'Analyser', 'decodeAudioData'];
const SKIP = /(^|[\\/])(node_modules|\.git|\.eravos)([\\/]|$)/;

const rel = (root, f) => path.relative(root, f).split(path.sep).join('/');
const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
function walk(dir, out) { out = out || []; if (!fs.existsSync(dir)) return out; for (const n of fs.readdirSync(dir).sort()) { const f = path.join(dir, n); if (SKIP.test(f)) continue; const st = fs.statSync(f); if (st.isDirectory()) walk(f, out); else out.push(f); } return out; }

class Cos {
  constructor(o) { o = o || {}; this.root = path.resolve(o.root || path.join(__dirname, '..')); this.home = o.home || path.join(this.root, '.eravos', 'cos'); this.stream = o.stream || null; }
  say(type, data) { if (this.stream) this.stream.emit(type, data); }

  // ---------------------------------------------------------------- compartments
  list() {
    const out = [{ id: 'eravos.canvas', kind: 'canvas', label: 'The canvas (skeleton)', dir: 'canvas', parent: null, domain: null, category: null, version: this.canvasVersion() }];
    const td = path.join(this.root, 'tools');
    if (fs.existsSync(td)) for (const dom of fs.readdirSync(td).sort()) {
      const dd = path.join(td, dom), dj = path.join(dd, 'domain.json'); if (!fs.existsSync(dj)) continue;   // a folder of plans is not a domain yet
      let dm = {}; try { dm = readJSON(dj); } catch (e) { dm = {}; }
      const did = 'eravos.domain.' + dom;
      out.push({ id: did, kind: 'domain', label: dm.label || dom, dir: rel(this.root, dd), parent: 'eravos.canvas', domain: dom, category: null, version: dm.version || '0.0.0' });
      const tools = path.join(dd, 'tools'); if (!fs.existsSync(tools) || !fs.statSync(tools).isDirectory()) continue;
      for (const cat of fs.readdirSync(tools).sort()) {
        const cd = path.join(tools, cat); if (!fs.statSync(cd).isDirectory()) continue;
        for (const t of fs.readdirSync(cd).sort()) {
          const dir = path.join(cd, t), mf = path.join(dir, 'tool.json'); if (!fs.existsSync(mf)) continue;
          let m = {}; try { m = readJSON(mf); } catch (e) { m = { id: 'eravos.' + t, label: t, broken: e.message }; }
          out.push({ id: m.id || 'eravos.' + t, kind: 'tool', label: m.label || t, dir: rel(this.root, dir), parent: did, domain: dom, category: cat, version: m.version || '0.0.0' });
        }
      }
    }
    const st = this.state();
    return out.map(c => Object.assign(c, { state: (st[c.id] && st[c.id].state) || STATE.SANDBOX, gated: st[c.id] ? st[c.id].at : null }));
  }
  children(id) { return this.list().filter(c => c.parent === id); }
  get(id) { const l = this.list(); return l.find(c => c.id === id) || l.find(c => c.id === 'eravos.' + id) || l.find(c => c.id === 'eravos.domain.' + id) || l.find(c => c.kind === 'tool' && c.dir.endsWith('/' + id)) || null; }
  canvasVersion() { try { return (fs.readFileSync(path.join(this.root, 'canvas/kernel/kernel.js'), 'utf8').match(/KERNEL_VERSION = '([^']+)'/) || [])[1] || '?'; } catch (e) { return '?'; } }
  state() { try { return readJSON(path.join(this.home, 'state.json')); } catch (e) { return {}; } }
  saveState(st) { fs.mkdirSync(this.home, { recursive: true }); fs.writeFileSync(path.join(this.home, 'state.json'), JSON.stringify(st, null, 1)); }

  // ---------------------------------------------------------------- birth gates
  gate(id, o) {
    o = o || {}; const c = this.get(id); if (!c) throw new Error(`no compartment “${id}”`);
    const names = c.kind === 'canvas' ? CANVAS_GATES : c.kind === 'domain' ? DOMAIN_GATES : TOOL_GATES.concat(o.deep ? DEEP_GATES : []);
    this.say('cos:gate:start', { id: c.id, gates: names });
    const results = names.map(g => { let r; try { r = this['g_' + g](c); } catch (e) { r = { ok: false, why: [e.message] }; } r = Object.assign({ gate: g }, r); this.say('cos:gate:result', { id: c.id, gate: g, ok: r.ok, why: r.why || [] }); return r; });
    // nested: everything inside is gated too, and the parent is only as good as what it holds
    // (nested: false gates this one alone and judges what is inside by its last recorded state)
    const inside = o.nested === false ? this.children(c.id).map(k => ({ id: k.id, state: k.state })) : this.children(c.id).map(k => { const r = this.gate(k.id, o); return { id: r.id, state: r.state, failed: r.failed, holding: r.holding, inside: r.inside }; });
    const holding = inside.filter(k => k.state !== STATE.INTEGRATED).map(k => k.id);
    const ok = results.every(r => r.ok) && !holding.length, st = this.state();
    st[c.id] = { state: ok ? STATE.INTEGRATED : STATE.RECYCLED, at: new Date().toISOString(), deep: !!o.deep, version: c.version, failed: results.filter(r => !r.ok).map(r => ({ gate: r.gate, why: r.why })), holding };
    this.saveState(st); this.say('cos:gate:done', { id: c.id, state: st[c.id].state, failed: st[c.id].failed.map(f => f.gate), holding });
    return { id: c.id, kind: c.kind, state: st[c.id].state, results, failed: st[c.id].failed.map(f => f.gate), holding, inside };
  }

  // ---- domain gates
  domainJSON(c) { return readJSON(path.join(this.root, c.dir, 'domain.json')); }
  // charter: domain.json is whole — its id is its folder, its core files exist, its starter tools are its own
  g_charter(c) {
    const why = [], d = this.domainJSON(c), dir = path.join(this.root, c.dir);
    if (d.schema !== 'eravos.domain/1') why.push(`domain.json schema is ${d.schema}, not eravos.domain/1`);
    ['id', 'label', 'version'].forEach(k => { if (!d[k]) why.push(`domain.json has no ${k}`); });
    if (d.id && d.id !== c.domain) why.push(`id ${d.id} ≠ folder ${c.domain}`);
    (d.core || []).forEach(f => { if (!fs.existsSync(path.join(dir, f))) why.push(`core file ${f} is missing`); });
    const mine = new Set(this.children(c.id).map(k => k.id)); (d.starter || []).forEach(t => { if (!mine.has(t)) why.push(`starter ${t} is not a tool of this domain`); });
    return { ok: !why.length, why };
  }
  // loader: its index.js loads files that exist, and its generated tool list names exactly the tools in its folder
  g_loader(c) {
    const why = [], dir = path.join(this.root, c.dir), idx = path.join(dir, 'index.js');
    if (!fs.existsSync(idx)) return { ok: false, why: ['no index.js'] };
    Array.from(fs.readFileSync(idx, 'utf8').matchAll(/'([\w./-]+\.js)'/g)).map(x => x[1]).forEach(f => { if (!fs.existsSync(path.join(dir, f))) why.push(`index.js loads ${f}, which is missing`); });
    const kids = this.children(c.id);
    if (kids.length) {
      const tl = path.join(dir, 'tools', 'index.js'); if (!fs.existsSync(tl)) why.push('no tools/index.js (node build/index-tools.mjs)');
      else { const src = fs.readFileSync(tl, 'utf8'), listed = new Set(Array.from(src.matchAll(/\["(eravos\.[\w.-]+)",\[/g)).map(x => x[1]));
        kids.forEach(k => { if (!listed.has(k.id)) why.push(`tools/index.js does not load ${k.id} (node build/index-tools.mjs)`); });
        listed.forEach(id => { if (!kids.some(k => k.id === id)) why.push(`tools/index.js loads ${id}, which has no folder`); }); }
    }
    return { ok: !why.length, why };
  }
  // listed: the build ships it (tools/index.js names it)
  g_listed(c) { const src = fs.readFileSync(path.join(this.root, 'tools', 'index.js'), 'utf8'), list = (src.match(/ERAVOS_DOMAINS = \[([^\]]*)\]/) || [])[1] || ''; return list.includes(`'${c.domain}'`) ? { ok: true } : { ok: false, why: [`tools/index.js does not ship ${c.domain}`] }; }
  // walls: the domain's own code (core/, domain.js, index.js) never reaches into another domain's folder
  g_walls(c) {
    const why = [], dir = path.join(this.root, c.dir), others = this.list().filter(x => x.kind === 'domain' && x.id !== c.id).map(x => x.domain);
    walk(path.join(dir, 'core')).concat(['domain.js', 'index.js'].map(f => path.join(dir, f))).filter(f => /\.js$/.test(f) && fs.existsSync(f)).forEach(f => {
      const src = fs.readFileSync(f, 'utf8'), r = rel(this.root, f);
      if (/['"`]\.\.\//.test(src)) why.push(`${r}: a path out of its folder (../)`);
      others.forEach(o => { if (new RegExp(`['"\`/]${o}/(core|tools|data|domain)`).test(src)) why.push(`${r}: reaches into the ${o} domain`); });
    });
    return { ok: !why.length, why };
  }

  // ---- tool gates
  files(c) { const dir = path.join(this.root, c.dir); return walk(dir); }
  manifest(c) { return readJSON(path.join(this.root, c.dir, 'tool.json')); }
  // tool.json is valid and names files that exist; its id matches its folder
  g_manifest(c) {
    const why = [], m = this.manifest(c), dir = path.join(this.root, c.dir), name = path.basename(dir);
    ['id', 'version', 'label', 'domain', 'category'].forEach(k => { if (!m[k]) why.push(`tool.json has no ${k}`); });
    if (m.id && m.id !== 'eravos.' + name && m.id !== `eravos.${c.domain}.${name}`) why.push(`id ${m.id} ≠ folder ${name}`);
    if (m.domain && m.domain !== c.domain) why.push(`domain ${m.domain} ≠ folder ${c.domain}`);
    Object.entries(m.files || {}).forEach(([k, v]) => [].concat(v || []).forEach(f => { if (typeof f === 'string' && !fs.existsSync(path.join(dir, f))) why.push(`files.${k}: ${f} is missing`); }));
    return { ok: !why.length, why };
  }
  // one tool, one folder: engine, ui, spec, its own tests, packs
  g_shape(c) {
    const dir = path.join(this.root, c.dir), name = path.basename(dir), why = [];
    [['engine', `${name}.engine.js`], ['spec', `${name}.spec`], ['tests', `${name}.test.js`]].forEach(([k, f]) => { if (!fs.existsSync(path.join(dir, f))) why.push(`no ${k} (${f})`); });
    if (!fs.existsSync(path.join(dir, 'packs'))) why.push('no packs/ folder');
    return { ok: !why.length, why };
  }
  // sealed: tool code reaches nothing outside its own folder — no relative paths out, no require/import, no other tool's folder
  g_sealed(c) {
    const why = [], others = this.list().filter(x => x.kind === 'tool' && x.id !== c.id).map(x => path.basename(x.dir));
    this.files(c).filter(f => /\.js$/.test(f) && !/\.test\.js$/.test(f) && !/[\\/]packs[\\/]/.test(f)).forEach(f => {
      const src = fs.readFileSync(f, 'utf8'), r = rel(this.root, f);
      if (/['"`]\.\.\//.test(src)) why.push(`${r}: a path out of its folder (../)`);
      if (/\brequire\s*\(|^\s*import\s.+from\s/m.test(src)) why.push(`${r}: loads code itself (require/import) — tools get everything through the SDK`);
      others.forEach(o => { if (new RegExp(`/${o}/[\\w.-]+\\.js`).test(src)) why.push(`${r}: reaches into ${o}/`); });
    });
    return { ok: !why.length, why };
  }
  // the tool's real descriptor: its engine run in a sandbox where every SDK global is a stand-in that accepts anything.
  // define() is captured, so config built by helpers or loops is seen exactly as the canvas sees it.
  describe(c) {
    const m = this.manifest(c), f = path.join(this.root, c.dir, (m.files && m.files.engine) || path.basename(c.dir) + '.engine.js');
    if (!fs.existsSync(f)) return null;
    const any = () => new Proxy(function () {}, { get: (t, k) => k === Symbol.iterator ? function* () {} : k === Symbol.toPrimitive ? () => 0 : k === 'then' ? undefined : any(), apply: () => any(), construct: () => any(), has: () => true });
    let desc = null;
    const factory = { define: (d) => { desc = d; return d; }, reg: () => {}, def: () => null, defined: () => [], handle: () => null };
    const sandbox = new Proxy({ OrganismFactory: factory, console: { log() {}, warn() {}, error() {} }, Math, JSON, Object, Array, Number, String, Boolean, Map, Set, WeakMap, Symbol, Date, Float32Array, Float64Array, Uint8Array, Int16Array, Promise, Error, RegExp, isFinite, parseFloat, parseInt, Infinity, NaN, undefined },
      { has: () => true, get: (t, k) => k in t ? t[k] : (k === 'window' || k === 'globalThis' || k === 'self') ? sandbox : any() });
    try { vm.runInNewContext(fs.readFileSync(f, 'utf8'), sandbox, { timeout: 2000, filename: f }); } catch (e) { return { error: e.message }; }
    return desc;
  }
  // every preset only sets settings the tool (or the shared SDK of its domain) has
  g_packs(c) {
    const dir = path.join(this.root, c.dir), why = [], m = this.manifest(c), d = this.describe(c);
    if (!d || d.error || !Array.isArray(d.config)) return { ok: true, why: [], unchecked: (d && d.error) || 'no descriptor' };
    const keys = new Set(d.config.map(x => x && x.key).filter(k => typeof k === 'string'));
    // settings the domain's SDK adds to every tool of a kind (effect shell, slots' mods): read from the domain core
    walk(path.join(this.root, 'tools', c.domain, 'core')).filter(f => /\.js$/.test(f)).forEach(f => { for (const x of fs.readFileSync(f, 'utf8').matchAll(/\bkey:\s*'([\w.]+)'/g)) keys.add(x[1]); });
    keys.add('mods');
    let n = 0;
    walk(path.join(dir, 'packs')).filter(f => path.basename(f) === 'pack.json').forEach(f => {
      let pk; try { pk = readJSON(f); } catch (e) { why.push(`${rel(this.root, f)}: not JSON (${e.message})`); return; }
      Object.entries(pk.items || {}).forEach(([tool, kinds]) => Object.entries((kinds && kinds.presets) || {}).forEach(([name, p]) => {
        n++; if (tool !== m.id) return;
        Object.keys((p && p.params) || {}).forEach(k => { if (!keys.has(k)) why.push(`${pk.id || rel(this.root, f)} · “${name}” sets “${k}”, which ${m.label} does not have`); });
      }));
    });
    return { ok: !why.length, why: why.slice(0, 20).concat(why.length > 20 ? [`… ${why.length - 20} more`] : []), presets: n, settings: keys.size };
  }
  g_spec(c) {
    const dir = path.join(this.root, c.dir), f = path.join(dir, path.basename(dir) + '.spec');
    if (!fs.existsSync(f)) return { ok: false, why: ['no spec'] };
    const s = fs.readFileSync(f, 'utf8'); return s.includes(c.id) || s.toLowerCase().includes(c.label.toLowerCase()) ? { ok: true } : { ok: false, why: [`its spec never names ${c.id}`] };
  }
  // deep: its own tests in Chromium (the suites named after it), then the sound survey
  g_tests(c) {
    const r = spawnSync(process.execPath, [path.join(this.root, 'tests/run.mjs'), c.label], { cwd: this.root, encoding: 'utf8', timeout: 600000 });
    const out = (r.stdout || '') + (r.stderr || ''), m = out.match(/(\d+)\/(\d+) passed, (\d+) failed/);
    if (!m) return { ok: false, why: ['the test run did not finish: ' + out.trim().split('\n').slice(-3).join(' | ')] };
    return { ok: m[3] === '0' && +m[2] > 0, why: m[3] === '0' ? (+m[2] ? [] : ['no tests ran']) : out.split('\n').filter(l => /✗/.test(l)).slice(0, 10), passed: +m[1], total: +m[2] };
  }
  g_sound(c) {
    const r = spawnSync(process.execPath, [path.join(this.root, 'tests/tool-audio.mjs'), c.id], { cwd: this.root, encoding: 'utf8', timeout: 600000 });
    const out = (r.stdout || '') + (r.stderr || '');
    return { ok: r.status === 0, why: r.status === 0 ? [] : out.trim().split('\n').slice(-6) };
  }
  // the canvas: no domain words in the skeleton; every file its script list names is there
  g_boundary(c) {
    const why = [], files = walk(path.join(this.root, 'canvas/kernel')).concat(walk(path.join(this.root, 'canvas/runtime'))).concat(['canvas/index.html', 'canvas/scripts.js'].map(f => path.join(this.root, f)))
      .filter(f => /\.(js|css|html)$/.test(f) && fs.existsSync(f));
    files.forEach(f => fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => DOMAIN_WORDS.forEach(w => { if (new RegExp('\\b' + w + '\\b', 'i').test(l)) why.push(`${rel(this.root, f)}:${i + 1} says “${w}”`); })));
    return { ok: !why.length, why: why.slice(0, 20) };
  }
  g_scripts() {
    const s = fs.readFileSync(path.join(this.root, 'canvas/scripts.js'), 'utf8'), list = (s.match(/ERAVOS_SCRIPTS = \[([\s\S]*?)\]/) || [])[1] || '';
    const names = Array.from(list.matchAll(/'([^']+\.js)'/g)).map(x => x[1]), why = names.filter(n => !fs.existsSync(path.join(this.root, 'canvas', n))).map(n => `scripts.js lists ${n}, which is missing`);
    return { ok: names.length > 0 && !why.length, why };
  }

  // ---------------------------------------------------------------- the COS archetype, generated from this repo
  archetype(outDir) {
    const out = path.resolve(outDir), take = ['canvas', 'schemas', 'templates', 'build/new-tool.mjs', 'build/index-tools.mjs', 'build/validate.mjs', 'tests/harness.js', 'tests/run.html', 'serve.js', 'host'];
    let n = 0;
    take.forEach(t => { const src = path.join(this.root, t); if (!fs.existsSync(src)) return; (fs.statSync(src).isDirectory() ? walk(src) : [src]).forEach(f => { const d = path.join(out, rel(this.root, f)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(f, d); n++; }); });
    const arch = { schema: 'nexus.cos.archetype/1', name: 'eravos-canvas', label: 'ERAVOS canvas', generatedFrom: 'Eravos-Canvas', kernel: this.canvasVersion(), generatedAt: new Date().toISOString(),
      detect: { files: ['canvas/kernel/kernel.js', 'canvas/scripts.js', 'canvas/index.html'], dirs: ['tools/*/tools'] },
      compartments: { canvas: 'canvas/', domain: 'tools/<domain>/', tool: 'tools/<domain>/tools/<category>/<tool>/' },
      domains: this.list().filter(c => c.kind === 'domain').map(c => ({ id: c.id, dir: c.dir, version: c.version })), gates: { canvas: CANVAS_GATES, domain: DOMAIN_GATES, tool: TOOL_GATES, deep: DEEP_GATES },
      tools: this.list().filter(c => c.kind === 'tool').map(c => ({ id: c.id, dir: c.dir, version: c.version })) };
    fs.writeFileSync(path.join(out, 'archetype.json'), JSON.stringify(arch, null, 1));
    return { out, files: n + 1, tools: arch.tools.length };
  }
}

module.exports = { Cos, STATE, TOOL_GATES, DEEP_GATES, CANVAS_GATES, DOMAIN_GATES, DOMAIN_WORDS };
