/* ERAVOS host — glass.js · ERAVOS Glass (spec eravos.host). Node built-ins only.
 * From Clear Glass, the Nexus browser: every behaviour is a GATE on a STREAM, results go out as server-sent events, and
 * an outside caller (a script, the co-pilot, later an Ollama DJ) drives it through one command door. Made for ERAVOS:
 *   serves the canvas (same folder, same fixed address as serve.js, so your saves stay where they are) and tells the page
 *   it is under Glass (window.ERAVOS_GLASS) — canvas/runtime/glass-link.js then joins the stream
 *   GET  /glass/health            { ok, app, page: is a canvas connected, clients }
 *   GET  /glass/events?replay=n   the stream as SSE (every event: { seq, type, data })
 *   GET  /glass/signatures        every command it answers
 *   POST /glass/cmd {type,data}   run a command → { ok, result } | { ok:false, error }   (header X-Eravos-Glass: 1)
 *   POST /glass/reply · /glass/emit   the page's answers and its own events (page:*)
 * Commands — canvas.* are carried to the open canvas and answered by it; cos.* run here (host/cos.js):
 *   canvas.tools · canvas.state · canvas.spawn {tool, preset?} · canvas.set {instanceId, key, value | params} ·
 *   canvas.preset {instanceId, name} · canvas.wire {from:[id,hook], to:[id,hook]} · canvas.unwire {wireId} ·
 *   canvas.close {instanceId} · canvas.suite {tool, instanceId?} ·
 *   canvas.suites · canvas.suite.open {suite, build?} · canvas.suite.build|state {instanceId} · canvas.suite.add {instanceId, tool, preset?} ·
 *   canvas.suite.scene {instanceId, name} · canvas.suite.macro {instanceId, index, value} · canvas.suite.fold {instanceId, on?}
 *   cos.list · cos.gate {id, deep?}   (gating a parent gates everything nested in it; eravos.canvas = the whole tree)
 * start({ root, port, data? }) — data: where COS keeps its state (default <root>/.eravos).
 * Loopback only. Commands need the X-Eravos-Glass header, which a web page on another site cannot send without asking
 * (and Glass never says yes), so nothing but you can drive your canvas. */
'use strict';
const http = require('http'), fs = require('fs'), path = require('path');
const { Stream } = require('./siso.js');
const { Cos } = require('./cos.js');

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.spec': 'text/plain; charset=utf-8', '.md': 'text/plain; charset=utf-8', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.gif': 'image/gif',
  '.webp': 'image/webp', '.ico': 'image/x-icon', '.wav': 'audio/wav', '.mp3': 'audio/mpeg', '.ogg': 'audio/ogg', '.flac': 'audio/flac', '.m4a': 'audio/mp4', '.mid': 'audio/midi', '.midi': 'audio/midi',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf', '.zip': 'application/zip' };
const BLOCK = /(^|[\\/])(node_modules|\.git|\.eravos)([\\/]|$)/;
const CANVAS_CMDS = {
  'canvas.tools': [{}, 'every tool this canvas has: id, label, category, its settings and presets'],
  'canvas.state': [{}, 'every window on the canvas with all its settings, and every wire'],
  'canvas.spawn': [{ tool: 'string', 'preset?': 'string' }, 'open a tool (optionally on a preset) → its instanceId'],
  'canvas.set': [{ instanceId: 'string', 'key?': 'string', 'value?': 'any', 'params?': 'object' }, 'turn a knob (key + value) or several (params)'],
  'canvas.preset': [{ instanceId: 'string', name: 'string' }, 'load a preset on a window'],
  'canvas.wire': [{ from: 'array', to: 'array' }, 'wire [instanceId, hookId] → [instanceId, hookId]'],
  'canvas.unwire': [{ wireId: 'string' }, 'remove a wire'],
  'canvas.close': [{ instanceId: 'string' }, 'close a window'],
  'canvas.suite': [{ tool: 'string', 'instanceId?': 'string' }, 'load a tool’s whole suite (its 📘 page)'],
  // 3.48 suites as systems (eravos.suites ADDENDUM 2026-10-21)
  'canvas.suites': [{}, 'every suite: its parts (tool, role, required), scenes and starter'],
  'canvas.suite.open': [{ suite: 'string', 'build?': 'boolean' }, 'open a suite’s window (build: every required part, wired, on the starter scene)'],
  'canvas.suite.build': [{ instanceId: 'string' }, 'build the whole system into a suite window'],
  'canvas.suite.add': [{ instanceId: 'string', tool: 'string', 'preset?': 'string' }, 'add one part, or mix in any tool: it joins the system wired'],
  'canvas.suite.scene': [{ instanceId: 'string', name: 'string' }, 'load a scene: sets every part of the system'],
  'canvas.suite.state': [{ instanceId: 'string' }, 'a suite window: its parts (here or not), the scene, every wire on or off'],
  'canvas.suite.macro': [{ instanceId: 'string', index: 'number', value: 'number' }, 'turn one of the suite’s macros (0…1): it moves every part it names'],
  'canvas.suite.fold': [{ instanceId: 'string', 'on?': 'boolean' }, 'fold every part window to its title bar (on: false opens them again)'],
};

