/* P37 — domains first · the dataflow plane · one real tool per domain (Code Cell, AI Step, Image Adjust, Video Clip)
 * · keys you can always click. Network is never used: AI Step's provider calls are checked against a mocked fetch. */
window.__phase = 'P37';
const D = {
  ctx: (inst) => OrganismFactory.handle(inst).ctx,
  sleep: (ms) => new Promise(r => setTimeout(r, ms)),
  async until(fn, ms, what) { const t0 = performance.now(); while (performance.now() - t0 < (ms || 4000)) { const v = await fn(); if (v) return v; await D.sleep(20); } throw new Error('timed out waiting for ' + (what || 'condition')); },
  wire(U, a, ah, b, bh) { const r = U.K.wires.register({ src: { instanceId: a, hookId: ah }, dst: { instanceId: b, hookId: bh } }); if (!r.ok) throw new Error('wire failed: ' + JSON.stringify(r.fault && r.fault.message)); return r.wire_id; },
  sink(U, type) { // a receiver tool made on the fly for tests: collects what arrives on "in"
    const id = 'test.sink.' + type; if (!OrganismFactory.def(id)) OrganismFactory.define({ id, version: '1.0.0', label: 'Sink', permissions: ['bus_subscribe'], hooks: [OrganismSDK.STD.data_in('sink.hook.in', 'in', [type === 'any' ? '*' : type], 'collect')], config: [], engine(ctx) { ctx.got = []; ctx.dataIn('in', { accepts: [type === 'any' ? '*' : type] }, (v, m) => ctx.got.push({ v, m })); return {}; } });
    return TH.spawn(U, id);
  },
};

describe('P37 · domains and the dataflow plane', () => {
  it('every domain is installed and each brings a mode (the start screen lists them first)', () => {
    const ids = Kernel.domains.list().map(d => d.id);
    ['dataflow', 'music', 'video', 'image', 'agents', 'coding'].forEach(d => assert.ok(ids.includes(d), d));
    if (window.Shell && Shell.X) { const labels = Shell.X.modes().map(m => m.label); ['Music Production', 'Video Editing', 'Image Manipulation', 'AI Automation', 'Coding Environment'].forEach(l => assert.ok(labels.includes(l), l)); }
  });
  it('dataflow: a typed value goes only along the wire, a new wire gets the last value, a wrong type is refused', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.coding.code-cell'), s1 = D.sink(U, 'json'), s2 = D.sink(U, 'json');
    D.wire(U, a, 'code.hook.out', s1, 'sink.hook.in');
    U.K.data.send(a, 'out', { n: 1 }); await D.sleep(10);
    assert.equal(D.ctx(s1).got.length, 1); assert.equal(D.ctx(s2).got.length, 0, 'not a broadcast');
    D.wire(U, a, 'code.hook.out', s2, 'sink.hook.in'); await D.sleep(10);
    assert.equal(D.ctx(s2).got[0].v.n, 1, 'late wire gets the last value'); assert.ok(D.ctx(s2).got[0].m.replay);
    const n = U.K.faults.list().length; U.K.data.send(a, 'text', 42); assert.equal(U.K.faults.list().length, n + 1, 'a number on a text port is a fault');
    const t = D.sink(U, 'text'); const bad = U.K.wires.register({ src: { instanceId: a, hookId: 'code.hook.out' }, dst: { instanceId: t, hookId: 'sink.hook.in' } }); assert.ok(!bad.ok, 'json → text-only input refused');
  });
  it('dataflow: a loop between two cells is stopped and said, not run forever', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.coding.code-cell'), b = TH.spawn(U, 'eravos.coding.code-cell');
    [a, b].forEach(x => U.K.bus.publish('ui:code_edit:' + x, { code: 'return (input || 0) + 1;' }));
    D.wire(U, a, 'code.hook.out', b, 'code.hook.in'); D.wire(U, b, 'code.hook.out', a, 'code.hook.in');
    U.K.data.send(a, 'out', 0);
    await D.until(() => U.K.faults.list().some(f => /loop/.test(f.message)), 15000, 'loop guard');
  }, { timeout: 30000 });
});

