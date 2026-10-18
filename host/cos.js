/* ERAVOS host — cos.js · ERAVOS COS, the Compartment OS made for this canvas (spec eravos.host). Node built-ins only.
 * From Nexus COS: every part lives in a sealed COMPARTMENT that is born in a sandbox and earns its place by passing
 * BIRTH GATES; its state is kept on disk; SNAPSHOTS freeze it and bring it back. Made specifically ERAVOS:
 *   compartments  the canvas skeleton (canvas/) + one per tool folder (tools/<domain>/tools/<category>/<tool>/)
 *   states        sandbox → integrated (every gate passed) | recycled (a gate failed — the failures are kept)
 *   gates (tool)  manifest · shape · sealed · packs · spec   + deep: tests (its own tests in Chromium) · sound (survey)
 *   gates (canvas) boundary (no domain words in the skeleton) · scripts (every runtime file it lists exists)
 *   snapshots     .eravos/cos/snapshots/<compartment>/<stamp>.json.gz — every file's path, size, sha256 AND contents
 *                 (Nexus COS keeps the manifest only; a tool folder is small, so ERAVOS keeps all of it → restore works)
 *   archetype     the COS `eravos-canvas` archetype, generated from this repo (never a stale copy) */
'use strict';
const fs = require('fs'), path = require('path'), zlib = require('zlib'), crypto = require('crypto'), vm = require('vm'), { spawnSync } = require('child_process');

const STATE = { SANDBOX: 'sandbox', INTEGRATED: 'integrated', RECYCLED: 'recycled' };
const TOOL_GATES = ['manifest', 'shape', 'sealed', 'packs', 'spec'], DEEP_GATES = ['tests', 'sound'];
const CANVAS_GATES = ['boundary', 'scripts'];
// the words the empty canvas must never say (the boundary test derives more from what domains register; this is its fixed list)
const DOMAIN_WORDS = ['audio', 'music', 'midi', 'bpm', 'tempo', 'reverb', 'sidechain', 'synth', 'chord', 'melody', 'drum', 'song', 'vocal', 'transport', 'AudioContext', 'Analyser', 'decodeAudioData'];
const SKIP = /(^|[\\/])(node_modules|\.git|\.eravos)([\\/]|$)/;

const rel = (root, f) => path.relative(root, f).split(path.sep).join('/');
const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf8'));
const sha = (buf) => crypto.createHash('sha256').update(buf).digest('hex');
function walk(dir, out) { out = out || []; if (!fs.existsSync(dir)) return out; for (const n of fs.readdirSync(dir).sort()) { const f = path.join(dir, n); if (SKIP.test(f)) continue; const st = fs.statSync(f); if (st.isDirectory()) walk(f, out); else out.push(f); } return out; }

class Cos {
  constructor(o) { o = o || {}; this.root = path.resolve(o.root || path.join(__dirname, '..')); this.home = o.home || path.join(this.root, '.eravos', 'cos'); this.stream = o.stream || null; }
  say(type, data) { if (this.stream) this.stream.emit(type, data); }

