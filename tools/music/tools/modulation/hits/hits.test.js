/* Hits (eravos.hits) — the shared contract, then its own (hits.spec acceptance), measured offline. */
TH.toolContract('eravos.hits');
window.__hitsWas = window.__phase; window.__phase = 'P245';
describe('Hits — one tool\u2019s hits play another tool', () => {
  const kick = (ctx, node, t, g0) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(g0 || 0.9, t + 0.001); g.gain.exponentialRampToValueAtTime(0.001, t + 0.3); o.connect(g); g.connect(node); o.start(t); o.stop(t + 0.35); };
  async function run(params, sec, src, extra, noPulse) {
    const U = TH.universe(sec), hId = TH.spawn(U, 'eravos.hits'), c = OrganismFactory.handle(hId).ctx; Object.entries(params).forEach(([k, v]) => c.params.set(k, v)); await c.ready;
    const ports = U.K.audio.ports(hId), inN = ports.find(x => x.kind === 'audio' && x.direction === 'in').node; U.K.audio.chain.out.gain.value = 0;
    if (!noPulse) ports.find(x => x.kind === 'mod').node.connect(U.ctx.destination); src(U.ctx, inN); const more = extra ? await extra(U, hId) : null;
    const b = await TH.render(U);
    // the worklet's messages arrive after the render: wait until the count stops changing (up to 1 s), not a fixed time
    for (let k = 0, n = -1; k < 20 && c.hits.length !== n; k++) { n = c.hits.length; await TH.sleep(50); }
    return { c, d: b.getChannelData(0), sr: b.sampleRate, U, hId, more };
  }
  const times = [0.2, 0.5, 0.8, 1.1, 1.4, 1.7, 2.0, 2.3];
  it('8 kicks → 8 hits, each within 3 ms of its kick, the Pulse 1 at each', async () => {
    const r = await run({}, 2.7, (ctx, n) => times.forEach(t => kick(ctx, n, t)));
    assert.equal(r.c.hits.length, 8, 'hits: ' + r.c.hits.map(x => x.toFixed(3)).join(' '));
    r.c.hits.forEach((t, i) => assert.lt(Math.abs(t - times[i]), 0.003, `hit ${i + 1} at ${t.toFixed(4)} s (kick at ${times[i]})`));
    times.forEach(t => { let m = 0; for (let i = Math.floor(t * r.sr); i < Math.floor((t + 0.01) * r.sr); i++) m = Math.max(m, r.d[i]); assert.gt(m, 0.95, 'pulse at ' + t); });
  });
  it('a steady tone: one hit at its start, none after; Gap stops a double hit', async () => {
    const r = await run({}, 2, (ctx, n) => { const o = ctx.createOscillator(), g = ctx.createGain(); g.gain.value = 0.5; o.connect(g); g.connect(n); o.start(0.2); });
    assert.lt(r.c.hits.length, 2, 'hits: ' + r.c.hits.length);
    const d = await run({ gap: 200 }, 1, (ctx, n) => { kick(ctx, n, 0.2); kick(ctx, n, 0.25, 0.9); }); assert.equal(d.c.hits.length, 1, 'two kicks 50 ms apart with Gap 200 ms: ' + d.c.hits.length);
  });
  it('Notes wired into an instrument play it on each hit, with nothing wired to the Pulse', async () => {
    const r = await run({ note: 45, length: 0.2 }, 1.6, (ctx, n) => [0.2, 0.7, 1.2].forEach(t => kick(ctx, n, t)), async (U, hId) => {
      const rip = TH.spawn(U, 'eravos.ripple'); const rc = OrganismFactory.handle(rip).ctx; await rc.ready; const got = []; const was = rc.noteOn; rc.noteOn = (...a) => { got.push(a); return was(...a); };
      U.K.bus.subscribe('note:trigger', (p) => { if (p.target === rip) got.push(p); }, 'test'); assert.ok(U.K.wires.register({ src: { instanceId: hId, hookId: 'hit.hook.note_out' }, dst: { instanceId: rip, hookId: 'ripple.hook.note_in' } }).ok, 'Notes → Ripple'); return got; }, true);   // only Notes wired: the Pulse goes nowhere (as on the canvas)
    const notes = r.more.filter(x => x && x.note === 45 && typeof x.time === 'number'); assert.equal(notes.length, 3, 'three notes to Ripple');
    notes.forEach((x, i) => assert.lt(Math.abs(x.time - [0.2, 0.7, 1.2][i]), 0.003, 'booked at its hit: ' + x.time.toFixed(4)));
  });
  it('a sound wired into it still plays where it played (it only listens)', () => {
    const U = TH.universe(0.2), src = TH.spawn(U, 'eravos.ripple'), me = TH.spawn(U, 'eravos.hits');
    const w = U.K.wires.register({ src: { instanceId: src, hookId: 'ripple.hook.audio_out' }, dst: { instanceId: me, hookId: 'hit.hook.audio_in' } }); assert.ok(w.ok && U.K.audio.isOnMaster(src, 'out'));
  });
});
window.__phase = window.__hitsWas;