describe('P37 · Code Cell', () => {
  it('runs in a sandbox: input 3 + 2 → 5 on out; a string goes on text too', async () => {
    const U = TH.universe(0.2); const c = TH.spawn(U, 'eravos.coding.code-cell'), s = D.sink(U, 'any'), st = D.sink(U, 'text');
    D.wire(U, c, 'code.hook.out', s, 'sink.hook.in'); D.wire(U, c, 'code.hook.text', st, 'sink.hook.in');
    U.K.bus.publish('ui:code_edit:' + c, { code: 'return input + 2;' });
    const feeder = TH.spawn(U, 'eravos.coding.code-cell'); D.wire(U, feeder, 'code.hook.out', c, 'code.hook.in');
    U.K.data.send(feeder, 'out', 3); await D.until(() => D.ctx(s).got.some(x => x.v === 5), 6000, 'result 5');
    U.K.bus.publish('ui:code_edit:' + c, { code: 'return "hi " + input;' }); U.K.data.send(feeder, 'out', 7);
    await D.until(() => D.ctx(st).got.some(x => x.v === 'hi 7'), 6000, 'text result');
  }, { timeout: 20000 });
  it('an endless loop is stopped at the time limit, and the next run still works', async () => {
    const U = TH.universe(0.2); const c = TH.spawn(U, 'eravos.coding.code-cell'); D.ctx(c).params.set('timeout', 300);
    U.K.bus.publish('ui:code_edit:' + c, { code: 'while (true) {}' }); const r = await D.ctx(c).run('test'); assert.equal(r.status, 'timeout');
    U.K.bus.publish('ui:code_edit:' + c, { code: 'return 1;' }); const r2 = await D.ctx(c).run('test'); assert.equal(r2.status, 'ok'); assert.equal(r2.result, 1);
  }, { timeout: 20000 });
  it('a thrown error is logged (with its line) and nothing is sent; fetch is gone while Network is off', async () => {
    const U = TH.universe(0.2); const c = TH.spawn(U, 'eravos.coding.code-cell'), s = D.sink(U, 'any'); D.wire(U, c, 'code.hook.out', s, 'sink.hook.in');
    U.K.bus.publish('ui:code_edit:' + c, { code: 'const a = 1;\nthrow new Error("boom");' }); const r = await D.ctx(c).run('test');
    assert.equal(r.status, 'error'); assert.ok(/boom/.test(D.ctx(c).internals.logs.slice(-1)[0].text)); await D.sleep(20); assert.equal(D.ctx(s).got.length, 0);
    U.K.bus.publish('ui:code_edit:' + c, { code: 'return typeof fetch;' }); const r2 = await D.ctx(c).run('test'); assert.equal(r2.result, 'undefined');
    D.ctx(c).params.set('network', true); const r3 = await D.ctx(c).run('test'); assert.equal(r3.result, 'function');
  }, { timeout: 20000 });
  it('save / restore keeps the code; the factory pack loads its code', () => {
    const U = TH.universe(0.2); const c = TH.spawn(U, 'eravos.coding.code-cell'); U.K.bus.publish('ui:code_edit:' + c, { code: 'return 42;' });
    const st = D.ctx(c).serialize(); const c2 = TH.spawn(U, 'eravos.coding.code-cell', { state: st }); assert.equal(D.ctx(c2).internals.code, 'return 42;');
    assert.ok(D.ctx(c2).presets.load('Word count')); assert.ok(/words/.test(D.ctx(c2).internals.code));
  });
});

