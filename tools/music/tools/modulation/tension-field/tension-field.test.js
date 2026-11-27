/* Tension Field (eravos.tension-field) — tests that travel with the tool. The shared contract (TH.toolContract), then its own (tension-field.spec
 * acceptance), measured offline by its outputs. */
TH.toolContract('eravos.tension-field');
window.__tensionWas = window.__phase; window.__phase = 'P243';
describe('Tension Field — heard, built, released', () => {
  async function run(params, src, sec, during) {
    const sr = 22050, ctx = new OfflineAudioContext(6, Math.ceil(sec * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); const T = MasterTransport.create(K, { offline: true, bpm: 120 }); T.boot();
    const a = OrganismFactory.spawn('eravos.tension-field', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(params).forEach(([k, v]) => c.params.set(k, v)); await c.ready;
    const ports = K.audio.ports(a), inN = ports.find(x => x.kind === 'audio' && x.direction === 'in').node, out = (k) => ports.find(x => x.kind === 'mod' && x.label.toLowerCase() === k).node;
    K.audio.chain.out.gain.value = 0; const m = ctx.createChannelMerger(6); ['tension', 'release', 'loudness', 'brightness', 'density', 'motion'].forEach((k, i) => out(k).connect(m, 0, i)); m.connect(ctx.destination);
    if (src) src(ctx, inN); if (during) during(c, ctx, K);
    const b = await ctx.startRendering(); const ch = (i) => b.getChannelData(i); return { tension: ch(0), release: ch(1), loud: ch(2), sr, at: (d, t) => d[Math.floor(t * sr)] };
  }
  const tone = (amp) => (ctx, node) => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 400; g.gain.value = amp; o.connect(g); g.connect(node); o.start(0); };
  it('measure: a louder sound is heard as more tension; nothing in is 0', async () => {
    const P = { mode: 'measure', wBright: 0, wDense: 0, wMotion: 0 };
    const q = await run(P, tone(0.05), 1.2), l = await run(P, tone(0.6), 1.2), z = await run(P, null, 0.6);
    assert.gt(l.at(l.tension, 1.1), q.at(q.tension, 1.1) + 0.2, `loud ${l.at(l.tension, 1.1).toFixed(2)} vs quiet ${q.at(q.tension, 1.1).toFixed(2)}`); assert.equal(z.at(z.tension, 0.5), 0, 'nothing in → 0');
  });
  it('target: Hold 1 bar (2 s at 120), Shape 0 — half at 1 s, the peak by 2 s, then it lets go and Release fires', async () => {
    const r = await run({ mode: 'target', hold: 1, shape: 0, release: 0.2, loop: false }, null, 2.6, (c) => c.startBuild(0.0001));
    assert.near(r.at(r.tension, 1.0), 0.5, 0.02, 'half way at 1 s'); assert.gt(r.at(r.tension, 1.98), 0.97, 'the peak just before 2 s');
    assert.lt(r.at(r.tension, 2.3), 0.15, 'falling after: ' + r.at(r.tension, 2.3).toFixed(3)); let pk = 0; for (let t = 1.99; t < 2.03; t += 0.001) pk = Math.max(pk, r.at(r.release, t)); assert.gt(pk, 0.99, 'Release fires at the end of the hold: ' + pk.toFixed(3));
    assert.lt(r.at(r.release, 1.9), 1e-6, 'and not before');
  });
  it('RELEASE early (its input pushed past half): it lets go from where it was; both: never below the build', async () => {
    const r = await run({ mode: 'target', hold: 4, shape: 0, release: 0.2, loop: false }, null, 3, (c) => { c.startBuild(0.0001); c.releaseAt(2); });
    assert.near(r.at(r.tension, 1.98), 0.248, 0.02, 'a quarter of the way at 2 s (4 bars = 8 s)'); assert.lt(r.at(r.tension, 2.3), 0.05, 'let go: ' + r.at(r.tension, 2.3).toFixed(3));
    const b = await run({ mode: 'both', hold: 1, shape: 0, loop: false, wBright: 0, wDense: 0, wMotion: 0 }, tone(0.02), 1.5, (c) => c.startBuild(0.0001));
    assert.gt(b.at(b.tension, 1.0), 0.49, 'both: at least the build (½ at 1 s)');
  });
});
window.__phase = window.__tensionWas;