function start(o) {
  o = o || {};
  const root = path.resolve(o.root || path.join(__dirname, '..')), port = o.port === undefined ? 4747 : o.port, host = o.host || '127.0.0.1';
  const stream = new Stream({ cap: 1000 });
  const cos = new Cos({ root, stream, home: path.join(o.data || path.join(root, '.eravos'), 'cos') });   // COS state (the desktop app keeps it in .appdata)
  const clients = new Set(), pages = new Set(), waiting = new Map();
  let nextId = 0;
  const timeoutMs = o.timeoutMs || 8000;

  // ---------------------------------------------------------------- the gates
  Object.entries(CANVAS_CMDS).forEach(([type, [schema, describe]]) => stream.gate(type, (ev) => relay(type, ev.data), { schema, describe }));
  stream.gate('cos.list', () => cos.list(), { describe: 'the compartment tree — canvas › domains › tools — each with its parent and state' });
  stream.gate('cos.gate', (ev) => cos.gate(ev.data.id, { deep: !!ev.data.deep }), { schema: { id: 'string', 'deep?': 'boolean' }, describe: 'run a compartment’s birth gates — and everything nested inside it (eravos.canvas = all)' });

  // a canvas command travels to the open page and waits for its answer
  function relay(type, data) {
    if (!pages.size) return Promise.reject(Object.assign(new Error('no canvas is open — open ' + url + 'canvas/ first'), { code: 'NO_PAGE' }));
    const id = 'c' + (++nextId);
    return new Promise((resolve, reject) => {
      const t = setTimeout(() => { waiting.delete(id); reject(Object.assign(new Error(`${type}: the canvas did not answer in ${timeoutMs} ms`), { code: 'TIMEOUT' })); }, timeoutMs);
      waiting.set(id, { resolve, reject, t });
      stream.emit('canvas:cmd', { id, cmd: type, data });
    });
  }

  // every event goes out to every SSE client
  const sse = (res, ev) => { try { res.write(`data: ${JSON.stringify({ seq: ev.seq, type: ev.type, data: ev.data })}\n\n`); } catch (e) {} };
  stream.onAny((ev) => clients.forEach(res => sse(res, ev)));

  // ---------------------------------------------------------------- http
  const json = (res, code, body) => { res.writeHead(code, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' }); res.end(JSON.stringify(body)); };
  const body = (req) => new Promise((resolve, reject) => { let b = ''; req.on('data', (c) => { b += c; if (b.length > 4e6) { reject(new Error('too large')); req.destroy(); } }); req.on('end', () => { try { resolve(b ? JSON.parse(b) : {}); } catch (e) { reject(new Error('not JSON')); } }); });
  async function api(req, res, p) {
    if (p === '/glass/health') return json(res, 200, { ok: true, app: 'eravos-glass', page: pages.size > 0, clients: clients.size, cos: cos.list().length });
    if (p === '/glass/signatures') return json(res, 200, stream.signatures());
    if (p === '/glass/events') {
      res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Content-Type-Options': 'nosniff' });
      res.write(': eravos glass\n\n');
      const q = new URL(req.url, 'http://x').searchParams, n = Math.min(parseInt(q.get('replay') || '0', 10) || 0, 1000), page = q.get('role') === 'page';
      if (n > 0) stream.tail(n).forEach(ev => sse(res, ev));
      clients.add(res); if (page) { pages.add(res); stream.emit('glass:page', { connected: true, pages: pages.size }); }
      const ping = setInterval(() => { try { res.write(': ping\n\n'); } catch (e) {} }, 15000);
      req.on('close', () => { clearInterval(ping); clients.delete(res); if (pages.delete(res)) stream.emit('glass:page', { connected: false, pages: pages.size }); });
      return;
    }
    if (req.method !== 'POST') return json(res, 405, { ok: false, error: 'POST only' });
    if (req.headers['x-eravos-glass'] !== '1') return json(res, 403, { ok: false, error: 'missing X-Eravos-Glass header' });
    let b; try { b = await body(req); } catch (e) { return json(res, 400, { ok: false, error: e.message }); }
    if (p === '/glass/cmd') {
      if (!b.type || typeof b.type !== 'string') return json(res, 400, { ok: false, error: 'type required' });
      if (!stream.gates.has(b.type)) return json(res, 404, { ok: false, error: `no command “${b.type}” — GET /glass/signatures lists them` });
      try { return json(res, 200, { ok: true, result: await stream.emit(b.type, b.data || {}) }); }
      catch (e) { return json(res, e.code === 'SCHEMA' ? 400 : e.code === 'NO_PAGE' ? 409 : e.code === 'TIMEOUT' ? 504 : 500, { ok: false, error: e.message }); }
    }
    if (p === '/glass/reply') {
      const w = waiting.get(b.id); if (!w) return json(res, 404, { ok: false, error: 'nothing waits for ' + b.id });
      waiting.delete(b.id); clearTimeout(w.t);
      if (b.ok) w.resolve(b.result); else w.reject(new Error(b.error || 'the canvas refused'));
      return json(res, 200, { ok: true });
    }
    if (p === '/glass/emit') {
      if (!/^page:[\w:.-]+$/.test(String(b.type || ''))) return json(res, 400, { ok: false, error: 'the page emits page:* events only' });
      stream.emit(b.type, b.data || {}); return json(res, 200, { ok: true });
    }
    return json(res, 404, { ok: false, error: 'no such door' });
  }
  function serveFile(req, res, rel) {
    if (req.method !== 'GET' && req.method !== 'HEAD') return json(res, 405, { ok: false, error: 'method not allowed' });
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.resolve(root, '.' + rel);
    if (file !== root && !file.startsWith(root + path.sep)) return json(res, 403, { ok: false, error: 'forbidden' });
    if (BLOCK.test(path.relative(root, file))) return json(res, 404, { ok: false, error: 'not found' });
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) return json(res, 404, { ok: false, error: 'not found: ' + rel });
      const type = TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream';
      // the canvas page learns it is under Glass before any script runs
      if (type.startsWith('text/html')) {
        let html = fs.readFileSync(file, 'utf8');
        if (/<head[^>]*>/i.test(html)) html = html.replace(/<head[^>]*>/i, (m) => m + `<script>window.ERAVOS_GLASS={events:'/glass/events',version:1};</script>`);
        res.writeHead(200, { 'Content-Type': type, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' }); return res.end(req.method === 'HEAD' ? undefined : html);
      }
      res.writeHead(200, { 'Content-Type': type, 'Content-Length': st.size, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
      if (req.method === 'HEAD') return res.end();
      fs.createReadStream(file).on('error', () => res.destroy()).pipe(res);
    });
  }
  const handler = (req, res) => {
    let p; try { p = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch (e) { return json(res, 400, { ok: false, error: 'bad request' }); }
    if (p.startsWith('/glass/')) return api(req, res, p).catch(e => json(res, 500, { ok: false, error: e.message }));
    serveFile(req, res, p);
  };
  // the first host must listen (its error rejects); the others (o.also, e.g. ::1 — "localhost" is IPv6 on some machines)
  // join on the same port when they can and are skipped quietly when they can't
  const server = http.createServer(handler), extra = [];
  let url = '';
  const ready = new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, host, () => { url = `http://${host === '127.0.0.1' ? 'localhost' : host}:${server.address().port}/`; resolve(); }); })
    .then(() => Promise.all((o.also || []).map(h2 => new Promise((res) => { const s2 = http.createServer(handler); s2.once('error', () => res()); s2.listen(server.address().port, h2, () => { extra.push(s2); res(); }); }))));
  return ready.then(() => ({
    url, port: server.address().port, stream, cos, server, also: extra.length,
    close: () => new Promise(r => { clients.forEach(c => { try { c.end(); } catch (e) {} }); waiting.forEach(w => { clearTimeout(w.t); w.reject(new Error('Glass closed')); }); extra.forEach(x => x.close()); server.close(() => r()); }),
  }));
}

module.exports = { start, CANVAS_CMDS };