describe('P37 · AI Step (network mocked)', () => {
  const realFetch = window.fetch;
  function mock(responses) { const calls = []; window.fetch = async (url, init) => { calls.push({ url, init, body: JSON.parse(init.body) }); const r = responses.shift(); if (r instanceof Error) throw r; return { ok: r.status < 400, status: r.status, json: async () => r.body, text: async () => JSON.stringify(r.body) }; }; return calls; }
  const restore = () => { window.fetch = realFetch; try { localStorage.removeItem('eravos.secret.eravos.agents.ai-step.key.anthropic'); } catch (e) {} };
  it('echo fills the template ({{input}}, {{input.field}}) with no network', async () => {
    const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.agents.ai-step'), s = D.sink(U, 'text'); D.wire(U, a, 'ai.hook.text', s, 'sink.hook.in');
    D.ctx(a).params.set('provider', 'echo'); U.K.bus.publish('ui:prompt_edit:' + a, { prompt: 'Hi {{input.name}} / {{input}}' });
    const f = TH.spawn(U, 'eravos.coding.code-cell'); D.wire(U, f, 'code.hook.out', a, 'ai.hook.in'); U.K.data.send(f, 'out', { name: 'Anjali' });
    await D.sleep(10); await D.ctx(a).run('test');
    assert.ok(D.ctx(s).got[0].v.startsWith('Hi Anjali / {'), D.ctx(s).got[0] && D.ctx(s).got[0].v);
  });
  it('anthropic: request shape, answer out; a 500 is retried, a 401 is not', async () => {
    try {
      localStorage.setItem('eravos.secret.eravos.agents.ai-step.key.anthropic', 'sk-test');
      const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.agents.ai-step'), s = D.sink(U, 'text'), e = D.sink(U, 'text'); D.wire(U, a, 'ai.hook.text', s, 'sink.hook.in'); D.wire(U, a, 'ai.hook.error', e, 'sink.hook.in');
      D.ctx(a).params.setMany({ retries: 1 });
      let calls = mock([{ status: 500, body: {} }, { status: 200, body: { content: [{ type: 'text', text: 'hello back' }], usage: { input_tokens: 5, output_tokens: 3 } } }]);
      const t0 = performance.now(); await D.ctx(a).run('test');
      assert.equal(calls.length, 2, 'one retry'); assert.equal(calls[0].url, 'https://api.anthropic.com/v1/messages');
      const hd = calls[0].init.headers; assert.equal(hd['x-api-key'], 'sk-test'); assert.equal(hd['anthropic-version'], '2023-06-01'); assert.equal(hd['anthropic-dangerous-direct-browser-access'], 'true');
      assert.equal(calls[0].body.model, 'claude-sonnet-5-5'); assert.ok(calls[0].body.max_tokens > 0 && calls[0].body.messages[0].role === 'user');
      assert.equal(D.ctx(s).got.slice(-1)[0].v, 'hello back');
      calls = mock([{ status: 401, body: { error: 'nope' } }]); await D.ctx(a).run('test');
      assert.equal(calls.length, 1, 'no retry on 401'); assert.ok(/key was refused/.test(D.ctx(e).got.slice(-1)[0].v));
    } finally { restore(); }
  }, { timeout: 20000 });
  it('JSON mode: fenced reply parses; a missing key triggers ONE repair request', async () => {
    try {
      localStorage.setItem('eravos.secret.eravos.agents.ai-step.key.anthropic', 'sk-test');
      const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.agents.ai-step'), j = D.sink(U, 'json'); D.wire(U, a, 'ai.hook.json', j, 'sink.hook.in');
      D.ctx(a).params.setMany({ output: 'json', requiredKeys: 'tasks', retries: 0 });
      const ok = (t) => ({ status: 200, body: { content: [{ type: 'text', text: t }], usage: {} } });
      const calls = mock([ok('```json\n{"other": 1}\n```'), ok('Sure! {"tasks": [{"task": "x"}]}')]);
      await D.ctx(a).run('test');
      assert.equal(calls.length, 2, 'one repair'); assert.ok(/could not be used/.test(calls[1].body.messages[0].content));
      assert.equal(D.ctx(j).got.slice(-1)[0].v.tasks[0].task, 'x');
    } finally { restore(); }
  }, { timeout: 20000 });
  it('the key never appears in the saved state', () => {
    try { const U = TH.universe(0.2); const a = TH.spawn(U, 'eravos.agents.ai-step'); U.K.bus.publish('ui:key_set:' + a, { key: 'sk-SECRET-123' });
      assert.ok(!JSON.stringify(D.ctx(a).serialize()).includes('sk-SECRET-123'));
      assert.equal(D.ctx(a).secret('key.anthropic').get(), 'sk-SECRET-123', 'kept through ctx.secret');
      U.K.bus.publish('ui:key_clear:' + a, {}); assert.equal(D.ctx(a).secret('key.anthropic').get(), '', 'Forget key clears it'); } finally { restore(); }
  });
});

