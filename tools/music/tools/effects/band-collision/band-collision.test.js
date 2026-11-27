/* Collision (eravos.band-collision) — tests that travel with the tool. The shared contract (TH.toolContract), then its own (band-collision.spec
 * acceptance), measured offline: the split sums flat · the low band ducks on the key, the mid stays · Low mono · the duck goes out. */
TH.toolContract('eravos.band-collision');
window.__collisionWas = window.__phase; window.__phase = 'P240';
describe('Collision — the low end steps back when the key hits', () => {
  async function run(params, src, key, sec) {
    const sr = 22050, ctx = new OfflineAudioContext(2, Math.ceil(sec * sr), sr);
    const K = Kernel.create({ ctx, quiet: true, syncIR: true }); MasterTransport.create(K, { offline: true, bpm: 120 }).boot();
    const a = OrganismFactory.spawn('eravos.band-collision', { K, headless: true }), c = OrganismFactory.handle(a).ctx;
    Object.entries(Object.assign({ mix: 1, lowMono: false, lowDuck: 0, midDuck: 0 }, params)).forEach(([k, v]) => c.params.set(k, v));
    await c.ready;
    const port = (id) => K.audio.ports(a).find(x => x.id === id || x.name === id || x.label === id || (x.port && x.port === id));
    const ins = K.audio.ports(a).filter(x => x.kind === 'audio' && x.direction === 'in'), outP = K.audio.ports(a).find(x => x.kind === 'audio' && x.direction === 'out');
    const inNode = ins.find(x => x.label.toLowerCase() === 'in').node, keyNode = ins.find(x => x.label.toLowerCase() === 'key').node;
    K.audio.chain.out.gain.value = 0; outP.node.connect(ctx.destination);
    src(ctx, inNode, sr); if (key) key(ctx, keyNode, sr);
    const b = await ctx.startRendering(); return { L: b.getChannelData(0), R: b.getChannelData(1), sr };
  }
  const tone = (hz, pan, from, to) => (ctx, node) => { const o = ctx.createOscillator(); o.frequency.value = hz; const g = ctx.createGain(); g.gain.value = 0.25;
    let n = g; if (pan !== undefined) { const p = ctx.createStereoPanner(); p.pan.value = pan; g.connect(p); n = p; } o.connect(g); n.connect(node); o.start(from || 0); if (to) o.stop(to); };
  const kick = (times) => (ctx, node) => times.forEach(t => { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12);
    g.gain.setValueAtTime(0.9, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(g); g.connect(node); o.start(t); o.stop(t + 0.2); });
  const rms = (d, sr, a, b) => { let s = 0; const i0 = Math.floor(a * sr), i1 = Math.floor(b * sr); for (let i = i0; i < i1; i++) s += d[i] * d[i]; return Math.sqrt(s / (i1 - i0)); };
  const dB = (x) => 20 * Math.log10(x + 1e-12);
  it('nothing in the key, ducks 0: the split sums back flat (40 Hz, 110 Hz, 2 kHz within ± 0.1 dB)', async () => {
    for (const hz of [40, 110, 2000]) { const r = await run({ split: 110 }, tone(hz), null, 1.2), v = dB(rms(r.L, r.sr, 0.6, 1.1)), want = dB(0.25 / Math.SQRT2);
      assert.lt(Math.abs(v - want), 0.1, `${hz} Hz: ${v.toFixed(2)} dB vs ${want.toFixed(2)}`); }
  });
  it('a kick in the key: the low band falls by Low duck while it hits; the mid stays; back after Release', async () => {
    const P = { split: 110, lowDuck: 12, attack: 0.5, hold: 30, release: 60, floor: -48 };
    const lo = await run(P, tone(50), kick([0.8]), 1.8), base = rms(lo.L, lo.sr, 0.4, 0.7), hit = rms(lo.L, lo.sr, 0.82, 0.86), after = rms(lo.L, lo.sr, 1.4, 1.7);
    assert.lt(Math.abs(dB(hit / base) + 12), 2, `50 Hz on the kick: ${dB(hit / base).toFixed(1)} dB (−12)`); assert.lt(Math.abs(dB(after / base)), 0.3, `back after: ${dB(after / base).toFixed(2)} dB`);
    const mid = await run(P, tone(1500), kick([0.8]), 1.2), m0 = rms(mid.L, mid.sr, 0.4, 0.7), m1 = rms(mid.L, mid.sr, 0.82, 0.86);
    assert.lt(Math.abs(dB(m1 / m0)), 0.5, `1.5 kHz stays: ${dB(m1 / m0).toFixed(2)} dB`);
  });
  it('Low mono: a low tone hard left comes out of both sides; a high tone stays left', async () => {
    const lo = await run({ split: 150, lowMono: true }, tone(50, -1), null, 1), hi = await run({ split: 150, lowMono: true }, tone(3000, -1), null, 1);
    const lr = rms(lo.R, lo.sr, 0.5, 0.9) / rms(lo.L, lo.sr, 0.5, 0.9), hr = rms(hi.R, hi.sr, 0.5, 0.9) / rms(hi.L, hi.sr, 0.5, 0.9);
    assert.gt(lr, 0.9, `low: right/left ${lr.toFixed(2)}`); assert.lt(hr, 0.05, `high: right/left ${hr.toFixed(3)}`);
  });
  it('the duck goes out as a modulation signal any tool can take', () => {
    assert.ok(JSON.stringify(OrganismFactory.def('eravos.band-collision').hooks).includes('col.hook.duck_out'), 'declares the duck out');
  });
  it('a sound wired into the key is only listened to: it still plays where it played (a tap)', () => {
    const U = TH.universe(0.2), src = TH.spawn(U, 'eravos.ripple'), me = TH.spawn(U, 'eravos.band-collision');
    assert.ok(U.K.audio.isOnMaster(src, 'out'), 'the source is heard before'); const w = U.K.wires.register({ src: { instanceId: src, hookId: 'ripple.hook.audio_out' }, dst: { instanceId: me, hookId: 'col.hook.key_in' } });
    assert.ok(w.ok, 'wired'); assert.ok(U.K.audio.isOnMaster(src, 'out'), 'and still heard after it is wired in');
  });
});
window.__phase = window.__collisionWas;   // the next file's tests keep their own phase