  // ---------------------------------------------------------------- compartments
  list() {
    const out = [{ id: 'eravos.canvas', kind: 'canvas', label: 'The canvas (skeleton)', dir: 'canvas', domain: null, category: null, version: this.canvasVersion() }];
    const td = path.join(this.root, 'tools');
    if (fs.existsSync(td)) for (const dom of fs.readdirSync(td).sort()) {
      const tools = path.join(td, dom, 'tools'); if (!fs.existsSync(tools) || !fs.statSync(tools).isDirectory()) continue;
      for (const cat of fs.readdirSync(tools).sort()) {
        const cd = path.join(tools, cat); if (!fs.statSync(cd).isDirectory()) continue;
        for (const t of fs.readdirSync(cd).sort()) {
          const dir = path.join(cd, t), mf = path.join(dir, 'tool.json'); if (!fs.existsSync(mf)) continue;
          let m = {}; try { m = readJSON(mf); } catch (e) { m = { id: 'eravos.' + t, label: t, broken: e.message }; }
          out.push({ id: m.id || 'eravos.' + t, kind: 'tool', label: m.label || t, dir: rel(this.root, dir), domain: dom, category: cat, version: m.version || '0.0.0' });
        }
      }
    }
    const st = this.state();
    return out.map(c => Object.assign(c, { state: (st[c.id] && st[c.id].state) || STATE.SANDBOX, gated: st[c.id] ? st[c.id].at : null }));
  }
  get(id) { return this.list().find(c => c.id === id || c.id === 'eravos.' + id || c.dir.endsWith('/' + id)) || null; }
  canvasVersion() { try { return (fs.readFileSync(path.join(this.root, 'canvas/kernel/kernel.js'), 'utf8').match(/KERNEL_VERSION = '([^']+)'/) || [])[1] || '?'; } catch (e) { return '?'; } }
  state() { try { return readJSON(path.join(this.home, 'state.json')); } catch (e) { return {}; } }
  saveState(st) { fs.mkdirSync(this.home, { recursive: true }); fs.writeFileSync(path.join(this.home, 'state.json'), JSON.stringify(st, null, 1)); }

  // ---------------------------------------------------------------- birth gates
  gate(id, o) {
    o = o || {}; const c = this.get(id); if (!c) throw new Error(`no compartment “${id}”`);
    const names = c.kind === 'canvas' ? CANVAS_GATES : TOOL_GATES.concat(o.deep ? DEEP_GATES : []);
    this.say('cos:gate:start', { id: c.id, gates: names });
    const results = names.map(g => { let r; try { r = this['g_' + g](c); } catch (e) { r = { ok: false, why: [e.message] }; } r = Object.assign({ gate: g }, r); this.say('cos:gate:result', { id: c.id, gate: g, ok: r.ok, why: r.why || [] }); return r; });
    const ok = results.every(r => r.ok), st = this.state();
    st[c.id] = { state: ok ? STATE.INTEGRATED : STATE.RECYCLED, at: new Date().toISOString(), deep: !!o.deep, version: c.version, failed: results.filter(r => !r.ok).map(r => ({ gate: r.gate, why: r.why })) };
    this.saveState(st); this.say('cos:gate:done', { id: c.id, state: st[c.id].state, failed: st[c.id].failed.map(f => f.gate) });
    return { id: c.id, state: st[c.id].state, results };
  }
  gateAll(o) { return this.list().map(c => { const r = this.gate(c.id, o); return { id: r.id, state: r.state, failed: r.results.filter(x => !x.ok).map(x => x.gate) }; }); }

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

  // ---------------------------------------------------------------- snapshots
  snapDir(c) { return path.join(this.home, 'snapshots', c.id); }
  snapshot(id, o) {
    o = o || {}; const c = this.get(id); if (!c) throw new Error(`no compartment “${id}”`);
    const files = this.files(c).map(f => { const b = fs.readFileSync(f); return { path: rel(this.root, f), size: b.length, sha256: sha(b), data: b.toString('base64') }; });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-'), snap = { schema: 'eravos.cos.snapshot/1', id: stamp, compartment: c.id, dir: c.dir, version: c.version, state: c.state, note: o.note || '', createdAt: new Date().toISOString(), files };
    fs.mkdirSync(this.snapDir(c), { recursive: true });
    const file = path.join(this.snapDir(c), stamp + '.json.gz'); fs.writeFileSync(file, zlib.gzipSync(JSON.stringify(snap)));
    this.say('cos:snapshot:taken', { id: c.id, snapshot: stamp, files: files.length });
    return { id: c.id, snapshot: stamp, files: files.length, bytes: fs.statSync(file).size };
  }
  snapshots(id) { const c = this.get(id); if (!c || !fs.existsSync(this.snapDir(c))) return []; return fs.readdirSync(this.snapDir(c)).filter(f => f.endsWith('.json.gz')).sort().map(f => f.replace(/\.json\.gz$/, '')); }
  readSnap(c, snapId) {
    const all = this.snapshots(c.id), s = snapId || all[all.length - 1]; if (!s || !all.includes(s)) throw new Error(`no snapshot ${snapId || ''} for ${c.id}`);
    return JSON.parse(zlib.gunzipSync(fs.readFileSync(path.join(this.snapDir(c), s + '.json.gz'))).toString('utf8'));
  }
  // what changed since a snapshot (the newest, if none named)
  diff(id, snapId) {
    const c = this.get(id); if (!c) throw new Error(`no compartment “${id}”`);
    const snap = this.readSnap(c, snapId), now = new Map(this.files(c).map(f => [rel(this.root, f), sha(fs.readFileSync(f))])), then = new Map(snap.files.map(f => [f.path, f.sha256]));
    return { id: c.id, snapshot: snap.id, changed: [...now.keys()].filter(p => then.has(p) && then.get(p) !== now.get(p)), added: [...now.keys()].filter(p => !then.has(p)), removed: [...then.keys()].filter(p => !now.has(p)) };
  }
  // put the snapshot's files back (and, with o.prune, remove files added since) — a snapshot of now is taken first
  restore(id, snapId, o) {
    o = o || {}; const c = this.get(id); if (!c) throw new Error(`no compartment “${id}”`);
    const snap = this.readSnap(c, snapId), base = path.join(this.root, c.dir) + path.sep;
    const before = this.snapshot(c.id, { note: 'before restoring ' + snap.id });
    snap.files.forEach(f => { const dst = path.resolve(this.root, f.path); if (!dst.startsWith(base)) throw new Error('snapshot path escapes its compartment: ' + f.path); fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, Buffer.from(f.data, 'base64')); });
    let pruned = [];
    if (o.prune) { const keep = new Set(snap.files.map(f => f.path)); pruned = this.files(c).map(f => rel(this.root, f)).filter(p => !keep.has(p)); pruned.forEach(p => fs.unlinkSync(path.join(this.root, p))); }
    this.say('cos:snapshot:restored', { id: c.id, snapshot: snap.id, files: snap.files.length, pruned: pruned.length, safety: before.snapshot });
    return { id: c.id, restored: snap.id, files: snap.files.length, pruned, safety: before.snapshot };
  }

  // ---------------------------------------------------------------- the COS archetype, generated from this repo
  archetype(outDir) {
    const out = path.resolve(outDir), take = ['canvas', 'schemas', 'templates', 'build/new-tool.mjs', 'build/index-tools.mjs', 'build/validate.mjs', 'tests/harness.js', 'tests/run.html', 'serve.js', 'host'];
    let n = 0;
    take.forEach(t => { const src = path.join(this.root, t); if (!fs.existsSync(src)) return; (fs.statSync(src).isDirectory() ? walk(src) : [src]).forEach(f => { const d = path.join(out, rel(this.root, f)); fs.mkdirSync(path.dirname(d), { recursive: true }); fs.copyFileSync(f, d); n++; }); });
    const arch = { schema: 'nexus.cos.archetype/1', name: 'eravos-canvas', label: 'ERAVOS canvas', generatedFrom: 'Eravos-Canvas', kernel: this.canvasVersion(), generatedAt: new Date().toISOString(),
      detect: { files: ['canvas/kernel/kernel.js', 'canvas/scripts.js', 'canvas/index.html'], dirs: ['tools/*/tools'] },
      compartments: { canvas: 'canvas/', tool: 'tools/<domain>/tools/<category>/<tool>/' }, gates: { canvas: CANVAS_GATES, tool: TOOL_GATES, deep: DEEP_GATES },
      tools: this.list().filter(c => c.kind === 'tool').map(c => ({ id: c.id, dir: c.dir, version: c.version })) };
    fs.writeFileSync(path.join(out, 'archetype.json'), JSON.stringify(arch, null, 1));
    return { out, files: n + 1, tools: arch.tools.length };
  }
}

module.exports = { Cos, STATE, TOOL_GATES, DEEP_GATES, CANVAS_GATES, DOMAIN_WORDS };