describe('P37 · Image Adjust', () => {
  function solid(w, h, rgb) { const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'); g.fillStyle = `rgb(${rgb.join(',')})`; g.fillRect(0, 0, w, h); return c; }
  const px = (c) => Array.from(c.getContext('2d').getImageData(0, 0, 1, 1).data.slice(0, 3));
  it('exposure +1 EV doubles the light (in linear light)', () => {
    const lin = (v) => { v /= 255; return v <= 0.04045 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4); };
    const src = solid(4, 4, [118, 118, 118]), out = ImageCore.process(src, { exposure: 1 }), p = px(out);
    assert.near(lin(p[0]) / lin(118), 2, 0.04);
  });
  it('saturation −1 makes every pixel grey; rotate 90 swaps the sides; a half crop halves them', () => {
    const src = solid(40, 20, [200, 40, 90]); const g = px(ImageCore.process(src, { saturation: -1 })); assert.ok(Math.abs(g[0] - g[1]) <= 1 && Math.abs(g[1] - g[2]) <= 1, String(g));
    const r = ImageCore.process(src, { rotate: 90 }); assert.equal(r.width, 20); assert.equal(r.height, 40);
    const c = ImageCore.process(src, { crop: { x: 0.25, y: 0.25, w: 0.5, h: 0.5 } }); assert.equal(c.width, 20); assert.equal(c.height, 10);
  });
  it('a picture on the wire is adjusted, sent on at full size, and exports as PNG; stats see clipped whites', async () => {
    const U = TH.universe(0.2); const ia = TH.spawn(U, 'eravos.image.image-adjust'), out = D.sink(U, 'image'), stats = D.sink(U, 'json');
    D.wire(U, ia, 'img.hook.out', out, 'sink.hook.in'); D.wire(U, ia, 'img.hook.stats', stats, 'sink.hook.in');
    const src = D.sink(U, 'any'); // a feeder: any tool with an image out — use the kernel directly through a tiny tool
    if (!OrganismFactory.def('test.imgsrc')) OrganismFactory.define({ id: 'test.imgsrc', version: '1.0.0', label: 'Img', permissions: ['bus_publish'], hooks: [OrganismSDK.STD.data_out('i.hook.out', 'out', 'image')], config: [], engine(ctx) { ctx.send = ctx.dataOut('out', { type: 'image' }); return {}; } });
    const f = TH.spawn(U, 'test.imgsrc'); D.wire(U, f, 'i.hook.out', ia, 'img.hook.in');
    const bm = await createImageBitmap(solid(64, 32, [255, 255, 255])); D.ctx(f).send({ width: 64, height: 32, bitmap: bm });
    await D.until(() => D.ctx(out).got.length && D.ctx(stats).got.length, 4000, 'adjusted picture');
    assert.equal(D.ctx(out).got[0].v.width, 64); assert.equal(D.ctx(stats).got[0].v.clippedHighlights, 1);
    D.ctx(ia).params.set('format', 'png'); const x = await D.ctx(ia).exportBlob(); assert.equal(x.blob.type, 'image/png'); assert.equal(x.width, 64);
  }, { timeout: 15000 });
});

describe('P37 · Video Clip', () => {
  async function makeWebm(sec) { // a real WebM made here: a moving square, recorded with MediaRecorder
    const c = document.createElement('canvas'); c.width = 160; c.height = 90; const g = c.getContext('2d'), st = c.captureStream(30), mr = new MediaRecorder(st, { mimeType: 'video/webm' }), ch = [];
    mr.ondataavailable = (e) => e.data.size && ch.push(e.data); mr.start(100); const t0 = performance.now();
    await new Promise(res => { (function draw() { const t = (performance.now() - t0) / 1000; g.fillStyle = '#123'; g.fillRect(0, 0, 160, 90); g.fillStyle = '#f5a'; g.fillRect((t * 80) % 140, 30, 20, 20); if (t < sec) requestAnimationFrame(draw); else { mr.onstop = res; mr.stop(); } })(); });
    return await new Blob(ch, { type: 'video/webm' }).arrayBuffer();
  }
  it('opens a recorder WebM (no duration header), trims, plays IN → OUT, sends a frame to Image Adjust, exports the cut', async () => {
    const U = TH.universe(0.2); const vc = TH.spawn(U, 'eravos.video.video-clip'), ia = TH.spawn(U, 'eravos.image.image-adjust'), info = D.sink(U, 'json'), pic = D.sink(U, 'image');
    D.wire(U, vc, 'vid.hook.info', info, 'sink.hook.in'); D.wire(U, vc, 'vid.hook.frame', ia, 'img.hook.in'); D.wire(U, ia, 'img.hook.out', pic, 'sink.hook.in');
    const ab = await makeWebm(1.4); U.K.bus.publish('ui:open_file:' + vc, { arrayBuffer: ab, name: 'test.webm', type: 'video/webm' });
    const i0 = await D.until(() => D.ctx(info).got.slice(-1)[0], 15000, 'video info'); assert.gt(i0.v.duration, 1); assert.equal(i0.v.width, 160);
    U.K.bus.publish('ui:trim:' + vc, { in: 0.2, out: 0.7 }); D.ctx(vc).params.set('loop', false); D.ctx(vc).params.set('muted', true);
    await D.ctx(vc).internals.play(0.2); await D.until(() => D.ctx(vc).internals.video.paused, 6000, 'stops at OUT');
    assert.near(D.ctx(vc).internals.video.currentTime, 0.7, 0.12);
    await D.until(() => D.ctx(pic).got.length, 6000, 'frame through Image Adjust'); assert.equal(D.ctx(pic).got.slice(-1)[0].v.width, 160);
    const x = await D.ctx(vc).exportCut(); assert.ok(x && x.blob.size > 500, 'export bytes'); assert.ok(/webm/.test(x.blob.type));
  }, { timeout: 60000 });
});

describe('P37.3 · Sequencer lane volume', () => {
  it('each lane has its own volume: 0.5 halves its notes’ velocity, saved with the pattern; another lane is untouched', async () => {
    const U = TH.universe(1); const wob = TH.spawn(U, 'eravos.wobble-bass'), s = TH.spawn(U, 'eravos.sequencer'), c = OrganismFactory.handle(s).ctx;
    const pub = (hook, p) => U.K.bus.publish('ui:' + hook + ':' + s, p || {});
    pub('track_add', { kind: 'melodic', name: 'a', target: wob }); const a = c.internals.tracks.length - 1;
    pub('track_add', { kind: 'melodic', name: 'b', target: wob }); const bTi = c.internals.tracks.length - 1;
    [a, bTi].forEach(ti => pub('step_edit', { track: ti, step: 0, patch: { on: true, vel: 0.8, degree: ti === a ? 1 : 3 } }));
    pub('track_edit', { track: a, patch: { vol: 0.5 } });
    const got = []; U.K.bus.subscribe('note:trigger', (p) => { if (p.target === wob) got.push(p); }, 't');
    U.T.renderTicks(0, 1, 0.05); await TH.render(U);
    const vels = got.map(p => +p.velocity.toFixed(3)).sort(); assert.deepEqual(vels, [0.4, 0.8]);
    assert.equal(JSON.parse(JSON.stringify(c.saveExtra())).tracks[a].vol, 0.5);
    const n = U.K.faults.list().length; pub('track_edit', { track: a, patch: { vol: 'loud' } }); assert.equal(U.K.faults.list().length, n + 1, 'a non-number is refused');
  });
});

describe('P37.3 · Preview (▶ next to every preset)', () => {
  // catches the preview's own off-canvas instance as it starts and counts what it plays
  function spy(defId) {
    const s = { calls: [], ids: [] };
    s.un = OrganismFactory.onChange((ev, id) => { const r = OrganismFactory.handle(id); if (ev !== 'spawn' || !r || !r.ephemeral) return; s.ids.push(id);
      const c = r.ctx, a = c.audition; if (a) c.audition = (p) => { s.calls.push({ id, p }); return a(p); }; });
    return s;
  }
  it('a bass preset is heard (a riff, audible), off-canvas: not saved, not undoable, gone afterwards', async () => {
    const U = TH.universe(1.5); U.K.music.bpm = 150; const s = spy();
    const pre = Object.keys(OrganismFactory.def('eravos.reese-bass').presets)[0];
    const done = Preview.play('eravos.reese-bass', pre, { K: U.K, tailMs: 1500 });
    await D.until(() => s.calls.length >= 10 || Preview.current === null, 6000, 'the riff'); assert.equal(s.calls.length, 10, 'riff notes; faults: ' + U.K.faults.list().slice(-3).map(f => f.message).join(' | ')); const id = s.ids[0];
    assert.ok(OrganismFactory.handle(id).ephemeral && U.K.registry.get(id).descriptor.system, 'ephemeral + hidden from mixer lists');
    assert.ok(OrganismFactory.handle(id).service, 'not part of the work (saves skip it)');
    assert.equal(OrganismFactory.handle(id).ctx.currentPreset, pre, 'the preset was loaded');
    const buf = await TH.render(U); assert.ok(TH.peak(buf) > 0.02, 'audible: ' + TH.peak(buf));
    const r = await done; s.un(); assert.ok(r.ok, JSON.stringify(r)); assert.ok(!OrganismFactory.handle(id), 'closed after');
    assert.equal(Preview.current, null);
  }, { timeout: 15000 });
  it('an effect is heard on a beat + stabs played through it; Stop all ends it at once', async () => {
    const U = TH.universe(0.5); U.K.music.bpm = 150; const s = spy();
    const done = Preview.play('eravos.fx-echo', null, { K: U.K });
    await D.until(() => s.ids.length === 3 && s.calls.length > 4, 6000, 'helpers playing');
    assert.ok(U.K.wires.list().filter(w => s.ids.includes(w.src.instanceId)).length === 2, 'drums + keys wired into the effect');
    assert.ok(Preview.current && Preview.current.defId === 'eravos.fx-echo');
    U.K.silence({ hard: true }); const r = await done; s.un();
    assert.equal(r.reason, 'stopped'); s.ids.forEach(id => assert.ok(!OrganismFactory.handle(id), 'all three closed'));
    assert.equal(U.K.wires.list().filter(w => s.ids.includes(w.src.instanceId)).length, 0, 'its wires went with it');
  }, { timeout: 15000 });
  it('every preset-carrying music tool that can sound has a ▶; a new preview stops the last; buttons show ■ while playing', async () => {
    const missing = OrganismFactory.defined().filter(d => d.domain === 'music' && !d.hidden && d.presets && Object.keys(d.presets).length && (d.preview || (d.hooks || []).some(h => h.wire_type === 'audio' && h.direction === 'out') && (d.hooks || []).some(h => h.wire_type === 'audio' && h.direction === 'in')) && !Preview.can(d.id)).map(d => d.id);
    assert.equal(missing.join(','), '', 'no preview');
    const U = TH.universe(0.3); const b = Preview.button('eravos.pads', null); document.body.appendChild(b);
    const s = spy(); const one = Preview.play('eravos.pads', null, { K: U.K }); await D.until(() => s.calls.length > 8, 4000, 'kit');
    assert.equal(b.textContent, '■'); const kicks = new Set(s.calls.map(c => c.p.index)); assert.ok(kicks.size >= 3, 'kick, snare and hat pads: ' + [...kicks]);
    const two = Preview.play('eravos.supersaw', null, { K: U.K, tailMs: 0 });
    assert.equal((await one).reason, 'stopped'); assert.equal(b.textContent, '▶');
    await two; s.un(); b.remove(); assert.equal(Preview.button('eravos.coding.code-cell'), null, 'no ▶ where nothing can be previewed');
  }, { timeout: 15000 });
});
